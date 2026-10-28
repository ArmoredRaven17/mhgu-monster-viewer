import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis as a
T = a.TEXT
lo, hi = int(sys.argv[2], 16), int(sys.argv[3], 16)
v = int(sys.argv[1], 0)
for ad in range(lo, hi, 4):
    w = struct.unpack_from('<I', T, ad)[0]
    if (w & 0x0ff00000) == 0x03000000 and (((w >> 4) & 0xf000) | (w & 0xfff)) == v:
        ctx = a.sweep(ad, ad + 16)
        print('%#x' % ad, ' | '.join('%s %s' % (m, o) for _, m, o in ctx))
