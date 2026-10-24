# bssdump.py: the static initialisers run (build/arm emu), then the BSS vectors 0x7dc9a0 reads through the GOT, and who wrote them
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\arm'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import emu
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import UC_ARM_REG_PC
E = emu.Emu(); uc = E.uc
W = {}
def mw(u, acc, addr, size, val, ud):
    if 0x19176e0 <= addr < 0x1917710: W.setdefault(addr, []).append((hex(u.reg_read(UC_ARM_REG_PC)), hex(val & 0xffffffff)))
uc.hook_add(UC_HOOK_MEM_WRITE, mw, begin=0x19176e0, end=0x1917710)
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    E.fault = None
    E.call(fn, (), tag='init', budget=2_000_000)
for a in (0x19176e0, 0x19176f0, 0x1917700):
    print(hex(a), struct.unpack('<4f', bytes(uc.mem_read(a, 16))))
for a in sorted(W): print(hex(a), W[a][:3])
