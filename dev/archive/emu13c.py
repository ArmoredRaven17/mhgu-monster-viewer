"""Unicorn run of a class's enemy vt+0x13c (the PSL enable word), as the control for the static read.
   python emu13c.py <vtable hex> <case...>   case = motion:status:number:sever:rage:tired  (sever = P+0x3b4 halfword)
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


def run(vt, motion, status, number, sever, rage, tired):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
    mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
    mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
    mu.mem_write(E, struct.pack('<I', vt))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x13f4, b'\0\0\0\0')
    mu.mem_write(E + 0x73e0, bytes([status, number]))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever))
    mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=10000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


if __name__ == '__main__':
    vt = int(sys.argv[1], 16)
    for c in sys.argv[2:]:
        m, s, n, sv, rg, td = (int(x, 0) for x in c.split(':'))
        print('%-28s %#010x' % (c, run(vt, m, s, n, sv, rg, td)))
