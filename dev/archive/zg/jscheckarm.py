"""jscheckarm.py: Nakarkos's arm word 0x107f0e4 (uEmOstgaloaArm vtable 0x17f6498 +0x13c), every call native under unicorn,
against psl-mask.js armMask084 over: the motions of list 2 (0x201..0x25d) plus 0x001 / 0x301; the body action B+0x73e0/1
(arm+0xcadc = B) over (7, 0x40..0xa0), (1, 0); the arm's own action over (7, 0..0x30), (0, 0); the arm form +0xcb30 and the
body's skull form B+0xcb0c / +0xcb0d over 0..3, 0xff; the side +0xcae0 1 / 2; rage / tired. Control: the same harness on a
deliberately wrong transcription (the always-set group dropped) must mismatch."""
import os, sys, struct, json, itertools, subprocess, random
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read(); RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, B, BP, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x40300000, 0x50000000, 0x60000000
VT = 0x17f6498
HERE = os.path.dirname(os.path.abspath(__file__))
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
for a, n in ((E, 0x20000), (P, 0x10000), (B, 0x20000), (BP, 0x10000), (STK - 0x10000, 0x20000), (RET, 0x1000)): mu.mem_map(a, n)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
FN = struct.unpack_from('<I', DATA, VT + 0x13c - DA_VA)[0]
assert FN == 0x107f0e4, hex(FN)
def rom(motion, body, arm, form, skull, side, rage, tired):
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000); mu.mem_write(B, b'\0' * 0x20000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcadc, struct.pack('<I', B))
    mu.mem_write(B + 0x1428, struct.pack('<I', BP))
    mu.mem_write(E + 0x73e0, bytes(arm)); mu.mem_write(B + 0x73e0, bytes(body))
    mu.mem_write(E + 0xcae0, bytes([side])); mu.mem_write(E + 0xcb30, bytes([form])); mu.mem_write(B + 0xcb0c, bytes([skull, skull]))
    mu.mem_write(P + 0x518, bytes([rage])); mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.emu_start(FN, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]
MOT = list(range(0x201, 0x25e)) + [0x001, 0x301]
BODY = [(7, n) for n in (0x44, 0x45, 0x4a, 0x4b, 0x69, 0x6a, 0x9b, 0x9c, 0x50, 0x9a, 0xfd)] + [(1, 0)]
ARM = [(7, n) for n in range(0, 0x30)] + [(0, 0), (2, 0x0c)]
cases = []
for m in MOT:
    k = m & 0xff
    if m in (0x25c, 0x25d):
        for f, sk, side in itertools.product((0, 1, 2, 3, 0xff), (0, 1, 2, 3, 0xff), (1, 2)): cases.append((m, (7, 0x50), (7, 0x19), f, sk, side, 0, 0))
    elif m in (0x201, 0x205, 0x206, 0x20d, 0x20e, 0x21c, 0x232, 0x233, 0x256):
        for b, a in itertools.product(BODY, ARM): cases.append((m, b, a, 0xff, 0xff, 1, 0, 0))
        for r, t in ((1, 0), (0, 1)): cases.append((m, (7, 0x44), (7, 0x22), 0xff, 0xff, 1, r, t))
    else:
        cases.append((m, (7, 0x44), (7, 0x0c), 0xff, 0xff, 1, 0, 0))
js_in = [dict(motion=c[0], body=list(c[1]), arm=list(c[2]), form=c[3], skull=c[4], side='l' if c[5] == 1 else 'r', rage=bool(c[6]), tired=bool(c[7])) for c in cases]
open(os.path.join(HERE, 'jsa_in.json'), 'w').write(json.dumps(js_in))
WRONG = '--control' in sys.argv
out = subprocess.run(['node', '--input-type=module', '-e', """
import fs from 'fs'; import { armMask084 } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const cs = JSON.parse(fs.readFileSync('jsa_in.json', 'utf8'));
fs.writeFileSync('jsa_out.json', JSON.stringify(cs.map(c => {
  const play = { arm: c.arm, body: { l: c.body, r: c.body } };
  const st = { rage: c.rage, tired: c.tired, armForm: c.form === 0xff ? undefined : c.form, skullForm: c.skull === 0xff ? undefined : c.skull };
  const w = armMask084('l_' + (c.motion >> 8), c.motion & 0xff, c.side, play, st);
  return %s;
})));
""" % ("(w & ~0x1c0000) >>> 0" if WRONG else "w")], capture_output=True, text=True, cwd=HERE)
if out.returncode: print(out.stderr); raise SystemExit(1)
jsw = json.load(open(os.path.join(HERE, 'jsa_out.json')))
bad = []
for c, w in zip(cases, jsw):
    r = rom(*c)
    if r != w: bad.append((hex(c[0]), c[1:], hex(r), hex(w)))
print('runs', len(cases), 'mismatches', len(bad), '(control)' if WRONG else '')
for b in bad[:12]: print('  ', b)
