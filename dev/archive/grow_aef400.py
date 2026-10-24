"""0xaef400 (case of 0xaee498's switch at 0xaee610, reached by Zinogre u 531 once 0xa9272c's masked walk lets the draw on) and its
direct bl callees not yet lifted, onto lift-effects.sh's lifted-added.js line (add_effects.add_routines, under the lift lock)."""
import os, sys
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX)
os.chdir(EFX)
import add_effects as A
print('added', [hex(a) for a in A.add_routines([0xaef400, 0xaeeda0, 0xaee9ac, 0xaf2b2c, 0xaf2c84, 0xaf2e14])])
for n in ('add_em057_00_u531_lodmid', 'add_em057_00_u531_lodfar'):
    f = os.path.join(EFX, 'vectors', n, 'draw.json')
    if os.path.exists(f):
        os.remove(f); print('removed', f, '(re-recorded next: the new routines need vectors)')
