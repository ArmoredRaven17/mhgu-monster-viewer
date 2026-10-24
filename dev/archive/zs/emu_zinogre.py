"""Zinogre's (em057_00) and Thunderlord's (em057_04) shells on the ROM -- the whole executable after its static initialisers (the
Seltas harness's machine, sw37/emu37.py's), with the em057_00.arc / em057_04.arc shell files:
  sp_01 0xf7 / 0xf9 uShellEm057_sp_01 : base01 (ctor 0xf05314, init 0x3fa498 -> reader 0xf05358, move 0x3faec4, end +0x154 0xf057a4)
  sp_18 0xf8 / 0xfb uShellEm057_sp_18 : base18 (ctor 0xf05ebc, init 0x408980 -> base00 0x3f8b80 -> reader 0xf05ef0, move 0x3f96a0,
                                         step +0x160 0x408a10, landing +0x150 0xf06314)
  sp_11 0xfa       uShellEm057_sp_11 : base11 (ctor 0xf059c0, init 0x402fd8 -> reader 0xf059e0, move 0x3faec4, create +0x168 0xf05b20)
The setups are the class's own code run on the ROM: the leap spawners 0xf00590 / 0xf010e8(e, kind, which), the escorts' 0xeefc34(e,
k), the strike spawner 0xef870c(e, k), the ray bodies 0xefa834 (phase 1) / 0xefd50c (phase 1) / 0xefc044, the bodies 0xef9554 /
0xefae84 / 0xefb470 / 0xef67a0 at their phase, each called once per frame the case lists with the frame test 0xb0974 answering 1 for
that frame alone. Each shell is then flown from the setup the ROM built (ctor, init, moves), and every shell a move makes (a landing's
shell01, an end's shell11, a shell11's shell01s) from the setup the ROM built for it.
HOOKED (as the Seltas harness, plus): the ShellCmnParam getters 0x4a2224 / 0x4a2264 -> Thunderlord's sp_01 cmn; the actiontune getters
0x6f618 / 0x6f62c -> em057_04_actiontune (variant 4; Zinogre has none: 0 / 0); 0x3a8430 (the quest rank) / 0x49930 (the quest number)
-> the case's; 0x183664 (the ray) -> the floor plane; 0xeecb28 (the discharge) and the action helpers -> stubs. The owner's world matrix
+0xb0.. is the case's yaw turn (rows (c, 0, -s), (0, 1, 0), (s, 0, c), its point). vt+0x370 -> 0xa3bf4 (P+0x3b4 bit 0: the case's sever).
Usage: python emu_zinogre.py cases.json out.json"""
import sys, struct, json, math
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import emu
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
import shellef

E = emu.Emu()
uc = E.uc
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    E.fault = None
    E.call(fn, (), tag='init', budget=2_000_000)
E.fault = None

def wf(a, x): uc.mem_write(a, struct.pack('<f', x))
def rf(a): return struct.unpack('<f', bytes(uc.mem_read(a, 4)))[0]
def w32(a, v): uc.mem_write(a, struct.pack('<I', v & 0xffffffff))
def r32(a): return struct.unpack('<I', bytes(uc.mem_read(a, 4)))[0]
def w16(a, v): uc.mem_write(a, struct.pack('<H', v & 0xffff))
def w8(a, v): uc.mem_write(a, bytes([v & 0xff]))
def r8(a): return uc.mem_read(a, 1)[0]
def s32v(v): return struct.unpack('<i', struct.pack('<I', v & 0xffffffff))[0]
def f32(x): return struct.unpack('<f', struct.pack('<f', x))[0]

S = emu.SCRATCH_LO
SHELL, SETUP, OWNER, BLOCK, OWNVT, EPS, HANDLES, VECS, SETUPS, JOINTS, MAP, RES, CTL, BASE = (
    S, S + 0x2000, S + 0x10000, S + 0x20000, S + 0x30000, S + 0x40000, S + 0x50000, S + 0x60000,
    S + 0x70000, S + 0x90000, S + 0x98000, S + 0x9c000, S + 0x9d000, S + 0x9f800)
FLOOR_Y = [0.0]
LOG = []
next_handle = [S + 0x50000]
next_setup = [SETUPS]
CUR = [('em057_00', '18')]
ANS = {'frame': None, 'ended': 0, 'rank': 5, 'quest': 10, 'variant': 0}

