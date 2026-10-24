import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo = int(sys.argv[1], 16); hi = int(sys.argv[2], 16)
for a, mn, op in armdis.sweep(lo, hi):
    print('%08x  %-8s %s' % (a, mn, op))
