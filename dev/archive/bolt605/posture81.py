# posture81.py (effects lane, 2026-10-25): Boltreaver's actions -> their first motion AND the posture they set before it. Runs
# efx/agents/boltreaver-scratch/actprobe81.py's harness (uEm081_00's action main, class band 0x1010f54..0x10312ac, everything
# outside stubbed) for status S, numbers 0..0xff, variant 4, recording each call to the posture setters 0xbc7f4 / 0xbc984 with r1.
# Control: Astalos's takeoff L1 M13 must show 0xbc984 (posture 1) -- dev/air-height.md 2.3 (0x101d348).
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\boltreaver-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import actprobe81 as A
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1
calls = []
def ph(uc, addr, size, ud): calls.append('%#x(%d)' % (addr, uc.reg_read(UC_ARM_REG_R1)))
for a in (0xbc7f4, 0xbc984):
    A.mu.hook_add(UC_HOOK_CODE, ph, begin=a, end=a)
want = sys.argv[2] if len(sys.argv) > 2 else None
for st in [int(x, 0) for x in sys.argv[1].split(',')]:
    for n in range(0x100):
        calls.clear()
        r = A.probe(st, n, 0, 4, 0x51)
        if 'unhandled' in r: continue
        if want and want not in r: continue
        print('(%d, %#x): %s  posture: %s' % (st, n, r, ' '.join(calls) or '-'))
