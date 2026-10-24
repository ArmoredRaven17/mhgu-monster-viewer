"""Ahtal-Ka (uEm088_00, vtable 0x1804328) under unicorn: the frame handler vt+0x208 (0x10b7644 -> 0x10b7798, the
20-slot thread machine) per motion / frame / mode, and the PSL enable word vt+0x13c (0x10bc340).
Runs every function in the class band 0x10a2e44..0x10c1fc4 and the shared enemy layer 0x60000..0xd0000 natively;
everything else is a stub that returns 0 (logged). Request 0x10bb5f0(e, slot, id, ..) and the base u request vt+0x1d0
0x10bc414 are logged and return 0 (no handle stored -> an active slot re-requests every frame, which marks its window).
Stops 0x329c40 logged.
The frame: e+0x4b4 motion (u16), e+0x500 / e+0x13ac frame, e+0x13b4 / +0x13b8 / +0x1c delta 1.0, e+0x4f4 speed 1.0,
e+0x13bc length, e+0x508 loop (0 = none)."""
import sys, os, struct, collections
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE, UC_HOOK_BLOCK, UcError
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, G, NES, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x40300000, 0x50000000, 0x60000000
GVAR = 0x2132968
VT = 0x1804328
NATIVE = [(0x10a2e44, 0x10c1fc4), (0x60000, 0xd0000)]
LOG_REQ = {0x10bb5f0, 0x10bc414}
LOGN = set()
RETVAL = {}
f32 = lambda x: struct.pack('<f', x)


class Ka:
    def __init__(self, mode=4, vt=VT, d3e1=4, rage=0, tired=0, action=(0, 0), gphase=0, gsub=0, slots=(1, 1, 1), extra=()):
        self.VT = vt
        mu = self.mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
        mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
        mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
        mu.mem_map(DA_VA, 0x2400000 - DA_VA); mu.mem_write(DA_VA, DATA)
        for b in (E, P, G, NES):
            mu.mem_map(b, 0x40000)
        mu.mem_map(STK - 0x20000, 0x40000); mu.mem_map(RET, 0x1000)
        mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
        mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        w = lambda a, v: mu.mem_write(a, struct.pack('<I', v))
        w(E, self.VT); w(E + 0x1428, P)
        w(GVAR, G); w(G + 0x38, E); w(G + 0x34, 0)
        mu.mem_write(G + 0x31, bytes([gphase, gsub]))
        mu.mem_write(G + 0x3c, bytes(slots))
        for k in range(3):
            mu.mem_write(G + 0x50 + 16 * k, f32(100.0 * (k + 1)) + f32(0) + f32(500.0))
        w(E + 0xcb0c, mode)
        mu.mem_write(E + 0xd3e1, bytes([d3e1]))
        mu.mem_write(E + 0xd470, bytes([4, 4]))
        mu.mem_write(E + 0x73e0, bytes(action))
        mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
        mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
        for a, b in extra:
            mu.mem_write(a, b)
        self.speed = 0.0
        self.loop = 0.0
        self.log = []
        self.stubbed = collections.Counter()
        mu.hook_add(UC_HOOK_BLOCK, self._hook)

    def _hook(self, uc, addr, size, ud):
        if addr == RET or RET <= addr < RET + 0x1000:
            return
        if addr in LOGN:
            r = [uc.reg_read(x) for x in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
            self.log.append(('call', addr, r[1], r[2]))
        if any(lo <= addr < hi for lo, hi in NATIVE) and addr not in LOG_REQ and addr not in (0x329c40,):
            return
        r = [uc.reg_read(x) for x in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        lr = uc.reg_read(UC_ARM_REG_LR)
        if addr == 0x10bb5f0:
            self.log.append(('slot', r[1], r[2], lr))
        elif addr == 0x10bc414:
            self.log.append(('req', r[1], None, lr))
        elif addr == 0x329c40:
            self.log.append(('stop', r[0], r[1], lr))
        else:
            self.stubbed[(addr, lr)] += 1
        uc.reg_write(UC_ARM_REG_R0, RETVAL.get(addr, 0))
        uc.reg_write(UC_ARM_REG_PC, lr)

    def setframe(self, motion, frame, length):
        mu = self.mu
        mu.mem_write(E + 0x4b4, struct.pack('<H', motion))
        mu.mem_write(E + 0x500, f32(frame)); mu.mem_write(E + 0x13ac, f32(frame))
        mu.mem_write(E + 0x13b4, f32(1.0)); mu.mem_write(E + 0x13b8, f32(1.0)); mu.mem_write(E + 0x1c, f32(1.0))
        mu.mem_write(E + 0x4f4, f32(self.speed)); mu.mem_write(E + 0x13bc, f32(length)); mu.mem_write(E + 0x508, f32(self.loop))
        mu.mem_write(E + 0x13c0, b'\0')

    def call(self, fn, *args):
        mu = self.mu
        mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
        regs = (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)
        for i, a in enumerate((E,) + args):
            mu.reg_write(regs[i], a)
        self.log = []
        mu.emu_start(fn, RET, count=400000)
        return self.log

    def slots(self):
        out = []
        for k in range(20):
            s = E + 0xcb20 + 0x70 * k
            b = bytes(self.mu.mem_read(s, 0x70))
            if b[4]:
                out.append((k, struct.unpack_from('<I', b, 8)[0], b[0xc], b[0xd], b[0x30], b[0x31], b[0x60]))
        return out

    def word(self, motion):
        self.mu.mem_write(E + 0x13f4, b'\0\0\0\0')
        self.call(0x10bc340, motion)
        return struct.unpack('<I', self.mu.mem_read(E + 0x13f4, 4))[0]


if __name__ == '__main__':
    k = Ka(mode=int(sys.argv[1]))
    m = int(sys.argv[2], 16)
    for f in range(0, int(sys.argv[3])):
        k.setframe(m, float(f), 999.0)
        lg = k.call(0x10b7644)
        print(f, lg, k.slots())
    print(k.stubbed.most_common(20))
