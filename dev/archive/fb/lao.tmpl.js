// ---- LAO-SHAN LUNG (em012_00): uEm012_00's event lists -- the falling rubble sp_13 0x81 (base13) and the hit volumes sp_01 0x80 (base01) ----
// READ 2026-10-18 (dev/elder-dragon-shells-spec.md 2). He has no shell in an action body: every shell is a record of the per-frame
// handler vt+0x2a8 0xd759f4, which walks two record lists from e+0xcae0 = an entry of the table 0x17a50f4 (58 x {list A, list B};
// e+0xcad8 / count e+0xcad4 = 0x3a, 0xd78684). The entry: the action start vt+0x204 0xd76bec sets e+0xcae0 = 0, then, when the pending
// index byte e+0xcadc != 0xff (and < the count), the table's entry, and puts the byte back to 0xff (0xd76d3c..0xd76da4); the byte is
// written by vt+0x218 0xd77a8c sel 0 -- the EMC's op 0xa3 (0, idx), issued right before its do-action (em012_00_cmdtbl.emc, every
// stream: (7, 0) 25 / 26 / 47 / 48 (50:50 pairs, op 02), (7, 2) 27 / 28, (7, 3) 29..36 by the stream's section, (7, 4) 37 / 38,
// (7, 5) 43..46, (1, 4) 50..55, (1, 1) 56 / 57) -- and once by the class (0xd755dc: 8, quest map 0x1a area 1). Which of an action's
// entries the AI takes (the 50:50 pick, the stream's section) is not the viewer's to know: one entry per play, the rows' order.
// A record (0x24): +0 the action (1 hit 0x7db70, 2 the motion rate 0xb07b4, 3 a flag, 4 a sound, 5 sp_01, 6 sp_13), +4 the motion,
// +8 the test (1..12, table 0xd75bac: 1 = the motion and 0xb0968(e, 0, 0, +0xc, 0), the frame crossed -- every shell record is
// type 1), +0xc / +0x10 the frames, +0x14.. the arguments as floats. sp_01 (0xd75ea4): mode u32(+0x14), the point tune vec
// [+0x18] (0x6f640), the Y word u16(s32(0.5 + tune float [+0x1c] x 182.04445)) at setup +0x34 (+0x30 / +0x38 0, +0x3c 0xffff).
// sp_13 (0xd75f88): mode 0, setup +0x40 = tune vec [+0x14] (the start), +0x50 = tune vec [+0x18] (the end), +0x60 = tune float
// [+0x1c] (the delay). THE POINTS ARE THE FORTRESS'S OWN, absolute (em012_00_actiontune.fup): the viewer draws them where they are.
// Entries 1 / 3 / 22 (sp_01 only) and 39..42 (L2 M5's rubble): no op 0xa3 in the EMC and no class store names them -- not listed.
const TUNE012V = { /*TUNEV*/ };
const TUNE012F = { /*TUNEF*/ };
// sp_01's reader 0xd7cd50 (READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15d8; +0x15ec 0x80 int 0 != -1, 4 int 1 != -1; floats 0 / 1 ->
// +0x15f4 / +0x15f8. The event modes 20 / 30 / 31: ints -1, floats 0, ef (999) -- hit volumes (hit 2 / 3 / 4: 10 frames), nothing drawn
function params012s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const flags = (I(0) !== -1 ? 0x80 : 0) | (I(1) !== -1 ? 4 : 0);
  return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: [0, 0, 0], up: F(0), down: F(1), maxH: f(900.0),
           why: !sh ? 'uShellEm012_sp_01: a mode its files do not carry'
              : (flags & 0x80) ? 'uShellEm012_sp_01: +0x15ec 0x80 (sh int 0 != -1, modes 0 / 10) -- base01 bit 7 not transcribed' : null,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xd7cd50] = sh => params012s01(sh);
