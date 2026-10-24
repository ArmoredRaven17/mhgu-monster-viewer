
// THE THROWS (sp_13, base13: 0x15b / 0x15f) and the puddles they leave (sp_01, base01: 0x159 / 0x15d) -- READ 2026-10-18
// (dev/leviathan-shells-spec.md 5). The status-2 actions 0x103c6c4 / 0x103cac8 / 0x103d7fc / 0x103db98 / 0x103ea54 / 0x103ede0 (by
// the dispatcher 0x103bce8, with a SET 0..3) run the helpers 0x104a90c / 0x104adbc / 0x104bb60 / 0x104bedc / 0x104b138 / 0x104b314:
// three throws each at tune frames 10 / 20 / 30, the throw's k = 3 x the helper's place + 0..2 (k 0..17). Each one's mode (the
// inline blocks and 0x104ac84 alike): -1 with the tail severed for k in {0, 3, .., 15} (0x9249), while tired for k - 2 in that set,
// with the head broken for k 18; else x = u16((e+0x73e8 + 0x17 k - 0x9c4) % 100, signed) against the action's pair (n - 4 in the
// tables: 90 / 100 for n in S13_082, -1 / -1 else): mode 2 for 90 <= x < 100, else 0 (the third arm, 4, is never reached: its bound
// is the second's). The maker 0x104a634(e, m, &vec): m <= 5 (+10 for Soulseer, and only with the soul flame out); a base13 setup
// (0x4041a8, 0x40 bytes): the id e+0xcacc, the mode, the owner, +0x10 the zero vector, +0x20.. the throw's vector THROW082[set][h %
// 3][k] (a table the static initialisers fill: read out of the initialised image), +0x30 0, +0x34 0xffff.
const S13_082 = new Set([4, 5, 8, 9, 17, 19, 25, 27, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 50, 51]);
function choose082s13(n, k, st){
  if (st.tail && k <= 15 && ((0x9249 >>> k) & 1)) return -1;
  if (st.tired && ((k - 2) >>> 0) < 16 && ((0x9249 >>> (k - 2)) & 1)) return -1;
  if (st.head && k === 0x12) return -1;
  const x = u16((st.h + 0x17 * k - 0x9c4) % 100);
  const lo = S13_082.has(n) ? 90 : -1, hi = S13_082.has(n) ? 100 : -1;
  return x < lo ? 0 : x < hi ? 2 : 0;
}
const THROW082 = @THROW@;
// sp_13's reader 0x104f494 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hits 0 / 1 -> +0x15d8 / +0x15dc; int 0 the joint +0x15e4;
// +0x15e0 = (the ctor's 0 & ~0x62) | 2 when int 1 != -1; floats 0 speed +0x15ec, 1 the arc's height +0x15f0, 2 life +0x15f8, 3 far
// +0x1600, 4 near +0x15fc; &vec 0 -> both points +0x161c / +0x1620. The ctor's: gravity +0x15f4 0, per unit +0x160c 0, the aim limits 0,
// +0x1614 0, +0x1630 the zero vector (no turn)
function params082s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: I(1) !== -1 ? 2 : 0, speed0: F(0), f15f0: F(1), life: F(2), far: F(3), near: F(4), gravity: f(0.0),
           speedPer: f(0.0), limitA: f(0.0), limitB: f(0.0), y1614: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f), turn: null };
}
// 0x404dc8, the launch, from the shell's point to the thrown point (thrown13: along the aim, the distance clamped [near, far], the
// setup's +0x20 vector added) -- with +0x15f0 > 0 and the gravity 0 the drop is clamped to <= 0 and the fall is the one that peaks
// +0x15f0 above the start (launch13n's arm, 0x404f04..0x404f4c)
function launch082s13(S, k, own){
  const T = thrown13(S, k, own), P = S.position;
  const dx = f(P[0] - T[0]), dz = f(P[2] - T[2]);
  const dy0 = f(T[1] - P[1]);
  const dy = k.f15f0 > 0 ? (dy0 > 0 ? f(0.0) : dy0) : dy0;
  const dist = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  const speed = mla(k.speed0, k.speedPer, dist);
  const t = f(dist / speed);
  let g = k.gravity;
  if (k.f15f0 > 0 && k.gravity === 0){
    const a = sqrtf(f(k.f15f0 + k.f15f0)), h2 = f(k.f15f0 - dy), b = sqrtf(f(h2 + h2));
    const q = f(f(a + b) / t);
    g = f(-f(q * q));
  }
  const vy = f(mla(dy, f(f(t * t) * g), f(-0.5)) / t);
  return { velocity: [f(0.0), vy, speed], acceleration: [f(0.0), g, f(0.0)], thrown: T, dist, speed, t };
}
// base13's init 0x4044d8 on these flags (0): init13k's path -- the joint's row 3, the two points (both vec 0) at 0.5 through its 3x3,
// the thrown point, the Y word toward it, the launch turned by that word, the second pair moving +0x40 by nothing; ef 0; state 2
function make082s13(state, D, m, centre, own, J, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell13 mode ' + m + ': no files in this arc' };
  if (!own.target) return { why: 'no target (input.rock.target)' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: 'base13',
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  const k = S.k = params082s13(def, mode);
  S.centre = centre.map(f); S.y1614 = k.y1614; S.lifetime = k.life; S.angles = [0, 0, 0];
  const M = jointMatrix(J, k.joint);
  if (!M) return { why: 'no joint ' + k.joint };
  const turn = p => [mla(mla(f(M[4] * p[1]), M[0], p[0]), M[8], p[2]), mla(mla(f(M[5] * p[1]), M[1], p[0]), M[9], p[2]),
                     mla(mla(f(M[6] * p[1]), M[2], p[0]), M[10], p[2])];
  const pair = r => turn([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)));
  const m1 = pair(f(0.5));
  let pos = [f(m1[0] + f(M[12])), f(m1[1] + f(M[13])), f(m1[2] + f(M[14]))];
  S.position = pos;
  const L = launch082s13(S, k, own);
  const a = wordOf(f(L.thrown[0] - pos[0]), f(L.thrown[2] - pos[2]));
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  S.velocity = [f(L.velocity[2] * sn), L.velocity[1], f(L.velocity[2] * cs)];
  S.gravity = L.acceleration.slice();
  const h = sqrtf(mla(f(L.velocity[2] * L.velocity[2]), L.velocity[0], L.velocity[0]));
  const w = u16(0x10000 - u16(s32(mla(0.5, atan2f(f(-L.velocity[1]), h), RAD_TO_U16))));
  const ratio = w > 0x8000 ? f(1.0) : w > 0x2000 ? f(0.0) : mla(f(1.0), f(w), f(-0.0001220703125));
  const m2 = pair(ratio);
  pos = [0, 1, 2].map(i => f(m2[i] + f(pos[i] - m1[i])));
  S.position = pos; S.anchor = pos.slice(); S.aim = a; S.timer = f(0.0);
  S.launch = { point: pos.slice(), thrown: L.thrown.slice(), aim: a, dist: L.dist, speed: L.speed, t: L.t, ratio,
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), life: S.lifetime, angles: [0, 0, 0] };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// sp_13's landing 0x104f614 (READ whole): byte +0x15c0 = 1; type 0 -> ef 1, type 2 -> ef 3; type 1 -> ef 2 after 0x104f6ac's puddle:
// sp_01 [0x16a24d0][mode] (modes past 15: 8) at the contact with its words +0xfe8.. (the zero vector at +0x20, +0x3c +0x13dc);
// then 0x4042bc (the contact start) and the end. Its +0x164 0x104f7d8 ends it on a hunter hit (byte +0x151e: no hunter)
const CHILD13_082 = [2, 3, 4, 5, 6, 7, 8, 8, 8, 8, 2, 3, 4, 5, 6, 7];
function landing082s13(S, D, ctx, out){
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return 'keep';
  const n = S.events.length;
  if (hit.type === 1 && ctx && ctx.create){
    const m = S.modeIndex <= 15 ? CHILD13_082[S.modeIndex] : 8;
    ctx.create(S, 'shell01', { mode: m, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  }
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
  for (const e of S.events.slice(n)) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
}
// sp_01's reader 0x104ec34 (READ whole): ef 0 -> +0x15c8 (the init's), ef 1 -> +0x15d4 (the END's start, base01 0x3fb2fc); hits 0 / 1
// -> +0x15d8 / +0x15e0; +0x15ec: 4 int 0 (the ground snap), 8 int 1 (laid on it); float 0 the timer +0x15f0 (300); &vec 0 -> +0x1608.
// Its +0x150 / +0x160 end it on a hunter hit (bytes +0x13ae / +0x151e: no hunter)
function params082s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0), joint: -1, timer: F(0), f1600: f(0.0), f15fc: f(1.0),
           vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm082_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null, 0x15d4: 1 } };
}
// the throw rows: { frame, k, set } -- spawnThrow082 from spawn082
function spawnThrow082(state, D, a, sp, ctx, input, out){
  const own = ctx.own001;
  // (0x104b138 / 0x104b314 skip all three for Soulseer with the soul flame lit, and the maker refuses his throws then: the flame is
  // shown unlit here, dev/em082-effects-spec.md 3)
  const st = { tired: !!ctx.tired, head: !!(input.mizu082 && input.mizu082.headBroken), tail: !!input.tailSevered, h: H73E8_STANDIN };
  let m = choose082s13(a.action[1], sp.k, st);
  if (m < 0 || m > 5) return;
  if (D.variant082 === 4) m += 10;
  const centre = THROW082[sp.set][st.h % 3][sp.k];
  const r = make082s13(state, D, m, centre, own, state.prevJoints, ctx, a.action, sp.frame);
  if (!r.S){ out.refused.push({ action: a.action, shell: 'shell13', mode: m, why: r.why }); return; }
  state.shells.push(r.S); out.spawned.push(r.S);
}
const T082 = (k0, set) => [10, 20, 30].map((frame, i) => ({ frame, k: k0 + i, set, throw: true }));
for (const [mon, v, i13, i01] of [['em082_00', 0, 0x15b, 0x159], ['em082_04', 4, 0x15f, 0x15d]]){
  const D = SHELL_DATA[mon], res = mon + '_shell';
  // shell13: the thrown bubbles (u 1 / 11 / .. flying; their landing u 2 / 12 / .. and the puddle)
  D.shells.shell13 = { id: i13, cls: 'uShellEm082_sp_13', base: 'base13', reader: 0x104f494, folder: 'shell@em@' + res + '13',
                       modes: v === 4 ? @M13_04@ : @M13_00@ };
  // shell01: the puddles (300 frames; ef 1 at their end)
  D.shells.shell01 = { id: i01, cls: 'uShellEm082_sp_01', base: 'base01', reader: 0x104ec34, folder: 'shell@em@' + res + '01',
                       modes: v === 4 ? @M01_04@ : @M01_00@, hitdata: [[2, 10], [2, 360], [2, 360], [2, 360]] };
  // the dispatcher 0x103bce8 (n -> the action function and its set) and the census's clips
  const rows = [[0x04, 'Motion[55]', 0, 0], [0x11, 'Motion[55]', 0, 0], [0x1e, 'Motion[55]', 0, 1], [0x22, 'Motion[61]', 0, 0], [0x26, 'Motion[61]', 0, 0],
                [0x2a, 'Motion[55]', 0, 2], [0x2c, 'Motion[55]', 0, 3],
                [0x05, 'Motion[58]', 3, 0], [0x13, 'Motion[58]', 3, 0], [0x1f, 'Motion[58]', 3, 1], [0x23, 'Motion[62]', 3, 0], [0x27, 'Motion[62]', 3, 0],
                [0x2b, 'Motion[58]', 3, 2], [0x2d, 'Motion[58]', 3, 3],
                [0x08, 'Motion[55]', 6, 0], [0x19, 'Motion[55]', 6, 0], [0x20, 'Motion[55]', 6, 1], [0x24, 'Motion[61]', 6, 0], [0x28, 'Motion[61]', 6, 0],
                [0x09, 'Motion[58]', 9, 0], [0x1b, 'Motion[58]', 9, 0], [0x21, 'Motion[58]', 9, 1], [0x25, 'Motion[62]', 9, 0], [0x29, 'Motion[62]', 9, 0],
                [0x32, 'Motion[55]', 12, 0], [0x33, 'Motion[58]', 15, 0]];
  D.actions = D.actions.concat(rows.map(([n, clip, k0, set]) => act082(2, n, clip, T082(k0, set))));
}
