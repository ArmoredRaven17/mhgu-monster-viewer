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
random.seed(11); cases = []
for n in range(3000):
    mem = bytearray(0x770)
    words = [random.choice([0, 0xffffffff, random.getrandbits(32), 1 << random.randrange(32)]) for _ in range(15)]
    struct.pack_into('<15I', mem, 0x74, *words)
    objs = [random.choice([0, 0x5000 + random.randrange(8)]) for _ in range(432)]
    struct.pack_into('<432I', mem, 0xb0, *objs)
    mu.mem_write(MGR, bytes(mem)); mu.mem_write(MGR + 0x770, struct.pack('<64I', *tab))
    obj = random.choice([0, 0x5000 + random.randrange(8)]); kind = random.choice([0, 1, 2, 3, 5])
    mu.reg_write(UC_ARM_REG_R0, MGR); mu.reg_write(UC_ARM_REG_R1, obj); mu.reg_write(UC_ARM_REG_R2, kind)
    mu.reg_write(UC_ARM_REG_SP, STK - 0x100); mu.reg_write(UC_ARM_REG_LR, STOP)
    mu.emu_start(0x419e0, STOP, count=20000)
    after = bytes(mu.mem_read(MGR, 0x770))
    cases.append({'mem': bytes(mem).hex(), 'obj': obj, 'kind': kind, 'after': after.hex(), 'changed': after != bytes(mem)})
json.dump({'tab': tab, 'cases': cases}, open('pool2ctl.json', 'w'))
print(len(cases), 'changed', sum(c['changed'] for c in cases))
