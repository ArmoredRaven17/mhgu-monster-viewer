# Export the beam children's effect records (render/beam-types.js `child`) as `shell` records, UNIQUE array, into their
# monsters' docs/effects json -- Ukanlos's shell00 modes 8..22 (u 0 / 1 / 10), Plesioth's shell00 mode 0 (u 21).
import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
plan = {'em038_00': [('em038_00u', 0), ('em038_00u', 1), ('em038_00u', 10)], 'em010_00': [('em010_00u', 21)]}
for mon, keys in plan.items():
    recs = [(pel, k, 'UNIQUE', 'shell') for pel, k in keys]
    A.export(mon, recs)
    d = A.existing_def(mon)
    A.stage_models(d)
