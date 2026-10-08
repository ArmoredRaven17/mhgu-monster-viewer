// WHICH OF A MOTION'S PSL BITS THE GAME LETS FIRE: the enemy's per-motion enable word, enemy +0x13f4.
//
// A PSL block (rProofEffectMotSequenceList) carries its own "mask of defined bits" at +0, and every tool before
// 2026-09-30 took that mask as the set of bits that fire. The game does not. The PSL walker (0x31ca58) copies each
// motion's block before walking it (0x31cc88: the copy buffer +0xac and enable byte +0xb0, which every enemy sets
// at 0xad0e4) and hands the copy to the MH sequence's hook +0x24 (0x40780), which calls the ENEMY's vtable +0xf0 --
// 0xca52c on every enemy class -- and that overwrites the copy's mask with the word at enemy +0x13f4. The run reader
// (0x31ce64) then tests bits against the REPLACED mask. So what fires is the enemy's word, not the file's.
//   The word is built at every motion start: the enemy's setMotion wrapper 0x7256c zeroes +0x13f4, flags the walker's
// motion change (sequence +0xc0 |= 4) and calls the class's vtable +0x13c with the new motion id. The base method
// 0xca170 ORs in bits 0-5 ALWAYS and one group of three by state (0x81670 enraged = P+0x518 == 1; 0x81614 tired =
// P+0x505 in {2, 3}):
//     calm, not tired   bits 6-8    0x1c0
//     enraged           bits 9-11   0xe00   (tired or not: the enraged test wins, 0xca1ac..0xca1c4)
//     tired, calm       bits 12-14  0x7000
// and bits 15-31 fire only where the monster's CLASS override of +0x13c adds them -- typically per action, which is
// how one clip carries several attacks' effects (Basarios's four gases on L2 Motion[3]). The word is latched for the
// motion: a state that changes mid-motion is read at the next motion start.
//
// dev/rom-map.md "THE PSL ENABLE MASK" has every address. A monster is listed in PSL_MASK_MONSTERS only once its
// class's +0x13c has been read end to end and its CLIP_EFFECTS block regenerated from the WHOLE PSL block (every
// named bit, in the file mask or not: efx/add_effects.py reads this list); a monster not listed keeps the file-mask
// bits as it always has, and is flagged as such rather than guessed.

// the base method, 0xca170
export function baseMask({ rage = false, tired = false } = {}){
  return 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
}

// THE CLASS OVERRIDES OF vtable +0x13c, per monster that has been read. Each is (motionId, action, state) -> the bits
// it ORs over the base: motionId = (list << 8) | slot; action = [status, number] the monster is playing the motion
// in, or null where the viewer has none to give (then the class's action-keyed bits stay off, and the caller says so).
const u8 = x => x & 0xff;

