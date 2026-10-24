"""Per monster: file-mask PSL bindings by bit group (0-5 always, 6-14 state group, 15-31 class word).
Bindings at bit >= 15 inside the file mask fire unconditionally in the viewer today; the class word gates them in the game."""
import sys, os, io, contextlib, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
for mon in sys.argv[1:]:
    with contextlib.redirect_stdout(io.StringIO()):
        cfg, _, rows_f, _ = A.plan(mon)
        real = A.psl_mask_monsters
        A.psl_mask_monsters = lambda: real() | {mon}
        try:
            _, _, rows_w, _ = A.plan(mon)
        finally:
            A.psl_mask_monsters = real
    def grp(b):
        return 'b0-5' if b < 6 else ('b6-14' if b < 15 else 'b15-31')
    cf = collections.Counter(grp(x[3]) for x in rows_f)
    cw = collections.Counter(grp(x[3]) for x in rows_w)
    hi = sorted({(x[0], x[1], x[3]) for x in rows_f if x[3] >= 15})
    lists = collections.Counter('L%d' % x[0] for x in rows_f if x[3] >= 15)
    print(mon, 'file:', dict(cf), 'whole:', dict(cw), 'file>=15 by list:', dict(lists),
          'bits>=15:', sorted({x[3] for x in rows_f if x[3] >= 15}))
