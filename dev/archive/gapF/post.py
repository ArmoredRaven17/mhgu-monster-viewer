# post.py -- the postures (P+0x1ba) the pulse's actions write (0xbc7f4 r1; 0xbc984 / 0xbca24 -> 1), phases 0..4 x ended
import sys, os, json
os.environ['FB_CLASS'] = 'uEm024_00'; os.environ['FB_MON'] = 'em024_00'
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import *
P = []
orig = T.hook
def hk(uc, addr, size, ud):
    if addr == 0xbc7f4: P.append(uc.reg_read(UC_ARM_REG_R1))
    if addr in (0xbc984, 0xbca24): P.append(1)
    return orig(uc, addr, size, ud)
T.mu.hook_add(T.UC_HOOK_CODE, hk)
want = {0: range(0, 7), 1: [2, 3, 0x13], 2: [3, 8, 9, 10, 11, 13, 20, 21, 22, 23], 4: [3, 5, 7, 9, 11, 12, 13, 14, 15, 16, 23], 7: [0xf, 0x10, 0x11, 0x30]}
for st, ns in want.items():
    for n in ns:
        res = []
        for ph in range(5):
            for ended in (0, 1):
                P.clear(); r = T.run(st, n, phase=ph, ended=ended)
                mots = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
                if P or mots: res.append((ph, ended, list(P), mots))
        print('%d:0x%02x' % (st, n), res[:6])