// BASARIOS (em004_00), uEm004_00 vtable +0x13c = 0xd2e0ec, the em-4 half (em 5 tails to 0xd2e35c: Gravios, not read).
// It calls 0xca170 first, then by motion id:
//   * L2 M3 / L2 M4 (table 0xd2e134 -> 0xd2e204), status 7, by number (table 0xd2e23c on number - 5):
//       0x0a -> bits 15/16   0x07 -> 17/18   0x05, 0x0f -> 19/20   0x10, 0x15 -> 21/22   any other -> none
//     -- the four gases: each pair is a charge bit (even, f33-139) and a cloud bit (odd, f151-233) on his own
//     em004_00_2.psl slot 3, u 261/260, 291/290, 321/320, 351/350;
//   * L2 M27, M28, M29, M33, M34, M46, M54 (table -> 0xd2e2b8) and L4 M5, M7, M8, M20 (0x800d over motion - 0x405),
//     status 7, number <= 0x1e: in 0xc44810 (0x04 0x0b 0x0e 0x12 0x16 0x17) -> bits 23/24; in 0x40082000 (0x0d 0x13
//     0x1e) -> bits 25/26;
//   * L0 M7 (0xd2e31c): bits 27/28 unless 0x81d6c -- posture 4 AND the burrow offset P+0x5c below 0.9 x the monster's
//     MoguriBaseOfs (0xbf62c = dtb +0xa8; the constant at 0x81db8) -- i.e. unless he is already sunk. The move's own
//     action 0xd27be4 takes posture 4 and sets this motion at once, from the surface (P+0x5c 0), so the viewer plays it
//     begun from the surface: bits on. A replay begun already under is the case the viewer has no depth to show.
//   * every other L2 motion (table -> 0xd2e334) and every other motion: nothing over the base.
const EM004_L2_GAS = { 0x0a: 0x18000, 0x07: 0x60000, 0x05: 0x180000, 0x0f: 0x180000, 0x10: 0x600000, 0x15: 0x600000 };
const EM004_B23 = 0xc44810, EM004_B25 = 0x40082000;
const EM004_ACTION_MOTIONS = new Set([0x21b, 0x21c, 0x21d, 0x221, 0x222, 0x22e, 0x236, 0x405, 0x407, 0x408, 0x414]);
function em004(motion, action){
  if (motion === 0x203 || motion === 0x204)
    return action && action[0] === 7 ? (EM004_L2_GAS[u8(action[1])] || 0) : 0;
  if (EM004_ACTION_MOTIONS.has(motion)){
    if (!action || action[0] !== 7 || action[1] > 0x1e) return 0;
    if ((EM004_B23 >>> action[1]) & 1) return 0x1800000;
    if ((EM004_B25 >>> action[1]) & 1) return 0x6000000;
    return 0;
  }
  if (motion === 0x007) return 0x18000000;            // 0x81d6c == 0: begun from the surface (above)
  return 0;
}

// NAKARKOS (em084_00), uEm084_00 vtable +0x13c = 0x106cae8 (body vtable 0x17f11fc; +0xf0 is the base 0xca52c), READ
// whole (0x106cae8..0x106cbb0) and emulated, identical words (dev/em084-psl-mask.md; Raven, 2026-10-05: "I see a 'bone
// debris' effect that is playing around the main body, we might have the wrong effect in its place"). It calls 0xca170
// first, then by motion id:
//   * L3 M63 (0x33f): bits 15-19 always (u 220 / u 221 / u 215 on his em084_00_3.psl slot 63);
//   * L2 M23 (0x217), status 7, number n <= 7 with n != 2 (mask 0xfb, table 0x159bff0): n 0..5 -> bits 15-17 (c 135),
//     n 6 / 7 -> bits 18-20 (u 205 / u 206); any other action -> nothing. (That (7, 6) / (7, 7) play L2 M23 is INFERRED
//     from their turn table.)
//   * L0 M1 (0x001): bits 15-17 only while the action is (13, 0) AND its phase byte P+0x1a1 == 4 -- the hold buried
//     after his dive (0x107a250 phase 3 -> 4 sets L0 M1; phase 5 re-sets it with the bits off; "buried" INFERRED from
//     posture 4). Bit 15 is c 140 (em084_00_008), the debris pulse: OFF on the idle and on every other L0 M1 play. The
//     viewer shows no buried hold, so it never passes phase 4.
//   * every other motion: nothing over the base -- every c 135 binding elsewhere sits on bits 0-5, always on.
// It reads no stance, charge flag, tentacle form or map (emulated control: changing E+0xcac4 / E+0xcadc / the form
// bytes left every word identical; the action and the phase byte changed it). BODY lists only: the tentacles' l_N / r_N
// run their own method (0x107f0e4, dev/em084-psl-mask.md 6), not wired -- pslMask returns null for them.
const EM084_L2M23 = n => (n <= 7 && ((0xfb >>> n) & 1)) ? (n >= 6 ? 0x1c0000 : 0x38000) : 0;
function em084(motion, action, state){
  if (motion === 0x33f) return 0xf8000;
  if (motion === 0x217) return action && action[0] === 7 ? EM084_L2M23(action[1]) : 0;
  if (motion === 0x001) return action && action[0] === 13 && action[1] === 0 && state.phase === 4 ? 0x38000 : 0;
  return 0;
}

