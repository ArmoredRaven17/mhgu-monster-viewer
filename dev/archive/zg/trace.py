"""uEm057_00 action tracer: run the action main (vt+0x1f4) for (status, number) at a given phase P+0x1a1 under unicorn and
record EVERY motion set (not just the first), with e+0xb5f8 / e+0x73e0 / e+0x73e1 / the charged byte at that moment, and every
change-family call. The class module block runs; every call outside it is stubbed (r0 = scenario value, back to lr), except
0x6fe88 (the action test) and 0x816d4 (charged = P+0x5df3), which run natively. A follow (0x768c8) is then re-run the same
update, as the ROM does (rom-map 0xa5af4..0xa5b14: +0x73ea = 1 re-runs the main) -- WITHOUT clearing e+0xb5f8, which only the
+0x28 pass 0x6f4e8 (0x6f584) zeroes.
   python trace.py <variant> <status> <number> [phase] [ended] [frame] [charged]"""
import sys, struct, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT
C_ = emclasses.load()['uEm057_00']
MOT = {0xafce8: 'setMotion', 0xafe84: 'setMotion0', 0xafe8c: 'setMotionC', 0xafef0: 'setMotionL', 0xb032c: 'setMotionB'}
CHG = {0x768c8: 'follow', 0x7699c: 'hold', 0x76a40: 'req', 0x75230: 'set', 0x76088: 'default', 0x76094: 'default2',
       0x76098: 'changeAction'}
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
cur = {}; sc = {}
WATCH = {0xeecb28: 'discharge', 0xefb04c: 'discharge@efb04c', 0xefb814: 'discharge@efb814', 0x48b884: 'shell'}


def f32r(r):
    return struct.unpack('<f', struct.pack('<I', mu.reg_read(r) & 0xffffffff))[0]


def ret(uc, v):
    uc.reg_write(UC_ARM_REG_R0, v); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))


def hook(uc, addr, size, ud):
    prev = cur.get('pc', 0); cur['pc'] = addr
    if addr in WATCH:
        cur.setdefault('ev', []).append('HIT %#x (%s) motion=%#x' % (addr, WATCH[addr], struct.unpack('<H', uc.mem_read(E + 0x4b4, 2))[0]))
    if C_['lo'] <= addr < C_['hi'] or addr in NATIVE or addr == STOP:
        return
    if addr in MOT:
        m = uc.reg_read(UC_ARM_REG_R1)
        st = bytes(uc.mem_read(E + 0x73e0, 2)); b = uc.mem_read(E + 0xb5f8, 1)[0]
        cur.setdefault('ev', []).append('MOT L%d M%d (%#05x) start %g b5f8=%d act=(%d,%#x) @%#x' % (
            (m >> 8) & 0xf, m & 0xff, m, f32r(UC_ARM_REG_S1), b, st[0], st[1], prev))
        uc.mem_write(E + 0x4b4, struct.pack('<H', m & 0xffff))
        ret(uc, 0); return
    if addr == 0x6c178:                                          # vt+0x3d0 = b 0x768c8 (the follow)
        addr = 0x768c8
    if addr in CHG:
        r1, r2 = uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)
        cur.setdefault('ev', []).append('CHG %s (%d, %#x) @%#x' % (CHG[addr], r1, r2, prev))
        if addr == 0x768c8 and 'follow' not in cur: cur['follow'] = (r1, r2)
        ret(uc, 0); return
    if addr in (0xb09c8, 0x7206c):
        ret(uc, sc.get('ended', 0)); return
    if addr in (0x72714, 0xb0974, 0xb0968, 0xb09a4):
        ret(uc, sc.get('frame', 0)); return
    if addr == 0x3a8430:
        ret(uc, 5); return
    ret(uc, 0)


def onbad(uc, typ, addr, size, value, ud):
    try:
        uc.mem_map(addr & ~0xfff, 0x2000); return True
    except Exception:
        return False


mu.hook_add(UC_HOOK_CODE, hook)
mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED | UC_HOOK_MEM_FETCH_UNMAPPED, onbad)


def run(var, st, n, phase=0, ended=0, frame=0, charged=0, follows=2):
    global sc
    sc = dict(ended=ended, frame=frame)
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', C_['vtable'])); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C)); mu.mem_write(E + 0xb5f4, bytes([57, var]))
    mu.mem_write(E + 0x73e0, bytes([st, n])); mu.mem_write(P + 0x1a1, bytes([phase]))
    mu.mem_write(P + 0x5df3, bytes([charged]))
    mu.mem_write(E + 0x7420, bytes([sc.get('e7420', 1)]))      # the same-update follow (0x768c8 -> 0x76098); 0 parks it
    out = []
    for k in range(follows + 1):
        cur.clear()
        mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
        try:
            mu.emu_start(C_['main'], STOP, count=300000)
        except Exception as ex:
            cur.setdefault('ev', []).append('ERR %s at %#x' % (ex, mu.reg_read(UC_ARM_REG_PC)))
        out += [('  ' * k) + e for e in cur.get('ev', [])]
        f = cur.get('follow')
        if not f: break
        mu.mem_write(E + 0x73e0, bytes([f[0], f[1]])); mu.mem_write(P + 0x1a1, b'\0')   # the follow: phase 0, same update
        sc = dict(ended=0, frame=0)
    return out


if __name__ == '__main__':
    a = [int(x, 0) for x in sys.argv[1:]]
    for e in run(*a):
        print(e)
