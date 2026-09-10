"""Solve for the MOD's skin lanes by matching a MOD mesh to its GLB primitive and brute-forcing.

Guessing at byte lanes is how you end up with a plausible mapping that is wrong -- the exact failure
mode the memory note names. So instead: pair a MOD mesh with the GLB primitive it became (same
vertex count, and positions that agree once dequantised), then search every offset and encoding for
the one that REPRODUCES the GLB's JOINTS_0/WEIGHTS_0. A lane is only accepted if it matches on
essentially every vertex of every mesh in that format.

Once the lanes are known, the question this whole thread has been building to becomes answerable:
at a seam, does the .mod give both copies the same binding? If it does, our export broke it and the
fix is ours.
"""
import collections
import json
import struct
import sys

import numpy as np

CT = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load_glb(path):
    raw = open(path, 'rb').read()
    jlen = struct.unpack_from('<I', raw, 12)[0]
    return raw, json.loads(raw[20:20 + jlen].decode('utf-8')), 20 + jlen + 8


def acc(raw, js, binoff, ai, denorm=True):
    a = js['accessors'][ai]
    n, ncomp = a['count'], NC[a['type']]
    fmt, sz = CT[a['componentType']]
    bv = js['bufferViews'][a['bufferView']]
    base = binoff + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or (sz * ncomp)
    rows = [struct.unpack_from('<' + fmt * ncomp, raw, base + k * stride) for k in range(n)]
    arr = np.array(rows, dtype=np.float64 if fmt == 'f' else np.int64)
    if denorm and a.get('normalized'):
        div = {'b': 127.0, 'B': 255.0, 'h': 32767.0, 'H': 65535.0}.get(fmt)
        if div:
            arr = arr / div
    return arr


def mod_meshes(path):
    d = open(path, 'rb').read()
    assert d[:4] == b'MOD\0'
    n = struct.unpack_from('<H', d, 8)[0]
    mesh_off = struct.unpack_from('<I', d, 0x30)[0]
    vtx_off = struct.unpack_from('<I', d, 0x34)[0]
    out, base = [], vtx_off
    for i in range(n):
        b = mesh_off + i * 48
        cnt = struct.unpack_from('<H', d, b + 2)[0]
        st = d[b + 0x0A]
        fmt = struct.unpack_from('<I', d, b + 0x14)[0]
        out.append({'i': i, 'count': cnt, 'stride': st, 'fmt': fmt, 'start': base, 'rec': b})
        base += cnt * st
    assert base - vtx_off == struct.unpack_from('<I', d, 0x18)[0], 'stride self-check failed'
    return d, out


def main(mod_path, glb_path):
    d, ms = mod_meshes(mod_path)
    raw, js, binoff = load_glb(glb_path)

    prims = []
    for mi, mesh in enumerate(js.get('meshes', [])):
        for pi, pr in enumerate(mesh.get('primitives', [])):
            a = pr['attributes']
            if not all(k in a for k in ('POSITION', 'JOINTS_0', 'WEIGHTS_0')):
                continue
            prims.append({'name': (mesh.get('name') or 'm%d' % mi) + '#' + str(pi),
                          'pos': acc(raw, js, binoff, a['POSITION']),
                          'j': acc(raw, js, binoff, a['JOINTS_0'], False).astype(int),
                          'w': acc(raw, js, binoff, a['WEIGHTS_0'], False).astype(float)})

    # pair MOD mesh <-> GLB primitive on dequantised position
    pairs, used = [], set()
    for m in ms:
        cands = [p for k, p in enumerate(prims) if len(p['pos']) == m['count'] and k not in used]
        if not cands:
            continue
        mp = np.array([struct.unpack_from('<3h', d, m['start'] + k * m['stride'])
                       for k in range(m['count'])], dtype=np.float64) / 32767.0
        for p in cands:
            if np.abs(mp - p['pos'][:, :3]).max() < 2e-3:
                pairs.append((m, p))
                used.add(prims.index(p))
                break
    print('MOD meshes %d, GLB skinned primitives %d, PAIRED %d' % (len(ms), len(prims), len(pairs)))
    if not pairs:
        return

    # brute force: which byte offsets reproduce the GLB weights / joints?
    byfmt = collections.defaultdict(list)
    for m, p in pairs:
        byfmt[(m['fmt'], m['stride'])].append((m, p))

    for (fmt, stride), group in sorted(byfmt.items(), key=lambda kv: -len(kv[1])):
        print()
        print('fmt %08x stride %2d  (%d paired meshes)' % (fmt, stride, len(group)))
        # joints: 4 consecutive bytes equal to GLB JOINTS_0 (allowing a per-mesh remap table later)
        jhit = []
        for off in range(stride - 3):
            ok = tot = 0
            for m, p in group:
                for k in range(min(m['count'], 200)):
                    v = d[m['start'] + k * stride + off: m['start'] + k * stride + off + 4]
                    tot += 1
                    if list(v) == list(p['j'][k]):
                        ok += 1
            if tot and ok / tot > 0.98:
                jhit.append((off, ok / tot))
        for off, f in jhit:
            print('   JOINTS_0 reproduced by bytes %2d..%-2d  (%.1f%% of vertices)' % (off, off + 3, 100 * f))

        # weights: try byte quads (u8/255) and the position's 4th short as w0
        whit = []
        for off in range(stride - 3):
            ok = tot = 0
            for m, p in group:
                for k in range(min(m['count'], 200)):
                    base = m['start'] + k * stride + off
                    v = np.array(list(d[base:base + 4]), dtype=float)
                    tot += 1
                    if np.abs(v - p['w'][k]).max() < 1.5:
                        ok += 1
            if tot and ok / tot > 0.98:
                whit.append((off, ok / tot, 'u8 raw'))
        for off, f, how in whit:
            print('   WEIGHTS_0 reproduced by bytes %2d..%-2d as %s (%.1f%%)' % (off, off + 3, how, 100 * f))
        if not jhit:
            m, p = group[0]
            print('   no direct joint lane; first GLB joints vs MOD bytes 16..19 / 8..11:')
            for k in range(3):
                b = m['start'] + k * stride
                print('      glb j=%-16s w=%-20s  mod16..19=%s  mod8..11=%s  pos4=%s'
                      % (list(p['j'][k]), [int(x) for x in p['w'][k]],
                         list(d[b + 16:b + 20]), list(d[b + 8:b + 12]),
                         struct.unpack_from('<4h', d, b)))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
