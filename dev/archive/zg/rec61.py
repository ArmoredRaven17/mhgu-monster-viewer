# rec_shellrec.py's two runs for one record named by its efl (the record is not in the json yet), no lift-effects.sh edit
import os, sys, subprocess
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX); os.chdir(EFX)
import add_effects as A
mon, pel, key, efl, frames = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
JOINTS = 'joints/%s_viewer_rest.json' % mon
for near in (False, True):
    name = 'add_%s_shellrec_%s%s%s' % (mon, pel[-1], key, '_near' if near else '')
    env = dict(os.environ, PARENT_JOINTS=JOINTS, MODEL_MATERIAL_STUB='1', ED4_BACKOUT='1', GPU_DRAW_ROM='1')
    env.pop('CAMERA_AT', None); env.pop('SHELL_PLAN', None)
    if near: env['CAMERA_AT'] = '0,0,0'
    cmd = [sys.executable, 'vecdrawsched.py', name, frames, str(A.size_of(mon)), '0:%s:%s:%s:UNIQUE' % (efl, pel, key)]
    print(' '.join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=EFX, env=env, stdout=open(os.path.join(EFX, 'logs', name + '.log'), 'w'), stderr=subprocess.STDOUT)
    ok = r.returncode == 0 and os.path.exists(os.path.join(EFX, 'vectors', name, 'draw.json'))
    print('  ', name, 'recorded' if ok else 'FAILED', flush=True)
