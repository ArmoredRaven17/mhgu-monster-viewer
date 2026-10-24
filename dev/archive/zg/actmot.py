import sys, re, tracec as TR
var = int(sys.argv[1], 0)
acts = [tuple(int(x, 0) for x in a.split(',')) for a in sys.argv[2:]]
for st, n in acts:
    seen = []
    for ph in range(0, 6):
        for e in (0, 1):
            for x in TR.run(var, st, n, ph, e, e, 0, follows=1):
                m = re.search(r'MOT L(\d+) M(\d+) \((0x[0-9a-f]+)\)', x)
                if m:
                    k = 'L%s M%s(%s)ph%d' % (m.group(1), m.group(2), m.group(3), ph)
                    if not any(s.split('ph')[0] == k.split('ph')[0] for s in seen): seen.append(k)
    print((st, hex(n)), ' '.join(seen))
