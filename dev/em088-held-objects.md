# em088_00 Ahtal-Ka -- how the carried object is held (Spike / Wheel / Frame), read for all three k

Research agent for the Viewer agent, 2026-10-16. Raven: "Double check how Frame is held". Static reads of `main.text`
plus unicorn runs (scratch `<scratchpad>\held\`: `d.py` disassembly, `ia.py` / `ctor.py` init_array + ctor runs,
`clos.py` store census, `blscan.py` call sites, `modj.py` mod / glb dump). Nothing in `docs/` was changed.

## 0. Answer

**The game holds all three objects the same way.** The one uEm088_Rubble unit (`E+0xcb18`) is parented to Ahtal-Ka
joint number **130** for every k, with a local position of **(0, 0, 0)** and a local rotation of **identity**, written
fresh every frame while he holds it. Its local scale is the monster size, captured once at creation. Only the model
changes with k (`[E+0xcb00 + 4k]`). The three .mod files each have one joint (id 0, root) whose rest matrix is
identity, and the viewer's glbs carry that joint and the dequantising inverse bind exactly (÷100). Nothing was dropped.

The game's world matrix for the piece is `S(s_unit) · I · W_j130`, where `W_j130` is joint 130's FULL world matrix,
scale included (inherit mode 3). For Ahtal-Ka at the viewer's size (sizeBase 1.0, no size options) that equals what
the viewer draws: joint 130's world matrix, scale taken out, world size put back. **The viewer does not need to
change how it places any of the three objects.** If the Frame looks wrong, the cause is something other than its
placement: the glb's content (two groups, both drawn, which the class never hides) or the clip windows.

| k | object | joint (READ) | local T | local R | local S | mod joint 0 rest | glb vs mod |
|---|---|---|---|---|---|---|---|
| 0 | rubble_01 (Spike) | 0x82 = 130 | (0,0,0) | identity | `0xbe518(E)` at creation | identity, id 0, parent 255 | same |
| 1 | rubble_02 (Wheel) | 0x82 = 130 | (0,0,0) | identity | the same | identity | same |
| 2 | rubble_03 (Frame) | 0x82 = 130 | (0,0,0) | identity | the same | identity | same |

## 1. The joint: `+0x34 = 0x82` for every k (READ)

RubbleBase move `0x10aef80`, every frame:

- `0x10aef98..0x10aefb4`: owner `+0xfd0` alive (`+0xc & 7` in 1..2), else the owner is cleared.
- vt+0x98 -> id = `E+0xcb0c` (`0x10af364` -> `0x10b3e70`); a change -> vt+0x90 `0x10af300` -> `0x10bb5d0(E, id)` ->
  vt+0x58 setModel. **The only per-k effect.**
- vt+0xa0 (`0x10af394` -> `0x10bc1c8` = byte `E+0xcb10`) == 1 (held):
  - vt+0x94: uEm088_Rubble's slot is **`0x10af348`: `mov r1,#0x82; str r1,[r0,#0x34]`**, a constant.
  - `0x10af010..0x10af034`: `+0x40/+0x44/+0x48` = the vector at GOT `0x1831a78` -> **`0x19176b0`**, `+0x4c` = 0.
  - `0x10af03c`: `0x8a4dfc(unit, r1 = the same 0x19176b0)`.
  - vt+0x48 `0x457c8(unit, owner, +0x34)` = `strd` -> `+0x30` parent, `+0x34` joint.
- not held: vt+0x48(unit, 0, -1).

The three rubble vtables' vt+0x94, side by side (positive control for the method):

| vtable | class | vt+0x94 | what it does |
|---|---|---|---|
| `0x17fa180` | uEm087_Rubble (Neset) | `0x10af334` | `+0xfd8` (id) <= 2 -> `+0x34 = 0x82 + id` (130 / 131 / 132) |
| `0x17fa234` | uEm088_Rubble (Ka) | `0x10af348` | `+0x34 = 0x82` |
| `0x17fa0cc` | RubbleBase | `0x10af3e0` | `bx lr` |

The same store census (`clos.py`, depth 1 over the class's methods) that finds Ka's constant also finds Neset's
`addls r1,r1,#0x82 / strls r1,[r0,#0x34]` at `0x10af33c / 0x10af340`. So the census can see a per-k joint. Ka's is
constant.

**What `+0x34` is (READ, upgrades the old "I").** The unit's world update reads it: uModel vt+0x50 `0x94b288` ->
`0x88de58` -> **`0x8a5480`**. `0x8a54bc`: `ldr r1,[r4,#0x34]`; >= 0 -> `[parent]->vt+0x54(parent, r1)`; < 0 -> parent `+0xb0`.
Parent vt+0x54 = `0x939278`: `idx = byte [model+0x498][uxtb(r1)]`; 0xff -> the model's `+0xb0`; else
`[model+0x494] + 0xa0·idx + 0x10`, the joint's world matrix. So `+0x34` is a joint **number** (the mod's joint id),
mapped through the model's 256-byte id->index table (the .mod's remap block). In em088_00.glb it is node `42:130`
(index 42, id 130), a root joint (parent 'reference').

