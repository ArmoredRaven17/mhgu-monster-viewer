# laneB2/sum.py <name>...: pq/<name>.out -> the log tail, missing, and each row's starts / verdict / clips
import json, re, sys, os
SP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for f in sys.argv[1:]:
    for l in open(os.path.join(SP, 'pq', f + '.out'), encoding='utf8', errors='replace'):
        m = re.match(r'^(PASS|FAIL) PROBE (\S+)\s+--\s+(\{.*\})', l)
        if m:
            d = json.loads(m.group(3)); print('==', f, m.group(2)); print('  log', [x for x in d['log'] if not x.startswith('played')][-12:])
            print('  missing', d['missing'])
            for r in d['rows']: print('  ', r['k'], 'st', r['st'], 'live', r['live'], 'lit', r['lit'], r['verdict'], r['clips'][:3])
        elif l.startswith('page error') or l.startswith('FAILED'): print('  ', l[:300].rstrip())
