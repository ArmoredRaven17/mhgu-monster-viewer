import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
from armdis import u32, DATA, DA_VA
# usage: vt.py vtaddr [n] [cmp_vt]
vt = int(sys.argv[1], 16); n = int(sys.argv[2]) if len(sys.argv) > 2 else 92
cmp = int(sys.argv[3], 16) if len(sys.argv) > 3 else None
for i in range(n):
    a = u32(vt + 4*i); b = u32(cmp + 4*i) if cmp else None
    print('+0x%03x  %08x' % (4*i, a) + ('' if b is None else ('   ==' if a == b else '   base %08x' % b)))
