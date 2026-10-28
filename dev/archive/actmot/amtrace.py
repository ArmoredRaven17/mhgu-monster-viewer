"""actmot/amtrace.py (action-motion census lane, 2026-10-27): THE ACTION MAIN UNDER UNICORN, every motion it plays.

The machine is zg/tracec.py's (the whole main.text / rodata / data mapped; an enemy block E with the class's own vtable at +0,
P = [E+0x1428], the control block [E+0xcac0]; e+0xb5f4 / +0xb5f5 = em / variant, e+0xb5f0 = variant << 8 | em -- uEm004_00 and the
hyper dispatchers read the u16), with what a full census needs added:
  * every setMotion of the family (rom-map row "the setMotion family"): 0xafce8 / 0xafe84 / 0xafe8c / 0xafef0 / 0xb0230 / 0xb00b4 /
    0xb0174 / 0xb03f8 / 0xb04d0 -- r1 the motion, s0 the blend, s1 the start frame, r2 the flags (0xb00b4 / 0xb0174: r3; their r2 is
    the PARTNER layer's motion, set through vt+0x3d8 -- logged as W); 0xb032c / 0xb0004 set the partner layer only (W);
  * the rate 0xb07b4(e, s0) (P+0x398, held to the motion's end -- rom-map `0xb07b4`) -> R;
  * the posture: 0xbc7f4(e, r1) -> r1; 0xbc984 / 0xbca24 -> 1 (rom-map `P+0x1ba`);
  * the angle-picked TURNS (trap 94: their motions are data): 0x7a258 / 0x7a284 / 0x7a2b0 (start, mode 0 / 1 / 2) and 0x7a27c /
    0x7a2a8 / 0x7a2d4 (continue), 0x794f0 / 0x79a00 direct, 0x772b4 direct: the record is the table itself (mode 0) or the table's
    words [0..mode] (0x796e4..0x7976c); 0x772b4 plays +0x10 when the record's +0xe threshold is non-zero (0x772bc..0x772d8 ->
    0x77370 setMotion +0x10 / +0x14 blend / +0x18 start / +0x1c flags), else and past it the sides +0x20 / +0x30 (same layout +4..+0xc);
    P+0x336 & 0x100 plays a side through 0xb00b4 with +0x10 as the partner. Each motion of each record is logged (via turn);
  * the status SCRIPTS: 0xa1290(e, script, mode) -- the script's op 0 / 2 records (zg/scrdump.py's reading), posture by mode
    (`0xa1430..0xa145c`: 1 -> 0xbca24 = posture 1, else 0xbc7f4(e, mode)) -> via script;
  * the change family (tracec's CHG): follow 0x768c8 (vt+0x3d0 = 0x6c178 -> 0x768c8), hold, req, set, default -> C (the chain);
    a follow is NOT re-run here: the followed action is censused on its own;
  * every other call out of the class code returns at once with r0 = RET and s0 = RET x 999.0 (trap 92: s0 never left over) and is
    LOGGED by target; frame tests (0x72714 / 0xb0974 / 0xb0968 / 0xb09a4 / 0xb09b0 / 0xb098c) and ended tests (0xb09c8 / 0x7206c) answer
    `frame` / `ended`; the rage / tired tests and vt+0x370 (0xa3bf4: the breaks, trap in rom-map tooling `cloak204.py`) answer RET too.
  Class code = the class's module band (emclasses) -- a call from it into [0xcec000, 0x13ecb90) outside the band is ALSO run
  natively when OUTBAND=1 (default 1: the class's own transitive calls, e.g. the GU additions above 0x111d600), and logged.
   import: CLS / EM env as tracec; run(var, st, n, phase, sub, ended, frame, RET) -> (events, stubs, newphase)"""
