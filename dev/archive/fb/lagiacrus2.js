
// ---- BASE25 (uShellEmBase25): Lagiacrus's strike marks (shell25, u 90; their end the bolt, sp_01 7, u 91) -------------------------
// READ 2026-10-18 (dev/leviathan-shells-spec.md 1c): ctor 0x40f0c8 (0x43a78c; ef +0x15c8 = 0, hit +0x15cc = -1, +0x15d0..+0x15d8 = 0,
// +0x15dc / +0x15e0 the zero vector, +0x15e4..+0x15f0 = 0, +0x15a8 = 0x19), init 0x40f198, move 0x40f62c, end 0x40f7ac, +0x150
// 0x40f84c `bx lr`; vtable 0x17c4d80 to +0x154 (+0x158 = 0). sp_25's reader 0xeab42c: ef 0 -> +0x15c8, hit 0 -> +0x15cc, float 0 the
// near +0x15d4, float 1 the far +0x15d8, &vec 0 -> +0x15dc; its +0x154 0xeab4b0 (owner active): sp_01 7 at its point and words (+0x20
// the zero vector, +0x3c 0xffff).
function params046s25(mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { near: F(0), far: F(1), vec: (sh.vecs[0] || ZERO3).map(f) };
}
// the init 0x40f198 (the gates 0x43a850 and the owner unit's byte +0x50 bit 0 the viewer always passes; +0x15ec = the owner's motion
// u16 +0x4b4, read by nothing here): the words from the owner's block +0x40 to its target +0x1d0 -- X = u16(atan2(-dy, |(dx, dz)|)),
// Y = u16(atan2(dx, dz)), Z the ctor's 0; the point = vec 0 with z + max(near, min(far, the ground distance block -> target)),
// turned by Z, then X, then Y (each u16 x 9.58738e-05), plus the block's point; then the stage query 0x183490 (mask 0x10) from 500
// above to 500 below: no hit deletes the shell, a hit sets y. State 1; +0x15e4 = +0x15d0 (0: no timer); ef 0 at the point (the
// shell's own unit, the rock's requester) -> +0x15f0; the hit registration slot 0 = hit 0 (vt +0x140; hitdata (120, 20))
function make25(state, D, m, ctx, own, action, frame){
  const def = D.shells.shell25, mode = def.modes[m];
  if (!mode) return { why: 'shell25 mode ' + m + ': no files in this arc' };
  if (!own.ownerPos || !own.target) return { why: 'no owner position / target (input.ownerPos, input.rock.target)' };
  const k = params046s25(mode), P = own.ownerPos, T = own.target;
  const dz = f(T[2] - P[2]), dx = f(T[0] - P[0]), dy = f(T[1] - P[1]);
  const X = u16(s32(mla(0.5, atan2f(f(-dy), sqrtf(mla(f(dz * dz), dx, dx))), RAD_TO_U16)));
  const Y = u16(s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16)));
  const ex = f(P[0] - T[0]), ez = f(P[2] - T[2]);
  let d = sqrtf(mla(mla(f(0.0), ex, ex), ez, ez));
  if (d > k.far) d = k.far;                                    // vselgt: the far
  if (k.near > d) d = k.near;                                  // vselgt: the near
  let x = f(k.vec[0] + 0), y = f(k.vec[1] + 0), z = f(d + k.vec[2]);
  const turn = (w, a, b) => { const r = f(u16(w) * U16_TO_RAD), sn = sinf(r), cs = cosf(r); return [sn, cs]; };
  let [sn, cs] = turn(0);                                      // +0xff0: Z (the ctor's 0)
  const x1 = mls(f(x * cs), y, sn), y1 = mla(f(y * cs), x, sn);
  [sn, cs] = turn(X);                                          // +0xfe8: X
  const y2 = mls(f(y1 * cs), z, sn), z2 = mla(f(z * cs), y1, sn);
  [sn, cs] = turn(Y);                                          // +0xfec: Y
  const x2 = mla(f(x1 * cs), z2, sn), z3 = mls(f(z2 * cs), x1, sn);
  const p = [f(P[0] + x2), f(P[1] + y2), f(P[2] + z3)];
  const q = stageQuery([p[0], f(p[1] + f(-500.0)), p[2]], [p[0], f(p[1] + f(500.0)), p[2]], ctx.stage, 0x10);
  if (!q) return { why: 'shell25 mode ' + m + ': no floor within 500 of its point (the init deletes it, 0x40f5f4)' };
  p[1] = q.point[1];
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell25', cls: def.cls, globalId: def.id, base: 'base25', mode,
              modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1, k, position: p, anchor: p.slice(),
              angles: [X, Y, 0], clock: f(0.0), moves: 0, events: [], place: null, start: null, stop: null, effect: null, slots: null };
  S.start = rockRequest(D, mode, 0, p, 'shell25');
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  return { S };
}
// the end 0x40f7ac(shell, 0): ef +0x15f0 stopped gracefully (0x43b058), 0x4a1de4 (the hit side), vt +0x154 (sp_25's 0xeab4b0: the
// bolt), state 0xfe, the clock +0x15e8 = 0
function end25(S, ctx, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  if (ctx && ctx.create) ctx.create(S, 'shell01', { mode: 7, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) });
  S.state = 0xfe; S.clock = f(0.0);
  out.ended.push(S);
}
// the move 0x40f62c: 0x4a1698 (deletes the shell when the owner's unit leaves states 1 / 2: never in the viewer), the handle's
// hygiene; state 1: anchor = position; the owner inactive (never) or no timer (+0x15e4 0) and neither hit slot on (+0x13ad /
// +0x1465: S.slots, input.hitLife) -> the end; else vt +0x150 (`bx lr`). State 0xfe: the clock += the step, deleted past [0x162493c]
// x 60.0 (1800) or with the effect gone
function step25(S, ctx, input, D, out){
  S.moves++;
  if (S.state === 1){
    S.anchor = S.position.slice();
    if (!(S.slots && S.slots.some(sl => sl.on))) end25(S, ctx, out);
    return;
  }
  if (S.state === 0xfe){
    S.clock = f(ctx.dt + S.clock);
    const gone = input.effectAlive ? !input.effectAlive(S, 0) : true;
    if (S.clock > ENDING_FRAMES || gone) S.state = 0xff;
  }
}

