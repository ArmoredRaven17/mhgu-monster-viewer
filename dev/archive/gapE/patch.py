"""Applies the gap-E transcription (Ahtal-Ka's anchors, base60 / base61 sub-states 2 / 3) to a COPY of docs/render/shells.js:
python patch.py  ->  gapE/render/shells.js (+ the beam modules it imports, copied as they are). Every edit is an exact,
single-occurrence replacement; the script stops if an anchor is missing or not unique. The repo file is only read."""
import os, shutil, sys
SRC = r'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'render')
os.makedirs(OUT, exist_ok=True)
for m in ('beam-types.js', 'beam-groups.js', 'beam-spawns.js'):
    shutil.copyfile(os.path.join(SRC, m), os.path.join(OUT, m))
s = open(os.path.join(SRC, 'shells.js'), encoding='utf-8').read()
EDITS = []
def edit(old, new):
    EDITS.append((old, new))

# ---- 1. the BASE60 / BASE61 header: sub-states 2 / 3 now transcribed -------------------------------------------------------
edit("""// 0x4360a0, state-1 0x43630c, sub-states 0x436438 / 0x4368ac (2 / 3: 0x436c94 / 0x437a20, not transcribed), launch 0x437e4c, end
// 0x438214, release 0x438204, gate 0x4381d8; base61 band 0x4385f8..0x43a78c -- init 0x438838, move 0x438c10, state-1 0x438e6c,
// sub-states 0x438f98 / 0x439400 (2 / 3: 0x4397ec / 0x439c10, not transcribed), launch 0x439db8, end 0x43a3ac, release 0x43a39c,
// gate 0x43a388). Checked against the ROM run on unicorn by dev/shells-ahtal-check.mjs (scratchpad sh88/emu60.py).""",
"""// 0x4360a0, state-1 0x43630c, sub-states 0..3 0x436438 / 0x4368ac / 0x436c94 / 0x437a20, launch 0x437e4c, re-aim 0x4380e4, end
// 0x438214, release 0x438204, gate 0x4381d8; base61 band 0x4385f8..0x43a78c -- init 0x438838, move 0x438c10, state-1 0x438e6c,
// sub-states 0..3 0x438f98 / 0x439400 / 0x4397ec / 0x439c10, launch 0x439db8, dive 0x439f9c, orbit 0x43a1f4, orbit-on 0x43a374,
// end 0x43a3ac, release 0x43a39c, gate 0x43a388). Checked against the ROM run on unicorn by dev/shells-ahtal-check.mjs
// (scratchpad sh88/emu60.py; sub-states 2 / 3: scratchpad gapE/emu60x.py, the re-aim / orbit-on called as the action start does).""")
edit("""// u 331 (the web) starts and the X word turns to float 9 / 22 degrees over 30 frames; then it hangs). Sub-states 2 / 3 -- the
// re-aim and throw of (7, 0x2c / 0x2f / 0x31 / 0x36) (0x4380e4) and the orbit / dive of (7, 0x34) (0x43a374) -- start from
// actions whose clips are not read: not transcribed (their read: scratchpad sh88/b60/notes-base60-61-58.txt).""",
"""// u 331 (the web) starts and the X word turns to float 9 / 22 degrees over 30 frames; then it hangs); sub-states 2 / 3 from the
// action starts (anchors088): shell60's RE-AIM AND THROW ((7, 0x2c / 0x2f / 0x31 / 0x36), 0x4380e4: back to H, a drop of float 8,
// a shaking pull-back from the throw point, then the throw at it -- u 301 and u 231 start, u 300 stops -- and the end there,
// u 310) and shell61's ORBIT AND DIVE ((7, 0x34), 0x43a374: u 360 starts, u 331 stops; the orbit about his spawn point until its
// spin reverses, then the dive -- the ellipse widening, sinking -- and a hop to the ground, the end there, u 310).""")

