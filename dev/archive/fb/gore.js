
// ---- THE GORE LINE (uEm071_00: Gore Magala em071_00 v0, Chaotic em071_05 v5, Shagaru em072_00 -- em 0x48 on the same class) ------
// dev/gore-line-shells-spec.md (2026-10-19). The ids (vt+0x158 0xfad4ec, READ): e+0xcac4 / +0xcac8 / +0xcacc / +0xcad0 = sp_00 / sp_01 /
// sp_03 / sp_11 -- Gore 0x12d..0x130, Chaotic 0x131..0x134, Shagaru 0x135..0x138. Each class's reader forks by the shell's id
// (0x4a0ecc). Here: GORE MAGALA (v0).
//
// sp_00's reader 0xfc1a44 -> 0xfc1a98 (Gore; Chaotic 0xfc1c64 / Shagaru 0xfc1e4c add byte +0x15c1 = 1 for modes 1..2: the hunter-hit
// side): ef 0..3; hit 0; int 0 the joint +0x15dc; +0x15e8 = 4 | (int 1 != -1 ? 1 : 0); floats 0..6 -> degX +0x15ec, degY +0x15f0, vz
// +0x15f4, vy +0x15f8, the flight +0x15fc, X lo / hi +0x1600 / +0x1604; &vec 0 the offset +0x1610, &vec 1 the aim offset +0x1618,
// &vec 2 the gravity +0x161c
function params071s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: 4 | (I(1) !== -1 ? 1 : 0), degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(2), vy: F(3),
           flight: F(4), xLo: F(5), xHi: F(6), yLo: f(0), yHi: f(0), vec: V(0), from: ZERO3.slice(), aimOff: V(1), gravity: V(2) };
}
// sp_00's +0x150 0xfc2034(shell, point, result, type) (READ whole): modes 1..2 with type 0 / 2 -> nothing (it flies on); type 0 ef 1, type
// 2 ef 3, type 1 ef 2 and 0xfc2114 (modes 1 / 2: their sp_11 / sp_01 children -- no Gore file for those modes); mode 0 also 0xfc083c
// at +0x40 with its words (0xfc05ec: a CLASS effect request, id 1001 through 0x69ed0 after a ground ray -- the effects lane's, not a
// shell); the effect at the contact (0x3f8970); then the end
function landing071s00(S, D, hit, ctx){
  const m = S.modeIndex, t = hit.type;
  if ((t | 2) === 2 && ((m - 1) >>> 0) < 2) return 'keep';
  if (t === 1) child071s00(S, hit, ctx);                 // 0xfc2094: the children before the effect
  const param = t === 0 ? 1 : t === 2 ? 3 : t === 1 ? 2 : 0;
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// 0xfc2114(shell, &contact, &result) (READ whole): the owner active; mode 1 -> sp_11 (e+0xcad0) mode 0 with +0x3c = the shell's
// +0x13dc, mode 2 -> sp_01 (e+0xcac8) mode 0 with +0x3c 0xffff; at the contact, +0x20 the GOT zero vector, the words +0x30 =
// u32(asinf(n.z)) and +0x38 = u32(acosf(n.y / sqrt(0 + n.x^2 + n.z^2))) -- the RADIANS converted as they are (vcvt.u32, no scale:
// 0 on a floor, n.y / 0 -> NaN -> 0) -- and +0x34 = u16(s32(0.5 + atan2(T.x - c.x, T.z - c.z) x 10430.38)), T = +0x1640 (base00's
// init: the target copy, block +0x1d0 -- the viewer's target, which does not move)
function child071s00(S, hit, ctx){
  const m = S.modeIndex;
  if ((m !== 1 && m !== 2) || !ctx.create) return;
  const T = ctx.own001 && ctx.own001.target;
  if (!T){ ctx.out.refused.push({ shell: S.shell, mode: m, id: S.id, why: 'sp_00 landing child (0xfc2114): no target (input.rock.target)' }); return; }
  const n = hit.normal || [0, 1, 0], c = hit.point;
  const X = cvtU32(asinf(n[2]));
  const h = sqrtf(mla(mla(f(0.0), n[0], n[0]), n[2], n[2]));
  const Z = cvtU32(acosf(f(n[1] / h)));
  const Y = u16(s32(mla(f(0.5), atan2f(f(T[0] - c[0]), f(T[2] - c[2])), RAD_TO_U16)));
  ctx.create(S, m === 1 ? 'shell11' : 'shell01', { mode: 0, position: c.slice(), angles: [X >>> 0, Y, Z >>> 0] });
}
// sp_01's reader 0xfc2500 -> 0xfc2554 (Gore; Chaotic 0xfc26e4 without int 6; Shagaru 0xfc284c with int 2 -> 8 and without int 6):
// ef 0 -> +0x15c8, ef 2 -> +0x15cc, ef 1 -> +0x15d0 (the 0x20 switch's); hit 0; int 0 -> +0x15e8 (the switch's sound); +0x15ec: 4 int 1,
// 0x20 int 3 (and 0x40 with it: the sound), 0x80 int 4, 0x800 int 5, 0x1000 int 6 (the hit side's); float 0 the timer +0x15f0; &vec 0
// +0x1608. No joint: the ctor's -1
function params071s01(sh, def){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const id = def ? def.id : 0x12e, gore = id === 0x12e, shag = id === 0x136;
  const sw = I(3) !== -1;
  const flags = (I(1) !== -1 ? 4 : 0) | (shag && I(2) !== -1 ? 8 : 0) | (sw ? 0x60 : 0) | (I(4) !== -1 ? 0x80 : 0) | (I(5) !== -1 ? 0x800 : 0) |
                (gore && I(6) !== -1 ? 0x1000 : 0);
  return { flags, joint: -1, timer: f(sh && sh.floats.length ? sh.floats[0] : 0), f1600: f(0.0), f15fc: f(1.0), vec: V(0),
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm071_sp_01: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: 2, 0x15d0: 1 } };
}
READERS01[0xfc2500] = (sh, def) => params071s01(sh, def);
// sp_03's reader 0xfc2ad8 -> 0xfc2b2c (Gore): ef 0 -> +0x15c8, hit 0, int 0 the joint +0x15dc; floats 0 / 1 / 2 -> the fan +0x15f0, the
// speed +0x15f4, the life +0x15fc; +0x15e8 bits 0x10 and 0x20 by int 1 (no Gore mode); &vec 0 +0x1610; +0x1664: 8 int 2 (THE TURN at the
// target), 4 int 3 (THE TIMER from the target's distance), 1 int 4 (the other ground path, climb03); floats 5 / 3 / 4 / 6 / 7 -> the turn's
// degrees a frame +0x1668, the timer's min +0x166c / max +0x1670, the init's reach above +0x1674 / below +0x1678; ef 1 -> +0x1660 (the
// end's, 0x3fd820)
// The arms by id (0xfc2ad8): Chaotic's 0xfc2d60 the same ints, its floats 8 / 6 / 7 / 3 / 4 -> +0x1668 / +0x166c / +0x1670 / +0x1674 /
// +0x1678; Shagaru's 0xfc2f94 (READ whole): ef 0, hit 0, joint int 0, floats 0 / 1 / 2 the fan / speed / life, +0x15e8 0x10 and 0x20
// by int 1, vec 0, ef 1 -> +0x1660, floats 3 / 4 -> +0x1674 / +0x1678 -- no +0x1664 bit (no turn, no timer from the target, the
// follow path, no slope step). +0x15e8 0x10 / 0x20 (int 1): base00's REQUEST arm -- the setup's point and words (init03r)
function params071s03(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const id = def ? def.id : 0x12f, base = { joint: I(0), fanDeg: F(0), speed: F(1), life: F(2), vec: (sh.vecs[0] || ZERO3).map(f),
           flags: I(1) !== -1 ? 0x30 : 0, reach: f(500.0), follow: f(250.0), slope: false, ef1660: true };
  if (id === 0x137) return Object.assign(base, { ground: -1, reachUp: F(3), reachDown: F(4) });
  const chaotic = id === 0x133;
  return Object.assign(base, { ground: I(4) !== -1 ? 0 : -1, turn: I(2) !== -1, fromTarget: I(3) !== -1,
           turnDeg: F(chaotic ? 8 : 5), tMin: F(chaotic ? 6 : 3), tMax: F(chaotic ? 7 : 4), reachUp: F(chaotic ? 3 : 6), reachDown: F(chaotic ? 4 : 7) });
}
// base03's init 0x3fd9d8, the target arms (READ): setup byte +0x40 set -> +0x1640.. = setup +0x30.. (else base00's: block +0x1d0 + 16 x
// setup byte +0x2c, the target); +0x1664 bit 2 (0x3fdb74..0x3fdc64): the life +0x15fc and the timer +0x162c = clamp((|P - T| + |P.y - T.y|)
// / the speed, min +0x166c, max +0x1670), P the grounded point
function timer03(S){
  const k = S.k, P = S.position, T = S.target03;
  const dy = f(P[1] - T[1]), dx = f(P[0] - T[0]), dz = f(P[2] - T[2]);
  const d = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
  const t = f(f(d + Math.abs(f(P[1] - T[1]))) / k.speed);
  const v = t < k.tMin ? k.tMin : t > k.tMax ? k.tMax : t;
  S.k = Object.assign({}, k, { life: v }); S.timer = v;
}
// base03's turn 0x3fddcc (+0x1664 bit 3, the move's first call; while +0x16d0 is 0): the rate = s32(0.5 + +0x1668 x 182.04), this step's
// most = u32(dt x u16(rate)); the heading to +0x1640 = s32(0.5 + atan2(T.x - P.x, T.z - P.z) x 10430.4); |sxth(heading - Y)| < most -> Y =
// u16(heading); else d = u16(heading - Y): d < 0x6000 -> Y + most, d > 0xa000 -> Y - most, between -> kept; then the velocity remade
// from the words (0x3f95a4: vy +0x15f8, the speed +0x15f4)
function turn03(S, ctx){
  const k = S.k, P = S.position, T = S.target03;
  const rate = s32(mla(f(0.5), k.turnDeg, DEG_TO_U16));
  const head = s32(mla(f(0.5), atan2f(f(T[0] - P[0]), f(T[2] - P[2])), RAD_TO_U16));
  const most = cvtU32(f(f(ctx.dt) * f(u16(rate)))) >>> 0;
  const Y = S.angles[1] >>> 0;
  const d = (head - Y) | 0;
  const a = Math.abs((d << 16) >> 16);                   // sxth, rsble on the lsl 16 (0x3fde8c..0x3fde98): |the short turn|
  let nY = Y;
  if (a < (most | 0)) nY = u16(head);
  else {
    const u = d & 0xffff;
    if ((u >>> 13) <= 2) nY = (most + Y) >>> 0;
    else if (u > 0xa000) nY = (Y - most) >>> 0;
  }
  S.angles = [S.angles[0], nY, S.angles[2]];
  S.velocity = launchVelocity(f(0.0), k.speed, S.angles);   // +0x1010 only (0x3f95a4): +0x1690 is the init's
}
// a Gore sp_03 from a setup { target } (0xfb744c / 0xfb763c: the zero point and words -- base00's joint path -- setup +0x30 the target,
// byte +0x40 = 1, +0x2e the block's +0x9cc)
function make071s03(state, D, m, target, own, J, ctx, action, frame, req = null){
  const def = D.shells.shell03, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell03', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              launchVelocity: null, timer: 0, moves: 0, ground: 0, launch: null, events: [], folder: def.folder,
              effect: null, effect2: null, start: null, place: null, stop: null, target03: target.map(f) };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  if (!init03(S, def, J, req ? Object.assign({}, own, { requestPos: req.position, requestAngles: req.angles }) : own, ctx)) return null;
  S.prevPosition = S.position.slice();
  // ef 0 at base00's point (0x3f9298, inside base00's init: the joint's point and offset, BEFORE base03's ground step)
  S.start = rockRequest(D, mode, 0, S.launch.point, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}
