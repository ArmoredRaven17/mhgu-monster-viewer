import sys, os, json, io, contextlib
sys.path.insert(0, r'C:\MHGU-Extract\efx'); os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
for mon in sys.argv[1:]:
    real = A.psl_mask_monsters
    with contextlib.redirect_stdout(io.StringIO()):
        cfg, _, rf, _ = A.plan(mon)
        A.psl_mask_monsters = lambda: real() | {mon}
        try: cfg, _, rw, recw = A.plan(mon)
        finally: A.psl_mask_monsters = real
    ex = {(e['record']['pel'], e['record']['key']) for e in json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects\%s.json' % mon, encoding='utf-8'))['effects'] if e.get('record')}
    need = sorted({(x[4], x[5], (x[6] or {}).get('efl')) for x in rw if x[6] and (x[4], x[5]) not in ex})
    norec = sorted({(x[4], x[5]) for x in rw if not x[6]})
    print(mon, 'file', len(rf), 'whole', len(rw), 'to export', need, 'no record', norec)
