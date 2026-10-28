"""stam1104.py (effects lane A2, 2026-10-26): the shared tiredness writers run under unicorn on a stand-in enemy, to settle whether
Thunderlord (em057_04) can ever be tired (P+0x505 in {2, 3}, the drool gate 0x81614).
  0xbd1a4(e, delta, max)  the stamina updater: (P+0x1a8 & 0x80001) == 1 (0xbd1d0), then [tune+0x30] = 0x7112c(e) != 0 (0xbd1e4),
                          then P+0x508 += delta; drained to 0 -> P+0x505 = (mask == 1) (0xbd2d4)
  0xbd0c8(e, new)         P+0x505 = new if the mask == 1, else 0 (0xbd0f4)
  0x76200..0x7629c        the changeAction flip 1 -> 2 (0xbd0c8(e, 2)), 3 -> 0
Runs: P+0x1a8 x [tune+0x30] = {Zinogre 0x440241, Thunderlord 0x4c0201} x {block, NULL}. Stubs: 0xa1f0c -> 0 (the 0x20 test),
0xbf01c / 0xc25a4 -> return (the just-exhausted flag), e+0xb720 = 0 (no Hyper). The tune lookup is the ROM's own 0x7112c
([[e+0x75ec]+0x94] = tune+0x30, tune = obj+0x64: tune_dump.py)."""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
T = armdis.TEXT
STUBS = {0xa1f0c: 0, 0xbf01c: 0, 0xc25a4: 0}
def run(flags, block, fn, args, p505=0, p508=1000):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    sz = (len(T) + 0xfff) & ~0xfff
    mu.mem_map(0, sz); mu.mem_write(0, T)
    E, P, OBJ, BLK, STK = 0x4000000, 0x4100000, 0x4200000, 0x4300000, 0x4400000
    for b in (E, P, OBJ, BLK): mu.mem_map(b, 0x100000)
    mu.mem_map(STK, 0x10000)
    # VFP on
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    w = lambda a, v, f='<I': mu.mem_write(a, struct.pack(f, v))
    w(E + 0x1428, P); w(E + 0x75ec, OBJ); w(OBJ + 0x94, BLK if block else 0)
    w(BLK, 3600, '<h'); w(BLK + 2, 0, '<h')
    w(P + 0x1a8, flags); mu.mem_write(P + 0x505, bytes([p505])); w(P + 0x508, p508, '<H'); w(P + 0x506, 1000, '<H')
    END = 0xfff0
    def hook(uc, addr, size, _):
        if addr in STUBS: uc.reg_write(UC_ARM_REG_R0, STUBS[addr]); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    mu.hook_add(UC_HOOK_CODE, hook)
    mu.reg_write(UC_ARM_REG_SP, STK + 0x8000); mu.reg_write(UC_ARM_REG_LR, END)
    regs = (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2)
    mu.reg_write(regs[0], E)
    for r, v in zip(regs[1:], args): mu.reg_write(r, v & 0xffffffff)
    mu.emu_start(fn, END, count=20000)
    return mu.mem_read(P + 0x505, 1)[0], struct.unpack('<H', mu.mem_read(P + 0x508, 2))[0]
for name, flags in (('Zinogre em 0x39', 0x440241), ('Thunderlord em 0x439', 0x4c0201)):
    for block in (True, False):
        a = run(flags, block, 0xbd1a4, (-2000, 1000))          # drain the whole bar
        b = run(flags, block, 0xbd0c8, (2,))                   # the flip's write (1 -> 2)
        c = run(flags, block, 0xbd0c8, (3,))                   # 0xc8f00 / 0xcc514's write
        print('%-22s P+0x1a8 %#010x block %-5s | 0xbd1a4(-2000): P+0x505 %d P+0x508 %d | 0xbd0c8(2): %d | 0xbd0c8(3): %d' % (
            name, flags, 'yes' if block else 'NULL', a[0], a[1], b[0], c[0]))
