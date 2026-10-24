import sys, struct, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from d import DATA, DA_VA, RODATA, RO_VA
for a in sys.argv[1:]:
    v = int(a, 16); t = struct.pack('<I', v)
    for nm, B, base in (('data', DATA, DA_VA), ('ro', RODATA, RO_VA)):
        i = B.find(t); n = 0
        while i >= 0 and n < 400:
            if i % 4 == 0: print('%#x in %s at %#x' % (v, nm, base + i)); n += 1
            i = B.find(t, i + 1)
