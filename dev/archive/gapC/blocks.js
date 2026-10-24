//@@ S00COMMENT
// stage. Modes 0..8 (the rank pair, (7, 0xb) / (7, 0x25): arm084's `any` rows), 1 (shell11 modes 2..4's fall: createFall084) and
// 65 / 66 (the body's record table: records084) are the files' values (gapC 2026-10-20: each re-dumped from the arc, equal).
//@@ DATA
// THE RANK PAIR, arm (7, 0xb) / (7, 0x25) (gapC 2026-10-20, READ; dev/em084-shells-spec.md 5 rows (7, 0xb) / (7, 0x25)). The arm's
// status-7 switch 0x108389c (the number byte +0x73e1, table 0x10838c4): 0xb -> 0x10851bc, 0x25 -> 0x10879a4 (control: 0x1b ->
// 0x10867a4, the (7, 0x1b) row above). NO FORM TEST in either: phase 0 blends (0xb03f8: (7, 0xb) 0x201 / 0x202 = l_2 / r_2 M1 + M2,
// weight 0x107de38(arm, 1); (7, 0x25) 0x232 / 0x233 = M50 + M51, weight 0x107de38(arm, 4)); phase 1 runs its speed windows (0xb07b4)
// and at the crossing of the BODY's tune float (0x6f618 through [arm+0xcadc]) on the arm's own clip (0xb0968 op 0: pass001) calls
// 0x107c0cc(arm, idx): (7, 0xb) tune 1 = 120 (0x10853a8..0x10853d8, idx 0), (7, 0x25) tune 8 = 108 (0x1087b38..0x1087b68, idx 1);
// the action ends at its clip's end (0xb09c8 -> vt +0x3dc). 0x107c0cc: the quest rank 0x3a8430 > 4 (`cmp r0, #4; bgt`, 0x107c0ec)
// and the kind [arm+0xcae0] (1 left, 2 right) pick the jump table (0x107c304 k1, 0x107c128 k2; G 0x107c3e8 / 0x107c220): idx 0 ->
// k1 0 / k2 3, G 5 / 7; idx 1 -> k1 2 / k2 4, G 6 / 8 (`left` / `right`, `leftG` / `rightG`). The request 0x3f883c(0x30)
// (0x107c4ac..0x107c544): id 0x16c, the mode, owner the arm, +0x10.. [0x1831a78] = 0x19176b0 (zero), +0x1c 0, +0x20.. 0x1620e60
// (zero), +0x2c 0, +0x2e 0xffff -- make00n's. Modes 0..8: the ARM's joint 12, flags 8 (bit 3: the offset turned by the arm's words
// after degY), vz 50, flight 500, no gravity; u 1 (0..4) / u 4 (5..8) flying, u 2 / u 5 at a type 0 / 2 contact, nothing of their
// own on the floor (ef 2 = (999, -1)) -- there shell01 0 (CHILD084). (7, 0x11) / (7, 0x12) also play M1 + M2 and (7, 0x26) M50 +
// M51, but those fire beams only (0x107ca4c) and nothing issues them (render/beam-spawns.js em084_00 note): the clips are
// (7, 0xb)'s / (7, 0x25)'s, as render/monster.js ROM_ARM_PAIRS '2|Motion[1]' / '2|Motion[50]' pair them (ordered left (7, 0x9a)
// / right (7, 0x68); left (7, 0xfd) / right (7, 0xcb)). NAMED, NOT MODELLED: the blends and the speed windows, as above.
SHELL_DATA.em084_00.arm084.push(
  { action: [7, 0x0b], list: '2', clip: 'Motion[1]', tune: 1, spawns: [
    { frame: 120.0, any: { shell: 'shell00', left: [0], right: [3], leftG: [5], rightG: [7] } }] },
  { action: [7, 0x25], list: '2', clip: 'Motion[50]', tune: 8, spawns: [
    { frame: 108.0, any: { shell: 'shell00', left: [2], right: [4], leftG: [6], rightG: [8] } }] },
);
// shell11 MODE 2 -- the body's (7, 0x43) (body084 below). The files' values (em084_00_11_sh002 / _ef002 / _hit002, ShellScale 1.0):
// int 0 = 20 creates, the times (k + 1) x float 3 = 150, 300, .. 3000 (params11n), int 2 = -1 -> the base point the OWNER's +0x40
// (the body's block point), sh vecs 0..19 the offsets turned by the owner's Y word (createFall084); ef 0 = u 21 (list 0), started at
// each create's point; the hit file is empty (no slot). int 4 = 0 sets byte +0x1690, which nothing in sp_11's band
// (0x1089fb0..0x108a954), base11's (0x402f80..0x403200) or base01's (0x3fa2bc..0x3fb600) reads (movw / #0x90 scan; control: the
// same scan finds +0x1690's two writes 0x108a02c / 0x108a314 and the create's +0x1680 reads 0x108a2c0 / 0x108a3f8). Modes 3 / 4
// have files but no spawner (dev/em084-shells-spec.md 7): not listed.
SHELL_DATA.em084_00.shells.shell11.modes[2] = { scale: 1.0, ef: [[0, 21]], hit: [], sh: { ints: [20, -1, -1, -1, 0], floats: [0.0, 0.0, 0.0, 150.0],
  vecs: [[0, 0, 2500], [0, 0, -2500], [2500, 0, 0], [-2500, 0, 0], [1500, 0, 1500], [1500, 0, -1500], [-1500, 0, 1500], [-1500, 0, -1500],
         [0, 0, 1500], [0, 0, -1500], [1500, 0, 0], [-1500, 0, 0], [1000, 0, 2000], [1000, 0, -2000], [-1000, 0, 2000], [-1000, 0, -2000],
         [1000, 0, 1000], [1000, 0, -1000], [-1500, 0, 1500], [-1000, 0, -1000]] } };
