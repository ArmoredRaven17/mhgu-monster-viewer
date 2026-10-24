import sys, struct
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
tgt=int(sys.argv[1],16); lo,hi=int(sys.argv[2],16),int(sys.argv[3],16)
for a in range(lo,hi,4):
    w=struct.unpack_from('<I',T,a)[0]
    if (w>>25)&7==5:
        off=w&0xffffff
        if off&0x800000: off-=0x1000000
        if a+8+off*4==tgt: print(hex(a), 'bl' if (w>>24)&1 else 'b', 'cond',hex(w>>28))
