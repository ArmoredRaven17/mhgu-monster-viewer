import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import probe
out = []
for st in range(0, 16):
    for n in range(0, 0x80):
        r = probe.probe('uEm070_00', st, n)
        h = r['hit']
        if 'unhandled' in h or 'return (no motion)' in h: continue
        out.append('(%d, %#x): %s' % (st, n, h))
open('sweep.txt', 'w').write('\n'.join(out))
print(len(out))
