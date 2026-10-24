# trgen.py -- one action phase of a class (env FB_CLASS / FB_MON / FB_IDS) under unicorn (the duo tracer's model: the class band native, every call outside
# stubbed), recording every setMotion and every shell create 0x48b884 with its setup (id, mode, +0x10.., +0x20..) and the last
# frame-test literal before it. The allocators 0x3f883c / 0x3fa2bc / 0x41add8 hand out scratch. Scenario: frame (0xb0974 /
# 0xb0968 / 0xb09b0 / 0x72714 answer), ended (0xb09c8), landed (0xbf0bc / 0xbf52c), timer (0x7206c / 0x7264c).
import sys, struct, json, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT
CLS = emclasses.load()
MOT = {0xafce8: 'setMotion', 0xafe84: 'setMotion0', 0xafe8c: 'setMotionC', 0xafef0: 'setMotionL', 0xb032c: 'setMotionB'}
NATIVE = set(range(0x9e8c0, 0x9e8f0)) | set(range(0xb0950, 0xb0968)) | set(range(0x6fe88, 0x6feb8))
E = 0x30000000; P = 0x30100000; C = 0x30180000; ALLOC = 0x30300000
STOP = 0x50000000
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
except Exception: pass
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
cur = {}; sc = {}; rng = [0, 0]; nxt = [ALLOC]
import shellef as _sf
CLASS = os.environ.get('FB_CLASS', 'uEm021_00'); MON = os.environ.get('FB_MON', 'em021_00')
IDS = [int(x, 0) for x in os.environ.get('FB_IDS', '').split(',') if x]
def _tune():
    F = _sf.load(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (MON, MON))
    for nm, (th, b) in F.items():
        if 'action_tune' in nm and b[:4] == b'FUP\x00':
            ver, ni, nf, nv = struct.unpack_from('<4I', b, 4)
            return list(struct.unpack_from('<%di' % ni, b, 20)), list(struct.unpack_from('<%df' % nf, b, 20 + 4 * ni))
TUNE_I, TUNE_F = _tune() or ([], [])
VAR = [0]
def f32r(r): return struct.unpack('<f', struct.pack('<I', mu.reg_read(r) & 0xffffffff))[0]
def ret(uc, v):
    uc.reg_write(UC_ARM_REG_R0, v & 0xffffffff); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
