# jpos.py <mon> <list> <clip> [frames...]: world positions (game units) of the pose glb's joints, sampled as three.js does
# (linear translation, slerp rotation), rest TRS from the pose glb (same as the model glb for em025_00, checked).
import json, struct, sys, math
import numpy as np
ROOT = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
mon, lst, clip = sys.argv[1], sys.argv[2], sys.argv[3]
fn = ROOT + r'\poses\monsters\%s_%s.glb' % (mon, lst)
b = open(fn, 'rb').read(); l = struct.unpack_from('<I', b, 12)[0]; j = json.loads(b[20:20 + l]); bo = 20 + l + 8
N = j['nodes']; AC = j['accessors']; BV = j['bufferViews']
def read(ai):
    a = AC[ai]; v = BV[a['bufferView']]; o = bo + v.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    if a['componentType'] == 5126: return np.frombuffer(b, '<f4', a['count'] * n, o).reshape(a['count'], n).astype(float)
    if a['componentType'] == 5122: return np.maximum(np.frombuffer(b, '<i2', a['count'] * n, o).reshape(a['count'], n) / 32767.0, -1.0)
    raise Exception(a['componentType'])
par = {}
for i, n in enumerate(N):
    for c in n.get('children', []): par[c] = i
names = {n.get('name'): i for i, n in enumerate(N)}
def slerp(q0, q1, t):
    d = np.dot(q0, q1)
    if d < 0: q1 = -q1; d = -d
    if d > 0.9995: q = q0 + t * (q1 - q0); return q / np.linalg.norm(q)
    th = math.acos(d); s = math.sin(th)
    return (math.sin((1 - t) * th) * q0 + math.sin(t * th) * q1) / s
def mat(t, r, s):
    x, y, z, w = r
    R = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
    T = np.eye(4); T[:3, :3] = R * np.array(s); T[:3, 3] = t; return T
A = [a for a in j['animations'] if a.get('name') == clip][0]
chans = []
for ch in A['channels']:
    s = A['samplers'][ch['sampler']]
    chans.append((ch['target']['node'], ch['target']['path'], read(s['input'])[:, 0], read(s['output'])))
dur = max(c[2][-1] for c in chans)
def pose(t, holdRef=False):
    trs = {i: [np.array(n.get('translation', [0, 0, 0]), float), np.array(n.get('rotation', [0, 0, 0, 1]), float), np.array(n.get('scale', [1, 1, 1]), float)] for i, n in enumerate(N)}
    for nd, p, tt, vv in chans:
        k = np.searchsorted(tt, t, side='right') - 1
        if k < 0: v = vv[0]
        elif k >= len(tt) - 1: v = vv[-1]
        else:
            u = (t - tt[k]) / (tt[k + 1] - tt[k])
            v = slerp(vv[k], vv[k + 1], u) if p == 'rotation' else vv[k] + u * (vv[k + 1] - vv[k])
        trs[nd][{'translation': 0, 'rotation': 1, 'scale': 2}[p]] = np.array(v, float)
    if holdRef: trs[names['reference']][0] = np.zeros(3)
    W = {}
    def world(i):
        if i in W: return W[i]
        M = mat(*trs[i]); M = (world(par[i]) @ M) if i in par else M
        W[i] = M; return M
    return {N[i].get('name'): world(i)[:3, 3] * 100 for i in range(len(N)) if ':' in (N[i].get('name') or '') and not N[i]['name'].endswith('_s')}, world
if __name__ == '__main__':
    print('duration', dur, 'frames@60', dur * 60)
    fr = [float(x) for x in sys.argv[4:]] or [0]
    for F in fr:
        P, world = pose(F / 60.0)
        j3 = [v for k, v in P.items() if k.split(':')[1] == '3'][0]
        low = min(P.items(), key=lambda kv: kv[1][1])
        ref = world(names['reference'])[:3, 3] * 100
        M3 = world(names[[k for k in P if k.split(':')[1] == '3'][0]])
        print('f%g' % F, 'ref', np.round(ref, 1), 'j0', np.round(P['0:0'], 1), 'j3', np.round(j3, 1), 'lowest', low[0], np.round(low[1], 1))
    # the viewer's bounds: 24 steps over the clip, every proxy bone
    mins = []
    for i in range(24):
        P, _ = pose(i / 24 * dur)
        lo = min(P.items(), key=lambda kv: kv[1][1]); mins.append((round(i / 24 * dur * 60, 1), lo[0], round(lo[1][1], 1)))
    print('per-step lowest:', mins)
    print('loop min', min(m[2] for m in mins))
