# em084_00 Nakarkos -- the tentacles' hit zones: their own table, and where the damage goes

Research agent for the Viewer agent, 2026-10-08. Raven: "Can you double check if Nakarkos tentacles have a hit zone
table or not", then "Yes, read the tentacle hit path."

**Answer.** Yes. Each tentacle (uEmOstgaloaArm, vtable `0x17f6498`) loads its own damage table, and it is
`enemy\dt_tune\ems099_00_dttune`. That file ships inside `em084_00.arc` under another monster id, which is why the
file search found "no arm dt_tune". The table has one block of 8 rows. Rows 0 / 1 / 2 are the arm capsules' slots
(tip / middle / base). A hit on a tentacle is scored on that row of the arm's own table. The damage is then copied
into the BODY: it takes Nakarkos's HP and goes on his part counter 1 (left tentacle) or 0 (right tentacle). The
arm has no damage step of its own.

Status per claim: **R** = the consuming instruction was read; **I** = inferred. Static reads only
(capstone over `C:\MHGU-ROM\exefs\main.text`, scratchpad `d.py` / `callers.py` / `immscan.py` / `movwscan.py`;
resource ids against `em084_00.arc` with `resids.py`, the `0x159daa0` hash scheme of rom-map row `0x152530`).
Every link was read off the instruction that consumes it, so no unicorn run was needed.

## 1. What the arm loads (R)

`0x107ba5c` = arm vt `+0x148`, the arm's own loader. Its extent is `0x107ba5c..0x107c02c` (`pop {..pc}` at
`0x107c02c`, then the literal pool). Every resource it requests goes through `0x152530(rm, id, dti)`:

