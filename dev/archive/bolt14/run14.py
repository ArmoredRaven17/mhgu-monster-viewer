"""run14.py MODE [YAW_WORD] [FLOOR] -- unicorn: base14 init 0x405e90 then the state-1 move 0x406704 frame by frame
for uShellEm081_sp_14, with the reader's fields written by hand (the reader 0x1034260 stubbed), libm implemented."""
import sys, struct, math
import emu
from emu import mu, S, E, B, HEAP, rf, rw, log
from unicorn.arm_const import *

MODE = int(sys.argv[1]) if len(sys.argv) > 1 else 4
YAW = int(sys.argv[2], 0) if len(sys.argv) > 2 else 0x4000
FLOOR = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
JOINT = (1000.0, 250.0, 2000.0)
FL = {4: [-4, 180, 80, 20, 90, 20, 0, 700, -700, 500, 30], 5: [-4, 180, 80, 20, 50, 20, 0, 700, -700, 500, 30]}
FL[10] = FL[4]; FL[11] = FL[5]
fl = [float(x) for x in FL[MODE]]
def f32(x): return struct.unpack('<f', struct.pack('<f', x))[0]
def pf(x): return struct.pack('<f', x)
def gs(uc, n): return struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0 + n)))[0]
def ss(uc, n, v): uc.reg_write(UC_ARM_REG_S0 + n, struct.unpack('<I', pf(f32(v)))[0])
def sinf(uc): ss(uc, 0, math.sin(gs(uc, 0))); return 0
def cosf(uc): ss(uc, 0, math.cos(gs(uc, 0))); return 0
def sqrtf(uc): ss(uc, 0, math.sqrt(max(gs(uc, 0), 0))); return 0
def atan2f(uc): ss(uc, 0, math.atan2(gs(uc, 0), gs(uc, 1))); return 0
EV = []
def q183490(uc):
    sp = uc.reg_read(UC_ARM_REG_SP)
    a, b = uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)
    out = struct.unpack('<I', bytes(uc.mem_read(sp, 4)))[0]
    mask = struct.unpack('<I', bytes(uc.mem_read(sp + 8, 4)))[0]
    A = [rf(a + 4 * i) for i in range(3)]; Bv = [rf(b + 4 * i) for i in range(3)]
    EV.append(('query183490', [round(x, 3) for x in A], [round(x, 3) for x in Bv], hex(mask)))
    uc.mem_write(out, pf(-1.0) + pf(FLOOR) + pf(-1.0))
    return 1
def joint(uc):
    uc.mem_write(uc.reg_read(UC_ARM_REG_R2), b''.join(pf(x) for x in JOINT)); return 0
HANDLES = {}
def start(uc):
    r1 = uc.reg_read(UC_ARM_REG_R1); req = uc.reg_read(UC_ARM_REG_R2); lr = uc.reg_read(UC_ARM_REG_LR)
    h = 0x31080000 + 0x1000 * len(HANDLES)
    u = h + 0x800
    uc.mem_write(h, b'\0' * 0x1000)
    uc.mem_write(h + 0xc, struct.pack('<I', 1)); uc.mem_write(h + 0x150, struct.pack('<I', u)); uc.mem_write(h + 0x15c, struct.pack('<I', 1))
    rq = bytes(uc.mem_read(req, 0xe0))
    w = lambda o: struct.unpack_from('<I', rq, o)[0]; fv = lambda o: round(struct.unpack_from('<f', rq, o)[0], 4)
    EV.append(('START ef=%#x' % r1, 'lr %#x' % lr, 'h %#x' % h, '+14 %#x' % w(0x14), '+1c %#x' % w(0x1c),
               'rot30', [fv(0x30), fv(0x34), fv(0x38)], 'scale40', [fv(0x40), fv(0x44), fv(0x48)], 'pos c0', [fv(0xc0), fv(0xc4), fv(0xc8)]))
    HANDLES[h] = r1
    return h
def stop(uc):
    EV.append(('STOP h=%#x' % uc.reg_read(UC_ARM_REG_R0), 'flag', uc.reg_read(UC_ARM_REG_R1), 'lr %#x' % uc.reg_read(UC_ARM_REG_LR)))
    uc.mem_write(uc.reg_read(UC_ARM_REG_R0) + 0xc, struct.pack('<I', 3))   # dead next frame
    return 0
def rot(uc):
    u, v = uc.reg_read(UC_ARM_REG_R0), uc.reg_read(UC_ARM_REG_R1)
    EV.append(('unit_rot', hex(u), [round(rf(v + 4 * i), 5) for i in range(3)]))
    return 0
