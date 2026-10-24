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

