"""Lane A4 joint -1: the full table. joint1_records.json (list_j1.py) joined with
  * the coverage census's current-rule verdicts (scratchpad cen/*.out, census.mjs 2026-10-24; cen3/*.out retries override),
  * j1where outputs (where_*.out: the anchors at each bit rise, both rules),
  * j1meter outputs (sh_cur / sh_unit / sh_unitfl / sh_root.out and any all_*.out: starts / draws under each rule).
Writes joint1_table.csv and joint1_table.json beside this file and prints the per-monster summary."""
import json, glob, os, csv, collections, statistics

HERE = os.path.dirname(os.path.abspath(__file__))
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'

def lines(path):
    for line in open(path, encoding='utf-8', errors='replace'):
        if '  -- ' in line and line.startswith(('PASS', 'FAIL')):
            label, js = line.split('  -- ', 1)
            try: yield label, json.loads(js)
            except Exception: pass

recs = json.load(open(os.path.join(HERE, 'joint1_records.json')))
# 1. the census baseline
base = {}
for d in ('cen', 'cen3'):
    for f in sorted(glob.glob(os.path.join(SP, d, 'em*.out'))):
        for label, js in lines(f):
            for r in js.get('recs', []):
                base[r['k']] = dict(st=r.get('st'), df=r.get('df'), s=r.get('s'), lit=r.get('lit'), verdict=r.get('verdict'), src=d)
            for k in js.get('never', []):
                if k not in base or d == 'cen3': base.setdefault(k, dict(st=0, verdict='never started', src=d))
# 2. where
where = {}
for f in glob.glob(os.path.join(HERE, 'where_*.out')):
    for label, js in lines(f):
        mon = label.split()[-1]
        for pk, sh, r52, space, s in js.get('recs', []):
            where[mon + '|' + pk] = s
# 3. meters
meters = collections.defaultdict(dict)
for f in glob.glob(os.path.join(HERE, '*.out')):
    for label, js in lines(f):
        if not label.split()[1:2] == ['J1']: continue
        mon = label.split()[2]
        tag = js.get('rule', '?') + ('+floorAtUnit' if js.get('floorAtUnit') else '')
        for r in js.get('rows', []):
            meters[mon + '|' + r['pk']][tag] = dict(req=r['req'], st=r['st'], df=r['df'], s=r['s'], lit=r['lit'], verdict=r['verdict'],
                                                     log=r['log'][:1], rays=r['rays'][:1])
out = []
for r in recs:
    k = r['monster'] + '|' + r['pel'] + '|' + str(r['key'])
    b = base.get(k + '|' + r['when'], {})
    w = where.get(k, [])
    m = meters.get(k, {})
    s0 = w[0] if w else (m.get('cur', {}).get('log') or [None])[0]
    dy = dx = None
    if s0 and s0.get('gid0') and s0.get('unit'):
        g, u = s0['gid0'], s0['unit']
        dy = round(g[1] - u[1], 1); dx = round(((g[0] - u[0]) ** 2 + (g[2] - u[2]) ** 2) ** 0.5, 1)
    row = dict(r, census=b.get('verdict'), census_st=b.get('st'), census_lit=b.get('lit'),
               where=s0, d_up=dy, d_flat=dx, floor=(s0 or {}).get('floor'),
               cur_h=round(s0['gid0'][1] - s0['floor'], 1) if s0 and s0.get('floor') is not None and s0.get('gid0') else None,
               rom_h=round(s0['unit'][1] - s0['floor'], 1) if s0 and s0.get('floor') is not None and s0.get('unit') else None,
               meters={t: {kk: v[kk] for kk in ('req', 'st', 'df', 's', 'lit', 'verdict')} for t, v in m.items()})
    out.append(row)
json.dump(out, open(os.path.join(HERE, 'joint1_table.json'), 'w'), indent=1)
cols = ['monster', 'pel', 'key', 'when', 'efl', 'mode', 'space', 'sh', 'shLimit', 'ray52', 'ray5c', 'census', 'census_st', 'census_lit',
        'clip_f', 'gid0', 'unit', 'floor', 'cur_h', 'rom_h', 'd_up', 'd_flat', 'cur', 'unit_rule', 'unit+floor', 'root']
with open(os.path.join(HERE, 'joint1_table.csv'), 'w', newline='') as fh:
    wr = csv.writer(fh); wr.writerow(cols)
    for o in out:
        w = o['where'] or {}
        mv = lambda t: (lambda v: '' if not v else '%s st%s lit%s/%s' % (v['verdict'], v['st'], v['lit'], v['s']))(o['meters'].get(t))
        wr.writerow([o['monster'], o['pel'], o['key'], o['when'], o['efl'], o['mode'], o['space'], o['sh'], o['shLimit'], o['ray52'], hex(o['ray5c'] or 0),
                     o['census'], o['census_st'], o['census_lit'], ('%s f%s' % (w.get('clip'), w.get('f'))) if w else '', w.get('gid0'), w.get('unit'), o['floor'],
                     o['cur_h'], o['rom_h'], o['d_up'], o['d_flat'], mv('cur'), mv('unit'), mv('unit+floorAtUnit'), mv('root')])
# summary per monster (clip records with a where sample)
by = collections.defaultdict(list)
for o in out: by[o['monster']].append(o)
print('%-9s %5s %5s %5s %6s %8s %8s %8s' % ('monster', 'j-1', 'clip', 'sh', 'where', 'd_up med', 'd_up max', 'flat med'))
for mon in sorted(by):
    L = by[mon]; c = [o for o in L if o['when'] == 'clip']; wv = [o for o in c if o['d_up'] is not None]
    du = [o['d_up'] for o in wv]; fl = [o['d_flat'] for o in wv]
    print('%-9s %5d %5d %5d %6d %8s %8s %8s' % (mon, len(L), len(c), sum(1 for o in L if o['sh']), len(wv),
          round(statistics.median(du)) if du else '-', round(max(du, key=abs)) if du else '-', round(statistics.median(fl)) if fl else '-'))
