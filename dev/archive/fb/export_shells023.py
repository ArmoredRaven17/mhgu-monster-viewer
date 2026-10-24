# Export Rajang's / Furious Rajang's ball records (render/shells.js SHELL_DATA.em023_00 / em023_05 shell00) as `shell` records, UNIQUE
import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
for mon in ('em023_00', 'em023_05'):
    A.export(mon, [(mon + 'u', k, 'UNIQUE', 'shell') for k in (230, 231, 232, 260, 261, 262, 263, 264, 265, 266, 267)])
    d = A.existing_def(mon)
    A.stage_models(d)
    print(mon, sorted(e['record']['key'] for e in d['effects'] if e.get('record') and e.get('when') == 'shell'))
