import sys, capstone, re
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
pat = re.compile(sys.argv[3]); A = int(sys.argv[4]) if len(sys.argv)>4 else 6; B = int(sys.argv[5]) if len(sys.argv)>5 else 0
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(TEXT[lo:hi], lo))
for k, i in enumerate(ins):
    if pat.search('%s %s' % (i.mnemonic, i.op_str)):
        for j in ins[max(0,k-B):k+A+1]:
            print('%08x  %-8s %s' % (j.address, j.mnemonic, j.op_str))
        print('--')
