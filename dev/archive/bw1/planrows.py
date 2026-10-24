# whole-block plan rows for a monster (add_effects.plan with the monster forced into psl_mask_monsters), read-only
import sys, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import add_effects as A
mon = sys.argv[1]; whole = '--whole' in sys.argv
if whole:
    orig = A.psl_mask_monsters
    A.psl_mask_monsters = lambda: orig() | {mon}
cfg, entry, rows, records = A.plan(mon)
for (lst, slot, frames, bit, pel, eff, r, on, clip_state, state, types) in rows:
    print('L%s M%d b%d %s %s %s on=%s | clip: %s | %s | %s' % (lst, slot, bit, pel, eff, (r or {}).get('array'), on, clip_state, state, (r or {}).get('efl')))
