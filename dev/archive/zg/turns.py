import sys, tracec as TR
var = int(sys.argv[1], 0)
seen = {}
for st in range(0, 0x12):
    for n in range(0, 0x100):
        for ph in range(0, 3):
            ev = TR.run(var, st, n, ph, 0, 0, 0, follows=1)
            pre = [x.split()[1] + ':' + x.split()[2][3:] for x in ev if x.strip().startswith('CALL')]
            for x in ev:
                if 'TURN' in x:
                    k = x.strip()
                    seen.setdefault(k, []).append('(%d,%#x) ph%d [%s]' % (st, n, ph, ','.join(pre)))
for k, v in seen.items():
    print(k, '::', ' '.join(v[:40]), '...' if len(v) > 40 else '')
