import sys; sys.path.insert(0, r'C:\MHGU-Extract')
from _dis import *
lo,hi=0xd31a64,0xd46da0
tgts=[int(x,16) for x in sys.argv[1:]]
for i in md.disasm(TEXT[lo:hi], lo):
    if i.mnemonic in ('bl','b','blx') :
        try: t=int(i.op_str.strip('#'),16)
        except: continue
        if t in tgts: print(hex(i.address), i.mnemonic, hex(t))
