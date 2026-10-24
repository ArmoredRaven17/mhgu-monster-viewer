import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
out = open(sys.argv[3], 'w')
for a, m, o in armdis.sweep(lo, hi):
    out.write('%08x  %-7s %s\n' % (a, m, o))
