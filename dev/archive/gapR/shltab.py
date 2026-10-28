# shltab.py <shl dump>: each shell folder's modes and the ef records they name (from <archive>/fb/shl.py output)
import re, json, sys
cur = None
for l in open(sys.argv[1], encoding='utf8'):
    if l.startswith('=='):
        cur = l.split()[2].split(chr(92))[-1]; print(l.strip()[:100]); continue
    m = re.match(r'\s+mode (\d+) (\{.*\})', l)
    if m:
        d = json.loads(m.group(2))
        print('   %s m%-2s %s' % (cur, m.group(1), [e['arr'] for e in d['ef']]))
