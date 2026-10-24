"""Record vector sets with the draw camera FAR from the effect, so 0xa718b8's distance LOD class (0xb8f014: < 2000 / 2000..5000 /
>= 5000 from the effect manager's +0x1f4 / +0x1f8) is 1 or 2 and the model generator draw 0xa9272c takes its masked particle walk
(0xa92798..0xa927c0, 0xa928f4..0xa9291c). Same record() as add_effects.py --record (spec, frames, notices, joints), only the
'' variant, with CAMERA_AT injected and a suffix (_lodmid / _lodfar). ADD_NO_LIFT=1: the sets go on V= under the lift lock.

    python rec_lod.py <mon> <side><key>[,<side><key>...]
"""
import os, sys, subprocess
os.environ['ADD_NO_LIFT'] = '1'
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX)
os.chdir(EFX)
import add_effects as A

mon, keys = sys.argv[1], sys.argv[2].split(',')
cfg = A.plan(mon)[0]
d = A.existing_def(mon)
want = set((cfg['cpel'] if k[0] == 'c' else cfg['upel'], int(k[1:])) for k in keys)

VARIANTS = [('_lodmid', '0,0,3500'), ('_lodfar', '0,0,7000')]
orig = subprocess.Popen
for suffix, cam in VARIANTS:
    A.SET_SUFFIX = suffix
    def popen(cmd, *a, _cam=cam, **kw):
        env = dict(kw.get('env') or os.environ)
        env['CAMERA_AT'] = _cam
        kw['env'] = env
        print('  record', cmd[2], 'CAMERA_AT', _cam, flush=True)
        return orig(cmd, *a, **kw)
    A.subprocess.Popen = popen
    failed = A.record(mon, cfg, d, only=('',), keys=want)
    A.subprocess.Popen = orig
    print(suffix, 'failed:', failed, flush=True)
