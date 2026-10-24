
// ---- GAMMOTH (em083_00): uEm083_00 (band 0x104f8c8..0x1064be0, action main 0x1050a1c) -----------------------------------------
// READ 2026-10-18 (dev/em083-shells-spec.md; rom-map "uEm083_00 shells"). Ids: e+0xcae0 sp_00 (0x161), +0xcae4 sp_01 (0x163),
// +0xcae8 sp_13 (0x164), the variant-4 ids 0x165 / 0x168 / 0x16a; sp_00_02 (0x162) is an immediate (the snowball's pieces). Census
// scratchpad fb/cen_em083_v0.txt; each helper's frame its actiontune float (0x6f618, em083_00_action_tune floats 0..13):
//   L2 M61 (7, 0xc9..0xcb at 26, 0xcc / 0xcd at 28) / L2 M62 (7, 0xce..0xd2 / 0xd3 / 0xd4 at 18): sp_00 0 / 0 / 1 / 2, the aimed
//     ice shot (0x105c738);
//   L2 M23 (7, 0x1b / 0x1c / 0x1d, 0x78..0x7d): sp_13 2 / 1 / 0 at 220 (float 8), held on joint 157 (e+0xcb0c = 1), thrown at 266
//     (float 9: e+0xcb0c = 2) (0x10606f4..0x1060834); it bursts on the ground into sp_01 0 / 1 / 2, and at G rank (0x3a8430 >= 5)
//     modes 1 / 2 split into sp_00_02 pieces as they are thrown (vt+0x28 0x1064354). His action setter (0x10518e4..0x10519bc)
//     clears e+0xcb0c for any action but status 7 0x1b..0x1d / 0x78..0x7e: the held ball's next update ends it;
//   sp_01 at the owner's point and words, each at its frame: L2 M5 (7, 4) 245 mode 7 (and (7, 0x45)'s L2 M50 -> L2 M5), L2 M9
//     (7, 0xa) 80 mode 8, L2 M14 (7, 0xe) 190 mode 17, L2 M15 (7, 0xf / 0x87 / 0x88) 76 mode 11, L2 M20 (7, 0x12..0x14,
//     0x20..0x22) 90 mode 9 and its L2 M21 44 mode 10 / 100 mode 9, L2 M37 (7, 0x5a / 0x5b) 172 mode 37 and L2 M39 (7, 0x5c /
//     0x5d) -> L2 M37 172 mode 38.
// Every helper is variant 0's (byte e+0xb5f5 != 4); Elderfrost's (4) arms are other code. The classes' hit-side overrides (sp_00_02
// +0x158 0x10632bc, sp_13 +0x158 0x1064158: after the base's move, while hit slot 0 is on, ef +0x1660 / +0x167c on ANOTHER
// em083 (u16 e+0xb5f0 | 0x400 == 0x453) its hit volume touches, 0x1054824) need a second monster: never in the viewer.

