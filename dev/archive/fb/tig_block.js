// ---- TIGREX (em032_00, uEm032_00): his rock volley, shell00 = uShellEm032_sp_00 on base00 -- dev/em032-shells-spec.md 8 ----------
// (shells agent, 2026-10-19; emulator check dev/shells-tigrex-check.mjs). The census (cengen11 over his table's reach) names ONE
// creating action on Tigrex: (7, 0x07), 0xe2a770 -- L2 M5 (0x205, blend 8; 30 with P+0x1a3 = 1 when P+0x1bb & 0xfe == 4), and in
// phase 1, arg != 4, three crossings of 68 / 72 / 76 (0xb0968 mode 0, s1 0.0) each calling the helper 0xe2aacc(e, shot, 0, 0).
//   THE SLOTS ARE SWAPPED on this class (spec 0): +0xcac8 = 0xbd is this base00 shell, +0xcac4 = 0xbe the base01 one.
//
// 0xe2aacc(e, shot, r2 = 0, r3 = 0), READ whole (..0xe2adf4):
//   joint 50 (r3 0; 40 with r3 set, and the shot mirrored 2 - shot). Shot 0: ctl ([e+0xcac0]) +0..+8 = the joint's position
//     (0xc164c), ctl+0x2c = a random u16 (0x16b4b4) -> the request's +0x2e. Shots 1 / 2 reuse that point.
//   the mode: table B 0x169da90 [ctl+0x29 x 3 + shot] (r2 0; r2 1 takes table A 0x169da9c, selector <= 1) -- ctl+0x29 > 3 spawns
//     nothing. ctl+0x29 is written at the action's START (vt hook 0xe20990, status 7, indices 7..0xc / 0x24 / 0x25 / 0x5d / 0x62..0x66 /
//     0x69 / 0x6a / 0x77 / 0x78 -> 0xe20c70) FROM THE FLOOR UNDER HIM: e+0x1068 & 6 -> 2, else & 0x40 -> 3, else e+0x1066 bit 1
//     (0xe20c98..0xe2125c). The viewer has no stage under him: input.floorFlags / input.floorAttr (e+0x1068 / e+0x1066), absent 0 --
//     the plain floor, selector 0, modes 0 / 1 / 2 (u 0, landing u 30). 1 -> 3..5 (u 3 / u 33), 2 -> 6..8 (u 1 / u 31), 3 -> 9..11 (no
//     effects in their files).
//   the target: block +0x1d0 (y - 230 when ctl+0x2b == 1: 0x8eb24 at the action start, a TARGET UNIT's state -- the viewer's target is
//     a point, so 0)
//   the pitch from the ctl point to the target, atan2(-dy, flat) -> u16; X word = the owner's X + that less the owner's X, held at
//     0xe000 (45 degrees up) when the difference lands in [0x8001, 0xe000) (0xe2ada4..0xe2adc8); Y word = the owner's +0x54; Z 0
//   the point: ctl + 40 x joint 50's row 1 (0xc15a4 at this shot; 0xe2ad1c..0xe2ad84, the 0.0 products kept)
//   request 0x30 (0x3f883c): +4 [e+0xcac8], +8 the mode, +0xc the owner, +0x10.. the point, +0x20.. the words, +0x2e the random
function spawn032s00(state, D, a, ctx, input, out){
  const own = owner001(input);
  const sp = a.spawns[0];
  sp.frames.forEach((F, shot) => {
    if (!pass001(state, F)) return;
    const why = !own.ownerPos ? 'no owner position (input.ownerPos)' : !own.target ? 'no target (input.rock.target), which the pitch reads (0xe2abc0)'
              : !own.facing ? 'no owner facing (input.owner.y), the Y word (0xe2ad00)' : null;
    const fl = input.floorFlags >>> 0, at = input.floorAttr & 0xff;
    const sel = (fl & 6) ? 2 : (fl & 0x40) ? 3 : ((at >> 1) & 1);           // 0xe20ca0 / 0xe20fe4 / 0xe21254
    const mode = sel <= 3 ? TABLE032B[sel * 3 + shot] : null;
    if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode, frame: F, why: 'em032_00 shell00: ' + why }); return; }
    if (shot === 0 || !state.ctl032){
      const M0 = jointMatrix(state.prevJoints, 50);                          // 0xc164c(e, 50, ctl): the joint's position
      if (!M0){ out.refused.push({ action: a.action, shell: sp.shell, mode, frame: F, why: 'em032_00 shell00: no joint 50' }); return; }
      state.ctl032 = [M0[12], M0[13], M0[14]];
    }
    const C = state.ctl032, T = own.target;
    const dz = f(T[2] - C[2]), dx = f(T[0] - C[0]), dy = f(T[1] - C[1]);   // (ctl+0x2b 0: no -230)
    const pitch = atan2f(f(-dy), sqrtf(mla(f(dz * dz), dx, dx)));
    let d = (s32(mla(0.5, pitch, RAD_TO_U16)) - own.ownerX) | 0;           // 0xe2adb0: less the owner's X word (32-bit)
    if (((u16(d) + 0xffff7fff) >>> 0) < 0x5fff) d = 0xe000;               // uxtah / cmp #0x5fff / movwlo #0xe000
    const X = u16((own.ownerX >>> 0) + d);
    const M = jointMatrix(state.prevJoints, 50);                            // 0xc15a4 at this shot
    const P = [f(mla(mla(f(M[4] * 40.0), M[0], 0.0), M[8], 0.0) + C[0]),
               f(mla(mla(f(M[5] * 40.0), M[1], 0.0), M[9], 0.0) + C[1]),
               f(mla(mla(f(M[6] * 40.0), M[2], 0.0), M[10], 0.0) + C[2])];
    const S = spawnRock(state, D, { ...a, shell: sp.shell, mode, frame: F }, state.prevJoints, ctx,
                        { requestPos: P, requestAngles: [X, own.ownerY >>> 0, 0], ownerPos: own.ownerPos.slice(), size: own.size.slice(),
                          target: T.slice(), ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
    if (S){ out.spawned.push(S); state.shells.push(S); }
    else out.refused.push({ action: a.action, shell: sp.shell, mode, frame: F, why: 'em032_00 shell00: the init refused' });
  });
}
const TABLE032B = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];          // 0x169da90 (table A 0x169da9c = 12..17, r2 1: no caller here)
// his sp_00 reader 0xe35410 (READ whole, ..0xe35578): ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; cmn float 0 (0x4a2264) -> the
// flight +0x15fc (180); +0x15e8 |= 0x10 UNCONDITIONALLY (0xe354b4: the request's point), bit 0x20 = int 0 != -1 (the request's
// words); floats 0 / 1 / 2 -> +0x15f4 (vz) / +0x15f8 (vy) / +0x15f0 (the Y offset, degrees); vec 0 -> +0x161c (the gravity); ints 1 /
// 2 -> +0x1660 / +0x1664 (the landing's children). +0x1610 (the offset) keeps the ctor's shared zero vector; +0x15dc is not read.
function params032s00(def, mode){
  const sh = mode.sh, c = def.cmn || { floats: [] };
  const I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: -1, flags: 0x10 | (I(0) !== -1 ? 0x20 : 0), flight: c.floats.length ? f(c.floats[0]) : f(0),
           vz: F(0), vy: F(1), degX: f(0), degY: F(2), yDeg: F(2), vec: ZERO3.slice(),
           gravity: (sh.vecs[0] || ZERO3).map(f), c1660: I(1), c1664: I(2) };
}
// his +0x170 0xe3587c (READ whole): +0x1020 = (0, vec.y, vec.z) turned by the OWNER's words (block +0x58, then +0x50, then +0x54 -- the
// order and the 0.0 products of launchVelocity), not by the shell's Y word as base00's 0x3f9f98
function gravity032s00(S, k, got){ return launchVelocity(k.gravity[1], k.gravity[2], [got.ownerX, got.ownerY, got.ownerZ || 0]); }
// his +0x150 0xe3557c (READ whole): type 1 while the velocity's y (+0x1014) > 0 RETURNS (no landing, no end: `popgt`); else type 1 ->
// the children 0xe35624 (+0x1660 != -1: a shell00 of that mode at the contact; +0x1664: a base01 [+0xcac4] -- -1 on every Tigrex mode)
// and ef +0x15d0 (param 2); type 0 -> +0x15cc (1); type 2 -> +0x15d4 (3); 0x43ac04 (the camera) on 0 / 1; then 0x3f8970 and the end
function landing032s00(S, D, hit, ctx){
  if (hit.type === 1 && S.velocity[1] > 0) return 'keep';
  if (hit.type === 1 && (S.k.c1660 !== -1 || S.k.c1664 !== -1))
    throw new Error('shells.js: em032 shell00 mode ' + S.modeIndex + ': the landing\'s children (0xe35624) are not transcribed');
  const param = [1, 2, 3][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
}
READER00.uShellEm032_sp_00 = (def, mode) => params032s00(def, mode);
GRAVITY00.uShellEm032_sp_00 = gravity032s00;
LANDING.uShellEm032_sp_00 = landing032s00;
SHELL_DATA.em032_00 = {
  name: 'Tigrex',
  lists: { 0: { list: 'u', pel: 'em032_00u' }, 1: { list: 'c', pel: 'em032_00c' } },
  actions: [
    // (7, 0x07) 0xe2a770 phase 1: the volley at 68 / 72 / 76 (above). His other L2 M5 indices (8..0xc, 0x3a) are outside his table's
    // reach (the cengen11 census, rom-map tooling); Grimclaw's L9 actions are his.
    { action: [7, 0x07], code: 'em032s00', list: '2', clip: 'Motion[5]', partners: [], frame: 68, shell: 'shell00', modes: [0, 1, 2],
      spawns: [{ at: 0xe2ade4, kind: 'volley', frames: [68.0, 72.0, 76.0], shell: 'shell00', modes: [0, 1, 2] }], spawner: 0xe2a770, pick: 'ai', variant: '7:0x07' },
  ],
  shells: {
    // shell00: global id 0xbd ([e+0xcac8]), uShellEm032_sp_00, base00 (86/95 slots vs em004's sp_00), reader 0xe35410
    shell00: {
      id: 0xbd, cls: 'uShellEm032_sp_00', base: 'base00', reader: 0xe35410, folder: 'shell\\em\\em032_00_shell00',
      cmn: { ints: [], floats: [180.0], vecs: [] },
      modes: Object.fromEntries([
        [0, 0, -10.0], [1, 0, 0.0], [2, 0, 10.0], [3, 1, -10.0], [4, 1, 0.0], [5, 1, 10.0], [6, 2, -10.0], [7, 2, 0.0], [8, 2, 10.0],
        [9, 3, -10.0], [10, 3, 0.0], [11, 3, 10.0]].map(([m, g, y]) => [m, { scale: 1.0, hit: [g],
          ef: g === 3 ? [[999, -1], [999, -1], [999, -1], [999, -1]] : [[0, [0, 3, 1][g]], [0, [30, 33, 31][g]], [0, [30, 33, 31][g]], [0, [30, 33, 31][g]]],
          sh: { ints: [0, -1, -1], floats: [69.05000305175781, 6.125, y], vecs: [[0.0, -0.125, -0.05000000074505806]] } }])),
    },
  },
};

