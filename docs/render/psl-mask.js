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

export const CLASS_MASK = { em004_00: em004 };
// the monsters whose clip effects follow the enable word (their CLIP_EFFECTS carry the whole block; add_effects.py
// reads this line)
export const PSL_MASK_MONSTERS = ['em004_00'];

// The word for one motion start, or null for a monster not yet read (the caller then fires the listed bits as before).
export function pslMask(monId, list, slot, action, state){
  const cls = CLASS_MASK[monId];
  if (!cls) return null;
  const motion = ((Number(list) & 0xf) << 8) | (slot & 0xff);
  return (baseMask(state) | cls(motion, action || null, state || {})) >>> 0;
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
