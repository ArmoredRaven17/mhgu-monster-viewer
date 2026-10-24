# frameaudit.py CLASS MON EM VAR main_status:action:phase ... (2026-10-20): for each action phase, every frame literal its frame tests
# name (a frame=1 / frame2=1 run's ftest events), each answered alone (`only`) -- the frames that create, with the created id / mode.
# Trap 126: the triage's frame list is not the maker's.
import os, sys, json
os.environ['FB_CLASS'], os.environ['FB_MON'], os.environ['FB_EM'] = sys.argv[1], sys.argv[2], sys.argv[3]
VARI = int(sys.argv[4])
exec(open('trgen.py').read())
for spec in sys.argv[5:]:
    st, n, ph = [int(x, 16) for x in spec.split(':')]
    lits = set()
    for fr in (0, 1):
        r = run(st, n, phase=ph, variant=VARI, frame=fr, frame2=fr, stub={0x3a8430: 5, 0x49930: 10})
        for e in r.get('ev', []):
            if e[0] == 'ftest': lits.add(e[1])
            elif e[0] == 'ftest2': lits.add(e[2][1])
    res = []
    for F in sorted(x for x in lits if isinstance(x, float)):
        r2 = run(st, n, phase=ph, variant=VARI, only=F, stub={0x3a8430: 5, 0x49930: 10})
        cr = [(e[1], e[2]) for e in r2.get('ev', []) if e[0] == 'create']
        if cr: res.append((F, cr))
    print('%d:0x%02x ph%d' % (st, n, ph), 'literals', sorted(x for x in lits if isinstance(x, float)), '->', res)
