# Cross-check of the static read of 0x782e4 / 0x7840c -> 0x77d28 -> 0x770e4 (scratch; not a source).
# Runs the ROM code for real (0x72714's frame query included); only the libm PLT stubs are hooked.
import sys, struct, math
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *

T = armdis.TEXT
E = 0x30000000; P = 0x30100000; STK = 0x30400000; STOP = 0x50000000
LIBM = {0x13ecba8: 'atan2f', 0x13ecc14: 'sqrtf', 0x13ecc20: 'sinf', 0x13ecc2c: 'cosf'}
f2u = lambda v: struct.unpack('<I', struct.pack('<f', v))[0]
u2f = lambda u: struct.unpack('<f', struct.pack('<I', u & 0xffffffff))[0]
f32 = lambda v: u2f(f2u(v))

mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
from unicorn.arm_const import UC_CPU_ARM_MAX
mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
mu.mem_map(E, 0x500000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
calls = []
def sreg(i): return [UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_S2][i]
def hook(uc, addr, size, ud):
    if addr in LIBM:
        a = u2f(uc.reg_read(UC_ARM_REG_S0)); b = u2f(uc.reg_read(UC_ARM_REG_S1))
        v = {'atan2f': lambda: math.atan2(a, b), 'sqrtf': lambda: math.sqrt(a), 'sinf': lambda: math.sin(a),
             'cosf': lambda: math.cos(a)}[LIBM[addr]]()
        uc.reg_write(UC_ARM_REG_S0, f2u(v)); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    elif addr >= 0x13ec000 and addr < 0x13ef000:
        calls.append(hex(addr)); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hook)

def w32(a, v): mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
def wf(a, v): mu.mem_write(a, struct.pack('<f', v))
def r32(a): return struct.unpack('<I', mu.mem_read(a, 4))[0]
def rb(a): return mu.mem_read(a, 1)[0]
def rf(a): return struct.unpack('<f', mu.mem_read(a, 4))[0]

def call(fn, r=(), s=(), stack=()):
    sp = STK
    for i, v in enumerate(stack): w32(sp + 4 * i, v)
    mu.reg_write(UC_ARM_REG_SP, sp)
    for i, v in enumerate(r): mu.reg_write([UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3][i], v)
    for i, v in enumerate(s): mu.reg_write(sreg(i), f2u(v))
    mu.reg_write(UC_ARM_REG_LR, STOP)
    mu.emu_start(fn, STOP)
    return mu.reg_read(UC_ARM_REG_R0)

def model(st, yaw, prev, cur, pos, tgt, disp, R, O, f0=50.0, f1=56.0, lim=150.0):
    """The formula of the note (2026-10). st = dict(acc, state). Returns (yaw, ret)."""
    if st['state'] == 1: return yaw, 1
    st['acc'] = f32(st['acc'] + f32(math.sqrt(sum(d * d for d in disp))))
    rate = R
    if st['acc'] > lim:
        a = f32((yaw & 0xffff) * f32(9.58738019107841e-05))
        dx, dz = tgt[0] - pos[0], tgt[2] - pos[2]
        dot = dx * math.sin(a) + dz * math.cos(a)
        if dot < 0 and dx * dx + dz * dz < 22500.0:
            st['state'] = 1; rate = 0
    # mode 9 window and share
    hold = (f0 <= prev <= f1) or (f0 <= cur <= f1)
    if not hold: return yaw, 0
    num = min(cur, f1) - max(prev, f0); den = cur - prev
    share = 0.0 if (num <= 0 or den <= 0) else num / den
    s = math.ceil(f32(f32(rate * (cur - prev)) * share)) & 0xffff
    T_ = int(0.5 + f32(math.atan2(tgt[0] - pos[0], tgt[2] - pos[2])) * 10430.3779296875)
    d = (O - yaw + (T_ & 0xffff)) & 0xffff
    d = d - 0x10000 if d & 0x8000 else d
    if abs(d) < s: return (T_ + O) & 0xffff, 1
    return (yaw + (-s if d < 0 else s)) & 0xffffffff, 0

