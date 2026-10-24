
// ---- LAGIACRUS (em046_00): uEm046_00 (band 0xe9f1d8..0xeab974, action main 0xea8ad0) ---------------------------------------------
// READ 2026-10-18 (dev/leviathan-shells-spec.md 1). Ids immediates (the table 0xe9f3d4..): 0xe6 uShellEm046_sp_00 (base00), 0xe7 sp_01
// (base01), 0xe8 sp_11 (base11), 0xe9 sp_25 (base25), 0xea sp_26 (base26); folders by the path table (res 0x8a39..0x8a3d). His shells
// (census scratchpad fb/cen10_em046.txt, every frame test answered alone; the owner's makers read: base00 setups from the zero
// vector, base01's from his own point +0x40 and words +0xfe8):
//   the thunderballs, sp_00: L4 M6 (7, 0x36 / 0x56) f98 mode 10, (7, 0x41 / 0x50 / 0x57 / 0x58) mode 7; L4 M15 (7, 0x48 / 0x49) f16 1;
//     L4 M30 (7, 0x72 / 0x75 / 0x77) f96 7, (7, 0x73 / 0x79) 5; L4 M32 (7, 0x74 / 0x7a) 2, (7, 0x76 / 0x78 / 0x7c) 6; L4 M31 (7, 0x7d /
//     0x7f) f60 4, (7, 0x81) 9; L4 M33 (7, 0x7e / 0x80) 3, (7, 0x82) 8; L2 M37 (7, 0x83) f14 0; L2 M36 (7, 0x8e) f90 0;
//   the discharges, sp_01: L4 M2 (7, 0x6e) f200 26, f260 3..6, f320 22..25; L4 M10 (7, 0x6f / 0x70) f160 0 / 1; L4 M36 (7, 0x9a / 0x9b)
//     f36 20 / 21; and the children (sp_00's landing, sp_01's end -> sp_11, sp_11's +0x168, sp_25's +0x154).
// sp_00's reader 0xeaa5b4 (READ whole): ef 0..3; hit 0; int 0 the joint +0x15dc; +0x15e8: 1 int 3 (the X aim), 2 int 4 (the Y aim),
// 4 int 5 (the aim from the shell's point), | 0x40 always; floats 0 degX +0x15ec, 1 degY +0x15f0, 2 vz +0x15f4, 3 flight +0x15fc, 4 / 5
// the X clamp, 6 / 7 the Y clamp; &vec 0 the offset +0x1610, &vec 1 the aim offset +0x1618; vy and the gravity the ctor's (0 and the
// zero vector); then the owner's words +0xfe8.. -> +0x1660.. (its landing's child's words) and mode 10 -> byte +0x15c1 = 1 (0x43ac8c:
// a hunter hit's stage query -- no hunter in the viewer). Ints 1 / 2: its landing's (below)
function params046s00(def, mode, idx, got){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(3) !== -1 ? 1 : 0) | (I(4) !== -1 ? 2 : 0) | (I(5) !== -1 ? 4 : 0) | 0x40;
  return { joint: I(0), flags, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(2), vy: f(0), flight: F(3), xLo: F(4), xHi: F(5),
           yLo: F(6), yHi: F(7), vec: V(0), from: ZERO3.slice(), aimOff: V(1), gravity: ZERO3.slice(), child: [I(2), I(1)],
           words: got ? [got.ownerX >>> 0, got.ownerY >>> 0, (got.ownerZ || 0) >>> 0] : [0, 0, 0] };
}
// sp_00's landing 0xeaa820 (READ whole; state 1 only): type 0 -> ef 1, type 1 -> ef 2, each after 0xeaa8cc's child; type 2 -> ef 3 --
// except mode 10, which keeps flying (no start, no end: 0xeaa8c0); then 0x3f8970 at the contact and the end (vt+0x148 0). 0xeaa8cc
// (owner active): type 0 -> sp_01 of int 2 (none below 0), type 1 -> of int 1 when 8..14 (else none), 14 while tired (0x81614); at the
// contact, the zero vector at +0x20, the words +0x1660.. at +0x30
function landing046s00(S, D, hit, ctx){
  if (S.state !== 1) return 'keep';
  if (hit.type === 2 && S.modeIndex === 10) return 'keep';
  if (hit.type <= 1 && ctx && ctx.create){
    let m = S.k.child[hit.type];
    if (hit.type === 1) m = (m - 8) >>> 0 > 6 ? -1 : (ctx.tired ? 14 : m);
    if (m >= 0) ctx.create(S, 'shell01', { mode: m, position: hit.point.slice(), angles: S.k.words.slice() });
  }
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// sp_01's reader 0xeaab48 (READ whole): ef 0 -> +0x15c8; hit 0; +0x15ec: 4 int 0 (the ground snap), 8 int 1 (laid on the ground),
// 0x800 int 2 (the unit's size x the owner's, 0x3fa56c), 0x1000 when int 3 == 0 (the hit side's); int 3 -> +0x1610 (-> +0x15bc at the
// init's end: the hit side); &vec 0 -> +0x160c (the words' degree offsets), &vec 1 -> +0x1608 (the offset). No timer (+0x15f0 the
// ctor's 0: each lives while its hit slot is on)
function params046s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 0x800 : 0) | (I(3) === 0 ? 0x1000 : 0);
  return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(1), deg: V(0), up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm046_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
