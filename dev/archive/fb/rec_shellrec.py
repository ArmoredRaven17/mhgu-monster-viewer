# Record a monster's SHELL records standalone (no shell plan): the UNIQUE record the shell starts, at the origin, plain and with
# the camera at it, onto lift-effects.sh's V (ADD_NO_LIFT: the lift is the caller's).
#   python rec_shellrec.py <mon> <pel>:<key>[,<pel>:<key>...] [frames]
import os, sys, re, subprocess, json
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX); os.chdir(EFX)
import add_effects as A
mon = sys.argv[1]; keys = [k.strip().split(':') for k in sys.argv[2].strip().split(',')]
frames = sys.argv[3] if len(sys.argv) > 3 else '300'
d = A.existing_def(mon)
JOINTS = 'joints/%s_shells_rest.json' % mon
if not os.path.exists(os.path.join(EFX, JOINTS)):           # record_shells.py's own build of it (lines 102..110)
    import viewer_joints as VJ
    js, size = VJ.joints_of(mon)
    keep = sorted(js)
    json.dump({'source': 'viewer_joints.py rest pose x sizeBase %s; every joint, for the shell plans' % size,
               'joints': {str(j): js[j] for j in keep}, 'unit': {'position': [0, 0, 0], 'quaternion': [0, 0, 0, 1], 'scale': size},
               'jointList': keep}, open(os.path.join(EFX, JOINTS), 'w'))
done = []
for pel, key in keys:
    e = next(x for x in d['effects'] if x.get('when') == 'shell' and x['record']['pel'] == pel and x['record']['key'] == int(key))
    efl = A.T.efl_path(e['record']['path'].split(chr(92))[-1]).replace(os.sep, '/')
    for near in (False, True):
        name = 'add_%s_shellrec_%s%s%s' % (mon, pel[-1], key, '_near' if near else '')
        if os.environ.get('REC_SKIP') and os.path.exists(os.path.join(EFX, 'vectors', name, 'draw.json')):
            print('  ', name, 'already recorded', flush=True); done.append(name); continue
        env = dict(os.environ, PARENT_JOINTS=JOINTS, MODEL_MATERIAL_STUB='1', ED4_BACKOUT='1', GPU_DRAW_ROM='1')
        env.pop('CAMERA_AT', None); env.pop('SHELL_PLAN', None)
        if near: env['CAMERA_AT'] = '0,0,0'
        cmd = [sys.executable, 'vecdrawsched.py', name, frames, str(A.size_of(mon)), '0:%s:%s:%s:UNIQUE' % (efl, pel, key)]
        print(' '.join(cmd), flush=True)
        r = subprocess.run(cmd, cwd=EFX, env=env, stdout=open(os.path.join(EFX, 'logs', name + '.log'), 'w'), stderr=subprocess.STDOUT)
        ok = r.returncode == 0 and os.path.exists(os.path.join(EFX, 'vectors', name, 'draw.json'))
        print('  ', name, 'recorded' if ok else 'FAILED', flush=True)
        if ok: done.append(name)
if done:
    sh = os.path.join(EFX, 'lift-effects.sh')
    text = open(sh, newline='').read()
    m = re.search(r'^V=(\S+)$', text, re.M)
    have = set(m.group(1).split(','))
    add = [v for v in ('vectors/' + n for n in done) if v not in have]
    if add:
        text = text[:m.end(1)] + ',' + ','.join(add) + text[m.end(1):]
        open(sh, 'w', newline='').write(text)
    print('lift-effects.sh: %d sets added' % len(add))
