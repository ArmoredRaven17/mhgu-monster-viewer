# laneB/duo/cad0all.py: uEm069_00 -- every vtable slot 0..0x480 run once (status 0, n 0) with the e+0xcac0..cadf write watch, and the
# memory value of e+0xcad0 after the spawn setup vt+0x1d8
import collections, tracer as t, armdis
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import UC_ARM_REG_PC
W = collections.defaultdict(set); cur = {'k': None}
def wh(uc, access, addr, size, value, ud): W[(addr - t.E, uc.reg_read(UC_ARM_REG_PC), value)].add(cur['k'])
t.mu.hook_add(UC_HOOK_MEM_WRITE, wh, begin=t.E + 0xcac0, end=t.E + 0xcadf)
vt = t.CLS['uEm069_00']['vtable']
for off in range(0, 0x480, 4):
    f = armdis.u32(vt + off)
    if not f or f >= len(armdis.TEXT): continue
    cur['k'] = hex(off)
    try: t.run('uEm069_00', 0, 0, entry=f, budget=200000)
    except Exception: pass
for k, ks in sorted(W.items()): print('e+%#x pc %#x value %#x by slots %s' % (k[0], k[1], k[2], sorted(ks)[:6]))
