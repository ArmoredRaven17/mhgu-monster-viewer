"""Direct bl/b/blx callers of target(s) across main.text. python callers.py T [T...]"""
import sys, struct
sys.path.insert(0, __file__.rsplit('\\', 1)[0])
from d import TEXT
ts = {int(x, 16) for x in sys.argv[1:]}
for va in range(0, len(TEXT) - 4, 4):
    w = struct.unpack_from('<I', TEXT, va)[0]
    if (w >> 25) & 7 == 5:
        cond = w >> 28
        off = w & 0xFFFFFF
        if off & 0x800000: off -= 0x1000000
        t = va + 8 + off * 4
        if cond == 0xF: t += ((w >> 24) & 1) * 2
        if t in ts:
            kind = 'blx' if cond == 0xF else ('bl' if (w >> 24) & 1 else 'b')
            print('%08x: %s%s #0x%x' % (va, kind, '' if cond in (0xE, 0xF) else '(c%x)' % cond, t))
