import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import probe
cls = sys.argv[1]; em = int(sys.argv[2], 0); var = int(sys.argv[3], 0)
for st in [int(x, 0) for x in sys.argv[4].split(',')]:
    for n in range(256):
        r = probe.probe(cls, st, n, em, var)
        h = r['hit']
        if 'default' in h and '(0x76088)' in h: continue
        print('(%d, %#04x) %s' % (st, n, h))
