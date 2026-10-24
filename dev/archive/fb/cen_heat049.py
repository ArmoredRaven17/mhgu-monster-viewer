import sys
sys.argv = ['x']
import trgen as T
import struct
A = T.E + 0x200000
poke = {T.E + 0xcac0 + 2 * k: [3, 0] for k in range(8)}
poke[T.E + 0x75f0] = list(struct.pack('<I', A)); poke[A + 0x64] = list(struct.pack('<I', A + 0x100)); poke[A + 0x100] = [9] * 0x40
for st in (3, 6, 7, 12):
  for n in range(256):
    seen = {}
    for ph in range(9):
        lits = set()
        for scn in ({'frame': 0, 'frame2': 0}, {'frame': 1, 'frame2': 1}, {'frame': 0, 'frame2': 0, 'ended': 1}):
            r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5, 0x49930: 10}, poke=poke, **scn)
            for e in r.get('ev', []):
                if e[0] == 'ftest': lits.add(e[1])
                if e[0] == 'ftest2': lits.add(e[2][1])
        for L in sorted(x for x in lits if x is not None):
            r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5, 0x49930: 10}, poke=poke, only=L)
            for e in r.get('ev', []):
                if e[0] == 'create' and e[1] == '0xed': seen.setdefault('m%d f%s %s %s %s' % (e[2], L, e[5], e[3], e[4]), set()).add(ph)
    if seen: print('%d:%#04x' % (st, n), {k: sorted(v) for k, v in seen.items()}, flush=True)
