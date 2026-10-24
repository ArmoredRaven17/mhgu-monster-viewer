# j200.py: every Queen clip whose joint 200 (the mount joint) has an ANIMATED track -- position or rotation keys that
# are not constant -- read straight from the pose glbs (docs/poses/monsters/em069_00_<list>.glb). A track is "animated"
# when its values vary by more than 1e-4 over the clip. Positive control: the board's known carriers (L4 M27, M28,
# M76..M79, M96; L3 M12, M18 rotation) must come out animated, and a clip the board read as constant (L4 M47) must not.
import json, struct, sys, re
ROOT = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def glb(path):
    b = open(path, 'rb').read()
    n = struct.unpack_from('<I', b, 12)[0]
    js = json.loads(b[20:20 + n])
    off = 20 + n
    bl = struct.unpack_from('<I', b, off)[0]
    return js, b[off + 8: off + 8 + bl]
def acc(js, bin_, i):
    a = js['accessors'][i]; v = js['bufferViews'][a['bufferView']]
    comp = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    o = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    ct = a['componentType']; fmt, sz, norm = {5126: ('f', 4, 1), 5122: ('h', 2, 32767.0), 5123: ('H', 2, 65535.0), 5120: ('b', 1, 127.0), 5121: ('B', 1, 255.0)}[ct]
    stride = v.get('byteStride', comp * sz)
    rows = []
    for k in range(a['count']):
        r = struct.unpack_from('<%d%s' % (comp, fmt), bin_, o + k * stride)
        rows.append(tuple((x / norm if (ct != 5126 and a.get('normalized')) else x) for x in r))
    return rows
out = {}
for lid in ('0', '3', '4'):
    js, bin_ = glb(ROOT + r'\poses\monsters\em069_00_%s.glb' % lid)
    names = [n.get('name', '') for n in js['nodes']]
    # pose nodes are named "<local>_<gid>" or "...:200"; find nodes whose gid is 200 / 160 / 161
    def gid(nm):
        m = re.search(r':(\d+)$', nm); return int(m.group(1)) if m else None
    for an in js.get('animations', []):
        res = {}
        for ch in an['channels']:
            node = ch['target'].get('node'); path = ch['target']['path']
            g = gid(names[node]) if node is not None else None
            if g not in (200,): continue
            s = an['samplers'][ch['sampler']]
            vals = acc(js, bin_, s['output'])
            span = max(max(v[k] for v in vals) - min(v[k] for v in vals) for k in range(len(vals[0])))
            res[path] = round(span, 5)
        anim = {p: v for p, v in res.items() if v > 1e-4}
        out['%s|%s' % (lid, an['name'])] = anim
for k, v in sorted(out.items(), key=lambda kv: (kv[0].split('|')[0], int(re.search(r'\[(\d+)\]', kv[0]).group(1)) if re.search(r'\[(\d+)\]', kv[0]) else 0)):
    if v: print(k, v)
print('clips scanned', len(out), 'with joint 200 animated', sum(1 for v in out.values() if v))
