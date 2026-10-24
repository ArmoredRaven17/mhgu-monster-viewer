"""Per monster: the whole-block plan's 'Left out' list (records named by a PSL bit that do not go in, and why)."""
import sys, os, io, contextlib, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
for mon in sys.argv[1:]:
    real = A.psl_mask_monsters
    A.psl_mask_monsters = lambda: real() | {mon}
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            cfg, entry, rows, records = A.plan(mon)
    finally:
        A.psl_mask_monsters = real
    pairs = {(p, k) for (p, k, _a) in records}
    left = collections.OrderedDict()
    for x in rows:
        k = (x[4], x[5])
        if k in pairs: continue
        why = x[9] if x[8].startswith('ok') else x[8]
        left.setdefault(k, set()).add(('L%s M%s' % (x[0], x[1]), why, x[6]['efl'] if x[6] else '-'))
    print('==', mon, 'cpel', cfg['cpel'], 'upel', cfg['upel'])
    for k, s in left.items():
        nm = ('c' if k[0] == cfg['cpel'] else 'u') + str(k[1])
        whys = collections.Counter(w for _, w, _ in s)
        print('  %s %s: %s  [%s]' % (nm, sorted(s)[0][2], '; '.join('%s x%d' % w for w in whys.items()), ' '.join(sorted(m for m, _, _ in s))[:120]))
