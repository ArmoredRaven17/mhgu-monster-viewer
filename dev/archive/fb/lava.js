
// ---- LAVASIOTH (em036_00): uEm036_00 (band 0xe3e934..0xe47170, action main 0xe3ebe0) ---------------------------------------------
// READ 2026-10-18 (dev/piscine-shells-spec.md). Ids immediates: 0xc6 uShellEm036_sp_00 (base00), 0xc7 uShellEm036_sp_01 (base01 + its
// reader 0xe469d8 and end hook +0x154 0xe46ac0); folders by the path table (res 0x8a19 / 0x8a1a). His maker 0xe3f610(e, mode): sp_00
// with the zero vector's point and words. The actions (census scratchpad fb/cen9_em036.txt; each helper read for its other frames):
//   L2 M6 (7, 1 / 2) f78 mode 0; L2 M10 (7, 3) f58 mode 0, (7, 0x11) f58 mode 1; L2 M13 (7, 6) f60 mode 13, f110 mode 12;
//   L4 M1 (7, 0x16 / 0x17 / 0x18) f130 / 184 / 238 modes 16 / 15 / 14, 19 / 18 / 17, 22 / 21 / 20 -- none while tired (0x81614);
//   (7, 0x12): L2 M11's leap, and when he comes down (block +0x44 <= the ground +0x5b4, falling) L2 M12 with his facing turned
//   0x8000 and sp_00 5 / 6 / 7 (0xe44078) -- the viewer makes them at L2 M12's start with the facing it shows (the turned one).
// sp_00's reader 0xe45e64 (READ whole): ef 0..3; hit 0; int 0 the joint +0x15dc; +0x15e8: 1 int 1, 2 int 2, 0x10 int 3 (the request's
// point), 4 int 4, 0x800 int 5 (the hit side), 0x20 int 6; floats 0 degX, 1 degY, 2 vz, 3 vy, 4 flight, 5 / 6 the X clamp, 7 / 8 the
// Y clamp; &vec 0 the offset +0x1610, &vec 1 the gravity +0x161c; the aims' own offsets the ctor's zero vector
function params036s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 0x10 : 0) | (I(4) !== -1 ? 4 : 0) |
                (I(5) !== -1 ? 0x800 : 0) | (I(6) !== -1 ? 0x20 : 0);
  return { joint: I(0), flags, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(2), vy: F(3), flight: F(4), xLo: F(5), xHi: F(6),
           yLo: F(7), yHi: F(8), vec: V(0), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: V(1) };
}
// sp_00's landing 0xe46118 (READ whole), in state 1: type 0 -> ef 1, type 2 -> ef 3; type 1 -> nothing at all while the shell still
// rises (velocity y +0x1014 > 0: it flies on), else ef 2 after the children 0xe461c4 (owner active; table 0xe46204 by mode): 0 -> sp_00
// 2 / 3 / 4 (0x3f883c: the contact, the zero vector's words) and sp_01 0; 1 -> sp_00 2 / 3 / 4 and sp_01 1; 5 -> sp_00 8 / 9; 14..22 ->
// sp_01 2 with the words (0, the shell's Y word, 0); then 0x3f8970 at the contact and the end
function landing036s00(S, D, hit, ctx){
  if (S.state !== 1) return 'keep';
  if (hit.type === 1){
    if (S.velocity[1] > 0) return 'keep';
    const m = S.modeIndex, P = hit.point;
    const kids00 = m === 0 || m === 1 ? [2, 3, 4] : m === 5 ? [8, 9] : [];
    for (const k of kids00){
      const own = Object.assign({}, ctx.own001, { requestPos: P.slice(), requestAngles: [0, 0, 0] });
      const S2 = make00n(ctx.shellState, D, k, ctx.J, own, ctx, S.action, null, 'shell00');
      S.events.push({ ev: 'create', stepped: true, shell: 'shell00', id: D.shells.shell00.id, mode: k, position: P.slice(), angles: [0, 0, 0], child: S2 ? S2.id : null, deleted: !S2 });
      if (S2){ S2.creator = S.id; S2.createdAtMove = S.moves; ctx.shellState.shells.push(S2); ctx.out.spawned.push(S2); }
    }
    if ((m === 0 || m === 1) && ctx.create) ctx.create(S, 'shell01', { mode: m, position: P.slice(), angles: [0, 0, 0] });
    if (m >= 14 && m <= 22 && ctx.create) ctx.create(S, 'shell01', { mode: 2, position: P.slice(), angles: [0, S.angles[1] >>> 0, 0] });
  }
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// sp_01's reader 0xe469d8 (READ whole): ef 0 -> +0x15c8 (one EffectParam); hits 1 / 0 / 2 -> +0x15d8 / +0x15dc / +0x15e0; float 0 the
// timer +0x15f0; +0x15ec: 4 int 0, 8 int 1; &vec 0 the offset +0x1608. Its +0x160 0xe46cf8 ends modes 0..2 when byte +0x151e is not
// 0xff (the hit side: no hunter in the viewer); +0x158 / +0x15c the hit registration
function params036s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0), joint: -1, timer: F(0), f1600: f(0.0), f15fc: f(1.0),
           vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm036_sp_01: a mode its files do not carry' : null };
}
// sp_01's +0x154 0xe46ac0 (READ whole), in base01's end: the lava pools 0 / 1 / 2 leave sp_01 3 / 4 / 5 (0x3fa2bc: the shell's point,
// its own words +0xfe8.., the zero vector at +0x20)
const END_MODES036 = new Map([[0, 3], [1, 4], [2, 5]]);
function endCreate036(S, ctx, events){
  if (!END_MODES036.has(S.modeIndex) || !ctx || !ctx.create) return;
  ctx.create(S, 'shell01', { mode: END_MODES036.get(S.modeIndex), position: S.position.slice(), angles: S.angles.map(w => w >>> 0) }, events);
}
SHELL_DATA.em036_00 = {
  name: 'Lavasioth',
  lists: { 0: { list: 'u', pel: 'em036_00u' } },
  shells: {
    // shell00: the lava balls (0 / 1 aimed, u 0; 2..4 their pieces, u 3; 5..9 the landing's splash, u 30; 12 / 13 L2 M13's; 14..22
    // L4 M1's, u 100) -- u 1 / 2 / 4 / 31..33 / 101 / 102 at a contact
    shell00: { id: 0xc6, cls: 'uShellEm036_sp_00', base: 'base00', reader: 0xe45e64, folder: 'shell\\em\\em036_00_shell00',
      modes: {
      0: m057(1.5, [[0, 0], [0, 2], [0, 1], [0, 2]], [0], [2, 0, -1, -1, 0, -1, -1], [2.0, 0.0, 40.0, 0.0, 200.0, -90.0, 90.0, -90.0, 90.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      1: m057(1.5, [[0, 0], [0, 2], [0, 1], [0, 2]], [0], [2, 0, -1, -1, 0, -1, -1], [7.0, 0.0, 40.0, 0.0, 200.0, -90.0, 90.0, -90.0, 90.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      2: m057(1.5, [[0, 3], [0, 4], [0, 4], [0, 4]], [2], [-1, -1, -1, 0, -1, -1, -1], [-20.0, 0.0, 25.0, 8.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, -0.5, 0.0]]),
      3: m057(1.5, [[0, 3], [0, 4], [0, 4], [0, 4]], [2], [-1, -1, -1, 0, -1, -1, -1], [-20.0, -70.0, 25.0, 5.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, -0.5, 0.0]]),
      4: m057(1.5, [[0, 3], [0, 4], [0, 4], [0, 4]], [2], [-1, -1, -1, 0, -1, -1, -1], [-20.0, 70.0, 25.0, 5.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, -0.5, 0.0]]),
      5: m057(4.0, [[0, 30], [0, 32], [0, 33], [0, 32]], [1], [-1, 0, 0, -1, -1, -1, -1], [45.0, 0.0, 25.0, 45.0, 120.0, 0.0, 0.0, -180.0, 180.0], [[0.0, 0.0, 0.0], [0.0, -1.0, 0.0]]),
      6: m057(4.0, [[0, 30], [0, 32], [0, 33], [0, 32]], [1], [-1, 0, 0, -1, -1, -1, -1], [-15.0, -15.0, 35.0, 37.0, 120.0, 0.0, 0.0, -180.0, 180.0], [[0.0, 0.0, 0.0], [0.0, -1.0, 0.0]]),
      7: m057(4.0, [[0, 30], [0, 32], [0, 33], [0, 32]], [1], [-1, 0, 0, -1, -1, -1, -1], [-15.0, 15.0, 35.0, 37.0, 120.0, 0.0, 0.0, -180.0, 180.0], [[0.0, 0.0, 0.0], [0.0, -1.0, 0.0]]),
      8: m057(1.0, [[0, 30], [0, 32], [0, 31], [0, 32]], [1], [-1, 0, 0, 0, -1, -1, -1], [0.0, 10.0, 25.0, 25.0, 120.0, 0.0, 0.0, -180.0, 180.0], [[0.0, 0.0, 0.0], [0.0, -1.2000000476837158, 0.0]]),
      9: m057(1.0, [[0, 30], [0, 32], [0, 31], [0, 32]], [1], [-1, 0, 0, 0, -1, -1, -1], [0.0, -15.0, 20.0, 25.0, 120.0, 0.0, 0.0, -180.0, 180.0], [[0.0, 0.0, 0.0], [0.0, -1.2000000476837158, 0.0]]),
      12: m057(4.0, [[0, 30], [0, 32], [0, 33], [0, 32]], [2], [144, -1, -1, -1, -1, 0, -1], [0.0, 90.0, 40.0, 20.0, 120.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, -1.0, 0.0]]),
      13: m057(4.0, [[0, 30], [0, 32], [0, 33], [0, 32]], [2], [144, -1, -1, -1, -1, 0, -1], [0.0, -120.0, 40.0, 15.0, 120.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, -1.0, 0.0]]),
      14: m057(1.5, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [23.0, 5.0, 45.0, 0.0, 200.0, -90.0, 90.0, -90.0, 90.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      15: m057(1.5, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [20.0, 0.0, 45.0, 0.0, 200.0, -90.0, 90.0, -90.0, 90.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      16: m057(1.5, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [30.0, -5.0, 45.0, 0.0, 200.0, -90.0, 90.0, -90.0, 90.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      17: m057(1.0, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [10.0, 30.0, 45.0, 0.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      18: m057(1.0, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [10.0, 0.0, 45.0, 0.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      19: m057(1.0, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [10.0, -30.0, 45.0, 0.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      20: m057(1.0, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [5.0, 30.0, 45.0, 0.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      21: m057(1.0, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [5.0, 0.0, 45.0, 0.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      22: m057(1.0, [[0, 100], [0, 102], [0, 101], [0, 102]], [0], [2, -1, -1, -1, 0, -1, -1], [5.0, -30.0, 45.0, 0.0, 200.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      }, hitdata: [[0, 999], [0, 999], [0, 999], [0, 999]] },
    // shell01: the lava pools (0..2: u 90, 1200 frames) and what they leave (3..5: u 91)
    shell01: { id: 0xc7, cls: 'uShellEm036_sp_01', base: 'base01', reader: 0xe469d8, folder: 'shell\\em\\em036_00_shell01',
      modes: {
      0: m057(1.5, [[0, 90]], [2, 2, 0], [-1, -1], [1200.0], [[0.0, 0.0, 0.0]]),
      1: m057(1.5, [[0, 90]], [2, 2, 0], [-1, -1], [1200.0], [[0.0, 0.0, 0.0]]),
      2: m057(1.0, [[0, 90]], [2, 2, 0], [-1, -1], [1200.0], [[0.0, 0.0, 0.0]]),
      3: m057(1.2999999523162842, [[0, 91]], [0, 1, -1], [-1, -1], [10.0], [[0.0, 0.0, 0.0]]),
      4: m057(1.2999999523162842, [[0, 91]], [0, 1, -1], [-1, -1], [10.0], [[0.0, 0.0, 0.0]]),
      5: m057(1.0, [[0, 91]], [3, 4, -1], [-1, -1], [10.0], [[0.0, 0.0, 0.0]]),
      }, hitdata: [[0, 10], [0, 10], [0, 2], [0, 10], [0, 10]] },
  },
  actions: null,
};
const LAVA036 = (frames, modes, x = {}) => frames.map((frame, i) => Object.assign({ frame, shell: 'shell00', mode: modes[i], aimed: true }, x));
SHELL_DATA.em036_00.actions = [
  actPlain(7, 0x01, '2', 'Motion[6]', LAVA036([78], [0]), { also: [[7, 0x02]] }),
  actPlain(7, 0x03, '2', 'Motion[10]', LAVA036([58], [0])),
  actPlain(7, 0x11, '2', 'Motion[10]', LAVA036([58], [1])),
  actPlain(7, 0x06, '2', 'Motion[13]', LAVA036([60, 110], [13, 12])),
  actPlain(7, 0x16, '4', 'Motion[1]', LAVA036([130, 184, 238], [16, 15, 14], { untired: true })),
  actPlain(7, 0x17, '4', 'Motion[1]', LAVA036([130, 184, 238], [19, 18, 17], { untired: true })),
  actPlain(7, 0x18, '4', 'Motion[1]', LAVA036([130, 184, 238], [22, 21, 20], { untired: true })),
  actPlain(7, 0x12, '2', 'Motion[12]', [5, 6, 7].map(mode => ({ at: 'start', shell: 'shell00', mode, ownerPoint: true }))),
];
