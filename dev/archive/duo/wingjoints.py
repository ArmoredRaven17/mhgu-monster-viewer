# which joints the wing cards (parts 1..4) are skinned to, from the viewer's glb
import json, struct, sys, collections
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\models\monsters\em076_00.glb'
b = open(p, 'rb').read()
jl = struct.unpack('<I', b[12:16])[0]
g = json.loads(b[20:20 + jl])
binoff = 20 + jl + 8
bin_ = b[binoff:]
def acc(i):
    a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    fmt = {5121: 'B', 5123: 'H', 5126: 'f', 5125: 'I'}[a['componentType']]
    sz = struct.calcsize(fmt); stride = bv.get('byteStride', sz * n)
    return [struct.unpack_from('<' + fmt * n, bin_, off + k * stride) for k in range(a['count'])]
nodes = g['nodes']
for ni, nd in enumerate(nodes):
    if 'mesh' not in nd: continue
    mesh = g['meshes'][nd['mesh']]
    ex = json.dumps(nd.get('extras', {})) + json.dumps(mesh.get('extras', {}))
    name = nd.get('name', '') + ' / ' + mesh.get('name', '')
    if 'skin' not in nd: continue
    sk = g['skins'][nd['skin']]
    used = collections.Counter()
    for pr in mesh['primitives']:
        if 'JOINTS_0' not in pr['attributes']: continue
        J = acc(pr['attributes']['JOINTS_0']); W = acc(pr['attributes']['WEIGHTS_0'])
        for j, w in zip(J, W):
            for a, c in zip(j, w):
                if c > 0.01: used[nodes[sk['joints'][a]].get('name', str(a))] += 1
    print(ni, name, ex[:120], dict(used.most_common(6)))
