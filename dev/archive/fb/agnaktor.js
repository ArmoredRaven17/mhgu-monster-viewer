
// ---- AGNAKTOR (em049_00): uEm049_00's sp_01 (0xed, base01) beside his beams (render/beam-spawns.js) -----------------------------------
// READ 2026-10-18 (dev/leviathan-shells-spec.md). Folder by the path table (res 0x8a40). sp_01's reader 0xec43f4 (READ whole): ef 0; hit
// 0; +0x15ec: 1 int 1, 0x800 int 2, 4 int 3, 8 int 4, 0x1000 int 5 (the hit side); int 0 the joint +0x15e4; &vec 0 the offset +0x1608; no
// timer (+0x15f0 the ctor's 0: it lives while a hit slot is on). Its modes 0 / 1 start nothing (ef 999): the hit volumes of (3, 0xa) L0
// M29 f10, (6, 2) / (12, 0) L2 M19 f220 and (7, 5 / 0x15 / 0x32) L2 M5 f128 -- NOT BUILT, by name. Modes 2 / 3 draw (u 100 / u 101), each
// gated by a part's lava (the heat machine e+0xcac0 + 2k, dev/em049-heat.md) and its break level:
//   L2 M2 (7, 3 / 0x14 / 0x31; 0xeba02c(e, 0 / 1 / 2)): with the TAIL's heat e+0xcace != 0 and its break level 0x9d36c(e, 7) below the
//     .dtp row's (bytes +0x1d / +0x1e by rank), at G rank -- or (7, 0x31) (r1 == 2) at any rank -- at tune floats 0xc..0xf (143 / 152
//     / 160 / 170) sp_01 2 at the block's point plus tune vec k (0x6f640) turned by its facing, the unit's words (0xeba264..0xeba37c);
//   L2 M5 (7, 5 / 0x15 / 0x32): with the CHEST's heat e+0xcac2 != 0 and 0x9d36c(e, 1) below its row (bytes +5 / +6), at G rank or (7,
//     0x32), at 112 sp_01 3 at joint 16's world point (0xc164c), the unit's words (0xeba89c..0xeba9e0).
// The viewer's inputs: the region's heat as its machine shows it (index.html regionHot: not cooled) and the part's break as the parts
// SHOW it (motion-states.js agnaktorBroken049), input.heat049 = { chest, tail, chestBroken, tailBroken }.
function params049s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 0x800 : 0) | (I(3) !== -1 ? 4 : 0) | (I(4) !== -1 ? 8 : 0) | (I(5) !== -1 ? 0x1000 : 0);
  return { flags, joint: I(0), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm049_sp_01: a mode its files do not carry' : null };
}
function spawn049(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints, H = input.heat049;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (!H){ out.refused.push({ action: a.action, shell: 'shell01', mode: sp.mode, why: 'no lava state (input.heat049: the region heat and break the viewer shows)' }); continue; }
    const hot = sp.kind === 'tail' ? H.tail : H.chest, broken = sp.kind === 'tail' ? H.tailBroken : H.chestBroken;
    if (!hot || broken || (!a.anyRank && !((own.rank == null ? 5 : own.rank) > 4))) continue;
    const why = missing001(own, { facing: true, pos: true });
    if (why){ out.refused.push({ action: a.action, shell: 'shell01', mode: sp.mode, why }); continue; }
    let pt;
    if (sp.kind === 'tail'){
      const v = D.tune049[sp.k], r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), P = own.ownerPos;
      pt = [f(P[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])];
    } else {
      const M = jointMatrix(J, 16);
      if (!M){ out.refused.push({ action: a.action, shell: 'shell01', mode: sp.mode, why: 'no joint 16' }); continue; }
      pt = [f(M[12]), f(M[13]), f(M[14])];
    }
    const def = D.shells.shell01;
    const S = make001(state, D, 'shell01', { id: def.id, mode: sp.mode, position: pt, angles: ownerWords001(own), action: a.action, frame: sp.frame },
                      own, J, ctx, null);
    if (S){ S.motionId = ctx.ownerMotion; state.shells.push(S); out.spawned.push(S); }
  }
}
delete SHELL_DATA.em049_00.beamsOnly;
SHELL_DATA.em049_00.name = 'Agnaktor';
// em049_00_action_tune vecs 0..3: the tail's four drips (block-relative, turned by the facing)
SHELL_DATA.em049_00.tune049 = [[600.0, 100.0, 0.0], [400.0, 100.0, -1000.0], [-600.0, 100.0, -1400.0], [-1200.0, 100.0, -1000.0]].map(v => v.map(f));
SHELL_DATA.em049_00.shells.shell01 = { id: 0xed, cls: 'uShellEm049_sp_01', base: 'base01', reader: 0xec43f4, folder: 'shell@em@em049_00_shell01',
  modes: {
@01@
  }, hitdata: [[0, 10], [0, 10], [2, 20], [0, 20]] };
const act049 = (n, clip, spawns, x = {}) => Object.assign({ action: [7, n], code: 'em049', list: '2', clip, pick: x.pick || 'ai',
  variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns }, x);
const TAIL049 = [143, 152, 160, 170].map((frame, k) => ({ frame, kind: 'tail', mode: 2, k }));
SHELL_DATA.em049_00.actions = (SHELL_DATA.em049_00.actions || []).concat([
  act049(0x03, 'Motion[2]', TAIL049, { also: [[7, 0x14]] }),
  act049(0x31, 'Motion[2]', TAIL049, { anyRank: true }),
  act049(0x05, 'Motion[5]', [{ frame: 112, kind: 'chest', mode: 3 }], { also: [[7, 0x15]] }),
  act049(0x32, 'Motion[5]', [{ frame: 112, kind: 'chest', mode: 3 }], { anyRank: true }),
]);
