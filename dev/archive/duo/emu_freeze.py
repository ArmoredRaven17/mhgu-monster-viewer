# emu_freeze.py -- his 1:0x21 freeze, dynamically: (1) 0xb07b4(e, 0.0) as his 1:0x21 calls it (0xfc99fc) -> both layers' speed
# (e+0x50c layer 0, e+0x64c layer 1, via 0x5393d0 / 0x53942c, run natively); (2) the motion layer update's step 0x94ecf0..0x94ef0c
# for layer 0 and layer 1, 60 updates each, frame +0x4fc from 6.0 (his M79's held frame) -- and the CONTROL: the same with speed
# 1.0 (his 1:0x20 struggle: M79 b4 at speed 1) advances one frame an update.
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT
E = 0x30000000; P = 0x30100000; STOP = 0x50000000
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
except Exception: pass
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
mu.mem_map(E, 0x400000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
mu.mem_write(STOP, b'\x1e\xff\x2f\xe1' * 0x400)
w32 = lambda a, v: mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
w16 = lambda a, v: mu.mem_write(a, struct.pack('<H', v & 0xffff))
wf = lambda a, v: mu.mem_write(a, struct.pack('<f', v))
rf = lambda a: struct.unpack('<f', bytes(mu.mem_read(a, 4)))[0]
def setf(r, v): mu.reg_write(r, struct.unpack('<I', struct.pack('<f', v))[0])
w32(E + 0x1428, P); wf(P + 0x38c, 1.0); wf(P + 0x394, 1.0); mu.mem_write(P + 0x5cdc, b'\0')
calls = []
def hook(uc, addr, size, ud):
    if addr in (0x5393d0, 0x53942c): calls.append(hex(addr))
mu.hook_add(UC_HOOK_CODE, hook)
def run_speed(v):
    del calls[:]
    wf(E + 0x50c, 7.0); wf(E + 0x64c, 7.0)                    # (anything: the call must overwrite them)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_R0, E); setf(UC_ARM_REG_S0, v)
    mu.reg_write(UC_ARM_REG_LR, STOP + 0x10)
    mu.emu_start(0xb07b4, STOP + 0x10, count=100000)
    return rf(P + 0x398), rf(E + 0x50c), rf(E + 0x64c), list(calls)
def step_layer(n, speed, frame0, updates=60):
    L = E + n * 0x140
    wf(L + 0x50c, speed); w16(L + 0x4b6, 0); w16(L + 0x4b4, 0x44f); mu.mem_write(L + 0x4b8, b'\0'); w32(L + 0x4bc - 0x40 + 0x40, 0)
    wf(L + 0x4fc, frame0); wf(L + 0x504, 60.0); wf(L + 0x508, 0.0); wf(E + 0x1c, 1.0)
    w32(L + 0x4fc - 0x40, 0)                                  # [fp-0x40] = the layer's mode word (bit 0x10 frozen) -- clear
    seen = []
    for _ in range(updates):
        mu.reg_write(UC_ARM_REG_SP, 0x4000f000)
        mu.reg_write(UC_ARM_REG_R6, n); mu.reg_write(UC_ARM_REG_R10, E); mu.reg_write(UC_ARM_REG_R3, 0x4b6)
        mu.reg_write(UC_ARM_REG_R12, 0x4b4); mu.reg_write(UC_ARM_REG_R5, 0); setf(UC_ARM_REG_S16, 0.0)
        mu.emu_start(0x94ecf0, 0x94ef0c, count=100000)
        seen.append(round(rf(L + 0x4fc), 3))
    return seen
if __name__ == '__main__':
    print('1:0x21 0xb07b4(e, 0.0): P+0x398, layer0 speed e+0x50c, layer1 speed e+0x64c, setters:', run_speed(0.0))
    print('control 0xb07b4(e, 1.0):', run_speed(1.0))
    for n in (0, 1):
        f0 = step_layer(n, 0.0, 6.0)
        print('layer %d, speed 0 (frozen), frame from 6.0: first %s ... last %s' % (n, f0[:3], f0[-3:]))
        f1 = step_layer(n, 1.0, 6.0, 20)
        print('layer %d, speed 1 (control: the struggle), frame from 6.0: %s' % (n, f1[:6]))
