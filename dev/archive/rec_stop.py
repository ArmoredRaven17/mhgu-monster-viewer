"""Record a held record STOPPED EARLY (at frame N), for a stop path the 60-frame `_stop` set does not cover (a state that ends
before the record's units settle). Same record() as add_effects.py --record, the '' variant, with `N:stop:0` appended and a
suffix _stopN. ADD_NO_LIFT=1.      python rec_stop.py <mon> <side><key>[,...] <N>[,<N>...]"""
import os, sys, subprocess
os.environ['ADD_NO_LIFT'] = '1'
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX)
os.chdir(EFX)
import add_effects as A
mon, keys, frames = sys.argv[1], sys.argv[2].split(','), [int(x) for x in sys.argv[3].split(',')]
cfg = A.plan(mon)[0]
d = A.existing_def(mon)
want = set((cfg['cpel'] if k[0] == 'c' else cfg['upel'], int(k[1:])) for k in keys)
orig = subprocess.Popen
for n in frames:
    A.SET_SUFFIX = os.environ.get('SUFFIX', '_stop') + '%d' % n
    def popen(cmd, *a, _n=n, **kw):
        cmd = list(cmd) + ['%d:stop:0' % _n]
        print('  record', cmd[2], 'stop at', _n, flush=True)
        return orig(cmd, *a, **kw)
    A.subprocess.Popen = popen
    failed = A.record(mon, cfg, d, only=tuple(os.environ.get('VARIANTS', '').split(',')), keys=want)
    A.subprocess.Popen = orig
    print('_stop%d' % n, 'failed:', failed, flush=True)
