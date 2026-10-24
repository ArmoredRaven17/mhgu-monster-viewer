import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
mon = 'em083_00'
A.export(mon, [('em083_00u', k, 'UNIQUE', 'shell') for k in (1, 2, 31, 32, 41, 42, 51, 52, 60, 61, 70, 80)])
d = A.existing_def(mon)
A.stage_models(d)
print(mon, sorted((e['record']['pel'], e['record']['key']) for e in d['effects'] if e.get('record') and e.get('when') == 'shell'))
