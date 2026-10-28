"""amtrace_ovr.py (atkfix lane, 2026-10-27): actmot/amtrace.py with ANSWERS instead of blanket stubs, for the carry simulator.
Loads amtrace's source and changes two branches of its call hook (text substitution, the original file untouched):
  * the frame tests (0x72714 / 0xb0974 / 0xb0968 / 0xb09a4 / 0xb09b0 / 0xb098c) call FRAMEFN(addr, uc) when set (else the blanket
    `frame` answer), so a caller can answer each test against a concrete frame;
  * every other stubbed call looks in OVR {addr: fn(uc)} first (fn sets the return and returns to LR itself) -- the action-tune getters
    0x6f618 (float, rFreeUseParam +0x4c `0x3cb330`: float i in range, else 0.0) / 0x6f62c (int, `0x3cb30c`) / 0x6f640 (vec pointer,
    `0x3cb35c`) from the monster's own <id>_actiontune.fup (format: 4 x u32 at +4 = version, n int, n float, n vec; then the ints,
    floats, 12-byte vecs -- `dev/archive/sh88/tune.py`), and whatever the simulator fixes (the motion getter 0xb0944, ...).
Also CALLS: every frame test of the last run, (addr, r1, s0, s1, site)."""
import os, sys, struct, types
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'actmot', 'amtrace.py')
sys.path.insert(0, os.path.join(HERE, '..', 'actmot'))
src = open(SRC, encoding='utf8').read()
a = """    if addr in FRAME:
        ret(uc, S['frame']); return"""
b = """    if addr in FRAME:
        CALLS.append((addr, uc.reg_read(UC_ARM_REG_R1), round(_f(uc, UC_ARM_REG_S0), 3), round(_f(uc, UC_ARM_REG_S1), 3), site))
        if FRAMEFN is not None:
            ret(uc, int(FRAMEFN(addr, uc))); return
        ret(uc, S['frame']); return"""
assert src.count(a) == 1
src = src.replace(a, b)
a2 = """    S['stubs'].add(addr)
    ret(uc, S['RET'])"""
b2 = """    S['stubs'].add(addr)
    if addr in OVR:
        OVR[addr](uc); return
    ret(uc, S['RET'])"""
assert src.count(a2) == 1
src = src.replace(a2, b2)
src = src.replace('def hook(uc, addr, size, ud):', '''FRAMEFN = None
OVR = {}
CALLS = []
def _f(uc, r):
    return struct.unpack('<f', struct.pack('<I', uc.reg_read(r) & 0xffffffff))[0]
def hook(uc, addr, size, ud):''', 1)
A = types.ModuleType('amtrace_ovr_inner'); A.__file__ = SRC
exec(compile(src, SRC, 'exec'), A.__dict__)

VECBASE = 0x4f000000
def load_tune(mid):
    p = r'C:\MHGU-Extract\scratch-em\%s\enemy\action_tune\%s_actiontune.fup' % (mid, mid)
    if not os.path.exists(p): return None
    b = open(p, 'rb').read()
    ver, ni, nf, nv = struct.unpack_from('<4I', b, 4)
    it = list(struct.unpack_from('<%di' % ni, b, 20)); fl = list(struct.unpack_from('<%df' % nf, b, 20 + 4 * ni))
    o = 20 + 4 * ni + 4 * nf
    vs = [struct.unpack_from('<3f', b, o + 12 * i) for i in range(nv)]
    return {'i': it, 'f': fl, 'v': vs, 'path': p}

def install_tune(T):
    from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_S0, UC_ARM_REG_PC, UC_ARM_REG_LR
    try: A.mu.mem_map(VECBASE, 0x10000)
    except Exception: pass
    def back(uc): uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    def tf(uc):
        i = uc.reg_read(UC_ARM_REG_R1); v = T['f'][i] if T and i < len(T['f']) else 0.0
        uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', v))[0]); back(uc)
    def ti(uc):
        i = uc.reg_read(UC_ARM_REG_R1); v = T['i'][i] if T and i < len(T['i']) else 0
        uc.reg_write(UC_ARM_REG_R0, v & 0xffffffff); back(uc)
    def tv(uc):
        i = uc.reg_read(UC_ARM_REG_R1); v = T['v'][i] if T and i < len(T['v']) else (0.0, 0.0, 0.0)
        a = VECBASE + 16 * (i & 0xfff)
        uc.mem_write(a, struct.pack('<4f', v[0], v[1], v[2], 0.0)); uc.reg_write(UC_ARM_REG_R0, a); back(uc)
    A.OVR[0x6f618] = tf; A.OVR[0x6f62c] = ti; A.OVR[0x6f640] = tv
