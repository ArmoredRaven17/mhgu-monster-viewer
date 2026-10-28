# Kushala Daora (em024_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm024_00`. No states note existed. Scratch: `<archive>/zg/c024.asm` (the whole band), `pp024.asm`, `hook204b.py`,
`jscheckpd.py` (CHG / SNOW / A18), `states060.py`, `partscr.py`, `scrdump.py`.

## 1. The PSL enable word -- vt+0x13c = `0xdfd19c` -- R, read whole and emulated

`0xdfd19c..0xdfd244`, on every motion: ctl+0x2c == 1 (isEnraged at the last action start, vt+0x204 `0xdef358`) and ctl+0x2d (the
snow maps: e+0x1053 in {3, 14, 20}, `0xdef0c8`) -> bits 18-20; else by the wind aura P+0x1bb through `[0x15928a8]` = {0x38000,
0x38000, 0x38000, 0xe00000}: 0xff -> [0], 0 / 1 -> [level], 2 -> [1] / [2], 3 -> [3] unless ctl+0x18 (then [2]), 4..0xfe nothing.
ctl+0x18 = `0xa1f0c(e, 2)` = P+0x5e08 bit 1, rebuilt at each action start. Emulation over aura 0..4 / 0xff x snow x the flag: **123120
runs x4, 0 mismatches**; control all mismatched.

## 2. The Wind Aura control -- built

P+0x1bb is 0 at reset (`0xdef058`) and moved by the action-start hook's switch (`0xdef314..`: +1, -3, to 0 by action; the horn
break drops it). It is what the word reads, so it is a **Wind Aura** select (motion-states.js `CLASS_CONTROLS.em024_00`, index.html
`paintClassControl`, Levels 0..3) handed to pslMask as `windAura`. The action's own change to the level is not applied (the
control is the level the play starts on); the snow map and P+0x5e08 bit 1 are not held (off, named).

## 3. The states -- R

- Status 10: (10, 7) part 0 -> `0x17b44b0` (L3 M3 -> wait 200 -> L3 M5 -> L3 M7), 1..5 -> L3 M1, 6 / 7 none; (10, 0x72) part 0 ->
  `0x17b44b0`, part 2 -> `0x17b4450` (L3 M15 -> L3 M16); (10, 0x14) parts 3 / 4 and the exhaust (10, 0x1b) -> `0x17b4430` (L3 M3 ->
  L3 M2); sleep (10, 0x1d) L3 M14 -> L3 M55, (10, 0x1e) op 1 -> a record naming 0x30a (L3 M10 held -- I), (10, 0x44) L3 M7 -> L3 M17;
  paralysis L3 M13 held; the stun (every side) L3 M3 -> L3 M5 held -> L3 M7; recoveries L3 M17; no shock-trap case; death L3 M18.
