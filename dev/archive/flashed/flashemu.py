"""flashemu.py -- the sense scan's FLASH TEST run under unicorn on each monster's own loaded dttune, from 0xc3934 (after the
hunter / companion loops) to its exit 0xc30fc, with one flash source in front of the eye. ROM code throughout: the gate chain
0xc3934..0xc3a10 (P+0x24a bit 1, 0x99c58(e, 4) on P+0x3a8, P+0x5a4, 0x5c1a8, e+0x7420, posture-4 bit 3, 0x810d4), the cone
test 0xc3a3c..0xc3b5c over the 8 sources 0x49e7c (G+0x28f8 + 24 i), then P+0x59c, e+0xba47 & 0x26, and the setter 0xa1a88.
Stubbed (hooks return at once): 0x5c1a8 -> 0 (no Chameleos area timer), 0x810d4 -> 0 (not in its (10, n) list), 0x49e7c -> the
one source, 0x82cd0 (the EMC restart) -> logged, 0xcaf2c -> logged, the rage / tired tests 0x81670 / 0x816b8 / 0x81614 -> the
case's answer. P+0x3a8 is the monster's dtbase obj +0x6c (the 0x9cd50 copy) unless a control overrides it.
Flashed read 2026-10-25.  python flashemu.py  (prints one line per case; writes flashemu.json)"""
import sys, os, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\narga-scratch')
from tune_emu import Loader
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import *
ROOT = r'C:\MHGU-Extract\scratch-em'

def dtbase_flags(v):
    B = Loader(os.path.join(ROOT, v, 'enemy', 'dt_base', '%s_dtbase.dtb' % v), 0x53800)
    return B.u32(B.obj + 0x6c)

def run(v, flags=None, p24a=3, rage=0, alt=0, tired=0, count=0, posture=0, ba47=0, already=0.0, src_area=0, dz=300.0):
    L = Loader(os.path.join(ROOT, v, 'enemy', 'dt_tune', '%s_dttune.dtt' % v), 0x57684)
    em = L.e; uc = em.uc
    if flags is None: flags = dtbase_flags(v)
    E = 0x60020000; P = 0x60040000; SRC = 0x60060000
    uc.mem_write(E, bytes(0xd000)); uc.mem_write(P, bytes(0x6000)); uc.mem_write(SRC, bytes(0x100))
    em.poke32(E + 0x1428, P); em.poke32(E + 0x75ec, L.obj); em.poke8(E + 0x7420, 1); em.poke8(E + 0xba47, ba47)
    em.poke8(E + 0x1054, 0)
    em.poke8(P + 0x24a, p24a); em.poke32(P + 0x3a8, flags); em.poke8(P + 0x1ba, posture); em.poke8(P + 0x5a1, count)
    uc.mem_write(P + 0x59c, struct.pack('<f', already))
    # the sense record 0 copied to sp+0xe0 (as 0xc3130..0xc3144 does), the eye at the origin, its yaw / pitch words 0
    S = L.u32(L.obj + 0x78); rec = L.rd(S, 32)
    sp = 0x7ff80000
    uc.mem_write(sp, bytes(0x200)); uc.mem_write(sp + 0xe0, rec)
    uc.mem_write(sp + 0x100, struct.pack('<3f', 0.0, 0.0, 0.0))
    # one source dz ahead on the eye's level: +0 x, +4 y, +8 z, +0xc radius, +0x14 area, +0x15 state 1 (live)
    uc.mem_write(SRC, struct.pack('<4f', 0.0, 0.0, dz, 1500.0)); uc.mem_write(SRC + 0x14, bytes([src_area, 1]))
    log = []
    ans = {0x5c1a8: 0, 0x810d4: 0, 0x49e7c: SRC, 0x81670: rage, 0x816b8: alt, 0x81614: tired, 0x82cd0: 0, 0xcaf2c: 0}
    def hook(uc, addr, size, ud):
        if addr in ans:
            if addr in (0x82cd0, 0xcaf2c): log.append('%x(e, %d, %d)' % (addr, uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2)))
            uc.reg_write(UC_ARM_REG_R0, ans[addr]); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
        elif addr == 0xa1a88:
            log.append('a1a88(e, %d)' % uc.reg_read(UC_ARM_REG_R1))
    for a in list(ans) + [0xa1a88]:
        uc.hook_add(UC_HOOK_CODE, hook, begin=a, end=a + 4)
    for r, val in ((UC_ARM_REG_SL, E), (UC_ARM_REG_R4, E + 0x1428), (UC_ARM_REG_R8, 0), (UC_ARM_REG_SP, sp),
                   (UC_ARM_REG_FP, sp + 0x180), (UC_ARM_REG_LR, 0x7f000000)):
        uc.reg_write(r, val)
    fault = None
    try: uc.emu_start(0xc3934, 0xc30fc, count=200000)
    except Exception as e: fault = str(e)
    pc = uc.reg_read(UC_ARM_REG_PC)
    t = struct.unpack('<f', bytes(uc.mem_read(P + 0x59c, 4)))[0]
    return {'mon': v, 'flags': '%#x' % flags, 'p24a': p24a, 'rage': rage, 'tired': tired, 'count': count, 'posture': posture,
            'ba47': ba47, 'already': already, 'P+0x59c': t, 'P+0x5a0': uc.mem_read(P + 0x5a0, 1)[0],
            'P+0x5a1': uc.mem_read(P + 0x5a1, 1)[0], 'calls': log, 'stop': '%#x' % pc, 'fault': fault}

