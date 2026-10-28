# p4trace.py (effects lane A4, 2026-10-26): every (status, number) of an enemy class, EVERY PHASE (P+0x1a1 = 0..11), run under
# unicorn -- the action main with the class's own band native and everything else stubbed (the method of
# efx/agents/notice-scratch/probe.py, which stops at the first setMotion; this one does not).  Logged, in order:
#   POST p   0xbc7f4(e, p)        (also the effect: P+0x1ba = p)
#   P1 / BCA 0xbc984 / 0xbca24    (P+0x1ba = 1; 0xbca24 also P+0x5c = 0 -- row "0xbca24" in rom-map)
#   SET v    0xbf700(e, s0)       (P+0x5c = s0, P+0x1b9 = 1); v = 'MOG' when s0 is the MoguriBaseOfs sentinel
#   ADD v    0xbf71c(e, s0)       (P+0x5c += s0 x dt)
#   W5C pc v a direct store to P+0x5c from class code (memory hook; pc and the value)
#   W1BA     a direct store to P+0x1ba from class code
#   M Lx My  any setMotion (0xafce8 / 0xafe84 / 0xafe8c / 0xafef0) or turn-table play (0x772b4: logged TURN)
#   S a m    script start 0xa1290(e, script, mode)  -- mode is the posture the script sets (0xa1430..0xa145c: 1 -> 0xbca24)
#   VT3E8    0x75330 (shared vt+0x3e8: posture 4 then action (0, 7))
#   SH4 a    the shared posture-4 layer 0x8fc28 / 0x90e5c / 0x91ed4 entered
#   PH k     a store to P+0x1a1 (the next phase)
#   CHG ...  changeAction / follow / hold / req / set (ends the run)
# 0xbf62c answers the sentinel MOG = -4321.0 in s0; 0x712a0 answers a block whose +0x10 is MOG, and [e+0x75e8] points at it.
# Pass A: every stub returns 0.  Pass B: the motion-end and frame-window tests (0xb09c8, 0xb0934, 0xb0968, 0xb0974, 0xb09a4,
# 0xb09b0) return 1 -- the transition arms of a phase.  0xb0944 (current motion) answers the last motion set.
#   usage: p4trace.py <class> <em> <variant> [statuses]   -> stdout, one line per (status, n, phase, pass) that logged anything
import sys, struct, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from unicorn import (Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE, UC_HOOK_MEM_READ_UNMAPPED, UC_HOOK_MEM_WRITE,
                     UC_HOOK_MEM_READ, UC_HOOK_MEM_WRITE_UNMAPPED, UC_HOOK_MEM_FETCH_UNMAPPED)
from unicorn.arm_const import *

T = armdis.TEXT
CLS = emclasses.load()
MOG = -4321.0
MOT = {0xafce8: 'setMotion', 0xafe84: 'setMotion0', 0xafe8c: 'setMotionC', 0xafef0: 'setMotionL'}
CHG = {0x768c8: 'follow', 0x7699c: 'hold', 0x76a40: 'req', 0x75230: 'set',
       0x76088: 'default', 0x76094: 'default2', 0x76098: 'changeAction'}
ENDT = (0xb09c8, 0xb0934, 0xb0968, 0xb0974, 0xb09a4, 0xb09b0, 0x7206c)
SH4 = (0x8fc28, 0x90e5c, 0x91ed4)
RUN = set(range(0x9e8c0, 0x9e8f0))
E = 0x30000000; P = 0x30100000; C = 0x30180000; D = 0x30190000
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
mu.mem_map(E, 0x200000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)

cur = {}
EXTRA = {}   # addr -> fn(uc, addr): overrides for other drivers (p4entry.py)
rng = [0, 0]
st = {'passB': False, 'lastmot': 0}


def f32r(r):
    return struct.unpack('<f', struct.pack('<I', mu.reg_read(r) & 0xffffffff))[0]


def setf(r, v):
    mu.reg_write(r, struct.unpack('<I', struct.pack('<f', v))[0])


def fmt(v):
    return 'MOG' if abs(v - MOG) < 0.01 else ('%g' % v)


def ev(s):
    cur['ev'].append(s)


def ret(uc, r0=0):
    uc.reg_write(UC_ARM_REG_R0, r0)
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))