| site | res id | file (arc path, hash-matched) | stored by | field |
|---|---|---|---|---|
| `0x107bebc` | `0x838c` (kind 1) / `0x838d` (kind 2) | `enemy\body_data\em084_00_arm_left_bodydata` / `_arm_right_bodydata` | `0x70924` | `arm+0x75cc` (rBodyData, the hit test's list, `0x70ff4`) |
| `0x107bf08` | `0x838e` / `0x838f` | `enemy\cam_body_data\em084_00_arm_left/right_cambodydata` | `0x70934` | `+0x75d0` |
| `0x107bf44` | `0x838a` | `enemy\hit_data\em084_00_arm_attackdata` | `0x708e4` | `+0x75d4` |
| `0x107bf80` | `0x838b` | `enemy\hit_data\em084_00_arm_hitsize` | `0x70904` | `+0x75dc` |
| `0x107bfbc` / `0x107bfd4` | **`0x8390` / `0x8391`** (both kinds) | **`enemy\dt_base\ems099_00_dtbase`** / **`enemy\dt_tune\ems099_00_dttune`** | `0x70960` | **`+0x75e8` / `+0x75ec`** |

- `0x70960` (`str r1,[E,#0x75e8]`, `str r2,[E,#0x75ec]`) has ONE caller in the binary, `0x107bff4`, so the arm is
  the only unit that sets these through it. The body loads through the shared loader `0x70460` instead.
- The arm loads no `dtbparts`. `0x8392` = `ems099_00_dtbparts` is in the arc, but no call in the loader's extent
  requests it, so `arm+0x75f0` is not set here.
- The dtt id is a fixed `movw r1,#0x8391` with no test of the kind, so **both tentacles use the same table**.
- Arc contents (`efx/shellef.load_typed`): `ems099_00_dttune` 614 B, `ems099_00_dtbase` 194 B,
  `ems099_00_dtbparts` 77 B, plus `area_*` / `map_info` files for ems099_00. Nothing else in the arc is named ems099.

## 2. Where a hit's hitzone row comes from (R)

1. **The hit test runs on the arm as a unit of its own.** `0x16bc54(r0, attack r4, unit r5)` walks
   `0x70ff4(r5)` = `[r5+0x75cc]`, through vt `+0x40` to the first record, then steps `+0x2c` per record
   (`0x16c26c`). For an arm unit that list is its own bodydata. After a hit, `0x16c524` reads the struck unit's em
   byte `[r5+0xb5f4]` and tests it against **`0x63`**, the value the arm's setup writes at `0x107b3dc`, and against
   `0x54` (the body).
2. **It passes the record on.** `0x16c4bc` stores the record pointer (r7) as the third stack argument of `0x1704fc`.
   `0x1704fc` then picks a handler by `[attack+0x6d]`: 4 → `0x1747a0`, 2 → `0x172784`, 1 → `0x1735b8`, otherwise
   `0x170ee4`. Each handler reads the record from the same stack slot. In `0x1735b8` it is `[sp,#0xc8]` → r7; in
   `0x170ee4` it is `[sp,#0xc0]` → sb.
3. **The row is picked by the record's `+6` byte.** All 17 calls of `0xbaaa4` in the binary are preceded by
   `ldrb r1,[rec,#6]`. For example, `0x17374c` / `0x17380c` / `0x170fc8` / `0x172878` / `0x1744cc` /
   `0x178408`. The exception is `0x9dabc`, which passes on its caller's r2. `0xbaaa4(E, slot)` returns `[[E+0x1428]+0x418+4*slot]`
   for a slot below 8 (`0xbaab8`), and for a higher slot it calls vt `+0x314`. So the row is read from the **struck
   unit's own** P block. The arm has its own P block: `0x107b40c..0x107b428` reads the body's `P+0x1b5` and writes
   the arm's own `[arm+0x1428]+0x1b5`.
4. **What the row is used for.**
   - In `0x1735b8`, `[row+3]` .. `[row+7]` are read as fire / water / ice / thunder / dragon, gated by the attack's
     element bits `0x10` / `0x20` / `0x200` / `0x40` / `0x80` (`0x173930..0x173a3c`).
   - `0x1783f0` re-fetches the row and compares `[row+0]` / `[row+1]` / `[row+2]` (cut / impact / shot) against
     `0x2d` (45), which INFERS the weak-spot skill test.
   - So the column order is the viewer's `TYPES` order.
5. **How the P rows are filled.**
   - `0xbab38` (the reset) writes `P+0x418+4k = [[E+0x75ec]+0x64]+0xc + 10k` for k = 0..7, through `0x70fbc` =
     `[E+0x75ec]+0x64`.
   - `0xbaacc(E, s)` writes table 0's row s, and `0xbaafc(E, s, r)` writes table 1's row r. `0xbaafc` **returns
     without writing when `[dt+0x10]` is 0**.
   - **The arm reaches the reset at activation.** Arm vt `+0x18` `0x107b3a4` calls `0xc9df4` at `0x107b440`.
     `0xc9df4` is `b 0xad4e0`, and `0xad4e0` calls `0xa4b90(arm, 0)` at `0xad504`, which calls `0xbab38(arm)` at
     `0xa4bdc`. `0xa4b90` has one other caller, `0xb8ce8`, with arg 1, which resets the same way.
   - **Nothing else touches the arm's rows.**
     - The only calls to `0xbaacc` / `0xbaafc` anywhere in the Nakarkos code (`0x1064be0..0x107fd2c` and the arm's
       `0x1088848..0x1088b64`) are the body's `0x1069c08` / `0x1069c18`, both on r4 = the body.
     - The arm's own disassembly has no `#0x418..#0x434` load or store and no `#0x75ec` access.
     - In shared code, the only caller of any of the three is `0xa4bdc`.
6. **The table's layout in the file.**
   - The dtt loader `0x57684` reads a 0x38-byte header, then a u32 into `+0x64`, then 0x50 bytes of part records
     into `[+0x68]`. If header byte 8 is non-zero, it reads that many bytes of preamble into `[+0x6c]`.
   - It then reads 0x50 bytes of **table 0 into `[+0x70]`** (= `[dt+0xc]`, with `dt = res+0x64`). Table 1 goes
     into `[+0x74]` (= `[dt+0x10]`) **only when header byte 0x12 is 0** (`ldrb r0,[fp,#0x102]` at `0x57818`, the
     header bytes from 0x12 on copied to `+0x102` at `0x57738`).
   - `ems099_00_dttune`: header byte 8 = 2 and byte 0x12 = 1, so it has **one table, at file offset 0x8e**, and
     `[dt+0x10]` = 0.
   - Positive control: the same walk on `em084_00_dttune` (byte 0x12 = 0) gives the body's two tables at
     0x8e / 0xde. Those are the rows `docs/hitzones.json` already carries (dttBase 142), including the Face
     65 → 30 that `0x1069b88` switches.

**So the arm's hitzones are `ems099_00_dttune` table 0, rows 0..2. They are fixed: the table has only one
block, and the setter for the second block returns without writing for this file.** (R)

| arm slot (bdd +6) | capsules | cut | impact | shot | fire | water | ice | thunder | dragon | stun | exhaust |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 tip (bones 11-12) | 4 | **63** | **63** | **35** | 15 | 0 | 0 | 10 | 20 | 0 | 0 |
| 1 middle (bones 4-10) | 9 | **36** | **36** | **25** | 5 | 0 | 0 | 0 | 10 | 0 | 0 |
| 2 base (bones 0-3) | 3 | **15** | **15** | **10** | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Rows 3..7 of the table are all zero, and no arm capsule points at them. The table's part records are all zero
(stagger 0). That has no effect, because the arm has no damage step of its own (§3).

**The earlier guess is wrong.** The NOT READ row in rom-map guessed "tip / middle / base = Back / Shell / Head,
30 / 15 / 65 cut". That was the body's table. The real order runs the other way: the tip is the softest (63) and
the base the hardest (15).

## 3. Where the damage goes (R)

1. **The handler writes the hit into the struck unit's P block.**
   - `0x1735b8` sets `P+0x444 = 1` (`0x173720`) and adds to the per-hit list at `P+0x448` (`0x1702ec`).
   - It calls `0x9d63c(E, [rec+8], dmg, ..)` (`0x173d9c`), which adds the damage to `P+0x488 + 2*part` (and to the
     `P+0x498` rows). The arm records' `+8` is 0, so it is the arm's part 0.
   - It also writes element and status state at `P+0x484..0x4fc`, and `E+0x142c` / `+0x1430`.
   - Vt `+0x2f8`, called at `0x173d84`, is `0x6c004` = `bx lr` on both the body and the arm.
2. **The arm never runs the damage step.**
   - The shared update `0xada80` calls vt `+0x1e8` (`0xadd64`), then tests **`[E+0x7648]`** (`0xadd7c`). When it is
     non-zero, it skips `0xa5844` → `0x97d20`.
   - `0x97d20` is the only function that lowers `P+0x370` (HP). It holds all three subtract-and-store sites in
     `0x0..0x400000`: `0x98a48`, `0x98b04` and `0x996e8`.
   - The arm's setup sets **`arm+0x7648 = 1`** (`0x107b3c0` / `0x107b3d4`). Across the whole binary, `+0x7648` is
     written only there and zeroed in the unit ctor (`0x6db24`). The six other sites only read it.
   - Positive control: the body never sets it, so the body runs `0x97d20` like every other monster.
   - The Nakarkos code has no `P+0x370` store (`immscan` over `0x1064000..0x1090000`: one load, `0x1067cf8`).
3. **The body copies the arm's hit into itself.**
   - Body vt `+0x1e8` = `0x1066048` runs just before the body's own damage step. On the host (`E+0x7420`) it checks
     `[[body+0xe028]+0x444]`, the hit flag in the **left** arm's P (`body+0xcc00+0x1428`), and calls
     `0x106cdd4(body, 0)`.
   - Otherwise it checks `[[body+0x1ab78]+0x444]`, the hit flag in the **right** arm's P (`body+0x19750+0x1428`),
     and calls `0x106cdd4(body, 1)`.
   - `0x106cdd4(body, side)`, with extent `..0x106d08c`:
     - side 0 → arm = `body+0xcc00` (kind 1, left) and **r4 = 1**; side 1 → arm = `body+0x19750` (kind 2, right)
       and **r4 = 0**.
     - It copies the arm's `P+0x444`, `0x484/0x485/0x486`, **`P+0x488` → body `P+0x488 + 2*r4`**,
       `P+0x498` → `P+0x498 + 2*r4`, `0x4c8..0x4de`, `0x4e0`, `0x4e4..0x4e6` and `0x4f0..0x4f8`. It also copies
       `E+0x142c / 0x1430 / 0x1431`.
     - It sets body `P+0x5db0` = the part index (1 left, 0 right) on tests of the body's `P+0x4d0` (`strbge` /
       `strbgt` at `0x106ced0..0x106cf74`).
