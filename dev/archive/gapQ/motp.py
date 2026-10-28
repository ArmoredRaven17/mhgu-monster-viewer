# motp.py <variant> <st:n,...>: every setMotion per phase of the named actions (phases 0..8, the frame / ended scenarios, rage 0 / 1)
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(sys.argv[0])))
var = int(sys.argv[1]); acts = [tuple(int(x, 0) for x in a.split(':')) for a in sys.argv[2].split(',')]
src = open(os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), 'cen063.py')).read().split('for st in st_list:')[0]
src = src.replace('os.path.dirname(os.path.abspath(__file__))', repr(os.path.dirname(os.path.abspath(sys.argv[0]))))
sys.argv = ['x', '7', str(var), '0']
exec(src)
for st, n in acts:
    out = {}
    for ph in range(9):
        for scn in ({'frame': 1, 'frame2': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}, {'frame': 0, 'frame2': 0}, {'frame': 0, 'frame2': 0, 'ended': 1}):
            for rg in (0, 1):
                r = T.run(st, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE, **scn)
                for e in r.get('ev', []):
                    if e[0] == 'mot': out.setdefault('p%d' % ph, set()).add('%s@%s%s' % (e[1], e[4], ' r1' if rg else ''))
    print('%d:%#04x' % (st, n), {k: sorted(v) for k, v in sorted(out.items())})
