"""uEm037_00 status-7 action tracer (Silverwind, variant byte 4) under unicorn.
Runs the class's own code (band 0xe46f28..0xe59014) natively; everything else is a logged stub returning r0 = 0, except:
  setMotion 0xafce8 / 0xafe84 / 0xafe8c / 0xafef0 -> motion id at e+0x4b4, frame = start (s1)
  the frame test 0x72714(e, mode, chan, r3, s0 = F, s1) on the simulated (prev, cur) of the motion
  the end test 0x94dc04 -> cur >= LEN[motion] (or 240 frames)
  tune getters 0x6f618 / 0x6f62c / 0x6f640 -> em037_04_actiontune.fup
  allocators 0x3f883c / 0x422bac / 0x3fa2bc / 0x42459c -> fresh zeroed buffers; 0x48b884 logs the setup (shell id, mode, +0x10..)
  set action 0x768c8 / 0x75230 / vt+0x3dc -> logged; the trace follows a status-7 chain.
python trace.py n [frames] [opts]   opts: k=v pairs written as bytes/words into E/P (e.g. P+0x1a1=..)."""
import sys, os, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, shellef
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
T = armdis.TEXT
E, P, BUF, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000
LO, HI = 0xe46f28, 0xe59014
TUNE = shellef.fup(open(r'C:\MHGU-Extract\scratch-em\em037_04\enemy\action_tune\em037_04_actiontune.fup', 'rb').read())
LEN = {}
pg = lambda n: (n + 0xfff) & ~0xfff


