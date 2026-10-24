import sys, struct
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\d410')
sys.argv = ['x', '']
import dyn
from unicorn import UC_HOOK_BLOCK
from unicorn.arm_const import *
k = dyn.mk(['t'], mode=0)
for p in range(5):
    k.mu.mem_write(dyn.E + 0xd420 + 4 * p, struct.pack('<I', 0x5a5a0000))
trail = []
k.mu.hook_add(UC_HOOK_BLOCK, lambda uc, a, s, u: trail.append((a, uc.reg_read(UC_ARM_REG_LR))))
k.setframe(0x205, 10.0, 400.0)
try:
    k.call(0x10b345c)
    print('ok')
except Exception as ex:
    print('ERR', ex, hex(k.mu.reg_read(UC_ARM_REG_PC)))
for a, lr in trail[-15:]:
    print(hex(a), hex(lr))