// sp_13's reader 0xd7d2bc (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0; int 0 -> +0x15e8 (the ground marker 0x40512c -> 0x43b2b0
// in state 2: not drawn, as every class's); floats 0 speed +0x15ec, 1 per unit +0x160c, 2 gravity +0x15f4, 3 life +0x15f8
function params012s13(mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { flags: 0, speed0: F(0), speedPer: F(1), gravity: F(2), life: F(3), f15f0: f(0.0), marker: sh.ints.length ? sh.ints[0] : -1 };
}
// sp_13's init 0xd7cf9c (READ whole; base13's 0x4044d8 is not called): +0x1680 = the start, +0x1690 = the end, +0x16a0 = the delay;
// the owner test (0x43a850 / 0x4a100c +0x50 bit 0), the reader; the words +0xfe8.. 0; the life +0x1638 = +0x15f8; +0x40 and +0x1000 = the
// start; vt+0x16c 0x405a88 the Y word from +0x40 to vt+0x168 = 0xd7d4bc (the end); the launch 0x404dc8 (its thrown point the end, +0x15f0
// the ctor's 0) -> +0x1010.. turned by that word ([0xd7d2b4] = 0.0 the two other turns' sine, [0xd7d2b8] 2pi / 65536); +0x1020.. the fall;
// ef 0 at +0x40 -> +0x1674 (0x4a10c8 / 0x4a11e4, the area byte e+0x1054); 0x43ab74(+0x1618 = the ctor's 1.0). Delay > 0: state 1 and the
// handle's byte +0x1c1 = 0 (the core's draw byte: 0x43370 copies it to +0x18c, which 0x327214 turns into bit 11 of its units' +0xc);
// else state 2, 0x404fa0 / vt+0x160 (the hit side)
function launch012(S, k){
  const T = S.end, P = S.position;
  const dx = f(P[0] - T[0]), dz = f(P[2] - T[2]);
  let dy = f(T[1] - P[1]);
  dy = dy > 0 ? (k.f15f0 > 0 ? f(0.0) : dy) : dy;
  const dist = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  const speed = mla(k.speed0, k.speedPer, dist);
  const t = f(dist / speed);
  const vy = f(mla(dy, f(f(t * t) * k.gravity), f(-0.5)) / t);
  return { velocity: [f(0.0), vy, speed], acceleration: [f(0.0), k.gravity, f(0.0)], dist, speed, t };
}
function make012s13(state, D, setup, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[0], lists = def.lists || D.lists;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: 0, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  const k = S.k = params012s13(mode);
  S.end = setup.end.map(f);                                       // +0x1690..
  S.delay = f(setup.delay);                                       // +0x16a0
  S.angles = [0, 0, 0];
  S.lifetime = k.life;
  S.position = setup.start.map(f);
  S.anchor = S.position.slice();
  const a = wordOf(f(S.end[0] - S.position[0]), f(S.end[2] - S.position[2]));   // vt+0x16c
  const L = launch012(S, k);
  const z = f(0.0);
  let vx = L.velocity[0], vy = mls(L.velocity[1], L.velocity[2], z), vz = mla(L.velocity[2], L.velocity[1], z);
  const rad = f(f(u16(a) >>> 0) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  const vz2 = mls(f(vz * cs), vx, sn), vx2 = mla(f(vx * cs), vz, sn);
  vx = mls(vx2, vy, z); vy = mla(vy, vx2, z);
  S.velocity = [vx, vy, vz2];
  S.gravity = L.acceleration.slice();
  S.aim = a;
  S.unitScale = f(1.0);                                           // 0x43ab74(+0x1618)
  S.launch = { point: S.position.slice(), thrown: S.end.slice(), aim: a, dist: L.dist, speed: L.speed, t: L.t,
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), life: S.lifetime, delay: S.delay };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  if (S.delay > 0){ S.state = 1; S.shown1c1 = 0; }               // the handle's +0x1c1 = 0
  return S;
}
// +0x15c 0xd7d3c0 (READ whole), state 1: the delay > 0 -> delay - dt, kept >= 0, and returns while it is still > 0; then (or at once when it
// was <= 0: set to 0) state 2, the handle's +0x1c1 = 1, 0x404fa0 and vt+0x160 (the hit side). The flight starts on the next move
function delay012s13(S, ctx){
  S.moves++;
  if (S.delay > 0){
    const d = f(S.delay - ctx.dt);
    S.delay = f(0.0) >= d ? f(0.0) : d;
    if (d > 0) return;
  } else S.delay = f(0.0);
  S.state = 2;
  S.shown1c1 = 1;
}
// the landing +0x150 0xd7d450 (READ whole), state 2 only: type 0 -> ef +0x15cc (1), 1 -> +0x15d0 (2), 2 -> +0x15d4 (3), else none;
// base13's landing effect 0x4042bc at the contact, then vt+0x148(0) (the end)
LANDING13.uShellEm012_sp_13 = (S, D, ctx, out) => {
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return;
  const param = [1, 2, 3][hit.type];
  if (param == null || !S.mode.ef[param]) return;
  const rq = rockRequest(D, S.mode, param, hit.point, 'landing', listsOf(D, S));
  S.events.push(rq ? { ev: 'start', param, kind: 'landing', start: rq } : { ev: 'refused', param, kind: 'landing' });
  if (rq){ S.effect2 = { param, key: rq.key, kind: 'landing', move: S.moves }; out.started.push({ shell: S, start: rq }); }
};
// the spawner (code 'em012'): the action's entry, its records in list order (A, then B) at the frame each crosses
function spawn012(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist) return;
  const own = ctx.own001;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.s01){
      const [m, pv, py] = sp.s01, yw = u16(s32(mla(f(0.5), f(TUNE012F[py]), DEG_TO_U16)));
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: m, position: TUNE012V[pv].map(f), angles: [0, yw, 0],
                                               action: a.action, frame: sp.frame }, own, state.prevJoints || ctx.J, ctx, null);
      if (S){ S.motionId = ctx.ownerMotion; state.shells.push(S); out.spawned.push(S); }
      continue;
    }
    const [s, e, d] = sp.s13;
    const S = make012s13(state, D, { start: TUNE012V[s], end: TUNE012V[e], delay: TUNE012F[d] }, ctx, a.action, sp.frame);
    state.shells.push(S); out.spawned.push(S);
  }
}
const act012 = (st, n, list, clip, entry, spawns) => ({ action: [st, n], code: 'em012', list, clip, pick: 'ai', entry,
  variant: st + ':0x' + n.toString(16).padStart(2, '0') + ' #' + entry, spawns });
