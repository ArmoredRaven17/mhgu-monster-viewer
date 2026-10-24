# per action: the motion each phase sets, and which frame literal (answered alone, 'only') makes which sp_01 mode, slots at LVL
import sys, os, struct
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, FB); os.chdir(FB)
V = int(sys.argv[1]); lvl = int(os.environ.get('LVL', '2')); sys.argv = ['x']
import trgen as T
cur = [lvl] * 4 + [0, 0] if V == 0 else [lvl, lvl, 0, 0, 0, lvl]
if os.environ.get('SLOTS'): cur = [int(x) for x in os.environ['SLOTS'].split(',')]
ids = [0x161, 0x163, 0x164] if V == 0 else [0x165, 0x168, 0x16a]
poke = {T.E + 0xcb50: list(struct.pack('<6i', *cur)), T.E + 0xcb38: list(struct.pack('<6i', *cur)), T.E + 0xcae0: list(struct.pack('<3I', *ids))}
FL = sorted(set(T.TUNE_F[i] for i in list(range(0x45, 0x53)) + [0x89]))
for n in (0, 1, 5, 6, 0x32, 0x5a, 0x5b, 0x5c, 0x5d, 0x70, 0x71):
    r0 = T.run(7, n, 0, V, 0, poke=poke)
    m0 = [e[1] for e in r0.get('ev', []) if e[0] == 'mot']
    rows = []
    for ph in (1, 2):
        r = T.run(7, n, ph, V, 0, poke=poke)
        mp = [e[1] for e in r.get('ev', []) if e[0] == 'mot']
        for F in FL:
            r = T.run(7, n, ph, V, 0, poke=poke, only=F)
            for e in r.get('ev', []):
                if e[0] == 'create' and e[2] in (3, 4, 5, 6, 20):
                    rows.append('p%d f%g m%d pos%s words%s' % (ph, F, e[2], e[3], e[4]))
                if e[0] == 'create' and e[2] not in (3, 4, 5, 6, 20) and os.environ.get('ALL'):
                    rows.append('p%d f%g OTHER m%d' % (ph, F, e[2]))
        if mp: rows.insert(0, 'p%d sets %s' % (ph, mp))
    print('7:%#04x p0 sets %s |' % (n, m0), ' ; '.join(rows))
