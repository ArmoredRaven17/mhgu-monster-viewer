# Export Zinogre's / Thunderlord's shell effect records (render/shells.js SHELL_DATA.em057_00 / em057_04) as `shell` records,
# UNIQUE array, into their docs/effects json
import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
plan = {'em057_00': [('em057_00u', k) for k in (0, 1, 60, 61, 150)],
        'em057_04': [('em057_04u', k) for k in (0, 1, 2, 10, 11, 12, 60, 61, 70, 71, 150, 160, 170, 171, 180, 210, 220)]}
for mon, keys in plan.items():
    recs = [(pel, k, 'UNIQUE', 'shell') for pel, k in keys]
    A.export(mon, recs)
    d = A.existing_def(mon)
    A.stage_models(d)
