import { webAnchors088 } from './shells.js';

// A MONSTER CLASS'S OWN STRETCHED EFFECTS: records its class requests into numbered slots and re-aims every frame
// between two points it computes (schedule.js stepThreads; host.js stretchRequest). Raven, 2026-10-15, on Ahtal-Ka's
// silk: "Silk threads in game tend to simply connect two points, not aimed at hunters" / "we will likely follow the ROM
// as is instead of a proxy" -- so every thread runs between the two points the ROM computes, and a thread whose point
// the viewer cannot produce stays OFF with the missing input named (`off`), never drawn to a stand-in point.
//
// AHTAL-KA (em088_00), uEm088_00 vt+0x208 = 0x10b7644, whose head 0x10b7798 is THE THREAD PASS (READ, effects-runtime
// agent 2026-10-15; dev/em088_00-effects-spec.md 3.2, rom-map "Ahtal-Ka -- the carried object, the silk threads"):
//   * 20 slots at e+0xcb20 + 0x70k: +0 handle, +4 active (cleared every call), +8 id, +0xc / +0xd start kind / param,
//     +0x10 start point, +0x20 start offset, +0x30 / +0x31 end kind / param, +0x40 end point, +0x50 end offset, +0x60
//     the stop flag. A switch on the motion marks this frame's slots; the object is e+0xcb0c, or e+0xd3e1 when that is 4
//     (0x10b78e8; e+0xd3e1 = d471 != 4 ? d471 : d470, the AI's pending pick, 0x10b3f74).
//   * POINT KINDS, read off the two jump tables (0x10b9fb8; 0x10ba0e0 -> table 0x10ba100, entry + 0x10ba100):
//       start 1 his joint +0xd (0xc164c, the joint's position), 2 his joint + offset +0x20 (0xc15a4 rows), 3 the point +0x10;
//       end   1 his joint +0x31 (0x10ba120), 2 his joint + offset +0x50 (0x10ba12c), 3 OBJECT +0x31 (0x10ba1b4: its slot
//             state 0x10ae8d0 -- 1 at its spot G+0x50+16k, 2 CARRIED -> HIS JOINT 0x82 (0x10ba3d4: 0xc164c(e, 0x82)),
//             3 the free unit 0x10aed64's +0x40), 4 THE POINT +0x40 (0x10ba204), 5 / 6 the anchor e+0xd450 / e+0xd420
//             + 4 * param, its +0x40 (0x10ba21c / 0x10ba228), 7 AHTAL-NESET'S joint (0x10ba25c: 0x10ae780 = [G+0x34] ->
//             0xc164c), 8 Ahtal-Neset's joint + offset +0x50 (0x10ba280: 0x10ae790 rows, 0x10ae780 position).
//     (The spec's 3.2 list named 4 the Neset joint, 7 the Neset joint + offset and 8 a fixed point -- withdrawn in rom-map.)
//   * an active slot with no handle is requested through 0x10bb5f0 (host.js threadRequester), then re-aimed the same frame
//     (0x10ba418..0x10ba528, host.js stretchRequest); an inactive slot with a handle is stopped, 0x329c40(h, 1) if its
//     +0x60 byte is 1, else (h, 0), and the handle cleared (0x10b9fe8..0x10ba01c). A held slot whose id changes keeps its
//     handle (0x10ba3e8 tests the handle alone).
// THE WINDOWS: the spec's emulated sweep (<archive>\ak\sw_m0.txt: every L2 motion x every tick x object, the pass
// run natively), transcribed below as TICK ranges -- tick t is the one reaching frame t + 1 (spec 3.2's frame model),
// `E` = to the motion's end. The motions outside L2 M4..M46 are the switch's DEFAULT arm (0x10b78f0 `bhi 0x10b7f60`),
// READ: object != 4 -> slot 0 = id 1004 (u 11), joint 149 -> object, stop flag 1 (0x10b7f60..0x10b7fa4 -> 0x10b79f4) --
// every motion of every other list too, which the sweep (L2 only) did not run.
// ids -> keys through vt+0x1d0's table 0x16a376c (spec 3.0): 1003 u 10, 1004 u 11, 1005 u 12, 1006 u 13, 1007 u 14,
// 1008 u 15, all em088_00_003_s (UNIQUE 0..5); 1011..1018 u 340..344 and 1019..1029 u 400..410.

