# zphase.py: Zamtrios's action main (vtable +0x1f4 = 0xf75e20) under unicorn for (status, n) at EVERY phase P+0x1a1 = 0..9,
# with every out-of-class call stubbed to return R (0 and 1 both run), so the arms gated on "the motion ended" / "frame
# reached" are taken too. Records EVERY setMotion / script / changeAction the run reaches (not just the first): the
# motion ids an action can play. Based on efx/agents/zamtrios-scratch/zactprobe.py (same harness, same class range).
import sys, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
import unicorn
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
T = armdis.TEXT
LO, HI = 0xf65ba4, 0xf78400
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try: mu.ctl_set_cpu_model(unicorn.arm_const.UC_CPU_ARM_MAX)
except Exception: pass
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
E = 0x30000000; P = 0x30100000; C = 0x30180000
mu.mem_map(E, 0x200000); mu.mem_map(0x40000000, 0x10000)
STOP = 0x50000000; mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
MOT = {0xafce8: 'setMotion', 0xafe84: 'setMotion0', 0xafe8c: 'setMotionC', 0xafef0: 'setMotionL'}
CHG = {0x768c8, 0x7699c, 0x76a40, 0x75230, 0x76088, 0x76094, 0x76098}
RUN = set(range(0x9e8c0, 0x9e8f0))
cur = {}
RET = [0]
def hook(uc, addr, size, ud):
    if LO <= addr < HI or addr in RUN or addr == STOP: return
    if addr in MOT:
        m = uc.reg_read(UC_ARM_REG_R1) & 0xffff
        cur.setdefault('mot', []).append('L%d M%d' % (m >> 8, m & 0xff))
    elif addr == 0xa1290:
        cur.setdefault('mot', []).append('script %#x' % uc.reg_read(UC_ARM_REG_R1))
    elif addr in CHG:
        cur.setdefault('mot', []).append('-> (%d, %#x)' % (uc.reg_read(UC_ARM_REG_R1) & 0xff, uc.reg_read(UC_ARM_REG_R2) & 0xff))
    elif addr in (0xca050, 0xca05c):
        cur['unh'] = True; uc.emu_stop(); return
    elif addr == 0x75168:
        cur.setdefault('mot', []).append('idle chooser')
    uc.reg_write(UC_ARM_REG_R0, RET[0])
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hook)
def probe(status, n, form, phase, ret):
    RET[0] = ret
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', 0x17dd730))
    mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', C))
    mu.mem_write(E + 0x73e0, bytes([status, n])); mu.mem_write(E + 0xb5f4, bytes([0x43, 0]))
    mu.mem_write(P + 0x1ba, bytes([0, form])); mu.mem_write(P + 0x1a1, bytes([phase]))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
    cur.clear()
    try: mu.emu_start(0xf75e20, STOP, count=40000)
    except Exception as ex: cur.setdefault('mot', []).append('err@%#x' % mu.reg_read(UC_ARM_REG_PC))
    return cur
res = {}
for st in [int(x, 0) for x in sys.argv[1].split(',')]:
    for n in range(0x100):
        acc = []
        unh = False
        for form in (0, 1, 2):
            for ph in range(10):
                for r in (0, 1):
                    c = probe(st, n, form, ph, r)
                    if c.get('unh') and ph == 0 and r == 0 and form == 0: unh = True
                    for m in c.get('mot', []):
                        if (form, m) not in acc: acc.append((form, m))
        if unh: continue
        byform = {f: [m for (ff, m) in acc if ff == f] for f in (0, 1, 2)}
        res['%d,%#x' % (st, n)] = byform
        same = byform[0] == byform[1] == byform[2]
        print('(%d, %#04x): %s' % (st, n, ' | '.join(byform[0]) if same else ' ;; '.join('f%d: %s' % (f, ' | '.join(byform[f])) for f in (0, 1, 2))))
json.dump(res, open('zphase_%s.json' % sys.argv[1].replace(',', '_'), 'w'), indent=0)
