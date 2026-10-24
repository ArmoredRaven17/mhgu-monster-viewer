import sys; sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis, capstone
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
for a in range(lo, hi, 4):
    for i in md.disasm(armdis.TEXT[a:a+4],a): print('%x %s %s'%(i.address,i.mnemonic,i.op_str))
