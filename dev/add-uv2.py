"""Put the MOD's real SECOND UV SET into the exported glTF's TEXCOORD_1.

`mod_to_gltf` (revil_toolset) writes a TEXCOORD_1 that is ALL ZEROS on most monsters, and the
ROM's two-map albedo -- FAlbedoTypeExtendModulate / TypeExtendAdd / MapBlend, which samples its
second map through UVExtend -- then reads one corner texel across a whole mesh. The modulate
collapses to a constant tint, which is Raven's "the albedo layer shows like before, nothing over
it; so no veins" on Tigrex, and the same fault on Khezu's charged veins.

WHY THE TOOL GETS IT WRONG, measured 2026-09-10. A MOD mesh record is 48 bytes with the vertex
count at +0x02, the vertex stride at +0x0a and a vertex-format id at +0x14; the record layout is
self-checking, because sum(count * stride) equals the vertex-buffer size at +0x18 exactly on every
model tried. Reading the byte lanes of each format across a mesh's vertices shows three of them
carry an EIGHT-BYTE ALWAYS-ZERO FIELD sitting between the two UVs:

    fmt 64593025  stride 40   uv0 @20   dead @28..35   uv1 @36
    fmt b3921020  stride 36             dead @24..31   uv1 @32
    fmt d877801b  stride 32             dead @20..27   uv1 @28
    fmt 14d40022  stride 28   no dead field -- and THIS one exports correctly (Glavenus)

So the tool takes TEXCOORD_1 from eight bytes after TEXCOORD_0, which is right for 14d40022 and
lands on the dead field for the other three. The real second UV is the LAST FOUR BYTES of the
vertex, as two halfs. Confirmed against the GLB on Khezu: the MOD's @20 half2 reproduces
TEXCOORD_0 exactly, @28 reproduces the exported zeros, and @36 holds a well-formed UV in [0,1]
that the export never carries.

WHAT THIS SCRIPT DOES NOT DO: invent anything. A primitive is only touched when its exported
TEXCOORD_1 is entirely zero AND a MOD mesh is matched to it by its TEXCOORD_0 values, so the
pairing is proved rather than assumed. Anything unmatched is reported and left alone.
"""
import argparse
import json
import os
import struct
import sys

import buildlib

MOD_DEAD_FIELD = {0x64593025, 0xb3921020, 0xd877801b}
HALF = struct.Struct("<ee")
F2 = struct.Struct("<ff")


def mod_meshes(path):
    """[{count, stride, fmt, start}] in file order, with `start` the vertex-data offset."""
    d = open(path, "rb").read()
    if d[:4] != b"MOD\0":
        return None, None
    n = struct.unpack_from("<H", d, 8)[0]
    mesh_off = struct.unpack_from("<I", d, 0x30)[0]
    vtx_off = struct.unpack_from("<I", d, 0x34)[0]
    out, base = [], vtx_off
    for i in range(n):
        b = mesh_off + i * 48
        cnt = struct.unpack_from("<H", d, b + 2)[0]
        stride = d[b + 0x0A]
        fmt = struct.unpack_from("<I", d, b + 0x14)[0]
        out.append({"i": i, "count": cnt, "stride": stride, "fmt": fmt, "start": base})
        base += cnt * stride
    # the self-check that locked this layout: the strides must account for the whole buffer
    if base - vtx_off != struct.unpack_from("<I", d, 0x18)[0]:
        return None, None
    return d, out


def lane(d, m, off, k):
    return HALF.unpack_from(d, m["start"] + k * m["stride"] + off)


def glb_read(path):
    raw = bytearray(open(path, "rb").read())
    if bytes(raw[:4]) != b"glTF":
        return None
    jlen = struct.unpack_from("<I", raw, 12)[0]
    js = json.loads(bytes(raw[20:20 + jlen]).decode("utf-8"))
    bin_off = 20 + jlen + 8
    return raw, js, bin_off


def acc_span(js, bin_off, ai):
    ac = js["accessors"][ai]
    bv = js["bufferViews"][ac["bufferView"]]
    base = bin_off + bv.get("byteOffset", 0) + ac.get("byteOffset", 0)
    stride = bv.get("byteStride") or 8
    return base, stride, ac["count"], ac["componentType"]


