# the ROM's 0x4187c in unicorn over random bitmaps (a de Bruijn table at +0x770), the cases written for the JS native
import sys, struct, random, json
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
T = armdis.TEXT
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
MGR, STK, STOP = 0x60000000, 0x61000000, 0x62000000
mu.mem_map(MGR, 0x2000); mu.mem_map(STK - 0x10000, 0x10000); mu.mem_map(STOP, 0x1000)
C = 0x03f566ed27179461
tab = [0x40] * 64
for k in range(64): tab[((C << k) & 0xffffffffffffffff) >> 58] = k
mu.mem_write(MGR + 0x770, struct.pack('<64I', *tab))
random.seed(7); cases = []
for n in range(3000):
    words = []
    for k in range(15):
        r = random.random()
        words.append(0xffffffff if r < 0.6 else (0xffffffff ^ (1 << random.randrange(32))) if r < 0.8 else random.getrandbits(32))
    bank = random.choice([0, 1, 2, 3, 7])
    mu.mem_write(MGR + 0x74, struct.pack('<15I', *words))
    mu.reg_write(UC_ARM_REG_R0, MGR); mu.reg_write(UC_ARM_REG_R1, bank); mu.reg_write(UC_ARM_REG_R4, 0x1234)
    mu.reg_write(UC_ARM_REG_SP, STK - 0x100); mu.reg_write(UC_ARM_REG_LR, STOP)
    mu.emu_start(0x4187c, STOP, count=2000)
    cases.append({'bank': bank, 'words': words, 'r0': mu.reg_read(UC_ARM_REG_R0), 'r4': mu.reg_read(UC_ARM_REG_R4)})
json.dump({'tab': tab, 'cases': cases}, open('poolctl.json', 'w'))
print(len(cases), 'full:', sum(c['r0'] == 0xffffffff for c in cases), 'word>0:', sum(c['r0'] != 0xffffffff and c['r0'] >= 32 for c in cases))
