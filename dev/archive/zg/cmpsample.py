# Record a sample of sets twice -- python cmpsample.py A (the old harness in place) / B (the new) -- into vectors/cmp<A|B>_<name>,
# then `python cmpsample.py diff` compares each pair's draw.json.
import os, sys, subprocess, json
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX); os.chdir(EFX)
C = 'C:/MHGU-Extract/scratch-effects-em/effect/cm'
W = dict(GPU_DRAW_ROM='1', MODEL_MATERIAL_STUB='1', ED4_BACKOUT='1', PARENT_JOINTS='joints/player_w08_rest.json', PARENT_MODEL='1')
def ev(mon, key, extra=(), pel=None, frames='600'):
    import add_effects as A
    d = A.existing_def(mon)
    e = next(x for x in d['effects'] if x.get('record') and x['record']['key'] == key and x.get('when') in ('event', 'ragePuff', 'shell')
             and (pel is None or x['record']['pel'] == pel))
    r = e['record']; arr = A.array_of(r['pel'], r['key'], r.get('index'), r.get('path'))
    efl = A.T.efl_path(e['efl'].split('/')[-1][:-4]).replace(os.sep, '/')
    env = dict(PARENT_JOINTS='joints/%s_viewer_rest.json' % mon, MODEL_MATERIAL_STUB='1', ED4_BACKOUT='1', GPU_DRAW_ROM='1')
    return env, [frames, str(A.size_of(mon)), '0:%s:%s:%d:%s' % (efl, r['pel'], r['key'], arr)] + list(extra)
SETS = {
    'w01_u201':    (W, ['240', '1.0', '0:%s/cm002_007.efl:cm002_002:201:UNIQUE' % C]),
    'w01_u1100w':  (dict(W, PARENT_ORDER='0x30000'), ['240', '1.0', '0:%s/cm123_013.efl:w01_800:1100:UNIQUE' % C]),
    'em024_u230':  lambda: ev('em024_00', 230),
    'em011_u60s20': lambda: ev('em011_00', 60, ['20:stop:0']),
    'em011_u0':    lambda: ev('em011_00', 0),
    'em058_u100s': lambda: ev('em058_00', 100, ['60:stop:0']),
    'em043_c1103s': lambda: ev('em043_00', 1103, ['60:stop:0']),
    'em086_u1121': lambda: ev('em086_00', 1121),
}
mode = sys.argv[1]
ONLY = sys.argv[2:] if sys.argv[1] in ('A','B','C','A2','C2') else []
if mode in ('A', 'B', 'C', 'A2', 'C2'):
    for name, spec in SETS.items():
        if ONLY and name not in ONLY: continue
        env, args = spec() if callable(spec) else spec
        full = dict(os.environ); full.pop('CAMERA_AT', None); full.pop('REQUESTER_JSON', None); full.pop('PARENT_ORDER', None); full.update(env)
        n = 'cmp%s_%s' % (mode, name)
        r = subprocess.run([sys.executable, 'vecdrawsched.py', n] + args, env=full, stdout=open('logs/%s.log' % n, 'w'), stderr=subprocess.STDOUT)
        print(n, 'rc', r.returncode, 'ok' if os.path.exists('vectors/%s/draw.json' % n) else 'NO SET', flush=True)
else:
    def walk(a, b, path, out):
        if type(a) != type(b): out.append((path, 'type')); return
        if isinstance(a, dict):
            for k in set(a) | set(b):
                if k not in a or k not in b: out.append((path + '/' + str(k), 'missing')); continue
                walk(a[k], b[k], path + '/' + str(k), out)
        elif isinstance(a, list):
            if len(a) != len(b): out.append((path, 'len %d vs %d' % (len(a), len(b))))
            for i, (x, y) in enumerate(zip(a, b)): walk(x, y, path + '[%d]' % i, out)
        elif a != b: out.append((path, '%r vs %r' % (a, b)))
    for name in SETS:
        fa, fb = 'vectors/cmp%s_%s/draw.json' % (sys.argv[2], name), 'vectors/cmp%s_%s/draw.json' % (sys.argv[3], name)
        if not (os.path.exists(fa) and os.path.exists(fb)): print(name, 'missing', os.path.exists(fa), os.path.exists(fb)); continue
        A_, B_ = json.load(open(fa)), json.load(open(fb))
        out = []; walk(A_, B_, '', out)
        print(name, 'differences:', len(out))
        for p, w in out[:12]: print('   ', p[:160], w[:120])
