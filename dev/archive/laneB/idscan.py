# laneB/idscan.py lo hi id[,id..]: every mov / movw / mvn-free immediate of the ids in [lo, hi), with the next 6 instructions
# (a class request id is r1 of vt+0x1cc / vt+0x1d0 or of a wrapper; this lists candidates, the reader reads each)
import sys, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
ids = set(int(x) for x in sys.argv[3].split(','))
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.detail = True; md.skipdata = True
ins = list(md.disasm(armdis.TEXT[lo:hi], lo))
for i, x in enumerate(ins):
    if x.id and x.mnemonic.startswith(('mov', 'movw', 'add', 'sub', 'orr')) and x.operands and x.operands[-1].type == capstone.arm.ARM_OP_IMM and x.operands[-1].imm in ids:
        print('%x  %s %s' % (x.address, x.mnemonic, x.op_str), ' | ', ' ; '.join('%s %s' % (y.mnemonic, y.op_str) for y in ins[i+1:i+7]))
