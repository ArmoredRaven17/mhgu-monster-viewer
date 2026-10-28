# tracer.py -- the duo tracer: run ONE action phase of uEm069_00 (Queen) or uEm076_00 (Seltas) under unicorn and
# record EVERYTHING it does, without stopping at the first motion (notice-scratch/probe.py stops there).
# Model (same convention as probe.py): the class's own module block runs; every call outside it is stubbed
# (r0 = 0, back to lr) except the helpers below, which are answered from the scenario:
#   0x6fe88(unit, s, n)  the action test: natively for the unit itself; for the PARTNER object, the scenario's
#                        `ptest` decides (a set of (s, n) the partner is "in", or 'all')
#   0xb09c8 motion ended -> scenario `ended`;  0x72714 frame test -> `frame`;  0x7206c timer -> `timer`
#   0xb0950 (motion id ==) and 0x9e8c0..0x9e8f0 run natively.
# Recorded: every motion setter call (id, blend s0, start s1, the setter, lr), every changeAction-family call,
# every partner test (s, n, lr), every READ of P+0x1bb (pc) and e+0x7420 (pc), writes to P+0x1a1 / P+0x1bb /
# ctl+0x18 / ctl+0x35 / ctl+0x38 (Seltas' claw state / stage) with the pc.
import sys, struct, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from unicorn import *
from unicorn.arm_const import *

T = armdis.TEXT
CLS = emclasses.load()
MOT = {0xafce8: 'setMotion', 0xafe84: 'setMotion0', 0xafe8c: 'setMotionC', 0xafef0: 'setMotionL', 0xb032c: 'setMotionB'}
CHG = {0x768c8: 'follow', 0x7699c: 'hold', 0x76a40: 'req', 0x75230: 'set', 0x76088: 'default', 0x76094: 'default2',
       0x76098: 'changeAction', 0x7fba0: 'force7fba0'}
NATIVE = set(range(0x9e8c0, 0x9e8f0)) | set(range(0xb0950, 0xb0968)) | set(range(0x6fe88, 0x6feb8))
E = 0x30000000; P = 0x30100000; C = 0x30180000
E2 = 0x30200000; P2 = 0x30300000; C2 = 0x30380000
STOP = 0x50000000

mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try:
    mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
except Exception:
    pass
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
mu.mem_map(E, 0x400000)
mu.mem_map(0x40000000, 0x10000)
mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)

cur = {}
sc = {}
rng = [0, 0]


def f32r(r):
    return struct.unpack('<f', struct.pack('<I', mu.reg_read(r) & 0xffffffff))[0]


def ret(uc, v):
    uc.reg_write(UC_ARM_REG_R0, v)
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))


def hook(uc, addr, size, ud):
    cur['n'] = cur.get('n', 0) + 1
    prev = cur.get('pc', 0); cur['pc'] = addr
    if addr == 0x6fe88:
        r0, s, n = uc.reg_read(UC_ARM_REG_R0), uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)
        if r0 == E2:
            pt = sc.get('ptest', ())
            v = 1 if (pt == 'all' or (s, n) in pt) else 0
            cur.setdefault('ptests', []).append((s, n, prev, v))
            ret(uc, v); return
        return
    if rng[0] <= addr < rng[1] or addr in NATIVE or addr == STOP:
        if addr in PROBE_IN and uc.reg_read(UC_ARM_REG_R0) == E2:
            cur.setdefault('pcalls', []).append((addr, prev))
        return
    lr = uc.reg_read(UC_ARM_REG_LR)
    if uc.reg_read(UC_ARM_REG_R0) == E2:
        cur.setdefault('pcalls', []).append((addr, prev))
    if addr in MOT:
        m = uc.reg_read(UC_ARM_REG_R1)
        cur.setdefault('motions', []).append((m, f32r(UC_ARM_REG_S0), f32r(UC_ARM_REG_S1), MOT[addr], prev))
        uc.mem_write(E + 0x4b4, struct.pack('<H', m & 0xffff))
        ret(uc, 0); return
    if addr in (0xb03f8, 0xb04d0):
        m, m2, m3 = uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), uc.reg_read(UC_ARM_REG_R3)
        cur.setdefault('motions', []).append((m, f32r(UC_ARM_REG_S0), f32r(UC_ARM_REG_S1), 'layer2[%#x%s]' % (m2, (',%#x' % m3) if addr == 0xb04d0 else ''), prev))
        uc.mem_write(E + 0x4b4, struct.pack('<H', m & 0xffff))
        ret(uc, 0); return
    if addr == 0xa1290:
        cur.setdefault('scripts', []).append((uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), lr))
        ret(uc, 0); return
    if addr in CHG:
        cur.setdefault('changes', []).append((CHG[addr], uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), prev))
        ret(uc, 0); return
    if addr == 0xb09c8:
        ret(uc, sc.get('ended', 0)); return
    if addr == 0x72714:
        cur.setdefault('frames', []).append((f32r(UC_ARM_REG_S0), lr))
        ret(uc, sc.get('frame', 0)); return
    if addr == 0x7206c:
        ret(uc, sc.get('timer', 0)); return
    if addr == 0x75168:
        cur.setdefault('changes', []).append(('idle3dc', 0, 0, lr)); ret(uc, 0); return
    if addr in (0xca050, 0xca05c):
        cur.setdefault('changes', []).append(('unhandled', armdis.cstr(uc.reg_read(UC_ARM_REG_R1)), 0, lr)); ret(uc, 0); return
    cur.setdefault('stubs', []).append((addr, lr, uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)))
    ret(uc, sc.get('stubval', {}).get(addr, 0))


PROBE_IN = set()
WATCH_R = {}
WATCH_W = {}


