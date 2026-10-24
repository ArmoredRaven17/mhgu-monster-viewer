
// ---- KECHA WACHA (em065_00): uEm065_00 (band 0xf48e20..0xf57cd0, action main 0xf55740) -----------------------------------------
// READ 2026-10-18 (dev/em065_00-shells-spec.md; rom-map "Fanged Beasts -- the shells"). Ids are immediates: 0x116 uShellEm065_sp_00
// (base00, reader 0xf569fc, landing 0xf56b14), 0x117 _sp_01 (base01, reader 0xf56ed4), 0x118 _sp_13 (base13, reader 0xf57150,
// landing 0xf5733c), 0x119 _sp_23 (a NEW base, base23: ctor 0x40c8ac over the plain shell; reader 0xf57710, landing 0xf578c8).
// The actions (status 7 table 0xf54540; the census scratchpad fb/cen_em065.txt): his water shots -- three a play, the mode the
// shot's own frame test (0xb0974 at 108 / 130 / 150, or 116 / 136 / 156: the last one passing) --
//   (7, 6) L2 M78 sp_23 0 / 1 / 2 (0xf5072c, r1 0), (7, 7) L2 M80 sp_13 0 / 1 / 2 (0xf509a0), (7, 0x3b) L2 M77 sp_13 3 / 4 / 5;
//   their twins (7, 0x17) L2 M78, (7, 0x18) L2 M80, (7, 0x41) L2 M77 make sp_01 2 at the same frames: a hit volume on joint 131
//   with no EffectParam -- nothing drawn;
//   (3, 7) L5 M25 f16: sp_01 0 (c 31) on the ground 300 ahead, when the owner's y is within 900 of its ground (0xf4c844);
//   (7, 0x15 / 0x48) L2 M114..M117: at M117 f33 (phase 6) the drop, sp_00 0, from a point 445 ahead and 300 below the owner (x
//   the size); (7, 0x16) the same with sp_01 3 (a hit volume, nothing drawn).
// Every shell only makes at the variant byte e+0xb5f5 == 0 (Kecha Wacha's own).