// sp_11's reader 0xfc333c -> 0xfc3384 (Gore): ef 0 -> +0x15c8, hit 0; +0x15ec 4 by int 1; &vec 4 -> +0x1608 (none: the zero vector); the
// count +0x1658 = int 0, the times +0x1654[k] = float (k + 4)
// (Chaotic's arm 0xfc3540: vec 8 -> +0x1608 and the times float (k + 8); Shagaru's 0xfc36fc: Gore's)
function params071s11(def, mode, got, J, modeIndex){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const n = I(0) >= 1 ? I(0) : 0, table = [], b = def && def.id === 0x134 ? 8 : 4;
  for (let k = 0; k < n; k++) table.push(F(k + b));
  return { flags: I(1) !== -1 ? 4 : 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: sh.vecs[b] ? sh.vecs[b].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), table };
}
// sp_11's +0x168 0xfc38b8(shell, k) (READ whole): the owner active; the step's Y word = Y + u16(s32(0.5 + float k x 182.04)) (uxtah), vec k
// turned by it -> o; by the shell's mode (table 0xfc399c): 0 -> sp_03 7 (0x3fd7e0: no Gore file); 1 -> sp_01 [2, 3, 4, 0][k] at +0x40 + o,
// and for k >= 1 a second at +0x40 + o turned a half turn (x' = -x + z x -8.74e-8, z' = -z + x x 8.74e-8, the literals of 0xfc3f48 /
// 0xfc3f4c); 2 -> sp_01 [5, 6, 7, 0][k]; 3 / 4 / 5 -> sp_01 [8, 9, 10, 11][k], then the shell itself moves by o; 6 -> sp_01 [15, 16, 16,
// 16][k]. The children's words (X, the step's Y, Z); +0x3c 0xffff
// (the tables 0x16a1564 / 0x16a1580 / 0x16a159c / 0x16a15b8, read to their next table: mode 6's seven are 15, 16 x 6)
const T071S11 = { 1: [2, 3, 4, 0], 2: [5, 6, 7, 0], 3: [8, 9, 10, 11], 4: [8, 9, 10, 11], 5: [8, 9, 10, 11], 6: [15, 16, 16, 16, 16, 16, 16] };
function create071s11(S, idx, ctx, D){
  const sh = S.mode.sh, deg = idx < sh.floats.length ? f(sh.floats[idx]) : f(0), v = idx < sh.vecs.length ? sh.vecs[idx].map(f) : [0, 0, 0];
  const Y2 = ((S.angles[1] >>> 0) + u16(s32(mla(f(0.5), deg, DEG_TO_U16)))) >>> 0;
  const r = f(f(u16(Y2)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const oz = mls(f(v[2] * cs), v[0], sn), ox = mla(f(v[0] * cs), v[2], sn);
  const P = S.position, A = [S.angles[0] >>> 0, Y2, S.angles[2] >>> 0];
  const m = S.modeIndex, T = T071S11[m];
  const at = [f(ox + P[0]), f(v[1] + P[1]), f(oz + P[2])];
  // mode 0 (0xfc3acc): sp_03 (e+0xcacc) 7 from a 0x50 setup (0x3fd7e0): the point at +0x10, the words at +0x20 (base00's request
  // arm reads them there), byte +0x2c 0 and byte +0x40 0 (the target: block +0x1d0), +0x2e the shell's +0x1588
  if (m === 0){
    const st = ctx.shellState, own = ctx.own001;
    if (!D.shells.shell03 || !D.shells.shell03.modes[7] || !own.target) return;
    const S2 = make071s03(st, D, 7, own.target, own, ctx.J, ctx, S.action, null, { position: at, angles: A });
    S.events.push({ ev: 'create', stepped: true, shell: 'shell03', id: D.shells.shell03.id, mode: 7, position: at.slice(), angles: A.slice(),
                    child: S2 ? S2.id : null, deleted: !S2 });
    if (S2){ S2.creator = S.id; st.shells.push(S2); ctx.out.spawned.push(S2); }
    return;
  }
  if (!T) return;
  ctx.create(S, 'shell01', { mode: T[idx], position: at, angles: A });
  if (m === 1 && idx >= 1){
    const x2 = f(f(f(oz * f(-8.742277657347586e-08))) - ox), z2 = f(f(f(ox * f(8.742277657347586e-08))) - oz);
    ctx.create(S, 'shell01', { mode: T[idx], position: [f(x2 + P[0]), f(v[1] + P[1]), f(z2 + P[2])], angles: A });
  }
  if (m >= 3 && m <= 5) S.position = at;
}
// the Gore line's spawner (code 'em071'): rows { frame, shell, mode, at: 'zero' | 'block' (the block point, his words) | 'unit' (his
// +0x40), near: the block's height above the ground at most (0xfb4c8c / 0xfb5338: block +0x44 <= +0x5b4 + 900), probe: the ground 950 ahead
// within 500 below him (0x183664 from 500 above: 0xfbb93c..0xfbba58), target: 'target' | 'ahead' (block + (2000 sin Y, 0, 2000 cos Y)) }
function spawn071(state, D, a, ctx, input, out, fresh){
  if (!state.hist) return;
  const own = ctx.own001, J = state.prevJoints || ctx.J;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    const refuse = why => out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why });
    if (!own.ownerPos || !own.facing){ refuse('no owner position / facing'); continue; }
    if (sp.near != null){
      if (own.ground == null){ refuse('no ground (input.ground)'); continue; }
      if (own.ownerPos[1] > f(own.ground + f(sp.near))) continue;
    }
    if (sp.probe){
      const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), O = own.ownerPos;
      const px = f(O[0] + mla(f(cs * f(0.0)), sn, f(950.0))), pz = f(mls(f(cs * f(950.0)), sn, f(0.0)) + O[2]);
      const h = ground022([px, f(f(O[1] + f(0.0)) + f(500.0)), pz], ctx.stage);
      if (h == null || !(f(O[1] - h) < f(500.0))) continue;
    }
    if (sp.foot){ foot071(state, D, a, sp, own, J, ctx, out); continue; }
    if (sp.shell === 'shell00'){
      const S = make00n(state, D, sp.mode, J, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: [0, 0, 0] }), ctx, a.action, sp.frame);
      if (S){ state.shells.push(S); out.spawned.push(S); } else refuse('shell00: no files / no joint');
    } else if (sp.shell === 'shell03'){
      let T;
      if (sp.target === 'ahead'){
        const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), O = own.ownerPos;
        T = [f(O[0] + mla(f(cs * f(0.0)), sn, f(2000.0))), f(O[1] + f(0.0)), f(mls(f(cs * f(2000.0)), sn, f(0.0)) + O[2])];
      } else {
        if (!own.target){ refuse('no target (input.rock.target)'); continue; }
        T = own.target;
      }
      const S = make071s03(state, D, sp.mode, T, own, J, ctx, a.action, sp.frame);
      if (S){ state.shells.push(S); out.spawned.push(S); } else refuse('shell03: no files / no joint / no ground');
    } else {
      const S = make001(state, D, sp.shell, { id: D.shells[sp.shell].id, mode: sp.mode, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                               action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    }
  }
}
// THE FOOTFALL DUST 0xfb700c(e, joint, frame s0, x s1, z s2) (READ whole; its callers' gates READ): the frame test alone (0xb0974);
// the point = joint's position (0xc164c; joint 0: the block's +0x40) + (x cos Y + z sin Y, 0, z cos Y - x sin Y), Y the block's word
// +0x54; the ray 0x183664 down from it (ground022); a hit with block +0x44 - the ground < 1000 -> sp_01 (e+0xcac8) mode 1 at (x, the
// ground, z), +0x20 and the words the GOT zeros, +0x3c 0xffff. The callers (0xfb63d0 and the rest): quest rank >= 5 (0x3a8430; the
// rank's meaning INFERRED: owner001's), then Shagaru (em 0x48, variant 0) always; Chaotic (em 0x47, variant 5) only with the class
// block's counter C+0x84 at or past the table 0x16a1294's three tiers [rank class] (5000 / 10000 / 20000 for every class; the class 2
// for rank 4..6, 1 for 2..3, else 0) -- input.gauge071, default 0 (its writers: the per-frame 0xfae824..0xfaee44 and 0xfadc58, the
// reset (7, n) 0xfbc4ec -- NOT TRANSCRIBED: the viewer takes the value as an input); Gore (variant 0) never (his file has no mode 1)
const GAUGE071 = [[5000, 5000, 5000], [10000, 10000, 10000], [20000, 20000, 20000]].map(r => r.map(f));
function foot071(state, D, a, sp, own, J, ctx, out){
  if (!pass001(state, f(sp.frame))) return;
  if (!(own.rank >= 5)) return;
  if (sp.foot.gauge){
    const r = own.rank, c = ((r - 4) >>> 0) < 3 ? 2 : ((r - 2) >>> 0) <= 1 ? 1 : 0, g = f(ctx.gauge071 || 0);
    if (!(g >= GAUGE071[0][c]) || !(g >= GAUGE071[1][c]) || !(g >= GAUGE071[2][c])) return;
  }
  const [joint, x, z] = sp.foot.at;
  let B;
  if (joint !== 0){ const M = jointMatrix(J, joint); if (!M){ out.refused.push({ action: a.action, shell: 'shell01', mode: 1, why: 'no joint ' + joint }); return; } B = [f(M[12]), f(M[13]), f(M[14])]; }
  else B = own.ownerPos.slice();
  const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const px = f(B[0] + mla(f(cs * f(x)), sn, f(z))), pz = f(B[2] + mls(f(cs * f(z)), sn, f(x)));
  const p = [px, f(B[1] + f(0.0)), pz];
  const h = ground022(p, ctx.stage);
  if (h == null || !(f(own.ownerPos[1] - h) < f(1000.0))) return;
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: 1, position: [px, h, pz], angles: [0, 0, 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
}
// THE SCATTER (READ: dev/gore-line-shells-spec.md 2.4; built 2026-10-19). Started by vt+0x204 0xfadfa0 when the status-7 action (7, 0x53)
// begins (0xfae188: Shagaru's L4 M2 -> M11 -> M12, the Special entry 'S. Motion 2 Scatter'), ticked by vt+0x1dc 0xfae824 every move
// (before the action main; the start's frame ticks too: INFERRED order):
//   start: C+0xd4 = 1, the life C+0xf4 = 7200.0, the centre C+0xe0.. = his block point, the seed C+0xf0 = e+0x73e8 (the action setter's
//     draw: H73E8_STANDIN), the count C+0xf2 = 0, the wait C+0xf8 = 240.0;
//   another action's start while it runs (0xfae000..0xfae06c, before that action's own arm): C+0xd4 = 2 for status 10 / 11 (r1 & 0xfe
//     == 0xa), else 1; the centre = his point again; the seed = e+0x5fc0 (H5FC0_STANDIN; the count kept);
//   C+0xd4 == 1: the wait (0x7206c -> 0x539d5c at rate 1) out -> one sp_01 (e+0xcac8) 1: x = c.x + (((f0 f2 37) mod 3000) - 1500),
//     z = c.z + ((((13 f2 + 39) f0) mod 3000) - 1500) (u32), y = c.y + 1000; at quest rank >= 5 with f2 & 3 == 0, 0xfaf54c: hunter
//     (e+0x73e8 & 3)'s x / z in his area, else (no hunter: the viewer) the same two values NOT added to the centre, y 1000; the ray
//     0x183664 down, block +0x44 - h < 1000 -> the shell at (x, h, z), words and +0x20 the GOT zeros; f2 + 1; the wait = 90.0;
//   C+0xd4 1 or 2: the life (the same countdown) out -> C+0xd4 = 0 (0xfaf188..0xfaf1fc)
const H5FC0_STANDIN = 0;          // e+0x5fc0 (a halfword the reseed reads): its writer NOT READ -- a named stand-in, as e+0x73e8's
const cd071 = (t, dt) => { if (!(t > 0)) return [0, true]; const u = f(t - dt); return u <= 0 ? [0, true] : [u, false]; };   // 0x539d5c
function scatter071(state, D, ctx, input, out, fresh, a){
  const own = ctx.own001;
  let s = state.sc071;
  if (fresh){
    const chain = s && s.chain, clip = String(input.clip || '').replace(/_(start|loop)$/, ''), list = String(input.list);
    // the Special entry's next motion is the same action (no action start): L4 M2 -> M11 -> M12
    const next = chain && s.st && list === '4' && clip === chain[s.ci + 1];
    if (next) s.ci++;
    else {
      if (s && s.st && own.ownerPos){
        const st = a && a.action ? a.action[0] : 7;
        s.st = (st & 0xfe) === 0xa ? 2 : 1;
        s.c = own.ownerPos.slice(); s.f0 = H5FC0_STANDIN & 0xffff; s.chain = null;
      }
      if (a && a.scatter071 && own.ownerPos){
        s = state.sc071 = { st: 1, life: f(7200.0), c: own.ownerPos.slice(), f0: H73E8_STANDIN & 0xffff, f2: 0, wait: f(240.0),
                            chain: ['Motion[2]', 'Motion[11]', 'Motion[12]'], ci: 0 };
      }
    }
  }
  if (!s || !s.st) return;
  if (s.st === 1){
    const [w, fired] = cd071(s.wait, ctx.dt);
    s.wait = w;
    if (fired){
      const f0 = s.f0 >>> 0, f2 = s.f2 & 0xff;
      const ox = ((Math.imul(Math.imul(f0, f2), 37) >>> 0) % 3000) - 1500, oz = ((Math.imul((f2 * 13 + 39) >>> 0, f0) >>> 0) % 3000) - 1500;
      let p;
      if (own.rank >= 5 && (f2 & 3) === 0) p = [f(ox), f(1000.0), f(oz)];        // 0xfaf54c with no hunter (0xfaf5f8..)
      else p = [f(s.c[0] + f(ox)), f(s.c[1] + f(1000.0)), f(s.c[2] + f(oz))];
      const h = ground022(p, ctx.stage);
      if (h != null && own.ownerPos && f(own.ownerPos[1] - h) < f(1000.0) && D.shells.shell01.modes[1]){
        const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: 1, position: [p[0], h, p[2]], angles: [0, 0, 0], action: [7, 0x53], frame: null },
                          own, state.prevJoints || ctx.J, ctx, null);
        if (S){ state.shells.push(S); out.spawned.push(S); }
      }
      s.f2 = (f2 + 1) & 0xff;
      s.wait = f(90.0);
    }
  }
  const [l, out2] = cd071(s.life, ctx.dt);
  s.life = l;
  if (out2) s.st = 0;
}
const act071 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em071', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
