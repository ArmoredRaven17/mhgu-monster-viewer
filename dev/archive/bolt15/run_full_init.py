"""The whole chain on the ROM: sp_15 ctor 0x1034580 (-> base15 0x406f6c -> base03 0x3fd830 -> base00 0x3f8a04), then
sp_15 init 0x10345a0 (-> base15 0x40714c -> base03 0x3fd9d8 -> base00 0x3f8b80 with the real reader 0x1034638), with
the cmn accessors answering from shl2's shell15 modes. Compared (to 1e-4) against the base00/base03/base15 reading."""
import struct, math, json, re, sys
import numpy as np
import emu
from emu import S, E, B, mu, log
from unicorn.arm_const import *
from run_move import LIBM, sreg, wsreg, RNG, pk
REQ, VEC, H100C = 0x31070000, 0x31090000, 0x310a0000
FAKEVT = E + 0x10000
SIZE = 1.25
FLOOR = 37.0
# shl2.txt: shell15 modes
txt = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\bolt\shl2.txt').read()
sec = txt.split('=== shell15')[1].split('===')[0]
MODES = {}
for m in re.finditer(r'\[\s*(\d+)\] scale \S+ ef (\[.*?\]\]) sh (\{.*?\}) hit \[(\d+)\]', sec):
    MODES[int(m.group(1))] = dict(ef=json.loads(m.group(2)), sh=json.loads(m.group(3)), hit=int(m.group(4)))
CUR = {}
def acc_int(uc):
    i = uc.reg_read(UC_ARM_REG_R1); v = CUR['sh']['ints'][i] if i < len(CUR['sh']['ints']) else -1
    log.append(('getInt', i, v)); return v
def acc_float(uc):
    i = uc.reg_read(UC_ARM_REG_R1); v = CUR['sh']['floats'][i] if i < len(CUR['sh']['floats']) else 0.0
    wsreg(uc, 0, v); log.append(('getFloat', i, v)); return 0
def acc_vec(uc):
    i = uc.reg_read(UC_ARM_REG_R1); v = CUR['sh']['vecs'][i] if i < len(CUR['sh']['vecs']) else [0, 0, 0]
    a = VEC + 0x10 * i; uc.mem_write(a, pk('<3f', *v)); log.append(('getVec', i, v)); return a
def acc_ef(uc):
    i = uc.reg_read(UC_ARM_REG_R1); log.append(('getEf', i)); return 0x7000 + i
def acc_hit(uc):
    i = uc.reg_read(UC_ARM_REG_R1); log.append(('getHit', i)); return 0x8000 + i
def size(uc):
    wsreg(uc, 0, SIZE); return 0
def stage(uc):
    sp = uc.reg_read(UC_ARM_REG_SP)
    res = struct.unpack('<I', bytes(uc.mem_read(sp, 4)))[0]; mask = struct.unpack('<I', bytes(uc.mem_read(sp + 8, 4)))[0]
    A = struct.unpack('<3f', bytes(uc.mem_read(uc.reg_read(UC_ARM_REG_R1), 12)))
    Bq = struct.unpack('<3f', bytes(uc.mem_read(uc.reg_read(UC_ARM_REG_R2), 12)))
    log.append(('stage', [round(x, 3) for x in A], [round(x, 3) for x in Bq], hex(mask)))
    lo, hi = min(A[1], Bq[1]), max(A[1], Bq[1])
    if CUR.get('floor') is None or not (lo <= CUR['floor'] <= hi): return 0
    uc.mem_write(res, pk('<3f', A[0], CUR['floor'], A[2])); return 1
STUBS = dict(LIBM)
STUBS.update({0x4a2470: acc_int, 0x4a24f8: acc_float, 0x4a2584: acc_vec, 0x4a22f0: acc_ef, 0x4a23f4: acc_hit, 0xbe518: size,
              0x183490: stage, 0x43a850: 1, 0x4a100c: H100C, 0x7ac4a0: RNG, 0x43a78c: lambda uc: uc.reg_read(UC_ARM_REG_R0),
              0x13ecbb4: 0, 0x4a1e20: 0})