// ---- BASE26 (uShellEmBase26): Lagiacrus's thunder spiral (shell26, u 120) --------------------------------------------------------
// READ 2026-10-18 (dev/leviathan-shells-spec.md 1d): ctor 0x40faec (0x43a78c; ef +0x15c8 = 0, +0x15cc = 0, hits +0x15d0 / +0x15d4 and
// the joint +0x15d8 = -1, +0x15dc..+0x163b cleared, +0x1640.. the zero vector, +0x164c = 0, +0x15a8 = 0x1a), init 0x40fbfc, move
// 0x40ff60 -> 0x41005c, the step 0x41018c, end 0x410420, +0x150 / +0x154 `bx lr`; vtable 0x17c4ee0 to +0x154. sp_26's reader 0xeab6b0:
// ef 0 -> +0x15c8, hit 0 -> +0x15d0; floats 0 Rx +0x15e0, 1 Rz +0x15e4, 2 the phase (degrees) +0x15dc, 3 the turn rate (deg) +0x15f4,
// 4 its change +0x15f8, 5 / 6 the change's window +0x15fc / +0x1600, 7 the fall +0x160c, 8 / 9 its window +0x1610 / +0x1614, 10 the
// height +0x15e8, 11 the growth +0x15ec, 12 the yaw offset (degrees) +0x15f0. The flags +0x1618 (the rate's clamps +0x1604 / +0x1608)
// stay the ctor's 0.
function params046s26(mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { rx: F(0), rz: F(1), phase: F(2), rate: F(3), dRate: F(4), r0: F(5), r1: F(6), fall: F(7), y0: F(8), y1: F(9), height: F(10),
           grow: F(11), yaw: F(12) };
}
const DEG_TO_RAD26 = f(0.017453292);                            // 0x3c8efa35 (0x40ff50 / 0x410414)
// the init 0x40fbfc (gates as base25's): Rx +0x1628 = float 0, Rz +0x162c = float 1, the rate +0x1634 = float 3 x DEG_TO_RAD26; the
// words +0xfe8.. the zero vector's; the joint -1 (sp_26 sets none) -> the yaw +0x1638 = u16(atan2(target - block on x / z)) and the
// centre +0x1640.. = the block's point (a joint would take the block's Y word and the joint's point, 0xc164c: none here); the phase
// +0x1630 = float 2 x DEG_TO_RAD26; the point (sin phase x Rx, the height, cos phase x Rz) turned by the yaw (x cos + z sin, z cos -
// x sin) plus the centre. State 1; ef 0 at the point -> +0x1620; the hit registration slot 0 = hit 0 (hitdata (0, 600))
function make26(state, D, m, ctx, own, action, frame){
  const def = D.shells.shell26, mode = def.modes[m];
  if (!mode) return { why: 'shell26 mode ' + m + ': no files in this arc' };
  if (!own.ownerPos || !own.target) return { why: 'no owner position / target (input.ownerPos, input.rock.target)' };
  const k = params046s26(mode), P = own.ownerPos, T = own.target;
  const yaw = u16(s32(mla(0.5, atan2f(f(T[0] - P[0]), f(T[2] - P[2])), RAD_TO_U16)));
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell26', cls: def.cls, globalId: def.id, base: 'base26', mode,
              modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1, k, rx: k.rx, rz: k.rz, rate: f(k.rate * DEG_TO_RAD26),
              yaw, centre: P.slice(), theta: f(k.phase * DEG_TO_RAD26), t: f(0.0), clock: f(0.0), angles: [0, 0, 0], moves: 0, events: [],
              place: null, start: null, stop: null, effect: null, slots: null };
  const x = f(sinf(S.theta) * S.rx), y = k.height, z = f(cosf(S.theta) * S.rz);
  const r = f(u16(yaw) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  S.position = [f(P[0] + mla(f(x * cs), z, sn)), f(P[1] + y), f(P[2] + mls(f(z * cs), x, sn))];
  S.anchor = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'shell26');
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  return { S };
}
// the step 0x41018c: anchor = position; phase += step x rate; with t in (float 5, float 6] the rate += step x float 4 x DEG_TO_RAD26
// (its clamps under flags +0x1618: 0 here); with t in (float 8, float 9] y += step x float 7; then x = sin phase x Rx, z = cos phase
// x Rz turned by the yaw word + u16(s32(0.5 + float 12 x 182.04445)) plus the centre's x / z (y stays as it is: the init's centre y
// plus the height, then the fall); Rx += step x float 11, Rz += step x float 11 x Rz / Rx (the new Rx)
function orbit26(S, dt){
  const k = S.k;
  S.anchor = S.position.slice();
  S.theta = mla(S.theta, dt, S.rate);
  const t = S.t;
  if (t > k.r0 && !(t > k.r1)) S.rate = mla(S.rate, dt, f(k.dRate * DEG_TO_RAD26));
  let y = S.position[1];
  if (t > k.y0 && !(t > k.y1)) y = mla(y, dt, k.fall);
  const x = f(sinf(S.theta) * S.rx), z = f(cosf(S.theta) * S.rz);
  const w = u16((s32(mla(0.5, k.yaw, DEG_TO_U16)) + S.yaw) >>> 0);
  const r = f(w * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  S.position = [f(S.centre[0] + mla(f(x * cs), z, sn)), y, f(S.centre[2] + mls(f(z * cs), x, sn))];
  S.rx = mla(S.rx, dt, k.grow);
  S.rz = mla(S.rz, dt, f(k.grow * f(S.rz / S.rx)));
}
function end26(S, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  S.state = 0xfe; S.clock = f(0.0);
  out.ended.push(S);
}
// the move 0x40ff60: 0x4a1698 and the handles' hygiene; state 1 -> 0x41005c: the owner inactive (never) -> the end; t +0x161c +=
// the step, the step 0x41018c, the words from the step's own travel (X = u16(atan2(-dy, |(dx, dz)|)), Y = u16(atan2(dx, dz)), Z
// kept); neither hit slot on -> the end (vt +0x148(0): 0x43b058 on +0x1620 / +0x1624, 0x4a1de4, vt +0x154 `bx lr`, state 0xfe, t =
// 0); else vt +0x150 (`bx lr`). State 0xfe: t += the step, deleted past 1800 or with the effects gone
function step26(S, ctx, input, D, out){
  S.moves++;
  if (S.state === 1){
    S.t = f(ctx.dt + S.t);
    orbit26(S, ctx.dt);
    const d = [f(S.position[0] - S.anchor[0]), f(S.position[1] - S.anchor[1]), f(S.position[2] - S.anchor[2])];
    S.angles = [u16(s32(mla(0.5, atan2f(f(-d[1]), sqrtf(mla(f(d[2] * d[2]), d[0], d[0]))), RAD_TO_U16))),
                u16(s32(mla(0.5, atan2f(d[0], d[2]), RAD_TO_U16))), S.angles[2]];
    if (!(S.slots && S.slots.some(sl => sl.on))) end26(S, out);
    return;
  }
  if (S.state === 0xfe){
    S.clock = f(ctx.dt + S.clock);
    const gone = input.effectAlive ? !input.effectAlive(S, 0) : true;
    if (S.clock > ENDING_FRAMES || gone) S.state = 0xff;
  }
}

// LAGIACRUS's own spawns (code 'em046'), line 4 -- the two the plain rows cannot carry:
//   sp_26 (0xea, base26): L4 M10 (7, 0x6f) f110 modes 0 / 1 / 2, (7, 0x70) 3 / 4 / 5 (0xea4d18.. / 0xea4f08..: no setup field read);
//   sp_25 (0xe9, base25): (7, 0x68 / 0x69) 0xea3c10(e, 1, 0 / 1) -- phase 0 plays L4 M8 (0x408) and clears the timer P+0x1bc; each
//     phase-1 call adds the owner's step (+0x1c) and, past tune float 1 (1.0: the phase's second call, NOT a frame test -- the census
//     cannot see it), makes four sp_25 of the row [0x169eac0][r2] (0, 1, 2, 3 / 5, 6, 7, 8; row 2's 10..13 no caller) from the zero
//     vector's point and words, then phase 2 (L4 M8 again until P+0x1a2 reaches tune int 0xc, 2).
function spawn046(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  if (a.timer25){
    if (fresh){ state.t046 = { t: f(0.0), done: false }; return; }
    const T = state.t046;
    if (!T || T.done) return;
    T.t = f(ctx.dt + T.t);
    if (!(T.t > f(1.0))) return;
    T.done = true;
    for (const m of a.timer25){
      const r = make25(state, D, m, ctx, own, a.action, null);
      if (!r.S){ out.refused.push({ action: a.action, shell: 'shell25', mode: m, why: r.why }); continue; }
      state.shells.push(r.S); out.spawned.push(r.S);
    }
    return;
  }
  if (fresh || !state.hist || !state.prevJoints) return;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.shell === 'shell01'){ makePlain(state, D, a, ctx, out, own, state.prevJoints, sp); continue; }
    for (const m of sp.modes){
      const r = make26(state, D, m, ctx, own, a.action, sp.frame);
      if (!r.S){ out.refused.push({ action: a.action, shell: 'shell26', mode: m, why: r.why }); continue; }
      state.shells.push(r.S); out.spawned.push(r.S);
    }
  }
}
SHELL_DATA.em046_00.shells.shell25 = { id: 0xe9, cls: 'uShellEm046_sp_25', base: 'base25', reader: 0xeab42c, folder: 'shell@em@em046_00_shell25',
  modes: {
@25@
  }, hitdata: [[120, 20]] };
