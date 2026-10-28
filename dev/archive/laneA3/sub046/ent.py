import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import probe as A
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1, UC_ARM_REG_R2
calls = []
def ph(uc, addr, size, ud): calls.append('%#x(r1=%d,r2=%d)' % (addr, uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)))
for a in (0xea6404, 0xea688c, 0xea7538, 0xea7544, 0xea7798, 0xea77c0):
    A.mu.hook_add(UC_HOOK_CODE, ph, begin=a, end=a)
var = int(sys.argv[1]) if len(sys.argv) > 1 else 0
for st in range(0x12):
    for n in range(0x100):
        calls.clear()
        r = A.probe('uEm046_00', st, n, 1, var)
        if calls: print('(%d, %#x): %s  | %s' % (st, n, ' '.join(calls), r['hit']))
