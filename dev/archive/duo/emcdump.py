# emcdump.py <file.emc> g s [g s ...]: the streams as op lines (variant 0 live), for reading by hand
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\zamtrios-scratch')
import emc
ver, groups = emc.load(sys.argv[1])
a = sys.argv[2:]
for i in range(0, len(a), 2):
    g, k = int(a[i]), int(a[i + 1])
    print('== g%d s%d' % (g, k))
    depth = 0
    for o in emc.parse(groups[g][k]):
        b = o.split(' ')
        try: op = int(b[0], 16)
        except Exception: print('  ', o); continue
        blk = op <= 0xa6 and emc.DESC[op] & 0x80
        if blk and len(b) > 1 and b[1] in ('ff',): depth -= 1
        print('  ' + '  ' * max(depth, 0) + o)
        if blk and len(b) > 1 and b[1] == '00': depth += 1
