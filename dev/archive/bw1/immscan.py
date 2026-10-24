"""Scan main.text [lo, hi) for instructions naming an immediate (any operand text containing it).
   python immscan.py <lo hex> <hi hex> <imm hex> [<imm hex> ...]"""
import sys, capstone
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
imms = [int(x, 16) for x in sys.argv[3:]]
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
md.skipdata = True
pats = {i: ('#0x%x' % i) for i in imms}
cnt = {i: 0 for i in imms}
for ins in md.disasm(TEXT[lo:hi], lo):
    s = ins.op_str
    for i, p in pats.items():
        if s.endswith(p) or (p + ']') in s or (p + ',') in s or (p + '!') in s:
            print('%08x  %-8s %s' % (ins.address, ins.mnemonic, s)); cnt[i] += 1
print({hex(k): v for k, v in cnt.items()})
