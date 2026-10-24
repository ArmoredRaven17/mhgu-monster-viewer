import sys, os, json, io, contextlib
sys.path.insert(0, r'C:\MHGU-Extract\efx'); os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
mon = sys.argv[1]
real = A.psl_mask_monsters
with contextlib.redirect_stdout(io.StringIO()):
    cfg, _, rows_f, rec_f = A.plan(mon)
    A.psl_mask_monsters = lambda: real() | {mon}
    cfg, _, rows_w, rec_w = A.plan(mon)
exported = {(e['record']['pel'], e['record']['key']) for e in json.load(open(os.path.join(A.DOCS, 'effects', mon + '.json'), encoding='utf-8'))['effects'] if e.get('record')}
print('file-mask records', len(rec_f), 'whole', len(rec_w), 'bindings', len(rows_f), len(rows_w))
for k in rec_w:
    if (k[0], k[1]) not in exported: print('  not exported:', k, 'in file plan' if k in rec_f else 'whole only')
