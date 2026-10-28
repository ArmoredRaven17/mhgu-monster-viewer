# laneA/pqsum.py: one-line rows of a probe output (PROBE lines): key, starts, verdict, clips; and `missing`
import json, re, sys
for f in sys.argv[1:]:
    for l in open(f, encoding='utf8', errors='replace'):
        m = re.search(r'PROBE (\S+)\s+--\s+(\{.*\})', l)
        if not m: continue
        d = json.loads(m.group(2))
        print(m.group(1), 'missing:', d.get('missing'), '| log:', '; '.join(d.get('log', []))[:200])
        for r in d['rows']: print('  ', r['k'], r['st'], r['verdict'], (r.get('clips') or [])[:2])