def rdf(a, n): return list(struct.unpack('<%df' % n, bytes(mu.mem_read(a, 4 * n))))
WATCH = set(int(x, 0) for x in os.environ.get('FB_WATCH', '').split(',') if x)
def hook(uc, addr, size, ud):
    if addr in WATCH: cur.setdefault('ev', []).append(['watch', hex(addr), uc.reg_read(UC_ARM_REG_R1), hex(uc.reg_read(UC_ARM_REG_LR))])
    if rng[0] <= addr < rng[1] or addr in NATIVE or addr == STOP: return
    lr = uc.reg_read(UC_ARM_REG_LR)
    if addr in MOT:
        m = uc.reg_read(UC_ARM_REG_R1)
        cur.setdefault('ev', []).append(['mot', 'L%d M%d' % ((m >> 8) & 0xf, m & 0xff), round(f32r(UC_ARM_REG_S0), 3), round(f32r(UC_ARM_REG_S1), 3), hex(lr)])
        uc.mem_write(E + 0x4b4, struct.pack('<H', m & 0xffff)); ret(uc, 0); return
    if addr in (0x3f883c, 0x3fa2bc, 0x41add8):
        a = nxt[0]; nxt[0] += 0x100; uc.mem_write(a, b'\0' * 0x100); ret(uc, a); return
    if addr == 0x48b884:
        s = uc.reg_read(UC_ARM_REG_R1)
        sid, mode = struct.unpack('<II', bytes(uc.mem_read(s + 4, 8)))
        cur.setdefault('raw', []).append(bytes(uc.mem_read(s, 0x40)).hex())
        cur.setdefault('ev', []).append(['create', hex(sid), mode, [round(x, 3) for x in rdf(s + 0x10, 3)],
                                         list(struct.unpack('<3I', bytes(uc.mem_read(s + 0x20, 12)))), hex(lr), cur.get('lastF')])
        ret(uc, 0); return
    if addr in (0xb0974, 0x72714):
        cur['lastF'] = round(f32r(UC_ARM_REG_S0), 3)
        cur.setdefault('ev', []).append(['ftest', cur['lastF'], hex(lr)])
        if 'only' in sc: ret(uc, 1 if abs(cur['lastF'] - sc['only']) < 1e-3 else 0); return
        ret(uc, sc.get('frame', 0)); return
    if addr in (0xb0968, 0xb09b0, 0xb09a4):
        cur['lastF'] = [uc.reg_read(UC_ARM_REG_R1), round(f32r(UC_ARM_REG_S0), 3), round(f32r(UC_ARM_REG_S1), 3)]
        cur.setdefault('ev', []).append(['ftest2', hex(addr), cur['lastF'], hex(lr)])
        if 'only' in sc: ret(uc, 1 if abs(cur['lastF'][1] - sc['only']) < 1e-3 else 0); return
        ret(uc, sc.get('frame2', 0)); return
    if addr == 0xb09c8: ret(uc, sc.get('ended', 0)); return
    if addr in (0xbf0bc, 0xbf52c): ret(uc, sc.get('landed', 0)); return
    if addr in (0x7206c, 0x7264c): ret(uc, sc.get('timer', 0)); return
    if addr == 0x816d4: ret(uc, sc.get('charged', 0)); return
    if addr == 0x81670: ret(uc, sc.get('rage', 0)); return
    if addr == 0x183664:
        sp = uc.reg_read(UC_ARM_REG_SP); pf = struct.unpack('<I', bytes(uc.mem_read(sp, 4)))[0]
        if pf: uc.mem_write(pf, b'')
        uc.reg_write(UC_ARM_REG_S0, 0)
        cur.setdefault('ev', []).append(['ray', hex(lr)]); ret(uc, 1); return
    if addr == 0x6f618:
        k = uc.reg_read(UC_ARM_REG_R1); v = TUNE_F[k] if k < len(TUNE_F) else 0.0
        uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', v))[0])
        cur.setdefault('ev', []).append(['tune', k, v]); ret(uc, 0); return
    if addr == 0x6f62c:
        k = uc.reg_read(UC_ARM_REG_R1); ret(uc, TUNE_I[k] if k < len(TUNE_I) else 0); return
    if addr in (0x768c8, 0x75230, 0x76098):
        cur.setdefault('ev', []).append(['chg', uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), hex(lr)])
    ret(uc, sc.get('stub', {}).get(addr, 0))
def onbad(uc, typ, addr, size, value, ud):
    try: uc.mem_map(addr & ~0xfff, 0x2000); return True
    except Exception: return False
mu.hook_add(UC_HOOK_CODE, hook)
mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED | UC_HOOK_MEM_FETCH_UNMAPPED, onbad)
def run(status, n, phase=0, variant=0, sub=0, b5f8=0, s2=0, **kw):
    global sc
    sc = kw
    c = CLS[CLASS]; rng[0], rng[1] = c['lo'], c['hi'] + 0x400; VAR[0] = variant
    mu.mem_write(E, b'\0' * 0x400000); nxt[0] = ALLOC
    mu.mem_write(E, struct.pack('<I', c['vtable'])); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C)); mu.mem_write(E + 0xc, struct.pack('<I', 1))
    mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('FB_EM', CLASS[3:6])), variant])); mu.mem_write(E + 0x73e0, bytes([status, n]))
    mu.mem_write(E + 0xb5f8, bytes([b5f8]))
    mu.mem_write(P + 0x1a1, bytes([phase, s2, sub]))
    # FB_PHASEAT (2026-10-19): a class whose actions keep their phase in the UNIT, not P+0x1a1 (Amatsu's e+0x15e1 / +0x15e2 / +0x15e3)
    if os.environ.get('FB_PHASEAT'): mu.mem_write(E + int(os.environ['FB_PHASEAT'], 0), bytes([phase, s2, sub]))
    mu.mem_write(P + 0x5df3, bytes([kw.get('charged', 0)]))
    if kw.get('ctl'): mu.mem_write(C, bytes(kw['ctl']))
    for a, b in (kw.get('poke') or {}).items(): mu.mem_write(a, bytes(b))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
    cur.clear()
    try:
        mu.emu_start(c['main'], STOP, count=400000)
        if mu.reg_read(UC_ARM_REG_PC) != STOP: cur['end'] = 'budget %#x' % mu.reg_read(UC_ARM_REG_PC)
    except Exception as ex:
        cur['end'] = 'err %s at %#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    return dict(cur)
