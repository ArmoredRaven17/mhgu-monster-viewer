# run the shared frame query 0x72714 natively (via 0xb0968) on a fake unit: mode x frame -> result
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
import unicorn
T = armdis.TEXT
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try:
    mu.ctl_set_cpu_model(unicorn.arm_const.UC_CPU_ARM_MAX)
except Exception as ex:
    print('cpu model', ex)
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
E = 0x30000000; STOP = 0x50000000
mu.mem_map(E, 0x20000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
def fw(a, v): mu.mem_write(a, struct.pack('<f', v))
def sreg(r, v): mu.reg_write(r, struct.unpack('<I', struct.pack('<f', v))[0])
def q(mode, frame, s0, s1, length=283.0):
    mu.mem_write(E, b'\0' * 0x20000)
    fw(E + 0x500, frame - 1.0); fw(E + 0x13b8, 1.0); fw(E + 0x13bc, length); fw(E + 0x508, 0.0); fw(E + 0x4f4, 0.0)
    fw(E + 0x13ac, frame - 1.0); fw(E + 0x13b4, 1.0); fw(E + 0x1c, 1.0)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, mode); mu.reg_write(UC_ARM_REG_R2, 0)
    sreg(UC_ARM_REG_S0, s0); sreg(UC_ARM_REG_S1, s1)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
    mu.emu_start(0xb0968, STOP, count=2000)
    return mu.reg_read(UC_ARM_REG_R0)
for mode, s0, s1 in ((1, 120.0, 0.0), (2, 130.0, 0.0), (3, 146.0, 220.0), (9, 78.0, 146.0)):
    print('mode %d (%g, %g):' % (mode, s0, s1), ' '.join('f%d=%d' % (f, q(mode, f, s0, s1)) for f in (10, 77, 78, 100, 119, 120, 121, 129, 130, 131, 146, 147, 200, 220, 221, 260)))
