import sys, os, json
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
sys.path.insert(0, SP + r'\fb')
os.environ['FB_CLASS'] = 'uEm025_00'; os.environ['FB_MON'] = 'em025_00'
CLR = [0xe0027c,0xe02760,0xe03de4,0xe03f54,0xe0419c,0xe0435c,0xe044f8,0xe048d4,0xe054fc,0xe068f8,0xe06d30,0xe09d74,0xe09e3c,0xe0a2ec,0xe0a4cc,0xe0a6f0,0xe0b310]
SET = [0xe03c78, 0xe0496c, 0xe06b04, 0xe0d5e8, 0xe0def4]
os.environ['FB_WATCH'] = ','.join(hex(a) for a in CLR + SET)
sys.argv = ['x']
import trgen as T
ctl = bytearray(0x100); ctl[0xc] = int(os.environ.get('C0C','1')); ctl[0x16] = 1
acts = [tuple(int(y, 0) for y in x.split(':')) for x in os.environ['ACTS'].split()]
for st, n in acts:
    print('==', st, hex(n))
    for ph in range(6):
        seen = set()
        for sc in ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'timer': 1}):
            r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5}, ctl=bytes(ctl), **sc)
            ev = [e for e in r.get('ev', []) if e[0] in ('mot', 'watch', 'ftest', 'ftest2', 'chg')]
            s = json.dumps(ev)
            if s in seen or not ev: continue
            seen.add(s)
            print(' ph', ph, sc, s[:500])
