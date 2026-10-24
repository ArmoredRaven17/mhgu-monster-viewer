import os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
cur = {}
def load(p):
    cur['p'] = os.path.join(V, p); cur['s'] = open(cur['p'], encoding='utf-8', newline='').read()
def rep(a, b):
    s = cur['s']; assert s.count(a) == 1, (s.count(a), a[:80]); cur['s'] = s.replace(a, b)
def save():
    open(cur['p'] + '.tmp', 'w', encoding='utf-8', newline='').write(cur['s']); os.replace(cur['p'] + '.tmp', cur['p'])

load(r'render\motion-states.js')
rep("""//   clips: a clip whose height the ROM sets otherwise -- `posture: 3` (the unit pinned to the ground, the body drawn
//   FlyOfs x size above it by e+0x1384, entered through the setter), `at(frame, size)` (a height read for that clip's own
//   action, e.g. Seregios's ledge climb (3, 0x50) 0xfe6f38: 472 x s + 6.8 x s x f over flat ground).
export const AIR_STANDARD_CURVE = 485.5;
const RATH_AIR = { flyOfs: 500 };
export const AIR_HEIGHT = {
  em001_00: RATH_AIR, em001_02: RATH_AIR, em001_04: RATH_AIR, em002_00: RATH_AIR, em002_02: RATH_AIR, em002_04: RATH_AIR,
  em077_00: { flyOfs: 500, clips: { '1|Motion[4]': { posture: 3 }, '1|Motion[5]': { at: (f, s) => 472 * s + 6.8 * s * f } } },""",
"""//   clips: a clip whose height the ROM sets otherwise (a clip named here applies whatever its bounds say):
//   * `posture: 3` -- THE LOW HOVER. 0xbf284 pins the unit (P+0x44) to the ground every frame and the body is DRAWN above
//     it: 0xa50dc zeroes e+0x1380..88, 0xa5db8 adds P+0x1cc x S (FlyOfs, written by the posture setter's posture-3 arm
//     0xbf74c) plus P+0x5c x m, 0xa807c draws the unit at P+0x40 + e+0x1380. S = P+0x1ac x P+0x1b0 (sizeBase x spawn size),
//     m = the spawn size (S / sizeBase). `drawn(f, S, m)` is the body above the ground (FlyOfs x S when not given); every
//     900 test sees the unit ON THE GROUND -- so the hover dust always spawns there (rom-map trap 68);
//   * `at(f, S)` -- a posture-1 height read for that clip's own action.
// The Rath line's rows: ROM runs of each action (dev/air-height.md 5), one class for all six (uEm001_00).
export const AIR_STANDARD_CURVE = 485.5;
const RATH_LOW = (f, S, m) => 500 * S - 75 * m;          // P+0x5c steps 2.5 / frame to -75 on flat ground
const RATH_AIR = { flyOfs: 500, clips: {
  // L1 M1 is the HIGH hover, posture 1: the plain (0, 3) idle and the hover after a takeoff hold H0 = 500 S + 485.5 (no row:
  // the standard). Its (4, 3) / (4, 0x19) descent -- vy -5 from H0 down to 500 S by f97, then L1 M4 -- is not shown.
  '1|Motion[4]':  { posture: 3, drawn: (f, S, m) => 500 * S - m * Math.min(75, 2.5 * (f + 1)) },   // the low-hover entry
  '1|Motion[2]':  { posture: 3, drawn: RATH_LOW },      // (0, 6) idle, (4, 4) / (4, 0x15) / (4, 5) / (4, 0xc) / (4, 0xd)
  '1|Motion[11]': { posture: 3, drawn: RATH_LOW },
  '1|Motion[12]': { posture: 3, drawn: RATH_LOW },
  // the (7, 0x2d)-family dive, posture 1, floor (FlyOfs - 200) x S; its rate is aim-dependent -- 985.5 to 300 by f46 with the
  // aim at the origin, which stands in
  '2|Motion[12]': { at: (f, S) => Math.max(300 * S, (500 * S + 485.5) - ((500 * S + 485.5) - 300 * S) * Math.min(1, f / 46)) },
  '2|Motion[10]': { at: (f, S) => 300 * S },
  '2|Motion[11]': { posture: 3, drawn: (f, S, m) => 500 * S - 200 * m },
  // (7, 0x24) / (7, 0x78) / (7, 0x79): P+0x5c -3.333 / frame to -200 (from 0; from the low hover it starts at -75 -- the
  // AI's, not shown), held, then the rise back
  '4|Motion[26]': { posture: 3, drawn: (f, S, m) => 500 * S - m * Math.min(200, 3.3333 * f) },
  '4|Motion[25]': { posture: 3, drawn: (f, S, m) => 500 * S - 200 * m },
  '4|Motion[27]': { posture: 3, drawn: (f, S, m) => 500 * S - 200 * m * Math.max(0, 1 - (f + 1) / 40) },
} };
export const AIR_HEIGHT = {
  em001_00: RATH_AIR, em001_02: RATH_AIR, em001_04: RATH_AIR, em002_00: RATH_AIR, em002_02: RATH_AIR, em002_04: RATH_AIR,
  // Seregios: L1 M2 (0, 6) is posture 3 too (0xfdb29c) -- his P+0x5c on it is NOT READ, so the body is drawn at FlyOfs x S
  em077_00: { flyOfs: 500, clips: { '1|Motion[4]': { posture: 3 }, '1|Motion[2]': { posture: 3 },
                                    '1|Motion[5]': { at: (f, s) => 472 * s + 6.8 * s * f } } },""")
