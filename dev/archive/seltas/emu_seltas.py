"""The Seltas Queen's (em069_00) and Seltas's (em076_00) shells on the ROM -- the whole executable after its static initialisers
(sw37/emu37.py's machine), with the em069_00.arc / em076_00.arc shell files:
  her shell00 0x127 uShellEm069_sp_00 : base00 (ctor 0xf9a88c, init 0x3f8b80 -> reader 0xf9a8ac, move 0x3f96a0, landing 0xf9ab08)
  her shell01 0x128 uShellEm069_sp_01 : base01 (ctor 0xf9add0, init 0x3fa498 -> reader 0xf9adf0, move 0x3faec4)
  his shell00 0x139 uShellEm076_sp_00 : base00 (ctor 0xfd97cc, reader 0xfd97ec, landing 0xfd9918)
  his shell01 0x13a uShellEm076_sp_01 : base01 (ctor 0xfd9b94, reader 0xfd9bb4)
  his shell37 0x13b uShellEm076_sp_37 : base37 (ctor 0xfd9d50, init 0x41b1ec -> reader 0xfd9d70, move 0x41bb10, landing 0x41ae14)
The setups are the classes' own action code run on the ROM: hers 0xf938c0 (7, 0x09) phase 1, 0xf954f4 (7, 0x38) phase 1 (the
link bit), 0xf8f5bc (1, 0x20) / 0xf92d40 (4, 0x04) phase 2, 0xf91bdc (2, 0x14) / 0xf91638 (2, 0x11) the landing phase, 0xf92358
(6, 0x00) phase 1, 0xf9514c (7, 0x36) phase 1 at M4's end; his 0xfd4924 (the spit's aim) + 0xfd4b00(e, arg) per crossing, 0xfd1e98
(7, 0x02) / 0xfd2ce0 (7, 0x07) / 0xfd4eb0 (7, 0x39) / 0xfd5350 (7, 0x3a) phase 1. Each is called once per frame the case lists,
with the frame test 0xb0974 answering 1 for that frame alone; the state the action keeps between them (P+0x1a2, P+0x30.., the
[+0xcac0]+6 pitch) is the ROM's own. A shell01 from a landing is flown from the setup the ROM's landing built.
HOOKED: the rShell getters -> the files; 0x43a850 -> 1; 0x4a1ad8 -> 0 (no hit registration); 0x43ab74 -> the scale words; the setup
allocators 0x3f883c / 0x3fa2bc / 0x41add8 -> scratch; 0x48b884 -> the setup logged; 0x183490 -> the floor plane; the effect
requester / start / stop 0x4a10c8 / 0x4a11e4 / 0x329c40 -> logged; the action helpers the spawners call that are not the shells'
(motion setters, turns, sounds, timers, the leap, 0xc10d4's prediction, 0x16b4b4's draw) -> stubs; 0xb0974 / 0xb0968 / 0xb09c8 /
0xbf0bc -> the case's frame, 0, the case's motion-end and landing answers. The link parent (P+0x5c30) is a fake unit whose vtable
+0xd0 returns the case's joint-200 matrix.
Usage: python emu_seltas.py cases.json out.json"""
import sys, struct, json
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
def w8(a, v): uc.mem_write(a, bytes([v & 0xff]))
def r8(a): return uc.mem_read(a, 1)[0]
def s32v(v): return struct.unpack('<i', struct.pack('<I', v & 0xffffffff))[0]
def f32(x): return struct.unpack('<f', struct.pack('<f', x))[0]

S = emu.SCRATCH_LO
SHELL, SETUP, OWNER, BLOCK, OWNVT, EPS, HANDLES, VECS, SETUPS, JOINTS, MAP, RES, CTL, PARENT, PVT, MAT, BASE = (
    S, S + 0x2000, S + 0x10000, S + 0x20000, S + 0x30000, S + 0x40000, S + 0x50000, S + 0x60000,
    S + 0x70000, S + 0x90000, S + 0x98000, S + 0x9c000, S + 0x9d000, S + 0x9e000, S + 0x9e800, S + 0x9f000, S + 0x9f800)
FAKE_D0 = 0x00001000          # an address in .text the parent's vt +0xd0 points at; hooked to return MAT
FLOOR_Y = [0.0]
LOG = []
next_handle = [S + 0x50000]
next_setup = [SETUPS]
CUR = [('em069_00', '00')]
ANS = {'frame': None, 'ended': 0, 'landed': 0}

def ret(val=None):
    if val is not None: uc.reg_write(UC_ARM_REG_R0, val & 0xffffffff)
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))

def hook(addr, fn):
    uc.hook_add(UC_HOOK_CODE, lambda u, a, s, d: fn(), begin=addr, end=addr)

def set_s0(x): uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', x))[0])
def get_s0(): return struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0)))[0]

