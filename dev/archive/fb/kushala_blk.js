// ---- KUSHALA DAORA (em024_00): uEm024_00's sp_00 0xaf (base00, the wind balls), sp_01 0xb0 (base01), sp_33 0xb2 (base33, the
// ground-riding wind), sp_34 0xb3 (base34, the tornadoes), sp_38 0xb4 (base38, the wandering tornado); his beam 0xb1 is
// beam-spawns.js's ---------------------------------------------------------------------------------------------------------------
// READ 2026-10-18 (dev/elder-dragon-shells-spec.md 4). Which actions he plays: em024_00_cmdtbl.emc (fb/emcvar.py) closed over the
// set-action calls (fb/chain024.py: no call adds one). The makers (cengen11 with the class state poked: fb/rungen11k.py):
//   0xdf8610 (7, 0x00 / 0x01) L2 M10 / M11 f54: the aura level (P+0x1bb; 2 / 3 -> ctl+0x18 ? 1 / 2 : 2 / 3) & 0xfe == 2 -> sp_01 11 at
//     the owner's +0x40, its words;
//   0xdf88f0 (7, 0x02 / 0x03) L2 M7 f78: sp_33 0 / 1 (12 / 13 enraged on the snow maps); the 0x10-byte setup (base33 reads the owner);
//   0xdf96a8(e, kind, r2) (7, 0x0f..0x11 / 0x2c..0x2f / 0x36 / 0x42 kinds 0 1 2 5 6 7 8 9 10): L2 M1, then L2 M9 (0x209) with
//     P+0x1a3 = [0x169d3a0][2 kind + 1] shots (1, or 2 for kinds 1 / 5 / 7), one at each crossing of f20 (the clip loops: _loop from 6),
//     P+0x1a3 counted down at f46; the mode by kind, the shot (P+0x1a3) and, for kinds 6 / 9, the level (3 -> 10 / 12) -- sp_00 /
//     sp_33, the 0x30-byte sp_00 setup the GOT zero vectors (base00 takes the owner's words);
//   0xdf2670(e, side, kind) (7, 0x28 / 0x29 L2 M21 f76; 0x2a L2 M22 f102; 0x37 / 0x38 L2 M22 f102): sp_00 1 (level 2 / 3: 13), 9 (3:
//     10), 11 (3: 12).
// The level is the Wind Aura control (CLASS_CONTROLS.em024_00: P+0x1bb 0..3; ctl+0x18 not held: off). THE SNOW MAPS: every maker
// takes another mode when ctl+0x2c (enraged at the action start) AND ctl+0x2d (e+0x1053 in {3, 14, 20}) -- sp_33 12..21, sp_00
// 14..26 -- the viewer has no map, and the base ctor's 0xff is none: the plain modes play (as Tetsucabra's; the snow modes named in
// the spec, not shown). NOT LISTED (named): (7, 0x04 / 0x0a / 0x12..0x14 / 0x17 / 0x19 / 0x2b / 0x3b..0x41): no EMC stream or
// set-action call issues them.
function params024s00(def, mode){                  // sp_00's reader 0xdfd5ec (READ whole)
  // ef 0..3 -> +0x15c8..+0x15d4; ShellCmnParam int 0 the joint +0x15dc, float 0 the flight +0x15fc, &vec 1 the offset +0x1610, vec
  // 0's z vz +0x15f4; hit 0 -> +0x15d8; +0x15e8 |= 0x48 (bit 3: the offset turned by the final words; 0x40: the move keeps them);
  // sh vec 0 x / y -> degX +0x15ec / degY +0x15f0; byte +0x15c1 = 1 (the stage query after a hunter hit: not visual); sh int 0 / 1
  // -> +0x1660 / +0x1664 (the landing's children)
  const c = def.cmn, sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1;
  const v0 = sh.vecs[0] ? sh.vecs[0].map(f) : ZERO3.slice();
  return { joint: c.ints[0], flags: 0x48, degX: v0[0], xDeg: v0[0], degY: v0[1], yDeg: v0[1], vz: f(c.vecs[0][2]), vy: f(0),
           flight: f(c.floats[0]), xLo: f(0), xHi: f(0), yLo: f(0), yHi: f(0), vec: c.vecs[1].map(f), from: ZERO3.slice(),
           aimOff: ZERO3.slice(), gravity: ZERO3.slice(), m1660: I(0), m1664: I(1) };
}
READER00.uShellEm024_sp_00 = (def, mode) => params024s00(def, mode);
// sp_00's landing 0xdfd748 (READ whole; state 1 only): type 0 -> ef +0x15cc, 2 -> +0x15d4, 1 -> +0x15d0 after 0x43ac04 (the camera,
// the ctor's -1) and 0xdfd7e8 (the children); 0x3f8970 at the contact; then vt+0x148(0)
function landing024s00(S, D, hit, ctx){
  const param = [1, 2, 3][hit.type];
  if (hit.type === 1 && ctx && ctx.shellState) child024s00(S, D, hit.point, ctx);
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
}
LANDING.uShellEm024_sp_00 = (S, D, hit, ctx) => landing024s00(S, D, hit, ctx);
// 0xdfd7e8 (READ whole): the owner active (always); the mode in 0x3001800 (11 / 12 / 24 / 25) -> sp_38 0xb4 mode +0x1660; else sp_34
// 0xb3 +0x1660, then +0x1664, each registered in the owner's ring (0xdfd3a0) -- a mode -1 makes none. The setups: +0x10.. the
// shell's words +0xfe8.., +0x20.. the contact, +0x2c 0
function child024s00(S, D, point, ctx){
  const k = S.k, m = S.modeIndex, st = ctx.shellState, words = S.angles.map(w => w >>> 0);
  const put = r => { if (r && r.S){ st.shells.push(r.S); ctx.out.spawned.push(r.S); }
                     else if (r && r.why) ctx.out.refused.push({ shell: S.shell, mode: m, why: r.why }); return r && r.S; };
  const setup = { position: point.slice(), angles: words };
  if (m <= 0x19 && ((0x3001800 >>> m) & 1)){
    if (k.m1660 !== -1) put(make038(st, D, k.m1660, setup, ctx.own001, ctx, S));
    return;
  }
  for (const c of [k.m1660, k.m1664]){
    if (c === -1) continue;
    const S2 = put(make034(st, D, c, setup, ctx.own001, ctx, S));
    if (S2) ring024(st, S2, ctx);
  }
}
// 0xdfd3a0 (READ whole): the ring at ctl+0x30.. of ctl+0x44 slots (vt+0x1d8 0xdef120: tune int 0 = 2, clamped to 1..5), index
// ctl+0x48 (0 at the setup): the next slot (index + 1 mod n); a shell already there ended (vt+0x148(0)); the new one put there
const RING024_N = 2;
function ring024(st, S2, ctx){
  const R = st.ring024 || (st.ring024 = { slots: new Array(RING024_N).fill(null), idx: 0 });
  const nx = (R.idx + 1) % RING024_N, old = R.slots[nx];
  if (old && old.state === 1) end34(old, ctx);
  R.slots[nx] = S2; R.idx = nx;
}
// sp_01's reader 0xdfdb74 (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15cc; hit 0 -> +0x15d8; int 3 the joint +0x15e4; +0x15ec (bfc /
// orrne over the ctor's 0): 1 int 3, 0x400 int 0, 0x80 int 1, 0x800 int 4, 4 int 5, 8 int 6; &vec 0 -> +0x1608. The timer +0x15f0 the
// ctor's 0 (it lives while its hit slot does). 0x400 (base01 0x3fac58: y from the owner's ground) is not transcribed: refused by name
// (mode 0 alone, which no maker read here makes)
function params024s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(3) !== -1 ? 1 : 0) | (I(0) !== -1 ? 0x400 : 0) | (I(1) !== -1 ? 0x80 : 0) | (I(4) !== -1 ? 0x800 : 0) |
                (I(5) !== -1 ? 4 : 0) | (I(6) !== -1 ? 8 : 0);
  const why = !sh ? 'uShellEm024_sp_01: a mode its files do not carry'
            : (flags & 0x400) ? 'uShellEm024_sp_01: base01 flag 0x400 (0x3fac58) not transcribed' : null;
  return { flags, joint: I(3), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why, efAt: { 0x15c8: 0, 0x15cc: 1, 0x15d0: null } };
}
READERS01[0xdfdb74] = sh => params024s01(sh);

