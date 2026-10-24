# Run uEm007_00 vt+0x13c (0xd4532c) under unicorn: the enable word for (motion, action, state).
import d, struct
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
def mk():
    mu=Uc(UC_ARCH_ARM, UC_MODE_ARM)
    mu.mem_map(0,(len(d.TEXT)+0xfff)&~0xfff); mu.mem_write(0,d.TEXT)
    ro=d.RO_VA&~0xfff; mu.mem_map(ro,((d.RO_VA+len(d.RODATA)-ro)+0xfff)&~0xfff); mu.mem_write(d.RO_VA,d.RODATA)
    da=d.DA_VA&~0xfff; mu.mem_map(da,((d.DA_VA+len(d.DATA)-da)+0x800000+0xfff)&~0xfff); mu.mem_write(d.DA_VA,d.DATA)
    mu.mem_map(0x30000000,0x200000); mu.mem_map(0x40000000,0x10000); mu.mem_map(0x50000000,0x1000)
    mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2)|(0xf<<20)); mu.reg_write(UC_ARM_REG_FPEXC,0x40000000)
    return mu
E=0x30000000; P=0x30100000
def word(motion, group=0, idx=0, variant=4, severed=False, rage=False, tired=0, p1ba=0):
    mu=mk()
    mu.mem_write(E, struct.pack('<I',0x17994cc))
    mu.mem_write(E+0x1428, struct.pack('<I',P))
    mu.mem_write(E+0x73e0, bytes([group, idx]))
    mu.mem_write(E+0xb5f5, bytes([variant]))
    mu.mem_write(P+0x3b4, struct.pack('<H',1 if severed else 0))
    mu.mem_write(P+0x518, bytes([1 if rage else 0]))
    mu.mem_write(P+0x505, bytes([tired]))
    mu.mem_write(P+0x1ba, bytes([p1ba]))
    mu.reg_write(UC_ARM_REG_R0,E); mu.reg_write(UC_ARM_REG_R1,motion)
    mu.reg_write(UC_ARM_REG_SP,0x4000f000); mu.reg_write(UC_ARM_REG_LR,0x50000000)
    mu.emu_start(0xd4532c,0x50000000,count=20000)
    return struct.unpack('<I',mu.mem_read(E+0x13f4,4))[0]
if __name__=='__main__':
    cases=[('L9 M11 (7,0x5a)',0x90b,7,0x5a,{}),('L9 M11 (7,0xb5)',0x90b,7,0xb5,{}),('L9 M11 (7,0xb6)',0x90b,7,0xb6,{}),
           ('L9 M11 (7,0xb7)',0x90b,7,0xb7,{}),('L9 M11 (7,0xb8)',0x90b,7,0xb8,{}),('L9 M11 (7,0xb7) enraged',0x90b,7,0xb7,{'rage':True}),
           ('L9 M10 (7,0x77) intact',0x90a,7,0x77,{}),('L9 M10 (7,0x77) severed',0x90a,7,0x77,{'severed':True}),
           ('L9 M16 (7,0x62) calm',0x910,7,0x62,{}),('L9 M16 (7,0x62) enraged',0x910,7,0x62,{'rage':True}),('L9 M16 tired',0x910,7,0x62,{'tired':2}),
           ('L2 M15 (7,0xb4)',0x20f,7,0xb4,{}),('L2 M19 (7,0xb7)',0x213,7,0xb7,{}),('L2 M19 (7,0x83)',0x213,7,0x83,{}),
           ('L2 M22 (7,0x67) v4',0x216,7,0x67,{}),('L2 M22 (7,0x67) v0',0x216,7,0x67,{'variant':0}),
           ('L0 M7 p1ba=0',0x007,7,0x6a,{}),('L0 M7 p1ba=1',0x007,7,0x6a,{'p1ba':1}),('L3 M20 (10,0x72)',0x314,10,0x72,{}),('L3 M20 (11,0)',0x314,11,0,{}),
           ('L9 M30 (7,0xc8)',0x91e,7,0xc8,{}),('L9 M27 (7,0xc8)',0x91b,7,0xc8,{})]
    for name,m,g,i,kw in cases:
        print('%-28s %#010x'%(name, word(m,g,i,**kw)))
