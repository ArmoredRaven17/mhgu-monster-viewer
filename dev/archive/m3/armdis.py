import sys, capstone
t=open('C:/MHGU-ROM/exefs/main.text','rb').read()
md=capstone.Cs(capstone.CS_ARCH_ARM,capstone.CS_MODE_ARM)
a=int(sys.argv[1],16); b=int(sys.argv[2],16)
for i in md.disasm(t[a:b],a):
    print('%08x: %s %s'%(i.address,i.mnemonic,i.op_str))
