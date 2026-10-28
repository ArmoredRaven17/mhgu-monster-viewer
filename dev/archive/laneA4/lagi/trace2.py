# laneA4/lagi/trace2.py (lane A4, 2026-10-26): one (status, number) of a class through notice-scratch/probe.py, every `bl` / `blx`
# executed inside the class band listed with r0..r3 / s0 at the call, phase by phase (P+0x1a1 forced 0..N via probe's `extra`
# hook when given). usage: trace2.py <class> <status> <number> [variant] [phase]
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import probe as A, armdis, capstone, struct
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
cls, st, n = sys.argv[1], int(sys.argv[2], 0), int(sys.argv[3], 0)
var = int(sys.argv[4], 0) if len(sys.argv) > 4 else 0
ph = int(sys.argv[5], 0) if len(sys.argv) > 5 else 0
C = A.emclasses.load()[cls] if hasattr(A, 'emclasses') else None
lo, hi = (C['lo'], C['hi']) if C else (0, 1 << 32)
log = []
def h(uc, addr, size, ud):
    i = next(md.disasm(armdis.TEXT[addr:addr + 4], addr), None)
    if i and i.mnemonic in ('bl', 'blx'):
        r = [uc.reg_read(x) for x in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        s0 = struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0)))[0]
        log.append('%#x %s %s  r1=%#x r2=%#x r3=%#x s0=%g' % (addr, i.mnemonic, i.op_str, r[1], r[2], r[3], s0))
A.mu.hook_add(UC_HOOK_CODE, h, begin=lo, end=hi)
def setph(uc):
    P = A.P if hasattr(A, 'P') else None
extra = None
r = A.probe(cls, st, n, 1, var) if ph == 0 else A.probe(cls, st, n, 1, var, extra={'phase': ph})
print('hit:', r['hit'])
print('\n'.join(log))
