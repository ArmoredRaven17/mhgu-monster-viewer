# wdis.py <lo> <hi> [grep..]: word-by-word disassembly (literal pools do not stop it); with patterns, only matching lines
import sys, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16); pats = sys.argv[3:]
for a in range(lo, hi, 4):
    l = list(md.disasm(T[a:a + 4], a)); t = (l[0].mnemonic + ' ' + l[0].op_str) if l else '.word'
    if not pats or any(p in t for p in pats): print('%x: %s' % (a, t))
