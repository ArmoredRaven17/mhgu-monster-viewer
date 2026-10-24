# actprobe.py <status> [posture] [variant] [em] [numbers lo-hi]: run uEm001_00's action main (vtable +0x1f4 = 0xd2dfb0)
# under unicorn for action (status, n), phase 0 (P+0x1a1 = 0), with a zeroed enemy whose vtable is 0x1797c8c.
# Code inside the class range 0xcecd20..0xd0d928 runs; every call/jump OUTSIDE it is stubbed (r0 = 0, return to lr),
# except the part / direction getters 0x9e8c0 / 0x9e8d8 which run. The run stops at the first setMotion
# (0xafce8 r1 = id, r2 = flags; 0xafe84 / 0xafe8c / 0xafef0: r1 = id; s0 = blend, s1 = start), 0xa1290 (script),
# changeAction family (0x768c8 / 0x7699c / 0x76a40 / 0x75230 / 0x76088 / 0x76094: r1, r2 = next action),
# the 'default' 0xca050 / 0xca05c (r1 = name string), or vtable +0x3dc (stubbed call noted).
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *

T = armdis.TEXT
LO, HI = 0xe72738, 0xe83434
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff)
mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff)
mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff)
mu.mem_write(armdis.DA_VA, armdis.DATA)
E = 0x30000000; P = 0x30100000; C = 0x30180000
mu.mem_map(E, 0x200000)
mu.mem_map(0x40000000, 0x10000)
STOP = 0x50000000
mu.mem_map(STOP, 0x1000)
# enable VFP
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)

MOT = {0xafce8: 'setMotion', 0xafe84: 'setMotion0', 0xafe8c: 'setMotionC', 0xafef0: 'setMotionL'}
CHG = {0x768c8: 'follow(0x768c8)', 0x7699c: 'hold(0x7699c)', 0x76a40: 'req(0x76a40)', 0x75230: 'set(0x75230)',
       0x76088: 'default(0x76088)', 0x76094: 'default(0x76094)', 0x76098: 'changeAction'}
RUN = set(range(0x9e8c0, 0x9e8f0))
cur = {}


def f32(r):
    return struct.unpack('<f', struct.pack('<I', mu.reg_read(r) & 0xffffffff))[0]


def hook(uc, addr, size, ud):
    if LO <= addr < HI or addr in RUN or addr == STOP:
        return
    if addr in MOT:
        m = uc.reg_read(UC_ARM_REG_R1)
        cur['hit'] = '%s L%d M%d (%#05x) blend %g start %g flags %#x' % (MOT[addr], (m >> 8) & 0xf, m & 0xff, m,
                     f32(UC_ARM_REG_S0), f32(UC_ARM_REG_S1), uc.reg_read(UC_ARM_REG_R2) if addr == 0xafce8 else 0)
        uc.emu_stop(); return
    if addr == 0xa1290:
        cur['hit'] = 'script %#x mode %d' % (uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2))
        uc.emu_stop(); return
    if addr in CHG:
        cur['hit'] = '%s -> (%d, %#x)' % (CHG[addr], uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2))
        uc.emu_stop(); return
    if addr in (0xca050, 0xca05c):
        cur['hit'] = 'unhandled (%s)' % armdis.cstr(uc.reg_read(UC_ARM_REG_R1))
        uc.emu_stop(); return
    if addr == 0x75168:
        cur['hit'] = 'vt+0x3dc idle chooser'
        uc.emu_stop(); return
    # stub: return 0
    cur.setdefault('stubs', []).append(addr)
    uc.reg_write(UC_ARM_REG_R0, 0)
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))


mu.hook_add(UC_HOOK_CODE, hook)


def probe(status, n, posture=0, variant=0, em=43, part=0, extra=None):
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', 0x17bfd1c))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C))
    mu.mem_write(E + 0x73e0, bytes([status, n]))
    mu.mem_write(E + 0xb5f4, bytes([em, variant]))
    mu.mem_write(P + 0x1ba, bytes([posture]))
    mu.mem_write(P + 0x5ccb, bytes([part << 3]))
    if extra:
        for a, b in extra:
            mu.mem_write(a, b)
    mu.reg_write(UC_ARM_REG_R0, E)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000)
    mu.reg_write(UC_ARM_REG_LR, STOP)
    cur.clear()
    try:
        mu.emu_start(0xe7e9d4, STOP, count=20000)
    except Exception as ex:
        cur['hit'] = 'err %s at %#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    return cur.get('hit', 'return (no motion) stubs %s' % ' '.join('%#x' % s for s in cur.get('stubs', [])[:6]))


if __name__ == '__main__':
    st = int(sys.argv[1], 0)
    posture = int(sys.argv[2], 0) if len(sys.argv) > 2 else 0
    variant = int(sys.argv[3], 0) if len(sys.argv) > 3 else 0
    em = int(sys.argv[4], 0) if len(sys.argv) > 4 else 43
    lo, hi = 0, 0x100
    if len(sys.argv) > 5:
        lo, hi = [int(x, 0) for x in sys.argv[5].split('-')]
    for n in range(lo, hi):
        r = probe(st, n, posture, variant, em)
        if 'unhandled' in r:
            continue
        print('(%d, %#x): %s' % (st, n, r))
