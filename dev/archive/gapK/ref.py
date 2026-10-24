import sys, json, struct, re
path = sys.argv[1]; rx = re.compile(sys.argv[2])
b = open(path, 'rb').read(); off = 12
while off < len(b):
    ln, ty = struct.unpack_from('<II', b, off); ch = b[off + 8: off + 8 + ln]
    if ty == 0x4E4F534A: J = json.loads(ch)
    elif ty == 0x004E4942: BIN = ch
    off += 8 + ln
nodes = J['nodes']; names = [n.get('name', '') for n in nodes]
def acc(i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    st = bv.get('byteStride', 4 * n)
    return [struct.unpack_from('<%df' % n, BIN, o + k * st) for k in range(a['count'])]
for an in J['animations']:
    if not rx.search(an['name']): continue
    for chn in an['channels']:
        t = chn['target']
        if t.get('path') != 'translation' or names[t['node']] not in ('reference', '0:0'): continue
        smp = an['samplers'][chn['sampler']]; tt = acc(smp['input']); vv = acc(smp['output'])
        print(an['name'], names[t['node']], len(tt), 'end t', round(tt[-1][0]*60, 2))
        for k in range(len(tt)):
            if len(tt) < 12 or k % max(1, len(tt)//12) == 0 or k == len(tt) - 1:
                print('   f%.1f  (%.4f, %.4f, %.4f)' % (tt[k][0]*60, *vv[k]))
