"""Silverwind Nargacuga (em037_04) shells on the ROM -- the whole executable after its static initialisers, as the Narga
spike harness (efx/agents/narga-shell-scratch/nharness.py) runs it, with the em037_04.arc files:
  shell00 0xca uShellEm037_sp_00 : base00  (ctor 0xe59014, init 0xe594d4, move 0x3f96a0; landing 0xe59334, end create 0xe595ac)
  shell01 0xcb uShellEm037_sp_01 : base01  (ctor 0xe597c4, init 0x3fa498, move 0x3faec4)
  shell45 0xcc uShellEm037_sp_45 : base45  (ctor 0xe599ec, init 0x422dc0, move 0x4236c0)
  shell46 0xcd uShellEm037_sp_46 : base46  (ctor 0xe59db0, init 0x42480c, move 0x425188; landing 0xe59f84)
The setups are the class's own spawners run on the ROM: 0xe48fc8 (the spikes), 0xe49a78 (shell00 8 / 13 / 14), 0xe49b24 /
0xe49bc8 (shell45); a shell46 / shell01 setup is the one the ROM's own end create / landing hands 0x48b884.
HOOKED (everything else is the ROM's own code): the rShell getters 0x4a22f0 / 0x4a23f4 / 0x4a2470 / 0x4a24f8 / 0x4a2584 ->
the em037_04.arc files' values; 0x43a850 -> 1; 0xc2df8 -> 0 (no hunter unit); 0x3f9aec and 0x4a1ad8 -> no hit registration
(not visual); 0x43ab74 -> the scale words; the setup allocators 0x3f883c / 0x3fa2bc / 0x422bac / 0x4243f0 -> scratch;
0x48b884 (create) -> the setup logged; 0x183490 (the stage query) -> the plane stand-in at floorY; 0x43b2b0 (the ground
marker) -> logged, not run; the effect requester / start / stop 0x4a10c8 / 0x4a11e4 / 0x329c40 -> logged.
Usage: python emu37.py cases.json out.json"""
import sys, struct, json, os
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
SHELL, SETUP, OWNER, BLOCK, OWNVT, EPS, HANDLES, VECS, SETUPS, JOINTS, MAP, RES, WORDS, ARR = (
    S, S + 0x2000, S + 0x10000, S + 0x20000, S + 0x30000, S + 0x40000, S + 0x50000, S + 0x60000,
    S + 0x70000, S + 0x90000, S + 0x98000, S + 0x9c000, S + 0x9e000, S + 0x9f000)
FLOOR_Y = [0.0]
LOG = []
next_handle = [HANDLES]
next_setup = [SETUPS]
FOLDER = ['00']

def ret(val=None):
    if val is not None: uc.reg_write(UC_ARM_REG_R0, val & 0xffffffff)
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))

def hook(addr, fn):
    uc.hook_add(UC_HOOK_CODE, lambda u, a, s, d: fn(), begin=addr, end=addr)

def set_s0(x): uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', x))[0])

# ---- the em037_04.arc shell files -------------------------------------------------------------------------------------
FILES = shellef.load(r'C:\MHGU-Extract\scratch-em\em037_04\em037_04.arc')
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
SH = {}
for folder, n in (('00', 15), ('01', 2), ('45', 13), ('46', 2)):
    for m in range(n):
        sh = fup('em037_04_%s_sh%03d' % (folder, m))
        if sh is None: continue
        SH[(folder, m)] = {'sh': sh, 'hit': fup('em037_04_%s_hit%03d' % (folder, m)), 'ef': efp('em037_04_%s_ef%03d' % (folder, m))}

def mode_of(r2):
    v = s32v(r2)
    if v >= 0: return v
    st = r32(SHELL + 0x136c)
    return r32(st + 8) & 0xff if st else 0xff

def g_ef():
    i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
    e = SH.get((FOLDER[0], m))
    if not e or not e['ef'] or i >= len(e['ef']): return ret(0)
    a = EPS + 0x100 * m + 8 * i
    lid, uid = e['ef'][i]
    w32(a, lid); w32(a + 4, uid)
    ret(a)
def g_int(kind):
    def h():
        i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
        e = SH.get((FOLDER[0], m))
        if not e: return ret(0xffffffff)
        L = e[kind]['ints']
        ret(L[i] if i < len(L) else 0)
    return h
