# ins009.py (2026-10-20): Gypceros (em009_00) into docs/render/shells.js -- sp_00 0x76 (base00), sp_01 0x77 (base01), sp_13 0x78 (base13),
# sp_44 0x79 (BASE44), sp_52 0x7a (BASE52), sp_53 0x7b (BASE53); his frame handler 0xd5d508 and (7, 0x02)'s clock
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'
BS = chr(92)
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
def rep(a, b, cnt=1):
    global s
    a = a.replace('\n', NL); b = b.replace('\n', NL)
    assert s.count(a) == cnt, (s.count(a), a[:70])
    s = s.replace(a, b)

blk = r'''// ---- GYPCEROS (em009_00, uEm009_00): sp_00 0x76 (base00), sp_01 0x77 (base01), sp_13 0x78 (base13), sp_44 0x79 (base44), sp_52 0x7a
// (base52), sp_53 0x7b (base53) -- dev/em009-shells-spec.md (shells agent, 2026-10-20; dev/shells-gypceros-check.mjs). Ids immediates.
// The census of his reach (trgen g09cap.py / g09sw.py: every action x phase, the ctl clocks primed too):
//   (2, 0x0b) phase 0 a turn (0x7a284), phase 1's end L4 M4 (0x404): phase 2 f48 / f74 sp_00 10 / 11; (7, 0x1b / 0x25 / 0x33 / 0x3a) the same
//   on L4 M4 phase 1; (7, 0x19 / 0x1a) L4 M6 f32 sp_00 3 / 0; (7, 0x17) L4 M6 f32 sp_13 1; (7, 0x46 / 0x4a) L4 M6 f31 sp_00 12, (7, 0x47 /
//   0x4b) 13, (7, 0x48 / 0x4c) 14; (7, 0x02) phase 2 L2 M21: sp_01 1 on the clock [e+0xcac0]+0 (counter009)
// sp_00 (vtable 0x179da38; reader 0xd5f698 READ whole): ef i -> +0x15c8 + 4i; hit 0 -> +0x15d8; int 0 the joint +0x15dc; int 1 -> 8, int 3 ->
//   0x80, int 4 -> 0x100, int 5 -> 0x200; floats 0 vz +0x15f4, 1 vy +0x15f8, 2 the flight +0x15fc, 3 X deg +0x15ec, 4 Y deg +0x15f0; &vec 0
//   the offset +0x1610, &vec 1 the gravity +0x161c; bytes +0x1660 / +0x1661 / +0x1662 = int 2 / 6 / 7 != -1. Its move 0xd6026c = base00's
//   then (+0x1662) a ground marker (0x43b2b0: not visual). Landing 0xd5f8fc (READ whole): type 1 ef 2 and +0x1660 -> sp_44 (0xd5fb48),
//   else +0x1661 -> sp_52 (0xd5fe50, 1), else sp_01 0 at the contact; type 0 ef 1 and +0x1661 -> sp_52 (0xd5fe50, 0), else sp_01 0; type 2
//   ef 3; then 0x3f8970 and the end
function params009s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0.0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(1) !== -1 ? 8 : 0) | (I(3) !== -1 ? 0x80 : 0) | (I(4) !== -1 ? 0x100 : 0) | (I(5) !== -1 ? 0x200 : 0);
  return { joint: I(0), flags, vz: F(0), vy: F(1), flight: F(2), degX: F(3), xDeg: F(3), degY: F(4), yDeg: F(4),
           xLo: f(0.0), xHi: f(0.0), yLo: f(0.0), yHi: f(0.0), vec: V(0), gravity: V(1), from: ZERO3.slice(), aimOff: ZERO3.slice(),
           b1660: I(2) !== -1, b1661: I(6) !== -1, b1662: I(7) !== -1 };
}
// the clamp both makers apply to a cosine (0xd5fbcc..0xd5fc10): c > 0 -> (c - 1 < 0 ? that : 0) + 1; else -(((-1 - c) < 0 ? that : 0) + 1)
function clamp009(c){
  if (c > 0){ const r = f(c + f(-1.0)); return f((r < 0 ? r : f(0.0)) + f(1.0)); }
  const r = f(f(-1.0) - c);
  return f(-f((r < 0 ? r : f(0.0)) + f(1.0)));
}
const words009 = e => [u16(s32(mla(0.5, e.x, RAD_TO_U16))), u16(s32(mla(0.5, e.y, RAD_TO_U16))), u16(s32(mla(0.5, e.z, RAD_TO_U16)))];
// 0xd5fb48 = 0xd60b54 (sp_13's, the same instructions): the puddle sp_44 at the contact. The normal n (the query's +0x20): its angle to
// up (n.y + 0 x n.x + 0 x n.z over |n|, the clamp, acos, x 57.2958) < 10 -> forward = the shell's velocity over its length, else (n.x, 0,
// n.z); the frame 0x232530(forward, n), its Euler words; mode = rank (0x3a8430) > 4 ? 1 : 0; setup (0x42203c): +0x10 the contact, +0x20
// the words, +0x2c the query record, +0x30 0xffff
function puddle009(S, hit, ctx){
  const n = hit.normal, v = S.velocity;
  if (!n) return;
  let len2 = f(n[1] * n[1]); len2 = mla(len2, n[0], n[0]); len2 = mla(len2, n[2], n[2]);
  let d = mla(n[1], n[0], 0.0); d = mla(d, n[2], 0.0);
  const deg = f(acosf(clamp009(f(d / sqrtf(len2)))) * RAD_TO_DEG);
  let fwd;
  if (deg < f(10.0)){
    let l2 = f(v[1] * v[1]); l2 = mla(l2, v[0], v[0]); l2 = mla(l2, v[2], v[2]);
    const inv = f(1.0 / sqrtf(l2));
    fwd = [f(v[0] * inv), f(inv * v[1]), f(inv * v[2])];
  } else fwd = [n[0], 0, n[2]];
  const W = words009(eulerOf(frameFrom(fwd, n)));
  const mode = ctx.own001 && ctx.own001.rank > 4 ? 1 : 0;
  ctx.create(S, 'shell44', { mode, position: hit.point.slice(), angles: W, record: hit, action: S.action, frame: S.spawnFrame });
}
// 0xd5fe50 = 0xd60e5c: sp_52. n's angle to the unit Y 0x19176f0 (rom-map 1451) < 5 -> the shell's vy +0x1014 = 0 (its own) and forward =
// (vx, 0, vz) normalised (the zero vector when both are 0); else (n.x, 0, n.z). flag 1 (a ground contact): the frame (forward, n), the
// point the shell's +0x40; flag 0: the frame (n, the unit Y), the point +0x40 + dt x (-40 sin Y, 0, -40 cos Y) (literals -40.0 / 0.0, its Y
// word +0xfec, its +0x1c). Setup (0x429494): mode 0, +0x10 the point, +0x20 the words, +0x2c the record, +0x30 its +0x1588
function flash009(S, hit, flag, ctx){
  const n = hit.normal;
  if (!n) return;
  let len2 = f(n[1] * n[1]); len2 = mla(len2, n[0], n[0]);
  let d = f(f(1.0) * n[1]); d = mla(d, f(0.0), n[0]);
  len2 = mla(len2, n[2], n[2]); d = mla(d, f(0.0), n[2]);
  const deg = f(acosf(clamp009(f(d / f(sqrtf(len2) * f(1.0))))) * RAD_TO_DEG);
  let fwd;
  if (deg < f(5.0)){
    S.velocity = [S.velocity[0], f(0.0), S.velocity[2]];
    const vx = S.velocity[0], vz = S.velocity[2];
    let l2 = mla(f(0.0), vx, vx); l2 = mla(l2, vz, vz);
    if (l2 === 0) fwd = [0, 0, 0];
    else { const inv = f(1.0 / sqrtf(l2)); fwd = [f(vx * inv), f(inv * f(0.0)), f(inv * vz)]; }
  } else fwd = [n[0], 0, n[2]];
  const P = S.position;
  let pt = P.slice(), e;
  if (flag) e = eulerOf(frameFrom(fwd, n));
  else {
    e = eulerOf(frameFrom(n, [0, 1, 0]));
    const r = f(u16(S.angles[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), K2 = f(-40.0), K4 = f(0.0), dt = ctx.dt;
    const a6 = mls(f(cs * K2), sn, K4), a2 = mla(f(sn * K2), cs, K4);
    pt = [mla(P[0], dt, a2), mla(P[1], dt, K4), mla(P[2], dt, a6)];
  }
  ctx.create(S, 'shell52', { mode: 0, position: pt, angles: words009(e), record: hit, action: S.action, frame: S.spawnFrame });
}
function landing009s00(S, D, hit, ctx){
  const k = S.k, child = () => ctx.create(S, 'shell01', { mode: 0, position: hit.point.slice(), angles: [0, 0, 0], action: S.action, frame: S.spawnFrame });
  if (hit.type === 1){
    if (ctx && ctx.create){ if (k.b1660) puddle009(S, hit, ctx); else if (k.b1661) flash009(S, hit, 1, ctx); else child(); }
    contactStart(S, D, 2, hit.point, 'landing');
  } else if (hit.type === 0){
    if (ctx && ctx.create){ if (k.b1661) flash009(S, hit, 0, ctx); else child(); }
    contactStart(S, D, 1, hit.point, 'landing');
  } else if (hit.type === 2) contactStart(S, D, 3, hit.point, 'landing');
}
READER00.uShellEm009_sp_00 = (def, mode) => params009s00(def, mode);
LANDING.uShellEm009_sp_00 = landing009s00;
// sp_01 (vtable 0x179dbb4, base01; reader 0xd60410 READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15d8; +0x15ec: 4 int 3, 8 int 4, 1 int 0, 0x80
// int 1, 0x1000 int 5; int 2 the joint +0x15e4; &vec 0 -> +0x1608; no timer
function params009s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(3) !== -1 ? 4 : 0) | (I(4) !== -1 ? 8 : 0) | (I(0) !== -1 ? 1 : 0) | (I(1) !== -1 ? 0x80 : 0) | (I(5) !== -1 ? 0x1000 : 0);
  return { flags, joint: I(2), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm009_sp_01: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xd60410] = sh => params009s01(sh);
// sp_13 (vtable 0x179dd24, base13; reader 0xd60680 READ whole): ef i -> +0x15c8 + 4i; hit 0; int 0 the joint +0x15e4; +0x15e0: 0x10 int 2,
// 8 int 3 (the size); floats 0 speed +0x15ec, 1 per unit +0x160c, 2 gravity +0x15f4, 4 far +0x1600, 3 near +0x15fc, 5 life +0x15f8, 6 the
// rise cap +0x167c; &vec 0 both points; &vec 1 -> +0x1624 (the thrown point's offset, base13's 0x4059a8); ints 4 / 5 -> +0x1680 / +0x1684
// (the landing's choice). Init 0xd608a4: base13's 0x4044d8, then vy +0x1014 = min(vy, +0x167c)
function params009s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: (I(2) !== -1 ? 0x10 : 0) | (I(3) !== -1 ? 8 : 0),
           speed0: F(0), speedPer: F(1), gravity: F(2), near: F(3), far: F(4), life: F(5), cap: F(6), y1614: f(0.0), f15f0: f(0.0),
           limitA: f(0.0), limitB: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f), centre: (sh.vecs[1] || ZERO3).map(f), land1: I(4), land0: I(5) };
}
function make009s13(state, D, m, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell13 mode ' + m + ': no files' };
  if (!own.ownerPos || !own.target) return { why: 'no owner position / target (input.ownerPos, input.rock.target)' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params009s13(def, mode);
  if (!init13t(S, own, (S2, o) => thrown13(S2, S2.k, o))) return { why: 'shell13 mode ' + m + ': its init path is not his' };
  if (S.velocity[1] > S.k.cap) S.velocity = [S.velocity[0], S.k.cap, S.velocity[2]];    // 0xd608b8..0xd608dc
  S.launch.velocity = S.velocity.slice();
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// sp_13's landing 0xd608fc (READ whole): type 1 ef 2, by +0x1680: -1 sp_01 0 at the contact, 0 sp_44 (0xd60b54), 1 sp_52 (0xd60e5c, 1);
// type 0 ef 1, by +0x1684 the same with 0xd60e5c(0); type 2 ef 3; then 0x4042bc and the end
LANDING13.uShellEm009_sp_13 = (S, D, ctx, out) => {
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit) return;
  const n0 = S.events.length, k = S.k;
  const pick = hit.type === 1 ? k.land1 : hit.type === 0 ? k.land0 : null;
  if (pick != null && ctx && ctx.create){
    if (pick === -1) ctx.create(S, 'shell01', { mode: 0, position: hit.point.slice(), angles: [0, 0, 0], action: S.action, frame: S.spawnFrame });
    else if (pick === 0) puddle009(S, hit, ctx);
    else if (pick === 1) flash009(S, hit, hit.type === 1 ? 1 : 0, ctx);
  }
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
  for (const e of S.events.slice(n0)) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
};
// ---- BASE44 / BASE52 / BASE53 (READ whole; dev/em009-shells-spec.md 3) ---------------------------------------------------------------
// One shape: ctor 0x42207c / 0x4294d4 / 0x42a0c4 (+0x15a8 = 0x2c / 0x34 / 0x35), init 0x4221f0 / 0x429648 / 0x42a248 -- 0x43a850, the setup's
// record (+0x2c) copied to +0x1060.. (the hit side's), +0x1588 = setup +0x30, the owner present, the handle array, the class's reader
// (vt+0x14c), +0x40 = setup +0x10 + the reader's offset (+0x15dc / +0x15d8 / +0x15e0), the words setup +0x20.., the hit side (0x4a1ad8 /
// vt+0x140), ef 0 (+0x15c8) at +0x40 into the handle array, state 1. The update (vt+0x24 0x422518 / 0x429a88 / 0x42a5c0): the handles whose
// unit left states 1 / 2 dropped; state 1 the move; 0xfe the wait (+0x15e0 / +0x15dc / +0x15e4 down by dt, 0 at the floor; at 0 deleted,
// while > 0 deleted once every handle is gone). The end (vt+0x148 0x422834 / 0x429ce8 / 0x42a888): not ending already -> ef 0 stopped
// (0x43b058(h, r1)), the hit side, state 0xfe, the wait = [0x162493c] x 60
// base44 +0x44 += 20 after the offset (anchor at that height); +0x15f0 = +0x15d0, +0x15ec = 0, the life +0x15e0 = +0x15d8. Move 0x422640:
// the life down by dt (<= 0: the end); hit slot 0's delay +0x1404 <= 0 -> r = (+0x15d4 - its duration +0x1408) / +0x15d4, r > 0 -> +0x15ec =
// r x +0x15f0, and +0x40 = anchor + (0, 0, +0x15ec) turned X, Y, Z by the words (the literal 0.0 terms kept); slot 0 off (+0x13ad) -> the end
function params009s44(def, mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { slide: F(0), slideTime: F(1), life: F(2), vec: (sh.vecs[0] || ZERO3).map(f) };       // reader 0xd613a4
}
function params009s52(def, mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { life: F(0), delay: F(1), vec: (sh.vecs[0] || ZERO3).map(f) };                       // reader 0xd61560
}
function params009s53(def, mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { life: F(0), vy: F(1), max: F(2), per: F(3), vec: (sh.vecs[0] || ZERO3).map(f) };      // reader 0xd617ec
}
const PARAMS4452 = { uShellEm009_sp_44: params009s44, uShellEm009_sp_52: params009s52, uShellEm009_sp_53: params009s53 };
function make4452(state, D, name, setup, own, ctx, creator){
  const def = D.shells[name], mode = def && def.modes[setup.mode], lists = def ? (def.lists || D.lists) : null;
  if (!mode){ if (ctx.out) ctx.out.refused.push({ shell: name, mode: setup.mode, why: name + ' mode ' + setup.mode + ': no files' }); return null; }
  const S = { id: state.nextId++, monId: state.monId, shell: name, cls: def.cls, globalId: def.id, base: def.base, mode, modeIndex: setup.mode,
              action: setup.action, spawnFrame: setup.frame, motion: ctx.motion, state: 1, creator: creator ? creator.id : null,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, lifetime: 0, ending: 0,
              timer: 0, moves: 0, launch: null, events: [], folder: def.folder, effect: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  const k = S.k = PARAMS4452[def.cls](def, mode);
  const P = setup.position, o = k.vec;
  let pos = [f(P[0] + o[0]), f(P[1] + o[1]), f(P[2] + o[2])];
  if (def.base !== 'base53') pos = [pos[0], f(pos[1] + f(20.0)), pos[2]];
  S.position = pos; S.anchor = pos.slice(); S.angles = setup.angles.map(w => w >>> 0);
  S.velocity = [0, 0, 0]; S.gravity = [0, 0, 0];
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  if (def.base === 'base44'){ S.lifetime = k.life; S.slide = f(0.0); }
  else if (def.base === 'base52'){ S.lifetime = k.life; S.delay = k.delay; S.fired = false; }
  else { S.lifetime = k.life; S.velocity = [0, k.vy, 0]; S.clock = f(0.0); S.rate = f(k.max / k.per); }
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  S.launch = { point: S.position.slice(), angles: S.angles.slice(), life: S.lifetime, record: setup.record ? setup.record.point : null };
  return S;
}
function end4452(S, ctx){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
  S.state = 0xfe; S.ending = ENDING_FRAMES;
  if (ctx && ctx.out) ctx.out.ended.push(S);
}
function life4452(S, ctx){
  const T = S.lifetime;
  if (!(T > 0)){ S.lifetime = f(0.0); return false; }
  const t = f(T - ctx.dt);
  S.lifetime = f(0.0) >= t ? f(0.0) : t;
  return t > 0;
}
function move44(S, ctx){
  if (!life4452(S, ctx)) return 'end';
  const sl = S.slots && S.slots[0];
  if (!sl) throw new Error('shells.js: base44 without a hit slot (input.hitLife): its slide and its end read slot 0');
  if (!(sl.delay > 0)){
    const k = S.k, r = f(f(k.slideTime - sl.duration) / k.slideTime);
    if (r > 0) S.slide = f(r * k.slide);
    const L = S.slide, A = S.angles, K = f(0.0);
    const ax = f(u16(A[0]) * U16_TO_RAD), sX = sinf(ax), cX = cosf(ax);
    const ay = f(u16(A[1]) * U16_TO_RAD), sY = sinf(ay), cY = cosf(ay);
    const az = f(u16(A[2]) * U16_TO_RAD), sZ = sinf(az), cZ = cosf(az);
    const s30 = mla(f(L * cX), sX, K);
    const s17 = mla(f(cY * K), s30, sY), s19 = mls(f(cX * K), L, sX);
    const x = mls(f(s17 * cZ), s19, sZ), y = mla(f(s19 * cZ), s17, sZ), z = mls(f(s30 * cY), sY, K);
    S.position = [f(S.anchor[0] + x), f(S.anchor[1] + y), f(S.anchor[2] + z)];
  }
  return sl.on ? 'keep' : 'end';
}
// base52's move 0x429b88: the life; byte +0x15e4 clear -> the delay +0x15e0 down by dt, at 0 the byte set and vt+0x154 (sp_52's 0xd615e4:
// mode 0 -> sp_53 (setup 0x42a084(0x50)): +0x10 its +0x40, +0x20 its words, +0x30 its +0x1588, +0x40 a GOT zero vector); a ground
// marker (0x43b2b0, not visual) while it waits
function move52(S, ctx, D){
  if (!life4452(S, ctx)) return 'end';
  if (S.fired) return 'keep';
  const T = S.delay;
  let fire = !(T > 0);
  if (fire) S.delay = f(0.0);
  else { const t = f(T - ctx.dt); S.delay = f(0.0) >= t ? f(0.0) : t; fire = !(t > 0); }
  if (fire){
    S.fired = true;
    if (S.modeIndex === 0 && ctx.create) ctx.create(S, 'shell53', { mode: 0, position: S.position.slice(), angles: S.angles.map(w => w >>> 0),
                                                                    action: S.action, frame: S.spawnFrame });
  }
  return 'keep';
}
// base53's move 0x42a6e4: the life; hit slot 0's delay +0x1404 <= 0 -> +0x40 += dt x the velocity (0x5391d4: vy +0x1014 = float 1), the
// anchor (x, y - min(clock +0x1378 x +0x15ec, +0x15e8), z); the clock += dt x dt (0x539d48) either way; slot 0 off -> the end
function move53(S, ctx){
  if (!life4452(S, ctx)) return 'end';
  const sl = S.slots && S.slots[0];
  if (!sl) throw new Error('shells.js: base53 without a hit slot (input.hitLife): its fall and its end read slot 0');
  const dt = ctx.dt;
  if (!(sl.delay > 0)){
    const P = S.position, v = S.velocity;
    S.position = [mla(P[0], dt, v[0]), mla(P[1], dt, v[1]), mla(P[2], dt, v[2])];
    let d = f(S.clock * S.rate);
    d = d >= S.k.max ? S.k.max : d;
    S.anchor = [S.position[0], f(S.position[1] - d), S.position[2]];
  }
  S.clock = mla(S.clock, dt, dt);
  return sl.on ? 'keep' : 'end';
}
function step4452(S, ctx, input, D, out){
  S.events = [];
  S.place = null;
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.state === 1){
    S.moves++;
    S.prevPosition = S.position.slice();
    const r = S.base === 'base44' ? move44(S, ctx) : S.base === 'base52' ? move52(S, ctx, D) : move53(S, ctx);
    if (r === 'end') end4452(S, ctx);
  } else if (S.state === 0xfe){
    const T = S.ending;
    if (!(T > 0)){ S.ending = f(0.0); S.state = 0xff; return; }
    const t = f(T - ctx.dt);
    S.ending = f(0.0) >= t ? f(0.0) : t;
    if (!(t > 0) || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}
// THE FRAME HANDLER 0xd5d508 (vt+0x208; READ whole): by the motion id, at a channel-1 crossing (0xb09b0), shell01 0x77 (0x3fa2bc(0x40):
// +0x10 the block's +0x40, +0x30 the block's words +0x50.., +0x3c 0xffff), no height test: L1 M4 f2 4, L1 M5 f46 3, L1 M14 f52 4, L1 M17 f2
// 3, L1 M19 / M102 f2 3, L1 M103 f2 3, L1 M105 f2 3, L1 M106 f2 3; L1 M1 / M2 (0xd5db30 / 0xd5dc04): the clock [e+0xcac0]+0 += dt every
// update, >= 100.0 -> 0 and mode 2. The clock is his (vt+0x1dc 0xd536f4 does not touch it); (7, 0x02)'s phase 2 (0xd5a53c) shares it:
// from L2 M21's frame 10 (0xb0968 mode 1) += dt, >= 16.0 -> 0 and mode 1 at (block x, his ground +0x5b4, block z), the words a GOT zero.
// The viewer's clock starts at 0 with the state (the ROM's at his spawn: the ctor's) and counts the updates the clip advances.
const PERFRAME009 = [
  { ids: [0x104], frame: 2, mode: 4 }, { ids: [0x105], frame: 46, mode: 3 }, { ids: [0x10e], frame: 52, mode: 4 },
  { ids: [0x111], frame: 2, mode: 3 }, { ids: [0x113, 0x166], frame: 2, mode: 3 }, { ids: [0x167], frame: 2, mode: 3 },
  { ids: [0x169], frame: 2, mode: 3 }, { ids: [0x16a], frame: 2, mode: 3 },
];
function perFrame009(state, D, ctx, input, out, fresh){
  const mid = motionIdOf(input.list, String(input.clip || '').replace(/_loop$/, '').replace(/_start$/, ''));
  if (mid == null || !state.hist) return;
  const [p0, p1] = state.hist, own = ctx.own001;
  const make = (mode, pos, words, F) => {
    const why = missing001(own, { facing: true, pos: true, ground: true });
    if (why){ out.refused.push({ perFrame: mid, shell: 'shell01', mode, why }); return; }
    const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode, position: pos, angles: words, frame: F }, own, state.prevJoints || ctx.J, ctx, null);
    if (S){ S.perFrame = mid; state.shells.push(S); out.spawned.push(S); }
  };
  if (!('c009' in state)) state.c009 = f(0.0);
  if ((mid === 0x101 || mid === 0x102) && p1 !== p0){
    state.c009 = f(state.c009 + ctx.dt);                                // 0x7264c(e, ctl+0, 1.0)
    if (state.c009 >= f(100.0)){ state.c009 = f(0.0); if (own.ownerPos) make(2, own.ownerPos.slice(), ownerWords001(own), p1); }
    return;
  }
  if (mid === 0x215 && p1 !== p0 && (p1 < p0 || p1 >= f(10.0)) && D.counter009){
    state.c009 = f(state.c009 + ctx.dt);                                // 0xd5a550
    if (state.c009 >= f(16.0)){ state.c009 = f(0.0); if (own.ownerPos && own.ground != null) make(1, [own.ownerPos[0], own.ground, own.ownerPos[2]], [0, 0, 0], p1); }
    return;
  }
  if (fresh) return;
  const row = D.perFrame009.find(r => r.ids.includes(mid));
  if (!row || !pass001(state, f(row.frame)) || !own.ownerPos) return;
  make(row.mode, own.ownerPos.slice(), ownerWords001(own), row.frame);
}
function spawn009(state, D, a, ctx, input, out){
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.shell === 'shell13'){
      const r = make009s13(state, D, sp.mode, own, ctx, a.action, sp.frame);
      if (r.why){ out.refused.push({ action: a.action, shell: 'shell13', mode: sp.mode, why: r.why }); continue; }
      state.shells.push(r.S); out.spawned.push(r.S);
      continue;
    }
    if (!own.facing){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why: 'no owner facing (input.owner.y)' }); continue; }
    const S = spawnRock(state, D, { ...a, shell: 'shell00', mode: sp.mode, frame: sp.frame }, J, ctx,
                        { requestPos: [0, 0, 0], requestAngles: [0, 0, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(),
                          target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
    if (S){ out.spawned.push(S); state.shells.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'em009 shell00: the init refused' });
  }
}
{
  const L = (u, c) => ({ 0: { list: u ? 'u' : 'c', pel: u ? 'em009_00u' : 'em009_00c' } });
  const D = {
    name: 'Gypceros',
    lists: { 0: { list: 'u', pel: 'em009_00u' } },
    actions: [],
    shells: {
      shell00: { id: 0x76, cls: 'uShellEm009_sp_00', base: 'base00', reader: 0xd5f698, folder: 'shell@@BS@@em@@BS@@em009_00_shell00',
        lists: { 0: { list: 'u', pel: 'em009_00u' } }, cmn: { ints: [], floats: [], vecs: [] }, modes: {
@@MODES00@@
        }, hitdata: @@HD00@@ },
      shell01: { id: 0x77, cls: 'uShellEm009_sp_01', base: 'base01', reader: 0xd60410, folder: 'shell@@BS@@em@@BS@@em009_00_shell01',
        lists: { 0: { list: 'c', pel: 'em009_00c' }, 1: { list: 'u', pel: 'em009_00u' } }, modes: {
@@MODES01@@
        }, hitdata: @@HD01@@ },
      shell13: { id: 0x78, cls: 'uShellEm009_sp_13', base: 'base13', reader: 0xd60680, folder: 'shell@@BS@@em@@BS@@em009_00_shell13',
        lists: { 0: { list: 'u', pel: 'em009_00u' } }, modes: {
@@MODES13@@
        }, hitdata: @@HD13@@ },
      shell44: { id: 0x79, cls: 'uShellEm009_sp_44', base: 'base44', reader: 0xd613a4, folder: 'shell@@BS@@em@@BS@@em009_00_shell44',
        lists: { 0: { list: 'u', pel: 'em009_00u' } }, modes: {
@@MODES44@@
        }, hitdata: @@HD44@@ },
      shell52: { id: 0x7a, cls: 'uShellEm009_sp_52', base: 'base52', reader: 0xd61560, folder: 'shell@@BS@@em@@BS@@em009_00_shell52',
        lists: { 0: { list: 'u', pel: 'em009_00u' } }, modes: {
@@MODES52@@
        }, hitdata: @@HD52@@ },
      shell53: { id: 0x7b, cls: 'uShellEm009_sp_53', base: 'base53', reader: 0xd617ec, folder: 'shell@@BS@@em@@BS@@em009_00_shell53',
        lists: { 0: { list: 'u', pel: 'em009_00u' } }, modes: {
@@MODES53@@
        }, hitdata: @@HD53@@ },
    },
  };
  const A = (st, n, list, clip, spawns, more) => Object.assign({ action: [st, n], code: 'em009', list, clip, partners: [], pick: 'ai',
    variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, more || {});
  const at = (sh, F, m) => ({ frame: F, shell: sh, mode: m, modes: [m] });
  const M4 = { partners: ['Motion[4]_start'] };
  D.actions.push(A(2, 0x0b, '4', 'Motion[4]', [at('shell00', 48, 10), at('shell00', 74, 11)], M4));
  for (const n of [0x1b, 0x25, 0x33, 0x3a]) D.actions.push(A(7, n, '4', 'Motion[4]', [at('shell00', 48, 10), at('shell00', 74, 11)], M4));
  D.actions.push(A(7, 0x19, '4', 'Motion[6]', [at('shell00', 32, 3)]));
  D.actions.push(A(7, 0x1a, '4', 'Motion[6]', [at('shell00', 32, 0)]));
  D.actions.push(A(7, 0x17, '4', 'Motion[6]', [at('shell13', 32, 1)]));
  for (const [n, m] of [[0x46, 12], [0x4a, 12], [0x47, 13], [0x4b, 13], [0x48, 14], [0x4c, 14]]) D.actions.push(A(7, n, '4', 'Motion[6]', [at('shell00', 31, m)]));
  D.perFrame009 = PERFRAME009;
  D.counter009 = true;
  SHELL_DATA.em009_00 = D;
}
'''
import json, ast, subprocess, sys
L = open(SP + r'\shl_em009_00.txt', encoding='utf8').read().split('\n')
def modes_of(tag):
    i = [k for k, l in enumerate(L) if l.startswith('== ') and tag in l][0]
    out = []
    for l in L[i+1:]:
        l2 = l.strip()
        if l2.startswith('=='): break
        if not l2.startswith('mode '): continue
        n = int(l2.split()[1]); d = json.loads(l2[l2.index('{'):])
        ef = [[a, (-1 if b == 4294967295 else b)] for a, b in d['ef'][0]['arr']]
        out.append("          %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (n, d['scale'][0], json.dumps(ef).replace(' ', ''), json.dumps(d['hit']['ints']), json.dumps(d['sh']['ints']), json.dumps(d['sh']['floats']), json.dumps(d['sh']['vecs'])))
    return '\n'.join(out)
hd = subprocess.check_output([sys.executable, SP + r'\hit.py', 'em009_00'], text=True)
HD = {}
for line in hd.strip().split('\n'):
    parts = line.split(' ', 3)
    HD[parts[1]] = json.dumps([list(t) for t in ast.literal_eval(parts[3])])
for tag in ('00', '01', '13', '44', '52', '53'):
    blk = blk.replace('@@MODES%s@@' % tag, modes_of('shell' + tag)).replace('@@HD%s@@' % tag, HD['em009_00_%s_hitdata' % tag])
blk = blk.replace('@@BS@@', BS + BS).replace('\n', NL)
A = '// ---- YIAN KUT-KU (em008_00'
assert s.count(A) == 1
s = s.replace(A, blk + A)
rep("  } else if (a && !fresh && state.prevJoints && a.code === 'em008'){",
    "  } else if (a && !fresh && state.prevJoints && a.code === 'em009'){\n    spawn009(state, D, a, ctx, input, out);                  // Gypceros's shots and lob\n  } else if (a && !fresh && state.prevJoints && a.code === 'em008'){")
rep("  if (D.counter008) counter008(state, D, ctx, input, out, fresh);     // ...and (7, 0x02)'s hover dust (0xd4bb94)",
    "  if (D.counter008) counter008(state, D, ctx, input, out, fresh);     // ...and (7, 0x02)'s hover dust (0xd4bb94)\n  if (D.perFrame009) perFrame009(state, D, ctx, input, out, fresh);   // Gypceros's frame handler (0xd5d508) and (7, 0x02)'s clock")
rep("    else if (S.base === 'base13') stepOrb(S, ctx, input, D, out);\n    else if (S.base === 'base22') step22(S, ctx, input, D, out);   // Rajang's rock\n    else if (S.base === 'base24') step24(S, ctx, input, D, out);   // Rustrum's lump\n    else if (S.base === 'base23')",
    "    else if (S.base === 'base13') stepOrb(S, ctx, input, D, out);\n    else if (S.base === 'base44' || S.base === 'base52' || S.base === 'base53') step4452(S, ctx, input, D, out);   // Gypceros's puddle, flash orb, flash\n    else if (S.base === 'base22') step22(S, ctx, input, D, out);   // Rajang's rock\n    else if (S.base === 'base24') step24(S, ctx, input, D, out);   // Rustrum's lump\n    else if (S.base === 'base23')")
rep("      const sc = (k.flags & 0x80) ? (got.size == null ? 1 : f(got.size)) : 1;   // 0xbe518, only with bit 0x80",
    "      const sc = (k.flags & 0x80) ? (got.size == null ? 1 : Array.isArray(got.size) ? size001(got) : f(got.size)) : 1;   // 0xbe518, only with bit 0x80 (an owner pair: its product)")
rep("      const S2 = make001(state, D, name, full, own, side ? armJoints(input, side) : J, ctx, creator);",
    "      const S2 = (def.base === 'base44' || def.base === 'base52' || def.base === 'base53') ? make4452(state, D, name, full, own, ctx, creator)   // Gypceros's bases\n               : make001(state, D, name, full, own, side ? armJoints(input, side) : J, ctx, creator);")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
