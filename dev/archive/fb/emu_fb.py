import os
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
import sys, struct, json, math, re
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
CUR = [('em021_00', '00')]
ANS = {'frame': None, 'ended': 0, 'rank': 5, 'quest': 10, 'variant': 0, 'mon': 'em021_00'}

def ret(val=None):
    if val is not None: uc.reg_write(UC_ARM_REG_R0, val & 0xffffffff)
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
def hook(addr, fn):
    uc.hook_add(UC_HOOK_CODE, lambda u, a, s, d: fn(), begin=addr, end=addr)
def set_s0(x): uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', x))[0])
def get_s0(): return struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0)))[0]

# ---- the arcs' shell files (loaded per monster on demand) ---------------------------------------------------------------
SH = {}
TUNE = {}
TUNEV = {}
CMN = {}
LOADED = set()
def load_mon(mon):
    if mon in LOADED: return
    LOADED.add(mon)
    FT = shellef.load_typed(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon))   # (one resource per path would drop the cmn FUP)
    def fupb(b):
        ver, ni, nf, nv = struct.unpack_from('<4I', b, 4)
        p = 20
        ints = list(struct.unpack_from('<%di' % ni, b, p)); p += 4 * ni
        fl = list(struct.unpack_from('<%df' % nf, b, p)); p += 4 * nf
        vecs = [list(struct.unpack_from('<3f', b, p + 12 * i)) for i in range(nv)]
        return {'ints': ints, 'floats': fl, 'vecs': vecs}
    byname = {}
    for (nm, th), b in FT.items(): byname.setdefault(nm.split(chr(92))[-1], []).append((th, b, nm))
    for short, lst in byname.items():
        for th, b, nm in lst:
            m = re.match(r'(em\d{3}_\d{2})_(\d{2}(?:_\d{2})?)_(sh|hit|ef)(\d{3})$', short)
            if m:
                key = (mon, m.group(2), int(m.group(4)))
                e = SH.setdefault(key, {'sh': None, 'hit': None, 'ef': None})
                if m.group(3) in ('sh', 'hit') and b[:4] == b'FUP\0': e[m.group(3)] = fupb(b)
                if m.group(3) == 'ef' and th == '1eb12c38': e['ef'] = shellef.parse_ef(b)['params'][0]['arr']
                continue
            m = re.match(r'(em\d{3}_\d{2})_(\d{2}(?:_\d{2})?)$', short)
            if m and b[:4] == b'FUP\0' and 'shell' in nm: CMN[(mon, m.group(2))] = fupb(b)
            if 'action_tune' in nm and b[:4] == b'FUP\0':
                ver, ni, nf, nv = struct.unpack_from('<4I', b, 4)
                TUNE[mon] = (list(struct.unpack_from('<%di' % ni, b, 20)), list(struct.unpack_from('<%df' % nf, b, 20 + 4 * ni)))
                TUNEV[mon] = [list(struct.unpack_from('<3f', b, 20 + 4 * ni + 4 * nf + 12 * i)) for i in range(nv)]
    # (2026-10-18) THE .shl's OWN FILE MAP: a mode's sh / hit / ef are the files its .shl entry names, which need not carry the
    # mode's number (Nerscylla's sp_00: modes 1..4 / 6..9 / 11..14 name 0's / 5's / 10's ef and hit). The numbered lookup above
    # stays for the modes the .shl names the same way; a mode it names otherwise takes the .shl's (logged to stderr)
    import shlmap
    for (folder, idx), row in shlmap.modes(FT).items():
        key = (mon, folder, idx)
        e = SH.setdefault(key, {'sh': None, 'hit': None, 'ef': None})
        for k in ('sh', 'hit'):
            if row.get(k) is not None:
                if e[k] is not None and e[k] != row[k]: sys.stderr.write('shl map: %s %s mode %d %s differs from the numbered file\n' % (mon, folder, idx, k))
                e[k] = row[k]
        if row.get('ef') is not None:
            if e['ef'] is not None and list(map(tuple, e['ef'])) != list(map(tuple, row['ef'])): sys.stderr.write('shl map: %s %s mode %d ef differs\n' % (mon, folder, idx))
            e['ef'] = row['ef']

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
        if not e or not e.get(kind): return ret(0xffffffff)
        L = e[kind]['ints']
        ret(L[i] if i < len(L) else 0xffffffff)
    return h
def g_float():
    i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
    e = ent(m)
    L = e['sh']['floats'] if e and e.get('sh') else []
    set_s0(L[i] if i < len(L) else 0.0)
    ret()
def g_vec():
    i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
    e = ent(m)
    L = e['sh']['vecs'] if e and e.get('sh') else []
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
def c_vec():
    c = CMN.get(CUR[0]); i = uc.reg_read(UC_ARM_REG_R1)
    if not c or i >= len(c['vecs']): return ret(0x19176b0)
    a = VECS + 0xf000 + 16 * i
    for k in range(3): wf(a + 4 * k, c['vecs'][i][k])
    ret(a)