// shell01 0 / 1 -- sp_00's stage children (landing084 / CHILD084: 0, 2..8, 65, 66 -> 0; 1 -> 1), u 3 (list 0). The files' values
// (em084_00_01_sh000 / _sh001, ShellScale 1.5 / 0.8; hit int 0 -> record 0 (10, 60) / record 7 (10, 60)): mode 0 int 2 = 0 (its
// reader's bit 2), mode 1 no bit; both at the setup's point (the contact) and words, timer 0 (the hit slot's life).
SHELL_DATA.em084_00.shells.shell01.modes[0] = { scale: 1.5, ef: [[0, 3], [999, -1]], hit: [0], sh: { ints: [-1, -1, 0, -1, -1, -1, -1], floats: [0.0], vecs: [[0, 0, 0], [0, 0, 0]] } };
SHELL_DATA.em084_00.shells.shell01.modes[1] = { scale: 0.800000011920929, ef: [[0, 3], [999, -1]], hit: [7], sh: { ints: [-1, -1, -1, -1, -1, -1, -1], floats: [0.0], vecs: [[0, 0, 0], [0, 0, 0]] } };
// THE BODY'S OWN SHELL11, (7, 0x43) (gapC 2026-10-20, READ): the body's status-7 switch 0x1073a48 (number byte +0x73e1, table
// 0x1073a74) 0x43 -> 0x10775c0: phase 0 setMotionC L0 M63 (0xafce8(E, 0x3f, 0x11, 20.0)) and both arms (7, 0x20); every later update
// (0x107775c..) tests tune float 14 = 146 -> the beam 0x106f6a8 (render/beam-spawns.js's row: the control) and tune float 15 = 460
// (0x1077790..0x10777c0, 0xb0968 op 0) -> 0x106f74c(E, 0): 0x3fa2bc(0x40) id 0x170, mode n + 2 = 2, owner E, +0x10.. / +0x20.. the
// zero vector [0x1831a78], +0x30.. 0x1620e60 (zero), +0x3c 0xffff (0x106f74c..0x106f80c), 0x48b884. `stance` 2: the beam row of the
// same action carries it (Raven's "Stance" rule); the action has no stance test of its own.
SHELL_DATA.em084_00.body084 = [
  { action: [7, 0x43], list: '0', clip: 'Motion[63]', tune: 15, frame: 460.0, stance: 2, shell: 'shell11', mode: 2 },
];
// THE BODY'S MOTION-RECORD TABLE (gapC 2026-10-20, READ: every instruction of the walker 0x1069e78 and the spawner 0x106f354 re-read;
// dev/em084-shells-spec.md 4b agrees). [E+0xcb34] = 0x17f6420 (one writer, 0x107a964): entries { u8 status, u8 number, .., ptr }
// (8 bytes, terminator byte 0xff); the action-change hook (vt +0x204 0x1066c14, 0x10673a8..0x1067430) zeroes the six slots
// E+0xcb38..+0xcb67 and points E+0xcb30 at the entry whose bytes are the new action. Records (0x18 bytes) [motion, type, frame,
// sel, arg, flags bit 0] -- `clock` = flags bit 0; list ends at type -1. Dumped from .data (tab.py), all 13 entries.
// sel (0x106f354, table 0x106f384): 1..12 -> shell13 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20; 13 / 14 -> shell13 0 / 1; 15 /
// 16 -> shell13 21 / 22 (0x4041a8(0x40): id 0x171, +0x30 the arg, +0x34 0xffff); 17 / 18 -> shell48 0 / 1 (0x4266a0(0x18), +0x10 /
// +0x14 0); 19 / 20 -> shell00 0x41 = 65 / 0x42 = 66 (0x3f883c(0x30): id 0x16c, owner E, +0x10.. [0x1831a78] zero, +0x1c 0, +0x20..
// 0x1620e60, +0x2c 0, +0x2e 0xffff; the arg unused). Type -> layer clip (body list 2) / layer / part / .dtp A row (the break-level
// gate 0x1069fe8..0x106a030: 0x9d36c(E, part) must be BELOW byte +1 (rank <= 4) / +2 (G) of row [[E+0x75f0]+0x64][row]): 0 -> 0x246
// L2 M70 / 2 / 4 / row 3 (04 04 04 83); 1 -> 0x247 M71 / 3 / 4 / row 3; 2 -> 0x248 M72 / 4 / 3 / row 1 (03 03 03 02); 3 -> 0x249
// M73 / 5 / 2 / row 0 (02 03 03 01) (efx/agents/diablos-scratch/dtp.py em084_00, array A).
SHELL_DATA.em084_00.records084 = {
  table: [
    { action: [1, 0x0c], recs: [[0x001, 1, 40, 17, 0, 1], [0x001, 0, 100, 18, 1, 1]] },
    { action: [1, 0x0d], recs: [[0x001, 1, 40, 17, 0, 1], [0x001, 0, 100, 18, 1, 1], [0x001, 1, 190, 17, 2, 1]] },
    { action: [2, 0x06], recs: [[0x008, 1, 40, 17, 0, 1], [0x008, 0, 100, 18, 1, 1]] },
    { action: [2, 0x07], recs: [[0x004, 1, 40, 17, 0, 1], [0x004, 0, 100, 18, 1, 1], [0x004, 1, 190, 17, 2, 1]] },
    { action: [7, 0x00], recs: [[0x217, 1, 130, 1, 0, 0], [0x217, 0, 140, 2, 1, 0], [0x218, 3, 30, 5, 2, 0], [0x218, 2, 40, 6, 3, 0], [0x218, 0, 110, 2, 4, 0]] },
    { action: [7, 0x06], recs: [[0x217, 1, 10, 1, 0, 0], [0x217, 0, 50, 2, 1, 0]] },
    { action: [7, 0x07], recs: [[0x217, 1, 10, 1, 0, 0], [0x217, 0, 50, 2, 1, 0]] },
    { action: [2, 0x3a], recs: [[0x032, 1, 0, 17, 0, 1], [0x032, 0, 40, 18, 1, 1]] },
    { action: [7, 0x0a], recs: [[0x008, 0, 100, 18, 0, 1], [0x004, 2, 0, 19, 1, 1], [0x004, 2, 200, 19, 2, 1]] },
    { action: [7, 0x0d], recs: [[0x008, 0, 100, 18, 0, 1], [0x004, 3, 0, 20, 1, 1], [0x004, 3, 200, 20, 2, 1]] },
    { action: [7, 0x0e], recs: [[0x001, 2, 100, 6, 0, 1], [0x001, 2, 300, 6, 1, 1], [0x001, 2, 500, 6, 2, 1]] },
    { action: [7, 0x0f], recs: [[0x001, 3, 100, 5, 0, 1], [0x001, 3, 300, 5, 1, 1], [0x001, 3, 500, 5, 2, 1]] },
    { action: [7, 0x0c], recs: [[0x002, 1, 0, 17, 0, 1], [0x002, 0, 60, 18, 0, 1], [0x003, 1, 0, 17, 0, 1], [0x003, 0, 60, 18, 0, 1]] },
  ],
  sel: { 1: ['shell13', 8], 2: ['shell13', 9], 3: ['shell13', 10], 4: ['shell13', 11], 5: ['shell13', 12], 6: ['shell13', 13],
         7: ['shell13', 15], 8: ['shell13', 16], 9: ['shell13', 17], 10: ['shell13', 18], 11: ['shell13', 19], 12: ['shell13', 20],
         13: ['shell13', 0], 14: ['shell13', 1], 15: ['shell13', 21], 16: ['shell13', 22], 17: ['shell48', 0], 18: ['shell48', 1],
         19: ['shell00', 65], 20: ['shell00', 66] },
  parts: [4, 4, 3, 2],                       // the part each type's gate asks (0x1069f78.. jump table 0x1069f98: r0)
  limits: { 4: [4, 4], 3: [3, 3], 2: [3, 3] }, // [byte +1 (rank <= 4), byte +2 (G)] of the .dtp A row (rows 3 / 1 / 0)
  // the layer clips L2 M70..M73: 133 frames each (the viewer's body list 2); the shell at layer frame >= 58.0 (0x106a09c literal)
  layerLen: 133.0, at: 58.0,
  // the plays the viewer names on L0 M4 (pickVariantsFor): the three record actions whose records are on L0 M4 ((7, 0xa) / (7, 0xd)
  // play L0 M8 then L0 M4: 0x1075d88, both numbers one function; (2, 7)'s records make shell48, which has no runtime -- refused)
  picks: ['7:0x0a', '7:0x0d', '2:0x07'],
};
//@@ RANK
  // 0x107c0cc's rank arm (the quest rank 0x3a8430 > 4: `cmp r0, #4; bgt` at 0x107c0ec), where a row names one (`leftG` / `rightG`)
  const G = !!(ctx.own001 && ctx.own001.rank > 4);
  const modes = (G && pick[side + 'G']) || pick.modes || pick[side] || [];
