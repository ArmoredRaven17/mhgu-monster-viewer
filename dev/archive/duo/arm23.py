import tracer as t
from unicorn.arm_const import *
# her 1:0x21..0x24 (and 1:0x1c), every phase x link x scenario: the hit-record arming calls 0x7db70 (unit, index, hitId, FLAGS)
# -- flags bit 0x400 puts 0x80 on the hit object (+0x30), which 0x168f20 reads as "skip the partner exclusion"
seen = set()
orig = t.hook
def hook(uc, addr, size, ud):
    if addr in (0x7db70, 0x7ded8):
        seen.add((cur_act, addr, uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), uc.reg_read(UC_ARM_REG_R3), uc.reg_read(UC_ARM_REG_LR)))
t.mu.hook_add(t.UC_HOOK_CODE, hook, begin=0x7db70, end=0x7ded9)
for n in (0x1c, 0x21, 0x22, 0x23, 0x24):
    for ph in range(6):
        for link in (0, 1):
            for scn in ({}, {'frame': 1}, {'frame': 1, 'ended': 1, 'ptest': 'all', 'timer': 1}):
                cur_act = '1:%#x ph%d' % (n, ph)
                t.run('uEm069_00', 1, n, phase=ph, link=link, sc=dict(scn), extra=[(t.E + 0x7420, b'\1')])
for s in sorted(seen): print(s[0], hex(s[1]), 'idx', s[2], 'hitId %#x' % s[3], 'flags %#x' % s[4], 'lr %#x' % s[5])
