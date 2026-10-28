# laneB3/notice2pq.py (lane B3, 2026-10-27): turn notice-rage.mjs lines ("PASS NOTICE-RAGE <mon> -- ... {json}") into the census's
# probe format ("PASS PROBE <mon>  -- {"rows": [...]}"), so dev/archive/cen/cenreport.py takes the meter's c 1200 / c 1201 rows from them.
#   python dev/archive/laneB3/notice2pq.py <notice-rage .out> <pq .out to write> [mon,mon..]
import sys, re, json
src, dst = sys.argv[1], sys.argv[2]
only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
out = []
for l in open(src, encoding='utf8', errors='replace'):
    m = re.match(r'^(PASS|FAIL) NOTICE-RAGE (\S+)\s+--\s+.*?(\{.*\})\s*$', l)
    if not m or (only and m.group(2) not in only): continue
    rows = [{'k': r['k'], 'verdict': r['verdict'], 'clips': []} for r in json.loads(m.group(3))['rows']]
    out.append('%s PROBE %s  -- %s' % (m.group(1), m.group(2), json.dumps({'log': ['notice-rage.mjs'], 'rows': rows})))
open(dst, 'w', encoding='utf8', newline='\n').write('\n'.join(out) + '\n')
print('\n'.join(out))
