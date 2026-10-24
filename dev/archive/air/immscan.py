import sys, struct, capstone, re
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\held')
import d
T = d.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
pat = sys.argv[1]   # regex on 'mnemonic op_str'
lo = int(sys.argv[2],16) if len(sys.argv)>2 else 0
hi = int(sys.argv[3],16) if len(sys.argv)>3 else len(T)
rx = re.compile(pat)
for va in range(lo, hi, 4):
    ins = list(md.disasm(T[va:va+4], va))
    if not ins: continue
    s = ins[0].mnemonic + ' ' + ins[0].op_str
    if rx.search(s): print('%x: %s' % (va, s))
