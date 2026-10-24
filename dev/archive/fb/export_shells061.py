import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
for mon, keys in (('em061_00', (0, 1, 2, 10, 11, 12, 13)),):
    A.export(mon, [(mon + 'u', k, 'UNIQUE', 'shell') for k in keys])
    d = A.existing_def(mon)
    A.stage_models(d)
    print(mon, sorted(e['record']['key'] for e in d['effects'] if e.get('record') and e.get('when') == 'shell'))
