import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
mon = 'em065_00'
A.export(mon, [('em065_00u', k, 'UNIQUE', 'shell') for k in (0, 1, 2, 10, 11, 12)] + [('em065_00c', 31, 'UNIQUE', 'shell')])
d = A.existing_def(mon)
A.stage_models(d)
print(mon, sorted((e['record']['pel'], e['record']['key']) for e in d['effects'] if e.get('record') and e.get('when') == 'shell'))
