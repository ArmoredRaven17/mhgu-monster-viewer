# The effect ground ray: `0x42744`'s `0x427e8` arm and `0x18154c` (research agent for the Viewer agent, 2026-10-07)

Raven, 2026-10-07: "Find and add all of Boltreaver's effects." Boltreaver (em081_04) L9 Motion[22] stops in the
viewer at frame 26 with `0x427e8 falls into unrecorded code` (lifted-request.js `L_42744`), and the live page then
stops every effect of the monster (live.js `fail()`). This note says what the ROM does on that arm, which record
takes it, what the no-stage answer is, and what the viewer and the recorder must supply.

Static reads (`efx/armdis.py` run / sweep over main.text, my own scans in the scratchpad) plus a payload dump of
every `.pel` in `scratch-effects-em` (`efx/proof.py parse`). **No unicorn run, no recorder, no lift** (the efx
slot was not used). Every claim is **READ** (the consuming instruction was read; address given) or **INFERRED**
(reason given). Offsets: `payload` = a record's 160 bytes; `core` = the request core (uMHEffectCore, vtable
`0x172a578`), whose descriptor copy sits at `core + 0x50`, so **payload `+N` = core `+N + 0x90`** (see §2).

The 2026-09-25 note `E:/offline/decode/notes/effects-ground-ray.md` (the board, line "the stage-ground-ray
refusal") was NOT available: drive E: is not mounted on this machine. Everything below was re-read from the
binary; where it agrees with the board's summary of that note, it says so.

## 0. Short answer

1. **Only u 605 takes the ray.** Its payload has `+0x52` = 1 and `+0x5c` = **0x11** (bit 4: cast the ray; bit 0:
   take the higher of floor and water). It is the only one of em081_04u's 79 records with both (READ: payload
   dump). u 606 (`+0x52` 0), u 604 (0) and the mode-8 beam's u 101 (0) never call `0x42744` at all; they stop
   only because live.js stops the whole monster when u 605 refuses. The bit is **authored data**, copied to
   `core+0xec`; no runtime code in the core sets it. The rom-map row "`0x427e0` / `0x427e8`" says the BEAM (u 101)
   reaches the arm. That is wrong (§2).
2. **The ray replaces the effect's Y with the floor height under the effect's own (x, z).** The bit-clear arm
   uses the floor under the MONSTER instead (`unit+0x10f0`, which the enemy's per-frame probe writes). For one
   horizontal floor these are the same number.
3. **The no-stage answer is the bit-clear answer.** `0x18154c` returns 0 on no hit, and `0x428dc ble 0x428e8`
   sends that into the same block the bit-clear arm runs (READ, as the board said). The viewer's stand-in parent
   answers that arm with `+0x10f0` = 0.0.
4. **What to implement:** a native for `0x18154c` (viewer `registerNative`, recorder `hook_at`) that answers
   from the plane stand-in, and two fixed answers for the parent's vt `+0xa8` / `+0xac`. Then record u 605 so that
   `0x427e8..0x428e4` is lifted. Do NOT run the real `0x18154c` in the harness: `sCollision` is null there. The
   2026-09-25 recorder fault was exactly that (§3.4).

## 1. `0x42744`, the core's ground resolve (Q1)

`0x42744` is uMHEffectCore's vt `+0x58` (READ: `u32(0x172a578+0x58)` = `0x42744`). The base class's `+0x58`
(vtable `0x174b96c`) is `0x328bd4`: `vldr s0,[pc]` of literal 0.0 at `0x328bdc`, so a non-core effect's ground is
always 0.0 (READ).

### 1.1 Arguments, defaults, the gate (READ, 0x42744..0x427e4)

| addr | what |
|---|---|
| `0x42758..0x42764` | r4 = core, r6 = the vec3 to resolve; **s16 = its y, the default result** |
| `0x42760` / `0x42770..0x42784` | `[core+0x140]` null → return y; else unit = `[[core+0x140]]->vt+4()`; null → return y |
| `0x42788..0x427d8` | a stack hit block at `sp+0xa0` built like a unit's `+0x1060` block (`0x181a84`'s layout): `+0..+0x10` 0, **`+0x14` (sp+0xb4) = -100000.0** (`0xc7c35000`), `+0x18` 0, `+0x20..+0x28` = the shared vec3 at GOT `0x1832130` → `0x19176f0`, `+0x2c` 0; and `sp+0x9c` = 0 |
| `0x427dc..0x427e4` | `ldrb r7,[core+0xec]` / `tst r7,#0x10` / `beq 0x428e8`: **bit 4 clear → the unit arm; set → the ray arm `0x427e8`** |

