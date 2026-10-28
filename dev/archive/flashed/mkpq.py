"""mkpq.py <meter.out> ... -- flashmeter.mjs output -> PROBE lines for cen/cenreport.py's probe merge (`PASS|FAIL PROBE <id> -- {"rows":
[{k, verdict, clips}]}`), written to <scratchpad>/pq/flashed.out (the live path cenreport globs: <its dir>/../pq/*.out).
FORCED rows (an immune monster's record held by force -- the ROM never requests it there) are LEFT OUT: they are not a measurement
of anything the game does. Flashed state, 2026-10-25."""
import sys, re, json, os
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
best = {}
for f in sys.argv[1:]:
    for l in open(f, encoding='utf8', errors='replace'):
        m = re.match(r'^(PASS|FAIL) FLASH (\S+)( FORCED \(immune\))?.*?--\s+(\{.*\})\s*$', l)
        if not m or m.group(3): continue
        d = json.loads(m.group(4))
        rows = [{'k': r['k'], 'verdict': r['verdict'], 'clips': ['Flashed ' + c for c in (r.get('clips') or {})]} for r in d.get('rows', [])]
        if rows and (m.group(2) not in best or rows[0]['verdict'] == 'draws'): best[m.group(2)] = (m.group(1), rows)
out = ['%s PROBE flashed_%s  -- %s' % (ok, mon, json.dumps({'rows': rows})) for mon, (ok, rows) in sorted(best.items())]
os.makedirs(os.path.join(SP, 'pq'), exist_ok=True)
open(os.path.join(SP, 'pq', 'flashed.out'), 'w', encoding='utf8').write('\n'.join(out) + '\n')
print(len(out), 'monsters ->', os.path.join(SP, 'pq', 'flashed.out'))
