import sys, struct, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16); pats = sys.argv[3:]
for a in range(lo, hi, 4):
    ins = list(md.disasm(T[a:a+4], a))
    if not ins: continue
    s = ins[0].mnemonic + ' ' + ins[0].op_str
    if any(p in s for p in pats): print(hex(a), s)