// ---- BASE33 (uShellEmBase33: init 0x416688, move 0x416d30 -> 0x416df8, end 0x417338; +0x150 / +0x154 bx lr) -- the ground-riding
// wind (Kushala Daora's sp_33 0xb2).
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

// ---- BASE34 (uShellEmBase34: ctor 0x417680.., init 0x417808, step 0x417c8c, move 0x417dc8, end 0x41839c; +0x150 bx lr) and BASE38
// (ctor ..0x41c25c, init 0x41c2a0, step 0x41c8a8, move 0x41c9e4, end 0x41d12c) -- Kushala Daora's tornadoes, made by sp_00's landing.
// sp_34's reader 0xdfe4cc (READ whole): ef 0..2 -> +0x15c8..+0x15d0; the sound 0x4a2378 int 0 / 1 -> +0x15d4 / +0x15d8 (float); hit 0
// -> +0x15dc; ints 0 / 1 / 2 -> +0x15e0 (the child's mode) / +0x15e4 (0: the growth and the children) / +0x15e8 (0: the owner's words);
// floats 0..7 -> +0x15ec (the life) .. +0x1608: 1 the turn's delay, 2 its rate (deg per frame, the sign its side), 3 its limit, 4 the
// growth time, 5 / 6 the child's first wait / its period, 7 the sway; &vec 0..3 -> +0x160c..+0x1618 (0 the offset, 1 y the Y word's
// degrees, 2 the velocity, 3 the unit's size at the init)
function params034(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { childMode: I(0), grow: I(1), words: I(2), life: F(0), delay: F(1), rate: F(2), limit: F(3), growT: F(4), wait: F(5),
           period: F(6), sway: F(7), v: [0, 1, 2, 3].map(V) };
}
// base34's init 0x417808 (READ whole): the owner and the setup tested (0x43a850, 0x4a100c +0x50 bit 0: the shell manager's -- always
// here); the reader; +0xfe8.. = the setup's +0x10.. (the owner's block +0x50.. when +0x15e8 == 0); X 0, Y += u16(s32(0.5 + vec1.y x
// 182.04445)) (uxtah); +0x40 = the setup's +0x20 + vec0 turned by the Y word; the floor by 0x183490 (y - 500 .. y + 500, mask 0x10: a
// hit -> its y); the velocity +0x1010 = vec2, the gravity the GOT zero vector, the turn +0x163c 0; +0x60.. = vec3; state 1, the life
// +0x1628 = +0x15ec, +0x1620 0; ef 0 (+0x15c8) at +0x40 -> +0x162c, ef 2 (+0x15d0) -> +0x1634; the hit (vt+0x140: not visual)
function init034(S, own, setup, stage){
  const k = S.k;
  let A = setup.angles.map(w => w >>> 0);
  if (k.words === 0) A = [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0];
  A[0] = 0;
  A[1] = (A[1] + u16(s32(mla(f(0.5), k.v[1][1], DEG_TO_U16)))) >>> 0;
  const r = f(f(u16(A[1])) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), v0 = k.v[0], P = setup.position;
  const x = f(P[0] + mla(f(v0[0] * cs), v0[2], sn)), z = f(mls(f(v0[2] * cs), v0[0], sn) + P[2]);
  let y = f(v0[1] + P[1]);
  const q = stageQuery([x, f(y + f(-500.0)), z], [x, f(y + f(500.0)), z], stage, 0x10);
  if (q) y = q.point[1];
  S.position = [x, y, z]; S.anchor = S.position.slice(); S.angles = A;
  S.velocity = k.v[2].slice(); S.gravity = [0, 0, 0];
  S.turn34 = 0;                                 // +0x163c
  S.clock34 = f(0.0);                           // +0x1378 (the unit's ctor)
  S.unitScale = k.v[3][0];                      // +0x60..+0x68 = vec3 (uniform in every mode)
  S.lifetime = k.life;                          // +0x1628
  S.elapsed34 = f(0.0);                         // +0x1620
  S.t1624 = f(0.0);                             // +0x1624 (the ctor's)
  S.launch = { point: S.position.slice(), angles: S.angles.slice(), life: S.lifetime, scale: S.unitScale };
  return true;
}
// base34's state-1 move 0x417dc8 (READ whole): the owner (always); the anchor; the velocity vec2 turned by the Y word less the turn
// (+0x15f4 >= 0) or plus it; past the delay (+0x1620 > +0x15f0) the turn += u16(s32(0.5 + |rate| x dt x 182.04445)), at most the
// limit's word (unsigned); the sway (+0x1608 > 0): +0x40 += (sin((2 x +0x1378 + 90) deg) x sway x dt) along the Y word's x axis, then
// +0x1378 += the frame step; 0x539224; moved -> the floor (y - 250 .. y + 250, mask 0x10): none -> the end, a hit -> y; +0x15e4 == 0:
// before the growth time the unit's size += dt (1 - vec3.x) / it (at 1: held, +0x1624 = 0; 0x43ab74), after it the child (+0x154)
// each time +0x1624 passes the wait (then -= the period), +0x1624 += dt; the class's +0x158; +0x1620 += dt; the life +0x1628 down by
// dt (at 0 or below: the end); the sound timer +0x161c (0x4ef190: not visual)
function move034(S, ctx, D){
  const k = S.k;
  S.anchor = S.position.slice();
  const v2 = k.v[2], acc = S.turn34 >>> 0;
  const w = u16(((k.rate >= 0 ? -acc : acc) + (S.angles[1] >>> 0)) | 0);
  let r = f(f(w) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  S.velocity = [mla(f(v2[0] * cs), v2[2], sn), v2[1], mls(f(v2[2] * cs), v2[0], sn)];
  if (S.elapsed34 > k.delay){
    let a2 = (acc + u16(s32(mla(f(0.5), f(Math.abs(k.rate) * ctx.dt), DEG_TO_U16)))) >>> 0;
    const lim = u16(s32(mla(f(0.5), k.limit, DEG_TO_U16)));
    if (a2 > lim) a2 = lim;
    S.turn34 = a2;
  }
  if (k.sway > 0){
    const ph = S.clock34;
    const ww = u16(s32(mla(f(0.5), f(f(ph + ph) + f(90.0)), DEG_TO_U16)));
    const amp = f(f(sinf(f(f(ww) * U16_TO_RAD)) * k.sway) * ctx.dt);
    r = f(f(u16(S.angles[1])) * U16_TO_RAD); sn = sinf(r); cs = cosf(r);
    const P = S.position, z0 = f(0.0);
    S.position = [f(P[0] + mla(f(amp * cs), sn, z0)), f(P[1] + z0), f(mls(f(cs * z0), amp, sn) + P[2])];
    S.clock34 = f(S.clock34 + ctx.dt);          // +0x1378 += [[0x211f764]+0x68], the frame step
  }
  stepFlight(S, ctx.dt);
  const P = S.position, A = S.anchor;
  if (P[0] !== A[0] || P[1] !== A[1] || P[2] !== A[2]){
    const q = stageQuery([P[0], f(P[1] + f(-250.0)), P[2]], [P[0], f(P[1] + f(250.0)), P[2]], ctx.stage, 0x10);
    if (!q) return 'end';
    S.position = [P[0], q.point[1], P[2]];
  }
  if (k.grow === 0){
    if (S.elapsed34 < k.growT){
      let s = mla(S.unitScale, ctx.dt, f(f(f(1.0) - k.v[3][0]) / k.growT));
      if (s > 1){ s = f(1.0); S.t1624 = f(0.0); }
      S.unitScale = s;                          // 0x43ab74
    } else {
      if (S.t1624 > k.wait){ child034(S, ctx, k.childMode); S.t1624 = f(S.t1624 - k.period); }
      S.t1624 = f(ctx.dt + S.t1624);
    }
  }
  kill024(S, k.life, ctx);                      // the class's +0x158 0xdfe7c4
  S.elapsed34 = f(S.elapsed34 + ctx.dt);
  const L = S.lifetime;
  if (!(L > 0)){ S.lifetime = f(0.0); return 'end'; }
  const t = f(L - ctx.dt);
  S.lifetime = f(0.0) >= t ? f(0.0) : t;
  return t > 0 ? 'keep' : 'end';
}
// sp_34's +0x154 0xdfe6e8 / sp_38's 0xdfec18 (READ whole): sp_01 0xb0 mode +0x15e0 / +0x15d8 at +0x40, the shell's words, +0x20 the
// GOT zero vector, +0x3c 0xffff
function child034(S, ctx, m){
  if (ctx.create) ctx.create(S, 'shell01', { mode: m, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) });
}
// sp_34's +0x158 0xdfe7c4 / sp_38's 0xdfecf4 (READ whole): the life below the reader's less 300 and the owner's action (0x6fe88) one of
// (7, 0x2a / 0x2b / 0x2d / 0x36 / 0x37 / 0x38) -> the life 0 (the shell ends on that move). The owner's action is the row's that
// plays (ctx.action024): the viewer knows the action only on a clip that carries one of his rows
const KILL024 = [0x2a, 0x2b, 0x2d, 0x36, 0x37, 0x38];
function kill024(S, life0, ctx){
  if (!(S.lifetime < f(life0 + f(-300.0)))) return;
  const a = ctx.action024;
  if (a && a[0] === 7 && KILL024.includes(a[1])) S.lifetime = f(0.0);
}
// base34's end 0x41839c / base38's 0x41d12c (vt+0x148(0), READ whole): not ending already -> its handles stopped (0x43b058(h, 0)),
// state 0xfe, the clock +0x1620 / +0x1624 = 0; ef 1 (+0x15cc) at +0x40 (every mode's (999, -1): none)
function end34(S, ctx){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
  S.state = 0xfe; S.ending = f(0.0);
  if (ctx && ctx.out) ctx.out.ended.push(S);
}
// base34's / base38's step (vt+0x24 0x417c8c / 0x41c8a8): a handle whose unit left states 1 / 2 dropped; state 1 the move (its end
// vt+0x148(0)); 0xfe the ending (+= dt: past 30 x 60 deleted, or at once with no handle left)
function step3438(S, ctx, input, D, out){
  S.events = [];
  S.place = null;
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.state === 1){
    S.moves++;
    if ((S.base === 'base34' ? move034 : move038)(S, ctx, D) === 'end') end34(S, ctx);
  } else if (S.state === 0xfe){
    const t = f(ctx.dt + S.ending);
    S.ending = t;
    if (t > ENDING_FRAMES || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}
function make3438(state, D, name, m, setup, own, ctx, creator){
  const def = D.shells[name], mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: name + ' mode ' + m + ': no files' };
  const S = { id: state.nextId++, monId: state.monId, shell: name, cls: def.cls, globalId: def.id, base: def.base, mode, modeIndex: m,
              action: creator ? creator.action : null, spawnFrame: creator ? creator.spawnFrame : null, motion: ctx.motion, state: 1,
              creator: creator ? creator.id : null, createdAtMove: creator ? creator.moves : null,
              setup: { position: setup.position.slice(), angles: setup.angles.slice() },
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, lifetime: 0, timer: 0,
              moves: 0, launch: null, events: [], folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = name === 'shell34' ? params034(def, mode) : params038(def, mode);
  if (!(name === 'shell34' ? init034 : init038)(S, own, setup, ctx.stage, ctx)) return { why: name + ' mode ' + m + ': its init deleted it' };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
const make034 = (state, D, m, setup, own, ctx, creator) => make3438(state, D, 'shell34', m, setup, own, ctx, creator);
const make038 = (state, D, m, setup, own, ctx, creator) => make3438(state, D, 'shell38', m, setup, own, ctx, creator);
// sp_38's reader 0xdfe9b4 (READ whole): ef 0..2 -> +0x15c8..+0x15d0; hit 0 -> +0x15d4; ints 0 / 1 -> +0x15d8 (the child's mode) /
// +0x15dc (0: the growth and the children); floats 0..14 -> +0x15e0..+0x1618: 0 the life, 1 the heading's spread (deg), 2 / 3 the
// speed's draw (low / high), 4 / 5 the turn's draw (deg per frame), 6 the least speed, 7 the init's speed step, 8 the speed's fall,
// 9 / 10 the turn's hold (frames), 11 the leash, 12 the growth time, 13 / 14 the child's first wait / its period; &vec 0 / 1 ->
// +0x161c / +0x1620 (the offset, the unit's size at the init)
function params038(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { childMode: I(0), grow: I(1), life: F(0), spread: F(1), spLo: F(2), spHi: F(3), rtLo: F(4), rtHi: F(5), spMin: F(6),
           spStep: F(7), spFall: F(8), holdLo: F(9), holdHi: F(10), leash: F(11), growT: F(12), wait: F(13), period: F(14), v: [V(0), V(1)] };
}
// THE DRAWS: 0x3f76ec, x' = 176 x mod 65363 (176 for 0), on the shell's +0x163c, seeded from the owner's halfword +0x73e8 (the action
// setter's: H73E8_STANDIN, 0 -- the game's draw cannot be known); each draw's fraction is the value BEFORE the step / 65535
const lehmer024 = x => x === 0 ? 176 : ((x * 176) % 65363) & 0xffff;   // (moveq on the input's cmp)
const frac024 = x => x === 0 ? f(0.0) : f(f(x) / f(65535.0));
// the turn's redraw (the init's and the move's 0x41caa0..0x41cb84): the rate's word, its sign (the old value's bit 0), the hold
function draw038(S){
  const k = S.k;
  let x = S.seed38;
  const d1 = frac024(x); x = lehmer024(x);
  const rate = s32(mla(f(0.5), mla(k.rtLo, f(k.rtHi - k.rtLo), d1), DEG_TO_U16));
  const sign = ((x << 1) & 2) - 1; x = lehmer024(x);
  S.rate38 = (sign * u16(rate)) | 0;                                    // +0x1648
  const d2 = frac024(x); x = lehmer024(x);
  S.hold38 = mla(k.holdLo, f(k.holdHi - k.holdLo), d2);                 // +0x1660
  S.seed38 = x;
}
// base38's init 0x41c2a0 (READ whole): the owner / setup tests; the reader; +0xfe8.. = the setup's +0x10.., X 0; +0x40 = the setup's
// +0x20 + vec0 turned by the Y word; the floor (y - 500 .. y + 500, mask 0x10); +0x1650.. = that point (the leash's centre); the draws:
// Y += s32(0.5 + (spread x d - spread x 0.5) x 182.04445) (uxtah), the top speed +0x1644 = lo + (hi - lo) d, the speed +0x1640 =
// min(+0x1640 + dt x 0.5 x the step, the top), then the turn (draw038); +0x60.. = vec1; state 1, the life +0x162c, +0x1624 0; ef 0
// (+0x15c8) at +0x40 -> +0x1630, ef 2 (+0x15d0) -> +0x1638. (The init's dt -- the unit's +0x1c then -- is taken as the step's: the
// move's floor below raises any speed under 6 to 6 on the first move, so it shows nowhere.)
function init038(S, own, setup, stage, ctx){
  const k = S.k;
  const A = setup.angles.map(w => w >>> 0);
  A[0] = 0;
  let r = f(f(u16(A[1])) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const v0 = k.v[0], P = setup.position;
  const x = f(P[0] + mla(f(v0[0] * cs), v0[2], sn)), z = f(mls(f(v0[2] * cs), v0[0], sn) + P[2]);
  let y = f(v0[1] + P[1]);
  const q = stageQuery([x, f(y + f(-500.0)), z], [x, f(y + f(500.0)), z], stage, 0x10);
  if (q) y = q.point[1];
  S.position = [x, y, z]; S.anchor = S.position.slice(); S.origin38 = S.position.slice();
  let s = H73E8_STANDIN & 0xffff;
  const d0 = frac024(s); s = lehmer024(s);
  const sp = f(mla(f(0.0), k.spread, d0) - f(k.spread * f(0.5)));
  A[1] = (A[1] + u16(s32(mla(f(0.5), sp, DEG_TO_U16)))) >>> 0;
  const d1 = frac024(s); s = lehmer024(s);
  S.top38 = mla(k.spLo, f(k.spHi - k.spLo), d1);                        // +0x1644
  const s4 = mla(f(0.0), f(ctx.dt * f(0.5)), k.spStep);                 // +0x1640 (the ctor's 0) + dt x 0.5 x the step
  S.speed38 = s4 >= S.top38 ? S.top38 : s4;
  S.seed38 = s;
  draw038(S);
  S.angles = A;
  S.velocity = [0, 0, 0]; S.gravity = [0, 0, 0];
  S.unitScale = k.v[1][0];                                              // +0x60..+0x68 = vec1
  S.lifetime = k.life;                                                  // +0x162c
  S.elapsed34 = f(0.0);                                                 // +0x1624
  S.t1624 = f(0.0);                                                     // +0x1628 (the ctor's)
  S.launch = { point: S.position.slice(), angles: S.angles.slice(), life: S.lifetime, scale: S.unitScale, rate: S.rate38, hold: S.hold38 };
  return true;
}
// base38's state-1 move 0x41c9e4 (READ whole): the owner (always); the anchor; the hold +0x1660 down by dt (at 0: draw038); the speed
// -= dt x 0.5 x the fall, at least the least; Y += u32(dt x 0.5 x the rate) (vcvt.u32: a negative rate turns nothing); the velocity
// (speed sin Y, -10, speed cos Y); 0x539224; past the leash from the centre: back onto it, and Y += the rate's sign x u16(s32(0.5 + dt
// x 182.04445)); moved -> the floor (y - 250 .. y + 250, mask 0x10): below it -> onto it, else a wall test (mask 0x20) from the point +
// 50 up back to the anchor + 50 (a hit: the point); +0x15dc == 0: the growth and the children as base34's (+0x1624 the clock, +0x1628
// the child's); the class's +0x158; +0x1624 += dt; the life +0x162c down (at 0, or the owner gone: the end)
function move038(S, ctx, D){
  const k = S.k, dt = ctx.dt;
  S.anchor = S.position.slice();
  const T = S.hold38;
  let redraw = true;
  if (T > 0){ const t = f(T - dt); S.hold38 = f(0.0) >= t ? f(0.0) : t; redraw = !(t > 0); } else S.hold38 = f(0.0);
  if (redraw) draw038(S);
  const half = f(dt * f(0.5));
  let sp = mls(S.speed38, half, k.spFall);
  if (sp < k.spMin) sp = k.spMin;
  S.speed38 = sp;
  const turn = f(half * f(S.rate38));
  const tw = !(turn > 0) ? 0 : turn >= 4294967296 ? 0xffffffff : Math.trunc(turn);   // vcvt.u32.f32 (saturating)
  S.angles[1] = ((S.angles[1] >>> 0) + tw) >>> 0;
  const r = f(f(u16(S.angles[1])) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), z0 = f(0.0);
  S.velocity = [mla(f(cs * z0), sp, sn), f(-10.0), mls(f(sp * cs), sn, z0)];
  stepFlight(S, dt);
  const O = S.origin38, Q = S.position;
  let dy = f(Q[1] - O[1]), dz = f(Q[2] - O[2]), dx = f(Q[0] - O[0]);
  let d2 = f(dy * dy); d2 = mla(d2, dx, dx); d2 = mla(d2, dz, dz);
  const dist = sqrtf(d2);
  if (k.leash < dist){
    if (!(dist < f(1.1920928955078125e-07))){ const inv = f(f(1.0) / dist); dz = f(dz * inv); dy = f(dy * inv); dx = f(dx * inv); }
    S.position = [mla(O[0], dx, k.leash), mla(O[1], dy, k.leash), mla(O[2], dz, k.leash)];
    const back = u16(s32(mla(f(0.5), f(half + half), DEG_TO_U16)));
    S.angles[1] = ((S.angles[1] >>> 0) + back * (S.rate38 < 0 ? -1 : 1)) >>> 0;
  }
  const P = S.position, A = S.anchor;
  if (P[0] !== A[0] || P[1] !== A[1] || P[2] !== A[2]){
    const q = stageQuery([P[0], f(P[1] + f(-250.0)), P[2]], [P[0], f(P[1] + f(250.0)), P[2]], ctx.stage, 0x10);
    const g = q ? q.point[1] : P[1];
    if (P[1] < g) S.position = [P[0], g, P[2]];
    else {
      const w = stageQuery([P[0], f(P[1] + f(50.0)), P[2]], [A[0], f(A[1] + f(50.0)), A[2]], ctx.stage, 0x20);
      if (w) S.position = w.point.slice();
    }
  }
  if (k.grow === 0){
    if (S.elapsed34 < k.growT){
      let s = mla(S.unitScale, dt, f(f(f(1.0) - k.v[1][0]) / k.growT));
      if (s > 1){ s = f(1.0); S.t1624 = f(0.0); }
      S.unitScale = s;                                                  // 0x43ab74
    } else {
      if (S.t1624 > k.wait){ child034(S, ctx, k.childMode); S.t1624 = f(S.t1624 - k.period); }
      S.t1624 = f(dt + S.t1624);
    }
  }
  kill024(S, k.life, ctx);                                              // the class's +0x158 0xdfecf4
  S.elapsed34 = f(S.elapsed34 + dt);
  const L = S.lifetime;
  if (!(L > 0)){ S.lifetime = f(0.0); return 'end'; }
  const t = f(L - dt);
  S.lifetime = f(0.0) >= t ? f(0.0) : t;
  return t > 0 ? 'keep' : 'end';
}

// the spawner (code 'em024'): rows { frame, shell, mode | lv: [mode by the Wind Aura level 0..3] | passes: [mode or lv, one per pass
// of the frame: the shots P+0x1a3 counts] }; each row's frame crossed on the action code's frame pair (pass001)
function spawn024(state, D, a, ctx, input, out, fresh){
  ctx.action024 = a.action;
  if (fresh){ state.shots024 = 0; return; }
  if (!state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints;
  const lv = Math.max(0, Math.min(3, (input.windAura024 | 0)));
  const pick = x => Array.isArray(x) ? x[lv] : x;
  for (const sp of a.spawns){
    const F = f(sp.frame);
    if (!pass001(state, F)) continue;
    let m;
    if (sp.passes){
      const j = state.shots024 | 0;
      if (j >= sp.passes.length) continue;
      state.shots024 = j + 1;
      m = pick(sp.passes[j]);
    } else m = sp.lv ? pick(sp.lv) : sp.mode;
    if (m == null) continue;
    if (sp.shell === 'shell00'){
      const S = make00n(state, D, m, J, own, ctx, a.action, F);
      if (S){ state.shells.push(S); out.spawned.push(S); }
      else out.refused.push({ action: a.action, shell: 'shell00', mode: m, why: 'shell00: no joint ' + D.shells.shell00.cmn.ints[0] });
    } else if (sp.shell === 'shell33'){
      const r = make033(state, D, m, J, own, ctx, a.action, F);
      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); } else out.refused.push({ action: a.action, shell: 'shell33', mode: m, why: r.why });
    } else if (sp.shell === 'shell01'){
      if (!own.ownerPos || !own.facing){ out.refused.push({ action: a.action, shell: 'shell01', mode: m, why: 'no owner position / facing' }); continue; }
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: m, position: own.ownerPos.slice(),
        angles: [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0], action: a.action, frame: F }, own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    }
  }
}
const act024 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em024', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
{
  const D = SHELL_DATA.em024_00;
  delete D.beamsOnly;
  D.lists = { 0: { list: 'u', pel: 'em024_00u' }, 1: { list: 'c', pel: 'em024_00c' } };
  D.shells.shell00 = { id: 0xaf, cls: 'uShellEm024_sp_00', base: 'base00', folder: 'shell\\em\\em024_00_shell00',
    lists: { 0: { list: 'u', pel: 'em024_00u' } },
    cmn: { ints: [3], floats: [72.0], vecs: [[0.0, 0.0, 40.0], [0.0, 0.0, 0.0]] },
    modes: {
      1: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [0, -1, -1], [], [[60.0, 0.0, 0.0]]),
      2: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [1, 2, -1], [], [[20.0, 0.0, 0.0]]),
      3: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [0, -1, -1], [], [[45.0, 0.0, 0.0]]),
      4: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [4, -1, -1], [], [[45.0, -30.0, 0.0]]),
      5: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [3, -1, -1], [], [[45.0, 30.0, 0.0]]),
      6: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [5, -1, -1], [], [[55.0, -40.0, 0.0]]),
      7: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [6, -1, -1], [], [[70.0, 40.0, 0.0]]),
      8: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [7, -1, -1], [], [[70.0, 0.0, 0.0]]),
      9: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [2], [8, -1, -1], [], [[45.0, 0.0, 0.0]]),
      10: m057(1.0, [[0, 80], [999, -1], [999, -1], [999, -1]], [1], [9, -1, -1], [], [[45.0, 0.0, 0.0]]),
      11: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [2], [0, -1, -1], [], [[45.0, 0.0, 0.0]]),
      12: m057(1.0, [[0, 80], [999, -1], [999, -1], [999, -1]], [1], [1, -1, -1], [], [[45.0, 0.0, 0.0]]),
      13: m057(1.0, [[0, 62], [999, -1], [999, -1], [999, -1]], [0], [10, 11, -1], [], [[60.0, 0.0, 0.0]]),
      14: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [12, -1, 0], [], [[60.0, 0.0, 0.0]]),
      15: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [13, 14, 0], [], [[60.0, 0.0, 0.0]]),
      16: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [12, -1, 0], [], [[45.0, 0.0, 0.0]]),
      17: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [16, -1, 0], [], [[45.0, -30.0, 0.0]]),
      18: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [15, -1, 0], [], [[45.0, 30.0, 0.0]]),
      19: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [17, -1, 0], [], [[55.0, -30.0, 0.0]]),
      20: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [18, -1, 0], [], [[70.0, 40.0, 0.0]]),
      21: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [19, -1, 0], [], [[70.0, 0.0, 0.0]]),
      22: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [3], [20, -1, 0], [], [[45.0, 0.0, 0.0]]),
      23: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [3], [21, -1, 0], [], [[45.0, 0.0, 0.0]]),
      24: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [4, -1, -1], [], [[45.0, 0.0, 0.0]]),
      25: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [1], [5, -1, -1], [], [[45.0, 0.0, 0.0]]),
      26: m057(1.0, [[0, 72], [999, -1], [999, -1], [999, -1]], [2], [22, 23, 0], [], [[60.0, 0.0, 0.0]]),
    },
    hitdata: [[0, 99], [0, 99], [0, 99], [0, 99]] };
  D.shells.shell01 = { id: 0xb0, cls: 'uShellEm024_sp_01', base: 'base01', reader: 0xdfdb74, folder: 'shell\\em\\em024_00_shell01',
    lists: { 0: { list: 'u', pel: 'em024_00u' }, 1: { list: 'c', pel: 'em024_00c' } },
    modes: {
      0: m057(1.0, [[999, -1], [999, -1]], [0], [0, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 400.0]]),
      1: m057(1.0, [[0, 30], [0, 33]], [1], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      2: m057(1.0, [[0, 31], [0, 34]], [12], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      3: m057(1.0, [[0, 32], [0, 35]], [2], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      4: m057(1.0, [[0, 32], [999, -1]], [3], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      5: m057(1.0, [[1, 120], [999, -1]], [4], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      6: m057(1.0, [[1, 121], [999, -1]], [5], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      7: m057(1.0, [[1, 130], [999, -1]], [6], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      8: m057(1.0, [[1, 131], [999, -1]], [7], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      9: m057(1.0, [[0, 30], [999, -1]], [8], [-1, 0, 0, 0, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      10: m057(1.0, [[0, 29], [999, -1]], [13], [-1, 0, 0, 0, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      11: m057(1.0, [[0, 31], [999, -1]], [9], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      12: m057(1.0, [[0, 30], [999, -1]], [14], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      13: m057(1.0, [[0, 29], [999, -1]], [15], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      14: m057(1.0, [[999, -1], [999, -1]], [11], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      15: m057(1.0, [[999, -1], [999, -1]], [10], [-1, -1, -1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
    },
    hitdata: [[10, 10], [16, 10], [16, 10], [16, 10], [10, 10], [10, 10], [10, 10], [10, 10], [14, 10], [14, 10], [16, 12], [16, 12],
              [16, 10], [14, 10], [14, 10], [14, 10]] };
  D.shells.shell33 = { id: 0xb2, cls: 'uShellEm024_sp_33', base: 'base33', folder: 'shell\\em\\em024_00_shell33',
    lists: { 0: { list: 'u', pel: 'em024_00u' } },
    modes: {
      0: m057(1.0, [[0, 61]], [1, 9], [3, -1, 0, 0, 0, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 200.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 60.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      1: m057(1.0, [[0, 61]], [1, 9], [3, 0, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 45.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 180.0, 400.0], [0.0, 50.0, 0.0]]),
      2: m057(1.0, [[0, 61]], [1, 9], [3, 0, -1, 0, 2, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 90.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 60.0], [0.0, 0.0, 0.0], [0.0, 120.0, 500.0], [0.0, 50.0, 0.0]]),
      3: m057(1.0, [[0, 61]], [2, -1], [3, 0, -1, 0, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 60.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 400.0, 400.0], [0.0, 50.0, 0.0]]),
      4: m057(1.0, [[0, 62]], [3, -1], [3, 0, -1, 0, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 60.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 400.0, 400.0], [0.0, 50.0, 0.0]]),
      5: m057(1.0, [[0, 61]], [2, -1], [3, 0, -1, 0, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 60.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 100.0, 520.0], [0.0, 50.0, 0.0]]),
      6: m057(1.0, [[0, 62]], [3, -1], [3, 0, -1, 0, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 60.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 100.0, 520.0], [0.0, 50.0, 0.0]]),
      7: m057(1.0, [[0, 61]], [7, -1], [3, -1, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [30.0, -15.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      8: m057(1.0, [[0, 61]], [7, -1], [3, -1, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [25.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      9: m057(1.0, [[0, 61]], [7, -1], [3, -1, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [30.0, 15.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      10: m057(1.0, [[0, 61]], [7, -1], [3, -1, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [30.0, 20.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      12: m057(1.0, [[0, 71]], [4, 9], [3, -1, 0, 0, 0, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 200.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 60.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      13: m057(1.0, [[0, 71]], [4, 9], [3, 0, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 45.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 180.0, 400.0], [0.0, 50.0, 0.0]]),
      14: m057(1.0, [[0, 71]], [4, 9], [3, 0, -1, 0, 2, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 90.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 60.0], [0.0, 0.0, 0.0], [0.0, 120.0, 500.0], [0.0, 50.0, 0.0]]),
      15: m057(1.0, [[0, 71]], [5, -1], [3, 0, -1, 0, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 60.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 400.0, 400.0], [0.0, 50.0, 0.0]]),
      16: m057(1.0, [[0, 72]], [6, -1], [3, 0, -1, 0, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 60.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 400.0, 400.0], [0.0, 50.0, 0.0]]),
      17: m057(1.0, [[0, 71]], [5, -1], [3, 0, -1, 0, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 60.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 100.0, 520.0], [0.0, 50.0, 0.0]]),
      18: m057(1.0, [[0, 72]], [6, -1], [3, 0, -1, 0, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, -80.0, 60.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 100.0, 520.0], [0.0, 50.0, 0.0]]),
      19: m057(1.0, [[0, 71]], [8, -1], [3, -1, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [30.0, -15.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      20: m057(1.0, [[0, 71]], [8, -1], [3, -1, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [25.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      21: m057(1.0, [[0, 71]], [8, -1], [3, -1, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [30.0, 15.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      22: m057(1.0, [[0, 71]], [8, -1], [3, -1, -1, 1, 1, -1], [150.0, 500.0, -500.0, 0.5, 280.0, 100.0, 9.0, 4.0, 0.0, 0.0], [[0.0, -60.0, 150.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [30.0, 20.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
    },
    hitdata: [[0, 0], [1, 9999], [1, 9999], [1, 9999], [1, 9999], [1, 9999], [1, 9999], [1, 9999], [1, 9999], [1, 9999]] };
  D.shells.shell34 = { id: 0xb3, cls: 'uShellEm024_sp_34', base: 'base34', folder: 'shell\\em\\em024_00_shell34',
    lists: { 0: { list: 'u', pel: 'em024_00u' } },
    modes: {
      0: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      1: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[200.0, 0.0, 0.0], [0.0, 5.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      2: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[-200.0, 0.0, 0.0], [0.0, -5.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      3: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, -26.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      4: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 26.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      5: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, 0], [160.0, 30.0, -1.0, 75.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 25.0], [1.0, 1.0, 1.0]]),
      6: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, 0], [160.0, 30.0, 1.0, 75.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 25.0], [1.0, 1.0, 1.0]]),
      7: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, -1], [360.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 30.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 8.0], [1.0, 1.0, 1.0]]),
      8: m057(1.0, [[0, 160], [999, -1], [999, -1]], [1], [14, 0, -1], [1200.0, 0.0, 0.0, 0.0, 22.0, 10.0, 210.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.05000000074505806, 0.05000000074505806, 0.05000000074505806]]),
      9: m057(1.0, [[0, 162], [999, -1], [999, -1]], [1], [15, 0, -1], [1200.0, 0.0, 0.0, 0.0, 22.0, 10.0, 210.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.05000000074505806, 0.05000000074505806, 0.05000000074505806]]),
      10: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, 0], [180.0, 30.0, -1.0, 75.0, 0.0, 0.0, 0.0, 0.0], [[-200.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 25.0], [1.0, 1.0, 1.0]]),
      11: m057(1.0, [[0, 150], [999, -1], [999, -1]], [0], [-1, -1, 0], [180.0, 30.0, 1.0, 75.0, 0.0, 0.0, 0.0, 0.0], [[200.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 25.0], [1.0, 1.0, 1.0]]),
      12: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      13: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[200.0, 0.0, 0.0], [0.0, 5.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      14: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[-200.0, 0.0, 0.0], [0.0, -5.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      15: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, -26.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      16: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, -1], [210.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 26.0, 0.0], [0.0, -15.0, 18.0], [1.0, 1.0, 1.0]]),
      17: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, 0], [160.0, 30.0, -1.0, 75.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 25.0], [1.0, 1.0, 1.0]]),
      18: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, 0], [160.0, 30.0, 1.0, 75.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 25.0], [1.0, 1.0, 1.0]]),
      19: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, -1], [360.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 30.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 8.0], [1.0, 1.0, 1.0]]),
      20: m057(1.0, [[0, 161], [999, -1], [999, -1]], [3], [14, 0, -1], [1200.0, 0.0, 0.0, 0.0, 22.0, 10.0, 210.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.05000000074505806, 0.05000000074505806, 0.05000000074505806]]),
      21: m057(1.0, [[0, 161], [999, -1], [999, -1]], [3], [15, 0, -1], [1200.0, 0.0, 0.0, 0.0, 22.0, 10.0, 210.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.05000000074505806, 0.05000000074505806, 0.05000000074505806]]),
      22: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, 0], [180.0, 30.0, -1.0, 75.0, 0.0, 0.0, 0.0, 0.0], [[-200.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 25.0], [1.0, 1.0, 1.0]]),
      23: m057(1.0, [[0, 151], [999, -1], [999, -1]], [2], [-1, -1, 0], [180.0, 30.0, 1.0, 75.0, 0.0, 0.0, 0.0, 0.0], [[200.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, -15.0, 25.0], [1.0, 1.0, 1.0]]),
    },
    hitdata: [[0, 9999], [0, 9999], [0, 9999], [0, 9999]] };
  D.shells.shell38 = { id: 0xb4, cls: 'uShellEm024_sp_38', base: 'base38', folder: 'shell\\em\\em024_00_shell38',
    lists: { 0: { list: 'u', pel: 'em024_00u' } },
    modes: {
      0: m057(1.0, [[0, 160], [999, -1], [999, -1]], [0], [14, 0], [900.0, 90.0, 10.0, 15.0, 0.800000011920929, 1.600000023841858, 6.0, 0.699999988079071, 0.009999999776482582, 90.0, 150.0, 1400.0, 22.0, 10.0, 210.0], [[0.0, 0.0, 0.0], [0.05000000074505806, 0.05000000074505806, 0.05000000074505806]]),
      1: m057(1.0, [[0, 162], [999, -1], [999, -1]], [0], [15, 0], [900.0, 90.0, 10.0, 15.0, 0.800000011920929, 1.600000023841858, 6.0, 0.699999988079071, 0.009999999776482582, 90.0, 150.0, 1400.0, 22.0, 10.0, 210.0], [[0.0, 0.0, 0.0], [0.05000000074505806, 0.05000000074505806, 0.05000000074505806]]),
      4: m057(1.0, [[0, 161], [999, -1], [999, -1]], [1], [14, 0], [900.0, 90.0, 10.0, 15.0, 0.800000011920929, 1.600000023841858, 6.0, 0.699999988079071, 0.009999999776482582, 90.0, 150.0, 1400.0, 22.0, 10.0, 210.0], [[0.0, 0.0, 0.0], [0.05000000074505806, 0.05000000074505806, 0.05000000074505806]]),
      5: m057(1.0, [[0, 161], [999, -1], [999, -1]], [0], [15, 0], [900.0, 90.0, 10.0, 15.0, 0.800000011920929, 1.600000023841858, 6.0, 0.699999988079071, 0.009999999776482582, 90.0, 150.0, 1400.0, 22.0, 10.0, 210.0], [[0.0, 0.0, 0.0], [0.05000000074505806, 0.05000000074505806, 0.05000000074505806]]),
    },
    hitdata: [[0, 9999], [0, 9999]] };
  const L23 = [null, null, 11, 11];
  D.actions = D.actions.concat([
    act024(7, 0x00, '2', 'Motion[10]', [{ frame: 54, shell: 'shell01', lv: L23 }]),
    act024(7, 0x01, '2', 'Motion[11]', [{ frame: 54, shell: 'shell01', lv: L23 }]),
    act024(7, 0x02, '2', 'Motion[7]', [{ frame: 78, shell: 'shell33', mode: 0 }]),
    act024(7, 0x03, '2', 'Motion[7]', [{ frame: 78, shell: 'shell33', mode: 1 }]),
    act024(7, 0x0f, '2', 'Motion[9]', [{ frame: 20, shell: 'shell33', passes: [3] }]),
    act024(7, 0x10, '2', 'Motion[9]', [{ frame: 20, shell: 'shell33', passes: [8, 9] }]),
    act024(7, 0x11, '2', 'Motion[9]', [{ frame: 20, shell: 'shell33', passes: [4] }]),
    act024(7, 0x2c, '2', 'Motion[9]', [{ frame: 20, shell: 'shell00', passes: [4, 5] }]),
    act024(7, 0x2d, '2', 'Motion[9]', [{ frame: 20, shell: 'shell00', passes: [[9, 9, 9, 10]] }]),
    act024(7, 0x2e, '2', 'Motion[9]', [{ frame: 20, shell: 'shell00', passes: [6, 7] }]),
    act024(7, 0x2f, '2', 'Motion[9]', [{ frame: 20, shell: 'shell00', passes: [8] }]),
    act024(7, 0x36, '2', 'Motion[9]', [{ frame: 20, shell: 'shell00', passes: [[11, 11, 11, 12]] }]),
    act024(7, 0x42, '2', 'Motion[9]', [{ frame: 20, shell: 'shell00', passes: [1] }]),
    act024(7, 0x28, '2', 'Motion[21]', [{ frame: 76, shell: 'shell00', lv: [1, 1, 13, 13] }]),
    act024(7, 0x29, '2', 'Motion[21]', [{ frame: 76, shell: 'shell00', lv: [1, 1, 13, 13] }]),
    act024(7, 0x2a, '2', 'Motion[22]', [{ frame: 102, shell: 'shell00', lv: [9, 9, 9, 10] }]),
    act024(7, 0x37, '2', 'Motion[22]', [{ frame: 102, shell: 'shell00', lv: [11, 11, 11, 12] }]),
    act024(7, 0x38, '2', 'Motion[22]', [{ frame: 102, shell: 'shell00', lv: [11, 11, 11, 12] }]),
  ]);
}
