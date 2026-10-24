import sys, capstone
T = open('C:/MHGU-ROM/exefs/main.text','rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def dis(lo, hi):
    out=[]
    a=lo
    while a<hi:
        ins=list(md.disasm(T[a:a+4],a))
        out.append((a, ins[0].mnemonic+' '+ins[0].op_str if ins else '.word 0x%08x'%int.from_bytes(T[a:a+4],'little')))
        a+=4
    return out
if __name__=='__main__':
    lo,hi=int(sys.argv[1],0),int(sys.argv[2],0)
    for a,s in dis(lo,hi): print('%x  %s'%(a,s))
