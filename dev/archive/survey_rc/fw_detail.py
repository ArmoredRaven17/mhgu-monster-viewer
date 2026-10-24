"""Per Flying Wyvern: each record named only OUTSIDE the PSL file mask, or not exported, with where it is named."""
import sys, os, json, io, contextlib, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
VIEWER = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
survey = json.load(open(sys.argv[1]))
out = {}
for mon, r in survey.items():
    if 'error' in r or r.get('enableWordRead'):
        continue
    real = A.psl_mask_monsters
    with contextlib.redirect_stdout(io.StringIO()):
        cfg, _, rows_f, _ = A.plan(mon)
        A.psl_mask_monsters = lambda: real() | {mon}
        try: cfg, _, rows_w, _ = A.plan(mon)
        finally: A.psl_mask_monsters = real
    fset = {(x[0], x[1], x[3]) for x in rows_f}
    effp = os.path.join(VIEWER, 'docs', 'effects', mon + '.json')
    exported = {(e['record']['pel'], e['record']['key']) for e in json.load(open(effp, encoding='utf-8'))['effects'] if e.get('record')}
    per = collections.defaultdict(lambda: {'motions': [], 'efl': None, 'types': None, 'exported': False})
    for x in rows_w:
        lst, slot, frames, bit, pel, eff, rec, on, clip_state, state, types = x
        inside = (lst, slot, bit) in fset
        if inside and (pel, eff) in exported:
            continue
        name = ('c' if pel == cfg['cpel'] else 'u') + str(eff)
        d = per[name]
        d['motions'].append('L%s M%s b%s%s' % (lst, slot, bit, '' if inside else '*'))
        d['efl'] = rec['efl'] if rec else None
        d['types'] = types
        d['exported'] = (pel, eff) in exported
    out[mon] = {k: {**v, 'motions': v['motions'][:12], 'nMotions': len(v['motions'])} for k, v in sorted(per.items())}
    print('done', mon, file=sys.stderr, flush=True)
print(json.dumps(out, indent=1, default=str))
