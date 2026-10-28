# Export the em063 shell records (render/shells.js SHELL_DATA em063_00 / em063_05: every mode's ef pair) as `when: shell`.
# em063_05u has no UNIQUE 21 (Raging's sp_01 mode 8 names it; that mode has no maker) -- not exported.
import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
JOBS = [('em063_00', 'em063_00u', (0, 1, 10, 11, 30, 31, 40, 41, 50, 51)),
        ('em063_05', 'em063_05u', (1, 10, 11, 30, 31, 40, 41, 50, 100, 110, 111, 130, 131, 210))]
for mon, pel, keys in JOBS:
    A.export(mon, [(pel, k, 'UNIQUE', 'shell') for k in keys])
    d = A.existing_def(mon)
    A.stage_models(d)
    print(mon, sorted(e['record']['key'] for e in d['effects'] if e.get('record') and e.get('when') == 'shell' and e['record']['pel'] == pel))
