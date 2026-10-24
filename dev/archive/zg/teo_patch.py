import json
def patch(p, pairs):
    s = open(p, encoding='utf8', newline='').read()
    for a, b in pairs:
        assert s.count(a) == 1, (p, s.count(a), a[:80])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf8', newline='').write(s)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
patch(R + r'\render\motion-states.js', [(
"""// Valstrax's e+0xcb10 for an action (null: the action leaves it as it was)""",
"""// Valstrax's e+0xcb10 for an action (null: the action leaves it as it was)""")])
patch(R + r'\render\motion-states.js', [(
"""  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;""",
"""  // TEOSTRA's FIRE AURA (dev/em027_00-effects-spec.md 2; vt+0x208 0xe10f7c, READ 2026-10-18 -- Raven, the same day: "u 0 follows
  // the Fire Aura control (the ROM), not rage"). Every frame: when P+0x5e08 bit 1 is clear (0xa1f0c(e, 2)) and the aura byte
  // P+0x1bb is neither 0 nor 0xff (the Fire Aura control), and e+0xcac4 bit 0 is not yet set, it sets it and requests id 1001 =
  // u 0 into e+0xcac8 (id 1002 = u 10 instead while P+0x5cb6 == 1 -- that byte's writer is NOT READ, so u 10 is left out);
  // otherwise, with the bit set, it clears it, stops e+0xcac8 (0x329c40(h, 0)) and requests id 1003 = u 1 once. No dying gate.
  em027_00: { step: (t, c) => {
                const on = c.ctl === 1, was = !!t.on; t.on = on;
                return (was && !on) ? [['em027_00u', 1, 'UNIQUE']] : [];
              },
              holds: c => c.ctl === 1 ? [['em027_00u', 0]] : [],
              records: [0, 1].map(k => ['em027_00u', k, 'UNIQUE']) },
  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;""")])
p = R + r'\effects\em027_00.json'
t = open(p, encoding='utf8', newline='').read(); d = json.loads(t); n = 0
for e in d['effects']:
    r = e.get('record') or {}
    if e.get('when') == 'rage' and r.get('pel') == 'em027_00u' and r.get('key') == 0: e['when'] = 'event'; n += 1
out = json.dumps(d, indent=1, ensure_ascii=False)
if t.endswith('\n'): out += '\n'
open(p, 'w', encoding='utf8', newline='').write(out)
print('ok, retagged', n)
