# Export the Seltas Queen's / Seltas's shell effect records (render/shells.js SHELL_DATA.em069_00 / em076_00) as `shell` records,
# UNIQUE array, into their docs/effects json
import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
plan = {'em069_00': [('em069_00u', 10), ('em069_00u', 20), ('em069_00u', 21), ('em069_00c', 31), ('em069_00c', 32), ('em069_00c', 33)],
        'em076_00': [('em076_00u', 0), ('em076_00u', 1), ('em076_00u', 10), ('em076_00u', 11), ('em076_00u', 20), ('em076_00u', 21)]}
for mon, keys in plan.items():
    recs = [(pel, k, 'UNIQUE', 'shell') for pel, k in keys]
    A.export(mon, recs)
    d = A.existing_def(mon)
    A.stage_models(d)
