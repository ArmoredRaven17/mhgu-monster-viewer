import sys, os, json, struct
sys.path.insert(0, r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\actmot')
import amtrace as A
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
CAP = []
def f32(r): return struct.unpack('<f', struct.pack('<I', A.mu.reg_read(r) & 0xffffffff))[0]
def hk(uc, addr, size, ud):
    if addr in A.FRAME: CAP.append((hex(addr), uc.reg_read(UC_ARM_REG_R1), round(f32(UC_ARM_REG_S0), 2), round(f32(UC_ARM_REG_S1), 2), hex(uc.reg_read(UC_ARM_REG_LR))))
for a in A.FRAME: A.mu.hook_add(UC_HOOK_CODE, hk, begin=a, end=a)
var, st, n = int(sys.argv[1]), int(sys.argv[2], 0), int(sys.argv[3], 0)
for ph in range(int(sys.argv[4]), int(sys.argv[5]) + 1):
    for sub in (0,):
        for e, f in ((0, 0), (0, 1), (1, 1)):
            for r in (0, 1):
                CAP.clear()
                ev, stubs, ob, nph, err = A.run(var, st, n, ph, sub, e, f, r)
                print(ph, sub, e, f, r, '->', nph, A.mu.mem_read(A.P + 0x1a2, 1)[0], [x for x in ev if x[0] in 'MC'], 'FRAME', CAP[:6])
