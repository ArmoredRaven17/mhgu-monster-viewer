# gaps.py -- every word of 0xdeee40..0xdfef0c the descent did not reach: referenced data (pc-relative loads, jump tables,
# pc-relative table bases) or not; the unreferenced runs printed so a code island cannot hide
import sys, json, re
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, '.')
import armdis, rdesc
d = json.load(open('band024.json'))
code = set(d['code']); jt = set()
for (a, base, n, tg) in d['tables']:
    for i in range(n): jt.add(base + 4 * i)
ref = set(); bases = []
for a in code:
    m, o = rdesc.dis(a)
    mm = re.search(r'\[pc, #(-?0x[0-9a-f]+|\d+)\]', o)
    if mm:
        t = a + 8 + int(mm.group(1), 0); ref.add(t)
        if m.startswith('ldrd') or m.startswith('vldr') and o.startswith('d'): ref.add(t + 4)
    mm = re.match(r'(\w+), pc, #(0x[0-9a-f]+|\d+)$', o)
    if m == 'add' and mm: bases.append(a + 8 + int(mm.group(2), 0))
LO, HI = 0xdeee40, 0xdfef0c
runs = []; cur = []
for w in range(LO, HI, 4):
    if w in code or w in jt or w in ref: 
        if cur: runs.append(cur); cur = []
        continue
    cur.append(w)
if cur: runs.append(cur)
print('unreached, unreferenced runs:', len(runs))
for r in runs:
    near = [b for b in bases if b <= r[0] <= b + 0x40]
    print('%#x..%#x (%d words)%s: %s' % (r[0], r[-1] + 4, len(r), ' [after a pc-relative table base %s]' % hex(near[0]) if near else '',
          ' | '.join('%s %s' % rdesc.dis(x) for x in r[:4])))
