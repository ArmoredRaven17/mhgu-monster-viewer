# classify.py: the full shell draw table -- every 'shell' record of docs/effects/<mon>.json for every SHELL_DATA monster: the meter's
# best row (full/sm_<mon>.log and any extra logs given), or the reason it never started (from the node replay smfull.json and efmap.json)
import json, re, glob, os, sys, collections
DOCS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects'
plan = json.load(open('smfull.json'))
efmap = json.load(open('efmap.json'))
mons = open('allmons.txt').read().split()
best = {}
logs = glob.glob('full/sm_*.log') + sys.argv[1:]
for f in logs:
    t = open(f, encoding='utf8', errors='replace').read()
    for m in re.finditer(r'REPORT (\S+)  -- (\{.*\})', t):
        mon = m.group(1)
        for r in json.loads(m.group(2)).get('recs', []):
            _, pel, key, when = r['k'].split('|')
            if when != 'shell': continue
            k = (mon, pel, int(key))
            sc = (r['verdict'] == 'draws', 'off camera' in r['verdict'], r['lit'], r['st'])
            if k not in best or sc > best[k][0]: best[k] = (sc, r)
rows = []
for mon in mons:
    p = os.path.join(DOCS, mon + '.json')
    if not os.path.exists(p): continue
    d = json.load(open(p, encoding='utf8'))
    recs = sorted({(e['record']['pel'], e['record']['key']) for e in d['effects'] if e.get('record') and e.get('when') == 'shell'})
    started = set(); named = set()
    for pl in plan.get(mon, []):
        started |= set(pl['recs']); named |= set(pl.get('named', []))
    for pel, key in recs:
        k = (mon, pel, key); pk = '%s:%d' % (pel, key)
        if k in best:
            r = best[k][1]
            status = 'draws' if r['verdict'] == 'draws' else ('draws off camera' if 'off camera' in r['verdict'] else 'NO DRAW: ' + r['verdict'])
            rows.append([mon, pel, key, r['st'], '%d/%d' % (r['lit'], r['s']), status, r.get('efl', '')])
            continue
        slots = efmap.get(mon, {}).get(pk, [])
        why = None
        if pk in started: why = 'PAGE: starts in the replay, not in the page plays'
        elif not slots: why = 'NO MODE names it (exported for another path: a beam / class / partner row)'
        elif pk in named:
            # named by a reached mode but never started: by the slot's base meaning
            bases = sorted({(b, s) for _, b, _, s in slots})
            if all(b in ('base00', 'base54', 'base28', 'base07', 'base37', 'base18', 'base03', 'base19') and s in (1, 3) for b, s in bases):
                why = 'CONTACT: a wall (type 0) / hunter (type 2) landing -- the viewer has neither'
            else: why = 'NAMED by a reached mode, never started: ' + ', '.join('%s ef%d' % bs for bs in bases)
        else:
            why = 'MODE NOT REACHED in the viewer\'s plays: ' + ', '.join(sorted({'%s %s m%d ef%d' % (n, b, mi, s) for n, b, mi, s in slots}))[:160]
        rows.append([mon, pel, key, 0, '-', why, ''])
json.dump(rows, open('drawtable.json', 'w'))
c = collections.Counter(r[5].split(':')[0] for r in rows)
print(len(rows), 'records'); print(c.most_common())
