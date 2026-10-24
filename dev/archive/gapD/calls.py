# every b / bl to TARGET in [lo, hi)
import struct, sys
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
tg = int(sys.argv[1], 16); lo, hi = int(sys.argv[2], 16), int(sys.argv[3], 16)
out = []
for a in range(lo, hi, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 25) & 7 == 5 and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        if a + 8 + off * 4 == tg: out.append(hex(a))
print(len(out), ' '.join(out))
