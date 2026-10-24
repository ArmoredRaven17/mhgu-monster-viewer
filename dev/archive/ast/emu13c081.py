# Run uEm081_00 vt+0x13c (0x1019eb4) under unicorn: the enable word for (motion, variant, tiers, rage, tired).
# Writes every combination to emu13c081.json for the JS transcription's comparison (cmp13c.mjs).
import sys, os, struct, json, itertools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bb9'))
import d
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM
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
MU=None
def word(motion, variant=0, t=(0,0,0), rage=False, tired=0):
    global MU
    if MU is None: MU = mk()
    mu = MU
    mu.mem_write(E, b'\0' * 0x10000)
    mu.mem_write(P, b'\0' * 0x1000)
    mu.mem_write(E+0x1428, struct.pack('<I',P))
    mu.mem_write(E+0xb5f5, bytes([variant]))
    mu.mem_write(E+0xcb01, bytes(t))
    mu.mem_write(P+0x518, bytes([1 if rage else 0]))
    mu.mem_write(P+0x505, bytes([tired]))
    mu.mem_write(E+0x13f4, struct.pack('<I', 0))        # 0x7256c zeroes it before the call
    mu.reg_write(UC_ARM_REG_R0,E); mu.reg_write(UC_ARM_REG_R1,motion)
    mu.reg_write(UC_ARM_REG_SP,0x4000f000); mu.reg_write(UC_ARM_REG_LR,0x50000000)
    mu.emu_start(0x1019eb4,0x50000000,count=20000)
    return struct.unpack('<I',mu.mem_read(E+0x13f4,4))[0]
if __name__=='__main__':
    out=[]
    motions=[0x001,0x20d,0x214,0x216,0x218,0x219,0x21a,0x21b,0x21c,0x227,0x22a,0x416,0x91b]
    for v in (0, 4):
        for t in itertools.product((0,1,2,3,4), repeat=3):
            for rage, tired in ((False,0),(True,0),(False,1),(False,2),(False,3),(True,2)):
                for m in motions:
                    out.append({'motion':m,'variant':v,'t':list(t),'rage':rage,'tired':tired,'word':word(m,v,t,rage,tired)})
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'emu13c081.json'),'w'))
    # the control and a few rows to read
    for v,t,r,ti in ((4,(2,2,2),False,0),(4,(0,0,0),False,0),(0,(0,0,0),False,0),(0,(0,0,0),False,2),(0,(1,1,1),False,0),
                     (0,(2,2,2),False,0),(0,(2,2,2),True,0),(0,(2,0,0),False,0),(0,(2,2,0),False,0),(0,(2,0,2),False,0),
                     (0,(0,2,0),False,0),(0,(0,0,2),False,0),(0,(4,4,4),False,0),(0,(3,3,3),False,0)):
        print('variant %d tiers %s rage %d tired %d -> %#010x' % (v, t, r, ti, word(0x216, v, t, r, ti)))
    print(len(out), 'cases written')
