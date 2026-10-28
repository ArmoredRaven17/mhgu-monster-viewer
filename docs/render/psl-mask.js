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
function em004(motion, action, state){
  if (motion === 0x203 || motion === 0x204)
    return action && action[0] === 7 ? (EM004_L2_GAS[u8(action[1])] || 0) : 0;
  if (EM004_ACTION_MOTIONS.has(motion)){
    if (!action || action[0] !== 7 || action[1] > 0x1e) return 0;
    if ((EM004_B23 >>> action[1]) & 1) return 0x1800000;
    if ((EM004_B25 >>> action[1]) & 1) return 0x6000000;
    return 0;
  }
  // 0x81d6c, as the ROM tests it (the word sweep of 2026-10-18 caught the stand-in written into the code); the viewer's
  // plays pass state.sunk = false unless their entry names it, so every L0 M7 the viewer plays still starts from the surface
  if (motion === 0x007) return state && state.sunk ? 0 : 0x18000000;
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

// ASTALOS (em081_00), the same method's variant-0 arm, 0x1019ed0..0x1019fcc, READ whole and emulated (unicorn, every
// combination of the three tier bytes 0..4 x rage x P+0x505 0..3 x 13 motions, variants 0 and 4: identical words;
// control: variant 4 returns the base alone at 0x1019ecc). It reads NO motion id and NO action -- r1 (the motion) is
// never saved -- only the three per-part charge tier bytes, crest e+0xcb01, wings e+0xcb02, tail e+0xcb03, each tested
// `(b | 1) == 3` (tier 2 or 3: "charged"), and 0x81614 (P+0x505 in {2, 3}, NOT gated on rage):
//   crest, wings and tail all charged (0x1019f24): |= 0x7000000 (bits 24-26) and return;
//   else, crest charged:   |= 0x38000 (bits 15-17);   crest not charged and not 0x81614: |= 0x8000000 (bit 27);
//   then (0x1019fa8) tail charged ? 0xe00000 (bits 21-23) : 0x20000000 (bit 29), and
//                    wings charged ? 0x1c0000 (bits 18-20) : 0x10000000 (bit 28).
// On his PSLs: 24-26 = the all-charged arcs (u 200 / 201 / 202 on L2 M13 / M20 / M22 / M47, u 260 / 261 / 270 / 271 /
// 280 / 281 / 290 / 292 / 300 / 301 / 321 / 322 / 240); 15-17 the same records crest-only, 18-20 wings, 21-22 tail;
// 27 u 242 (L2 M20), 28 u 274 / 284 / 320, 29 u 252 (L2 M23) -- the uncharged forms.
//   state.charge = [crest, wings, tail] tier bytes. THE VIEWER HAS ONE CHARGE RUNG for the monster (Raven's U / C / F),
// so index.html passes the rung as all three bytes (the mapping CHARGE_EFFECTS em081_00 and shellChargeTier already
// state: "a level means all three regions at that tier"). F (2) is all charged -> 24-26; U (0) and C (1) are none
// charged -> 27-29. The MIXED states the game reaches (one or two parts charged: bits 15-23) need a per-part charge
// control the viewer does not have; every record on 15-23 also sits on 24-26 of the same motion, so none goes unseen.
const chargedTier = b => ((b | 1) & 0xff) === 3;
function em081_00(motion, action, state){
  const [crest, wings, tail] = (state.charge || [0, 0, 0]).map(chargedTier);
  if (crest && wings && tail) return 0x7000000;
  return (crest ? 0x38000 : state.tired ? 0 : 0x8000000) | (tail ? 0xe00000 : 0x20000000) | (wings ? 0x1c0000 : 0x10000000);
}

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

// AKANTOR (em033_00), uEm033_00 vtable +0x13c = 0xe3e368 (vtable 0x17ba1c4; +0xf0 is the base 0xca52c), READ whole
// (0xe3e368..0xe3e3dc, the pop) and emulated (dev/em033_00-effects-spec.md 1; Raven, 2026-10-14: the Flying Wyverns'
// gaps, easiest first). It calls 0xca170 first, then by motion id -- no action, variant or part-break input:
//   * L2 M3 (0x203) / L2 M21 (0x215): vt+0x370(e, 1) = 0xa3bf4, P+0x3b4 bit 0 -- the tail severed (his sever hook
//     0xe365cc -> 0xc2274 sets it) -- ORs bits 24-26 (0x7000000), else bits 21-23 (0xe00000): c 150 / c 71 with the tail
//     on, c 151 / c 71 with it cut. The viewer reads it from the parts SHOWN (render/motion-states.js SHELL_TAIL
//     em033_00: set 18, his sever row's, is the one set that draws part 16): state.severed.
//   * L0 M2 (0x002): 0x81d6c -- posture 4 AND P+0x5c < 0.9 x MoguriBaseOfs (0xbf62c), "already sunk" (I, Basarios's
//     reading) -- ORs bits 18-20 (0x1c0000), else bits 15-17 (0x38000). The burrow 0xe3a53c sets L0 M2 right after taking
//     posture 4 (0xe3a5ac), from the surface as Basarios's L0 M7 is: STAND-IN state.sunk = false (the viewer shows no
//     sunk posture; P+0x5c at the start is NOT READ as a value).
//   * every other motion: the base alone. He is never tired (motion-states em033_00), so bits 12-14 never fire.
function em033_00(motion, action, state){
  if (motion === 0x203 || motion === 0x215) return state.severed ? 0x7000000 : 0xe00000;
  if (motion === 0x002) return state.sunk ? 0x1c0000 : 0x38000;   // 0x81d6c; the viewer plays it from the surface
  return 0;
}

// TIGREX (em032_00) and GRIMCLAW TIGREX (em032_04), one class uEm032_00 (vtable 0x17b8748): its vtable +0x13c holds the
// BASE method 0xca170 itself -- no override (READ, the vtable word; emulated: L2 M10 calm 0x1ff, (7,5) severed + enraged
// 0xe3f, L9 M15 tired 0x703f, the base words exactly; dev/em032_00-effects-spec.md 1). So bits 0-5 always and the state
// group, nothing above bit 14, no variant test (there is no class code to hold one).
const em032 = () => 0;

// NARGACUGA (em037_00) and SILVERWIND NARGACUGA (em037_04), one class uEm037_00 (vtable 0x17bc47c; +0xf0 the base copy
// hook 0xca52c, +0x208 0xe47b0c the frame handler): its vtable +0x13c holds the BASE 0xca170 itself -- no override (READ,
// the vtable word; no 0x13f4 immediate anywhere in the band 0xe47070..0xe5a204, control: the same scan finds uEm007_00 /
// uEm033_00 / uEm038_00's writers). Emulated: L2 M5 calm 0x1ff, L2 M21 severed + enraged 0xe3f, L3 M4 tired 0x703f,
// Silverwind L9 M6 calm 0x1ff -- the base words exactly (dev/em037_00-effects-spec.md 1). So bits 0-5 always and the
// state group, never 15-31, for both variants; every binding of both monsters sits on bits 0-2.
const em037 = () => 0;

// THE -DROME LINE: VELOCIDROME (em014_00), GENDROME (em015_00), IODROME (em016_00) and GIADROME (em034_00), one class
// uEm014_00 for all four (states-em014_00.md: "CLASS (identical for em014_00, em015_00, em016_00, em034_00)"; vtable
// 0x17a813c): its vtable +0x13c holds the BASE 0xca170 itself -- no override (READ, the vtable word, 2026-10-15; rom-map
// "The PSL enable word per class", control: the seven classes already read match at their vtables). So bits 0-5 always
// and the state group, never 15-31; the survey found no binding of the four outside the file masks
// (dev/bird-wyverns-effects-survey.md), so what this changes is the state gating of bits 6-14.
const em014 = () => 0;

// FIVE MORE CLASSES WITH NO OVERRIDE -- vtable +0x13c holds the base 0xca170 itself (READ, the vtable words, 2026-10-15,
// re-read by the Viewer agent with Tigrex 0xca170 / Basarios 0xd2e0ec as controls; rom-map "The PSL enable word per
// class"): CHAMELEOS uEm025_00 (0x17b4ffc), AMATSU uEm058_00 (0x17cbfc4), KECHA WACHA uEm065_00 (0x17da71c), SELTAS
// uEm076_00 (0x17e5e84), VALSTRAX uEm086_00 (0x17f82b0). Bits 0-5 always and the state group, never 15-31: Kecha Wacha's
// c 50 (L3 M11 b0) and Seltas's u 290 (L2 M10 b13, the tired group) come in; Seltas's L2 M17 / M57 and L4 M33 / M34 calm /
// enraged / tired triples fire one at a time; Valstrax's u 101 (L1 M2 b15) stays off, as the game has it. (The category
// surveys under dev/)
const BASE_ONLY = () => 0;

// MALFESTIO (em079_00) and NIGHTCLOAK MALFESTIO (em079_04), one class uEm079_00 (vtable 0x17e9444): vtable +0x13c =
// 0xfef4b8, READ whole (0xfef4b8..0xfef518, the only bl the base 0xca170; one 0x13f4 writer in the band, 0xfef508) and
// emulated (dev/em079_00-effects-spec.md 1). ONE ARM, and it is Nightcloak's: L1 M26 / L1 M27 (motion >> 1 == 0x8d),
// variant 4 (e+0xb5f5), status 7 with (number & 0xfe) == 0xcc -- (7, 0xcc) / (7, 0xcd) -- ORs bits 15-17 (0x38000).
// Malfestio's word is the base alone: his u 361 on L1 M27 has no record and is never enabled.
const em079_00 = () => 0;
function em079_04(motion, action){
  if ((motion >>> 1) === 0x8d && action && action[0] === 7 && (action[1] & 0xfe) === 0xcc) return 0x38000;
  return 0;
}

// YIAN KUT-KU (em008_00), uEm008_00 vtable 0x179ac54, +0x13c = 0xd514b8, READ whole (0xd514b8..0xd514e0; the only
// 0x13f4 writer in the band, through `ldr [r4,r0]!` at 0xd514d4) and emulated (dev/em008_00-effects-spec.md 1). One arm,
// keyed on the motion alone: L2 M12 (0x20c) ORs bits 15-17 (0x38000) -- his u 560 on b15, always on. No action, variant,
// part or state input; u 570 / u 580 on b18 / b21 and L1 M104's b24 u 90 are named and never enabled.
function em008_00(motion){ return motion === 0x20c ? 0x38000 : 0; }

// GYPCEROS (em009_00), uEm009_00 vtable 0x179c5d8, +0x13c = 0xd5e768, READ whole (0xd5e768..0xd5e838; literal 0xd5e83c)
// and emulated (dev/em009_00-effects-spec.md 1). 0xca170 first, then on k = motion - 0x403 in 0..0x16:
//   * L4 M3 / L4 M8 / L4 M25 (k in 0x400021): bit 15 unless the crest is broken -- 0x9d36c(e, 6) (P+0x404) >= the .dtp
//     +0x64 row's level (2 at both ranks), the part pass's own set-9 test: u 320 / u 321 / u 320 with the crest on.
//     The viewer reads it from the parts SHOWN (motion-states.js SHELL_PARTS em009_00): state.crestBroken;
//   * L4 M7 / L4 M9 (k in 0x50): status 7 and number 0x26..0x28 -> bits 16-18 (u 280) -- the ENRAGED forms of (7, 0x1c)
//     (L4 M7) and (7, 0x0a) / (7, 0x0c) (L4 M9): cmdtbl g1 s4-s6, op 0x1c = 0x81688 (enraged);
//   * every other motion: the base alone -- L2 M12's bits 15 / 18 / 21 and L1 M104's 24 (no records) never fire.
function em009_00(motion, action, state){
  const k = motion - 0x403;
  if (k < 0 || k > 0x16) return 0;
  if ((0x400021 >>> k) & 1) return state.crestBroken ? 0 : 0x8000;
  if ((0x50 >>> k) & 1) return action && action[0] === 7 && action[1] >= 0x26 && action[1] <= 0x28 ? 0x70000 : 0;
  return 0;
}

// YIAN GARUGA (em018_00) and DEADEYE YIAN GARUGA (em018_04), one class uEm018_00, vtable +0x13c = 0xdb0d10 (vtable
// 0x17abb38), READ whole (0xdb0d10..0xdb0e50) and emulated -- the transcription below against the ROM over 8448
// combinations, 0 mismatches (dev/em018_00-effects-spec.md 1). 0xca170 first, then by motion id; the variant byte
// e+0xb5f5 == 4 (Deadeye) is tested twice:
//   * L2 M12 (0x20c), L4 M65 (0x441), L4 M77 (0x44d): vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0, the tail severed) ->
//     bits 21-23; else Deadeye with part 7's break level 0x9d36c(e, 7) at or over .dtp row 5's (A[0x15] at rank <= 4,
//     A[0x16] above; both 2) -> bits 18-20; else bits 15-17. u 560 / 570 / 580, u 380 / 390 / 400, u 381 / 391 / 401:
//     intact / broken / cut (Garuga has no 570 / 390 / 391 record: his tail never breaks). Both read from the parts
//     SHOWN (motion-states.js SHELL_TAIL em018_00 / em018_04): state.severed, state.breakLevel7.
//   * L0 M7 (0x007): Deadeye only, action (7, 0xe3..0xe5) -> bits 27-29 (u 290 b27, u 531 b28).
//   * L1 M104 (0x168): bits 24-26 always (u 90 b24).   * L2 M2 (0x202): CLEARS bits 6, 9, 12 (bic 0x1240).
const em018 = v4 => (motion, action, state) => {
  if (motion === 0x007)
    return v4 && action && action[0] === 7 && action[1] >= 0xe3 && action[1] <= 0xe5 ? 0x38000000 : 0;
  if (motion === 0x168) return 0x7000000;
  if (motion === 0x202) return { set: 0, clear: 0x1240 };
  if (motion === 0x20c || motion === 0x441 || motion === 0x44d)
    return state.severed ? 0xe00000 : (v4 && (state.breakLevel7 | 0) >= 2) ? 0x1c0000 : 0x38000;
  return 0;
};
const em018_00 = em018(false), em018_04 = em018(true);

// BRACHYDIOS (em063_00) and RAGING BRACHYDIOS (em063_05), one class uEm063_00 (vtable 0x17d92c4), vtable +0x13c =
// 0xf469a8, READ whole (0xf469a8..0xf46afc) and emulated -- the transcription below against the ROM over 25392
// combinations, 0 mismatches (dev/em063_00-effects-spec.md 1). 0xca170 first, then:
//   [2026-10-18: "ctl" below is [e+0xcacc] -- ldrh [[e+0xcacc] + 0x2c / + 0x20] (0xf469c8..0xf46a00), not ctl = [e+0xcac0];
//   re-emulated with the rows there, 657920 runs, 0 mismatches]
//   * variant byte e+0xb5f5 == 0 (Brachydios only -- the word's one variant test): each arm's slime row, ctl+0x2c
//     (slot 1, part 2, arm_r) / ctl+0x20 (slot 0, part 3, arm_l), in {0, 3} -> bits 19-20 / 21-22. The row is the arm's
//     last level change, written only by 0xf4653c (0xf4679c): 3 = it fell to 0 (the fist is spent), 0 = no change since
//     the reset. c 130 / c 140 (right: L2 M8 / M13 / M18 / M54 b19), c 131 / c 141 (left: L2 M5 / M11 / M16 b21).
//     state.armEmpty = [left, right], the viewer's arm level 0. NAMED DIFFERENCE: the ROM also sets these while the row
//     is still 0 (each arm's attacks after a reset, at level 2), which the viewer, holding no history, shows as not empty.
//   * every motion, both variants: vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0) clear -> bits 27-28 (L2 M21 b27 c 210).
//   * L2 M42 (0x22a): (7, 0x08 / 0x14 / 0xa1 / 0xa3 / 0xa6 / 0xb0) -> bits 17-18 (u 200);  L2 M41 (0x229): (7, 0x09).
//   * L0 M10 (0x00a): 0x81d6c "already sunk" false -> bits 15-16 (c 2 / c 3). STAND-IN state.sunk = false, as Akantor's.
const EM063_L2M42 = n => (n >= 0xa1 && n <= 0xb0 && ((0x8025 >>> (n - 0xa1)) & 1)) || n === 0x14 || n === 0x08;
const em063 = v0 => (motion, action, state) => {
  let r = state.severed ? 0 : 0x18000000;
  if (v0){
    const e = state.armEmpty || [false, false];
    if (e[1]) r |= 0x180000;
    if (e[0]) r |= 0x600000;
  }
  const n = action && action[0] === 7 ? action[1] : -1;
  if (motion === 0x22a) return r | (EM063_L2M42(n) ? 0x60000 : 0);
  if (motion === 0x229) return r | (n === 9 ? 0x60000 : 0);
  if (motion === 0x00a) return r | (state.sunk ? 0 : 0x18000);
  return r;
};
const em063_00 = em063(true), em063_05 = em063(false);

// DEVILJHO (em043_00) and SAVAGE DEVILJHO (em043_05), one class uEm043_00, vtable +0x13c = 0xe80fd0 (vtable 0x17bfd1c),
// READ whole (0xe80fd0..0xe810e0, jump table 0xe81054) and emulated -- 46080 runs against the ROM, 0 mismatches
// (dev/em043_00-effects-spec.md 1). 0xca170 first, then by motion id -- NO variant test (Savage's word is Deviljho's):
//   * L2 M3 / M4 / M10 / M19 / M20 / M21 (0x70083 over motion - 0x203): the tail severed (vt+0x370(e, 1) = 0xa3bf4) ->
//     nothing, else bits 15-17: c 121 / c 120 / c 122 / c 120 / c 125 / c 124 -- the tail's impacts, while it is on;
//   * L0 M5 (0xe810a0): bits 15-17 unless the action is (10, 0xa7), (10, 0x2a) or (10, 0x70) (0x6fe88) -- c 60 on the
//     rage roar (1, 2) / (1, 0x12), not on the paralysis / shock-trap / (10, 0xa7) recoveries;
//   * L0 M6 / L0 M11 / L0 M14 (0xe8107c): bits 15-17 unless 0x81d6c (posture 4 and P+0x5c < 0.9 x MoguriBaseOfs: already
//     under the ground) -- c 0 / c 1, the footfalls, on the surface only (state.sunk: CLIP_ACTIONS' `sunk`, clipSunkFor);
//   * every other motion: the base alone. Savage's c 91 (b13) and c 90 (b12) are the base's tired-calm group.
const EM043_TAIL = new Set([0x203, 0x204, 0x20a, 0x213, 0x214, 0x215]);
function em043(motion, action, state){
  if (EM043_TAIL.has(motion)) return state.severed ? 0 : 0x38000;
  if (motion === 0x005)
    return action && action[0] === 10 && (action[1] === 0xa7 || action[1] === 0x2a || action[1] === 0x70) ? 0 : 0x38000;
  if (motion === 0x006 || motion === 0x00b || motion === 0x00e) return state.sunk ? 0 : 0x38000;
  return 0;
}

// BARROTH (em044_00), uEm044_00 vtable +0x13c = 0xe8d714 (vtable 0x17c1434), READ whole (0xe8d714..0xe8d854; literal
// 0xe8d858 -> GOT 0x1831c54) and emulated -- 27648 runs, 0 mismatches (dev/em044_00-effects-spec.md 1). 0xca170 first,
// then by motion id -- the class has no variant test:
//   * L0 M3 / M4 / M6 / M13 / M15 (0xa058): bits 27-28 unless 0x81d6c (under the ground) -- the footfalls c 0..c 3;
//   * L0 M11: status 1, number 2 or 0xe -> bits 23-24 -- c 90 on the rage roar, not on (1, 0) or the recoveries;
//   * L2 M12 / M13: the mud byte e+0xcada (bit 0 head, bit 1 back gone; motion-states.js shellMudInput): both muddy bits
//     19-20 (u 360), head bare 17-18 (u 350), back bare 15-16 (u 340), both bare nothing;
//   * L4 M6 / M7: 0x3a8430 == 5 (the rank byte; the viewer's SHELL_QUEST_RANK) -> bits 21-22 (u 210 on L4 M6);
//   * L2 M2: the tail severed -> nothing, else bits 25-26 (c 40).
function em044_00(motion, action, state){
  if (motion <= 0xf && ((0xa058 >>> motion) & 1)) return state.sunk ? 0 : 0x18000000;
  if (motion === 0x00b) return action && action[0] === 1 && (action[1] === 2 || action[1] === 0xe) ? 0x1800000 : 0;
  if (motion === 0x20c || motion === 0x20d){
    const m = (state.mud | 0) & 3;
    return m === 3 ? 0 : m === 0 ? 0x180000 : (m & 1) ? 0x60000 : 0x18000;
  }
  if (motion === 0x406 || motion === 0x407) return state.rank === 5 ? 0x600000 : 0;
  if (motion === 0x202) return state.severed ? 0 : 0x6000000;
  return 0;
}

// GLAVENUS (em080_00) and HELLBLADE GLAVENUS (em080_04), one class uEm080_00 (vtable 0x17eac74), vtable +0x13c =
// 0x1000910, READ whole (0x1000910..0x1000970) and emulated (dev/em080_00-effects-spec.md 1). 0xca170 first, then two
// fields from the heat byte P+0x1bb (reached as [e+0x13f4+0x34] after the pre-indexed load) -- no motion, action,
// variant or part input:
//   throat: bit 4 (overheat, Hellblade) -> bits 28-30; else bit 2 (lit) -> bits 15-17; else bits 26-27;
//   tail:   bit 3 (overheat, Hellblade) -> bits 24-25; else bit 1 (hot) -> 18-19; else bit 0 (dark) -> 22-23;
//           else bits 20-21.
// So every clip's throat and tail effects come in forms, one per heat state (L2 M1 u 260 / 261 lit, c 42 / c 90 not;
// L2 M13 u 430 per tail state; L2 M14 c 51 + u 500 hot / normal / dark, u 511 + u 512 overheat ...).
// state.heat = that byte as the viewer shows it (motion-states.js glavenusHeat).
function em080(motion, action, state){
  const h = state.heat | 0;
  const throat = (h & 0x10) ? 0x70000000 : (h & 4) ? 0x38000 : 0xc000000;
  const tail = (h & 8) ? 0x3000000 : (h & 2) ? 0xc0000 : (h & 1) ? 0xc00000 : 0x300000;
  return throat | tail;
}

// URAGAAN (em045_00) and CRYSTALBEARD URAGAAN (em045_04), one class uEm045_00 (vtable 0x17c257c), vtable +0x13c =
// 0xe9cb64, READ whole (0xe9cb64..0xe9cd64) and emulated -- 39936 runs each, 0 mismatches (dev/em045_00-effects-spec.md
// 1). 0xca170 first, then by motion id; the variant byte e+0xb5f5 == 4 is tested twice and only picks the beard word:
//   * L2 M1 / M5 / M13 / M14 (k = motion - 0x201 in 0x3011): bits 25-26, or on Crystalbeard with the beard cut
//     (vt+0x370(e, 2) = 0xa3bf4, P+0x3b4 bit 1; motion-states.js SHELL_PARTS beardOff) bits 27-28: u 201 / u 230 with
//     it on, u 240 with it off;
//   * L2 M2 / L2 M3, status 7: n 2 -> bits 17-18, tired (0x81614) 19-20; n 4 or 0x90 -> 21-22, tired 23-24. (7, 2) is
//     the u 100 machine 0xe95b78(e, 0), (7, 4) the same with sel 1 (u 110 / u 120), (7, 0x90) the u 130 / 140 machine
//     0xe98ca8 whose last motion is L2 M3;
//   * L2 M10: the beard word AND the action arm (the status read through the post-indexed pointer, 0xe9cc70);
//   * L0 M11: status 1, n 2 or 0xc -> bits 15-16 (c 90 on the rage roar (1, 2));
//   * L0 M6: bits 29-30 unless 0x81d6c (MoguriBaseOfs -2000 Uragaan / 0 Crystalbeard: his roll after the curl starts
//     sunk, Crystalbeard's never) -- c 0 / c 1 dust on the surface only.
const em045 = v4 => (motion, action, state) => {
  const n = action && action[0] === 7 ? action[1] : -1;
  const beard = v4 && state.beardOff ? 0x18000000 : 0x6000000;
  const act = (n === 4 || n === 0x90) ? (state.tired ? 0x1800000 : 0x600000) : n === 2 ? (state.tired ? 0x180000 : 0x60000) : 0;
  if (motion === 0x201 || motion === 0x205 || motion === 0x20d || motion === 0x20e) return beard;
  if (motion === 0x202 || motion === 0x203) return act;
  if (motion === 0x20a) return beard | act;
  if (motion === 0x00b) return action && action[0] === 1 && (action[1] === 2 || action[1] === 0xc) ? 0x18000 : 0;
  if (motion === 0x006) return state.sunk ? 0 : 0x60000000;
  return 0;
};
const em045_00 = em045(false), em045_04 = em045(true);

// DURAMBOROS (em055_00), uEm055_00 vtable 0x17c8768, +0x13c = 0xede150, READ whole (0xede150..0xede1f0) and emulated --
// 20736 runs, 0 mismatches (dev/em055_00-effects-spec.md 1). 0xca170 first, then:
//   * L0 M3 / L0 M4 / L0 M6 / L0 M15 (bit of 0x8058): 0x81d6c "sunk" (MoguriBaseOfs -2000) -> bits 18-20, else 21-23:
//     c 100 (b18) on the turns L0 M3 / M4 only inside the rolling posture, c 0 (b21) on L0 M6 / M15 only outside it;
//   * L0 M11, status 1: n 0 / 0xd -> bit 15 (c 120, the roar burst); n 2 -> the WHOLE word cleared (str 0 at 0xede1ec,
//     base bits too);
//   * every other motion: the base alone -- L2 M25 / M32's u 400 on b6 / b9 / b12 fires once per state.
function em055_00(motion, action, state){
  if (motion === 0x003 || motion === 0x004 || motion === 0x006 || motion === 0x00f) return state.sunk ? 0x1c0000 : 0xe00000;
  if (motion === 0x00b && action && action[0] === 1){
    if (action[1] === 2) return { set: 0, clear: 0xffffffff };
    if (action[1] === 0 || action[1] === 0xd) return 0x8000;
  }
  return 0;
}

// GREAT MACCAO (em085_00), uEm085_00 vtable +0x13c = 0x10937e8, READ whole (0x10937e8..0x1093838, the only bl 0xca170)
// and emulated (dev/em085_00-effects-spec.md 1). IT NEVER READS THE MOTION: status 1 number 0x0f ORs bits 18-20
// (0x1c0000), status 1 number 4 ORs bits 15-17 (0x38000). Both actions play L0 M25 / L0 M24 and then hold L0 M21
// (0x108e7e8 mode 0 / 1, 0x108e90c), which is where his b15 c 111 and b18 c 118 / b19 c 112 sit.
function em085_00(motion, action){
  if (!action || action[0] !== 1) return 0;
  return action[1] === 0x0f ? 0x1c0000 : action[1] === 0x04 ? 0x38000 : 0;
}

// UKANLOS (em038_00), uEm038_00 vtable +0x13c = 0xe62c8c (vtable 0x17bd9ac; +0xf0 the base 0xca52c), READ whole
// (0xe62c8c..0xe62d00, the pop) and emulated (dev/em038_00-effects-spec.md 1). It calls 0xca170 first, then by motion id
// -- no action, variant or part-break input; both writes go through the post-indexed pointer to +0x13f4 (0xe62cc4 /
// 0xe62cf0, str at 0xe62cfc):
//   * L2 M3 (0x203): vt+0x370(e, 1) = 0xa3bf4, P+0x3b4 bit 0 -- the tail severed -- ORs bits 18-20 (0x1c0000), else
//     bits 15-17 (0x38000) (movne at 0xe62cf4): u 362 / c 72 / u 361 with the tail on, nothing of his with it cut. The
//     viewer reads it from the parts SHOWN (render/motion-states.js SHELL_TAIL em038_00: his part pass 0xe5bd44..0xe5bd64
//     draws set 13 on the same test, and set 13 is the one set that draws part 8): state.severed.
//   * L0 M2 (0x002): 0x81d6c -- posture 4 AND P+0x5c < 0.9 x MoguriBaseOfs (0xbf62c), "already sunk" (I, Basarios's
//     reading) -- returns with nothing more (popne 0xe62cbc), else ORs bits 21-23 (0xe00000): c 71. His seven L0 M2 plays
//     take posture 4 and set the motion from frame 0 (0xe5c090 .. 0xe5fd20): STAND-IN state.sunk = false, as Akantor's
//     (P+0x5c at those starts is NOT READ as a value).
//   * every other motion: the base alone -- so L2 M12's bits 21 / 22 (u 320 / u 330) are never enabled (emulated L2 M12
//     0x1ff / 0xe3f). He is never tired (states-em038_00.md 6), so bits 12-14 never fire.
function em038_00(motion, action, state){
  if (motion === 0x203) return state.severed ? 0x1c0000 : 0x38000;
  if (motion === 0x002) return state.sunk ? 0 : 0xe00000;   // 0x81d6c; the viewer plays it from the surface
  return 0;
}

// AHTAL-KA (em088_00), uEm088_00 vtable +0x13c = 0x10bc340, READ whole (..0x10bc408) and emulated (dev/em088_00-effects-
// spec.md 1; control: Garuga's 0xdb0d10 reproduced). It calls 0x6d1b4 -- the base 0xca170, then the per-motion lists of
// the Ahtal layer, whose vt+0x488 / +0x484 / 0xb07b4 calls write no +0x13f4 (closure scan, control 0xca170) -- then:
//   * EVERY motion: e+0xcb0c, the object he CARRIES (0 / 1 / 2; 4 = none, the spawn value; the setter 0x10b62f4 from the
//     AI's pending bytes e+0xd470 / +0xd471 in the (1, 3) / (1, 0x12) / (1, 0x13) carries; the action starts in
//     EM088_DROPS drop it): 0 -> bits 18-20, 1 -> bits 21-23, 2 -> bits 15-17 (table 0x16a37f4); none -> nothing.
//     state.carry: the viewer's Carrying control as the play's action leaves it (em088CarryAt; 4 / null = none).
//   * L2 M30 (0x21e), status 1: 0x1c / 0x1d / 0x22 / 0x23 -> bit 27, 0x1e / 0x1f / 0x24 / 0x25 -> bit 28 (table
//     0x16a3800, mask 0x3cf): u 451 / u 452. Each pair is a (1, n) start and its (1, n + 1) hold, both play L2 M30
//     (0x10bcc9c / 0x10bccf0 / 0x10bcd58 / 0x10bce1c, then 0x10c03d8).
//   * every other motion, (10, 0xaf) -> bits 24-26 (L3 M3 -> L3 M5 -> L3 M7: u 460 / u 461 / u 462).
const EM088_L2M30 = [0x8000000, 0x8000000, 0x10000000, 0x10000000, 0, 0, 0x8000000, 0x8000000, 0x10000000, 0x10000000];
const EM088_CARRY = [0x1c0000, 0xe00000, 0x38000];
function em088_00(motion, action, state){
  let w = EM088_CARRY[state.carry] || 0;
  if (motion === 0x21e){
    if (action && action[0] === 1 && action[1] >= 0x1c && action[1] <= 0x25) w |= EM088_L2M30[action[1] - 0x1c];
  } else if (action && action[0] === 10 && action[1] === 0xaf) w |= 0x7000000;
  return w;
}
// AHTAL-KA'S CARRIED OBJECT AT AN ACTION'S START -- his on-action-start vt+0x204 0x10b4828, READ for this (2026-10-15;
// dev/em088_00-effects-spec.md 1.1 emulated the same list, all 16 x 256 starts): the starts that DROP the object
// (e+0xcb0c = 4, the piece back into the world as the CU's unit) are
//   (0, 2) (0x10b4b68: when e+0x73e4 is 0, meaning NR -- the emulated start drops) and (1, 2) (0x10b5b78), both -> 0x10b5f44;
//   (1, 6) / (1, 0x20) -> 0x10b5298 (shell57 dropped, 4 stored at 0x10b52b4);
//   (7, 0x10) / (7, 0x32) -> 0x10b51e4 -> 0x10bb7c0, THE THROW: 4 stored at 0x10bb8cc before the body sets L2 M17;
//   status 10 through the table 0x10b4e98 (n - 0x1d, 0xa9 entries): 0x1d..0x20, 0x2a, 0x2b, 0x44, 0x45, 0x94, 0x9b, 0xa1,
//     0xa7, 0xa9, 0xab, 0xaf, 0xbb..0xbe, 0xc5 -> 0x10b5f44, which stores 4 at 0x10b6114 (when no pull is in flight,
//     e+0xd488 == 0); every other (10, n) keeps it -- the part-break reaction (10, 7) / (10, 0x14) / (10, 0x52) and the
//     exhaust (10, 0x1b) among them -- unless e+0xd48e is set (NR) or he is dying (vt+0x3f4, 0x10b4e64);
//   (11, *): dying, the same 0x10b5f44.
// Not a clip's: any start while e+0xd499 is set (EMC op 0xa3 b1 9, an AI flag) drops it too (0x10b49c0..0x10b49e0).
// Every other start leaves it -- (1, 1) the roar, (1, 3) the pick-up (it sets it at L2 M14 f150, 0x10bd2e8), (1, 5) /
// (1, 0xd) / (1, 0xe) / (1, 0x13) the pull, (1, 0x10) the rage end, (2, n) his moves.
const EM088_DROP10 = new Set([0x1d, 0x1e, 0x1f, 0x20, 0x2a, 0x2b, 0x44, 0x45, 0x94, 0x9b, 0xa1, 0xa7, 0xa9, 0xab, 0xaf,
                              0xbb, 0xbc, 0xbd, 0xbe, 0xc5]);
export function em088Drops(action){
  if (!action) return false;
  const [s, n] = action;
  return (s === 0 && n === 2) || (s === 1 && (n === 2 || n === 6 || n === 0x20)) || (s === 7 && (n === 0x10 || n === 0x32))
      || (s === 10 && EM088_DROP10.has(n)) || s === 11;
}
// the object he carries through a play: the user's choice (0 / 1 / 2; 4 / null = none) unless the play's action dropped
// it at its start. The word is built at the motion's start (0x7256c), after the action start, so it reads the same.
export function em088CarryAt(action, choice){
  const c = choice === 0 || choice === 1 || choice === 2 ? choice : 4;
  return em088Drops(action) ? 4 : c;
}

// AHTAL-NESET (em087_00), uEm087_00 vtable +0x13c = 0x10ad838, READ (extent ..0x10ad9f4) and emulated (dev/rom-map.md
// uEm087_00; dev/remaining-classes-effects-survey.md): 0x6d1b4's word, then bits 15-23 (0x3f8000 | 0xc00000) ALWAYS; its
// 14-entry table 0x10ad884 (L3 M3..M16) writes no +0x13f4 (part work only). 15 motions x calm / enraged / tired emulated
// to base | 0xff8000 on every one.
const em087_00 = () => 0xff8000;

// DIABLOS (em007_00): the same uEm007_00 vt+0x13c 0xd4532c as Bloodbath, whose ONE variant test (0xd454b4..0xd454c0:
// L2 M22 under (7, 0x67), e+0xb5f5 != 4 returns with the tail bits alone -- popne 0xd454c0 -- where Bloodbath adds bit 21)
// is the only difference; his variant byte is 0 (his part pass 0xd36e50 runs his half on `cmp #0`). Checked against the ROM
// under unicorn at variants 0 / 4 / 1 / 2 / 3 / 5, 76,032 runs, 0 mismatches (dev/em007_00-effects-spec.md).
function em007_00(motion, action, state){
  if (motion === 0x216) return state.severed ? 0x1c0000 : 0x38000;
  return em007_04(motion, action, state);
}

// THE RATH LINE -- Rathian / Gold / Dreadqueen (em 1) and Rathalos / Silver / Dreadking (em 2): ONE class, uEm001_00
// (vtable 0x1793c28; there is no uEm002_00 -- the id map 0x50aa8 puts all six on it, told apart by the em byte e+0xb5f4,
// the variant e+0xb5f5 and the id word e+0xb5f0). vt+0x13c = 0xd09054, READ whole (..0xd09420, jump table 0xd09090) and
// emulated by two agents (dev/em001-effects-spec.md: 195,840 runs; dev/em002-effects-spec.md: 14,976 runs; 0 mismatches):
//   L2 M3 / M4 (both lines) and, em 1 only, L4 M6 / M50 / M52 / M55 / M65 and L9 M2 / M6 -- THE TAIL FORM: severed -> bits
//     21-23 (severed L4 M65 also clears bit 1, u 350 off); on variant 4 (Dreadqueen / Dreadking) bits 18-20 when part 7's
//     break level reaches the .dtp threshold (2 at both ranks) or the quest number (0x49930 -> 0x3a8470) is 5 or under;
//     else bits 15-17. state.questLevel: the viewer's quest (index.html SHELL_QUEST_LEVEL, 10).
//   L2 M1: bits 24-26 by enemy id (Gold 0x201, Silver 0x202, Dreadqueen 0x401), not while tired (0x81614).
//   L4 M32 (em 2 only): bits 27-29 under (7, 3 / 0x29 / 0x2b / 0x2c / 0x48 / 0x49), not while tired.
//   L4 M38: (7, 0xf5) clears bits 6-12 and sets 30-31.
//   L0 M16 / M17: bits 18-19 under (1, 7) / (1, 8) -- c 60 / c 61, which have no record.
// No CLIP_ACTIONS: L4 M32 / M38 take their action from the shell picks (pickVariantsFor), which playNow uses first.
const RATH_TAIL1 = new Set([0x406, 0x432, 0x434, 0x437, 0x441, 0x902, 0x906]);
const RATH_L4M32 = new Set([0x03, 0x29, 0x2b, 0x2c, 0x48, 0x49]);
const rath = (em, id, v4) => (motion, action, state) => {
  const s = action ? action[0] : -1, n = action ? action[1] : -1;
  const tail = () => {
    if (state.severed) return 0xe00000;
    if (v4 && ((state.breakLevel7 | 0) >= 2 || ((state.questLevel | 0) >>> 0) <= 5)) return 0x1c0000;
    return 0x38000;
  };
  if (motion === 0x203 || motion === 0x204) return tail();
  if (em === 1 && RATH_TAIL1.has(motion)) return motion === 0x441 && state.severed ? { set: 0xe00000, clear: 0x2 } : tail();
  if (motion === 0x201) return (id === 0x201 || id === 0x202 || id === 0x401) && !state.tired ? 0x7000000 : 0;
  if (em === 2 && motion === 0x420) return s === 7 && !state.tired && RATH_L4M32.has(n) ? 0x38000000 : 0;
  if (motion === 0x426) return s === 7 && n === 0xf5 ? { set: 0xc0000000, clear: 0x1fc0 } : 0;
  if (motion === 0x010 || motion === 0x011) return s === 1 && (n === 7 || n === 8) ? 0xc0000 : 0;
  return 0;
};

// KHEZU (em003_00), uEm003_00 vt+0x13c = 0xd0f728, READ whole (..0xd0f9a0) and emulated (dev/em003_00-effects-spec.md:
// 66,744 runs, 0 mismatches). The enraged group (bits 9-11) follows the ACTION: the charged attacks set it, their plain
// twins and the walks clear it (the AI issues the charged form while enraged, EMC op 0x1c). L2 M37 adds bits 15-16 (u 261),
// or 17-18 on (7, 0x52)'s second play (P+0x1a1 == 3: the entry's `phase`, state.phase); L2 M38 adds 19-20 (u 320) under
// (7, 0x52) only.
const EM003_OFF7 = new Set([0x00, 0x02, 0x0f, 0x11, 0x12, 0x30, 0x44, 0x48, 0x4e]);
const EM003_ON7 = new Set([0x09, 0x0a, 0x0b, 0x10, 0x3b, 0x49, 0x4f]);
const EM003_OFF3 = new Set([0x43, 0x4f, 0x55]);
const EM003_OFF2 = new Set([0x00, 0x05, 0x06, 0x07, 0x08, 0x0a, 0x0e]);
function em003_00(motion, action, state){
  const s = action ? action[0] : -1, n = action ? action[1] : -1;
  const off = (s === 7 && EM003_OFF7.has(n)) || (s === 3 && EM003_OFF3.has(n)) || (s === 2 && EM003_OFF2.has(n));
  let set = s === 7 && EM003_ON7.has(n) ? 0xe00 : 0;
  const a52 = s === 7 && n === 0x52;
  if (motion === 0x226) set |= a52 ? 0x180000 : 0;
  else if (motion === 0x225) set |= a52 && (state.phase | 0) === 3 ? 0x60000 : 0x18000;
  return { set, clear: off ? 0xe00 : 0 };
}
// GRAVIOS (em005_00), uEm004_00 vt+0x13c 0xd2e0ec with its em-5 tail 0xd2e35c..0xd2e524, READ whole and emulated
// (dev/em005_00-effects-spec.md: 82,800 runs, 0 mismatches). The gas clips by action and the BACK break; the beam clips by
// action and the back / belly breaks (state.backBroken / bellyBroken: SHELL_PARTS em005_00, the groups only the broken sets
// draw); L0 M7 the burrow (state.sunk, the viewer's false stand-in).
const EM005_GAS = new Set([0x203, 0x204, 0x21e, 0x21f, 0x220]);
const EM005_BEAM = new Set([0x218, 0x221, 0x43b]);
function em005_00(motion, action, state){
  const n = action && action[0] === 7 ? action[1] : -1;
  if (EM005_GAS.has(motion)){
    if (n === 0x0a || n === 0x32 || n === 0x3c) return state.backBroken ? 0x180000 : 0x18000;
    if (n === 0x07 || n === 0x3b) return state.backBroken ? 0x600000 : 0x60000;
    return 0;
  }
  if (EM005_BEAM.has(motion)){
    if (n !== 0x0e && n !== 0x11 && n !== 0x34) return 0;
    return state.backBroken ? 0xe0000000 : state.bellyBroken ? 0x3800000 : 0;
  }
  if (motion === 0x007) return state.sunk ? 0 : 0x18000000;
  return 0;
}

// BARIOTH (em042_00), uEm042_00 vtable +0x13c = 0xe70b78 (vtable 0x17be9a0; +0xf0 the base 0xca52c), READ whole
// (0xe70b78..0xe70d14) and emulated -- 74880 runs against the ROM, 0 mismatches (dev/em042_00-effects-spec.md 1, 6).
// 0xca170 first, then by motion id -- no variant, posture or part-break input:
//   * L2 M8 (0x208), status 7, number in 0 / 1 / 0x0f / 0x14 / 0x1c / 0x1e, tail on -> bits 15-16 (u 200 on (7, 0x0f) /
//     (7, 0x14), the two that play it);
//   * L2 M9 / M10, the same six -> bits 15-16 (nothing bound), 0x21 / 0x22 -> bits 17-18 (u 240), tail on only. The remap
//     vt+0x1fc 0xe64f48 makes (7, 0) / (7, 1) INTO 0x21 / 0x22 while the tail is on, so every intact play fires u 240;
//   * L0 M4, (1, 0) or (1, 0x0e) -> bits 19-20 (c 90 on the rage roar), no sever test;
//   * every other motion: the base alone -- L2 M32 / M33's u 324 / 325 / 330 / 331 / 340 / 341 are never enabled.
const EM042_A = n => (n === 0 || n === 1 || n === 0x0f || n === 0x14 || n === 0x1c || n === 0x1e);
function em042_00(motion, action, state){
  const n = action && action[0] === 7 ? action[1] : -1;
  if (motion === 0x004) return action && action[0] === 1 && (action[1] === 0 || action[1] === 0x0e) ? 0x180000 : 0;
  if (state.severed) return 0;                                         // both tail arms test P+0x3b4 bit 0
  if (motion === 0x208) return EM042_A(n) ? 0x18000 : 0;
  if (motion === 0x209 || motion === 0x20a) return EM042_A(n) ? 0x18000 : (n === 0x21 || n === 0x22) ? 0x60000 : 0;
  return 0;
}
// SEREGIOS (em077_00), uEm077_00 vtable +0x13c = 0xfee088 (vtable 0x17e7c08; +0xf0 the base 0xca52c), READ whole
// (0xfee088..0xfee128) and emulated -- 69120 runs against the ROM, 0 mismatches (dev/em077_00-effects-spec.md 1, 6).
//   * EVERY motion: P+0x3b4 bit 0 -- the tail cut (0xc2274 at 0xfdae24) -- CLEARS bits 5-7 and ORs 18-20: u 200 / 201 / 230
//     (b6, calm) go, u 202 / 203 / 231 (b18) come; the enraged b9 forms stay;
//   * L2 M26 (0x21a) / L2 M34 (0x222), status 7, number 0x3a / 0x3b / 0x3f / 0x40 -> bits 15-17: u 233 on the (7, 0x3a) /
//     (7, 0x3b) dives, u 234 on the (7, 0x3f) / (7, 0x40) landings that follow them.
function em077_00(motion, action, state){
  const n = action && action[0] === 7 ? action[1] : -1;
  const act = (motion === 0x222 || motion === 0x21a) && n >= 0x3a && n <= 0x40 && ((0x63 >> (n - 0x3a)) & 1) ? 0x38000 : 0;
  return state.severed ? { set: 0x1c0000 | act, clear: 0xe0 } : act;
}

// ZINOGRE (em057_00) / THUNDERLORD ZINOGRE (em057_04), ONE class uEm057_00, vtable 0x17ca8ec +0x13c = 0xf0279c, READ whole
// (0xf0279c..0xf02e90, literal pool 0xf02e94..0xf02e9c, next function 0xf02ea0) and emulated -- 254464 runs against the ROM,
// 0 mismatches (dev/em057-effects-spec.md 1, 2). 0xca170 first, then the variant byte e+0xb5f5 == 4 (0xf027b8) splits it:
//   ZINOGRE (any variant but 4): L2 M58..M63 (0x23a..0x23f) at G (0x3a8430 >= 5) -> bits 30-31 (u 234 / 235 b31);
//     L3 M13 / M21 (0x30d / 0x315), status 11, e+0xcb14 (died charged, set at the status-11 start, 0xeed0bc) -> 21-23
//     (u 650 / 651); L3 M20 (0x314), (1, 9 / 0x22 / 0x26) -> bit 15 (c 60, the rage roar); L0 M20 (0x14), (7, 0x5e / 0x71 /
//     0x72 / 0x73) -> bits 6-11 CLEARED and 18-20 set (u 470; u 440's b6 / b9 off); L0 M24 (0x18): (1, 4) -> 24-26 (u 500),
//     any other play -> 18-20 (u 471; the 0x6fe88(e, 1, 0x15) at 0xf02d08 is called and its result never read). Then, ONLY
//     WHILE CHARGED (0x816d4 = P+0x5df3): e+0xb5f8 == 9 -> L2 M1 / M2 / M40 / M41 / M43 / M44 bits 30-31 (u 235 / 234 /
//     232 / 233); else L2 M1 / M2 / M15 / M18 / M25 / M26 / M37 / M38 / M39 bits 27-29 (u 211 / 210 / 260 / 320 / 350 / 410).
//   THUNDERLORD (variant 4): L2 M15 / M18 / M25 / M26 / M37 / M38 / M39 and (at G) L2 M58..M63: charged ? 27-29 : 21-23;
//     L2 M40 / M41 / M43 / M44: charged ? 30-31 : 22; L2 M1 / M2: e+0xb5f8 == 9 -> bit 6 cleared and, on (7, 0xfb / 0xfc),
//     charged ? 30-31 : 22; else charged ? bit 6 cleared + 27-29 : bit 6; L2 M24 (0x218) uncharged: bit 0 cleared, 21-23
//     (u 300); L0 M20 (7, 0x5e / 0x71..0x73): bits 6-11 cleared, charged ? 18-20 : 27-29 (u 470 / u 480); L0 M24: (1, 4) ->
//     24-26, (1, 0x15) -> 18-20, else charged ? 18-20 : 27-29 (u 481); L3 M13 / M21 status 11: e+0xcb14 ? 21-23 : 24-26
//     (u 650 / 651 or u 680 / 681); L3 M20 as Zinogre's. LAST, AT G, EVERY MOTION: bits 9-11 CLEARED -- at G his enraged
//     group never fires (u 220 / 221, c 202 b9, u 440 b9).
// e+0xb5f8 is a ONE-FRAME byte: 0x6f4e8 zeroes it every frame (0x6f584, the +0x28 pass) and three action bodies write 9 at
// their entry every frame -- 0xefa468 / 0xefa834 / 0xefd350, the (7, 0x9d..0xab) and (7, 0xf9 / 0xfa / 0xfd / 0xfe) attacks
// (L2 M40 / M41 / M43 / M44 / M58..M63). (7, 0xfb) / (7, 0xfc) are their follows (0xefd498..0xefd4bc: vt+0x3d0 = 0x768c8,
// which changes the action the same update, rom-map 0xa5af4) and play L2 M1 / M2 from f24 with the 9 still set; no command
// stream issues them. So the byte is the action's: state.b5f8 is a check-only override.
//   state.charged = the Charge State control's flagged rung (index.html: Zinogre's Fully Charged, Thunderlord's Overcharged
// -- the rungs the part pass draws while P+0x5df3 is up); a death play reads it as e+0xcb14 (died charged). state.rank = G.
const Z57_NINE = n => (n >= 0x9d && n <= 0xab) || (n >= 0xf9 && n <= 0xfe);
const Z57_CHARGED_27 = new Set([0x201, 0x202, 0x20f, 0x212, 0x219, 0x21a, 0x225, 0x226, 0x227]);
const Z57_NINE_30 = new Set([0x201, 0x202, 0x228, 0x229, 0x22b, 0x22c]);
const Z57_ROAR = n => n === 0x09 || n === 0x22 || n === 0x26;
const Z57_L0M20 = n => n === 0x5e || n === 0x71 || n === 0x72 || n === 0x73;
const em057 = v4 => (motion, action, state) => {
  const s = action ? action[0] : 0, n = action ? action[1] : -1;
  const charged = !!state.charged, g = (state.rank | 0) >= 5;
  const nine = state.b5f8 !== undefined ? state.b5f8 === 9 : (s === 7 && Z57_NINE(n));
  const died = state.diedCharged !== undefined ? !!state.diedCharged : charged;
  let set = 0, clear = 0;
  if (motion === 0x30d || motion === 0x315){
    if (s === 11) set = died ? 0xe00000 : v4 ? 0x7000000 : 0;
  } else if (motion === 0x314){
    if (s === 1 && Z57_ROAR(n)) set = 0x8000;
  } else if (motion === 0x014){
    if (s === 7 && Z57_L0M20(n)){ clear = 0xfc0; set = v4 && !charged ? 0x38000000 : 0x1c0000; }
  } else if (motion === 0x018){
    set = s === 1 && n === 4 ? 0x7000000 : (!v4 || (s === 1 && n === 0x15) || charged) ? 0x1c0000 : 0x38000000;
  } else if (motion >= 0x23a && motion <= 0x23f){
    if (g) set = v4 ? (charged ? 0x38000000 : 0xe00000) : 0xc0000000;
  } else if (v4){
    if (motion === 0x201 || motion === 0x202){
      if (nine){ clear = 0x40; if (s === 7 && (n === 0xfb || n === 0xfc)) set = charged ? 0xc0000000 : 0x400000; }
      else if (charged){ clear = 0x40; set = 0x38000000; }
      else set = 0x40;
    } else if (Z57_CHARGED_27.has(motion)) set = charged ? 0x38000000 : 0xe00000;
    else if (motion === 0x228 || motion === 0x229 || motion === 0x22b || motion === 0x22c) set = charged ? 0xc0000000 : 0x400000;
    else if (motion === 0x218 && !charged){ set = 0xe00000; clear = 0x1; }
  } else if (charged) set = nine ? (Z57_NINE_30.has(motion) ? 0xc0000000 : 0) : (Z57_CHARGED_27.has(motion) ? 0x38000000 : 0);
  if (v4 && g) clear |= 0xe00;
  return clear ? { set, clear } : set;
};

// CONGALALA (em021_00), uEm021_00 vtable 0x17afde4 +0x13c = 0xdd7cf4, READ whole (0xdd7cf4..0xdd7f98, the pop) and emulated
// (dev/em021_00-effects-spec.md 1; states-em021_00.md 3.4 read it first under the withdrawn name "attack hit-group mask").
// 0xca170 first, then by motion id -- ctl = [e+0xcac0] (P+0x60): ctl[0] the item at his tail, ctl[1] the gas type:
//   * L0 M43 (0x2b) / L2 M16 (0x210): gas 1 -> bits 15-16, 2 -> 19-20, 3 -> 17-18, 4 -> 21-22 (table 0xdd7dc0), 0 -> none
//     (u 260..263 / u 200..203: four DIFFERENT records, one per gas);
//   * L0 M25 (0x19): item 2 -> 15-16, 3 -> 21-22, 4 -> 17-18, 5 -> 19-20, 1 / 6 -> none (table 0xdd7df4); item 0 -> while
//     e+0x4b4 is 0x19 (0xb0944; the motion being set, I), by the action number (table 0xdd7e3c): 0x0b / 0x37 -> 19-20,
//     0x0c / 0x38 -> 17-18, 0x0e / 0x39 -> 21-22, 0x35 / 0x36 -> 15-16 (c 150..153);
//   * L0 M28 (0x1c): (1, 9) -> 27-28 (c 120);   * L2 M2 (0x202), status 7: n 1 -> 25-26 (u 281), n 0 -> 23-24 (u 280);
//   * L3 M15 (0x30f): vt+0x3f4 (0x7fed4: status 0xb / 0xe or (0xc, 0xff)) -> 27-28 (c 3001), else 0x81bb0(e, 0) (P+0x5e08 bit 0 or P+0x522:
//     asleep) -> 29-30 (c 50).
// state.item = ctl[0] from the Item row shown (em021Item); state.gas = ctl[1] (em021Gas: the eating action's own, else the
// play's `gas`); state.asleep = 0x81bb0's answer (the pit sleep's play).
const CONGA_GAS = { 1: 0x18000, 2: 0x180000, 3: 0x60000, 4: 0x600000 };
const CONGA_ITEM = { 2: 0x18000, 3: 0x600000, 4: 0x60000, 5: 0x180000 };
const CONGA_NUM = { 0x0b: 0x180000, 0x37: 0x180000, 0x0c: 0x60000, 0x38: 0x60000, 0x0e: 0x600000, 0x39: 0x600000, 0x35: 0x18000, 0x36: 0x18000 };
function em021_00(motion, action, state){
  const s = action ? action[0] : 0, n = action ? action[1] : -1;
  if (motion === 0x02b || motion === 0x210) return CONGA_GAS[state.gas | 0] || 0;
  if (motion === 0x019){
    const it = state.item | 0;
    if (it !== 0) return CONGA_ITEM[it] || 0;
    return state.motionIs19 === false ? 0 : (CONGA_NUM[n] || 0);
  }
  if (motion === 0x01c) return s === 1 && n === 9 ? 0x18000000 : 0;
  if (motion === 0x202) return s === 7 ? (n === 1 ? 0x6000000 : n === 0 ? 0x1800000 : 0) : 0;
  if (motion === 0x30f) return (s === 11 || s === 14 || (s === 12 && n === 0xff)) ? 0x18000000 : state.asleep ? 0x60000000 : 0;
  return 0;
}
// ctl[0] from the parts drawn (part-review em021_00 Item row; states-em021_00.md 2.2): group 12 the bone (1), 16 / 15 / 19 / 17
// the four mushrooms on the stalk 13 (2 / 3 / 4 / 5), 14 the rock (6), none (0)
export function em021Item(drawn){
  const on = g => !!drawn && (drawn.get ? drawn.get(g) : drawn[g]) === true;
  return on(12) ? 1 : on(16) ? 2 : on(15) ? 3 : on(19) ? 4 : on(17) ? 5 : on(14) ? 6 : 0;
}
// ctl[1] at a motion start: the eating actions set it at their start (vt+0x204 0xdcefd8, states-em021_00.md 3.2: (1, 0x35 / 0x40)
// 1, (1, 0x0b / 0x42) 2, (1, 0x0c / 0x41) 3, (1, 0x0e / 0x43) 4; (1, 9) empties it); any other play keeps the gas it carries --
// the viewer's stand-in is the play's `gas` (each L2 M16 play the next type)
const CONGA_GAS_SET = { 0x35: 1, 0x40: 1, 0x0b: 2, 0x42: 2, 0x0c: 3, 0x41: 3, 0x0e: 4, 0x43: 4, 0x09: 0 };
export function em021Gas(action, fallback){
  return action && action[0] === 1 && CONGA_GAS_SET[action[1]] !== undefined ? CONGA_GAS_SET[action[1]] : (fallback | 0);
}

// BLANGONGA (em022_00), uEm022_00 vtable +0x13c = 0xdda5ac, READ whole (0xdda5ac..0xdda65c, the pop) and emulated
// (dev/em022_00-effects-spec.md 1). 0xca170 first, then k = motion - 5 (k <= 0x1c):
//   * k in 0x200f -- L0 M5 / M6 / M7 / M8 / M18: 0x81d6c (posture 4 and P+0x5c below 0.9 x MoguriBaseOfs, -500) ? bits 18-20
//     (none bound) : bits 15-17 (c 0 / c 1 / c 43 / c 30, the footfalls and the snow kick) -- the snow-dive turns (6, 4 / 9 / 0xd
//     / 0xe / 0xf / 0x10) and dive (6, 7 / 8 / 0xc) enter posture 4 and sink (0xbc7f4(4), 0xbf62c, 0xbf700) BEFORE the motion;
//   * k in 0x18000000 -- L0 M32 / M33 (the rage roar, the summon howl): bits 21-23 (c 120) while the fangs' break level
//     0x9d36c(e, 0) is BELOW the .dtp threshold (array A row 0 byte 1, byte 2 above rank 4: both 2) -- the same gate as the
//     summon. state.fangsBroken = the broken muzzle shown (SHELL_PARTS em022_00, group 2: set 7 only).
function em022_00(motion, action, state){
  const k = motion - 5;
  if (k < 0 || k > 0x1c) return 0;
  if ((0x200f >>> k) & 1) return state.sunk ? 0x1c0000 : 0x38000;
  if ((0x18000000 >>> k) & 1){
    const lv = state.fangLevel !== undefined ? state.fangLevel | 0 : state.fangsBroken ? 2 : 0;
    return lv < (state.fangThreshold !== undefined ? state.fangThreshold : 2) ? 0xe00000 : 0;
  }
  return 0;
}

// RAJANG / FURIOUS RAJANG (em023_00 / em023_05), ONE class uEm023_00 (no variant test in the word), vtable +0x13c = 0xded0f4,
// READ whole (0xded0f4..0xded23c) and emulated (dev/em023-effects-spec.md 1): 0xca170, then L2 M8 (0x208) only, not tired
// (0x81614), action NUMBER (the status is not tested) in 6 / 0xa / 0x34 / 0x35 / 0x3e / 0x3f / 0x40 (table 0xded140, n - 6 <=
// 0x3a) -> bits 15-17 (u 291). L2 M8's plays (7, 5 / 6 / 0xa / 0xc / 0x3b / 0x3e / 0x43): u 291 on (7, 6 / 0xa / 0x3e) only.
const RAJ_N = n => n === 6 || n === 0xa || n === 0x34 || n === 0x35 || n === 0x3e || n === 0x3f || n === 0x40;
const em023 = (motion, action, state) => motion === 0x208 && !state.tired && action && RAJ_N(action[1]) ? 0x38000 : 0;

// BULLDROME (em030_00), uEm030_00 vtable +0x13c = 0xe1c4b0, READ whole (0xe1c4b0..0xe1c4fc) and emulated (dev/em030_00-effects-
// spec.md 1): 0xca170, then motion <= 0xe in 0x40e0 -- L0 M5 / M6 / M7 / M14 -- 0x81d6c (sunk) ? bits 18-20 (none bound) : 15-17
// (c 30 / c 31 / c 91). The burrowed plays enter posture 4 and sink (0xbf62c, 0xbf700, 0xbc7f4(4)) BEFORE the motion: the dig
// charge (6, 2) on L0 M5, the burrowed turn (6, 1) through table 0x169d794 (L0 M6 / M6 / M7), the burrowed idle (0, 7) on L0 M14.
const em030_00 = (motion, action, state) => motion <= 0xe && ((0x40e0 >>> motion) & 1) ? (state.sunk ? 0x1c0000 : 0x38000) : 0;

// ARZUROS / REDHELM / VOLVIDON (em060_00 / em060_04 / em062_00), ONE class uEm060_00, vtable +0x13c = 0xf1911c, READ whole
// (0xf1911c..0xf191d4) and emulated (dev/em060-effects-spec.md 1). 0xca170, then:
//   * motion <= 9 in 0x312 -- L0 M1 / M4 / M8 / M9: bits 21-23 unless 0x81d6c (sunk) -- c 30 / 31 / 34, Volvidon's c 20 / 21 / 50;
//   * ONLY variant 4 with em 0x3c (Redhelm; e+0xb5f5 / e+0xb5f4): L0 M13 / L0 M17 -> bit 15 (c 60 -- so Arzuros's c 60 never
//     fires); L9 M1 (0x901) -> bits 18-20 while e+0xcaee != 0 -- set at reset to 0x3a8430 > 4 (0xf115dc): G (u 320).
const em060 = redhelm => (motion, action, state) => {
  let r = motion <= 9 && ((0x312 >>> motion) & 1) && !state.sunk ? 0xe00000 : 0;
  if (redhelm){
    if (motion === 0x00d || motion === 0x011) r |= 0x8000;
    else if (motion === 0x901 && (state.rank | 0) > 4) r |= 0x1c0000;
  }
  return r;
};

// LAGOMBI / SNOWBARON (em061_00 / em061_04), ONE class uEm061_00, vtable +0x13c = 0xf32bac, READ whole (0xf32bac..0xf32c4c) and
// emulated (dev/em061-effects-spec.md 1). 0xca170, then L0 M6, and motion - 0x33 <= 0xa in 0x601 (L0 M51 / M60 / M61): bits
// 21-23 unless 0x81d6c (sunk); then variant 4 only (e+0xb5f5, Snowbaron): L0 M2 / L0 M52 -> bit 15 (c 10 -- so Lagombi's never
// fires), L2 M57 (0x239) -> bit 18 (u 302).
const em061 = v4 => (motion, action, state) => {
  const k = motion - 0x33;
  let r = (motion === 6 || (k >= 0 && k <= 0xa && ((0x601 >>> k) & 1))) && !state.sunk ? 0xe00000 : 0;
  if (v4) r |= (motion === 2 || motion === 0x34) ? 0x8000 : motion === 0x239 ? 0x40000 : 0;
  return r;
};

// PLESIOTH (em010_00), uEm010_00 vtable +0x13c = 0xd6bbc8, READ whole (0xd6bbc8..0xd6bc68) and emulated (dev/em010_00-effects-
// spec.md 1): 0xca170, then L0 M18 (0x12): posture 4 AND P+0x5c < -550.0 (literal 0xd6bc6c) -> bits 18-20, else bits 15-17
// (c 270); L2 M2 (0x202) status 7 only: number 0x12 -> bits 21-23 (c 41 b22, u 260 b21), 0x13 -> bits 24-26 (c 41 b25, u 260 b24,
// c 300 b26), else nothing. `depth` is P+0x5c at the motion start, from the play's CLIP_ACTIONS entry (the viewer has no water).
const em010_00 = (motion, action, state) => {
  if (motion === 0x012) return (state.posture | 0) === 4 && state.depth < -550 ? 0x1c0000 : 0x38000;
  if (motion === 0x202 && action && action[0] === 7) return action[1] === 0x12 ? 0xe00000 : action[1] === 0x13 ? 0x7000000 : 0;
  return 0;
};

// CEPHADROME (em017_00), uEm017_00 vtable +0x13c = 0xda3738, READ whole (0xda3738..0xda3780, 19 instructions) and emulated
// (dev/em017_00-effects-spec.md 1): 0xca170, then L4 M9 / M10 / M11 (motion - 0x409 <= 2) bits 15-17 (c 60) unless the action
// is (7, 0xc) (0x6fe88). His four out-of-mask bindings (c 121, c 30, u 200 on L2 M29 / M30) sit on base bits 0-2: always on.
const em017_00 = (motion, action) => motion >= 0x409 && motion <= 0x40b && !(action && action[0] === 7 && action[1] === 0xc) ? 0x38000 : 0;

// LAVASIOTH (em036_00), uEm036_00 vtable +0x13c = 0xe3f6c4, READ whole (0xe3f6c4..0xe3f770, 44 instructions) and emulated
// (dev/em036_00-effects-spec.md 1): 0xca170, then L2 M14 (0x20e): 0x3a8430 (the quest rank) > 4 ? bits 18-20 (u 241) : bits
// 15-17 (u 231); L0 M21 (0x15): bit 15 only if 0x81d6c (sunk: posture 4, P+0x5c < 0.9 x MoguriBaseOfs -2000); L0 M13 (0xd):
// bits 15-17 only under (1, 0x30 / 0x31).
const em036_00 = (motion, action, state) => {
  if (motion === 0x20e) return (state.rank | 0) > 4 ? 0x1c0000 : 0x38000;
  if (motion === 0x015) return state.sunk ? 0x8000 : 0;
  if (motion === 0x00d) return action && action[0] === 1 && (action[1] & 0xfe) === 0x30 ? 0x38000 : 0;
  return 0;
};

// LAGIACRUS (em046_00), uEm046_00 vtable +0x13c = 0xea9a0c, READ whole (0xea9a0c..0xea9aac) and emulated (dev/em046_00-
// effects-spec.md 1): 0xca170, then t = 0x6f62c(e, 1) (action-tune int 1 = 99); L0 M5 (0x005) / L2 M6 (0x206): posture 4 (P+0x1ba,
// read through the writeback pointer e+0x13f4 + 0x34) ? bits 24-26 : 21-23; L2 M3 (0x203) / L2 M7..M9 (0x207..0x209): bits
// 15-17 only while P+0x1bb >= t -- the charged tier, the viewer's Charged toggle (`charged`).
const em046_00 = (motion, action, state) => {
  if (motion === 0x005 || motion === 0x206) return (state.posture | 0) === 4 ? 0x7000000 : 0xe00000;
  if (motion === 0x203 || (motion >= 0x207 && motion <= 0x209)) return state.charged ? 0x38000 : 0;
  return 0;
};

// ROYAL LUDROTH (em047_00), uEm047_00 vtable +0x13c = 0xeb388c, READ whole (0xeb388c..0xeb3924) and emulated (dev/em047_00-
// effects-spec.md 1): 0xca170, then L2 M7 (0x207): 0x3a8430 (rank) > 4 ? bits 27-29 (c 183) : 24-26 (c 182); L2 M15 (0x20f):
// vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0, the tail severed) ? 18-20 : 15-17 (c 212 / c 213); L2 M8 (0x208): 0x81d6c (sunk;
// his MoguriBaseOfs is 0) ? 24-26 : 21-23.
const em047_00 = (motion, action, state) => {
  if (motion === 0x207) return (state.rank | 0) > 4 ? 0x38000000 : 0x7000000;
  if (motion === 0x20f) return state.severed ? 0x1c0000 : 0x38000;
  if (motion === 0x208) return state.sunk ? 0x7000000 : 0xe00000;
  return 0;
};

// AGNAKTOR (em049_00), uEm049_00 vtable +0x13c = 0xec3114, READ whole (0xec3114..0xec3210) and emulated (dev/em049_00-effects-
// spec.md 1): 0xca170, s = vt+0x370(e, 1) (0xa3bf4: the tail severed), then L0 M7..M10: 0x81d6c (sunk; MoguriBaseOfs -1000) ?
// bits 18-20 : 15-17, and bit 17 set while the tail is on, cleared when severed (bfc / orreq); L0 M6 and L2 M6 (0x206): sunk ?
// 18-20 : 15-17; L2 M2 (0x202): bit 17 while the tail is on; L2 M10 (0x20a): bits 17-18 while the tail is on.
const em049_00 = (motion, action, state) => {
  const sev = !!state.severed, sunk = !!state.sunk;
  if (motion >= 7 && motion <= 10){ const r = sunk ? 0x1c0000 : 0x38000; return sev ? r & ~0x20000 : r | 0x20000; }
  if (motion === 6 || motion === 0x206) return sunk ? 0x1c0000 : 0x38000;
  if (motion === 0x202) return sev ? 0 : 0x20000;
  if (motion === 0x20a) return sev ? 0 : 0x60000;
  return 0;
};

// NIBELSNARF (em056_00), uEm056_00 vtable +0x13c = 0xeea464, READ whole (0xeea464..0xeea4c4) and emulated (dev/em056_00-effects-
// spec.md 1): 0xca170, then L0 M1 / L0 M2: bits 15-17 unless the action is (6, n), n <= 0x12, n in mask 0x62059 (0 / 3 / 4 / 6 /
// 0xd / 0x11 / 0x12). No record is bound on those bits: listing him brings in his three out-of-mask base bindings and gates the
// base tiers.
const em056_00 = (motion, action) => {
  if (motion !== 1 && motion !== 2) return 0;
  if (action && action[0] === 6 && action[1] <= 0x12 && ((0x62059 >>> action[1]) & 1)) return 0;
  return 0x38000;
};

// MIZUTSUNE / SOULSEER (em082_00 / em082_04), ONE class uEm082_00, vtable +0x13c = 0x1038cac, READ whole (0x1038cac..0x10390dc,
// two 60-entry jump tables on motion - 0x20a at 0x1038de0 / 0x1038fb8) and emulated (dev/em082-effects-spec.md 1). 0xca170; st /
// n = the action (e+0x73e0 / +0x73e1); SET_A = L2 M10 / M11 / M12 / M21 / M39 / M40 / M41 (mask 0xe0000807 on motion - 0x20a):
//   st 10: n 0xaf -> bits 21-23 and on; else SET_A -> FIN; else L3 M3 / L3 M6 -> bits 18-20 and on; else done.
//   st 7: n 7 / 8 -> 24-26 and on; n 0x19 / 0x26 -> (table 2) SET_A -> FIN, L2 M69 -> 27-29, else done; n 0x23 / 0x24 -> 27-29
//         and on; n 0x70 / 0x71 -> (table 1) SET_A -> FIN, L2 M69 -> 24-26, else done; n 0x7b -> L2 M81 (0x251) / L2 M69:
//         15-17, else 18-20, and on.   st 1: n 4 -> 18-20, n 8 -> 15-17, and on.
//   on: SET_A -> FIN; L0 M15 under (1, 0x16 / 0x17) -> 21-23.   FIN: bits 24-26, or for Soulseer (e+0xb5f5 == 4) 27-29 while
//   P+0x1bb bit 1 -- THE SOUL FLAME (states-em082_00.md: 0x1039320 lights it). The viewer has no soul-flame state: `soulFlame`
//   (undefined) shows it unlit, a named stand-in.
const EM082_SETA = m => { const k = m - 0x20a; return k >= 0 && k <= 0x1f && ((0xe0000807 >>> k) & 1) === 1; };
const em082 = v4 => (motion, action, state) => {
  const st = action ? action[0] : 0, n = action ? action[1] : 0;
  const fin = () => (v4 && state.soulFlame) ? 0x38000000 : 0x7000000;
  let w = 0;
  if (st === 10){
    if (n === 0xaf) w |= 0xe00000;
    else if (EM082_SETA(motion)) return w | fin();
    else if (motion === 0x306 || motion === 0x303) w |= 0x1c0000;
    else return w;
  } else if (st === 7){
    const k = n - 7;
    let on = false;
    if (k >= 0 && k <= 0x1f){
      if ((3 >>> k) & 1){ w |= 0x7000000; on = true; }
      else if ((0x80040000 >>> k) & 1){
        const j = motion - 0x20a;
        if (j < 0 || j > 0x3b) return w;
        return EM082_SETA(motion) ? w | fin() : motion === 0x245 ? w | 0x38000000 : w;
      } else if ((0x30000000 >>> k) & 1){ w |= 0x38000000; on = true; }
    }
    if (!on){
      if (n === 0x70 || n === 0x71){
        const j = motion - 0x20a;
        if (j < 0 || j > 0x3b) return w;
        return EM082_SETA(motion) ? w | fin() : motion === 0x245 ? w | 0x7000000 : w;
      }
      if (n === 0x7b) w |= (motion === 0x251 || motion === 0x245) ? 0x38000 : 0x1c0000;
    }
  } else if (st === 1){
    if (n === 4) w |= 0x1c0000; else if (n === 8) w |= 0x38000;
  }
  if (EM082_SETA(motion)) return w | fin();
  if (motion === 0x00f && st === 1 && (n & 0xfe) === 0x16) w |= 0xe00000;
  return w;
};

// TETSUCABRA / DRILLTUSK (em066_00 / em066_04), ONE class uEm066_00, vtable +0x13c = 0xf63fc0, READ whole (0xf63fc0..0xf641f4,
// 142 instructions) and emulated (dev/em066-effects-spec.md 1). 0xca170, then:
//   * L4 M7 / L4 M17 (motion - 0x407 in 0x401): t = part 0 (the tusks) below .dtp row 0's level (1) ? 1 : below row 1's (2)
//     -- `t` = the tusks not fully broken (`tusksBroken`: set 5's group 6 drawn); by the boulder kind ctl+0x30 ([e+0xcac0]+0x30,
//     `boulder`): 2 -> t ? 24-26 : 27-29; 3 -> t ? 19-20 : 30-31; else (1) -> t ? 15-16 : 21-23.
//   * L4 M14 / M15 (0x180): (7, 0xf7 / 0xf8) -> bits 17-18.
//   * L4 M28 / M29 (0x600000): variant 4 -> 18-20; variant 0 -> 0x3a8430 (rank) > 4 ? 18-20 : 15-17; other variants nothing.
//   * L0 M7 / M11 / M12 / M13 (mask 0x3880): bits 27-29 unless 0x81d6c (sunk).
//   * L9 M13 (0x90d): boulder 3 -> 24-26, 2 -> 21-23, else nothing.
const em066 = v4 => (motion, action, state) => {
  const kind = state.boulder !== undefined ? state.boulder | 0 : (v4 ? 2 : 1), t = !state.tusksBroken;
  const k = motion - 0x407;
  if (k >= 0 && k <= 0x16){
    if ((0x401 >>> k) & 1) return kind === 2 ? (t ? 0x7000000 : 0x38000000) : kind === 3 ? (t ? 0x180000 : 0xc0000000) : (t ? 0x18000 : 0xe00000);
    if ((0x180 >>> k) & 1) return action && action[0] === 7 && (action[1] === 0xf7 || action[1] === 0xf8) ? 0x60000 : 0;
    if ((0x600000 >>> k) & 1) return v4 ? 0x1c0000 : ((state.rank | 0) > 4 ? 0x1c0000 : 0x38000);
  }
  if (motion <= 0xd && ((0x3880 >>> motion) & 1)) return state.sunk ? 0 : 0x38000000;
  if (motion === 0x90d) return kind === 3 ? 0x7000000 : kind === 2 ? 0xe00000 : 0;
  return 0;
};

// ZAMTRIOS (em067_00), uEm067_00 vtable +0x13c = 0xf772ec, READ whole (0xf772ec..0xf77364, 31 instructions) and emulated
// (dev/em067_00-effects-spec.md 1): 0xca170, then L0 M7 / M11 / M12 / M13 (mask 0x3880): bits 27-29 unless 0x81d6c (sunk); L4 M31 /
// M32 (0x41f / 0x420): bits 15-17 iff 0x81d18 == 1 -- posture 4 and NOT below 0.9 x MoguriBaseOfs (read whole: rom-map 0x81d18).
const em067_00 = (motion, action, state) => {
  if (motion <= 0xd && ((0x3880 >>> motion) & 1)) return state.sunk ? 0 : 0x38000000;
  if (motion === 0x41f || motion === 0x420) return (state.posture | 0) === 4 && !state.sunk ? 0x38000 : 0;
  return 0;
};

// NAJARALA (em068_00), uEm068_00 vtable +0x13c = 0xf88044, READ whole (0xf88044..0xf880dc) and emulated (dev/em068_00-effects-
// spec.md 1): 0xca170, then L2 M61 (0x23d): 0x9d36c(e, 2) (part 2's break level) >= .dtp row 1's level (byte +5, or +6 at rank
// > 4: 1 at both) ? bits 18-20 : 15-17 -- `part2Broken`; L0 M44 (0x2c): 0x81d6c (sunk) ? bit 18 : bits 15-17.
const em068_00 = (motion, action, state) => {
  if (motion === 0x23d) return state.part2Broken ? 0x1c0000 : 0x38000;
  if (motion === 0x02c) return state.sunk ? 0x40000 : 0x38000;
  return 0;
};

// NERSCYLLA (em070_00), uEm070_00 vtable +0x13c = 0xfab634, READ whole (0xfab634..0xfab6b4) and emulated (dev/em070_00-effects-
// spec.md 1): 0xca170, then on EVERY motion by the quest rank 0x3a8430: >= 5 (G) -> bits 21-23, > 1 -> 18-20, else 15-17; then
// L0 M8 / L0 M6 also bits 30-31 while byte e+0x1068 bit 3 -- the area's floor flag word (`floorFlag8`; the viewer carries no
// floor flags: named stand-in false).
const em070_00 = (motion, action, state) => {
  const rk = state.rank | 0;
  let r = rk >= 5 ? 0xe00000 : rk > 1 ? 0x1c0000 : 0x38000;
  if ((motion === 8 || motion === 6) && state.floorFlag8) r |= 0xc0000000;
  return r >>> 0;
};

// DAIMYO / STONEFIST (em019_00 / em019_04: uEm019_00, em byte 0x13) and SHOGUN / RUSTRAZOR (em020_00 / em020_04: uEm020_00, em
// 0x14). uEm019_00 vt+0x13c = 0xdc0ff4, READ whole (0xdc0ff4..0xdc1460, a 60-entry table on L2 M2..M61 at 0xdc108c) and emulated
// (dev/em019-em020-effects-spec.md 1); most arms need e+0xb5f4 == 0x13 AND variant 4 (STONEFIST). uEm020_00's 0xdc5ac4 (..0xdc5bf8)
// calls it first (with em 0x14 only its ungated arms answer) and adds its own. Inputs: the action; part 5 at .dtp row 0's level
// (`claw5Broken`: set 2's group 1) and part 2 at row 3's (`shellBroken2`: set 10's group 3) -- Stonefist; the rank; sunk;
// Rustrazor's shell type e+0xcadc (`shellType`) and the claws knocked off ((10, 0x72) parts 5 / 6 -> P+0x3b4 0x4000 / 0x2000:
// `claw5Off` / `claw6Off`) -- taken from the parts SHOWN (motion-states.js rustrazorInput: his part pass 0xdc5228 draws the shell
// type as set 11 / 12 / 13 and the knocked-off claws as sets 7 / 8, so the Parts panel's rows are those states; was: named
// stand-ins, 2026-10-18).
const crab019 = (motion, action, state, em, v4) => {
  const SF = em === 0x13 && v4, st = action ? action[0] : 0, n = action ? action[1] : 0;
  const p5 = !!state.claw5Broken, p2 = !!state.shellBroken2;
  const set803 = x => { const j = x - 0xed; return j >= 0 && j <= 0x12 && ((0x7f803 >>> j) & 1) === 1; };
  if (motion > 0x301){
    if (motion > 0x901){
      if ((motion >= 0x90b && motion <= 0x90d) || motion === 0x902) return SF ? (p2 ? 0x6000000 : 0x1800000) : 0;
      if (motion === 0x90e) return SF ? (p5 ? 0x1c0000 : 0x38000) : 0;
      return 0;
    }
    const k = motion - 0x302;
    return k >= 0 && k <= 9 && ((0x23d >>> k) & 1) && SF ? 0x40000 : 0;
  }
  const k = motion - 0x202;
  if (k < 0 || k > 0x3b) return motion === 4 && !state.sunk ? 0x38000 : 0;
  if (k === 0 || k === 2 || k === 9){
    if (st !== 7) return 0;
    if (set803(n)) return SF ? 0xc0000000 : 0;
    return n <= 0xf && ((0xa001 >>> n) & 1) ? 0x38000000 : 0;
  }
  if (k === 4 || k === 6){
    if (st !== 7) return 0;
    if (n > 0xec) return set803(n) && SF ? (p5 ? 0x600000 : 0x180000) : 0;
    if (n === 0xe || n === 0x10) return 0x38000000;
    if (n === 0xdd) return SF ? (p5 ? 0x600000 : 0x180000) : 0;
    return 0;
  }
  if (k === 16 || k === 52 || k === 59) return em !== 0x13 ? 0 : v4 ? 0xe00000 : ((state.rank | 0) > 4 ? 0x1c0000 : 0x38000);
  return 0;
};
const em019 = v4 => (motion, action, state) => crab019(motion, action, state, 0x13, v4) >>> 0;
const em020 = v4 => (motion, action, state) => {
  let r = crab019(motion, action, state, 0x14, v4);
  const own = motion === 0x244 || motion === 0x245 || motion === 0x20b;
  if (!v4){ if (own) r |= 0xc0000; else if (motion === 0x403) r |= 0x600000; return r >>> 0; }
  if (own || motion === 0x909 || motion === 0x90a || motion === 0x403){
    const c4 = (state.shellType | 0) === 4;
    if (!state.claw6Off) r |= c4 ? 0x40000 : 0x200000;      // e+0xcadc == 4 -> bits 18 / 19, else 21 / 22 (0xdc5b68 bne)
    if (!state.claw5Off) r |= c4 ? 0x80000 : 0x400000;
  }
  return r >>> 0;
};

// SELTAS QUEEN (em069_00), uEm069_00 vtable +0x13c = 0xf99960, READ whole (0xf99960..0xf99a60) and emulated (dev/em069_00-effects-
// spec.md 1). 0xca170, then: L4 M71..M75 (0x447..0x44b) bits 18-20 while P+0x1bb bit 0 -- the Seltas link (`seltasLink`; solo:
// off -- the duo list is the duo spec's); L0 M8 bits 15-16 unless sunk; L0 M16 (1, 0x1c) ? bit 22 : bit 21; L3 M2 bits 24-26 iff
// the action is (10, 7), the depleted part (0x9e8d8) is 6 and byte e+0xcad0 != 0 (`cad0`; its only writers in the band zero it at
// reset, the action main never raises it -- census: named, false).
const em069_00 = (motion, action, state) => {
  if (motion > 0x446) return motion - 0x447 < 5 && state.seltasLink ? 0x1c0000 : 0;
  if (motion === 0x008) return state.sunk ? 0 : 0x18000;
  if (motion === 0x010) return action && action[0] === 1 && action[1] === 0x1c ? 0x400000 : 0x200000;
  if (motion === 0x302) return action && action[0] === 10 && action[1] === 7 && (state.part | 0) === 6 && state.cad0 ? 0x7000000 : 0;
  return 0;
};

// KIRIN (em011_00), uEm011_00 vtable +0x13c = 0xd73a18, READ whole (0xd73a18..0xd73b80; a 44-entry jump table on number - 5 at
// 0xd73ac0) and emulated (dev/em011_00-effects-spec.md 1): 0xca170, then L4 M7 (0x407): (7, 5 / 7 / 0xb / 0xd / 0x2d..0x30) ->
// bits 15-17 + 21; (1, 6) -> bits 18-21; L2 M4 (0x204): bits 24-26 unless 0x6fe88(e, 7, 2) -- the action is (7, 2).
const em011_00 = (motion, action) => {
  const st = action ? action[0] : -1, n = action ? action[1] : -1;
  if (motion === 0x407){
    if (st === 7) return (n === 5 || n === 7 || n === 0xb || n === 0xd || (n >= 0x2d && n <= 0x30)) ? 0x238000 : 0;
    return st === 1 && n === 6 ? 0x3c0000 : 0;
  }
  if (motion === 0x204) return st === 7 && n === 2 ? 0 : 0x7000000;
  return 0;
};

// LAO-SHAN LUNG (em012_00), uEm012_00 vtable +0x13c = 0xd77ac8, READ whole (0xd77ac8..0xd77c14) and emulated (dev/em012_00-effects-
// spec.md 1): 0xca170, then bits 15-26 ON EVERY MOTION, unconditionally. The rest walks the two (13, motion) lists at
// [e+0x13f4+0xb6ec] = e+0xcae0 (the pointer register is left at e+0x13f4 by the post-indexed load) calling 0x7db70 (a hit record)
// / 0xb07b4 (the motion rate) per matching entry -- run with the lists populated, they reach both calls and leave +0x13f4 alone.
const em012_00 = () => 0x7ff8000;

// FATALIS / CRIMSON / OLD (em013_00 / em013_01 / em013_02), ONE class uEm013_00, vtable +0x13c = 0xd8aecc, READ whole
// (0xd8aecc..0xd8afc4) and emulated (dev/em013-effects-spec.md 1): 0xca170, then L2 M5 / M6 (0x205 / 0x206) under status 7:
// (7, 0x3b / 0x3c) bits 15-17 on variant 1 (Crimson) alone, (7, 0 / 0x13) bits 18-20 on variant 2 (Old) alone; L0 M5 under
// (13, 0), (7, 0x15) or (1, 3 / 10 / 12) -- mask 0x281 on number - 3 -- bits 21-23, every variant.
const em013 = v => (motion, action) => {
  const st = action ? action[0] : -1, n = action ? action[1] : -1;
  if (motion === 0x205 || motion === 0x206){
    if (st !== 7) return 0;
    if (n === 0x3b || n === 0x3c) return v === 1 ? 0x38000 : 0;
    return (n === 0x13 || n === 0) && v === 2 ? 0x1c0000 : 0;
  }
  if (motion === 5){
    if (st === 13) return n === 0 ? 0xe00000 : 0;
    if (st === 7) return n === 0x15 ? 0xe00000 : 0;
    if (st === 1){ const k = (n - 3) & 0xff; return k < 10 && ((0x281 >>> k) & 1) ? 0xe00000 : 0; }
  }
  return 0;
};

// KUSHALA DAORA (em024_00), uEm024_00 vtable +0x13c = 0xdfd19c, READ whole (0xdfd19c..0xdfd244) and emulated (dev/em024_00-effects-
// spec.md 1): 0xca170, then ON EVERY MOTION: ctl+0x2c (isEnraged at the last action start, vt+0x204 0xdef358) == 1 and ctl+0x2d
// (the snow maps, e+0x1053 in {3, 14, 20}: 0xdef0c8) -> bits 18-20; else by the wind aura P+0x1bb through [0x15928a8] =
// {0x38000, 0x38000, 0x38000, 0xe00000}: 0xff -> [0], 0 / 1 -> [the level], 2 -> [1] or [2], 3 -> [3] unless ctl+0x18 (then [2]),
// 4..0xfe -> nothing. ctl+0x18 = 0xa1f0c(e, 2) = P+0x5e08 bit 1, rebuilt at every action start (0xdef9cc). Inputs: `windAura`
// (the Wind Aura control), the rage; the snow map and P+0x5e08 bit 1 the viewer does not hold -- named stand-ins (off).
const em024_00 = (motion, action, state) => {
  if (state.rage && state.snowMap) return 0x1c0000;
  const a = state.windAura == null ? 0 : state.windAura | 0, c18 = !!state.aura5e08;
  const T = [0x38000, 0x38000, 0x38000, 0xe00000];
  if (a === 0xff) return T[0];
  if (a === 3) return T[c18 ? 2 : 3];
  if (a === 2) return T[c18 ? 1 : 2];
  return a <= 3 ? T[a] : 0;
};

// TEOSTRA (em027_00), uEm027_00 vtable +0x13c = 0xe1a9d8, READ whole (0xe1a9d8..0xe1aae8) and emulated (dev/em027_00-effects-spec.md
// 1): 0xca170, then L2 M1 (0x201) with the action NUMBER (any status) in {10, 21, 22} (mask 0x600400) -> bits 24-26; L1 M14 (0x10e)
// with number 0x27 -> bits 18-20; then while P+0x5e08 bit 1 is clear (0xa1f0c(e, 2)) and the fire aura P+0x1bb is neither 0 nor 0xff:
// bits 15-17, and on L4 M6 (0x406) bits 6-8 CLEARED (bfc). Last, on every motion but L4 M9 it stops the handle e+0xcacc (the nova's,
// 0xe17e88..) -- a side effect, not a bit. Inputs: `fireAura` (the Fire Aura control); P+0x5e08 bit 1 not held: off.
const em027_00 = (motion, action, state) => {
  const n = action ? action[1] : -1;
  let set = 0;
  if (motion === 0x201){ if (n >= 0 && n <= 0x16 && ((0x600400 >>> n) & 1)) set |= 0x7000000; }
  else if (motion === 0x10e){ if (n === 0x27) set |= 0x1c0000; }
  const lit = !state.aura5e08 && !!state.fireAura && (state.fireAura | 0) !== 0xff;
  if (!lit) return set;
  set |= 0x38000;
  return motion === 0x406 ? { set, clear: 0x1c0 } : set;
};

// ALATREON (em050_00), uEm050_00 vtable +0x13c = 0xece27c, READ whole (0xece27c..0xece650: its three jump tables 0xece2c4 /
// 0xece390 / 0xece528 resolved) and emulated (dev/em050_00-effects-spec.md 1): 0xca170, then by the action's status and number:
// status 4 -- L1 M10 / M11 with number 0xf / 9, L2 M23 / M25 with 0xb: bits 15-17. Status 7 -- L2 M5 with 0x18: bits 27-29 if the tail
// is severed (P+0x3b4 bit 0, through the pointer the post-indexed load left at e+0x13f4: [+0x34] = e+0x1428), else 15-17; L2 M6 with
// 0x35..0x3f bits 24-26, with 0x21 / 2 bits 15-17; L2 M7 with 0xf / 0x19 / 0x1f / 0x20 bits 21-23, with 0x35..0x3f bits 24-26; L2 M8
// with 0xd / 0x40 bits 24-26, with 0xe / 0x25 bits 21-23; L2 M16 / M17 with 3 / 4 / 7 / 8 / 0x1b (mask 0x8000198) bits 15-17; L1 M2 /
// M3 with 0x26 / 0x1d bits 21-23; L0 M9 / M10 with 0 / 0x22 / 0x27 / 0x28 / 0x2b / 0x2c / 0x2f / 0x30 bits 15-17.
const em050_00 = (motion, action, state) => {
  if (!action) return 0;
  const [st, n] = action;
  if (st === 4){
    if (motion === 0x10a || motion === 0x10b) return n === 0xf || n === 9 ? 0x38000 : 0;
    if (motion === 0x217 || motion === 0x219) return n === 0xb ? 0x38000 : 0;
    return 0;
  }
  if (st !== 7) return 0;
  switch (motion){
    case 0x205: return n === 0x18 ? (state.severed ? 0x38000000 : 0x38000) : 0;
    case 0x206: return n >= 0x35 && n <= 0x3f ? 0x7000000 : (n === 0x21 || n === 2) ? 0x38000 : 0;
    case 0x207: return (n === 0xf || n === 0x19 || n === 0x1f || n === 0x20) ? 0xe00000 : (n >= 0x35 && n <= 0x3f) ? 0x7000000 : 0;
    case 0x208: return (n === 0xd || n === 0x40) ? 0x7000000 : (n === 0xe || n === 0x25) ? 0xe00000 : 0;
    case 0x210: case 0x211: return n <= 0x1b && ((0x8000198 >>> n) & 1) ? 0x38000 : 0;
    case 0x102: case 0x103: return n === 0x26 || n === 0x1d ? 0xe00000 : 0;
    case 9: case 10: return [0, 0x22, 0x27, 0x28, 0x2b, 0x2c, 0x2f, 0x30].includes(n) ? 0x38000 : 0;
  }
  return 0;
};

// GORE MAGALA / CHAOTIC / SHAGARU (em071_00 / em071_05 / em072_00), ONE class uEm071_00, vtable +0x13c = 0xfc08a8, READ whole
// (0xfc08a8..0xfc090c, 26 instructions) and emulated (dev/em071-em072-effects-spec.md 1): 0xca170, then L2 M7 (0x207) only, under
// (7, 0x58) bits 15-17 or (7, 0x60) bits 18-20, each also CLEARING bits 6 and 9 (`bic #0x240`). No variant or em test.
const em071 = (motion, action) => {
  if (motion !== 0x207 || !action || action[0] !== 7) return 0;
  if (action[1] === 0x58) return { set: 0x38000, clear: 0x240 };
  if (action[1] === 0x60) return { set: 0x1c0000, clear: 0x240 };
  return 0;
};

// GAMMOTH / ELDERFROST (em083_00 / em083_04), ONE class uEm083_00 (no variant test in the word), vtable +0x13c = 0x1054b8c,
// READ whole (0x1054b8c..0x1054bd0, 18 instructions) and emulated (dev/em083-effects-spec.md 1): 0xca170, then L9 M16 (0x910)
// only: 0x6fe88(e, 7, 0x6a) ? bits 18-20 (u 511) : bits 21-23 (u 220). Gammoth carries no list 9 -- for her the base word.
const em083 = (motion, action) => motion === 0x910 ? (action && action[0] === 7 && action[1] === 0x6a ? 0x1c0000 : 0xe00000) : 0;

export const CLASS_MASK = { em042_00, em011_00, em012_00, em024_00, em027_00, em050_00, em071_00: em071, em071_05: em071, em072_00: em071, em013_00: em013(0), em013_01: em013(1), em013_02: em013(2), em010_00, em017_00, em036_00, em046_00, em047_00, em049_00, em056_00, em066_00: em066(false), em066_04: em066(true), em067_00, em068_00, em070_00, em069_00, em019_00: em019(false), em019_04: em019(true), em020_00: em020(false), em020_04: em020(true), em082_00: em082(false), em082_04: em082(true), em083_00: em083, em083_04: em083, em077_00, em021_00, em022_00, em061_00: em061(false), em061_04: em061(true), em060_00: em060(false), em060_04: em060(true), em062_00: em060(false), em030_00, em023_00: em023, em023_05: em023, em057_00: em057(false), em057_04: em057(true), em003_00, em005_00, em001_00: rath(1, 0x001, false), em001_02: rath(1, 0x201, false), em001_04: rath(1, 0x401, true),
  em002_00: rath(2, 0x002, false), em002_02: rath(2, 0x202, false), em002_04: rath(2, 0x402, true),
  em007_00, em087_00, em004_00: em004, em084_00: em084, em081_04, em081_00, em007_04, em033_00,
  em032_00: em032, em032_04: em032, em037_00: em037, em037_04: em037, em038_00,
  em014_00: em014, em015_00: em014, em016_00: em014, em034_00: em014,
  em079_00, em079_04, em085_00, em008_00, em009_00, em018_00, em018_04, em063_00, em063_05,
  em043_00: em043, em043_05: em043, em044_00,
  em080_00: em080, em080_04: em080, em045_00, em045_04, em055_00, em088_00,
  em025_00: BASE_ONLY, em058_00: BASE_ONLY, em065_00: BASE_ONLY, em076_00: BASE_ONLY, em086_00: BASE_ONLY };
// the monsters whose clip effects follow the enable word (their CLIP_EFFECTS carry the whole block; add_effects.py
// reads this line)
export const PSL_MASK_MONSTERS = ['em004_00', 'em084_00', 'em081_04', 'em081_00', 'em007_04', 'em033_00', 'em032_00', 'em032_04',
  'em037_00', 'em037_04', 'em038_00', 'em014_00', 'em015_00', 'em016_00', 'em034_00',
  'em079_00', 'em079_04', 'em085_00', 'em008_00', 'em009_00', 'em018_00',
  'em018_04', 'em063_00', 'em063_05', 'em043_00', 'em043_05', 'em044_00',
  'em080_00', 'em080_04', 'em045_00', 'em045_04', 'em055_00', 'em088_00', 'em087_00', 'em007_00',
  'em001_00', 'em001_02', 'em001_04', 'em002_00', 'em002_02', 'em002_04', 'em003_00', 'em005_00',
  'em042_00', 'em077_00', 'em057_00', 'em057_04', 'em021_00', 'em022_00', 'em023_00', 'em023_05', 'em030_00', 'em060_00', 'em060_04', 'em062_00', 'em061_00', 'em061_04', 'em083_00', 'em083_04', 'em010_00', 'em017_00', 'em036_00', 'em046_00', 'em047_00', 'em049_00', 'em056_00', 'em082_00', 'em082_04', 'em066_00', 'em066_04', 'em067_00', 'em068_00', 'em070_00', 'em019_00', 'em019_04', 'em020_00', 'em020_04', 'em069_00', 'em011_00', 'em012_00', 'em013_00', 'em013_01', 'em013_02', 'em024_00', 'em027_00', 'em050_00', 'em071_00', 'em071_05', 'em072_00',
  'em025_00', 'em058_00', 'em065_00', 'em076_00', 'em086_00'];

// The word for one motion start, or null for a monster not yet read (the caller then fires the listed bits as before).
// NAKARKOS'S TENTACLES' OWN METHOD (uEmOstgaloaArm vtable 0x17f6498 +0x13c = 0x107f0e4, READ: dev/em084-psl-mask.md 6), for
// the arm's own runtime (index.html driveArmEffects; board PHASE 3, built 2026-10-19). 0xca170, then on motion - 0x201 <= 0x5c:
//   * l_2 / r_2 M1, M5, M6, M13, M14, M28, M50, M51, M86 (0x107f2e4): from the BODY's action B+0x73e0/1 -- (7, 0x44 / 0x45 /
//     0x69 / 0x6a / 0x9b / 0x9c): x = (motion != M1), y = 0; (7, 0x4a / 0x4b): x = 0, y = 1; else 0 / 0 -- then by the ARM's
//     action (7, n): n in {0x0c, 0x0d, 0x21, 0x2a, 0x2c} -> x |= motion != M1; n in {0x0f..0x12, 0x22, 0x26} -> bits 15-17 if x and
//     ALWAYS 18-20; any other n (or status) -> 15-17 if x, 18-20 if y;
//   * M92 (0x25c): the body's skull form byte (B+0xcb0d for side 2, else B+0xcb0c) -- M93 (0x25d): the arm's own form +0xcb30;
//     form 0..3 -> {0x38000, 0x1c0000, 0xe00000, 0x7000000} (table 0x1592ae8).
// The actions per arm clip are the orders render/monster.js ROM_ARM_PAIRS reads (arm action <- body action, by side); where an
// arm clip has two orders (M86: (7, 0x21) / (7, 0x22) <- (7, 0x44 / 0x45 / 0x4a / 0x4b)) its plays take them in turn (which body
// action orders which arm action: I). M92's body form byte is the body's copy of that side's form, which the arm's vt+0x24 0x107b544
// settles its own +0xcb30 to (0x107b74c compare, 0x107b8d0 store; lane B2 2026-10-26): index.html passes the form row as both.
const ARM084_X = new Set([0x44, 0x45, 0x69, 0x6a, 0x9b, 0x9c]), ARM084_Y = new Set([0x4a, 0x4b]);
const ARM084_XN = new Set([0x0c, 0x0d, 0x21, 0x2a, 0x2c]), ARM084_ALWAYS = new Set([0x0f, 0x10, 0x11, 0x12, 0x22, 0x26]);
const ARM084_FORM = [0x38000, 0x1c0000, 0xe00000, 0x7000000];
export const ARM084_PLAYS = {     // '<list number>|Motion[N]' -> [{ arm: [7, n], body: { l: [7, m], r: [7, m] } }, ...]
  '2|Motion[1]':  [{ arm: [7, 0x0b], body: { l: [7, 0x9a], r: [7, 0x68] } }],
  '2|Motion[2]':  [{ arm: [7, 0x0b], body: { l: [7, 0x9a], r: [7, 0x68] } }],
  '2|Motion[5]':  [{ arm: [7, 0x0c], body: { l: [7, 0x9b], r: [7, 0x69] } }],
  '2|Motion[6]':  [{ arm: [7, 0x0c], body: { l: [7, 0x9b], r: [7, 0x69] } }],
  '2|Motion[13]': [{ arm: [7, 0x0d], body: { l: [7, 0x9c], r: [7, 0x6a] } }],
  '2|Motion[14]': [{ arm: [7, 0x0d], body: { l: [7, 0x9c], r: [7, 0x6a] } }],
  '2|Motion[28]': [{ arm: [7, 0x2a], body: null }],
  '2|Motion[50]': [{ arm: [7, 0x25], body: { l: [7, 0xfd], r: [7, 0xcb] } }],
  '2|Motion[51]': [{ arm: [7, 0x25], body: { l: [7, 0xfd], r: [7, 0xcb] } }],
  '2|Motion[86]': [{ arm: [7, 0x21], body: { l: [7, 0x44], r: [7, 0x44] } }, { arm: [7, 0x22], body: { l: [7, 0x4a], r: [7, 0x4a] } }],
  '2|Motion[92]': [{ arm: [7, 0x19], body: null }],
  '2|Motion[93]': [{ arm: [7, 0x1b], body: null }],
};
export function armPlay084(armList, slot, n){
  const k = String(armList).replace(/^[lr]_/, '') + '|Motion[' + slot + ']', a = ARM084_PLAYS[k];
  return a ? a[((n | 0) % a.length + a.length) % a.length] : null;
}
export function armMask084(armList, slot, side, play, state){
  const lst = +String(armList).replace(/^[lr]_/, ''), motion = ((lst & 0xf) << 8) | (slot & 0xff);
  let r = baseMask(state || {});
  if (motion - 0x201 >>> 0 > 0x5c) return r >>> 0;
  const L2 = new Set([0x201, 0x205, 0x206, 0x20d, 0x20e, 0x21c, 0x232, 0x233, 0x256]);
  if (L2.has(motion)){
    const b = play && play.body ? play.body[side] : null, an = play && play.arm;
    let x = 0, y = 0;
    if (b && b[0] === 7 && ARM084_X.has(b[1])){ x = motion !== 0x201 ? 1 : 0; y = 0; }
    else if (b && b[0] === 7 && ARM084_Y.has(b[1])){ x = 0; y = 1; }
    if (an && an[0] === 7 && ARM084_XN.has(an[1])) x |= motion !== 0x201 ? 1 : 0;
    if (an && an[0] === 7 && ARM084_ALWAYS.has(an[1])) r |= (x ? 0x38000 : 0) | 0x1c0000;
    else r |= (x ? 0x38000 : 0) | (y ? 0x1c0000 : 0);
  } else if (motion === 0x25d){
    const f = state && state.armForm; if (f >= 0 && f <= 3) r |= ARM084_FORM[f];
  } else if (motion === 0x25c){
    const f = state && state.skullForm; if (f >= 0 && f <= 3) r |= ARM084_FORM[f];
  }
  return r >>> 0;
}
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
const EM045_ACTIONS = {
  '2|Motion[2]':  [{ action: [7, 2] }, { action: [7, 4] }, { action: [7, 4] }],
  '2|Motion[3]':  [{ action: [7, 2] }, { action: [7, 4] }, { action: [7, 0x90] }],
  '2|Motion[10]': [{ action: [7, 0x90] }, { action: [7, 0x8a] }],
  '0|Motion[11]': [{ action: [1, 2] }, { action: [1, 0] }],
};
const EM043_ACTIONS = {
  '0|Motion[5]': [{ action: [1, 2] }, { action: [10, 0x2a] }],
  // L0 M6 copy B: (6, 3) alone asks 0xa499c(e, 2) = u 1400 (0xe770a8); the walks (2, n) play it without (reqtrace.py: the action main per action, all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked; 2026-10-18)
  '0|Motion[6]': [{ action: [2, 0] }, { action: [6, 3], posture: 4, sunk: true, variant: 'B' }],
};
const EM063_ACTIONS = {
  // L0 M10 copy B: the burrows (6, 2) / (6, 3) / (6, 6) ask u 1400 (0xf3ccbc / 0xf3cd9c); the walks (2, n) and the (7, n)
  // plays set it with no request (reqtrace.py: the action main per action, all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked; 2026-10-18)
  '0|Motion[10]': [{ action: null }, { action: [6, 2], posture: 4, variant: 'B' }],
  '2|Motion[42]': [{ action: [7, 0x08] }, { action: [7, 0x14] }, { action: [7, 0x15] }, { action: [7, 0xa5] },
                   { action: [7, 0xa6] }, { action: [7, 0xb0] }, { action: [7, 0xb1] }],
  '2|Motion[41]': [{ action: [7, 0x09] }, { action: [7, 0x98] }],
};
// ZINOGRE / THUNDERLORD (one class, one command table; dev/em057-effects-spec.md 3, action main 0xf004a8 under unicorn with
// every phase and follow): L0 M20 -- (1, 0x2d) (g0 s19 / s21, g1 s95; base word, then it follows into (1, 4)) and (7, 0x71)
// (g1 s132 / s144..s150: u 470 / u 480). L0 M24 -- (1, 4) the charge (g1 s48 / s58, and (1, 0x2d)'s follow: u 500) and
// (7, 0x71)'s phase 1 (0xef8694: u 471 / u 481). L2 M1 / M2 -- (7, 0xe9) / (7, 0xea) (e+0xb5f8 0) and the follows (7, 0xfb) /
// (7, 0xfc) out of L2 M44 / M43 (b5f8 9). L2 M43 / M44 -- (7, 0xfa) / (7, 0xf9), REQUIRED (with no action b5f8 reads 0).
// L3 M20 -- the rage roar (1, 9) (g0 s3, g6 s0: c 60) and (1, 2) (g9 s0: none). L3 M21 / M13 -- the deaths (11, 0) / (11, 7).
// (1, 0x15) (L0 M24 from f6, its own arm in Thunderlord's word) is the CATCH's follow: em057_00CatchMove (9, 1) plays L2 M36 and
// at its end follows into (1, 0x15) (0xeff0e4..0xeff114; (9, 2) into (1, 0x14), L0 M20 from f70) -- reached only through a
// catch of a hunter (status 8 / 9, entered after 0xc7470(e, 0) finds a target, 0xef7478), so it is the third play. At G the remap
// vt+0x1fc 0xeec1a4 turns Zinogre's (7, 0xf9 / 0xfa) into (7, 0xa2 / 0xa3) always, and Thunderlord's L2 attacks into the
// (7, 0x9c..0xab) chains by charge / rage / a tune percentage -- the viewer shows each clip's own action.
const EM057_ACTIONS = {
  '0|Motion[20]': [{ action: [1, 0x2d] }, { action: [7, 0x71] }],
  '0|Motion[24]': [{ action: [1, 0x04] }, { action: [7, 0x71] }, { action: [1, 0x15] }],
  '2|Motion[43]': [{ action: [7, 0xfa] }],
  '2|Motion[44]': [{ action: [7, 0xf9] }],
  '3|Motion[20]': [{ action: [1, 0x09] }, { action: [1, 0x02] }],
  '3|Motion[21]': [{ action: [11, 0x00] }],
  '3|Motion[13]': [{ action: [11, 0x07] }],
};
const EM060_ACTIONS = {
  '0|Motion[1]': [{ action: [0, 0x00] }, { action: [6, 0x01], posture: 4, sunk: true }],
  '0|Motion[8]': [{ action: [2, 0x04] }, { action: [6, 0x01], posture: 4, sunk: true }],
  '0|Motion[9]': [{ action: [2, 0x04] }, { action: [6, 0x01], posture: 4, sunk: true }],
  '0|Motion[4]': [{ action: [2, 0x00] }, { action: [6, 0x02], posture: 4, sunk: true }],
};
const EM061_ACTIONS = {
  '0|Motion[6]':  [{ action: [2, 0x00] }, { action: [6, 0x02], posture: 4, sunk: true }],
  '0|Motion[51]': [{ action: [2, 0x04] }, { action: [6, 0x01], posture: 4, sunk: true }],
  '0|Motion[60]': [{ action: [2, 0x04] }, { action: [6, 0x01], posture: 4, sunk: true }],
  '0|Motion[61]': [{ action: [2, 0x04] }, { action: [6, 0x01], posture: 4, sunk: true }],
};
const EM082_ACTIONS = {
  '0|Motion[12]': [{ action: [1, 0x04] }, { action: [1, 0x08], variant: 'B' }],
  '0|Motion[4]':  [{ action: [2, 0x0d] }, { action: [2, 0x2e] }, { action: [2, 0x36] }, { action: [1, 0x08], variant: 'B' }],
  '0|Motion[15]': [{ action: [1, 0x16] }, { action: [1, 0x17] }, { action: [1, 0x03], variant: 'B' }],
  '2|Motion[1]':  [{ action: [7, 0x07] }, { action: [7, 0x23] }],
  '2|Motion[2]':  [{ action: [7, 0x08] }, { action: [7, 0x24] }],
  '2|Motion[69]': [{ action: [7, 0x19] }, { action: [7, 0x26] }, { action: [7, 0x70] }, { action: [7, 0x71] }, { action: [7, 0x7b] }],
  '2|Motion[70]': [{ action: [7, 0x19] }, { action: [7, 0x26] }, { action: [7, 0x7b], variant: 'B' }],
  // (10, 0xaf) (effects lane A3, 2026-10-26; READ: rom-map "Effects lane A3"): the shared reaction 0x1c (his durability counter P+0x5d30
  // emptied) -> 0x9b078; his handler 0x10488b4 plays script 0x17ef1a8 (L3 M3 -> M4 -> M5) on side 1, 0x17ef1d0 (L3 M6 -> M7 -> M8) on side
  // 2, the side written by vt+0x1fc 0x1036714 from the action it interrupts. The word gives it bits 21-23 (u 255 / 256, u 265, u 257)
  '3|Motion[3]':  [{ action: [10, 0x07] }, { action: [10, 0xaf] }],
  '3|Motion[6]':  [{ action: [10, 0x07] }, { action: [10, 0xaf] }],
};
const EM066_ACTIONS = own => {
  const rock = acts => [...acts.map(n => ({ action: [7, n], boulder: own })), ...acts.map(n => ({ action: [7, n], boulder: 3, variant: 'B' }))];
  return {
    '4|Motion[7]':  rock([0x52, 0xf0, 0xf1, 0xf4, 0xf5, 0xff]),
    '4|Motion[17]': rock([0x74, 0x75, 0xf2, 0xf3, 0xfe]),
    '9|Motion[13]': rock([0xec, 0xed, 0xee, 0xef]),
    '4|Motion[14]': [{ action: [7, 0xf7] }, { action: [2, 0x54], variant: 'B' }],
    '4|Motion[15]': [{ action: [7, 0xf8] }, { action: [2, 0x54], variant: 'B' }],
    // the dig and the carry (tracer, both variants; motion-states.js BOULDER): (1, 0x50) L4 M9, (1, 0x51) L4 M8, (1, 0x52) /
    // (1, 0xff) L4 M18 (ctl+0x30 1 or 2 / 3 -- copy B), (1, 0x53) L4 M11, (1, 0xfb) L9 M9, (2, 0x53) L4 M12, (2, 0x54) the carry
    // turns L4 M14 / M15 (table 0x16a061c), (2, 0x55 / 0x56) L4 M16, (2, 0xfd) L9 M10 -- the carrying actions request the rock
    '4|Motion[9]':  [{ action: [1, 0x50] }],
    '4|Motion[8]':  [{ action: [1, 0x51] }],
    '4|Motion[18]': [{ action: [1, 0x52] }, { action: [1, 0xff], variant: 'B' }],
    '4|Motion[11]': [{ action: [1, 0x53] }],
    '4|Motion[12]': [{ action: [2, 0x53] }],
    '4|Motion[16]': [{ action: [2, 0x55] }, { action: [2, 0x56] }],
    '9|Motion[9]':  [{ action: [1, 0xfb] }],
    '9|Motion[10]': [{ action: [2, 0xfd] }],
    '0|Motion[7]':  [{ action: [2, 0x01] }, { action: [2, 0x0f] }, { action: [2, 0x50] }, { action: [13, 0x01] },
                     { action: [6, 0x51], posture: 4, sunk: true, variant: 'B' }],
  };
};
const A7 = ns => ns.map(n => ({ action: [7, n] }));
const EM019_ACTIONS = { '2|Motion[11]': A7([0x00, 0xff]), '2|Motion[4]': A7([0x0d, 0xfb]), '2|Motion[2]': A7([0x0f, 0xee, 0xfa]),
                        '2|Motion[6]': A7([0x0e, 0xe0, 0xf9]), '2|Motion[8]': A7([0x10, 0xdd, 0xe2, 0xed, 0xf8]) };
const EM020_ACTIONS = { '2|Motion[11]': A7([0x00]), '2|Motion[4]': A7([0x0d, 0xdd]), '2|Motion[2]': A7([0x0f]),
                        '2|Motion[6]': A7([0x0e, 0xdc]), '2|Motion[8]': A7([0x10]) };
export const CLIP_ACTIONS = {
  // LAGOMBI / SNOWBARON (dev/em061-effects-spec.md 2): turn table 0x169f720 {L0 M51; L0 M61 / M60} -- (2, 4 / 0xb / 0x5a) surface,
  // (6, 1) after 0xbc7f4(4) + 0xbf700 (sunk); L0 M6 (2, 0 / 0x53 / 0x5b) surface, (6, 2) posture 4 after it (sunk: I)
  em061_00: EM061_ACTIONS, em061_04: EM061_ACTIONS,
  // ELDERFROST (dev/em083-effects-spec.md 2; tracer allmot2, CLS uEm083_00 variant 4): L9 M16 is started by (7, 0x6a) and by
  // (7, 0x6b) only, phase 0, posture 0 (0xbc7f4(0)) -- one u 511, the other u 220. Gammoth has no list 9.
  em083_04: { '9|Motion[16]': [{ action: [7, 0x6a] }, { action: [7, 0x6b] }] },
  // PLESIOTH (dev/em010_00-effects-spec.md 2; tracer allmot2, CLS uEm010_00): L0 M18 is started by the water idles (0, 4 / 5 /
  // 7) and (6, 0xc / 0xf / 0x10 / 0x70), each after 0xbc7f4(4) + 0xbf700(-100.0) -- P+0x5c = -100, not below -550 (bits 15-17,
  // c 270) -- and by (12, 0), whose 0xbf700 writes action-tune float 7 (0x6f618(e, 7) at 0xd6a334: -1000.0 in
  // em010_00_actiontune.fup) before it: deep, bits 18-20 (nothing bound) -- copy B of the clip (motion-states.js CLIP_VARIANTS;
  // L0 M18 is a _loop clip, so a replay is not a new play and counting could never reach it). L2 M2: (7, 0x12) / (7, 0x13).
  // CEPHADROME (dev/em017_00-effects-spec.md 2; tracer allmot2, CLS uEm017_00): L4 M9 / L4 M10 are (5, 4)'s phases 0 / 1 only,
  // so always c 60. L4 M11 is twenty status-5 plays ((5, 5 / 6 / 9 / 0xa / 0xb / 0x13 / 0x14 / 0x1b / 0x1f..0x27 / 0x2a / 0x2b),
  // posture 2) -- one word, c 60 -- and (7, 0xc)'s phase 1, after L4 M12: no c 60. Copy B (CLIP_VARIANTS) is that one.
  em017_00: { '4|Motion[11]': [{ action: [5, 0x05], posture: 2 }, { action: [7, 0x0c], variant: 'B' }] },
  // LAVASIOTH (dev/em036_00-effects-spec.md 2; tracer allmot2, CLS uEm036_00). L0 M13: (1, 0x30 / 0x31) -- bits 15-17 -- and
  // (1, 0x32 / 0x34). The clips the u 60 actions play ((7, 0xf..0x14), (6, 4 / 5); e+0xcae8, states-em036_00.md 1.4) share
  // their clips with other actions, so each such clip has a copy B for those plays (CLIP_VARIANTS; motion-states.js holds u
  // 60 on the '#B' rows). L0 M21: A the dive (6, 0 / 1) -- 0xbf62c -> 0xbf700 (P+0x5c = MoguriBaseOfs -2000, sunk) and
  // posture 4 before the setMotion, then 0xa499c(e, 0): u 1120 --, B (6, 0xa / 0x1e / 0x25) at P+0x5c -353 (not sunk), C (7,
  // 0x13)'s phase 1 (sunk; u 60, and u 1120 again at 0xe44314).
  em036_00: {
    '0|Motion[13]': [{ action: [1, 0x30] }, { action: [1, 0x31] }, { action: [1, 0x32] }, { action: [1, 0x34] }],
    '0|Motion[21]': [{ action: [6, 0x00], posture: 4, sunk: true }, { action: [6, 0x01], posture: 4, sunk: true },
                     { action: [6, 0x0a], posture: 4, variant: 'B' }, { action: [6, 0x1e], posture: 4, variant: 'B' },
                     { action: [6, 0x25], posture: 4, variant: 'B' }, { action: [7, 0x13], posture: 4, sunk: true, variant: 'C' }],
    '0|Motion[30]': [{ action: [6, 0x1d], posture: 4 }, { action: [6, 0x29], posture: 4 },
                     { action: [7, 0x0f], posture: 4, variant: 'B' }, { action: [7, 0x10], posture: 4, variant: 'B' },
                     { action: [7, 0x12], posture: 1, variant: 'B' }],
    '2|Motion[10]': [{ action: [7, 0x03], posture: 4 }, { action: [7, 0x0a], posture: 4 }, { action: [7, 0x15], posture: 1 },
                     { action: [7, 0x0f], posture: 4, variant: 'B' }, { action: [7, 0x11], posture: 1, variant: 'B' }],
    '2|Motion[11]': [{ action: [7, 0x12], posture: 1 }],
    '0|Motion[18]': [{ action: [0, 0x03], posture: 4 }, { action: [0, 0x07], posture: 4 }, { action: [6, 0x02], posture: 4 },
                     { action: [6, 0x06], posture: 4 }, { action: [12, 0x01], posture: 4 },
                     { action: [7, 0x13], posture: 4, variant: 'B' }, { action: [6, 0x04], posture: 4, variant: 'B' },
                     { action: [6, 0x05], posture: 4, variant: 'B' }],
    '0|Motion[16]': [{ action: [1, 0x34] }, { action: [1, 0x30] }, { action: [1, 0x31] }, { action: [1, 0x32] },
                     { action: [12, 0x00], posture: 1 }, { action: [7, 0x14], posture: 1, variant: 'B' }],
  },
  // LAGIACRUS (dev/em046_00-effects-spec.md 2; tracer allmot2, CLS uEm046_00): L2 M6 is five land attacks (7, 0x21 / 0x22 /
  // 0x28 / 0x4b / 0x62) in posture 0 -- bits 21-23 (c 10 / c 11) -- and (6, 2) in posture 4: bits 24-26 (nothing bound), its
  // copy B (L2 M6 is _start + _loop). L0 M5 is (2, 0 / 5 / 0x16), posture 0 only.
  em046_00: { '2|Motion[6]': [{ action: [7, 0x21] }, { action: [7, 0x22] }, { action: [7, 0x28] }, { action: [7, 0x4b] },
                              { action: [7, 0x62] }, { action: [6, 0x02], posture: 4, variant: 'B' }] },
  // ROYAL LUDROTH (dev/em047_00-effects-spec.md 2; tracer): L2 M8 the land turns (2, 7 / 9 / 0xd / 0x10), (12, 6) posture 0 --
  // bits 21-23 -- and (6, 7 / 8) in posture 4 with the depth the dive left (sunk: I, Deviljho's case) -- 24-26, copy B.
  em047_00: { '2|Motion[8]': [{ action: [2, 0x07] }, { action: [2, 0x09] }, { action: [2, 0x0d] }, { action: [2, 0x10] },
                              { action: [12, 0x06] }, { action: [6, 0x07], posture: 4, sunk: true, variant: 'B' },
                              { action: [6, 0x08], posture: 4, sunk: true, variant: 'B' }] },
  // AGNAKTOR (dev/em049_00-effects-spec.md 2; tracer, turns.py): turn table 0x169eb9c {L0 M6; L0 M7 / M8} on the surface ((2, 1
  // / 0xf), (13, 6), (3, 2)) and burrowed ((6, 5 / 9 / 0xa), (13, 3): 0xbc7f4(4), 0xbf62c -> 0xbf700, P+0x5c = MoguriBaseOfs
  // -1000: sunk) -- copy B; L2 M6 the land attacks (7, 6 / 7 / 8 / 0x22 / 0x2b / 0x2c) and (3, 1 / 3 / 5 / 6), burrowed (6, 3
  // / 4 / 6 / 8 / 0xf), (13, 4) in posture 4 with the dive's depth (sunk: I) -- copy B. L0 M9 / M10: posture 0 only.
  em049_00: (() => {
    const turn = [{ action: [2, 0x01] }, { action: [2, 0x0f] }, { action: [13, 0x06] }, { action: [3, 0x02] },
                  { action: [6, 0x05], posture: 4, sunk: true, variant: 'B' }, { action: [6, 0x09], posture: 4, sunk: true, variant: 'B' },
                  { action: [6, 0x0a], posture: 4, sunk: true, variant: 'B' }, { action: [13, 0x03], posture: 4, sunk: true, variant: 'B' }];
    return { '0|Motion[6]': turn, '0|Motion[7]': turn, '0|Motion[8]': turn,
             '2|Motion[6]': [{ action: [7, 0x06] }, { action: [7, 0x07] }, { action: [7, 0x08] }, { action: [7, 0x22] },
                             { action: [7, 0x2b] }, { action: [7, 0x2c] }, { action: [3, 0x01] }, { action: [3, 0x03] },
                             { action: [3, 0x05] }, { action: [3, 0x06] },
                             { action: [6, 0x03], posture: 4, sunk: true, variant: 'B' }, { action: [6, 0x04], posture: 4, sunk: true, variant: 'B' },
                             { action: [6, 0x06], posture: 4, sunk: true, variant: 'B' }, { action: [6, 0x08], posture: 4, sunk: true, variant: 'B' },
                             { action: [6, 0x0f], posture: 4, sunk: true, variant: 'B' }, { action: [13, 0x04], posture: 4, sunk: true, variant: 'B' }] };
  })(),
  // MIZUTSUNE / SOULSEER (dev/em082-effects-spec.md 2; tracer allmot2 + actmot, both variants the same): the word's action arms
  // land on L0 M12 ((1, 4) 18-20 / (1, 8) phase 2 15-17), L0 M4 ((2, 0xd / 0x2e / 0x36) nothing / (1, 8) 15-17), L0 M15 ((1,
  // 0x16 / 0x17) 21-23 / (1, 3) nothing), L2 M1 ((7, 7) 24-26 / (7, 0x23) 27-29), L2 M2 ((7, 8) / (7, 0x24) the same), L2 M69
  // ((7, 0x19 / 0x26) 27-29, (7, 0x70 / 0x71) 24-26, (7, 0x7b) 15-17), L2 M70 ((7, 0x19 / 0x26) phase 1 nothing, (7, 0x7b)
  // 18-20) and L3 M3 / M6 (status 10: 18-20). _start / _loop clips take copies (CLIP_VARIANTS).
  // SOULSEER's own plays on top (dev/em082-effects-spec.md 4): his class requests by action (vt+0x204 0x1037318.., vt+0x208's
  // e+0xcb45 gate set at 0x1039678 by (1, 0x14 / 0x15), (2, 0x36), (7, 0x6a..0x6d) from phase 1) -- copies where a clip mixes them
  em082_00: EM082_ACTIONS, em082_04: Object.assign({}, EM082_ACTIONS, {
    '0|Motion[4]': [{ action: [2, 0x0d] }, { action: [2, 0x2e] }, { action: [1, 0x08], variant: 'B' }, { action: [2, 0x36], variant: 'C' },
                    { action: [2, 0x36], variant: 'D' }],     // D: (2, 0x36) repeated -- u 330 at its start (motion-states.js '0|Motion[4]#D')
    '9|Motion[1]': [{ action: [0, 0x01] }, { action: [1, 0x0d] }, { action: [1, 0x14], variant: 'B' }, { action: [1, 0x15], variant: 'B' }],
    '9|Motion[5]': [{ action: [7, 0x6a] }, { action: [7, 0x6b] }],
    '9|Motion[8]': [{ action: [7, 0x6c] }, { action: [7, 0x6d] }],
    '9|Motion[6]': [{ action: [7, 0x6a] }, { action: [7, 0x6b] }, { action: [7, 0x6e], variant: 'B' }, { action: [7, 0x75], variant: 'C' },
                    { action: [7, 0x77], variant: 'D' }, { action: [7, 0x79], variant: 'D' }],
    '9|Motion[9]': [{ action: [7, 0x6c] }, { action: [7, 0x6d] }, { action: [7, 0x6f], variant: 'B' }, { action: [7, 0x76], variant: 'C' },
                    { action: [7, 0x78], variant: 'D' }, { action: [7, 0x7a], variant: 'D' }],
  }),
  // TETSUCABRA / DRILLTUSK (dev/em066-effects-spec.md 2; tracer allmot2, both variants the same): L4 M7 (7, 0x52 / 0xf0 / 0xf1 /
  // 0xf4 / 0xf5 / 0xff) and L4 M17 (7, 0x74 / 0x75 / 0xf2 / 0xf3 / 0xfe) by the boulder carried -- ctl+0x30, set at the dig's
  // action start: Tetsucabra 1 ((1, 0x52)) or 3 ((1, 0xff)), Drilltusk 2 ((1, 0x52)) or 3 -- copy A the dig's own rock, B kind 3;
  // L9 M13 (Drilltusk; (7, 0xec..0xef)) the same; L4 M14 (7, 0xf7), L4 M15 (7, 0xf8); L0 M7 the surface turns (2, 1 / 0xf..0x1c /
  // 0x50 / 0x52 / 0x58), (13, 1) and copy B the dive (6, 0x51) -- posture 4, 0xbf62c -> 0xbf700 first: sunk, and u 1400.
  em066_00: EM066_ACTIONS(1), em066_04: EM066_ACTIONS(2),
  // ZAMTRIOS (dev/em067_00-effects-spec.md 2; tracer turns.py): L4 M31 / M32 are the swim turns' sides -- table 0x16a0abc for
  // (6, 5) after 0xbc7f4(4) + 0xbf700(0.0): posture 4 at P+0x5c 0, not below 0.9 x -2400, so 0x81d18 == 1 (bits 15-17); table
  // 0x16a0afc for (6, 0xd / 0x13 / 0x28) after 0xbf62c -> 0xbf700 (P+0x5c -2400: sunk, nothing) -- copy B.
  em067_00: (() => { const sw = [{ action: [6, 0x05], posture: 4 }, { action: [6, 0x0d], posture: 4, sunk: true, variant: 'B' },
                                  { action: [6, 0x13], posture: 4, sunk: true, variant: 'B' }, { action: [6, 0x28], posture: 4, sunk: true, variant: 'B' }];
                     return { '4|Motion[31]': sw, '4|Motion[32]': sw,
                              '4|Motion[20]': [{ action: [7, 0x0c] }, { action: [7, 0x0d] }, { action: [1, 0x43], variant: 'B' }] }; })(),
  // NAJARALA (dev/em068_00-effects-spec.md 2; tracer): L0 M44 A the surface plays (2, 1 / 3 / 4) phase 2, B the burrowed (6, 3 / 7 /
  // 9), (13, 1) after 0xbf62c -> 0xbf700 (P+0x5c -3000: sunk); L2 M61 (7, 0x18 / 0x1a), the word by the part-2 break alone.
  em068_00: { '0|Motion[44]': [{ action: [2, 0x01] }, { action: [2, 0x03] }, { action: [2, 0x04] },
                               { action: [6, 0x03], posture: 4, sunk: true, variant: 'B' }, { action: [6, 0x07], posture: 4, sunk: true, variant: 'B' },
                               { action: [6, 0x09], posture: 4, sunk: true, variant: 'B' }, { action: [13, 0x01], posture: 4, sunk: true, variant: 'B' }],
              '2|Motion[61]': [{ action: [7, 0x18] }, { action: [7, 0x1a] }] },
  // DAIMYO LINE / SHOGUN LINE (dev/em019-em020-effects-spec.md 2; tracer, both variants of each the same): the word's action arms.
  em019_00: EM019_ACTIONS, em019_04: EM019_ACTIONS, em020_00: EM020_ACTIONS, em020_04: EM020_ACTIONS,
  // SELTAS QUEEN (dev/em069_00-effects-spec.md 2; tracer): L0 M16 (1, 0x14) bit 21 / (1, 0x1c) bit 22 (copy B); L0 M8 the walks
  // (2, 1 / 2 / 3 / 0x13 / 0x16 / 0x19), (16, 3) and copy B (6, 2) in posture 4 (sunk: I).
  // FATALIS LINE (dev/em013-effects-spec.md 2; tracer, all three variants the same): L2 M5 A (7, 0x3b) / B (7, 0); L2 M6 A (7, 0x3c) /
  // B (7, 0x13) -- A lit on Crimson, B on Old; L0 M5 A the rage roar (1, 3) (g6 s0's action), B (1, 0xa / 0xc), (7, 0x15), (13, 0) --
  // both bits 21-23 -- C (3, 0xe) phase 3, base.
  ...Object.fromEntries(['em013_00', 'em013_01', 'em013_02'].map(m => [m, {
    '2|Motion[5]': [{ action: [7, 0x3b] }, { action: [7, 0x00], variant: 'B' }],
    '2|Motion[6]': [{ action: [7, 0x3c] }, { action: [7, 0x13], variant: 'B' }],
    '0|Motion[5]': [{ action: [1, 0x03] }, { action: [1, 0x0a], variant: 'B' }, { action: [1, 0x0c], variant: 'B' }, { action: [7, 0x15], variant: 'B' },
                    { action: [13, 0x00], variant: 'B' }, { action: [3, 0x0e], variant: 'C' }] }])),
  // CHAMELEOS (dev/em025_00-effects-spec.md 3; partscr): the copies his state rows read -- the status-10 plays by part and the stun
  em025_00: { '3|Motion[3]': [{ action: [10, 0x72] }, { action: [10, 0x07], variant: 'B' }],
              '3|Motion[12]': [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }],
              '3|Motion[6]': [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }],
              '3|Motion[7]': [{ action: [10, 0x20] }, { action: [10, 0x1d], variant: 'B' }],
              '3|Motion[2]': [{ action: [10, 0x1b] }, { action: [10, 0x07], variant: 'B' }],
              '3|Motion[13]': [{ action: [10, 0x72] }, { action: [10, 0x72], variant: 'B' }],
              '3|Motion[10]': [{ action: [10, 0x1e] }, { action: [10, 0x2a], variant: 'B' }] },
  // TEOSTRA (dev/em027_00-effects-spec.md 2; tracer): L2 M1 by the number (any status) {10, 21, 22} -> bits 24-26; L0 M5 A the rage
  // entry (1, 0x1b), B the other roars; L3 M3 / M5 the status-10 copies his state rows read
  em027_00: { '0|Motion[5]': [{ action: [1, 0x1b] }, ...[0x07, 0x0f, 0x10, 0x14].map(n => ({ action: [1, n], variant: 'B' })),
                              { action: [13, 0x00], variant: 'B' }, { action: [13, 0x02], variant: 'B' }],
              '3|Motion[3]': [{ action: [10, 0x20] }, { action: [10, 0x1b], variant: 'B' }, { action: [10, 0x72], variant: 'C' }, { action: [10, 0x07], variant: 'D' }],
              '3|Motion[5]': [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }],
              // L2 M1 (lane B2, 2026-10-25): its only players are (7, 0x0a) / (7, 0x15) / (7, 0x16), phase 0 (<archive>/laneB2/allmot027_201.txt,
              // zg/allmot.py over every (status, number), phases 0..3) -- each a number in the word's 0x600400, so every play lights bits 24-26 (u 286)
              '2|Motion[1]': [{ action: [7, 0x0a] }, { action: [7, 0x15] }, { action: [7, 0x16] }],
              // the sleep hold: (10, 0x1d)'s last clip, held through (10, 0x1e) (op 1 sets no motion -- motion-states.js)
              '3|Motion[17]': [{ action: [1, 0x08] }, { action: [10, 0x44] }, { action: [10, 0x1d], variant: 'B' }, { action: [10, 0x1e], variant: 'B' }],
              // THE NOVA (motion-states.js em027_00): L4 M9 / M10 by the nova selector -- A 0 / 1 / 3, B 2 / 4, C 5, D 6, E 7 / 8 (L4 M10 E
              // also the other plays of it, (2, 0x20), (7, 0x2a..0x2e))
              '4|Motion[9]':  [...[0x05, 0x07, 0x1b].map(n => ({ action: [7, n] })), ...[0x1a, 0x22].map(n => ({ action: [7, n], variant: 'B' })),
                               { action: [7, 0x23], variant: 'C' }, { action: [7, 0x24], variant: 'D' }, ...[0x28, 0x29].map(n => ({ action: [7, n], variant: 'E' }))],
              '4|Motion[10]': [...[0x05, 0x07, 0x1b].map(n => ({ action: [7, n] })), ...[0x1a, 0x22].map(n => ({ action: [7, n], variant: 'B' })),
                               { action: [7, 0x23], variant: 'C' }, { action: [7, 0x24], variant: 'D' },
                               ...[[7, 0x28], [7, 0x29], [2, 0x20], [7, 0x2a], [7, 0x2b], [7, 0x2c], [7, 0x2d], [7, 0x2e]].map(a => ({ action: a, variant: 'E' }))] },
  // ALATREON (dev/em050_00-effects-spec.md 2; tracer): each clip's plays split by the word -- A the plays one arm lights, B the others
  em050_00: (() => {
    const E = (st, ns, v) => ns.map(n => v ? { action: [st, n], variant: v } : { action: [st, n] });
    return {
      '1|Motion[10]': [...E(4, [0x09, 0x0f]), ...E(4, [0x00, 0x06, 0x0d, 0x0e], 'B')],
      '1|Motion[11]': [...E(4, [0x09]), ...E(4, [0x00, 0x06], 'B')],
      '2|Motion[23]': [...E(4, [0x0b]), ...E(3, [0x02], 'B'), ...E(4, [0x08], 'B')],
      '2|Motion[25]': [...E(4, [0x0b]), ...E(3, [0x02], 'B'), ...E(4, [0x08], 'B')],
      '2|Motion[5]':  [...E(7, [0x18]), ...E(7, [0x01], 'B')],
      '2|Motion[6]':  [...E(7, [0x02, 0x21]), ...E(7, [0x36, 0x37], 'B')],
      '2|Motion[7]':  [...E(7, [0x0f, 0x20]), ...E(7, [0x38, 0x39, 0x3f], 'B')],
      '2|Motion[8]':  [...E(7, [0x0e, 0x25]), ...E(7, [0x0d, 0x40], 'B')],
      '2|Motion[16]': [...E(7, [0x03, 0x07]), ...E(7, [0x12, 0x14], 'B')],
      '2|Motion[17]': [...E(7, [0x04, 0x08]), ...E(7, [0x13, 0x15], 'B')],
      '1|Motion[2]':  [...E(7, [0x1d, 0x26]), ...E(7, [0x1e], 'B')],
      '1|Motion[3]':  [...E(7, [0x1d, 0x26]), ...E(7, [0x1e], 'B')],
      '0|Motion[9]':  [...E(7, [0x00, 0x22, 0x27, 0x28, 0x2b, 0x2c, 0x2f, 0x30]), ...E(7, [0x0a, 0x23, 0x29, 0x2a, 0x2d, 0x2e, 0x31, 0x32], 'B')],
      '0|Motion[10]': [...E(7, [0x00, 0x22, 0x27, 0x28, 0x2b, 0x2c, 0x2f, 0x30]), ...E(7, [0x0a, 0x23, 0x29, 0x2a, 0x2d, 0x2e, 0x31, 0x32], 'B')],
      // L1 M1 by POSTURE, not by the word (no L1 M1 case in it): A posture 1 -- the fly moves (3, 0..4), (0, 3) and the takeoff (7, 0x1f)'s
      // hover; B posture 3 -- (0, 6) and status 4's (4, 1 / 2 / 4 / 5 / 6 / 0xa / 0xe) (<archive>/gapW/actpost.json; motion-states.js
      // AIR_HEIGHT.em050_00, shells lane 2026-10-26)
      '1|Motion[1]':  [...E(7, [0x1f]), ...E(3, [0x00, 0x01, 0x02, 0x03, 0x04]), ...E(0, [0x03]),
                       ...E(4, [0x01, 0x02, 0x04, 0x05, 0x06, 0x0a, 0x0e], 'B'), ...E(0, [0x06], 'B')],
    };
  })(),
  // AMATSU (dev/em058_00-effects-spec.md 3; tracer): the copies his state rows read
  em058_00: { '3|Motion[4]': [{ action: [10, 0x20] }, { action: [10, 0x1d], variant: 'B' }],
              '3|Motion[18]': [{ action: [10, 0x6c] }, { action: [10, 0x6d], variant: 'B' }],
              '3|Motion[9]': [{ action: [1, 0x14] }],
              '3|Motion[5]': [{ action: [10, 0x20] }, { action: [10, 0x1e], variant: 'B' }],
              '1|Motion[9]': [{ action: [1, 0x00] }, { action: [1, 0x0b], variant: 'B' }],
              // his status-7 plays (tracer, 2026-10-19): the action his aura's hide test reads (0xf099cc: status 7 but (7, 0xc));
              // his word is the base, so the entries change no bit
              '2|Motion[1]': [{ action: [7, 0x03] }, { action: [7, 0x04] }],
              '2|Motion[5]': [{ action: [7, 0x05] }],
              '2|Motion[7]': [{ action: [7, 0x18] }],
              '2|Motion[9]': [{ action: [7, 0x06] }, { action: [7, 0x07] }],
              '2|Motion[10]': [{ action: [7, 0x08] }],
              '2|Motion[12]': [{ action: [7, 0x0e] }],
              '2|Motion[14]': [{ action: [7, 0x01] }],
              '2|Motion[15]': [{ action: [7, 0x02] }],
              '2|Motion[16]': [{ action: [7, 0x00] }],
              '2|Motion[17]': [{ action: [7, 0x09] }],
              '2|Motion[18]': [{ action: [7, 0x0a] }],
              '2|Motion[19]': [{ action: [7, 0x0b] }],
              '2|Motion[20]': [{ action: [7, 0x0d] }],
              '2|Motion[21]': [{ action: [7, 0x10] }],
              '2|Motion[22]': [{ action: [7, 0x0c] }],
              '2|Motion[26]': [{ action: [7, 0x0f] }],
              '2|Motion[27]': [{ action: [7, 0x19] }],
              '2|Motion[28]': [{ action: [7, 0x1a] }],
              '2|Motion[29]': [{ action: [7, 0x1b] }],
              '2|Motion[30]': [{ action: [7, 0x14] }],
              '2|Motion[33]': [{ action: [7, 0x15] }] },
  // GORE LINE (dev/em071-em072-effects-spec.md 2; tracer, all three the same): L2 M7 A (7, 0x58) bits 15-17, B (7, 0x60) bits 18-20,
  // C the other plays (7, 0x52 / 0x59 / 0x5b / 0x5e / 0x5f / 0x61 / 0x67)
  ...Object.fromEntries(['em071_00', 'em071_05', 'em072_00'].map(m => [m, {
    '2|Motion[7]': [{ action: [7, 0x58] }, { action: [7, 0x60], variant: 'B' },
                    ...[0x52, 0x59, 0x5b, 0x5e, 0x5f, 0x61, 0x67].map(n => ({ action: [7, n], variant: 'C' }))],
    '3|Motion[15]': [{ action: [10, 0x1f] }, { action: [10, 0x6e], variant: 'B' }],
    ...Object.fromEntries(['3|Motion[9]', '3|Motion[10]', '3|Motion[11]'].map(k => [k, [{ action: [10, 0x20] }, { action: [10, 0x14], variant: 'B' }]])),
    ...Object.fromEntries(['3|Motion[3]', '3|Motion[4]', '3|Motion[5]'].map(k => [k, [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }]])),
    '0|Motion[5]':  [{ action: [1, 0x00] }, ...[[1, 0x14], [1, 0x16], [13, 0x07], [13, 0x0a], [13, 0x0b]].map(a => ({ action: a, variant: 'B' }))],
    '0|Motion[31]': [{ action: [1, 0x03] }, { action: [1, 0x08], variant: 'B' }, { action: [1, 0x17], variant: 'B' }],
    // L2 M52 (effects lane, 2026-10-20): A (7, 0x33) fills the slot ring at f84 (0xfbaad8), B (7, 0x2c) does not itself (goretrace.py) -- its sp_00 mode 0 landing does
    '2|Motion[52]': [{ action: [7, 0x33] }, { action: [7, 0x2c], variant: 'B' }],
    // L2 M57 (2026-10-20): A (7, 0x30) -- Chaotic's gauge fill at f63 (0xfbb0b0) -- B (2, 0x3f), which makes none (goretrace.py)
    '2|Motion[57]': [{ action: [7, 0x30] }, { action: [2, 0x3f], variant: 'B' }] }])),
  // VALSTRAX (dev/em086_00-effects-spec.md 3; tracer): the copies his state rows read
  em086_00: { ...Object.fromEntries(['3|Motion[9]', '3|Motion[10]', '3|Motion[11]', '3|Motion[5]', '3|Motion[6]', '3|Motion[7]'].map(k =>
                [k, [{ action: [10, 0x20] }, { action: [10, 0x14], variant: 'B' }]])),
              '0|Motion[5]': [{ action: [1, 0x04] }, { action: [1, 0xfe], variant: 'B' }],
              // THE COMET (motion-states.js em086_00): A the other plays, B the launch, C the fall
              '1|Motion[5]': [...[[3, 0], [3, 1], [3, 5], [12, 0], [13, 0]].map(a => ({ action: a })),
                              ...[0x32, 0x34, 0x35].map(n => ({ action: [7, n], variant: 'B' })), { action: [7, 0x33], variant: 'C' }],
              // his status-7 plays (tracer, 2026-10-19): the actions his glow state e+0xcb10 is set from (0x109f830); the word is the base
              '2|Motion[1]': [{ action: [7, 0x00] }, { action: [7, 0x01] }, { action: [7, 0x0b] }, { action: [7, 0x0c] }, { action: [7, 0x0f] }, { action: [7, 0x14] }, { action: [7, 0x15] }, { action: [7, 0x23] }],
              '2|Motion[2]': [{ action: [7, 0x00] }, { action: [7, 0x01] }, { action: [7, 0x0b] }, { action: [7, 0x0c] }, { action: [7, 0x0d] }, { action: [7, 0x0e] }, { action: [7, 0x0f] }, { action: [7, 0x14] }, { action: [7, 0x15] }, { action: [7, 0x21] }, { action: [7, 0x22] }, { action: [7, 0x23] }],
              '2|Motion[3]': [{ action: [7, 0x00] }, { action: [7, 0x01] }, { action: [7, 0x0b] }, { action: [7, 0x0c] }, { action: [7, 0x0d] }, { action: [7, 0x0e] }, { action: [7, 0x0f] }, { action: [7, 0x14] }, { action: [7, 0x15] }, { action: [7, 0x21] }, { action: [7, 0x22] }, { action: [7, 0x23] }],
              '2|Motion[10]': [{ action: [7, 0x0d] }, { action: [7, 0x21] }],
              '2|Motion[13]': [{ action: [7, 0x0e] }, { action: [7, 0x22] }],
              '2|Motion[20]': [{ action: [7, 0x02] }, { action: [7, 0x04] }, { action: [7, 0x06] }, { action: [7, 0x16] }, { action: [7, 0x1a] }],
              '2|Motion[21]': [{ action: [7, 0x03] }, { action: [7, 0x05] }, { action: [7, 0x07] }, { action: [7, 0x17] }, { action: [7, 0x1b] }],
              '2|Motion[22]': [{ action: [7, 0x68] }, { action: [7, 0x6c] }],
              '2|Motion[23]': [{ action: [7, 0x69] }, { action: [7, 0x6d] }],
              '2|Motion[32]': [{ action: [7, 0x08] }, { action: [7, 0x1c] }, { action: [7, 0xc8] }, { action: [7, 0xc9] }],
              '2|Motion[36]': [{ action: [7, 0x09] }, { action: [7, 0x0a] }, { action: [7, 0x1d] }, { action: [7, 0x1e] }],
              '2|Motion[37]': [{ action: [7, 0x0a] }, { action: [7, 0x1e] }],
              '2|Motion[42]': [{ action: [7, 0x0d] }, { action: [7, 0x21] }],
              '2|Motion[44]': [{ action: [7, 0x0e] }, { action: [7, 0x22] }],
              '2|Motion[48]': [{ action: [7, 0x10] }],
              '2|Motion[50]': [{ action: [7, 0x11] }],
              '2|Motion[51]': [{ action: [7, 0x12] }],
              '2|Motion[52]': [{ action: [7, 0x28] }, { action: [7, 0x2c] }],
              '2|Motion[53]': [{ action: [7, 0x29] }, { action: [7, 0x2d] }],
              '2|Motion[56]': [{ action: [7, 0x2a] }],
              '2|Motion[57]': [{ action: [7, 0x2b] }],
              '2|Motion[58]': [{ action: [7, 0x2e] }],
              '2|Motion[59]': [{ action: [7, 0x2f] }],
              '2|Motion[62]': [{ action: [7, 0x30] }],
              '2|Motion[63]': [{ action: [7, 0x30] }],
              '2|Motion[64]': [{ action: [7, 0x30] }],
              '2|Motion[66]': [{ action: [7, 0x31] }],
              '2|Motion[67]': [{ action: [7, 0x31] }],
              '2|Motion[68]': [{ action: [7, 0x31] }],
              '2|Motion[70]': [{ action: [7, 0x32] }, { action: [7, 0x34] }, { action: [7, 0x35] }],
              '2|Motion[71]': [{ action: [7, 0x32] }, { action: [7, 0x34] }, { action: [7, 0x35] }],
              '2|Motion[72]': [{ action: [7, 0x32] }, { action: [7, 0x34] }, { action: [7, 0x35] }],
              '2|Motion[73]': [{ action: [7, 0x33] }],
              '2|Motion[76]': [{ action: [7, 0x00] }, { action: [7, 0x0b] }, { action: [7, 0x0d] }, { action: [7, 0x14] }, { action: [7, 0x21] }],
              '2|Motion[77]': [{ action: [7, 0x00] }, { action: [7, 0x0b] }, { action: [7, 0x0d] }, { action: [7, 0x14] }, { action: [7, 0x21] }],
              '2|Motion[79]': [{ action: [7, 0x01] }, { action: [7, 0x0c] }, { action: [7, 0x0e] }, { action: [7, 0x0f] }, { action: [7, 0x15] }, { action: [7, 0x22] }, { action: [7, 0x23] }],
              '2|Motion[80]': [{ action: [7, 0x01] }, { action: [7, 0x0c] }, { action: [7, 0x0e] }, { action: [7, 0x0f] }, { action: [7, 0x15] }, { action: [7, 0x22] }, { action: [7, 0x23] }],
              '2|Motion[84]': [{ action: [7, 0x19] }, { action: [7, 0x64] }, { action: [7, 0x66] }, { action: [7, 0x68] }, { action: [7, 0x6a] }, { action: [7, 0x6c] }],
              '2|Motion[86]': [{ action: [7, 0x18] }, { action: [7, 0x65] }, { action: [7, 0x67] }, { action: [7, 0x69] }, { action: [7, 0x6b] }, { action: [7, 0x6d] }],
              '2|Motion[88]': [{ action: [7, 0x36] }],
              '2|Motion[89]': [{ action: [7, 0x37] }],
              '2|Motion[96]': [{ action: [7, 0x66] }],
              '2|Motion[98]': [{ action: [7, 0x18] }],
              '2|Motion[99]': [{ action: [7, 0x67] }],
              '2|Motion[101]': [{ action: [7, 0x19] }] },
  // KUSHALA (dev/em024_00-effects-spec.md 2; tracer): L0 M5 A the rage entry (1, 0x1b) (g6 s0), B the other roars (1, 0xf / 0x10 /
  // 0x11 / 0x14 / 0x1c), (13, 1 / 5); L3 M3 B (10, 0x1b), C / D (10, 0x72) / (10, 7) part 0 -- the copies MOTION_STATES reads
  em024_00: { '0|Motion[5]': [{ action: [1, 0x1b] }, ...[0x0f, 0x10, 0x11, 0x14, 0x1c].map(n => ({ action: [1, n], variant: 'B' })),
                              { action: [13, 0x01], variant: 'B' }, { action: [13, 0x05], variant: 'B' }],
              '3|Motion[3]': [{ action: [10, 0x20] }, { action: [10, 0x1b], variant: 'B' }, { action: [10, 0x72], variant: 'C' }, { action: [10, 0x07], variant: 'D' }],
              // HIS IDLE AND HIS WALK AS THEIR PULSE ACTIONS (effects lane, 2026-10-22; Raven: "Kushala's wind aura does not appear even when set to
              // wind level 3"): the wind pulse (vt+0x208 0xdf0664, shells.js perFrame024) runs only under the pulse actions, and L0 M1 / L0 M2
              // are also played by others ((1, 1); (13, 0 / 3)), so with no action named the shells refused the pulse by name and his idle
              // never pulsed. A is the clip as its pulse action -- (0, 0) the idle, (0, 1) / (1, 3) / (1, 0x13) the walk -- B the others
              '0|Motion[1]': [{ action: [0, 0x00] }, { action: [1, 0x01], variant: 'B' }],
              '0|Motion[2]': [{ action: [0, 0x01] }, { action: [1, 0x03] }, { action: [1, 0x13] }, { action: [13, 0x00], variant: 'B' }, { action: [13, 0x03], variant: 'B' }] },
  // KIRIN (dev/em011_00-effects-spec.md 2; tracer): L4 M7 A the rage roar (1, 6), B (1, 7) (the same clip without the 0xd6ecdc
  // preamble: base word), C the attacks (7, 5 / 7 / 0xb / 0xd / 0x2d..0x30) -- bits 15-17 + 21; L2 M4 A every other status-7 play,
  // B (7, 2) phase 1 (no bits 24-26).
  em011_00: { '4|Motion[7]': [{ action: [1, 0x06] }, { action: [1, 0x07], variant: 'B' },
                              ...[0x05, 0x07, 0x0b, 0x0d, 0x2d, 0x2e, 0x2f, 0x30].map(n => ({ action: [7, n], variant: 'C' }))],
              '2|Motion[4]': [...[0x03, 0x04, 0x06, 0x08, 0x09, 0x0a, 0x0c, 0x0e, 0x11, 0x12, 0x14, 0x15, 0x16, 0x17, 0x20, 0x21, 0x22, 0x23,
                                  0x26, 0x27, 0x39, 0x3c, 0x3d].map(n => ({ action: [7, n] })), { action: [7, 0x02], variant: 'B' }] },
  em069_00: { '0|Motion[16]': [{ action: [1, 0x14] }, { action: [1, 0x1c], variant: 'B' }],
              '0|Motion[8]':  [{ action: [2, 0x01] }, { action: [2, 0x02] }, { action: [2, 0x03] }, { action: [6, 0x02], posture: 4, sunk: true, variant: 'B' }],
              // L0 M1: the idles (0, 0 / 1 / 7) and copy B (7, 0x4d), whose start raises her P+0x1bb level to 3 (motion-states.js
              // queenLevel069; vt+0x204 0xf897d8) before (7, 0x4e) L0 M65 -- lane B, 2026-10-25
              '0|Motion[1]':  [{ action: [0, 0x00] }, { action: [7, 0x4d], variant: 'B' }] },
  em010_00: {
    '0|Motion[18]': [{ action: [0, 0x04], posture: 4, depth: -100 }, { action: [0, 0x05], posture: 4, depth: -100 },
                     { action: [0, 0x07], posture: 4, depth: -100 }, { action: [6, 0x0c], posture: 4, depth: -100 },
                     { action: [6, 0x0f], posture: 4, depth: -100 }, { action: [6, 0x10], posture: 4, depth: -100 },
                     { action: [6, 0x70], posture: 4, depth: -100 }, { action: [12, 0x00], posture: 4, depth: -1000, variant: 'B' }],
    '2|Motion[2]':  [{ action: [7, 0x12] }, { action: [7, 0x13] }],
  },
  // ARZUROS / REDHELM / VOLVIDON (dev/em060-effects-spec.md 2): turn table 0x169f4a0 (L0 M1 / M9 / M8) -- (2, 4 / 0xb / 0x5a)
  // on the surface, (6, 1) burrowed (0xbc7f4(4), 0xbf62c, 0xbf700 first); L0 M4 (2, 0 / 0x53 / 0x59 / 0x5b) surface, (6, 2) in
  // posture 4 after the dig (sunk: I, P+0x5c left by (6, 1) -- Deviljho's case).
  em060_00: EM060_ACTIONS, em060_04: EM060_ACTIONS, em062_00: EM060_ACTIONS,
  // BULLDROME (dev/em030_00-effects-spec.md 2; tracer): each clip a surface play and a burrowed one that starts sunk
  em030_00: {
    '0|Motion[5]':  [{ action: [2, 0x02] }, { action: [6, 0x02], posture: 4, sunk: true }],
    '0|Motion[6]':  [{ action: [2, 0x00] }, { action: [6, 0x01], posture: 4, sunk: true }],
    '0|Motion[7]':  [{ action: [2, 0x04] }, { action: [6, 0x01], posture: 4, sunk: true }],
    '0|Motion[14]': [{ action: [2, 0x05] }, { action: [0, 0x07], posture: 4, sunk: true }],
  },
  // RAJANG / FURIOUS (dev/em023-effects-spec.md 2): L2 M8's plays -- (7, 6) fires u 291, (7, 5) does not. [2026-10-17: NOT USED
  // while the shells pick his L2 M8 (shells.js pickVariantsFor: (7, 6), (7, 0xa), (7, 5), (7, 0xc), (7, 0x3b), one a play) --
  // index.html takes the play's action from that pick, and the word lights 2 plays in 5, the ROM's table. Kept for a clip state
  // with no pick.]
  em023_00: { '2|Motion[8]': [{ action: [7, 0x06] }, { action: [7, 0x05] }] },
  em023_05: { '2|Motion[8]': [{ action: [7, 0x06] }, { action: [7, 0x05] }] },
  // BLANGONGA (dev/em022_00-effects-spec.md 2; tracer + turn tables 0x169ceac (L0 M6 / M5) / 0x169ceec (L0 M8 / M7)): each clip a
  // posture-0 play and a snow-dive play that starts sunk.
  em022_00: {
    '0|Motion[5]':  [{ action: [2, 0x01] }, { action: [6, 0x04], posture: 4, sunk: true }],
    '0|Motion[6]':  [{ action: [2, 0x01] }, { action: [6, 0x04], posture: 4, sunk: true }],
    '0|Motion[7]':  [{ action: [2, 0x04] }, { action: [6, 0x09], posture: 4, sunk: true }],
    '0|Motion[8]':  [{ action: [2, 0x04] }, { action: [6, 0x09], posture: 4, sunk: true }],
    '0|Motion[18]': [{ action: [2, 0x11] }, { action: [6, 0x07], posture: 4, sunk: true }],
    // L0 M20 (lane A2, 2026-10-26; zg/reqtrace.py): A the idle (0, 7); B (7, 0x14 / 0x15 / 0x16), whose phase 0 (0xdddbc8) sets
    // posture 4, sinks (0xbf62c / 0xbf700), sets L0 M20 and asks u 60 at his unit position (0xdda664: id 1001, +0x1c |= 3, +8 = 2)
    '0|Motion[20]': [{ action: [0, 0x07] }, { action: [7, 0x14], posture: 4, variant: 'B' }, { action: [7, 0x15], posture: 4, variant: 'B' },
                     { action: [7, 0x16], posture: 4, variant: 'B' }],
  },
  // CONGALALA (dev/em021_00-effects-spec.md 2; plays from the action main 0xdd8068 under unicorn, allmot.py). L0 M25 is the
  // eating clip: (1, 0x35 / 0x0b / 0x0c / 0x0e) -- with the Item row at Nothing their number decides (c 150..153). L0 M43 is the
  // eat's phase 1 and (1, 0x3c..0x43): (1, 0x40 / 0x42 / 0x41 / 0x43) set gas 1 / 2 / 3 / 4 at their start. L2 M16 the gas attack
  // (7, 0x06 / 0x34..0x3a / 0x48) with the gas he carries: each play the next type. L0 M28: (1, 9) (c 120) and the gas attack's
  // phase 1 (7, 0x37). L2 M2: (7, 1) u 281, (7, 0) u 280, (7, 0x45) none. L3 M15: the pit death (11, 7), the pit sleep (10,
  // 0x63, asleep: c 50), the pit paralysis (10, 0x65: none).
  em021_00: {
    '0|Motion[25]': [{ action: [1, 0x35] }, { action: [1, 0x0b] }, { action: [1, 0x0c] }, { action: [1, 0x0e] }],
    '0|Motion[43]': [{ action: [1, 0x40] }, { action: [1, 0x42] }, { action: [1, 0x41] }, { action: [1, 0x43] }],
    // the breath reads the gas he carries: the Gas Type control (motion-states.js CLASS_CONTROLS em021_00; was a per-play cycle of 1..4)
    '2|Motion[16]': [{ action: [7, 0x34] }],
    '0|Motion[28]': [{ action: [1, 0x09] }, { action: [7, 0x37] }],
    '2|Motion[2]':  [{ action: [7, 0x01] }, { action: [7, 0x00] }, { action: [7, 0x45] }],
    '3|Motion[15]': [{ action: [11, 0x07] }, { action: [10, 0x63], asleep: true }, { action: [10, 0x65] }],
  },
  // AKANTOR, L0 M2 copy B: the burrows (6, 2 / 6 / 7 / 8) ask 0xa499c(e, 1) = u 1121 (0xe3a5c8) -- a request the viewer
  // did not show; his other plays of L0 M2 (the walks, (7, n), (6, 3 / 9 / 0xc..0xf)) ask nothing (reqtrace.py: the action main per action, all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked; 2026-10-18)
  em033_00: {
    // copy C (shells agent, 2026-10-20; coordinator-approved): (6, 3), his burrow tell -- the bulge shell before he bursts out
    // (shells.js Akantor (6, 3) row); the copy only lets the clip menu play that action
    '0|Motion[2]': [{ action: null }, { action: [6, 2], posture: 4, variant: 'B' }, { action: [6, 0x03], posture: 4, variant: 'C' }],
  },
  em004_00: {
    // L0 M7 copy B: (6, 3) asks u 1400 (0xd27be4); (7, 0x18 / 0x19 / 0x1a / 0x1d / 0x57) play it with none (reqtrace.py: the action main per action, all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked; 2026-10-18).
    // Gravios's (6, 3) asks it too, but em005_00u holds no key 1400 -- nothing to show, no copy for him.
    '0|Motion[7]': [{ action: null }, { action: [6, 3], posture: 4, variant: 'B' }],
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
    // L0 M50 (dev/em084_00-effects-spec.md 3; tracer): A the idle (0, 0) and the many other plays, B the dive actions (6, 0x64) / (6,
    // 0x66), whose own code asks for u 1121 (0xa499c(e, 1): 0x1073474 / 0x10739d0) -- not in his word's arms
    '0|Motion[50]': [{ action: [0, 0x00] }, { action: [6, 0x64], variant: 'B' }, { action: [6, 0x66], variant: 'B' }],
    // L0 M1 (lane B, 2026-10-25): A the idle (0, 0); B the buried hold of (13, 0), phase 4 (0x107a250: after the dive, posture 4, L0 M1
    // with bits 15-17 -> c 140, the debris pulse; the word em084 above). In game phase 5 re-sets L0 M1 without the bits after the
    // 300-frame wait (0x7206c), so the game shows the pulses of f1..f271; the copy plays the whole clip (f300 / 330 / 360 too)
    // B: the buried hold of (13, 0) phase 4 (bits 15-17, c 140); after its 300-frame wait phase 5 sets L0 M1 again without them
    // (0x107a250) -- `bitsUntil` stops the pulses there (lane B2, 2026-10-26; the clip itself plays on)
    '0|Motion[1]':  [{ action: [0, 0x00] }, { action: [13, 0x00], phase: 4, posture: 4, variant: 'B', bitsUntil: { frame: 300, bits: 0x38000 } }],
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
    // L0 M7's posture-4 plays are two copies: B the burrows asking 0xa499c(e, 2) = u 1400 ((6, 3 / 6 / 0x10 / 0x21..0x23 /
    // 0x2a); 0xd3bfcc), C those asking 0xa499c(e, 1) = u 1121 ((6, 0xf / 0x17 / 0x1c / 0x1d / 0x24 / 0x25 / 0x28 / 0x29 /
    // 0x2b / 0x2c); 0xd3c748) -- the word reads only the posture here, so one action stands for each (reqtrace.py: the action main per action, all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked; 2026-10-18)
    '9|Motion[11]': [{ action: [7, 0x5a] }, { action: [7, 0xb5] }, { action: [7, 0xb7] }],
    '2|Motion[31]': [{ action: [7, 0x5a] }, { action: [7, 0xb5] }, { action: [7, 0xb7] }],
    '2|Motion[15]': [{ action: [7, 0x03] }, { action: [7, 0xb4] }, { action: [7, 0xb6] }, { action: [7, 0xb8] }],
    '2|Motion[19]': [{ action: [7, 0x83] }, { action: [7, 0xb8] }],
    // L2 M22 (effects lane, 2026-10-25; allmot2.py CLS=uEm007_00 EM=7 variant 4): from frame 0 it is played by (7, 0x5c / 0x5f /
    // 0x65 / 0x67) phase 0 ((7, 0x5d / 0x61) set it from f200, (7, 0x5c / 0x65) again in phase 1). Only (7, 0x67) lights bit 21
    // (0xd45494, variant 4) = u 900 (em007_04_000) at f7; (7, 0x5c) stands for the three base plays. Issued: (7, 0x67) g7 s1,
    // (7, 0x5c) five streams, of the shared em007_00_cmdtbl (emc.py).
    '2|Motion[22]': [{ action: [7, 0x5c] }, { action: [7, 0x67] }],
    '3|Motion[20]': [{ action: [10, 0x63] }, { action: [11, 0x03] }],
    '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],
    '0|Motion[7]':  [{ action: null, posture: 0 }, { action: [6, 3], posture: 4, variant: 'B' }, { action: [6, 0xf], posture: 4, variant: 'C' }],
  },
  // DIABLOS (em007_00): Bloodbath's posture plays and his death clip (dev/em007_00-effects-spec.md 2). L0 M5: posture 0 from
  // the (2, n) moves (0xd393fc), 4 from (6, 2) (0xd3b908); L0 M7: posture 0 from (2, 6 / 7 / 8 / 0xc / 0x1a) (0xd39c40), 4 from
  // the burrow (6, 3) (0xd3b9fc) and 0xd3c4a0. No rows for L2 M15 / M19 / M31: their arms need (7, 0xb4..0xb8), which his
  // variant's command streams never issue (the shared command table splits by variant at g0 s3; op 0x20 as a jump: I).
  em007_00: {
    '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],
    // L0 M7 copies B (u 1400) / C (u 1121): as Bloodbath's, the same class code
    '0|Motion[7]':  [{ action: null, posture: 0 }, { action: [6, 3], posture: 4, variant: 'B' }, { action: [6, 0xf], posture: 4, variant: 'C' }],
    '3|Motion[20]': [{ action: [10, 0x63] }, { action: [11, 0x07] }],
  },
  // BARIOTH (dev/em042_00-effects-spec.md 5, 7). L2 M8: (7, 0x0f) (L2 M7 -> L2 M8) and (7, 0x14) (L1 M17 -> L2 M14 -> L2 M8)
  // fire u 200 with the tail on; (7, 0x11) plays the same clip without it (all three become L2 M16 plays once both wing-arms
  // are broken: the remap 0xe64f48). L2 M9 / M10: (7, 0x21) / (7, 0x22) while the tail is on, (7, 0) / (7, 1) once cut --
  // the word answers both through state.severed. L0 M4: the rage roar (1, 0) fires c 90, the g0 s0 roar (1, 0x0b) does not.
  em042_00: {
    '2|Motion[8]':  [{ action: [7, 0x0f] }, { action: [7, 0x14] }, { action: [7, 0x11] }],
    '2|Motion[9]':  [{ action: [7, 0x21] }],
    '2|Motion[10]': [{ action: [7, 0x22] }],
    '0|Motion[4]':  [{ action: [1, 0x00] }, { action: [1, 0x0b] }],
  },
  // SEREGIOS (dev/em077_00-effects-spec.md 4). L2 M26 is the dive after L2 M25: (7, 0x3a) (g1 s47) and (7, 0x3b) (g1 s54)
  // fire u 233, (7, 0) / (7, 3) / (7, 0x38) do not. L2 M34 is the landing: after (7, 0) / (7, 0x3a) the dive body follows
  // into (7, 0x3f), after (7, 0x3b) into (7, 0x40), at L2 M26 f80 -- L2 M70 -> L2 M34 with u 234; (7, 8) / (7, 0x39) play
  // L2 M33 -> L2 M34 without it.
  em077_00: {
    '2|Motion[26]': [{ action: [7, 0x3a] }, { action: [7, 0x3b] }, { action: [7, 0x03] }],
    '2|Motion[34]': [{ action: [7, 0x3f] }, { action: [7, 0x40] }, { action: [7, 0x08] }],
  },
  // ZINOGRE / THUNDERLORD (dev/em057-effects-spec.md 3): the plays of the clips their word (0xf0279c) keys on an action.
  // AT G (dev/em057-effects-spec.md 11): Zinogre's remap sends (7, 0xf9 / 0xfa) to (7, 0xa2 / 0xa3) ALWAYS, so his L2 M1 / M2 are
  // never the (7, 0xfb / 0xfc) follows; Thunderlord's keeps them only charged and calm (tune ints 0x14 / 0x17 = 0: no remap),
  // uncharged or enraged the remap always takes (7, 0xf9 / 0xfa / 0xfd / 0xfe) (100 / int 0x18 = 100).
  em057_00: { ...EM057_ACTIONS, '2|Motion[1]': [{ action: [7, 0xe9] }], '2|Motion[2]': [{ action: [7, 0xea] }] },
  // + his list 9 slams, for their discharge (ACTION_EFFECTS em057_04): (7, 0xe3) plays L9 M1 from 0 (0xefaed0); (7, 0xdb)
  // plays L9 M4 then L9 M5 (0xefb718, at L9 M4 f166) then L9 M1 from f300 (0xefb928). (7, 0xe5) ends at L9 M4's end
  // (0xefb958 -> vt+0x3dc): no slam.
  // (7, 0xd9 / 0xda) play L9 M2 (0xefb3f4, body 0xefb210 with r5 1: u 280 at f25) and follow (7, 0xdb) at its end; (7, 0xe4 /
  // 0xf1) play it with r5 0 (no request) and follow (7, 0xe5).
  em057_04: { ...EM057_ACTIONS,
              '2|Motion[1]': [{ action: [7, 0xe9] }, { action: [7, 0xfb], onlyIf: { charged: true, rage: false } }],
              '2|Motion[2]': [{ action: [7, 0xea] }, { action: [7, 0xfc], onlyIf: { charged: true, rage: false } }],
              '9|Motion[1]': [{ action: [7, 0xe3] }], '9|Motion[5]': [{ action: [7, 0xdb] }],
              '9|Motion[2]': [{ action: [7, 0xd9] }, { action: [7, 0xe4] }] },
  // KHEZU (dev/em003_00-effects-spec.md 2): each entry's `rage` is the charged form the AI issues while enraged (op 0x1c);
  // L2 M37's (7, 0x52) plays twice, the second with P+0x1a1 = 3 (`phase`, clipPhaseFor)
  em003_00: {
    '0|Motion[6]':  [{ action: [2, 5] }, { action: [2, 7], rage: [7, 0xb] }],
    '2|Motion[4]':  [{ action: [7, 0], rage: [7, 9] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] }, { action: [7, 0x57] }],
    '2|Motion[5]':  [{ action: [7, 0], rage: [7, 9] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] }, { action: [7, 0x57] },
                     { action: [7, 0x12] }, { action: [3, 0x43] }],
    '2|Motion[39]': [{ action: [7, 0], rage: [7, 9] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] }, { action: [7, 0x57] },
                     { action: [7, 0x12] }, { action: [3, 0x43] }],
    '2|Motion[10]': [{ action: [7, 2], rage: [7, 0xa] }],
    '2|Motion[74]': [{ action: [7, 0xf], rage: [7, 0x10] }],
    '2|Motion[37]': [{ action: [7, 0x2c] }, { action: [7, 0x52], phase: 1 }, { action: [7, 0x52], phase: 3 }],
    '2|Motion[38]': [{ action: [7, 0x2c] }, { action: [7, 0x52] }],
  },
  // GRAVIOS (dev/em005_00-effects-spec.md 2): `tired` is the form his tired streams issue
  em005_00: {
    '2|Motion[3]':  [{ action: [7, 0xa] }, { action: [7, 7] }, { action: [7, 5], tired: [7, 0xf] }, { action: [7, 0x15], tired: [7, 0x10] }],
    '2|Motion[4]':  [{ action: [7, 0xa] }, { action: [7, 7] }, { action: [7, 5], tired: [7, 0xf] }, { action: [7, 0x15], tired: [7, 0x10] }],
    '2|Motion[30]': [{ action: [7, 0x32] }],
    '2|Motion[31]': [{ action: [7, 0x32] }],
    '2|Motion[32]': [{ action: [7, 0x32] }],
    '2|Motion[33]': [{ action: [7, 0xe], tired: [7, 0xd] }],
    '2|Motion[24]': [{ action: [7, 0x11], tired: [7, 0xc] }],
    '4|Motion[59]': [{ action: [7, 0x34], tired: [7, 0x38] }],
  },
  // NIGHTCLOAK, L1 M27: the one body 0xff757c plays L1 M26 -> L1 M27 for (7, 0xcc) / (7, 0xcd) (0xff6714 / 0xff6720)
  // and for (2, 4) / (2, 5) (0xff3820 / 0xff382c); op 0x92 sends variant 0 to the (2, n) form and the default to
  // (7, n), and several of his streams issue either unconditionally, so he plays it both ways: u 361 on alternate
  // plays (dev/em079_00-effects-spec.md 2).
  em079_04: {
    '1|Motion[27]': [{ action: [7, 0xcc] }, { action: [2, 4] }],
  },
  // GREAT MACCAO, L0 M21: (1, 4) -> L0 M25 then L0 M21 held (c 111); (1, 0x0f) -> L0 M24 then L0 M21 (c 118, c 112).
  // Status-1 table 0x108c048; g1 s73 issues both, g10 s1 (1, 4) alone. Which one the AI picks (EMC ops 0x07 / 0x2a)
  // is not read, so each play shows the next (dev/em085_00-effects-spec.md 2).
  em085_00: {
    '0|Motion[21]': [{ action: [1, 0x04] }, { action: [1, 0x0f] }],
  },
  // GYPCEROS, L4 M9 / L4 M7: the status-7 table 0xd5c260 plays L4 M9 for (7, 0x0a / 0x26 / 0x29) and (7, 0x0c / 0x28 /
  // 0x2b) (0xd5c418), L4 M7 for (7, 0x1c / 0x27 / 0x2a) (0xd5c464). Command streams g1 s4-s6 issue the 0x26..0x28 form
  // while ENRAGED (op 0x1c = 0x81688) and the calm one otherwise, so each entry's `rage` is the form shown while the
  // rage toggle is on (dev/em009_00-effects-spec.md 2). NR: op 0x80's condition, under which the calm form is issued
  // even enraged.
  em009_00: {
    '4|Motion[9]': [{ action: [7, 0x0a], rage: [7, 0x26] }, { action: [7, 0x0c], rage: [7, 0x28] }],
    '4|Motion[7]': [{ action: [7, 0x1c], rage: [7, 0x27] }],
  },
  // DEADEYE, L0 M7: the status-2 plays (2, 0x02) / (2, 0x13) give the base word; (7, 0xe3) and (7, 0xe5) -- the
  // (7, 0xe4) chain -- give bits 27-29 (u 290, u 531). Both ROM plays begin at frame 18 -- copy B starts the clip there
  // (`startFrame`, index.html play(); the walker then starts u 290 at frame 18, 0x31cb40 / 0x31cbe0 -- approved 2026-10-19);
  // copy A is the status-2 play from 0 (dev/em018_00-effects-spec.md 3). Garuga's word reads no action.
  em018_04: {
    '0|Motion[7]': [{ action: [2, 0x02] }, { action: [7, 0xe3], variant: 'B', startFrame: 18 }, { action: [7, 0xe5], variant: 'B', startFrame: 18 }],
  },
  // BRACHYDIOS / RAGING, the plays of the two clips their word (0xf469a8) keys on an action: status-7 table 0xf41f58.
  // L2 M42: (7, 0x08) 0xf3e314 mode 0 (start 0), (7, 0x14 / 0x15) modes 1 / 2 and (7, 0xa5 / 0xa6) modes 3 / 4 (starts
  // 38 / 34), (7, 0xb0 / 0xb1) 0xf40c9c modes 1 / 2 (start 38). Bits 17-18 (u 200) on 0x08 / 0x14 / 0xa6 / 0xb0 only.
  // L2 M41: (7, 0x09) / (7, 0x98) 0xf3eb70 modes 0 / 1 (start 0); bits on (7, 0x09) only. Each play the next; the ROM
  // starts the flagged plays at frame 34 / 38 -- the viewer plays the clip from 0. The plays are variant-blind (v0 / v5
  // identical under the emulator). NR: which command streams issue which (dev/em063_00-effects-spec.md 3).
  em063_00: EM063_ACTIONS,
  em063_05: EM063_ACTIONS,
  // DEVILJHO / SAVAGE (dev/em043_00-effects-spec.md 3). L0 M5: the rage roar (1, 2) (0xe74d18; (1, 0x12) at 0xe7455c the
  // same) fires c 60, the recovery (10, 0x2a) does not. L0 M6: the walk (2, 0) sets it at posture 0 (0xe7500c / 0xe75d6c /
  // 0xe7e1ac); (6, 3) at 0xe77008 takes posture 4 and sets it at 0xe77064 with P+0x5c left from the burrow before it --
  // `sunk` (INFERRED: no command stream issues (6, 3); the (0, 7) hold and (6, 4) set P+0x5c that way).
  em043_00: EM043_ACTIONS,
  em043_05: EM043_ACTIONS,
  // BARROTH (dev/em044_00-effects-spec.md 3). L0 M11 is REQUIRED: with no action c 90 never fires -- (1, 2) / (1, 0xe) do,
  // (1, 0) and the recoveries (10, 0x2a / 0x2b / 0x70 / 0xa9 / 0xc5) do not. L0 M6: the walk, and (6, 3 / 6 / 0xe) at
  // 0xe86430 under posture 4 (0xe864bc), which the command tables issue only after (6, 1) / (6, 4) -- both set P+0x5c to
  // MoguriBaseOfs, so it plays sunk.
  // URAGAAN / CRYSTALBEARD (dev/em045_00-effects-spec.md 3; status-7 dispatcher 0xe9a7b8, table 0xe9a7e4): (7, 2) ->
  // 0xe95b78(e, 0) L2 M2 then L2 M3 in phase 2; (7, 4) -> 0xe95b78(e, 1); (7, 0x90) -> 0xe98ca8 L2 M10 -> L2 M21 -> L2 M3;
  // (7, 0x8a) -> 0xe97e94 L2 M10. L2 M2's three entries keep step with its u 100 / 110 / 120 hold cycle (MOTION_STATES).
  // L0 M11: the rage roar (1, 2) fires c 90, (1, 0) does not. L0 M6 (Uragaan only): the walk (2, 2), then the EMC's curl
  // -> turn -> roll (6, 6), which starts sunk; Crystalbeard's MoguriBaseOfs is 0, so he is never sunk.
  // L0 M6 copy B: (6, 3) / (6, 6) ask u 1400 (0xe941b0); the walks and (6, 2) play it with none (reqtrace.py: the action main per action, all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked; 2026-10-18)
  em045_00: { ...EM045_ACTIONS, '0|Motion[6]': [{ action: [2, 2] }, { action: [6, 6], posture: 4, sunk: true, variant: 'B' }] },
  em045_04: { ...EM045_ACTIONS, '0|Motion[6]': [{ action: [2, 2] }, { action: [6, 6], posture: 4, variant: 'B' }] },
  // DURAMBOROS (dev/em055_00-effects-spec.md 3): L0 M11 is (1, 0) -- the rage roar, g6 s0 behind op 0x6f(2) -- (1, 0xd)
  // (g13 s0) and (1, 2) (g8 s1); c 120 on the first two, the whole word cleared on (1, 2). L0 M3 / M4 / M6 / M15: the depth
  // decides (0x81d6c): a posture-0 play, then one in the rolling posture ((6, 4) / (6, 5) after the curl).
  em055_00: {
    '0|Motion[11]': [{ action: [1, 0] }, { action: [1, 2] }],
    '0|Motion[3]':  [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
    '0|Motion[4]':  [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
    // L0 M6 copy B: (6, 5) / (6, 6) ask u 1400 (0xed6354); the walks and (6, 3) play it with none (reqtrace.py: the action main per action, all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked; 2026-10-18)
    '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 5], posture: 4, sunk: true, variant: 'B' }],
    '0|Motion[15]': [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
  },
  em044_00: {
    '0|Motion[11]': [{ action: [1, 2] }, { action: [10, 0x2a] }],
    // L0 M6 burrowed travel: (6, 6) / (6, 3) / (6, 0xe) all play it, and the class's 0xe86430 (r5 = its r1) requests the
    // shared level 0xa499c with r1 = 2 when r5 == 1, else 0 (0xe864f0..0xe86504) -- traced per action: (6, 6) r1 = 2 -> u 1400,
    // (6, 3) / (6, 0xe) r1 = 0 -> u 1120 (sweep2 / tracec U1400 hook, 2026-10-18). Copies B / C (motion-states.js).
    '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 6], posture: 4, sunk: true, variant: 'B' },
                     { action: [6, 3], posture: 4, sunk: true, variant: 'C' }, { action: [6, 0xe], posture: 4, sunk: true, variant: 'C' }],
  },
  // AHTAL-KA (dev/em088_00-effects-spec.md 1.3; states-em088_00.md 3.3 / 5 / 6). L2 M30: the eight status-1 plays (1, 0x1c..
  // 0x1f / 0x22..0x25); pairs (n, n + 1) share a bit (u 451 bit 27, u 452 bit 28). Which the AI picks: NR. L3 M3..M8: only
  // (10, 0xaf) fires bits 24-26 (u 460 / 461 / 462); the same clips are also played by (10, 0x94) both sides, (10, 0xa7),
  // (10, 0xbb), (10, 0xbc) -- (10, 0xaf)'s script 0x18090b0 plays only M3 -> M5 -> M7, so M4 / M6 / M8 never take it.
  // THE REST ARE HERE FOR THE CARRIED OBJECT (em088CarryAt: the word's bits 15-23 and the held piece): the actions the
  // states note reads playing each clip, in its terms, so a play's start drops the piece exactly where the ROM's does.
  //   L0 M13 the tired idle (0, 2) and (1, 2): both drop it. L2 M17: the move (2, 0xf) (0x10be510 -> setMotion 0x211 at
  //   0x10be54c, READ 2026-10-15) keeps it -- hence its carry bits b15 / b17 / b19 / b20 / b22 / b23 -- the throw (7, 0x10) /
  //   (7, 0x32) (0x10beaf4 / 0x10bf08c -> 0x10bf0e0) drops it at its start. L2 M28: (1, 0x10) the rage end keeps it,
  //   (1, 6) drops it. L3 M1: (10, 7) parts 4..6 keep it, (10, 0xbd / 0xbe) drop it. L3 M14 / M15 / M16 / M23 / M17 / M18 /
  //   M19 / M27 / M28 / M31: paralysis, sleep, the stun, their recoveries, death, (10, 0x9b / 0xa1 / 0xa9): all drop it
  //   (L3 M16 copy B is the stun's (10, 0x20), the same answer), except L3 M18's (1, 0xb) (0x10bc9f4). L3 M2 / M9 (the
  //   breaks, the exhaust) keep it and need no entry. Each play the next, as everywhere here.
  em088_00: {
    '2|Motion[30]': [{ action: [1, 0x1c] }, { action: [1, 0x1e] }],
    '3|Motion[3]':  [{ action: [10, 0xaf] }, { action: [10, 0x94] }, { action: [10, 0xa7] }],
    '3|Motion[5]':  [{ action: [10, 0xaf] }, { action: [10, 0x94] }, { action: [10, 0xa7] }],
    '3|Motion[7]':  [{ action: [10, 0xaf] }, { action: [10, 0x94] }, { action: [10, 0xa7] }],
    '3|Motion[4]':  [{ action: [10, 0x94] }],
    '3|Motion[6]':  [{ action: [10, 0x94] }, { action: [10, 0xbb] }],
    '3|Motion[8]':  [{ action: [10, 0x94] }, { action: [10, 0xbc] }],
    '0|Motion[13]': [{ action: [0, 2] }, { action: [1, 2] }],
    '2|Motion[17]': [{ action: [2, 0x0f] }, { action: [7, 0x10] }, { action: [7, 0x32] }],
    '2|Motion[28]': [{ action: [1, 0x10] }, { action: [1, 6] }],
    '3|Motion[1]':  [{ action: [10, 7] }, { action: [10, 0xbd] }],
    '3|Motion[14]': [{ action: [10, 0x1f] }],
    '3|Motion[15]': [{ action: [10, 0x1d] }],
    '3|Motion[16]': [{ action: [10, 0x1e] }],
    '3|Motion[23]': [{ action: [10, 0x20] }],
    '3|Motion[17]': [{ action: [10, 0x20] }, { action: [10, 0x44] }],
    '3|Motion[18]': [{ action: [10, 0x2a] }, { action: [10, 0x44] }, { action: [10, 0xa7] }, { action: [1, 0x0b] }],
    '3|Motion[19]': [{ action: [11, 0] }],
    '3|Motion[27]': [{ action: [10, 0x9b] }],
    '3|Motion[28]': [{ action: [10, 0xa1] }],
    '3|Motion[31]': [{ action: [10, 0xa9] }],
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
  // THUNDERLORD's slams discharge (dev/em057-effects-spec.md 10): after the shell spawn the body calls 0xeecb28 -> 0xeecc2c,
  // id 1005 = u 90, at actiontune float 0x27 = 266.0 of L9 M1 ((7, 0xe3), 0xefaed8..0xefb04c) and float 0x3d = 204.0 of L9 M5
  // ((7, 0xdb) phase 2, 0xefb728..0xefb814) -- em057_04_actiontune.fup (Zinogre's arc carries none; list 9 is his alone).
  em057_04: {
    '9|Motion[1]': { frame: 266, by: { '7:0xe3': ['em057_04u', 90, 'UNIQUE'] } },
    '9|Motion[5]': { frame: 204, by: { '7:0xdb': ['em057_04u', 90, 'UNIQUE'] } },
    // id 1009 = u 280 (em057_04_027, joint 3): body 0xefb210 phase 1, r5 == 1 -- (7, 0xd9 / 0xda) -- at L9 M2 f25 (0xefb26c..0xefb2b0)
    '9|Motion[2]': { frame: 25, by: { '7:0xd9': ['em057_04u', 280, 'UNIQUE'], '7:0xda': ['em057_04u', 280, 'UNIQUE'] } },
  },
  // GRAVIOS: the same class routine at frame 216 with no em test (dev/em005_00-effects-spec.md 5) -- his own em005_00u
  // UNIQUE 0 / 30 for (7, 0x0a) / (7, 0x07). His (7, 5 / 0xf / 0x15 / 0x10) ask for u 60 / 70 / 90 / 100, which his pel
  // lacks (what 0x6feb8 does then: NR) -- not listed.
  em005_00: {
    '2|Motion[3]': { frame: 216, by: { '7:0x0a': ['em005_00u', 0, 'UNIQUE'], '7:0x07': ['em005_00u', 30, 'UNIQUE'] } },
  },
  em004_00: {
    '2|Motion[3]': { frame: 216, by: {
      '7:0x0a': ['em004_00u', 0, 'UNIQUE'],   '7:0x07': ['em004_00u', 30, 'UNIQUE'],
      '7:0x05': ['em004_00u', 60, 'UNIQUE'],  '7:0x0f': ['em004_00u', 70, 'UNIQUE'],
      '7:0x15': ['em004_00u', 90, 'UNIQUE'],  '7:0x10': ['em004_00u', 100, 'UNIQUE'],
    } },
  },
  // AHTAL-KA's (1, 0x21), phase 9 (0x10bdba4 -> 0x10be1c4..0x10be20c): on L2 M14 the crossing of 230.0 (0xb0968 mode 0, literal
  // 0x10be29c) requests id 0x406 = 1030 -> u 420 UNIQUE (em088_00_014) through vt+0x1d0, the handle dropped (a one-shot). Only on the
  // combined list, where M14 plays under (1, 0x21) (render/monster.js ROM_PARTNER_BODY.em088_00; dev/em088-em087-combined-spec.md 5)
  em088_00: {
    '2|Motion[14]': { frame: 230, by: { '1:0x21': ['em088_00u', 420, 'UNIQUE'] } },
  },
};
export const actionName = a => a ? a[0] + ':0x' + a[1].toString(16).padStart(2, '0') : null;
// (a shell pick may carry ' #n' after the action: one of the action's several shell entries -- Lao-Shan Lung's event lists, '7:0x00 #25')
export const actionOf = name => { const m = /^(\d+):0x([0-9a-f]+)(?: #\d+)?$/i.exec(name || ''); return m ? [+m[1], parseInt(m[2], 16)] : null; };

// the action a play takes: `n` the play's index (each play the next of the ROM's choices, as the shells' picks go),
// `tired` / `rage` the state shown at its start (the op-0x24 arm; an entry's `rage` is the form a stream issues while
// enraged -- Gypceros's op 0x1c, 0x81688)
// An entry may carry `onlyIf: { charged, rage }`: a play the ROM makes only in that state (Thunderlord's L2 M43 / M44 chains,
// which his G remap 0xeec298 takes away unless charged and calm -- dev/em057-effects-spec.md 11). `charged` undefined (a
// monster with no charge byte) keeps every entry; a filter that would leave none keeps them all.
export function clipActionFor(monId, list, clip, n, { tired = false, rage = false, charged } = {}){
  const t = CLIP_ACTIONS[monId], a0 = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a0 || !a0.length) return null;
  const ok = e => !e.onlyIf || ((e.onlyIf.charged === undefined || charged === undefined || e.onlyIf.charged === !!charged) &&
                                (e.onlyIf.rage === undefined || e.onlyIf.rage === !!rage));
  const a = a0.filter(ok).length ? a0.filter(ok) : a0;
  const e = a[((n | 0) % a.length + a.length) % a.length];
  if (rage && e.rage) return e.rage;
  return (tired && !rage && e.tired) ? e.tired : e.action;
}
// whether a play starts already under the ground (0x81d6c: posture 4 and P+0x5c < 0.9 x MoguriBaseOfs), where the play's
// entry says so (Deviljho's and Barroth's burrowed L0 M6); false elsewhere -- the viewer's stand-in, as Akantor's
export function clipSunkFor(monId, list, clip, n){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return false;
  return a[((n | 0) % a.length + a.length) % a.length].sunk === true;
}
// the posture a play starts in (P+0x1ba), where the enable word reads it and the play's entry names it (Bloodbath's
// L0 M5 / M7); undefined elsewhere -- the class then reads its spawn value 0 (0xb8e84)
// the P+0x1a1 phase a play stands for, where the entry names it (Khezu's L2 M37 (7, 0x52) second play); undefined elsewhere
// a play's own field (Congalala's `gas` / `asleep`), where the entry names it; undefined elsewhere
// which entry a play takes when a clip's entries name a CLIP_VARIANTS copy (`variant: 'B'`; no field = copy A): the n-th of
// the picked copy's own entries, as an index into the whole list -- so the copy the Clip menu names decides the play (a _loop
// clip's replays are not new plays, so its later entries could not be reached by counting). Without `variant` fields: n.
export function clipEntryIndex(monId, list, clip, n, variant){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length || !a.some(e => e.variant)) return n | 0;
  const pick = a.map((e, i) => [e, i]).filter(([e]) => (e.variant || 'A') === (variant || 'A'));
  if (!pick.length) return n | 0;
  return pick[((n | 0) % pick.length + pick.length) % pick.length][1];
}
// the actions a CLIP_VARIANTS copy's own entries name (their `rage` / `tired` forms too), as actionName strings -- null where the
// clip has no copies. A shell pick (index.html rockInput) decides a play's action only when it is one of these: the copy picked
// from the Clip menu is the play (re-walk 2026-10-18: Kirin's roar L4 M7 A is (1, 6), which his L4 M7 lightning picks are not)
export function clipCopyActions(monId, list, clip, variant){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.some(e => e.variant)) return null;
  const out = [];
  for (const e of a) if ((e.variant || 'A') === (variant || 'A'))
    for (const f of ['action', 'rage', 'tired']) if (Array.isArray(e[f])) out.push(actionName(e[f]));
  return out;
}
export function clipFieldFor(monId, list, clip, n, field){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return undefined;
  return a[((n | 0) % a.length + a.length) % a.length][field];
}
export function clipPhaseFor(monId, list, clip, n){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return undefined;
  return a[((n | 0) % a.length + a.length) % a.length].phase;
}
export function clipPostureFor(monId, list, clip, n){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return undefined;
  return a[((n | 0) % a.length + a.length) % a.length].posture;
}
