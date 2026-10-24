import sys, os, json
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
sys.path.insert(0, SP + r'\fb')
os.environ['FB_CLASS'] = 'uEm025_00'; os.environ['FB_MON'] = 'em025_00'
SET = [0xe03c78, 0xe0496c, 0xe06b04, 0xe0d5e8, 0xe0def4]
os.environ['FB_WATCH'] = ','.join(hex(a) for a in SET)
sys.argv = ['x']
import trgen as T
for st, n in [(1, 0x11), (1, 0x16), (2, 0x14), (13, 0)]:
    for ph in range(5):
        for sc in ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}):
            r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5}, **sc)
            ev = [e for e in r.get('ev', []) if e[0] in ('mot', 'watch', 'ftest', 'ftest2', 'chg')]
            if any(e[0] == 'watch' for e in ev) or sc == {}:
                print((st, hex(n), ph, sc), json.dumps(ev)[:600], r.get('end', ''))