if __name__ == '__main__':
    cases = [
        ('Rathian (data bit 2 set): blinded', dict(v='em001_00')),
        ('Rathian enraged', dict(v='em001_00', rage=1)),
        ('Rathian tired', dict(v='em001_00', tired=1)),
        ('Rathian second flash (P+0x5a1 = 1)', dict(v='em001_00', count=1)),
        ('Rathian fourth flash (P+0x5a1 = 3)', dict(v='em001_00', count=3)),
        ('Rathian already blind (P+0x59c = 50)', dict(v='em001_00', already=50.0)),
        ('Rathian e+0xba47 = 0x20', dict(v='em001_00', ba47=0x20)),
        ('Rathian P+0x24a = 1 (bit 1 clear)', dict(v='em001_00', p24a=1)),
        ('CONTROL Rathian with bit 2 cleared', dict(v='em001_00', flags=0x08400062)),
        ('Rathian source in another area', dict(v='em001_00', src_area=1)),
        ('Rathian source behind the eye', dict(v='em001_00', dz=-300.0)),
        ('Fatalis (data bit 2 clear)', dict(v='em013_00')),
        ('CONTROL Fatalis with bit 2 set', dict(v='em013_00', flags=0x00400406)),
        ('Khezu', dict(v='em003_00')),
        ('Gypceros', dict(v='em009_00')),
        ('Gore Magala', dict(v='em071_00')),
        ('Chaotic Gore Magala, P+0x24a = 3 (data only)', dict(v='em071_05')),
        ('Chaotic Gore Magala, P+0x24a = 1 (its vt+0x204 0xfadfd4, em 0x47)', dict(v='em071_05', p24a=1)),
        ('Akantor (rows 60: the 300 floor)', dict(v='em033_00')),
        ('Valstrax (E[1] null: the 1800 default)', dict(v='em086_00')),
        ('Ahtal-Ka (rows 0)', dict(v='em088_00')),
        ('Uroktor posture 4 (bit 3 set)', dict(v='ems040_00', posture=4)),
        ('Rathian posture 4 (bit 3 clear)', dict(v='em001_00', posture=4)),
    ]
    res = []
    for name, kw in cases:
        r = run(**kw); r['case'] = name; res.append(r)
        print('%-62s P+0x59c=%7.1f 5a1=%d calls=%s stop=%s%s' % (name, r['P+0x59c'], r['P+0x5a1'], r['calls'], r['stop'], ' FAULT ' + r['fault'] if r['fault'] else ''))
    json.dump(res, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'flashemu.json'), 'w'), indent=1)