hook(0x4a22a8, c_vec)
hook(0x4a2378, g_int('hit'))
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
for a in (0x3f883c, 0x3fa2bc, 0x41add8, 0x3ff044, 0x4041a8): hook(a, alloc)
# the heap sp_11's reader takes its time table from (0x7a75a0 -> vt+0x1c alloc, vt+0x34 free): a fake allocator over scratch
ALLOCOBJ, ALLOCVT, TABLES = S + 0x9e000, S + 0x9e100, [S + 0x9e400]
w32(ALLOCOBJ, ALLOCVT)
for i in range(0x40): w32(ALLOCVT + 4 * i, 0x1008)
w32(ALLOCVT + 0x1c, 0x1004); w32(ALLOCVT + 0x20, 0x1004)
def t_alloc():
    if uc.reg_read(UC_ARM_REG_R1) >= 0x400: return ret(SHELL)       # a DTI's new: the shell object
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
    CREATED.append(bytes(uc.mem_read(st, ANS.get('setupLen', 0x50))))   # (a case's setupLen: Lao-Shan Lung's sp_13 setup is 0x70)
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
    if uc.reg_read(UC_ARM_REG_R2) == 0:
        # no second point: from 100 above the point, straight down (the reach below is the stage's: the plane always under it)
        Fp = [Fp[0], f32(Fp[1] + 100.0), Fp[2]]
        Tp = [Fp[0], -1.0e9, Fp[2]]
    else:
        Tp = [rf(uc.reg_read(UC_ARM_REG_R2) + 4 * i) for i in range(3)]
        # (2026-10-18, READ 0x183664..0x183794: the second point sets only the START, p.y + max(to.y - p.y, 100) -- 0x1836e4..0x183724
        # -- and the ray goes down from there; how far 0xc30db4 reaches is NOT READ. A `to` ABOVE the point (base16's 500 up) is
        # modelled so; a `to` below keeps this harness's segment, as the earlier cases were checked with)
        if ANS.get('rayStart') and Tp[1] > Fp[1]:
            d = f32(Tp[1] - Fp[1])
            Fp = [Fp[0], f32((d if d > 100.0 else 100.0) + Fp[1]), Fp[2]]
            Tp = [Fp[0], -1.0e9, Fp[2]]
    sp = uc.reg_read(UC_ARM_REG_SP)
    hb, res = r32(sp), r32(sp + 4)
    P = plane(Tp, Fp, 0x10)
    # a ray cast UP through the floor (base24's 0x40e6f0 / 0x40e2ec: from 10000 below to 10000 above) meets the same plane
    if P is None and Fp[1] < Tp[1]: P = plane(Fp, Tp, 0x10)
    LOG.append(['ray', Fp, Tp, P])
    if hb: w8(hb, 1 if P else 0)
    if res:
        uc.mem_write(res, b'\0' * 0x30)
        wf(res + 0x20, 0.0); wf(res + 0x24, 1.0); wf(res + 0x28, 0.0)
    set_s0(P[1] if P else Fp[1])
    ret(1 if P else 0)
hook(0x183664, ray)
# (2026-10-19) a case's `probe49aec`: 0x49aec(e, &p, r2, area, [sp] &y, [sp+4] &result, ..) -- the ground probe (0x1814c0 -> 0x18154c, rom-map
# 0xbde60's row) answered by the floor plane: *y = FLOOR_Y, the result's +0x20.. the normal (0, 1, 0), return 1 (Akantor's burrow tell)
def probe49aec():
    if not ANS.get('probe49aec'): return None
    sp = uc.reg_read(UC_ARM_REG_SP)
    yp, res = r32(sp), r32(sp + 4)
    if yp: wf(yp, FLOOR_Y[0])
    if res:
        wf(res + 0x20, 0.0); wf(res + 0x24, 1.0); wf(res + 0x28, 0.0)
    ret(1)
hook(0x49aec, probe49aec)
# (2026-10-19) a case's `base32` (Crystalbeard's crystals, base32 0x415278): the height probe 0x18154c(mgr, &p, 0, area, [sp] &y, ..) answered
# by the floor plane (*y = FLOOR_Y, return 1; rom-map: the out height is written on a miss too), the registry 0x48bf4c (-> 1) / 0x48bf08 (->
# a zeroed record: byte +0xc 0, neither 7 nor 9) / 0x48c214 (unregister) answered; absent, native as before
B32REC = [None]
def probe18154c():
    if not ANS.get('base32'): return None
    sp = uc.reg_read(UC_ARM_REG_SP)
    yp = r32(sp)
    if yp: wf(yp, FLOOR_Y[0])
    LOG.append(['probe18154c', FLOOR_Y[0]])
    ret(1)
hook(0x18154c, probe18154c)
def reg48bf08():
    if not ANS.get('base32'): return None
    if B32REC[0] is None:
        B32REC[0] = S + 0xf8000
        uc.mem_write(B32REC[0], b'\0' * 0x40)
    ret(B32REC[0])