ALLOW = [(0x1034580, 0x1034c60), (0x406f6c, 0x407bf8), (0x3fd830, 0x3fdce4), (0x3f8a04, 0x3fa2f8), (0x7c91a0, 0x7c9268)]
F = np.float32
DEG = 182.04444885253906; U2R = 9.58738019107841e-05
def rot(v, X, Y, Z):
    X, Y, Z = (X & 0xffff) * U2R, (Y & 0xffff) * U2R, (Z & 0xffff) * U2R
    vx, vy, vz = v
    a = vz * math.cos(X) + vy * math.sin(X); b = vy * math.cos(X) - vz * math.sin(X)
    c = vx * math.cos(Y) + a * math.sin(Y); z = a * math.cos(Y) - vx * math.sin(Y)
    return [c * math.cos(Z) - b * math.sin(Z), b * math.cos(Z) + c * math.sin(Z), z]
def rot_launch(vy, vz, W):    # (0, vy, vz) turned Z, X, Y
    Z, X, Y = (W[2] & 0xffff) * U2R, (W[0] & 0xffff) * U2R, (W[1] & 0xffff) * U2R
    x1 = -vy * math.sin(Z); y1 = vy * math.cos(Z)
    y2 = y1 * math.cos(X) - vz * math.sin(X); z2 = vz * math.cos(X) + y1 * math.sin(X)
    return [x1 * math.cos(Y) + z2 * math.sin(Y), y2, z2 * math.cos(Y) - x1 * math.sin(Y)]
def s32(x): return int(math.trunc(float(x)))
def rw(a): return struct.unpack('<I', bytes(mu.mem_read(a, 4)))[0]
def rf(a): return struct.unpack('<f', bytes(mu.mem_read(a, 4)))[0]
def rvec(a): return [rf(a + 4 * i) for i in range(3)]
# 1. the ctor chain
emu.MODE[0] = 0
lg, err, r0 = emu.run(0x1034580, {'r0': S}, {}, STUBS, allow=ALLOW)
CT = bytes(mu.mem_read(S, 0x2000))
print('ctor: vtable %#x err %s calls %s' % (struct.unpack_from('<I', CT, 0)[0], err, [l[:2] for l in lg]))
def cw(o): return struct.unpack_from('<I', CT, o)[0]
print('ctor fields: 15e8 %#x 1664 %#x 1674 %s 1678 %s 167c %s 1680 %s 15a8 %#x 1700 %#x 1704 %#x 1660 %#x 15f8 %#x 1610 %#x 161c %#x' % (
    cw(0x15e8), cw(0x1664), struct.unpack_from('<f', CT, 0x1674)[0], struct.unpack_from('<f', CT, 0x1678)[0],
    struct.unpack_from('<f', CT, 0x167c)[0], struct.unpack_from('<f', CT, 0x1680)[0], cw(0x15a8), cw(0x1700), cw(0x1704), cw(0x1660), cw(0x15f8), cw(0x1610), cw(0x161c)))
