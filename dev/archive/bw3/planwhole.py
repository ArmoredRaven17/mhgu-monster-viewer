import sys, io, contextlib
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import add_effects as A
mon = sys.argv[1]
if '--whole' in sys.argv:
    orig = A.psl_mask_monsters; A.psl_mask_monsters = lambda: orig() | {mon}
cfg, entry, rows, records = A.plan(mon)
A.print_plan(mon, cfg, entry, rows, records)
