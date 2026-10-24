"""Per monster: whole-block PSL bindings split by which part of the enable word decides them, in / out of the file mask."""
import sys, os, json, io, contextlib, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
out = {}
for mon in sys.argv[1:]:
    real = A.psl_mask_monsters
    with contextlib.redirect_stdout(io.StringIO()):
        cfg, _, rows_f, _ = A.plan(mon)
        A.psl_mask_monsters = lambda: real() | {mon}
        try: cfg, _, rows_w, _ = A.plan(mon)
        finally: A.psl_mask_monsters = real
    fset = {(x[0], x[1], x[3]) for x in rows_f}
    c = collections.Counter(); ov = collections.defaultdict(list)
    for x in rows_w:
        if x[6] is None: continue
        lst, slot, bit = x[0], x[1], x[3]
        grp = 'always0-5' if bit < 6 else 'state6-14' if bit < 15 else 'override15+'
        ins = 'in' if (lst, slot, bit) in fset else 'OUT'
        c[grp + ' ' + ins] += 1
        if bit >= 15:
            ov['L%s M%s' % (lst, slot)].append(('c' if x[4] == cfg['cpel'] else 'u') + str(x[5]) + ' b%d%s' % (bit, '' if ins == 'in' else '*'))
    out[mon] = {'counts': dict(c), 'override_bits': {k: sorted(set(v)) for k, v in ov.items()}}
    print(mon, dict(sorted(c.items())))
    for k, v in ov.items(): print('   ', k, ' '.join(sorted(set(v))))
json.dump(out, open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\survey_ap\bits.json', 'w'), indent=1)
