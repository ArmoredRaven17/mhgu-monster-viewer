# laneA4/sink4/cmp.py (lane A4, 2026-10-26): out/<id>.out (sinkmeter OFF then ON) -> per clip the unit y OFF / ON, and per record
# starts / lit / verdict OFF -> ON; flags a record that drew OFF and does not ON (or whose starts fell). usage: cmp.py id...
import json, sys, os, re
H = os.path.dirname(os.path.abspath(__file__))
def runs(id):
    R = []
    for l in open(os.path.join(H, 'out', id + '.out'), encoding='utf8', errors='replace'):
        if 'PROBE ' + id in l and ' -- ' in l: R.append(json.loads(l.split(' -- ', 1)[1]))
    return R
for id in sys.argv[1:]:
    try: off, on = runs(id)[:2]
    except ValueError: print(id, 'NO RUNS'); continue
    print('==', id, off['log'][0], '/', on['log'][0])
    for a, b in zip(off['log'], on['log']):
        if a.startswith('played'):
            ja = json.loads(a[a.index('{'):]); jb = json.loads(b[b.index('{'):])
            print('   %-28s f%-4s unit y OFF %8.1f  ON %8.1f  (dy %+.1f)  origin %s' % (a.split()[1], jb['f'], ja['unitY'], jb['unitY'], jb['unitY'] - ja['unitY'], jb['originY']))
    ro = {r['k']: r for r in off['rows']}; rn = {r['k']: r for r in on['rows']}
    bad = []
    for k in sorted(set(ro) | set(rn)):
        a, b = ro.get(k, {}), rn.get(k, {})
        if not a.get('st') and not b.get('st'): continue
        flag = '' if (a.get('verdict') != 'draws' or b.get('verdict') == 'draws') and (b.get('st', 0) >= a.get('st', 0)) else '  <-- CHANGED'
        if flag or a.get('verdict') != b.get('verdict'): bad.append(k)
        print('   %-38s st %s -> %s  lit %s -> %s  %s -> %s%s' % (k, a.get('st'), b.get('st'), a.get('lit'), b.get('lit'), a.get('verdict'), b.get('verdict'), flag))
    print('   records started:', sum(1 for r in rn.values() if r.get('st')), ' draws OFF', sum(1 for r in ro.values() if r.get('verdict') == 'draws'), 'ON', sum(1 for r in rn.values() if r.get('verdict') == 'draws'), ' changed:', bad)
