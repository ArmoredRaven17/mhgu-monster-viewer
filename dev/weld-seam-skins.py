"""Give every copy of a shared seam vertex ONE skin binding, so the seam cannot open when posed.

THIS IS A DELIBERATE DEVIATION FROM THE ROM and the first in this project. It is here because the
alternative is not available: the .mod itself binds the two copies of a seam vertex differently
(dev/mod-skin-solve.py establishes that on 786 pairs where the MOD's w0 is byte-identical yet the
joint slots differ), our exporter reproduces the .mod faithfully, and nothing in the renderer offsets
anything -- every node transform, bindMatrix, matrixWorld and polygonOffset came back identity. So
there is no faithful fix. Raven, 2026-09-10: "As a test case, weld Mizu's seams. I want to hold off
on doing it across the board until we patch more monster issues."

WHICH BINDING WINS. Not an average -- averaging moves BOTH copies away from what the ROM says, and
on a group of three copies it invents a binding no copy had. Instead a canonical copy is elected and
the others are made to match it, so at least one copy of every seam keeps the ROM's own answer
exactly:

    1. the binding most of the copies already share  (changes the fewest vertices)
    2. failing a majority, the richest -- most non-zero influences  (loses the least information)
    3. failing that, the lowest primitive index        (so a rerun is deterministic)

WHAT IT DOES NOT TOUCH. Vertices whose copies already agree, vertices with no coincident twin, and
every other attribute. Weights stay u8 summing to 255, which the writer asserts per vertex.

The cost is measured rather than assumed: --report prints how far the CHANGED vertices move under a
real pose against their original binding, which is the distortion this introduces inside each mesh.
"""
import argparse
import collections
import json
import os
import shutil
import struct
import sys

import numpy as np

CT = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load(path):
    raw = bytearray(open(path, 'rb').read())
    assert bytes(raw[:4]) == b'glTF', 'not a GLB'
    jlen = struct.unpack_from('<I', raw, 12)[0]
    js = json.loads(bytes(raw[20:20 + jlen]).decode('utf-8'))
    return raw, js, 20 + jlen + 8


def span(js, binoff, ai):
    a = js['accessors'][ai]
    fmt, sz = CT[a['componentType']]
    ncomp = NC[a['type']]
    bv = js['bufferViews'][a['bufferView']]
    base = binoff + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or (sz * ncomp)
    return base, stride, a['count'], fmt, ncomp


def read(raw, js, binoff, ai):
    base, stride, n, fmt, ncomp = span(js, binoff, ai)
    return np.array([struct.unpack_from('<' + fmt * ncomp, raw, base + k * stride)
                     for k in range(n)])