// BOLTREAVER ASTALOS (em081_04), uEm081_00 vtable +0x13c = 0x1019eb4: 0xca170, then `ldrb [e+0xb5f5]` (the variant byte)
// and `popne` at 0x1019ecc -- every variant but 0 (Astalos) returns with the BASE word alone; the charge bits that follow
// (+0xcb01..) are Astalos's. So his clips fire bits 0-5 always and the calm / enraged / tired-calm groups by state, and
// nothing above bit 14 (dev/em081_04-effects-census.md; Raven, 2026-10-07: "Find and add all of Boltreaver's effects").
// His CLIP_EFFECTS was generated from the blocks' FILE masks, which the game overwrites: 102 switched-on bits outside them
// were never bound, and the state groups fired in every state.
const em081_04 = () => 0;

// BLOODBATH DIABLOS (em007_04), uEm007_00 vtable +0x13c = 0xd4532c (vtable 0x17994cc; +0xf0 is the base 0xca52c), READ
// whole (0xd4532c..0xd45524, literal pool 0xd45528) and emulated, identical words (dev/em007_04-list9-census.md 1.1;
// Raven, 2026-10-08: "Look into Bloodbath's List 9 animation effects"). It calls 0xca170 first, then:
//   * EVERY motion (0xd4533c..0xd45374): vt+0x370(e, 1) = 0xa3bf4, P+0x3b4 bit 0 -- the tail severed (the sever 0xc2274
//     sets it) -- ORs bits 18-20 (0x1c0000), else bits 15-17 (0x38000). The viewer reads it from the parts SHOWN: his part
//     pass vt+0x210 0xd36e50 draws set 0xb on the same test (0xd37044..0xd37068, variant 4; set 0xa intact), and set 11
//     is part 4 (monsters.json em007_04 groups[11], the Tail row's Broken -- render/motion-states.js SHELL_TAIL): state.severed.
//   * motion <= 0x20e (0xd4541c): L0 M5 / L0 M7 with P+0x1ba == 0 -> bits 24-26. P+0x1ba is the POSTURE: the setter
//     0xbc7f4 stores its argument there (0xbc97c), the spawn init 0xb8b98 writes 0 (0xb8e84). The plays set it before the
//     motion (setMotion builds the word, so the new posture is the one read): L0 M5 at posture 0 from 0xd393fc (0xd39478,
//     then 0xd39560) and at 4 from 0xd3b908 (0xd3b95c -> 0xd3b970); L0 M7 at 0 from 0xd39c40 (0xd39c98 -> 0xd39cac) and
//     0xd419dc (0xd41a10 -> 0xd41a24), at 4 from 0xd3b9fc (0xd3ba88 -> 0xd3baa0, the burrow with u 1400) and 0xd3c4a0
//     (0xd3c4fc -> 0xd3c510). state.posture (CLIP_ACTIONS `posture`: each play the next).
//   * 0x20f..0x21f (table 0xd4539c, 17 words, bounded by `cmp r1,#0x10`), status 7 only (e+0x73e0), number e+0x73e1:
//       L2 M15 (0xd453e0): 0xb4..0xb8 -> T1[n - 0xb4] (0x169bd20, 5 words: `cmp r1,#4`), bits 0-5 CLEARED (bfc);
//       L2 M19 (0xd454cc): 0xb7 / 0xb8 -> bits 30-31, bits 0-5 CLEARED (bic 0xc000003f);
//       L2 M22 (0xd45494): 0x67 -> bit 21 on variant 4 (Bloodbath; variant 0 returns at 0xd454c0 with the tail bits only);
//       L2 M31 (0xd45458): as L9 M11;  the other 13 motions: nothing more.
//   * L3 M20 (0x314, 0xd454fc): vt+0x3f4 = 0x7fed4 (action group 11 or 14, or (12, 0xff)) -> bit 23, else bit 22. The
//     action is the play's (CLIP_ACTIONS): the scripts that play L3 M20 are (10, 0x63 / 0x65 / 0x66 / 0x7d / 0x7f / 0x80)
//     and (11, 3 / 7 / 0x12 / 0x22) (script table 0x179a330.., efx/agents/diablos-scratch/scrpost7.txt).
//   * L9 M11 (0x90b, 0xd4544c -> 0xd45458): status 7, 0xb5..0xb8 -> T2[n - 0xb5] (0x1592818, 4 words: `cmp r1,#3`), bits
//     0-5 CLEARED.  Every other motion: the base and the tail bits.
// A clearing arm returns { set, clear }; pslMask applies it over the base word in the ROM's order (OR, then clear).
const EM007_T1 = [0x8000000, 0x30000000, 0x30000000, 0xc0000000, 0xc0000000];     // 0x169bd20, (7, 0xb4..0xb8)
const EM007_T2 = [0x30000000, 0x30000000, 0xc0000000, 0xc0000000];                 // 0x1592818, (7, 0xb5..0xb8)
const vt3f4 = a => !!a && (a[0] === 11 || a[0] === 14 || (a[0] === 12 && a[1] === 0xff));   // 0x7fed4
function em007_04(motion, action, state){
  const tail = state.severed ? 0x1c0000 : 0x38000;
  const n = action && action[0] === 7 ? action[1] : -1;
  if (motion <= 0x20e)
    return tail | ((motion === 5 || motion === 7) && (state.posture | 0) === 0 ? 0x7000000 : 0);
  if (motion === 0x20f)
    return n >= 0xb4 && n <= 0xb8 ? { set: tail | EM007_T1[n - 0xb4], clear: 0x3f } : tail;
  if (motion === 0x213)
    return n === 0xb7 || n === 0xb8 ? { set: tail | 0xc0000000, clear: 0x3f } : tail;
  if (motion === 0x216) return tail | (n === 0x67 ? 0x200000 : 0);
  if (motion === 0x21f || motion === 0x90b)
    return n >= 0xb5 && n <= 0xb8 ? { set: tail | EM007_T2[n - 0xb5], clear: 0x3f } : tail;
  if (motion === 0x314) return tail | (vt3f4(action) ? 0x800000 : 0x400000);
  return tail;
}

