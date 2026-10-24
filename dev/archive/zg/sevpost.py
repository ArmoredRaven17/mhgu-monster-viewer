import sys, tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
K = {'v': 6}
def h(uc, addr, size, ud):
    if addr == 0x9e8d8:
        uc.reg_write(UC_ARM_REG_R0, K['v']); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
TR.mu.hook_add(UC_HOOK_CODE, h, begin=0x9e8d8, end=0x9e8d8)
for n in (0x72, 7, 0x14):
    for post in range(0, 8):
        for part in (6, 0):
            K['v'] = part
            TR.mu.mem_write(TR.P + 0x1ba, bytes([post]))
            ev = TR.run(0, 10, n, 0, 0, 0, 0, follows=2)
            print((10, hex(n)), 'posture', post, 'part', part, ' | '.join(x.strip() for x in ev if 'SCRIPT' in x or 'MOT' in x)[:200])