rep("""// for an AIR clip: { ground, unit } in game units BELOW the drawn clip origin -- where the ground is, and where the unit is
// (0, the origin, except posture 3: the ground) -- or null where the monster's air height is not read
export function airLift(monId, list, clip, frame, size){
  const t = AIR_HEIGHT[monId];
  if (!t) return null;
  const c = t.clips && t.clips[list + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (c && c.posture === 3) return { ground: t.flyOfs * size, unit: t.flyOfs * size };
  if (c && c.at) return { ground: c.at(frame, size), unit: 0 };
  return { ground: t.flyOfs * size + AIR_STANDARD_CURVE, unit: 0 };
}""", """// { ground, unit } in game units BELOW the drawn clip origin -- where the ground is, and where the unit is (0, the origin,
// except posture 3: the ground) -- for a clip with its own row, or for any other clip the caller found airborne (`air`);
// null where the monster's air height is not read. size: S, the world group's scale; sizeBase: the monster's own (m = S /
// sizeBase, the spawn size)
export function airLift(monId, list, clip, frame, size, sizeBase = 1, air = true){
  const t = AIR_HEIGHT[monId];
  if (!t) return null;
  const c = t.clips && t.clips[list + '|' + String(clip).replace(/_(start|loop)$/, '')];
  const m = size / (sizeBase || 1);
  if (c && c.posture === 3){ const d = c.drawn ? c.drawn(frame, size, m) : t.flyOfs * size; return { ground: d, unit: d }; }
  if (c && c.at) return { ground: c.at(frame, size), unit: 0 };
  if (!air) return null;
  return { ground: t.flyOfs * size + AIR_STANDARD_CURVE, unit: 0 };
}""")
save()

load('index.html')
rep("""  const reach = (pose.bounds && !pose.bounds.isEmpty()) ? pose.bounds.min.y : Infinity;
  if (!(reach < clipRoot.position.y - AIR_REACH)) return null;
  return airLift(state.id, state.list, act.getClip().name, act.time * 60, world.scale.y || 1);""",
"""  const reach = (pose.bounds && !pose.bounds.isEmpty()) ? pose.bounds.min.y : Infinity;
  const e = entry();
  // a clip with its own AIR_HEIGHT row applies as it is; any other only when it hangs below its origin
  return airLift(state.id, state.list, act.getClip().name, act.time * 60, world.scale.y || 1, (e && e.sizeBase) || 1,
                 reach < clipRoot.position.y - AIR_REACH);""")
save()
print('ok')
