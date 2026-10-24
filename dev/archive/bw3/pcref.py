import capstone, struct, sys
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
lo,hi,tlo,thi=[int(x,16) for x in sys.argv[1:5]]
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata=True
lits={}
for i in md.disasm(T[lo:hi],lo):
    if i.mnemonic=='ldr' and i.op_str.count('[pc, #')==1:
        r=i.op_str.split(',')[0]; off=int(i.op_str.split('#')[1].rstrip(']'),16)
        a=i.address+8+off
        if a+4<=len(T): lits[r]=(struct.unpack('<i',T[a:a+4])[0], i.address)
    elif i.mnemonic=='add' and ', pc, ' in i.op_str:
        p=[x.strip() for x in i.op_str.split(',')]
        if p[2] in lits:
            v=(i.address+8+lits[p[2]][0])&0xffffffff
            if tlo<=v<thi: print(hex(i.address), hex(v))
