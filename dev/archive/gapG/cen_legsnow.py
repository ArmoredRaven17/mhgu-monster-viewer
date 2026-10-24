# which actions make uEm083_00's leg-snow sp_01 3..6 (0x105fd94) / 20: the snow slots poked to level 2 (the gate 0x1053d8c open)
import sys, os, time
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, FB); os.chdir(FB)
V = int(sys.argv[1]); ST = [int(x, 0) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else [7]
lvl = int(os.environ.get('LVL', '2'))
sys.argv = ['x']
import struct
import trgen as T
cur = [lvl, lvl, lvl, lvl, 0, 0] if V == 0 else [lvl, lvl, 0, 0, 0, lvl]
poke = {T.E + 0xcb50: list(struct.pack('<6i', *cur)), T.E + 0xcb38: list(struct.pack('<6i', *cur))}
ids = [0x161, 0x163, 0x164] if V == 0 else [0x165, 0x168, 0x16a]
poke[T.E + 0xcae0] = list(struct.pack('<3I', *ids))
if os.environ.get('NOPOKE'): poke = {T.E + 0xcae0: list(struct.pack('<3I', *ids))}
t0 = time.time()
for st in ST:
    for n in range(256):
        seen = {}
        for ph in range(9):
            for scn in ({'frame': 1, 'frame2': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}):
                r = T.run(st, n, ph, V, 0, stub={0x3a8430: 5, 0x49930: 10}, poke=poke, **scn)
                for e in r.get('ev', []):
                    if e[0] == 'create' and e[1] in ('0x163', '0x168') and e[2] in (3, 4, 5, 6, 20):
                        seen.setdefault('m%d %s via %s' % (e[2], e[1], e[5]), set()).add(ph)
                    if e[0] == 'create' and os.environ.get('ALL'):
                        seen.setdefault('m%d %s via %s' % (e[2], e[1], e[5]), set()).add(ph)
        if seen: print('%d:%#04x' % (st, n), {k: sorted(v) for k, v in seen.items()}, flush=True)
print('# done %.0fs' % (time.time() - t0))
