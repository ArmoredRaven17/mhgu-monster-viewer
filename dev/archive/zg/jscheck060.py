"""psl-mask.js CLASS_MASK.em022_00 against uEm022_00 vt+0x13c = 0xdda5ac: every call native except 0xbf62c (MoguriBaseOfs,
answered -500.0 as his .dtb holds), the .dtp array A from the real file at [[e+0x75f0]+0x64], the break level of part 0 at
P+0x3bc, the rank chain of 0x3a8430. motion x posture x P+0x5c x fang level x rank x rage x tired."""
import os, struct, json, itertools, subprocess
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read(); RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, STK, RET, RES, ARR, QO, QR = 0x40000000, 0x40100000, 0x50000000, 0x60000000, 0x40200000, 0x40201000, 0x40202000, 0x40203000
VT = 0x17d52f8
DTP = open(r'C:\MHGU-Extract\scratch-em\em022_00\enemy\dt_base\em022_00_dtbparts.dtp', 'rb').read()
A = DTP[0x4d:0x4d + 4 * DTP[8]]
HERE = os.path.dirname(os.path.abspath(__file__))
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(RES, 0x4000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
def hook(uc, addr, size, ud):
    uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', -500.0))[0]); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hook, begin=0xbf62c, end=0xbf62c)
FN = struct.unpack_from('<I', DATA, VT + 0x13c - DA_VA)[0]; assert FN == 0xf1911c, hex(FN)


def rom(motion, posture, p5c, em, rank, rage, tired, var, cb):
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x75f0, struct.pack('<I', RES)); mu.mem_write(RES + 0x64, struct.pack('<I', ARR)); mu.mem_write(ARR, A)
    mu.mem_write(0x1883c70, struct.pack('<I', QO)); mu.mem_write(QO + 0xa4, struct.pack('<I', QR)); mu.mem_write(QR + 0xf, struct.pack('<b', rank))
    mu.mem_write(P + 0x1ba, bytes([posture])); mu.mem_write(P + 0x5c, struct.pack('<f', p5c)); mu.mem_write(E + 0xb5f4, bytes([em, var])); mu.mem_write(E + 0xcaee, bytes([cb]))
    mu.mem_write(P + 0x518, bytes([rage])); mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.emu_start(FN, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


MOT = [0, 1, 2, 4, 8, 9, 0xa, 0xd, 0x11, 0x12, 0x901, 0x902, 0x201]
cases = [c for c in itertools.product(MOT, ((0, 0.0), (4, 0.0), (4, -500.0), (4, -460.0), (0, -500.0)), (0x3c, 0x3e), (0, 3, 5), (0, 1), (0, 1), (0, 4), (0, 1)) if c[7] == (1 if c[3] > 4 else 0)]
js_in = [dict(mon=('em060_04' if (em == 0x3c and var == 4) else 'em060_00'), motion=m, state=dict(sunk=(pp[0] == 4 and pp[1] < -450.0), rank=rk, rage=bool(rg), tired=bool(td)))
         for (m, pp, em, rk, rg, td, var, cb) in cases]
open(os.path.join(HERE, 'js060_in.json'), 'w').write(json.dumps(js_in))
out = subprocess.run(['node', '--input-type=module', '-e', """
import fs from 'fs'; import { pslMask } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const cs = JSON.parse(fs.readFileSync('js060_in.json', 'utf8'));
fs.writeFileSync('js060_out.json', JSON.stringify(cs.map(c => pslMask(c.mon, String(c.motion >> 8), c.motion & 0xff, null, c.state))));
"""], capture_output=True, text=True, cwd=HERE)
if out.returncode: print(out.stderr); raise SystemExit(1)
jsw = json.load(open(os.path.join(HERE, 'js060_out.json')))
bad = 0
for c, j in zip(cases, jsw):
    r = rom(c[0], c[1][0], c[1][1], *c[2:])
    if r != j:
        bad += 1
        if bad <= 20: print('MISMATCH', c, hex(r), hex(j))
print('A row 0:', list(A[:4]), '; %d runs, %d mismatches' % (len(cases), bad))
