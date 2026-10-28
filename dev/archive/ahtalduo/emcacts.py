import sys, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\barioth-scratch')
import emc
path = sys.argv[1]
ver, groups = emc.load(path)
acts = collections.defaultdict(list)
for g, st in enumerate(groups):
    for k, s in enumerate(st):
        ops = emc.parse(s)
        for i, o in enumerate(ops):
            b = o.split()
            if b[0] == '00' and len(b) >= 3:
                acts[(int(b[1],16), int(b[2],16))].append('g%d s%d #%d' % (g, k, i))
print('groups', len(groups), [len(st) for st in groups])
for a in sorted(acts):
    print('(%#x, %#x)' % a, len(acts[a]), ' '.join(acts[a][:12]))
