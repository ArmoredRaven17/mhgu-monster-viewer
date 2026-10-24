import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef
SEP = chr(92)
mon = sys.argv[1]
arc = r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy' + SEP + mon + '.arc'
T = shellef.load_typed(arc)
base = 'shell' + SEP + 'em' + SEP + mon + '_shell02' + SEP + mon + '_02'
print('cmn', shellef.fup(T[(base, '496f8f22')]) if (base, '496f8f22') in T else None)
for m in range(0, 70):
    k = (base + '_ef%03d' % m, '1eb12c38')
    if k not in T: continue
    r = shellef.parse_ef(T[k])
    ef = [[p[0], p[1] if p[1] < 0x80000000 else -1] for prm in r['params'] for p in prm['arr']]
    shk = (base + '_sh%03d' % m, '496f8f22')
    print(m, ef, shellef.fup(T[shk]) if shk in T else None)
