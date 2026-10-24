"""rk_diff.py: the draw survey at quest rank 1 against rank 5 (rk/<rank>_<id>.out): per monster, every record whose start or draw
differs -- started only at one rank, or a different verdict. Prints the monsters with no REPORT at either rank too."""
import json, re, glob, os, collections
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rk')
def load(p):
    try: t = open(p, encoding='utf8', errors='replace').read()
    except FileNotFoundError: return None
    m = re.search(r'^FAIL REPORT (\S+)\s+--\s+(\{.*\})\s*$', t, re.M)
    if not m: return None
    d = json.loads(m.group(2))
    return {r['k']: r for r in d.get('recs', [])}
ids = sorted({os.path.basename(p)[2:-4] for p in glob.glob(os.path.join(D, '*.out'))})
missing = []
for mon in ids:
    a, b = load(os.path.join(D, '1_%s.out' % mon)), load(os.path.join(D, '5_%s.out' % mon))
    if a is None or b is None:
        missing.append(mon + (' (rank 1)' if a is None else '') + (' (rank 5)' if b is None else '')); continue
    rows = []
    for k in sorted(set(a) | set(b)):
        x, y = a.get(k), b.get(k)
        sx = x['st'] if x else 0; sy = y['st'] if y else 0
        vx = x['verdict'] if x else '-'; vy = y['verdict'] if y else '-'
        if (sx > 0) != (sy > 0) or vx != vy:
            rows.append('  %-46s rank 1: %-3s %-26s | rank 5: %-3s %s' % (k.split('|', 1)[1], sx, vx, sy, vy))
    if rows: print(mon); print('\n'.join(rows))
print('NO REPORT:', ', '.join(missing) if missing else 'none')
