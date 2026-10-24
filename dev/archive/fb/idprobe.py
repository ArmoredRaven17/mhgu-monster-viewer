# idprobe.py <class> <em> <variant> (2026-10-19): a class's shell-id loader (vt+0x158) run under trgen's model (the class band native,
# 0x48b71c and every other out-of-band call stubbed) on a fresh unit with its em / variant bytes; prints the words it wrote in
# e+0xcac0..+0xcf00 that look like shell ids (0x40..0x1ff) -- the FB_POKE a census of that class needs (rom-map trap 119)
import sys, os, struct, json
cls, em, var = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
os.environ['FB_CLASS'] = cls; os.environ['FB_EM'] = str(em)
sys.argv = ['x']
import trgen as T
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC
c = T.CLS[cls]; T.rng[0], T.rng[1] = c['lo'], c['hi'] + 0x400; T.VAR[0] = var
T.sc = {}
mu = T.mu
mu.mem_write(T.E, b'\0' * 0x400000); T.nxt[0] = T.ALLOC
mu.mem_write(T.E, struct.pack('<I', c['vtable'])); mu.mem_write(T.E + 0x1428, struct.pack('<I', T.P))
mu.mem_write(T.E + 0xcac0, struct.pack('<I', T.C)); mu.mem_write(T.E + 0xc, struct.pack('<I', 1))
mu.mem_write(T.E + 0xb5f4, bytes([em, var]))
before = bytes(mu.mem_read(T.E + 0xcac0, 0x440))
vt = c['vtable']; ld = struct.unpack_from('<I', T.armdis.DATA, vt - T.armdis.DA_VA + 0x158)[0]
mu.reg_write(UC_ARM_REG_R0, T.E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, T.STOP)
T.cur.clear()
try:
    mu.emu_start(ld, T.STOP, count=400000)
except Exception as ex:
    print('err', ex, hex(mu.reg_read(UC_ARM_REG_PC)))
after = bytes(mu.mem_read(T.E + 0xcac0, 0x440))
out = {}
for o in range(0, 0x440, 4):
    a, b = struct.unpack_from('<I', before, o)[0], struct.unpack_from('<I', after, o)[0]
    if a != b and 0x40 <= b <= 0x1ff: out[hex(0xcac0 + o)] = hex(b)
print(json.dumps({'class': cls, 'em': em, 'variant': var, 'loader': hex(ld), 'ids': out}))
