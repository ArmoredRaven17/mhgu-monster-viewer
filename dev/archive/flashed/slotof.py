"""slotof.py <addr hex> ... -- the function holding each address (nearest preceding 'push {..lr}'; I), and every vtable slot of a
class in efx/class-effects.json that points at it (vtable + slot). Flashed read 2026-10-25."""
import sys, json, struct
from owner import fstart
from d import DA, DA_VA
d = json.load(open(r'C:\MHGU-Extract\efx\class-effects.json'))['classes']
for x in sys.argv[1:]:
    a = int(x, 16); f = fstart(a); w = struct.pack('<I', f); hits = []
    k = DA.find(w)
    while k >= 0:
        va = DA_VA + k
        for v in d:
            vt = int(v['vtable'], 16) if v.get('vtable') else None
            if vt and vt <= va < vt + 0x600: hits.append('%s vt+%#x' % (v['class'], va - vt))
        k = DA.find(w, k + 1)
    print(x, 'fn %#x' % f, hits)
