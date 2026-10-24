"""uShellEm088_sp_00 (base00 + its overrides) under unicorn: the sp_00 ctor 0x10c30d4 (-> base00's 0x3f8a04), init
0x10c315c, move +0x24 0x10c312c, with base00's band (0x3f8800..0x3fa0a0), sp_00's overrides (0x10c30d4..0x10c3a28) and the
engine math native; the reader 0x10c34c0 stubbed after writing its fields (READ map, s0001 report); every other call a logged
stub (0x48b884, the child create, logs its setup). Case-driven: python emu00.py cases.json out.json."""
import sys, os, struct, math, json
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_BLOCK
from unicorn.arm_const import *
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from emu57 import TEXT, RO, DATA, RO_VA, DA_VA, pg, F, fbits
E, P, G, S, SET, SC, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x40300000, 0x40400000, 0x40500000, 0x50000000, 0x60000000
NATIVE = [(0x3f8800, 0x3fa0a0), (0x10c30d4, 0x10c3a28), (0x7c3a38, 0x7c3b40),
          (0x539224, 0x5392a0), (0x5392f8, 0x539300)]


class Run:
    def __init__(self, c):
        self.c = c
        self.mu = mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
        mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
        mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
        mu.mem_map(DA_VA, 0x2400000 - DA_VA); mu.mem_write(DA_VA, DATA)
        for b in (E, P, G, S, SET, SC): mu.mem_map(b, 0x40000)
        mu.mem_map(STK - 0x20000, 0x40000); mu.mem_map(RET, 0x1000)
        mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
        mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        self.w = w = lambda a, v: mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
        self.wf = wf = lambda a, v: mu.mem_write(a, struct.pack('<f', float(F(v))))
        mu.mem_write(0x19176b0, b'\0' * 16)
        w(E + 0x1428, P)
        for i in range(3): wf(P + 0x40 + 4 * i, c['ownerPos'][i]); wf(P + 0x1d0 + 4 * i, c['target'][i])
        for i in range(3): w(P + 0x50 + 4 * i, c['ownerWords'][i])
        self.J = c['joint']
        self.log = []; self.creates = []
        mu.hook_add(UC_HOOK_BLOCK, self._hook)
        self.call(0x10c30d4, S)
        w(S, 0x1809838); wf(S + 0x1c, 1.0)
        for o in (0x13ae, 0x1466, 0x151e): mu.mem_write(S + o, bytes([0xff]))   # the hit slots' 'connected' bytes: none (the base ctor's, I)
        sh = c['sh']; I = lambda i: sh['ints'][i] if i < len(sh['ints']) else -1
        flags = (1 if I(1) != -1 else 0) | (2 if I(2) != -1 else 0) | (4 if I(3) != -1 else 0) | (0x10 if I(4) != -1 else 0) | (0x20 if I(5) != -1 else 0)
        ef = sh['ef']
        for i in range(4): w(S + 0x15c8 + 4 * i, 0x1000 + i if i < len(ef) and ef[i][0] != 999 else 0)
        w(S + 0x1670, 0x1004 if len(ef) > 4 and ef[4][0] != 999 else 0)
        w(S + 0x15d8, sh['hit'][0]); w(S + 0x1668, sh['hit'][1])
        w(S + 0x15dc, I(0)); w(S + 0x15e8, flags)
        fl = sh['floats']
        for i, off in enumerate([0x15f4, 0x15f8, 0x15fc, 0x1600, 0x1604, 0x1608, 0x160c]): wf(S + off, fl[i])
        wf(S + 0x1660, fl[7] if len(fl) > 7 else 0.0)
        for j, off in enumerate([0x1610, 0x1618]):
            a = SC + 0x200 + 0x10 * j
            for i in range(3): wf(a + 4 * i, sh['vecs'][j][i])
            w(S + off, a)
        w(SET + 4, 0x17b); w(SET + 8, c['mode']); w(SET + 0xc, E)
        for i in range(3): wf(SET + 0x10 + 4 * i, c.get('reqPos', (0, 0, 0))[i])
        for i in range(3): w(SET + 0x20 + 4 * i, c.get('reqWords', (0, 0, 0))[i])
        mu.mem_write(SET + 0x2c, b'\0'); mu.mem_write(SET + 0x2e, b'\xff\xff')
        wf(SET + 0x30, c.get('yaw', 0.0))
        w(S + 0x136c, SET)

    def _hook(self, uc, addr, size, ud):
        if RET <= addr < RET + 0x1000: return
        if addr != 0x10c34c0 and any(lo <= addr < hi for lo, hi in NATIVE): return
        r = [uc.reg_read(x) for x in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        lr = uc.reg_read(UC_ARM_REG_LR)
        sf = lambda reg: struct.unpack('<f', struct.pack('<I', uc.reg_read(reg)))[0]
        ss0 = lambda v: uc.reg_write(UC_ARM_REG_S0, fbits(v))
        ret = 0
        if addr == 0x13ecba8: ss0(math.atan2(sf(UC_ARM_REG_S0), sf(UC_ARM_REG_S1)))
        elif addr == 0x13ecc14: ss0(math.sqrt(max(0.0, sf(UC_ARM_REG_S0))))
        elif addr == 0x13ecc20: ss0(math.sin(sf(UC_ARM_REG_S0)))
        elif addr == 0x13ecc2c: ss0(math.cos(sf(UC_ARM_REG_S0)))
        elif addr == 0x13ecfc8: ss0(math.asin(max(-1.0, min(1.0, sf(UC_ARM_REG_S0)))))
        elif addr == 0x43a850: ret = 1
        elif addr == 0x4a100c: ret = SC; uc.mem_write(SC + 0x50, b'\x01')
        elif addr in (0x4a0f00, 0x4a0f40): ret = E
        elif addr == 0x4a0f38: ret = 1
        elif addr == 0x4a0ee4: ret = self.c['mode']
        elif addr == 0xc15a4:
            for i in range(16): self.wf(r[2] + 4 * i, self.J[i])
        elif addr == 0x4a11e4: self.log.append(('start', r[1] - 0x1000)); ret = SC + 0x800; self.w(SC + 0x80c, 1)
        elif addr == 0x43b058: self.log.append(('stop', r[1], r[2]))
        elif addr == 0x48b884:
            q = r[1]
            self.creates.append({'mode': struct.unpack('<I', uc.mem_read(q + 8, 4))[0],
                                 'pos': list(struct.unpack('<3f', uc.mem_read(q + 0x10, 12))),
                                 'words': list(struct.unpack('<3I', uc.mem_read(q + 0x20, 12)))})
            self.log.append(('create',))
        else: self.log.append(('stub', hex(addr), hex(lr)))
        uc.reg_write(UC_ARM_REG_R0, ret)
        uc.reg_write(UC_ARM_REG_PC, lr)

    def call(self, fn, *args):
        mu = self.mu
        mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
        for i, a in enumerate(args): mu.reg_write((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)[i], a)
        mu.emu_start(fn, RET, count=2000000)
        return mu.reg_read(UC_ARM_REG_R0)

    def f(self, a): return struct.unpack('<f', self.mu.mem_read(a, 4))[0]
    def u(self, a): return struct.unpack('<I', self.mu.mem_read(a, 4))[0]

    def snap(self):
        return {'state': self.mu.mem_read(S + 4, 1)[0], 'pos': [self.f(S + 0x40 + 4 * i) for i in range(3)],
                'words': [self.u(S + 0xfe8 + 4 * i) for i in range(3)], 'vel': [self.f(S + 0x1010 + 4 * i) for i in range(3)],
                'split': self.f(S + 0x1664), 'aimT': [self.f(S + 0x1640 + 4 * i) for i in range(3)],
                'log': [x for x in self.log if x[0] != 'stub'], 'creates': self.creates}

    def run(self):
        ok = self.call(0x10c315c, S, SET)
        out = [dict(self.snap(), frame=-1, ok=ok)]
        for fr in range(self.c.get('frames', 300)):
            self.log = []; self.creates = []
            self.call(0x10c312c, S)
            out.append(dict(self.snap(), frame=fr))
            if out[-1]['state'] != 1: break
        return out


if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    json.dump({c['name']: Run(c).run() for c in cases}, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
