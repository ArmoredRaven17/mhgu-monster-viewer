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
const TUNE012V = { 15: [-5300.0, 1000.0, -13000.0], 16: [0.0, 1700.0, -5500.0], 17: [0.0, 1700.0, -5500.0], 18: [-500.0, 4000.0, 8000.0], 19: [-60.0, 0.0, 7770.0], 20: [2500.0, 4000.0, 10800.0], 21: [3600.0, 0.0, 9900.0], 22: [4300.0, 3800.0, 4600.0], 23: [3600.0, 400.0, 5200.0], 24: [3300.0, 3900.0, 3900.0], 25: [2700.0, 400.0, 4450.0], 26: [2000.0, 4000.0, 10300.0], 27: [2900.0, 0.0, 7870.0], 28: [650.0, 4000.0, 9000.0], 29: [1990.0, 0.0, 7420.0], 30: [5400.0, 3700.0, 5400.0], 31: [4385.0, 400.0, 6330.0], 32: [2500.0, 3800.0, 3500.0], 33: [1500.0, 400.0, 4300.0], 34: [2000.0, 4000.0, 10300.0], 35: [2900.0, 0.0, 9600.0], 36: [650.0, 4000.0, 9000.0], 37: [1400.0, 0.0, 8600.0], 38: [-5200.0, 3800.0, 3200.0], 39: [-3500.0, 0.0, 2700.0], 40: [-5650.0, 3500.0, -400.0], 41: [-4700.0, 0.0, -700.0], 42: [360.0, 3500.0, -600.0], 43: [-400.0, 700.0, -400.0], 44: [750.0, 4000.0, 1300.0], 45: [0.0, 550.0, 1500.0], 46: [-5650.0, 3500.0, 270.0], 47: [-3300.0, 0.0, -400.0], 48: [-5100.0, 3900.0, 4150.0], 49: [-4000.0, 0.0, 4000.0], 50: [90.0, 4000.0, -2680.0], 51: [-1360.0, 700.0, -2260.0], 52: [250.0, 3800.0, -1300.0], 53: [-800.0, 700.0, -1100.0], 54: [-6000.0, 3400.0, -5000.0], 55: [-4700.0, 0.0, -4700.0], 56: [-6700.0, 3100.0, -7300.0], 57: [-5200.0, 0.0, -8400.0], 58: [-800.0, 3600.0, -6400.0], 59: [-1830.0, 800.0, -6820.0], 60: [-6100.0, 3100.0, -6400.0], 61: [-6200.0, 0.0, -5800.0], 62: [-330.0, 3900.0, -8950.0], 63: [-1900.0, 1000.0, -9200.0], 64: [-6500.0, 3100.0, -7000.0], 65: [-6300.0, 0.0, -7900.0], 66: [-700.0, 3600.0, -5500.0], 67: [-1900.0, 700.0, -5000.0], 68: [-700.0, 3600.0, -7800.0], 69: [-2200.0, 1000.0, -8200.0], 70: [-7800.0, 3500.0, -12750.0], 71: [-6900.0, 1000.0, -12200.0], 72: [-2000.0, 3500.0, -14500.0], 73: [-3600.0, 1000.0, -13900.0], 74: [-1400.0, 3500.0, -13500.0], 75: [-2600.0, 1000.0, -12800.0], 76: [-8000.0, 3500.0, -12000.0], 77: [-7200.0, 0.0, -11100.0], 78: [-2900.0, 3500.0, -15100.0], 79: [-5250.0, 1000.0, -13275.0], 80: [-7900.0, 3500.0, -13000.0], 81: [-6500.0, 1000.0, -13000.0], 82: [-3400.0, 4000.0, 5400.0], 83: [-2330.0, 1700.0, 5200.0], 84: [-4100.0, 4000.0, 3500.0], 85: [-2500.0, 1700.0, 3800.0], 86: [-3400.0, 4000.0, -3550.0], 87: [-2750.0, 1700.0, -3150.0], 88: [-2400.0, 4000.0, -5400.0], 89: [-1850.0, 1700.0, -5100.0], 90: [-1450.0, 4000.0, -6500.0], 91: [-920.0, 1700.0, -5400.0], 92: [1400.0, 4000.0, -8000.0], 93: [200.0, 1700.0, -5750.0], 94: [1900.0, 4000.0, -5600.0], 95: [980.0, 1700.0, -5400.0], 96: [1900.0, 4000.0, -4800.0], 97: [1200.0, 0.0, -4000.0], 98: [6600.0, 3500.0, 6600.0], 99: [6180.0, 400.0, 7540.0], 100: [7700.0, 3800.0, 6900.0], 101: [7350.0, 400.0, 7823.0], 102: [6000.0, 3500.0, 6100.0], 103: [5560.0, 400.0, 6575.0], 104: [5600.0, 3500.0, 5700.0], 105: [5200.0, 400.0, 6700.0], 106: [8000.0, 3800.0, 7200.0], 107: [7975.0, 400.0, 8330.0], 108: [7200.0, 3700.0, 6600.0], 109: [6770.0, 400.0, 7355.0], 110: [5000.0, 3600.0, 5100.0], 111: [4920.0, 400.0, 5350.0], 112: [2500.0, 3600.0, 10300.0], 113: [2800.0, 0.0, 9000.0], 114: [3500.0, 3600.0, 10900.0], 115: [3700.0, 0.0, 9800.0], 116: [4700.0, 3500.0, 11100.0], 117: [4500.0, 0.0, 10400.0], 118: [5200.0, 3500.0, 11700.0], 119: [5600.0, 0.0, 11000.0], 120: [1242.0, 4500.0, 2390.0], 121: [108.0, 400.0, 3487.0], 122: [1862.0, 4500.0, 3020.0], 123: [1058.0, 400.0, 3820.0], 124: [1045.0, 4500.0, 2038.0], 125: [-430.0, 600.0, 1460.0], 126: [2570.0, 4500.0, 3385.0], 127: [1996.0, 400.0, 4350.0], 128: [724.0, 4500.0, 1927.0], 129: [-565.0, 400.0, 2600.0], 130: [2140.0, 4500.0, 3087.0], 131: [980.0, 400.0, 4370.0], 132: [1050.0, 4500.0, 2450.0], 133: [-572.0, 400.0, 3080.0], 134: [-4400.0, 3800.0, 5200.0], 135: [-3300.0, 0.0, 4700.0], 136: [-3300.0, 3800.0, 6300.0], 137: [-2600.0, 0.0, 5400.0], 138: [-1900.0, 3800.0, 7000.0], 139: [-1400.0, 0.0, 6600.0], 140: [-700.0, 3800.0, 7600.0], 141: [600.0, 0.0, 7100.0], 142: [183.0, 4500.0, -4095.0], 143: [-1634.0, 700.0, -3555.0], 144: [150.0, 4500.0, -2698.0], 145: [-1260.0, 700.0, -2560.0], 146: [-80.0, 4500.0, -4690.0], 147: [-1325.0, 700.0, -4505.0], 148: [-100.0, 4500.0, -5000.0], 149: [-2215.0, 700.0, -5110.0], 150: [400.0, 4500.0, -1900.0], 151: [-1090.0, 700.0, -1605.0], 152: [-138.0, 4500.0, -4470.0], 153: [-2465.0, 0.0, -4240.0], 154: [100.0, 4500.0, -3400.0], 155: [-1305.0, 700.0, -3070.0], 156: [-6000.0, 3500.0, -4600.0], 157: [-5200.0, 0.0, -4800.0], 158: [-5800.0, 3400.0, -4000.0], 159: [-5100.0, 0.0, -3900.0], 160: [-5700.0, 3300.0, -3500.0], 161: [-5400.0, 0.0, -3200.0], 162: [-5600.0, 3300.0, -1400.0], 163: [-4900.0, 0.0, -1500.0] };
const TUNE012F = { 6: 0.0, 7: 0.0, 8: 0.0, 9: 20.0, 10: 50.0, 11: 80.0, 12: 110.0, 13: 140.0, 14: 160.0, 15: 190.0, 16: 230.0 };
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
  // (entry 1: L2 M1 -- no EMC op 0xa3 and no class store names it: not listed)
  // (entry 3: L2 M3 -- no EMC op 0xa3 and no class store names it: not listed)
  // (entry 22: L2 M1 -- no EMC op 0xa3 and no class store names it: not listed)
  act012(7, 0x00, '2', 'Motion[1]', 25, [{ frame: 720.0, s01: [20, 15, 6] }, { frame: 720.0, s13: [70, 71, 9] }, { frame: 720.0, s13: [72, 73, 10] }, { frame: 720.0, s13: [74, 75, 11] }, { frame: 720.0, s13: [76, 77, 12] }, { frame: 720.0, s13: [80, 81, 13] }]),
  act012(7, 0x00, '2', 'Motion[1]', 26, [{ frame: 720.0, s01: [20, 15, 6] }, { frame: 720.0, s13: [72, 73, 9] }, { frame: 720.0, s13: [74, 75, 10] }, { frame: 720.0, s13: [76, 77, 11] }, { frame: 720.0, s13: [78, 79, 12] }, { frame: 720.0, s13: [80, 81, 13] }]),
  act012(7, 0x02, '2', 'Motion[3]', 27, [{ frame: 150.0, s01: [31, 17, 8] }, { frame: 150.0, s13: [86, 87, 9] }, { frame: 150.0, s13: [92, 93, 10] }, { frame: 150.0, s13: [94, 95, 11] }]),
  act012(7, 0x02, '2', 'Motion[3]', 28, [{ frame: 150.0, s01: [31, 17, 8] }, { frame: 150.0, s13: [88, 89, 9] }, { frame: 150.0, s13: [96, 97, 10] }, { frame: 150.0, s13: [90, 91, 11] }]),
  act012(7, 0x03, '2', 'Motion[4]', 29, [{ frame: 600.0, s13: [18, 19, 9] }, { frame: 600.0, s13: [20, 21, 10] }, { frame: 600.0, s13: [22, 23, 11] }, { frame: 600.0, s13: [24, 25, 12] }, { frame: 600.0, s13: [26, 27, 13] }, { frame: 600.0, s13: [28, 29, 14] }]),
  act012(7, 0x03, '2', 'Motion[4]', 30, [{ frame: 600.0, s13: [22, 23, 9] }, { frame: 600.0, s13: [24, 25, 10] }, { frame: 600.0, s13: [18, 19, 11] }, { frame: 600.0, s13: [20, 21, 12] }, { frame: 600.0, s13: [30, 31, 13] }, { frame: 600.0, s13: [32, 33, 14] }]),
  act012(7, 0x03, '2', 'Motion[4]', 31, [{ frame: 600.0, s13: [38, 39, 9] }, { frame: 600.0, s13: [40, 41, 10] }, { frame: 600.0, s13: [42, 43, 11] }, { frame: 600.0, s13: [44, 45, 12] }, { frame: 600.0, s13: [46, 47, 13] }, { frame: 600.0, s13: [48, 49, 14] }]),
  act012(7, 0x03, '2', 'Motion[4]', 32, [{ frame: 600.0, s13: [46, 47, 9] }, { frame: 600.0, s13: [48, 49, 10] }, { frame: 600.0, s13: [38, 39, 11] }, { frame: 600.0, s13: [40, 41, 12] }, { frame: 600.0, s13: [50, 51, 13] }, { frame: 600.0, s13: [52, 53, 14] }]),
  act012(7, 0x03, '2', 'Motion[4]', 33, [{ frame: 600.0, s13: [54, 55, 9] }, { frame: 600.0, s13: [56, 57, 10] }, { frame: 600.0, s13: [58, 59, 11] }, { frame: 600.0, s13: [62, 63, 12] }, { frame: 600.0, s13: [60, 61, 13] }, { frame: 600.0, s13: [64, 65, 14] }]),
  act012(7, 0x03, '2', 'Motion[4]', 34, [{ frame: 600.0, s13: [54, 55, 9] }, { frame: 600.0, s13: [56, 57, 10] }, { frame: 600.0, s13: [66, 67, 11] }, { frame: 600.0, s13: [68, 69, 12] }, { frame: 600.0, s13: [60, 61, 13] }, { frame: 600.0, s13: [64, 65, 14] }]),
  act012(7, 0x03, '2', 'Motion[4]', 35, [{ frame: 600.0, s13: [82, 83, 9] }, { frame: 600.0, s13: [84, 85, 10] }]),
  act012(7, 0x03, '2', 'Motion[4]', 36, [{ frame: 600.0, s13: [82, 83, 9] }, { frame: 600.0, s13: [84, 85, 10] }]),
  act012(7, 0x04, '2', 'Motion[5]', 37, [{ frame: 600.0, s13: [98, 99, 9] }, { frame: 600.0, s13: [102, 103, 10] }, { frame: 600.0, s13: [104, 105, 11] }, { frame: 600.0, s13: [106, 107, 12] }, { frame: 600.0, s13: [108, 109, 13] }, { frame: 600.0, s13: [100, 101, 14] }]),
  act012(7, 0x04, '2', 'Motion[5]', 38, [{ frame: 600.0, s13: [98, 99, 9] }, { frame: 600.0, s13: [102, 103, 10] }, { frame: 600.0, s13: [104, 105, 11] }, { frame: 600.0, s13: [106, 107, 12] }, { frame: 600.0, s13: [110, 111, 13] }, { frame: 600.0, s13: [100, 101, 14] }]),
  // (entry 39: L2 M5 -- no EMC op 0xa3 and no class store names it: not listed)
  // (entry 40: L2 M5 -- no EMC op 0xa3 and no class store names it: not listed)
  // (entry 41: L2 M5 -- no EMC op 0xa3 and no class store names it: not listed)
  // (entry 42: L2 M5 -- no EMC op 0xa3 and no class store names it: not listed)
  act012(7, 0x05, '2', 'Motion[9]', 43, [{ frame: 720.0, s13: [70, 71, 9] }, { frame: 720.0, s13: [72, 73, 10] }, { frame: 720.0, s13: [74, 75, 11] }, { frame: 720.0, s13: [76, 77, 12] }]),
  act012(7, 0x05, '2', 'Motion[9]', 44, [{ frame: 720.0, s13: [72, 73, 9] }, { frame: 720.0, s13: [74, 75, 10] }, { frame: 720.0, s13: [76, 77, 11] }, { frame: 720.0, s13: [78, 79, 12] }]),
  act012(7, 0x05, '2', 'Motion[9]', 45, [{ frame: 660.0, s13: [86, 87, 9] }, { frame: 660.0, s13: [92, 93, 10] }, { frame: 660.0, s13: [94, 95, 11] }]),
  act012(7, 0x05, '2', 'Motion[9]', 46, [{ frame: 660.0, s13: [88, 89, 9] }, { frame: 660.0, s13: [96, 97, 10] }, { frame: 660.0, s13: [90, 91, 11] }]),
  act012(7, 0x00, '2', 'Motion[1]', 47, [{ frame: 720.0, s01: [30, 16, 7] }, { frame: 720.0, s13: [86, 87, 9] }, { frame: 720.0, s13: [92, 93, 10] }, { frame: 720.0, s13: [94, 95, 11] }, { frame: 720.0, s13: [88, 89, 12] }]),
  act012(7, 0x00, '2', 'Motion[1]', 48, [{ frame: 720.0, s01: [30, 16, 7] }, { frame: 720.0, s13: [88, 89, 9] }, { frame: 720.0, s13: [96, 97, 10] }, { frame: 720.0, s13: [90, 91, 11] }, { frame: 720.0, s13: [86, 87, 12] }]),
  act012(1, 0x04, '0', 'Motion[36]', 50, [{ frame: 200.0, s13: [98, 99, 9] }, { frame: 200.0, s13: [102, 103, 10] }, { frame: 200.0, s13: [104, 105, 11] }, { frame: 200.0, s13: [106, 107, 12] }, { frame: 200.0, s13: [112, 113, 13] }, { frame: 200.0, s13: [114, 115, 14] }, { frame: 200.0, s13: [116, 117, 15] }, { frame: 200.0, s13: [118, 119, 16] }]),
  act012(1, 0x04, '0', 'Motion[36]', 51, [{ frame: 200.0, s13: [22, 23, 9] }, { frame: 200.0, s13: [24, 25, 10] }, { frame: 200.0, s13: [30, 31, 11] }, { frame: 200.0, s13: [32, 33, 12] }, { frame: 200.0, s13: [18, 19, 13] }, { frame: 200.0, s13: [20, 21, 14] }, { frame: 200.0, s13: [34, 35, 15] }, { frame: 200.0, s13: [36, 37, 16] }]),
  act012(1, 0x04, '0', 'Motion[36]', 52, [{ frame: 200.0, s13: [120, 121, 9] }, { frame: 200.0, s13: [122, 123, 10] }, { frame: 200.0, s13: [124, 125, 11] }, { frame: 200.0, s13: [126, 127, 12] }, { frame: 200.0, s13: [134, 135, 13] }, { frame: 200.0, s13: [136, 137, 14] }, { frame: 200.0, s13: [138, 139, 15] }, { frame: 200.0, s13: [140, 141, 16] }]),
  act012(1, 0x04, '0', 'Motion[36]', 53, [{ frame: 200.0, s13: [42, 43, 9] }, { frame: 200.0, s13: [44, 45, 10] }, { frame: 200.0, s13: [50, 51, 11] }, { frame: 200.0, s13: [52, 53, 12] }, { frame: 200.0, s13: [38, 39, 13] }, { frame: 200.0, s13: [40, 41, 14] }, { frame: 200.0, s13: [46, 47, 15] }, { frame: 200.0, s13: [48, 49, 16] }]),
  act012(1, 0x04, '0', 'Motion[36]', 54, [{ frame: 200.0, s13: [142, 143, 9] }, { frame: 200.0, s13: [144, 145, 10] }, { frame: 200.0, s13: [146, 147, 11] }, { frame: 200.0, s13: [148, 149, 12] }, { frame: 200.0, s13: [156, 157, 13] }, { frame: 200.0, s13: [158, 159, 14] }, { frame: 200.0, s13: [160, 161, 15] }, { frame: 200.0, s13: [162, 163, 16] }]),
  act012(1, 0x04, '0', 'Motion[36]', 55, [{ frame: 200.0, s13: [58, 59, 9] }, { frame: 200.0, s13: [62, 63, 10] }, { frame: 200.0, s13: [66, 67, 11] }, { frame: 200.0, s13: [68, 69, 12] }, { frame: 200.0, s13: [60, 61, 13] }, { frame: 200.0, s13: [54, 55, 14] }, { frame: 200.0, s13: [56, 57, 15] }, { frame: 200.0, s13: [64, 65, 16] }]),
  act012(1, 0x01, '0', 'Motion[6]', 56, [{ frame: 240.0, s13: [70, 71, 9] }, { frame: 240.0, s13: [72, 73, 10] }, { frame: 240.0, s13: [74, 75, 11] }, { frame: 240.0, s13: [76, 77, 12] }, { frame: 240.0, s13: [78, 79, 13] }, { frame: 240.0, s13: [80, 81, 15] }]),
  act012(1, 0x01, '0', 'Motion[6]', 57, [{ frame: 240.0, s13: [86, 87, 9] }, { frame: 240.0, s13: [88, 89, 10] }, { frame: 240.0, s13: [90, 91, 11] }, { frame: 240.0, s13: [92, 93, 12] }, { frame: 240.0, s13: [94, 95, 13] }, { frame: 240.0, s13: [96, 97, 14] }]),
  ]
};
