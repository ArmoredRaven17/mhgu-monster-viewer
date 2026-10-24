"""Emulate base15's move 0x4072f0 against a Python model of the transcription, step by step."""
import struct, math, copy
import numpy as np
import emu
from emu import S, E, B, mu
from unicorn.arm_const import *
F = np.float32
def f(x): return float(F(x))
def u16(x): return int(x) & 0xffff
K = f(9.58738019107841e-05); R2U = f(10430.3779296875); EPS = f(2.0**-23); P32 = f(2.0**-32)
def sinf(x): return f(math.sin(f(x)))
def cosf(x): return f(math.cos(f(x)))
def sqrtf(x): return f(math.sqrt(f(x)))
def atan2f(y, x): return f(math.atan2(f(y), f(x)))
def atanf(x): return f(math.atan(f(x)))
def mla(a, b, c): return f(f(a) + f(f(b) * f(c)))
def mls(a, b, c): return f(f(a) - f(f(b) * f(c)))
def s32(x): return int(np.int32(np.clip(np.trunc(x), -2**31, 2**31 - 1)))
def sreg(uc, n): return struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0 + n)))[0]
def wsreg(uc, n, v): uc.reg_write(UC_ARM_REG_S0 + n, struct.unpack('<I', struct.pack('<f', v))[0])
def mk(fn, nargs):
    def st(uc):
        a = [sreg(uc, i) for i in range(nargs)]
        wsreg(uc, 0, fn(*a)); return 0
    return st
LIBM = {0x13ecc20: mk(sinf, 1), 0x13ecc2c: mk(cosf, 1), 0x13ecc14: mk(sqrtf, 1), 0x13ecba8: mk(atan2f, 2), 0x13ecef0: mk(atanf, 1)}
ALLOW = [(0x7c9234, 0x7c9268), (0x3f9814, 0x3f9868), (0x7c91a0, 0x7c9234)]
RNG = 0x31080000

def xs_step(st):
    a, b, c, d = st
    t = (a ^ (a << 15)) & 0xffffffff; t ^= t >> 4; t ^= d; t ^= d >> 21
    st[:] = [b, c, d, t & 0xffffffff]; return st[3]

def xs_seed(seed):
    r4 = (seed ^ 0x00ac9365) & 0xffffffff
    s0, s1, s2, s3 = 0x075bcd15, 0x159a55e5, 0x1f123bb5, 0x05491333
    for _ in range(100):
        s0, s1, s2 = s1, s2, s3
        r3 = r4 ^ (0x65ac9365 >> (r4 & 3))
        r6 = s2 ^ (s2 >> 21)
        r4 = r3 ^ (r3 >> 3) ^ (r3 >> 4) ^ ((r3 << 3) & 0xffffffff) ^ ((r3 << 4) & 0xffffffff)
        r3 = (r4 ^ (r4 << 15)) & 0xffffffff
        r6 ^= r3
        s3 = (r6 ^ (r3 >> 4)) & 0xffffffff
    return [s0, s1, s2, s3]

def amplitude(M):
    M['count'] = (M['count'] + 1) & 0xffffffff
    if M['every'] >= 1 and M['count'] % M['every'] == 0:
        a = M['f1718'] if M['f1718'] > 0 else M['f1708']
    else:
        r = xs_step(M['rng'])
        a = mla(M['f170c'], f(M['f1708'] - M['f170c']), f(f(r) * P32))
    M['half'] = f(a * f(0.5))

def lateral(M):
    sX, cX = sinf(f(M['wX'] * K)), cosf(f(M['wX'] * K)); sY, cY = sinf(f(M['wY'] * K)), cosf(f(M['wY'] * K))
    sZ, cZ = sinf(f(M['wZ'] * K)), cosf(f(M['wZ'] * K))
    off = M['off']
    a = f(f(sX * 0.0) + f(cX * 0.0)); b = f(f(cX * 0.0) - f(sX * 0.0))
    c = mla(f(off * cY), a, sY)
    x = mls(f(c * cZ), b, sZ); y = mla(f(b * cZ), c, sZ); z = mls(f(a * cY), off, sY)
    T = M['track']
    M['pos'] = [f(T[0] + x), f(T[1] + y), f(z + T[2])]
    T[1] = M['pos'][1]

