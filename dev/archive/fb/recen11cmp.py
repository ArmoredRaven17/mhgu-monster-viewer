# recen11cmp.py: the cengen11 re-runs (cen11r_*) against the earlier census files -- every (action, id, mode, site) the new one finds
# and no earlier one did, with the scenarios it came from (a 'land' or a first-pass 'ALL' key is trap 87's)
import re, glob, os
D = os.path.dirname(os.path.abspath(__file__))
OLD = {'em010_00': ['cen9_em010'], 'em017_00': ['cen9_em017', 'cen10_em017', 'cen9r3_em017'], 'em036_00': ['cen9_em036', 'cen10_em036', 'cen9r3_em036'],
       'em021_00': ['cen_em021', 'cen2_em021'], 'em022_00': ['cen_em022'], 'em023_00': ['cen_em023_v0'], 'em023_05': ['cen_em023_v5'],
       'em060_00': ['cen_em060_v0'], 'em060_04': ['cen_em060_v4'], 'em061_00': ['cen_em061_v0', 'cen2_em061_v0', 'cen9_em061_v0'],
       'em061_04': ['cen_em061_v4', 'cen2_em061_v4', 'cen9_em061_v4'], 'em062_00': ['cen_em062'], 'em065_00': ['cen_em065', 'cen9_em065'],
       'em083_00': ['cen_em083_v0'], 'em083_04': ['cen_em083_v4', 'cen9g_em083_v4'], 'em046_00': ['cen9_em046', 'cen10_em046'],
       'em047_00': ['cen9_em047', 'cen10_em047'], 'em049_00': ['cen9_em049', 'cen10_em049'], 'em056_00': ['cen9_em056', 'cen10_em056'],
       'em082_00': ['cen9_em082', 'cen10_em082', 'cen11_em082', 'cen12_em082_00'], 'em082_04': ['cen9_em082v4', 'cen10_em082v4', 'cen11_em082v4', 'cen12_em082_04']}
KEY = re.compile(r"'(0x[0-9a-f]+) m(\d+) f([^ ]+) (0x[0-9a-f]+)': \[([^\]]*)\]")
def keys(path):
    out = {}
    if not os.path.exists(path): return out
    for l in open(path):
        p = l.split(' ', 2)
        if len(p) < 3: continue
        act = p[1]
        for m in KEY.finditer(p[2]):
            out.setdefault((act, m.group(1), int(m.group(2)), m.group(4)), set()).add(m.group(3) + ' ' + m.group(5))
    return out
for mon, olds in OLD.items():
    new = {}
    for f in glob.glob(os.path.join(D, 'cen11r_%s_v*_?.txt' % mon)):
        for k, v in keys(f).items(): new.setdefault(k, set()).update(v)
    if not new: print(mon, ': no re-run yet'); continue
    old = set()
    for o in olds: old.update(keys(os.path.join(D, o + '.txt')).keys())
    extra = sorted(k for k in new if k not in old)
    lost = sorted(k for k in old if k not in new)
    print('%s: %d keys now, %d before; NEW %d, missing now %d' % (mon, len(new), len(old), len(extra), len(lost)))
    for k in extra: print('   NEW', k, sorted(new[k])[:4])
    for k in lost[:10]: print('   GONE', k)
