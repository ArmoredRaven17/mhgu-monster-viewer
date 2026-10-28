# Monster attack shapes: what hits a hunter (effects lane, 2026-10-22)

Raven: "can you look into Monster Attack Hit Capsules? Not sure if those also use capsules or not, I want to see what hits a hunter or not."
The ROM rows are in rom-map ("Monster attack shapes"). This note is written to be reused for 3U / 4U / FU, so every field gives its consumer.

## 1. The answer

* **Mixed: spheres and capsules.**
  - Over all 123 enemy `<id>_hitsize.hts` files: 2786 spheres (code 0), 2103 capsules on one joint (code 1), 3100 capsules between two
    joints (code 2), and 32 of a third type (codes 4 / 6: em004/005, em012, em021, em022, em065, em066_04, em085, em088) -- a FLAT-ENDED
    CYLINDER (section 4).
  - Over the records the census finds armed: 2632 spheres, 2188 one-joint capsules, 5506 two-joint capsules, 31 type-3.
* **What a record can hit is its target mask** (0x7db70, `0x7dd44..0x7ddb0`):
  - 0x17 by default; flag 0x40 -> 0x10, 0x100 -> 2, 0x200 -> 5, 0x4000 -> 8.
  - Then | 0x20 for flag 0x80 or record bit 0x100000, and | 8 for flag 0x1000 or record bit 0x80000.
  - Bit 0 is tested against the hunters, bit 1 against the other monsters, bit 2 against a third set (the pair pass `0x16acf0`).
* **Of 3225 arms measured:** 3196 can hit a hunter, 6 only other monsters, 23 neither.

## 2. The pieces

* **The record**
  - `0x7db70(e, slot, id, flags)` arms slot 0 / 1 of the enemy's hit objects (P+0x998 + slot x 0xb8; `0x16877c`). The wrappers are
    `0x7ded8` (flags 0), `0x7dee0` (a named target) and `0x7df34`.
  - The record comes from `0x70f40(e, id)`: id < 1000 -> [e+0x75d4]; id >= 1000 -> [e+0x75d8], id - 1000. Its shapes come from
    `0x70fa0`: [e+0x75dc] / [e+0x75e0] by the same split.
  - File `enemy\hit_data\<id>_attackdata.hde` ("HDE\0", the count at +8), 0x20-byte records from +0x10:
    - s16 +0: the start frame
    - s16 +2: the duration
    - byte +6: the kind
    - u32 +0xc: the flags word
    - byte +0x19: the hit-size set
  - A deviant's arc carries its base's files and its own. The setters are READ: `0x708e4` -> +0x75d4, `0x708f4` -> +0x75d8,
    `0x70904` -> +0x75dc, `0x70914` -> +0x75e0, registered by `0x70460` (reached through the GOT `0x1832a70..7c`). Which FILE each
    setter is handed goes by a hashed resource id (no strings), so the assignment is a FIT: the base's file as the first table and the
    deviant's own as the second fits 13 of 18 deviants' census arms (every id in range of its table), the reverse 2. The 5 misfits are
    arms of a class shared with the base (em002_04, em019_04, em060_04, em066_04's id -1000), not a wrong assignment.
  - A base monster's arms with ids >= 1000 (256 of them): with no second file [e+0x75d8] is null, so `0x70f40` returns 0 and
    `0x7db70` arms nothing (`0x7dbb8`: beq 0x7dc58, r0 0). They are deviant-only attacks in the base's shared code (the null is READ;
    its being null on every base load rests on the loader fit above).
* **The window** (`0x7dc70..0x7dd18`):
  - Start < 1: live from the arm, for the duration.
  - Otherwise: from max(start, the arm) to start + duration, in the motion's frames.
  - A window that ends before it starts is not armed.