## 2. The local transform while held (READ)

- **Position.** `0x19176b0` is in .bss. `ia.py` runs all 2,334 init_array entries with 0 faults: it is written by
  `0x7c46c0..0x7c46cc` (ia #1383) = **(0, 0, 0, 0)**. Positive control from the same run: its neighbours hold non-zero
  constants (`0x19176a0` = 1.19e-7 ×4, `0x19176c0` = (1, 1, 1, 0)), so the harness reads written statics.
- **Rotation.** `0x8a4dfc(unit, &angles)`: builds R from three Euler angles in order `+0x38 & 0xffff` (jump table, 6
  orders; > 5 -> a constant), `0x72dec` -> quaternion `+0x50..+0x5c`, negated when w < 0 (`0x8a5320..0x8a5358`). With
  zero angles the result is **(0, 0, 0, 1)** in every order.
- **Scale.** `+0x60/+0x64/+0x68` = `0xbe518(owner)` (`[E+0x1428]+0x1ac × +0x1b0`, the monster size), `+0x6c` = 0. This is
  written ONLY by `0x10af1b4` (`0x10af1d4..0x10af1e8`), which is called once, at creation (`0x10b311c`, Ka; `0x10a30f4`,
  Neset). It is not refreshed.
- Local matrix `+0x70` = `0x8a53bc`: R(quat `+0x50`) with translation `+0x40`. No scale.
- **Nothing per k, and nothing from his code.** The rubble's own methods (vt+0x18 `0x10aef60`, vt+0x24, vt+0x28
  `0x10af0d0`, vt+0x88..+0xa8, `0x10af1b4`) and the creator `0x10b30a4` were each censused (depth 1) for stores at
  `+0x34 / +0x38 / +0x3a / +0x40..+0x6c`, and so were the generic `0x937f98 / 0x88c664 / 0x8849e4 / 0x936ddc /
  0x9544b8 / 0x9366e0 / 0x88c55c / 0x937fdc / 0x8a4dfc / 0x457c8`. Only the stores above turn up (setModel's two hit
  other objects). uEm088_00 loads `E+0xcb18` at exactly three sites in its reached code (`reach_em088.txt`):
  `0x10b30ec` (create), `0x10b317c` (kill via vt+0x40), `0x10b3470` (null a dead handle). None of them writes a transform.
  The held branch rewrites `+0x40` and `+0x50` every frame in any case.

## 3. How the world matrix is made: inherit mode 3 (READ)

`0x8a5480`, parent branch: `0x29d00(out, local +0x70, P)` -> world. Then the mode `+0x38 >> 16`:

| mode | branch | result |
|---|---|---|
| 0 | `0x8a57e4` | rotation rows from constants (identity), translation kept |
| 1 | `0x8a5894` | each row normalised (scale out, rotation kept) |
| 2 | `0x8a56e8` | diag(row lengths): scale kept, rotation dropped |
| 3+ | `0x8a58e0` | the product as it is |

