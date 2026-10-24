# actsall2.py -- actsall024.json widened: each action with clips run again with the frame tests passing (frame / frame2 = 1),
# landed = 1, rage / tired = 1, and posture 1 / 3; clips merged into actsall024b.json
import sys, os, json
os.environ['FB_CLASS'] = 'uEm024_00'; os.environ['FB_MON'] = 'em024_00'
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
sys.argv = ['x']
import trgen as T
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
from unicorn.arm_const import *
turns = []
orig = T.hook
def hk(uc, addr, size, ud):
    if addr in (0x7a258, 0x7a27c, 0x7a284, 0x7a2a8, 0x7a2b0, 0x7a2d4): turns.append(uc.reg_read(UC_ARM_REG_R1))
    return orig(uc, addr, size, ud)
T.mu.hook_add(T.UC_HOOK_CODE, hk)
tmot = lambda t: ['L%d M%d' % ((armdis.u32(t + o) >> 8) & 0xf, armdis.u32(t + o) & 0xff) for o in (0x10, 0x20, 0x30)]
d = json.load(open('actsall024.json'))
out = {k: [m.split(' (')[0] for m in v] for k, v in d.items() if v != ['(shared 0xca050)']}
for k in list(out):
    st, n = int(k.split(':')[0]), int(k.split(':')[1], 16)
    for ph in range(6):
        for ended in (0, 1):
            for kw in ({'frame': 1, 'frame2': 1}, {'landed': 1}, {'frame': 1, 'frame2': 1, 'landed': 1}, {'rage': 1}, {'tired': 1},
                       {'poke': {T.P + 0x1ba: [1]}}, {'poke': {T.P + 0x1ba: [3]}}, {'timer': 1}):
                turns.clear()
                r = T.run(st, n, phase=ph, ended=ended, **kw)
                ms = [e[1] for e in r.get('ev', []) if e[0] == 'mot'] + [m for t in turns for m in tmot(t)]
                for m in ms:
                    if m not in out[k]: out[k].append(m)
json.dump(out, open('actsall024b.json', 'w'), indent=0)
print('done', len(out))
