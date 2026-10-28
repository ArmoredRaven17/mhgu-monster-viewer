"""summarize.py (hyper audit, 2026-10-28): page_*.out (pageaudit.mjs) + datacheck.json + questroster.json + the loader's resource
columns (rescols.json) -> the per-monster audit table rows (markdown) on stdout, and audit.json.
    python summarize.py > table.md"""
import json, os, re, glob
H = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(H, '..', '..', '..', 'docs')
mons = [m for m in json.load(open(os.path.join(D, 'monsters.json')))['monsters'] if not m.get('small')]
names = {m['id']: m.get('name') or m['id'] for m in mons}
dc = json.load(open(os.path.join(H, 'datacheck.json')))
qr = json.load(open(os.path.join(H, 'questroster.json')))
rc = json.load(open(os.path.join(H, 'rescols.json')))
page = {}
# below G from runall.sh; G from runall_g.sh (the fixed tool) and Nibelsnarf's rerun t_056c.out, read last so they win
for f in sorted(glob.glob(os.path.join(H, 'page_*.out'))) + sorted(glob.glob(os.path.join(H, 'pageG_*.out'))) + [os.path.join(H, 't_056c.out')]:
    for l in open(f, encoding='utf8', errors='replace'):
        m = re.match(r'(PASS|FAIL) (em\d+_\d+) (r\d|ERROR|r\d ROW)\s+--\s+(.*)$', l.strip())
        if not m: continue
        mon, tag, body = m.group(2), m.group(3), m.group(4)
        try: page.setdefault(mon, {})[tag] = (m.group(1), json.loads(body) if tag != 'ERROR' else body)
        except Exception: page.setdefault(mon, {})[tag] = (m.group(1), body)
def eyestr(R):
    best = None
    for k, a in (R.get('auras') or {}).items():
        e = a.get('node', {}).get('eyes', {})
        if e.get('n'): best = (k, e, a.get('none', {}).get('eyes', {}), a.get('node', {}).get('scenePx'), a.get('none', {}).get('scenePx'))
    if not best: return 'none (data: no eye bit)'
    k, e, e0, pxn, px0 = best
    srt = 'sorted' if any(' sorted ' in x for x in e['by']) else 'unsorted'
    return f"u {k}: {e['halo']} halo / {e['core']} core, {srt} under GPU-particle"
rows, out = [], {}
for m in mons:
    i = m['id']
    should = rc.get(i, False)
    q = qr.get(i)
    o = {'name': names[i], 'resource': should, 'quests': q['ranks'] if q else {}}
    if not should and not q:
        o.update(row='hidden (correct)', verdict='no hyper in GU')
        out[i] = o
        rows.append(f"| {names[i]} ({i}) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |")
        continue
    P = page.get(i, {})
    cells = []
    for rk, fk in (('r3', 'normal'), ('r5', 'g')):
        pr = P.get(rk) or P.get(rk + ' ROW')
        if not pr: cells.append((rk, None)); continue
        cells.append((rk, pr))
    def rowcell():
        s = []
        for rk, pr in cells:
            if not pr: s.append(f'{rk}: not run'); continue
            R = pr[1]
            if isinstance(R, str): s.append(f'{rk}: {R[:60]}'); continue
            n = len(R.get('options') or [])
            s.append(f"{'below G' if rk == 'r3' else 'G'}: {n} pairs" + ('' if R.get('optionsMatch', n == 0) else ' MISMATCH') + ('' if R.get('rowShown') or not n else ' HIDDEN'))
        return '; '.join(s)
    def auracell():
        s = []
        for rk, pr in cells:
            if not pr or isinstance(pr[1], str): continue
            R = pr[1]
            if not R.get('opts'): s.append(f"{'below G' if rk == 'r3' else 'G'}: none in file"); continue
            keys = sorted({k for v in R['opts'].values() for k in v['rows']})
            draws = [k for k in keys if all(v['rows'][k]['verdict'] == 'draws' for v in R['opts'].values() if k in v['rows'])]
            faint = [k for k in keys if (R['auras'].get(k, {}).get('none', {}).get('scenePx') or [0])[0] <= max(500, (R.get('noisePx') or [0])[0])]
            s.append(f"{'below G' if rk == 'r3' else 'G'}: {len(draws)}/{len(keys)} draw" + (f" (in scene <= noise: {', '.join('u ' + k for k in faint)})" if faint else ''))
        return '; '.join(s)
    def burstcell():
        s = []
        for rk, pr in cells:
            if not pr or isinstance(pr[1], str): continue
            b = pr[1].get('burst')
            if not b: s.append('--'); continue
            if isinstance(b, str): s.append(f"{'below G' if rk == 'r3' else 'G'}: {b}"); continue
            s.append(f"{'below G' if rk == 'r3' else 'G'}: {b['clip']} L{b['L']} " + ', '.join(f"u {x['u']} {x['st']}/{x['expected']} {x['verdict']}" for x in b['result']))
        return '; '.join(s)
    eyes = ''
    for rk, pr in cells[::-1]:
        if pr and not isinstance(pr[1], str) and pr[1].get('auras'): eyes = eyestr(pr[1]); break
    fails = [rk for rk, pr in cells if pr and pr[0] == 'FAIL']
    o.update(row=rowcell(), auras=auracell(), eyes=eyes, bursts=burstcell(), fails=fails, page={rk: pr[1] for rk, pr in cells if pr})
    out[i] = o
    qs = ', '.join(f"{'G' if k == '5' else 'HR' if k == '3' else 'rank ' + k} {v}" for k, v in sorted(q['ranks'].items())) if q else 'none'
    rows.append(f"| {names[i]} ({i}) | yes (.mdd path; hyper quests {qs}) | {rowcell()} | {auracell()} | {eyes} | {burstcell()} | {'FAIL ' + ','.join(fails) if fails else 'all pass'} | |")
json.dump(out, open(os.path.join(H, 'audit.json'), 'w'), indent=1)
print('| monster | should have Hyper (ROM) | row offered | auras start / draw (meter) | eyes | bursts (one hooked clip) | page | cause / fixed |')
print('|---|---|---|---|---|---|---|---|')
print('\n'.join(rows))