def ret(val=None):
    if val is not None: uc.reg_write(UC_ARM_REG_R0, val & 0xffffffff)
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
def hook(addr, fn):
    uc.hook_add(UC_HOOK_CODE, lambda u, a, s, d: fn(), begin=addr, end=addr)
def set_s0(x): uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', x))[0])
def get_s0(): return struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0)))[0]

# ---- the arcs' shell files --------------------------------------------------------------------------------------------
SH = {}
TUNE_I, TUNE_F = [], []
for mon, folders in (('em057_00', ('01', '18')), ('em057_04', ('01', '11', '18'))):
    FILES = shellef.load(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon))
    def fup(name):
        for nm, (th, b) in FILES.items():
            if nm.split(chr(92))[-1] == name and b[:4] == b'FUP\0':
                ver, ni, nf, nv = struct.unpack_from('<4I', b, 4)
                p = 20
                ints = list(struct.unpack_from('<%di' % ni, b, p)); p += 4 * ni
                fl = list(struct.unpack_from('<%df' % nf, b, p)); p += 4 * nf
                vecs = [list(struct.unpack_from('<3f', b, p + 12 * i)) for i in range(nv)]
                return {'ints': ints, 'floats': fl, 'vecs': vecs}
        return None
    def efp(name):
        for nm, (th, b) in FILES.items():
            if nm.split(chr(92))[-1] == name and th == '1eb12c38':
                return shellef.parse_ef(b)['params'][0]['arr']
        return None
    for folder in folders:
        for m in range(64):
            sh = fup('%s_%s_sh%03d' % (mon, folder, m))
            if sh is None: continue
            SH[(mon, folder, m)] = {'sh': sh, 'hit': fup('%s_%s_hit%03d' % (mon, folder, m)), 'ef': efp('%s_%s_ef%03d' % (mon, folder, m))}
    if mon == 'em057_04':
        for nm, (th, b) in FILES.items():
            if 'action_tune' in nm and b[:4] == b'FUP\0':
                ver, ni, nf, nv = struct.unpack_from('<4I', b, 4)
                TUNE_I = list(struct.unpack_from('<%di' % ni, b, 20)); TUNE_F = list(struct.unpack_from('<%df' % nf, b, 20 + 4 * ni))
CMN = {('em057_04', '01'): {'ints': [0, 0, 0], 'floats': [1500.0, 1500.0, 600.0, 600.0, 600.0, 600.0]}}

def mode_of(r2):
    v = s32v(r2)
    if v >= 0: return v
    st = r32(SHELL + 0x136c)
    return r32(st + 8) & 0xff if st else 0xff
def ent(m): return SH.get((CUR[0][0], CUR[0][1], m))
def g_ef():
    i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
    e = ent(m)
    if not e or not e['ef'] or i >= len(e['ef']): return ret(0)
    a = EPS + 0x100 * m + 8 * i
    lid, uid = e['ef'][i]
    w32(a, lid); w32(a + 4, uid)
    ret(a)
def g_int(kind):
    def h():
        i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
        e = ent(m)
        if not e or not e[kind]: return ret(0xffffffff)
        L = e[kind]['ints']
        ret(L[i] if i < len(L) else 0xffffffff)
    return h
def g_float():
    i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
    e = ent(m)
    L = e['sh']['floats'] if e else []
    set_s0(L[i] if i < len(L) else 0.0)
    ret()
def g_vec():
    i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
    e = ent(m)
    L = e['sh']['vecs'] if e else []
    if i >= len(L): return ret(0x19176b0)
    a = VECS + 0x100 * m + 16 * i
    for k in range(3): wf(a + 4 * k, L[i][k])
    ret(a)
def c_int():
    c = CMN.get(CUR[0]); i = uc.reg_read(UC_ARM_REG_R1)
    ret(c['ints'][i] if c and i < len(c['ints']) else 0xffffffff)
def c_float():
    c = CMN.get(CUR[0]); i = uc.reg_read(UC_ARM_REG_R1)
    set_s0(c['floats'][i] if c and i < len(c['floats']) else 0.0); ret()
