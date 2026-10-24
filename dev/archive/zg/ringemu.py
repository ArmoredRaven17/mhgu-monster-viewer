"""ringemu.py: the Gore line's slot ring run on the ROM -- 0xfc05ec (a site's fill, its caller's counter step done as the sites do it),
0xfc083c (the shells' flag-0 fill) and 0xfaf318 (a burst) under unicorn (tracec.py's machine: the class band native, every outside call
answered), with the effect request 0x6feb8 (behind vt+0x1d0's table), the stop 0x329c40, the ground query 0x183664 and the register
calls 0x69ed0 / 0x69f0c hooked. Reads a JSON scenario on stdin, prints a JSON log: one entry per request / stop, and the ring's bytes.
   scenario: {"floor": y, "ops": [{"fill": [x, y, z], "s0":, "s1":, "flag": 0|1}, {"burst": k}, ...]}"""
import sys, os, json, struct
os.environ.setdefault('CLS', 'uEm071_00'); os.environ.setdefault('EM', '71')
import tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_SP, UC_ARM_REG_LR,
                               UC_ARM_REG_PC, UC_ARM_REG_S0, UC_ARM_REG_S1)
mu, E, C = TR.mu, TR.E, TR.C
sc = json.load(sys.stdin)
LOG = []
HANDLES = [0x30190000]
def f2u(v): return struct.unpack('<I', struct.pack('<f', v))[0]
def u2f(u): return struct.unpack('<f', struct.pack('<I', u & 0xffffffff))[0]
def hk(uc, a, s, ud):
    if a == 0x6feb8:                       # the request: r1 the array, r2 the key, r3 the block
        blk = uc.reg_read(UC_ARM_REG_R3)
        pt = struct.unpack('<3f', uc.mem_read(blk + 0xc0, 12))
        LOG.append({'req': uc.reg_read(UC_ARM_REG_R2), 'array': uc.reg_read(UC_ARM_REG_R1), 'pt': [round(x, 3) for x in pt],
                    'f1c': struct.unpack('<I', uc.mem_read(blk + 0x1c, 4))[0] & 3, 'type8': struct.unpack('<I', uc.mem_read(blk + 8, 4))[0]})
        HANDLES[0] += 0x100
        uc.reg_write(UC_ARM_REG_R0, HANDLES[0]); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    elif a == 0x329c40:
        LOG.append({'stop': uc.reg_read(UC_ARM_REG_R0), 'mode': uc.reg_read(UC_ARM_REG_R1)})
        uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    elif a == 0x183664:                    # the ground query: a hit at the floor when it lies below the ray's start (r1 = the start)
        start = struct.unpack('<3f', uc.mem_read(uc.reg_read(UC_ARM_REG_R1), 12))
        hitp = struct.unpack('<I', uc.mem_read(uc.reg_read(UC_ARM_REG_SP), 4))[0]
        hit = sc['floor'] <= start[1]
        uc.mem_write(hitp, bytes([1 if hit else 0]))
        uc.reg_write(UC_ARM_REG_S0, f2u(sc['floor']))
        uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    elif a in (0x69ed0, 0x69f0c):
        uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
for a in (0x6feb8, 0x329c40, 0x183664, 0x69ed0, 0x69f0c):
    mu.hook_add(UC_HOOK_CODE, hk, begin=a, end=a)
# the machine as the enemy holds it: tracec's zero fill, the vtable, the control block, then the ctor's slot fields (0xfad6cc..0xfad7b4)
TR.run(0, 0, 0, 9, 0, 0, 0, follows=0)                      # (an empty action: only to lay out E / P / C)
mu.mem_write(E + 0xcac0, struct.pack('<I', C)); mu.mem_write(E, struct.pack('<I', TR.C_['vtable']))
mu.mem_write(C + 0x00, b'\xff'); mu.mem_write(C + 0x40, b'\xff'); mu.mem_write(C + 0x80, b'\x00'); mu.mem_write(C + 0x81, b'\x00')
mu.mem_write(E + 0x1054, b'\x01')
PT = 0x40008000; VEC = 0x40008100
def call(fn, r1=0, r2=0, r3=0, stack=(), s0=0.0, s1=0.0):
    sp = 0x4000f000 - 0x40
    for i, w in enumerate(stack): mu.mem_write(sp + 4 * i, struct.pack('<I', w & 0xffffffff))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, r1); mu.reg_write(UC_ARM_REG_R2, r2); mu.reg_write(UC_ARM_REG_R3, r3)
    mu.reg_write(UC_ARM_REG_S0, f2u(s0)); mu.reg_write(UC_ARM_REG_S1, f2u(s1))
    mu.reg_write(UC_ARM_REG_SP, sp); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
    mu.emu_start(fn, TR.STOP, count=200000)
def ring():
    b = bytes(mu.mem_read(C, 0x84))
    return {'bytes': [b[0], b[0x40]], 'counter': b[0x80], 'count': b[0x81],
            'life': [round(u2f(struct.unpack_from('<I', b, 0x30)[0]), 3), round(u2f(struct.unpack_from('<I', b, 0x70)[0]), 3)]}
out = []
for op in sc['ops']:
    LOG.clear()
    if 'fill' in op:
        mu.mem_write(PT, struct.pack('<3f', *op['fill'])); mu.mem_write(VEC, b'\0' * 12)
        if op.get('flag', 1) == 0:
            call(0xfc083c, PT, VEC, 1, (), op['s0'], op['s1'])                      # 0xfc083c(e, point, vec, byte): the counter step inside
        else:
            c = (mu.mem_read(C + 0x80, 1)[0] + 1) & 0xff                             # a site's own step (0xfb24e4.. as every site)
            c = 0 if c >= 4 else c
            mu.mem_write(C + 0x80, bytes([c]))
            call(0xfc05ec, c & 1, PT, VEC, (c, 1), op['s0'], op['s1'])
    elif 'burst' in op:
        call(0xfaf318, op['burst'])
    out.append({'op': op, 'log': list(LOG), 'ring': ring()})
print(json.dumps(out))
