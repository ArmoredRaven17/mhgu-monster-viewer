p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
rep("""                ctl: user.classCtl | 0, hornBroken:""", """                ctl: user.classCtl | 0, rung: user.rung | 0, hornBroken:""")
rep("""// Valstrax's e+0xcb10 for an action (null: the action leaves it as it was)""",
"""// Valstrax's e+0xcb10 for an action (null: the action leaves it as it was)""")
rep("""  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;""",
"""  // ALATREON (dev/em050_00-effects-spec.md 5; vt+0x208 0xecce08, READ 2026-10-18): while enraged (0x81670), every 30 frames
  // (countdown e+0xcb04, 0x7206c, set back to 30.0) id 1001 = u 1120, or id 1002 = u 1121 while P+0x1bb == 2 (the blue form: the
  // Form rung's second, render/monster.js ROM_FORM_CLIPS) -- 0xecce84. No dying gate in the handler. His only class request: ids
  // 1003..1011 (keys 531 / 530 / 531 / 12 / 38 / 40 / 11 / 37 / 39 in [0x169ee10]) have no requester (the spec's scan).
  em050_00: { step: (t, c) => {
                if (!c.rage){ t.cb04 = 0; return []; }
                if ((t.cb04 || 0) <= 0){ t.cb04 = 30; return [['em050_00u', c.rung === 1 ? 1121 : 1120, 'UNIQUE']]; }
                t.cb04 -= c.dt;
                if (t.cb04 <= 0){ t.cb04 = 30; return [['em050_00u', c.rung === 1 ? 1121 : 1120, 'UNIQUE']]; }
                return [];
              },
              records: [1120, 1121].map(k => ['em050_00u', k, 'UNIQUE']) },
  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;""")
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf8', newline='').read()
rep("""action: plays.key ? plays.action : undefined, classCtl: state.classCtl | 0 }, now);""",
    """action: plays.key ? plays.action : undefined, classCtl: state.classCtl | 0,
                                rung: state.level | 0 }, now);""")
open(p, 'w', encoding='utf8', newline='').write(s)

import json
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects\em050_00.json'
t = open(p, encoding='utf8', newline='').read()
d = json.loads(t); n = 0
for e in d['effects']:
    r = e.get('record') or {}
    if e.get('when') == 'ragePuff' and r.get('pel') == 'em050_00u' and r.get('key') in (1120, 1121): e['when'] = 'event'; n += 1
out = json.dumps(d, indent=1, ensure_ascii=False)
if t.endswith('\n'): out += '\n'
open(p, 'w', encoding='utf8', newline='').write(out)
print('ok, retagged', n)
