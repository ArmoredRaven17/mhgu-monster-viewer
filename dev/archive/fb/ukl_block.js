// ---- UKANLOS (em038_00, uEm038_00): his body's shells, shell00 = 0xce uShellEm038_sp_00 on base00 (the beams' child class) --------
// dev/em038-shells-spec.md (shells agent, 2026-10-19; emulator check dev/shells-ukanlos-check.mjs). His beams and their children stay
// render/beam-spawns.js's; params038c / ANGLE16C / CHILD_INIT / landing038 (above) serve these too. The census of his reach:
//   (1, 0x08..0x13) L2 M4 (0xe5c168(e, k), k = n - 8): THE ICE FALL -- per shot i (P+0x1a2) at the crossing of 0x169de2c[i] (210, 246, ..,
//     570; 9999 the end), the next byte of the k-th list (0x17bde48[k] -> bytes, 0xff the end) names an offset (0x169de44, (x, z) pairs)
//     turned by his Y word and added to joint 1's position, plus world (0, 0, 2 v) with v the action's draw (e+0x73e8, H73E8_STANDIN)
//     put through i rounds of v = v ? (v % 176) & 0x53 : 1 (the angle u16(u32(v x 2pi/65536)) is 0 for every v these give); y = 6000.0
//     absolute; mode 0, the list's last entry mode 1 (the byte after it 0xff)
//   (1, 0x15) / (1, 0x18) L2 M4 (0xe5c790(e, r5), stubs 0xe5d1fc r5 0 / 0xe5cf48 r5 1): THE ARENA ICE FALL -- shots at 0x169df34[i] (210,
//     235, .., 525; 9999), each at a fixed WORLD point of two tables the static initialiser 0xe62e?? writes (0x2128fb0 for r5 0, 0x2129090
//     for 1; y -450 / 110, read only for x / z) plus (0, 0, 2 v), y = 6000; mode 2 for shots 0..12, then 3. World points: the viewer's origin
//     is not the arena's (a stand-in, named)
//   (7, 0x03 / 0x0e / 0x04 / 0x05) L2 M12 (args 0 / 1 / 2 / 3) at f152: count 0x1625058[arg] shell00 MODE 6, words owner X + dX, Y + dY
//     (u16 pairs 0x17bde24[arg]), Z 0; the point a GOT zero vector (mode 6 takes joint 1, offset (0, 0, 800))
//   (7, 0x0b) L2 M33 at f160: three MODE 7, words owner X, Y + 0xd555 / 0xc000 / 0xa38e (joint 3)
//   (7, 0x1d) L0 M9 -> f80 L4 M2 -> L4 M1 -> L4 M7, phase 4 at tune 0 (60): the target within tune 1 (2000) flat -> MODES 23 + 24, else
//     25 + 26 (joint -1: his position, (-200 / 200, 0, 900) turned by his Y word, Y -30 / 30 or -15 / 15 degrees)
const ICE038_FRAMES = [210, 246, 282, 318, 354, 390, 426, 462, 498, 534, 570].map(f);
const ICE038_OFFS = [[600, 2000], [-700, 1800], [1000, 1500], [-1200, 1000], [1500, 100], [-1500, 200], [1100, -800], [-500, -400], [600, 100],
  [-1200, -1200], [250, -2000], [-800, -2000], [800, 3000], [-500, 2500], [600, 2500], [-600, 3000], [0, 2000], [1300, 900], [-600, 1000],
  [1100, -400], [-1200, -200], [500, 1000], [700, -1200], [1300, -1500], [-600, 1000], [100, 300], [300, -200], [-200, -300], [-300, 100],
  [200, 100]].map(p => p.map(f));
const ICE038_LISTS = [[0, 1, 2, 3, 25], [4, 5, 6, 7, 26], [8, 9, 10, 11, 27], [12, 13, 14, 15, 16, 4, 5, 6, 7, 28], [16, 17, 18, 19, 20, 21, 22, 23, 24, 29],
  [0, 1, 2, 3, 5, 21, 25], [4, 5, 6, 7, 9, 22, 26], [8, 9, 10, 11, 23, 19, 27], [0, 1, 2, 3, 5, 21, 16, 17, 18, 25], [4, 5, 6, 7, 9, 22, 18, 8, 19, 27],
  [8, 9, 10, 11, 23, 20, 19, 22, 7, 26], [12, 13, 14, 15, 16, 4, 5, 6, 7, 25]];
