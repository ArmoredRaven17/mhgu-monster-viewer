# em005_00 shells — decode spec (Gravios)

Companion to `dev/em004-shell00-spec.md`. Gravios runs **the same enemy class as Basarios**
(`uEm004_00`), so a large part of the decode is already done and is marked **[settled by em004]**.
What is his own is marked **[Gravios]**. Anything unread is **UNREAD** and must not be defaulted.

---

## 1. Which shells are his

From `uEm004_00`'s own assignment function **`0xd2e538`** — it tests the em number and branches:

    ldrb r0, [unit + 0xb5f4]
    cmp  r0, #4  -> Basarios: 0x6a, 0x6b, 0x6c into slots 0/1/2, slot 3 left at the 0x19d sentinel
    cmp  r0, #5  -> GRAVIOS:  slot 0 left at 0x19d, then 0x6d, 0x6e, 0x6f into slots 1/2/3

So **Gravios has no shell00.** He has shell01, shell02 and shell13, and the arc agrees:

| shell | global id | class | resource | arc ef files |
|---|---|---|---|---|
| — | `0x19d` unset | — | — | no `shell00` folder |
| shell01 | `0x6d` | `uShellEm004_sp_01` | `0x89bb` | `ef001` only |
| shell02 | `0x6e` | `uShellEm005_sp_02` | `0x89bc` | `ef001`..`ef012` |
| shell13 | `0x6f` | `uShellEm005_sp_13` | `0x89bd` | `ef000`..`ef002` |

**The class names are crossed and mean nothing** — Basarios's shell01 is `uShellEm004_sp_01` too (id
`0x6b`, resource `0x89b9`), and his shell02 is `uShellEm005_sp_02` (id `0x6c`, resource `0x89ba`).
**One class, two resources, in both cases.** Whatever is built for Basarios's shell01 and shell02 serves
Gravios; only the resource differs. [settled by em004]

---

## 2. Base classes

| shell | base | how established |
|---|---|---|
| shell01 | **`base01`** | vtable `0x1799064`, 240/288 against `em003_00` shell01 on the old (too-long) comparison — **RECHECK over the true extent, 92 slots (`0x170`), the next vtable being `0x17991d4`** |
| shell02 | its own, the `0x3fcxxx`/`0x3fdxxx` base | Render's anchoring; base table `0x174e660`, shared by 19 classes |
| shell13 | **base13-shaped** | vtable `0x1799350` holds `0x405500` at `+0x168` — base13's `thrown13` — so Khezu's decoded base13 runtime is the candidate |

**shell01 — SETTLED. `base01`, 89 of 92 identical** over the true extent (vtable `0x1799064`, next vtable
`0x17991d4`, so 92 slots), veneers followed. Three overrides: `+0x004`, `+0x014`, and `+0x14c` his reader
`0xd308dc`. Against base00 it scores 74/92 and against base13 73/92, so the attribution is unambiguous.
The earlier 240/288 figure was computed with the 288-slot comparison that proved void for shell00 and is
withdrawn. **Note `+0x150` is NOT overridden — shell01 uses the base's landing**, unlike shell00, so it
needs no `LANDING` key. [Gravios + Basarios: one class, id `0x6d` vs `0x6b`]

**shell13 — SETTLED, AND `params13` DOES NOT APPLY.** His reader is `0xd3144c` and it builds the flags word
`+0x15e0` **differently from Khezu's**:

    Gravios 0xd314d4:  getInt(0) / cmn r0,#1 / bfc r3,#4,#1 / orrne r3,r1,#0x10
        -> BIT 0x10, set iff sh.ints[0] != -1

    Khezu   params13:  flags = 8 | (ints[0]!=-1 ? 0x80) | (ints[1]!=-1 ? 0x20) | (ints[2]!=-1 ? 0x40)
        -> always bit 3, plus 0x80 / 0x20 / 0x40 from three ints

Different bit, different index, and Khezu's unconditional bit 3 is absent. base13's ctor zeroes `+0x15e0`
(`0x404414`), so **Gravios's shell13 flags word is 0 or 0x10 — nearly empty**, where Khezu's is nearly full.
That is the opposite of the Basarios case and means **he takes the other arm from Khezu almost everywhere**.
base13's *structure* (`stepOrb`, `launch13`, `thrown13`) is still the right runtime; its *reader map*
(`params13`) is Khezu's and must not be reused.

His reader's other destinations, so far: `accB(0)` → `+0x15e4`; `getEffect(0)` → `+0x15c8`;
`0x4a2378(0)` → `+0x1690`; `0x4a2378(1)` → `+0x1694` (int, `vcvt.f32.s32`); `accA(0)` → `+0x15d8`;
`getFloat(0)` → `+0x15ec` **with a conditional ×1.5 when the owner exists** (`0xc1044`, `vmov.f32 s0,#1.5`)
— Khezu's has no such scale; `getFloat(2)` → `+0x15f4`; `getFloat(1)` → `+0x160c`.
**`0x4a2378` is NOT in the validated accessor set** — which array it reads is UNREAD, so `+0x1690` and
`+0x1694` are unattributed.

---

## 3. The spawners — shared code, per-monster branches

The shell02 spawn functions are **shared with Basarios** and the ROM branches inside them on the em number,
rather than having separate code. Four slot-2 sites, all in `uEm004_00`:

