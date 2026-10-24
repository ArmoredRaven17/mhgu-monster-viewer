"""air/emu_takeoff.py -- a class's posture-1 takeoff handler frame by frame under unicorn, the unit's height out.
Runs NATIVELY: the handler (e.g. Seregios (3,0) 0xfe2b7c), 0xbf4d4 / 0x712a0 (FlyOfs), 0xbc984 (posture -> 1, the
lift), 0xc1010 / 0x2329dc / 0xb0928 / 0xb0900 (the velocity curve), 0x7d810 -> 0x7c9fc (the integrator) -> 0xbf038
(the FlyOfs floor), 0x7b518, and each frame the engine's own pin / clamp 0xbf284. Stubs: sinf / cosf (PLT
0x13ecc20 / 0x13ecc2c, computed), 0xb09c8 (motion end: frame >= LEN), 0xafe84 / 0xafce8 (setMotion: logged,
frame = start s1), 0x76c08 / 0x7699c / vt calls (logged, return 0).
The ground probe is not run: P+0x5b4 = GROUND, P+0x5b0 = 1 (a hit) every frame. Root motion is not run: the
caller passes each motion's reference-track Y per frame (all 0 for the clips used here, from the glb).
usage: python emu_takeoff.py <handler hex> <phase> <frames> [flyofs] [size] [p92c] [p930] [len=..]"""
import sys, struct, math
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\held')
import d
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *

E = 0x40000000; P = E + 0x1440; DTB = 0x40100000; STK = 0x50000000; RET = 0x60000000
STUBS = set()
DEFLEN = [10 ** 9]
ARGS = []
SETF = []
RET1 = {}
FRAMETEST = [False]
INIT = {}
CTL = 0x40200000
pg = lambda n: (n + 0xfff) & ~0xfff
fl = lambda v: struct.unpack('<I', struct.pack('<f', v))[0]