const E = Infinity;
const O = 'object';
// L2 motion -> [[slot, id, start joint, end (joint or O), stop flag, [[tick from, tick to], ...]], ...]  (sw_m0.txt)
const EM088_L2 = {
  4: [[1, 1004, 149, O, 1, [[0, E]]]],
  5: [[3, 1005, 149, 5, 1, [[0, E]]], [4, 1007, 5, O, 1, [[0, E]]]],
  6: [[1, 1004, 149, O, 0, [[99, E]]], [3, 1005, 149, 5, 1, [[0, 98]]], [4, 1007, 5, O, 1, [[0, 98]]]],
  7: [[5, 1006, 149, 9, 1, [[0, E]]], [6, 1008, 9, O, 1, [[0, E]]]],
  8: [[1, 1004, 149, O, 0, [[99, E]]], [5, 1006, 149, 9, 1, [[0, 98]]], [6, 1008, 9, O, 1, [[0, 98]]]],
  9: [[1, 1004, 149, O, 1, [[0, E]]]],
  10: [[1, 1004, 149, O, 0, [[69, E]]], [3, 1005, 149, 5, 1, [[0, 68]]], [4, 1007, 5, O, 1, [[0, 68]]]],
  11: [[1, 1004, 149, O, 1, [[0, E]]]],
  12: [[1, 1004, 149, O, 0, [[69, E]]], [5, 1006, 149, 9, 1, [[0, 68]]], [6, 1008, 9, O, 1, [[0, 68]]]],
  13: [[2, 1003, 149, O, 1, [[49, E]]]],
  14: [[1, 1004, 149, O, 1, [[0, E]]]],
  15: [[0, 1004, 149, O, 1, [[0, E]]]],
  16: [[0, 1004, 149, O, 1, [[0, E]]]],
  17: [[1, 1004, 149, O, 0, [[0, 158]]]],
  18: [],
  19: [[1, 1003, 149, O, 1, [[29, 68]]], [3, 1005, 149, 5, 1, [[69, E]]], [4, 1007, 5, O, 1, [[69, E]]]],
  20: [[1, 1004, 149, O, 1, [[0, E]]]],
  21: [[1, 1004, 149, O, 1, [[0, E]]]],
  22: [[1, 1004, 149, O, 1, [[0, E]]]],
  23: [[1, 1004, 149, O, 1, [[0, E]]]],
  24: [[0, 1004, 149, O, 1, [[0, E]]]],
  25: [[0, 1004, 149, O, 1, [[0, E]]]],
  26: [[0, 1004, 149, O, 1, [[0, E]]]],
  27: [[0, 1004, 149, O, 1, [[0, E]]]],
  28: [[0, 1004, 149, O, 1, [[0, E]]]],
  29: [[0, 1004, 149, O, 1, [[0, E]]]],
  30: [[0, 1004, 149, O, 1, [[0, E]]]],
  31: [[0, 1004, 149, O, 1, [[0, E]]]],
  32: [[0, 1004, 149, O, 1, [[0, E]]]],
  33: [[0, 1004, 149, O, 1, [[0, E]]]],
  34: [[0, 1004, 149, O, 1, [[0, E]]]],
  35: [[0, 1004, 149, O, 1, [[0, E]]]],
  36: [[0, 1004, 149, O, 1, [[0, E]]]],
  37: [[1, 1003, 149, O, 1, [[29, 68]]], [5, 1006, 149, 9, 1, [[69, E]]], [6, 1008, 9, O, 1, [[69, E]]]],
  38: [[1, 1004, 149, O, 1, [[0, E]]]],
  39: [[1, 1004, 149, O, 1, [[389, E]]], [5, 1006, 149, 9, 1, [[0, 388]]], [6, 1008, 9, O, 1, [[0, 388]]]],
  40: [[1, 1004, 149, O, 1, [[0, E]]]],
  41: [[1, 1004, 149, O, 1, [[69, 88], [139, E]]], [3, 1005, 149, 5, 1, [[0, 68]]], [4, 1007, 5, O, 1, [[0, 68]]],
       [5, 1006, 149, 9, 1, [[89, 138]]], [6, 1008, 9, O, 1, [[89, 138]]]],
  42: [[1, 1004, 149, O, 1, [[0, E]]]],
  43: [[1, 1004, 149, O, 1, [[69, 88], [139, E]]], [3, 1005, 149, 5, 1, [[89, 138]]], [4, 1007, 5, O, 1, [[89, 138]]],
       [5, 1006, 149, 9, 1, [[0, 68]]], [6, 1008, 9, O, 1, [[0, 68]]]],
  44: [[1, 1004, 149, O, 1, [[0, E]]]],
  45: [[1, 1004, 149, O, 1, [[0, E]]]],
  46: [[1, 1004, 149, O, 1, [[0, E]]]],
};
// the DEFAULT arm (every other motion): slot 0, u 11, hard
const EM088_DEFAULT = [[0, 1004, 149, O, 1, [[0, E]]]];
// L2 M19 / M37 under status 1, n | 8 == 0xd ((1, 5) / (1, 0xd); 0x10b7c34): u 11 in slot 1 over ticks 0..68 INSTEAD of
// u 10's 29..68 (sw4b / sw5: "plain (1, 5) L2 M19 (1, 1004, 1, 149, 3, 0, 1) 0-68"); the leg pair from 69 as before
const EM088_PULL = { 19: [[1, 1004, 149, O, 1, [[0, 68]]]], 37: [[1, 1004, 149, O, 1, [[0, 68]]]] };
const EM088_KEYS = { 1003: 10, 1004: 11, 1005: 12, 1006: 13, 1007: 14, 1008: 15 };
// AWAITING A RECORDING: none. u 11 (the default arm's thread, on every motion while he carries) refused 0xa97d0c in the
// lifted 0xa97838 ~80 frames into its life until the shell sets of 2026-10-15/16 (record_shells.py, u 30 / 31 reach the same
// branch) were lifted; held 300 frames on L2 M4 since, the runtime never stops (dev/checks/em088_00.mjs). A key put back here
// is held off, named.
const EM088_UNRECORDED = new Set([]);

