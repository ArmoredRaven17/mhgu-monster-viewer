# ROM-run of 0x2f5bf0(player) over +0x2506 in {1, 0x80, 0x40} x +0x250a in 0..0x20, and 0x2a6640(player, H) on a fake slot
import struct
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
PL, H, OWN, BLK, STK, END = 0x30000000, 0x30100000, 0x30200000, 0x30300000, 0x30400000, 0x30500000
def mk():
    uc = Uc(UC_ARCH_ARM, UC_MODE_ARM); uc.mem_map(0, (len(T) + 0xfff) & ~0xfff); uc.mem_write(0, T)
    for b in (PL, H, OWN, BLK, STK, END): uc.mem_map(b, 0x10000)
    uc.reg_write(UC_ARM_REG_SP, STK + 0x8000); uc.reg_write(UC_ARM_REG_LR, END); return uc
res = {}
for g in (1, 0x80, 0x40):
    on = []
    for i in range(0x21):
        uc = mk(); uc.mem_write(PL + 0x2506, struct.pack('<H', g)); uc.mem_write(PL + 0x250a, struct.pack('<H', i))
        uc.reg_write(UC_ARM_REG_R0, PL); uc.emu_start(0x2f5bf0, END, count=100)
        if uc.reg_read(UC_ARM_REG_R0): on.append(hex(i))
    print('0x2f5bf0 group', hex(g), '-> 1 for +0x250a in', on)
# 0x2a6640: H+0x6d 2, H+0x10 2 (a shell), H+0x6e 1, H+0x70 the owner; owner+0x1428 -> block; block+0x1b6 = 0x1234; H+0x50 = 7
for h6d, h6e in ((2, 1), (2, 0), (1, 1)):
    uc = mk()
    uc.mem_write(H + 0x6d, bytes([h6d])); uc.mem_write(H + 0x10, bytes([2])); uc.mem_write(H + 0x6e, bytes([h6e]))
    uc.mem_write(H + 0x70, struct.pack('<I', OWN)); uc.mem_write(H + 0x50, bytes([7]))
    uc.mem_write(OWN + 0x1428, struct.pack('<I', BLK)); uc.mem_write(BLK + 0x1b6, struct.pack('<H', 0x1234))
    uc.mem_write(PL + 0x296c, b'\x55\x55\x55\x55\x55')
    uc.reg_write(UC_ARM_REG_R0, PL); uc.reg_write(UC_ARM_REG_R1, H); uc.emu_start(0x2a6640, END, count=100)
    m = uc.mem_read(PL + 0x296c, 5)
    print('0x2a6640 H+0x6d', h6d, 'H+0x6e', h6e, '-> +0x296c', m[0], '+0x296e', hex(struct.unpack('<H', m[2:4])[0]), '+0x2970', m[4])
