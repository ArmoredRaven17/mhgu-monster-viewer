import sys, struct, tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_PC, UC_ARM_REG_R0
hits = []
def h(uc, a, s, u): hits.append(a)
TR.mu.hook_add(UC_HOOK_CODE, h, begin=0xd162b8, end=0xd16900)
_ret = TR.ret
def ret(uc, val):
    if uc.reg_read(UC_ARM_REG_PC) == 0xbf52c: val = 1
    _ret(uc, val)
TR.ret = ret
for ph in tuple(int(x) for x in sys.argv[1].split(",")):
    hits.clear()
    ev = TR.run(0, 7, 0, ph, 0, 0, 0, follows=0)
    print(ph, [x for x in ev if 'MOT' in x], 'min %#x max %#x' % (min(hits), max(hits)) if hits else 'none', ' '.join('%x' % a for a in hits if a in (0xd167a0, 0xd167bc, 0xd167c0, 0xd16648, 0xd166e4, 0xd16718)))
