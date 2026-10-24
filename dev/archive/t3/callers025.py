import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; D = armdis.DATA
LO, HI = 0xdfee0c, 0xe10054
tg = [int(x, 16) for x in sys.argv[1:]]
for t in tg:
    out = []
    for a in range(LO, HI, 4):
        w = struct.unpack_from('<I', T, a)[0]
        if (w >> 25) & 7 == 5 and (w >> 28) != 0xf:
            off = w & 0xffffff; off = off - (1 << 24) if off & 0x800000 else off
            if a + 8 + off * 4 == t: out.append('%s %#x' % ('bl' if (w >> 24) & 1 else 'b', a))
    for o in range(0, len(D) - 4, 4):
        if struct.unpack_from('<I', D, o)[0] == t: out.append('data %#x' % (armdis.DA_VA + o))
    print(hex(t), out)
