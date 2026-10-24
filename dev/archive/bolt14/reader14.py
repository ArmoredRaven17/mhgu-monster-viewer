import struct, emu
from emu import mu, S, rf, rw
from unicorn.arm_const import *
def gi(uc): return 0x1000 + uc.reg_read(UC_ARM_REG_R1)
def gf(uc):
    uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', 1000.0 + uc.reg_read(UC_ARM_REG_R1)))[0]); return 0
def ge(uc): return 0x3000 + uc.reg_read(UC_ARM_REG_R1)
def gv(uc): return 0x4000 + uc.reg_read(UC_ARM_REG_R1)
def gh(uc): return 0x5000 + uc.reg_read(UC_ARM_REG_R1)
for int3 in (0, 1):
    st = {0x4a2470: gi, 0x4a24f8: gf, 0x4a22f0: ge, 0x4a2584: gv, 0x4a23f4: gh}
    if int3: st[0x4a2470] = lambda uc: 0xffffffff if uc.reg_read(UC_ARM_REG_R1) == 3 else 0x1000 + uc.reg_read(UC_ARM_REG_R1)
    lg, err, r0 = emu.run(0x1034260, {'r0': S}, mem={S + 0x15e8: 0xfffffeff if int3 == 0 else 0x100}, stubs=st)
    print('int3 -1' if int3 else 'int3 set', err, [l for l in lg])
    for o in range(0x15c0, 0x16c0, 4):
        w = rw(S + o)
        if w: print('  +%#x %#x %s' % (o, w, round(rf(S + o), 2) if 0x40000000 < w < 0x46000000 else ''))
