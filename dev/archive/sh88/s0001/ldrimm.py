# ldrimm.py OFF [lo hi]: every `ldr rT, [rN, #OFF]` (pre-index, no writeback, up) in TEXT
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; off = int(sys.argv[1], 16)
lo = int(sys.argv[2], 16) if len(sys.argv) > 2 else 0; hi = int(sys.argv[3], 16) if len(sys.argv) > 3 else len(T)
for a in range(lo & ~3, min(hi, len(T) - 4), 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0ff00fff) == (0x05900000 | off) and (w >> 28) != 0xf: print('%#x' % a)
