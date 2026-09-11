"""How much of each mesh would an alpha cut remove? The test AUTHORED_CUTOUT is judged by.

Cause J established that MT's albedo alpha is the GLOSS, not coverage, and that clipping on it
destroyed a third of some hides. AUTHORED_CUTOUT is the hand list of materials Raven has judged to
be real cutouts anyway, and every entry in it cites the same number: the fraction of a mesh's
UV-covered texels whose albedo alpha is below the clip. A genuine cutout card takes its SURROUND --
the wing sheets run 0..29%, Nargacuga's fur 0..30% -- while a gloss ramp would take the hide, which
is Zinogre's 100%.

This measures that number per mesh, by rasterising each primitive's UV triangles into its own
albedo texture rather than sampling at vertices, which understates a card whose corners are the
only transparent part.

    python dev/cutout-coverage.py em011_00 em013_02 --controls

Run it from the viewer root. Controls are the monsters whose answer is already known: Nargacuga and
Rathian (low, in the list) and Zinogre (100%, deliberately out of it).
"""
import argparse
import json
import os
import struct
import sys

import numpy as np
from PIL import Image

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs')
CT = {5120: (np.int8, 1), 5121: (np.uint8, 1), 5122: (np.int16, 2),
      5123: (np.uint16, 2), 5125: (np.uint32, 4), 5126: (np.float32, 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
DEN = {np.int8: 127.0, np.uint8: 255.0, np.int16: 32767.0, np.uint16: 65535.0}
CONTROLS = ['em037_00', 'em001_04', 'em057_00']


def load(p):
    b = open(p, 'rb').read(); off = 12; js = None; bn = None
    while off < len(b):
        ln, ty = struct.unpack_from('<II', b, off); off += 8
        ch = b[off:off + ln]; off += ln
        if ty == 0x4E4F534A: js = json.loads(ch.decode('utf-8'))
        elif ty == 0x004E4942: bn = ch
    return js, bn


def acc(js, bn, i, raw=False):
    a = js['accessors'][i]; dt, sz = CT[a['componentType']]; n = NC[a['type']]
    bv = js['bufferViews'][a['bufferView']]
    base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or sz * n
    cnt = a['count']
    if stride == sz * n:
        arr = np.frombuffer(bn, dtype=dt, count=cnt * n, offset=base).reshape(cnt, n)
    else:
        buf = np.frombuffer(bn, dtype=np.uint8, count=stride * cnt, offset=base).reshape(cnt, stride)
        arr = buf[:, :sz * n].copy().view(dt).reshape(cnt, n)
    if raw: return arr
    out = arr.astype(np.float64)
    if a.get('normalized'): out = np.maximum(out / DEN[np.dtype(dt).type], -1.0)
    return out


def tris(pr, bn, js):
    raw = acc(js, bn, pr['indices'], raw=True).ravel().astype(np.int64)
    if pr.get('mode', 4) == 5:                       # every MHGU primitive is a strip
        t = np.stack([raw[:-2], raw[1:-1], raw[2:]], 1)
        t[1::2] = t[1::2, ::-1]
        return t[(t[:, 0] != t[:, 1]) & (t[:, 1] != t[:, 2]) & (t[:, 0] != t[:, 2])]
    return raw.reshape(-1, 3)


def coverage(uv, tri, alpha, clip, samples=8):
    """Fraction of UV-covered texels whose alpha is at or below `clip`.

    Barycentric sampling inside each triangle, so a card whose transparent part is only its corners
    is measured as the rasteriser sees it rather than at its three vertices.
    """
    h, w = alpha.shape
    g = []
    for i in range(samples + 1):
        for j in range(samples + 1 - i):
            g.append((i / samples, j / samples))
    g = np.array(g); bc = np.stack([g[:, 0], g[:, 1], 1 - g[:, 0] - g[:, 1]], 1)
    a, b, c = uv[tri[:, 0]], uv[tri[:, 1]], uv[tri[:, 2]]
    pts = (bc[None, :, 0, None] * a[:, None, :] + bc[None, :, 1, None] * b[:, None, :]
           + bc[None, :, 2, None] * c[:, None, :]).reshape(-1, 2)
    x = np.clip((pts[:, 0] % 1.0) * w, 0, w - 1).astype(int)
    y = np.clip((pts[:, 1] % 1.0) * h, 0, h - 1).astype(int)
    v = alpha[y, x]
    return float((v <= clip).mean()), len(v)


def run(mon, clip):
    db = json.load(open(os.path.join(DOCS, 'materials.json')))
    ref = 'em/%s' % mon[2:]
    e = db['monsters'].get(ref)
    if not e:
        print('%s: no materials entry' % mon); return
    glb = os.path.join(DOCS, 'models', 'monsters', '%s.glb' % mon)
    if not os.path.isfile(glb):
        print('%s: no glb' % mon); return
    js, bn = load(glb)
    tex = e.get('tex') or []
    cache = {}
    rows = []
    for n in js['nodes']:
        if 'mesh' not in n: continue
        for pi, pr in enumerate(js['meshes'][n['mesh']]['primitives']):
            mat = js['materials'][pr['material']].get('name', '?') if 'material' in pr else '-'
            m = (e['mats'] or {}).get(mat)
            slot = (m or {}).get('t', {}).get('albedo')
            if not slot or slot > len(tex) or not tex[slot - 1]: continue
            if 'TEXCOORD_0' not in pr['attributes']: continue
            f = tex[slot - 1]
            if f not in cache:
                p = os.path.join(DOCS, f)
                if not os.path.isfile(p): cache[f] = None
                else:
                    im = Image.open(p).convert('RGBA')
                    cache[f] = np.asarray(im).astype(np.float32)[..., 3] / 255.0
            al = cache[f]
            if al is None: continue
            uv = acc(js, bn, pr['attributes']['TEXCOORD_0'])
            frac, ns = coverage(uv, tris(pr, bn, js), al, clip)
            rows.append((frac, n.get('name', '?') + '#%d' % pi, mat,
                         acc(js, bn, pr['attributes']['POSITION']).shape[0]))
    rows.sort(reverse=True)
    print('=== %s : %d textured primitives' % (mon, len(rows)))
    bymat = {}
    for frac, node, mat, nv in rows:
        d = bymat.setdefault(mat, [])
        d.append(frac)
    for mat in sorted(bymat, key=lambda k: -max(bymat[k])):
        v = bymat[mat]
        print('   %-32s %2d prims   cut removes %5.1f%%..%5.1f%%  (mean %5.1f%%)'
              % (mat, len(v), 100 * min(v), 100 * max(v), 100 * float(np.mean(v))))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('monsters', nargs='*')
    ap.add_argument('--controls', action='store_true')
    ap.add_argument('--clip', type=float, default=1 / 512.0,
                    help="the clip AUTHORED_CUTOUT applies; rom/material.js uses gl.clip + 1/512")
    a = ap.parse_args()
    todo = list(a.monsters) + (CONTROLS if a.controls else [])
    if not todo: sys.exit('name at least one monster, or pass --controls')
    for m in todo:
        run(m, a.clip)
        print()
