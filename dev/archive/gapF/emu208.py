# emu208.py -- uEm024_00's frame handler vt+0x208 0xdeffc4 run on unicorn (fb/trgen.py: the class band native, calls out of it
# stubbed; 0xb6fac (e+0x1054 == G+0x49) answered 1; the clock 0x7264c stubbed, so ctl+0x1c is poked at the value under test).
# Each case: (status, n), the motion id e+0x4b4, the channel-1 frame test 0xb09b0's answer, P+0x1bb, P+0x1ba, ctl+0x18, ctl+0x1c,
# P+0x44 (y) -- and the shell creates it makes (id, mode, +0x10.., +0x30..).
import sys, os, struct
os.environ['FB_CLASS'] = 'uEm024_00'; os.environ['FB_MON'] = 'em024_00'
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
sys.argv = ['x']
import trgen as T
fb = lambda x: list(struct.pack('<f', x))
def case(name, st, n, mot, fr, lv, post=0, c18=0, clock=80.0, y=0.0, own=1):
    ctl = [0] * 0x50
    ctl[0x18] = c18; ctl[0x1c:0x20] = fb(clock)
    poke = {T.P + 0x1bb: [lv], T.P + 0x1ba: [post], T.P + 0x44: fb(y), T.P + 0x5b4: fb(0.0),
            T.P + 0x40: fb(100.0), T.P + 0x48: fb(-50.0), T.P + 0x50: [0x34, 0x12, 0, 0], T.P + 0x54: [0x00, 0x30, 0, 0]}
    r = T.run(st, n, fn=0xdeffc4, mot=mot, frame2=fr, ctl=bytes(ctl), poke=poke, stub={0xb6fac: own})
    cr = [(e[1], e[2]) for e in r.get('ev', []) if e[0] == 'create']
    raw = r.get('raw', [])
    pos = [list(struct.unpack('<3f', bytes.fromhex(x)[0x10:0x1c])) for x in raw]
    wd = [[hex(v) for v in struct.unpack('<3I', bytes.fromhex(x)[0x30:0x3c])] for x in raw]
    print('%-34s %s %s %s %s' % (name, cr, pos[:1], wd[:1], r.get('end') or ''))
    return cr
# 1. the motion switch (level 0: the pulse is off)
case('L2 M2 f50 cross', 0, 0, 0x202, 1, 0)
case('L2 M2 no cross (control)', 0, 0, 0x202, 0, 0)
case('L2 M2 y 1001 (control)', 0, 0, 0x202, 1, 0, y=1001.0)
case('L2 M2 not owner (control)', 0, 0, 0x202, 1, 0, own=0)
for lv in (0, 1, 2, 3):
    case('L2 M18 f66/f184 level %d' % lv, 3, 0, 0x212, 1, lv, clock=0.0)
case('L2 M18 level 3 ctl+0x18 (-> 2)', 3, 0, 0x212, 1, 3, c18=1, clock=0.0)
case('L2 M18 level 0xff', 3, 0, 0x212, 1, 0xff, clock=0.0)
case('L2 M18 level 4 (raw)', 3, 0, 0x212, 1, 4, clock=0.0)
for lv in (1, 3):
    case('L0 M5 level %d (13, 1)' % lv, 13, 1, 0x005, 1, lv, clock=0.0)
    case('L0 M5 level %d (1, 0x1b)' % lv, 1, 0x1b, 0x005, 1, lv, clock=0.0)
case('L0 M5 no cross (control)', 1, 0x1b, 0x005, 0, 3, clock=0.0)
# 2. the pulse (motion L0 M1, no frame row)
for lv in (1, 2, 3):
    for post in (0, 1):
        case('pulse (0,0) level %d posture %d' % (lv, post), 0, 0, 0x001, 0, lv, post=post)
case('pulse clock 79 (control)', 0, 0, 0x001, 0, 2, clock=79.0)
case('pulse y 1000 (control)', 0, 0, 0x001, 0, 2, y=1000.0)
case('pulse y 999', 0, 0, 0x001, 0, 2, y=999.0)
case('pulse level 0 (control)', 0, 0, 0x001, 0, 0)
case('pulse level 3 ctl+0x18 (-> 2)', 0, 0, 0x001, 0, 3, c18=1)
case('pulse level 2 ctl+0x18 (-> 1)', 0, 0, 0x001, 0, 2, c18=1)
case('pulse not owner (control)', 0, 0, 0x001, 0, 2, own=0)
for st, ns in ((1, [2, 3, 0x13, 4, 0x1b]), (2, [3, 8, 0xd, 0x14, 0x17, 4, 0x18]), (3, [0, 5]), (4, [3, 5, 0x10, 0x17, 4, 6, 0x18]),
               (5, [0]), (6, [0]), (7, [0xf, 0x10, 0x11, 0x30, 0x12, 0x2c, 0x41, 0]), (8, [0]), (10, [7]), (13, [1])):
    for n in ns: case('pulse (%d, %#x) level 2' % (st, n), st, n, 0x001, 0, 2)
