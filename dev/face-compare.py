"""Cross-reference two monster models mesh by mesh, for a region given in model Z.

Raven, 2026-09-11, on Crimson Fatalis's snout: "Cross reference Crimson's model data with normal
Fatalis. They will defer to some ways, but their faces in the distorted region should be similar."
The sibling is the control: where the two agree the geometry is fine, and where they diverge is
where to look.

Reports, per primitive that reaches into the region: vertex count, the x range and its offset from
the model's own midline, and the joints its vertices are bound to. Positions are the raw quantised
shorts, which is the bind pose exactly -- every skin matrix is identity there -- so a difference is
geometry or binding and never animation.

    python dev/face-compare.py em013_01 em013_00 --z 27000
"""
import argparse
import json
import os
import struct
import collections

import numpy as np

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs')
CT = {5120: (np.int8, 1), 5121: (np.uint8, 1), 5122: (np.int16, 2),
      5123: (np.uint16, 2), 5125: (np.uint32, 4), 5126: (np.float32, 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load(mon):
    p = os.path.join(DOCS, 'models', 'monsters', mon + '.glb')
    b = open(p, 'rb').read(); off = 12; js = None; bn = None
    while off < len(b):
        ln, ty = struct.unpack_from('<II', b, off); off += 8
        ch = b[off:off + ln]; off += ln
        if ty == 0x4E4F534A: js = json.loads(ch.decode('utf-8'))
        elif ty == 0x004E4942: bn = ch
    return js, bn


def acc(js, bn, i):
    a = js['accessors'][i]; dt, sz = CT[a['componentType']]; n = NC[a['type']]
    bv = js['bufferViews'][a['bufferView']]
    base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or sz * n
    cnt = a['count']
    if stride == sz * n:
        return np.frombuffer(bn, dtype=dt, count=cnt * n, offset=base).reshape(cnt, n).astype(np.float64)
    buf = np.frombuffer(bn, dtype=np.uint8, count=stride * cnt, offset=base).reshape(cnt, stride)
    return buf[:, :sz * n].copy().view(dt).reshape(cnt, n).astype(np.float64)


def bone(n):
    s = n.get('name', '')
    if ':' in s: s = s.split(':', 1)[1]
    return s[:-2] if s.endswith('_s') else s


def survey(mon, zmin):
    js, bn = load(mon)
    jn = [bone(js['nodes'][i]) for i in js['skins'][0]['joints']] if js.get('skins') else []
    rows = []
    allx = []
    for n_ in js['nodes']:
        if 'mesh' not in n_: continue
        for pi, pr in enumerate(js['meshes'][n_['mesh']]['primitives']):
            P = acc(js, bn, pr['attributes']['POSITION'])
            allx.append(P[:, 0])
            sel = P[:, 2] > zmin
            if sel.sum() < 3: continue
            S = P[sel]
            gids = ''
            if 'JOINTS_0' in pr['attributes'] and jn:
                J = acc(js, bn, pr['attributes']['JOINTS_0']).astype(int)[sel]
                W = acc(js, bn, pr['attributes']['WEIGHTS_0'])[sel]
                tot = collections.Counter()
                for a_, b_ in zip(J, W):
                    for x, y in zip(a_, b_):
                        if y > 0: tot[jn[x] if x < len(jn) else x] += float(y)
                gids = ','.join(k for k, _ in tot.most_common(4))
            mat = js['materials'][pr['material']].get('name', '?') if 'material' in pr else '-'
            rows.append({'prim': '%s#%d' % (n_.get('name', '?'), pi), 'n': int(sel.sum()),
                         'lo': S[:, 0].min(), 'hi': S[:, 0].max(), 'mat': mat, 'joints': gids})
    allx = np.concatenate(allx)
    mid = (allx.min() + allx.max()) / 2
    for r in rows:
        r['off'] = (r['lo'] + r['hi']) / 2 - mid
    rows.sort(key=lambda r: r['prim'])
    return mid, rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('a'); ap.add_argument('b')
    ap.add_argument('--z', type=float, default=27000)
    args = ap.parse_args()
    for mon in (args.a, args.b):
        mid, rows = survey(mon, args.z)
        print('=== %s   midline %.0f   %d primitives reach z > %.0f' % (mon, mid, len(rows), args.z))
        print('   %-14s %5s %16s %9s  %-26s %s' % ('prim', 'verts', 'x range', 'offset', 'material', 'joints'))
        for r in rows:
            print('   %-14s %5d %16s %+9.0f  %-26s %s'
                  % (r['prim'], r['n'], '%.0f..%.0f' % (r['lo'], r['hi']), r['off'], r['mat'], r['joints']))
        print()


if __name__ == '__main__':
    main()
