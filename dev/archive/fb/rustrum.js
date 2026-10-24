
// ---- RUSTRUM DURAMBOROS (em061_04): uEm061_00 at variant 4 -------------------------------------------------------------------
// READ 2026-10-18 (dev/rom-map.md "Fanged Beasts -- the shells", the em061 rows; dev/em061-shells-spec.md). His ids (vt+0x158
// 0xf23ec0, variant 4): +0xcac8 0x108 sp_00, +0xcacc 0x109 sp_01, +0xcad0 0x10a sp_13, +0xcad4 0x10b sp_19, +0xcad8 0x10c sp_24.
// The same class code as Duramboros's; what differs is the files, the 0x108 / 0x10b reader arms (0xf3304c / 0xf34608), and the
// three shells only he makes:
//   sp_24 (uShellEm061_sp_24 over a NEW base, base24: ctor 0x40da80 over the plain shell 0x43a78c, not base00) -- the rust lump.
//     L9 M2 (7, 0xf1 / 0xf2 / 0xf9 / 0xfc) f85 THROWS mode 0, L9 M10 (7, 0xfa / 0xff) f104 throws mode 1 (+0xcae0 = 0); L9 M3
//     (7, 0xed / 0xee / 0xf5) at its start PLACES mode 0 on the ground ahead when none is held (setup +0x12 = 1: 0x40e6f0), and
//     (7, 0xe5) -- L9 M10 from frame 182 -- places mode 1. The last one made is HELD at e+0xcadc; it sits where it landed until
//     its life runs out.
//   L9 M3 at frame 32 rolls the held lump as sp_19 (0xf34a20: mode 8 for 0xed, 7 for 0xee, 2 for 0xf5) -- base19 with the
//     variant-4 reader: the ball takes the lump's point and words, its Y aimed at the target and clamped (flag 2), and (modes
//     7 / 8) turns toward the target side up to a limit (+0x1664 bit 3).
//   (7, 0xe5) at 184 lifts it as sp_13 (0xf34b4c): base13 held on joint 15 while the motion is L9 M10 / M11 (0xf33e40), thrown
//     when L9 M11 (7, 0xf6) reaches 59 (e+0xcae0 = 2), bursting on the ground into sp_01 1 and sp_00 23 / 24 / 25 (0xf33b1c).

