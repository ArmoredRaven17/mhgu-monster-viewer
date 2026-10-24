
// ---- BASE42 (uShellEmBase42, 2026-10-19: init 0x4207e4, the activation vt+0x18 0x420ac8, move vt+0x24 0x42124c -> vt+0x154 0x4212b8,
// end vt+0x148 0x4215a8; its helpers 0x420d70 (the joint point and the advance) / 0x420fe0 (a sound's ray: not visual) / 0x421384 (the
// placement)) -- Amatsu's water line, sp_42 (0x102). The unit walker (0xc04588..0xc045b8) runs vt+0x18 once, state 1 -> 2, then the move
// in the same pass. sp_42's reader 0xf105b0 (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x1660; sound ints 0 / 1 / 2 -> +0x15cc / +0x15d4
// (as a float) / +0x15d0 (the sounds: not built); hit 0 -> +0x15d8; int 0 -> +0x15dc (the joint); float 0 -> +0x15e0 (the travel frames);
// &vec 0 -> +0x15e4 (the offset in the joint's frame); float 1 -> +0x1664 (the end's wait)
function params042(mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: sh.ints.length ? sh.ints[0] : -1, travel: F(0), wait: F(1), vec: (sh.vecs[0] || ZERO3).map(f) };
}
// 0x420d70's first half (and the init's 0x420924..0x420a10): +0x1000 = vec 0 through the joint's whole matrix (0xc15a4, divided by w)
function point042(S, J){
  const M = jointMatrix(J, S.k.joint);
  return M ? jointPoint(M, S.k.vec, 0, 0, null).P : null;
}
// the aim from the joint point E at the shell's point P (0x420b10..0x420d48 / 0x4213d0..0x4214b4): X = atan2(-dy, |(dx, dz)|), Y =
// atan2(dx, dz), Z = atan2(-dx, dy) -- each a u16 of s32(0.5 + r x 10430.378), in degrees x 360 / 65536
function aim042(E, P){
  const dx = f(P[0] - E[0]), dy = f(P[1] - E[1]), dz = f(P[2] - E[2]);
  const h = sqrtf(mla(f(dz * dz), dx, dx));
  const w = r => u16(s32(mla(f(0.5), r, RAD_TO_U16)));
  return [w(atan2f(f(-dy), h)), w(atan2f(dx, dz)), w(atan2f(f(-dx), dy))];
}
// base42's init 0x4207e4 (READ whole): the base's 0x43a850 (no owner -> deleted); +0x1600.. = setup +0x10.. (A), +0x1610.. = setup +0x20..
// (B), +0x160c / +0x161c 0; the owner's byte +0x50 bit 0 clear -> deleted; the reader; state 1; the life +0x15f0 = float 0; +0x1000 =
// the joint point; both points' y = the lower of the two (0x420a14..0x420a38); +0x40 = A
function make042(st, D, m, A0, B0, own, J, ctx, action, frame){
  const def = D.shells.shell42, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell42 mode ' + m + ': no files' };
  const k = params042(mode);
  const A = A0.map(f), B = B0.map(f);
  const y = B[1] > A[1] ? A[1] : B[1];
  A[1] = y; B[1] = y;
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell42', cls: def.cls, globalId: def.id, base: 'base42', mode, modeIndex: m,
              action, spawnFrame: frame, motion: ctx.motion, state: 1, k, A, B, position: A.slice(), prevPosition: A.slice(), anchor: null,
              angles: [0, 0, 0], velocity: [f(0.0), f(0.0), f(0.0)], timer: k.travel, count: 0, wait: k.wait, activated: false, moves: 0,
              events: [], folder: def.folder, effect: null, start: null, place: null, stop: null, stops: [], live042: {}, lists };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.anchor = point042(S, J);
  if (!S.anchor) return { why: 'shell42: no joint ' + k.joint };
  S.launch = { point: A.slice(), angles: [0, 0, 0] };
  return { S };
}
// 0x420d70 (READ whole): the joint point again; the heading = u16(s32(0.5 + atan2(B.x - A.x, B.z - A.z) x 10430.378)); the speed = |B -
// A| in x / z, over float 0 when float 0 > 0; +0x40 += the owner's +0x50c x (the step x (sin x v + cos x 0, 0, v x cos - sin x 0))
function move042(S, J, ctx){
  const P = point042(S, J);
  if (P) S.anchor = P;
  const { A, B } = S;
  const bx = f(B[0] - A[0]), bz = f(B[2] - A[2]);
  let v = sqrtf(mla(mla(f(0.0), bx, bx), bz, bz));
  const head = u16(s32(mla(f(0.5), atan2f(bx, bz), RAD_TO_U16)));
  if (S.k.travel > 0) v = f(v / S.k.travel);
  const r = f(f(head) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), z0 = f(0.0);
  const vx = mla(f(cs * z0), sn, v), vz = mls(f(v * cs), sn, z0);
  const dt = ctx.dt, sp = f(ctx.speed == null ? 1.0 : ctx.speed);
  S.position = [mla(S.position[0], sp, f(dt * vx)), mla(S.position[1], f(dt * z0), sp), mla(S.position[2], sp, f(dt * vz))];
}
// one of its effect params started into a slot ('m' ef 0, 'tN' the trail's N), at `point`, rotation `rot` (degrees) or none
function start042(S, D, param, slot, point, rot, out){
  const rq = rockRequest(D, S.mode, param, point, slot, S.lists);
  if (!rq) return;
  rq.slot = slot;
  if (rot){ rq.requester.rotationDeg = rot; rq.requester.flags14 = 0x40000002; }
  S.effects[param] && (S.effects[param].started = true);
  S.live042[slot] = { param, key: rq.key };
  S.events.push({ ev: 'start', param, slot, start: rq });
  out.started.push({ shell: S, start: rq });
}
function stop042(S, slot, mode){
  const h = S.live042[slot];
  if (!h || (!mode && h.stopping)) return;
  S.stops.push({ slot, mode });
  S.events.push({ ev: 'stop', param: h.param, key: h.key, flag: mode });
  if (mode) S.live042[slot] = null; else h.stopping = true;
}
// base42's end 0x4215a8 (vt+0x148(flag)): not ending already -> ef 0's handle +0x15f4 stopped (0x43b058(h, flag)), the hits off, vt+0x150
// (sp_42: bx lr), state 0xfe, +0x15f0 = [0x162493c] x 60; flag 1 deletes
function end42(S, out, flag = 0){
  if ((S.state & 0xfe) === 0xfe) return;
  stop042(S, 'm', flag);
  S.state = 0xfe; S.timer = ENDING_FRAMES;
  out.ended.push(S);
}
// sp_42's +0x15c 0xf106ac (READ whole; while the line runs): when the life has used another 3 frames (life < float 0 - 3 x count), the
// stage ray (0x183490, mask 0x10, the area e+0x1054) from 1000 below the point to 1000 above it: on a hit +0x44 = its height, ef 1 at +0x40
// (no rotation) into slot [count] of 15 (+0x1620..), count + 1
function trail042(S, D, ctx, out){
  if (!(S.timer < f(S.k.travel - f(3 * S.count)))) return;
  const P = S.position;
  const q = stageQuery([P[0], f(P[1] + f(-1000.0)), P[2]], [P[0], f(P[1] + f(1000.0)), P[2]], ctx.stage, 0x10);
  if (!q) return;
  S.position = [P[0], q.point[1], P[2]];
  S.events.push({ ev: 'hit', point: S.position.slice(), type: 0 });
  if (S.mode.ef[1]) start042(S, D, 1, 't' + S.count, S.position, null, out);
  S.count++;
}
// base42's move 0x42124c (READ whole): the handle +0x15f4 dropped when its unit left states 1 / 2; state 1 -> vt+0x154 0x4212b8: 0x420d70,
// the placement 0x421384 (ef 0 at +0x1000, rotated (X, Y) of the aim and Z = the owner's +0x58 word), the owner gone -> the end; float 0 > 0:
// the life -= the step x the owner's +0x50c (kept >= 0), out -> the end, else +0x15c; float 0 <= 0: +0x15c every move. State 0xfe -> sp_42's
// +0x158 0xf10830: nothing while ef 0's handle lives; then the dead trail handles dropped, +0x15f0 += the step, past float 1 (once: float 1
// = 0 after) three sp_01 0 (hit only, at A / B, y 0 / +900 / -900 -- not built: the end of a line whose stream has gone) and every trail
// handle stopped (0x329c40(h, 0)); every slot empty -> state 0xff
function step42(S, J, ctx, input, D, out){
  S.events = []; S.stops = [];
  S.moves++;
  const alive = s => input.effectAlive ? !!input.effectAlive(S, -1, { request: S.handles && S.handles[s] }) : true;
  for (const s of Object.keys(S.live042)) if (S.live042[s] && !alive(s)) S.live042[s] = null;
  if (!S.activated && S.state === 1){
    // 0x420ac8, the activation: 0x420d70, the sound's ray, then ef 0 (+0x15c8) at +0x1000 aimed at +0x40 -> +0x15f4
    S.activated = true;
    move042(S, J, ctx);
    const W = aim042(S.anchor, S.position);
    start042(S, D, 0, 'm', S.anchor, W.map(w => f(f(w) * U16_TO_DEG)), out);
    S.start = S.events.length ? S.events[S.events.length - 1].start : null;
    S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  }
  if (S.state === 1){
    move042(S, J, ctx);
    const W = aim042(S.anchor, S.position), own = ctx.own001;
    S.place = { position: S.anchor.slice(), rotationDeg: [f(f(W[0]) * U16_TO_DEG), f(f(W[1]) * U16_TO_DEG), f(f(own.ownerZ >>> 0) * U16_TO_DEG)] };
    if (!own.ownerPos){ end42(S, out, 0); return; }
    if (S.k.travel > 0){
      if (!(S.timer > 0)){ S.timer = f(0.0); end42(S, out, 0); return; }
      const t = mls(S.timer, ctx.dt, f(ctx.speed == null ? 1.0 : ctx.speed));
      S.timer = f(0.0) >= t ? f(0.0) : t;
      if (!(t > 0)){ end42(S, out, 0); return; }
    }
    trail042(S, D, ctx, out);
  } else if (S.state === 0xfe){
    if (S.live042.m) return;
    S.timer = f(ctx.dt + S.timer);
    if (S.timer > S.wait && S.wait !== 0){
      S.wait = f(0.0);
      for (const s of Object.keys(S.live042)) if (s !== 'm') stop042(S, s, 0);
    }
    if (!Object.keys(S.live042).some(s => s !== 'm' && S.live042[s] && !S.live042[s].stopping)) S.state = 0xff;
  }
}

