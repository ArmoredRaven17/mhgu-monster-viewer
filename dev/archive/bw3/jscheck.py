"""The transcriptions in words.mjs against the ROM under unicorn, every combination.  python jscheck.py 063 | 080"""
import sys, os, struct, json, itertools, subprocess
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, CTL, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(CTL, 0x1000)
mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)


def hook(uc, addr, size, ud):
    if addr == 0xbf62c:
        uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', -1500.0))[0])
        uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hook, begin=0xbf62c, end=0xbf630)


def rom(vt, motion, action, sever, rage, tired, variant=0, rowL=0, rowR=0, posture=0, p5c=0.0, heat=0):
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000); mu.mem_write(CTL, b'\0' * 0x1000)
    mu.mem_write(E, struct.pack('<I', vt)); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcacc, struct.pack('<I', CTL))
    st, nb = action if action else (0, 0)
    mu.mem_write(E + 0x73e0, bytes([st, nb])); mu.mem_write(E + 0xb5f5, bytes([variant]))
    mu.mem_write(CTL + 0x20, struct.pack('<H', rowL)); mu.mem_write(CTL + 0x2c, struct.pack('<H', rowR))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever)); mu.mem_write(P + 0x518, bytes([rage]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0])); mu.mem_write(P + 0x1ba, bytes([posture]))
    mu.mem_write(P + 0x1bb, bytes([heat])); mu.mem_write(P + 0x5c, struct.pack('<f', p5c))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


which = sys.argv[1]
cases = []
STATES = [(0, 0), (1, 0), (0, 1), (1, 1)]
if which == '063':
    MOT = [0x22a, 0x229, 0x00a, 0x205, 0x208, 0x20b, 0x20d, 0x215, 0x001, 0x30a, 0x90a]
    ACT = [None, (7, 8), (7, 9), (7, 0x14), (7, 0x15), (7, 0x98), (7, 0xa0), (7, 0xa1), (7, 0xa2), (7, 0xa3), (7, 0xa5),
           (7, 0xa6), (7, 0xaf), (7, 0xb0), (7, 0xb1), (7, 0xb2), (2, 8), (2, 9), (1, 0x14), (7, 0x10), (7, 0x30)]
    for m, a, (rg, td), sv, var, rl, rr in itertools.product(MOT, ACT, STATES, (0, 1), (0, 5), range(5), range(5)):
        if m != 0x22a and m != 0x229 and a not in (None, (7, 8), (7, 9)): continue
        if rl not in (0, 2, 3) and rr not in (0, 2, 3) and m != 0x205: continue
        for pos, p5c in ((0, 0.0), (4, 0.0), (4, -2000.0)) if m == 0x00a else ((0, 0.0),):
            cases.append(dict(vt=0x17d92c4, motion=m, action=a, sever=sv, rage=rg, tired=td, variant=var, rowL=rl, rowR=rr,
                              posture=pos, p5c=p5c,
                              js=dict(severed=bool(sv), rage=bool(rg), tired=bool(td), armEmpty=[rl in (0, 3), rr in (0, 3)],
                                      sunk=(pos == 4 and p5c < -1350.0), v0=(var == 0))))
else:
    MOT = [0x205, 0x20d, 0x20e, 0x224, 0x237, 0x006, 0x40b, 0x90a, 0x317]
    for m, (rg, td), sv, var, h in itertools.product(MOT, STATES, (0, 1), (0, 4), range(32)):
        cases.append(dict(vt=0x17eac74, motion=m, action=(7, 8), sever=sv, rage=rg, tired=td, variant=var, heat=h,
                          js=dict(rage=bool(rg), tired=bool(td), heat=h, severed=bool(sv))))
js_in = [dict(cls=which, motion=c['motion'], action=list(c['action']) if c['action'] else None, state=c['js']) for c in cases]
open('js_in.json', 'w').write(json.dumps(js_in))
out = subprocess.run(['node', '--input-type=module', '-e', """
import fs from 'fs'; import { em063, em080, word } from './words.mjs';
const cs = JSON.parse(fs.readFileSync('js_in.json', 'utf8'));
const res = cs.map(c => word(c.cls === '063' ? em063(c.state.v0) : em080, c.motion, c.action, c.state));
fs.writeFileSync('js_out.json', JSON.stringify(res));
"""], capture_output=True, text=True)
if out.returncode: print(out.stderr); sys.exit(1)
jsw = json.load(open('js_out.json'))
bad = 0
for c, j in zip(cases, jsw):
    kw = {k: c[k] for k in ('sever', 'rage', 'tired', 'variant') }
    for k in ('rowL', 'rowR', 'posture', 'p5c', 'heat'):
        if k in c: kw[k] = c[k]
    r = rom(c['vt'], c['motion'], c['action'], **kw)
    if r != j:
        bad += 1
        if bad <= 20: print('MISMATCH', {k: v for k, v in c.items() if k != 'js'}, hex(r), hex(j))
print('%s: %d runs, %d mismatches' % (which, len(cases), bad))
