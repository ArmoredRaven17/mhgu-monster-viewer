# laneB/duo/cad0watch.py: every action (status 0..16 x n 0..0xff, link 0 / 1) of uEm069_00 through its action main AND its vt+0x204,
# (and its frame handler vt+0x208 / vt+0x1dc per action: the positive control, the handles e+0xcac4..+0xcacc), with a write watch over e+0xcac0..e+0xcae0: which pcs write which offsets (e+0xcad0 = the word's L3 M2 gate byte)
import sys, collections
import tracer as t
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import UC_ARM_REG_PC, UC_ARM_REG_R1, UC_ARM_REG_R2
import armdis
W = collections.defaultdict(set)
cur = {'k': None}
def wh(uc, access, addr, size, value, ud):
    o = addr - t.E
    W[(o, uc.reg_read(UC_ARM_REG_PC), value & 0xff if size == 1 else value)].add(cur['k'])
t.mu.hook_add(UC_HOOK_MEM_WRITE, wh, begin=t.E + 0xcac0, end=t.E + 0xcadf)
cls = 'uEm069_00'
e204 = armdis.u32(t.CLS[cls]['vtable'] + 0x204)
E2 = {'f': armdis.u32(t.CLS[cls]['vtable'] + 0x208), 'd': armdis.u32(t.CLS[cls]['vtable'] + 0x1dc)}
for s in range(0, 17):
    for n in range(0x100):
        for link in (0, 1):
            cur['k'] = '%d,%#x m' % (s, n)
            try: t.run(cls, s, n, link=link)
            except Exception: pass
            cur['k'] = '%d,%#x h' % (s, n)
            try: t.run(cls, s, n, entry=e204, link=link, regs={UC_ARM_REG_R1: s, UC_ARM_REG_R2: n})
            except Exception: pass
            for tag, ent in E2.items():
                cur['k'] = '%d,%#x %s' % (s, n, tag)
                try: t.run(cls, s, n, entry=ent, link=link, extra=[(t.P + 0x1bb, bytes([2]))])
                except Exception: pass
for (o, pc, v), ks in sorted(W.items()):
    print('e+%#x pc %#x value %#x  by %d actions, e.g. %s' % (o, pc, v, len(ks), sorted(ks)[:4]))
