"""Per fanged beast: the WHOLE-block bindings on bits 6-14 (state groups) and 15-31 (class override), with the record,
and whether each sits in the file mask."""
import sys, os, json, io, contextlib, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
for mon in sys.argv[1:]:
    with contextlib.redirect_stdout(io.StringIO()):
        cfg, _, rows_f, _ = A.plan(mon)
    real = A.psl_mask_monsters
    A.psl_mask_monsters = lambda: real() | {mon}
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            cfg, _, rows_w, _ = A.plan(mon)
    finally:
        A.psl_mask_monsters = real
    fset = {(x[0], x[1], x[3]) for x in rows_f}
    g = collections.defaultdict(list)
    for x in rows_w:
        lst, slot, frames, bit, pel, k = x[:6]
        if bit < 6: continue
        grp = 'state6-14' if bit < 15 else 'over15+'
        nm = ('c' if pel == cfg['cpel'] else 'u') + str(k)
        g[grp].append('L%s M%s(0x%x) b%d %s%s' % (lst, slot, (lst << 8 | slot) if isinstance(lst, int) else 0, bit, nm, '' if (lst, slot, bit) in fset else '*'))
    print('##', mon)
    for k, v in g.items(): print('  ', k, len(v), ' | '.join(v))