def run(tgt, O, yaw0=0, disp=(0, 0, 0), frames=70, label=''):
    mu.mem_write(E, b'\0' * 0x500000)
    w32(E + 0x1428, P)
    wf(P + 0x40, 0.0); wf(P + 0x44, 0.0); wf(P + 0x48, 0.0)
    wf(P + 0x1d0, tgt[0]); wf(P + 0x1d4, tgt[1]); wf(P + 0x1d8, tgt[2])
    w32(P + 0x54, yaw0)
    wf(E + 0x1c, 1.0)
    wf(E + 0x13b8, 1.0); wf(E + 0x13b4, 1.0); wf(E + 0x13bc, 200.0); wf(E + 0x508, 0.0); wf(E + 0x4f4, 0.0)
    call(0x782e4, (E, 2, 0x8000, 0), stack=(0,))
    print(label, 'after 0x782e4: 5e64=%d 5e65=%d 5e66=%d 5e68=%#x 5e6c=%r' % (
        rb(P + 0x5e64), rb(P + 0x5e65), rb(P + 0x5e66), r32(P + 0x5e68), rf(P + 0x5e6c)))
    st = {'acc': 0.0, 'state': 0}; my = yaw0; bad = 0; pos = [0.0, 0.0, 0.0]
    for k in range(frames):
        prev, cur = float(k), float(k + 1)
        wf(E + 0x500, prev); wf(E + 0x4fc, cur)
        mu.mem_write(P + 0x320, struct.pack('<fff', *disp))
        pos = [pos[i] + disp[i] for i in range(3)]
        wf(P + 0x40, pos[0]); wf(P + 0x44, pos[1]); wf(P + 0x48, pos[2])
        rv = call(0x7840c, (E, 910, O, 0), (50.0, 56.0, 150.0))
        y = r32(P + 0x54)
        my, mr = model(st, my, prev, cur, pos, tgt, disp, 910, O)
        if (y & 0xffff) != (my & 0xffff) or rv != mr or rb(P + 0x5e65) != st['state']:
            bad += 1; print('  MISMATCH f%d rom yaw %#x ret %d state %d | model %#x ret %d state %d' % (
                k + 1, y, rv, rb(P + 0x5e65), my, mr, st['state']))
        if prev >= 48 and prev <= 57 or rb(P + 0x5e65):
            if prev <= 57: print('  (%g,%g] yaw %#06x ret %d state %d acc %.1f' % (prev, cur, y & 0xffff, rv, rb(P + 0x5e65), rf(P + 0x5e6c)))
    print(label, 'final yaw %#x (%.2f deg)  mismatches %d  stray PLT calls %s' % (
        r32(P + 0x54) & 0xffff, (r32(P + 0x54) & 0xffff) / 182.044, bad, sorted(set(calls))))

run((100.0, 0.0, 300.0), 0x8000, label='A far target, (7,0xdf)')
run((100.0, 0.0, 300.0), 0x838e, label='B far target, (7,0xe2)')
run((-20.0, 0.0, -10.0), 0x8000, yaw0=0x9000, label='C near target, small turn')
run((0.0, 0.0, -100.0), 0x8000, yaw0=0x4000, disp=(0.0, 0.0, 4.0), label='D moving, target behind & near')
run((0.0, 0.0, 400.0), 0x8000, yaw0=0x0, disp=(0.0, 0.0, 4.0), label='E moving, target far ahead')
run((0.0, 0.0, 100.0), 0x8000, yaw0=0x0, disp=(0.0, 0.0, 4.0), label='F moving, passes the target (stop)')
run((30.0, 0.0, -300.0), 0x8000, yaw0=0x0c00, label='G reaches the aim inside the window')
run((-250.0, 0.0, 10.0), 0x838e, yaw0=0xc000, label='H (7,0xe2) aim reached')
