# tracecmp.py <case index>: the ROM's instruction trace (pc, s0..s31, r0..r15 at each instruction) for one t3diff case -> tr_rom.json
import sys, json, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\arm'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import emu
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
E = emu.Emu(); uc = E.uc
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    E.fault = None; E.call(fn, (), tag='init', budget=2_000_000)
cases = json.load(open('t3diff.json'))
c = cases[int(sys.argv[1])]
BLK = emu.HEAP_LO + 0xf00000; A, B, OUT = BLK, BLK + 0x40, BLK + 0x80
uc.mem_write(A, struct.pack('<12f', *c['A'][0], 0, *c['A'][1], 0, c['A'][2], 0, 0, 0))
uc.mem_write(B, struct.pack('<12f', *c['B'][0], 0, *c['B'][1], 0, c['B'][2], 0, 0, 0))
TR = []
for k in range(32): uc.reg_write(UC_ARM_REG_S0 + k, 0)
FN = (0x167f70, 0x7dda24, 0x7dc9a0, 0x806ce4, 0x7db964, 0x7ebfd8, 0x80017c, 0x80448c, 0x8060ac, 0x8069d8)
def hk(u, addr, size, ud):
    if 0x13ecc14 <= addr < 0x13ecc30 or addr >= 0x13ef000: return
    s = [struct.unpack('<f', struct.pack('<I', u.reg_read(UC_ARM_REG_S0 + k) & 0xffffffff))[0] for k in range(32)]
    TR.append([addr, s, [u.reg_read(UC_ARM_REG_R0 + k) for k in range(13)]])
uc.hook_add(UC_HOOK_CODE, hk, begin=0x160000, end=0x810000)
r0 = E.call(0x167f70, (A, B, BLK + 0x80), tag='t', budget=200000)
json.dump(TR, open('tr_rom.json', 'w'))
print('r0', r0, 'steps', len(TR))
