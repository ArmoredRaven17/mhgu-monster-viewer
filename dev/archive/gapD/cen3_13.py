# census: statuses 1, 2, 3, 12, 13 numbers 0..0x20, phases 0..6, scenarios: the creates, the changes, the motions
import os, sys
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
os.environ['FB_CLASS'] = 'uEm086_00'; os.environ['FB_MON'] = 'em086_00'
sys.path.insert(0, FB); args = sys.argv[1:]; sys.argv = ['x']
import trgen as T
SC = ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'landed': 1}, {'timer': 1}, {'frame': 1, 'frame2': 1, 'ended': 1, 'timer': 1, 'landed': 1})
for st in [int(x, 0) for x in args[0].split(',')]:
    for n in range(0, int(args[1], 0) if len(args) > 1 else 0x20):
        cr, ch, mo = set(), set(), {}
        for ph in range(8):
            for sc in SC:
                for rg in (0, 1):
                    r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5}, rage=rg, **sc)
                    for e in r.get('ev', []):
                        if e[0] == 'create': cr.add('%s m%d p%d f%s @%s' % (e[1], e[2], ph, e[6], e[5]))
                        if e[0] == 'chg': ch.add('p%d->(%d,%#x)' % (ph, e[1] & 0xff, e[2] & 0xff))
                        if e[0] == 'mot': mo.setdefault(ph, set()).add(e[1])
        if cr or ch or mo:
            print('(%d,%#x)' % (st, n), 'CREATES', sorted(cr), 'CHG', sorted(ch), 'MOT', ' | '.join('p%d %s' % (k, '/'.join(sorted(v))) for k, v in sorted(mo.items())))
