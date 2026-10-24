import sys, zlib
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import arclist, armdis
BASE = 0x159daa0
paths = {}
for arc in sys.argv[3:]:
    ver, rows = arclist.entries(arc)
    for nm, th, comp, dec, off in rows:
        h = (zlib.crc32(nm.lower().encode()) ^ 0xffffffff) & 0xffffffff
        paths.setdefault(h, set()).add((nm, th))
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
for i in range(lo, hi + 1):
    ph, th = armdis.u32(BASE + i * 8), armdis.u32(BASE + i * 8 + 4)
    m = paths.get(ph) or paths.get(ph & 0x7fffffff)
    print('%#x path %#010x type %#010x -> %s' % (i, ph, th, sorted(m) if m else None))
