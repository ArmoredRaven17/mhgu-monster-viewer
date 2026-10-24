"""emu13c.py extended for the Brute Wyverns' words (uEm063_00 Brachydios / Raging, uEm080_00 Glavenus / Hellblade).
Adds, over emu13c.py: VFP on; the variant byte e+0xb5f5; the class block ctl = [e+0xcacc] with the two arm rows
ctl+0x20 (slot 0) / ctl+0x2c (slot 1) as u16 (written only by 0xf4653c at 0xf4679c); the posture P+0x1ba, P+0x5c (float)
and 0xbf62c (MoguriBaseOfs) answered with `mog` (Brachydios's .dtb: -1500.0) for 0x81d6c; the byte P+0x1bb (Glavenus's
heat bitfield). Every other call runs as the ROM has it (no stubs) -- the words call only 0xca170 / 0x81670 / 0x81614 /
vt+0x370 (0xa3bf4) / 0x81d6c.
   python emu_bw.py <vtable hex> <case...>
   case = motion:status:number:sever:rage:tired[:variant[:rowL[:rowR[:posture[:p5c[:b1bb]]]]]]
Prints [e+0x13f4] after the call; e+0x13f4 is zeroed first, as setMotion 0x7256c does."""
import sys, os, struct
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, CTL, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000
MOG = -1500.0
calls = []


def run(vt, motion, status, number, sever, rage, tired, variant=0, rowL=0, rowR=0, posture=0, p5c=0.0, b1bb=0, trace=False):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
    mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
    mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(CTL, 0x1000)
    mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
    mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    mu.mem_write(E, struct.pack('<I', vt))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcacc, struct.pack('<I', CTL))
    mu.mem_write(E + 0x13f4, b'\0\0\0\0')
    mu.mem_write(E + 0x73e0, bytes([status, number]))
    mu.mem_write(E + 0xb5f5, bytes([variant]))
    mu.mem_write(CTL + 0x20, struct.pack('<H', rowL))
    mu.mem_write(CTL + 0x2c, struct.pack('<H', rowR))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever))
    mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.mem_write(P + 0x1ba, bytes([posture]))
    mu.mem_write(P + 0x1bb, bytes([b1bb]))
    mu.mem_write(P + 0x5c, struct.pack('<f', p5c))
    seen = []

    def hook(uc, addr, size, ud):
        if addr == 0xbf62c:                        # MoguriBaseOfs getter: answer the .dtb's float, return
            uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', MOG))[0])
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
        if addr in (0xca170, 0x81670, 0x81614, 0xa3bf4, 0x81d6c, 0xbf62c):
            seen.append(addr)
    mu.hook_add(UC_HOOK_CODE, hook)
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=20000)
    w = struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]
    return (w, seen) if trace else w


if __name__ == '__main__':
    vt = int(sys.argv[1], 16)
    tr = '--trace' in sys.argv
    for c in [a for a in sys.argv[2:] if a != '--trace']:
        f = c.split(':')
        a = [int(x, 0) for x in f[:10]]
        p5c = float(f[10]) if len(f) > 10 else 0.0
        b = int(f[11], 0) if len(f) > 11 else 0
        r = run(vt, *a, p5c=p5c, b1bb=b, trace=tr)
        if tr:
            print('%-44s %#010x  calls %s' % (c, r[0], ' '.join('%#x' % x for x in r[1])))
        else:
            print('%-44s %#010x' % (c, r))
