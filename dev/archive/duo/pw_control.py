# the write hook's control: a store through the partner pointer is recorded (a 2-instruction routine placed in scratch memory:
# ldr r1, [r0, #0]  (the ctl's partner pointer)  ;  str r2, [r1, #0x10]  -- the same shape a damage write would take)
import tracer as t, struct
from unicorn import UC_MEM_WRITE, UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
pw = []
def mh(uc, access, addr, size, value, ud):
    if access == UC_MEM_WRITE: pw.append(hex(addr))
t.mu.hook_add(UC_HOOK_MEM_WRITE, mh, begin=t.E2, end=t.E2 + 0x200000)
t.setup('uEm069_00', 1, 0x23, link=1)
code = struct.pack('<III', 0xe5901000, 0xe5812010, 0xe12fff1e)   # ldr r1,[r0]; str r2,[r1,#0x10]; bx lr
t.mu.mem_write(t.STOP + 0x800, code)
t.rng[0], t.rng[1] = t.STOP + 0x800, t.STOP + 0x80c
t.mu.reg_write(UC_ARM_REG_R0, t.C); t.mu.reg_write(UC_ARM_REG_R2, 0x1234); t.mu.reg_write(UC_ARM_REG_LR, t.STOP)
t.mu.reg_write(UC_ARM_REG_SP, 0x4000f000)
t.mu.emu_start(t.STOP + 0x800, t.STOP, count=100)
print('control writes into the partner (E2 = %#x):' % t.E2, pw)