hook(0x48bf4c, lambda: ret(1) if ANS.get('base32') else None)
hook(0x48bf08, reg48bf08)
hook(0x48c214, lambda: ret() if ANS.get('base32') else None)
# 0x4a15d4(shell, slot, on): the body (hurt) registration of BodyDataList[slot] (0x16969c) -- not visual: logged, not run
hook(0x4a15d4, lambda: (LOG.append(['body', uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)]), ret()))
def probe49():
    Fp = [rf(uc.reg_read(UC_ARM_REG_R1) + 4 * i) for i in range(3)]
    sp = uc.reg_read(UC_ARM_REG_SP)
    hb, res = r32(sp), r32(sp + 0xc)
    Y = FLOOR_Y[0]
    hit = Fp[1] >= Y
    LOG.append(['probe', Fp, hit])
    if hb: w8(hb, 1 if hit else 0)
    if res and hit:
        uc.mem_write(res, b'\0' * 0x20); w8(res + 8, 0x10)
    set_s0(Y if hit else 0.0)
    ret(1 if hit else 0)
hook(0x49a90, probe49)
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
    # (2026-10-18: the core's own vtable 0x172a578, for a shell that calls the handle's vt+0x40 -- base16's phase 1 -- hooked below)
    if ANS.get('coreVt'): w32(h, 0x172a578)
    LOG.append(['start', r32(p), r32(p + 4), REQ[0]])
    ret(h)
hook(0x4a11e4, start)
hook(0x329c40, lambda: (LOG.append(['stop', uc.reg_read(UC_ARM_REG_R1)]), ret()))
# the core's vt+0x40 0x43384 (-> 0x3290c0: vt+0xa0, the unit's state 3): the handle KILLED -- logged, the fake unit's state set to 3
def kill_core():
    h = uc.reg_read(UC_ARM_REG_R0)
    LOG.append(['kill', h]); w32(h + 0xc, (r32(h + 0xc) & ~7) | 3); ret()
hook(0x43384, kill_core)
hook(0xb0974, lambda: ret(1 if ANS['frame'] is not None and f32(get_s0()) == f32(ANS['frame']) else 0))
# 0xb0968(e, mode, ?, f0, f1): the step's `win` answers it (Rajang's L2 M8 ball: mode 1 at 84.0 -- the case names the frame)
# (a step's `winFrames`: only the tests whose frame s0 is listed pass -- an action with two frame tests in one helper)
hook(0xb0968, lambda: ret((1 if f32(get_s0()) in ANS['winF'] else 0) if ANS.get('winF') is not None else (1 if ANS.get('win') else 0)))
hook(0xb09c8, lambda: ret(ANS['ended']))
# (2026-10-19) a step's `frame2`: 0xb09b0 (0x72714 mode 0 on channel 1, a frame handler's gate) answers 1 at that frame alone; absent: native
hook(0xb09b0, lambda: ret(1 if f32(get_s0()) == f32(ANS['frame2']) else 0) if ANS.get('frame2') is not None else None)
# (2026-10-19) a step's `frame3`: 0xb09a4 (0x72714 on channel 0 by r2 = 0: Diablos's frame handler 0xd35a94) answers 1 at that frame alone; absent: native
hook(0xb09a4, lambda: ret(1 if f32(get_s0()) == f32(ANS['frame3']) else 0) if ANS.get('frame3') is not None else None)
hook(0xbf0bc, lambda: ret(1 if ANS.get('landed') else 0))
# (2026-10-18) a step's `landed`: the landing tests 0xbf0bc / 0xbf52c answer 1 (Rustrazor's L9 M35 -> M36); else 0xbf52c runs native
hook(0xbf52c, lambda: ret(1) if ANS.get('landed') else None)
hook(0x7206c, lambda: None if 0x7206c in ANS.get('unstub', ()) else ret(0))   # (unstub: the countdown native -- Soulseer's rest)
hook(0x7264c, lambda: ret(0))
hook(0x16b4b4, lambda: ret(0x1234))
hook(0x3a8430, lambda: ret(ANS['rank']))
# 0x5cdf8(list, i): the i-th enemy -- with a case's `noEm` none (Gammoth's sp_00_02 / sp_13 hit-side loops over other em083s)
hook(0x5cdf8, lambda: ret(0) if ANS.get('noEm') else None)
# 0x783fc(e, word, ...): the owner's own turn -- with a case's `noTurn` none (the viewer's facing is its input: Elderfrost's L9 M7)
hook(0x783fc, lambda: ret(0) if ANS.get('noTurn') else None)
# 0x3f76d8(rng): a u16 draw -- with a case's `rng0` 0 (Elderfrost's 04_00 init draws twice and multiplies by its files' zero floats)
hook(0x3f76d8, lambda: ret(0) if ANS.get('rng0') else None)
hook(0x49930, lambda: ret(ANS['quest']))
def tune_f():
    k = uc.reg_read(UC_ARM_REG_R1)
    T = TUNE.get(ANS['mon'], ([], [])); set_s0(T[1][k] if k < len(T[1]) and (ANS['mon'] != 'em057_00') else 0.0); ret()
def tune_i():
    k = uc.reg_read(UC_ARM_REG_R1)
    T = TUNE.get(ANS['mon'], ([], [])); ret(T[0][k] if k < len(T[0]) and (ANS['mon'] != 'em057_00') else 0)
