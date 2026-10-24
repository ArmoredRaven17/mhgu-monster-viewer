"""words057.mjs (the em057 transcription) against uEm057_00 vt+0x13c = 0xf0279c under unicorn, every combination of
variant x motion x action x charged (P+0x5df3, read by 0x816d4) x rage (P+0x518) x tired (P+0x505) x quest rank (the chain
behind 0x3a8430: GOT 0x1831c54 -> 0x1883c70 -> obj, [obj+0xa4] -> R, signed byte R+0xf) x e+0xb5f8 x e+0xcb14.
Every call runs natively (0xca170, 0x816d4, 0x6fe88, 0x3a8430, 0x81670, 0x81614). e+0x13f4 is zeroed first (setMotion 0x7256c).
   python jscheck057.py [--quick]"""
import sys, os, struct, json, itertools, subprocess
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, STK, RET, QO, QR = 0x40000000, 0x40100000, 0x50000000, 0x60000000, 0x40202000, 0x40203000
QGLOB = 0x1883c70
VT = 0x17ca8ec
HERE = os.path.dirname(os.path.abspath(__file__))
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
mu.mem_map(QO, 0x2000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
FN = struct.unpack_from('<I', DATA, VT + 0x13c - DA_VA)[0]
assert FN == 0xf0279c, hex(FN)


def rom(variant, motion, action, charged, rage, tired, rank, b5f8, cb14):
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    st, nb = action if action else (0, 0)
    mu.mem_write(E + 0x73e0, bytes([st, nb])); mu.mem_write(E + 0xb5f5, bytes([variant]))
    mu.mem_write(E + 0xb5f8, bytes([b5f8])); mu.mem_write(E + 0xcb14, bytes([cb14]))
    mu.mem_write(P + 0x5df3, bytes([charged])); mu.mem_write(P + 0x518, bytes([rage]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.mem_write(QGLOB, struct.pack('<I', QO)); mu.mem_write(QO + 0xa4, struct.pack('<I', QR))
    mu.mem_write(QR + 0xf, struct.pack('<b', rank))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.emu_start(FN, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


MOT = [0x001, 0x00a, 0x014, 0x018, 0x019, 0x200, 0x201, 0x202, 0x203, 0x20f, 0x212, 0x218, 0x219, 0x21a, 0x225, 0x226,
       0x227, 0x228, 0x229, 0x22a, 0x22b, 0x22c, 0x239, 0x23a, 0x23b, 0x23d, 0x23f, 0x240, 0x30c, 0x30d, 0x314, 0x315,
       0x316, 0x902]
ACT = [None, (1, 4), (1, 0x15), (1, 5), (1, 9), (1, 0x22), (1, 0x26), (1, 2), (1, 0x25), (1, 0x2d), (7, 0x5e), (7, 0x71),
       (7, 0x72), (7, 0x73), (7, 0x70), (7, 0x74), (7, 0x5f), (7, 0xfb), (7, 0xfc), (7, 0xfa), (7, 0xfd), (7, 0xe9),
       (7, 0xa2), (11, 0), (11, 7), (10, 0x2a), (2, 4), (13, 0x71)]
quick = '--quick' in sys.argv
RANKS = (0, 1, 3, 5) if not quick else (5,)
cases = []
for v, m, a, ch, rg, td, rk, b, cb in itertools.product((0, 4), MOT, ACT, (0, 1), (0, 1), (0, 1), RANKS, (0, 5, 9), (0, 1)):
    if b == 5 and m not in (0x201, 0x202, 0x22b): continue
    cases.append((v, m, a, ch, rg, td, rk, b, cb))
js_in = [dict(v4=c[0] == 4, motion=c[1], action=list(c[2]) if c[2] else None,
              state=dict(charged=bool(c[3]), rage=bool(c[4]), tired=bool(c[5]), rank={0: 0, 1: 1, 3: 3, 5: 5}[c[6]],
                         b5f8=c[7], diedCharged=bool(c[8]))) for c in cases]
open(os.path.join(HERE, 'js_in.json'), 'w').write(json.dumps(js_in))
out = subprocess.run(['node', '--input-type=module', '-e', """
import fs from 'fs'; import { em057, word } from './words057.mjs';
import { CLASS_MASK } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const cs = JSON.parse(fs.readFileSync('js_in.json', 'utf8'));
const LIVE = process.env.LIVE === '1';
const Z0 = LIVE ? CLASS_MASK.em057_00 : em057(false), Z4 = LIVE ? CLASS_MASK.em057_04 : em057(true);
fs.writeFileSync('js_out.json', JSON.stringify(cs.map(c => word(c.v4 ? Z4 : Z0, c.motion, c.action, c.state))));
"""], capture_output=True, text=True, cwd=HERE)
if out.returncode: print(out.stderr); sys.exit(1)
jsw = json.load(open(os.path.join(HERE, 'js_out.json')))
bad = 0
seen = {}
for c, j in zip(cases, jsw):
    r = rom(*c)
    seen.setdefault((c[0], c[1]), set()).add(r)
    if r != j:
        bad += 1
        if bad <= 25: print('MISMATCH v%d m%#x a%s ch%d rg%d td%d rk%d b%d cb%d rom %#x js %#x' % (c + (r, j)))
print('%d runs, %d mismatches' % (len(cases), bad))
if '--words' in sys.argv:
    for k in sorted(seen): print('v%d %#05x' % k, ' '.join('%#x' % w for w in sorted(seen[k])))
