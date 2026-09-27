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
// THE -DROME LINE (em014_00 Velocidrome, em015_00 Gendrome, em016_00 Iodrome, em034_00 Giadrome) --
// E:\offline\decode\notes\states-em014_00.md, read and ROM-run by the Velocidrome decode agent (2026-09-25).
// ONE FUNCTION, because the ROM has ONE class: a sweep of main.rodata finds 62 uEm* class strings and
// uEm015_00 / uEm016_00 / uEm034_00 are not among them -- `uEm014_00` IS all four -- and each sibling's arc
// carries em014_00_0/2/3.lmt by path, byte for byte (efx/family_census.py). The class's three em-number switches
// (the EMC pack call, Iodrome's attack remap, the Iodrome / Giadrome shell registration) touch no state visual at
// all, so every reaction below resolves to the same clip on all four and only the .pel the records come from
// differs. u: the monster's own u.pel, c: its c.pel.
//   RAGE CHANGES NOTHING ON THE MODEL. The part pass never reads isEnraged -- no mesh pair, no eye set, no joint
//   scaling, no material -- so there is no rage state to apply and none to revert. The shared puff is the whole
//   of what rage shows.
function dromeLine(u, c){
  return {
    // THE HEAD, and it is the only break: (10, 7) plays L3 Motion[15] whatever the part, state or direction.
    // LEVELS 1 AND 2 SHOW NOTHING -- durability 90 over three depletions, and the .dtp row is at LEVEL 3 -- where
    // set 2 becomes set 4 (group 102 off, 2 on) and u 1002 fires (cm202_060 on joint 2, offset (0, 25, 5), scale
    // 0.3). L3 Motion[15] is worked hard: it is ALSO the tune+0x44 status ((10, 0x1b), c 1109 once at frame 0) and
    // the shock trap's start ((10, 0x6e)). Two of the three have something to show, so they take turns on each
    // play, the Rath line's shape; the shock trap's start shows nothing of its own and is not in the rotation.
    '3|Motion[15]': { cycle: [{ levels: [[2], [2], [2], [4]], fire: [null, null, null, [u, 1002]] },
                              { start: [[c, 1109]] }] },
    // RAGE: the gauge (300) -> command group 6 stream 0 -> (1, 0x17), playing L0 Motion[9] from frame 0. Nothing
    // on the model changes with it, so the puff below is all of it.
    '0|Motion[9]':  { rage: true },
    // TIRED: the tired idle (0, 2) is L0 Motion[33]; drool c 1104 every 48 while not enraged (timer 4500), and,
    // calm and tired, the shared puff's countdown is zeroed.
    '0|Motion[33]': { rage: false, tired: true, every: [[c, 1104], 48] },
    // ASLEEP: (10, 0x1d) holds L3 Motion[17], (10, 0x1e) holds L0 Motion[19], then (10, 0x44) L3 Motion[14] gets
    // up. HIS EYES ARE A REAL MESH SWAP -- eye set 1 -> set 3, group 3 off and 1 on, the shut-eye mesh drawn --
    // while P+0x5d02 is up, and the hold carries the zzz c 1102 every 90 and pauses the puff. These two clips are
    // also CAPTURE's ((11, 0x10)), which reuses them; sleep is what they are shown as.
    '3|Motion[17]': { sets: [3] },
    '0|Motion[19]': { sets: [3], every: [[c, 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[16]; c 1101 every 60 (cm200_001 on joint 1 at scale 2), first at once.
    // L3 Motion[16] is also the SHOCK TRAP's hold (c 1105 every 42 at 1.5): shown as paralysis, as every monster
    // wired so far shows its shared hold.
    '3|Motion[16]': { every: [[c, 1101], 60] },
    // THE STUN: (10, 0x20) holds L3 Motion[20] -- ONE clip, with no left/right split, because the .dtb direction
    // mode at index 9 is 0 on all four where Barioth's and Diablos's are sided. One held handle of c 1103
    // (cm200_003 on joint 2, offset (0, -30, 30), scale 0.45), stopped when it clears.
    '3|Motion[20]': { hold: [c, 1103] },
    // DEATH: all four direction chains -- the .dtb mode-3 four-way split on where the killing hit came from --
    // converge on L3 Motion[18] -> L3 Motion[19], and every death number the table does not name takes direction
    // 4's. L3 Motion[24] is death in the pit ((11, 7) and (11, 0x12)); it is also the pit's ailment clip, and
    // death is what it shows. Death shows NOTHING of its own: the break set stays as the user has it, THE EYES
    // STAY OPEN (death does not raise P+0x5d02) and there is no rage pair to revert because there never was one.
    // L3 Motion[19] begins past the collapse, so it is settled.
    // THE LID IS DRAWN IN DEATH, corrected 2026-09-25. states-em042_00.md said P+0x5d02 is raised only
    // asleep or resting "and at no other time -- in particular not at death", and that negative came from
    // finding ONE of its SEVEN writers in the shared enemy code (0x6e714, 0x6f538, 0xae3d0, 0xaf068,
    // 0xb9de0, 0xba9d0, 0xbd598). 0xbd594 sets the flag and its timer at P+0x5d00, and 0x75c1c calls it
    // with -1 in the same straight-line block as the status-11 rage clear 0xba7b8 at 0x75b90. Three decodes
    // agree (Barioth re-read, Zinogre, Lagombi) and Raven had seen it on Savage. NOT READ: the `tst sb, #2`
    // guard at 0x75be0, so which death numbers skip it is open.
    '3|Motion[18]': { dead: true, sets: [3] },
    '3|Motion[19]': { dead: true, settled: true, sets: [3] },
    '3|Motion[24]': { dead: true, sets: [3] },
  };
}

// DAIMYO HERMITAUR (em019_00): his specs, because ONE reaction clip pair is played by both claws and by the
// tune+0x44 status (states-em019_00.md 3.3, 6). Each claw's only .dtp row is at LEVEL 2, so the first depletion
// of a claw changes nothing and fires nothing and level 1 below repeats level 0's set with `fire: null` -- the
// same shape Gravios's back and Barioth's head already use.
const D_CLAW_P  = { levels: [[1], [1], [2]], fire: [null, null, ['em019_00u', 1026]] };
const D_CLAW_M  = { levels: [[3], [3], [4]], fire: [null, null, ['em019_00u', 1031]] };
const D_EXHAUST = { start: [['em019_00c', 1109]] };

// NARGACUGA (em037_00): E:\offline\decode\notes\states-em037.md and breaks-em037.md (uEm037_00, vtable 0x17bc47c; its
// per-frame part driver 0xe486f4). The head and tail sets follow both the break level and rage: head intact 4 / 6,
// broken 5 / 7 (calm / enraged); tail intact 12 / 15, broken 13 / 16, severed 14 / 17. Eye set 2 (both lids) while
// the eye flag is up -- asleep, resting, dead (0xe4749c); set 3 is never applied.
// MALFESTIO's HEAD follows RAGE AS WELL AS ITS BREAK LEVEL (states-em079_00.md 2): the part pass re-reads both
// every frame, so his head set is a {calm, enraged} pair of ladders rather than one. Groups 20 and 21 are
// XfB_0__m00_eye -- enraged turns the GLOWING EYES on and the calm eye/face pair off -- and the broken head keeps
// its own half of each (calm 5 -> 6, enraged 7 -> 8). Level 1 shows nothing at all: em079_00u has no key 1000,
// and the .dtp row for part 0 is at level 2.
const M_HEAD = { calm: [[5], [5], [6]], enraged: [[7], [7], [8]] };
// GRAVIOS (em005_00): his specs, because two of his motions are each played by two breaks (states-em005_00.md 3.3)
// and his belly ladder is shared by two of them. THE BELLY IS TWO INDEPENDENT SWAPS on one dtt part (part 6, .dtp
// rows 1 and 2): the part pass applies sets 9 + 11 at level 0, 10 + 11 at level 1 and 10 + 12 at level 2, so each
// rung is a PAIR of sets (2.2). WIRED AT G RANK, where the back's threshold is 2 (level 1 shows and fires nothing)
// and the record is u 1001; at low rank it is `{ levels: [[17], [18]], fire: [null, ['em005_00u', 1000]] }`.
const G_BELLY  = [[9, 11], [10, 11], [10, 12]];
const G_BACK   = { levels: [[17], [17], [18]], fire: [null, null, ['em005_00u', 1001]] };
const G_BELLY1 = { levels: G_BELLY, fire: [null, ['em005_00u', 1030], null] };
const G_WING_L = { levels: [[5], [6]], fire: [null, ['em005_00u', 1005]] };
const G_WING_R = { levels: [[7], [8]], fire: [null, ['em005_00u', 1010]] };
// FURIOUS RAJANG (em023_05): his head break is CUMULATIVE, as Diablos's horns are -- level 1 takes set 3 -> 9 (horn A
// a stub) and level 2 takes that AND set 4 -> 10 (horn B), which is the merged Head row of part-review.json
// (Intact / One Horn Broken / Both Horns Broken). (states-em023_05.md 3)
const R5_HEAD = [[3, 4], [9, 4], [9, 10]];
// SEREGIOS (em077_00): the three break regions and the tail carry a FLAT and an ERECT bladescale form, and rage
// picks between them for the whole body at once (states-em077_00.md 2, 3.1). Read as {set from the break-only
// pair, set from the flat/erect x broken pair}: the wings' 10 / 22 and 11 / 23 come from the part pass's own
// steps 5 and 6 and the rest from its rage branch, later winning, as 0x72c78 applies them. EVERY ROW IS AT
// LEVEL 2 at every rank, so level 1 repeats level 0 with `fire: null` -- Gravios's and Daimyo's shape. The tail
// has no .dtp row at all: its ladder is {not severed, severed}.
const S_WING_R = { calm: [[10, 7], [10, 7], [22, 20]], enraged: [[10, 17], [10, 17], [22, 25]] };
const S_WING_L = { calm: [[11, 8], [11, 8], [23, 21]], enraged: [[11, 18], [11, 18], [23, 26]] };
const S_HEAD   = { calm: [[9], [9], [19]], enraged: [[29], [29], [27]] };
const S_TAIL   = { calm: [[4], [24]], enraged: [[16], [28]] };
// His hind legs are NOT a bladescale region (4.3), so their ladders follow the break alone.
const S_LEG_R  = [[5], [5], [30]];
const S_LEG_L  = [[6], [6], [31]];
// HELLBLADE GLAVENUS (em080_04): his part families, because THREE of them are shown at the user's break level in
// a state this table has no axis for. `em080_04.mpm` numbers its 30 sets so that each part's alive family, its
// dead family and (for the head) its throat-overheating family are three separate runs of indices
// (states-em080_04.md 2.1). Each pair below holds the LIVE ladder in `calm` -- which is what userLevel reads the
// user's level from -- and the other state in `enraged`, taken with `show: 'enraged'`. The column is not a rage
// state and nothing on Hellblade reads rage at all; it is the second slot the one-axis table has.
const H_HEAD      = [[7], [7], [8], [9]];                          // intact (levels 0 and 1), level 2, level 3
const H_HEAD_HOT  = { calm: H_HEAD, enraged: [[10], [10], [11], [12]] };   // the throat overheating: 72, 82 on
const H_HEAD_ANY  = { calm: H_HEAD, enraged: H_HEAD };             // the live ladder whatever the rage toggle says
const H_HEAD_DEAD = { calm: H_HEAD, enraged: [[13], [13], [14], [15]] };   // dead: every blood group off
const H_FORE      = [[16], [17]];
const H_FORE_DEAD = { calm: H_FORE, enraged: [[18], [19]] };
const H_HIP       = [[20], [21]];
const H_HIP_DEAD  = { calm: H_HIP,  enraged: [[22], [23]] };
// The tail's alive family is HOT (40 on, plus 45/47, 46/47/55/56, 55/57) because he is hot from spawn and never
// cools in life; the dead family is the COLD one, whose indices run severed / intact / broken rather than in
// level order -- so its rungs are 28, 29, 27.
const H_TAIL      = [[24], [25], [26]];                            // intact, broken, severed
const H_TAIL_DEAD = { calm: H_TAIL, enraged: [[28], [29], [27]] };

// THE MALFESTIO LINE. uEm079_00 runs BOTH monsters, branching on e+0xb5f5 == 4 at 27 sites, and what those sites
// change is the stealth machine -- not one state visual. Read against the ROM rather than assumed
// (states-em079_04.md 1.3): the status-10 dispatcher returns the same script for every number, part and direction
// except two Nightcloak-only numbers; the status-11 death dispatcher is identical for every number; the action
// main returns the same motion for every (status, number) at postures 0, 1 and 3; the .mpm is byte-for-byte the
// same nineteen sets; the .dtp break rows are a BYTE-IDENTICAL FILE; and Nightcloak's COMMON pel *is*
// em079_00c -- the ROM's own resource descriptor names effect\pel\em\em079_00c for both. So the table is one
// function of the u.pel, and the c.pel is not a parameter because there is only ever one.
//   The BREAK RECORDS differ only in their payloads (Nightcloak's wings sit 30 units higher, his tail record
// carries an offset Malfestio's does not), which live in the records and not here.
function malfestio(u){
  return {
    // THE HEAD (part 0) at level 2: calm set 5 -> 6, enraged 7 -> 8 (group 1 off, 11 on, 101 off), firing u 1001
    // (cm202_060 on joint 3 at 1x). Levels 0 and 1 keep the intact set and fire nothing -- there is no key 1000.
    '3|Motion[1]':  { levels: M_HEAD, fire: [null, null, [u, 1001]] },
    // L3 Motion[2] IS FOUR THINGS, so it CYCLES through them -- each play shows the next, the mechanism Rathian's
    // back and wings use. The ROM plays this one clip for the -X wing (part 2), the +X wing (part 3), the tail
    // (part 5) and the tune+0x44 exhaust status (10, 0x1b); a motion can only show one thing at a time, and
    // cycling shows all four across four plays rather than picking one and hiding three.
    //   -X WING (part 2) level 1: set 11 -> 12 (group 3 off, 13 on, 103 off), u 1010 on JOINT 133. +X WING
    // (part 3) level 1: set 9 -> 10 (group 2 off, 12 on, 102 off), u 1015 on JOINT 132. TAIL (part 5) needs TWO
    // depletions -- no key 1025 -- so level 1 shows nothing and level 2 takes set 17 -> 18 (group 4 off, 14 on,
    // 104 off) with u 1026 on JOINT 141. Part 1 (the body) plays this clip too and changes nothing.
    //   On NIGHTCLOAK the tail's level 2 also raises P+0x3b4 bit 15, which takes a 35-unit capsule at joint 141
    // out of the hunter hit test -- a hit-zone fact, not a set, and not this table's to show.
    '3|Motion[2]':  { cycle: [{ levels: [[11], [12]], fire: [null, [u, 1010]] },
                              { levels: [[9], [10]], fire: [null, [u, 1015]] },
                              { levels: [[17], [17], [18]], fire: [null, null, [u, 1026]] },
                              { start: [['em079_00c', 1109]] }] },
    // THE STUN, (10, 0x20), sided: direction 1 takes L3 M4 -> M6 -> M8, direction 2 takes L3 M3 -> M5 -> M7.
    // c 1103 into ONE held handle across both chains. The same six clips are the LEG depletion (part 4), which has
    // no .dtp row and shows nothing, so the stun is all they carry that can be seen.
    '3|Motion[3]':  { hold: ['em079_00c', 1103] },
    '3|Motion[4]':  { hold: ['em079_00c', 1103] },
    '3|Motion[5]':  { hold: ['em079_00c', 1103] },
    '3|Motion[6]':  { hold: ['em079_00c', 1103] },
    '3|Motion[7]':  { hold: ['em079_00c', 1103] },
    '3|Motion[8]':  { hold: ['em079_00c', 1103] },
    // RAGE: (1, 9) -- L0 Motion[4] from frame 0, the 4.45 s roar. The head pair swaps to its enraged half and the
    // glowing eyes come on. Rage also STOPS two per-frame joint writes (vtable +0x2a0 ids 0x84 / 0x85, written
    // only while calm), which is not a set and is not shown here.
    '0|Motion[4]':  { rage: true, tables: [M_HEAD] },
    // TIRED: its own clip, L0 Motion[14] (5.35 s). vtable +0x1c8 is LIVE on this class -- the first wired monster
    // whose eye applier has a third slot -- so tiredness SHOWS: eye set 1 -> set 4 (group 7 on). Drool c 1104
    // every 48. Nightcloak additionally holds [u, 100] while tired AND cloaked (his vtable +0x208); the cloak is
    // not a state this viewer has, so that one is exported and not shown.
    '0|Motion[14]': { rage: false, tired: true, sets: [4], tables: [M_HEAD], every: [['em079_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M14 lies down, (10, 0x1e) holds L3 M15, then L3 M16 -> L3 M22 gets up. Eye set 1 -> 2
    // (group 5 off, 6 on) while P+0x5d02 is up, the zzz c 1102 every 90, and the puff paused. L3 Motion[15] is
    // also the CAPTURE clip, where the eyes close at once -- the same thing this shows.
    '3|Motion[14]': { sets: [2] },
    '3|Motion[15]': { sets: [2], every: [['em079_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; eye set 1 -> 3 (groups 5, 7, 8 on) for the whole hold with the
    // idle blink suspended, c 1101 every 60. L3 Motion[13] is also the SHOCK TRAP's hold ((10, 0x6e), c 1105
    // every 42), which shows the same eye set: paralysis is what it is shown as.
    '3|Motion[13]': { sets: [3], every: [['em079_00c', 1101], 60] },
    // EYE SET 3 WITH NO AILMENT: L0 Motion[18] and L0 Motion[20] carry it on their own.
    '0|Motion[18]': { sets: [3] },
    '0|Motion[20]': { sets: [3] },
    // DEATH: L3 M17 for (11, 0) and every status-11 number the table does not name, L3 M12 at the end of the fall,
    // L3 M20 for (11, 7) / (11, 0x12). The break sets stay and the rage pair REVERTS -- the status-11 setAction
    // clears the rage flag and the part pass re-reads it the same frame, which is why each death carries `tables`.
    //   THEIR EYES CLOSE ON DEATH and this table cannot place it: 0xbd594(e, -1) at FRAME 286 of L3 M17, 140 of
    // L3 M12 and 110 of L3 M20, not at frame 0. No monster decoded before this class closes its eyes on death at
    // all. Written down rather than approximated with a frame-0 set that would shut them too early.
    '3|Motion[17]': { dead: true, tables: [M_HEAD] },
    '3|Motion[12]': { dead: true, settled: true, tables: [M_HEAD] },
    '3|Motion[20]': { dead: true, tables: [M_HEAD] },
  };
}
// NIGHTCLOAK (em079_04): Malfestio's table from his own u.pel, plus the one thing his variant adds that a motion
// can show -- ENTERING STATUS 11 CANCELS THE CLOAK. His vtable +0x204 fires u 200 and sets e+0xcb00 = 1 on the
// death branch (states-em079_04.md 7.4), so each death motion requests it once at frame 0.
//   What is NOT here, because the viewer has no cloak state: the stealth machine itself (em079_04.mrl's three
// extra materials and six clip names, draw slots 0/1/3 swapped and restored, e+0xcb44 the eye), the tired-while-
// cloaked handle [u, 100], and the (10, 0xe8) branch's own cloak cancel. Malfestio ships none of that -- his .mrl
// has five materials and no stealth clip names at all -- so it is Nightcloak's alone and it is exported, not shown.
//   His two Nightcloak-only reaction numbers, (10, 0xaf) and (10, 0xe8) for reaction code P+0x3ae = 27, play
// L3 M4 -> M6 -> M8 (or L3 M10 -> M11 -> M6 -> M8 in postures 1 and 3) and change nothing on the model. What
// reaction 27 IS was NOT READ.
function nightcloak(){
  const t = malfestio('em079_04u');
  for (const k of ['3|Motion[17]', '3|Motion[12]', '3|Motion[20]'])
    t[k] = Object.assign({}, t[k], { start: [['em079_04u', 200]] });
  return t;
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
    // THE LID IS DRAWN IN DEATH, corrected 2026-09-25. states-em042_00.md said P+0x5d02 is raised only
    // asleep or resting "and at no other time -- in particular not at death", and that negative came from
    // finding ONE of its SEVEN writers in the shared enemy code (0x6e714, 0x6f538, 0xae3d0, 0xaf068,
    // 0xb9de0, 0xba9d0, 0xbd598). 0xbd594 sets the flag and its timer at P+0x5d00, and 0x75c1c calls it
    // with -1 in the same straight-line block as the status-11 rage clear 0xba7b8 at 0x75b90. Three decodes
    // agree (Barioth re-read, Zinogre, Lagombi) and Raven had seen it on Savage. NOT READ: the `tst sb, #2`
    // guard at 0x75be0, so which death numbers skip it is open.
    '3|Motion[17]':  { dead: true, sets: [1] },
    '3|Motion[12]':  { dead: true, sets: [1], settled: true },
    '3|Motion[20]':  { dead: true, sets: [1] },
  },
  // SILVERWIND NARGACUGA (em037_04): E:/offline/decode/notes/states-em037_04.md, read and ROM-run by the
  // Silverwind decode agent (2026-09-24). He is `uEm037_00` with e+0xb5f5 = 4, and the agent unpacked his .arc
  // entry by entry: his COMMAND TABLE, ALL FIVE MOTION LISTS, ALL FIVE CLIP-EFFECT PSLs and em037_00c.pel are
  // BYTE-IDENTICAL to Nargacuga's -- the ailment pel is literally Nargacuga's file shipped inside his own archive,
  // which is why his ailment records below are keyed `em037_00c`. So this table is Nargacuga's with the three
  // things that are actually his changed, and every record renamed to em037_04u where the file is his.
  //   WHAT IS HIS: (1) his wing reaction routes through (10, 0x14) only on an ODD break level (vtable +0x23c =
  //   0xe48b48, variant-4 only), so every EVEN depletion after the break gives a short L3 Motion[2] flinch that
  //   changes nothing -- the viewer shows the break, as Nargacuga's does. (2) RAGE SHOWS ON HIS HEAD ONLY: he has
  //   no group 13, and his .mpm sets 15/16/17 are BYTE-IDENTICAL to 12/13/14, so his silver tail geometry is
  //   permanent and the enraged tail sets draw exactly what is already on screen. N_TAIL is still used, because
  //   applying them is what the ROM does; it simply cannot be seen. (3) His cut tail carries 172 silver vertices
  //   Nargacuga's does not.
  //   NO RAGE_PUFF. His vtable +0x2a4 is the base stub, but the shared block never runs at all: his setup writes
  //   e+0xb7d2 = 0 (0xe474a8) and 0xa41b8 tests that byte before every request, so the period-30 countdown ticks
  //   and asks for nothing. Rage is the HELD trail request below (RAGE_BY_LEVEL), as Nargacuga's is.
  em037_04: {
    // THE HEAD: its 2nd depletion raises part 0 to level 2 -- the only head row -- and (10, 7) plays L3 Motion[2];
    // set 4 -> 5 calm, 6 -> 7 enraged (group 1 off, 2 on, and group 4 off as well while enraged), firing u 1001
    // (cm202_060 on joint 2, pos (0, 15, 50), scale 0.75). The 1st depletion plays the same motion and shows
    // nothing. L3 Motion[2] is worked hard -- it is also the even-level wing flinch, the shock trap's start and
    // the exhaust status -- and the head break is the only one of the four with anything to see.
    '3|Motion[2]':  { levels: N_HEAD, fire: [null, ['em037_04u', 1001]] },
    // THE WINGS (dtt parts 2 / 6): the 1st depletion is the break. Wing A set 8 -> 9, u 1010 (joint 7), reaction
    // L3 Motion[10] -> [11] (held 240) -> [12]; wing B set 10 -> 11, u 1030 (joint 11, scale 1.25), L3 Motion[7]
    // -> [8] (held 120) -> [9]. The held and closing clips keep the broken wing. These six are also the stun's
    // (10, 0x20) chain: shown as the breaks, as Nargacuga's are.
    '3|Motion[10]': { levels: [[8], [9]], fire: [null, ['em037_04u', 1010]] },
    '3|Motion[11]': { levels: [[8], [9]], fire: [null, null] },
    '3|Motion[12]': { levels: [[8], [9]], fire: [null, null] },
    '3|Motion[7]':  { levels: [[10], [11]], fire: [null, ['em037_04u', 1030]] },
    '3|Motion[8]':  { levels: [[10], [11]], fire: [null, null] },
    '3|Motion[9]':  { levels: [[10], [11]], fire: [null, null] },
    // THE TAIL: part 3's 2nd depletion, level 2: set 12 -> 13 (groups 14 off, 15 off, 16 on), u 1016 on JOINT 143
    // at scale 1.3; reaction L3 Motion[1] from frame 0.
    '3|Motion[1]':  { levels: N_TAIL, fire: [null, ['em037_04u', 1016], null] },
    // THE SEVER: part 3's second counter (300) runs out with the tail at level 3 AND him enraged or tired ->
    // (10, 0x72), then L3 Motion[4] -> [5]. Set 13 -> 14 (groups 16 and 17 on; 14, 15, 18 and 101 off) and u 900
    // on joint 143. HIS CUT TAIL IS HIS OWN MODEL, em037_04_tail, and it is staged, so `drops` is real.
    // The script's -180 degree turn over L3 Motion[4] f52..122 is not in the clip and is not shown. A
    // variant-4-only 0xac030(e, P+0x40 + (50, 0, 50), 100, 0) fires with the sever and is NOT READ.
    '3|Motion[4]':  { levels: N_TAIL, at: 2, fire: [null, null, ['em037_04u', 900]], drops: true },
    '3|Motion[5]':  { levels: N_TAIL, at: 2, fire: [null, null, null] },
    // RAGE: command group 6 starts with a HOP and then the roar. The flag flips at FRAME 0 OF THE HOP, not of the
    // roar -- Nargacuga's note could not say which hop, and this one names both: (2, 0xd) / (2, 0x38) is
    // L0 Motion[35] and (2, 0xe) / (2, 0x3a) is L0 Motion[37]. All three show rage, so the hop a player sees is
    // enraged from its first frame as the game has it. Head and tail take their enraged sets at the user's levels
    // and the trails are requested (RAGE_BY_LEVEL). No material changes; his x1.2 motion rate is not shown.
    '0|Motion[35]': { rage: true, tables: [N_HEAD, N_TAIL] },
    '0|Motion[37]': { rage: true, tables: [N_HEAD, N_TAIL] },
    '0|Motion[26]': { rage: true, tables: [N_HEAD, N_TAIL] },
    // THE TAIL'S SPIKES WHILE CALM: L2 Motion[4] / [5] / [21] / [6] show the tail in its enraged set calm as well.
    // On him that is invisible -- 15/16/17 are the same bytes as 12/13/14 -- but it is what the ROM applies.
    '2|Motion[4]':  { tables: [N_TAIL], show: 'enraged' },
    '2|Motion[5]':  { tables: [N_TAIL], show: 'enraged' },
    '2|Motion[21]': { tables: [N_TAIL], show: 'enraged' },
    '2|Motion[6]':  { tables: [N_TAIL], show: 'enraged' },
    // TIRED: the idle (0, 2) is L0 Motion[30]; drool c 1104 every 48 while not enraged (stamina timer 3600).
    '0|Motion[30]': { rage: false, tables: [N_HEAD, N_TAIL], every: [['em037_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L0 Motion[22] -> (10, 0x1e) L0 Motion[20] (hold) -> (10, 0x44) L0 Motion[21]. Eye set 1
    // -> 2 (groups 5 and 6 on, both lids drawn) from L0 Motion[22] frame 0; zzz c 1102 every 90 in the hold. The
    // rage trails keep running -- the class holds nothing off. L0 Motion[22] / [20] are also capture's clips.
    '0|Motion[22]': { sets: [2] },
    '0|Motion[20]': { sets: [2], every: [['em037_00c', 1102], 90] },
    '0|Motion[21]': { sets: [2] },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60, first at once. L3 Motion[13] is also the shock
    // trap's hold (c 1105 every 42): shown as paralysis, as Nargacuga's is.
    '3|Motion[13]': { every: [['em037_00c', 1101], 60] },
    // THE STUN, sided, held into ONE handle across its chain (c 1103 on joint 2, pos (0, 0, 50), scale 0.9). Its
    // six clips are the wing-break chains above, which carry the break -- so the hold sits on the two that are
    // only ever the stun's hold.
    '3|Motion[3]':  { hold: ['em037_00c', 1103] },
    // DEATH: L3 Motion[6] is the one clip nothing but death plays -- every status-11 number but 1, 7, 0x10 and
    // 0x12 -- and L3 Motion[18] takes (11, 7) and (11, 0x12). The break sets and the sever STAY, the rage pair
    // reverts (status-11 clears the flag and the part pass re-reads it the same frame) and THE EYES SHUT FOR GOOD
    // (P+0x5d02 = 1, timer 0xffff). L3 Motion[14] -> [15] is the fall that ends in L3 Motion[6].
    '3|Motion[6]':  { dead: true, tables: [N_HEAD, N_TAIL], sets: [2] },
    '3|Motion[18]': { dead: true, tables: [N_HEAD, N_TAIL], sets: [2] },
  },
  // DIABLOS (em007_00): E:/offline/decode/notes/states-em007_00.md, read and ROM-run by the Diablos decode agent
  // (2026-09-24). He is the first BURROWER we have wired -- posture 4, which reuses his ground clips underground --
  // and the first monster whose rage-puff pick is LIVE rather than a stub (RAGE_PUFF below).
  //   HIS MOTIONS ARE SHARED HARD. L3 Motion[2] is the back break AND the exhaust status; L3 M3..M8 are the
  //   hind-leg trips AND the sided stun; L3 Motion[13] is the paralysis hold AND the shock trap's. One motion can
  //   show one thing, so each row below says which of its roles it shows, and the ROM's sharing is named.
  em007_00: {
    // THE HORNS, (10, 0x14) with part 6 on L3 Motion[22]: TWO levels, and the sets are CUMULATIVE -- level 1 takes
    // set 3 -> 4 (group 102 out, 2 in, one horn), level 2 takes that AND set 5 -> 6 (group 103 out, 3 in, both).
    // Each level fires its own record: u 1030 at the +X horn (offset (80, 80, 150)) and u 1031 at the -X
    // (offset (-90, 90, 150)), both cm202_060 on joint 3 at 0.7.
    '3|Motion[22]': { levels: [[3, 5], [4, 5], [4, 6]],
                      fire: [null, ['em007_00u', 1030], ['em007_00u', 1031]] },
    // THE BACK / WING, (10, 7) with part 0 on L3 Motion[2]: one level, set 7 -> 8 (group 104 out, 6 in), firing
    // u 1000 (cm202_060 on joint 1, offset (0, 100, 0), scale 1). THE SAME MOTION is the tune+0x44 status
    // ((10, 0x1b), c 1109 once at frame 0) and any other part's depletion, which change nothing; the break is
    // what it shows, because the break is the only one of the three with anything to see.
    '3|Motion[2]':  { levels: [[7], [8]], fire: [null, ['em007_00u', 1000]] },
    // THE TAIL SEVER: part 7's SECOND counter (base 500, once) -> (10, 0x72) on L3 Motion[15]. Set 9 -> 10
    // (group 101 out, 4 in) and u 900 (cm202_062 on JOINT 144 -- not the Rath line's 143). AND HE DROPS IT: his
    // uEnemyOption slot 0 resolves em007_00_tail (descriptor table[114] = 0x159abc4) and the model is staged, so
    // `drops` is real here where Basarios's would have done nothing.
    '3|Motion[15]': { levels: [[9], [10]], fire: [null, ['em007_00u', 900]], drops: true },
    // RAGE: the gauge -> command group 6 stream 0 -> (1, 6), playing L0 Motion[22] from frame 0. NOTHING ON THE
    // MODEL CHANGES with it -- no part set, no eye, no joint scaling (+0x2a0 is the base `bx lr`) and no material
    // of his own (the material machine in his part pass is Bloodbath's). The shared puff is all rage shows.
    '0|Motion[22]': { rage: true },
    // TIRED: the tired idle (0, 2) is L0 Motion[14]; drool c 1104 every 48 while not enraged -- his carries a
    // rotation, (70, 0, 0) -- and, calm and tired, the puff's countdown is zeroed.
    '0|Motion[14]': { rage: false, tired: true, every: [['em007_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 Motion[14] lies down, (10, 0x1e) holds L0 Motion[19], then L0 Motion[20] ->
    // L3 Motion[16] gets up. His eyes shut -- eye set 2 -> set 1 (group 5 off, group 1 on) -- while P+0x5d02 is
    // up, and the hold has the zzz c 1102 every 90 and pauses the puff.
    '3|Motion[14]': { sets: [1] },
    '0|Motion[19]': { sets: [1], every: [['em007_00c', 1102], 90], puffOff: true },
    '0|Motion[20]': { sets: [1] },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60 (cm200_001 on joint 1 at scale 5), first at once.
    // L3 Motion[13] is also the SHOCK TRAP's hold ((10, 0x6e) after L3 Motion[9] to frame 60, c 1105 every 42 at
    // the same scale): shown as paralysis, as Khezu's, Basarios's, Barioth's and Rathian's shared hold is.
    '3|Motion[13]': { every: [['em007_00c', 1101], 60] },
    // THE STUN, sided: (10, 0x20) plays L3 M4 -> M6 -> M8, or M3 -> M5 -> M7 for direction 2, then L3 M16. One
    // held handle of c 1103 (cm200_003 on joint 3 at 0.8) across the chain, stopped when it clears. These six
    // clips are ALSO the hind-leg trips ((10, 0x14) with part 3 or 4), which the model does not show at all --
    // so the stun is the only thing they have to show.
    '3|Motion[3]':  { hold: ['em007_00c', 1103] },
    '3|Motion[4]':  { hold: ['em007_00c', 1103] },
    '3|Motion[5]':  { hold: ['em007_00c', 1103] },
    '3|Motion[6]':  { hold: ['em007_00c', 1103] },
    '3|Motion[7]':  { hold: ['em007_00c', 1103] },
    '3|Motion[8]':  { hold: ['em007_00c', 1103] },
    // DEATH: L3 Motion[17] on the ground for (11, 0) and every number the table does not name; L3 Motion[12] at
    // the end of the fall ((11, 1), after L3 M10 -> M11); and L3 Motion[20] for the BURROWED death ((11, 3)),
    // which he surfaces from first (L3 M21 -> M20). Death shows nothing of its own: the break sets and the sever
    // stay as the user has them, his eyes stay open (death does not raise P+0x5d02) and there is no material to
    // change. The two that begin past their transition are settled.
    // THE LID IS DRAWN IN DEATH, corrected 2026-09-25. states-em042_00.md said P+0x5d02 is raised only
    // asleep or resting "and at no other time -- in particular not at death", and that negative came from
    // finding ONE of its SEVEN writers in the shared enemy code (0x6e714, 0x6f538, 0xae3d0, 0xaf068,
    // 0xb9de0, 0xba9d0, 0xbd598). 0xbd594 sets the flag and its timer at P+0x5d00, and 0x75c1c calls it
    // with -1 in the same straight-line block as the status-11 rage clear 0xba7b8 at 0x75b90. Three decodes
    // agree (Barioth re-read, Zinogre, Lagombi) and Raven had seen it on Savage. NOT READ: the `tst sb, #2`
    // guard at 0x75be0, so which death numbers skip it is open.
    '3|Motion[17]': { dead: true, sets: [1] },
    '3|Motion[12]': { dead: true, sets: [1], settled: true },
    '3|Motion[20]': { dead: true, sets: [1], settled: true },
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
    // the fall, after L3 M9 -> M10 -> M8), and L3 Motion[18] for (11, 7) / (11, 0x12). The break sets and the sever
    // stay as the user has them, and the rage flag is cleared -- the part pass re-reads it the same frame, so the
    // rage pair reverts, which `dead` gives for nothing.
    //   HIS EYES SHUT, CORRECTED 2026-09-25, and the earlier claim that they stay open was mine and was wrong.
    // states-em042_00.md said P+0x5d02 is raised "whenever 0x81bb0(e, 0) == 1 ... and at no other time -- in
    // particular not at death", which was a conclusion drawn from finding ONE writer (0xae3d0). There are SEVEN in
    // the shared enemy code -- 0x6e714, 0x6f538, 0xae3d0, 0xaf068, 0xb9de0, 0xba9d0 and 0xbd598 -- and 0xbd594 is
    // the one that matters: it sets P+0x5d02 = 1 and the timer at P+0x5d00, and 0x75c1c calls it with -1. That call
    // sits in the SAME straight-line block as 0xba7b8 at 0x75b90, which the note itself attributes to the status-11
    // setAction, with no branch between them. Two other decode agents read the same code independently on Zinogre
    // and Lagombi and both said status 11 raises the lid; three readings agree and the note's negative did not
    // survive being checked. NOT READ: the `tst sb, #2` at 0x75be0 that guards the call, so which death numbers
    // skip it is unknown -- set 1 is what the ROM writes on the path that was read.
    '3|Motion[15]': { dead: true, sets: [1] },
    '3|Motion[18]': { dead: true, sets: [1] },
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
  // THE -DROME LINE: Velocidrome, Gendrome, Iodrome and Giadrome, from dromeLine() above -- ONE call each, because
  // the ROM has ONE class for the four of them and the rows below are literally the same code on all four.
  em014_00: dromeLine('em014_00u', 'em014_00c'),
  // GENDROME: the only sibling with no list 4 at all (the viewer's lists: 41 / 21 / 26 clips on 0 / 2 / 3, the same
  // counts as Velocidrome's, which is what byte-identical .lmt files look like from this side). His u 1002 is
  // joint 2 like Velocidrome's; his own c 1101 / 1102 / 1103 / 1104 / 1109 are the same five cm200_* records.
  em015_00: dromeLine('em015_00u', 'em015_00c'),
  // IODROME: his u 1002 sits on JOINT 103 where the other three use joint 2 (states-em014_00.md 1.10) -- that is
  // inside the record, which the runtime reads, so nothing here changes for it. His attack remap is the one em-number
  // branch in the class that a break can reach (breakLevel(0) picks different attacks for him), but it selects
  // ACTIONS, not visuals, and the viewer plays clips the user picks.
  em016_00: dromeLine('em016_00u', 'em016_00c'),
  // GIADROME: no difference from Velocidrome's half of the class in anything the states read.
  em034_00: dromeLine('em034_00u', 'em034_00c'),
  // DAIMYO HERMITAUR (em019_00): E:\offline\decode\notes\states-em019_00.md, read and ROM-run by the Daimyo
  // decode agent (2026-09-24). HIS SHELL IS THE FIRST PART WE HAVE WIRED WITH A ROW AT BOTH LEVEL 1 AND LEVEL 2,
  // each with its own record and its own mesh set: durability 320 depleted twice, 640 damage in all, and the
  // swappable shell geometry goes 209 verts (set 5) -> 150 (set 6) -> 87 (set 7). He SWAPS geometry rather than
  // adding it -- every break turns an intact group off and a smaller broken group on -- and groups 0 and 100 keep
  // shell-bound geometry at every level, so the shell is never removed, only replaced by a smaller broken version.
  //   NOTHING HE SHOWS IS RE-APPLIED FROM A LIVE STATE FLAG: his part pass (vtable +0x210 = 0xdb6804) reads only
  //   break levels, so unlike Barioth nothing reverts when rage ends or when he dies. He has NO EYE MESH at all --
  //   the class never calls 0x71398, so e+0xb610/+0xb614/+0xb618 stay at the base -1 and the shared eye applier's
  //   setVisibleGroup(e, -1) is a no-op -- so sleep shuts nothing on him, and there is no sever and no cut model
  //   (every .dtt part has second-counter limit 0 and base -1).
  em019_00: {
    // THE SHELL (dtt part 2), the one break with a ladder: (10, 7) plays L3 Motion[1] for parts 0, 1, 2, 7 and by
    // default, and only part 2 has rows -- level 1 is set 5 -> 6 (group 3 on, 103 off) firing u 1010 (cm202_060 on
    // joint 143 at (50, 80, -50)), level 2 is set 6 -> 7 (4 on too, 104 off) firing u 1011 (joint 200 at
    // (0, 0, -50), scale 1.3). A depletion of the head, body, legs or claw-arms plays the same clip and changes
    // nothing, which is why the ladder is all this row carries.
    '3|Motion[1]':  { levels: [[5], [6], [7]],
                      fire: [null, ['em019_00u', 1010], ['em019_00u', 1011]] },
    // THE TWO CLAWS both play L3 M2 -> L3 M3 ((10, 7), script 0x17ae050, blend 4) and so does the tune+0x44 status
    // ((10, 0x1b), the same script). One hit depletes one part, so each play shows the next of them, in the parts'
    // order -- the Rath line's shape. L3 M2 is ALSO the shock trap's start (to frame 40, (10, 0x6e)), which shows
    // nothing of its own and so is not in the rotation.
    '3|Motion[2]':  { cycle: [D_CLAW_P, D_CLAW_M, D_EXHAUST] },
    // RAGE: the gauge (600) -> command group 6 stream 0 -> (1, 3), the 4.05 s roar, playing L0 Motion[3] from
    // frame 0. Nothing on the model changes with it -- the part pass never reads isEnraged, +0x2a0 is the base
    // `bx lr` so there is no joint scaling, and the .mrl has no clip names -- so the puff is the whole of it.
    // THE NOTE'S OWN CAVEAT, kept: L0 Motion[3] is BOTH the rage roar and the ailment-RECOVERY clip ((10, 0x2a),
    // (10, 0x2b), (10, 0x70) and more, all through script 0x17adfa0). A clip alone is never the state; the action
    // is, and the viewer has only the clip. Shown as the roar, because that is the one with something to show.
    '0|Motion[3]':  { rage: true },
    // TIRED: his tired idle is its OWN PAIR, unlike Barioth's, whose tired idle was his combat idle -- (0, 2) ->
    // 0xdb6d4c plays L0 Motion[31] as the entry and then loops L0 Motion[24] (and skips the entry if M24 is
    // already playing). Drool c 1104 every 48 while not enraged (timer 6000), and, calm and tired, the shared
    // puff's countdown is zeroed. Both clips carry it because the user may play either; the ROM's one countdown
    // runs across the hand-off where the viewer's restarts at each clip's frame 0.
    '0|Motion[31]': { rage: false, tired: true, every: [['em019_00c', 1104], 48] },
    '0|Motion[24]': { rage: false, tired: true, every: [['em019_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) plays L3 M11, (10, 0x1e) holds L0 M16, (10, 0x44) gets up with L0 M17. NO LID -- his eyes
    // stay open -- so the hold shows only the zzz c 1102 every 90 and the paused puff. L3 M11 -> L0 M16 is also
    // CAPTURE's ((11, 0x10)); sleep is what they are shown as.
    '0|Motion[16]': { every: [['em019_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[10]; c 1101 every 60 (cm200_001 on joint 1 at scale 5), first at once.
    // L3 M10 is also the SHOCK TRAP's hold (c 1105 every 42 at the same scale): shown as paralysis, as every
    // monster wired so far shows its shared hold.
    '3|Motion[10]': { every: [['em019_00c', 1101], 60] },
    // THE STUN, and it is the ONLY sided reaction he has: (10, 0x20) plays L3 M4 -> M6 (held) -> M8 for direction 2
    // and L3 M5 -> M7 -> M9 for direction 1. One held handle of c 1103 (cm200_003 on JOINT 0, offset (0, 0, 100),
    // axisMask 1), stopped when it clears. The same six clips are the leg-pairs' depletion reactions (parts 3 and
    // 4), which have no .dtp row and so change no mesh and fire nothing -- the stun is the one with something to
    // show.
    '3|Motion[4]':  { hold: ['em019_00c', 1103] },
    '3|Motion[6]':  { hold: ['em019_00c', 1103] },
    '3|Motion[8]':  { hold: ['em019_00c', 1103] },
    '3|Motion[5]':  { hold: ['em019_00c', 1103] },
    '3|Motion[7]':  { hold: ['em019_00c', 1103] },
    '3|Motion[9]':  { hold: ['em019_00c', 1103] },
    // DEATH: L3 Motion[12] is his DEATH-ONLY clip -- (11, 0) and every number the table does not name, 6.617 s to
    // its end -- and L3 Motion[20] is death in the pit ((11, 7) and (11, 0x12)), which is also the pit's ailment
    // clip, as Velocidrome's L3 M24 is. Death shows nothing of its own on him: the part pass keeps re-applying the
    // break sets every frame while he is dead so THE BREAKS STAY, there is no lid to close, and nothing is
    // selected from the rage flag so the status-11 rage clear has no visible consequence.
    //   L3 M13 -> L3 M14 is death from the air ((11, 1)) and is NOT wired: those two clips are shared with FIVE
    //   knockdown actions ((10, 8), (10, 0x25), (10, 0x96), (10, 0x9d), (10, 0xb5)) and one death, and a knockdown
    //   does not clear rage. Left to the user rather than shown as death on the strength of one case in six.
    '3|Motion[12]': { dead: true },
    '3|Motion[20]': { dead: true },
  },
  // ASTALOS (em081_00): E:\offline\decode\notes\states-em081_00.md, read and ROM-run by the Astalos decode agent
  // (2026-09-24). Every change below lands on FRAME 0 of the motion named; the break and sever sets are re-applied
  // every frame by the part pass from the break levels, as Barioth's are.
  //   HIS RAGE CHANGES NOTHING ON HIM. The part pass never reads isEnraged, the eye applier never reads it, and this
  //   variant has no material animation at all -- uEm081_00 runs BOTH Astalos and Boltreaver, forking on e+0xb5f5,
  //   and all ten material-clip call sites are in the variant-4 arm. So there is no RAGE_PARTS row and no rage set
  //   below: the shared puff is the whole of what his rage shows.
  //   WHAT DOES CHANGE HIS MODEL IS THE CHARGE, and it is not a motion state. Three bytes -- crest e+0xcb01, wings
  //   +0xcb02, tail +0xcb03 -- which the part pass re-applies EVERY FRAME from gauges, not from any clip. THE VIEWER
  //   ALREADY FOLLOWS THAT: part-review.json gives him a three-rung level axis (Uncharged / Charging / Fully
  //   Charged) and every charge row picks its half from the rung. What this table cannot do is follow it -- `levels`
  //   here is indexed by BREAK level alone -- so the ladders below are written at the UNCHARGED rung, the tier he
  //   spawns at, and a break played while the user has selected a charged rung shows the plain broken mesh.
  //   THE MIDDLE TIER IS REAL, contrary to what states-em081_00.md concluded: 0x1013468 writes tier 1 at 0x10141c4
  //   for 41 status-7 attacks, through a pointer rather than an immediate, which is why the first scan reported the
  //   `case 1` arm (the nine XfB__A1_tikuden sets) as unreachable. ROM-RUN: (7,0x7a) leaves the tail at tier 1.
  //   (effects-em081_00-charge.md, 2026-09-25.)
  //   FOUR BREAKABLE PARTS, TWO PLAIN REACTION CLIPS. (10, 7) plays L3 Motion[1] for the crest and L3 Motion[2] for
  //   the back AND both wingtalons, so the wings have no plain motion of their own. Their charged route (10, 0x14)
  //   splits by PART first -- part 3 to L3 M3 -> M5 -> M7, part 2 to L3 M4 -> M6 -> M8 -- with the hit direction
  //   able to swap the two; the pairing below is that default, read from the dispatcher.
  //   The sets on them are the PLAIN ladders: the charged ones (18 -> 19, 24 -> 25) would draw a charged wing on a
  //   monster whose crest and membranes are plain, which the ROM never produces, and their broken halves are
  //   identical anyway -- sets 19 and 25 name groups 56 and 57, and em081_00.mod's mesh table has neither.
  em081_00: {
    // THE CREST (part 0), (10, 7) -> L3 Motion[1]. It takes TWO depletions and LEVEL 1 SHOWS NOTHING AT ALL --
    // em081_00u has no key 1000 -- so levels 0 and 1 keep set 3 and fire nothing; level 2 takes set 4 (group 10 off,
    // 20 on, 101 off) and fires u 1001 (cm202_060 on joint 131, offset (0, 125, 50) at 0.75x).
    // THE TAIL CHARGING ARC, and the answer to "some tail attacks have no effects". His charge effects are NOT
    // clip bindings -- no PSL bit names them -- so nothing the motion-binding pipeline does can reach them. The
    // class requests them itself through vtable +0x1d0 = 0x101aeac into its own table 0x16a2054, and they resolve
    // in the pel's UNIQUE array: request id 1013 -> key 202 -> em081_00_000 row mask 0x80, driven by the per-frame
    // handler 0x1017d84 while the TAIL is at charge tier 1, and stopped gracefully (0x329c40(h, 0)) at the next
    // action start. These five clips are the tail-charging attacks, ROM-RUN: (7,0x7a) and (7,0xa0) L2 M3,
    // (7,0x7b) and (7,0xa1) L2 M4, (7,0x87) L2 M23, (7,0x99) and (7,0xa2) L2 M24, (7,0xc7) L4 M62.
    //   `hold` rather than `start` because that is the shape the ROM has: one request kept while the tier holds,
    // ended when the action changes -- not a one-shot at frame 0. (effects-em081_00-charge.md, 2026-09-25.)
    //   em081_00_000.efl is ONE file sliced by row mask -- 0x20/0x40/0x80 are the crest / wings / tail charging
    // arcs, 0x01/0x02/0x04 the three charged sets, 0x07 all three -- so the same file serves nine records.
    '2|Motion[3]':  { hold: ['em081_00u', 202] },
    '2|Motion[4]':  { hold: ['em081_00u', 202] },
    '2|Motion[23]': { hold: ['em081_00u', 202] },
    '2|Motion[24]': { hold: ['em081_00u', 202] },
    '4|Motion[62]': { hold: ['em081_00u', 202] },
    '3|Motion[1]':  { levels: [[3], [3], [4]], fire: [null, null, ['em081_00u', 1001]] },
    // THE BACK (part 1) at level 1: set 9 -> 10 (group 11 off, 21 on), firing u 1005 (cm202_060 on joint 2, offset
    // (0, 50, 0) at 1.5x). L3 Motion[2] is the hardest-worked clip he has: it is ALSO both wingtalons' plain
    // reaction, the crest's and the tail's charged reaction, the tail-base and tail durability hits, and the
    // tune+0x44 status (10, 0x1b), whose c 1109 is the one thing this row cannot also show. The back is what it
    // shows because the back is the only break with nowhere else to go.
    '3|Motion[2]':  { levels: [[9], [10]], fire: [null, ['em081_00u', 1005]] },
    // THE -X WINGTALON (part 3) at level 1: set 20 -> 21 (groups 14, 17 and 107 off, 27 on), firing u 1015 on
    // JOINT 133 (cm202_060 at 1x). PART 3 DEFAULTS TO THE M3 CHAIN and part 2 to the M4 chain -- the status-10
    // dispatcher reads part first and lets the hit DIRECTION swap them (part 3 dir != 1 and part 2 dir 2 both take
    // 0x17ed2c8 -> M3 -> M5 -> M7; part 2 dir != 2 and part 3 dir 1 take 0x17ed2a0 -> M4 -> M6 -> M8), so the
    // pairing below is the ROM's default, not a choice made here. (states-em081_04.md, whose read of the same
    // class's dispatcher names the per-part default states-em081_00.md leaves out.)
    '3|Motion[3]':  { levels: [[20], [21]], fire: [null, ['em081_00u', 1015]] },
    // THE +X WINGTALON (part 2) at level 1: set 14 -> 15 (groups 13, 16 and 106 off, 26 on), firing u 1010 on
    // JOINT 132 (cm202_060 at 1x).
    '3|Motion[4]':  { levels: [[14], [15]], fire: [null, ['em081_00u', 1010]] },
    // THE STUN, (10, 0x20) -- sided the same way the charged wingtalon reaction is, and sharing its six clips:
    // c 1103 (cm200_003 on joint 3, offset (0, 0, 100) at 0.9x) into ONE held handle across the hold and recovery
    // clips of both chains, which is where a player sees the stars.
    '3|Motion[5]':  { hold: ['em081_00c', 1103] },
    '3|Motion[6]':  { hold: ['em081_00c', 1103] },
    '3|Motion[7]':  { hold: ['em081_00c', 1103] },
    '3|Motion[8]':  { hold: ['em081_00c', 1103] },
    // THE TAIL SEVER: part 7's SECOND counter (base 450, once) -> (10, 0x72) on L3 Motion[15]. Set 26 -> 27 (group
    // 19 off, 29 on, 109 off) and u 900 (cm202_060 on JOINT 136 at 1x). Part 7's first counter is a durability with
    // no .dtp row, so he has no broken tail level -- only the sever. He DOES drop a cut tail (CUT_TAIL below).
    '3|Motion[15]': { levels: [[26], [27]], fire: [null, ['em081_00u', 900]], drops: true },
    // RAGE: command group 6's tail issues (1, 0) -- L0 Motion[4] from frame 0. Nothing on the model follows it.
    '0|Motion[4]':  { rage: true },
    // TIRED: unlike Barioth, his tired idle (0, 2) is its OWN clip, L0 Motion[14], so the clip itself says it --
    // with drool c 1104 every 48 (cm200_006 on joint 4, offset (0, -50, 10) at 1x).
    '0|Motion[14]': { rage: false, tired: true, every: [['em081_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 Motion[14] lies down, (10, 0x1e) holds L0 Motion[19], then L0 Motion[20] -> L3 Motion[16]
    // gets up. His eyes DO shut -- eye set 2 -> set 1 (group 1 on, 2 off, 52 off, the lid drawn) -- while P+0x5d02 is
    // up, and the hold has the zzz c 1102 every 90 and pauses the puff. L3 Motion[16] is left out entirely: it is the
    // wake-up, and it is shared with the paralysis, stun and shock-trap recoveries.
    '3|Motion[14]': { sets: [1] },
    '0|Motion[19]': { sets: [1], every: [['em081_00c', 1102], 90], puffOff: true },
    '0|Motion[20]': { sets: [1] },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60 (cm200_001 on joint 0 at 5x), first at once.
    // L3 Motion[13] is also the SHOCK TRAP's hold ((10, 0x6e), c 1105 every 42 at the same scale): shown as
    // paralysis, as Khezu's, Basarios's, Rathian's and Barioth's shared hold is.
    '3|Motion[13]': { every: [['em081_00c', 1101], 60] },
    // DEATH: L3 Motion[17] for (11, 0) and every number the status-11 table does not name, L3 Motion[12] at the end
    // of the fall (L3 M10 -> M11 -> M12), and L3 Motion[20] for (11, 7) / (11, 0x12). Death shows nothing of its own
    // -- the break sets and the sever stay as the user has them, and his eyes stay open, since death does not raise
    // P+0x5d02 -- but it does clear the rage, and the class's own hook zeroes all three charge bytes.
    '3|Motion[17]': { dead: true },
    '3|Motion[12]': { dead: true, settled: true },
    '3|Motion[20]': { dead: true, settled: true },
  },
  // BOLTREAVER ASTALOS (em081_04): E:\offline\decode\notes\states-em081_04.md, read and ROM-run by the Boltreaver
  // decode agent (2026-09-24), written as a diff against Astalos's note. Same class, uEm081_00, forking on
  // e+0xb5f5 = 4; the .dtp rows are identical to Astalos's and his COMMON pel IS em081_00c, byte for byte in both
  // arcs and named for both monsters by the ROM's own resource descriptor -- so every ailment record below is
  // literally Astalos's record, while the breaks, the sever and the puff are his own em081_04u.
  //   HE SPAWNS CHARGED, and that is what makes his table differ from Astalos's rather than repeat it. The family
  // mechanic is a three-region charge (head e+0xcb01, wings +0xcb02, tail +0xcb03) that the part pass re-reads
  // every frame. Astalos's has two levels, 0 and 2, and he spawns at 0; Boltreaver's has three, 0 / 2 / 4, and he
  // spawns at 2 on all three regions -- so the sets below are his CHARGED ladders (head 7/8, +X wing 18/19, -X
  // wing 24/25, tail 30/31, eye 32), where Astalos's table carries the plain ones.
  //   WHAT IS NOT SHOWN, and why. His charge transitions are real and visible -- (1, 0x12) on L0 M32 takes every
  // region to 4 and every charged material's clip slot 0 from clip 0 to clip 1; (1, 0x11) on L3 M16 recharges to 2;
  // a hit on a level-4 region knocks it to 2 and fires u 310; and going tired or dying wipes all three back to 0.
  // None of it is here. THE VIEWER DOES CARRY A CHARGE CONTROL -- part-review.json gives him a FIVE-rung level axis
  // (Uncharged / Charging / Charged / Overcharging / Overcharged), one per ROM tier 0..4: his own 0 / 2 / 4 plus the
  // two transitional ones. But it is the USER's control, and a motion that moved it would be taking it from them;
  // `levels` here is indexed by break level alone and cannot read the rung either. So the ladders below are written
  // at the rung he SPAWNS at, tier 2 `Charged`, and a break played at another rung shows that rung's mesh broken.
  em081_04: {
    // THE HEAD (part 0), (10, 7) -> L3 Motion[1]. Two depletions, and level 1 shows nothing at all -- em081_04u has
    // no key 1000 -- so levels 0 and 1 keep set 7 and fire nothing; level 2 takes set 8 (group 10 off, 20 on, and
    // 30/31/40/41/50/51/101 off) and fires u 1001 (cm202_060 on joint 131, offset (0, 125, 50) at 0.75x). Set 7/8
    // rather than Astalos's 3/4 because he is charged: the break sets are 3 -> 4 uncharged, 7 -> 8 charged.
    '3|Motion[1]':  { levels: [[7], [7], [8]], fire: [null, null, ['em081_04u', 1001]] },
    // THE BODY/NECK (part 1) at level 1: set 9 -> 10 (group 11 off, 21 on), firing u 1005 (cm202_060 on joint 2,
    // offset (0, 50, 0) at 1.5x). The neck has no charged pair, so this ladder is the same as Astalos's. As on
    // Astalos, L3 Motion[2] is the hardest-worked clip he has -- it is also both wings' plain reaction, the head's
    // and the tail's charged reaction, the tail-base and tail durability hits, and the tune+0x44 status (10, 0x1b),
    // whose c 1109 is the one thing this row cannot also show.
    '3|Motion[2]':  { levels: [[9], [10]], fire: [null, ['em081_04u', 1005]] },
    // THE WINGS. The status-10 dispatcher splits the (10, 0x14) chains by PART first and lets the hit direction
    // swap them: part 3 (dir != 1) and part 2 (dir 2) take 0x17ed2c8 -> M3 -> M5 -> M7, part 2 (dir != 2) and part 3
    // (dir 1) take 0x17ed2a0 -> M4 -> M6 -> M8. So -X is Motion[3] and +X is Motion[4], which is the ROM's default
    // rather than a pairing chosen here -- and Astalos's table carries the same one, from this same dispatcher.
    //   -X WINGTALON (part 3) at level 1: sets 24 -> 25 (groups 14, 17 and 107 off, 27 on, 34/44/47 off), u 1015 on
    // JOINT 133. Charged ladder 24/25, where Astalos's plain one is 20/21.
    '3|Motion[3]':  { levels: [[24], [25]], fire: [null, ['em081_04u', 1015]] },
    //   +X WINGTALON (part 2) at level 1: sets 18 -> 19 (groups 13, 16 and 106 off, 26 on, 33/43/46 off), u 1010 on
    // JOINT 132. Charged ladder 18/19, where Astalos's plain one is 14/15.
    '3|Motion[4]':  { levels: [[18], [19]], fire: [null, ['em081_04u', 1010]] },
    // THE STUN, (10, 0x20) -- the same six clips the charged wing reaction uses, sided the same way: c 1103 from
    // Astalos's c.pel (cm200_003 on joint 3, offset (0, 0, 100) at 0.9x, axisMask 1) into ONE held handle across
    // the hold and recovery clips of both chains.
    '3|Motion[5]':  { hold: ['em081_00c', 1103] },
    '3|Motion[6]':  { hold: ['em081_00c', 1103] },
    '3|Motion[7]':  { hold: ['em081_00c', 1103] },
    '3|Motion[8]':  { hold: ['em081_00c', 1103] },
    // THE TAIL SEVER: part 7's SECOND counter (base 450, once) -> (10, 0x72), a 148..245 degree turn and then
    // L3 Motion[15]. Sets 30 -> 31 (group 19 off, 29 on, 58 on, 39/49/59 and 109 off) and u 900 (cm202_060 on
    // JOINT 136 at 1x). Charged ladder 30/31, where Astalos's plain one is 26/27. No .dtp row on part 7, so there
    // is no broken tail level -- only the sever. He drops a cut tail (CUT_TAIL below).
    '3|Motion[15]': { levels: [[30], [31]], fire: [null, ['em081_04u', 900]], drops: true },
    // RAGE: command group 6's tail issues (1, 0) -- L0 Motion[4] from frame 0, from a command stream byte-identical
    // to Astalos's. Nothing on the model follows it: the part pass never reads isEnraged. (What rage DOES do is
    // charge him to level 4 through the group's later (1, 0x12), which is the charge, not the rage.)
    '0|Motion[4]':  { rage: true },
    // TIRED: the tired idle (0, 2) is its own clip, L0 Motion[14] (stamina timer 2400), with Astalos's drool
    // c 1104 every 48 (cm200_006 on joint 4, offset (0, -50, 10) at 1x) while not enraged. The charge wipe that
    // lands with it is not shown -- see the note above.
    '0|Motion[14]': { rage: false, tired: true, every: [['em081_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 Motion[14] lies down, (10, 0x1e) holds L0 Motion[19], then L0 Motion[20] -> L3
    // Motion[16] gets up. His eyes shut -- eye set 32 (charged) or 2 (plain) -> set 1, group 1 on and 2 and 52 off,
    // the lid drawn -- while P+0x5d02 is up, and the hold has the zzz c 1102 every 90 and pauses the puff. L3
    // Motion[16] is left out: it is the wake-up, shared with the paralysis, stun and shock-trap recoveries AND
    // with the (1, 0x11) recharge action.
    '3|Motion[14]': { sets: [1] },
    '0|Motion[19]': { sets: [1], every: [['em081_00c', 1102], 90], puffOff: true },
    '0|Motion[20]': { sets: [1] },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60 (cm200_001 on joint 0 at 5x), first at once.
    // L3 Motion[13] is also the SHOCK TRAP's hold ((10, 0x6e), c 1105 every 42 at the same scale): shown as
    // paralysis, as every monster wired before him is.
    '3|Motion[13]': { every: [['em081_00c', 1101], 60] },
    // DEATH: L3 Motion[17] for (11, 0) and every status-11 number the table does not name, L3 Motion[12] at the end
    // of the fall (L3 M10 -> M11 -> M12), and L3 Motion[20] for (11, 7) / (11, 0x12). The break sets and the sever
    // stay as the user has them and his eyes stay open (death does not raise P+0x5d02); the rage goes off, and the
    // charge is wiped the same frame -- which is not shown, as above. L3 Motion[20] is also the pit ailments'
    // clip; death is what it shows.
    '3|Motion[17]': { dead: true },
    '3|Motion[12]': { dead: true, settled: true },
    '3|Motion[20]': { dead: true, settled: true },
  },
  // GRAVIOS (em005_00): E:\offline\decode\notes\states-em005_00.md, read and ROM-run by the Gravios decode agent
  // (2026-09-24). THE FAMILY HEAD IS SPLIT BOTH WAYS. He has no class of his own -- there is no `uEm005_00` string
  // anywhere in the ROM, and the enemy-class table 0x172ae2c maps index 112 (em 4) and index 113 (em 5) to the one
  // DTI 0x184a8f8 -- so he runs BASARIOS's `uEm004_00` (vtable 0x1797c8c) with `e+0xb5f4` = 5, and every state
  // function branches on that byte. The MOTION DATA goes the other way: em004_00.arc ships em005_00_0..3.lmt
  // BYTE-IDENTICAL to Gravios's own files and only L4 is each monster's own, so em004_00's table above is this same
  // code read down its other half.
  //   THE PART PASS (vtable +0x210, em-5 half 0xd24098..0xd24348) is ten setVisibleGroup calls and nothing else:
  //   set 0 plus nine break/sever sets, picked by the BREAK LEVEL and the SEVER BIT ALONE -- no rage, tired, flag
  //   or variant test (2.1). There is no material state machine at all: the class makes no material call and
  //   em005_00.mrl has no clips, so rage and death change nothing on his body, exactly as Basarios's do not.
  //   EVERY LARGE PART BREAKS, where Basarios has two rows: eight .dtp rows over parts 0..6, 21 .mpm sets, and he
  //   SWAPS geometry rather than adding it -- every break is an intact group off and a broken group on (2.2).
  //   THE BELLY IS TWO SWAPS STACKED on one dtt part (part 6, .dtp rows 1 and 2), which is why G_BELLY below
  //   carries a PAIR of sets per rung: the pass applies 9+11 at level 0, 10+11 at level 1 and 10+12 at level 2.
  //   (2.2 -- the ROM confirms the progression docs/part-review.json recorded as Raven's 2026-09-10 assumption.)
  //   WIRED AT G RANK, because the viewer already is: index.html's SHELL_QUEST_RANK = 5, off which Khezu's orb ring
  //   and breath are wired. His back (.dtp row 0) and his head (row 3) are the first breaks we have read whose
  //   THRESHOLD RISES WITH RANK -- level 1 at low and high rank, level 2 at G, the part pass reading byte +2 of the
  //   row instead of byte +1 when questRank (0x3a8430) > 4 -- and the G break fires a DIFFERENT record: u 1001 for
  //   the back (id 8) and u 1026 for the head (id 33), where low rank fires u 1000 (id 7) and u 1025 (id 32). Each
  //   pair is byte-identical apart from the key. THE LOW-RANK ROWS, not shown, are the whole of the difference:
  //   back `{ levels: [[17], [18]], fire: [null, [u, 1000]] }`, head `{ levels: [[3], [4]], fire: [null, [u, 1025]] }`.
  //   At G rank the first depletion of either really does change nothing and fire nothing, so level 1 below repeats
  //   level 0's sets with `fire: null`, the shape Barioth's head already uses.
  em005_00: {
    // THE BACK (part 0) and THE BELLY'S FIRST BREAK (part 6 level 1) BOTH PLAY L3 M106, and so does the tail's
    // durability depletion (part 7 has no .dtp row and shows nothing) -- (10, 7), script 0x17988a0, blend 6. One
    // hit depletes one part, so each play shows the next of them, in the parts' order (3.3).
    '3|Motion[106]': { cycle: [G_BACK, G_BELLY1] },
    // THE BELLY'S SECOND BREAK: only part 6 reaches (10, 0x14) -- vtable +0x23c reads .dtp ROW 2 for em 5 where it
    // reads row 1 for em 4 (0xd239d4: `mov r1, #2` / `movweq r1, #1`), so the first depletion staggers on L3 M106
    // above and the second plays L3 M107 (script 0x17988e0, blend 6). Set 12 over set 10, firing u 1031 (id 38).
    '3|Motion[107]': { levels: G_BELLY, at: 2, fire: [null, null, ['em005_00u', 1031]] },
    // THE HEAD (part 5) at G level 2: (10, 7) plays L3 M102 (script 0x17988d0, blend 2). Set 3 -> 4 (group 2 off,
    // 3 on -- the broken mesh is the model's only `m50_damage` head piece), firing u 1026 (cm202_060 on joint 5 at
    // 0.8x). Level 1 shows nothing at G.
    '3|Motion[102]': { levels: [[3], [3], [4]], fire: [null, null, ['em005_00u', 1026]] },
    // THE TWO WING-FORELEGS both play L3 M103 ((10, 7), script 0x17988b0, blend 2): left (part 1) set 5 -> 6 firing
    // u 1005 on joint 9, right (part 2) set 7 -> 8 firing u 1010 on joint 13 -- their broken meshes are the only
    // two sharing `XfBA_E0__m50_wing`. One clip, two breaks: each play shows the next. The part pass reads .dtp row
    // 4 for BOTH parts (row 5 is never read by it, 2.1) -- the values are identical, so nothing moves differently.
    '3|Motion[103]': { cycle: [G_WING_L, G_WING_R] },
    // THE HIND LEGS take (10, 0x14): part 3 plays L3 M108 -> (300 f) L3 M5 -> L3 M7 and part 4 L3 M109 -> L3 M6 ->
    // L3 M8 (scripts 0x1798ba0 / 0x1798bc8). The set change is on frame 0 of the first clip: left set 13 -> 14
    // firing u 1015 (joint 17), right set 15 -> 16 firing u 1020 (joint 21). M5..M8 are the knockdown tails as
    // well, so they carry nothing. Here too the pass reads row 6 for both parts and never row 7.
    '3|Motion[108]': { levels: [[13], [14]], fire: [null, ['em005_00u', 1015]] },
    '3|Motion[109]': { levels: [[15], [16]], fire: [null, ['em005_00u', 1020]] },
    // THE TAIL SEVER: part 7 is his only part with a dtt second counter (limit 1, base 240, damage slot 1), and
    // when it runs out reaction code 0xe issues (10, 0x72) -> the start hook 0xd22cf0 calls 0xc2274(e, 0, 0, 0x8f)
    // -- `P+0x3b4 |= 1` and u 900 (cm202_062 on joint 143 at 0.7x) -- then script 0x1798a30 plays L3 M15, the only
    // motion that plays it. Set 19 -> 20 (group 18 the stump on, group 101 the tail off). HIS CUT TAIL IS STAGED
    // (em005_00_tail.mod ships and descriptor table[113] = 0x159aaf8 has uEnemyOption slot 0), so it drops:
    // render/tail-option.js CUT_TAIL.em005_00. Part 7 has no .dtp row, so there is no broken-but-attached level.
    '3|Motion[15]':  { levels: [[19], [20]], fire: [null, ['em005_00u', 900]], drops: true },
    // RAGE: the gauge (threshold 600) runs command group 6 stream 0, which is byte-identical to Basarios's; its
    // (1, 0x0c) arm is dead for Gravios (the op-0x6f selector 0 always returns 0, and L4 M2 is an empty slot), so
    // the entry is its unconditional (1, 0x0a) -- L0 M4 from frame 0, the 4.75 s roar, which is also the plain roar
    // of (1, 0), (1, 0xf), (1, 0x21) and (1, 0x22). NOTHING ON THE MODEL CHANGES WITH IT: no part set, no eye, no
    // joint scaling (vtable +0x2a0 is the base `bx lr`) and no material, because he has none. The motion rate x1.2
    // is not shown (the viewer plays 1.0). The shared puff (RAGE_PUFF) is the whole of what rage shows.
    '0|Motion[4]':   { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M14 -- the shared chooser takes it on `P+0x1a8 & 0x40` -- with drool
    // c 1104 every 48 (cm200_006 on joint 3, pos (0, -30, 110), rot (70, 0, 0), his one state record with a
    // rotation) and, calm and tired, the puff's countdown zeroed so the first puff comes at once on enraging.
    '0|Motion[14]':  { rage: false, tired: true, every: [['em005_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M14 lies down and (10, 0x1e) holds L0 M19. HIS EYES SHUT -- eye set 2 -> set 1 (group
    // 19, the model's only `XfB__m02_eye` mesh, off; group 1, a 22-vertex patch, on) -- while P+0x5d02 is up, which
    // shared code raises only asleep or resting (1.2), and the hold has the zzz c 1102 every 90 and pauses the
    // puff. The wake-up L0 M20 is left off: the flag drops one pass into it (one frame, not shown), as Basarios's
    // does -- the identical scripts. L3 M14 -> L0 M19 is also CAPTURE ((11, 0x10)), which does not raise the flag;
    // sleep is what they are shown as.
    '3|Motion[14]':  { sets: [1] },
    '0|Motion[19]':  { sets: [1], every: [['em005_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on joint 1 at 6x), first at once. L3 M13 is
    // also the SHOCK TRAP's hold: shown as paralysis, as Basarios's, Barioth's and Rathian's shared hold is.
    '3|Motion[13]':  { every: [['em005_00c', 1101], 60] },
    // SHOCK TRAP: (10, 0x6e) plays L3 M9 to f60 and then holds L3 M13; c 1105 every 42 (cm200_001 on joint 1 at 6x)
    // while the action lasts. L3 M9 also plays for (10, 0x52), (10, 0x87), (10, 0xb4), (10, 0xbd) and (10, 0xbe).
    '3|Motion[9]':   { every: [['em005_00c', 1105], 42] },
    // STUN: (10, 0x20) plays L3 M110 -> L3 M111; c 1103 (cm200_003 on joint 3, offset (0, 10, 70) at 0.7x,
    // axisMask 1) requested once into one held handle and stopped when it clears, at (10, 0x2b)'s L3 M16.
    '3|Motion[110]': { hold: ['em005_00c', 1103] },
    '3|Motion[111]': { hold: ['em005_00c', 1103] },
    // THE tune+0x44 STATUS (INFERRED exhaust): (10, 0x1b) plays L3 M2, and its setAction requests c 1109 once
    // (cm200_008 on joint 3, pos (0, -30, 130) at 1.3x) -- frame 0 of the clip.
    '3|Motion[2]':   { start: [['em005_00c', 1109]] },
    // DEATH: L3 M17 for (11, 0) and every number the status-11 table does not name, L3 M12 at the end of the fall
    // ((11, 1), after L3 M10 -> L3 M11), and L3 M20 for (11, 7) / (11, 0x12). DEATH SHOWS NOTHING OF ITS OWN: the
    // part pass keeps re-applying all nine break sets and the sever set every frame so every break and the cut tail
    // stay as the user has them, his eyes stay OPEN (status 11 never raises P+0x5d02), and there is no material to
    // change. L3 M17 and L3 M12 are death's only clips; L3 M20 is also the pit ailments', and death is what it is
    // shown as. L3 M12 begins past the fall's landing, so it is settled.
    '3|Motion[17]':  { dead: true },
    '3|Motion[12]':  { dead: true, settled: true },
    '3|Motion[20]':  { dead: true },
  },
  // GYPCEROS (em009_00): E:\offline\decode\notes\states-em009_00.md, read and ROM-run by the Gypceros decode agent
  // (2026-09-24). His class `uEm009_00` (vtable 0x179c5d8) puts the part pass and a MATERIAL machine in the one
  // +0x210, and he is the first monster we have wired with only ONE break row and with a body state that is not
  // rage, tiredness or an ailment.
  //   HIS ONE BREAK IS THE CREST, at LEVEL 2: .dtp `+0x64` is the single row {6, 2, 2, 1} (the same threshold at
  //   both ranks), so his first crest depletion shows nothing and fires nothing -- `em009_00u` has no key 1030 at
  //   all -- and the second takes set 2 -> set 9 (groups 4 and 102 off, 3 on: the 93-vertex crest shell and the
  //   76-vertex crest LIGHT mesh go, a 22-vertex stump arrives) firing u 1031. `vtable +0x1dc` also raises
  //   `P+0x3b4` bit 1, which drops the crest's own hit capsule -- off-model, and the hit-zone agent's.
  //   RAGE DRAWS GROUP 5, and the viewer already has it: part-review.json gives em009_00 a hidden `rage: "5"` row
  //   (Raven, 2026-09-10), which is the ROM's set 3 -> set 7 (the 76-vertex XfBA0__m03_eye_add over the eyes). So
  //   the rage row below carries no sets of its own -- the part-review row and `dead` between them already make
  //   group 5 follow the rage shown.
  // NOT WIRED, and stated here instead: THE CREST LIGHT. `XfBA0__m01_light` (material 1, mesh Group[4]) is a
  //   three-way machine the part pass re-picks EVERY FRAME from three inputs -- `Light_on` while `ctl+0x40 > 0`,
  //   `Angry` while enraged and neither feigning nor asleep, `Light_off` otherwise -- and eight class sites write
  //   `ctl+0x40 = 2.0`, including frame 0 of L4 M8, the flash attack ((7, 0x31) / (7, 0x32) / (7, 0x40)..(7, 0x43)),
  //   and the intro (13, 0). A `clips` entry here would hold its clip from a motion's frame 0 to the motion's end,
  //   so it can express neither a TWO-FRAME pulse nor a state that outlives the clip that started it: wiring
  //   `Light_on` on L4 M8 would leave the crest lit for the whole attack, and wiring `Angry` on the rage entry would
  //   leave it lit after rage ended, because nothing plays a motion when the flag drops. The right home is a
  //   material-state rule in render/monster.js of the kind Rajang and Alatreon have, and those read a part-review
  //   RUNG -- a control Gypceros has none of. Raised rather than approximated.
  //   PLAYING DEAD is wired only as far as the table reaches: (10, 0x14) at HP <= 30 % in posture 0 -- always the
  //   first time, then 30 % of the time (vtable +0x23c = 0xd5e62c, one-shot `ctl+0x34`) -- plays L4 M11, then
  //   (1, 0x1a) holds L4 M12_loop for 60/420/600 frames at low rank and 180/300/420 above, then (1, 0x1b) L4 M10
  //   gets up. What IS shown below is that the rage puff and the tired drool are both suppressed while those two
  //   clips play (`vtable +0x2d8` returns 0 with `ctl+0x35` up). The crest's BLINK during the hold -- `Light_on`
  //   every 30 frames under 300 left, every 18 under 180, every 6 under 60, nothing above 300 -- is the same
  //   material machine, and is left out for the same reason.
  em009_00: {
    // THE CREST BREAK: (10, 7) with part 6 plays L3 M1, blend 2. Level 1 shows and fires nothing (no .mpm row, no
    // record); level 2 takes set 9 and fires u 1031 (cm202_060 on JOINT 150, offset (0, 120, 0) at 0.8x).
    '3|Motion[1]':   { levels: [[2], [2], [9]], fire: [null, null, ['em009_00u', 1031]] },
    // THE tune+0x44 STATUS (INFERRED exhaust): (10, 0x1b) plays L3 M2 and requests c 1109 once at frame 0. L3 M2 is
    // also the body / neck / tail depletion ((10, 7) with part 0, 5 or 7), which shows nothing, so the status is the
    // one thing it carries. His wing depletions (L3 M103, one clip for both) and his leg depletions show nothing.
    '3|Motion[2]':   { start: [['em009_00c', 1109]] },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on joint 1 at 5x), first at once. L3 M13 is
    // also the SHOCK TRAP's hold: shown as paralysis, as every monster's shared hold has been.
    '3|Motion[13]':  { every: [['em009_00c', 1101], 60] },
    // SHOCK TRAP: (10, 0x6e) plays L3 M9 to frame 60 and then holds L3 M13; c 1105 every 42 (cm200_001 on joint 1
    // at 5x) while the action lasts.
    '3|Motion[9]':   { every: [['em009_00c', 1105], 42] },
    // STUN: (10, 0x20) plays L3 M4 -> L3 M6 (held) -> L3 M8, and ONLY that chain -- his .dtb direction table is all
    // zeros, so the mirrored script (L3 M3 / M5 / M7) is unreachable in play. c 1103 (cm200_003 on joint 3, offset
    // (0, 0, 100) at 0.8x) goes into one held handle and is stopped when it clears, at (10, 0x2b)'s L3 M16. The
    // three clips are also the -X hind leg's depletion chain, which shows nothing.
    '3|Motion[4]':   { hold: ['em009_00c', 1103] },
    '3|Motion[6]':   { hold: ['em009_00c', 1103] },
    '3|Motion[8]':   { hold: ['em009_00c', 1103] },
    // RAGE: command group 6's tail issues (1, 0x21) -- L4 M1 from frame 0. Group 5 follows the rage shown through
    // part-review's hidden `rage` row, and the `Angry` material clip is the crest machine's (above), so the entry
    // carries nothing of its own here. The shared puff is what rage adds.
    '4|Motion[1]':   { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M14_loop -- a DIFFERENT clip from his combat idle ((0, 1) = L4 M3), so the
    // clip itself says he is tired -- with drool c 1104 every 48 (cm200_006 on joint 3, pos (0, -20, 150) at 1.1x)
    // and, calm and tired, the puff's countdown zeroed.
    '0|Motion[14]':  { rage: false, tired: true, every: [['em009_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M14 lies down and (10, 0x1e) holds L0 M19_loop. HIS EYES SHUT -- set 4 (group 1, the
    // 56-vertex lid, on; groups 6 and 7, both eye meshes, off) -- while P+0x5d02 is up, and the hold has the zzz
    // c 1102 every 90 and pauses the puff. L3 M14 -> L0 M19 is also CAPTURE ((11, 0x10)), which does not raise the
    // flag; sleep is what they are shown as.
    '3|Motion[14]':  { sets: [4] },
    '0|Motion[19]':  { sets: [4], every: [['em009_00c', 1102], 90], puffOff: true },
    // PLAYING DEAD: the two clips of the hold suppress the puff (vtable +0x2d8 returns 0 while `ctl+0x35` is up, and
    // 0xa41b8 tests it before both the puff and the drool). That much the table holds; the crest blink does not.
    '4|Motion[11]':  { puffOff: true },
    '4|Motion[12]':  { puffOff: true },
    // DEATH: L3 M17 for (11, 0) and every number the status-11 table does not name, L3 M12 at the end of the fall
    // ((11, 1), after L3 M10 -> L3 M11), and L3 M20 for (11, 7) / (11, 0x12). The break set and the dropped capsule
    // stay; his eyes stay OPEN (status 11 never raises P+0x5d02); and THE RAGE PAIR REVERTS, because status-11
    // setAction clears the rage flag and the part pass re-reads it the same frame -- which `dead` gives for nothing
    // (it forces the rage shown false, and the part-review rage row follows it). L3 M12 begins past the landing.
    '3|Motion[17]':  { dead: true },
    '3|Motion[12]':  { dead: true, settled: true },
    '3|Motion[20]':  { dead: true },
  },
  // KIRIN (em011_00): E:\offline\decode\notes\states-em011_00.md, read and ROM-run by the Kirin decode agent
  // (2026-09-24). His class `uEm011_00` (vtable 0x179f740) runs Kirin alone -- no variant, no hyper, and no list 1.
  //   HE IS THE MONSTER THAT ALMOST NOTHING HAPPENS TO. One .dtp row (the horn, at LEVEL 2 at both ranks), no tail
  //   sever and no cut-tail model, NO TIRED STATE AT ALL (`tune+0x30` is NULL, `P+0x1a8` bit 6 clear, no (0, 2)
  //   case, no c 1104), and no shock trap, no pitfall and no exhaust status -- 175 of 204 status-10 numbers fall to
  //   the default, which is the idle chooser, so those states play no reaction and request nothing. His paralysis
  //   has a hold clip but NO RECORD: `em011_00c` has no key 1101, so the shared code asks for c id 1 every 60
  //   frames and finds nothing. All of that is why this table is short; each absence is read, not assumed.
  //   AND HE HAS NO RAGE PUFF. `vtable +0x2a4` is the base stub, but `vtable +0x1d8` writes `e+0xb7d2 = 0`
  //   (0xd6d19c) and 0xa41b8 tests that byte, so the request is skipped -- the same shape as Silverwind Nargacuga --
  //   and `em011_00u.pel` carries neither key 1120 nor 1121. So there is no RAGE_PUFF entry for him, deliberately.
  // NOT WIRED, and the one thing of his that matters: THE LIGHTNING AURA. `vtable +0x208` (0xd6df64) makes his
  //   class's only three effect requests, through an overridden `+0x1d0` (0xd73e1c) and his own key table
  //   0x169c45c: calm **u 0 every 40 frames**, enraged **u 61 every 32** AND **u 60 every 45**, mutually exclusive,
  //   suppressed during the roar itself, with u 0 also suppressed on L3 M4 / M5 / M7 / M8 and L4 M6 -- and BREAKING
  //   THE HORN STOPS u 61 FOR GOOD (the gate is `breakLevel(0) < 2`). `when` has no periodic kind: 'rage' and 'calm'
  //   start a record ONCE when the state begins, which would show a single crackle where the ROM shows a repeating
  //   one, and 'ragePuff' is the shared 0xa41b8 countdown he explicitly does not run. The three records are exported
  //   and staged so they build and can be page-checked, but nothing drives them; a `rageEvery` / `calmEvery` kind
  //   (a record, a period, and a state) would wire all three in a line, and that is the commit session's call.
  //   ALSO OFF-MODEL, stated so it is not lost: his two aura joints (200 and 201) are counter-rotated every frame by
  //   `vtable +0x2a0` (0xd6e400) off a 0..15 phase that `+0x1dc` advances and DEATH FREEZES; and the rage edge swaps
  //   all seven `P+0x418` hit-zone rows between `tune+0xc` and `tune+0x10` (the ROM's own reflection names that field
  //   肉質変化). The joints are the Rendering Agent's and the hit zones the hit-zone agent's.
  em011_00: {
    // THE HORN BREAK: (10, 7) with part 0 (or part 1, the body, which shows nothing) plays L3 M1. LEVEL 1 SHOWS
    // NOTHING -- the row's threshold is 2 at both ranks and `em011_00u` has no key 1000 -- and level 2 takes set 1
    // -> set 4 (group 2 on, groups 102 and 103 off: the 128-vertex horn comes off and a 14-vertex stub goes on),
    // firing u 1001 (cm202_060 on joint 2, offset (0, 5, 10), scale 0.2).
    '3|Motion[1]':  { levels: [[1], [1], [4]], fire: [null, null, ['em011_00u', 1001]] },
    // RAGE: command group 6 stream 0 is `00 01 06 | ff` -- one action, (1, 6) = L4 M7. NOTHING on the model changes
    // with it: the part pass reads only the break level, there is no material animation in the class, and +0x2a0
    // scales nothing. What rage really does is swap the aura keys (above) and the hit-zone rows (off-model).
    '4|Motion[7]':  { rage: true },
    // ASLEEP: (10, 0x1d) L3 M5 lies down and (10, 0x1e) holds L3 M7. His eyes DO shut -- the applier is
    // 0x71398(e, 3, 2, -1), so open is set 3 and SHUT IS SET 2 (group 1, the 28-vertex lid, drawn) -- while
    // P+0x5d02 is up, and the hold has the zzz c 1102 every 90 (cm200_002 on joint 2, offset (5, 0, 20), scale
    // 0.7). No `puffOff` here, because he has no puff to pause.
    '3|Motion[5]':  { sets: [2] },
    '3|Motion[7]':  { sets: [2], every: [['em011_00c', 1102], 90] },
    // THE STUN: (10, 0x20) plays L3 M3 -> L3 M4 (held) -> L3 M6, and c 1103 (cm200_003 on joint 2, offset (0, 0, 10)
    // at 0.25x) goes into one held handle, stopped when it clears at (10, 0x2b)'s L0 M3. The same three clips are
    // the part-2 depletion chain, which shows nothing, and (10, 0xaf) -- the reaction that ENDS RAGE OUTRIGHT
    // (the +0x204 hook calls 0xbd06c, which zeroes P+0x510 / 0x518 / 0x514 / 0x51a). The stun is what they show.
    '3|Motion[3]':  { hold: ['em011_00c', 1103] },
    '3|Motion[4]':  { hold: ['em011_00c', 1103] },
    '3|Motion[6]':  { hold: ['em011_00c', 1103] },
    // DEATH: he has NO status-11 table -- (11, 0) and every number but 1, capture included, land on the one script,
    // L4 M6 (6.117 s); (11, 1) is L3 M10 -> L3 M4. The horn set stays (the part pass keeps re-applying it), his lid
    // is NOT drawn (death does not raise P+0x5d02), the aura requests stop with the alive test, and the two aura
    // joints stop spinning. L3 M4 is the stun's held clip, so only L3 M10 carries the fall here.
    '4|Motion[6]':  { dead: true },
    '3|Motion[10]': { dead: true },
  },
  // CEPHADROME (em017_00): E:\offline\decode\notes\states-em017_00.md, read and ROM-run by the Cephadrome decode
  // agent (2026-09-24). He has his OWN class (`uEm017_00`, vtable 0x17a9d80) and his own four .lmt files: the agent
  // checked the family sharing both ways and it goes neither way -- Plesioth's `uEm010_00` overrides the same 25
  // vtable slots and ALL 25 hold different addresses, the same template compiled twice. Cephalos is ems012_00, a
  // different em number, and **Delex is not in this ROM at all** (a byte search of every uEm* / uEms* name). The one
  // real reuse is effects: five of his SEQUENCE records point at NIBELSNARF's em056_00_000 / _001 / _004 / _009.
  //   THREE BREAKS, all at level 1 at both ranks, and NONE of them is a sever: the back / dorsal fin (set 2 -> 5,
  //   u 1000 on joint 131), the head (set 1 -> 7, u 1030 on joint 4) and the TAIL (set 3 -> 6, u 1035 on joint 143)
  //   -- a broken tail, not a cut one. He has no sever at all: no dtt second counter, no (10, 0x72) case, no
  //   0xc2274 call, no u 900, and his uEnemyOption descriptor has -1 where a model would be. Five proofs, so there
  //   is no CUT_TAIL entry and no `drops`.
  //   HE HAS NO EYE SETS AT ALL. `0x71398` is never called, so `e+0xb610` / `+0xb614` / `+0xb618` stay -1 and the
  //   applier has nothing to apply: SLEEP SHUTS NOTHING on him, and `.mpm` set 4 is dead data. That is why the sleep
  //   rows below carry no `sets` -- the absence is read, not overlooked.
  //   HIS RAGE ENTRY IS CONDITIONAL. Command group 6 issues (5, 0x29) = L4 M5 only in the EMC posture-2 case; in
  //   every other posture the group issues NO ACTION AT ALL and rage simply begins, with the puff starting anyway.
  //   So the entry row below is the one clip rage can be seen to start on, and rage is otherwise the user's toggle.
  // NOT MINE, and passed on rather than wired: HE SWIMS THROUGH SAND. `L3 M10 -> L4 M1` is the surfacing pair, list
  //   4 is the in-sand motion set (Plesioth has no list 4 at all), and status 5 is INFERRED the in-sand status --
  //   seven status-10 reactions and two of the three death routes play the surface prologue first. Nothing on the
  //   MODEL changes while he is under; what changes is the hunter hit-data row. Placement, posture and the burrow
  //   itself are the Rendering Agent's, and the sand plumes are ordinary clip-bound SEQUENCE records, already in
  //   CLIP_EFFECTS.
  em017_00: {
    // L3 M2 CARRIES TWO BREAKS AND THE EXHAUST STATUS, so each play shows the next: the BACK / dorsal fin ((10, 7)
    // with part 0: set 5, u 1000 on joint 131, offset (0, 100, -30)), the TAIL ((10, 7) with part 7: set 6, u 1035
    // on joint 143, offset (0, 0, -150)), then (10, 0x1b)'s c 1109 once at frame 0. The pectoral fins and the neck
    // (parts 1, 2, 5) play it too and show nothing.
    '3|Motion[2]':  { cycle: [{ levels: [[2], [5]], fire: [null, ['em017_00u', 1000]] },
                              { levels: [[3], [6]], fire: [null, ['em017_00u', 1035]] },
                              { start: [['em017_00c', 1109]] }] },
    // THE HEAD: (10, 7) with part 6 plays L3 M1 -- set 1 -> 7 (group 3 on, 5 off), firing u 1030 (cm202_060 on
    // joint 4, the snout, offset (0, 40, 50) at 0.8x).
    '3|Motion[1]':  { levels: [[1], [7]], fire: [null, ['em017_00u', 1030]] },
    // RAGE: (5, 0x29) = L4 M5, the posture-2 case (see the block comment). Nothing on the model changes -- no part
    // set, no eye, no joint scaling (+0x2a0 is the base `bx lr`) and no material, because `em017_00.mrl` holds no
    // clip names at all. The shared puff is the whole of what rage shows.
    '4|Motion[5]':  { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M14, a clip of its own rather than the combat idle, with drool c 1104
    // every 48 (cm200_006 on joint 3, pos (0, -50, 120)) and, calm and tired, the puff's countdown zeroed.
    '0|Motion[14]': { rage: false, tired: true, every: [['em017_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M14 lies down and (10, 0x1e) holds L0 M19, with the zzz c 1102 every 90 and the puff
    // paused. NO EYE SET: he has none, so lying down shows only the clip. L3 M14 -> L0 M19 is also CAPTURE.
    '0|Motion[19]': { every: [['em017_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on joint 1 at 4x), first at once. L3 M13 is
    // also the shock trap's hold: shown as paralysis, as every monster's shared hold has been.
    '3|Motion[13]': { every: [['em017_00c', 1101], 60] },
    // SHOCK TRAP: (10, 0x6e) plays L3 M9 and then holds L3 M13; c 1105 every 42 (cm200_001 on joint 1 at 4x).
    '3|Motion[9]':  { every: [['em017_00c', 1105], 42] },
    // THE STUN, both directions: (10, 0x20) plays L3 M4 -> L3 M6 -> L3 M8 for most directions and L3 M3 -> L3 M5 ->
    // L3 M7 for direction 2. c 1103 (cm200_003 on joint 3, offset (0, -60, 100) at 0.7x) goes into one held handle
    // and is stopped when it clears at (10, 0x2b)'s L3 M16. Those same two chains are the pelvic fins' depletion
    // reactions, which show nothing, so the stun is what they carry.
    '3|Motion[4]':  { hold: ['em017_00c', 1103] },
    '3|Motion[6]':  { hold: ['em017_00c', 1103] },
    '3|Motion[8]':  { hold: ['em017_00c', 1103] },
    '3|Motion[3]':  { hold: ['em017_00c', 1103] },
    '3|Motion[5]':  { hold: ['em017_00c', 1103] },
    '3|Motion[7]':  { hold: ['em017_00c', 1103] },
    // DEATH: L3 M21 ends both the ground route ((11, 0) / (11, 3), after L2 M5) and the submerged one ((11, 1) /
    // (11, 2), after the surface prologue), and L3 M20 is (11, 7) / (11, 0x12) / (11, 0x22). The break sets stay --
    // the part pass re-reads them every frame, dead or not -- his eyes cannot change, and nothing reverts, because
    // rage changed nothing.
    '3|Motion[21]': { dead: true },
    '3|Motion[20]': { dead: true },
  },
  // BLANGONGA (em022_00): E:\offline\decode\notes\states-em022_00.md, read and ROM-run by the Blangonga decode
  // agent (2026-09-25). The family question came out the other way round from the brief's guess: **Blango is
  // `ems023_00`** (em021_00 is Congalala), and there is nothing to diff -- his class `uEm022_00` (vtable 0x17b1254)
  // shares no overridden slot with Congalala's, all four .lmt files are his own, there is no list 1 and no
  // em_option. The only ROM link to Blango is a spawn call.
  //   NOTHING ON HIS MODEL IS DRIVEN BY RAGE. The part pass reads the two break levels and nothing else, and the
  //   class never calls `0x81670` (isEnraged) or `0x81614` (isTired) ANYWHERE -- so the rage row carries no sets
  //   and the tired row shows only its clip.
  //   THE FANGS GATE THE SUMMON, which is the thing he has that nobody else does: `vtable +0x2a8` runs every frame
  //   and returns immediately once `breakLevel(0) >= 2`; otherwise, at L0 M33 frame 80 (and three other motion
  //   frames), it asks the small-monster manager for up to three **ems023_00 Blango**. Breaking his fangs stops
  //   the summon for good. The viewer has no small monsters and the spawn is not an effect record, so there is no
  //   row for the howl at all -- it is written down here instead, so the silence is on the record.
  //   HIS TAIL BREAK TAKES THE TAIL TIP AWAY WITH NOTHING IN ITS PLACE: set 4 -> 5 turns group 3 AND group 103 off
  //   (186 + 95 vertices, both skinned to joints 141/142/143) and puts no stump on. That is what the ROM does, and
  //   it is not a sever: he has NO tail sever and NO cut-tail model (dtt part 4's limit is 0 with base -1, no
  //   0xc2274 caller in the class, and his option descriptor 0x15960dc has -1 where a model would be).
  em022_00: {
    // THE FANGS, at LEVEL 2 only: (10, 0x14) with part 0 plays L3 M2 (behind script op 0x18 arg 100), and only
    // while the break level EQUALS the threshold. Level 1 shows nothing and fires nothing; level 2 takes set 6 ->
    // 7 (group 1 off, 2 on, 101 off -- the fangs and the intact muzzle go, the broken muzzle arrives) and fires
    // u 1001 (cm202_060 on joint 3, offset (0, -100, 40) at 0.5x). L3 M2 is also the body / tail depletion route
    // and the tune+0x44 status ((10, 0x1b), c 1109 once at frame 0), so the two take turns.
    '3|Motion[2]':  { cycle: [{ levels: [[6], [6], [7]], at: 2, fire: [null, null, ['em022_00u', 1001]] },
                              { start: [['em022_00c', 1109]] }] },
    // THE TAIL BREAK, his other row, at level 1: (10, 7) with part 4 plays L3 M1 -- set 4 -> 5, which turns the
    // tail tip off outright -- firing u 1020 (cm202_060 on JOINT 143 at 0.5x). L3 M1 is the generic stagger every
    // part plays, and the tail break is the one thing it shows.
    '3|Motion[1]':  { levels: [[4], [5]], fire: [null, ['em022_00u', 1020]] },
    // (THE SUMMON HOWL, L0 M33 for actions (1, 8) / (1, 0xc) / (1, 0xd) / (1, 0xf), has NO ROW: at frame 80 the
    // class spawns up to three Blango unless the fangs are broken, and neither the spawn nor its gate is anything
    // this table can draw -- no small monsters in the viewer, and no effect record. It is in the block comment
    // above so the silence is on the record.)
    // RAGE: command group 6 stream 0 issues (1, 4) -- L0 M32. Nothing on the model changes with it; the shared
    // puff is the whole of what rage shows.
    '0|Motion[32]': { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M35, a clip of its own ((0, 1) is L0 M2 and (0, 0) is L0 M1), with drool
    // c 1104 every 48 -- one of the few records carrying a rotation, (90, 0, 0) -- and the puff's countdown zeroed.
    '0|Motion[35]': { rage: false, tired: true, every: [['em022_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M18 lies down and (10, 0x1e) holds L3 M19. His eyes shut -- eye set 1 -> set 3 (group 6
    // off, group 5, the 14-vertex lid, on) -- while P+0x5d02 is up, with the zzz c 1102 every 90 (cm200_002 on
    // joint 4 at a very flat (1.4, 1.4, 0.14)) and the puff paused. L3 M18 -> L3 M19 is also CAPTURE ((11, 0x10)).
    '3|Motion[18]': { sets: [3] },
    '3|Motion[19]': { sets: [3], every: [['em022_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M9; c 1101 every 60 (cm200_001 on joint 1 at 3.5x), first at once. L3 M9 is
    // ALSO the shock trap's hold -- the same clip in a different wait mode, and its record c 1105 is byte-identical
    // to c 1101 but for the key -- so paralysis is what it shows and nothing is lost by it.
    '3|Motion[9]':  { every: [['em022_00c', 1101], 60] },
    // THE STUN, sided: (10, 0x20) plays L3 M3 -> L3 M5 (held) -> L3 M6 for direction 1 and L3 M4 -> L3 M7 -> L3 M8
    // for direction 2, with c 1103 (cm200_003 on joint 3, offset (0, -40, 50) at 0.55x, axisMask 1) in one held
    // handle, stopped at (10, 0x2b)'s L0 M30. All six clips are also the arms' and hind legs' depletion chains,
    // which show nothing.
    '3|Motion[3]':  { hold: ['em022_00c', 1103] },
    '3|Motion[5]':  { hold: ['em022_00c', 1103] },
    '3|Motion[6]':  { hold: ['em022_00c', 1103] },
    '3|Motion[4]':  { hold: ['em022_00c', 1103] },
    '3|Motion[7]':  { hold: ['em022_00c', 1103] },
    '3|Motion[8]':  { hold: ['em022_00c', 1103] },
    // DEATH: L3 M12 -> L3 M13 for (11, 0) and every number the status-11 table does not name, and L3 M16 for
    // (11, 7) / (11, 0x12). The break sets stay -- they are read from the break level, which death does not clear
    // -- and his eyes stay open. L3 M13 is the second clip of the chain and death's alone.
    '3|Motion[12]': { dead: true },
    '3|Motion[13]': { dead: true, settled: true },
    '3|Motion[16]': { dead: true },
  },
  // FURIOUS RAJANG (em023_05): E:\offline\decode\notes\states-em023_05.md, read and ROM-run by the Furious Rajang
  // decode agent (2026-09-24), every (status, number) 0..0x11 x 0..0xff enumerated for BOTH variants. He is
  // `uEm023_00` with `e+0xb5f5` = 5 -- no uEm023_05 in the registry, the same model, the same .mpm, the same command
  // table and the same c.pel -- so this table is Rajang's code read down the variant-5 branches.
  //   "PERMANENTLY ENRAGED" IS A BOOT STATE, NOT THE RAGE FLAG, and that is why there is no row for it here. The
  //   class never sets the rage flag for the look: the part pass takes `if (variant == 5) goto SETS` and forces sets
  //   12 (mane group 3), 13 (hairline group 11) and 17 (the short tail), and vtable +0x1d8 starts the `Angry_Start`
  //   material clip AT TIME 60.0 -- its last keyframe -- so it is born finished with no fade. None of that is
  //   conditional on anything, not even death. The viewer already draws it: part-review.json's State rungs for him
  //   are Enraged / Armor Mode with `rage: [true, true]` (Raven, 2026-09-13), so it is the panel's opening state.
  //   THE REAL RAGE FLAG STILL RUNS UNDERNEATH, and exactly three things follow it: the aura request (c 0, once on
  //   the rising edge, `when: 'rageStart'` in docs/effects/em023_05.json), THE PUFF (RAGE_PUFF below) and the mane
  //   joint scale (monster.js ROM_RAGE_FUR / RAGE_FUR, joint 150 -> (7, 11, 1), ramped to zero over 30 f on release).
  //   HIS PUFF EXISTS ONLY BECAUSE HE IS THE VARIANT: vtable +0x1d8 writes `e+0xb7d2 = 0` WHEN variant == 0, and
  //   0xa41b8 tests that byte before every request -- so plain Rajang has no rage puff at all and he does. The exact
  //   inverse of Savage Deviljho, whose class clears the byte for the variant.
  //   HE CANNOT GET TIRED, and this is read rather than assumed: `tune+0x30` (the stamina block) is NULL, so
  //   0x754f8's drain is skipped at 0x75610, and that is the only path to the one function that raises P+0x505. So
  //   there is no tired row and no drool: L0 M17 (the tired idle) and c 1104 never happen.
  //   HIS TAIL SEVER SHOWS NOTHING. The action, the bit and the counter all run ((10, 0x72) on L3 M2), but set 17 is
  //   already the severed geometry (byte-identical to set 16), his .dtp has no part-4 row so `0x9d438(e, 4)` finds
  //   no record, `em023_05u` has no key 1020, and descriptor 0x15961a8 has BOTH option slots -1 on both Rajangs --
  //   no cut-tail model. So no `drops`, no sever set, no CUT_TAIL entry: nothing to show.
  // NOT WIRED HERE, and stated instead: PUMP UP, his second body state -- (1, 0x32) = L2 M24, `ctl+4 = 1` with a
  //   3600-frame timer, arm set 7 -> 15 (group 12 off, 13 on), materials `Normal` -> `PumpUp`, five fur joints
  //   scaled, and the hit-zone table swapped. It is HELD from that action's frame 0, not shown for the length of a
  //   clip, so a motion row here would swap the arms for L2 M24 and revert them -- the opposite of what the ROM
  //   does. The viewer already holds it properly, off part-review's **Armor Mode** rung: monster.js's material
  //   rules for em023_05 put slots 0-4 on their table-1 rows at rung 1, ARMOR_FUR scales joints 152 / 153 / 154 /
  //   155 / 156, and the Arms row draws 12 | 13. What has no home yet is the PUMP-DOWN RECORD, c 30
  //   (em023_00_008, joint 2), which the ROM fires on the frame `ctl+4` clears -- including at death, where the
  //   arms revert and the `PumpUp` clip goes back to `Normal`. A rung change is not a motion, so the table cannot
  //   fire it; it is left out rather than fired on a clip the ROM does not tie it to.
  em023_05: {
    // THE HEAD BREAK, the only break that shows: any part's depletion plays (10, 7) -> L3 M1 while the SUM of every
    // part's break level is <= 2 (vtable +0x23c counts all eight parts -- Savage's keys on parity, Barioth's on rage
    // and tiredness, and this is the first we have read that sums). Head level 1 takes set 3 -> 9 (group 4 on, 102
    // off: horn A becomes a stub) firing u 1000; level 2 ALSO takes set 4 -> 10 (group 5 on, 103 off) firing u 1001
    // -- cumulative, as Diablos's horns are. Both records are cm202_060 on joint 3, offset (0, 15, 30) at 0.8x.
    '3|Motion[1]':  { levels: R5_HEAD, fire: [null, ['em023_05u', 1000], ['em023_05u', 1001]] },
    // THE SAME BREAK ON THE OTHER ROUTE: once the total passes 2, parts 0 / 3 / 4 / 7 take (10, 0x14) -> L3 M2 in
    // posture 0. L3 M2 is worked hard -- it is also the TAIL SEVER's clip ((10, 0x72), which shows nothing for him),
    // the exhaust reaction ((10, 0x1b), whose gauge is NULL so c 1109 never procs), (10, 0x52), (10, 0x87) and
    // (10, 0xb4) -- so the break is the one thing it shows. Parts 1 / 5 and 2 / 6 take L3 M10 and L3 M11 chains,
    // which show nothing (and L3 M11's chain is the stun's clips, below).
    '3|Motion[2]':  { levels: R5_HEAD, fire: [null, ['em023_05u', 1000], ['em023_05u', 1001]] },
    // RAGE: the gauge (threshold 600, timer 5400) runs command group 6 stream 0, whose only unconditional-looking
    // action is (1, 5) -- L0 M5, 2.783 s. `00 01 05` appears in EXACTLY ONE stream in the whole command table and it
    // is the rage group's, which is what makes L0 M5 the roar. The stream's op 0x0c is a block op whose CONDITION IS
    // NOT READ (EMC opcode semantics are unread corpus-wide), so which of (2, 6) -- L0 M37, the prologue -- and
    // (1, 5) runs when is read from the grammar, not from the interpreter. Nothing on the mesh changes with rage for
    // him: the sets above are already forced. The aura, the puff and the mane scale are the whole of it.
    '0|Motion[5]':  { rage: true },
    // ASLEEP: (10, 0x1d) L0 M23 lies down and (10, 0x1e) holds L0 M24. HIS LIDS CLOSE -- the eye applier is
    // 0x71398(e, 1, 8, -1), so open is set 1 and SHUT IS SET 8 (group 1 on, 14 off: the 14-vertex XfB__m03_eye pair
    // is replaced by a 65-vertex skin patch) -- while P+0x5d02 is up, and the hold has the zzz c 1102 every 90 and
    // pauses the puff. The wake-up L0 M25 -> L3 M3 is left off: L3 M3 is the common recovery clip of six other
    // actions. L0 M23 -> L0 M24 is also CAPTURE ((11, 0x10)), which does not raise the flag; sleep is what they show.
    '0|Motion[23]': { sets: [8] },
    '0|Motion[24]': { sets: [8], every: [['em023_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on joint 2 at 3x), first at once. L3 M13 is
    // also the SHOCK TRAP's hold ((10, 0x6e), c 1105 every 42): shown as paralysis, as every monster's shared hold
    // has been.
    '3|Motion[13]': { every: [['em023_00c', 1101], 60] },
    // STUN: (10, 0x20) plays L3 M11 -> L3 M7 (held) -> L3 M8, with NO LEFT/RIGHT SPLIT -- the handler returns the
    // one script for every value of P+0x5ccb and never calls 0x9e8c0. c 1103 (cm200_003 on joint 3, offset
    // (0, 0, 40) at 0.6x, end 1, axisMask 1) goes into ONE held handle across the chain and is stopped when it
    // clears, at (10, 0x2b)'s L3 M3. The three clips are also the part-2/6 break route and (10, 0xd2).
    '3|Motion[11]': { hold: ['em023_00c', 1103] },
    '3|Motion[7]':  { hold: ['em023_00c', 1103] },
    '3|Motion[8]':  { hold: ['em023_00c', 1103] },
    // DEATH: L3 M19 -> L3 M18 for (11, 0) and every number the status-11 table does not name -- HIS ONLY DEATH-ONLY
    // CLIPS, and the reason (11, 1)'s L3 M15 / L3 M17 and (11, 7) / (11, 0x12)'s L3 M23 are NOT here: the first pair
    // is the knockdown (10, 8) and the second is the pit ailments, and marking either dead would force the rage
    // shown off -- stopping the puff and dropping the mane scale -- in the middle of a knockdown or a pitfall.
    // Death shows nothing of its own on him: the break sets stay, the forced sets 12 / 13 / 17 and `Angry_Start`
    // are not conditional, and his lids stay open (status 11 never raises P+0x5d02).
    '3|Motion[19]': { dead: true },
    '3|Motion[18]': { dead: true },
  },
  // BULLDROME (em030_00): E:\offline\decode\notes\states-em030_00.md, read and ROM-run by the Bulldrome decode
  // agent (2026-09-25). **His model never changes, for any state.** `em030_00.arc` ships NO `.mpm` at all (27
  // enemy files, no entry of type 0x7cd0e77e), the class contains ZERO `setVisibleGroup` calls, `+0x210` is
  // `bx lr`, and it never calls a material function either -- so there is not one set in this table, and there
  // cannot be. It is motion and effects only, and that is the ROM, not a gap.
  //   HE HAS NO BREAKS AND NO SEVER: the .dtp row count is 0, no part has a .dtt second counter, and his option
  //   descriptor has -1 in both slots. HIS EYES CANNOT SHUT either -- the class never calls 0x71398, so the eye
  //   applier asks for set 0, which does not exist, and P+0x5d02 changes nothing on him.
  //   HIS BREAK LEVEL IS STILL READ, by a slot nobody else uses this way: `vtable +0x1fc` rewrites (10, 7) into
  //   (10, 0) when `breakLevel(head) % 3 != 0`, so a depletion knocks him down on levels 0/3/6/9 and gives a short
  //   flinch otherwise. Nothing is drawn differently either way, so no row shows it.
  //   THE ANIMATION IS BULLFANGO'S, the other way round from Gravios and Basarios: `ems013_00_2.lmt` and
  //   `em030_00_2.lmt` are byte-identical and lists 0 and 3 are strict supersets of Bullfango's, the ten extra clips
  //   being exactly what his extra states need. The classes share nothing.
  // NO RAGE ROW AT ALL: his command group 6 stream 0 is the single byte `ff`, an empty stream, so rage has no entry
  //   action and no motion means it -- the flag, the timer and the 1.1 motion rate still run underneath, and the
  //   shared puff (RAGE_PUFF below, off the Enraged toggle) is the whole of what it shows.
  em030_00: {
    // L3 M11 CARRIES THREE STATES, so each play shows the next: PARALYSIS ((10, 0x1f), c 1101 every 60), the STUN
    // ((10, 0x20) -- LITERALLY the same script as the paralysis, 0x17b8430, and not sided -- c 1103 into one held
    // handle, a record with NO JOINT at all) and the SHOCK TRAP ((10, 0x6e), c 1105 every 42). The pitfall holds it
    // too and requests nothing.
    '3|Motion[11]': { cycle: [{ every: [['em030_00c', 1101], 60] },
                              { hold: ['em030_00c', 1103] },
                              { every: [['em030_00c', 1105], 42] }] },
    // THE tune+0x44 STATUS (INFERRED exhaust): (10, 0x1b) plays L3 M1, which requests c 1109 once at frame 0.
    // L3 M1 is also the short-flinch depletion reaction, which shows nothing.
    '3|Motion[1]':  { start: [['em030_00c', 1109]] },
    // TIRED: the tired idle (0, 2) is L0 M15, a clip of its own, with drool c 1104 every 48 and the puff's
    // countdown zeroed while calm and tired.
    '0|Motion[15]': { rage: false, tired: true, every: [['em030_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) and (10, 0x1e) are the same clip, L3 M13, the second entry starting from frame 162 -- so
    // one row carries both, with the zzz c 1102 every 90 and the puff paused. NO eye set: he has none. L3 M13 is
    // also CAPTURE ((11, 0x10)).
    '3|Motion[13]': { every: [['em030_00c', 1102], 90], puffOff: true },
    // DEATH: the chain is L3 M6 -> L3 M8 from f56 -> L3 M9, and L3 M9 is death's alone -- L3 M6 and L3 M8 are the
    // depletion reaction's own clips. (11, 7) / (11, 0x12) hold L3 M11, the ailments' clip, so they are not marked:
    // marking them would put a death on the paralysis. Nothing reverts at death, because nothing ever changed.
    '3|Motion[9]':  { dead: true, settled: true },
  },
  // LAVASIOTH (em036_00): E:\offline\decode\notes\states-em036_00.md, read and ROM-run by the Lavasioth decode
  // agent (2026-09-25). The piscine-wyvern family question came out the same way a third time: `uEm036_00` (vtable
  // 0x17baff4) overrides 28 function slots and NOT ONE address is shared with Plesioth or Cephadrome, and no motion
  // file is shared either -- the same template compiled three times. What he does borrow is EFFECTS, and by biome
  // rather than family: Agnaktor's and Uragaan's records sit in his pel files.
  //   HIS MAGMA IS A MATERIAL MACHINE DRIVEN BY TIREDNESS, Glavenus's shape rather than Gammoth's. The part pass
  //   finds two additive materials by runtime id -- `XfB_0__m01_add_uv` and `XfB_0__m02_add` -- and plays `Magma`
  //   (180 f, looping), `Magma_stop` (60 f, one-shot) and a third clip whose name is NOT READ, off the bytes
  //   `e+0xcac5` / `e+0xcac6`. The input is `0x81614` (tired) and nothing else: no gauge, no counter, no rage.
  //   WHICH IS WHY HIS BREAKS HAVE TWO FORMS: the body break is set 2 -> 4 while the magma flows and set 8 -> 9
  //   while it is stopped, the head break 1 -> 3 and 6 -> 7. `levels` takes one axis and an optional { calm,
  //   enraged } pair; the second axis here is TIREDNESS, so the rows below wire the FLOWING form -- what he is in
  //   almost always -- and the stopped form is written here rather than shown. BOTH ROWS ARE AT LEVEL 2 at both
  //   ranks, and `em036_00u` has no key 1000 and no key 1030, so the first depletion of either is genuinely
  //   invisible.
  //   HE HAS NO TAIL SEVER: dtt part 7 has a second counter (limit 1, base 320) and running it out plays a
  //   reaction, but there is no 0xc2274 call, no u 900 and his option descriptor has -1 where a model would be --
  //   so the counter runs out and NOTHING happens. And his eye-set fields are all -1 (0x71398 is never called), so
  //   sleep shows nothing on him either.
  // NOT WIRED, stated instead: the magma going out at DEATH. `vtable +0x3f4` returns 1 at status 0xb, the one-shots
  //   then run, and about SIXTY FRAMES into the death clip every additive magma mesh (groups 20, 21, 22, 121, 122)
  //   switches off and the body goes dark. The table applies a death row's sets at frame 0, so showing it would be
  //   a second early; the `dead` rows carry no sets and the ramp is on the record here.
  //   Also not wired: the SHELL DURABILITY (`P+0x5d30`, armed to 120 x quest scale, chippable only while
  //   `P+0x5d34 == 0`). Emptying it sends reaction 0x1c -> (10, 0xaf) -> L3 M2 and refills the counter, and it
  //   changes NOTHING on the model -- so L3 M2 carries the states that do.
  em036_00: {
    // L3 M1 CARRIES NOTHING, and that is read rather than assumed: the status-10 dispatcher plays it for (10, 7)
    // with parts 1, 2, 3, 4, 5 and 7 -- the pectoral fins, the pelvic fins at an odd level, the neck and the tail,
    // none of which has a .dtp row -- and for (10, 0x72), (10, 0xbd), (10, 0xbe) and (10, 0xc5). Parts 0 and 6, the
    // two that DO break, take L3 M2 on that route instead (states-em036_00.md 3.3). So there is no row for it.
    // L3 M2 IS THE HEAD BREAK, THE SHOCK TRAP AND THE EXHAUST STATUS (and the magma shell's reaction, which shows
    // nothing), so each play shows the next. The head is at LEVEL 2: set 1 -> 3 (groups 1 on, 21 on, 101 off,
    // 121 off) firing u 1031 on joint 2. Then (10, 0x6e), which plays L3 M2 to frame 60 and holds L3 M9, with
    // c 1105 every 42; then (10, 0x1b)'s c 1109 once at frame 0.
    '3|Motion[2]':  { cycle: [{ levels: [[1], [1], [3]], fire: [null, null, ['em036_00u', 1031]] },
                              { every: [['em036_00c', 1105], 42] },
                              { start: [['em036_00c', 1109]] }] },
    // RAGE: EMC group 6 stream 0 issues (1, 0x2c) -- L0 M2, which is also the clip of (1, 2). Nothing at all
    // changes on the model: the part pass never reads isEnraged, there is no eye change, +0x2a0 is the base
    // `bx lr`, and the magma clips do not look at rage. The puff is the whole of it.
    '0|Motion[2]':  { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M39, with drool c 1104 every 48 -- one of the few records carrying a
    // rotation, (90, 0, 0) -- and the puff's countdown zeroed. THIS IS THE STATE THAT STOPS HIS MAGMA (the block
    // comment); the clip is as much of it as the table can show.
    '0|Motion[39]': { rage: false, tired: true, every: [['em036_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M10 lies down and (10, 0x1e) holds L3 M17, with the zzz c 1102 every 90 (cm200_002 on
    // JOINT 2) and the puff paused. NO ROW FOR L3 M10, the falling-asleep clip: he has no eye sets, so it shows
    // nothing and an empty spec would only claim it does. L3 M10 -> L3 M17 is also CAPTURE ((11, 0x10)).
    '3|Motion[17]': { every: [['em036_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M9; c 1101 every 60 (cm200_001 on joint 1 at 5x), first at once. L3 M9 is also
    // the shock trap's hold, whose own record sits on L3 M2 above.
    '3|Motion[9]':  { every: [['em036_00c', 1101], 60] },
    // THE STUN, both directions: (10, 0x20) plays L3 M3 -> L3 M4 (held) -> L3 M5 for direction 2 and L3 M6 ->
    // L3 M7 -> L3 M8 for every other, with c 1103 (cm200_003 on joint 3 at 0.8x) in one held handle, stopped at
    // (10, 0x2b)'s L3 M11. Those six clips are also the pelvic fins' even-level depletion chains, which show
    // nothing.
    '3|Motion[3]':  { hold: ['em036_00c', 1103] },
    '3|Motion[4]':  { hold: ['em036_00c', 1103] },
    '3|Motion[5]':  { hold: ['em036_00c', 1103] },
    // L3 M6 IS THE BODY BREAK AND THE STUN, so each play shows the next. (10, 0x14) with part 0 plays
    // L3 M6 -> M7 x4 -> M8, and `vtable +0x23c` sends part 0 there only while its break level EQUALS the .dtp
    // threshold (2) -- so this chain IS the break landing, which is why it carries `at: 2`. Set 2 -> 4 (groups 2
    // on, 22 on, 102 off, 122 off), firing u 1001 (cm202_060 on joint 1, offset (0, 140, 0)). The same three clips
    // are part 4's even-level chain, which shows nothing.
    '3|Motion[6]':  { cycle: [{ levels: [[2], [2], [4]], at: 2, fire: [null, null, ['em036_00u', 1001]] },
                              { hold: ['em036_00c', 1103] }] },
    '3|Motion[7]':  { hold: ['em036_00c', 1103] },
    '3|Motion[8]':  { hold: ['em036_00c', 1103] },
    // DEATH: L3 M12 for (11, 0), (11, 2), (11, 4), (11, 5) and every number the status-11 table does not name (and
    // as the tail of (11, 6), after L3 M4), and L3 M16 for (11, 7) / (11, 0x12). The break sets stay and his eyes
    // cannot change; the magma going dark sixty frames in is in the block comment.
    '3|Motion[12]': { dead: true },
    '3|Motion[16]': { dead: true },
  },
  // BARROTH (em044_00): E:\offline\decode\notes\states-em044_00.md, read and ROM-run by the Barroth decode agent
  // (2026-09-25). His class `uEm044_00` (vtable 0x17c1434) runs him alone -- Jade Barroth is not extracted and the
  // class has no variant branch.
  //   HIS MUD IS ONE BYTE, `e+0xcada`, bit per part: six .mpm pairs over the six meshes that are the only members
  //   of `XfB_N__E_m00_mbody`. It comes OFF on EVERY depletion of that part -- `vtable +0x24c` runs at the head of
  //   the shared break routine 0x99edc, so a hit that does not break still strips the mud and fires that part's
  //   own record (u 100 / 110 / 120 / 130 / 140 / 150, all em044_00_006 on the part's joint) -- and it comes BACK
  //   ALL AT ONCE on L4 M3 (burrowed) and L4 M7 (climbing out), except on a part that is broken. **No material
  //   clip anywhere in the class**, which is the opposite of Gammoth's snow: hers regrows through `snow_saisei`
  //   and has five rungs a limb walks down; his is on or off and a wallow puts it all back.
  //   HE HAS ONE BREAK ROW AND TWO SEVERS. The row is the forelegs (part 2, level 1, u 1010) -- and the foreleg
  //   break and the foreleg mud-shed are the SAME EVENT, both on joint 100 at (0, -250, 0), so that motion fires
  //   two records in one frame. The severs are two `.dtt` second counters that both route to (10, 0x72): part 0
  //   BREAKS HIS HEAD OFF (base 200, once -- set 4, the 176-vertex m00_head mesh gone, and u 901) and part 5 cuts
  //   the tail (base 300, once -- set 8, and u 900). His uEnemyOption descriptor 0x159b3bc has BOTH option words
  //   non-negative, the first monster we have read with two.
  // NOT WIRED, and raised rather than approximated: **the head piece**. `CUT_TAIL` carries one `piece` per monster
  //   and index.html's stepCutTail flies that one, so his slot-1 `em044_00_head` has nowhere to go; only the tail
  //   (slot 0, `em044_00_tail`, joint 142) is wired, and the head break shows its set and fires its record without
  //   dropping anything. A second piece needs index.html, which is not this session's to edit.
  em044_00: {
    // L3 M2 IS THREE DEPLETIONS, so each play shows the next: the HEAD's mud (set 10, u 100 on joint 3), the BACK's
    // (set 14, u 110 on joint 13) and the FORELEGS -- which are his one break as well, so that spec shows the mud
    // gone at both levels (set 12) and the broken leg at level 1 (set 6), fires u 120 for the mud every time
    // (`start`, because the mud goes on any depletion) and u 1010 for the break only at level 1.
    '3|Motion[2]':  { cycle: [{ sets: [10], start: [['em044_00u', 100]] },
                              { sets: [14], start: [['em044_00u', 110]] },
                              { levels: [[12, 5], [12, 6]], fire: [null, ['em044_00u', 1010]], start: [['em044_00u', 120]] }] },
    // THE HIND LEGS' mud, one clip each way. L3 M5 -> (240 f) L3 M7 -> L3 M9 is the -X leg (set 18, u 140 on joint
    // 19) and L3 M6 -> L3 M8 -> L3 M10 the +X (set 16, u 130 on joint 15) -- and those same six clips are the
    // STUN's two chains ((10, 0x20), sided), so the mud and the stun take turns on the first clip of each and the
    // rest of each chain carries the stun's held record.
    '3|Motion[5]':  { cycle: [{ sets: [18], start: [['em044_00u', 140]] }, { hold: ['em044_00c', 1103] }] },
    '3|Motion[6]':  { cycle: [{ sets: [16], start: [['em044_00u', 130]] }, { hold: ['em044_00c', 1103] }] },
    '3|Motion[7]':  { hold: ['em044_00c', 1103] },
    '3|Motion[8]':  { hold: ['em044_00c', 1103] },
    '3|Motion[9]':  { hold: ['em044_00c', 1103] },
    '3|Motion[10]': { hold: ['em044_00c', 1103] },
    // THE SAME HIND-LEG DEPLETIONS WHILE ENRAGED take (10, 0xe) and their own clips, which nothing else uses:
    // L3 M3 for part 3 and L3 M4 for part 4. (Tired takes (10, 0x14) back onto L3 M5 / L3 M6 above.)
    '3|Motion[3]':  { sets: [18], start: [['em044_00u', 140]] },
    '3|Motion[4]':  { sets: [16], start: [['em044_00u', 130]] },
    // THE TAIL's mud, on its durability depletion: set 20 and u 150 on joint 143.
    '3|Motion[17]': { sets: [20], start: [['em044_00u', 150]] },
    // HIS HEAD BREAKS OFF: (10, 0x72) with part 0 plays L3 M1 -- set 4 (group 3, the head mesh, off; group 4, a
    // 58-vertex body mesh, on) and the head-mud bit forced gone with it (set 10), firing u 901 (cm202_060 on joint
    // 3, offset (0, 80, 150) at 0.8x). L3 M1 is also the tune+0x44 status's reaction ((10, 0x1b), c 1109 once at
    // frame 0), so the two take turns.
    '3|Motion[1]':  { cycle: [{ levels: [[3, 9], [4, 10]], fire: [null, ['em044_00u', 901]] },
                              { start: [['em044_00c', 1109]] }] },
    // THE TAIL SEVER: (10, 0x72) with part 5 plays L3 M16 -- set 8 (group 12, the 25-vertex stump, on; group 101,
    // the tail, off) with the tail mud forced gone (set 20), firing u 900 (cm202_062 on JOINT 142). His cut tail is
    // uEnemyOption slot 0 and it drops (CUT_TAIL.em044_00).
    '3|Motion[16]': { levels: [[19, 7], [20, 8]], fire: [null, ['em044_00u', 900]], drops: true },
    // THE MUD RE-COAT: (6, 7) / (6, 8) / (6, 0xa) / (6, 0xc) / (6, 0xd) play L4 M3 burrowed and (1, 7) / (1, 0x14)
    // play L4 M7 climbing out of the wallow; both put ALL SIX mud groups back on. A broken part keeps its break --
    // the ROM skips those three -- which the user's own rows hold here, since these sets name only the mud.
    '4|Motion[3]':  { sets: [9, 11, 13, 15, 17, 19] },
    '4|Motion[7]':  { sets: [9, 11, 13, 15, 17, 19] },
    // BURROWED TRAVEL: (6, 3) / (6, 6) / (6, 0xe) play L0 M6, and the shared 0xa499c starts u 1400 (cm202_005 on
    // joint 2 at 0.9x) SUSTAINED, killing the previous handle at e+0xb7c4 first -- so it is held while the motion
    // plays rather than fired.
    '0|Motion[6]':  { hold: ['em044_00u', 1400] },
    // RAGE: command group 6's body issues (1, 2) -- L0 M11 from frame 0, 4.783 s, cross-checked against the .mdd's
    // PartsChangeActSt/No = 1/2. NOTHING on the model changes: the part pass never reads isEnraged. L0 M11 is also
    // the recovery clip of the paralysis, the stun and the shock trap ((10, 0x2a) / (10, 0x2b) / (10, 0x70)); the
    // rage entry is what it is shown as.
    '0|Motion[11]': { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M10, a clip of its own (his combat idle (0, 1) is L0 M2), with drool
    // c 1104 every 48 (cm200_006 on joint 3, pos (0, -50, 100) at 1.5x) and the puff's countdown zeroed.
    '0|Motion[10]': { rage: false, tired: true, every: [['em044_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M13 lies down and (10, 0x1e) holds L3 M14. His eyes DO shut -- set 2 -> set 1 (group 1,
    // the 14-vertex lid, drawn) -- while P+0x5d02 is up, with the zzz c 1102 every 90 and the puff paused.
    // L3 M13 -> L3 M14 is also CAPTURE ((11, 0x10)); sleep is what they show.
    '3|Motion[13]': { sets: [1] },
    '3|Motion[14]': { sets: [1], every: [['em044_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M15; c 1101 every 60 (cm200_001 on joint 1, offset (0, -100, 0) at 5x), first
    // at once. L3 M15 is also the shock trap's hold, whose own record sits on its first clip below.
    '3|Motion[15]': { every: [['em044_00c', 1101], 60] },
    // SHOCK TRAP: (10, 0x6e) plays L3 M11 to frame 60 and then holds L3 M15; c 1105 every 42 while it lasts.
    '3|Motion[11]': { every: [['em044_00c', 1105], 42] },
    // DEATH: L3 M12 for (11, 0) and every number the status-11 table does not name -- and for (11, 1), which is the
    // same script at mode 1 -- and L3 M20 for (11, 7) / (11, 0x12). THE MUD STATE, the break sets and both severs
    // stay exactly as they were, and his eyes stay open (status 11 never raises P+0x5d02).
    '3|Motion[12]': { dead: true },
    '3|Motion[20]': { dead: true },
  },
  // ROYAL LUDROTH (em047_00): E:\offline\decode\notes\states-em047_00.md, read and ROM-run by the Royal Ludroth
  // decode agent (2026-09-25). No sibling: em046 Ludroth is a small monster with its own class, and there is no
  // subspecies in the ROM.
  //   HIS SPONGE IS A JOINT SCALE TIED TO TIREDNESS, not a mesh or a material. A single f32 `e+0xcae0` walks
  //   1.0 <-> 0.7 at 0.005 a frame (60 frames), DOWN while `0x81614` (tired) is set and up while it is not, and
  //   `vtable +0x2a0` writes it as the scale of bones 200 / 201 / 202 -- the bones the mane pair and 1045 sponge
  //   vertices are skinned to -- as (s, s, 1.0). Its only input is the tired flag: no water test, no soak counter,
  //   no rage, no material, and no break forces it. The same flag also rewrites `P+0x3b4` bit 0x8000 every frame,
  //   which removes the 160-radius mane hit capsule while he is dry -- the first monster we have read that
  //   consumes that bit (the hit-zone agent's, noted here because it is the same one flag).
  //   RAGE MOVES HIS HEAD, NOT HIS MESH: five 16-bit angles sweep bones 203 / 204 / 205 (the three frills) from
  //   -30 / (-25, -25) / (-25, +25) degrees to 0 over exactly 20 frames and back again when it clears.
  //   NEITHER IS WIRED HERE. `JOINT_SCALE` is keyed on `while: 'rage' | 'alive'` and index.html decides what to
  //   pass it, so a `while: 'tired'` entry and a ROTATION ramp are both viewer changes outside this file; they are
  //   written down instead. What IS wired is everything the sets and the records cover.
  // AND HE HAS NO RAGE ROW, for a reason worth stating: his rage entry action (1, 2) plays **L0 M2, which is also
  //   his combat idle** ((0, 1)) -- the real roar, L0 M14, is action (1, 1) and is never issued. A rage row on his
  //   idle would show rage every time the idle is played, which is the opposite of the truth most of the time, so
  //   the Enraged toggle is left to drive it (his `_autoOnRage` listing is what makes that work).
  em047_00: {
    // THE HEAD, at level 1: (10, 7) with part 0 plays L3 M1 -- set 2 -> 7 (group 101 off, 4 on: the three head
    // frills, 213 + 50 vertices, replaced by 52-vertex stubs) -- firing u 1000 (cm202_060 on joint 2 at 0.8x).
    '3|Motion[1]':  { levels: [[2], [7]], fire: [null, ['em047_00u', 1000]] },
    // L3 M2 IS THE MANE BREAK, THE SHOCK TRAP AND THE EXHAUST STATUS. The mane is at LEVEL 2 (level 1 shows
    // nothing): set 3 -> 8 (group 102 off, 6 on -- the sponge loses 481 + 133 vertices for 177), firing u 1006 on
    // JOINT 101. Then (10, 0x6e), which plays L3 M2 to frame 80 and holds L3 M9, with c 1105 every 42; then
    // (10, 0x1b)'s c 1109 once at frame 0. His body and tail depletions play it too and show nothing.
    '3|Motion[2]':  { cycle: [{ levels: [[3], [3], [8]], fire: [null, null, ['em047_00u', 1006]] },
                              { every: [['em047_00c', 1105], 42] },
                              { start: [['em047_00c', 1109]] }] },
    // THE TAIL SEVER: part 5's second counter (base 300, once) -> (10, 0x72) on L3 M13, after a turn. Set 4 -> 9
    // (group 103 off, 8 on -- 223 + 124 vertices for a 14-vertex stump) and u 900 (cm202_062 on joint 143). His cut
    // tail exists and em047_00_tail.glb is staged, so it drops (CUT_TAIL.em047_00).
    '3|Motion[13]': { levels: [[4], [9]], fire: [null, ['em047_00u', 900]], drops: true },
    // TIRED: the tired idle (0, 2) is L0 M9, a clip of its own, with drool c 1104 every 48 (cm200_006 on joint 2)
    // and the puff's countdown zeroed. THE SPONGE DRIES OUT WHILE THIS STATE LASTS -- see the block comment; the
    // clip is all this row can show of it.
    '0|Motion[9]':  { rage: false, tired: true, every: [['em047_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M10 lies down and (10, 0x1e) holds L0 M15. His eyes shut -- set 1 -> set 5 (group 1
    // off, 2 on: the 22-vertex body-material lid instead of the 38-vertex eye) -- while P+0x5d02 is up, with the
    // zzz c 1102 every 90 and the puff paused. L3 M10 -> L0 M15 is also CAPTURE ((11, 0x10)).
    '3|Motion[10]': { sets: [5] },
    '0|Motion[15]': { sets: [5], every: [['em047_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M9; c 1101 every 60 (cm200_001 on joint 1 at (4, 5, 5)), first at once. L3 M9
    // is also the shock trap's hold, whose own record sits on L3 M2 above.
    '3|Motion[9]':  { every: [['em047_00c', 1101], 60] },
    // THE STUN, his only sided reaction: (10, 0x20) plays L3 M6 -> L3 M7 (held) -> L3 M8 for direction 1 and
    // L3 M3 -> L3 M4 -> L3 M5 for direction 2, with c 1103 (cm200_003 on joint 2 at 0.9x, axisMask 1) in one held
    // handle, stopped at (10, 0x2b)'s L3 M11. All six clips are also the limbs' depletion chains, which show
    // nothing.
    '3|Motion[3]':  { hold: ['em047_00c', 1103] },
    '3|Motion[4]':  { hold: ['em047_00c', 1103] },
    '3|Motion[5]':  { hold: ['em047_00c', 1103] },
    '3|Motion[6]':  { hold: ['em047_00c', 1103] },
    '3|Motion[7]':  { hold: ['em047_00c', 1103] },
    '3|Motion[8]':  { hold: ['em047_00c', 1103] },
    // DEATH: L3 M12 (10.017 s) for (11, 0) and every number the status-11 table does not name, and L3 M17 for
    // (11, 7) / (11, 0x12). The break sets and the sever stay and his eyes stay open; what death does is clear the
    // rage flag, after which his frills sweep back to calm over 20 frames -- a ramp this table cannot draw.
    '3|Motion[12]': { dead: true },
    '3|Motion[17]': { dead: true },
  },
  // ALATREON (em050_00): E:\offline\decode\notes\states-em050_00.md, read and ROM-run by the Alatreon decode agent
  // (2026-09-25). `uEm050_00`, vtable 0x17c7254.
  //   HIS FORM BYTE `P+0x1bb` TAKES THREE VALUES, NOT TWO, and it is a state written at FRAME 0 of six specific
  //   actions by the on-action-start hook -- not an edge and not a per-frame re-read. Form 0 is the spawn/reset and
  //   the big knockdown, form 1 is (1, 3) -> L0 M15, form 2 is (4, 0xa) -> the L1 M16 chain, the BLUE form. And
  //   EVERYTHING THAT READS THE BYTE TESTS `== 2`, so forms 0 and 1 are indistinguishable on the model: form 1 is a
  //   real state with no appearance of its own. The viewer's two-rung form control is therefore right as a control
  //   and incomplete as a model, which is worth knowing before anyone "adds the third rung".
  //   THE FORM IS NOT WIRED HERE. The glow is a 13-stage material machine on `XfB__m03_add` (red_Loop / red_End /
  //   blue_Change / blue_Loop / blue_End / red_Change) and monster.js already drives the blue half off the form
  //   rung, so a `clips` entry here would double-drive it; the hit-zone table it also switches is the hit-zone
  //   agent's. The three form-changing motions carry no row.
  //   HE HAS NO TIRED STATE AT ALL (`P+0x1a8` bit 19 makes the shared stamina updater return on its first
  //   instruction and his stamina block is NULL), and NO SHOCK TRAP, NO PITFALL and NO tune+0x44 status -- those
  //   status-10 numbers have no handler and fall to the idle chooser. Read, not assumed.
  //   HIS BREAK ROUTING IS BY PARITY: an ODD break level plays L3 M1 ((10, 7)) and an EVEN one the L3 M12 chain
  //   ((10, 0xe)). His head has rows at level 1 AND level 2, so one horn breaks on the odd route and both on the
  //   even one; every other part's row is at level 2, so they all land on L3 M12.
  em050_00: {
    // THE FIRST HORN, at level 1 -- the odd route: set 1 -> 11 (groups 2 on, 24 on, 101 off), firing u 1000 on
    // joint 4. Every part plays L3 M1 at an odd level; only the head has a row there.
    '3|Motion[1]':  { levels: [[1, 2], [11, 2], [13, 12]], at: 1, fire: [null, ['em050_00u', 1000], null] },
    // THE EVEN ROUTE, L3 M12, carries FIVE breaks, so each play shows the next: BOTH HORNS (set 11 -> 13 and set 2
    // -> 12 together, u 1001), the -X wing (set 7 -> 16, u 1021 on JOINT 63), the +X wing (set 8 -> 17, u 1016 on
    // JOINT 74), the -X front leg (set 5 -> 14, u 1031 on joint 9) and the +X front leg (set 6 -> 15, u 1026 on
    // joint 13). L3 M12 is also the STUN's first clip ((10, 0x20) -> L3 M12 -> L3 M6 held -> L3 M7), whose held
    // record sits on those two clips below.
    //   NOT SHOWN, and worth knowing: a wing break also moves that membrane material's ALPHA-TEST REFERENCE from
    //   20 to 150 (MRL ids 0x32 / 0x33) -- the same mechanism render/monster.js's ROM_BREAK_ALPHA already carries
    //   for the Rath line, independently re-derived here on him.
    '3|Motion[12]': { cycle: [{ levels: [[1, 2], [11, 2], [13, 12]], at: 2, fire: [null, null, ['em050_00u', 1001]] },
                              { levels: [[7], [16]], fire: [null, ['em050_00u', 1021]] },
                              { levels: [[8], [17]], fire: [null, ['em050_00u', 1016]] },
                              { levels: [[5], [14]], fire: [null, ['em050_00u', 1031]] },
                              { levels: [[6], [15]], fire: [null, ['em050_00u', 1026]] }] },
    // THE TAIL SEVER: part 7's second counter (base 300, once) -> (10, 0x72) plays L3 M13 -> L3 M10. Set 3 -> 10
    // (group 13 on, 103 off) and u 900 (cm202_062 on JOINT 144). His tail has no .dtp row, so there is no broken
    // level -- only the sever -- and his cut-tail model ships, so it drops (CUT_TAIL.em050_00).
    '3|Motion[13]': { levels: [[3], [10]], fire: [null, ['em050_00u', 900]], drops: true },
    // RAGE: command group 6 stream 0's head issues (7, 0x1a) -- L0 M14, INFERRED the roar from the shared roar ring
    // its clip carries at f43. Nothing on the model changes with it. His puff is RAGE_PUFF below, and it is his
    // class's own, not the shared one.
    '0|Motion[14]': { rage: true },
    // ASLEEP: (10, 0x1d) plays L3 M11 to frame 228 and (10, 0x1e) holds the same clip -- so one row carries both.
    // His eyes shut -- set 4 -> set 9 (group 6, the 16-vertex lid, drawn) -- while P+0x5d02 is up, with the zzz
    // c 1102 every 90 and the puff paused.
    '3|Motion[11]': { sets: [9], every: [['em050_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M9; c 1101 every 60 (cm200_001 on joint 2 at 5.5x), first at once. He has no
    // shock trap to share the hold with -- the number has no case at all.
    '3|Motion[9]':  { every: [['em050_00c', 1101], 60] },
    // THE STUN: (10, 0x20) plays L3 M12 -> L3 M6 (held) -> L3 M7, with c 1103 (cm200_003 on joint 3, offset
    // (0, 80, 70)) in one held handle, stopped at (10, 0x2b)'s L3 M10. L3 M12 is the break route above, so the
    // stun's record lives on the two clips that are its alone.
    '3|Motion[6]':  { hold: ['em050_00c', 1103] },
    '3|Motion[7]':  { hold: ['em050_00c', 1103] },
    // DEATH: L3 M8 for (11, 0) and every number but 1 -- he has no status-11 table -- and the same clip ends the
    // air death ((11, 1), after L3 M4 -> M5 -> M6 -> M7). The break sets, the horn sets and the sever stay, his
    // eyes stay open, and THE GLOW KEEPS WHATEVER FORM IT WAS IN: nothing clears P+0x1bb at death.
    '3|Motion[8]':  { dead: true },
  },
  // NIBELSNARF (em056_00): E:\offline\decode\notes\states-em056_00.md, read and ROM-run by the Nibelsnarf decode
  // agent (2026-09-25). Cephadrome's note found five of HIS records pointing at Nibelsnarf's effect files; the
  // sharing stops there -- the classes are their own.
  //   FOUR BREAKS, and two of them route the other way round from everyone else's: the fore fins (.dtp rows 0 and
  //   1) are at level 1, which is ODD, and `vtable +0x23c` sends an odd level of parts 2..5 to (10, 0x14) rather
  //   than (10, 7) -- so each fin break plays its own three-clip chain, while the gill flaps (row 2) and the JAW
  //   (row 3) keep the ordinary (10, 7) on L3 M1.
  //   HIS JAW BREAK REMOVES 76 VERTICES AND PUTS NOTHING BACK (set 3 -> 9, group 4 off), which is the ROM, not a
  //   missing mesh -- the same shape as Blangonga's tail tip.
  //   AND HE HAS NO PITFALL AT ALL: the status-10 table has no case 0x60, 0x61 or 0x62; all three fall to the
  //   default, which is the idle chooser. Read, not assumed.
  // NOT WIRED, and stated instead:
  //   THE SAND CAMOUFLAGE. While `P+0x525 == 1` he is buried, set 6 -> 12 draws the 316-vertex `XfB_0__m03_gitai`
  //   sheet, and the class sets a material clip on it NAMED AFTER THE MAP AND AREA -- so what it looks like depends
  //   on stage data the viewer does not carry, and it is a state with no motion of its own (any action can be
  //   buried). Both halves put it outside this table.
  //   THE STUCK JAW is wired as far as it goes: (1, 0xe) plays L3 M23_loop and THE STATE IS THE CLIP -- no set, no
  //   material, nothing on the model -- so its row would show nothing and is left out, while the two clips around
  //   it that DO carry something are below.
  //   And his rage un-hides a hit capsule every frame (`P+0x3b4 & 0x4000` cleared while enraged), which is the
  //   hit-zone agent's, not a part set.
  em056_00: {
    // THE +X FORE FIN, its own chain off (10, 0x14): set 4 -> 10 (group 5 off, 6 on), firing u 1010 on JOINT 7.
    // The hind fins' odd-level depletions play the same three clips and show nothing.
    '3|Motion[8]':  { levels: [[4], [10]], fire: [null, ['em056_00u', 1010]] },
    // THE -X FORE FIN: set 5 -> 11 (group 7 off, 8 on), firing u 1015 on JOINT 12.
    '3|Motion[11]': { levels: [[5], [11]], fire: [null, ['em056_00u', 1015]] },
    // L3 M1 CARRIES THE GILL FLAPS, THE JAW AND THE EXHAUST STATUS, so each play shows the next: the gill flaps
    // (set 2 -> 8, group 2 off, 3 on, firing u 1030 -- cm202_061, not cm202_060, on JOINT 132), then the JAW
    // (set 3 -> 9, group 4 off with nothing in its place, firing u 1035 on joint 14 at (0, -50, 250)), then
    // (10, 0x1b)'s c 1109 once at frame 0. Every other depletion plays it too and shows nothing.
    '3|Motion[1]':  { cycle: [{ levels: [[2], [8]], fire: [null, ['em056_00u', 1030]] },
                              { levels: [[3], [9]], fire: [null, ['em056_00u', 1035]] },
                              { start: [['em056_00c', 1109]] }] },
    // SPITTING THE BOMB BACK OUT: (1, 9) plays L3 M19 -> L3 M20_loop and fires u 20 through the class's OWN key
    // table (its +0x1d0 override, id 1001 -> em056_00_025 on JOINT 135). The same two clips run for (10, 0x72)
    // with the handler's r1 = 0, which drops nothing and fires nothing -- so the spit is what they show.
    '3|Motion[19]': { start: [['em056_00u', 20]] },
    // RAGE: command group 6's tail issues (1, 0) -- L0 M7 -- and (1, 0x13), L0 M22, when he is in the sand (the
    // action remap). NOTHING on the model changes: no part set reads isEnraged, +0x2a0 is the base `bx lr`, and
    // his only material clip is the sand camouflage. The puff is the whole of it.
    '0|Motion[7]':  { rage: true },
    '0|Motion[22]': { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M9 on land and L0 M23_loop in the sand -- both clips of their own, not the
    // combat idle (L0 M14) or the calm one (L0 M1) -- with drool c 1104 every 48 and the puff's countdown zeroed.
    // L0 M23 is ALSO the stuck jaw's clip ((1, 0xe)), which shows nothing, so tiredness is what it carries.
    '0|Motion[9]':  { rage: false, tired: true, every: [['em056_00c', 1104], 48] },
    '0|Motion[23]': { rage: false, tired: true, every: [['em056_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M4 lies down and (10, 0x1e) holds L3 M5_loop. His eyes shut -- set 1 -> set 7 (group 1,
    // the 18-vertex lid, drawn) -- while P+0x5d02 is up, with the zzz c 1102 every 90 (cm200_002 on JOINT 134) and
    // the puff paused.
    '3|Motion[4]':  { sets: [7] },
    '3|Motion[5]':  { sets: [7], every: [['em056_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M3_loop; c 1101 every 60 (cm200_001 on joint 1 at 5x), first at once. L3 M3 is
    // also the shock trap's hold ((10, 0x6e) after an op 6): shown as paralysis, as every shared hold has been.
    '3|Motion[3]':  { every: [['em056_00c', 1101], 60] },
    // THE STUN: (10, 0x20) plays L3 M14 -> L3 M15_loop (held) -> L3 M16, with c 1103 (cm200_003 on joint 134 at
    // 0.6x, axisMask 1) in one held handle, stopped at (10, 0x2b).
    '3|Motion[14]': { hold: ['em056_00c', 1103] },
    '3|Motion[15]': { hold: ['em056_00c', 1103] },
    '3|Motion[16]': { hold: ['em056_00c', 1103] },
    // DEATH: L3 M7 (9.017 s) for (11, 0), (11, 6) and every number the status-11 table does not name, and L3 M24
    // for dying IN the stuck jaw (the death script's op-9 branch). The break sets stay, his eyes stay open, and
    // nothing reverts because rage changed nothing.
    '3|Motion[7]':  { dead: true },
    '3|Motion[24]': { dead: true },
  },
  // BRACHYDIOS (em063_00): E:\offline\decode\notes\states-em063_00.md, read and ROM-run by the Brachydios decode
  // agent (2026-09-25). **There is no `uEm063_05`**: one class, `uEm063_00` (vtable 0x17d92c4), runs him and Raging
  // Brachydios, and the part pass 0xf36dfc branches on `e+0xb5f5 == 5` in its fifth instruction -- the two halves
  // share no code. He and Raging also share all three .lmt files, the command table, both status dispatchers
  // (emulated for both variant bytes over 256 numbers x 8 parts x 8 directions: identical) and `em063_00c.pel`
  // itself, because the c file is per-em -- so every ailment record below is the one Raging already uses.
  //   HIS RAGE IS A GAUGE, NOT A FLAG. `[e+0xcacc]+0x84` climbs 1.0 a frame while enraged and drains 1.0 a frame
  //   while calm, clamped to [0, 40], and everything visible switches at **10.0** -- so the slime turns red about
  //   ten frames AFTER the roar and stays red up to thirty frames after rage ends, including into the death clip.
  //   The viewer shows the two steady states and not the lag, which is monster.js's ROM_RAGE_SET decision
  //   (`em063_00: [[0, 11], [2, 12]]`, the body slime and the head pair) and is why the rage row here carries no
  //   sets of its own.
  //   HIS SLIME COLOUR IS A MATERIAL PARAMETER THE CLASS WRITES BY HAND, not a clip: `findMatClipByName` is
  //   unreachable on the variant-0 path and the nine clip names at vtable +0x478 are Raging's. He writes parameter
  //   id 0x214 on materials 51 / 52 (the arms) -- U 0 -> 0.5 off the gauge, V off a per-arm level -- and a float
  //   on material 53 (the body) from a curve. The U-offset half is the same 0 -> 0.5 the viewer already makes for
  //   Raging; the arms' float is computed and then NEVER STORED BACK by the ROM (read at 0xf37204..0xf37248), so
  //   there is nothing there to show.
  //   HIS THREE BREAK ROWS ARE ALL AT LEVEL 2, with no level-1 record at all, and the head's break DRAWS
  //   DIFFERENTLY IN EACH COLOUR -- which is what the `{ calm, enraged }` form of `levels` is for.
  // NOT WIRED: the ten-frame lag in and the thirty-frame drain out (above), and the arm-slime curve, whose row is
  //   left degenerate because nothing in the class writes `ctl+0x20` / `+0x2c` -- the decode's own biggest open
  //   question, and not something to invent a timer for.
  em063_00: {
    // THE HEAD, at LEVEL 2 only ((10, 7) with part 0 or 7 -> L3 M6): green set 2 -> 7 (groups 1 off, 2 on, and the
    // head slime 10 off, 11 on), red set 12 -> 13 (1 off, 2 on, slime 13 off), firing u 1001 (cm202_060 on joint 3,
    // offset (0, 90, 270) at 1.1x). Level 1 shows nothing and fires nothing. L3 M6 also carries the tune+0x44
    // status ((10, 0x1b), c 1109 once at frame 0) and the SHOCK TRAP's first clip ((10, 0x6e) plays it to frame 50
    // and then holds L3 M11, with c 1105 every 42), so the three take turns.
    '3|Motion[6]':  { cycle: [{ levels: { calm: [[2], [2], [7]], enraged: [[12], [12], [13]] },
                                fire: [null, null, ['em063_00u', 1001]] },
                              { start: [['em063_00c', 1109]] },
                              { every: [['em063_00c', 1105], 42] }] },
    // THE ARMS, both at LEVEL 2, on one clip ((10, 7) with parts 1, 2, 3 -> L3 M1; part 1 changes nothing): part 2
    // takes set 4 -> 9 (groups 6 off, 7 on, slime 17 off, 18 on) firing u 1011, part 3 takes set 3 -> 8 (4 off,
    // 5 on, slime 15 off, 16 on) firing u 1016. THE JOINTS ARE CROSSED RELATIVE TO THE PARTS -- u 1011 is fired by
    // the part at x -110 and plays on joint 40 at x +110, u 1016 the mirror -- and that is authored data, not a
    // decode slip: three other ROM sources (the blast records, the hyper auras and 0xf35e2c) use the other pairing,
    // and Raging's file says the same. Left exactly as the ROM has it.
    '3|Motion[1]':  { cycle: [{ levels: [[4], [4], [9]], fire: [null, null, ['em063_00u', 1011]] },
                              { levels: [[3], [3], [8]], fire: [null, null, ['em063_00u', 1016]] }] },
    // THE TAIL SEVER: part 6's second counter -> (10, 0x72) on L3 M22. Set 5 -> 10 (group 8 on, 101 off) and u 900
    // (cm202_062 on joint 143 at 1.4x -- the ONE state record that differs from Raging's, whose scale is 1.0). His
    // cut tail exists and is staged (descriptor 0x1597a5c word[1] != -1, em063_00_tail.glb), so it drops.
    '3|Motion[22]': { levels: [[5], [10]], fire: [null, ['em063_00u', 900]], drops: true },
    // RAGE: command group 6 issues (1, 6) -- L0 M15, the 4.783 s roar, cross-checked against the .mdd's
    // PartsChangeActSt/No = 1/6. Nothing changes AT THAT INSTANT: the roar only starts the gauge climbing, and the
    // colour lands ten frames later (see the block comment). The puff runs while rage is shown.
    '0|Motion[15]': { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M14_loop, a clip of its own (his combat idle (0, 1) is L0 M3_loop), with
    // drool c 1104 every 48 -- one of the few records that carries a rotation, (70, 0, 0) -- and the puff zeroed.
    '0|Motion[14]': { rage: false, tired: true, every: [['em063_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M9 lies down and (10, 0x1e) holds L3 M10. His eyes shut -- eye set 1 -> set 6 (group
    // 19, the eyeball, off; group 3, the 18-vertex lid, on; RAGING'S ARE 2 / 1, so these are his own) -- while
    // P+0x5d02 is up, with the zzz c 1102 every 90 and the puff paused. L3 M9 -> L3 M10 is also CAPTURE.
    '3|Motion[9]':  { sets: [6] },
    '3|Motion[10]': { sets: [6], every: [['em063_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M11; c 1101 every 60 (cm200_001 on joint 1 at 4.5x), first at once. L3 M11 is
    // also the shock trap's hold, whose own record sits on L3 M6 above.
    '3|Motion[11]': { every: [['em063_00c', 1101], 60] },
    // THE STUN: (10, 0x20) plays L3 M5 -> L3 M21 (held) -> L3 M13 for EVERY part and direction -- he has no sided
    // reaction of any kind -- with c 1103 (cm200_003 on joint 3, offset (0, 0, 100) at 0.9x) in one held handle,
    // stopped at (10, 0x2b)'s L3 M27. Those three clips are also the +X hind leg's depletion chain, which shows
    // nothing.
    '3|Motion[5]':  { hold: ['em063_00c', 1103] },
    '3|Motion[21]': { hold: ['em063_00c', 1103] },
    '3|Motion[13]': { hold: ['em063_00c', 1103] },
    // DEATH: L3 M8 for (11, 0) and every number the status-11 table does not name, L3 M34 at the end of the
    // knockdown fall ((11, 1), after L3 M32 -> L3 M33) and L3 M19 for (11, 7) / (11, 0x12). The break sets and the
    // sever stay and his eyes stay open. What death really does to him is clear the rage flag, after which the
    // gauge drains and THE SLIME GOES RED TO GREEN OVER THE FIRST THIRTY FRAMES of the clip -- which `dead` gives
    // as an immediate switch, since ROM_RAGE_SET follows the rage shown and the table has no ramp.
    '3|Motion[8]':  { dead: true },
    '3|Motion[34]': { dead: true, settled: true },
    '3|Motion[19]': { dead: true },
  },
  // ZAMTRIOS (em067_00): E:\offline\decode\notes\states-em067_00.md, read and ROM-run by the Zamtrios decode agent
  // (2026-09-25), with both signature states settled under the emulator (`zpost.py` runs `vtable +0x204` for every
  // (status, number) x posture and reads the posture byte, the gauge and the armour counter back).
  //   HIS WHOLE SILHOUETTE HANGS OFF ONE BYTE: the posture `P+0x1bb & 3` -- 0 normal, 1 ICE ARMOUR, 2 BLOATED --
  //   and `vtable +0x2a8` rebuilds the drawn groups from it EVERY FRAME, zeroing `P+0x5cfc` and `P+0x3b4` first.
  //   So the armour and the bloat are states, not events, and the viewer would need a posture control to hold them;
  //   the two rows below show them going ON at their entry motions and nothing holds them after.
  //   THE ICE ARMOUR AND THE RAGE ROAR ARE THE SAME ACTION: (1, 0x42) -> L0 M4 sets posture 1 and is the only thing
  //   in the whole .emc that issues it, so the rage row below IS the armour row. Its ice set family is held off
  //   while the action AND the motion are both still that one -- it appears on the first frame either stops being
  //   true -- which is a timing the table cannot carry either.
  //   AN ARMOUR SECTION SHATTERING IS NOT A .dtp BREAK: `vtable +0x24c` (at the top of the shared break routine)
  //   sets one of four `ctl+0x04` bits, swaps that part's hit-zone row back and fires the CLASS's own ids 1001..1004
  //   -> keys u 1001 / 1031 / 1011 / 1016 (all em067_00_002, joints 4 / 142 / 9 / 13, scale 0.5). Those live on the
  //   reactions below; the ice sets they turn off belong to the posture, so the rows carry the record only.
  //   HE HAS NO EYE SETS AT ALL (`0x71398` is never called), so sleep shows nothing -- but he does have a DEATH eye
  //   swap, set 1 -> set 30, driven per frame by `vtable +0x3f4` rather than by P+0x5d02, which is why the death
  //   rows below carry sets where his sleep rows carry none.
  //   NO TAIL SEVER and NO CUT TAIL (no second counter, no (10, 0x72) case, both option slots -1).
  // NOT WIRED, stated instead: the BLOAT's material blend (parameter hash 0x7b2c216d walking 0.85 -> (1.0, 0.7) in
  //   three stages off the 4800-frame gauge) and its frame windows (the fat set swaps in at frame 120 of L4 M2, the
  //   ice re-applies at 130 and is gone the first frame he leaves the clip). A `clips` entry holds one clip from a
  //   motion's frame 0, so neither the stages nor the windows fit.
  em067_00: {
    // RAGE AND THE ICE ARMOUR, one action: (1, 0x42) -> L0 M4, which also holds the armour's HP ({400, 300, 200} by
    // how many times it has been rebuilt) and restores all four sections. L0 M4 is also the roar the EMC picks when
    // he is ALREADY armoured ((1, 0x10)), so the clip means rage either way.
    '0|Motion[4]':  { rage: true },
    // THE HEAD DEPLETION (level 1): set 3 -> 18 (group 11 off, 12 on), u 1000 on joint 4. L3 M2 also carries the
    // TAIL depletion -- which his +0x23c routes to (10, 0x14) rather than (10, 7) -- and the exhaust status, so the
    // three take turns.
    '3|Motion[2]':  { cycle: [{ levels: [[3], [18]], fire: [null, ['em067_00u', 1000]] },
                              { levels: [[2], [22]], fire: [null, ['em067_00u', 1030]] },
                              { start: [['em067_00c', 1109]] }] },
    // THE TOP FIN, at LEVEL 2: set 6 -> 21 (group 17 off, 18 on, 23 off), u 1006 on joint 1. L3 M1 is also the
    // leg / body depletion (no row, nothing shown) and one of the armour-shatter reactions ((10, 0xbd) / (10, 0xbe)),
    // whose records are the class's own -- so the fin break and one shatter record share it.
    '3|Motion[1]':  { cycle: [{ levels: [[6], [6], [21]], fire: [null, null, ['em067_00u', 1006]] },
                              { start: [['em067_00u', 1001]] }] },
    // THE ARMS: +X is L3 M4 -> (240 f) L3 M6 -> L3 M8 -> L3 M36 (set 4 -> 19, u 1010 on joint 9), -X is L3 M3 ->
    // L3 M5 -> L3 M7 -> L3 M35 (set 5 -> 20, u 1015 on joint 13). The -X chain's first three clips are also the
    // STUN's ((10, 0x20)), so the -X break and the stun share them -- and his ONE sided reaction is unreachable
    // anyway (his .dtb direction array is sixteen zeros, so the mirrored script is dead code).
    '3|Motion[4]':  { levels: [[4], [19]], fire: [null, ['em067_00u', 1010]] },
    '3|Motion[3]':  { cycle: [{ levels: [[5], [20]], fire: [null, ['em067_00u', 1015]] },
                              { hold: ['em067_00c', 1103] }] },
    '3|Motion[5]':  { hold: ['em067_00c', 1103] },
    '3|Motion[7]':  { hold: ['em067_00c', 1103] },
    // THE OTHER ARMOUR SHATTERS: (10, 0xa9) / (10, 0xab) / (10, 0xad) all play L3 M16, which is also the ailments'
    // recovery clip -- so the three shatter records take turns on it.
    '3|Motion[16]': { cycle: [{ start: [['em067_00u', 1031]] },
                              { start: [['em067_00u', 1011]] },
                              { start: [['em067_00u', 1016]] }] },
    // TIRED: the tired idle (0, 2) is L0 M14, a clip of its own, with drool c 1104 every 48 -- one of the few
    // records carrying a rotation, (70, 0, 0) -- and the puff's countdown zeroed.
    '0|Motion[14]': { rage: false, tired: true, every: [['em067_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M14 lies down and (10, 0x1e) holds L0 M19, with the zzz c 1102 every 90 and the puff
    // paused. NO eye set: he has none, and his only eye change is death's.
    '0|Motion[19]': { every: [['em067_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on joint 1 at 5x), first at once.
    '3|Motion[13]': { every: [['em067_00c', 1101], 60] },
    // DEATH: L3 M17 for (11, 0) and every number the death table does not name (and as the tail of (11, 6), after
    // L2 M18), L3 M30 at the end of (11, 3)'s pair, and L3 M20 for (11, 7) / (11, 0x12). THE EYES FLIP TO SET 30 --
    // his one eye change, and it is death's, not sleep's -- while the break sets stay and the posture byte is left
    // wherever it was, so a bloated or armoured Zamtrios dies bloated or armoured.
    '3|Motion[17]': { dead: true, sets: [30] },
    '3|Motion[30]': { dead: true, sets: [30], settled: true },
    '3|Motion[20]': { dead: true, sets: [30] },
  },
  // SELTAS QUEEN (em069_00): E:\offline\decode\notes\states-em069_00.md, read by the Seltas Queen decode agent
  // (2026-09-25). `uEm069_00`, vtable 0x17e0eb8. That note is a STATIC decode -- nothing in it is ROM-RUN -- and it
  // says so; the status-10 sweep is the thing an emulator pass would most improve, so treat the ailment rows below
  // as read rather than executed.
  //   SEVEN BREAK ROWS, ALL AT LEVEL 1 and none with a second level, at any rank: each member has exactly two
  //   states and swaps the first time its durability runs out. Six of them share ONE clip ((10, 7) -> L3 M1), so
  //   that row is a cycle; the head has L3 M2 to itself. A leg at break level 2 or more takes (10, 0x14) and a
  //   sided chain instead, and those chains show NOTHING NEW -- the pair already swapped at level 1 -- which is why
  //   they carry only the stun below.
  //   RAGE AND TIREDNESS ARE MATERIAL CLIPS, not mesh swaps: `XfB__m03_add` runs Angry_Start (60 f) -> Angry_Repeat
  //   (90 f loop) -> Angry_End (60 f), and `XfB__m01_eye` runs Stamina_low_Start / _End, which is how her eyes go
  //   dark when she is tired. Not one mesh group moves for either, so the rage row carries no sets.
  //   SHE HAS NO EYE SETS (the class never calls 0x71398, so the fields stay -1 and setVisibleGroup(-1) returns),
  //   and NO TAIL SEVER and NO CUT TAIL -- four independent reads say so, and her tail still BREAKS (u 1035); it
  //   simply never comes off.
  // NOT WIRED, stated instead:
  //   THE MALE SELTAS. While `(P+0x1bb >> 1) & 3` is non-zero he is coupled to her back: the stage holds one of
  //   u 0 / 1 / 2 (three byte-identical records) and `vtable +0x2a0` drives JOINTS 2..9 -- her four small forelimbs
  //   -- every frame from a per-motion matrix rather than from the clip. No .mpm set, no material, no break and no
  //   rage behaviour reads the coupling, so nothing of it belongs in a part table; the carried monster itself is
  //   the EMC agent's. The three records are exported but nothing drives them.
  //   HER TIRED DROOL. c 1104 is hers and fires every 48 frames while tired, but the note could not settle WHICH
  //   motion her tired idle is -- so there is no motion to hang it on, and inventing one would be worse than the
  //   gap. When that is read, it is a one-line row.
  em069_00: {
    // L3 M1 CARRIES SIX OF HER SEVEN BREAKS, each part swapping its own pair at level 1, and then the SHOCK TRAP's
    // first clip ((10, 0x6e) plays L3 M1 and holds L3 M13, with c 1105 every 42). Each play shows the next.
    // The records sit where the .pel puts them, which for the Smaller Legs is JOINT 1, the head -- not on the legs'
    // own joints. That is what the file says, and it is left as it is.
    '3|Motion[1]':  { cycle: [{ levels: [[2], [10]], fire: [null, ['em069_00u', 1005]] },      // smaller legs
                              { levels: [[3], [11]], fire: [null, ['em069_00u', 1010]] },      // +X front leg
                              { levels: [[6], [13]], fire: [null, ['em069_00u', 1015]] },      // +X rear leg
                              { levels: [[4], [12]], fire: [null, ['em069_00u', 1020]] },      // -X front leg
                              { levels: [[7], [14]], fire: [null, ['em069_00u', 1025]] },      // -X rear leg
                              { levels: [[5], [15]], fire: [null, ['em069_00u', 1035]] },      // the tail, which breaks and stays on
                              { every: [['em069_00c', 1105], 42] }] },
    // THE HEAD, on its own clip: set 1 -> 9 (group 1 off, 2 on), firing u 1030 on joint 1.
    '3|Motion[2]':  { levels: [[1], [9]], fire: [null, ['em069_00u', 1030]] },
    // RAGE: command group 6 stream 0 issues (1, 13) -- L0 M5, confirmed from the .mdd as well. NO MESH CHANGE AT
    // ALL; the Angry material clips are the whole of what it shows, and they are not this table's to drive.
    '0|Motion[5]':  { rage: true },
    // ASLEEP: (10, 0x1d) holds L3 M14 and (10, 0x1e) L0 M19_loop, with the zzz c 1102 every 90 and the puff paused.
    // No eye set -- she has none. L3 M14 -> L0 M19 is also CAPTURE ((11, 0x10)).
    '0|Motion[19]': { every: [['em069_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on JOINT 0 at 7x), first at once. L3 M13 is
    // also the shock trap's hold, whose own record sits on L3 M1 above.
    '3|Motion[13]': { every: [['em069_00c', 1101], 60] },
    // THE STUN, and it is NOT sided (her handler never reads the direction): (10, 0x20) plays L3 M26 -> L3 M6_loop
    // -> L3 M8, with c 1103 (cm200_003 on joint 1, offset (0, 0, 100) at 1.2x, axisMask 1) in one held handle,
    // stopped at (10, 0x2b)'s L3 M17. L3 M6 and L3 M8 are also the legs' level-2 chains, which show nothing new.
    '3|Motion[26]': { hold: ['em069_00c', 1103] },
    '3|Motion[6]':  { hold: ['em069_00c', 1103] },
    '3|Motion[8]':  { hold: ['em069_00c', 1103] },
    // THE tune+0x44 STATUS (INFERRED exhaust): (10, 0x1b) plays L3 M9, which requests c 1109 once at frame 0.
    '3|Motion[9]':  { start: [['em069_00c', 1109]] },
    // DEATH: L3 M51 for (11, 0), L3 M35 at the end of the chain for every number the table does not name (and for
    // the air death, after L3 M18), and L3 M36 for (11, 7) / (11, 0x12). The break sets stay, the coupling is
    // cleared, and the rage material runs Angry_End -- which `dead` gives by forcing the rage shown off.
    '3|Motion[51]': { dead: true },
    '3|Motion[35]': { dead: true, settled: true },
    '3|Motion[36]': { dead: true },
  },
  // SEREGIOS (em077_00): E:\offline\decode\notes\states-em077_00.md, read and ROM-run by the Seregios decode
  // agent (2026-09-25). `uEm077_00`, vtable 0x17e7c08, class 0xfda074..0xfee13c.
  //   HIS WHOLE CALM APPEARANCE IS COMPUTED, and that is new. Seven body regions each have a FLAT and an ERECT
  //   bladescale mesh variant, chosen by a seven-bit mask the class publishes into `P+0x5cfc` (0xfdfeec) and the
  //   part pass (vtable +0x210 = 0xfdf644) turns into groups EVERY FRAME. The mask comes from `ctl+0x68`, rebuilt
  //   at every action start from `e+0x5c0` (vtable +0x3d4 = 0xfedff0) -- and **WHAT WRITES `e+0x5c0` IS NOT
  //   READ**, so which clip raises which region is unknown. What IS read is the other input: `ctl+0x84`
  //   (vtable +0x2a8 = 0xfddc2c) is the RAGE FLAG, and when it is up 0xfdfeec sets all seven bits at once.
  //   So the calm sets below are what the calm branch writes BEFORE an unread mask could flip a region -- every
  //   region flat -- and the enraged sets are the ROM's own hard-coded "all seven erect" branch, which needs no
  //   mask at all. The flat/erect pairs that also carry a break sit in the four tables below; the regions that
  //   carry no break (the body swap 2 -> 14 and the defaults 3 -> 15) follow rage on every motion, so they are
  //   RAGE_PARTS.em077_00, as Barioth's pair is.
  //   FIVE BREAKABLE PARTS AND EVERY ONE OF THEM AT LEVEL 2, at every rank: `em077_00_dtbparts.dtp+0x64` has five
  //   rows (head, both wings, both hind legs) with level 2 at low, high and G and NO level-1 row anywhere, so the
  //   first depletion of any part plays a reaction and changes nothing at all. Parts 0, 5 and 7 have no row: they
  //   deplete, play a flinch, and never move a mesh. No monster wired so far defers every break to a second
  //   depletion.
  //   THE REACTION ROUTE IS CHOSEN BY BREAK-LEVEL PARITY, not by his state: `vtable +0x23c = 0xfdf558` returns 1
  //   for parts 3 and 4 when that leg's level is EVEN, which sends the break that lands (level 2) to the
  //   (10, 0x14) knock-down while the first depletion (level 1, odd) takes the light (10, 7) flinch. It never
  //   reads tiredness, where Barioth's does.
  // NOT WIRED, stated instead:
  //   c 1201, the notice LAPSING: it fires once when the combat byte falls back, and the note names no action or
  //   motion for that edge -- there is nothing to hang it on. c 1200, the notice itself, IS wired (L0 M5 below);
  //   no other monster here has a notice row because no other note read one.
  //   THE PITFALL ((10, 0x60) L3 M18 -> L3 M19 -> L1 M19 -> ...): no record, no set, nothing on the model.
  //   c 1100 poison, c 1106 / c 1108 paint and dung, c 1130..1137 blast, c 1500 shallow water: all real records
  //   in `em077_00c.pel`, none of them tied to a motion (7, 7.1) -- the timers that fire them are not states a
  //   clip shows, and c 1500 needs stage data the viewer does not have.
  //   THE SHELLS (ids 316 / 317 / 318, 36 spawn sites) -- the thrown bladescales that land and stick. They are
  //   the shell / EMC agents' area, and none of them is a mesh group or a state record.
  //   WITH BOTH WINGS BROKEN his move-set slot 5 switches tune table (0xfdf498 -> 0xbaafc): behaviour, not model.
  em077_00: {
    // L3 M3 WEARS THREE HATS, so each play shows the next: the +X WING's break at level 2 ((10, 7) with part 1
    // plays M3 -> 240 f -> M5 -> M7), the +X HIND LEG's ((10, 0x14) with part 3, the same three clips), and the
    // STUN for hit direction 2 -- every other direction takes the M4 side (7.2). Both breaks fire cm202_060
    // (u 1006 on joint 9, u 1016 on joint 80).
    '3|Motion[3]':  { cycle: [{ levels: S_WING_R, at: 2, fire: [null, null, ['em077_00u', 1006]] },
                              { levels: S_LEG_R,  at: 2, fire: [null, null, ['em077_00u', 1016]] },
                              { hold: ['em077_00c', 1103] }] },
    // L3 M4 IS THE MIRROR: the -X wing (u 1011 on joint 13), the -X hind leg (u 1021 on joint 92), and the stun
    // for directions 0, 1, 3..7.
    '3|Motion[4]':  { cycle: [{ levels: S_WING_L, at: 2, fire: [null, null, ['em077_00u', 1011]] },
                              { levels: S_LEG_L,  at: 2, fire: [null, null, ['em077_00u', 1021]] },
                              { hold: ['em077_00c', 1103] }] },
    // The rest of both chains, and the stun's held clips: c 1103 (cm200_003 on joint 3, offset (0, 0, 70) at
    // 0.8x, axisMask 1) in ONE held handle across the chain, stopped at (10, 0x2b)'s L3 M16. They show nothing
    // the first clip has not already shown.
    '3|Motion[5]':  { hold: ['em077_00c', 1103] },
    '3|Motion[6]':  { hold: ['em077_00c', 1103] },
    '3|Motion[7]':  { hold: ['em077_00c', 1103] },
    '3|Motion[8]':  { hold: ['em077_00c', 1103] },
    // THE HEAD, on the flinch clip: level 2 takes set 9 -> set 19 (group 42 on, 110 off, and the head's own pair
    // 38 -> 43 flat / 39 -> 44 erect), firing u 1031 on JOINT 200. L3 M1 is also the light flinch parts 3, 4 and
    // 6 take at an odd level, which shows nothing.
    '3|Motion[1]':  { levels: S_HEAD, at: 2, fire: [null, null, ['em077_00u', 1031]] },
    // THE TAIL SEVER: part 7's dtt second counter (base 300, once) -> (10, 0x72), whose start hook passes kind
    // 0x91 to 0xc2274 (`P+0x3b4 |= 1`) and plays L3 M15. Set 4 -> 24 flat / 16 -> 28 erect, and u 900
    // (cm202_062 on JOINT 144 at 0.7x). His cut tail is staged and flies on the Rath line's option poses
    // (CUT_TAIL.em077_00). His tail has NO .dtp row, so there is no broken level -- only the sever.
    '3|Motion[15]': { levels: S_TAIL, fire: [null, ['em077_00u', 900]], drops: true },
    // RAGE: command group 6 stream 0 issues (1, 9) on both branches -- L0 M4, blend 10. Read straight off
    // `P+0x518` every frame with no fade and no window: the body swaps (RAGE_PARTS) and all seven regions read
    // erect, so every table below takes its enraged column at whatever level the user has it. No material call
    // exists anywhere in the class and vtable +0x2a0 is `bx lr`; the 1.05 motion rate is not shown.
    '0|Motion[4]':  { rage: true, tables: [S_WING_R, S_WING_L, S_HEAD, S_TAIL] },
    // THE NOTICE: command group 4 stream 0 ends at (2, 9) = L0 M5, which requests c 1200 once (cm200_020 on
    // joint 3, offset (0, 80, 100), axisMask 1). Nothing on the model.
    '0|Motion[5]':  { start: [['em077_00c', 1200]] },
    // TIRED: the tired idle (0, 2) is L0 M14, a clip of its own rather than the combat idle L0 M2, with drool
    // c 1104 every 48 -- cm200_006 on joint 3 at 1.2x and, uniquely so far, **rot (70, 0, 0)**. Nothing on his
    // model changes when he tires; the part pass never reads the tired flag.
    '0|Motion[14]': { rage: false, tables: [S_WING_R, S_WING_L, S_HEAD, S_TAIL], every: [['em077_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) plays L3 M14 and (10, 0x1e) holds L0 M19, with the zzz c 1102 every 90 and the puff
    // paused. His eyes shut -- eye set 1 -> set 13 (group 1, the lid, drawn) -- while `P+0x5d02` is up. L3 M14 ->
    // L0 M19 is also CAPTURE ((11, 0x10)); sleep is what they show. The wake-up L0 M20 gets no row: WHEN
    // `P+0x5d02` FALLS IS NOT READ, so which frame the lid opens on is not known.
    '3|Motion[14]': { sets: [13] },
    '0|Motion[19]': { sets: [13], every: [['em077_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on JOINT 2 at 5x), first at once. L3 M13 is
    // also the shock trap's hold, whose own record sits on L3 M9 below.
    '3|Motion[13]': { every: [['em077_00c', 1101], 60] },
    // THE SHOCK TRAP: (10, 0x6e) plays L3 M9 and then holds L3 M13, with c 1105 every 42 -- byte-identical to
    // c 1101, joint 2 at 5x. L3 M9 is also (10, 0x52) / (10, 0x87) / (10, 0xb4), which show nothing.
    '3|Motion[9]':  { every: [['em077_00c', 1105], 42] },
    // THE tune+0x44 STATUS (INFERRED exhaust): (10, 0x1b) plays L3 M2, which requests c 1109 once at frame 0.
    // L3 M2 is also the body's and the tail durability's flinch, which show nothing.
    '3|Motion[2]':  { start: [['em077_00c', 1109]] },
    // DEATH: L3 M17 for (11, 0) and every number the table does not name, L3 M12 at the end of the air chain
    // ((11, 1): L3 M10 -> M11 -> M12, whose first two clips are shared with (10, 8) and show nothing), and
    // L3 M20 for (11, 7) / (11, 0x12) -- L3 M20 is also the pit's sleep and ailment hold, and death is what it
    // shows. The break sets and the sever STAY and his eyes STAY OPEN (death never raises `P+0x5d02`); what
    // death does is clear the rage flag, which the part pass re-reads the same frame -- so the tables revert.
    '3|Motion[17]': { dead: true, tables: [S_WING_R, S_WING_L, S_HEAD, S_TAIL] },
    '3|Motion[12]': { dead: true, settled: true, tables: [S_WING_R, S_WING_L, S_HEAD, S_TAIL] },
    '3|Motion[20]': { dead: true, tables: [S_WING_R, S_WING_L, S_HEAD, S_TAIL] },
  },
  // GLAVENUS (em080_00): E:\offline\decode\notes\states-em080_00.md, read and ROM-run by the Glavenus decode agent
  // (2026-09-24). His class `uEm080_00` (vtable 0x17eac74) runs Hellblade Glavenus too -- every path forks on
  // `e+0xb5f5` and this is the `== 0` side.
  //   HE IS THE FIRST MONSTER WE HAVE WIRED WHOSE RAGE AND WHOSE SIGNATURE MECHANIC ARE BOTH MATERIAL CLIPS. The
  //   part pass never reads `isEnraged`: the 919 vertices of `XfB__A1__m01_angry` are drawn the whole fight and
  //   `angry_Change -> angry_Loop -> angry_End` does the glowing. So the rage row below carries no sets, and what
  //   removes the glow layer in the viewer is part-review.json's four `state: "rage"` rows (Raven, 2026-09-11),
  //   which `dead` also drives through the rage it forces off.
  //   HIS BREAKS ARE ORDINARY, and three of the four are wired as such: the head at two levels on one motion
  //   (sets 9 -> 10 -> 11, u 1000 then u 1001), the hip / tail base (18 -> 19, u 1005) and a foreleg (14 -> 15,
  //   u 1015). Their alive sets carry the glow groups and their DEAD twins (6/7/8, 12/13, 16/17) drop them.
  // NOT WIRED, and stated here instead, because the table has ONE state axis (a level, optionally a calm/enraged
  // pair) and the tail needs a second:
  //   THE TAIL HEAT. `P+0x1bb` bit 1 is hot, bit 0 dark, bit 2 the throat lit; a signed gauge `e+0xcae4` starts at
  //   50, six named attack actions raise it, it decays 1 a 90 frames cold and 1 a 60 hot, hot at >= 100, dark at
  //   <= 0, and (7, 0x10) / (7, 0xf8) -- L2 M16 at frame 190 -- re-sharpens it to 50. THE HEAT CHANGES WHAT A TAIL
  //   BREAK DRAWS: cold the depletion is set 20 -> 21, hot it is 23 -> 24, and the sever is 22 cold / 25 hot. The
  //   viewer HAS the user-facing half -- part-review's Tail row carries Intact / Cracked / Severed and a Heated
  //   form of each, and a Throat row -- but a `levels` ladder cannot be indexed by both the break level and the
  //   heat, and the heat is not the rage flag, so the tail's depletion below fires its record WITHOUT touching the
  //   sets: the user's own tail choice (heated or not) stays on screen and is not overwritten with the cold set.
  //   The sever does apply its set, because a severed tail is a severed tail, but it applies the COLD one (22).
  //   AND THE HELD HEAT EFFECT: while the tail is hot the ROM holds `['em080_00u', 200]` (em080_00_014, joint 3,
  //   offset (0, -40, 180)) and releases it when the gauge falls to 0. `when` has no heat trigger -- 'rage' and
  //   'calm' follow the rage flag and nothing follows a part row -- so it is exported as a clip record only, and
  //   the held form is not wired. Both of these want a heat state the effects side can read; raised, not guessed.
  //   THE THREE MATERIAL MACHINES (`XfBA1__m04_tail` heat_Change / heat_Loop / heat_End / normal_dark_Change /
  //   dark_End, `XfB_N__E0_m03_tail` normal / dark_Change_Loop_End, `XfBA1_m06_nodo_r` the throat's pair) are the
  //   same shape of problem as Gypceros's crest: a `clips` entry holds its clip from a motion's frame 0 to that
  //   motion's end, and these outlive any clip. The throat going out on (10, 0x72) -> L3 M11 is material-only too,
  //   so that reaction shows nothing here.
  //   DEATH'S TIMING. The ROM darkens everything when L3 M18 REACHES ITS END (set 1 -> 0, 4 -> 5 and the break sets
  //   to their dead twins); the table applies a motion's sets at frame 0, so rather than show it 9.75 s early the
  //   death rows carry no sets and let the rage they force off take the glow layer with it. The heat is NOT cleared
  //   by death: a hot tail stays hot on the corpse.
  em080_00: {
    // THE HEAD, two levels on ONE motion ((10, 7) with part 0 -> L3 M9): level 1 set 9 -> 10 (group 1 off, 11 on,
    // 21 off, 31 on) firing u 1000 on joint 4, level 2 set 10 -> 11 (2 off, 12 on, 22 off) firing u 1001 on the same
    // joint. L3 M9 is ALSO the tune+0x44 status's reaction ((10, 0x1b), c 1109 once at frame 0), so the two share
    // the clip and each play shows the next.
    '3|Motion[9]':  { cycle: [{ levels: [[9], [10], [11]], fire: [null, ['em080_00u', 1000], ['em080_00u', 1001]] },
                              { start: [['em080_00c', 1109]] }] },
    // THE HIP / TAIL BASE ((10, 7) with part 1): set 18 -> 19 (group 4 off, 14 on, 24 off, 34 on, 104 off), firing
    // u 1005 on JOINT 140 at 1.5x.
    '3|Motion[1]':  { levels: [[18], [19]], fire: [null, ['em080_00u', 1005]] },
    // L3 M2 WEARS THREE HATS, so each play shows the next: the FORELEG break ((10, 0x14) with part 3: set 14 -> 15,
    // u 1015 on joint 2), the TAIL depletion ((10, 0x14) with part 6: u 1030 on JOINT 144, its sets left to the
    // user because they depend on the heat -- see the block comment), and the SHOCK TRAP ((10, 0x6e) plays L3 M2 to
    // frame 60 and then holds L3 M13; c 1105 every 42, cm200_001 on joint 1 at 5x).
    '3|Motion[2]':  { cycle: [{ levels: [[14], [15]], fire: [null, ['em080_00u', 1015]] },
                              { start: [['em080_00u', 1030]] },
                              { every: [['em080_00c', 1105], 42] }] },
    // THE TAIL SEVER: part 6's second counter (base 450, once) fires only while the tail is HOT AND ALREADY BROKEN
    // (vtable +0x230), and (10, 0x72) plays L3 M15 -- to frame 200, then from frame 200. Set 22 (group 6 off, 16
    // off, 17 on, 107 off) and u 900 (cm202_062 on JOINT 145 at 1.25x). HIS CUT TAIL IS STAGED -- sever kind 0x91,
    // descriptor 0x15983ec with word[1] != -1, and his OWN em080_00_option.lmt -- so it drops (CUT_TAIL.em080_00).
    // The set is the cold one: with a Heated tail selected the ROM would use 25, which the one-axis ladder cannot
    // carry.
    '3|Motion[15]': { levels: [[20], [21], [22]], at: 2, fire: [null, null, ['em080_00u', 900]], drops: true },
    // THE STUN: (10, 0x20) plays L3 M3 -> L3 M5 (held) -> L3 M7 for EVERY part and direction -- he has no sided
    // reaction -- and c 1103 (cm200_003 on joint 3, offset (0, 0, 100) at 0.9x) goes into one held handle, stopped
    // when it clears at (10, 0x2b). The three clips are also the -X hind leg's even-level depletion chain, which
    // shows nothing.
    '3|Motion[3]':  { hold: ['em080_00c', 1103] },
    '3|Motion[5]':  { hold: ['em080_00c', 1103] },
    '3|Motion[7]':  { hold: ['em080_00c', 1103] },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on joint 1 at 5x), first at once. L3 M13 is
    // also the shock trap's hold: shown as paralysis, as every monster's shared hold has been.
    '3|Motion[13]': { every: [['em080_00c', 1101], 60] },
    // RAGE: command group 6's body issues (1, 2) -- L0 M5 from frame 0. NOTHING on the mesh changes (the glow
    // geometry is always drawn); `angry_Change -> angry_Loop` on XfB__A1__m01_angry is the whole of it, and the
    // viewer's part-review rage rows are what shows it. The shared puff runs while rage is shown.
    '0|Motion[5]':  { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M8, with drool c 1104 every 48 (cm200_006 on joint 4, pos (0, 30, 100) at
    // 1.1x) and, calm and tired, the puff's countdown zeroed. Not shown: at the NEXT action start a tired Glavenus
    // has his throat bit cleared, so a lit throat goes out.
    '0|Motion[8]':  { rage: false, tired: true, every: [['em080_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M14 lies down and (10, 0x1e) holds L3 M25. HIS EYES SHUT -- eye set 3 -> set 2 (group 9,
    // the 16-vertex lid, drawn) -- while P+0x5d02 is up, and the hold has the zzz c 1102 every 90 (cm200_002 on
    // joint 3, offset (40, 0, 230) at 1.8x) and pauses the puff. L3 M14 -> L3 M25 is also CAPTURE ((11, 0x10)),
    // which does not raise the flag; sleep is what they are shown as.
    '3|Motion[14]': { sets: [2] },
    '3|Motion[25]': { sets: [2], every: [['em080_00c', 1102], 90], puffOff: true },
    // DEATH: L3 M18 (9.75 s) for (11, 0) and every number the status-11 table does not name, L3 M34 at the end of
    // the fall ((11, 1), after L3 M32 -> L3 M33) and L3 M21 for (11, 7) / (11, 0x12). The break sets and the heat
    // stay as the user has them; the rage flag is cleared by the status-11 setAction, which `dead` gives for
    // nothing -- and with it the glow layer the part-review rage rows draw, which is what the ROM's `angry_End`
    // comes to. L3 M34 begins past the landing, so it is settled.
    '3|Motion[18]': { dead: true },
    '3|Motion[34]': { dead: true, settled: true },
    '3|Motion[21]': { dead: true },
  },
  // HELLBLADE GLAVENUS (em080_04): E:\offline\decode\notes\states-em080_04.md, read by the Hellblade decode agent
  // (2026-09-25). THERE IS NO `uEm080_04`: the name string is not in .rodata, only ONE vtable exists (0x17eac74),
  // and the diff of all 0x480 slots against em080_00's is EMPTY IN BOTH DIRECTIONS. He is `uEm080_00` with
  // `e+0xb5f5 == 4`, and every branch below is that byte, not a class. He shares `em080_00c.pel`, all four motion
  // lists and their PSLs byte-for-byte; his .dtp, .dtt, .mpm, model, tail model and `em080_04u.pel` are his own.
  //   GLAVENUS'S TAIL HEAT IS A GAUGE; HIS IS NOT A GAUGE AT ALL. The per-frame gauge (vtable +0x1dc = 0xffe4e0)
  //   is skipped outright for variant 4 (0xffe51c), and the per-reset init puts him HOT AND THROAT-LIT at spawn,
  //   bits that are never cleared while he lives. What he has instead is a pair of OVERHEAT bits -- `P+0x1bb`
  //   bit 3 (tail) and bit 4 (throat) -- each raised by ONE clip, each held 5400 frames, each driving its own
  //   material machine and its own mesh family. Only the throat's moves mesh, and it is wired below.
  //   RAGE MOVES NOTHING ON HIS MODEL, not even a material clip: the part pass never reads `isEnraged`, and the
  //   variant-4 path has no rage material machine at all (0x100967c is called only from the variant-0 pass).
  //   `XfB__A1__m01_angry` is renamed `XfB__A1__m01_blood` and the init pins it to `angry_Loop` at spawn, where
  //   it stays until death.
  // NOT WIRED, stated instead:
  //   THE TAIL OVERHEAT (L2 M16 at frame 190, (7, 0x10) / (7, 0xf8), the re-sharpen). It raises bit 3 and runs
  //   `XfBA1__m04_tail` heat_End -> overheat_Change -> overheat_Loop, but NO MESH MOVES -- his tail overlay
  //   groups 40 / 45 / 47 are on from spawn -- and the material machine is not this table's to drive. It gets no
  //   row because there is nothing for a row to show.
  //   THE HELD HEAT EFFECT (vtable +0x208): SEQUENCE key 200 normally, swapping to 201 (tail overheating), 204
  //   (throat) or 203 (both). With no overheat toggle in the viewer the held key is always 200, which is what his
  //   clip effects already carry.
  //   THE 5400-FRAME TIMERS. Each overheat lasts 90 seconds in the ROM, far longer than the clip that starts it;
  //   the throat row below shows it for the length of L2 M8, which is the one axis this table has.
  //   THE BODY BLOOD LAYER AT DEATH. Set 0 -> set 1 (group 20 off, 616 vertices) lands ONCE THE DEATH CLIP ENDS,
  //   not at its frame 0, and the settled corpse is not a motion of its own -- so there is nothing to hang it on
  //   and it is left off rather than shown 9.75 s early.
  em080_04: {
    // L3 M9 WEARS TWO HATS, so each play shows the next: the HEAD, whose .dtp gives it TWO rungs (level 2 ->
    // set 8, level 3 -> set 9, at both ranks) firing u 1001 and u 1002 on joint 4; and the tune+0x44 status
    // (INFERRED exhaust, (10, 0x1b)), which requests c 1109 once at frame 0 -- from em080_00c, the pel he shares
    // with Glavenus.
    '3|Motion[9]':  { cycle: [{ levels: H_HEAD, at: 2, fire: [null, null, ['em080_04u', 1001], ['em080_04u', 1002]] },
                              { start: [['em080_00c', 1109]] }] },
    // THE HIP / TAIL BASE, level 1: set 20 -> 21, u 1005 on JOINT 140 -- byte-identical to Glavenus's record.
    '3|Motion[1]':  { levels: H_HIP, fire: [null, ['em080_04u', 1005]] },
    // L3 M2 WEARS THREE HATS: the FORELEG ((10, 0x14) with part 3: set 16 -> 17, u 1015 on joint 2), the TAIL
    // ((10, 0x14) with part 6: set 24 -> 25, u 1030 on joint 144 -- and the same handler CLEARS the tail overheat
    // at 0xfffa9c), and the SHOCK TRAP ((10, 0x6e) plays L3 M2 to frame 60 and then holds L3 M13).
    '3|Motion[2]':  { cycle: [{ levels: H_FORE, fire: [null, ['em080_04u', 1015]] },
                              { levels: H_TAIL, fire: [null, ['em080_04u', 1030], null] },
                              { every: [['em080_00c', 1105], 42] }] },
    // THE TAIL SEVER, and it is NOT GATED the way Glavenus's is: `vtable +0x230` returns 1 for part 6
    // unconditionally, so part 6's second counter (base 1200, once) fires whatever the tail's level and heat.
    // (10, 0x72) plays L3 M15 to frame 200 and then from frame 200; set 26 (group 6 off, 16 off, 17 on, 107 off,
    // and the tail overlay 45 / 46 / 56 off, 57 on) with u 900 on JOINT 145. HIS CUT TAIL IS HIS OWN MODEL and it
    // is staged, so it drops (CUT_TAIL.em080_04).
    '3|Motion[15]': { levels: H_TAIL, at: 2, fire: [null, null, ['em080_04u', 900]], drops: true },
    // THE THROAT OVERHEAT, ON: (7, 8) / (7, 0xf2) plays L2 M8 and raises `P+0x1bb` bit 4. The throat goes from
    // set 4 to set 5 (60 off, 70 on, 80 on) and the head family from 7/8/9 to 10/11/12 (72 on, 82 on) at the
    // user's break level -- which is what H_HEAD_HOT's second column is. It is read with `show: 'enraged'`
    // because this table has ONE axis and it is rage: the column is the overheat, not a rage state, and the
    // `calm` column is the live ladder so the user's level still reads correctly.
    '2|Motion[8]':  { sets: [5], tables: [H_HEAD_HOT], show: 'enraged' },
    // THE THROAT PUT OUT: part 0's second counter (base 220, limit 65535, repeatable) runs only while bit 4 is
    // up, and (10, 0x72) with part 0 plays L3 M11 -> (300 f) L3 M5 -> L3 M7. The throat falls back to set 4
    // (70 off, 80 off, 60 on) and the head to 7/8/9. H_HEAD_ANY holds the live ladder in BOTH columns, so the
    // user's Enraged toggle cannot move it.
    '3|Motion[11]': { sets: [4], tables: [H_HEAD_ANY] },
    // RAGE: command group 6's body issues (1, 2) -- L0 M5. Nothing at all changes on him (see the block comment);
    // the shared puff is the whole of what it shows.
    '0|Motion[5]':  { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M8, with drool c 1104 every 48 -- the same file and the same record as
    // Glavenus's, from the shared em080_00c. Glavenus's "tiredness puts the throat out" branch (0xfff3cc) is
    // VARIANT-0 ONLY, so nothing on Hellblade's model changes when he tires.
    '0|Motion[8]':  { rage: false, tired: true, every: [['em080_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) plays L3 M14 and (10, 0x1e) holds L3 M25, with the zzz c 1102 every 90 and the puff
    // paused. His eyes shut -- set 3 -> set 2 (group 9, the lid, on; 8, the eye, off; 78, the eye's m06_nodo_r
    // glow, off) -- while `P+0x5d02` is up. L3 M14 -> L3 M25 is also CAPTURE ((11, 0x10)).
    '3|Motion[14]': { sets: [2] },
    '3|Motion[25]': { sets: [2], every: [['em080_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M13; c 1101 every 60 (cm200_001 on joint 1 at 5x), first at once. L3 M13 is
    // also the shock trap's hold, whose own record sits on L3 M2 above.
    '3|Motion[13]': { every: [['em080_00c', 1101], 60] },
    // THE STUN, and he has NO left/right split: (10, 0x20) plays L3 M3 -> L3 M5 (held) -> L3 M7 for every part
    // and direction, with c 1103 in one held handle, stopped at (10, 0x2b). The three clips are also the hind
    // legs' even-level chains and the throat-put-out's tail, which show nothing of their own.
    '3|Motion[3]':  { hold: ['em080_00c', 1103] },
    '3|Motion[5]':  { hold: ['em080_00c', 1103] },
    '3|Motion[7]':  { hold: ['em080_00c', 1103] },
    // DEATH: L3 M18 for (11, 0) and every number the table does not name, L3 M34 at the end of the air chain
    // ((11, 1): L3 M32 -> M33 -> M34) and L3 M21 for (11, 7) / (11, 0x12). The three material machines park and
    // the part pass then takes the DEAD families -- throat set 6 (60, 70, 80 all off) and the head, foreleg, hip
    // and tail overlays off at whatever level the user has them. Those are the second column of the four _DEAD
    // tables, read with `show: 'enraged'` for the same reason the overheat is. The rage shown goes off, which is
    // what `m01_blood` plays angry_End for.
    '3|Motion[18]': { dead: true, sets: [6], tables: [H_HEAD_DEAD, H_FORE_DEAD, H_HIP_DEAD, H_TAIL_DEAD], show: 'enraged' },
    '3|Motion[34]': { dead: true, settled: true, sets: [6], tables: [H_HEAD_DEAD, H_FORE_DEAD, H_HIP_DEAD, H_TAIL_DEAD], show: 'enraged' },
    '3|Motion[21]': { dead: true, sets: [6], tables: [H_HEAD_DEAD, H_FORE_DEAD, H_HIP_DEAD, H_TAIL_DEAD], show: 'enraged' },
  },
  // GAMMOTH (em083_00): E:\offline\decode\notes\states-em083_00.md, read and ROM-run by the Gammoth decode agent
  // (2026-09-24), with sections 4.5 and 4.6 settled by two follow-ups. Her class `uEm083_00` (vtable 0x17efaa8)
  // runs Elderfrost too -- 63 `e+0xb5f5` sites -- and this is the variant-0 side.
  //   HER SNOW ARMOUR IS THE THING NO MONSTER WE HAVE WIRED HAS: six independent snow counters, each with its own
  //   .mpm sets, its own effect keys and its own reaction, and 20 of her 31 sets belong to them. Gammoth uses five
  //   (slot 0 = dtt part 2, 1 = part 3, 2 = part 4, 3 = part 5, 4 = part 6, the tail); slot 5 is Elderfrost's
  //   trunk. The applier 0x105418c is a jump table per slot, and 4.6 reads it out in full -- the ladders below are
  //   that table, in counter order: bare, partial, packed, REGROWING, BROKEN.
  //   AND THE LEG BREAK RIDES IT (4.6, which corrected this note's own first reading): the part pass has no set for
  //   a leg at all, but `0x105006c`'s break section at 0x10505a8 forces a broken leg's snow counter to **4** while
  //   its .dtp break level is up, and the applier then draws that slot's fifth set -- 12 / 17 / 22 / 27, which turn
  //   groups 55..58 off and 65..68 on: a second, SNOWLESS foot mesh (both bind material 3, XfB__E0__m00_foot).
  //   That is exactly part-review.json's per-leg "Broken" item, so a leg break IS visible and is wired below at
  //   `at: 4`. Nothing lowers a 4 while the break stands, and regrowth is triple-gated off a broken leg.
  //   HER HEAD BREAKS AT LEVELS 2 AND 3, not 1 and 2 -- the .dtp rows say so at both ranks -- and the two levels
  //   share one clip, so the level comes from the user's parts and the record from that level.
  // NOT WIRED, and stated here instead:
  //   THE 2 -> 1 SNOW DEGRADE fires the FIRST key of each pair (u 1040 / 1045 / 1050 / 1055; 4.5 settles which
  //   member goes with which edge) and has NO reaction motion at all -- `0x1051cf0` moves the counter at the end of
  //   the action-start hook and the monster plays nothing -- so there is no frame 0 for the table to hang it on.
  //   Only the knock-off half (the second key, on the counter reaching 0) is below.
  //   THE REGROWTH RUNG (level 3, sets 11 / 16 / 21 / 26) is driven by the `snow_saisei` material clip's own frame
  //   and demotes itself to 2 when the clip ends; the table cannot time that, and the user can select the rung
  //   ("Animated Snow") directly.
  //   WHAT RAISES A SNOW BASE LEVEL in the first place is Elderfrost's note's find (0x1054664, driven by (1, 0x14)
  //   .. (1, 0x1d) and (1, 7)); Gammoth's own picking-up-snow actions are not wired, only the losing half.
  em083_00: {
    // L3 M1 IS THE SNOW KNOCK-OFF, once per limb: part 7's second counter runs out for a limb that still has snow
    // (vtable +0x234 returns 1 only when the counter is neither 0 nor 4, so a bare or BROKEN limb cannot fire it),
    // reaction code 0xe issues (10, 0x72), and the handler's script plays op 0x18(70) then L3 M1. The limb's
    // counter is zeroed by the action-start hook, so the applier draws its BARE set, and the effect block fires
    // that slot's second key. One clip, five limbs -- each play shows the next, in slot order -- and the SHOCK
    // TRAP's first clip is the same motion ((10, 0x6e) plays L3 M1 with wait 8, then L3 M9 from frame 30, with
    // c 1105 every 42 while the action lasts), so it is the sixth. A depletion after a break plays L3 M1 too and
    // shows nothing.
    '3|Motion[1]':  { cycle: [{ sets: [10], start: [['em083_00u', 1041]] },      // slot 0, dtt part 2, joint 7
                              { sets: [15], start: [['em083_00u', 1046]] },      // slot 1, part 3, joint 11
                              { sets: [20], start: [['em083_00u', 1051]] },      // slot 2, part 4, joint 14
                              { sets: [25], start: [['em083_00u', 1056]] },      // slot 3, part 5, joint 17
                              { sets: [29], start: [['em083_00u', 1060]] },      // slot 4, the tail, joint 141
                              { every: [['em083_00c', 1105], 42] }] },
    // L3 M2 IS THE HEAD BREAK, THE TRUNK BREAK AND THE EXHAUST STATUS. The head ((10, 0x14) with part 0) has two
    // levels on this one clip: level 2 takes set 1 -> 2 (52 off, 62 on, 102 off) firing u 1001 on JOINT 150, level
    // 3 takes set 2 -> 3 (53 off, 63 on, 103 off) firing u 1002 on JOINT 132 -- so levels 0 and 1 repeat set 1 and
    // fire nothing. The trunk (part 1) takes set 6 -> 7 (54 off, 64 on) firing u 1006 on JOINT 157. Then
    // (10, 0x1b), the tune+0x44 status, which requests c 1109 once at frame 0.
    '3|Motion[2]':  { cycle: [{ levels: [[1], [1], [2], [3]], at: 2, fire: [null, null, ['em083_00u', 1001], ['em083_00u', 1002]] },
                              { levels: [[6], [7]], fire: [null, ['em083_00u', 1006]] },
                              { start: [['em083_00c', 1109]] }] },
    // THE +X LEGS' BREAK CHAIN ((10, 0x14) with part 2 or 4): L3 M6 -> (600 f) L3 M7 -> L3 M8. Each part's snow
    // counter goes to 4 and its slot's fifth set draws the snowless broken foot: part 2 set 12 firing u 1010 on
    // joint 7, part 4 set 22 firing u 1020 on joint 14. The same three clips are the STUN's ((10, 0x20), direction
    // 1), which holds c 1103 -- so the break, the other break and the stun take turns on L3 M6, and L3 M7 / L3 M8
    // carry the stun alone.
    '3|Motion[6]':  { cycle: [{ levels: [[10], [9], [8], [11], [12]], at: 4, fire: [null, null, null, null, ['em083_00u', 1010]] },
                              { levels: [[20], [19], [18], [21], [22]], at: 4, fire: [null, null, null, null, ['em083_00u', 1020]] },
                              { hold: ['em083_00c', 1103] }] },
    '3|Motion[7]':  { hold: ['em083_00c', 1103] },
    '3|Motion[8]':  { hold: ['em083_00c', 1103] },
    // THE -X LEGS' CHAIN ((10, 0x14) with part 3 or 5): L3 M3 -> (600 f) L3 M4 -> L3 M5, and the STUN's direction 2.
    // Part 3 set 17 firing u 1015 on joint 11, part 5 set 27 firing u 1025 on joint 17.
    '3|Motion[3]':  { cycle: [{ levels: [[15], [14], [13], [16], [17]], at: 4, fire: [null, null, null, null, ['em083_00u', 1015]] },
                              { levels: [[25], [24], [23], [26], [27]], at: 4, fire: [null, null, null, null, ['em083_00u', 1025]] },
                              { hold: ['em083_00c', 1103] }] },
    '3|Motion[4]':  { hold: ['em083_00c', 1103] },
    '3|Motion[5]':  { hold: ['em083_00c', 1103] },
    // RAGE: the gauge runs command group 6 stream 0, whose variant-0 arm is (1, 2) -- L0 M3, the roar -- with a
    // conditional (1, 7) = L0 M32 when a limb is bare (states-em083_04.md settled the path: 0x7fb84 -> P+0x362 bit
    // 2 -> 0x7f7e8 -> e+0x72fc = 6). NOTHING changes on the model with rage: `0x81670` has not one call site in the
    // class, so no part set, no material and no joint follow it. The shared puff is the whole of what it shows.
    '0|Motion[3]':  { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M15 -- which is also the whole of action (1, 0), so the clip alone does not
    // say she is tired -- with drool c 1104 every 48 (cm200_006 on joint 3, pos (0, -100, 100) at 2x) and, calm and
    // tired, the puff's countdown zeroed.
    '0|Motion[15]': { rage: false, tired: true, every: [['em083_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M10 lies down and (10, 0x1e) holds L0 M20. HER EYES SHUT -- the applier is
    // 0x71398(e, 4, 5, -1), so open is set 4 and SHUT IS SET 5 (group 2 off, 1 on) -- while P+0x5d02 is up, and the
    // hold has the zzz c 1102 every 90 (cm200_002 on joint 2, offset (0, 200, 200) at 4x) and pauses the puff.
    // L3 M10 -> L0 M20 is also CAPTURE ((11, 0x10)), which does not raise the flag; sleep is what they show.
    '3|Motion[10]': { sets: [5] },
    '0|Motion[20]': { sets: [5], every: [['em083_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M9; c 1101 every 60 (cm200_001 on joint 1, offset (0, 0, 200) at 10x), first
    // at once. L3 M9 is also the shock trap's SECOND clip (from frame 30): shown as paralysis, and the trap's own
    // record is on L3 M1 above, where its first clip is.
    '3|Motion[9]':  { every: [['em083_00c', 1101], 60] },
    // DEATH: L3 M12 for (11, 0) and every number the status-11 table does not name, and L3 M16 for (11, 7) /
    // (11, 0x12). Death shows nothing of its own: the break sets and every snow counter keep being re-applied, so
    // the snow and the broken feet stay as the user has them, and her eyes stay OPEN (status 11 never raises
    // P+0x5d02). L3 M16 is also the pit ailments' clip, and death is what it is shown as.
    '3|Motion[12]': { dead: true },
    '3|Motion[16]': { dead: true },
  },
  // ELDERFROST GAMMOTH (em083_04): E:\offline\decode\notes\states-em083_04.md, read and ROM-run by the Elderfrost
  // decode agent (2026-09-24), written as the DIFF against Gammoth's note. He is `uEm083_00` with `e+0xb5f5` = 4:
  // ONE class, ONE vtable (0x17efaa8), not a slot different, and the agent unpacked both .arc files blob by blob --
  // **375 shared paths, 0 differ**. There is no em083_04c.pel at all, so every ailment, trap, drool and exhaust
  // record below is literally Gammoth's `em083_00c`, and his motion lists, PSLs, command table and eye machinery
  // are hers. Rage, tiredness, the ailments, the traps and death are the same code on the same data and show
  // exactly what hers show.
  //   WHAT IS HIS IS WHERE THE SNOW SITS: hers is on slots 0, 1, 2, 3, 4 (dtt parts 2, 3, 4, 5 and the tail), his on
  //   slots 0, 1 and **5** (parts 2, 3 and the TRUNK). That one move drags the break rows with it -- his .dtp has 5
  //   rows, not 7, `vtable +0x23c` returns 0 for parts 4 and 5 on the variant-4 path, and `em083_04u.pel` has no
  //   key 1020 and no key 1025 -- SO HIS OTHER TWO LEGS CANNOT BREAK AT ALL, which is why L3 M6 and L3 M3 carry one
  //   break each here where Gammoth's carry two.
  //   HIS TRUNK BREAK COMES THROUGH THE SNOW, not the part pass: the trunk-set branch is skipped for variant 4, and
  //   slot 5 going to level 4 is what swaps the mesh (set 7: 54 off, 64 on). Same mechanism as the leg breaks
  //   (states-em083_00.md 4.6), one part further forward.
  //   AND HE PUTS SNOW BACK ON, which Gammoth's table has no row for either: (1, 0x14) / (1, 0x15) / (1, 0x18) play
  //   L0 M29 -> L0 M30 and raise one or both bare legs to the REGROWTH level 3, and (1, 7) -- L0 M32 -- raises
  //   everything bare, trunk included. Those are motions, so they are wired; which of the three L0 M29 actions ran
  //   is not visible in the clip, so its three forms take turns.
  // NOT WIRED, as for Gammoth: the 2 -> 1 damage degrade (the first key of each pair, no reaction motion at all) and
  //   the regrowth's own 3 -> 2 demotion, which is timed by the `snow_saisei` material clip's frame.
  em083_04: {
    // L3 M1 IS THE SNOW KNOCK-OFF for his three snow limbs -- (10, 0x72), second-counter bases 180 / 180 / 180 --
    // and then the SHOCK TRAP's first clip, as Gammoth's is. Each play shows the next, in slot order: the +X leg
    // (slot 0, u 1041 on joint 7), the -X leg (slot 1, u 1046 on joint 11) and the TRUNK (slot 5, u 1051 -- HIS OWN
    // record, joint 157 at a uniform 1.5, where Gammoth's 1051 is joint 14 at (1.5, 2, 1.5)).
    '3|Motion[1]':  { cycle: [{ sets: [10], start: [['em083_04u', 1041]] },
                              { sets: [15], start: [['em083_04u', 1046]] },
                              { sets: [6],  start: [['em083_04u', 1051]] },
                              { every: [['em083_00c', 1105], 42] }] },
    // L3 M2 IS THE HEAD BREAK, THE TRUNK BREAK AND THE EXHAUST STATUS, as hers is. The head's two levels are on the
    // one clip (set 1 -> 2 at level 2 firing u 1001 on joint 150, set 2 -> 3 at level 3 firing u 1002 on joint 132,
    // both byte-identical to Gammoth's records); the trunk rides snow slot 5 to level 4 (set 7) and fires u 1006 on
    // joint 157; then c 1109 once at frame 0.
    '3|Motion[2]':  { cycle: [{ levels: [[1], [1], [2], [3]], at: 2, fire: [null, null, ['em083_04u', 1001], ['em083_04u', 1002]] },
                              { levels: [[6], [33], [31], [32], [7]], at: 4, fire: [null, null, null, null, ['em083_04u', 1006]] },
                              { start: [['em083_00c', 1109]] }] },
    // THE +X LEG ((10, 0x14) with part 2): L3 M6 -> (600 f) L3 M7 -> L3 M8, snow slot 0 forced to level 4 -- set 12,
    // the snowless broken foot -- firing u 1010 on joint 7. The same three clips are the STUN's (direction 1).
    '3|Motion[6]':  { cycle: [{ levels: [[10], [9], [8], [11], [12]], at: 4, fire: [null, null, null, null, ['em083_04u', 1010]] },
                              { hold: ['em083_00c', 1103] }] },
    '3|Motion[7]':  { hold: ['em083_00c', 1103] },
    '3|Motion[8]':  { hold: ['em083_00c', 1103] },
    // THE -X LEG ((10, 0x14) with part 3): L3 M3 -> (600 f) L3 M4 -> L3 M5, snow slot 1 to level 4 -- set 17 --
    // firing u 1015 on joint 11; the STUN's direction 2 on the same clips. L3 M3 is also the head's own second
    // counter reaction ((10, 0x72) with part 0, which strips no snow and shows nothing).
    '3|Motion[3]':  { cycle: [{ levels: [[15], [14], [13], [16], [17]], at: 4, fire: [null, null, null, null, ['em083_04u', 1015]] },
                              { hold: ['em083_00c', 1103] }] },
    '3|Motion[4]':  { hold: ['em083_00c', 1103] },
    '3|Motion[5]':  { hold: ['em083_00c', 1103] },
    // SNOW PUT BACK ON. (1, 0x14) / (1, 0x15) / (1, 0x18) all play L0 M29 -> L0 M30 and raise the +X leg, the -X leg
    // or both to the regrowth level 3 (sets 11 and 16, the animated snow), restarting the m01_snow_anime clip; the
    // clip cannot say which action ran, so the three take turns. (1, 7) -- L0 M32 -- raises everything bare
    // INCLUDING the trunk (set 32, the m02_snow_anime_nose material).
    '0|Motion[29]': { cycle: [{ sets: [11] }, { sets: [16] }, { sets: [11, 16] }] },
    '0|Motion[32]': { sets: [11, 16, 32] },
    // RAGE: settled from the ROM for this variant -- the gauge -> 0x7fb84(e, 4) -> P+0x362 bit 2 -> 0x7f7e8 sets
    // e+0x72fc = 6 stream 0 -> EMC group 6 stream 0's variant-4 arm is exactly `00 01 02` = (1, 2) = L0 M3. Nothing
    // changes on the model with it. GAMMOTH GETS A SECOND BEAT HE DOES NOT: her arm adds (1, 7) = L0 M32 when a limb
    // is bare, which is the snow-on motion above.
    '0|Motion[3]':  { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M15 -- also the whole of action (1, 0) -- with Gammoth's own drool record
    // c 1104 every 48 out of the shared c.pel, and the puff's countdown zeroed calm and tired.
    '0|Motion[15]': { rage: false, tired: true, every: [['em083_00c', 1104], 48] },
    // ASLEEP: the same chain and the same sets as Gammoth -- (10, 0x1d) L3 M10 lies down, (10, 0x1e) holds L0 M20,
    // eyes shut into SET 5 (the applier is 0x71398(e, 4, 5, -1)) while P+0x5d02 is up, the zzz c 1102 every 90, and
    // the puff paused. L3 M10 -> L0 M20 is also CAPTURE.
    '3|Motion[10]': { sets: [5] },
    '0|Motion[20]': { sets: [5], every: [['em083_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M9; c 1101 every 60, first at once. L3 M9 is also the shock trap's second clip,
    // whose own record sits on L3 M1 above.
    '3|Motion[9]':  { every: [['em083_00c', 1101], 60] },
    // DEATH: L3 M12 for (11, 0) and every number the table does not name, L3 M16 for (11, 7) / (11, 0x12) -- and
    // L3 M16 is the pit ailments' clip too. Death shows nothing of its own: the break sets and the snow counters
    // keep being re-applied and his eyes stay open.
    '3|Motion[12]': { dead: true },
    '3|Motion[16]': { dead: true },
  },
  // GREAT MACCAO (em085_00): E:\offline\decode\notes\states-em085_00.md, read by the Great Maccao decode agent
  // (2026-09-25). The family question came out the way Blangonga's did: he is `uEm085_00` (vtable 0x17f74a8) and
  // Maccao is `uEms046_00` (0x1819bd0) -- all 0x480 slots of both were diffed against base uEnemy and **the set of
  // slots where both override with the same function is empty**. No shared motion list, no shared model. The only
  // link is a spawn call.
  //   HE IS THE SECOND MONSTER WITH A RANK-DEPENDENT BREAK, and it goes further than Gravios's: his tail row is
  //   `{2, 2, 3, 2}` -- level 2 at low and high rank, level **3** at G -- and at G the record id resolves to
  //   **key 1012, which `em085_00u` does not contain**. So at the viewer's rank (index.html's SHELL_QUEST_RANK = 5)
  //   the tail break SHOWS ITS SET AND FIRES NOTHING, and that is what is wired. AT LOW RANK it would be
  //   `{ levels: [[5], [5], [6]], fire: [null, null, ['em085_00u', 1011]] }` -- the record exists and is only ever
  //   reachable there, which is why it is not exported: nothing at G asks for it.
  //   BREAKING THE CREST OR THE TAIL KNOCKS HIM OVER. `vtable +0x23c` is overridden to "this part just reached its
  //   break level" -- where Barioth's tests tiredness -- so both breaks route to (10, 0x14) and the full topple
  //   (L3 M3 -> M4 -> M5 -> (120 f) L3 M16 -> L3 M9) rather than to the (10, 7) stagger. That is why both sit on
  //   L3 M3 below, and why a depletion under the threshold shows nothing at all.
  //   RAGE CHANGES NOTHING ON THE MODEL: no mesh set, no material, +0x2a0 is `bx lr`. The one model-side thing it
  //   does is swap a CHAIN FILE -- `em085_00.ctc` -> `em085_00_angry.ctc` at the next action start, four files
  //   picked by (enraged x threat display) -- which is physics data the viewer does not read, so it is stated here
  //   rather than shown.
  // NOT WIRED, stated instead: THE MACCAO CALL. (1, 0xa) plays L0 M22, at frame 110 it becomes (1, 0xc) and the
  //   class asks the small-monster manager TWICE for `ems046_00`, each call spawning min(2 - alive, 1); tiredness
  //   stops it and no break gates it. Nothing of that is his model or an effect record, and the viewer has no small
  //   monsters, so there is no row -- the same silence Blangonga's howl gets, and for the same reason.
  em085_00: {
    // L3 M3 IS BOTH BREAKS' TOPPLE, so each play shows the next: the CREST at level 2 (set 3 -> 4: group 1 off,
    // 11 on, 101 off -- the 190-vertex crest replaced by the 171-vertex broken one and the eye-material piece gone)
    // firing u 1001 on joint 3; then the TAIL at G's level 3 (set 5 -> 6: group 2 off, 12 on, 102 off), which fires
    // nothing at this rank. L3 M3 is also the first clip of the death chain, which is why death is on L3 M10.
    '3|Motion[3]':  { cycle: [{ levels: [[3], [3], [4]], at: 2, fire: [null, null, ['em085_00u', 1001]] },
                              { levels: [[5], [5], [5], [6]], at: 3, fire: [null, null, null, null] }] },
    // L3 M1 CARRIES THE SHOCK TRAP AND THE EXHAUST STATUS (and the crest's level-1 depletion, which shows and fires
    // nothing -- `em085_00u` has no key 1000): (10, 0x6e) plays L3 M1 and holds L3 M8, with c 1105 every 42; then
    // (10, 0x1b) requests c 1109 once at frame 0.
    '3|Motion[1]':  { cycle: [{ every: [['em085_00c', 1105], 42] },
                              { start: [['em085_00c', 1109]] }] },
    // RAGE: the rage command's default branch issues (1, 2) -- L0 M17. Nothing on the model (see the block comment);
    // the shared puff is the whole of what it shows.
    '0|Motion[17]': { rage: true },
    // TIRED: the tired idle (0, 2) is L0 M18_loop, a clip of its own rather than the combat idle L0 M2, with drool
    // c 1104 every 48 (cm200_006 on JOINT 4 at 0.5x) and the puff's countdown zeroed. Tiredness also stops his
    // Maccao call.
    '0|Motion[18]': { rage: false, tired: true, every: [['em085_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 M6 lies down and (10, 0x1e) holds L3 M7. His eyes shut -- set 2 -> set 1 (group 3, the
    // 22-vertex lid, drawn) -- while P+0x5d02 is up, with the zzz c 1102 every 90 and the puff paused. L3 M6 ->
    // L3 M7 is also CAPTURE ((11, 0x10)); sleep is what they show.
    '3|Motion[6]':  { sets: [1] },
    '3|Motion[7]':  { sets: [1], every: [['em085_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 M8; c 1101 every 60 (cm200_001 on joint 1 at 2.5x), first at once. L3 M8 is
    // also the shock trap's hold, whose own record sits on L3 M1 above.
    '3|Motion[8]':  { every: [['em085_00c', 1101], 60] },
    // THE STUN, and it is NOT sided -- the dispatcher hands every direction the same script: (10, 0x20) holds
    // L3 M15 with c 1103 (cm200_003 on joint 3 at 0.6x) in one held handle, stopped at (10, 0x2b)'s L3 M20.
    '3|Motion[15]': { hold: ['em085_00c', 1103] },
    // DEATH: L3 M10 ends the chain for (11, 0), (11, 1) and every number the table does not name -- its first three
    // clips are the break topple above -- and L3 M14 is (11, 7) / (11, 0x12). Both break sets stay and his eyes
    // stay open (status 11 never raises P+0x5d02).
    '3|Motion[10]': { dead: true, settled: true },
    '3|Motion[14]': { dead: true },
  },
  em079_00: malfestio('em079_00u'),
  em079_04: nightcloak(),
  // YIAN KUT-KU (em008_00): E:\offline\decode\notes\states-em008_00.md, read and ROM-run by the Kut-Ku decode
  // agent (2026-09-24). Every change lands on FRAME 0 of the motion named.
  //   ONE BREAKABLE PART AND NOTHING ELSE MOVES. His .dtp has a single row -- the head, at level 2 at both ranks --
  // and seven other parts take depletion reactions that change nothing because they have no row. Rage changes
  // nothing either: the part pass never reads isEnraged, the eye applier never does, there is no material clip,
  // and vtable +0x2a0 is not gated on rage. So the puff is the whole of what his rage shows, as Astalos's is.
  //   HIS EARS ARE A JOINT TRANSFORM, NOT A SET, and are not here. vtable +0x2a0 = 0xd50dec rotates joints 132,
  // 133 and 134 every frame from a counter that eases up to 60.0 while the combat byte is 1 and the low-HP test
  // is unmet (or the action is (1,2)/(1,3)), and eases back otherwise. This table swaps mesh groups; it has no
  // way to drive a joint, and JOINT_SCALE is a scale rather than a rotation. Written down rather than skipped.
  //   NO SEVER AND NO CUT TAIL -- four independent facts in 3.4 -- so no CUT_TAIL entry and no sever motion.
  em008_00: {
    // THE HEAD (part 6), (10, 7) -> L3 Motion[1]. Two depletions, and level 1 shows nothing at all: his .dtp row is
    // at level 2, and key 1030 -- what level 1 would ask for -- is absent. Level 2 takes set 2 -> 4 (group 2 off,
    // 3 on) and fires u 1031 (cm202_060 on joint 3, offset (0, 120, -30) at 0.8x).
    '3|Motion[1]':  { levels: [[2], [2], [4]], fire: [null, null, ['em008_00u', 1031]] },
    // THE tune+0x44 STATUS (INFERRED exhaust), (10, 0x1b) on L3 Motion[2]: c 1109 once at frame 0 (cm200_008 on
    // joint 3, offset (0, 15, 90) at 1.5x). L3 Motion[2] is also the body depletion (part 0) and the tail
    // depletion (part 7) -- a different script on the same clip -- and neither of those shows anything, so the
    // status is the only thing this clip carries that can be seen. No cycle needed, unlike Malfestio's L3 M2.
    '3|Motion[2]':  { start: [['em008_00c', 1109]] },
    // THE STUN, (10, 0x20) -> L3 M4 -> M6 -> M8. NOT SIDED: his .dtb direction table is zero at every index, so
    // there is one chain rather than Barioth's and Malfestio's two, and L3 M3/M5/M7 is only the +X leg depletion
    // (which shows nothing). c 1103 (cm200_003 on joint 3, offset (0, 0, 60) at 0.9x) into ONE held handle.
    '3|Motion[4]':  { hold: ['em008_00c', 1103] },
    '3|Motion[6]':  { hold: ['em008_00c', 1103] },
    '3|Motion[8]':  { hold: ['em008_00c', 1103] },
    // RAGE: command group 6's tail issues (1, 0x21) -- L0 Motion[101] from frame 0. Nothing on the model.
    '0|Motion[101]': { rage: true },
    // TIRED: his own clip, L0 Motion[14], not the combat idle -- so the clip itself says it. Drool c 1104 every 48
    // (cm200_006 on joint 3, pos (0, 15, 90), rot (90, 0, 0) at 1x).
    '0|Motion[14]': { rage: false, tired: true, every: [['em008_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 Motion[14] lies down, (10, 0x1e) holds L0 Motion[19], then L0 M20 -> L3 M16 gets up.
    // Eye set 1 -> set 3: group 4 off (the 18-vertex eyeball) and group 1 on (the 40-vertex closed-eye mesh),
    // while P+0x5d02 is up.
    //   THE ZZZ FIRES ONCE HERE, not on a countdown, because ITS PERIOD IS NOT READ. The note gives periods for
    // c 1101 (60) and c 1104 (48) and none for c 1102, and every other monster's 90 is THEIR value, not his --
    // importing it would be presenting another monster's number as his. `start` shows the record the ROM really
    // requests at the hold's frame 0 and claims nothing about a repeat. Upgrade to `every` when the period is read.
    '3|Motion[14]': { sets: [3] },
    '0|Motion[19]': { sets: [3], start: [['em008_00c', 1102]], puffOff: true },
    '0|Motion[20]': { sets: [3] },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[13]; c 1101 every 60 (cm200_001 on joint 1 at 5x), first at once.
    // L3 Motion[13] is also the SHOCK TRAP's hold ((10, 0x6e), c 1105 on the same joint and scale): shown as
    // paralysis, as every monster wired before him is.
    '3|Motion[13]': { every: [['em008_00c', 1101], 60] },
    // DEATH: L3 Motion[17] for (11, 0) and every status-11 number the table does not name, L3 Motion[12] at the
    // end of the fall (L3 M10 -> M11 -> M12, which NEVER reaches L3 M17), and L3 Motion[20] for (11, 7) /
    // (11, 0x12). The break set stays -- the part pass re-applies it every frame -- his eyes stay open because
    // death does not raise P+0x5d02, and NOTHING reverts, because rage changed nothing to revert.
    '3|Motion[17]': { dead: true },
    '3|Motion[12]': { dead: true, settled: true },
    '3|Motion[20]': { dead: true, settled: true },
  },
  // PLESIOTH (em010_00): E:\offline\decode\notes\states-em010_00.md, read and ROM-run by the Plesioth decode
  // agent (2026-09-25). Every change lands on FRAME 0 of the motion named.
  //   NOTHING HE SHOWS IS DRIVEN BY RAGE, TIREDNESS OR SLEEP. The part pass reads the four break levels and
  // nothing else, and the class never calls 0x71398 at all -- so the eye applier is dead and HE HAS NO LID. His
  // sleep hold changes nothing on the model, which is why it carries no `sets` where every other monster's does.
  //   HIS FINS BREAK BY MATERIAL, NOT BY MESH, and this table does not have to say so. The part pass rewrites the
  // alpha-test reference at mat+0x14 from the .mrl's 20/255 to 150/255 to erode the fin membranes, which live
  // inside an always-on group -- a threshold, not a group swap, and `sets` could never express it. The viewer
  // already does that write: render/monster.js ROM_BREAK_ALPHA carries em010_00 with {part 7, m50_wing_l, ref 150}
  // and {part 9, m51_wing_r, ref 150}, and applyBreakAlpha() drives it off the parts DRAWN rather than off any
  // table. Groups 7 and 9 are exactly what the broken fin sets below turn on, so drawing set 9 or set 10 raises
  // the reference on its own. Recorded here only so the next reader does not go hunting for a mesh swap.
  //   ALL FOUR BREAKS NEED LEVEL 2. Level 1 shows nothing at all on any of them.
  em010_00: {
    // L3 Motion[2] IS THREE THINGS -- the head (part 0), the back and dorsal fin (part 2), and the tune+0x44
    // exhaust status (10, 0x1b) -- so it CYCLES, one per play, as Malfestio's L3 M2 does. It is also the shock
    // trap's first 52 frames, which shows nothing of its own.
    //   HEAD at level 2: set 0 -> 5 (group 2 off, 3 on; 222 v -> 417 v), u 1001 on JOINT 3.
    //   BACK at level 2: set 1 -> 6 (group 4 off, 5 on), u 1011 on JOINT 134, and the m52_hire prim goes away.
    '3|Motion[2]':  { cycle: [{ levels: [[0], [0], [5]], fire: [null, null, ['em010_00u', 1001]] },
                              { levels: [[1], [1], [6]], fire: [null, null, ['em010_00u', 1011]] },
                              { start: [['em010_00c', 1109]] }] },
    // L3 Motion[1] IS BOTH PECTORAL FINS -- (10, 7) plays it for parts 1, 3, 4 and 7, and only 3 and 4 have a .dtp
    // row -- so it cycles through the two of them.
    //   +X FIN at level 2: set 3 -> 9 (group 6 off, 7 on; 50 v -> 85 v), u 1016 on JOINT 7. Drawing group 7 is
    // what raises material 50's alpha reference to 150 through ROM_BREAK_ALPHA.
    //   -X FIN at level 2: set 4 -> 10 (group 8 off, 9 on; 48 v -> 85 v), u 1021 on JOINT 13, group 9 likewise
    // raising material 51's.
    '3|Motion[1]':  { cycle: [{ levels: [[3], [3], [9]], fire: [null, null, ['em010_00u', 1016]] },
                              { levels: [[4], [4], [10]], fire: [null, null, ['em010_00u', 1021]] }] },
    // THE STUN, (10, 0x20) -- his ONLY sided reaction, and it is FOUR clips a side rather than three: direction 1
    // takes L3 M6 -> M7 -> M20 -> M8, direction 2 takes L3 M3 -> M4 -> M19 -> M5. c 1103 (cm200_003 on joint 3,
    // offset (0, 0, 20) at 0.6x, axisMask 1) into ONE held handle across all eight. The same eight clips are the
    // hind-leg depletion at an even break level, which shows nothing because parts 5 and 6 have no .dtp row.
    '3|Motion[6]':  { hold: ['em010_00c', 1103] },
    '3|Motion[7]':  { hold: ['em010_00c', 1103] },
    '3|Motion[20]': { hold: ['em010_00c', 1103] },
    '3|Motion[8]':  { hold: ['em010_00c', 1103] },
    '3|Motion[3]':  { hold: ['em010_00c', 1103] },
    '3|Motion[4]':  { hold: ['em010_00c', 1103] },
    '3|Motion[19]': { hold: ['em010_00c', 1103] },
    '3|Motion[5]':  { hold: ['em010_00c', 1103] },
    // RAGE: EMC group 6 issues (1, 2) on land -- L0 Motion[6] from frame 0 -- and (6, 5) submerged, which ends in
    // L0 Motion[22]. Nothing on the model follows either; the puff is the whole of it.
    '0|Motion[6]':  { rage: true },
    '0|Motion[22]': { rage: true },
    // TIRED: L0 Motion[1], which is ALSO his peaceful idle (0, 0) -- not his combat idle. So the clip itself says
    // nothing and the drool is the whole signal: c 1104 every 48 (cm200_006 on joint 3, pos (0, 30, 70) at 1x).
    '0|Motion[1]':  { rage: false, tired: true, every: [['em010_00c', 1104], 48] },
    // ASLEEP: (10, 0x1d) L3 Motion[10] lies down, (10, 0x1e) holds L3 Motion[17], then L0 M38 -> L3 M11 gets up.
    // NO `sets`: he has no lid and the eye applier is dead, so sleep shows nothing on him at all. The zzz c 1102
    // every 90 (cm200_002 on joint 3, offset (0, 80, 130) at 2x) and the puff paused are the whole of it.
    '3|Motion[17]': { every: [['em010_00c', 1102], 90], puffOff: true },
    // PARALYSIS: (10, 0x1f) holds L3 Motion[9]; c 1101 every 60 (cm200_001 on joint 1 at 5x), first at once.
    // L3 Motion[9] is also the SHOCK TRAP's hold ((10, 0x6e), c 1105 every 42 on the same joint at 4x): shown as
    // paralysis, as every monster wired before him is.
    '3|Motion[9]':  { every: [['em010_00c', 1101], 60] },
    // DEATH: L3 Motion[12] for (11, 0) direction 1 and for every status-11 number the table does not name,
    // L3 Motion[13] for (11, 0) direction 2, and L3 Motion[16] for (11, 7) / (11, 0x12). The break sets AND both
    // raised alpha references stay -- the part pass re-applies them every frame -- and nothing else changes,
    // because nothing else was ever driven by a state.
    //   (11, 2) IS UNREACHABLE HERE: it asks for L3 M23 -> L3 M24 and NEITHER SLOT EXISTS in his .lmt, so no
    // motion is listed for it rather than one being guessed.
    '3|Motion[12]': { dead: true },
    '3|Motion[13]': { dead: true },
    '3|Motion[16]': { dead: true, settled: true },
  },
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
  // SEREGIOS: the part pass re-applies these from `P+0x518` EVERY FRAME, not for the length of a clip, so
  // they are not a motion's sets. Set 2 -> 14 (group 3 off, 4 on, 108 on) is the one swap rage adds on its
  // own, and set 3 -> 15 is the flat/erect default for the four regions that carry no break (groups 5, 6, 9,
  // 17 against 10, 11, 14 + 102, 103, 106). The three regions that DO carry a break, and the tail, follow
  // rage at the user's level instead -- S_WING_R / S_WING_L / S_HEAD / S_TAIL. (states-em077_00.md 2, 2.1)
  em077_00: { calm: [2, 3], enraged: [14, 15] },
};

export const RAGE_BY_LEVEL = {
  // SILVERWIND: the same held trails, his own records. u 1120 while the head is below level 2 and u 1121 once it
  // breaks -- requested once at the hop's frame 0, swapped once if the head breaks mid-rage, stopped at rage end.
  em037_04: { levels: N_HEAD.calm, records: [['em037_04u', 1120], ['em037_04u', 1121]] },
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
  // DIABLOS: the first BURROWER wired. 72 of the 100 clips docs/monsters.json carries have a posture; only the
  // ones that are not plain ground are listed, as Khezu's are. He uses 0, 1, 3 and 4 -- NO wall and NO ceiling.
  //   POSTURE 4 IS THE BURROW (the .dtb calls that slot MoguriBaseOfs) and a LIST means the clip is genuinely
  //   played at more than one posture: the burrow reuses his ground clips underground, which is the whole point
  //   of it. THE VIEWER DRAWS NO PLANE FOR 4 OR 3 -- index.html's box has a wall and a ceiling only -- so these
  //   entries change nothing on screen yet; they are here because the posture is what the clip is, and because
  //   dev/posture-coverage.mjs needs them to tell a placed clip from a missed one.
  em007_00: {
    '0|Motion[1]': [0, 4], '0|Motion[5]': [0, 4], '0|Motion[7]': [0, 4], '0|Motion[24]': [0, 4],
    '0|Motion[32]': 1,
    '1|Motion[1]': [0, 1], '1|Motion[4]': [0, 1], '1|Motion[16]': [0, 1], '1|Motion[17]': [0, 3],
    '1|Motion[19]': [0, 1],
    '2|Motion[18]': 4,
    '3|Motion[19]': [0, 4], '3|Motion[21]': 4,
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
  // DIABLOS's 28. Every one is a clip no class site and no script reaches on a path the dataflow could follow,
  // and none of them is a state clip (states-em007_00.md 7.1).
  em007_00: Object.fromEntries([
    '0|Motion[3]', '0|Motion[9]', '0|Motion[10]', '0|Motion[11]', '0|Motion[12]', '0|Motion[13]',
    '0|Motion[21]', '0|Motion[39]', '0|Motion[41]', '0|Motion[42]', '0|Motion[43]',
    '1|Motion[2]', '1|Motion[3]', '1|Motion[5]', '1|Motion[6]', '1|Motion[7]', '1|Motion[8]', '1|Motion[9]',
    '1|Motion[10]', '1|Motion[11]', '1|Motion[12]', '1|Motion[14]', '1|Motion[15]', '1|Motion[18]',
    '1|Motion[20]', '2|Motion[3]', '3|Motion[27]', '3|Motion[28]',
  ].map(k => [k, 'no class site and no script reaches it on a path the dataflow could follow'])),
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

// THE TURN THE ENGINE MAKES, WHICH THE CLIP DOES NOT CARRY. Raven, 2026-09-27: "when monsters 'turn' the app
// forces them to remain looking forward"; then, when the pose path turned out to be passing rotation through
// untouched, "If you know the engine impacts animations then we need to replicate this behavior".
//
// MEASURED FIRST, because the viewer was not the culprit: a monster's root track is copied onto its skeleton
// rotation and all -- a clip with a net turn in it (Rathian's L0 Motion[26]_start, -41.8 degrees) draws at
// -44.0 -- and the clips simply do not carry one. Net first-key-to-last-key is about zero on 32 of Rathian's
// 36 L0 clips and on ALL 18 of her L2 clips, however far they swing in between (L2 Motion[3] sweeps 114
// degrees and comes home). `reference.quaternion` does not exist on a single clip. The body is animated; the
// UNIT is turned, and the two are separate in the game as they are here.
//
// THE OP. An action script is a run of 24-byte entries and op 0x0a is the turn. Its parameter block:
//     +0x00  f32  first frame        +0x04  f32  last frame
//     +0x08  s32  angle in the ROM's u16 units, 0x8000 = 180 degrees, SIGNED (negative turns left)
//     +0x0c  u32  (list << 8) | motion
// 118 distinct turns in 60 scripts, angles +-180, +-90, +135, +-60 and one -140. NONE on list 2: attacks are
// not turned this way, they are steered by the AI toward its target, and that has no angle in the data to
// replay -- so an attack that swings the monster round in the game does not here, and will not until someone
// reads the steering.
//
// WHOSE SCRIPT IS WHOSE, read rather than assumed. A script -> the .data slot that lists it (its class's
// action table) -> the code that materialises that table (the binary is PIC: `ldr rX,[pc,#imm]` then
// `add rY, pc, rX`) -> the em id string that code names. 36 of the 60 land within 2 KB of a name; a
// candidate 171 KB away names a different class and is thrown out. The other 24 are named by their CLIPS
// instead -- the scripts run in class order, so an unnamed one lies between two named ones and only a
// monster in that window whose .lmt can hold every clip it turns, to the frame the window ends at, can own
// it. That settles Nargacuga: between em033_00 and em038_00 only em037_00 and em037_04 hold L3 M33 to frame
// 144 and L3 M4 to 122, and those two are one class. A CLASS SCRIPT SERVES ITS VARIANTS (uEm043_00 is
// Deviljho and Savage), so the entry goes to every monster of the class whose own clips can hold it.
//
// CHECKED against the two turns the decode notes already record, both matching to the frame: Rathian's tail
// sever, +180 over L3 Motion[15] f148..245 (script 0x1794a8c, named em001_00 by code 136 bytes away), and
// Nargacuga's, -180 over L3 Motion[4] f52..122 (script 0x17bced8).
//
// WHAT IS NOT READ: how the angle is spread across the window. The op gives an angle and a first and last
// frame and nothing else, so the turn here runs LINEARLY between them; whether the engine eases it is in the
// op's handler, which has not been found. Everything else -- the angle, its sign, the frames, the clip and
// the owner -- is off the ROM.
//
// The 14 scripts still unnamed, with their turns, so they can be placed later rather than guessed now:
//   0x179eea8  L3M33 +180 f40-70
//   0x17aee48  L3M15 -180 f82-156
//   0x17bba84  L3M30 +180 f40-70
//   0x17c300c  L3M26 +180 f64-104; L3M19 -90 f140-160; L3M30 -90 f250-290
//   0x17c44b0  L3M13 -180 f94-140; L3M3 -90 f58-118; L3M3 -90 f58-118
//   0x17c6958  L3M13 -180 f94-140; L3M3 -90 f58-118; L3M3 -90 f58-118
//   0x17ca27c  L3M28 +90 f8-40; L3M4 +90 f90-170
//   0x17cca5c  L3M55 +180 f10-30
//   0x17d6e64  L3M33 +180 f104-154
//   0x17ea130  L3M28 +180 f40-70
//   0x17f1b64  L3M8 +60 f82-98; L3M4 -60 f82-98; L3M16 +60 f114-146; L3M4 -60 f82-98; L3M8 +60 f82-98
//   0x17f7e78  L3M35 -180 f46-60; L3M3 +180 f0-38; L3M17 -90 f0-62; L3M3 +180 f0-38; L3M3 +180 f0-38; L3M3 +180 f0-38
//   0x181a4e4  L3M2 +90 f0-31; L3M2 -90 f0-31; L3M2 +180 f0-31; L3M2 +90 f0-31; L3M2 -90 f0-31; L3M2 +180 f0-31; L3M2 +90 f0-41; L3M2 -90 f0-41; L3M2 -180 f0-41
//   0x181b980  L3M3 +135 f0-30
export const CLIP_TURN = {
  // 0x1794a8c
  em001_00: { '3|Motion[15]': { deg: 180, from: 148, to: 245 }, '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x1794a8c
  em001_02: { '3|Motion[15]': { deg: 180, from: 148, to: 245 }, '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x1794a8c
  em001_04: { '3|Motion[15]': { deg: 180, from: 148, to: 245 }, '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x1798884
  em004_00: { '3|Motion[15]': { deg: 180, from: 148, to: 244 }, '3|Motion[28]': { deg: 90, from: 34, to: 80 } },
  // 0x179a23c
  em007_00: { '3|Motion[15]': { deg: 180, from: 148, to: 244 }, '3|Motion[31]': { deg: 180, from: 40, to: 70 } },
  // 0x179a23c
  em007_04: { '3|Motion[15]': { deg: 180, from: 148, to: 244 }, '3|Motion[31]': { deg: 180, from: 40, to: 70 }, '9|Motion[17]': { deg: -140, from: 198, to: 222 } },
  // 0x179ba40
  em008_00: { '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x179d3c8
  em009_00: { '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x17a6a28
  em013_00: { '3|Motion[23]': { deg: 90, from: 18, to: 38 }, '3|Motion[24]': { deg: -90, from: 26, to: 56 } },
  // 0x17a6a28
  em013_01: { '3|Motion[23]': { deg: 90, from: 18, to: 38 }, '3|Motion[24]': { deg: -90, from: 26, to: 56 } },
  // 0x17a6a28
  em013_02: { '3|Motion[23]': { deg: 90, from: 18, to: 38 }, '3|Motion[24]': { deg: -90, from: 26, to: 56 } },
  // 0x17aacd0
  em017_00: { '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x17ac8fc
  em018_00: { '3|Motion[15]': { deg: 180, from: 148, to: 245 }, '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x17ac8fc
  em018_04: { '3|Motion[15]': { deg: 180, from: 148, to: 245 }, '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x17adf24
  em019_00: { '3|Motion[15]': { deg: -180, from: 82, to: 156 } },
  // 0x17adf24
  em019_04: { '3|Motion[15]': { deg: -180, from: 82, to: 156 } },
  // 0x17b0868
  em021_00: { '3|Motion[23]': { deg: -180, from: 55, to: 95 } },
  // 0x17b1aec
  em022_00: { '3|Motion[24]': { deg: -180, from: 55, to: 95 } },
  // 0x17b2d34
  em023_00: { '3|Motion[29]': { deg: -180, from: 55, to: 95 } },
  // 0x17b2d34
  em023_05: { '3|Motion[29]': { deg: -180, from: 55, to: 95 } },
  // 0x17b4314
  em024_00: { '3|Motion[9]': { deg: -180, from: 0, to: 104 }, '3|Motion[55]': { deg: -180, from: 4, to: 24 } },
  // 0x17b71b8
  em027_00: { '3|Motion[9]': { deg: -180, from: 0, to: 104 }, '3|Motion[55]': { deg: -180, from: 0, to: 40 } },
  // 0x17b93f4
  em032_00: { '3|Motion[2]': { deg: 180, from: 4, to: 13 }, '3|Motion[4]': { deg: -180, from: 52, to: 122 }, '3|Motion[33]': { deg: -180, from: 110, to: 144 } },
  // 0x17b93f4
  em032_04: { '3|Motion[2]': { deg: 180, from: 4, to: 13 }, '3|Motion[4]': { deg: -180, from: 52, to: 122 }, '3|Motion[33]': { deg: -180, from: 110, to: 144 } },
  // 0x17baa44
  em033_00: { '3|Motion[15]': { deg: -180, from: 94, to: 208 } },
  // 0x17bced8
  em037_00: { '3|Motion[4]': { deg: -180, from: 52, to: 122 }, '3|Motion[33]': { deg: -180, from: 110, to: 144 } },
  // 0x17bced8
  em037_04: { '3|Motion[4]': { deg: -180, from: 52, to: 122 }, '3|Motion[33]': { deg: -180, from: 110, to: 144 } },
  // 0x17be268
  em038_00: { '3|Motion[15]': { deg: -180, from: 94, to: 208 } },
  // 0x17bf514
  em042_00: { '3|Motion[13]': { deg: 90, from: 140, to: 220 }, '3|Motion[31]': { deg: -180, from: 110, to: 144 } },
  // 0x17c0848
  em043_00: { '3|Motion[15]': { deg: -90, from: 140, to: 160 }, '3|Motion[23]': { deg: -90, from: 80, to: 160 }, '3|Motion[24]': { deg: 90, from: 80, to: 160 }, '3|Motion[31]': { deg: 180, from: 64, to: 104 } },
  // 0x17c0848
  em043_05: { '3|Motion[15]': { deg: -90, from: 140, to: 160 }, '3|Motion[23]': { deg: -90, from: 80, to: 160 }, '3|Motion[24]': { deg: 90, from: 80, to: 160 }, '3|Motion[31]': { deg: 180, from: 64, to: 104 } },
  // 0x17c1e4c
  em044_00: { '3|Motion[3]': { deg: -90, from: 90, to: 121 }, '3|Motion[4]': { deg: 90, from: 92, to: 122 }, '3|Motion[12]': { deg: -90, from: 204, to: 244 }, '3|Motion[16]': { deg: -90, from: 110, to: 120 }, '3|Motion[26]': { deg: 180, from: 64, to: 104 } },
  // 0x17c58c0
  em047_00: { '3|Motion[13]': { deg: -180, from: 94, to: 140 } },
  // 0x17c7bb0
  em050_00: { '3|Motion[13]': { deg: -180, from: 76, to: 142 }, '3|Motion[55]': { deg: -180, from: 4, to: 24 } },
  // 0x17c901c
  em055_00: { '3|Motion[3]': { deg: 90, from: 80, to: 140 }, '3|Motion[4]': { deg: -90, from: 80, to: 140 }, '3|Motion[31]': { deg: 180, from: 74, to: 120 } },
  // 0x17cb4d0
  em057_00: { '3|Motion[19]': { deg: 90, from: 50, to: 70 }, '3|Motion[24]': { deg: 180, from: 52, to: 80 } },
  // 0x17cb4d0
  em057_04: { '3|Motion[19]': { deg: 90, from: 50, to: 70 }, '3|Motion[24]': { deg: 180, from: 52, to: 80 } },
  // 0x17d60ac
  em060_00: { '3|Motion[28]': { deg: 180, from: 104, to: 154 } },
  // 0x17d60ac
  em060_04: { '3|Motion[28]': { deg: 180, from: 104, to: 154 } },
  // 0x17d87ec
  em061_00: { '3|Motion[25]': { deg: 180, from: 104, to: 154 } },
  // 0x17d87ec
  em061_04: { '3|Motion[25]': { deg: 180, from: 104, to: 154 } },
  // 0x17d9dc8
  em063_00: { '3|Motion[2]': { deg: -90, from: 90, to: 120 }, '3|Motion[3]': { deg: 90, from: 90, to: 120 }, '3|Motion[22]': { deg: -90, from: 204, to: 244 }, '3|Motion[31]': { deg: 180, from: 64, to: 104 } },
  // 0x17d9dc8
  em063_05: { '3|Motion[2]': { deg: -90, from: 90, to: 120 }, '3|Motion[3]': { deg: 90, from: 90, to: 120 }, '3|Motion[22]': { deg: -90, from: 204, to: 244 }, '3|Motion[31]': { deg: 180, from: 64, to: 104 } },
  // 0x17db30c
  em065_00: { '0|Motion[16]': { deg: -180, from: 0, to: 30 } },
  // 0x17e88dc
  em077_00: { '3|Motion[15]': { deg: 180, from: 148, to: 245 }, '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x17eb830
  em080_00: { '3|Motion[11]': { deg: 90, from: 50, to: 80 }, '3|Motion[15]': { deg: -90, from: 140, to: 160 }, '3|Motion[23]': { deg: -90, from: 80, to: 160 }, '3|Motion[24]': { deg: 90, from: 80, to: 140 }, '3|Motion[45]': { deg: 180, from: 64, to: 104 } },
  // 0x17eb830
  em080_04: { '3|Motion[11]': { deg: 90, from: 50, to: 80 }, '3|Motion[15]': { deg: -90, from: 140, to: 160 }, '3|Motion[23]': { deg: -90, from: 80, to: 160 }, '3|Motion[24]': { deg: 90, from: 80, to: 140 }, '3|Motion[45]': { deg: 180, from: 64, to: 104 }, '9|Motion[20]': { deg: -90, from: 140, to: 160 } },
  // 0x17ecf70
  em081_00: { '3|Motion[15]': { deg: 180, from: 148, to: 245 }, '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x17ecf70
  em081_04: { '3|Motion[15]': { deg: 180, from: 148, to: 245 }, '3|Motion[28]': { deg: 180, from: 40, to: 70 } },
  // 0x17eeeac
  em082_00: { '3|Motion[13]': { deg: 180, from: 52, to: 68 }, '3|Motion[23]': { deg: 180, from: 46, to: 90 } },
  // 0x17eeeac
  em082_04: { '3|Motion[13]': { deg: 180, from: 52, to: 68 }, '3|Motion[23]': { deg: 180, from: 46, to: 90 } },
  // 0x17f9080
  em086_00: { '3|Motion[21]': { deg: 90, from: 120, to: 170 }, '3|Motion[36]': { deg: 90, from: 110, to: 138 }, '3|Motion[37]': { deg: 90, from: 60, to: 78 } },
  // 0x180bf74
  ems002_00: { '3|Motion[3]': { deg: 135, from: 0, to: 30 } },
  // 0x180bbdc, 0x180c164
  ems003_00: { '3|Motion[3]': { deg: 135, from: 0, to: 30 }, '3|Motion[4]': { deg: 135, from: 0, to: 30 } },
  // 0x18104bc
  ems016_00: { '3|Motion[3]': { deg: 135, from: 0, to: 30 } },
  // 0x1815c0c
  ems034_00: { '3|Motion[2]': { deg: 90, from: 0, to: 31 } },
  // 0x1816834
  ems035_00: { '3|Motion[3]': { deg: 180, from: 0, to: 38 } },
  // 0x1818f70
  ems044_00: { '3|Motion[2]': { deg: -180, from: 68, to: 98 } },
};
// The turn a clip has reached at `frame`, in degrees; 0 where the ROM turns nothing.
export function turnAt(monId, list, clip, frame){
  const t = CLIP_TURN[monId] && CLIP_TURN[monId][list + '|' + clip];
  if (!t) return 0;
  if (!(frame > t.from)) return 0;
  if (frame >= t.to) return t.deg;
  return t.deg * (frame - t.from) / (t.to - t.from);
}

export const CEILING_ABOVE_GAME = 838;
export const postureOf = (monId, list, clip) => {
  const t = CLIP_POSTURE[monId];
  const p = t && t[list + '|' + clip];
  return p == null ? 0 : p;
};

export const RAGE_PUFF = {
  // DIABLOS: HIS PICK IS LIVE, the first one that is. vtable +0x2a4 = 0xd451f0 is BYTE-IDENTICAL to Rathian's
  // 0xd08afc, and his setup writes P+0x5d04 = 4 -- the same joint she reads -- so rathianPuffPick answers for him
  // unchanged. u 1120 and 1121 differ: same file and joint 3, pos (0, -40, 60) against (0, -40, 80), scale 0.9.
  //   Their file is `effect\em\em007\em007_04_001`, the VARIANT's path, and it is the only em007_04_* path
  //   anywhere in em007_00u.pel; em007_04u.pel's own 1120 / 1121 name the same file, joint and offsets at scale
  //   1.0, so the two variants share one puff effect that happens to carry the variant's name. Why it is named
  //   that way is NOT READ, and nothing about the effect is monster-specific.
  em007_00: { period: 30, joint: 4, records: [['em007_00u', 1120], ['em007_00u', 1121]], pick: rathianPuffPick },
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
  // VELOCIDROME: vtable +0x2a4 is the base stub 0x6bf64, so 0xa425c turns its 0 into id 1 and the request is
  // always u 1121; key 1120 is never asked for. His two records are BYTE-IDENTICAL (both cm200_007 on joint 2,
  // pos (0, 0, 50), rot 0, scale (0.1, 0.4, 0.4), mode 0, subMode 0, end 0, axisMask 3), so the difference could
  // not show anyway. THE CLASS NEVER WRITES e+0xb7d2 -- no such immediate anywhere in 0xd8e188..0xd960e4 -- so
  // the base constructor's 1 stands and the puff RUNS. He is not a Silverwind case.
  em014_00: { period: 30, joint: 2, records: [['em014_00u', 1120], ['em014_00u', 1121]], pick: () => 0 },
  // HIS THREE SIBLINGS run the same class, so the same stub pick and the same always-1121, and each carries its own
  // byte-identical 1120 / 1121 pair on JOINT 2 -- only the offset and scale differ, and only 1121 is ever built:
  // Gendrome (0, 0, 25) at (0.2, 0.5, 0.5), Iodrome (0, 0, 30) at (0.2, 0.4, 0.4), Giadrome (0, 0, 50) at
  // (0.1, 0.4, 0.4), which is Velocidrome's exactly. (states-em014_00.md 4.3, 8)
  em015_00: { period: 30, joint: 2, records: [['em015_00u', 1120], ['em015_00u', 1121]], pick: () => 0 },
  em016_00: { period: 30, joint: 2, records: [['em016_00u', 1120], ['em016_00u', 1121]], pick: () => 0 },
  em034_00: { period: 30, joint: 2, records: [['em034_00u', 1120], ['em034_00u', 1121]], pick: () => 0 },
  // DAIMYO HERMITAUR: the same stub shape -- vtable +0x2a4 is the base 0x6bf64, so 0xa425c turns its 0 into id 1
  // and the request is always u 1121; his 1120 and 1121 are byte-identical, and they are HIS OWN effect rather
  // than the shared cm200_007: em019_00_003 on joint 1 at (0, 0, 50), scale (0.5, 0.9, 0.9) -- the first
  // non-uniform puff scale recorded. The class writes neither e+0xb7d2 nor e+0xb7d3 anywhere in
  // 0xdb3ef8..0xdc15bc, so the puff and the drool both run. (states-em019_00.md 4.3)
  em019_00: { period: 30, joint: 1, records: [['em019_00u', 1120], ['em019_00u', 1121]], pick: () => 0 },
  // ASTALOS: period 30 on JOINT 4, and his vtable +0x2a4 is NOT overridden -- it is the base stub 0x6bf64
  // (mov r0,#0 / bx lr), so 0xa425c turns that 0 into u id 1 and the request is always key 1121; 1120 is never
  // asked for. `pick: () => 0` is what selects 1121 here, because schedule.js does the ROM's own inversion
  // (records[pick() === 1 ? 0 : 1]). His two records are byte-identical anyway (both cm200_007, joint 4, pos 0,
  // rot 0, scale (0.75, 1.3, 1.3), mode 0, angOrder 0) -- note the NON-UNIFORM scale and angOrder 0, where
  // Barioth's puff is uniform and angOrder 4. The class writes neither e+0xb7d2 nor e+0xb7d3 (only e+0xb7d1 = 1),
  // so 0xa41b8's block runs and both the puff and the drool fire.
  em081_00: { period: 30, joint: 4, records: [['em081_00u', 1120], ['em081_00u', 1121]], pick: () => 0 },
  // BOLTREAVER: the same shape as Astalos's -- period 30 on JOINT 4, vtable +0x2a4 the base stub 0x6bf64, so
  // 0xa425c turns its 0 into u id 1 and the request is always key 1121; 1120 is never asked for. His 1120 and 1121
  // are byte-identical too (cm200_007, joint 4, pos 0, rot 0, scale (0.75, 1.3, 1.3), mode 0, angOrder 0), so the
  // difference could not show. The class writes neither e+0xb7d2 nor e+0xb7d3, so 0xa41b8's block runs and both the
  // puff and the drool fire. `pick: () => 0` selects 1121, because schedule.js does the ROM's own inversion.
  em081_04: { period: 30, joint: 4, records: [['em081_04u', 1120], ['em081_04u', 1121]], pick: () => 0 },
  // GRAVIOS: the same again, on the same class -- his vtable +0x2a4 is the base stub 0x6bf64 read at the vtable word
  // (not inherited from the Basarios note), the class writes neither e+0xb7d2 nor +0xb7d3, so 0xa41b8's block runs,
  // and the id is always 1 -> key 1121. His two records differ as Basarios's do (1120 is scale 1 at (0, -20, 20),
  // 1121 scale 0.6 at (0, -40, 35) -- and his 1121 is byte-for-byte Basarios's, his 1120 is not), and again only
  // 1121 is ever built. (states-em005_00.md 4.3)
  em005_00: { period: 30, joint: 4, records: [['em005_00u', 1120], ['em005_00u', 1121]], pick: () => 0 },
  // GYPCEROS: the same stub shape -- vtable +0x2a4 is the base 0x6bf64, so the id is always 1 and the request is
  // always u 1121; his 1120 and 1121 are byte-identical (cm200_007, joint 3, pos (0, -30, 150), scale
  // (0.3, 0.9, 0.9) -- the one puff record we have read that is not uniform). The class writes neither
  // e+0xb7d2 nor e+0xb7d3, so the puff and the drool both run -- but `vtable +0x2d8` turns both off while he is
  // PLAYING DEAD (the two `puffOff` rows above). (states-em009_00.md 0, 6)
  em009_00: { period: 30, joint: 3, records: [['em009_00u', 1120], ['em009_00u', 1121]], pick: () => 0 },
  // CEPHADROME: the same stub shape -- vtable +0x2a4 is the base 0x6bf64, so the id is always 1 and the request
  // is always u 1121; his 1120 and 1121 are byte-identical (cm200_007, joint 3, offset (0, -30, 100), scale
  // (0.5, 0.9, 0.9)). The class never writes e+0xb7d2, so the base leaves it 1 and both the puff and the drool
  // run. His puff also starts in postures where the rage ENTRY issues no action at all. (states-em017_00.md 0)
  em017_00: { period: 30, joint: 3, records: [['em017_00u', 1120], ['em017_00u', 1121]], pick: () => 0 },
  // BLANGONGA: the same stub shape -- always u 1121, joint 3, offset (0, -60, 50) at a squashed (0.4, 0.9, 0.8);
  // 1120 is identical and never requested. The class does not write e+0xb7d2, so the puff runs -- and it is
  // the ONLY thing rage shows on him, since his class never calls isEnraged at all. (states-em022_00.md 0)
  em022_00: { period: 30, joint: 3, records: [['em022_00u', 1120], ['em022_00u', 1121]], pick: () => 0 },
  // FURIOUS RAJANG: the same stub shape -- vtable +0x2a4 is the base 0x6bf64, 0xa425c turns its 0 into id 1 and
  // the request is always u 1121; his 1120 and 1121 are byte-identical (em023_00_016, joint 2, pos (0, -40, 10),
  // scale 1), so nothing is read from the pick's answer either way. WHAT IS HIS ALONE is that the block runs at
  // all: vtable +0x1d8 writes e+0xb7d2 = 0 for variant 0, and 0xa41b8 tests that byte, so PLAIN RAJANG HAS NO
  // PUFF and Furious Rajang does -- the inverse of Savage Deviljho. (states-em023_05.md 4.3)
  em023_05: { period: 30, joint: 2, records: [['em023_05u', 1120], ['em023_05u', 1121]], pick: () => 0 },
  // BULLDROME: the stub shape again -- always u 1121 (cm200_007, joint 3, scale (0.1, 0.5, 0.5), and 1120 is
  // byte-identical). The class writes neither e+0xb7d2 nor e+0xb7d3 (a full-text scan of the 15 sites in the
  // ROM finds none inside his code), so the puff and the drool both run -- and since his rage has NO entry
  // action at all, the puff is literally everything rage shows on him. (states-em030_00.md 0, 4.1)
  em030_00: { period: 30, joint: 3, records: [['em030_00u', 1120], ['em030_00u', 1121]], pick: () => 0 },
  // LAVASIOTH: the stub shape -- always u 1121 (cm200_007, joint 3, offset (0, 30, 90) at 0.7x). HIS TWO RECORDS
  // ARE NOT IDENTICAL: 1120 and 1121 sit 30 units apart, so getting the convention's inversion the wrong way
  // round would be visible on him, as it would on Glavenus. e+0xb7d2 is never written, so the puff runs.
  // (states-em036_00.md 0)
  em036_00: { period: 30, joint: 3, records: [['em036_00u', 1120], ['em036_00u', 1121]], pick: () => 0 },
  // BARROTH: the same stub shape -- +0x2a4 is the base 0x6bf64, the id is always 1 and the request is always
  // u 1121; his 1120 and 1121 are byte-identical (em044_00_010, joint 3, pos (0, 145, 155), scale 1). The
  // class writes neither e+0xb7d2 nor e+0xb7d3, so the puff and the drool both run. (states-em044_00.md 0)
  em044_00: { period: 30, joint: 3, records: [['em044_00u', 1120], ['em044_00u', 1121]], pick: () => 0 },
  // ROYAL LUDROTH: the same stub, but HIS PUFF RECORDS ARE HIS OWN FILE -- effect\em\em047\em047_00_002 on
  // joint 2, offset (0, 0, 80) at 0.5x, where every other monster's 1120 / 1121 are the shared cm200_007.
  // e+0xb7d2 is never written, so it runs. (states-em047_00.md 0, 4.4)
  em047_00: { period: 30, joint: 2, records: [['em047_00u', 1120], ['em047_00u', 1121]], pick: () => 0 },
  // ALATREON, AND HE IS THE ONE WHOSE `pick` IS () => 1. Read this before changing it. Every other entry in this
  // table models the SHARED puff at 0xa41b8, whose vtable +0x2a4 returns 0 and whose id at 0xa425c then
  // inverts into 1 -- which is why `pick: () => 0` selects key 1121 everywhere above. Alatreon's puff is NOT
  // that one: his class writes `e+0xb7d2 = 0` (0xec4aa0), which switches the shared request off entirely, and
  // runs its own in vtable +0x208 (0xecce08) -- same period 30, joint 2, but the id is picked by THE FORM:
  //     id = ([[e+0x1428]+0x1bb] == 2) ? 1002 : 1001   ->   u 1121 blue, u 1120 red
  // and his two records are two DIFFERENT effect files (em050_00_040 red, em050_00_039 blue), not the usual
  // byte-identical cm200_007 pair. schedule.js still does `records[pick() === 1 ? 0 : 1]`, so selecting his
  // RED record -- what forms 0 and 1 ask for, which is most of the fight -- needs `pick: () => 1`.
  // THE BLUE RECORD IS NOT REACHABLE from here: `pick(q)` is handed a joint quaternion and cannot see the
  // form byte, and nothing else in the schedule can either. Raised rather than faked. (states-em050_00.md 5.3)
  em050_00: { period: 30, joint: 2, records: [['em050_00u', 1120], ['em050_00u', 1121]], pick: () => 1 },
  // NIBELSNARF: the stub shape -- always u 1121, and his sits on JOINT 135 (the jaw) at a stretched (1, 2, 2)
  // rather than the usual joint 3 or 4. e+0xb7d2 is never written, so it runs. (states-em056_00.md 0)
  em056_00: { period: 30, joint: 135, records: [['em056_00u', 1120], ['em056_00u', 1121]], pick: () => 0 },
  // BRACHYDIOS: the same stub shape -- always u 1121, on JOINT 4 at 1.4x (cm200_007, offset (0, 0, 30)). The
  // class writes neither e+0xb7d2 nor e+0xb7d3, so the puff and the drool both run. His puff stops when the
  // rage FLAG clears, which is before his slime colour follows -- the gauge takes up to 30 more frames.
  // (states-em063_00.md 0)
  em063_00: { period: 30, joint: 4, records: [['em063_00u', 1120], ['em063_00u', 1121]], pick: () => 0 },
  // ZAMTRIOS: back to the ordinary shape -- vtable +0x2a4 is the base stub, so the id is always 1 and the request
  // is always u 1121 (cm200_007, joint 3, pos (0, -60, 200) at 1.1x); 1120 is never asked for. The class
  // writes neither e+0xb7d2 nor e+0xb7d3 (only e+0xb7d4, which nothing reads), so the puff and the drool both
  // run. His rage roar is also the action that puts his ice armour on. (states-em067_00.md 0, 5)
  em067_00: { period: 30, joint: 3, records: [['em067_00u', 1120], ['em067_00u', 1121]], pick: () => 0 },
  // SELTAS QUEEN: the ordinary shape -- the base stub at +0x2a4, so always u 1121 (cm200_007, joint 1, offset
  // (0, 80, 30), scale (0.9, 1, 1.5)). Her `e+0xb7d2` is never written, so the shared puff runs. Worth noting
  // because it looked like Alatreon's case at first: her vtable +0x208 IS overridden, but it holds the male
  // Seltas's coupling aura rather than a puff of her own. (states-em069_00.md 0, 5)
  em069_00: { period: 30, joint: 1, records: [['em069_00u', 1120], ['em069_00u', 1121]], pick: () => 0 },
  // SEREGIOS: HIS PICK IS LIVE. vtable +0x2a4 = 0xfeded8 is Rathian's 0xd08afc arithmetic for arithmetic (the
  // same atan2 of joint 4's third axis, the same 10430.378, the same -4552 threshold = -25.0076 deg), and
  // 0xfda1a8 writes `P+0x5d04 = 4` -- her joint -- so rathianPuffPick answers for him unchanged. His two
  // records DIFFER, where Barioth's are byte-identical: both cm200_007 on joint 4, u 1120 at pos (0, 0, 20)
  // scale 1 subMode 2, u 1121 at pos 0 scale 0.7 subMode 0. The class writes neither `e+0xb7d2` nor
  // `e+0xb7d3`, so the puff and the drool both run. WHICH of his clips put joint 4 past -25 deg is NOT
  // MEASURED in the note. (states-em077_00.md 5.3)
  em077_00: { period: 30, joint: 4, records: [['em077_00u', 1120], ['em077_00u', 1121]], pick: rathianPuffPick },
  // GLAVENUS: the same stub shape -- vtable +0x2a4 is the base 0x6bf64, so the id is always 1 and the request is
  // always u 1121. HIS TWO RECORDS ARE NOT IDENTICAL, unlike most: same file (em080_00_000), same joint 4, same
  // scale 0.8, but pos (0, -20, 20) for 1120 against (0, -60, 70) for 1121 -- so here the convention's
  // inversion is visible on screen, and `pick: () => 0` selecting 1121 is worth reading twice.
  // (states-em080_00.md 0)
  em080_00: { period: 30, joint: 4, records: [['em080_00u', 1120], ['em080_00u', 1121]], pick: () => 0 },
  // HELLBLADE GLAVENUS: vtable +0x2a4 is the base stub 0x6bf64 -- there is only one vtable in this family and
  // Glavenus's entry is the same one -- so 0xa425c turns its 0 into id 1 and the request is always u 1121;
  // key 1120 is never asked for. His pair are BYTE-IDENTICAL to each other (effect\em\em080\em080_00_000,
  // joint 4, pos (0, -100, 50), scale 1, axisMask 1) but they are NOT Glavenus's records: his are scale 0.8 at
  // (0, -20, 20) / (0, -60, 70). The class writes neither e+0xb7d2 nor e+0xb7d3, so the puff and the tired
  // drool both run. (states-em080_04.md 0, 5)
  em080_04: { period: 30, joint: 4, records: [['em080_04u', 1120], ['em080_04u', 1121]], pick: () => 0 },
  // GAMMOTH: the same stub shape -- vtable +0x2a4 is the base 0x6bf64, so the id is always 1 and the request is
  // always u 1121; her 1120 and 1121 are byte-identical (cm200_007, joint 3, offset (0, -50, 50), scale 2.5).
  // The class writes neither e+0xb7d2 nor e+0xb7d3 anywhere (0 hits over the whole class), so the puff and the
  // drool both run -- the opposite of Silverwind Nargacuga. (states-em083_00.md 0, 5.4)
  em083_00: { period: 30, joint: 3, records: [['em083_00u', 1120], ['em083_00u', 1121]], pick: () => 0 },
  // ELDERFROST GAMMOTH: the same class, the same stub, and his 1120 / 1121 are BYTE-IDENTICAL to Gammoth's
  // (cm200_007, joint 3, offset (0, -50, 50), scale 2.5) -- only the file they live in is his. Neither
  // e+0xb7d2 nor e+0xb7d3 is written anywhere in the class on either variant path (checked for the indirect
  // offset trick as well), so his puff and his drool both run. (states-em083_04.md)
  em083_04: { period: 30, joint: 3, records: [['em083_04u', 1120], ['em083_04u', 1121]], pick: () => 0 },
  // GREAT MACCAO: the ordinary shape -- the base stub at +0x2a4, so always u 1121 (cm200_007, JOINT 4, pos
  // (0, -10, 10) at a very small (0.25, 0.5, 0.5)), and `e+0xb7d2` is never written so it runs. His vtable
  // +0x208 is a single `bx lr`, so unlike Alatreon there is no second puff hiding there.
  // (states-em085_00.md 0, 4.3)
  em085_00: { period: 30, joint: 4, records: [['em085_00u', 1120], ['em085_00u', 1121]], pick: () => 0 },
  // MALFESTIO: period 30 on JOINT 4, offset (0, -50, 0), scale (0.25, 0.5, 0.5). vtable +0x2a4 is the base
  // stub 0x6bf64, so the request is always key 1121 and 1120 is never asked for; his two records are
  // byte-identical anyway. The class writes neither e+0xb7d2 nor e+0xb7d3, so the puff and the drool both run.
  em079_00: { period: 30, joint: 4, records: [['em079_00u', 1120], ['em079_00u', 1121]], pick: () => 0 },
  // NIGHTCLOAK: the same puff from his own u.pel. His 1120 and 1121 are byte-identical to each other AND to
  // Malfestio's, +0x2a4 is the base stub, and the class writes neither e+0xb7d2 nor e+0xb7d3 on either branch.
  em079_04: { period: 30, joint: 4, records: [['em079_04u', 1120], ['em079_04u', 1121]], pick: () => 0 },
  // YIAN KUT-KU: period 30 on JOINT 4, offset (0, -40, 80). +0x2a4 is the base stub, so it is always key
  // 1121 -- and unlike every monster wired before him HIS TWO RECORDS DIFFER: same file, same joint, same
  // offset, but scale 1.0 on 1120 against 0.7 on 1121. The ROM shows the 0.7 one, so the stubbed pick is a
  // visible choice here rather than a distinction without one.
  em008_00: { period: 30, joint: 4, records: [['em008_00u', 1120], ['em008_00u', 1121]], pick: () => 0 },
  // PLESIOTH: period 30 on JOINT 3, offset (0, 0, 40), scale (0.4, 0.9, 0.9). +0x2a4 is the base stub, so
  // always key 1121; e+0xb7d2 is never written, so the puff and the drool both run.
  em010_00: { period: 30, joint: 3, records: [['em010_00u', 1120], ['em010_00u', 1121]], pick: () => 0 },
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
