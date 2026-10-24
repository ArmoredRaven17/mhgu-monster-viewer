"""Unicorn run of a class's enemy vt+0x13c (the PSL enable word) -- emu13c.py plus posture P+0x1ba, the burrow offset
P+0x5c and MoguriBaseOfs (0xbf62c -> 0x712a0(e) -> [ret+0x10], answered by a hook), the variant byte e+0xb5f5, and
the ARMv8 CPU model (the vsel family).
   python emu13c2.py <vtable hex> <case...>
   case = motion:status:number:sever:rage:tired[:posture[:p5c[:moguri[:variant]]]]"""
import sys, os, struct
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, MG, STK, RET = 0x40000000, 0x40100000, 0x40200000, 0x50000000, 0x60000000
f2u = lambda x: struct.unpack('<I', struct.pack('<f', x))[0]

def run(vt, motion, status, number, sever, rage, tired, posture=0, p5c=0.0, moguri=0.0, variant=0, trace=None):
    mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
    except Exception: pass
    mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
    mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
    mu.mem_map(DA_VA, pg(len(DATA)) + 0x400000); mu.mem_write(DA_VA, DATA)
    mu.mem_map(E, 0x20000); mu.mem_map(P, 0x10000); mu.mem_map(MG, 0x1000)
    mu.mem_map(STK - 0x10000, 0x20000); mu.mem_map(RET, 0x1000)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
    mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    mu.mem_write(E, struct.pack('<I', vt))
    mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0x13f4, b'\0\0\0\0')
    mu.mem_write(E + 0x73e0, bytes([status, number]))
    mu.mem_write(E + 0xb5f5, bytes([variant]))
    mu.mem_write(P + 0x3b4, struct.pack('<H', sever))
    mu.mem_write(P + 0x518, bytes([1 if rage else 0]))
    mu.mem_write(P + 0x505, bytes([2 if tired else 0]))
    mu.mem_write(P + 0x1ba, bytes([posture]))
    mu.mem_write(P + 0x5c, struct.pack('<f', p5c))
    mu.mem_write(MG + 0x10, struct.pack('<f', moguri))
    seen = set()
    def hook(uc, addr, size, ud):
        seen.add(addr)
        if addr == 0x712a0:                       # MoguriBaseOfs holder: answer with MG (its +0x10 = the offset)
            uc.reg_write(UC_ARM_REG_R0, MG); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
    mu.hook_add(UC_HOOK_CODE, hook)
    mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, RET)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    fn = struct.unpack_from('<I', DATA, vt + 0x13c - DA_VA)[0]
    mu.emu_start(fn, RET, count=20000)
    if trace is not None: trace.update(seen)
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]

if __name__ == '__main__':
    vt = int(sys.argv[1], 16)
    for c in sys.argv[2:]:
        p = c.split(':')
        args = [int(x, 0) for x in p[:6]]
        kw = {}
        if len(p) > 6: kw['posture'] = int(p[6], 0)
        if len(p) > 7: kw['p5c'] = float(p[7])
        if len(p) > 8: kw['moguri'] = float(p[8])
        if len(p) > 9: kw['variant'] = int(p[9], 0)
        print('%-40s %#010x' % (c, run(vt, *args, **kw)))