//@@ FALL
// NAKARKOS's sp_11 +0x168, MODES 2..4 (0x108a508..0x108a778; READ gapC 2026-10-20): modes 2 / 3 -- the point = the base +0x1680 plus
// sh vec k turned by the Y word +0x166c (0x108a3c4..0x108a438: create11n's operations; 0x108a508..0x108a530 -> sp+0x10); mode 4
// (0x108a63c) -- sh vec k itself (0x4a2584(shell, k, -1)), added to nothing. Then, with ef +0x1664 set (the reader's ef 0: u 21), a
// requester (0x40a54) filled by 0x4a10c8(shell, &rq, vt+0x130(shell), 0, byte +0x1054, &point, -1) and started by 0x4a11e4(shell,
// ef, &rq), the requester released at once (0x40a94): a start no handle keeps (kind 'create'). Then SHELL00 MODE 1 (0x3f883c(0x30),
// 0x108a5a0..0x108a634): id 0x16c, +0x10.. the point, +0x1c 0, +0x20.. 0x1620e60 (zero), +0x2c 0, +0x2e 0xffff, the owner
// 0x4a0f00(shell) -- the body for (7, 0x43)'s -- by 0x48b884 (the init at once: make00n, his reader params084s00 -> flags 0x18, so
// init00's request arm: the position the request's +0x10, the offset (0, 7000, 0) turned by the owner's words (bit 3), gravity
// (0, -1.2, 0), flight 1000; on the stage its landing (landing084) makes shell01 1). The owner is active (0x4a0f38) in the viewer.
function createFall084(S, idx, ctx, D){
  const m = S.modeIndex;
  if (m < 2 || m > 4) return;                                // 0x108a444..0x108a45c: modes 2..4 here, 0 in create11n, others nothing
  const sh = S.mode.sh, v = idx < sh.vecs.length ? sh.vecs[idx].map(f) : [0, 0, 0];
  let P;
  if (m === 4) P = v.slice();
  else {
    const r = f(u16(S.k.words[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), B = S.k.base;
    P = [f(mla(f(v[0] * cs), v[2], sn) + B[0]), f(v[1] + B[1]), f(mls(f(v[2] * cs), v[0], sn) + B[2])];
  }
  const def = D.shells[S.shell];
  if (S.mode.ef[0]){
    const rq = rockRequest(D, S.mode, 0, P, 'create', def.lists || D.lists);
    S.events.push(rq ? { ev: 'start', param: 0, kind: 'create', start: rq } : { ev: 'refused', param: 0, kind: 'create' });
    if (rq){ if (S.effects && S.effects[0]) S.effects[0].started = true; ctx.out.started.push({ shell: S, start: rq }); }
  }
  const state = ctx.shellState, own = Object.assign({}, S.ownArm || ctx.own001, { requestPos: P.slice() });
  const C = make00n(state, D, 1, ctx.J, own, ctx, S.action, S.spawnFrame);
  S.events.push({ ev: 'create', stepped: true, shell: 'shell00', id: D.shells.shell00.id, mode: 1, position: P.slice(),
                  angles: [0, 0, 0], child: C ? C.id : null, deleted: !C });
  if (C){ if (S.arm){ C.arm = S.arm; } C.creator = S.id; state.shells.push(C); ctx.out.spawned.push(C); }
  else ctx.out.refused.push({ shell: 'shell00', mode: 1, creator: S.id, why: 'shell00 1 (sp_11 create 0x108a5a0): init00 refused (no request point)' });
}
//@@ PICK
  // Nakarkos's motion-record actions on L0 M4: one a play (SHELL_DATA.em084_00.records084.picks; records084)
  if (D.records084 && String(list) === '0' && String(clip).replace(/_(start|loop)$/, '') === 'Motion[4]') return D.records084.picks.slice();
//@@ BODY
// NAKARKOS's BODY SPAWNS (gapC 2026-10-20). body084: the body's own action code, line 4 (pass001 on the frame pair it saw, the
// previous pose's joints) -- (7, 0x43) L0 M63 f460 -> shell11 2 (SHELL_DATA.em084_00.body084).
function body084(state, D, ctx, input, out, fresh){
  if (fresh || !state.hist || !input.clip) return;
  const clip = String(input.clip).replace(/_(start|loop)$/, '');
  for (const row of D.body084){
    if (row.list !== String(input.list) || row.clip !== clip) continue;
    const st = input.beamState && input.beamState.stance;
    if (row.stance != null && st != null && st !== row.stance) continue;   // the stance its beam row is tied to (render/beam-spawns.js)
    if (!pass001(state, f(row.frame))) continue;
    const own = ctx.own001, why = missing001(own, { pos: true });          // params11n's base point: the owner's +0x40 (int 2 = -1)
    if (why){ out.refused.push({ action: row.action, shell: row.shell, mode: row.mode, why }); continue; }
    const def = D.shells[row.shell];
    const S = make001(state, D, row.shell, { id: def.id, mode: row.mode, position: [0, 0, 0], angles: [0, 0, 0], action: row.action, frame: row.frame },
                      own, state.prevJoints || ctx.J, ctx, null);
    if (S){ state.shells.push(S); out.spawned.push(S); }
  }
}
// records084: THE BODY'S MOTION-RECORD WALKER 0x1069e78 (body vt +0x2a8 0x1069b88's first call, every frame; READ gapC 2026-10-20),
// over SHELL_DATA.em084_00.records084. The play's pick (input.rock.variant, pickVariantsFor) names the action -- the entry
// 0x10673a8..0x1067430 points +0xcb30 at; a pick with no entry: nothing (0x1069e98). Each step:
//   the clock: +0xcb6c = +0xcb68; +0xcb68 += 0xb0900(E) x [E+0x1c] (vmla, 0x1069ea0..0x1069ecc) -- ctx.speed x ctx.dt; zeroed by vt
//     +0x3d8 0x106ca78 (+0xcb68 = +0xcb6c = 0), which the setMotion 0xafce8 calls first (0xafd08): the viewer's clip start (fresh).
//     A clip's own loop does not zero it (the frames since the clip was SET, not its frame);
//   loop 1, every record of the entry whose motion is the body's (0xb0950): flags bit 0 clear -> 0xb0974(E, f) on the body clip
//     (pass001); set -> prev <= f < clock (0x1069f44..0x1069f68: `ble` / `bhi`). Types 0..3 then ask the part's break level
//     (input.parts084[part], default 0 = unbroken: the ROM's 0x9d36c) against the .dtp limit (records084.limits, by rank > 4) --
//     at or above it, nothing; then a FREE slot [type] (+0xcb38 + 8 type == 0) -> 1, the record kept at +0xcb3c, and vt +0x78 =
//     0x72630 plays the layer clip 0x246 + type on layer type + 2 (start 0.0, 0.0, 1.0). Types 4 / 5: no part test, no layer;
//   loop 2, slots 0..5 (0x106a0bc..0x106a144): 2 -> freed when its layer clip ended (0x94dc04); 1 -> type & ~1 == 4: freed and the
//     shell at once; else the layer's frame [E+0x77c + 0x140 k] >= 58.0 -> 2 and the shell: 0x106f354(E, sel, arg).
// NAMED STAND-INS: the viewer does not play the additive layer clip, so its frame is counted here -- 0.0 on the record's step,
// + ctx.dt each later step (the motion update before vt +0x2a8, and one layer frame per frame at its rate: INFERRED), ended at
// records084.layerLen (0x94dc04's own test not read); a new play or a new pick is the action's start (slots and clock zeroed --
// the viewer's clip is one action's one motion). The shell00 (make00n: init00, his reader) on the previous pose's body joints
// (212 / 213), the body as owner; shell13 / shell48 sels are refused by name.
const actName084v = a => a[0] + ':0x' + a[1].toString(16).padStart(2, '0');
function records084(state, D, ctx, input, out, fresh){
  const R = D.records084, v = input.rock && input.rock.variant;
  const W = state.rec084 || (state.rec084 = { variant: undefined, clock: f(0), prev: f(0), slots: [null, null, null, null, null, null] });
  if (fresh || W.variant !== v){ W.variant = v; W.clock = f(0); W.prev = f(0); W.slots = [null, null, null, null, null, null]; }
  if (!input.clip) return;
  const entry = R.table.find(e => actName084v(e.action) === v);
  if (!entry) return;
  const clip = String(input.clip).replace(/_(start|loop)$/, ''), mid = motionIdOf(String(input.list), clip);
  for (const sl of W.slots) if (sl && sl.layerNo >= 0) sl.layer = f(sl.layer + ctx.dt);
  W.prev = W.clock; W.clock = mla(W.clock, ctx.speed, ctx.dt);
  const own = ctx.own001, parts = input.parts084 || {};
  for (const rec of entry.recs){
    const [motion, type, F, , , clock] = rec;
    if (motion !== mid) continue;
    const hit = clock ? (W.clock > F && W.prev <= F) : (!fresh && !!state.hist && pass001(state, f(F)));
    if (!hit) continue;
    if (type <= 3){
      const part = R.parts[type], lim = R.limits[part][own.rank > 4 ? 1 : 0];
      if ((parts[part] | 0) >= lim) continue;
    }
    if (W.slots[type]) continue;
    W.slots[type] = { state: 1, rec, layer: f(0), layerNo: type <= 3 ? type + 2 : -1, clipId: type <= 3 ? 0x246 + type : 0 };
  }
  for (let k = 0; k < 6; k++){
    const sl = W.slots[k];
    if (!sl) continue;
    if (sl.state === 2){ if (!(sl.layer < R.layerLen)) W.slots[k] = null; continue; }
    if ((sl.rec[1] & ~1) === 4){ W.slots[k] = null; rec084Spawn(state, D, ctx, out, entry, sl.rec); continue; }
    // `vcmpe` / `blt` (0x106a10c..0x106a11c): below 58.0 (or unordered) waits
    if (sl.layer >= R.at){ sl.state = 2; rec084Spawn(state, D, ctx, out, entry, sl.rec); }
  }
}
function rec084Spawn(state, D, ctx, out, entry, rec){
  const [motion, type, F, sel, arg] = rec, to = D.records084.sel[sel];
  if (!to) return;                                           // 0x106f364: sel outside 1..20 -> nothing
  const [name, m] = to;
  if (name !== 'shell00' || !D.shells.shell00.modes[m]){
    out.refused.push({ action: entry.action, shell: name, mode: m, sel, arg,
                       why: name === 'shell48' ? 'uShellEm084_sp_48 (base48): not in SHELL_DATA -- no runtime for his base48 (dev/em084-shells-spec.md 8)'
                                               : 'the body\'s ' + name + ' mode ' + m + ' (0x106f354 sel ' + sel + '): not in SHELL_DATA' });
    return;
  }
  const S = make00n(state, D, m, state.prevJoints || ctx.J, ctx.own001, ctx, entry.action, f(F));
  if (S){ S.record084 = { motion, type, sel, arg }; state.shells.push(S); out.spawned.push(S); }
  else out.refused.push({ action: entry.action, shell: 'shell00', mode: m, why: 'no matrix for the body\'s joint ' + D.shells.shell00.modes[m].sh.ints[0] });
}
//@@ WIRE
  if (D.body084) body084(state, D, ctx, input, out, fresh);       // his body's own shell11 ((7, 0x43) L0 M63 f460), line 4
  if (D.records084) records084(state, D, ctx, input, out, fresh); // his body's motion-record table (vt +0x2a8 0x1069e78), line 4