// sp_00's reader 0xf569fc (READ whole): ef 0..3; hit 0; +0x15e8: 0x10 int 0 (the request's point); float 0 vz +0x15f4, float 1 the
// flight +0x15fc, float 2 the X degrees +0x15ec; &vec 0 the gravity +0x161c. Joint and offset the ctor's (-1, the zero vector)
function params065s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: -1, flags: I(0) !== -1 ? 0x10 : 0, degX: F(2), xDeg: F(2), degY: f(0), yDeg: f(0), vz: F(0), vy: f(0), flight: F(1),
           xLo: f(0), xHi: f(0), yLo: f(0), yHi: f(0), vec: ZERO3.slice(), aimOff: ZERO3.slice(), from: ZERO3.slice(),
           gravity: (sh.vecs[0] || ZERO3).map(f) };
}
// the landings of sp_00 (0xf56b14), sp_13 (0xf5733c, in state 2 only) and sp_23 (0xf578c8, state 1 only) -- one shape, READ whole:
// type 1 -> ef 2 (+0x15d0); with the owner active sp_01 1 at the contact (0x3fa2bc: its words at +0x30, +0x3c its +0x13dc), then
// +0x40 = the contact and the words from the ground (0x43b1a0); type 0 -> ef 1 (+0x15cc) and sp_01 1; type 2 -> ef 3 (+0x15d4);
// then the param at the contact (0x3f8970 / 0x4042bc / 0x40c818) and the end
function landing065(S, D, hit, ctx){
  const param = [1, 2, 3][hit.type];
  if ((hit.type === 0 || hit.type === 1) && ctx && ctx.create)
    ctx.create(S, 'shell01', { mode: 1, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  if (hit.type === 1 && hit.normal){ S.position = hit.point.slice(); S.angles = groundAngles(S.angles, hit.normal); }
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// sp_01's reader 0xf56ed4 (READ whole): ef 0 / 1 -> +0x15c8 / +0x15cc; hit 1 -> +0x15d8, hit 0 -> +0x15dc; int 0 the joint +0x15e4;
// +0x15ec: 1 int 1, 4 int 3, 8 int 4, 0x80 int 2, 0x1000 int 5; &vec 0 -> +0x1608
function params065s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(1) !== -1 ? 1 : 0) | (I(3) !== -1 ? 4 : 0) | (I(4) !== -1 ? 8 : 0) | (I(2) !== -1 ? 0x80 : 0) | (I(5) !== -1 ? 0x1000 : 0);
  return { flags, joint: I(0), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm065_sp_01: a mode its files do not carry' : null };
}

// sp_13's reader 0xf57150 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0; int 0 the joint +0x15e4; +0x15e0 (bfc / orrne over the
// ctor's 0): 2 int 1, 0x10 int 2, 0x20 always (bfi bits 5..6 = 1); floats 0 speed +0x15ec, 1 per unit +0x160c, 2 gravity +0x15f4,
// 3 near +0x15fc, 4 far +0x1600, 5 life +0x15f8, 6 the height added +0x1614; &vec 0 -> BOTH points +0x161c / +0x1620; &vec 1 ->
// +0x1630 (the turn of the velocity, degrees). The aim limits +0x1604 / +0x1608 and +0x15f0 the ctor's 0
function params065s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: 0x20 | (I(1) !== -1 ? 2 : 0) | (I(2) !== -1 ? 0x10 : 0),
           speed0: F(0), speedPer: F(1), gravity: F(2), near: F(3), far: F(4), life: F(5), y1614: F(6), f15f0: f(0.0),
           limitA: f(0.0), limitB: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f), turn: sh.vecs[1] ? sh.vecs[1].map(f) : null };
}
// the turn by three angles in degrees (x 0.0174533), base13's +0x1630 (0x404984..0x404a5c) and base23's +0x1604 (0x40cda4..0x40ce84),
// one code: the velocity times the matrix of X, Y, Z
function turnDeg065(v, deg){
  const D2R = f(0.01745329424738884);
  const ax = f(deg[0] * D2R), ay = f(deg[1] * D2R), az = f(deg[2] * D2R);
  const sx = sinf(ax), sy = sinf(ay), sz = sinf(az), cx = cosf(ax), cy = cosf(ay), cz = cosf(az);
  const [vx, vy, vz] = v;
  const s2a = f(sy * cz), s6a = f(sy * sz);
  const s8 = mla(f(cx * cz), sx, s6a);
  const s4 = mls(f(sx * s2a), sz, cx);
  const s2 = mla(f(cx * s2a), sx, sz);
  const s6 = mls(f(s6a * cx), sx, cz);
  const s14 = f(cy * cz), s5 = f(sz * cy), s1 = f(sx * cy), s0 = f(cx * cy);
  const x = mla(mla(f(vy * s4), s14, vx), s2, vz);
  const y = mla(mla(f(vy * s8), s5, vx), s6, vz);
  const z = mla(mls(f(s1 * vy), sy, vx), s0, vz);
  return [x, y, z];
}
// base13's init 0x4044d8 on his flags (0x30, READ whole): the joint's row 3 (0xc15a4, joint 131); the two points (both vec 0) at 0.5
// through the joint's 3x3 (flag 2 clear), no size (8 clear), added; the thrown point (0x405500, Khezu's arm: the distance to the
// target clamped [near, far] along the aim 0x4053e4 -- with 0x10 the owner's facing as it is -- from the shell, the height the
// target's plus +0x1614); the Y word toward it (0x405a88), the launch (0x404dc8, the gravity arm), its velocity by that word, then
// by +0x1630's degrees; the pitch ratio's second pair moves +0x40 by nothing (both points vec 0: m - m); ef 0 at +0x40; state 2
function init13k(S, J, own){
  const k = S.k;
  S.centre = ZERO3.slice();                                      // +0x1650 = setup +0x20 (the zero vector, 0xf50b90)
  S.y1614 = k.y1614;
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const turn = p => [mla(mla(f(M[4] * p[1]), M[0], p[0]), M[8], p[2]), mla(mla(f(M[5] * p[1]), M[1], p[0]), M[9], p[2]),
                     mla(mla(f(M[6] * p[1]), M[2], p[0]), M[10], p[2])];
  const pair = r => turn([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)));
  const m1 = pair(f(0.5));
  let pos = [f(m1[0] + f(M[12])), f(m1[1] + f(M[13])), f(m1[2] + f(M[14]))];
  S.position = pos;
  const T = thrown13(S, k, own);
  const a = wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));
  const L = launch13(S, k, own);
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  let v = [f(L.velocity[2] * sn), L.velocity[1], f(L.velocity[2] * cs)];
  if (k.turn) v = turnDeg065(v, k.turn);
  S.velocity = v;
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
function make065s13(state, D, m, J, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: 'base13',
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params065s13(def, mode);
  if (!init13k(S, J, own)) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}
