
// ---- AHTAL-NESET's ROCKETS: sp_59 0x17a on BASE59 (uShellEmBase59, band 0x434a94..0x435b40) -- dev/ahtal-neset-shells-spec.md 3C
// (shells agent, 2026-10-20). READ: the gate vt+0x204 0x10a6e58 (0x10a7070..0x10a715c), the maker 0x10a795c whole, the point query
// 0xb3ca0 -> 0x69bb74 (his own area_patrol record), sp_59's reader 0x10c2e4c, base59's init 0x434da8, its move 0x4351a4 (states 0..6),
// the kill 0x435930, +0x148 0x4359bc (-> vt+0x40), the handles' drop 0x10a4cfc (a unit out of states 1 / 2), the cooldown's count
// 0x10a558c (vt+0x1dc, every update: -= dt). His class's +0x15c / +0x16c / +0x17c are not called from base59's band.
// THE ROCKET IS A SUPPLY DROP, NOT A SHOT: it falls from 100 m along its own heading onto the launch point (state 1), lands (ef 1,
// the quake), wobbles 40 frames (state 2), tips back to its first pitch (state 3), and at state 4 makes the pickup object
// (0x31a2ac with the maker's item id +0x26 / count +0x28: a gameplay object, NOT drawn here) and stays (state 5, timer -1) until killed.
// Viewer stand-ins (named): THE TRIGGER -- his AI sets the mask (EMC g0 s0: a3 (1, 7) or (1, 0x38), 50 : 50, when selector 7 holds)
// and the next action start fires it; the viewer has no AI, so the Rockets control (input.rockets087: 1 side A = mask 7, 2 side B =
// mask 0x38) is the mask, applied at an action start only when selector 7 holds (every handle dropped, the cooldown out) -- the
// ROM's own gate. THE KILL -- his (7, 1) after a3 (2, mask) fades them (0x10a6540: 0x435930(h, 0)); here, setting the control to
// Off fades them the same way. THE POINT -- his file's points (map 27 area 1, the ROM's own data) when input.patrol087 says the
// viewer is his arena; anchored on him (input.anchor087: x / z plus his unit's, Raven's Lao / Alatreon precedent). The pick's
// RNG decides only the pickup's item, so it is not drawn and stands at draw 0.
// his own enemy\area_patrol\em087_00 (rAreaPatrolData, XFS): record (map 27, area 1, index 0x7f), mAreaDataArray -- point k for rocket k
const PATROL087 = { map: 27, area: 1, index: 0x7f, radius: f(100.0), points: [
  [3500, 0, 3800], [1700, 0, 4200], [2000, 0, 4500], [-3600, 0, -1200], [-2600, 0, -1700], [-2300, 0, -1500],
  [3500, 0, 3800], [1700, 0, 4200], [2000, 0, 4500], [700, 0, 4300]].map(p => p.map(f)) };
