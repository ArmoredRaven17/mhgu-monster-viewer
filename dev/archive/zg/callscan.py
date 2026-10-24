# callscan.py <target> [lo hi]: every b/bl to target, with r1/r2/r3 immediates from the 12 instructions before
import sys, struct
from armdis import dis
import capstone
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
tg=int(sys.argv[1],16); lo=int(sys.argv[2],16) if len(sys.argv)>2 else 0; hi=int(sys.argv[3],16) if len(sys.argv)>3 else len(T)
for a in range(lo,hi,4):
    w=struct.unpack_from('<I',T,a)[0]
    if (w>>25)&7!=5 or (w>>28)==0xf: continue
    off=w&0xffffff
    if off&0x800000: off-=0x1000000
    if a+8+off*4!=tg: continue
    regs={}
    for b,s in dis(a-48,a):
        for r in ('r1','r2','r3'):
            if s.startswith('mov '+r+', #') or s.startswith('movw '+r+', #'): regs[r]=s.split('#')[1]
            elif s.startswith('mov '+r+',') or s.startswith('ldr '+r+',') or s.startswith('ldrb '+r+','): regs[r]='?'
    print(hex(a), regs)