- vt+0x204 on (10, 0x72) (emulated, `hook204b.py`): part 0 -> `0x9d438(e, 0)` (the horns' 0xff row: u 1000) and ctl+0x24 = 1;
  part 2 -> `0xc2274(e, 0, 0, 0x8f)` -- **the tail sever at joint 143**.
- The part pass vt+0x210 `0xdfcc60` (READ whole): set 0; ctl+0x24 ? 7 : 2 (horns); part 5 vs .dtp row 1 -> 8 + 9 : 3 + 4 (wings, u
  1025); P+0x3b4 bit 0 -> 10 : 5 (tail).
- Eyes `0x71398(e, 1, 6, -1)` (`0xdef1d8`): open 1, shut 6. Tired (0, 2) L0 M22; **no drool**: vt+0x1d8 writes e+0xb7d3 = 0
  (`0xdef18c`), the band's only write. Rage: g6 s0 -> (4, 0x11) L2 M18 in the air, else (1, 0x1b) L0 M5.
- CUT_TAIL: descriptor [23] `0x1596340` -> em024_00_tail (word 1 0x7a56), joint 143, no +0x78 row (20).

## 4. The wind barrier -- R, built

vt+0x208 `0xdeffc4` (READ to `0xdf00fc`): while not dying, the handle e+0xcac8 holds id ctl+0x2c == 1 ? (ctl+0x2d ? 1005 : 1007) :
(ctl+0x2d ? 1004 : 1006) -> keys 220 / 240 / 210 / 230 (`[0x169d3b8]`); another key on the handle (+0x1b4) is stopped and the
wanted one requested; at death stopped. With the snow map off: **calm u 230, enraged u 240**, held across every clip --
`CLASS_TIMERS.em024_00.holds`. The old export had u 220 / u 240 as `rage` (both on at once): retagged `event` (format kept), u 230
exported. **The barrier records recorded this time** (the 2026-09-14 infrastructure wall did not reappear: 68 sets, 0 failed).

## 5. Implemented / results

psl-mask.js `em024_00` + CLIP_ACTIONS (L0 M5 / L3 M3 copies); CLIP_VARIANTS; MOTION_STATES.em024_00; CLASS_TIMERS / CLASS_CONTROLS;
tail-option.js CUT_TAIL.em024_00; `--apply` +4, recorded (68 sets).
Check dev/checks/elders.mjs (word, Wind Aura row, the barrier held on L0 M1) pass. Soak **53 motions, 0 refused**.

## 6. The sleep hold, read (2026-10-18)

- (10, 0x1e) is script 0x17b4370: op 1 -> 0x17b42bc, then end (fe). The stepper's op 0 / 1 / 2 arm 0x9f33c stores the
  record at P+0x560 and calls setMotion only for ops 0 / 2 / 0x35 (0x9fea8..0x9febc). The tracer shows no motion call.
- So the hold is the clip (10, 0x1d) leaves running: L3 M55, its last op. The row moved from L3 M10 to L3 M55; the L3 M10
  reading is withdrawn in rom-map.
- The same read for Chameleos ((10, 0x1e) 0x17b5aa0: op 1, end) gives L3 M10, which the row already used: now READ. For
  Teostra ((10, 0x1e) 0x17b7210) it gives L3 M17 (dev/em027_00-effects-spec.md 6).

## 7. The snow barrier (2026-10-18)

On the snow maps (ctl+0x2d set) vt+0x208 holds id 1004 = u 210 calm / 1005 = u 220 enraged (em024_00_100) in place of u 230 / u 240. The viewer's snow input is the Snow Variants list (snowNow); CLASS_TIMERS.em024_00 reads c.snowMap. u 210 exported (UNIQUE #22, event, stop). The routed step calls now carry the same user input as the raw clip's (index.html userIn). dev/checks/elders.mjs: u 210 held on Snow Variants L2 Motion[7], back to u 230 off it.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **P+0x5e08 bit 1 -- the setter READ** (rom-map row "P+0x5e08 (the ailment state byte)"): the hit pass's first ailment
  accumulator (`0x9a290` -> `0xa239c`, data entry +0x34) -- poison: the shared `0xa4518` requests c 1100 on it. While it is set the wind (ctl+0x18) is off. A "Poisoned"
  toggle is what the ROM's test supports (category c, listed; it would also put out Teostra's aura).