// THE ROWS THE VIEWER CANNOT DRAW, each with the input it lacks (spec 3.2 / 3.3, the kinds as read above):
//   (1, 0x1c..0x1f / 0x22..0x25) on L2 M30: u 340 slot 7, joint 149 -> kind 4, the point e+0xd410 (copied into +0x40 at
//     0x10b7e80..0x10b7ecc / 0x10b8328..0x10b83a4; no writer of e+0xd410 found in the band -- NOT READ);
//   (1, 0x21) -- L2 M25 / M26 / M27 / M47 / M48 / M13: u 400..409 joint 149 / joint 5 -> kind 7, Ahtal-Neset's joints 16 /
//     12 / 3, and u 410 (L2 M13 from tick 49) -> kind 8, Neset joint + (0, 200, 700) (0x10b9a40..0x10b9aa8) -- off where Ka is
//     viewed alone; BUILT 2026-10-26 on the combined list, where the Neset is on screen (em088Neset below);
//   [the rows behind e+0xd408 were listed here -- BUILT 2026-10-25 (lane B): em088D408Rows and em088Webs's L2 M35 test below, the
//     web attacks' clips read by their phase-0 setMotion]
const NESET = 'Ahtal-Neset\'s joints ([G+0x34] -> 0xc164c): no Neset when Ahtal-Ka is viewed alone -- the combined list shows them';
// THE (1, 0x21) ROWS, BUILT 2026-10-26 on the combined list (render/monster.js ROM_PARTNER_BODY.em088_00, Raven: "We can do the combine
// animations"; dev/em088-em087-combined-spec.md 5). Read off 0x10b9944..0x10b9f18 (the switch on motion - 0x20d, table 0x10b9984; the
// slots' +0x8 id, +0xc start kind 1 / joint 0x95, +0x30 end kind / param, +0x50 offset, +0x60 stop flag):
//   L2 M26 (0x10b9ab0): P+0x1bc (the action's timer, from 0 at M26's setMotion) >= 15 slot 0 id 1019 u 402 -> Neset joint 16 (0x1007),
//     >= 45 slot 1 id 1020 u 401 -> joint 12 (0xc07), >= 75 slot 2 id 1021 u 400 -> joint 3 (0x307); hard;
//   L2 M27 (0x10b9ba0): the three, whole; L2 M47 (0x10b9c64) frame < 40 (0xb09a4 mode 1 at 40.0, 0x10ba03c): the three; from 40 slot 3
//     id 1022 u 403 joint 149 -> HIS joint 5, slots 4 / 5 / 6 ids 1023..1025 u 404 / 405 / 406 joint 5 -> Neset joint 3 / 12 / 16; hard;
//   L2 M48 (0x10b9d8c): slots 0 / 1 / 2 ids 1028 / 1027 / 1026 u 409 / 408 / 407 -> Neset joint 16 / 12 / 3, stop flag 0 (graceful);
//   L2 M13 (0x10b9a14) frame >= 50 (0xb09a4 mode 1, literal 0x10b9d84): slot 7 id 1029 u 410 -> end kind 8: Neset joint 0 + (0, 200,
//     700) in its rows (0x10b9a64..0x10b9aa8); hard.
// End kind 7 is the joint's position (0x10ae780 -> 0xc164c), kind 8 the position plus the offset through the joint's rows (0x10ae790 ->
// 0xc15a4). Ticks here (tick t reaches frame t + 1).
const NESET_ROWS = {
  27: () => [[0, 1019, 402, 149, 16, true], [1, 1020, 401, 149, 12, true], [2, 1021, 400, 149, 3, true]],
  26: (tick, timer) => [timer >= 15 && [0, 1019, 402, 149, 16, true], timer >= 45 && [1, 1020, 401, 149, 12, true],
                        timer >= 75 && [2, 1021, 400, 149, 3, true]].filter(Boolean),
  47: tick => tick < 39 ? NESET_ROWS[27]() : [[3, 1022, 403, 149, 5, true, 'own'], [4, 1023, 404, 5, 3, true], [5, 1024, 405, 5, 12, true], [6, 1025, 406, 5, 16, true]],
  48: () => [[0, 1028, 409, 149, 16, false], [1, 1027, 408, 149, 12, false], [2, 1026, 407, 149, 3, false]],
  13: tick => tick >= 49 ? [[7, 1029, 410, 149, 0, true, 'off']] : [],
};
function em088Neset(motion, action, tick, timer, neset, on, off){
  const [s, n] = action || [];
  if (!(s === 1 && n === 0x21 && motion && motion.list === '2' && NESET_ROWS[motion.slot])) return;
  if (!neset){
    if ([25, 26, 27, 47, 48].includes(motion.slot)) off.push({ key: '400..409', why: NESET });
    if (motion.slot === 13) off.push({ key: 410, slot: 7, why: NESET });
    return;
  }
  for (const [slot, id, key, a, j, hard, kind] of NESET_ROWS[motion.slot](tick, timer == null ? tick : timer))
    on.push({ slot, id, key, a, b: kind === 'own' ? j : kind === 'off' ? { neset: j, off: [0, 200, 700] } : { neset: j }, hard });
}

