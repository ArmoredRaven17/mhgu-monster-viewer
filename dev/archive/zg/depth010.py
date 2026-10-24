import sys, struct, tracec as TR
from unicorn.arm_const import UC_ARM_REG_S0, UC_ARM_REG_LR
from unicorn import UC_HOOK_CODE
def h(uc, addr, size, ud):
    TR.cur.setdefault('ev', []).append('DEPTH s0=%g lr=%#x' % (TR.f32r(UC_ARM_REG_S0), uc.reg_read(UC_ARM_REG_LR)))
TR.mu.hook_add(UC_HOOK_CODE, h, begin=0xbf700, end=0xbf700)
for a in sys.argv[1:]:
    st, n, ph = [int(x, 0) for x in a.split(',')]
    print('==', a); [print(' ', e) for e in TR.run(0, st, n, ph, 0, 0, 0, follows=1)[:8]]