export const CLASS_MASK = { em004_00: em004, em084_00: em084, em081_04, em007_04 };
// the monsters whose clip effects follow the enable word (their CLIP_EFFECTS carry the whole block; add_effects.py
// reads this line)
export const PSL_MASK_MONSTERS = ['em004_00', 'em084_00', 'em081_04', 'em007_04'];

// The word for one motion start, or null for a monster not yet read (the caller then fires the listed bits as before).
export function pslMask(monId, list, slot, action, state){
  const cls = CLASS_MASK[monId];
  // a list that is not the body's (Nakarkos's tentacles, l_N / r_N): their own class's method, not this one
  if (!cls || !/^\d+$/.test(String(list))) return null;
  const motion = ((Number(list) & 0xf) << 8) | (slot & 0xff);
  const r = cls(motion, action || null, state || {});
  if (r && typeof r === 'object') return ((baseMask(state) | r.set) & ~r.clear) >>> 0;   // an arm that clears (bfc / bic)
  return (baseMask(state) | r) >>> 0;
}

// WHICH ACTION A PLAY OF A CLIP IS, where the enable word depends on it and nothing else in the viewer names one (a clip
// whose shells take a pick is named by shells.js pickVariantsFor instead). Each entry is one attack the ROM plays on
// that clip, in the command table's own terms: `action` [status, number], and `tired` the op-0x24 twin the same stream
// issues instead while tired and calm (0x81634: not enraged and P+0x505 in {1, 2, 3} runs the `24 00` arm).
// BASARIOS, L2 Motion[3], his gas (em004_00_cmdtbl group 1; dev/em004-fireball-actions.md for the arms):
//   s10  (6a quest-rank case 4 | 6f query 4) -> 24 00 (7, 0x10) / 24 02 (7, 0x15);  else 24 00 (7, 0x0f) / 24 02 (7, 0x05)
//   s11  (7, 0x07)                 s46  24 00 (7, 0x0f) / 24 02 (7, 0x05)
//   s12  6e case 0x0c -> ...; else (7, 0x0a)      s21 / s47  (7, 0x0a) among weighted picks (op 0x02)
// So four gases, two of them with a tired arm. Which stream the AI runs is its own choice (targets, ranges, the random
// op 0x02; op 0x6e reads a halfword of the interpreter's context not yet named; op 0x6a's case 4 compares the quest rank
// through 0x8e088 kind 0x1a, not read): the viewer shows each gas as its own entry and does not guess the AI.
export const CLIP_ACTIONS = {
  em004_00: {
    '2|Motion[3]': [
      { action: [7, 0x0a] },
      { action: [7, 0x07] },
      { action: [7, 0x05], tired: [7, 0x0f] },
      { action: [7, 0x15], tired: [7, 0x10] },
    ],
  },
  // NAKARKOS, L2 Motion[23]: the actions that play it (dev/em084-psl-mask.md 5; (7, 0/1/3/4/5) from the clip trace,
  // (7, 6) / (7, 7) from their turn table, INFERRED) -- each play the next: c 135 for the first five, u 205 / u 206 for
  // the last two, as the class's word gives them (never all three at once, which the viewer used to fire).
  em084_00: {
    '2|Motion[23]': [
      { action: [7, 0x00] }, { action: [7, 0x01] }, { action: [7, 0x03] }, { action: [7, 0x04] },
      { action: [7, 0x05] }, { action: [7, 0x06] }, { action: [7, 0x07] },
    ],
  },
  // BLOODBATH DIABLOS (em007_04): the plays of each motion his enable word (0xd4532c, above) keys on an action or the
  // posture. Group 7 from the action main under unicorn, variant 4 (actprobe7.py; phase 1 by the same probe with
  // P+0x1a1 = 1 and the frame gates answered -- efx/agents/diablos-scratch, 2026-10-08):
  //   L9 M11 (0xd421d8, phase 0): (7, 0x5a / 0x6f / 0x70 / 0x71 / 0x73 / 0x8a / 0x8d) -- the base word; (7, 0xb5) -> T2
  //     bits 28-29 (u 911), (7, 0xb7) -> 30-31 (u 912), both with bits 0-5 cleared (u 750 / u 380 off). (7, 0x5a)
  //     stands for the seven base plays.
  //   L2 M31: phase 1 of that body for every selector but 0 (0xd422d0 -> 0xd42314, start 40): (7, 0x5a) base, (7, 0xb5)
  //     / (7, 0xb7) T2.
  //   L2 M15: (7, 0x03) and ~40 others, base (start 0, 0xd3db1c); (7, 0xb4) T1[0] bit 27 (start 0); (7, 0xb6) / (7, 0xb8)
  //     T1 bits 28-29 / 30-31 (0xd3cd40 phase 0, setMotionL START 98 -- the viewer plays the clip from 0).
  //   L2 M19: (7, 0x83) base (0xd42cd8); (7, 0xb8) bits 30-31 (0xd3cd40 phase 1, 0xd3dc38).
  //   L3 M20: the death scripts (11, 3 / 7 / 0x12 / 0x22) -> bit 23, the status-10 ones (10, 0x63 / 0x65 / 0x66 / 0x7d /
  //     0x7f / 0x80) -> bit 22 (vt+0x3f4 = 0x7fed4; scrpost7.txt); one entry stands for each.
  //   L0 M5 / L0 M7: no action decides it, the POSTURE does (P+0x1ba, set before the motion): `posture` 0 -- (7, 0x6a)
  //     0xd419dc, 0xd39c40, 0xd393fc -- fires bits 24-26; 4 -- the burrow, 0xd3b908 / 0xd3b9fc / 0xd3c4a0 -- does not.
  em007_04: {
    '9|Motion[11]': [{ action: [7, 0x5a] }, { action: [7, 0xb5] }, { action: [7, 0xb7] }],
    '2|Motion[31]': [{ action: [7, 0x5a] }, { action: [7, 0xb5] }, { action: [7, 0xb7] }],
    '2|Motion[15]': [{ action: [7, 0x03] }, { action: [7, 0xb4] }, { action: [7, 0xb6] }, { action: [7, 0xb8] }],
    '2|Motion[19]': [{ action: [7, 0x83] }, { action: [7, 0xb8] }],
    '3|Motion[20]': [{ action: [10, 0x63] }, { action: [11, 0x03] }],
    '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],
    '0|Motion[7]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],
  },
};

