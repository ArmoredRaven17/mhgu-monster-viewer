"""Outside-file-mask PSL bindings per monster, by enable-word bit group, with motion ids (list << 8 | slot)."""
import sys, os, io, contextlib, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A


def grp(b):
    return ('0-5 always' if b <= 5 else '6-8 calm' if b <= 8 else '9-11 rage' if b <= 11 else '12-14 tired' if b <= 14
            else '15-17' if b <= 17 else '18-20' if b <= 20 else '21-23' if b <= 23 else '24-26' if b <= 26
            else '27-29' if b <= 29 else '30-31')


for mon in sys.argv[1:]:
    real = A.psl_mask_monsters
    with contextlib.redirect_stdout(io.StringIO()):
        cfg, _, rows_f, _ = A.plan(mon)
        A.psl_mask_monsters = lambda: real() | {mon}
        try:
            cfg, _, rows_w, _ = A.plan(mon)
        finally:
            A.psl_mask_monsters = real
    fset = {(x[0], x[1], x[3]) for x in rows_f}
    extra = [x for x in rows_w if (x[0], x[1], x[3]) not in fset]
    by = collections.defaultdict(list)
    for x in extra:
        name = ('c' if x[4] == cfg['cpel'] else 'u') + str(x[5])
        mid = (x[0] << 8 | x[1]) if isinstance(x[0], int) else None
        by[grp(x[3])].append('L%s M%s b%s %s%s%s' % (x[0], x[1], x[3], name, '' if x[6] else '(no rec)',
                                                    ' [0x%x]' % mid if mid is not None else ''))
    print('==', mon, len(extra))
    for g in sorted(by, key=lambda s: int(s.split('-')[0])):
        print('  %-12s %3d  %s' % (g, len(by[g]), '; '.join(by[g][:40])))
