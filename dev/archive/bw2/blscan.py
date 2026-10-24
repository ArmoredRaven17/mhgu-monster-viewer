# every b/bl/blx-immediate in [lo,hi) to one of the targets
import sys, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
want = {int(x, 16) for x in sys.argv[3].split(',')}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
for i in md.disasm(T[lo:hi], lo):
    if i.mnemonic.startswith('b') and i.op_str.startswith('#'):
        t = int(i.op_str[1:], 16)
        if t in want: print('%x  %s %s' % (i.address, i.mnemonic, i.op_str))
