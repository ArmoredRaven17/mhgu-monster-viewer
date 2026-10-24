import sys, json, itertools
sys.argv = ['x']
import tr57 as T
acts = [0xa6,0xa7,0xa8,0xa9,0xee,0xf0,0xf8,0xfc,0,1,0xcf,0xd0]
scns = [{}, {'frame':1}, {'frame2':1}, {'frame':1,'frame2':1}, {'ended':1}, {'landed':1}, {'timer':1}, {'frame':1,'timer':1}, {'frame2':1,'ended':1}]
for var in (0, 4):
    for n in acts:
        seen = {}
        for ph in range(6):
            for sub in range(2):
             for s2 in range(6):
                for ch in (0, 1):
                  for rg in (0, 1):
                    for b in (0,):
                        for scn in scns:
                            r = T.run(7, n, ph, var, sub, b5f8=b, charged=ch, rage=rg, s2=s2, **scn)
                            for e in r.get('ev', []):
                                if e[0] == 'create':
                                    k = (e[1], e[2], json.dumps(e[6]), e[5])
                                    seen.setdefault(k, set()).add('p%d s%d/%d c%d r%d b%d %s' % (ph, s2, sub, ch, rg, b, ''.join(x[:2] for x in sorted(scn))))
        print('%d (7,%#x)' % (var, n))
        for k, v in sorted(seen.items()): print('   ', k, sorted(v)[:4], len(v))
