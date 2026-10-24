"""Every op-0x00 (status, number) in em037's command table (em037_04.arc's copy; byte-identical to em037_00.arc's)."""
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import emc
from collections import defaultdict
ver, G = emc.load(r'C:\MHGU-Extract\scratch-em\em037_04\enemy\cmd_tbl\em037_00_cmdtbl.emc')
hits = defaultdict(list)
for g, st in enumerate(G):
    for k, s in enumerate(st):
        for op in emc.parse(s):
            b = op.split()
            if b[0] == '00' and len(b) == 3: hits[(int(b[1], 16), int(b[2], 16))].append('g%ds%d' % (g, k))
want = set(int(x, 16) for x in sys.argv[1:])
for key in sorted(hits):
    if key[0] == 7 and (not want or key[1] in want): print('(7,%#04x)' % key[1], len(hits[key]), ' '.join(hits[key][:20]))
if len(sys.argv) > 1 and sys.argv[1] == 'dump':
    pass
