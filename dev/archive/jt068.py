import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
def tab(base, n):
    return [ (armdis.u32(base+4*i) + base) & 0xffffffff for i in range(n)]
st = tab(0xf79d8c, 11)
for i,t in enumerate(st): print('status', i+1, hex(t))
from collections import defaultdict
for name, base, n, off in (('s7', 0xf79df4, 0x27, 0x17), ('s10', 0xf79ee0, 0xd3, 7)):
    d = defaultdict(list)
    for i,t in enumerate(tab(base, n)): d[t].append(hex(i+off))
    for t in sorted(d): print(name, hex(t), ' '.join(d[t]) if len(d[t]) < 30 else '(%d)' % len(d[t]))
