"""As sweepmot.py, but every non-MOT request-side event per action: U1400 (0xa499c), SCRIPT, TURN, CALL. CLS / EM / OLD as there."""
import sys, re, tracec as TR
var = int(sys.argv[1], 0)
for st in range(0, 0x12):
    for n in range(0, 0x100):
        seen = set()
        for ph in range(0, 4):
            for e in (0, 1):
                for x in TR.run(var, st, n, ph, e, e, 0, follows=1):
                    x = x.strip()
                    if x.startswith('U1400') or x.startswith('SCRIPT') or x.startswith('TURN'): seen.add(x + ' ph%d' % ph)
        if seen: print('(%d,%#04x) %s' % (st, n, ' | '.join(sorted(seen))))
