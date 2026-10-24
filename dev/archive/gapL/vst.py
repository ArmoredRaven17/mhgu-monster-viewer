# vst.py <off> [lo hi]: vstr / vstm-free VFP stores [rN, #off] (imm8*4, U=1)
import sys, struct, os
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
off = int(sys.argv[1], 0); lo = int(sys.argv[2], 0); hi = int(sys.argv[3], 0)
W = struct.unpack_from('<%dI' % ((hi - lo) // 4), T, lo)
for i, w in enumerate(W):
    if (w >> 28) != 0xf and (w & 0x0f300e00) == 0x0d000a00 and (w >> 23) & 1 and (w & 0xff) * 4 == off:
        print('%#x vstr #%#x' % (lo + 4 * i, off))