After all four: rows 0..2 × `+0x60 / +0x64 / +0x68` (`0x8a559c..0x8a5608`), translation row untouched. **The rubble's
`+0x38` is `0x00030004` after its ctor** (`ctor.py`: RubbleBase ctor `0x10aeef8` run on a zeroed 0xfe0 block = the bare
uModel ctor `0x9366e0`'s value, the control), so it uses mode 3. Nothing in §2's census writes `+0x38 / +0x3a`.

The joint matrices include the model's world. `0x94b734..0x94b760`: a joint's parent byte (`[joint+0x90]` bits 8..15)
of 0xff -> the model's `+0xb0`, else the parent joint's `+0x10`; `0x1ebe8(out, local, parent)` -> joint `+0x10`. The
enemy's `+0xb0` carries its own scale (`0x8a5594..`: rows × `+0x60`), and `E+0x60` = `0xbe518(E)`: `0xad678..0xad688`
(base init `0xad4e0`, the tail of Ka's vt+0x18) and `0xae0c4` (in `0xada80`, the move's spawn step).

So **`W_piece = s_unit · W_j130`**, where `W_j130 = L_130(anim) · S(size_E) R_E T_E`. Joint 130 has no parent joint, and
none of the viewer's clips animates its scale (poses/monsters/em088_00_{0,2,3}.glb: 95 animations, the only scale
channel in them is on `29:146`). The piece's 3×3 is therefore `R · s_unit · size_E`.

**What `s_unit` holds (INFERRED).** At `0x10b311c`, `0xbe518` reads `P+0x1ac × P+0x1b0`, with P = `[E+0x1428]`:

- `P+0x1ac` = 1.0 in the enemy ctor chain (`0xacbd0` -> `0xacce0`, `0xacda8 / 0xacdc8`, r6 = `&E+0x1428` writeback).
  The dtbase multiplier is written later, at `0xb94d0` (`0xb8b98`), which the base init `0xad5b0` calls AFTER the
  capture. Callers `0x5ecd0 / 0x6643c / 0x66704 / 0xcc104` are not read for timing.
- `P+0x1b0` = the spawn size, `0x6fa58` (`0x6fbdc`). The spawner calls it at `0x4ebe4`, before it registers the unit
  on move line 4 / 5 (`0xc03670`). Also written at `0xa6750 / 0xa67cc` (`0xa6618`, from `0xada80`, from the enemy move
  `0xad6f8`).

So `s_unit` = (1.0 or the multiplier) × the spawn size. For Ahtal-Ka the viewer's size is sizeBase 1.0 (monsters.json),
and part-review.json gives him no size options. That makes `s_unit` = 1 = `size_E`: the game's piece is `R` at scale
1, exactly what the viewer draws (joint world with its scale taken out, world size 1 put back). If the viewer ever
offered his spawn sizes z, the game's piece would scale as z² (z for his size, z again for `s_unit`) times the
multiplier (once or twice, depending on the capture order above). INFERRED until vt+0x18's call time is read.

## 4. `E+0xcb14` and `0x2b3c8`: a ground marker, never the piece (READ)

- Writers: the ctor `0x10b2e50` (0xff; `r0 = 0xff` at `0x10b2e1c`), the frame update `0x10b4030` (0xff every frame,
  BEFORE the event walker `0x6c590` at `0x10b4040`), and event type 7 `0x10bb280..0x10bb290`
  (`E+0xcb14 = u32(arg float +0x1c)`: 7 on L2 M4 f134-190, M6 / M8 at 50, M17 f140-160 per the props spec §3a). So it is
  0xff except on the frames a type-7 window fires.
