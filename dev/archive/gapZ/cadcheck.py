# cadcheck.py: 0xcad9c(owner, id) and 0xcaa30(owner, cls, id, &atk, &scale, &x) run under unicorn on a fake owner:
# hyper +0xb720, held IDs +0xca88 = 1 / +0xca9c = 3, element tables +0xca98 / +0xcaac (count +0xc, entry list +0x18; entry byte +4 =
# class, +8 AttackRate, +0xc ScaleRate, half +0x10). Element 1 (ID 1): class 3 -> (1.2, 1.3); element 2 (ID 3): class 3 -> (1.5, 1.7), class 0 -> (1.1, 2.0).
import struct
from unicorn import *
from unicorn.arm_const import *
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
def run(fn, args, hyper=1, stack=()):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM); mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
    O, D, STK, RET = 0x30000000, 0x31000000, 0x50000000, 0x60000000
    mu.mem_map(O, 0x10000); mu.mem_map(D, 0x10000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
    mu.mem_write(O + 0xb720, bytes([hyper])); mu.mem_write(O + 0xca88, bytes([1])); mu.mem_write(O + 0xca9c, bytes([3]))
    def table(at, ents):
        mu.mem_write(at + 0xc, struct.pack('<I', len(ents))); mu.mem_write(at + 0x18, struct.pack('<I', at + 0x100))
        for i, (c, a, s) in enumerate(ents):
            e = at + 0x200 + 0x20 * i; mu.mem_write(at + 0x100 + 4 * i, struct.pack('<I', e))
            mu.mem_write(e + 4, bytes([c])); mu.mem_write(e + 8, struct.pack('<ff', a, s)); mu.mem_write(e + 0x10, struct.pack('<H', 7))
    table(D, [(3, 1.2, 1.3)]); table(D + 0x1000, [(3, 1.5, 1.7), (0, 1.1, 2.0)])
    mu.mem_write(O + 0xca98, struct.pack('<I', D)); mu.mem_write(O + 0xcaac, struct.pack('<I', D + 0x1000))
    out = D + 0x8000
    mu.reg_write(UC_ARM_REG_R0, O)
    regs = [UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3]
    for r, v in zip(regs, args): mu.reg_write(r, v & 0xffffffff)
    sp = STK - 0x100
    for i, v in enumerate(stack): mu.mem_write(sp + 4 * i, struct.pack('<I', v))
    mu.reg_write(UC_ARM_REG_SP, sp); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.emu_start(fn, RET, count=10000)
    return mu.reg_read(UC_ARM_REG_R0), mu
for hyper in (1, 0):
    for id_ in (-1, 0, 1, 3, 5):
        print('hyper', hyper, 'cad9c id', id_, '->', run(0xcad9c, [id_], hyper)[0])
OUT = 0x31008000
for cls, id_ in ((3, -1), (0, -1), (2, -1), (3, 1), (3, 3), (0, 1), (0, 3), (3, 0)):
    r, mu = run(0xcaa30, [cls, id_, OUT], 1, (OUT + 4, OUT + 8))
    a, s = struct.unpack('<ff', bytes(mu.mem_read(OUT, 8)))
    print('caa30 cls', cls, 'id', id_, '->', r, 'atk %.2f scale %.2f' % (a, s) if r else '')
