# phases 0..7 of (7, 0x32 / 0x34 / 0x35 / 0x33) under trgen: the changes, motions, creates
import os, sys
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
os.environ['FB_CLASS'] = 'uEm086_00'; os.environ['FB_MON'] = 'em086_00'
sys.path.insert(0, FB); sys.argv = ['x']
import trgen as T
SC = ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'landed': 1}, {'timer': 1}, {'landed': 1, 'ended': 1, 'timer': 1, 'frame': 1, 'frame2': 1})
for n in [int(x, 0) for x in sys.argv[1:]] if len(sys.argv) > 1 else (0x32, 0x34, 0x35, 0x33):
    for ph in range(8):
        for sc in SC:
            for own in (1, 0):
                r = T.run(7, n, ph, 0, 0, stub={0x3a8430: 5}, own7420=own, **sc)
                ev = [e for e in r.get('ev', []) if e[0] in ('chg', 'mot', 'create')]
                if ev or r.get('end'): print('(7,%#x) p%d %s own%d' % (n, ph, sc, own), ev, r.get('end', ''))
