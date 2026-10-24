import sys, numpy as np, capstone; sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
T=armdis.TEXT; W=np.frombuffer(T[:len(T)//4*4],dtype='<u4')
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
# ldr rX, [rY, #0x1d0]: cond 0101 1001 Rn Rt imm12 (P=1,U=1,W=0,L=1)
idx=np.nonzero(((W & 0x0ff00fff)==0x059001d0))[0]
for i in idx:
    a=int(i)*4
    if not (lo<=a<hi): continue
    seg=list(md.disasm(T[a-40:a+16], a-40))
    s=' ; '.join('%s %s'%(x.mnemonic,x.op_str) for x in seg)
    import re
    ids=re.findall(r'(?:movw|mov)\S* r1, #(0x3[ef][0-9a-f])', s)
    if ids and 'blx' in s: print(hex(a), ids)
