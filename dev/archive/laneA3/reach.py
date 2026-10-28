# a3_reach.py <set>... : does a recorder set's block coverage reach the factory's zero-generator test 0x9bb30c and the build 0x9bb330?
import json, sys, os
V = r'C:\MHGU-Extract\efx\vectors'
for s in sys.argv[1:]:
    p = os.path.join(V, s, 'draw.json')
    if not os.path.exists(p): print(s, 'NO SET'); continue
    d = json.load(open(p)); b = json.load(open(p + '.blocks'))['blocks']
    allb = set(x for v in b.values() for x in v)
    print('%-34s %-20s 0x9bb30c %-5s 0x9bb330 %-5s' % (s, d['file'], 0x9bb30c in allb, 0x9bb330 in allb))