hook(0x4a22f0, g_ef)
hook(0x4a23f4, g_int('hit'))
hook(0x4a2470, g_int('sh'))
hook(0x4a24f8, g_float)
hook(0x4a2584, g_vec)
hook(0x4a2224, c_int)
hook(0x4a2264, c_float)

def a850():
    w32(SHELL + 0x1374, 1); ret(1)
hook(0x43a850, a850)
hook(0x4a1ad8, lambda: ret(0))
def ab74():
    sh = uc.reg_read(UC_ARM_REG_R0)
    s0 = get_s0()
    for k in range(3): wf(sh + 0x60 + 4 * k, s0)
    w32(sh + 0x6c, 0)
    ret()
hook(0x43ab74, ab74)
def alloc():
    a = next_setup[0]; next_setup[0] += 0x80
    uc.mem_write(a, b'\0' * 0x80)
    ret(a)
for a in (0x3f883c, 0x3fa2bc, 0x41add8): hook(a, alloc)
# the heap sp_11's reader takes its time table from (0x7a75a0 -> vt+0x1c alloc, vt+0x34 free): a fake allocator over scratch
ALLOCOBJ, ALLOCVT, TABLES = S + 0x9e000, S + 0x9e100, [S + 0x9e400]
w32(ALLOCOBJ, ALLOCVT)
for i in range(0x40): w32(ALLOCVT + 4 * i, 0x1008)
w32(ALLOCVT + 0x1c, 0x1004)
def t_alloc():
    a = TABLES[0]; TABLES[0] += 0x100
    if TABLES[0] > S + 0x9f700: TABLES[0] = S + 0x9e400
    uc.mem_write(a, b'\0' * 0x100); ret(a)
hook(0x7a75a0, lambda: ret(ALLOCOBJ))
hook(0x1004, t_alloc)
hook(0x1008, lambda: ret(0))
CREATED = []
RETNEW = [0]
def create():
    st = uc.reg_read(UC_ARM_REG_R1)
    CREATED.append(bytes(uc.mem_read(st, 0x50)))
    LOG.append(['create', r32(st + 4), r32(st + 8)])
    # (0xefabe4 writes +0x1654 into the new shell: hand back a scratch unit the case reads afterwards)
    RETNEW[0] = S + 0xa0000 + 0x2000 * (len(CREATED) % 8)
    uc.mem_write(RETNEW[0], b'\0' * 0x2000)
    ret(RETNEW[0])
hook(0x48b884, create)
def plane(A, B, mask):
    Y = FLOOR_Y[0]
    d2 = f32(f32(f32(A[1] - B[1]) ** 2) + f32(f32(A[0] - B[0]) ** 2))
    d2 = f32(d2 + f32(f32(A[2] - B[2]) ** 2))
    if d2 < 1.1920928955078125e-07 or not (B[1] >= Y and A[1] < Y): return None
    t = f32(f32(B[1] - Y) / f32(B[1] - A[1]))
    P = [f32(B[i] + f32(t * f32(A[i] - B[i]))) for i in range(3)]
    P[1] = Y
    return P
def q_plane():
    A = [rf(uc.reg_read(UC_ARM_REG_R1) + 4 * i) for i in range(3)]
    B = [rf(uc.reg_read(UC_ARM_REG_R2) + 4 * i) for i in range(3)]
    sp = uc.reg_read(UC_ARM_REG_SP)
    out, res, mask = r32(sp), r32(sp + 4), r32(sp + 8)
    LOG.append(['query', mask])
    P = plane(A, B, mask) if (mask & 0x10) else None
    if not P: return ret(0)
    if out:
        for i in range(3): wf(out + 4 * i, P[i])
        w32(out + 12, 0)
    if res:
        uc.mem_write(res, b'\0' * 0x30)
        wf(res + 0x14, -100000.0)
        wf(res + 0x20, 0.0); wf(res + 0x24, 1.0); wf(res + 0x28, 0.0)
    LOG.append(['hit', P])
    ret(0x10)
