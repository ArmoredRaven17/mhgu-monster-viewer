# ROM-run of the two hit-line fillers (base02 0x3fc1c8, base58 0x4340fc) on a fake shell object; prints JSON of the
# table each one leaves, for the JS port's bit check (hitline_check.mjs).  python emu_hitline.py > emu_hitline.json
import struct, json, sys
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
OBJ, TAB, STK, END = 0x30000000, 0x30100000, 0x30200000, 0x30300000

def f32b(x): return struct.pack('<f', x)
def rd_f(uc, a): return struct.unpack('<f', uc.mem_read(a, 4))[0]
def rd_u(uc, a): return struct.unpack('<I', uc.mem_read(a, 4))[0]

def run(fn, fields, count0, delay, n, on=1):
    uc = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    size = (len(T) + 0xfff) & ~0xfff
    uc.mem_map(0, size); uc.mem_write(0, T)
    for b in (OBJ, TAB, STK, END): uc.mem_map(b, 0x10000)
    # VFP on
    uc.reg_write(UC_ARM_REG_C1_C0_2, uc.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
    uc.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    uc.mem_write(OBJ + 0x158a, bytes([on]))
    uc.mem_write(OBJ + 0x1404, f32b(delay))
    uc.mem_write(OBJ + 0x1590, struct.pack('<I', count0))
    uc.mem_write(OBJ + 0x158c, struct.pack('<I', n))
    uc.mem_write(OBJ + 0x1594, struct.pack('<I', TAB))
    uc.mem_write(TAB, b'\xaa' * (32 * max(n, 1)))
    for off, v in fields.items():
        for i in range(3): uc.mem_write(OBJ + off + 4 * i, f32b(v[i]))
    uc.reg_write(UC_ARM_REG_R0, OBJ); uc.reg_write(UC_ARM_REG_SP, STK + 0x8000); uc.reg_write(UC_ARM_REG_LR, END)
    uc.emu_start(fn, END, count=4000)
    ents = []
    for i in range(n):
        a = TAB + 32 * i
        ents.append({'p0': [rd_f(uc, a + 4 * j) for j in range(3)], 'w0': rd_u(uc, a + 0xc),
                     'p1': [rd_f(uc, a + 0x10 + 4 * j) for j in range(3)], 'w1': rd_u(uc, a + 0x1c),
                     'raw': uc.mem_read(a, 32).hex()})
    return {'calls': rd_u(uc, OBJ + 0x1590), 'e': ents}

P, A = [123.25, -40.5, 987.125], [10.0, 300.75, -55.5]
OE, OS = [140.5, -80.25, 1000.0], [9.5, 301.0, -50.25]
out = {'in': {'P': P, 'A': A, 'oldEnd': OE, 'oldStart': OS}, 'cases': {}}
for name, fn, oe, os_ in (('base02', 0x3fc1c8, 0x1620, 0x1630), ('base58', 0x4340fc, 0x1610, 0x1620)):
    flds = {0x40: P, 0x1000: A, oe: OE, os_: OS}
    out['cases'][name + '_fill'] = run(fn, flds, 1, 0.0, 3)                 # +0x1590 1 -> 2: fills
    out['cases'][name + '_first'] = run(fn, flds, 0, 0.0, 3)                # 0 -> 1: counts, no fill (control)
    out['cases'][name + '_delay'] = run(fn, flds, 5, 2.0, 3)                # delay > 0: no count, no fill (control)
    out['cases'][name + '_off'] = run(fn, flds, 5, 0.0, 3, on=0)            # +0x158a 0: nothing (control)
    out['cases'][name + '_n16'] = run(fn, flds, 9, 0.0, 16)                 # em020's 16
print(json.dumps(out))
