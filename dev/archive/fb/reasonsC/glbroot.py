# glbroot.py <glb> <anim-prefix>...: per animation, the translation tracks of the scene's top nodes: start / end / max xz travel
import json, struct, sys, math
p = sys.argv[1]
b = open(p, 'rb').read()
jl = struct.unpack_from('<I', b, 12)[0]
J = json.loads(b[20:20 + jl]); bin0 = 20 + jl + 8
def acc(i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]
    off = bin0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    return [struct.unpack_from('<%df' % n, b, off + k * 4 * n) for k in range(a['count'])]
roots = J['scenes'][J.get('scene', 0)]['nodes']
print('roots', [(r, J['nodes'][r].get('name')) for r in roots], 'children of root0', [(c, J['nodes'][c].get('name')) for c in J['nodes'][roots[0]].get('children', [])][:5])
for an in J['animations']:
    if not any(an.get('name', '').startswith(x) for x in sys.argv[2:]): continue
    for ch in an['channels']:
        t = ch['target']
        if t['path'] != 'translation': continue
        node = t['node']
        s = an['samplers'][ch['sampler']]
        tt = acc(s['input']); vv = acc(s['output'])
        if len(vv) < 2: continue
        d = math.hypot(vv[-1][0] - vv[0][0], vv[-1][2] - vv[0][2])
        if d < 1: continue
        print(an['name'], node, J['nodes'][node].get('name'), 'n', len(vv), 'first', [round(x, 2) for x in vv[0]], 'last', [round(x, 2) for x in vv[-1]], 'xz', round(d, 2), 't', round(tt[-1][0], 3))
        # travel by frame 22
        for k, (tk, v) in enumerate(zip(tt, vv)):
            if tk[0] >= 22 / 60: print('   at f22', [round(x, 2) for x in v], 'xz', round(math.hypot(v[0] - vv[0][0], v[2] - vv[0][2]), 2)); break
