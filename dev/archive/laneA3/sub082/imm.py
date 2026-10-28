# list every instruction in [lo,hi) carrying one of the given immediates exactly (#imm not followed by a hex digit)
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
pats = [re.compile('#' + p + r'(?![0-9a-fx])') for p in sys.argv[3:]]
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
for a in range(lo, hi, 4):
    ins = list(md.disasm(armdis.TEXT[a:a+4], a))
    if not ins: continue
    if ins[0].mnemonic.startswith('b'): continue
    s = ins[0].mnemonic + ' ' + ins[0].op_str
    if any(p.search(s) for p in pats):
        print('%08x  %s' % (a, s))