class Run:
    def __init__(self, handler, phase, flyofs=500.0, size=1.0, p92c=0, p930=0.0, lens=None, ground=0.0, y0=0.0, posture=0):
        mu = self.mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
        mu.mem_map(0, pg(len(d.TEXT))); mu.mem_write(0, d.TEXT)
        mu.mem_map(d.RO_VA & ~0xfff, pg(d.RO_VA + len(d.RODATA) - (d.RO_VA & ~0xfff))); mu.mem_write(d.RO_VA, d.RODATA)
        mu.mem_map(d.DA_VA, 0x2400000 - d.DA_VA); mu.mem_write(d.DA_VA, d.DATA)
        mu.mem_map(E, 0x40000); mu.mem_map(DTB, 0x1000); mu.mem_map(CTL, 0x1000)
        mu.mem_map(STK - 0x20000, 0x40000); mu.mem_map(RET, 0x1000)
        mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
        mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        self.handler = handler; self.lens = lens or {}; self.motion = None; self.frame = 0.0; self.log = []
        w = self.w; wf = self.wf; wb = self.wb
        w(E + 0x1428, P); w(E + 0x75e8, DTB); w(E + 0xcac0, CTL)
        wf(DTB + 0x98, flyofs); wf(DTB + 0xa4, 100.0)
        wf(P + 0x1ac, size); wf(P + 0x1b0, 1.0)
        wb(P + 0x1ba, posture); wb(P + 0x1a1, phase)
        wf(P + 0x5b4, ground); w(P + 0x5b0, 1); wf(P + 0x44, y0)
        w(P + 0x92c, p92c); wf(P + 0x930, p930)
        wf(E + 0x1c, 1.0); wf(E + 0x50c, 1.0); wf(E + 0x500, 0.0)
        for a, v in ((0x19176c0, (1, 1, 1, 0)), (0x19176d0, (-1, -1, -1, 0)), (0x19176e0, (1, 0, 0, 0)), (0x19176f0, (0, 1, 0, 0)),
                     (0x1917700, (0, 0, 1, 0)), (0x19178d0, (0, 0, 0, 1))):
            mu.mem_write(a, struct.pack('<4f', *v))   # the .bss constants (ROM-run static initialisers, consts.py)
        mu.hook_add(UC_HOOK_CODE, self._hook)

    def w(self, a, v): self.mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
    def wb(self, a, v): self.mu.mem_write(a, bytes([v & 0xff]))
    def wf(self, a, v): self.mu.mem_write(a, struct.pack('<f', v))
    def rf(self, a): return struct.unpack('<f', self.mu.mem_read(a, 4))[0]
    def rb(self, a): return self.mu.mem_read(a, 1)[0]
    def sf(self, reg): return struct.unpack('<f', struct.pack('<I', self.mu.reg_read(reg)))[0]
    def setsf(self, reg, v): self.mu.reg_write(reg, fl(v))

    def ret(self, r0=None):
        if r0 is not None: self.mu.reg_write(UC_ARM_REG_R0, r0 & 0xffffffff)
        self.mu.reg_write(UC_ARM_REG_PC, self.mu.reg_read(UC_ARM_REG_LR))

    def _hook(self, mu, addr, size, ud):
        self.ring = (getattr(self, 'ring', []) + [addr])[-12:]
        if addr == RET: mu.emu_stop(); return
        if addr == 0x13ecc20: self.setsf(UC_ARM_REG_S0, math.sin(self.sf(UC_ARM_REG_S0))); return self.ret()
        if addr == 0x13ecc2c: self.setsf(UC_ARM_REG_S0, math.cos(self.sf(UC_ARM_REG_S0))); return self.ret()
        if addr == 0x13ecba8: self.setsf(UC_ARM_REG_S0, math.atan2(self.sf(UC_ARM_REG_S0), self.sf(UC_ARM_REG_S1))); return self.ret()
        if addr == 0x13ecfc8: self.setsf(UC_ARM_REG_S0, math.asin(max(-1, min(1, self.sf(UC_ARM_REG_S0))))); return self.ret()
        if addr == 0x13ecc14: self.setsf(UC_ARM_REG_S0, math.sqrt(max(0, self.sf(UC_ARM_REG_S0)))); return self.ret()
        if addr in (0xb0968, 0xb09a4, 0xb09b0, 0xb0974, 0xb098c) and FRAMETEST[0]:
            F = self.sf(UC_ARM_REG_S0); mode = {0xb0974: 0, 0xb098c: 1, 0xb09b0: 0}.get(addr, mu.reg_read(UC_ARM_REG_R1))
            cur = self.frame; prev = cur - 1.0 if not getattr(self, 'fresh_now', False) else cur
            ok = (cur >= F) if mode == 1 else (prev < F <= cur or (prev == cur == F))
            return self.ret(1 if ok else 0)
        if addr == 0xbf52c:              # the reach test, its probe answered by the fixed ground (READ 0xbf5c8..0xbf618)
            S = self.rf(P + 0x1ac) * self.rf(P + 0x1b0)
            return self.ret(1 if self.rf(P + 0x44) <= self.rf(P + 0x5b4) + S * self.sf(UC_ARM_REG_S0) else 0)
        if addr == 0xb09c8:
            L = self.lens.get(self.motion, DEFLEN[0])
            return self.ret(1 if self.frame >= L else 0)
        if addr in (0xafe84, 0xafce8, 0xafe8c, 0xafef0):
            self.motion = mu.reg_read(UC_ARM_REG_R1); self.frame = self.sf(UC_ARM_REG_S1)
            self.wf(E + 0x500, self.frame); self.fresh = True
            self.log.append(('setMotion', hex(self.motion), self.frame)); return self.ret(0)
        if addr in (0x76c08, 0x7699c, 0x768c8, 0x75230):
            self.log.append(('call', hex(addr), mu.reg_read(UC_ARM_REG_R1), mu.reg_read(UC_ARM_REG_R2)))
            if addr == 0x7699c: self.ended = True
            return self.ret(0)
        if addr in STUBS:
            self.log.append(('stub', hex(addr))); return self.ret(RET1.get(addr, 0))
        if addr == 0xbc7f4:                     # posture setter: logged, then run natively (0 / 4 snap, 3 -> P+0x1cc)
            self.log.append(('posture', mu.reg_read(UC_ARM_REG_R1))); return
        if addr == 0xbc7f4 + 1:
            self.wb(P + 0x1ba, mu.reg_read(UC_ARM_REG_R1)); self.log.append(('posture', mu.reg_read(UC_ARM_REG_R1)))
            return self.ret(0)

    def call(self, fn, r0=E, args=()):
        mu = self.mu
        mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, r0)
        for reg, v in zip((UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args): mu.reg_write(reg, v)
        try: mu.emu_start(fn, RET, count=2_000_000)
        except Exception: print('FAULT pc %x lr %x' % (mu.reg_read(UC_ARM_REG_PC), mu.reg_read(UC_ARM_REG_LR)), [hex(a) for a in self.ring]); raise

    def step(self):
        self.wf(E + 0x500, self.frame)
        fresh = getattr(self, 'fresh', False); self.fresh = False; self.fresh_now = fresh
        self.wf(E + 0x13ac, self.frame if fresh else self.frame - 1.0); self.wf(E + 0x13b4, 0.0 if fresh else 1.0)
        for o in (0x1380, 0x1384, 0x1388, 0x138c): self.w(E + o, 0)     # 0xa50dc's reset (the zero vector)
        self.call(self.handler, args=ARGS)          # the action (the class's +0x24 pass)
        self.call(0xa5db8)               # posture 3 / P+0x5c -> the drawn offset e+0x1384 (0xae0d8)
        self.call(0xbf284)               # the engine's pin / clamp (0xa61dc's second call)
        y = self.rf(P + 0x44)
        self.frame += 1.0                # dt x speed
        return y


if __name__ == '__main__':
    h = int(sys.argv[1], 16); ph = int(sys.argv[2]); n = int(sys.argv[3])
    fo = float(sys.argv[4]) if len(sys.argv) > 4 else 500.0
    sz = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
    lens = {}
    for a in sys.argv[6:]:
        if a.startswith('ret='):
            for kv in a[4:].split(','): k, v = kv.split(':'); RET1[int(k, 16)] = int(v)
            continue
        if a.startswith('setf='):
            for kv in a[5:].split(','): k, v = kv.split(':'); SETF.append((int(k, 16), float(v)))
            continue
        if a == 'ftest': FRAMETEST[0] = True; continue
        if a.startswith('args='): ARGS.extend(int(x, 0) for x in a[5:].split(',')); continue
        if a.startswith('y0='): INIT['y0'] = float(a[3:]); continue
        if a.startswith('post='): INIT['posture'] = int(a[5:]); continue
        if a.startswith('deflen='): DEFLEN[0] = float(a[7:]); continue
        if a.startswith('stub='):
            STUBS.update(int(x, 16) for x in a[5:].split(','))
        if a.startswith('len='):
            for kv in a[4:].split(','):
                k, v = kv.split(':'); lens[int(k, 16)] = float(v)
    R = Run(h, ph, fo, sz, lens=lens, **INIT)
    R.wf(DTB + 0x64, 1.0)
    for k, v in SETF: R.wf(E + k, v)
    R.ended = False
    for k in range(n):
        y = R.step()
        print('step %3d  motion %s frame %5.1f  posture %d phase %d  P+0x44 %8.2f  above ground %8.2f  vy %7.2f  e1384 %8.2f  P5c %8.2f  drawn %8.2f' % (
            k, hex(R.motion) if R.motion is not None else '-', R.frame - 1, R.rb(P + 0x1ba), R.rb(P + 0x1a1), y,
            y - R.rf(P + 0x5b4), R.rf(P + 0x14), R.rf(E + 0x1384), R.rf(P + 0x5c), y + R.rf(E + 0x1384) - R.rf(P + 0x5b4)))
        while R.log: print('   ', R.log.pop(0))
        if R.ended: break
