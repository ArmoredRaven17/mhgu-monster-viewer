# emu49.py -- (7, 0x49) 0xd8716c phase 1 under trgen's unicorn model, sinf / cosf / atan2f / sqrtf (0x13ecc20 / 0x13ecc2c / 0x13ecba8 /
# 0x13ecc14) answered in float32, 0xc164c(e, gid, out) answered with a chosen joint point; logs the joint gid asked, the [e+0xcac0]+0
# word and the create (id, mode, +0x10.., +0x20..). Prints JSON cases for replay49.mjs.
import sys, os, struct, json, math
os.environ['FB_CLASS'] = 'uEm013_00'; os.environ['FB_MON'] = 'em013_02'
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fb'))
sys.argv = ['x']
import trgen as T
import numpy as np
from unicorn.arm_const import *
f32 = lambda x: float(np.float32(x))
def sreg(r): return struct.unpack('<f', struct.pack('<I', T.mu.reg_read(r) & 0xffffffff))[0]
def wreg(r, v): T.mu.reg_write(r, struct.unpack('<I', struct.pack('<f', f32(v)))[0])
J = [0.0, 0.0, 0.0]; LOG = []
def h(uc, addr, size, ud):
    if addr == 0x13ecc20: wreg(UC_ARM_REG_S0, math.sin(sreg(UC_ARM_REG_S0)))
    elif addr == 0x13ecc2c: wreg(UC_ARM_REG_S0, math.cos(sreg(UC_ARM_REG_S0)))
    elif addr == 0x13ecba8: wreg(UC_ARM_REG_S0, math.atan2(sreg(UC_ARM_REG_S0), sreg(UC_ARM_REG_S1)))
    elif addr == 0x13ecc14: wreg(UC_ARM_REG_S0, math.sqrt(sreg(UC_ARM_REG_S0)))
    elif addr == 0xc164c:
        LOG.append(('joint', uc.reg_read(UC_ARM_REG_R1)))
        uc.mem_write(uc.reg_read(UC_ARM_REG_R2), struct.pack('<3f', *J))
for a in (0x13ecc20, 0x13ecc2c, 0x13ecba8, 0x13ecc14, 0xc164c): T.mu.hook_add(T.UC_HOOK_CODE, h, begin=a, end=a)
P = T.P
CASES = [
  dict(words=[0, 0, 0], joint=[0.0, 600.0, 400.0], target=[0.0, 0.0, 3000.0]),
  dict(words=[0, 0x2000, 0], joint=[10.0, 650.0, 380.0], target=[1500.0, 50.0, 2200.0]),
  dict(words=[0x300, 0xc000, 0x100], joint=[-200.0, 700.0, 100.0], target=[-2500.0, 0.0, 300.0]),
  dict(words=[0, 0, 0], joint=[0.0, 600.0, 400.0], target=[0.0, 0.0, 1200.0]),      # A behind the point -> back half -> 0x2000
  dict(words=[0, 0, 0], joint=[0.0, 600.0, 400.0], target=[0.0, 1600.0, 4000.0]),    # A above -> negative pitch -> 0x2000
  dict(words=[0, 0x8000, 0], joint=[0.0, 900.0, -300.0], target=[300.0, 0.0, -6000.0]),
  dict(words=[0x10000 - 0x400, 0x5000, 0], joint=[100.0, 800.0, 0.0], target=[5000.0, 100.0, 2000.0]),
]
out = []
for c in CASES:
    J[:] = c['joint']; LOG.clear()
    poke = {P + 0x50: struct.pack('<3I', *c['words']), P + 0x1d0: struct.pack('<3f', *c['target'])}
    r = T.run(7, 0x49, 1, 2, 0, fn=0xd8716c, frame2=1, poke=poke)
    cac = struct.unpack('<I', bytes(T.mu.mem_read(T.C, 4)))[0]
    cr = [e for e in r.get('ev', []) if e[0] == 'create']
    out.append(dict(c, joints=[l[1] for l in LOG], cac0=cac, creates=[[e[1], e[2], e[3], e[4]] for e in cr],
                    b5f8=T.mu.mem_read(T.E + 0xb5f8, 1)[0], end=r.get('end')))
# the phase-0 run and a non-firing phase-1 run (the controls: phase 0 sets L2 M25 and phase 1; no create without the frame)
r0 = T.run(7, 0x49, 0, 2, 0, fn=0xd8716c)
r1 = T.run(7, 0x49, 1, 2, 0, fn=0xd8716c, frame2=0)
out.append({'phase0': [e for e in r0.get('ev', []) if e[0] in ('mot', 'create')], 'phase1_nofire': [e for e in r1.get('ev', []) if e[0] in ('create', 'ftest2')]})
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'emu49.json'), 'w'), indent=1)
for o in out: print(o)
