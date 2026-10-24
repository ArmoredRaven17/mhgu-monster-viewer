"""Append routine addresses to lift-effects.sh's lifted-added.js line (the one --grow uses), in place.
Run only while no lift is running (bash reads the script as it executes)."""
import os, sys, re
p = r'C:\MHGU-Extract\efx\lift-effects.sh'
s = open(p, newline='').read()
lines = s.split('\n')
idx = [i for i, l in enumerate(lines) if 'lifted-added.js @vectors.list' in l]
assert len(idx) == 1, idx
l = lines[idx[0]]
have = set(re.findall(r'0x[0-9a-f]+', l))
add = [a for a in sys.argv[1:] if a.lower() not in have]
if add:
    lines[idx[0]] = l.rstrip() + ' ' + ' '.join(add) + ('\r' if l.endswith('\r') else '')
    if l.endswith('\r'):
        lines[idx[0]] = l[:-1].rstrip() + ' ' + ' '.join(add) + '\r'
    open(p + '.tmp', 'w', newline='').write('\n'.join(lines))
    os.replace(p + '.tmp', p)
print('added', add or 'nothing (already there)')