// sp_00's reader 0x1062afc (READ, modes 0..3 -- the variant-4 mode 4 arm is Elderfrost's): ef 0..3; hit 0; int 0 the joint; +0x15e8:
// 1 int 1 (the X aim), 2 int 2 (the Y aim), 4 always (both from the shell's point), 8 int 3; floats 0 degX, 1 degY, 2 / 3 the X
// clamp, 4 / 5 the Y clamp, 6 the flight, 7 vz; &vec 0 the offset +0x1610, &vec 1 the aim offset +0x1618 (both aims take it:
// 0x3f9378 and 0x3f9cc4 join at 0x3f94c0 / 0x3f9e0c with it)
function params083s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = 4 | (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 8 : 0);
  return { joint: I(0), flags, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(7), vy: f(0), flight: F(6),
           xLo: F(2), xHi: F(3), yLo: F(4), yHi: F(5), vec: V(0), from: ZERO3.slice(), aimOff: V(1), gravity: ZERO3.slice() };
}
// sp_00_02's reader 0x1063054 (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15d0; hit 0; +0x15e8 = (f & ~0x3b) | 0x38 (8 the offset by
// the words, 0x10 the request's point, 0x20 its words); +0x1610 = the zero vector; float 0 vz +0x15f4; the gravity (0, -float 1, 0)
// at +0x1670 (+0x161c = &it); ef 2 -> +0x1660 (the other-em083 hit's). No flight (+0x15fc 0): it lives while hit slot 0 is on
function params083s002(def, mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: -1, flags: 0x38, degX: f(0), xDeg: f(0), degY: f(0), yDeg: f(0), vz: F(0), vy: f(0), flight: f(0),
           vec: ZERO3.slice(), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: [f(0), f(-F(1)), f(0)] };
}
// sp_00_02's landing 0x1063148 (READ whole), in state 1 with the owner active: the camera (0x43ac04, 5), sp_01 0x163 (mode 2 for the
// pieces below mode 10, else 1) at the contact with the piece's words (0x3fa2bc: +0x20 the zero vector, +0x3c its +0x13dc); then
// the end (vt+0x148) -- no effect of its own at the contact
function landing083s002(S, D, hit, ctx){
  if (S.state !== 1) return 'keep';
  camera001(S, 5);
  if (ctx && ctx.create) ctx.create(S, 'shell01', { mode: S.modeIndex < 10 ? 2 : 1, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
}
// sp_01's reader 0x10637c4 (READ whole): ef 0 / 1; hit 0; +0x15ec: 1 int 0, 2 int 2, 0x800 int 3, 4 int 4, 8 int 5, 0x1000 int 6; int 1
// the joint +0x15e4; int 7 -> +0x15e8; float 0 the timer +0x15f0; &vec 0 the offset +0x1608, &vec 1 the degrees +0x160c (k.deg)
function params083s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 0x800 : 0) | (I(4) !== -1 ? 4 : 0) | (I(5) !== -1 ? 8 : 0) | (I(6) !== -1 ? 0x1000 : 0);
  return { flags, joint: I(1), i15e8: I(7), timer: F(0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), deg: V(1),
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm083_sp_01: a mode its files do not carry' : null };
}

// sp_13's reader 0x1063b2c (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15d0; hit 0; int 0 the joint +0x15e4; +0x15e0 = (f & ~3) | 1 |
// (int 1 != -1 ? 2 : 0) -- bit 0: state 1, HELD; int 2 -> +0x15e8; floats 0 speed +0x15ec, 1 the arc's height +0x15f0, 2 life
// +0x15f8, 3 far +0x1600, 4 near +0x15fc, 5 per unit +0x160c; &vec 0 both points +0x161c / +0x1620, &vec 1 -> +0x1624 (the thrown
// point's offset); gravity +0x15f4, the aim limits and +0x1614 the ctor's 0. At G rank (0x3a8430 >= 5, variant 0): +0x168c = mode +
// 1 for modes 0..2, ef 2 / 3 -> +0x1680 / +0x1684, hit 1 -> +0x1688; ef 4 -> +0x167c (the other-em083 hit's)
function params083s13(def, mode, m, own){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const g = (own.rank == null ? 5 : own.rank) >= 5;
  return { joint: I(0), flags: 1 | (I(1) !== -1 ? 2 : 0), i15e8: I(2), speed0: F(0), f15f0: F(1), life: F(2), far: F(3), near: F(4),
           speedPer: F(5), gravity: f(0.0), limitA: f(0.0), limitB: f(0.0), y1614: f(0.0),
           vec: (sh.vecs[0] || ZERO3).map(f), centre: (sh.vecs[1] || ZERO3).map(f), split: g && m <= 2 ? m + 1 : 0 };
}
// base13's init 0x4044d8 on his flags (1 | 2?), then sp_13's +0x13c 0x1064314 (the owner's test): the joint's row 3; both points vec 0
// at 0.5 through the joint's 3x3 (2 clear) or the owner's words (2 set), no size; the thrown point (vt+0x168), the Y word toward it,
// the launch (0x404dc8) and its velocity by that word; the pitch ratio moves +0x40 by nothing (m - m); ef 0 at +0x40; state 2 - 1 = 1
function init083s13(S, J, own){
  const k = S.k;
  S.centre = k.centre.slice();
  S.y1614 = k.y1614;
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const turn = (k.flags & 2) ? (p => turnByWords(p, [own.ownerX, own.ownerY, own.ownerZ]))
    : (p => [mla(mla(f(M[4] * p[1]), M[0], p[0]), M[8], p[2]), mla(mla(f(M[5] * p[1]), M[1], p[0]), M[9], p[2]),
             mla(mla(f(M[6] * p[1]), M[2], p[0]), M[10], p[2])]);
  const pair = r => turn([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)));
  const m1 = pair(f(0.5));
  let pos = [f(m1[0] + f(M[12])), f(m1[1] + f(M[13])), f(m1[2] + f(M[14]))];
  S.position = pos;
  const T = thrown13(S, k, own);
  const a = wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));
  const L = launch13r(S, T);
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
  S.launch = { point: pos.slice(), position: pos.slice(), thrown: T.slice(), aim: a, ratio, velocity: S.velocity.slice(),
               gravity: S.gravity.slice(), life: S.lifetime, angles: [0, 0, 0] };
  S.timer = f(0.0);
  return true;
}
// sp_13's state 1, vt+0x15c 0x1063f20 (READ whole): the anchor = +0x40; +0x40 = the joint's world point (0xc164c) plus vec 0 through
// its matrix's 3x3 (0xc15a4); then the owner's e+0xcb0c: 0 -> the end (vt+0x148); 2 -> THROWN (state 2: the thrown point vt+0x168,
// the word toward it, the launch 0x404dc8, the velocity turned by that word); else held on
function hold083s13(S, ctx, D, out, own, state){
  S.anchor = S.position.slice();
  const M = jointMatrix(ctx.J, S.k.joint);
  if (M){
    const v = S.k.vec;
    S.position = [f(mla(mla(f(v[1] * M[4]), v[0], M[0]), v[2], M[8]) + M[12]),
                  f(mla(mla(f(v[1] * M[5]), v[0], M[1]), v[2], M[9]) + M[13]),
                  f(mla(mla(f(v[1] * M[6]), v[0], M[2]), v[2], M[10]) + M[14])];
  }
  const c = state.cb0c || 0;
  if (c === 0) return 'end';
  if (c !== 2) return 'keep';
  S.state = 2;
  const T = thrown13(S, S.k, own);
  const a = atan2f(f(T[0] - S.position[0]), f(T[2] - S.position[2]));
  const L = launch13r(S, T);
  S.gravity = L.acceleration.slice();
  const w = u16(s32(mla(0.5, a, RAD_TO_U16)));
  const rad = f(w * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  const [vx, vy, vz] = L.velocity;
  S.velocity = [mla(f(vx * cs), vz, sn), vy, mls(f(vz * cs), vx, sn)];
  S.throw = { thrown: T.slice(), word: w, velocity: S.velocity.slice(), gravity: S.gravity.slice() };
  return 'keep';
}
// sp_13's vt+0x28 0x1064354 (READ whole; the unit walker runs it after the update): in state 2, base13's 0x40512c (its ground marker:
// not drawn); then once (byte +0x1690) with +0x168c >= 2 and +0x44 <= the anchor's y (+0x1004): with the mode <= 2 and the owner
// active, ef 2 (+0x1680) at +0x40; the pieces (0x1064514); the flight's handle +0x1674 stopped at once (0x329c40(h, 1)) and ef 3
// (+0x1684) started into it -- S.effect stays param 0, the handle +0x1674, which base13's end stops; hit 0 = hit 1 (+0x1688)
// re-registered (0x404fa0: the hit side)
function post083s13(S, D, ctx, out, own){
  if (S.state !== 2 || !(S.k.split >= 2) || S.split083 || S.position[1] > S.anchor[1]) return;
  S.split083 = true;
  const lists = listsOf(D, S);
  if (S.modeIndex <= 2 && S.mode.ef[2]){
    const rq = rockRequest(D, S.mode, 2, S.position, 'split', lists);
    S.events.push(rq ? { ev: 'start', param: 2, kind: 'split', start: rq } : { ev: 'refused', param: 2, kind: 'split' });
    if (rq) out.started.push({ shell: S, start: rq });
  }
  pieces083(S, D, ctx, out, own);
  if (S.effect && !S.effect.gone) S.events.push({ ev: 'stop', param: 0, key: S.effect.key, flag: 1, reflight: true });
  const rq3 = S.mode.ef[3] ? rockRequest(D, S.mode, 3, S.position, 'reflight', lists) : null;
  S.events.push(rq3 ? { ev: 'start', param: 3, kind: 'reflight', start: rq3 } : { ev: 'refused', param: 3, kind: 'reflight' });
  if (rq3){ out.started.push({ shell: S, start: rq3 }); S.effect = { param: 0, key: rq3.key, kind: 'flight', ef: 3 }; S.effects[3].started = true; }
  else S.effect = null;
}
// 0x1064514(shell, mode) (READ whole), the owner active: the flat direction from the target (vt+0x170) to the shell, normalised unless
// shorter than 2^-23 (its y 0 x 1 / d); mode 1 -> one piece, sp_00_02 0xb, aimed at the target + 1500 along it; mode 2 -> two (1 /
// 2) at the target + 1000 along it + 1200 to either side (the direction turned by the constants -4.371e-8 / 1.192e-8: cos 90
// degrees); each made at the shell's point (0x3f883c(0x30): +0x10 = +0x40, the words its pitch at +0x20 and yaw at +0x24 toward its
// aim point -- u16(s32(0.5 + atan2 x 10430.378)) -- +0x28 the zero vector's z, +0x2e 0xffff), inited at once (0x48b884)
function pieces083(S, D, ctx, out, own){
  const T = own.target, P = S.position;
  if (!T) return;
  let dx = f(P[0] - T[0]), dz = f(P[2] - T[2]), dy = f(0.0), lift = f(0.0);
  const d = sqrtf(mla(mla(f(0.0), dx, dx), dz, dz));
  if (!(d < f(1.1920928955078125e-07))){
    const r = f(1.0 / d);
    dy = f(r * f(0.0)); dz = f(dz * r); dx = f(dx * r); lift = f(dy * f(1500.0));
  }
  const make = (m, X, Y, Z) => {
    const ax = f(X - P[0]), az = f(Z - P[2]);
    const yaw = u16(s32(mla(0.5, atan2f(ax, az), RAD_TO_U16)));
    const h = sqrtf(mla(f(az * az), ax, ax));
    const pitch = u16(s32(mla(0.5, atan2f(f(-f(Y - P[1])), h), RAD_TO_U16)));
    const own2 = Object.assign({}, own, { requestPos: P.slice(), requestAngles: [pitch, yaw, 0] });
    const S2 = make00n(ctx.shellState, D, m, ctx.J, own2, ctx, S.action, null, 'shell00_02');
    S.events.push({ ev: 'create', stepped: true, shell: 'shell00_02', id: D.shells.shell00_02.id, mode: m, position: P.slice(),
                    angles: [pitch, yaw, 0], child: S2 ? S2.id : null, deleted: !S2 });
    if (S2){ S2.creator = S.id; S2.createdAtMove = S.moves; ctx.shellState.shells.push(S2); out.spawned.push(S2); }
  };
  if (S.modeIndex === 1){
    make(0xb, mla(T[0], dx, f(1500.0)), f(T[1] + lift), mla(T[2], dz, f(1500.0)));
  } else if (S.modeIndex === 2){
    const ca = f(-4.371138828673793e-08), cb = f(1.1924880638503055e-08), c19 = f(1200.0);
    const bx = mla(T[0], dx, f(1000.0)), bz = mla(T[2], dz, f(1000.0));
    const y = mla(mla(T[1], dy, f(1000.0)), dy, c19);
    make(1, mla(bx, mla(dz, dx, ca), c19), y, mla(bz, f(f(dz * ca) - dx), c19));
    make(2, mla(bx, f(f(dx * cb) - dz), c19), y, mla(bz, mla(dx, dz, cb), c19));
  }
}
// sp_13's landing 0x1063d7c (READ whole), in state 2 only: by its mode (0..6, table 0x1063dc0): 0 -> the camera 7, sp_01 0; 1 -> camera
// 5, sp_01 1; 2 -> camera 5, sp_01 2; 6 -> camera 5, sp_01 41; 3..5 nothing at all (it flies on); the sp_01 at the contact with the
// shell's words (id 0x163, 0x168 for variant 4), then the end -- no effect of its own
function landing083s13(S, D, ctx, out){
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return 'keep';
  const m = S.modeIndex, child = m === 0 ? 0 : m === 1 ? 1 : m === 2 ? 2 : m === 6 ? 41 : null;
  if (child == null) return 'keep';
  camera001(S, m === 0 ? 7 : 5);
  if (ctx.create) ctx.create(S, 'shell01', { mode: child, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
}
function make083s13(state, D, m, J, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: 'base13',
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params083s13(def, mode, m, own);
  if (!init083s13(S, J, own)) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}
// the action setter's clear (0x10518e4..0x10519bc): e+0xcb0c = 0 at the start of any action but status 7 0x1b..0x1d / 0x78..0x7e
const snow083 = a => !!a && a.action[0] === 7 && ((a.action[1] >= 0x1b && a.action[1] <= 0x1d) || (a.action[1] >= 0x78 && a.action[1] <= 0x7e));
// the actions' shells (SHELL_DATA.em083_00.actions), on the previous pose's joints, by pass001 of each row's frame
function spawn083(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.kind === 'release'){ state.cb0c = 2; continue; }               // 0x1060828: e+0xcb0c = 2
    const why = missing001(own, { facing: true, pos: sp.shell === 'shell01', target: sp.shell === 'shell13' || sp.shell === 'shell00' });
    if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why }); continue; }
    let S = null;
    if (sp.shell === 'shell13'){ state.cb0c = 1; S = make083s13(state, D, sp.mode, J, own, ctx, a.action, sp.frame); }   // 0x10607f8
    else if (sp.shell === 'shell00') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame);
    else {
      const def = D.shells.shell01;
      S = make001(state, D, 'shell01', { id: def.id, mode: sp.mode, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                         action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S) S.motionId = ctx.ownerMotion;                                 // base01's init: +0x1620 = the owner's +0x4b4
    }
    if (S){ state.shells.push(S); out.spawned.push(S); }
  }
}

