# fk.py <glb> <anim-regex> : lowest node world Y (incl. the reference node's translation) per sampled frame, glb units x100
import sys, json, struct, re, bisect
import numpy as np
path = sys.argv[1]; rx = re.compile(sys.argv[2])
b = open(path, 'rb').read(); off = 12
while off < len(b):
    ln, ty = struct.unpack_from('<II', b, off); ch = b[off + 8: off + 8 + ln]
    if ty == 0x4E4F534A: J = json.loads(ch)
    elif ty == 0x004E4942: BIN = ch
    off += 8 + ln
nodes = J['nodes']; names = [n.get('name', '') for n in nodes]
parent = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []): parent[c] = i
def acc(i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    st = bv.get('byteStride', 4 * n)
    return [struct.unpack_from('<%df' % n, BIN, o + k * st) for k in range(a['count'])]
def qm(q):
    x, y, z, w = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
def samp(tt, vv, t):
    ts = [x[0] for x in tt]; k = bisect.bisect_right(ts, t) - 1
    if k < 0: return vv[0]
    if k >= len(ts) - 1: return vv[-1]
    u = (t - ts[k]) / (ts[k+1] - ts[k]); a = np.array(vv[k]); c = np.array(vv[k+1])
    r = a + (c - a) * u
    if len(r) == 4: r = r / np.linalg.norm(r)
    return tuple(r)
for an in J['animations']:
    if not rx.search(an['name']): continue
    tr = {}
    for chn in an['channels']:
        t = chn['target']; smp = an['samplers'][chn['sampler']]
        tr[(t['node'], t['path'])] = (acc(smp['input']), acc(smp['output']))
    T = max(v[0][-1][0] for v in tr.values())
    out = []
    for f in range(0, int(T * 60) + 1, max(1, int(T * 60) // 10)):
        t = f / 60.0; W = {}
        def world(i):
            if i in W: return W[i]
            n = nodes[i]
            tv = samp(*tr[(i, 'translation')], t) if (i, 'translation') in tr else n.get('translation', [0, 0, 0])
            rv = samp(*tr[(i, 'rotation')], t) if (i, 'rotation') in tr else n.get('rotation', [0, 0, 0, 1])
            sv = samp(*tr[(i, 'scale')], t) if (i, 'scale') in tr else n.get('scale', [1, 1, 1])
            M = np.eye(4); M[:3, :3] = qm(rv) * np.array(sv); M[:3, 3] = tv
            if i in parent: M = world(parent[i]) @ M
            W[i] = M; return M
        ys = [(world(i)[1, 3], names[i]) for i in range(len(nodes)) if ":" in names[i]]
        lo = min(ys); out.append('f%d min %.0f (%s) j0 %.0f ref %.0f' % (f, lo[0] * 100, lo[1], world(names.index('0:0'))[1, 3] * 100, world(names.index('reference'))[1, 3] * 100))
    print(an['name']); print('  ' + '\n  '.join(out))
