import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
mon = 'em083_04'
A.export(mon, [('em083_04u', k, 'UNIQUE', 'shell') for k in (1, 2, 31, 32, 41, 42, 43, 44, 51, 52, 53, 54, 55, 60, 62, 70, 80, 100, 101, 150)])
d = A.existing_def(mon)
A.stage_models(d)
print(mon, sorted((e['record']['pel'], e['record']['key']) for e in d['effects'] if e.get('record') and e.get('when') == 'shell'))
