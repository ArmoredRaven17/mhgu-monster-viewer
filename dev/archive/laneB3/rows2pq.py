# laneB3/rows2pq.py (lane B3, 2026-10-27): a lane B3 page check's line ("PASS <TAG> [<mon>] -- ... {json with "rows"}") into the
# census's probe format ("PASS PROBE <mon>  -- {"rows": [...]}"), so dev/archive/cen/cenreport.py takes the meter's rows.
#   python dev/archive/laneB3/rows2pq.py <check .out> <TAG> <mon> <pq .out to write>
import sys, re, json
src, tag, mon, dst = sys.argv[1:5]
out = []
for l in open(src, encoding='utf8', errors='replace'):
    m = re.match(r'^(PASS|FAIL) ' + re.escape(tag) + r'(?: \S+)?\s+--\s+.*?(\{.*\})\s*$', l)
    if not m: continue
    rows = [{'k': r['k'], 'verdict': r['verdict'], 'clips': []} for r in json.loads(m.group(2))['rows'] if r['k'].startswith(mon + '|')]
    out.append('%s PROBE %s  -- %s' % (m.group(1), mon, json.dumps({'log': [tag], 'rows': rows})))
open(dst, 'w', encoding='utf8', newline='\n').write('\n'.join(out) + '\n')
print('\n'.join(out))
