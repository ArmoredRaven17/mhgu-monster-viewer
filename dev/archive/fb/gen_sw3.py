# gen_sw3.py: round 3 of the page meter -- the plays the node replays could not plan (the four research passes, 2026-10-20): the
# page's own inputs the node sweep never gave (the play's action, rage in the picks, the snow list, the charge rung, the rockets, the
# arm forms), plays chained on one shell state, a _loop's wraps, and Mizutsune's trail after the unit-travel fix.
# One chunk per job: [MON, plays, pre, sweep] for shellmeter.mjs.
import json, os
M = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json', encoding='utf8'))
arr = M if isinstance(M, list) else M['monsters']
E = {m['id']: m for m in arr}
def dur(mon, lid, clip):
    l = next((x for x in E[mon]['lists'] if str(x['id']) == str(lid)), None)
    if not l: return 4.0
    c = [x for x in l['clips'] if x['clip'].replace('_start', '').replace('_loop', '') == clip]
    return sum(x['dur'] for x in c) if c else 4.0
def P(mon, lid, clip, n=1, extra=0, **kw):
    lid2, clip2 = lid, clip
    d = dur(mon, lid, clip)
    if kw.pop('snow', False): lid2, clip2 = 'snow', 'L%s %s' % (lid, clip)
    p = {'list': lid2, 'clip': clip2, 'n': n, 'ground': 'plain', 'frames': int(d * 60) + 120 + extra, 'recs': [], 'named': []}
    p.update(kw)
    return p
J = {}
def job(name, mon, plays, pre=None, sweep=None):
    J[name] = [[mon, plays, pre or [], sweep or {}]]
# Gravios: the head broken (the Parts row), L2 M27 with its _start
job('em005_00', 'em005_00', [P('em005_00', 2, 'Motion[27]', 2)], sweep={'plays': [P('em005_00', 2, 'Motion[27]', 2)], 'parts': True})
# Kushala: the Snow Variants list, enraged (every snow entry)
from_snow = []
import re
src = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js', encoding='utf8').read()
sv = json.load(open('snowvariants.json'))
print('snow variants', {k: len(v) for k, v in sv.items()})
job('em024_00', 'em024_00', [P('em024_00', l, c, 2, snow=True, rage=True) for l, c in sv.get('em024_00', [])])
# Agnaktor: the heat machine's clips first (L3 M1 / M2 / M3), then the drips L2 M2 / L2 M5 on the heat they leave
job('em049_00', 'em049_00', [P('em049_00', 3, 'Motion[2]', 2), P('em049_00', 2, 'Motion[2]', 2), P('em049_00', 3, 'Motion[1]', 2), P('em049_00', 2, 'Motion[2]', 1),
                             P('em049_00', 3, 'Motion[3]', 2), P('em049_00', 2, 'Motion[5]', 2), P('em049_00', 3, 'Motion[2]', 2), P('em049_00', 2, 'Motion[5]', 1)])
# Zinogre / Thunderlord: the play's action cycles through CLIP_ACTIONS play by play (playNow), so each clip is left to wrap n times
z0 = [P('em057_00', 0, 'Motion[20]', 6)]
job('em057_00', 'em057_00', z0, sweep={'plays': z0})
z4 = [P('em057_04', 0, 'Motion[20]', 6), P('em057_04', 2, 'Motion[1]', 8), P('em057_04', 2, 'Motion[2]', 8), P('em057_04', 9, 'Motion[1]', 4),
      P('em057_04', 9, 'Motion[5]', 4)]
job('em057_04', 'em057_04', z4, sweep={'plays': z4})
z4c = z4 + [P('em057_04', 2, 'Motion[60]', 3, rage=True), P('em057_04', 2, 'Motion[30]', 3, rage=True)]
job('em057_04c', 'em057_04', z4c, pre=[{'select': 'monLevel', 'value': '1'}], sweep={'plays': z4c})
# Tetsucabra / Drilltusk: the snow list, the tusks by the Parts sweep, sp_16 0's ef 1 at 654 frames
for t in ('em066_00', 'em066_04'):
    pl = [P(t, l, c, 1, extra=600, snow=True) for l, c in sv.get(t, [])]
    job(t, t, pl, sweep={'plays': pl, 'parts': True})
