# laneA4/sink4/gen_js.py (lane A4, 2026-10-26): sink4.json + players_all.json -> sink4.js, the SINK4 literal pasted into
# docs/render/motion-states.js. Per clip: v (P+0x5c, game units), acts (the posture-4 actions that set it), shared (a phase-0 player of
# the clip that sets no posture 4 and is not a sink action: the sink then needs the play's own action). Clips whose value changes
# mid-play (`changes`) are left out except Barroth's L4 M5, whose ramp is READ (0xe866d8..0xe86700: += 25 a frame from -600 to 0).
import json, os
H = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(H, 'sink4.json'))); P = json.load(open(os.path.join(H, 'players_all.json')))
SH = {'005': '004', '062': '060'}
RAMP = {('em044_00', '4|Motion[5]'): 'ramp: [-600, 25]'}
out, left = [], []
for em, rows in S['rows'].items():
    b = em[2:5]; cls = 'uEm%s_00' % SH.get(b, b); pl = P.get('%s|%d|%d' % (cls, int(b), int(em[6:8])), {})
    ents = []
    for clip, r in rows.items():
        ramp = RAMP.get((em, clip))
        if (r.get('changes') or 'conflict' in r) and not ramp: left.append((em, clip, 'changes mid-play' if r.get('changes') else 'conflict %s' % r.get('conflict'))); continue
        others = sorted(a for a, (c, post) in pl.items() if c == clip and 4 not in post and a not in r['acts'])
        acts = ', '.join("'%s'" % a for a in r['acts'])
        ents.append("    '%s': { %s, acts: [%s]%s }" % (clip, ramp or 'v: %g' % r['v'], acts, ', shared: true' if others else ''))
        if others: left.append((em, clip, 'shared with ' + ' '.join(others[:8])))
    if ents: out.append('  %s: {\n%s,\n  },' % (em, ',\n'.join(ents)))
open(os.path.join(H, 'sink4.js'), 'w').write('\n'.join(out) + '\n')
open(os.path.join(H, 'sink4_left.txt'), 'w').write('\n'.join('%s %s %s' % x for x in left) + '\n')
print(len(out), 'monsters;', sum(o.count("': {") for o in out), 'clips'); print('\n'.join('%s %s %s' % x for x in left))
