// ---- GRIMCLAW TIGREX (em032_04, uEm032_00 at variant 4): his shells -- dev/em032-shells-spec.md 9 (shells agent, 2026-10-19) ------
// The class is Tigrex's (spawn032s00 / params032s00 / landing032s00 / params032s01 above). His slots: +0xcac8 = 0xbf (sp_00, base00),
// +0xcac4 = 0xc0 (sp_01, base01: the reader's id switch takes his body 0xe35c50). His shell00 flight is cmn float 0 = 0.0: a shell lives
// while its hit slot does (flightTimer's base00 arm, input.hitLife). The rows: the census of his table's reach (cengen11 + the class's
// own changes) and the per-frame census (fb/pfgen.py) -- every create in his reach is below.
// his action tune em032_04_actiontune (FUP, 44 floats, 2 vecs: both (0, 0, 0)) -- the indices his code reads
const TUNE032_04 = [1.1, 1.5, 0.0, 42.0, 50.0, 10.0, 30.0, 0.0, 50.0, 0.0, 106.0, 20.0, 0.0, -500.0, -300.0, 1000.0, 0.0, -1000.0, 0.0,
  132.0, 100.0, 0.0, 10.0, 22.0, 22.0, 56.0, 50.0, 0.0, 14.0, 36.0, 14.0, 46.0, 0.0, 136.0, 106.0, 0.0, 0.2, 0.0, 0.0, 10.0, 0.0, 100.0,
  -300.0, 20.0].map(f);