hook(0x6f618, tune_f)
# 0x6f640(e, k): the action tune's vec k (its address: the vec copied to a scratch slot the call returns)
def tune_v():
    k = uc.reg_read(UC_ARM_REG_R1); V = TUNEV.get(ANS['mon'], [])
    v = V[k] if k < len(V) else [0.0, 0.0, 0.0]
    a = BASE + 0x700
    for i in range(3): wf(a + 4 * i, v[i])
    ret(a)
hook(0x6f640, tune_v)
hook(0x6f62c, tune_i)
for a in (0x76c08, 0x76dd0, 0x7ded8, 0x7db70, 0x7fc00, 0xc0354, 0x7d65c, 0x7b53c, 0x7b518, 0x7bd18, 0xbc7f4, 0xbc984, 0x75230,
          0x82454, 0x768c8, 0x7fbd4, 0x82cd0, 0xafe84, 0xafce8, 0xaff50, 0x72620, 0xc10d4, 0xbe530, 0x7df8c, 0x7a820, 0xbf62c,
          0xbf700, 0xc241c, 0x7a258, 0x7a27c, 0x7e5c0, 0xeecb28, 0xef93d8, 0xb07b4, 0xbf4e4, 0x7fb68, 0xb09d0, 0x6fe88, 0x3fffcc, 0x329c9c, 0x329d04, 0xac030,
          0xc460c):   # 0xc460c: the target choice (block +0x1d0..; Gammoth's L2 M23 calls it) -- the case's target stays
    # (a case's `unstub` runs one of these natively: the heading writer 0xef93d8 for the heading-carry case)
    hook(a, (lambda a: (lambda: None if a in ANS.get('unstub', ()) else ret(0)))(a))

# (2026-10-18) a case's `stubs`: these answer 0 only when the case names them (Lao-Shan Lung's event-list flag / sound actions:
# 0xc44c70 / 0x3ae2c8, not shells); native otherwise
# (2026-10-19) + base42's 0x420fe0: a SOUND's ray from the shell toward the joint point (0x275dc0 / 0x807984, then 0x4ef25c / 0x4eeed0 with
# the sound ints +0x15cc / +0x15d4; it writes only +0x15ec, its repeat timer) -- not a shell's motion
# (2026-10-19) + 0x49710(byte e+0x1054, byte e+0x1065): an area query through a global manager the harness does not build (it faults);
# the Gore line's footfall dust 0xfb700c and (7, 0x64) take only the ray's mask from it (0x80 on 1) -- the viewer's floor has no mask
# (2026-10-19) + 0x276290 / 0x27482c (a player by index: the hunter loops of the Gore line's vt+0x1dc 0xfae824 and its scatter's chooser
# 0xfaf54c): no hunter -- the viewer's case
# (2026-10-19) + 0xc6d58: the target slots' update (block +0x1d0..; vt+0x204 0xfadfa0 calls it on every action start but status 0x10) --
# the case's target stays
# (2026-10-19) + 0xc8280: the hunter hit-data row (e+0x75c2; rom-map 0xf76490) -- the hit side, its player manager not built
# (2026-10-19) + 0x4342ac: base58's sound (cmn int by +0x1634, its ray 0x807984, 0x4ef25c / 0x4eeed0; writes only +0x15c8, its timer)
# (2026-10-19) + 0x275dc0 / 0x807984 / 0x4ef25c / 0x4eeed0: a sound's ray and play called inline (Gravios's sp_13 +0x158 0xd315f4 tail,
# after base13's move): audio, not a shell's motion
for a in (0xc44c70, 0x3ae2c8, 0x420fe0, 0x49710, 0x276290, 0x27482c, 0xc6d58, 0xc8280, 0x4342ac, 0x275dc0, 0x807984, 0x4ef25c, 0x4eeed0):
    hook(a, (lambda a: (lambda: ret(0) if a in ANS.get('stubs', ()) else None))(a))

