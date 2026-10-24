import capstone, sys, re
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
md=capstone.Cs(capstone.CS_ARCH_ARM,capstone.CS_MODE_ARM)
lo,hi=int(sys.argv[1],16),int(sys.argv[2],16)
pat=re.compile(sys.argv[3])
a=lo
while a<hi:
    n=0
    for i in md.disasm(T[a:hi],a):
        n+=1; s=i.mnemonic+' '+i.op_str
        if pat.search(s): print(hex(i.address),s)
        a=i.address+4
    if n==0: a+=4
