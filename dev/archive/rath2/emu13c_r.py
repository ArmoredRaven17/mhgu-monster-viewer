"""Unicorn run of uEm001_00's enemy vt+0x13c (0xd09054, the PSL enable word) -- the Rath line (em 1 Rathian / Gold /
Dreadqueen, em 2 Rathalos / Silver / Dreadking share the class). A copy of bw1/emu13c_bw.py with the em byte e+0xb5f4,
the enemy id halfword e+0xb5f0, the variant e+0xb5f5, the quest number 0x49930 (hooked: returns q), part 7's break level
(P+0x3bc + 12*7), the real .dtp array of the monster (em002_0X) at [[e+0x75f0]+0x64], and the rank chain
GOT 0x1831c54 -> 0x1883c70 -> obj, [obj+0xa4] -> R, signed byte R+0xf (0x3a8430).
   python emu13c_r.py <case...>   case = key=value,... over: m st n sever rage tired var em id lvl7 rank q dtp vt
"""
import sys, os, struct
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, STK, RET = 0x40000000, 0x40100000, 0x50000000, 0x60000000
RES, ARR, QO, QR = 0x40200000, 0x40201000, 0x40202000, 0x40203000
QGLOB = 0x1883c70
VT = 0x1793c28


def dtpA(tag):
    p = r'C:\MHGU-Extract\scratch-em\%s\enemy\dt_base\%s_dtbparts.dtp' % (tag, tag)
    b = open(p, 'rb').read()
    return b[0x4d:0x4d + 4 * b[8]]


_MU = None
_SEEN = set()
_Q = [0]


def _mu():
    global _MU
    if _MU: return _MU
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
    except Exception: pass
    mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
    mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
    mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
    mu.mem_map(RES, 0x8000)
    def hq(uc, addr, size, ud):                 # 0x49930: the quest's number (thunk to 0x3a8470) -> q
        _SEEN.add(addr)
        uc.reg_write(UC_ARM_REG_R0, _Q[0] & 0xffffffff); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    mu.hook_add(UC_HOOK_CODE, hq, begin=0x49930, end=0x49930)
    for a in (0xca170, 0xa3bf4, 0x81614, 0x81670, 0x6fe88, 0x3a8430, 0x9d36c):
        mu.hook_add(UC_HOOK_CODE, lambda uc, addr, size, ud: _SEEN.add(addr), begin=a, end=a)
    _MU = mu
    return mu


def run(m=0, st=0, n=0, sever=0, rage=0, tired=0, var=0, em=2, id=None, lvl7=0, rank=5, q=10, dtp=None, vt=VT,
        calls=None):
    mu = _mu()
    _SEEN.clear(); _Q[0] = q
    if id is None: id = (var << 8) | em
    if dtp is None: dtp = 'em%03d_%02d' % (em, var)
    mu.mem_write(E, bytes(0x20000)); mu.mem_write(P, bytes(0x10000)); mu.mem_write(RES, bytes(0x8000))
    mu.mem_write(DA_VA, DATA)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
    mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    mu.mem_write(E, struct.pack('<I', vt))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x73e0, bytes([st, n]))
    mu.mem_write(E + 0xb5f0, struct.pack('<I', id))
    mu.mem_write(E + 0xb5f4, bytes([em, var]))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever))
    mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.mem_write(P + 0x3bc + 7 * 12, bytes([lvl7]))
    mu.mem_write(E + 0x75f0, struct.pack('<I', RES))
    mu.mem_write(RES + 0x64, struct.pack('<I', ARR))
    mu.mem_write(ARR, dtpA(dtp))
    mu.mem_write(QGLOB, struct.pack('<I', QO))
    mu.mem_write(QO + 0xa4, struct.pack('<I', QR))
    mu.mem_write(QR + 0xf, struct.pack('<b', rank))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, m)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=20000)
    if calls is not None: calls.update(_SEEN)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


def parse(c):
    kw = {}
    for kv in c.split(','):
        k, v = kv.split('=')
        kw[k] = v if k == 'dtp' else int(v, 0)
    return kw


if __name__ == '__main__':
    for c in sys.argv[1:]:
        s = set()
        w = run(calls=s, **parse(c))
        print('%-52s %#010x   %s' % (c, w, ' '.join('%#x' % a for a in sorted(s))))
