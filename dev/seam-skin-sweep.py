"""Does a monster's skinning pull its seams apart once it is POSED?

Raven, 2026-09-10, watching Mizutsune: "the Bind Pose doesn't show the small gaps near break-able
parts." That is the whole diagnostic. Where two primitives share a seam, the shared edge exists
TWICE -- once in each mesh -- at the same bind-pose position. If the two copies carry the same skin
binding they can never separate. If they carry different bindings they separate the instant a bone
turns, and the gap grows with the angle. So the test is: skin both copies and measure the distance
between them, at bind pose and at real animated poses.

This runs entirely offline, from the shipped assets. It does NOT need the viewer, which matters
because the app poses through pose.proxyBones copied onto the skeleton inside its own render loop,
so the browser cannot be driven to a pose headlessly.

    docs/models/monsters/<id>.glb        the mesh, the skin, JOINTS_0/WEIGHTS_0, inverseBindMatrices
    docs/poses/monsters/<id>_<n>.glb     the clips, as TRS tracks on nodes matched BY NAME

The skin joints are `<name>_s` nodes parented under the animated `<name>` nodes with identity TRS,
so the animation reaches them through the ordinary hierarchy and no retargeting is needed.

Reported per monster: the worst separation as a fraction of the model's own size, so the numbers
are comparable between a Kelbi and a Fatalis, plus how many seam pairs open past a visible
threshold. A pair whose two copies share a binding is skipped -- it is incapable of opening.
"""
import argparse
import collections
import json
import math
import os
import re
import struct
import sys

import numpy as np

CT = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load_glb(path):
    raw = open(path, 'rb').read()
    if raw[:4] != b'glTF':
        return None
    jlen = struct.unpack_from('<I', raw, 12)[0]
    js = json.loads(raw[20:20 + jlen].decode('utf-8'))
    return raw, js, 20 + jlen + 8


def acc(raw, js, binoff, ai):
    a = js['accessors'][ai]
    n, ncomp = a['count'], NC[a['type']]
    fmt, sz = CT[a['componentType']]
    bv = js['bufferViews'][a['bufferView']]
    base = binoff + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or (sz * ncomp)
    if stride == sz * ncomp:
        arr = np.frombuffer(raw, dtype=np.dtype('<' + fmt), count=n * ncomp, offset=base)
        arr = arr.reshape(n, ncomp).astype(np.float64 if fmt == 'f' else np.int64)
    else:
        rows = [struct.unpack_from('<' + fmt * ncomp, raw, base + k * stride) for k in range(n)]
        arr = np.array(rows, dtype=np.float64 if fmt == 'f' else np.int64)
    # KHR_mesh_quantization: POSITION here is SHORT with normalized=true, and the dequantisation
    # scale then lives in the inverseBindMatrices. Missing the SIGNED half of this rule leaves
    # positions as raw shorts, which skins to nonsense -- and bind pose HIDES it, because both
    # copies of a seam vertex take the same wrong transform and still coincide.
    if a.get('normalized'):
        div = {'b': 127.0, 'B': 255.0, 'h': 32767.0, 'H': 65535.0}.get(fmt)
        if div:
            arr = arr / div
            if fmt in ('b', 'h'):
                arr = np.maximum(arr, -1.0)
    return arr


def trs_matrix(t, r, s):
    x, y, z, w = r
    m = np.eye(4)
    m[0, 0] = 1 - 2 * (y * y + z * z); m[0, 1] = 2 * (x * y - z * w); m[0, 2] = 2 * (x * z + y * w)
    m[1, 0] = 2 * (x * y + z * w); m[1, 1] = 1 - 2 * (x * x + z * z); m[1, 2] = 2 * (y * z - x * w)
    m[2, 0] = 2 * (x * z - y * w); m[2, 1] = 2 * (y * z + x * w); m[2, 2] = 1 - 2 * (x * x + y * y)
    m[:3, 0] *= s[0]; m[:3, 1] *= s[1]; m[:3, 2] *= s[2]
    m[:3, 3] = t
    return m


def node_local(js, i, override):
    n = js['nodes'][i]
    if 'matrix' in n and i not in override:
        return np.array(n['matrix'], dtype=np.float64).reshape(4, 4).T
    t = override.get((i, 'translation'), n.get('translation', [0, 0, 0]))
    r = override.get((i, 'rotation'), n.get('rotation', [0, 0, 0, 1]))
    s = override.get((i, 'scale'), n.get('scale', [1, 1, 1]))
    return trs_matrix(t, r, s)


def world_matrices(js, override):
    nodes = js['nodes']
    parent = {}
    for i, n in enumerate(nodes):
        for c in (n.get('children') or []):
            parent[c] = i
    out = [None] * len(nodes)

    def solve(i):
        if out[i] is not None:
            return out[i]
        loc = node_local(js, i, override)
        p = parent.get(i)
        out[i] = loc if p is None else solve(p) @ loc
        return out[i]

    sys.setrecursionlimit(10000)
    for i in range(len(nodes)):
        solve(i)
    return out