def patch(mod_path, glb_path, apply_it):
    d, meshes = mod_meshes(mod_path)
    if d is None:
        return ("mod unreadable or the stride check failed", 0, 0, 0)
    got = glb_read(glb_path)
    if not got:
        return ("glb unreadable", 0, 0, 0)
    raw, js, bin_off = got

    prims = []
    for mesh in js.get("meshes", []):
        for pr in mesh.get("primitives", []):
            a = pr["attributes"]
            if "TEXCOORD_0" in a and "TEXCOORD_1" in a:
                prims.append((a["TEXCOORD_0"], a["TEXCOORD_1"]))

    done = skipped = unmatched = 0
    used = set()
    for a0, a1 in prims:
        b1, s1, n1, ct1 = acc_span(js, bin_off, a1)
        if ct1 != 5126:                                   # only the float form is written here
            skipped += 1
            continue
        if any(F2.unpack_from(raw, b1 + k * s1) != (0.0, 0.0) for k in range(min(n1, 64))):
            skipped += 1                                   # already carries a real second UV
            continue
        b0, s0, n0, _ = acc_span(js, bin_off, a0)
        want = [F2.unpack_from(raw, b0 + k * s0) for k in range(min(n0, 8))]

        hit = None
        for m in meshes:
            if m["count"] != n1 or m["i"] in used or m["stride"] < 12:
                continue
            for off in range(0, m["stride"] - 3, 2):       # find the lane that IS TEXCOORD_0
                ok = True
                for k, w in enumerate(want):
                    v = lane(d, m, off, k)
                    if abs(v[0] - w[0]) > 2e-3 or abs(v[1] - w[1]) > 2e-3:
                        ok = False
                        break
                if ok:
                    hit = (m, off)
                    break
            if hit:
                break
        if not hit:
            unmatched += 1
            continue
        m, uv0_off = hit
        if m["fmt"] not in MOD_DEAD_FIELD:
            skipped += 1                                   # no dead field: the tool was right
            continue
        used.add(m["i"])
        uv1_off = m["stride"] - 4                          # the real second UV is the tail
        for k in range(n1):
            u, v = lane(d, m, uv1_off, k)
            F2.pack_into(raw, b1 + k * s1, u, v)
        done += 1

    if apply_it and done:
        tmp = glb_path + ".part"
        open(tmp, "wb").write(bytes(raw))
        os.replace(tmp, glb_path)
    return (None, done, skipped, unmatched)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="MHGU-Monster-Viewer")
    ap.add_argument("--apply", action="store_true", help="write the GLBs (otherwise report only)")
    ap.add_argument("--only", default=None, help="one monster id, e.g. em032_00")
    args = ap.parse_args()
    buildlib.use_repo(args.repo)
    glb_dir = os.path.join(buildlib.DOCS, "models", "monsters")
    scratch = os.path.join(buildlib.ROOT, "scratch-em")

    tot = tdone = tskip = tunm = 0
    missing = []
    for fn in sorted(os.listdir(glb_dir)):
        if not fn.endswith(".glb"):
            continue
        stem = fn[:-4]
        mon = stem.split("_tail")[0].split("_head")[0]
        if args.only and mon != args.only:
            continue
        cls = mon[:5] if mon.startswith("ems") else mon[:5]
        mod = os.path.join(scratch, mon, "enemy", mon[:len(mon) - 3].rstrip("_"),
                           mon, "mod", stem + ".mod")
        if not os.path.isfile(mod):
            missing.append(stem)
            continue
        err, done, skip, unm = patch(mod, os.path.join(glb_dir, fn), args.apply)
        tot += 1
        if err:
            print("  %-24s %s" % (stem, err))
            continue
        tdone += done
        tskip += skip
        tunm += unm
        if done or unm:
            print("  %-24s patched=%-4d left alone=%-4d UNMATCHED=%d" % (stem, done, skip, unm))
    print()
    print("models examined      : %d" % tot)
    print("primitives patched   : %d" % tdone)
    print("primitives left alone: %d" % tskip)
    print("primitives UNMATCHED : %d" % tunm)
    if missing:
        print("no .mod found for %d model(s), e.g. %s" % (len(missing), ", ".join(missing[:5])))
    if not args.apply:
        print()
        print("REPORT ONLY -- pass --apply to write the GLBs.")


if __name__ == "__main__":
    main()
