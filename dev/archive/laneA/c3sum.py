# laneA/c3sum.py (effects lane A, 2026-10-25): census3 outputs (cen3/<id>.out) -> per monster: what is still never started, and the
# open keys that now started (with verdict). usage: c3sum.py <id> [<id> ...]
import json, re, sys
SP = 'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad'
todo = {l.split('\t')[0]: json.loads(l.split('\t')[1]) for l in open(SP + '/cen3a/todo.txt')}
for mon in sys.argv[1:]:
    try: t = open(SP + '/cen3/%s.out' % mon, encoding='utf8', errors='replace').read()
    except OSError: print(mon, 'no output'); continue
    m = re.search(r'FAIL REPORT \S+\s+--\s+(\{.*\})', t)
    if not m: print(mon, 'no report', t[:200]); continue
    d = json.loads(m.group(1))
    want = set(todo.get(mon, []))
    got = {r['k']: r for r in d['recs'] if r['k'] in want}
    print(mon, 'never:', ' '.join(k.split('|', 1)[1] for k in d['never']))
    print('   now:', ' '.join('%s=%s' % (k.split('|', 1)[1], (r.get('verdict') or '')[:12]) for k, r in got.items()))
