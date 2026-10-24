# which status-7 actions make Elderfrost's sp_01 20 (0x1060e28): his part-1 snow armour present (e+0xcb64 = 1) and one point from breaking
import sys, os
sys.argv = ['x']
import trgen as T
poke = {T.E + 0xcb64: [1, 0, 0, 0], T.P + 12 + 0x3c0: [1, 0]}
for n in range(256):
    seen = {}
    for ph in range(9):
        for scn in ({'frame': 1}, {'frame': 1, 'ended': 1}, {'frame2': 1, 'frame': 1}):
            r = T.run(7, n, ph, 4, 0, stub={0x3a8430: 5, 0x49930: 10}, poke=poke, **scn)
            for e in r.get('ev', []):
                if e[0] == 'create' and e[1] == '0x168' and e[2] == 20: seen.setdefault('f%s %s' % (e[6], e[5]), set()).add(ph)
    if seen: print('7:%#04x' % n, {k: sorted(v) for k, v in seen.items()}, flush=True)
