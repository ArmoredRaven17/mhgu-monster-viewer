# roottrack.py <pose glb> <clip> [<clip> ...]: joint 0's translation / rotation track (first, last, min/max y) per clip
import json, struct, sys
p = sys.argv[1]
b = open(p, 'rb').read()
jl = struct.unpack('<I', b[12:16])[0]
g = json.loads(b[20:20 + jl])
bin_ = b[20 + jl + 8:]
def acc(i):
    a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    return [struct.unpack_from('<' + 'f' * n, bin_, off + k * 4 * n) for k in range(a['count'])]
names = {i: n.get('name', '') for i, n in enumerate(g['nodes'])}
for an in g.get('animations', []):
    if an.get('name') not in sys.argv[2:]: continue
    for ch in an['channels']:
        nd = names[ch['target']['node']]
        if not (nd.startswith('0:') or nd == '0' or nd.endswith(':0') or 'reference' in nd): continue
        sm = an['samplers'][ch['sampler']]
        T = acc(sm['input']); V = acc(sm['output'])
        path = ch['target']['path']
        ys = [v[1] for v in V] if path == 'translation' else None
        print(an['name'], nd, path, 'keys', len(V), 't', round(T[0][0] * 60), round(T[-1][0] * 60), 'first', [round(x, 3) for x in V[0]], 'last', [round(x, 3) for x in V[-1]],
              ('ymin %.3f ymax %.3f' % (min(ys), max(ys))) if ys else '')