// sp_13's landing 0xf5733c (READ whole), in state 2 only: landing065's shape, its end base13's (stepOrb)
function landing065s13(S, D, ctx, out){
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return 'keep';
  const n = S.events.length;
  landing065(S, D, hit, ctx);
  for (const e of S.events.slice(n)) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
}

// ---- base23 (uShellEmBase23): Kecha Wacha's water shot -----------------------------------------------------------------------
// READ whole: ctor 0x40c8ac (+0x15fc 1.0, the rest 0 / -1), init 0x40c9f4, the launch 0x40cf9c, update 0x40d1a8 (state 1 -> +0x158,
// 0xfe the ending: +0x1608 by dt, both handles gone -> 0xff), step 0x40d2b4, end 0x40d4dc (its +0x154 0x40d5a8 is `bx lr`), the
// contact start 0x40c818. sp_23's reader 0xf57710: ef 0..3 -> +0x15c8..+0x15d4; hit 0 +0x15d8; int 0 the joint +0x15e0; int 1 ->
// +0x15dc bit 0; floats 0 gravity +0x15e4, 1 near +0x15ec, 2 far +0x15f0, 3 life +0x15e8, 4 the speed scale +0x15fc, 5 the launch
// speed +0x15f8, 6 the solve's gravity +0x15f4; &vec 0 the offset +0x1600, &vec 1 the turn (degrees) +0x1604
function params065s23(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: I(1) !== -1 ? 1 : 0, gravity: F(0), near: F(1), far: F(2), life: F(3), scale: F(4), speed: F(5),
           solveG: F(6), vec: (sh.vecs[0] || ZERO3).map(f), turn: sh.vecs[1] ? sh.vecs[1].map(f) : null };
}
// 0x40cf9c(shell, &p, &target, &v): the pitch word of the line to the target (u16(s32(0.5 + atan2(-dy, h) x 10430.378))), the line
// clamped to [near, far] (the far clamp scales x / z only), the launch's up speed sin(pitch) x +0x15f8, the time to come down
// min(dy, -300) below under +0x15f4, the horizontal speed h / t at most 60, times +0x15fc, along +z
function solve23(k, P, T){
  let dx = f(T[0] - P[0]), dy = f(T[1] - P[1]), dz = f(T[2] - P[2]);
  const dz2 = f(dz * dz), dx2 = f(dx * dx);
  const h0 = sqrtf(f(dx2 + dz2));
  const pw = u16(s32(mla(0.5, atan2f(f(-dy), h0), RAD_TO_U16)));
  const L2 = f(mla(dx2, dy, dy) + dz2);
  const L = sqrtf(L2);
  const lowY = Math.min(dy, f(-300.0)) === dy ? dy : f(-300.0);   // vmin.f32 (s24 = min(dy, -300))
  if (L < k.near){ const s = f(k.near * f(1.0 / sqrtf(L2))); dz = f(dz * s); dy = f(dy * s); dx = f(dx * s); }
  if (L > k.far){
    const l = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
    const s = f(k.far * f(1.0 / l)); dz = f(dz * s); dx = f(dx * s);
  }
  const h = sqrtf(mla(mla(f(0.0), dx, dx), dz, dz));
  const sp = sinf(f(f(pw) * U16_TO_RAD));
  const vy = f(sp * k.speed), nvy = f(-f(sp * k.speed));
  const disc = mla(f(lowY * f(k.solveG + k.solveG)), vy, vy);
  const t = f(f(nvy - sqrtf(disc)) / k.solveG);
  let vz = f(h / t);
  vz = vz < f(60.0) || vz !== vz ? vz : f(60.0);                    // vmin.f32 with 60
  return [f(0.0), vy, f(k.scale * vz)];
}
function init23(S, J, own, setup){
  const k = S.k;
  S.slot = setup.slot || 0;                                          // +0x160c = setup +0x10 (the target slot)
  S.angles = [0, 0, 0];
  S.life = k.life;                                                   // +0x1608 = +0x15e8
  let p, o;
  const [x, y, z] = k.vec;
  let flags = k.flags;
  if (k.joint !== -1){
    const M = jointMatrix(J, k.joint);
    if (!M) return false;
    p = [f(M[12]), f(M[13]), f(M[14])];
    if (!(flags & 1)) o = [mla(mla(f(M[4] * y), M[0], x), M[8], z), mla(mla(f(y * M[5]), x, M[1]), z, M[9]), mla(mla(f(y * M[6]), x, M[2]), z, M[10])];
    else o = turnByWords(k.vec, [own.ownerX, own.ownerY, own.ownerZ]);   // 0x43ae70
  } else {
    if (!own.ownerPos) return false;
    p = own.ownerPos.slice(); flags |= 1;
    o = turnByWords(k.vec, [own.ownerX, own.ownerY, own.ownerZ]);
  }
  p = [f(o[0] + p[0]), f(o[1] + p[1]), f(o[2] + p[2])];             // (flag 2, x 0xbec34: never set)
  S.position = p;
  S.anchor = p.slice();
  const T = own.target;                                             // block +0x1d0 + slot x 16, y + 100
  if (!T) return false;
  const tgt = [T[0], f(T[1] + f(100.0)), T[2]];
  let v = solve23(k, p, tgt);
  const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  v = [mla(f(v[0] * cs), v[2], sn), v[1], mls(f(v[2] * cs), v[0], sn)];   // by the owner's facing (block +0x54)
  if (k.turn) v = turnDeg065(v, k.turn);
  S.velocity = v;
  S.gravity = [f(0.0), k.gravity, f(0.0)];
  S.launch = { point: p.slice(), position: p.slice(), velocity: v.slice(), gravity: S.gravity.slice(), angles: [0, 0, 0], timer: S.life, target: tgt };
  return true;
}
// base23's step 0x40d2b4: the clock, the anchor, 0x539224, the words from the velocity, the life (+0x1608), the rocks' query
function move23(S, ctx, D){
  S.clock = f((S.clock || 0) + ctx.dt);
  S.anchor = S.position.slice();
  stepFlight(S, ctx.dt);
  const [vx, vy, vz] = S.velocity;
  const h = sqrtf(mla(f(vz * vz), vx, vx));
  S.angles = [wordOf(f(-vy), h), wordOf(vx, vz), S.angles[2]];
  const T = S.life;
  if (!(T > 0)){ S.life = 0; return 'end'; }
  const t = f(T - ctx.dt);
  S.life = (0 >= t) ? 0 : t;
  if (!(t > 0)) return 'end';
  const hit = collide(S, null, ctx.stage);
  if (!hit) return 'keep';
  if (S.state !== 1) return 'keep';
  landing065(S, D, hit, ctx);
  return 'end';
}
function step23(S, ctx, input, D, out){
  S.events = [];
  S.place = null;
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.effect2 && !S.effect2.gone && !alive(S.effect2)) S.effect2.gone = true;
  if (S.state === 1){
    S.moves++;
    const r = move23(S, ctx, D);
    for (const e of S.events) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
    if (r === 'end'){
      // 0x40d4dc: the flight's handle stopped, the hits off, state 0xfe, +0x1608 = 30 x 60 frames
      S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
      if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
      S.state = 0xfe;
      S.life = ENDING_FRAMES;
      out.ended.push(S);
    }
  } else if (S.state === 0xfe){
    const T = S.life;
    if (!(T > 0)){ S.life = 0; S.state = 0xff; return; }
    const t = f(T - ctx.dt);
    S.life = (0 >= t) ? 0 : t;
    if (!(t > 0)) S.state = 0xff;
    else if (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone)) S.state = 0xff;
  }
}
function make23(state, D, m, J, own, ctx, action, frame){
  const def = D.shells.shell23, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell23', cls: def.cls, globalId: def.id, base: 'base23',
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              life: 0, clock: 0, moves: 0, launch: null, events: [], folder: def.folder, effect: null, effect2: null,
              start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params065s23(def, mode);
  if (!init23(S, J, own, { slot: 0 })) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}

