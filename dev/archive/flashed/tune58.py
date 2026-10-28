"""tune58.py [mon ...] -- the flash entry of each dttune: tune = obj+0x64 (0x70fbc); 0xa1a88 reads [tune+0x58] -> E,
[E+4] -> s16 x3 (normal / enraged-or-0x816b8 / tired) -> P+0x59c. Runs the dttune loader 0x57684 under tune_emu (unicorn).
Flashed-state read, 2026-10-25. No args = every monster under C:/MHGU-Extract/scratch-em."""
import sys, os, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\narga-scratch')
from tune_emu import Loader
ROOT = r'C:\MHGU-Extract\scratch-em'
mons = sys.argv[1:] or sorted(os.listdir(ROOT))
out = {}
for v in mons:
    p = os.path.join(ROOT, v, 'enemy', 'dt_tune', '%s_dttune.dtt' % v)
    if not os.path.exists(p): print('%s: no dttune' % v); continue
    L = Loader(p, 0x57684)
    tune = L.obj + 0x64
    E = L.u32(tune + 0x58)
    row = {'consumed': L.pos, 'size': len(L.data), 'E': E}
    if E:
        row['Ebytes'] = L.rd(E, 0x10).hex()
        A = L.u32(E + 4)
        row['A'] = A
        if A: row['vals'] = list(struct.unpack('<3h', L.rd(A, 6)))
    out[v] = row
    print(v, json.dumps(row))
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tune58.json'), 'w'), indent=1)
