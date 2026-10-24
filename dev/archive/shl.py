import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef
mon = sys.argv[1]
arc = r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon)
files = shellef.load(arc)
pat = re.compile(rb'effect\\pel\\em\\([a-z0-9_]+)')
for nm, (th, b) in sorted(files.items()):
    if 'shell' in nm.lower() or th in ('4aa69872', '1eb12c38'):
        extra = ''
        if th == '4aa69872':
            extra = str([m.group(1).decode() for m in pat.finditer(b)])
        if th == '1eb12c38':
            extra = str([p['arr'] for p in shellef.parse_ef(b)['params']])
        print(th, nm, extra)
