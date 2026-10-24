// ---- FATALIS (em013_00): uEm013_00 variant 0 -- sp_00 0x82 (base00, the fireball), sp_01 0x83 (base01, the landings' fire and the
// dust), sp_51 0x85 (base51, the sweeping blast); his beam 0x84 is beam-spawns.js's ---------------------------------------------------
// READ 2026-10-18 (dev/elder-dragon-shells-spec.md 3). One class for the line (variant byte e+0xb5f5; the makers read it, some through
// the pointer `ldr [r7, #0x1428]!` left, e+0x1428 + 0xa1cd). Which actions he plays: em013_00_cmdtbl.emc with op 0x92 (the variant
// switch) evaluated for 0 (fb/emcvar.py) closed over the set-action calls (fb/chain013.py) -- each of those actions makes only his
// own ids (0x82..0x85), the control that the walk is right; the others make Crimson's or Old's.
// The helpers (args read by hook in every phase / scenario, fb/gen013.py):
//   0xd82024(e, sel, dX, dY): sp_00, mode sel == 1 ? 1 : 0, +0x20.. = the block's words + (dX, dY, 0), +0x10 the zero vector;
//   0xd81e80(e, L, &v, raise): the aimed pitch word (aim013), at phase 0 into [e+0xcac0]+0 -- the fire's dX where it reads it;
//   0xd7ffcc(e, kind, &v, scale): sp_01 mode (kind 5 -> 6, 1 -> 5), at the block point + v x scale x 0xbec34 turned by the Y word,
//     the block's words; then 0x43ab74(shell, scale) -- the shell's unit size;
//   0xd85fbc(e, side, aimed) phase 1 f166: sp_51 0 at the block point + (side ? (560, 0, 200) : (-500, 0, 320)) x 0xbe518 turned by
//     the Y word, words (aimed ? 0xd81e80(e, 0x2000, &(x, 0, z), 150.0) : 0, Y + (side ? 0xe38e : 0x5b0), 0).
// NOT LISTED (named): (7, 0x28 / 0x29 / 0x2f / 0x30 / 0x34 / 0x35), the turning flame (0xd854fc / 0xd85e18 / 0xd844e8): the clip
// and the fire's words are chosen from the target's bearing mid-action (L2 M37 / M38 / M50 / M51 / M63 / M66, motion rates) -- not
// transcribed; (7, 0x2d / 0x4d)'s phase-3 dust (f50) -- the clip that phase plays is set by a branch not read; (3, 0x0b / 0x0f),
// (4, 0x04 / 0x05): no EMC stream or set-action call read issues them (one 0x768c8 site behind e+0x7420, not reached).
function params013s00(def, mode){                  // sp_00's reader 0xd8b6f8 (READ whole)
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  // ef 0 -> +0x15c8, ef 1 -> +0x15d4 (the type-2 landing); hit 0; int 0 the joint +0x15dc; +0x15e8 |= 0x20 when int 1 != -1 (the
  // setup's words); float 0 -> +0x15ec (degX), 1 -> +0x15fc (the flight), 2 -> +0x15f4 (vz); &vec 0 -> +0x1610
  return { joint: I(0), flags: I(1) !== -1 ? 0x20 : 0, degX: F(0), xDeg: F(0), degY: f(0), yDeg: f(0), vz: F(2), vy: f(0), flight: F(1),
           xLo: f(0), xHi: f(0), yLo: f(0), yHi: f(0), vec: V(0), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: ZERO3.slice() };
}
READER00.uShellEm013_00_00 = (def, mode) => params013s00(def, mode);
WORDS00.add('uShellEm013_00_00');
// sp_00's landing 0xd8b7f8 (READ whole): type 0 -> ef +0x15cc, 1 -> +0x15d0 (both the ctor's 0) after 0x43ac04 (the camera, -1), 2 ->
// +0x15d4 (ef 1) -- 0x3f8970 at the contact; then by the mode (0x4a0ee4): 0 -> sp_01 2 (type 0) / 0 (type 1), 1 -> 3 / 1 (type 0 / 1),
// type 2 none -- at the contact, the words the GOT zero vector, owner the shell's; then vt+0x148(0)
function landing013s00(S, D, hit, ctx){
  const param = [null, null, 1][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
  const m = S.modeIndex, child = m === 0 ? [2, 0, null][hit.type] : m === 1 ? [3, 1, null][hit.type] : null;
  if (child != null && ctx && ctx.create) ctx.create(S, 'shell01', { mode: child, position: hit.point.slice(), angles: [0, 0, 0] });
}
LANDING.uShellEm013_00_00 = (S, D, hit, ctx) => landing013s00(S, D, hit, ctx);
// sp_01's reader 0xd8baa4 (READ whole): ef 0; hit 0; +0x15ec 4 int 0, 8 int 1, 0x800 int 2, 0x80 int 3; float 0 the timer +0x15f0;
// +0x15f4 = 1.0, +0x15f8 = 0 (the snap's reach: 1 up, 0 -> 1e6 down); &vec 0 -> +0x1608, &vec 1 -> +0x160c (degrees)
function params013s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? 0 : i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 0x800 : 0) | (I(3) !== -1 ? 0x80 : 0);
  const why = !sh ? 'uShellEm013_00_01: a mode its files do not carry'
            : (flags & 0x800) ? 'uShellEm013_00_01: base01 flag 0x800 (+0x1650 x 0xbec34) not transcribed' : null;
  return { flags, joint: -1, timer: F(0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), deg: V(1), up: f(1.0), down: f(0.0), maxH: f(900.0),
           why, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xd8baa4] = sh => params013s01(sh);
