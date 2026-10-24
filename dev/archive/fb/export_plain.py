import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
mon = sys.argv[1]; recs = []
for a in sys.argv[2:]:
    pel, keys = a.split(':'); recs += [(pel, int(k), 'UNIQUE', 'shell') for k in keys.split(',')]
A.export(mon, recs)
d = A.existing_def(mon); A.stage_models(d)
print(mon, sorted((e['record']['pel'], e['record']['key']) for e in d['effects'] if e.get('record') and e.get('when') == 'shell'))
