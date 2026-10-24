"""Run a class's action-start hook vt+0x204 for (status, number) with the depleted part 0x9e8d8 answered k, and print the calls it
makes to the sever 0xc2274 (r1..r3), the break request 0x9d438 (r1), and its writes to P+0x3b4.   CLS / EM env; args: st n k..."""
import sys, struct, os
import tracec as TR
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
mu = TR.mu; E, P = TR.E, TR.P
K = {'k': 0, 'ev': []}
def h(uc, addr, size, ud):
    if addr == 0x9e8d8:
        uc.reg_write(UC_ARM_REG_R0, K['k']); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
    if addr in (0xc2274, 0x9d438):
        K['ev'].append('%#x(%d, %d, %#x)' % (addr, uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), uc.reg_read(UC_ARM_REG_R3)))
mu.hook_add(UC_HOOK_CODE, h, begin=0x9d438, end=0xc2274)
def w(uc, acc, addr, size, value, ud):
    if P + 0x3b4 <= addr < P + 0x3b6: K['ev'].append('P+0x3b4 <- %#x' % value)
mu.hook_add(UC_HOOK_MEM_WRITE, w, begin=P + 0x3b4, end=P + 0x3b6)
VT = TR.C_['vtable']; FN = struct.unpack_from('<I', TR.armdis.DATA, VT + 0x204 - TR.armdis.DA_VA)[0]
st, n = int(sys.argv[1], 0), int(sys.argv[2], 0)
for k in [int(x) for x in sys.argv[3:]]:
    K['k'] = k; K['ev'] = []
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', TR.C))
    mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('EM', '0')), 0])); mu.mem_write(E + 0x73e0, bytes([st, n]))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, st); mu.reg_write(UC_ARM_REG_R2, n); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
    try: mu.emu_start(FN, TR.STOP, count=300000); err = ''
    except Exception as ex: err = ' ERR %s pc=%#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    print('(%d, %#x) k=%d fn %#x:' % (st, n, k, FN), ' '.join(K['ev']), err)
