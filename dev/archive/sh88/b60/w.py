import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
from armdis import u32
base = int(sys.argv[1], 16); n = int(sys.argv[2]); rel = int(sys.argv[3], 16) if len(sys.argv) > 3 else None
for i in range(n):
    w = u32(base + 4*i)
    print(hex(base+4*i), hex(w), struct.unpack('<f', struct.pack('<I', w))[0], ('-> %#x' % ((rel + w) & 0xffffffff)) if rel is not None else '')
