"""SUPERSEDED -- DO NOT RUN. Kept for the reasoning below; the fix now lives in the build.

C:\\MHGU-Extract\\fix-skin-weights.py replaces this, and buildlib.mod_to_gltf runs it, so the
crumb cannot come back on a rebuild. That script reads the weights MT actually stored -- w0 from
the u16 at byte 6, w1/w2 from the half2 after the UV -- instead of recognising the leak by its
SIZE, so it repairs every format and every monster rather than the three Fatalis, and it leaves
a slot at zero because the ROM says zero rather than because the number was small.

This script is also mildly harmful now: it renormalised in floating point and requantised, which
left 123 of em013_00's 5,944 weight rows summing to 254 or 256 instead of 255. fix-skin-weights
repaired those.

Zero the weight our conversion leaks into MT's PADDING joint slots, and renormalise.

Raven, 2026-09-12, on Crimson Fatalis: "Something is shifting Crimson's neck over", "it is likely
shifting only part of the head", and from two tabs at the same pose, "Crimson feels shifted to the
left".

WHAT THE ROM DOES. MT fills a vertex's unused joint slots by REPEATING an index, and gives the
repeats no weight. Straight out of the .mod, Crimson's head mesh (#19, 867 verts, format
14d40022, joint lanes at bytes 16..19):

    v0    joints [22, 55, 55, 55]      one real influence, three padding slots
    byte16: 22 x548, 23 x255, 21 x48, 19 x16      <- the real lane
    byte17: 55 x595 ...   byte18: 55 x815 ...   byte19: 55 x841

Fatalis's equivalent mesh (#26) is the same shape with 27 as the filler instead of 55.

WHAT WE SHIP. The converter collapses the repeated slots into one and hands it the normalisation
remainder -- 0.0078 to 0.0118. That would be harmless if the filler were a nearby bone. It is not:

    crimson  filler local 55 = gid 143   22.0 units from the head   465-499 visible head verts
    fatalis  filler local 27 = gid 13     7.1 units from the head   474-508

The skeletons are identical, so gid 143 sits 22 units away on BOTH -- Crimson simply binds the far
bone where Fatalis binds the near one. And gid 143 is in the tail chain, which swings 21.7 units
relative to the head during the very clip Raven captured. So a leak of 0.0078 on a bone that far
drags Crimson's whole head and neck, and barely touches Fatalis's. That is the shift.

THE RULE, taken from the .mod rather than from the symptom: per mesh, the padding index is the one
MT repeats in the trailing joint lane. Any influence on that index whose weight is at or below the
leak quantum is the converter's remainder and is removed; a genuinely large influence on the same
bone is left alone, so a mesh that really does bind it is untouched. Weights are renormalised.

An earlier version of this script only cleaned Group[1]#0 / Group[10]#0 -- two meshes that are not
even drawn -- because I measured a divergence there without first checking visibility. That was
the wrong scope and this replaces it.

THE DEFECT IS THE CONVERTER'S AND IT IS LIBRARY-WIDE. The real fix belongs in
fix-skin-influences.py; this repairs shipped models so the Fatalis line can be judged first.

    python dev/fix-padding-influence.py                 # report
    python dev/fix-padding-influence.py --write
"""
import argparse
import collections
import glob
import json
import os
import struct

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, '..', 'docs')
EXTRACT = r'C:\MHGU-Extract'
MODELS = ['em013_00', 'em013_01', 'em013_02']
LEAK_MAX = 0.02          # the remainder is 2..3 /255; a real influence is far above this
CT = {5121: (np.uint8, 1, 255.0), 5123: (np.uint16, 2, 65535.0), 5126: (np.float32, 4, None)}


def mod_padding_indices(mon):
    """The filler index per mesh, read from the .mod's trailing joint lane."""
    c = glob.glob(os.path.join(EXTRACT, 'scratch-em', mon, '**', mon + '.mod'), recursive=True)
    if not c:
        return None
    d = open(c[0], 'rb').read()
    n = struct.unpack_from('<H', d, 8)[0]
    mesh_off = struct.unpack_from('<I', d, 0x30)[0]
    vtx_off = struct.unpack_from('<I', d, 0x34)[0]
    out, base = {}, vtx_off
    for i in range(n):
        b = mesh_off + i * 48
        cnt = struct.unpack_from('<H', d, b + 2)[0]
        stride = d[b + 0x0A]
        # joints occupy the four bytes ending the skin block; the trailing one is pure filler
        if stride >= 20 and cnt:
            lane = collections.Counter(d[base + v * stride + 19] for v in range(cnt)) \
                if stride >= 20 else collections.Counter()
            if lane:
                out[(cnt, i)] = lane.most_common(1)[0][0]
        base += cnt * stride
    return out


def load(path):
    b = bytearray(open(path, 'rb').read())
    off, js, bin_off = 12, None, None
    while off < len(b):
        ln, ty = struct.unpack_from('<II', b, off)
        if ty == 0x4E4F534A:
            js = json.loads(bytes(b[off + 8:off + 8 + ln]).decode('utf-8'))
        elif ty == 0x004E4942:
            bin_off = off + 8
        off += 8 + ln
    return b, js, bin_off


def acc_view(js, b, bin_off, i):
    a = js['accessors'][i]
    dt, sz, norm = CT[a['componentType']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    bv = js['bufferViews'][a['bufferView']]
    base = bin_off + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or sz * n
    cnt = a['count']
    vals = np.zeros((cnt, n), dtype=np.float64)
    for r in range(cnt):
        vals[r] = np.frombuffer(bytes(b[base + r * stride: base + r * stride + sz * n]), dtype=dt)
    if norm and a.get('normalized'):
        vals = vals / norm

    def write(nv):
        for r in range(cnt):
            v = nv[r]
            if norm and a.get('normalized'):
                v = np.clip(np.round(v * norm), 0, norm)
            b[base + r * stride: base + r * stride + sz * n] = np.asarray(v, dtype=dt).tobytes()
    return vals, write


def fix(mon, write):
    path = os.path.join(DOCS, 'models', 'monsters', mon + '.glb')
    pad = mod_padding_indices(mon) or {}
    bycount = {}
    for (cnt, i), idx in pad.items():
        bycount.setdefault(cnt, []).append(idx)
    b, js, bin_off = load(path)
    joints = js['skins'][0]['joints']
    removed = 0
    for nd in js['nodes']:
        if 'mesh' not in nd:
            continue
        for pr in js['meshes'][nd['mesh']]['primitives']:
            at = pr['attributes']
            if 'JOINTS_0' not in at:
                continue
            J, _ = acc_view(js, b, bin_off, at['JOINTS_0'])
            W, wwrite = acc_view(js, b, bin_off, at['WEIGHTS_0'])
            J = J.astype(int)
            cands = set(bycount.get(len(W), []))
            if not cands:
                continue
            changed = False
            for r in range(len(W)):
                for c in range(W.shape[1]):
                    if 0 < W[r, c] <= LEAK_MAX and J[r, c] in cands:
                        W[r, c] = 0.0
                        removed += 1
                        changed = True
                s = W[r].sum()
                if s > 0:
                    W[r] /= s
            if changed and write:
                wwrite(W)
    if write and removed:
        open(path, 'wb').write(bytes(b))
    return removed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--models', nargs='*', default=MODELS)
    args = ap.parse_args()
    for mon in args.models:
        n = fix(mon, args.write)
        print('%-12s padding influences %s: %d' % (mon, 'REMOVED' if args.write else 'found', n))
    if not args.write:
        print('\n(report only -- pass --write to apply)')


if __name__ == '__main__':
    main()
