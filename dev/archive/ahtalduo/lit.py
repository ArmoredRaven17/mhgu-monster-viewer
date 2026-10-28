"""Print words / floats of main.text at addresses (hex), or a range: python lit.py 10be290 10be2cc"""
import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
a = [int(x, 16) for x in sys.argv[1:]]
rng = range(a[0], a[1], 4) if len(a) == 2 and a[1] > a[0] + 4 and a[1] - a[0] < 0x400 else a
for x in rng:
    w = struct.unpack_from('<I', T, x)[0]; f = struct.unpack_from('<f', T, x)[0]
    print('%08x  %08x  %-14g s32 %d' % (x, w, f, struct.unpack_from('<i', T, x)[0]))
