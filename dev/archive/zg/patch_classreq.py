# patch_classreq.py: motion-states.js -- the class requests the control-block re-check found undriven (effects lane, 2026-10-20)
import io, os
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
t = io.open(P, encoding='utf8', newline='').read()
def rep(a, b):
    global t
    assert t.count(a) == 1, a[:80]
    t = t.replace(a, b)

# 1. the class timers' input: the rung (Rajang's Armor Mode) and the loop segment (a new play vs a loop)
rep("""                ctl: user.classCtl | 0, ctl2: user.classCtl2 | 0, snowMap: !!user.snowMap, toggles: user.toggles || {}, eyesOff: this.eyesOff().length > 0, sets: sets || [], hornBroken: T.hornBroken ? T.hornBroken(this.userDrawn, sets, this.table) : false };""",
    """                ctl: user.classCtl | 0, ctl2: user.classCtl2 | 0, snowMap: !!user.snowMap, toggles: user.toggles || {}, eyesOff: this.eyesOff().length > 0, sets: sets || [], hornBroken: T.hornBroken ? T.hornBroken(this.userDrawn, sets, this.table) : false,
                // the level rung (Rajang's Armor Mode, part-review `levels`) and whether this step began a NEW play of the clip (a
                // clip change, or its frame going back outside a loop segment -- the viewer's form of an action start, vt+0x204)
                level: user.level | 0, fresh: k.fresh };""")
rep("""    let dt;
    if (k.mk === mk && frame >= k.frame) dt = frame - k.frame;""",
    """    let dt;
    k.fresh = !(k.mk === mk && (frame >= k.frame || loopSeg));
    if (k.mk === mk && frame >= k.frame) dt = frame - k.frame;""")

