# laneA/posture_any.py (effects lane A, 2026-10-25): any class's actions -> their first motion AND the posture setters called before
# it (0xbc7f4 / 0xbc984 with r1), through efx/agents/notice-scratch/probe.py (the class's action main under unicorn, its own block
# native, the rest stubbed; the posture setters are outside every class band, so they are stubbed and only their r1 is recorded).
# The method of <archive>/bolt605/posture81.py, generalised. Control: Astalos's takeoff L1 M13 shows 0xbc984 (posture 1)
# (dev/air-height.md 2.3) -- run `posture_any.py uEm081_00 1 0x1,0x2,0x3 ... L1M13`.
#   usage: posture_any.py <class> <variant> <statuses,> [filter e.g. L2M29]
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import probe as A
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1
calls = []
def ph(uc, addr, size, ud): calls.append('%#x(%d)' % (addr, uc.reg_read(UC_ARM_REG_R1)))
for a in (0xbc7f4, 0xbc984):
    A.mu.hook_add(UC_HOOK_CODE, ph, begin=a, end=a)
cls, var = sys.argv[1], int(sys.argv[2], 0)
sts = [int(x, 0) for x in sys.argv[3].split(',')]
want = sys.argv[4].split(',') if len(sys.argv) > 4 else None
for st in sts:
    for n in range(0x100):
        calls.clear()
        r = A.probe(cls, st, n, 1, var)
        h = r['hit']
        if 'unhandled' in h: continue
        mo = r.get('motion')
        tag = 'L%dM%d' % mo if mo else ''
        if want and tag not in want: continue
        print('(%d, %#x): %s  posture: %s' % (st, n, h, ' '.join(calls) or '-'))
