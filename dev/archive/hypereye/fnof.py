# hypereye/fnof.py (hyper-eye lane, 2026-10-27): for each address, the enclosing function's start (the nearest `push {.., lr}` /
# `stmdb sp!` at or before it, a heuristic: check the listing), its BL callers, and every .rodata / .data word equal to it (vtable slots).
#   python dev/archive/hypereye/fnof.py <addr hex> ...
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D
T = D.TEXT
def start(a):
    for b in range(a & ~3, max(0, a - 0x4000), -4):
        w = struct.unpack_from('<I', T, b)[0]
        if (w & 0xffff4000) == 0xe92d4000: return b          # push {..., lr}
    return None
def callers(t):
    out = []
    for a in range(0, len(T) - 4, 4):
        w = struct.unpack_from('<I', T, a)[0]
        if (w >> 25) & 7 != 5: continue
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        d = a + 8 + (off << 2)
        if w >> 28 == 0xf: d += ((w >> 24) & 1) << 1
        elif not (w >> 24) & 1: continue
        if d == t: out.append(a)
    return out
def words(t):
    out = []
    for name, buf, va in (('rodata', D.RODATA, D.RO_VA), ('data', D.DATA, D.DA_VA)):
        for o in range(0, len(buf) - 3, 4):
            if struct.unpack_from('<I', buf, o)[0] == t: out.append('%s %08x' % (name, va + o))
    return out
for s in sys.argv[1:]:
    a = int(s, 16); f = start(a)
    print('%08x in fn %s callers %s words %s' % (a, hex(f) if f is not None else '?', [hex(c) for c in callers(f)] if f else [], words(f) if f else []))