def step(M, dt):
    ev = []
    sgn = f(1.0) if M['vlat'] > 0 else f(-1.0)
    if M['sub'] == 1:
        p = M['pos']; M['anchor'] = [f(p[0] + 0.0), f(p[1] + 1.0), f(p[2] + 0.0)]
        if not (M['delay'] > 0):
            M['delay'] = 0.0; go = True
        else:
            t = f(M['delay'] - dt); M['delay'] = f(0.0) if f(0.0) >= t else t; go = not (t > 0)
        if go:
            M['sub'] = 0
            A, vy, sp = M['A'], M['f15f8'], M['speed']
            sZ, cZ = sinf(f(M['wZ'] * K)), cosf(f(M['wZ'] * K)); sX, cX = sinf(f(M['wX'] * K)), cosf(f(M['wX'] * K))
            x = f(-f(sgn * A))
            y1 = mla(f(vy * cZ), x, sZ); x1 = mls(f(x * cZ), vy, sZ)
            z2 = mla(f(sp * cX), y1, sX); y2 = mls(f(y1 * cX), sp, sX)
            sY, cY = sinf(f(M['wY'] * K)), cosf(f(M['wY'] * K))
            x3 = mla(f(x1 * cY), z2, sY); z3 = mls(f(z2 * cY), x1, sY)
            M['hY'] = u16(s32(mla(0.5, atan2f(x3, z3), R2U)))
            h = sqrtf(mla(f(z3 * z3), x3, x3))
            M['hX'] = u16(s32(mla(0.5, atan2f(f(-y2), h), R2U)))
            M['angles'][0] = M['hX']; M['angles'][1] = M['hY']
            v = M['vel']; l = sqrtf(mla(mla(f(v[1] * v[1]), v[0], v[0]), v[2], v[2]))
            if l < EPS: n = v[:]
            else:
                r = f(1.0 / l); n = [f(r * v[0]), f(r * v[1]), f(r * v[2])]
            M['vel'] = [f(sp * n[0]), f(sp * n[1]), f(sp * n[2])]
            M['vlat'] = f(A * f(-sgn))
            if M['rng'] is not None: amplitude(M)
            ev.append('turn')
        lateral(M)
    elif M['sub'] == 0:
        M['anchor'] = M['pos'][:]
        v = M['vel']; T = M['track']
        for i in range(3): T[i] = mla(T[i], dt, v[i])
        M['off'] = mla(M['off'], M['vlat'], dt)
        if M['speed'] == 0: return ev + ['speed0']
        ratio = f(M['A'] / M['speed'])
        k = f(f(sinf(atanf(ratio)) * M['acc']) * dt)
        M['vlat'] = mla(M['vlat'], sgn, k)
        l = sqrtf(mla(mla(f(v[1] * v[1]), v[0], v[0]), v[2], v[2]))
        if l < EPS: n = v[:]
        else:
            r = f(1.0 / l); n = [f(r * v[1]), f(r * v[0]), f(r * v[2])]; n = [n[1], n[0], n[2]]
        c = f(cosf(atanf(ratio)) * M['acc'])
        a = [f(n[0] * c), f(n[1] * c), f(n[2] * c)]
        M['vel'] = [mla(v[0], dt, a[0]), mla(v[1], dt, a[1]), mla(v[2], a[2], dt)]
        if f(sgn * M['off']) > M['half']:
            M['off'] = f(sgn * M['half'])
            if M['f171c'] > 0:
                M['delay'] = M['f171c']; ev.append('vt174'); M['sub'] = 1
            else:
                M['vlat'] = f(-M['vlat'])
                if M['rng'] is not None: amplitude(M)
                ev.append('flip')
        lateral(M)
    else:
        lateral(M)
    T = M['timer']
    if not (T > 0): M['timer'] = 0.0; return ev + ['end']
    t = f(T - dt); M['timer'] = f(0.0) if f(0.0) >= t else t
    if t <= 0: return ev + ['end']
    return ev

def pk(fmt, *v): return struct.pack(fmt, *v)
def shell_mem(M):
    m = {S: 0x17ee2f8, S + 4: (M['sub'] << 8) | 1, S + 0x1c: pk('<f', M['dt']),
         S + 0x40: pk('<3f', *M['pos']), S + 0x1010: pk('<3f', *M['vel']), S + 0x15f4: pk('<f', M['speed']), S + 0x15f8: pk('<f', M['f15f8']),
         S + 0x162c: pk('<f', M['timer']), S + 0x1700: M['every'], S + 0x1704: M['i1704'],
         S + 0x1708: pk('<f', M['f1708']), S + 0x170c: pk('<f', M['f170c']), S + 0x1710: pk('<f', M['A']),
         S + 0x1714: pk('<f', M['acc']), S + 0x1718: pk('<f', M['f1718']), S + 0x171c: pk('<f', M['f171c']),
         S + 0x1720: pk('<3f', *M['track']), S + 0x1730: pk('<f', M['off']), S + 0x1734: pk('<f', M['half']),
         S + 0x1738: pk('<f', M['vlat']), S + 0x173c: RNG if M['rng'] is not None else 0, S + 0x1740: M['count'],
         S + 0x1744: pk('<f', M['delay']), S + 0x1748: M['wX'], S + 0x174c: M['wY'], S + 0x1750: M['wZ'],
         S + 0xfe8: pk('<3I', *M['angles'])}
    if M['rng'] is not None: m[RNG] = pk('<4I', *M['rng'])
    return m

