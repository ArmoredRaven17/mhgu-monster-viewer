"""Lao-Shan Lung's word 0xd77ac8 with the e+0xb6ec table POPULATED: does the walk (0x7db70 / 0xb07b4 per (13, motion) entry) change
e+0x13f4? Everything native; unmapped reads map zero pages. Prints the word per case."""
import os, struct, sys
from unicorn import *
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read(); RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, CTL, STK, RET, TAB = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000, 0x40300000
VT = int(sys.argv[1], 16)
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
for b, n in ((E, 0x20000), (P, 0x10000), (CTL, 0x4000), (STK - 0x10000, 0x20000), (RET, 0x1000), (TAB, 0x4000)): mu.mem_map(b, n)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
def onbad(uc, typ, addr, size, value, ud):
    try: uc.mem_map(addr & ~0xfff, 0x2000); return True
    except Exception: return False
mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED, onbad)
calls = []
def hk(uc, addr, size, ud):
    if addr in (0x7db70, 0xb07b4): calls.append(hex(addr))
mu.hook_add(UC_HOOK_CODE, hk, begin=0x7db70, end=0xb07b4)
FN = struct.unpack_from('<I', DATA, VT + 0x13c - DA_VA)[0]
def run(motion, entries, act=(0, 0)):
    calls.clear()
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000); mu.mem_write(TAB, b'\0' * 0x4000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', CTL))
    mu.mem_write(E + 0x73e0, bytes(act))
    if entries is not None:
        mu.mem_write(E + 0x13f4 + 0xb6ec, struct.pack('<I', TAB)); mu.mem_write(TAB, struct.pack('<II', TAB + 0x100, 0))
        a = TAB + 0x100
        for kind, st, mot, f in entries:
            mu.mem_write(a, struct.pack('<IIIIIfff', kind, mot, st, 0, 0, f[0], f[1], f[2])); a += 0x24
        mu.mem_write(a, struct.pack('<I', 0))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    try: mu.emu_start(FN, RET, count=2000000); err = ''
    except Exception as ex: err = ' ERR %s pc=%#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0], list(calls), err
for motion in (0x201, 0x205, 0x001):
    for ents in (None, [(1, 13, motion, (0.0, 5.0, 0.0))], [(2, 13, motion, (2.0, 0, 0))], [(1, 13, motion + 1, (0.0, 5.0, 0.0)), (2, 13, motion, (1.5, 0, 0))]):
        w, c, err = run(motion, ents)
        print(hex(motion), ents, hex(w), c, err)
