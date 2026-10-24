"""Run a static initializer under unicorn with .bss mapped; stub every bl outside [lo,hi); dump given ranges as u16."""
import sys, struct
from unicorn import *
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
T = open(EX + r'\main.text','rb').read(); RO = open(EX + r'\main.rodata','rb').read(); D = open(EX + r'\main.data','rb').read()
fn, end = int(sys.argv[1],16), int(sys.argv[2],16)
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
pg = lambda n: (n + 0xfff) & ~0xfff
mu.mem_map(0, pg(len(T))); mu.mem_write(0, T)
mu.mem_map(0x13EF000, pg(len(RO))); mu.mem_write(0x13EF000, RO)
mu.mem_map(0x1728000, 0x2000000 - 0x1728000 + 0x1000000); mu.mem_write(0x1728000, D)
mu.mem_map(0x50000000, 0x100000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
STOP = 0x50080000
def hook(uc, a, s, u):
    if a == STOP: return
    if not (fn <= a < end):
        uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hook)
mu.reg_write(UC_ARM_REG_SP, 0x50070000); mu.reg_write(UC_ARM_REG_LR, STOP)
mu.emu_start(fn, STOP, count=200000)
for r in sys.argv[3:]:
    a, n = [int(x,16) for x in r.split(':')]
    b = bytes(mu.mem_read(a, n))
    print(hex(a), ' '.join('%04x' % x for x in struct.unpack('<%dH' % (n//2), b)))
