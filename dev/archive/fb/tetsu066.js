// ---- TETSUCABRA / DRILLTUSK (em066_00 / em066_04): uEm066_00's shells -------------------------------------------------------------
// READ 2026-10-18 (dev/amphibian-shells-spec.md 1). The ids are FIELDS (vt+0x158 0xf57ce8, by e+0xb5f5): e+0xcac4 sp_13 (0x11c /
// 0x120), +0xcac8 sp_00 (0x11a / 0x11e), +0xcacc sp_01 (0x11b / 0x11f), +0xcad0 sp_16 (0x11d / 0x121); folders by the path table
// (0x175c3e8 res 0x8a6d..0x8a74 -> 0x159daa0). Census scratchpad fb/cen11_em066_0N_k1.txt (all 16 statuses, the ids and the .dtp filled,
// the landing answered: cengen11) plus the id fields' loads in the band (the sp_16 is made at the ACTION START, vt+0x204, which no
// census runs):
//   (7, 0x55 / 0x83 / 0x85) L4 M1 and (7, 0x56 / 0x84 / 0x86) L4 M2 at f124 (0xf5e94c..): sp_00 by the tusks (part 0's level against
//   .dtp rows 0 / 1, bytes 1 / 2 by rank) and the quest map: below row 0 two rocks, below row 1 one, else none -- tables
//   0x16a0850 {0, 1, 2, 0, 0, 0, 5, 6, 7} / snow maps 0x16a0820 {3, 4, 10, 3, 3, 3, 8, 9, 11};
//   (7, 0x21 / 0x22 / 0x36 / 0x37) L2 M12 f58 (0xf5dc30..): sp_13 0 (the thrown rock), its setup's points the zero vector;
//   (7, 0x89 / 0x77) the action start (0xf58dd0..0xf58fc8): sp_16 -- below row 1 mode 2, else 3 (snow maps 0 / 1).
// THE QUEST MAP (vt+0x9c 0x6bb20 = e+0x1053, in {3, 14, 20} -- the snow maps -- by 0x104008): the viewer has none, and the base ctor's
// 0xff is no snow map, so the plain modes play; the snow modes (sp_00 3 / 4 / 8..11, sp_16 0 / 1) are named, not shown.
// NOT BUILT, by name: sp_01 (0x11b / 0x11f) as its own makers make it -- (3, 0x50..0x55)'s landing mode 1 (0xf5d4c8), (7, 0x57..0x6a) /
// (7, 0x80 / 0x81) f15 of their landing clips modes 2 / 3 (0xf5f3bc): every mode's EffectParam is (999, -1) -- hit volumes that draw
// nothing; sp_13's landing child (mode 0) is made, as the ROM makes it, and starts nothing.
// sp_00's reader 0xf64f38 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; floats 0 degX +0x15ec, 1 degY +0x15f0, 2 vz
// +0x15f4, 3 vy +0x15f8, 4 the flight +0x15fc, 5 / 6 the X clamp +0x1600 / +0x1604, 8 / 9 the Y clamp +0x1608 / +0x160c, 7 -> +0x1664
// (+0x1618 = &+0x1660: the aim offset (0, f7, 0)); &vec 0 -> +0x1610 (the offset), &vec 1 -> +0x1614, &vec 2 -> +0x161c (the gravity).
// No int: the joint +0x15dc and the flags +0x15e8 are base00's ctor's (-1, 0: 0x3f8a04) -- the owner's point, its words. Its landing is
// base00's own (0x3f8878)
function params066s00(def, mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: -1, i1: -1, i2: -1, flags: 0, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(2), vy: F(3), flight: F(4),
           xLo: F(5), xHi: F(6), yLo: F(8), yHi: F(9), aimOff: [f(0), F(7), f(0)], vec: V(0), from: V(1), gravity: V(2) };
}
// sp_01's reader 0xf65250 (READ whole): ef 0 -> +0x15c8 (every mode (999, -1)); hit 0; +0x15ec (bfc / orrne): 0x800 int 0, 4 int 1,
// 8 int 2, 0x1000 int 3; float 0 the timer +0x15f0; &vec 0 the offset +0x1608
function params066s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const flags = (I(0) !== -1 ? 0x800 : 0) | (I(1) !== -1 ? 4 : 0) | (I(2) !== -1 ? 8 : 0) | (I(3) !== -1 ? 0x1000 : 0);
  return { flags, joint: -1, timer: F(0), f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm066_sp_01: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
// sp_13's reader 0xf65478 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0; int 0 the joint +0x15e4; +0x15e0 (over the ctor's 0): 2 int
// 1, 8 int 2 (bic 0x59 / orrne), then bic 0x51, orr 0x50 -- 0x10 the owner's facing as the aim, 0x40 the thrown point from the OWNER's
// block +0x40 (0x4055b0); floats 0 speed +0x15ec, 2 gravity +0x15f4, 1 per unit +0x160c, 4 far +0x1600, 3 near +0x15fc, 5 life +0x15f8;
// &vec 0 -> BOTH points +0x161c / +0x1620; bytes +0x15c1 = +0x15c3 = 1 (the stage query 0x43ac8c: +0x15c3 -> 0x4a1f24, the query's last
// word 0x80 for 0x4a1e84's 0x40 -- the stand-in's floor answers both alike; what the two select is NOT READ). +0x1614, +0x15f0, the
// aim limits and +0x1630 the ctor's (0x404350: 0, the zero vector)
function params066s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: 0x50 | (I(1) !== -1 ? 2 : 0) | (I(2) !== -1 ? 8 : 0),
           speed0: F(0), speedPer: F(1), gravity: F(2), near: F(3), far: F(4), life: F(5), y1614: f(0.0), f15f0: f(0.0),
           limitA: f(0.0), limitB: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f) };
}
// +0x168 = 0x405500 with +0x15e0 0x5a (0x200 clear, 0x40 set, 4 clear: 0x4055b0..0x405648 -> 0x4059a8): from the OWNER's block point
// (x, z), the distance to the target clamped [near, far], along the aim (0x4053e4, 0x10: block +0x54 as it is), the setup's +0x20
// (+0x1624 -> +0x1650, the zero vector) added; the height the target's plus +0x1614
function thrown066s13(S, own){
  const k = S.k, P = own.ownerPos, T = own.target;
  const dx = f(T[0] - P[0]), dz = f(T[2] - P[2]);
  let d = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  d = k.near > d ? k.near : d;
  d = d > k.far ? k.far : d;
  const rad = f(u16(own.ownerY >>> 0) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  const ox = f(0.0 + S.centre[0]), oz = f(d + S.centre[2]);
  return [f(P[0] + mla(f(ox * cs), oz, sn)), f(T[1] + S.y1614), f(P[2] + mls(f(oz * cs), ox, sn))];
}
// 0x404dc8, the launch from the shell's point to that thrown point: the file's gravity (-1.0, not 0: no solve arm), the speed +0x15ec
// + +0x160c x the distance
function launch066s13(S, own){
  const k = S.k, T = thrown066s13(S, own), P = S.position;
  const dx = f(P[0] - T[0]), dz = f(P[2] - T[2]);
  let dy = f(T[1] - P[1]);
  dy = dy > 0 ? (k.f15f0 > 0 ? f(0.0) : dy) : dy;
  const dist = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  const speed = mla(k.speed0, k.speedPer, dist);
  const t = f(dist / speed);
  const vy = f(mla(dy, f(f(t * t) * k.gravity), f(-0.5)) / t);
  return { velocity: [f(0.0), vy, speed], acceleration: [f(0.0), k.gravity, f(0.0)], thrown: T, dist, speed, t };
}
// base13's init 0x4044d8 on +0x15e0 0x5a (READ 0x4046ac..0x404c48): joint -1 -> +0x40 = the owner's +0x40, |= 2; 0x80 clear -> the two
// points (both vec 0) at 0.5, turned by the owner's words (0x43ae70, flag 2), times the size (0xbe518, flag 8), added; the Y word toward
// the thrown point (vt+0x16c), the launch turned by it (+0x1630 the zero vector: no turn); the pitch ratio's second pair moves +0x40 by
// nothing (both points vec 0); ef 0 at +0x40; state 2
function init066s13(S, own){
  const k = S.k;
  S.centre = ZERO3.slice();
  S.y1614 = k.y1614;
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  if (k.joint !== -1 || !own.ownerPos || !own.target) return false;
  const W = [own.ownerX, own.ownerY, own.ownerZ], sz = size001(own);
  const pair = r => turnByWords([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)), W).map(v => f(sz * v));
  const m1 = pair(f(0.5));
  let pos = [f(m1[0] + own.ownerPos[0]), f(m1[1] + own.ownerPos[1]), f(m1[2] + own.ownerPos[2])];
  S.position = pos;
  const L = launch066s13(S, own);
  const a = wordOf(f(L.thrown[0] - pos[0]), f(L.thrown[2] - pos[2]));
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
  S.ratio = ratio;
  S.launch = { point: pos.slice(), thrown: L.thrown.slice(), aim: a, dist: L.dist, speed: L.speed, t: L.t, ratio,
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), life: S.lifetime, angles: [0, 0, 0] };
  S.timer = f(0.0);
  return true;
}
function make066s13(state, D, m, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell13 mode ' + m + ': no files in this arc' };
  if (!own.ownerPos || !own.target) return { why: 'no owner position / target (input.ownerPos, input.rock.target)' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params066s13(def, mode);
  if (!init066s13(S, own)) return { why: 'shell13 mode ' + m + ': its init path is not his (joint ' + S.k.joint + ')' };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// sp_13's landing 0xf65640 (READ whole), in state 2 only: types 0 / 1 -> vt+0x174 0xf6573c first (owner active: sp_01 0 at the contact,
// 0x3fa2bc: its words +0xfe8.. at +0x30, +0x3c the shell's +0x13dc, the zero vector at +0x20); type 1 then +0x40 = the contact and the
// words from the ground (0x43b1a0); type 0 -> ef 1 (+0x15cc), type 1 -> ef 2 (+0x15d0) at the contact (0x4042bc) and the end (vt+0x148,
// 0); type 2 -> ef 3 (+0x15d4, (999, -1)) and NO end -- it flies on; any other type: the end
function landing066s13(S, D, ctx, out){
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return 'keep';
  const n = S.events.length;
  if ((hit.type === 0 || hit.type === 1) && ctx && ctx.create)
    ctx.create(S, 'shell01', { mode: 0, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  if (hit.type === 1 && hit.normal){ S.position = hit.point.slice(); S.angles = groundAngles(S.angles, hit.normal); }
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
  for (const e of S.events.slice(n)) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
  if (hit.type === 2) return 'keep';
}

// ---- BASE16 (uShellEmBase16): Tetsucabra's / Drilltusk's slab (shell16) -- READ whole 2026-10-18 (dev/amphibian-shells-spec.md 1d) -----
// ctor 0x407de8 (0x43a78c; ef +0x15c8..+0x15d0 = 0, hits / ints +0x15d4..+0x15e8 = -1, floats +0x15ec..+0x15f8 = 0, vecs +0x15fc /
// +0x1600 the zero vector, handles +0x1604..+0x160c = 0, +4 = 0, +0x15a8 = 0x10), init 0x407ef0, update 0x4081e4 (0x4a1698; the two
// handles' hygiene; state 0xfe -> vt+0x158 0x4085fc, 1 -> vt+0x154 0x40827c), end vt+0x148 0x408684, vt+0x150 `bx lr`; vtable 0x17dd5cc,
// +0x15c / +0x160 0 (the next class's starts at +0x164, 0x17dd730). sp_16's reader 0xf65954: ef 0 / 1 / 2 -> +0x15c8 / +0x15cc / +0x15d0;
// hits 0 / 1 / 2 -> +0x15d4 / +0x15d8 / +0x15dc (the third the BodyDataList slot); ints 0 / 1 / 2 -> +0x15e0 / +0x15e4 / +0x15e8 (1 and 2
// the cameras); floats 0..3 -> +0x15ec..+0x15f8 (the four waits); &vec 0 -> +0x15fc (the offset), &vec 1 -> +0x1600 (the step). Its
// +0x98 0xf65ac8 starts ef +0x15d0 at a hunter's hit (none here)
function params066s16(mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const H = i => mode.hit && i < mode.hit.length ? mode.hit[i] : -1;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { hit0: H(0), hit1: H(1), body: H(2), i0: I(0), cam0: I(1), cam2: I(2), t0: F(0), t1: F(1), t2: F(2), t3: F(3), vec: V(0), step: V(1) };
}
// the init 0x407ef0 (the gates 0x43a850 and the owner unit's byte +0x50 bit 0 the viewer always passes): +0xfe8.. = block +0x50.. (the
// owner's words), state 1 / phase 0, the wait +0x1604 = +0x15ec; the point = the owner's +0x40 plus vec 0 turned by the block's +0x54
// halfword (x cos + z sin, z cos - x sin); +0x1000 = that point; the ray 0x183664 from it to 500 above -- the start p.y + max(500, 100)
// (0x1836e4..0x183724), straight down (stageQuery, mask 0x10, the stand-in's floor; the stage core NOT READ, as everywhere) -- no hit
// deletes the shell (vt+0x40), a hit sets y = the floor + BodyDataList[+0x15dc]'s first record's +0x10 x 0.25 (0x4a15bc -> the resource
// +0xc4 + 4 slot, 0x489e44; rBodyData vt+0x40 0x50fac = its +0x68, the file's records from +0x10: the .shl's list, def.body); ef 0 at
// the point (the rock's requester) -> +0x1608
function make16(state, D, m, ctx, own, action, frame){
  const def = D.shells.shell16, mode = def.modes[m];
  if (!mode) return { why: 'shell16 mode ' + m + ': no files in this arc' };
  if (!own.ownerPos) return { why: 'no owner position (input.ownerPos)' };
  const k = params066s16(mode), P = own.ownerPos, v = k.vec;
  const W = [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0];
  const r = f(u16(W[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const p = [f(P[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])];
  const anchor = p.slice();
  const top = f(p[1] + f(500.0)), d = f(top - p[1]), s = f((d > f(100.0) ? d : f(100.0)) + p[1]);
  const q = stageQuery([p[0], f(-1.0e9), p[2]], [p[0], s, p[2]], ctx.stage, 0x10);
  if (!q) return { why: 'shell16 mode ' + m + ': no floor below its point (the init deletes it, 0x4081b4)' };
  const R = k.body >= 0 && def.body && def.body[k.body] != null ? f(f(def.body[k.body]) * f(0.25)) : f(0.0);
  p[1] = f(q.point[1] + R);
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell16', cls: def.cls, globalId: def.id, base: 'base16', mode,
              modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1, phase: 0, k, position: p, anchor,
              angles: W.slice(), timer: k.t0, clock: f(0.0), moves: 0, events: [], place: null, start: null, stop: null, stops: [],
              effect: null, effect2: null, slots: null };
  S.start = rockRequest(D, mode, 0, p, 'shell16');
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  S.launch = { position: p.slice(), anchor: anchor.slice(), ground: q.point[1], lift: R, angles: W.slice(), timer: S.timer };
  return { S };
}
// the end 0x408684(shell, 0): ef +0x1608 stopped gracefully (0x43b058 -> 0x329c40(h, 0); null once the phase-1 kill has run), 0x4a1de4
// (the hit side), vt+0x150 (`bx lr`), state 0xfe, the wait +0x1604 = [0x162493c] x 60.0 (1800). +0x160c is not stopped: ef 1 runs out
function end16(S, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect && !S.effect.gone ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
  S.state = 0xfe; S.timer = ENDING_FRAMES;
  out.ended.push(S);
}
// the wait +0x1604 by the step (0x4082f8..0x408334, 0x408600..0x408634): > 0 -> less dt, floored at 0 (vselge); true while it stays > 0
function wait16(S, dt){
  if (!(S.timer > 0)){ S.timer = f(0.0); return false; }
  const t = f(S.timer - dt);
  S.timer = f(0.0) >= t ? f(0.0) : t;
  return t > 0;
}
// the update 0x4081e4 / the step 0x40827c / the ending 0x4085fc. State 1: the clock +0x1378 += dt, +0x1000 = +0x40; the wait; at its end
// the phase S+5: 0 -> 1, the wait = float 1, hit 0's registration (vt+0x140, not visual), BodyDataList[+0x15dc] on (0x4a15d4, not
// visual), the camera int 1 (0x43ac04); 1 -> 2, the wait = float 2, ef 0's handle KILLED (its vt+0x40 0x43384 -> 0x3290c0: vt+0xa0, the
// unit deleted -- the viewer stops it at once) and zeroed, ef 1 at +0x40 -> +0x160c; 2 -> 3, 0x4a1870 (the hit side), +0x40 += vec 1
// turned by +0xfec's halfword, the wait = float 3, hit 1's registration, the camera int 2; 3 -> the end. State 0xfe: the wait run out ->
// deleted; else both handles gone -> +4 = 0xff, deleted
function step16(S, ctx, input, D, out){
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, 0, S.effect)) S.effect.gone = true;
  if (S.effect2 && !S.effect2.gone && input.effectAlive && !input.effectAlive(S, 1, S.effect2)) S.effect2.gone = true;
  if (S.state === 0xfe){
    if (!wait16(S, ctx.dt)){ S.state = 0xff; return; }
    if (S.effect && !S.effect.gone) return;
    if (S.effect2 && !S.effect2.gone) return;
    S.state = 0xff;
    return;
  }
  if (S.state !== 1) return;
  S.clock = f(ctx.dt + S.clock);
  S.anchor = S.position.slice();
  if (wait16(S, ctx.dt)) return;
  const k = S.k;
  if (S.phase === 0){
    S.phase = 1; S.timer = k.t1;
    camera001(S, k.cam0);
  } else if (S.phase === 1){
    S.phase = 2; S.timer = k.t2;
    if (S.effect && !S.effect.gone){
      S.stops.push({ slot: 'start', mode: 1 }); S.events.push({ ev: 'stop', param: 0, key: S.effect.key, flag: 1, kill: true });
      S.effect.gone = true;
    }
    S.effect = null;
    const rq = rockRequest(D, S.mode, 1, S.position, 'shell16', listsOf(D, S));
    S.events.push(rq ? { ev: 'start', param: 1, kind: 'shell16', start: rq } : { ev: 'refused', param: 1, kind: 'shell16' });
    if (rq){ S.effect2 = { param: 1, key: rq.key, kind: 'shell16', move: S.moves }; out.started.push({ shell: S, start: rq }); }
  } else if (S.phase === 2){
    S.phase = 3;
    const v = k.step, r = f(u16(S.angles[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    const P = S.position;
    S.position = [f(P[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])];
    S.timer = k.t3;
    camera001(S, k.cam2);
  } else if (S.phase === 3) end16(S, out);
}

// THE TUSKS (part 0) as his spawners read them: 0x9d36c(e, 0) against .dtp row 0's / row 1's level (byte 1 below rank 5, byte 2 at it)
// -- input.tusk066 (motion-states.js tetsucabraTusks066: the level the parts show, 0 / 1 / 2)
function tusks066(D, input, own){
  const L = input.tusk066 == null ? 0 : input.tusk066 | 0, b = own.rank > 4 ? 1 : 0;
  return { L, below0: L < D.dtp066[0][b], below1: L < D.dtp066[1][b] };
}
// the spawners (code 'em066'): `slab066` the action start's sp_16 (the play's first step, the owner as it stands -- vt+0x204 runs before
// the action's first update); rows { frame, shell13 } / { frame, rocks: [two, one, none] } by pass001 on the previous pose
function spawn066(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001, T = tusks066(D, input, own);
  if (a.slab066){
    if (!fresh) return;
    const m = T.below0 || T.below1 ? 2 : 3;
    const r = make16(state, D, m, ctx, own, a.action, null);
    if (!r.S){ out.refused.push({ action: a.action, shell: 'shell16', mode: m, why: r.why }); return; }
    state.shells.push(r.S); out.spawned.push(r.S);
    return;
  }
  if (fresh || !state.hist || !state.prevJoints) return;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.shell === 'shell13'){
      const r = make066s13(state, D, sp.mode, own, ctx, a.action, sp.frame);
      if (!r.S){ out.refused.push({ action: a.action, shell: 'shell13', mode: sp.mode, why: r.why }); continue; }
      state.shells.push(r.S); out.spawned.push(r.S);
      continue;
    }
    const modes = sp.rocks[T.below0 ? 0 : T.below1 ? 1 : 2];
    for (const m of modes) makePlain(state, D, a, ctx, out, own, state.prevJoints, { frame: sp.frame, shell: 'shell00', mode: m });
  }
}
const act066 = (n, list, clip, spawns, x = {}) => Object.assign({ action: [7, n], code: 'em066', list, clip, pick: 'ai',
  variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns }, x);
for (const [mon, v4] of [['em066_00', false], ['em066_04', true]]){
  const id = v4 ? 0x11e : 0x11a, u = mon + 'u', dir = n => 'shell\\em\\' + mon + '_shell' + n;
  SHELL_DATA[mon] = {
    name: v4 ? 'Drilltusk Tetsucabra' : 'Tetsucabra',
    lists: { 0: { list: 'u', pel: u } },
    // .dtp array A rows 0 / 1, bytes 1 / 2 (em066_00_dtbparts / em066_04_dtbparts: the tusks' two break levels)
    dtp066: [[1, 1], [2, 2]],
    shells: {
      // shell00: the rocks off his tusks (u 20 flying, u 24 / 22 / 24 at a contact; 3, 4, 8..11 the snow maps' u 21 / 25 / 23)
      shell00: { id, cls: 'uShellEm066_sp_00', base: 'base00', reader: 0xf64f38, folder: dir('00'), modes: v4 ? @M00_04@ : @M00_00@,
                 hitdata: [[0, 99], [0, 99]] },
      // shell01: hit volumes (every mode (999, -1))
      shell01: { id: id + 1, cls: 'uShellEm066_sp_01', base: 'base01', reader: 0xf65250, folder: dir('01'), modes: v4 ? @M01_04@ : @M01_00@,
                 hitdata: [[0, 10], [0, 10], [10, 10], [0, 10]] },
      // shell13: the thrown rock (u 0 flying, u 2 / 1 at a contact)
      shell13: { id: id + 2, cls: 'uShellEm066_sp_13', base: 'base13', reader: 0xf65478, folder: dir('13'), modes: v4 ? @M13_04@ : @M13_00@,
                 hitdata: [[0, 99]] },
      // shell16: the slab (u 30 / 32 rising, u 40 / 42 at its second phase; 0 / 1 the snow maps' 31 / 33, 41 / 43; 100..111 a hunter's
      // hit). body: the BodyDataList's first records' radius (+0x10), slots 0 / 1 (the .shl's list: _16_00_ / _16_01_bodydata)
      shell16: { id: id + 3, cls: 'uShellEm066_sp_16', base: 'base16', reader: 0xf65954, folder: dir('16'), modes: v4 ? @M16_04@ : @M16_00@,
                 body: v4 ? [380.0, 350.0] : [360.0, 160.0], hitdata: [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10]] },
    },
    actions: [
      act066(0x55, '4', 'Motion[1]', [{ frame: 124, rocks: [[0, 1], [2], []] }], { also: [[7, 0x83], [7, 0x85]] }),
      act066(0x56, '4', 'Motion[2]', [{ frame: 124, rocks: [[5, 6], [7], []] }], { also: [[7, 0x84], [7, 0x86]] }),
      act066(0x21, '2', 'Motion[12]', [{ frame: 58, shell: 'shell13', mode: 0 }], { also: [[7, 0x22], [7, 0x36], [7, 0x37]] }),
      act066(0x89, '4', 'Motion[30]', [], { slab066: true, also: [[7, 0x77]] }),
    ],
  };
}