# ---- 2. make61: the orbit fields its init writes ------------------------------------------------------------------------
edit("""  const O = [f(P[0] + mla(f(st * cs), ct, sn)), f(k.fl[4] + P[1]), f(mls(f(ct * cs), st, sn) + P[2])];
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell61', cls: def.cls, globalId: def.id, base: 'base61', mode, modeIndex: m,
              action, slot, k, state: 1, sub: 0, phase: 0, position, anchor: position.slice(), velocity: [0, 0, 0], gravity: [0, 0, 0],
              angles: wordsTo60(position, O), H: O, C: P.slice(), timer: f(0.0), release: false, blend: null, events: [], stops: [],
              start: null, effect: null, place: null, stop: null, unitScale: f(mode.scale), handles: {} };
  return { S };""",
"""  const O = [f(P[0] + mla(f(st * cs), ct, sn)), f(k.fl[4] + P[1]), f(mls(f(ct * cs), st, sn) + P[2])];
  const angles = wordsTo60(position, O);
  // the orbit / dive fields (0x438974..0x4389f4, 0x438b44..0x438bdc): +0x16a0 rx = float 2, +0x16a4 rz = float 3, +0x16a8 theta =
  // float 1 deg (rad), +0x16ac the dive's spin = float 7 deg (rad), +0x16b0 his Y word (block +0x54, 32 bits), +0x16c0 C = his
  // point; +0x16f4 the YAW OFFSET (deg) = the Y word toward O minus the yaw from O to C (atan2(C - O) as a word)
  const yOC = s32(mla(0.5, atan2f(f(P[0] - O[0]), f(P[2] - O[2])), RAD_TO_U16));
  const orbit = { rx, rz, theta: th, wDive: f(k.fl[7] * K), hisY: own.ownerY >>> 0, wOrbit: f(0.0),
                  yawOff: mls(f(f(angles[1] >>> 0) * U16_TO_DEG), f(u16(yOC)), U16_TO_DEG) };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell61', cls: def.cls, globalId: def.id, base: 'base61', mode, modeIndex: m,
              action, slot, k, state: 1, sub: 0, phase: 0, position, anchor: position.slice(), velocity: [0, 0, 0], gravity: [0, 0, 0],
              angles, H: O, C: P.slice(), orbit, timer: f(0.0), release: false, blend: null, events: [], stops: [],
              start: null, effect: null, place: null, stop: null, unitScale: f(mode.scale), handles: {} };
  return { S };""")

