# armdiff.py lo1 lo2 lo3 hi: three reader arms side by side as (r1 literal -> getter -> destination) triples
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
G = {0x4a22f0: 'ef', 0x4a23f4: 'hit', 0x4a2470: 'int', 0x4a24f8: 'float', 0x4a2584: 'vec'}
def triples(lo, hi):
    out = []; r1 = None; pend = None
    for l in armdis.run(lo, hi):
        a, m, o = int(l[:8], 16), l[10:19].strip(), l[19:59].strip()
        if m == 'mov' and o.startswith('r1, #'): r1 = int(o.split('#')[1], 0)
        if m == 'bl':
            t = int(o.split('#')[1], 16)
            if t in G: pend = '%s %s' % (G[t], r1); out.append(pend); continue
            out.append('bl %x' % t)
        if m in ('movw',) and o.startswith('r') and '#0x1' in o and pend: out[-1] += ' -> ' + o.split('#')[1]; pend = None
        if m in ('orrne',): out.append('  | ' + o.split('#')[1])
        if m.startswith('pop') or (m == 'b' and '#' in o): out.append(m + ' ' + o); 
        if m.startswith('pop') and 'pc' in o: break
    return out
args = [int(x, 16) for x in sys.argv[1:]]
for lo in args[:-1]:
    print('== %x' % lo); print('\n'.join(triples(lo, args[-1] if lo == args[-2] else args[args.index(lo) + 1])))
