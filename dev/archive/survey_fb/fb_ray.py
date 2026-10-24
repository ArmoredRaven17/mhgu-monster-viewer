"""Which unexported PSL records are ground-ray / stage-ray records (payload +0x52 set; +0x5c bit 4)."""
import sys, os, json, io, contextlib
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
VIEWER = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
for mon in sys.argv[1:]:
    real = A.psl_mask_monsters
    A.psl_mask_monsters = lambda: real() | {mon}
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            cfg, _, rows, recs = A.plan(mon)
    finally:
        A.psl_mask_monsters = real
    eff = json.load(open(os.path.join(VIEWER, 'docs', 'effects', mon + '.json'), encoding='utf-8'))['effects']
    exported = {(e['record']['pel'], e['record']['key']) for e in eff if e.get('record')}
    seen = set()
    for (pel, k, arr), r in recs.items():
        if (pel, k) in exported or (pel, k) in seen: continue
        seen.add((pel, k))
        p = A.payload_of(pel, arr, k)
        print(mon, pel, k, arr, r['efl'], 'p52=%d p5c=%#x' % (p[0x52], p[0x5c]) if p else 'nopayload', 'STAGE_RAY' if A.stage_ray(p) else '')