hook(0x183490, q_plane)
def ray():
    # 0x183664(mgr, &from, &to, r3, [sp] &hit byte, [sp+4] &result, [sp+8] mask) -> s0 the height
    Fp = [rf(uc.reg_read(UC_ARM_REG_R1) + 4 * i) for i in range(3)]
    Tp = [rf(uc.reg_read(UC_ARM_REG_R2) + 4 * i) for i in range(3)]
    sp = uc.reg_read(UC_ARM_REG_SP)
    hb, res = r32(sp), r32(sp + 4)
    P = plane(Tp, Fp, 0x10)
    LOG.append(['ray', Fp, Tp, P])
    if hb: w8(hb, 1 if P else 0)
    if res:
        uc.mem_write(res, b'\0' * 0x30)
        wf(res + 0x20, 0.0); wf(res + 0x24, 1.0); wf(res + 0x28, 0.0)
    set_s0(P[1] if P else Fp[1])
    ret(1 if P else 0)
hook(0x183664, ray)
hook(0x40a54, lambda: ret(uc.reg_read(UC_ARM_REG_R0)))
hook(0x40a94, lambda: ret(uc.reg_read(UC_ARM_REG_R0)))
REQ = [None]
def fill():
    sp = uc.reg_read(UC_ARM_REG_SP)
    p = r32(sp + 4)
    REQ[0] = [rf(p + 4 * i) for i in range(3)]
    ret()
hook(0x4a10c8, fill)
def start():
    p = uc.reg_read(UC_ARM_REG_R1)
    if p == 0 or r32(p) > 7 or s32v(r32(p + 4)) < 0:
        LOG.append(['refused', p and r32(p), p and s32v(r32(p + 4))]); return ret(0)
    h = next_handle[0]; next_handle[0] += 0x100
    uc.mem_write(h, b'\0' * 0x100); w32(h + 0xc, 1)
    LOG.append(['start', r32(p), r32(p + 4), REQ[0]])
    ret(h)
hook(0x4a11e4, start)
hook(0x329c40, lambda: (LOG.append(['stop', uc.reg_read(UC_ARM_REG_R1)]), ret()))
hook(0xb0974, lambda: ret(1 if ANS['frame'] is not None and f32(get_s0()) == f32(ANS['frame']) else 0))
hook(0xb0968, lambda: ret(0))
hook(0xb09c8, lambda: ret(ANS['ended']))
hook(0xbf0bc, lambda: ret(0))
hook(0x7206c, lambda: ret(0))
hook(0x7264c, lambda: ret(0))
hook(0x16b4b4, lambda: ret(0x1234))
hook(0x3a8430, lambda: ret(ANS['rank']))
hook(0x49930, lambda: ret(ANS['quest']))
def tune_f():
    k = uc.reg_read(UC_ARM_REG_R1)
    set_s0(TUNE_F[k] if ANS['variant'] == 4 and k < len(TUNE_F) else 0.0); ret()
def tune_i():
    k = uc.reg_read(UC_ARM_REG_R1)
    ret(TUNE_I[k] if ANS['variant'] == 4 and k < len(TUNE_I) else 0)
hook(0x6f618, tune_f)
hook(0x6f62c, tune_i)
for a in (0x76c08, 0x76dd0, 0x7ded8, 0x7db70, 0x7fc00, 0xc0354, 0x7d65c, 0x7b53c, 0x7b518, 0x7bd18, 0xbc7f4, 0xbc984, 0x75230,
          0x82454, 0x768c8, 0x7fbd4, 0x82cd0, 0xafe84, 0xafce8, 0xaff50, 0x72620, 0xc10d4, 0xbe530, 0x7df8c, 0x7a820, 0xbf62c,
          0xbf700, 0xc241c, 0x7a258, 0x7a27c, 0x7e5c0, 0xeecb28, 0xef93d8, 0xb07b4, 0xbf4e4, 0x7fb68, 0xb09d0, 0x6fe88):
    # (a case's `unstub` runs one of these natively: the heading writer 0xef93d8 for the heading-carry case)
    hook(a, (lambda a: (lambda: None if a in ANS.get('unstub', ()) else ret(0)))(a))