for k in (0x4a11e4, 0x329c40):
    emu.LOGGED.pop(k, None)
STUBS = {0x1034260: 0, 0x43a850: 1, 0xc15a4: 0, 0xc164c: joint, 0x183490: q183490, 0x43b1a0: 0,
         0x13ecc20: sinf, 0x13ecc2c: cosf, 0x13ecc14: sqrtf, 0x13ecba8: atan2f, 0x4a11e4: start, 0x329c40: stop,
         0x8a4dfc: rot, 0x43ac6c: 0, 0x43ac8c: 0, 0x3f9aec: 0}
ZV = 0x30100000
mem = {S: struct.pack('<I', 0x17ee17c), S + 0x1c: pf(1.0), S + 0x1054: struct.pack('<B', 0),
       B + 0x50: 0, B + 0x54: YAW, B + 0x58: 0,
       S + 0x15d8: 1, S + 0x15dc: 138, S + 0x15e8: 0x100,
       S + 0x15ec: pf(fl[0]), S + 0x15f0: pf(fl[1]), S + 0x15f4: pf(fl[2]), S + 0x1610: ZV,
       S + 0x1660: 0, S + 0x1668: 0x4001, S + 0x1664: 0x4002, S + 0x166c: 0xffffffff, S + 0x1670: 0xffffffff,
       S + 0x1674: pf(fl[3]), S + 0x1678: pf(fl[4]), S + 0x167c: pf(fl[5]), S + 0x1680: pf(fl[9]), S + 0x1684: pf(fl[6]),
       S + 0x1690: pf(fl[10]), S + 0x1688: pf(fl[7]), S + 0x168c: pf(fl[8])}
lg, err, r0 = emu.run(0x405e90, {'r0': S}, mem=mem, stubs=STUBS)
print('init ret', r0, err)
for e in EV: print('  ', e)
for e in lg: print('  log', e)
def dump(tag):
    p = [round(rf(S + 0x40 + 4 * i), 3) for i in range(3)]
    a = [round(rf(S + 0x1000 + 4 * i), 3) for i in range(3)]
    v = [round(rf(S + 0x1010 + 4 * i), 3) for i in range(3)]
    w = [rw(S + 0xfe8 + 4 * i) & 0xffff for i in range(3)]
    print(tag, 'state', mu.mem_read(S + 4, 1)[0], 'pos', p, 'anchor', a, 'vel', v, 'words', [hex(x) for x in w],
          '162c', round(rf(S + 0x162c), 3), '15fc', round(rf(S + 0x15fc), 3), '1694', round(rf(S + 0x1694), 3),
          '1698', round(rf(S + 0x1698), 3), '16a8', mu.mem_read(S + 0x16a8, 1)[0],
          'h', [hex(rw(S + o)) for o in (0x169c, 0x16a0, 0x16a4)], '16b0', [round(rf(S + 0x16b0 + 4 * i), 3) for i in range(3)])
dump('after init')
snap = bytes(mu.mem_read(S, 0x2000)); bsnap = bytes(mu.mem_read(B, 0x100))
hsnap = {h: bytes(mu.mem_read(h, 0x1000)) for h in HANDLES}
for fr in range(1, 140):
    del EV[:]
    m = {S: snap, B: bsnap, E + 0x1428: B}
    m.update(hsnap)
    lg, err, r0 = emu.run(0x406704, {"r0": S}, mem=m, stubs=STUBS, allow=[(0x3f9814, 0x3f9868)])
    snap = bytes(mu.mem_read(S, 0x2000)); hsnap = {h: bytes(mu.mem_read(h, 0x1000)) for h in HANDLES}
    u68 = {hex(h): round(rf(h + 0x800 + 0x68), 4) for h in HANDLES}
    upos = {hex(h): [round(rf(h + 0x800 + 0x40 + 4 * i), 2) for i in range(3)] for h in HANDLES}
    interesting = EV or [x for x in lg if x[0] != 'call' or x[1] not in ('0x4a0f38',)] or fr in (1, 2, 19, 20, 21, 22, 50, 88, 89, 90, 91, 109, 110, 111)
    if interesting:
        dump('move %d' % fr)
        print('     unit+0x68', u68, 'unit+0x40', upos, err or '')
        for e in EV: print('     ', e)
        for e in lg: print('      log', e)
    if mu.mem_read(S + 4, 1)[0] != 1:
        print('state left 1 at move', fr); break