# ---- owner, joints ----------------------------------------------------------------------------------------------------
def owner_setup(c):
    uc.mem_write(OWNER, b'\0' * 0xd000)
    uc.mem_write(BLOCK, b'\0' * 0x6000)
    uc.mem_write(CTL, b'\0' * 0x200)
    w32(OWNER, OWNVT); w32(OWNER + 0xc, 1); w32(OWNER + 0x1428, BLOCK); w32(OWNER + 0xcac0, CTL)
    wf(OWNER + 0x1c, 1.0); wf(OWNER + 0x50c, 1.0)          # the owner's step and motion speed (0xb0910)
    for k, v2 in (c.get('owner_bytes') or {}).items(): uc.mem_write(OWNER + int(k, 0), bytes(v2))
    for k, v2 in (c.get('block_bytes') or {}).items(): uc.mem_write(BLOCK + int(k, 0), bytes(v2))   # the block [e+0x1428] (a part's durability +0x3c0 + 12k)
    for i in range(0x200): w32(OWNVT + 4 * i, 0x3fa078)   # (0x200: the break handler vt+0x410 too)
    w32(OWNVT + 0x88, 0x6bbb0)
    w32(OWNVT + 0x370, 0xa3bf4)
    if c.get('ownvt54'): w32(OWNVT + 0x54, 0xc156c)      # the enemy's own vt+0x54: a joint's world matrix (a joint-parented unit's)
    for k, fn in (c.get('ownvt') or {}).items(): w32(OWNVT + int(k, 0), int(fn, 0))   # a case's own enemy vtable slots (vt+0x9c 0x6bb20: e+0x1053)
    ANS['unstub'] = set(int(x, 0) for x in c.get('unstub', [])); ANS['stubs'] = set(int(x, 0) for x in c.get('stubs', [])); ANS['setupLen'] = c.get('setupLen', 0x50)
    v = c['variant']; ANS['variant'] = v; ANS['rank'] = c.get('rank', 5); ANS['quest'] = c.get('quest', 10)
    ANS['mon'] = c['mon']
    load_mon(c['mon'])
    FOLDER.clear(); FOLDER.update({int(k): tuple(v2) for k, v2 in c['folders'].items()})
    w8(OWNER + 0xb5f4, int(c['mon'][2:5])); w8(OWNER + 0xb5f5, v)
    if c['mon'].startswith('em057'):
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
    if c.get('dtp') is not None:     # the .dtp parts array: [[e+0x75f0]+0x64] = A (8 x 4 B: part, low-rank / G thresholds)
        w32(OWNER + 0x75f0, S + 0xf0000); w32(S + 0xf0064, S + 0xf0100); uc.mem_write(S + 0xf0100, bytes(c['dtp']))
    w8(BLOCK + 0x5df3, 1 if c.get('charged') else 0)
    w8(BLOCK + 0x518, 1 if c.get('rage') else 0)
    w16(BLOCK + 0x3b4, 1 if c.get('severed') else 0)
    w16(BLOCK + 0xb0a, 0x1234)
    w32(CTL + 0x18, c.get('heading', oY))
    for k, bb in (c.get('ctl') or {}).items(): uc.mem_write(CTL + int(k, 0), bytes(bb))
    for k, bb in (c.get('block') or {}).items(): uc.mem_write(BLOCK + int(k, 0), bytes(bb))
    # a case's `frameStep`: the game's frame step [[0x211f764]+0x68] (null in this harness unless named; Kushala's sway clock)
    w32(0x211f764, 0)
    if c.get('frameStep') is not None:
        G = S + 0xf9800; uc.mem_write(G, b'\0' * 0x100); wf(G + 0x68, c['frameStep']); w32(0x211f764, G)

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

# THE KINDS, from the shell table 0x175c3e8 (12-byte rows: class DTI, setup DTI, resource) and the booted DTIs: the class DTI's
# vt+8 is its `new` (the allocation answered with SHELL, then the ctor inline); the vtable is the one the new stores; init
# vt+0x13c, move vt+0x24; the timer field by the setup's base (base00 +0x162c, base01 / base11 +0x1614, base04 +0x15cc)
SHELLTAB = json.load(open(r'C:\MHGU-Extract\efx\agents\narga-shell-scratch\shelltable.json'))
ROWS = {r['id']: r for r in SHELLTAB}
TOFF = {'cSetupParamEmBase00': 0x162c, 'cSetupParamEmBase01': 0x1614, 'cSetupParamEmBase04': 0x15cc, 'cSetupParamEmBase13': 0x1638, 'cSetupParamEmBase22': 0x1648, 'cSetupParamEmBase24': 0x160c, 'cSetupParamEmBase23': 0x1608, 'cSetupParamEmBase25': 0x15e8, 'cSetupParamEmBase26': 0x161c, 'cSetupParamEmBase16': 0x1604, 'cSetupParamEmBase36': 0x1634, 'cSetupParamEm012_13': 0x1638, 'cSetupParamEmBase20': 0x15f0, 'cSetupParamEmBase21': 0x1618, 'cSetupParamEmBase48': 0x1614, 'cSetupParamEmBase32': 0x1630, 'cSetupParamEmBase44': 0x15e0, 'cSetupParamEmBase52': 0x15dc, 'cSetupParamEmBase53': 0x15e4}
CONV = [0]
FOLDER = {}          # id -> (monster, folder), filled per case from c['folders'] {id: [mon, folder]}
def kind_of(sid):
    r = ROWS[sid]
    dti = int(r['cls']['dti'], 16)
    newf = r32(r32(dti) + 8)
    return newf, TOFF.get(r['setup']['name'].split('::')[-1], 0x162c)
def make_shell(sid):
    newf, toff = kind_of(sid)
    uc.mem_write(SHELL, b'\0' * 0x1800)
    E.call(newf, ()); assert E.fault is None, E.fault
    vt = r32(SHELL)
    return r32(vt + 0x13c), r32(vt + 0x24), toff

SLOTN = {}
SLT = [None]
def slot_step(sl):
    if not sl[2]: return
    if sl[0] > 0:
        d = f32(sl[0] - 1.0); sl[0] = d
        if d > 0: return
        sl[1] = f32(d + sl[1]); sl[0] = 0.0; return
    if not (sl[1] > 0): sl[2] = 0; return
    sl[1] = f32(sl[1] - 1.0)
