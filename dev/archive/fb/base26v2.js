// SOULSEER's 04_26 reader 0x104e7c4 (READ whole): ef 0 / 1 -> +0x15c8 / +0x15cc; hits 0 / 1 -> +0x15d0 / +0x15d4; int 0 the joint
// +0x15d8; floats 0 Rx, 1 Rz, 3 the rate, 4 its change, 6 / 7 the change's window, 8 the fall, 9 / 10 its window, 2 the phase, 11 the
// height, 12 the growth, 13 the yaw offset, 5 the rate's clamp +0x1608; +0x1618 bit 1 = int 1 != -1 (the clamp on). +0x1604 (bit 0's
// clamp) the ctor's 0
function params082s26(mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: I(1) !== -1 ? 2 : 0, clampA: f(0.0), clampB: F(5), rx: F(0), rz: F(1), phase: F(2), rate: F(3), dRate: F(4),
           r0: F(6), r1: F(7), fall: F(8), y0: F(9), y1: F(10), height: F(11), grow: F(12), yaw: F(13) };
}
const READ26 = { 0xeab6b0: mode => Object.assign(params046s26(mode), { joint: -1, flags: 0, clampA: f(0.0), clampB: f(0.0) }),
                 0x104e7c4: mode => params082s26(mode) };
// the init 0x40fbfc: Rx / Rz, the rate x DEG_TO_RAD26; the joint +0x15d8: -1 -> the yaw word from the block to its target and the
// centre the block's point; else the block's own Y word (+0x54, as it is) and the centre that joint's world point (0xc164c); the
// phase; the point (sin phase x Rx, the height, cos phase x Rz) turned by the yaw plus the centre. State 1; ef 0 -> +0x1620; slot 0
function make26(state, D, m, ctx, own, action, frame, J){
  const def = D.shells.shell26, mode = def.modes[m];
  if (!mode) return { why: 'shell26 mode ' + m + ': no files in this arc' };
  const k = READ26[def.reader](mode);
  let yaw, P;
  if (k.joint === -1){
    if (!own.ownerPos || !own.target) return { why: 'no owner position / target (input.ownerPos, input.rock.target)' };
    const T = own.target;
    P = own.ownerPos.slice();
    yaw = u16(s32(mla(0.5, atan2f(f(T[0] - P[0]), f(T[2] - P[2])), RAD_TO_U16)));
  } else {
    const M = J ? jointMatrix(J, k.joint) : null;
    if (!M) return { why: 'no joint ' + k.joint };
    P = [f(M[12]), f(M[13]), f(M[14])];
    yaw = own.ownerY >>> 0;
  }
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell26', cls: def.cls, globalId: def.id, base: 'base26', mode,
              modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1, k, rx: k.rx, rz: k.rz, rate: f(k.rate * DEG_TO_RAD26),
              yaw, centre: P, theta: f(k.phase * DEG_TO_RAD26), t: f(0.0), clock: f(0.0), angles: [0, 0, 0], moves: 0, events: [],
              place: null, start: null, stop: null, effect: null, effect2: null, slots: null,
              effects: mode.ef.map(([listId, key], param) => ({ param, listId, key, started: false })) };
  const x = f(sinf(S.theta) * S.rx), y = k.height, z = f(cosf(S.theta) * S.rz);
  const r = f(u16(yaw) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  S.position = [f(P[0] + mla(f(x * cs), z, sn)), f(P[1] + y), f(P[2] + mls(f(z * cs), x, sn))];
  S.anchor = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'shell26');
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  if (S.start) S.effects[0].started = true;
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  return { S };
}
// the step 0x41018c: anchor = position; phase += step x rate; with t in (float r0, r1] the rate += step x the change x DEG_TO_RAD26,
// then the clamps under +0x1618 -- bit 1 by +0x1608 (a limit below 0 caps the rate at it from above, one at or above 0 from below),
// bit 0 by +0x1604 (below 0: from below, at or above: from above); with t in (y0, y1] y += step x the fall; x = sin phase x Rx, z =
// cos phase x Rz turned by the yaw word + u16(s32(0.5 + the yaw offset x 182.04445)) plus the centre's x / z; Rx += step x the growth,
// Rz += step x the growth x Rz / Rx (the new Rx)
function orbit26(S, dt){
  const k = S.k;
  S.anchor = S.position.slice();
  S.theta = mla(S.theta, dt, S.rate);
  const t = S.t;
  if (t > k.r0 && !(t > k.r1)){
    S.rate = mla(S.rate, dt, f(k.dRate * DEG_TO_RAD26));
    if (k.flags & 2){
      const lim = f(k.clampB * DEG_TO_RAD26);
      if (k.clampB < 0){ if (S.rate >= lim) S.rate = lim; }
      else if (!(S.rate > lim)) S.rate = lim;
    }
    if (k.flags & 1){
      const lim = f(k.clampA * DEG_TO_RAD26);
      if (k.clampA < 0){ if (!(S.rate > lim)) S.rate = lim; }
      else if (!(S.rate < lim)) S.rate = lim;
    }
  }
  let y = S.position[1];
  if (t > k.y0 && !(t > k.y1)) y = mla(y, dt, k.fall);
  const x = f(sinf(S.theta) * S.rx), z = f(cosf(S.theta) * S.rz);
  const w = u16((s32(mla(0.5, k.yaw, DEG_TO_U16)) + S.yaw) >>> 0);
  const r = f(w * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  S.position = [f(S.centre[0] + mla(f(x * cs), z, sn)), y, f(S.centre[2] + mls(f(z * cs), x, sn))];
  S.rx = mla(S.rx, dt, k.grow);
  S.rz = mla(S.rz, dt, f(k.grow * f(S.rz / S.rx)));
}
// the end 0x410420(shell, 0): 0x43b058 on +0x1620 / +0x1624, 0x4a1de4, vt +0x154 -- base26's `bx lr`, Soulseer's 0x104eb0c: ef 1 at its
// point into +0x1624 (0x4104bc) -- state 0xfe, t = 0
function end26(S, out, D){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.cls === 'uShellEm082_04_26' && D) contactStart(S, D, 1, S.position, 'end');
  S.state = 0xfe; S.clock = f(0.0);
  out.ended.push(S);
}
// the move 0x40ff60: 0x4a1698 and the handles' hygiene; state 1 -> 0x41005c: the owner inactive (never) -> the end; t +0x161c +=
// the step, the step 0x41018c, the words from the step's own travel (X = u16(atan2(-dy, |(dx, dz)|)), Y = u16(atan2(dx, dz)), Z
// kept); neither hit slot on -> the end; else vt +0x150 -- base26's `bx lr`; Soulseer's 0x104e9ec: a hunter hit (+0x151e: none) ends
// it, else base00's collide query and its +0x158 0x104eadc: a contact of any type but 1 ends it. State 0xfe: t += the step, deleted
// past 1800 or with both effects gone
function step26(S, ctx, input, D, out){
  S.events = [];
  step26in(S, ctx, input, D, out);
  for (const e of S.events) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
}
function step26in(S, ctx, input, D, out){
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, 0, S.effect)) S.effect.gone = true;
  if (S.effect2 && !S.effect2.gone && input.effectAlive && !input.effectAlive(S, 1, S.effect2)) S.effect2.gone = true;
  if (S.state === 1){
    S.t = f(ctx.dt + S.t);
    orbit26(S, ctx.dt);
    const d = [f(S.position[0] - S.anchor[0]), f(S.position[1] - S.anchor[1]), f(S.position[2] - S.anchor[2])];
    S.angles = [u16(s32(mla(0.5, atan2f(f(-d[1]), sqrtf(mla(f(d[2] * d[2]), d[0], d[0]))), RAD_TO_U16))),
                u16(s32(mla(0.5, atan2f(d[0], d[2]), RAD_TO_U16))), S.angles[2]];
    if (!(S.slots && S.slots.some(sl => sl.on))){ end26(S, out, D); return; }
    if (S.cls === 'uShellEm082_04_26'){
      const hit = collide(S, null, ctx.stage);
      if (hit && hit.type !== 1){ S.events.push({ ev: 'hit', point: hit.point, type: hit.type }); end26(S, out, D); }
    }
    return;
  }
  if (S.state === 0xfe){
    S.clock = f(ctx.dt + S.clock);
    if (S.clock > ENDING_FRAMES || (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone))) S.state = 0xff;
  }
}
