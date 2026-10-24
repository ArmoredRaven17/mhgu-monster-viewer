import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); md.skipdata = True
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
pats = sys.argv[3:]
for i in md.disasm(armdis.TEXT[lo:hi], lo):
    s = i.mnemonic + ' ' + i.op_str
    if any(p in s for p in pats) and (i.mnemonic.startswith('str') or i.mnemonic.startswith('vstr') or i.mnemonic.startswith('stm')):
        print('%08x  %s' % (i.address, s))
