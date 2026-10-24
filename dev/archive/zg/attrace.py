"""THE ATTACK ARMS, per action (the attack-hitbox census, effects lane 2026-10-22): every hit record the class arms -- 0x7db70(e, slot,
hitId, flags) and its wrappers 0x7ded8 (flags 0) / 0x7dee0 (a named target) / 0x7df34 -- under the action tracer (tracec.py), with the
motion set at that moment and the last frame gate (0xb0968 / 0xb0974 / 0xb09a4 / 0xb09b0: s0) the action asked before it.
Phases 0..5 x ended {0,1} x frame {0,1}, follows 1.
   CLS=uEmNNN_00 EM=NN python attrace.py <variant> [statuses] > out.txt   -> one line per (action, slot, hitId, flags, motion)"""
import sys, struct, os
import tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_S0
ARMS = {0x7db70: 'arm', 0x7ded8: 'arm0', 0x7dee0: 'armT', 0x7df34: 'armX'}
GATES = {0xb0968, 0xb0974, 0xb09a4, 0xb09b0}
EV = []; LAST = {}
def hk(uc, addr, size, ud):
    if addr in GATES:
        LAST['f'] = struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0) & 0xffffffff))[0]
        return
    mot = struct.unpack('<H', uc.mem_read(TR.E + 0x4b4, 2))[0]
    r1, r2, r3 = uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), uc.reg_read(UC_ARM_REG_R3)
    flags = 0 if addr == 0x7ded8 else r3
    EV.append((ARMS[addr], r1, r2, flags, mot, round(LAST.get('f', -1.0), 1)))
for a in list(ARMS) + list(GATES): TR.mu.hook_add(UC_HOOK_CODE, hk, begin=a, end=a)
var = int(sys.argv[1], 0)
STS = [int(x, 0) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else list(range(0x12))
print('# %s' % os.environ.get('CLS'))
for st in STS:
    for n in range(0x100):
        got = {}; mots = {}
        import re as _re
        for ph in range(6):
            for e in (0, 1):
                for fr in (0, 1):
                    EV.clear(); LAST.clear(); outl = TR.run(var, st, n, ph, e, fr, 0, follows=1)
                    for l in outl:
                        m = _re.search(r'MOT L(\d+) M(\d+) \((0x[0-9a-f]+)\)', l)
                        if m and not l.startswith('  '): mots.setdefault(ph, []).append(int(m.group(3), 16))
                    for x in EV:
                        k = x[:5]
                        if k not in got: got[k] = (ph, x[5])
        # an arm made with no motion set this run (a later phase): the motion its action set last in an earlier phase
        def motOf(mot, ph):
            if mot: return mot
            for p in range(ph, -1, -1):
                if mots.get(p): return mots[p][-1]
            return 0
        got = { (k[0], k[1], k[2], k[3], motOf(k[4], v[0])): v for k, v in got.items() }
        for (kind, slot, hid, fl, mot), (ph, f) in sorted(got.items(), key=lambda kv: kv[1][0]):
            print('(%d, %#x) %s slot %d hit %#x flags %#x  motion L%d M%d  phase %d gate %s' % (st, n, kind, slot, hid, fl, (mot >> 8) & 0xf, mot & 0xff, ph, f), flush=True)
