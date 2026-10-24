// ---- OLD FATALIS (em013_02): uEm013_00 variant 2 -- sp_00 0x8a (base00, Fatalis's reader 0xd8cf8c = 0xd8b6f8; its landing 0xd8d08c),
// sp_01 0x8b (base01 through 0xd8d41c: the strikes, the dust, the meteors' lightning), sp_11 0x8d (base11: the fireball's strike
// timer), sp_51 0x8e (base51 through 0xd8dfa8: the sweep about its point); his beam 0x8c makes no effect
// READ 2026-10-18 (dev/elder-dragon-shells-spec.md 3c). His actions: the EMC with op 0x92 for 2 (fb/emcvar.py, chain013.py).
// sp_00's landing 0xd8d08c (READ whole): ef by type as Fatalis's (type 2 -> ef 1); then by the mode -- 0: sp_01 6 (type 0) / 0 (type 1);
// 1: type 0 sp_01 8, type 1 sp_11 0x8d mode 0 at the contact with the fireball's words (+0xfe8..), type 2 -> RETURNS (no vt+0x148: the
// fireball flies on); 2: 7 / 1; then vt+0x148(0)
LANDING.uShellEm013_02_00 = (S, D, hit, ctx) => {
  const param = [null, null, 1][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
  const m = S.modeIndex;
  if (m === 1 && hit.type === 2) return 'keep';
  if (m === 1 && hit.type === 1){
    if (ctx && ctx.create) ctx.create(S, 'shell11', { mode: 0, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
    return;
  }
  const child = m === 0 ? [6, 0, null][hit.type] : m === 1 ? [8, null, null][hit.type] : m === 2 ? [7, 1, null][hit.type] : null;
  if (child != null && ctx && ctx.create) ctx.create(S, 'shell01', { mode: child, position: hit.point.slice(), angles: [0, 0, 0] });
};
READER00.uShellEm013_02_00 = (def, mode) => params013s00(def, mode);   // 0xd8cf8c: the same instructions as 0xd8b6f8
WORDS00.add('uShellEm013_02_00');
// sp_01's reader 0xd8d41c (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15d0 (base01's 0x20 switch); hit 0; +0x15ec 4 int 0, 8 int 1,
// 0x800 int 2, 0x20 int 3, 0x80 int 4; float 0 the timer; +0x15f4 = 1.0, +0x15f8 = 0; &vec 0 -> +0x1608, &vec 1 -> +0x160c. Its +0x150
// 0xd8d59c is `b 0x4a0ee4` (the mode, discarded): nothing
function params013s01b(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? 0 : i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 0x800 : 0) | (I(3) !== -1 ? 0x20 : 0) | (I(4) !== -1 ? 0x80 : 0);
  return { flags, joint: -1, timer: F(0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), deg: V(1), up: f(1.0), down: f(0.0), maxH: f(900.0),
           why: !sh ? 'uShellEm013_02_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: 1 } };
}
READERS01[0xd8d41c] = sh => params013s01b(sh);
// sp_11's reader 0xd8da5c (READ whole): the count +0x1658 = int 0 (>= 1), the times +0x1654[k] = float k; nothing else (+0x165c the
// ctor's -1: no motion-speed divide; flags 0). Its +0x168 0xd8db9c(shell, k): the owner active (0x4a0f38); sh vec k turned by the
// shell's Y word (x cos + z sin, z cos - x sin) added to +0x40; sp_01 0x8b mode (k 0 -> 2, 1 -> 3, else 4), the shell's words
function params013s11(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const n = I(0) >= 1 ? I(0) : 0, table = [];
  for (let k = 0; k < n; k++) table.push(F(k));
  return { flags: 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0), table,
           i165c: -1, b168c: false };
}
READERS11[0xd8da5c] = (def, mode) => params013s11(def, mode);
CREATE11.uShellEm013_02_11 = (S, idx, ctx, D) => {
  const sh = S.mode.sh, v = idx < sh.vecs.length ? sh.vecs[idx].map(f) : [0, 0, 0];
  const r = f(f(u16(S.angles[1])) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), P = S.position;
  const z1 = mls(f(v[2] * cs), v[0], sn), x1 = mla(f(v[0] * cs), v[2], sn);
  if (ctx.create) ctx.create(S, 'shell01', { mode: idx === 0 ? 2 : idx === 1 ? 3 : 4, position: [f(x1 + P[0]), f(v[1] + P[1]), f(z1 + P[2])],
                                             angles: S.angles.map(w => w >>> 0) });
};
// sp_51's reader 0xd8dfa8 (READ whole): as Fatalis's but +0x1660 = 1 (the init's halved arm: the sweep about the point), +0x1664 = 30.0,
// +0x1668 = 1.0, +0x166c = 15.0, the reach = &vec 0 (modes 0 / 1: (-3400, 0, 0) / (3400, 0, 0))
function params013s51b(sh){
  const k = params013s51(sh);
  return Object.assign(k, { m1660: 1, wait: f(30.0), len: f(1.0), lag: f(15.0), reach: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0] });
}
READERS01[0xd8dfa8] = sh => params013s51b(sh);
// (7, 0x53..0x56) 0xd86d70(e, side, kind) phase 1 f166 (READ): kind 1 / 2 -> z = max(|target - block point| - 350, 1000) (3D), x 0; sp_51
// 0x8e mode (side ? 0 : 1) at the block point + (z sin, 0, z cos) by the Y word, the words (0, Y, 0). (Kind 0 -- z = 1500 x 0xbe518 --
// no action of his issues it.) The phase-1 turns 0x76ee8 / 0x76c08 are the body's: the viewer's facing is its input
function s51b013(state, D, a, ctx, out, sp, own, J, push, refuse){
  const [side, kind] = sp.s51b;
  if (!own.ownerPos || !own.facing || !own.target) return refuse('no owner position / facing / target');
  const P = own.ownerPos, T = own.target;
  let x = f(0.0), z;
  if (kind === 1 || kind === 2){
    const dy = f(T[1] - P[1]), dx = f(T[0] - P[0]), dz = f(T[2] - P[2]);
    const d = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz)), z0 = f(d + f(-350.0));
    z = z0 > f(1000.0) ? z0 : f(1000.0);
  } else { const sz = size001(own); x = f(sz * x); z = f(sz * f(1500.0)); }
  const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const zr = mls(f(z * cs), x, sn), xr = mla(f(x * cs), z, sn);
  const S = make001(state, D, 'shell51', { id: D.shells.shell51.id, mode: side ? 0 : 1,
    position: [f(P[0] + xr), f(x + P[1]), f(zr + P[2])], angles: [0, u16(own.ownerY), 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
  if (S) push(S);
}
{
  const D = SHELL_DATA.em013_02 || (SHELL_DATA.em013_02 = { lists: {}, shells: {}, actions: [] });
  delete D.beamsOnly;
  D.name = D.name || 'Old Fatalis';
  D.lists = { 0: { list: 'u', pel: 'em013_02u' } };
  D.dust013 = [0xb, 0xa, 0xc];
  D.fireModes013 = { 0: 0, 1: 2, 2: 1 };
  D.meteor013 = 'sp01';
  const G = [[0.0, -91.5999984741211, 132.8000030517578]];
  D.shells.shell00 = { id: 0x8a, cls: 'uShellEm013_02_00', base: 'base00', folder: 'shell\\em\\em013_02_shell00',
    lists: { 0: { list: 'u', pel: 'em013_02u' } },
    modes: { 0: m057(1.0, [[0, 0], [0, 1]], [0], [3, 0], [0.0, 0.0, 90.0], G),
             1: m057(1.0, [[0, 13], [999, -1]], [1], [3, 0], [0.0, 0.0, 60.0], G),
             2: m057(1.0, [[0, 200], [0, 201]], [1], [3, 0], [0.0, 0.0, 60.0], G) },
    hitdata: [[1, 216], [0, 72]] };
  const Z2 = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]], N5 = [-1, -1, -1, -1, -1];
  D.shells.shell01 = { id: 0x8b, cls: 'uShellEm013_02_01', base: 'base01', reader: 0xd8d41c, folder: 'shell\\em\\em013_02_shell01',
    lists: { 0: { list: 'u', pel: 'em013_02u' }, 1: { list: 'c', pel: 'em013_00c' } },
    modes: { 0: m057(1.0, [[0, 1], [999, -1]], [0], N5, [0.0], Z2), 1: m057(1.0, [[0, 201], [999, -1]], [1], N5, [0.0], Z2),
             2: m057(1.0, [[0, 11], [999, -1]], [2], N5, [0.0], Z2), 3: m057(1.0, [[0, 12], [999, -1]], [3], N5, [0.0], Z2),
             4: m057(1.0, [[999, -1], [999, -1]], [4], N5, [0.0], Z2), 5: m057(1.0, [[0, 103], [0, 100]], [5], [-1, -1, -1, 0, -1], [0.0], Z2),
             6: m057(1.0, [[0, 2], [999, -1]], [0], N5, [0.0], Z2), 7: m057(1.0, [[0, 201], [999, -1]], [1], N5, [0.0], Z2),
             8: m057(1.0, [[0, 11], [999, -1]], [8], N5, [0.0], Z2), 9: m057(1.0, [[0, 111], [0, 110]], [9], [-1, -1, -1, 0, -1], [0.0], Z2),
             10: m057(1.0, [[1, 30], [999, -1]], [6], [0, -1, -1, -1, -1], [0.0], Z2), 11: m057(1.0, [[1, 30], [999, -1]], [7], [0, -1, -1, -1, -1], [0.0], Z2) },
    hitdata: [[10, 10], [10, 10], [10, 68], [10, 68], [10, 68], [64, 10], [14, 10], [14, 10], [10, 68], [64, 10]] };
  D.shells.shell11 = { id: 0x8d, cls: 'uShellEm013_02_11', base: 'base11', reader: 0xd8da5c, folder: 'shell\\em\\em013_02_shell11',
    lists: {}, modes: { 0: m057(1.0, [], [], [3], [0.0, 10.0, 20.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 800.0], [0.0, 0.0, 1600.0]]) } };
  D.shells.shell51 = { id: 0x8e, cls: 'uShellEm013_02_51', base: 'base51', reader: 0xd8dfa8, folder: 'shell\\em\\em013_02_shell51',
    lists: { 0: { list: 'u', pel: 'em013_02u' } },
    modes: { 0: m057(1.0, [[0, 32], [0, 33]], [0], [0], [], [[-3400.0, 0.0, 0.0]]), 1: m057(1.0, [[0, 30], [0, 31]], [0], [0], [], [[3400.0, 0.0, 0.0]]) },
    hitdata: [[30, 99]] };
  const MET = (st, n, list, clip, frames, idx) => act013(st, n, list, clip, frames.map((F, i) => ({ frame: F, meteor: idx[i] })), { base: true });
  const F5 = [80, 140, 200, 260, 320], F7a = [180, 240, 300, 360, 420, 480, 540];
  D.actions = D.actions.concat([
    act013(3, 0x00, '1', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [151.0], dust: [1, [0.0, 0.0, 300.0], 1.8] }]),
    act013(4, 0x01, '1', 'Motion[5]', [{ frame: 10, dust: [1, [0.0, 0.0, 200.0], 1.6] }]),
    act013(7, 0x02, '2', 'Motion[7]', [{ frame: 102, fire: [0, 'aim', 0] }], { aim: AIM(0x71c, [40.0, 780.0, 1000.0], 0.0) }),
    act013(7, 0x03, '2', 'Motion[8]', [{ frame: 98, fire: [0, 0, 0] }], { aim: AIM(0x71c, [75.0, 160.0, 1150.0], 0.0) }),
    act013(7, 0x05, '2', 'Motion[10]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0x4000, [20.0, -530.0, 850.0], 0.0) }),
    act013(7, 0x07, '2', 'Motion[11]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 300.0, 400.0], 1.6] }]),
    act013(7, 0x07, '2', 'Motion[12]', [{ frame: 20, fire: [0, 0x2000, 0] }]),
    act013(7, 0x0d, '2', 'Motion[15]', [{ frame: 50, dust: [1, [0.0, 0.0, 300.0], 1.8] }]),
    MET(7, 0x0e, '2', 'Motion[2]', F5, [11, 12, 13, 14, 0]),
    MET(7, 0x0f, '2', 'Motion[2]', F5, [15, 16, 17, 18, 0]),
    MET(7, 0x10, '2', 'Motion[2]', F5, [20, 21, 19, 22, 0]),
    MET(7, 0x11, '2', 'Motion[2]', F5, [19, 24, 20, 23, 0]),
    MET(7, 0x12, '2', 'Motion[2]', F5, [16, 17, 18, 19, 20]),
    MET(7, 0x16, '2', 'Motion[2]', F5, [27, 28, 29, 12, 0]),
    MET(7, 0x17, '2', 'Motion[2]', F5, [17, 18, 32, 33, 0]),
    MET(7, 0x18, '2', 'Motion[2]', F5, [29, 28, 14, 34, 0]),
    MET(7, 0x23, '2', 'Motion[21]', F7a, [20, 21, 15, 16, 19, 24, 31]),
    act013(7, 0x25, '2', 'Motion[24]', [{ frame: 90, fire: [0, 'aim', 'yaw'] }], { aim: AIM(0x1555, [0.0, 200.0, 450.0], 0.0), yaw: [0.0, 450.0] }),
    act013(7, 0x44, '2', 'Motion[24]', [{ frame: 90, fire: [0, 'aim', 'yaw'] }], { aim: AIM(0x1555, [0.0, 200.0, 450.0], 200.0), yaw: [0.0, 450.0] }),
    act013(7, 0x2d, '2', 'Motion[16]', [{ frame: 54, dust: [5, [0.0, 0.0, 300.0], 1.4] }]),
    act013(7, 0x2e, '2', 'Motion[44]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0xaab, [20.0, 170.0, 840.0], 150.0) }),
    act013(7, 0x3a, '2', 'Motion[11]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 0.0, 0.0], 1.6] }]),
    act013(7, 0x3a, '2', 'Motion[12]', [{ frame: 20, fire: [0, 0x38e4, 0] }]),
    // (0xd86a5c phase 1 f225: the aim (0x2000, (-30, 330, 870), 0) and the yaw (+-0x2000 past 45 deg) from the same point, at the spawn)
    act013(7, 0x46, '4', 'Motion[7]', [{ frame: 225, fire: [1, 'aimNow', 'yawNow'], aim: AIM(0x2000, [-30.0, 330.0, 870.0], 0.0),
                                         yaw: [-30.0, 870.0, 0x2000, 45.0] }]),
    act013(7, 0x53, '4', 'Motion[11]', [{ frame: 166, s51b: [1, 1] }]),
    act013(7, 0x54, '4', 'Motion[12]', [{ frame: 166, s51b: [0, 1] }]),
    act013(7, 0x55, '2', 'Motion[43]', [{ frame: 166, s51b: [1, 2] }]),
    act013(7, 0x56, '2', 'Motion[40]', [{ frame: 166, s51b: [0, 2] }]),
  ]);
}
