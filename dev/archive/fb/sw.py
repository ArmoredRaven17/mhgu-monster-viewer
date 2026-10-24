import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
for a, m, o in armdis.sweep(lo, hi):
    w = armdis.TEXT[a:a+4]; fl = struct.unpack('<f', w)[0]
    print('%08x  %-7s %s%s' % (a, m, o, ('   ; f=%g' % fl) if abs(fl) > 1e-6 and abs(fl) < 1e7 else ''))
