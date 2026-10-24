"""psl-mask.js CLASS_MASK.em066_00 / em066_04 against uEm066_00 vt+0x13c = 0xf63fc0: all calls native except 0xbf62c (answered
MOGURI env, default 0); the .dtp array A from the real file at [[e+0x75f0]+0x64]; part 0's break level at P+0x3bc (0x9d36c); the
boulder kind at [[e+0xcac0]+0x30]; the variant e+0xb5f5; the rank chain of 0x3a8430. motion x action x variant x level x kind x
rank x posture/depth x rage x tired.   python jscheck066.py [jsmon-override for a control]"""
import os, sys, struct, json, itertools, subprocess
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read(); RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, STK, RET, RES, ARR, QO, QR, CTL = 0x40000000, 0x40100000, 0x50000000, 0x60000000, 0x40200000, 0x40201000, 0x40202000, 0x40203000, 0x40204000
VT = 0x17dc1ec
OVR = sys.argv[1] if len(sys.argv) > 1 else None
A = {}
for mon in ('em066_00', 'em066_04'):
    D = open(r'C:\MHGU-Extract\scratch-em\%s\enemy\dt_base\%s_dtbparts.dtp' % (mon, mon), 'rb').read()
    A[mon] = D
HERE = os.path.dirname(os.path.abspath(__file__))
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(RES, 0x8000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
def hook(uc, addr, size, ud):
    uc.reg_write(UC_ARM_REG_S0, 0); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
mu.hook_add(UC_HOOK_CODE, hook, begin=0xbf62c, end=0xbf62c)
FN = struct.unpack_from('<I', DATA, VT + 0x13c - DA_VA)[0]; assert FN == 0xf63fc0, hex(FN)
# the dtp's A array as the loader leaves it (dtp.py: 5-byte rows {part, lowLv, gLv, ...}); the word reads bytes 1 / 2 and 5 / 6
def arr(mon):
    sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\break-scratch')
    import dtp
    o = dtp.parse(A[mon])
    rows = o['A_+0x64'] if isinstance(o, dict) and 'A_+0x64' in o else None
    return rows
def rom(mon, motion, action, lvl, kind, rank, posture, depth, rage, tired):
    var = 4 if mon == 'em066_04' else 0
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x75f0, struct.pack('<I', RES)); mu.mem_write(RES + 0x64, struct.pack('<I', ARR)); mu.mem_write(ARR, ROWS[mon])
    mu.mem_write(E + 0xcac0, struct.pack('<I', CTL)); mu.mem_write(CTL + 0x30, struct.pack('<I', kind))
    mu.mem_write(E + 0xb5f4, bytes([66, var]))
    mu.mem_write(0x1883c70, struct.pack('<I', QO)); mu.mem_write(QO + 0xa4, struct.pack('<I', QR)); mu.mem_write(QR + 0xf, struct.pack('<b', rank))
    st, nb = action if action else (0, 0)
    mu.mem_write(E + 0x73e0, bytes([st, nb]))
    mu.mem_write(P + 0x1ba, bytes([posture])); mu.mem_write(P + 0x5c, struct.pack('<f', depth)); mu.mem_write(P + 0x3bc, bytes([lvl]))
    mu.mem_write(P + 0x518, bytes([rage])); mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.emu_start(FN, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]
ROWS = {}
for mon in A:
    D = A[mon]
    # the A rows as the class reads them: [[e+0x75f0]+0x64] points at 4-byte rows in the loaded object -- from the file:
    # row count at +0x8 (dtp.py's header byte 0x8c area); here read the rows straight from dtp.py and pack them 4 bytes each
    sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\break-scratch')
    import dtp
    o = dtp.parse(D)
    rows = o.get('A_+0x64') if isinstance(o, dict) else None
    if rows is None:
        raise SystemExit('dtp.parse gave no A rows: ' + str(type(o)))
    ROWS[mon] = b''.join(bytes(r[:4]) for r in rows)
MOT = [0x407, 0x411, 0x40e, 0x40f, 0x41c, 0x41d, 0x7, 0xb, 0xc, 0xd, 0x90d, 0x408, 0x1, 0x412]
ACT = [None, (7, 0xf7), (7, 0xf8), (7, 0xf6), (7, 0x52), (1, 0xf7)]
cases = list(itertools.product(('em066_00', 'em066_04'), MOT, ACT, (0, 1, 2, 3), (0, 1, 2, 3, 4), (3, 5), ((0, 0.0), (4, 0.0), (4, -100.0)), (0, 1), (0, 1)))
js_in = [dict(mon=OVR or mon, motion=m, action=list(a) if a else None,
              state=dict(tusksBroken=(lv >= 2), boulder=kd, rank=rk, posture=pp[0], sunk=(pp[0] == 4 and pp[1] < 0.0), rage=bool(rg), tired=bool(td)))
         for (mon, m, a, lv, kd, rk, pp, rg, td) in cases]
open(os.path.join(HERE, 'js066_in.json'), 'w').write(json.dumps(js_in))
out = subprocess.run(['node', '--input-type=module', '-e', """
import fs from 'fs'; import { pslMask } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const cs = JSON.parse(fs.readFileSync('js066_in.json', 'utf8'));
fs.writeFileSync('js066_out.json', JSON.stringify(cs.map(c => pslMask(c.mon, String(c.motion >> 8), c.motion & 0xff, c.action, c.state))));
"""], capture_output=True, text=True, cwd=HERE)
if out.returncode: print(out.stderr); raise SystemExit(1)
jsw = json.load(open(os.path.join(HERE, 'js066_out.json')))
bad = 0
for c, j in zip(cases, jsw):
    mon, m, a, lv, kd, rk, pp, rg, td = c
    r = rom(mon, m, a, lv, kd, rk, pp[0], pp[1], rg, td)
    if r != j:
        bad += 1
        if bad <= 12: print('MISMATCH', c, hex(r), j if j is None else hex(j))
print('rows', {k: list(v) for k, v in ROWS.items()}, '; %d runs, %d mismatches' % (len(cases), bad))
