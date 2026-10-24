# Export Blangonga's shell effect records (render/shells.js SHELL_DATA.em022_00) as `shell` records, UNIQUE array
import sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import add_effects as A
KEYS = (0, 10, 30, 31, 32, 33, 40, 41, 42, 43)
recs = [('em022_00u', k, 'UNIQUE', 'shell') for k in KEYS]
A.export('em022_00', recs)
d = A.existing_def('em022_00')
A.stage_models(d)
have = {(e['record']['key'], e.get('when')) for e in d['effects'] if e.get('record') and e['record']['pel'] == 'em022_00u'}
print('shell keys now:', sorted(k for k, w in have if w == 'shell'))
