import sys, struct, numpy as np
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
T = armdis.TEXT
W = np.frombuffer(T[:len(T)//4*4], dtype='<u4')
targets = set(int(a,16) for a in sys.argv[1:])
idx = np.nonzero((W & 0x0FFF0FF0) == 0x079F0000)[0]
for i in idx:
    w = int(W[i]); rd=(w>>12)&15; rm=w&15; a=i*4
    for j in range(i-1, max(i-24,0), -1):
        v=int(W[j])
        if (v & 0x0F7F0000)==0x051F0000 and ((v>>12)&15)==rm:
            imm=v&0xfff; imm = imm if v&(1<<23) else -imm
            lit=armdis.u32(j*4+8+imm)
            slot=(a+8+lit)&0xffffffff
            if slot in targets: print(hex(a), hex(slot), 'r%d'%rd)
            break
