"""Skin a monster with a borrowed clip the way the viewer does, and measure where the snout goes.

Raven, 2026-09-11, on Crimson Fatalis: "Bind position looks correct. It varies with animations."
The bind pose is therefore not the thing to measure. This evaluates the ANIMATION: it binds each
track by name exactly as render/monster.js clipFor() does -- keep the track if its sanitised name
already exists on the target, else look it up in the list's `remap`, else DROP it -- then computes
the skin matrices and reports the snout's offset from the model's own midline per frame.

Fatalis em013_00 OWNS the motion list (remap is empty, every track binds), so it is the control:
run it through the identical code path and any offset it shows is the animation itself, not the
retarget. Crimson and Old Fatalis borrow the list and go through the remap.

`--fix-s` is the other control: the remap harvest ships covers the base bones only, so the 18 `_s`
twin tracks are dropped. --fix-s derives their mapping from the base bone's and binds them too.
Run with and without: if the snout offset does not move, the dropped tracks are not the cause.

    python dev/skin-sim.py em013_01 --clip "Motion[30]" --z 27000
    python dev/skin-sim.py em013_01 --scan-clips
"""
import argparse
import collections
import json
import os
import re
import struct

import numpy as np

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs')
CT = {5120: (np.int8, 1), 5121: (np.uint8, 1), 5122: (np.int16, 2),
      5123: (np.uint16, 2), 5125: (np.uint32, 4), 5126: (np.float32, 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

# three.js PropertyBinding.sanitizeNodeName -- this is why a track name loses its colon, and why
# the remap is keyed on the sanitised form rather than on "<local>:<globalBoneId>".
san = lambda n: re.sub(r'[\[\]\.:/]', '', n.replace(' ', '_'))


def gltf(p):
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
        v = np.frombuffer(bn, dtype=dt, count=cnt * n, offset=base).reshape(cnt, n)
    else:
        buf = np.frombuffer(bn, dtype=np.uint8, count=stride * cnt, offset=base).reshape(cnt, stride)
        v = buf[:, :sz * n].copy().view(dt).reshape(cnt, n)
    v = v.astype(np.float64)
    # SHORT with normalized:true, which is how this converter ships both rotations and positions;
    # the position dequantisation lives in the inverseBindMatrices, so skinning restores the scale.
    if a.get('normalized'):
        d = {np.dtype(np.int16): 32767.0, np.dtype(np.int8): 127.0,
             np.dtype(np.uint8): 255.0, np.dtype(np.uint16): 65535.0}.get(np.dtype(dt))
        if d: v = np.maximum(v / d, -1.0)
    return v


def trs(t, q, s):
    x, y, z, w = q
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4); M[:3, :3] = R * np.asarray(s, dtype=float); M[:3, 3] = t
    return M


class Model:
    def __init__(self, path):
        self.js, self.bn = gltf(path)
        js = self.js
        self.name = [n.get('name', '') for n in js['nodes']]
        self.child = [n.get('children', []) for n in js['nodes']]
        self.rest = []
        for n in js['nodes']:
            if 'matrix' in n:
                self.rest.append(('M', np.array(n['matrix']).reshape(4, 4).T))
            else:
                self.rest.append(('T', (np.array(n.get('translation', [0, 0, 0]), dtype=float),
                                        np.array(n.get('rotation', [0, 0, 0, 1]), dtype=float),
                                        np.array(n.get('scale', [1, 1, 1]), dtype=float))))
        self.skin = js['skins'][0]
        self.joints = self.skin['joints']
        self.ibm = acc(js, self.bn, self.skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
        self.roots = js['scenes'][js.get('scene', 0)]['nodes']
        self.bysan = {}
        for i, n in enumerate(self.name):
            if n: self.bysan.setdefault(san(n), i)
        self._prims = None

    def world(self, pose):
        W = [None] * len(self.name)

        def walk(i, par):
            if i in pose:
                L = trs(*pose[i])
            else:
                kind, val = self.rest[i]
                L = val if kind == 'M' else trs(*val)
            W[i] = par @ L
            for c in self.child[i]: walk(c, W[i])

        for r in self.roots: walk(r, np.eye(4))
        return W

    def prims(self):
        if self._prims is not None: return self._prims
        out = []
        for nd in self.js['nodes']:
            if 'mesh' not in nd: continue
            for pi, pr in enumerate(self.js['meshes'][nd['mesh']]['primitives']):
                at = pr['attributes']
                if 'JOINTS_0' not in at: continue
                out.append(('%s#%d' % (nd.get('name', '?'), pi),
                            acc(self.js, self.bn, at['POSITION']),
                            acc(self.js, self.bn, at['JOINTS_0']).astype(int),
                            acc(self.js, self.bn, at['WEIGHTS_0'])))
        self._prims = out
        return out


def clip_tracks(js, bn, clipname):
    an = next((a for a in js.get('animations', []) if a.get('name') == clipname), None)
    if an is None: return None, 0.0
    names = [n.get('name', '') for n in js['nodes']]
    out = collections.defaultdict(dict)
    dur = 0.0
    for ch in an['channels']:
        sm = an['samplers'][ch['sampler']]
        tin = acc(js, bn, sm['input'])[:, 0]
        val = acc(js, bn, sm['output'])
        out[names[ch['target']['node']]][ch['target']['path']] = (tin, val)
        dur = max(dur, float(tin.max()))
    return out, dur


def sample(tin, val, t):
    if t <= tin[0]: return val[0]
    if t >= tin[-1]: return val[-1]
    i = int(np.searchsorted(tin, t)) - 1
    a = (t - tin[i]) / (tin[i + 1] - tin[i])
    return val[i] * (1 - a) + val[i + 1] * a


def build_pose(model, tracks, remap, t, fix_s=False):
    """Bind every track the way clipFor does, then sample it. Returns (pose, droppedNames)."""
    pose, dropped = {}, []
    for node, paths in tracks.items():
        s = san(node)
        idx = model.bysan.get(s)
        if idx is None:
            w = remap.get(s)
            if w is None and fix_s and node.endswith('_s'):
                # the remap harvest ships covers base bones only; the _s twin follows the same
                # local-index change, so this is what a complete remap would have said.
                base = remap.get(san(node[:-2]))
                if base: w = base + '_s'
            idx = model.bysan.get(w) if w else None
        if idx is None:
            dropped.append(node); continue
        kind, val = model.rest[idx]
        if kind == 'M':
            bt, bq, bs = val[:3, 3].copy(), np.array([0, 0, 0, 1.0]), np.ones(3)
        else:
            bt, bq, bs = val[0].copy(), val[1].copy(), val[2].copy()
        if 'translation' in paths: bt = sample(*paths['translation'], t)
        if 'rotation' in paths:
            q = sample(*paths['rotation'], t); n_ = np.linalg.norm(q)
            if n_ > 0: bq = q / n_
        if 'scale' in paths: bs = sample(*paths['scale'], t)
        pose[idx] = (bt, bq, bs)
    return pose, dropped


def skinned(model, pose):
    W = model.world(pose)
    skin = np.stack([W[j] @ model.ibm[k] for k, j in enumerate(model.joints)])
    out = []
    for tag, P, J, Wt in model.prims():
        ph = np.concatenate([P, np.ones((len(P), 1))], 1)
        acc_ = np.zeros((len(P), 3))
        for s_ in range(J.shape[1]):
            w = Wt[:, s_]
            if not w.any(): continue
            acc_ += w[:, None] * np.einsum('nij,nj->ni', skin[J[:, s_]], ph)[:, :3]
        out.append((tag, P, acc_))
    return out


def zscale(model):
    """--z is given in the raw quantised shorts face-compare.py prints. POSITION here is read
    through acc(), which applies normalized:true, so the threshold has to come down with it."""
    a = model.js['accessors'][model.prims()[0][0] and 0]
    return 32767.0 if abs(model.prims()[0][1][:, 2]).max() <= 1.5 else 1.0


def offset(model, pose, zmin):
    """Snout x-centre minus whole-model x-centre. Region picked on the BIND z, so the same
    vertices are measured at every frame no matter where the animation carries them."""
    zmin = zmin / zscale(model)
    rows = skinned(model, pose)
    allx = np.concatenate([r[2][:, 0] for r in rows])
    sel = [r[2][r[1][:, 2] > zmin, 0] for r in rows if (r[1][:, 2] > zmin).any()]
    s = np.concatenate(sel)
    mid = (allx.min() + allx.max()) / 2
    return float((s.min() + s.max()) / 2 - mid)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mon')
    ap.add_argument('--clip', default=None)
    ap.add_argument('--list', type=int, default=0)
    ap.add_argument('--z', type=float, default=27000)
    ap.add_argument('--frames', type=int, default=9)
    ap.add_argument('--fix-s', action='store_true')
    ap.add_argument('--scan-clips', action='store_true')
    args = ap.parse_args()

    mons = json.load(open(os.path.join(DOCS, 'monsters.json'), encoding='utf-8'))
    mons = mons if isinstance(mons, list) else mons.get('monsters', [])
    rec = next(x for x in mons if x['id'] == args.mon)
    lst = rec['lists'][args.list]
    remap = lst.get('remap') or {}
    model = Model(os.path.join(DOCS, 'models', 'monsters', args.mon + '.glb'))
    pjs, pbn = gltf(os.path.join(DOCS, lst['file']))
    clips = [a.get('name') for a in pjs.get('animations', [])]

    names = [args.clip] if args.clip else clips
    print('%s  list %d = %s  remap %d entries  %d clips'
          % (args.mon, args.list, lst['file'], len(remap), len(clips)))
    print('   %-24s %8s %8s %8s   %s' % ('clip', 'min off', 'max off', 'swing', 'dropped tracks'))
    worst = []
    for cl in names:
        tracks, dur = clip_tracks(pjs, pbn, cl)
        if not tracks: continue
        offs = []
        drop = None
        for k in range(args.frames):
            t = dur * k / max(1, args.frames - 1)
            pose, dropped = build_pose(model, tracks, remap, t, args.fix_s)
            drop = dropped
            offs.append(offset(model, pose, args.z))
        o = np.array(offs)
        swing = float(o.max() - o.min())
        worst.append((swing, cl, o.min(), o.max(), len(drop)))
        if args.clip or not args.scan_clips:
            print('   %-24s %8.1f %8.1f %8.1f   %d' % (cl, o.min(), o.max(), swing, len(drop)))
    if args.scan_clips:
        worst.sort(reverse=True)
        for swing, cl, lo, hi, nd in worst[:12]:
            print('   %-24s %8.1f %8.1f %8.1f   %d' % (cl, lo, hi, swing, nd))


if __name__ == '__main__':
    main()
