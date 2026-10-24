import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
VT = {'04_01(shell01_02)': 0x17ed8a8, '04_02(beam)': 0x17eda18, '04_11': 0x17edb94, '04_50': 0x17edd08,
      'sp_00': 0x17ede90, 'sp_01': 0x17ee00c, 'sp_14': 0x17ee17c, 'sp_15': 0x17ee2f8, 'uEm081_00': 0x17ec1b0}
lo, hi = 0x101108c, 0x1040000
for n, v in VT.items():
    own = []
    for i in range(0, 0x500, 4):
        w = armdis.u32(v + i)
        if w is not None and lo <= w < hi:
            own.append('+%#x=%#x' % (i, w))
    print(n, hex(v), ' '.join(own if n != 'uEm081_00' else own[:0]))
# also: which vtable slots point at given functions
for f in sys.argv[1:]:
    t = int(f, 16)
    hits = []
    for n, v in VT.items():
        for i in range(0, 0x600, 4):
            if armdis.u32(v + i) == t: hits.append('%s+%#x' % (n, i))
    print(f, hits)
