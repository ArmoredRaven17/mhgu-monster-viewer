# chooser082.py -- 0x104b540(e, k, r2) run natively for every k, its three stack tables read out (A: actions whose thresholds are
# 100 / 100 / 100; B: (7, 0x5d) -- 0 / 100; C: (7, 0x10) with x >= 10), and the -1 gates checked with their predicates forced
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
import emu
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
E = emu.Emu(); uc = E.uc
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    E.call(fn, (), tag='init', budget=2_000_000)
EN = emu.SCRATCH_LO + 0x10000
ANS = {0x81614: 0, 0x1036e24: 0, 0x103780c: 0}
def ret(v):
    uc.reg_write(UC_ARM_REG_R0, v & 0xffffffff); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
for a in ANS:
    uc.hook_add(UC_HOOK_CODE, (lambda a: (lambda u, ad, s, d: ret(ANS[a])))(a), begin=a, end=a)
def choose(n, k, r2=0, h=0):
    uc.mem_write(EN, b'\0' * 0xd000)
    uc.mem_write(EN + 0x73e0, bytes([7, n])); uc.mem_write(EN + 0x73e8, struct.pack('<H', h))
    r = E.call(0x104b540, (EN, k, r2))
    assert E.fault is None, E.fault
    return struct.unpack('<i', struct.pack('<I', r & 0xffffffff))[0]
def x_of(k, r2, h): return ((r2 + k) * 0x17 + h + 0x9c4) & 0xffff
def h_for(k, r2, want):            # an e+0x73e8 that puts x at `want` (mod 100)
    for h in range(0, 0x10000):
        if x_of(k, r2, h) % 100 == want: return h
A = [choose(0, k) for k in range(30)]
B = [choose(0x5d, k) for k in range(30)]
C = [choose(0x10, k, 0, h_for(k, 0, 50)) for k in range(30)]
B10 = [choose(0x10, k, 0, h_for(k, 0, 5)) for k in range(30)]
print('A', A); print('B', B); print('C', C); print('B via 0x10 x<10', B10, B10 == B)
print('other action (0x02):', [choose(2, k) for k in range(5)])
ANS[0x81614] = 1; print('tired A', A, [choose(0, k) for k in range(30)]); ANS[0x81614] = 0
ANS[0x1036e24] = 1; print('p1 A', [choose(0, k) for k in range(30)]); ANS[0x1036e24] = 0
ANS[0x103780c] = 1; print('p2 A', [choose(0, k) for k in range(30)]); ANS[0x103780c] = 0
print('x for 0x10 at h=0:', [(k, x_of(k, 0, 0) % 100) for k in range(30)])
