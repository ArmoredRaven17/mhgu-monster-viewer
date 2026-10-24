"""A small unicorn harness for shell / enemy functions.

    run(fn, regs, mem={addr: bytes}, stubs={addr: value-or-callable}, count)

S (a shell) at 0x30000000, E (the enemy) at 0x30200000, B (the enemy's block, [E+0x1428]) at 0x30400000.
Stubbed by default: 0x4a0f38 (owner active) -> 1, 0x4a0f00 (owner) -> E, 0x4a0ee4 (mode) -> MODE[0];
allocators 0x3f883c / 0x3fa2bc / 0x3fb7bc / 0x3fd7e0 / 0x427c00 -> a fresh zeroed 0x100-byte buffer (their
vtable stores still run in the caller); 0x48b884 (submit) -> logged: the request's first 0x50 bytes; 0x4a10c8 /
0x4a11e4 / 0x3f8970 / 0x329c40 (effect requester / start / contact start / stop) -> logged with r1, r2.
Any other call outside the allowed range is logged and returns 0 (r0 = 0) unless ALLOW covers it."""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *

T = armdis.TEXT
S, E, B, HEAP, STOP, STK = 0x30000000, 0x30200000, 0x30400000, 0x31000000, 0x50000000, 0x4000f000
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, 0x2400000 - da); mu.mem_write(armdis.DA_VA, armdis.DATA)
for base, size in ((S, 0x200000), (E, 0x200000), (B, 0x200000), (HEAP, 0x100000), (0x40000000, 0x10000), (STOP, 0x1000)):
    mu.mem_map(base, size)
log = []
MODE = [0]
heap = [HEAP]
def alloc(uc):
    a = heap[0]; heap[0] += 0x200; uc.mem_write(a, b'\0' * 0x200); return a
def rf(a): return struct.unpack('<f', bytes(mu.mem_read(a, 4)))[0]
def rw(a): return struct.unpack('<I', bytes(mu.mem_read(a, 4)))[0]
def req_dump(uc, r):
    b = bytes(uc.mem_read(r, 0x50))
    w = struct.unpack('<20I', b)
    fl = struct.unpack('<20f', b)
    return {'id': w[1], 'mode': w[2], 'owner': hex(w[3]), 'p10': fl[4:7], 'p20': fl[8:11], 'w20': [hex(x) for x in w[8:11]],
            'b2c': b[0x2c], 'h2e': struct.unpack_from('<H', b, 0x2e)[0], 'w30': [hex(x) for x in w[12:15]], 'f30': fl[12:15],
            'w3c': hex(w[15]), 'raw': b.hex()}
DEFAULT = {0x4a0f38: 1, 0x4a0f00: lambda uc: E, 0x4a0ee4: lambda uc: MODE[0],
           0x3f883c: alloc, 0x3fa2bc: alloc, 0x3fb7bc: alloc, 0x3fd7e0: alloc, 0x427c00: alloc}
LOGGED = {0x48b884: 'submit', 0x4a10c8: 'requester', 0x4a11e4: 'effect_start', 0x3f8970: 'contact_start', 0x329c40: 'stop',
          0x43b058: 'stop2'}
ALLOW = []          # (lo, hi) ranges that run for real
def run(fn, regs=None, mem=None, stubs=None, count=200000, allow=None, quiet=False):
    del log[:]
    heap[0] = HEAP
    for base in (S, E, B):
        mu.mem_write(base, b'\0' * 0x30000)
    mu.mem_write(E + 0x1428, struct.pack('<I', B))
    for a, v in (mem or {}).items():
        mu.mem_write(a, v if isinstance(v, (bytes, bytearray)) else struct.pack('<I', v & 0xffffffff))
    st = dict(DEFAULT); st.update(stubs or {})
    al = list(ALLOW) + list(allow or [])
    def hook(uc, addr, size, ud):
        if addr == fn: return
        if addr in LOGGED:
            r1 = uc.reg_read(UC_ARM_REG_R1)
            ent = (LOGGED[addr], hex(uc.reg_read(UC_ARM_REG_R1)), hex(uc.reg_read(UC_ARM_REG_R2)), hex(uc.reg_read(UC_ARM_REG_LR)))
            if addr == 0x48b884: ent = ent + (req_dump(uc, r1),)
            log.append(ent)
            uc.reg_write(UC_ARM_REG_R0, 1)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
            return
        if addr in st:
            v = st[addr]
            v = v(uc) if callable(v) else v
            uc.reg_write(UC_ARM_REG_R0, v & 0xffffffff)
            uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
            return
        if any(lo <= addr < hi for lo, hi in al): return
        # a call outside the function's own neighbourhood: log and return 0
        lr = uc.reg_read(UC_ARM_REG_LR)
        if lr - 4 != addr and abs(addr - fn) > 0x3000:
            log.append(('call', hex(addr), hex(uc.reg_read(UC_ARM_REG_R1)), hex(lr)))
            uc.reg_write(UC_ARM_REG_R0, 0)
            uc.reg_write(UC_ARM_REG_PC, lr)
    h = mu.hook_add(UC_HOOK_CODE, hook)
    mu.reg_write(UC_ARM_REG_SP, STK)
    mu.reg_write(UC_ARM_REG_LR, STOP)
    for k, v in (regs or {}).items():
        mu.reg_write({'r0': UC_ARM_REG_R0, 'r1': UC_ARM_REG_R1, 'r2': UC_ARM_REG_R2, 'r3': UC_ARM_REG_R3}[k], v & 0xffffffff)
    err = None
    try:
        mu.emu_start(fn, STOP, count=count)
    except Exception as ex:
        err = '%s at %#x' % (ex, mu.reg_read(UC_ARM_REG_PC))
    mu.hook_del(h)
    return log[:], err, mu.reg_read(UC_ARM_REG_R0)
