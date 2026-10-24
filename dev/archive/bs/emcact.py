# every stream op naming (status, number) as its last two bytes, op 0x00 / 0x24 forms; read-only
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\basarios-scratch')
import emc
ver, groups = emc.load(sys.argv[1])
want = set()
for a in sys.argv[2:]:
    s, n = a.split(','); want.add((int(s, 0), int(n, 0)))
for g, ss in enumerate(groups):
    for k, s in enumerate(ss):
        ops = emc.parse(s)
        hits = []
        for o in ops:
            b = [int(x, 16) for x in o.split(' ') if not x.startswith('?')]
            if b and b[0] in (0x00, 0x24) and len(b) >= 3 and (b[-2], b[-1]) in want:
                hits.append(o)
        if hits:
            print('g%d s%d: hits %s\n    %s' % (g, k, hits, ' | '.join(ops)))
