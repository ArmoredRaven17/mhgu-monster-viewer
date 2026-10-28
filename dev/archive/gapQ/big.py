import sys, os, json
here = os.path.dirname(os.path.abspath(sys.argv[0]))
var = int(sys.argv[1]); ss = int(sys.argv[2])
src = open(os.path.join(here, 'cen063.py')).read().split('for st in st_list:')[0].replace('os.path.dirname(os.path.abspath(__file__))', repr(here))
sys.argv = ['x', '7', str(var), str(ss)]
exec(src)
for n in (0x08, 0x09, 0x14, 0x15, 0x98, 0xa5, 0xa6, 0xb0, 0xb1):
    seen = {}
    for ph in range(6):
        lits = set()
        for scn in ({'frame': 1, 'frame2': 1}, {'frame': 0, 'frame2': 0}, {'frame': 1, 'frame2': 1, 'ended': 1}):
            for rg in (0, 1):
                r = T.run(7, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE, **scn)
                for e in r.get('ev', []):
                    if e[0] == 'ftest': lits.add(e[1])
                    if e[0] == 'ftest2': lits.add(e[2][1])
                    if e[0] == 'mot': seen.setdefault('mot ' + e[1] + ' @' + e[4], set()).add('p%d' % ph)
        for L in sorted(x for x in lits if x is not None):
            for rg in (0, 1):
                r = T.run(7, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE, only=L)
                for e in r.get('ev', []):
                    if e[0] in ('create', 'mk3', 'probe'): seen.setdefault(key(e) + ' f%s' % L, set()).add('p%d r%d' % (ph, rg))
    print('7:%#04x' % n, json.dumps({k: sorted(v) for k, v in sorted(seen.items())}))
