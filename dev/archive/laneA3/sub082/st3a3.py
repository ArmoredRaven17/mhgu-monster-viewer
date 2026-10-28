# raw-encoding scan: strb/strh/str rX, [rY, #off] (imm12 form, P=1 U=1) and ldrb with that offset, for offsets in argv
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; n = len(T) // 4
W = struct.unpack('<%dI' % n, T[:n * 4])
offs = [int(x, 16) for x in sys.argv[1:]]
for i, w in enumerate(W):
    if (w >> 28) != 0xe: continue
    if ((w >> 25) & 7) == 2 and (w >> 24) & 1 and (w >> 23) & 1:   # single data transfer, imm, P=1 U=1
        L = (w >> 20) & 1; B = (w >> 22) & 1
        if (w & 0xfff) in offs and not L:
            print('%08x %s r%d, [r%d, #%#x]' % (i*4, 'strb' if B else 'str', (w>>12)&15, (w>>16)&15, w & 0xfff))
    # strh imm: cond 000P U1W0 Rn Rt imm4H 1011 imm4L
    if (w & 0x0e5000f0) == 0x004000b0 and (w >> 24) & 1:
        off = ((w >> 4) & 0xf0) | (w & 0xf)
        if off in offs: print('%08x strh r%d, [r%d, #%#x]' % (i*4, (w>>12)&15, (w>>16)&15, off))
