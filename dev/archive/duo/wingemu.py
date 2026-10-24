# wingemu.py -- Seltas' wing pass vt+0x2a0 (0xfc66f8..0xfc75c0) under unicorn, frame by frame.
# Per frame: ctl+0x40 += 1 (0xfc5e54 -> 0x7264c: e+0x1c x 1.0, his per-frame pass), ctl+0x49 from the schedule, then the
# pass. Recorded: the scale written to joints 150..153 (0x94a834 / the direct stores at joint+0x70), the 0x7237c calls
# (joint id, the matrix it is handed), ctl+0x58 / +0x40 / +0x44 / +0x48 after the pass.
import sys, struct, math, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT
E = 0x30000000; C = 0x30180000; P = 0x30100000; J = 0x30200000; R = 0x30280000; VT = 0x302c0000; STOP = 0x50000000
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
w32 = lambda a, v: mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
wf = lambda a, v: mu.mem_write(a, struct.pack('<f', v))
rf = lambda a: struct.unpack('<f', bytes(mu.mem_read(a, 4)))[0]
r8 = lambda a: mu.mem_read(a, 1)[0]
w32(E, VT); w32(E + 0xcac0, C); w32(E + 0x1428, P); w32(E + 0x494, J); w32(E + 0x498, R); wf(E + 0x1c, 1.0)
mu.mem_write(R, b'\xff' * 256)
for i, jid in enumerate((0x96, 0x97, 0x98, 0x99)):
    mu.mem_write(R + jid, bytes([i]))
    for k in range(4): wf(J + i * 0xa0 + 0x70 + 4 * k, 9.0)       # 9: never written
for k in range(0, 0x400, 4): w32(VT + k, STOP + 0x100)              # every vtable slot: a stub
w32(VT + 0x3f4, STOP + 0x200)                                       # isDead
w32(VT + 0xd8, STOP + 0x300)                                        # joint matrix getter
mu.mem_write(STOP, b'\x1e\xff\x2f\xe1' * 0x400)                     # bx lr everywhere in STOP
calls = []
dead = [0]
def f32r(r): return struct.unpack('<f', struct.pack('<I', mu.reg_read(r) & 0xffffffff))[0]
def setf(r, v): mu.reg_write(r, struct.unpack('<I', struct.pack('<f', v))[0])
def hook(uc, addr, size, ud):
    if addr == STOP + 0x200: uc.reg_write(UC_ARM_REG_R0, dead[0]); return
    if addr == STOP + 0x100: uc.reg_write(UC_ARM_REG_R0, 0); return
    if addr == STOP + 0x300:      # vt+0xd8(out, e, joint): an identity 4x4
        out = uc.reg_read(UC_ARM_REG_R0)
        for k in range(16): wf(out + 4 * k, 1.0 if k % 5 == 0 else 0.0)
        return
    if addr in (0x13ecc20, 0x13ecc2c):
        x = f32r(UC_ARM_REG_S0); setf(UC_ARM_REG_S0, math.sin(x) if addr == 0x13ecc20 else math.cos(x))
        uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
    if addr == 0x7237c:
        m = [rf(uc.reg_read(UC_ARM_REG_R2) + 4 * k) for k in range(12)]
        calls.append(('rot', uc.reg_read(UC_ARM_REG_R1), [round(v, 4) for v in m]))
        uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR)); return
    if addr == 0x94a834: return                                     # native: copies the vec to joint+0x70
    if not (0xfc66f8 <= addr < 0xfc75c4 or 0x94a834 <= addr < 0x94a858 or addr >= STOP):
        uc.reg_write(UC_ARM_REG_R0, 0); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hook)
def frame(v49):
    wf(C + 0x40, rf(C + 0x40) + 1.0)                                # 0xfc5e54: the per-frame count-up
    mu.mem_write(C + 0x49, bytes([v49]))
    del calls[:]
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_LR, STOP + 0x800)
    mu.emu_start(0xfc66f8, STOP + 0x800, count=200000)
    sc = [round(rf(J + i * 0xa0 + 0x70), 3) for i in range(4)]
    return {'49': v49, 'scale150_153': sc, '58': r8(C + 0x58), '40': round(rf(C + 0x40), 2), '44': round(rf(C + 0x44), 2),
            '48': r8(C + 0x48), 'rot': [(hex(c[1]), c[2][:3]) for c in calls]}
if __name__ == '__main__':
    sched = [int(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else [0] * 3 + [2] * 12 + [1] * 4 + [0] * 3 + [2] * 6
    mu.mem_write(C + 0x58, bytes([int(sys.argv[2]) if len(sys.argv) > 2 else 0]))
    for f, v in enumerate(sched):
        print(f, json.dumps(frame(v)))