def fly(sid, raw, frames, b1654=0):
    CUR[0] = FOLDER[sid]
    LOG.clear(); CREATED.clear(); next_handle[0] = S + 0x50000
    init, move, toff = make_shell(sid)
    kk0 = '%d:%d' % struct.unpack_from('<II', raw, 4); SLOTN[kk0] = SLOTN.get(kk0, 0) + 1
    wf(SHELL + 0x1c, 1.0)
    w32(SHELL + 0x136c, SETUP); w32(SHELL + 0x1384, RES); w8(RES + 0x50, 1)
    # a case's `bodydata` {slot: radius}: the shell resource's BodyDataList (+0xc4 + 4 slot, 0x489e44 / 0x489e50, 8 slots), each an
    # rBodyData (vtable 0x172bd3c: vt+0x40 0x50fac = its +0x68, the first record) whose record's +0x10 is the radius (Tetsucabra's sp_16)
    uc.mem_write(RES + 0xc4, b'\0' * 0x20)
    for slot, rad in (ANS.get('bodydata') or {}).items():
        ob = S + 0xf8000 + 0x100 * int(slot); uc.mem_write(ob, b'\0' * 0x100)
        w32(ob, 0x172bd3c); w32(ob + 0x68, ob + 0x80); wf(ob + 0x90, rad); w32(RES + 0xc4 + 4 * int(slot), ob)
    n = ANS.get('setupLen', 0x50); uc.mem_write(SETUP, b'\0' * n); uc.mem_write(SETUP, raw[:n]); w32(SETUP + 0xc, OWNER)
    w8(SHELL + 4, 0)
    r = E.call(init, (SHELL, SETUP)); assert E.fault is None, E.fault
    if b1654: w8(SHELL + 0x1654, 1)
    out = {'init': r, 'spawn': snap(toff), 'log': list(LOG), 'created': [c.hex() for c in CREATED], 'frames': []}
    if os.environ.get('DUMPF'): out['fields'] = {hex(o): hex(r32(SHELL + o)) for o in range(0x15c8, 0x1680, 4)}
    LOG.clear(); CREATED.clear()
    # a case's `initOk` (2026-10-19): ids whose init's 0 is only the hit side's answer the harness cannot give (Gravios's sp_13
    # +0x13c 0xd31390 returns 0x4a158c's lookup of his attack data, after base13's init made the shell): flown anyway
    if not r and not (sid in (ANS.get('initOk') or ())): return out
    for k in range(1, frames + 1):
        # (`slot0`: hit slot 0's on-byte held set at depth 0, or at the depths `slot0Depths` names -- Gammoth's pieces at 1)
        # (`slot0Modes`: only the shells whose setup mode +8 it lists -- Lagiacrus's sp_26 2 carries no hit record)
        if ANS.get('slot0') and DEPTH[0] in ANS.get('slot0Depths', [0]) and \
           (ANS.get('slot0Modes') is None or r32(SETUP + 8) in ANS['slot0Modes']) and \
           (ANS.get('slot0Ids') is None or r32(SETUP + 4) in ANS['slot0Ids']): w8(SHELL + 0x13ad, 1)
        # a case's `slot0Until` {'id:mode': move} (2026-10-18): hit slot 0's byte held through that move and cleared after it -- the life the
        # module's slot count gives a timer-0 shell (delay + duration + 1 moves), so both end on the same move
        # a case's `slot0Timer` {'id:mode': [delay, duration, pre]} (2026-10-20): hit slot 0's on-byte +0x13ad, delay +0x1404 and duration
        # +0x1408 written before each move from the module's slot model (slotStep, 0x168d30: delay > 0 -> delay -= 1, at <= 0 the overshoot
        # into the duration and delay 0; else duration <= 0 -> off; else duration -= 1), stepped after the move; `pre` steps before move 1
        # (a child its maker's last unit made: the slot pass of the creating update). Gypceros's bases 44 / 52 / 53 read the delay and duration
        if k == 1:
            st0 = (ANS.get('slot0Timer') or {}).get('%d:%d' % (r32(SETUP + 4), r32(SETUP + 8)))
            SLT[0] = [f32(st0[0]), f32(st0[1]), 1] if st0 else None
            if SLT[0]:
                for _ in range(st0[2] if len(st0) > 2 else 0): slot_step(SLT[0])
        if SLT[0]:
            w8(SHELL + 0x13ad, SLT[0][2]); wf(SHELL + 0x1404, SLT[0][0]); wf(SHELL + 0x1408, SLT[0][1])
        su = ANS.get('slot0Until')
        kk = '%d:%d' % (r32(SETUP + 4), r32(SETUP + 8))
        if su and kk in su:
            # (a list: one life per flight of that key in the run's order -- Teostra's ring: the first pillar the leader makes is counted from
            # the step it is made in, before its first move, the module's line-18 order for a child of the last unit)
            u = su[kk]
            if isinstance(u, list): u = u[min(SLOTN.get(kk, 1) - 1, len(u) - 1)]
            w8(SHELL + 0x13ad, 1 if k <= u else 0)
        tr = TRACK.get(k)
        if tr is not None:
            w16(OWNER + 0x4b4, tr[0]); ANS['win'] = tr[1]
        # a case's `actionAt` {at, before, action} (2026-10-18): the owner's action e+0x73e0 / +0x73e1 before each move of a depth-0 shell
        # -- `action` from the step whose frame (the creating step's frame + k - 1) reaches `at`, `before` until then (Teostra's leading
        # powder waits for (7, 0x2d) / (7, 0x2e): the play's next action)
        aa = ANS.get('actionAt')
        if aa and DEPTH[0] == 0 and ANS.get('curFrame') is not None:
            uc.mem_write(OWNER + 0x73e0, bytes(aa['action'] if ANS['curFrame'] + k - 1 >= aa['at'] else aa['before']))
        # a case's POKES: owner bytes written before frame k's move (Rustrum's e+0xcae0 = 2, the L9 M11 throw of the held sp_13)
        for off, b in (ANS.get('pokes') or {}).get(str(k), {}).items():
            if DEPTH[0] == ANS.get('pokeDepth', 0): uc.mem_write(OWNER + int(off, 0), bytes(b))
        # a case's CONVERT: the monster's own call on a held, landed shell (Rustrum's sp_24: 0xf34a20(shell, mode) -> sp_19,
        # 0xf34b4c(shell) -> sp_13) -- the enemy's line 4, so BEFORE frame k's move: made on the `after`-th frame that starts with
        # the shell landed (+0x1631) and in state 1
        cv = ANS.get('convert')
        if cv and DEPTH[0] == 0 and int(cv['id'], 0) == sid and r8(SHELL + 0x1631) == 1 and r8(SHELL + 4) == 1:
            CONV[0] += 1
            if CONV[0] == cv.get('after', 1):
                E.call(int(cv['fn'], 16), tuple([SHELL] + cv.get('args', []))); assert E.fault is None, ('convert', E.fault)
        # a case's `slotSelf`: the owner block's slot handle (+4 + 4 x the shell's +0x1640) is the flown shell itself, before each move at
        # depth 0 (Najarala's scale finds itself in [e+0xcac0]+4..+0x10, 0x419fe4)
        if ANS.get('slotSelf') and DEPTH[0] == 0: w32(CTL + 4 + 4 * (r32(SHELL + 0x1640) & 3), SHELL)
        # a case's `activate` (2026-10-19): the unit walker's start before the first move, in the same pass (0xc04588..0xc045b8: state 1
        # -> 2, vt+0x18, then vt+0x24) -- base42's 0x420ac8 (its ef 0 started there); every other emu'd base's vt+0x18 is `bx lr` 0x4a1694
        if k == 1 and ANS.get('activate') and (ANS['activate'] is True or sid in ANS['activate']):
            w32(SHELL + 0xc, (r32(SHELL + 0xc) & ~7) | 2)
            E.call(r32(r32(SHELL) + 0x18), (SHELL,)); assert E.fault is None, (k, 'activate', E.fault)
        E.call(move, (SHELL,)); assert E.fault is None, (k, E.fault)
        if SLT[0]: slot_step(SLT[0])
        # a case's `post28`: the shell's vt+0x28 after its move, as the unit walker runs it (Gammoth's sp_13 splits there)
        if ANS.get('post28'):
            E.call(r32(r32(SHELL) + 0x28), (SHELL,)); assert E.fault is None, (k, 'post28', E.fault)
        s = snap(toff); s['k'] = k; s['log'] = list(LOG); s['created'] = [c.hex() for c in CREATED]
        LOG.clear(); CREATED.clear()
        out['frames'].append(s)
        if s['state'] == 0xff or r32(SHELL + 0xc) & 7 == 3: break
    return out

