"""base60 / base61 (uShellEm088_sp_60 / sp_61) under unicorn: ctor, init, move run natively with the base60/61 band
(0x435b40..0x43a78c), sp_60's +0x150 0x10c5010 and the engine's pure math; every other call a logged stub (the effect starts
return a live handle). The readers are replaced by their fields (sp_60 0x10c4cf0 / sp_61 0x10c5144, READ). Case-driven:
python emu60.py cases.json out.json; a case: {name, cls 60|61, mode, sh{ints,floats,vecs,ef,hit}, R, ownerPos, ownerY, target,
frames, releaseAt}."""
import sys, os, struct, math, json
import numpy as np
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_BLOCK
from unicorn.arm_const import *
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from emu57 import TEXT, RO, DATA, RO_VA, DA_VA, pg, F, fbits
E, P, G, S, SET, SC, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x40300000, 0x40400000, 0x40500000, 0x50000000, 0x60000000
NATIVE = [(0x435b40, 0x43a78c), (0x10c5010, 0x10c5030), (0x7c3a38, 0x7c3b40), (0x232404, 0x232530), (0x1ebe8, 0x1ee80),
          (0x539224, 0x5392a0), (0x5392f8, 0x539300)]
CFG = {60: dict(ctor=0x435be4, vt=0x1809f58, init=0x435d28, move=0x4360a0, ef=0x15cc, hit=0x15ec, ints=0x15f4, fl=0x15fc, nf=15,
                vecs=[0x1638, 0x163c, 0x1640], rel=0x1668, handles=range(0x1644, 0x1664, 4)),
       61: dict(ctor=0x438698, vt=0x180a0b4, init=0x438838, move=0x438c10, ef=0x15c8, hit=0x15e8, ints=0x15f4, fl=0x15fc, nf=24,
                vecs=[0x165c], rel=0x1684, handles=range(0x1660, 0x1680, 4))}


class Run:
    def __init__(self, c):
        self.c = c; cfg = self.cfg = CFG[c['cls']]
        self.mu = mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
        mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
        mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
        mu.mem_map(DA_VA, 0x2400000 - DA_VA); mu.mem_write(DA_VA, DATA)
        for b in (E, P, G, S, SET, SC):
            mu.mem_map(b, 0x40000)
        mu.mem_map(STK - 0x20000, 0x40000); mu.mem_map(RET, 0x1000)
        mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
        mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        self.w = w = lambda a, v: mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
        self.wf = wf = lambda a, v: mu.mem_write(a, struct.pack('<f', float(F(v))))
        mu.mem_write(0x19176b0, b'\0' * 16)
        mu.mem_write(0x1620e60, b'\0' * 16) if False else None
        w(E + 0x1428, P)
        for i in range(3): wf(P + 0x40 + 4 * i, c['ownerPos'][i]); wf(P + 0x1d0 + 4 * i, c.get('target', (0, 0, 0))[i])
        w(P + 0x54, c['ownerY'])
        self.log = []
        mu.hook_add(UC_HOOK_BLOCK, self._hook)
        self.call(cfg['ctor'], S)
        w(S, cfg['vt']); wf(S + 0x1c, 1.0)
        sh = c['sh']
        if c['cls'] == 60: wf(S + 0x15c8, c['R'])
        for i in range(8): w(S + cfg['ef'] + 4 * i, 0x1000 + i if i < len(sh['ef']) and sh['ef'][i][0] != 999 else 0)
        for i, h in enumerate(sh['hit'][:3]): w(S + cfg['hit'] + 4 * i, h)
        w(S + cfg['ints'], sh['ints'][0]); w(S + cfg['ints'] + 4, sh['ints'][1])
        for i in range(cfg['nf']): wf(S + cfg['fl'] + 4 * i, sh['floats'][i] if i < len(sh['floats']) else 0.0)
        for j, off in enumerate(cfg['vecs']):
            if j < len(sh['vecs']):
                a = SC + 0x200 + 0x10 * j
                for i in range(3): wf(a + 4 * i, sh['vecs'][j][i])
                w(S + off, a)
            else:
                w(S + off, 0)
        w(SET + 4, 0x180 if c['cls'] == 60 else 0x181); w(SET + 8, c['mode']); w(SET + 0xc, E)
        w(SET + 0x10, (P + 0x1d0) if c.get('aimed') else 0)

    def _hook(self, uc, addr, size, ud):
        if RET <= addr < RET + 0x1000: return
        if any(lo <= addr < hi for lo, hi in NATIVE): return
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
        elif addr == 0x4a0f00: ret = E
        elif addr == 0x4a0f38: ret = 1
        elif addr == 0x4a0ee4: ret = self.c['mode']
        elif addr == 0xbe518: ss0(1.0)
        elif addr == 0x4a11e4: self.log.append(('start', r[1] - 0x1000)); ret = SC + 0x800; self.w(SC + 0x80c, 1)
        elif addr == 0x43b058: self.log.append(('stop', r[1], r[2]))
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
        b = self.mu.mem_read(S + 4, 4)
        return {'state': b[0], 'sub': b[1], 'phase': b[2], 'pos': [self.f(S + 0x40 + 4 * i) for i in range(3)],
                'words': [self.u(S + 0xfe8 + 4 * i) for i in range(3)], 'vel': [self.f(S + 0x1010 + 4 * i) for i in range(3)],
                'log': [x for x in self.log if x[0] != 'stub']}

    def run(self):
        self.call(self.cfg['init'], S, SET)
        out = [dict(self.snap(), frame=-1)]
        for fr in range(self.c.get('frames', 400)):
            self.log = []
            if fr == self.c.get('releaseAt', -1): self.mu.mem_write(S + self.cfg['rel'], b'\x01')
            if self.mu.mem_read(S + 4, 1)[0] == 0xff: break
            self.call(self.cfg['move'], S)
            out.append(dict(self.snap(), frame=fr))
            if out[-1]['state'] == 0xfe: break
        return out


if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    json.dump({c['name']: Run(c).run() for c in cases}, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
