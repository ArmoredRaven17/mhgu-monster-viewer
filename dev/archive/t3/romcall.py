# romcall.py -- call one main.text function natively on unicorn with given core / float registers and memory blocks; read back
# r0, s0..s3 and memory. For the differential tests of the type-3 contact routine's transcription (render/hit-type3.js).
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT; STOP = 0x50000000
BUF = 0x30000000                     # scratch blocks live here (64 KB)
_base = None
def _mk():
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
    except Exception: pass
    mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
    ro = armdis.RO_VA & ~0xfff
    mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
    da = armdis.DA_VA & ~0xfff
    mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
    mu.mem_map(BUF, 0x10000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    return mu
_mu = None
_ctx = None
def call(fn, r=(), s=(), mem=(), count=3000000):
    """r: core args r0..r3 (ints); s: float args s0.. ; mem: [(addr, bytes)]. Returns (r0, [s0..s3], mu)"""
    global _mu, _ctx
    if _mu is None:
        _mu = _mk(); _ctx = _mu.context_save()
    mu = _mu; mu.context_restore(_ctx)
    mu.mem_write(BUF, b'\0' * 0x10000)
    for a, b in mem: mu.mem_write(a, b)
    for k, v in enumerate(r): mu.reg_write(UC_ARM_REG_R0 + k, v & 0xffffffff)
    for k, v in enumerate(s): mu.reg_write(UC_ARM_REG_S0 + k, struct.unpack('<I', struct.pack('<f', v))[0])
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
    mu.emu_start(fn, STOP, count=count)
    sv = [struct.unpack('<f', struct.pack('<I', mu.reg_read(UC_ARM_REG_S0 + k) & 0xffffffff))[0] for k in range(4)]
    return mu.reg_read(UC_ARM_REG_R0), sv, mu
def f32s(mu, a, n): return list(struct.unpack('<%df' % n, bytes(mu.mem_read(a, 4 * n))))
def u32s(mu, a, n): return list(struct.unpack('<%dI' % n, bytes(mu.mem_read(a, 4 * n))))
def pk(*v): return struct.pack('<%df' % len(v), *v)
def bits(x): return struct.unpack('<I', struct.pack('<f', x))[0]
