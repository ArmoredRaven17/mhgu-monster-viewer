import sys, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
sys.argv = ['add_effects.py', 'em005_00']
import add_effects as A
mon = 'em005_00'
d = A.existing_def(mon)
e = next(x for x in d['effects'] if x.get('record') and x['record']['key'] == 241 and x.get('when') == 'clip')
r = e['record']
efl = A.T.efl_path(e['efl'].split('/')[-1][:-4])
arr = A.array_of(r['pel'], r['key'], r.get('index'), r.get('path'))
spec = '0:%s:%s:%d:%s' % (efl.replace(os.sep, '/'), r['pel'], r['key'], arr)
print('SIZE', A.size_of(mon))
print('SPEC', spec)
print('NEAR', A.near_camera(mon, r.get('payload')))
