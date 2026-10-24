
// ---- ALATREON (em050_00): uEm050_00's sp_00 0xef (base00: the fire / ice balls), sp_01 0xf0 (base01: the blasts, the ground
// strikes, the rain's impacts), sp_02 0xf1 (base02g: the breath beam -- render/beam-spawns.js, the beams lane's), sp_11 0xf2 (base11:
// the lines of strikes) and sp_41 0xf3 (BASE41: the held and dropped meteors) ---------------------------------------------------
// READ 2026-10-19 (dev/elder-dragon-shells-spec.md 7). Which actions he plays: em050_00_cmdtbl.emc (fb/emcvar.py) closed over the
// set-action calls (fb/chain050.py). The status-7 table 0xecbc98 (82 offsets on e+0x73e1; fb/stdisp.py) for the helpers' arguments.
// The makers (cengen11 + the timer makers read by hand -- trap 83; fb/motqx.py the clips; the setups fb/setups.py):
//   (4, 0x09 / 0x0f) phase 2 (L1 M11 / L1 M9) f6: sp_00 2.     (7, 0x02 / 0x21) L2 M6 f76: sp_00 0 / 1.
//   (7, 0x06) phase 3 (L2 M3, after the landing) f2: sp_01 2, 1000 ahead.   (7, 0x18) L2 M5 f170: sp_01 2, 200 behind.
//   (7, 0x0d / 0x40) phase 2 (L2 M9) f24 / 26 / 30: sp_41 5 / 6 / 7 and 2 / 3 / 4 (joint 3).
//   (7, 0x19) at its start (L2 M21): three sp_41 0 held 2000 above him.     (7, 0x1a) L0 M14 f164 / 224 / 284: sp_01 3 round him.
//   (7, 0x36 / 0x37) L2 M6 f74: sp_11 0 / 1.     (7, 0x38 / 0x39) L2 M7 f164: sp_11 2 / 3.     (7, 0x3f) L2 M7 f96 / f164: sp_01 5 at the
//     target.     (7, 0x20) L2 M7, from f130 every 14 frames x 35 (0xecad24 -> 0xecaad8): sp_41 1 dropped from 2000 above a point of the
//     arena (or the target).     (7, 0x35 / 0x3a..0x3e) L2 M28, from f158 every 7 frames x 10 (0xecb36c -> 0xecb128): sp_01 4 round him
//     (or sp_01 5 at the target).
//   Below them: sp_00's landing (sp_01 0 / 1), sp_11's strikes (sp_01 4).
// THE HASHES: every scatter reads e+0x73e8 (the action setter's draw): H73E8_STANDIN = 0, named. P+0x230 (the current target's
// kind byte, written with the target point by 0xcc368): TARGET_KIND050 = 0 (a hunter -- INFERRED), named.
// NOT LISTED (named): (7, 0x48..0x51) (0xec91f0's sp_01) -- no EMC stream reaches them.
const TARGET_KIND050 = 0;

// sp_00's reader 0xecf594 (READ whole): ef 0 / 1 -> +0x15c8 / +0x15cc, ef 2 -> +0x15d4, ef 3 -> +0x15d0 (the landing's types 2 / 1);
// hit 0; int 0 the joint +0x15dc; floats 0..4 -> +0x15ec (X, degrees) / +0x15f0 (Y) / +0x15f4 (vz) / +0x15f8 (vy) / +0x15fc (the flight);
// vec 0 the offset +0x1610, vec 1 the gravity +0x161c. The flags the ctor's 0. Its init 0xecf56c: base00's, then +0x15c1 = 1 (the hit
// side's)
function params050s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: 0, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(2), vy: F(3), flight: F(4),
           xLo: f(0), xHi: f(0), yLo: f(0), yHi: f(0), vec: V(0), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: V(1) };
}
READER00.uShellEm050_sp_00 = (def, mode) => params050s00(def, mode);
// sp_00's landing 0xecf6e4 (READ whole): type 0 -> ef +0x15cc (param 1), the end; type 1 -> ef +0x15d0 (PARAM 3), then 0xecf770 -- an
// sp_01 (0x3fa2bc: id 0xf0, mode [0, 0, 1][mode] (0x169ee40), +0x10 the contact, +0x30.. the GOT's zero words, +0x3c 0xffff) -- and
// the end; type 2 -> ef +0x15d4 (PARAM 2) and NO end (a tail call)
LANDING.uShellEm050_sp_00 = (S, D, hit, ctx) => {
  if (hit.type === 0){ contactStart(S, D, 1, hit.point, 'landing'); return; }
  if (hit.type === 1){
    contactStart(S, D, 3, hit.point, 'landing');
    if (ctx && ctx.create) ctx.create(S, 'shell01', { mode: [0, 0, 1][S.modeIndex] || 0, position: hit.point.slice(), angles: [0, 0, 0], h3e: 0 });
    return;
  }
  contactStart(S, D, 2, hit.point, 'landing');
  return 'keep';
};

