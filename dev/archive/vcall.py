"""vcall.py <off> [lo hi]: every `ldr rT,[rN,#off]` followed within 6 words by `blx rT` (a vcall through slot off)."""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
off = int(sys.argv[1], 16)
lo = int(sys.argv[2], 16) if len(sys.argv) > 2 else 0
hi = int(sys.argv[3], 16) if len(sys.argv) > 3 else len(T)
for a in range(lo, hi - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0ff00fff) == (0x05900000 | off) and (w >> 28) == 0xe:
        rt = (w >> 12) & 0xf
        for k in range(1, 7):
            w2 = struct.unpack_from('<I', T, a + 4 * k)[0]
            if (w2 & 0x0ffffff0) == 0x012fff30 and (w2 & 0xf) == rt:
                print('%08x ldr r%d,[r%d,#%#x] -> blx at %08x' % (a, rt, (w >> 16) & 0xf, off, a + 4 * k))
                break
