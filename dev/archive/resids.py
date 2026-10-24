import sys, zlib, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import arclist
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad')
from d import u32
BASE = 0x159daa0
ver, rows = arclist.entries(r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em084_00.arc')
paths = {}
for nm, th, comp, dec, off in rows:
    h = (zlib.crc32(nm.lower().encode()) ^ 0xffffffff) & 0xffffffff
    paths.setdefault(h, []).append((nm, th))
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
for i in range(lo, hi + 1):
    ph, th = u32(BASE + i * 8), u32(BASE + i * 8 + 4)
    m = paths.get(ph) or paths.get(ph & 0x7fffffff)
    print('%#x path %#010x type %#010x -> %s' % (i, ph, th, m))
