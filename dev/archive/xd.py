import sys, os, struct, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
for ins in md.disasm(armdis.TEXT[lo:hi], lo):
    note=''
    if ins.mnemonic=='ldr' and '[pc, #' in ins.op_str:
        off=int(ins.op_str.split('#')[1].rstrip(']'),16)
        lit=armdis.u32(ins.address+8+off); note='; lit 0x%x'%lit if lit is not None else ''
    print('%08x  %-8s %s %s'%(ins.address, ins.mnemonic, ins.op_str, note))
