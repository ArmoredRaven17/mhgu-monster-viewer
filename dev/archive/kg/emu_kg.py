"""Unicorn run of a class's enemy vt+0x13c (the PSL enable word) for Khezu (uEm003_00, vtable 0x17958f0) and
Basarios / Gravios (uEm004_00, vtable 0x1797c8c). A copy of bw1/emu13c_bw.py plus:
  em      e+0xb5f4, the em number byte (4 Basarios / 5 Gravios / 3 Khezu)
  ctl24   byte [e+0xcac0]+0x24 (Gravios's action-start part bits: 1 head, 2 belly row 2, 4 back row 0)
  lv0..lv7 the part break levels P+0x3bc + 12*part (0x9d36c)
  phase   P+0x1a1 (Khezu's L2 M37 arm)
  dtp     the monster whose real .dtp +0x64 rows go behind [e+0x75f0]+0x64
Everything in main.text runs (no stubs) except 0x712a0 (MoguriBaseOfs holder, answered). e+0x13f4 is zeroed first.
   python emu_kg.py <vtable hex> <case...>   case = key=value,... (m, st, n, rage, tired, em, ctl24, lv0..lv7, phase,
   rank, dtp, post, p5c, mog, sever, var)"""
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
RES, ARR, QO, QR, MG, CTL = 0x40200000, 0x40201000, 0x40202000, 0x40203000, 0x40204000, 0x40205000
QGLOB = 0x1883c70
_DTP = {}


def dtpA(mon):
    if mon not in _DTP:
        p = r'C:\MHGU-Extract\scratch-em\%s\enemy\dt_base\%s_dtbparts.dtp' % (mon, mon)
        b = open(p, 'rb').read()
        _DTP[mon] = b[0x4d:0x4d + 4 * b[8]]
    return _DTP[mon]


_MU = None
SEEN = set()


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
    def hook(uc, addr, size, ud):
        if addr == 0x712a0:
            SEEN.add(addr)
            uc.reg_write(UC_ARM_REG_R0, MG); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    mu.hook_add(UC_HOOK_CODE, hook, begin=0x712a0, end=0x712a0)
    for a in (0xca170, 0xa3bf4, 0x81d6c, 0x6fe88, 0x3a8430, 0xbf62c, 0x9d36c, 0xd2e35c):
        mu.hook_add(UC_HOOK_CODE, lambda uc, addr, size, ud: SEEN.add(addr), begin=a, end=a)
    _MU = mu
    return mu


def run(vt, m=0, st=0, n=0, rage=0, tired=0, em=0, var=0, ctl24=0, phase=0, rank=0, dtp=None, post=0, p5c=0.0,
        mog=0.0, sever=0, lv=None, calls=None):
    mu = _mu()
    SEEN.clear()
    mu.mem_write(E, bytes(0x20000)); mu.mem_write(P, bytes(0x10000)); mu.mem_write(RES, bytes(0x8000))
    mu.mem_write(DA_VA, DATA)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
    mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    mu.mem_write(E, struct.pack('<I', vt))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x73e0, bytes([st, n]))
    mu.mem_write(E + 0xb5f4, bytes([em, var]))
    mu.mem_write(E + 0xcac0, struct.pack('<I', CTL))
    mu.mem_write(CTL + 0x24, bytes([ctl24]))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever))
    mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    for i, l in enumerate(lv or []):
        mu.mem_write(P + 0x3bc + 12 * i, bytes([l]))
    mu.mem_write(P + 0x1a1, bytes([phase]))
    mu.mem_write(P + 0x1ba, bytes([post]))
    mu.mem_write(P + 0x5c, struct.pack('<f', p5c))
    mu.mem_write(MG + 0x10, struct.pack('<f', mog))
    mu.mem_write(E + 0x75f0, struct.pack('<I', RES))
    mu.mem_write(RES + 0x64, struct.pack('<I', ARR))
    if dtp: mu.mem_write(ARR, dtpA(dtp))
    mu.mem_write(QGLOB, struct.pack('<I', QO))
    mu.mem_write(QO + 0xa4, struct.pack('<I', QR))
    mu.mem_write(QR + 0xf, struct.pack('<b', rank))
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, m)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=20000)
    if calls is not None: calls.update(SEEN)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]


def parse(c):
    kw = {}; lv = [0] * 8
    for kv in c.split(','):
        k, v = kv.split('=')
        if k == 'dtp': kw[k] = v
        elif k in ('p5c', 'mog'): kw[k] = float(v)
        elif k.startswith('lv'): lv[int(k[2:])] = int(v, 0)
        else: kw[k] = int(v, 0)
    kw['lv'] = lv
    return kw


if __name__ == '__main__':
    vt = int(sys.argv[1], 16)
    for c in sys.argv[2:]:
        s = set()
        w = run(vt, calls=s, **parse(c))
        print('%-60s %#010x   %s' % (c, w, ' '.join('%#x' % a for a in sorted(s))))