# 2. the five classes
rep("""export const CLASS_TIMERS = {
""", """export const CLASS_TIMERS = {
  // ---- THE CLASS REQUESTS THE CONTROL-BLOCK RE-CHECK FOUND UNDRIVEN (effects lane, 2026-10-20; dev/rom-map.md "Class requests driven") ----
  // CONGALALA u 500 (cm103_100, joint 2): the eating handler 0xdd0568's phase 0 (READ 0xdd05b4..0xdd0644) reads the gas byte ctl+1,
  // sets posture 0 and L0 M43 (0x2b), and when (gas - 2) & 0xff >= 3 heals 2% (0x9a6fc) and requests id 1001 (vt+0x1d0, table
  // 0x169ce68: u 500) through his own requester -- at the play's first frame. The gas it reads is the one the action's start just
  // set (vt+0x204 0xdcefd8: psl-mask.js em021Gas; (1, 0x40) gas 1 -> u 500, (1, 0x41 / 0x42 / 0x43) 3 / 2 / 4 -> none), else the
  // gas he carries (the Gas Type control). The flip probe (zg/ctl/action_em021_00.txt) puts the same request on (1, 0xb..0xe /
  // 0x35..0x39) at their phase 1 (L0 M25 then L0 M43) and (1, 0x3c..0x43) at phase 0.
  em021_00: { step: (t, c) => (c.fresh && !c.dead && c.list === '0' && c.slot === 43 && (((em021GasOf(c.action, c.ctl) - 2) & 0xff) >= 3))
                ? [['em021_00u', 500, 'UNIQUE']] : [],
              records: [['em021_00u', 500, 'UNIQUE']] },
  // RAJANG / FURIOUS c 30 (em023_00_008, joint 2), THE PUMP-DOWN: vt+0x208 0xde2760..0xde27c4 (READ) -- while ctl+4 (PUMP UP, set with
  // its 3600-frame timer ctl+8 by (1, 0x32)'s start, vt+0x204 0xde230c, and cleared at 0 by 0xde3d78) is up and the motion is not
  // L2 M24 (0x218), it sets ctl+0x16 bit 1; otherwise, with the bit set, it clears it and requests c id 1002 (vt+0x1cc, table
  // 0x169d238: c 30) once. So c 30 fires the frame the pump ends -- the timer, the rage dropping (variant 0 holds it only while
  // enraged), death -- and when L2 M24 plays again while pumped. PUMP UP is the Armor Mode rung (Rajang level 2, Furious level 1).
  em023_00: { step: (t, c) => rajangPumpDown(t, c, c.level === 2), records: [['em023_00c', 30, 'UNIQUE']] },
  em023_05: { step: (t, c) => rajangPumpDown(t, c, c.level === 1), records: [['em023_00c', 30, 'UNIQUE']] },
  // NERSCYLLA'S CONTROL BYTE C+0xb5 (vt+0x208 0xf9c1e4..0xf9c3bc, READ): on a change of the byte from its last value, a held handle is
  // stopped (0x329c40(h, 0)) -- after a one-shot id 1002 (u 31) when the old value was 1 -- and, variant 0, the new value picks a
  // held request (vt+0x1d0, table 0x16a0ffc): 1 -> id 1001 u 30 on joint 1; 2 -> id 1003 u 32 on joint 144; 4 / 32 -> id 1004 u 33
  // on joint 144; 8 -> id 1005 u 34 on joint 1; 16 -> id 1003 u 32 on joint 144, offset (0, 0, -80) (+0x14 bit 0) while the motion
  // is L4 M30 / M31; others nothing. The request block: +0x1c |= 1 with +0xc0 = the joint's position, +0x14 |= 0x20 with +0x52 =
  // the joint. The byte's WRITERS, per clip (b5trace.py over every action, the frame floats read at each writer):
  //   L0 M18 f50 |= 2 (0xf9e0c4) and L0 M19 at its start = 4 (0xf9e254): (1, 0x13) only. L2 M27 f24 |= 1 (0xf9fc14): (2, 0x1c..0x1e).
  //   L2 M72 f78 |= 1, f120 = 0 (0xfa0364 / 0xfa0388): (2, 0x1f / 0x20). L2 M78 f20 |= 1 (0xfa77d8): (7, 0x33). L4 M11 at its start
  //   = 1 (0xfa30b0) and L4 M13 / L4 M16 at theirs = 0 (0xfa330c): (3, 0x1d..0x1f). L2 M48 at its start = 0x20 (0xfa7de0) and L2
  //   M50 at its start = 0 (0xfa7f20): (7, 0x36). L2 M59 at its start = 0x10: every action that plays it (0xfa081c, 0xfa11dc,
  //   0xfa8690, 0xfa8c68, 0xfaa800); L3 M30 at its start = 0 (0xfa09c0): (2, 0x21) only. L4 M30 at its start = 0x10 (0xfa89d8), f14
  //   = 0 and f32 = 0x10 at a new point (0xfa8b94 / 0xfa8bc0): the actions that BEGIN on it, (7, 0x3d / 0x41 / 0x43 / 0x45 / 0x47 /
  //   0x49) and (13, 2) -- the others reach it from L2 M59 and write nothing there. L2 M75 / L2 M76 at their start = 0 (0xf9e644 /
  //   0xf9ea7c): (1, 0x16 / 0x18 / 0x22 / 0x23) / (1, 0x17 / 0x19 / 0x24 / 0x25), on the arm where the object the action holds (r5,
  //   its point through vt+0xd4) is null -- with one, the point is kept and bit 8 set later (0xf9e6fc / 0xf9e9bc): NOT driven, the
  //   viewer has no such object.
  //   NOT DRIVEN, by name (they depend on the ACTION, which a clip of his does not carry): L2 M59 f30 = 0 ((2, 0x25), 0xfa1224) and
  //   L2 M55's end = 0 (the chains that begin on L4 M30, 0xfa8d20 / 0xfaac40) -- (2, 0x2b / 0x2e / 0x2f), (7, 0xa / 0xb), (13, 3)
  //   play L2 M55 and write nothing. The byte otherwise keeps its value across clips, as it does across actions.
  em070_00: { step: (t, c) => nerscyllaB5(t, c), records: [30, 31, 32, 33, 34].map(k => ['em070_00u', k, 'UNIQUE']) },
""")