# ---- owner, joints ----------------------------------------------------------------------------------------------------
def owner_setup(c):
    uc.mem_write(OWNER, b'\0' * 0xd000)
    uc.mem_write(BLOCK, b'\0' * 0x6000)
    uc.mem_write(CTL, b'\0' * 0x200)
    w32(OWNER, OWNVT); w32(OWNER + 0xc, 1); w32(OWNER + 0x1428, BLOCK); w32(OWNER + 0xcac0, CTL)
    for i in range(0x100): w32(OWNVT + 4 * i, 0x3fa078)
    w32(OWNVT + 0x88, 0x6bbb0)
    w32(OWNVT + 0x370, 0xa3bf4)
    ANS['unstub'] = set(int(x, 0) for x in c.get('unstub', []))
    v = c['variant']; ANS['variant'] = v; ANS['rank'] = c.get('rank', 5); ANS['quest'] = c.get('quest', 10)
    w8(OWNER + 0xb5f4, 57); w8(OWNER + 0xb5f5, v)
    for k, i in enumerate((0xf9, 0xfb, 0xfa) if v == 4 else (0xf7, 0xf8, 0x19d)): w32(OWNER + 0xcafc + 4 * k, i)
    oX, oY, oZ = c['owner']
    w32(BLOCK + 0x50, oX); w32(BLOCK + 0x54, oY); w32(BLOCK + 0x58, oZ)
    for k in range(3):
        wf(BLOCK + 0x1d0 + 4 * k, c['target'][k])
        wf(BLOCK + 0x40 + 4 * k, c['ownerPos'][k]); wf(OWNER + 0x40 + 4 * k, c['ownerPos'][k])
    w32(OWNER + 0xfe8, oX & 0xffff); w32(OWNER + 0xfec, oY & 0xffff); w32(OWNER + 0xff0, oZ & 0xffff)
    # the unit's world matrix +0xb0..: the yaw turn (sinf / cosf of the word x 9.58738e-05) and its point
    r = f32(f32(oY & 0xffff) * f32(9.58738019107841e-05)); sn = f32(math.sin(r)); cs = f32(math.cos(r))
    M = [cs, 0.0, -sn, 0.0, 0.0, 1.0, 0.0, 0.0, sn, 0.0, cs, 0.0] + list(c['ownerPos']) + [1.0]
    for k in range(16): wf(OWNER + 0xb0 + 4 * k, M[k])
    sz = c.get('size', [1.0, 1.0])
    wf(BLOCK + 0x1ac, sz[0]); wf(BLOCK + 0x1b0, sz[1])
    wf(BLOCK + 0x5b4, c.get('ground', 0.0))
    w32(OWNER + 0x75e8, BASE); wf(BASE + 0x64, c.get('base', 1.0))
    w8(BLOCK + 0x5df3, 1 if c.get('charged') else 0)
    w8(BLOCK + 0x518, 1 if c.get('rage') else 0)
    w16(BLOCK + 0x3b4, 1 if c.get('severed') else 0)
    w16(BLOCK + 0xb0a, 0x1234)
    w32(CTL + 0x18, c.get('heading', oY))

def set_joints(js):
    uc.mem_write(MAP, b'\xff' * 256)
    order = sorted(set([0] + [int(g) for g in js]))
    for i, g in enumerate(order):
        w8(MAP + g, i)
        m = js.get(str(g), js.get(g)) or js.get('0')
        for k in range(16): wf(JOINTS + 0xa0 * i + 0x10 + 4 * k, m[k])
    w32(OWNER + 0x494, JOINTS); w32(OWNER + 0x498, MAP)

def snap(timer_off):
    return dict(state=r8(SHELL + 4), pos=[rf(SHELL + 0x40 + 4 * k) for k in range(3)],
                vel=[rf(SHELL + 0x1010 + 4 * k) for k in range(3)], acc=[rf(SHELL + 0x1020 + 4 * k) for k in range(3)],
                anchor=[rf(SHELL + 0x1000 + 4 * k) for k in range(3)],
                ang=[r32(SHELL + 0xfe8), r32(SHELL + 0xfec), r32(SHELL + 0xff0)],
                timer=rf(SHELL + timer_off), scale=rf(SHELL + 0x60))