// THE CLASS'S OWN REQUESTS INSIDE AN ACTION, at a frame of its motion: records no PSL bit names, which the action's code
// asks for itself through the class's u request (vtable +0x1d0, UNIQUE). `frame` is tested as the action code tests it,
// "the motion passed frame F" (0xb0974 -> 0x72714: the previous frame below F, this one at or past it); `by` maps the
// action ('status:0xNN') to [pel, key, array].
// BASARIOS, L2 Motion[3]: all six gas actions tail-call 0xd2855c with their own selector (status-7 table 0xd2c944);
// phase 1 waits for frame 216.0 (literal 0xd288b4) and the selector's arm (table 0xd28624) requests its id
// (dev/em004-fireball-actions.md 4): 1001 u 0, 1002 u 30, 1003 u 60, 1004 u 70, 1005 u 90, 1006 u 100 (class table
// 0x169bb80). (7, 0x3b) / (7, 0x3c) reach the same routine with ids 1008 / 1007 and are issued by no command stream.
export const ACTION_EFFECTS = {
  em004_00: {
    '2|Motion[3]': { frame: 216, by: {
      '7:0x0a': ['em004_00u', 0, 'UNIQUE'],   '7:0x07': ['em004_00u', 30, 'UNIQUE'],
      '7:0x05': ['em004_00u', 60, 'UNIQUE'],  '7:0x0f': ['em004_00u', 70, 'UNIQUE'],
      '7:0x15': ['em004_00u', 90, 'UNIQUE'],  '7:0x10': ['em004_00u', 100, 'UNIQUE'],
    } },
  },
};
export const actionName = a => a ? a[0] + ':0x' + a[1].toString(16).padStart(2, '0') : null;
export const actionOf = name => { const m = /^(\d+):0x([0-9a-f]+)$/i.exec(name || ''); return m ? [+m[1], parseInt(m[2], 16)] : null; };

// the action a play takes: `n` the play's index (each play the next of the ROM's choices, as the shells' picks go),
// `tired` / `rage` the state shown at its start (the op-0x24 arm)
export function clipActionFor(monId, list, clip, n, { tired = false, rage = false } = {}){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return null;
  const e = a[((n | 0) % a.length + a.length) % a.length];
  return (tired && !rage && e.tired) ? e.tired : e.action;
}
// the posture a play starts in (P+0x1ba), where the enable word reads it and the play's entry names it (Bloodbath's
// L0 M5 / M7); undefined elsewhere -- the class then reads its spawn value 0 (0xb8e84)
export function clipPostureFor(monId, list, clip, n){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return undefined;
  return a[((n | 0) % a.length + a.length) % a.length].posture;
}
