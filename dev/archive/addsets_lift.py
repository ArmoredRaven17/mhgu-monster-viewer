import sys, os, re, subprocess
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
sys.argv = ['add_effects.py', 'em005_00']
import add_effects as A
done = sys.argv_sets = ['add_em005_00_u241_hold80', 'add_em005_00_u241_hold80_near']
with A.shared_lock('lift'):
    sh = os.path.join(A.EFX, 'lift-effects.sh')
    text = open(sh, newline='').read()
    m = re.search(r'^V=(\S+)$', text, re.M)
    have = set(m.group(1).split(','))
    add = [v for v in ('vectors/' + n for n in done) if v not in have]
    if add:
        text = text[:m.end(1)] + ',' + ','.join(add) + text[m.end(1):]
        open(sh, 'w', newline='').write(text)
    print('lift-effects.sh: %d sets added; lifting...' % len(add), flush=True)
    r = subprocess.run(['sh', 'lift-effects.sh'], cwd=A.EFX, capture_output=True, text=True)
    print('lift: %s' % ('ok' if r.returncode == 0 else 'FAILED\n' + (r.stderr or r.stdout)[-800:]))
