import sys, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
T=armdis.TEXT
base=0x1023a9c
res={}
for i in range(0xf4):
    off=armdis.u32(base+4*i); stub=(base+off)&0xffffffff
    # follow stub: collect mov r1/r2 #imm until a b/bl/pop
    regs={}; a=stub; tgt=None; steps=0
    while steps<12:
        ins=next(md.disasm(T[a:a+4],a)); m,o=ins.mnemonic,ins.op_str
        if m=='mov' and o.startswith(('r1, #','r2, #','r3, #')):
            regs[o[:2]]=int(o.split('#')[1],0)
        if m=='movw' and o.startswith(('r1, #','r2, #')): regs[o[:2]]=int(o.split('#')[1],0)
        if m in ('b','bl') and '#' in o:
            t=int(o.split('#')[1],16)
            if m=='b' and t-a<0x400 and t>a and t<0x1024f00:  # local jump within stubs
                a=t; steps+=1; continue
            tgt=(m,t); break
        if m=='bx' or (m.startswith('pop') and 'pc' in o): tgt=(m,None); break
        a+=4; steps+=1
    res[i+1]=(stub,regs,tgt)
for n,(stub,regs,tgt) in res.items():
    print('(7,%#04x) stub %#x %s -> %s'%(n,stub,regs,(tgt[0], hex(tgt[1]) if tgt[1] else None) if tgt else None))
