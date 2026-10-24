import sys, struct, capstone
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo,hi=int(sys.argv[1],16),int(sys.argv[2],16)
for a in range(lo,hi,4):
    l=list(md.disasm(T[a:a+4],a))
    w=struct.unpack_from('<I',T,a)[0]
    print('%08x  %08x  %s' % (a,w,(l[0].mnemonic+' '+l[0].op_str) if l else '.word'))