def sample_clip(raw, js, binoff, clip, t):
    """-> {(nodeIndex, path): value} at time t, linear / nlerp."""
    ov = {}
    for ch in clip['channels']:
        smp = clip['samplers'][ch['sampler']]
        path = ch['target']['path']
        node = ch['target'].get('node')
        if node is None or path == 'weights':
            continue
        times = acc(raw, js, binoff, smp['input'])[:, 0]
        vals = acc(raw, js, binoff, smp['output'])
        if len(times) == 0:
            continue
        tt = min(max(t, times[0]), times[-1])
        k = int(np.searchsorted(times, tt, side='right') - 1)
        k = max(0, min(k, len(times) - 2)) if len(times) > 1 else 0
        if len(times) == 1:
            v = vals[0]
        else:
            span = times[k + 1] - times[k]
            u = 0.0 if span <= 0 else (tt - times[k]) / span
            if smp.get('interpolation') == 'STEP':
                v = vals[k]
            elif path == 'rotation':
                a, b = vals[k], vals[k + 1]
                if float(np.dot(a, b)) < 0:
                    b = -b
                v = a * (1 - u) + b * u
                nrm = np.linalg.norm(v)
                v = v / nrm if nrm > 0 else np.array([0, 0, 0, 1.0])
            else:
                v = vals[k] * (1 - u) + vals[k + 1] * u
        ov[(node, path)] = list(np.asarray(v).ravel())
    return ov


def skin_positions(pos, joints, weights, skinmats):
    # WEIGHTS_0 ships as bytes summing to 255 and the accessor is NOT flagged normalized, so the
    # raw values would skin at 255x. Normalising by the row sum is right either way and is what the
    # renderer effectively does. Bind pose hides this -- every skin matrix is identity there, so
    # both copies of a seam vertex scale by the same factor and still land on top of each other.
    tot = weights.sum(axis=1, keepdims=True)
    weights = np.divide(weights, np.where(tot > 0, tot, 1.0))
    ph = np.concatenate([pos, np.ones((len(pos), 1))], axis=1)
    outp = np.zeros((len(pos), 3))
    for k in range(joints.shape[1]):
        w = weights[:, k]
        if not np.any(w > 0):
            continue
        m = skinmats[joints[:, k]]
        p = np.einsum('nij,nj->ni', m, ph)
        outp += w[:, None] * p[:, :3]
    return outp


