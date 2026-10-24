"""every handled (status, number) of a class, phases 0..3 with frame tests true: every motion it sets. env CLS / EM."""
import sys, re, tracec as TR
want = set(int(x, 16) for x in sys.argv[2].split(',')) if len(sys.argv) > 2 else None
var = int(sys.argv[1], 0)
for st in range(0, 0x12):
    for n in range(0, 0x100):
        seen = []
        for ph in range(0, 4):
            for e in (0, 1):
                for x in TR.run(var, st, n, ph, e, e, 0, follows=1):
                    m = re.search(r'MOT L(\d+) M(\d+) \((0x[0-9a-f]+)\) start (\S+)', x)
                    if m and (want is None or int(m.group(3), 16) in want):
                        k = 'L%s M%s f%s ph%d' % (m.group(1), m.group(2), m.group(4), ph)
                        if k not in seen: seen.append(k)
        if seen: print('(%d, %#04x): %s' % (st, n, ' | '.join(seen)))
