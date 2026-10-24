# blto.py <target hex> [...]: every bl / b (any cond) to the target in main.text
import sys, struct
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
T = {int(a, 16) for a in sys.argv[1:]}
for off in range(0, len(TEXT) - 4, 4):
    w = struct.unpack_from('<I', TEXT, off)[0]
    if (w >> 28) == 0xf or ((w >> 25) & 7) != 5: continue
    imm = w & 0xffffff
    if imm & 0x800000: imm -= 0x1000000
    t = off + 8 + imm * 4
    if t in T: print('%08x %s -> %x' % (off, 'bl' if w & 0x1000000 else 'b', t))
