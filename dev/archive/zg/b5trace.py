"""b5trace.py: which actions write a control-block byte, per phase / ended / frame gate, with the motion at that moment.
   CLS=uEm070_00 EM=70 python b5trace.py <variant> <off> [statuses] [init]   -> one line per (action, writer pc, value, motion, phase)
   init: the byte's value before each run (default 0)."""
import sys, struct, os
import tracec as TR
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import UC_ARM_REG_PC
var = int(sys.argv[1], 0); off = int(sys.argv[2], 0)
STS = [int(x, 0) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 and sys.argv[3] else list(range(0x12))
init = int(sys.argv[4], 0) if len(sys.argv) > 4 else 0
A = TR.C + off
EV = []
def wh(uc, access, addr, size, value, ud):
    if addr <= A < addr + size:
        v = (value >> (8 * (A - addr))) & 0xff
        mot = struct.unpack('<H', uc.mem_read(TR.E + 0x4b4, 2))[0]
        EV.append((uc.reg_read(UC_ARM_REG_PC), v, mot))
TR.mu.hook_add(UC_HOOK_MEM_WRITE, wh, begin=A & ~3, end=(A & ~3) + 3)
orig_run = TR.run
print('# %s C+%#x init %#x' % (os.environ.get('CLS'), off, init))
for st in STS:
    for n in range(0x100):
        got = {}
        for ph in range(6):
            for e in (0, 1):
                for fr in (0, 1):
                    EV.clear()
                    # the byte's value before the step
                    TR.mu.mem_write(TR.C + off, bytes([init]))
                    def pre_hook():
                        pass
                    out = TR.run(var, st, n, ph, e, fr, 0, follows=0)
                    mots = [x for x in out if x.strip().startswith('MOT')]
                    for (pc, v, mot) in EV:
                        k = (pc, v)
                        if k not in got: got[k] = (ph, e, fr, mot, mots[:2])
        for (pc, v), (ph, e, fr, mot, mots) in sorted(got.items()):
            print('(%d, %#x) pc %#x writes %#x  motion L%d M%d  phase %d ended %d frame %d  %s' % (st, n, pc, v, (mot >> 8) & 0xf, mot & 0xff, ph, e, fr, '; '.join(m.strip() for m in mots)), flush=True)
