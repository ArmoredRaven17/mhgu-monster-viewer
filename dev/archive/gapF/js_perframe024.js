// HIS FRAME HANDLER, vt+0x208 0xdeffc4 -- READ WHOLE (..0xdf10b4) and emulated (gapF 2026-10-20: <scratchpad>/gapF/emu208.py, 63 cases;
// the barrier 0xdeffc4..0xdf00fc is CLASS_TIMERS.em024_00's). It makes sp_01 0xb0 MODES 0 / 1 / 2 / 3 / 4 / 9 / 10 / 12 / 13 -- the
// makers of c 29 / 30 / 31 / 32 / 33 / 34 / 35 (the census of the band 0xdeee40..0xdfeec4, <scratchpad>/gapF/census.py: no other
// create of 0xb0 than these, 0xdf8610's mode 11 and the three children's):
//   THE MOTION SWITCH (0xb0944: 0x202..0x212 by table 0xdf0128; 5; 0x22), each on a channel-1 crossing (0xb09b0):
//     L2 M2 (0x202) f50, with e+0x1054 == G+0x49 (0xb6fac: the machine that made him -- always here) and P+0x44 <= P+0x5b4 + 1000.0
//       (bhi past): MODE 0 (0xdf0220; no record -- a hit volume, base01 flag 0x400);
//     L2 M18 (0x212) f66 / L0 M5 (0x005) f56: a hit record (0x7ded8(e, 0, 0x1c)); then, the level L (below) not 0 / 0xff and f184
//       crossed: L 1 / 2 -> MODE 4 (c 32), L 3 -> MODE 3 (c 32 + c 35), L 4..0xfe none (0xdf0c04 / 0xdf0ca0, 0xdf0d5c / 0xdf0df8) --
//       no height and no owner test there. L0 M5's gate `(13, 1) && (13, 5)` (0x6fe88 twice) can never refuse.
//     (L2 M3 f48, M4 f40, M7 f58, M10 / M11 f46 / f52, M12 / M13 f48 / f50 / f80, L0 M34 f14: hit records 0x7db70 only -- no shell.)
//   THE PULSE (0xdf060c..0xdf1000), every frame: the level L = P+0x1bb (0xff -> 0; 2 -> ctl+0x18 ? 1 : 2; 3 -> ctl+0x18 ? 2 : 3; any
//     other as it is) not 0 / 0xff; the action e+0x73e0 / +0x73e1 one of PULSE024_ACTS (table 0xdf0684 by status; masks 0x20003 /
//     0x1e05e1 / 0x103f55); the owner test; then ctl+0x1c += dt (0x7264c(e, ctl+0x1c, 1.0)) and, at >= 80.0, ctl+0x1c = 0 and --
//     while P+0x44 < P+0x5b4 + 1000.0 (bpl past: strictly below) -- vt+0xd4(e, 0) (0x539e08, a getter: not visual) and sp_01 by L
//     and the posture P+0x1ba: L 1 -> 9 / 10, L 2 -> 12 / 13, L 3 -> 2 / 1 (posture 0 / not 0); L 4..0xfe none (the clock still
//     counts). ctl+0x1c is 0 at the ctor (0xdeeebc) and at the reset vt+0x1d8 (0xdef070), written nowhere else in the band.
//   Every setup 0x3fa2bc(0x40): +4 0xb0, +8 the mode, +0xc the owner, +0x10.. P+0x40.., +0x1c / +0x2c 0, +0x20.. the GOT zero vector
//   (0x19176b0), +0x30.. P+0x50 / +0x54 / +0x58 (the block's words, whole), +0x3c 0xffff -> 0x48b884([0x188b3b0], setup, 0, 0).
// The viewer: L is the Wind Aura control (input.windAura024) and ctl+0x18 the Poisoned toggle (input.poisoned024: P+0x5e08 bit 1,
// rebuilt at each action start -- dev/em024_00-effects-spec.md 1; absent: off). The action is the play's row's, else the forced one
// (input.action), else the clip's own when every action that plays it is a pulse action (PULSE024_CLIPS, traced:
// <scratchpad>/gapF/actsall.py / actsall2.py), else the pulse is refused by name; the posture is the one those plays set
// (PULSE024_CLIPS). The clock state.c024 runs across plays, counted on the steps the frame moves (as perFrame009's clock).
const PULSE024_ACTS = { 0: null, 1: [0x02, 0x03, 0x13], 2: [0x03, 0x08, 0x09, 0x0a, 0x0b, 0x0d, 0x14, 0x15, 0x16, 0x17],
                        4: [0x03, 0x05, 0x07, 0x09, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x17], 7: [0x0f, 0x10, 0x11, 0x30] };
