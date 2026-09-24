// ANIMATIONS THAT CARRY A PART BREAK OR A STATE CHANGE, shown the way the game shows them, over the user's own choices.
//
// Raven, 2026-09-21: "Animations that involve part breaks or state changes should show that. If the user sets a part to
// be broken, toggle the part to intact to display the part break, same for different states. This way the animation can
// play out, but we keep the user's toggle choices."
//
// A motion listed here changes what the viewer SHOWS while it plays and nothing the user chose -- index.html's `state`,
// the Parts panel, the Enraged checkbox and the saved view all stay as they are. From the frame the ROM makes the change,
// the display takes the motion's state (the part sets, the rage), and that change's own effects are requested there;
// when the motion is over -- another clip or the bind pose -- the display goes back to the user's choices by the game's
// own way out (a part's set; rage's stop request and Gekikou_End). A play-once clip held on its last frame is still that
// motion and keeps its state: Raven, 2026-09-21, of a death played once: "he goes back to being enraged, eyes open in
// the death state".
//
// WHERE THE CHANGE FALLS. Savage's all fall on FRAME 0 of the motion. A break: the damage code raises the break level and
// requests the effect, the reaction's script sets its motion from frame 0 in the same enemy update, and that frame's
// +0x28 pass applies the part sets from the new level -- "the first frame drawn with the reaction motion already has the
// broken model" (E:\offline\decode\notes\breaks-em043.md 2.7). Rage: the forced transition sets it and starts the entry
// action, whose motion begins at frame 0, and the same frame's +0x28 pass requests the aura and switches the materials
// and parts (states-em043.md 1.2). So no frame inside the motion shows the state before the change: the intact head is
// the motion before the reaction. A motion that starts over -- a loop, a replay, the scrubber moved back -- is the change
// again, and its effect is requested again.
//
// A BREAK IS SHOWN INTO THE USER'S LEVEL: with the Jaw broken, the first break (intact -> jaw); with the Face broken, the
// second (jaw -> face); with the head intact, the first, back to intact when the motion is over.
//
// Only what the ROM changes at that frame is shown changed. Savage's part driver (0xe809e8, every frame) picks the body
// set from rage alone (13 enraged / 9 calm, 0xe80bc8..0xe80bfc), the tail set from the sever bit alone (12 / 10,
// 0xe80c00..0xe80c24) and the head sets from the break level alone (0xe80c28..0xe80cf4) -- so a rage entry shows the body
// set and leaves the head and tail as the user has them, and a break shows its own part's sets and nothing else. Death
// keeps every break the user set: the break level and the sever bit outlive it (nothing on the death path clears them).
//
// A spec is one of:
//   { levels, fire }           a break: the part sets per level (the level shown is the user's, at least the 1st) and
//                              the [pel, key] each level's break requests
//   { rage: true, sets }       rage entry: sets [calm, enraged]
//   { dead: true, sets, clips, settled? }   death: the sets shown dead, the material clips death plays from its frame 0
//                              ({ mats, clip }), and `settled` when the motion begins after death's transitions are over
//   tables: [{ calm, enraged }, ...]   part groups whose sets follow rage as well as a level (Nargacuga's head and tail):
//                              each is shown at the user's level, in the enraged table while rage is shown (or
//                              `show: 'enraged'`), else the calm one; `levels` may be such a pair too, picked by the
//                              user's rage, and `at` is the level a break motion reaches (default 1)
//   an ailment / tiredness, any of: rage (false: rage shown off), sets, every: [[pel, key], period] (a record requested
//                              on a countdown: at the motion's frame 0, then every `period` frames), hold: [pel, key] (a
//                              record requested once and kept while the state lasts, stopped after), eyesOff: [pel, key]
//                              (a rage record the monster's code holds off in this state), puffOff (the rage puff's
//                              countdown paused: the sleep hold), tired (calm and tired: the rage puff's countdown zeroed)
//   { cycle: [spec, ...] }     one motion that several breaks play (Rathian's back and wings): each play -- each frame 0 --
//                              shows the next spec
//   start: [[pel, key], ...]   records requested once at the motion's frame 0 (a reaction whose setAction requests one)

// NARGACUGA (em037_00): E:\offline\decode\notes\states-em037.md and breaks-em037.md (uEm037_00, vtable 0x17bc47c; its
// per-frame part driver 0xe486f4). The head and tail sets follow both the break level and rage: head intact 4 / 6,
// broken 5 / 7 (calm / enraged); tail intact 12 / 15, broken 13 / 16, severed 14 / 17. Eye set 2 (both lids) while
// the eye flag is up -- asleep, resting, dead (0xe4749c); set 3 is never applied.
const N_HEAD = { calm: [[4], [5]], enraged: [[6], [7]] };
const N_TAIL = { calm: [[12], [13], [14]], enraged: [[15], [16], [17]] };

// DEVILJHO (em043_00): his part driver reads RAGE as well as the break levels (states-em043_00.md 1.1, ROM-run over
// every combination) -- the body swaps set, and the tail and head have an enraged form of each level. Savage's driver
// reads the levels alone, which is why his table needs none of this.
const D_BODY = { calm: [[0]], enraged: [[9]] };
const D_TAIL = { calm: [[4], [8]], enraged: [[10], [12]] };
const D_HEAD = { calm: [[2, 3], [7, 3], [7, 6]], enraged: [[2, 3], [7, 3], [7, 11]] };

