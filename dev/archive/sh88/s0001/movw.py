# movw.py IMM [lo hi]: every `movw rX, #IMM` in TEXT within [lo, hi)
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; imm = int(sys.argv[1], 16)
lo = int(sys.argv[2], 16) if len(sys.argv) > 2 else 0; hi = int(sys.argv[3], 16) if len(sys.argv) > 3 else len(T)
enc = ((imm >> 12) << 16) | (imm & 0xfff)
for a in range(lo & ~3, min(hi, len(T) - 4), 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0ff00000) == 0x03000000 and (w & 0x000f0fff) == enc and (w >> 28) != 0xf: print('%#x r%d' % (a, (w >> 12) & 15))