// END KIND 3, THE OBJECT k (0x10ba1b4..0x10ba270, READ): its slot state 0x10ae8d0(G, k) = G+0x3c+k --
//   2 CARRIED -> his joint 0x82's position (0x10ba3d4: 0xc164c(e, 0x82, out));
//   1 AT ITS SPOT -> G+0x50+16k (0x10ba1e0..0x10ba200);
//   3 A FREE UNIT -> [G+0xb0+4k]+0x40 (0x10ba3b8: 0x10aed64(G, k) = [G + 4k + 0xb0]; a null unit leaves the end at zero) --
//     the unit 0x10aebac spawns and stores there (0x10aecd8 0x48b884 -> 0x10aece4 str [G + 4k + 0xb0]): shell57, the object
//     in flight (render/shells.js base57);
//   anything else -> the end left at (0, 0, 0) (0x10ba3e4 with sp+0xa0 as cleared at 0x10b9f98..).
// The viewer's G: k carried = the Carrying control as the play leaves it (index.html carryNow); a live shell57 of k (render/
// shells.js: state 1 its delay, G slot 1; state 2 under way, G slot 3) -> its +0x40; one that ended wrote G's spot and state 1
// (0x433180 -> 0x10ae90c; shells.js end57 -> state.spots088[k]). The fight's own spots are not a viewer input: a k with no
// shell57 end this session has no spot, and its thread stays off.
function em088ObjectPoint(k, { carry, joint, shells }){
  if (k === carry) return { point: joint(0x82), state: 2 };
  const S = shells && (shells.shells || []).find(x => x.base === 'base57' && x.obj === k && (x.state === 1 || x.state === 2));
  if (S && S.state === 2 && S.position) return { point: S.position.slice(0, 3), state: 3 };
  const spot = shells && shells.spots088 && shells.spots088[k];
  if (spot && spot.pos) return { point: spot.pos.slice(0, 3), state: 1 };
  return { point: null, why: 'object ' + k + ' at its spot G+0x50+16k: the fight writes it, and no shell57 has ended this session to write it' };
}

