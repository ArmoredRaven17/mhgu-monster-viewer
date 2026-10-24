
// ---- VALSTRAX (em086_00): uEm086_00 (band 0x1094024..0x10a2e44, action main via emclasses) -----------------------------------------
// dev/elder-dragon-shells-spec.md 9 (2026-10-19). Ids: 0x174 uShellEm086_sp_56 (BASE56, folder shell00), 0x175 uShellEm086_sp_01 (base01).
// sp_01's reader 0x10a25b0 (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15d0 (the 0x20 switch's), hit 0 -> +0x15d8; +0x15ec: 0x800 by int 0,
// 0x20 by int 3; &vec 0 -> +0x1608. No joint, no timer read: the ctor's (-1, 0)
function params086s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 0x800 : 0) | (I(3) !== -1 ? 0x20 : 0);
  return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm086_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: 1 } };
}
READERS01[0x10a25b0] = sh => params086s01(sh);

// sp_56's reader 0x10a2788 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; int 0 -> +0x15dc (the joint); int 1 != -1 ->
// +0x15e8 bit 0 (aim at the TARGET block +0x1d0, else at his +0x40); float 0 -> +0x15ec (the speed); the common float 0 (0x4a2264) ->
// +0x15f0 (the life, 240); &vec 0 -> +0x15f4 (the start offset), &vec 1 -> +0x15f8 (the aim's offset); bit 1 always set
function params056(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: (I(1) !== -1 ? 1 : 0) | 2, speed: F(0), life: f((def.cmn && def.cmn.floats[0]) || 0),
           vec0: (sh.vecs[0] || ZERO3).map(f), vec1: (sh.vecs[1] || ZERO3).map(f) };
}
// x' = x c - y s, y' = y c + x s about Z; then X (y, z); then Y (x, z) -- the order base56's init turns the aim offset (0x42de0c..0x42deb8)
function turnZXY056(v, B){
  const K = U16_TO_RAD;
  let [x, y, z] = v;
  let r = f(f(u16(B.z)) * K), s = sinf(r), c = cosf(r);
  const x1 = f(f(x * c) - f(y * s)), y1 = f(f(y * c) + f(x * s));
  r = f(f(u16(B.x)) * K); s = sinf(r); c = cosf(r);
  const y2 = f(f(y1 * c) - f(z * s)), z2 = f(f(z * c) + f(y1 * s));
  r = f(f(u16(B.y)) * K); s = sinf(r); c = cosf(r);
  return [f(f(x1 * c) + f(z2 * s)), y2, f(f(z2 * c) - f(x1 * s))];
}
// the start offset (flag 2, 0x42e12c..0x42e1e4): turned X, then Y, then Z by the words
function turnXYZ056(v, A){
  const K = U16_TO_RAD, [vx, vy, vz] = v;
  let r = f(f(u16(A[0])) * K); const sX = sinf(r), cX = cosf(r);
  r = f(f(u16(A[1])) * K); const sY = sinf(r), cY = cosf(r);
  const z1 = f(f(vz * cX) + f(vy * sX)), y1 = f(f(vy * cX) - f(vz * sX));
  const x2 = f(f(vx * cY) + f(z1 * sY)), z2 = f(f(z1 * cY) - f(vx * sY));
  r = f(f(u16(A[2])) * K); const sZ = sinf(r), cZ = cosf(r);
  return [f(f(x2 * cZ) - f(y1 * sZ)), f(f(y1 * cZ) + f(x2 * sZ)), z2];
}
// base56's init 0x42dce4 (READ whole): the base's 0x43a850; +0x160c = setup byte +0x10, +0x1588 = halfword +0x12; the reader; the aim
// point +0x1610.. = vec 1 x his size (0xbe518), turned by the block's Z, X, Y words, + (flag 1 ? the block's +0x1d0 : his +0x40); the
// words = the block's X / Y, Z 0; state 1; the life +0x1608 = +0x15f0; +0x40 = the joint's row 3 (0xc15a4; joint -1: his +0x40);
// the start offset vec 0 turned X / Y / Z by the words (flag 2); the words re-aimed from the offset point at the aim point (X =
// atan2(-dy, |dxz|), Y = atan2(dx, dz)); +0x40 += the offset, +0x1000 = it; the velocity (0, 0, speed) turned Z (0), X, Y; ef 0 at +0x40
// -> +0x1600 (flags 0x10 / 0x20 / 8 not set by this reader)
function make056(st, D, m, own, J, ctx, action, frame){
  const def = D.shells.shell56, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell56 mode ' + m + ': no files' };
  if (!own.ownerPos || !own.facing) return { why: 'shell56: no owner position / facing' };
  const k = params056(def, mode), sc = scale001(own);
  const B = { x: own.ownerX >>> 0, y: own.ownerY >>> 0, z: own.ownerZ >>> 0 };
  let T = turnZXY056(k.vec1.map(x => f(x * sc)), B);
  let base;
  if (k.flags & 1){
    if (!own.target) return { why: 'shell56: no target (input.rock.target)' };
    base = own.target;
  } else base = own.ownerPos;
  T = [f(base[0] + T[0]), f(base[1] + T[1]), f(base[2] + T[2])];
  let A = [B.x, B.y, 0];
  let P;
  if (k.joint !== -1){
    const M = jointMatrix(J, k.joint);
    if (!M) return { why: 'shell56: no joint ' + k.joint };
    P = [f(M[12]), f(M[13]), f(M[14])];
  } else P = own.ownerPos.map(f);
  const o = turnXYZ056(k.vec0, A);
  const ox = f(o[0] + P[0]), oz = f(o[2] + P[2]), oy = f(o[1] + P[1]);
  const dx = f(T[0] - ox), dz = f(T[2] - oz), dy = f(T[1] - oy);
  const wY = s32(mla(f(0.5), atan2f(dx, dz), RAD_TO_U16));
  const h = sqrtf(mla(f(dz * dz), dx, dx));
  const wX = s32(mla(f(0.5), atan2f(f(-dy), h), RAD_TO_U16));
  A = [u16(wX), u16(wY), 0];
  P = [f(o[0] + P[0]), f(o[1] + P[1]), f(o[2] + P[2])];
  // the velocity: (0, 0, speed) turned by Z (0: x = cos 0 x 0 - sin 0 x 0), then X, then Y (0x42e310..0x42e3e4)
  const K = U16_TO_RAD;
  let r = f(f(u16(A[2])) * K), s = sinf(r), c = cosf(r);
  const vx0 = f(f(c * f(0.0)) - f(s * f(0.0))), vy0 = f(f(s * f(0.0)) + f(c * f(0.0)));
  r = f(f(u16(A[0])) * K); s = sinf(r); c = cosf(r);
  const vy1 = f(f(vy0 * c) - f(k.speed * s)), vz1 = f(f(k.speed * c) + f(vy0 * s));
  r = f(f(u16(A[1])) * K); s = sinf(r); c = cosf(r);
  const vel = [f(f(vx0 * c) + f(vz1 * s)), vy1, f(f(vz1 * c) - f(vx0 * s))];
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell56', cls: def.cls, globalId: def.id, base: 'base56', mode, modeIndex: m,
              action, spawnFrame: frame, motion: ctx.motion, state: 1, k, position: P, prevPosition: P.slice(), anchor: P.slice(),
              angles: A, velocity: vel, gravity: [f(0.0), f(0.0), f(0.0)], timer: k.life, aim: T, moves: 0, events: [], stops: [],
              handles: {}, live056: {}, folder: def.folder, effect: null, start: null, place: null, stop: null, lists };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.start = rockRequest(D, mode, 0, P, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  S.launch = { point: P.slice(), velocity: vel.slice(), gravity: S.gravity.slice(), angles: A.slice(), timer: k.life };
  return { S };
}
// base56's end 0x42e910 (vt+0x148(flag)): not ending -> ef 0's +0x1600 stopped (0x43b058), the hits off, vt+0x154 (bx lr), state 0xfe, the
// life +0x1608 = [0x162493c] x 60; flag 1 deletes
function end56(S, out, flag = 0){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag });
  S.state = 0xfe; S.timer = ENDING_FRAMES;
  out.ended.push(S);
}
// sp_56's +0x150 0x10a28bc(shell, point, result, type) (READ whole): type 1 ef 2 (+0x15d0), type 0 ef 1 (+0x15cc) -- each with 0x43ac04
// (a sound: not visual) and, the owner active, sp_01 at the contact with the shell's words, mode 14 when the shell's own mode is 6..11
// (0x4a0ee4) else 0 (both hit only); type 2 ef 3 (+0x15d4); the effect started at the contact (0x42dae8 -> +0x1604); then the end
function contact056(S, D, hit, ctx, out, J, st){
  const t = hit.type, param = t === 1 ? 2 : t === 0 ? 1 : t === 2 ? 3 : -1;
  if ((t === 0 || t === 1) && ctx.own001.ownerPos){
    const mode = (S.modeIndex - 6) >>> 0 < 6 ? 14 : 0;
    const C = make001(st, D, 'shell01', { id: 0x175, mode, position: hit.point.slice(), angles: S.angles.slice(), action: S.action, frame: S.spawnFrame },
                      ctx.own001, J, ctx, S);
    if (C){ st.shells.push(C); out.spawned.push(C); }
  }
  if (param >= 0){
    const rq = rockRequest(D, S.mode, param, hit.point, 'b4', listsOf(D, S));
    if (rq){ rq.slot = 'b4'; S.live056.b4 = { param, key: rq.key }; S.events.push({ ev: 'start', param, slot: 'b4', start: rq }); out.started.push({ shell: S, start: rq }); }
  }
  end56(S, out, 0);
}
// base56's move 0x42e4dc (READ whole): +0x1600 / +0x1604 dropped when their units left states 1 / 2; state 1 -> vt+0x158 0x42e5e8: vt+0x15c
// 0x42e7b8 (+0x1000 = +0x40; stepFlight; flag 4 clear: the words from the velocity, X = atan2(-vy, |vxz|), Y = atan2(vx, vz)); the owner
// gone -> the end; +0x15f0 > 0: the life -= the step (kept >= 0), out -> the end; else the hit slots idle -> the end; then the contact
// query 0x43ac8c -> +0x150. State 0xfe: the life counted down; out, or both handles gone -> deleted
function step56(S, J, ctx, input, D, out, st){
  S.events = []; S.stops = [];
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, 0, S.effect)) S.effect.gone = true;
  if (S.live056.b4 && input.effectAlive && !input.effectAlive(S, -1, { request: S.handles.b4 })) S.live056.b4 = null;
  if (S.state === 1){
    S.anchor = S.position.slice();
    stepFlight(S, ctx.dt);
    const v = S.velocity;
    const h = sqrtf(mla(f(v[2] * v[2]), v[0], v[0]));
    S.angles = [u16(s32(mla(f(0.5), atan2f(f(-v[1]), h), RAD_TO_U16))), u16(s32(mla(f(0.5), atan2f(v[0], v[2]), RAD_TO_U16))), S.angles[2]];
    if (!ctx.own001.ownerPos){ end56(S, out, 0); return; }
    if (S.k.life > 0){
      if (!(S.timer > 0)){ S.timer = f(0.0); end56(S, out, 0); return; }
      const t = f(S.timer - ctx.dt);
      S.timer = f(0.0) >= t ? f(0.0) : t;
      if (!(t > 0)){ end56(S, out, 0); return; }
    } else if (!(S.slots && S.slots.some(sl => sl.on))){ end56(S, out, 0); return; }
    const hit = collide(S, null, ctx.stage);
    if (hit){ S.events.push({ ev: 'hit', point: hit.point, type: hit.type }); contact056(S, D, hit, ctx, out, J, st); }
  } else if (S.state === 0xfe){
    if (!(S.timer > 0)){ S.timer = f(0.0); S.state = 0xff; return; }
    const t = f(S.timer - ctx.dt);
    S.timer = f(0.0) >= t ? f(0.0) : t;
    if (!(t > 0)) S.state = 0xff;
    else if (!(S.effect && !S.effect.gone) && !S.live056.b4) S.state = 0xff;
  }
}

