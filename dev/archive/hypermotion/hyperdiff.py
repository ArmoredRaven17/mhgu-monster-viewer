"""hypermotion/hyperdiff.py (hyper-motion lane, 2026-10-27; Raven: "Ensure you check more than just the projectiles, Khezu also has
his aura attack that changes"): EVERY WAY HYPER CHANGES A CLASS'S ACTION CODE -- the class's action main (vt+0x1f4) run under
zg/tracec.py twice per (status, number, phase, ended, frame test), once with e+0xb720 = 0 and once with e+0xb720 = 1 (and the
held slots e+0xca88 / +0xca9c = the first group-0 / group-1 IDs, e+0xb736 by RANK), recording every call out of the class band
(the address and r1 / r2 / r3 / s0: arms 0x7db70.., setMotion, the rate 0xb07b4, requests, shells 0x48b884, the burst 0xca4e0 ..).
A run whose call list differs is a hyper-dependent path -- whatever field the class reads it through (an immediate census misses
e+0xb720 behind a moved base register, rom-map trap 174). Handled actions first (phase 0, any call), then the full sweep.
   python dev/archive/hypermotion/hyperdiff.py <monster id> [statuses]   -> JSON on stdout: the differing runs
Caveat: only the action main and what it calls natively; the per-frame hooks (vt+0x1ec / +0x1f0) are hookemu.py's, the shells'
own code the shells lane's, the shared code (stubbed here) is audited by the shared-band census (dev/hyper-states.md 7)."""
import sys, os, json, struct
mid = sys.argv[1]
em, var = int(mid[2:5]), int(mid[6:8])
CLASS_OF = {'em002': 'uEm001_00', 'em005': 'uEm004_00'}
os.environ['CLS'] = CLASS_OF.get(mid[:5], 'uEm%03d_00' % em)
os.environ['EM'] = str(em)
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'zg'))
import tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_S0
HA = json.load(open(os.path.join(HERE, '..', '..', '..', 'docs', 'hyper-auras.json')))
RANK = int(os.environ.get('RANK', '5'))
fd = (HA.get(mid) or {}).get('g' if RANK > 4 else 'normal') or (HA.get(mid) or {}).get('g') or {}
g0 = next((a['id'] for a in fd.get('auras', []) if a['group'] == 0), 0)
g1 = next((a['id'] for a in fd.get('auras', []) if a['group'] == 1), 0)
os.environ['QRANK'] = str(RANK)
LO, HI = TR.C_['lo'], TR.C_['hi']
CALLS = []
HYPER = {'on': 0}


def rec(uc, addr, size, ud):
    if LO <= addr < HI or addr in TR.NATIVE or addr == TR.STOP: return
    s0 = struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0) & 0xffffffff))[0]
    CALLS.append((addr, uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), uc.reg_read(UC_ARM_REG_R3), 'nan' if s0 != s0 else round(s0, 3)))   # (nan != nan: compared as a string)


TR.mu.hook_add(UC_HOOK_CODE, rec, begin=0, end=LO - 1)
TR.mu.hook_add(UC_HOOK_CODE, rec, begin=HI, end=0x1400000)
orig = TR.mu.emu_start


import unicorn.arm_const as AC
ZREGS = [getattr(AC, 'UC_ARM_REG_R%d' % i) for i in range(1, 13)] + [getattr(AC, 'UC_ARM_REG_D%d' % i) for i in range(32)]


def start(*a, **k):
    for r in ZREGS: TR.mu.reg_write(r, 0)                 # no register state carried from the previous run (the diff is exact)
    TR.mu.reg_write(AC.UC_ARM_REG_R0, TR.E)
    TR.mu.mem_write(TR.E + 0xb720, bytes([HYPER['on'] if not CTL else 0]))
    if CTL: TR.mu.mem_write(TR.E + CTL, bytes([HYPER['on']]))   # the POSITIVE CONTROL: the same diff on a byte the action code is known to read
    TR.mu.mem_write(TR.E + 0xb736, bytes([1 if RANK > 4 else 0]))
    TR.mu.mem_write(TR.E + 0xb5f0, struct.pack('<H', em))
    if HYPER['on']:
        TR.mu.mem_write(TR.E + 0xca88, bytes([g0])); TR.mu.mem_write(TR.E + 0xca9c, bytes([g1]))
    return orig(*a, **k)


CTL = int(os.environ.get('CTL_OFF', '0'), 0)
TR.mu.emu_start = start


def one(st, n, ph, e, fr, on):
    HYPER['on'] = on; CALLS.clear()
    TR.run(var, st, n, ph, e, fr, 0, follows=1)
    # the math library (sin / cos / atan2 >= 0x13e0000) is compared by address only: its arguments carry the angle globals the
    # previous runs' native code left in .data (not hyper)
    return [c if c[0] < 0x13e0000 else (c[0], 0, 0, 0, 0) for c in CALLS]


STS = [] if (len(sys.argv) > 2 and sys.argv[2] == "99") else [int(x, 0) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else list(range(0x12))
out = {'mon': mid, 'class': os.environ['CLS'], 'ids': [g0, g1], 'rank': RANK, 'diffs': []}
handled = 0
for st in STS:
    sig = {n: one(st, n, 0, 0, 0, 0) for n in range(0x100)}
    # an unhandled number runs the status's default arm: the most common phase-0 call list of the status is that default
    from collections import Counter
    dflt = Counter(repr(v) for v in sig.values()).most_common(1)[0][0]
    for n in range(0x100):
        if repr(sig[n]) == dflt and repr(one(st, n, 0, 0, 0, 1)) == dflt: continue
        handled += 1
        for ph in range(6):
            for e in (0, 1):
                for fr in (0, 1):
                    a, b = one(st, n, ph, e, fr, 0), one(st, n, ph, e, fr, 1)
                    if a != b:
                        sa, sb = set(a), set(b)
                        out['diffs'].append({'act': '%d:0x%02x' % (st, n), 'phase': ph, 'ended': e, 'frame': fr,
                                             'off_only': ['%#x r1=%#x r2=%#x r3=%#x s0=%s' % c for c in a if c not in sb][:12],
                                             'on_only': ['%#x r1=%#x r2=%#x r3=%#x s0=%s' % c for c in b if c not in sa][:12]})
out['handled'] = handled
json.dump(out, sys.stdout, indent=0)
