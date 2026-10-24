"""generic: a class's vt+0x13c (all calls native) against psl-mask.js pslMask(mon) over motions x actions x rage x tired.
   python jscheckgen.py <vtable hex> <mon> <motions hex,...> [statuses]"""
import os, sys, struct, json, itertools, subprocess
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read(); RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, CTL, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000
VT = int(sys.argv[1], 16); MON = sys.argv[2]; MOT = [int(x, 16) for x in sys.argv[3].split(',')]
STS = [int(x, 0) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else [1, 7, 10]
HERE = os.path.dirname(os.path.abspath(__file__))
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(CTL, 0x1000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
FN = struct.unpack_from('<I', DATA, VT + 0x13c - DA_VA)[0]
def rom(motion, action, rage, tired, var, flame):
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', CTL))
    st, nb = action if action else (0, 0)
    mu.mem_write(E + 0x73e0, bytes([st, nb])); mu.mem_write(E + 0xb5f4, bytes([82, var])); mu.mem_write(P + 0x1bb, bytes([flame])); mu.mem_write(P + 0x518, bytes([rage])); mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.emu_start(FN, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]
ACT = [None] + [(s, n) for s in STS for n in range(0, 0x100)]
cases = list(itertools.product(MOT, ACT, (0, 1), (0, 1), (0, 4), (0, 2, 0xd)))
js_in = [dict(mon=('em082_04' if v == 4 else MON), motion=m, action=list(a) if a else None, state=dict(rage=bool(r), tired=bool(t), soulFlame=bool(f & 2))) for (m, a, r, t, v, f) in cases]
open(os.path.join(HERE, 'jsg_in.json'), 'w').write(json.dumps(js_in))
out = subprocess.run(['node', '--input-type=module', '-e', """
import fs from 'fs'; import { pslMask } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const cs = JSON.parse(fs.readFileSync('jsg_in.json', 'utf8'));
fs.writeFileSync('jsg_out.json', JSON.stringify(cs.map(c => pslMask(c.mon, String(c.motion >> 8), c.motion & 0xff, c.action, c.state))));
"""], capture_output=True, text=True, cwd=HERE)
if out.returncode: print(out.stderr); raise SystemExit(1)
jsw = json.load(open(os.path.join(HERE, 'jsg_out.json')))
bad = 0; words = set()
for c, j in zip(cases, jsw):
    r = rom(*c); words.add(r)
    if r != j:
        bad += 1
        if bad <= 15: print('MISMATCH', c, hex(r), hex(j))
print('%s fn %#x: %d runs, %d mismatches, %d distinct words' % (MON, FN, len(cases), bad, len(words)))
