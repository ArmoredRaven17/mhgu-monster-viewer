# blscan.py <lo> <hi> [targets...]: every bl / b in [lo, hi) with its target; with targets, only those (posture setters etc.)
import capstone, sys
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
want = set(int(x, 16) for x in sys.argv[3:])
for i in md.disasm(T[lo:hi], lo):
    if i.mnemonic in ('bl', 'b', 'blx') or i.mnemonic.startswith('b') and i.op_str.startswith('#'):
        if not i.op_str.startswith('#'): continue
        t = int(i.op_str[1:], 16)
        if want and t not in want: continue
        if not want and lo <= t < hi: continue
        print('%x: %s %x' % (i.address, i.mnemonic, t))