print('ctor 1700..1760:', ' '.join('%x:%x' % (o, cw(o)) for o in range(0x1700, 0x1760, 4)))
# 2. the init, per mode
bad = 0
for mode in sorted(MODES):
    for (reqW, floor) in (([0x100, 0x2345, 0], FLOOR), ([0, 0xc000, 0x0], None)):
        CUR.clear(); CUR.update(MODES[mode]); CUR['floor'] = floor
        emu.MODE[0] = mode
        req = bytearray(0x50)
        struct.pack_into('<3f', req, 0x10, 500.0, 40.0, -800.0); struct.pack_into('<3I', req, 0x20, *reqW)
        struct.pack_into('<H', req, 0x2e, 0x4242)
        mem = {S: CT, REQ: bytes(req), H100C + 0x50: 1, E: FAKEVT, B + 0x50: 0x0, B + 0x54: 0x6000, E + 0x73e8: pk('<H', 7)}
        for k in range(0, 0x200, 4): mem[FAKEVT + k] = 0x406f60
        lg, err, r0 = emu.run(0x10345a0, {'r0': S, 'r1': REQ}, mem, STUBS, allow=ALLOW, count=2000000)
        sh = MODES[mode]['sh']; fl = sh['floats']; ints = sh['ints']
        flags = rw(S + 0x15e8)
        # expectation
        dX = s32(0.5 + 0.0 * DEG) & 0xffff; dY = s32(F(0.5) + F(F(fl[0]) * F(DEG))) & 0xffff
        W = [(reqW[0] + dX) & 0xffffffff, (reqW[1] + dY) & 0xffffffff, reqW[2]]
        o = rot(sh['vecs'][1], W[0], W[1], W[2]); o = [x * SIZE for x in o]
        p = [500.0 + o[0], 40.0 + o[1], -800.0 + o[2]]
        snapped = floor is not None and (p[1] - 500 <= floor <= p[1] + 500)
        if snapped: p[1] = floor
        v = rot_launch(0.0, fl[1], [0, W[1], W[2]])
        exp_amp_ok = True
        got = dict(r0=r0, flags=flags, pos=rvec(S + 0x40), anchor=rvec(S + 0x1000), W=[rw(S + 0xfe8), rw(S + 0xfec), rw(S + 0xff0)],
                   vel=rvec(S + 0x1010), v1690=rvec(S + 0x1690), timer=rf(S + 0x162c), track=rvec(S + 0x1720), y174c=rw(S + 0x174c),
                   v1738=rf(S + 0x1738), half=rf(S + 0x1734), sub=(rw(S + 4) >> 8) & 0xff, state=rw(S + 4) & 0xff, b13e3=bytes(mu.mem_read(S + 0x13e3, 1))[0],
                   g1020=rvec(S + 0x1020), h1588=struct.unpack('<H', bytes(mu.mem_read(S + 0x1588, 2)))[0])
        calls = [l for l in lg if l[0] not in ('getInt', 'getFloat', 'getVec', 'getEf', 'getHit')]
        diffs = []
        def near(a, b): return all(abs(x - y) <= 1e-3 * max(1.0, abs(y)) for x, y in zip(a, b))
        if snapped:
            if r0 != 1: diffs.append(('r0', r0))
            if not near(got['pos'], p): diffs.append(('pos', got['pos'], p))
            if not near(got['anchor'], p): diffs.append(('anchor', got['anchor'], p))
            if got['W'][:2] != W[:2]: diffs.append(('W', [hex(x) for x in got['W']], [hex(x) for x in W]))
            if not near(got['vel'], v): diffs.append(('vel', got['vel'], v))
            if not near(got['v1690'], v): diffs.append(('v1690', got['v1690'], v))
            if got['timer'] != fl[2]: diffs.append(('timer', got['timer'], fl[2]))
            if not near(got['track'], p): diffs.append(('track', got['track'], p))
            if got['y174c'] != 0x6000: diffs.append(('174c', got['y174c']))
            exp1738 = fl[5] if ints[3] == -1 else -fl[5]
            if got['v1738'] != exp1738: diffs.append(('1738', got['v1738'], exp1738))
            if got['sub'] != 1 or got['state'] != 1: diffs.append(('state', got['state'], got['sub']))
            if flags & 0xff != 0xc8 | (0x10 if ints[1] != -1 else 0) | (0x20 if ints[2] != -1 else 0): diffs.append(('flags', hex(flags)))
        else:
            if not (got['state'] == 0xff): diffs.append(('nofloor-state', hex(rw(S + 4)), r0))
        if err: diffs.append(('err', err))
        tag = 'floor' if floor is not None else 'nofloor'
        print('mode %2d %-7s r0 %d flags %#x state %#x sub %d pos %s W %s vel %s timer %s half %.1f 1738 %s b13e3 %#x | %s' % (
            mode, tag, r0, flags, got['state'], got['sub'], [round(x, 2) for x in got['pos']], [hex(x & 0xffff) for x in got['W']],
            [round(x, 3) for x in got['vel']], got['timer'], got['half'], got['v1738'], got['b13e3'],
            ' '.join(str(c[:3]) for c in calls)))
        if diffs:
            bad += 1; print('    DIFF', diffs)
print('mismatching', bad)
