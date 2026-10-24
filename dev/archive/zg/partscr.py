"""per depleted part (0x9e8d8) / hit side (0x9e8c0): the reaction script a status-10 number picks. CLS / EM env."""
import sys, tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
K = {'v': 0, 'fn': None}
def h(uc, addr, size, ud):
    if addr == K['fn']:
        uc.reg_write(UC_ARM_REG_R0, K['v']); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
TR.mu.hook_add(UC_HOOK_CODE, h, begin=0x9e8c0, end=0x9e8f0)
for st, n, fn, rng in ((10, 7, 0x9e8d8, range(0, 8)), (10, 0x72, 0x9e8d8, range(0, 8)), (10, 0x20, 0x9e8c0, range(0, 4)), (10, 0x14, 0x9e8d8, range(0, 8))):
    for v in rng:
        K['v'] = v; K['fn'] = fn
        ev = TR.run(0, st, n, 0, 0, 0, 0, follows=1)
        print((st, hex(n)), 'k=%d' % v, ' | '.join(x.strip() for x in ev if 'SCRIPT' in x or 'MOT' in x or 'CHG' in x)[:200])
