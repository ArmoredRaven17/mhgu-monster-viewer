import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import shellef
for mon in sys.argv[1:]:
    T = shellef.load_typed(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon))
    for (nm, th) in sorted(T):
        if 'shell' in nm.lower(): print(mon, th, nm, len(T[(nm, th)]))
