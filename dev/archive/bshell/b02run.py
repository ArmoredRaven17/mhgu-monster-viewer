# Basarios's fire beam on the ROM: the action (7, 0x0e) -> 0xd28bb4(1, 0) run frame by frame until it hands the manager
# its shell02 request (0x48b884, hooked by bharness: the setup is logged), then uShellEm005_sp_02 run on that request:
# ctor (newInstance 0x49a6c4: base02 ctor 0x3fb7f8, vtable 0x17991d4, +0x168c = 0), init = vtable +0x13c (0xd30b84),
# move = vtable +0x24 (0x3fbdc8), frame by frame. Logs every effect start and every placement call on the handle.
#   python b02run.py [frames] [pitch-target]
import sys, struct, math
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import bharness as H
from unicorn.arm_const import *
L = H.LOG

# ---- spawner-side hooks (kspawn.py's) ----------------------------------------------------------------------------------
H.hook(0xbc7f4, lambda: H.ret())
H.hook(0x7ded8, lambda: (L.append(('hit', H.uc.reg_read(UC_ARM_REG_R1), H.uc.reg_read(UC_ARM_REG_R2))), H.ret()))
H.hook(0x7db70, lambda: (L.append(('hit1', H.uc.reg_read(UC_ARM_REG_R1), H.uc.reg_read(UC_ARM_REG_R2))), H.ret()))
H.hook(0xac030, lambda: H.ret(0))
H.hook(0x6fe88, lambda: H.ret(0))
RANK = [5]
H.hook(0x3a8430, lambda: H.ret(RANK[0]))
H.hook(0xc241c, lambda: (L.append(('quake', H.s32v(H.uc.reg_read(UC_ARM_REG_R1)))), H.ret()))
def alloc():
    a = H.next_setup[0]; H.next_setup[0] += 0x80
    H.uc.mem_write(a, bytes(0x80)); H.ret(a)
for fn in (0x3fb7bc,):                    # base02's setup allocation (0xd29558)
    H.hook(fn, alloc)
PEND = []
def setmotion(tag, has_start):
    def h():
        mid = H.uc.reg_read(UC_ARM_REG_R1)
        start = struct.unpack('<f', struct.pack('<I', H.uc.reg_read(UC_ARM_REG_S1)))[0] if has_start else 0.0
        PEND.append((mid, start)); L.append(('setMotion' + tag, mid, start)); H.ret()
    return h
H.hook(0xafce8, setmotion('', True)); H.hook(0xafe84, setmotion('0', True))
H.hook(0xafe8c, setmotion('F', True)); H.hook(0xafef0, setmotion('V', True))

# ---- THE COMMON PARAMS (ShellCmnParam), which kharness answered with the null path: Basarios HAS them -- the FUP that
# shares its .shl's path (shellef.cmn; dev/rom-map.md traps). getters 0x4a2224 int / 0x4a2264 float / 0x4a22a8 vec, r1 = i
import shellef
_ARC = r'C:\MHGU-Extract\scratch-em\em004_00\em004_00.arc'
CMN = {n: shellef.cmn(_ARC, chr(92).join(['shell', 'em', 'em004_00_shell' + n, 'em004_00_' + n])) for n in ('00', '01', '02')}
def c_int():
    c = CMN.get(H.FOLDER[0]); i = H.uc.reg_read(UC_ARM_REG_R1)
    H.ret(c['ints'][i] if c and i < len(c['ints']) else 0xffffffff)
def c_float():
    c = CMN.get(H.FOLDER[0]); i = H.uc.reg_read(UC_ARM_REG_R1)
    H.set_s0(c['floats'][i] if c and i < len(c['floats']) else 0.0); H.ret()
def c_vec():
    c = CMN.get(H.FOLDER[0]); i = H.uc.reg_read(UC_ARM_REG_R1)
    if not c or i >= len(c['vecs']): return H.ret(0x19176b0)
    a = H.VECS + 0x800 + 16 * i
    for k in range(3): H.wf(a + 4 * k, c['vecs'][i][k])
    H.ret(a)
H.hook(0x4a2224, c_int); H.hook(0x4a2264, c_float); H.hook(0x4a22a8, c_vec)

