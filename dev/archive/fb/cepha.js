
// ---- THE PLAIN SPAWNERS (code 'plain'): an action whose helper makes a shell at a frame from the zero vector's point and words
// (0x3f883c / 0x3fa2bc setups: +0x10 / +0x20 the zero vector, +0x2e 0xffff), the shell's own reader placing and aiming it --
// base00 by make00n (the class's READER00 entry), base01 at the owner's block point and words (0x105f4ac's kind). Rows: { frame,
// shell, mode } on the previous pose's joints, by pass001 of each frame.
function spawnPlain(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    const def = D.shells[sp.shell];
    const why = missing001(own, { facing: true, pos: def.base === 'base01' || sp.ownerPoint, target: def.base === 'base00' && !!sp.aimed });
    if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why }); continue; }
    let S = null;
    if (def.base === 'base00') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame, sp.shell);
    else {
      S = make001(state, D, sp.shell, { id: def.id, mode: sp.mode, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                        action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S) S.motionId = ctx.ownerMotion;
    }
    if (S){ state.shells.push(S); out.spawned.push(S); }
  }
}
const actPlain = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'plain', list, clip, pick: x.pick || 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);

// ---- CEPHADROME (em017_00): uEm017_00 (band 0xd97600..0xda4808, action main 0xd989a4) ---------------------------------------------
// READ 2026-10-18 (dev/piscine-shells-spec.md). Ids immediates: 0x92 uShellEm017_sp_00 (base00), 0x93 uShellEm017_sp_01 (base01);
// folders by the path table (0x175c3e8 res 0x89e5 / 0x89e6 -> 0x159daa0). The sand spits (census scratchpad fb/cen9_em017.txt, the
// helpers read for their second frame tests):
//   L2 M6 (7, 1 / 0x1c) f78 mode 0 (0xda0450..0xda05c0); L2 M14 (7, 5 / 0x1d / 0x1e / 0x1f) f58 mode 1 -- [0x169c860][r6] (0xda0930..);
//   L2 M22 (7, 0x10 / 0x16 / 0x19) f84 modes 3 / 4 / 5 (r8 + 3); L2 M23 (7, 0x11 / 0x17 / 0x1a) f25 modes 6 / 7 / 8, f70 9 / 10 / 11;
//   L2 M24 (7, 0x12 / 0x18 / 0x1b) f25 12 / 13 / 14, f70 15 / 16 / 17 (0xda2b94(e, kind, r6, r8): only with r6 = 0; r6 = 1 the dive's
//   no-shell form). Every helper first tests e+0xb5f7: set, the class is the small Delex (ems012) and makes 0x184 -- not his.
// sp_00's reader 0xda39fc (READ whole): ef 0..3; hit 0; int 0 the joint +0x15dc; +0x15e8: 1 int 1 (the X aim), 2 int 2, 8 int 3, 4 int 4;
// floats 0 degX, 1 degY, 2 vz, 3 vy, 4 flight, 5 / 6 the X clamp; &vec 0 the offset +0x1610, &vec 1 -> +0x1614 (the aim's own point's
// offset: flag 4 clear, 0x3f93f0 aimFrom001); the Y clamp, the gravity and the aim offset the ctor's
function params017s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 8 : 0) | (I(4) !== -1 ? 4 : 0);
  return { joint: I(0), flags, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(2), vy: F(3), flight: F(4), xLo: F(5), xHi: F(6),
           yLo: f(0), yHi: f(0), vec: V(0), from: V(1), aimOff: ZERO3.slice(), gravity: ZERO3.slice() };
}
// sp_00's landing 0xda3c28 (READ whole), in state 1: type 0 -> ef +0x15cc (1), type 2 -> +0x15d4 (3); type 1 -> ef +0x15d0 (2) after
// 0xda3cb4 makes sp_01 0x93 mode 0 (owner active) at the shell's +0x40 with its words (+0x20 the zero vector); then 0x3f8970 at the
// contact and the end. sp_01 0 starts nothing (its file has no EffectParam) -- a hit volume
function landing017s00(S, D, hit, ctx){
  if (S.state !== 1) return 'keep';
  if (hit.type === 1 && ctx && ctx.create) ctx.create(S, 'shell01', { mode: 0, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) });
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// sp_01's reader 0xda3eb4 (READ whole): hit 0; +0x15ec: 4 int 0, 8 int 1; float 0 the timer +0x15f0; &vec 0 the offset +0x1608
function params017s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0), joint: -1, timer: F(0), f1600: f(0.0), f15fc: f(1.0),
           vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm017_sp_01: a mode its files do not carry' : null };
}
SHELL_DATA.em017_00 = {
  name: 'Cephadrome',
  lists: { 0: { list: 'u', pel: 'em017_00u' } },
  shells: {
    // shell00: the sand spits (u 0 on them, u 1 at a contact)
    shell00: { id: 0x92, cls: 'uShellEm017_sp_00', base: 'base00', reader: 0xda39fc, folder: 'shell\\em\\em017_00_shell00',
      modes: {
      0: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, 0, -1, -1, -1], [10.0, 0.0, 50.0, 0.0, 320.0, -70.0, 70.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      1: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, 0, -1, -1, -1], [14.5, 0.0, 50.0, 0.0, 320.0, -70.0, 70.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 750.0, 0.0]]),
      2: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, 0, -1, -1, -1], [6.0, 0.0, 50.0, 0.0, 320.0, -70.0, 70.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 750.0, 0.0]]),
      3: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [60.0, 0.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      4: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [20.0, 0.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      5: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [10.0, 0.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      6: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [65.0, 35.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      7: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [20.0, 35.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      8: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [12.0, 35.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      9: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [65.0, 70.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      10: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [20.0, 70.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      11: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [10.0, 70.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      12: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [65.0, -35.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      13: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [20.0, -35.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      14: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [12.0, -35.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      15: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [65.0, -70.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      16: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [20.0, -70.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      17: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [5, -1, -1, -1, -1], [10.0, -75.0, 50.0, 0.0, 320.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 80.0], [0.0, 0.0, 0.0]]),
      }, hitdata: [[0, 99]] },
    // shell01: a spit's floor contact (a hit volume, no EffectParam)
    shell01: { id: 0x93, cls: 'uShellEm017_sp_01', base: 'base01', reader: 0xda3eb4, folder: 'shell\\em\\em017_00_shell01',
      modes: {
      0: m057(1.0, [], [-1], [-1, -1], [0.0], [[0.0, 0.0, 0.0]]),
      }, hitdata: [[4, 10]] },
  },
  actions: null,
};
const SPIT017 = (frames, modes) => frames.map((frame, i) => ({ frame, shell: 'shell00', mode: modes[i], aimed: true }));
SHELL_DATA.em017_00.actions = [
  actPlain(7, 0x01, '2', 'Motion[6]', SPIT017([78], [0]), { also: [[7, 0x1c]] }),
  actPlain(7, 0x05, '2', 'Motion[14]', SPIT017([58], [1]), { also: [[7, 0x1d], [7, 0x1e], [7, 0x1f]] }),
  actPlain(7, 0x10, '2', 'Motion[22]', SPIT017([84], [3])),
  actPlain(7, 0x16, '2', 'Motion[22]', SPIT017([84], [4])),
  actPlain(7, 0x19, '2', 'Motion[22]', SPIT017([84], [5])),
  actPlain(7, 0x11, '2', 'Motion[23]', SPIT017([25, 70], [6, 9])),
  actPlain(7, 0x17, '2', 'Motion[23]', SPIT017([25, 70], [7, 10])),
  actPlain(7, 0x1a, '2', 'Motion[23]', SPIT017([25, 70], [8, 11])),
  actPlain(7, 0x12, '2', 'Motion[24]', SPIT017([25, 70], [12, 15])),
  actPlain(7, 0x18, '2', 'Motion[24]', SPIT017([25, 70], [13, 16])),
  actPlain(7, 0x1b, '2', 'Motion[24]', SPIT017([25, 70], [14, 17])),
];