// sp_01's +0x154 0xeaac6c (READ whole), in base01's end (owner active): modes 8..12 -> sp_11 1, mode 13 -> sp_11 2, at its point with
// its words (+0x30..; the zero vector at +0x20)
function endCreate046(S, ctx, events){
  const m = S.modeIndex >= 8 && S.modeIndex <= 12 ? 1 : S.modeIndex === 13 ? 2 : -1;
  if (m < 0 || !ctx || !ctx.create) return;
  ctx.create(S, 'shell11', { mode: m, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) }, events);
}
// sp_11's reader 0xeaaf38 (READ whole): the count +0x1658 = int 0 (the table grown to it), the times +0x1654[k] = float k; nothing else
// (base11's ctor: flags 0, the joint -1, timer 0)
function params046s11(def, mode){
  const sh = mode.sh, n = sh.ints.length && sh.ints[0] >= 1 ? sh.ints[0] : 0, table = [];
  for (let k = 0; k < n; k++) table.push(k < sh.floats.length ? f(sh.floats[k]) : f(0));
  return { flags: 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0), table };
}
// sp_11's +0x168 0xeab080(shell, k) (READ whole; owner active): vec k turned by its Y word (x cos + z sin, y, z cos - x sin) plus its
// point; mode 1 -> sp_01 2, mode 2 -> sp_01 k < 3 ? 15 : 16, mode 0 nothing; its words at +0x30, the zero vector at +0x20
function create046s11(S, idx, ctx){
  const m = S.modeIndex === 1 ? 2 : S.modeIndex === 2 ? (idx < 3 ? 15 : 16) : -1;
  if (m < 0) return;
  const sh = S.mode.sh, v = idx < sh.vecs.length ? sh.vecs[idx].map(f) : [0, 0, 0];
  const r = f(u16(S.angles[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), P = S.position;
  ctx.create(S, 'shell01', { mode: m, angles: S.angles.map(w => w >>> 0),
                             position: [f(P[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])] });
}
SHELL_DATA.em046_00 = {
  name: 'Lagiacrus',
  lists: { 0: { list: 'u', pel: 'em046_00u' } },
  shells: {
    // shell00: the thunderballs (u 0 flying; u 4 / 1 / 4 at a contact; mode 10 the big one, u 10 / 11)
    shell00: { id: 0xe6, cls: 'uShellEm046_sp_00', base: 'base00', reader: 0xeaa5b4, folder: 'shell@em@em046_00_shell00',
      modes: {
@00@
      }, hitdata: [[0, 250], [0, 250], [0, 250]] },
    // shell01: the discharges (each lives while its hit slot is on)
    shell01: { id: 0xe7, cls: 'uShellEm046_sp_01', base: 'base01', reader: 0xeaab48, folder: 'shell@em@em046_00_shell01',
      modes: {
@01@
      }, hitdata: [[0, 46], [0, 180], [0, 30], [0, 30], [0, 60], [0, 12], [0, 30], [0, 30], [0, 20], [0, 60], [0, 120], [0, 20], [0, 20], [0, 30]] },
    // shell11: the discharge lines (base11: sp_01 2 / 15 / 16 at its times)
    shell11: { id: 0xe8, cls: 'uShellEm046_sp_11', base: 'base11', reader: 0xeaaf38, folder: 'shell@em@em046_00_shell11',
      modes: {
@11@
      } },
  },
  actions: null,
};
const BALL046 = (frame, mode) => [{ frame, shell: 'shell00', mode, aimed: [0, 1, 6, 7, 8, 9, 10].includes(mode) }];
const ZAP046 = (frame, modes) => modes.map(mode => ({ frame, shell: 'shell01', mode }));
SHELL_DATA.em046_00.actions = [
  actPlain(7, 0x36, '4', 'Motion[6]', BALL046(98, 10), { also: [[7, 0x56]] }),
  actPlain(7, 0x41, '4', 'Motion[6]', BALL046(98, 7), { also: [[7, 0x50], [7, 0x57], [7, 0x58]] }),
  actPlain(7, 0x48, '4', 'Motion[15]', BALL046(16, 1), { also: [[7, 0x49]] }),
  actPlain(7, 0x72, '4', 'Motion[30]', BALL046(96, 7), { also: [[7, 0x75], [7, 0x77]] }),
  actPlain(7, 0x73, '4', 'Motion[30]', BALL046(96, 5), { also: [[7, 0x79]] }),
  actPlain(7, 0x74, '4', 'Motion[32]', BALL046(96, 2), { also: [[7, 0x7a]] }),
  actPlain(7, 0x76, '4', 'Motion[32]', BALL046(96, 6), { also: [[7, 0x78], [7, 0x7c]] }),
  actPlain(7, 0x7d, '4', 'Motion[31]', BALL046(60, 4), { also: [[7, 0x7f]] }),
  actPlain(7, 0x81, '4', 'Motion[31]', BALL046(60, 9)),
  actPlain(7, 0x7e, '4', 'Motion[33]', BALL046(60, 3), { also: [[7, 0x80]] }),
  actPlain(7, 0x82, '4', 'Motion[33]', BALL046(60, 8)),
  actPlain(7, 0x83, '2', 'Motion[37]', BALL046(14, 0)),
  actPlain(7, 0x8e, '2', 'Motion[36]', BALL046(90, 0)),
  actPlain(7, 0x6e, '4', 'Motion[2]', [...ZAP046(200, [26]), ...ZAP046(260, [3, 4, 5, 6]), ...ZAP046(320, [22, 23, 24, 25])]),
  actPlain(7, 0x6f, '4', 'Motion[10]', ZAP046(160, [0])),
  actPlain(7, 0x70, '4', 'Motion[10]', ZAP046(160, [1])),
  actPlain(7, 0x9a, '4', 'Motion[36]', ZAP046(36, [20])),
  actPlain(7, 0x9b, '4', 'Motion[36]', ZAP046(36, [21])),
];
