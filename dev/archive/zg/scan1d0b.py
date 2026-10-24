import sys, re, numpy as np, capstone; sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
T=armdis.TEXT; W=np.frombuffer(T[:len(T)//4*4],dtype='<u4')
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
idx=np.nonzero(((W & 0x0ff00fff)==0x059001d0))[0]
n=0
for i in idx:
    a=int(i)*4
    if a >= 0xc90000: continue
    seg=list(md.disasm(T[a:a+20], a))
    rt=seg[0].op_str.split(',')[0]
    blx=[x for x in seg[1:] if x.mnemonic.startswith('blx') and x.op_str==rt]
    if not blx: continue
    pre=list(md.disasm(T[a-40:a], a-40))
    s=' ; '.join('%s %s'%(x.mnemonic,x.op_str) for x in pre+seg)
    m=re.findall(r'(?:movw|mov)\S* r1, #(0x[0-9a-f]+)', s)
    print(hex(a), m, '' if m else s[-160:]); n+=1
print(n)
