# Gammoth (em083_00) / Elderfrost Gammoth (em083_04) -- effects spec (Fanged Beasts walk, 2026-10-17)

One class `uEm083_00` (vtable `0x17efaa8`). States: `states-em083_00.md` / `states-em083_04.md` (decode notes), already
transcribed in motion-states.js before this pass and unchanged by it. Scratch: `<archive>/zg/jscheckgen.py`, `allmot2.py`
(CLS=uEm083_00), `rec_lod.py`.

## 1. The PSL enable word -- vt+0x13c = `0x1054b8c` -- R, read whole and emulated

`0x1054b8c..0x1054bd0` (18 instructions): `0xca170`; `motion != 0x910` -> return; L9 M16 (0x910): `0x6fe88(e, 7, 0x6a)` (the
current action is (7, 0x6a), `e+0x73e0 / +0x73e1`) -> `|= 0x1c0000` (bits 18-20, u 511), else `|= 0xe00000` (bits 21-23, u 220).
No variant test. Gammoth carries no list 9: hers is the base word (the state gating of c 25, L0 M33 b6 / b9 / b12).
Check (`jscheckgen.py 17efaa8 em083_0N`, motions 1 / 0x21 / 0x1e / 0x121 / 0x210 / 0x215 / 0x90f..0x912 / 0x310 x statuses 1 / 7 /
10 x every number x rage x tired): **33836 runs, 0 mismatches** each; control (same ROM against em065_00's base-only
transcription): 1028 / 2056 mismatches.

## 2. The plays -- R (tracer)

`allmot2.py 4 910` (every status 0..0x11 x number x phase 0..3 x follows): L9 M16 is started by **(7, 0x6a)** and **(7, 0x6b)**
only, phase 0, both after `0xbc7f4(0)`. So one play fires u 511, the other u 220 -- never both (the viewer fired both before).
psl-mask.js CLIP_ACTIONS em083_04 `'9|Motion[16]'`. The machinery that follows (states-em083_04.md: status 7 numbers 0x6b / 0x6c
with motion in 0x910..0x912, the handle e+0xcb20 and id 1014 -> c 140) is the notes'.

## 3. The soak refusal at 0x3294c4 -- R, closed

The request routine `0x3294a8`: `blx [unit vt+0x68]`; 0 -> `+0x30 = 1`, return (`0x3294c4`, unrecorded until now). vt+0x68 =
`0x328d9c`, the mode-4 RANGE test (rom-map "Effect placement mode 4"): payload `+0x58` != 0 and |range point - parent| > range ->
0, start deferred. The record is **u 256** (mode 4, range 2000; L0 M30, L2 M21) -- u 265 (mode 0) and u 244 (mode 1) never reach
the test (its callers are mode 4 only), and their far recordings carry no `0x3294c4` while u 256's do. Recorded with the camera
far: `rec_lod.py em083_0N u256,u244,u265` -> `add_em083_0N_u256_lodmid` / `_lodfar` (CAMERA_AT 0,0,3500 / 7000) and the same for
u 244 / u 265 (12 sets); lifted.

## 4. Implemented

psl-mask.js `em083` (CLASS_MASK em083_00 / em083_04, PSL_MASK_MONSTERS) + CLIP_ACTIONS em083_04. add_effects `--apply`: Gammoth
+6 (u 242, 261, 302, 303, 340, 400), Elderfrost +8 (u 261, 302, 303, 340, 400, 472, 473, 520); recorded and lifted.
Checks dev/checks/em083_00.mjs / em083_04.mjs gained the word asserts and (Elderfrost) the in-page L9 M16 alternation
(back-to-back plays: index.html counts a clip's plays from 0 again when another clip comes between). Elderfrost's L3 M1
knock-off asserts assumed the cycle's phase and failed four ways (each arm one late): switching the list to 3 auto-plays L3
Motion[1], its first clip, which counts one play (debug check `<archive>/zg/dbg083.mjs`). The CHECK was wrong; it now takes
four consecutive plays and asserts the set. Checks: **Gammoth 62 / 0, Elderfrost 54 / 0**. Soaks: **Gammoth 80 motions, 0
refused; Elderfrost 94, 0 refused** (L0 M30 / L2 M21 play; were 2 refused each).

## Lane A2 (2026-10-26): the frame handler's requests (partial)

* vt+0x208 `0x10528ac` (rom-map "Effects lane A2"): u 120 (id 1013, held at e+0xcb20 by (7, 0x6a..0x6c)) is stopped at a frame of
  L9 M16..M18, or stopped with **u 140** (id 1014) asked once when the action or motion leaves them; and a per-part state pass over
  e+0xcb50.. that asks u 1040 / 1041, 1045 / 1046, 1050 / 1051, 1055 / 1056 on a part's state change (variant 4: 1 / 0; variant 0 the
  same, skipped on L2 M1 / M2 / M6 / M37 / M39). The state writers are NOT READ yet.
