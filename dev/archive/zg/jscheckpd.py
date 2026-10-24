"""a class's vt+0x13c (all calls native) against psl-mask.js pslMask(mon) over motions x actions x posture x P+0x5c (depth) x
rage x tired x rank (0x3a8430 chain answered through the quest object at 0x1883c70, as jscheck022).
   python jscheckpd.py <vtable hex> <mon> <motions hex,...> <statuses> [MON2 for a negative control]"""
import os, sys, struct, json, itertools, subprocess
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read(); RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, CTL, STK, RET, QO, QR = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000, 0x40202000, 0x40203000
VT = int(sys.argv[1], 16); MON = sys.argv[2]; MOT = [int(x, 16) for x in sys.argv[3].split(',')]
STS = [int(x, 0) for x in sys.argv[4].split(',')]
JSMON = sys.argv[5] if len(sys.argv) > 5 else MON
HERE = os.path.dirname(os.path.abspath(__file__))
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT); mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
RES, ARR = 0x40210000, 0x40211000
mu.mem_map(RES, 0x2000)
mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(CTL, 0x4000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
FN = struct.unpack_from('<I', DATA, VT + 0x13c - DA_VA)[0]
MOG = float(os.environ['MOGURI']) if os.environ.get('MOGURI') else None
if MOG is not None:
    from unicorn import UC_HOOK_CODE
    def _mog(uc, addr, size, ud):
        uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', MOG))[0]); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    mu.hook_add(UC_HOOK_CODE, _mog, begin=0xbf62c, end=0xbf62c)
TUNEI = int(os.environ['TUNEI']) if os.environ.get('TUNEI') else None
if TUNEI is not None:
    from unicorn import UC_HOOK_CODE
    def _ti(uc, addr, size, ud):
        uc.reg_write(UC_ARM_REG_R0, TUNEI); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    mu.hook_add(UC_HOOK_CODE, _ti, begin=0x6f62c, end=0x6f62c)
LVP = [int(x) for x in os.environ['LV'].split(',')] if os.environ.get('LV') else []
AXIS = os.environ.get('AXIS', '')
def dtpA(mon):
    b = open(r'C:\MHGU-Extract\scratch-em\%s\enemy\dt_base\%s_dtbparts.dtp' % (mon, mon), 'rb').read()
    return b[0x4d:0x4d + 4 * b[8]]
A = dtpA(MON) if LVP else b''
def thr(rank, lo, hi): return A[lo] if rank <= 4 else A[hi]
def lvof(lv, part): return dict(zip(LVP, lv)).get(part, 0)
def ctl24(lv, rank):   # em 5's action-start latch vt+0x204 0xd22e8c..0xd22fac: head part 5 row 3, belly part 6 row 2, back part 0 row 0
    if MON != 'em005_00': return 0
    return ((lvof(lv, 5) >= thr(rank, 0xd, 0xe)) << 0) | ((lvof(lv, 6) >= thr(rank, 9, 0xa)) << 1) | ((lvof(lv, 0) >= thr(rank, 1, 2)) << 2)
def rom(motion, action, posture, depth, rage, tired, rank, chg=0, sev=0, lv=()):
    mu.mem_write(E, b'\0' * 0x20000); mu.mem_write(P, b'\0' * 0x10000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', CTL))
    mu.mem_write(0x1883c70, struct.pack('<I', QO)); mu.mem_write(QO + 0xa4, struct.pack('<I', QR)); mu.mem_write(QR + 0xf, struct.pack('<b', rank))
    st, nb = action if action else (0, 0)
    mu.mem_write(E + 0x73e0, bytes([st, nb])); mu.mem_write(P + 0x518, bytes([rage])); mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.mem_write(P + 0x1ba, bytes([posture])); mu.mem_write(P + 0x5c, struct.pack('<f', depth)); mu.mem_write(P + 0x1bb, bytes([chg])); mu.mem_write(E + 0x1068, bytes([8 if os.environ.get('FLOOR') else 0])); mu.mem_write(P + 0x3b4, bytes([sev]))
    if os.environ.get('VAR'): mu.mem_write(E + 0xb5f5, bytes([int(os.environ['VAR'])]))
    if os.environ.get('EM'): mu.mem_write(E + 0xb5f4, bytes([int(os.environ['EM'])]))
    if os.environ.get('IDW'): mu.mem_write(E + 0xb5f0, struct.pack('<H', int(os.environ['IDW'], 0)))   # the enemy id word (Rath line L2 M1, 0xd09398)
    mu.mem_write(CTL + 0x2c, bytes([rage if os.environ.get('SNOW') else 0, 1 if os.environ.get('SNOW') else 0])); mu.mem_write(CTL + 0x18, bytes([1 if os.environ.get('A18') else 0])); mu.mem_write(P + 0x5e08, bytes([2 if os.environ.get('A18') else 0]))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET); mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.mem_write(E + 0x75f0, struct.pack('<I', RES)); mu.mem_write(RES + 0x64, struct.pack('<I', ARR)); mu.mem_write(ARR, A or b'\0')
    for part, l in zip(LVP, lv): mu.mem_write(P + 0x3bc + 12 * part, bytes([l]))
    if LVP: mu.mem_write(CTL + 0x24, bytes([ctl24(lv, rank)]))
    if AXIS == 'mud': mu.mem_write(E + 0xcada, bytes([chg & 3]))
    if AXIS == 'charge081': mu.mem_write(E + 0xcb01, bytes([chg % 5, (chg // 5) % 5, chg // 25]))   # Astalos's tier bytes crest / wings / tail
    # Brachydios's arm rows: halfwords at [e+0xcacc] + 0x20 (left) / + 0x2c (right) (0xf469c8..0xf46a00), not ctl = [e+0xcac0]
    if AXIS == 'arms': mu.mem_write(E + 0xcacc, struct.pack('<I', RES + 0x800)); mu.mem_write(RES + 0x820, struct.pack('<H', chg & 3)); mu.mem_write(RES + 0x82c, struct.pack('<H', chg >> 2))
    mu.emu_start(FN, RET, count=20000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]
ACT = [None] + [(s, n) for s in STS for n in range(0, 0x100)]
DEPTHS = tuple(float(x) for x in os.environ['DEPTHS'].split(',')) if os.environ.get('DEPTHS') else (0.0, -100.0, -549.0, -551.0, -1000.0, -1700.0, -1900.0, -2000.0, -2200.0, -2400.0) if not os.environ.get('CHG') else (0.0,)
CHGS = tuple(int(x) for x in os.environ['CHG'].split(',')) if os.environ.get('CHG') else (0,)
SEVS = (0, 1, 2, 3) if os.environ.get('SEV') else (0,)
RANKS = tuple(int(x) for x in os.environ['RANKS'].split(',')) if os.environ.get('RANKS') else (3, 5)
LVLS = [int(x) for x in os.environ['LVLS'].split(',')] if os.environ.get('LVLS') else list(range(4))
LVS = list(itertools.product(LVLS, repeat=len(LVP))) if LVP else [()]
GRID = (MOT, ACT, (0, 4), DEPTHS, (0, 1), (0, 1), RANKS, CHGS, SEVS, LVS)   # streamed per chunk: a list of 15M tuples x 12 workers swapped the machine
def js_case(c):
    (m, a, po, d, r, t, rk, cg, sv, lv) = c
    return dict(motion=m, action=list(a) if a else None, state=dict(charge=[cg % 5, (cg // 5) % 5, cg // 25] if AXIS == 'charge081' else [0, 0, 0], heat=cg if AXIS == 'heat' else 0, mud=cg & 3 if AXIS == 'mud' else 0, armEmpty=[(cg & 3) in (0, 3), (cg >> 2) in (0, 3)] if AXIS == 'arms' else [False, False], beardOff=bool(sv & 2), breakLevel7=lvof(lv, 7), crestBroken=bool(LVP) and lvof(lv, 6) >= thr(rk, 1, 2), backBroken=bool(ctl24(lv, rk) & 4) if MON == 'em005_00' else False, bellyBroken=bool(ctl24(lv, rk) & 2) if MON == 'em005_00' else False, posture=po, depth=d, rage=bool(r), tired=bool(t), rank=rk, charged=(TUNEI is not None and cg >= TUNEI), seltasLink=bool(cg & 1), severed=bool(sv & 1), floorFlag8=bool(os.environ.get('FLOOR')), windAura=cg, fireAura=cg, snowMap=bool(os.environ.get('SNOW')), aura5e08=bool(os.environ.get('A18')), sunk=(MOG is not None and po == 4 and d < 0.9 * MOG)))
# in chunks (one JSON of a 100-motion grid passes node's 512 MB string limit), each file named for this run
TAG = '%s_%d' % (MON, os.getpid()); CHUNK = 200000
bad = 0; words = set(); total = 0
it = itertools.product(*GRID)
while True:
    chunk = list(itertools.islice(it, CHUNK))
    if not chunk: break
    total += len(chunk)
    fi, fo = os.path.join(HERE, 'jspd_in_%s.json' % TAG), os.path.join(HERE, 'jspd_out_%s.json' % TAG)
    open(fi, 'w').write(json.dumps([js_case(c) for c in chunk]))
    out = subprocess.run(['node', '--input-type=module', '-e', """
import fs from 'fs'; import { pslMask } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const cs = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
fs.writeFileSync(process.argv[2], JSON.stringify(cs.map(c => pslMask('%s', String(c.motion >> 8), c.motion & 0xff, c.action, c.state))));
""" % JSMON, fi, fo], capture_output=True, text=True, cwd=HERE)
    if out.returncode: print(out.stderr); raise SystemExit(1)
    jsw = json.load(open(fo))
    os.remove(fi); os.remove(fo)
    for c, j in zip(chunk, jsw):
        r = rom(*c); words.add(r)
        if r != j:
            bad += 1
            if bad <= 12: print('MISMATCH', c, hex(r), j if j is None else hex(j))
print('%s (js %s) fn %#x: %d runs, %d mismatches, %d distinct words' % (MON, JSMON, FN, total, bad, len(words)))
