import sys, os
os.environ['FB_CLASS'] = 'uEm024_00'; os.environ['FB_MON'] = 'em024_00'
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import *
calls = []
orig = T.hook
def hk(uc, addr, size, ud):
    if not (T.rng[0] <= addr < T.rng[1]) and addr not in T.NATIVE and addr != T.STOP:
        calls.append((hex(addr), uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), hex(uc.reg_read(UC_ARM_REG_LR))))
    return orig(uc, addr, size, ud)
T.mu.hook_add(T.UC_HOOK_CODE, hk)
for st, n in ((0, 4), (0, 5), (2, 3), (4, 5), (4, 7)):
    calls.clear(); r = T.run(st, n, phase=0)
    print('%d:0x%02x' % (st, n), r.get('end'), calls[:12])
