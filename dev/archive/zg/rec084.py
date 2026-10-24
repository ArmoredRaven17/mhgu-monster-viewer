"""rec084.py: the two Nakarkos recordings (efx slot, 2026-10-19).
  1. em084_00c 800 (c 800, efl em084_00_200, UNIQUE @event): add_effects.record(keys=) -- its '', _stop, _near sets.
  2. THE VIEWER'S RELEASE of a running generator (vecdrawsched.py <frame>:release:<n>, new today): a seek back's
     clearClipEffects stops and destroys a running clip request; em084_00_007 / em084_00_050 generators then walk the base
     destructor's free-list arm 0xa55ea8 -> 0xa55f20. Hand sets, on the body's rest joints (the arm records' root joints 5 / 13
     are in that file), each started at 0 with its bit held, then stop + release:
       add_em084_00_c135_rel60     body c 135 (em084_00_007), released at 60 (u 135 holds through the idles)
       add_em084_00_c135l_rel60    the arm's c 135 (em084_00_050, pel em084_00c_l), at 60
       add_em084_00_c130l_rel8     the arm's c 130 (em084_00_050), at 8 (mid-emission, bit on)
       add_em084_00_c130l_rel45    the same at 45 (bit off at 35, particles still out)
Sets go onto lift-effects.sh's V= (under add_effects' lift lock); NO lift here (ADD_NO_LIFT=1) -- lift from a copy after."""
import os, sys, json, re, subprocess
os.environ['ADD_NO_LIFT'] = '1'
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX); os.chdir(EFX)
sys.argv = ['add_effects.py']
import add_effects as A
mon = 'em084_00'
what = sys.argv[1:] or ['c800', 'release']
args = set(os.environ.get('REC084', 'c800,release').split(','))
if 'c800' in args:
    cfg = A.config(mon) if hasattr(A, 'config') else None
    d = A.existing_def(mon)
    if cfg is None:
        cfg, entry, rows, records = A.plan(mon)
    failed = A.record(mon, cfg, d, keys={('em084_00c', 800)})
    print('c 800 failed:', failed)
if 'release' in args:
    size = str(A.size_of(mon))
    def spec(efl_name, pel, key):
        arr = A.array_of(pel, key)
        return '0:%s:%s:%d:%s' % (A.T.efl_path(efl_name).replace(os.sep, '/'), pel, key, arr)
    sets = [
        ('add_em084_00_c135_rel60',  spec('em084_00_007', 'em084_00c', 135),   70, ['1-59:psl:0:1', '60:stop:0', '60:release:0']),
        ('add_em084_00_c135l_rel60', spec('em084_00_050', 'em084_00c_l', 135), 70, ['1-59:psl:0:1', '60:stop:0', '60:release:0']),
        ('add_em084_00_c130l_rel8',  spec('em084_00_050', 'em084_00c_l', 130), 20, ['1-7:psl:0:1', '8:stop:0', '8:release:0']),
        ('add_em084_00_c130l_rel45', spec('em084_00_050', 'em084_00c_l', 130), 55, ['1-34:psl:0:1', '35:psl:0:2', '45:stop:0', '45:release:0']),
    ]
    env = dict(os.environ, PARENT_JOINTS='joints/%s_viewer_rest.json' % mon, MODEL_MATERIAL_STUB='1', ED4_BACKOUT='1', GPU_DRAW_ROM='1')
    env.pop('CAMERA_AT', None)
    procs = []
    for name, sp, frames, notes in sets:
        cmd = [sys.executable, 'vecdrawsched.py', name, str(frames), size, sp] + notes
        print(' '.join(cmd))
        log = open(os.path.join(EFX, 'logs', name + '.log'), 'w')
        procs.append((name, subprocess.Popen(cmd, cwd=EFX, env=env, stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL), log))
    done = []
    for name, p, log in procs:
        p.wait(); log.close()
        ok = p.returncode == 0 and os.path.exists(os.path.join(EFX, 'vectors', name, 'draw.json'))
        print(' ', name, 'recorded' if ok else 'FAILED (logs/%s.log)' % name)
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
            print('lift-effects.sh: %d release sets added (no lift)' % len(add))
