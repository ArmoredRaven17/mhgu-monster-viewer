"""python dis.py <addr hex> <count>  -- capstone ARM dump from main.text"""
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
a = int(sys.argv[1], 16); n = int(sys.argv[2])
for i in md.disasm(armdis.TEXT[a:a + 4 * n], a): print('%#x %s %s' % (i.address, i.mnemonic, i.op_str))
