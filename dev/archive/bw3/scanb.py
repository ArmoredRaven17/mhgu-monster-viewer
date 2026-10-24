import sys, capstone, re
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
pat = re.compile(sys.argv[3])
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
for i in md.disasm(TEXT[lo:hi], lo):
    s = '%s %s' % (i.mnemonic, i.op_str)
    if pat.search(s): print('%08x  %s' % (i.address, s))