def read_shell():
    rf = lambda a: struct.unpack('<f', bytes(mu.mem_read(a, 4)))[0]
    rw = lambda a: struct.unpack('<I', bytes(mu.mem_read(a, 4)))[0]
    return {'sub': (rw(S + 4) >> 8) & 0xff, 'pos': [rf(S + 0x40 + 4 * i) for i in range(3)], 'vel': [rf(S + 0x1010 + 4 * i) for i in range(3)],
            'anchor': [rf(S + 0x1000 + 4 * i) for i in range(3)],
            'track': [rf(S + 0x1720 + 4 * i) for i in range(3)], 'off': rf(S + 0x1730), 'half': rf(S + 0x1734), 'vlat': rf(S + 0x1738),
            'count': rw(S + 0x1740), 'delay': rf(S + 0x1744), 'timer': rf(S + 0x162c), 'hX': rw(S + 0x1754), 'hY': rw(S + 0x1758),
            'angles': [rw(S + 0xfe8), rw(S + 0xfec), rw(S + 0xff0)], 'rng': [rw(RNG + 4 * i) for i in range(4)]}

def emu_step(M):
    stubs = dict(LIBM); stubs[0x3fec78] = 0
    log, err, r0 = emu.run(0x4072f0, {'r0': S}, shell_mem(M), stubs, allow=ALLOW)
    return log, err, read_shell()

def compare(M0, steps, label):
    M = copy.deepcopy(M0); bad = 0; evs = []
    for i in range(steps):
        log, err, R = emu_step(M)
        Mm = copy.deepcopy(M); ev = step(Mm, M['dt'])
        keys = ['sub', 'pos', 'vel', 'track', 'off', 'half', 'vlat', 'count', 'delay', 'timer', 'angles']
        if M['sub'] in (0, 1): keys.append('anchor')
        diff = []
        for k in keys:
            a = R[k]; b = Mm[k]
            if isinstance(a, list):
                if any((x != y) for x, y in zip(a, b[:len(a)])): diff.append((k, a, b))
            elif a != b: diff.append((k, a, b))
        if Mm['rng'] is not None and R['rng'] != Mm['rng']: diff.append(('rng', R['rng'], Mm['rng']))
        c174 = any(l[0] == 'call' and l[1] == '0x10348b0' for l in log)
        c148 = any(l[0] == 'call' and l[1] == '0x3f9ef4' for l in log)
        other = [l[:2] for l in log if not (l[0] == 'call' and l[1] in ('0x10348b0', '0x3f9ef4'))]
        if c174 != ('vt174' in ev) or c148 != ('end' in ev) or other: diff.append(('calls', [l[:2] for l in log], ev))
        if err: diff.append(('err', err))
        if diff:
            bad += 1
            if bad <= 3: print(label, 'step', i, 'DIFF', diff)
        if ev: evs.append((i, ev))
        M = Mm
        if 'end' in ev or 'speed0' in ev: break
    print(label, 'steps', i + 1, 'mismatching', bad, 'events', len(evs), evs[:8])
    return bad

if __name__ == '__main__':
    base = dict(sub=1, dt=1.0, pos=[100.0, 50.0, -200.0], vel=[0.0, 0.0, 3.0], speed=3.0, f15f8=0.0, timer=300.0, every=-1, i1704=-1,
                f1708=1200.0, f170c=1200.0, A=5.0, acc=1.5, f1718=0.0, f171c=50.0, track=[100.0, 50.0, -200.0], off=0.0, half=600.0,
                vlat=5.0, count=1, delay=0.0, wX=0, wY=0x4000, wZ=0, angles=[0, 0, 0], rng=xs_seed(1234))
    tot = 0
    tot += compare(base, 400, 'mode0-like')
    b = copy.deepcopy(base); b.update(f171c=0.0, f170c=200.0, f1708=900.0, vel=[1.0, 0.2, 2.5], wY=0x1234, i1704=0, vlat=-5.0); tot += compare(b, 400, 'nodelay-random')
    b = copy.deepcopy(base); b.update(A=0.0, vlat=0.0, half=0.0, speed=40.0, timer=30.0, vel=[0.0, 0.0, 40.0], f1708=0.0, f170c=0.0, f171c=0.0); tot += compare(b, 40, 'child-straight')
    b = copy.deepcopy(base); b.update(every=3, f1718=1400.0, f1708=1400.0, f170c=1400.0, A=5.0, speed=4.0, vel=[0.0, 0.0, 4.0], f171c=60.0, wX=0x300, wZ=0x200, dt=0.5); tot += compare(b, 900, 'mode1-like-dt0.5-tilted')
    b = copy.deepcopy(base); b.update(speed=0.0, sub=0); tot += compare(b, 3, 'speed0')
    b = copy.deepcopy(base); b.update(sub=2); tot += compare(b, 3, 'sub2')
    print('TOTAL mismatching steps', tot)
