// ---- BASE32 (uShellEmBase32 0x415010..0x416290; Crystalbeard's crystals, sp_32 0xe5) -- dev/em045-shells-spec.md 4 (shells agent,
// 2026-10-19; emulator check dev/shells-crystalbeard-check.mjs). READ whole: ctor 0x415010 (the live count [0x1835?] += 1; the dtor
// 0x415180 -= 1), init +0x13c 0x415278, move +0x24 0x4157dc, the state-1 step 0x4158d8, the flight 0x415a18, the landing effect
// 0x41607c, the end +0x148 0x4161e8. His class (vtable 0x17c3904, slots to +0x160): reader +0x14c 0xe9e6dc (by id: 0xe5 -> 0xe9e928,
// 0xe1 -> 0xe9e710), +0x150 0xe9ed28 (the end hook: +0x160 then a sound), +0x154 0xe9eb90 (a stage contact), +0x158 0xe9ed98 (a
// sound's position), +0x15c 0xe9ee64 (the settled tick: the periodic child), +0x160 0xe9ebf0 (the burst).
//   READER (0xe5): ef 0 / 1 / 2 -> +0x15c8 / +0x15cc / +0x15d0; hit 0 / 1 -> +0x15d4 / +0x15d8; int 0 -> the joint +0x15dc; int 1 ->
//   +0x15e0 (the spin axis, % 3); int 2 -> +0x15e4 (the sound: -1 none); floats 0..9 -> +0x15e8 (the settled wait), +0x15ec (the child
//   period), +0x15f0 (the hp a hit takes: not modelled), +0x15f4 (hop 1's time), +0x15f8 (hop 2's), +0x15fc (the second wait), +0x1600
//   (A's distance), +0x1604 (B's), +0x1608 (hop 1's spin, deg / frame), +0x160c (hop 2's); &vec 0 -> +0x1614 (y: degrees on his
//   facing), &vec 1 -> +0x1618 (the offset when no joint), &vec 2 / 3 -> +0x161c / +0x1620 (the hops' gravity); cmn float 0 -> +0x1610
//   (the probes' reach above his ground); +0x1672 a draw (0x16b4b4: the periodic child's +0x3c, not visual)
//   INIT 0x415278: the live count >= 7 -> deleted (vt+0x40); the owner live; the reader; 0x48bf4c(5) registered; the words X 0, Y = his
//   +0x54 + s32(0.5 + vec0.y x DEG_TO_U16) (uxtah), Z 0; +0x40 = the joint's position (0xc164c) or his block +0x40 + vec 1; POINT A =
//   +0x40 + (cos x 0 + dA sin, 0, dA cos - sin x 0) by that Y, its y his ground (+0x5b4), then the stage probe 0x18154c there: below
//   ground + +0x1610 -> A.y = it; POINT B = A + the same with dB, the same probe; either probe not below -> deleted (vt+0x148(1)); then
//   +0x1644 = int1 % 3, the Y word = that << 14 (the words become (0, axis x 0x4000, 0)), +0x1628 = the period, +0x1624 = the wait,
//   state 1, the hit (hit 0), ef 0 at +0x40 -> +0x1638
//   MOVE (state 1, 0x4158d8): the owner gone -> the end; the registry record (0x48bf08) 9 -> deleted, 7 -> the end; byte 5 0 -> THE
//   FLIGHT (0x415a18): anchor = +0x40; byte 6 0 -> hop 1 set up (+0x1634 = T1, gravity vec 2, velocity ((A - p) / T1) with y + T1 x g.y
//   x -0.5), byte 6 = 1; 1 -> 0x539224, the spin (axis 0: X += s32(0.5 + dt x +0x1608 x DEG_TO_U16) (uxtah); 2: X -= it; 1: Z += it),
//   the time down by dt -> at 0: the landing effect 0x41607c, hop 2 from A to B (T2, vec 3, the words preset to -T2 x +0x160c's turn
//   (axis 2: +), +0x40 = A), byte 6 = 2; 2 -> 0x539224, the spin by +0x160c, the time -> at 0: 0x41607c, the hit off (0x4a184c),
//   +0x40 = B, byte 5 = 1, +0x158, the words from the ground normal (0x43b1a0); then every flight step the stage query 0x43ac8c
//   (anchor -> +0x40) -> a contact: +0x154 0xe9eb90 (type 0 / 2: 0x41607c then the end; type 1: the end only on attribute & 0x1046).
//   byte 5 1 -> SETTLED: +0x1624 down by dt; at 0: the first time byte +0x1640 = 1 and +0x1624 = +0x15fc, the second the end; each
//   step +0x15c (0xe9ee64: +0x15ec != 0 -> +0x1628 down by dt; at 0 shell01 [owner+0xcb14] MODE 10 at +0x40 with its words, +0x1628 =
//   +0x15ec)
//   0x41607c: ef 1 (+0x15cc) at +0x40 -> +0x163c; the ground probe 0x183490 (+-500 about it) -> +0x1068 & 0x1040 -> the end
//   END 0x4161e8(flag): unregistered; flag -> deleted; not ending -> ef 0 stopped, the hit off, +0x150 (0xe9ed28: +0x160 0xe9ebf0 --
//   owner active: shell01 [owner+0xcb14] MODE 9 for modes 24..26, else 4 (5 at variant 4 with the quest number > 8), at +0x40 with
//   its words, +0x3c its +0x13dc -- then the sound), state 0xfe, +0x1630 = 0; 0xfe: +0x1630 += dt, past [0x162493c] x 60 -> deleted,
//   a live handle -> kept, else 0xff
function params045s32(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0.0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), axis: I(1), sound: I(2), wait: F(0), period: F(1), hp: F(2), t1: F(3), t2: F(4), wait2: F(5), dA: F(6), dB: F(7),
           spin1: F(8), spin2: F(9), deg: V(0), offset: V(1), g1: V(2), g2: V(3),
           reach: f(def.cmn && def.cmn.floats.length ? def.cmn.floats[0] : 0.0) };
}
const spinWord32 = (dt, rate) => u16(s32(mla(0.5, f(dt * rate), DEG_TO_U16)));
function make32(state, D, sp, J, own, ctx, out, action, F){
  const def = D.shells.shell32, m = sp.mode, mode = def && def.modes[m];
  const no = why => { out.refused.push({ action, shell: 'shell32', mode: m, frame: F, why: state.monId + ' shell32: ' + why }); return null; };
  if (!mode) return no('mode ' + m + ': no files');
  if (!own.ownerPos || !own.facing) return no('no owner position / facing');
  if (own.ground == null) return no('no ground (input.ground), which the two points read');
  // the live count (0x415010 / 0x415180): this one is counted by its ctor, so a seventh is deleted at once
  if (state.shells.filter(x => x.base === 'base32' && x.state !== 0xff).length + 1 >= 7) return null;
  const k = params045s32(def, mode);
  let pos;
  if (k.joint !== -1){ const M = jointMatrix(J, k.joint); if (!M) return no('no joint ' + k.joint); pos = [M[12], M[13], M[14]]; }
  else pos = [f(own.ownerPos[0] + k.offset[0]), f(own.ownerPos[1] + k.offset[1]), f(own.ownerPos[2] + k.offset[2])];
  const Yw = ((own.ownerY >>> 0) + u16(s32(mla(0.5, k.deg[1], DEG_TO_U16)))) >>> 0;
  const r = f(f(u16(Yw)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const off = d => [mla(f(cs * f(0.0)), d, sn), mls(f(d * cs), sn, f(0.0))];
  const stage = ctx.stage, floorY = stage && typeof stage === 'object' ? stage.floorY : stage;
  const T = f(own.ground + k.reach);
  const probe = () => (floorY != null && floorY < T) ? f(floorY) : null;   // 0x18154c: the stand-in's floor plane
  const oA = off(k.dA);
  const A = [f(pos[0] + oA[0]), f(own.ground), f(oA[1] + pos[2])];
  const hA = probe();
  if (hA != null) A[1] = hA;
  const oB = off(k.dB);
  const B = [f(A[0] + oB[0]), f(own.ground), f(oB[1] + A[2])];
  const hB = probe();
  if (hB == null || hA == null) return null;                     // vt+0x148(1): deleted (the ROM's own rule, not a refusal)
  if (hB != null) B[1] = hB;
  const axis = ((k.axis % 3) + 3) % 3;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell32', cls: def.cls, globalId: def.id, base: 'base32', mode, modeIndex: m,
              action, spawnFrame: F, motion: ctx.motion, state: 1, k, lists: def.lists || D.lists, timer: f(0), b5: 0, b6: 0, b1640: 0,
              t1624: k.wait, t1628: k.period, t1634: f(0), axis, A, B,
              position: pos.slice(), anchor: pos.slice(), velocity: ZERO3.slice(), gravity: ZERO3.slice(),
              angles: [0, (axis << 14) >>> 0, 0], moves: 0, events: [], folder: def.folder, effect: null, effect2: null, start: null, stop: null,
              unitScale: f(mode.scale) };
  S.launch = { position: pos.slice(), velocity: ZERO3.slice(), gravity: ZERO3.slice(), angles: S.angles.slice(), timer: f(0) };
  const rq = rockRequest(D, mode, 0, pos, 'flight', S.lists);
  if (rq){ S.start = rq; S.effect = { param: 0, key: rq.key }; }
  state.shells.push(S); out.spawned.push(S);
  return S;
}
function land32(S, D, out){                                           // 0x41607c
  if (!S.mode.ef[1]) return;
  const rq = rockRequest(D, S.mode, 1, S.position, 'landing', S.lists);
  if (rq){ S.effect2 = { param: 1, key: rq.key, started: true }; out.started.push({ shell: S, start: rq }); }
}
function child32(S, D, ctx, m){
  if (ctx && ctx.create) ctx.create(S, 'shell01', { mode: m, position: S.position.slice(), angles: S.angles.map(w => u16(w)), action: S.action, frame: S.spawnFrame });
}
function end32(S, D, ctx, out){                                      // 0x4161e8(0)
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  // +0x150 0xe9ed28 -> +0x160 0xe9ebf0: the burst
  const own = ctx.own001;
  const m = (((S.modeIndex - 0x18) >>> 0) < 3) ? 9 : (D.variant === 4 && own && own.questLevel != null && own.questLevel > 8) ? 5 : 4;
  child32(S, D, ctx, m);
  S.state = 0xfe; S.timer = f(0);
  out.ended.push(S);
}
function step32(S, J, ctx, input, D, out){
  S.moves++;
  const alive = p => !input.effectAlive ? true : !!input.effectAlive(S, p, p ? S.effect2 : S.effect);
  if (S.effect && !alive(0)) S.effect = null;
  if (S.effect2 && !alive(1)) S.effect2 = null;
  if (S.state === 0xfe){
    S.timer = f(f(ctx.dt) + S.timer);
    if (S.timer > ENDING_FRAMES || (!S.effect && !S.effect2)) S.state = 0xff;
    return;
  }
  if (S.state !== 1) return;
  if (!ctx.own001.ownerPos){ end32(S, D, ctx, out); return; }
  const k = S.k, dt = f(ctx.dt);
  if (S.b5 === 1){
    let done;
    if (S.t1624 > 0){ const t = f(S.t1624 - dt); done = !(t > 0); S.t1624 = (0 >= t) ? f(0.0) : t; }
    else { S.t1624 = f(0.0); done = true; }
    if (S.b1640){ if (done){ end32(S, D, ctx, out); return; } }
    else if (done){ S.b1640 = 1; S.t1624 = k.wait2; }
    // +0x15c 0xe9ee64: the periodic child
    if (k.period !== 0){
      let fire;
      if (S.t1628 > 0){ const t = f(S.t1628 - dt); S.t1628 = (0 >= t) ? f(0.0) : t; fire = !(t > 0); }
      else { S.t1628 = f(0.0); fire = true; }
      if (fire){ child32(S, D, ctx, 10); S.t1628 = k.period; }
    }
    return;
  }
  // 0x415a18, the flight
  S.anchor = S.position.slice();
  const P = S.position;
  if (S.b6 === 0){
    S.t1634 = k.t1;
    S.gravity = k.g1.slice();
    const T1 = k.t1;
    S.velocity = [f(f(S.A[0] - P[0]) / T1), mla(f(f(S.A[1] - P[1]) / T1), T1, f(k.g1[1] * f(-0.5))), f(f(S.A[2] - P[2]) / T1)];
    S.b6 = 1;
  } else {
    stepFlight(S, dt);
    const rate = S.b6 === 1 ? k.spin1 : k.spin2, w = spinWord32(dt, rate);
    if (S.axis === 0) S.angles[0] = (S.angles[0] + w) >>> 0;
    else if (S.axis === 2) S.angles[0] = (S.angles[0] - w) >>> 0;
    else S.angles[2] = (S.angles[2] + w) >>> 0;
    let arrive;
    if (S.t1634 > 0){ const t = f(S.t1634 - dt); S.t1634 = (0 >= t) ? f(0.0) : t; arrive = !(t > 0); }
    else { S.t1634 = f(0.0); arrive = true; }
    if (arrive){
      land32(S, D, out);
      if (S.b6 === 1){
        const T2 = k.t2, A = S.A, B = S.B;
        S.t1634 = T2;
        S.gravity = k.g2.slice();
        S.velocity = [f(f(B[0] - A[0]) / T2), mla(f(f(B[1] - A[1]) / T2), T2, f(k.g2[1] * f(-0.5))), f(f(B[2] - A[2]) / T2)];
        const v = s32(mla(0.5, f(k.spin2 * T2), DEG_TO_U16));
        if (S.axis === 0) S.angles[0] = u16(-v);
        else if (S.axis === 2) S.angles[0] = u16(v);
        else S.angles[2] = u16(-v);
        S.position = A.slice();
        S.b6 = 2;
      } else {
        S.position = S.B.slice();
        S.b5 = 1;
        S.angles = groundAngles(S.angles, [0, 1, 0]).map(w => w >>> 0);   // 0x43b1a0 with the probe's normal (the plane's)
      }
    }
  }
  const hit = collide(S, null, ctx.stage);
  if (!hit) return;
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  if (hit.type === 0 || hit.type === 2){ land32(S, D, out); end32(S, D, ctx, out); }
  else if (hit.attr & 0x1046) end32(S, D, ctx, out);
}
