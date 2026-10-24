// ---- AHTAL-NESET'S REQUESTS OF AHTAL-KA'S SHELL57 (0x17e, uShellEm088_sp_57, base57) -- gapJ (2026-10-21) --------------------------
// The object is the fight's (G = [GOT 0x1832980] -> 0x2132968): its maker 0x10aebac(G, rec) is the same record maker Ahtal-Ka's four
// use (SHELL_DATA.em088_00 above); Neset calls it from two sites of his own (every caller of 0x10ac10c / 0x10ac1ec, xref READ):
//   B6 0x10ac10c(e, k) (READ whole): rec +0 k, +4 mode = k + 0x18 (k < 3), +8 the owner e (Neset), +0xc placement 2 (G's spot of k),
//     +0x10 behaviour 6 (the lift, move57lift), +0x14 0, +0x18.. / +0x40.. the zero vector 0x1620e60, +0x30.. [0x19176b0], +0x4c the
//     delay 60.0 (0x42700000), +0x50 / +0x51 0, +0x54 1 (the trail, ef 2); handle -> e+0xccec + 4k. Called by (1, 8)'s main 0x10afc44
//     (0x10afdd8: k 1, its phase 1 sub 0 -- +0x1bc = 0, so the first phase-1 move) and (1, 0x15)'s main 0x10b029c (0x10b0584: k 0 at
//     its phase 1 sub 0, +0x1bc = tune 0x35 = 0.0; 0x10b067c: k 1 when +0x1bc = tune 0x36 = 40.0 has counted out, 0x7206c by dt).
//   B2 0x10ac1ec(e, k) (READ whole): joint 0x82 + k (k < 3; else 0xff): its world point (0xc164c) -> rec +0x30..; its record's
//     matrix (e+0x498 / e+0x494 +0x10..+0x4c) -> Euler (0x7c3a38) -> rec +0x40.. the words (else the zero vector's); mode
//     0x10aed14(G, k, 0x57) = k + 0x14; placement 3, behaviour 2 (the drop: to his block +0x40 + vec 3 turned by his facing), +0x14 0,
//     +0x4c 0 (no delay), +0x50 0, +0x51 1, +0x54 1 (the trail, ef 2); then e+0xccc1 + 12k = 0 (he no longer holds k). Called only by
//     0x10a7bac(e, 0) (0x10a7d58 k 0 then 0x10a7e44 k 1 when G+0x32 == 2; k 1 alone when G+0x32 == 4), from vt+0x204 0x10a6e58 at
//     the start of (1, 0x11) (0x10a75e4: never requested -- reqscan.py) and of (10, 0x8e) with G+0x32 == 2 (0x10a7424..0x10a747c).
// The model is the owner's [e+0xccb0 + 4k] (base57 0x42f15c: owner +0xb5f4 == 0x57 -> 0x10abf4c), rModel 0x8679 / 0x867a / 0x867b
// (0x10a4060 -> 0x10a40f4): Ahtal-Ka's rubble. Its records are the shell's own .shl's list, em088_00u. Modes 22 / 26 (k 2) are
// never asked (no caller passes k 2).
// G's spots before any object has moved (G+0x50 + 16k / G+0x80 + 16k): the static initialiser 0x10ae0e0 (init_array 0x18439dc)
// fills 0x21328b0 / 0x21328e0, which his vt+0x18 0x10a2ed8 hands to 0x10ae90c(G, k, ...) at 0x10a3160 -- his arena's own absolute
// points (as PATROL087), y the rest height -90.0; the angles (6, 0, 2) degrees in radians
const SPOT087 = [
  { pos: [1800.0, -90.0, 1600.0], angles: [0.10471975803375244, 0.0, 0.03490658476948738] },
  { pos: [-2100.0, -90.0, 1900.0], angles: [0.10471975803375244, 0.0, 0.03490658476948738] },
  { pos: [3300.0, -90.0, 3800.0], angles: [0.10471975803375244, 0.0, 0.03490658476948738] },
];
const D57N = () => ({ lists: SHELL_DATA.em088_00.lists, rubble: SHELL_DATA.em088_00.rubble,
                      shells: { shell57: SHELL_DATA.em088_00.shells.shell57 } });
// rows { start | frame, ev: 'ka57', k, b: 2 | 6 }
function make087ka57(state, D, a, sp, own, J, ctx, out){
  const k = sp.k;
  let req;
  if (sp.b === 2){
    const M = J(0x82 + k);
    if (!M){ out.refused.push({ action: a.action, shell: 'shell57', mode: k + 0x14, why: 'no matrix for joint ' + (0x82 + k) + ' (0x10ac220)' }); return; }
    const e = eulerOf(M);
    req = { k, mode: k + 0x14, placement: 3, behaviour: 2, trail: 1, pos: [M[12], M[13], M[14]], words: [word57(e.x), word57(e.y), word57(e.z)] };
  } else if (sp.b === 6){
    const spot = (ctx.spots088 && ctx.spots088[k]) || SPOT087[k];
    req = { k, mode: k + 0x18, placement: 2, behaviour: 6, trail: 1, spot, delay: 60.0 };
  } else return;
  req.action = a.action; req.frame = sp.start ? 0 : sp.frame;
  const D57 = D57N();
  const r = make57(state, D57, req, J, own, ctx);
  if (!r.S){ out.refused.push({ action: a.action, shell: 'shell57', mode: req.mode, why: r.why }); return; }
  r.S.D57 = D57; r.S.by087 = true;
  // the trail on the first move (0x432470): the drop moves the step it is made (delay 0, as spawn088); the lift after its delay
  if (sp.b === 2){ r.S.start = trail57(D57, r.S); r.S.effect = r.S.start ? { param: r.S.trailParam, key: r.S.start.key } : null; }
  state.shells.push(r.S); out.spawned.push(r.S);
}
// THE ROWS. (1, 0x15) (0x10b029c: L0 M9 set at blend 0 from 230.0, rate 0.6 -- the viewer plays it from 0) and (1, 8) (0x10afc44: L0 M9
// from 0 at rate 0.0, held until the lifts end): the lifts at action frames 1 / 41 (dt timers, not clip frames). (10, 0x8e) the
// HP-threshold reaction (0x10b11a0 -> 0x10b16d0(e, 0): L3 M12, 0x30c) with G+0x32 == 2 -- the first threshold, after (1, 0x15) set
// G+0x32 = 2 (0x10a7628) and before (1, 0xf) set 3: the two drops at its start (vt+0x204, before the main sets L3 M12)
SHELL_DATA.em087_00.actions.push(
  act087(1, 0x15, '0', 'Motion[9]', [{ frame: 1, ev: 'ka57', k: 0, b: 6 }, { frame: 41, ev: 'ka57', k: 1, b: 6 }]),
  act087(1, 0x08, '0', 'Motion[9]', [{ frame: 1, ev: 'ka57', k: 1, b: 6 }]),
  // (10, 0x8e)'s drops (b2, modes 20 / 21: u 320 then u 321 at the landing) are READ but NOT LISTED: what fires (10, 0x8e) for
  // Neset -- the shared reaction 0x1a on his P+0x3a8 bit 16 (his param data, not his band) -- is NOT READ. make087ka57 makes them
  // once that gate is read (the row: act087(10, 0x8e, '3', 'Motion[12]', [{ start: true, ev: 'ka57', k: 0 / 1, b: 2 }]))
);