* **The shapes** (`<id>_hitsize.hts`: "HTS\0", the set count at +8, a table at +0x10 of (count, offset), records of 0x30):
  - Fields: u16 j0, u16 j1, u16 code, u16 flags, f32 +0xc radius, vec +0x10 off0, vec +0x20 off1.
  - An enemy's builder `0x16ddd0` takes joint j0's matrix (unit vt+0xd0) and dispatches on the code:
    - **0**: a sphere at off0 . M (`0x16e80c`);
    - **1**: a capsule off0 . M -> off1 . M;
    - **2**: a capsule off0 . M(j0) -> off1 . M(j1) (`0x16ded0..0x16dffc`).
  - The radius is R x the scale.
  - j0 255 is the unit itself, not a joint (drawn on the model root).
  - Codes 4 / 6: the third type, a flat-ended cylinder (section 4).
* **Which records a clip arms** is class code: the action functions call 0x7db70.
  - The census `<archive>/zg/attrace.py` runs every action of every large monster through the action tracer: statuses 0..0x11 x
    numbers 0..0xff x phases 0..5 x ended / frame. For each call it records the slot, id, flags, the motion of that action and the
    frame gate asked before.
  - **The per-frame arms** (`<archive>/fb/pfarm.py`): every per-frame vtable slot a class overrides (+0x190..+0x240, +0x13c,
    +0x298..+0x2a8, +0x488) run per motion id with every frame test answered. 391 arms on 45 monsters, merged as action `pf+<slot>`
    (shown in every action of their motion). Dropped: vt+0x1f4, the action dispatcher (a switch on e+0x73e0 / +0x73e1 at its head,
    e.g. uEm001 `0xcee3d8`), whose arms the action census already places, and any arm in more than 30% of a monster's motions.
    - **Lao-Shan** (em012_00): his attacks are all here, 31 arms by vt+0x2a8 `0xd75914` -> `0xd76104` (a switch on the motion
      0x301.. with frame windows).
    - **Neset** (em087_00): 2 arms by vt+0x13c `0x10ad838` (record 0x5f on L3 M3, 0x60 on L3 M16). The other arm sites in his
      emclasses band (`0x10bd6c0` / `0x10bfc84`) are Ahtal-Ka's: the band 0x10a2d44..0x10c5658 is shared by uEm087_00 and uEm088_00,
      and both sites hang off `0x10b3f74`, uEm088's action main (em088_00's census has them: (1, 0x12) / (1, 0x20) arm 0x25).
* **The pair test against a hunter** (rom-map `0x16b6cc`, `0x167d2c` sphere-capsule, `0x1676f0` capsule-capsule):
  - The hunter's hurt capsule is `0x2821e4`: joints 16 / 19 (mid) -> 4, each end pulled in 40, radius 40.
  - They meet when the distance minus both radii is <= 0.

## 3. In the viewer

