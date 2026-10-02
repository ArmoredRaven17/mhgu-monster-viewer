# em004_00 / em005_00 shell01 — implementation spec

`uShellEm004_sp_01`, **one class serving both monsters** — Basarios id `0x6b` resource `0x89b9`,
Gravios id `0x6d` resource `0x89bb` (assignment `0xd2e538`). **Same vtable `0x1799064`, same reader
`0xd308dc`** — confirmed, not inferred: the id differs, the class does not. So this spec covers both;
only the arc files differ (Basarios `ef000`/`ef001`, Gravios `ef001` only).

---

## 1. The `0x800` throw is an ARTEFACT, not his data

`init011` threw *"base01 flag 0x800 not transcribed (no em001_00 mode sets it)"*. **His reader never sets
that bit.** The throw comes from computing his flags with **Rathian's** map.

`params011` is Rathian's `sp_01` reader `0xd0e6a0`, and it builds bit `0x800` as `ints[7] != -1`. His
`sh000` holds **three** ints, so index 7 is past the end — and *"an index past a file's end reads 0"*, so
`0 != -1` sets the bit spuriously. Feed his own map instead and the bit is simply never built.

**This is the same failure as shell00's**: a base's runtime carrying one monster's reader, applied to
another whose file is shaped differently. There it produced wrong numbers; here it produced a throw, which
is the better outcome — `init011` refusing by name is what made it visible.

---

## 2. His reader `0xd308dc` — a SHORTER Khezu

Read to its `pop` at `0xd3098c`. Beside Khezu's `0xd218c4` (`base01`, published in `shells.js`):

| | Basarios/Gravios `0xd308dc` | Khezu `0xd218c4` |
|---|---|---|
| `getEffect(_ef, 0)` | → `+0x15c8` | → `+0x15c8` |
| `getEffect(_ef, 1)` | **absent** | → `+0x15cc` |
| `accA(_hit, 0)` | → `+0x15d8` | → `+0x15d8` |
| `getInt(_sh, 0)` | flags **bit 2** (`bfc r2,#2,#1` @`0xd30934`) | flags bit 2 |
| `getInt(_sh, 1)` | flags **bit 3** (@`0xd3095c`) | bit 3 |
| `getInt(_sh, 2)` | flags **bit 7 / `0x80`** (@`0xd30980`) | bit 7 |
| `getInt(_sh, 3)` | **absent — returns here** | bit 11 / `0x800` |
| `getInt(_sh, 4)` | **absent** | bit 12 / `0x1000` |

**So his flags word can only ever hold bits `0x04`, `0x08`, `0x80`.** `0x800` and `0x1000` are
unreachable for him. The flags word for `base01` is **`+0x15ec`** (not `+0x15e8` as for `base00`, nor
`+0x15e0` as for `base13` — each base has its own).

Everything the reader does not write stays at the ctor's defaults (`0x3fa2f8`): no joint, no timer, no vec,
no radius — `+0x15e4 = -1`, `+0x15f4 = +0x15f8 = 500.0`, `+0x1604 = 900.0`, `+0x1608`/`+0x160c` the zero
vector, `+0x15fc = 1.0`, and **`+0x15ec = 0`** (`0x3fa370`). His reader is **sparser than Khezu's**, which
`shells.js` already describes as sparse.

### His flags per mode, from the arc

| monster | mode | `_sh` ints | flags |
|---|---|---|---|
| em004_00 | 0 | `[0, 0, -1]` | bit2 + bit3 = **`0x0C`** |
| em004_00 | 1 | `[-1, -1, 0]` | bit7 = **`0x80`** |
| em005_00 | 1 | *(read from his arc before use)* | — |

Rathian's for comparison: modes 0 `0x3`, 2 `0xc`, 6–9 `0x4`, 13/14/15/20 `0x1084`, 44–46 `0x1`.
Khezu's: modes 0/5/6 `0`, 1/2 `4`, 3/4 `0x1084`. **Neither monster reaches `0x800` either** — the bit is
built by both published readers but set by no mode in any of the three monsters' data.

