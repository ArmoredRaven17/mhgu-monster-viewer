p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf8', newline='').read()

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:80])
    s = s.replace(a, b)

# --- the timers: the class control and the parts table reach them
rep("""    const c = { list: String(list), slot, frame, dt, rage: this.rage(user.rage), dead: this.dead(), action: user.action || null,
                hornBroken: T.hornBroken ? T.hornBroken(this.userDrawn, sets) : false };""",
"""    const c = { list: String(list), slot, frame, dt, rage: this.rage(user.rage), dead: this.dead(), action: user.action || null,
                ctl: user.classCtl | 0, hornBroken: T.hornBroken ? T.hornBroken(this.userDrawn, sets, this.table) : false };""")

timers = """  // AMATSU (dev/em058_00-effects-spec.md 5; vt+0x208 0xf09308, READ 2026-10-18). Alive: the aura e+0xcb70 holds id 1001 / 1002
  // (u 0 calm / u 1 enraged, by the key at +0x1b4) while the status is not 7 or the action is (7, 0xc) (0xf099cc); on any other
  // status-7 action it is hidden -- u 3 (id 1003) once and its alpha set to 0 (shown here as the hold dropped; its fade back in, alpha
  // +0x180, is not shown); e+0xcb78 holds u 100 (id 1007; u 101, id 1008, while e+0x15fb == 1); enraged, every 30 frames (countdown
  // e+0xcb80, 0x7206c) u 1120 (id 1005; u 1121, id 1006, while e+0x15fb == 1). Dying: both handles stopped, and once (e+0xcb7c) u 2
  // (id 1004) and u 102 (id 1009). e+0x15fb is the Amatsu control (CLASS_CONTROLS below). Keys [0x169f370].
  em058_00: { step: (t, c) => {
                const U = k => ['em058_00u', k, 'UNIQUE'], fire = [], hp = c.ctl === 1;
                const hidden = !!c.action && c.action[0] === 7 && c.action[1] !== 0xc;
                if (c.dead){ if (!t.died){ t.died = true; fire.push(U(2), U(102)); } c.hidden = hidden; return fire; }
                t.died = false;
                if (hidden && !t.hidden) fire.push(U(3));
                t.hidden = hidden; c.hidden = hidden;
                if (c.rage){
                  const tick = () => { if ((t.cb80 || 0) <= 0){ t.cb80 = 30; return true; } t.cb80 -= c.dt; if (t.cb80 <= 0){ t.cb80 = 30; return true; } return false; };
                  if (tick()) fire.push(U(hp ? 1121 : 1120));
                } else t.cb80 = 0;
                return fire;
              },
              holds: c => c.dead ? [] : [...(c.hidden ? [] : [['em058_00u', c.rage ? 1 : 0]]), ['em058_00u', c.ctl === 1 ? 101 : 100]],
              records: [0, 1, 2, 3, 100, 101, 102, 1120, 1121].map(k => ['em058_00u', k, 'UNIQUE']) },
  // VALSTRAX (dev/em086_00-effects-spec.md 5; vt+0x208 0x109ed50, READ 2026-10-18). Alive: the aura e+0xcb1c holds u 200 (id 1005)
  // calm, enraged u 1120 (id 1006) or u 1130 (id 1007) once part 0's break level (0x9d36c(e, 0)) reaches the .dtp byte 0x109ee90 /
  // 0x109ee94 read (A[1] bytes 1 / 2 = 2 at either rank -- the head broken, set 6); dying: stopped. The glow e+0xcb14 holds u 1121
  // (id 1008) while e+0xcb10 is 0 / 1 and fades out on 2..6 (alpha step [0x16a2fa0][state - 2] x dt: 1/60, at once, at once, 1/30,
  // 1/10 -- the stop is kept at that frame count, the fade itself is not shown). e+0xcb10 is set at each action start by vt+0x204
  // 0x109f830 (0x10a0884; calm: 3, 0x10a08d4): 2 for status-7 numbers <= 0x30 but 0x13 / 0x1f / 0x20 / 0x24..0x29, 4 for (1, 5) /
  // (10, 0x1d / 0x1e), 5 for (3, 0 / 1 / 5 / 6), untouched by (7, 0x31 / 0x32 / 0x34 / 0x35), 0 otherwise (hookbyte.py, every
  // action). A play the viewer names no action for keeps the last state. Keys [0x16a2edc].
  em086_00: { step: (t, c) => {
                const k = c.action ? c.action.join(',') : null;
                if (k !== t.act || c.rage !== t.rage){
                  t.act = k; t.rage = c.rage;
                  const g = !c.rage ? 3 : valstraxGlow(c.action);
                  const was = t.glow == null ? 0 : t.glow;
                  if (g != null) t.glow = g; else if (t.glow == null) t.glow = 0;
                  if ((was === 0 || was === 1) && !(t.glow === 0 || t.glow === 1)) t.fade = [60, 0, 0, 30, 10][t.glow - 2] || 0;
                }
                if (t.fade > 0) t.fade -= c.dt;
                c.glow = (t.glow === 0 || t.glow === 1) || t.fade > 0;
                return [];
              },
              hornBroken: (drawn, sets, table) => (sets || []).includes(6) || userLevel([[4], [5], [6]], table, drawn) >= 2,
              holds: c => c.dead ? [] : [['em086_00u', !c.rage ? 200 : c.hornBroken ? 1130 : 1120], ...(c.glow ? [['em086_00u', 1121]] : [])],
              records: [200, 1120, 1121, 1130].map(k => ['em086_00u', k, 'UNIQUE']) },
};
// Valstrax's e+0xcb10 for an action (null: the action leaves it as it was)
function valstraxGlow(a){
  if (!a) return null;
  const [st, n] = a;
  if (st === 7){
    if (n === 0x31 || n === 0x32 || n === 0x34 || n === 0x35) return null;
    return n <= 0x30 && !(n === 0x13 || n === 0x1f || n === 0x20 || (n >= 0x24 && n <= 0x29)) ? 2 : 0;
  }
  if ((st === 1 && n === 5) || (st === 10 && (n === 0x1d || n === 0x1e))) return 4;
  if (st === 3 && (n === 0 || n === 1 || n === 5 || n === 6)) return 5;
  return 0;
}"""
rep("""  em024_00: { step: () => [], holds: c => c.dead ? [] : [['em024_00u', c.rage ? 240 : 230]],
              records: [['em024_00u', 230, 'UNIQUE'], ['em024_00u', 240, 'UNIQUE']] },
};""", """  em024_00: { step: () => [], holds: c => c.dead ? [] : [['em024_00u', c.rage ? 240 : 230]],
              records: [['em024_00u', 230, 'UNIQUE'], ['em024_00u', 240, 'UNIQUE']] },
""" + timers)