// (7, 0xc8 / 0xc9) phase 0 0x1098b2c(e, 1) (READ whole): the target block +0x1d0 KEPT IN A CONE in front of him -- O = his block point +
// tune vec 3 x his size; d = the target - O in his own frame (vt+0x54(-1): his world matrix +0xb0's rows 0 / 1 / 2 -> a, b, f); a kept
// within |f| tan(tune int 0xb deg), b within |f| tan(int 0xa deg); when either is cut, the target = O + a' row 0 + b' row 1 + f row 2
function cone086(own, V, limA, limB){
  const M = own.ownerMatrix, sz = scale001(own), P = own.ownerPos, T = own.target;
  const Ox = f(f(V[0] * sz) + P[0]), Oy = f(f(V[1] * sz) + P[1]), Oz = f(f(V[2] * sz) + P[2]);
  const dx = f(T[0] - Ox), dy = f(T[1] - Oy), dz = f(T[2] - Oz);
  const fw = mla(mla(f(dy * M[9]), dx, M[8]), dz, M[10]);
  const a = mla(mla(f(dy * M[1]), dx, M[0]), dz, M[2]);
  const b = mla(mla(f(dy * M[5]), dx, M[4]), dz, M[6]);
  const D2R = f(0.01745329238474369);
  const tB = tanf(f(f(limB) * D2R)), tA = tanf(f(f(limA) * D2R));
  const af = Math.abs(fw), lB = f(af * tB), lA = f(af * tA);
  const a1 = a > lB ? lB : a, b1 = b > lA ? lA : b;
  const a2 = f(-lB) > a1 ? f(-lB) : a1, b2 = f(-lA) > b1 ? f(-lA) : b1;
  if (!(b1 < f(-lA)) && b <= lA && a <= lB && !(a1 < f(-lB))) return T.slice();
  const x = mla(mla(f(b2 * M[4]), a2, M[0]), fw, M[8]), y = mla(mla(f(b2 * M[5]), a2, M[1]), fw, M[9]), z = mla(mla(f(b2 * M[6]), a2, M[2]), fw, M[10]);
  return [f(x + f(f(V[0] * sz) + P[0])), f(y + f(f(V[1] * sz) + P[1])), f(z + f(f(V[2] * sz) + P[2]))];
}
const VEC3_086 = [0, 0, 0];   // tune vec 3 (0x6f640(e, 3)): filled from the arc by the rows' `cone` (rFreeUseParam vt+0x54)