DEPTH = [0]
def fly_tree(sid, raw, frames, depth=0, b1654=0):
    # the shell's own state lives at SHELL: a child is flown after its parent's whole run (the parent's snapshots are taken)
    DEPTH[0] = depth
    o = fly(sid, raw, frames, b1654)
    o['setup'] = raw.hex()
    o['children'] = []
    if depth >= ANS.get('treeDepth', 2): return o     # (a case's treeDepth: Lagiacrus's sp_00 -> sp_01 -> sp_11 -> sp_01)
    # a case's `creatorCopy` (2026-10-18): a child whose setup +0x10 names its creator (Chameleos's cloud reads the creator's +0xfec) gets
    # a copy of the creator as its flight left it -- SHELL itself is the next child's by then
    cc = None
    if ANS.get('creatorCopy'):
        cc = S + 0xe0000 + 0x2000 * depth
        uc.mem_write(cc, bytes(uc.mem_read(SHELL, 0x1800)))
    for fr in o['frames']:
        for cr in fr['created']:
            b = bytes.fromhex(cr)
            if cc is not None and len(b) >= 0x14 and struct.unpack_from('<I', b, 0x10)[0] == SHELL:
                b = b[:0x10] + struct.pack('<I', cc) + b[0x14:]
            cid = struct.unpack_from('<I', b, 4)[0]
            if cid in FOLDER:
                o['children'].append({'at': fr['k'], 'id': cid, 'run': fly_tree(cid, b, frames, depth + 1)})
    return o