const pulseAct024 = x => !!x && x[0] in PULSE024_ACTS && (PULSE024_ACTS[x[0]] === null || PULSE024_ACTS[x[0]].includes(x[1]));
// '<list>|Motion[N]': [the posture P+0x1ba its pulse plays set, true when no other action plays the clip] -- the pulse actions' clips
// (trgen over the action main 0xdfc6f0, phases 0..5, the turn tables read; the shot actions' L2 M9 / M6 from 0xdf96a8, spec 4)
const PULSE024_CLIPS = {
  '0|Motion[1]': [0, false],                                                              // (0, 0); also (1, 1)
  '0|Motion[2]': [0, false],                                                              // (0, 1), (1, 3 / 0x13); also (13, 0 / 3)
  '0|Motion[8]': [0, true],                                                               // (2, 8..0xb / 0xd)
  '0|Motion[12]': [0, true], '0|Motion[13]': [0, true], '0|Motion[14]': [0, true],        // (2, 3): turn table 0x169d2b4
  '0|Motion[22]': [0, true],                                                              // (0, 2)
  '0|Motion[35]': [0, true], '0|Motion[36]': [0, true], '0|Motion[41]': [0, true], '0|Motion[42]': [0, true],   // (2, 0x14..0x17)
  '0|Motion[37]': [0, true], '0|Motion[38]': [3, true], '0|Motion[39]': [0, true], '0|Motion[40]': [3, true],   // (4, 0xb / 0xc): phase 1 posture 3
  '1|Motion[2]': [3, false],     // (0, 3) [posture 1], (0, 6), (1, 2), (4, 3 / 5 / 7 / 9 / 0x17); also 34 others (statuses 2, 3, 4, 7, 12, 13)
  '1|Motion[8]': [3, false],                                                              // (4, 5 / 7): turn tables 0x169d320 / 0x169d360; also (3, 6)
  '1|Motion[16]': [3, true], '1|Motion[18]': [3, true], '1|Motion[20]': [3, true], '1|Motion[22]': [3, true],   // (4, 0xd..0x10) phase 0
  '1|Motion[17]': [0, true], '1|Motion[19]': [0, true], '1|Motion[21]': [0, true], '1|Motion[23]': [0, true],   // ...phase 1: posture 0
  '2|Motion[1]': [3, false], '2|Motion[9]': [3, false], '2|Motion[6]': [3, false],        // (7, 0xf..0x11): posture 3 (0xdf98f0); also the other shot actions
  '2|Motion[20]': [0, true],                                                              // (7, 0x30)
};
function perFrame024(state, D, ctx, input, out, fresh, a){
  const clip = String(input.clip || '').replace(/_loop$/, '').replace(/_start$/, '');
  const mid = motionIdOf(input.list, clip);
  if (mid == null || !state.hist) return;
  const own = ctx.own001, ps = !!input.poisoned024, raw = Math.max(0, Math.min(3, input.windAura024 | 0));
  const L = raw === 2 ? (ps ? 1 : 2) : raw === 3 ? (ps ? 2 : 3) : raw;                  // 0xdf0514..0xdf0574
  const act = a && a.action ? a.action : (Array.isArray(input.action) ? input.action : null);
  const make = (mode, F) => {
    const why = missing001(own, { facing: true, pos: true, ground: true });
    if (why){ out.refused.push({ perFrame: mid, shell: 'shell01', mode, why }); return; }
    const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode, position: own.ownerPos.slice(),
                                             angles: [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0], action: act, frame: F },
                      own, state.prevJoints || ctx.J, ctx, null);
    if (S){ S.perFrame = mid; state.shells.push(S); out.spawned.push(S); }
  };
  const below = (lim, strict) => !own.ownerPos || own.ground == null ? true
    : strict ? own.ownerPos[1] < f(own.ground + f(lim)) : own.ownerPos[1] <= f(own.ground + f(lim));
  // (a) the motion switch
  if (!fresh){
    if (mid === 0x202 && pass001(state, f(50.0)) && below(1000.0, false)) make(0, 50);       // 0xdf016c..0xdf0298
    if ((mid === 0x212 || mid === 0x005) && L !== 0 && pass001(state, f(184.0))) make(L === 3 ? 3 : 4, 184);   // 0xdf09c0 / 0xdf0a34
  }
  // (b) the pulse
  if (L === 0) return;                                                                   // 0xdf0618 / 0xdf0660
  const key = String(input.list) + '|' + clip, row = PULSE024_CLIPS[key];
  if (act ? !pulseAct024(act) : !row) return;
  if (!act && !row[1]){
    if (fresh) out.refused.push({ perFrame: mid, shell: 'shell01', why: 'em024 pulse (vt+0x208 0xdf0664): ' + key +
                                  ' is played by pulse actions and others -- the play names no action' });
    return;
  }
  const [p0, p1] = state.hist;
  if (p1 === p0) return;                                                                 // a step the frame did not move
  if (!('c024' in state)) state.c024 = f(0.0);
  state.c024 = f(state.c024 + ctx.dt);                                                   // 0xdf0870..0xdf0880
  if (state.c024 < f(80.0)) return;                                                      // 0xdf0888..0xdf0898
  state.c024 = f(0.0);                                                                   // 0xdf08a4
  if (!row){ out.refused.push({ perFrame: mid, shell: 'shell01', why: 'em024 pulse: the posture of ' + key + ' under (' + act + ') is not traced' }); return; }
  if (!below(1000.0, true)) return;                                                      // 0xdf08a8..0xdf08c8
  const p = row[0];
  make(L === 1 ? (p === 0 ? 9 : 10) : L === 2 ? (p === 0 ? 12 : 13) : (p === 0 ? 2 : 1), p1);   // 0xdf08e0..0xdf0f74
}
const PERFRAME024 = true;
