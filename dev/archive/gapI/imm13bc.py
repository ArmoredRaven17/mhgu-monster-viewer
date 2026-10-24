import sys, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
imm = int(sys.argv[1], 16)
lo, hi = int(sys.argv[2],16), int(sys.argv[3],16)
for a in range(lo, hi, 4):
    w = T[a:a+4]
    for i in md.disasm(w, a):
        if ('#0x%x' % imm) in i.op_str:
            print('%08x %s %s' % (a, i.mnemonic, i.op_str))
