// ---- AKANTOR (em033_00, uEm033_00): his burrow tell, shell01 = uShellEm033_sp_01 on base01 -- dev/em033-shells-spec.md (shells agent,
// 2026-10-19; emulator check dev/shells-akantor-check.mjs). His beams stay render/beam-spawns.js's (beamsOnly). The census of his
// reach: ONE drawing create -- the burrowed wait (6, 0x03 / 0x0c / 0x0e / 0x0f) 0xe3a73c..0xe3ab30 (READ):
//   phase 0: posture 4 (0xbc7f4), L0 M2 (setMotion0), the burrow (0xbf62c / 0xbf700), P+0x1bc = 60.0;
//   phase 1: P+0x1bc counted down by 1.0 x the step (0x7206c); at <= 24 with P+0x1a2 == 0 (once): the point 600 ahead of him along his
//     Y word (P+0x40.. + 600 x (sin, 0, cos) normalised), its ground (0x49aec: the stage's floor there -- the viewer's floor, stand-in),
//     0x3fa2bc(0x40): +4 0xc1 (a literal), +8 2, +0x10 the point at the ground, +0x20.. / +0x30.. GOT vectors (0, 0, 0), +0x3c 0xffff ->
//     0x48b884 (the ground frame 0x232530 / 0x7c3a38 is computed and not stored in the request); at <= 0: L2 M10 (0x20a; L2 M33 0x221
//     for r6 != 0) -- the emergence. So the tell rises 36 updates after he goes under: the viewer's frame 36 of L0 M2 played from the
//     action's start (the timer is not the clip's; a stand-in, named).
// His sp_01 reader 0xe3e500 (vt 0x17bad08 +0x14c, READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15d0; hit 0 -> +0x15d8; +0x15ec (bfc /
// orrne): int 0 -> 1, int 2 -> 0x20, int 3 -> 4, int 4 -> 8; int 1 -> the joint +0x15e4; &vec 0 -> +0x1608. Timer the ctor's 0: it lives
// while its hit slot does (em033_00_01_hitdata). Mode 2: flags 0x0c (the ground snap and its angles), joint -1, u 10.
function params033s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh || i >= sh.vecs.length ? [0, 0, 0] : sh.vecs[i].map(f);
  const flags = (I(0) !== -1 ? 1 : 0) | (I(2) !== -1 ? 0x20 : 0) | (I(3) !== -1 ? 4 : 0) | (I(4) !== -1 ? 8 : 0);
  const why = !sh ? 'uShellEm033_sp_01: a mode SHELL_DATA does not carry' : null;
  return { flags, joint: I(1), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0),
           up: f(500.0), down: f(500.0), maxH: f(900.0), why, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: 1 } };
}
READERS01[0xe3e500] = params033s01;
function spawn033(state, D, a, ctx, input, out){
  const own = ctx.own001, sp = a.spawns[0];
  for (const F of sp.frames){
    if (!pass001(state, F)) continue;
    const why = missing001(own, { facing: true, pos: true, floor: true });
    if (why){ out.refused.push({ action: a.action, shell: 'shell01', mode: 2, frame: F, why: 'em033_00 shell01: ' + why }); continue; }
    const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    const x = mla(sn, cs, 0.0), z = mls(cs, sn, 0.0);                // (0xe3a854..0xe3a864: the 0.0 products kept)
    const len = sqrtf(mla(mla(0.0, x, x), z, z)), k = f(f(f(1.0) / len) * 600.0);
    const P = own.ownerPos, p = [mla(P[0], x, k), own.floorY, mla(P[2], k, z)];
    const S = make001(state, D, 'shell01', { id: 0xc1, mode: 2, position: p, angles: [0, 0, 0], frame: F, action: a.action },
                      own, state.prevJoints, ctx, null);
    if (S){ state.shells.push(S); out.spawned.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell01', mode: 2, frame: F, why: 'em033_00 shell01: the init refused (base01)' });
  }
}
{
  const D = SHELL_DATA.em033_00;
  D.shells.shell01 = { id: 0xc1, cls: 'uShellEm033_sp_01', base: 'base01', reader: 0xe3e500, folder: 'shell\\em\\em033_00_shell01',
    lists: { 0: { list: 'u', pel: 'em033_00u' } },
    modes: {
      0: { scale: 1.0, ef: [[0, 0], [0, 1]], hit: [0], sh: { ints: [-1, -1, 0, 0, 0], floats: [], vecs: [[0.0, 0.0, 0.0]] } },
      1: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [1], sh: { ints: [-1, -1, -1, 0, 0], floats: [], vecs: [[0.0, 0.0, 0.0]] } },
      2: { scale: 1.0, ef: [[0, 10], [999, -1]], hit: [2], sh: { ints: [-1, -1, -1, 0, 0], floats: [], vecs: [[0.0, 0.0, 0.0]] } },
      3: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [3], sh: { ints: [-1, -1, -1, 0, 0], floats: [], vecs: [[0.0, 0.0, 0.0]] } } },
    hitdata: [[76, 36], [30, 100], [60, 100], [0, 8]] };
  D.actions.push({ action: [6, 0x03], also: [[6, 0x0c], [6, 0x0e], [6, 0x0f]], code: 'em033', list: '0', clip: 'Motion[2]', partners: [],
                   frame: 36, shell: 'shell01', modes: [2], spawns: [{ at: 0xe3a9e8, kind: 'tell', frames: [36.0], shell: 'shell01', modes: [2] }],
                   spawner: 0xe3a73c, pick: 'ai', variant: '6:0x03' });
}

