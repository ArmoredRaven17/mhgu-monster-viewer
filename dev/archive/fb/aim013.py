# aim013.py <variant> st:n,..: per action, phase 0 and phase >= 1 frame-scenario runs: the aim helper 0xd81e80 calls (limit r1, the
# vec at r2, the raise s0) and the fireball helper 0xd82024 calls (r1 mode sel, r2 / r3 the word offsets), plus the creates
import sys, os, struct
os.environ['FB_CLASS'] = 'uEm013_00'; os.environ['FB_MON'] = 'em013_0%s' % sys.argv[1]
var = int(sys.argv[1]); acts = [tuple(int(x, 0) for x in a.split(':')) for a in sys.argv[2].split(',')]
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import *
EV = []
def h(uc, addr, size, ud):
    if addr == 0xd81e80:
        r2 = uc.reg_read(UC_ARM_REG_R2)
        EV.append(('aim', hex(uc.reg_read(UC_ARM_REG_R1)), [round(x, 3) for x in T.rdf(r2, 3)], round(T.f32r(UC_ARM_REG_S0), 3)))
    elif addr == 0xd82024:
        EV.append(('fire', uc.reg_read(UC_ARM_REG_R1), hex(uc.reg_read(UC_ARM_REG_R2)), hex(uc.reg_read(UC_ARM_REG_R3)), T.cur.get('lastF')))
    elif addr == 0xd7ffcc:
        EV.append(('dust', uc.reg_read(UC_ARM_REG_R1), [round(x, 3) for x in T.rdf(uc.reg_read(UC_ARM_REG_R2), 3)], round(T.f32r(UC_ARM_REG_S0), 3), T.cur.get('lastF')))
    elif addr == 0xd80e74:
        EV.append(('meteor', uc.reg_read(UC_ARM_REG_R1), hex(uc.reg_read(UC_ARM_REG_R2)), hex(uc.reg_read(UC_ARM_REG_R3)), T.cur.get('lastF')))
for a in (0xd81e80, 0xd82024, 0xd80e74, 0xd7ffcc): T.mu.hook_add(T.UC_HOOK_CODE, h, begin=a, end=a)
for st, n in acts:
    out = []
    for ph in range(6):
        for sc in ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'landed': 1}):
            EV.clear()
            r = T.run(st, n, ph, var, 0, stub={0x3a8430: 5}, ctl=list(struct.pack('<I', 0x1234)), **sc)
            for e in EV: out.append('p%d%s %s' % (ph, 'F' if sc.get('frame') else 'E' if sc.get('ended') else 'L' if sc.get('landed') else '0', e))
            for e in r.get('ev', []):
                if e[0] == 'create': out.append('p%d%s create %s m%d %s %s f%s' % (ph, 'F' if sc.get('frame') else 'E' if sc.get('ended') else 'L' if sc.get('landed') else '0', e[1], e[2], e[3], [hex(w) for w in e[4]], e[6]))
    seen = []
    for o in out:
        if o not in seen: seen.append(o)
    print('%d:%#04x' % (st, n)); [print('   ', o) for o in seen]
