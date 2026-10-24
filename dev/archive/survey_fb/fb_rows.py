"""Per fanged beast: every whole-block row of a record not exported, with the plan's clip_state and state."""
import sys, os, json, io, contextlib
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
VIEWER = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
for mon in sys.argv[1:]:
    real = A.psl_mask_monsters
    A.psl_mask_monsters = lambda: real() | {mon}
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            cfg, _, rows, recs = A.plan(mon)
    finally:
        A.psl_mask_monsters = real
    eff = json.load(open(os.path.join(VIEWER, 'docs', 'effects', mon + '.json'), encoding='utf-8'))['effects']
    exported = {(e['record']['pel'], e['record']['key']) for e in eff if e.get('record')}
    print('##', mon, 'cpel', cfg['cpel'], 'upel', cfg['upel'])
    for x in rows:
        lst, slot, frames, bit, pel, k, rec, on, clip_state, state, types = x
        if (pel, k) in exported: continue
        nm = ('c' if pel == cfg['cpel'] else 'u') + str(k)
        print('  %s L%s M%s b%s efl=%s | clip: %s | rec: %s' % (nm, lst, slot, bit, rec['efl'] if rec else None, clip_state, state))
