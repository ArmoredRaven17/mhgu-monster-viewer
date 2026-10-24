# patch_gore.py: the Gore line's ring fills as CLASS_TIMERS (motion-states.js), the L2 M52 copies (psl-mask.js / motion-states.js), and
# the fire's `ring` form (index.html) -- effects lane, 2026-10-20
import io, os
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def patch(P, reps):
    t = io.open(P, encoding='utf8', newline='').read()
    nl = '\r\n' if t.count('\r\n') > t.count('\n') / 2 else '\n'
    for a, b in reps:
        a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
        assert t.count(a2) == 1, (P, a[:70])
        t = t.replace(a2, b2)
    io.open(P, 'w', encoding='utf8', newline='').write(t)

patch(os.path.join(R, 'render', 'motion-states.js'), [
("""const NERSCYLLA_HELD = {""", """// THE GORE LINE'S RING FILLS (CLASS_TIMERS em071_00 / em071_05 / em072_00; schedule.js ringFill holds the ring). Every fill site
// of 0xfc05ec, traced over every action x phase x gates x rage x tired x variant (<scratchpad>/zg/goretrace.py, sinf / cosf answered,
// the yaw checked at 0x4000) and placed on its clip by the phase that plays it (actmot.py / the handlers' phase tables, READ):
// [frame, [x, y, z] in his frame (x to the side, z ahead; rotated by P+0x54 as each site does, NOT scaled), s0, s1, flag, actions].
// Frame 0 = at the clip's start (the phase change that sets it). `notV5`: Chaotic's (variant 5) arm of 0xfb63d0 takes the damage
// gate instead (0xfb670c: C+0x84 against rank thresholds; not driven). Clips other actions also play are gated by the play's action;
// a play with no action is the action that begins on the clip at frame 0 (L2 M33 (7, 7), L0 M81 (2, 0xc), L0 M5 copy A (1, 0)).
const goreActs = (st, ...ns) => ns.map(n => st + ',' + n);
const GORE_FILLS = {
  '0|5':  { acts: goreActs(1, 0, 0x14, 0x16).concat(goreActs(13, 0xb)), nullOk: true, fills: [[160, [0, 0, -300], 500, 480, 1]] },     // 0xfb25bc, 0xfbe2d0
  '0|51': { acts: goreActs(2, 3, 0x1f), nullOk: true, fills: [[100, [0, 0, 1000], 400, 240, 1]] },                             // 0xfb34a0
  '0|54': { acts: goreActs(2, 4, 0x20), nullOk: true, fills: [[100, [0, 0, 1000], 400, 240, 1]] },
  '0|74': { acts: goreActs(2, 8, 0xa), nullOk: true, fills: [[16, [0, 0, 0], 400, 240, 1]] },                                   // 0xfb3f44
  '0|77': { acts: goreActs(2, 9, 0xb), nullOk: true, fills: [[16, [0, 0, 0], 400, 240, 1]] },
  '0|81': { acts: goreActs(2, 0xc, 0xd), nullOk: true, fills: [[0, [0, 0, 0], 400, 240, 1]] },                                  // 0xfb4478
  '0|9':  { acts: goreActs(2, 0xe), nullOk: true, fills: [[50, [250, 0, 850], 280, 360, 1]] },                                  // 0xfb4904
  '1|8':  { acts: goreActs(2, 0x12), nullOk: true, fills: [[90, [0, 0, 750], 450, 360, 1]] },                                   // 0xfb4c88
  '1|13': { acts: goreActs(2, 0x23), nullOk: true, fills: [[90, [0, 0, 750], 450, 360, 1]] },
  '2|33': { acts: goreActs(7, 7, 0x34, 0x37), nullOk: true, notV5: true, fills: [[120, [0, 0, 500], 400, 240, 1]] },             // 0xfb6d68
  '4|20': { acts: goreActs(7, 0x69), nullOk: true, notV5: true, fills: [[184, [0, 0, 500], 400, 240, 1]] },
  '2|20': { acts: goreActs(7, 0x13), nullOk: true, fills: [[110, [-500, 0, 0], 300, 360, 0], [186, [-750, 0, 150], 350, 360, 0]] }, // 0xfb8098 / 0xfb81c0
  '2|21': { acts: goreActs(7, 0x14), nullOk: true, fills: [[110, [500, 0, 0], 300, 360, 0], [186, [750, 0, 150], 350, 360, 0]] },
  '4|25': { acts: goreActs(7, 0x6c), nullOk: true, fills: [[110, [-500, 0, 0], 300, 360, 0], [186, [-750, 0, 150], 350, 360, 0]] },
  '4|26': { acts: goreActs(7, 0x6d), nullOk: true, fills: [[110, [500, 0, 0], 300, 360, 0], [186, [750, 0, 150], 350, 360, 0]] },
  '2|46': { acts: goreActs(7, 0x23, 0x24, 0x25), nullOk: true, fills: [[30, [0, 0, 0], 450, 360, 1]] },                        // 0xfb9b3c (phase 3)
  '2|47': { acts: goreActs(7, 0x26, 0x27, 0x28), nullOk: true, fills: [[30, [0, 0, 400], 400, 240, 1]] },                      // 0xfb9db4 (phase 4)
  '2|49': { acts: goreActs(7, 0x29), nullOk: true, fills: [[84, [-400, 0, 0], 400, 180, 1], [130, [400, 0, 0], 400, 300, 1]] }, // 0xfba398 / 0xfba490
  '2|52': { acts: goreActs(7, 0x33), nullOk: false, fills: [[84, [0, 0, 600], 400, 90, 1]] },                                   // 0xfbaad8; (7, 0x2c): none
};
function goreFills(t, c, pel, variant){
  const out = [], row = GORE_FILLS[c.list + '|' + c.slot];
  const prev = c.fresh ? -1 : (t.gf == null ? -1 : t.gf);
  t.gf = c.frame;
  if (!row || c.dead || (row.notV5 && variant === 5)) return out;
  const act = c.action ? c.action[0] + ',' + c.action[1] : null;
  if (act ? !row.acts.includes(act) : !row.nullOk) return out;
  for (const [F, offset, s0, s1, flag] of row.fills)
    if (F > prev && F <= c.frame) out.push([pel, 30, 'UNIQUE', { ring: { offset, s0, s1, flag } }]);
  return out;
}
const NERSCYLLA_HELD = {"""),
("""  em070_00: { step: (t, c) => nerscyllaB5(t, c), records: [30, 31, 32, 33, 34].map(k => ['em070_00u', k, 'UNIQUE']) },
""", """  em070_00: { step: (t, c) => nerscyllaB5(t, c), records: [30, 31, 32, 33, 34].map(k => ['em070_00u', k, 'UNIQUE']) },
  // THE GORE LINE'S SLOT RING (rom-map "Class requests driven"): the fills above; the ring itself (0xfc05ec / 0xfaf318 / the timers)
  // runs in the effect schedule (schedule.js ringFill / stepRing), which the shells' owner calls (sp_00 / sp_03 -> 0xfc083c) also feed.
  em071_00: { step: (t, c) => goreFills(t, c, 'em071_00u', 0), records: [30, 31].map(k => ['em071_00u', k, 'UNIQUE']) },
  em071_05: { step: (t, c) => goreFills(t, c, 'em071_05u', 5), records: [30, 31].map(k => ['em071_05u', k, 'UNIQUE']) },
  em072_00: { step: (t, c) => goreFills(t, c, 'em072_00u', 0), records: [30, 31].map(k => ['em072_00u', k, 'UNIQUE']) },
"""),
("""                                        '0|Motion[5]', '0|Motion[31]'].map(k => [k, ['A', 'B']]));""",
 """                                        '0|Motion[5]', '0|Motion[31]', '2|Motion[52]'].map(k => [k, ['A', 'B']]));"""),
])

