# per mesh group of a glb: bind bbox (POSITION min/max) and the joints its vertices are skinned to (weight share)
import json, struct, sys
p = sys.argv[1]
d = open(p, 'rb').read()
ln = struct.unpack_from('<I', d, 12)[0]
j = json.loads(d[20:20 + ln])
bin_off = 20 + ln + 8
acc, bv = j['accessors'], j['bufferViews']
CT = {5121: ('B', 1), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def read(ai):
    a = acc[ai]; v = bv[a['bufferView']]
    fmt, sz = CT[a['componentType']]; n = NC[a['type']]
    st = v.get('byteStride', sz * n); base = bin_off + v.get('byteOffset', 0) + a.get('byteOffset', 0)
    return [struct.unpack_from('<%d%s' % (n, fmt), d, base + i * st) for i in range(a['count'])]
skin = j['skins'][0] if j.get('skins') else None
jn = [j['nodes'][k].get('name', str(k)) for k in skin['joints']] if skin else []
want = set(int(x) for x in sys.argv[2].split(',')) if len(sys.argv) > 2 else None
res = {}
for n in j['nodes']:
    if 'mesh' not in n: continue
    nm = n.get('name', '?')
    if not nm.startswith('Group['): continue
    g = int(nm[6:nm.index(']')])
    if want and g not in want: continue
    r = res.setdefault(g, {'mn': [1e9] * 3, 'mx': [-1e9] * 3, 'w': {}, 'v': 0})
    for pr in j['meshes'][n['mesh']]['primitives']:
        a = acc[pr['attributes']['POSITION']]
        r['mn'] = [min(x, y) for x, y in zip(r['mn'], a['min'])]; r['mx'] = [max(x, y) for x, y in zip(r['mx'], a['max'])]
        r['v'] += a['count']
        if 'JOINTS_0' in pr['attributes']:
            J = read(pr['attributes']['JOINTS_0']); W = read(pr['attributes']['WEIGHTS_0'])
            for jj, ww in zip(J, W):
                for a1, b1 in zip(jj, ww):
                    if b1 > 0: r['w'][a1] = r['w'].get(a1, 0) + b1
for g in sorted(res):
    r = res[g]; tot = sum(r['w'].values()) or 1
    top = sorted(r['w'].items(), key=lambda t: -t[1])[:6]
    print('G%-3d v%-5d min %s max %s  joints %s' % (g, r['v'], [round(x) for x in r['mn']], [round(x) for x in r['mx']],
          ', '.join('%s:%d%%' % (jn[k] if k < len(jn) else k, 100 * w / tot) for k, w in top)))