class Tr:
    def __init__(self, n, frames=400, variant=4, extra=None, lens=None, quiet=False, ret=None):
        self.mu = mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
        mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
        mu.mem_map(0, pg(len(T))); mu.mem_write(0, T)
        mu.mem_map(armdis.RO_VA & ~0xfff, pg(armdis.RO_VA + len(armdis.RODATA) - (armdis.RO_VA & ~0xfff)))
        mu.mem_write(armdis.RO_VA, armdis.RODATA)
        mu.mem_map(armdis.DA_VA, 0x2400000 - armdis.DA_VA); mu.mem_write(armdis.DA_VA, armdis.DATA)
        mu.mem_map(E, 0x100000); mu.mem_map(P, 0x100000); mu.mem_map(BUF, 0x100000)
        mu.mem_map(STK - 0x20000, 0x40000); mu.mem_map(RET, 0x1000)
        mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
        mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
        self.w = lambda a, v: mu.mem_write(a, struct.pack('<I', v & 0xffffffff))
        self.wb = lambda a, v: mu.mem_write(a, bytes([v & 0xff]))
        self.w(E + 0x1428, P)
        self.w(E + 0x75f0, BUF + 0xf0000); self.w(BUF + 0xf0000 + 0x64, BUF + 0xf8000)   # the dtb block: zeros
        self.wb(E + 0xb5f4, 37); self.wb(E + 0xb5f5, variant)
        self.wb(E + 0x73e0, 7); self.wb(E + 0x73e1, n)
        self.w(E + 0xcc94, 0xca if variant == 4 else 0xc8); self.w(E + 0xcc98, 0xcb if variant == 4 else 0xc9)
        self.w(E, 0x17bc47c)                               # the uEm037_00 vtable (vt+0x3dc etc. are stubs below)
        for k, v in (extra or {}).items():
            base = E if k[0] == 'E' else P
            off = int(k[2:], 16)
            if isinstance(v, float): mu.mem_write(base + off, struct.pack('<f', v))
            elif v > 0xff or v < 0: self.w(base + off, v)
            else: self.wb(base + off, v)
        self.ret = ret or {}
        vt = 0x17bc47c; self.ends = set()
        self.vt3dc = struct.unpack_from('<I', armdis.DATA, vt + 0x3dc - armdis.DA_VA)[0]
        self.lens = lens or {}
        self.n = n; self.frames = frames; self.quiet = quiet
        self.motion = None; self.prev = 0.0; self.cur = 0.0; self.step = 0
        self.log = []; self.nbuf = 0; self.next = None; self.ended = False
        mu.hook_add(UC_HOOK_CODE, self._hook)

    def f(self, reg): return struct.unpack('<f', struct.pack('<I', self.mu.reg_read(reg)))[0]
    def setf(self, reg, v): self.mu.reg_write(reg, struct.unpack('<I', struct.pack('<f', v))[0])
    def ev(self, *a):
        self.log.append((self.step, self.motion, round(self.cur, 3)) + a)

    def _hook(self, uc, addr, size, ud):
        if RET <= addr < RET + 0x1000: return
        if addr == getattr(self, 'vt3dc', -1): self.ev('vt+0x3dc (action over)'); self.stop = True
        if LO <= addr < HI or 0x7c3a38 <= addr < 0x7c3b40 or 0xb0944 <= addr < 0xb09d0: return
        r = [uc.reg_read(x) for x in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
        lr = uc.reg_read(UC_ARM_REG_LR); ret = 0
        if addr in (0xafce8, 0xafe84, 0xafe8c, 0xafef0):
            m = r[1] & 0xffff
            st = self.f(UC_ARM_REG_S1) if addr in (0xafe84, 0xafce8) else 0.0
            self.ev('setMotion', hex(addr), 'L%d M%d' % (m >> 8, m & 0xff), 'blend %g start %g' % (self.f(UC_ARM_REG_S0), st), 'lr %#x' % lr)
            self.motion = 'L%d M%d' % (m >> 8, m & 0xff); self.w(E + 0x4b4, m)
            mu = uc; mu.mem_write(E + 0x4b4, struct.pack('<H', m))
            self.prev = self.cur = st; self.fresh = True
        elif addr == 0x72714:
            F = self.f(UC_ARM_REG_S0); mode = r[1]
            if mode == 0: ok = (self.prev < F <= self.cur) and not self.fresh
            elif mode == 1: ok = self.cur >= F
            elif mode == 2: ok = self.cur <= F
            else: ok = None
            ret = 1 if ok else 0
            if not self.quiet or ok: self.ev('test', 'mode %d chan %d r3 %d F %g s1 %g' % (mode, r[2], r[3], F, self.f(UC_ARM_REG_S1)), ret, 'lr %#x' % lr)
        elif addr == 0x94dc04:
            L = self.lens.get(self.motion, 240)
            ret = 1 if self.cur >= L - 1 else 0
            if ret: self.ev('end', 'lr %#x' % lr)
        elif addr in (0x6f618, 0x6f62c, 0x6f640):
            i = r[1]
            if addr == 0x6f618:
                v = TUNE['floats'][i] if i < len(TUNE['floats']) else 0.0; self.setf(UC_ARM_REG_S0, v)
                self.ev('tuneF', i, v, 'lr %#x' % lr)
            elif addr == 0x6f62c:
                ret = TUNE['ints'][i] if i < len(TUNE['ints']) else 0; self.ev('tuneI', i, ret)
            else: self.ev('tuneV', i)
        elif addr in (0x3f883c, 0x422bac, 0x3fa2bc, 0x42459c, 0x41e158, 0x413858):
            ret = BUF + 0x1000 * self.nbuf; self.nbuf += 1
            uc.mem_write(ret, b'\0' * 0x100)
        elif addr == 0x48b884:
            q = r[1]
            sid, mode, own = struct.unpack('<III', uc.mem_read(q + 4, 12))
            body = uc.mem_read(q + 0x10, 0x30)
            fl = struct.unpack('<3f', body[:12]); ws = struct.unpack('<3I', body[0x10:0x1c])
            self.ev('CREATE', 'id %#x mode %d' % (sid, mode), 'owner %s' % ('E' if own == E else hex(own)),
                    '+10 %s' % (fl,), '+20 %s' % ([hex(x) for x in ws],), '+2c %s' % body[0x1c:0x20].hex(), 'lr %#x' % lr)
        elif addr in (0x768c8, 0x75230, 0x7699c, 0x76a40):
            self.ev('ACTION', hex(addr), r[1], hex(r[2]), 'lr %#x' % lr)
            if addr == 0x768c8: self.next = (r[1], r[2])
            else: self.stop = True
        elif addr == 0xe8dead:
            pass
        else:
            if addr in self.ret: ret = self.ret[addr]
            if not self.quiet: self.ev('stub', hex(addr), 'r1 %#x r2 %#x' % (r[1], r[2]), 'lr %#x' % lr)
            if lr in self.ends: self.ev('action end (vt call)', hex(addr), 'lr %#x' % lr); self.stop = True
        uc.reg_write(UC_ARM_REG_R0, ret)
        uc.reg_write(UC_ARM_REG_PC, lr)

    def call(self, fn, *args):
        mu = self.mu
        mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
        for i, a in enumerate(args): mu.reg_write((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)[i], a)
        try: mu.emu_start(fn, RET, count=3000000)
        except Exception as ex:
            self.ev('FAULT', str(ex), 'pc %#x' % mu.reg_read(UC_ARM_REG_PC), 'lr %#x' % mu.reg_read(UC_ARM_REG_LR)); self.stop = True

    def run(self):
        self.stop = False
        for self.step in range(self.frames):
            self.fresh = False
            if self.stop: break
            self.call(0xe4fe74, E)
            # vt+0x3dc (the action's end) is a stub: detect via the log
            if any(x[3] == 'stub' and x[4] == '0x3dc' for x in self.log if len(x) > 4): pass
            if self.next:
                st, nb = self.next; self.next = None
                if st != 7: self.ev('chain leaves status 7', st, hex(nb)); break
                self.wb(E + 0x73e1, nb)
                self.mu.mem_write(P + 0x1a0, b'\0' * 4)
                self.ev('chain ->', hex(nb))
            if not self.fresh: self.prev = self.cur; self.cur += 1.0
            else: self.prev = self.cur
        return self.log


if __name__ == '__main__':
    n = int(sys.argv[1], 16); frames = int(sys.argv[2]) if len(sys.argv) > 2 else 300
    extra = {}
    for kv in sys.argv[3:]:
        k, v = kv.split('='); extra[k] = float(v) if '.' in v else int(v, 0)
    t = Tr(n, frames, extra=extra, quiet='-q' in os.environ.get('TRQ', ''))
    for x in t.run():
        print(' '.join(str(y) for y in x))