// em087_00_actiontune floats 0x1f..0x27 (the maker's tune by k: the rocket's heading in degrees) and 0x1e (the cooldown, x 60.0)
const TUNE087_ROCKET = [200.0, 90.0, 170.0, 270.0, 60.0, -30.0, 270.0, 60.0, -30.0].map(f);
const COOLDOWN087 = f(f(90.0) * f(60.0));
// sp_59's reader 0x10c2e4c (READ whole): ef 0 / 1 -> +0x15d4 / +0x15d8; hit 0 / 1 -> +0x15dc / +0x15e0; floats 11, 0, 4, 1, 2, 6, 3,
// 5, 7, 8, 9 -> +0x15e4 (the unit's scale), +0x15e8 (the drop's height), +0x15ec (the first pitch, deg), +0x15f0 (the fall's speed),
// +0x15f4 (its acceleration), +0x15f8 (state 2's time), +0x15fc (the landed pitch, deg), +0x1600 (state 3's pitch rate, deg / frame),
// +0x1604 (state 5's time; -1: stays), +0x1608 (the fade), +0x160c (the wobble, deg). Float 10 is not read.
function params087s59(mode){
  const F = i => f(i < mode.sh.floats.length ? mode.sh.floats[i] : 0);
  return { scale: F(11), height: F(0), pitch0: F(4), speed: F(1), accel: F(2), wait2: F(6), pitch1: F(3), rate3: F(5), wait5: F(7),
           fade: F(8), wobble: F(9) };
}
// the wobble table 0x1624928 by the counter (+4's top byte, 1..4 then 0)
const WOBBLE59 = [0.0, 1.0, -1.0, 0.0, 1.0].map(f);
const deg16 = d => u16(s32(mla(f(0.5), d, DEG_TO_U16)));
// 0x539d5c(S, &t, 1.0): t <= 0 -> 0 and done; else t -= dt (kept >= 0), done when it reaches 0
function tick59(t, dt){
  if (!(t > 0)) return { t: f(0), done: true };
  const n = f(t - f(dt * f(1.0)));
  return { t: f(0) >= n ? f(0) : n, done: !(n > 0) };
}
// the maker 0x10a795c(e, k): the old rocket k killed at once (0x435930(h, 1)); the point (0xb3ca0: his record's point k, else his own
// position P+0x40 -- the ROM's miss); the tune; setup 0x30 (+0x10 the point, +0x20 0, +0x24 s16 (s32) the tune, +0x26 / +0x28 the
// pickup's id / count, +0x29 the area, +0x2a); 0x48b884 -> e+0xcdcc + 4k
function make087s59(st, D, k, ctx, input, out){
  const R = st.r087;
  const old = R.h[k];
  if (old && old.state !== 0xff && (old.state & 0xfe) !== 0xfe) kill59(old, 1, out);
  R.h[k] = null;
  if (k > 8) return;
  const def = D.shells.shell59, mode = def && def.modes[0];
  if (!mode){ out.refused.push({ shell: 'shell59', mode: 0, why: 'uShellEm087_sp_59 mode 0: no files' }); return; }
  const own = ctx.own001;
  let point, radius;
  if (input.patrol087 && k < PATROL087.points.length){
    point = PATROL087.points[k].slice(); radius = PATROL087.radius;
    if (input.anchor087 && own.ownerPos) point = [f(point[0] + own.ownerPos[0]), point[1], f(point[2] + own.ownerPos[2])];
  } else if (own.ownerPos){ point = own.ownerPos.slice(); radius = f(300.0); }
  else { out.refused.push({ shell: 'shell59', mode: 0, why: 'no owner position (input.ownerPos), the point 0xb3ca0 falls back to' }); return; }
  const tune = s32(TUNE087_ROCKET[k]) << 16 >> 16;            // +0x24: (s32) the tune, a halfword
  const k59 = params087s59(mode), lists = def.lists || D.lists;
  const Yw = u16(s32(mla(f(0.5), f(tune), DEG_TO_U16)));      // init: +0xfec / +0x15d0
  const Xw = deg16(k59.pitch0);                               // +0xfe8
  // init 0x434e9c..0x434f34: the point + (0, height, 0) turned by X then Y (the compiler's zero products kept)
  const ax = f(f(Xw) * U16_TO_RAD), sx = sinf(ax), cx = cosf(ax);
  let s30 = f(cx * f(0.0)); s30 = mla(s30, k59.height, sx);
  const ay = f(f(Yw) * U16_TO_RAD), sy = sinf(ay), cy = cosf(ay);
  let dx = f(cy * f(0.0)); const dy0 = f(k59.height * cx); let dz = f(s30 * cy);
  dx = mla(dx, s30, sy); const dy = mls(dy0, sx, f(0.0)); dz = mls(dz, sy, f(0.0));
  const pos = [f(point[0] + dx), f(dy + point[1]), f(dz + point[2])];
  // +0x1014 = speed, +0x1024 = accel; the velocity and the acceleration turned by X, then by Y (0x434f38..0x435084)
  const turn = (vy) => {
    let a = f(vy * cx), b = f(f(0.0) * cx); a = mls(a, f(0.0), sx); b = mla(b, vy, sx);     // (y, z) by X
    let x = f(f(0.0) * cy), z = f(b * cy); x = mla(x, b, sy); z = mls(z, f(0.0), sy);       // (x, z) by Y
    return [x, a, z];
  };
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell59', cls: def.cls, globalId: def.id, base: 'base59', mode, modeIndex: 0,
              action: null, spawnFrame: null, motion: ctx.motion, k: k59, lists, slot: k, point, radius, state: 0, sub: 0, cnt: 0,
              timer: f(0), Y0: Yw, wob: 0, angles: [Xw, Yw, 0], position: pos, anchor: pos.slice(), velocity: turn(k59.speed),
              gravity: turn(k59.accel), moves: 0, events: [], effect: null, effect2: null, start: null, place: null, stop: null,
              model: { source: 'em087_00', part: 'em087_00_rocket' }, drawn: false, alpha: f(1.0), unitScale: k59.scale };
  st.shells.push(S); out.spawned.push(S);
  R.h[k] = S;
}
// 0x435930(h, r1): 1 -> vt+0x40 at once; else state 6, +0x1378 = the fade
function kill59(S, atOnce, out){
  if (atOnce){
    if (S.request) S.stop = { param: 0, request: 0, key: S.effect ? S.effect.key : null };
    S.state = 0xff; S.drawn = false; out.ended.push(S); return;
  }
  S.state = 6; S.timer = S.k.fade;
}
// the move 0x4351a4 (READ whole)
function step59(S, ctx, input, D, out){
  S.moves++;
  if (S.state === 0xff) return;
  const k = S.k, dt = ctx.dt;
  let sb = false;
  const wobble = () => {                                      // the counter and +0x15d2 (states 1..3)
    let c = (S.cnt + 1) & 0xff; if (c > 4) c = 0; S.cnt = c;
    S.wob = cvtU32(f(WOBBLE59[c] * f(u16(s32(mla(f(0.5), k.wobble, DEG_TO_U16))))));
    // (vcvt.f32.s32 of the u16, times the table, vcvt.u32.f32: a negative product saturates to 0)
    S.wob &= 0xffff;
  };
  if (S.state === 0){
    const r = tick59(S.timer, dt); S.timer = r.t;
    if (r.done){
      S.state = 1;
      const rq = rockRequest(D, S.mode, 0, S.position, 'reflight', S.lists);  // ef 0 on the shell (0x4a10c8 / 0x4a11e4) -> +0x15cc
      if (rq){ out.started.push({ shell: S, start: rq }); S.effect = { param: 0, key: rq.key }; }
    }
    S.drawn = false;                                          // +0xc bit 11 cleared, and no tail this move
    return;
  }
  if (S.state === 1){
    stepFlight(S, dt);
    sb = true; wobble();
    if (!(S.position[1] > S.point[1])){
      S.position = S.point.slice(); S.state = 2; S.timer = k.wait2;
      S.angles[0] = deg16(k.pitch1);
      if (S.effect){ S.stopNow = true; S.effect = null; }     // 0x329c40(+0x15cc, 0): the fall's effect, gracefully
      const rq = rockRequest(D, S.mode, 1, S.point, 'landing', S.lists);
      if (rq){ out.started.push({ shell: S, start: rq }); S.effect2 = { param: 1, key: rq.key, started: true }; }
    }
  } else if (S.state === 2){
    sb = true; wobble();
    const r = tick59(S.timer, dt); S.timer = r.t;
    if (r.done) S.state = 3;
  } else if (S.state === 3){
    sb = true; wobble();
    const X = u16(S.angles[0] - s32(mla(f(0.5), f(k.rate3 * dt), DEG_TO_U16)));
    const T = deg16(k.pitch0);
    S.angles[0] = X;
    if (!(f(X) > f(T))){ S.angles[0] = T; S.wob = 0; S.state = 4; S.timer = k.wait5; }   // + the pickup (0x31a2ac): not drawn here
  } else if (S.state === 4){
    S.state = 5; sb = true;
  }
  if (S.state === 5){
    if (S.timer > 0){ const r = tick59(S.timer, dt); S.timer = r.t; if (r.done){ S.state = 6; S.timer = k.fade; } }
  } else if (S.state === 6){
    const r = tick59(S.timer, dt); S.timer = r.t;
    S.alpha = f(S.timer / k.fade);                            // +0x158
    if (!(S.timer > 0)){ S.state = 0xff; S.drawn = false; out.ended.push(S); return; }
  }
  S.drawn = true;                                             // the tail: +0xc bit 11 (his area is the player's)
  if (sb) S.angles[1] = u16(S.Y0 + S.wob);                    // +0xfec = +0x15d0 + +0x15d2
}
// the gate at an action start (vt+0x204 0x10a6e58, with e+0x73e4 == 0) and the cooldown (vt+0x1dc); the control is the stand-in for
// his AI's mask (above). Selector 7 (0x10a98dc): every handle dropped (0x10a4cfc: a unit out of states 1 / 2) and the cooldown out
function rockets087(state, D, ctx, input, out, fresh){
  const R = state.r087 || (state.r087 = { h: new Array(9).fill(null), cool: f(0), side: 0 });
  for (let k = 0; k < 9; k++){ const S = R.h[k]; if (S && (S.state === 0xff || (S.state & 0xfe) === 0xfe)) R.h[k] = null; }
  if (fresh && R.cool > 0){ /* the count runs every update, below */ }
  const side = input.rockets087 | 0;
  if (Array.isArray(input.fire087)){                          // the ROM check: the maker for these k, at once
    if (fresh) for (const k of input.fire087) make087s59(state, D, k, ctx, input, out);
    return;
  }
  if (side !== R.side){
    if (side === 0) for (let k = 0; k < 9; k++) if (R.h[k]) kill59(R.h[k], 0, out);   // the stand-in for (7, 1)'s a3 (2, mask) fade
    R.side = side;
  }
  if (R.cool > 0){ const n = f(R.cool - ctx.dt); R.cool = f(0) >= n ? f(0) : n; }
  if (!fresh || !side) return;
  const sel7 = R.h.every(h => !h) && !(R.cool > 0);
  if (!sel7) return;
  const mask = side === 1 ? 0x07 : 0x38;
  for (let k = 0; k < 6; k++) if (mask & (1 << k)) make087s59(state, D, k, ctx, input, out);
  R.cool = COOLDOWN087;
}
SHELL_DATA.em087_00.shells.shell59 = { id: 0x17a, cls: 'uShellEm087_sp_59', base: 'base59', reader: 0x10c2e4c, folder: 'shell\\em\\em087_00_shell59',
  // em087_00_59 (the .shl's mode 0; its snd ints 850 / 851 are audio): ef 0 u 410 (the fall), ef 1 u 400 (the landing); no hit
  modes: { 0: { scale: 1.0, ef: [[0, 410], [0, 400]], hit: [], sh: { ints: [], floats: [10000.0, -10.0, -0.5, 340.0, 330.0, 1.0, 40.0, -1.0, 20.0, 4.0, 120.0, 2.0], vecs: [] } } },
  lists: { 0: { list: 'u', pel: 'em087_00u' } } };
SHELL_DATA.em087_00.rockets087 = true;
