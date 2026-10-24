// ---- THE CARAPACEONS: Daimyo / Stonefist Hermitaur (em019_00 / 04), Shogun / Rustrazor Ceanataur (em020_00 / 04) -- the shells beside
// their beams (render/beam-spawns.js, sp_02) -- READ 2026-10-18 (dev/carapaceon-shells-spec.md). uEm019_00's vt+0x158 0xdc09d4: e+0xcac8
// sp_01 (0x99, variant 4 0x9b), +0xcacc sp_02 (0x9a / 0x9c), +0xcad0 0x19d (no shell-table row: variant 0 makes no sp_00) / 0x9d (variant
// 4's sp_00, every mode (999, -1)); uEm020_00's 0xdc3e8c: e+0xcad8 sp_02 0x9e / 0xa0 and, variant 4, 0x9f registered. The censuses
// (cengen11, all 16 statuses, both variants each; the id fields poked distinct: scratchpad fb/cen019ids.txt) leave ONE drawing sp_01 a
// monster:
//   Daimyo / Stonefist (7, 0xf2): L9 M11 -> M12 (its end) -> landed -> L9 M13; phase 3 at f16 (0xb0968 mode 1, once: P+0x1a3), the maker
//     0xdb5ebc(e, 0, P+0xb0a): sp_01 [e+0xcac8] mode 0 (0x3fa2bc(0x40): +0x10 the block point P+0x40, +0x30.. the block's words P+0x50..,
//     +0x3c 0xffff -- variant 4 the halfword --, +0x20 a GOT vector) -- ef 0 (0, 30) of its .shl's own list em019_00c, both arcs;
//   Rustrazor (7, 0xa / 0xb / 0xc / 0x17..0x19 / 0x30 / 0x47..0x4d): L2 M19 -> L9 M34 (frame) -> L9 M35 (end) -> landed: L9 M36 set AND
//     sp_01 0x9f mode 0 on that update -- ef 0 (1, 31): list 1 of its .shl, em020_00c (fb/phq.py).
//   NOT BUILT, by name: every other sp_01 mode the censuses make (Daimyo's / Stonefist's 4..22 on L2 M7 / M8 / M1 / M2, L9 M14, L0 M21, L9
//   M10, L2 M11; Rustrazor's (7, 0xdb) L9 M25 mode 1) and Stonefist's sp_00 -- each (999, -1): hit volumes that draw nothing.
// sp_01's reader 0xdcd998 (uShellEm019_sp_01, READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15d8; +0x15ec (bfc / orrne over the ctor's 0): 4
// int 0, 8 int 1, 0x1000 int 2; float 0 the timer +0x15f0; &vec 0 -> +0x1608. Mode 0: 0x1000 (the hit side's), timer 0, vec zero
function params019s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 0x1000 : 0);
  return { flags, joint: -1, timer: f(sh && sh.floats.length ? sh.floats[0] : 0), f1600: f(0.0), f15fc: f(1.0), vec: V(0),
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm019_sp_01: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
// Rustrazor's sp_01 reader 0xdcde78 (uShellEm020_04_01, READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15d8; +0x15ec bit 0 = int 0 != -1 (the
// joint arm); int 1 -> the joint +0x15e4. No vec (+0x1608 the ctor's zero vector), no timer (0). Mode 0: joint -1 -> init011's 0x3fa8e4
// arm, the owner's block point
function params020s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  return { flags: I(0) !== -1 ? 1 : 0, joint: I(1), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm020_04_01: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xdcd998] = sh => params019s01(sh);
READERS01[0xdcde78] = sh => params020s01(sh);
for (const [mon, id] of [['em019_00', 0x99], ['em019_04', 0x9b]]){
  const D = SHELL_DATA[mon];
  delete D.beamsOnly;
  D.shells.shell01 = { id, cls: 'uShellEm019_sp_01', base: 'base01', reader: 0xdcd998, folder: 'shell\\em\\' + mon + '_shell01',
    lists: { 0: { list: 'c', pel: 'em019_00c' } },
    modes: { 0: m057(1.0, [[0, 30]], [0], [-1, -1, 0], [0.0], mon === 'em019_04' ? [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] : [[0.0, 0.0, 0.0]]) },
    hitdata: [[10, 10]] };
  D.actions = D.actions.concat([actPlain(7, 0xf2, '9', 'Motion[13]', [{ frame: 16, shell: 'shell01', mode: 0 }])]);
}
{
  const D = SHELL_DATA.em020_04;
  delete D.beamsOnly;
  D.shells.shell01 = { id: 0x9f, cls: 'uShellEm020_04_01', base: 'base01', reader: 0xdcde78, folder: 'shell\\em\\em020_04_shell01',
    lists: { 0: { list: 'u', pel: 'em020_04u' }, 1: { list: 'c', pel: 'em020_00c' } },
    modes: { 0: m057(1.0, [[1, 31]], [0], [0, -1], [], []) }, hitdata: [[10, 10], [50, 10]] };
  D.actions = D.actions.concat([actPlain(7, 0x0a, '9', 'Motion[36]', [{ at: 'start', shell: 'shell01', mode: 0 }],
    { also: [[7, 0x0b], [7, 0x0c], [7, 0x17], [7, 0x18], [7, 0x19], [7, 0x30], [7, 0x47], [7, 0x48], [7, 0x49], [7, 0x4a], [7, 0x4b], [7, 0x4c], [7, 0x4d]] })]);
}