* **Poisoned -- BUILT 2026-10-19** (CLASS_TOGGLES `poisoned`, working label): the word reads P+0x5e08 bit 1 (`aura5e08`), and the
  class timer requests c 1100 at once and every 90 frames (0xa4518's arm: P+0x5c5c reset to 90.0).

## 8. Read since, indexed in rom-map (doc audit 2026-10-24)

* **His aura effect** (gapF, READ, NOT BUILT -- the effects lane's): in vt+0x208, `0xdf0514..0xdf0608`. e+0xcac4 holds id 1000 + L
  (L 1..3) -> vt+0x1d0 `0xdfd42c` -> `0x6feb8(e, 2, [0x169d3b8][id - 1000])` = **u 1 / u 0 / u 10**; a wrong key (+0x1b4) is stopped and
  re-requested; any other L stops it. ctl+0x24 -> P+0x5cfc |= 1 (|= 2 with e+0xb5f5 == 1). rom-map row `0xdf0514..0xdf0608`;
  `<archive>\gapF\RESULT.md` a3.5.
* **The pulse clock's writers** (ctl+0x1c): ctor `0xdeeebc`, vt+0x1d8 `0xdef070`, the pulse reset `0xdf08a4`, the add `0x7264c` at
  `0xdf0880`. rom-map row "ctl+0x1c (Kushala's pulse clock) -- writers"; `<archive>\gapF\RESULT.md` a3.6.
* Which sp_01 modes the page never makes: closed 2026-10-20 (all the frame handler's; rom-map row "Kushala's c 29 / 30 / 32..35").

## 9. Where the wind aura draws (Raven, 2026-10-27: "Review Wind Aura's location"; tools `<archive>/kushwind/`)

Raven's view: side-on, facing left, Level 3 -- the dark cloud well in front of and below his head, not around him.

**What draws the cloud.** u 10 (Level 3, em024_00_004 rows MASK1 4) has six model rows. The dark cloud is rows 7 / 8: cm101_002
mesh 0 (a dome, local z 0..4.7), facing mode 9, pushed along the camera ray. Drawing u 10's draws one at a time from the side
puts the cloud on cm101_002 #0 (`shots/final`, `shot_mesh.out`).

**The records' placement (READ, payload):** u 0 / u 1 / u 10 are **joint 0** (+0x32 = 0, not -1), mode 0, **space 2**
(+0x38), +0x37 4, offset u 1 (0, 0, 250), u 0 / u 10 (0, 0, 0), scale 1.0 / 1.5 / 1.5. The request goes through the shared
block e+0xb640 (`0xdf05cc`: `ldr r0, [r2], r0` with r2 = e is the vtable read, r2 += 0xb640), whose override words stay 0
(`0x40a54` -> `0x31b6b0`; no store to e+0xb654 / e+0xb692 in the image), so every field is the record's. The joint -1 rule
(live.js unitMatrix) does not touch these records.

**Each link, read:**

1. Start `0x32a284`: compose state 0 -> `0x9ba5d8` with the quaternion `[GOT 0x15087c4]` (a constant identity), the joint
   `ldrsh [desc+0x72]` and offset desc+0x40; parent mode 3 (`0x32a2d4`).
2. Recompose `0x327188` -> `0x31d16c`, space 2 (`0x31d410..0x31d46c`): the angles = the effect's start angles (+0x340, from its
   own quaternion, `0x326e4c` / `0x8a4b88`) + (payload +0x54 ? +0x350 : 0) + radians(payload +0x10), stored to the result's +0x30
   (`0x31f0a8`) -> `0x8a4dfc` sets the rotation. All zero here: **the effect's frame is the world's axes**, not his yaw, not the
   joint's (measured: its rows exactly identity while joint 0 tilts ~14 deg). Payload +0x39 = 0, so the joint arm (`0x31f130` ->
   `0x31f620`) gives the position: joint 0, his hips, (0, 320, 0) on L0 M1.
3. Nodes: both em024_00_004 nodes are transform mode 2 (+0x10c 0x20020 / 0x20028): position from the product, rows from the
   node's own quaternion (`0x9bbebc`) -- identity.
4. Spawn `0xa59c1c` -> shape `0xa5b488`: rows 6 / 7 / 8 / 12 are **shape 6** (base +0x78), whose arm `0xa5bc50` gives
   z = base +0x70 + rnd x base +0x74 = **500**, times the node scale 1.2 (1.5 x his 0.8) = **600 along the frame's +Z**, i.e.
   world +z. Measured: rows 7 / 8 particles at (0, 320, 600).
5. Draw `0xa9272c` (the Model generator's draw): the camera block's +0xb0 copied (`0xa54e84`); facing mode = param +0x100 bits
   8..11 (9 for rows 7 / 8; `0xaf9d20` leaves mode 9 the camera's world matrix as it is; `0xafa464` re-aims the rows for 9..12);
   the result's translation is the particle position (`0xa93354`); with param +0x10c bit 28 (`0xa9281c`) the position moves
   `param +0x110 x gen +0xfc` along unit(position - eye) (`0xa93374..0xa93408`): rows 7 / 8 500 / 400 x 1.2 = 600 / 480 **away
   from the camera**.
6. The camera block itself (`0x88287c`, the scene's camera block builder): +0x70 = the view as handed in, +0xb0 = its rigid
   inverse (3x3 transposed, translation -(t . R^T)), +0x40 = that inverse's translation (the eye). The viewer's host.setCamera
   writes the same three (view, viewI, eye) -- the convention matches.

**So the cloud's place depends on the camera's angle** -- measured (`shot_sweep.out`, camera yaw around him at the same height):
the dome's translation is (1, 226, 7) from the front (the 600 forward and the 600 push cancel: it frames him, `front_l3_aura`),
(-561, 264, 806) from his right side (Raven's view), (0, 276, 1198) from behind. A push along the camera ray never moves a
particle on screen, so what the side view shows is the emitter's own 600 forward -- ~200 past his head, at hip height (the dome
then reads "in front of and below his head"). Freezing the draw camera at the front view puts it back on him; freezing the game
camera (host.setGameCamera) changes nothing: it is the draw's camera block.

**Level 2 (u 0)**: rows 4 / 6: cm120_016 #1 at (0, 314, 720) -- shape 6 +500 x 1.2 forward, then 100 x 1.2 toward the camera --
720 ahead of his hips even from the front. Level 1 (u 1): the record offset (0, 0, 250) turned by joint 0 lands at (-27, 273, 192).

~~**Verdict: the viewer runs the ROM's own code for every link, and no input differs ... NOT CHANGED.**~~ WITHDRAWN the same
day (rom-map Withdrawn): one link was not the ROM's -- the node update's tail call `0x9bca30`, which the viewer left out as a
"draw registration" (owner.js nodeStore, a no-op native in bridge.js).

**The cause, READ (2026-10-27, second pass):**

7. Node update tail `0x9bca10`: with the node's +0x110 bit 12 it calls **`0x9bca30(owner, node)`**, which takes the sCamera
   viewport camera (`*0x211f504` +0x54, the owner's first draw view) and **turns the node's matrix to it**: with +0x110 bit 13
   (`0x9bcda0`) `0xafb350` aims the node's Z at the camera's position (camera +0x70) with the camera's up (+0x50); without it
   (`0x9bcaf4`) the rows are multiplied by the inverse of the camera's view. The node init `0xae83c8` sets bit 12 from block +4
   & 0x30000 and bit 13 from block +4 bit 17: em024_00_004's two nodes (+4 0x20020 / 0x20028) have both. So both nodes' +Z
   point at the camera, and shape 6's +500 is emitted **toward the camera** -- rows 7 / 8 then pushed 500 / 400 back land on
   the hips / 100 in front of them from every side, as the data's pairing says.
8. The three leads: the start pose +0x340 / +0x350 (`0x326e48` = vt+0x12c) is the effect's own identity start pose (+0x350 only
   with payload +0x54) -- not the turn. Node 1's block +4 bit 3 has no reader in the node init or update (`blk4scan.py`, control:
   the init's bits 0 / 1 / 4 / 5 / 16 / 17) -- not the turn. The spawn `0xa59c1c` and its four callees read no camera; shape 6's
   +Z is in the node's frame, which `0x9bca30` has turned.

**Built** (owner.js nodeCamera / aimRows from `0x9bca30` / `0xafb350`; bridge.js's 0x9bca30 native now calls it for the lifted
node update; host.js setGameCamera writes camera +0x70 as the ROM does -- **its writer READ: uCamera vt+0x28 `0x895af8`**, every
frame, the eye recovered from the look-at view: -(the view's translation through its 3x3), +0x7c = 0; the ctor `0x89566c`
starts it equal to +0x40). The bit-12-only arm's inverse `0x232e24` is transcribed line by line (rom-inv44.js, generated by
`<archive>/kushwind/vfp2js.py`) and bit-exact against the ROM run on unicorn over 401 matrices (`inv44check.py` / `.mjs`).
Level 1's u 1 is not missing: alone it lights 45280 px at f5 and 13600..15614 at f80..f160, with dark troughs at f60 (111 px)
and f120 (0) -- a pulse; over 270 frames 48 / 56 meter samples are lit (`u1_frames.out`, `meter_u1_loop.out`). Results (`<archive>/kushwind/`): u 10's dome at (0, 320, 0) from every yaw (`fix_sweep.out`); side shots
`shots/reshoot/after_kushala_l{1,2,3}_{side,front,behind}.png` (aura only) and `after_kushala_l{1,2,3}_side_full.png`, the
`before_*` beside them (NODE_CAMERA.off); meter at Raven's camera unchanged (L1 u 1 24/26, L2 u 0 26/26, L3 u 10 26/26 lit);
soak of all 96 monster ids with every event / rage record started from the side: 0 refusals; elders.mjs 403/403.

**Audit** (`<archive>/kushwind/pushaudit.py`, census.out): every exported record whose model rows pair a shape-6 offset with a
camera push -- 207 records over 52 monster ids (22 of them event / rage / puff records); the class-held ones: Kushala u 0 (row 6) / u 10 (rows 7 / 8 / 12); **Amatsu u 0 /
u 1** (em058_00_100: joint 0, space 2, the same cm120_016 shape-6 +500 rows -- the same placement as Kushala's); Teostra u 0 / u 10
row 2 (cm100_000, shape 6 -400, push -500 toward the camera; his block's root joint 3). Kushala's barrier u 230 / 240 / 210 / 220
(mode 4, at the camera) and Chameleos's held records (shared c 1100 / 1108 / 1130..: no shape-6 push) are not this pattern.
After the fix (`nodeaudit.py` -> nodecensus.out): 1055 exported records have rows on a camera node (event 530, clip 338, shell
187), 652 of them with a shape-6 offset row there (those move on screen; the rest only turn), the shared break / state records
(cm202_060 u 1000.., cm200_004 c 1106 / 1108) on every monster among them. Amatsu u 0 / u 1 now wrap him from the side
(`after_amatsu_*`); Teostra u 0 / u 10 are pixel-identical before / after (no camera node on their rows).
Meter at Raven's camera (`meter_side.out`, L0 M1 looped, 120 frames): Level 1 u 1 1 start, 24 / 26 lit; Level 2 u 0 1 start,
26 / 26; Level 3 u 10 1 start, 26 / 26.
