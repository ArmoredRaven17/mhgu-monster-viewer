# t3emu.py -- the type-3 pair test 0x167f70(a = the attack's type-3 shape, b = the hunter capsule, out) run native on unicorn:
# struct = p0 xyzw +0, p1 xyzw +0x10, r +0x20. Returns (meets, out point) for probe placements -- the solid's ends (cap or flat)
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT; STOP = 0x50000000; A = 0x30000000; B = 0x30000100; O = 0x30000200
def mk():
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
    except Exception: pass
    mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
    ro = armdis.RO_VA & ~0xfff
    mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
    da = armdis.DA_VA & ~0xfff
    mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
    mu.mem_map(0x30000000, 0x10000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    return mu
def cap(p0, p1, r): return struct.pack('<4f4f4f', *p0, 0, *p1, 0, r, 0, 0, 0)
def run(a, b, fn=0x167f70):
    mu = mk()
    mu.mem_write(A, cap(*a)); mu.mem_write(B, cap(*b)); mu.mem_write(O, b'\xee' * 16)
    def onbad(uc, typ, addr, size, value, ud):
        try: uc.mem_map(addr & ~0xfff, 0x1000); return True
        except Exception: return False
    mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED, onbad)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_R0, A); mu.reg_write(UC_ARM_REG_R1, B); mu.reg_write(UC_ARM_REG_R2, O)
    mu.reg_write(UC_ARM_REG_LR, STOP)
    mu.emu_start(fn, STOP, count=2000000)
    return mu.reg_read(UC_ARM_REG_R0), [round(v, 3) for v in struct.unpack('<3f', bytes(mu.mem_read(O, 12)))]
if __name__ == '__main__':
    seg = ((0, 0, 0), (0, 100, 0), 50.0)
    hb = lambda x, y, z=0, r=10.0: ((x, y, z - 20), (x, y, z + 20), r)     # a short hunter capsule along Z at (x, y)
    print('side, y 50:'); [print('  x', x, run(seg, hb(x, 50))) for x in (40, 55, 59, 60, 61, 70)]
    print('above, x 0:'); [print('  y', y, run(seg, hb(0, y))) for y in (105, 109, 110, 111, 120, 150, 160, 161)]
    print('below, x 0:'); [print('  y', y, run(seg, hb(0, y))) for y in (-5, -10, -11, -50, -60)]
    print('corner:'); [print('  ', p, run(seg, hb(*p))) for p in ((45, 130), (45, 108), (58, 105), (30, 140), (55, 100))]
    print('control: the capsule test 0x1676f0 at the corner (45,130):', run(seg, hb(45, 130), 0x1676f0))
