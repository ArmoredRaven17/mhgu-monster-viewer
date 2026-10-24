"""base57 (uShellEm088_sp_57) under unicorn: ctor 0x42ecb8, init 0x42f070, move 0x4303a8 run natively with the
base57 band and the engine's pure math (0x7c3a38 Euler, 0x232404 words->matrix, 0x1ebe8 multiply, 0x539224 flight step);
everything else is a logged stub. The reader 0x10c4598 is replaced by writing its fields (READ: +0x15c8 cmn vec ptr,
+0x15cc..+0x15dc ef 0..4, +0x15e0 / +0x15e4 hit 0 / 1, +0x15e8 int 0, +0x15ec int 2, +0x15f0 int 1, +0x15f4..+0x1614
floats 0..8, +0x1618 vec 1, +0x161c vec 0, +0x1620 vec 2, +0x1624 vec 3, +0x1628 vec 4 -- pointers).
Usage as a module: Run(mode, behaviour, placement, ...) -> per-frame records. For checking shells.js's transcription."""
import sys, os, struct, math, json
import numpy as np
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_BLOCK
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, G, S, SET, SC, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x40300000, 0x40400000, 0x40500000, 0x50000000, 0x60000000
JREC, JTAB = 0x40600000, 0x40700000
GVAR = 0x2132968
F = np.float32
NATIVE = [(0x42ec00, 0x433700), (0x7c3a38, 0x7c3b40), (0x232404, 0x232530), (0x1ebe8, 0x1ee80), (0x539224, 0x5392a0),
          (0x5392f8, 0x539300)]
SHL = None


def fbits(x): return struct.unpack('<I', struct.pack('<f', float(F(x))))[0]


