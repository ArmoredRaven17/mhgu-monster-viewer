# dis.py <addr> [before] [after]: ARM disassembly of main.text around an address
import capstone, sys
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
a = int(sys.argv[1], 16); b = int(sys.argv[2]) if len(sys.argv) > 2 else 40; c = int(sys.argv[3]) if len(sys.argv) > 3 else 8
lo = a - 4 * b; hi = a + 4 * c
for i in md.disasm(T[lo:hi], lo):
    print('%s%x: %s %s' % ('>' if i.address == a else ' ', i.address, i.mnemonic, i.op_str))
