"""Every (status, number) of uEm057_00 through the generic prober (efx/agents/notice-scratch/probe.py), variants 0 / 4:
the first motion it sets and e+0xb5f8 as the action left it at that point.  python allact.py <variant> [statuses]"""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import probe as PR
var = int(sys.argv[1], 0)
sts = [int(x, 0) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else list(range(0, 0x15))
for st in sts:
    for n in range(0, 0x100):
        r = PR.probe('uEm057_00', st, n, 57, var)
        b = PR.mu.mem_read(PR.E + 0xb5f8, 1)[0]
        h = r['hit']
        if h.startswith('unhandled') or h == 'return (no motion)':
            continue
        print('(%d, %#04x) b5f8=%d  %s' % (st, n, b, h))