- Reader vt+0xa4 `0x10af3c4` -> `0x10bc1e0` (word). Two uses:
  - vt+0x8c **`0x10af294`** (NOT `0x10af0d0`): unit `+0x10` bits 2..3 = 3 when 0xff, 1 otherwise (`0x10af2b8..0x10af2c4`).
    Meaning NR. RubbleBase vt+0x18 `0x10aef60` sets the same bits to 3 (`bic #0x2c; orr #0xc`).
  - vt+0x28 **`0x10af0d0`**: when the owner is alive, unit `+0xc & 0x4807 == 0x4802`, and owner byte `+0x1054` ==
    `[G]+0x49`, and v != 0xff -> `0x2b3c8([GOT 0x1831c9c], 3, v, &{unit +0xe0, 0xc21f8(E) = [E+0x1428]+0x5b8, unit +0xe8,
    +0xec})`. That position is the piece's world x / z with y taken from a height field of E's P (INFERRED the ground).
    The tail is `0x88c664`.
- `0x2b3c8(pool, -, v, pos)`: r1 is never read. It takes the next pooled unit (`count +8 < max +0x4c`, slot
  `pool+0xc+4·count`), sets its scale = `table 0x1593300[v]` for v <= 9 (0.3, 0.2, 0.35, 2.0, 1.0, 0.6, 0.9, **1.3**,
  1.5, 2.0; else 1.0), `+0x40` = pos, `+0xc |= 0xc00`, then its vt+0x4c / vt+0x50. It is a separate marker under the
  piece (INFERRED a blob shadow; the same pool serves shell07's landing marker, map row `0x402a1c`). **It does not move
  or offset the held piece.**

## 5. The .mod files against the glbs (READ)

Pulled from `em088_00.arc` (type `58a15856`). They are byte-identical (md5) to `em087_00.arc`'s, to
`scratch-em/em08{7,8}_00/.../mod/`, and to `build/frag/lao-probe/`. MOD version 0xd4. The joint block is at header
`+0x24` = 0x84: 24-byte record, 64-byte local matrix, 64-byte inverse matrix, 256-byte id->index remap. That lands
exactly on header `+0x28` = 0x21c.

| file | joints | joint 0 | local[0] | inverse[0] (row-vector) | glb IBM (column-major, ÷100) |
|---|---|---|---|---|---|
| rubble_01 | 1 | id 0, parent 255, offset 0, furthest 1753.57 | identity | diag 2628.5493, t (-211.0309, -190.0513, -875.1711) | 26.2855, (-2.1103, -1.9005, -8.7517) |
| rubble_02 | 1 | id 0, parent 255, offset 0, furthest 998.72 | identity | diag 1762.7195, t (-768.6705, -108.0516, -994.0489) | 17.6272, (-7.6867, -1.0805, -9.9405) |
| rubble_03 | 1 | id 0, parent 255, offset 0, furthest 1117.24 | identity | diag 1522.2380, t (-429.8340, -178.9108, -1113.6797) | 15.2224, (-4.2983, -1.7891, -11.1368) |

Remap: only id 0 -> 0. The "inverse bind" is the position dequantiser (normalised shorts × S + t). The glb's single
joint `0:0` (no TRS = identity) under `reference` (no TRS) is the mod's joint 0, and its IBM is the mod's inverse ÷ 100
(the scene's units), transposed. **Nothing was dropped.** The piece's origin is its file's origin, and that origin sits
on joint 130.

Groups: header `+0x20` = 1 group (rubble_01), 2 (rubble_02 / _03). The glbs show the same: `Group[0]` / `Group[1]`.
uEm088_Rubble's methods never call setVisibleGroup (`0x72c78`), so both groups draw.

## 6. For the viewer

- Joint: 130 for all three (it does this now). READ.
- Local transform: none, for all three (it does this now). READ.
- Scale: at Ahtal-Ka's size 1.0 the viewer's "joint world, scale out, size in" equals the game's
  `s_unit · W_j130`. No change. READ (the formula) / INFERRED (`s_unit` = 1 at his spawn: §3).
- glbs: correct as staged. No rest transform is missing. READ.
- **Nothing in the placement code needs to change.** If the Frame still looks wrong on screen, compare the drawn
  geometry against the game's own capture. The ROM side of the hold is settled. NOT checked here: the props spec's
  per-clip windows (§7a, which the viewer does not apply: rom-map row "the held piece, as the viewer draws it"), and
  whether E's joint 130 matrix is a frame stale when the rubble reads it (the move-line order, 4 for the rubble).