// THE WEB POINTS e+0xd410 / e+0xd440 (dev/em088-d410-writer.md 1, READ 0x10b5430..0x10b579c + ROM-run): written ONCE, at the
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
//     there instead, behind e+0xd408 (the test, transcribed below: lane B 2026-10-25).
function em088Webs(motion, action, anchors, on, off, tick = 0){
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
  // L2 M35, READ (lane B, 2026-10-25; 0x10b9118..0x10b92d0): over the four d450 handles, a present one 0..2 whose 0x43a388 is not 1, or a
  // present d45c whose 0x43a388 is 0 (0x43a388 is 0 on state 1: webAnchors088), with e+0xd408 set -> by the frame (0xb09a4 mode 2 at
  // 90.0 / 180.0, literals 0x10b928c / 0x10b9294): before 90 slot 19 id 1011 u 340, 149 -> d440 (end kind 4); 90..179 slot 5 id 1012
  // u 343, 149 -> joint 9, and slot 8 id 1013 u 342, joint 9 -> d440 (0x10b920c..0x10b9288, stop flag 1); from 180 slot 19 id 1018
  // u 344, 149 -> d440 (0x10b9298..). Otherwise slot 19 runs as on every other motion.
  const m35 = motion && motion.list === '2' && motion.slot === 35;
  const mixed = m35 && any450 && em088D408(action) && anchors.d450.some(A => A && A.state === 1);
  if (mixed){
    if (tick < 89) on.push({ slot: 19, id: 1011, key: 340, a: 149, b: { point: 'd440' }, hard: true });
    else if (tick < 179){
      on.push({ slot: 5, id: 1012, key: 343, a: 149, b: 9, hard: true });
      on.push({ slot: 8, id: 1013, key: 342, a: 9, b: { point: 'd440' }, hard: true });
    } else on.push({ slot: 19, id: 1018, key: 344, a: 149, b: { point: 'd440' }, hard: true });
  } else if (any450 || (m30 && (n === 0x1e || n === 0x1f || n === 0x24 || n === 0x25)))
    on.push({ slot: 19, id: 1011, key: 340, a: 149, b: { point: 'd440' }, hard: true });
}
// e+0xd408 (dev/em088-d410-writer.md 3, READ): 1 every frame of the status-7 web attacks' bodies -- (7, 0x2c) L2 M16, (7, 0x2f) L2 M3,
// (7, 0x31) / (7, 0x32) L2 M17, (7, 0x33) / (7, 0x34) / (7, 0x37) L2 M35, (7, 0x36) L2 M2 (their phase-0 setMotion: zg/tracec.py, lane B
// 2026-10-25; (7, 0x35) plays L2 M35 and writes nothing) -- cleared every frame by vt+0x1dc 0x10b386c; the thread pass reads it after
// the body has run. The viewer's form: the play's action (the shells' pick, render/shells.js act088, else CLIP_ACTIONS).
const D408_N = new Set([0x2c, 0x2f, 0x31, 0x32, 0x33, 0x34, 0x36, 0x37]);
function em088D408(action){ return !!action && action[0] === 7 && D408_N.has(action[1]); }
// THE d408 ROWS on L2 M2 / M3 / M16 / M17 (dev/em088_00-effects-spec.md 3.2, emulated with e+0xd408 0 / 1 and the d420 anchors; ends
// corrected to the point d410 by dev/em088-d410-writer.md 2), each with any d420 handle up and d408: slot 7 id 1011 u 340, 149 -> d410,
// hard, L2 M2 / M3 to frame 79, M16 to 64, M17 to 179; L2 M2 80..99 slot 5 id 1012 u 343 149 -> joint 9 and slot 8 id 1013 u 342
// joint 9 -> d410; L2 M3 80..99 and L2 M16 65..82 slot 3 id 1016 u 342 149 -> joint 5 and slot 9 id 1017 u 343 joint 5 -> d410 --
// graceful. Ticks here (tick t reaches frame t + 1).
function em088D408Rows(motion, tick, action, anchors, on){
  if (!em088D408(action) || !motion || motion.list !== '2' || !anchors || !anchors.d420.some(A => A)) return;
  const m = motion.slot;
  const to340 = { 2: 78, 3: 78, 16: 63, 17: 178 }[m];
  if (to340 != null && tick <= to340) on.push({ slot: 7, id: 1011, key: 340, a: 149, b: { point: 'd410' }, hard: true });
  if (m === 2 && tick >= 79 && tick <= 98){
    on.push({ slot: 5, id: 1012, key: 343, a: 149, b: 9, hard: false });
    on.push({ slot: 8, id: 1013, key: 342, a: 9, b: { point: 'd410' }, hard: false });
  }
  if ((m === 3 && tick >= 79 && tick <= 98) || (m === 16 && tick >= 64 && tick <= 81)){
    on.push({ slot: 3, id: 1016, key: 342, a: 149, b: 5, hard: false });
    on.push({ slot: 9, id: 1017, key: 343, a: 5, b: { point: 'd410' }, hard: false });
  }
}