patch(os.path.join(R, 'render', 'psl-mask.js'), [
("""    '0|Motion[31]': [{ action: [1, 0x03] }, { action: [1, 0x08], variant: 'B' }, { action: [1, 0x17], variant: 'B' }] }])),""",
 """    '0|Motion[31]': [{ action: [1, 0x03] }, { action: [1, 0x08], variant: 'B' }, { action: [1, 0x17], variant: 'B' }],
    // L2 M52 (effects lane, 2026-10-20): A (7, 0x33) fills the slot ring at f84 (0xfbaad8), B (7, 0x2c) does not (goretrace.py)
    '2|Motion[52]': [{ action: [7, 0x33] }, { action: [7, 0x2c], variant: 'B' }] }])),"""),
])

patch(os.path.join(R, 'index.html'), [
("""      // a class's held request STOPPED (0x329c40(h, 0)): Nerscylla's C+0xb5 handle on a change (CLASS_TIMERS em070_00)""",
 """      // a fill of the Gore line's slot ring (CLASS_TIMERS em071_00 / em071_05 / em072_00 -> schedule.js ringFill): the point is his unit
      // P+0x40.. plus the site's offset turned by his angle P+0x54 (x cos + z sin, y, z cos - x sin; each site's own sinf / cosf, not scaled)
      if (at && at.ring){
        const f = Math.fround, P = unitGamePos().map(f), o = at.ring.offset;
        const D = mounted.main ? mounted.main.getWorldDirection(new THREE.Vector3()) : new THREE.Vector3(0, 0, 1);
        const yaw16 = Math.trunc(f(f(0.5) + f(f(Math.atan2(D.x, D.z)) * f(10430.3779296875)))) & 0xffff;
        const a = f(f(yaw16) * f(9.58738019107841e-05)), sn = f(Math.sin(a)), cs = f(Math.cos(a));
        const position = [f(P[0] + f(f(o[0] * cs) + f(o[2] * sn))), f(P[1] + o[1]), f(P[2] + f(f(o[2] * cs) - f(o[0] * sn)))];
        rt.ringFill(pel, { position, s0: at.ring.s0, s1: at.ring.s1, flag: at.ring.flag });
        continue;
      }
      // a class's held request STOPPED (0x329c40(h, 0)): Nerscylla's C+0xb5 handle on a change (CLASS_TIMERS em070_00)"""),
])
print('ok')
