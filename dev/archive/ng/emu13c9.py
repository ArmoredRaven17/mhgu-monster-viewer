"""emu13c.py extended for uEm009_00 (Gypceros): the crest break level and the rank byte.
   python emu13c9.py <vtable hex> <case...>
   case = motion:status:number:sever:rage:tired[:crest[:rank[:thr1[:thr2]]]]
     crest = break level byte of part 6, P + 0x3bc + 6*12 = P+0x404 (0x9d36c(e, 6))
     rank  = the signed byte 0x3a8430 reads: [[ [0x1831c54] ]+0xa4]+0xf  (5 = its top value; 0 -> pointer NULL path)
     thr1 / thr2 = the .dtp +0x64 row 0 bytes 1 / 2 at [[e+0x75f0]+0x64] (default 2 / 2, em009_00_dtbparts.dtp row 0)
Prints [e+0x13f4] after the call (zeroed first, as setMotion 0x7256c does) and the count of instructions run."""
import sys, os, struct
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, STK, RET, X = 0x40000000, 0x40100000, 0x50000000, 0x60000000, 0x41000000
GOT_RANK = 0x1831c54          # the PIC literal at 0xd5e83c (0xad3488) + 0xd5e7cc; it holds 0x1883c70, the global (bss)


def run(vt, motion, status, number, sever, rage, tired, crest=0, rank=0, thr1=2, thr2=2, calls=None):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
    mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
    mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
    mu.mem_map(X, 0x10000)
    mu.mem_write(E, struct.pack('<I', vt))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x13f4, b'\0\0\0\0')
    mu.mem_write(E + 0x73e0, bytes([status, number]))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever))
    mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.mem_write(P + 0x3bc + 6 * 12, bytes([crest]))
    # [e+0x75f0] -> block X; [X+0x64] -> A = X+0x100: the .dtp +0x64 row 0 {part 6, level, level at G, group 1}
    mu.mem_write(E + 0x75f0, struct.pack('<I', X))
    mu.mem_write(X + 0x64, struct.pack('<I', X + 0x100))
    mu.mem_write(X + 0x100, bytes([6, thr1, thr2, 1]))
    # rank: [GOT] = &global (0x1883c70, left as the file has it); [global] -> S = X+0x200; [S+0xa4] -> R; R+0xf = rank
    glob = struct.unpack_from('<I', DATA, GOT_RANK - DA_VA)[0]
    mu.mem_write(glob, struct.pack('<I', X + 0x200))
    mu.mem_write(X + 0x200 + 0xa4, struct.pack('<I', X + 0x300))
    mu.mem_write(X + 0x300 + 0xf, bytes([rank & 0xff]))
    n = [0]
    def hook(uc, addr, size, ud):
        n[0] += 1
        if calls is not None and addr in (0x9d36c, 0x3a8430, 0xca170): calls.append(hex(addr))
    mu.hook_add(UC_HOOK_CODE, hook)
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=10000)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0], n[0]


if __name__ == '__main__':
    vt = int(sys.argv[1], 16)
    for c in sys.argv[2:]:
        a = [int(x, 0) for x in c.split(':')]
        calls = []
        w, n = run(vt, *a, calls=calls)
        print('%-34s %#010x  (%d insns; %s)' % (c, w, n, ' '.join(calls)))
