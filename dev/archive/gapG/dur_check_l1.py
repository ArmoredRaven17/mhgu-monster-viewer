# (a) each action's phase after phase 0 / after its phase-1 end; (b) dmg-0 sites with part durability P+0x3c0+12*part poked to 1
import sys, os, struct
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, FB); os.chdir(FB)
V = int(sys.argv[1]); sys.argv = ['x']
import trgen as T
cur = [1] * 4 + [0, 0] if V == 0 else [1, 1, 0, 0, 0, 1]
ids = [0x161, 0x163, 0x164] if V == 0 else [0x165, 0x168, 0x16a]
base = {T.E + 0xcb50: list(struct.pack('<6i', *cur)), T.E + 0xcae0: list(struct.pack('<3I', *ids))}
dur = dict(base); 
for part in range(8): dur[T.P + 0x3c0 + 12 * part] = list(struct.pack('<h', 1))
for n in (0, 1, 5, 0x5a, 0x5c, 0x70):
    r = T.run(7, n, 0, V, 0, poke=base); ph = T.mu.mem_read(T.P + 0x1a1, 1)[0]
    r = T.run(7, n, 1, V, 0, poke=base, ended=1); ph1 = T.mu.mem_read(T.P + 0x1a1, 1)[0]
    m1 = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
    out = []
    for ph_ in (1, 2):
        for F in sorted(set(T.TUNE_F[i] for i in list(range(0x45, 0x53)) + [0x89])):
            r = T.run(7, n, ph_, V, 0, poke=dur, only=F)
            out += ['p%d f%g m%d' % (ph_, F, e[2]) for e in r.get('ev', []) if e[0] == 'create' and e[2] in (3, 4, 5, 6)]
    print('7:%#04x phase0 -> %d; phase1 ended -> %d %s; durability 1: %s' % (n, ph, ph1, m1, out))