// THE FILES (em083_00.arc, shl.py; scratchpad fb/gen083.py); hitdata (s16 delay, s16 duration) from the _hitdata tables (fb/hit.py)
SHELL_DATA.em083_00 = {
  name: 'Gammoth',
  lists: { 0: { list: 'u', pel: 'em083_00u' } },
  shells: {
    // shell00: the aimed ice shot (L2 M61 / M62): u 1 on it, u 2 at a contact
    shell00: { id: 0x161, cls: 'uShellEm083_sp_00', base: 'base00', reader: 0x1062afc, folder: 'shell\\em\\em083_00_shell00',
      modes: {
      0: m057(1.0, [[0, 1], [0, 2], [0, 2], [0, 2]], [0], [157, 0, 0, -1], [0.0, 0.0, -90.0, 90.0, -60.0, 60.0, 200.0, 66.0], [[0.0, -40.0, 120.0], [0.0, 80.0, 0.0]]),
      1: m057(1.0, [[0, 1], [0, 2], [0, 2], [0, 2]], [0], [157, 0, 0, -1], [0.0, 0.0, -90.0, 90.0, -60.0, 60.0, 200.0, 66.0], [[0.0, -40.0, 120.0], [400.0, 80.0, 0.0]]),
      2: m057(1.0, [[0, 1], [0, 2], [0, 2], [0, 2]], [0], [157, 0, 0, -1], [0.0, 0.0, -90.0, 90.0, -60.0, 60.0, 200.0, 66.0], [[0.0, -40.0, 120.0], [-400.0, 80.0, 0.0]]),
      }, hitdata: [[0, 500]] },
    // shell00_02: the snowball's pieces (G rank): u 51 / u 41 on them; at a contact sp_01 2 / 1
    shell00_02: { id: 0x162, cls: 'uShellEm083_sp_00_02', base: 'base00', reader: 0x1063054, folder: 'shell\\em\\em083_00_shell00_02',
      modes: {
      1: m057(1.0, [[0, 51], [0, -1], [0, 42]], [2], [], [40.0, 0.20000000298023224], []),
      2: m057(1.0, [[0, 51], [0, -1], [0, 42]], [2], [], [10.0, 0.20000000298023224], []),
      11: m057(1.0, [[0, 41], [0, -1], [0, 42]], [1], [], [30.0, 0.20000000298023224], []),
      }, hitdata: [[0, 300], [0, 300], [0, 300]] },
    // shell01: the bursts (0..2: u 32 / 42 / 52), the ground's (3..6, 20: u 60 / 61), the stomps (7..10: u 80, 11: u 70); 12..15 /
    // 17 / 37 / 38 hit volumes (no EffectParam)
    shell01: { id: 0x163, cls: 'uShellEm083_sp_01', base: 'base01', reader: 0x10637c4, folder: 'shell\\em\\em083_00_shell01',
      modes: {
      0: m057(0.5, [[0, 32], [999, -1]], [0], [-1, -1, -1, -1, -1, -1, -1, -1], [20.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      1: m057(0.800000011920929, [[0, 42], [999, -1]], [1], [-1, -1, -1, -1, -1, -1, -1, -1], [20.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      2: m057(1.0, [[0, 52], [999, -1]], [2], [-1, -1, -1, -1, -1, -1, -1, -1], [20.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      3: m057(1.0, [[0, 60], [0, -1]], [3], [0, 7, -1, -1, -1, -1, -1, -1], [20.0], [[0.0, -50.0, 0.0], [0.0, 0.0, 0.0]]),
      4: m057(1.0, [[0, 60], [0, -1]], [3], [0, 11, -1, -1, -1, -1, -1, -1], [20.0], [[0.0, -50.0, 0.0], [0.0, 0.0, 0.0]]),
      5: m057(1.0, [[0, 61], [0, -1]], [3], [0, 14, -1, -1, -1, -1, -1, -1], [20.0], [[0.0, -50.0, 0.0], [0.0, 0.0, 0.0]]),
      6: m057(1.0, [[0, 61], [0, -1]], [3], [0, 17, -1, -1, -1, -1, -1, -1], [20.0], [[0.0, -50.0, 0.0], [0.0, 0.0, 0.0]]),
      7: m057(1.0, [[0, 80], [999, -1]], [4], [-1, -1, -1, -1, -1, -1, -1, -1], [20.0], [[-1200.0, 0.0, 1500.0], [0.0, 75.0, 0.0]]),
      8: m057(1.0, [[0, 80], [999, -1]], [4], [0, 14, -1, -1, -1, -1, -1, -1], [20.0], [[100.0, -250.0, -180.0], [0.0, 180.0, 0.0]]),
      9: m057(1.0, [[0, 80], [999, -1]], [4], [0, 0, -1, -1, -1, -1, -1, -1], [20.0], [[1500.0, -350.0, 800.0], [0.0, 90.0, 0.0]]),
      10: m057(1.0, [[0, 80], [999, -1]], [4], [0, 0, -1, -1, -1, -1, -1, -1], [20.0], [[-1200.0, -500.0, 1000.0], [0.0, 270.0, 0.0]]),
      11: m057(1.0, [[0, 70], [999, -1]], [5], [0, 0, -1, -1, -1, -1, -1, -1], [0.0], [[0.0, -600.0, 1700.0], [0.0, 0.0, 0.0]]),
      12: m057(1.0, [[999, -1], [999, -1]], [6], [0, 7, -1, -1, -1, -1, 0, -1], [0.0], [[-200.0, -100.0, 0.0], [0.0, 0.0, 0.0]]),
      13: m057(1.0, [[999, -1], [999, -1]], [7], [0, 0, -1, -1, -1, -1, 0, -1], [0.0], [[-100.0, -600.0, 300.0], [0.0, 0.0, 0.0]]),
      14: m057(1.0, [[999, -1], [999, -1]], [8], [0, 7, -1, -1, -1, -1, 0, -1], [0.0], [[0.0, -200.0, 0.0], [0.0, 0.0, 0.0]]),
      15: m057(1.0, [[999, -1], [999, -1]], [9], [0, 140, -1, -1, -1, -1, 0, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      17: m057(1.0, [[0, -1], [999, -1]], [-1], [0, 0, -1, -1, -1, -1, -1, -1], [220.0], [[100.0, -800.0, 1700.0], [0.0, 0.0, 0.0]]),
      20: m057(1.0, [[0, 60], [0, -1]], [3], [0, 157, -1, -1, -1, -1, -1, -1], [20.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      37: m057(1.0, [[999, -1], [999, -1]], [10], [0, 0, -1, -1, -1, -1, 0, 5], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      38: m057(1.0, [[999, -1], [999, -1]], [11], [0, 0, -1, -1, -1, -1, 0, 5], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      }, hitdata: [[0, 500], [0, 500], [0, 500], [0, 100], [0, 500], [30, 60], [0, 6], [0, 6], [0, 6], [0, 6], [0, 6], [0, 6]] },
    // shell13: the snowball (L2 M23 2 / 1 / 0): u 31 / 41 / 51 on it; at G rank u 2 at the split, u 1 its flight after it
    shell13: { id: 0x164, cls: 'uShellEm083_sp_13', base: 'base13', reader: 0x1063b2c, folder: 'shell\\em\\em083_00_shell13',
      modes: {
      0: m057(1.0, [[0, 31], [0, -1], [0, 2], [999, -1], [0, 42]], [0, -1], [157, -1, 0], [10.0, 240.0, 300.0, 5000.0, 600.0, 0.007499999832361937], [[0.0, 0.0, 180.0], [0.0, 0.0, 0.0], [0.0, -0.10000000149011612, 0.0]]),
      1: m057(1.0, [[0, 41], [0, -1], [0, 2], [0, 1], [0, 42]], [1, 3], [157, -1, 1], [8.0, 240.0, 300.0, 5000.0, 600.0, 0.007499999832361937], [[0.0, 0.0, 180.0], [0.0, 0.0, 0.0], [0.0, -0.10000000149011612, 0.0]]),
      2: m057(1.0, [[0, 51], [0, -1], [0, 2], [0, 1], [0, 42]], [2, 4], [157, -1, 2], [6.0, 240.0, 300.0, 5000.0, 600.0, 0.007000000216066837], [[0.0, 0.0, 500.0], [0.0, 0.0, 0.0], [0.0, -0.10000000149011612, 0.0]]),
      }, hitdata: [[0, 3000], [0, 3000], [0, 3000], [0, 3000], [0, 3000]] },
  },
  actions: null,
};
const act083 = (n, clip, spawns, x = {}) => Object.assign({ action: [7, n], code: 'em083', list: '2', clip, pick: x.pick || 'ai',
  variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns }, x);
const SNOWBALL083 = m => [{ frame: 220, shell: 'shell13', mode: m }, { frame: 266, kind: 'release' }];
SHELL_DATA.em083_00.actions = [
  act083(0xc9, 'Motion[61]', [{ frame: 26, shell: 'shell00', mode: 0 }], { also: [[7, 0xca], [7, 0xcb]] }),
  act083(0xcc, 'Motion[61]', [{ frame: 28, shell: 'shell00', mode: 0 }], { also: [[7, 0xcd]] }),
  act083(0xce, 'Motion[62]', [{ frame: 18, shell: 'shell00', mode: 0 }], { also: [[7, 0xcf], [7, 0xd0], [7, 0xd1], [7, 0xd2]] }),
  act083(0xd3, 'Motion[62]', [{ frame: 18, shell: 'shell00', mode: 1 }]),
  act083(0xd4, 'Motion[62]', [{ frame: 18, shell: 'shell00', mode: 2 }]),
  act083(0x1d, 'Motion[23]', SNOWBALL083(0), { also: [[7, 0x7a], [7, 0x7d]] }),
  act083(0x1c, 'Motion[23]', SNOWBALL083(1), { also: [[7, 0x79], [7, 0x7c]] }),
  act083(0x1b, 'Motion[23]', SNOWBALL083(2), { also: [[7, 0x78], [7, 0x7b]] }),
  act083(0x04, 'Motion[5]', [{ frame: 245, shell: 'shell01', mode: 7 }], { also: [[7, 0x45]] }),
  act083(0x0a, 'Motion[9]', [{ frame: 80, shell: 'shell01', mode: 8 }]),
  act083(0x0e, 'Motion[14]', [{ frame: 190, shell: 'shell01', mode: 17 }]),
  act083(0x0f, 'Motion[15]', [{ frame: 76, shell: 'shell01', mode: 11 }], { also: [[7, 0x87], [7, 0x88]] }),
  act083(0x12, 'Motion[20]', [{ frame: 90, shell: 'shell01', mode: 9 }], { also: [[7, 0x13], [7, 0x14], [7, 0x20], [7, 0x21], [7, 0x22]] }),
  act083(0x12, 'Motion[21]', [{ frame: 44, shell: 'shell01', mode: 10 }, { frame: 100, shell: 'shell01', mode: 9 }], { also: [[7, 0x13], [7, 0x14], [7, 0x20], [7, 0x21], [7, 0x22]] }),
  act083(0x5a, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 37 }], { also: [[7, 0x5b]] }),
  act083(0x5c, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 38 }], { also: [[7, 0x5d]] }),
];
