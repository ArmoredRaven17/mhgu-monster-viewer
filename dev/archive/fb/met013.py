# met013.py <variant> st:n,..: the meteor actions' schedule -- per phase, the frame tests (literals), then each literal alone ('only')
# with the counter P+0x1a2 = 0..9: the meteor index 0xd80e74 gets (r1)
import sys, os, struct
v = int(sys.argv[1]); acts = [tuple(int(x, 0) for x in a.split(':')) for a in sys.argv[2].split(',')]
os.environ['FB_CLASS'] = 'uEm013_00'; os.environ['FB_MON'] = 'em013_0%d' % v
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import *
EV = []
def h(uc, addr, size, ud): EV.append(uc.reg_read(UC_ARM_REG_R1))
T.mu.hook_add(T.UC_HOOK_CODE, h, begin=0xd80e74, end=0xd80e74)
for st, n in acts:
    for ph in (1, 2):
        r = T.run(st, n, ph, v, 0, stub={0x3a8430: 5})
        lits = sorted(set(e[2][1] for e in r.get('ev', []) if e[0] == 'ftest2' and e[2][0] == 0))
        sched = []
        for k in range(10):
            for F in lits:
                EV.clear()
                T.run(st, n, ph, v, 0, s2=k, stub={0x3a8430: 5}, only=F)
                if EV: sched.append((k, F, EV[0]))
        if lits: print('%d:%#04x p%d frames %s' % (st, n, ph, lits), sched)