* u 256 is placement mode 4 (range 2000): it waits for the hunter within 2000 (E19); u 242 / 400 / 472 / 473 / 520 are mode 1.

## Lane A3 (2026-10-26): the snow-slot pass, u 120 / u 140, the u 242 group (rom-map "Effects lane A3")

* **The snow-slot pass** (vt+0x208 `0x10528ac`, `0x10529ac..0x1052d68`, READ whole). Each frame, each snow slot (e+0xcb50 + 4k: slots
  0..3 = parts 2..5 the legs, 4 the tail, 5 the trunk) is compared with last frame's copy (e+0xcb80 + 4k); a change asks through
  vt+0x1d0 (table `0x16a2534`): Elderfrost (variant 4) slot 0 -> 1 u 1040, -> 0 u 1041; slot 1 u 1045 / 1046; slot 5 (trunk) u 1050 /
  1051 except on L2 M16. Gammoth (variant 0) nothing while L2 M1 / M2 / M6 / M37 / M39 play; slots 0..3 -> 1 u 1040 / 1045 / 1050 /
  1055, -> 0 u 1041 / 1046 / 1051 / 1056, any other value u 1120 (the shared table's id 0); slot 4 -> 0 u 1060.
  Viewer: index.html `stepSnow083` reads the slots from the Parts rows (render/motion-states.js legSnow083 / trunkSnow083 on the
  user's rows alone). All eight of Gammoth's and Elderfrost's four leg records draw (partSweep probe). Not built: Gammoth's u 1120
  edge (the record is exported as the rage puff only).
* **u 120 / u 140** (Elderfrost's pel only). u 120 is held in e+0xcb20 from (7, 0x6a) / (7, 0x6b) on L9 M16 (at a tune frame not read)
  and from (7, 0x6c) on L9 M17 (from its start). It ends quietly at L9 M17 f110 (L9 M16 f72 for (7, 0x6a)); leaving the clips
  any other way stops it and asks u 140 once. Viewer: index.html `stepHold083`, L9 M17 only. Both draw.
* **The u 242 group** (u 242 / 400, Elderfrost also 472 / 473 / 520; all mode 1, no joint, 1000 ahead): the ROM makes the unit
  (recorder sets reach the build `0x9bb330`). The viewer's request ends at the base step's spawn-height test (limit 300) because
  the point stands at his hips (joint -1 at the gid-0 bone, live.js) over a floor the lowest-reach rule put under the trunk tip.
  Every action that plays these clips takes posture 0 first, so the floor is the unit: built (index.html FLOOR_AT_UNIT_CLIPS).
  The joint -1 origin (0x939278: the model's world matrix) is the coordinator's call -- with both, u 242 draws.

## Lane A4 (2026-10-26)

* **Elderfrost u 1050** -- the trunk's levels (`SNOW083_TRUNK`, sets 6 / 33 / 31 / 32 / 7): Intact {3, 4, 54} / **Partial Ice {3, 41, 54, 76}** /
  Ice {41, 54, 75} (default) / Animated Ice {54, 74} / Broken {3, 4, 64}. Level 1 is Partial Ice, which the Parts row hid; part-review.json now
  shows it (hide keeps Animated Ice only), so Ice -> Partial Ice is the slot-5 edge 2 -> 1 and asks id 1011 = u 1050. The option's name is
  unchanged (for Raven).
* **Elderfrost u 120 on L9 M16**: (7, 0x6a) / (7, 0x6b) phase 1 ask it when `0xb0974` crosses **f10** (`vmov.f32 s0, #10` at `0x105a700` /
  `0x105a804`, then `0x10547c4`). index.html stepHold083 holds it from f10 -- to f72 under (7, 0x6a) (stopped, nothing asked: `0x1052be4`),
  while L9 M16 plays under (7, 0x6b); cut off by another clip or play -> u 140 once.
* **Gammoth u 1120 on the snow-slot edge**: a leg slot changed to a value other than 0 / 1 asks id 0 = u 1120 (`0x10529ac..`). The record is
  exported as the rage puff only, so schedule.js `fire(pel, key, also)` starts the `ragePuff` entry: stepSnow083 `rt.fire(pel, 1120, 'ragePuff')`.
* **Posture 4** (rom-map "THE POSTURE-4 SINK"): (2, 0x11) / (12, 0) play L0 M40 in posture 4 with **no P+0x5c write** in the band (the class
  has no writer), so nothing is drawn below the ground.
* **Joint -1** (the u 242 group): the audit is in rom-map "Effects lane A4"; the shipped rule is unchanged (Raven decides).
* (later, lane A4) motion-states.js trunkSnow083 now matches the row's option to a level's set exactly (userLevel read Partial Ice as Broken through the fur part 3). Ice -> Partial Ice requests u 1050 (1 request, laneA4/sink4/dbg1050.mjs); its draw is not yet metered (open). u 120 on L9 M16 draws (2 starts); Gammoth's u 1120 on a leg -> Broken draws (1 start).
