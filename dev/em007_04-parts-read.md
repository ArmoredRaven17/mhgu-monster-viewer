# em007_04 parts — what the read establishes, and what it does not

EMC agent, 2026-09-30. Companion to Effects' `dev/em007_04-sever-note.md`, which asked for "EMC's read of
em007_04's own break/sever part table". **The assignment it wants is still UNREAD.** What follows is what is
established, each with its control, and a precise statement of what is missing — plus two false leads killed
so nobody follows them again.

---

## 1. The `.dtp` part file is now readable — schema from the serializer, not from the bytes

`enemy\dt_base\<em>_dtbparts.dtp` is parsed by the field-by-field serializer at **`0x54de0`** (found from the
two sites building the type hash `0x1339ecb`, at `0x54e14` and `0x556f8`). Every field's size and object
offset comes from the sequence of `0x824da8(stream, ptr, size)` calls in that function, so the schema is READ,
not inferred from the shape of the data:

    header  "DTP\0" + 0x1339ecb                              (8 bytes)
    scalars +0x8c..+0x9b  u8 x16
            +0x9c, +0xa0  u32 x2
            +0xa4..+0xbe  u16 x14
            +0xc0..+0xcc  u32 x4
            +0xd0         u8
    then ten arrays in file order, each gated on its count being non-zero:
      A n=[+0x8c] at [+0x64]  one block of n*4 bytes
      B n=[+0x8d] at [+0x68]  u32, u8, u32, u32                  (memory stride 0x10)
      C n=[+0x8e] at [+0x6c]  u8, u8, u16, u32, u8, u8, u8, u8   (memory stride 0x0c)
      D n=[+0x8f] at [+0x70]  u32, u32, u8, u8, u16, u8, u8, u16
      E n=[+0x90] at [+0x74]  u16 x5, u8 x5
      F n=[+0x91] at [+0x78]  16 bytes, u32, u32                 (memory stride 0x20)
      G n=[+0x92] at [+0x7c]  u8 x4
      H n=[+0x93] at [+0x80]  u8 x5                              (memory stride 5)
      I n=[+0x94] at [+0x84]  u16, u8, u8
      J n=[+0xd0] at [+0x88]  u32

**Control: the consumed length must equal the file length exactly, and it does for both monsters** —
em007_00 226/226 and em007_04 242/242, with the counts differing (A 3 vs 4, C 2 vs 3). Two files of different
sizes both landing exact is what makes the schema trustworthy rather than merely consistent.

Reader: `efx/agents/diablos-scratch/dtp.py` (new file). It prints `EXACT` or `MISMATCH` per file, so the
control runs on every use.

### What the two files hold

Identical between the monsters except where marked:

| | em007_00 | em007_04 |
|---|---|---|
| A (count) | 3: `0x10106`, `0x1020206`, `0x2010100` | **4**: `0x50506`, `0x2010100`, `0x20203`, `0x20204` |
| C (count) | 2 | **3** |
| C rows | `(0, 3, 0, 410.0, 0, 0xff, 1, 0)`, `(1, 1, 0, 200.0, 0, 0xff, 1, 0)` | those two **plus** `(2, 1, 0, 200.0, 0, 0xff, 0, 0)` |
| B, E, I, J | identical | identical |
| `+0xcc` | 3 | **6** |

C's third row is Bloodbath's extra piece, and its last-but-one byte is **0** where the other two are **1** —
the only field that distinguishes it. What that byte means is UNREAD.

---

## 2. The per-part record is at `[enemy+0x1428] + 0x3bc + part*12`

From `0x9d36c` (the break-level getter):

    r0 = [enemy + 0x1428] ; r0 += part*12 ; return byte [r0 + 0x3bc]

and `0x9d384` is the same with `+0x3bd`. So per-part records are **stride 12** in the `+0x1428` block.

**C's memory stride is also 0x0c**, which is suggestive — but **C has only 2 or 3 rows, so it cannot be the
table a part index of 7 addresses.** Either the runtime table is larger than C and filled from elsewhere, or
C is a different per-something list. **Not resolved, and not assumed.** I am recording the stride match as a
lead, explicitly not as an identification — a stride coincidence is the same weight of evidence as the two
counts the sever note already refused to build on.

---

## 3. Slot numbering IS established: slot 0 = tail, slot 1 = head

From the arc's own row order:

    em007_00:  row 8/9  em007_00_tail        (one staged piece)
    em007_04:  row 8/9  em007_04_tail        row 10/11  em007_04_head

