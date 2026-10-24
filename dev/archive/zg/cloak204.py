"""cloak204.py -- Chameleos's action-start hook vt+0x204 (0xdff4f0) run on the ROM (tracec's machine) for given (status, number) with a
cloak up (ctl+0xc 1, +0x13 2, +0x15 2) and the latch +0x16 0 / 1, the horn (P+0x3b4 bit 1) and tail (bit 0) as given; prints ctl
+0xc / +0x13 / +0x15 / +0x16 after.   CLS=uEm025_00 EM=25 python cloak204.py"""
import sys, struct, os
import tracec as TR
from unicorn.arm_const import *
mu = TR.mu; E, P, C = TR.E, TR.P, TR.C
VT = TR.C_['vtable']; FN = struct.unpack_from('<I', TR.armdis.DATA, VT + 0x204 - TR.armdis.DA_VA)[0]
print('vt+0x204 =', hex(FN))
def run(st, n, latch, horn, tail):
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', C))
    mu.mem_write(E + 0xb5f4, bytes([25, 0])); mu.mem_write(E + 0x73e0, bytes([st, n]))
    mu.mem_write(C + 0xc, bytes([1])); mu.mem_write(C + 0x13, bytes([2])); mu.mem_write(C + 0x15, bytes([2])); mu.mem_write(C + 0x16, bytes([latch]))
    mu.mem_write(P + 0x3b4, bytes([(2 if horn else 0) | (1 if tail else 0)]))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, st); mu.reg_write(UC_ARM_REG_R2, n)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
    err = ''
    try: mu.emu_start(FN, TR.STOP, count=300000)
    except Exception as ex: err = 'ERR %s at %#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    c = mu.mem_read(C + 0xc, 0xc)
    return 'c=%d 13=%d 15=%d 16=%d %s' % (c[0], c[7], c[9], c[10], err)
for st, n in [(10, 7), (10, 0x72), (10, 0x14), (10, 0x1e), (11, 0), (13, 0), (1, 0), (1, 5), (7, 0x10), (2, 3), (2, 6), (3, 0x19)]:
    for latch in (0, 1):
        print('(%d, %#x) latch %d: horn/tail 0/0 -> %s | 1/0 -> %s | 0/1 -> %s | 1/1 -> %s' % (st, n, latch,
              run(st, n, latch, 0, 0), run(st, n, latch, 1, 0), run(st, n, latch, 0, 1), run(st, n, latch, 1, 1)))
