"""psl-mask.js CLASS_MASK.em021_00 against uEm021_00 vt+0x13c = 0xdd7cf4 under unicorn, every call native (0xca170, 0xb0944,
vt+0x3f4 = 0x7fed4, 0x81bb0 -> 0xa1f0c), over motion x action x ctl[0] (item) x ctl[1] (gas) x e+0x4b4 x P+0x522 x rage x tired."""
import os, struct, json, itertools, subprocess
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read(); RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, CTL, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000
VT = 0x17afde4
HERE = os.path.dirname(os.path.abspath(__file__))
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(CTL, 0x1000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
FN = struct.unpack_from('<I', DATA, VT + 0x13c - DA_VA)[0]; assert FN == 0xdd7cf4


def rom(motion, action, item, gas, m4b4, sleep, rage, tired):
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000); mu.mem_write(CTL, b'\0' * 0x1000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', CTL))
    st, nb = action if action else (0, 0)
    mu.mem_write(E + 0x73e0, bytes([st, nb])); mu.mem_write(CTL, bytes([item, gas])); mu.mem_write(E + 0x4b4, struct.pack('<H', m4b4))
    mu.mem_write(P + 0x522, bytes([sleep])); mu.mem_write(P + 0x518, bytes([rage])); mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.emu_start(FN, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


MOT = [0x001, 0x019, 0x01c, 0x02b, 0x201, 0x202, 0x203, 0x210, 0x30e, 0x30f, 0x310]
ACT = [None, (1, 9), (1, 8), (1, 0x0b), (1, 0x0c), (1, 0x0d), (1, 0x0e), (1, 0x35), (1, 0x36), (1, 0x37), (1, 0x38), (1, 0x39), (1, 0x3a),
       (7, 0), (7, 1), (7, 2), (7, 0x45), (11, 0), (11, 7), (14, 0), (12, 0xff), (12, 1), (10, 0x63), (10, 0x65), (7, 0x0b)]
cases = []
for m, a, it, g, mb, sl, rg, td in itertools.product(MOT, ACT, range(0, 8), range(0, 6), (0x19, 0x1), (0, 1), (0, 1), (0, 1)):
    if m not in (0x019, 0x02b, 0x210) and (it > 1 or g > 1): continue
    if m != 0x019 and mb != 0x19: continue
    cases.append((m, a, it, g, mb, sl, rg, td))
js_in = [dict(motion=c[0], action=list(c[1]) if c[1] else None,
              state=dict(item=c[2], gas=c[3], motionIs19=c[4] == 0x19, asleep=bool(c[5]), rage=bool(c[6]), tired=bool(c[7]))) for c in cases]
open(os.path.join(HERE, 'js021_in.json'), 'w').write(json.dumps(js_in))
out = subprocess.run(['node', '--input-type=module', '-e', """
import fs from 'fs'; import { pslMask } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const cs = JSON.parse(fs.readFileSync('js021_in.json', 'utf8'));
fs.writeFileSync('js021_out.json', JSON.stringify(cs.map(c => pslMask('em021_00', String(c.motion >> 8), c.motion & 0xff, c.action, c.state))));
"""], capture_output=True, text=True, cwd=HERE)
if out.returncode: print(out.stderr); raise SystemExit(1)
jsw = json.load(open(os.path.join(HERE, 'js021_out.json')))
bad = 0
for c, j in zip(cases, jsw):
    r = rom(*c)
    if r != j:
        bad += 1
        if bad <= 20: print('MISMATCH', c, hex(r), hex(j))
print('%d runs, %d mismatches' % (len(cases), bad))
