import os,sys
os.environ['FB_CLASS'] = 'uEm024_00'; os.environ['FB_MON'] = 'em024_00'
sys.argv=['x']
import trgen as T
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
ENT = {0xdf96a8: 'F96a8', 0xdf2670: 'F2670', 0xdf8c28: 'F8c28', 0xdf9328: 'F9328', 0xdfa768: 'Fa768', 0xdf8610: 'F8610', 0xdf8ac8: 'F8ac8', 0xdfa60c: 'Fa60c', 0xdfaa6c: 'Faa6c', 0xdf95bc: 'F95bc'}
got = []
def h(uc, addr, size, ud):
    if addr in ENT: got.append('%s(%d,%d)' % (ENT[addr], uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)))
for a in ENT: T.mu.hook_add(UC_HOOK_CODE, h, begin=a, end=a)
for n in range(0x00, 0x48):
    got.clear(); T.run(7, n, 0, 0, 0, stub={0x3a8430: 5})
    if got: print('7:%#04x' % n, ' '.join(sorted(set(got))))