// AHTAL-NESET (em087_00), HIS OWN THREAD PASS 0x10a8438 (lane B2, 2026-10-25; READ 0x10a8438..0x10a85ac and the slot loop's point kinds
// 0x10a8840..0x10a8b18): 15 slots at e+0xce10 + 0x70k, the active bytes cleared every call. Slot 0: the lift handle e+0xccec live and
// 0x4307c0(h) == 0 -- its +4 state byte 1 or 2 (0x4307c0: (b - 1) > 1 ? 1 : 0) -- -> id 1001 (vt+0x1d0 table 0x16a32c8: u 150), start
// kind 2 joint 0x82 + (0, -350, 0), end kind 3 object 0, the stop byte +0x60 = 0 (graceful). Slot 1: the handle e+0xccf0, joint 0x83 +
// (400, 0, 0) -> object 1. Start kind 2 = the joint's position (0xc164c) + the offset turned by its matrix rows (0xc15a4, 0x10a88f4..
// 0x10a898c). End kind 3 = 0x10ae8d0(G, k): 3 -> the free unit [G+0xb0+4k]+0x40, 2 -> his joint 0x82, 1 -> the spot G+0x50+16k, else
// the end left at (0, 0, 0) (0x10a8a78..0x10a8ac4 -> 0x10a8804 / 0x10a8834). The handles are his B6 lifts (0x10ac10c: shell57 mode
// 0x18 + k, render/shells.js make087ka57 on (1, 0x15) / (1, 8)), so the pass runs on Neset alone: the viewer's lift shell of k (by087,
// mode 0x18 + k) in state 1 (its delay, at its spot) or 2 (under way) is the live handle, and its point the object's -- state 1 is G's
// slot 1 (the spot it sits at), state 2 its unit's +0x40, as em088ObjectPoint maps them (I: the shells.js states as the unit's +4 byte).
// The rest of the pass (the switch on [e+0xcd28]+0xc past 0x10a8610: slots 2..13 through 0x10ad028 with action-tune vecs 0x2f..0x34)
// is NOT READ to its ids.
function lifts087(shells){
  const L = [null, null];
  for (const S of (shells && shells.shells) || [])
    if (S.base === 'base57' && S.by087 && (S.state === 1 || S.state === 2) && (S.obj === 0 || S.obj === 1) && S.modeIndex === 0x18 + S.obj)
      L[S.obj] = S;
  return L;
}
function em087ObjectPoint(k, { shells }){
  const S = lifts087(shells)[k];
  if (S && S.position) return { point: S.position.slice(0, 3), state: S.state === 2 ? 3 : 1 };
  return { point: null, why: 'object ' + k + ': no lift of it under way' };
}

