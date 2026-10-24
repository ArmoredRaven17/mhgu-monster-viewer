"""Emulate base15's init 0x40714c with base03's init 0x3fd9d8 stubbed (returns 1), and the sp_15 init 0x10345a0 on top."""
import struct
import emu
from emu import S, E, B, mu
from run_move import xs_seed, xs_step, f, mla, P32, LIBM, ALLOW, RNG, pk
def rf(a): return struct.unpack('<f', bytes(mu.mem_read(a, 4)))[0]
def rw(a): return struct.unpack('<I', bytes(mu.mem_read(a, 4)))[0]
bad = 0
for h73e8 in (0, 1, 0x1234, 0xffff):
    for i1704 in (-1, 0):
        for every, cnt0 in ((-1, 0), (3, 2), (1, 0), (2, 0)):
            for f1718 in (0.0, 777.0):
                mem = {S + 0x40: pk('<3f', 10.0, 20.0, 30.0), S + 0x1704: i1704 & 0xffffffff, S + 0x1700: every & 0xffffffff,
                       S + 0x1708: pk('<f', 1400.0), S + 0x170c: pk('<f', 300.0), S + 0x1710: pk('<f', 5.0), S + 0x1718: pk('<f', f1718),
                       S + 0x1740: cnt0, E + 0x73e8: pk('<H', h73e8), B + 0x54: 0xbeef}
                stubs = {0x3fd9d8: 1, 0x7ac4a0: RNG}
                log, err, r0 = emu.run(0x40714c, {'r0': S}, mem, stubs, allow=ALLOW)
                # model
                seed = (h73e8 + (0x12345678 if i1704 != -1 else 0)) & 0xffffffff
                st = xs_seed(seed)
                cnt = cnt0 + 1
                if every >= 1 and cnt % every == 0:
                    a = f1718 if f1718 > 0 else 1400.0
                else:
                    r = xs_step(st); a = mla(300.0, f(1400.0 - 300.0), f(f(r) * P32))
                exp = {'r0': 1, 'sub': 1, '174c': 0xbeef, 'track': [10.0, 20.0, 30.0], '172c': 0, '1738': (5.0 if i1704 == -1 else -5.0),
                       'rng': st, 'cnt': cnt, 'half': f(a * 0.5), '173c': RNG}
                got = {'r0': r0, 'sub': (rw(S + 4) >> 8) & 0xff, '174c': rw(S + 0x174c), 'track': [rf(S + 0x1720 + 4 * i) for i in range(3)],
                       '172c': rw(S + 0x172c), '1738': rf(S + 0x1738), 'rng': [rw(RNG + 4 * i) for i in range(4)], 'cnt': rw(S + 0x1740),
                       'half': rf(S + 0x1734), '173c': rw(S + 0x173c)}
                calls = [l[:2] for l in log]
                if got != exp or err or calls:
                    bad += 1
                    if bad < 4: print('DIFF', h73e8, i1704, every, f1718, err, calls, {k: (got[k], exp[k]) for k in got if got[k] != exp[k]})
# the refusal arm: base03 init returns 0
log, err, r0 = emu.run(0x40714c, {'r0': S}, {S: 0x17ee2f8}, {0x3fd9d8: 0, 0x7ac4a0: RNG}, allow=ALLOW)
print('base03 init 0 ->', r0, [l[:2] for l in log], err)
# no owner
log, err, r0 = emu.run(0x40714c, {'r0': S}, {S: 0x17ee2f8}, {0x3fd9d8: 1, 0x4a0f00: 0, 0x7ac4a0: RNG}, allow=ALLOW)
print('no owner ->', r0, [l[:2] for l in log], err, 'sub', (rw(S + 4) >> 8) & 0xff)
print('init cases mismatching', bad, 'of', 4 * 2 * 4 * 2)
# sp_15's init: mode -> byte +0x13e3
for m in range(0, 26):
    emu.MODE[0] = m
    log, err, r0 = emu.run(0x10345a0, {'r0': S}, {S: 0x17ee2f8}, {0x40714c: 1}, allow=ALLOW)
    b = bytes(mu.mem_read(S + 0x13e3, 1))[0]
    if b or r0 != 1 or log: print('sp_15 init mode', m, 'r0', r0, 'byte13e3 %#x' % b, [l[:2] for l in log])