SHELL_DATA.em046_00.shells.shell26 = { id: 0xea, cls: 'uShellEm046_sp_26', base: 'base26', reader: 0xeab6b0, folder: 'shell@em@em046_00_shell26',
  modes: {
@26@
  }, hitdata: [[0, 600]] };
const act046 = (n, list, clip, x) => Object.assign({ action: [7, n], code: 'em046', list, clip, pick: 'ai',
  variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns: [] }, x);
// (7, 0x6f / 0x70): the spiral at f110 and the discharge sp_01 0 / 1 at f160 (the plain base01 row, makePlain)
SHELL_DATA.em046_00.actions = SHELL_DATA.em046_00.actions.concat([
  act046(0x6f, '4', 'Motion[10]', { spawns: [{ frame: 110, shell: 'shell26', modes: [0, 1, 2] }, { frame: 160, shell: 'shell01', mode: 0 }] }),
  act046(0x70, '4', 'Motion[10]', { spawns: [{ frame: 110, shell: 'shell26', modes: [3, 4, 5] }, { frame: 160, shell: 'shell01', mode: 1 }] }),
  act046(0x68, '4', 'Motion[8]', { timer25: [0, 1, 2, 3] }),
  act046(0x69, '4', 'Motion[8]', { timer25: [5, 6, 7, 8] }),
]);
