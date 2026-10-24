"""every b / bl / blx(imm) in main.text whose target is one of the given addresses (raw encoding).
usage: callers.py ADDR [ADDR ...]"""
import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
targets = {int(x, 0) for x in sys.argv[1:]}
for a in range(0, len(T) - 3, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0e000000) != 0x0a000000:
        continue
    off = w & 0xffffff
    if off & 0x800000: off -= 0x1000000
    t = a + 8 + off * 4
    if (w >> 28) == 0xf:
        t += 2 if (w >> 24) & 1 else 0
        kind = 'blx'
    else:
        kind = 'bl' if (w >> 24) & 1 else 'b'
    if t in targets:
        print('%08x %-3s -> %08x  cond %x' % (a, kind, t, w >> 28))
