"""uEm057_00 vt+0x204 = 0xeecd58, the action-START hook, called (e, status, number) -- the new action is in r1 / r2 (0xeecd68 /
0xeecd6c), NOT read from e+0x73e0 (the first version of this script left r1 / r2 0 and saw no switch at all).
Models: ctl = [e+0xcac0] with the gauge ctl+0 (s16); P+0x5df3 charged, P+0x518 rage, P+0x505 tired, e+0xcb14; the rank chain of
0x3a8430 (5 unless given). Every call outside the module block is stubbed 0 except the natives below. Records: the charge
routines entered, every vt+0x1d0 request id (0xf02f4c r1), every 0x329c40 stop, and the writes to ctl+0 / P+0x5df3 / e+0xcb14.
   python hook204.py            -- the table of entries
"""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT
C_ = emclasses.load()['uEm057_00']
E = 0x30000000; P = 0x30100000; C = 0x30180000; STOP = 0x50000000; QO = 0x30190000; QR = 0x30191000
NATIVE = set(range(0x816d4, 0x816e8)) | set(range(0x81670, 0x81688)) | set(range(0x81614, 0x81634)) | \
         set(range(0x3a8430, 0x3a8480)) | set(range(0x9e8c0, 0x9e8f0)) | set(range(0x6fe88, 0x6feb8))
WATCH = {0xeecb28: 'DISCHARGE', 0xeec02c: 'CHARGE_ON', 0xeecc2c: 'eecc2c', 0xeeca2c: 'eeca2c'}
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
except Exception: pass
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
mu.mem_map(E, 0x200000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
ev = []
STUBV = {}


def ret(uc, v):
    uc.reg_write(UC_ARM_REG_R0, v); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))


def hook(uc, addr, size, ud):
    if addr in WATCH: ev.append(WATCH[addr])
    if addr == 0xf02f4c: ev.append('REQ id %d' % uc.reg_read(UC_ARM_REG_R1))
    if C_['lo'] <= addr < C_['hi'] or addr in NATIVE or addr == STOP: return
    if addr == 0x329c40: ev.append('stop')
    ret(uc, STUBV.get(addr, 0))


def wr(uc, access, addr, size, value, ud):
    for a, nm, sz in ((C, 'gauge', 2), (P + 0x5df3, 'P+0x5df3', 1), (E + 0xcb14, 'e+0xcb14', 1)):
        if addr == a: ev.append('%s=%d' % (nm, struct.unpack('<h', struct.pack('<H', value & 0xffff))[0] if sz == 2 else value & 0xff))


def onbad(uc, typ, addr, size, value, ud):
    try: uc.mem_map(addr & ~0xfff, 0x2000); return True
    except Exception: return False


mu.hook_add(UC_HOOK_CODE, hook)
mu.hook_add(UC_HOOK_MEM_WRITE, wr, begin=E, end=E + 0x200000)
mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED | UC_HOOK_MEM_FETCH_UNMAPPED, onbad)


def at(var, st, n, charged=0, gauge=50, rage=0, tired=0, rank=5, part=0, entry=0xeecd58, prev=(0, 0), extra=None):
    del ev[:]
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', C_['vtable'])); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C)); mu.mem_write(E + 0xb5f4, bytes([57, var]))
    mu.mem_write(E + 0x73e0, bytes([st, n])); mu.mem_write(E + 0x73e2, bytes(prev))
    mu.mem_write(P + 0x5df3, bytes([charged])); mu.mem_write(P + 0x518, bytes([rage])); mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.mem_write(P + 0x5ccb, bytes([(part << 3) & 0xff]))
    mu.mem_write(C, struct.pack('<h', gauge))
    mu.mem_write(0x1883c70, struct.pack('<I', QO)); mu.mem_write(QO + 0xa4, struct.pack('<I', QR)); mu.mem_write(QR + 0xf, struct.pack('<b', rank))
    for a, b in (extra or ()): mu.mem_write(a, b)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, st); mu.reg_write(UC_ARM_REG_R2, n)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
    try: mu.emu_start(entry, STOP, count=400000)
    except Exception as ex: ev.append('ERR %s at %#x' % (ex, mu.reg_read(UC_ARM_REG_PC)))
    g = struct.unpack('<h', mu.mem_read(C, 2))[0]
    return list(ev), g, mu.mem_read(P + 0x5df3, 1)[0]


if __name__ == '__main__':
    cases = [((1, 4), 0, 30), ((1, 5), 1, 60), ((1, 5), 0, 60), ((11, 0), 1, 60), ((11, 0), 0, 60), ((11, 7), 1, 60),
             ((1, 3), 0, 10), ((1, 3), 0, 70), ((1, 9), 0, 10), ((1, 0x2d), 0, 10), ((2, 0x26), 0, 90), ((2, 0x28), 0, 90),
             ((7, 0xe9), 1, 60), ((7, 0xe9), 1, 1), ((7, 0xe3), 1, 60), ((7, 0xdb), 1, 60), ((7, 0x71), 0, 10),
             ((1, 0x1c), 1, 60), ((10, 0x72), 1, 60), ((10, 0x72), 1, 20), ((0, 0), 1, 0), ((0, 0), 0, 30), ((0, 0), 0, 60),
             ((0, 0), 0, 80)]
    for v in (0, 4):
        for (a, ch, g) in cases:
            for rage in (0, 1):
                e_, gg, c = at(v, a[0], a[1], ch, g, rage)
                print('v%d %-10s ch%d g%3d rg%d -> gauge %3d charged %d  %s' % (v, a, ch, g, rage, gg, c, ' '.join(e_)))