---

## 3. Overrides — none on the path

Vtable `0x1799064`, extent **92 slots** (next vtable `0x17991d4`), veneers followed: **89/92 identical**
with `em003_00` shell01. Three overrides, and **only the reader is on the path**:

    +0x004  0xd30990   (dtor)          +0x014  0xd309a0        +0x14c  0xd308dc  HIS READER

Path slots compared directly — `+0x13c` init `0x3fa498`, `+0x148` `0x3fb264`, `+0x150` `0x3fb548`,
`+0x154` `0x3fb54c`, `+0x158` `0x3fb158`, `+0x15c` `0x3fb22c`, `+0x160` `0x3fb550` — **all identical to
Khezu's.** Against base00 he scores 74/92 and against base13 73/92, so `base01` is unambiguous.

**`+0x150` is NOT overridden** — he uses the base's, whatever it is. **I do not know what `+0x150` is in
`base01`.** I wrote "the base's landing" here from `base00`'s convention; Render has since shown that the
same slot is the **ending** in shell02's base, so a slot number means nothing across bases. What is
verified: he does not override it, so no per-class function is needed for it. Whether `base01` needs a
`LANDING` key at all depends on which slot is its landing — **UNREAD**.

---

## 4. For Render

1. **Add a `params` for `0xd308dc`** in the same shape as the `READERS01[def.reader]` table already used —
   three flag bits from `_sh` ints 0/1/2, the `_ef` param-0 handle, `accA(_hit,0)`, and **nothing else**;
   everything absent takes base01's ctor defaults listed above.
2. **The `0x800` refusal can then be lifted** — not because the arm was transcribed, but because his data
   never reaches it. If a later monster's reader *does* build `0x800`, the refusal is still correct.
3. **No landing key, no placement change**, and his only path override is the reader.
4. `u 161` is this shell's mode 0, ef `[[0, 161]]`, spawned by shell00's landing on contact type 1
   (`0xd3066c`, mode written at `0xd30708`) — see `dev/em004-shell00-spec.md` §7.

## 5. Unread

- Which base01 init tests read `+0x15ec`, and what the arms for bits `0x04` / `0x08` / `0x80` do. His word
  is sparse rather than full, so — unlike shell00 — he takes **fewer** arms than the reference, and the
  existing transcription is more likely to cover him. **Not verified.** The `0x800` throw proves only that
  `init011` checks the bits it cannot handle, not that it handles the ones it does.
- Gravios's `_sh` ints for his shell01 mode 1 (read from `em005_00.arc` before use).
- `accA(_hit, 0)` → `+0x15d8`: the `_hit` FUP attribution is by elimination (see `rom-map.md`) and no
  consumer has been read.

---

## 6. The no-joint arm `0x3fa8e4` — and it is the SAME blocker as shell00's

