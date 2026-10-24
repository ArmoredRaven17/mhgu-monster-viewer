# doc_patch.py: dev/attack-hitshapes.md -- the five reads (type 3, j0 255, the deviant loader, Lao-Shan / Neset, the record's fields)
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\attack-hitshapes.md'
s = open(p, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
rep("""    joints (code 2), and 32 of a third type (codes 4 / 6, NOT READ: em004/005, em012, em021, em022, em065, em066_04, em085, em088).""",
"""    joints (code 2), and 32 of a third type (codes 4 / 6: em004/005, em012, em021, em022, em065, em066_04, em085, em088) -- a FLAT-ENDED
    CYLINDER (section 4).""")
rep("""  - A deviant's arc carries its base's files and its own. Taking the base's as the first table and its own as the second is
    INFERRED: the loader that fills +0x75d4 / +0x75d8 is not read.""",
"""  - A deviant's arc carries its base's files and its own. The setters are READ: `0x708e4` -> +0x75d4, `0x708f4` -> +0x75d8,
    `0x70904` -> +0x75dc, `0x70914` -> +0x75e0, registered by `0x70460` (reached through the GOT `0x1832a70..7c`). Which FILE each
    setter is handed goes by a hashed resource id (no strings), so the assignment is a FIT: the base's file as the first table and the
    deviant's own as the second fits 13 of 18 deviants' census arms (every id in range of its table), the reverse 2. The 5 misfits are
    arms of a class shared with the base (em002_04, em019_04, em060_04, em066_04's id -1000), not a wrong assignment.
  - A base monster's arms with ids >= 1000 (256 of them): with no second file [e+0x75d8] is null, so `0x70f40` returns 0 and
    `0x7db70` arms nothing (`0x7dbb8`: beq 0x7dc58, r0 0). They are deviant-only attacks in the base's shared code (the null is READ;
    its being null on every base load rests on the loader fit above).""")
rep("""  - Two monsters give no arms: em012_00 Lao-Shan and em087_00 Neset (their action mains are not the vt+0x1f4 shape the tracer runs).""",
"""  - **The per-frame arms** (`<scratchpad>/fb/pfarm.py`): every per-frame vtable slot a class overrides (+0x190..+0x240, +0x13c,
    +0x298..+0x2a8, +0x488) run per motion id with every frame test answered. 391 arms on 45 monsters, merged as action `pf+<slot>`
    (shown in every action of their motion). Dropped: vt+0x1f4, the action dispatcher (a switch on e+0x73e0 / +0x73e1 at its head,
    e.g. uEm001 `0xcee3d8`), whose arms the action census already places, and any arm in more than 30% of a monster's motions.
    - **Lao-Shan** (em012_00): his attacks are all here, 31 arms by vt+0x2a8 `0xd75914` -> `0xd76104` (a switch on the motion
      0x301.. with frame windows).
    - **Neset** (em087_00): 2 arms by vt+0x13c `0x10ad838` (record 0x5f on L3 M3, 0x60 on L3 M16). The other arm sites in his
      emclasses band (`0x10bd6c0` / `0x10bfc84`) are Ahtal-Ka's: the band 0x10a2d44..0x10c5658 is shared by uEm087_00 and uEm088_00,
      and both sites hang off `0x10b3f74`, uEm088's action main (em088_00's census has them: (1, 0x12) / (1, 0x20) arm 0x25).""")
rep("""* Not read:
  - the type-3 shapes (codes 4 / 6, `0x167f70`);
  - j0 255 shapes;
  - id >= 1000 arms on a monster with one file (256: deviant-only actions run on the base);
  - the hunter's in-quest pose (the stand-in);
  - the record's other fields (power, element, the kind's meaning).""",
"""  - j0 255 shapes are drawn on the model root (the unit: `0x16da04`'s unit arm, its +0x40 and angle words).
  - The third type is drawn as a cylinder (zoneCapsules shape 3, a unit CylinderGeometry through the same shader) and touch-tested
    with `render/hit-type3.js`.
  - **Hover a shape** (the overlay on): a tooltip names the record, its slot / set / window, power, element, status bits, kind and
    what it can hit (`describeText`).
* Not read:
  - `0x7dc9a0` line by line (the type-3 test's own routine; section 4);
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
  capsule, out)` -> `0x7dda24` -> `0x7dc9a0`, its own routine, not the capsules' `0x1676f0` / `0x167024`. `0x7dc9a0` reads the
  shape's R (`0x7dcc3c` / `0x7dcea0` / `0x7dcee4`); `0x7dda24` meets when the returned distance <= the hunter's radius (`movwls`).
  The out point (`0x167fb8..0x167fd0`) is the hunter's axis point less r along the shape's outward normal there.
* **ROM-RUN** (`<scratchpad>/t3/t3emu.py`, 0x167f70 native; R 50 on (0,0,0)-(0,100,0), hunter r 10): the side meets to x 60, above
  to y 110, below to y -10, so the ends are **flat** (a capsule reaches 160); the rim (58, 105) meets, out (49.52, 99.7). Control:
  `0x1676f0` meets at (45, 130) where `0x167f70` does not.
* **The viewer's test** (`render/hit-type3.js`, shared with the shells' hunter pass): the Euclidean distance to a flat cylinder,
  solved numerically. Against the ROM-RUN (`t3check.mjs`; `t3check2.mjs` over `t3rand.py`'s cases): MEETS agrees on 20 / 20 aligned
  and 459 / 460 random placements (the miss is within 0.65 of the boundary); the out point agrees on the aligned ones and most random
  ones, not where the hunter's axis passes through the cylinder or skims a rim. OPEN: `0x7dc9a0` transcribed, for a float-exact
  contact point.
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
""")
open(p, 'w', encoding='utf8').write(s)
print('ok')