// the floor selector ctl+0x29 (spawn032s00's note): input.floorFlags / floorAttr, absent 0
const sel032 = input => { const fl = input.floorFlags >>> 0, at = input.floorAttr & 0xff; return (fl & 6) ? 2 : (fl & 0x40) ? 3 : ((at >> 1) & 1); };
const words032 = own => [own.ownerX & 0xffff, own.ownerY & 0xffff, own.ownerZ & 0xffff];   // e+0xfe8..+0xff0 (0xc2710, low halves)
// 0xe22878(e, kind, side, yoff) (READ whole): joint 50 (side 0) / 40; its position (0xc164c); the ray 0x183664 from 100 above it to 300
// below (mask 0x40) -> y = the hit (ray057: the stage stand-in's floor; no hit -> refused by name, the ROM's s0 then NOT READ); shell01
// [e+0xcac4] mode kind + 10 (kind < 3), +0x10.. that point, +0x20.. a GOT vector, +0x30.. e+0xfe8 / e+0xfec + yoff / e+0xff0, +0x3c 0xffff
function make032g01(state, D, ctx, own, mode, joint, words, yoff, F, action, J){
  const M = jointMatrix(J, joint);
  const g = M ? ray057([M[12], M[13], M[14]], ctx.stage) : null;
  if (!g) return { why: 'no ground under joint ' + joint + ' (the ray 0x183664 from 100 above it to 300 below)' };
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode, position: g, angles: [words[0], (words[1] + yoff) >>> 0, words[2]],
                                          frame: F, action }, own, J, ctx, null);
  return S ? { S } : { why: 'the init refused (base01)' };
}
function put032(state, out, r, a, mode, F){
  if (r && r.S){ state.shells.push(r.S); out.spawned.push(r.S); }
  else out.refused.push({ action: a ? a.action : null, shell: 'shell01', mode, frame: F, why: 'em032_04 shell01: ' + (r ? r.why : '?') });
}
// the actions: one dispatcher for his own makers (code 'em032g'), by the row's `maker`
function spawn032g(state, D, a, ctx, input, out){
  const own = ctx.own001, J = state.prevJoints, sp = a.spawns[0], rage = sp.rage != null ? !!sp.rage : !!input.rage;
  const no = (mode, F, why) => out.refused.push({ action: a.action, shell: sp.shell, mode, frame: F, why: 'em032_04 ' + sp.shell + ': ' + why });
  if (!own.ownerPos || !own.facing){ for (const F of sp.frames) if (pass001(state, F)) no(null, F, 'no owner position / facing (input.ownerPos / owner.y)'); return; }
  const sel = sel032(input);
  if (sp.maker === 0xe305cc){
    // (7, 0x5d) L9 M4 / (7, 0x65) L9 M12: 0xe303a4 phase 1 at the crossing of tune 0xa (106) -> 0xe305cc(e, side, r6): rage = r6 ? 1 :
    // 0x81670; joint 50 (side 0) / 40; ctl = its position; sel > 3 none; mode 0x1623fb8[rage * 4 + sel] = (20 26 38 32 / 21 27 39 33);
    // the point = ctl + its 3x3 x the tune vec (side 0 -> vec 1, else 0: both (0, 0, 0)); words e+0xfe8.., Y + (side 0 ? 1 : -1) x tune
    // 0xb (20) degrees (uxtah); 0x3f883c(0x30) +4 [e+0xcac8], +8 the mode, +0x2e 0xffff
    for (const F of sp.frames){
      if (!pass001(state, F)) continue;
      if (sel > 3){ no(null, F, 'floor selector ' + sel); continue; }
      const mode = [20, 26, 38, 32, 21, 27, 39, 33][(rage ? 4 : 0) + sel], joint = sp.side ? 40 : 50;
      const M = jointMatrix(J, joint);
      if (!M){ no(mode, F, 'no joint ' + joint); continue; }
      const W = words032(own), dY = u16(s32(mla(0.5, f(f(sp.side ? -1.0 : 1.0) * TUNE032_04[0xb]), DEG_TO_U16)));
      const P = [0, 1, 2].map(i => f(mla(mla(f(0.0 * M[4 + i]), 0.0, M[i]), 0.0, M[8 + i]) + M[12 + i]));
      const S = spawnRock(state, D, { ...a, shell: 'shell00', mode, frame: F }, J, ctx,
                          { requestPos: P, requestAngles: [W[0], (W[1] + dY) >>> 0, W[2]], ownerPos: own.ownerPos.slice(), size: own.size.slice(),
                            target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
      if (S && own.hitLife) S.slots = slotsOf011(D.shells.shell00, S.mode, out.refused).filter(sl => sl.slot === 0);
      if (S){ out.spawned.push(S); state.shells.push(S); } else no(mode, F, 'the init refused');
    }
  } else if (sp.maker === 0xe313a4){
    // (7, 0x77) phase 2 on L9 M19 at tune 8 (50) (0xe3121c: L9 M5 from 60 -> its end -> L9 M19) -> 0xe313a4(e, r1): rage = r1 ? 1 : 0x81670;
    // ctl = joint 50's position, sel > 3 none; the point = ctl + 40 x joint 50's row 1 (the volley's); the modes 0x169daa2[rage x 12 +
    // sel x 3 + 0..2]: the first always, the other two only when the quest's number (0x49930) - 11 <= 5; words a GOT zero vector
    for (const F of sp.frames){
      if (!pass001(state, F)) continue;
      if (sel > 3){ no(null, F, 'floor selector ' + sel); continue; }
      const T = [23, 57, 58, 29, 59, 60, 41, 61, 62, 35, 63, 64, 45, 66, 67, 48, 68, 69, 54, 70, 71, 51, 72, 73], b = (rage ? 12 : 0) + sel * 3;
      const M = jointMatrix(J, 50);
      if (!M){ no(T[b], F, 'no joint 50'); continue; }
      const C = [M[12], M[13], M[14]];
      const P = [0, 1, 2].map(i => f(mla(mla(f(M[4 + i] * 40.0), M[i], 0.0), M[8 + i], 0.0) + C[i]));
      const q = own.questLevel, extra = q != null && ((q - 11) >>> 0) <= 5;
      for (const mode of extra ? [T[b], T[b + 1], T[b + 2]] : [T[b]]){
        const S = spawnRock(state, D, { ...a, shell: 'shell00', mode, frame: F }, J, ctx,
                            { requestPos: P.slice(), requestAngles: [0, 0, 0], ownerPos: own.ownerPos.slice(), size: own.size.slice(),
                              target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
        if (S && own.hitLife) S.slots = slotsOf011(D.shells.shell00, S.mode, out.refused).filter(sl => sl.slot === 0);
        if (S){ out.spawned.push(S); state.shells.push(S); } else no(mode, F, 'the init refused');
      }
    }
  } else if (sp.maker === 0xe32018){
    // (7, 0x7a) L9 M15 (side 1: joint 50) / (7, 0x7c) L9 M18 (joint 40), phase 1 at tune 0x2b (20): the ray from the joint (100 above,
    // 300 below) -> shell01 [e+0xcac4] MODE 8 at (its x, the ground, its z), words e+0xfe8.., +0x20 a GOT vector, +0x3c 0xffff
    for (const F of sp.frames){
      if (!pass001(state, F)) continue;
      put032(state, out, make032g01(state, D, ctx, own, 8, sp.side ? 50 : 40, words032(own), 0, F, a.action, J), a, 8, F);
    }
  } else if (sp.maker === 0xe30998){
    // (7, 0x5f) 0xe30998 (entered from (7, 0x5e) / (7, 0x6b) on L9 M1 and (7, 0x60) / (7, 0x6c) on L9 M2 by vt+0x3d0): phase 0
    // ctl+0x3d = the rage (arg 0: 0x81670), ctl+0x40 = the target's bearing from his facing (atan2 -> u16, less P+0x54, folded) / 5461
    // clamped to [-1, 1], then L9 M6 + M7 / M8 (calm) or L9 M9 + M10 / M11 (0xb04d0, blend 2) -- the row's clip. Phase 1, variant 4:
    // A = the crossing of 18 (22 enraged), B = tune 3 (42; tune 4, 50, enraged); on either the ray at joint 40 (100 above, 300 below)
    // and the Y offset u16(0.5 + ctl+0x40 x tune (ctl+0x40 > 0 ? 5 : 6) x 182.04); at A 0xe22878(e, rage ? 2 : 1, 1, offset) -> mode
    // 11 / 12; at B shell01 at the ground point with the words +0x30.. e+0xfe8 / e+0xfec + offset / e+0xff0: calm modes 4 and 6, enraged
    // 5, 6 and 7 (7: the Y word + 0x4000; 6 / 7: +0x3c = ctl+0x64, a random draw)
    const T = own.target, P0 = own.ownerPos;
    let c40 = f(0);
    if (T){
      let d = (u16(s32(mla(0.5, atan2f(f(T[0] - P0[0]), f(T[2] - P0[2])), RAD_TO_U16))) - (own.ownerY | 0)) | 0;
      d = d > 0x8000 ? d - 0x10000 : d < -0x8000 ? d + 0x10000 : d;
      c40 = f(Math.max(-1, Math.min(1, f(f(d) / f(5461.0)))));
    }
    const A = rage ? 22.0 : 18.0, B = TUNE032_04[rage ? 4 : 3];
    const hitA = pass001(state, f(A)), hitB = pass001(state, B);
    if (!hitA && !hitB) return;
    const yoff = u16(s32(mla(0.5, f(c40 * TUNE032_04[c40 > 0 ? 5 : 6]), DEG_TO_U16)));
    if (hitA) put032(state, out, make032g01(state, D, ctx, own, rage ? 12 : 11, 40, words032(own), yoff, A, a.action, J), a, rage ? 12 : 11, A);
    if (hitB){
      const M = jointMatrix(J, 40), g = M ? ray057([M[12], M[13], M[14]], ctx.stage) : null, W = words032(own);
      for (const [mode, dy] of rage ? [[5, 0], [6, 0], [7, 0x4000]] : [[4, 0], [6, 0]]){
        if (!g){ no(mode, B, 'no ground under joint 40 (the ray 0x183664)'); continue; }
        const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode, position: g.slice(), angles: [W[0], (W[1] + yoff + dy) >>> 0, W[2]],
                                                frame: B, action: a.action }, own, J, ctx, null);
        put032(state, out, S ? { S } : { why: 'the init refused (base01)' }, a, mode, B);
      }
    }
  }
}
// his +0x150 0xe35e00 (READ whole; flag 0x20 only, after the switch): id 0xc0 with mode 8 or 14, once (+0x1654): +0x1658 counted down by
// the step (clamped at 0); at <= 0 -> 0xe35ea0: shell01 0xc0 mode 14 (from 8) / 15 (from 14) at this shell's +0x40, its words, +0x3c
// its +0x13dc -- the wave that steps on (vec (0, 0, 700) -> 1000 -> 1500)
function wave032(S, ctx){
  if (S.globalId !== 0xc0 || (S.modeIndex !== 8 && S.modeIndex !== 14) || S.wave032 || !ctx.create) return;
  const t = S.k.f1658;
  if (t > 0){
    const t2 = f(t - f(ctx.dt));
    S.k.f1658 = (0 >= t2) ? f(0) : t2;
    if (t2 > 0) return;
  } else S.k.f1658 = f(0);
  S.wave032 = true;
  ctx.create(S, 'shell01', { mode: S.modeIndex === 14 ? 15 : 14, position: S.position.slice(), angles: S.angles.map(w => w >>> 0),
                             action: S.action, frame: S.spawnFrame });
}
// his frame handler's own rows (0xe21294 -> 0xe221ac, variant 4 alone, READ): while ENRAGED (0x81670), by the motion id at a channel-0
// crossing (0xb0974), 0xe22878(e, 0, side, 0) -> shell01 mode 10 (u 120) -- L2 M10 f66 (40) / f98 (50) / f134 (40); L2 M15 f74 (50) /
// f96 (40) / f132 (50); L2 M16 f74 (40) / f96 (50) / f132 (40); L9 M4 f16 (40); L9 M12 f16 (50)
function perFrame032g(state, D, ctx, input, out, fresh){
  const mid = motionIdOf(input.list, input.clip);
  if (mid == null || fresh || !state.hist || !input.rage) return;
  const rows = D.perFrame032g.filter(r => r.ids.includes(mid));
  const own = ctx.own001;
  for (const row of rows) row.frames.forEach((F, j) => {
    if (!pass001(state, f(F))) return;
    if (!own.ownerPos || !own.facing){ out.refused.push({ perFrame: mid, shell: 'shell01', mode: 10, why: 'no owner position / facing' }); return; }
    put032(state, out, make032g01(state, D, ctx, own, 10, row.sides[j] ? 40 : 50, words032(own), 0, F, null, state.prevJoints), null, 10, F);
  });
}
const act032g = (st, n, list, clip, sp, x = {}) => Object.assign({ action: [st, n], code: 'em032g', list, clip, partners: [], pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns: [sp] }, x);
SHELL_DATA.em032_04 = {
  name: 'Grimclaw Tigrex',
  lists: { 0: { list: 'u', pel: 'em032_04u' } },
  actions: [
    // the volley 0xe2aacc, as Tigrex's: (7, 0x07) L2 M5 68 / 72 / 76; 0xe31834 (variant 4 sets the clip: tune 0x16 / 0x17 the blend)
    // (7, 0x69) L2 M26 (arg 1) 70 / 74 / 78, (7, 0x6a) L2 M27 (arg 0: r3 set -- joint 40, the shot mirrored) 68 / 72 / 76
    { action: [7, 0x07], code: 'em032s00', list: '2', clip: 'Motion[5]', partners: [], frame: 68, shell: 'shell00', modes: [0, 1, 2],
      spawns: [{ at: 0xe2ade4, kind: 'volley', frames: [68.0, 72.0, 76.0], shell: 'shell00', modes: [0, 1, 2] }], spawner: 0xe2a770, pick: 'ai', variant: '7:0x07' },
    { action: [7, 0x69], code: 'em032s00', list: '2', clip: 'Motion[26]', partners: [], frame: 70, shell: 'shell00', modes: [0, 1, 2],
      spawns: [{ at: 0xe2ade4, kind: 'volley', frames: [70.0, 74.0, 78.0], shell: 'shell00', modes: [0, 1, 2] }], spawner: 0xe31834, pick: 'ai', variant: '7:0x69' },
    { action: [7, 0x6a], code: 'em032s00', list: '2', clip: 'Motion[27]', partners: [], frame: 68, shell: 'shell00', modes: [2, 1, 0],
      spawns: [{ at: 0xe2ade4, kind: 'volley', frames: [68.0, 72.0, 76.0], shell: 'shell00', modes: [2, 1, 0], mirror: true }], spawner: 0xe31834, pick: 'ai', variant: '7:0x6a' },
    act032g(7, 0x5d, '9', 'Motion[4]', { maker: 0xe305cc, side: 0, frames: [106.0], shell: 'shell00', modes: [20, 21] }),
    act032g(7, 0x77, '9', 'Motion[19]', { maker: 0xe313a4, frames: [50.0], shell: 'shell00', modes: [23, 45] }),
    act032g(7, 0x7a, '9', 'Motion[15]', { maker: 0xe32018, side: 1, frames: [20.0], shell: 'shell01', modes: [8] }),
    act032g(7, 0x5f, '9', 'Motion[6]', { maker: 0xe30998, rage: 0, frames: [18.0, 42.0], shell: 'shell01', modes: [11, 4, 6] },
            { partners: ['Motion[7]', 'Motion[8]'] }),
    act032g(7, 0x5f, '9', 'Motion[9]', { maker: 0xe30998, rage: 1, frames: [22.0, 50.0], shell: 'shell01', modes: [12, 5, 6, 7] },
            { partners: ['Motion[10]', 'Motion[11]'] }),
  ],
  shells: {
    shell00: {
      id: 0xbf, cls: 'uShellEm032_sp_00', base: 'base00', reader: 0xe35410, folder: 'shell\\em\\em032_04_shell00',
      cmn: { ints: [], floats: [0.0], vecs: [] },
      lists: { 0: { list: 'u', pel: 'em032_04u' } },          // its .shl's EffectLists: [em032_04u, null x 7]
      modes: {
@@MODES00@@
      },
      hitdata: [[0, 300], [0, 300], [0, 300], [0, 300], [2, 40], [4, 300], [4, 300], [4, 300], [4, 300], [4, 300], [4, 300], [4, 300], [4, 300], [2, 40], [2, 100]],
    },
    shell01: {
      id: 0xc0, cls: 'uShellEm032_sp_01', base: 'base01', reader: 0xe35ac4, folder: 'shell\\em\\em032_04_shell01',
      lists: { 1: { list: 'u', pel: 'em032_04u' } },          // its .shl's EffectLists: [null, em032_04u, null x 6] -- list 0 is null
      modes: {
@@MODES01@@
      },
      hitdata: [[14, 10], [0, 8], [60, 8], [4, 8], [60, 8], [10, 8], [100, 4], [100, 8], [4, 8], [90, 8], [90, 8], [90, 8]],
    },
  },
  // the class's frame handler: Tigrex's dust rows (his shell01 mode 0 names list 0, null on him: made, draws nothing) and his own
  perFrame032: [{ ids: [0x01c], frames: [18.0], mode: 0 }, { ids: [0x101], frames: [58.0], mode: 0 }, { ids: [0x102], frames: [2.0], mode: 0, noAction: [[3, 5]] },
                { ids: [0x208], frames: [14.0], mode: 0 }],
  perFrame032g: [{ ids: [0x20a], frames: [66.0, 98.0, 134.0], sides: [1, 0, 1], mode: 10 }, { ids: [0x20f], frames: [74.0, 96.0, 132.0], sides: [0, 1, 0], mode: 10 },
                 { ids: [0x210], frames: [74.0, 96.0, 132.0], sides: [1, 0, 1], mode: 10 }, { ids: [0x904], frames: [16.0], sides: [1], mode: 10 },
                 { ids: [0x90c], frames: [16.0], sides: [0], mode: 10 }],
};

