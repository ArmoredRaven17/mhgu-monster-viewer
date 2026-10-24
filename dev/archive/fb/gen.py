import re, json
cur=None; D={}
for l in open(__import__('sys').argv[1]):
    if l.startswith('=='):
        m=re.match(r'== (\S+) (\S+)',l); cur=m.group(2).split(chr(92))[-1]; D[cur]={}; continue
    m=re.match(r'\s+mode (\d+) (.*)', l)
    if m: D[cur][int(m.group(1))]=json.loads(m.group(2))
def num(x):
    if isinstance(x,float):
        if x==int(x) and abs(x)<1e7: return '%.1f'%x
        return repr(x)
    return str(x)
def arr(a): return '['+', '.join(num(x) for x in a)+']'
for name in sorted(D):
    print('//', name)
    for m,d in sorted(D[name].items()):
        ef=d['ef'][0]['arr'] if d.get('ef') else []
        ef=[[a, b if b < 0x80000000 else b-0x100000000] for a,b in ef]
        sc=d['scale'][0] if d.get('scale') else 1.0
        hit=d['hit']['ints'] if isinstance(d.get('hit'),dict) else []
        sh=d['sh']
        print('      %d: m057(%s, %s, %s, %s, %s, [%s]),' % (m, num(sc), json.dumps(ef).replace(',', ', ').replace(',  ',', '), arr(hit), arr(sh['ints']), arr(sh['floats']), ', '.join(arr(v) for v in sh['vecs'])))