// RATHIAN (em001_00): E:\offline\decode\notes\states-em001.md and breaks-em001.md (uEm001_00, vtable 0x1793c28; its
// per-frame part driver 0xcf253c follows the break levels and the sever alone -- no rage, tired or status test). Eye set A
// = 1 (group 1 on, 9 off) while the eye flag is up -- asleep, resting, dead --, B = 2 otherwise (0x71398 from 0xcecfc4).
// A wing's break also tears its membrane (its material's alpha-test reference 20 -> 127, 0xcf25ac..0xcf2894):
// render/monster.js ROM_BREAK_ALPHA follows the wing part drawn, so a motion's sets carry the tear with them.
// (10, 0x1b): the tune+0x44 status -- a gauge fed by the attack data's byte hit+0x59 beside the KO feed (0x9db10); its
// threshold (180, +75 a time, cap 480) sends reaction code 8 -> (10, 0x1b) on the ground, whose setAction requests c 1109
// once (0x75e4c -> 0xa30dc -> 0xa4074: cm200_008 on joint 3) and whose script 0x1794b30 plays L3 Motion[2] from frame 0.
// INFERRED exhaust (E:\offline\decode\notes\shared-state-effects.md; states-em001.md 4.2 called it blast -- blast is the
// tune+0x54 status, c 1130..1137 on the part hit, with no clip of its own). No part set changes.
// THE RATH LINE'S MOTIONS. uEm001_00 runs Rathian, Gold Rathian, Dreadqueen and the three Rathalos, each on Rathian's
// lists 0..3 (the Rathalos load her very files, states-em002_04.md 1) and on the same .mpm set NUMBERS -- Gold's layout is
// Rathian's set for set; Dreadqueen's and Dreadking's tails have three states (below), and Dreadking's sets hold different
// groups, which the set numbers here do not care about. Each fires its break, sever and rage records from its OWN u.pel
// (em001_02u / em001_04u / em002_04u carry the same keys, some placed differently and Dreadking's with other offsets) and
// the ailment ones from its c.pel -- Rathian's em001_00c for the three em 1, Rathalos's em002_00c for the em 2, whose
// state records are byte-identical to hers (states-em002_04.md 1).
function rathLine(u, c = 'em001_00c'){
  // (10, 0x1b): the tune+0x44 status -- see above. c 1109 differs between the two c.pels at payload +0x38 alone.
  const R_EXHAUST = { start: [[c, 1109]] };
  const R_BACK = { levels: [[9], [10]], fire: [null, [u, 1000]] };
  const R_WING_L = { levels: [[5], [6]], fire: [null, [u, 1005]] };
  const R_WING_R = { levels: [[7], [8]], fire: [null, [u, 1010]] };
  return {
    // THE BACK AND WING BREAKS (breaks-em001.md 0, 3): the 1st depletion of the back (dtt part 0), the left wing (1) or the
    // right wing (2) raises its level to 1 -- its only row -- and the reaction (10, 7) plays L3 Motion[2] from frame 0
    // (scripts 0x1794ab0 / 0x1794ac0, blend 2): back set 9 -> 10 and u 1000 (id 7: cm202_060 on joint 1); left wing 5 -> 6
    // and u 1005 (id 12, joint 9); right wing 7 -> 8 and u 1010 (id 17, joint 13) (0xa442c: id part x 5 + level + 6). One
    // motion, three breaks, and a hit depletes one part: each play shows the next of them, in the parts' order -- then
    // (10, 0x1b), the tune+0x44 status's reaction (R_EXHAUST: c 1109 at frame 0). The neck's and the tail's depletions play
    // it too and change nothing.
    '3|Motion[2]':  { cycle: [R_BACK, R_WING_L, R_WING_R, R_EXHAUST] },
    // THE HEAD BREAK: part 6's 2nd depletion, level 2 (row 0, the head's only row): set 3 -> 4 and u 1031 (id 38: cm202_060
    // on joint 4); reaction L3 Motion[1] from frame 0 (0x1794ae0). Its 1st depletion plays the same motion and changes
    // nothing; (10, 0xbd) / (10, 0xbe) play it too.
    '3|Motion[1]':  { levels: [[3], [4]], fire: [null, [u, 1031]] },
    // THE TAIL SEVER: part 7's second counter (230) runs out on the ground -> (10, 0x72): the start hook severs (0xc2274:
    // u 900, cm202_062 on joint 144), then L3 Motion[15] from frame 0 (0x1794c10) -- the only motion that plays it -- and
    // set 12 in place of 11 (0xcf2a94). The cut tail drops from joint 143 (render/tail-option.js). The script's turn of
    // 180 degrees over f148..245 (op 0xa) is not in the clip and is not shown.
    '3|Motion[15]': { levels: [[11], [12]], fire: [null, [u, 900]], drops: true },
    // RAGE (2.2): the forced transition's command group 6 issues (1, 9) -- L0 Motion[4] from frame 0 (0xcf2dec) -- on the
    // ground. In the air another clip comes first and the flip is on it: Rathian's landing (4, 1) L1 Motion[16] -> [17],
    // Gold's and Dreadqueen's (4, 0x16) L4 Motion[7] (0xcfc364; states-em002_04.md 2.2). Neither is shown as the entry --
    // every landing plays the one, and L4 Motion[7] also plays inside eight of Gold's attacks and ten of Dreadqueen's,
    // and in (9, 2) (the variants' ROM action runs). Rage is on from L0 Motion[4]'s frame 0. No part set,
    // material or eye change (the driver reads no rage); the rage puff (RAGE_PUFF) runs while rage is shown. L0
    // Motion[4] is also the plain roar of (1, 0), (1, 0xf), (1, 0x21) and (1, 0x22): shown here as the entry. Its motion
    // rate x1.15 is not shown (the viewer plays 1.0).
    '0|Motion[4]':  { rage: true },
    // TIRED (3): the idle (0, 2) is L0 Motion[14] (0xcee5f8); drool c 1104 (cm200_006, joint 3) every 48 while not enraged
    // (0xa42b0..0xa4334) -- rage shown off -- and, calm and tired, the rage puff's countdown is zeroed (0xa4340).
    '0|Motion[14]': { rage: false, tired: true, every: [[c, 1104], 48] },
    // ASLEEP (4.2, 4.3): (10, 0x1d) L3 Motion[14] falls asleep, (10, 0x1e) holds L0 Motion[19], (10, 0x44) wakes with L0
    // Motion[20]; eye set 1 from L3 Motion[14] f0 (the flag drops one pass into L0 Motion[20]: one frame, not shown). In
    // the hold (0x81bb0(e, 1)): zzz c 1102 (cm200_002, joint 3) every 90 (0xa3e60..), and 0xa41b8 returns before its
    // countdowns -- the rage puff pauses. The rest -- L0 Motion[18] lying down, then the same L0 Motion[19] (+0x522 from
    // its f0) -- is the same hold. L3 Motion[14] -> L0 Motion[19] is also the capture (11, 0x10): shown as sleep.
    '3|Motion[14]': { sets: [1] },
    '0|Motion[19]': { sets: [1], every: [[c, 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 (cm200_001, joint 1) every 60, first at once. L3 Motion[13] is
    // also the shock trap's hold: shown as paralysis.
    '3|Motion[13]': { every: [[c, 1101], 60] },
    // SHOCK TRAP: (10, 0x6e) plays L3 Motion[9] (to f60), then holds L3 Motion[13]; c 1105 (cm200_001, joint 1) every 42
    // while the action lasts. L3 Motion[9] also plays for (10, 0x52) (INFERRED the flash, states-em002_04.md 5.2),
    // (10, 0x87) and (10, 0xb4) (meanings NOT READ), and for Gold and Dreadqueen (10, 0x94) (5.3).
    '3|Motion[9]':  { every: [[c, 1105], 42] },
    // STUN: (10, 0x20) plays L3 Motion[3] -> [5] (held) -> [7] for side 2 and L3 Motion[4] -> [6] -> [8] for the others
    // (0xcf0d94); c 1103 (cm200_003, joint 3) is requested once into one handle while stunned (bit 0x10) and stopped when
    // it clears, at (10, 0x2b)'s L3 Motion[16]. The six clips are also the legs' depletion trips and play in other
    // reactions (breaks-em001.md 3, states-em001.md 4.4): shown as the stun.
    '3|Motion[3]':  { hold: [c, 1103] },
    '3|Motion[5]':  { hold: [c, 1103] },
    '3|Motion[7]':  { hold: [c, 1103] },
    '3|Motion[4]':  { hold: [c, 1103] },
    '3|Motion[6]':  { hold: [c, 1103] },
    '3|Motion[8]':  { hold: [c, 1103] },
    // DEATH (5): L3 Motion[17] (every status-11 number but 1, 7, 0x10, 0x12, 0x26) and L3 Motion[12] (the end of the fall,
    // (11, 1)) -- the two clips only death plays: rage cleared at the setAction (no more puffs), eye set 1 for good, the
    // breaks and the sever as they were. The class has no death branch of its own.
    '3|Motion[17]': { dead: true, sets: [1] },
    '3|Motion[12]': { dead: true, sets: [1] },
  };
}
export const MOTION_STATES = {
  // BASARIOS (em004_00): E:\offline\decode\notes\states-em004_00.md, read and ROM-run by the Basarios decode agent
  // (2026-09-23). His class uEm004_00 (vtable 0x1797c8c) IS ALSO GRAVIOS -- every state function branches on
  // enemy+0xb5f4 (4 / 5) -- so this table is half of em005_00's too, and his motion lists are Gravios's files
  // (L0..L3 = em005_00_0..3; only L4 is his own).
  //   HIS BREAKS SWAP GEOMETRY, where Khezu's add it: the chest takes set 3 -> 4 (group 2 off, 3 on) and the back
  //   set 5 -> 6 (group 7 off, 8 on) -- an intact mesh out, a broken one in. Only parts 6 and 0 have a .dtp row, so
  //   no other depletion changes the model, and nothing but the break level picks a set.
  //   HE HAS NO HEAD BREAK at all (dtt part 5 has no row; the row partnames calls "Head" is the eye pair), and NO
  //   MATERIAL ANIMATION of any kind -- the class calls no material function and his .mrl has no clips, so rage and
  //   death change nothing on his body.
  // NOT SHOWN, decoded and stated here instead: reaction code 0x25, which he is the first monster we have read to
  //   reach (+0x240 is not the base stub) -- on soft ground a chest depletion SINKS him (L3 Motion[18]) and he
  //   climbs out instead of staggering; the buried state P+0x524 that L4 Motion[2] / [4] raise, which turns his
  //   hyper auras off underground; and hit capsules that swap on an animation frame (+0x2a8). None is a part set.
  em004_00: {
    // THE CHEST / BELLY BREAK: (10, 0x14) with part 6 plays L3 Motion[107]. One level, and set 4 with it -- the
    // broken chest in, the intact one out -- firing u 1030 (cm202_060 on joint 2, id 6*5 + 1 + 6 = 37).
    '3|Motion[107]': { levels: [[3], [4]], fire: [null, ['em004_00u', 1030]] },
    // THE BACK BREAK: (10, 7) with part 0 plays L3 Motion[106] (parts 1, 2 and 7 play it too and change nothing).
    // Set 5 -> 6, firing u 1000 (the same file on joint 1, id 0*5 + 1 + 6 = 7).
    '3|Motion[106]': { levels: [[5], [6]], fire: [null, ['em004_00u', 1000]] },
    // THE TAIL SEVER: part 7's second counter (140, once) -> (10, 0x72), on L3 Motion[15]. Set 7 -> 8 and u 900
    // (cm202_062 on joint 143, the Rath line's sever joint). His cut tail is NOT dropped here: the ROM has one
    // (uEnemyOption slot 0, sever kind 0x8f) but the viewer has no em004_00_tail model staged, so `drops` is left
    // off rather than set to something that would silently do nothing.
    '3|Motion[15]':  { levels: [[7], [8]], fire: [null, ['em004_00u', 900]] },
    // RAGE: command group 6's ground branch issues (1, 0x0a) -- L0 Motion[4] from frame 0 -- and NOTHING ON THE
    // MODEL CHANGES WITH IT: no part set, no eye, no joint, and no material, because he has none. The shared puff is
    // the whole of what rage shows.
    '0|Motion[4]':   { rage: true },
    // TIRED: the idle (0, 2) is L0 Motion[14]; drool c 1104 every 48 while not enraged -- the one state record of his
    // that carries a rotation, (70, 0, 0) -- and, calm and tired, the puff's countdown is zeroed.
    '0|Motion[14]':  { rage: false, tired: true, every: [['em004_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 Motion[14] falls asleep and (10, 0x1e) holds L0 Motion[19]. His eyes DO shut -- set 1 for
    // set 2, the only monster state that moves them (P+0x5d02, which shared code raises only asleep or resting) --
    // and the hold has the zzz c 1102 every 90 and pauses the puff.
    '3|Motion[14]':  { sets: [1] },
    '0|Motion[19]':  { sets: [1], every: [['em004_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60, first at once. L3 Motion[13] is also the shock
    // trap's hold (c 1105 every 42, after L3 Motion[9] to f60): shown as paralysis, as Khezu's and Rathian's are.
    '3|Motion[13]':  { every: [['em004_00c', 1101], 60] },
    // STUN: (10, 0x20) plays L3 Motion[110] -> L3 Motion[111]; c 1103 requested once into one handle and stopped when
    // it clears.
    '3|Motion[110]': { hold: ['em004_00c', 1103] },
    '3|Motion[111]': { hold: ['em004_00c', 1103] },
    // THE tune+0x44 STATUS (INFERRED exhaust): (10, 0x1b) plays L3 Motion[2], which requests c 1109 once at frame 0.
    '3|Motion[2]':   { start: [['em004_00c', 1109]] },
    // DEATH: L3 Motion[17] on the ground for (11, 0) and every number the table does not name, L3 Motion[12] at the
    // end of the fall ((11, 1), after L3 M10 -> L3 M11), and L3 Motion[20] for (11, 7) / (11, 0x12). Death shows
    // NOTHING of its own on him: the break sets stay as the user has them, his eyes stay open (death does not raise
    // P+0x5d02) and there is no material to change. L3 Motion[12] begins past the fall's landing, so it is settled.
    '3|Motion[17]':  { dead: true },
    '3|Motion[12]':  { dead: true, settled: true },
    '3|Motion[20]':  { dead: true },
  },
  // BARIOTH (em042_00): E:\offline\decode\notes\states-em042_00.md, read and ROM-run by the Barioth decode agent
  // (2026-09-24). Every change below lands on FRAME 0 of the motion named, except the rage pair, which the part pass
  // re-applies from isEnraged every frame -- so it is not a motion's set at all and lives in RAGE_PARTS.
  //   HIS BREAK REACTIONS ARE THREE MOTIONS, not one: a wing-arm break plays L3 M3 (or M4) -> 240 frames of L3 M5
  //   (M6) -> L3 M7 (M8), and the ROM uses the SAME six clips for the stun, sided (direction 1 takes M4/M6/M8,
  //   direction 2 M3/M5/M7). One motion can show one thing, so the break's set change sits on the first clip of each
  //   chain -- that is where the ROM applies it and where it is visible -- and the stun's held stars sit on the hold
  //   and recovery clips, where a player sees them. The sharing is the ROM's, not a choice made here.
  em042_00: {
    // THE HEAD: (10, 7) with part 0 plays L3 Motion[1]. LEVEL 1 SHOWS NOTHING AT ALL -- only level 2 has a .mpm row --
    // so levels 0 and 1 keep set 12 and fire nothing; level 2 takes set 13 (group 2 off, 3 on) and fires u 1001
    // (cm202_060 on joint 4, offset (0, -70, 30) at 0.5x).
    '3|Motion[1]':  { levels: [[12], [12], [13]], fire: [null, null, ['em042_00u', 1001]] },
    // THE +X WING-ARM (part 2) at level 1: set 14 -> 15 (group 10 off, 11 on), firing u 1010 -- the same file on
    // JOINT 60, offset (0, 0, -300) at 0.8x. Part 5 (the +X hind leg) plays the same chain and changes nothing.
    '3|Motion[3]':  { levels: [[14], [15]], fire: [null, ['em042_00u', 1010]] },
    // THE -X WING-ARM (part 3) at level 1: set 16 -> 17 (group 12 off, 13 on), firing u 1015 on JOINT 70. Part 6 (the
    // -X hind leg) plays it and changes nothing.
    '3|Motion[4]':  { levels: [[16], [17]], fire: [null, ['em042_00u', 1015]] },
    // THE STUN, the only sided reaction he has ((10, 0x20), section 6.2): c 1103 (cm200_003 on joint 3, offset
    // (0, 0, 50) at 1.1x) into ONE held handle across the chain, stopped when it clears.
    '3|Motion[5]':  { hold: ['em042_00c', 1103] },
    '3|Motion[6]':  { hold: ['em042_00c', 1103] },
    '3|Motion[7]':  { hold: ['em042_00c', 1103] },
    '3|Motion[8]':  { hold: ['em042_00c', 1103] },
    // THE TAIL SEVER: part 7's SECOND counter (base 380, once) -> (10, 0x72) on L3 Motion[13]. Set 18 -> 19 (group 14
    // on, 101 off) and u 900 (cm202_062 on joint 144 at 1x). Part 7's first counter is a durability with no .dtp row,
    // so there is no broken level -- only the sever. No cut-tail model is staged for him, so `drops` is left off
    // rather than set to something that would silently do nothing.
    '3|Motion[13]': { levels: [[18], [19]], fire: [null, ['em042_00u', 900]] },
    // RAGE: command group 6's tail issues (1, 0) -- L0 Motion[4] from frame 0. The two mesh pairs it swaps are in
    // RAGE_PARTS, because the ROM holds them for as long as isEnraged is true, not for the length of this clip.
    '0|Motion[4]':  { rage: true },
    // TIRED: the tired idle (0, 2) is L0 Motion[2] -- the SAME clip as his combat idle, so nothing on the model says
    // it -- with drool c 1104 every 48 (cm200_006 on joint 3, pos (0, -30, 80) at 1.2x) and, calm and tired, the
    // shared puff's countdown zeroed.
    '0|Motion[2]':  { rage: false, tired: true, every: [['em042_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 Motion[12] lies down, (10, 0x1e) holds L0 Motion[19], then L0 Motion[20] -> L3 Motion[14]
    // gets up. His eyes DO shut -- eye set 2 -> set 1, the lid mesh drawn -- while P+0x5d02 is up, and the hold has
    // the zzz c 1102 every 90 and pauses the puff. L3 Motion[12] and L0 Motion[19] are also CAPTURE's clips
    // ((11, 0x10)), which does not raise P+0x5d02; sleep is what they are shown as. L3 Motion[14] is left out
    // entirely: it is the wake-up and it is shared with the paralysis, stun and shock-trap recoveries.
    '3|Motion[12]': { sets: [1] },
    '0|Motion[19]': { sets: [1], every: [['em042_00c', 1102], 90], puffOff: true },
    '0|Motion[20]': { sets: [1] },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[11]; c 1101 every 60 (cm200_001 on joint 1 at 6x), first at once.
    // L3 Motion[11] is also the SHOCK TRAP's hold ((10, 0x6e), c 1105 every 42 at 5x): shown as paralysis, as
    // Khezu's, Basarios's and Rathian's shared hold is.
    '3|Motion[11]': { every: [['em042_00c', 1101], 60] },
    // THE tune+0x44 STATUS (INFERRED exhaust): (10, 0x1b) plays L3 Motion[2], which requests c 1109 once at frame 0
    // (cm200_008 on joint 3, offset (0, -10, 70) at 1.5x). L3 Motion[2] is worked hard by the ROM -- it is also the
    // head depletion while TIRED or ENRAGED ((10, 0x14) / (10, 0xe), whose set change L3 Motion[1] above shows) and
    // the shock trap's first motion -- so the one thing it shows here is the status only it carries.
    '3|Motion[2]':  { start: [['em042_00c', 1109]] },
    // DEATH: L3 Motion[15] on the ground for (11, 0) and every number the table does not name (it is also the end of
    // the fall, after L3 M9 -> M10 -> M8), and L3 Motion[18] for (11, 7) / (11, 0x12). Death shows nothing of its
    // own: the break sets and the sever stay as the user has them and his eyes stay open. What it DOES do is clear
    // the rage flag, which the part pass re-reads the same frame -- so the rage pair reverts, which `dead` gives for
    // nothing (it forces the shown rage false, and RAGE_PARTS follows the shown rage).
    '3|Motion[15]': { dead: true },
    '3|Motion[18]': { dead: true },
  },
  // KHEZU (em003_00): E:\offline\decode\notes\states-em003_00.md, read and ROM-run by the Khezu decode agent
  // (2026-09-23). His class uEm003_00 (vtable 0x17958f0) overrides almost none of the shared state machinery: the
  // break reaction is the plain (10, 7) because +0x23c is the base stub, there is no joint scaling (+0x2a0), no
  // sever, and no effect of his own -- he never calls +0x1cc or +0x1d0. He also never calls 0x71398, so his eye sets
  // stay -1 and his .mpm has none at all: NOTHING closes his eyes, asleep or dead. He has none.
  //   HIS BREAKS ADD GEOMETRY. At rest the part pass applies sets 0, 1 and 2, which turn mesh groups 1 and 2 OFF.
  //   The head (dtt part 6, joint 2, durability 200) at level 2 takes set 3, turning group 1 ON; the body (part 0,
  //   joints 0/1/140, durability 240) at level 3 takes set 4, turning group 2 ON. Both extra meshes draw in
  //   XfBAN__E0__m02_body_d, the damage overlay (70 and 92 vertices). Only the break level picks a set -- no rage,
  //   no flag, no variant -- and only parts 6 and 0 have a .dtp row, so no other depletion changes the model.
  // NOT SHOWN here because the viewer already plays it: his material state machine (vtable +0x210 = 0xd1e52c, 11
  // states on ctl+0x48) runs Angry_Start / Angry_Repeat / Angry_End / Nomal_Repeat and the Taiden pair, which
  // monster.js's STATE_NAMES and STATE_MATERIAL_SWAP drive from the Enraged and Charged toggles.
  em003_00: {
    // THE HEAD BREAK: (10, 7) with part 6 plays L3 Motion[1], blend 2 (parts 2 and 5 play it too and change nothing,
    // having no .dtp row). Only level 2 has a row, so levels 0 and 1 keep set 1 and fire nothing; level 2 takes set 3
    // and fires u 1031 -- cm202_060 on joint 2 at 0.6x, id 6*5 + 2 + 6 = 38 through 0xa442c.
    '3|Motion[1]':  { levels: [[1], [1], [3]], fire: [null, null, ['em003_00u', 1031]] },
    // THE BODY BREAK: (10, 7) with part 0 plays L3 Motion[2], blend 6 (part 7 and any out-of-range index play it too).
    // Its row is level 3: set 2 -> set 4, firing u 1002 -- the same cm202_060 on joint 0 at 1x, id 0*5 + 3 + 6 = 9.
    // L3 Motion[2] is also the shock trap's first motion (10, 0x6e), which shows nothing of its own: the trap's
    // effect runs on its hold, L3 Motion[13].
    '3|Motion[2]':  { levels: [[2], [2], [2], [4]], fire: [null, null, null, ['em003_00u', 1002]] },
    // RAGE: the gauge (threshold 450) -> command group 6 -> (1, 0x0d), the only action it issues on the ground,
    // playing L0 Motion[2] from frame 0. NOTHING ON THE MODEL CHANGES -- no part set, no eye, no joint -- and the
    // class requests no effect. What rage shows is the material pair Angry_Start (60 f) -> Angry_Repeat (120 f,
    // looping) on XfBA_A0__m03_blood, which the viewer's own enrage path plays, and the shared puff below.
    '0|Motion[2]':  { rage: true },
    // TIRED: the idle (0, 2) is L0 Motion[15]; drool c 1104 every 48 while not enraged, and -- calm and tired -- the
    // shared puff's countdown is zeroed (0xa4338).
    '0|Motion[15]': { rage: false, tired: true, every: [['em003_00c', 1104], 48] },
    // HE HAS THREE SLEEPS, NOT ONE. Raven, 2026-09-24: "Khezu has a standing sleep animation, I didn't see bubbles" --
    // and he was looking at a real gap. 0xbd4f0, the shared "fall asleep" that raises P+0x522, has TWO call sites in
    // his class, which his command table pairs as the ground and ceiling branches of one stream (g1 s102 sleep,
    // g1 s103 settle):
    //   (1, 0x0b)  ground sleep   L0 M30 -> hold L0 Motion[31] -> L0 M32
    //   (3, 0x52)  ceiling sleep  L2 M8  -> hold L0 Motion[55] -> L2 M9      (posture 6, on the ceiling)
    //   (10,0x1e)  the AILMENT sleep, the one we had: L3 M14 -> hold L0 Motion[19] -> L0 M20 -> L3 M17
    // All three fire the zzz, and the ROM gets there by two different routes: the natural pair through P+0x522, the
    // ailment through its action number being in the mode-1 set at 0xa3e68. HIS THREE RESTS FIRE NOTHING -- (1,0x29)
    // L0 Motion[57], (3,0x4c) L0 Motion[53] and (1,0x25) L0 Motion[18] -- because the ROM separates rest from sleep
    // by the 0xbd4f0 call and not by the clip, so they are deliberately absent here rather than missing.
    //   WORTH CARRYING TO EVERY MONSTER AFTER HIM: sleeping is THREE mechanisms, not one. P+0x522 gives the zzz AND
    //   the shut eyes; the status-10 number set gives the zzz ALONE; P+0x5e08 bit 0 gives the eyes alone (what raises
    //   that bit is NOT READ). A state wired from only one of them will not look asleep both ways. Khezu has no eye
    //   set at all, so only the zzz shows on him.
    '0|Motion[19]': { every: [['em003_00c', 1102], 90], puffOff: true },
    '0|Motion[31]': { every: [['em003_00c', 1102], 90], puffOff: true },
    '0|Motion[55]': { every: [['em003_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60, first at once. L3 Motion[13] is also the shock
    // trap's hold (c 1105 every 42): shown as paralysis, as Rathian's same motion is.
    '3|Motion[13]': { every: [['em003_00c', 1101], 60] },
    // STUN: (10, 0x20) plays L3 M3 -> M5 -> M7 or L3 M4 -> M6 -> M8, by whether part 3 or part 4 took the damage;
    // c 1103 is requested once into one handle while stunned and stopped when it clears. Those same six motions are
    // the part-3 and part-4 depletion reactions, which change nothing.
    '3|Motion[3]':  { hold: ['em003_00c', 1103] },
    '3|Motion[5]':  { hold: ['em003_00c', 1103] },
    '3|Motion[7]':  { hold: ['em003_00c', 1103] },
    '3|Motion[4]':  { hold: ['em003_00c', 1103] },
    '3|Motion[6]':  { hold: ['em003_00c', 1103] },
    '3|Motion[8]':  { hold: ['em003_00c', 1103] },
    // THE tune+0x44 STATUS (INFERRED exhaust): (10, 0x1b) plays L3 Motion[9], whose setAction requests c 1109 once at
    // frame 0 and changes no part.
    '3|Motion[9]':  { start: [['em003_00c', 1109]] },
    // DEATH: L3 Motion[18] on the ground for (11, 0) and every number the table does not name, and L3 Motion[12] at
    // the end of every fall ((11,1) / (11,4) / (11,5) / (11,6), after L3 M10 -> L3 M11). Those two are the only
    // motions death plays that nothing else plays. setAction clears rage, so Angry_End runs, and the driver then
    // plays the one-frame `Death` material clip on material 0 -- NO OTHER CLASS WE HAVE WIRED HAS ONE. The break sets
    // stay as the user has them (the part pass keeps re-applying them) and the eyes do not change: he has none.
    // L3 Motion[12] begins past the fall's landing and transitions, so it is settled.
    '3|Motion[18]': { dead: true, clips: [{ mats: ['XfBA_A0__m03_blood'], clip: 'Death' }] },
    '3|Motion[12]': { dead: true, clips: [{ mats: ['XfBA_A0__m03_blood'], clip: 'Death' }], settled: true },
  },
  // DEVILJHO (em043_00): E:\offline\decode\notes\states-em043_00.md, read and ROM-run by the Deviljho decode agent
  // (2026-09-22). He and Savage are the same class uEm043_00 and differ only by enemy+0xb5f5: their motion lists, PSL
  // set, command table, .dtp rows, body data and em043_00c.pel are byte-identical, so every motion below is Savage's
  // too. What his variant changes is the part driver (0xe806a0 against Savage's 0xe809e8) -- his sets follow RAGE as
  // well as the break level, where Savage's follow the level alone.
  //   body   calm set 0 -> enraged 9 (group 3 on)
  //   tail   intact 4 / severed 8 calm -> 10 / 12 enraged (8 and 12 draw the same groups)
  //   head   jaw and face by break level: 2,3 -> 7,3 -> 7,6 calm; the level-2 face is 11 (group 6 on) enraged
  // NOT SHOWN, both read and ROM-run and neither of them a part set: while enraged the class scales joints 200 and 201
  // (vtable +0x2a0, 0xe7eda8: (1.5, 7, 1) and (3, 6.5, 1) over 12 frames, 421 and 356 vertices weighted to them), and
  // the enraged sets are held 200 frames after rage ends while Angry_End runs (states-em043_00.md 1.2, 2.2). The
  // viewer has no joint scaling and the table has no way to hold a state past its motion.
  em043_00: {
    // THE HEAD BREAK, whose REACTION the rage state picks (0xe80f00): enraged -> (10, 0x14) L2 Motion[9], calm ->
    // (10, 7) L3 Motion[9]. The same two levels and the same records either way (u 1000 at level 1, u 1001 at 2;
    // 0xa442c ids 7 and 8), but the level-2 face differs: set 11 enraged, set 6 calm. Each motion shows its own form,
    // since the ROM plays L2 Motion[9] only enraged and L3 Motion[9] only calm.
    '2|Motion[9]':  { levels: D_HEAD.enraged, fire: [null, ['em043_00u', 1000], ['em043_00u', 1001]] },
    // L3 Motion[9] is also the tune+0x44 status's reaction ((10, 0x1b) / (10, 0x1c)), whose setAction requests c 1109
    // once at frame 0 and changes no part: each play shows the next, as Rathian's L3 Motion[2] does.
    '3|Motion[9]':  { cycle: [{ levels: D_HEAD.calm, fire: [null, ['em043_00u', 1000], ['em043_00u', 1001]] },
                              { start: [['em043_00c', 1109]] }] },
    // THE TAIL SEVER: part 1's counter runs out -> (10, 0x72), and L3 Motion[15] is the only motion that plays it.
    // The tail's sets follow rage as well as the sever, so the pair is picked by the rage the user has shown.
    '3|Motion[15]': { levels: D_TAIL, fire: [null, ['em043_00u', 900]], drops: true },
    // RAGE: the forced transition's command group 6 issues (1, 2) -- L0 Motion[5] from frame 0. The body takes set 9
    // and the tail and head their enraged sets at the user's level; the class itself requests no effect (its only
    // +0x1d0 request site, 0xe80500, is variant-5 gated), and Angry_Start runs on XfB__m02_body_k, which the viewer's
    // own enrage material path plays.
    '0|Motion[5]':  { rage: true, tables: [D_BODY, D_TAIL, D_HEAD] },
    // TIRED (the idle (0, 2), L0 Motion[15]): rage shown off, the body calm again, drool c 1104 every 48 while not
    // enraged, and -- calm and tired -- the shared rage puff's countdown is zeroed (0xa4338).
    '0|Motion[15]': { rage: false, tired: true, sets: [0], every: [['em043_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 Motion[14] falls asleep and (10, 0x1e) holds L3 Motion[25], which the rest uses too; the
    // eye set 5 goes on with the flag. In the hold the zzz c 1102 comes every 90 and the puff's countdown pauses.
    '3|Motion[14]': { sets: [5] },
    '3|Motion[25]': { sets: [5], every: [['em043_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60, first at once. The shock trap holds it too.
    '3|Motion[13]': { every: [['em043_00c', 1101], 60] },
    // SHOCK TRAP: (10, 0x6e) plays L3 Motion[2]; c 1105 every 42 while the action lasts.
    '3|Motion[2]':  { every: [['em043_00c', 1105], 42] },
    // STUN: (10, 0x20) plays L3 Motion[3] -> Motion[6]; c 1103 requested once into one handle while stunned and
    // stopped when it clears.
    '3|Motion[3]':  { hold: ['em043_00c', 1103] },
    '3|Motion[6]':  { hold: ['em043_00c', 1103] },
    // DEATH: L3 Motion[18] and L3 Motion[34], the only two motions death plays -- rage cleared (the body calm), eye
    // set 5 for good, the break and the sever as the user has them, and Angry_End on XfB__m02_body_k. Motion[34]
    // begins 169 frames into the fall, past death's transitions, so it is settled.
    '3|Motion[18]': { dead: true, sets: [0, 5], clips: [{ mats: ['XfB__m02_body_k'], clip: 'Angry_End' }] },
    '3|Motion[34]': { dead: true, sets: [0, 5], clips: [{ mats: ['XfB__m02_body_k'], clip: 'Angry_End' }], settled: true },
  },
  em043_05: {
    // THE HEAD BREAK (breaks-em043.md 2). Every depletion of part 0 plays L2 Motion[9] from frame 0 (reaction code 3 ->
    // action (10, 0x14), 0x9e82c; script 0x17c08a0: motion 0x209, blend 4, start 0). The 1st raises the break level to 1:
    // u 1000 (0xa442c: id part*5 + level + 6 = 7, 0x159c7fc[7] = 1000; cm202_060 on joint 3); the 2nd to 2: u 1001 (id 8).
    // The level becomes sets every frame: below 1 -> sets 2 and 3; 1 -> 7 and 3; 2 and up -> 7 and 11 (0xe80c28..0xe80cf4;
    // the levels are the dtp rows' own, 1 and 2, section 1.1). Set 7 is the Jaw row's Broken (parts 1 off, 2 on); set 11
    // the Face row's (parts 4 off, 5 and 6 on). Depletions after the 2nd play the motion and change nothing.
    '2|Motion[9]': { part: 'head', levels: [[2, 3], [7, 3], [7, 11]],
                     fire: [null, ['em043_05u', 1000], ['em043_05u', 1001]] },
    // THE TAIL SEVER (breaks-em043.md 4). Part 6's second counter runs out once -> action (10, 0x72): its start hook severs
    // (0xc2274: P+0x3b4 |= 1, then u 900 through 0xa4354 -- cm202_062 on joint 144), and its script (0x17c0c00) plays
    // L3 Motion[15] from frame 0; the part driver shows set 12 with the sever bit, set 10 without (0xe80c00..0xe80c24).
    // The cut tail drops on the same frame (render/tail-option.js, tail-option-em043.md; Raven: "Follow how the ROM
    // handles tail cut animations").
    '3|Motion[15]': { part: 'tail', levels: [[10], [12]], fire: [null, ['em043_05u', 900]], drops: true },
    // RAGE ENTRY (states-em043.md 1.2). The gauge's request makes the forced transition set rage (0xbcdb0) and start
    // action (1, 2) (command group 6 stream 0), whose phase 0 sets L0 Motion[5] from frame 0 (0xe74d10); the same frame's
    // +0x28 pass requests the aura (u 30, joint 103) and the eyes (u 31, joint 3) (0xe80500), plays Gekikou_Start on the
    // body materials from time 0 (0xe80b10..0xe80bc4) and shows body set 13 in place of 9 (0xe80bc8..0xe80bfc).
    // L0 Motion[5] also plays with no rage change -- the roar after paralysis and after the shock trap (scripts
    // 0x17c08f0 and 0x17c0bd0), action (1, 0x12) -- and is shown here as the entry.
    '0|Motion[5]': { rage: true, sets: [[9], [13]] },
    // DEATH (status 11; Raven, 2026-09-21: "we do have Death States to take to consideration if the parts are broken
    // during the animations"). Every status-11 action start, in setAction 0x754f8's status-11 path (0x75b40..): rage is
    // cleared (0xba7b8(e, 0) at 0x75b90) and, uEm043_00's vtable +0x21c (0x6be7c) returning 0, 0xbd594(e, -1) sets the
    // eye flag P+0x5d02 with timer 0xffff (0x75c1c) -- which the +0x28 pass never counts down (a timer at or below -1 is
    // skipped, 0xae3b4 / 0xaf04c), so from then on 0x6f4e8 applies eye set A every frame: Savage's A / B / C are 5 / 1 /
    // -1 (0x71398 from 0xe72b14), set 5 = part 7 drawn -- the Eyes row's Closed. The same frame, the part driver's
    // death branch (0xe80a08..0xe80ae4, status byte == 0xb) plays Angry_End on the body-glow material at [+0xcac0]+0x90
    // -- XfB__m02_body_k, which the spawn left lit with Angry_Start -- from time 0, Gekikou_End on the two rage
    // materials if the stage was enraged (2), and locks the stage at 3; the body set follows the cleared rage: 9.
    // Rage ends as it always does: the aura and eyes stopped, left to run out.
    // Savage's death actions (0xe7dffc, number -> script): (11, 0) L3 Motion[18] (0x17c0a50); (11, 1) L3 Motion[32] ->
    // [33] -> [34] (0x17c0c70, a fall); (11, 7) L3 Motion[21] (pit); (11, 0x10) L3 Motion[14] -> [25] and (11, 0x12)
    // L3 Motion[21] (both read as capture: the same status, NOT READ as such). Only Motion[18] and Motion[34] play in
    // nothing but death (every other one is also a reaction: [32] / [33] a fall, [21] the pit, [14] / [25] sleep), so
    // only those two are listed. [34] begins at least 169 frames into the fall's death ([32]_start 70 + [33] 99; the
    // script's ops between them, 0xb / 1 / 4, are NOT READ), past Gekikou_End's 60 frames and most of Angry_End's 200:
    // shown settled, the glow already out.
    '3|Motion[18]': { dead: true, sets: [9, 5], clips: [{ mats: ['XfB__m02_body_k'], clip: 'Angry_End' }] },
    '3|Motion[34]': { dead: true, sets: [9, 5], clips: [{ mats: ['XfB__m02_body_k'], clip: 'Angry_End' }], settled: true },
    // AILMENTS AND TIREDNESS (states-em043.md 2-3; Raven, 2026-09-21: "yes I would like the 'aliment effects'"). Their
    // effects come from the +0x28 pass while the state holds (0xa4518, 0xa41b8, 0xa3ef0), each on a countdown the shared
    // timer 0x7206c keeps: at or below 0 it fires, and the code sets the period again -- so a state starts with one at
    // once and then one every period frames. These motions also play outside their state (the breaks' and states'
    // notes list them: [2] a flinch, [3] / [6] a leg's trip, [13] the shock trap's hold, L0 Motion[15] actions (1, 0)
    // and (1, 0x11)); each is shown here in the state named.
    // TIRED (2.5): the idle while tired, L0 Motion[15] ((0, 2), 0xe74410). Drool c 1104 (cm200_006, joint 3) while tired,
    // not enraged, not asleep: timer +0x5c70, 48.0 (0xa42d0..0xa4334; rage zeroes it, 0xa42a4). A tired monster is never
    // enraged (the gauge will not ask for rage while tired, 0xbcd20; tiredness does not start while enraged, 0x76200):
    // rage shown off, body set 9.
    '0|Motion[15]': { rage: false, sets: [9], every: [['em043_00c', 1104], 48] },
    // ASLEEP (3.2): (10, 0x1d) L3 Motion[14] falls asleep (ailment bit 1 set at its start, 0xa2800), (10, 0x1e) L3
    // Motion[25] holds -- and the rest sleep holds L3 Motion[25] too (+0x522, 0xe74738). While asleep (0x81bb0(e, 0))
    // the +0x28 pass sets the eye flag every frame (0xae3c0..0xae3f0): eye set 5, closed, as in death; and Savage's rage
    // controller stops the eyes (u 31) with 0x329c40(h, 0) while either sleep test holds, the aura left running, and
    // requests them again after (0xe8058c..0xe8061c). In the hold (0x81bb0(e, 1): (10, 0x1e) or the rest flag): zzz,
    // c 1102 (cm200_002, joint 3), timer +0x5c60, 90.0 (0xa3e60..0xa3ee8). Falling asleep has no zzz.
    '3|Motion[14]': { sets: [5], eyesOff: ['em043_05u', 31] },
    '3|Motion[25]': { sets: [5], eyesOff: ['em043_05u', 31], every: [['em043_00c', 1102], 90] },
    // PARALYSIS (3.2): (10, 0x1f) holds L3 Motion[13] (script 0x17c08e0). c 1101 (cm200_001, joint 1) while ailment bit
    // 4 is set: timer +0x5c60, 60.0 (0xa4554..0xa45c8).
    '3|Motion[13]': { every: [['em043_00c', 1101], 60] },
    // SHOCK TRAP (3.2): (10, 0x6e) plays L3 Motion[2] then holds L3 Motion[13] (0x17c0b50). c 1105 (cm200_001, joint 1)
    // while the action is (10, 0x6e) (0x80254): timer e+0xb7c8, 42.0 (0xa4854..0xa48bc). L3 Motion[13] is shown as
    // paralysis (above).
    '3|Motion[2]': { every: [['em043_00c', 1105], 42] },
    // STUN (3.2): (10, 0x20) plays L3 Motion[3] then holds L3 Motion[6] (0x17c0a00). c 1103 (cm200_003, joint 3) is
    // requested once into one handle while ailment bit 0x10 is set (0xa3f58..0xa4054) and stopped with 0x329c40(h, 0)
    // when it clears (0x6f124), at the recovery L3 Motion[7] (bit 0x10 cleared by changeAction, 0x80964).
    '3|Motion[3]': { hold: ['em043_00c', 1103] },
    '3|Motion[6]': { hold: ['em043_00c', 1103] },
  },
  em037_00: {
    // HEAD BREAK (breaks-em037.md): its 2nd depletion raises part 0 to level 2 (dtp row 0) -- the only head row -- and the
    // reaction (10, 7) plays L3 Motion[2] from frame 0 (0xe56f5c, script 0x17bcef0); the part driver shows set 5 calm,
    // 7 enraged (0xe488b4); u 1001 (id 8: cm202_060 on joint 2, 0xa442c). Its 1st depletion plays the same motion and
    // changes nothing. L3 Motion[2] is also the shock trap's start (10, 0x6e): shown here as the head break.
    '3|Motion[2]':  { levels: N_HEAD, fire: [null, ['em037_00u', 1001]] },
    // WING BREAKS (dtt parts 2 / 6, capsule joints 61 / 71): the 1st depletion is the break (rows 1 / 2) -- wing A set 8
    // -> 9, u 1010 (id 17, joint 7), reaction L3 Motion[10] -> [11] (held 240) -> [12]; wing B set 10 -> 11, u 1030 (id
    // 37, joint 11), L3 Motion[7] -> [8] (held 120) -> [9] (0xe48904, 0xe48954; scripts 0x17bd130 / 0x17bd158). The
    // held and closing clips keep the broken wing. These six clips are also the stun's (10, 0x20): shown as the breaks.
    '3|Motion[10]': { levels: [[8], [9]], fire: [null, ['em037_00u', 1010]] },
    '3|Motion[11]': { levels: [[8], [9]], fire: [null, null] },
    '3|Motion[12]': { levels: [[8], [9]], fire: [null, null] },
    '3|Motion[7]':  { levels: [[10], [11]], fire: [null, ['em037_00u', 1030]] },
    '3|Motion[8]':  { levels: [[10], [11]], fire: [null, null] },
    '3|Motion[9]':  { levels: [[10], [11]], fire: [null, null] },
    // TAIL BREAK: part 3's 2nd depletion, level 2 (row 3): set 12 -> 13 calm, 15 -> 16 enraged; u 1016 (id 23: joint 141);
    // reaction L3 Motion[1] from frame 0 (0x17bcf00). A severed tail stays severed (and fires nothing).
    '3|Motion[1]':  { levels: N_TAIL, fire: [null, ['em037_00u', 1016], null] },
    // TAIL SEVER: part 3's second counter (300) runs out with the tail at level 3 and Nargacuga enraged or tired ->
    // (10, 0x72): the start hook severs (0xc2274: u 900 on joint 143), then L3 Motion[4] from frame 0 -> L3 Motion[5];
    // set 14 calm / 17 enraged. The cut tail drops from joint 143 (render/tail-option.js, the same option code as
    // Savage's). The script's 180-degree turn over L3 Motion[4] f52..122 (op 0xa) is not in the clip and is not shown.
    '3|Motion[4]':  { levels: N_TAIL, at: 2, fire: [null, null, ['em037_00u', 900]], drops: true },
    '3|Motion[5]':  { levels: N_TAIL, at: 2, fire: [null, null, null] },
    // RAGE: the forced transition's command group 6 starts with a hop and then the roar L0 Motion[26] (1, 4); rage is on
    // from the hop's frame 0 -- which hop comes first is NOT READ -- so the roar is shown enraged throughout: the head
    // and tail in their enraged sets at the user's levels, and the trails (u 1120 / 1121, RAGE_BY_LEVEL) requested.
    // No material changes (the class makes no material call). Its motion rate x1.2 is not shown (the viewer plays 1.0).
    '0|Motion[26]': { rage: true, tables: [N_HEAD, N_TAIL] },
    // THE TAIL'S SPIKES WHILE CALM: actions (7, 2), (7, 0x6c) and (7, 0x6f) -- L2 Motion[4], [5], [21], [6] -- show the tail
    // in its enraged set (15 / 16) calm as well (0xe486f4); (7, 0xf9) / (7, 0xfa) play the same code without the spikes.
    '2|Motion[4]':  { tables: [N_TAIL], show: 'enraged' },
    '2|Motion[5]':  { tables: [N_TAIL], show: 'enraged' },
    '2|Motion[21]': { tables: [N_TAIL], show: 'enraged' },
    '2|Motion[6]':  { tables: [N_TAIL], show: 'enraged' },
    // TIRED: the idle (0, 2) is L0 Motion[30]; drool c 1104 every 48 while not enraged -- tired and rage exclude each other.
    '0|Motion[30]': { rage: false, tables: [N_HEAD, N_TAIL], every: [['em037_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L0 Motion[22] -> (10, 0x1e) L0 Motion[20] (hold) -> (10, 0x44) L0 Motion[21]; eyes set 2 from
    // L0 Motion[22] f0; zzz c 1102 every 90 in the hold. The rage trails keep running (the class holds nothing off).
    '0|Motion[22]': { sets: [2] },
    '0|Motion[20]': { sets: [2], every: [['em037_00c', 1102], 90] },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60, first at once (L3 Motion[13] is also the shock trap's hold).
    '3|Motion[13]': { every: [['em037_00c', 1101], 60] },
    // DEATH: L3 Motion[6], the one clip nothing but death plays (every status-11 number but 1, 7, 0x10, 0x12): rage cleared
    // at the setAction -- the trails stopped, the head and tail calm at the user's levels --, eye set 2 for good. The
    // class has no death branch of its own (no material clip).
    '3|Motion[6]':  { dead: true, tables: [N_HEAD, N_TAIL], sets: [2] },
  },
  em001_00: rathLine('em001_00u'),
  // GOLD RATHIAN: the same class (variant 2; its branches there are hit tables and tune values, states-em001.md 8), lists
  // 0..3 and set layout -- Rathian's table from its own u.pel. Its own list 4 carries no state motion.
  em001_02: rathLine('em001_02u'),
  // DREADQUEEN RATHIAN (variant 4): the same from her own u.pel, with a deviant's tail (deviantTail below) -- hers breaks
  // before it can be cut. Her list 4's own state motion, the air rage entry (4, 0x16) L4 Motion[7], is not listed: see RAGE.
  em001_04: deviantTail(rathLine('em001_04u'), 'em001_04u'),
  // RATHALOS (em002_00): the same class as em 2 variant 0. His lists 0..3 are Rathian's very files (clip for clip), his
  // .mpm carries the line's set numbers with his own groups -- 9 / 10 back is 10 / 11 where Rathian's is 10 / 102 -- and
  // his tail has the two states hers does: 11 intact, 12 severed (no break row, and no u 1036 in his u.pel). The ailment
  // records are his own em002_00c, the breaks, sever and rage puff his em002_00u. What is his own is the air rage entry
  // (em2Air): command group 6 issues (4, 0xb) for em 2 whatever the variant.
  em002_00: em2Air(rathLine('em002_00u', 'em002_00c')),
  // SILVER RATHALOS (em002_02): em 2 variant 2 -- Rathalos's table from his own em002_02u, the same c.pel
  // (em002_00c), Rathian's lists 0..3 and the same set layout, tail included (11 intact, 12 severed; no u 1036).
  // His variant's branches in the class are hit tables, tune values and the (10, 0xa7) hold (states-em002_04.md 5.3),
  // none of which changes what a motion shows.
  em002_02: em2Air(rathLine('em002_02u', 'em002_00c')),
  // DREADKING RATHALOS (em002_04): the same class as em 2 variant 4 (states-em002_04.md). Rathian's lists 0..3 -- her very
  // files -- so every state clip above is his; his ailment records come from Rathalos's em002_00c, whose state records are
  // byte for byte Rathian's; his breaks, sever and rage puff from em002_04u (the same keys, the back on joint 2 and the
  // wings offset (0, 0, 120), which is in the records, not here). His tail is Dreadqueen's three states, from the same
  // variant-4 branch of the driver (0xcf29e4..0xcf2aa4) and the same vtable +0x234 gate. What is his own:
  //   RAGE IN THE AIR. Command group 6's first action is (4, 0xb) for em 2 -- L1 Motion[3] from frame 0 (0xcfbaa8), the
  //   clip the plain air roar (4, 0xa) also plays, as L0 Motion[4] on the ground is also the plain roar: both are shown
  //   as the entry (2.2). The em 1 monsters never take (4, 0xb): Rathian lands first, Gold and Dreadqueen play L4
  //   Motion[7], and neither clip is theirs alone (see RAGE above).
  //   L9 Motion[20] / [21], the variant-4 air reaction to a flash (10, 0x53), change no state: the clip PSL plays their
  //   effects and the INFERRED blind timer they cut is not shown (5.2). L4 Motion[31] -> [32] follow the ground roar as
  //   the attack (7, 0x29), with rage already on from L0 Motion[4].
  em002_04: dreadking(),
};

// Rathian's table with a DEVIANT'S TAIL: three states where hers has two. The driver's variant-4 branch (0xcf2a14..
// 0xcf2a98 for em 1, 0xcf29e4..0xcf2aa4 for em 2) shows set 11 intact, 12 once part 7's level reaches the fifth dtp row
// (part 7, level 2) and 13 severed -- where Rathian's 11 / 12 are intact / severed. The break fires u id 7 x 5 + 2 + 6 =
// 43 -> 1036 (0xa442c, 0x159c7fc[43]: cm202_060, joint 145) and plays the tail's depletion reaction, L3 Motion[2]
// (0x1794ad0: breaks-em001.md 3, the same table for variant 4), before the cycle's (10, 0x1b) play; vtable +0x234
// (0xd08bd4) lets the sever through only at that level (breaks-em001.md 4.1), so L3 Motion[15] cuts a broken tail.
function deviantTail(t, u){
  const c = t['3|Motion[2]'].cycle;
  const R_TAIL = { levels: [[11], [12]], fire: [null, [u, 1036]] };
  t['3|Motion[2]'] = { cycle: [c[0], c[1], c[2], R_TAIL, c[3]] };
  t['3|Motion[15]'] = { levels: [[11], [12], [13]], at: 2, fire: [null, null, [u, 900]], drops: true };
  return t;
}

// THE em 2 AIR RAGE ENTRY: command group 6's first action in the air is (4, 0xb) for em 2 -- L1 Motion[3] from frame 0
// (0xcfbaa8; states-em002_04.md 2.2), whatever the variant, since the op-0x91 switch reads the em byte alone. It is the
// clip the plain air roar (4, 0xa) also plays, as L0 Motion[4] on the ground is also the plain roar: both are shown as
// the entry. The em 1 monsters never take (4, 0xb) -- Rathian lands first, Gold and Dreadqueen play L4 Motion[7], and
// neither clip is theirs alone (see RAGE above).
function em2Air(t){
  t['1|Motion[3]'] = { rage: true };
  return t;
}

// Dreadking's table: the Rath line's from em002_04u and Rathalos's c.pel, a deviant's tail, and the air rage entry.
function dreadking(){
  const t = em2Air(deviantTail(rathLine('em002_04u', 'em002_00c'), 'em002_04u'));
  return t;
}

// RAGE RECORDS BY A PART'S LEVEL: Nargacuga's class requests its rage trails itself (+0x1d0 0xe49ec0, table 0x169dc88) --
// u 1120 (both rows) while the head is below break level 2, u 1121 (one row) from it; the break swaps them while
// enraged (0xe488b4 / 0xe48828). levels: the part's sets per level (calm); records: the record shown at each level.
// THE .mpm SETS A MONSTER HOLDS WHILE ENRAGED. A motion's own `sets` last exactly as long as that motion, which is
// right for a break or a shut eye, and WRONG for a rage swap: the part pass re-applies those from isEnraged on every
// frame the monster is angry, so they outlive the rage entry clip and every motion after it. Barioth is the first
// monster we have wired that does this (states-em042_00.md 2.1): his +0x210 part pass reads isEnraged and applies eye
// set 3 -> 4 (group 8 off, 9 on) and body set 6 -> 7 (group 4 off, 5 on), holding both until the flag clears -- and
// death clears the flag, so the calm pair comes back there for nothing.
// calm / enraged: the set numbers applied in each state, before any motion's own sets, which go over them.
export const RAGE_PARTS = {
  em042_00: { calm: [3, 6], enraged: [4, 7] },
};

export const RAGE_BY_LEVEL = {
  em037_00: { levels: N_HEAD.calm, records: [['em037_00u', 1120], ['em037_00u', 1121]] },
};

// THE JOINTS THAT SWELL, as the game swells them (E:\offline\decode\notes\states-em043_00.md 2.2, read and ROM-run by
// the Deviljho decode agent). Deviljho's class scales two joints through vtable +0x2a0 -> 0xe7eda8, which runs in the
// +0x24 pass between the motion advance and the joint build -- so it is part of the pose the frame is drawn with, and
// it lands on the joint record's own scale field (+0x70, written by 0x94a834). Both joints carry skin weights in the
// model (421 vertices on gid 200, 356 on gid 201), so this is a visible swell.
//
// Each axis walks toward its target by its own rate a frame (the ROM's step 1.0 = [e+0x1c]), the growing side floored
// at 1 and the shrinking side capped at the target, so either way takes 12 frames (0xe7edf0..0xe7eee4; the literals
// 0.0416667 / 0.5 / 0.166667 / 0.458333 at 0xe7ef48). z is 1 from the spawn and never ramps.
//
// WHO GROWS: the ROM's gate is `r1 = (variant == 5) ? (enraged ? 2 : 1) : isEnraged`, then `r1 != 0 and not dead`
// (0xe7eddc). So Deviljho (variant 0) swells while ENRAGED, and Savage (variant 5) -- whose r1 is never 0 -- is
// swollen ALL HIS LIFE and only shrinks at death.
export const JOINT_SCALE = {
  // the rates are the ROM's own literals at 0xe7ef48..0xe7ef5c, not the fractions they are near: accumulated in
  // float32 they carry the value past the target on the 12th frame, where the clamp holds it
  em043_00: { while: 'rage',  joints: [{ gid: 200, to: [1.5, 7.0], rate: [0.0416667, 0.5] },
                                       { gid: 201, to: [3.0, 6.5], rate: [0.166667, 0.458333] }] },
  em043_05: { while: 'alive', joints: [{ gid: 200, to: [1.5, 7.0], rate: [0.0416667, 0.5] },
                                       { gid: 201, to: [3.0, 6.5], rate: [0.166667, 0.458333] }] },
};

// The ramp itself, one per mounted monster: step() moves each joint's x and y toward the target (grown) or back to 1,
// and returns [[gid, x, y, z], ...] for the caller to write onto the bones.
export class JointScale {
  constructor(spec){
    this.spec = spec || null;
    this.at = this.spec ? this.spec.joints.map(() => [1, 1]) : [];
  }
  step(grown, frames = 1){
    const out = [];
    if (!this.spec) return out;
    this.spec.joints.forEach((j, i) => {
      const v = this.at[i];
      for (let k = 0; k < 2; k++){
        const target = grown ? j.to[k] : 1;
        const d = Math.fround(j.rate[k] * frames);
        // the ROM accumulates in float32 (vadd.f32 / vsub.f32) and clamps at the target either way
        v[k] = v[k] < target ? Math.min(target, Math.fround(v[k] + d)) : Math.max(target, Math.fround(v[k] - d));
      }
      out.push([j.gid, v[0], v[1], 1]);
    });
    return out;
  }
}

// THE SHARED RAGE PUFF (states-em001.md 2.3). 0xa41b8, in every +0x28 pass: alive, not in the sleep hold or the rest
// (0x81bb0(e, 1)), vtable +0x2d8 == 1 and enraged, it counts P+0x5c6c down with 0x7206c (at or below 0 it fires at once;
// else 1 less, firing when that reaches 0) and each time it fires sets 30.0 again and -- when the class leaves e+0xb7d2 at
// the base constructor's 1 (0xacbd0: 0xacc4c), as Rathian's does -- requests u id 0 when the class's vtable +0x2a4 returns
// 1, else u id 1 (0xa425c..0xa42a0), through the base u table (0x159c7fc: 1120 / 1121). Calm it leaves the countdown
// where it stopped, unless tired: then it zeroes it (0xa4338..0xa434c). The enemy's reset zeroes it (0xb8b98: 0xba0e8),
// so the first rage's first puff comes at once. Each is a one-shot (end mode 0) nothing stops. period: frames; joint:
// the joint number whose rotation the pick reads; records: [id 0, id 1]; pick(q): the class's +0x2a4 on that joint's
// local quaternion [x, y, z, w].
// WHICH SURFACE A MOTION ASSUMES (E:\offline\decode\notes\posture-em003_00.md, read and ROM-run by the posture decode
// agent, 2026-09-23). The game keeps a posture at P+0x1ba and it is not cosmetic: it picks the surface the monster is
// pinned to, and a part break taken in one of them is not the ground reaction at all. THE ROM NAMES THE POSTURES
// ITSELF -- the setter 0xbc7f4 indexes its offset out of the monster's dtbase.dtb by posture group, and that file's
// property list (rodata 0x154ff44) reads PushHitStandOfs / PushHitFlyOfs / PushHitKabeOfs / FlyOfs / SwimTopOfs /
// SwimBottomOfs / TenjoOfs / MoguriBaseOfs. Kabe is wall, tenjo is ceiling, moguri is burrowing.
//   0 ground, 1 airborne, 5 WALL, 6 CEILING. A clip listed as both 5 and 6 is one animation the engine plays against
//   either surface; the viewer shows both planes for it.
// The viewer has only a floor to stand on, so a wall or ceiling motion plays in mid-air until its plane is shown --
// which is what this table is for (index.html's box), and what render/shells.js's stage stand-in answers against.
export const CLIP_POSTURE = {
  // KHEZU: built by a phase-aware dataflow over uEm003_00, since the handler re-runs every frame and switches on
  // P+0x1a1 -- a posture set in phase 0 is still in force when a later phase plays its motion. Only the motions that
  // leave the ground are listed; everything else is posture 0. 112 of his 132 clips are settled (82 from the class,
  // 23 from its scripts, 7 measured); the 20 that are not are named in the note, eight of them provably never played.
  //   FIVE OF THESE WERE MISSING AT FIRST and it showed -- Raven, 2026-09-23: "we have some wall animations that
  //   don't add the wall". 2|Motion[43] / [59] / [60] / [61] / [66] are all [5, 6], and the dataflow had been
  //   carrying the POSTURE across basic blocks while re-seeding the MOTION at each one: his wall and ceiling attack
  //   handlers end in a 19-way switch on the clip currently playing that plays them all through one shared tail, so
  //   only the fall-through arm was recorded.
  em003_00: {
    '0|Motion[26]': 5, '0|Motion[50]': 1, '0|Motion[53]': 6, '0|Motion[54]': 6, '0|Motion[55]': 6,
    '0|Motion[56]': 6,
    '1|Motion[1]': 1, '1|Motion[2]': 1, '1|Motion[6]': 1,
    '2|Motion[7]': 6, '2|Motion[8]': 6, '2|Motion[9]': 6, '2|Motion[14]': 1, '2|Motion[28]': [5, 6],
    '2|Motion[29]': 6, '2|Motion[33]': 5, '2|Motion[36]': 5, '2|Motion[39]': 1, '2|Motion[40]': 1,
    '2|Motion[43]': [5, 6], '2|Motion[48]': 6, '2|Motion[50]': 6, '2|Motion[51]': 5, '2|Motion[55]': 6,
    '2|Motion[58]': 1, '2|Motion[59]': [5, 6], '2|Motion[60]': [5, 6], '2|Motion[61]': [5, 6], '2|Motion[63]': 1,
    '2|Motion[66]': [5, 6], '2|Motion[67]': [5, 6], '2|Motion[69]': 6, '2|Motion[71]': 6, '2|Motion[72]': 6,
    '2|Motion[73]': 6, '2|Motion[75]': 6,
    '3|Motion[10]': 1, '3|Motion[36]': 6,
    '5|Motion[1]': [5, 6], '5|Motion[4]': 6, '5|Motion[5]': [5, 6], '5|Motion[8]': 1, '5|Motion[36]': [5, 6],
    '5|Motion[37]': [5, 6], '5|Motion[38]': 5,
  },
  // SHOGUN CEANATAUR: he uses the ceiling, and he JUMPS ONTO IT rather than climbing -- which is why he has posture 6
  // and no posture 5 at all. Raven, 2026-09-23: "He uses the ceiling, but jumps directly onto it". His attach
  // (0xdc7578) crouches and launches on L5 Motion[2], waits on the shared ceiling gate 0xbf224 for 620.0 of
  // clearance, then takes posture 6, plays L5 Motion[7] and SNAPS both his position and his pinned plane to the
  // ceiling. That clearance is a literal at the call site, not a .dtb field (620.0 his, 580.0 Khezu's own jump), and
  // TenjoOfs -- which reads 0 for him -- has exactly ONE caller in the whole ROM: Khezu's wall-to-ceiling REACH
  // decision. A monster with no wall posture never makes that decision, so his 0 means "not applicable".
  //   POSTURE 4 IS HIS BURROW (L2 Motion[15] / [16] drop to -774 and back; the .dtb calls that slot MoguriBaseOfs).
  //   The viewer has no plane for it and shows none.
  em020_00: {
    '0|Motion[19]': 4, '0|Motion[20]': 4,
    '2|Motion[15]': 4, '2|Motion[16]': 4, '2|Motion[27]': 6, '2|Motion[76]': 6,
    '3|Motion[13]': 1,
    '5|Motion[1]': 6, '5|Motion[4]': 6, '5|Motion[7]': 6, '5|Motion[8]': 6,
  },
};
// HOW HIGH THE CEILING IS, in GAME units above the monster's floor. THIS IS A VIEWER CHOICE, and the ROM says so:
// the engine pins a ceiling monster's origin exactly ON the surface (0xbf284: P+0x44 = P+0x5b4, offset zero) and the
// surface's own height is the stage's, not the monster's. TenjoOfs + 30 = 430 is the REACH the monster can attach
// across (0xd13884), never a placement -- an earlier version of this file put the plane 430 above the FLOOR, which
// is the wrong reference twice over and drew the plane through Khezu's chest.
// So the number here is measured from his own animation instead: 838.2 is the highest point any clip of his authors
// (L3 Motion[36]), the top of a climb, and his other transitions sit at 369..578. A ceiling there is one his own
// motions reach. Raven, 2026-09-23: "As for height, we see how high Khezu or Shogun can jump up" -- and Shogun
// cannot answer it (TenjoOfs 0, no posture 5 at all), so this is Khezu's measurement.
// THE CLIPS WHOSE POSTURE IS NOT READ, with the reason for each. A clip that leaves the ground and is in neither
// this nor CLIP_POSTURE is a GAP, and dev/posture-coverage.mjs fails on it: it measures every clip the monster
// carries out of the animation itself, so a wall or ceiling motion nobody decoded cannot pass unnoticed the way it
// could when the only check walked the table's own entries (Raven, 2026-09-24: "if we cannot tell which motions are
// wall or ceiling, then the soaks are not doing their job").
//   Khezu's twenty, from E:/offline/decode/notes/posture-em003_00.md 11.2. Eight of them the game never plays --
// each is the SECOND id handed to 0xb00b4 / 0xb0174, and his vtable +0x3d8 is the base no-op 0x6c180, so the id is
// discarded; they are in the viewer only because the .lmt carries them. The other twelve are played by something
// outside the class's setMotion sites and the 45 censused scripts, and what that is has not been found.
export const POSTURE_UNREAD = {
  em003_00: {
    '0|Motion[51]': 'never played: the discarded second id of 0|Motion[53] (0xd14e98)',
    '0|Motion[52]': 'never played: the discarded second id of 0|Motion[54] (0xd14fa4)',
    '2|Motion[34]': 'never played: the discarded second id of 2|Motion[33] (0xd19b10)',
    '2|Motion[35]': 'never played: the discarded second id of 2|Motion[33] (0xd19b4c)',
    '2|Motion[49]': 'never played: the discarded second id of 2|Motion[50] (0xd1d430)',
    '2|Motion[54]': 'never played: the discarded second id of 2|Motion[55] (0xd14ccc / 0xd1d24c)',
    '2|Motion[68]': 'never played: the discarded second id of 2|Motion[69] (0xd1d784)',
    '2|Motion[70]': 'never played: the discarded second id of 2|Motion[71] (0xd15308)',
    '2|Motion[6]':  'leaves the surface for ground height; suspected 5 or 6 at its start, not read',
    '2|Motion[53]': 'ends flat against a vertical face; tested at 0xd18720 / 0xd188d4 inside the posture-5 fn 0xd18608, never set',
    '2|Motion[57]': 'tested at 0xd18738 / 0xd188ec in the same posture-5 fn, never set',
    '2|Motion[62]': 'tested at 0xd1872c / 0xd188e0 in the same posture-5 fn, never set',
    '2|Motion[45]': 'sideways, the shape of the posture-6 climb set; no reference in uEm003_00 or the 45 scripts',
    '2|Motion[46]': 'ditto, the high half of the M46 / M47 pair',
    '2|Motion[47]': 'ditto, the low half',
    '5|Motion[6]':  'root pose numerically identical to 5|Motion[1]_loop, which is [5, 6]; nothing plays it',
    '5|Motion[7]':  'ditto',
    '5|Motion[39]': 'ditto',
    '5|Motion[40]': 'ditto',
    '3|Motion[22]': 'root on the floor between 3|M21 and the pitfall set; no censused script plays it, ground is the safe guess',
    // FOUND BY dev/posture-coverage.mjs, not by the hand pass: three clips whose root signature matches a posture
    // the table already places. The first two START at a surface stand-off and END at ground height -- the shape
    // 2|Motion[6] has, a LEAVE-THE-SURFACE transition, which is a posture that CHANGES during the clip and which
    // one entry cannot express. Each is set from three sites in the class (0xd17e70 / 0xd18144 / 0xd1bc7c and
    // 0xd0f91c / 0xd19ed8 / 0xd1bd6c), each right after a write to the phase byte P+0x1a1, so settling them needs
    // the same phase-aware dataflow the table was built with -- not done.
    '2|Motion[13]': 'starts at 166.6, the posture-6 signature of 2|Motion[29], and ends at 300.5, ground height: a leave-the-surface transition, not read',
    '2|Motion[38]': 'starts at 166.6 and ends at 300.5: the same transition shape, not read',
    'Special|Motion 28': 'root 178.9, the cling stand-off 2|M28 / 2|M33 / 2|M36 share; the Special list is not one the class names, not read',
  },
};

export const CEILING_ABOVE_GAME = 838;
export const postureOf = (monId, list, clip) => {
  const t = CLIP_POSTURE[monId];
  const p = t && t[list + '|' + clip];
  return p == null ? 0 : p;
};

export const RAGE_PUFF = {
  // BARIOTH: vtable +0x2a4 is the base stub 0x6bf64 again, so 0xa425c turns its 0 into id 1 and the request is
  // always u 1121; key 1120 is never asked for. His two records are BYTE-IDENTICAL (both cm200_007 on joint 3, pos
  // (0, -20, 60), rot 0, scale 1, mode 1, subMode 0, end 0, axisMask 3), so the difference could not show anyway.
  em042_00: { period: 30, joint: 3, records: [['em042_00u', 1120], ['em042_00u', 1121]], pick: () => 0 },
  // BASARIOS: the same shape again -- vtable +0x2a4 is the base stub, so 0xa425c turns the 0 into id 1 and the
  // request is always u 1121. His two records are NOT identical, unlike Khezu's and Deviljho's (1120 is scale 1 at
  // (0, -40, 30), 1121 scale 0.6 at (0, -40, 35)), but only 1121 is ever reached, so the difference never shows.
  em004_00: { period: 30, joint: 4, records: [['em004_00u', 1120], ['em004_00u', 1121]], pick: () => 0 },
  // KHEZU: the same shape as Deviljho's -- vtable +0x2a4 is the base stub 0x6bf64 (`mov r0,#0; bx lr`), so 0xa425c
  // turns the 0 into id 1 and the request is always u 1121; key 1120 is never asked for. His two records are
  // byte-identical but for the key number (em003_00_012, joint 2, offset (0, -5, 75), scale 1), so nothing is read
  // from a joint and the pick is constant (states-em003_00.md 4.3).
  em003_00: { period: 30, joint: 2, records: [['em003_00u', 1120], ['em003_00u', 1121]], pick: () => 0 },
  // DEVILJHO: he runs the shared puff -- the class clears e+0xb7d2 only for variant 5 (0xe72b18), so his stays at the
  // base ctor's 1 -- and its pick is the BASE STUB: vtable +0x2a4 is not overridden, 0x6bf64 returns 0, and 0xa425c
  // turns a non-1 return into id 1, so the request is always u 1121 (0x159c7fc[1]). Key 1120 is never asked for. The
  // two records are byte-identical but for the key (em043_00_008, joint 3, (0, -20, 110)), so nothing is read from a
  // joint: the pick is constant (states-em043_00.md 5).
  em043_00: { period: 30, joint: 3, records: [['em043_00u', 1120], ['em043_00u', 1121]], pick: () => 0 },
  em001_00: { period: 30, joint: 4, records: [['em001_00u', 1120], ['em001_00u', 1121]], pick: rathianPuffPick },
  // Gold Rathian: the same class and pick (P+0x5d04 = 4 from the shared setup 0xcecd94), its own records
  em001_02: { period: 30, joint: 4, records: [['em001_02u', 1120], ['em001_02u', 1121]], pick: rathianPuffPick },
  em001_04: { period: 30, joint: 4, records: [['em001_04u', 1120], ['em001_04u', 1121]], pick: rathianPuffPick },   // Dreadqueen
  // Dreadking: the same shared puff and the same pick on joint 4 -- run on em002_04's own model and lists, 0xd08afc gives
  // puff-pick-em001.md's table for L0 Motion[4] frame for frame, and for L1 Motion[3] (his air rage entry) u 1120 over
  // f0-6, f22-30, f79-216, f240-262, f281-284 and u 1121 between (states-em002_04.md 2.3)
  // Rathalos: the same shared puff and the same pick on joint 4, his own records
  em002_00: { period: 30, joint: 4, records: [['em002_00u', 1120], ['em002_00u', 1121]], pick: rathianPuffPick },
  em002_02: { period: 30, joint: 4, records: [['em002_02u', 1120], ['em002_02u', 1121]], pick: rathianPuffPick },   // Silver
  em002_04: { period: 30, joint: 4, records: [['em002_04u', 1120], ['em002_04u', 1121]], pick: rathianPuffPick },
};

// THE TAIL AS THE SHELLS READ IT (shells.js: Dreadqueen's poison, 0xd09b84(e, 0x10)): part 7's break level (byte P+0x3bc +
// 12 x 7: input.breakLevel7) and the sever bit (P+0x3b4 & 1: input.tailSevered), read here from the parts SHOWN -- the
// break level at the break row's own level while its broken part is drawn (Dreadqueen: set 12 draws part 12, dtp row 4
// level 2), severed while the stump is (the Rath line's severed set draws part 8).
export const SHELL_TAIL = {
  em001_00: { severed: 8 }, em001_02: { severed: 8 },
  em001_04: { severed: 8, broken: 12, level: 2 },
  // Dreadking: the same poison path (his shell data carries the break row), his own .mpm -- set 12 draws part 13 broken,
  // set 13 part 8 severed (states-em002_04.md 3.2), where Dreadqueen's draw 12 and 8
  em002_04: { severed: 8, broken: 13, level: 2 },
};
export function shellTailInput(monId, drawn){
  const t = SHELL_TAIL[monId];
  if (!t || !drawn) return {};
  return { breakLevel7: t.broken != null && drawn.get(t.broken) === true ? t.level : 0, tailSevered: drawn.get(t.severed) === true };
}

// uEm001_00's vtable +0x2a4 = 0xd08afc. v is row 2 of the matrix vtable +0xd8 (0x539e60) builds from joint 4's record --
// its quaternion at +0x60, the motion's -- which 0xc0d40 keeps at P+0x5d10 each pass just before 0xa41b8 reads it
// (0xae75c, 0xae78c). a = atan2f(-v.y, sqrtf(v.z^2 + v.x^2)) as a u16 angle (x 10430.378, + 0.5, truncated,
// 0xd08b54..0xd08b6c); it returns 0 when that angle is at or below -4552 (a <= -25.0076 degrees: joint 4's third axis
// more than 25 degrees above its parent's xz plane), 1 otherwise. Float32 in the ROM's order (vmla: product rounded, then
// the sum). Run under the emulator on the real .mod and .lmt (E:\offline\decode\notes\puff-pick-em001.md): +0x60 is the
// joint's rotation relative to joint 3 as the joint pass 0x953ad8 (and the motion blend 0x94df88) writes it -- the
// quaternion the viewer's bone for joint 4 carries. At rest the axis points 44-49 degrees up, so u 1121 is the everyday
// puff (every frame of L0 Motion[1]) and u 1120 comes while the jaw swings below 25 degrees (L0 Motion[4] f18-81,
// 109-224, 250-276). The viewer's clips run one frame late (clip time t shows motion frame 60t - 1), so its picks flip a
// frame after the ROM's -- the pose files' offset, on the task board, not corrected here.
export function rathianPuffPick(q){
  if (!q) return 1;
  const f = Math.fround;
  const x = f(q[0]), y = f(q[1]), z = f(q[2]), w = f(q[3]);
  const z2 = f(z + z), y2 = f(y + y), x2 = f(x + x);                // 0x539ea8 / 0x539eac / 0x539ee4
  const vx = f(f(x * z2) + f(y2 * w));                               // +0x20 = s7 + s10 (0x539f1c)
  const vy = f(f(y * z2) - f(x2 * w));                               // +0x24 = s2 - s6 (0x539f0c)
  const vz = f(1 - f(f(x * x2) + f(y * y2)));                        // +0x28 = 1 - (s0 + s12) (0x539f04, 0x539f14)
  const h = f(Math.sqrt(f(f(vz * vz) + f(vx * vx))));                // 0xd08b20..0xd08b28
  const a = f(Math.atan2(f(-vy), h));                                 // 0x13ecba8
  const u = Math.trunc(f(0.5 + f(a * f(10430.378))));                // vmla, vcvt.s32 (towards zero)
  return ((0xffff8000 + (u & 0xffff)) >>> 0) > 0x6e38 ? 1 : 0;       // uxtah, cmp 0x6e38, movwhi
}

// THE LEVEL THE USER'S PARTS STAND AT, read from what they see: the highest level one of whose own parts -- drawn at
// that level, not at the one below -- is drawn. Read from the parts rather than the sets because the Parts panel may
// reach a level through a set the ROM does not use there: calm, its Face row's Broken is set 6 (part 5 alone,
// Deviljho's calm set), where Savage's driver always applies set 11 (parts 5 and 6, 0xe80cf4). table: the monster's
// .mpm sets; drawn: part -> drawn, the user's.
function userLevel(levels, table, drawn){
  if (!table || !drawn) return 0;
  const at = levels.map(sets => { const m = new Map(); for (const s of sets) for (const [p, v] of table[s] || []) m.set(p, v); return m; });
  let lv = 0;
  for (let k = 1; k < at.length; k++){
    const own = [...at[k]].filter(([p, v]) => v && at[k - 1].get(p) === false).map(([p]) => p);
    if (own.some(p => drawn.get(p) === true)) lv = k;
  }
  return lv;
}

export class MotionStates {
  constructor(){ this.cur = null; this.userDrawn = null; this.table = null; this.plays = new Map(); }
  // the records the motion holds on (hold) and the rage records it holds off (eyesOff), as 'pel|key' ids
  holds(){ return this.cur && this.cur.spec.hold ? [this.cur.spec.hold.join('|')] : []; }
  eyesOff(){ return this.cur && this.cur.spec.eyesOff ? [this.cur.spec.eyesOff.join('|')] : []; }
  // the rage puff's gates the motion shows (RAGE_PUFF): paused in the sleep hold, zeroed calm and tired
  puffOff(){ return !!(this.cur && this.cur.spec.puffOff); }
  tired(){ return !!(this.cur && this.cur.spec.tired); }
  dead(){ return !!(this.cur && this.cur.spec.dead); }

  // Once a frame, after the clip has been advanced. monId; list; clip: the motion's bare slot name (a _start/_loop pair
  // is one motion) or null; frame: its frame at 60 a second, counted over the whole slot; at: { loopStart, loopEnd,
  // loopSeg } -- where a _loop clip sits in its slot and ends (a _loop clip's wrap goes back to loopStart and is the
  // motion going on, not starting over; loopSeg: the clip is a _loop);
  // user: { rage } -- the user's own (their parts are what showParts last kept). Returns what the display has to follow:
  //   parts    the part sets shown changed (index.html re-applies the parts)
  //   rage     the rage shown changed (the materials' clock and the effects follow)
  //   entry    rage started over while it was already shown (a rage entry replayed): the effects and the materials'
  //            start clip run from this frame again
  //   fire     [[pel, key], ...] the effect records the game requests at this frame
  //   drop     the motion's frame 0 drops a cut tail (a sever: index.html stepCutTail flies it from here)
  //   holdOn / holdOff    [[pel, key], ...] event records to keep running from now / to stop now
  //   eyesOff / eyesOn    [[pel, key], ...] rage records to hold off from now / to let run again
  //   clips    the material clips shown changed (clips())
  //   settled  the motion began after its change's transitions were over: the materials' clock is to start settled
  // now: the wall clock the materials run on (seconds).
  step(monId, list, clip, frame, at, user, now = 0){
    const { loopStart = 0, loopEnd = 0, loopSeg = false } = at || {};
    let spec = (clip != null && MOTION_STATES[monId]) ? MOTION_STATES[monId][list + '|' + clip] || null : null;
    const key = spec ? monId + '|' + list + '|' + clip : null;
    const prev = this.cur;
    const rageBefore = this.rage(user.rage), setsBefore = this.setsKey(), clipsBefore = this.clipsKey();
    const holdsBefore = this.holds(), eyesBefore = this.eyesOff();
    // AFTER setsBefore, not before it. showParts needs the monster and the user's rage even with no motion spec
    // active, but taking the new rage first made setsKey() already reflect it, so `parts` never flipped and
    // index.html never re-applied them -- the monster kept the pair of the state it had just left.
    this.monId = monId; this.userRage = !!user.rage;
    const out = { parts: false, rage: false, entry: false, fire: [], clips: false, settled: false, drop: false,
                  holdOn: [], holdOff: [], eyesOff: [], eyesOn: [] };
    if (!spec) this.cur = null;
    else if (prev && prev.key === key && (frame >= prev.frame || loopSeg)){
      // the same motion, moving on -- across a _loop clip's wrap too: the countdowns run on the frames it advanced
      const d = frame >= prev.frame ? frame - prev.frame : Math.max(0, loopEnd - prev.frame) + Math.max(0, frame - loopStart);
      prev.frame = frame;
      for (const t of prev.timers){
        t.left -= d;
        if (t.left <= 0){ out.fire.push(t.rec); t.left = t.period; }     // 0x7206c at or below 0, then the period again
      }
    }
    else {
      // frame 0 of the motion: a new one, or the same one started over (a loop, a replay, the scrubber moved back)
      if (spec.cycle){                      // a motion several breaks play: this play shows the next of them
        const n = (this.plays.has(key) ? this.plays.get(key) : -1) + 1;
        this.plays.set(key, n);
        spec = spec.cycle[n % spec.cycle.length];
      }
      const c = { key, spec, frame, sets: null, rage: null, t0: now, timers: [] };
      // a { calm, enraged } table is read in the rage the motion shows: its own, else the user's
      const rageFor = spec.rage === true ? true : (spec.rage === false || spec.dead) ? false : !!user.rage;
      const pick = t => (t && !Array.isArray(t)) ? (rageFor ? t.enraged : t.calm) : t;
      if (spec.levels){
        const levels = pick(spec.levels);
        const lv = Math.max(spec.at || 1, userLevel(levels, this.table, this.userDrawn));
        c.sets = levels[lv];
        if (spec.fire[lv]) out.fire.push(spec.fire[lv]);
      }
      if (spec.rage){
        c.rage = true;
        c.sets = spec.sets ? spec.sets[1] : null;
        out.entry = rageBefore;             // already shown: it starts over here all the same
      }
      if (spec.dead){
        c.rage = false;
        c.sets = spec.sets;
        out.settled = !!spec.settled;
        out.clips = true;                   // death's clips run from this frame (again, on a loop)
      }
      if (spec.rage === false) c.rage = false;
      c.frame0 = frame;
      if (spec.drops) out.drop = true;
      if (!spec.levels && !spec.dead && spec.sets && spec.rage !== true) c.sets = spec.sets;
      // part groups shown at the user's level, enraged or calm as the motion shows rage (or `show: 'enraged'`)
      if (spec.tables){
        const shown = spec.show === 'enraged' || rageFor ? 'enraged' : 'calm';
        const extra = [];
        for (const t of spec.tables) extra.push(...t[shown][userLevel(t.calm, this.table, this.userDrawn)]);
        c.sets = extra.concat(c.sets || []);
      }
      if (spec.start) for (const rec of spec.start) out.fire.push(rec);
      // a countdown starts at 0, so its record comes at once (0x7206c), and the period follows
      if (spec.every){ out.fire.push(spec.every[0]); c.timers.push({ rec: spec.every[0], period: spec.every[1], left: spec.every[1] }); }
      this.cur = c;
    }
    const holdsAfter = this.holds(), eyesAfter = this.eyesOff();
    const ids = s => s.split('|').map((x, i) => i ? +x : x);
    for (const h of holdsAfter) if (!holdsBefore.includes(h)) out.holdOn.push(ids(h));
    for (const h of holdsBefore) if (!holdsAfter.includes(h)) out.holdOff.push(ids(h));
    for (const h of eyesAfter) if (!eyesBefore.includes(h)) out.eyesOff.push(ids(h));
    for (const h of eyesBefore) if (!eyesAfter.includes(h)) out.eyesOn.push(ids(h));
    out.rage = this.rage(user.rage) !== rageBefore;
    out.parts = this.setsKey() !== setsBefore;
    out.clips = out.clips || this.clipsKey() !== clipsBefore;
    return out;
  }

  // THE RAGE RECORDS HELD OFF for the parts shown (RAGE_BY_LEVEL): 'pel|key' of every record but the one for the level
  // the part stands at in `drawn` (the parts as drawn, the motion's sets over the user's)
  rageRecordsOff(monId, drawn){
    const r = RAGE_BY_LEVEL[monId];
    if (!r || !this.table || !drawn) return [];
    const lv = Math.min(userLevel(r.levels, this.table, drawn), r.records.length - 1);
    return r.records.filter((_, i) => i !== lv).map(x => x.join('|'));
  }

  // the rage the display shows: the motion's while it plays (on at a rage entry, off in death), else the user's
  rage(userRage){ const o = this.rageOverride(); return o === null ? !!userRage : o; }
  rageOverride(){ return this.cur && this.cur.rage !== null && this.cur.rage !== undefined ? this.cur.rage : null; }
  // the rage the parts are shown in is part of the key: with RAGE_PARTS the same motion draws differently
  // calm and enraged, and index.html only re-applies the parts when this changes
  setsKey(){ return (RAGE_PARTS[this.monId] ? (this.rage(this.userRage) ? 'R:' : 'C:') : '') +
                    (this.cur && this.cur.sets ? this.cur.sets.join(',') : ''); }
  clipsKey(){ return this.cur && this.cur.spec.clips ? this.cur.key + '@' + this.cur.t0 : ''; }
  // the material clips the motion shows, for render/monster.js stepMatAnim: [{ mats, clip, rest, t0 }], each played
  // from t0 on the materials' clock and held at its end; a settled one is at its end already
  clips(){
    const c = this.cur;
    if (!c || !c.spec.clips) return null;
    return c.spec.clips.map(x => ({ mats: x.mats, clip: x.clip, rest: null, t0: c.spec.settled ? -1e9 : c.t0 }));
  }

  // THE PARTS SHOWN: `drawn` is the user's (part -> drawn, as the Parts panel makes it), kept for the level a break
  // starts from; the motion's sets are laid over it -- every part they name takes the set's value, in the order the
  // part driver applies them (0x72c78, later wins). table: the monster's .mpm sets (monsters.json `groups`).
  showParts(drawn, table){
    this.userDrawn = new Map(drawn);
    this.table = table;
    // the sets rage holds go on FIRST, so a break or a shut eye the motion carries goes over them
    const rp = RAGE_PARTS[this.monId];
    if (rp) for (const s of (this.rage(this.userRage) ? rp.enraged : rp.calm))
      for (const [p, v] of (table && table[s]) || []) drawn.set(p, v);
    if (!this.cur || !this.cur.sets) return;
    for (const s of this.cur.sets) for (const [p, v] of (table && table[s]) || []) drawn.set(p, v);
  }
}
