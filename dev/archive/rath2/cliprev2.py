# reverse index clip -> actions for em002_0X from the Rathian-variants agent's ROM-run sweeps (read-only)
import json, collections, sys
D = r'C:\MHGU-Extract\efx\agents\rathian-variants-scratch'
mon = sys.argv[1]; want = [int(x, 16) for x in sys.argv[2:]]
acts = {}
a3 = json.load(open(D + r'\actions3_%s.json' % mon))
for k, x in a3.items():
    s, n = map(int, k.split(',')); acts[(s, n)] = x
for f in ('actions2_%s_r5_s1.json' % mon,):
    a2 = json.load(open(D + chr(92) + f))
    for k, x in a2.items(): acts[(7, int(k))] = x
rev = collections.defaultdict(list)
for (s, n), x in sorted(acts.items()):
    for k, mid, st, fr in x.get('motions', []):
        if mid in want: rev[mid].append('(%d,%#x)@%d%s%s' % (s, n, k, '' if st == 0 else ' f%g' % st, '' if fr is not None else ' ABSENT'))
for m in want:
    seen = []
    for e in rev[m]:
        if e not in seen: seen.append(e)
    print('L%d M%d: %s' % (m >> 8, m & 0xff, ' '.join(seen) or '-'))
