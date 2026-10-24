# ins008.py (2026-10-20): Yian Kut-Ku (em008_00) into docs/render/shells.js -- sp_00 0x73 (base00), sp_01 0x74 (base01), sp_13 0x75 (base13),
# his frame handler's sp_01 (vt+0x208 0xd4ffa4) and (7, 0x02)'s hover counter
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

blk = r'''// ---- YIAN KUT-KU (em008_00, uEm008_00): sp_00 0x73 (base00), sp_01 0x74 (base01), sp_13 0x75 (base13) -- dev/em008-shells-spec.md
// (shells agent, 2026-10-20; dev/shells-kutku-check.mjs). The ids are immediates (`mov #0x73` / `#0x74` / `#0x75` in his band). The census
// of his reach (neset/triage_all2.txt; trgen k08cap.py: the clip playing at the maker's phase):
//   (7, 0x12 / 0x22) L2 M2 (phase 0 L2 M37 / L2 M2, phase 1's end L2 M2 from 16) phase 2 f26 / f48 / f86: sp_00 0 / 1 / 0
//   (7, 0x19 / 0x49) L2 M3 f32 sp_00 2 / 19; (7, 0x23 / 0x4c) L2 M3 f32 sp_13 0 / 1
//   (7, 0x2d / 0x36 / 0x37 / 0x38) L2 M1 f78 / 150 / 240 / 296: sp_00 3..6 / 7..10 / 11..14 / 15..18
// sp_00 (vtable 0x179c130): init 0xd52200 = base00's 0x3f8b80, then +0x1660 > 0: the velocity +0x1010.. x= +0x1660 and the gravity
//   +0x1020.. x= +0x1660^2 (POST00). Reader 0xd522b8 (READ whole): ef 0..3; hit 0; int 0 the joint +0x15dc; int 1 -> 0x100; float 1 X deg
//   +0x15ec, float 2 Y deg +0x15f0, float 0 vz +0x15f4; cmn float 0 the flight +0x15fc; &vec 0 the offset +0x1610; cmn vec 0 the gravity
//   +0x161c; float 3 -> +0x1660. Landing 0xd52430 (READ whole): type 1 ef 2 and (owner active) sp_01 0x74 mode (mode <= 2 ? 0 : 1) at the
//   contact (words a GOT zero, +0x3c 0xffff); type 0 ef 1; type 2 ef 3; then 0x3f8970 and the end
// sp_01 (vtable 0x179c2ac, base01): reader 0xd52774 (READ whole): ef 0 / 1 -> +0x15c8 / +0x15cc; hit 0 / 1; +0x15ec: 4 int 0, 8 int 1,
//   0x80 int 2, 0x800 int 3, 0x1000 int 4; &vec 0 -> +0x1608. No joint, no timer (the ctor's)
// sp_13 (vtable 0x179c41c, base13): init 0xd529e8 = base13's 0x4044d8, then +0x167c > 0: the same scaling. Reader 0xd52aa0 (READ whole):
//   ef 0..3; hit 0; int 0 the joint +0x15e4; +0x15e0: 2 int 1, 0x10 int 2, then |= 0x60; floats 0 speed +0x15ec, 2 gravity +0x15f4, 1 per
//   unit +0x160c, 4 far +0x1600, 3 near +0x15fc, 5 life +0x15f8, 6 -> +0x167c; &vec 0 -> both points. Landing 0xd52c70 (READ whole), state
//   2 only: type 1 ef 2 and (owner active) sp_01 0 at the contact; type 0 ef 1; type 2 ef 3; then 0x4042bc and the end
function params008s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0.0);
  const c = def.cmn || { floats: [], vecs: [] };
  return { joint: I(0), flags: I(1) !== -1 ? 0x100 : 0, degX: F(1), degY: F(2), xDeg: F(1), yDeg: F(2), vz: F(0), vy: f(0.0),
           flight: f(c.floats.length ? c.floats[0] : 0.0), xLo: f(0.0), xHi: f(0.0), yLo: f(0.0), yHi: f(0.0),
           vec: (sh.vecs[0] || ZERO3).map(f), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: (c.vecs[0] || ZERO3).map(f), s1660: F(3) };
}
// 0xd52228..0xd522b0: s = +0x1660; s > 0 -> +0x1010.. x s, then +0x1020.. x s*s (the init's own order)
function scale008(S, s){
  if (!(s > 0)) return;
  S.velocity = S.velocity.map(v => f(s * v));
  const s2 = f(s * s);
  S.gravity = S.gravity.map(g => f(g * s2));
}
function landing008s00(S, D, hit, ctx){
  if (hit.type === 1){
    if (ctx && ctx.create)
      ctx.create(S, 'shell01', { mode: S.modeIndex <= 2 ? 0 : 1, position: hit.point.slice(), angles: [0, 0, 0], action: S.action, frame: S.spawnFrame });
    contactStart(S, D, 2, hit.point, 'landing');
  } else if (hit.type === 0) contactStart(S, D, 1, hit.point, 'landing');
  else if (hit.type === 2) contactStart(S, D, 3, hit.point, 'landing');
}
READER00.uShellEm008_sp_00 = (def, mode) => params008s00(def, mode);
POST00.uShellEm008_sp_00 = (S, k) => scale008(S, k.s1660);
LANDING.uShellEm008_sp_00 = landing008s00;
function params008s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 0x80 : 0) | (I(3) !== -1 ? 0x800 : 0) | (I(4) !== -1 ? 0x1000 : 0);
  return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm008_sp_01: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: 1, 0x15d0: null } };
}
READERS01[0xd52774] = sh => params008s01(sh);
function params008s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: 0x60 | (I(1) !== -1 ? 2 : 0) | (I(2) !== -1 ? 0x10 : 0),
           speed0: F(0), speedPer: F(1), gravity: F(2), near: F(3), far: F(4), life: F(5), s167c: F(6), y1614: f(0.0), f15f0: f(0.0),
           limitA: f(0.0), limitB: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f) };
}
// 0x405500 on +0x15e0 0x70 (0x40: from the owner's block +0x40, 0x4055b0; 4 clear): the distance to the target (base13's 0x405a60, the
// block's +0x1d0 slot) clamped [near, far], along the aim 0x4053e4 -- 0x10: the owner's facing as it is -- from the block's point, the
// setup's +0x20 (zero) added, the height the target's plus +0x1614 (0)
function thrown008s13(S, own){
  const k = S.k, P = own.ownerPos, T = target13Slot(own);
  const dx = f(T[0] - P[0]), dz = f(T[2] - P[2]);
  let d = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  d = k.near > d ? k.near : d;
  d = d > k.far ? k.far : d;
  let a;
  if (k.flags & 0x10) a = own.ownerY >>> 0;
  else {
    a = wordOf(dx, dz);
    const dd = u16(a - own.ownerY), limB = wordOfDeg(k.limitB), limA = wordOfDeg(k.limitA);
    if (dd > limB && limB !== 0) a = (own.ownerY + limB) >>> 0;
    else if (!(dd >= limA)) a = (own.ownerY + limA) >>> 0;
  }
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  const ox = f(0.0 + S.centre[0]), oz = f(d + S.centre[2]);
  return [f(P[0] + mla(f(ox * cs), oz, sn)), f(T[1] + S.y1614), f(P[2] + mls(f(oz * cs), ox, sn))];
}
// base13's init 0x4044d8 on +0x15e0 0x70 with a joint (init13k's path: the joint's row 3 and the points' midpoint through its 3x3, no size),
// the thrown point thrown008s13, the launch 0x404dc8 to it, the pitch ratio's second pair; then sp_13's 0xd52a04: +0x167c's scaling
function init008s13(S, J, own){
  const k = S.k;
  S.centre = ZERO3.slice();
  S.y1614 = k.y1614;
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  if (!own.ownerPos || !own.target) return false;
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const turn = q => [mla(mla(f(M[4] * q[1]), M[0], q[0]), M[8], q[2]), mla(mla(f(M[5] * q[1]), M[1], q[0]), M[9], q[2]),
                     mla(mla(f(M[6] * q[1]), M[2], q[0]), M[10], q[2])];
  const pair = r => turn([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)));
  const m1 = pair(f(0.5));
  let pos = [f(m1[0] + f(M[12])), f(m1[1] + f(M[13])), f(m1[2] + f(M[14]))];
  S.position = pos;
  const T = thrown008s13(S, own), P = S.position;
  const ex = f(P[0] - T[0]), ez = f(P[2] - T[2]);
  let dy = f(T[1] - P[1]);
  dy = dy > 0 ? (k.f15f0 > 0 ? f(0.0) : dy) : dy;
  const dist = sqrtf(mla(mla(0.0, ex, ex), ez, ez));
  const speed = mla(k.speed0, k.speedPer, dist);
  const t = f(dist / speed);
  const vy = f(mla(dy, f(f(t * t) * k.gravity), f(-0.5)) / t);
  const a = wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  S.velocity = [f(speed * sn), vy, f(speed * cs)];
  S.gravity = [f(0.0), k.gravity, f(0.0)];
  const h = sqrtf(mla(f(speed * speed), f(0.0), f(0.0)));
  const w = u16(0x10000 - u16(s32(mla(0.5, atan2f(f(-vy), h), RAD_TO_U16))));
  const ratio = w > 0x8000 ? f(1.0) : w > 0x2000 ? f(0.0) : mla(f(1.0), f(w), f(-0.0001220703125));
  const m2 = pair(ratio);
  pos = [0, 1, 2].map(i => f(m2[i] + f(pos[i] - m1[i])));
  S.position = pos;
  S.anchor = pos.slice();
  S.aim = a;
  scale008(S, k.s167c);                                          // 0xd52a04..0xd52a98
  S.launch = { point: pos.slice(), thrown: T.slice(), aim: a, dist, speed, t, ratio,
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), life: S.lifetime, angles: [0, 0, 0] };
  S.timer = f(0.0);
  return true;
}
function make008s13(state, D, m, J, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: 'base13',
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params008s13(def, mode);
  if (!init008s13(S, J, own)) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}
LANDING13.uShellEm008_sp_13 = (S, D, ctx, out) => {
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return 'keep';
  const n = S.events.length;
  if (hit.type === 1 && ctx && ctx.create)
    ctx.create(S, 'shell01', { mode: 0, position: hit.point.slice(), angles: [0, 0, 0], action: S.action, frame: S.spawnFrame });
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
  for (const e of S.events.slice(n)) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
};
function spawn008(state, D, a, ctx, input, out){
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.shell === 'shell13'){
      const S = make008s13(state, D, sp.mode, J, own, ctx, a.action, sp.frame);
      if (S){ state.shells.push(S); out.spawned.push(S); }
      else out.refused.push({ action: a.action, shell: 'shell13', mode: sp.mode, why: 'em008 shell13: no owner position / target / joint, or the mode' });
      continue;
    }
    if (!own.facing){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why: 'no owner facing (input.owner.y)' }); continue; }
    const S = spawnRock(state, D, { ...a, shell: 'shell00', mode: sp.mode, frame: sp.frame }, J, ctx,
                        { requestPos: [0, 0, 0], requestAngles: [0, 0, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(),
                          target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
    if (S){ out.spawned.push(S); state.shells.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'em008 shell00: the init refused' });
  }
}
// THE FRAME HANDLER 0xd4ffa4 (vt+0x208, the +0x28 pass after the move; READ whole): by the motion id (0xb0944), at a channel-0
// crossing (0xb0974), when the block's +0x44 is not above its ground +0x5b4 by more than 900.0: shell01 0x74 (0x3fa2bc(0x40): +0x10..
// the block's +0x40.., +0x30.. his words e+0xfe8.., +0x20 a GOT vector, +0x3c 0xffff), the mode by the row. The camera / hit-id work of
// the same handler (0xc241c, 0x7db70, 0x7ded8) is not visual.
//   NOT BUILT, by name: L1 M1's site 0xd5028c (mode 3 when [e+0xcac0]+0x10 >= 100.0, then 0) -- that clock is vt+0x1dc's (0xd471c4:
//   += dt every update, >= 100.0 -> 0 and the pulse byte +0x14), and vt+0x1dc runs in the +0x24 pass (0xaddc8) before this handler's
//   +0x28 pass (0xae774): it is below 100.0 whenever the handler reads it. Control: trgen with the clock poked to 100.0 makes the shell,
//   99.0 does not.
const PERFRAME008 = [
  { ids: [0x18, 0x1b, 0x1e], frame: 2, mode: 3, site: 0xd50030 },          // L0 M24 / M27 / M30
  { ids: [0x104], frame: 2, mode: 5, site: 0xd507d8 },                     // L1 M4
  { ids: [0x10e], frame: 52, mode: 5, site: 0xd508ac },                    // L1 M14
  { ids: [0x111], frame: 2, mode: 4, site: 0xd50990 },                     // L1 M17
  { ids: [0x113, 0x166], frame: 2, mode: 4, site: 0xd504f8 },              // L1 M19 / M102
  { ids: [0x169], frame: 2, mode: 4, site: 0xd50b4c },                     // L1 M105
  { ids: [0x16a], frame: 2, mode: 4, site: 0xd503a8 },                     // L1 M106
];
function perFrame008(state, D, ctx, input, out, fresh){
  if (fresh || !state.hist) return;
  const mid = motionIdOf(input.list, String(input.clip || '').replace(/_loop$/, '').replace(/_start$/, ''));
  const row = mid == null ? null : D.perFrame008.find(r => r.ids.includes(mid));
  if (!row || !pass001(state, f(row.frame))) return;
  const own = ctx.own001, why = missing001(own, { facing: true, pos: true, ground: true });
  if (why){ out.refused.push({ perFrame: mid, shell: 'shell01', mode: row.mode, why }); return; }
  if (own.ownerPos[1] > f(own.ground + f(900.0))) return;              // `bhi` past the ground + 900.0
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: row.mode, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                           frame: row.frame }, own, state.prevJoints || ctx.J, ctx, null);
  if (S){ S.perFrame = mid; state.shells.push(S); out.spawned.push(S); }
}
// (7, 0x02)'s phase 2 (0xd4bb08, READ; reached also by (7, 0x3e..0x41), outside his table): L2 M21 (phase 1's end) at frame >= 10
// (0xb0968 mode 1): [e+0xcac0]+0x10 += dt; >= 16.0 -> 0 and shell01 0x74 mode 6 at (block x, his ground +0x5b4, block z), his words.
// The same clock gains dt in vt+0x1dc every update first (0xd471c4, before the action in the +0x24 pass), so it rises 2 an update here.
// THE CLOCK'S VALUE WHEN THE WINDOW OPENS IS A STAND-IN: the ROM's runs free from his spawn (mod 100); this one starts at 0 with the
// clip. Counted on the updates the clip advances (the viewer's paused frame is not an update).
function counter008(state, D, ctx, input, out, fresh){
  const mid = motionIdOf(input.list, String(input.clip || '').replace(/_loop$/, '').replace(/_start$/, ''));
  if (mid !== 0x215){ state.c008 = null; return; }
  if (fresh || !state.c008) state.c008 = { c: f(0.0) };
  if (!state.hist) return;
  const [p0, p1] = state.hist;
  if (p1 === p0) return;
  const C = state.c008;
  C.c = f(C.c + ctx.dt);                                                // vt+0x1dc
  if (!(C.c < f(100.0))) C.c = f(0.0);
  if (!(p1 < p0) && !(p1 >= f(10.0))) return;                           // mode 1: the frame has reached 10 (or wrapped past it)
  C.c = f(C.c + ctx.dt);                                                // 0xd4bb94
  if (C.c < f(16.0)) return;
  C.c = f(0.0);
  const own = ctx.own001, why = missing001(own, { facing: true, pos: true, ground: true });
  if (why){ out.refused.push({ perFrame: mid, shell: 'shell01', mode: 6, why }); return; }
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: 6, position: [own.ownerPos[0], own.ground, own.ownerPos[2]],
                                           angles: ownerWords001(own), frame: p1 }, own, state.prevJoints || ctx.J, ctx, null);
  if (S){ S.counter = 0x215; state.shells.push(S); out.spawned.push(S); }
}
{
  const D = {
    name: 'Yian Kut-Ku',
    lists: { 0: { list: 'u', pel: 'em008_00u' }, 1: { list: 'c', pel: 'em008_00c' } },
    actions: [],
    shells: {
      shell00: { id: 0x73, cls: 'uShellEm008_sp_00', base: 'base00', reader: 0xd522b8, folder: 'shell@@BS@@em@@BS@@em008_00_shell00',
        lists: { 0: { list: 'u', pel: 'em008_00u' } }, cmn: @@CMN00@@, modes: {
@@MODES00@@
        }, hitdata: @@HD00@@ },
      shell01: { id: 0x74, cls: 'uShellEm008_sp_01', base: 'base01', reader: 0xd52774, folder: 'shell@@BS@@em@@BS@@em008_00_shell01',
        lists: { 0: { list: 'u', pel: 'em008_00u' }, 1: { list: 'c', pel: 'em008_00c' } }, modes: {
@@MODES01@@
        }, hitdata: @@HD01@@ },
      shell13: { id: 0x75, cls: 'uShellEm008_sp_13', base: 'base13', reader: 0xd52aa0, folder: 'shell@@BS@@em@@BS@@em008_00_shell13',
        lists: { 0: { list: 'u', pel: 'em008_00u' } }, modes: {
@@MODES13@@
        }, hitdata: @@HD13@@ },
    },
  };
  const A = (n, clip, spawns, more) => Object.assign({ action: [7, n], code: 'em008', list: '2', clip, partners: [], pick: 'ai',
    variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns }, more || {});
  const at = (sh, F, m) => ({ frame: F, shell: sh, mode: m, modes: [m] });
  for (const n of [0x12, 0x22])
    D.actions.push(A(n, 'Motion[2]', [at('shell00', 26, 0), at('shell00', 48, 1), at('shell00', 86, 0)], { partners: ['Motion[2]_start'] }));
  D.actions.push(A(0x19, 'Motion[3]', [at('shell00', 32, 2)]));
  D.actions.push(A(0x49, 'Motion[3]', [at('shell00', 32, 19)]));
  D.actions.push(A(0x23, 'Motion[3]', [at('shell13', 32, 0)]));
  D.actions.push(A(0x4c, 'Motion[3]', [at('shell13', 32, 1)]));
  for (const [n, m0] of [[0x2d, 3], [0x36, 7], [0x37, 11], [0x38, 15]])
    D.actions.push(A(n, 'Motion[1]', [78, 150, 240, 296].map((F, i) => at('shell00', F, m0 + i))));
  D.perFrame008 = PERFRAME008;
  D.counter008 = true;
  SHELL_DATA.em008_00 = D;
}
'''
import json, ast, subprocess, sys
L = open(SP + r'\shl_em008_00.txt', encoding='utf8').read().split('\n')
def modes_of(tag):
    i = [k for k, l in enumerate(L) if l.startswith('== ') and tag in l][0]
    out = []; cmn = None
    for l in L[i+1:]:
        l2 = l.strip()
        if l2.startswith('=='): break
        if l2.startswith('cmn path') and '{' in l2 and 'NOT IN ARC' not in l2:
            cmn = ast.literal_eval(l2[l2.index('{'):])
        if not l2.startswith('mode '): continue
        n = int(l2.split()[1]); d = json.loads(l2[l2.index('{'):])
        ef = [[a, (-1 if b == 4294967295 else b)] for a, b in d['ef'][0]['arr']]
        out.append("          %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (n, d['scale'][0], json.dumps(ef).replace(' ', ''), json.dumps(d['hit']['ints']), json.dumps(d['sh']['ints']), json.dumps(d['sh']['floats']), json.dumps(d['sh']['vecs'])))
    return '\n'.join(out), cmn
hd = subprocess.check_output([sys.executable, SP + r'\hit.py', 'em008_00'], text=True)
print(hd)
HD = {}
for line in hd.strip().split('\n'):
    parts = line.split(' ', 3)
    HD[parts[1]] = json.dumps([list(t) for t in ast.literal_eval(parts[3])])
m00, c00 = modes_of('shell00'); m01, _ = modes_of('shell01'); m13, _ = modes_of('shell13')
print('cmn00', c00)
cmn = '{ ints: %s, floats: %s, vecs: %s }' % (json.dumps(c00['ints']), json.dumps(c00['floats']), json.dumps(c00['vecs']))
blk = blk.replace('@@MODES00@@', m00).replace('@@MODES01@@', m01).replace('@@MODES13@@', m13).replace('@@CMN00@@', cmn)
blk = blk.replace('@@HD00@@', HD.get('em008_00_00_hitdata', '[]')).replace('@@HD01@@', HD.get('em008_00_01_hitdata', '[]')).replace('@@HD13@@', HD.get('em008_00_13_hitdata', '[]'))
blk = blk.replace('@@BS@@', BS + BS).replace('\n', NL)
A = '// ---- HELLBLADE GLAVENUS (em080_04'
assert s.count(A) == 1
s = s.replace(A, blk + A)
rep("  } else if (a && !fresh && state.prevJoints && a.code === 'em080'){",
    "  } else if (a && !fresh && state.prevJoints && a.code === 'em008'){\n    spawn008(state, D, a, ctx, input, out);                  // Yian Kut-Ku's fireballs and lob\n  } else if (a && !fresh && state.prevJoints && a.code === 'em080'){")
rep("  if (D.perFrame007) perFrame007(state, D, ctx, input, out, fresh);   // Diablos's / Bloodbath's dust (0xd35a94), line 4",
    "  if (D.perFrame007) perFrame007(state, D, ctx, input, out, fresh);   // Diablos's / Bloodbath's dust (0xd35a94), line 4\n  if (D.perFrame008) perFrame008(state, D, ctx, input, out, fresh);   // Kut-Ku's frame handler (0xd4ffa4), line 4\n  if (D.counter008) counter008(state, D, ctx, input, out, fresh);     // ...and (7, 0x02)'s hover dust (0xd4bb94)")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
