"""Request side, per action: every class request the action main makes under the fully hooked tracer (tracec.py), with the
motion set at that moment -- the shared level request 0xa499c (r1 = level -> u 1120 / 1121 / 1400 / 900 / 901 / 905 / 906)
and the class's own vt+0x1d0 (u) / vt+0x1cc (c) entries (r1 = the id). Phases 0..5 x ended {0,1} x frame {0,1}, follows 1.
   CLS=uEmNNN_00 EM=NN python reqtrace.py <variant> [statuses]   -> one line per (action, request, motion)"""
import sys, struct, os
import tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1, UC_ARM_REG_PC
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
D, DA = armdis.DATA, armdis.DA_VA
VT = TR.C_['vtable']
U = struct.unpack_from('<I', D, VT + 0x1d0 - DA)[0]; C = struct.unpack_from('<I', D, VT + 0x1cc - DA)[0]
LEVEL = {0: 1120, 1: 1121, 2: 1400, 3: 900, 4: 901, 5: 905, 6: 906}
EV = []
def hk(uc, addr, size, ud):
    if addr in (U, C, 0xa499c):
        mot = struct.unpack('<H', uc.mem_read(TR.E + 0x4b4, 2))[0]
        r1 = uc.reg_read(UC_ARM_REG_R1)
        if addr == 0xa499c: EV.append(('level', r1, 'u %s' % LEVEL.get(r1, '?'), mot))
        else: EV.append(('vt+0x1d0' if addr == U else 'vt+0x1cc', r1, ('u %d' if addr == U else 'c %d') % r1, mot))
for a in {U, C, 0xa499c}: TR.mu.hook_add(UC_HOOK_CODE, hk, begin=a, end=a)
var = int(sys.argv[1], 0)
STS = [int(x, 0) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else list(range(0x12))
print('# %s vt %#x  vt+0x1d0 %#x  vt+0x1cc %#x' % (os.environ.get('CLS'), VT, U, C))
for st in STS:
    for n in range(0x100):
        got = set()
        for ph in range(6):
            for e in (0, 1):
                for fr in (0, 1):
                    EV.clear(); TR.run(var, st, n, ph, e, fr, 0, follows=1)
                    for x in EV: got.add(x + (ph,))
        seen = set()
        for (kind, r1, key, mot, ph) in sorted(got, key=lambda x: x[4]):
            if (kind, r1, mot) in seen: continue
            seen.add((kind, r1, mot))
            print('(%d, %#x) %s r1=%d -> %s  motion L%d M%d  first at phase %d' % (st, n, kind, r1, key, (mot >> 8) & 0xf, mot & 0xff, ph), flush=True)