| function | clip | frame | mode written | whose |
|---|---|---|---|---|
| `0xd288b8` | L2 Motion[24] | 118.0 | 3 / 7 / 8 / 9 (two conditions, `0xd28a40`) | no em test — **Gravios's** |
| `0xd28bb4` | L2 Motion[27] | 142.0 | `sb`: **1** if em == 4, else recomputed from `[+0xcac0]+0x24` | **both**, see below |
| `0xd2a714` | L4 Motion[59] | 134.0 | `bfi r6, #5, 1, 31` → 10 or 11 | no em test — **Gravios's** |
| `0xd2a8c4` | L4 Motion[60] | UNREAD | `bfi r0, r5, 3, 1` → 4 or 12 | no em test — **Gravios's** |

Every one of those mode values (3, 4, 7, 8, 9, 10, 11, 12) exists in **em005_00's** `ef001..ef012` and
**none but 1 exists in em004_00's**. That is the corroboration that they are Gravios's. [settled by em004]

**The one with the em test, `0xd28bb4`, is the interesting one.** At `0xd28d6c`:

    mov  sb, #1              ; the mode, set BEFORE the test
    ldrb r0, [r4, #0xb5f4]
    cmp  r0, #4
    beq  0xd29294            ; BASARIOS takes this with sb = 1  -> his u 130

**Gravios falls through** and recomputes `sb` from the `[unit+0xcac0]+0x24` flag bits at `0xd28d7c`..
`0xd28d9c` (`ldrb r0,[r0,#0x24] / and r0,r0,#1 / beq` … `cmp r5,#1` …). **What mode he ends with is
UNREAD** — it is the one branch of that function I have not followed, and it decides which of his twelve
shell02 modes L2 Motion[27] fires. [Gravios]

Spawn position: `0xd2958c`..`0xd295a0` writes the **owner's `+0x40/+0x44/+0x48`** into the request's
`+0x10/14/18`. So shell02 takes the monster's live position and **does not depend on the uninitialised
`.bss` buffer that blocks Basarios's shell00**. [settled by em004]

---

## 4. Effect records

From the Effects session's independent read of the `.efl` row masks, cross-checked against the effect-id
literals in the class's arms:

| effect id | record | rows | note |
|---|---|---|---|
| `0x3e9` = 1001 | u 0 | `[3,4,5,6]`, scale 0.90 | pairs with 1007 |
| `0x3ea` = 1002 | u 30 | `[3,4,5,6]`, scale 0.90 | pairs with 1008 |
| `0x3ef` = 1007 | u 10 | `[3,4,5,6,10,11]`, scale 0.60 | **see §5** |
| `0x3f0` = 1008 | u 40 | `[3,4,5,6,10,11]`, scale 0.60 | **see §5** |

All four name **`em004_00_002`** — Basarios's `.efl` file. The sharing runs to the effect resource, not
just the clip. [settled by em004]

---

## 5. `u 10` and `u 40` — coded, never issued

Effect ids 1007 and 1008 are requested by selectors 6 and 7 of the shared routine `0xd2855c`, reached from
actions **`(7,0x3b)`** (stub `0xd2d05c`) and **`(7,0x3c)`** (stub `0xd2d06c`). Both stubs are real entries
in the status-7 table at `0xd2c944` — validated 8/8 against the six known stubs — and each arms **two**
hit records rather than one.

**Neither `em004_00_cmdtbl` (19104 bytes) nor `em005_00_cmdtbl` (20432 bytes) contains the action.**
Scanning both for the op-00 byte pattern `00 07 NN` finds every issued number and **zero** occurrences of
`0x3b` or `0x3c`.

**Method limits, unchanged and still owed:** that is a raw byte scan, not a walker parse, and no search has
been made for a code-side issuer. So `u 10` / `u 40` are **provisional refusals** — designed, coded, never
issued — not confirmed ones. [settled by em004]

---

## 6. What Basarios's reads already give Gravios

- **The request layout** (0x30 bytes: `+0x04` id, `+0x08` raw mode, `+0x0c` parent, `+0x10` and `+0x20`
  vec3s, `+0x2e` `0xffff`) and the fact that `+0x08` is the **raw** mode, confirmed against Khezu's
  spawner and the `ef000..ef010` file count.
- **The accessor identities** `0x4a2470` = `getInt`, `0x4a24f8` = `getFloat`, validated 8/8 and 3/3
  against Khezu's reader and `params13`.
- **The method**: base by vtable comparison over the derived extent; overrides with veneers followed;
  the reader's destination map composed by offset against the runtime's reader; the flags word bit by bit
  against the reference; the transitive closure of the path methods, not just the methods.
- **`0xd2e538`** as the id assignment, and the class-name trap.

## 7. What is his own and unread

1. shell01's base over the **true** vtable extent (the 240/288 figure is void).
2. shell13's flags word, bit by bit, against Khezu's `sp_13` — decides whether base13's runtime applies.
3. `0xd3144c`, his `sp_13` reader — destination map by accessor.
4. `0xd28bb4`'s **Gravios branch** at `0xd28d7c` — which shell02 mode L2 Motion[27] gives him.
5. `0xd2a8c4`'s frame (L4 Motion[60]).
6. Whether anything issues `(7,0x3b)` / `(7,0x3c)` from code rather than a command stream.
7. His attack records: `em005_00_attackdata` is byte-identical to Basarios's for every id the six fireball
   actions arm **except byte[30]**, which is `0x00` for every em005 record and `0x05` for every em004 one —
   a per-monster constant, not a per-attack value. What byte[30] means is **UNREAD**.
