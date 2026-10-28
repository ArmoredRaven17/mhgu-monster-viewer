"""blsites.py <target hex> ... -- every BL / B to the targets in main.text (ARM, by encoding, word by word). Flashed read 2026-10-25."""
import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
tg = {int(x, 16) for x in sys.argv[1:]}
n = len(T) // 4
W = struct.unpack('<%dI' % n, T[:n*4])
for i, w in enumerate(W):
    if (w >> 25) & 7 != 5: continue
    if w >> 28 == 0xf: continue
    off = w & 0xffffff
    if off & 0x800000: off -= 0x1000000
    dst = i*4 + 8 + off*4
    if dst in tg: print('%08x %s %08x' % (i*4, 'bl' if w & (1<<24) else 'b ', dst))
