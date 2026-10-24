# air/glbroot.py <glb> [anim-name-regex] : per animation, the translation track of the 'reference' node
# (the root-motion track) and of the top bone(s) under it, sampled at a few keys. Plain GLB reader.
import sys, json, struct, re
path = sys.argv[1]
rx = re.compile(sys.argv[2]) if len(sys.argv) > 2 else None
b = open(path, 'rb').read()
assert b[:4] == b'glTF'
off = 12; J = None; BIN = None
while off < len(b):
    ln, ty = struct.unpack_from('<II', b, off); ch = b[off + 8: off + 8 + ln]
    if ty == 0x4E4F534A: J = json.loads(ch)
    elif ty == 0x004E4942: BIN = ch
    off += 8 + ln
nodes = J['nodes']
parent = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []): parent[c] = i
def acc(i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    st = bv.get('byteStride', 4 * n)
    return [struct.unpack_from('<%df' % n, BIN, o + k * st) for k in range(a['count'])]
names = [n.get('name', '') for n in nodes]
ref = [i for i, s in enumerate(names) if s == 'reference']
print('nodes', len(nodes), 'reference', ref, 'parent of ref', [parent.get(r) for r in ref])
for r in ref:
    kids = nodes[r].get('children', [])
    print(' ref rest t', nodes[r].get('translation'), 'children', [(k, names[k], nodes[k].get('translation')) for k in kids][:6])
want = set(ref)
for r in ref: want.update(nodes[r].get('children', []))
for an in J.get('animations', []):
    if rx and not rx.search(an['name']): continue
    out = []
    for chn in an['channels']:
        t = chn['target']
        if t.get('path') != 'translation' or t.get('node') not in want: continue
        smp = an['samplers'][chn['sampler']]
        tt = acc(smp['input']); vv = acc(smp['output'])
        ys = [v[1] for v in vv]
        pick = [0, len(tt) // 2, len(tt) - 1]
        out.append('%s: n%d y[min %.1f max %.1f] ' % (names[t['node']], len(tt), min(ys), max(ys)) +
                   ' '.join('t%.3f=(%.1f,%.1f,%.1f)' % (tt[k][0], *vv[k]) for k in pick))
    print(an['name'], '|', ' || '.join(out))