def hook(uc, addr, size, ud):
    if rng[0] <= addr < rng[1] or addr in RUN or addr == STOP:
        return
    r1 = uc.reg_read(UC_ARM_REG_R1)
    if addr in EXTRA:
        return EXTRA[addr](uc, addr)
    if addr in MOT:
        m = r1 & 0xffff
        st['lastmot'] = m
        ev('M L%dM%d@%x' % ((m >> 8) & 0xf, m & 0xff, uc.reg_read(UC_ARM_REG_LR) - 4)); ret(uc); return
    if addr in (0x772b4, 0x7a258):
        # turn table {+0x10 straight; +0x20 / +0x30 sides} (u16 motion ids; layout checked on Deviljho 0x169e428)
        def mm(o):
            b = armdis.rd(r1 + o, 2)
            m = int.from_bytes(b, 'little') if len(b) == 2 else 0
            return 'L%dM%d' % ((m >> 8) & 0xf, m & 0xff)
        ev('TURN %#x {%s; %s / %s}@%x' % (r1, mm(0x10), mm(0x20), mm(0x30), uc.reg_read(UC_ARM_REG_LR) - 4)); ret(uc); return
    if addr == 0xa1290:
        ev('S %#x m%d' % (r1, uc.reg_read(UC_ARM_REG_R2))); ret(uc); return
    if addr in CHG:
        ev('CHG %s(%d,%#x)' % (CHG[addr], r1 & 0xff, uc.reg_read(UC_ARM_REG_R2) & 0xff)); uc.emu_stop(); return
    if addr in (0xca050, 0xca05c):
        cur['unh'] = True; uc.emu_stop(); return
    if addr == 0x75168:
        ev('IDLE'); uc.emu_stop(); return
    if addr == 0x75330:
        ev('VT3E8@%x' % (uc.reg_read(UC_ARM_REG_LR) - 4)); uc.emu_stop(); return
    if addr in SH4:
        ev('SH4 %#x' % addr); ret(uc); return
    if addr == 0xbc7f4:
        ev('POST %d@%x' % (r1 & 0xff, (uc.reg_read(UC_ARM_REG_LR) - 4) & ~1)); uc.mem_write(P + 0x1ba, bytes([r1 & 0xff])); ret(uc); return
    if addr == 0xbc984:
        ev('P1'); uc.mem_write(P + 0x1ba, b'\x01'); ret(uc); return
    if addr == 0xbca24:
        ev('BCA@%x' % (uc.reg_read(UC_ARM_REG_LR) - 4)); uc.mem_write(P + 0x1ba, b'\x01'); uc.mem_write(P + 0x5c, b'\0' * 4); ret(uc); return
    if addr == 0xbf700:
        v = f32r(UC_ARM_REG_S0); ev('SET %s@%x' % (fmt(v), uc.reg_read(UC_ARM_REG_LR) - 4))
        uc.mem_write(P + 0x5c, struct.pack('<f', v)); uc.mem_write(P + 0x1b9, b'\x01'); ret(uc); return
    if addr == 0xbf71c:
        ev('ADD %s@%x' % (fmt(f32r(UC_ARM_REG_S0)), uc.reg_read(UC_ARM_REG_LR) - 4)); ret(uc); return
    if addr == 0xbf62c:
        setf(UC_ARM_REG_S0, MOG); ret(uc); return
    if addr == 0x712a0:
        ret(uc, D); return
    if addr == 0xb0944:
        ret(uc, st['lastmot']); return
    if addr in ENDT:
        ret(uc, 1 if st['passB'] else 0); return
    ret(uc, 1 if st['passB'] == 'C' else 0)


def memw(uc, access, addr, size, value, ud):
    pc = uc.reg_read(UC_ARM_REG_PC)
    if not (rng[0] <= pc < rng[1]):
        return
    if addr <= P + 0x5c < addr + size:
        v = struct.unpack('<f', struct.pack('<I', value & 0xffffffff))[0] if size == 4 else value
        ev('W5C %#x %s' % (pc, fmt(v)))
    if addr <= P + 0x1ba < addr + size:
        ev('W1BA %#x %d' % (pc, value & 0xff))
    if addr <= P + 0x1a1 < addr + size and size == 1:
        ev('PH %d' % (value & 0xff))


def memr(uc, access, addr, size, value, ud):
    if addr <= P + 0x1a1 < addr + size:
        cur['readph'] = True


