import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import probe
cls = sys.argv[1]
for st in [int(x,0) for x in sys.argv[2].split(',')]:
    for n in range(0, int(sys.argv[3],0)):
        for pos in (0, 1):
            r = probe.probe(cls, st, n, posture=pos)
            print('(%d, %#x) posture %d: %s' % (st, n, pos, r['hit']))