def g_float():
    i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
    e = SH.get((FOLDER[0], m))
    L = e['sh']['floats'] if e else []
    set_s0(L[i] if i < len(L) else 0.0)
    ret()
def g_vec():
    i, m = uc.reg_read(UC_ARM_REG_R1), mode_of(uc.reg_read(UC_ARM_REG_R2))
    e = SH.get((FOLDER[0], m))
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
hook(0xc2df8, lambda: ret(0))
hook(0x3f9aec, lambda: ret())
hook(0x4a1ad8, lambda: ret(0))
def ab74():
    sh = uc.reg_read(UC_ARM_REG_R0)
    s0 = struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0)))[0]
    for k in range(3): wf(sh + 0x60 + 4 * k, s0)
    w32(sh + 0x6c, 0)
    ret()
hook(0x43ab74, ab74)
def alloc():
    a = next_setup[0]; next_setup[0] += 0x80
    uc.mem_write(a, b'\0' * 0x80)
    ret(a)
for a in (0x3f883c, 0x3fa2bc, 0x422bac, 0x4243f0): hook(a, alloc)
CREATED = []
def create():
    st = uc.reg_read(UC_ARM_REG_R1)
    CREATED.append(bytes(uc.mem_read(st, 0x40)))
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
def marker():
    p = uc.reg_read(UC_ARM_REG_R2)
    LOG.append(['marker', uc.reg_read(UC_ARM_REG_R1), [rf(p + 4 * i) for i in range(3)], uc.reg_read(UC_ARM_REG_R3)])
    ret()
hook(0x43b2b0, marker)

# ---- owner, joint -----------------------------------------------------------------------------------------------------
def owner_setup(c):
    uc.mem_write(OWNER, b'\0' * 0xd000)
    uc.mem_write(BLOCK, b'\0' * 0x600)
    w32(OWNER, OWNVT); w32(OWNER + 0xc, 1); w32(OWNER + 0x1428, BLOCK)
    for i in range(0x100): w32(OWNVT + 4 * i, 0x3fa078)
    w32(OWNVT + 0x88, 0x6bbb0)
    oX, oY, oZ = c['owner']
    w32(BLOCK + 0x50, oX); w32(BLOCK + 0x54, oY); w32(BLOCK + 0x58, oZ)
    for k in range(3):
        wf(BLOCK + 0x1d0 + 4 * k, c['target'][k])
        wf(BLOCK + 0x40 + 4 * k, c['ownerPos'][k]); wf(OWNER + 0x40 + 4 * k, c['ownerPos'][k])
    w32(OWNER + 0xfe8, oX & 0xffff); w32(OWNER + 0xfec, oY & 0xffff); w32(OWNER + 0xff0, oZ & 0xffff)
    w32(OWNER + 0xcc94, 0xca); w32(OWNER + 0xcc98, 0xcb)
    w8(OWNER + 0xb5f5, 4)

def set_joint(gid, m):
    uc.mem_write(MAP, b'\xff' * 256); w8(MAP + gid, 0); w8(MAP + 0, 1)
    for k in range(16): wf(JOINTS + 0x10 + 4 * k, m[k])
    for k in range(16): wf(JOINTS + 0xa0 + 0x10 + 4 * k, m[k])
    w32(OWNER + 0x494, JOINTS); w32(OWNER + 0x498, MAP)

def setups_of(fn, args):
    CREATED.clear(); next_setup[0] = SETUPS; LOG.clear()
    E.call(fn, args)
    assert E.fault is None, E.fault
    return [b for b in CREATED]

def snap(timer_off):
    return dict(state=r8(SHELL + 4), pos=[rf(SHELL + 0x40 + 4 * k) for k in range(3)],
                vel=[rf(SHELL + 0x1010 + 4 * k) for k in range(3)], acc=[rf(SHELL + 0x1020 + 4 * k) for k in range(3)],
                anchor=[rf(SHELL + 0x1000 + 4 * k) for k in range(3)],
                ang=[r32(SHELL + 0xfe8), r32(SHELL + 0xfec), r32(SHELL + 0xff0)],
                timer=rf(SHELL + timer_off), scale=rf(SHELL + 0x60))

KINDS = {  # folder, ctor, init, move, timer offset
    '00': (0xe59014, 0xe594d4, 0x3f96a0, 0x162c),
    '01': (0xe597c4, 0x3fa498, 0x3faec4, 0x1614),
    '45': (0xe599ec, 0x422dc0, 0x4236c0, 0x1628),
    '46': (0xe59db0, 0x42480c, 0x425188, 0x1610),
}