const ICE038_FRAMES2 = [210, 235, 260, 285, 310, 335, 360, 385, 400, 425, 450, 475, 500, 525].map(f);
const ICE038_WORLD = [[[-1650, -3700], [-740, -3135], [-3310, -2630], [-4050, -490], [-3100, -1300], [-4800, -3300], [-3100, -4230], [-830, -760],
  [-1730, -1035], [-4690, -1280], [-1865, -320], [-1950, -2500], [-2900, -820], [-3600, -1400]],
  [[1500, -4000], [1950, -2300], [1140, -2700], [-500, -1050], [300, 2110], [0, -2000], [50, -3750], [2070, 0], [850, -350], [850, -950],
  [1450, -1400], [2000, -1300], [-150, 30], [1100, -1450]]].map(t => t.map(p => p.map(f)));
const ICE038_SPREAD = [[[1820, 0], [910, 5461], [910, 60076]], [[0, 0], [0, 10923], [0, 54614]], [[0, 21845], [0, 43692]], [[910, 28217], [910, 37320]]];
// the draw's rounds (0xe5c28c..0xe5c2b4): i times v = (v == 0) ? 1 : (v % 176) & 0x53
function jitter038(H, i){ let v = H & 0xffff; for (let k = 0; k < (i & 7); k++) v = v === 0 ? 1 : (v % 176) & 0x53; return v; }
function spawn038(state, D, a, ctx, input, out){
  const own = ctx.own001, sp = a.spawns[0], J = state.prevJoints;
  const no = (mode, F, why) => out.refused.push({ action: a.action, shell: 'shell00', mode, frame: F, why: 'em038_00 shell00: ' + why });
  const make = (mode, F, P, W) => {
    const S = spawnRock(state, D, { ...a, shell: 'shell00', mode, frame: F }, J, ctx,
                        { requestPos: P, requestAngles: W, ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(),
                          target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ,
                          rng: () => rng16(state) });
    if (S){ out.spawned.push(S); state.shells.push(S); } else no(mode, F, 'the init refused');
  };
  if (!own.facing){ for (const F of (sp.frames || [])) if (pass001(state, F)) no(null, F, 'no owner facing (input.owner.y)'); return; }
  const H = H73E8_STANDIN;
  if (sp.maker === 0xe5c168){
    if (state.shot038 == null || state.hist[1] < state.hist[0]) state.shot038 = 0;     // P+0x1a2 = 0 at the action start
    const i = state.shot038, list = ICE038_LISTS[sp.k];
    if (i >= list.length || i >= ICE038_FRAMES.length || !pass001(state, ICE038_FRAMES[i])) return;
    const M = jointMatrix(J, 1);
    if (!M){ no(null, ICE038_FRAMES[i], 'no joint 1'); return; }
    const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), [ox, oz] = ICE038_OFFS[list[i]];
    const v = jitter038(H, i), b = f(f(v & 0xff) + f(v & 0xff));
    const x = f(M[12] + mla(f(ox * cs), oz, sn)), z = f(mls(f(oz * cs), ox, sn) + M[14]);
    const P = [f(x + mla(f(0 * 1.0), b, 0.0)), f(6000.0), f(mls(f(b * 1.0), 0.0, 0.0) + z)];
    make(i + 1 >= list.length ? 1 : 0, ICE038_FRAMES[i], P, [0, 0, 0]);
    state.shot038 = i + 1;
  } else if (sp.maker === 0xe5c790){
    if (state.shot038 == null || state.hist[1] < state.hist[0]) state.shot038 = 0;
    const i = state.shot038;
    if (i >= ICE038_FRAMES2.length || !pass001(state, ICE038_FRAMES2[i])) return;
    const [X, Z] = ICE038_WORLD[sp.r5 ? 1 : 0][i], v = jitter038(H, i), b = f(f(v & 0xff) + f(v & 0xff));
    make(i <= 12 ? 2 : 3, ICE038_FRAMES2[i], [f(X + mla(f(1.0 * 0.0), b, 0.0)), f(6000.0), f(Z + mls(f(b * 1.0), 0.0, 0.0))], [0, 0, 0]);
    state.shot038 = i + 1;
  } else if (sp.maker === 0xe602dc){
    if (!pass001(state, sp.frames[0])) return;
    for (const [dX, dY] of ICE038_SPREAD[sp.arg])
      make(6, sp.frames[0], [0, 0, 0], [((own.ownerX >>> 0) + dX) >>> 0, ((own.ownerY >>> 0) + dY) >>> 0, 0]);
  } else if (sp.maker === 0xe612ec){
    if (!pass001(state, sp.frames[0])) return;
    for (const dY of [0xd555, 0xc000, 0xa38e]) make(7, sp.frames[0], [0, 0, 0], [own.ownerX >>> 0, ((own.ownerY >>> 0) + dY) >>> 0, 0]);
  } else if (sp.maker === 0xe61980){
    if (!pass001(state, sp.frames[0])) return;
    if (!own.ownerPos || !own.target){ no(null, sp.frames[0], 'no owner position / target (the 2000 test)'); return; }
    const dx = f(own.target[0] - own.ownerPos[0]), dz = f(own.target[2] - own.ownerPos[2]);
    const near = !(f(f(2000.0) * f(2000.0)) < mla(mla(f(0.0), dx, dx), dz, dz));   // 0xe61a50: vcmpe tune1^2, d^2 / bpl -> near
    for (const mode of near ? [23, 24] : [25, 26]) make(mode, sp.frames[0], [0, 0, 0], [0, 0, 0]);
  }
}
{
  const D = SHELL_DATA.em038_00;
  delete D.beamsOnly;
  D.shells.shell00 = { id: 0xce, cls: 'uShellEm038_sp_00', base: 'base00', reader: 0xe63400, folder: 'shell\\em\\em038_00_shell00',
    cmn: { ints: [2], floats: [10.0, 1.0, 0.20000000298023224, 0.699999988079071, 0.10000000149011612], vecs: [] },
    lists: { 0: { list: 'u', pel: 'em038_00u' } },
    modes: {
@@MODES@@
    },
    hitdata: [[2, 300], [2, 300], [2, 300], [2, 300], [2, 300], [2, 300], [2, 300], [2, 300]] };
  const A = (st, n, list, clip, sp) => ({ action: [st, n], code: 'em038', list, clip, partners: [], pick: 'ai',
    variant: st + ':0x' + n.toString(16).padStart(2, '0'), shell: 'shell00', spawns: [Object.assign({ shell: 'shell00' }, sp)] });
  for (let k = 0; k < 12; k++) D.actions.push(A(1, 8 + k, '2', 'Motion[4]', { maker: 0xe5c168, k, frames: ICE038_FRAMES.slice(0, ICE038_LISTS[k].length), modes: [0, 1] }));
  D.actions.push(A(1, 0x15, '2', 'Motion[4]', { maker: 0xe5c790, r5: 0, frames: ICE038_FRAMES2, modes: [2, 3] }));
  D.actions.push(A(1, 0x18, '2', 'Motion[4]', { maker: 0xe5c790, r5: 1, frames: ICE038_FRAMES2, modes: [2, 3] }));
  [[0x03, 0], [0x0e, 1], [0x04, 2], [0x05, 3]].forEach(([n, arg]) => D.actions.push(A(7, n, '2', 'Motion[12]', { maker: 0xe602dc, arg, frames: [f(152.0)], modes: [6] })));
  D.actions.push(A(7, 0x0b, '2', 'Motion[33]', { maker: 0xe612ec, frames: [f(160.0)], modes: [7] }));
  D.actions.push(A(7, 0x1d, '4', 'Motion[7]', { maker: 0xe61980, frames: [f(60.0)], modes: [23, 24, 25, 26] }));
}