# ---- the arcs' shell files --------------------------------------------------------------------------------------------
SH = {}
for mon, folders in (('em069_00', (('00', 4), ('01', 7))), ('em076_00', (('00', 4), ('01', 4), ('37', 9)))):
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
    for folder, n in folders:
        for m in range(n):
            sh = fup('%s_%s_sh%03d' % (mon, folder, m))
            if sh is None: continue
            SH[(mon, folder, m)] = {'sh': sh, 'hit': fup('%s_%s_hit%03d' % (mon, folder, m)), 'ef': efp('%s_%s_ef%03d' % (mon, folder, m))}

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
        if not e: return ret(0xffffffff)
        L = e[kind]['ints']
        ret(L[i] if i < len(L) else 0)
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
hook(0x4a22f0, g_ef)
hook(0x4a23f4, g_int('hit'))
hook(0x4a2470, g_int('sh'))
hook(0x4a24f8, g_float)
hook(0x4a2584, g_vec)

def a850():
    w32(SHELL + 0x1374, 1); ret(1)
hook(0x43a850, a850)
hook(0x4a1ad8, lambda: ret(0))
def ab74():
    sh = uc.reg_read(UC_ARM_REG_R0)
    s0 = get_s0()
    for k in range(3): wf(sh + 0x60 + 4 * k, s0)
    w32(sh + 0x6c, 0)
    LOG.append(['scale', s0])
    ret()
hook(0x43ab74, ab74)
def alloc():
    a = next_setup[0]; next_setup[0] += 0x80
    uc.mem_write(a, b'\0' * 0x80)
    ret(a)
for a in (0x3f883c, 0x3fa2bc, 0x41add8): hook(a, alloc)
CREATED = []
def create():
    st = uc.reg_read(UC_ARM_REG_R1)
    CREATED.append(bytes(uc.mem_read(st, 0x50)))
    LOG.append(['create', r32(st + 4), r32(st + 8)])
    ret(0)
hook(0x48b884, create)
def q_plane():
    A = [rf(uc.reg_read(UC_ARM_REG_R1) + 4 * i) for i in range(3)]
    B = [rf(uc.reg_read(UC_ARM_REG_R2) + 4 * i) for i in range(3)]
    sp = uc.reg_read(UC_ARM_REG_SP)
    out, res, mask = r32(sp), r32(sp + 4), r32(sp + 8)
    Y = FLOOR_Y[0]
    d2 = f32(f32(f32(A[1] - B[1]) ** 2) + f32(f32(A[0] - B[0]) ** 2))
    d2 = f32(d2 + f32(f32(A[2] - B[2]) ** 2))
    LOG.append(['query', mask])
    if d2 < 1.1920928955078125e-07 or not (mask & 0x10) or not (B[1] >= Y and A[1] < Y):
        return ret(0)
    t = f32(f32(B[1] - Y) / f32(B[1] - A[1]))
    P = [f32(B[i] + f32(t * f32(A[i] - B[i]))) for i in range(3)]
    P[1] = Y
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
# the action code's own world: the frame tests, the motion-end test, the landing test, and every helper that is not the shells'
hook(0xb0974, lambda: ret(1 if ANS['frame'] is not None and f32(get_s0()) == f32(ANS['frame']) else 0))
hook(0xb0968, lambda: ret(0))
hook(0xb09c8, lambda: ret(ANS['ended']))
hook(0xbf0bc, lambda: ret(ANS['landed']))
hook(0x7206c, lambda: ret(0))
hook(0x7264c, lambda: ret(0))
hook(0x16b4b4, lambda: ret(0x1234))
for a in (0x76c08, 0x76dd0, 0x7ded8, 0x7db70, 0x7fc00, 0xc0354, 0x7d65c, 0x7b53c, 0x7b518, 0x7bd18, 0xbc7f4, 0xbc984, 0x75230,
          0x82454, 0x768c8, 0x7fbd4, 0x82cd0, 0xafe84, 0xafce8, 0xaff50, 0x72620, 0xc10d4, 0xbe530, 0x7df8c, 0x7a820, 0xbf62c,
          0xbf700, 0xc241c, 0x7a258, 0x7a27c, 0x7e5c0):
    hook(a, lambda: ret(0))
hook(FAKE_D0, lambda: ret(MAT))

