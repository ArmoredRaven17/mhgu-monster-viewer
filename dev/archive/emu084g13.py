import sys, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\build\hitzone-states')
from meatemu import Run, E, P
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
VT = 0x17f11fc
d = json.load(open(r'C:\MHGU-Extract\build\hitzone-states\nak-clips.json'))
print('nak-clips 7/02', d.get('7/02'), '7/06', d.get('7/06'), '7/07', d.get('7/07'))
for stance in (1, 2):
    eb = {0x73e0: 13, 0x73e1: 0}
    for k, b in enumerate(struct.pack('<I', stance)): eb[0xcac4 + k] = b
    r = Run(VT, 0x107a250, mid='em084_00', enemy_bytes=eb, budget=1)
    log = []
    def latch(uc, a, s, u):
        w = struct.unpack('<I', uc.mem_read(E + 0x13f4, 4))[0]
        ph = uc.mem_read(P + 0x1a1, 1)[0]
        log.append((hex(uc.reg_read(UC_ARM_REG_R6)), hex(w), 'phase', ph))
    r.mu.hook_add(UC_HOOK_CODE, latch, begin=0x725d8, end=0x725d8)
    def yes(uc, a, s, u):
        uc.reg_write(UC_ARM_REG_R0, 1); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    for a in (0xb09c8, 0x7206c, 0x72714):
        r.mu.hook_add(UC_HOOK_CODE, yes, begin=a, end=a)
    for f in range(8):
        r.err = None
        r.again(0x107a250, budget=800000)
        if r.err: print('err', r.err); break
    print('stance', stance, log)