def analyse(model_path, pose_paths, samples, quant, max_clips=4):
    got = load_glb(model_path)
    if not got:
        return None
    raw, js, binoff = got
    if not js.get('skins'):
        return {'skip': 'no skin'}
    skin = js['skins'][0]
    joints_nodes = skin['joints']
    ibm = acc(raw, js, binoff, skin['inverseBindMatrices']).reshape(-1, 4, 4)
    ibm = np.transpose(ibm, (0, 2, 1))

    prims = []
    for mi, mesh in enumerate(js.get('meshes', [])):
        for pi, pr in enumerate(mesh.get('primitives', [])):
            a = pr['attributes']
            if not all(k in a for k in ('POSITION', 'JOINTS_0', 'WEIGHTS_0')):
                continue
            prims.append(((mesh.get('name') or 'm%d' % mi) + '#' + str(pi),
                          acc(raw, js, binoff, a['POSITION']).astype(np.float64),
                          acc(raw, js, binoff, a['JOINTS_0']).astype(np.int64),
                          acc(raw, js, binoff, a['WEIGHTS_0']).astype(np.float64)))
    if len(prims) < 2:
        return {'skip': 'fewer than 2 skinned primitives'}

    allpos = np.concatenate([p[1] for p in prims], axis=0)
    size = float(np.max(allpos.max(0) - allpos.min(0)))
    if size <= 0:
        return {'skip': 'degenerate bounds'}

    idx = collections.defaultdict(list)
    for pi_, (nm, pos, jj, ww) in enumerate(prims):
        q = np.round(pos * quant).astype(np.int64)
        for k in range(len(pos)):
            idx[(q[k, 0], q[k, 1], q[k, 2])].append((pi_, k))

    def binding(pi_, k):
        j, w = prims[pi_][2][k], prims[pi_][3][k]
        tot = float(w.sum()) or 1.0
        d = {}
        for i in range(len(j)):
            if w[i] > 0:
                d[int(j[i])] = d.get(int(j[i]), 0.0) + float(w[i]) / tot
        return tuple(sorted(d.items()))

    # THE CONTROL. A pair whose two copies share a binding CANNOT separate, under any pose, by
    # construction -- identical inputs through identical matrices. So `matched` must measure ~0 at
    # every pose, and if it ever does not, the pose maths is wrong and the mismatched number means
    # nothing. Four measurements earlier today were wrong for want of exactly this, so it is built
    # into the tool rather than left to whoever runs it.
    # CO-VISIBILITY. Primitives named Group[N]#k belong to PART N, and two parts can be alternatives
    # in the same cluster -- a broken jaw and an intact one occupy the same bind-pose vertices and
    # are never drawn together, so their "separation" is meaningless. Without this split the sweep
    # reports vertices flying a model-length apart, which is two exclusive variants being posed at
    # once, not a seam. Two sub-meshes of the SAME part are always drawn together, so those pairs
    # are the conservative, certain population and are counted separately.
    def part_of(name):
        m = re.match(r'Group\[(\d+)\]', name)
        return int(m.group(1)) if m else -1

    pairs, matched, shared_total = [], [], 0
    for hits in idx.values():
        if len(set(h[0] for h in hits)) < 2:
            continue
        for i in range(len(hits)):
            for jx in range(i + 1, len(hits)):
                a_, ak = hits[i]
                b_, bk = hits[jx]
                if a_ == b_:
                    continue
                shared_total += 1
                same = part_of(prims[a_][0]) == part_of(prims[b_][0])
                if binding(a_, ak) != binding(b_, bk):
                    pairs.append((a_, ak, b_, bk, same))
                elif len(matched) < 4000:
                    matched.append((a_, ak, b_, bk, same))
    if not pairs:
        return {'size': size, 'sharedPairs': shared_total, 'mismatched': 0, 'skip': None,
                'maxPct': 0.0, 'overPct': 0, 'worst': None, 'clip': None, 'ctlMaxPct': 0.0,
                'bindMaxPct': 0.0, 'matchedPairs': len(matched), 'samePartPct': 0.0,
                'samePartOver': 0, 'samePartWorst': None, 'samePartMismatched': 0}

    # gather only the paired vertices, per primitive
    need = collections.defaultdict(list)
    for a_, ak, b_, bk, _sm in pairs + matched:
        need[a_].append(ak)
        need[b_].append(bk)
    gath = {}
    for pi_, ks in need.items():
        ks = sorted(set(ks))
        remap = {k: i for i, k in enumerate(ks)}
        nm, pos, jj, ww = prims[pi_]
        gath[pi_] = (remap, pos[ks], jj[ks], ww[ks])

    def separations(override):
        wm = world_matrices(js, override)
        sm = np.zeros((len(joints_nodes), 4, 4))
        for i, nj in enumerate(joints_nodes):
            sm[i] = wm[nj] @ ibm[i]
        sk = {}
        for pi_, (remap, pos, jj, ww) in gath.items():
            sk[pi_] = skin_positions(pos, jj, ww, sm)
        def dist(lst):
            d = np.empty(len(lst))
            for n, (a_, ak, b_, bk, _sm) in enumerate(lst):
                pa = sk[a_][gath[a_][0][ak]]
                pb = sk[b_][gath[b_][0][bk]]
                d[n] = np.linalg.norm(pa - pb)
            return d
        return dist(pairs), (dist(matched) if matched else np.zeros(1))

    bind, bindCtl = separations({})
    best = {'maxPct': 0.0, 'overPct': 0, 'clip': None, 't': None, 'worst': None,
            'ctlMaxPct': 0.0, 'samePartPct': 0.0, 'samePartOver': 0,
            'samePartWorst': None}
    for pp in pose_paths:
        g2 = load_glb(pp)
        if not g2:
            continue
        praw, pjs, pboff = g2
        pname = {i: n.get('name') for i, n in enumerate(pjs.get('nodes', []))}
        mname = {n.get('name'): i for i, n in enumerate(js['nodes'])}
        for clip in (pjs.get('animations') or [])[:max_clips]:
            ends = []
            for ch in clip['channels']:
                smp = clip['samplers'][ch['sampler']]
                t = acc(praw, pjs, pboff, smp['input'])[:, 0]
                if len(t):
                    ends.append(float(t[-1]))
            if not ends:
                continue
            dur = max(ends)
            for t in [dur * f for f in samples]:
                ov0 = sample_clip(praw, pjs, pboff, clip, t)
                ov = {}
                for (node, path), val in ov0.items():
                    mi = mname.get(pname.get(node))
                    if mi is not None:
                        ov[(mi, path)] = val
                if not ov:
                    continue
                d, ctl = separations(ov)
                cpct = float(ctl.max()) / size * 100.0
                if cpct > best['ctlMaxPct']:
                    best['ctlMaxPct'] = cpct
                samemask = np.array([p[4] for p in pairs])
                dsame = d[samemask] if samemask.any() else np.zeros(1)
                smx = float(dsame.max()) / size * 100.0
                if smx > best['samePartPct']:
                    best['samePartPct'] = smx
                    best['samePartOver'] = int((dsame / size > 0.002).sum())
                    if samemask.any():
                        wn = int(np.arange(len(pairs))[samemask][int(dsame.argmax())])
                        best['samePartWorst'] = prims[pairs[wn][0]][0] + ' / ' + prims[pairs[wn][2]][0]
                mx = float(d.max()) / size * 100.0
                if mx > best['maxPct']:
                    n = int(d.argmax())
                    a_, ak, b_, bk, _sm = pairs[n]
                    best = {'ctlMaxPct': best['ctlMaxPct'],
                            'samePartPct': best['samePartPct'],
                            'samePartOver': best['samePartOver'],
                            'samePartWorst': best['samePartWorst'],
                            'maxPct': mx,
                            'overPct': int((d / size > 0.002).sum()),
                            'clip': clip.get('name'), 't': round(t, 2),
                            'worst': prims[a_][0] + ' / ' + prims[b_][0]}
    return {'size': size, 'sharedPairs': shared_total, 'mismatched': len(pairs),
            'matchedPairs': len(matched),
            'samePartMismatched': int(sum(1 for p in pairs if p[4])),
            'bindMaxPct': float(bind.max()) / size * 100.0, 'skip': None, **best}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--docs', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs'))
    ap.add_argument('--only', default=None)
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--samples', default='0.17,0.4,0.63,0.85')
    ap.add_argument('--poses-per-monster', type=int, default=1)
    ap.add_argument('--quant', type=float, default=10000.0)
    ap.add_argument('--max-clips', type=int, default=4,
                    help='clips probed per pose file; a sweep ranks, it does not exhaust')
    ap.add_argument('--json', default=None)
    args = ap.parse_args()

    docs = os.path.abspath(args.docs)
    mdir = os.path.join(docs, 'models', 'monsters')
    pdir = os.path.join(docs, 'poses', 'monsters')
    samples = [float(x) for x in args.samples.split(',')]

    poses = collections.defaultdict(list)
    for f in sorted(os.listdir(pdir)):
        if f.endswith('.glb'):
            poses[f.rsplit('_', 1)[0]].append(os.path.join(pdir, f))

    files = [f for f in sorted(os.listdir(mdir)) if f.endswith('.glb')]
    if args.only:
        files = [f for f in files if f.startswith(args.only)]
    if args.limit:
        files = files[:args.limit]

    rows, skipped = [], []
    for n, f in enumerate(files, 1):
        stem = f[:-4]
        pl = poses.get(stem) or poses.get(stem.split('_tail')[0]) or []
        pl = pl[:args.poses_per_monster]
        try:
            r = analyse(os.path.join(mdir, f), pl, samples, args.quant, args.max_clips)
        except Exception as e:
            skipped.append((stem, 'error: %s' % e))
            continue
        if r is None or r.get('skip'):
            skipped.append((stem, (r or {}).get('skip', 'unreadable')))
            continue
        r['id'] = stem
        r['poses'] = len(pl)
        rows.append(r)
        print('  [%3d/%d] %-24s same-part %4d  posed(same) %7.2f%%  any %8.2f%%  CTL %.3f%%' % (
            n, len(files), stem, r['samePartMismatched'], r['samePartPct'], r['maxPct'],
            r.get('ctlMaxPct', 0.0)), flush=True)

    rows.sort(key=lambda r: -r['samePartPct'])
    print()
    print('=' * 108)
    print('WORST SEAM SEPARATION UNDER A POSE, as a percentage of the model\'s own size')
    print('=' * 108)
    print('%-22s %9s %10s %8s %8s %8s  %s' % ('monster', 'same-part', 'posed(same)', 'over0.2%',
                                                       'any-pair', 'CONTROL', 'worst same-part pair'))
    for r in rows[:40]:
        print('%-22s %9d %9.2f%% %8d %7.1f%% %7.3f%%  %s' % (
            r['id'], r['samePartMismatched'], r['samePartPct'], r['samePartOver'],
            r['maxPct'], r.get('ctlMaxPct', 0.0), (r.get('samePartWorst') or '-')[:34]))
    print()
    print('models analysed: %d   skipped: %d' % (len(rows), len(skipped)))
    if rows:
        opens = [r for r in rows if r['samePartPct'] > max(r.get('ctlMaxPct', 0.0), 0.05) * 3]
        print('models whose SAME-PART seams open past 3x the control: %d of %d' % (len(opens), len(rows)))
    for s in skipped[:10]:
        print('   skipped %-24s %s' % s)
    if args.json:
        json.dump(rows, open(args.json, 'w'), indent=1)
        print('wrote %s' % args.json)


if __name__ == '__main__':
    main()
