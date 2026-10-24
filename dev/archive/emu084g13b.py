import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\hitzone-states')
from meatemu import Run, E, P
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
VT = 0x17f11fc
def word(motion, g, i, phase):
    r = Run(VT, 0x106cae8, mid='em084_00', enemy_bytes={0x73e0: g, 0x73e1: i}, p_bytes={0x1a1: phase}, args=(motion,), budget=20000)
    return struct.unpack('<I', r.mu.mem_read(E + 0x13f4, 4))[0]
for stance in (1, 2):
    eb = {0x73e0: 13, 0x73e1: 0}
    for k, b in enumerate(struct.pack('<I', stance)): eb[0xcac4 + k] = b
    r = Run(VT, 0x107a250, mid='em084_00', enemy_bytes=eb, budget=1)
    log = []
    def setm(uc, a, s, u):
        ph = uc.mem_read(P + 0x1a1, 1)[0]
        m = uc.reg_read(UC_ARM_REG_R1)
        log.append((hex(m), 'phase', ph, 'word', hex(word(m, 13, 0, ph))))
        uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    r.mu.hook_add(UC_HOOK_CODE, setm, begin=0xafce8, end=0xafce8)
    def yes(uc, a, s, u):
        uc.reg_write(UC_ARM_REG_R0, 1); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    def stub(uc, a, s, u):
        log.append(("stub", hex(a), "phase", uc.mem_read(P + 0x1a1, 1)[0])); uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    for a in (0xbf62c, 0xbf700, 0x7c9fc, 0x7b518, 0xbc7f4):
        r.mu.hook_add(UC_HOOK_CODE, stub, begin=a, end=a)
    def tail(uc, a, s, u): uc.reg_write(UC_ARM_REG_PC, 0x7F000000)
    r.mu.hook_add(UC_HOOK_CODE, tail, begin=0x107a4f4, end=0x107a4f4)
    for a in (0xb09c8, 0x7206c, 0x72714):
        r.mu.hook_add(UC_HOOK_CODE, yes, begin=a, end=a)
    for f in range(8):
        r.err = None
        r.again(0x107a250, budget=800000)
        if r.err: print('err frame', f, r.err); break
    print('stance', stance, log)
