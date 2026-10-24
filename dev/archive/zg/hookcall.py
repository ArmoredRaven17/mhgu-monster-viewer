"""hookcall.py <addr,addr,...> <statuses>: a class's vt+0x204 run for every action; which actions reach the named addresses.
   CLS / EM / VAR env (over tracec.py, every call outside the band stubbed unless NATIVE)."""
import sys, struct, os, collections
import tracec as TR
from unicorn.arm_const import *
from unicorn import UC_HOOK_CODE
mu = TR.mu; E, P = TR.E, TR.P
AD = [int(x, 16) for x in sys.argv[1].split(',')]; STS = [int(x, 0) for x in sys.argv[2].split(',')]
VT = TR.C_['vtable']; FN = struct.unpack_from('<I', TR.armdis.DATA, VT + 0x204 - TR.armdis.DA_VA)[0]
hit = []
def h(uc, addr, size, ud): hit.append(addr)
for a in AD: mu.hook_add(UC_HOOK_CODE, h, begin=a, end=a)
res = collections.defaultdict(list)
for st in STS:
    for n in range(0x100):
        mu.mem_write(E, b'\0' * 0x200000)
        mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', TR.C))
        mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('EM', '0')), int(os.environ.get('VAR', '0'))])); mu.mem_write(E + 0x73e0, bytes([st, n]))
        # every anchor handle present (a sentinel), so a release path is not skipped on an empty slot
        for off in range(0xd420, 0xd460, 4): mu.mem_write(E + off, struct.pack('<I', TR.C + 0x1000))
        del hit[:]
        mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, st); mu.reg_write(UC_ARM_REG_R2, n)
        mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
        try: mu.emu_start(FN, TR.STOP, count=300000)
        except Exception: pass
        for a in set(hit): res[a].append('(%d,%#x)' % (st, n))
for a in AD: print(hex(a), len(res[a]), ' '.join(res[a][:60]))