4. **The body's damage step charges the copy.**
   - `0x97d20`'s part loop reads `P+0x488 + 2*part` (`0x980b0`) for each part whose dtt stagger is non-zero
     (`[dt+4] + 10*part`, `0x98094`).
   - It writes the part's counter `P+0x3be + 12*part` (`0x98690`) and its break progress (`P+0x3c0`, the level
     `P+0x3bd`).
   - It adds every part's damage into `[sp+0x4c]` (`0x986a0`), and that total is subtracted from **`P+0x370`
     (HP)** at `0x98afc` / `0x98b04`.

**So a tentacle hit lowers Nakarkos's own HP and goes on his part 1 (left) or part 0 (right).** Those are the body
dtt's part records 0 / 1: stagger 150, break 220, "red" in hitzones.json `parts[0]` / `[1]`. state-decodes reads
the same counters as the tentacles' "part HP" (`P+0x3be` / `P+0x3ca`, set on every stance change by `0x106c8e8`)
and "Exposed" (`P+0x3bc` / `P+0x3c8` == 3, `0x107e25c`). The arms have no HP of their own that the game charges.
(R for the copy and the HP sum. I for "the part-1 / part-0 counters are what the viewer calls the left / right
tentacle", which follows from kind 1 = left, dev/beams/em084_00.md.)

## 4. Gates on an arm capsule

- **Flag word** `0x804` / `0x884` / `0x800`: no bit of `0x152`, so the common attack types count every arm
  capsule (R, rom-map row of the bdd).
- **Group mask: one tip sphere switches off.** Arm vt `+0x2a8` = `0x107d704` runs every frame:
  - It clears the arm's `P+0x3b4` to 0 (`0x107d7a8`).
  - It sets bit 15 (`0x107d7e8`) when the motion is `0x21b` / `0x21c` (`l_2` / `r_2` M27 / M28) and
    `0xb0968(arm, 2, 0, 120.0, 0.0)` passes.
  - Only record 1 carries mask `0x8000`: the radius-330 tip sphere on bone 12, flag `0x884`. So that one tip shape
    is off during that window and on otherwise.
  - What `0xb0968` mode 2 tests is NOT READ; per Congalala's read, mode 1 is "frame >= N".
- **A hit already taken.** Arm vt `+0x344` = `0x107ddbc(arm, attack)` returns 0 when `[attack+0xb5]` bit 5 is set.
  `0x16c560` sets that bit after the attack hits an arm (em `0x63`, `+0xb5f7` = 1) or the body (em `0x54`,
  `+0xb5f7` = 0). It also returns 0 when `0x106ef7c(body)` finds a hit flag (`P+0x444`) on the body or either arm.
  - R for the code. I for the purpose: one swing scores on only one of the three units, and only one a frame.
  - Where vt `+0x344` is consumed is NOT READ.

## 5. What the viewer should bake

- **Hitzone rows for the attached capsules**, identical for both tentacles. In `hitzones.json em084_00.attached`,
  slot 0 / 1 / 2 should take the three rows in §2's table:
  - Tentacle Tip: 63 / 63 / 35, fire 15, thunder 10, dragon 20.
  - Tentacle Middle: 36 / 36 / 25, fire 5, dragon 10.
  - Tentacle Base: 15 / 15 / 10, no element.
  - Stun 0 and exhaust 0 on all three.
- Source: `enemy\dt_tune\ems099_00_dttune` from `em084_00.arc`, offset 0x8e, one block. build-hitzones.py's
  `read_dtt` reads `<em>_dttune.dtt` from RAW, so it needs that file extracted under a name it can find.
  Alternatively, `attached` can carry its own `tables` key.
- **One table, no state rule.** The Face Revealed / Guarded switch (`0x1069b88`) rewrites the body's slot 2 only.
  Nothing switches an arm row: the table has one block, and the arm has no meat call.
- **Names: Tentacle Tip / Tentacle Middle / Tentacle Base.** Do not show them as Back / Shell / Head; the body's
  rows are not involved.
- **Part link**: a hit on the left tentacle goes on body part 1, and a hit on the right goes on body part 0. That is
  `parts[1]` / `parts[0]`: stagger 150, break 220. The capsules' own part field is 0 in the ARM's list, which is
  copied into the body at index 1 / 0. It is not the body's part 0.
- The radius-330 tip sphere (record 1) is group-masked off during `l_2` / `r_2` M27 / M28 past the `0xb0968` window.
  Draw it as the viewer draws other group-masked shapes.

## 6. NOT READ

- The order of the arm's loader (vt `+0x148`) and its activation (vt `+0x18`). The rows only resolve if the load
  comes first, as for every enemy (I).
- What `0xb0968` mode 2 tests (the tip sphere's window). Who consumes vt `+0x344`.
- Inside `0x97d20`'s part branch: the sever / Exposed logic for parts 0 / 1, and what `P+0x5db0` adds
  (`[[dt]+0x54]+0xc` at `0x980ec`).
- The global clear: `0x1721a0` calls `0x9d5c0` (which zeroes `P+0x444`) for each enemy whose `E+0x1408` bit 30 is
  set. Whether the arms are in that list, and who sets bit 30, is not read. No double-charge was seen in the code
  read, but none was looked for.
- Whether `0x1066048`'s "left first, else right" drops a right-arm hit in the frame the left arm is also hit.
  vt `+0x344` (§4) suggests the two cannot both be hit in one frame (I).