export const CLASS_THREADS = {
  em087_00: {
    pel: 'em087_00u',
    slots: 15,
    off: [],
    at({ anchors }){
      const L = anchors || [null, null], on = [];
      if (L[0]) on.push({ slot: 0, id: 1001, key: 150, a: { joint: 0x82, offset: [0, -350, 0] }, b: { object: 0 }, hard: false });
      if (L[1]) on.push({ slot: 1, id: 1001, key: 150, a: { joint: 0x83, offset: [400, 0, 0] }, b: { object: 1 }, hard: false });
      return { on, off: [] };
    },
    objectPoint: em087ObjectPoint,
    // the live lift handles e+0xccec / e+0xccf0, as the shells hold them (passed through the `anchors` hook)
    anchors: shells => lifts087(shells),
  },
  em088_00: {
    pel: 'em088_00u',
    slots: 20,
    // always off in the viewer, whatever plays
    // (was: u 340 off L2 M30 / u 342 / 343 / 344 off, "e+0xd408 ... whose clips are not read" -- built 2026-10-25, lane B: em088D408Rows,
    // em088Webs's L2 M35 test)
    off: [],
    // this frame's active slots: { motion: { list, slot }, tick, carry: e+0xcb0c (0 / 1 / 2, 4 = none), pending: e+0xd3e1 (the
    // AI's pending pick; 4 = none), action: [status, n] } -> { on: [{ slot, id, key, a: joint, b: joint or { object: k },
    // hard }], off: [{ key, why }] }
    // `neset`: gid -> Ahtal-Neset's joint matrix where he is on screen (the combined list), else null; `timer`: the action's P+0x1bc
    at({ motion, tick, carry, pending, action, anchors, neset, timer }){
      const on = [], off = [], nes = [];
      // the (1, 0x21) rows come AFTER the slot rows in the pass (0x10b9944, past the object switch): they write the same slots 0..7 last
      if (motion) em088Neset(motion, action, tick, timer, neset, nes, off);
      em088Webs(motion, action, anchors, on, off, tick);
      em088D408Rows(motion, tick, action, anchors, on);
      // 0x10b78e8: the pass's object is e+0xcb0c, or e+0xd3e1 when that is 4; 4 as well -> none of u 10..15 runs (the sweep's
      // object-4 run: no slot)
      const k = carry === 0 || carry === 1 || carry === 2 ? carry : (pending === 0 || pending === 1 || pending === 2 ? pending : 4);
      if (k === 4 || !motion) return { on: on.concat(nes), off };
      let rows = motion.list === '2' && motion.slot >= 4 && motion.slot <= 46 ? EM088_L2[motion.slot] || [] : EM088_DEFAULT;
      if (motion.list === '2' && EM088_PULL[motion.slot] && action && action[0] === 1 && (action[1] | 8) === 0xd)
        rows = EM088_PULL[motion.slot].concat(rows.filter(r => r[1] !== 1003));
      for (const [slot, id, a, b, hard, ranges] of rows){
        if (!ranges.some(([lo, hi]) => tick >= lo && tick <= hi)) continue;
        if (EM088_UNRECORDED.has(EM088_KEYS[id])){
          off.push({ key: EM088_KEYS[id], slot, why: 'awaiting its recording: refuses 0xa97d0c (lifted 0xa97838) ~80 frames in' });
          continue;
        }
        on.push({ slot, id, key: EM088_KEYS[id], a, b: b === O ? { object: k } : b, hard: hard === 1 });
      }
      return { on: on.concat(nes), off };
    },
    objectPoint: em088ObjectPoint,
    // the action start's write of e+0xd410 / e+0xd440 (em088Latch); the anchors as the shells hold them (render/shells.js)
    latch: em088Latch,
    anchors: shells => webAnchors088(shells),
  },
};
