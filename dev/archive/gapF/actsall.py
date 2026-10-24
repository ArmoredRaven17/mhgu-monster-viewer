# actsall.py -- every (status, n) of uEm024_00 -> the clips its action main sets (trgen, phases 0..4 x ended 0 / 1), and the turn
# tables it hands 0x7a258 / 0x7a27c (their three motions read from the table: +0x10 / +0x20 / +0x30)
import sys, os, json
os.environ['FB_CLASS'] = 'uEm024_00'; os.environ['FB_MON'] = 'em024_00'
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
sys.argv = ['x']
import trgen as T
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
from unicorn.arm_const import *
turns = []; shared = []
orig = T.hook
def hk(uc, addr, size, ud):
    if addr in (0x7a258, 0x7a27c, 0x7a284, 0x7a2a8, 0x7a2b0, 0x7a2d4): turns.append(uc.reg_read(UC_ARM_REG_R1))
    if addr == 0xca050: shared.append(1)
    return orig(uc, addr, size, ud)
T.mu.hook_add(T.UC_HOOK_CODE, hk)
def tmot(t):
    return ['L%d M%d' % ((armdis.u32(t + o) >> 8) & 0xf, armdis.u32(t + o) & 0xff) for o in (0x10, 0x20, 0x30)]
out = {}
for st in range(0, 16):
    for n in range(0, 0x90):
        mots = []; tb = set(); sh = False
        for ph in range(5):
            for ended in (0, 1):
                turns.clear(); shared.clear()
                r = T.run(st, n, phase=ph, ended=ended)
                for e in r.get('ev', []):
                    if e[0] == 'mot' and e[1] not in mots: mots.append(e[1])
                for t in turns:
                    if t not in tb:
                        tb.add(t)
                        for m in tmot(t):
                            if m not in mots: mots.append(m + ' (turn %#x)' % t)
                if shared: sh = True
        if mots or not sh: 
            if mots: out['%d:0x%02x' % (st, n)] = mots
        else: out['%d:0x%02x' % (st, n)] = ['(shared 0xca050)']
json.dump(out, open('actsall024.json', 'w'), indent=0)
print(len(out))