# ---- owner, joints ----------------------------------------------------------------------------------------------------
def owner_setup(c):
    uc.mem_write(OWNER, b'\0' * 0xd000)
    uc.mem_write(BLOCK, b'\0' * 0x6000)
    uc.mem_write(CTL, b'\0' * 0x100)
    w32(OWNER, OWNVT); w32(OWNER + 0xc, 1); w32(OWNER + 0x1428, BLOCK); w32(OWNER + 0xcac0, CTL)
    for i in range(0x100): w32(OWNVT + 4 * i, 0x3fa078)
    w32(OWNVT + 0x88, 0x6bbb0)
    oX, oY, oZ = c['owner']
    w32(BLOCK + 0x50, oX); w32(BLOCK + 0x54, oY); w32(BLOCK + 0x58, oZ)
    for k in range(3):
        wf(BLOCK + 0x1d0 + 4 * k, c['target'][k])
        wf(BLOCK + 0x40 + 4 * k, c['ownerPos'][k]); wf(OWNER + 0x40 + 4 * k, c['ownerPos'][k])
    w32(OWNER + 0xfe8, oX & 0xffff); w32(OWNER + 0xfec, oY & 0xffff); w32(OWNER + 0xff0, oZ & 0xffff)
    sz = c.get('size', [1.0, 1.0])
    wf(BLOCK + 0x1ac, sz[0]); wf(BLOCK + 0x1b0, sz[1])
    wf(BLOCK + 0x5b4, c.get('ground', c.get('floorY', 0.0)))
    w32(OWNER + 0x75e8, BASE); wf(BASE + 0x64, c.get('base', 1.0))
    w8(OWNER + 0xb5f5, 0)
    if c.get('linked'): w8(BLOCK + 0x1bb, 1)
    L = c.get('link')
    if L:
        uc.mem_write(PARENT, b'\0' * 0x100); w32(PARENT, PVT)
        for i in range(0x40): w32(PVT + 4 * i, 0x3fa078)
        w32(PVT + 0xd0, FAKE_D0)
        for k in range(16): wf(MAT + 4 * k, L['matrix'][k])
        w32(BLOCK + 0x5c30, PARENT)
        if L.get('partner', True): w32(CTL + 0x50, PARENT)

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
    ('em069_00', '00'): (0xf9a88c, 0x3f8b80, 0x3f96a0, 0x162c),
    ('em069_00', '01'): (0xf9add0, 0x3fa498, 0x3faec4, 0x1614),
    ('em076_00', '00'): (0xfd97cc, 0x3f8b80, 0x3f96a0, 0x162c),
    ('em076_00', '01'): (0xfd9b94, 0x3fa498, 0x3faec4, 0x1614),
    ('em076_00', '37'): (0xfd9d50, 0x41b1ec, 0x41bb10, 0x1614),
}
CHILD = {0x128: ('em069_00', '01'), 0x13a: ('em076_00', '01')}
ID_KIND = {0x127: ('em069_00', '00'), 0x128: ('em069_00', '01'), 0x139: ('em076_00', '00'), 0x13a: ('em076_00', '01'), 0x13b: ('em076_00', '37')}

def fly(kind, raw, frames):
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

def fly_tree(kind, raw, frames, depth=0):
    o = fly(kind, raw, frames)
    o['setup'] = raw.hex()
    o['children'] = []
    if depth >= 1: return o
    for fr in o['frames']:
        for cr in fr['created']:
            b = bytes.fromhex(cr)
            cid = struct.unpack_from('<I', b, 4)[0]
            if cid in CHILD:
                o['children'].append({'at': fr['k'], 'id': cid, 'run': fly_tree(CHILD[cid], b, frames, depth + 1)})
    return o

def call_action(c, step):
    """One update of the action (the case's spawner) at one frame; the setups it hands 0x48b884."""
    CREATED.clear(); LOG.clear()
    ANS['frame'] = step.get('frame'); ANS['ended'] = step.get('ended', 0); ANS['landed'] = step.get('landed', 0)
    if 'phase' in step: w8(BLOCK + 0x1a1, step['phase'])
    if 'sub' in step: w8(BLOCK + 0x1a3, step['sub'])
    fn = int(step['fn'], 16)
    args = [OWNER] + step.get('args', [])
    E.call(fn, tuple(args))
    assert E.fault is None, (step, E.fault)
    return [b for b in CREATED]

def run(c):
    owner_setup(c)
    set_joints(c['joints'])
    FLOOR_Y[0] = c.get('floorY', 0.0)
    shells = []
    for step in c['steps']:
        for raw in call_action(c, step):
            sid = struct.unpack_from('<I', raw, 4)[0]
            shells.append({'frame': step.get('frame'), 'id': sid, 'mode': struct.unpack_from('<I', raw, 8)[0],
                           'run': None, 'raw': raw.hex()})
    # the action state the spawners left (the pitch, the counter, the kept offset)
    st = {'pitch': struct.unpack_from('<H', bytes(uc.mem_read(CTL + 6, 2)))[0], 'shot': r8(BLOCK + 0x1a2),
          'off': [rf(BLOCK + 0x30 + 4 * k) for k in range(3)]}
    for sh in shells:
        sh['run'] = fly_tree(ID_KIND[sh['id']], bytes.fromhex(sh['raw']), c.get('frames', 400))
    return {'shells': shells, 'state': st}

if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    out = {}
    for c in cases:
        out[c['name']] = run(c)
    json.dump(out, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
