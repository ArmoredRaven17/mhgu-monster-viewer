# opscan.py LO HI REGEX: capstone sweep of [LO, HI), print instructions whose "mnemonic op_str" matches REGEX
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import capstone
from armdis import TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi, rx = int(sys.argv[1], 16), int(sys.argv[2], 16), re.compile(sys.argv[3])
for a in range(lo & ~3, hi, 4):
    ins = next(md.disasm(TEXT[a:a+4], a), None)
    if ins and rx.search(ins.mnemonic + ' ' + ins.op_str): print('%08x  %s %s' % (a, ins.mnemonic, ins.op_str))
