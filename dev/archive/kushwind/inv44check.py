"""kushwind/inv44check.py [n]: the ROM's 0x232e24 (4x4 inverse) run native on unicorn (t3emu.py's set-up) over n matrices -- random
general ones, camera-like rigid views (rotation + translation), scaled ones and a singular one -- written to inv44_vectors.json
(input and output words), for inv44check.mjs to replay through docs/render/rom/effect/rom-inv44.js bit for bit."""
import sys, struct, json, random, math
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT; STOP = 0x50000000; A = 0x30000000; O = 0x30000100
def mk():
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
    except Exception: pass
    mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
    ro = armdis.RO_VA & ~0xfff
    mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
    da = armdis.DA_VA & ~0xfff
    mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
    mu.mem_map(0x30000000, 0x10000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    return mu
def f32(v): return struct.unpack('<f', struct.pack('<f', v))[0]
def run(mu, words):
    mu.mem_write(A, struct.pack('<16I', *words)); mu.mem_write(O, b'\xee' * 64)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_R0, O); mu.reg_write(UC_ARM_REG_R1, A); mu.reg_write(UC_ARM_REG_LR, STOP)
    mu.emu_start(0x232e24, STOP, count=100000)
    return list(struct.unpack('<16I', bytes(mu.mem_read(O, 64))))
def w(fl): return list(struct.unpack('<16I', struct.pack('<16f', *fl)))
random.seed(27)
mats = []
for k in range(int(sys.argv[1]) if len(sys.argv) > 1 else 400):
    t = k % 4
    if t == 0: m = [random.uniform(-5, 5) for _ in range(16)]
    else:
        yaw, pit = random.uniform(-math.pi, math.pi), random.uniform(-1.2, 1.2)
        cy, sy, cp, sp = math.cos(yaw), math.sin(yaw), math.cos(pit), math.sin(pit)
        R = [[cy, 0, -sy], [sy * sp, cp, cy * sp], [sy * cp, -sp, cy * cp]]
        sc = 1.0 if t == 1 else random.uniform(0.3, 3.0)
        tr = [random.uniform(-5000, 5000) for _ in range(3)]
        m = [R[0][0] * sc, R[0][1] * sc, R[0][2] * sc, 0, R[1][0] * sc, R[1][1] * sc, R[1][2] * sc, 0, R[2][0] * sc, R[2][1] * sc, R[2][2] * sc, 0, *tr, 1]
    mats.append(w(m))
mats.append(w([1, 2, 3, 4, 2, 4, 6, 8, 0, 0, 1, 0, 0, 0, 0, 1]))     # singular: rows 0 and 1 dependent
mu = mk()
got = struct.unpack('<I', bytes(mu.mem_read(0x1832afc, 4)))[0]
vec = [{'in': m, 'out': run(mu, m)} for m in mats]
json.dump({'identityPtr': got, 'identity': list(struct.unpack('<16I', bytes(mu.mem_read(got, 64)))) if got else None, 'vectors': vec}, open('inv44_vectors.json', 'w'))
print(len(vec), 'vectors; identity pointer', hex(got))