// sp_01's reader 0xecf990 (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15d0 (the 0x20 switch's); hit 0; +0x15ec (bfc / orrne): 1 int 0,
// 0x20 int 1, 0x400 int 3, 4 int 4, 8 int 5; int 2 the joint +0x15e4; vec 0 -> +0x1608. Timer and reaches the ctor's. His made modes:
// 0 / 1 / 4 / 5 flags 0 (the setup's point), 2 / 3 0x20 (u 90 then the switch: u 91). Modes 6 / 7 (flag 1, joint 14 / 9; 7 with 0x400)
// are made by no read maker
function params050s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 1 : 0) | (I(1) !== -1 ? 0x20 : 0) | (I(3) !== -1 ? 0x400 : 0) | (I(4) !== -1 ? 4 : 0) | (I(5) !== -1 ? 8 : 0);
  return { flags, joint: I(2), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm050_sp_01: a mode its files do not carry' : (flags & 0x400) ? 'uShellEm050_sp_01: flag 0x400 (base01, not read)' : null,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: 1 } };
}
READERS01[0xecf990] = sh => params050s01(sh);

// sp_11's reader 0xecff90 (READ whole): the count +0x1658 = int 0 and the times [+0x1654][k] = float k; +0x1670.. = the owner's block
// point +0x40, +0x1680.. = its words +0x50 / +0x54 / +0x58. No base01 field (flags 0, no ef: base01's init starts nothing)
function params050s11(def, mode, got){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const n = I(0) >= 1 ? I(0) : 0, table = [];
  for (let k = 0; k < n; k++) table.push(F(k));
  if (!got.ownerPos) return { why: 'no owner position' };
  return { flags: 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0), table,
           base: got.ownerPos.slice(), words: [got.ownerX >>> 0, got.ownerY >>> 0, got.ownerZ >>> 0], efAt: { 0x15c8: null, 0x15cc: null, 0x15d0: null } };
}
READERS11[0xecff90] = (def, mode, got) => params050s11(def, mode, got);
// sp_11's +0x168 0xed0140(shell, k) (READ whole): the owner active; mode < 4 -> sp_01 MODE 4 at +0x1670 + sh vec k turned by the kept Y
// word +0x1684 (x cos + z sin, y + y, z cos - x sin), +0x30.. the kept words, +0x3c 0xffff; mode 4: none; mode > 4: vt+0x148(1)
CREATE11.uShellEm050_sp_11 = (S, idx, ctx, D) => {
  const k = S.k, m = S.modeIndex;
  if (m === 4) return;
  if (m > 4) return;                                  // (vt+0x148(1): no read maker makes a mode past 4)
  const sh = S.mode.sh, v = idx < sh.vecs.length ? sh.vecs[idx].map(f) : [0, 0, 0], B = k.base;
  const r = f(f(u16(k.words[1])) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const p = [f(B[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + B[1]), f(mls(f(v[2] * cs), v[0], sn) + B[2])];
  ctx.create(S, 'shell01', { mode: 4, position: p, angles: k.words.map(w => w >>> 0), h3e: 0 });
};

// ---- BASE41 (uShellEmBase41: ctor 0x41f210, init 0x41f410, step 0x41fbe8 -> state 1 0x41fd40 / 2 0x4200b0 / 3 0x420238, landing +0x150
// 0x41eed4, end 0x420348) -- Alatreon's meteors: held (two waits, each with its effect), then flown on a velocity and a gravity to a
// landing that may hold them there. The effect handles live in a block [+0x1634] (9 slots, the init grows it): S.handles b0..b8.
// sp_41's reader 0xed0478 (READ whole): cmn floats 0 / 1 / 2 -> +0x15c8 / +0x15cc (the waits) / +0x15d0 (the landing's +0x1548: the hit
// side's); ef 0..5 -> +0x15d4..+0x15e8, ef 6 -> +0x15f0, ef 7 -> +0x15ec, ef 8 -> +0x15f4; hits 0 / 1 -> +0x15f8 / +0x15fc; +0x1604: 1 int 0
// (held first), 2 int 1 (0x43b2b0 in flight: the ground marker, not drawn), 4 int 2 (the landing holds it); int 3 the joint +0x1600;
// floats 0..5 -> +0x1608 (X, degrees) / +0x160c (Y) / +0x1610 / +0x1614 (the launch velocity's z / y) / +0x1618 (the flight's life) /
// +0x161c (the hold's); vecs 0 / 1 / 2 -> +0x1620 (the offset) / +0x1624 (the acceleration's y / z) / +0x1628 (the landing's step)
function params041(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice(), c = def.cmn, cF = i => c && i < c.floats.length ? f(c.floats[i]) : f(0);
  return { wait1: cF(0), wait2: cF(1), f15d0: cF(2), flags: (I(0) !== -1 ? 1 : 0) | (I(1) !== -1 ? 2 : 0) | (I(2) !== -1 ? 4 : 0), joint: I(3),
           degX: F(0), degY: F(1), gz: F(2), gy: F(3), life: F(4), hold: F(5), vec: V(0), vel: V(1), land: V(2),
           ef: { 0x15d4: 0, 0x15d8: 1, 0x15dc: 2, 0x15e0: 3, 0x15e4: 4, 0x15e8: 5, 0x15f0: 6, 0x15ec: 7, 0x15f4: 8 } };
}
// one of his effect params started into a handle slot (`slot` the block's index), at `point`
function start041(S, D, param, slot, point, out){
  const rq = rockRequest(D, S.mode, param, point, 'b' + slot, listsOf(D, S));
  if (!rq) return;
  rq.slot = 'b' + slot;
  S.effects[param] && (S.effects[param].started = true);
  S.live041['b' + slot] = { param, key: rq.key };
  S.events.push({ ev: 'start', param, slot, start: rq });
  out.started.push({ shell: S, start: rq });
}
function stop041(S, slot, mode){
  const h = S.live041['b' + slot];
  if (!h) return;
  S.stops.push({ slot: 'b' + slot, mode });
  if (mode) S.atOnce041 = true;
  S.events.push({ ev: 'stop', param: h.param, key: h.key, flag: mode });
  S.live041['b' + slot] = null;
}
// base41's init 0x41f410 (READ whole): +0x1588 = setup +0x2c (the hit group); the handle block grown to 9; the reader. The WORDS: setup
// +0x20.. == the GOT's zero vector -> +0xfe8 = block +0x50 + u16(s32(0.5 + X degrees x 182.04)), +0xfec = block +0x54 + that of Y, +0xff0
// = 0; else the setup's words. The POINT: setup +0x10.. == the zero vector -> the joint's row 3 (0xc15a4; joint -1: the owner's +0x40)
// plus vec 0 turned X, then Y, then Z by the words; else the setup's point as it is. The VELOCITY +0x1010 (0, float 3, float 2) turned X,
// Y, Z; the ACCELERATION +0x1020 (0, vec 1's y, z) turned by Y (0x539224's fields: emu_fb's snapshot names them). +0x1604 bit 0 clear: state 2 (the flight), the life +0x162c = float 4, the hit, ef 0 -> b0 and ef 2
// -> b2 (at +0x40 as it stood before the point: the requester's copy); set: state 1, sub-state 0, nothing started
function init041(S, own, J, setup, D, out){
  const k = S.k, K = U16_TO_RAD;
  if (!own.facing) return 'shell41: no owner facing (input.owner.y)';
  const zeroW = setup.angles.every(w => (w >>> 0) === 0), zeroP = setup.position.every(x => x === 0);
  let A;
  if (zeroW) A = [((own.ownerX >>> 0) + u16(s32(mla(f(0.5), k.degX, DEG_TO_U16)))) >>> 0, ((own.ownerY >>> 0) + u16(s32(mla(f(0.5), k.degY, DEG_TO_U16)))) >>> 0, 0];
  else A = setup.angles.map(w => w >>> 0);
  S.angles = A;
  const pre = S.position ? S.position.slice() : setup.position.slice();
  if (!(k.flags & 1)){
    S.state = 2; S.sub = 0; S.timer = k.life;
    start041(S, D, 0, 0, pre, out);
    start041(S, D, 2, 2, pre, out);
  } else { S.state = 1; S.sub = 0; S.timer = f(0.0); }
  let P;
  if (zeroP){
    if (k.joint !== -1){ const M = J(k.joint) || J(0); if (!M) return 'shell41: no joint ' + k.joint; P = [f(M[12]), f(M[13]), f(M[14])]; }
    else { if (!own.ownerPos) return 'shell41: no owner position'; P = own.ownerPos.slice(); }
    const [vx, vy, vz] = k.vec;
    const rX = f(f(u16(A[0])) * K), rY = f(f(u16(A[1])) * K), rZ = f(f(u16(A[2])) * K);
    const sinX = sinf(rX), cosX = cosf(rX), sinY = sinf(rY), cosY = cosf(rY), sinZ = sinf(rZ), cosZ = cosf(rZ);
    const z1 = mla(f(vz * cosX), vy, sinX);
    const x2 = mla(f(vx * cosY), z1, sinY);
    const y1 = mls(f(vy * cosX), vz, sinX);
    const x3 = mls(f(x2 * cosZ), y1, sinZ);
    const y3 = mla(f(y1 * cosZ), x2, sinZ);
    const z2 = mls(f(z1 * cosY), vx, sinY);
    P = [f(P[0] + x3), f(y3 + P[1]), f(z2 + P[2])];
  } else P = setup.position.map(f);
  S.position = P; S.anchor = P.slice();
  {
    // +0x1020.. (THE ACCELERATION, stepFlight's): (0, vec 1's y, vec 1's z) turned by Y
    const rY = f(f(u16(A[1])) * K), sn = sinf(rY), cs = cosf(rY), Z0 = f(0.0), ay = k.vel[1], az = k.vel[2];
    S.gravity = [mla(f(cs * Z0), az, sn), ay, mls(f(az * cs), sn, Z0)];
  }
  {
    // +0x1010.. (THE VELOCITY): (0, float 3, float 2) turned X, then Y, then Z
    const rX = f(f(u16(A[0])) * K), sX = sinf(rX), cX = cosf(rX);
    const y1 = mls(f(k.gy * cX), k.gz, sX), z1 = mla(f(k.gz * cX), k.gy, sX), gx = f(0.0);
    const rY = f(f(u16(A[1])) * K), sY = sinf(rY), cY = cosf(rY);
    const x2 = mla(f(gx * cY), z1, sY), z2 = mls(f(z1 * cY), gx, sY);
    const rZ = f(f(u16(A[2])) * K), sZ = sinf(rZ), cZ = cosf(rZ);
    S.velocity = [mls(f(x2 * cZ), y1, sZ), mla(f(y1 * cZ), x2, sZ), z2];
  }
  S.launch = { point: P.slice(), angles: A.slice(), velocity: S.velocity.slice(), gravity: S.gravity.slice(), state: S.state, life: S.timer };
  return null;
}
function make041(st, D, m, setup, own, J, ctx, out){
  const def = D.shells.shell41, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell41 mode ' + m + ': no files' };
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell41', cls: def.cls, globalId: def.id, base: 'base41', mode, modeIndex: m,
              action: setup.action, spawnFrame: setup.frame, motion: ctx.motion, state: 1, sub: 0,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, timer: 0, moves: 0,
              launch: null, events: [], stops: [], handles: {}, live041: {}, folder: def.folder, effect: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params041(def, mode);
  S.unitScale = f(mode.scale);                          // (the parent's scale: ShellScale -- none of its starts is S.start)
  const why = init041(S, own, J, setup, D, out);
  if (why) return { why };
  S.prevPosition = S.position.slice();
  return { S };
}
// base41's end 0x420348 (vt+0x148(flag)): not ending already -> b0 / b2 / b1 / b3 stopped (0x43b058(h, flag)), the hits off, state 0xfe,
// +0x162c = [0x162493c] x 60; flag 1 deletes it
function end41(S, out, flag = 0){
  if ((S.state & 0xfe) === 0xfe) return;
  for (const b of [0, 2, 1, 3]) stop041(S, b, flag);
  S.state = 0xfe; S.timer = ENDING_FRAMES;
  out.ended.push(S);
}
// base41's +0x150 0x41eed4(shell, contact, result, type) (READ whole): FIRST the end (vt+0x148(0)); then type 0 -> ef 5 (+0x15e8) at the
// contact -> b5; type 2 -> ef 8 -> b8; type 1 with the result's halfword +8 & 0x1040 -> ef 6 (+0x15f0) -> b7; type 1 otherwise -> ef 7
// (+0x15ec) at the contact -> b6, after: flag 4 -> STATE 3 (the hold), +0x162c = float 5, +0x40 += vec 2, b0 / b2 stopped at once, ef 3
// (+0x15e0) at +0x40 -> b3, the hit side's (+0x15fc, +0x1548, slot 0 off); no flag 4 -> ef 4 (+0x15e4) at +0x40 -> b4
function landing041(S, D, hit, out){
  end41(S, out, 0);
  const k = S.k;
  if (hit.type === 0){ start041(S, D, 5, 5, hit.point, out); return; }
  if (hit.type === 2){ start041(S, D, 8, 8, hit.point, out); return; }
  if ((hit.resultH8 || 0) & 0x1040){ start041(S, D, 6, 7, hit.point, out); return; }
  if (k.flags & 4){
    S.state = 3; S.timer = k.hold;
    S.position = [f(k.land[0] + S.position[0]), f(k.land[1] + S.position[1]), f(k.land[2] + S.position[2])];
    stop041(S, 0, 1); stop041(S, 2, 1);
    start041(S, D, 3, 3, S.position, out);
  } else start041(S, D, 4, 4, S.position, out);
  start041(S, D, 7, 6, hit.point, out);
}
// the countdown every state runs on +0x162c: max(T - dt, 0) (vselge), and whether it ran out (bls)
const tick041 = (S, dt) => { const t = f(S.timer - dt); S.timer = f(0.0) >= t ? f(0.0) : t; return !(t > 0); };
// base41's step 0x41fbe8 (READ whole): the handles dropped when their units left states 1 / 2; then by state:
//   1 (0x41fd40, held): the anchor = +0x40; sub-state 0 / 1 / 2 each counts +0x162c down -- 0 at <= 0: sub 1, +0x162c = cmn float 0, ef 1
//     -> b1; 1: sub 2, cmn float 1, ef 0 -> b0; 2: STATE 2, +0x162c = float 4, ef 2 -> b2, the hit;
//   2 (0x4200b0, the flight): +0x162c out -> the end; else the anchor, 0x539224 (stepFlight), the stage query (mask 0x30) -> the landing;
//     flag 2: the ground marker 0x43b2b0 (not drawn);
//   3 (0x420238, the hold): +0x162c out, or byte +0x151e not 0xff (a hunter's hit: none here) -> ef 4 at +0x40 -> b4 and the end;
//   0xfe: +0x162c out -> deleted; while it runs, every handle gone -> deleted
function step41(S, ctx, input, D, out){
  S.events = [];
  S.moves++;
  // (the runtime keeps each slot's request in S.handles[slot] (schedule.js out.started); param -1: its own request's life)
  const alive = b => input.effectAlive ? !!input.effectAlive(S, -1, { request: S.handles[b] }) : true;
  for (const b of Object.keys(S.live041)) if (S.live041[b] && !alive(b)) S.live041[b] = null;
  if (S.state === 1){
    S.anchor = S.position.slice();
    if (!(S.timer > 0) ? (S.timer = f(0.0), true) : tick041(S, ctx.dt)){
      if (S.sub === 0){ S.sub = 1; S.timer = S.k.wait1; start041(S, D, 1, 1, S.position, out); }
      else if (S.sub === 1){ S.sub = 2; S.timer = S.k.wait2; start041(S, D, 0, 0, S.position, out); }
      else if (S.sub === 2){ S.state = 2; S.sub = 0; S.timer = S.k.life; start041(S, D, 2, 2, S.position, out); }
    }
  } else if (S.state === 2){
    if (!(S.timer > 0)){ S.timer = f(0.0); end41(S, out, 0); return; }
    if (tick041(S, ctx.dt)){ end41(S, out, 0); return; }
    S.anchor = S.position.slice();
    stepFlight(S, ctx.dt);
    const hit = collide(S, null, ctx.stage);
    if (hit){ S.events.push({ ev: 'hit', point: hit.point, type: hit.type }); landing041(S, D, hit, out); }
  } else if (S.state === 3){
    const out0 = !(S.timer > 0) ? (S.timer = f(0.0), true) : tick041(S, ctx.dt);
    if (out0){ start041(S, D, 4, 4, S.position, out); end41(S, out, 0); }
  } else if (S.state === 0xfe){
    if (!(S.timer > 0)){ S.timer = f(0.0); S.state = 0xff; return; }
    if (tick041(S, ctx.dt)){ S.state = 0xff; return; }
    if (!Object.values(S.live041).some(h => h)) S.state = 0xff;
  }
}

// the rain's points (READ on the booted executable: the static initialisers fill them):
//   0x169edd4 (0xecb128's): 6 x 10 bytes, k = (7, 0x35) 0, (7, 0x3a..0x3e) 1..5, by the count i; V050R (BSS 0x212aec0) the points, NOT turned
const T050R = [[9, 4, 10, 15, 14, 0, 11, 12, 5, 1], [2, 8, 9, 13, 0, 7, 16, 15, 2, 6], [45, 33, 23, 53, 17, 41, 37, 49, 29, 27],
               [31, 26, 47, 21, 43, 19, 51, 39, 34, 55], [18, 50, 40, 30, 42, 46, 28, 20, 54, 35], [52, 32, 56, 25, 22, 38, 48, 44, 36, 24]];
const V050R = [[0, 0], [450, 450], [450, -450], [-450, 450], [-450, -450], [550, 0], [-550, 0], [0, 550], [0, -550], [900, 900], [900, -900],
               [-900, 900], [-900, -900], [1100, 0], [-1100, 0], [0, 1100], [0, -1100], [950, 375], [950, -375], [-950, 375], [-950, -375],
               [375, 950], [375, -950], [-375, 950], [-375, -950], [1550, 0], [-1550, 0], [0, 1550], [0, -1550], [1300, 750], [1300, -750],
               [-1300, 750], [-1300, -750], [750, 1300], [-750, 1300], [750, -1300], [-750, -1300], [2200, 0], [-2200, 0], [0, 2200],
               [0, -2200], [750, 2000], [750, -2000], [-750, 2000], [-750, -2000], [1250, 1850], [1250, -1850], [-1250, 1850], [-1250, -1850],
               [1850, 1250], [1850, -1250], [-1850, 1250], [-1850, -1250], [2000, 750], [2000, -750], [-2000, 750], [-2000, -750]]
  .map(([x, z]) => [f(x), f(0), f(z)]);
//   0x169ed48 (0xecaad8's): 4 x 35 bytes by sel = h & 3, the count i; V050M (BSS 0x212aa70) the arena points (WORLD coordinates); R050M
//   (0x1592938) the scatter radius by sel
@@T050M@@

// the spawner (code 'em050'): rows { frame, shell, mode } at a frame; `scatter` the makers' own placements; `timer` rows (0xecb36c /
// 0xecad24): from `from` every `every` frames (P+0x1bc, zeroed at the action's start by 0xecad24 only -- 0xecb36c's leftover: 0, named)
// up to `count`
function spawn050(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  if (fresh){ state.t050 = { sub: 0, clock: f(0.0), n: 0, started: false }; }
  if (!state.hist) return;
  const J = state.prevJoints || ctx.J, h = H73E8_STANDIN & 0xffff;
  const refuse = (sp, why) => out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why });
  const mk01 = (sp, m, p, words = [0, 0, 0]) => {
    const S = make001(state, D, 'shell01', { id: 0xf0, mode: m, position: p, angles: words, h3e: 0, action: a.action, frame: sp.frame }, own, J, ctx, null);
    if (S){ state.shells.push(S); out.spawned.push(S); }
  };
  const mk41 = (sp, m, p) => {
    const r = make041(state, D, m, { position: p, angles: [0, 0, 0], action: a.action, frame: sp.frame }, own, J, ctx, out);
    if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); } else refuse(sp, r.why);
  };
  const around = (x, z, y = f(0.0)) => {            // block +0x40 + (x, y, z) turned by block +0x54 (x cos + z sin, z cos - x sin)
    const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), O = own.ownerPos;
    return [f(O[0] + mla(f(x * cs), z, sn)), f(O[1] + y), f(mls(f(z * cs), x, sn) + O[2])];
  };
  for (const sp of a.spawns){
    if (sp.timer){
      const T = state.t050;
      // (the call that moves sub-phase 0 on skips the sub-phase-1 body: 0xecae14 / 0xecb448)
      if (T.sub === 0){ if (pass001(state, f(sp.from))) T.sub = 1; continue; }
      if (T.sub !== 1) continue;
      if (T.clock > f(sp.every)){
        T.clock = f(0.0);
        if (!own.ownerPos || !own.facing) refuse(sp, 'no owner position / facing');
        else if (sp.kind === 'rain') rain050(sp, T.n, h);
        else drop050(sp, T.n, h);
        T.n++;
        if (T.n >= sp.count) T.sub = 2;
      }
      T.clock = f(ctx.dt + T.clock);
      continue;
    }
    // (a `start` row: the action's phase 0, the play's first step -- 0xec9af0's creates follow its setMotion)
    if (sp.start ? !fresh : !pass001(state, f(sp.frame))) continue;
    if (!own.ownerPos || !own.facing){ refuse(sp, 'no owner position / facing'); continue; }
    if (sp.shell === 'shell00'){
      const S = make00n(state, D, sp.mode, J, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: [0, 0, 0] }), ctx, a.action, sp.frame);
      if (S){ state.shells.push(S); out.spawned.push(S); } else refuse(sp, 'base00 init refused');
    } else if (sp.shell === 'shell11'){
      const S = make001(state, D, 'shell11', { id: 0xf2, mode: sp.mode, position: own.ownerPos.slice(), angles: [0, 0, 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    } else if (sp.shell === 'shell41'){
      if (sp.held){
        // 0xec9b44..: three meteors at block +0x40 + (x, 2000, z) turned by Y; x = 4 x s32(u8(hash >> 3) - 128) + 0, z = 5 x u8(hash >> 11) + 1000,
        // hash = (h x c) x 0xcccccccd's high word (c 0x12d6f3 / 0x74a04f), the third (h x 0x34bf15) unshifted
        for (const c of [0x12d6f3, 0x74a04f, 0x34bf15]){
          let hi = c === 0x34bf15 ? Math.imul(h, c) >>> 0 : Number((BigInt(Math.imul(h, c) >>> 0) * 0xcccccccdn) >> 32n);
          const lo = c === 0x34bf15 ? (hi & 0xff) : ((hi >>> 3) & 0xff), hiB = c === 0x34bf15 ? ((hi >>> 8) & 0xff) : ((hi >>> 11) & 0xff);
          const sx = f(f(((lo + 0xffffff80) | 0)) * f(4.0)), x = f(f(0.0) + sx), z = mla(f(1000.0), f(hiB), f(5.0));
          mk41(sp, 0, around(x, z, f(2000.0)));
        }
      } else mk41(sp, sp.mode, [0, 0, 0]);
    } else if (sp.shell === 'shell01'){
      if (sp.at === 'target'){
        if (!own.target){ refuse(sp, 'no target (input.rock.target)'); continue; }
        mk01(sp, sp.mode, own.target.slice());
      } else if (sp.at === 'fan'){
        // 0xec7870 / 0xec7f14: lat = 8 x (u8(h) - 128), fwd = base + sgn x 5 x (h >> 8), turned by Y
        const lat = f(f(f(h & 0xff) + f(-128.0)) * f(8.0)), fwd = mla(sp.fwd, f(h >> 8), sp.sgn);
        const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), O = own.ownerPos;
        mk01(sp, sp.mode, [f(O[0] + mla(f(sn * fwd), lat, cs)), f(O[1] + f(0.0)), f(mls(f(cs * fwd), sn, lat) + O[2])]);
      } else if (sp.at === 'six'){
        // 0xec9eb8: the six points, picks a / b / c from h (each one not taken before)
        const T6 = [[800, 0, 800], [-800, 0, 800], [1200, 0, 0], [-1200, 0, 0], [800, 0, -800], [-800, 0, -800]].map(v => v.map(f));
        let idx;
        if (sp.pick === 0){ idx = h % 6; state.t050.a = idx; }
        else if (sp.pick === 1){ let b = (h >>> 4) % 5; if (!(b < state.t050.a)) b++; state.t050.b = b; idx = b; }
        else {
          const A0 = state.t050.a, B0 = state.t050.b;
          let c = (h >>> 8) & 3, lo = A0, hi2 = B0;
          if (!(A0 < B0)){ lo = B0; hi2 = A0; }
          if (!(c < lo)) c++;
          if (!(c < hi2)) c++;
          idx = c;
        }
        const v = T6[idx];
        const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), O = own.ownerPos;
        mk01(sp, sp.mode, [f(O[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + O[1]), f(mls(f(v[2] * cs), v[0], sn) + O[2])]);
      } else mk01(sp, sp.mode, own.ownerPos.slice());
    }
  }
  // 0xecb128(e, k, i, h): k >= 2, the target a hunter (P+0x230 <= 2) and (h + i) % 10 == 0 -> sp_01 5 at the target; else sp_01 4 at block
  // +0x40 + V050R[T050R[k][i]] (not turned)
  function rain050(sp, i, h){
    if (sp.k >= 2 && TARGET_KIND050 <= 2 && ((h + i) % 10) === 0){
      if (!own.target){ refuse(sp, 'no target (input.rock.target)'); return; }
      mk01(sp, 5, own.target.slice());
      return;
    }
    const v = V050R[T050R[sp.k][i]], O = own.ownerPos;
    mk01(sp, 4, [f(v[0] + O[0]), f(v[1] + O[1]), f(v[2] + O[2])]);
  }
  // 0xecaad8(e, sel = h & 3, i, h): the target a hunter and (sel == 0 ? (i & 3) == 0 : (i & 7) == ((h x 0x4148654) & 4)) -> the target; else
  // V050M[T050M[sel][i]] scattered by 0xc1420 (radius R050M[sel] x u8(hash) / 255 at the angle hash & 0xff00); then y + 2000; sp_41 1
  function drop050(sp, i, h){
    const sel = h & 3;
    let p;
    const hit = TARGET_KIND050 <= 2 && (sel === 0 ? (i & 3) === 0 : (i & 7) === (Math.imul(h, 0x4148654) & 4));
    if (hit){
      if (!own.target){ refuse(sp, 'no target (input.rock.target)'); return; }
      p = own.target.slice();
    } else {
      p = V050M[T050M[sel][i]].slice();
      // ANCHORED TO HIM (Raven's choice for Lao's rubble, the same stand-in, 2026-10-19): with input.anchor050 (index.html shellExtra) each
      // arena point's x / z plus his unit's, the heights, the spread, the timing and the target cadence the ROM's -- the ROM check runs
      // the arena's WORLD coordinates as they are
      if (input.anchor050) p = [f(p[0] + own.ownerPos[0]), p[1], f(p[2] + own.ownerPos[2])];
      const j = i & 3;
      let hs;
      if (j === 3) hs = Math.imul(h, 0x584d29) & 0xffff;
      else if (j === 2) hs = Math.imul(h, 0x34bf15) & 0xffff;
      else hs = Number(((BigInt(Math.imul(h, j === 1 ? 0x74a04c : 0x12d6f3) >>> 0) * 0xcccccccdn) >> 35n) & 0xffffn);
      const rad = f(f(f(hs & 0xff) / f(255.0)) * R050M[sel]);
      const ang = f(f(hs & 0xff00) * U16_TO_RAD), sn = sinf(ang), cs = cosf(ang);
      p = [f(p[0] + mla(f(cs * f(0.0)), sn, rad)), p[1], f(mls(f(cs * rad), sn, f(0.0)) + p[2])];
    }
    p[1] = f(p[1] + f(2000.0));
    mk41(sp, 1, p);
  }
}
const act050 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em050', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
SHELL_DATA.em050_00 = {
  name: 'Alatreon',
  lists: { 0: { list: 'u', pel: 'em050_00u' } },
  shells: {
@@SHELLS@@
  },
  actions: [
    act050(4, 0x09, '1', 'Motion[11]', [{ frame: 6, shell: 'shell00', mode: 2 }]),
    act050(4, 0x0f, '1', 'Motion[9]', [{ frame: 6, shell: 'shell00', mode: 2 }]),
    act050(7, 0x02, '2', 'Motion[6]', [{ frame: 76, shell: 'shell00', mode: 0 }]),
    act050(7, 0x21, '2', 'Motion[6]', [{ frame: 76, shell: 'shell00', mode: 1 }]),
    act050(7, 0x36, '2', 'Motion[6]', [{ frame: 74, shell: 'shell11', mode: 0 }]),
    act050(7, 0x37, '2', 'Motion[6]', [{ frame: 74, shell: 'shell11', mode: 1 }]),
    act050(7, 0x06, '2', 'Motion[3]', [{ frame: 2, shell: 'shell01', mode: 2, at: 'fan', fwd: f(1000.0), sgn: f(5.0) }]),
    act050(7, 0x18, '2', 'Motion[5]', [{ frame: 170, shell: 'shell01', mode: 2, at: 'fan', fwd: f(-200.0), sgn: f(-5.0) }]),
    act050(7, 0x0d, '2', 'Motion[9]', [{ frame: 24, shell: 'shell41', mode: 5 }, { frame: 26, shell: 'shell41', mode: 6 }, { frame: 30, shell: 'shell41', mode: 7 }]),
    act050(7, 0x40, '2', 'Motion[9]', [{ frame: 24, shell: 'shell41', mode: 2 }, { frame: 26, shell: 'shell41', mode: 3 }, { frame: 30, shell: 'shell41', mode: 4 }]),
    act050(7, 0x19, '2', 'Motion[21]', [{ start: true, shell: 'shell41', mode: 0, held: true }]),
    act050(7, 0x1a, '0', 'Motion[14]', [{ frame: 164, shell: 'shell01', mode: 3, at: 'six', pick: 0 }, { frame: 224, shell: 'shell01', mode: 3, at: 'six', pick: 1 },
                                        { frame: 284, shell: 'shell01', mode: 3, at: 'six', pick: 2 }]),
    act050(7, 0x38, '2', 'Motion[7]', [{ frame: 164, shell: 'shell11', mode: 2 }]),
    act050(7, 0x39, '2', 'Motion[7]', [{ frame: 164, shell: 'shell11', mode: 3 }]),
    act050(7, 0x3f, '2', 'Motion[7]', [{ frame: 96, shell: 'shell01', mode: 5, at: 'target' }, { frame: 164, shell: 'shell01', mode: 5, at: 'target' }]),
    act050(7, 0x20, '2', 'Motion[7]', [{ timer: true, kind: 'drop', from: 130, every: 14, count: 35, shell: 'shell41', mode: 1 }]),
    ...[0x35, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e].map((n, k) => act050(7, n, '2', 'Motion[28]', [{ timer: true, kind: 'rain', k, from: 158, every: 7, count: 10, shell: 'shell01', mode: 4 }])),
  ],
};