import sys, struct, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT
CLN = os.environ.get('CLS', 'uEm001_00')
C_ = emclasses.load()[CLN]
EMN = int(os.environ.get('EM', '1'))
OUTBAND = os.environ.get('OUTBAND', '1') == '1'
CODE_LO, CODE_HI = 0xcec000, 0x13ecb90          # class modules .. the PLT (0x13ecb90: the first `add ip, pc` stub)
MAINSET = {0xafce8: 'setMotion', 0xafe84: 'setMotion0', 0xafe8c: 'setMotionC', 0xafef0: 'setMotionL', 0xb0230: 'setMotionI',
           0xb03f8: 'setMotionY', 0xb04d0: 'setMotionZ'}
PAIRSET = {0xb00b4: 'setMotionW', 0xb0174: 'setMotionX'}          # r1 main (flags r3), r2 the partner layer
PARTNER = {0xb032c: 'setPartnerB', 0xb0004: 'setPartnerA'}
TURN = {0x7a258: ('start', 0), 0x7a284: ('start', 1), 0x7a2b0: ('start', 2), 0x7a27c: ('cont', 0), 0x7a2a8: ('cont', 1),
        0x7a2d4: ('cont', 2), 0x794f0: ('start', None), 0x79a00: ('cont', None), 0x772b4: ('rec', None)}
CHG = {0x768c8: 'follow', 0x7699c: 'hold', 0x76a40: 'req', 0x75230: 'set', 0x76088: 'default', 0x76094: 'default2',
       0x76098: 'changeAction'}
FRAME = {0x72714, 0xb0974, 0xb0968, 0xb09a4, 0xb09b0, 0xb098c}
ENDED = {0xb09c8, 0x7206c}
RAGE = {0x81670, 0x81688, 0x816b8, 0x81614, 0xa3bf4}
NATIVE = set(range(0x6fe88, 0x6feb8)) | set(range(0x816d4, 0x816e8)) | set(range(0x9e8c0, 0x9e8f0)) | set(range(0xb0950, 0xb0968))
E = 0x30000000; P = 0x30100000; C = 0x30180000; STOP = 0x50000000
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
mu.mem_map(E, 0x200000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
S = {}


def f32r(r):
    return struct.unpack('<f', struct.pack('<I', mu.reg_read(r) & 0xffffffff))[0]


def rd(a, n):
    try:
        return bytes(mu.mem_read(a, n))
    except Exception:
        return None


def u16(a):
    b = rd(a, 2); return struct.unpack('<H', b)[0] if b else None


def u32(a):
    b = rd(a, 4); return struct.unpack('<I', b)[0] if b else None


def f32(a):
    b = rd(a, 4); return round(struct.unpack('<f', b)[0], 3) if b else None


def ret(uc, v, s0=None):
    uc.reg_write(UC_ARM_REG_R0, v)
    uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', float(v) * 999.0 if s0 is None else s0))[0])
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))


def turn_records(tab, mode):
    if mode is None or mode == 0:
        return [tab]
    out = []
    for k in range(mode + 1):
        w = u32(tab + 4 * k)
        if w: out.append(w)
    return out


def turn_motions(rec):
    """0x772b4's reading of one record: (motion, blend, start, flags, which) for each motion it can play"""
    out = []
    thr = u16(rec + 0xe)
    if thr:
        out.append((u16(rec + 0x10), f32(rec + 0x14), f32(rec + 0x18), u32(rec + 0x1c), 'straight'))
    for o, nm in ((0x20, 'sideA'), (0x30, 'sideB')):
        m = u16(rec + o)
        if m is not None and m != 0xffff:
            out.append((m, f32(rec + o + 4), f32(rec + o + 8), u32(rec + o + 0xc), nm))
    return out


def script_motions(a):
    out = []
    for i in range(48):
        b = rd(a + 8 * i, 8)
        if not b: break
        op, arg = struct.unpack('<II', b)
        if op in (0xff, 0xfe): break
        if op in (0, 2) and armdis.DA_VA <= arg < armdis.DA_VA + len(armdis.DATA):
            out.append((u32(arg) & 0xffff, u32(arg + 0x10), op))
    return out