KINDS = {  # (monster, folder): ctor, init, move, timer offset
    ('em057_00', '01'): (0xf05314, 0x3fa498, 0x3faec4, 0x1614),
    ('em057_00', '18'): (0xf05ebc, 0x408980, 0x3f96a0, 0x162c),
    ('em057_04', '01'): (0xf05314, 0x3fa498, 0x3faec4, 0x1614),
    ('em057_04', '11'): (0xf059c0, 0x402fd8, 0x3faec4, 0x1614),
    ('em057_04', '18'): (0xf05ebc, 0x408980, 0x3f96a0, 0x162c),
}
ID_KIND = {0xf7: ('em057_00', '01'), 0xf8: ('em057_00', '18'), 0xf9: ('em057_04', '01'), 0xfa: ('em057_04', '11'), 0xfb: ('em057_04', '18')}

def fly(kind, raw, frames, b1654=0):
    CUR[0] = kind
    ctor, init, move, toff = KINDS[kind]
    LOG.clear(); CREATED.clear(); next_handle[0] = S + 0x50000
    uc.mem_write(SHELL, b'\0' * 0x1800)
    E.call(ctor, (SHELL,)); assert E.fault is None, E.fault
    wf(SHELL + 0x1c, 1.0)
    w32(SHELL + 0x136c, SETUP); w32(SHELL + 0x1384, RES); w8(RES + 0x50, 1)
    uc.mem_write(SETUP, b'\0' * 0x50); uc.mem_write(SETUP, raw[:0x50]); w32(SETUP + 0xc, OWNER)
    w8(SHELL + 4, 0)
    r = E.call(init, (SHELL, SETUP)); assert E.fault is None, E.fault
    if b1654: w8(SHELL + 0x1654, 1)
    out = {'init': r, 'spawn': snap(toff), 'log': list(LOG), 'created': [c.hex() for c in CREATED], 'frames': []}
    LOG.clear(); CREATED.clear()
    if not r: return out
    for k in range(1, frames + 1):
        E.call(move, (SHELL,)); assert E.fault is None, (k, E.fault)
        s = snap(toff); s['k'] = k; s['log'] = list(LOG); s['created'] = [c.hex() for c in CREATED]
        LOG.clear(); CREATED.clear()
        out['frames'].append(s)
        if s['state'] == 0xff or r32(SHELL + 0xc) & 7 == 3: break
    return out

def fly_tree(kind, raw, frames, depth=0, b1654=0):
    # the shell's own state lives at SHELL: a child is flown after its parent's whole run (the parent's snapshots are taken)
    o = fly(kind, raw, frames, b1654)
    o['setup'] = raw.hex()
    o['children'] = []
    if depth >= 2: return o
    for fr in o['frames']:
        for cr in fr['created']:
            b = bytes.fromhex(cr)
            cid = struct.unpack_from('<I', b, 4)[0]
            if cid in ID_KIND:
                o['children'].append({'at': fr['k'], 'id': cid, 'run': fly_tree(ID_KIND[cid], b, frames, depth + 1)})
    return o

def call_action(c, step):
    CREATED.clear(); LOG.clear()
    ANS['frame'] = step.get('frame'); ANS['ended'] = step.get('ended', 0)
    if 'phase' in step: w8(BLOCK + 0x1a1, step['phase'])
    if 'shot' in step: w8(BLOCK + 0x1a2, step['shot'])
    fn = int(step['fn'], 16)
    E.call(fn, tuple([OWNER] + step.get('args', [])))
    assert E.fault is None, (step, E.fault)
    news = [S + 0xa0000 + 0x2000 * ((i + 1) % 8) for i in range(len(CREATED))]
    return [(b, r8(n + 0x1654)) for b, n in zip(list(CREATED), news)]

def run(c):
    owner_setup(c)
    set_joints(c['joints'])
    FLOOR_Y[0] = c.get('floorY', 0.0)
    shells = []
    for step in c['steps']:
        for raw, b1654 in call_action(c, step):
            sid = struct.unpack_from('<I', raw, 4)[0]
            shells.append({'frame': step.get('frame'), 'id': sid, 'mode': struct.unpack_from('<I', raw, 8)[0], 'raw': raw.hex(), 'b1654': b1654})
    for sh in shells:
        sh['run'] = fly_tree(ID_KIND[sh['id']], bytes.fromhex(sh['raw']), c.get('frames', 420), 0, sh['b1654']) if sh['id'] in ID_KIND else None
    return {'shells': shells}

if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    out = {}
    for c in cases:
        out[c['name']] = run(c)
    json.dump(out, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