// the spawner (code 'em086'): rows { frame | start, shell 'shell56' | 'shell01', mode, cone (the (7, 0xc8 / 0xc9) target), words ('saved':
// the block's words at the previous phase's end -- (7, 0x31)'s e+0xcac0..) }
function spawn086(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  if (fresh){
    state.target086 = null; state.words086 = own.facing ? [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0] : null;
    for (const sp of a.spawns) if (sp.cone && own.target && own.ownerMatrix && own.ownerPos) state.target086 = cone086(own, sp.cone.vec, sp.cone.limA, sp.cone.limB);
  }
  if (!state.hist) return;
  const J = state.prevJoints || ctx.J;
  for (const sp of a.spawns){
    if (sp.start ? !fresh : !pass001(state, f(sp.frame))) continue;
    const refuse = why => out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why });
    if (!own.ownerPos || !own.facing){ refuse('no owner position / facing'); continue; }
    if (sp.shell === 'shell56'){
      if (sp.cone && !state.target086){ refuse('no target / owner matrix for the cone (input.rock.target, input.ownerMatrix)'); continue; }
      const o2 = sp.cone ? Object.assign({}, own, { target: state.target086 }) : own;
      const r = make056(state, D, sp.mode, o2, J, ctx, a.action, sp.frame);
      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); } else refuse(r.why);
    } else if (sp.shell === 'shell01'){
      const words = sp.words === 'saved' && state.words086 ? state.words086 : [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0];
      const S = make001(state, D, 'shell01', { id: 0x175, mode: sp.mode, position: own.ownerPos.slice(), angles: words.slice(), action: a.action, frame: sp.frame },
                        own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    }
  }
}
const act086 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em086', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
