import sys, numpy as np
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
T=armdis.TEXT; W=np.frombuffer(T[:len(T)//4*4],dtype='<u4')
for t in sys.argv[1:]:
    t=int(t,16)
    idx=np.nonzero((W & 0x0E000000)==0x0A000000)[0]
    for i in idx:
        w=int(W[i]); off=w&0xffffff
        if off&0x800000: off-=0x1000000
        if i*4+8+off*4==t: print(hex(i*4), 'bl' if w&0x01000000 else 'b', '->', hex(t))
