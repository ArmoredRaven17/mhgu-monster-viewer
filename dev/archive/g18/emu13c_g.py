"""emu13c.py extended for uEm018_00 (Yian Garuga / Deadeye): also sets the variant byte e+0xb5f5, the break level of
part 7 (P+0x3bc + 7*12, read by 0x9d36c), the .dtp array A at [[e+0x75f0]+0x64] (the REAL file, parsed as the loader
0x556a0 does: count = byte 8, 4-byte rows from 0x4d), and the quest-rank chain behind 0x3a8430 ([GOT 0x1831c54] =
0x1883c70 -> obj, [obj+0xa4] -> R, signed byte R+0xf).
   python emu13c_g.py <vtable hex> <case...>
   case = motion:status:number:sever:rage:tired[:variant[:taillvl[:rank[:dtp]]]]   dtp = 00 | 04 (default: by variant)
Prints [e+0x13f4] after the call. e+0x13f4 is zeroed first, as setMotion 0x7256c does."""
import sys, os, struct
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UcError
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, STK, RET = 0x40000000, 0x40100000, 0x50000000, 0x60000000
RES, ARR, QO, QR = 0x40200000, 0x40201000, 0x40202000, 0x40203000
QGLOB = 0x1883c70          # the word the GOT entry 0x1831c54 names (0xdb0db0..0xdb0db8)
DTP = {v: open(r'C:\MHGU-Extract\scratch-em\em018_0%s\enemy\dt_base\em018_0%s_dtbparts.dtp' % (v, v), 'rb').read() for v in '04'}


def arrayA(b):
    n = b[8]
    return b[0x4d:0x4d + 4 * n]


def run(vt, motion, status, number, sever, rage, tired, variant=0, taillvl=0, rank=0, dtp=None):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
    mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
    mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
    mu.mem_map(RES, 0x4000)
    mu.mem_write(E, struct.pack('<I', vt))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x13f4, b'\0\0\0\0')
    mu.mem_write(E + 0x73e0, bytes([status, number]))
    mu.mem_write(E + 0xb5f5, bytes([variant]))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever))
    mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.mem_write(P + 0x3bc + 7 * 12, bytes([taillvl]))
    mu.mem_write(E + 0x75f0, struct.pack('<I', RES))
    mu.mem_write(RES + 0x64, struct.pack('<I', ARR))
    mu.mem_write(ARR, arrayA(DTP[dtp or ('4' if variant == 4 else '0')]))
    mu.mem_write(QGLOB, struct.pack('<I', QO))
    mu.mem_write(QO + 0xa4, struct.pack('<I', QR))
    mu.mem_write(QR + 0xf, struct.pack('<b', rank))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=10000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


if __name__ == '__main__':
    vt = int(sys.argv[1], 16)
    for c in sys.argv[2:]:
        f = c.split(':')
        a = [int(x, 0) for x in f[:9]]
        dtp = f[9][-1] if len(f) > 9 else None
        print('%-36s %#010x' % (c, run(vt, *a, dtp=dtp)))
