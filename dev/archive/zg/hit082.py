"""which (status, number, phase) reach given addresses in the action main (tracec), e.g. Soulseer's e+0xcb45 setter 0x1039678."""
import sys, re, tracec as TR
from unicorn import UC_HOOK_CODE
var = int(sys.argv[1], 0); addrs = [int(x, 16) for x in sys.argv[2].split(',')]
hits = {}
cur = {'k': None}
def h(uc, addr, size, ud):
    hits.setdefault(addr, set()).add(cur['k'])
for a in addrs: TR.mu.hook_add(UC_HOOK_CODE, h, begin=a, end=a)
mots = {}
for st in range(0, 0x12):
    for n in range(0, 0x100):
        for ph in range(0, 5):
            for e in (0, 1):
                cur['k'] = (st, n, ph, e)
                ev = TR.run(var, st, n, ph, e, e, 0, follows=1)
                ms = [re.search(r'MOT (L\d+ M\d+)', x).group(1) for x in ev if 'MOT' in x]
                mots[cur['k']] = ms
for a in addrs:
    ks = sorted(hits.get(a, ()))
    print('%#x:' % a, ' '.join('(%d,%#x)ph%d%s[%s]' % (k[0], k[1], k[2], 'e' if k[3] else '', ','.join(mots[k])) for k in ks[:30]), '...' if len(ks) > 30 else '')