### 1.2 The ray arm `0x427e8..0x428e4` (READ)

| addr | what |
|---|---|
| `0x427e8..0x42828` | B = `sp+0x80` = (x, y, z, 0), the point itself. A = `sp+0x70` = (x, **y − 2000**, z, 0): literal `0x42944` = `0xc4fa0000` = −2000.0 |
| `0x4282c..0x42864` | a second object at `sp+0x20`: vtable GOT `0x1832408` → `0x172a668` (+8). Its block at `+0x10` gets the same defaults (−100000 at `+0x24`). This is the "next surface above" out-block; 0x18154c resets its `+0x40` to +100000.0 (`0x181714`). **0x42744 never reads it after the call** |
| `0x42868..0x42874` | `ldr r0,[r1],r0` with r1 = unit, r0 = 0x1054 is **post-indexed**: r0 = the unit's vtable, r1 = unit+0x1054; **r8 = byte `[unit+0x1054]`** (the area) |
| `0x4287c..0x42890` | r6 = **unit vt `+0xac`(unit, 1)**. Enemy: `0x6bb48` → `b 0xaa1e0`, a collision-group word 4 / 8 / 0x808 / 0x1804 (\|0x8000) chosen by `P+0x1a8`, posture `P+0x1ba` and the area's `0x49710` (READ). On 93 vtables |
| `0x42898..0x428a4` | r0 = **unit vt `+0xa8`(unit)**. Enemy: `0x6bb44` → `b 0xaa2d0`, the **ray flags**. They are 0 for a standing unit (posture 0) except bit 2 from the area's `0x490fc`; `|8` in posture 5 and `0x10000` / `0x20000` in postures 1..6 (READ) |
| `0x42884..0x42888` | sb = `*GOT 0x183224c` = **`*0x21200e0`, the collision singleton** (INFERRED sCollision: ~60 loads of that slot sit in `0xc09504..0xc41fb8`, the collision code, and `0xc0a2b4` stores into it) |
| `0x428a8..0x428d4` | **`0x18154c(sCol, &A, &B, area, [sp] = &sp+0x9c (out height), [4] = sp+0xa0 (hit block), [8] = group, [0xc] = sp+0x20 (above), [0x10] = flags)`** |
| `0x428d8..0x428e4` | `cmp r0,#0` / **`ble 0x428e8` (miss: the unit arm)**; hit: `s0 = [sp+0xb4]` (hit block +0x14), r7 = sp+0xa0, → `0x42908` |

### 1.3 The join `0x42908..0x4293c` and the unit arm `0x428e8` (READ)

| addr | what |
|---|---|
| `0x428e8..0x42904` | the unit arm (bit clear, or a miss): `sp+0x9c` = **`[unit+0x10f0]`**, s0 = **`[unit+0x1074]`**, r7 = unit+0x1060 |
| `0x42908..0x42910` | `ldrb [r7,#6]` / `tst #4` / `bne` → **return the input y** (no ground). Unit arm: `unit+0x1066` bit 2. Ray arm: **the hit polygon's attribute word 2, low byte** (§3.2) |
| `0x42914..0x4292c` | s2 = `[sp+0x9c]` (the floor); s0 = max(s0, s2) (`vselgt`); **`core+0xec` bit 0 clear → s16 = floor; set → s16 = max(water, floor)** |
| `0x42930` | return s16 in s0 |

