# wbl.py <lo> <hi> [targets...]: every B / BL in [lo, hi) decoded word by word (literal pools do not stop it), optionally only to targets
import struct, sys
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
want = set(int(x, 16) for x in sys.argv[3:])
for a in range(lo, hi, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 25) & 7 == 5 and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        t = a + 8 + off * 4
        if want and t not in want: continue
        print('%x: %s %x' % (a, 'bl' if w & (1 << 24) else 'b', t))
