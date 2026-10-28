# emulate uEm082_00 vt+0x1fc (0x1036714) on the request (10, 0xaf) with every previous action (e+0x73e2 / +0x73e3):
# report P+0x5ccb & 7 (the side 0x9e8c0 returns) and the (st, n) after the call. Control: request (10, 0x14) (no arm -> side 0).
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
sys.argv = ['x']
import probe
from unicorn.arm_const import *
mu = probe.mu; E, P = probe.E, probe.P
c = probe.CLS['uEm082_00']
probe.rng[0], probe.rng[1] = c['lo'], c['hi']
A = E + 0x1f0000
def run(req, prev, var=0):
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', c['vtable']))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xb5f4, bytes([0x52, var]))
    mu.mem_write(P + 0x5ccb, b'\0')
    mu.mem_write(E + 0x73e2, bytes(prev))
    mu.mem_write(A, bytes([req[0]])); mu.mem_write(A + 1, bytes([req[1]]))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, A); mu.reg_write(UC_ARM_REG_R2, A + 1)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, probe.STOP)
    probe.cur.clear()
    mu.emu_start(0x1036714, probe.STOP, count=20000)
    side = mu.mem_read(P + 0x5ccb, 1)[0] & 7
    return side, tuple(mu.mem_read(A, 2)), probe.cur.get('hit')
from collections import defaultdict
for var in (0, 4):
    res = defaultdict(list)
    for st in range(0, 16):
        for n in range(256):
            s, after, hit = run((10, 0xaf), (st, n), var)
            res[(st, s, after, hit)].append(n)
    print('variant', var)
    for (st, s, after, hit), ns in sorted(res.items(), key=lambda kv: (kv[0][0], kv[0][1])):
        if st in (1, 2, 7) or s != 1:
            print('  prev st %d side %d after %s %s: n %s' % (st, s, after, hit or '', ' '.join('%#x' % x for x in ns) if len(ns) < 40 else '%d numbers' % len(ns)))
        else:
            print('  prev st %d side %d after %s: all %d numbers' % (st, s, after, len(ns)))
print('control (10, 0x14) prev (7, 1):', run((10, 0x14), (7, 1)))
