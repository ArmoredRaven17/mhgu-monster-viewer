# laneB/addrec.py <mon> <pel>:<key>[:<ARRAY>][@when] ...: add_effects.export() for these records only -- merged into
# docs/effects/<mon>.json, models staged -- WITHOUT rewriting the monster's CLIP_EFFECTS block (render/monster.js is shared)
import sys, os
sys.path.insert(0, r'C:\MHGU-Extract\efx'); os.chdir(r'C:\MHGU-Extract\efx')
sys.argv = [sys.argv[0]] + sys.argv[1:]
import add_effects as A
mon = sys.argv[1]
want = []
for s in sys.argv[2:]:
    when = 'event'
    if '@' in s: s, when = s.split('@')
    p = s.split(':')
    want.append((p[0], int(p[1]), p[2] if len(p) > 2 else 'UNIQUE', when))
d = A.export(mon, want)
A.stage_models(d)