So, with the bit **set**, the answer is the picked floor under the point's own (x, z), or the water surface if
higher (bit 0). With the bit **clear** (or a miss), the answer is the floor the monster's own probe wrote,
`unit+0x10f0`, or `unit+0x1074` if higher (bit 0).

### 1.4 What `unit+0x10f0` is in the game (READ)

The enemy's per-frame ground probe `0xbde60` calls `0x49aec(e, &P+0x40, [sp] = &h, [4] = e+0x1060,
[8] = P+0x940, flags, ...)` (`0xbdee4`). On a hit (`P+0x5b0` == 1) it writes **`P+0x5b4` = `e+0x10f0` = h**, the
picked floor under the unit (`0xbdf2c..0xbdf38`). Posture 6 is gated by `e+0x1068 & 0x18`. `0xba174..0xba184`
seeds both with the unit's own y. `P` = `[e+0x1428]`. A movw scan of main.text for `#0x10f0` finds 138 sites.
The shared enemy band (`0xb9164`, `0xba174`, `0xbdf34`, `0xbf204`) writes it; the class code compares `+0x44`
against it.

### 1.5 Where the result goes (READ)

| caller | what it does with the float |
|---|---|
| placement `0x31d16c`: `0x31f400..0x31f424` (space 1 path) and `0x31f8dc..0x31f904` | descriptor `+0x92` (payload `+0x52`) != 0 → vt `+0x58`(core, &pos) → **pos.y = the result**; `0x31f914..0x31f928` stores pos to the output, so the effect's world Y is the ground height and x / z are kept |
| spawn check `0x328c10` (vt `+0x60`; the core's and base's) | `core+0xe2` (payload `+0x52`) != 0 → the joint `[core+0xc2]` position through vt `+0xac` (`0x329b7c`), or `core+0x130` with no parent → vt `+0x58` → returns **1 when the joint is more than `core+0xe8` (payload `+0x58`, 900.0) above the ground** |
| base step `0x329148` (vt `+0x90`, reached from the core's `0x425c0` at `0x425fc`) | `0x329390..0x3293bc`: `core+0xd0` (payload `+0x40`) != 0 → vt `+0x60`; a 1 → **vt `+0x9c`(core, 2)** (a state change; that 2 is the "too high, do not spawn" state is INFERRED) |

**u 605 calls `0x42744` twice:** once from the spawn check (its payload `+0x40` = 1), at the unit's joint −1
position, and once from the placement. Which of the two raised the f26 refusal is not known (INFERRED: either
way it is the same arm).

## 2. Who sets `[core+0xec]` bit 0x10, and why only L9 M22 (Q2)

| claim | st | evidence |
|---|---|---|
| payload `+0x5c` (a word) → block `+0x6c`: `ldr r5,[r1,#0x5c]` / `str r5,[r0,#0x6c]` at **`0x31c3d8` / `0x31c3e8`** in the field copy `0x31bbe8`'s second-mask loop (mask word block `+8` \|= 0x40000). Same loop, `+0x52` → `+0x62` at `0x31bfb8` / `0x31bfc8` | READ | sweep of `0x31bbe8` |
| block → descriptor (block − 0x30) → core `+0x50`, so payload `+0x5c` = **core `+0xec`** | INFERRED, with a control | the copy into `core+0x50` itself was not read by me. Five other fields are read at exactly this shift: `+0xc2` joint (payload `+0x32`, `0x328c60`), `+0xc6` mode (`+0x36`, `0x3293c0`), `+0xd0` (`+0x40`, `0x329390`), `+0xe2` (`+0x52`, `0x328c24`), `+0xe8` (`+0x58`, `0x328cd8`); and `+0xec` gives a sensible `+0x5c` on every record (§2 table below) |
| no other writer: a sweep of `0x40000..0x46000` and `0x31b000..0x32b000` finds **only the two readers `0x427dc` / `0x42918`** for `#0xec` on the core. `0x32a80c str [r7,#0xec]` is r7 = obj+0xffc, another object | READ (control: the scan finds both known readers) | scratchpad s40.txt / s31b.txt |
| **em081_04u: 79 records, 8 with `+0x52` set, ONE with `+0x5c` bit 4: u 605** (SEQUENCE, `em081_04_010`, joint −1, mode 1, space 1, `+0x40` = 1, `+0x58` 900, offset (0, 300, 1600)) | READ | payload dump |
| u 604 (`em081_04_008`, j131), u 606 (`em081_04_002`, j130), u 100 / u 101 (`em081_04_002`, j−1, mode 3): `+0x52` = 0, `+0x5c` = 0, so **they never call `0x42744`** | READ | payload dump |
| L9 M22's binding: u 605 on bit 2, **f25..40** (monster.js 4957 `on: [[25, 41]]`). The soak's stop at **f26**, after the beam ran from f2, puts the refusal on u 605's first frames | INFERRED (timing + payload; no trace) | census §8 |
| So **u 606, u 604's L9 M22 binding and the mode-8 beam are collateral**: live.js `fail()` (543) hides every mesh of the runtime | READ (live.js) | |
| Tree-wide: of 7,346 records, 1,837 have `+0x52` set; their `+0x5c` = 1 on 1,455, 0 on 312, **0x11 on 63, 0x10 on 7** → **70 ray records in 24 `.pel`s** (em081_04u 1; em083_04u 8; em069_00c 6; em083_00u 6; em021_00c 5; em055_00c 5; ...) | READ | scratchpad allray.py; the board's "73 across 23" was a binding count over wired monsters |

## 3. `0x18154c` and its no-stage answer (Q3)

### 3.1 The ray (READ, `0x18154c` and `0x181928`)

| addr | what |
|---|---|
| `0x18154c..0x181660` | a 16-entry hit list on the stack at `sp+0x110` (type word `+4` = 0x15, each entry 0x50 B, a block at entry `+0x10` with height default −100000 at `+0x24`) |
| `0x181928` (`r1` list, `r2` = A, `r3` = B, `[sp]` flags) | reach = 0 with flags bit 1, 50 with bit 3, else **100** (literals `0x181a70..78`); d = B.y − A.y = 2000; reach' = reach > d ? reach : reach + d; **list `+0x54` = A.y + reach' = y + 100** (the reach limit); list `+0x50` = A.y = y − 2000; **the ray starts at (A.x, max(A.y, B.y) + 10000, A.z) = (x, y + 10000, z)** (literal 10000.0 at `0x181a80`), `+0x1c` = −1.0; list `+0x560` count 0, **`+0x564` = −100000.0** (the water height) |
| `0xc14744` / `0xc14924(filter, 1, group \| 0x3000000, 1 << area)` / `0xc3a254(sCol, list, ..., cb 0x181ad4)` | the collision filter and traversal (`0xc3a254` → `0xc39b28`): NOT READ. **Where the ray stops below** (list `+0x50` = y − 2000 is the obvious bound) is therefore NOT READ |
| `0x181ad4` (per hit) | attribute word `w`: **`w & 0x1046` → `+0x564` = max(`+0x564`, hit y)**; `w & 0x1004` → not recorded; otherwise inserted sorted by height (ascending), count `+0x560` (index capped at 15) |
| `0x181138` (hit block fill) | `+0..+5` = attribute word 0's bitfields, **`+6` = attribute word 2 (byte)**, **`+8` = attribute word 1 (the flags word)**, `+0xc`, `+0x10` = words 3 / 4, `+0x14` = −100000.0, `+0x20..+0x28` = `0x182dd4`'s vec3, `+0x2c` 0. A primitive with no attribute record answers **0x3fffffff** for each word (`mvn #0xc0000000`, `0x1811c0` / `0x18124c` / `0x1812dc` / `0x1813f8`) |
| `0x181774..0x1817c4` | count = byte `+0x560`; **0 → miss**; **1 → index 0 with no pick at all** (`cmp sl,#2` / `blo 0x1817c8`); ≥ 2 → the pick `0x181cac` |
| `0x181cac` (count ≥ 2, floor mode) | an area-class branch first (`0x5024b0(global, area, out-block byte +5) == 2`: NOT READ further). Then it walks down from the top, skipping hits whose flags have **0x10** (ceilings) and hits **above the reach** (y + 100). **Index 0 is taken untested when the walk reaches it** (`0x181dcc`). A pick whose flags byte 1 has 0x20 (attr 0x2000) takes the one below (`0x181e48..0x181e5c`) |
| `0x1817c8..0x181830` | the chosen entry → `sp+0x160` = **its height**; the out block (`sp+0x130..`) = its block, then **`+0x14` = list `+0x564` (the water height)**, **`+0x18` = the next hit below** (or the chosen height itself at index 0) |
| `0x181838..0x181898` | above-block (`[fp+0x14]`): `+4` = 1 and its height / block / vec when a hit lies above the chosen one |
| `0x18189c..0x1818e8` | **`*[fp+8]` = `sp+0x160` and the out block = the header block, written whether or not there was a hit** |
| `0x1818ec..0x181908` | **returns 1 on a hit, 0 on none, −1 when the pick returns > 15** |

### 3.2 The no-stage answer (READ)

- **Miss** (0 or −1): `0x42744` goes to `0x428e8`, where `sp+0x9c` (which `0x18154c` had just set to y − 2000)
  is overwritten with `unit+0x10f0`. The ray arm then gives exactly the bit-clear answer. This agrees with the
  board's summary of the 2026-09-25 note ("0x18154c returns its hit count clamped to 0/1 (0x1818f0)" and "a MISS
  goes into the byte-for-byte same block").
- **Hit**: floor = the chosen hit's height. Water = the highest `0x1046` hit, else −100000. u 605 (bit 0 set)
  gets **max(water, floor)**. If the hit polygon's attribute word 2 has bit 2, the input y is kept.

**The board's "0x42744 casts a 2000-unit DOWNWARD probe" needs refining (READ).** The ray starts 10000 ABOVE the
point. The −2000 point does two things: it sets the reach (a hit up to y + 100 counts as floor) and the default
"below" height. Whether the ray also STOPS at y − 2000 is inside the unread traversal.

### 3.3 In the viewer's terms

The viewer has one horizontal floor plane: `floorY` = `monsterFloorY() / 0.01` game units. That is the number
index.html 7892 hands the shells as `rock.floorY`, and shells.js `stageQuery` answers mask 0x10 with it. A
vertical ray from y + 10000 crosses that plane once if it lies below the start. Count 1 means index 0 is taken
without the reach or ceiling tests (§3.1). So:

| case | the ROM's answer with the plane |
|---|---|
| floorY < y + 10000 (and, if the traversal bounds the ray, ≥ y − 2000: NOT READ) | **hit, ground = floorY.** u 605: max(−100000, floorY) = floorY. The polygon's word 2 bit 2 is assumed clear |
| otherwise | miss → `[unit+0x10f0]` (the stand-in parent: **0.0**, host.js createParent zeroes it) |

**u 605** is placed at joint −1, space 1, offset (0, 300, 1600) × the unit's matrix: 16 m in front of
Boltreaver, 3 m up. With the plane its Y becomes `floorY`. In the game it would be the terrain under that point,
which on a flat arena is the same floor.

A plain floor's attribute words are not read. Assume word 1 with none of 0x10 / 0x1046 / 0x2000 and word 2 with
bit 2 clear: INFERRED from what the walls rows read of ceiling and water flags, not read on a ground triangle.
The check is the Forlorn Arena (m17a01) ground triangles' attribute records, with the rCollision parser of
posture-mount.md section 10 (on E:).

### 3.4 Why the recorder faulted on 2026-09-25 (READ: arithmetic match)

The board records Gore Magala's bit-4 records faulting at `0xc14100` with the container's `+0x14` =
`0xe3a0007f`. `0xc14100` is `ldr r0,[r0,r1,lsl#2]` after `ldr r0,[r0,#0x14]`, reached from `0xc44dc8`: `add r0,
r0, #0x3b58` on the sCollision object, the sibling of `0xc44dd4` that the ray's own callbacks `0x181ad4` /
`0x181138` call on `*0x21200e0`. **`u32(0x3b58 + 0x14)` = `0xe3a0007f`** in main.text. So the "container" was
.text read at sCollision = **0**. The singleton is in .bss (no image bytes at `0x21200e0`) and no harness
constructs it, and the recorder maps .text at VA 0 (effect-placement-mode4.md §0). **The fault was the real
`0x18154c`'s traversal running on a null sCollision.** The board's "the fault is not even in 0x42744" is true but
misleading: it is in 0x42744's callee. That closes the board's "NEXT: EFX_WATCH_STATE on 0x428d4". A hooked
`0x18154c` never touches sCollision.

## 4. What to implement (Q4)

### 4.1 The viewer (docs/render/rom/effect)

1. **A native for `0x18154c`** in proof.js, next to `0xc04f84`. It answers through `m.svc` under the recorder's
   service name (say `stage_ray`), so a check replays it. The service takes the stand-in floor (the plane:
   `floorY`, game units, from the same source the shells use, i.e. schedule.js's `rockInput().floorY` / index.html
   `monsterFloorY()/0.01`) and writes, exactly as `0x18154c` does:
   - `r1` → A (x, y − 2000, z), `r2` → B (x, y, z); flags = `[sp+0x10]`; the out pointers at `[sp]`, `[sp+4]`,
     `[sp+0xc]`.
   - on a hit (floorY below B.y + 10000): `*[sp]` = floorY; the hit block at `[sp+4]`: bytes `+0..+6` = 0, `+8`
     flags = 0, `+0xc` = `+0x10` = 0, **`+0x14` = −100000.0** (no water), `+0x18` = floorY (nothing below),
     `+0x20..+0x28` = (0, 1, 0) (INFERRED: `0x182dd4`'s vec3 is the normal; 0x42744 does not read it), `+0x2c` 0;
     the above block at `[sp+0xc]`: `+4` = 0, `+0x40` = +100000.0. **r0 = 1.**
   - with no floor: `*[sp]` = A.y, the hit block as the defaults above, **r0 = 0** (0x42744 then reads the unit).
   - clobber as a call does (cpu.js `clobber`, keeping r0).
2. **The stand-in parent's vt `+0xa8` / `+0xac`.** Today they are 0 in host.js `createParent`, so the lifted
   `blx` at `0x42890` / `0x428a4` would refuse with "call to 0x0". Point them at two fixed natives, as
   `PARENT_GETDTI` / `PARENT_ADD_EFFECT` are. The free addresses on the fixed page are `0x7e001014` / `0x7e001018`
   (`0x7e00101c`, `0x7e001040+` also free). Both answer **0**, which is what the recorder's `parent_vfn_a8` /
   `_ac` stubs answer. For a standing monster the game's `+0xa8` is 0 or 4, both reach 100 (READ, `0xaa2d0`), so
   0 is right for the reach. The `+0xac` group only feeds the real traversal.
3. **Lift `0x427e8..0x428e4`** from a recording that reaches it (4.2). The arm is straight-line: two `blx` to the
   unit and one `bl 0x18154c`. Its only branch, `0x428dc ble 0x428e8`, lands in a block the lift already has, so
   one recording with a floor covers it.
4. **Check before changing (not a ROM fix):** the bit-clear arm (1,767 tree-wide records with `+0x52` set) answers
   `[parent+0x10f0]` = 0.0. In the game that word is the monster's floor (`0xbdf34`, §1.4). It equals the
   viewer's `floorY` only where `monsterFloorY()` is 0. If it is not 0 for a monster, writing `floorY` into
   `parent+0x10f0` each frame (with `+0x1074` left at 0, as now) is the matching stand-in. It is the same
   labelled stand-in the ray gets. Measure `monsterFloorY()` on the walked monsters first.

### 4.2 The recorder (efx_emu.py / parent.py / vecdrawsched.py)

1. **`x.hook_at(0x18154c, ...)` (or a `stub` entry)** that answers as 4.1.1 with the recorder's floor: its parent
   stands at the origin, so `floorY = 0.0` (the unit's own height, which the game's probe gives a grounded unit).
   It writes the outputs and `x.ret(1)` / `x.ret(0)`, under the service name the viewer replays. **Never execute
   the real `0x18154c`**: sCollision is null (§3.4). Do not add `0x18154c` to lift-effects.sh. It is a native,
   not a lifted routine, and the board's "list it before any re-record" was for recording the real function.
2. parent.py: point VT `+0xa8` / `+0xac` at the same fixed addresses as the viewer (today they are per-parent
   stubs returning 0 under `parent_vfn_a8` / `_ac`; the value stays 0).
3. **Record u 605 itself.** `add_effects.py em081_04 --record` with `EFX_ALLOW_STAGE_RAY=1`, or retire
   `stage_ray()`'s refusal once the hook exists. Then `--check`, then the live soak on L9 M22. Only that record
   reaches the arm: the shell sets `shell_em081_04_L9M22_none_0` / `_near` carry u 101, whose `+0x52` is 0, which
   is why they never reached it. u 605 was never recorded at all (refused by name), so **other paths of u 605**
   (mode 1, space 1 at joint −1, the spawn check `0x328c10`) may still be unrecorded behind this one. The
   recording will show. Announce the efx slot (MEMORY: efx recorder/lift slot).
4. The same hook then admits **the other 69 ray records** (§2 table). Duramboros's eight (rom-map) are the
   biggest group on one walked monster.

## 5. Proposed `dev/rom-map.md` rows

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x427e8..0x428e4` (in `0x42744`) | the ray arm: A = (x, y − 2000, z) (`0x42944` = −2000.0), B = the point; unit vt `+0xac`(unit, 1) → group, vt `+0xa8`(unit) → flags, area byte `[unit+0x1054]` (post-indexed `ldr` at `0x42870`); `0x18154c(*0x21200e0, &A, &B, area, &h, hitblock, group, above, flags)`; `ble 0x428e8` on a miss; hit → floor h, water = hitblock `+0x14` | uMHEffectCore | R | dev/effect-ground-ray.md §1.2 |
| `0x42908..0x4292c` | the join: `[block+6] & 4` → keep y; floor = `sp+0x9c`; `core+0xec` bit 0 → max(water, floor) | uMHEffectCore | R | §1.3 |
| `core+0xec` = payload `+0x5c` | copied `0x31c3d8` / `0x31c3e8` (→ block `+0x6c`); bit 4 = ray, bit 0 = max with water. No runtime writer in the core's code | uMHEffectCore | R (copy) / I (block → core shift, five fields agree) | §2 |
| `0x328c10` (vt `+0x60`) | the spawn height check: `core+0xe2` gate; joint `[core+0xc2]` (vt `+0xac` `0x329b7c`) → vt `+0x58` → 1 when y − ground > `core+0xe8` (payload `+0x58`); called from the base step `0x329390` when `core+0xd0` (payload `+0x40`) != 0; 1 → vt `+0x9c`(core, 2) | uMHEffectCore | R | §1.5 |
| `0x328bd4` | vtable `0x174b96c` `+0x58`: the base ground resolve, returns 0.0 | — | R | §1 |
| `0x181928` | ray start (x, max(A.y, B.y) + 10000, z); list `+0x54` = A.y + (reach > d ? reach : reach + d) (d = B.y − A.y; reach 100 / 50 flag 8 / 0 flag 2); `+0x50` = A.y; `+0x564` = −100000 | shared | R | §3.1 (refines "Walls and ceilings" row `0x181928`) |
| `0x181ad4` | water height: `w & 0x1046` → `+0x564` = max; `w & 0x1004` → not recorded | shared | R | §3.1 (refines the `0x181ad4` row, which says 0x1004 for both) |
| `0x181138` | hit block: `+6` = attribute word 2, `+8` = word 1 (flags), `+0x14` −100000; no attribute record → 0x3fffffff per word | shared | R | §3.1 |
| `0x18154c` count rule | count 1 → index 0 with no pick (`0x18179c` `blo`); out height and block written on miss too (`0x18189c`); returns 1 / 0 / −1 | shared | R | §3.1 |
| `0xbdf2c..0xbdf38` | the enemy probe's hit: `P+0x5b4` = `e+0x10f0` = the picked floor (posture 6 gated on `e+0x1068 & 0x18`) | shared enemy | R | §1.4 |
| `0xaa2d0` / `0xaa1e0` | enemy vt `+0xa8` (ray flags: posture 5 → \|8; postures 1..6 → 0x10000 / 0x20000; `0x490fc(area)` → 4) / vt `+0xac` (group 4 / 8 / 0x808 / 0x1804 \| 0x8000); thunks `0x6bb44` / `0x6bb48` on 93 vtables | shared enemy | R | §1.2 |
| `*0x21200e0` (GOT `0x183224c`) | the collision singleton (INFERRED sCollision); **null in the recorder**: the 2026-09-25 fault `0xc14100` read `[0 + 0x3b58 + 0x14]` = .text `0xe3a0007f` | — | R (arithmetic) / I (name) | §3.4 |

**Withdrawn / corrected:**

| claim | why wrong | correction |
|---|---|---|
| row "`0x427e0` / `0x427e8` (in `0x42744`)": "Boltreaver's L9 M22 beam (mode 8, u 101, ShellScale 1.2) reaches it"; "What sets the bit: NOT READ" | u 101's payload has `+0x52` = 0 and `+0x5c` = 0; it never calls `0x42744` | the record is **u 605** (`+0x52` 1, `+0x5c` 0x11). The bit is payload `+0x5c` bit 4 (copy `0x31c3e8`). The beam, u 604 and u 606 stop only through live.js `fail()`. Research agent for the Viewer agent, 2026-10-07 (this note §2) |
| board: "0x42744 casts a 2000-unit DOWNWARD probe" | the ray starts at y + 10000 (`0x181a80`); −2000 sets the reach (y + 100) and the default below-height | §3.2; the ray's lower bound is NOT READ |
| board: the 2026-09-25 recorder fault is "NOT a misbehaviour of 0x18154c (the fault is not even in 0x42744)" | the faulting read is sCollision `+0x3b58` with sCollision = 0, inside the real `0x18154c`'s traversal | §3.4 |

## 6. Not read (named)

- The collision traversal `0xc3a254` / `0xc39b28` and the filter `0xc14924`: where the ray ends below, and
  which layers it sees (the rom-map's "the probe sees only `-a-g00`" stays INFERRED).
- `0x5024b0`, the area-class branch at the head of the pick.
- `0x182dd4`'s vec3 (INFERRED: the hit normal). Not read by `0x42744`.
- A plain ground polygon's attribute words 1 / 2 in the real files (§3.3).
- That vt `+0x9c`(core, 2) after a failed spawn check means "not spawned" (INFERRED from the name of the check).
