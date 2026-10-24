// ---- BASE33 (uShellEmBase33: init 0x416688, move 0x416d30 -> 0x416df8, end 0x417338; +0x150 / +0x154 bx lr) -- the ground-riding
// wind (Kushala Daora's sp_33 0xb2). READ 2026-10-18 (dev/elder-dragon-shells-spec.md 4).
// sp_33's reader 0xdfe018 (READ whole): ef 0 -> +0x15c8; hit 0 / 1 -> +0x15d0 / +0x15d4; int 0 the joint +0x15d8, int 5 +0x15dc, int 3
// the end rule +0x15e0, int 4 the ride rule +0x15e4; +0x15e8 bit 0 int 2 != -1 (the init's ground snap), bit 1 int 1 != -1 (the aimed
// pitch); floats 0 the life +0x15ec, 3 the height factor +0x15f0, 4 the tolerance +0x15f4, 5 +0x15f8, 6 +0x15fc, 7 +0x1600 (the hit
// timer: +0x15fc + +0x1600 first, +0x1600 after), 9 / 8 the aim's limits +0x1604 / +0x1608 (deg); &vec 0..7 -> +0x160c..+0x1628 (0 the
// point in the joint's frame, 1 the height (y), 3 the word offsets (x X, y Y, deg), 4 the velocity, 6 / 7 the aim's from / to offsets)
function params033(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), i15dc: I(5), endRule: I(3), ride: I(4), flags: (I(2) !== -1 ? 1 : 0) | (I(1) !== -1 ? 2 : 0),
           life: F(0), height: F(3), tol: F(4), f15f8: F(5), hit0: F(6), hit1: F(7), limHi: F(9), limLo: F(8),
           v: [0, 1, 2, 3, 4, 5, 6, 7].map(V) };
}
// 0x416b40 (READ whole): the X word -- bit 1 clear: block +0x50 + u16(s32(0.5 + vec3.x x 182.04445)) (uxtah); set: the pitch from the
// block point + vec6 x 0xbe518 turned by the Y word (y + vec6.y x size + block +0x5c) to the target + vec7, clamped into [lo, hi] (the
// deg limits +0x1608 / +0x1604 as words): out of the arc, to the nearer end through the arc's midpoint 0x8000 | (arc >> 1)
function aim033(k, own){
  if (!(k.flags & 2)) return ((own.ownerX >>> 0) + u16(s32(mla(f(0.5), k.v[3][0], DEG_TO_U16)))) >>> 0;
  if (!own.ownerPos || !own.target) return 'the base33 aim (0x416b40) without the owner position / target';
  const sz = size001(own), v6 = k.v[6], v7 = k.v[7], P = own.ownerPos, T = own.target;
  const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const s2 = f(sz * v6[2]), s4 = f(sz * v6[0]);
  const x1 = mla(f(s4 * cs), s2, sn), z1 = mls(f(s2 * cs), s4, sn);
  const Mx = f(P[0] + x1), Mz = f(z1 + P[2]), My = f(mla(P[1], sz, v6[1]) + own.y5c);
  const Tx = f(v7[0] + T[0]), Tz = f(v7[2] + T[2]), Ty = f(v7[1] + T[1]);
  const dz = f(Tz - Mz), dx = f(Tx - Mx), h = sqrtf(mla(f(dz * dz), dx, dx)), dy = f(Ty - My);
  const lo = s32(mla(f(0.5), k.limLo, DEG_TO_U16)), hi = s32(mla(f(0.5), k.limHi, DEG_TO_U16));
  const w = s32(mla(f(0.5), atan2f(f(-dy), h), RAD_TO_U16));
  const arc = u16(hi - lo), d = u16(w - lo);
  if (d <= arc) return u16(w);
  return u16(((0x8000 | (arc >>> 1)) > d) ? hi : lo);
}
// base33's init 0x416688 (READ whole): the owner test, the reader; the point = vec0 through the joint's matrix (0xc15a4) with the
// projective divide (w 0 -> 0.0); bit 0: the floor below by 0x183490 (+-2000, mask 0x10; none -> 0.0) + vec1.y x +0x15f0; the X word
// 0x416b40, the Y word block +0x54 + u16(0.5 + vec3.y x 182.04445) (uxtah), Z 0; the velocity vec4 turned by the X word (ride != 0) and
// the Y word; state 1, the life +0x162c = +0x15ec, the hit timer +0x1630 = +0x15fc + +0x1600; ef 0 at +0x40 -> +0x1634
function init033(S, J, own, stage){
  const k = S.k;
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const [vx, vy, vz] = k.v[0];
  const w = f(M[15] + mla(mla(f(M[7] * vy), M[3], vx), M[11], vz));
  const inv = w !== 0 ? f(f(1.0) / w) : f(0.0);
  let x = f(inv * f(M[12] + mla(mla(f(vy * M[4]), vx, M[0]), vz, M[8])));
  let y = f(inv * f(M[13] + mla(mla(f(vy * M[5]), vx, M[1]), vz, M[9])));
  let z = f(inv * f(M[14] + mla(mla(f(vy * M[6]), vx, M[2]), vz, M[10])));
  if (k.flags & 1){
    const q = stageQuery([f(x + 0.0), f(y + f(-2000.0)), f(z + 0.0)], [f(x + 0.0), f(y + f(2000.0)), f(z + 0.0)], stage, 0x10);
    y = mla(q ? q.point[1] : f(0.0), k.v[1][1], k.height);
  }
  S.position = [x, y, z];
  const aw = aim033(k, own);
  if (typeof aw === 'string') return false;
  const X = aw >>> 0, Y = ((own.ownerY >>> 0) + u16(s32(mla(f(0.5), k.v[3][1], DEG_TO_U16)))) >>> 0;
  S.angles = [X, Y, 0];
  const v4 = k.v[4];
  let vel;
  if (k.ride !== 0){
    let r = f(f(u16(X)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    const y1 = mls(f(v4[1] * cs), v4[2], sn), z1 = mla(f(v4[2] * cs), v4[1], sn);
    r = f(f(u16(Y)) * U16_TO_RAD); sn = sinf(r); cs = cosf(r);
    vel = [mla(f(v4[0] * cs), z1, sn), y1, f(f(z1 * cs) - f(v4[0] * sn))];
  } else {
    const r = f(f(u16(Y)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    vel = [mla(f(v4[0] * cs), v4[2], sn), v4[1], f(f(v4[2] * cs) - f(v4[0] * sn))];
  }
  S.velocity = vel;
  S.gravity = [0, 0, 0];                     // +0x1020: the ctor's (0x416628) -- not written by the init
  S.anchor = S.position.slice();
  S.lifetime = k.life;                       // +0x162c
  S.hitTimer = f(k.hit0 + k.hit1);           // +0x1630
  S.sub33 = 0;                               // byte +5
  S.launch = { point: S.position.slice(), angles: S.angles.slice(), velocity: S.velocity.slice(), life: S.lifetime };
  return true;
}
// base33's state-1 move 0x416df8 (READ whole): the anchor, 0x539224, the floor below (+-2000, mask 0x10; none -> the class's +0x158 at
// +0x40 and the end); the life +0x162c counts down by dt (kept >= 0); while it runs, the hit timer +0x1630 (at 0: the hit re-armed --
// not visual -- and +0x1630 = +0x1600), and the ride by +0x15e4: 0 -- the height ground + vec1.y x +0x15f0 kept while |y - it| <= the
// tolerance +0x15f4, else the class's +0x158 at y - that offset and the end; 1 -- the end (+0x158 at the ground when it is no more than
// +0x15f8 above, else at the shell) once the ground is at or above the shell; 2 -- falling (the velocity re-turned by its X word) until
// it reaches the ground, then the X word 0, sub-state 1 and the velocity turned flat, then as 0. The life out: by +0x15e0 -- 0: the
// +0x158 at the ground when |y - (ground + offset)| <= the tolerance, else at y - offset; 1: at the ground when it is within +0x15f8
// above, else at the shell; other: at the shell -- and the end
function move033(S, ctx, D, out){
  const k = S.k, P = S.position;
  S.anchor = P.slice();
  stepFlight(S, ctx.dt);
  const Q = S.position;
  const q = stageQuery([f(Q[0] + 0.0), f(Q[1] + f(-2000.0)), f(Q[2] + 0.0)], [f(Q[0] + 0.0), f(Q[1] + f(2000.0)), f(Q[2] + 0.0)], ctx.stage, 0x10);
  const end = p => { child033(S, D, ctx, p); return 'end'; };
  if (!q) return end(Q.slice());
  const g = q.point[1], off = f(k.v[1][1] * k.height);
  const at = (yy) => [Q[0], yy, Q[2]];
  let T = S.lifetime, alive = false;
  if (T > 0){
    const t = f(T - ctx.dt);
    S.lifetime = f(0.0) >= t ? f(0.0) : t;
    alive = t > 0;
  } else S.lifetime = f(0.0);
  if (!alive){                                                     // 0x416ff4: the life out
    const y = Q[1];
    if (k.endRule === 0){
      const dd = f(y - f(off + g));
      return end(at(Math.abs(dd) <= k.tol ? g : f(y - off)));
    }
    if (k.endRule === 1){
      const s0 = f(g - y);
      return end(at(s0 >= 0 && s0 <= k.f15f8 ? g : y));
    }
    return end(Q.slice());
  }
  let U = S.hitTimer;                                              // 0x416f84
  if (U > 0){ const u = f(U - ctx.dt); S.hitTimer = f(0.0) >= u ? f(0.0) : u; if (!(u > 0)) S.hitTimer = k.hit1; }
  else S.hitTimer = k.hit1;                                        // (0x417074 / 0x41707c: re-armed, then +0x1630 = +0x1600)
  const y = Q[1];
  if (k.ride === 0){
    const s4 = f(off + g);
    if (Math.abs(f(y - s4)) > k.tol) return end(at(f(y - off)));
    S.position = [Q[0], s4, Q[2]];
    return 'keep';
  }
  if (k.ride === 1){
    const s0 = f(g - y);
    if (s0 >= 0) return end(at(s0 <= k.f15f8 ? g : y));
    return 'keep';
  }
  if (k.ride === 2){
    if (S.sub33 === 0){
      let X;
      if (!(y <= g)) X = S.angles[0];                              // still above: the velocity by its own X word
      else { X = 0; S.angles[0] = 0; S.sub33 = 1; S.position = [Q[0], f(off + g), Q[2]]; }
      const v4 = k.v[4];
      let r = f(f(u16(X)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
      const y1 = mls(f(v4[1] * cs), v4[2], sn), z1 = mla(f(v4[2] * cs), v4[1], sn);
      r = f(f(u16(S.angles[1])) * U16_TO_RAD); sn = sinf(r); cs = cosf(r);
      S.velocity = [mla(f(v4[0] * cs), z1, sn), y1, mls(f(z1 * cs), v4[0], sn)];
      return 'keep';
    }
    const s4 = f(off + g);
    if (Math.abs(f(y - s4)) > k.tol) return end(at(f(y - off)));
    if (g !== y) S.position = [Q[0], s4, Q[2]];
    return 'keep';
  }
  return 'keep';
}
// sp_33's +0x158 0xdfe2b4 (READ whole): sp_01 0xb0 mode [0x169d3f0][mode] (mode <= 0x16; else 0x10) at the point, the shell's words
const CHILD033 = [5, 5, 5, 5, 7, 5, 7, 5, 5, 5, 5, 16, 6, 6, 6, 6, 8, 6, 8, 6, 6, 6, 6];
function child033(S, D, ctx, p){
  const m = S.modeIndex <= 0x16 ? CHILD033[S.modeIndex] : 0x10;
  if (ctx.create) ctx.create(S, 'shell01', { mode: m, position: p.map(f), angles: S.angles.map(w => w >>> 0) });
}
function make033(state, D, m, J, own, ctx, action, frame){
  const def = D.shells.shell33, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell33 mode ' + m + ': no files' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell33', cls: def.cls, globalId: def.id, base: 'base33', mode, modeIndex: m,
              action, spawnFrame: frame, motion: ctx.motion, state: 1, position: null, prevPosition: null, anchor: null, angles: null,
              velocity: null, gravity: null, lifetime: 0, timer: 0, moves: 0, launch: null, events: [], folder: def.folder,
              effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params033(def, mode);
  if (!init033(S, J, own, ctx.stage)) return { why: 'shell33 mode ' + m + ': its init deleted it (no joint ' + S.k.joint + ', or no target for its aim)' };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// one base33 shell's step (vt+0x24 0x416d30): a dead handle dropped; state 1 the move; 0xfe the ending (+0x162c += dt: past 30 x 60
// deleted, or at once when the handle is gone)
function step33(S, ctx, input, D, out){
  S.events = [];
  S.place = null;
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.state === 1){
    S.moves++;
    if (move033(S, ctx, D, out) === 'end'){
      // 0x417338(0): the effect stopped (0x43b058(h, 0)), state 0xfe, +0x162c = 0
      S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
      if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
      S.state = 0xfe; S.lifetime = f(0.0);
      out.ended.push(S);
    }
  } else if (S.state === 0xfe){
    const t = f(ctx.dt + S.lifetime);
    S.lifetime = t;
    if (t > ENDING_FRAMES || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}
