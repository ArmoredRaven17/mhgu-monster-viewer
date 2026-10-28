# laneA4/sink4/cmp2.py (lane A4, 2026-10-26): the OFF / ON meter restricted to records bound to the clips the spec PLAYED (a run's
# first page check also meters the clip the page mounted on, which the ON run does not repeat). Totals: starts / draws OFF vs ON.
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
tot = [0, 0, 0, 0]; bad = []
for f in sorted(os.listdir(os.path.join(H, 'out'))):
    id = f[:-4]
    R = [json.loads(l.split(' -- ', 1)[1]) for l in open(os.path.join(H, 'out', f), encoding='utf8', errors='replace') if 'PROBE ' + id in l and ' -- ' in l]
    if len(R) < 2: bad.append((id, 'no runs')); continue
    played = {id + '|' + re.sub(r'(_start|_loop)?(#.*)?$', '', x.split()[1]) for x in R[0]['log'] if x.startswith('played')}
    rows = [{r['k']: r for r in X['rows'] if any(c in played for c in r.get('clips') or [])} for X in R[:2]]
    for k in set(rows[0]) | set(rows[1]):
        a, b = rows[0].get(k, {}), rows[1].get(k, {})
        tot[0] += a.get('st', 0) or 0; tot[1] += b.get('st', 0) or 0
        tot[2] += a.get('verdict') == 'draws'; tot[3] += b.get('verdict') == 'draws'
        if (a.get('verdict') == 'draws') != (b.get('verdict') == 'draws') or (b.get('st') or 0) < (a.get('st') or 0): bad.append((id, k, a.get('st'), b.get('st'), a.get('verdict'), b.get('verdict')))
print('records on played sink clips: starts OFF %d ON %d, drawing records OFF %d ON %d' % tuple(tot))
print('differences:', bad)