// the actions' shells (SHELL_DATA.em065_00.actions), on the previous pose's joints, by pass001 of each row's frame
function spawn065(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    const def = D.shells[sp.shell];
    const why = missing001(own, { facing: true, pos: sp.kind === 'drop' || sp.kind === 'ground', target: sp.shell === 'shell23' || sp.shell === 'shell13' });
    if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why }); continue; }
    let S = null;
    if (sp.shell === 'shell23') S = make23(state, D, sp.mode, J, own, ctx, a.action, sp.frame);
    else if (sp.shell === 'shell13') S = make065s13(state, D, sp.mode, J, own, ctx, a.action, sp.frame);
    else if (sp.kind === 'drop'){
      // 0xf5251c..0xf52618: the point (445 sin Y, -300, 445 cos Y) x the size from the owner's block position; sp_00 0 there
      // (0x3f883c(0x30): +0x10 the point, +0x20 the zero vector), base00's init on its flag 0x10 (the request's point)
      const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), sz = size001(own), P = own.ownerPos;
      const s6 = mls(f(cs * f(445.0)), sn, f(0.0)), s8 = mla(f(cs * f(0.0)), sn, f(445.0));
      const pt = [mla(P[0], sz, s8), mla(P[1], sz, f(-300.0)), mla(P[2], sz, s6)];
      S = sp.shell === 'shell00'
        ? make00n(state, D, sp.mode, J, Object.assign({}, own, { requestPos: pt, requestAngles: [0, 0, 0] }), ctx, a.action, sp.frame)
        : make001(state, D, 'shell01', { id: def.id, mode: sp.mode, position: pt, angles: [0, 0, 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
    } else if (sp.kind === 'ground'){
      // 0xf4c844..0xf4c868: only while the owner's y is within 900 of its ground (block +0x44 <= +0x5b4 + 900)
      if (!(own.ownerPos[1] <= f(own.ground + f(900.0)))) continue;
      S = make001(state, D, 'shell01', { id: def.id, mode: sp.mode, position: own.ownerPos.slice(), angles: ownerWords001(own), action: a.action, frame: sp.frame }, own, J, ctx, null);
    } else S = make001(state, D, 'shell01', { id: def.id, mode: sp.mode, position: [0, 0, 0], angles: [0, 0, 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
    if (S){ state.shells.push(S); out.spawned.push(S); }
  }
}
