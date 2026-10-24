# SHELL_DATA.em061_04's files, from shl_em061_04.txt (shl.py's dump of em061_04.arc): one m057(...) line per mode
import json, re, sys
txt = open(sys.argv[1], encoding='utf8').read()
blocks = re.split(r'^== ', txt, flags=re.M)[1:]
out = {}
for b in blocks:
    head = b.splitlines()[0]
    nn = re.search(r'shell(\d\d)', head).group(1)
    modes = {}
    for m in re.finditer(r'^  mode (\d+) (\{.*\})$', b, re.M):
        modes[int(m.group(1))] = json.loads(m.group(2))
    out[nn] = modes
def num(x):
    r = repr(float(x))
    return r
def line(k, d):
    ef = [p for p in d['ef'][0]['arr']] if d['ef'] else []
    sh = d['sh']
    return '      %d: m057(%s, %s, %s, %s, [%s], %s),' % (k, num(d['scale'][0]), json.dumps(ef), json.dumps(d['hit']['ints']),
        json.dumps(sh['ints']), ', '.join(num(v) for v in sh['floats']), '[' + ', '.join('[' + ', '.join(num(v) for v in vv) + ']' for vv in sh['vecs']) + ']')
for nn in ('00', '01', '13', '23'):
    print('// shell' + nn)
    for k in sorted(out[nn]): print(line(k, out[nn][k]))
