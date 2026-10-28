import sys, os, json
here = os.path.dirname(os.path.abspath(sys.argv[0]))
var = int(sys.argv[1]); ss = int(sys.argv[2]) if len(sys.argv) > 2 else 0
src = open(os.path.join(here, 'cen063.py')).read().split('for st in st_list:')[0].replace('os.path.dirname(os.path.abspath(__file__))', repr(here))
sys.argv = ['x', '7', str(var), str(ss)]
exec(src)
for lst in range(0, 5):
    for m in range(0, 110):
        mot = (lst << 8) | m
        seen = {}; lits = set()
        for fr in (0, 1):
            for rg in (0, 1):
                r = T.run(7, 0, 0, var, 0, rage=rg, stub=STUB, poke=POKE, mot=mot, fn=0xf3552c, frame=fr, frame2=fr)
                for e in r.get('ev', []):
                    if e[0] == 'ftest': lits.add(e[1])
                    if e[0] == 'ftest2': lits.add(e[2][1])
        for L in sorted(x for x in lits if x is not None):
            for rg in (0, 1):
                r = T.run(7, 0, 0, var, 0, rage=rg, stub=STUB, poke=POKE, mot=mot, fn=0xf3552c, only=L)
                for e in r.get('ev', []):
                    if e[0] in KEEP and e[0] not in ('probe', 'spend'): seen.setdefault(key(e) + ' f%s' % L, set()).add('r%d' % rg)
        if seen: print('L%d M%d' % (lst, m), json.dumps({k: sorted(v) for k, v in sorted(seen.items())}))
print('# done')