class Run:
    def __init__(self, mode, sh, behaviour, placement, k=0, joint=None, words=(0, 0, 0), pos=(0, 0, 0), ptr14=None,
                 w18=(0, 0, 0), ownerPos=(0, 0, 0), ownerY=0, target=(0, 0, 1000), spot=None, b50=0, b51=0, b54=1,
                 delay=0.0, rate=1.0, cmn=(6.0, 180.0, 2.0), owner_y=0.0):
        self.mu = mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
        mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
        mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
        mu.mem_map(DA_VA, 0x2400000 - DA_VA); mu.mem_write(DA_VA, DATA)
        for b in (E, P, G, S, SET, SC, JREC, JTAB):
            mu.mem_map(b, 0x40000)
        mu.mem_map(STK - 0x20000, 0x40000); mu.mem_map(RET, 0x1000)
        mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
        mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        self.w = w = lambda a, v: mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
        self.wf = wf = lambda a, v: mu.mem_write(a, struct.pack('<f', float(F(v))))
        # the sin table 0x190f568 (0x7c4408: T[i] = sinf(f(f(i) * f(2pi)) * f(1/4096)))
        tab = b''.join(struct.pack('<f', float(F(math.sin(float(F(F(F(i) * F(6.2831854820251465)) * F(0.000244140625))))))) for i in range(4096))
        mu.mem_write(0x190f568, tab)
        # the engine constants 0x7c4408 also fills (0x19176b0 zero vec, 0x19177b0 identity): .bss -- write them
        mu.mem_write(0x19176b0, b'\0' * 16)
        mu.mem_write(0x19177b0, b''.join(struct.pack('<f', v) for v in (1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)))
        w(GVAR, G)
        if spot is not None:
            pp, aa = spot
            for i in range(3): wf(G + 0x50 + 16 * k + 4 * i, pp[i]); wf(G + 0x80 + 16 * k + 4 * i, aa[i])
        # owner E and its block P
        w(E + 0x1428, P); mu.mem_write(E + 0xb5f4, bytes([0x58]))
        for i in range(3): wf(P + 0x40 + 4 * i, ownerPos[i]); wf(P + 0x1d0 + 4 * i, target[i])
        w(P + 0x54, ownerY)
        # joint 130 -> index 0 -> record JREC (+0x10 the matrix)
        w(E + 0x498, JTAB); w(E + 0x494, JREC)
        mu.mem_write(JTAB, b'\xff' * 256); mu.mem_write(JTAB + 130, b'\0')
        self.J = joint
        self.rate = rate
        self.log = []
        mu.hook_add(UC_HOOK_BLOCK, self._hook)
        if joint is not None:
            for i in range(16): wf(JREC + 0x10 + 4 * i, joint[i])
        # the shell: ctor, then the class vtable, dt
        self.call(0x42ecb8, S)
        w(S, 0x1809c94); wf(S + 0x1c, 1.0)
        # the reader's fields (the .shl's own values)
        ints, fl, vecs = sh['ints'], sh['floats'], sh['vecs']
        ef = sh['ef']
        cv = SC + 0x100
        for i in range(3): wf(cv + 4 * i, cmn[i])
        w(S + 0x15c8, cv)
        for i in range(5): w(S + 0x15cc + 4 * i, 0x1000 + i if i < len(ef) and ef[i][0] != 999 else 0)
        w(S + 0x15e0, sh['hit'][0]); w(S + 0x15e4, sh['hit'][1] if len(sh['hit']) > 1 else -1)
        w(S + 0x15e8, ints[0]); w(S + 0x15ec, ints[2]); w(S + 0x15f0, ints[1])
        for i in range(9): wf(S + 0x15f4 + 4 * i, fl[i] if i < len(fl) else 0.0)
        vo = {0: 0x161c, 1: 0x1618, 2: 0x1620, 3: 0x1624, 4: 0x1628}
        for j in range(5):
            a = SC + 0x200 + 0x10 * j
            v = vecs[j] if j < len(vecs) else (0, 0, 0)
            for i in range(3): wf(a + 4 * i, v[i])
            w(S + vo[j], a)
        # the setup (cSetupParamEmBase57, 0x60, filled by 0x10aebac from the CU record)
        w(SET + 4, 0x17e); w(SET + 8, mode); w(SET + 0xc, E); mu.mem_write(SET + 0x10, b'\0'); mu.mem_write(SET + 0x12, b'\xff\xff')
        w(SET + 0x14, k); w(SET + 0x18, placement); w(SET + 0x1c, behaviour)
        if ptr14 is not None:
            for i in range(3): wf(SC + 0x300 + 4 * i, ptr14[i])
            w(SET + 0x20, SC + 0x300)
        else:
            w(SET + 0x20, 0)
        for i in range(3): w(SET + 0x24 + 4 * i, w18[i])
        for i in range(3): wf(SET + 0x30 + 4 * i, pos[i])
        for i in range(3): w(SET + 0x40 + 4 * i, words[i])
        wf(SET + 0x4c, delay)
        mu.mem_write(SET + 0x50, bytes([b50, b51])); w(SET + 0x54, b54)

    def s0(self):
        return struct.unpack('<f', struct.pack('<I', self.mu.reg_read(UC_ARM_REG_S0)))[0]

    def set_s0(self, v):
        self.mu.reg_write(UC_ARM_REG_S0, fbits(v))

    def _hook(self, uc, addr, size, ud):
        if RET <= addr < RET + 0x1000:
            return
        if any(lo <= addr < hi for lo, hi in NATIVE):
            return
        r = [uc.reg_read(x) for x in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        lr = uc.reg_read(UC_ARM_REG_LR)
        ret = 0
        sf = lambda reg: struct.unpack('<f', struct.pack('<I', uc.reg_read(reg)))[0]
        if addr == 0x13ecba8:
            self.set_s0(math.atan2(float(F(sf(UC_ARM_REG_S0))), float(F(sf(UC_ARM_REG_S1)))))
        elif addr == 0x13ecc14:
            self.set_s0(math.sqrt(max(0.0, sf(UC_ARM_REG_S0))))
        elif addr == 0x13ecc20:
            self.set_s0(math.sin(sf(UC_ARM_REG_S0)))
        elif addr == 0x13ecc2c:
            self.set_s0(math.cos(sf(UC_ARM_REG_S0)))
        elif addr == 0x13ecfc8:
            self.set_s0(math.asin(max(-1.0, min(1.0, sf(UC_ARM_REG_S0)))))
        elif addr == 0x43a850: ret = 1
        elif addr == 0x4a100c: ret = SC; uc.mem_write(SC + 0x50, b'\x01')
        elif addr == 0x4a0f00: ret = E
        elif addr == 0x4a0f38: ret = 1
        elif addr == 0x10bb5d0: ret = 0x7777
        elif addr == 0xb0900: self.set_s0(self.rate)
        elif addr == 0xc164c:
            gid, out = r[1], r[2]
            m = self.J
            for i in range(3): self.wf(out + 4 * i, m[12 + i])
            self.wf(out + 12, 0.0)
        elif addr == 0x4a11e4:
            self.log.append(('start', r[1] - 0x1000, lr)); ret = SC + 0x800; self.w(SC + 0x80c, 1)
        elif addr == 0x43b058:
            self.log.append(('stop', r[1], lr))
        elif addr == 0x10ae90c:
            self.log.append(('spot', r[1], lr))
        elif addr == 0x43ac04:
            self.log.append(('camera', r[1], lr))
        elif addr == 0x10ae6c0:
            self.log.append(('slot', r[1], r[2], r[3], lr))
        elif addr == 0x4a15d4:
            self.log.append(('4a15d4', r[1], r[2], lr))
        else:
            self.log.append(('stub', hex(addr), hex(lr)))
        uc.reg_write(UC_ARM_REG_R0, ret)
        uc.reg_write(UC_ARM_REG_PC, lr)

    def call(self, fn, *args):
        mu = self.mu
        mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
        regs = (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)
        for i, a in enumerate(args):
            mu.reg_write(regs[i], a)
        mu.emu_start(fn, RET, count=2000000)
        return mu.reg_read(UC_ARM_REG_R0)

    def f(self, a): return struct.unpack('<f', self.mu.mem_read(a, 4))[0]
    def u(self, a): return struct.unpack('<I', self.mu.mem_read(a, 4))[0]

    def snap(self):
        b = self.mu.mem_read(S + 4, 4)
        return {'state': b[0], 'phase': b[1], 'sub': b[2], 'pos': [self.f(S + 0x40 + 4 * i) for i in range(3)],
                'words': [self.u(S + 0xfe8 + 4 * i) for i in range(3)], 'vel': [self.f(S + 0x1010 + 4 * i) for i in range(3)],
                'acc': [self.f(S + 0x1020 + 4 * i) for i in range(3)], 'timer': self.f(S + 0x1644),
                'target': [self.f(S + 0x1650 + 4 * i) for i in range(3)], 'end': [self.f(S + 0x16c0 + 4 * i) for i in range(3)],
                'fin': [self.f(S + 0x1710 + 4 * i) for i in range(3)], 'finw': [self.u(S + 0x1720 + 4 * i) for i in range(3)],
                'endw': [self.u(S + 0x16d0 + 4 * i) for i in range(3)], 'b48': bytes(self.mu.mem_read(S + 0x1748, 2)).hex(),
                'drawbit': (self.u(S + 0xc) >> 11) & 1, 'log': self.log}

    def run(self, frames):
        ok = self.call(0x42f070, S, SET)
        out = [dict(self.snap(), frame=-1, init=ok)]
        self.log = []
        for fr in range(frames):
            st = self.mu.mem_read(S + 4, 1)[0]
            if st == 0xff: break
            self.call(0x4303a8, S)
            out.append(dict(self.snap(), frame=fr))
            self.log = []
        return out


def load_shl():
    # the .shl values: parse ahtal/shl088.txt's shell57 lines
    import re, ast
    p = os.path.join(os.path.dirname(__file__), '..', 'ahtal', 'shl088.txt')
    modes = {}
    cur = None
    for line in open(p):
        if line.startswith('=== '): cur = line.split()[1]
        m = re.match(r'\s+\[\s*(\d+)\] scale (\S+) ef (\[.*?\]\]) sh (\{.*\}) hit (\[.*?\])', line)
        if m and cur == 'shell57':
            sh = json.loads(m.group(4)); sh['ef'] = json.loads(m.group(3)); sh['hit'] = json.loads(m.group(5))
            modes[int(m.group(1))] = sh
    return modes


if __name__ == '__main__':
    # cases: a json list of {name, mode, behaviour, placement, k, joint, ownerPos, ownerY, target, spot, ptr14, w18, b50, b54, frames}
    M = load_shl()
    cases = json.load(open(sys.argv[1]))
    res = {}
    for c in cases:
        R = Run(c['mode'], M[c['mode']], c['behaviour'], c['placement'], k=c['k'], joint=c.get('joint'),
                ownerPos=tuple(c.get('ownerPos', (0, 0, 0))), ownerY=c.get('ownerY', 0), target=tuple(c.get('target', (0, 0, 1000))),
                spot=(tuple(c['spot'][0]), tuple(c['spot'][1])) if c.get('spot') else None,
                ptr14=tuple(c['ptr14']) if c.get('ptr14') else None, w18=tuple(c.get('w18', (0, 0, 0))),
                b50=c.get('b50', 0), b51=c.get('b51', 0), b54=c.get('b54', 1), rate=c.get('rate', 1.0))
        res[c['name']] = R.run(c.get('frames', 600))
    json.dump(res, open(sys.argv[2], 'w'))
    print(len(res), 'cases')
