import capstone, sys
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
md=capstone.Cs(capstone.CS_ARCH_ARM,capstone.CS_MODE_ARM)
def ins(a):
    return next(md.disasm(T[a:a+4],a),None)
def dis(lo,hi):
    out=[]
    for a in range(lo,hi,4):
        i=ins(a)
        out.append((a, (i.mnemonic+' '+i.op_str) if i else '.word 0x%08x'%int.from_bytes(T[a:a+4],'little')))
    return out
if __name__=='__main__':
    lo=int(sys.argv[1],16); hi=int(sys.argv[2],16) if len(sys.argv)>2 else lo+0x40
    for a,s in dis(lo,hi): print(hex(a),s)
