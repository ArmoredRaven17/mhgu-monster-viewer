# rec_floor6.py: record Barroth c 130 (cm200_041, L4 M3 bit held 3..92) on a parent whose floor block carries flag 6 (0x41c88's arm),
# both sides of its compare ([+0x1074] - [+0x1078] > 5.0 -> MASK2 5, else 0x11), and add the sets to lift-effects.sh's V (no lift here).
import os, sys, re, subprocess
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX); os.chdir(EFX)
import add_effects as A
mon, pel, key = 'em044_00', 'em044_00c', 130
d = A.existing_def(mon)
e = next(x for x in d['effects'] if x.get('when') == 'clip' and x['record']['pel'] == pel and x['record']['key'] == key)
r = e['record']
arr = A.array_of(pel, key, r.get('index'), r.get('path'))
efl = A.T.efl_path(e['efl'].split('/')[-1][:-4]).replace(os.sep, '/')
spec = '0:%s:%s:%d:%s' % (efl, pel, key, arr)
held = 89
notices = ['1-%d:psl:0:1' % (held - 1), '%d:psl:0:2' % held]
sets = [('add_em044_00_c130_floor2deep', '2,100,0'), ('add_em044_00_c130_floor4shallow', '4,0,0'), ('add_em044_00_c130_floor6deep', '6,100,0')]
done = []
for name, floor in sets:
    env = dict(os.environ, PARENT_JOINTS='joints/%s_viewer_rest.json' % mon, MODEL_MATERIAL_STUB='1', ED4_BACKOUT='1', GPU_DRAW_ROM='1', PARENT_FLOOR=floor)
    env.pop('CAMERA_AT', None)
    cmd = [sys.executable, 'vecdrawsched.py', name, '240', str(A.size_of(mon)), spec] + notices
    print(' '.join(cmd), 'PARENT_FLOOR=' + floor, flush=True)
    p = subprocess.run(cmd, cwd=EFX, env=env, stdout=open(os.path.join(EFX, 'logs', name + '.log'), 'w'), stderr=subprocess.STDOUT)
    ok = p.returncode == 0 and os.path.exists(os.path.join(EFX, 'vectors', name, 'draw.json'))
    print('  ', name, 'recorded' if ok else 'FAILED', flush=True)
    if ok: done.append(name)
if done:
    with A.shared_lock('lift'):
        sh = os.path.join(EFX, 'lift-effects.sh')
        text = open(sh, newline='').read()
        m = re.search(r'^V=(\S+)$', text, re.M)
        have = set(m.group(1).split(','))
        add = [v for v in ('vectors/' + n for n in done) if v not in have]
        if add:
            text = text[:m.end(1)] + ',' + ','.join(add) + text[m.end(1):]
            open(sh, 'w', newline='').write(text)
        print('lift-effects.sh: %d sets added' % len(add))