# ---- 3. the sub-states 2 / 3, after sub160 -------------------------------------------------------------------------------
edit("""  if (S.phase === 1) blend60(S, ctx.dt);
}
// the end 0x438214 / 0x43a3ac (flag)""",
"""  if (S.phase === 1) blend60(S, ctx.dt);
}
// SUB-STATES 2 / 3 (READ 2026-10-20). The re-aim 0x4380e4(shell, &target) -- (7, 0x2c / 0x2f / 0x31 / 0x36)'s start, 0x10b4d38:
// the word +4's bits 8..23 = 2 (sub-state 2, phase 0; byte 7 kept); the throw point T (+0x16a0..) = the target + vec 2 (pointer
// +0x1640, NOT scaled by the size) turned by the yaw from H to the target, y 0 (+0x16a4 / +0x16ac = 0)
function reaim60(S, target){
  S.sub = 2; S.phase = 0;
  const H = S.H, v = S.k.vec[2] || ZERO3;
  const yw = u16(s32(mla(0.5, atan2f(f(target[0] - H[0]), f(target[2] - H[2])), RAD_TO_U16)));
  const r = f(yw * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  S.T = [f(target[0] + mla(f(v[0] * cs), v[2], sn)), f(0.0), f(mls(f(v[2] * cs), v[0], sn) + target[2])];
}
// the blend of sub-state 2 (0x436d3c / 0x436f98): blend60's per-axis turn with NO phase step at t = 1 (the words are the target's)
function turn60(S, dt){
  const B = S.blend, t = Math.min(mla(B.t, B.rate, dt), f(1.0));
  B.t = f(t);
  if (!(t < 1.0)){ S.angles = B.target.slice(); return; }
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
// the shake (0x436e00.. phase 4 / 0x43786c.. phase 3): the angle +0x1694 += wrap(rate) x dt deg, wrapped into [0, 360); s = sin;
// each axis of +0x40 += (A (1 - |s|) + (A + (0, s < 0 ? -amp : amp, 0)) |s|) - A, A = +0x1680.. (S.D) -- an offset ADDED each move
function shake60(S, rate, amp, dt){
  let w = rate;
  if (w < 0) w = f(w + 360.0); else if (!(w < 360.0)) w = f(w + -360.0);
  let a = mla(S.vibAngle, w, dt);
  if (a < 0) a = f(a + 360.0); else if (!(a < 360.0)) a = f(a + -360.0);
  S.vibAngle = a;
  const sn = sinf(f(a * DEG_RAD57)), as = f(Math.abs(sn)), q = f(1.0 - as), A = S.D, p = S.position;
  const dx = f(mla(f(A[0] * q), A[0], as) - A[0]);
  const yy = f(A[1] + (0 > sn ? f(-amp) : amp));
  const dy = f(mla(f(q * A[1]), yy, as) - A[1]);
  const dz = f(mla(f(q * A[2]), A[2], as) - A[2]);
  S.position = [f(p[0] + dx), f(dy + p[1]), f(dz + p[2])];
}
// base60 sub-state 2 (0x436c94): phase 0 -- +0x40 = H, timer float 6 x 60; 1 -- the wait, then D (+0x1680) = +0x40 + (0, float 8,
// 0), the flight to D at |float 8 / float 7|, the words blended toward T from D at 1 / ((float 7 + float 2 x 60) x 0.7), u 331
// stops (0); 2 -- blend, flight, D passed in 3D -> +0x40 = D, the shake timer float 2 x 60, the flight AWAY from T (0x437e4c(S,
// float 10, float 11, +0x40, T): dest +0x40, src T), 0x4a1430(S, 0xfb, +0x40, 1) (a sound: INFERRED, not drawn), byte 7 = 0;
// 3 -- blend, the flight until its velocity turns against itself (then velocity / acceleration 0, byte 7 = 1), the shake (float 4
// deg / frame, float 3), the shake timer; then A = +0x40, timer float 12 (frames, not x 60); 4 -- the shake (float 14, float 13),
// the timer -> sub-state 3
function sub260(S, D, ctx, out){
  const k = S.k, dt = ctx.dt;
  if (S.phase === 0){
    S.phase = 1;
    S.position = S.H.slice();
    S.timer = f(k.fl[6] * 60.0);
  }
  if (S.phase === 1){
    const T = S.timer;
    if (T > 0){
      const t = f(T - dt);
      S.timer = (0 >= t) ? 0 : t;
      if (t > 0) return;
    } else S.timer = 0;
    S.phase = 2;
    const p = S.position;
    S.D = [p[0], f(k.fl[8] + p[1]), p[2]];
    launch60(S, f(Math.abs(f(k.fl[8] / k.fl[7]))), f(0.0), S.D, S.position, true);
    blendTo60(S, wordsTo60(S.D, S.T), f(f(1.0) / f(mla(k.fl[7], k.fl[2], 60.0) * f(0.7))));
    S.stops.push({ slot: 'u331', mode: 0 });                                  // +0x1650, 0x43b058(h, 0)
    return;
  }
  if (S.phase === 2){
    turn60(S, dt);
    stepFlight(S, dt);
    if (!passed3D57(S, S.D)) return;
    S.phase = 3;
    S.position = S.D.slice();
    S.vib = f(k.fl[2] * 60.0); S.vibAngle = f(0.0);
    launch60(S, k.fl[10], k.fl[11], S.position, S.T, true);
    S.stopped = false;
    return;
  }
  if (S.phase === 3){
    turn60(S, dt);
    if (!S.stopped){
      const v0 = S.velocity, m0 = sqrtf(mla(mla(f(v0[1] * v0[1]), v0[0], v0[0]), v0[2], v0[2]));
      stepFlight(S, dt);
      const v1 = S.velocity, m1 = sqrtf(mla(mla(f(v1[1] * v1[1]), v1[0], v1[0]), v1[2], v1[2]));
      const i0 = f(f(1.0) / m0), i1 = f(f(1.0) / m1);
      const d = mla(mla(f(f(i0 * v0[1]) * f(i1 * v1[1])), f(v0[0] * i0), f(v1[0] * i1)), f(i0 * v0[2]), f(i1 * v1[2]));
      if (d <= 0){ S.velocity = [0, 0, 0]; S.gravity = [0, 0, 0]; S.stopped = true; }
    }
    shake60(S, k.fl[4], k.fl[3], dt);
    const T = S.vib;
    if (T > 0){
      const t = f(T - dt);
      S.vib = (0 >= t) ? 0 : t;
      if (t > 0) return;
    } else S.vib = 0;
    S.phase = 4;
    S.timer = k.fl[12];
    S.vibAngle = f(0.0);
    S.D = S.position.slice();
    return;
  }
  if (S.phase === 4){
    shake60(S, k.fl[14], k.fl[13], dt);
    const T = S.timer;
    if (T > 0){
      const t = f(T - dt);
      S.timer = (0 >= t) ? 0 : t;
      if (t > 0) return;
    } else S.timer = 0;
    S.sub = 3; S.phase = 0;
  }
}
// base60 sub-state 3 (0x437a20): phase 0 -- the words toward T, the flight to T at float 1 (0x437e4c, acceleration 0), hit 0's
// attack volume (vt+0x140: not drawn), EF 7 (U 301) and ef 4 (u 231) at +0x40 (0x437c2c / 0x437cac -> +0x1660 / +0x1654),
// u 300 stops (0); then (the same move) the flight; T passed in 3D -> +0x40 = T, the end (0) -- u 310 there -- and the camera id
// int 1 (0x43ac04: -1 in every mode, nothing)
function sub360(S, D, ctx, out){
  const k = S.k;
  if (S.phase === 0){
    S.phase = 1;
    S.angles = wordsTo60(S.position, S.T);
    launch60(S, k.fl[1], f(0.0), S.T, S.position, true);
    start60(S, D, 7, 'u301', out);
    start60(S, D, 4, 'u231', out);
    S.stops.push({ slot: 'u300', mode: 0 });                                  // +0x1648, 0x43b058(h, 0)
  }
  if (S.phase !== 1) return;
  stepFlight(S, ctx.dt);
  if (!passed3D57(S, S.T)) return;
  S.position = S.T.slice();
  end60(S, D, out, 0);
}
// base61's yaw word in the orbit and the dive (0x439954.. / 0x439a68..): the yaw from +0x40 to C (atan2(C - +0x40) as a word) plus
// the yaw offset +0x16f4 (deg) as a word; +0xfec alone (the pitch computed beside it is not stored)
function yawToC61(S){
  const p = S.position, C = S.C;
  const yw = s32(mla(0.5, atan2f(f(C[0] - p[0]), f(C[2] - p[2])), RAD_TO_U16));
  return u16(s32(mla(0.5, S.orbit.yawOff, DEG_TO_U16)) + yw);
}
// the point on the ellipse about C: (sin theta rx, ., cos theta rz) turned by u16(float 6 as a word + his Y word), x / z only
function ellipse61(S){
  const O = S.orbit, C = S.C, p = S.position;
  const x1 = f(sinf(O.theta) * O.rx), z1 = f(cosf(O.theta) * O.rz);
  const yw = u16(s32(mla(0.5, S.k.fl[6], DEG_TO_U16)) + O.hisY);
  const r = f(yw * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  S.position = [f(C[0] + mla(f(x1 * cs), z1, sn)), p[1], f(C[2] + mls(f(z1 * cs), x1, sn))];
}
// the orbit 0x43a1f4: +0x1680 += dt; theta += dt x w (+0x16d0); the ellipse point; w += dt x float 14 deg; 1 (and w = 0) when w
// changed sign (> 0 to < 0 or < 0 to > 0)
function orbit61(S, dt){
  const O = S.orbit;
  S.timer = f(dt + S.timer);
  O.theta = mla(O.theta, dt, O.wOrbit);
  ellipse61(S);
  const w0 = O.wOrbit, w1 = mla(w0, dt, f(S.k.fl[14] * DEG_RAD57));
  O.wOrbit = w1;
  if ((w0 > 0 && w1 < 0) || (w0 < 0 && w1 > 0)){ O.wOrbit = f(0.0); return true; }
  return false;
}
// the dive 0x439f9c: +0x1680 += dt; theta += dt x w (+0x16ac); while float 9 < clock <= float 10: w += dt x float 8 deg, then
// float 12 deg a floor (an upper bound when negative), float 11 deg a ceiling (a floor when negative); while float 16 < clock <=
// float 17: y += dt x float 15; the ellipse point; rx += dt x float 5, rz += dt x float 5 x rz / rx (the new rx)
function dive61(S, dt){
  const O = S.orbit, k = S.k;
  S.timer = f(dt + S.timer);
  O.theta = mla(O.theta, dt, O.wDive);
  const c = S.timer;
  if (c > k.fl[9] && !(c > k.fl[10])){
    const w = mla(O.wDive, dt, f(k.fl[8] * DEG_RAD57));
    let cur = w;
    O.wDive = w;
    const lo = f(k.fl[12] * DEG_RAD57);
    if (k.fl[12] < 0){ if (cur >= lo){ cur = lo; O.wDive = lo; } }
    else if (!(cur > lo)){ cur = lo; O.wDive = lo; }
    const hi = f(k.fl[11] * DEG_RAD57);
    if (k.fl[11] < 0){ if (cur <= hi) O.wDive = hi; }
    else if (!(cur < hi)) O.wDive = hi;
  }
  if (c > k.fl[16] && !(c > k.fl[17])) S.position[1] = mla(S.position[1], dt, k.fl[15]);
  ellipse61(S);
  const rx = mla(O.rx, dt, k.fl[5]);
  O.rx = rx;
  O.rz = mla(O.rz, dt, f(k.fl[5] * f(O.rz / rx)));
}
// base61 sub-state 2 (0x4397ec), from the orbit-on 0x43a374 ((7, 0x34)'s start, 0x10b57f0: the word +4's bits 8..23 = 2): phase 0 --
// +0x40 = O, EF 4 (U 360) at +0x40 (0x4398e4 -> +0x1670), u 331 stops (0), the clock 0, w (+0x16d0) = float 13 deg; 1 (the same
// move on) -- the orbit and the yaw word until the orbit's spin reverses: then the timer float 23 (frames); 2 -- the timer, then
// hit 0's volume (vt+0x140: not drawn) and the clock 0; 3 -- the dive and the yaw word, y kept >= 0, the clock >= float 18 ->
// sub-state 3 (0x4a184c: the hit off)
function sub261(S, D, ctx, out){
  const k = S.k, dt = ctx.dt;
  if (S.phase === 0){
    S.phase = 1;
    S.position = S.H.slice();
    start60(S, D, 4, 'u360', out);
    S.stops.push({ slot: 'u331', mode: 0 });                                  // +0x166c, 0x43b058(h, 0)
    S.timer = f(0.0);
    S.orbit.wOrbit = f(k.fl[13] * DEG_RAD57);
  }
  if (S.phase === 1){
    const done = orbit61(S, dt);
    S.angles[1] = yawToC61(S);
    if (done){ S.phase = 2; S.timer = k.fl[23]; }
    return;
  }
  if (S.phase === 2){
    const T = S.timer;
    if (T > 0){
      const t = f(T - dt);
      S.timer = (0 >= t) ? 0 : t;
      if (t > 0) return;
    } else S.timer = 0;
    S.phase = 3;
    S.timer = f(0.0);
    return;
  }
  if (S.phase === 3){
    dive61(S, dt);
    S.angles[1] = yawToC61(S);
    if (S.position[1] <= 0) S.position[1] = f(0.0);
    if (!(S.timer < k.fl[18])){ S.sub = 3; S.phase = 0; }
  }
}
// base61 sub-state 3 (0x439c10): phase 0 -- velocity (0, float 19, 0), acceleration (0, float 20, 0), hit 2's volume (not drawn),
// ef 5 (+0x15dc: (999, -1) in every mode -- nothing) -> +0x1674; then (the same move) the dive and the flight; y <= 0 -> y 0, the
// end (0) -- u 310 there
function sub361(S, D, ctx, out){
  const k = S.k;
  if (S.phase === 0){
    S.phase = 1;
    S.velocity = [f(0.0), k.fl[19], f(0.0)];
    S.gravity = [f(0.0), k.fl[20], f(0.0)];
    start60(S, D, 5, 'ef5', out);
  }
  if (S.phase !== 1) return;
  dive61(S, ctx.dt);
  stepFlight(S, ctx.dt);
  if (S.position[1] <= 0){ S.position[1] = f(0.0); end60(S, D, out, 0); }
}
// THE RE-AIM AND THE ORBIT AT AN ACTION'S START (vt+0x204): 0x10b4d38 calls 0x4380e4(anchor, [E+0x1428]+0x1d0) on each non-empty
// handle e+0xd420..+0xd430 in turn (then e+0xd439 = 0); 0x10b57f0 calls 0x43a374 on e+0xd450..+0xd45c. No state test in either:
// an anchor still in sub-state 0 / 1 is set to 2 the same; one ending (0xfe) is not moved by its move (state 1 only). (Whether
// the game empties a handle when its anchor dies is NOT READ: the viewer skips a dead one, 0xff.)
function anchors088(state, sp, ctx, out, a){
  const W = state.webs088;
  if (!W) return;
  if (sp.reaim){
    const T = ctx.own001.target;
    if (!T){ out.refused.push({ action: a.action, shell: 'shell60', why: 'no target (input.rock.target): 0x4380e4 aims at block +0x1d0' }); return; }
    for (const S of W.d420) if (S && S.state !== 0xff) reaim60(S, T);
  } else for (const S of W.d450) if (S && S.state !== 0xff){ S.sub = 2; S.phase = 0; }
}
// the end 0x438214 / 0x43a3ac (flag)""")

