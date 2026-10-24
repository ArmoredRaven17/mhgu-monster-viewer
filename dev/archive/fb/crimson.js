// ---- CRIMSON FATALIS (em013_01): uEm013_00 variant 1 -- sp_00 0x86 (base00: fireballs and the METEORS, its own init 0xd8c3bc),
// sp_01 0x87 (base01, Fatalis's reader 0xd8c7f4 = 0xd8baa4), sp_51 0x89 (base51, 0xd8cdf0 = 0xd8c0a0); his beam 0x88 is beam-spawns.js's
// READ 2026-10-18 (dev/elder-dragon-shells-spec.md 3b). His actions: the EMC with op 0x92 for 1 (fb/emcvar.py, chain013.py); each makes
// only his ids. THE METEORS: 0xd80e74(e, idx) -- vec = the static table 0x2125018[idx] (12 B; filled by init_array 1820, 0xd8b4b0: y
// 7500 every one) turned by the Y word, added to the target block +0x1d0 (idx < 11) or block +0x30 (idx >= 11: the block point the
// action's phase 0 copied there, 0xd83c4c / 0xd84798); variant 2 -> sp_01 0x8b mode 5 at (x, y - vec.y, z), else sp_00 0x86 mode 5
// (+0x10 the point, the words the owner's). The actions (0xd82334(e, k) / 0xd84728 / 0xd84918): at each frame test the next idx of
// the byte list [0x17a60c4][k - 1] by the counter P+0x1a2 (fb/met013.py) -- L2 M2 f80 / 140 / 200 / 260 / 320 (k 1..4, 8..10),
// L2 M21 f180..540 and L2 M28 (phase 2) f60..420 by 60 (the list 0x17a6432's): 7 each.
// sp_00's reader 0xd8c254 (READ whole): ef 0 / 1 -> +0x15c8 / +0x15d4, ef 2 -> +0x1660 (the meteor's ground mark); hit 0; int 0 the
// joint; +0x15e8: 0x10 int 1, 0x20 int 2, 0x200 int 3 (each != -1); floats 0 degX, 1 the flight, 2 vz; &vec 0 -> +0x1610.
// Its init 0xd8c3bc (READ whole): base00's 0x3f8b80, then mode 5 alone -- the ray 0x183664 from +0x40 to +0x40 - (0, 1, 0) x 100000.0
// (the GOT 0x19176f0, the up vector): a hit and ef 2 -> ef 2 at (x, the hit's y, z) into +0x1664; its +0x154 0xd8c6f8 stops +0x1664
// (0x329c40(h, the end's flag)) in the end. Its landing 0xd8c52c: ef by type as Fatalis's; sp_01 by mode -- 0: 3 / 0, 1: 4 / 1, 5: 2 / 2
// (types 0 / 1), type 2 none.
function params013s00c(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(1) !== -1 ? 0x10 : 0) | (I(2) !== -1 ? 0x20 : 0) | (I(3) !== -1 ? 0x200 : 0);
  return { joint: I(0), flags, degX: F(0), xDeg: F(0), degY: f(0), yDeg: f(0), vz: F(2), vy: f(0), flight: F(1),
           xLo: f(0), xHi: f(0), yLo: f(0), yHi: f(0), vec: V(0), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: ZERO3.slice() };
}
READER00.uShellEm013_01_00 = (def, mode) => params013s00c(def, mode);
WORDS00.add('uShellEm013_01_00');
LANDING.uShellEm013_01_00 = (S, D, hit, ctx) => {
  const param = [null, null, 1][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
  const T = { 0: [3, 0, null], 1: [4, 1, null], 5: [2, 2, null] }[S.modeIndex];
  const child = T ? T[hit.type] : null;
  if (child != null && ctx && ctx.create) ctx.create(S, 'shell01', { mode: child, position: hit.point.slice(), angles: [0, 0, 0] });
};
// the meteor table 0x2125018 (init_array 1820's values, read out of the initialised image: fb/ia013.py)
const METEOR013 = [[0, 7500, 800], [0, 7500, 1500], [0, 7500, 2200], [0, 7500, 2900], [0, 7500, 800], [0, 7500, 1500], [0, 7500, 2200],
  [0, 7500, 2900], [0, 7500, 800], [0, 7500, 1500], [0, 7500, 2200], [0, 7500, 800], [0, 7500, 1500], [0, 7500, 2200], [0, 7500, 2900],
  [200, 7500, 900], [-450, 7500, 1500], [200, 7500, 2100], [-450, 7500, 2700], [200, 7500, 950], [-200, 7500, 950], [800, 7500, 100],
  [-800, 7500, 100], [600, 7500, -300], [-600, 7500, -300], [2300, 7500, -600], [-1000, 7500, -600], [400, 7500, 1100],
  [-550, 7500, 1700], [700, 7500, 1900], [800, 7500, 600], [-800, 7500, 600], [200, 7500, 3300], [-450, 7500, 4000]].map(v => v.map(f));
function meteor013(state, D, a, ctx, out, sp, own, J, push, refuse){
  const idx = sp.meteor, v = METEOR013[idx];
  if (!own.facing) return refuse('no facing (input.owner)');
  const B = idx < 11 ? own.target : state.base013;
  if (!B) return refuse(idx < 11 ? 'a meteor on the target with no target (input.rock.target)' : 'no block point at the play\'s start');
  const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const z1 = mls(f(v[2] * cs), v[0], sn), x1 = mla(f(v[0] * cs), v[2], sn);
  const P = [f(B[0] + x1), f(v[1] + B[1]), f(z1 + B[2])];
  if (D.meteor013 === 'sp01'){
    const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: 5, position: [P[0], f(P[1] - v[1]), P[2]], angles: [0, 0, 0],
                                             action: a.action, frame: sp.frame }, own, J, ctx, null);
    if (S) push(S);
    return;
  }
  const o = Object.assign({}, own, { requestPos: P, requestAngles: [0, 0, 0] });
  const S = make00n(state, D, 5, J, o, ctx, a.action, sp.frame);
  if (!S) return refuse('shell00 5: the init deleted it');
  push(S);
  // the ground mark (0xd8c3bc): the ray down from the meteor, ef 2 at the hit
  if (S.mode.ef[2]){
    const Q = S.position, q = stageQuery([Q[0], f(Q[1] - f(100000.0)), Q[2]], Q.slice(), ctx.stage, 0x10);
    if (q){
      const rq = rockRequest(D, S.mode, 2, [Q[0], q.point[1], Q[2]], 'marker', listsOf(D, S));
      if (rq){ rq.slot = 'marker'; S.handles = S.handles || {}; out.started.push({ shell: S, start: rq }); }
    }
  }
}
// (7, 0x3b / 0x3c) 0xd81928(e, side, 1) phase 1 f80 (READ): sp_01 0x87 mode 5 at the block point + (side ? 50 : -50, 0, 450) x 0xbe518
// turned by the Y word (x cos + sin 450, 450 cos - x sin), the words (0, Y + (side ? 0xf000 : 0x1000), 0)
function side013(state, D, a, ctx, out, sp, own, J, push, refuse){
  if (!own.ownerPos || !own.facing) return refuse('no owner position / facing');
  const x = sp.side87 ? f(50.0) : f(-50.0), z = f(450.0), sz = size001(own);
  const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), P = own.ownerPos;
  const xr = mla(f(x * cs), sn, z), zr = mls(f(cs * z), x, sn);
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: 5,
    position: [mla(P[0], xr, sz), mla(P[1], sz, f(0.0)), mla(P[2], zr, sz)],
    angles: [0, u16(own.ownerY + (sp.side87 ? 0xf000 : 0x1000)), 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
  if (S) push(S);
}
{
  const D = SHELL_DATA.em013_01;
  delete D.beamsOnly;
  D.lists = { 0: { list: 'u', pel: 'em013_01u' } };
  D.dust013 = [8, 7, 9];
  D.shells.shell00 = { id: 0x86, cls: 'uShellEm013_01_00', base: 'base00', folder: 'shell\\em\\em013_01_shell00',
    lists: { 0: { list: 'u', pel: 'em013_01u' } },
    modes: { 0: m057(1.0, [[0, 0], [0, 2], [999, -1]], [0], [3, -1, 0, -1], [0.0, 0.0, 60.0], [[0.0, 0.0, 0.0]]),
             1: m057(1.0, [[0, 0], [0, 11], [999, -1]], [1], [3, -1, 0, -1], [0.0, 72.0, 60.0], [[0.0, 0.0, 0.0]]),
             5: m057(1.0, [[0, 100], [0, 101], [0, 103]], [2], [-1, 0, -1, 0], [90.0, 0.0, 120.0], [[0.0, 0.0, 0.0]]) },
    hitdata: [[0, 216], [0, 72], [0, 180]] };
  D.shells.shell01 = { id: 0x87, cls: 'uShellEm013_01_01', base: 'base01', reader: 0xd8c7f4, folder: 'shell\\em\\em013_01_shell01',
    lists: { 0: { list: 'u', pel: 'em013_01u' }, 1: { list: 'c', pel: 'em013_00c' } },
    modes: { 0: m057(1.0, [[0, 1]], [0], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             1: m057(1.0, [[0, 11]], [1], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             2: m057(1.0, [[0, 101]], [3], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             3: m057(1.0, [[0, 2]], [0], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             4: m057(1.0, [[0, 11]], [1], [-1, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             5: m057(1.0, [[0, 130]], [2], [-1, -1, 0, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             7: m057(1.0, [[1, 30]], [4], [0, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
             8: m057(1.0, [[1, 30]], [5], [0, -1, -1, -1], [0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]) },
    hitdata: [[10, 10], [10, 10], [30, 210], [10, 10], [14, 10], [14, 10]] };
  D.shells.shell51 = { id: 0x89, cls: 'uShellEm013_01_51', base: 'base51', reader: 0xd8cdf0, folder: 'shell\\em\\em013_01_shell51',
    lists: { 0: { list: 'u', pel: 'em013_01u' } },
    modes: { 0: m057(1.0, [[0, 30], [0, 31]], [0], [0], [], [[0.0, 0.0, 0.0]]) },
    hitdata: [[30, 99]] };
  const MET = (st, n, list, clip, frames, idx) => act013(st, n, list, clip, frames.map((F, i) => ({ frame: F, meteor: idx[i] })), { base: true });
  const F5 = [80, 140, 200, 260, 320], F7a = [180, 240, 300, 360, 420, 480, 540], F7b = [60, 120, 180, 240, 300, 360, 420];
  const L7 = [20, 21, 15, 16, 19, 24, 31];
  D.actions = D.actions.concat([
    act013(3, 0x00, '1', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [151.0], dust: [1, [0.0, 0.0, 300.0], 1.8] }]),
    act013(4, 0x00, '1', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [151.0], dust: [1, [0.0, 0.0, 300.0], 1.6] }]),
    act013(4, 0x01, '1', 'Motion[5]', [{ frame: 10, dust: [1, [0.0, 0.0, 200.0], 1.6] }]),
    act013(4, 0x03, '1', 'Motion[6]', [{ frame: 36, dust: [1, [0.0, 0.0, 200.0], 1.6] }]),
    act013(7, 0x03, '2', 'Motion[8]', [{ frame: 98, fire: [0, 0, 0] }], { aim: AIM(0x71c, [75.0, 160.0, 1150.0], 0.0) }),
    act013(7, 0x05, '2', 'Motion[10]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0x4000, [20.0, -530.0, 850.0], 0.0) }),
    act013(7, 0x0a, '2', 'Motion[10]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0x4000, [20.0, -530.0, 850.0], 0.0) }),
    act013(7, 0x0b, '2', 'Motion[10]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0x4000, [20.0, -530.0, 850.0], 0.0) }),
    act013(7, 0x07, '2', 'Motion[11]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 300.0, 400.0], 1.6] }]),
    act013(7, 0x07, '2', 'Motion[12]', [{ frame: 20, fire: [0, 0x2000, 0] }]),
    act013(7, 0x0c, '2', 'Motion[13]', [{ frame: 54, dust: [5, [0.0, 0.0, 300.0], 1.4] }]),
    act013(7, 0x0d, '2', 'Motion[15]', [{ frame: 50, dust: [1, [0.0, 0.0, 300.0], 1.8] }]),
    MET(7, 0x0e, '2', 'Motion[2]', F5, [11, 12, 13, 14, 0]),
    MET(7, 0x0f, '2', 'Motion[2]', F5, [15, 16, 17, 18, 0]),
    MET(7, 0x10, '2', 'Motion[2]', F5, [20, 21, 19, 22, 0]),
    MET(7, 0x11, '2', 'Motion[2]', F5, [19, 24, 20, 23, 0]),
    MET(7, 0x16, '2', 'Motion[2]', F5, [27, 28, 29, 12, 0]),
    MET(7, 0x17, '2', 'Motion[2]', F5, [17, 18, 32, 33, 0]),
    MET(7, 0x18, '2', 'Motion[2]', F5, [29, 28, 14, 34, 0]),
    MET(7, 0x23, '2', 'Motion[21]', F7a, L7),
    MET(7, 0x24, '2', 'Motion[28]', F7b, L7),
    act013(7, 0x22, '2', 'Motion[39]', [{ frame: 140, dust: [1, [0.0, 0.0, 600.0], 1.6] }]),
    act013(7, 0x25, '2', 'Motion[24]', [{ frame: 90, fire: [0, 'aim', 'yaw'] }], { aim: AIM(0x1555, [0.0, 200.0, 450.0], 0.0), yaw: [0.0, 450.0] }),
    act013(7, 0x26, '2', 'Motion[25]', [{ frame: 146, fire: [1, 0x2000, 0] }]),
    act013(7, 0x2b, '2', 'Motion[40]', [{ frame: 166, s51: [0, 0] }]),
    act013(7, 0x2c, '2', 'Motion[43]', [{ frame: 166, s51: [1, 0] }]),
    act013(7, 0x2d, '2', 'Motion[16]', [{ frame: 54, dust: [5, [0.0, 0.0, 300.0], 1.4] }]),
    act013(7, 0x2e, '2', 'Motion[44]', [{ frame: 30, fire: [0, 'aim', 0] }], { aim: AIM(0xaab, [20.0, 170.0, 840.0], 150.0) }),
    act013(7, 0x3b, '2', 'Motion[5]', [{ frame: 80, side87: 0 }]),
    act013(7, 0x3c, '2', 'Motion[6]', [{ frame: 80, side87: 1 }]),
    act013(7, 0x3d, '2', 'Motion[53]', [{ frame: 54, dust: [5, [0.0, 0.0, 300.0], 1.4] }]),
  ]);
}
