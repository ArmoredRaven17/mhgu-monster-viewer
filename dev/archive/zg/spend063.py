"""spend063.py: every call of 0xf4653c(e, slot, delta) reached by Brachydios's action main, by (status, number, phase, ended/frame),
with the caller (lr) and the motions that action sets in phases <= that phase (the clip the spend sits under).
   CLS=uEm063_00 EM=63 python spend063.py <variant>"""
import sys, collections, struct
import tracec as TR
from unicorn.arm_const import UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_LR
from unicorn import UC_HOOK_CODE
hits = []
def h(uc, addr, size, ud):
    hits.append((uc.reg_read(UC_ARM_REG_LR) - 4, uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2) & 0xffffffff))
TR.mu.hook_add(UC_HOOK_CODE, h, begin=0xf4653c, end=0xf4653c)
var = int(sys.argv[1])
mots = collections.defaultdict(dict)
res = collections.defaultdict(set)
for st in (0, 1, 2, 3, 6, 7, 10):
    for n in range(0x100):
        for ph in range(6):
            for e in (0, 1):
                del hits[:]
                try:
                    ev = TR.run(var, st, n, ph, e, e, 0, follows=0)
                except Exception:
                    continue
                for x in ev:
                    if x.startswith('MOT'):
                        mots[(st, n)].setdefault(ph, x.split(' (')[0][4:])
                for lr, slot, d in hits:
                    if d >= 0x80000000: d -= 1 << 32
                    res[(lr, slot, d)].add((st, n, ph))
for (lr, slot, d), acts in sorted(res.items()):
    out = []
    for st, n, ph in sorted(acts):
        m = [mots[(st, n)][p] for p in sorted(mots[(st, n)]) if p <= ph]
        out.append('(%d,%#x)p%d %s' % (st, n, ph, m[-1] if m else '-'))
    print('%#x slot %d delta %d: %s' % (lr, slot, d, '; '.join(sorted(set(out))[:8])))
