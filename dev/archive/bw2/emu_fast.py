"""emu_bw.py (= emu13c2.py) with ONE unicorn instance reused: E / P / MG / stack rewritten per run. Same inputs, same hook."""
import struct, os
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, MG, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
except Exception: pass
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(MG, 0x1000)
mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
def hook(uc, addr, size, ud):
    uc.reg_write(UC_ARM_REG_R0, MG); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hook, begin=0x712a0, end=0x712a0)
Z = {E: bytes(0x20000), P: bytes(0x10000), MG: bytes(0x1000)}
def run(vt, motion, status, number, sever, rage, tired, posture=0, p5c=0.0, moguri=0.0, variant=0):
    for a, z in Z.items(): mu.mem_write(a, z)
    mu.mem_write(E, struct.pack('<I', vt)); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x73e0, bytes([status, number])); mu.mem_write(E + 0xb5f5, bytes([variant]))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever)); mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0])); mu.mem_write(P + 0x1ba, bytes([posture]))
    mu.mem_write(P + 0x5c, struct.pack('<f', p5c)); mu.mem_write(MG + 0x10, struct.pack('<f', moguri))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]