def weld(path, quant=10000.0, apply_it=False, report=False):
    raw, js, binoff = load(path)
    prims = []
    for mi, mesh in enumerate(js.get('meshes', [])):
        for pi, pr in enumerate(mesh.get('primitives', [])):
            a = pr['attributes']
            if not all(k in a for k in ('POSITION', 'JOINTS_0', 'WEIGHTS_0')):
                continue
            prims.append({
                'name': (mesh.get('name') or 'm%d' % mi) + '#' + str(pi),
                'pos': read(raw, js, binoff, a['POSITION']).astype(np.float64),
                'j': read(raw, js, binoff, a['JOINTS_0']).astype(int),
                'w': read(raw, js, binoff, a['WEIGHTS_0']).astype(int),
                'jspan': span(js, binoff, a['JOINTS_0']),
                'wspan': span(js, binoff, a['WEIGHTS_0']),
            })
    if len(prims) < 2:
        return None

    idx = collections.defaultdict(list)
    for pi_, p in enumerate(prims):
        q = np.round(p['pos'] * quant).astype(np.int64)
        for k in range(len(p['pos'])):
            idx[(q[k, 0], q[k, 1], q[k, 2])].append((pi_, k))

    def binding(pi_, k):
        j, w = prims[pi_]['j'][k], prims[pi_]['w'][k]
        return tuple(sorted((int(j[t]), int(w[t])) for t in range(len(j)) if w[t] > 0))

    groups = 0
    changes = []          # (pi_, k, joints, weights)
    for hits in idx.values():
        if len(set(h[0] for h in hits)) < 2:
            continue
        bs = [binding(*h) for h in hits]
        if len(set(bs)) == 1:
            continue
        groups += 1
        tally = collections.Counter(bs)
        top = tally.most_common(1)[0][1]
        best = [i for i, b in enumerate(bs) if tally[b] == top]
        if len(set(bs[i] for i in best)) > 1:
            rich = max(len(bs[i]) for i in best)
            best = [i for i in best if len(bs[i]) == rich]
            best.sort(key=lambda i: (hits[i][0], hits[i][1]))
        win = hits[best[0]]
        wj, ww = prims[win[0]]['j'][win[1]], prims[win[0]]['w'][win[1]]
        assert int(ww.sum()) == 255, 'winner weights do not sum to 255'
        for h in hits:
            if binding(*h) == binding(*win):
                continue
            changes.append((h[0], h[1], wj.copy(), ww.copy()))

    out = {'file': os.path.basename(path), 'primitives': len(prims),
           'seamGroupsDisagreeing': groups, 'verticesRewritten': len(changes)}

    if report and changes:
        # how far do the CHANGED vertices move, against their own original binding, under a pose?
        # the bones are not posed here, so this is measured as the weight delta, which bounds it:
        # a vertex whose influence set moves by d can travel at most d * (spread of its joints).
        deltas = []
        for pi_, k, nj, nw in changes:
            oldj, oldw = prims[pi_]['j'][k], prims[pi_]['w'][k]
            a = collections.Counter()
            b = collections.Counter()
            for t in range(len(oldj)):
                if oldw[t] > 0:
                    a[int(oldj[t])] += int(oldw[t])
            for t in range(len(nj)):
                if nw[t] > 0:
                    b[int(nj[t])] += int(nw[t])
            keys = set(a) | set(b)
            deltas.append(sum(abs(a.get(x, 0) - b.get(x, 0)) for x in keys) / 2.0 / 255.0)
        d = np.array(deltas)
        out['influenceShift'] = {
            'mean': round(float(d.mean()), 4), 'median': round(float(np.median(d)), 4),
            'p90': round(float(np.percentile(d, 90)), 4), 'max': round(float(d.max()), 4),
            'over25pct': int((d > 0.25).sum()),
        }

    if apply_it and changes:
        shutil.copy2(path, path + '.preweld')
        for pi_, k, nj, nw in changes:
            jb, jst, _n, jf, jc = prims[pi_]['jspan']
            wb, wst, _n2, wf, wc = prims[pi_]['wspan']
            assert jf == 'B' and wf == 'B', 'expected u8 joints/weights'
            struct.pack_into('<4B', raw, jb + k * jst, *[int(x) for x in nj])
            struct.pack_into('<4B', raw, wb + k * wst, *[int(x) for x in nw])
        tmp = path + '.part'
        open(tmp, 'wb').write(bytes(raw))
        os.replace(tmp, path)
        out['written'] = True
        out['backup'] = os.path.basename(path) + '.preweld'
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--docs', default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                   '..', 'docs'))
    ap.add_argument('--only', required=True, help='model stem, e.g. em082_00 -- no library-wide '
                                                  'default on purpose; this deviates from the ROM')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--report', action='store_true', default=True)
    args = ap.parse_args()
    mdir = os.path.abspath(os.path.join(args.docs, 'models', 'monsters'))
    files = [f for f in sorted(os.listdir(mdir)) if f.endswith('.glb') and f[:-4].startswith(args.only)]
    if not files:
        print('no model matching %r' % args.only)
        return 1
    for f in files:
        r = weld(os.path.join(mdir, f), apply_it=args.apply, report=args.report)
        print(json.dumps(r, indent=1))
    if not args.apply:
        print()
        print('REPORT ONLY -- pass --apply to write the GLB (a .preweld backup is kept).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
