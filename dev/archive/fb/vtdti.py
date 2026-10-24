# vtdti.py <dti hex> (2026-10-19): the vtables whose getDTI thunk (+0x14: ldr r0,[pc,#k]; ldr r0,[pc,r0]; bx lr) returns that DTI, and
# their first slots -- a shell class's vtable from shelltable.json's cls.dti
import sys, struct
DTI = int(sys.argv[1], 16)
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
D = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); DA = 0x1728000
w = lambda va: struct.unpack_from('<I', D, va - DA)[0] if DA <= va < DA + len(D) - 4 else None
def thunk(fn):
    if fn is None or fn + 12 > len(T): return None
    a, b, c = struct.unpack_from('<3I', T, fn)
    if (a & 0xffff0000) != 0xe59f0000 or c != 0xe12fff1e: return None
    lit = fn + 8 + (a & 0xfff); off = struct.unpack_from('<I', T, lit)[0]
    got = (fn + 4 + 8 + off) & 0xffffffff
    return w(got)
for o in range(0, len(D) - 0x180, 4):
    vt = DA + o
    t = w(vt + 0x14)
    if t and thunk(t) == DTI:
        print(hex(vt), ' '.join('%x:%x' % (s, w(vt + s)) for s in range(0x13c, 0x178, 4)))
