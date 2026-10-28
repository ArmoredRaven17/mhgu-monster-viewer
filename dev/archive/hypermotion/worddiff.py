"""hypermotion/worddiff.py (hyper-motion lane, 2026-10-27; Raven: Khezu's AoE "lines are much larger"): the class's PSL enable word
builder (vt+0x13c, run at every setMotion) under unicorn for every motion id L0..L9 x M0..M199 and every action (status 1..11 x
number 0..255 -- a sample when SAMPLE is set) with e+0xb720 = 0 and = 1 (slots held), comparing e+0x13f4. hookemu.py's machine (class
code native, shared calls stubbed; 0x81670 / 0x81614 answered by RAGE / TIRED env).
   python dev/archive/hypermotion/worddiff.py <monster id> [RAGE=0|1]"""
import sys, os, struct, json
sys.argv_keep = list(sys.argv)
mid = sys.argv[1]
sys.argv = [sys.argv[0]]
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import hookemu as H
from unicorn.arm_const import *
em, var = int(mid[2:5]), int(mid[6:8])
cls = H.CL.get(H.CLASS_OF.get(mid[:5], 'uEm%03d_00' % em))
VT13C = H.armdis.u32(cls['vtable'] + 0x13c)
RAGE = int(os.environ.get('RAGE', '0'))
orig = H.hook
def hook2(uc, addr, size, ud):
    if addr in (0x81670, 0x81688, 0x816b8): H.ret(uc, RAGE); return
    return orig(uc, addr, size, ud)
H.mu.hook_del if False else None
E = H.E
def word(motion, st, n, hyper):
    mu = H.mu
    mu.mem_write(E, b'\0' * 0x10000); mu.mem_write(E + 0xb000, b'\0' * 0x2000)
    mu.mem_write(E, struct.pack('<I', cls['vtable'])); mu.mem_write(E + 0x1428, struct.pack('<I', H.P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', H.C)); mu.mem_write(E + 0xb5f4, bytes([em, var])); mu.mem_write(E + 0xb5f0, struct.pack('<H', em))
    mu.mem_write(E + 0xb720, bytes([hyper])); mu.mem_write(E + 0xb736, b'\1')
    if hyper: mu.mem_write(E + 0xca88, b'\1'); mu.mem_write(E + 0xca9c, b'\2')
    mu.mem_write(E + 0x4b4, struct.pack('<H', motion)); mu.mem_write(E + 0x73e0, bytes([st, n]))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, H.STOP)
    try: mu.emu_start(VT13C, H.STOP, count=200000)
    except Exception as ex: return 'ERR'
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]
diffs = []
for L in range(10):
    for M in range(200):
        mot = (L << 8) | M
        for st, n in [(7, k) for k in range(0x60)] + [(1, k) for k in range(0x30)] + [(3, k) for k in range(0x60)]:
            a, b = word(mot, st, n, 0), word(mot, st, n, 1)
            if a != b: diffs.append(['L%d M%d' % (L, M), '%d:0x%02x' % (st, n), '%#x' % a, '%#x' % b])
print(json.dumps({'mon': mid, 'vt13c': '%#x' % VT13C, 'rage': RAGE, 'diffs': diffs[:200], 'n': len(diffs)}))
