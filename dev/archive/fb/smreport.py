# smreport.py <shellmeter log> [expected batch_args-style file]: per monster, per shell record: starts, draw frames, lit samples,
# max pixels, the meter's verdict -- and every expected record the meter never saw start (named, not counted as drawing)
import sys, json, re
log = open(sys.argv[1], encoding='utf8', errors='replace').read()
want = {}
if len(sys.argv) > 2:
    for line in open(sys.argv[2]):
        p = line.split()
        if len(p) < 2: continue
        m = p[0]
        for part in p[1:]:
            pel, ks = part.split(':')
            for k in ks.split(','): want.setdefault(m, set()).add('%s|%s' % (pel, int(k)))
tot = dict(recs=0, draws=0)
for m in re.finditer(r'REPORT (\S+)  -- (\{.*\})', log):
    mon, rep = m.group(1), json.loads(m.group(2))
    seen = set()
    print('== %s  (%d plays, %ss%s)' % (mon, rep.get('played', 0), rep.get('secs', '?'), ('; missing ' + ', '.join(rep['missing'])) if rep.get('missing') else ''))
    for r in sorted(rep.get('recs', []), key=lambda r: (r['k'].split('|')[1], int(r['k'].split('|')[2]))):
        _, pel, key, _ = r['k'].split('|'); seen.add(pel + '|' + key)
        if want and (pel + '|' + key) not in want.get(mon, set()): continue
        tot['recs'] += 1; tot['draws'] += r['verdict'] == 'draws'
        print('   %-12s %4s  starts %3d  draw frames %4d  lit %3d/%-3d  px %7d  %s' % (pel, key, r['st'], r['df'], r['lit'], r['s'], r['px'], r['verdict']))
    for k in sorted(want.get(mon, set()) - seen):
        print('   %-12s %4s  NOT STARTED in these plays' % tuple(k.split('|')))
print('records metered %(recs)d, verdict draws %(draws)d' % tot)
