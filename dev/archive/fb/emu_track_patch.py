p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\emu_fb.py'
s = open(p, encoding='utf8').read()
# 1. the ray with no second point (0x183664(mgr, &p, null, ..)): cast from 100 above the point straight down (0x1836f0..0x183724)
a = """    Fp = [rf(uc.reg_read(UC_ARM_REG_R1) + 4 * i) for i in range(3)]
    Tp = [rf(uc.reg_read(UC_ARM_REG_R2) + 4 * i) for i in range(3)]"""
b = """    Fp = [rf(uc.reg_read(UC_ARM_REG_R1) + 4 * i) for i in range(3)]
    if uc.reg_read(UC_ARM_REG_R2) == 0:
        # no second point: from 100 above the point, straight down (the reach below is the stage's: the plane always under it)
        Fp = [Fp[0], f32(Fp[1] + 100.0), Fp[2]]
        Tp = [Fp[0], -1.0e9, Fp[2]]
    else:
        Tp = [rf(uc.reg_read(UC_ARM_REG_R2) + 4 * i) for i in range(3)]"""
assert s.count(a) == 1; s = s.replace(a, b)
# 2. a case's per-move owner track: {k: [motion u16 +0x4b4, the window 0xb0968's answer]} before move k
a = """    for k in range(1, frames + 1):
        E.call(move, (SHELL,)); assert E.fault is None, (k, E.fault)"""
b = """    for k in range(1, frames + 1):
        tr = TRACK.get(k)
        if tr is not None:
            w16(OWNER + 0x4b4, tr[0]); ANS['win'] = tr[1]
        E.call(move, (SHELL,)); assert E.fault is None, (k, E.fault)"""
assert s.count(a) == 1; s = s.replace(a, b)
a = """def run(c):
    owner_setup(c)"""
b = """TRACK = {}
def run(c):
    TRACK.clear()
    last = None
    for k, v in sorted(((int(k), v) for k, v in (c.get('track') or {}).items())):
        TRACK[k] = v
    owner_setup(c)"""
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