**Control:** the sever note independently states that em007_00's `uEnemyOption` slot 0 resolves
`em007_00_tail`, and the tail is em007_00's first (and only) staged model in arc order. So first staged model
= slot 0, and for em007_04 that makes **slot 0 the tail and slot 1 the head**. Note the order is tail-then-head,
not the alphabetical head-then-tail a directory listing shows — read the arc rows, not a sorted list.

This is the piece of the sever note's open question that is now answered. **What is still missing is the
other half: which record pair is filed against which slot.**

---

## 4. `u 1034` — its requester is READ, and it is not on a part path

`u 1034` (`0x40a`) is requested at **`0xd3da74`**:

    0xd3da6c  mov r0,r4 / mov r1,#0 / movw r2,#0x40a / mov r3,r6 / bl 0x7db70

Sibling arms request `0x408` (1032) at `0xd3da54` and `0x40c` (1036) at `0xd3da94`, each followed by a small
constant handed to a shared tail at `0xd3dc94` (`0x81` for 1032, `0x84` for 1034).

These arms belong to an **18-way jump table** (`cmp r5,#0x11`, table base `0xd3d9f0`) switching on

    r5 = byte [enemy + 0x1054]        (0xd3d630)

**`+0x1054` is not a part index.** It is the same field base01's shell init reads at `0x3fab5c` to feed its
ground-snap query, and here it is compared against `0x49660`'s return before the switch. A field shared
between a ground query and a keyed-effect switch reads like a **surface/terrain id**, which would make
1032/1034/1036 per-surface effects — but that is INFERRED and `0x49660` is unread.

**This is in tension with the record side.** Effects derived `u 1034` → part 7 level 0 by inverting the
record, and the sever note reasons from its joint and offset. The requester I found is not indexed by part at
all. Both can be true only if the record's part field and the code that fires it are independent, so **one of
the two readings is describing something else.** I am not resolving that by preferring mine: the next read is
`0x49660` and `+0x1054`'s writer, and until then `u 1034`'s part attribution is **not settled**.

Also read: `u 1016` (`0x3f8`) is requested at `0xd421b4`. `u 1021` is **not** a literal anywhere in
`uEm007_00`.

---

## 5. Named refusal: which pair belongs to which piece

`900`, `901`, `905`, `906` are **not literals anywhere in `uEm007_00`** — I scanned the whole class range for
`mov`/`movw` of each. So the monster's own code does not name them; they are fired from the engine's
sever/part path, as the sever note's Rath-line observation already implies.

**I cannot assign the pairs to the pieces yet**, and the tempting completion — 900/905 for slot 0 (tail),
901/906 for slot 1 (head), by elimination from Diablos's single tail pair — is exactly the two-numbers
correspondence the sever note refused, one step removed. It is *plausible* and I am recording it as a
hypothesis with no read behind it.

**What would settle it:** the engine site that computes a sever record's key from a slot or part index. That
is the read I have not done.

### FALSE LEAD, killed — do not follow it again

I found `movw r1,#0x385 / add r1, sl, r1` at `0x341850`, `#0x389` at `0x341c14` and `#0x38a` at `0x341d08` —
a perfect "key = base + slot index" shape for 901/905/906, in three sibling blocks. **They are save-data
field registrations.** Resolving the name string each block stores at `[r0]` gives `mItemNum[115]`,
`mItemNum[119]`, `mItemNum[120]`: `0x385`/`0x389`/`0x38a` are indices into the player's item box, in a
reflection table of 148 such entries (`mEqLv`, `mItemType`, `mWepNo`, …). `900` (`0x384`) does not appear as a
literal anywhere in `main.text` at all.

The number matched, the instruction shape matched, and the meaning was unrelated. The string was already in
the block and cost one read to resolve.

---

## 6. What I have not done

1. The engine's sever-key computation (§5) — the one read that assigns the pairs.
2. `0x49660` and what writes `[enemy+0x1054]` (§4) — decides whether `u 1034` is a part effect or a surface
   effect, and therefore whether the sever note's part-7 reasoning stands.
3. Which runtime table fills `[enemy+0x1428]+0x3bc` (§2), and whether `.dtp` array C feeds it.
4. C's distinguishing byte (`+0xa`: 1, 1, **0**) — the only field separating Bloodbath's third row.
5. `u 1021`'s requester (not a literal in the class).
