# probe37.py (gapB, 2026-10-20): Nargacuga's frame handler vt+0x208 0xe47b0c under trgen's model (class band native, 0x6fe88 native,
# every call outside stubbed). For each motion id the census found (0x1c / 0x101 / 0x102) and a control id, with the action bytes
# e+0x73e0/1 set to several pairs and the variant byte 0 / 4: the frame tests it asks (0xb0968: r1 mode, r2 channel, s0, s1) and the
# 0x40 setup it hands 0x48b884 (raw words). Run: python probe37.py  (cwd = scratchpad\fb, FB_CLASS / FB_MON set inside)
import os, sys, struct
os.environ['FB_CLASS'] = 'uEm037_00'; os.environ['FB_MON'] = 'em037_00'; os.environ['FB_EM'] = '37'
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fb'))
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import UC_ARM_REG_R2
CH = []
def chan(uc, addr, size, ud):
    if addr in (0xb0968, 0xb09a4, 0xb09b0): CH.append((hex(addr), uc.reg_read(UC_ARM_REG_R2)))
T.mu.hook_add(T.UC_HOOK_CODE, chan, begin=0xb0968, end=0xb09b4)
POS = (120.0, 10.0, -340.0)
def run(mid, act, var, only=None, frame2=1):
    CH.clear()
    poke = {T.E + 0xcc98: list(struct.pack('<I', 0xcb if var == 4 else 0xc9)),
            T.E + 0x40: list(struct.pack('<3f', *POS)), T.E + 0x10f0: list(struct.pack('<f', 0.0)),
            T.P + 0x40: list(struct.pack('<3f', 1.0, 2.0, 3.0))}
    kw = dict(rage=0, stub={0x3a8430: 5, 0x49930: 10}, poke=poke, fn=0xe47b0c, mot=mid)
    if only is None: kw.update(frame=frame2, frame2=frame2)
    else: kw.update(only=only)
    r = T.run(act[0], act[1], 0, var, 0, **kw)
    tests = [e for e in r.get('ev', []) if e[0] in ('ftest', 'ftest2')]
    cr = [e for e in r.get('ev', []) if e[0] == 'create']
    return r, tests, cr, list(CH)
for mid in (0x1c, 0x101, 0x102, 0x1b):
    for act in ((0, 0), (3, 5), (3, 4), (7, 5), (7, 0x35)):
        for var in (0, 4):
            r, tests, cr, ch = run(mid, act, var)
            print('mot %#05x act %s var %d end %s tests %s chan %s' % (mid, act, var, r.get('end'), [t[2] if t[0] == 'ftest2' else t[1] for t in tests], ch))
            for e, raw in zip(cr, r.get('raw', [])):
                w = struct.unpack('<16I', bytes.fromhex(raw))
                fl = struct.unpack('<3f', bytes.fromhex(raw)[0x10:0x1c])
                print('   create id %s mode %d +0x10 %s +0x1c %#x +0x20 %s +0x2c %#x +0x30 %s +0x3c %#x  (type word %#x, owner %#x)' % (
                    e[1], e[2], fl, w[7], [hex(x) for x in w[8:11]], w[11], [hex(x) for x in w[12:15]], w[15] & 0xffff, w[0], w[3]))
# each frame literal alone (the census's 'only'): which literal makes the create
print('-- each literal alone')
for mid, F in ((0x1c, 20.0), (0x101, 60.0), (0x102, 2.0), (0x1c, 19.0), (0x101, 59.0), (0x102, 1.0)):
    r, tests, cr, ch = run(mid, (0, 0), 0, only=F)
    print('mot %#05x only %.1f -> creates %d' % (mid, F, len(cr)))
