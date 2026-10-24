import os, sys
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
os.environ['FB_CLASS'] = 'uEm086_00'; os.environ['FB_MON'] = 'em086_00'
sys.path.insert(0, FB); args = sys.argv[1:]; sys.argv = ['x']
import trgen as T
print('tune f 0x29..0x2a', T.TUNE_F[0x29], T.TUNE_F[0x2a], 'f 0x1f', T.TUNE_F[0x1f], 'f 0x24/25/28', T.TUNE_F[0x24], T.TUNE_F[0x25], T.TUNE_F[0x28])
st, n = int(args[0], 0), int(args[1], 0)
for ph in range(int(args[2]) if len(args) > 2 else 6):
    for sc in ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'landed': 1}, {'timer': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}):
        r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5}, **sc)
        ev = [e for e in r.get('ev', []) if e[0] in ('chg', 'mot', 'create', 'ftest', 'ftest2')]
        print('(%d,%#x) p%d %s' % (st, n, ph, sc), ev, r.get('end', ''), 'raw' if r.get('raw') else '', (r.get('raw') or [''])[0][:160])