# ---- 4. step60: the sub-states 2 / 3 -------------------------------------------------------------------------------------
edit("""  else if (S.sub === 1) sub160(S, D, ctx, out);
""",
"""  else if (S.sub === 1) sub160(S, D, ctx, out);
  else if (S.sub === 2){ if (S.base === 'base61') sub261(S, D, ctx, out); else sub260(S, D, ctx, out); }
  else if (S.sub === 3){ if (S.base === 'base61') sub361(S, D, ctx, out); else sub360(S, D, ctx, out); }
""")

# ---- 5. spawn088: the rows that move the anchors --------------------------------------------------------------------------
edit("""    if (sp.lines){ if (fresh) lines088(state, D, a, ctx, input, out, sp); continue; }
""",
"""    if (sp.lines){ if (fresh) lines088(state, D, a, ctx, input, out, sp); continue; }
    if (sp.reaim || sp.orbit){                                     // the anchors' sub-state 2 (anchors088): nothing made
      if (sp.atStart ? fresh : (!fresh && !!state.hist && pass001(state, f(sp.frame)))) anchors088(state, sp, ctx, out, a);
      continue;
    }
""")

# ---- 6. the action rows ---------------------------------------------------------------------------------------------------
edit("""    act088(1, 0x24, '2', 'Motion[30]', [{ atWrap: true, web: 'shell61', modes: [0, 1, 2, 3] }]),
""",
"""    act088(1, 0x24, '2', 'Motion[30]', [{ atWrap: true, web: 'shell61', modes: [0, 1, 2, 3] }]),
    // THE THROW OF THE WEB (vt+0x204 0x10b4d38: the five d420 anchors' re-aim, sub-states 2 / 3). The status-7 body table
    // 0x10be780 (READ): (7, 0x2c) L2 M16 from 0 (0x10befe0 -> 0xafe84(E, 0x210, 4, 0)), its end the action's (0xb09c8 -> 0x6d53c);
    // (7, 0x2f) / (7, 0x36) L2 M3 / L2 M2 from 0 (0x10c1800(E, 6 / 2) -> 0x203 / 0x202; the turn 0x76dd0 -40 / +40 deg over f98..110);
    // (7, 0x31) L2 M17 from 0 (0x10bf040 -> 0x211), chained at f152 (0x10bf39c: 0xb0968(E, 1, 0, 152) -> 0x10bc334(E, 7, 0x32, 0))
    // into the throw (7, 0x32) -- L2 M17 from 160, the carried object's throw (the row above): here its 160 too. Issued by the
    // streams that issue the webs (em088_00_cmdtbl.emc, READ parse): g1 s110 (7, 0x2c); s105 (7, 0x2f) / (7, 0x36); s111 / s112 /
    // s113 (7, 0x31).
    act088(7, 0x2c, '2', 'Motion[16]', [{ atStart: true, reaim: 'shell60' }]),
    act088(7, 0x2f, '2', 'Motion[3]', [{ atStart: true, reaim: 'shell60' }]),
    act088(7, 0x36, '2', 'Motion[2]', [{ atStart: true, reaim: 'shell60' }]),
    act088(7, 0x31, '2', 'Motion[17]', [{ atStart: true, reaim: 'shell60' }, { frame: 160, shell: 'shell57', throw: true }]),
    // THE ORBIT (vt+0x204 0x10b57f0: the four d450 anchors' orbit-on, sub-states 2 / 3). (7, 0x34) is issued by no stream: only
    // (7, 0x33)'s chain (L2 M35 from 0, 0x10bf0f0 -> 0xafe84(E, 0x223, 4, 0); at f86 0x10bf3d4 -> 0x10bc334(E, 7, 0x34, 2)), and it
    // plays L2 M35 FROM 94 (0x10bf1cc -> 0xafe84(E, 0x223, 6, 94)), chained at f136 into (7, 0x37) (L2 M35 from 144). (7, 0x33) is
    // g1 s106's, the stream that issues (1, 0x1e). The viewer plays L2 M35 from 0: the orbit on the step crossing f86.
    act088(7, 0x33, '2', 'Motion[35]', [{ frame: 86, orbit: 'shell61' }]),
""")

for old, new in EDITS:
    n = s.count(old)
    if n != 1:
        sys.exit('anchor found %d times: %r' % (n, old[:90]))
    s = s.replace(old, new)
open(os.path.join(OUT, 'shells.js'), 'w', encoding='utf-8', newline=chr(13) + chr(10)).write(s)   # the repo file's CRLF kept
print('patched', len(EDITS), 'edits ->', os.path.join(OUT, 'shells.js'))
