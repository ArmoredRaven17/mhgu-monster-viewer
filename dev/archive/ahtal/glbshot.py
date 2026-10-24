import sys, json, struct, numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
CT = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def acc(js, bin_, i):
    a = js['accessors'][i]; bv = js['bufferViews'][a['bufferView']]
    n = NC[a['type']]; t = CT[a['componentType']]; sz = struct.calcsize(t)
    stride = bv.get('byteStride', n * sz); off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    out = np.zeros((a['count'], n))
    for k in range(a['count']):
        out[k] = struct.unpack_from('<%d%s' % (n, t), bin_, off + k * stride)
    if a.get('normalized') and t == 'h': out /= 32767.0
    return out
def load(p):
    b = open(p, 'rb').read()
    L = struct.unpack_from('<I', b, 12)[0]; js = json.loads(b[20:20 + L])
    bl = struct.unpack_from('<I', b, 20 + L)[0]; bin_ = b[28 + L:28 + L + bl]
    tris = []
    for m in js['meshes']:
        for pr in m['primitives']:
            P = acc(js, bin_, pr['attributes']['POSITION'])[:, :3]
            I = acc(js, bin_, pr['indices']).astype(int).ravel() if 'indices' in pr else np.arange(len(P))
            mode = pr.get('mode', 4)
            if mode == 5:
                T = [(I[k], I[k+1], I[k+2]) for k in range(len(I) - 2) if len({I[k], I[k+1], I[k+2]}) == 3]
            else:
                T = I[:len(I)//3*3].reshape(-1, 3)
            tris.append(P[np.array(T)])
    return np.concatenate(tris)
out = sys.argv[1]
paths = sys.argv[2:]
fig = plt.figure(figsize=(4 * 3, 3.6 * len(paths)))
for r, p in enumerate(paths):
    T = load(p)
    mn, mx = T.reshape(-1, 3).min(0), T.reshape(-1, 3).max(0); c = (mn + mx) / 2; s = (mx - mn).max() / 2
    for k, (el, az) in enumerate([(20, 30), (90, -90), (0, 0)]):
        ax = fig.add_subplot(len(paths), 3, r * 3 + k + 1, projection='3d')
        ax.add_collection3d(Poly3DCollection(T, facecolor='#b9a27a', edgecolor='#333', linewidths=0.1))
        ax.set_xlim(c[0]-s, c[0]+s); ax.set_ylim(c[1]-s, c[1]+s); ax.set_zlim(c[2]-s, c[2]+s)
        ax.view_init(el, az); ax.set_axis_off()
        if k == 0: ax.set_title(p.split('/')[-1].split(chr(92))[-1] + '  ' + str(np.round(mx - mn, 0)), fontsize=8)
plt.tight_layout(); plt.savefig(out, dpi=70)
