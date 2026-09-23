// SHELLS: the objects a monster's ACTION code spawns (a breath's body, thrown rocks, debris), translated from the ROM.
//
// Decode notes (every address below is explained there): E:\offline\decode\notes\shells-em043.md.
// ROM: C:\MHGU-ROM\exefs main.text (VA 0), main.rodata (VA 0x13ef000), main.data (VA 0x1728000). Data: the monster's
// .arc (C:\MHGU-Extract\scratch-em\em043_05\em043_05.arc), folder shell\em\em043_05_shellNN.
//
// WHAT THIS MODULE IS. A step function the effect runtime calls once per game frame (1/60 s, the same step as
// render/rom/effect/schedule.js). It reproduces, from the clip the viewer plays, what the monster's code does:
//   * WHEN a shell spawns: the attack action tests "the motion passed frame F" (0xb0974 -> 0x72714) in the enemy's
//     action code, which runs BEFORE that game frame's motion advance (enemy frame 0xada80: action main 0xadddc,
//     advance 0xae10c -> 0x71984 -> 0x94e1a0, joint build 0xae16c -> 0xa807c). The test reads the PREVIOUS advance:
//     prev = motion +0x500 (the frame before it), cur = +0x500 + step (+0x13b8) = the frame the pose now shows.
//     So at step k (pose F[k]) the test is F[k-2] < F <= F[k-1], and the shell's init reads the joint matrices built
//     for pose F[k-1]. The shell is then appended to unit move line 18 (0x48ba04: (r2 & 1) | 9 << 1), which the unit
//     manager walks after the enemy's line 4 (0xc0437c walks lines 0..n in order; enemies 0x4ec18), so its first
//     move runs in the SAME game frame, on the joints built for F[k].
//   * WHERE it is and how it moves: the class's init (vtable +0x13c) and per-frame move (+0x24), line by line,
//     in float32 as the ARM code computes them (Math.fround on every VFP result, trunc for vcvt.s32).
//   * WHICH effect it starts, where, and when it stops it: the .shl's per-mode rShellEffectParam (listId, uniqueId);
//     listId 0 = the .shl EffectLists[0] = effect\pel\em\em043_05u (u.pel). The request is handed to the caller as
//     data (the requester fields the ROM fills); the caller (the Effects Agent's runtime) starts, places and stops
//     the effect. This module never touches render/rom/effect/*.
//   * THE ROCKS (shell00, shell54; notes section 9): thrown in L2 Motion[23] / Motion[24] when the motion passes
//     114.0 (the same frame test and joints as above), aimed, launched, flown and landed as base00 / base54 do.
//     Their effect is never placed by the shell: the flying rock's record is bound to the shell, which only keeps its
//     own position / anchor / angle words current; bounces and landings start placed effects at the contact point.
//     Three things the ROM takes from the game are NOT READ and come in as explicit inputs, with no default:
//     which rock (the AI's pick of command stream 36 / 56 / 57), the target the launch pitch is aimed at (enemy
//     block +0x1d0) and the stage the flight collides with (0xc30b30; here a horizontal plane at a given height).
//   * DEVILJHO (em043_00): the same class as Savage's with the variant byte 0, his own shell ids 0xd3 / 0xd5 / 0xd6 /
//     0xd7 (0xe727d0) and files. His rocks are Savage's: the .shl of shell00 and shell54 are the same bytes but for the
//     names inside them, and their spawner reads no variant byte, so the same modes fly the same way (shell00 0 / 8 and
//     shell54 0, thrown on L2 Motion[23] / [24]; shell54 4, the held rock, is unread as his brother's is). His breath
//     differs: shell04 has one mode, 0, a 1000-long beam with u 60, because the spawn's variant branch (0xe78b34) sends
//     variant 0 to mode 0 unless the state byte P+0x5e08's bit 5 is set, which nothing in his class or command streams
//     does; shell55 mode 0 is 1000 long with u 60 too, where Savage's are 1200 / 1700 with u 60 / u 70. And his command
//     streams never reach the enraged breath action: the op-0x6f value is `isEnraged ? 2 : 1` only for variant 5
//     (0xe80e4c), so (7, 0x06) / (7, 0x07) serve both states (`pick: 'always'`) and Savage's (7, 0x31) / (7, 0x32) are
//     not his. Its inputs are Savage's rocks' -- the AI's pick, the target, the stage -- and nothing else.
//   * NARGACUGA'S TAIL SPIKES (em037_00; notes E:\offline\decode\notes\shells-em037.md): shell00 is a base00 shell
//     like Savage's rock, thrown in L2 Motion[8] when it passes 46.0 -- 3 or 5 spikes at once, one per mode, made by
//     the spawner 0xe48fc8 -- and flown and landed by the same base00 code, with its own reader (0xe59050: flags from
//     the mode's ints), base00's own angle path at the init (setup angles or the owner's; the X aim 0x3f9378 with its
//     circular clamp; the Y spread 0x3f9cc4) and its own landing (0xe59334), which drops shell01 at a floor contact
//     (an event: shell01 mode 0 draws nothing). The same inputs as the rocks, NOT READ: which action (the AI's pick,
//     input.rock.variant names it: pickVariantsFor), the target (read only by the aimed kinds), the stage.
//   * RATHIAN (em001_00; notes E:\offline\decode\notes\shells-em001.md): shell00 the fireballs (base00 again, with its
//     own reader 0xd0d988 -- the aimed modes aim from the OWNER's point -- and landing 0xd0dc9c), thrown by the attack
//     actions' spawn helpers on L2 Motion[5] / [18], L4 Motion[8] / [16] (blend partners map to their main clip); shell01
//     (base01): the ground fire a landing leaves, mode 8's four explosions (made by shell11, base11), the landing dust of
//     the per-frame handler 0xcf1a5c (no pick: clip and frame), the breath puffs of L4 Motion[65] (G rank) and the hit
//     volumes of the no-fire actions. Shells made by shells are stepped shells here (out.spawned when made), moved by
//     the ROM's line-18 rule. Inputs NOT READ: the action (input.rock.variant), the target, the stage, the owner block
//     (words, position, ground, size, base scale, block +0x5c), the quest rank, the hover-dust timer's phase
//     (input.stepCount), the hit-slot life.
//   * HER SIBLINGS, GOLD RATHIAN (em001_02) and DREADQUEEN RATHIAN (em001_04): Rathian's class uEm001_00 with variant byte
//     2 / 4, their own shell ids (0xd09918), files, EffectLists (c = em001_00c, u = their own u.pel), actiontune and .dtp.
//     Rathian's actions on the shared clips are theirs (SHELL_DATA shares her entries, dust rows and posture read); their
//     own L4 / L9 clips add the class code's other spawn helpers (spawnVar001): L2 M1's puffs (3..5, G 38..40), L4 M18's
//     fireballs (9..11, 24 / 25, which land like mode 8), and for Dreadqueen L2 M13's puffs, L9's puffs / ground dust /
//     36 / 48..50, and THE POISON (0xd09b84(e, 0x10), poison001: shell01 16 / 23 / 24 by the quest's number and part 7's
//     break level, none once the tail is severed, the two newest kept). Its inputs: input.questLevel (no default),
//     input.breakLevel7, input.tailSevered.
//   * DREADKING RATHALOS (em002_04): the same class with em byte 2 and variant byte 4, its shell ids 0x59 / 0x5f / 0x64
//     (0xd09918), files and EffectLists (c = em002_00c, Rathalos's; u = em002_04u). Its lists 0..3 are Rathian's files,
//     so her hover turns and dust rows are its, with the flight dust of its own L4 M25..M27 (0xcf1f74 / 0xcf1f30 /
//     0xcf1f54, posture 3); its fire actions are its own: the spawn helpers' em-2 variant-4 branches give its fireballs
//     0x1d / 0x1e (L2 M5 / M18, L4 M22 / M29), the take-off's 0x15 / 0x21 / 0x20 (L4 M32), L4 M38's 0x1a..0x1c and 0x1f,
//     L4 M18's 0x22..0x24, L4 M45's 0x17 (aimed on X and Y from the owner) and L9 M1's 0x1f. Their landings take the
//     em-2 variant-4 paths (0x15 as the mask's modes; 0x1f -> shell01 0x1b, or 0x11 above quest 6; 0x22..0x24 -> 0x1d /
//     0x34 / 0x36, no ground fire), and sp_01's end create (0xd0eb20) makes 0x1c / 0x12 / 0x1e / 0x35 / 0x37 when those
//     end. Its input: input.questLevel (the 0x1f landing).
//   * RATHALOS (em002_00): the same class with em byte 2 and variant byte 0, its shell ids 0x57 / 0x5d (0xd09918) and
//     files, EffectLists (c = em002_00c, u = em002_00u). Its lists 0..3 are Rathian's files, so her hover turns and dust
//     rows are its, with the flight dust of its own L4 M25..M27; its fireballs are the Rathalos modes the family's
//     helpers give em 2 variant 0: 0 / 4 (L2 M5 / M18), 0xc (L4 M22), L4 M29's shots 0xd / 0x10..0x12 / 0xe / 0x13 /
//     0x14 / 0xf (one to three per action, the phase counting them in P+0x1a2 over the looping clip), 0x15 / 0x16 / 0x20
//     (the take-off) and 0x17 (L4 M45, aimed on X and Y). None of them is in the landing's mask, so each lands as
//     Rathian's do (shell01 1 and the ground fire 2; mode 0x20 also 0x13) and its third shell id 0x19d is never used. Its
//     L2 M13 puffs are shell01 10..12 at either rank; its L2 M1 puffs (5 / 4 / 3, G 0x28..0x26) have no files here, so
//     that clip draws nothing and is not listed. It needs no input of its own.
//   * SILVER RATHALOS (em002_02): the same class with em byte 2 and variant byte 2, its shell ids 0x58 / 0x5e / 0x63
//     (0xd09918) and files, EffectLists (c = em002_00c, u = em002_02u). Rathalos's fireballs and shots, and its own on
//     L4 M38: 0x1a..0x1c ((7, 0x43) / (7, 0x45) / (7, 0x46)) and 0x25 ((7, 0x70), which plays L4 M69 first), all four in
//     the landing's mask -- they make the explosion timer shell11 0x63, whose four shell01 6..9 go off at 0 / 16 / 26 /
//     36 frames, and the ground fire. Mode 0x25 is the line's only mode whose reader sets flag 0x20: its angle words are
//     the setup's, which its helper fills with the owner's words and the X word raised (pitchAngles001). Its puffs are
//     the Rathians': L2 M1 5 / 4 / 3 (G 0x28..0x26) and L2 M13 12 / 11 / 10 (G 0x2b..0x29). It needs no input of its own.
//
// UNITS AND FRAMES. Positions are GAME units in world space (the viewer's world is game units / 100: live.js
// MT_TO_VIEW). Joint matrices are the game's: 16 floats in memory order (row-vector convention, rows = axes, row 3 =
// translation) -- exactly three.js `matrixWorld.elements` with the translation multiplied by 100, the array live.js
// hands host.setJointMatrix. Angles are the ROM's u16 binary angles (65536 = one turn) where the ROM keeps them, and
// degrees where the ROM hands degrees to the effect. Frames are motion frames at 60/s (index.html driveClipEffects:
// action.time * 60 plus a _loop clip's _start length).
//
// NOT MODELLED (the viewer has no such state; see the notes):
//   * the owner's special state +0xb720 (enemy vtable +0x170 sets it, 0xca664): with it on, base04 multiplies its
//     beam length by a per-kind factor from tables at enemy +0xca98 / +0xcaac (0x43aa78). Off on a normal monster.
//   * base55's extra end test 0xc99a4: [[owner+0x1428]+0x5ea7] > 0 ends the shell (meaning not read).
//   * hit, sound and the unit's own draw: not visual here (hit vtable +0x140, sound 0x3fffcc / 0x42d29c).
//   * the effect's liveness is the caller's (input.effectAlive); without it the effect counts as alive.
//   * Deviljho: as Savage's rocks; what his breath's state gate P+0x5e08 bit 5 would mean if anything set it (nothing
//     in his path does, so both modes behind it -- which his files leave empty -- are out of reach); his (7, 0x34) and
//     (7, 0x93) / (7, 0x94) chains, which only another action's code reaches.
//   * rocks: the monster's own turn while the frame is below 50 (0x76c08(e, 0x60, 0)) and so its facing at 114 --
//     input.owner.y instead; the rock hitting a hunter (hit slot +0x13ae, type 2 at the hit position) -- the viewer
//     has no hunters, so every contact is the stage query's; an inactive owner ending the flight (0x4a0f38); the
//     hit-slot fields a held rock writes (+0x1404 / +0x14bc = 20.0 / 0). shell00 modes 1..7, 9..15 and shell54
//     modes 1..3, 5..7 are not transcribed (no read command stream plays them, notes 9.11).
//   * spikes (em037_00): as the rocks (the owner's turn during M7 / M8 is NOT READ: input.owner.y instead); shell01
//     mode 1 (the ground impact c 30 of L0 M28 f20, L1 M1 f60, L1 M2 f2): not built -- its lifetime rests on the hit
//     slots and L1 M2's condition 0x6fe88 is not read (notes 6, 11); its data is in SHELL_DATA.
//   * Rathian (em001_00; notes 12): the AI's pick of fire / no-fire (op 0x24) and every other op; the owner's turns
//     ((7, 0x47) while f < 40, the puffs' 0x76c08 / 0x76dd0: input.owner.y instead); what sets block +0x78 (the blend
//     weight); the hover dust's timer phase (the monster's setup: input.stepCount stands in) and which hover turn the AI
//     issues, (4, 4) or (4, 0x15) (the default: not (4, 0x15)); the stage core 0xc30b30 and its attribute bits
//     0x1040 (the plane stand-in: the fire is always made); the
//     camera request 0x43ac04 (an event only); the hit side beyond the slot countdown (who runs 0x168d30, where in the
//     frame, its step -- the hit-slot life is input.hitLife, see slotStep); how the effect runtime binds placement-mode-0
//     records to the shell and orients placed ones; (7, 0x7b)'s phase-0 call; Rathalos (em002_00) and Silver Rathalos
//     (em002_02) -- their own ids and files, not in SHELL_DATA (Dreadking is).
//   * her siblings: as Rathian; who issues (7, 0x4d) / (7, 0x75) / (7, 0x7a) / (7, 0x7b) (no command-table stream names
//     them, no class code chains to them); the owner's travel and turns inside their actions (0x7c9fc, 0x7a820, 0x76c08,
//     0x770e4 -- input.ownerPos / input.owner instead); (7, 0xf6) / (7, 0xf7), which start on clips em001_04_9.lmt lacks;
//     creates whose modes have no files (shell00 21 / 22 / 23 / 31..36, Gold's shell01 10..12: ROM-run, a no-file shell00
//     ends at move 1 with no effect and no child) -- not listed; the take-offs (L4 M13 f6: shell00 21 / 22 / 32 / 33 no
//     files, or shell01 0, which draws nothing).
//   * Dreadking: as Rathian; (7, 0x02)'s turn in its phase 1 (0xcfde84..0xcfde90: input.owner.y instead); who issues
//     (7, 0x27) / (7, 0x28) / (7, 0x33) / (7, 0x34) (no stream calls them); creates made and deleted by their init for want
//     of files ((7, 0x42) 9..11, (7, 0x4a) / (7, 0x5a) / (7, 0x5b) / (7, 0xef) 24 / 25, (7, 0x70) 37, (1, 0xff) 16) and the
//     helpers whose frames are actiontune floats past its six (L9 M7's dust, (7, 0xf2)): not listed.
//   * Rathalos: as Rathian; what ends its L4 M45 attack, which throws one fireball on every pass of frame 44 while it
//     lasts; its L2 M1 puffs (no files: the shells the ROM makes there start nothing) and the flight moves' own travel.
//   * Silver Rathalos: as Rathian; the class's tracked aim pitch ctl+0x18 (0xcee0a0..0xcee184), which (7, 0x70)'s helper
//     uses in place of its 0x71c when the target is nearer than 1400 -- that shell is refused instead; (7, 0xf5) and
//     (3, 0x4d), whose modes 31 / 23 it has no files for: not listed.
const f = Math.fround;

// ---- ROM constants (float literals as stored) -------------------------------------------------------------------
const RAD_TO_U16 = f(10430.3779296875);      // 0x4622f983 = 65536 / 2pi (0x3ff8cc, 0x3ffec0)
const U16_TO_RAD = f(9.58738019107841e-05);  // 0x38c90fdb = 2pi / 65536 (0x3ff578)
const U16_TO_DEG = f(0.0054931640625);       // 0x3bb40000 = 360 / 65536 (0x3ff774, 0x3fffc8)
const DEG_TO_U16 = f(182.04444885253906);    // 0x43360b61 = 65536 / 360 (0x3ff574)
const HALF_PI = f(1.5707963705062866);       // 0x3fc90fdb (0x7c3af0 / 0x7c3acc, negated)
const ENDING_FRAMES = f(f(30.0) * f(60.0));  // [0x162493c] = 30.0 times 60.0 (end 0x400280 / 0x42d550)
const SNAP = f(0.0005);                      // 0x3a03126f: a frame this close under an integer is that integer

const sinf = x => f(Math.sin(x)), cosf = x => f(Math.cos(x)), atan2f = (y, x) => f(Math.atan2(y, x));
const asinf = x => f(Math.asin(x)), acosf = x => f(Math.acos(x)), sqrtf = x => f(Math.sqrt(x));
// vcvt.s32.f32: round toward zero, saturating; NaN -> 0
const s32 = x => (x !== x) ? 0 : x >= 2147483647 ? 2147483647 : x <= -2147483648 ? -2147483648 : Math.trunc(x);
const u16 = x => x & 0xffff;
const mla = (acc, a, b) => f(acc + f(a * b));        // vmla.f32 (not fused): round the product, then the sum
const mls = (acc, a, b) => f(acc - f(a * b));        // vmls.f32
const nmls = (acc, a, b) => f(f(a * b) - acc);       // vnmls.f32: d = n*m - d

// ---- the data read from the ROM and the .arc ---------------------------------------------------------------------
// Per mode, the .shl (XFS 4aa69872, class rShell::cShellInfo 0x32003f1c: ShellScale f32, EffectParam, SoundParam,
// HitParam, ShellParam; the mode indexes ShellInfoList, 0x4a22f0..0x4a2584) names four files. `sh` is the ShellParam
// rFreeUseParam (FUP: ints / floats / vec3s; getters +0x44 / +0x4c / +0x54 = 0x3cb30c / 0x3cb330 / 0x3cb35c, an index
// past the end reads 0 / 0.0 / the zero vector). `ef` is the rShellEffectParam list (listId, uniqueId); `scale` is
// ShellScale. Values are the files' own, em043_05.arc.
export const SHELL_DATA = {
  // DEVILJHO (em043_00): the family's class uEm043_00 with the variant byte +0xb5f5 = 0, where Savage Deviljho
  // (em043_05) is variant 5. The ctor 0xe727d0 gives variant 0 the global shells 0xd3 / 0xd4 / 0xd5 / 0xd6 / 0xd7 at
  // enemy +0xcac4 / +0xcac8 / +0xcacc / +0xcad0 / +0xcad4 (0xe727f0..0xe72840), where variant 5 gets 0xd8..0xdc; the
  // table 0x175c3e8 (12 bytes an entry: class DTI, setup DTI, resource) gives the two variants the same five classes
  // down the line -- uShellEm043_sp_00 / sp_01 / sp_04 / sp_54 / sp_55, DTIs 0x188c8e8 / 0x188c908 / 0x188c928 /
  // 0x188c948 / 0x188c968 -- and changes only which .shl each loads: his five resources run 0x8a26 / 0x8a27 / 0x8a28 /
  // 0x8a29 / 0x8a2a where Savage's run 0x8a2b..0x8a2f. 0xd4 is the shell01 class, and it is out of the table below
  // because it draws nothing, not because it is absent: its .shl is in both .arc (em043_00_shell01\em043_00_01, 2618
  // bytes, 44 differing bytes from Savage's, every one the name digit) with five modes, and not one of those five
  // EffectParams names a (list, key) in either monster -- the reading other monsters' shell01 mode 0 gets above.
  // Values: the files' own, C:\MHGU-Extract\scratch-em\em043_00\em043_00.arc. His shell00 and shell54 .shl are
  // Savage's file byte for byte but for the name strings inside them (136 and 72 differing bytes, every one a '0'
  // where his says '5'), so the ShellCmnParam and ShellInfoList below are the same values his brother's are; shell04
  // and shell55 differ (one mode, and their own lengths).
  em043_00: {
    name: 'Deviljho',
    // every em043_00 .shl names EffectLists[0] = effect\pel\em\em043_00u and nothing else, as Savage's name his
    lists: { 0: { list: 'u', pel: 'em043_00u' } },
    shells: {
      // THE ROCKS (uShellEm043_sp_00, base00; Savage's shell00 notes apply): the same cmn and the same mode values, the
      // same effect keys for the modes his actions throw (u 0 flying, u 10 at a contact). Modes 1..7 and 9..15 are not
      // transcribed -- no read command stream plays them, and the command table is Savage's file byte for byte
      // (em043_00_cmdtbl.emc, the same md5 in both .arc).
      shell00: {
        id: 0xd3, cls: 'uShellEm043_sp_00', base: 'base00', folder: 'shell\\em\\em043_00_shell00',
        cmn: { ints: [4], floats: [72.0, 216.0], vecs: [[0.0, 200.0, 60.0], [0.0, -80.0, 300.0]] },
        modes: {
          // em043_00_00_ef000 / _sh000
          0: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
          // em043_00_00_ef008 / _sh008
          8: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10]],
               sh: { ints: [], floats: [50.0, 0.0], vecs: [[0.0, -0.75, 0.0]] } },
        },
      },
      // THE BREATH (uShellEm043_sp_04, base04). One mode: em043_00_04_sh000 / _ef000, beam 1000.0 with u 60 -- where
      // Savage has modes 1 and 2 (1200.0 with u 60, 1700.0 with u 70). The spawn 0xe78a24 reads the variant at
      // 0xe78b34: variant 5 goes to its mode-1 / 2 branch, and variant 0 must first pass 0xa1f0c(e, 0x20) -- bit 5 of
      // the state byte P+0x5e08, which nothing in this monster's class or command streams sets (read by the states
      // agent, 2026-09-23) -- so it always takes 0xe78c98, mode 0.
      shell04: {
        id: 0xd5, cls: 'uShellEm043_sp_04', base: 'base04', folder: 'shell\\em\\em043_00_shell04',
        modes: {
          0: { scale: 1.0, ef: [[0, 60], [999, -1]],
               sh: { ints: [3, 6, 0, 0, -1], floats: [1000.0, 98.0, 200.0], vecs: [[0.0, -60.0, 60.0], [20.0, 0.0, 0.0]] } },
        },
      },
      // THE BOUNCING ROCK (uShellEm043_sp_54, base54): the same cmn and mode values as Savage's, its own effect keys
      // for mode 4 (u 30 / 40 / 50 where his are u 40 / 50 / 100); mode 0's are the same u 0 / 10 / 20.
      shell54: {
        id: 0xd6, cls: 'uShellEm043_sp_54', base: 'base54', folder: 'shell\\em\\em043_00_shell54',
        cmn: { ints: [4, 2], floats: [240.0, 0.0, 120.0, 24.0, 0.8, 0.3], vecs: [[0.0, 200.0, 60.0], [0.0, -80.0, 300.0]] },
        modes: {
          // em043_00_54_ef000 / _sh000
          0: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10], [0, 20], [0, 20]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
          // em043_00_54_ef004 / _sh004: starts HELD at the joint until the motion passes 124
          4: { scale: 1.0, ef: [[0, 30], [0, 40], [0, 40], [0, 40], [0, 50], [0, 50]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
        },
      },
      // THE SECOND BREATH (uShellEm043_sp_55, base55): em043_00_55_sh000 / _ef000, beam 1000.0 with u 60 (Savage's is
      // 1700.0 with u 70). Its spawn 0xe7af24's variant branch only writes the byte e+0xb5f8 (2 or 6 instead of his 3,
      // 0xe7af34..0xe7af6c: not a shell field), so the shell is made the same way.
      shell55: {
        id: 0xd7, cls: 'uShellEm043_sp_55', base: 'base55', folder: 'shell\\em\\em043_00_shell55',
        modes: {
          0: { scale: 1.0, ef: [[0, 60], [999, -1]],
               sh: { ints: [3, -1], floats: [1000.0, 42.0, 100.0], vecs: [[0.0, -120.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
      },
    },
    // THE ACTIONS: Savage's, from the same status-7 switch (0xe7b1d4, table 0xe7b200) and the same command table
    // (em043_00_cmdtbl.emc is one file, in both .arc). What differs is which of them his command streams can issue:
    // the op-0x6f switch value (enemy vtable +0x214 = 0xe80d28, arg 1 = 0xe80e30) is `isEnraged ? 2 : 1` only for
    // variant 5 -- at 0xe80e4c..0xe80e50 variant 0 takes the enraged flag itself, 0 or 1, and never 2 -- while the
    // streams that pick the breath read `switch (v1) { case 2: the rage action; default: the calm one }` (group 1
    // stream 3 on L2 M25, stream 8 on L2 M26). So this monster always takes the 'calm' entries, enraged or not
    // (`pick: 'always'`), and Savage's (7, 0x31) / (7, 0x32) are not listed: no stream of his can reach them.
    actions: [
      // 0xe78a24(e, r1, r2): phase 0 setMotion 0x219 (r1 0) / 0x21a (r1 1), blend 6 (r2 != 2); phase 1 spawns shell04
      // when the motion passes 130.0 (r1 0) / 136.0 (r1 1) -- mode 0 for this variant (above)
      { action: [7, 0x06], code: 0xe78a24, args: [0, 0], list: '2', clip: 'Motion[25]', frame: 130.0, shell: 'shell04', mode: 0, pick: 'always' },
      { action: [7, 0x07], code: 0xe78a24, args: [1, 0], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 0, pick: 'always' },
      // chained from 0xe77650 when its motion passes 130 (0xe7796c); starts M26 at max(int(prev - 130) + 38, 0)
      { action: [7, 0x34], code: 0xe78a24, args: [1, 2], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 0, pick: 'chain' },
      // 0xe7af24(e, r1): setMotion 0x229 (r1 0) / 0x22a (r1 1), blend 2; spawns shell55 mode 0 when the motion passes
      // 86.0 (0xe7b0fc..0xe7b184). Chained from 0xe7a9f8's end: 0xe7ae28(e, 0) == 1 ? (7, 0x93) : (7, 0x94) (0xe7ad50)
      { action: [7, 0x93], code: 0xe7af24, args: [0], list: '2', clip: 'Motion[41]', frame: 86.0, shell: 'shell55', mode: 0, pick: 'chain' },
      { action: [7, 0x94], code: 0xe7af24, args: [1], list: '2', clip: 'Motion[42]', frame: 86.0, shell: 'shell55', mode: 0, pick: 'chain' },
      // THE ROCKS: 0xe78e34(e, r1, index, kind, sub) and its picker 0xe78fec, neither of which reads the variant byte,
      // so the modes and frames are Savage's. pick 'rock' (the command table's group 1 streams 36 / 56 / 57, which of
      // them the AI takes is NOT READ: input.rock.variant chooses, rockActionFor); pick 'unread': no read stream plays
      // it, only a forced input.action.
      { action: [7, 0x08], code: 0xe78e34, args: [0, 0, 0, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x09], code: 0xe78e34, args: [1, 0, 0, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x13], code: 0xe78e34, args: [2, 0, 0, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x14], code: 0xe78e34, args: [3, 0, 0, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x4e], code: 0xe78e34, args: [0, 0, 2, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x4f], code: 0xe78e34, args: [1, 0, 2, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x50], code: 0xe78e34, args: [2, 0, 2, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x51], code: 0xe78e34, args: [3, 0, 2, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x5e], code: 0xe78e34, args: [0, 0, 3, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x5f], code: 0xe78e34, args: [1, 0, 3, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x60], code: 0xe78e34, args: [2, 0, 3, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x61], code: 0xe78e34, args: [3, 0, 3, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      // (7, 0x7e..0x81) (0xe7bbd8..0xe7bc2c -> 0xe7c084): kind 3, sub 1 -> shell54 mode 0x161f27c[4] = 4, at 108.0
      { action: [7, 0x7e], code: 0xe78e34, args: [0, 0, 3, 1], list: '2', clip: 'Motion[24]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x7f], code: 0xe78e34, args: [1, 0, 3, 1], list: '2', clip: 'Motion[23]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x80], code: 0xe78e34, args: [2, 0, 3, 1], list: '2', clip: 'Motion[24]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x81], code: 0xe78e34, args: [3, 0, 3, 1], list: '2', clip: 'Motion[23]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
    ],
  },
  em043_05: {
    name: 'Savage Deviljho',
    // the monster's effect lists by listId: the .shl EffectLists (rProofEffectList), index 0 in every em043_05 .shl
    lists: { 0: { list: 'u', pel: 'em043_05u' } },
    shells: {
      // global shell id 0xda (ctor 0xe727d0 stores it at enemy +0xcacc for variant 5); table 0x175c3e8[0xda] =
      // {uShellEm043_sp_04 DTI 0x188c928, uShellEmBase04::cSetupParamEmBase04 DTI 0x1885bf8, resource 0x8a2d};
      // class size 0x1650, ctor 0xe82924 (base 0x3ff080), vtable 0x17c0ff4 -- only slots 1, 5 and 83 (+0x14c, the
      // param reader 0xe82944) are its own, the rest is uShellEmBase04.
      shell04: {
        id: 0xda, cls: 'uShellEm043_sp_04', base: 'base04', folder: 'shell\\em\\em043_05_shell04',
        modes: {
          // em043_05_04_sh001 / _ef001 (mode 0 has no files: ShellInfoList[0] is all null)
          1: { scale: 1.0, ef: [[0, 60], [999, -1]],
               sh: { ints: [3, 6, 0, 0, -1], floats: [1200.0, 98.0, 200.0], vecs: [[0.0, -60.0, 60.0], [20.0, 0.0, 0.0]] } },
          // em043_05_04_sh002 / _ef002: only the beam length differs
          2: { scale: 1.0, ef: [[0, 70], [999, -1]],
               sh: { ints: [3, 6, 0, 0, -1], floats: [1700.0, 98.0, 200.0], vecs: [[0.0, -60.0, 60.0], [20.0, 0.0, 0.0]] } },
        },
      },
      // global shell id 0xdc (enemy +0xcad4); uShellEm043_sp_55 DTI 0x188c968 : uShellEmBase55 (setup DTI 0x18878a8),
      // size 0x1670, ctor 0xe83188 (base 0x42c484), vtable 0x17c12cc, param reader 0xe831a8 (+0x14c)
      shell55: {
        id: 0xdc, cls: 'uShellEm043_sp_55', base: 'base55', folder: 'shell\\em\\em043_05_shell55',
        modes: {
          // em043_05_55_sh000 / _ef000
          0: { scale: 1.0, ef: [[0, 70], [999, -1]],
               sh: { ints: [3, -1], floats: [1700.0, 42.0, 100.0], vecs: [[0.0, -120.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
      },
      // THE ROCKS. `cmn` is the class's ShellCmnParam FUP (getters 0x4a2224 / 0x4a2264 / 0x4a22a8), shared by every
      // mode; `ef` are EffectParams 0.. (u.pel em043_05u: u 0 = cm202_200, joint -1, placement mode 0, end 1 -- the
      // flying rock, bound to the shell; u 10 = cm202_250 and u 20 = cm202_001, joint -1, placement mode 3 -- placed
      // at a contact; u 40 / 50 / 100 the same three for shell54 modes 4..7). ShellScale 1.0 in every entry.
      // global shell id 0xd8 (enemy +0xcac4 for variant 5); table 0x175c3e8[0xd8] = {uShellEm043_sp_00 DTI 0x188c8e8,
      // uShellEmBase00::cSetupParamEmBase00 DTI 0x1885948, resource 0x8a2b}; size 0x1660, ctor 0xe81ff4 (base
      // 0x3f8a04), vtable 0x17c0d08, param reader 0xe82304 (its +0x14c 0xe82028 takes it for id 0xd8)
      shell00: {
        id: 0xd8, cls: 'uShellEm043_sp_00', base: 'base00', folder: 'shell\\em\\em043_05_shell00',
        // em043_05_00: ints [joint gid], floats [flight time modes 0..7, modes 8..15], vecs [launch offset in the
        // joint's space, modes 0..11; modes 12..15]
        cmn: { ints: [4], floats: [72.0, 216.0], vecs: [[0.0, 200.0, 60.0], [0.0, -80.0, 300.0]] },
        modes: {
          // em043_05_00_ef000 / _sh000: floats [launch speed along +Z, along +Y], vecs [gravity per frame]
          0: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
          // em043_05_00_ef008 / _sh008
          8: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10]],
               sh: { ints: [], floats: [50.0, 0.0], vecs: [[0.0, -0.75, 0.0]] } },
        },
      },
      // global shell id 0xdb (enemy +0xcad0); uShellEm043_sp_54 DTI 0x188c948 : uShellEmBase54 (setup DTI 0x1887808),
      // size 0x1670, ctor 0xe82c30 (base 0x42ad30), vtable 0x17c115c, param reader 0xe82e8c (0xe82c64 takes it for
      // any id but 0xd8, 0xe82c70)
      shell54: {
        id: 0xdb, cls: 'uShellEm043_sp_54', base: 'base54', folder: 'shell\\em\\em043_05_shell54',
        // em043_05_54: ints [joint gid, bounces before the landing], floats [flight time, lift modes 0..3, lift modes
        // 4..7, bounce speed, bounce speed factor, horizontal speed factor at a bounce], vecs as shell00's
        cmn: { ints: [4, 2], floats: [240.0, 0.0, 120.0, 24.0, 0.8, 0.3], vecs: [[0.0, 200.0, 60.0], [0.0, -80.0, 300.0]] },
        modes: {
          // em043_05_54_ef000 / _sh000: EffectParams 0 flight, 1..3 landing by type, 4 first bounce, 5 later bounces
          0: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10], [0, 20], [0, 20]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
          // em043_05_54_ef004 / _sh004: starts HELD at the joint until the motion passes 124
          4: { scale: 1.0, ef: [[0, 40], [0, 50], [0, 50], [0, 50], [0, 100], [0, 100]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
        },
      },
    },
    // The attack actions that spawn them (status 7 switch 0xe7b1d4, table 0xe7b200), each read to its spawn.
    // `pick` is how the monster's command table chooses it (em043_00_cmdtbl in em043_05.arc; op 0x6f switch value
    // is enemy vtable +0x214 = 0xe80d28, arg 1 = 0xe80e30: on variant 5 it is 2 when ENRAGED (0x81670) else 1):
    //   'calm' / 'rage' = group 1 stream 3 (M25) or 8 (M26): switch(v1) { case 2: rage action; default: calm action }
    //   'chain' = only reached from another action's code, never from a clip start (see the notes).
    actions: [
      // 0xe78a24(e, r1, r2): phase 0 setMotion 0x219 (r1 0) / 0x21a (r1 1), blend 6 (r2 != 2); phase 1 spawns shell04
      // when the motion passes 130.0 (r1 0) / 136.0 (r1 1); variant 5: mode 1 when r2 == 0, else 2 (0xe78c38..0xe78da8)
      { action: [7, 0x06], code: 0xe78a24, args: [0, 0], list: '2', clip: 'Motion[25]', frame: 130.0, shell: 'shell04', mode: 1, pick: 'calm' },
      { action: [7, 0x31], code: 0xe78a24, args: [0, 1], list: '2', clip: 'Motion[25]', frame: 130.0, shell: 'shell04', mode: 2, pick: 'rage' },
      { action: [7, 0x07], code: 0xe78a24, args: [1, 0], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 1, pick: 'calm' },
      { action: [7, 0x32], code: 0xe78a24, args: [1, 1], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 2, pick: 'rage' },
      // chained from 0xe77650 when its motion passes 130 (0xe7796c); starts M26 at max(int(prev - 130) + 38, 0)
      { action: [7, 0x34], code: 0xe78a24, args: [1, 2], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 2, pick: 'chain' },
      // 0xe7af24(e, r1): setMotion 0x229 (r1 0) / 0x22a (r1 1), blend 2; spawns shell55 mode 0 when the motion passes
      // 86.0 (0xe7b0fc..0xe7b184). Chained from 0xe7a9f8's end: 0xe7ae28(e, 0) == 1 ? (7, 0x93) : (7, 0x94) (0xe7ad50)
      { action: [7, 0x93], code: 0xe7af24, args: [0], list: '2', clip: 'Motion[41]', frame: 86.0, shell: 'shell55', mode: 0, pick: 'chain' },
      { action: [7, 0x94], code: 0xe7af24, args: [1], list: '2', clip: 'Motion[42]', frame: 86.0, shell: 'shell55', mode: 0, pick: 'chain' },
      // THE ROCKS. 0xe78e34(e, r1, index, kind, sub): phase 0 setMotion 0x218 (L2 M24) for r1 0 / 2, 0x217 (M23) for
      // r1 1 / 3 (r1 0 -> 0x218 at 0xe78f8c, else 0x169e640 = [0x217, 0x218, 0x217][r1 - 1]), blend 2; phase 1 spawns
      // when the motion passes 114.0 (sub 0, [0xe78fdc]) / 108.0 (sub 1, [0xe78fd8]) -> 0xe78fec(e, index, kind, sub):
      // kind 0 -> shell00 mode 0x1592318[index], kind 2 -> shell00 mode 0x161f25c[sub*4 + index], kind 3 -> shell54
      // mode 0x161f27c[sub*4 + index]. `args` = (r1, index, kind, sub), read from each case body (status 7 switch
      // 0xe7b1d4, table 0xe7b200) to the call. r1 0 and 2 (1 and 3) give the same motion, shell, mode and frame; which
      // one a stream takes: op 0x24 (0x86fac -> 0x81634: tired and not enraged) takes r1 2 / 3 -- the same rock, so the
      // pick below does not depend on it -- and op 0x2e (M23 or M24) is not read. pick 'rock': the command table's group
      // 1 stream 36 (shell00 mode 0), 56 (shell00 mode 8) and 57 (shell54 mode 0) issue them (em043_00_cmdtbl:
      // `2e 00 00 | 24 00 | r1 3 | 24 02 | r1 1 | 24 ff | 2e 02 | 24 00 | r1 2 | 24 02 | r1 0 | 24 ff | 2e ff`); WHICH
      // stream the AI takes is NOT READ, so the
      // viewer's input.rock.variant chooses (rockActionFor). pick 'unread': no read command stream plays it; only a
      // forced input.action reaches it.
      { action: [7, 0x08], code: 0xe78e34, args: [0, 0, 0, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x09], code: 0xe78e34, args: [1, 0, 0, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x13], code: 0xe78e34, args: [2, 0, 0, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x14], code: 0xe78e34, args: [3, 0, 0, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x4e], code: 0xe78e34, args: [0, 0, 2, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x4f], code: 0xe78e34, args: [1, 0, 2, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x50], code: 0xe78e34, args: [2, 0, 2, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x51], code: 0xe78e34, args: [3, 0, 2, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x5e], code: 0xe78e34, args: [0, 0, 3, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x5f], code: 0xe78e34, args: [1, 0, 3, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x60], code: 0xe78e34, args: [2, 0, 3, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x61], code: 0xe78e34, args: [3, 0, 3, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      // (7, 0x7e..0x81) (0xe7bbd8..0xe7bc2c -> 0xe7c084): kind 3, sub 1 -> shell54 mode 0x161f27c[4] = 4, at 108.0
      { action: [7, 0x7e], code: 0xe78e34, args: [0, 0, 3, 1], list: '2', clip: 'Motion[24]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x7f], code: 0xe78e34, args: [1, 0, 3, 1], list: '2', clip: 'Motion[23]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x80], code: 0xe78e34, args: [2, 0, 3, 1], list: '2', clip: 'Motion[24]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x81], code: 0xe78e34, args: [3, 0, 3, 1], list: '2', clip: 'Motion[23]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
    ],
  },

  // NARGACUGA (notes shells-em037.md). uEm037_00 (ctor 0xe46f28, vtable 0x17bc47c) serves em037_00 (variant byte
  // +0xb5f5 = 0) and Silverwind em037_04 (variant 4); its vtable +0x158 0xe47320 loads, for variant 0, the global
  // shells 0xc8 / 0xc9 (0x48b71c) and keeps them at enemy +0xcc94 / +0xcc98 (0xe47390..0xe473c8). Values below are the
  // files' own, em037_00.arc (C:\MHGU-Extract\scratch-em\em037_00\em037_00.arc). Each shell names its own effect
  // lists (the .shl's EffectLists): shell00's listId 0 is the u.pel, shell01's the c.pel.
  em037_00: {
    name: 'Nargacuga',
    shells: {
      // THE TAIL SPIKES. Global shell id 0xc8; table 0x175c3e8[0xc8] = {uShellEm037_sp_00 DTI 0x188c7c8,
      // uShellEmBase00::cSetupParamEmBase00 DTI 0x1885948, resource 0x8a1b}; size 0x1670, ctor 0xe59014 (base00 ctor
      // 0x3f8a04; +0x1660 = 0, byte +0x1665 = 1), vtable 0x17bd408. Its own slots: +0x13c init 0xe594d4 (-> base00
      // 0x3f8b80), +0x14c the reader 0xe59050, +0x150 the landing 0xe59334, +0x154 0xe595ac (Silverwind's modes 8 / 13
      // / 14 only), +0x158 the state-1 move 0xe5953c (-> base00 0x3f9738); the rest is uShellEmBase00's (vtable
      // 0x174e2e4: move +0x24 0x3f96a0, end +0x148 0x3f9ef4, ending +0x15c 0x3f986c, collision +0x168 0x3f99e0, Y
      // adjust +0x16c 0x3f9cc4, gravity +0x170 0x3f9f98).
      shell00: {
        id: 0xc8, cls: 'uShellEm037_sp_00', base: 'base00', folder: 'shell\\em\\em037_00_shell00',
        // the .shl em037_00_00: EffectLists[0] = effect\pel\em\em037_00u, the rest null; ShellCmnParam null
        lists: { 0: { list: 'u', pel: 'em037_00u' } },
        // em037_00_00_sh### (the reader, params37): ints [joint gid, X aimed, Y aimed, (not read), offset from the final
        // angles, byte +0x1664, angles from the setup, X word 0]: an int other than -1 sets the flag; floats [X
        // degrees, Y degrees (the spread), speed along +Z, flight time, X min, X max, Y min, Y max, speed along +Y];
        // vecs [launch offset in the joint's space, (not read), gravity per frame]. em037_00_00_ef###: EffectParams 0
        // the flying spike (u 0 = em037_00_007), 1 landing type 0 (u 2 = cm202_001), 2 landing type 1, the floor (u 1
        // = em037_00_002), 3 landing type 2, a hunter (u 3 = em037_00_000). ShellScale 1.0 in every entry.
        // ShellInfoList has 24 entries; 8 and 12..15 have no files, and no action spawns them.
        modes: {
          0: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, 0, -1, -1, -1, -1, 0, -1], floats: [0.0, -20.0, 65.0, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          1: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 0.0, 62.4, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 20.0, 63.7, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          3: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, -40.0, 65.0, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          4: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, -20.0, 62.4, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          5: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 0.0, 63.7, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          6: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 20.0, 65.0, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          // mode 7's vec 0 is (0, 0, 0): it launches from the joint itself (its (0, 0, 50) is vec 1, which is not read)
          7: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 40.0, 62.4, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, -20.0, 65.0, 400.0, -45.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          10: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 62.4, 400.0, -45.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          11: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 20.0, 63.7, 400.0, -45.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          16: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, -20.0, 65.0, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          17: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 62.4, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          18: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 20.0, 63.7, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          19: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, -40.0, 65.0, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, -20.0, 62.4, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          21: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 63.7, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          22: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 20.0, 65.0, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          23: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 40.0, 62.4, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
        },
      },
      // Global shell id 0xc9; table 0x175c3e8[0xc9] = {uShellEm037_sp_01 DTI 0x188c7e8, uShellEmBase01::
      // cSetupParamEmBase01 DTI 0x18859e8, resource 0x8a1c}; size 0x1660, ctor 0xe597c4 (base01 ctor 0x3fa2f8),
      // vtable 0x17bd584: only +0x14c, the reader 0xe597e4, is its own (base01: init +0x13c 0x3fa498, move +0x24
      // 0x3faec4, end +0x148 0x3fb264). Mode 0 is what a spike drops at its floor contact (0xe593d8): its one
      // EffectParam (999, -1) is refused (0x4a11e4: listId > 7), so it never draws -- shells.js reports it as an event.
      // Mode 1 is the ground impact the per-frame 0xe47b0c spawns in three landing motions: not built (see the header).
      shell01: {
        id: 0xc9, cls: 'uShellEm037_sp_01', base: 'base01', folder: 'shell\\em\\em037_00_shell01',
        // the .shl em037_00_01: EffectLists[0] = effect\pel\em\em037_00c
        lists: { 0: { list: 'c', pel: 'em037_00c' } },
        // em037_00_01_sh### (the reader 0xe597e4): ints [!= -1: flag 0x80, 4, 8, 0x1000], floats [timer +0x1614 = +0x15f0],
        // vecs [+0x1608]; em037_00_01_ef###: c 30 = cm200_040
        modes: {
          0: { scale: 1.0, ef: [[999, -1]], sh: { ints: [-1, -1, -1, -1], floats: [0.0], vecs: [[0.0, 0.0, 0.0]] } },
          1: { scale: 1.0, ef: [[0, 30]], sh: { ints: [0, -1, -1, 0], floats: [0.0], vecs: [[0.0, 0.0, 0.0]] } },
        },
      },
    },
    // The spawner 0xe48fc8(e, xIdx, kind): the pitch offsets in degrees by xIdx (0x169dc74; xIdx is not checked) and
    // the modes by kind (the jump table 0xe49044), each mode one shell, created in that order.
    spawner: { fn: 0xe48fc8, xoff: [60.0, 40.0, 20.0, 10.0, 5.0],
               kinds: { 0: [0, 1, 2], 1: [3, 4, 5, 6, 7], 2: [9, 10, 11], 3: [16, 17, 18], 4: [19, 20, 21, 22, 23] } },
    // The actions. Every spike attack plays L2 Motion[7] then L2 Motion[8]; the spikes spawn when Motion[8] passes
    // 46.0. Status 7 switch 0xe4fe74 (number byte +0x73e1, table 0xe4fea4), each case body read to its call:
    //   0xe5181c(e, xIdx, kind) (bodies 0xe5034c..0xe50458, 0xe5074c): phase 0 setMotion 0x207 (L2 M7) blend 6.0,
    //     start 0.0; phase 1, kind 0: M7 cur >= 44.0 (0xb0968 mode 1) -> setMotion 0x208 (L2 M8) blend 4.0, start 0.0;
    //     kinds 1 / 2: M7's end (0xb09c8) -> setMotion 0x208 blend 0.0, start 0.0; phase 2: M8 passes 46.0 (0xb0968
    //     mode 0, the pass test of 0xb0974) -> 0xe48fc4 -> the spawner 0xe48fc8(e, xIdx, kind); M8's end -> +0x3dc.
    //   0xe55030(e, r1) (0x83 -> 0xe5075c r1 0, 0x84 -> 0xe5052c r1 1): phase 0 setMotion 0x207 blend 6.0, start 6.0;
    //     phase 1 M7 cur >= 44.0 -> setMotion 0x208 blend 4.0, start 0.0; phase 2 M8 passes 46.0 (0xb0974) -> the
    //     spawner 0xe48fc8(e, 0, r1 == 1 ? 4 : 3).
    // `spawnArgs` = the spawner's (xIdx, kind), `modes` = its modes for the kind. pick 'ai': issued by a read command
    // stream (enemy\cmd_tbl\em037_00_cmdtbl, op 0x00) or by a chain; which one the AI takes is NOT READ, so the viewer
    // names it (input.rock.variant = `variant`; pickVariantsFor lists them). pick 'unread': nothing read issues it;
    // only a forced input.action reaches it. The target is read only by kinds 2..4 (the aimed pitch).
    actions: [
      // g1 s8, s38, s73, s148: `16 00 00 | 16 01 07 | 00 07 28 | 16 01 0a | 00 07 29 | 16 01 14 | 00 07 2a | 16 02 |
      // 00 07 2b | 16 ff` (op 0x16's value and compare are NOT READ: a distance band is the notes' inference)
      { action: [7, 0x28], code: 0xe5181c, args: [0, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x28' },
      { action: [7, 0x29], code: 0xe5181c, args: [1, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [1, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x29' },
      { action: [7, 0x2a], code: 0xe5181c, args: [2, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [2, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x2a' },
      { action: [7, 0x2b], code: 0xe5181c, args: [3, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [3, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x2b' },
      // g1 s22 `00 02 02 | 00 07 1b | 00 07 2c`, g1 s25 `00 02 02 | 00 07 2c`
      { action: [7, 0x2c], code: 0xe5181c, args: [4, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [4, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x2c' },
      { action: [7, 0x2d], code: 0xe5181c, args: [0, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x2e], code: 0xe5181c, args: [1, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [1, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x2f], code: 0xe5181c, args: [2, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [2, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x30], code: 0xe5181c, args: [3, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [3, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x31], code: 0xe5181c, args: [4, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [4, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x32], code: 0xe5181c, args: [0, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 0], modes: [0, 1, 2], pick: 'unread' },
      { action: [7, 0x33], code: 0xe5181c, args: [1, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [1, 0], modes: [0, 1, 2], pick: 'unread' },
      { action: [7, 0x34], code: 0xe5181c, args: [2, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [2, 0], modes: [0, 1, 2], pick: 'unread' },
      // chained: (7, 0x1d) (g1 s38) -> 0xe515d4(e, 2): L0 M27 -> L0 M28, which passing 92.0 sets (7, 0x35) (0xe51774,
      // 0x768c8); it throws exactly as (7, 0x2b)
      { action: [7, 0x35], code: 0xe5181c, args: [3, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [3, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x35' },
      { action: [7, 0x36], code: 0xe5181c, args: [4, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [4, 0], modes: [0, 1, 2], pick: 'unread' },
      { action: [7, 0x37], code: 0xe5181c, args: [0, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x38], code: 0xe5181c, args: [1, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [1, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x39], code: 0xe5181c, args: [2, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [2, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      // chained: (7, 0x1e) (g1 s39) -> 0xe515d4(e, 3): L0 M27 -> L0 M28, which passing 92.0 sets (7, 0x3a) (0xe517a8)
      { action: [7, 0x3a], code: 0xe5181c, args: [3, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [3, 1], modes: [3, 4, 5, 6, 7], pick: 'ai', variant: '7:0x3a' },
      { action: [7, 0x3b], code: 0xe5181c, args: [4, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [4, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      // g0 s3 (after (2, 3) / (7, 0x1b)): aimed at the target, the pitch clamped to [-45, +45] degrees
      { action: [7, 0x82], code: 0xe5181c, args: [0, 2], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 2], modes: [9, 10, 11], pick: 'ai', variant: '7:0x82' },
      { action: [7, 0x83], code: 0xe55030, args: [0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 3], modes: [16, 17, 18], pick: 'unread' },
      // g0 s4, s5, s6, g1 s38, s189: aimed, the pitch clamped to [+10, +45] degrees
      { action: [7, 0x84], code: 0xe55030, args: [1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 4], modes: [19, 20, 21, 22, 23], pick: 'ai', variant: '7:0x84' },
    ],
  },

  // RATHIAN (notes E:\offline\decode\notes\shells-em001.md). uEm001_00 (ctor 0xcecd20, vtable 0x1793c28) serves Rathian
  // (em number byte +0xb5f4 = 1) and Rathalos (2); its vtable +0x158 0xd09918 loads, for em 1 variant 0, the global shells
  // 0x54 / 0x5a / 0x60 and keeps them at enemy +0xcac4 / +0xcac8 / +0xcacc (0xd09958..0xd09978). Values below are the
  // files' own, em001_00.arc (C:\MHGU-Extract\scratch-em\em001_00\em001_00.arc, folders shell\em\em001_00_shellNN).
  em001_00: {
    name: 'Rathian',
    // every em001_00 .shl (shell00, shell01) names EffectLists[0] = effect\pel\em\em001_00c (c.pel) and [1] =
    // effect\pel\em\em001_00u (u.pel), the rest null (notes 1); shell11's are all null and it starts nothing
    lists: { 0: { list: 'c', pel: 'em001_00c' }, 1: { list: 'u', pel: 'em001_00u' } },
    shells: {
      // THE FIREBALLS. Global shell id 0x54; table 0x175c3e8[0x54] = {uShellEm001_sp_00 DTI 0x188bc48, uShellEmBase00::
      // cSetupParamEmBase00 DTI 0x1885948, resource 0x89a7}; size 0x1670, ctor 0xd0d928 (base00 ctor 0x3f8a04; +0x1660..
      // +0x1668 = the zero vector, +0x166c = 0), vtable 0x1795490: its own slots are 1, 5, +0x14c the reader 0xd0d988 and
      // +0x150 the landing 0xd0dc9c; the rest is uShellEmBase00's (init +0x13c 0x3f8b80, move +0x24 0x3f96a0, end +0x148
      // 0x3f9ef4, ending +0x15c 0x3f986c).
      shell00: {
        id: 0x54, cls: 'uShellEm001_sp_00', base: 'base00', folder: 'shell\\em\\em001_00_shell00', reader: 0xd0d988,
        // em001_00_00_sh### (the reader, params001): ints [joint gid, camera id at a type-0 contact, at a type-1 contact
        // (the floor), != -1: flag 1 (X aimed), flag 2, flag 4, flag 8, flag 0x20]; floats [X degrees, Y degrees (the
        // spread), speed along +Z, flight time, X min, X max, the aim offset's y, Y min, Y max]; vecs [launch offset in
        // joint 3's space, the aim-from offset in the owner's space]. em001_00_00_ef###: EffectParams 0 the flying fireball
        // (c 0 = em001_00_003; mode 8 u 30 = em001_02_001), 1 landing type 0 (c 2 = em001_02_008), 2 landing type 1, the
        // floor (c 1 = em001_00_006; mode 8 none), 3 type 2, a hunter. `hit` = the HitParam ints (not visual here).
        // ShellInfoList has 38 entries, files at 0..8 only. ShellScale 1.0 in every entry.
        modes: {
          0: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
               sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -45.0, 45.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 200.0, 200.0]] } },
          1: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
               sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [5.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
               sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [5.0, -18.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          // 4.4 is the float32 0x408ccccd
          3: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
               sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [4.4, 23.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          4: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
               sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, 0.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 260.0, 400.0]] } },
          5: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
               sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          6: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
               sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, -18.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          7: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
               sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 23.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          8: { scale: 1.0, ef: [[1, 30], [999, -1], [999, -1], [1, 36]], hit: [1],
               sh: { ints: [3, 1, 5, -1, -1, -1, -1, -1], floats: [25.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
      },
      // GROUND FIRE, EXPLOSIONS, LANDING DUST, BREATH PUFFS, HIT VOLUMES. Global shell id 0x5a; table 0x175c3e8[0x5a] =
      // {uShellEm001_sp_01 DTI 0x188bc68, uShellEmBase01::cSetupParamEmBase01 DTI 0x18859e8, resource 0x89ad}; size 0x1660,
      // ctor 0xd0e670 (base01 ctor 0x3fa2f8; +0x1654 = 0), vtable 0x179560c: its own slots are 1, 5, +0x14c the reader
      // 0xd0e6a0, +0x150 0xd0e9d4 (the hit radius growth), +0x154 0xd0eb20 (end creates: none of these modes), +0x158
      // 0xd0ec98 (the hit registration); base01's: init +0x13c 0x3fa498, move +0x24 0x3faec4, end +0x148 0x3fb264.
      shell01: {
        id: 0x5a, cls: 'uShellEm001_sp_01', base: 'base01', folder: 'shell\\em\\em001_00_shell01', reader: 0xd0e6a0,
        // em001_00_01_sh### (the reader, params011): ints [!= -1: flag 1 (from a joint), the joint gid, flag 2 (turned by
        // the angle words), flag 4 (snapped to the ground), flag 8 (angles from the ground), flag 0x80 (at the owner's
        // ground), flag 0x100, flag 0x800, flag 0x1000]; floats [timer, hit radius growth frames, (+0x15fc)]; vecs [the
        // offset]. em001_00_01_ef###: EffectParams 0 / 1 (c 3 = em001_00_008 the fire; u 31 / 34 / 33 / 32 = em001_02_004
        // the explosions; c 30 / c 31 = cm200_040 the dust; u 61 / 62 = em001_02_006 the breath puffs). `hit` = the HitParam
        // ints: records of em001_00_01_hitdata (hitdata below) for hit slots 0 / 1. ShellInfoList has 56 entries, files at
        // these 14 only; a created mode with no files (31..33) reads -1 / 0.0 / the zero vector and starts nothing.
        modes: {
          0: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [8, -1],
               sh: { ints: [0, 3, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 190.0]] } },
          1: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [0, 2],
               sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 3], [999, -1]], hit: [7, -1],
               sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [200.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          6: { scale: 1.0, ef: [[1, 31], [999, -1]], hit: [3, -1],
               sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          7: { scale: 1.0, ef: [[1, 34], [999, -1]], hit: [4, -1],
               sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          8: { scale: 1.0, ef: [[1, 33], [999, -1]], hit: [5, -1],
               sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[1, 32], [999, -1]], hit: [6, -1],
               sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          13: { scale: 1.0, ef: [[0, 30], [0, -1]], hit: [-1, 12],
                sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 100.0]] } },
          14: { scale: 1.0, ef: [[0, 31], [0, -1]], hit: [-1, 13],
                sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 14],
                sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, -1],
                sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          44: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [16, -1],
                sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          45: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [17, -1],
                sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          46: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [17, -1],
                sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
        },
        // em001_00_01_hitdata (HDS, 18 records of 0x38 bytes from +0x10): (s16 +0 delay, s16 +2 duration) by record, the
        // two values the hit registration hands the slot (0x168a68..0x168a84). Read only for the hit-slot life (input.hitLife).
        hitdata: [[10, 10], [10, 10], [0, 10], [10, 20], [6, 16], [6, 16], [6, 16], [8, 172], [6, 4], [2, 10], [2, 10],
                  [0, 10], [14, 10], [14, 10], [14, 10], [14, 10], [2, 10], [2, 10]],
      },
      // THE EXPLOSION TIMER. Global shell id 0x60; table 0x175c3e8[0x60] = {uShellEm001_sp_11 DTI 0x188bc88, uShellEmBase01::
      // cSetupParamEmBase01, resource 0x89b3}; size 0x1670, ctor 0xd0ee5c (base11 ctor 0x402f80: base01 ctor, +0x1654 = 0,
      // +0x1658 = 0, +0x165c = -1, +0x1660 = 0, +0x15a8 = 0xb; then +0x1664 = 0x19d), vtable 0x179577c: base11's init +0x13c
      // 0x402fd8 and +0x150 0x40308c; its own +0x14c the reader 0xd0ee8c and +0x168 the create 0xd0efc0; base01's move.
      shell11: {
        id: 0x60, cls: 'uShellEm001_sp_11', base: 'base11', folder: 'shell\\em\\em001_00_shell11', reader: 0xd0ee8c,
        // em001_00_11_sh000: floats [the create times], vecs [the offsets, turned by the Y word]; no EffectParams, no hit
        modes: {
          0: { scale: 1.0, ef: [], hit: [],
               sh: { ints: [], floats: [0.0, 16.0, 26.0, 36.0], vecs: [[0.0, 0.0, 0.0], [400.0, 0.0, 100.0], [-460.0, 0.0, 150.0], [0.0, 0.0, 450.0]] } },
        },
        // per create k (0xd0ef78..0xd0efac, 0xd0efc0): the time's float index (0x169b744), the vec index (0x169b754) and
        // the shell01 mode (0x169b764)
        times: [0, 1, 2, 3], vecIdx: [0, 1, 2, 3], modes01: [6, 7, 8, 9],
      },
    },
    // THE ACTIONS (status 7 switch 0xcefbd4, table 0xcefc00; notes 2.2 / 2.3), each read to its spawn helper. Every one is
    // issued by a command stream (em001_00_cmdtbl op 0x00) the AI picks by op 0x24 and others, whose values are NOT READ,
    // so the viewer names the action (input.rock.variant = `variant`; pickVariantsFor lists a clip's). `clip` is the
    // action's MAIN motion, whose frame the spawn test reads; `partners` are the blend's secondary clips (0xb04d0: same
    // length, started at the same frame -- INFERRED in step), which the viewer may play instead: they map to the action.
    // `spawner` = the helper, `spawnArgs` its args, `frames` / `modes` its tests and the mode each makes:
    //   0xd0a134 / 0xd0a614 / 0xd0b0b8: one test (0xb0974); r1 0 -> shell00, r1 1 -> shell01 mode 0 (a hit volume)
    //   0xd0a394 / 0xd0b638: three tests, all evaluated; ONE shell, the last passing test's mode (0xd0a3a8..0xd0a3fc)
    //   0xd0baec(e, r1, r2, 1): r1 1: passes 76 -> modes[0], else 72 -> [1], else 68 -> [2] (0xd0bb04..0xd0bbc8), G rank
    //     (0x3a8430 > 4) modesG; r1 != 1 -> nothing for em001_00 (variant 4's mode 0x10 only)
    // `op24` = the branch of the command table's op 0x24 if / else that issues the action: the interpreter's op-0x24 case
    // 0x86fac runs the `24 00` body only when 0x81634(e) != 0 (0x86fd0..0x86fdc), else skips past the `24 02` marker
    // (0x8df88) to the else body; 0x81634 = 0 while enraged (P+0x518 == 1, 0x8163c..0x81648), else +0x505 in {1, 2, 3}
    // (exhaustion pending or tired, 0x8164c..0x81668; states-em043.md: +0x505 0 normal, 1 pending, 2 / 3 tired). Every
    // em001_00_cmdtbl site: 'if' (tired and not enraged) = the no-fire twins (7, 0x0f) g1 s4 / s82 / s166 / s216..s218 /
    // s223 / s229 / s231, g8 s0; (7, 0x22) g1 s8 / s12, g8 s0; (7, 0x0b) g1 s126 / s133; (7, 0x6c) g1 s178 / s179. 'else'
    // = the fire actions (7, 0x02) g1 s4 / s223, g8 s0 (and g1 s127, which has no op 0x24 and no stream calls it: `14 7f`
    // appears nowhere; whether code enters it is NOT READ); (7, 0x08) g1 s8 / s12, g8 s0; (7, 0x0a) g1 s126 / s133; (7,
    // 0x6b) g1 s178 / s179; (7, 0x3a) g1 s59 and (7, 0x47) g1 s91, whose `24 00` bodies issue (7, 0x10) = 0xcf44d0(e, 2),
    // which starts with motion 7 (L0 M7), not L4 M16. No op24: the L4 M65 actions (the choice among them is NOT READ).
    actions: [
      // (7, 0x02) / (7, 0x0f) = 0xcfddec(e, 0 / 1): 0xb04d0(e, 0x205 = L2 M5, 0x20f = M15 (w >= 0) or 0x210 = M16, 6.0, 0.0, w)
      { action: [7, 0x02], code: 0xcfddec, args: [0], list: '2', clip: 'Motion[5]', partners: ['Motion[15]', 'Motion[16]'], spawner: 0xd0a134, spawnArgs: [0], frames: [78.0], shell: 'shell00', modes: [0], op24: 'else', pick: 'ai', variant: '7:0x02' },
      { action: [7, 0x0f], code: 0xcfddec, args: [1], list: '2', clip: 'Motion[5]', partners: ['Motion[15]', 'Motion[16]'], spawner: 0xd0a134, spawnArgs: [1], frames: [78.0], shell: 'shell01', modes: [0], op24: 'if', pick: 'ai', variant: '7:0x0f' },
      // (7, 0x0a) / (7, 0x0b) = 0xcfef64(e, 0 / 1): main 0x212 = L2 M18, secondary 0x212 (w >= 0) or 0x211 = M17
      { action: [7, 0x0a], code: 0xcfef64, args: [0], list: '2', clip: 'Motion[18]', partners: ['Motion[17]'], spawner: 0xd0a614, spawnArgs: [0], frames: [80.0], shell: 'shell00', modes: [4], op24: 'else', pick: 'ai', variant: '7:0x0a' },
      { action: [7, 0x0b], code: 0xcfef64, args: [1], list: '2', clip: 'Motion[18]', partners: ['Motion[17]'], spawner: 0xd0a614, spawnArgs: [1], frames: [80.0], shell: 'shell01', modes: [0], op24: 'if', pick: 'ai', variant: '7:0x0b' },
      // (7, 0x08) case body 0xcf0390: setMotion 0x408 = L4 M8, blend 4.0 (no partner); (7, 0x6b) / (7, 0x6c) = 0xd02efc(e,
      // 0 / 1): main L4 M8, secondary 0x435 = M53 (w >= 0) or 0x436 = M54; (7, 0x22) = 0xcfe204(e, 1): L4 M8
      { action: [7, 0x08], code: 0xcf0390, args: [], list: '4', clip: 'Motion[8]', partners: [], spawner: 0xd0a394, spawnArgs: [0], frames: [82.0, 122.0, 162.0], shell: 'shell00', modes: [1, 2, 3], op24: 'else', pick: 'ai', variant: '7:0x08' },
      { action: [7, 0x6b], code: 0xd02efc, args: [0], list: '4', clip: 'Motion[8]', partners: ['Motion[53]', 'Motion[54]'], spawner: 0xd0b638, spawnArgs: [0], frames: [76.0, 114.0, 156.0], shell: 'shell00', modes: [5, 6, 7], op24: 'else', pick: 'ai', variant: '7:0x6b' },
      { action: [7, 0x22], code: 0xcfe204, args: [1], list: '4', clip: 'Motion[8]', partners: [], spawner: 0xd0a394, spawnArgs: [1], frames: [82.0, 122.0, 162.0], shell: 'shell01', modes: [0, 0, 0], op24: 'if', pick: 'ai', variant: '7:0x22' },
      { action: [7, 0x6c], code: 0xd02efc, args: [1], list: '4', clip: 'Motion[8]', partners: ['Motion[53]', 'Motion[54]'], spawner: 0xd0b638, spawnArgs: [1], frames: [76.0, 114.0, 156.0], shell: 'shell01', modes: [0, 0, 0], op24: 'if', pick: 'ai', variant: '7:0x6c' },
      // (7, 0x3a) case body 0xcf01b0 / (7, 0x47) = 0xd01640(e, 1): setMotion 0x410 = L4 M16, blend 4.0; (7, 0x47) turns the
      // monster while the frame is below 40 (0x76c08(e, 0x111, 0): NOT READ -- input.owner.y is the facing at the spawn)
      { action: [7, 0x3a], code: 0xcf01b0, args: [], list: '4', clip: 'Motion[16]', partners: [], spawner: 0xd0b0b8, spawnArgs: [], frames: [108.0], shell: 'shell00', modes: [8], op24: 'else', pick: 'ai', variant: '7:0x3a' },
      { action: [7, 0x47], code: 0xd01640, args: [1], list: '4', clip: 'Motion[16]', partners: [], spawner: 0xd0b0b8, spawnArgs: [], frames: [108.0], shell: 'shell00', modes: [8], op24: 'else', pick: 'ai', variant: '7:0x47' },
      // (7, 0x77) / (7, 0x7b) / (7, 0x76) / (7, 0x7a) = 0xd03e9c(e, r1, r2) = (1, 0) / (1, 1) / (0, 0) / (0, 1): setMotion
      // 0x441 = L4 M65, start 0.0 (r2 0) or 64.0 (r2 1); phase 1 0xd0baec(e, r1, r2, 1). (7, 0x7b)'s phase-0 call 0xd0baec(e,
      // 1, 1, 0) tests 68.0 on the frame pair the motion start leaves -- the viewer's fresh motion has none (not modelled).
      // No op 0x24 chooses among these four: (7, 0x77) is issued in g1 s212 (under ops 0x6e / 0x1d), (7, 0x76) in g0 s41 /
      // s43 and g1 s95, (7, 0x7b) / (7, 0x7a) by no stream; which one plays is NOT READ. The two that draw come first.
      { action: [7, 0x77], code: 0xd03e9c, args: [1, 0], list: '4', clip: 'Motion[65]', partners: [], spawner: 0xd0baec, spawnArgs: [1, 0, 1], frames: [76.0, 72.0, 68.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f], modesG: [0x2e, 0x2d, 0x2c], pick: 'ai', variant: '7:0x77' },
      { action: [7, 0x7b], code: 0xd03e9c, args: [1, 1], list: '4', clip: 'Motion[65]', partners: [], spawner: 0xd0baec, spawnArgs: [1, 1, 1], frames: [76.0, 72.0, 68.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f], modesG: [0x2e, 0x2d, 0x2c], pick: 'ai', variant: '7:0x7b' },
      { action: [7, 0x76], code: 0xd03e9c, args: [0, 0], list: '4', clip: 'Motion[65]', partners: [], spawner: 0xd0baec, spawnArgs: [0, 0, 1], frames: [], shell: 'shell01', modes: [], pick: 'ai', variant: '7:0x76' },
      { action: [7, 0x7a], code: 0xd03e9c, args: [0, 1], list: '4', clip: 'Motion[65]', partners: [], spawner: 0xd0baec, spawnArgs: [0, 1, 1], frames: [], shell: 'shell01', modes: [], pick: 'ai', variant: '7:0x7a' },
      // THE HOVER TURNS: (4, 4) and (4, 0x15) share the status-4 case body 0xcef9d8 -> 0xcfad9c, which picks L1 M2, M11 or M12
      // by the turn (0x7a284 from 0x1794170 -> 0x169b674 / 0x169b6b4: motions 0x102 / 0x10b / 0x10c, blend 6.0); no shell.
      // They matter only to the hover dust, which (4, 0x15) skips on those clips. Which one the AI issues is NOT READ: pick
      // 'hover' is never listed by pickVariantsFor (so the viewer's default is not (4, 0x15)); the viewer names (4, 0x15)
      // with input.rock.variant '4:0x15' (or input.action [4, 0x15]) when it wants that play.
      { action: [4, 0x04], code: 0xcfad9c, args: [], list: '1', clip: 'Motion[2]', partners: ['Motion[11]', 'Motion[12]'], frames: [], modes: [], pick: 'hover', variant: '4:0x04' },
      { action: [4, 0x15], code: 0xcfad9c, args: [], list: '1', clip: 'Motion[2]', partners: ['Motion[11]', 'Motion[12]'], frames: [], modes: [], pick: 'hover', variant: '4:0x15' },
    ],
    // THE LANDING DUST: the per-frame handler (vtable +0x208 = 0xcf1a5c, run from the enemy's vtable +0x28 after its move)
    // switches on the motion id (0xb0944; tables 0xcf1c70 / 0xcf1aa4 / 0xcf1d00 / 0xcf1b90) and, on the same frame pair the
    // action code tests (0xb09b0 = 0x72714 on +0x13ac / +0x13b4), calls 0xd09e28(e, mode, 900.0). `ids` = motion ids (list
    // << 8 | slot), `frame` the literal, `mode` the shell01 mode. Needs no pick. (L4 M34 / M37, 0x422 / 0x425, share two
    // case bodies but are not in em001_00's .lmt files.)
    dust: [
      { ids: [0x018, 0x01b, 0x01e], at: 0xcf1cd8, frame: 2.0, mode: 14 },
      { ids: [0x104], at: 0xcf1e04, frame: 2.0, mode: 13 },
      { ids: [0x105], at: 0xcf1e0c, frame: 46.0, mode: 14 },
      { ids: [0x10e], at: 0xcf1e14, frame: 52.0, mode: 13 },
      { ids: [0x111], at: 0xcf1e3c, frame: 2.0, mode: 14 },
      { ids: [0x113, 0x40d], at: 0xcf1d7c, frame: 2.0, mode: 14 },
      { ids: [0x125], at: 0xcf1e64, frame: 4.0, mode: 14 },
      { ids: [0x407], at: 0xcf1e94, frame: 34.0, mode: 14 },
      { ids: [0x409, 0x425], at: 0xcf1c4c, frame: 112.0, mode: 14 },
      { ids: [0x40a], at: 0xcf1ebc, frame: 28.0, mode: 14 },
      { ids: [0x40f, 0x422], at: 0xcf1d84, frame: 2.0, mode: 14 },
      { ids: [0x411], at: 0xcf1f04, frame: 2.0, mode: 20 },
      // THE HOVER DUST (shared-state-effects.md 10): L1 M1 (0xcf1b50) and L1 M2 / M11 / M12 (0xcf1b38: nothing when
      // 0x6fe88(e, 4, 0x15) -- "the action is (4, 0x15)", +0x73e0 == 4 && +0x73e1 == 0x15, 0x6fe88..0x6feb4): byte ctl+0x14
      // (ctl = [e+0xcac0] = block +0x60, so block +0x74) != 0 -> 0xd09e28(e, 13, 900.0), no frame test. ctl+0x14 is a
      // ONE-FRAME PULSE: vtable +0x1dc = 0xcee250, called every move at 0xaddc8 (before the action main 0xadddc), clears
      // it (0xcee2a8), adds the step to the timer ctl+8 (0x7264c -> 0x539d48, times 1.0), and at ctl+8 >= 100.0 (0xcee3cc)
      // sets ctl+8 = 0 and ctl+0x14 = 1 (0xcee2c0..0xcee2e0); the setup 0xcecd94 zeroes both (0xcece94 / 0xceceac). So
      // one c 30 per 100 frames of hover, phased by the timer since the monster's setup, not by the clip (input.stepCount).
      { ids: [0x101], at: 0xcf1b50, pulse: true, mode: 13 },
      { ids: [0x102, 0x10b, 0x10c], at: 0xcf1b38, pulse: true, not: [4, 0x15], mode: 13 },
      // L2 M12 (0xcf1dc8): posture P+0x1ba == 3 and 0xb09a4(e, 1, 0, 24.0) (cur >= 24) -> 0xcf2424, every 16 frames
      // (block +0x5c58) at the owner's ground. NEVER in Rathian's play: its posture while L2 M12 plays is 1 (`postures`).
      { ids: [0x20c], at: 0xcf1dc8, period: 16.0, from: 24.0, posture: 3, mode: 15 },
    ],
    // P+0x1ba, the posture, while a clip plays -- only where a dust row reads it (L2 M12). L2 M12 is set by one site in the
    // class code, 0xcff700 in 0xcff66c ((7, 0x1c) / (7, 0x1d) / (7, 0x39)), whose phase 0 calls 0xbc984 first (0xcff6f0:
    // posture 1 unless already 1, 0xbca0c..0xbca18); posture 3 comes only with its switch to L2 M11 (0xbc7f4(e, 3) at
    // 0xcff7d8, setMotion 0x20b at 0xcff7ec).
    postures: { '2|Motion[12]': 1 },
  },

  // GOLD RATHIAN (em001_02): Rathian's class uEm001_00 with em byte +0xb5f4 = 1, variant +0xb5f5 = 2. 0xd09918
  // keeps the global shells 0x55 / 0x5b / 0x61 at enemy +0xcac4 / +0xcac8 / +0xcacc (0xd099dc..0xd099f8); table
  // 0x175c3e8 names Rathian's classes for them (uShellEm001_sp_00 / sp_01 / sp_11) with this monster's .shl (resources
  // 0x89a8 / 0x89ae / 0x89b4). The shell classes test no variant byte (in 0xd0d928..0xd0f400 only the landing's em-2
  // tests, 0xd0e11c..0xd0e268), so Rathian's base00 / base01 / base11 code runs them. Values: the files' own,
  // C:\MHGU-Extract\scratch-em\em001_02\em001_02.arc, shell\em\em001_02_shellNN (ShellInfoList 38 / 56 / 1, ShellScale 1.0).
  em001_02: {
    name: 'Gold Rathian',
    variant: 2,                                     // enemy +0xb5f5
    // every em001_02 .shl (shell00, shell01) names EffectLists[0] = effect\pel\em\em001_00c (Rathian's c.pel) and [1] =
    // effect\pel\em\em001_02u (its own u.pel), the rest null (the XFS arrays at 0x184b / 0x2409); shell11's are all null
    lists: { 0: { list: 'c', pel: 'em001_00c' }, 1: { list: 'u', pel: 'em001_02u' } },
    shells: {
      // THE FIREBALLS (uShellEm001_sp_00, base00; Rathian's shell00 notes apply). Modes 0..7 as Rathian's; 8 (camera id 5
      // at a type-0 contact), 9 / 10 / 11 / 24 / 25 (flags 0: angles from the owner's words; X offset 15 / 25 / 35 / 15 /
      // 25 degrees, Y spread -20 / 0, speed 100, flight 72) are this monster's; 8..11, 24, 25 are in the landing's mask
      // (0xd0dd08..0xd0dd24: shell11 on the floor, shell01 mode 9 otherwise).
      shell00: {
        id: 0x55, cls: 'uShellEm001_sp_00', base: 'base00', folder: 'shell\\em\\em001_02_shell00', reader: 0xd0d988,
        modes: {
          0: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -45.0, 45.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 200.0, 200.0]] } },
          1: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [5.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [5.0, -18.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          3: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [4.4, 23.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          4: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, 0.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 260.0, 400.0]] } },
          5: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          6: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, -18.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          7: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 23.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          8: { scale: 1.0, ef: [[1, 30], [999, -1], [999, -1], [1, 36]], hit: [1],
             sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [25.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[1, 30], [999, -1], [999, -1], [0, 2]], hit: [1],
             sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [15.0, -20.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          10: { scale: 1.0, ef: [[1, 30], [999, -1], [999, -1], [0, 2]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [25.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          11: { scale: 1.0, ef: [[1, 30], [999, -1], [999, -1], [0, 2]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [35.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          24: { scale: 1.0, ef: [[1, 30], [999, -1], [999, -1], [0, 2]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [15.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          25: { scale: 1.0, ef: [[1, 30], [999, -1], [999, -1], [0, 2]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [25.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
      },
      // GROUND FIRE, EXPLOSIONS, DUST, PUFFS, HIT VOLUMES (uShellEm001_sp_01, base01; params011). Rathian's 1, 2, 6..9, 15,
      // 44..46; mode 0 (the no-fire hit volume) has timer 9.0; 13 / 14 / 20 (dust) refuse EffectParam 1 as (999, -1) and 20
      // registers hit slot 0 (record 15); this monster's: 3..5 / 38..40 (L2 M1's puffs, rank < 5 / G) and 31..33 (L4 M65's
      // at rank < 5), on joint 4 (flag 1), starting u 60 / 61 / 62 of em001_02u.
      shell01: {
        id: 0x5b, cls: 'uShellEm001_sp_01', base: 'base01', folder: 'shell\\em\\em001_02_shell01', reader: 0xd0e6a0,
        modes: {
          0: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [8, -1],
             sh: { ints: [0, 3, 0, -1, -1, -1, -1, -1, -1], floats: [9.0, 0.0, 0.0], vecs: [[0.0, 0.0, 190.0]] } },
          1: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [0, 2],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 3], [999, -1]], hit: [7, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [200.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          3: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [9, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          4: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [10, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          5: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [10, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          6: { scale: 1.0, ef: [[1, 31], [999, -1]], hit: [3, -1],
             sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          7: { scale: 1.0, ef: [[1, 34], [999, -1]], hit: [4, -1],
             sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          8: { scale: 1.0, ef: [[1, 33], [999, -1]], hit: [5, -1],
             sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[1, 32], [999, -1]], hit: [6, -1],
             sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          13: { scale: 1.0, ef: [[0, 30], [999, -1]], hit: [-1, 12],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 100.0]] } },
          14: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 13],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 14],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [15, -1],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          31: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [9, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          32: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [10, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          33: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [10, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          38: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [16, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          39: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [17, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          40: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [17, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          44: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [16, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          45: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [17, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          46: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [17, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
        },
        // em001_02_01_hitdata (HDS, 18 records): (s16 +0 delay, s16 +2 duration) by record, for input.hitLife
        hitdata: [[10, 10], [10, 10], [0, 10], [10, 20], [6, 16], [6, 16], [6, 16], [8, 172], [6, 5], [2, 10], [2, 10],
                  [0, 10], [14, 10], [14, 10], [14, 10], [14, 10], [2, 10], [2, 10]],
      },
      // THE EXPLOSION TIMER (uShellEm001_sp_11, base11): the same file values as Rathian's
      shell11: {
        id: 0x61, cls: 'uShellEm001_sp_11', base: 'base11', folder: 'shell\\em\\em001_02_shell11', reader: 0xd0ee8c,
        modes: {
          0: { scale: 1.0, ef: [], hit: [],
             sh: { ints: [], floats: [0.0, 16.0, 26.0, 36.0], vecs: [[0.0, 0.0, 0.0], [400.0, 0.0, 100.0], [-460.0, 0.0, 150.0], [0.0, 0.0, 450.0]] } },
        },
        times: [0, 1, 2, 3], vecIdx: [0, 1, 2, 3], modes01: [6, 7, 8, 9],
      },
    },
    // THE ACTIONS. Rathian's (7, 0x02) .. (7, 0x7a) and the hover turns are this monster's too -- the same case bodies and
    // spawn helpers, which test no variant byte on these paths, on the same clips (L2 is em001_00_2.lmt, which all three
    // load; L4 M8 / M16 / M65 are in em001_02_4.lmt with Rathian's frame counts) -- so SHELL_DATA.em001_00.actions is put in
    // front of these (after this table; the ROM-run action sweep, efx\agents\rathian-variants-scratch\arun.py: every one
    // makes the same shells at the same frames, the modes being this monster's files). Gold's own: the class code's other
    // spawn helpers on clips its lists have (`spawns`, each { at: the helper, kind, frames, shell, modes }):
    //   'first': the first passing test in the listed order makes its mode (one shell); modesG when 0x3a8430 > 4
    //   'seq':   one phase per test (the next test runs only after the previous passed): one shell per passed phase
    //   'each':  every test on its own, each passing one a shell
    // The shell01 setups are 0xd09b84's (mode != 0x10): the zero vector 0x19176b0, the owner's angle words e+0xfe8..,
    // +0x3c = 0xffff (0xd09c18..0xd09cbc). None of the command table's streams issues (7, 0x4d) / (7, 0x75)
    // (em001_00_cmdtbl.emc, which all three load: no op names them) and no class code chains to them: who issues them is
    // NOT READ. Creates that draw nothing here, not listed: (7, 0x4e) (L2 M13 -> shell01 10..12: no em001_02 files), (7,
    // 0xec) / (7, 0xf9) (L4 M18 -> shell00 34..36), (7, 0xf5) (shell00 31), the take-offs (L4 M13 f6 -> shell00 21 / 22 /
    // 32 / 33 or shell01 0); a no-file shell00 ends at move 1 with no effect and no child (ROM-run, nofile.py).
    actions: [
      // (7, 0x4d) = 0xcfd770(e, 1) / (7, 0x75) = 0xd03b60(e, 1): phase 0 setMotion 0x201 = L2 M1, blend 8.0; phase 1 ->
      // 0xd0a074 / 0xd0ba2c (the same code): passes 74 -> mode 5, else 69 -> 4, else 64 -> 3, or 0x28 / 0x27 / 0x26 when
      // 0x3a8430 > 4 (0xd0a078..0xd0a118 / 0xd0ba30..0xd0bad0), via 0xd09b84. (7, 0x00) / (7, 0x74) are the same bodies
      // with r1 0, which never call the helper; (7, 0x75) plays L2 M3 after L2 M1 (0xd03db0). For em 1 variant 2 the
      // body also sets the motion speed 1.1 (0xb07b4 at 0xcfd820, s0 = 0x3f8ccccd): frames are motion frames either way.
      { action: [7, 0x4d], code: 0xcfd770, args: [1], list: '2', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0a074, kind: 'first', frames: [74.0, 69.0, 64.0], shell: 'shell01', modes: [5, 4, 3], modesG: [0x28, 0x27, 0x26] }], pick: 'ai', variant: '7:0x4d' },
      { action: [7, 0x75], code: 0xd03b60, args: [1], list: '2', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0ba2c, kind: 'first', frames: [74.0, 69.0, 64.0], shell: 'shell01', modes: [5, 4, 3], modesG: [0x28, 0x27, 0x26] }], pick: 'ai', variant: '7:0x75' },
      { action: [7, 0x00], code: 0xcfd770, args: [0], list: '2', clip: 'Motion[1]', partners: [], spawns: [], pick: 'ai', variant: '7:0x00' },
      { action: [7, 0x74], code: 0xd03b60, args: [0], list: '2', clip: 'Motion[1]', partners: [], spawns: [], pick: 'ai', variant: '7:0x74' },
      // (7, 0x42) = 0xd01988: phase 0 setMotion 0x412 = L4 M18, blend 4.0; phase 1 passes 116 -> 0xd0b18c(e, 1) = shell00
      // mode 9 and phase 2; then 168 -> mode 10, phase 3; then 226 -> mode 11 (0xd01a28 / 0xd01a8c / 0xd01af0; literals
      // 0xd01b6c / 0xd01b60 / 0xd01b54); a turn (0x76c08(e, 0x2e, 0)) in the windows 0..60, 140..160, 200..220 (NOT READ:
      // input.owner.y). The command table issues it in the else body of op 0x24 (g1 s82; its tired body: (7, 0x0f)).
      { action: [7, 0x42], code: 0xd01988, args: [], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b18c, kind: 'seq', frames: [116.0, 168.0, 226.0], shell: 'shell00', modes: [9, 10, 11] }], op24: 'else', pick: 'ai', variant: '7:0x42' },
      // (7, 0x4a) / (7, 0x5a) / (7, 0x5b) = 0xd02058(e, 0 / 1 / 2) and (7, 0xef) = 0xd0454c: their L4 M18 phase -> 0xd0b49c:
      // passes 116 -> shell00 mode 0x18, passes 168 -> 0x19, each on its own (0xd0b4a0 / 0xd0b558; literals 0xd0b610 /
      // 0xd0b624). Else bodies of op 0x24 (g1 s166; g1 s229 / s230).
      { action: [7, 0x4a], code: 0xd02058, args: [0], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b49c, kind: 'each', frames: [116.0, 168.0], shell: 'shell00', modes: [0x18, 0x19] }], op24: 'else', pick: 'ai', variant: '7:0x4a' },
      { action: [7, 0x5a], code: 0xd02058, args: [1], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b49c, kind: 'each', frames: [116.0, 168.0], shell: 'shell00', modes: [0x18, 0x19] }], op24: 'else', pick: 'ai', variant: '7:0x5a' },
      { action: [7, 0x5b], code: 0xd02058, args: [2], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b49c, kind: 'each', frames: [116.0, 168.0], shell: 'shell00', modes: [0x18, 0x19] }], op24: 'else', pick: 'ai', variant: '7:0x5b' },
      { action: [7, 0xef], code: 0xd0454c, args: [], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b49c, kind: 'each', frames: [116.0, 168.0], shell: 'shell00', modes: [0x18, 0x19] }], op24: 'else', pick: 'ai', variant: '7:0xef' },
    ],
  },
  // DREADQUEEN RATHIAN (em001_04): Rathian's class uEm001_00 with em byte +0xb5f4 = 1, variant +0xb5f5 = 4. 0xd09918
  // keeps the global shells 0x56 / 0x5c / 0x62 at enemy +0xcac4 / +0xcac8 / +0xcacc (0xd099b8..0xd099d4); table
  // 0x175c3e8 names Rathian's classes for them (uShellEm001_sp_00 / sp_01 / sp_11) with this monster's .shl (resources
  // 0x89a9 / 0x89af / 0x89b5). The shell classes test no variant byte (in 0xd0d928..0xd0f400 only the landing's em-2
  // tests, 0xd0e11c..0xd0e268), so Rathian's base00 / base01 / base11 code runs them. Values: the files' own,
  // C:\MHGU-Extract\scratch-em\em001_04\em001_04.arc, shell\em\em001_04_shellNN (ShellInfoList 38 / 56 / 1, ShellScale 1.0).
  em001_04: {
    name: 'Dreadqueen Rathian',
    variant: 4,                                     // enemy +0xb5f5
    // every em001_04 .shl (shell00, shell01) names EffectLists[0] = effect\pel\em\em001_00c (Rathian's c.pel) and [1] =
    // effect\pel\em\em001_04u (its own u.pel), the rest null (the XFS arrays at 0x184b / 0x2fbd); shell11's are all null
    lists: { 0: { list: 'c', pel: 'em001_00c' }, 1: { list: 'u', pel: 'em001_04u' } },
    shells: {
      // THE FIREBALLS (uShellEm001_sp_00, base00; Rathian's shell00 notes apply). Modes 0..7 as Rathian's; 8 (camera id 5
      // at a type-0 contact), 9 / 10 / 11 / 24 / 25 (flags 0: angles from the owner's words; X offset 15 / 25 / 35 / 15 /
      // 25 degrees, Y spread -20 / 0, speed 100, flight 72) are this monster's; 8..11, 24, 25 are in the landing's mask
      // (0xd0dd08..0xd0dd24: shell11 on the floor, shell01 mode 9 otherwise).
      shell00: {
        id: 0x56, cls: 'uShellEm001_sp_00', base: 'base00', folder: 'shell\\em\\em001_04_shell00', reader: 0xd0d988,
        modes: {
          0: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -45.0, 45.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 200.0, 200.0]] } },
          1: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [5.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [5.0, -18.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          3: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [4.4, 23.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          4: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, 0.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 260.0, 400.0]] } },
          5: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          6: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, -18.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          7: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 23.0, 60.0, 180.0, -90.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 250.0, 100.0]] } },
          8: { scale: 1.0, ef: [[1, 30], [0, 2], [999, -1], [0, 2]], hit: [1],
             sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [25.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[1, 30], [0, 2], [999, -1], [0, 2]], hit: [1],
             sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [15.0, -20.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          10: { scale: 1.0, ef: [[1, 30], [0, 2], [999, -1], [0, 2]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [25.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          11: { scale: 1.0, ef: [[1, 30], [0, 2], [999, -1], [0, 2]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [35.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          24: { scale: 1.0, ef: [[1, 30], [0, 2], [999, -1], [0, 2]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [15.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          25: { scale: 1.0, ef: [[1, 30], [0, 2], [999, -1], [0, 2]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [25.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
      },
      // GROUND FIRE, EXPLOSIONS, DUST, PUFFS, HIT VOLUMES, THE POISON (uShellEm001_sp_01, base01; params011). Rathian's 1,
      // 2, 6..9, 15; mode 0 has timer 9.0; this monster's: 3..5 / 38..40 (L2 M1, rank < 5 / G), 10..12 (L2 M13), 31..33
      // (L4 M65 at rank < 5, L9 M4 / M5), 44..46 (L4 M65, G), 36 / 48..50 (L9 M9) -- on joint 4 (flag 1; ints [0, 4, 0]:
      // flag 2 too, the offset turned by the angle words, 0x3fa9f4..0x3faab4) -- 21 (L9 M7: the owner's ground, 200 ahead)
      // and THE POISON 16 / 23 / 24 (0xd09b84(e, 0x10): from joint 145, snapped to the ground with its angles, flags
      // 1 | 4 | 8; timer 450.0; u 40 / 41 / 42).
      shell01: {
        id: 0x5c, cls: 'uShellEm001_sp_01', base: 'base01', folder: 'shell\\em\\em001_04_shell01', reader: 0xd0e6a0,
        modes: {
          0: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [8, -1],
             sh: { ints: [0, 3, 0, -1, -1, -1, -1, -1, -1], floats: [9.0, 0.0, 0.0], vecs: [[0.0, 0.0, 190.0]] } },
          1: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [0, 2],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 3], [999, -1]], hit: [7, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [200.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          3: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [9, -1],
             sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          4: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [10, -1],
             sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          5: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [10, -1],
             sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          6: { scale: 1.0, ef: [[1, 31], [999, -1]], hit: [3, -1],
             sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          7: { scale: 1.0, ef: [[1, 34], [999, -1]], hit: [4, -1],
             sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          8: { scale: 1.0, ef: [[1, 33], [999, -1]], hit: [5, -1],
             sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[1, 32], [999, -1]], hit: [6, -1],
             sh: { ints: [-1, -1, -1, 0, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          10: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-100.0, -20.0, 80.0]] } },
          11: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[80.0, 0.0, 100.0]] } },
          12: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 100.0], vecs: [[200.0, -130.0, 100.0]] } },
          13: { scale: 1.0, ef: [[0, 30], [999, -1]], hit: [-1, 12],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 100.0]] } },
          14: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 13],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 14],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          16: { scale: 1.0, ef: [[1, 40], [999, -1]], hit: [15, -1],
              sh: { ints: [0, 145, -1, 0, 0, -1, -1, -1, -1], floats: [450.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 16],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          21: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 22],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 200.0]] } },
          23: { scale: 1.0, ef: [[1, 41], [999, -1]], hit: [17, -1],
              sh: { ints: [0, 145, -1, 0, 0, -1, -1, -1, -1], floats: [450.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          24: { scale: 1.0, ef: [[1, 42], [999, -1]], hit: [18, -1],
              sh: { ints: [0, 145, -1, 0, 0, -1, -1, -1, -1], floats: [450.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          31: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [19, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          32: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [20, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          33: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [19, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[100.0, -170.0, 200.0]] } },
          36: { scale: 1.0, ef: [[1, 70], [999, -1]], hit: [21, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, -100.0, 300.0]] } },
          38: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [23, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          39: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [24, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          40: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [24, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          41: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [25, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-100.0, -20.0, 80.0]] } },
          42: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [25, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[80.0, 0.0, 100.0]] } },
          43: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [25, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[200.0, -130.0, 100.0]] } },
          44: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [23, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          45: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [24, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          46: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [24, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          48: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [26, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -150.0, 100.0]] } },
          49: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [27, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          50: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [27, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
        },
        // em001_04_01_hitdata (HDS, 28 records): (s16 +0 delay, s16 +2 duration) by record, for input.hitLife
        hitdata: [[10, 10], [10, 10], [0, 10], [10, 20], [6, 16], [6, 16], [6, 16], [8, 172], [6, 5], [2, 10], [2, 10],
                  [0, 10], [14, 10], [14, 10], [14, 10], [2, 9999], [14, 10], [2, 9999], [2, 9999], [2, 10], [2, 10],
                  [0, 8], [8, 10], [2, 10], [2, 10], [2, 10], [2, 8], [2, 8]],
      },
      // THE EXPLOSION TIMER (uShellEm001_sp_11, base11): the same file values as Rathian's
      shell11: {
        id: 0x62, cls: 'uShellEm001_sp_11', base: 'base11', folder: 'shell\\em\\em001_04_shell11', reader: 0xd0ee8c,
        modes: {
          0: { scale: 1.0, ef: [], hit: [],
             sh: { ints: [], floats: [0.0, 16.0, 26.0, 36.0], vecs: [[0.0, 0.0, 0.0], [400.0, 0.0, 100.0], [-460.0, 0.0, 150.0], [0.0, 0.0, 450.0]] } },
        },
        times: [0, 1, 2, 3], vecIdx: [0, 1, 2, 3], modes01: [6, 7, 8, 9],
      },
    },
    // THE ACTIONS. As Gold's (above): Rathian's actions in front (after this table), except her four L4 M65 entries, which
    // this monster's replace (0xd0baec's variant-4 extra); Gold's kinds, and the variant-4 paths:
    //   'poison': 0xd09b84(e, 0x10) -- the mode, the old poison's end and the inputs are poison001's (below)
    //   'ground': 0xd09e28(e, mode, 900.0), the landing dust's create (the owner's point, its 900 height test)
    // `tune` = frames read from the actiontune: 0x6f618(e, n) = [e+0x75e4] vtable +0x4c = the rFreeUseParam float getter
    // 0x3cb330 (0.0 past the end); e+0x75e4 is the rFreeUseParam the enemy loader requests at 0x4b874 (DTI 0x1884fd0) and
    // hands to the delegate e+0x76d0 = 0x70944 (installed at 0x70608) -- the only non-shell rFreeUseParam in em001_04.arc
    // is enemy\action_tune\em001_04_actiontune (`tune` below). No command-table stream issues (7, 0x4d), (7, 0x75), (7,
    // 0x7a) or (7, 0x7b) (NOT READ who does); (7, 0xf2) is chained from (7, 0xef) / (7, 0xf0) / (7, 0xf1) (vtable +0x3d0
    // at 0xd0477c / 0xd049f8 / 0xd04b9c). Not listed (no files): (7, 0xec) / (7, 0xf9) shell00 34..36, (7, 0xfa) / (7,
    // 0xfb) shell00 31 (L9 M1 f346), (7, 0xf5), the take-offs; (7, 0xf6) / (7, 0xf7) start on L9 M14 / M12, which
    // em001_04_9.lmt lacks (their L9 M4 / M5 phases were not run).
    actions: [
      // L4 M65 = 0xd03e9c(e, r1, r2) as Rathian's (7, 0x77) / (7, 0x7b) / (7, 0x76) / (7, 0x7a); for variant 4 every
      // 0xd0baec call then passes 116 -> 0xd09b84(e, 0x10) (0xd0bbd0..0xd0bc00; literal 0xd0bc24), whatever r1
      { action: [7, 0x77], code: 0xd03e9c, args: [1, 0], list: '4', clip: 'Motion[65]', partners: [], spawns: [{ at: 0xd0baec, kind: 'first', frames: [76.0, 72.0, 68.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f], modesG: [0x2e, 0x2d, 0x2c] }, { at: 0xd0bbd0, kind: 'poison', frames: [116.0] }], pick: 'ai', variant: '7:0x77' },
      { action: [7, 0x7b], code: 0xd03e9c, args: [1, 1], list: '4', clip: 'Motion[65]', partners: [], spawns: [{ at: 0xd0baec, kind: 'first', frames: [76.0, 72.0, 68.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f], modesG: [0x2e, 0x2d, 0x2c] }, { at: 0xd0bbd0, kind: 'poison', frames: [116.0] }], pick: 'ai', variant: '7:0x7b' },
      { action: [7, 0x76], code: 0xd03e9c, args: [0, 0], list: '4', clip: 'Motion[65]', partners: [], spawns: [{ at: 0xd0bbd0, kind: 'poison', frames: [116.0] }], pick: 'ai', variant: '7:0x76' },
      { action: [7, 0x7a], code: 0xd03e9c, args: [0, 1], list: '4', clip: 'Motion[65]', partners: [], spawns: [{ at: 0xd0bbd0, kind: 'poison', frames: [116.0] }], pick: 'ai', variant: '7:0x7a' },
      // L2 M1: as Gold's (0xd0a074 / 0xd0ba2c)
      { action: [7, 0x4d], code: 0xcfd770, args: [1], list: '2', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0a074, kind: 'first', frames: [74.0, 69.0, 64.0], shell: 'shell01', modes: [5, 4, 3], modesG: [0x28, 0x27, 0x26] }], pick: 'ai', variant: '7:0x4d' },
      { action: [7, 0x75], code: 0xd03b60, args: [1], list: '2', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0ba2c, kind: 'first', frames: [74.0, 69.0, 64.0], shell: 'shell01', modes: [5, 4, 3], modesG: [0x28, 0x27, 0x26] }], pick: 'ai', variant: '7:0x75' },
      { action: [7, 0x00], code: 0xcfd770, args: [0], list: '2', clip: 'Motion[1]', partners: [], spawns: [], pick: 'ai', variant: '7:0x00' },
      { action: [7, 0x74], code: 0xd03b60, args: [0], list: '2', clip: 'Motion[1]', partners: [], spawns: [], pick: 'ai', variant: '7:0x74' },
      // L4 M18: as Gold's
      { action: [7, 0x42], code: 0xd01988, args: [], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b18c, kind: 'seq', frames: [116.0, 168.0, 226.0], shell: 'shell00', modes: [9, 10, 11] }], op24: 'else', pick: 'ai', variant: '7:0x42' },
      { action: [7, 0x4a], code: 0xd02058, args: [0], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b49c, kind: 'each', frames: [116.0, 168.0], shell: 'shell00', modes: [0x18, 0x19] }], op24: 'else', pick: 'ai', variant: '7:0x4a' },
      { action: [7, 0x5a], code: 0xd02058, args: [1], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b49c, kind: 'each', frames: [116.0, 168.0], shell: 'shell00', modes: [0x18, 0x19] }], op24: 'else', pick: 'ai', variant: '7:0x5a' },
      { action: [7, 0x5b], code: 0xd02058, args: [2], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b49c, kind: 'each', frames: [116.0, 168.0], shell: 'shell00', modes: [0x18, 0x19] }], op24: 'else', pick: 'ai', variant: '7:0x5b' },
      { action: [7, 0xef], code: 0xd0454c, args: [], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd0b49c, kind: 'each', frames: [116.0, 168.0], shell: 'shell00', modes: [0x18, 0x19] }], op24: 'else', pick: 'ai', variant: '7:0xef' },
      // L4 M6, the poison at 12: (7, 0x05) / (7, 0x3d) = 0xcfdfa4(e, 0 / 1) -> 0xd0a340 (variant 4 and the action number
      // +0x73e1 0x3d or 5, 0xd0a348..0xd0a368; 12.0 at 0xd0a36c); (7, 0x09) / (7, 0x0e) / (7, 0x1e) = 0xcfe2cc(e, 0 / 1 / 2),
      // L4 M5 then L4 M6 -> 0xd0a560 (number 9, 14 or 30: bits of 0x40004200, 0xd0a578..0xd0a594), and (7, 0x1e)'s second
      // L4 M6 (after L4 M10 and L4 M5 from 70) -> 0xd0a5c4 (number 0x1e); both 12.0. (7, 0x4a) = 0xd02058(e, 0): after L4
      // M18, L4 M19 and L4 M5 from 100, L4 M6 -> 0xd0b44c (number 0x4a, 0xd0b464..0xd0b470): passes 4.0. (7, 0x73) =
      // 0xcfdfa4(e, 2) and (7, 0x6d) = 0xcfe2cc(e, 7) reach the same helpers on L4 M6 with a number they refuse.
      { action: [7, 0x05], code: 0xcfdfa4, args: [0], list: '4', clip: 'Motion[6]', partners: [], spawns: [{ at: 0xd0a340, kind: 'poison', frames: [12.0] }], pick: 'ai', variant: '7:0x05' },
      { action: [7, 0x3d], code: 0xcfdfa4, args: [1], list: '4', clip: 'Motion[6]', partners: [], spawns: [{ at: 0xd0a340, kind: 'poison', frames: [12.0] }], pick: 'ai', variant: '7:0x3d' },
      { action: [7, 0x09], code: 0xcfe2cc, args: [0], list: '4', clip: 'Motion[6]', partners: [], spawns: [{ at: 0xd0a560, kind: 'poison', frames: [12.0] }], pick: 'ai', variant: '7:0x09' },
      { action: [7, 0x0e], code: 0xcfe2cc, args: [1], list: '4', clip: 'Motion[6]', partners: [], spawns: [{ at: 0xd0a560, kind: 'poison', frames: [12.0] }], pick: 'ai', variant: '7:0x0e' },
      { action: [7, 0x1e], code: 0xcfe2cc, args: [2], list: '4', clip: 'Motion[6]', partners: [], spawns: [{ at: 0xd0a560, kind: 'poison', frames: [12.0] }], pick: 'ai', variant: '7:0x1e' },
      { action: [7, 0x4a], code: 0xd02058, args: [0], list: '4', clip: 'Motion[6]', partners: [], spawns: [{ at: 0xd0b44c, kind: 'poison', frames: [4.0] }], op24: 'else', pick: 'ai', variant: '7:0x4a' },
      { action: [7, 0x73], code: 0xcfdfa4, args: [2], list: '4', clip: 'Motion[6]', partners: [], spawns: [], pick: 'ai', variant: '7:0x73' },
      { action: [7, 0x6d], code: 0xcfe2cc, args: [7], list: '4', clip: 'Motion[6]', partners: [], spawns: [], pick: 'ai', variant: '7:0x6d' },
      // L2 M13: (7, 0x4e) = 0xcff1b0(e, 1) -> 0xd0a818(e, 1): passes 82 -> shell01 mode 12, else 78 -> 11, else 74 -> 10
      // (0xd0a834 / 0xd0a924 / 0xd0aa10; literals 0xd0abc0..0xd0abc8; the G-rank modes 0x2b / 0x2a / 0x29 are em 2's); (7,
      // 0x11) = 0xcff1b0(e, 0): 0xd0a818 with r1 0 makes nothing (0xd0a82c)
      { action: [7, 0x4e], code: 0xcff1b0, args: [1], list: '2', clip: 'Motion[13]', partners: [], spawns: [{ at: 0xd0a818, kind: 'first', frames: [82.0, 78.0, 74.0], shell: 'shell01', modes: [12, 11, 10] }], pick: 'ai', variant: '7:0x4e' },
      { action: [7, 0x11], code: 0xcff1b0, args: [0], list: '2', clip: 'Motion[13]', partners: [], spawns: [], pick: 'ai', variant: '7:0x11' },
      // L9 M1: (1, 0xff) = 0xcf37ac (status 1's switch 0xcee720, number 0xff at 0xcee7f4): phase 0 setMotion 0x901, blend
      // 4.0; phase 1 -> 0xd09f28: passes 106 (0xd09f50) -> 0xd09b84(e, 0x10). L9 M2: (7, 0xff) = 0xd06e50 -> 0xd0c0b0:
      // passes 188 (0xd0c0d8) -> 0xd09b84(e, 0x10).
      { action: [1, 0xff], code: 0xcf37ac, args: [], list: '9', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd09f28, kind: 'poison', frames: [106.0] }], pick: 'ai', variant: '1:0xff' },
      { action: [7, 0xff], code: 0xd06e50, args: [], list: '9', clip: 'Motion[2]', partners: [], spawns: [{ at: 0xd0c0b0, kind: 'poison', frames: [188.0] }], pick: 'ai', variant: '7:0xff' },
      // L9 M4 / M5: (7, 0xed) / (7, 0xee) = 0xd041b0(e, 2 / 1) (L0 M7, L0 M8, then L9 M8 or M3 from 20, then L9 M4 and M5 in
      // turn: phases 6 / 7 at 0xd0424c / 0xd04270) and (7, 0xf8) = 0xd05014(e, 0, 0) (L9 M3, M4, M5, M7) -> 0xd0bf98 each
      // frame: passes 10 -> shell01 0x21, else 6 -> 0x20, else 2 -> 0x1f (0xd0bf9c..0xd0bfec), via 0xd09b84
      { action: [7, 0xed], code: 0xd041b0, args: [2], list: '9', clip: 'Motion[4]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xed' },
      { action: [7, 0xee], code: 0xd041b0, args: [1], list: '9', clip: 'Motion[4]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xee' },
      { action: [7, 0xf8], code: 0xd05014, args: [0, 0], list: '9', clip: 'Motion[4]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xf8' },
      { action: [7, 0xed], code: 0xd041b0, args: [2], list: '9', clip: 'Motion[5]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xed' },
      { action: [7, 0xee], code: 0xd041b0, args: [1], list: '9', clip: 'Motion[5]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xee' },
      { action: [7, 0xf8], code: 0xd05014, args: [0, 0], list: '9', clip: 'Motion[5]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xf8' },
      // L9 M7: (7, 0xef) = 0xd0454c / (7, 0xf0) = 0xd047ac / (7, 0xf1) = 0xd04a24: their L9 M7 phase passes tune float 0x18
      // (0xd04680 / 0xd048fc / 0xd04aa0) -> 0xd09e28(e, 0x15, 900.0) (literals 0xd04798 / 0xd04a14 / 0xd04bb8)
      { action: [7, 0xef], code: 0xd0454c, args: [], list: '9', clip: 'Motion[7]', partners: [], spawns: [{ at: 0xd09e28, kind: 'ground', tune: [0x18], mode: 0x15 }], op24: 'else', pick: 'ai', variant: '7:0xef' },
      { action: [7, 0xf0], code: 0xd047ac, args: [], list: '9', clip: 'Motion[7]', partners: [], spawns: [{ at: 0xd09e28, kind: 'ground', tune: [0x18], mode: 0x15 }], pick: 'ai', variant: '7:0xf0' },
      { action: [7, 0xf1], code: 0xd04a24, args: [], list: '9', clip: 'Motion[7]', partners: [], spawns: [{ at: 0xd09e28, kind: 'ground', tune: [0x18], mode: 0x15 }], pick: 'ai', variant: '7:0xf1' },
      // L9 M9: (7, 0xf2) = 0xd04bc4 -> 0xd0bc28: when 0x49930(e) >= 13 (0xd0bc30..0xd0bc3c), tune floats 0x1a / 0x1b / 0x1c
      // -> shell01 0x30 / 0x31 / 0x32, each on its own; then, always, tune float 0x13 -> 0x24 (0xd0be98..0xd0bf60)
      { action: [7, 0xf2], code: 0xd04bc4, args: [], list: '9', clip: 'Motion[9]', partners: [], spawns: [{ at: 0xd0bc28, kind: 'each', quest: 13, tune: [0x1a, 0x1b, 0x1c], shell: 'shell01', modes: [0x30, 0x31, 0x32] }, { at: 0xd0bc28, kind: 'each', tune: [0x13], shell: 'shell01', modes: [0x24] }], pick: 'ai', variant: '7:0xf2' },
    ],
    // em001_04_actiontune (enemy\action_tune; rFreeUseParam, 0 ints, 29 floats)
    tune: [50.0, 0.0, -1800.0, 1.8, 25.0, 3.0, 19.5, 0.0, 1.5, 1.5, 0.6, 20.0, 20.0, 54.0, 60.0, 50.0, 4.0, 24.0, 45.0, 122.0,
           600.0, 330.0, 0.5, 2.0, 50.0, -1000.0, 24.0, 26.0, 28.0],
    // THE POISON (0xd09b84(e, 0x10); poison001): the break row its mode reads -- em001_04_dtbparts.dtp (enemy\dt_base, the
    // .dtp at e+0x75f0) break row 4 (the +0x64 array, [[e+0x75f0]+0x64] + 0x10): part 7, level 2 at rank <= 4, 2 at rank > 4
    poison: { part: 7, levels: [2, 2] },
  },

  // DREADKING RATHALOS (em002_04): Rathian's class uEm001_00 with em byte +0xb5f4 = 2, variant +0xb5f5 = 4. 0xd09918
  // keeps the global shells 0x59 / 0x5f / 0x64 at enemy +0xcac4 / +0xcac8 / +0xcacc (0xd09a00..0xd09a1c); table
  // 0x175c3e8 names Rathian's classes for them (uShellEm001_sp_00 / sp_01 / sp_11) with this monster's .shl (resources
  // 0x89ac / 0x89b2 / 0x89b7). Values: the files' own, C:\MHGU-Extract\scratch-em\em002_04\em002_04.arc,
  // shell\em\em002_04_shellNN (ShellInfoList 38 / 56 / 1, ShellScale 1.0).
  em002_04: {
    name: 'Dreadking Rathalos',
    em: 2, variant: 4,                               // enemy +0xb5f4 / +0xb5f5
    // every em002_04 .shl (shell00, shell01) names EffectLists[0] = effect\pel\em\em002_00c (Rathalos's c.pel) and [1] =
    // effect\pel\em\em002_04u (its own u.pel), the rest null (the XFS arrays at 0x217d / 0x2fbd); shell11's are all null
    lists: { 0: { list: 'c', pel: 'em002_00c' }, 1: { list: 'u', pel: 'em002_04u' } },
    shells: {
      // THE FIREBALLS (uShellEm001_sp_00, base00). The Rathalos modes 0 / 4 / 12..23 (13, 14, 16..22 unaimed; 12 / 15 aimed,
      // 23 aimed on X and Y: flags 1 | 2), and this monster's 26..36: 26..28 / 29 / 30 / 33 in the landing's mask with u 20
      // / c 20, 31 (u 10; its landing makes shell01 27 / 17), 34..36 (u 200 / u 10; their landings shell01 29 / 52 / 54).
      // 29 (0x1d) is this monster's own fireball on L2 M5, L4 M22 and L4 M29, 30 (0x1e) on L2 M18 (the em-2 variant-4
      // branch of each spawn helper); of the Rathalos modes it throws only 21 (the take-off) and 23 (L4 M45).
      shell00: {
        id: 0x59, cls: 'uShellEm001_sp_00', base: 'base00', folder: 'shell\\em\\em002_04_shell00', reader: 0xd0d988,
        modes: {
          0: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -45.0, 45.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 200.0, 200.0]] } },
          4: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, 0.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 260.0, 400.0]] } },
          12: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -30.0, 50.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 400.0, 100.0]] } },
          13: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          14: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 50.0, 216.0, 10.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 50.0, 350.0]] } },
          16: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          17: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [43.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          18: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [43.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          19: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          21: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          22: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [30.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          23: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, 0, 0, -1, -1, -1], floats: [0.0, 0.0, 50.0, 216.0, -70.0, 70.0, 50.0, 30.0, 150.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 500.0]] } },
          26: { scale: 1.0, ef: [[1, 20], [1, 36], [1, 31], [1, 36]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [40.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          27: { scale: 1.0, ef: [[1, 20], [1, 36], [1, 31], [1, 36]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [20.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          28: { scale: 1.0, ef: [[1, 20], [1, 36], [1, 31], [1, 36]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [10.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          29: { scale: 1.0, ef: [[1, 20], [1, 22], [1, -1], [1, 22]], hit: [2],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 65.0, 180.0, -45.0, 45.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 200.0, 200.0]] } },
          30: { scale: 1.0, ef: [[1, 20], [1, 22], [1, 21], [1, 22]], hit: [2],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 65.0, 180.0, 0.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 260.0, 400.0]] } },
          31: { scale: 1.0, ef: [[1, 10], [1, 12], [1, 12], [1, 12]], hit: [3],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -30.0, 50.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 400.0, 100.0]] } },
          32: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [40.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          33: { scale: 1.0, ef: [[0, 20], [0, 22], [0, -1], [0, 22]], hit: [2],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [30.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          34: { scale: 1.0, ef: [[1, 200], [1, 202], [1, 202], [1, 202]], hit: [3],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [12.0, -55.0, 80.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          35: { scale: 1.0, ef: [[1, 10], [1, 202], [1, 202], [1, 202]], hit: [3],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [20.0, 0.0, 50.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          36: { scale: 1.0, ef: [[1, 200], [1, 202], [1, 202], [1, 202]], hit: [3],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [5.5, 39.0, 90.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
      },
      // GROUND FIRE, EXPLOSIONS, DUST, PUFFS, HIT VOLUMES, FIRE FIELDS (uShellEm001_sp_01, base01; params011). Rathian's 1,
      // 2, 13..15; 6..9 (the explosions, snapped with the ground's angles: flags 4 | 8); 3..5 / 38..40 (L2 M1), 10..12 (L2
      // M13), 31..33 (L9 M4 / M5) on joint 4; 17 / 27 / 29 / 52 / 54 (mode 31 / 34..36's landings: snapped, timer 300 /
      // 300 / 320 / 314 / 220, flag 0x100) and 18 / 28 / 30 / 53 / 55 (their end creates, 0xd0eb20); 19 (mode 32's
      // landing: a hit volume).
      shell01: {
        id: 0x5f, cls: 'uShellEm001_sp_01', base: 'base01', folder: 'shell\\em\\em002_04_shell01', reader: 0xd0e6a0,
        modes: {
          0: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [8, -1],
             sh: { ints: [0, 3, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 190.0]] } },
          1: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [0, 2],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 3], [999, -1]], hit: [7, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [200.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          3: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [9, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          4: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [10, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          5: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [10, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          6: { scale: 1.0, ef: [[1, 31], [999, -1]], hit: [3, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          7: { scale: 1.0, ef: [[1, 32], [999, -1]], hit: [4, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          8: { scale: 1.0, ef: [[1, 33], [999, -1]], hit: [5, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[1, 34], [999, -1]], hit: [6, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          10: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-100.0, -20.0, 80.0]] } },
          11: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[80.0, 0.0, 100.0]] } },
          12: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[200.0, -130.0, 100.0]] } },
          13: { scale: 1.0, ef: [[0, 30], [999, -1]], hit: [-1, 12],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 100.0]] } },
          14: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 13],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 14],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          17: { scale: 1.0, ef: [[1, 25], [999, -1]], hit: [-1, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, 0, -1, -1], floats: [300.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          18: { scale: 1.0, ef: [[1, 11], [999, -1]], hit: [16, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 50.0, 6.0], vecs: [[0.0, 0.0, 0.0]] } },
          19: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [18, -1],
              sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 17],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          27: { scale: 1.0, ef: [[1, 13], [999, -1]], hit: [-1, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, 0, -1, -1], floats: [300.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          28: { scale: 1.0, ef: [[1, 23], [999, -1]], hit: [20, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 40.0, 5.0], vecs: [[0.0, 0.0, 0.0]] } },
          29: { scale: 1.0, ef: [[1, 206], [999, -1]], hit: [-1, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, 0, -1, -1], floats: [320.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          30: { scale: 1.0, ef: [[1, 201], [999, -1]], hit: [24, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 15.0, 5.0], vecs: [[0.0, 0.0, 0.0]] } },
          31: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [9, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, -200.0, 150.0]] } },
          32: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [10, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, -150.0, 150.0]] } },
          33: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [10, -1],
              sh: { ints: [0, 4, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, -100.0, 100.0]] } },
          38: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [21, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          39: { scale: 1.0, ef: [[1, 61], [999, -1]], hit: [22, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          40: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [22, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, -200.0, 200.0]] } },
          41: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [23, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-100.0, -20.0, 80.0]] } },
          42: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [23, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[80.0, 0.0, 100.0]] } },
          43: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [23, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[200.0, -130.0, 100.0]] } },
          52: { scale: 1.0, ef: [[1, 203], [999, -1]], hit: [-1, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, 0, -1, -1], floats: [314.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          53: { scale: 1.0, ef: [[1, 204], [999, -1]], hit: [25, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 15.0, 5.0], vecs: [[0.0, 0.0, 0.0]] } },
          54: { scale: 1.0, ef: [[1, 206], [999, -1]], hit: [-1, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, 0, -1, -1], floats: [220.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          55: { scale: 1.0, ef: [[1, 205], [999, -1]], hit: [24, -1],
              sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [0.0, 15.0, 5.0], vecs: [[0.0, 0.0, 0.0]] } },
        },
        // em002_04_01_hitdata (HDS, 26 records): (s16 +0 delay, s16 +2 duration) by record, for input.hitLife
        hitdata: [[10, 10], [10, 10], [0, 10], [10, 20], [6, 16], [6, 16], [6, 16], [8, 172], [6, 5], [0, 10], [0, 10],
                  [0, 10], [14, 10], [14, 10], [14, 10], [0, 30], [0, 80], [14, 10], [10, 10], [0, 30], [0, 60], [2, 10],
                  [2, 10], [2, 10], [0, 30], [0, 30]],
      },
      // THE EXPLOSION TIMER (uShellEm001_sp_11, base11): this monster's times 0 / 12 / 24 / 36 and offsets
      shell11: {
        id: 0x64, cls: 'uShellEm001_sp_11', base: 'base11', folder: 'shell\\em\\em002_04_shell11', reader: 0xd0ee8c,
        modes: {
          0: { scale: 1.0, ef: [], hit: [],
             sh: { ints: [], floats: [0.0, 12.0, 24.0, 36.0], vecs: [[0.0, 0.0, -100.0], [250.0, 0.0, 100.0], [-250.0, 0.0, 180.0], [0.0, 0.0, 350.0]] } },
        },
        times: [0, 1, 2, 3], vecIdx: [0, 1, 2, 3], modes01: [6, 7, 8, 9],
      },
    },
    // THE ACTIONS. Rathian's hover turns and dust rows are this monster's (after this table); its fire actions are its
    // own: the same case bodies and spawn helpers, whose em-2 variant-4 branches pick this monster's modes, on the clips
    // its lists have (L2 = em001_00_2.lmt; L4 / L9 = em002_04_4 / _9.lmt: the Rathalos slots -- no L4 M8 / M16 / M65).
    // Read to their helpers and run on the ROM (arun.py: every drawing create below at its frame). `spawns` as the
    // siblings' ('first': one shell, the first passing test in the listed order). Not listed: (7, 0x42) shell00 9..11 and
    // (7, 0x4a) / (7, 0x5a) / (7, 0x5b) / (7, 0xef) 24 / 25 (L4 M18), (7, 0x70) 37 (L4 M38 from frame 70), (1, 0xff) shell01
    // 16 (L9 M1 f106, 0xd09b84's poison): made and deleted by their init, this monster's files having no such modes;
    // (7, 0xef) / (7, 0xf0) / (7, 0xf1)'s L9 M7 dust (shell01 21) and (7, 0xf2)'s L9 M9 shells (36, 48..50): their frames
    // are actiontune floats 24 (0x6f618(e, 0x18) at 0xd04680 / 0xd048fc / 0xd04aa0) and 19 / 26..28, 0.0 past the end of
    // this monster's six (0x3cb330), a frame their motions never pass -- nothing made (and no files either). The other
    // actions that make shells play clips its lists do not have (L4 M5 / M6 / M8 / M16 / M65). The op24 marks: the
    // command table's op-0x24 branch of every called site (op24.py).
    actions: [
      // L2 M5 / M18: (7, 0x02) / (7, 0x0f) = 0xcfddec(e, 0 / 1) and (7, 0x0a) / (7, 0x0b) = 0xcfef64(e, 0 / 1), as Rathian's
      // (the blend partners too); 0xd0a134 makes shell00 0x1d for em 2 variant 4 (0xd0a200..0xd0a244, else 0), 0xd0a614
      // 0x1e (0xd0a6e0..0xd0a724, else 4). For em 2 variant 4, 0xcfddec also turns the monster in phase 1 (0xcfde84..0xcfde90:
      // NOT READ, input.owner.y).
      { action: [7, 0x02], code: 0xcfddec, args: [0], list: '2', clip: 'Motion[5]', partners: ['Motion[15]', 'Motion[16]'], spawner: 0xd0a134, spawnArgs: [0], frames: [78.0], shell: 'shell00', modes: [0x1d], op24: 'else', pick: 'ai', variant: '7:0x02' },
      { action: [7, 0x0f], code: 0xcfddec, args: [1], list: '2', clip: 'Motion[5]', partners: ['Motion[15]', 'Motion[16]'], spawner: 0xd0a134, spawnArgs: [1], frames: [78.0], shell: 'shell01', modes: [0], op24: 'if', pick: 'ai', variant: '7:0x0f' },
      { action: [7, 0x0a], code: 0xcfef64, args: [0], list: '2', clip: 'Motion[18]', partners: ['Motion[17]'], spawner: 0xd0a614, spawnArgs: [0], frames: [80.0], shell: 'shell00', modes: [0x1e], op24: 'else', pick: 'ai', variant: '7:0x0a' },
      { action: [7, 0x0b], code: 0xcfef64, args: [1], list: '2', clip: 'Motion[18]', partners: ['Motion[17]'], spawner: 0xd0a614, spawnArgs: [1], frames: [80.0], shell: 'shell01', modes: [0], op24: 'if', pick: 'ai', variant: '7:0x0b' },
      // L2 M1 / M13: as the siblings' (0xd0a074 / 0xd0ba2c; 0xd0a818, whose G-rank 0x29..0x2b are em 2 variant 1 / 2's only)
      { action: [7, 0x4d], code: 0xcfd770, args: [1], list: '2', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0a074, kind: 'first', frames: [74.0, 69.0, 64.0], shell: 'shell01', modes: [5, 4, 3], modesG: [0x28, 0x27, 0x26] }], pick: 'ai', variant: '7:0x4d' },
      { action: [7, 0x75], code: 0xd03b60, args: [1], list: '2', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0ba2c, kind: 'first', frames: [74.0, 69.0, 64.0], shell: 'shell01', modes: [5, 4, 3], modesG: [0x28, 0x27, 0x26] }], pick: 'ai', variant: '7:0x75' },
      { action: [7, 0x00], code: 0xcfd770, args: [0], list: '2', clip: 'Motion[1]', partners: [], spawns: [], pick: 'ai', variant: '7:0x00' },
      { action: [7, 0x74], code: 0xd03b60, args: [0], list: '2', clip: 'Motion[1]', partners: [], spawns: [], pick: 'ai', variant: '7:0x74' },
      { action: [7, 0x4e], code: 0xcff1b0, args: [1], list: '2', clip: 'Motion[13]', partners: [], spawns: [{ at: 0xd0a818, kind: 'first', frames: [82.0, 78.0, 74.0], shell: 'shell01', modes: [12, 11, 10] }], pick: 'ai', variant: '7:0x4e' },
      { action: [7, 0x11], code: 0xcff1b0, args: [0], list: '2', clip: 'Motion[13]', partners: [], spawns: [], pick: 'ai', variant: '7:0x11' },
      // L4 M22: (7, 0x23) / (7, 0x2e) = 0xd00118(e, 0, 0 / 1) -> 0xd0ac20: passes 82 (0xd0adfc) -> shell00 0x1d for em 2
      // variant 4 (0xd0ad20..0xd0ad34; else 0xc); (7, 0x30) / (7, 0x41) = 0xd00118(e, 1, 0 / 1): shell01 0 (the hit volume)
      { action: [7, 0x23], code: 0xd00118, args: [0, 0], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1d] }], op24: 'else', pick: 'ai', variant: '7:0x23' },
      { action: [7, 0x2e], code: 0xd00118, args: [0, 1], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1d] }], op24: 'else', pick: 'ai', variant: '7:0x2e' },
      { action: [7, 0x30], code: 0xd00118, args: [1, 0], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x30' },
      { action: [7, 0x41], code: 0xd00118, args: [1, 1], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x41' },
      // L4 M29 (after L4 M28), THE SHOTS: 0xd004cc(e, r1, r2, r3) -> 0xd0ae28 at frame 40 (0xd0b08c) -> shell00 0x1d for
      // em 2 variant 4 (0xd0af84..0xd0af98; the other variants take the mode by r1 and P+0x1a2, 0xd0af04..0xd0af50), or
      // shell01 0 with r2 1. The phase plays the clip, which loops at its frame 0, and repeats while P+0x1a2 -- zeroed at
      // the phase's start (0xd005fc), raised after each create (0xd0b054..0xd0b064) -- is under the action's count (table
      // 0x15927f8[r1 - 1] = 3 / 1 / 3 / 3 for r1 1..4, else 1: 0xd00610..0xd00630, 0xd00710..0xd0071c), so `modes` is one
      // entry per shot (ROM-run with the clip looping). (7, 0x27) / (7, 0x28) / (7, 0x33) / (7, 0x34) sit in streams no op
      // 0x14 calls (who issues them: NOT READ).
      { action: [7, 0x24], code: 0xd004cc, args: [0, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x1d] }], op24: 'else', pick: 'ai', variant: '7:0x24' },
      { action: [7, 0x26], code: 0xd004cc, args: [1, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x1d, 0x1d, 0x1d] }], op24: 'else', pick: 'ai', variant: '7:0x26' },
      { action: [7, 0x27], code: 0xd004cc, args: [2, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x1d] }], pick: 'ai', variant: '7:0x27' },
      { action: [7, 0x28], code: 0xd004cc, args: [3, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x1d, 0x1d, 0x1d] }], pick: 'ai', variant: '7:0x28' },
      { action: [7, 0x3b], code: 0xd004cc, args: [4, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x1d, 0x1d, 0x1d] }], op24: 'else', pick: 'ai', variant: '7:0x3b' },
      { action: [7, 0x65], code: 0xd004cc, args: [6, 0, 1], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x1d] }], pick: 'ai', variant: '7:0x65' },
      { action: [7, 0x67], code: 0xd004cc, args: [0, 0, 1], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x1d] }], pick: 'ai', variant: '7:0x67' },
      { action: [7, 0x31], code: 0xd004cc, args: [0, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x31' },
      { action: [7, 0x32], code: 0xd004cc, args: [1, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], op24: 'if', pick: 'ai', variant: '7:0x32' },
      { action: [7, 0x33], code: 0xd004cc, args: [2, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0] }], pick: 'ai', variant: '7:0x33' },
      { action: [7, 0x34], code: 0xd004cc, args: [3, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], pick: 'ai', variant: '7:0x34' },
      { action: [7, 0x3c], code: 0xd004cc, args: [4, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], op24: 'if', pick: 'ai', variant: '7:0x3c' },
      // L4 M32 (the take-off, after L4 M31): 0xcf3ff0(e, r1, r2, r3) -> 0xd0c0dc(e, kind, sub): passes 6 (0xd0c0fc / 0xd0c1ac)
      // -> kind 1 / 2: shell00 0x20 with sub 1 (0xd0c158), else 0x15 (0xd0c32c); kind 5 / 6: 0x21 for variant 4
      // (0xd0c1c0..0xd0c1f8, else 0x16); kind 3 / 4: shell01 0 (0xd0c244). (9, 3) / (9, 4) = status 9's 0xcee4e4 / 0xcee4f4.
      { action: [7, 0x03], code: 0xcf3ff0, args: [0, 1, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x03' },
      { action: [7, 0x29], code: 0xcf3ff0, args: [1, 1, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], pick: 'ai', variant: '7:0x29' },
      { action: [7, 0x2b], code: 0xcf3ff0, args: [0, 2, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x2b' },
      { action: [7, 0x2c], code: 0xcf3ff0, args: [1, 2, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x2c' },
      { action: [7, 0x48], code: 0xcf3ff0, args: [1, 5, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x21] }], op24: 'else', pick: 'ai', variant: '7:0x48' },
      { action: [7, 0x49], code: 0xcf3ff0, args: [1, 6, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x21] }], op24: 'else', pick: 'ai', variant: '7:0x49' },
      { action: [9, 0x03], code: 0xcf3ff0, args: [0, 1, 1], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x20] }], pick: 'ai', variant: '9:0x03' },
      { action: [7, 0x35], code: 0xcf3ff0, args: [0, 3, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x35' },
      { action: [7, 0x36], code: 0xcf3ff0, args: [1, 3, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x36' },
      { action: [7, 0x37], code: 0xcf3ff0, args: [0, 4, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x37' },
      { action: [7, 0x38], code: 0xcf3ff0, args: [1, 4, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x38' },
      { action: [9, 0x04], code: 0xcf3ff0, args: [0, 3, 1], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], pick: 'ai', variant: '9:0x04' },
      // L4 M38: (7, 0x43) / (7, 0x45) / (7, 0x46) = 0xd01b70(e, 0 / 1 / 2) -> 0xd0b364: passes 82 (0xd0b438) -> shell00 0x1a /
      // 0x1b / 0x1c; (7, 0xf5) = 0xd04edc: passes 82 (0xb0968 at 0xd04fc0, literal 0xd0500c) -> 0xd0bff0: shell00 0x1f
      { action: [7, 0x43], code: 0xd01b70, args: [0], list: '4', clip: 'Motion[38]', partners: [], spawns: [{ at: 0xd0b364, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1a] }], op24: 'else', pick: 'ai', variant: '7:0x43' },
      { action: [7, 0x45], code: 0xd01b70, args: [1], list: '4', clip: 'Motion[38]', partners: [], spawns: [{ at: 0xd0b364, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1b] }], pick: 'ai', variant: '7:0x45' },
      { action: [7, 0x46], code: 0xd01b70, args: [2], list: '4', clip: 'Motion[38]', partners: [], spawns: [{ at: 0xd0b364, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1c] }], op24: 'else', pick: 'ai', variant: '7:0x46' },
      { action: [7, 0xf5], code: 0xd04edc, args: [], list: '4', clip: 'Motion[38]', partners: [], spawns: [{ at: 0xd0bff0, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1f] }], op24: 'else', pick: 'ai', variant: '7:0xf5' },
      // L4 M18: (7, 0xec) / (7, 0xf9) = 0xd054c8(e, 1 / 0): phase 0 setMotion 0x412; phases 1..3 pass 116 / 168 / 226
      // (literals 0xd058d0 / 0xd058c8 / 0xd058bc), each then 0xd09acc(e, 0x22 / 0x23 / 0x24): shell00 34 / 35 / 36
      { action: [7, 0xec], code: 0xd054c8, args: [1], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd09acc, kind: 'seq', frames: [116.0, 168.0, 226.0], shell: 'shell00', modes: [0x22, 0x23, 0x24] }], op24: 'else', pick: 'ai', variant: '7:0xec' },
      { action: [7, 0xf9], code: 0xd054c8, args: [0], list: '4', clip: 'Motion[18]', partners: [], spawns: [{ at: 0xd09acc, kind: 'seq', frames: [116.0, 168.0, 226.0], shell: 'shell00', modes: [0x22, 0x23, 0x24] }], pick: 'ai', variant: '7:0xf9' },
      // L4 M45: (3, 0x4d) = status 3's 0xcef548 -> 0xcf5210(e, 0xa, 1) -> 0xd09f54: passes 44 (0xd0a060) -> shell00 0x17
      { action: [3, 0x4d], code: 0xcf5210, args: [0xa, 1], list: '4', clip: 'Motion[45]', partners: [], spawns: [{ at: 0xd09f54, kind: 'first', frames: [44.0], shell: 'shell00', modes: [0x17] }], pick: 'ai', variant: '3:0x4d' },
      // L9 M1: (7, 0xfa) = 0xd058d4 / (7, 0xfb) = 0xd05a40, phase 1: at the MOTION'S END -- 0xb09c8(e) (0x94dc04: bit 2 of
      // byte e+0x4b6, the motion's ended flag; not a frame test) at 0xd05950 / 0xd05ab0 -- setMotion 0x902 and 0xd0bff0
      // (0xd05a14 / 0xd05b14): shell00 0x1f. `atEnd` with the clip's last frame, 126 (em002_04_9.lmt's L9 M1 is 127
      // frames): a play that runs to its end passes it like any other frame, a looping one takes endWrap001's path.
      { action: [7, 0xfa], code: 0xd058d4, args: [], list: '9', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0bff0, kind: 'first', atEnd: true, frames: [126.0], shell: 'shell00', modes: [0x1f] }], op24: 'else', pick: 'ai', variant: '7:0xfa' },
      { action: [7, 0xfb], code: 0xd05a40, args: [], list: '9', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0bff0, kind: 'first', atEnd: true, frames: [126.0], shell: 'shell00', modes: [0x1f] }], pick: 'ai', variant: '7:0xfb' },
      // L9 M4 / M5: as Dreadqueen's (0xd0bf98: 10 / 6 / 2 -> shell01 0x21 / 0x20 / 0x1f), and (7, 0xf6) / (7, 0xf7) =
      // 0xd05014(e, 1, 2 / 1), which start on L9 M14 / M12 (em002_04_9.lmt has them) and turn to L9 M5 / M4
      { action: [7, 0xed], code: 0xd041b0, args: [2], list: '9', clip: 'Motion[4]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xed' },
      { action: [7, 0xee], code: 0xd041b0, args: [1], list: '9', clip: 'Motion[4]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xee' },
      { action: [7, 0xf6], code: 0xd05014, args: [1, 2], list: '9', clip: 'Motion[4]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xf6' },
      { action: [7, 0xf7], code: 0xd05014, args: [1, 1], list: '9', clip: 'Motion[4]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xf7' },
      { action: [7, 0xf8], code: 0xd05014, args: [0, 0], list: '9', clip: 'Motion[4]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xf8' },
      { action: [7, 0xed], code: 0xd041b0, args: [2], list: '9', clip: 'Motion[5]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xed' },
      { action: [7, 0xee], code: 0xd041b0, args: [1], list: '9', clip: 'Motion[5]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xee' },
      { action: [7, 0xf6], code: 0xd05014, args: [1, 2], list: '9', clip: 'Motion[5]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xf6' },
      { action: [7, 0xf7], code: 0xd05014, args: [1, 1], list: '9', clip: 'Motion[5]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xf7' },
      { action: [7, 0xf8], code: 0xd05014, args: [0, 0], list: '9', clip: 'Motion[5]', partners: [], spawns: [{ at: 0xd0bf98, kind: 'first', frames: [10.0, 6.0, 2.0], shell: 'shell01', modes: [0x21, 0x20, 0x1f] }], pick: 'ai', variant: '7:0xf8' },
    ],
    // THE FLIGHT DUST: the per-frame handler's own bodies for L4 M25 / M26 / M27 (0x419 / 0x41a / 0x41b, its table 0xcf1b90),
    // clips Rathian's lists do not have: 0xcf1f74 (the posture only), 0xcf1f30 (0xb09a4(e, 1, 0, 70.0) == 1: cur >= 70),
    // 0xcf1f54 (0xb09a4(e, 1, 0, 38.0) == 0: cur < 38), each then posture P+0x1ba == 3 -> 0xcf2424, the period dust of
    // Rathian's L2 M12 row (shell01 mode 15 every 16 frames at the owner's ground). Rathian's rows follow (the share below).
    dust: [
      { ids: [0x419], at: 0xcf1f74, period: 16.0, posture: 3, mode: 15 },
      { ids: [0x41a], at: 0xcf1f30, period: 16.0, from: 70.0, posture: 3, mode: 15 },
      { ids: [0x41b], at: 0xcf1f54, period: 16.0, until: 38.0, posture: 3, mode: 15 },
    ],
    // P+0x1ba while they play: 3. Every action that plays them sets it first and not again until it leaves them:
    // 0xbc7f4(e, 3) at 0xcfd8fc before L4 M26 (0xcfd910), then L4 M25 (0xcfdb70) / L4 M27 (0xcfdc4c); at 0xcff7d8 before
    // L2 M11 (the em-2 path of 0xcff66c), then L4 M25 (0xcff8f0) / L4 M27 (0xcffbdc); at 0xd02ad8 before L4 M26 (0xd02ae8),
    // then L4 M25 (0xd02d50). A landing sets 0 with its own clip (0xcfdc14 -> L4 M37). ROM-run (the actions of every clip:
    // dk\posture_probe.py): posture 3 on every frame of these three clips.
    postures: { '4|Motion[25]': 3, '4|Motion[26]': 3, '4|Motion[27]': 3 },
  },

  // RATHALOS (em002_00): Rathian's class uEm001_00 with em byte +0xb5f4 = 2, variant +0xb5f5 = 0. 0xd09918 keeps the
  // global shells 0x57 / 0x5d / 0x19d at enemy +0xcac4 / +0xcac8 / +0xcacc (0xd09994..0xd099b0); table 0x175c3e8 names
  // Rathian's classes for the first two (uShellEm001_sp_00 / sp_01) with this monster's .shl (resources 0x89aa / 0x89b0).
  // 0x19d, the explosion timer's id, has no entry there and no .shl in the .arc -- and no mode of its shell00 is in the
  // landing's mask (0x227f000f over mode - 8: modes 8..11, 24..30, 33, 37), the only thing that makes one, so it never
  // does. Values: the files' own, C:\MHGU-Extract\scratch-em\em002_00\em002_00.arc, shell\em\em002_00_shellNN
  // (ShellInfoList 15 / 11, ShellScale 1.0).
  em002_00: {
    name: 'Rathalos',
    em: 2, variant: 0,                               // enemy +0xb5f4 / +0xb5f5
    // both em002_00 .shl files name EffectLists[0] = effect\pel\em\em002_00c and [1] = effect\pel\em\em002_00u, the rest
    // null (as its siblings': the c list is this family's, the u list the monster's own)
    lists: { 0: { list: 'c', pel: 'em002_00c' }, 1: { list: 'u', pel: 'em002_00u' } },
    shells: {
      // THE FIREBALLS (uShellEm001_sp_00, base00; Rathian's shell00 notes apply). Modes 0 / 4 (L2 M5 / M18, as Rathian's
      // 0 / 4: aimed, flags 1), 12 (L4 M22, aimed), 13..20 (L4 M29's shots, unaimed: X 30..50 degrees), 15 (aimed), 21 /
      // 22 (the take-off, unaimed) and 32 ((9, 3)'s, unaimed), 23 (L4 M45, aimed on X and Y: flags 1 | 2). None is in the
      // landing's mask, so every landing takes the plain path (shell01 1 and the ground fire 2; mode 32 also 19).
      shell00: {
        id: 0x57, cls: 'uShellEm001_sp_00', base: 'base00', folder: 'shell\\em\\em002_00_shell00', reader: 0xd0d988,
        modes: {
          0: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -45.0, 45.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 200.0, 200.0]] } },
          4: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, 0.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 260.0, 400.0]] } },
          12: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -30.0, 50.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 400.0, 100.0]] } },
          13: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          14: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 50.0, 216.0, 10.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 50.0, 350.0]] } },
          16: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          17: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [43.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          18: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [43.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          19: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          21: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [40.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          22: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [30.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          23: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, 0, 0, -1, -1, -1], floats: [0.0, 0.0, 50.0, 216.0, -70.0, 70.0, 50.0, 30.0, 150.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 500.0]] } },
          32: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [40.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
        // em002_00_00_hitdata (HDS, 2 records)
        hitdata: [[0, 99], [0, 99]],
      },
      // GROUND FIRE, DUST, PUFFS, HIT VOLUMES (uShellEm001_sp_01, base01; params011). Rathian's 1 (the landing's), 2 (the
      // ground fire), 13..15 (the hover / flight dust) and 19 / 20 (mode 32's landing and the L4 M17 dust); 10..12 are
      // this monster's L2 M13 puffs on joint 4; 0 is the no-fire actions' hit volume, which draws nothing. Its 3..9 and
      // 38..40 (Rathian's explosion and L2 M1 puff modes) have no files here: the L2 M1 puffs its code makes are deleted
      // by their init, so that clip draws nothing.
      shell01: {
        id: 0x5d, cls: 'uShellEm001_sp_01', base: 'base01', folder: 'shell\\em\\em002_00_shell01', reader: 0xd0e6a0,
        modes: {
          0: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [8, -1],
             sh: { ints: [0, 3, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 190.0]] } },
          1: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [0, 2],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 3], [999, -1]], hit: [7, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [200.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          10: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-100.0, -20.0, 80.0]] } },
          11: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[80.0, 0.0, 100.0]] } },
          12: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[200.0, -130.0, 100.0]] } },
          13: { scale: 1.0, ef: [[0, 30], [999, -1]], hit: [-1, 12],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 100.0]] } },
          14: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 13],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 14],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          19: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [16, -1],
              sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 15],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
        },
        // em002_00_01_hitdata (HDS, 17 records): (s16 +0 delay, s16 +2 duration) by record, for input.hitLife
        hitdata: [[10, 10], [10, 10], [0, 10], [10, 20], [6, 16], [6, 16], [6, 16], [8, 172], [6, 5], [2, 10], [2, 10],
                  [0, 10], [14, 10], [14, 10], [14, 10], [14, 10], [10, 10]],
      },
    },
    // THE ACTIONS. Rathian's hover turns and dust rows are this monster's too (after this table), with its own flight dust
    // rows; its fire actions are its own -- the same case bodies and spawn helpers as its siblings', whose em / variant
    // branches give em 2 variant 0 these modes, on the clips its lists have (L2 = em001_00_2.lmt; L4 = em002_00_4.lmt:
    // the Rathalos slots, no L4 M8 / M16 / M18 / M38 / M65 and no list 9). Read to their helpers and run on the ROM
    // (arun.py: every drawing create below at its frame). Not listed: L2 M1's puffs ((7, 0x4d) / (7, 0x75) -> shell01
    // 5 / 4 / 3, G rank 0x28 / 0x27 / 0x26, and their no-fire twins (7, 0x00) / (7, 0x74)) -- em002_00_01 has no such
    // modes, so the shells the ROM makes there read -1 / 0.0 / the zero vector, start nothing and end at their first
    // move: that clip draws nothing. The op24 marks: the command table's op-0x24 branch of every called site (op24.py,
    // and the check's --emc pass).
    actions: [
      // L2 M5 / M18: (7, 0x02) / (7, 0x0f) = 0xcfddec(e, 0 / 1) and (7, 0x0a) / (7, 0x0b) = 0xcfef64(e, 0 / 1), as
      // Rathian's (the blend partners too); 0xd0a134 makes shell00 0 for em 2 variant 0 (its em-2 variant-4 branch
      // 0xd0a200..0xd0a244 is Dreadking's), 0xd0a614 mode 4 (0xd0a6e0..0xd0a724 likewise)
      { action: [7, 0x02], code: 0xcfddec, args: [0], list: '2', clip: 'Motion[5]', partners: ['Motion[15]', 'Motion[16]'], spawner: 0xd0a134, spawnArgs: [0], frames: [78.0], shell: 'shell00', modes: [0], op24: 'else', pick: 'ai', variant: '7:0x02' },
      { action: [7, 0x0f], code: 0xcfddec, args: [1], list: '2', clip: 'Motion[5]', partners: ['Motion[15]', 'Motion[16]'], spawner: 0xd0a134, spawnArgs: [1], frames: [78.0], shell: 'shell01', modes: [0], op24: 'if', pick: 'ai', variant: '7:0x0f' },
      { action: [7, 0x0a], code: 0xcfef64, args: [0], list: '2', clip: 'Motion[18]', partners: ['Motion[17]'], spawner: 0xd0a614, spawnArgs: [0], frames: [80.0], shell: 'shell00', modes: [4], op24: 'else', pick: 'ai', variant: '7:0x0a' },
      { action: [7, 0x0b], code: 0xcfef64, args: [1], list: '2', clip: 'Motion[18]', partners: ['Motion[17]'], spawner: 0xd0a614, spawnArgs: [1], frames: [80.0], shell: 'shell01', modes: [0], op24: 'if', pick: 'ai', variant: '7:0x0b' },
      // L2 M13: (7, 0x4e) / (7, 0x11) = 0xcff1b0(e, 1 / 0) -> 0xd0a818: its G-rank puffs 0x29..0x2b are em 2 variants
      // 1 / 2 only (0xd0a864 / 0xd0a950 / 0xd0aa3c), so this monster throws 12 / 11 / 10 at either rank
      { action: [7, 0x4e], code: 0xcff1b0, args: [1], list: '2', clip: 'Motion[13]', partners: [], spawns: [{ at: 0xd0a818, kind: 'first', frames: [82.0, 78.0, 74.0], shell: 'shell01', modes: [12, 11, 10] }], pick: 'ai', variant: '7:0x4e' },
      { action: [7, 0x11], code: 0xcff1b0, args: [0], list: '2', clip: 'Motion[13]', partners: [], spawns: [], pick: 'ai', variant: '7:0x11' },
      // L4 M22: (7, 0x23) / (7, 0x2e) = 0xd00118(e, 0, 0 / 1) -> 0xd0ac20: passes 82 (0xd0adfc) -> shell00 0xc
      // (0xd0ad20..0xd0ad34 is the em-2 variant-4 branch); (7, 0x30) / (7, 0x41) = 0xd00118(e, 1, 0 / 1): shell01 0
      { action: [7, 0x23], code: 0xd00118, args: [0, 0], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0xc] }], op24: 'else', pick: 'ai', variant: '7:0x23' },
      { action: [7, 0x2e], code: 0xd00118, args: [0, 1], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0xc] }], op24: 'else', pick: 'ai', variant: '7:0x2e' },
      { action: [7, 0x30], code: 0xd00118, args: [1, 0], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x30' },
      { action: [7, 0x41], code: 0xd00118, args: [1, 1], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x41' },
      // L4 M29 (after L4 M28), THE SHOTS: 0xd004cc(e, r1, r2, r3) -> 0xd0ae28 at frame 40 (0xd0b08c). The phase plays the
      // clip, which loops at its frame 0 (em002_00_4.lmt), and repeats while P+0x1a2 -- zeroed at the phase's start
      // (0xd005fc) and raised by one after each create (0xd0b054..0xd0b064) -- is under the action's count: table
      // 0x15927f8[r1 - 1] = 3 / 1 / 3 / 3 for r1 1..4, else 1 (0xd00610..0xd00630, 0xd00710..0xd0071c). The mode is
      // 0xd0ae28's: r3 1 -> 0xf; else by r1 (0xd0af04's table) -- 0 -> 0xd, 2 -> 0xe, 3 -> 0x13, 4 -> 0x14, and r1 1 ->
      // 0x10 / 0x11 / 0x12 by P+0x1a2 (0xd0af30..0xd0af4c). One `modes` entry per shot (ROM-run with the clip looping).
      // r2 1 makes shell01 0 instead, counted the same way. (7, 0x27) / (7, 0x28) / (7, 0x33) / (7, 0x34) sit in streams
      // no op 0x14 calls (who issues them: NOT READ).
      { action: [7, 0x24], code: 0xd004cc, args: [0, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0xd] }], op24: 'else', pick: 'ai', variant: '7:0x24' },
      { action: [7, 0x26], code: 0xd004cc, args: [1, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x10, 0x11, 0x12] }], op24: 'else', pick: 'ai', variant: '7:0x26' },
      { action: [7, 0x27], code: 0xd004cc, args: [2, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0xe] }], pick: 'ai', variant: '7:0x27' },
      { action: [7, 0x28], code: 0xd004cc, args: [3, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x13, 0x13, 0x13] }], pick: 'ai', variant: '7:0x28' },
      { action: [7, 0x3b], code: 0xd004cc, args: [4, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x14, 0x14, 0x14] }], op24: 'else', pick: 'ai', variant: '7:0x3b' },
      { action: [7, 0x65], code: 0xd004cc, args: [6, 0, 1], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0xf] }], pick: 'ai', variant: '7:0x65' },
      { action: [7, 0x67], code: 0xd004cc, args: [0, 0, 1], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0xf] }], pick: 'ai', variant: '7:0x67' },
      { action: [7, 0x31], code: 0xd004cc, args: [0, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x31' },
      { action: [7, 0x32], code: 0xd004cc, args: [1, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], op24: 'if', pick: 'ai', variant: '7:0x32' },
      { action: [7, 0x33], code: 0xd004cc, args: [2, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0] }], pick: 'ai', variant: '7:0x33' },
      { action: [7, 0x34], code: 0xd004cc, args: [3, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], pick: 'ai', variant: '7:0x34' },
      { action: [7, 0x3c], code: 0xd004cc, args: [4, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], op24: 'if', pick: 'ai', variant: '7:0x3c' },
      // L4 M32 (the take-off, after L4 M31): 0xcf3ff0(e, r1, r2, r3) -> 0xd0c0dc(e, kind, sub): passes 6 (0xd0c0fc /
      // 0xd0c1ac) -> kind 1 / 2: shell00 0x20 with sub 1 (0xd0c158), else 0x15 (0xd0c32c); kind 5 / 6: 0x16 (0xd0c2e4;
      // 0x21 is the variant-4 branch 0xd0c1c0..0xd0c1f8); kind 3 / 4: shell01 0 (0xd0c244). The em byte picks this
      // monster's take-off clips L4 M31..M34 (0xcf4034..0xcf4074; em 1 takes L4 M12..M15). (9, 3) / (9, 4) = status 9's
      // 0xcee4e4 / 0xcee4f4.
      { action: [7, 0x03], code: 0xcf3ff0, args: [0, 1, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x03' },
      { action: [7, 0x29], code: 0xcf3ff0, args: [1, 1, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], pick: 'ai', variant: '7:0x29' },
      { action: [7, 0x2b], code: 0xcf3ff0, args: [0, 2, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x2b' },
      { action: [7, 0x2c], code: 0xcf3ff0, args: [1, 2, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x2c' },
      { action: [7, 0x48], code: 0xcf3ff0, args: [1, 5, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x16] }], op24: 'else', pick: 'ai', variant: '7:0x48' },
      { action: [7, 0x49], code: 0xcf3ff0, args: [1, 6, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x16] }], op24: 'else', pick: 'ai', variant: '7:0x49' },
      { action: [9, 0x03], code: 0xcf3ff0, args: [0, 1, 1], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x20] }], pick: 'ai', variant: '9:0x03' },
      { action: [7, 0x35], code: 0xcf3ff0, args: [0, 3, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x35' },
      { action: [7, 0x36], code: 0xcf3ff0, args: [1, 3, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x36' },
      { action: [7, 0x37], code: 0xcf3ff0, args: [0, 4, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x37' },
      { action: [7, 0x38], code: 0xcf3ff0, args: [1, 4, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x38' },
      { action: [9, 0x04], code: 0xcf3ff0, args: [0, 3, 1], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], pick: 'ai', variant: '9:0x04' },
      // L4 M45: (3, 0x4d) = status 3's 0xcef548 -> 0xcf5210(e, 0xa, 1) -> 0xd09f54: passes 44 (0xd0a060) -> shell00 0x17,
      // the fireball aimed on X and Y from the owner's point. Its helper counts nothing, and the clip loops at frame 0
      // (em002_00_4.lmt), so the game throws one on every pass of 44 while the action lasts (its end: NOT READ).
      { action: [3, 0x4d], code: 0xcf5210, args: [0xa, 1], list: '4', clip: 'Motion[45]', partners: [], spawns: [{ at: 0xd09f54, kind: 'first', frames: [44.0], shell: 'shell00', modes: [0x17] }], pick: 'ai', variant: '3:0x4d' },
    ],
    // THE FLIGHT DUST: its own L4 M25 / M26 / M27, as Dreadking's (the per-frame handler's bodies 0xcf1f74 / 0xcf1f30 /
    // 0xcf1f54 and 0xcf2424, shell01 mode 15 every 16 frames at the owner's ground); Rathian's rows follow (the share).
    dust: [
      { ids: [0x419], at: 0xcf1f74, period: 16.0, posture: 3, mode: 15 },
      { ids: [0x41a], at: 0xcf1f30, period: 16.0, from: 70.0, posture: 3, mode: 15 },
      { ids: [0x41b], at: 0xcf1f54, period: 16.0, until: 38.0, posture: 3, mode: 15 },
    ],
    // P+0x1ba while they play: 3, as Dreadking's (the same sites; ROM-run for every action that plays them, dk\posture_probe.py)
    postures: { '4|Motion[25]': 3, '4|Motion[26]': 3, '4|Motion[27]': 3 },
  },

  // SILVER RATHALOS (em002_02): Rathian's class uEm001_00 with em byte +0xb5f4 = 2, variant +0xb5f5 = 2. 0xd09918 keeps
  // the global shells 0x58 / 0x5e / 0x63 at enemy +0xcac4 / +0xcac8 / +0xcacc (0xd09a24..0xd09a44); table 0x175c3e8 names
  // Rathian's classes for them (uShellEm001_sp_00 / sp_01 / sp_11) with this monster's .shl (resources 0x89ab / 0x89b1 /
  // 0x89b6). Values: the files' own, C:\MHGU-Extract\scratch-em\em002_02\em002_02.arc, shell\em\em002_02_shellNN
  // (ShellInfoList 18 / 24 / 1, ShellScale 1.0).
  em002_02: {
    name: 'Silver Rathalos',
    em: 2, variant: 2,                               // enemy +0xb5f4 / +0xb5f5
    // both em002_02 .shl files name EffectLists[0] = effect\pel\em\em002_00c (the Rathalos line's c list) and [1] =
    // effect\pel\em\em002_02u (its own u list), the rest null
    lists: { 0: { list: 'c', pel: 'em002_00c' }, 1: { list: 'u', pel: 'em002_02u' } },
    shells: {
      // THE FIREBALLS (uShellEm001_sp_00, base00). The Rathalos modes 0 / 4 / 12..22 / 32 (L2 M5 / M18, L4 M22, L4 M29's
      // shots, the take-off) and this monster's 26..28 (L4 M38, X 40 / 20 / 10 degrees) and 37 ((7, 0x70)'s, the only
      // mode of the line with the reader's flag 0x20: its angle words come from the setup, not the owner's). 26..28 and
      // 37 are in the landing's mask (0x227f000f over mode - 8), so their landings make the explosion timer shell11 and
      // the ground fire; the others land as Rathian's do.
      shell00: {
        id: 0x58, cls: 'uShellEm001_sp_00', base: 'base00', folder: 'shell\\em\\em002_02_shell00', reader: 0xd0d988,
        modes: {
          0: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -45.0, 45.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 200.0, 200.0]] } },
          4: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
             sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, 0.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 260.0, 400.0]] } },
          12: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 60.0, 180.0, -30.0, 50.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 400.0, 100.0]] } },
          13: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          14: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, 0, -1, -1, -1, -1], floats: [0.0, 0.0, 50.0, 216.0, 10.0, 90.0, 50.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 50.0, 350.0]] } },
          16: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          17: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [43.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          18: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [43.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          19: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [50.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          21: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [40.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          22: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [30.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          26: { scale: 1.0, ef: [[1, 30], [1, 36], [999, -1], [1, 36]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [40.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          27: { scale: 1.0, ef: [[1, 30], [1, 36], [999, -1], [1, 36]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [20.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          28: { scale: 1.0, ef: [[1, 30], [1, 36], [999, -1], [1, 36]], hit: [1],
              sh: { ints: [3, 5, 5, -1, -1, -1, -1, -1], floats: [10.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          32: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 2]], hit: [0],
              sh: { ints: [3, -1, 1, -1, -1, -1, -1, -1], floats: [40.0, 0.0, 60.0, 180.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
          37: { scale: 1.0, ef: [[1, 30], [1, 36], [999, -1], [1, 36]], hit: [1],
              sh: { ints: [3, 1, 5, -1, -1, -1, -1, 0], floats: [25.0, 0.0, 100.0, 72.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, -80.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
        // em002_02_00_hitdata (HDS, 2 records)
        hitdata: [[0, 99], [0, 99]],
      },
      // GROUND FIRE, EXPLOSIONS, DUST, PUFFS, HIT VOLUMES (uShellEm001_sp_01, base01; params011). Rathian's 1, 2, 13..15,
      // 19 / 20 and the explosions 6..9 (snapped with the ground's angles, flags 4 | 8); the puffs 3..5 / 38..40 (L2 M1,
      // by rank) and 10..12 / 41..43 (L2 M13, by rank) on joint 4; 0 is the no-fire actions' hit volume.
      shell01: {
        id: 0x5e, cls: 'uShellEm001_sp_01', base: 'base01', folder: 'shell\\em\\em002_02_shell01', reader: 0xd0e6a0,
        modes: {
          0: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [8, -1],
             sh: { ints: [0, 3, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 190.0]] } },
          1: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [0, 2],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 3], [999, -1]], hit: [7, -1],
             sh: { ints: [-1, -1, -1, 0, 0, -1, -1, -1, -1], floats: [200.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          3: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [9, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          4: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [10, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          5: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [10, -1],
             sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          6: { scale: 1.0, ef: [[1, 31], [999, -1]], hit: [3, -1],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          7: { scale: 1.0, ef: [[1, 34], [999, -1]], hit: [4, -1],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          8: { scale: 1.0, ef: [[1, 33], [999, -1]], hit: [5, -1],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[1, 32], [999, -1]], hit: [6, -1],
             sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          10: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-100.0, -20.0, 80.0]] } },
          11: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[80.0, 0.0, 100.0]] } },
          12: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [11, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[200.0, -130.0, 100.0]] } },
          13: { scale: 1.0, ef: [[0, 30], [999, -1]], hit: [-1, 12],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 100.0]] } },
          14: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 13],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          15: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 14],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          19: { scale: 1.0, ef: [[999, -1], [999, -1]], hit: [16, -1],
              sh: { ints: [-1, -1, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 31], [999, -1]], hit: [-1, 15],
              sh: { ints: [-1, -1, -1, 0, -1, 0, -1, -1, 0], floats: [0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          38: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [17, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-150.0, -50.0, 100.0]] } },
          39: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [18, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-70.0, -200.0, 150.0]] } },
          40: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [18, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[150.0, -200.0, 200.0]] } },
          41: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [19, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[-100.0, -20.0, 80.0]] } },
          42: { scale: 1.0, ef: [[1, 60], [999, -1]], hit: [19, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[80.0, 0.0, 100.0]] } },
          43: { scale: 1.0, ef: [[1, 62], [999, -1]], hit: [19, -1],
              sh: { ints: [0, 4, -1, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 0.0], vecs: [[200.0, -130.0, 100.0]] } },
        },
        // em002_02_01_hitdata (HDS, 20 records): (s16 +0 delay, s16 +2 duration) by record, for input.hitLife
        hitdata: [[10, 10], [10, 10], [0, 10], [10, 20], [6, 16], [6, 16], [6, 16], [8, 172], [6, 5], [2, 10], [2, 10],
                  [0, 10], [14, 10], [14, 10], [14, 10], [14, 10], [10, 10], [2, 10], [2, 10], [2, 10]],
      },
      // THE EXPLOSION TIMER (uShellEm001_sp_11, base11): this monster's times 0 / 16 / 26 / 36 and offsets
      shell11: {
        id: 0x63, cls: 'uShellEm001_sp_11', base: 'base11', folder: 'shell\\em\\em002_02_shell11', reader: 0xd0ee8c,
        modes: {
          0: { scale: 1.0, ef: [], hit: [],
             sh: { ints: [], floats: [0.0, 16.0, 26.0, 36.0], vecs: [[0.0, 0.0, 0.0], [400.0, 0.0, 100.0], [-460.0, 0.0, 150.0], [0.0, 0.0, 450.0]] } },
        },
        times: [0, 1, 2, 3], vecIdx: [0, 1, 2, 3], modes01: [6, 7, 8, 9],
      },
    },
    // THE ACTIONS. Rathian's hover turns and dust rows are this monster's too (after this table), with its own flight dust
    // rows; its fire actions are the line's, whose em / variant branches give em 2 variant 2 these modes, on the clips its
    // lists have (L2 = em001_00_2.lmt; L4 = em002_02_4.lmt: the Rathalos slots with M7, M38, M39, M69, M97, M99, but no
    // M18 and no list 9). Read to their helpers and run on the ROM (arun.py: every drawing create below at its frame).
    // Not listed: (7, 0xf5) -> shell00 31 and (3, 0x4d) -> shell00 23 (L4 M45), modes em002_02_00 does not have, so the
    // shells the ROM makes there read -1 / 0.0 / the zero vector and draw nothing. The op24 marks: the command table's
    // op-0x24 branch of every called site (op24.py, and the check's --emc pass).
    actions: [
      // L2 M5 / M18: as Rathalos's (0xd0a134 -> shell00 0, 0xd0a614 -> 4; their em-2 variant-4 branches are Dreadking's)
      { action: [7, 0x02], code: 0xcfddec, args: [0], list: '2', clip: 'Motion[5]', partners: ['Motion[15]', 'Motion[16]'], spawner: 0xd0a134, spawnArgs: [0], frames: [78.0], shell: 'shell00', modes: [0], op24: 'else', pick: 'ai', variant: '7:0x02' },
      { action: [7, 0x0f], code: 0xcfddec, args: [1], list: '2', clip: 'Motion[5]', partners: ['Motion[15]', 'Motion[16]'], spawner: 0xd0a134, spawnArgs: [1], frames: [78.0], shell: 'shell01', modes: [0], op24: 'if', pick: 'ai', variant: '7:0x0f' },
      { action: [7, 0x0a], code: 0xcfef64, args: [0], list: '2', clip: 'Motion[18]', partners: ['Motion[17]'], spawner: 0xd0a614, spawnArgs: [0], frames: [80.0], shell: 'shell00', modes: [4], op24: 'else', pick: 'ai', variant: '7:0x0a' },
      { action: [7, 0x0b], code: 0xcfef64, args: [1], list: '2', clip: 'Motion[18]', partners: ['Motion[17]'], spawner: 0xd0a614, spawnArgs: [1], frames: [80.0], shell: 'shell01', modes: [0], op24: 'if', pick: 'ai', variant: '7:0x0b' },
      // L2 M1: the puffs of 0xd0a074 / 0xd0ba2c, as the Rathians' -- 5 / 4 / 3, or 0x28 / 0x27 / 0x26 at G rank
      // (0x3a8430 > 4); this monster has the files for both (Rathalos does not). (7, 0x00) / (7, 0x74) make none.
      { action: [7, 0x4d], code: 0xcfd770, args: [1], list: '2', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0a074, kind: 'first', frames: [74.0, 69.0, 64.0], shell: 'shell01', modes: [5, 4, 3], modesG: [0x28, 0x27, 0x26] }], pick: 'ai', variant: '7:0x4d' },
      { action: [7, 0x75], code: 0xd03b60, args: [1], list: '2', clip: 'Motion[1]', partners: [], spawns: [{ at: 0xd0ba2c, kind: 'first', frames: [74.0, 69.0, 64.0], shell: 'shell01', modes: [5, 4, 3], modesG: [0x28, 0x27, 0x26] }], pick: 'ai', variant: '7:0x75' },
      { action: [7, 0x00], code: 0xcfd770, args: [0], list: '2', clip: 'Motion[1]', partners: [], spawns: [], pick: 'ai', variant: '7:0x00' },
      { action: [7, 0x74], code: 0xd03b60, args: [0], list: '2', clip: 'Motion[1]', partners: [], spawns: [], pick: 'ai', variant: '7:0x74' },
      // L2 M13: 0xd0a818's G-rank puffs 0x2b / 0x2a / 0x29 are em 2 variants 1 / 2 only (0xd0a864 / 0xd0a950 / 0xd0aa3c),
      // so this monster throws them at G rank and 12 / 11 / 10 below it
      { action: [7, 0x4e], code: 0xcff1b0, args: [1], list: '2', clip: 'Motion[13]', partners: [], spawns: [{ at: 0xd0a818, kind: 'first', frames: [82.0, 78.0, 74.0], shell: 'shell01', modes: [12, 11, 10], modesG: [0x2b, 0x2a, 0x29] }], pick: 'ai', variant: '7:0x4e' },
      { action: [7, 0x11], code: 0xcff1b0, args: [0], list: '2', clip: 'Motion[13]', partners: [], spawns: [], pick: 'ai', variant: '7:0x11' },
      // L4 M22 and L4 M29: as Rathalos's (0xd0ac20 -> shell00 0xc; 0xd0ae28's shots, the mode by r1 and P+0x1a2 and the
      // count by table 0x15927f8[r1 - 1])
      { action: [7, 0x23], code: 0xd00118, args: [0, 0], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0xc] }], op24: 'else', pick: 'ai', variant: '7:0x23' },
      { action: [7, 0x2e], code: 0xd00118, args: [0, 1], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0xc] }], op24: 'else', pick: 'ai', variant: '7:0x2e' },
      { action: [7, 0x30], code: 0xd00118, args: [1, 0], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x30' },
      { action: [7, 0x41], code: 0xd00118, args: [1, 1], list: '4', clip: 'Motion[22]', partners: [], spawns: [{ at: 0xd0ac20, kind: 'first', frames: [82.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x41' },
      { action: [7, 0x24], code: 0xd004cc, args: [0, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0xd] }], op24: 'else', pick: 'ai', variant: '7:0x24' },
      { action: [7, 0x26], code: 0xd004cc, args: [1, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x10, 0x11, 0x12] }], op24: 'else', pick: 'ai', variant: '7:0x26' },
      { action: [7, 0x27], code: 0xd004cc, args: [2, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0xe] }], pick: 'ai', variant: '7:0x27' },
      { action: [7, 0x28], code: 0xd004cc, args: [3, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x13, 0x13, 0x13] }], pick: 'ai', variant: '7:0x28' },
      { action: [7, 0x3b], code: 0xd004cc, args: [4, 0, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0x14, 0x14, 0x14] }], op24: 'else', pick: 'ai', variant: '7:0x3b' },
      { action: [7, 0x65], code: 0xd004cc, args: [6, 0, 1], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0xf] }], pick: 'ai', variant: '7:0x65' },
      { action: [7, 0x67], code: 0xd004cc, args: [0, 0, 1], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell00', modes: [0xf] }], pick: 'ai', variant: '7:0x67' },
      { action: [7, 0x31], code: 0xd004cc, args: [0, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x31' },
      { action: [7, 0x32], code: 0xd004cc, args: [1, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], op24: 'if', pick: 'ai', variant: '7:0x32' },
      { action: [7, 0x33], code: 0xd004cc, args: [2, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0] }], pick: 'ai', variant: '7:0x33' },
      { action: [7, 0x34], code: 0xd004cc, args: [3, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], pick: 'ai', variant: '7:0x34' },
      { action: [7, 0x3c], code: 0xd004cc, args: [4, 1, 0], list: '4', clip: 'Motion[29]', partners: [], spawns: [{ at: 0xd0ae28, kind: 'shots', frames: [40.0], shell: 'shell01', modes: [0, 0, 0] }], op24: 'if', pick: 'ai', variant: '7:0x3c' },
      // L4 M32 (the take-off): as Rathalos's (0xd0c0dc -> shell00 0x15 / 0x16 / 0x20, or shell01 0)
      { action: [7, 0x03], code: 0xcf3ff0, args: [0, 1, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x03' },
      { action: [7, 0x29], code: 0xcf3ff0, args: [1, 1, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], pick: 'ai', variant: '7:0x29' },
      { action: [7, 0x2b], code: 0xcf3ff0, args: [0, 2, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x2b' },
      { action: [7, 0x2c], code: 0xcf3ff0, args: [1, 2, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x15] }], op24: 'else', pick: 'ai', variant: '7:0x2c' },
      { action: [7, 0x48], code: 0xcf3ff0, args: [1, 5, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x16] }], op24: 'else', pick: 'ai', variant: '7:0x48' },
      { action: [7, 0x49], code: 0xcf3ff0, args: [1, 6, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x16] }], op24: 'else', pick: 'ai', variant: '7:0x49' },
      { action: [9, 0x03], code: 0xcf3ff0, args: [0, 1, 1], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell00', modes: [0x20] }], pick: 'ai', variant: '9:0x03' },
      { action: [7, 0x35], code: 0xcf3ff0, args: [0, 3, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x35' },
      { action: [7, 0x36], code: 0xcf3ff0, args: [1, 3, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x36' },
      { action: [7, 0x37], code: 0xcf3ff0, args: [0, 4, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x37' },
      { action: [7, 0x38], code: 0xcf3ff0, args: [1, 4, 0], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], op24: 'if', pick: 'ai', variant: '7:0x38' },
      { action: [9, 0x04], code: 0xcf3ff0, args: [0, 3, 1], list: '4', clip: 'Motion[32]', partners: [], spawns: [{ at: 0xd0c0dc, kind: 'first', frames: [6.0], shell: 'shell01', modes: [0] }], pick: 'ai', variant: '9:0x04' },
      // L4 M38: (7, 0x43) / (7, 0x45) / (7, 0x46) = 0xd01b70(e, 0 / 1 / 2) -> 0xd0b364: passes 82 (0xd0b438) -> shell00
      // 0x1a / 0x1b / 0x1c, which land in the mask (shell11 and its four explosions). (7, 0x70) = 0xd0303c plays L4 M69
      // and then this clip from frame 70; its helper 0xd0b804 passes 82 (the literal at 0xd0ba14) and makes shell00 0x25,
      // the one mode of the line whose reader sets flag 0x20 -- its angle words are the setup's, which this helper fills
      // with the owner's words and the X word raised (`angles: 'pitch'`, pitchAngles001).
      { action: [7, 0x43], code: 0xd01b70, args: [0], list: '4', clip: 'Motion[38]', partners: [], spawns: [{ at: 0xd0b364, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1a] }], op24: 'else', pick: 'ai', variant: '7:0x43' },
      { action: [7, 0x45], code: 0xd01b70, args: [1], list: '4', clip: 'Motion[38]', partners: [], spawns: [{ at: 0xd0b364, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1b] }], pick: 'ai', variant: '7:0x45' },
      { action: [7, 0x46], code: 0xd01b70, args: [2], list: '4', clip: 'Motion[38]', partners: [], spawns: [{ at: 0xd0b364, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x1c] }], op24: 'else', pick: 'ai', variant: '7:0x46' },
      { action: [7, 0x70], code: 0xd0303c, args: [], list: '4', clip: 'Motion[38]', partners: [], spawns: [{ at: 0xd0b804, kind: 'first', frames: [82.0], shell: 'shell00', modes: [0x25], angles: 'pitch' }], pick: 'ai', variant: '7:0x70' },
    ],
    // THE FLIGHT DUST: its own L4 M25 / M26 / M27, as the rest of the line's
    dust: [
      { ids: [0x419], at: 0xcf1f74, period: 16.0, posture: 3, mode: 15 },
      { ids: [0x41a], at: 0xcf1f30, period: 16.0, from: 70.0, posture: 3, mode: 15 },
      { ids: [0x41b], at: 0xcf1f54, period: 16.0, until: 38.0, posture: 3, mode: 15 },
    ],
    postures: { '4|Motion[25]': 3, '4|Motion[26]': 3, '4|Motion[27]': 3 },
  },
  // KHEZU (em003_00): class uEm003_00, vtable 0x17958f0. Its five global shells are written at enemy +0xcac4 ..
  // +0xcad4 by vtable slot 86 (0xd20544) when the em byte +0xb5f4 is 3 and the variant +0xb5f5 is 0: 0x65 / 0x66 /
  // 0x67 / 0x68 / 0x69. The class table 0x175c3e8 (12 bytes an entry: class DTI, setup DTI, resource) gives them
  // uShellEm003_sp_00 / sp_01 / sp_03 / sp_05 / sp_13 (DTIs 0x188bca8 / 0x188bcc8 / 0x188bce8 / 0x188bd08 /
  // 0x188bd28) over uShellEmBase00 / 01 / 03 / 05 / 13, with resources 0x89be..0x89c2; the ctors are 0xd2143c /
  // 0xd218a4 / 0xd21af0 / 0xd21d08 / 0xd22070 and each class overrides only its reader (+0x14c) and a slot or two.
  // Values: the files' own, C:\MHGU-Extract\scratch-em\em003_00\em003_00.arc. Every .shl names ShellScale 1.0 in
  // every ShellInfoList entry and no ShellCmnParam; EffectLists[0] is effect\pel\em\em003_00u in all five, and
  // shell01 alone also names [1] = em003_00c.
  //
  // WHAT IS WIRED HERE: shell03, the ground lightning (base03 below). Its 21 modes are one attack's fan -- the .shl
  // gives each a Y offset in degrees, a speed and a life -- and the action's index picks a triple of them. The
  // other four shells' files are transcribed but no action is listed for them yet: base01, base05 and base13 are
  // not translated, and Khezu's shell00 runs base00 through his own reader (0xd2145c), which is not read yet.
  //
  // THE ACTIONS. The status switch 0xd1f658 (status byte +0x73e0) sends status 7 to the number switch 0xd1c920
  // (number byte +0x73e1, table 0xd1c94c). Six numbers reach one handler, 0xd16e08, each with its own index: phase 0
  // plays L2 Motion[3] (motion 0x203, setMotion0 0xafe84 with blend 8), phase 1 arms a hit record at 160.0 and, when
  // the motion passes 176.0 (0xb0974 -> 0x72714), makes that index's bolts (the table at 0xd16f30). Which number the
  // AI issues is NOT READ, so the viewer names it (pick 'ai', input.rock.variant). The command table
  // (enemy\cmd_tbl\em003_00_cmdtbl.emc, op 0x00 = do action) issues five of the six: (7, 0x0e), (7, 0x35), (7, 0x46),
  // (7, 0x47) and (7, 0x4d) -- all from group 1 streams 10 and 15. (7, 0x05) is in neither the streams nor any chain
  // the class makes (0x768c8 call sites), so its modes 0 / 1 / 2 are listed but never picked.
  em003_00: {
    name: 'Khezu',
    // the monster's effect lists by listId: the .shl EffectLists (rProofEffectList). shell01 carries its own pair.
    lists: { 0: { list: 'u', pel: 'em003_00u' } },
    shells: {
      // shell00: global id 0x65, uShellEm003_sp_00 : uShellEmBase00 (reader 0xd2145c), folder shell\em\em003_00_shell00
      shell00: {
        id: 0x65, cls: 'uShellEm003_sp_00', base: 'base00', reader: 0xd2145c, folder: 'shell\\em\\em003_00_shell00',
        modes: {
          // em003_00_00_ef000 / _sh000
          0: { scale: 1.0, ef: [[0, 90], [0, 93], [0, 92], [0, 93]],
               sh: { ints: [3], floats: [0.0, 0.0, 2000.0], vecs: [[0.0, 0.0, 0.0], [0.0, -2.0, 0.0]] } },
          // em003_00_00_ef001 / _sh001
          1: { scale: 1.0, ef: [[0, 60], [999, -1], [999, -1], [999, -1]],
               sh: { ints: [3], floats: [0.0, 0.0, 72.0], vecs: [[0.0, 0.0, 0.0], [0.0, -1.75, 0.0]] } },
        },
      },
      // shell01: global id 0x66, uShellEm003_sp_01 : uShellEmBase01 (reader 0xd218c4), folder shell\em\em003_00_shell01
      shell01: {
        id: 0x66, cls: 'uShellEm003_sp_01', base: 'base01', reader: 0xd218c4, folder: 'shell\\em\\em003_00_shell01',
        lists: { 0: { list: 'u', pel: 'em003_00u' }, 1: { list: 'c', pel: 'em003_00c' } },
        modes: {
          // em003_00_01_ef000 / _sh000
          0: { scale: 1.0, ef: [[0, 61], [999, -1]],
               sh: { ints: [-1, -1, -1, -1, -1], floats: [], vecs: [] } },
          // em003_00_01_ef001 / _sh001
          1: { scale: 1.0, ef: [[0, 31], [999, -1]],
               sh: { ints: [0, -1, -1, -1, -1], floats: [], vecs: [] } },
          // em003_00_01_ef002 / _sh002
          2: { scale: 1.0, ef: [[0, 31], [999, -1]],
               sh: { ints: [0, -1, -1, -1, -1], floats: [], vecs: [] } },
          // em003_00_01_ef003 / _sh003
          3: { scale: 1.0, ef: [[1, 30], [999, -1]],
               sh: { ints: [0, -1, 0, -1, 0], floats: [], vecs: [] } },
          // em003_00_01_ef004 / _sh004
          4: { scale: 1.0, ef: [[1, 31], [999, -1]],
               sh: { ints: [0, -1, 0, -1, 0], floats: [], vecs: [] } },
          // em003_00_01_ef005 / _sh005
          5: { scale: 1.0, ef: [[0, 120], [999, -1]],
               sh: { ints: [-1, -1, -1, -1, -1], floats: [], vecs: [] } },
          // em003_00_01_ef006 / _sh006
          6: { scale: 1.0, ef: [[999, -1], [999, -1]],
               sh: { ints: [-1, -1, -1, -1, -1], floats: [], vecs: [] } },
        },
      },
      // shell03: global id 0x67, uShellEm003_sp_03 : uShellEmBase03 (reader 0xd21b10), folder shell\em\em003_00_shell03
      shell03: {
        id: 0x67, cls: 'uShellEm003_sp_03', base: 'base03', reader: 0xd21b10, folder: 'shell\\em\\em003_00_shell03',
        modes: {
          // em003_00_03_ef000 / _sh000
          0: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, 0], floats: [20.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef001 / _sh001
          1: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, 0], floats: [0.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef002 / _sh002
          2: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, 0], floats: [-20.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef003 / _sh003
          3: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, 0], floats: [10.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef004 / _sh004
          4: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, 0], floats: [0.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef005 / _sh005
          5: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, 0], floats: [-10.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef006 / _sh006
          6: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [20.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef007 / _sh007
          7: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [0.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef008 / _sh008
          8: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [-20.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef009 / _sh009
          9: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [10.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef010 / _sh010
          10: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [0.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef011 / _sh011
          11: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [-10.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef012 / _sh012
          12: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [55.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef013 / _sh013
          13: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [0.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef014 / _sh014
          14: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [-55.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef015 / _sh015
          15: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [55.0, 40.0, 72.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef016 / _sh016
          16: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [0.0, 40.0, 72.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef017 / _sh017
          17: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [-55.0, 40.0, 72.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef018 / _sh018
          18: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [33.0, 40.0, 72.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef019 / _sh019
          19: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, -1], floats: [-33.0, 40.0, 72.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_03_ef020 / _sh020
          20: { scale: 1.0, ef: [[0, 0]],
               sh: { ints: [3, 0], floats: [0.0, 40.0, 120.0], vecs: [[0.0, 0.0, 0.0]] } },
        },
      },
      // shell05: global id 0x68, uShellEm003_sp_05 : uShellEmBase05 (reader 0xd21d28), folder shell\em\em003_00_shell05
      shell05: {
        id: 0x68, cls: 'uShellEm003_sp_05', base: 'base05', reader: 0xd21d28, folder: 'shell\\em\\em003_00_shell05',
        modes: {
          // em003_00_05_ef000 / _sh000
          0: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [], floats: [180.0], vecs: [] } },
          // em003_00_05_ef001 / _sh001
          1: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [], floats: [180.0], vecs: [] } },
        },
      },
      // shell13: global id 0x69, uShellEm003_sp_13 : uShellEmBase13 (reader 0xd220a4), folder shell\em\em003_00_shell13
      shell13: {
        id: 0x69, cls: 'uShellEm003_sp_13', base: 'base13', reader: 0xd220a4, folder: 'shell\\em\\em003_00_shell13',
        modes: {
          // em003_00_13_ef000 / _sh000
          0: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef001 / _sh001
          1: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 300.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef002 / _sh002
          2: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 0.0, 60.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef003 / _sh003
          3: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef004 / _sh004
          4: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 0.0, 240.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef005 / _sh005
          5: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 120.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef006 / _sh006
          6: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef007 / _sh007
          7: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 300.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef008 / _sh008
          8: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 0.0, 60.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef009 / _sh009
          9: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef010 / _sh010
          10: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 0.0, 240.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef011 / _sh011
          11: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, 0, -1], floats: [11.25, 0.0125, -0.3, 1000.0, 3000.0, 180.0, 120.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef012 / _sh012
          12: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 0.0, 2000.0, 180.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef013 / _sh013
          13: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 30.0, 140.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef014 / _sh014
          14: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 200.0, 330.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef015 / _sh015
          15: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef016 / _sh016
          16: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 150.0, 330.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef017 / _sh017
          17: { scale: 1.0, ef: [[0, 30]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 30.0, 180.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef018 / _sh018
          18: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 0.0, 2000.0, 180.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef019 / _sh019
          19: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 30.0, 140.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef020 / _sh020
          20: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 200.0, 330.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef021 / _sh021
          21: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef022 / _sh022
          22: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 150.0, 330.0], vecs: [[0.0, 0.0, 0.0]] } },
          // em003_00_13_ef023 / _sh023
          23: { scale: 1.0, ef: [[0, 32]],
               sh: { ints: [0, -1, -1], floats: [12.0, 0.02, -0.3, 300.0, 2000.0, 180.0, 30.0, 180.0], vecs: [[0.0, 0.0, 0.0]] } },
        },
      },
    },
    actions: [
      // THE LIGHTNING (uShellEm003_sp_03, base03). One action, one index, one triple of modes, all at 176.0 of
      // L2 Motion[3]. `modes` is what 0xd16e08's index table 0xd16f30 reaches with this action's number: the two
      // branches it also has (`tst [+0x73e8], #3` at 0xd16f88 and 0xd1741c, the action number's low bits) are never
      // zero for the numbers that arrive here -- 0x05 & 3 = 1 and 0x47 & 3 = 3 -- so modes 3 / 4 / 5 and 9 / 10 / 11
      // cannot be made by any action, and are transcribed above but not listed.
      { action: [7, 0x05], code: 0xd16e08, args: [0], list: '2', clip: 'Motion[3]', frame: 176.0, shell: 'shell03',
        modes: [0, 1, 2], spawner: 0xd16e08, pick: 'unread' },
      { action: [7, 0x0e], code: 0xd16e08, args: [4], list: '2', clip: 'Motion[3]', frame: 176.0, shell: 'shell03',
        modes: [12, 13, 14], spawner: 0xd16e08, pick: 'ai', variant: '7:0x0e' },
      // index 1 makes no shell: its case in the frame-176 table is the one that goes straight to the tail (0xd17df8)
      { action: [7, 0x35], code: 0xd16e08, args: [1], list: '2', clip: 'Motion[3]', frame: 176.0, shell: 'shell03',
        modes: [], spawner: 0xd16e08, pick: 'ai', variant: '7:0x35' },
      // index 2 makes one bolt down the middle, mode 20 -- the only mode any action reaches whose sh int 1 is not -1,
      // so it is the only one that takes base03's second ground path (climb03)
      { action: [7, 0x46], code: 0xd16e08, args: [2], list: '2', clip: 'Motion[3]', frame: 176.0, shell: 'shell03',
        modes: [20], spawner: 0xd16e08, pick: 'ai', variant: '7:0x46' },
      { action: [7, 0x47], code: 0xd16e08, args: [3], list: '2', clip: 'Motion[3]', frame: 176.0, shell: 'shell03',
        modes: [6, 7, 8], spawner: 0xd16e08, pick: 'ai', variant: '7:0x47' },
      // index 5 then sets phase 3 and plays L2 Motion[3] again from frame 40 (0xd17e30..0xd17e54), which makes modes
      // 18 and 19 at 176.0 of that second play (0xd17130..0xd172cc). The viewer has no action phase, so only the
      // first wave is listed; the second is NOT MODELLED.
      { action: [7, 0x4d], code: 0xd16e08, args: [5], list: '2', clip: 'Motion[3]', frame: 176.0, shell: 'shell03',
        modes: [15, 16, 17], spawner: 0xd16e08, pick: 'ai', variant: '7:0x4d' },
    ],
  },
};

// The siblings run Rathian's class code on the clips they share with her, so her action entries are theirs (in front of
// their own; Dreadqueen's own L4 M65 entries replace hers), and so are the per-frame handler's dust rows and the posture
// read: 0xcf1a5c tests the motion id and frame only, never the variant (its prologue 0xcf2180 reads it for part states,
// not shells); swept on the ROM for every motion id of the three monsters' lists (vperframe.py), it makes the same shells
// at the same frames -- the ids of L4 (0x407 .. 0x411) are slots each monster's own L4 has; L4 M50 / M52 and L9 M1 / M2 / M9
// only request cameras (0xc241c).
for (const [id, own] of [['em001_02', []], ['em001_04', ['7:0x77', '7:0x7b', '7:0x76', '7:0x7a']]]){
  const D = SHELL_DATA[id], R = SHELL_DATA.em001_00;
  D.actions = R.actions.filter(a => !own.includes(a.variant)).concat(D.actions);
  D.dust = R.dust;
  D.postures = R.postures;
}
// Dreadking Rathalos (em002_04) shares Rathian's hover turns (the status-4 body 0xcfad9c on the shared L1 clips), her
// dust rows and posture read (the per-frame handler 0xcf1a5c, swept on the ROM for every motion id of em002_04's lists:
// the same shells at the same frames, Rathalos's L4 M34 (0x422) taking the 0x40f row), with its own flight dust rows and
// postures added; its fire actions are its own.
{
  const D = SHELL_DATA.em002_04, R = SHELL_DATA.em001_00;
  D.actions = R.actions.filter(a => a.pick === 'hover').concat(D.actions);
  D.dust = R.dust.concat(D.dust);
  D.postures = Object.assign({}, R.postures, D.postures);
}
// Rathalos (em002_00) and Silver Rathalos (em002_02) share the same of Rathian's: her hover turns on the L1 clips their
// lists take from her files, her dust rows and posture read, with their own flight dust rows and postures added.
for (const id of ['em002_00', 'em002_02']){
  const D = SHELL_DATA[id], R = SHELL_DATA.em001_00;
  D.actions = R.actions.filter(a => a.pick === 'hover').concat(D.actions);
  D.dust = R.dust.concat(D.dust);
  D.postures = Object.assign({}, R.postures, D.postures);
}

// An action plays `clip` when it is the action's main motion or one of its blend partners (Rathian's 0xb04d0 actions:
// the viewer may show the secondary clip, whose frames run with the main one's -- shells-em001.md 2.2).
const playsClip = (a, clip) => a.clip === clip || (!!a.partners && a.partners.includes(clip));

// The action the monster would be playing this clip in. A clip reached only by 'chain' has one action; a clip the
// command table picks by rage has two, and rage decides (the switch is evaluated when the action is chosen, i.e. at
// the motion's start). `force` = [status, number] overrides. Returns null when nothing in the table plays the clip.
export function actionFor(monId, list, clip, rage, force){
  const D = SHELL_DATA[monId];
  if (!D) return null;
  const cands = D.actions.filter(a => a.list === String(list) && playsClip(a, clip));
  if (force) return cands.find(a => a.action[0] === force[0] && a.action[1] === force[1]) || null;
  // `always`: a clip whose streams cannot reach the enraged branch, so one entry serves both states -- Deviljho's
  // breath, where the op-0x6f value is his enraged flag itself (0 or 1, never the 2 the streams switch on: 0xe80e4c)
  const always = cands.filter(a => a.pick === 'always');
  if (always.length === 1) return always[0];
  const byRage = cands.filter(a => a.pick === (rage ? 'rage' : 'calm'));
  if (byRage.length === 1) return byRage[0];
  const chained = cands.filter(a => a.pick === 'chain');
  // a clip played from its start is never the mid-motion (7, 0x34) entry
  const whole = chained.filter(a => !(a.action[0] === 7 && a.action[1] === 0x34));
  return whole.length === 1 ? whole[0] : null;
}

// The rocks a rock clip can throw, by the viewer's choice: which one the AI picks (command stream 36 / 56 / 57) is NOT
// READ, so the caller names it. Returns the first table entry (lowest status number) for that rock and clip, or null.
export const ROCK_VARIANTS = ['shell00_0', 'shell00_8', 'shell54_0'];
export function rockActionFor(monId, list, clip, variant){
  const D = SHELL_DATA[monId];
  if (!D || !variant) return null;
  return D.actions.find(a => a.pick === 'rock' && a.variant === variant && a.list === String(list) && a.clip === clip) || null;
}

// Any monster's viewer-named action: Savage's rocks (pick 'rock', the variants above -- rockActionFor's answer),
// Nargacuga's tail spikes and Rathian's fireballs / breath (pick 'ai', the variant is the action, '7:0x28' ... ; a
// Rathian blend partner clip names its main clip's actions), and Rathian's hover turns (pick 'hover', '4:0x04' /
// '4:0x15': named only, never listed by pickVariantsFor). Her siblings' the same way ('7:0x42', ...; Dreadqueen's L9
// Motion[1] action is status 1's: '1:0xff'; Dreadking's L4 Motion[45] and L4 Motion[32] have status 3's '3:0x4d' and
// status 9's '9:0x03' / '9:0x04'). null when the clip has none.
export function variantActionFor(monId, list, clip, variant){
  const D = SHELL_DATA[monId];
  if (!D || !variant) return null;
  return D.actions.find(a => (a.pick === 'rock' || a.pick === 'ai' || a.pick === 'hover') && a.variant === variant && a.list === String(list) && playsClip(a, clip)) || null;
}

// The variants a clip's shells can be thrown with, in a fixed order (the actions table's), for the viewer to name one
// per play in input.rock.variant -- where the AI's pick among them is not read. opts = { tired, rage } (both false by
// default): an action the command table issues from one branch of its op-0x24 if / else (`op24`) is listed only in that
// branch's state -- the `24 00` body runs when 0x81634 != 0 (0x86fac..0x86fdc): not enraged and +0x505 in {1, 2, 3}
// (exhaustion pending or tired), so tired && !rage lists the 'if' actions, anything else the 'else' ones; an action
// with no op24 is listed either way. Savage's rock clips (L2 Motion[23] / [24]): ROCK_VARIANTS, tired or not (both
// op-0x24 branches throw the same rock); Nargacuga's spike clip (L2 Motion[8]): its issued actions '7:0x28', '7:0x29',
// '7:0x2a', '7:0x2b', '7:0x2c', '7:0x35', '7:0x3a', '7:0x82', '7:0x84', tired or not (no op 0x24 issues them). Rathian
// (shells-em001.md 10), not tired / tired: L2 Motion[5] and its blend partners Motion[15] / [16]: '7:0x02' / '7:0x0f';
// L2 Motion[18] (and partner Motion[17]): '7:0x0a' / '7:0x0b'; L4 Motion[8]: '7:0x08', '7:0x6b' / '7:0x22', '7:0x6c'
// (partners Motion[53] / [54]: '7:0x6b' / '7:0x6c'); L4 Motion[16]: '7:0x3a', '7:0x47' / none (tired, the streams issue
// (7, 0x10), another clip); L4 Motion[65], either way: '7:0x77', '7:0x7b', '7:0x76', '7:0x7a' (the choice among them is
// not read; the two that draw first). Gold Rathian (em001_02) and Dreadqueen (em001_04): Rathian's lists above for the
// same clips, and (not tired / tired): L2 Motion[1]: '7:0x4d', '7:0x75', '7:0x00', '7:0x74' either way (the two that draw
// first); L4 Motion[18]: '7:0x42', '7:0x4a', '7:0x5a', '7:0x5b', '7:0xef' / none (op-0x24 else bodies). Dreadqueen also:
// L4 Motion[65] (all four draw: the poison at 116); L4 Motion[6]: '7:0x05', '7:0x3d', '7:0x09', '7:0x0e', '7:0x1e',
// '7:0x4a', '7:0x73', '7:0x6d' / the same without '7:0x4a'; L2 Motion[13]: '7:0x4e', '7:0x11'; L9 Motion[1]: '1:0xff';
// L9 Motion[2]: '7:0xff'; L9 Motion[4] / [5]: '7:0xed', '7:0xee', '7:0xf8'; L9 Motion[7]: '7:0xef', '7:0xf0', '7:0xf1' /
// '7:0xf0', '7:0xf1'; L9 Motion[9]: '7:0xf2'. Dreadking (em002_04), not tired / tired: L2 Motion[5]: '7:0x02' / '7:0x0f';
// L2 Motion[18]: '7:0x0a' / '7:0x0b'; L2 Motion[1]: '7:0x4d', '7:0x75', '7:0x00', '7:0x74' either way; L2 Motion[13]:
// '7:0x4e', '7:0x11'; L4 Motion[22]: '7:0x23', '7:0x2e' / '7:0x30', '7:0x41'; L4 Motion[29]: '7:0x24', '7:0x26', '7:0x27',
// '7:0x28', '7:0x3b', '7:0x65', '7:0x67', '7:0x33', '7:0x34' / '7:0x27', '7:0x28', '7:0x65', '7:0x67', '7:0x31', '7:0x32',
// '7:0x33', '7:0x34', '7:0x3c'; L4 Motion[32]: '7:0x03', '7:0x29', '7:0x2b', '7:0x2c', '7:0x48', '7:0x49', '9:0x03', '9:0x04'
// / '7:0x29', '9:0x03', '7:0x35', '7:0x36', '7:0x37', '7:0x38', '9:0x04'; L4 Motion[38]: '7:0x43', '7:0x45', '7:0x46',
// '7:0xf5' / '7:0x45'; L4 Motion[18]: '7:0xec', '7:0xf9' / '7:0xf9'; L4 Motion[45]: '3:0x4d'; L9 Motion[1]: '7:0xfa',
// '7:0xfb' / '7:0xfb'; L9 Motion[4] / [5]: '7:0xed', '7:0xee', '7:0xf6', '7:0xf7', '7:0xf8'. Rathalos (em002_00), not
// tired / tired: L2 Motion[5]: '7:0x02' / '7:0x0f'; L2 Motion[18]: '7:0x0a' / '7:0x0b'; L2 Motion[13]: '7:0x4e', '7:0x11'
// either way; L4 Motion[22]: '7:0x23', '7:0x2e' / '7:0x30', '7:0x41'; L4 Motion[29] and L4 Motion[32]: Dreadking's lists;
// L4 Motion[45]: '3:0x4d'; L2 Motion[1]: none (its puffs have no files). Silver Rathalos (em002_02): Rathalos's lists for
// the clips they share, its L2 Motion[1] '7:0x4d', '7:0x75', '7:0x00', '7:0x74' either way (its puffs do have files), no
// L4 Motion[45] pick (no file for mode 23), and L4 Motion[38]: '7:0x43', '7:0x46', '7:0x70' / '7:0x45', '7:0x70'. Any
// other clip: [] (its shells, if any, need no pick -- Rathian's landing dust, the Rathalos line's flight dust). `clip`
// may carry a _start / _loop suffix.
export function pickVariantsFor(monId, list, clip, opts){
  const D = SHELL_DATA[monId];
  if (!D || !clip) return [];
  const base = String(clip).replace(/_(start|loop)$/, '');
  const branch = opts && opts.tired && !opts.rage ? 'if' : 'else';
  const names = [];
  for (const a of D.actions)
    if ((a.pick === 'rock' || a.pick === 'ai') && a.variant && a.list === String(list) && playsClip(a, base) &&
        (!a.op24 || a.op24 === branch) && !names.includes(a.variant)) names.push(a.variant);
  return names;
}

// ---- joint reads -------------------------------------------------------------------------------------------------
// 0xc15a4(enemy, gid, out): the joint's world matrix (joint + 0x10, 0x539db0: index byte [[e+0x498] + gid], joint =
// [e+0x494] + index * 0xa0); a gid the model does not map falls back to gid 0.
function jointMatrix(joints, gid){
  const m = joints(gid);
  if (m) return m;
  return joints(0) || null;
}

// 0x7c3a38(out, m): Euler angles (radians) from a row-vector matrix
function eulerOf(m){
  if (!(m[9] < 1.0)) return { x: f(-HALF_PI), y: 0, z: f(-atan2f(m[2], m[0])) };            // 0x7c3ab4
  if (m[9] <= -1.0) return { x: HALF_PI, y: 0, z: atan2f(m[8], m[0]) };                      // 0x7c3ad8
  return { x: f(-asinf(m[9])), y: f(-atan2f(f(-m[8]), m[10])), z: f(-atan2f(f(-m[1]), m[5])) };
}

// 0x72dec(q, m): quaternion (x, y, z, w) from a matrix (Shoemake; next-axis table 0x159c504 = [1, 2, 0])
function quatOf(m){
  const q = [0, 0, 0, 0];
  const tr = f(f(m[0] + m[5]) + m[10]);
  if (tr > 0){
    let s = sqrtf(f(tr + 1.0));
    q[3] = f(s * 0.5);
    s = f(0.5 / s);
    q[0] = f(s * f(m[6] - m[9]));
    q[1] = f(s * f(m[8] - m[2]));
    q[2] = f(s * f(m[1] - m[4]));
    return q;
  }
  let i = m[5] > m[0] ? 1 : 0;
  if (m[10] > m[i * 5]) i = 2;
  const NEXT = [1, 2, 0], j = NEXT[i], k = NEXT[j];
  let s = sqrtf(f(f(f(m[i * 5] - m[j * 5]) - m[k * 5]) + 1.0));
  q[i] = f(s * 0.5);
  s = f(0.5 / s);
  q[3] = f(s * f(m[j * 4 + k] - m[k * 4 + j]));
  q[j] = f(s * f(m[i * 4 + j] + m[j * 4 + i]));
  q[k] = f(s * f(m[i * 4 + k] + m[k * 4 + i]));
  return q;
}

// 0x3ff778 (base04) / 0x42c950 (base55): the joint point and its angles. vec0 is transformed by the whole joint
// matrix (homogeneous, divided by w; w == 0 gives 0); angles: the matrix's Euler angles as u16, plus `angOff` on X --
// or, when the angle-mode int is 1, X = owner X angle + angOff, Y = atan2f(m[8], m[10]), Z = owner Z angle.
function jointPoint(M, vec0, angOff, angleMode, owner){
  const [x, y, z] = vec0;
  let w = f(y * M[7]); w = mla(w, x, M[3]); w = mla(w, z, M[11]); w = f(M[15] + w);
  const inv = w === 0 ? 0 : f(1.0 / w);
  let px = f(y * M[4]); px = mla(px, x, M[0]); px = mla(px, z, M[8]);
  let py = f(y * M[5]); py = mla(py, x, M[1]); py = mla(py, z, M[9]);
  let pz = f(y * M[6]); pz = mla(pz, x, M[2]); pz = mla(pz, z, M[10]);
  const P = [f(inv * f(M[12] + px)), f(inv * f(M[13] + py)), f(inv * f(M[14] + pz))];
  let A;
  if (angleMode === 1){
    const Y = atan2f(M[8], M[10]);                                           // 0x3ff8b4 (s0 = m[8], s1 = m[10])
    A = [u16((owner.x >>> 0) + angOff), u16(s32(mla(0.5, Y, RAD_TO_U16))), owner.z >>> 0];
  } else {
    const e = eulerOf(M);
    A = [u16(s32(mla(0.5, e.x, RAD_TO_U16)) + angOff), u16(s32(mla(0.5, e.y, RAD_TO_U16))), u16(s32(mla(0.5, e.z, RAD_TO_U16)))];
  }
  return { P, A };
}

// the direction the init and the moves build from the u16 angles: (0, 0, 1) turned by Z, X, Y as the compiler left
// it (the x and y terms multiply by the literal 0.0 and stay in, 0x3ff334 / 0x3ffb28 / 0x42c724)
function dirOf(A){
  const az = f(u16(A[2]) * U16_TO_RAD), ax = f(u16(A[0]) * U16_TO_RAD), ay = f(u16(A[1]) * U16_TO_RAD);
  const sz = sinf(az), cz = cosf(az), sx = sinf(ax), cx = cosf(ax), sy = sinf(ay), cy = cosf(ay);
  const a = f(sz * 0.0), b = f(cz * 0.0);
  const s = f(a + b), d = f(b - a);                         // (sin z * 0) + (cos z * 0), (cos z * 0) - (sin z * 0)
  const c = mla(cx, s, sx);                                 // cos x + s * sin x
  const dx = mla(f(d * cy), c, sy);                         // d*cos y + c*sin y
  const dy = nmls(sx, s, cx);                               // s*cos x - sin x
  const dz = mls(f(c * cy), d, sy);                         // c*cos y - d*sin y
  return [dx, dy, dz];
}

// 0x3ffe38 / 0x42d108: the effect aimed from the anchor E at the shell's position, in degrees for 0x329d04
function aimOf(pos, E, ownerZ){
  const dxz = f(pos[0] - E[0]), dzz = f(pos[2] - E[2]);
  const yaw = u16(s32(mla(0.5, atan2f(dxz, dzz), RAD_TO_U16)));
  const horiz = sqrtf(mla(f(dzz * dzz), dxz, dxz));
  const pitch = u16(s32(mla(0.5, atan2f(f(-f(pos[1] - E[1])), horiz), RAD_TO_U16)));
  return [f(pitch * U16_TO_DEG), f(yaw * U16_TO_DEG), f((ownerZ >>> 0) * U16_TO_DEG)];
}

// ---- the requester the ROM fills to start a shell's effect param (init 0x3ff648..0x3ff700, 0x42c80c..0x42c8c8) ----
// 0x4a10c8: +0x1c |= 3; +0xc0 = position (the anchor, shell +0x1000); +0xd0 = parent = shell vtable +0x130 = the
// shell's own model interface (shell +0xfd0, vtable 0x1764cd8, forwards to the shell's uModel slots); +0x14 |=
// 0x40000000 with +0x40..+0x48 = ShellScale; +4 = 0; byte +0xc = byte shell +0x1054 (not read). The init then sets
// +0x14 |= 2 with +0x30..+0x38 = (X deg, Y deg, 0). 0x4a11e4: listId must be <= 7 and uniqueId >= 0 (else no
// effect); +8 = 3; start = shell vtable +0x138 (0x4a119c -> 0x53a7d8(shell, list, 2, uniqueId, req, ...)).
function effectRequest(D, mode, param, E, A){
  const p = mode.ef[param];
  if (!p || p[0] > 7 || p[1] < 0) return null;
  const L = D.lists[p[0]];
  if (!L) return null;
  return { param, listId: p[0], list: L.list, pel: L.pel, key: p[1],
           requester: { position: E.slice(), rotationDeg: [f(A[0] * U16_TO_DEG), f(A[1] * U16_TO_DEG), 0.0],
                        scale: [f(mode.scale), f(mode.scale), f(mode.scale)], parent: 'shell',
                        flags14: 0x40000002, flags1c: 3, type8: 3 } };
}

// ---- base04 (uShellEmBase04): init 0x3ff1a0, move 0x3ff938 -> 0x3ffa10, end 0x400234 ----------------------------
function params04(sh){          // sp_04's reader 0xe82944 (its vtable +0x14c)
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  return { joint: I(0),                       // +0x1624
           count: I(1),                       // +0x1628: trail entries
           angleMode: I(2),                   // +0x1630: 1 = owner angles + yaw from the matrix
           flags: (I(3) !== -1 ? 1 : 0) | (I(4) !== -1 ? 2 : 0),   // +0x162c (0xe82a14..0xe82a64)
           length: F(0),                      // +0x1634 (0x43aa78's factor: not modelled, see the header)
           life: F(1),                        // +0x1638 -> timer +0x15cc
           start: F(2),                       // +0x163c: the anchor's distance along the direction
           vec0: V(0), vec1: V(1) };          // +0x1640 offset in joint space, +0x1644 .x = pitch offset (degrees)
}

function init04(S, sh, J, owner){
  const k = params04(S.mode.sh);
  S.k = k;
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const [dx, dy, dz] = dirOf(A);
  const f2 = k.start;
  const ox = f(f2 * dx), oy = f(dy * f2), oz = f(f2 * dz);
  S.position = [f(P[0] + ox), f(oy + P[1]), f(oz + P[2])];           // +0x40
  if (k.count <= 0) return false;                                    // 0x3ff3d8: no trail -> delete
  const len = f(k.length - f2);
  const tx = f(dx * len), ty = f(dy * len), tz = f(dz * len);
  S.trail = [];                                                      // +0x15dc, count +0x15e0 (16-byte entries)
  for (let i = 0; i < k.count; i++){
    const t = f(f(k.count - i) / f(k.count));
    S.trail.push([mla(ox, tx, t), mla(oy, ty, t), mla(oz, tz, t)]);
  }
  S.timer = k.life;                                                  // +0x15cc
  S.shift = 0;                                                       // +0x15d0
  S.anchor = S.position.slice();                                     // +0x1000
  S.angles = A.slice();
  S.jointPoint = P;
  return true;
}

function move04(S, J, input, D){
  const k = S.k, owner = input.owner;
  S.prevPosition = S.position.slice();                               // +0x15f0
  const M = jointMatrix(J, k.joint);
  if (!M) return 'end';
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const [dx, dy, dz] = dirOf(A);
  const last = S.trail[S.trail.length - 1];
  S.position = [f(P[0] + last[0]), f(P[1] + last[1]), f(P[2] + last[2])];      // 0x3ffb80..0x3ffba0
  let ex, ey, ez;
  if (!(k.flags & 1)){ ex = f(dx * k.start); ey = f(dy * k.start); ez = f(dz * k.start); }
  else {                                                                       // 0x3ffbf4: along the oldest entry
    let s = f(last[1] * last[1]); s = mla(s, last[0], last[0]); s = mla(s, last[2], last[2]);
    const r = f(k.start * f(1.0 / sqrtf(s)));
    ex = f(last[0] * r); ey = f(last[1] * r); ez = f(last[2] * r);
  }
  S.anchor = [f(ex + P[0]), f(ey + P[1]), f(ez + P[2])];                       // +0x1000
  const len = k.length;                     // +0x15d4; flag 2 calls vtable +0x158 = 0x400564 (bx lr): unchanged
  S.trail[0] = [f(dx * len), f(dy * len), f(dz * len)];
  S.shift = mla(S.shift, input.dt, 0.5);                                       // 0x3ffcec
  while (S.shift >= 1.0){                                                      // 0x3ffd10: every entry moves one down
    for (let i = S.trail.length - 1; i >= 1; i--) S.trail[i] = S.trail[i - 1].slice();
    S.shift = f(S.shift + -1.0);
  }
  S.angles = A.slice();                                                        // +0xfe8
  S.jointPoint = P;
  return lifetime(S, input, D);
}

// ---- base55 (uShellEmBase55): init 0x42c5cc, move 0x42cb28 -> 0x42cc34, end 0x42d504 ---------------------------
function params55(sh){          // sp_55's reader 0xe831a8
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  return { joint: I(0),                       // +0x1644
           angleMode: I(1),                   // +0x164c
           length: F(0),                      // +0x1650
           life: F(1),                        // +0x1654 -> timer +0x15cc
           start: F(2),                       // +0x1658
           vec0: V(0), vec1: V(1) };          // +0x165c, +0x1660
}

function init55(S, sh, J, owner){
  const k = params55(S.mode.sh);
  S.k = k;
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  S.quat = quatOf(M);                                                // 0x42c950 -> 0x72dec(shell +0x1620, m)
  const [dx, dy, dz] = dirOf(A);
  S.position = [mla(P[0], k.start, dx), mla(P[1], dy, k.start), mla(P[2], k.start, dz)];   // 0x42c7a4
  S.timer = k.life;
  S.grow = 0;                                                        // +0x1610
  S.acc = 0;                                                         // +0x1614
  S.anchor = S.position.slice();
  S.angles = A.slice();
  S.jointPoint = P;
  return true;
}

function move55(S, J, input, D){
  const k = S.k, owner = input.owner;
  S.prevPosition = S.position.slice();
  const M = jointMatrix(J, k.joint);
  if (!M) return 'end';
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const qj = quatOf(M);
  const [dx, dy, dz] = dirOf(A);
  const step = f(input.dt * input.speed);                                    // 0xb0910: owner +0x1c * +0x50c
  S.grow = Math.min(mla(S.grow, step, 0.125), 1.0);                          // 0x42cd90 (vmin with 1.0)
  S.acc = f(step + S.acc);                                                   // 0x42cdd0
  if (S.acc >= 8.0){                                                         // 0x42ce3c: slerp toward the joint
    const t = f(8.0 / S.acc), q = S.quat;
    let dot = f(qj[1] * q[1]); dot = mla(dot, qj[0], q[0]); dot = mla(dot, qj[2], q[2]); dot = mla(dot, qj[3], q[3]);
    const neg = 0 > dot, c = neg ? f(-dot) : dot, sign = neg ? -1.0 : 1.0;
    let w1, w2 = t;
    if (c < f(0.9999998807907104)){                                          // 0x3f7ffffe
      const th = acosf(c);
      const inv = f(1.0 / sinf(th));
      w1 = f(sinf(f(f(1.0 - t) * th)) * inv);
      w2 = f(inv * sinf(f(t * th)));
    } else w1 = f(1.0 - t);
    const a = f(sign * w1);
    S.quat = [mla(f(qj[0] * a), q[0], w2), mla(f(qj[1] * a), q[1], w2), mla(f(qj[2] * a), q[2], w2), mla(f(qj[3] * a), q[3], w2)];
    S.acc = 8.0;
  }
  const [x, y, z, w] = S.quat;
  const lg = f(k.length * S.grow);                                           // +0x15d4
  const lgg = f(lg * S.grow);
  S.anchor = [mla(P[0], dx, k.start), mla(P[1], dy, k.start), mla(P[2], dz, k.start)];   // 0x42cfac..0x42cfe0
  const y2 = f(y + y), z2 = f(z + z), x2 = f(x + x);
  const ax = mla(f(y2 * w), x, z2);                                          // 2yw + 2xz
  const ay = mls(f(y * z2), x2, w);                                          // 2yz - 2xw
  const az = f(1.0 - mla(f(y * y2), x, x2));                                 // 1 - (2y^2 + 2x^2)
  S.position = [mla(P[0], ax, lgg), mla(P[1], ay, lgg), mla(P[2], az, lgg)];
  S.angles = A.slice();
  S.jointPoint = P;
  return lifetime(S, input, D);
}

// the end test both bases share (0x3ffd98 / 0x42d044): the timer runs on the OWNER's step (0xb0910); the shell ends
// when it runs out or the owner's motion is no longer the one it spawned in (+0x15d8 vs enemy +0x4b4)
function lifetime(S, input){
  let T = S.timer;
  if (T > 0){ T = f(T - f(input.dt * input.speed)); if (S.base === 'base04') T = T > 0 ? T : 0; else if (T < 0){ S.timer = 0; return 'end'; } S.timer = T; }
  if (!(T > 0)) return 'end';
  if (S.motion !== input.motion) return 'end';
  return 'keep';
}

// ---- base00 / base54: the thrown rocks (shell00, shell54), notes section 9 -------------------------------------------
// shell00 = uShellEm043_sp_00 : uShellEmBase00 -- init 0x3f8b80 (after the reader 0xe82304), move 0x3f96a0 -> 0x3f9738
// (state 1) / ending 0x3f986c, landing 0x3f8878, end 0x3f9ef4. shell54 = uShellEm043_sp_54 : uShellEmBase54 -- init
// 0x42aecc (reader 0xe82e8c), move 0x42b874 -> 0x42b980 / ending inline at 0x42b908, bounce 0x42bec8..0x42bff0,
// landing 0x42ac38, end 0x42c0c0. Every float operation below is the VFP instruction the code runs, in its order
// (vmla / vmls round the product first; vcvt.s32 = s32; ldrh / uxth = u16); library calls are Math.* rounded to
// float32. dev/shells-rock-check.mjs runs these flights against the ROM itself (the Unicorn harness in
// efx\agents\rock-scratch), move by move, bit for bit.
const SEG_EPS = f(1.1920928955078125e-07);  // 0x34000000 = 2^-23: a query segment shorter than this is not asked (0x183584)
const RAD_TO_DEG = f(57.2957763671875);     // 0x42652ee0 (0x43ae38)
const SLOPE_LIMIT = f(90.0);                // +0x15c4 = 90.0 (enemy-shell base ctor 0x43a78c): a surface this steep is type 0
const BOUNCE_UP = f(10.0);                  // vmov.f32 s4, #10.0 (0x42bee4)
const atanf = x => f(Math.atan(x));

// 9.3, the launch point p: the joint's world matrix M turns the common vec v by its 3x3 and adds row 3 -- no w divide
// (reader 0xe820e0..0xe82110, init 0x3f8e90..0x3f8ec0 + 0x3f9140.., base54 0x42b1ec..0x42b21c + 0x42b45c.. and
// 0x42b734..0x42b780: the same operations everywhere)
function launchPoint(M, v){
  const [x, y, z] = v;
  const ox = mla(mla(f(y * M[4]), x, M[0]), z, M[8]);
  const oy = mla(mla(f(y * M[5]), x, M[1]), z, M[9]);
  const oz = mla(mla(f(y * M[6]), x, M[2]), z, M[10]);
  return [f(ox + M[12]), f(oy + M[13]), f(oz + M[14])];
}

// 9.3, the pitch offset of shell00 modes 0..3 (reader 0xe82234..0xe822e4) and of every shell54 mode (0x42b6a4,
// 0x42b730..0x42b810): from the target's height over p and its horizontal distance; clamped to +22.5 / -11.25 degrees
function aimLinear(p, T){
  const dy = f(T[1] - p[1]), dx = f(p[0] - T[0]), dz = f(p[2] - T[2]);
  const a = s32(f(f(f(dy + 65.0) / 10.0) * 48.0));
  const h = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  const b = s32(f(f(f(h + -2100.0) / 50.0) * 96.0));
  const d = u16(-(b + a));
  return d < 0x8000 ? Math.min(d, 0x1000) : Math.max(d, 0xf800);
}

// 9.3, the pitch offset of shell00 modes 8..15: 0xe810e4(owner, &p, v = 50.0, g = 0.75) (literals 0xe82130 /
// 0xe82134) solves the launch at speed v under gravity g aimed 50 above the target (literal 0xe81250) and keeps the
// steeper root, the high lob; relative to the owner's X angle
function aimBallistic(p, T, X, v, g){
  const dx = f(p[0] - T[0]), dz = f(p[2] - T[2]);
  const d = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  const A = f(f(f(d * d) * g) / f(f(v * v) + f(v * v)));
  const B = f(d / A), C = f(f(f(T[1] - p[1]) + 50.0) / A);
  let D = nmls(f(C + 1.0), f(B * B), 0.25);                  // vnmls: (B*B) * 0.25 - (C + 1)
  D = D !== D ? D : (D > 0 ? D : 0);                          // vmax with 0.0 (0xe8118c): NaN stays NaN
  const r = sqrtf(D), hB = f(B * 0.5);
  const a1 = s32(mla(0.5, atanf(f(r - hB)), RAD_TO_U16));
  const a2 = s32(mla(0.5, atanf(f(f(-r) - hB)), RAD_TO_U16));
  const mag = a => u16((a & 0x8000) ? 0x10000 - a : a);      // 0xe811fc..0xe81228
  return u16((mag(a1) > mag(a2) ? a1 : a2) - X);
}

// 9.4.5, the launch velocity (0x3f91a0..0x3f928c; base54 0x42b4c8..0x42b5b4): (0, vy, vz) turned by Z, then X, then Y
// (each angle word's low half, ldrh, times 9.58738e-05); the literal 0.0 products stay in
function launchVelocity(vy, vz, A){
  const rz = f(u16(A[2]) * U16_TO_RAD), sz = sinf(rz), cz = cosf(rz);
  const x1 = mls(f(cz * 0.0), vy, sz), y1 = mla(f(vy * cz), sz, 0.0);
  const rx = f(u16(A[0]) * U16_TO_RAD), sx = sinf(rx), cx = cosf(rx);
  const y2 = mls(f(y1 * cx), vz, sx), z2 = mla(f(vz * cx), y1, sx);
  const ry = f(u16(A[1]) * U16_TO_RAD), sy = sinf(ry), cy = cosf(ry);
  return [mla(f(x1 * cy), z2, sy), y2, mls(f(z2 * cy), x1, sy)];
}

// 9.4.4, the per-frame acceleration +0x1020 (base00 vtable +0x170 = 0x3f9f98, base54 +0x164 = 0x42c164): the sh vec
// turned by Y (its x is not read); set once, at the init
function gravityOf(g, Yword){
  const ry = f(u16(Yword) * U16_TO_RAD), sy = sinf(ry), cy = cosf(ry);
  return [mla(f(cy * 0.0), g[2], sy), g[1], mls(f(g[2] * cy), sy, 0.0)];
}

// 0x539224, the flying step: t = the shell's dt (+0x1c) times vtable +0x90 (0x5392f8: 1.0), h = t*t*0.5; per axis
// pos += h*acc + vel*t (the velocity before this step), then vel += t*acc
function stepFlight(S, dt){
  const t = f(dt * 1.0), h = f(f(t * t) * 0.5), p = S.position, v = S.velocity, a = S.gravity;
  S.position = [0, 1, 2].map(i => f(mla(f(h * a[i]), v[i], t) + p[i]));
  S.velocity = [0, 1, 2].map(i => mla(v[i], t, a[i]));
}

// 0x183490's front and the stage, for the segment from the previous point B (anchor + off) to the new A (position +
// off). The ROM's own part: |A - B|^2 below 2^-23 is not queried (0x183560..0x18358c). The rest -- 0xc30b30, the
// stage's collision core -- is NOT READ; THE PLANE STAND-IN answers for it (the viewer's floor at floorY, not a ROM
// value): hit iff B.y >= y0 > A.y; contact c = B + t (A - B) per axis with t = (B.y - y0) / (B.y - A.y), c.y = y0;
// normal (0, 1, 0), attribute 0x10 (the ROM's own value for a hit with no attribute record, 0x183628). No floor
// given this step: nothing to hit.
function stageQuery(A, B, floorY){
  const dy = f(A[1] - B[1]), dx = f(A[0] - B[0]), dz = f(A[2] - B[2]);
  let d2 = f(dy * dy); d2 = mla(d2, dx, dx); d2 = mla(d2, dz, dz);
  if (d2 < SEG_EPS) return null;
  if (floorY == null) return null;
  const y0 = floorY;
  if (!(B[1] >= y0 && A[1] < y0)) return null;
  const t = f(f(B[1] - y0) / f(B[1] - A[1]));
  return { point: [f(B[0] + f(t * f(A[0] - B[0]))), y0, f(B[2] + f(t * f(A[2] - B[2])))], normal: [0, 1, 0], attr: 0x10 };
}

// 0x43addc..0x43ae58, the hit type: attribute & 0x22 -> 0; else 1, and 0 when the surface's angle from level
// reaches +0x15c4 (an unordered compare keeps 1). The ROM adds n.z twice where n.z^2 would be (0x43ae10 / 0x43ae14).
function hitType(attr, n){
  if (attr & 0x22) return 0;
  let s = f(n[1] * n[1]); s = mla(s, n[0], n[0]); s = f(n[2] + s); s = f(n[2] + s);
  return f(acosf(f(n[1] / sqrtf(s))) * RAD_TO_DEG) >= SLOPE_LIMIT ? 0 : 1;
}

// 0x43ac8c(shell, &out, &type, &result, off). Its hit path -- the hit slot +0x13ae != 0xff, the rock's attack having
// connected, type 2 at the hit position -- needs a hunter and never runs here; so the stage query: +0x15c2 == 0 ->
// mask 0x30, +0x15c3 == 0 -> 0x4a1e84 (base00: A = +0x40, B = +0x1000) or 0x4a1f68 (base54: both plus off) ->
// 0x183490; a nonzero return is a hit, typed as above.
function collide(S, off, floorY){
  const add = P => [f(P[0] + off[0]), f(P[1] + off[1]), f(P[2] + off[2])];
  const q = off ? stageQuery(add(S.position), add(S.anchor), floorY) : stageQuery(S.position, S.anchor, floorY);
  return q ? { point: q.point, normal: q.normal, attr: q.attr, type: hitType(q.attr, q.normal) } : null;
}

// The requester a rock fills (0x4a10c8 at 0x3f92e4, 0x3f8934, 0x42b60c, 0x42bfc8, 0x42acf4): +0xc0 = the given point,
// +0xd0 = the shell's model interface (shell +0xfd0: vtable +0x130), +0x14 |= 0x40000000 with ShellScale x3; the
// bases write nothing more, so NO rotation override (the breath's +0x14 |= 2). 0x4a11e4 refuses listId > 7 or
// uniqueId < 0. `kind`: 'flight' (param 0, on the shell), 'bounce' / 'landing' (at the contact). `lists`: the shell's
// own .shl EffectLists when its class names them (Nargacuga), else the monster's.
function rockRequest(D, mode, param, point, kind, lists){
  const p = mode.ef[param];
  if (!p || p[0] > 7 || p[1] < 0) return null;
  const L = (lists || D.lists)[p[0]];
  if (!L) return null;
  const s = f(mode.scale);
  return { param, listId: p[0], list: L.list, pel: L.pel, key: p[1], kind,
           requester: { position: point.slice(), rotationDeg: null, scale: [s, s, s], parent: 'shell',
                        flags14: 0x40000000, flags1c: 3, type8: 3 } };
}

// sp_00's reader 0xe82304: what base00 reads, from the mode's files and the common FUP
function params00(def, mode, idx){
  const c = def.cmn, sh = mode.sh, late = (idx & 0xf8) === 8;
  return { joint: c.ints[0],                                  // +0x15dc: common int 0
           flight: f(c.floats[late ? 1 : 0]),                 // +0x15fc: common float [mode & 0xf8 == 8] (0xe8238c)
           flags: 0x20 | (late ? 0x40 : 0),                   // +0x15e8: angles from the setup; 0x40 keeps them (0xe823ac)
           vz: f(sh.floats[0]), vy: f(sh.floats[1]),          // +0x15f4 / +0x15f8: sh floats 0 / 1
           vec: c.vecs[(idx & 0xfc) === 0xc ? 1 : 0].map(f),  // +0x1610: &common vec [(mode & 0xfc) == 0xc] (0xe82430)
           gravity: sh.vecs[0].map(f) };                      // +0x161c: &sh vec 0
}

// sp_54's reader 0xe82e8c
function params54(def, mode, idx){
  const c = def.cmn, sh = mode.sh, late = (idx & 0xfc) === 4;
  return { joint: c.ints[0],                                  // +0x15e4: common int 0
           bounces: c.ints[1],                                // +0x15f0: common int 1, bounces before the landing
           vz: f(sh.floats[0]), vy: f(sh.floats[1]),          // +0x1608 / +0x160c: sh floats 0 / 1
           flight: f(c.floats[0]),                            // +0x1610
           lift: f(c.floats[late ? 2 : 1]),                   // +0x1614: common float 1, modes 4..7 float 2 (0xe82ea8, 0xe83020)
           bounceSpeed: f(c.floats[3]),                       // +0x1618
           bounceFactor: f(c.floats[4]),                      // +0x161c
           across: f(c.floats[5]),                            // +0x1620: the horizontal speed factor at a bounce
           holdEnd: f(124.0),                                 // +0x1624 = 124.0 (0xe83080..0xe83098)
           vec: c.vecs[late ? 1 : 0].map(f),                  // +0x1628: &common vec [(mode & 0xfc) == 4]
           gravity: sh.vecs[0].map(f),                        // +0x162c: &sh vec 0
           flags: late ? 0x104 : 4,                           // +0x15fc (0xe8305c..0xe8307c; the ctor leaves 0)
           motions: [0x218, 0x217] };                         // +0x15f4 / +0x15f8: the rock motions, L2 M24 / M23
}

// base00 init 0x3f8b80 with the reader's aim. J = the joint matrices built for the previous pose; `got` = the inputs
// that are not read (target, owner angles).
function init00(S, def, J, got){
  const k = S.k = params00(def, S.mode, S.modeIndex);
  const M = jointMatrix(J, k.joint);                    // 0xc15a4 (reader 0xe820a4, init 0x3f8d70)
  if (!M) return false;
  const p = launchPoint(M, k.vec);
  // the aim by mode (0xe82120..: 0x4a0ee4 = the mode): 8..15 the lob, 0..3 the linear offset; 4..7 (0xe82178, the
  // direct angle) is not transcribed -- no read stream plays those modes
  let d;
  if (S.modeIndex >= 8 && S.modeIndex <= 15) d = aimBallistic(p, got.target, got.ownerX, f(50.0), f(0.75));
  else if (S.modeIndex <= 3) d = aimLinear(p, got.target);
  else return false;
  const setup = [(got.ownerX + d) >>> 0, got.ownerY, 0];  // setup +0x20 = X + d, +0x24 = Y, +0x28 = 0 (0xe82204..)
  // flag 0x20: the angle words are the setup's (0x3f8c9c); the init then adds 0 to X and Y (0x3f9378 / vtable +0x16c:
  // flag bits 0 / 1 clear, the degree offsets +0x15ec / +0x15f0 are 0 from the ctor)
  S.angles = setup.slice();
  S.timer = k.flight;                                   // +0x162c = +0x15fc
  S.position = p;                                       // +0x40 = row 3 + offset (0x3f8d74, 0x3f9140..0x3f9168)
  S.anchor = p.slice();                                 // +0x1000 (0x3f916c..0x3f918c)
  S.gravity = gravityOf(k.gravity, S.angles[1]);        // +0x1020
  S.velocity = launchVelocity(k.vy, k.vz, S.angles);    // +0x1010
  S.launch = { point: p.slice(), target: got.target.slice(), aim: d, setup, angles: S.angles.slice(),
               position: S.position.slice(), anchor: S.anchor.slice(), velocity: S.velocity.slice(),
               gravity: S.gravity.slice(), timer: S.timer };
  return true;
}

// base54 init 0x42aecc (its aim 0x42b6a4 runs right after the reader)
function init54(S, def, J, got){
  const k = S.k = params54(def, S.mode, S.modeIndex);
  const M = jointMatrix(J, k.joint);                    // 0xc15a4 (0x42b0c8; the aim's own read 0x42b6fc)
  if (!M) return false;
  const p = launchPoint(M, k.vec);
  const d = aimLinear(p, got.target);
  const setup = [(got.ownerX + d) >>> 0, got.ownerY, 0];  // 0x42b81c..0x42b830
  S.held = (k.flags & 0x100) !== 0;                     // byte +7 = 1 unless flag 0x100 (0x42af50..0x42af78)
  S.offset = [0, f(-k.lift), 0];                        // +0x1660..+0x1668: the ctor's zero vector, y = -lift (0x42af94)
  S.bounceSpeed = k.bounceSpeed;                        // +0x1654 = +0x1618
  S.bounces = 0;                                        // +0x1650 (ctor)
  S.angles = setup.slice();                             // flag 4: the setup's words (0x42aff4); X / Y += 0 (+0x1600 / +0x1604)
  S.timer = k.flight;                                   // +0x1634 = +0x1610
  S.position = [p[0], f(k.lift + p[1]), p[2]];          // 0x42b45c..0x42b490: y = lift + (o.y + m13)
  S.anchor = S.position.slice();
  S.gravity = gravityOf(k.gravity, S.angles[1]);        // vtable +0x164
  S.velocity = launchVelocity(k.vy, k.vz, S.angles);    // 0x42b4c8..0x42b5b4, (vy, vz) = (+0x160c, +0x1608)
  S.launch = { point: p.slice(), target: got.target.slice(), aim: d, setup, angles: S.angles.slice(),
               position: S.position.slice(), anchor: S.anchor.slice(), velocity: S.velocity.slice(),
               gravity: S.gravity.slice(), timer: S.timer, held: S.held };
  return true;
}

// the flight timer (base00 0x3f9760..0x3f97f8 on +0x162c, base54 0x42b9a8..0x42ba00 on +0x1634): 'query' goes on to
// the collision, 'end' ends the shell. A flight time <= 0 takes another branch (0x3f97bc / 0x42ba04: the hit-slot
// bytes +0x13ad / +0x1465), not transcribed -- every transcribed mode's is positive.
function flightTimer(S, flight, dt){
  if (!(flight > 0)) throw new Error('shells.js: a rock with flight time ' + flight + ' (0x3f97bc / 0x42ba04, not transcribed)');
  const T = S.timer;
  if (!(T > 0)){ S.timer = 0; return 'end'; }                       // ble
  const t = f(T - dt);
  S.timer = (0 >= t) ? 0 : t;                                        // vselge
  return t > 0 ? 'query' : 'end';                                    // bhi
}

// a bounce's or landing's start: the param's requester at the contact point, handle -> +0x1628 (base00) / +0x163c
// (base54), over the previous one. A param the mode lacks is not started and leaves the handle as it was.
function contactStart(S, D, param, point, kind){
  if (!S.mode.ef[param]) return;
  const rq = rockRequest(D, S.mode, param, point, kind, listsOf(D, S));
  S.events.push(rq ? { ev: 'start', param, kind, start: rq } : { ev: 'refused', param, kind });
  S.effect2 = rq ? { param, key: rq.key, kind, move: S.moves } : null;
  if (rq && S.effects[param]) S.effects[param].started = true;
}

// vtable +0x150 (base00 0x3f8878, base54 0x42ac38): by the type, EffectParam 1 (type 0), 2 (type 1) or 3 (type 2) at
// the contact point (types 0 / 1 first call 0x43ac04 with +0x15e0 / +0x15e4, base54 +0x15e8 / +0x15ec: -1 from the
// ctors, so it returns at once); the caller then ends the shell (vtable +0x148 with 0)
function landing(S, D, hit){
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}

// base54's bounce (0x42bec8..0x42bff0): type 1 with fewer than +0x15f0 bounces so far
function bounce(S, D, hit){
  const k = S.k, c = hit.point, v = S.velocity;
  S.position = [c[0], f(f(c[1] + BOUNCE_UP) + k.lift), c[2]];      // w = 0
  S.velocity = [f(k.across * v[0]), S.bounceSpeed, f(k.across * v[2])];
  const param = S.bounces === 0 ? 4 : 5;                             // subeq at 0x42bf68: EffectParam 4 first, then 5
  S.bounceSpeed = f(S.bounceSpeed * k.bounceFactor);                 // 0x42bf6c
  contactStart(S, D, param, c, 'bounce');                            // handle -> +0x163c
  S.bounces += 1;
}

// base00's state-1 move (0x3f9738)
function move00(S, ctx, D){
  const k = S.k;
  S.anchor = S.position.slice();                        // 0x3f98f4 (vtable +0x160): anchor = position, then the step
  stepFlight(S, ctx.dt);
  if (!(k.flags & 0x40)){                               // 0x3f9948..0x3f99d0: X / Y from the new velocity, as u16
    const [vx, vy, vz] = S.velocity;
    const h = sqrtf(mla(f(vz * vz), vx, vx));
    S.angles = [u16(s32(mla(0.5, atan2f(f(-vy), h), RAD_TO_U16))), u16(s32(mla(0.5, atan2f(vx, vz), RAD_TO_U16))), S.angles[2]];
  }
  const r = flightTimer(S, k.flight, ctx.dt);
  if (r !== 'query') return r;
  const hit = collide(S, null, ctx.floorY);             // vtable +0x168 = 0x3f99e0
  if (!hit) return 'keep';
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  (LANDING[S.cls] || landing)(S, D, hit, ctx);          // vtable +0x150: base00's 0x3f8878 unless the class has its own
  return 'end';
}

// base54's state-1 move (0x42b980)
function move54(S, J, ctx, D){
  const k = S.k;
  S.anchor = S.position.slice();                        // vtable +0x15c = 0x42c020; base54 never turns its angles
  stepFlight(S, ctx.dt);
  const r = flightTimer(S, k.flight, ctx.dt);
  if (r !== 'query') return r;
  if (S.held){                                          // byte +7 == 0 (0x42ba24..0x42baf4)
    // held while the owner plays a rock motion (u16 +0x4b4 == +0x15f8 / +0x15f4) and 0xb09a4(owner, 2, 0, 124.0,
    // 0.0) -- 0x72714 mode 2 on the frame pair the enemy's action code saw this frame: F[k-1] < 124
    if ((ctx.ownerMotion === k.motions[0] || ctx.ownerMotion === k.motions[1]) && ctx.frameSeen < k.holdEnd){
      const M = jointMatrix(J, k.joint);                // 0x42bb04: this frame's joints (the shell moves after the build)
      if (M) S.position = launchPoint(M, k.vec);        // no lift; the velocity keeps integrating
    } else S.held = false;                              // release: byte +7 = 1 (0x42b6a4 re-aims into the setup; nothing reads it, 9.9)
  }
  const hit = collide(S, S.offset, ctx.floorY);         // 0x42bdd0: off = &+0x1660
  if (!hit) return 'keep';
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  if (hit.type === 1 && S.bounces < k.bounces){ bounce(S, D, hit); return 'keep'; }
  landing(S, D, hit);
  return 'end';
}

// one rock's move this step (vtable +0x24: base00 0x3f96a0, base54 0x42b874)
function stepRock(S, J, ctx, input, D, out){
  S.events = [];
  S.place = null;                                       // the shell never places its effect (no 0x329c9c / 0x329d04)
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  // a handle whose unit left states 1 / 2 is dropped first (0x3f96ac..0x3f9700, 0x42b880..0x42b8e4)
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.effect2 && !S.effect2.gone && !alive(S.effect2)) S.effect2.gone = true;
  if (S.state === 1){
    S.moves++;
    const r = S.base === 'base00' ? move00(S, ctx, D) : move54(S, J, ctx, D);
    for (const e of S.events){
      if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
      // a shell the move created (0x48b884) that is not stepped here (Nargacuga's drop); Rathian's are stepped shells,
      // reported in out.spawned when they are made
      else if (e.ev === 'create' && !e.stepped) out.created.push({ shell: S, create: e });
    }
    if (r === 'end'){                                   // vtable +0x148 with 0 (0x3f9ef4 / 0x42c0c0)
      end(S);
      if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
      out.ended.push(S);
    }
  } else if (S.state === 0xfe){                         // the ending (0x3f986c / 0x42b908): wait for the effects
    const T = S.timer;
    if (!(T > 0)){ S.timer = 0; S.state = 0xff; }                                    // ble: delete
    else {
      const t = f(T - ctx.dt);
      S.timer = (0 >= t) ? 0 : t;
      if (t <= 0) S.state = 0xff;                                                    // bls: delete
      else if (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone)) S.state = 0xff;   // both handles gone
    }
  }
}

// the rock's inputs the ROM takes from the game and this module does not read: all required, no defaults
function rockInputs(input){
  const r = input.rock, o = input.owner, t = r && r.target;
  if (!r) return { why: 'no input.rock' };
  if (!t || !Number.isFinite(t.x) || !Number.isFinite(t.y) || !Number.isFinite(t.z)) return { why: 'no target (input.rock.target)' };
  if (!Number.isFinite(r.floorY)) return { why: 'no floor (input.rock.floorY)' };
  if (!o || !Number.isFinite(o.y)) return { why: 'no owner facing (input.owner.y)' };
  return { target: [f(t.x), f(t.y), f(t.z)], ownerX: o.x >>> 0, ownerY: o.y >>> 0 };
}

// the owner's motion id (enemy u16 +0x4b4) of a List 2 clip: 0x200 + its slot (0x217 = Motion[23], 0x219 = Motion[25],
// 0x229 = Motion[41]: sections 4 and 6); null otherwise (only 0x217 / 0x218 are ever compared)
function motionIdOf(list, clip){
  const m = /^Motion\[(\d+)\]$/.exec(clip || '');
  return String(list) === '2' && m ? 0x200 + Number(m[1]) : null;
}

const isRockAction = (D, a) => { const d = D.shells[a.shell]; return !!d && (d.base === 'base00' || d.base === 'base54'); };
// the joint a shell's init reads (base01 -- Nargacuga's shell01 -- reads none)
// (Rathian's base01, reader 0xd0e6a0: the joint +0x15e4 = int 1 when flag 1 (int 0 != -1) is set -- modes 0 and 44..46;
// base11 reads none)
const shellJoint = (def, mode) => def.base === 'base01' ? (def.reader === 0xd0e6a0 && mode.sh.ints[0] !== -1 ? mode.sh.ints[1] : null)
                                : def.base === 'base11' ? null : def.cmn ? def.cmn.ints[0] : mode.sh.ints[0];
// the effect lists a shell's requests name: its own .shl's when the data gives them per shell, else the monster's
const listsOf = (D, S) => (D.shells[S.shell] && D.shells[S.shell].lists) || D.lists;

function spawnRock(state, D, a, J, ctx, got){
  const def = D.shells[a.shell], mode = def && def.modes[a.mode];
  if (!mode) return null;                                             // a mode not transcribed
  const S = { id: state.nextId++, monId: state.monId, shell: a.shell, cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: a.mode, action: a.action, spawnFrame: a.frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, trail: null,
              timer: 0, moves: 0, bounces: 0, held: false, launch: null, events: [], folder: def.folder,
              effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key, started: false }));
  const ok = def.base === 'base00' ? init00(S, def, J, got) : init54(S, def, J, got);
  if (!ok) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight');           // EffectParam 0 at +0x40 -> +0x1624 / +0x1638
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}

// ---- base03 (uShellEmBase03): the bolt that runs along the ground ------------------------------------------------
// KHEZU's shell03 (uShellEm003_sp_03). ctor 0x3fd830 (over base00's 0x3f8a04), init 0x3fd9d8 (base00's 0x3f8b80 runs
// first), state-1 move 0x3fdce4 (its vtable +0x158; +0x24 is base00's own 0x3f96a0, which dispatches by the state
// byte and keeps base00's ending), the ground follow 0x3fdf18, end 0x3f9ef4. The bolt is aimed by its file's fan
// angle, launched at its file's speed, dropped onto the ground under the joint, and then walks the floor until its
// timer runs out.
//
// THE STAGE. Every query is the plane stand-in's (stageQuery): the init asks the segment 500 below to 500 above the
// joint point (+0x1678 / +0x1674) and every move asks 250 either side of the stepped point (+0x1680 / +0x167c) --
// all four 500.0 / 250.0 from the ctor (0x3fd884..0x3fd8ac) -- plus, on the second ground path (climb03), two probes
// 3000 either way and one wall segment. NOT TRANSCRIBED, because a horizontal plane cannot answer them: the forward
// query the move makes when the ground one misses (0x3fe7f8, mask 0x20 -- a wall), the sloped branch (0x3fe8c4, when
// the surface normal leans along the heading) and the climb (0x3fe220, a wall with the ground more than 150.0 above
// or below it); each of the three throws where the ROM would branch, so nothing silently takes another path.
function params03(def, mode){          // sp_03's reader 0xd21b10 (vtable +0x14c)
  const sh = mode.sh;
  return { joint: sh.ints[0],                        // +0x15dc: sh int 0 (base00's init reads it, 0x3f8d58)
           ground: sh.ints[1],                       // +0x1664 bit 0 = (sh int 1 != -1): the other ground path
           fanDeg: f(sh.floats[0]),                  // +0x15f0: the Y offset in degrees (0x3f9cc4 makes the word)
           speed: f(sh.floats[1]),                   // +0x15f4: the launch speed along +Z (0x3f91a0, again 0x3fdc90)
           life: f(sh.floats[2]),                    // +0x15fc -> the timer +0x162c (0x3f8cc0)
           vec: (sh.vecs[0] || ZERO3).map(f),        // +0x1610: the offset from the joint (0x3f8e40)
           reach: f(500.0), follow: f(250.0) };      // +0x1674 / +0x1678 and +0x167c / +0x1680 (ctor 0x3fd830)
}

// base00's init 0x3f8b80 as sp_03's reader runs it -- its flag word +0x15e8 is never written, so every test there is
// clear: the joint gives the point, the owner gives the angle words, the offset turns with the joint -- and then
// base03's own init 0x3fd9d8. `got` = the inputs that are not read (the owner's angle words); the floor is ctx's.
function init03(S, def, J, got, ctx){
  const k = S.k = params03(def, S.mode);
  const M = jointMatrix(J, k.joint);                     // 0xc15a4 (0x3f8d70)
  if (!M) return false;
  const p = launchPoint(M, k.vec);                       // 0x3f8e60..0x3f8ecc: the offset in the joint's rotation
  // the angle words: the owner block's X / Y and 0 (0x3f8c70..0x3f8c94), each with the reader's degree offset added
  // as a u16 -- X from +0x15ec (0 here, 0x3f9378) and Y from +0x15f0, the fan angle (0x3f9cc4); both uxth before the
  // add (0x3f9588 / 0x3f9ed8), and the add itself is a plain 32-bit store (0x3f8fec / 0x3f9034)
  const dX = u16(s32(mla(0.5, 0.0, DEG_TO_U16))), dY = u16(s32(mla(0.5, k.fanDeg, DEG_TO_U16)));
  S.angles = [(got.ownerX + dX) >>> 0, (got.ownerY + dY) >>> 0, 0];
  S.timer = k.life;                                      // +0x162c = +0x15fc (0x3f8cc0)
  S.position = p;                                        // +0x40: the joint point plus the offset (0x3f913c)
  S.anchor = p.slice();                                  // +0x1000 (0x3f916c)
  S.gravity = ZERO3.slice();                             // +0x1020: base00's +0x170 turns +0x161c, which sp_03 never writes
  S.velocity = launchVelocity(0.0, k.speed, S.angles);   // 0x3f91a0: (0, +0x15f8 = 0, +0x15f4) turned by the words
  // base03's init: the ground under the spawn point, 500 either way (0x3fda70..0x3fdafc)
  const A = [p[0], f(p[1] - k.reach), p[2]], B = [p[0], f(p[1] + k.reach), p[2]];
  const hit = stageQuery(A, B, ctx.floorY);
  S.launch = { point: p.slice(), angles: S.angles.slice(), query: [A, B], ground: hit ? hit.point.slice() : null };
  if (!hit) return false;                                // 0x3fdb30: vtable +0x148 with 1 -- no ground, no bolt
  S.position = [p[0], hit.point[1], p[2]];               // 0x3fdb08: y = the contact's
  S.anchor = S.position.slice();                         // +0x1000..+0x100c (0x3fdb48..0x3fdb70)
  // the flags' bit 2 is clear (nothing sets it here), so the timer stays the file's (0x3fdb7c..0x3fdb90), and the
  // velocity is made again from the angle words with the X word taken as 0 (0x3fdc68..0x3fdc98, 0x3f95a4)
  S.velocity = launchVelocity(0.0, k.speed, [0, S.angles[1], S.angles[2]]);
  S.launchVelocity = S.velocity.slice();                 // +0x1690..+0x1698, what the ground follow rescales
  S.launch.velocity = S.velocity.slice();
  return true;
}

// the ground under the shell, every move: 0x3fdf18 with the flags' bit 0 clear (sh int 1 == -1). Returns the ROM's
// own code -- 0x11 when it found ground (the only one a plane can give), 0x22 when it did not -- which the move
// hands to the hit record (0x3feb38; not visual: the shell has no hit slot here, byte +0x13ae = 0xff).
function follow03(S, ctx){
  const k = S.k, p = S.position;
  const A = [p[0], f(p[1] - k.follow), p[2]], B = [p[0], f(p[1] + k.follow), p[2]];
  const hit = stageQuery(A, B, ctx.floorY);              // 0x3fe690..0x3fe728, mask 0x10
  if (!hit) return 0x22;                                 // 0x3fe7f8's forward query cannot hit a horizontal plane
  // 0x3fe758..0x3fe7ec: the heading from the Y word against the normal the query wrote (+0x16c0 = the result
  // record's +0x20). The literal the heading leans by is 0.0 (0x3feb08), so the two terms are sin and cos.
  const rad = f(u16(S.angles[1]) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  const n = hit.normal;
  const h8 = mla(sn, cs, 0.0), h0 = mls(cs, sn, 0.0);
  let d = f(n[1] * 0.0); d = mla(d, n[0], h8); d = mla(d, n[2], h0);
  if (d !== 0) throw new Error('shells.js: a base03 bolt on a leaning surface (0x3fe8c4, not transcribed)');
  const s4 = f(h0 * d), s0 = f(h8 * d);
  let s16 = f(s0 * s0); s16 = mla(s16, n[1], n[1]); s16 = mla(s16, s4, s4);
  let s20 = mla(n[1], s0, 0.0); s20 = mla(s20, s4, 0.0);
  S.angles = [0, S.angles[1], S.angles[2]];              // 0x3fe7e0 / 0x3fea00: the X word is set to 0
  let c = f(s20 / sqrtf(s16));                           // 0x3fe9fc / 0x3fea18
  // the sign trick at 0x3fea2c (c > 0) and 0x3fea48: min(c, 1) and -min(-c, 1)
  c = c > 0 ? f(Math.min(c, 1.0)) : f(-Math.min(f(-c), 1.0));
  const factor = f(mla(f(90.0), acosf(c), f(-RAD_TO_DEG)) / f(90.0));   // 0x3fea64..0x3feaac
  S.velocity = S.launchVelocity.map(v => f(v * factor));                 // +0x1010..+0x1018 = +0x1690.. times it
  S.position = [S.position[0], hit.point[1], S.position[2]];             // 0x3feadc: only y is taken
  S.events.push({ ev: 'ground', point: hit.point.slice(), factor });
  return 0x11;
}

// the other ground path, taken when the file's sh int 1 is not -1 (flags +0x1664 bit 0): 0x3fdfcc -> 0x3fe074,
// entered while the state word +0x16d0 is 0. Before the follow it probes the ground under the new point and under
// the old one (3000 either way, mask 0x10: 0x3fe180 / 0x3fe1bc, their answers going to the shell's own hit record
// +0x1060, which nothing on this path reads), then asks whether a wall stands between them -- the segment from the
// old point to the new, both raised 40.0, mask 0x20 with bit 6 of the query flags cleared (0x3fe204). A horizontal
// plane cannot answer that one: both ends are at the same height, so it never hits, and the shell follows the
// ground exactly as the other modes do (0x3fe21c joins them at 0x3fe688). NOT TRANSCRIBED: what the ROM does when
// it does hit and the two ground heights differ by more than 150.0 (0x3fe220..0x3fe23c) -- the bolt climbs.
function climb03(S, ctx){
  const p = S.position, a = S.anchor, up = f(3000.0), down = f(-3000.0), lift = f(40.0);
  stageQuery([p[0], f(p[1] + down), p[2]], [p[0], f(p[1] + up), p[2]], ctx.floorY);      // 0x3fe180
  stageQuery([a[0], f(a[1] + down), a[2]], [a[0], f(a[1] + up), a[2]], ctx.floorY);      // 0x3fe1bc
  const wall = stageQuery([p[0], f(p[1] + lift), p[2]], [a[0], f(a[1] + lift), a[2]], ctx.floorY);
  if (wall) throw new Error('shells.js: a base03 bolt met a wall (0x3fe220, not transcribed)');
  return follow03(S, ctx);
}

// base03's state-1 move 0x3fdce4 (sp_03's vtable +0x158)
function move03(S, ctx){
  S.anchor = S.position.slice();                         // +0x1000..+0x100c (0x3fdd00..0x3fdd2c)
  stepFlight(S, ctx.dt);                                 // 0x539224: the acceleration is zero here
  // 0x3fdf74: which ground path, by the flags' bit 0 (the reader sets it from sh int 1)
  S.ground = (S.k.ground === -1 ? follow03 : climb03)(S, ctx);      // 0x3fdf18
  // 0x3fdd54: the file's life is above 0, so the timer decides (0x3f9814 counts +0x162c down by the shell's dt and
  // returns 1 at 0). The life <= 0 path (0x3fdd84) reads hit-slot bytes +0x13ad / +0x1465: NOT READ.
  if (!(S.k.life > 0)) throw new Error('shells.js: a base03 bolt with life ' + S.k.life + ' (0x3fdd84, not transcribed)');
  const T = S.timer;
  if (!(T > 0)){ S.timer = 0; return 'end'; }
  const t = f(T - ctx.dt);
  S.timer = (0 >= t) ? 0 : t;
  return t > 0 ? 'keep' : 'end';
}

// one bolt's step (vtable +0x24 = base00's 0x3f96a0: state 1 -> sp_03's +0x158, state 0xfe -> base00's 0x3f986c)
function stepBolt(S, ctx, input, D, out){
  S.events = [];
  S.place = null;                                        // the shell never places its effect (no 0x329c9c / 0x329d04)
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;     // 0x3f96ac
  if (S.state === 1){
    S.moves++;
    const r = move03(S, ctx);
    if (r === 'end'){                                    // vtable +0x148 with 0 (0x3f9ef4)
      end(S);
      if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
      out.ended.push(S);
    }
  } else if (S.state === 0xfe){                          // base00's ending 0x3f986c: wait for the effect
    const T = S.timer;
    if (!(T > 0)){ S.timer = 0; S.state = 0xff; }
    else {
      const t = f(T - ctx.dt);
      S.timer = (0 >= t) ? 0 : t;
      if (t <= 0) S.state = 0xff;
      else if (!(S.effect && !S.effect.gone)) S.state = 0xff;
    }
  }
}

// the bolts one lightning action makes, all in the same step: 0xd16e08's index table 0xd16f30 names the modes
function spawnBolts(state, D, a, J, ctx, got, out){
  const def = D.shells[a.shell], lists = def.lists || D.lists, made = [];
  for (const m of a.modes){
    const mode = def.modes[m];
    if (!mode) continue;                                 // a mode with no ShellInfoList entry
    const S = { id: state.nextId++, monId: state.monId, shell: a.shell, cls: def.cls, globalId: def.id, base: def.base,
                mode, modeIndex: m, action: a.action, spawnFrame: a.frame, motion: ctx.motion, state: 1,
                position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
                launchVelocity: null, timer: 0, moves: 0, ground: 0, launch: null, events: [], folder: def.folder,
                effect: null, effect2: null, start: null, place: null, stop: null };
    S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
    if (!init03(S, def, J, got, ctx)) continue;          // the init's own refusal deletes the shell
    S.prevPosition = S.position.slice();
    S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);   // 0x3f9298..0x3f9304, at +0x40
    S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
    if (S.start) S.effects[0].started = true;
    made.push(S);
  }
  return made;
}

// what a bolt's spawn reads from the game and this module does not: the owner's angle words and the stage's floor
function boltInputs(input){
  const o = input.owner, r = input.rock;
  if (!o || !Number.isFinite(o.y)) return { why: 'no owner facing (input.owner.y)' };
  if (!r || !Number.isFinite(r.floorY)) return { why: 'no floor (input.rock.floorY)' };
  return { ownerX: (o.x || 0) >>> 0, ownerY: o.y >>> 0 };
}

// ---- Nargacuga's tail spikes: base00 with uShellEm037_sp_00's own reader, init path and landing ------------------------
// Notes shells-em037.md sections 2..5. The flight is base00's, exactly as Savage's rock above (move 0x3f96a0 -> the
// class's state-1 move 0xe5953c -> 0x3f9738: move00 / stepRock); what is the class's own is below: the reader
// 0xe59050 (params37), base00's init 0x3f8b80 as it runs with that reader's flags (init37: the angle words, the X
// adjust 0x3f9378 with the aim 0x3f9b58 and the circular clamp, the Y adjust 0x3f9cc4), the landing 0xe59334
// (landing37, with the shell01 drop 0xe593d8), and the spawner 0xe48fc8, which makes all of an action's spikes at
// once. dev/shells-spike-check.mjs runs them against the ROM's flights (efx\agents\narga-shell-scratch\
// narga-spike-reference.json: 0xe48fc8, 0xe59014, 0xe594d4 and 0x3f96a0 run on the ROM), move by move, bit for bit.

// sp_00's reader 0xe59050 (vtable +0x14c): what base00 reads, from the mode's ShellParam (getters 0x4a2470 / 0x4a24f8 /
// 0x4a2584; an index past a file's end reads 0 / 0.0 / the zero vector)
function params37(sh){
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  // +0x15e8 (0xe590f4..0xe591c0): bit 0 = int 1 != -1, bit 1 = int 2 != -1, bit 2 always, bit 3 = int 4 != -1, bit 5
  // (0x20) = int 6 != -1, bit 9 (0x200) = int 7 != -1; every other bit keeps base00's ctor 0 (0x3f8ab0). em037_00:
  // 0x25 (mode 0), 0x24 (modes 1..7), 0x05 (modes 9..23), as the ROM leaves them after the init
  const flags = (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | 4 | (I(4) !== -1 ? 8 : 0) | (I(6) !== -1 ? 0x20 : 0) |
                (I(7) !== -1 ? 0x200 : 0);
  return { joint: I(0),                    // +0x15dc: sh int 0 (143)
           flags,
           xDeg: F(0), yDeg: F(1),         // +0x15ec / +0x15f0: the X / Y offsets, degrees
           vz: F(2),                       // +0x15f4: launch speed along +Z
           vy: F(8),                       // +0x15f8: along +Y (float 8, read before float 3)
           flight: F(3),                   // +0x15fc: flight time
           xLo: F(4), xHi: F(5),           // +0x1600 / +0x1604: the X clamp, degrees
           yLo: F(6), yHi: F(7),           // +0x1608 / +0x160c: the Y clamp
           vec: V(0),                      // +0x1610 = &vec 0: the launch offset in the joint's space
           gravity: V(2),                  // +0x161c = &vec 2 (+0x1614 = 0; +0x1618 keeps the ctor's zero vector)
           b1664: I(5) !== -1 };           // byte +0x1664: 0x43b2b0 after each move (0xe59574) -- 0 in every em037_00 mode
}

// 0x3f9b58(shell, &aX, &aY, from, T, off): the angles from `from` to the target T, as u16. off = [+0x1618], which
// base00's ctor points at the zero vector (0x3f8a98) and Nargacuga's reader leaves: its branch runs with (0, 0, 0) --
// the yaw it turns the offset by and the additions are kept as the ROM computes them (they add signed zeros).
// Rathian's reader (0xd0d988) points it at (0, f6, 0) (+0x1660..+0x1668): the offset turned by the first yaw is added
// to the difference, its y to dy. It also writes +0x1640..+0x1648 = T + the turned offset (`target`), which nothing
// reads after the init.
const ZERO3 = [0, 0, 0];
function aim37(from, T, off = ZERO3){
  let dx = f(T[0] - from[0]), dy = f(T[1] - from[1]), dz = f(T[2] - from[2]);
  const r = f(u16(s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16))) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const ox = mla(f(off[0] * cs), off[2], sn), oz = mls(f(off[2] * cs), off[0], sn);     // 0x3f9bf4..0x3f9c04
  dy = f(dy + off[1]); dz = f(dz + oz); dx = f(dx + ox);                                // 0x3f9c14..0x3f9c28
  const Y = s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16));                                  // 0x3f9c54..0x3f9c84
  const h = sqrtf(mla(f(dz * dz), dx, dx));
  const X = s32(mla(0.5, atan2f(f(-dy), h), RAD_TO_U16));                               // 0x3f9c9c..0x3f9cb0
  return { X: u16(X), Y: u16(Y), target: [f(T[0] + ox), f(off[1] + T[1]), f(oz + T[2])] };
}

// the circular clamp of a 32-bit angle v to [lo, hi] (X 0x3f9530..0x3f9588, Y 0x3f9e80..0x3f9ed8): d = u16(v - lo),
// r = u16(hi - lo); d <= r keeps u16(v); else the nearer end, hi when (0x8000 | r >> 1) > d, else lo
function clampCircular(v, lo, hi){
  const d = u16(v - lo), r = u16(hi - lo);
  if (d <= r) return u16(v);
  return u16((0x8000 | (r >>> 1)) > d ? hi : lo);
}

// 0x3f9378: the X adjust. Flag 1 clear: the X offset +0x15ec in degrees, as u16. Flag 1 set: the aim's X from a point
// to the target minus the owner's X word, plus the offset (32-bit), clamped to [+0x1600, +0x1604]. The point: flag 4
// set (Nargacuga's reader always sets it) the launch point p; flag 4 clear (Rathian's reader never sets it) the owner's
// point, 0x3f93f0..0x3f9494 (aimFrom001), with the aim offset [+0x1618] (k.aimOff; Nargacuga: none, the zero vector).
// `got.target` is null only for a kind that never depends on it: the one aimed Nargacuga mode among them (mode 0) has
// lo == hi, and then the clamp gives lo whatever the aim. Rathian's aimed modes keep what the aim computed in k.aim.
function xAdjust37(k, p, got){
  const deg = s32(mla(0.5, k.xDeg, DEG_TO_U16));
  if (!(k.flags & 1)) return u16(deg);
  const lo = s32(mla(0.5, k.xLo, DEG_TO_U16)), hi = s32(mla(0.5, k.xHi, DEG_TO_U16));
  if (!got.target){
    if (u16(hi - lo) === 0) return u16(lo);
    throw new Error('shells.js: an aimed spike without a target');
  }
  if (k.flags & 4) return clampCircular(deg + (aim37(p, got.target).X - got.ownerX), lo, hi);
  const from = aimFrom001(k, got);
  const a = aim37(from, got.target, k.aimOff);
  k.aim = { from, X: a.X, Y: a.Y, target: a.target };
  return clampCircular(deg + (a.X - got.ownerX), lo, hi);
}

// vtable +0x16c = 0x3f9cc4: the Y adjust, the same with flag 2, the aim's Y minus the owner's Y word, the offset
// +0x15f0 and the clamp [+0x1608, +0x160c]. No em037_00 mode sets flag 2: every spike takes its spread, +0x15f0. With
// flag 4 clear the aim starts from the owner's point (0x3f9d3c..0x3f9de4: the owner's position plus the size times vec
// +0x1614 turned by its facing, plus block +0x5c -- aimFrom001's) through 0x3f9b58 with the aim offset +0x1618
// (0x3f9e0c..0x3f9e38): Rathalos's mode 0x17.
function yAdjust37(k, p, got){
  const deg = s32(mla(0.5, k.yDeg, DEG_TO_U16));
  if (!(k.flags & 2)) return u16(deg);
  const lo = s32(mla(0.5, k.yLo, DEG_TO_U16)), hi = s32(mla(0.5, k.yHi, DEG_TO_U16));
  if (!got.target){
    if (u16(hi - lo) === 0) return u16(lo);
    throw new Error('shells.js: an aimed spike without a target');
  }
  if (!(k.flags & 4)) return clampCircular(deg + (aim37(aimFrom001(k, got), got.target, k.aimOff).Y - got.ownerY), lo, hi);
  return clampCircular(deg + (aim37(p, got.target).Y - got.ownerY), lo, hi);
}

// base00's init 0x3f8b80 after the reader 0xe59050 (sp_00's init 0xe594d4 calls it, then keeps a hunter unit at
// +0x1660 = 0xc2df8(...) that only Silverwind's +0x154 reads). `setup` = the spawner's angle words (setup +0x20..+0x28);
// J = the joints built for the previous pose; `got` = the inputs not read (the owner's words, the target).
function init37(S, J, got, setup){
  const k = S.k = params37(S.mode.sh);
  if (k.b1664) throw new Error('shells.js: byte +0x1664 set (0x43b2b0 after each move): not transcribed');
  if (k.flags & 8) throw new Error('shells.js: base00 flag 8 (the offset from the final angles, 0x3f9040..): not transcribed');
  // the angle words (0x3f8c60..0x3f8cac): flag 0x20 -> the setup's; else the owner's X (0 with flag 0x200), Y and 0
  const A = (k.flags & 0x20) ? setup.slice() : [(k.flags & 0x200) ? 0 : got.ownerX, got.ownerY, 0];
  S.timer = k.flight;                                   // state 1; timer +0x162c = +0x15fc (0x3f8cb0..0x3f8cc8)
  // the launch point: flag 0x10 is never set by this reader, so the joint +0x15dc (-1 would take the owner's own
  // matrix: no em037_00 mode); M = its world matrix (0xc15a4), position = row 3; flag 8 clear: the offset vec 0
  // through M's 3x3 (0x3f8e70..0x3f8ec0), p = row 3 + offset (0x3f8fb0..0x3f8fdc; flag 0x80, the owner's scale 0xbe518,
  // is never set by this reader)
  if (k.joint === -1) throw new Error('shells.js: a base00 shell on the owner\'s own matrix (+0x15dc == -1): not transcribed');
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const p = launchPoint(M, k.vec);
  const ax = xAdjust37(k, p, got), ay = yAdjust37(k, p, got);
  A[0] = (A[0] + ax) >>> 0;                             // +0xfe8 += the X adjust, 32-bit (0x3f8fe8..0x3f8ff4)
  A[1] = (A[1] + ay) >>> 0;                             // +0xfec += the Y adjust (0x3f9030..0x3f9038)
  S.angles = A;
  S.position = p;                                       // (flags & 0x108) != 8: +0x40 = p (0x3f9140..0x3f9168)
  S.anchor = p.slice();                                 // +0x1000 (0x3f916c..0x3f918c)
  S.gravity = gravityOf(k.gravity, A[1]);               // vtable +0x170 = 0x3f9f98 with vec 2
  S.velocity = launchVelocity(k.vy, k.vz, A);           // 0x3f91a0..0x3f928c: (0, +0x15f8, +0x15f4) turned by Z, X, Y
  S.launch = { setup: setup.slice(), point: p.slice(), target: got.target ? got.target.slice() : null, flags: k.flags,
               xAdjust: ax, yAdjust: ay, angles: S.angles.slice(), position: S.position.slice(), anchor: S.anchor.slice(),
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), timer: S.timer };
  return true;
}

// Nargacuga's landing, vtable +0x150 = 0xe59334(shell, &contact, &result, type): only in state 1; type 1 (the floor)
// first drops shell01 (0xe593d8), then EffectParam 2 (+0x15d0); type 0 EffectParam 1 (+0x15cc); type 2 (a hunter:
// never here) EffectParam 3 (+0x15d4); any other type none. 0x3f8970 starts it at the contact (handle -> +0x1628; a
// null param starts nothing -- contactStart), byte +0x1665 = 0, then the end (vtable +0x148 with 0: the caller's).
// Unlike base00's 0x3f8878 there is no 0x43ac04 call.
function landing37(S, D, hit){
  if (hit.type === 1) dropShell01(S, D, hit.point);
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}

// 0xe593d8(shell, &contact): owner active (0x4a0f38) -> a setup (0x40 bytes, 0x3fa2bc): vtable 0x174e638 + 8, +4 =
// [owner +0xcc98] (0xc9), +8 = mode 0, +0xc = the owner, +0x10..+0x18 = the contact, +0x1c = 0, +0x20..+0x28 = the zero
// vector, +0x2c = 0, +0x30..+0x38 = the spike's angle words +0xfe8..+0xff0, halfword +0x3c = shell +0x13dc (a hit field,
// not read); 0x48b884(mgr, setup, 0, 0). shell01 mode 0's init (base01 0x3fa498) sits at the contact with those angles
// and starts its only EffectParam, (999, -1), which 0x4a11e4 refuses (listId > 7): it never draws. Its hit and its
// lifetime are not visual here, so it is reported as an event ('create'), not stepped as a shell.
function dropShell01(S, D, point){
  const def = D.shells.shell01, mode = def && def.modes[0];
  const start = mode ? rockRequest(D, mode, 0, point, 'shell01', def.lists) : null;
  S.events.push({ ev: 'create', shell: 'shell01', id: def ? def.id : null, cls: def ? def.cls : null, mode: 0,
                  position: point.slice(), angles: S.angles.slice(), start, refused: !start });
}

// vtable +0x150 by class, where the class has its own
const LANDING = { uShellEm037_sp_00: landing37, uShellEm001_sp_00: landing001 };

// 0xe48fc8(e, xIdx, kind): the setups of an action's shells. off = s32(mla(0.5, [0x169dc74 + 4 xIdx], 182.04445)); X =
// the owner's X word + u16(off) (uxtah, 32-bit); Y, Z = the owner's words through vcvt.f32.u32 then vcvt.u32.f32 (exact
// below 2^24); kind > 4 makes nothing (0xe49018); kinds 0 / 1 set +0x20..+0x28 = (X, Y, Z), kinds 2..4 the vector at
// 0x1620e60 = (0, 0, 0); the modes by kind (0xe49044), created in that order with 0x48b884(mgr, setup, 0, 0).
function spawner37(D, xIdx, kind, got){
  const sp = D.spawner, modes = sp.kinds[kind];
  if (!modes) return [];
  const cvt = w => { const x = f(w >>> 0); return x >= 4294967295 ? 4294967295 : Math.trunc(x); };
  const words = kind <= 1 ? [(got.ownerX + u16(s32(mla(0.5, f(sp.xoff[xIdx]), DEG_TO_U16)))) >>> 0, cvt(got.ownerY), cvt(got.ownerZ)]
                          : [0, 0, 0];
  return modes.map(mode => ({ mode, setup: words.slice() }));
}

// the spikes' inputs the ROM takes from the game and this module does not read: the floor and the owner's facing Y
// (required), the owner's X / Z words (0 when not given: the viewer's untilted monster), the target (required by the
// aimed kinds 2..4 only; kinds 0 / 1 never depend on it)
function spikeInputs(input, kind){
  const r = input.rock, o = input.owner, t = r && r.target;
  if (!r) return { why: 'no input.rock' };
  const hasT = !!t && Number.isFinite(t.x) && Number.isFinite(t.y) && Number.isFinite(t.z);
  if (kind >= 2 && !hasT) return { why: 'no target (input.rock.target)' };
  if (!Number.isFinite(r.floorY)) return { why: 'no floor (input.rock.floorY)' };
  if (!o || !Number.isFinite(o.y)) return { why: 'no owner facing (input.owner.y)' };
  return { target: hasT ? [f(t.x), f(t.y), f(t.z)] : null, ownerX: (o.x || 0) >>> 0, ownerY: o.y >>> 0, ownerZ: (o.z || 0) >>> 0 };
}

// every shell of the action, in the spawner's order, each inited on the joints of the previous pose; each starts its
// EffectParam 0 at its launch point (0x3f928c..0x3f9300: requester at +0x40, parent shell +0xfd0, ShellScale, no
// rotation; handle -> +0x1624). All of them then move once in the same step (line 18).
function spawnSpikes(state, D, a, J, ctx, got){
  const def = D.shells[a.shell], lists = def.lists, made = [];
  for (const { mode: m, setup } of spawner37(D, a.spawnArgs[0], a.spawnArgs[1], got)){
    const mode = def.modes[m];
    if (!mode) continue;                                 // no ShellInfoList files for the mode (none of em037_00's kinds)
    const S = { id: state.nextId++, monId: state.monId, shell: a.shell, cls: def.cls, globalId: def.id, base: def.base,
                mode, modeIndex: m, action: a.action, spawnFrame: a.frame, motion: ctx.motion, state: 1,
                position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, trail: null,
                timer: 0, moves: 0, bounces: 0, held: false, launch: null, events: [], folder: def.folder,
                effect: null, effect2: null, start: null, place: null, stop: null };
    S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
    if (!init37(S, J, got, setup)) continue;
    S.prevPosition = S.position.slice();
    S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
    S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
    if (S.start) S.effects[0].started = true;
    made.push(S);
  }
  return made;
}

// ---- Rathian (em001_00): the fireballs, the ground fire, the explosions, the landing dust, the breath puffs -------------
// Notes E:\offline\decode\notes\shells-em001.md (sections cited as "notes N"). The fireball is base00, flown exactly as
// Savage's rock and Nargacuga's spike (move 0x3f96a0 -> 0x3f9738: move00 / stepRock); its own parts are the reader
// 0xd0d988 (params001), base00's init as that reader's flags run it (init001: the X aim from the OWNER's point with the
// aim offset, 0x3f93f0..0x3f9494) and the landing 0xd0dc9c (landing001), which creates shells. shell01 is base01
// (params011, init011, step011: init 0x3fa498, move 0x3faec4 -> 0x3fb048, end 0x3fb264, ending 0x3fafd0..), shell11 is
// base11 on top of it (init 0x402fd8, +0x150 0x40308c, sp_11's create 0xd0efc0). A shell made by a shell is a real,
// stepped shell: 0x48b884 runs its init at once (its effect starts then) and 0xc03670 appends it at the TAIL of unit
// line 18, whose walker 0xc04728 reads a unit's next pointer (+0x14) BEFORE it runs the unit (0xc047a4) -- so the new
// shell moves in the same frame unless its creator was the last unit of the line (the walk in stepShells). The owner's
// side: the attack actions' spawn helpers (spawn001) and the per-frame handler's landing dust (dust001).
// dev/shells-rathian-check.mjs runs all of it against the ROM's reference runs
// (efx\agents\rathian-shell-scratch\rathian-shell-reference.json), move by move, bit for bit.

// sp_00's reader 0xd0d988 (vtable +0x14c; getters 0x4a22f0.. as em043 s1), notes 3.2: what base00 reads
function params001(sh){
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  // +0x15e8 (0xd0da54..0xd0db24, each bit cleared then set): bit 0 = int 3 != -1, bit 1 = int 4, bit 2 = int 5, bit 3 =
  // int 6, bit 5 (0x20) = int 7; the others keep base00's ctor 0. em001_00: 0x01 (modes 0, 4..7), 0x00 (modes 1, 2, 3, 8)
  const flags = (I(3) !== -1 ? 1 : 0) | (I(4) !== -1 ? 2 : 0) | (I(5) !== -1 ? 4 : 0) | (I(6) !== -1 ? 8 : 0) | (I(7) !== -1 ? 0x20 : 0);
  return { joint: I(0),                // +0x15dc: int 0 (3)
           i1: I(1), i2: I(2),         // +0x15e0 / +0x15e4: the landing's camera request ids (type 0 / type 1)
           flags,
           xDeg: F(0), yDeg: F(1),     // +0x15ec / +0x15f0: the X offset / the Y spread, degrees
           vz: F(2),                   // +0x15f4: speed along +Z
           vy: 0,                      // +0x15f8: not written by this reader; base00's ctor clears +0x15ec..+0x160f (0x3f8a6c..0x3f8a74)
           flight: F(3),               // +0x15fc: flight time
           xLo: F(4), xHi: F(5),       // +0x1600 / +0x1604: the X clamp, degrees
           yLo: F(7), yHi: F(8),       // +0x1608 / +0x160c: the Y clamp (flag 2 is never set: not read)
           aimOff: [0, F(6), 0],       // +0x1618 = &+0x1660: (+0x1660 = 0, +0x1664 = f6, +0x1668 = 0) (0xd0dc0c..0xd0dc3c)
           vec: V(0),                  // +0x1610 = &vec 0: the launch offset in the joint's space
           from: V(1),                 // +0x1614 = &vec 1: the aim-from offset in the owner's space
           gravity: [0, 0, 0] };       // +0x161c keeps the ctor's zero vector (0x3f8a9c..0x3f8aa0): no gravity
}

// 0xbe518(owner): block +0x1ac x block +0x1b0 (the size); 0xbec34(owner): that over [[e+0x75e8]+0x64] (the base scale)
const size001 = got => f(got.size[0] * got.size[1]);
const scale001 = got => f(size001(got) / got.base);

// 0x3f93f0..0x3f9494 (flag 1 set, flag 4 clear): the point the X aim starts from -- the owner's position plus the
// size times vec 1 turned by the owner's facing (u16 block +0x54), plus block +0x5c on y
function aimFrom001(k, got){
  const v = k.from, sc = size001(got);
  const r = f(u16(got.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const a = f(sc * v[0]), b = f(sc * v[2]);
  const P = got.ownerPos;
  return [f(P[0] + mla(f(a * cs), b, sn)), f(got.y5c + mla(P[1], sc, v[1])), f(P[2] + mls(f(b * cs), a, sn))];
}

// base00's init 0x3f8b80 after the reader 0xd0d988 (notes 4). J = the joints built for the previous pose; `got` = the
// owner block the init reads (owner001: inputs the ROM takes from the game).
function init001(S, J, got){
  const k = S.k = params001(S.mode.sh);
  if (k.flags & ~0x23) throw new Error('shells.js: sp_00 flags 0x' + k.flags.toString(16) + ': only flags 1, 2 and 0x20 are transcribed');
  // the angle words (0x3f8c60..0x3f8cac): flag 0x20 clear -> +0xfe8 = block +0x50 (the owner's X), +0xfec = block +0x54
  // (Y), +0xff0 = 0 (flag 0x200 clear); set -> the setup's three words +0x20.. instead, whatever the helper that made it
  // put there (Silver Rathalos's mode 0x25: pitchAngles001). State 1; timer +0x162c = +0x15fc
  const A = (k.flags & 0x20) ? S.setup.angles.map(w => w >>> 0) : [got.ownerX >>> 0, got.ownerY >>> 0, 0];
  S.timer = k.flight;
  const M = jointMatrix(J, k.joint);                    // 0xc15a4: joint 3
  if (!M) return false;
  const p = launchPoint(M, k.vec);                      // row 3 + vec 0 through M's 3x3 (0x3f8e70..0x3f8ec0; flag 0x80 clear)
  const ax = xAdjust37(k, p, got), ay = yAdjust37(k, p, got);
  A[0] = (A[0] + ax) >>> 0;                             // +0xfe8 += the X adjust, 32-bit
  A[1] = (A[1] + ay) >>> 0;                             // +0xfec += the Y adjust (vtable +0x16c = 0x3f9cc4, flag 2 clear)
  S.angles = A;
  S.position = p;                                       // +0x40 = p, anchor +0x1000 = p
  S.anchor = p.slice();
  S.gravity = gravityOf(k.gravity, A[1]);               // vtable +0x170 = 0x3f9f98 with the zero vector: signed zeros
  S.velocity = launchVelocity(k.vy, k.vz, A);           // 0x3f91a0..0x3f928c: (0, 0, f2) turned by Z, X, Y
  // +0x1640..+0x1648: the target copy (block +0x1d0.., 0x3f8b80 step 1) or, aimed, the target plus the turned aim offset
  S.launch = { point: p.slice(), target: got.target ? got.target.slice() : null, flags: k.flags, xAdjust: ax, yAdjust: ay,
               aim: k.aim || null, target1640: k.aim ? k.aim.target.slice() : (got.target ? got.target.slice() : null),
               angles: A.slice(), position: S.position.slice(), anchor: S.anchor.slice(), velocity: S.velocity.slice(),
               gravity: S.gravity.slice(), timer: S.timer };
  return true;
}

// 0x43ac04(shell, n): n != -1 (and the shell's byte +0x1054 the local one) -> a camera request with id n at the shell
// (0x19148 -> uFestaCamera 0x1ce9c: INFERRED a shake, NOT READ further) -- an event only
function camera001(S, n){ if (n !== -1) S.events.push({ ev: 'camera', id: n }); }

// sp_00's landing, vtable +0x150 = 0xd0dc9c(shell, &c, &result, type) (notes 5.2). The owner is always active in the
// viewer (0x4a0f00 / 0x4a0f38), so the creates always run; each is a shell01 / shell11 setup (0x40 bytes, 0x3fa2bc: +0x10
// = the contact, +0x30..+0x38 = the fireball's angle words) made with 0x48b884 -- its init runs at once. Then 0x3f8970
// starts the param at the contact (contactStart: handle -> +0x1628), and the caller ends the fireball (vtable +0x148, 0).
function landing001(S, D, hit, ctx){
  const k = S.k, mode = S.modeIndex;
  // "in mask" (0xd0dd08..0xd0dd24): mode - 8 <= 0x1d (unsigned) and bit (mode - 8) of 0x227f000f -- modes 8..11,
  // 24..30, 33, 37; of em001_00's only mode 8. For em 2 variant 4 (Dreadking: 0x4a0f00's owner, bytes +0xb5f4 / +0xb5f5)
  // mode 0x15 (m8 0xd) takes the mask's paths too (floor 0xd0e140..0xd0e16c, type 0 0xd0e10c..0xd0e138, type 2
  // 0xd0e23c..0xd0e268)
  const m8 = (mode - 8) >>> 0, inMask = m8 <= 0x1d && ((0x227f000f >>> m8) & 1) === 1;
  const asMask = inMask || (m8 === 0xd && (D.em || 1) === 2 && (D.variant || 0) === 4);
  const make = (name, m) => ctx.create(S, name, { mode: m, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  // the stage result's halfword +8 & 0x1040 == 0 -> the ground fire, shell01 mode 2 (0xd0ddf0..0xd0deb8, 0xd0dfb8). The
  // bits are the stage's (NOT READ); the plane stand-in's result record is zero there, so the fire is always made.
  const fire = () => { if (!((hit.resultH8 || 0) & 0x1040)) make('shell01', 2); };
  let param;
  if (hit.type === 1){                                   // the floor (0xd0dcd8..)
    param = 2;                                           // +0x15d0
    camera001(S, k.i2);                                  // 0x43ac04(shell, +0x15e4): 1 (modes 0..7), 5 (mode 8)
    if (asMask){ make('shell11', 0); fire(); }           // 0xd0dd28..0xd0ddec: id [owner+0xcacc]
    else if (mode === 0x1f){
      // 0xd0e170..0xd0e238: shell01 0x1b, or 0x11 when the owner's variant byte is 4 and 0x49930(owner) > 6 (the quest's
      // number: input.questLevel -- refused without it); no ground fire (0xd0de98 -> 0xd0dfb8 -> 0xd0e0e0)
      let m = 0x1b;
      if ((D.variant || 0) === 4){
        const q = ctx.own001 && ctx.own001.questLevel;
        if (q == null) m = null;
        else if (q > 6) m = 0x11;
      }
      if (m == null) ctx.out.refused.push({ shell: 'shell01', modes: [0x1b, 0x11], creator: S.id, why: 'no quest level (input.questLevel)' });
      else make('shell01', m);
    } else if (mode >= 0x22 && mode <= 0x24)
      // 0xd0e270..0xd0e35c: shell01 0x1d / 0x34 / 0x36 for mode 0x22 / 0x23 / 0x24; no ground fire (0xd0dfbc -> 0xd0e0e0)
      make('shell01', mode === 0x22 ? 0x1d : mode === 0x23 ? 0x34 : 0x36);
    else {
      make('shell01', 1);                                // 0xd0e360..0xd0e444: id [owner+0xcac8]
      if (mode === 0x20) make('shell01', 0x13);          // 0xd0e448..0xd0e514 (-> 0xd0dde0)
      fire();
    }
  } else if (hit.type === 0){                            // too steep (0xd0debc..): never with the plane stand-in
    param = 1;                                           // +0x15cc
    camera001(S, k.i1);                                  // 0x43ac04(shell, +0x15e0)
    if (asMask) make('shell01', 9);
  } else {                                               // type 2, a hunter (0xd0dfcc..): the viewer has none
    if (asMask) make('shell01', 9);
    param = 3;                                           // +0x15d4
  }
  contactStart(S, D, param, hit.point, 'landing');       // 0x3f8970(shell, param, &c)
}

// ---- base01 (uShellEmBase01) and base11 -------------------------------------------------------------------------------
// sp_01's reader 0xd0e6a0 (notes 6.1). `sh` null = a mode with no files: every int -1, float 0.0, vec the zero vector.
// The ctor 0x3fa2f8 leaves what the reader does not write: +0x15f4 = +0x15f8 = 500.0 (the ground query's reach up /
// down), +0x1604 = 900.0 (the owner-height limit), +0x1608 = +0x160c = the zero vector.
function params011(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : 0, F = i => !sh ? 0 : i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  // +0x15ec (0xd0e700..0xd0e864): bit 0 = int 0 != -1, bit 1 = int 2, bit 2 = int 3, bit 3 = int 4, bit 7 (0x80) = int 5,
  // bit 8 (0x100) = int 6, bit 11 (0x800) = int 7, bit 12 (0x1000) = int 8. em001_00: mode 0 0x3, 1 0, 2 0xc, 6..9 0x4,
  // 13 / 14 / 15 / 20 0x1084, 44..46 0x1
  const flags = (I(0) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 4 : 0) | (I(4) !== -1 ? 8 : 0) |
                (I(5) !== -1 ? 0x80 : 0) | (I(6) !== -1 ? 0x100 : 0) | (I(7) !== -1 ? 0x800 : 0) | (I(8) !== -1 ? 0x1000 : 0);
  return { flags,
           joint: I(1),                // +0x15e4
           timer: F(0),                // +0x15f0 -> timer +0x1614
           f1600: F(1), f15fc: F(2),   // +0x1600 (the hit radius growth frames, 0xd0e9d4: not visual), +0x15fc
           vec: V(0),                  // +0x1608 = &vec 0
           up: f(500.0), down: f(500.0), maxH: f(900.0) };
}

// sp_11's reader 0xd0ee8c (notes 7): none of base01's fields (flags 0, timer 0, +0x1608 the ctor's zero vector); +0x1664 =
// [owner+0xcac8] (the shell01 id); a 4-float table (+0x1654, count +0x1658 = 4) = sh floats [0x169b744[k]]
function params11(def, mode){
  const F = i => i < mode.sh.floats.length ? f(mode.sh.floats[i]) : 0;
  return { flags: 0, joint: -1, timer: 0, f1600: 0, f15fc: 0, vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           table: def.times.map(F) };
}

// the X-Y-Z turn of a vector by the three angle words (their low halves x 9.58738e-05), as base01 computes it
// (0x3fa65c..0x3fa73c; the same at 0x3fa9f4..0x3faab4)
function rotXYZ(v, A){
  const X = f(u16(A[0]) * U16_TO_RAD), Y = f(u16(A[1]) * U16_TO_RAD), Z = f(u16(A[2]) * U16_TO_RAD);
  const sX = sinf(X), cX = cosf(X), sY = sinf(Y), cY = cosf(Y);
  const [vx, vy, vz] = v;
  const a = mla(f(vz * cX), vy, sX), b = mls(f(vy * cX), vz, sX);
  const c = mla(f(vx * cY), a, sY), z = mls(f(a * cY), vx, sY);
  const sZ = sinf(Z), cZ = cosf(Z);
  return [mls(f(c * cZ), b, sZ), mla(f(b * cZ), c, sZ), z];
}

// 0x232530's normalisation: left as is when the length is below 2^-23
function norm3(v){
  const l = sqrtf(mla(mla(f(v[1] * v[1]), v[0], v[0]), v[2], v[2]));
  if (l < SEG_EPS) return v.slice();
  const r = f(1.0 / l);
  return [f(r * v[0]), f(r * v[1]), f(r * v[2])];
}

// 0x232530(m, fwd, up): the frame from a forward and an up vector (notes 6.2.5): rows (R, U, F'), R = U x F (normalised
// unless shorter than 2^-23), F' = R x U
function frameFrom(fwd, up){
  const F = norm3(fwd), U = norm3(up);
  let r30 = mls(f(F[0] * U[2]), F[2], U[0]), r17 = mls(f(F[2] * U[1]), F[1], U[2]), r28 = mls(f(F[1] * U[0]), F[0], U[1]);
  const l = sqrtf(mla(mla(f(r30 * r30), r17, r17), r28, r28));
  if (!(l < SEG_EPS)){ const inv = f(1.0 / l); r28 = f(r28 * inv); r30 = f(inv * r30); r17 = f(inv * r17); }
  return [r17, r30, r28, 0, U[0], U[1], U[2], 0,
          mls(f(U[2] * r30), U[1], r28), mls(f(U[0] * r28), U[2], r17), mls(f(U[1] * r17), U[0], r30), 0, 0, 0, 0, 1];
}

// 0x43b1a0(shell, &+0xfe8, &result, &+0xfec) (flag 8): the angle words from the ground normal n (result +0x20) and the
// yaw word -- fwd = (sin Y, 0, cos Y) as the ROM computes it, the frame 0x232530, its Euler angles 0x7c3a38, each
// u16(s32(0.5 + e x 10430.378))
function groundAngles(A, n){
  const r = f(u16(A[1]) * U16_TO_RAD), sY = sinf(r), cY = cosf(r);
  const e = eulerOf(frameFrom([mla(sY, cY, 0.0), 0, mls(cY, sY, 0.0)], n));
  return [u16(s32(mla(0.5, e.x, RAD_TO_U16))), u16(s32(mla(0.5, e.y, RAD_TO_U16))), u16(s32(mla(0.5, e.z, RAD_TO_U16)))];
}

// base01's init 0x3fa498 (notes 6.2) with the reader's params k; setup = { position (+0x10..), angles (+0x30..+0x38) }.
// Returns false where the init deletes the shell (0x3fae84).
function init011(S, k, setup, got, J, floorY){
  if (k.flags & 0x800) throw new Error('shells.js: base01 flag 0x800 (+0x1650 x 0xbec34): not transcribed (no em001_00 mode)');
  let A = setup.angles.map(w => w >>> 0);               // +0xfe8..+0xff0 = setup +0x30..+0x38 (0x3fa594..0x3fa5a8)
  const v = k.vec;
  let pos;
  if (k.flags & 0x80){
    // at the owner's ground (0x3fa740..0x3fa82c): the owner's x / z plus the scaled vec turned by its facing, y = the
    // ground (block +0x5b4) plus vec.y x sc; deleted unless block +0x44 - block +0x5b4 < +0x1604 (0x3fa8b0..0x3fa8dc).
    // This path skips the words' offset, the ground snap and flag 8.
    const sc = scale001(got);
    const r = f(u16(got.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    const a = f(v[0] * sc), b = f(v[2] * sc);
    const P = got.ownerPos;
    pos = [f(P[0] + mla(f(a * cs), b, sn)), mla(got.ground, v[1], sc), f(mls(f(b * cs), a, sn) + P[2])];
    if (!(f(P[1] - got.ground) < k.maxH)) return false;
  } else {
    // the words += u16(s32(0.5 + [+0x160c] x 182.04445)) (uxtah): [+0x160c] is the ctor's zero vector, + 0
    const add = u16(s32(mla(0.5, 0.0, DEG_TO_U16)));
    A = A.map(w => (w + add) >>> 0);
    if (!(k.flags & 1)){
      // 0x3fa65c..0x3fa73c + 0x3faab8: the setup's point plus 0xbec34 x (vec turned X, Y, Z by the words)
      const [x, y, z] = rotXYZ(v, A), sc = scale001(got), P = setup.position;
      pos = [f(f(sc * x) + P[0]), f(f(sc * y) + P[1]), f(f(z * sc) + P[2])];
    } else {
      if (k.joint === -1) throw new Error('shells.js: base01 on the owner\'s own matrix (+0x15e4 == -1, 0x3fa8e4): not transcribed');
      const M = jointMatrix(J, k.joint);                // 0xc15a4
      if (!M) return false;
      if (k.flags & 2){                                 // 0x3fa9f4..0x3faab4: the turned vec, no scale, + row 3
        const d = rotXYZ(v, A);
        pos = [f(d[0] + M[12]), f(d[1] + M[13]), f(d[2] + M[14])];
      } else pos = launchPoint(M, v);                   // 0x3fa994..0x3fa9ec: vec through M's 3x3 + row 3
    }
    if (k.flags & 4){
      // the ground snap (0x3faaf8..0x3faba0): query 0x183490 (mask 0x10) from +0x15f4 above down to +0x15f8 below (0 ->
      // 1e6), result -> +0x1060; no hit -> deleted; a hit -> y = the hit's y
      const up = k.up !== 0 ? k.up : f(1000000.0), dn = k.down !== 0 ? k.down : f(1000000.0);
      const q = stageQuery([pos[0], f(pos[1] - dn), pos[2]], [pos[0], f(pos[1] + up), pos[2]], floorY);
      if (!q) return false;
      pos[1] = q.point[1];
      if (k.flags & 8) A = groundAngles(A, q.normal);    // then 0x4a211c (byte +0x159c from the attribute: not visual)
    }
  }
  S.position = pos;                                     // +0x40; anchor +0x1000, +0x10f0 = y (0x3fabf0..0x3fac18)
  S.anchor = pos.slice();
  S.angles = A;
  S.timer = k.timer;                                    // state 1; timer +0x1614 = +0x15f0
  S.elapsed = 0;                                        // +0x1618
  return true;
}

// base01's move 0x3faec4 -> state 1 0x3fb048 (notes 6.3). The owner is always active in the viewer (0x4a0f38).
function move011(S, ctx, D){
  const T = S.timer;
  if (T > 0){
    const e = f(ctx.dt + S.elapsed);                    // +0x1618 += dt; past the timer -> the end
    S.elapsed = e;
    if (e > T) return 'end';
    // flag 0x100 (byte +0x15ed bit 0) with both hit slots idle (+0x13ad, +0x1465) -> vtable +0x158, sp_01's hit
    // registration 0xd0ec98 again (0x3fb098..0x3fb0d8): the slots re-armed from the hit data -- the hit side, counted here
    // only with input.hitLife (S.slots); nothing visual
    if (S.k.flags & 0x100 && S.slots && !S.slots.some(sl => sl.on)) S.slots = slotsOf011(D.shells[S.shell], S.mode);
  } else if (!(S.slots && S.slots.some(sl => sl.on))) return 'end';     // T <= 0: ends unless byte +0x13ad or +0x1465 is set
  // flag 0x20 -> vtable +0x164 (never set by these readers), +0x160 (bx lr), then +0x150: sp_01's 0xd0e9d4 (the hit
  // radius growth: not visual) or base11's 0x40308c
  return S.base === 'base11' ? tick11(S, ctx, D) : 'keep';
}

// base11's +0x150 = 0x40308c: while table[idx] < +0x1618, vtable +0x168(shell, idx) (sp_11: 0xd0efc0) and idx + 1
// (+0x1660); idx at the count (+0x1658) -> the end (vtable +0x148 with 0)
function tick11(S, ctx, D){
  const T = S.k.table;
  while (S.next < T.length && T[S.next] < S.elapsed){ create11(S, S.next, ctx, D); S.next++; }
  return S.next < T.length ? 'keep' : 'end';
}

// sp_11's vtable +0x168 = 0xd0efc0(shell, k): shell01 mode 0x169b764[k] at the shell's point plus sh vec [0x169b754[k]]
// turned by its Y word (ldrh +0xfec), with its angle words (setup +0x30..); the owner is always active in the viewer
function create11(S, idx, ctx, D){
  const def = D.shells[S.shell], sh = S.mode.sh, vi = def.vecIdx[idx];
  const v = vi < sh.vecs.length ? sh.vecs[vi].map(f) : [0, 0, 0];
  const r = f(u16(S.angles[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const P = S.position;
  ctx.create(S, 'shell01', { mode: def.modes01[idx], angles: S.angles.map(w => w >>> 0),
                             position: [f(mla(f(v[0] * cs), v[2], sn) + P[0]), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])] });
}

// base01's end 0x3fb264(shell, 0): graceful stops (0x43b058 -> 0x329c40(h, 0)) of +0x1624 / +0x1628 / +0x162c, 0x4a1de4
// (hit side), vtable +0x154 (sp_01's 0xd0eb20: endCreate001; sp_11's 0x3fb54c is bx lr), state 0xfe, +0x1618 = 0;
// EffectParam +0x15d4 (a request at the end) is never set by these readers. `events`: where the stops and the create go
// (the shell's move's, or retire001's for the next move)
function end011(S, events = S.events, ctx = null){
  S.stops = [];
  for (const h of [S.effect, S.effect2]) if (h && !h.gone) S.stops.push({ param: h.param, request: 0, key: h.key });
  for (const s of S.stops) events.push({ ev: 'stop', param: s.param, key: s.key, flag: 0 });
  S.stop = S.stops[0] || null;
  endCreate001(S, ctx, events);
  S.state = 0xfe;
  S.elapsed = 0;
}

// sp_01's vtable +0x154 = 0xd0eb20(shell): with the owner active (0x4a0f38; always in the viewer) a shell01 of mode 0x1b /
// 0x11 / 0x1d / 0x34 / 0x36 makes one more shell01 (id [owner+0xcac8]) of mode 0x1c / 0x12 / 0x1e / 0x35 / 0x37
// (0xd0eb3c..0xd0eba8: 0x1b and 0x11 by compare, the others by bit (mode - 0x1d) of 0x02800001) at its own point (+0x40..
// -> setup +0x10..) with the angle words (0, 0, 0) (0x1620e60 -> setup +0x30..), the zero vector at +0x20 and halfword
// +0x3c = 0xffff, with 0x48b884: its init at once, the unit at the tail of line 18. The first ones are Dreadking's landing
// shells of its modes 0x1f / 0x22..0x24 (landing001); no mode of Rathian's, Gold's or Dreadqueen's is one of them.
const END_MODES001 = new Map([[0x1b, 0x1c], [0x11, 0x12], [0x1d, 0x1e], [0x34, 0x35], [0x36, 0x37]]);
function endCreate001(S, ctx, events){
  if (S.cls !== 'uShellEm001_sp_01' || !END_MODES001.has(S.modeIndex)) return;
  if (!ctx || !ctx.create) throw new Error('shells.js: sp_01 end create (0xd0eb20) without the create context');
  ctx.create(S, 'shell01', { mode: END_MODES001.get(S.modeIndex), position: S.position.slice(), angles: [0, 0, 0] }, events);
}

// one base01 / base11 shell's move this step (vtable +0x24 = 0x3faec4)
function step011(S, ctx, input, D, out){
  S.events = [];
  if (S.carry){ S.events = S.carry; delete S.carry; }   // (a retirement in this step's line 4: retire001)
  S.place = null;                                       // never placed: no 0x329c9c / 0x329d04 in 0xd0d928..0xd0f400
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  // +0x1378 += dt, 0x4a1698 (hit side, not visual); a handle whose unit left states 1 / 2 is dropped (0x3faeec..0x3fafb8)
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.effect2 && !S.effect2.gone && !alive(S.effect2)) S.effect2.gone = true;
  if (S.state === 1){
    S.moves++;
    if (move011(S, ctx, D) === 'end'){ end011(S, S.events, ctx); out.ended.push(S); }
  } else if (S.state === 0xfe){                         // the ending (0x3fafd0..0x3fb03c)
    const e = f(ctx.dt + S.elapsed);                    // +0x1618 += dt
    S.elapsed = e;
    if (e > ENDING_FRAMES) S.state = 0xff;              // past [0x162493c] x 60: deleted (vtable +0x40)
    else if (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone)) S.state = 0xff;   // all four handles gone
  }
}

// ---- the hit slots: the life of a timer-0 shell01 (input.hitLife) ----------------------------------------------------
// A shell01 whose timer is 0 lives while a hit slot byte (+0x13ad, slot 0; +0x1465, slot 1) is set (0x3fb0dc..0x3fb0f8).
// READ: the init's registration (vtable +0x158 -> 0x4a1ad8 gate -> vtable +0x140 0x43a8b0 -> 0x4a1b24 -> 0x168a2c) for
// HitParam int 0 -> slot 0 and int 1 -> slot 1 when >= 0: byte +5 = 1, delay +0x5c = s16 record +0, duration +0x60 = s16
// record +2 of the shell's hitdata record (0x168a54..0x168a84); the slot update 0x168d30: delay > 0 -> delay -= step, and
// at <= 0 the overshoot is added to the duration and delay = 0; else duration <= 0 -> byte +5 = 0; else duration -= step.
// NOT READ: who calls 0x168d30 and where in the frame, the step it uses ([0x211f764]+0x68, or times the owner's +0x50c by
// slot +0x31 bit 1), the slot's owner-motion checks under +0x31 bit 0, and the gate 0x4a1ad8 (taken to pass). The viewer
// input: input.hitLife true -> each slot counts down once per step after every shell's move (the hit manager's pass,
// INFERRED order), by dt -- a shell made and moved in a step ends at move delay + duration + 2 (+ 1 for a shell made by the
// last unit of line 18, which first moves the next step). Without it, the ROM-run harness's life: the end at move 1.
function slotsOf011(def, mode){
  const out = [];
  if (!mode || !mode.hit || !def.hitdata) return out;
  for (const slot of [0, 1]){
    const idx = mode.hit[slot];
    if (idx == null || idx < 0 || !def.hitdata[idx]) continue;
    out.push({ slot, record: idx, on: true, delay: f(def.hitdata[idx][0]), duration: f(def.hitdata[idx][1]) });
  }
  return out;
}
function slotStep(sl, step){                            // 0x168d30
  if (!sl.on) return;
  if (sl.delay > 0){
    const d = f(sl.delay - step);
    sl.delay = d;
    if (d > 0) return;
    sl.duration = f(d + sl.duration);
    sl.delay = 0;
    return;
  }
  if (!(sl.duration > 0)){ sl.on = false; return; }
  sl.duration = f(sl.duration - step);                  // (+0x64 / +0x68, further countdowns: not read, not the byte)
}

// ---- making a Rathian shell: 0x48b884 (the init at once; the unit to the tail of line 18) --------------------------------
// setup = { id, mode, position (+0x10..), angles (+0x30..+0x38) [, action, frame] }; J = the joints the init reads (the
// previous pose's in the enemy's line 4, this frame's in line 18); `creator` = the shell whose move made it, or null
function make001(state, D, name, setup, got, J, ctx, creator){
  const def = D.shells[name], mode = def.modes[setup.mode] || null;
  const S = { id: state.nextId++, monId: state.monId, shell: name, cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: setup.mode, action: setup.action || null, spawnFrame: setup.frame == null ? null : setup.frame,
              motion: ctx.motion, state: 1, folder: def.folder,
              setup: { id: setup.id, mode: setup.mode, position: setup.position.slice(), angles: setup.angles.map(w => w >>> 0) },
              creator: creator ? creator.id : null, createdAtMove: creator ? creator.moves : null,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, trail: null,
              timer: 0, elapsed: 0, moves: 0, bounces: 0, held: false, launch: null, events: [], initEvents: [],
              effect: null, effect2: null, start: null, starts: [], place: null, stop: null, stops: [], slots: null };
  S.effects = (mode ? mode.ef : []).map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key, started: false }));
  if (def.base === 'base00'){
    if (!mode || !init001(S, J, got)) return null;
    // EffectParam 0 at +0x40: requester parent the shell (+0xfd0), ShellScale, no rotation; handle -> +0x1624
    S.start = rockRequest(D, mode, 0, S.position, 'flight');
    S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
    if (S.start){ S.effects[0].started = true; S.starts.push(S.start); S.initEvents.push({ ev: 'start', param: 0, start: S.start }); }
    else S.initEvents.push({ ev: 'refused', param: 0, listId: mode.ef[0] ? mode.ef[0][0] : null, key: mode.ef[0] ? mode.ef[0][1] : null });
  } else {
    const k = S.k = def.base === 'base11' ? params11(def, mode) : params011(mode ? mode.sh : null);
    if (!init011(S, k, setup, got, J, ctx.floorY)) return null;
    if (def.base === 'base11'){
      S.timer = f(k.table[k.table.length - 1] + 10.0);  // 0x402fd8: +0x1614 = the last time + 10.0 (+0x165c = -1: no motion-speed divide)
      S.next = 0;                                        // +0x1660
      S.shell01Id = D.shells.shell01.id;                 // +0x1664 = [owner+0xcac8]
    }
    // EffectParam 0 at +0x40 -> +0x1624, EffectParam 1 -> +0x1628 (0x3fad08..0x3fadf8): requester at +0x40, parent the
    // shell (+0xfd0), ShellScale, no rotation. A (999, -1) / (n, -1) param is refused (0x4a11e4); a mode with no files
    // (or shell11, which has no EffectParams) starts nothing.
    for (const param of [0, 1]){
      const p = mode && mode.ef[param];
      if (!p) continue;
      const rq = rockRequest(D, mode, param, S.position, 'init');
      if (!rq){ S.initEvents.push({ ev: 'refused', param, listId: p[0], key: p[1] }); continue; }
      S.initEvents.push({ ev: 'start', param, start: rq });
      S.starts.push(rq);
      S.effects[param].started = true;
      if (param === 0) S.effect = { param, key: rq.key, kind: 'init' }; else S.effect2 = { param, key: rq.key, kind: 'init' };
    }
    S.start = S.starts[0] || null;
    // the hit registration (vtable +0x158): the slots, counted only with input.hitLife
    if (got.hitLife) S.slots = slotsOf011(def, mode);
  }
  S.prevPosition = S.position.slice();
  return S;
}

// The owner block the Rathian code reads -- inputs the viewer gives (the ROM takes them from the game): the angle words
// block +0x50 / +0x54 / +0x58 (input.owner x / y / z), the position block +0x40.. (input.ownerPos), the ground block +0x5b4
// (input.ground, else the stage floor input.rock.floorY), the size block +0x1ac / +0x1b0 (input.size: [a, b] or one
// number = [n, 1]; [1, 1] for the viewer's unscaled monster), the base scale [[e+0x75e8]+0x64] (input.baseScale, 1),
// block +0x5c (input.y5c, 0 at rest: 0xa5db8 decays it toward 0), the target block +0x1d0.. (input.rock.target), the
// stage (input.rock.floorY), the quest rank byte 0x3a8430 (input.rank: 1 / 3 / 5, default 5 -- "> 4" = G rank is
// INFERRED), and input.hitLife (the timer-0 shells' hit-slot life, above). Dreadqueen's poison (poison001) and L9 M9 also
// read: the quest's number 0x49930 (input.questLevel, no default), part 7's break level (input.breakLevel7, default 0:
// 0x9d1b4 clears every part's +0x3bc) and the sever bit P+0x3b4 & 1 (input.tailSevered, default false: only the sever
// 0xc2274 sets it).
function owner001(input){
  const o = input.owner, r = input.rock, P = input.ownerPos, t = r && r.target, fin = Number.isFinite;
  const sz = input.size == null ? [1, 1] : Array.isArray(input.size) ? input.size : [input.size, 1];
  return { facing: !!o && fin(o.y),
           ownerX: o && fin(o.x) ? o.x >>> 0 : 0, ownerY: o && fin(o.y) ? o.y >>> 0 : 0, ownerZ: o && fin(o.z) ? o.z >>> 0 : 0,
           ownerPos: P && fin(P.x) && fin(P.y) && fin(P.z) ? [f(P.x), f(P.y), f(P.z)] : null,
           target: t && fin(t.x) && fin(t.y) && fin(t.z) ? [f(t.x), f(t.y), f(t.z)] : null,
           floorY: r && fin(r.floorY) ? f(r.floorY) : null,
           ground: fin(input.ground) ? f(input.ground) : (r && fin(r.floorY) ? f(r.floorY) : null),
           size: [f(sz[0]), f(sz[1])], base: f(input.baseScale == null ? 1 : input.baseScale), y5c: f(input.y5c == null ? 0 : input.y5c),
           rank: input.rank == null ? 5 : input.rank, hitLife: !!input.hitLife,
           questLevel: fin(input.questLevel) ? input.questLevel >>> 0 : null,
           breakLevel7: fin(input.breakLevel7) ? input.breakLevel7 & 0xff : 0, tailSevered: !!input.tailSevered };
}
// the first missing input among those named, as a refusal reason (null: all present)
function missing001(own, need){
  if (need.facing && !own.facing) return 'no owner facing (input.owner.y)';
  if (need.floor && own.floorY == null) return 'no floor (input.rock.floorY)';
  if (need.target && !own.target) return 'no target (input.rock.target)';
  if (need.pos && !own.ownerPos) return 'no owner position (input.ownerPos)';
  if (need.ground && own.ground == null) return 'no ground (input.ground or input.rock.floorY)';
  return null;
}

// the owner's angle words as the spawners copy them into a shell01 setup: e+0xfe8..+0xff0, the words' low halves
// (0xc2710 copies block +0x50..+0x58 there, the advance's wrapper keeps the low halves, 0x719e4..0x71a04)
const ownerWords001 = own => [own.ownerX & 0xffff, own.ownerY & 0xffff, own.ownerZ & 0xffff];

// 0x72714 mode 0 on the frame pair (F[k-2], F[k-1]] -- the test in stepShells (0x72b1c; looped 0x7294c)
function pass001(state, F){
  const [prev, cur] = state.hist, ls = state.loopStart;
  return prev <= cur ? (!(cur < F) && prev < F) : ((ls != null && ls <= F && !(cur < F)) || prev < F);
}

// The attack actions' spawn helpers (notes 2.1 / 2.2 / 2.3), in the enemy's action code (line 4) on the previous pose's
// joints: which test passed and which mode it makes; shell00 -> a fireball, shell01 -> the helper's setup (0x3fa2bc: +0x10
// = the zero vector 0x19176b0, +0x30.. = e+0xfe8.., +0x3c = 0xffff; 0xd09b84 for the breath)
function spawn001(state, D, a, ctx, input, out){
  let i = -1;
  if (a.spawner === 0xd0baec){ if (a.spawnArgs[0] === 1) i = a.frames.findIndex(F => pass001(state, F)); }   // 76, else 72, else 68
  else a.frames.forEach((F, j) => { if (pass001(state, F)) i = j; });    // every test evaluated; the last passing one's mode
  if (i < 0) return;
  const own = ctx.own001;
  const J = state.prevJoints;
  if (a.shell === 'shell00'){
    const mode = a.modes[i], aimed = !!(params001(D.shells.shell00.modes[mode].sh).flags & 1);
    const why = missing001(own, { facing: true, floor: true, target: aimed, pos: aimed });
    if (why){ out.refused.push({ action: a.action, shell: a.shell, mode, why }); return; }
    const S = make001(state, D, 'shell00', { id: D.shells.shell00.id, mode, position: [0, 0, 0], angles: [0, 0, 0], action: a.action, frame: a.frames[i] },
                      own, J, ctx, null);
    if (S){ state.shells.push(S); out.spawned.push(S); }
    return;
  }
  const mode = a.modesG && own.rank > 4 ? a.modesG[i] : a.modes[i];      // 0x3a8430 > 4 (G rank, INFERRED)
  const why = missing001(own, { facing: true });
  if (why){ out.refused.push({ action: a.action, shell: a.shell, mode, why }); return; }
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode, position: [0, 0, 0], angles: ownerWords001(own), action: a.action, frame: a.frames[i] },
                    own, J, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
}

// ctl+0x14 this step (the hover dust's pulse; see the dust rows): the ROM's timer ctl+8 counts the enemy's moves from its
// setup (0xcece94 = 0; + the step x 1.0 each move, the viewer's unit step dt 1) and pulses on the move where it reaches
// 100.0, i.e. moves 100, 200, ... since the setup, whatever clip plays. The viewer gives its own count of steps since
// the monster was mounted, this one included (input.stepCount: the schedule's step counter; without it, this module's
// count of stepShells calls since createShellState, state.frames): the pulse is on every 100th. Its PHASE -- the mount,
// not the game's setup -- is a viewer stand-in.
function pulse74(input, state){
  const n = Number.isFinite(input.stepCount) ? input.stepCount : state.frames;
  return n > 0 && n % 100 === 0;
}

// The per-frame handler's landing dust (vtable +0x208 = 0xcf1a5c, after the enemy's move; notes 2.4): the row of the
// playing motion id, its test, then 0xd09e28(e, mode, 900.0) -- block +0x44 > block +0x5b4 + 900 (or unordered) ->
// nothing (0xd09e48..0xd09e5c); else a setup at block +0x40.. with e+0xfe8.. (0xd09e80..0xd09ee0). `a` = the action the
// viewer names for the clip (the hover rows skip (4, 0x15), 0x6fe88). The posture the L2 M12 row reads is the one the
// ROM has while that clip plays (D.postures); input.posture overrides it for the checks only -- the viewer never
// passes it (the harness's reference D6 forced 3).
function dust001(state, D, ctx, input, out, fresh, a){
  const m = /^Motion\[(\d+)\]$/.exec(input.clip || ''), L = String(input.list);
  if (!m || !/^\d+$/.test(L)) return;
  const mid = (Number(L) << 8) | Number(m[1]);
  const row = D.dust.find(r => r.ids.includes(mid));
  if (!row) return;
  const own = ctx.own001;
  let at = null;                                         // the setup's point, when a shell is made
  if (row.pulse){
    if (!pulse74(input, state)) return;                  // byte ctl+0x14 (block +0x74) != 0 (0xcf1b50)
    if (row.not && a && a.action[0] === row.not[0] && a.action[1] === row.not[1]) return;   // 0x6fe88(e, 4, 0x15) (0xcf1b38)
  } else if (row.period){
    const posture = input.posture != null ? input.posture : (D.postures || {})[L + '|' + input.clip];
    if (posture !== row.posture || fresh || !state.hist) return;   // posture P+0x1ba == 3 (0xcf1dc8, 0xcf1f74)
    // 0xb09a4(e, 1, 0, F) = 0x72714 mode 1: cur >= F (0x72b04); after a loop (0x7290c) prev + step >= F || cur >= F, and
    // prev + step, the frame before the wrap, is past the clip's end -- taken as true (INFERRED). `from` F: on when it is
    // true (0xcf1dc8, 0xcf1f30); `until` F: on when it is false (0xcf1f54). The step after a fresh one tests [start,
    // start], the pair the motion change 0x7256c leaves (+0x13ac = the start frame, +0x13b4 = 0): the ROM's frame of the
    // setMotion, whose handler call counts (the flight dust from cur 0: dk reference KD3 / KD5)
    const [prev, cur] = state.hist;
    if (row.from != null && prev <= cur && cur < row.from) return;
    if (row.until != null && !(prev <= cur && cur < row.until)) return;
    // 0xcf2424: block +0x5c58 += the owner's dt (0x7264c -> 0x539d48, vmla with 1.0); at >= 16.0 it is reset to 0 and
    // mode 15 made at (block +0x40, block +0x5b4, block +0x48) -- no 900 test here (the shell's own init has one)
    state.acc5c58 = mla(state.acc5c58, ctx.dt, 1.0);
    if (!(state.acc5c58 >= row.period)) return;
    state.acc5c58 = 0;
    const why = missing001(own, { facing: true, pos: true, ground: true });
    if (why){ out.refused.push({ dust: row.at, shell: 'shell01', mode: row.mode, why }); return; }
    at = [own.ownerPos[0], own.ground, own.ownerPos[2]];
  } else if (fresh || !state.hist || !pass001(state, row.frame)) return;             // 0xb09b0(e, F)
  if (!at){
    const why = missing001(own, { facing: true, pos: true, ground: true });
    if (why){ out.refused.push({ dust: row.at, shell: 'shell01', mode: row.mode, why }); return; }
    if (!(own.ownerPos[1] <= f(own.ground + 900.0))) return;                         // 0xd09e28's height test
    at = own.ownerPos.slice();
  }
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: row.mode, position: at, angles: ownerWords001(own), frame: row.frame == null ? null : row.frame },
                    own, state.prevJoints, ctx, null);
  if (S){ S.dust = row.at; state.shells.push(S); out.spawned.push(S); }
}

// the spawn helpers stepShells hands a Rathian action to
const HELPERS001 = new Set([0xd0a134, 0xd0a394, 0xd0a614, 0xd0b638, 0xd0b0b8, 0xd0baec]);

// A SPAWN AT THE MOTION'S END (`atEnd`): there the ROM tests no frame but the motion's ended flag -- 0xb09c8(e) ->
// 0x94dc04: bit 2 of byte e+0x4b6 -- and Dreadking's L9 M1 actions (7, 0xfa) / (7, 0xfb) spawn and set the next motion
// there. The table's frame is the clip's last (126, em002_04_9.lmt's 127 frames), which a play that runs to its end
// passes like any other frame. A viewer that LOOPS the clip never reports it: the pose's time wraps at the clip's
// duration, so its frames run ...125 and go back. That wrap is the end of that play -- the game plays this clip once and
// the action ends there, and stepShells already reads a wrap with no loopStart as the action issued again -- so the
// play's end shells are made on the wrap step, on its last frame's joints (the previous pose's, as every spawn here).
// The test is the ROM's own for a motion that wrapped past a frame: prev < F (0x72b1c) and prev + step >= F (0x7290c,
// the frame the motion would have had). INFERRED: that a viewer's wrap of a clip the game plays once is that play's end.
function endWrap001(state, D, a, ctx, out){
  // the play's last advance, and never less than one motion frame -- the ROM's own advance at motion speed 1 (0x7256c's
  // +0x13b4 per game frame). A viewer whose pose clock runs slower than this module's steps samples the same frame twice
  // just before the wrap, so the measured advance can be 0 while the play did reach its end
  const [p0, p1] = state.hist, adv = f(p1 - p0), reach = f(p1 + (adv > 1.0 ? adv : 1.0));
  for (const sp of a.spawns){
    if (!sp.atEnd) continue;
    if (sp.kind !== 'first') throw new Error('shells.js: an atEnd spawn of kind ' + sp.kind);
    const F = tuneFrames001(D, sp);
    const i = F.findIndex(x => p1 < x && reach >= x);
    if (i >= 0) create001(state, D, a, ctx, out, sp.shell, (sp.modesG && ctx.own001.rank > 4 ? sp.modesG : sp.modes)[i], F[i]);
  }
}

// ---- Rathian's siblings (em001_02 Gold, em001_04 Dreadqueen): the class's other spawn helpers ---------------------------
// An action entry with `spawns` (SHELL_DATA.em001_02 / em001_04) runs its helpers in order, in the action code (line 4) on
// the frame pair and joints spawn001 uses. Frames are the helper's literals, or (`tune`) floats of the monster's actiontune
// read by 0x6f618 (0.0 past the end, 0x3cb330).
const tuneFrames001 = (D, sp) => sp.tune ? sp.tune.map(n => f(D.tune && n < D.tune.length ? D.tune[n] : 0.0)) : sp.frames.map(f);

// THE SETUP ANGLE WORDS of (7, 0x70)'s helper 0xd0b804 (Silver Rathalos's shell00 0x25, the line's only mode whose
// reader sets flag 0x20, so the only shell whose init reads them): the owner's own angle words +0xfe8.. with the X word
// raised by 0x71c -- when the block +0x1e0 point is at least 1400.0 from the owner's position (0xd0b850..0xd0b8b0). The
// game sets that point with the target block +0x1d0 and moves it with the owner (0x6fd44..0x6fd64, 0xa4f80..0xa4fc4),
// so the viewer's target stands for it. Nearer than that -- and, for em 2 variant 1, always (0xd0b838..0xd0b84c) -- the
// ROM raises it by the class's tracked aim pitch instead, the halfword ctl+0x18 (0xcee0a0..0xcee184: the pitch to the
// target less the owner's own X word, clamped), which this module does not read: there the shell is refused.
function pitchAngles001(own, D){
  const why = missing001(own, { target: true, pos: true });
  if (why) return { why };
  if ((D.variant || 0) === 1) return { why: 'the tracked aim pitch (ctl+0x18; em 2 variant 1 always takes it): not read' };
  const t = own.target, p = own.ownerPos;
  const dy = f(t[1] - p[1]), dx = f(t[0] - p[0]), dz = f(t[2] - p[2]);
  const d = sqrtf(f(f(f(dy * dy) + f(dx * dx)) + f(dz * dz)));
  if (!(d >= f(1400.0))) return { why: 'the target is nearer than 1400: the tracked aim pitch (ctl+0x18) is not read' };
  const w = ownerWords001(own);
  return { angles: [(w[0] + 0x71c) >>> 0, w[1], w[2]] };
}

// a shell a sibling's helper makes, with the inputs its init reads (else a refusal): shell00 -- 0x3f883c's setup, which
// init001 does not read unless the mode's reader sets flag 0x20 (pitchAngles001); shell01 -- 0xd09b84's setup for a mode
// != 0x10 (0xd09c18..0xd09cbc: the zero
// vector 0x19176b0, the owner's angle words e+0xfe8.., +0x3c = 0xffff), or 0xd0a818's, the same words
function create001(state, D, a, ctx, out, shell, mode, F, angles){
  const own = ctx.own001;
  let why;
  if (shell === 'shell00'){
    const m = D.shells.shell00.modes[mode], aimed = !!(m && params001(m.sh).flags & 1);
    why = missing001(own, { facing: true, floor: true, target: aimed, pos: aimed });
  } else {
    // the ground snap (flag 4) queries the stage; flag 0x80 reads the owner's position and ground
    const m = D.shells.shell01.modes[mode], k = params011(m ? m.sh : null);
    why = missing001(own, { facing: true, floor: !!(k.flags & 4), pos: !!(k.flags & 0x80), ground: !!(k.flags & 0x80) });
  }
  if (why){ out.refused.push({ action: a.action, shell, mode, why }); return null; }
  const S = make001(state, D, shell, { id: D.shells[shell].id, mode, position: [0, 0, 0],
                                       angles: angles || (shell === 'shell00' ? [0, 0, 0] : ownerWords001(own)),
                                       action: a.action, frame: F }, own, state.prevJoints, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
  return S;
}

// vtable +0x148 with 0 = base01's end 0x3fb264 on a shell another one's create retires: nothing when it is already ending
// (state & 0xfe == 0xfe, 0x3fb27c..0x3fb288); else end011. Its stop events are this step's (line 4, before its move).
function retire001(S, out, ctx){
  if (S.state === 0xfe || S.state === 0xff) return;
  const ev = [];
  end011(S, ev, ctx);
  S.carry = (S.carry || []).concat(ev);
  out.ended.push(S);
}

// THE POISON: 0xd09b84(e, 0x10) (0xd09b84..0xd09e08). Nothing when vtable +0x370(e, 1) = 0xa3bf4 says P+0x3b4 & 1 (the
// sever 0xc2274 sets it: input.tailSevered). Variant 4: the quest's number n = 0x49930(e) = 0x3a8470(quest) (the quest
// id mod 100 for an ordinary quest, 0x3b8eb4; 0 or 0x10 for others, 0x3a84b0..0x3a84d0 -- input.questLevel) picks n > 8
// -> 0x18, n < 4 -> 0x10, else 0x17 (unsigned, 0xd09bcc..0xd09c10); other variants 0x10. Then part 7's break level
// 0x9d36c(e, 7) (byte P+0x3bc + 12 x 7: input.breakLevel7) at or over the .dtp break row 4's level (byte +0x11 at rank <= 4
// by 0x3a8430, +0x12 above: D.poison.levels) steps the mode down: & 0xf == 7 -> 0x10, == 8 -> 0x17 (0xd09cc4..0xd09d24).
// The two newest poisons are kept at ctl+0xa0 (older) / +0xa4 (newer), ctl = [e+0xcac0]: the older one gets vtable +0x148
// with 0 (retire001), the newer becomes the older, the new shell the newer (0xd09d28..0xd09e04); vtable +0x1dc (0xcee250,
// em 1 variant 4, every move before the action) drops a handle whose unit left states 1 / 2 (0xcee358..0xcee3c4: stepShells).
function poison001(state, D, a, ctx, out, F){
  const own = ctx.own001;
  if (own.tailSevered) return;
  let mode = 0x10;
  if (D.variant === 4){
    if (own.questLevel == null){ out.refused.push({ action: a.action, shell: 'shell01', mode: 0x10, why: 'no quest level (input.questLevel)' }); return; }
    const n = own.questLevel;
    mode = n > 8 ? 0x18 : n < 4 ? 0x10 : 0x17;
  }
  if (D.poison){
    const th = own.rank <= 4 ? D.poison.levels[0] : D.poison.levels[1];
    if (own.breakLevel7 >= th){ const t = mode & 0xf; if (t === 7) mode = 0x10; else if (t === 8) mode = 0x17; }
  }
  const ring = state.poison;
  if (ring.older) retire001(ring.older, out, ctx);
  ring.older = ring.newer;
  ring.newer = create001(state, D, a, ctx, out, 'shell01', mode, F);
}

// 0xd09e28(e, mode, 900.0) from an action (Dreadqueen's L9 M7): the landing dust's create -- block +0x44 over block +0x5b4
// + 900 (or unordered) makes nothing (0xd09e48..0xd09e5c), else a setup at block +0x40.. with e+0xfe8.. (0xd09e80..0xd09ee0)
function ground001(state, D, a, ctx, out, mode, F){
  const own = ctx.own001;
  const why = missing001(own, { facing: true, pos: true, ground: true });
  if (why){ out.refused.push({ action: a.action, shell: 'shell01', mode, why }); return; }
  if (!(own.ownerPos[1] <= f(own.ground + 900.0))) return;
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                           action: a.action, frame: F }, own, state.prevJoints, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
}

// the helpers of one action this step (0x72714 mode 0 on (F[k-2], F[k-1]] each, as pass001):
//   'first' -- the first passing frame in the listed order makes its mode (modesG when 0x3a8430 > 4); one shell
//   'each'  -- every passing frame its own shell; `quest` = 0xd0bc28's gate 0x49930(e) >= quest (input.questLevel)
//   'seq'   -- 0xd01988's phases: frame j is tested only once j - 1 has passed (state.seq, 0 at the motion's start)
//   'poison' / 'ground' -- poison001 / ground001 at the frame
function spawnVar001(state, D, a, ctx, input, out){
  for (const sp of a.spawns){
    const F = tuneFrames001(D, sp);
    if (sp.kind === 'first'){
      const i = F.findIndex(x => pass001(state, x));
      if (i < 0) continue;
      const mode = (sp.modesG && ctx.own001.rank > 4 ? sp.modesG : sp.modes)[i];
      // a helper that fills the setup's angle words (only 0xd0b804's): the shell is refused where they are not read
      let ang;
      if (sp.angles === 'pitch'){
        const r = pitchAngles001(ctx.own001, D);
        if (r.why){ out.refused.push({ action: a.action, shell: sp.shell, mode, why: r.why }); continue; }
        ang = r.angles;
      }
      create001(state, D, a, ctx, out, sp.shell, mode, F[i], ang);
    } else if (sp.kind === 'each'){
      if (sp.quest != null){
        const q = ctx.own001.questLevel;
        if (q == null){
          if (F.some(x => pass001(state, x))) out.refused.push({ action: a.action, shell: sp.shell, modes: sp.modes.slice(), why: 'no quest level (input.questLevel)' });
          continue;
        }
        if (!(q >= sp.quest)) continue;
      }
      F.forEach((x, j) => { if (pass001(state, x)) create001(state, D, a, ctx, out, sp.shell, sp.modes[j], x); });
    } else if (sp.kind === 'shots'){
      // L4 M29's shots (0xd004cc's phase, helper 0xd0ae28): the clip loops at its frame 0 and each pass of the helper's
      // frame makes the next shot, P+0x1a2 counting them (raised at 0xd0b054..0xd0b064, zeroed when the phase starts at
      // 0xd005fc) until the action's count (0xd00710..0xd0071c, table 0x15927f8[r1 - 1] = 3 / 1 / 3 / 3, else 1), and
      // 0xd0ae28 reads the counter for its mode (r1 1: 0x10 / 0x11 / 0x12). `modes` is one entry per shot, so the count
      // is its length; state.shots counts them here -- the clip's own loop is not a new action, so only a change of clip
      // clears it (stepShells)
      const j = state.shots;
      if (j < sp.modes.length && pass001(state, F[0])){ state.shots = j + 1; create001(state, D, a, ctx, out, sp.shell, sp.modes[j], F[0]); }
    } else if (sp.kind === 'seq'){
      const j = state.seq;
      if (j < F.length && pass001(state, F[j])){ state.seq = j + 1; create001(state, D, a, ctx, out, sp.shell, sp.modes[j], F[j]); }
    } else if (sp.kind === 'poison'){
      if (pass001(state, F[0])) poison001(state, D, a, ctx, out, F[0]);
    } else if (sp.kind === 'ground'){
      if (pass001(state, F[0])) ground001(state, D, a, ctx, out, sp.mode, F[0]);
    } else throw new Error('shells.js: spawn kind ' + sp.kind);
  }
}

// ---- the step ------------------------------------------------------------------------------------------------------
export function createShellState(monId){
  // acc5c58: Rathian's block +0x5c58, the 16-frame dust period of 0xcf2424 (who else resets it: NOT READ; 0 here);
  // poison: Dreadqueen's ctl+0xa0 / +0xa4 (poison001), null at the setup; seq: 0xd01988's phase (spawnVar001); shots:
  // the Rathalos line's L4 M29 shot counter P+0x1a2, which its phase zeroes (spawnVar001's `shots`)
  return { monId, data: SHELL_DATA[monId] || null, motion: null, action: null, hist: null, prevJoints: null,
           shells: [], nextId: 1, frames: 0, acc5c58: 0, poison: { older: null, newer: null }, seq: 0, shots: 0 };
}

// a frame within 0.0005 under an integer is that integer (0x94ef64..0x94ef94, the motion advance; 0x72854 the test)
function snapFrame(x){
  const a = s32(f(x + SNAP)), b = s32(x);
  return a !== b ? f(a) : f(x);
}

// input: { monId, list, clip (base name, no _start/_loop), frame (60/s, _loop clips offset by their _start),
//          loopStart? (for a _loop clip: its _start clip's length in frames, where the motion loops back to),
//          joints: gid => 16 floats (game convention, this step's pose) or null,
//          rage (the viewer's Enraged state), action?: [status, number] to force, speed? (motion speed, 1),
//          dt? (unit step, 1), owner?: { x, y, z } (u16 angles, 0 for the viewer's untilted monster; y, the facing,
//          forward = (sin Y, 0, cos Y), is read only by the rocks and the spikes and is required by them; the spikes
//          also read x and z),
//          rock?: { variant: 'shell00_0' | 'shell00_8' | 'shell54_0' | null, target: { x, y, z } | null,
//                   floorY: number } -- the rocks' inputs that are NOT READ from the game (the AI's pick of the rock,
//                   the target its aim reads, the stage it hits: a plane at floorY); no rock without all of them.
//                   Nargacuga's spikes read the same object: variant = the action, '7:0x28' .. '7:0x84'
//                   (pickVariantsFor(monId, list, clip) lists a clip's names), the target only for the aimed
//                   '7:0x82' / '7:0x84', the floor always; owner.y (the facing) always, owner.x / .z as given (0).
//                   Rathian's actions the same way: variant '7:0x02' ... (pickVariantsFor(monId, list, clip, { tired,
//                   rage }): the fire actions, or while tired and not enraged the no-fire twins -- the command table's
//                   op-0x24 if / else; a blend partner clip names its main clip's), the target read only by fireball
//                   modes 0 / 4..7, the floor by every fireball,
//          RATHIAN (em001_00) also reads, on EVERY step (its landing dust needs no pick, so pass these even without a
//          rock variant): owner { x, y, z } (the words block +0x50 / +0x54 / +0x58; the fireballs take them whole, a
//          shell01 setup their low halves), ownerPos?: { x, y, z } (block +0x40.., game units: the aimed fireballs and the
//          dust; refused without it), ground? (block +0x5b4; default input.rock.floorY), size? ([+0x1ac, +0x1b0] or one
//          number = [n, 1]; default [1, 1], the unscaled monster), baseScale? ([[e+0x75e8]+0x64]; default 1), y5c? (block
//          +0x5c; default 0, at rest), rank? (0x3a8430's quest rank byte 1 / 3 / 5; default 5, "> 4" = G rank INFERRED:
//          the breath puffs 44..46; 1 / 3 make modes 31..33, which draw nothing), hitLife? (true: a timer-0 shell01 lives
//          while its hit slots count down, the hit data's delay + duration -- see slotStep; absent: move 1, the
//          ROM-run harness), stepCount? (the viewer's steps since the monster was mounted, this one included -- the
//          schedule's step counter: the hover dust's timer, one pulse every 100th step; its phase is a viewer stand-in for
//          the game's setup; without it this module counts its own calls), variant '4:0x15' (or action [4, 0x15]) to
//          name the hover turn that skips the L1 M2 / M11 / M12 dust -- never listed by pickVariantsFor, so the default
//          is the other one; posture? (a test override of P+0x1ba for the checks; the viewer never passes it),
//          GOLD RATHIAN (em001_02) / DREADQUEEN (em001_04) read all of Rathian's inputs (their actions by the same
//          names: pickVariantsFor), and Dreadqueen's poison and L9 M9 also: questLevel? (0x49930: the quest's number, the
//          quest id mod 100 for an ordinary quest; NO default -- without it the poison and L9 M9's 48..50 are refused),
//          breakLevel7? (part 7's break level P+0x3bc + 84; default 0, the setup's), tailSevered? (P+0x3b4 bit 0, set by
//          the tail sever; default false),
//          DREADKING (em002_04) reads Rathian's inputs, and questLevel? for its 0x1f fireballs' landing (0xd0e19c: > 6 ->
//          shell01 0x11, else 0x1b; without it that landing's shell01 is refused -- the fireball and its contact effect
//          are not), and posture 3 on its L4 Motion[25..27] (its SHELL_DATA postures: the flight dust). RATHALOS
//          (em002_00) and SILVER RATHALOS (em002_02) read Rathian's inputs and nothing of their own -- Silver's
//          (7, 0x70) reads the target for its pitch test (refused without it, or within 1400 of the owner),
//          effectAlive?: (shell, param, handle) => bool }
// returns { spawned, started, ended, removed, alive, refused, created }. spawned / ended / removed / alive are shells;
// each carries `start` (spawned: the effect request), `place` (each moving step: what 0x329c9c / 0x329d04 give the
// effect; always null for a rock or a spike) and `stop` (ended: 0x329c40(h, 0) when 0x43b058 says). `started`: the
// effects a shell's move started this step, { shell, start } in ROM order (a rock's bounce / landing, a spike's
// landing). `refused`: a rock or spike action whose spawn test passed without its inputs, { action, shell, mode |
// modes, why }. `created`: the shells a move created that are not stepped here, { shell, create } -- a spike's shell01
// drop at its floor contact ({ shell: 'shell01', id 0xc9, mode 0, position, angles, start: null, refused: true }: it
// never draws). A request's `pel` names the effect list its key is in (Savage 'em043_05u'; Nargacuga's spikes
// 'em037_00u').
// A rock also carries, every step: position (+0x40, after the step), anchor (+0x1000, the position before it), angles
// (the three u32 words +0xfe8 / +0xfec / +0xff0, as the ROM keeps them), velocity (+0x1010), timer, moves, bounces,
// held, events (this step's move: { ev: 'hit' | 'start' | 'stop', ... } in ROM order), launch (what the init left),
// effect (the flying effect's handle, param 0) and effect2 (the last bounce / landing effect's handle).
// RATHIAN: every shell is in out.spawned the step it is made -- by an action or the dust (line 4) or by another shell's
// move (a landing's shell01 1 / 2 or shell11; shell11's explosions), with `creator` (the maker's id) and createdAtMove --
// and carries `start` (the first effect its init started: the fireball's c 0 / u 30, the fire's c 3, an explosion's u
// 31..34, the dust's c 30 / 31, a puff's u 61 / 62; null for a hit volume or a mode with no files), `starts` (every one;
// em001_00 never starts two), `initEvents` ({ ev: 'start' | 'refused' }, in ROM order), `setup` (the setup the maker
// filled), position / angles (base01 never moves), timer (+0x1614) and elapsed (+0x1618). A fireball's landing puts c 1
// in out.started (effect2) and its creates in its events ({ ev: 'create', stepped: true, child }); `camera` events are
// 0x43ac04's requests. out.created stays for shells made and not stepped (Nargacuga's drop), none for Rathian. Her
// siblings' shells the same way (their starts name 'em001_00c' or their own 'em001_02u' / 'em001_04u'; Dreadking's
// 'em002_00c' / 'em002_04u' and Rathalos's 'em002_00c' / 'em002_00u', Dreadking's sp_01 end creates in the ending shell's
// events; Silver's 'em002_00c' / 'em002_02u'); a poison the newest two push out is in out.ended (its stop) the step it
// is retired.
export function stepShells(state, input){
  const out = { spawned: [], started: [], ended: [], removed: [], alive: [], refused: [], created: [] };
  const D = state.data;
  if (!D) return out;
  state.frames++;
  const ctx = { out, dt: f(input.dt == null ? 1.0 : input.dt), speed: f(input.speed == null ? 1.0 : input.speed),
                owner: input.owner || { x: 0, z: 0 }, motion: input.clip ? input.monId + '|' + input.list + '|' + input.clip : null,
                // the rocks: this step's stage floor, the owner's motion id (u16 +0x4b4), the frame its action code saw
                floorY: input.rock && Number.isFinite(input.rock.floorY) ? f(input.rock.floorY) : null,
                ownerMotion: input.clip ? motionIdOf(input.list, input.clip) : null, frameSeen: null };
  const J = typeof input.joints === 'function' ? input.joints : (() => null);
  // Rathian: the owner block its code reads (inputs, owner001), and the shells its shells make (0x48b884 during a move in
  // line 18: inited at once on this frame's joints, appended at the tail of the line, reported in out.spawned)
  if (D.dust){
    ctx.own001 = owner001(input);
    ctx.create = (creator, name, setup, events = creator.events) => {
      const def = D.shells[name], full = Object.assign({ id: def.id }, setup);
      const S2 = make001(state, D, name, full, ctx.own001, J, ctx, creator);
      events.push({ ev: 'create', stepped: true, shell: name, id: def.id, mode: full.mode, position: full.position.slice(),
                            angles: full.angles.slice(), child: S2 ? S2.id : null, deleted: !S2 });
      if (S2){ state.shells.push(S2); out.spawned.push(S2); }
    };
  }
  const frame = input.clip ? snapFrame(input.frame) : 0;
  // THE MOTION. A new clip is a new motion id. A frame that went back is either the motion's own loop -- a _loop
  // clip wrapping to its start (input.loopStart, the _start clip's length as driveClipEffects computes it) -- or the
  // viewer replaying a clip that does not loop, which for the game is the same action issued again (same motion
  // id, so a live shell is not ended by it).
  let fresh = false;
  const back = !!(state.hist && frame < state.hist[1]);
  const newMotion = ctx.motion !== state.motion;
  // the wrap of a clip the game plays once is the end of that play: its `atEnd` shells (endWrap001), made before the
  // action's state is reset below and on the joints of the play's last frame. The action is the one the step below
  // resolves (the clip has not changed): the table's own, or the variant the viewer named
  const endAct = back && input.loopStart == null && state.hist && state.prevJoints
    ? (state.action || (input.action ? null : variantActionFor(input.monId, input.list, input.clip, input.rock && input.rock.variant))) : null;
  if (endAct && (endAct.spawns || []).some(sp => sp.atEnd)) endWrap001(state, D, endAct, ctx, out);
  if (ctx.motion !== state.motion || (back && input.loopStart == null)){
    state.motion = ctx.motion;
    state.action = ctx.motion ? actionFor(input.monId, input.list, input.clip, !!input.rage, input.action) : null;
    state.hist = [frame, frame];
    fresh = true;
  }
  state.loopStart = input.loopStart == null ? null : snapFrame(input.loopStart);
  if (fresh) state.seq = 0;
  // P+0x1a2, the L4 M29 shot counter: its action's phase zeroes it when it begins (0xd005fc) and the clip loops inside
  // that phase, so a new clip clears it here and a wrap does not
  if (newMotion) state.shots = 0;
  // Dreadqueen's poison handles: vtable +0x1dc (0xcee250, every move before the action main) drops one whose unit left
  // states 1 / 2 -- here a shell removed in an earlier step (0xcee374..0xcee3c4)
  for (const k of ['older', 'newer']) if (state.poison[k] && state.poison[k].state === 0xff) state.poison[k] = null;
  // 1. line 4, the enemy: its action code tests the previous advance, (F[k-2], F[k-1]], on last frame's joints.
  // A rock clip (L2 M23 / M24) has no action the table picks by itself: which rock the monster throws is the command
  // stream the AI takes (NOT READ), so input.rock.variant names it -- read at each spawn test. Nargacuga's spike clip
  // (L2 M8) the same: the variant names the action.
  const a = state.action || (input.action ? null : variantActionFor(input.monId, input.list, input.clip, input.rock && input.rock.variant));
  if (a && a.pick === 'hover'){
    // Rathian's hover turns make no shell: the action only matters to the hover dust below
  } else if (a && !fresh && state.prevJoints && HELPERS001.has(a.spawner)){
    // Rathian's spawn helpers: their own tests on the same frame pair, one shell per call (spawn001)
    spawn001(state, D, a, ctx, input, out);
  } else if (a && !fresh && state.prevJoints && a.spawns){
    // her siblings' other helpers (spawnVar001)
    spawnVar001(state, D, a, ctx, input, out);
  } else if (a && !fresh && state.prevJoints){
    const [prev, cur] = state.hist, F = a.frame;
    // 0x72b1c: cur >= f && prev < f; after the motion looped (0x7294c): (loopStart <= f && cur >= f) || prev < f
    const passed = prev <= cur ? (!(cur < F) && prev < F)
                               : ((state.loopStart != null && state.loopStart <= F && !(cur < F)) || prev < F);
    if (passed && a.spawner === 0xe48fc8){
      // Nargacuga's spawner: every shell of the action in this step, each inited here and moved below
      const got = spikeInputs(input, a.spawnArgs[1]);
      if (got.why) out.refused.push({ action: a.action, shell: a.shell, modes: a.modes.slice(), why: got.why });
      else for (const S of spawnSpikes(state, D, a, state.prevJoints, ctx, got)){ out.spawned.push(S); state.shells.push(S); }
    } else if (passed && a.spawner === 0xd16e08){
      // Khezu's lightning: the action's index makes its whole triple in this step, each bolt inited here and moved below
      const got = boltInputs(input);
      if (got.why) out.refused.push({ action: a.action, shell: a.shell, modes: (a.modes || []).slice(), why: got.why });
      else for (const S of spawnBolts(state, D, a, state.prevJoints, ctx, got, out)){ out.spawned.push(S); state.shells.push(S); }
    } else if (passed && isRockAction(D, a)){
      const got = rockInputs(input);
      if (got.why) out.refused.push({ action: a.action, shell: a.shell, mode: a.mode, why: got.why });
      else {
        const S = spawnRock(state, D, a, state.prevJoints, ctx, got);
        if (S){ out.spawned.push(S); state.shells.push(S); }
      }
    } else if (passed){
      const S = spawn(state, D, a, state.prevJoints, ctx);
      if (S){ out.spawned.push(S); state.shells.push(S); }
    }
  }
  // Rathian's per-frame handler (its landing dust), run from the enemy's vtable +0x28 after its move: still line 4
  if (D.dust) dust001(state, D, ctx, input, out, fresh, a);
  ctx.frameSeen = state.hist ? state.hist[1] : null;               // F[k-1], for a held rock (0xb09a4)
  // 2. line 18, the shells, in the order they were made: each one's move (vtable +0x24) on this frame's joints. The
  // walker 0xc04728 reads a unit's next pointer (+0x14) before it runs the unit (0xc047a4) and 0xc03670 appends a new unit
  // at the tail: a shell a move makes is reached in this walk unless its maker was the last unit (Rathian's landings and
  // explosion timer; Savage's and Nargacuga's shells make none that are stepped)
  for (let i = 0; i < state.shells.length; i++){
    const S = state.shells[i], last = i === state.shells.length - 1;
    if (S.base === 'base03') stepBolt(S, ctx, input, D, out);
    else if (S.base === 'base00' || S.base === 'base54') stepRock(S, J, ctx, input, D, out);
    else if (S.base === 'base01' || S.base === 'base11') step011(S, ctx, input, D, out);
    else stepBreath(S, J, ctx, input, D, out);
    if (last) break;
  }
  // the hit manager's pass (input.hitLife only; see slotStep): every registered slot counted down once
  for (const S of state.shells) if (S.slots) for (const sl of S.slots) slotStep(sl, ctx.dt);
  for (const S of state.shells) if (S.state === 0xff) out.removed.push(S);
  state.shells = state.shells.filter(S => S.state !== 0xff);
  out.alive = state.shells.slice();
  // (no motion yet -- the viewer shows the monster before any clip plays -- leaves hist unset; a motion's start sets it)
  state.hist = [state.hist ? state.hist[1] : frame, frame];
  // the joint matrices this step's pose was built with: the next step's action code reads these
  const snap = new Map();
  state.prevJoints = gid => { if (!snap.has(gid)){ const m = J(gid); snap.set(gid, m ? Array.from(m) : null); } return snap.get(gid); };
  // eager copy of the joints a shell may ask for, so the snapshot is this step's even if the caller reuses arrays
  for (const sh of Object.values(D.shells)) for (const m of Object.values(sh.modes)){
    const g = shellJoint(sh, m);
    if (g != null) state.prevJoints(g);
  }
  state.prevJoints(0);
  return out;
}

// one breath shell's move this step (base04 0x3ff938, base55 0x42cb28): Savage's shell04 / shell55
function stepBreath(S, J, ctx, input, D, out){
  const alive = p => (input.effectAlive ? !!input.effectAlive(S, p) : true);
  if (S.state === 1){
    if (S.effect && !alive(0)) S.effect.gone = true;                // 0x3ff944: a dead handle is cleared
    const r = S.base === 'base04' ? move04(S, J, ctx, D) : move55(S, J, ctx, D);
    S.place = (S.effect && !S.effect.gone) ? { param: 0, position: S.anchor.slice(), rotationDeg: aimOf(S.position, S.anchor, ctx.owner.z) } : null;
    if (r === 'end'){ end(S); out.ended.push(S); }
  } else if (S.state === 0xfe){                                     // 0x3ff998 / 0x42cbbc: waiting for the effect
    S.place = null;
    let T = S.timer;
    if (!(T > 0)){ S.timer = 0; S.state = 0xff; }
    else {
      T = f(T - ctx.dt); S.timer = 0 >= T ? 0 : T;
      const any = (S.effect && !S.effect.gone && alive(0)) || (S.effect2 && alive(1));
      if (!(T > 0) || !any) S.state = 0xff;
    }
  }
}

function spawn(state, D, a, J, ctx){
  const def = D.shells[a.shell], mode = def && def.modes[a.mode];
  if (!mode) return null;                                             // no ShellInfoList entry for the mode
  const S = { id: state.nextId++, monId: state.monId, shell: a.shell, cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: a.mode, action: a.action, spawnFrame: a.frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, trail: null, timer: 0,
              effect: null, effect2: null, start: null, place: null, stop: null };
  const ok = def.base === 'base04' ? init04(S, mode.sh, J, ctx.owner) : init55(S, mode.sh, J, ctx.owner);
  if (!ok) return null;                                               // the init's own refusals delete the shell
  S.prevPosition = S.position.slice();
  S.start = effectRequest(D, mode, 0, S.anchor, S.angles);            // _ef param 0, on the shell itself
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  S.folder = def.folder;
  // every effect param the mode names, as (list, key); only param 0 is ever started (param 1 is (999, -1), which
  // 0x4a11e4 refuses: listId > 7)
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key,
                                                       started: param === 0 && !!S.start }));
  return S;
}

// vtable +0x148 with 0 (0x400234 / 0x42d504): stop the effect gracefully, wait up to 30 x 60 frames for it. The move
// placed the effect first (0x3ffd70 / 0x42d020 run before the end test), so this step's `place` stands.
function end(S){
  S.state = 0xfe;
  S.timer = ENDING_FRAMES;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;   // 0x43b058 -> 0x329c40(h, 0)
}

// game-convention joint matrix from a three.js matrixWorld (viewer units): translation times 100, as live.js does
export function gameJointFrom(elements){
  const m = Array.from(elements);
  m[12] = f(m[12] / 0.01); m[13] = f(m[13] / 0.01); m[14] = f(m[14] / 0.01);
  for (let i = 0; i < 16; i++) m[i] = f(m[i]);
  return m;
}