# ---- the _snd getter (0x4a2378), which Khezu's harness never needed ----------------------------------------------------
def g_snd():
    i, m = H.uc.reg_read(UC_ARM_REG_R1), H.mode_of(H.uc.reg_read(UC_ARM_REG_R2))
    e = H.SH.get((H.FOLDER[0], m))
    if not e or not e.get('snd'): return H.ret(0xffffffff)
    Ls = e['snd']['ints']
    H.ret(Ls[i] if i < len(Ls) else 0)
H.hook(0x4a2378, g_snd)

# ---- the effect placement pair on a handle (logged, not run: the handles are stand-ins) --------------------------------
def v3(p): return [H.rf(p + 4 * k) for k in range(3)]
H.hook(0x329c9c, lambda: (L.append(('place.pos', H.uc.reg_read(UC_ARM_REG_R0), v3(H.uc.reg_read(UC_ARM_REG_R1)), H.uc.reg_read(UC_ARM_REG_R2))), H.ret()))
H.hook(0x329d04, lambda: (L.append(('place.rot', H.uc.reg_read(UC_ARM_REG_R0), v3(H.uc.reg_read(UC_ARM_REG_R1)), H.uc.reg_read(UC_ARM_REG_R2))), H.ret()))
def fill():   # 0x4a10c8(shell, req, parent, 0, [sp] byte, [sp+4] &pos, [sp+8] -1)
    sp = H.uc.reg_read(UC_ARM_REG_SP)
    p = H.r32(sp + 4)
    L.append(('request', v3(p) if p else None, 'parent', H.uc.reg_read(UC_ARM_REG_R2), 'req', H.uc.reg_read(UC_ARM_REG_R1)))
    H.ret()
H.hook(0x4a10c8, fill)

# the +0x16c link's callees (0x3fd01c: the only reader of the _snd fields +0x164c / +0x1650) -- stubbed and LOGGED, so a
# call on the visual path would show up here rather than be silently answered
for fn in (0x4eeed0, 0x4ef25c, 0x807984, 0x275dc0):
    H.hook(fn, (lambda fn: lambda: (L.append(('snd-call', hex(fn), H.uc.reg_read(UC_ARM_REG_R1), H.uc.reg_read(UC_ARM_REG_R2))), H.ret(0)))(fn))

def frame(prev, step=1.0, mid=0, end=100000.0):
    for a in (0x500, 0x13ac): H.wf(H.OWNER + a, prev)
    for a in (0x13b8, 0x13b4): H.wf(H.OWNER + a, step)
    H.wf(H.OWNER + 0x4f4, 0.0); H.w8(H.OWNER + 0x13c0, 0)
    H.wf(H.OWNER + 0x13bc, end); H.wf(H.OWNER + 0x508, 0.0)
    H.wf(H.OWNER + 0x1c, step); H.wf(H.OWNER + 0x50c, 1.0)
    H.w16(H.OWNER + 0x4b4, mid)

def mat(yaw=0.0, pos=(0.0, 0.0, 0.0)):
    c, s = math.cos(yaw), math.sin(yaw)
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, pos[0], pos[1], pos[2], 1]

def owner(pos=(0.0, 0.0, 0.0), yaw=0.0, T=(0.0, 0.0, 2100.0), head=(0.0, 400.0, 500.0)):
    H.owner_setup(T=T, em=4)
    # the enemy's OWN position and rotation (the spawner reads [e+0x40..0x48] and the quaternion [e+0x50..0x5c])
    for k in range(3): H.wf(H.OWNER + 0x40 + 4 * k, pos[k])
    q = (0.0, math.sin(yaw / 2), 0.0, math.cos(yaw / 2))
    for k in range(4): H.wf(H.OWNER + 0x50 + 4 * k, q[k])
    # the ids 0xd2e538 gives em 4: 0x6a / 0x6b / 0x6c in +0xcac4 / +0xcac8 / +0xcacc, +0xcad0 unset (0x19d)
    for i, gid in enumerate((0x6a, 0x6b, 0x6c, 0x19d)): H.w32(H.OWNER + 0xcac4 + 4 * i, gid)
    H.set_joints({0: mat(yaw, pos), 3: mat(yaw, (pos[0] + head[0], pos[1] + head[1], pos[2] + head[2]))})