# Malfestio / Nightcloak: the enraged picks
job('em079_00', 'em079_00', [P('em079_00', 2, 'Motion[12]', 4, rage=True)])
job('em079_04', 'em079_04', [P('em079_04', 2, c, 4, rage=True) for c in ('Motion[12]', 'Motion[14]', 'Motion[15]', 'Motion[35]')])
# Boltreaver: the charge rung 4, (7, 0xc7) L4 M62
job('em081_04', 'em081_04', [P('em081_04', 4, 'Motion[62]', 2)], pre=[{'select': 'monLevel', 'value': '4'}])
# Mizutsune / Soulseer: the trail (L2 M24 / M25), on the unit's in-pass travel
for t in ('em082_00', 'em082_04'):
    job(t, t, [P(t, 2, 'Motion[24]', 3), P(t, 2, 'Motion[25]', 3)])
# Nakarkos: the arm lists (form by the Parts sweep) and the body's L2 M86
for side in ('l_2', 'r_2'):
    pl = [P('em084_00', side, c, 1) for c in ('Motion[93]', 'Motion[9]', 'Motion[21]', 'Motion[62]', 'Motion[74]', 'Motion[5]', 'Motion[13]', 'Motion[28]')]
    job('em084_00' + side, 'em084_00', pl, sweep={'plays': pl, 'parts': True})
job('em084_00b', 'em084_00', [P('em084_00', 2, 'Motion[86]', 3)], sweep={'plays': [P('em084_00', 2, 'Motion[86]', 3)]})
# Ahtal-Neset: the Rockets control at every action start
for v in ('1', '2'):
    pl = [P('em087_00', 2, c, 1, extra=600) for c in ('Motion[3]', 'Motion[5]', 'Motion[8]', 'Motion[30]', 'Motion[33]')]
    job('em087_00r' + v, 'em087_00', pl, pre=[{'select': 'monClassCtl', 'value': v}])
# Ahtal-Ka: L2 M30_loop's wraps (the anchors), a second M30 play (the release), throw then pull on one shell state
for v in ('0', '1', '2'):
    pl = [P('em088_00', 2, 'Motion[30]', 3, extra=900), P('em088_00', 2, 'Motion[30]', 1), P('em088_00', 2, 'Motion[17]', 1), P('em088_00', 2, 'Motion[19]', 1),
          P('em088_00', 2, 'Motion[17]', 1), P('em088_00', 2, 'Motion[37]', 1)]
    job('em088_00c' + v, 'em088_00', pl, pre=[{'select': 'monCarry', 'value': v}])
# chains on one shell state: Lagombi line L9 M10 -> M11, Gore-line scale throw then ring, Teostra's leader then (7, 0x2e)
job('em061_04', 'em061_04', [P('em061_04', 9, 'Motion[10]', 1), P('em061_04', 9, 'Motion[11]', 1), P('em061_04', 9, 'Motion[10]', 1), P('em061_04', 9, 'Motion[11]', 1)])
job('em068_00', 'em068_00', [P('em068_00', 2, 'Motion[60]', 1), P('em068_00', 0, 'Motion[50]', 1), P('em068_00', 2, 'Motion[60]', 1), P('em068_00', 0, 'Motion[50]', 1)])
job('em027_00', 'em027_00', [P('em027_00', 2, 'Motion[10]', 1), P('em027_00', 4, 'Motion[10]', 1), P('em027_00', 2, 'Motion[10]', 1), P('em027_00', 4, 'Motion[10]', 1)])
os.makedirs('chunksw3', exist_ok=True)
for k, v in J.items(): json.dump(v, open('chunksw3/%s.json' % k, 'w'))
print(len(J), sorted(J))
