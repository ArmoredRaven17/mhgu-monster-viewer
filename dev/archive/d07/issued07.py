# every (status, number) issued by op 0x00 in an .emc, with the streams that issue it
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\state-scratch')
import emc
ver, groups = emc.load(sys.argv[1])
seen = {}
for g, ss in enumerate(groups):
    for k, s in enumerate(ss):
        for o in emc.parse(s):
            b = o.split(' ')
            if len(b) == 3 and b[0] == '00':
                seen.setdefault((int(b[1], 16), int(b[2], 16)), []).append('g%d s%d' % (g, k))
for (st, n), w in sorted(seen.items()):
    print('(%d, %#x): %s' % (st, n, ' '.join(w[:8]) + (' ...%d' % len(w) if len(w) > 8 else '')))