def fly(folder, raw, frames, kill=None):
    FOLDER[0] = folder
    ctor, init, move, toff = KINDS[folder]
    LOG.clear(); CREATED.clear(); next_handle[0] = HANDLES
    uc.mem_write(SHELL, b'\0' * 0x1800)
    E.call(ctor, (SHELL,)); assert E.fault is None, E.fault
    wf(SHELL + 0x1c, 1.0)
    w32(SHELL + 0x136c, SETUP); w32(SHELL + 0x1384, RES); w8(RES + 0x50, 1)
    uc.mem_write(SETUP, b'\0' * 0x40); uc.mem_write(SETUP, raw[:0x40]); w32(SETUP + 0xc, OWNER)
    w8(SHELL + 4, 0)
    # base45 / base46 keep their effect handles in an array the init allocates through the engine heap (0x7a75a0 ->
    # vtable +0x1c), which the harness has no allocator for: the array is given (zeroed, the allocation's own memclr), with
    # the count the init would leave -- its `count == 5` (base45, 0x422eb4) / `== 4` (base46, 0x424904) path then skips it
    if folder == '45': uc.mem_write(ARR, bytes(0x40)); w32(SHELL + 0x162c, ARR); w32(SHELL + 0x1630, 5)
    if folder == '46': uc.mem_write(ARR, bytes(0x40)); w32(SHELL + 0x1614, ARR); w32(SHELL + 0x1618, 4)
    r = E.call(init, (SHELL, SETUP)); assert E.fault is None, E.fault
    out = {'init': r, 'spawn': snap(toff), 'log': list(LOG), 'created': [c.hex() for c in CREATED], 'frames': []}
    LOG.clear(); CREATED.clear()
    if not r: return out
    for k in range(1, frames + 1):
        if kill and k >= kill:   # the effects die (the ending's handle test)
            for a in range(HANDLES, next_handle[0], 0x100): w32(a + 0xc, 0)
        E.call(move, (SHELL,)); assert E.fault is None, (k, E.fault)
        s = snap(toff); s['k'] = k; s['log'] = list(LOG); s['created'] = [c.hex() for c in CREATED]
        LOG.clear(); CREATED.clear()
        out['frames'].append(s)
        if s['state'] == 0xff or r32(SHELL + 0xc) & 7 == 3: break
    return out

def run(c):
    owner_setup(c)
    set_joint(143, c['joint'])
    FLOOR_Y[0] = c.get('floorY', 0.0)
    sp = c['spawn']
    if sp['fn'] == 'e48fc8': raws = setups_of(0xe48fc8, (OWNER, sp['xIdx'], sp['kind']))
    elif sp['fn'] == 'e49a78': raws = setups_of(0xe49a78, (OWNER, sp['mode']))
    elif sp['fn'] in ('e49b24', 'e49bc8'):
        for k in range(3): w32(WORDS + 4 * k, sp['words'][k])
        raws = setups_of(0xe49b24, (OWNER, sp['mode'], WORDS)) if sp['fn'] == 'e49b24' else \
               setups_of(0xe49bc8, (OWNER, sp['mode'], sp.get('h', 0), WORDS))
    elif sp['fn'] == 'raw': raws = [bytes.fromhex(sp['raw'])]
    else: raise ValueError(sp['fn'])
    folder = c['folder']
    res = []
    for raw in raws:
        o = fly_tree(folder, raw, c.get('frames', 600), c.get('kill'), c.get('childFrames', 600))
        res.append(o)
    return res

# a run and the runs of the shells its moves create (0xcd -> shell46, 0xcb -> shell01), each from the setup the ROM built
CHILD = {0xcd: '46', 0xcb: '01'}
def fly_tree(folder, raw, frames, kill, child_frames, depth=0):
    o = fly(folder, raw, frames, kill)
    o['setup'] = raw.hex()
    o['children'] = []
    if depth >= 2: return o
    for fr in o['frames']:
        for cr in fr['created']:
            b = bytes.fromhex(cr)
            cid = struct.unpack_from('<I', b, 4)[0]
            if cid in CHILD:
                o['children'].append({'at': fr['k'], 'id': cid, 'run': fly_tree(CHILD[cid], b, child_frames, None, child_frames, depth + 1)})
    return o

if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    out = {}
    for c in cases:
        out[c['name']] = run(c)
    json.dump(out, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
