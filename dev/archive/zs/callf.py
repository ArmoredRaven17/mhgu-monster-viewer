# callf.py -- call one uEm057_00 function directly under tr57's machine (band native, outside stubbed) and record every
# shell create 0x48b884 with its whole setup (0x30 / 0x40 bytes). Owner fields distinctive: P+0x40 pos, +0x50.. words,
# ctl ([e+0xcac0]) +0x18 the start yaw.
import sys, struct, json
sys.argv = ['x']
import tr57 as T
from unicorn.arm_const import *
def setup_fields(var, charged, rage=0, extra=None):
    T.mu.mem_write(T.E, b'\0' * 0x400000); T.nxt[0] = T.ALLOC
    c = T.CLS['uEm057_00']
    T.mu.mem_write(T.E, struct.pack('<I', c['vtable'])); T.mu.mem_write(T.E + 0x1428, struct.pack('<I', T.P))
    T.mu.mem_write(T.E + 0xcac0, struct.pack('<I', T.C)); T.mu.mem_write(T.E + 0xc, struct.pack('<I', 1))
    T.mu.mem_write(T.E + 0xb5f4, bytes([57, var]))
    T.mu.mem_write(T.E + 0xcafc, struct.pack('<III', *((0xf9, 0xfb, 0xfa) if var == 4 else (0xf7, 0xf8, 0x19d))))
    T.mu.mem_write(T.P + 0x40, struct.pack('<3f', 1000.0, 50.0, -2000.0))
    T.mu.mem_write(T.P + 0x50, struct.pack('<3I', 0x111, 0x2222, 0x333))
    T.mu.mem_write(T.P + 0x1d0, struct.pack('<3f', 1500.0, 0.0, -1000.0))
    T.mu.mem_write(T.C + 0x18, struct.pack('<I', 0x4444))
    T.mu.mem_write(T.P + 0x5df3, bytes([charged]))
    T.VAR[0] = var
    for a, b in (extra or {}).items(): T.mu.mem_write(a, b)
def call(fn, args, var, charged, rage=0, extra=None, **scn):
    setup_fields(var, charged, rage, extra)
    T.sc = dict(scn, charged=charged, rage=rage)
    c = T.CLS['uEm057_00']; T.rng[0], T.rng[1] = c['lo'], c['hi']
    T.cur.clear()
    regs = [UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3]
    T.mu.reg_write(UC_ARM_REG_R0, T.E)
    for i, v in enumerate(args): T.mu.reg_write(regs[i + 1], v & 0xffffffff)
    T.mu.reg_write(UC_ARM_REG_SP, 0x4000f000); T.mu.reg_write(UC_ARM_REG_LR, T.STOP)
    try:
        T.mu.emu_start(fn, T.STOP, count=200000)
    except Exception as ex:
        T.cur['end'] = 'err %s at %#x' % (ex, T.mu.reg_read(UC_ARM_REG_PC))
    return dict(T.cur)
# a fuller create record: hook 0x48b884 again to dump 0x40 bytes
_old = T.hook
def hook2(uc, addr, size, ud):
    if addr == 0x48b884 and not (T.rng[0] <= addr < T.rng[1]):
        s = uc.reg_read(UC_ARM_REG_R1)
        raw = bytes(uc.mem_read(s, 0x40))
        sid, mode = struct.unpack_from('<II', raw, 4)
        T.cur.setdefault('ev', []).append(['create', hex(sid), mode, [round(x, 4) for x in struct.unpack_from('<3f', raw, 0x10)],
            [hex(x) for x in struct.unpack_from('<3I', raw, 0x20)], raw[0x2c], hex(struct.unpack_from('<H', raw, 0x2e)[0]),
            [round(x, 4) for x in struct.unpack_from('<4f', raw, 0x30)], hex(uc.reg_read(UC_ARM_REG_LR))])
        T.ret(uc, 0); return
    return _old(uc, addr, size, ud)
T.mu.hook_add(T.UC_HOOK_CODE, hook2, begin=0x48b884, end=0x48b884)