His reader never writes the joint, so `+0x15e4` keeps `base01`'s ctor **−1**, and the init takes the arm at
`0x3fa8e4`. What that arm does:

    ldr r1, [pc, #0x5cc]      ; lit @0x3faeb8 = 0x1438208
    ldr r1, [pc, r1]          ; pc 0x3fa8f4  ->  SLOT 0x1832afc
    ldr r2, [r1] … [r1,#0x3c] ; SIXTEEN words copied to sp+0x20..0x5c

So with no joint it loads a **4×4 matrix from a static pointer** — not the owner's matrix, not the owner's
position, and not the contact point the second generation was spawned at. All three of those guesses are
wrong; it is a table.

**And the table is in the same unresolved block as shell00's spawn point:**

    shell01 no-joint matrix : slot 0x1832afc -> 0x19177b0
    shell00 spawn position  : slot 0x1831a78 -> 0x19176b0

Both are `.bss` in the `0x1917xxx` block — the fourteen slots noted in `rom-map.md`, zero after main's
2,334 static initialisers, with Khezu's `ORB_SLOT_POINT` reproducing 18/18 as the positive control that the
instrument works. **So `u 161` and shell00's placement are blocked on ONE thing, not two**, and whatever
fills that block resolves both.

A zero 4×4 here would be a degenerate matrix, which the game cannot be using — the same argument that says
shell00's spawn point is not really the origin. Neither is proof; both point the same way.

**WITHDRAWN (2026-09-30).** The paragraphs above treat the `0x1917xxx` block as an unresolved gap and say
`u 161` and shell00's placement are "blocked on ONE thing". They are not blocked: `0x1831a78` → `0x19176b0`
is **the engine's shared empty vec3**, reached independently from `cmn.getVec`'s null path (`0x4a22e0`) and
from em004's shell00 spawner — 1240 references, no writer, in `.bss`, so **zero IS the value**. See
`rom-map.md`'s rows for `0x1831a78`. The §7 reading below (no-joint = owner position + offset x matrix, with
the empty matrix contributing nothing) is the correct one and already says so; §6's "blocker" framing predates
it and should not be built on. Kept, not deleted, because it was published.

---

## 7. What the zero matrix DOES — and it is not degenerate

The sixteen words copied to `sp+0x20..0x5c` are consumed at `0x3fa998`..`0x3fa9e0` as a **vector × matrix
multiply**: rows loaded from `sp+0x20/24/28/30/34/38`, a vec3 in `(r7, r0, sl)`, then
`vmul` / `vmla` / `vmla` per component — the classic `v.x*row0 + v.y*row1 + v.z*row2`.

**With the engine's shared empty 4×4, that contribution is ZERO.** So the transformed offset adds nothing.

**But the position does not come from the matrix.** At `0x3fa970`:

    movw r1, #0x1428 / ldr r1, [r8, r1]     ; the OWNER's unit block
    vldr s26, [r1, #0x40] / s28, [r1, #0x44] / s30, [r1, #0x48]

**the owner's own position, loaded separately.** So the no-joint path is *owner position + (offset × matrix)*,
and with the empty matrix that is simply **the owner's position**.

**So `u 161` spawns at the monster's own point**, which is what a landing-spawned ground effect should do —
not at the world origin. The zero matrix is the engine's way of saying "no joint transform", and the
position falls back to the owner.

**THE FINAL ADD — READ.** The fall-through computes the transformed offset into `s18/s2/s0`, branches to
`0x3faab8`, and there:

    0x3faab8  vadd.f32 s4, s0,  s26      ; offset + OWNER position
    0x3faabc  vadd.f32 s0, s2,  s28
    0x3faac0  vadd.f32 s2, s18, s30
    0x3faacc  str  r0, [r4, #0x4c]       ; w = 0
    0x3faad0  vstr s4, [r4, #0x40]       ; -> THE SHELL'S POSITION
    0x3faad4  vstr s0, [r4, #0x44]
    0x3faad8  vstr s2, [r4, #0x48]

So **position = owner position + (offset × matrix)**, stored to the shell's `+0x40`, and with the engine's
empty matrix that is the owner's position. No longer an inference.

**One arm he DOES take, still unread:** `tst r1, #4` at `0x3faae0` (on `[sl]`, the flags word stored at
`0x3fa988`) branches to `0x3faaf8`. **His bit 2 is SET** — mode 0's flags are `0x0C` — so he takes it. It
runs *after* the position is written, so the placement above stands, but what it then does is unread.
The `tst r0, #2` at `0x3fa98c` he does **not** take (bit 1 clear on both modes).

## 8. The hit records — they exist, one per mode (read 2026-09-30)

Asked by Render because base01's ctor leaves `+0x15f0` at 0, so a base01 shell that survives needs a hit slot.

`shell\em\em004_00_shell01` ships `_hit000`, `_hit001`, `_hitdata` (`HDS\0`, version `0x20160209`) and
`_hitsize` (`HTS\0`, version `0x20131015`). **The `_hit###` files are the same FUP type `496f8f22` as
`_sh###`**, so the schema read from the serializer at `0x3cb120` applies and the 920-file length control
covers them. Both are 24 bytes, `nInt=1 nFloat=0 nVec=0`, length exact:

    _hit000  ints [0]     ->  accA(_hit, 0) = 0     ->  +0x15d8 = 0 on mode 0
    _hit001  ints [1]      ->  accA(_hit, 0) = 1     ->  +0x15d8 = 1 on mode 1

`shells-em043.md` §50 confirms `0x4a23f4` is the **HitParam int** getter (and names `0x4a2378` as the
**SoundParam int** getter, which closes the INFERRED note in §5 and in `rom-map.md`).

So the `SHELL_DATA` shape is one hit slot per mode, indexed by the mode number. **The one-move life is not
the ROM's** — there are records to re-arm on.

**Word 2 of both the HDS and the HTS is `2`**, which on the FUP pattern is a count and matches the two modes;
I have **not** found the HDS/HTS serializer, so treat "two records" as corroborated-by-count, not read. What
actually re-arms the shell — the record's own duration or a re-trigger — is in HDS fields that are unread.

**And `+0x15f0` is not "the timer" across base01.** On em007's shell01 reader (`0xd46770`) it takes
`getFloat(0)`; on Tigrex's `sp_00` (base00) it takes `getFloat(2)`. The ctor default is base01's; the field's
meaning is per reader.

## 9. The `hitdata` records — READ (2026-09-30)

**The note had it first.** `E:/offline/decode/notes/shells-em001.md` §449 documents the format — *"HDS,
0x38-byte records from 0x10"* — and the record fields from their **consumer** (`0x168a68..0x168a84`):
**delay = s16 at record +0, duration = s16 at record +2**. It also documents the countdown
(`0x168d30` counts delay then duration by the frame step and clears the slot's byte +5 at the end,
`0x168e78`).

**Confirmed from the ROM side.** The HDS loader is `0x488fd0`: it checks the magic at `0x489004`
(`HDS`) and the version at `0x48901c` (**`0x20160209`**), stores the buffer at `[r4+0x64]`, then
`addne r0, r0, #0x10 / strne r0, [r4+0x68]` — so **the records base is file + 0x10**, exactly as the note
says. It is a whole-file loader with an indexed base, not a field-by-field serializer like the `.dtp`.

**Length control:** `em004_00_01_hitdata` is 128 bytes, `0x10 + 2 * 0x38 = 0x80` — exact for two records,
which independently confirms the `2` in word 2 that §8 could only corroborate.

| mode | hit record | delay | duration | delay+duration |
|---|---|---|---|---|
| 0 | 0 (`+0x10`) | **6** | **10** | 16 |
| 1 | 1 (`+0x48`) | **14** | **10** | 24 |

The rest of each record, read but **not interpreted**:

    record 0  s16 +0..+0x10 : [6, 10, 40, 2, 16, 12800, 5, 0, 0]
    record 1  s16 +0..+0x10 : [14, 10, 0, 6, 16, 0, 1, 0, 0]
    both      f32 +0x10..+0x38 : all 0.0 except +0x28 = 1.0

**The life is INFERRED, and the note says so explicitly.** `shells-em001.md` §449: *"these shells most
likely live about delay + duration frames (INFERRED); who runs `0x168d30` and when in the frame, and the step
it uses (the global `[0x211f764]+0x68` or the owner's speed by slot +0x31 bit 1): NOT READ — the viewer should
take the life as an input or the harness's move 1, flagged."* So 16 and 24 frames are the arithmetic, not a
read of the tick. Do not present them as measured lifetimes.