def memhook(uc, access, addr, size, value, ud):
    pc = uc.reg_read(UC_ARM_REG_PC)
    if access == UC_MEM_READ:
        for a, nm in WATCH_R.items():
            if addr <= a < addr + size:
                cur.setdefault('reads', []).append((nm, pc))
    else:
        for a, nm in WATCH_W.items():
            if addr <= a < addr + size:
                v = (value >> (8 * (a - addr))) & 0xff
                cur.setdefault('writes', []).append((nm, pc, v))


def onbad(uc, typ, addr, size, value, ud):
    page = addr & ~0xfff
    try:
        uc.mem_map(page, 0x2000); cur.setdefault('faults', []).append(addr); return True
    except Exception:
        return False


mu.hook_add(UC_HOOK_CODE, hook)
mu.hook_add(UC_HOOK_MEM_READ | UC_HOOK_MEM_WRITE, memhook, begin=E, end=E + 0x400000)
mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED | UC_HOOK_MEM_FETCH_UNMAPPED, onbad)


def setup(cls, status, n, phase=0, link=0, pact=(0, 0), plink=None, extra=None, partner_slot=None, part=0):
    c = CLS[cls]
    other = 'uEm076_00' if cls == 'uEm069_00' else 'uEm069_00'
    rng[0], rng[1] = c['lo'], c['hi']
    mu.mem_write(E, b'\0' * 0x400000)
    for (eo, po, co, vt) in ((E, P, C, c['vtable']), (E2, P2, C2, CLS[other]['vtable'])):
        mu.mem_write(eo, struct.pack('<I', vt))
        mu.mem_write(eo + 0x1428, struct.pack('<I', po))
        mu.mem_write(eo + 0xcac0, struct.pack('<I', co))
        mu.mem_write(eo + 0xc, struct.pack('<I', 1))          # alive ([+0xc] & 7 in 1..2)
    mu.mem_write(E + 0xb5f4, bytes([0x45 if cls == 'uEm069_00' else 0x4c, 0]))
    mu.mem_write(E2 + 0xb5f4, bytes([0x4c if cls == 'uEm069_00' else 0x45, 0]))
    mu.mem_write(E + 0x73e0, bytes([status, n]))
    mu.mem_write(E2 + 0x73e0, bytes(pact))
    mu.mem_write(P + 0x1a1, bytes([phase]))
    mu.mem_write(P + 0x1bb, bytes([link]))
    mu.mem_write(P + 0x5ccb, bytes([(part << 3) & 0xff]))
    mu.mem_write(P2 + 0x1bb, bytes([link if plink is None else plink]))
    # the partner pointer: the Queen keeps Seltas at ctl+0, Seltas keeps the Queen at ctl+0x50
    slot = partner_slot if partner_slot is not None else (0 if cls == 'uEm069_00' else 0x50)
    mu.mem_write(C + slot, struct.pack('<I', E2))
    if extra:
        for a, b in extra:
            mu.mem_write(a, b)
    WATCH_R.clear(); WATCH_W.clear()
    WATCH_R[P + 0x1bb] = 'P+0x1bb'; WATCH_R[E + 0x7420] = 'e+0x7420'; WATCH_R[C + 0x18] = 'ctl+0x18'
    WATCH_R[C + 0x35] = 'ctl+0x35'; WATCH_R[C + 0x38] = 'ctl+0x38'
    WATCH_W[P + 0x1a1] = 'phase'; WATCH_W[P + 0x1bb] = 'P+0x1bb'; WATCH_W[C + 0x18] = 'ctl+0x18'
    WATCH_W[C + 0x35] = 'ctl+0x35'; WATCH_W[C + 0x38] = 'ctl+0x38'; WATCH_W[C + 0x49] = 'ctl+0x49'
    return c


def run(cls, status, n, entry=None, budget=400000, regs=None, **kw):
    global sc
    sc = kw.pop('sc', {})
    c = setup(cls, status, n, **kw)
    mu.reg_write(UC_ARM_REG_R0, E)
    for rr, vv in (regs or {}).items():
        mu.reg_write(rr, vv)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000)
    mu.reg_write(UC_ARM_REG_LR, STOP)
    cur.clear()
    try:
        mu.emu_start(entry or c['main'], STOP, count=budget)
        if mu.reg_read(UC_ARM_REG_PC) != STOP:
            cur['end'] = 'budget at %#x' % mu.reg_read(UC_ARM_REG_PC)
    except Exception as ex:
        cur['end'] = 'err %s at %#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    return dict(cur)


def fmt(r):
    out = []
    for m in r.get('motions', []):
        out.append('MOT L%d M%d (%#05x) b%g s%g %s @%#x' % ((m[0] >> 8) & 0xf, m[0] & 0xff, m[0], m[1], m[2], m[3], m[4]))
    for s in r.get('scripts', []):
        out.append('SCRIPT %#x mode %d @%#x' % s)
    for ch in r.get('changes', []):
        out.append('CHG %s (%s, %s) @%#x' % (ch[0], ch[1] if isinstance(ch[1], str) else hex(ch[1]), hex(ch[2]), ch[3]))
    if r.get('ptests'):
        out.append('PTEST ' + ' '.join('(%d,%#x)@%#x=%d' % t for t in r['ptests']))
    if r.get('reads'):
        out.append('READ ' + ' '.join('%s@%#x' % x for x in sorted(set(r['reads']), key=lambda x: x[1])))
    if r.get('writes'):
        out.append('WRITE ' + ' '.join('%s@%#x=%#x' % x for x in r['writes']))
    if r.get('pcalls'):
        out.append('PCALL ' + ' '.join('%#x@%#x' % x for x in sorted(set(r['pcalls']))))
    if r.get('end'):
        out.append('END ' + r['end'])
    return out