// sp_24's reader 0xf34c74 (id 0x10c, READ whole): ef 0 / 1 / 2 -> +0x15c8 (flight) / +0x15cc (the end's) / +0x15d0 (the landing's);
// hit 0 / 1 -> +0x15d4 / +0x15d8; int 0 the joint +0x15dc; +0x15e0: 0x10 int 1, 0x20 int 2, 2 int 3, 4 always, 0x40 int 4; floats
// 0..6 -> +0x15e8 (Y degrees) .. +0x1600 (the spin, degrees a second); &vec 1 -> +0x1604 (the offset), &vec 0 -> +0x1608 (gravity)
function params061s24(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: 4 | (I(1) !== -1 ? 0x10 : 0) | (I(2) !== -1 ? 0x20 : 0) | (I(3) !== -1 ? 2 : 0) | (I(4) !== -1 ? 0x40 : 0),
           x15e4: f(0.0),                                   // +0x15e4: the ctor's 0 (the X degrees, 0x40e070)
           yDeg: F(0), dist: F(1), vy: F(2), life: F(3), radius: F(4), size: F(5), spin: F(6), offset: V(1), gravity: V(0) };
}
// base24's ray 0x183664 (from 10000 below the point to 10000 above, mask 0x40): the stage stand-in's floor; null for none
const ray24 = (p, stage) => {
  const q = stageQuery([p[0], f(p[1] + f(-10000.0)), p[2]], [p[0], f(p[1] + f(10000.0)), p[2]], stage, 0x10);
  return q ? q.point[1] : null;
};
// the angle words' turn of a vector, X, Y then Z (base24's 0x40df7c / 0x40e108; rotXYZ's order)
// base24's init 0x40dc14 (READ whole). `own` = owner001; setup.placed = setup +0x12 (1: 0x40e6f0 at the end)
function init24(S, J, own, ctx, setup){
  const k = S.k;
  const sc = (k.flags & 0x40) ? size001(own) : f(1.0);              // 0xbe518 with 0x40
  S.off = [f(0.0), f(-k.radius), f(0.0)];                            // +0x1620.. (re-made below)
  S.angles = [own.ownerX >>> 0, own.ownerY >>> 0, 0];               // block +0x50 / +0x54, 0 (0x40dd08..0x40dd20)
  S.state = 1;
  S.life = k.life;                                                   // +0x160c = +0x15f4
  let p, o, flags = k.flags;
  if (k.joint !== -1){
    // 0xc15a4: the joint's row 3, the offset through its 3x3 (bit 0 clear: 0x40df20..0x40df74), no size on this arm
    const M = jointMatrix(J, k.joint);
    if (!M) return false;
    p = [f(M[12]), f(M[13]), f(M[14])];
    const [x, y, z] = k.offset;
    o = [mla(mla(f(y * M[4]), x, M[0]), z, M[8]), mla(mla(f(y * M[5]), x, M[1]), z, M[9]), mla(mla(f(y * M[6]), x, M[2]), z, M[10])];
  } else {
    if (!own.ownerPos) return false;
    p = own.ownerPos.slice();                                        // the owner's +0x40 (0x40deb0), +0x15e0 |= 1
    flags |= 1;
  }
  // the degree offsets (0x40e070..0x40e0b0): X += +0x15e4, Y += float 0, each u16(s32(0.5 + deg x 182.04)) added (uxtah); the
  // spin +0x1638 = u16(s32(0.5 + float 6 x 182.04)) / 60 (umull 0x88888889 >> 37)
  S.angles[0] = (S.angles[0] + u16(s32(mla(0.5, k.x15e4, DEG_TO_U16)))) >>> 0;
  S.angles[1] = (S.angles[1] + u16(s32(mla(0.5, k.yDeg, DEG_TO_U16)))) >>> 0;
  S.spin = Math.floor(u16(s32(mla(0.5, k.spin, DEG_TO_U16))) / 60);
  // (flags & 9) == 1 -- the owner's arm: the offset turned by the words as they now are (0x40e108..0x40e1d4), times 0xbe518 with bit 2
  // (always set). (The first turn at 0x40df7c, by the words before the offsets and times 0xbec34, is overwritten: not kept here)
  if ((flags & 9) === 1){
    o = rotXYZ(k.offset, S.angles);
    if (flags & 4){ const z = size001(own); o = o.map(v => f(v * z)); }
  }
  p = [f(o[0] + p[0]), f(o[1] + p[1]), f(o[2] + p[2])];             // 0x40e1ec..0x40e20c
  if (!setup.placed){
    // the ground under it (0x40e230..0x40e314): y = the ray's height less the offset's y
    const g = ray24(p, ctx.stage);
    if (g != null) p = [p[0], f(g - k.offset[1]), p[2]];
  }
  S.position = p;
  S.anchor = p.slice();                                              // +0x1000.. (0x40e320)
  S.gravity = gravityOf(k.gravity, S.angles[1]);                     // +0x1020.. = (0, g.y, g.z), x / z turned by the Y word
  // the launch (0x40e3e4..0x40e544): the fall from the offset's height to the lump's own radius x size below it, under gravity's y,
  // with float 2 up; the horizontal speed covers float 1 less the offset's z in that time; then turned by X, Y, Z
  const s16 = sc, gy = S.gravity[1];
  let s2 = mls(k.offset[1], k.radius, k.size);
  const s18 = f(gy * 0.5);
  s2 = f(s16 * s2);
  s2 = f(f(s18 * f(-4.0)) * s2);
  s2 = mla(s2, k.vy, k.vy);
  const t = f(f(f(-k.vy) - sqrtf(s2)) / f(s18 + s18));
  const vz0 = f(f(s16 * f(k.dist - k.offset[2])) / t);
  const rx = f(u16(S.angles[0]) * U16_TO_RAD), sX = sinf(rx), cX = cosf(rx);
  const vy1 = mls(f(k.vy * cX), vz0, sX), vz1 = mla(f(vz0 * cX), k.vy, sX);
  const ry = f(u16(S.angles[1]) * U16_TO_RAD), sY = sinf(ry), cY = cosf(ry);
  const vx2 = mla(f(0 * cY), vz1, sY), vz2 = mls(f(vz1 * cY), 0, sY);
  const rz = f(u16(S.angles[2]) * U16_TO_RAD), sZ = sinf(rz), cZ = cosf(rz);
  S.velocity = [mls(f(vx2 * cZ), vy1, sZ), mla(f(vy1 * cZ), vx2, sZ), vz2];
  S.launch = { point: p.slice(), angles: S.angles.slice(), velocity: S.velocity.slice(), t, placed: !!setup.placed };
  // ef 0 at +0x40 (0x40e548..0x40e5c4), then the scale (0x40e634..0x40e66c): size(0x40) x float 5 -> the unit and +0x1634; the
  // contact offset +0x1624 = -(that x float 4)
  S.scale24 = f(sc * k.size);
  S.off = [f(0.0), f(-f(S.scale24 * k.radius)), f(0.0)];
  if (flags & 0x10) S.angles = [0, 0, 0];                            // 0x40e6a0
  S.flags = flags;
  return true;
}
// 0x40e6f0: the lump put on the ground ahead of its owner -- mode 1: 200 + float 4 x float 5, mode 0: the offset's z + 300 (else 0),
// times size(0x40), along the owner's words (Z, X, Y order of this code) from its +0x40; the ray's height there, then the landing
// (vt+0x150) with type 1
function snap24(S, own, ctx, D){
  const k = S.k;
  const sc = (k.flags & 0x40) ? size001(own) : f(1.0);
  const d0 = S.modeIndex === 1 ? mla(f(200.0), k.radius, k.size) : S.modeIndex === 0 ? f(k.offset[2] + f(300.0)) : null;
  const s19 = d0 == null ? f(0.0) : f(sc * d0);
  const ax = f(u16(own.ownerX) * U16_TO_RAD), sX = sinf(ax), cX = cosf(ax);
  const ay = f(u16(own.ownerY) * U16_TO_RAD), sY = sinf(ay), cY = cosf(ay);
  const az = f(u16(own.ownerZ) * U16_TO_RAD), sZ = sinf(az), cZ = cosf(az);
  const s21 = mla(f(s19 * cX), sX, 0.0);
  const s23 = mla(f(cY * 0.0), sY, s21);
  const s25 = mls(f(cX * 0.0), s19, sX);
  const P = own.ownerPos;
  const pt = [f(P[0] + mls(f(s23 * cZ), s25, sZ)), f(P[1] + mla(f(s25 * cZ), sZ, s23)), f(P[2] + mls(f(s21 * cY), sY, 0.0))];
  const g = ray24(pt, ctx.stage);
  if (g == null) return;
  landing24(S, D, [pt[0], g, pt[2]], 1);
}
// vt+0x150 0x40d808 (READ whole): once landed, nothing; type 0 -> the end (vt+0x148, 0); type 1 -> landed (+0x1631): +0x40 = the
// contact less +0x1620.., the velocity and gravity zero, +0x15e0 |= 2 (no turn from the velocity), ef 2 at +0x40 (handle +0x1614);
// (the hit slots off without 0x20: not visual); any other type, nothing
function landing24(S, D, point, type){
  if (S.landed) return;
  if (type === 0){ S.ended24 = 'end'; return; }
  if (type !== 1) return;
  S.landed = true;
  S.position = [f(point[0] - S.off[0]), f(point[1] - S.off[1]), f(point[2] - S.off[2])];
  S.velocity = ZERO3.slice(); S.gravity = ZERO3.slice();
  S.flags |= 2;
  contactStart(S, D, 2, S.position, 'landing');
}
// base24's state-1 step 0x40ea90 (READ whole): the flight 0x40ec60 first (anchor = +0x40 + (0, 1, 0); 0x539224; unless 2, the words
// from the velocity), the life (+0x160c by dt: at 0 the end), the spin while in the air (X word += the spin x dt, through floats),
// then the rocks' query 0x43ac8c (mask 0x30) with the contact offset +0x1620 -> the landing
function move24(S, ctx, D){
  S.anchor = [f(S.position[0] + 0.0), f(S.position[1] + 1.0), f(S.position[2] + 0.0)];
  stepFlight(S, ctx.dt);
  if (!(S.flags & 2)){
    const [vx, vy, vz] = S.velocity;
    const h = sqrtf(mla(f(vz * vz), vx, vx));
    S.angles = [u16(s32(mla(0.5, atan2f(f(-vy), h), RAD_TO_U16))), u16(s32(mla(0.5, atan2f(vx, vz), RAD_TO_U16))), S.angles[2]];
  }
  if (!(S.k.life > 0)) throw new Error('shells.js: a base24 lump with life ' + S.k.life + ' (0x40eb20, the hit slots: not transcribed)');
  const T = S.life;
  if (!(T > 0)){ S.life = 0; return 'end'; }
  const t = f(T - ctx.dt);
  S.life = (0 >= t) ? 0 : t;
  if (!(t > 0)) return 'end';
  if (!S.landed){
    const x = f(mla(f(S.angles[0] >>> 0), f(S.spin), ctx.dt));
    S.angles[0] = x >= 4294967296 ? 0xffffffff : Math.max(0, Math.trunc(x)) >>> 0;
  }
  const hit = collide(S, S.off, ctx.stage);
  if (hit){ landing24(S, D, hit.point, hit.type); S.events.push({ ev: 'hit', point: hit.point, type: hit.type }); }
  if (S.ended24){ delete S.ended24; return 'end'; }
  return 'keep';
}
// base24's end 0x40ed6c (READ whole): the flight's handle stopped, then vt+0x154 0x40d9c8 -- unless converted (+0x1630), ef 1 at
// +0x40 (handle +0x1614) --, state 0xfe, +0x160c = 30 x 60 frames
function end24(S, D, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
  if (!S.converted && S.mode.ef[1]){
    contactStart(S, D, 1, S.position, 'end');
    const e = S.events[S.events.length - 1];
    if (e && e.ev === 'start') out.started.push({ shell: S, start: e.start });
  }
  S.state = 0xfe;
  S.life = ENDING_FRAMES;
  out.ended.push(S);
}
// one lump's update (vt+0x24 0x40e984): the handles whose unit left states 1 / 2 dropped; state 1 the step, 0xfe the ending
// (+0x160c by dt; at 0, or with both handles gone, state 0xff)
function step24(S, ctx, input, D, out){
  S.events = [];
  S.place = null;
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.effect2 && !S.effect2.gone && !alive(S.effect2)) S.effect2.gone = true;
  if (S.state === 1){
    S.moves++;
    const r = move24(S, ctx, D);
    for (const e of S.events) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
    if (r === 'end') end24(S, D, out);
  } else if (S.state === 0xfe){
    const T = S.life;
    if (!(T > 0)){ S.life = 0; S.state = 0xff; return; }
    const t = f(T - ctx.dt);
    S.life = (0 >= t) ? 0 : t;
    if (!(t > 0)) S.state = 0xff;
    else if (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone)) S.state = 0xff;
  }
}
function make24(state, D, m, J, own, ctx, action, frame, placed){
  const def = D.shells.shell24, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell24', cls: def.cls, globalId: def.id, base: 'base24',
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1, landed: false, converted: false,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, off: null,
              life: 0, spin: 0, moves: 0, launch: null, events: [], folder: def.folder, effect: null, effect2: null,
              start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params061s24(def, mode);
  if (!init24(S, J, own, ctx, { placed })) return null;
  S.unitScale = S.scale24;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.launch.point, 'flight', lists);    // ef 0 at +0x40 before the snap (0x40e548)
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  if (placed){ S.events = []; snap24(S, own, ctx, D); }                  // setup +0x12 == 1 (0x40e6b4)
  return S;
}

