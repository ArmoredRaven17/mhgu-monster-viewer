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

export const CLASS_MASK = { em042_00, em077_00, em003_00, em005_00, em001_00: rath(1, 0x001, false), em001_02: rath(1, 0x201, false), em001_04: rath(1, 0x401, true),
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
  'em042_00', 'em077_00',
  'em025_00', 'em058_00', 'em065_00', 'em076_00', 'em086_00'];

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
const EM045_ACTIONS = {
  '2|Motion[2]':  [{ action: [7, 2] }, { action: [7, 4] }, { action: [7, 4] }],
  '2|Motion[3]':  [{ action: [7, 2] }, { action: [7, 4] }, { action: [7, 0x90] }],
  '2|Motion[10]': [{ action: [7, 0x90] }, { action: [7, 0x8a] }],
  '0|Motion[11]': [{ action: [1, 2] }, { action: [1, 0] }],
};
const EM043_ACTIONS = {
  '0|Motion[5]': [{ action: [1, 2] }, { action: [10, 0x2a] }],
  '0|Motion[6]': [{ action: [2, 0] }, { action: [6, 3], posture: 4, sunk: true }],
};
const EM063_ACTIONS = {
  '2|Motion[42]': [{ action: [7, 0x08] }, { action: [7, 0x14] }, { action: [7, 0x15] }, { action: [7, 0xa5] },
                   { action: [7, 0xa6] }, { action: [7, 0xb0] }, { action: [7, 0xb1] }],
  '2|Motion[41]': [{ action: [7, 0x09] }, { action: [7, 0x98] }],
};
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
  // DIABLOS (em007_00): Bloodbath's posture plays and his death clip (dev/em007_00-effects-spec.md 2). L0 M5: posture 0 from
  // the (2, n) moves (0xd393fc), 4 from (6, 2) (0xd3b908); L0 M7: posture 0 from (2, 6 / 7 / 8 / 0xc / 0x1a) (0xd39c40), 4 from
  // the burrow (6, 3) (0xd3b9fc) and 0xd3c4a0. No rows for L2 M15 / M19 / M31: their arms need (7, 0xb4..0xb8), which his
  // variant's command streams never issue (the shared command table splits by variant at g0 s3; op 0x20 as a jump: I).
  em007_00: {
    '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],
    '0|Motion[7]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],
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
  // (7, 0xe4) chain -- give bits 27-29 (u 290, u 531). Both ROM plays begin at frame 18; the viewer plays the clip from
  // 0 (dev/em018_00-effects-spec.md 3). Garuga's word reads no action.
  em018_04: {
    '0|Motion[7]': [{ action: [2, 0x02] }, { action: [7, 0xe3] }, { action: [7, 0xe5] }],
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
  em045_00: { ...EM045_ACTIONS, '0|Motion[6]': [{ action: [2, 2] }, { action: [6, 6], posture: 4, sunk: true }] },
  em045_04: EM045_ACTIONS,
  // DURAMBOROS (dev/em055_00-effects-spec.md 3): L0 M11 is (1, 0) -- the rage roar, g6 s0 behind op 0x6f(2) -- (1, 0xd)
  // (g13 s0) and (1, 2) (g8 s1); c 120 on the first two, the whole word cleared on (1, 2). L0 M3 / M4 / M6 / M15: the depth
  // decides (0x81d6c): a posture-0 play, then one in the rolling posture ((6, 4) / (6, 5) after the curl).
  em055_00: {
    '0|Motion[11]': [{ action: [1, 0] }, { action: [1, 2] }],
    '0|Motion[3]':  [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
    '0|Motion[4]':  [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
    '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 5], posture: 4, sunk: true }],
    '0|Motion[15]': [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
  },
  em044_00: {
    '0|Motion[11]': [{ action: [1, 2] }, { action: [10, 0x2a] }],
    '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 6], posture: 4, sunk: true }],
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
};
export const actionName = a => a ? a[0] + ':0x' + a[1].toString(16).padStart(2, '0') : null;
export const actionOf = name => { const m = /^(\d+):0x([0-9a-f]+)$/i.exec(name || ''); return m ? [+m[1], parseInt(m[2], 16)] : null; };

// the action a play takes: `n` the play's index (each play the next of the ROM's choices, as the shells' picks go),
// `tired` / `rage` the state shown at its start (the op-0x24 arm; an entry's `rage` is the form a stream issues while
// enraged -- Gypceros's op 0x1c, 0x81688)
export function clipActionFor(monId, list, clip, n, { tired = false, rage = false } = {}){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return null;
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
