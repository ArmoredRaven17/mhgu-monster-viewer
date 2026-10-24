import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\class-threads.js'
s = open(p, encoding='utf-8', newline='').read()

def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)

# 1. the import (class-threads.js had none)
rep("// A MONSTER CLASS'S OWN STRETCHED EFFECTS:", "import { webAnchors088 } from './shells.js';\n\n// A MONSTER CLASS'S OWN STRETCHED EFFECTS:")

# 2. the rows-off comment: the anchors and the two points are now in; what stays off
rep("""//   the web rows -- u 341 (slots 10..17, start kind 3 = the same e+0xd410 point, 0x10b8704..0x10b871c; end kind 6 / 5 =
//     the anchors e+0xd420.. / e+0xd450..), u 340 slot 19 and u 342 / 343 / 344 (kind 4, e+0xd410; e+0xd408, whose writer
//     is not found). The anchors' end points ARE drawn now (render/shells.js webAnchors088: the anchor shell's +0x40,
//     0x10ba21c..0x10ba254, gated as the ROM's 0x4381d8 / 0x10b98a8); what still holds these rows off is their START,
//     e+0xd410 (and e+0xd408 for u 342..344), whose writer is being read (2026-10-15).""",
"""//   the rows behind e+0xd408 -- a byte FLAG (not a point), cleared every frame (0x10b386c) and set every frame of the
//     status-7 web attacks (7, 0x2c / 0x2f / 0x31..0x34 / 0x36 / 0x37), whose clips are not read: u 340 slot 7 on L2 M2 /
//     M3 / M16 / M17, u 342 slot 8 (L2 M2 80..98, L2 M35 90..178), u 343 slot 9 (L2 M3 80..98, L2 M16 64..80), u 344 slot
//     19 (L2 M35 from 180) -- dev/em088-d410-writer.md 2 / 3. The viewer never sets the flag, so the pass never marks them.""")

rep("""const D410 = 'the point e+0xd410 (end kind 4; its writer is not read)';
const ANCHORS = 'the start point e+0xd410 / e+0xd408 (writers not read); the web anchors e+0xd420.. / e+0xd450.. are ' +
                'available (render/shells.js webAnchors088)';""",
"""const D408 = 'e+0xd408, set only by the status-7 web attacks (7, 0x2c..0x37), whose clips are not read';""")

rep("""  if (motion.list === '2' && motion.slot === 30 && s === 1 && ((n >= 0x1c && n <= 0x1f) || (n >= 0x22 && n <= 0x25)))
    off.push({ key: 340, slot: 7, why: D410 });
""", "")

# 3. the two web points, the latch, and the web rows
rep("""export const CLASS_THREADS = {""",
"""// THE WEB POINTS e+0xd410 / e+0xd440 (dev/em088-d410-writer.md 1, READ 0x10b5430..0x10b579c + ROM-run): written ONCE, at the
// start of (1, 0x1c) / (1, 0x22) (d410, arm 0x10b5430) and (1, 0x1e) / (1, 0x24) (d440, arm 0x10b56b0) -- the wind-ups of the
// five- and the three / four-anchor webs -- as P+0x40 + (v.x s cos + v.z s sin, v.y s, v.z s cos - v.x s sin), w 0: s his size
// (0xbe518), the yaw u16(P+0x54) x 9.58738e-05, v action-tune vec 17 (0x6f640(e, 0x11)) = (0, 4000, 0) from
// em088_00_actiontune.fup -- a point 4000 x size straight above him. Until the first web of each kind the ctor's zero fill
// (0x13ecbfc(e+0xcb00, 0x9e0)) leaves it at (0, 0, 0), and so does the viewer.
const EM088_TUNE17 = [0, 4000, 0];
function em088Latch(action, owner, mem){
  if (!action || action[0] !== 1 || !owner || !owner.position) return;
  const n = action[1];
  const key = n === 0x1c || n === 0x22 ? 'd410' : n === 0x1e || n === 0x24 ? 'd440' : null;
  if (!key) return;
  const [vx, vy, vz] = EM088_TUNE17, sz = owner.scale || 1, a = owner.yaw16 * 9.58738e-05, c = Math.cos(a), sn = Math.sin(a);
  const [x, y, z] = owner.position;
  mem[key] = [x + vx * sz * c + vz * sz * sn, y + vy * sz, z + vz * sz * c - vx * sz * sn];
}
// THE WEB ROWS (dev/em088-d410-writer.md 2, emulated + copy sites read; spec 3.3), on EVERY motion and whatever he carries:
//   u 341 (1015) slots 10..14: e+0xd410 -> the anchor e+0xd420 + 4p's +0x40 (end kind 6), while that anchor passes the
//     ROM's gate (0x4381d8: state 1, sub-state <= 2 -- webAnchors088 `thread`); graceful;
//   u 341 (1014) slots 15..17: e+0xd440 -> the anchor e+0xd450 + 4p's +0x40 (end kind 5), p <= 2 (0x10b98a8); graceful;
//   u 340 (1011) slot 7: joint 149 -> e+0xd410 on L2 M30 under (1, 0x1c / 0x1d / 0x22 / 0x23) (0x10b8328); hard;
//   u 340 (1011) slot 19: joint 149 -> e+0xd440 on every motion with any e+0xd450.. anchor, and on L2 M30 under (1, 0x1e /
//     0x1f / 0x24 / 0x25) (0x10b8f60 / 0x10b9858); hard. L2 M35 with the anchors in a mixed state runs u 342 / 343 / 344
//     there instead, behind e+0xd408 (0x43a388's anchor +4 byte test is not transcribed): on L2 M35 slot 19 is held off, named.
function em088Webs(motion, action, anchors, on, off){
  const [s, n] = action || [];
  const m30 = motion && motion.list === '2' && motion.slot === 30 && s === 1;
  if (anchors) anchors.d420.forEach((A, p) => {
    if (A && A.thread) on.push({ slot: 10 + p, id: 1015, key: 341, a: { point: 'd410' }, b: { anchor: 'd420', p }, hard: false });
  });
  if (anchors) anchors.d450.slice(0, 3).forEach((A, p) => {
    if (A && A.thread) on.push({ slot: 15 + p, id: 1014, key: 341, a: { point: 'd440' }, b: { anchor: 'd450', p }, hard: false });
  });
  if (m30 && (n === 0x1c || n === 0x1d || n === 0x22 || n === 0x23))
    on.push({ slot: 7, id: 1011, key: 340, a: 149, b: { point: 'd410' }, hard: true });
  const any450 = !!anchors && anchors.d450.some(A => A);
  if (any450 || (m30 && (n === 0x1e || n === 0x1f || n === 0x24 || n === 0x25))){
    if (motion && motion.list === '2' && motion.slot === 35 && any450)
      off.push({ key: 340, slot: 19, why: 'L2 M35: the anchors\\' mixed-state test (0x43a388, the anchor +4 byte) is not transcribed' });
    else on.push({ slot: 19, id: 1011, key: 340, a: 149, b: { point: 'd440' }, hard: true });
  }
}

export const CLASS_THREADS = {""")

