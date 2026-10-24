import sys, struct, capstone
EX=r'C:\MHGU-ROM\exefs'
T=open(EX+r'\main.text','rb').read()
R=open(EX+r'\main.rodata','rb').read()
D=open(EX+r'\main.data','rb').read()
RO,DA=0x13EF000,0x1728000
md=capstone.Cs(capstone.CS_ARCH_ARM,capstone.CS_MODE_ARM)
def rd(va,n=4):
    if 0<=va<len(T): return T[va:va+n]
    if RO<=va<RO+len(R): return R[va-RO:va-RO+n]
    if DA<=va<DA+len(D): return D[va-DA:va-DA+n]
    return b''
def u32(va):
    b=rd(va); return struct.unpack('<I',b)[0] if len(b)==4 else None
def dis(lo,n):
    out=[]
    for a in range(lo,lo+4*n,4):
        w=T[a:a+4]
        l=list(md.disasm(w,a))
        if l:
            i=l[0]; note=''
            if i.mnemonic.startswith('ldr') and '[pc, #' in i.op_str:
                try:
                    off=int(i.op_str.split('#')[-1].rstrip(']'),0); note=' ; =0x%x'%u32(a+8+off)
                except: pass
            out.append('%x: %s %s%s'%(a,i.mnemonic,i.op_str,note))
        else: out.append('%x: .word 0x%08x'%(a,struct.unpack('<I',w)[0]))
    return out
def callers(tgt):
    res=[]
    for a in range(0,len(T)-3,4):
        w=struct.unpack_from('<I',T,a)[0]
        if (w>>25)&7==5:  # B/BL
            off=w&0xffffff
            if off&0x800000: off-=0x1000000
            if a+8+off*4==tgt: res.append((a,(w>>24)&1,w>>28))
    return res
if __name__=='__main__':
    cmd=sys.argv[1]
    if cmd=='dis': print('\n'.join(dis(int(sys.argv[2],16),int(sys.argv[3]))))
    elif cmd=='callers':
        for a,l,c in callers(int(sys.argv[2],16)): print('%x %s cond%x'%(a,'bl' if l else 'b',c))