SHELL_DATA.em012_00 = {
  name: 'Lao-Shan Lung',
  lists: { 0: { list: 'u', pel: 'em012_00u' } },
  shells: {
    shell01: { id: 0x80, cls: 'uShellEm012_sp_01', base: 'base01', reader: 0xd7cd50, folder: 'shell\\em\\em012_00_shell01',
      lists: { 0: { list: 'c', pel: 'em012_00c' } },
      modes: {
        20: m057(1.0, [[999, -1]], [2], [-1, -1], [0.0, 0.0], []),
        30: m057(1.0, [[999, -1]], [3], [-1, -1], [0.0, 0.0], []),
        31: m057(1.0, [[999, -1]], [4], [-1, -1], [0.0, 0.0], []) },
      hitdata: [[0, 10], [0, 8], [0, 10], [0, 10], [0, 10]] },
    shell13: { id: 0x81, cls: 'uShellEm012_sp_13', base: 'base13', reader: 0xd7d2bc, folder: 'shell\\em\\em012_00_shell13',
      lists: { 0: { list: 'u', pel: 'em012_00u' } },
      modes: { 0: m057(1.0, [[0, 10], [0, 20], [0, 20], [0, 20]], [0], [2], [15.0, 0.012000000104308128, -1.0, 300.0], []) },
      hitdata: [[0, 9999]] }
  },
  actions: [
/*ROWS*/
  ]
};
