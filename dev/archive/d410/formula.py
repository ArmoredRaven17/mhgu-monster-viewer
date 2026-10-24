"""ROM-run of the (1, 0x1c) / (1, 0x1e) start arms (0x10b4828) with real inputs: P = [e+0x1428], P+0x40 position,
P+0x54 yaw word, size P+0x1ac x P+0x1b0, the action-tune vec 17 (0x6f640 answered with a pointer to the vector),
sinf / cosf answered by math.sin / cos. Prints e+0xd410..d41c and e+0xd440..d44c against the formula
   point = P+0x40 + (vx*s*cos + vz*s*sin, vy*s, vz*s*cos - vx*s*sin), w = 0."""
import sys, struct, math
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\ak')
import emu88b as emu88
from unicorn import UC_HOOK_BLOCK
from unicorn.arm_const import *
E, P = emu88.E, emu88.P
VEC = P + 0x8000
emu88.LOG_REQ.update({0x6f640, 0x6f618, 0x6f62c})
emu88.RETVAL[0x6f640] = VEC
emu88.RETVAL[0x48b884] = 0x5a5a0000
f32 = lambda x: struct.pack('<f', x)
rf = lambda b: struct.unpack('<f', struct.pack('<I', b))[0]


def run(st, n, pos, yaw_word, sz, vec):
    k = emu88.Ka(mode=4, action=(st, n))
    mu = k.mu
    mu.mem_map(0x5a5a0000, 0x10000)
    mu.mem_write(P + 0x40, struct.pack('<3f', *pos))
    mu.mem_write(P + 0x54, struct.pack('<H', yaw_word))
    mu.mem_write(P + 0x1ac, f32(sz[0])); mu.mem_write(P + 0x1b0, f32(sz[1]))
    mu.mem_write(VEC, struct.pack('<3f', *vec))
    for off in range(0xd410, 0xd420, 4): mu.mem_write(E + off, struct.pack('<I', 0x7fc0dead))
    for off in range(0xd440, 0xd450, 4): mu.mem_write(E + off, struct.pack('<I', 0x7fc0dead))

    def trig(uc, a, size, ud):
        if a in (0x13ecc20, 0x13ecc2c):
            x = rf(uc.reg_read(UC_ARM_REG_S0))
            y = math.sin(x) if a == 0x13ecc20 else math.cos(x)
            uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', y))[0])
    mu.hook_add(UC_HOOK_BLOCK, trig)
    k.call(0x10b4828, st, n)
    a = struct.unpack('<4f', mu.mem_read(E + 0xd410, 16))
    b = struct.unpack('<4f', mu.mem_read(E + 0xd440, 16))
    s = sz[0] * sz[1]
    yaw = yaw_word * 9.587379924285257e-05
    c, si = math.cos(yaw), math.sin(yaw)
    vx, vy, vz = vec
    exp = (pos[0] + vx * s * c + vz * s * si, pos[1] + vy * s, pos[2] + vz * s * c - vx * s * si, 0.0)
    return a, b, exp


for st, n in ((1, 0x1c), (1, 0x22), (1, 0x1e), (1, 0x24), (1, 0x1d), (1, 0x1f)):
    for pos, yw, sz, vec in (((1000.0, 50.0, -2000.0), 0x4000, (1.2, 1.0), (100.0, 4000.0, 300.0)),
                             ((-350.0, 0.0, 720.0), 0x2aaa, (1.0, 1.1), (0.0, 4000.0, 0.0))):
        a, b, exp = run(st, n, pos, yw, sz, vec)
        fmt = lambda v: '(' + ', '.join('%.3f' % x if abs(x) < 1e30 and x == x else 'untouched' for x in v) + ')'
        print('(%d,%#x) pos %s yaw %#x size %s vec %s' % (st, n, pos, yw, sz, vec))
        print('    d410 %s   d440 %s   formula %s' % (fmt(a), fmt(b), fmt(exp)))
