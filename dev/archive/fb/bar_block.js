// ---- BARIOTH (em042_00, uEm042_00): his ice balls, shell00 = 0xd1 uShellEm042_00_00 on base00 -- dev/em042-shells-spec.md (shells
// agent, 2026-10-19; emulator check dev/shells-barioth-check.mjs). The census of his reach (the per-frame census finds none):
//   (7, 0x02 / 0x2c / 0x2d) L2 M12 (0xe6ae80.., args 0 / 2 / 1) at 106: shell00 0xd1 (a literal) mode 0, words X 0xa00 / 0x500 / 0x200
//     (ABSOLUTE, not added to his), Y e+0xfec (his), Z 0; the point a GOT zero vector
//   (7, 0x15 / 0x2e) L2 M5 (0xe6d150.., args 0 / 2) at 84: the same with X 0x2000
// His sp_00 (vtable 0x17bfa30) reader 0xe72190 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0; +0x15e8 |= 0x120; float 0 -> the flight
// +0x15fc (180); int 0 -> the joint +0x15dc (4); &vec 0 -> the offset +0x1610 ((0, -20, 50)); vec 1's z / y -> vz +0x15f4 / vy +0x15f8
// ((0, 0, 60): 60 / 0); &vec 2 -> the gravity +0x161c (0). Flags 0x120: the request's words (0x20; 0x100 only shapes bit 3, never set).
// His +0x150 0xe722bc (READ whole; byte +4 == 1 only): type 1 with the velocity's y > 0 returns; type 1 -> ef +0x15d0 and the child
// 0xe72374: shell01 0xd2 mode 0 (0x3fa2bc(0x40)) at the contact, +0x30.. (GOT x, THIS shell's Y word, GOT z), +0x3c its +0x13dc, +0x20 a
// GOT vector; type 0 -> +0x15cc; type 2 -> +0x15d4; 0x3f8970, 0x43ac04(shell, 7) (the camera), the end.
// His sp_01 (vtable 0x17bfbac) reader 0xe72598: ef 0 -> +0x15c8; hit 0; +0x15ec: int 0 -> 4, int 1 -> 8; float 0 -> the timer +0x15f0 (0:
// it lives while its hit slot does, em042_00_01_hitdata (10, 36)).
function params042s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: 0x120, flight: F(0), vz: V(1)[2], vy: V(1)[1], degX: f(0), degY: f(0), vec: V(0), gravity: V(2) };
}
function params042s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const why = !sh ? 'uShellEm042_00_01: a mode SHELL_DATA does not carry' : null;
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0), joint: -1, timer: !sh || !sh.floats.length ? f(0) : f(sh.floats[0]),
           f1600: f(0.0), f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0), why,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
function landing042s00(S, D, hit, ctx){
  if (hit.type === 1 && S.velocity[1] > 0) return 'keep';
  if (hit.type === 1 && ctx && ctx.create)
    ctx.create(S, 'shell01', { mode: 0, position: hit.point.slice(), angles: [0, S.angles[1] >>> 0, 0], action: S.action, frame: S.spawnFrame });
  const param = [1, 2, 3][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
}
READER00.uShellEm042_00_00 = (def, mode) => params042s00(def, mode);
READERS01[0xe72598] = params042s01;
LANDING.uShellEm042_00_00 = landing042s00;
WORDS00.add('uShellEm042_00_00');
function spawn042(state, D, a, ctx, input, out){
  const own = ctx.own001, sp = a.spawns[0];
  for (const F of sp.frames){
    if (!pass001(state, F)) continue;
    if (!own.facing){ out.refused.push({ action: a.action, shell: 'shell00', mode: 0, frame: F, why: 'em042_00 shell00: no owner facing (input.owner.y)' }); continue; }
    const S = spawnRock(state, D, { ...a, shell: 'shell00', mode: 0, frame: F }, state.prevJoints, ctx,
                        { requestPos: [0, 0, 0], requestAngles: [sp.X, own.ownerY & 0xffff, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null,
                          size: own.size.slice(), target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
    if (S){ out.spawned.push(S); state.shells.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell00', mode: 0, frame: F, why: 'em042_00 shell00: the init refused (no joint 4?)' });
  }
}
SHELL_DATA.em042_00 = {
  name: 'Barioth',
  lists: { 0: { list: 'u', pel: 'em042_00u' } },
  actions: [[0x02, 'Motion[12]', 106.0, 0xa00], [0x2c, 'Motion[12]', 106.0, 0x500], [0x2d, 'Motion[12]', 106.0, 0x200],
            [0x15, 'Motion[5]', 84.0, 0x2000], [0x2e, 'Motion[5]', 84.0, 0x2000]].map(([n, clip, F, X]) => ({
    action: [7, n], code: 'em042', list: '2', clip, partners: [], frame: F, shell: 'shell00', modes: [0], pick: 'ai',
    variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns: [{ kind: 'each', frames: [f(F)], shell: 'shell00', modes: [0], X }] })),
  shells: {
    shell00: { id: 0xd1, cls: 'uShellEm042_00_00', base: 'base00', reader: 0xe72190, folder: 'shell\\em\\em042_00_shell00',
      lists: { 0: { list: 'u', pel: 'em042_00u' } },
      modes: { 0: { scale: 1.0, ef: [[0, 10], [0, 20], [0, 21], [0, 20]], hit: [0],
                    sh: { ints: [4], floats: [180.0], vecs: [[0.0, -20.0, 50.0], [0.0, 0.0, 60.0], [0.0, 0.0, 0.0]] } } },
      hitdata: [[0, 99]] },
    shell01: { id: 0xd2, cls: 'uShellEm042_00_01', base: 'base01', reader: 0xe72598, folder: 'shell\\em\\em042_00_shell01',
      lists: { 0: { list: 'u', pel: 'em042_00u' } },
      modes: { 0: { scale: 1.0, ef: [[0, 30]], hit: [0], sh: { ints: [-1, -1], floats: [0.0], vecs: [] } } },
      hitdata: [[10, 36]] },
  },
};

