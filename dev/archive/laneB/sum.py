# laneB/sum.py <id>...: the census3 REPORT line of cen3/<id>.out -> each wanted record's starts / verdict, and the never list
import json, re, sys, os
SP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for mon in sys.argv[1:]:
    f = os.path.join(SP, 'cen3', mon + '.out')
    if not os.path.exists(f): print(mon, 'no output'); continue
    for l in open(f, encoding='utf8', errors='replace'):
        m = re.match(r'^(?:FAIL|PASS) REPORT (\S+)\s+--\s+(\{.*\})\s*$', l)
        if m:
            d = json.loads(m.group(2))
            if 'error' in d: print(mon, 'ERROR', d['error']); continue
            print(mon, 'never:', d['never'])
            for r in d['recs']:
                if r['w'] != 'shell': print('   ', r['k'], 'st', r.get('starts'), r['verdict'], list((r.get('clips') or {}).keys())[:3] if isinstance(r.get('clips'), dict) else r.get('clips'))
        elif l.startswith('page error') or l.startswith('FAILED'): print(mon, l.strip()[:300])
