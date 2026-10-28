# notice2probe.py <notice-check out> <pq out>: the notice-check lines as PROBE lines for cen/cenreport.py (its probe merge reads
# `PASS|FAIL PROBE <id> -- {"rows": [{k, verdict, ...}]}`).
import sys, re, json
out = []
for l in open(sys.argv[1], encoding='utf8', errors='replace'):
    m = re.match(r'^(PASS|FAIL) NOTICE (\S+)\s+--\s+(\{.*\})\s*$', l)
    if m:
        d = json.loads(m.group(3))
        out.append('%s PROBE %s  -- %s' % (m.group(1), m.group(2), json.dumps({'rows': d.get('rows', [])})))
open(sys.argv[2], 'w', encoding='utf8').write('\n'.join(out) + '\n')
print(len(out), 'lines')