// sp_51's reader 0xd8c0a0 (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15d0 (base51's switch, +0x164 0x4290e4); hit 0; the timer +0x15f0 =
// 1000.0; +0x15ec |= 0x20; then, from the post-indexed +0x15ec: +0x1660 = 0 (the init's arm), +0x1664 = 30.0 (the wait), +0x1668 = 30.0
// (the sweep), +0x166c = 3.0 (the anchor's lag), +0x1670.. = (0, 0, 3400.0) (the sweep's reach)
function params013s51(sh){
  return { flags: 0x20, joint: -1, timer: f(1000.0), f1600: f(0.0), f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0),
           maxH: f(900.0), why: !sh ? 'uShellEm013_00_51: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: 1 },
           m1660: 0, wait: f(30.0), len: f(30.0), lag: f(3.0), reach: [f(0.0), f(0.0), f(3400.0)] };
}
READERS01[0xd8c0a0] = sh => params013s51(sh);
// BASE51 (uShellEmBase51: ctor 0x428af4, init 0x428bc4, +0x150 0x428f48, +0x164 0x4290e4; the rest base01's). The init (READ whole):
// base01's 0x3fa498, the sub-state byte +5 = 0, then by +0x1660 -- 0 (0x428d80): the reach turned by the Z (+0xff0), X (+0xfe8) and Y
// (+0xfec) words; +0x1680 = the point, +0x1690 = the point + the turned reach; 1 (0x428c00, no reader writes it): the reach halved and
// both ends about the point; then +0x40 / +0x1000 = +0x1680
function init51(S){
  const k = S.k, P = S.position;
  if (k.m1660 !== 0) return false;                   // (the 1 arm: no reader of the line writes it)
  const rot = w => { const r = f(f(u16(w)) * U16_TO_RAD); return [sinf(r), cosf(r)]; };
  let [x, y, z] = k.reach;
  let [s, c] = rot(S.angles[2]);                                       // +0xff0
  const x1 = mls(f(x * c), y, s), y1 = mla(f(y * c), x, s);
  [s, c] = rot(S.angles[0]);                                           // +0xfe8
  const y2 = mls(f(y1 * c), z, s), z2 = mla(f(z * c), y1, s);
  [s, c] = rot(S.angles[1]);                                           // +0xfec
  const x3 = mla(f(x1 * c), z2, s), z3 = mls(f(z2 * c), x1, s);
  S.a51 = P.slice();
  S.b51 = [f(P[0] + x3), f(P[1] + y2), f(P[2] + z3)];
  S.sub51 = 0;
  S.position = S.a51.slice(); S.anchor = S.a51.slice();
  S.launch = { point: S.a51.slice(), to: S.b51.slice() };
  return true;
}
// base51's +0x150 0x428f48 (READ whole), by the sub-state byte: 0 -> 1 once +0x1618 > the wait; 1 -> t = (+0x1618 - wait) / len (at
// most 1): +0x40 = A (1 - t) + B t; the anchor +0x1000 the same at (+0x1618 - wait - lag) / len in [0, 1]; past len + lag -> 2; 2 ->
// vt+0x148(0), the end
function sweep51(S){
  const k = S.k;
  if (S.sub51 === 2) return 'end';
  if (S.sub51 === 0){ if (S.elapsed > k.wait) S.sub51 = 1; return 'keep'; }
  const A = S.a51, B = S.b51, s0 = f(S.elapsed - k.wait), L = k.len, one = f(1.0);
  let t = f(s0 / L); t = t < one ? t : one;
  const u = f(one - t);
  S.position = [mla(f(A[0] * u), B[0], t), mla(f(t * B[1]), A[1], u), mla(f(t * B[2]), u, A[2])];
  let t2 = f(f(s0 - k.lag) / L); t2 = t2 < one ? t2 : one; t2 = t2 > f(0.0) ? t2 : f(0.0);
  const u2 = f(one - t2);
  S.anchor = [mla(f(A[0] * u2), B[0], t2), mla(f(A[1] * u2), B[1], t2), mla(f(t2 * B[2]), A[2], u2)];
  if (!(s0 <= f(L + k.lag))) S.sub51 = 2;
  return 'keep';
}
// base51's +0x164 0x4290e4 (READ whole): base01's switch without the stops -- ef +0x15d0 at +0x40 into +0x162c once slot 0's delay
// +0x1404 minus the frame step is not > 0, 0x43ac04 when +0x15ec bit 6, and +0x15d0 = 0
function switch51(S, ctx, D){
  if (S.ef15d0 == null) return;
  if (!S.slots){
    if (!S.switchRefused){ S.switchRefused = true;
      ctx.out.refused.push({ shell: S.shell, mode: S.modeIndex, id: S.id, why: 'base51 switch (0x4290e4) reads hit slot 0\'s delay +0x1404: no hit slots (input.hitLife)' }); }
    return;
  }
  const sl = S.slots.find(x => x.slot === 0);
  if (f((sl ? sl.delay : f(0)) - ctx.dt) > 0) return;
  const param = S.ef15d0, def = D.shells[S.shell];
  const rq = rockRequest(D, S.mode, param, S.position, 'switch', def.lists || D.lists);
  S.events.push(rq ? { ev: 'start', param, kind: 'switch', start: rq } : { ev: 'refused', param, kind: 'switch' });
  S.effect3 = rq ? { param, key: rq.key, kind: 'switch', move: S.moves } : null;
  if (rq){ if (S.effects[param]) S.effects[param].started = true; ctx.out.started.push({ shell: S, start: rq }); }
  S.ef15d0 = null;
}
// the spawner (code 'em013'): rows { frame | at: 'start' | atEnd + frames: [last], fire: [sel, dX, dY] (dX 'aim' = the phase-0
// word) | dust: [kind, v, scale] | s51: [side, aimed] }; `aim` on the row: the phase-0 0xd81e80 (computed at the play's start)
function do013(state, D, a, ctx, out, sp){
  const own = ctx.own001, J = state.prevJoints || ctx.J, frame = sp.frame == null ? null : sp.frame;
  const push = S => { state.shells.push(S); out.spawned.push(S); };
  const refuse = why => out.refused.push({ action: a.action, why });
  if (sp.fire){
    const [sel, dx0, dy] = sp.fire;
    const dx = dx0 === 'aim' ? state.aim013 : dx0;
    if (typeof dx === 'string' || dx == null) return refuse(dx || 'no aim');
    if (!own.facing) return refuse('no facing (input.owner)');
    const o = Object.assign({}, own, { requestAngles: [(own.ownerX + dx) >>> 0, (own.ownerY + dy) >>> 0, own.ownerZ >>> 0] });
    const S = make00n(state, D, sel === 1 ? 1 : 0, J, o, ctx, a.action, frame);
    return S ? push(S) : refuse('shell00: no joint ' + D.shells.shell00.modes[sel === 1 ? 1 : 0].sh.ints[0]);
  }
  if (sp.dust){
    const [kind, v, scale] = sp.dust;
    if (!own.ownerPos || !own.facing) return refuse('no owner position / facing');
    const sc = f(scale), sz = scale001(own);
    const vx = f(f(f(v[0]) * sc) * sz), vz = f(f(f(v[2]) * sc) * sz), vy = f(f(f(v[1]) * sc) * sz);
    const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    const zr = mls(f(vz * cs), vx, sn), xr = mla(f(vx * cs), vz, sn), P = own.ownerPos;
    const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: kind === 5 ? 6 : kind === 1 ? 5 : 7,
      position: [f(xr + P[0]), f(vy + P[1]), f(zr + P[2])], angles: [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0],
      action: a.action, frame }, own, J, ctx, null);
    if (S){ S.unitScale = sc; S.motionId = ctx.ownerMotion; push(S); }
    return;
  }
  if (sp.s51){
    const [side, aimed] = sp.s51;
    if (!own.ownerPos || !own.facing) return refuse('no owner position / facing');
    const x = side ? f(560.0) : f(-500.0), z = side ? f(200.0) : f(320.0);
    let wx = 0;
    if (aimed){ wx = aim013({ limit: 0x2000, v: [x, 0.0, z], raise: 150.0 }, own); if (typeof wx === 'string') return refuse(wx); }
    const sz = size001(own), r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    const sx = f(sz * x), szz = f(sz * z), P = own.ownerPos;
    const xr = mla(f(sx * cs), szz, sn), zr = mls(f(szz * cs), sx, sn);
    const S = make001(state, D, 'shell51', { id: D.shells.shell51.id, mode: 0,
      position: [f(P[0] + xr), mla(P[1], sz, f(0.0)), f(P[2] + zr)], angles: [wx >>> 0, u16(own.ownerY + (side ? 0xe38e : 0x5b0)), 0],
      action: a.action, frame }, own, J, ctx, null);
    if (S) push(S);
  }
}
function spawn013(state, D, a, ctx, input, out, fresh){
  if (fresh){
    state.aim013 = a.aim ? aim013(a.aim, ctx.own001) : null;
    for (const sp of a.spawns) if (sp.at === 'start') do013(state, D, a, ctx, out, sp);
    return;
  }
  if (!state.hist || !state.prevJoints) return;
  for (const sp of a.spawns){
    if (sp.at === 'start') continue;
    const F = sp.atEnd ? sp.frames[0] : sp.frame;
    if (pass001(state, f(F))) do013(state, D, a, ctx, out, Object.assign({}, sp, { frame: F }));
  }
}
// a play's end (endWrap001's): the atEnd rows on the wrap of a clip the game plays once
function endWrap013(state, D, a, ctx, out, reach){
  const p1 = state.hist[1];
  for (const sp of a.spawns) if (sp.atEnd && p1 < sp.frames[0] && reach >= sp.frames[0]) do013(state, D, a, ctx, out, Object.assign({}, sp, { frame: sp.frames[0] }));
}
const act013 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em013', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
const AIM = (limit, v, raise) => ({ kind: 'em013_00 0xd81e80', limit, v, raise });
{
  const D = SHELL_DATA.em013_00;
  delete D.beamsOnly;
  D.lists = { 0: { list: 'u', pel: 'em013_00u' } };
  D.shells.shell00 = { id: 0x82, cls: 'uShellEm013_00_00', base: 'base00', folder: 'shell\\em\\em013_00_shell00',
    lists: { 0: { list: 'u', pel: 'em013_00u' } },
    modes: { 0: m057(1.0, [[0, 0], [0, 2]], [0], [3, 0], [0.0, 0.0, 60.0], [[0.0, 0.0, 0.0]]),
             1: m057(1.0, [[0, 0], [0, 11]], [1], [3, 0], [0.0, 72.0, 60.0], [[0.0, 0.0, 0.0]]) },
    hitdata: [[0, 216], [0, 72]] };
  D.shells.shell01 = { id: 0x83, cls: 'uShellEm013_00_01', base: 'base01', reader: 0xd8baa4, folder: 'shell\\em\\em013_00_shell01',
    lists: { 0: { list: 'u', pel: 'em013_00u' }, 1: { list: 'c', pel: 'em013_00c' } },
    modes: { 0: m057(1.0, [[0, 1]], [0], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             1: m057(1.0, [[0, 11]], [1], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             2: m057(1.0, [[0, 2]], [0], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             3: m057(1.0, [[0, 11]], [1], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             5: m057(1.0, [[1, 30]], [2], [0, 0, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             6: m057(1.0, [[1, 30]], [3], [0, 0, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]) },
    hitdata: [[10, 10], [10, 10], [14, 10], [14, 10]] };
  D.shells.shell51 = { id: 0x85, cls: 'uShellEm013_00_51', base: 'base51', reader: 0xd8c0a0, folder: 'shell\\em\\em013_00_shell51',
    lists: { 0: { list: 'u', pel: 'em013_00u' } },
    modes: { 0: m057(1.0, [[0, 30], [0, 31]], [0], [0], [], [[0.0, 0.0, 0.0]]) },
    hitdata: [[30, 99]] };
  D.actions = D.actions.concat([
    act013(3, 0x00, '1', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [151.0], dust: [1, [0.0, 0.0, 300.0], 1.8] }]),
    act013(4, 0x00, '1', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [151.0], dust: [1, [0.0, 0.0, 300.0], 1.6] }]),
    act013(4, 0x01, '1', 'Motion[5]', [{ frame: 10, dust: [1, [0.0, 0.0, 200.0], 1.6] }]),
    act013(7, 0x02, '2', 'Motion[7]', [{ frame: 102, fire: [0, 'aim', 0] }], { aim: AIM(0x71c, [40.0, 780.0, 1000.0], 0.0) }),
    act013(7, 0x03, '2', 'Motion[8]', [{ frame: 98, fire: [0, 0, 0] }], { aim: AIM(0x71c, [75.0, 160.0, 1150.0], 0.0) }),
    act013(7, 0x05, '2', 'Motion[10]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0x4000, [20.0, -530.0, 850.0], 0.0) }),
    act013(7, 0x07, '2', 'Motion[11]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 300.0, 400.0], 1.6] }]),
    act013(7, 0x07, '2', 'Motion[12]', [{ frame: 20, fire: [0, 0x2000, 0] }]),
    act013(7, 0x08, '0', 'Motion[31]', [{ frame: 28, dust: [1, [0.0, 0.0, 200.0], 1.6] }]),
    act013(7, 0x0d, '2', 'Motion[15]', [{ frame: 50, dust: [1, [0.0, 0.0, 300.0], 1.8] }]),
    act013(7, 0x22, '2', 'Motion[39]', [{ frame: 140, dust: [1, [0.0, 0.0, 600.0], 1.6] }]),
    act013(7, 0x25, '2', 'Motion[24]', [{ frame: 90, fire: [0, 'aim', 0] }], { aim: AIM(0x1555, [0.0, 200.0, 450.0], 0.0) }),
    act013(7, 0x44, '2', 'Motion[24]', [{ frame: 90, fire: [0, 'aim', 0] }], { aim: AIM(0x1555, [0.0, 200.0, 450.0], 200.0) }),
    act013(7, 0x26, '2', 'Motion[25]', [{ frame: 146, fire: [1, 0x2000, 0] }]),
    act013(7, 0x2b, '2', 'Motion[40]', [{ frame: 166, s51: [0, 0] }]),
    act013(7, 0x40, '2', 'Motion[40]', [{ frame: 166, s51: [0, 1] }]),
    act013(7, 0x2c, '2', 'Motion[43]', [{ frame: 166, s51: [1, 0] }]),
    act013(7, 0x41, '2', 'Motion[43]', [{ frame: 166, s51: [1, 1] }]),
    act013(7, 0x2d, '2', 'Motion[16]', [{ frame: 54, dust: [5, [0.0, 0.0, 300.0], 1.4] }]),
    act013(7, 0x4d, '2', 'Motion[16]', [{ frame: 54, dust: [5, [0.0, 0.0, 300.0], 1.4] }]),
    act013(7, 0x2e, '2', 'Motion[44]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0xaab, [20.0, 170.0, 840.0], 150.0) }),
    act013(7, 0x31, '2', 'Motion[45]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0xaab, [35.0, 690.0, 1100.0], 0.0) }),
    act013(7, 0x3a, '2', 'Motion[11]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 0.0, 0.0], 1.6] }]),
    act013(7, 0x3a, '2', 'Motion[12]', [{ frame: 20, fire: [0, 0x38e4, 0] }]),
    act013(7, 0x45, '2', 'Motion[56]', [{ at: 'start', fire: [1, 0, 0] }, { at: 'start', dust: [5, [0.0, 0.0, 300.0], 1.4] }]),
  ]);
}
