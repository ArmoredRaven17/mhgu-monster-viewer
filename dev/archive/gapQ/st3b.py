import sys, os, json
here = os.path.dirname(os.path.abspath(sys.argv[0]))
var = int(sys.argv[1]); ss = int(sys.argv[2]) if len(sys.argv) > 2 else 0
src = open(os.path.join(here, 'cen063.py')).read().split('for st in st_list:')[0].replace('os.path.dirname(os.path.abspath(__file__))', repr(here))
sys.argv = ['x', '3', str(var), str(ss)]
exec(src)
for n in (0, 1, 2, 3, 5):
    for mot in range(0x30, 0x42):
        seen = {}
        for ph in range(4):
            lits = set()
            for scn in ({'frame': 1, 'frame2': 1}, {'frame': 0, 'frame2': 0}):
                for rg in (0, 1):
                    r = T.run(3, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE, mot=mot, **scn)
                    for e in r.get('ev', []):
                        if e[0] == 'ftest': lits.add(e[1])
                        if e[0] == 'ftest2': lits.add(e[2][1])
            for L in sorted(x for x in lits if x is not None):
                for rg in (0, 1):
                    r = T.run(3, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE, mot=mot, only=L)
                    for e in r.get('ev', []):
                        if e[0] in KEEP and e[0] not in ('probe', 'spend'): seen.setdefault(key(e) + ' f%s' % L, set()).add('p%d r%d' % (ph, rg))
        if seen: print('3:%d L0 M%d' % (n, mot), json.dumps({k: sorted(v) for k, v in sorted(seen.items())}))