rep("""  em027_00: { key: 'fireAura', label: 'Fire Aura', options: [[0, 'Off'], [1, 'On']],
              title: 'P+0x1bb not 0 / 0xff: his enable word (0xe1a9d8) lights bits 15-17 on every motion, and clears bits 6-8 on L4 M6.' },
};""", """  em027_00: { key: 'fireAura', label: 'Fire Aura', options: [[0, 'Off'], [1, 'On']],
              title: 'P+0x1bb not 0 / 0xff: his enable word (0xe1a9d8) lights bits 15-17 on every motion, and clears bits 6-8 on L4 M6.' },
  // AMATSU's e+0x15fb (dev/em058_00-effects-spec.md 6; READ 2026-10-18): set to 1 once, by vt+0x204 0xf08e7c at 0xf091ac on the
  // action (10, 0x8e) -- an empty script -- which the shared dispatcher 0x9a76c issues for reaction code 0x1a (table 0x9a81c, case
  // 26), and 0x97d20 picks code 0x1a at 0x99280 when P+0x380 >= P+0x370 / P+0x374 with P+0x3a8 bit 16 set (and bit 15 clear or
  // posture 3): a one-way HP-fraction state. It never goes back to 0. What it shows: the part pass 0xf09d0c draws head sets 15 /
  // 16 / 17 for 1 / 8 / 9 (the same parts plus groups 25 / 27 / 28: STATE_OVERLAY below), u 1121 for his puff u 1120 and u 101 for
  // u 100 (CLASS_TIMERS above). A class state, not a part: no break row reaches it.
  em058_00: { key: 'hpState', label: 'HP State', options: [[0, 'Before'], [1, 'Past the threshold']],
              title: 'e+0x15fb, set once by (10, 0x8e) when his HP fraction falls to P+0x380: head sets 15-17 (groups 25 / 27 / 28), puff u 1121, u 101.' },
};""")

rep("""export const STATE_OVERLAY = {
  em082_00:""", """export const STATE_OVERLAY = {
  // AMATSU past the HP threshold (CLASS_CONTROLS em058_00): sets 15 / 16 / 17 for 1 / 8 / 9 at the head's level; only the groups
  // they add (25, 27, 28) differ. `on` is the class control, not the ALIVE test.
  em058_00: { groups: [25, 27, 28], on: ms => ms.userCtl === 1,
              tables: [{ off: [[1], [8], [9]], on: [[15], [16], [17]] }] },
  em082_00:""")

rep("""      const side = this.overlayOn() ? 'on' : 'off';
      for (const t of ov.tables){""", """      const side = (ov.on ? ov.on(this) : this.overlayOn()) ? 'on' : 'off';
      for (const t of ov.tables){""")
