import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
for a in sys.argv[1:]:
    va = int(a, 16); w = armdis.u32(va)
    print('%08x  %08x  %r' % (va, w, struct.unpack('<f', struct.pack('<I', w))[0]))
