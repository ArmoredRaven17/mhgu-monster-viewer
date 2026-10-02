# em004_00 shell02 — decode spec (Basarios / Gravios, uShellEm005_sp_02, u 130)

## UPDATE — 2026-09-30, Viewer agent: IMPLEMENTED AND DRAWING (supersedes the handover below where they differ)

- **The common params exist.** `em004_00_02` (a FUP at the `.shl`'s own path, which `efx/shellef.py load()` dropped)
  holds ints [3], floats [7200.0, -50.0], vecs [[0, -30, 80]]: joint 3 (`+0x1658`), the ray length 7200 (`+0x165c`,
  through `+0x160` `0x3fd288`, which answers 1.0 only when it is 0), the origin's push −50 along the joint's second row
  (`+0x168c`), the origin's offset (0, −30, 80) in the joint's space. §3's "no common FUP" paragraph is WITHDRAWN.
- **§4b is settled: `[+0x16c]` is audio.** Under the emulator (`efx/agents/basarios-scratch/shell02/b02run.py`), `0x4eeed0` is called with
  the `_snd001` id 201. Nothing drawn depends on it.
- **The runtime is transcribed end to end** in `docs/render/shells.js` (`spawn02b`, `class02`, `aim02`, `make02`,
  `angles02`, `far02`, `end02`, `step02`), ROM-run first. The spawner's class / aim, the init and aim matrix, the
  activation `+0x18` (`0x3fbaf8`), the far check `+0x168` (`0xd30cec`, size × 250), the life, the motion-change end
  `+0x170` (`0x3fd4c4`), the end `+0x148` and the ending `+0x150` are all there. The addresses are in
  `dev/rom-map.md` (uEm004_00 rows and the Render-lane rows).
- **The beam clip is a BLEND** (`0xd29100..0xd291d4`): class 2 → M27 alone, class 0 → M27 + M28 (aimed up), class 1 →
  M27 + M29 (aimed down), with M27's weight 1 − min(|pitch|, 70°)/70°. All three carry the beam. On a partner clip the
  viewer hands phase 0 a target at exactly 70° (the nearest the full-weight pose allows; `partnerTarget02`).
- **The actions:** (7,0x0e) = `0xd28bb4(e,1,0)`, (7,0x32) = `(e,1,1)`, (7,0x0d) = `(e,0,0)`. r1 is phase 1's spawn gate,
  so (7,0x0d) plays the clip and never fires. Issued per em004_00_cmdtbl g1 (see SHELL_DATA's note).
- **Records:** u 130 (`em005_00_002_s`) is exported as a `when: 'shell'` record. M29's downward start (roll 180°)
  reached an unrecorded path of the lifted request, `0x31e014` (the start quaternion's sign flip). Recorded as
  `shell_em004_00_L2M29_start_70x0e_*` and re-lifted.
- **Still unread:** phase 2's follow-up motion past `0xd2960c`; Gravios's mode branch at `0xd28d7c`; and the
  position link `0x3fc070` (the stage query, endpoints below). The viewer's base02 does NOT transcribe it: its ray
  keeps the full 7200. Whether a floor hit moves `+0x40` (the `+0x1674` bit-2 copy at `0x3fd300`) — and so the start's
  angles, taken from `+0x40 − origin` at activation — is unread. That matters most for M29, whose beam points 70°
  into the floor.

## HANDOVER — read this first (2026-09-30, Render)

**State.** The class, its base, the reader, the whole per-frame chain and the stage query's endpoints are
read and written up below. **What remains before a step can be transcribed:** the step's own remainder past
`0x3fd3c0`, whatever writes `+0x1674` bit 2 (which gates the position copy), and `0x3fc378`'s arithmetic
(the effect placement). Those three, not the endpoints.
`docs/render/shells.js` carries `params02b` + `READERS02` (his reader `0xd30a90`), `spawn02b` and its
dispatch; the shell REFUSES BY NAME at frame 142 and nothing is placed. Nine shell suites are byte-identical
with that in the tree. No step, end or init is written, deliberately.

**The exact next read, and why it stopped here.** `0x3fc070` — the link that produces the position — is a
STAGE QUERY: it builds a query struct, calls `0x43ac6c` to set it up and `0x43ac8c` to run it, and on a hit
stores the point into `+0x15f0..+0x15f8`, the result code into `+0x1640`, `0` into `+0x15fc`, then calls
`[+0x158]`, which copies that point into the shell's position. **The viewer already models that query**
(`stageQuery`, and `collide()` names `0x43ac6c / 0x43ac8c` as "the same query the rocks make"), so this
transcribes — EXCEPT that the segment's endpoints are not visible in `0x3fc070`. One end is the literal
`-100000.0` at `sp+0x34`; the other comes from a PIC vec3 at slot `0x1832130` → **`0x19176f0`**, which is in
`.bss`, 0x40 bytes after the engine's shared empty vec3 (`0x19176b0`) and near the shared empty 4x4
(`0x19177b0`). armdis does not map `.bss`, so it reads as nothing here.

**What the viewer already documents about this query, checked before reading the ROM again** (shells.js,
above `collide()`): `0x43ac8c(shell, &out, &type, &result, off)`; the stage arm is taken when `+0x15c2 == 0`
(mask `0x30`), and `+0x15c3 == 0` selects **`0x4a1e84`, which for base00 uses A = `+0x40` (the position)
and B = `+0x1000` (the anchor)** — or `0x4a1f68` for base54, both plus an offset. So **the segment's
endpoints are the SHELL's own fields, chosen by a dispatch on `+0x15c3`**, not fields of the caller's
struct. Two consequences for base02:
- which variant `+0x15c3` selects for THIS base is unread, so its two endpoint fields are unknown;
- the PIC vec3 at `sp+0x40` and the `-100000.0` at `sp+0x34` are parts of the query STRUCT that `0x43ac6c`
  initialises (the frame is `sub sp,#0x50` with the struct at `sp+0x20`, so it reaches `sp+0x50`), not the
  segment itself. Do not model them as endpoints.

**THE ENDPOINT QUESTION IS SETTLED: `+0x40` (position) and `+0x1000` (anchor).** An image-wide census of
stores to the two dispatch bytes, with a control (`+0x15c8`, 296 stores — the instrument demonstrably sees
this form):

    +0x15c2  3 stores, at 0x48cda0, 0xfac5e0, 0xfad05c    — none in base02's band or sp_02's module
    +0x15c3  6 stores, at 0xd2159c, 0xd21da8, 0xd22260 (Khezu's class band), 0xe0f6f4, 0xf65638, 0xf78b10
                                                          — none in base02's band or sp_02's module

So other classes set these bytes and **this one never does**: both stay at their construction value of 0,
which takes `+0x15c2 == 0` → the stage arm (mask `0x30`) and `+0x15c3 == 0` → `0x4a1e84` → **A = `+0x40`,
B = `+0x1000`**. That is the variant `shells.js` `collide()` already models, and the same reasoning the
existing base00 transcription already rests on — base00 does not write `+0x15c3` either, and its rocks are
checked against the ROM running its own code.

*A bounded census over three chosen bands found ZERO stores to either byte and would have supported the
same conclusion for the wrong reason. Widening it to the image found nine, all in other classes. The
conclusion survived; the evidence for it did not.*

**`+0x1674` IS WRITTEN BY THE BASE CTOR, at `0x3fb948` — and the value is one instruction short of read.**
An image-wide census with TWO controls (`+0x15c8`, 296 stores, and `+0x1644`, which sp_02's own reader
writes at `0xd30aa8` — the second control is what makes silence about this base meaningful) found 20 stores
to `+0x1674`, exactly one of them in base02's band. Reading around it shows the ctor's default run:

    0x3fb8f4  movw r1,#0x163c / str lr,[r0,r1]      0x3fb904  mov r1,#0x1640 / str r2,[r0,r1]   (r2 = 3)
    0x3fb90c  movw r1,#0x1644 / str lr,[r0,r1]      0x3fb918  +0x1648 <- lr
    0x3fb920  +0x164c <- r2 (mvn #0 = -1)           0x3fb928  +0x1650 <- r3 (movt 0xbf80: -1.0f)
    0x3fb930  +0x1654 <- r2      0x3fb938  +0x1658 <- r2
    0x3fb940  movw r1,#0x1674 / mov r2,#2 / str lr,[r0,r1]      <- THE FLAGS WORD gets `lr`
    then +0x1670, +0x166c, +0x1668, +0x1664, +0x1660, +0x165c all <- lr; +0x1678 / +0x167c <- ip

**`lr` IS ZERO — READ.** The ctor begins at `0x3fb7f8`; after calling the base-base ctor `0x43a78c` it does
`mov lr, #0` at **`0x3fb804`** and uses `lr` as its zero register for the whole default run (`+0x15d4`,
`+0x15d0`, `+0x15cc`, `+0x15c8`, then the `+0x163c..+0x1674` run). So:

> **`+0x1674` = 0, therefore bit 2 is CLEAR, therefore the step's position copy NEVER RUNS for this class.**

The census says nothing else writes that word for this base — 20 stores image-wide, exactly one in the
band, and that one is this ctor store. So `0x3fc070` computes its stage query and parks the hit point in
`+0x15f0..+0x15f8`, the step reaches `0x3fd300`, the `ands #4` fails, and the point is never copied into
`+0x40/44/48`. **base02's shell does not move.** It stays where the spawn put it — for shell02 that is the
owner's own position, which the spawner writes into the request at `0xd2958c` — and what the step does
instead begins at `0x3fd334`.

That also disposes of the endpoint question for HIM: the query runs and its result is discarded. The
endpoints still matter for the eighteen other classes on this base, one of which may set bit 2.

`lr` was stored to ten fields in a row, which read as a zeroing register — and If it is 0 the flags word is 0, bit 2 is clear, the step's position
copy never runs, and the shell is placed once by the init's effect placement and never moves. If it is not
0 the opposite. One instruction decides the runtime's whole shape.

*Note the `mov r2,#2` at `0x3fb944`: it sits between the `movw` and the `str`, and the `str` uses `lr`, not
`r2`. It is setting up a LATER store — the same "the mov belongs to the next operation" trap that appears
throughout these readers. Do not read it as `+0x1674 = 2`.*

**THE STEP'S TAIL IS READ — it is a BREATH-STYLE EMISSION.** From `0x3fd334`:

    +0x1648 == 0            -> jump to the end (0x3fd4b8)
    0x43b08c(shell, &+0x1610) ; then sp+0xf0 = [+0x1610] * K, sp+0xf8 = [+0x1618] * K   (K a literal)
    +0x1604 (the effect handle) != 0:
        0x329c9c(handle, r8, 0) / 0x329d04(handle, &sp+0xf0, 0)        ; PLACE the existing effect
        and for r5 = 1 .. r4-1, the same pair with index r5             ; one per entry
    +0x1604 == 0  (0x3fd424):
        0x40a54(&sp+0x10) ; [vtable+0x130] for the model interface ; 0x4a10c8(shell, &sp+0x10)  ; FILL a requester
        sp[0x24] |= 2                                                   ; the ROTATION OVERRIDE
        sp+0x40/44/48 = a vec3, sp+0x4c = 0                             ; its position
        0x4a11e4(shell, [r6]) -> stored at +0x1604                      ; SUBMIT, keep the handle
        0x40a94(&sp+0x10)

So the shell **creates its effect once and re-places it every frame**, with angles from `+0x1610` and
`+0x1618`; it never moves itself. `shells.js` already models both halves — `rockRequest` fills `0x4a10c8` /
`0x4a11e4` ("refuses listId > 7 or uniqueId < 0"), and its own comment names `0x329c9c` / `0x329d04` as
"a breath shell's effect is placed". The `|= 2` is the rotation override that comment also names ("the
breath's `+0x14 |= 2`"), which the rock path deliberately does not set.

**Still unread and therefore still blocking a build:** `0x3fc378`'s arithmetic — the OTHER placement path,
the one that reads the init's vec3 at `+0x15e0..+0x15e8` — and the literal `K` the two angle floats are
scaled by, and what `r4` (the entry count) is read from.

    NEXT READ, in order:
    0. ~~What `lr` holds at `0x3fb948`~~ — READ: `mov lr,#0` at `0x3fb804`, so the flags word is 0 and the
       shell does not move. The remaining reads are the step from `0x3fd334` on, and `0x3fc378`.
    0b. ~~`+0x15c3` for base02~~ — SETTLED, endpoints are `+0x40` and `+0x1000` — this is the field that decides the segment,
       and it is cheaper than either item below.
    1. What `0x19176f0` holds in the initialised image — EMC's emulator route (build/arm/emu.py after
       init_array) is the instrument, with Khezu's ORB_SLOT_POINT as the control, the same run that settled
       `0x19176b0`. If it is a third member of the shared-empty family, say so with a second consumer.
    2. `0x43ac6c`'s struct layout, to know which fields of `sp+0x20..0x38` are the segment.
    Only then does `0x3fc070` transcribe.

**What NOT to assume.**
- **Slot numbers are per base.** `+0x150` is base00's landing and this base's ENDING. Do not carry base00's
  names in; every slot meaning in this file was read in this base.
- **`+0x13c` is not a launch computer.** Its vec3 at `+0x15e0..+0x15e8` is read only by `0x3fc378`, the link
  that places the EFFECT. The shell's own position comes from the step, not the init. Writing base02
  init-first, as base00 and base54 are written, produces a shell that never moves.
- **Basarios hides four mechanisms.** Bit 3's rotation (angle words `(0,0,0)`), the `+0x168c` scale
  (`0.0`), the empty vec3, and EMC's `owner + offset x matrix` where the matrix is the empty 4x4. Each is
  inert ON HIS DATA and real for the next class on this base. Transcribe the mechanism, never the
  simplification — a shell that looks right for him can be wrong for all eighteen others.
- **`[+0x16c]` is not established as audio.** It is the only link naming `+0x164c` / `+0x1650` (the `_snd`
  fields) and it calls `0x4eeed0` / `0x4ef25c` / `0x807984`; one read of `0x4eeed0` did not settle it.
- **Flag scans need all four mnemonics.** `tst` / `ands` / `bics` / `teq`. A `tst`-only scan of this base
  reported "no flags word" when the word is `+0x1674`, tested with `ands`.

---

Written by Render, 2026-09-30, to the procedure EMC used for dev/em004-shell00-spec.md. Every value carries
its ROM address. Anything not read is marked **UNREAD** and must not be filled with a default or with
another class's value. Lines attributed to EMC are marked; everything else is read here.

Class `uShellEm005_sp_02`, global shell id **0x6c** (Basarios) and **0x6e** (Gravios) — EMC: both ids in the
global table at `0x175c3e8` name this class and differ only in the resource word (`0x89ba` / `0x89bc`), so
**one class serves both monsters**. Folder `shell\em\em004_00_shell02`. Arc ef files: `ef001` only for
em004_00, `ef001..ef012` for em005_00 (EMC). The viewer's entry has one mode, mode 1, `ef [[0, 130]]`,
`sh { ints: [], floats: [76.0], vecs: [[0,0,0]] }`.

---

## 1. The vtable — 0x17991d4

**Anchored on the reader slot, not on dti.json's vtVar** (which was 0x174 off for base00). The reader
`0xd30a90` appears as exactly **one** word in the whole image, at `0x1799320`; by the `+0x14c` convention
that makes the table base `0x17991d4`.

**Positive control:** the same anchoring on shell00's reader `0xd304ac` (also unique, at `0x1799034`) gives
base `0x1798ee8`, and that table then matches **8 of 8** of base00's documented path slots and carries
shell00's landing `0xd3066c` at `+0x150`. The method reproduces a known answer.

**Extent.** EMC established shell00's table as `0x17c` (95 slots) by finding the next table, shell01's at
`0x1799064`, rather than choosing an end — and shell01's is then `0x17991d4 - 0x1799064 = 0x170`, 92 slots.
For shell02 the next table is **`0x1799350`, and it is a class table by its own contents** — `+0x14c`
`0xd3144c` (a reader in the em004 class band), `+0x150` `0xd31914` (its landing), `+0x158` `0xd315f4`, and a
destructor pair `0xd3137c` / `0xd31380` at `+0x000` / `+0x004`. So shell02's table is
`0x1799350 - 0x17991d4 = 0x17c`, **95 slots, confirmed the same way EMC confirmed shell00's** — by finding
the next thing, not by choosing an end.

### 1.1 A correction to dev/em004-shell00-spec.md §8

The two words that spec calls shell00's slots `+0x428` and `+0x454`, and reports as never called, **are not
shell00's slots**. The two tables are `0x2ec` apart and

    shell00 +0x428 = 0x1799310  ==  shell02 +0x13c = 0x1799310
    shell00 +0x454 = 0x179933c  ==  shell02 +0x168 = 0x179933c

Shell00's table ends before `0x17991d4`; the read ran past it into this one. EMC's detector was right that
nothing calls them *as shell00 slots*. Consequences: the "a class can reinterpret a base field's type"
worry does **not** apply to shell00's flags word, and `0xd30b84` and `0xd30cec` are shell02's own methods,
called normally. EMC has since removed §8 and recomputed shell00 over its true 95 slots: **91 of 95
identical with em003_00 shell00, four overrides** — `+0x004` dtor `0xd30498`, `+0x014` `0xd307f4`,
`+0x14c` his reader, `+0x150` his landing — replacing the earlier "256/288, 32 differing". Only the reader
and the landing are on the path, which is what the shell00 spec already assumed.

### 1.2 Slots

His own overrides (band `0xd30xxx`), by offset:

| slot | target | read here |
|---|---|---|
| `+0x010` | `0xd30a88` → veneer to `0x4a0ec4` | one-instruction veneer, nothing of his own |
| `+0x030` | `0xd30a8c` → veneer to `0x4a180c` | same |
| `+0x13c` | `0xd30b84` | §4 |
| `+0x14c` | `0xd30a90` | the reader, §3 |
| `+0x15c` | `0xd30e30` | **UNREAD** |
| `+0x168` | `0xd30cec` | called FIRST in the per-frame move (§4a). **UNREAD** beyond EMC's read of its guard: a predicate over a 12-value enum testing a bit of mask `0x33` |

Everything else is the base's. **The base is not base00**: where base00 has `0x3f8xxx/0x3f9xxx`, this table
has `0x3fcxxx/0x3fdxxx` —

    +0x148 0x3fc698   +0x150 0x3fc610   +0x154 0x3fd538   +0x158 0x3fd2d8
    +0x160 0x3fd288   +0x164 0x3fd540   +0x170 0x3fd4c4

and `+0x150` is the BASE's, not his own. **`+0x150` is this base's ENDING, not its landing** — it is
tail-called from the state-`0xfe` branch of the per-frame entry (§4a). The line above originally read
"the landing at +0x150", carried over from base00 where that slot IS the landing; that was the borrowed
slot name this file warns about, caught by reading `0x3fbdc8` rather than by assuming.

**The base is shared by 19 classes.** Searching the image for the base step word `0x3fd2d8` at `+0x158`
finds 19 vtables, all with `+0x150 = 0x3fc610`. One of them, **`0x174e660`, has no reader at `+0x14c`** —
that is the base class's own table. The other eighteen are monster classes, this one among them. So a
runtime written here serves Gravios and sixteen others, not only Basarios.

> **UNREAD, and it matters: the slot MEANINGS are base00's, not this base's.** `+0x13c = init`,
> `+0x158 = step`, `+0x168 = point` are base00's conventions. Only `+0x14c = reader` is established here,
> by the anchoring. Which of this base's methods is its init, its step and its landing must come from
> reading the base's own dispatcher, and until then no slot but the reader may be relied on.

---

## 2. Where it is spawned (EMC)

fn `0xd28bb4`, phase byte `[[unit+0x1428]+0x1a1]`: 0 → `0xd28c0c`, 1 → `0xd28d28`, 2 → `0xd28cdc`. In phase 1,
after the frame test at `0xd28d54` (frame 142.0, `bl 0xb0974`):

    00d28d68  movw r0, #0xb5f4        ; the em number
    00d28d6c  mov  sb, #1             ; THE MODE, set before the test
    00d28d70  ldrb r0, [r4, r0]
    00d28d74  cmp  r0, #4             ; Basarios?
    00d28d78  beq  0xd29294           ; yes, with sb still 1

Nothing writes `sb` between `0xd29294` and the spawn. Gravios falls through and recomputes `sb` from the
`[+0xcac0]+0x24` flag bits. The spawn is `0xd29570` `stmib r1, {r0, sb}` — `+0x04` the class id from
`[unit+0xcacc]`, `+0x08` the mode; allocator `0x3fb7bc` at `0xd29558`.

**`0xd2958c..0xd295a0` writes the OWNER's `+0x40/+0x44/+0x48` into the request's `+0x10/14/18`.** So this
shell's spawn point is the monster's own position at spawn time — not a `.bss` table, and not the problem
that blocks shell00. The viewer already passes that (`schedule.js` hands shells `ownerPos`).

Clip **L2 Motion[27]** (`movw r1,#0x21b` at `0xd29180`, the function's only setMotion), frame **142**;
`Motion[27]_start` is 176 frames, so the frame is inside it. Issued by `(7,0x0e)` and `(7,0x32)`, both in
`em004_00_cmdtbl`. Both rows are already in `SHELL_DATA.em004_00`.

---

## 3. The reader — 0xd30a90

Read to its `pop {r4, pc}` at `0xd30b80`. Ten fields:

| call | site | destination | accessor |
|---|---|---|---|
| `0x4a22f0(0, -1)` | `0xd30aa0` | `+0x1644` | getEffect |
| `0x4a2378(0)` | `0xd30ab4` | `+0x164c` | **UNREAD accessor** |
| `0x4a2378(1)` | `0xd30ac8` | `+0x1650`, through `vcvt.f32.s32` | **UNREAD accessor** — an int stored as a float |
| `0x4a23f4(0)` | `0xd30ae8` | `+0x1654` | accA |
| `0x4a2224(0)` | `0xd30afc` | `+0x1658` | accB = **common int** |
| `0x4a2264(0)` | `0xd30b10` | `+0x165c` | common float |
| `0x4a2264(1)` | `0xd30b28` | `+0x168c` | common float |
| `0x4a22a8(0)` | `0xd30b40` | `+0x1678` | common vec |
| `0x4a24f8(0, -1)` | `0xd30b58` | `+0x1660` | getFloat = **sh float** |
| `0x4a2584(0, -1)` | `0xd30b74` | `+0x1680` | accVec = **sh vec** |

### 3.1 How the accessors were fixed

By positive control against readers the viewer already transcribes, which is the method
dev/em004-shell00-spec.md used for getInt / getFloat. `params00`'s reader `0xe82304`, whose field→index map
is in shells.js:

    0x4a22f0(0..3) -> +0x15c8 / +0x15cc / +0x15d0 / +0x15d4   the ef handles      => getEffect
    0x4a23f4(0)    -> +0x15d8                                  (spec's accA, unread)
    0x4a2224(0)    -> +0x15dc   params00's `joint: c.ints[0]`  => COMMON INT
    0x4a2264(0/1)  -> the flight float on the early/late arms, params00's `c.floats[late ? 1 : 0]`
                                                               => COMMON FLOAT
    0x4a24f8(0/1)  -> +0x15f4 / +0x15f8   params00's `sh.floats[0]/[1]`   => SH FLOAT
    0x4a22a8(0)    -> +0x1610   params00's `c.vecs[...]`        => COMMON VEC
    0x4a2584(0)    -> +0x161c   params00's `sh.vecs[0]`         => SH VEC

Khezu's `params03` reader `0xd21b10` is consistent with the same assignment.

**`0x4a2378` is the `_snd###` FUP's int getter** — EMC, 2026-09-30, **INFERRED not READ**: they have not
read the loader that puts the `_snd` file at holder `+0x0c`, but the test discriminates. Gravios's `sp_13`
reader calls it at indices 0 AND 1, so the array holds at least two ints, and of his shell13's four per-mode
files only `_snd` does (`_snd000 ints=[205, 300]`; `_hit` and `_sh` hold one each). Corroborated by
`em004_00_02_snd001 = [201, 300]` — the same shape, an id near 200 and a 300 — and by shell00's reader never
calling it while all eleven of its `_snd` files are empty.

The structure EMC read out, worth having whole: the param holder has four sub-objects, one per per-mode
file, and an accessor picks the FILE by its getter and the TYPE by the vtable slot it calls
(`+0x44` int, `+0x4c` float, `+0x54` vec):

    0x48a408 -> [holder+0x08] _ef    0x4a22f0 getEffect = _ef.get(i)
    0x48a458 -> [holder+0x0c] _snd   0x4a2378           = _snd.getInt(i)
    0x48a4a8 -> [holder+0x10] _hit   0x4a23f4 accA      = _hit.getInt(i)   (by elimination — weakest)
    0x48a4f8 -> [holder+0x14] _sh    0x4a2470 getInt / 0x4a24f8 getFloat / 0x4a2584 accVec
    0x489ea4 -> [obj+0xe4]    cmn    0x4a2224 accB      = cmn.getInt(i)

**So `+0x164c` and `+0x1650` hold SOUND parameters** (`em004_00_02_snd001 = [201, 300]`: an id and a
parameter, the second converted to float). If nothing but an audio call consumes them they need no visual
implementation at all — which is checked in §4b rather than assumed.

~~**Basarios has no common FUP anywhere in his arc** (EMC, shell00 spec §2). So `accB(0)`, `0x4a2264(0/1)` and
`0x4a22a8(0)` — the three common-block reads above — all take their accessor's null path for him. What each
null path returns is **UNREAD** except accB's, which `0x4a225c` answers with `-1`.~~ **WITHDRAWN 2026-09-30 (Viewer
agent):** the FUP `em004_00_02` exists at the `.shl`'s own path — ints [3], floats [7200, −50], vecs [[0, −30, 80]] —
and the listing that said otherwise kept one resource per path (dev/rom-map.md traps). The null paths are read too:
int → −1, float → 0.0, vec → the shared empty vec3.

---

## 4. `+0x13c` — 0xd30b84, read

    guard    bl 0x3fb9bc; result must be 1, else return 0
             bl 0x4a0ee4 (the mode); r0 = mode - 1; (u8)r0 > 0xb -> return 1
             mask 0x33: `tst r5, r1 lsr r0` with r5 = 1, r1 = 0x33 -> bit (mode-1) must be set,
             i.e. modes 1, 2, 5, 6. BASARIOS'S ONLY MODE IS 1, so he takes the body.
    body     bl 0x3fc750                      (UNREAD)
             bl 0x4a0f00; zero -> return 1     (UNREAD predicate)
             copy 0x40 bytes from a PIC pointer into sp[0..0x3f]      -- a 4x4 matrix
             r1 = [shell + 0x1658]  (the common int the reader stored: the JOINT)
             bl 0xc15a4(joints, joint, &sp)    -- the same joint-matrix call base00's init makes
             s0 = [shell + 0x168c]             (the second common float)
             [shell+0x15e0] += s0 * sp[0x10]   -- sp+0x10/0x14/0x18 is the matrix's SECOND ROW
             [shell+0x15e4] += s0 * sp[0x14]
             [shell+0x15e8] += s0 * sp[0x18]
             return 1

So it advances a vec3 at `+0x15e0..+0x15e8` along the joint's second row, scaled by a common float — an
accumulator, not a placement. **UNREAD:** `0x3fb9bc`, `0x3fc750`, `0x4a0f00`, the PIC pointer's contents
(it is copied into the matrix slot before the joint call overwrites it, so its values may not matter), and
**whether this slot is called once or every frame** — which decides whether the vec3 is a velocity being
integrated or a one-off offset. That last question cannot be answered from this function; it needs the
base's dispatcher.

---

## 4a. The base's dispatcher — which slot it calls, and from where

Found by scanning the base's own band (`0x3fb000..0x3fe000`) for every INDIRECT CALL THROUGH A VTABLE SLOT
(`ldr rZ,[rX,#imm]` … `blx rZ`, and the wide `movw` form), rather than by assuming base00's slot names. 22
calls, using twelve distinct slots:

| base function | calls slots | note |
|---|---|---|
| `0x3fb048` | `+0x158`, `+0x160`, `+0x164` | `+0x158` is the base's own `0x3fd2d8` |
| `0x3fb158` | `+0x140` | |
| `0x3fb264` | `+0x130`, `+0x154` | |
| `0x3fb3a4` | `+0x130` | |
| `0x3fb9bc` | `+0x140`, **`+0x14c` the reader** | and shell02's `+0x13c` CALLS `0x3fb9bc` first, requiring 1 |
| `0x3fbaf8` | `+0x130`, **`+0x168`**, `+0x16c` | |
| `0x3fbe60` | **`+0x168`**, `+0x16c`, `+0x170` | |
| `0x3fc070` | `+0x158` | |
| `0x3fc698` | `+0x164` | `0x3fc698` is itself slot `+0x148` |
| `0x3fc750` | **`+0x15c`**, `+0x160` | and shell02's `+0x13c` calls `0x3fc750` in its body |
| `0x3fd2d8` | `+0x130` | `0x3fd2d8` is itself slot `+0x158` |
| `0x3fd9d8` | `+0x148` | |

Two things follow immediately. `0x3fb9bc` is the step that runs the READER, which is why shell02's `+0x13c`
calls it and refuses unless it returns 1 — so `+0x13c` runs after the parameters are read, consistent with
an init. And `+0x15c` (his jump-table routine `0xd30e30`) is reached from `0x3fc750`, which `+0x13c` calls —
so his two big overrides are on one path, not two.

### The per-frame entry — `0x3fbdc8` (vtable `+0x24`), READ

    push {r4, lr}; bl 0x4a1698
    drop the handle at +0x1600 if its unit left states 1..2  ([h+0xc] & 7, minus 1, >= 2 -> clear)
    the same for the handle at +0x1604
    state = ldrb [shell+4]
        == 0xfe  -> tail-call [vtable + 0x150]        the ENDING
        == 1     -> tail-call 0x3fbe60                the move
        else     -> return

and the state-1 move `0x3fbe60` runs, in order:

    bl 0x4a0f38 (zero -> 0x3fc04c)   bl 0x4a0f00 -> r5
    [vtable+0x168]                   <- shell02's 0xd30cec
    bl 0x3fc070                      <- which calls [vtable+0x158], the base's own 0x3fd2d8
    bl 0x3fc1c8      bl 0x3fc378
    [vtable+0x16c]   ...   [vtable+0x170]

**TWO THINGS SETTLED.**

**`+0x150` IS THE ENDING HERE, NOT THE LANDING.** It is tail-called from the state-`0xfe` branch. Base00's
`+0x150` is its landing, and §1 of this file carried that name over — wrong, and corrected here. This is the
slot-meanings trap arriving exactly where it was predicted, and the only reason it did not reach the code is
that nothing was implemented on the borrowed names.

**`+0x13c` RUNS ONCE, NOT PER FRAME.** The per-frame chain above never reaches it, and the dispatcher scan
over the whole base band finds calls to twelve slots — `+0x130`, `+0x140`, `+0x148`, `+0x14c`, `+0x154`,
`+0x158`, `+0x15c`, `+0x160`, `+0x164`, `+0x168`, `+0x16c`, `+0x170` — and **not `+0x13c`**. So the vec3 it
advances at `+0x15e0..+0x15e8` is a ONE-OFF offset computed on the init side, not a velocity integrated each
frame. That was the question blocking the implementation.

### 4c. The mode table, the ending, and the `_sh` vec

**`0xd30e30`'s jump table resolves to `0x169bbb0`, and it holds BEHAVIOUR CODES, not addresses** — the code
loads the word for `mode - 1` and compares it against 1, 2 and 3..4 rather than branching to it:

    mode   1  2  3  4  5  6  7  8  9 10 11 12
    code   1  1  2  4  1  1  2  2  2  3  3  4

**This cross-checks `+0x13c`'s guard.** That guard admits `mode - 1` where the bit is set in mask `0x33`,
i.e. modes 1, 2, 5, 6 — **exactly the code-1 modes**. Two independent structures, one a bitmask and one a
table, selecting the same set. Basarios's only mode is 1, so he is code 1 on both.

**`0x3fc610` (the `+0x150` the per-frame entry tail-calls on state `0xfe`) is an ENDING COUNTDOWN.** It
loads the float at `+0x15cc`, subtracts the frame delta `[r0+0x1c]`, clamps it against a literal, stores it
back, and when it reaches zero looks at the handle at `+0x1600`. That is base00's ending shape (wait for the
effects, with a cap) in this base's own fields — read here, not named from base00.

**`+0x1680` IS CONSUMED: `0x3fc814`, inside `0x3fc750`** — the base function `+0x13c` calls. So the `_sh`
vec his reader fills is read by the base, and the earlier "zero consumers anywhere" was **my scan's fault,
not a finding**. Two faults in it: it followed plain `b` targets, which are intra-function labels, dragging
base00's init into the closure and matching another class's fields at the same offsets; and it never
followed `movw rN,#off / add rX,base,rN / vldr [rX]`, which is the form this code uses. It was caught
because a positive control failed — `+0x168c` came back with zero sites when its consumer at `0xd30ca4` had
been read by hand. Corrected, the controls populate and `+0x1680` resolves.

### 4d. The step is the mover, and this base has no base00-style flags word

**`+0x158` (`0x3fd2d8`, the base's step) WRITES THE POSITION**: `str r0,[r5,#0x40]` / `#0x44` / `#0x48` at
`0x3fd310`, `0x3fd31c`, `0x3fd328`, and it calls `0x329c9c` / `0x329d04` — which shells.js already names as
the effect PLACEMENT pair ("a breath shell's effect is placed"). So on this base the per-frame step is what
moves the shell and places its effect, not the init. With `+0x13c`'s accumulator inert for Basarios (its
scale is the common float, `0.0`), the step is the only thing that moves his shell at all.

**`0xd30b84` and `0xd30e30` have NO direct callers anywhere in `.text`** — swept for every `bl`/`b` in the
image. They are reached only through their slots. `+0x15c` is reached from `0x3fc750` (which `+0x13c`
calls), so the chain is `+0x13c` → `0x3fc750` → `[+0x15c]`. **Who invokes `+0x13c` is still UNREAD**: it is
not called from the base band, so the caller is in the manager or the spawn path, outside `0x3fb000..0x3fe000`.

### 4e. THE FLAGS WORD IS `+0x1674`, and the step copies the position from `+0x15f0`

Read at the top of the step `0x3fd2d8`:

    cmp r3, #2
    movwne r0, #0x1674 / ldrne r0, [r5, r0] / andsne r0, r0, #4 / beq 0x3fd334
    [r5+0x40] = [r5+0x15f0]    [r5+0x44] = [r5+0x15f4]    [r5+0x48] = [r5+0x15f8]    [r5+0x4c] = 0

So **when the argument `r3` is not 2 AND bit 2 of `+0x1674` is set, the shell's position is copied from the
vec3 at `+0x15f0..+0x15f8`**; otherwise that copy is skipped and the step goes on at `0x3fd334`. That is
this base's flags word — `+0x1674`, not any `+0x15xx` — and §4d's INFERRED "no base00-style flags word" is
**WITHDRAWN**.

**Why the earlier scan missed it, which is the transferable part:** it searched for `tst`. This test is
`ands`. A flag test in ARM is `tst`, `ands`, `bics` or `teq` depending on whether the result is wanted, and
scanning for one mnemonic finds one quarter of them. The same scan should be re-run for the other three
before any "no flag test here" is trusted — including §4d's, whose other conclusion (the tests on `+0x4`,
`+0x20`, `+0x3c`, `+0x1c`, `+0xfe8`) is a partial list for the same reason.

Also read in the step, not yet interpreted: `+0x1648` gates the remainder (zero → jump to `0x3fd4b8`);
`0x43b08c` is called with `&(shell+0x1620)` and `&(shell+0x40)` on the stack and `shell+0x1610` in r1; the
floats at `+0x1610` and `+0x1618` are each multiplied by a literal and parked at `sp+0xf0` / `sp+0xf8`.

### 4g. What each link of the per-frame chain touches

Field and call inventory per function, from the dumps. This is what each link USES, not yet what it
computes — the arithmetic is the remaining read, and nothing below is transcribed on this alone.

| link | shell fields it names | calls | reading |
|---|---|---|---|
| `0x3fc070` | **`+0x15f0`, `+0x15f4`, `+0x15f8`**, `+0x15fc`, `+0x1640` | `0x43ac6c`, `0x43ac8c` | it handles the very vec3 the step then copies into `+0x40/44/48`, so **this is where the position comes from** |
| `0x3fc1c8` | `+0x1000/04/08`, `+0x1404`, `+0x158a/8c/90/94`, `+0x1620/24/28`, `+0x1630/34/38` | none | the motion block — `+0x1000..` is base00's anchor slot and `+0x1620..` the pair the step hands to `0x43b08c` |
| `0x3fc378` | **`+0x15e0/e4/e8`**, `+0x1600`, **`+0x1674`**, `+0x1428` | `0x329c9c`, `0x329d04` (the effect placement), `0x13ecba8`, `0x13ecc14`, `0x4a0f00` | the only consumer of the vec3 `+0x13c` accumulates, and where the EFFECT IS PLACED; also tests the flags word (`tst r0,#4` at `0x3fc540`) |
| `[+0x16c]` = `0x3fd01c` | `+0x15c8`, **`+0x164c`, `+0x1650`** | `0x4eeed0`, `0x4ef25c`, `0x807984`, `0x275dc0` | the `_snd` fields' consumer — see §4b |
| `[+0x170]` = `0x3fd4c4` | `+0x15d4` | `0x4a0f00` | ten instructions |

**This answers §4b's question.** `+0x164c` and `+0x1650` are named only by `[+0x16c]`, which calls
`0x4eeed0` / `0x4ef25c` / `0x807984` — a band this file has not read, but one that nothing else on the
chain touches. If those are the audio entry points then the `_snd` fields are non-visual and need no
implementation. **Still UNREAD**, and deliberately: "sound, therefore not visual" is the same shape of
reasoning as a borrowed slot name, and it is one call away from being settled properly.

**And it locates the init's output.** `0xd30b84` (`+0x13c`) advances a vec3 at `+0x15e0..+0x15e8`; the only
function on the whole chain that reads those three fields is `0x3fc378`, the one that places the effect. So
the init's accumulator feeds the effect's placement, not the shell's own position — which is a different
thing from base00, where the init computes the launch point.

### 4h. Every test of `+0x1674`, and `0x4eeed0` does NOT settle the `_snd` question

Re-scanned with all four flag mnemonics plus `cmp`, which is the check this base already forced once:

    0x3fd300  ands r0, r0, #4    the step — bit 2, the position copy (§4e)
    0x3fc540  tst  r0, #4        inside 0x3fc378 — bit 2 again, on the effect-placement link
    0x3fc9f0  tst  r0, #2        bit 1
    0x3fca50  tst  r0, #1        bit 0

So three bits of `+0x1674` are consulted in the base band — 0, 1 and 2 — and bit 2 twice, once to copy the
position and once on the link that places the effect. **What each arm does is UNREAD**; only the bit-2
position copy is transcribed above.

**`0x4eeed0` does not settle whether `[+0x16c]` is audio.** Its first instructions take four arguments,
dereference `r2 + 0x111c` through `0x4d5188`, test the result, then call `0x4dec04` and compare against 1.
Nothing in that head names a sound system, and going further is outside this file's scope. **So §4b stays
UNREAD**: the `_snd` fields are consumed by exactly one link and that link's callee is not identified. The
honest statement is "one read did not settle it", not "it is audio".

### 4f. Who invokes `+0x13c` — READ

Eleven indirect calls through slot `+0x13c` in the whole image, among them **`0x48b9dc`**, which is in the
unit manager's creation band — `0x48b884` is the enqueue shells.js already names ("created in that order
with `0x48b884(mgr, setup, 0, 0)`"). So `+0x13c` is invoked by the MANAGER when the unit is created, which
confirms "runs once" by a read rather than by its absence from the base band. The other ten sites
(`0x725d4`, `0x3ae570`, `0x3ae5d8`, `0x4ad014`, `0x4ad074`, `0x6be87c`, `0xbbb028`, `0xbbb038`,
`0x12ed380`, `0x12efa24`) are generic unit paths and are not read here.

**WITHDRAWN — see §4e: the flags word is `+0x1674`, tested with `ands`.** What this paragraph got right is
that no `+0x15xx` field is tested; what it got wrong is concluding there is no flags word.
Every `tst` in the base band was listed
with the field load that fed it, including the post-indexed `ldr rX,[rY,#imm]!` form that hid seven tests in
base00's init. The tests are on `+0x4`, `+0x20`, `+0x3c`, `+0x1c` and **`+0xfe8` twice** (`0x3fdcf4` `tst #8`,
`0x3fdf80` `tst #1`) — and none on a `+0x15xx` field. So the "flags word offset per base" question
(`+0x15e8` base00, `+0x15ec` base01, `+0x15e0` base13) may simply not apply here, and `+0xfe8` — the offset
base00 uses for the request's angle words — is used by this base too. **INFERRED, not READ**: absence of a
`tst` in one band is not proof there is no flags word, and the scan has not been run over the closure.

### 4b. Are the `_snd` fields visual?

`+0x164c` and `+0x1650` hold the `_snd` ints. Each is written by his reader and read at exactly one base
site — `0x3fd0a4` and `0x3fd224` — plus the base's own ctor-side stores at `0x3fb924` / `0x3fb92c`. Neither
consumer is read yet, so whether those two sites are the audio call remains **UNREAD**; if they are, the two
fields need no visual implementation. `+0x1680` (the `_sh` vec) has **zero** consumers anywhere in the base
band or his class.

## 5. Still to read, in order

1. The base's move at `+0x24` = `0x3fbdc8`, to fix what runs per frame and what runs once — without it
   `+0x13c`'s vec3 accumulator cannot be told from a velocity integration.
2. `0x4a2378`, against a reader whose fields are known.
3. `0xd30e30` (`+0x15c`) and `0xd30cec` (`+0x168`).
4. The base's landing `0x3fc610`: contact types, which `_ef` param each starts, any second generation.
5. The ctor: what it writes to every field, and the all-ones / zero defaults. No code in the bands searched
   (`0xd30000..0xd31400`, `0x3fc000..0x3fe000`) materialises this vtable; it is referenced from
   `0x149c5b8`, which looks like a descriptor rather than code. **UNREAD.**

## 6. Implementation state

**SUPERSEDED 2026-09-30 — implemented and drawing; see the UPDATE at the top.** What follows was the state before.

**Nothing implemented.** `SHELL_DATA.em004_00.shell02` exists with its one mode and its two action rows, and
those rows still take the generic path. No `params`, `init`, `step`, `end` or `landing` has been written,
and none should be until §5.1 gives the slots their meanings — a runtime built on base00's slot convention
would be another instance of running one class's code for another, which is the fault this monster has
already produced twice.
