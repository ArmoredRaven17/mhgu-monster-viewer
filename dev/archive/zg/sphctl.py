import sys, struct, random, json
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
T = armdis.TEXT
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
V, PL, SP, STK, STOP = 0x60000000, 0x60010000, 0x60020000, 0x61000000, 0x62000000
for a in (V, PL, SP): mu.mem_map(a, 0x1000)
mu.mem_map(STK - 0x10000, 0x10000); mu.mem_map(STOP, 0x1000)
# FPU on
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
mu.mem_write(V + 0xd94, struct.pack('<I', PL | 7))
random.seed(3); cases = []
f = lambda: struct.unpack('<f', struct.pack('<f', random.uniform(-2000, 2000)))[0]
for n in range(3000):
    planes = [f() / 1000 for _ in range(24)]
    sph = [f(), f(), f(), abs(f()) / 4]
    mu.mem_write(PL, struct.pack('<24f', *planes)); mu.mem_write(SP, struct.pack('<4f', *sph))
    mu.reg_write(UC_ARM_REG_R0, V); mu.reg_write(UC_ARM_REG_R1, SP); mu.reg_write(UC_ARM_REG_LR, STOP); mu.reg_write(UC_ARM_REG_SP, STK - 0x100)
    mu.emu_start(0x881d94, STOP, count=500)
    cases.append({'planes': planes, 'sph': sph, 'r0': mu.reg_read(UC_ARM_REG_R0), 'r2': mu.reg_read(UC_ARM_REG_R2)})
json.dump(cases, open('sphctl.json', 'w'))
from collections import Counter
print(Counter('out' if c['r0'] == 0xffffffff else hex(c['r0']) for c in cases).most_common(8))