def run_action(fn, args, number, frames=260, status=7, **kw):
    owner(**kw)
    H.w8(H.OWNER + 0x73e0, status); H.w8(H.OWNER + 0x73e1, number & 0xff); H.w16(H.OWNER + 0x73e8, number)
    H.w8(H.BLOCK + 0x1a1, 0); H.w8(H.BLOCK + 0x1a2, 0)
    out = []; mid, f = 0, 0.0
    for k in range(frames):
        PEND.clear(); H.CREATED.clear(); L.clear(); H.next_setup[0] = H.SETUPS
        frame(f, mid=mid)
        H.E.call(fn, tuple([H.OWNER] + list(args)))
        assert H.E.fault is None, (hex(fn), k, H.E.fault)
        made = [(H.parse_setup(c), c) for c in H.CREATED]
        ev = [e for e in L if e[0] != 'create']
        if made or ev: out.append({'k': k, 'motion': mid, 'frame': f + 1.0, 'made': made, 'log': list(ev), 'phase': H.r8(H.BLOCK + 0x1a1)})
        if PEND: mid, f = PEND[-1][0], PEND[-1][1] - 1.0
        f += 1.0
    return out

VT02 = 0x17991d4
def run_shell02(setup_raw, frames=120):
    H.FOLDER[0] = '02'
    L.clear(); H.CREATED.clear(); H.next_handle[0] = H.HANDLES
    H.uc.mem_write(H.SHELL, b'\0' * 0x1800)
    H.E.call(0x3fb7f8, (H.SHELL,)); assert H.E.fault is None, H.E.fault
    H.w32(H.SHELL, VT02); H.wf(H.SHELL + 0x168c, 0.0)
    H.wf(H.SHELL + 0x1c, 1.0)
    H.w32(H.SHELL + 0x136c, H.SETUP); H.w32(H.SHELL + 0x1384, H.RES); H.w8(H.RES + 0x50, 1)
    H.uc.mem_write(H.SETUP, b'\0' * 0x40); H.uc.mem_write(H.SETUP, setup_raw); H.w32(H.SETUP + 0xc, H.OWNER)
    H.w8(H.SHELL + 4, 0)
    init = H.r32(VT02 + 0x13c); move = H.r32(VT02 + 0x24)
    r = H.E.call(init, (H.SHELL, H.SETUP)); assert H.E.fault is None, H.E.fault
    out = {'init': r, 'log_init': list(L), 'frames': []}
    L.clear()
    for k in range(1, frames + 1):
        H.E.call(move, (H.SHELL,)); assert H.E.fault is None, (k, H.E.fault)
        out['frames'].append({'k': k, 'state': H.r8(H.SHELL + 4), 'pos': v3(H.SHELL + 0x40), 'log': list(L),
                              'f1610': v3(H.SHELL + 0x1610), 'f15e0': v3(H.SHELL + 0x15e0), 'h1604': H.r32(H.SHELL + 0x1604),
                              'h1600': H.r32(H.SHELL + 0x1600)})
        L.clear()
        if H.r8(H.SHELL + 4) == 0xff or (H.r32(H.SHELL + 0xc) & 7) == 3: break
    return out

if __name__ == '__main__':
    frames = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    out = run_action(0xd28bb4, (1, 0), 0x0e, frames=200, pos=(0.0, 0.0, 0.0), yaw=0.0)
    for e in out:
        if e['made'] or any(x[0].startswith('setMotion') for x in e['log']):
            print('k%-3d M%#x f%.0f phase %d made %s raw %s log %s' % (e['k'], e['motion'], e['frame'], e['phase'],
                  [(hex(s['id']), s['mode'], [round(v, 2) for v in s['pos']], hex(s['w20'][0] & 0xffff), hex(s['w1c'])) for s, _ in e['made']], [raw[:0x30].hex() for _, raw in e['made']],
                  [x for x in e['log'] if x[0] != 'create'][:6]))
    sets = [raw for e in out for s, raw in e['made'] if s['id'] == 0x6c]
    if not sets: raise SystemExit('no shell02 request')
    r = run_shell02(sets[0], frames=frames)
    print('init ->', r['init'], r['log_init'])
    for fr in r['frames'][:frames]:
        print('k%-3d state %#x pos %s f1610 %s h1604 %#x %s' % (fr['k'], fr['state'], [round(v, 2) for v in fr['pos']],
              [round(v, 3) for v in fr['f1610']], fr['h1604'], fr['log']))
