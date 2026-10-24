// ---- BASE60 / BASE61: Ahtal-Ka's web anchors (shell60, shell61) ------------------------------------------------------------
// dev/rom-map.md "Ahtal-Ka -- shell60 / shell61 (the web anchors)" (READ: base60 band 0x435b40..0x4385f8 -- init 0x435d28, move
// 0x4360a0, state-1 0x43630c, sub-states 0x436438 / 0x4368ac (2 / 3: 0x436c94 / 0x437a20, not transcribed), launch 0x437e4c, end
// 0x438214, release 0x438204, gate 0x4381d8; base61 band 0x4385f8..0x43a78c -- init 0x438838, move 0x438c10, state-1 0x438e6c,
// sub-states 0x438f98 / 0x439400 (2 / 3: 0x4397ec / 0x439c10, not transcribed), launch 0x439db8, end 0x43a3ac, release 0x43a39c,
// gate 0x43a388). Checked against the ROM run on unicorn by dev/shells-ahtal-check.mjs (scratchpad sh88/emu60.py).
// Readers: sp_60 0x10c4cf0 -- cmn float 0 (R, 2500) +0x15c8; ef 0..7 +0x15cc..+0x15e8 (u 332 / 300 / 330 / 331 / 231 / 310 / 311 /
// 301); hit 0 / 1; ints 0 / 1 +0x15f4 / +0x15f8; floats 0..14 +0x15fc..; vec 0 / 1 / 2 pointers +0x1638 / +0x163c / +0x1640.
// sp_61 0x10c5144 -- ef 0..7 +0x15c8..+0x15e4 (u 332 / 300 / 330 / 331 / 360 / none / 310 / 311); hit 0..2; ints; floats 0..23
// +0x15fc..+0x1658; vec 0 pointer +0x165c.
// THE STATES THE VIEWER RUNS: sub-state 0 (planted at the ground point, u 332, for float 5 / 21 x 60 frames; then u 300 (the
// Dragonator spike) and u 330 start, u 332 stops, and it flies (speed float 0) to its web point H / O) and sub-state 1 (there:
// u 331 (the web) starts and the X word turns to float 9 / 22 degrees over 30 frames; then it hangs). Sub-states 2 / 3 -- the
// re-aim and throw of (7, 0x2c / 0x2f / 0x31 / 0x36) (0x4380e4) and the orbit / dive of (7, 0x34) (0x43a374) -- start from
// actions whose clips are not read: not transcribed (their read: scratchpad sh88/b60/notes-base60-61-58.txt).
// THE ANCHOR POINT a silk thread ends on is the anchor shell's own +0x40 (the thread pass's end kinds 5 / 6, 0x10ba21c..
// 0x10ba254): webAnchors088(state) below.
const blendTo60 = (S, target, rate) => { S.blend = { t: f(0.0), rate, target: target.slice(), start: S.angles.slice() }; };
// the blend, as base57's turn (0x432efc) with the shell's own fields (+0x16b0.. / +0x16d4..): at t = 1 the target words and
// the phase on
function blend60(S, dt){
  const B = S.blend, t = Math.min(mla(B.t, B.rate, dt), f(1.0));
  B.t = f(t);
  if (!(t < 1.0)){ S.angles = B.target.slice(); S.phase = (S.phase + 1) & 0xff; return; }
  for (let i = 0; i < 3; i++){
    const a = f(f(B.start[i] >>> 0) * U16_TO_DEG);
    let d = nmls(a, f(B.target[i] >>> 0), U16_TO_DEG);
    if (d < 0) d = f(d + 360.0); else if (!(d < 360.0)) d = f(d + -360.0);
    const far = d > 180.0, w = far ? f(-t) : f(t), span = far ? f(360.0 - d) : d;
    let r = mla(a, w, span);
    if (r < 0) r = f(r + 360.0); else if (!(r < 360.0)) r = f(r + -360.0);
    S.angles[i] = u16(s32(mla(0.5, r, DEG_TO_U16)));
  }
}
// 0x437e4c(shell, speed, accel, dest, src) / base61's 0x439db8 (the velocity alone): the unit direction, its yaw / pitch words;
// (0, 0, speed) turned Z (word 0: x = cos x 0 - sin x 0, y = sin x 0 + cos x 0) then X then Y; base60 the same for (0, 0, accel)
function launch60(S, speed, accel, dest, src, withAcc){
  let dx = f(dest[0] - src[0]), dy = f(dest[1] - src[1]), dz = f(dest[2] - src[2]);
  const n = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
  if (!(n < SEG_EPS)){ const inv = f(f(1.0) / n); dz = f(dz * inv); dy = f(dy * inv); dx = f(dx * inv); }
  const yawW = s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16));
  const pitch = atan2f(f(-dy), sqrtf(mla(f(dz * dz), dx, dx)));
  const pitchW = s32(mla(0.5, pitch, RAD_TO_U16));
  const rz = f(0 * U16_TO_RAD), sz = sinf(rz), cz = cosf(rz);
  const turn = v => {
    const s2 = f(sz * 0.0), c0 = f(cz * 0.0);
    const x1 = f(c0 - s2), y1 = f(s2 + c0);
    const rx = f(u16(pitchW) * U16_TO_RAD), sx = sinf(rx), cx = cosf(rx);
    const y2 = mls(f(y1 * cx), v, sx), z2 = mla(f(v * cx), y1, sx);
    const ry = f(u16(yawW) * U16_TO_RAD), sy = sinf(ry), cy = cosf(ry);
    return [mla(f(x1 * cy), z2, sy), y2, mls(f(z2 * cy), x1, sy)];
  };
  S.velocity = turn(f(speed));
  if (withAcc) S.gravity = turn(f(accel));
}
const wordsTo60 = (from, to) => {
  const dx = f(to[0] - from[0]), dz = f(to[2] - from[2]);
  const yw = s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16));
  const dy = f(to[1] - from[1]);
  const pw = s32(mla(0.5, atan2f(f(-dy), sqrtf(mla(f(dz * dz), dx, dx))), RAD_TO_U16));
  return [u16(pw), u16(yw), 0];
};
function params60(def, mode, sp61){
  const sh = mode.sh, n = sh.floats.length, F = i => f(i < n ? sh.floats[i] : 0);
  return { fl: [...Array(24).keys()].map(F), vec: [0, 1, 2].map(i => sh.vecs[i] ? sh.vecs[i].map(f) : null),
           R: def.cmn && def.cmn.floats.length ? f(def.cmn.floats[0]) : f(0), sp61 };
}
// base60's init 0x435d28 (states 1, sub 0, phase 0). Modes 6..14 (sp_60 +0x150 0x10c5010) with the setup's target pointer +0x10
// ([E+0x1428]+0x1d0): the centre C is the target, or R along him-to-target when it lies farther than R (3-D normalised), and the
// yaw faces from the target to him; else C = his x / z and the yaw his facing. +0x40 = C + vec 0 x size turned by the yaw, y =
// 0 + vec0.y x size (absolute); H (+0x1670) from vec 1 the same way; the words from +0x40 toward H
function make60(state, D, m, own, ctx, slot, action){
  const def = D.shells.shell60, mode = def.modes[m];
  if (!mode) return { why: 'shell60 mode ' + m + ': no files' };
  const k = params60(def, mode, false), P = own.ownerPos;
  const sz = f(own.size[0] * own.size[1]);                                    // 0xbe518: block +0x1ac x +0x1b0
  let Cx = P[0], Cz = P[2], yawW = own.ownerY >>> 0;
  if (m >= 6 && m <= 14){
    if (!own.target) return { why: 'no target (input.rock.target): the aimed anchor reads block +0x1d0' };
    const T = own.target;
    const dx = f(P[0] - T[0]), dz = f(P[2] - T[2]);
    yawW = u16(s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16)));
    Cx = T[0]; Cz = T[2];
    if (mla(mla(0.0, dx, dx), dz, dz) > f(k.R * k.R)){
      let ex = f(T[0] - P[0]), ez = f(T[2] - P[2]);
      const ey = f(T[1] - P[1]), n = sqrtf(mla(mla(f(ey * ey), ex, ex), ez, ez));
      if (!(n < SEG_EPS)){ const inv = f(f(1.0) / n); ez = f(ez * inv); ex = f(ex * inv); }
      Cz = mla(P[2], ez, k.R); Cx = mla(P[0], ex, k.R);
    }
  }
  const r = f(u16(yawW) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const turn = v => { const vx = f(v[0] * sz), vz = f(v[2] * sz);
    return [f(Cx + mla(f(vx * cs), vz, sn)), mla(0.0, v[1], sz), f(Cz + mls(f(vz * cs), vx, sn))]; };
  const position = turn(k.vec[0] || ZERO3), H = turn(k.vec[1] || ZERO3);
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell60', cls: def.cls, globalId: def.id, base: 'base60', mode, modeIndex: m,
              action, slot, k, state: 1, sub: 0, phase: 0, position, anchor: position.slice(), velocity: [0, 0, 0], gravity: [0, 0, 0],
              angles: wordsTo60(position, H), H, timer: f(0.0), release: false, blend: null, events: [], stops: [],
              start: null, effect: null, place: null, stop: null, unitScale: f(mode.scale), handles: {} };
  return { S };
}
// base61's init 0x438838: +0x40 = his block + vec 0 x size turned by his facing, y RELATIVE to him; rx / rz = float 2 / 3, theta =
// float 1 degrees, C = his block point; the web point O = C + (sin theta rx, ., cos theta rz) turned by his facing, y = float 4 +
// C.y; the words toward O
function make61(state, D, m, own, ctx, slot, action){
  const def = D.shells.shell61, mode = def.modes[m];
  if (!mode) return { why: 'shell61 mode ' + m + ': no files' };
  const k = params60(def, mode, true), P = own.ownerPos;
  const sz = f(own.size[0] * own.size[1]), v = k.vec[0] || ZERO3;
  const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const vx = f(v[0] * sz), vz = f(v[2] * sz);
  const position = [f(P[0] + mla(f(vx * cs), vz, sn)), mla(P[1], v[1], sz), f(P[2] + mls(f(vz * cs), vx, sn))];
  const K = DEG_RAD57, rx = k.fl[2], rz = k.fl[3], th = f(k.fl[1] * K);
  const st = f(sinf(th) * rx), ct = f(cosf(th) * rz);
  const O = [f(P[0] + mla(f(st * cs), ct, sn)), f(k.fl[4] + P[1]), f(mls(f(ct * cs), st, sn) + P[2])];
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell61', cls: def.cls, globalId: def.id, base: 'base61', mode, modeIndex: m,
              action, slot, k, state: 1, sub: 0, phase: 0, position, anchor: position.slice(), velocity: [0, 0, 0], gravity: [0, 0, 0],
              angles: wordsTo60(position, O), H: O, C: P.slice(), timer: f(0.0), release: false, blend: null, events: [], stops: [],
              start: null, effect: null, place: null, stop: null, unitScale: f(mode.scale), handles: {} };
  return { S };
}
// an effect param started at +0x40 on the shell (the 0x40a54 / 0x4a10c8 / 0x4a11e4 start; no rotation override): out.started,
// its handle named `slot` (schedule.js keeps the request in S.handles[slot])
function start60(S, D, param, slot, out){
  const st = rockRequest(D, S.mode, param, S.position.slice(), slot);
  if (!st) return;
  st.slot = slot;
  out.started.push({ shell: S, start: st });
  S.events.push({ ev: 'start', param, key: st.key, slot });
}
// sub-states 0 and 1 (0x436438 / 0x4368ac; base61 0x438f98 / 0x439400 the same with its own fields)
function sub060(S, D, ctx, out){
  const b61 = S.base === 'base61', k = S.k;
  if (S.phase === 0){
    S.phase = 1;
    S.timer = f((b61 ? k.fl[21] : k.fl[5]) * 60.0);
  }
  if (S.phase === 1){
    const T = S.timer;
    if (T > 0){
      const t = f(T - ctx.dt);
      S.timer = (0 >= t) ? 0 : t;
      if (t > 0) return;
    } else S.timer = 0;
    S.phase = 2;
    if (b61) launch60(S, k.fl[0], 0, S.H, S.position, false);
    else launch60(S, k.fl[0], f(0.0), S.H, S.position, true);
    start60(S, D, 1, 'u300', out);                                            // ef 1 -> +0x1648 / +0x1664
    start60(S, D, 2, 'u330', out);                                            // ef 2 -> +0x164c / +0x1668
    S.stops.push({ slot: 'start', mode: 0 });                                 // u 332 (+0x1644 / +0x1660), 0x43b058(h, 0)
    return;
  }
  if (S.phase === 2){
    stepFlight(S, ctx.dt);
    if (!passed3D57(S, S.H)) return;
    S.sub = 1; S.phase = 0;
    S.position = S.H.slice();                                                 // 0x4a184c: the hit off (not visual)
  }
}
function sub160(S, D, ctx, out){
  const b61 = S.base === 'base61', k = S.k;
  if (S.phase === 0){
    S.phase = 1;
    start60(S, D, 3, 'u331', out);                                            // ef 3 (the web) -> +0x1650 / +0x166c
    blendTo60(S, [u16(s32(mla(0.5, b61 ? k.fl[22] : k.fl[9], DEG_TO_U16))), S.angles[1], S.angles[2]], f(0.03333333507180214));
  }
  if (S.phase === 1) blend60(S, ctx.dt);
}
// the end 0x438214 / 0x43a3ac (flag): (unless ending) stop u 332 / 300 / 331 / 231 / 301 (base61: u 332 / 300 / 331 / 360 / ef 5)
// with the flag -- NOT u 330; released ? ef 6 (u 311) : ef 5 (u 310) -- base61 ef 7 / ef 6 -- at +0x40; state 0xfe, 1800 at most
function end60(S, D, out, flag){
  if ((S.state & 0xfe) === 0xfe) return;
  for (const slot of ['start', 'u300', 'u331', 'u231', 'u301', 'u360']) S.stops.push({ slot, mode: flag });
  const b61 = S.base === 'base61';
  start60(S, D, S.release ? (b61 ? 7 : 6) : (b61 ? 6 : 5), S.release ? 'u311' : 'u310', out);
  S.state = 0xfe; S.timer = ENDING_FRAMES;
  out.ended.push(S);
}
// the move 0x4360a0 / 0x438c10: state 0xfe the wait (any of the eight handles alive); state 1: the owner gone or the release byte
// -> end(0); else +0x1000 = +0x40 and the sub-state
function step60(S, ctx, input, D, out){
  S.events = []; S.stops = [];
  if (S.state === 0xfe){
    const T = S.timer;
    if (!(T > 0)){ S.timer = 0; S.state = 0xff; return; }
    const t = f(T - ctx.dt);
    S.timer = (0 >= t) ? 0 : t;
    if (!(t > 0)){ S.state = 0xff; return; }
    const ea = input.effectAlive;
    const alive = ea ? (ea(S, 0) || Object.values(S.handles).some(q => ea(S, 1, { request: q }))) : false;
    if (!alive) S.state = 0xff;
    return;
  }
  if (S.state !== 1) return;
  if (S.release){ end60(S, D, out, 0); return; }
  S.anchor = S.position.slice();
  if (S.sub === 0) sub060(S, D, ctx, out);
  else if (S.sub === 1) sub160(S, D, ctx, out);
}
// THE ANCHORS FOR THE SILK THREADS (render/class-threads.js): the handles e+0xd420 + 4k (shell60, k 0..4) and e+0xd450 + 4p
// (shell61, p 0..3) as the session keeps them, each the anchor's point (+0x40, game units) with the thread pass's own gates --
// a d420 thread (u 341, slots 10..14) while 0x4381d8 == 0 (state 1 and sub-state <= 2), a d450 thread (slots 15..17, p 0..2
// only) while 0x43a388 == 0 (state 1). null where the handle is empty.
export function webAnchors088(state){
  const W = state && state.webs088;
  const one = (S, gate) => S && S.state !== 0xff ? { point: S.position.slice(), words: S.angles.slice(), mode: S.modeIndex, id: S.id, thread: gate(S) } : null;
  return { d420: [0, 1, 2, 3, 4].map(i => one(W && W.d420[i], S => S.state === 1 && S.sub <= 2)),
           d450: [0, 1, 2, 3].map(i => one(W && W.d450[i], S => S.state === 1 && i <= 2)) };
}
// the slot byte -> mode (0x10b5548): 0..4 the mode, 5..13 one more (aimed), 0xff none, anything else none (and cleared)
const slotMode088 = v => v <= 4 ? v : v <= 13 ? v + 1 : null;
// THE WEBS' SPAWNS, at the start of the hold actions (vt+0x204: (1, 0x1d) / (1, 0x23) 0x10b54e4, (1, 0x1f) 0x10b59e8, (1, 0x25)
// 0x10b5be4), which the wind-ups (1, 0x1c) / (1, 0x22) / (1, 0x1e) / (1, 0x24) chain into when their L2 M30 ends (0x10bcc9c..:
// 0xb09c8, L2 M30 set again, 0x10bcf3c) -- here the step on which the viewer's L2 M30 play wraps. Each slot's old handle is
// released first (0x438204 / 0x43a39c).
function web088(state, D, a, ctx, input, out, sp){
  const own = ctx.own001;
  if (!own.ownerPos || !own.facing){ out.refused.push({ action: a.action, shell: sp.web, why: 'no owner position / facing' }); return; }
  const W = state.webs088 || (state.webs088 = { d420: [null, null, null, null, null], d450: [null, null, null, null], plays: 0 });
  const J = state.prevJoints || ctx.J;
  if (sp.web === 'shell61'){
    for (const m of sp.modes){
      const old = W.d450[m]; if (old && old.state === 1) old.release = true;     // 0x43a39c
      const r = make61(state, D, m, own, ctx, m, a.action);
      if (!r.S){ out.refused.push({ action: a.action, shell: 'shell61', mode: m, why: r.why }); W.d450[m] = null; continue; }
      W.d450[m] = r.S;
      r.S.start = rockRequest(D, r.S.mode, 0, r.S.position, 'u332');            // phase 0's u 332, the same frame
      r.S.effect = r.S.start ? { param: 0, key: r.S.start.key } : null;
      state.shells.push(r.S); out.spawned.push(r.S);
    }
    return;
  }
  // shell60: the slot bytes e+0xd434..+0xd438 the AI's stream wrote (EMC op 0xa3 b1 5..8, 10), each play the next stream
  const sets = sp.slots, set = sets[(W.plays++) % sets.length];
  for (let k = 0; k < 5; k++){
    const v = set.bytes[k];
    if (v == null) continue;                                                   // 0xff: the slot is skipped
    const old = W.d420[k]; if (old && old.state === 1) old.release = true;     // 0x438204
    W.d420[k] = null;
    const m = slotMode088(v);
    if (m == null) continue;
    const r = make60(state, D, m, own, ctx, k, a.action);
    if (!r.S){ out.refused.push({ action: a.action, shell: 'shell60', mode: m, why: r.why }); continue; }
    r.S.stream = set.stream;
    W.d420[k] = r.S;
    r.S.start = rockRequest(D, r.S.mode, 0, r.S.position, 'u332');
    r.S.effect = r.S.start ? { param: 0, key: r.S.start.key } : null;
    state.shells.push(r.S); out.spawned.push(r.S);
  }
}
// the releases at an action's start (0x10b49e4..0x10b4b1c: status 10 / 11; 0x10b5310..0x10b542c: (1, 6) / (1, 0x20)): every
// live anchor's release byte -> its next move ends it with u 311
function releaseWebs088(state){
  const W = state.webs088;
  if (!W) return;
  for (const g of [W.d420, W.d450]) for (let i = 0; i < g.length; i++){ if (g[i] && g[i].state === 1) g[i].release = true; g[i] = null; }
}
