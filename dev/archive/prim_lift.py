# Record em084_00_064's primitive layer with vecprim.py (dev/effect-bb43ac-flag8.md), add the set to lift-effects.sh's V=
# line and lift -- the V= edit and the lift under add_effects' own lock, as its record() does.
import os, re, sys, subprocess
EFX = r'C:\MHGU-Extract\efx'
os.chdir(EFX); sys.path.insert(0, EFX); sys.path.insert(0, r'C:\MHGU-Extract\build\arm'); sys.path.insert(0, r'C:\MHGU-Extract')
import add_effects as A
name = 'add_em084_00_064prim'
r = subprocess.run([sys.executable, 'vecprim.py', r'C:/MHGU-Extract/scratch-effects-em/effect/em/em084/em084_00_064.efl', '60', name, '--parent'],
                   capture_output=True, text=True)
print('vecprim exit', r.returncode); print((r.stdout or '')[-1500:]); print((r.stderr or '')[-800:])
if r.returncode != 0 or not os.path.exists(os.path.join('vectors', name, 'draw.json')):
    sys.exit('no set recorded')
with A.shared_lock('lift'):
    sh = os.path.join(EFX, 'lift-effects.sh')
    text = open(sh, newline='').read()
    m = re.search(r'^V=(\S+)$', text, re.M)
    have = set(m.group(1).split(','))
    v = 'vectors/' + name
    if v not in have:
        text = text[:m.end(1)] + ',' + v + text[m.end(1):]
        open(sh, 'w', newline='').write(text)
    print('lift-effects.sh: added' if v not in have else 'lift-effects.sh: already there', v, '; lifting...')
    r = subprocess.run(['sh', 'lift-effects.sh'], cwd=EFX, capture_output=True, text=True)
    print('lift: %s' % ('ok' if r.returncode == 0 else 'FAILED\n' + (r.stderr or r.stdout)[-800:]))
