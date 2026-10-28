# laneA4/sink4/players.py (lane A4, 2026-10-26): every action's phase-0 first motion and the posture setter calls before it
# (laneA/posture_any.py's method over notice-scratch/probe.py), for the classes in sink4.json, variant 0 and 4 / 5 where they exist.
# -> players.json {class|variant: {"s,n": [clip, [postures]]}}. Used by gen_js.py: a clip whose phase-0 players include an action that
# sets no posture 4 (and is not a sink action) is a SHARED clip -- the sink then needs the play's own action.
import sys, json, os
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import probe as A
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1
calls = []
def ph(uc, addr, size, ud): calls.append(uc.reg_read(UC_ARM_REG_R1) if addr == 0xbc7f4 else 1)
for a in (0xbc7f4, 0xbc984): A.mu.hook_add(UC_HOOK_CODE, ph, begin=a, end=a)
H = os.path.dirname(os.path.abspath(__file__))
jobs = [x.split(':') for x in sys.argv[1].split(',')]     # class:em:variant
out = {}
for cls, em, var in jobs:
    d = out.setdefault('%s|%s|%s' % (cls, em, var), {})
    for st in range(16):
        for n in range(0x100):
            calls.clear()
            r = A.probe(cls, st, n, int(em, 0), int(var, 0))
            if 'unhandled' in r['hit']: continue
            mo = r.get('motion')
            if mo: d['%d,%d' % (st, n)] = ['%d|Motion[%d]' % mo, list(calls)]
    print(cls, em, var, len(d), flush=True)
json.dump(out, open(os.path.join(H, 'players_%s.json' % sys.argv[2]), 'w'))
