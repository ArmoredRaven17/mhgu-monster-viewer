# laneA3/pqsum.py <probe.out>...: the PROBE rows (key, starts, live, lit / samples, verdict), the log tail and the missing keys
import json, re, sys
for p in sys.argv[1:]:
    try: l = open(p, encoding='utf8', errors='replace').read()
    except OSError: print(p, 'no file'); continue
    m = re.search(r'PROBE \S+\s+-- (\{.*\})\s*$', l, re.M)
    if not m: print(p, l[:300].replace('\n', ' ')); continue
    d = json.loads(m.group(1)); print(p, d['log'][-3:], 'missing', d['missing'])
    for r in d['rows']: print('   %-36s st %s live %s lit %s/%s %s' % (r['k'], r['st'], r['live'], r['lit'], r['s'], r['verdict']))