// sp_19's reader for 0x10b (0xf34608, READ whole): ef 0 -> +0x15c8, hit 0 -> +0x15d8, hit 1 -> +0x1700; int 0 the joint; +0x15e8 |=
// 0x80, then 0x10 int 1, 0x20 int 1 again, 0x400 int 2, 2 int 3; floats 0 speed +0x15f4, 1 life +0x15fc, 8 / 9 the Y clamp +0x1608 /
// +0x160c, &vec 0 the offset +0x1610; ef 1 -> +0x1660; cmn floats 0 / 1 / 2 -> +0x1674 / +0x1678 / +0x167c, float 6 -> +0x1680;
// float 10 -> +0x1668 (the turn rate, degrees a frame); int 4 -> +0x1664 bit 3 (the turn); floats 2 / 3 / 4 / 5 / 7 / 11 -> size 0
// +0x1708, size 1 +0x170c, the grow +0x1710, the rise +0x1714, the delay +0x1718, the turn's limit +0x171c (degrees)
function params061s19v4(def, mode){
  const sh = mode.sh, c = def.cmn, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0), cF = i => i < c.floats.length ? f(c.floats[i]) : f(0);
  const I = i => i < sh.ints.length ? sh.ints[i] : -1;
  const flags = 0x80 | (I(1) !== -1 ? 0x30 : 0) | (I(2) !== -1 ? 0x400 : 0) | (I(3) !== -1 ? 2 : 0);
  return { joint: I(0), ground: -1, fanDeg: f(0.0), degX: f(0.0), yDeg: f(0.0), speed: F(0), life: F(1), vec: (sh.vecs[0] || ZERO3).map(f), flags,
           yLo: F(8), yHi: F(9), aimOff: ZERO3.slice(), from: ZERO3.slice(),
           reachUp: cF(0), reachDown: cF(1), followUp: cF(2), followDown: F(6), reach: f(500.0), follow: f(250.0),
           size0: F(2), size1: F(3), grow: F(4), rise: F(5), delay: F(7), turn: I(4) !== -1, turnRate: F(10), turnLimit: F(11), slope: false };
}
// base00's init 0x3f8b80 on the variant-4 ball's flags (READ 0x3f8c60..0x3f8fdc and the Y adjust 0x3f9cc4), then base03's 0x3fd9d8
// (init03's second half) and base19's 0x408ea0. The point: 0x10 -> the setup's +0x10 (the lump's +0x40), else the joint; the offset
// through the joint's 3x3 (or none on the 0x10 arm: the matrix there is the identity the init starts with), times the size with
// 0x80. The words: 0x20 -> the setup's (the lump's), else the owner's X / Y and 0; X += +0x15ec (0); Y with 2 the aim's Y less the
// owner's facing, clamped to [+0x1608, +0x160c] (yAdjust37: from the owner's point, flag 4 clear), else += +0x15f0 (0)
function init19v4(S, def, J, got, ctx, setup){
  const k = S.k;
  let p, o;
  const [x, y, z] = k.vec;
  if (k.flags & 0x10){
    p = setup.position.map(f);
    o = [x, y, z];
  } else {
    const M = jointMatrix(J, k.joint);
    if (!M) return false;
    p = [f(M[12]), f(M[13]), f(M[14])];
    o = [mla(mla(f(y * M[4]), x, M[0]), z, M[8]), mla(mla(f(y * M[5]), x, M[1]), z, M[9]), mla(mla(f(y * M[6]), x, M[2]), z, M[10])];
  }
  if (k.flags & 0x80){ const sz = size001(got); o = o.map(v => f(v * sz)); }
  p = [f(o[0] + p[0]), f(o[1] + p[1]), f(o[2] + p[2])];
  const A = (k.flags & 0x20) ? setup.angles.map(w => w >>> 0) : [got.ownerX >>> 0, got.ownerY >>> 0, 0];
  A[0] = (A[0] + u16(s32(mla(0.5, k.degX, DEG_TO_U16)))) >>> 0;
  A[1] = (A[1] + yAdjust37(k, p, got)) >>> 0;
  S.angles = A;
  S.timer = k.life;
  S.position = p;
  S.anchor = p.slice();
  // base03's init: the ground under the point (below +0x1678, above +0x1674), y the contact's; the velocity from the words, X 0
  const qa = [p[0], f(p[1] - k.reachDown), p[2]], qb = [p[0], f(p[1] + k.reachUp), p[2]];
  const hit = stageQuery(qa, qb, ctx.stage, 0x10);
  S.launch = { point: p.slice(), angles: A.slice(), query: [qa, qb], ground: hit ? hit.point.slice() : null };
  if (!hit) return false;
  S.position = [p[0], hit.point[1], p[2]];
  S.anchor = S.position.slice();
  S.velocity = launchVelocity(0.0, k.speed, [0, A[1], A[2]]);
  S.launchVelocity = S.velocity.slice();
  S.launch.velocity = S.velocity.slice();
  // base19's init: 0x400 -> both sizes times the owner's (0xbe518); +0x44 += (grow != 0 ? size 0 : size 1) x the rise; bit 3 -> the
  // turn's start word +0x1730 (the Y word) and side +0x1728: 1, or -1 when (s32(0.5 + atan2 to the target x 10430.378) - +0x1730)
  // has bit 15 set
  if (k.flags & 0x400){ const sz = size001(got); k.size0 = f(sz * k.size0); k.size1 = f(sz * k.size1); }
  init19(S);
  if (k.turn){
    S.turnFrom = S.angles[1] >>> 0;
    const T = got.target;
    const w = s32(mla(0.5, atan2f(f(T[0] - S.position[0]), f(T[2] - S.position[2])), RAD_TO_U16));
    S.turnSide = ((w - S.turnFrom) & 0x8000) ? -1 : 1;
    S.turned = 0;
  }
  return true;
}
// base19's step 0x408ffc, the turn first (bit 3, 0x409018..0x409104): while +0x172c x 360/65536 is below the limit +0x171c, +0x172c
// += s32(dt x f32(u16(s32(0.5 + rate x 182.04)))); the Y word = u16(+0x1730 + side x +0x172c); the velocity (0, 0, speed) turned by it
function turn19(S, ctx){
  const k = S.k;
  if (f(f(S.turned >>> 0) * U16_TO_DEG) < k.turnLimit)
    S.turned = (S.turned + Math.trunc(f(ctx.dt * f(u16(s32(mla(0.5, k.turnRate, DEG_TO_U16))))))) >>> 0;
  const w = u16((S.turnFrom + Math.imul(S.turnSide, S.turned)) >>> 0);
  S.angles[1] = w;
  const r = f(w * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  S.velocity = [mla(f(cs * 0.0), k.speed, sn), f(0.0), mls(f(k.speed * cs), sn, 0.0)];
}
function make061s19v4(state, D, m, J, own, ctx, action, frame, setup){
  const def = D.shells.shell19, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell19', cls: def.cls, globalId: def.id, base: 'base19',
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              launchVelocity: null, timer: 0, moves: 0, ground: 0, launch: null, events: [], folder: def.folder,
              effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params061s19v4(def, mode);
  if (!init19v4(S, def, J, own, ctx, setup || { position: ZERO3.slice(), angles: [0, 0, 0] })) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.launch.point, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}

// sp_13's reader 0xf33858 (id 0x10a, READ whole): ef 0 / 1 / 2 -> +0x15c8 / +0x15cc / +0x15d0, ef 3 -> +0x1690 (the crumble);
// hit 0 / 1 -> +0x15d8 / +0x1688; int 0 the joint +0x15e4; +0x15e0 = (f & ~0x103) | 0x101 | (int 1 != -1 ? 2 : 0), 8 int 2; floats
// 0 speed +0x15ec, 1 speed per unit +0x160c, 2 the arc's height +0x15f0, 3 near +0x15fc, 4 far +0x1600, 5 life +0x15f8, 6 the
// scale +0x1618; the aim limits +0x1604 / +0x1608 = -0.01 / 0.01; &vec 0 -> +0x161c; byte +0x15c1 = 1. The ctor 0xf33710 (over
// base13's 0x404350): +0x167c 0, the blend +0x1680 0 of +0x1684 = 5, +0x1688 / +0x168c / +0x1690 0
function params061s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: 0x101 | (I(1) !== -1 ? 2 : 0) | (I(2) !== -1 ? 8 : 0),
           speed0: F(0), speedPer: F(1), f15f0: F(2), near: F(3), far: F(4), life: F(5), scale: F(6), gravity: f(0.0),
           limitA: f(-0.009999999776482582), limitB: f(0.009999999776482582), vec: (sh.vecs[0] || ZERO3).map(f), y1614: f(0.0), blendN: 5 };
}
// 0x404dc8 with +0x15f0 > 0 and +0x15f4 = 0 (launch13n's arm) to a given point
function launch13r(S, T){
  const k = S.k, P = S.position;
  const dx = f(P[0] - T[0]), dz = f(P[2] - T[2]);
  const dy0 = f(T[1] - P[1]);
  const dy = k.f15f0 > 0 ? (dy0 > 0 ? f(0.0) : dy0) : dy0;
  const dist = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  const speed = mla(k.speed0, k.speedPer, dist);
  const t = f(dist / speed);
  let g = k.gravity;
  if (k.f15f0 > 0 && k.gravity === 0){
    const a = sqrtf(f(k.f15f0 + k.f15f0)), h2 = f(k.f15f0 - dy), b = sqrtf(f(h2 + h2));
    const q = f(f(a + b) / t);
    g = f(-f(q * q));
  }
  const vy = f(mla(dy, f(f(t * t) * g), f(-0.5)) / t);
  return { velocity: [f(0.0), vy, speed], acceleration: [f(0.0), g, f(0.0)], thrown: T, dist, speed, t };
}
// base13's init 0x4044d8 on his flags 0x109 (READ whole): the joint's row 3 (0xc15a4, joint 15); the two points [+0x161c] (vec 0)
// and [+0x1620] (the zero vector 0x1620e60's, the ctor's null) at 0.5, through the joint's 3x3 (flag 2 clear), times the size
// (flag 8), added; the thrown point (vt+0x168 0x405500: flags without 0x200 / 0x40 / 4 -- the distance from the shell to the target
// clamped [near, far] along the aim 0x4053e4 from the shell (0x20 clear), the height the target's), the Y word toward it, the
// launch and its velocity by that word; the pitch ratio +0x163c from it (init022s13's) moves +0x40 from the first pair's point to
// that ratio's; ef 0 at +0x40; the scale +0x1618; state 2 - (flags & 1) = 1. Then sp_13's own init 0xf33784: flag 8 -> the unit's
// scale = float 6 x the size (0x43ab74), and +0x40 = the setup's +0x10 (the lump's point)
function init13r(S, J, own, setup){
  const k = S.k;
  S.centre = setup.centre.slice();
  S.y1614 = k.y1614;
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const turn = p => [mla(mla(f(M[4] * p[1]), M[0], p[0]), M[8], p[2]), mla(mla(f(M[5] * p[1]), M[1], p[0]), M[9], p[2]),
                     mla(mla(f(M[6] * p[1]), M[2], p[0]), M[10], p[2])];
  const sz = size001(own);
  const pair = r => turn([0, 1, 2].map(i => mla(k.vec[i], f(f(0.0) - k.vec[i]), r))).map(v => (k.flags & 8) ? f(sz * v) : v);
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
  S.launch = { point: pos.slice(), thrown: T.slice(), aim: a, ratio, velocity: S.velocity.slice(), gravity: S.gravity.slice() };
  S.position = setup.position.map(f);                                // sp_13's init: +0x40 = setup +0x10
  S.anchor = S.position.slice();
  S.unitScale = (k.flags & 8) ? f(k.scale * sz) : k.scale;
  S.timer = f(0.0);
  return true;
}
// sp_13's state 1, vt+0x15c 0xf33e40 (READ whole): the anchor = +0x40; while the owner's motion is L9 M10 / M11 (+0x4b4 >> 1 ==
// 0x485), HELD: the first update makes the joint-parented coordinate (0x8a46a0, its parent the owner's joint +0x15e4, its local
// point vec 0, inherit mode 2 -- the parent's rotation dropped, 0x8a56e8: so the words it gives are 0); each update its world
// point is the joint matrix applied to vec 0 (0x29d00); +0x40 blends toward it, f = 0.2 + 0.8 x i / 5 for the first five updates,
// then takes it. e+0xcae0 == 2 (L9 M11 at 59) -> THROWN: state 2, the thrown point (vt+0x168), the Y word toward it, the launch
// (0x404dc8) and its velocity by that word. Any other motion -> ef 3 (+0x1690) at the unit's point (+0xe0, INFERRED the position)
// and the end
function hold13r(S, ctx, D, out, own, state){
  S.anchor = S.position.slice();
  const m = ctx.ownerMotion;
  if (m == null || (m >>> 1) !== 0x485){
    if (S.mode.ef[3]){
      const rq = rockRequest(D, S.mode, 3, S.position, 'end', listsOf(D, S));
      S.events.push(rq ? { ev: 'start', param: 3, kind: 'end', start: rq } : { ev: 'refused', param: 3, kind: 'end' });
      if (rq) out.started.push({ shell: S, start: rq });
    }
    return 'end';
  }
  const M = jointMatrix(ctx.J, S.k.joint);
  if (!M) return 'keep';
  const v = S.k.vec;
  const A = [mla(mla(mla(f(v[1] * M[4]), v[0], M[0]), v[2], M[8]), 1.0, M[12]),
             mla(mla(mla(f(v[1] * M[5]), v[0], M[1]), v[2], M[9]), 1.0, M[13]),
             mla(mla(mla(f(v[1] * M[6]), v[0], M[2]), v[2], M[10]), 1.0, M[14])];
  S.angles = [0, 0, 0];
  S.blend = S.blend || 0;
  if (S.blend < S.k.blendN){
    const r = mla(f(0.2), f(f(S.blend) / f(S.k.blendN)), f(0.8)), q = f(1.0 - r);
    S.position = [0, 1, 2].map(i => mla(f(q * S.position[i]), A[i], r));
    S.blend++;
  } else S.position = A.slice();
  if (state.cae0 === 2){
    S.state = 2;
    const T = thrown13(S, S.k, own);
    const a = atan2f(f(T[0] - S.position[0]), f(T[2] - S.position[2]));
    const L = launch13r(S, T);
    S.gravity = L.acceleration.slice();
    const w = u16(s32(mla(0.5, a, RAD_TO_U16)));
    const rad = f(w * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
    const [vx, vy, vz] = L.velocity;
    S.velocity = [mla(f(vx * cs), vz, sn), vy, mls(f(vz * cs), vx, sn)];
    S.throw = { thrown: T.slice(), word: w, velocity: S.velocity.slice(), gravity: S.gravity.slice(), dist: L.dist, t: L.t };
  }
  return 'keep';
}
// sp_13's landing +0x150 0xf33a8c (READ whole), in state 2 only: type 0 -> ef 1 (+0x15cc), type 1 -> ef 2 (+0x15d0), each at the
// contact (0x4042bc), then the burst 0xf33b1c and the end; type 2 -> +0x15d4 (no ef: nothing), no end. The burst (owner active,
// mode 0): sp_01 1 (0x3fa2bc: the contact at +0x10, the words at +0x30, +0x3c the shell's +0x13dc) and sp_00 0x17 / 0x18 / 0x19
// (0x3f883c: the contact at +0x10, the words (0, the shell's Y word, 0) at +0x20 -- the zero vector 0x1620e60's x / z)
function landing061s13(S, D, ctx, out){
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return 'keep';
  if (hit.type === 2) return 'keep';
  const param = hit.type === 0 ? 1 : 2;
  if (S.mode.ef[param]){
    const rq = rockRequest(D, S.mode, param, hit.point, 'landing', listsOf(D, S));
    S.events.push(rq ? { ev: 'start', param, kind: 'landing', start: rq } : { ev: 'refused', param, kind: 'landing' });
    if (rq){ S.effect2 = { param, key: rq.key, kind: 'landing', move: S.moves }; out.started.push({ shell: S, start: rq }); }
  }
  if (S.modeIndex === 0 && ctx.create){
    ctx.create(S, 'shell01', { mode: 1, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
    const own0 = ctx.own001;
    for (const m of [0x17, 0x18, 0x19]){
      const own = Object.assign({}, own0, { requestPos: hit.point.slice(), requestAngles: [0, S.angles[1] >>> 0, 0] });
      const S2 = make00n(ctx.shellState, D, m, ctx.J, own, ctx, S.action, null);
      S.events.push({ ev: 'create', stepped: true, shell: 'shell00', id: D.shells.shell00.id, mode: m, position: hit.point.slice(),
                      angles: [0, S.angles[1] >>> 0, 0], child: S2 ? S2.id : null, deleted: !S2 });
      if (S2){ S2.creator = S.id; S2.createdAtMove = S.moves; ctx.shellState.shells.push(S2); out.spawned.push(S2); }
    }
  }
}
function make061s13(state, D, own, ctx, action, frame, setup){
  const def = D.shells.shell13, mode = def.modes[0], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: 'base13',
              mode, modeIndex: 0, action, spawnFrame: frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [], blend: 0,
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params061s13(def, mode);
  if (!init13r(S, ctx.J, own, setup)) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.launch.point, 'flight', lists);     // ef 0 at +0x40 in base13's init, before sp_13's move
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}

// the held lump e+0xcadc: live while its state is not 0xfe / 0xff (0xf2fe18..0xf2fe28; +0x15c0, a hunter's break, never set here)
const held24Live = state => !!state.held24 && (state.held24.state & 0xfe) !== 0xfe;
// the conversions, on the held lump in state 1 that has landed (0x40da70, +0x1631): 0xf34a20 -> sp_19 `mode` (0x3fd7e0(0x50): its
// +0x40 at +0x10, its words at +0x20, +0x2e 0xffff, +0x30.. the zero vector), 0xf34b4c -> sp_13 0 (0x4041a8(0x40): +0x10 its point,
// +0x20 the zero vector, +0x34 its +0x13dc); both set +0x1630 (no end effect) and end it (vt+0x148, 0)
function convert24(state, D, ctx, out, to, mode, a, frame){
  const L = state.held24;
  if (!L || L.state !== 1 || !L.landed) return;
  const own = ctx.own001;
  if (!own.target){ out.refused.push({ action: a.action, shell: to, mode, why: 'no target (input.rock.target): the ' + (to === 'shell13' ? 'throw' : 'ball') + ' aims at it' }); return; }
  let S2;
  if (to === 'shell19') S2 = make061s19v4(state, D, mode, ctx.J, own, ctx, a.action, frame, { position: L.position.slice(), angles: L.angles.map(w => w >>> 0) });
  else S2 = make061s13(state, D, own, ctx, a.action, frame, { position: L.position.slice(), centre: ZERO3.slice() });
  L.events.push({ ev: 'create', stepped: true, shell: to, mode, position: L.position.slice(), child: S2 ? S2.id : null, deleted: !S2 });
  if (S2){ S2.creator = L.id; S2.createdAtMove = L.moves; state.shells.push(S2); out.spawned.push(S2); }
  L.converted = true;
  end24(L, D, out);
}
// Rustrum's L9 actions (spawn061v4): `place` at the action's start (phase 0; (7, 0xe5) at 182, where its L9 M10 begins), `throw`,
// `roll`, `lift`, `release` at their frames
function spawn061v4(state, D, a, ctx, input, out, fresh){
  if (!state.hist) return;
  const own = ctx.own001;
  for (const sp of a.spawns24){
    const at = sp.frame === 0 ? fresh : (!fresh && pass001(state, f(sp.frame)));
    if (!at) continue;
    if (sp.kind === 'release'){ state.cae0 = 2; continue; }               // 0xf30128
    if (sp.kind === 'lift'){ if (state.held24) convert24(state, D, ctx, out, 'shell13', 0, a, sp.frame); state.cae0 = 1; continue; }
    if (sp.kind === 'roll'){ if (state.held24) convert24(state, D, ctx, out, 'shell19', sp.mode, a, sp.frame); continue; }
    const why = missing001(own, { facing: true, pos: true });
    if (why){ out.refused.push({ action: a.action, shell: 'shell24', mode: sp.mode, why }); continue; }
    const snapHeld = L => {                                               // 0xf2fea0: not landed -> 0x40e6f0
      if (!L || L.landed) return;
      const n = L.events.length;
      snap24(L, own, ctx, D);
      for (const e of L.events.slice(n)) if (e.ev === 'start') out.started.push({ shell: L, start: e.start });
    };
    if (sp.kind === 'place' && held24Live(state)){ snapHeld(state.held24); continue; }
    const S = make24(state, D, sp.mode, state.prevJoints || ctx.J, own, ctx, a.action, sp.frame, sp.kind === 'place');
    state.held24 = S;
    if (sp.kind === 'throw' && sp.clear) state.cae0 = 0;                  // (7, 0xfa / 0xff): +0xcae0 = 0 (0xf312a0)
    if (S){
      state.shells.push(S); out.spawned.push(S);
      for (const e of S.events) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
      S.events = [];
      if (sp.kind === 'place') snapHeld(S);
    }
  }
}
