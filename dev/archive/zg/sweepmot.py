"""Sweep a class's action main for every (status, number, phase, ended) and print the action -> motion set, one line per action.
   CLS=uEmNNN_00 EM=NN [OLD=1] python sweepmot.py <variant> > out"""
import sys, re, tracec as TR
var = int(sys.argv[1], 0)
for st in range(0, 0x12):
    for n in range(0, 0x100):
        seen = set()
        for ph in range(0, 4):
            for e in (0, 1):
                for x in TR.run(var, st, n, ph, e, e, 0, follows=1):
                    m = re.search(r'MOT L(\d+) M(\d+) \(', x)
                    if m: seen.add('L%s M%s ph%d' % (m.group(1), m.group(2), ph))
        if seen: print('(%d,%#04x) %s' % (st, n, ' '.join(sorted(seen))))
