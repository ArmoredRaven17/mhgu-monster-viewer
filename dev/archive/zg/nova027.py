"""Teostra's nova machine 0xe17ce8 (selector r1 0..8): which action reaches it, and per phase / frame gate the motions it sets and the
ids it requests through vt+0x1d0 0xe1aaf4 (id -> key [0x169d724]). CLS=uEm027_00 EM=27."""
import sys, struct, tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
mu = TR.mu
EV = []
def h(uc, addr, size, ud):
    if addr == 0xe17ce8: EV.append('NOVA sel=%d' % uc.reg_read(UC_ARM_REG_R1))
    elif addr == 0xe1aaf4: EV.append('REQ id=%d' % uc.reg_read(UC_ARM_REG_R1))
    elif addr == 0x329c40: EV.append('STOP')
    elif addr == 0x48b884: EV.append('SHELL')
for a in (0xe17ce8, 0xe1aaf4, 0x329c40, 0x48b884): mu.hook_add(UC_HOOK_CODE, h, begin=a, end=a)
T = TR.armdis.RODATA
keys = [struct.unpack_from('<i', T, 0x169d724 - TR.armdis.RO_VA + 4 * i)[0] for i in range(18)]
print('key table', keys)
for st in (1, 2, 7, 13):
    for n in range(0, 0x100):
        out = []
        for ph in range(0, 4):
            for fr in (0, 1):
                EV.clear()
                ev = TR.run(0, st, n, ph, fr, fr, 0, follows=0)
                mots = [x.split(' via')[0].split(' b5f8')[0] for x in ev if x.startswith('MOT')]
                if any(e.startswith('NOVA') for e in EV):
                    out.append('ph%d f%d %s %s' % (ph, fr, ' '.join(mots), ' '.join(EV)))
        if out: print((st, hex(n)), ' | '.join(out))
