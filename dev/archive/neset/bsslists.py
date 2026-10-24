# bsslists.py: who writes Neset's run-time event rows (0x2132a28.. 8 x 0x2c) during the static initialisers, and what they hold
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
import emu
from unicorn import UC_HOOK_MEM_WRITE
E = emu.Emu(); uc = E.uc
W = {}
def onw(uc_, access, addr, size, value, user):
    if 0x2132968 <= addr < 0x2132b90:
        pc = uc_.reg_read(emu.UC_ARM_REG_PC) if hasattr(emu, 'UC_ARM_REG_PC') else None
        W.setdefault(cur[0], set()).add(addr)
cur = [None]
uc.hook_add(UC_HOOK_MEM_WRITE, onw)
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    cur[0] = fn; E.fault = None
    E.call(fn, (), tag='init', budget=2_000_000)
for fn, s in W.items(): print('init fn', hex(fn), 'wrote', len(s), 'bytes from', hex(min(s)), 'to', hex(max(s)))
for i, a in enumerate(range(0x2132a28, 0x2132b88, 0x2c)):
    b = bytes(uc.mem_read(a, 0x2c))
    typ, mot, kind = struct.unpack_from('<III', b, 0); fl = struct.unpack_from('<5f', b, 0xc); args = struct.unpack_from('<3f', b, 0x20)
    print(hex(a), 'type', typ, 'motion', hex(mot), 'kind', kind, 'f', fl, 'raw14', b[0x14], struct.unpack_from('<I', b, 0x18)[0], 'args', args)
