import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis as a
T = a.TEXT
off = int(sys.argv[1], 0)
for ad in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, ad)[0]
    if (w & 0x0c400000) == 0x04400000 and (w & 0xfff) == off and (w >> 28) != 0xf and not (w & 0x02000000):
        print('%#x %s %s' % (ad, 'ldrb' if w & 0x100000 else 'strb', a.sweep(ad, ad + 4)[0][2]))
