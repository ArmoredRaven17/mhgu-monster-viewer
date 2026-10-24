import sys, glob, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import arclist, shellef, zlib
SEP = chr(92)
per = collections.OrderedDict()
for arc in sorted(glob.glob('C:/MHGU-Extract/scratch-em/*/*.arc')):
    ver, rows = arclist.entries(arc)
    types = collections.defaultdict(set)
    for nm, th, comp, dec, off in rows: types[nm].add(th)
    hits = [nm for nm, t in types.items() if '4aa69872' in t and '496f8f22' in t]
    if hits:
        T = shellef.load_typed(arc)
        per[arc.split('/')[-1].replace('.arc','')] = [(nm.split(SEP)[-1], shellef.fup(T[(nm, '496f8f22')])) for nm in sorted(hits)]
print(len(per), 'arcs with shell common params')
for mon, hs in per.items():
    print(mon, '; '.join('%s %s' % (n, {k: v for k, v in f.items() if v}) for n, f in hs))
