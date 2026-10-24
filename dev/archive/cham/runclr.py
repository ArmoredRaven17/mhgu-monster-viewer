import sys, os, json
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
sys.path.insert(0, SP + r'\fb')
os.environ['FB_CLASS'] = 'uEm025_00'; os.environ['FB_MON'] = 'em025_00'
CLR = [0xdff598,0xdff7f8,0xdff8cc,0xdff9cc,0xdffcd8,0xe0027c,0xe02760,0xe03de4,0xe03f54,0xe0419c,0xe0435c,0xe044f8,0xe048d4,0xe054fc,0xe068f8,0xe06d30,0xe09d74,0xe09e3c,0xe0a2ec,0xe0a4cc,0xe0a6f0,0xe0b310]
SET = [0xe03c78, 0xe0496c, 0xe06b04, 0xe0d5e8, 0xe0def4]
os.environ['FB_WATCH'] = ','.join(hex(a) for a in CLR + SET + [0xbee74])
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import *
mode = sys.argv_mode = os.environ.get('MODE', 'main')
ARG = [0, 0]
def entry(uc, addr, size, ud):
    uc.reg_write(UC_ARM_REG_R1, ARG[0]); uc.reg_write(UC_ARM_REG_R2, ARG[1])
if mode == '204':
    T.CLS['uEm025_00']['main'] = 0xdff4f0
    T.mu.hook_add(T.UC_HOOK_CODE, entry, begin=0xdff4f0, end=0xdff4f0)
ctl = bytearray(0x100); ctl[0xc] = 1; ctl[0x15] = int(os.environ.get('PH15', '2')); ctl[0x16] = int(os.environ.get('C16', '0'))
res = {}
STS = [int(x) for x in os.environ.get("STS", ",".join(map(str, range(18)))).split(",")]
NMAX = int(os.environ.get("NMAX", "0xc0"), 0)
for st in STS:
    for n in range(0, NMAX):
        hits = set()
        phases = [0] if mode == '204' else range(6)
        scs = [{}] if mode == '204' else ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'timer': 1}, {'frame': 1, 'frame2': 1, 'ended': 1, 'timer': 1})
        for ph in phases:
            for sc in scs:
                ARG[0], ARG[1] = st, n
                r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5}, ctl=bytes(ctl), **sc)
                for e in r.get('ev', []):
                    if e[0] == 'watch': hits.add((e[1], ph, e[3]) if e[1] == '0xbee74' else (e[1], ph))
        if hits:
            res['%d:%#04x' % (st, n)] = sorted(hits)
for k, v in res.items(): print(k, v)