# 3. the helpers, before CLASS_TIMERS
rep("""const poison1100 = (t, c, pel) => {""", """// Congalala's gas at an eating action's start (psl-mask.js em021Gas, the same read: vt+0x204 0xdcefd8 sets ctl+1 for these numbers)
const CONGA_GAS_AT_START = { 0x35: 1, 0x40: 1, 0x0b: 2, 0x42: 2, 0x0c: 3, 0x41: 3, 0x0e: 4, 0x43: 4, 0x09: 0 };
const em021GasOf = (action, carried) =>
  action && action[0] === 1 && CONGA_GAS_AT_START[action[1]] !== undefined ? CONGA_GAS_AT_START[action[1]] : (carried | 0);
// Rajang's pump-down latch (CLASS_TIMERS em023_00 / em023_05)
function rajangPumpDown(t, c, pumped){
  if (pumped && !c.dead && !(c.list === '2' && c.slot === 24)){ t.b16 = true; return []; }
  if (t.b16){ t.b16 = false; return [['em023_00c', 30, 'UNIQUE']]; }
  return [];
}
// Nerscylla's C+0xb5 (CLASS_TIMERS em070_00): the writes per clip [frame, op, value], and the handler's change logic
const NERSCYLLA_B5 = {
  '0|18': [[50, 'or', 2]], '0|19': [[0, 'set', 4]], '2|27': [[24, 'or', 1]], '2|72': [[78, 'or', 1], [120, 'set', 0]],
  '2|78': [[20, 'or', 1]], '4|11': [[0, 'set', 1]], '4|13': [[0, 'set', 0]], '4|16': [[0, 'set', 0]],
  '2|48': [[0, 'set', 0x20]], '2|50': [[0, 'set', 0]], '2|59': [[0, 'set', 0x10]], '3|30': [[0, 'set', 0]],
  '4|30': [[0, 'set', 0x10], [14, 'set', 0], [32, 'set', 0x10]], '2|75': [[0, 'set', 0]], '2|76': [[0, 'set', 0]],
};
const NERSCYLLA_HELD = { 1: [30, 1], 2: [32, 144], 4: [33, 144], 32: [33, 144], 8: [34, 1], 16: [32, 144] };
function nerscyllaB5(t, c){
  const out = [];
  if (t.b5 == null){ t.b5 = 0; t.last = 0; t.held = null; }
  const w = NERSCYLLA_B5[c.list + '|' + c.slot];
  if (w){
    const from = c.fresh ? -1 : (t.wf == null ? -1 : t.wf);
    for (const [f, op, v] of w) if (f > from && f <= c.frame) t.b5 = op === 'or' ? (t.b5 | v) : v;
  }
  t.wf = c.frame;
  if (t.b5 !== t.last){
    if (t.held){
      if (t.last === 1) out.push(['em070_00u', 31, 'UNIQUE']);
      out.push(['em070_00u', t.held, 'UNIQUE', { stop: true }]);
      t.held = null;
    }
    const h = NERSCYLLA_HELD[t.b5];
    if (h){
      const motion430 = c.list === '4' && (c.slot === 30 || c.slot === 31);
      out.push(['em070_00u', h[0], 'UNIQUE', { joint: h[1], offset: (t.b5 === 16 && motion430) ? [0, 0, -80] : null }]);
      t.held = h[0];
    }
    t.last = t.b5;
  }
  return out;
}
const poison1100 = (t, c, pel) => {""")

# 4. Teostra: the rage latch (ctl+0x26 at the action start; vt+0x208 0xe11204..0xe112dc)
rep("""  em027_00: { step: (t, c) => {
                const on = c.ctl === 1 && !c.toggles.poisoned, was = !!t.on; t.on = on;      // P+0x5e08 bit 1 clear (0xa1f0c(e, 2))
                return [...((was && !on) ? [['em027_00u', 1, 'UNIQUE']] : []), ...poison1100(t, c, 'em027_00c')];
              },""",
    """  em027_00: { step: (t, c) => {
                const on = c.ctl === 1 && !c.toggles.poisoned, was = !!t.on; t.on = on;      // P+0x5e08 bit 1 clear (0xa1f0c(e, 2))
                // THE RAGE LATCH (effects lane, 2026-10-20; READ): vt+0x204 0xe107ac ends by setting ctl+0x26 = isEnraged (0xe10eb4) at
                // EVERY action start; vt+0x208 0xe11204..0xe112dc, every frame: ctl+0x26 set and latch e+0xcac4 bit 1 clear -> set it, id
                // 1004 (u 2); ctl+0x26 clear and the bit set -> clear it, id 1005 (u 3) -- each through a block of its own with +0x14 |= 0x20,
                // root joint +0x52 = 3, +0x1c |= 2 (vt+0x1d0, table 0x169d724). The viewer's action start is a new play.
                if (c.fresh) t.c26 = !!c.rage;
                const latch = [];
                if (t.c26 && !t.l26){ t.l26 = true; latch.push(['em027_00u', 2, 'UNIQUE', { rootJoint: 3 }]); }
                else if (!t.c26 && t.l26){ t.l26 = false; latch.push(['em027_00u', 3, 'UNIQUE', { rootJoint: 3 }]); }
                return [...((was && !on) ? [['em027_00u', 1, 'UNIQUE']] : []), ...latch, ...poison1100(t, c, 'em027_00c')];
              },""")
rep("""              records: [...[0, 1, 10].map(k => ['em027_00u', k, 'UNIQUE']), ['em027_00c', 1100, 'UNIQUE']] },""",
    """              records: [...[0, 1, 2, 3, 10].map(k => ['em027_00u', k, 'UNIQUE']), ['em027_00c', 1100, 'UNIQUE']] },""")
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')
