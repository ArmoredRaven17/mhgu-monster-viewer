// ---- SEREGIOS (em077_00): his thrown bladescales, shell28 = 0x13e uShellEm077_sp_28 on base28 (above) -- dev/em077-shells-spec.md
// (shells agent, 2026-10-19; emulator check dev/shells-seregios28-check.mjs). Every maker: 0x411068(0x24) (cSetupParamEmBase28), +4
// 0x13e, +8 the mode, +0xc the owner, +0x10 the degree index (into the common vecs), +0x14 [ctl+0x7c] (a u16 the action's phase 0 draws,
// 0x16b4b4; not read by base28's init), +0x18 0, +0x1c the aim byte, +0x20 the clamp index; 0x48b884 at once. The census of his reach
// (the action mains by trgen, phase 0 run first and its ctl carried; every frame test answered alone):
//   (1, 0x17) / (7, 0xc) L2 M4 and (1, 0x18) / (7, 0xb) L2 M3 (0xfe0c80..; the helper 0xfea544(e, side)) at 55 / 60 / 65, ONLY at
//     questRank >= 5 (0xfe0d44 / 0xfe0dc0: `cmp r0, #5; blge`): index 52 / 54 / 56 (side 1) or 51 / 53 / 55 (side 0), aim 0; the mode
//     6, or 12 when the tail is severed (vt+0x370(e, 1) = 0xa3bf4, P+0x3b4 bit 0; 0xfea578..0xfea5e4 -- the two calls ask the same)
//   (1, 0x19 / 0x1b), (7, 0 / 3 / 0x38 / 0x3a) phase 2 on L2 M26 (phase 0 L2 M25): mode 9 at 70 / 73 / 76 / 79, index 6..9; (7, 0x3b)
//     the same with 10..13
//   (7, 4) / (7, 0x11) L2 M21 at 69 / 74 / 80: aim 1, index 38 / 39 / 40, clamp 2 / 3 / 4; the mode by ctl+0x70 (the action's phase
//     0 writes it from a table by its arg: (7, 4) 0, (7, 0x11) 1): 0 / 7
//   (7, 5) / (7, 0x12) L2 M20 at 62 / 67 / 72 / 90 / 95 / 100: aim 1, index 41..46, clamp 5; ctl+0x70 0 -> 6 (5 severed), 1 -> 13
//     (12 severed) (0xfe9360..0xfe93c8)
//   (7, 8) / (7, 0x39) phase 2 on L2 M34 (phase 0 L2 M33): mode 8 at 76 / 79 / 82 / 85, index 14..17; (7, 0x3e) / (7, 0x3f) (phase 0
//     L2 M70, phase 1 L2 M34 from frame 58) 18..21; (7, 0x40) 22..25
//   (7, 0x2d) / (7, 0x2f) L2 M65, (7, 0x2e) / (7, 0x30) L2 M66 at 85 / 91, questRank >= 5: mode 7, index 47 / 49 (M65) or 48 / 50
//   THE FRAME HANDLER 0xfddfcc (vt+0x208, the +0x28 pass after the action; perFrame077s28): by the motion id L2 M29 (0x21d) at 8 and
//     13, L2 M48 (0x230) at 66 and 71 (channel-1 crossings 0xb09b0), two shells a crossing: the first mode ctl+0x70 ? 10 : 3, the
//     second ctl+0x74 ? 11 : 4; aim 1; index 26 / 27, 28 / 29 (ctl+0x78 != 0 on L2 M29: 30 / 31, 32 / 33), clamp 0 (L2 M29); 34 / 35,
//     36 / 37, clamp 1 (L2 M48, ctl+0x78 not read). ctl+0x70 / +0x74 / +0x78 are the PLAYING action's (its phase 0 writes them; the
//     sweep of every action): (7, 9..0x1e) play L2 M29 in phase 1, (7, 0x23..0x26 / 0x31..0x34) L2 M48 in phase 0 -- each row's ctl077
function spawn077s28(state, D, a, ctx, input, out){
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns || []){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.g && !(own.rank >= 5)) continue;                  // questRank >= 5: the ROM's own gate, not a refusal
    const m = own.tailSevered && sp.sev != null ? sp.sev : sp.mode;
    make28(state, D, { mode: m, i10: sp.i10, aim: sp.aim, i20: sp.i20 }, own, J, ctx, out, a.action, f(sp.frame));
  }
}
function perFrame077s28(state, D, ctx, input, out, fresh, a){
  if (fresh || !state.hist) return;
  const mid = motionIdOf(input.list, input.clip);
  const row = mid == null ? null : D.perFrame077s28.find(r => r.ids.includes(mid));
  if (!row) return;
  const due = row.shots.filter(s => pass001(state, f(s.frame)));
  if (!due.length) return;
  const c = a && a.ctl077;
  for (const s of due){
    if (!c){ out.refused.push({ perFrame: mid, shell: 'shell28', mode: null, frame: s.frame,
                                why: 'em077_00 shell28: the frame handler picks the mode by ctl+0x70 / +0x74 (+0x78 the index), which the action playing this clip writes in its phase 0 -- no action row names them' }); continue; }
    const m = s.second ? (c[1] ? 11 : 4) : (c[0] ? 10 : 3);
    const i10 = row.ctl78 && c[2] ? s.i10b : s.i10;
    make28(state, D, { mode: m, i10, aim: 1, i20: row.i20 }, ctx.own001, state.prevJoints || ctx.J, ctx, out, a.action, f(s.frame));
  }
}
{
  const D = SHELL_DATA.em077_00;
  D.shells.shell28 = { id: 0x13e, cls: 'uShellEm077_sp_28', base: 'base28', reader: 0xfeef90, folder: 'shell@@BS@@em@@BS@@em077_00_shell28',
    lists: { 0: { list: 'u', pel: 'em077_00u' } },
    cmn: { ints: [], floats: [], vecs: @@CMN@@ },
    modes: {
@@MODES@@
    },
    hitdata: [[0, 99], [0, 99]] };
  const A = (st, n, clip, shots, x) => Object.assign({ action: [st, n], code: 'em077s28', list: '2', clip, partners: [], pick: 'ai',
    variant: st + ':0x' + n.toString(16).padStart(2, '0'), shell: 'shell28', spawns: shots }, x || {});
  const S = (frames, mode, sev, i10s, aim, i20s, g) => frames.map((F, i) => ({ frame: F, mode, sev, i10: i10s[i], aim,
    i20: Array.isArray(i20s) ? i20s[i] : i20s, g: !!g }));
  for (const [st, n, side, clip] of [[1, 0x17, 1, 'Motion[4]'], [7, 0x0c, 1, 'Motion[4]'], [1, 0x18, 0, 'Motion[3]'], [7, 0x0b, 0, 'Motion[3]']])
    D.actions.push(A(st, n, clip, S([55, 60, 65], 6, 12, side ? [52, 54, 56] : [51, 53, 55], 0, 0, true)));
  for (const [st, n] of [[1, 0x19], [1, 0x1b], [7, 0x00], [7, 0x03], [7, 0x38], [7, 0x3a]])
    D.actions.push(A(st, n, 'Motion[26]', S([70, 73, 76, 79], 9, null, [6, 7, 8, 9], 0, 0)));
  D.actions.push(A(7, 0x3b, 'Motion[26]', S([70, 73, 76, 79], 9, null, [10, 11, 12, 13], 0, 0)));
  D.actions.push(A(7, 0x04, 'Motion[21]', S([69, 74, 80], 0, null, [38, 39, 40], 1, [2, 3, 4])));
  D.actions.push(A(7, 0x11, 'Motion[21]', S([69, 74, 80], 7, null, [38, 39, 40], 1, [2, 3, 4])));
  D.actions.push(A(7, 0x05, 'Motion[20]', S([62, 67, 72, 90, 95, 100], 6, 5, [41, 42, 43, 44, 45, 46], 1, 5)));
  D.actions.push(A(7, 0x12, 'Motion[20]', S([62, 67, 72, 90, 95, 100], 13, 12, [41, 42, 43, 44, 45, 46], 1, 5)));
  for (const [n, i10s] of [[0x08, [14, 15, 16, 17]], [0x39, [14, 15, 16, 17]], [0x3e, [18, 19, 20, 21]], [0x3f, [18, 19, 20, 21]], [0x40, [22, 23, 24, 25]]])
    D.actions.push(A(7, n, 'Motion[34]', S([76, 79, 82, 85], 8, null, i10s, 0, 0)));
  for (const [n, clip, i10s] of [[0x2d, 'Motion[65]', [47, 49]], [0x2f, 'Motion[65]', [47, 49]], [0x2e, 'Motion[66]', [48, 50]], [0x30, 'Motion[66]', [48, 50]]])
    D.actions.push(A(7, n, clip, S([85, 91], 7, null, i10s, 0, 0, true)));
  // the frame handler's players: no shells of their own, their ctl+0x70 / +0x74 / +0x78 (phase 0, the sweep)
  for (const [n, c] of [[0x09, [0, 0, 0]], [0x0a, [0, 0, 0]], [0x0f, [0, 0, 1]], [0x10, [0, 0, 1]], [0x13, [1, 0, 0]], [0x14, [0, 1, 0]],
                        [0x15, [1, 1, 0]], [0x16, [1, 0, 0]], [0x17, [0, 1, 0]], [0x18, [1, 1, 0]], [0x19, [1, 0, 1]], [0x1a, [0, 1, 1]],
                        [0x1b, [1, 1, 1]], [0x1c, [1, 0, 1]], [0x1d, [0, 1, 1]], [0x1e, [1, 1, 1]]])
    D.actions.push(A(7, n, 'Motion[29]', [], { ctl077: c }));
  for (const [n, c] of [[0x23, [0, 0, 0]], [0x24, [1, 0, 0]], [0x25, [0, 1, 0]], [0x26, [1, 1, 0]], [0x31, [0, 0, 0]], [0x32, [1, 0, 0]],
                        [0x33, [0, 1, 0]], [0x34, [1, 1, 0]]])
    D.actions.push(A(7, n, 'Motion[48]', [], { ctl077: c }));
  D.perFrame077s28 = [
    { ids: [0x21d], i20: 0, ctl78: true, shots: [{ frame: 8, i10: 26, i10b: 30 }, { frame: 8, second: true, i10: 27, i10b: 31 },
                                                 { frame: 13, i10: 28, i10b: 32 }, { frame: 13, second: true, i10: 29, i10b: 33 }] },
    { ids: [0x230], i20: 1, ctl78: false, shots: [{ frame: 66, i10: 34 }, { frame: 66, second: true, i10: 35 },
                                                  { frame: 71, i10: 36 }, { frame: 71, second: true, i10: 37 }] },
  ];
}
