# callers of every shell-making helper in uEm083_00's band; each caller's containing function = the greatest function entry
# (a bl/b/blx-target or vtable slot in the band, or a push) <= the call
import re
B = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\band_uEm083_00.txt'
L = []
for ln in open(B):
    p = ln.split(None, 2)
    try: L.append((int(p[0], 16), p[1], p[2].strip() if len(p) > 2 else ''))
    except Exception: pass
H = [0x105f1a8, 0x105f4ac, 0x105f76c, 0x105f94c, 0x105faec, 0x105fcfc, 0x105fd94, 0x10601fc, 0x1060304, 0x106040c, 0x1060844, 0x1060894,
     0x106099c, 0x1060aa4, 0x1060be8, 0x1060c9c, 0x1060d4c, 0x1060e28, 0x10606f4]
ent = sorted(set(a for a, m, o in L if m == 'push' and 'lr' in o))
import bisect
def fn(a): return ent[bisect.bisect_right(ent, a) - 1]
for h in H:
    cs = [a for a, m, o in L if m in ('bl', 'b', 'blne', 'bleq', 'beq', 'bne') and o == '#0x%x' % h]
    print('%x <-' % h, ', '.join('%x (fn %x)' % (c, fn(c)) for c in cs) or 'NONE (vtable / pointer?)')
