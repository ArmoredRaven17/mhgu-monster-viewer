"""Lane A4 joint -1: compare j1meter runs record by record. Usage: python cmp.py sh_cur.out sh_unit.out [sh_unitfl.out ...]
Prints per record: requests / starts / lit samples per run, and the anchor (gid-0 vs unit) and floor at the first request."""
import sys, json
runs = []
for p in sys.argv[1:]:
    rows = {}
    for line in open(p, encoding='utf-8', errors='replace'):
        if '  -- ' not in line or ' J1 ' not in line: continue
        lab, js = line.split('  -- ', 1); d = json.loads(js)
        mon = lab.split()[2]
        for r in d.get('rows', []): rows[mon + '|' + r['pk']] = r
    runs.append((p.replace('.out', ''), rows))
keys = list(runs[0][1])
print('%-24s ' % 'record' + ' '.join('%-26s' % n for n, _ in runs) + ' anchor@first request (gid0 | unit | floor)')
for k in keys:
    cells = []
    for n, rows in runs:
        r = rows.get(k)
        cells.append('%-26s' % ('-' if not r else 'rq%d st%d lit%d/%d %s' % (r['req'], r['st'], r['lit'], r['s'],
                     'DRAWS' if r['verdict'] == 'draws' else r['verdict'][:10])))
    l = (runs[0][1][k]['log'] or [{}])[0]
    print('%-24s ' % k + ' '.join(cells) + ' %s f%s %s | %s | %s' % (l.get('clip'), l.get('f'), l.get('gid0'), l.get('unit'), l.get('floor')))
