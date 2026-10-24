import sys, re, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
ins = armdis.sweep(lo, hi)
tg = collections.Counter(); sites = collections.defaultdict(list)
for i,(a,m,o) in enumerate(ins):
    mm = re.match(r'(r\d+|sb|sl|fp|ip), (r\d+|sb|sl|fp|ip|lr), #0x50$', o)
    if m == 'add' and mm:
        reg = mm.group(1)
        for j in range(i+1, min(i+8, len(ins))):
            a2,m2,o2 = ins[j]
            if m2 == 'bl':
                t = o2.strip('#')
                tg[t]+=1; sites[t].append(a); break
for t,c in tg.most_common(60):
    print(t, c, ' '.join('%x'%s for s in sites[t][:6]))
