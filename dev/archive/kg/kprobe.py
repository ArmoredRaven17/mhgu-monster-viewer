import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import probe as P
cls = sys.argv[1]; em = int(sys.argv[2]); sts = [int(x) for x in sys.argv[3].split(',')]
posts = [int(x) for x in (sys.argv[4] if len(sys.argv) > 4 else '0').split(',')]
for st in sts:
    for n in range(0, 0x60):
        for po in posts:
            r = P.probe(cls, st, n, em, 0, posture=po)
            print('(%d, %#04x) post %d: %s' % (st, n, po, r['hit']))
