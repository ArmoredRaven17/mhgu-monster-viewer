"""goretrace.py: every call of the Gore line's slot filler 0xfc05ec under the action main, per action / phase / gates, with its
arguments (slot k, point, vec, s0, s1, byte, flag), the motion then, and the frame float of the last frame test before it.
   CLS=uEm071_00 EM=71 python goretrace.py <variant> [statuses]"""
import sys, struct, os
import tracec as TR
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3, UC_ARM_REG_SP, UC_ARM_REG_S0, UC_ARM_REG_S1, UC_ARM_REG_LR
var = int(sys.argv[1], 0)
STS = [int(x, 0) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else list(range(0x12))
EV = []; LAST = {'f': None, 'site': None}
f32 = lambda b: struct.unpack('<f', b)[0]
def sreg(uc, r): return struct.unpack('<f', struct.pack('<I', uc.reg_read(r) & 0xffffffff))[0]
def hk(uc, addr, size, ud):
    if addr in (0xb0974, 0xb0968, 0xb09a4):
        LAST['f'] = round(sreg(uc, UC_ARM_REG_S0), 3); LAST['site'] = uc.reg_read(UC_ARM_REG_LR) - 4
    elif addr == 0xfc05ec:
        r2, r3, sp = uc.reg_read(UC_ARM_REG_R2), uc.reg_read(UC_ARM_REG_R3), uc.reg_read(UC_ARM_REG_SP)
        pt = struct.unpack('<3f', uc.mem_read(r2, 12)); vec = struct.unpack('<3f', uc.mem_read(r3, 12))
        b, fl = struct.unpack('<II', uc.mem_read(sp, 8))
        mot = struct.unpack('<H', uc.mem_read(TR.E + 0x4b4, 2))[0]
        EV.append((uc.reg_read(UC_ARM_REG_LR) - 4, uc.reg_read(UC_ARM_REG_R1), tuple(round(x, 2) for x in pt), tuple(round(x, 3) for x in vec),
                   round(sreg(uc, UC_ARM_REG_S0), 3), round(sreg(uc, UC_ARM_REG_S1), 3), b & 0xff, fl, mot, LAST['f']))
for a in (0xb0974, 0xb0968, 0xb09a4, 0xfc05ec): TR.mu.hook_add(UC_HOOK_CODE, hk, begin=a, end=a)
import math
def trig(uc, addr, size, ud):                      # sinf / cosf answered (the tracer answers every outside call with 0)
    x = sreg(uc, UC_ARM_REG_S0); v = math.sin(x) if addr == 0x13ecc20 else math.cos(x)
    uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', v))[0])
for a in (0x13ecc20, 0x13ecc2c): TR.mu.hook_add(UC_HOOK_CODE, trig, begin=a, end=a)
# PRESETS written after the tracer's zero fill, before each run: YAW (u16 at P+0x54), PX/PY/PZ (P+0x40..), CTL='off:type:val,...' (C+off)
_orig = TR.mu.emu_start
def _pre(*a, **k):
    if os.environ.get('YAW'): TR.mu.mem_write(TR.P + 0x54, struct.pack('<H', int(os.environ['YAW'], 0) & 0xffff))
    if os.environ.get('PX'): TR.mu.mem_write(TR.P + 0x40, struct.pack('<3f', float(os.environ['PX']), float(os.environ.get('PY', '0')), float(os.environ.get('PZ', '0'))))
    for item in filter(None, os.environ.get('CTL', '').split(',')):
        off, ty, val = item.split(':'); off = int(off, 0)
        TR.mu.mem_write(TR.C + off, struct.pack('<f', float(val)) if ty == 'f' else bytes([int(val, 0) & 0xff]))
    return _orig(*a, **k)
TR.mu.emu_start = _pre
print('# %s 0xfc05ec calls' % os.environ.get('CLS'))
for st in STS:
    for n in range(0x100):
        got = {}
        for rage in (0, 1):
          for tired in (0, 1):
            os.environ['RAGE'] = str(rage); os.environ['TIRED'] = str(tired)
            for ph in range(6):
              for e in (0, 1):
                for fr in (0, 1):
                    EV.clear(); LAST['f'] = None
                    TR.run(var, st, n, ph, e, fr, 0, follows=1)
                    for x in EV:
                        if x[0] not in got: got[x[0]] = (ph, e, fr) + x[1:] + (rage, tired)
        for site, v in sorted(got.items()):
            ph, e, fr, k, pt, vec, s0, s1, b, fl, mot, lf, rage, tired = v
            print('(%d, %#x) site %#x phase %d ended %d frame %d  k=%d pt=%s vec=%s s0=%g s1=%g byte=%d flag=%d  motion L%d M%d  lastframe %s rage %d tired %d' % (
                st, n, site, ph, e, fr, k, pt, vec, s0, s1, b, fl, (mot >> 8) & 0xf, mot & 0xff, lf, rage, tired), flush=True)