def call_action(c, step):
    CREATED.clear(); LOG.clear()
    ANS['frame'] = step.get('frame'); ANS['ended'] = step.get('ended', 0); ANS['win'] = step.get('win', 0)
    ANS['frame2'] = step.get('frame2')
    ANS['frame3'] = step.get('frame3')
    ANS['landed'] = step.get('landed', 0)
    ANS['winF'] = [f32(x) for x in step['winFrames']] if step.get('winFrames') is not None else None
    if 'phase' in step: w8(BLOCK + 0x1a1, step['phase'])
    # a step's `blockPos`: the block's (and the owner's) +0x40.. before the call (Mizutsune's trails read the travel)
    if step.get('blockPos') is not None:
        for k in range(3): wf(BLOCK + 0x40 + 4 * k, step['blockPos'][k]); wf(OWNER + 0x40 + 4 * k, step['blockPos'][k])
    if 'shot' in step: w8(BLOCK + 0x1a2, step['shot'])
    # a step's `owner`: owner bytes written before the call (Amatsu's phase byte e+0x15e1, 2026-10-19)
    for k, bb in (step.get('owner') or {}).items(): uc.mem_write(OWNER + int(k, 0), bytes(bb))
    # a step's `block`: block bytes written before the call (Kushala's shot counter P+0x1a3, 2026-10-18)
    for k, bb in (step.get('block') or {}).items(): uc.mem_write(BLOCK + int(k, 0), bytes(bb))
    fn = int(step['fn'], 16)
    E.call(fn, tuple([OWNER] + step.get('args', [])))
    assert E.fault is None, (step, E.fault)
    news = [S + 0xa0000 + 0x2000 * ((i + 1) % 8) for i in range(len(CREATED))]
    return [(b, r8(n + 0x1654)) for b, n in zip(list(CREATED), news)]

TRACK = {}
def run(c):
    TRACK.clear()
    last = None
    for k, v in sorted(((int(k), v) for k, v in (c.get('track') or {}).items())):
        TRACK[k] = v
    owner_setup(c)
    ANS['slot0'] = bool(c.get('slot0')); ANS['slot0Depths'] = c.get('slot0Depths', [0]); ANS['slot0Modes'] = c.get('slot0Modes'); ANS['slot0Ids'] = c.get('slot0Ids')
    ANS['convert'] = c.get('convert'); CONV[0] = 0
    ANS['pokes'] = c.get('pokes'); ANS['pokeDepth'] = c.get('pokeDepth', 0)
    ANS['treeDepth'] = c.get('treeDepth', 2)
    ANS['bodydata'] = c.get('bodydata'); ANS['rayStart'] = bool(c.get('rayStart')); ANS['coreVt'] = bool(c.get('coreVt'))
    ANS['creatorCopy'] = bool(c.get('creatorCopy'))
    ac = c.get('activate'); ANS['activate'] = True if ac is True else (set(int(x, 0) for x in ac) if ac else None)   # (ids whose vt+0x18 runs)
    ANS['slot0Until'] = c.get('slot0Until')
    ANS['slot0Timer'] = c.get('slot0Timer')
    ANS['initOk'] = set(int(x, 0) for x in c.get('initOk', []))
    ANS['probe49aec'] = bool(c.get('probe49aec'))
    ANS['base32'] = bool(c.get('base32'))
    # (base32's live count, the static [0x2129c98] the ctor 0x415010 raises and the dtor 0x415180 lowers -- the harness runs no dtor, so
    # each case starts it at 0, as a fresh quest would)
    if ANS['base32']: w32(0x2129c98, 0)
    ANS['slotSelf'] = bool(c.get('slotSelf')); ANS['post28'] = bool(c.get('post28')); ANS['noEm'] = bool(c.get('noEm')); ANS['noTurn'] = bool(c.get('noTurn')); ANS['rng0'] = bool(c.get('rng0'))
    set_joints(c['joints'])
    # a case's `precall`: the owner's own calls before the steps (Elderfrost's action setter arm 0x1051ebc(e, r1, r2, r3): e+0xcb10)
    for pc in c.get('precall', []):
        E.call(int(pc['fn'], 16), tuple([OWNER] + pc.get('args', []))); assert E.fault is None, ('precall', E.fault)
    FLOOR_Y[0] = c.get('floorY', 0.0)
    shells = []
    for step in c['steps']:
        for raw, b1654 in call_action(c, step):
            sid = struct.unpack_from('<I', raw, 4)[0]
            shells.append({'frame': step.get('frame'), 'id': sid, 'mode': struct.unpack_from('<I', raw, 8)[0], 'raw': raw.hex(), 'b1654': b1654})
    ANS['landed'] = 0
    ANS['actionAt'] = c.get('actionAt')
    SLOTN.clear()
    for sh in shells:
        ANS['curFrame'] = sh['frame']
        sh['run'] = fly_tree(sh['id'], bytes.fromhex(sh['raw']), c.get('frames', 420), 0, sh['b1654']) if sh['id'] in FOLDER else None
    return {'shells': shells}

if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    out = {}
    for c in cases:
        out[c['name']] = run(c)
    json.dump(out, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
