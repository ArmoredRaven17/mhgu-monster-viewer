"""Disassemble main.text [lo, hi) with capstone skipdata (romdis.py stops at the first data word).
   python dis.py <lo hex> <hi hex>"""
import sys, os, capstone
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
md.skipdata = True
for i in md.disasm(TEXT[lo:hi], lo):
    print('%08x  %-10s %s' % (i.address, i.mnemonic, i.op_str))