def onbad(uc, typ, addr, size, value, ud):
    try:
        uc.mem_map(addr & ~0xfff, 0x2000); return True
    except Exception:
        return False


mu.hook_add(UC_HOOK_CODE, hook)
mu.hook_add(UC_HOOK_MEM_WRITE, memw, begin=P, end=P + 0x200)
mu.hook_add(UC_HOOK_MEM_READ, memr, begin=P + 0x1a0, end=P + 0x1a2)
mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED | UC_HOOK_MEM_FETCH_UNMAPPED, onbad)


def run(cls, status, n, em, var, phase=0, posture=0, p5c=0.0, passB=False):
    c = CLS[cls]
    rng[0], rng[1] = c['lo'], c['hi']
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', c['vtable']))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C))
    mu.mem_write(E + 0x75e8, struct.pack('<I', D - 0x98))
    mu.mem_write(D + 0x10, struct.pack('<f', MOG))
    mu.mem_write(E + 0x73e0, bytes([status, n]))
    mu.mem_write(E + 0xb5f4, bytes([em, var]))
    mu.mem_write(P + 0x1ba, bytes([posture]))
    mu.mem_write(P + 0x1a1, bytes([phase]))
    mu.mem_write(P + 0x5c, struct.pack('<f', p5c))
    mu.reg_write(UC_ARM_REG_R0, E)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000)
    mu.reg_write(UC_ARM_REG_LR, STOP)
    st['passB'] = passB; st['lastmot'] = 0
    cur.clear(); cur['ev'] = []
    try:
        mu.emu_start(c['main'], STOP, count=300000)
        if mu.reg_read(UC_ARM_REG_PC) != STOP and not cur.get('unh') and not (cur['ev'] and cur['ev'][-1].startswith(('CHG', 'IDLE', 'VT3E8'))):
            ev('BUDGET@%#x' % mu.reg_read(UC_ARM_REG_PC))
    except Exception as ex:
        ev('ERR %s @%#x' % (ex, mu.reg_read(UC_ARM_REG_PC)))
    return dict(cur)


INTEREST = ('POST 4', 'SET', 'ADD', 'W5C', 'W1BA', 'BCA', 'VT3E8', 'SH4', ' m4')


def trace(cls, em, var, statuses=range(16), out=sys.stdout, allphase=False):
    for s in statuses:
        for n in range(0x100):
            r0 = run(cls, s, n, em, var)
            if r0.get('unh'):
                continue
            ev0 = r0['ev']
            post = 0
            p5c = 0.0
            for e in ev0:
                if e.startswith('POST '): post = int(e.split()[1].split('@')[0])
                if e == 'P1' or e.startswith('BCA'): post = 1
                if e.startswith('S ') and e.endswith('m4'): post = 4
            rows = [(0, 'A', ev0)]
            if r0.get('readph'):
                for pb in ('B', 'C'):
                    rows.append((0, pb, run(cls, s, n, em, var, passB=pb)['ev']))
                for ph in range(1, 12):
                    for pb in ('A', 'B', 'C'):
                        r = run(cls, s, n, em, var, phase=ph, posture=post, p5c=p5c, passB=False if pb == 'A' else pb)
                        rows.append((ph, pb, r['ev']))
            # phases reachable from 0 through the logged stores to P+0x1a1 (any pass)
            reach = {0}; grow = True
            while grow:
                grow = False
                for ph, pb, evs in rows:
                    if ph in reach:
                        for e in evs:
                            if e.startswith('PH '):
                                k = int(e.split()[1])
                                if k not in reach: reach.add(k); grow = True
            hit = any(any(x in e for x in INTEREST for e in evs) for _, _, evs in rows)
            if not hit and not allphase:
                continue
            seen = set()
            for ph, pb, evs in rows:
                if not evs or (ph, tuple(evs)) in seen: continue
                seen.add((ph, tuple(evs)))
                out.write('%s em%03d v%d (%d, %#x) ph%d%s%s: %s\n' % (cls, em, var, s, n, ph, pb, '' if ph in reach else '?',
                                                                   ' | '.join(evs)))
            out.flush()


if __name__ == '__main__':
    cls, em, var = sys.argv[1], int(sys.argv[2], 0), int(sys.argv[3], 0)
    sts = [int(x, 0) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else range(16)
    trace(cls, em, var, sts)