// (7, 0x19 / 0x1a / 0x1b) phase 0 (0xf0ddd4 / 0xf0e1c8 / 0xf0e6b0, READ whole): the line's two points e+0xcb40.. / +0xcb50.., from the
// target's distance d (block +0x1d0) and the facing the action will turn to (block +0x54 + the delta to the target clamped to the tune's
// degrees: e+0xcb64, turned in phase 1 by 0x76dd0); tune t = (length, near, far, degrees). 'near' (0x19): z from max(near, d - length /
// 2) on (capped at far); 'side' (0x1a): x -length / 2 .. +length / 2 at z = clamp(d, near, far); 'far' (0x1b): the near line reversed.
// y 0; turned by the new facing and set on block +0x40
function line058(kind, t, own){
  const O = own.ownerPos, T = own.target;
  const dx = f(O[0] - T[0]), dz = f(O[2] - T[2]);
  const d = sqrtf(mla(mla(f(0.0), dx, dx), dz, dz));
  const tw = s32(mla(f(0.5), atan2f(f(T[0] - O[0]), f(T[2] - O[2])), RAD_TO_U16));
  const yaw = own.ownerY >>> 0;
  const r2 = ((0xffff - yaw) + tw + 1) | 0, u = r2 & 0xffff;
  let delta = u <= 0x8000 ? u : u - 0x10000;
  const lim = u16(s32(mla(f(0.5), t[3], DEG_TO_U16)));
  if (!(delta > lim)) delta = delta < -lim ? -lim : delta; else delta = lim;
  const yaw2 = u16(yaw + delta);
  const [L, near, far] = t.map(f);
  let A, B;
  if (kind === 'side'){
    const z = d > far ? far : d < near ? near : d;
    A = [f(L * f(-0.5)), f(0.0), z]; B = [f(L * f(0.5)), f(0.0), z];
  } else {
    const s0 = near > mla(d, L, f(-0.5)) ? near : mla(d, L, f(-0.5));
    const s4 = f(L + s0), over = s4 > far;
    const zN = over ? f(far - L) : s0, zF = over ? far : s4;
    A = [f(0.0), f(0.0), kind === 'near' ? zN : zF]; B = [f(0.0), f(0.0), kind === 'near' ? zF : zN];
  }
  const r = f(f(yaw2) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  let Ax, Az;
  if (kind === 'side'){ Ax = f(f(A[2] * sn) - f(cs * B[0])); Az = f(f(sn * B[0]) + f(A[2] * cs)); }
  else { Ax = mla(f(cs * f(0.0)), A[2], sn); Az = mls(f(A[2] * cs), sn, f(0.0)); }
  const Bx = mla(f(B[0] * cs), B[2], sn), Bz = mls(f(B[2] * cs), B[0], sn);
  return { A: [f(O[0] + Ax), f(0.0), f(O[2] + Az)], B: [f(O[0] + Bx), f(0.0), f(O[2] + Bz)], turn: delta };
}