rep("""    off: [{ key: '341 / 340 (slot 19) / 342 / 343 / 344', why: ANCHORS }],""",
    """    off: [{ key: '340 (slot 7 off L2 M30) / 342 / 343 / 344', why: D408 }],""")

rep("""    at({ motion, tick, carry, pending, action }){
      const on = [], off = motion ? em088Off(motion, action) : [];""",
"""    at({ motion, tick, carry, pending, action, anchors }){
      const on = [], off = motion ? em088Off(motion, action) : [];
      em088Webs(motion, action, anchors, on, off);""")

rep("""    objectPoint: em088ObjectPoint,
  },""",
"""    objectPoint: em088ObjectPoint,
    // the action start's write of e+0xd410 / e+0xd440 (em088Latch); the anchors as the shells hold them (render/shells.js)
    latch: em088Latch,
    anchors: shells => webAnchors088(shells),
  },""")

open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

# schedule.js stepThreads: the latch at a new play, the anchors, a point start / a point or anchor end
q = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\rom\effect\schedule.js'
t = open(q, encoding='utf-8', newline='').read()
def rep2(a, b):
    global t
    assert t.count(a) == 1, (t.count(a), a[:80])
    t = t.replace(a, b)
rep2("""    const carry = inp ? inp.carry : 4;
    const now = T.at({ motion, tick, carry, pending: inp ? inp.pending : 4, action: inp ? inp.action : null });""",
"""    const carry = inp ? inp.carry : 4;
    // a class's points written once at an action's start (Ahtal-Ka's web points, class-threads.js latch): taken when the
    // viewer starts a play (the clip's play token), from the owner unit as it stands then (+0x40, its size, its yaw word)
    R.mem = R.mem || {};
    if (T.latch && c && c.play != null && c.play !== R.play){
      R.play = c.play;
      const P = this.parent;
      T.latch(inp ? inp.action : null, P ? { position: P.position, scale: P.scale, yaw16: this.ownerYaw16() } : null, R.mem);
    }
    const anchors = T.anchors ? T.anchors(this.shells ? this.shells.state : null) : null;
    const now = T.at({ motion, tick, carry, pending: inp ? inp.pending : 4, action: inp ? inp.action : null, anchors });""")
rep2("""    const end = b => {
      if (typeof b === 'number') return { point: pos(b), why: 'joint ' + b + ' not in the model' };""",
"""    // a POINT the class keeps (start kind 3 / end kind 4: R.mem, zero until written, as the ctor's fill leaves it)
    const kept = k => (R.mem[k] || [0, 0, 0]).slice();
    const start = a => typeof a === 'number' ? pos(a) : kept(a.point);
    const end = b => {
      if (typeof b === 'number') return { point: pos(b), why: 'joint ' + b + ' not in the model' };
      if (b.point) return { point: kept(b.point) };
      if (b.anchor){ const A = anchors && anchors[b.anchor][b.p]; return { point: A ? A.point.slice(0, 3) : null, why: 'anchor ' + b.anchor + '+' + b.p + ' gone' }; }""")
rep2("""      const A = s ? pos(s.a) : null, Bend = s ? end(s.b) : null, B = Bend ? Bend.point : null;""",
     """      const A = s ? start(s.a) : null, Bend = s ? end(s.b) : null, B = Bend ? Bend.point : null;""")
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(q + '.tmp', q)
print('ok')