rep("""                    (STATE_OVERLAY[this.monId] ? (this.overlayOn() ? 'O:' : 'o:') : '') +""",
    """                    (STATE_OVERLAY[this.monId] ? ((STATE_OVERLAY[this.monId].on ? STATE_OVERLAY[this.monId].on(this) : this.overlayOn()) ? 'O:' : 'o:') : '') +""")
rep("""  showParts(drawn, table){
    this.userDrawn = new Map(drawn);""", """  showParts(drawn, table, ctl){
    this.userDrawn = new Map(drawn);
    this.userCtl = ctl | 0;""")

# --- Valstrax's comet on L1 M5
rep("""  '3|Motion[21]':  { start: [['em086_00u', 900]], drops: true },""",
"""  '3|Motion[21]':  { start: [['em086_00u', 900]], drops: true },
  // THE COMET (dev/em086_00-effects-spec.md 5; 0x109a5b4 for (7, 0x32 / 0x34 / 0x35), 0x109b07c for (7, 0x33); READ 2026-10-18).
  // (7, 0x32 / 0x34 / 0x35) phase 3 sets L1 M5 (0x105) and P+0x1bc = tune float 0x24 (30.0, em086_00_actiontune.fup); at its
  // expiry (0x7206c) phase 5, motion 0xffff (no clip: he is gone) and id 1002 = u 110 (0x109ab60) -- frame 30 of L1 M5, copy B.
  // Phase 5 flies him unseen for tune float 0x25 (90 frames) and then requests id 1001 = u 100 into e+0xcb18 (0x109af40), phase 6
  // passes to (7, 0x33), whose phase 0 (motion 0xffff) stops it and requests id 1003 = u 120 (0x109b2dc): NEITHER IS ON A CLIP
  // (named). Its phase 1, when motion 0xffff has ended and tune float 0x29 (60) is out, sets L1 M5 again and requests id 1004 =
  // u 130 into e+0xcb18 (0x109b7d8) -- held through phase 2's fall until he lands (P+0x44 <= P+0x1d4 + c, 0x109b440), which
  // stops it and sets L2 M73: copy C, held. The frame handler also stops e+0xcb18 off (7, 0x32..0x35). Copy A: L1 M5's other plays
  // ((3, 0 / 1 / 5), (12, 0), (13, 0)), none.
  '1|Motion[5]':    {},
  '1|Motion[5]#B':  { fireFrom: [[30, [['em086_00u', 110, 'UNIQUE']]]] },
  '1|Motion[5]#C':  { hold: ['em086_00u', 130, 'UNIQUE'] },""")
rep("""  em086_00: Object.fromEntries(['3|Motion[9]', '3|Motion[10]', '3|Motion[11]', '3|Motion[5]', '3|Motion[6]', '3|Motion[7]', '0|Motion[5]'].map(k => [k, ['A', 'B']])),""",
"""  em086_00: { ...Object.fromEntries(['3|Motion[9]', '3|Motion[10]', '3|Motion[11]', '3|Motion[5]', '3|Motion[6]', '3|Motion[7]', '0|Motion[5]'].map(k => [k, ['A', 'B']])),
              '1|Motion[5]': ['A', 'B', 'C'] },""")
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\psl-mask.js'
s = open(p, encoding='utf8', newline='').read()
rep("""              '0|Motion[5]': [{ action: [1, 0x04] }, { action: [1, 0xfe], variant: 'B' }] },""",
"""              '0|Motion[5]': [{ action: [1, 0x04] }, { action: [1, 0xfe], variant: 'B' }],
              // THE COMET (motion-states.js em086_00): A the other plays, B the launch, C the fall
              '1|Motion[5]': [...[[3, 0], [3, 1], [3, 5], [12, 0], [13, 0]].map(a => ({ action: a })),
                              ...[0x32, 0x34, 0x35].map(n => ({ action: [7, n], variant: 'B' })), { action: [7, 0x33], variant: 'C' }] },""")
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf8', newline='').read()
rep("""                                boulder: state.boulder | 0, action: plays.key ? plays.action : undefined }, now);""",
    """                                boulder: state.boulder | 0, action: plays.key ? plays.action : undefined, classCtl: state.classCtl | 0 }, now);""")
rep("""    motionStates.showParts(drawn, e.groups || []);""", """    motionStates.showParts(drawn, e.groups || [], state.classCtl | 0);""")
rep("""  state.classCtl = +e.target.value | 0;
  saveState();
  plays.key = null; plays.motion = null;""", """  state.classCtl = +e.target.value | 0;
  saveState();
  plays.key = null; plays.motion = null;
  applyPartState();                       // a control the part pass reads (STATE_OVERLAY's `on`: Amatsu's e+0x15fb)""")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
