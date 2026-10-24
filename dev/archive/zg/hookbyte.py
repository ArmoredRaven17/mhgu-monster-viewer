"""Run a class's action-start hook vt+0x204 for every (status, number) and print the value it leaves in a class field.
   CLS / EM env; python hookbyte.py <field hex> <size 1|4> <statuses>"""
import sys, struct, os, collections
import tracec as TR
from unicorn.arm_const import *
mu = TR.mu; E, P = TR.E, TR.P
off, size = int(sys.argv[1], 16), int(sys.argv[2]); STS = [int(x, 0) for x in sys.argv[3].split(',')]
VT = TR.C_['vtable']; FN = struct.unpack_from('<I', TR.armdis.DATA, VT + 0x204 - TR.armdis.DA_VA)[0]
from unicorn import UC_HOOK_CODE
RAGE = int(os.environ.get('RAGE', '0'))
def hr(uc, addr, size, ud):
    uc.reg_write(UC_ARM_REG_R0, RAGE); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hr, begin=0x81670, end=0x81670)
res = collections.defaultdict(list)
for st in STS:
    for n in range(0x100):
        mu.mem_write(E, b'\0' * 0x200000)
        mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', TR.C))
        mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('EM', '0')), 0])); mu.mem_write(E + 0x73e0, bytes([st, n]))
        mu.mem_write(E + off, b'\x07' * size)          # a sentinel: 7 = untouched
        mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, st); mu.reg_write(UC_ARM_REG_R2, n)
        mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
        try: mu.emu_start(FN, TR.STOP, count=300000)
        except Exception: pass
        v = struct.unpack('<I' if size == 4 else '<B', mu.mem_read(E + off, size))[0]
        if v != (0x07070707 if size == 4 else 7): res[v].append('(%d,%#x)' % (st, n))
for v, a in sorted(res.items()): print(hex(v), len(a), ' '.join(a[:40]))