# above every module band but SHARED (called from 13 / 2 classes' bands in the first full run; leaves on a hunter-side object
# [x+0x3328] / [x+0x3ac4]): stubbed like any shared call. Single-class targets (Ahtal-Neset's 0x12178a4 / 0x1217ba0 / 0x12182bc,
# the GU additions beside uEm001_00's hyper hooks 0x1216100..) stay native.
SHARED_OUT = {0x11255e0, 0x111f420}


def incode(addr):
    if C_['lo'] <= addr < C_['hi']: return True
    return OUTBAND and CODE_LO <= addr < CODE_HI and addr not in SHARED_OUT


def hook(uc, addr, size, ud):
    if addr == STOP or addr in NATIVE:
        return
    if incode(addr):
        if not (C_['lo'] <= addr < C_['hi']) and S.get('lastout') != addr:
            # entered native code outside the module band: log the entry (a call target, or a fallthrough)
            pc_prev = S.get('pc', 0)
            if C_['lo'] <= pc_prev < C_['hi']: S['outband'].add(addr)
        S['pc'] = addr
        return
    ev = S['ev']; lr = uc.reg_read(UC_ARM_REG_LR); site = (lr - 4) & 0xffffffff
    if addr in MAINSET or addr in PAIRSET:
        m = uc.reg_read(UC_ARM_REG_R1) & 0xffff
        fl = uc.reg_read(UC_ARM_REG_R3 if addr in PAIRSET else UC_ARM_REG_R2)
        ev.append(['M', m, round(f32r(UC_ARM_REG_S0), 3), round(f32r(UC_ARM_REG_S1), 3), fl, MAINSET.get(addr) or PAIRSET[addr], site])
        if addr in PAIRSET:
            ev.append(['W', uc.reg_read(UC_ARM_REG_R2) & 0xffff, site])
        uc.mem_write(E + 0x4b4, struct.pack('<H', m))
        ret(uc, 0, 0.0); return
    if addr in PARTNER:
        ev.append(['W', uc.reg_read(UC_ARM_REG_R1) & 0xffff, site]); ret(uc, 0, 0.0); return
    if addr == 0xb07b4:
        ev.append(['R', round(f32r(UC_ARM_REG_S0), 4), site]); ret(uc, 0, 1.0); return
    if addr == 0xbc7f4:
        ev.append(['P', uc.reg_read(UC_ARM_REG_R1), site]); ret(uc, 0, 0.0); return
    if addr in (0xbc984, 0xbca24):
        ev.append(['P', 1, site]); ret(uc, 0, 0.0); return
    if addr in TURN:
        kind, mode = TURN[addr]
        r1 = uc.reg_read(UC_ARM_REG_R1)
        if mode is None and kind != 'rec':
            mode = uc.reg_read(UC_ARM_REG_R2) if kind == 'cont' else (u32(uc.reg_read(UC_ARM_REG_SP) + 4) or 0)
        recs = [r1] if kind == 'rec' else turn_records(r1, mode)
        ev.append(['T', r1, mode, kind, site])
        for rec in recs:
            for (m, bl, st, fl, which) in turn_motions(rec):
                ev.append(['M', m, bl, st, fl, 'turn:%s:%#x' % (which, rec), site])
        ret(uc, 0); return
    if addr == 0xa1290:
        a, mode = uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)
        ev.append(['S', a, mode, site])
        ev.append(['P', 1 if mode == 1 else mode, site])
        for (m, fl, op) in script_motions(a):
            ev.append(['M', m, None, None, fl, 'script:%#x:op%d' % (a, op), site])
        ret(uc, 0); return
    if addr == 0x6c178:
        addr = 0x768c8
    if addr in CHG:
        ev.append(['C', CHG[addr], uc.reg_read(UC_ARM_REG_R1) & 0xff, uc.reg_read(UC_ARM_REG_R2) & 0xff, site])
        ret(uc, 0); return
    if addr in FRAME:
        ret(uc, S['frame']); return
    if addr in ENDED:
        ret(uc, S['ended']); return
    S['stubs'].add(addr)
    ret(uc, S['RET'])


