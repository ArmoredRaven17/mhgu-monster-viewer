// ---- CHAMELEOS (em025_00): uEm025_00's sp_00 0xb5 (base00, the poison gobs), sp_01 0xb6 (base01: the footfalls, the gobs' hit), sp_13
// 0xb7 (base13, the spat poison) and sp_39 0xb8 (base39, the poison cloud each landing leaves) ------------------------------------------
// READ 2026-10-18 (dev/elder-dragon-shells-spec.md 5). His class block [e+0xcac0] is P+0x60 (the ctor 0xe0ffec). Which actions he plays:
// em025_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain025.py). The makers (cengen11; fb/motqx.py the clips):
//   (7, 0x08 / 0x24) phase 2, L2 M15 f2: sp_00 1 (joint -1: the owner's point, its words);
//   (7, 0x1f) L2 M45 f70: sp_00 0 (joint 3);
//   (7, 0x0d / 0x16 / 0x17) L2 M27 f64: sp_13 0; (7, 0x29) phase 2, L2 M27 f64: sp_13 3; (7, 0x1e) L2 M43 f64: sp_13 2;
//   (7, 0x18) L2 M36 (0xe0afb8): phase 0 takes P+0x30 -- the target, stored by vt+0x204 0xdff4f0 at (7, 0x17)'s start (n - 0xe in
//     0x2000200: 0x17 / 0x27), the action that hands to (7, 0x18) -- puts it 500 to the side the target's bearing is on (P+0x1a2 1 left,
//     L2 M38 else M37 blended into M36) and 500 ahead (by e+0x73e8 & 0x64 > 0x13: -500; H73E8_STANDIN), and keeps the bearing to it
//     less the facing, folded and at most 0x2aab, in ctl+0x1c; f44: ctl+0x1c negated on the left, sp_13 1 (its Y word + ctl+0x1c).
//   The class's vt+0x208 0xe00344 (every frame, by the motion id, fb/probe025.py): sp_01 footfalls -- L2 M6 f84, L2 M8 f64 / 160 / 256 /
//     354 mode 0 (joint 142); L1 M2 f64, L1 M7 f22, L1 M8 f32 mode 2 (the owner's ground) -- mode 1 when ctl+0x13 == 2 and visible,
//     none when ctl+0x13 == 2 and hidden (ctl+0xc); L1 M9 f36, L1 M10 f40 mode 1 (none hidden). ctl+0xc (the invisibility) and ctl+0x13
//     (written 1 / 2 by vt+0x370(e, 2) at 0xe03cdc) are not held: 0, visible.
// NOT LISTED (named): (7, 0x15 / 0x20 / 0x27 / 0x28) -- no EMC stream or set-action call issues them; sp_13 mode 4's target, ctl+0x60.
function params025s00(def, mode){                  // sp_00's reader 0xe0eee0 (READ whole)
  // ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; int 0 the joint +0x15dc; &vec 0 the offset +0x1610; vec 1's z / y -> vz +0x15f4 / vy
  // +0x15f8; &vec 2 the gravity +0x161c. The flags and the flight +0x15fc the ctor's 0 (0x3f8a74 clears +0x15ec..+0x1610): it lives while
  // its hit slot does (flightTimer's base00 arm)
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const v1 = V(1);
  return { joint: I(0), flags: 0, degX: f(0), xDeg: f(0), degY: f(0), yDeg: f(0), vz: v1[2], vy: v1[1], flight: f(0.0),
           xLo: f(0), xHi: f(0), yLo: f(0), yHi: f(0), vec: V(0), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: V(2) };
}
READER00.uShellEm025_sp_00 = (def, mode) => params025s00(def, mode);
// sp_00's landing 0xe0efdc (READ whole; state 1): type 0 -> ef +0x15cc, 2 -> +0x15d4; 1 -> +0x15d0 after 0x43ac04 (the camera, the
// ctor's -1) and, the owner active, sp_01 4 (a hit volume) at the contact, the shell's words, +0x3c its +0x13dc; then every type, the
// owner active, the cloud: modes 0 / 3 -> 0xe0dad8(e, shell, 0, point), 1 -> (.., 1, ..); 0x3f8970 at the contact; vt+0x148(0)
function landing025s00(S, D, hit, ctx){
  const param = [1, 2, 3][hit.type];
  if (hit.type === 1 && ctx && ctx.create) ctx.create(S, 'shell01', { mode: 4, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  const m = S.modeIndex, sel = m === 0 || m === 3 ? 0 : m === 1 ? 1 : null;
  if (sel != null && ctx && ctx.shellState) cloud025(ctx.shellState, D, S, sel, hit.point, ctx);
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
}
LANDING.uShellEm025_sp_00 = (S, D, hit, ctx) => landing025s00(S, D, hit, ctx);
// sp_01's reader 0xe0f2dc (READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15d8; +0x15ec (bfc / orrne): 1 int 0, 0x80 int 2, 0x800 int 3, 4
// int 4, 8 int 5; int 1 the joint +0x15e4. The timer the ctor's 0
function params025s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(0) !== -1 ? 1 : 0) | (I(2) !== -1 ? 0x80 : 0) | (I(3) !== -1 ? 0x800 : 0) | (I(4) !== -1 ? 4 : 0) | (I(5) !== -1 ? 8 : 0);
  return { flags, joint: I(1), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm025_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xe0f2dc] = sh => params025s01(sh);

// sp_13's reader 0xe0f510 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0; int 0 the joint +0x15e4; +0x15e0 (bfc / orrne): 2 int 1, 8 int
// 2, 0x10 int 3; floats 0 speed +0x15ec, 1 per unit +0x160c, 2 gravity +0x15f4, 3 near +0x15fc, 4 far +0x1600, 5 life +0x15f8; &vec 0 ->
// both points +0x161c / +0x1620; +0x15c1 = +0x15c3 = 1 (the stage query after a hunter hit: not visual)
function params025s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: (I(1) !== -1 ? 2 : 0) | (I(2) !== -1 ? 8 : 0) | (I(3) !== -1 ? 0x10 : 0),
           speed0: F(0), speedPer: F(1), gravity: F(2), near: F(3), far: F(4), life: F(5), y1614: f(0.0), f15f0: f(0.0),
           limitA: f(0.0), limitB: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f) };
}
// base13's init 0x4044d8 on his flags 0x1a (READ, rom-map base13 rows): the joint's row 3 (0xc15a4, joint 3); the two points (both
// vec 0) at 0.5 turned by the owner's words (flag 2: 0x43ae70), times the size (flag 8), added; the thrown point (0x405500: the distance
// to the target clamped [near, far], along the owner's facing as it is (0x10), the height the target's); the Y word: vt+0x16c 0xe0f7f0
// -- mode 1: the bearing to that point + ctl+0x1c, else base13's 0x405a88; the launch, its velocity by that word; the pitch ratio's
// second pair moves +0x40 by nothing (both points vec 0); ef 0 at +0x40; state 2. vt+0x170 0xe0f7b0: mode 4's target is ctl+0x60 (no
// action read makes mode 4: refused by name), the rest the owner's target block +0x1d0
function init025s13(S, J, own, c1c){
  const k = S.k;
  S.centre = ZERO3.slice();                                      // +0x1650 = setup +0x20 (the GOT zero vector)
  S.y1614 = k.y1614;
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  const M = jointMatrix(J, k.joint);
  if (!M || !own.target) return false;
  const sz = size001(own);
  const pair = r => turnByWords([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)), [own.ownerX, own.ownerY, own.ownerZ]).map(x => f(x * sz));
  const m1 = pair(f(0.5));
  let pos = [f(m1[0] + f(M[12])), f(m1[1] + f(M[13])), f(m1[2] + f(M[14]))];
  S.position = pos;
  const T = thrown13(S, k, own);
  const a = S.modeIndex === 1 ? u16((s32(mla(f(0.5), atan2f(f(T[0] - pos[0]), f(T[2] - pos[2])), RAD_TO_U16)) + (c1c | 0)) | 0)
          : wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));
  const L = launch13(S, k, own);
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  S.velocity = [f(L.velocity[2] * sn), L.velocity[1], f(L.velocity[2] * cs)];
  S.gravity = L.acceleration.slice();
  const h = sqrtf(mla(f(L.velocity[2] * L.velocity[2]), L.velocity[0], L.velocity[0]));
  const w = u16(0x10000 - u16(s32(mla(0.5, atan2f(f(-L.velocity[1]), h), RAD_TO_U16))));
  const ratio = w > 0x8000 ? f(1.0) : w > 0x2000 ? f(0.0) : mla(f(1.0), f(w), f(-0.0001220703125));
  const m2 = pair(ratio);
  pos = [0, 1, 2].map(i => f(m2[i] + f(pos[i] - m1[i])));
  S.position = pos;
  S.anchor = pos.slice();
  S.aim = a;
  S.launch = { point: pos.slice(), thrown: T.slice(), aim: a, dist: L.dist, speed: L.speed, t: L.t, ratio,
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), life: S.lifetime, angles: [0, 0, 0] };
  S.timer = f(0.0);
  return true;
}
function make025s13(state, D, m, J, own, ctx, action, frame, c1c){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell13 mode ' + m + ': no files' };
  if (m === 4) return { why: 'shell13 mode 4: its target is ctl+0x60 (vt+0x170 0xe0f7b0), written by no action read' };
  if (!own.target) return { why: 'no target (input.rock.target)' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params025s13(def, mode);
  if (!init025s13(S, J, own, c1c)) return { why: 'shell13 mode ' + m + ': no joint ' + S.k.joint };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// sp_13's landing 0xe0f6fc (READ whole; state 2 only): type 0 -> ef +0x15cc, 1 -> +0x15d0, each with the cloud (the owner active:
// 0xe0dad8(e, shell, 0, point)), 0x4042bc at the contact and vt+0x148(0); type 2 -> ef +0x15d4 at the contact and NO end
LANDING13.uShellEm025_sp_13 = (S, D, ctx, out) => {
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit) return;
  const param = [1, 2, 3][hit.type];
  if (hit.type !== 2 && ctx.shellState) cloud025(ctx.shellState, D, S, 0, hit.point, ctx);
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
  return hit.type === 2 ? 'keep' : undefined;
};

// ---- BASE39 (uShellEmBase39: ctor 0x41d514.., init 0x41d780, step 0x41d988, move 0x41da60, end 0x41de84) -- the poison cloud ------------
// sp_39's reader 0xe0f9a8 (READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15cc; int 0 n -> +0x15d0 (three arrays of n: 2n floats from
// ShellCmnParam 0.., 2n from 6.., n vecs -- the cloud's hit capsules, not visual), int 1 -> +0x15d4; floats 0 the life +0x15d8, 1 +0x15dc
// (the hit's re-arm); &vec 0 -> +0x15f8 (the offset)
function params039(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { n: I(0), i15d4: I(1), life: F(0), rearm: F(1), vec: (sh.vecs[0] || ZERO3).map(f) };
}
// base39's init 0x41d780 (READ whole): the owner / setup tests; +0x1588 = setup +0x30 (the hit group); the reader; state 1; the life
// +0x15fc = +0x15d8; +0x15d4 == 0 -> +0x160c = 1 (the hit side); its rank +0x160d = setup +0x32; +0x40 = setup +0x20 + vec 0 turned by the
// OWNER's Y word (block +0x54); the words (0, the creator's +0xfec -- setup +0x10 the creating shell, 0 without one --, 0); ef 0 at +0x40
// -> +0x1608
function init039(S, own, setup){
  const k = S.k;
  if (!own.facing) return false;
  const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), v = k.vec, P = setup.position;
  S.position = [f(P[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])];
  S.anchor = S.position.slice();
  S.angles = [0, setup.creator ? (setup.creator.angles[1] >>> 0) : 0, 0];
  S.velocity = [0, 0, 0]; S.gravity = [0, 0, 0];
  S.lifetime = k.life;                                            // +0x15fc
  S.rank39 = setup.rank & 0xff;                                   // +0x160d
  S.launch = { point: S.position.slice(), angles: S.angles.slice(), life: S.lifetime, rank: S.rank39 };
  return true;
}
// base39's state-1 move 0x41da60 (READ whole): the owner gone -> the end; the life +0x15d8 > 0 -> +0x15fc down by dt (at 0: the end);
// the anchor; sub-state +5 == 1 (blown away by a hit: 0x41dc50, a hunter's -- none in the viewer) the drift; the hit side (+0x13ae /
// +0x160c / +0x1600 / +0x15dc, a random +0x13dc): not visual
function move039(S, ctx){
  const k = S.k;
  if (k.life > 0){
    const T = S.lifetime;
    if (!(T > 0)){ S.lifetime = f(0.0); return 'end'; }
    const t = f(T - ctx.dt);
    S.lifetime = f(0.0) >= t ? f(0.0) : t;
    if (!(t > 0)) return 'end';
  }
  S.anchor = S.position.slice();
  return 'keep';
}
// base39's end 0x41de84 (vt+0x148(0)): not ending already -> ef 0 stopped (0x43b058(h, 0)), vt+0x150 (sp_39's 0xe0fe78: the ring's
// bookkeeping, end039 below), state 0xfe, +0x15fc = [0x162493c] x 60 (the ending's wait)
function end39(S, ctx){
  if (!S || (S.state & 0xfe) === 0xfe) return;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
  end039(S, ctx);
  S.state = 0xfe; S.ending = ENDING_FRAMES;
  if (ctx && ctx.out) ctx.out.ended.push(S);
}
// sp_39's +0x150 0xe0fe78 (READ whole): the owner's count ctl+0x95 - 1; the load ctl+0x94 - (mode 0 ? 5 : 10), at least 0 (s8); then
// 0xe0da34(e, its rank): every live slot's rank +0x160d - 1, and the slot whose rank was this one's emptied
function end039(S, ctx){
  const R = ctx.shellState && ctx.shellState.ring025;
  if (!R) return;
  R.b95 = (R.b95 - 1) & 0xff;
  let b = (R.b94 - (S.modeIndex === 0 ? 5 : 10)) & 0xff;
  if (((b << 24) >> 24) <= 0) b = 0;
  R.b94 = b;
  const mine = S.rank39;
  for (let i = 0; i < 3; i++){
    const T = R.slots[i];
    if (!T) continue;
    const was = T.rank39;
    T.rank39 = (was - 1) & 0xff;
    if (was === mine) R.slots[i] = null;
  }
}
// base39's step 0x41d988 (READ whole): the handle +0x1608 dropped when its unit left states 1 / 2; state 1 the move (vt+0x154; its end
// vt+0x148(0)); 0xfe -- the wait +0x15fc down by dt: at 0 deleted; while it runs, deleted once the handle is gone
function step39(S, ctx, input, D, out){
  S.events = [];
  S.place = null;
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.state === 1){
    S.moves++;
    if (move039(S, ctx) === 'end') end39(S, ctx);
  } else if (S.state === 0xfe){
    const T = S.ending;
    if (!(T > 0)){ S.state = 0xff; return; }
    const t = f(T - ctx.dt);
    S.ending = f(0.0) >= t ? f(0.0) : t;
    if (!(t > 0) || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}
// 0xe0dad8(e, shell, sel, point) (READ whole): THE CLOUDS' RING at ctl+0 / +4 / +8, the count ctl+0x95, the load ctl+0x94 (s8; + 5 for sel
// 0, + 10 for sel 1 -- first). Full (count >= 3): the cloud of rank 0 in slot 0 / 1 ended (vt+0x148(0)) and its slot taken; else slot 2's
// when it is rank 0, else slot 0 (its old pointer overwritten, that cloud left running). Not full: the load >= 30 ends the rank-0 cloud
// (slot 0, 1, 2 in turn) first; then the first empty slot (none: slot 0). The setup: id 0xb8, mode sel, +0x10 the shell, +0x20.. the point,
// +0x30 (sel 1 ? ctl+0x92 : 0xffff, the hit group), +0x32 the count (its rank); then the count + 1
function cloud025(st, D0, creator, sel, point, ctx){
  const D = st.data;
  const R = st.ring025 || (st.ring025 = { slots: [null, null, null], b94: 0, b95: 0 });
  R.b94 = (R.b94 + (sel === 0 ? 5 : 10)) & 0xff;
  const r0 = i => R.slots[i] && R.slots[i].rank39 === 0;
  const endSlot = i => { const T = R.slots[i]; end39(T, ctx); R.slots[i] = null; };
  let sl = 0;
  if (R.b95 >= 3){
    if (r0(0)){ endSlot(0); sl = 0; }
    else if (r0(1)){ endSlot(1); sl = 1; }
    else if (r0(2)){ endSlot(2); sl = 2; }
    else sl = 0;
  } else {
    if (((R.b94 << 24) >> 24) >= 30){
      if (r0(0)) endSlot(0); else if (r0(1)) endSlot(1); else if (r0(2)) endSlot(2);
    }
    sl = !R.slots[0] ? 0 : !R.slots[1] ? 1 : !R.slots[2] ? 2 : 0;
  }
  const def = D.shells.shell39, mode = def.modes[sel], lists = def.lists || D.lists;
  if (!mode){ ctx.out.refused.push({ shell: 'shell39', mode: sel, why: 'shell39 mode ' + sel + ': no files' }); return; }
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell39', cls: def.cls, globalId: def.id, base: 'base39', mode, modeIndex: sel,
              action: creator ? creator.action : null, spawnFrame: creator ? creator.spawnFrame : null, motion: ctx.motion, state: 1,
              creator: creator ? creator.id : null, createdAtMove: creator ? creator.moves : null,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, lifetime: 0, timer: 0,
              moves: 0, launch: null, events: [], folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params039(def, mode);
  if (!init039(S, ctx.own001, { position: point.slice(), creator, rank: R.b95 })){
    ctx.out.refused.push({ shell: 'shell39', mode: sel, why: 'shell39: no owner facing (input.owner.y)' }); return;
  }
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  R.slots[sl] = S;
  R.b95 = (R.b95 + 1) & 0xff;
  st.shells.push(S); ctx.out.spawned.push(S);
}

// the spawner (code 'em025'): rows { frame, shell, mode } (shell13 rows `aim18`: (7, 0x18)'s ctl+0x1c); `timer`: vt+0x208's footfall rows
// (sp_01 at the owner's point and words; mode 0 joint 142, 2 the owner's ground)
function spawn025(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  if (fresh){
    state.side025 = 0;
    if (a.aim18){
      // (7, 0x18) phase 0 (0xe0affc..0xe0b490): P+0x30 = the target ((7, 0x17)'s vt+0x204); the side from the bearing of P+0x30 from P+0x30
      // (atan2(0, 0) = 0) less the facing, bit 15; P+0x30 += (+-500, 0, 500) turned by the facing; ctl+0x1c = the bearing to it less the
      // facing, folded, at most 0x2aab
      state.c1c025 = null;
      if (!own.target || !own.ownerPos || !own.facing) return;
      const T = own.target, P30 = T.slice();
      const w = s32(mla(f(0.5), atan2f(f(T[0] - P30[0]), f(T[2] - P30[2])), RAD_TO_U16));
      const left = ((w - (own.ownerY >>> 0)) & 0x8000) !== 0;
      const sx = left ? f(-500.0) : f(500.0), tz = ((H73E8_STANDIN & 0x64) > 0x13) ? f(-500.0) : f(500.0);
      const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
      P30[0] = f(mla(f(sx * cs), tz, sn) + P30[0]); P30[1] = f(P30[1] + f(0.0)); P30[2] = f(mls(f(tz * cs), sx, sn) + P30[2]);
      const w2 = s32(mla(f(0.5), atan2f(f(P30[0] - own.ownerPos[0]), f(P30[2] - own.ownerPos[2])), RAD_TO_U16));
      let d = u16(w2 - (own.ownerY >>> 0));
      if (d >>> 15) d = 0x10000 - d;
      if (d >= 0x2aab) d = 0x2aab;
      state.c1c025 = d; state.side025 = left ? 1 : 0;
    }
    return;
  }
  if (!state.hist || !state.prevJoints) return;
  const J = state.prevJoints;
  for (const sp of a.spawns){
    const F = f(sp.frame);
    if (!pass001(state, F)) continue;
    if (sp.shell === 'shell00'){
      const S = make00n(state, D, sp.mode, J, own, ctx, a.action, F);
      if (S){ state.shells.push(S); out.spawned.push(S); }
      else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'shell00: its init deleted it (no joint, owner position or facing)' });
    } else if (sp.shell === 'shell13'){
      let c1c = 0;
      if (a.aim18){
        if (state.c1c025 == null){ out.refused.push({ action: a.action, shell: 'shell13', mode: sp.mode, why: 'no target / owner (the (7, 0x18) aim)' }); continue; }
        if (state.side025 === 1) state.c1c025 = (0x10000 - state.c1c025) | 0;   // 0xe0b18c..0xe0b19c
        c1c = state.c1c025;
      }
      const r = make025s13(state, D, sp.mode, J, own, ctx, a.action, F, c1c);
      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); } else out.refused.push({ action: a.action, shell: 'shell13', mode: sp.mode, why: r.why });
    } else if (sp.shell === 'shell01'){
      if (!own.ownerPos || !own.facing){ out.refused.push({ action: a.action, shell: 'shell01', mode: sp.mode, why: 'no owner position / facing' }); continue; }
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: sp.mode, position: own.ownerPos.slice(),
        angles: [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0], action: a.action, frame: F }, own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    }
  }
}
const act025 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em025', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
// a vt+0x208 row: no action -- the clip itself (pick 'always': one row a clip)
const timer025 = (list, clip, frames, mode) => ({ action: [0, 0], code: 'em025', list, clip, pick: 'always', timer: true,
  spawns: frames.map(frame => ({ frame, shell: 'shell01', mode })) });
