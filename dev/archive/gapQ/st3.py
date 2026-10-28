import sys, os, json
here = os.path.dirname(os.path.abspath(sys.argv[0]))
var = int(sys.argv[1])
src = open(os.path.join(here, 'cen063.py')).read().split('for st in st_list:')[0].replace('os.path.dirname(os.path.abspath(__file__))', repr(here))
sys.argv = ['x', '3', str(var), '0']
exec(src)
for n in (0, 1, 2, 3, 5):
    seen = {}
    for ph in range(6):
        for s2 in range(4):
            for sub in range(4):
                for b8 in (0, 4, 5):
                    lits = set()
                    for scn in ({'frame': 1, 'frame2': 1}, {'frame': 0, 'frame2': 0}, {'frame': 1, 'frame2': 1, 'ended': 1}):
                        for rg in (0, 1):
                            r = T.run(3, n, ph, var, sub, b8, s2, rage=rg, stub=STUB, poke=POKE, **scn)
                            for e in r.get('ev', []):
                                if e[0] == 'ftest': lits.add(e[1])
                                if e[0] == 'ftest2': lits.add(e[2][1])
                                if e[0] in KEEP + ('mot',): seen.setdefault(key(e) if e[0] != 'mot' else 'mot ' + e[1], set()).add('p%d s%d u%d b%d fALL' % (ph, s2, sub, b8))
                    for L in sorted(x for x in lits if x is not None):
                        for rg in (0, 1):
                            r = T.run(3, n, ph, var, sub, b8, s2, rage=rg, stub=STUB, poke=POKE, only=L)
                            for e in r.get('ev', []):
                                if e[0] in KEEP: seen.setdefault(key(e), set()).add('p%d s%d u%d b%d r%d f%s' % (ph, s2, sub, b8, rg, L))
    print('3:%d' % n, json.dumps({k: sorted(v)[:6] for k, v in sorted(seen.items())}))