def onbad(uc, typ, addr, size, value, ud):
    try:
        uc.mem_map(addr & ~0xfff, 0x2000); return True
    except Exception:
        return False


mu.hook_add(UC_HOOK_CODE, hook)
mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED | UC_HOOK_MEM_FETCH_UNMAPPED, onbad)
ZE = b'\0' * 0x200000


def run(var, st, n, phase=0, sub=0, ended=0, frame=0, RET=0, count=300000):
    S.clear(); S.update(ev=[], stubs=set(), outband=set(), frame=frame, ended=ended, RET=RET)
    mu.mem_write(E, ZE)
    mu.mem_write(E, struct.pack('<I', C_['vtable'])); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C))
    mu.mem_write(E + 0xb5f0, struct.pack('<H', (var << 8) | EMN)); mu.mem_write(E + 0xb5f4, bytes([EMN, var]))
    mu.mem_write(E + 0x73e0, bytes([st, n])); mu.mem_write(P + 0x1a1, bytes([phase, sub]))
    mu.mem_write(E + 0x7420, b'\x01')
    for r in (UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_R4, UC_ARM_REG_R5, UC_ARM_REG_R6, UC_ARM_REG_R7,
              UC_ARM_REG_R8, UC_ARM_REG_R9, UC_ARM_REG_R10, UC_ARM_REG_R11, UC_ARM_REG_R12):
        mu.reg_write(r, 0)
    for k in range(32):
        mu.reg_write(UC_ARM_REG_S0 + k, 0)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
    err = None
    try:
        mu.emu_start(C_['main'], STOP, count=count)
    except Exception as ex:
        err = '%s at %#x' % (str(ex)[:40], mu.reg_read(UC_ARM_REG_PC))
    if mu.reg_read(UC_ARM_REG_PC) != STOP and not err:
        err = 'budget at %#x' % mu.reg_read(UC_ARM_REG_PC)
    newph = mu.mem_read(P + 0x1a1, 1)[0]
    return S['ev'], S['stubs'], S['outband'], newph, err


WORD = struct.unpack_from('<I', armdis.DATA, C_['vtable'] + 0x13c - armdis.DA_VA)[0]


def word(var, st, n, motion, RET=0):
    """the PSL enable word: vt+0x13c(e) with e+0x4b4 = motion and the action (st, n) set (zg/ctlflip2.py run_word's frame);
    returns e+0x13f4 or None (a fault / the budget)"""
    S.clear(); S.update(ev=[], stubs=set(), outband=set(), frame=0, ended=0, RET=RET)
    mu.mem_write(E, ZE)
    mu.mem_write(E, struct.pack('<I', C_['vtable'])); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C))
    mu.mem_write(E + 0xb5f0, struct.pack('<H', (var << 8) | EMN)); mu.mem_write(E + 0xb5f4, bytes([EMN, var]))
    mu.mem_write(E + 0x73e0, bytes([st, n])); mu.mem_write(E + 0x7420, b'\x01')
    mu.mem_write(E + 0x4b4, struct.pack('<H', motion))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
    try:
        mu.emu_start(WORD, STOP, count=100000)
    except Exception:
        return None
    if mu.reg_read(UC_ARM_REG_PC) != STOP: return None
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


if __name__ == '__main__':
    a = [int(x, 0) for x in sys.argv[1:]]
    ev, stubs, ob, nph, err = run(*a)
    for e in ev: print(e)
    print('stubs', sorted(hex(x) for x in stubs)); print('outband', sorted(hex(x) for x in ob)); print('next', nph, 'err', err)