SHELL_DATA.em025_00 = {
  name: 'Chameleos',
  lists: { 0: { list: 'u', pel: 'em025_00u' }, 1: { list: 'c', pel: 'em025_00c' } },
  shells: {
    shell00: { id: 0xb5, cls: 'uShellEm025_sp_00', base: 'base00', folder: 'shell\\em\\em025_00_shell00',
      lists: { 0: { list: 'u', pel: 'em025_00u' } },
      modes: {
        0: m057(1.0, [[0, 0], [0, 2], [0, 1], [0, 2]], [0], [3], [], [[0.0, -80.0, 140.0], [0.0, 0.0, 0.0], [0.0, -0.75, 0.0]]),
        1: m057(1.0, [[0, 0], [0, 11], [0, -1], [0, 11]], [0], [-1], [], [[-30.0, -380.0, 500.0], [0.0, 0.0, 0.0], [0.0, -1.25, 0.0]]),
        3: m057(1.0, [[0, 0], [0, 2], [0, 1], [0, 2]], [0], [3], [], [[0.0, -80.0, 140.0], [0.0, 0.0, 12.0], [0.0, -0.75, 0.0]]) },
      hitdata: [[10, 99]] },
    // (its .shl's one EffectList is em025_00c)
    shell01: { id: 0xb6, cls: 'uShellEm025_sp_01', base: 'base01', reader: 0xe0f2dc, folder: 'shell\\em\\em025_00_shell01',
      lists: { 0: { list: 'c', pel: 'em025_00c' } },
      modes: {
        0: m057(1.0, [[0, 30]], [0], [0, 142, -1, -1, -1, -1], [], []),
        1: m057(1.0, [[0, 31]], [1], [-1, -1, -1, -1, -1, -1], [], []),
        2: m057(1.0, [[0, 31]], [1], [-1, -1, 0, -1, -1, -1], [], []),
        4: m057(1.0, [[999, -1]], [2], [-1, -1, -1, -1, -1, -1], [], []) },
      hitdata: [[14, 10], [14, 10], [12, 30]] },
    shell13: { id: 0xb7, cls: 'uShellEm025_sp_13', base: 'base13', folder: 'shell\\em\\em025_00_shell13',
      lists: { 0: { list: 'u', pel: 'em025_00u' } },
      modes: {
        0: m057(1.0, [[0, 0], [0, 2], [0, -1], [0, 2]], [0], [3, 0, 0, 0], [30.0, 0.012500000186264515, -0.75, 500.0, 3000.0, 99.0], [[-30.0, -120.0, 120.0], [0.0, 0.0, 0.0]]),
        1: m057(1.0, [[0, 0], [0, 2], [0, -1], [0, 2]], [0], [3, 0, 0, 0], [30.0, 0.012500000186264515, -0.07500000298023224, 500.0, 3000.0, 99.0], [[0.0, -100.0, 140.0], [0.0, 0.0, 0.0]]),
        2: m057(1.0, [[0, 0], [0, 2], [0, -1], [0, 2]], [0], [3, 0, 0, 0], [30.0, 0.012500000186264515, -0.75, 500.0, 3000.0, 99.0], [[0.0, 180.0, 120.0], [0.0, 0.0, 0.0]]),
        3: m057(1.0, [[0, 0], [0, 2], [0, -1], [0, 2]], [0], [3, 0, 0, 0], [30.0, 0.012500000186264515, -0.75, 500.0, 3000.0, 99.0], [[-30.0, -120.0, 120.0], [0.0, 0.0, -500.0]]),
        4: m057(1.0, [[0, 0], [0, 2], [0, -1], [0, 2]], [0], [3, 0, 0, 0], [30.0, 0.012500000186264515, -0.75, 500.0, 3000.0, 99.0], [[-30.0, -120.0, 120.0], [0.0, 0.0, 0.0]]) },
      hitdata: [[10, 99]] },
    shell39: { id: 0xb8, cls: 'uShellEm025_sp_39', base: 'base39', folder: 'shell\\em\\em025_00_shell39',
      lists: { 0: { list: 'u', pel: 'em025_00u' } },
      cmn: { ints: [], floats: [850.0, 700.0, 700.0, 400.0, 400.0, 300.0, 850.0, -700.0, 700.0, 400.0, -400.0, 300.0],
             vecs: [[9.0, 0.0, 9.0], [9.0, 0.0, 9.0], [6.0, 0.0, 6.0], [5.0, 0.0, 5.0], [4.0, 0.0, 4.0], [3.0, 0.0, 3.0]] },
      modes: {
        0: m057(1.0, [[0, 3]], [0], [3, -1], [1200.0, 300.0], [[0.0, 120.0, 0.0]]),
        1: m057(1.0, [[0, 4]], [1], [3, 0], [1200.0, 300.0], [[0.0, 0.0, 150.0]]) },
      hitdata: [[1, 9999], [30, 9999]] },
  },
  actions: [
    act025(7, 0x08, '2', 'Motion[15]', [{ frame: 2, shell: 'shell00', mode: 1 }]),
    act025(7, 0x24, '2', 'Motion[15]', [{ frame: 2, shell: 'shell00', mode: 1 }]),
    act025(7, 0x1f, '2', 'Motion[45]', [{ frame: 70, shell: 'shell00', mode: 0 }]),
    act025(7, 0x0d, '2', 'Motion[27]', [{ frame: 64, shell: 'shell13', mode: 0 }]),
    act025(7, 0x16, '2', 'Motion[27]', [{ frame: 64, shell: 'shell13', mode: 0 }]),
    act025(7, 0x17, '2', 'Motion[27]', [{ frame: 64, shell: 'shell13', mode: 0 }]),
    act025(7, 0x29, '2', 'Motion[27]', [{ frame: 64, shell: 'shell13', mode: 3 }]),
    act025(7, 0x1e, '2', 'Motion[43]', [{ frame: 64, shell: 'shell13', mode: 2 }]),
    act025(7, 0x18, '2', 'Motion[36]', [{ frame: 44, shell: 'shell13', mode: 1 }], { aim18: true }),
    timer025('2', 'Motion[6]', [84], 0),
    timer025('2', 'Motion[8]', [64, 160, 256, 354], 0),
    timer025('1', 'Motion[2]', [64], 2),
    timer025('1', 'Motion[7]', [22], 2),
    timer025('1', 'Motion[8]', [32], 2),
    timer025('1', 'Motion[9]', [36], 1),
    timer025('1', 'Motion[10]', [40], 1),
  ],
};