* Data: `docs/attack-hitshapes.json` (exporter `<archive>/zg/attexport.py`): records / sets (and records2 / sets2), and per clip the
  arms.
  - **The class that runs a monster without its own (fixed 2026-10-27, atkfix lane; rom-map trap 176).** Until then the census
    runner `zg/attrace_all.py` took "the first uEmNNN_00 at or below the em number", so **Giadrome (em034_00) carried Akantor's
    arms and Volvidon (em062_00) Lagombi's**, byte for byte (their records / sets were their own: the arms indexed them with another
    class's ids -- 24 of Giadrome's 52 arms named an id past his 27 records, 5 of Volvidon's 34). The runner now takes the spawn-table map (dev/notice-marks.md
    step 3: em002 -> uEm001, em005 -> uEm004, em015 / 016 / 034 -> uEm014, em062 -> uEm060, em072 -> uEm071). **Audit of all 94
    entries** (each census header's class, EM and variant against the map; `fb/pfarm.py` already used it): those two the only wrong
    ones. Re-run as uEm014_00 EM=34 / uEm060_00 EM=62, and only their `arms` replaced in place (`<archive>/atkfix/patch_arms.py`:
    the other 92 entries byte-identical; the file equals a full re-export from the corrected census). Giadrome now arms the drome
    class's actions with his own ids (Velocidrome / Gendrome / Iodrome / Giadrome: 3 / 8 / 9 / 24 on (7, 2)), 14 / 14 inside his
    table; Volvidon 42 / 42 below 1000 inside his.
  - Checked headless (`<archive>/atkfix/atkfix_check.mjs`, before / after shots in `<archive>/atkfix/shots/`): Giadrome L2 M18
    (nothing before; records 26 / 21 / 22 on joints 2 / 1 / 100, frames 70..90, after), Giadrome L2 M1 (Akantor's ids 2 / 25 / 48
    before, 48 missing and 2 at 60..250 on a 23-frame clip), Volvidon L2 M17 (Lagombi's record 16 before; his own 12 / 14 / 21 after)
    and L2 M16, Akantor L2 M1 and Lagombi L2 M17 unchanged; no shape skipped for a missing joint. atkcheck2 21 / 21; atkcheck3 8 / 8
    (its row-order item now accepts the "Effects drawn before" row, `monFxPassRow`, between Ground and Attack Hitboxes).
  - **The motion lock and the carry (READ 2026-10-27).** An arm whose flags have bit 0 CLEAR locks the hit to the motion it was armed
    in (`0x7ddb8` -> `0x169258`: H+0x74 = the motion, H+0x30 bit 0x100); the per-tick countdown (`0x168d44..0x168eb0`) kills a locked
    hit on any other motion. Bit 0 SET: no lock, the delay H+0x5c and then the duration H+0x60 count down by the tick through motion
    changes (x the motion rate e+0x50c when flags bit 2 is clear). The delay the arm writes is the record's start less the motion's
    frames already run (`0x7dc88..0x7dd18`: start - (e+0x500 - e+0x4f4)), so a window is in the arm motion's frames. **The dromes'
    (7, 2)** (Velocidrome 3, Gendrome 8, Iodrome 9, Giadrome 24: start 40, duration 26, flags 3) arms in phase 0 on L2 M1, 23 frames;
    unlocked, it runs on into L2 M2, set at phase 1 on M1's end (docs/action-motions.json), so it is live on **M2 frames 21..47**
    (M2_start 21..30, M2_loop 30..47; first given as 17..43 without the lead -- Withdrawn, next bullets). Exported as a carried row:
    `arms['2|Motion[2]']` gets the arm with `shift` = 23 (M1's length) and `windowOf` subtracts it; the M1 row stays (live on no M1
    frame). Checked (`<archive>/atkfix/atkfix_carry.mjs`): all four dromes, never live on M1, live on M2 21..46.
  - **The lead (READ 2026-10-27).** The layer's setMotion `0x951678` writes the blend into the gate +0x4f4 and zeroes the frame +0x4fc;
    the layer update counts the gate down by the tick (`0x94ed14..0x94ed90`) but advances the frame regardless (`0x94eee8..0x94ef08`).
    The arm's delay is start + the gate - the frame (`0x7dc88..0x7dd18`; the gate counts 0 when the setMotion flags have bit 0, e+0x13c0
    via `0x7256c` -- setMotion0 / setMotionL pass flags 0). So a record armed t frames into a motion set with blend b goes live at the
    motion's frame **start + max(0, b - t)**: exported as row field 7 `lead` (`<archive>/atkfix/leadcases.py`, from the action census's
    raw runs), 1546 arms (321 logged `lead-unknown`, left 0: `leadlog.txt`). windowOf also takes arm flag 0x800 now (the record's start
    ignored, `0x7dc74`; 8 arms). The Measured frames above predate the lead (Rathian L4 M6's records start later by M6's blend).
  - **The carry, simulated (same day; `<archive>/atkfix/carrysim.py`, replaces the first pass below).** Each unlocked arm whose window
    (with its lead) outlasts its finite clip -- 159 -- is stepped through its action main under actmot/amtrace.py from the state the arm
    left: while the motion plays, the runs must agree across the frame and RET answers (else `frame-gated` / `stub-answer`, the stubs
    named), unconditional phase changes are stepped; at the motion's end the setMotion is the next motion, a follow hands to the followed
    action's first motion. The shift is the frames since the arm motion's frame 0 -- **no blend term** (the frame runs through the
    blend). A motion the action plays again is carried with `lap` (row field 8) and shown on that pass of the clip. **110 carried** (9
    stop short by name) into 139 rows; **49 refused by name**: several 16, action-ends 6, per-frame 8 (kept: they depend on the AI or
    have no action; the simulator's answer for 12 of them is in the report, not applied), not-in-lists 11 (motions absent from the
    game's own files: Rathian / Gold / Dreadqueen 4|M26 an empty LMT slot, em013_00 / _01 and em071_00 no list 4 file, em071_05 slot
    12 empty, em047_00 15|M255 = the 0xfff sentinel -- none a clip the viewer lacks), frame-gated 5 (the frame is data: 0x6f618's
    return), stub-answer 3. `<archive>/atkfix/carry_report_sim.txt`, one line each. Patched in place: 90 entries' `arms`.
  - **The carry, frame by frame (same day; `<archive>/atkfix/carrysim2.py`, supersedes the simulated pass).** One frame per tick, with
    what the action actually reads answered: the frame tests by their mode against the concrete frame (the dispatch `0x728b8`: 0 a
    crossing, 1 / 6 from f0, 2 before f0, 3 / 7 / 10 f0..f1, 4 / 5 / 8 / 9, the blend gate's rule), the ended test at the clip's
    length, the action-tune getters from the monster's own `<id>_actiontune.fup` (the frames the 0 / 1 pass called frame-gated are
    tune values), the motion getter, and the hit-live test `0x168ebc` from the carried arm itself (another slot unarmed: a monster
    standing alone). Every other stubbed call must not matter. Applied to every case. **159: 125 carried** (174 rows, 46 on a replay
    lap), **5 held** (the window runs out while the action holds the ended motion), **29 refused by name**: not-in-lists 11, per-frame
    8, ground-contact 4 (`0xbf52c`: how high the leap is), arrival 3 (`0x78b78`: where the target is), waits 3. The leads too: the
    follow-credited arms take the followed action's blend, the arms set in an earlier phase have their frame stepped -- 1692 leads, 37
    named (several-in-phase 16, follow-unresolved 13, sentinel-motion 7, several 1; `leadlog.txt`). `carry_report_sim2.txt`.
  - (First pass, SUPERSEDED: its "next motion's blend in the shift" is Withdrawn in rom-map.) **The carry, every monster (same day; `<archive>/zg/atkcarry.py`, called by attexport.py).** For each arm with flags bit 0 set
    whose window outlasts its finite clip (158), the next motion is read from docs/action-motions.json: the same action, a different
    motion in the arm motion's phases or the next phase, set only with the ended answer 1 (entered on the arm motion's end). The shift
    adds the motion's length and the next motion's census blend (frame 0 comes `blend` ticks after the set -- INFERRED from the delay
    formula's gate term). A window that outlasts that motion too is carried on (chains), and an _start / _loop motion takes the rest.
    **98 carried** (84 one hop, 12 two, 2 five; 5 stop short by name) into 117 rows; **60 refused by name**: several 16, not-in-lists 11,
    follow 8, per-frame 8, action-ends 6, phase-gap 5, replayed 3, stub-answer 2, phase-entry 1 (`<archive>/atkfix/carry_report.txt`,
    one line each; the reasons are defined in atkcarry.py's header). Patched in place: 48 entries' `arms`.
  - **Once per play.** The game counts a carried window down once, so the page shows a carried row on its own lap of a looping clip
    only -- the first, or the pass the action replays the motion on (index.html `atkLap`: a wrap while playing; another clip or a
    replay starts at lap 0; scrubbing counts none). Checked (`<archive>/atkfix/atkfix_carry2.mjs`, shots
    `<archive>/atkfix/shots/atkfix-carry3/`): 8 carried rows on 8 monsters live exactly on their window less the shift; Giadrome's
    L2 M2_loop through 5 wraps shows record 24 on the first lap only (30..46); em027_00 L4 M1 looped shows its replay row (record 29,
    lap 1) on the second pass only. Like every
    arm, a carried row is filtered out where the viewer names a different action for the clip (e.g. em083_00 L2 M5, whose own arms are 7:0x4's).
  - **Ids past the table** (`0x70f40`, `0x70f8c`: count <= id returns 0, so `0x7db70` arms nothing). Arzuros / Redhelm's 13 arms with
    ids 24..34 (their table has 24 records; Volvidon's 35): the shared uEm060_00 class arms these ids for EM 60 and 62 alike, and the
    census runs every action the class handles -- whether Arzuros's AI picks those actions is not read, but if it does, the game arms
    nothing. Not a second table and not a Redhelm split. 55 such arms in the file (em002_04 15, em018_00 1, em019_00 / _04 5 each,
    em060_00 / _04 13 each, em066_04 3); the page draws none and names them "id past the table".
* Overlay: `render/attack-hitboxes.js`.
  - It is drawn with the hit-zone capsules' own `zoneCapsules`: the same shapes, the same two-pass material.
  - The **Attack Hitboxes** row (Off / Armed only / All (unarmed greyed)) is in the **Animation panel, after the Ground row**, shown
    where the monster has data. MOVED there 2026-10-23 from the Hit Zones panel (Raven: "Keep in mind, when in the Hit Zones panel, we
    can't change animations", "So, that will need to be moved to Animations"): a shape shows only on its attack's frames, so the
    control sits where clips play and scrub. Nothing of the Hit Zones panel was a precondition: the overlay steps every render frame
    (stepAttackBoxes after driveMotionStates) and the row now follows the monster by itself (it was painted from the zone chart's
    buildZoneCapSel). Opening Hit Zones keeps the overlay's setting, but that panel plays its own idle clip (List 0 Motion[1]),
    which arms nothing, so no shape shows there; back in Animation the selected clip returns and its shapes with it.
    Check `<archive>/atkcheck3.mjs` 8 / 8: the row's place, the overlay stepping with a playing clip (Rathian L4 M6, 5 armed at
    f40), a pixel check (the frame with the overlay group shown vs hidden: 160059 pixels change, 159591 red-leaning), the hover pick
    ("Attack record 28, slot 0, shape set 15, frames 6-80"), the panel switch; atkcheck2 21 / 21.
  - Colours: red, can hit a hunter; orange, only other monsters; blue, neither; grey, not armed now; yellow, touching the Solid
    stand-in hunter (Hunter Body: Solid; the shells' 0x2821e4 stand-in capsule).
  - A clip several actions play shows only the play's own action's arms where the viewer names that action (CLIP_ACTIONS / copies).
    Elsewhere it shows the union.
* Measured (`<archive>/atkcheck.mjs`):
  - **Rathian L4 M6** (the tail spin: (7, 5) / (7, 9) / (4, 0x1a) / (9, 2)): capsules on the tail joints 142 / 144, r 140 (set 13; set
    15 r 300 on (9, 2)). Armed from frame 4..8 to 70..80. With the hunter 500 ahead the r 300 pair touches at frames 16 and 60.
  - **Tigrex L0 M34** (the charge, (7, 0x10)): set 14, nine shapes on legs and body (spheres r 90..185, capsules r 130..220), armed
    0..99. At him it touches at once.
  - **Seltas Queen L4 M69** ((7, 0x17)): set 1, her tail / pincer (joints 143-144, 160-161), record 39 frames 90..126, then record 40
    126..190.
  - **Census control**: her L4 M79 arm 0x23 with flags 0x400 is the duo agent's read (`0xf8fc8c`), and its set 18 is the one sphere
    r 200 on joint 200. Basarios's fireball records 0x0d..0x10 / 0x36 / 0x37 land on L2 M3 (dev/em004-fireball-actions.md).
  - j0 255 shapes are drawn on the model root (the unit: `0x16da04`'s unit arm, its +0x40 and angle words).
  - The third type is drawn as a cylinder (zoneCapsules shape 3, a unit CylinderGeometry through the same shader) and touch-tested
    with `render/hit-type3.js`.
  - **Hover a shape** (the overlay on): a tooltip names the record, its slot / set / window, power, element, status bits, kind and
    what it can hit (`describeText`).
* Not read:
  - (`0x7dc9a0`, the type-3 test: TRANSCRIBED 2026-10-22, section 4)
  - the hunter's in-quest pose (the stand-in);
  - the status names behind each counter, and the kind byte's names.

## 4. The third type (hit-size codes 4 / 6)

* **Build** (both builders leave the shape type 3, `0x170160`; R = s x the radius):
  - an enemy's joints (`0x16ddd0`, table `0x16deac`): code 4 `0x16e89c`, code 6 `0x16ec78`;
  - the unit / a shell, j0 255 (`0x16dbd4`, table `0x16dbf4`): code 4 `0x16e368` (tail `0x16fcbc`), code 6 `0x16e470` (tail
    `0x170058`).
  - P = the frame's point for s x off0 (as codes 0..2 place it).
  - Code 4: p0 = P + (0, s x off1.x, 0), p1 = P + (0, s x off1.y, 0): along the WORLD's Y.
  - Code 6: p0 / p1 = P + Y x s x off1.x / off1.y, Y the frame's row 1 (a joint: enemy vt+0x54 `0xc156c`, the joint's world matrix;
    the unit: the angle words' row 1). The X / Z rows' factor is the literal 0.0 (`0x16e964` / `0x170238`): off1.z is unused.
  - Codes 3 / 5: no shape.
* **Test**: the hunter pass `0x16b6cc` takes the attack shape's type byte (mgr +0x2030): 3 -> `0x16b88c` -> `0x167f70(attack, hunter
  capsule, out)` -> `0x7dda24` -> `0x7dc9a0`, its own routine, not the capsules' `0x1676f0` / `0x167024`. `0x7dc9a0` (with
  `0x806ce4`, `0x7ebfd8` -> `0x80017c`, `0x7db964` -> `0x8069d8`, `0x80448c` -> `0x8060ac`) fills info: point +0x10, normal +0x20,
  distance +0x30. `0x7dda24` meets when the distance <= the hunter's radius (`movwls`); out = point + (distance - r) x normal
  (`0x7ddadc..`), w 0 (`0x167fd0`). Its structure: dev/effect-runtime-engine.md, "The third hit-shape type".
* **ROM-RUN** (`<archive>/t3/t3emu.py`, 0x167f70 native; R 50 on (0,0,0)-(0,100,0), hunter r 10): the side meets to x 60, above
  to y 110, below to y -10, so the ends are **flat** (a capsule reaches 160); the rim (58, 105) meets, out (49.52, 99.7). Control:
  `0x1676f0` meets at (45, 130) where `0x167f70` does not.
* **The viewer's test is the ROM's** (`render/hit-type3.js`, shared with the shells' hunter pass): `0x167f70`, `0x7dda24`,
  `0x7dc9a0` and its seven callees TRANSCRIBED LINE BY LINE, generated from main.text by `<archive>/t3/arm2js.py` (2392
  instructions, one statement each under its address). Diffed against the ROM run natively after the static initialisers
  (`t3diff.py`, `t3hunt.py`, `t3hunt2.py` -> `t3diff.mjs`), **1537 cases**: the first check's 480 (20 aligned, 60 + 400 random),
  300 with the hunter's axis through the cylinder, 300 skimming a rim, 150 parallel, 100 degenerate, 200 game-sized, 7 targeted at
  unexercised blocks. **Meet / no-meet: 1537 / 1537 agree. Contact point: bit-exact in every meeting case (max error 0, max 0 ulp).**
  Coverage 2240 / 2392 instructions; the rest: 118 sqrtf-on-NaN fallbacks, 21 this caller cannot reach (`0x7dda84..0x7ddad0`,
  `0x7dcf20`), 13 not reached (`0x7dd57c..0x7dd5ac`, the axis path with R^2 under 1.19e-7).
  (It replaces the numeric cylinder test of the first pass, which agreed on meets 459 / 460 but not on the out point -- Withdrawn.)
* The data: Basarios r 580, off0 (0, -100, 0), off1 (0, 350, 0): a cylinder from 100 below his origin to 250 above.

## 5. What a record is (its other fields)

The hit object `0x16877c` copies the record (`0x1687d8..0x16886c`); the hunter's landing `0x175b88` (from the hunter handler
`0x16ba68`) consumes it.

| record | hit object | consumer | what |
|---|---|---|---|
| s16 +0 / +2 | H+0x5c / +0x60 (f32) | the slot countdown | the window (section 2) |
| s16 +4 | H+0x38 | `0x175ccc` -> s20, `0x1760b4` | **the power**: x `0x1690dc(H)`, then the hunter's defence, d - d x def / (def + k) (player +0x13c4 -> +0x34a, `0x1760f8..0x176130`), then x (100 - the element's resistance) / 100, the resistance capped at 50 (`0x1761cc..0x176200`) |
| byte +6 | H+0x3a (0 -> 1) | player +0x3216; 0x41 -> `0x2a6640`; the switch 0x19..0x46 at `0x175dac` | the kind (names not read) |
| u16 +8 | H+0x36 | player +0x3214; the hunter handler tests bit 0x10 (`0x16bad0`) | not named |
| byte +0xa | H+0x3b | `0x7dc64`: a linked attacker adds the partner's facing | an angle byte |
| byte +0xb | H+0x3c | player +0x3217 | not named |
| u32 +0xc | H+0x40 | player +0x3258; the mask (section 1); **the element**: bits 4 / 0x10 / 0x40 / 0x20 / 0x80 tested in that order -> element 0 / 1 / 2 / 4 / 3, the hunter's resistance 0x16 + index (`0x176134..0x1761c8`); none -> 5 | the names are INFERRED from the carriers: 0 fire (Rathalos, Agnaktor, Lavasioth), 1 water (Royal Ludroth, Mizutsune), 2 thunder (Khezu, Kirin, Zinogre), 3 ice (Barioth, Zamtrios, Ukanlos), 4 dragon (Fatalis, Deviljho, Gore Magala) |
| u32 +0x10 / +0x14, byte +0x18 | H+0x48 / +0x4c, H+0x50 | `0x176368..0x176440` | **status**: each bit adds the value +0x18 to its own hunter counter (+0x10: 2 -> +0x321e, 0x10000 -> +0x3220, 4 -> +0x3224, 1 -> +0x3228, 0x4000 -> +0x322a, 0x400 -> +0x3230, 0x20000 -> +0x3232, 0x800 -> +0x3234, 0x400000 -> +0x3236, 0x8000 -> +0x3242; +0x14: 8 -> +0x3222, 4 -> +0x3248, 0x100 -> +0x324a, 2 -> +0x324c, 0x10 -> +0x324e, 0x20 -> +0x3250). Which status each counter is: NOT READ |
| byte +0x19 | (passed) | `0x70fa0` | the hit-size set |
| +0x1a / +0x1c / +0x1d / +0x1e / +0x1f | H+0x52 / +0x55 / +0x56 / +0x6c / +0x9e | -- | copied, not followed |

## 6. Read since, indexed in rom-map (doc audit 2026-10-24)

The hit system's own pieces are read in gapM / gapN. Rows are in rom-map "Shell infrastructure"; the engine summary is in
`dev/effect-runtime-engine.md` "The shells' hunter contact". This note did not carry them:

* **The beam segment table** (gapN): the enemy-shell ctor clears +0x158a / +0x158c / +0x1590 / +0x1594 (`0x4a0bf0..`). The hit line
  (base02 `0x3fc1c8..0x3fc374`, base58 `0x4340fc..0x4342a8`) fills n = +0x158c entries of the table +0x1594, from the second call on
  (+0x1590 >= 2). A j0 1010 hitsize record makes a type-2 capsule of entry j1 (`0x16dd2c..0x16ddcc`). The count is `0x4a14d8`: the j0 1010
  records in the hit's group, 3 for every class that uses it.
* **Kinds a standing hunter never takes**: 8 / 9 / 0x34 / 0x45 never hit hunters; 0xc / 0xd / 0x1e need `0x2f5bf0` (a hunter in action
  group 0x80); 0x41 marks the player (`0x2a6640`), skips the +0x31e0 once-a-frame test, and leaves the shell alone.
* **The shape chain**: `0x169290` -> `0x16d970` (descriptor from the HTS record) -> `0x16da04` -> `0x17023c`. The HTS layout and the
  294-folder census are in rom-map; `0x16b4b4` is a serial slot id, not a random draw (Withdrawn table).
* Details: `<archive>\gapM\RESULT.md`, `<archive>\gapN\RESULT.md`.
