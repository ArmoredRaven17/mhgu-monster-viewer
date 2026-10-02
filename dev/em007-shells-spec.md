# em007_00 / em007_04 shells — decode spec (Diablos, Bloodbath Diablos)

**And a correction that matters more than the spec:** the read I was sent to do was
*"the loop or table behind the seven slot sites in `0xd31c54..0xd320b4`"*. There is no shell-slot table
there. **`+0xcac4..+0xcadc` in `uEm007_00` are not shell ids at all** — see §1. The ids came from a
different place entirely (§2), and on the way a table turned up that answers the base-class question for
**every shell in the game** (§4).

---

## 1. WITHDRAWN: `+0xcac4..+0xcadc` are not shell slots in this class

I carried the offsets `+0xcac4..` over from `uEm004_00`, where they **are** the shell-id slots
(`0xd2e538` writes `0x6a/0x6b/0x6c` there; `0xd29560` reads `[unit+0xcacc]` into request `+0x04`).
In `uEm007_00` the same offsets hold **material-animation state**:

| offset | what it holds | written at |
|---|---|---|
| `+0xcac4` | the material object (`materialAt(unit,i)`, type field `(x>>22)&0xff == 51`) | `0xd31f28` |
| `+0xcac8` | clip handle `"Lv1_to_Lv2"` | `0xd31f3c` |
| `+0xcacc` | clip handle `"Lv2_loop"` | `0xd31f50` |
| `+0xcad0` | clip handle `"Lv2_to_Lv3"` | `0xd31f64` |
| `+0xcad4` | clip handle `"Lv3_loop"` | `0xd31f78` |
| `+0xcad8` | clip handle `"Lv3_to_end"` | `0xd31f8c` |
| `+0xcadc` | current slot/state index, `-1` = none | `0xd31e58` |

The five names are five consecutive strings at `0x1580622`/`0x158062d`/`0x1580636`/`0x1580641`/`0x158064a`
— each exactly at the previous one's end+1, in the order the code loads them, which is the control that the
PIC resolution landed right rather than near.

**The consumer closes it.** Those handles are read back at `0xd37148`..`0xd373d4` and passed to
`0xb09ae8` `setMatClip(slot)` / `0xb09a3c` `clearAllSlots`, with `+0xcac4` as the material. A
name-to-handle lookup whose results go to a slot-setter is a material-clip animation, not a shell spawn.

**Nothing shipped from the bad label** — `docs/render/shells.js` has no `em007` entry, so the error stayed
in my notes. It is recorded here and in `rom-map.md` so it is not re-derived.

**The boundary this implies:** `+0xcac0` is a *shared* enemy field (200+ uses in this class, and
`uEm004_00`'s spawner reads `[+0xcac0]+0x24` too). `+0xcac4` onward is **derived-class private**, and
means something different per monster class. Corroborated by two classes; not proven for all.

**This block is Bloodbath's alone** — gate `0xd31e48`: `ldrb [+0xb5f5] / cmp #4 / bne`. It is also a real
render feature nobody has listed: Bloodbath's hide progresses **Lv1 to Lv2 to Lv3 to end** through material
clips. Flagged for the walk; not part of this spec's shell work.

**Trap, the same family as the post-indexed `sb` one:** `0xd31e4c` is `ldrb r0,[sl,r0]!` — **pre-indexed
with writeback**, so `sl` becomes `&unit+0xb5f5`. The later `ldrb r0,[sl]` at `0xd31f9c`/`0xd31fcc`/
`0xd31fd0` look like three different fields and are all the same variant byte.

---

## 2. The ids — read from the code, offset-free

The method that does not depend on any field offset: `0x48b884` is the spawn submit
(`uEm004_00`'s known-good path reaches it at `0xd295b8` with request `+0x04` = id, `+0x08` = raw mode).
Six call sites in `uEm007_00`. The ids are **literals in code**, not a slot table:

| id | class | base | resource | spawned at |
|---|---|---|---|---|
| `0x70` | `uShellEm007_04_01` | **base01** | `0x89c3` | `0xd367dc`, `0xd36998`, `0xd36a2c` |
| `0x71` | `uShellEm007_04_01` | **base01** | `0x89c4` | `0xd36730`, `0xd36870`, `0xd36904` |
| `0x72` | `uShellEm007_04_07` | **base07** | `0x89c5` | `0xd41d84`, `0xd41e30`, `0xd41ed8` |

**`0x70` is Diablos's and `0x71` is Bloodbath's — one class, two resources**, exactly the Basarios/Gravios
pattern. From the gate at `0xd366e4`: `ldrb [+0xb5f5] / cmp #4 / bne 0xd367a4`; `0x71` is on the
variant-4 side, `0x70` past the branch target.

### The selector function `0xd366d4`

One function, argument `r1`, six tails — three ids times two variants — differing **only** in id and mode:

| `r1` | mode written to request `+0x08` | variant 4 | otherwise |
|---|---|---|---|
| 1 | `0xb` = 11 | `0x71` @`0xd36714` | `0x70` @`0xd367c0` |
| 2 | `0xa` = 10 | `0x71` @`0xd368e8` | `0x70` @`0xd36a10` |
| 3 | `0xc` = 12 | `0x71` @`0xd36854` | `0x70` @`0xd3697c` |

`r1` outside 1/2/3 branches to `0xd36acc` (no spawn). **What calls `0xd366d4` with which `r1`, and from
which action, is UNREAD** — that is the next read, and it is what decides which of modes 10/11/12 the
viewer must drive.

**Two request shapes, both submitted through `0x48b884`:**
- `0x3fa2bc(0x40)` — **0x40 bytes**, terminator `0xffff` at `+0x3c`. Used by all six `0x70`/`0x71` sites.
- `0x402014(0x30)` — the 0x30-byte shape already documented, `0xffff` at `+0x2e`. Used by the `0x72` sites.

The published "request layout is 0x30 bytes" holds for the second only. **Which fields the extra 0x10
bytes carry is UNREAD.**

`0x72` sits inside a body that exits unless the variant is 4 (`0xd41bb0` `cmp #4 / bne 0xd41fec`), so
**`0x72` is Bloodbath-only**, and its mode is `[sl+4]` / `[sl+0xc]` / `[sl+0x14]` `+ r6` — a table read,
**UNREAD**, not a literal.

**Position for the `0x70`/`0x71` sites is UNREAD.** The vec3 at request `+0x10/+0x14/+0x18` is filled from
registers loaded by `ldr` instructions that my filter dropped from the listing. Do not assume owner
position here just because shell02 did it that way.

---

## 2a. The actions behind modes 10 / 11 / 12 — READ

**The selector's entry is `0xd366dc`, not `0xd366d4`.** Nothing in the binary references `0xd366d4` — it is
the function's float literal pool (`0xd366bc..0xd366d8` holds 0, 80, 102, 96, 278, 36, 234, 62). I had
picked the earlier address arbitrarily when I started the sweep. Five callers, all inside **one** function
`0xd35a94`, em007's shell/effect update.

### CORRECTION: it dispatches on the current MOTION, not the action

I first published this as an action→mode table. It is a **motion**→mode table.

`bl 0xb0944` = `ldrh [unit+0x4b4]`, and `+0x4b4` is the **current motion id** `(list<<8) | motion`, not the
action id. **Proof:** `setMotionC` (`0xafe8c`) calls `0x726cc`, which compares `[+0x4b4]` against
setMotion's `r1` — and `r1` is `(list<<8)|motion`. The motion player writes it (`0x72ca00`, `0x72d264`).
The action pair is a different pair of fields entirely: `[+0x73e0]` group and `[+0x73e1]` index (Effects'
read of `0xd32ce0`).

I inferred `(status<<8)|index` from the *shape* of the key bands. The tell I ignored: em007 has status-10
actions (the horns are `(10,0x14)`) and there is no `0xa` band — while lists 0–3 is exactly what an LMT
holds.

So the five tables in `0xd35a94` are four **motion** tables plus one **action-index** table:

| table | key | entries |
|---|---|---|
| `0xd35bb8` | motion list 0, `M4..M46` | 43 |
| `0xd35d2c` | motion list 1, `M1..M19` | 19 |
| `0xd35ad4` | motion list 2, `M1..M27` | 27 |
| `0xd35cb4` | motion list 3, `M3..M21` | 19 |
| `0xd36510` | **action index** `[+0x73e1] - 0xe`, indices `0xe..0x32` | 37 |

That last one is the same `cmp #0x32` Effects read for group 6. It reaches no shell spawn.

### The answer — clips, which is what Render drives

Attributed by **walking the branches from each case entry**, because the blocks interleave (`0xd35c90`
branches out of one case body into another's address range; treating "the range between two table targets"
as a case body put four of the five in the wrong case).

| clip | mode | shell | frame |
|---|---|---|---|
| **L0 M24** | 11 | `0x70` Diablos / `0x71` Bloodbath | **58** |
| **L0 M33**, **L0 M43**, **L0 M46** | 12 | same | **2** |
| **L1 M1**, **L1 M4** | 10 | same | **2** |
| **L1 M17** | 11 | same | **2** |
| **L1 M19** | 11 | same | **2** |

Eight clips (my earlier report said nine — miscount). Three share one code block for mode 12, two share the
mode-10 path. **These are clips and frames, so they are drivable as they stand** — no action→motion step is
needed for the shells, which is the one good consequence of the field being the motion.

### Prober, and its control

`efx/agents/diablos-scratch/actprobe7.py` (new file; the `actprobe.py` beside it is still uEm001-configured
and untouched). Adapted for uEm007_00: vtable `0x17994cc` (from `vt7.py`), action main = vtable `+0x1f4` =
**`0xd32ce0`**, class band `0xd31a64..0xd46da0` (superset of the 38 in-band vtable overrides,
`0xd31b64..0xd46674`).

**Control passed:** `(10,0x14)` variant 4 → script `0x179a2a0` → **L3 M22** blend 4, matching Effects'
independent read of the horns. The action→script→motion chain is validated end to end.

### The frame gate, read to the comparison

Each spawn is guarded by `0xb09a4(unit, r1=0, r2=0, s0, s1)`, a wrapper that sets `r3=r2; r2=1` and tail-
calls `0x72714`. That is a generic motion query whose **`r1` is an opcode** (final jump table `0x728d0`,
13 arms). The arm actually used, `r1=0` at **`0x7294c`**:

    cmp lr,#0 / beq -> 0        ; the motion did not advance this tick
    r2 = 1 if [+0x4f4] >= s0    ; frame at END of tick
    r1 = 1 if [+0x508] <= s0    ; frame at START of tick
    tst r1,r2 -> both set -> return 1

So it returns 1 **iff the motion frame crossed `s0` during this tick** — a loop-aware per-frame trigger.
`+0x4f4` is the current frame, `+0x508` the frame at tick start.

**The frame is `s0`. `s1` is unused in this arm** — I first read `s1` as the frame and got 0.0 at four of
five sites; reading the callee's arm settled it.

### Still unread here

- **Which motion each action plays.** The action id is read; the action→motion mapping for em007 is not,
  and `dev/notice-marks.md` has the generic prober for exactly this. Without it these are action numbers,
  not clips.
- The sub-state table `0xd36510` (`[unit+0x73e1]`) reaches no shell spawn, but it is 37 entries of
  something and `+0x73e1` is unidentified.
- `0x72714`'s other 12 arms, and `r2`'s effect (`0xb0968` passes `r2=0`; these sites pass `r2=0` into the
  wrapper, which forces `r2=1` on the inner call — so `+0x13b4` is selected, not `+0x13b8`).

---

## 2b. The reader for `0x70` and `0x71` — ONE reader, id-switched

`0x70` and `0x71` are the **same class** `uShellEm007_04_01`, so there is **one** reader, not two.

**base01 confirmed a third way.** Vtable `0x179a978`, extent `0x170` = 92 slots (next vtable `0x179aae8` =
`_04_07`). Against `uShellEm004_sp_01` (the established base01): **89/92 identical, and the three
differences are the same three slots** as Basarios's — `+0x004` (dtor), `+0x014`, `+0x14c` (the reader).
Against `uShellEm011_sp_01`, also base01 per the table: 88/92. So vtable comparison, the shell table's
word1, and the override signature all agree.

Reader = `+0x14c` = **`0xd46770`**.

### It switches on the shell id inside the class

    0xd46778  bl 0x4a0ecc      ; r5 = THE SHELL'S GLOBAL ID
    0xd467d4  cmp r5, #0x71
    0xd467d8  bne 0xd468d8     ; -> the 0x70 (Diablos) tail

`0x4a0ecc` is `r0 = [obj+0x136c]; if (r0) r0 = [r0+4]; else r0 = 0x19d` — the shell's id out of its param
holder, defaulting to **the same `0x19d` unset sentinel** uEm004_00 writes into its slots. So one class
serves both monsters with **different field maps**, which no other shell in this decode has done.

After the compare, `r5` is reused as `-1` (`movw r1,#0xffff / sxth r5,r1`) and passed as `r2` to every
later accessor.

### Destination map

| | both | `0x71` Bloodbath only | `0x70` Diablos only |
|---|---|---|---|
| `getEffect(0,-1)` | → `+0x15c8` | | |
| `accA(_hit, 0, -1)` | → `+0x15d8` | | |
| `+0x15ec` bit 0 | **cleared** (`bfc #0,#1`) | | |
| `getInt(0)` | read | → **`+0x15e4`** (the joint) | → flags **bit 2** |
| `getInt(1)` | | → flags **bit 2** (`0x4`) | → flags **bit 11** (`0x800`) |
| `getInt(2)` | | → flags **bit 3** (`0x8`) | → flags **bit 7** (`0x80`) |
| `getInt(3)` | | → flags **bit 11** (`0x800`) | — |
| `getInt(4)` | | → flags **bit 7** (`0x80`) | — |
| `getFloat(0)` | | → `+0x15f0` | → `+0x15f0` |
| `accVec(0)` | | → `+0x1608` | → `+0x1608` |
| `accVec(1)` | | → `+0x160c` | **absent** |

Every bit is `!= -1`, i.e. `cmn r0,#1 / bfc / orrne`. On Diablos's path `getInt(0)`'s value is **not** stored,
so `+0x15e4` keeps base01's ctor `-1` — **no joint**, the same arm Basarios's shell01 takes.

**This reader DOES build `0x800`, on both paths.** `dev/em004-shell01-spec.md` §4 said the `init011`
`0x800` refusal could be lifted because em004's data never reaches it, and that *"if a later monster's
reader does build `0x800`, the refusal is still correct."* **This is that monster**, and Bloodbath's mode
003 actually sets it (below). So base01's `0x800` arm is now a prerequisite, not a hypothetical.

### The `_sh` file layout — READ from its serializer, and the earlier version corrected

The mode files are `FUP` resources, **type hash `496f8f22`**. The hash is not built inline anywhere, but the
magic is, at `0x3cb140`, inside the FUP serializer at **`0x3cb120`**. It writes, in order:

    "FUP\0"                                   (0x824bac, u32)
    2                                         version
    [obj+0x64]  nInt                          (0x824a70, u32)
    [obj+0x68]  nFloat
    [obj+0x6c]  nVec
    nInt   u32   from [obj+0x70]
    nFloat f32   from [obj+0x74]              (0x824c94)
    nVec   vec   from [obj+0x78], memory stride 0x10, THREE floats written per entry

So the header is five words and **word2 = nInt, word3 = nFloat, word4 = nVec**.

**CORRECTION to what I published earlier.** My first version of this section said word2 was *"3 (constant
across all files seen; NOT a count)"* and put nFloat/nVec at words 3/4. The field positions were right;
**word2's meaning was wrong**, and the reason is a plain reading error: I took word2 from em007_00's file and
called it constant, while for em007_04 I had only ever printed the file from word 3 onward. **em007_04's word2
is 5, not 3** — which is exactly the five ints its reader calls `getInt(0..4)` for. The "em007_04's file is two
words short of its header" finding I reported was my arithmetic against a header field I had not read for that
file. There was never a discrepancy in the data.

**Control, now non-circular and broad:** with all three counts read from the header,
`5 + nInt + nFloat + 3*nVec == fileWords` holds for **920 of 920 `_sh` files across 40 monsters' arcs**, zero
mismatches. The earlier "consumed == length" check was an identity because `nInt` was derived from the length;
this one derives nothing.

**No published value changes.** Re-deriving every file from its own header reproduces exactly what §2b's
tables already state — em004 shell01's ints `[0,0,-1]` and `[-1,-1,0]` (which independently match the original
ROM read), em007_00's `[0,-1,0]` with float `0.0` and vec `(0,0,100)`/`(0,0,0)`, and all eight of em007_04's
rows. **So `+0x15f0` and both vec destinations are no longer provisional**, and the flags were never affected.

**And the check is inherited by every other shell base.** All `_sh` files in every monster's arc carry the one
type hash `496f8f22` — em004_00 has 14, em005_00 16, em011_00 39 — and so does
`em007_04_actiontune.fup`, which is why the same reading worked on the tune data. One resource type, one
serializer, one schema. **So Basarios's shell00 `_sh` and Gravios's shell13 `_sh` are the same format and are
covered by the 920-file control**; nothing base-specific enters the file layout, only which indices the base's
reader asks for.

### Flags and fields, per mode

**`0x70` Diablos — `em007_00_shell01` ships exactly `sh010`/`sh011`/`sh012`**, i.e. only modes 10/11/12,
which is independent confirmation of the three modes the selector produces. ints `[0, -1, 0]` in all three:

| mode | flags `+0x15ec` | `+0x15f0` | `+0x1608` | joint |
|---|---|---|---|---|
| 10 | `0x84` | 0 | `(0, 0, 100)` | ctor −1 |
| 11 | `0x84` | 0 | `(0, 0, 0)` | ctor −1 |
| 12 | `0x84` | 0 | `(0, 0, 0)` | ctor −1 |

**`0x71` Bloodbath — `em007_04_shell01` ships `sh000/003/005/006/007/010/011/012`:**

| mode | ints | flags | `+0x1608` | `+0x160c` |
|---|---|---|---|---|
| 0 | `[-1,0,0,-1,-1]` | `0x0c` | `(-400, 0, 600)` | `(0,0,0)` |
| 3 | `[-1,0,-1,0,-1]` | **`0x804`** | `(100, 0, 200)` | `(0,0,0)` |
| 5 | `[-1,0,0,-1,-1]` | `0x0c` | `(600, 0, 100)` | `(0, -80, 0)` |
| 6 | `[-1,0,0,-1,-1]` | `0x0c` | `(-600, 0, 100)` | `(0, 80, 0)` |
| 7 | `[-1,-1,-1,-1,-1]` | `0x00` | `(0,0,0)` | `(0,0,0)` |
| 10 | `[-1,0,-1,-1,0]` | `0x84` | `(0, 0, 100)` | `(0,0,0)` |
| 11 | `[-1,0,-1,-1,0]` | `0x84` | `(0, 0, 0)` | `(0,0,0)` |
| 12 | `[-1,0,-1,-1,0]` | `0x84` | `(0, 0, 0)` | `(0,0,0)` |

`+0x15f0 = 0` and joint `+0x15e4 = -1` for every Bloodbath mode. **Mode 3 is the `0x800` case.**
Modes 5 and 6 are a mirrored pair (±600 x, ∓80 y) — left/right.

**GAP — now CLOSED in §2c** (all five sites found; the gap was a `bl`-only census missing tail-call submits).
Original wording kept: Bloodbath ships modes **0, 3, 5, 6, 7** as well, and the selector `0xd366dc` produces only
10/11/12. **Five spawn sites for his shell01 have not been found.** They are not in `0xd35a94`'s eight
motion cases. Until they are, five of his eight modes have no driver, and I am not claiming they are unused —
Diablos shipping exactly the three modes his code produces is the positive control that says the arc and the
code agree when both are read, so the five are almost certainly issued from somewhere I have not looked.

### The `0x40`-byte request — complete

Allocated `0x3fa2bc(size=0x40, r1=0x10)`. All six `0x70`/`0x71` sites fill it identically bar id and mode:

| off | value |
|---|---|
| `+0x00` | `[slot 0x1835c6c] + 8` = `0x174e640` — the request's type/vtable word |
| `+0x04` | **shell id** (literal `0x70` / `0x71`) |
| `+0x08` | **raw mode** (`0xa` / `0xb` / `0xc`) |
| `+0x0c` | the enemy unit (`r4`) |
| `+0x10..+0x18` | vec3 from **`[[enemy+0x1428] + 0x40/0x44/0x48]`** — the owner BLOCK's position |
| `+0x1c` | 0 |
| `+0x20..+0x28` | vec3 from **`[slot 0x1831a78] = 0x19176b0`** — see below |
| `+0x2c` | 0 |
| `+0x30..+0x38` | vec3 from enemy **`+0xfe8 / +0xfec / +0xff0`** (`stm ip,{...}`, `ip = req+0x30`) |
| `+0x3c` | `0xffff` |

Submitted by tail-call `0x48b884(r0 = [0x1831ccc] then [0x188b3b0], r1 = request, r2 = 0, r3 = 0)` at
`0xd36ac8`.

**Two differences from the published 0x30-byte shape, both worth Render's attention:** the terminator is at
`+0x3c` not `+0x2e`, and the position is read from **`[enemy+0x1428]+0x40`**, not the enemy's own `+0x40` as
em004's shell02 spawner does (`0xd2958c`). Do not carry that field over.

### Request `+0x20` is the engine's shared empty vec3 — WITHDRAWN as a blocker

I first wrote this up as a third consumer of an unresolved `.bss` block, carrying the wording over from
`em004-shell01-spec.md` §6. **That is stale and `rom-map.md` already corrects it** (rows at lines 134 and
295): slot `0x1831a78` → `0x19176b0` is **the engine's shared empty vec3** — reached independently from
`cmn.getVec`'s null path (`0x4a22e0`) and from em004's shell00 spawner, 1240 references, no writer, and in
`.bss` so **zero IS the value**, not an un-run initialiser.

So request `+0x20..+0x28` is simply **(0, 0, 0)**, deliberately. Nothing here is blocked, and the position
Render needs is `+0x10` = `[[enemy+0x1428]+0x40]`, which is fully read.

I grepped `rom-map.md` for `0x1831a78`, saw five hits, and did not open them — trap 18 in that file, which
I wrote two days ago about this exact failure. `em004-shell01-spec.md` §6 has been corrected too.

### Landing / second generation

**None of its own.** The override set is `+0x004`, `+0x014`, `+0x14c` — so every path slot including
`+0x150` is base01's, exactly as for Basarios's shell01. There is no per-class landing and no
shell-spawns-shell site in this class. What `+0x150` *is* in base01 remains **UNREAD** (the slot is the
landing in base00 and the ending in shell02's base, so the number alone means nothing), and that question is
base01's, not em007's — it is the one thing still standing between this and a landing-capable driver.

---

## 2c. Bloodbath's five missing modes — found, and the arc/code set now closes

**The gap was my census, not the ROM.** I had enumerated shell submits as `bl 0x48b884` only. The
`0x70`/`0x71` blocks submit by **tail-call `b`** at `0xd36ac8`, and so do two other sites. Re-run over `bl`
**and** `b`, any condition:

| | count | sites |
|---|---|---|
| `bl 0x48b884` | 6 | `0xd3d1a0`, `0xd413bc`, `0xd41de8`, `0xd41e94`, `0xd41f3c`, `0xd44ee0` |
| `b 0x48b884` | **3** | `0xd36ac8` (the known shared tail), **`0xd4179c`**, **`0xd447cc`** |

**Cross-check, and it balances exactly:** 14 allocator calls (`0x3fa2bc` ×11, `0x402014` ×3) against 9
submits, with the six `0xd36xxx` allocations funnelling into the one shared tail — 6+1+1+1+3+1+1 = 14 allocs,
1+1+1+3+1+1 = 9 submits, nothing orphaned on either side. That is what makes this census complete rather
than merely larger than the last one.

### All eight modes, with their sites

| mode | submit | id source | how the mode is written |
|---|---|---|---|
| **0** | `0xd413bc` | `0x71` | `stmib r1,{r0,r6}` — r0→`+0x04`, **r6→`+0x08`**, and `r6 = 0` from `0xd412d8` |
| **3** | `0xd4179c` | `0x71` | literal `mov #3` |
| **5** | `0xd447cc` | `0x71` | `cmp r6,#0 / mov r0,#6 / movweq r0,#5` — **5 when r6 == 0** |
| **6** | `0xd447cc` | `0x71` | the same site, **6 when r6 != 0** |
| **7** | `0xd3d1a0` | `0x71` | literal |
| **7** | `0xd44ee0` | `0x71` | literal — a **second** site for the same mode |
| 10 / 11 / 12 | `0xd36ac8` | `0x70`/`0x71` | selector `0xd366dc`, `r1` = 1/2/3 (§2) |

**0, 3, 5, 6, 7, 10, 11, 12 — exactly the eight `sh` files `em007_04_shell01` ships** (`sh000`, `sh003`,
`sh005`, `sh006`, `sh007`, `sh010`, `sh011`, `sh012`), with no mode in the code that the arc lacks and none in
the arc the code lacks. The set derived from the ROM equals the set shipped in the data, both directions.
That closes the gap §2b named.

Modes 5 and 6 being one site split on `r6` matches their data: their `+0x1608` vectors are the mirrored pair
`(600, 0, 100)` / `(-600, 0, 100)` with `+0x160c` `(0, -80, 0)` / `(0, 80, 0)` — left and right.

### Which actions drive them — coarse, and labelled so

All five sites sit in bodies reached from **group 7** (`[+0x73e0] == 7`, handler `0xd342dc`, 201 indices,
table `0xd34304`, 138 distinct arm targets, default `0xd34d80` used by 63):

| mode | group-7 index |
|---|---|
| 0 | `0x62` |
| 3 | `0x69`, `0x6b` |
| 5 / 6 | `0xa0`, `0xa1` |
| 7 (via `0xd44bf0`) | `0xc8` |
| 7 (via `0xd3cd40`) | ~35 indices, see below |

**Controls run on this mapping:** none of the reported indices is on the default arm (checked individually),
and each spawn function has only **1–2 direct callers** in the whole binary — so the arms reach them through
shared bodies, not through a leak in the walk.

**The caveat, which matters:** the arms are mostly `mov r1,#N / b <shared body>`, so many indices reach one
body with a **differentiating argument**. `0xd3cd40` (the first mode-7 site) has exactly one caller,
`0xd34d28`, which is itself reached from many arms each passing a different `r1` (`0x13`, `0x14`, …). So
"index X reaches the mode-7 spawn" is **reachability, not a guarantee that it fires** — there may be
`r1`-keyed guards inside the shared body that I have not read. The four specific mappings (modes 0, 3, 5/6
and index `0xc8`) are narrow enough to be usable; the ~35-index mode-7 list is a reachable set, not a driver
list, and should not be turned into 35 rows.

**Not read:** the clip and frame for each of these. Unlike the modes 10/11/12 path, these bodies are action
bodies (the first one opens on the `[[+0x1428]+0x1a1]` first-frame flag, the same shape Effects found in
`0xd3c1d4`), not motion-keyed cases, so they need the action→motion prober per index rather than a table
lookup. `actprobe7.py` is validated and ready for that.

### Two instrument failures worth recording

1. **A submit can be a tail-call.** Censusing `bl` only hid three of nine submits, including two whole
   spawn sites — and it is why §2b reported five modes as having no site. Any "census of calls to X" must
   accept `b` and every condition code.
2. **A conditional move after an unconditional one means two values.** `mov r0,#6 / movweq r0,#5` reads as
   mode 6 to a scanner that keeps the last plain `mov`; mode 5 exists only in the `movweq`. Likewise
   `stmib r1,{r0,r6}` writes `+0x04` **and** `+0x08` in one instruction, so a scanner looking for
   `str rX,[r1,#8]` sees no mode at all.

---

## 2d. The five modes' clips — and why they are Bloodbath's alone

`actprobe7.py` on group 7 (`[+0x73e0] = 7`), the six narrow indices from §2c. Control re-run in the same
session: `(10,0x14)` variant 4 → script `0x179a2a0` → L3 M22, still matching Effects' horns read.

| index | mode | clip | blend | start |
|---|---|---|---|---|
| `0x62` | **0** | **L9 M16** | 4 | 0 |
| `0x69` | **3** | **L9 M7** | 4 | 0 |
| `0x6b` | **3** | **L9 M7** | 0 | **80** |
| `0xa0` | **5 / 6** | **L9 M22** | 4 | 0 |
| `0xa1` | **5 / 6** | **L9 M23** | 4 | 0 |
| `0xc8` | **7** | **L9 M26** | 0 | 0 |

`0x69` and `0x6b` are the same clip entered at frame 0 and at frame 80 — one animation in two phases, both
spawning mode 3. `0xa0`/`0xa1` are two clips against the one site that writes mode 5 or 6 on `cmp r6,#0`,
which is the left/right pair their mirrored `+0x1608` vectors already implied.

### List 9 is real, and it is the answer to "why only Bloodbath"

`L9` is outside the 0–3 range `[+0x4b4]`'s dispatch bands showed, so I checked it rather than reporting it:

    em007_00.arc:  enemy\em007\em007_00\mot\em007_00_0 .. _3          (four lists)
    em007_04.arc:  enemy\em007\em007_00\mot\em007_00_0 .. _3          (Diablos's, shared)
                   enemy\em007\em007_04\mot\em007_04_9                (HIS OWN)

`em007_04_9.lmt` is 817,944 bytes, magic `LMT\0`, and its entry count (u16 at `+6`) is **31** — so motions
7, 16, 22, 23 and 26 are all in range. That is the control on the clip ids.

**So the five modes are Bloodbath-exclusive because their clips live in a motion list Diablos does not ship —
a gate in the data, not in the code.** Which also explains the one thing that looked wrong in the probe
output: **variant 0 and variant 4 return identical results for all six indices.** The action bodies are
shared and set L9 unconditionally; the deviant-only part is that only em007_04 has a list 9 to play. I would
otherwise have treated identical answers across differing inputs as a broken instrument — here it is the
measurement telling me the gate is elsewhere.

That is a general fact about deviants worth carrying: **a deviant's exclusive actions live in its own
high-numbered motion list**, and the shared class sets those clips unconditionally.

### Frames — READ. They are action-tune data, not literals

My earlier attempt looked for a `vldr`/`vmov` feeding `s0` and found an implausible `1.2`, nothing, or a
call at the function top. Reading the five blocks by hand instead of by window shows why: **`s0` is not set
by an instruction, it is RETURNED by a call.** Every one of the five has the same three-instruction shape:

    mov r0, r4
    mov r1, #<index>
    bl  0x6f618        ; -> s0
    mov r0, r4
    bl  0xb0974        ; the frame-crossed test, s0 = what 0x6f618 returned
    cmp r0, #1

`0x6f618` is a **virtual dispatch on the action-tune object**:

    r0 = [enemy + 0x75e4]      ; the action-tune object
    r2 = [[r0] + 0x4c]         ; vtable slot +0x4c
    bx r2                      ; tail-call (obj, index)

(The sibling `0x6f62c` uses slot `+0x44`, the int getter — which matches the `bl 0x6f62c` site whose result
went through `vcvt.f32.s32`.)

So the frame is **`actiontune.float[index]`**, per monster, from
`enemy\action_tune\em007_04_actiontune.fup`:

| mode | gate | tune index | **frame** |
|---|---|---|---|
| **0** | `0xd41308` | 27 | **116** |
| **3** | `0xd416b8` | 16 | **160** |
| **5 / 6** | `0xd446f4` | 116 | **154** |
| **7** (`0xd3cd40`) | `0xd3d0e0` | 137 | **24** |
| **7** (`0xd44bf0`) | `0xd44e20` | 124 | **10** |

The tune file: `FUP`, 158 words (632 bytes), `word2 = 14` ints, `word3 = 139` floats, `word4 = 0` vecs —
**5 + 14 + 139 = 158 exactly**, with both counts read from the header rather than derived from the length.
Floats start at word 19. The highest index used (137) is the second-to-last float in a 139-float array,
which is the kind of fit an off-by-N indexing would not produce.

**Mode 5/6's `0xb0974` at offset `0x18` is a TRIGGER, not a precondition** — PM's question. The function is
an action body, re-entered every frame, and the gate returns 1 only on the frame that crosses the threshold.
A frame test at the top of a per-frame body is exactly where a trigger belongs; the `0x18` offset was me
reading a per-frame function as if it ran once.

**One thing INFERRED, stated as such:** `0x6f618` is a virtual call and I read the dispatch, not the callee,
so "slot `+0x4c` is a plain indexed read of the FUP's float array" is not proven. What supports it: all five
values come out as plausible frame numbers (10, 24, 116, 154, 160) rather than nonsense, and the index range
fits the array's length. What would prove it: reading the `+0x4c` implementation on the tune class.

### Mode 7's other site — recorded, not enumerated

`0xd3cd40` (the second mode-7 spawn) has exactly one caller, `0xd34d28`, reached from roughly 35 group-7 arms
each passing a different `r1` (`0x13`, `0x14`, …). **Reachable from group 7's dispatch; clip per action
UNREAD**, and deliberately not enumerated — it is a reachable set, not a driver list.

---

## 3. For Render

1. `0x70` (Diablos) and `0x71` (Bloodbath) are **base01** — the same base as Basarios/Gravios shell01, so
   `READERS01` applies in shape. **Their readers have not been read**, so no `params` entry yet: base01's
   flags word is `+0x15ec` and which bits each reader builds is per-class (Gravios's `sp_13` proved a
   shared base does **not** imply a shared reader map). Do not reuse another monster's `params01`.
2. `0x72` is **base07** — a base nothing in the viewer implements yet. Two shells in the whole game use it
   (see `dev/shell-base-table.json`), both em007's.
3. Modes to expect: `0x70`/`0x71` modes **10, 11, 12**; `0x72`'s modes unread.
4. **Diablos (`0x70`) is now complete enough to wire.** base01 (implemented), reader read, flags `0x84` on
   all three modes, `+0x15f0 = 0`, `+0x1608` = `(0,0,100)` for mode 10 and `(0,0,0)` for 11/12, no joint,
   no landing override, request layout fully read, position `[[enemy+0x1428]+0x40]`. Clips and frames:
   L0 M24 f58 (mode 11), L0 M33 / M43 / M46 f2 (mode 12), L1 M1 / M4 f2 (mode 10), L1 M17 f2 and L1 M19 f2
   (mode 11). **The one prerequisite is base01's `0x800` arm** — his `getInt(1)` is `-1` in all three modes
   so he never sets the bit, but the reader builds it, so `init011` will still refuse unless the arm is
   transcribed or the refusal is narrowed to "the bit is set" rather than "the reader can build it".
5. **Bloodbath (`0x71`) is NOT ready**: five of his eight shipped modes have no spawn site found, and his
   mode 3 really does set `0x800`. Wire Diablos first.
6. `0x72` is base07 and nothing implements base07 — last in the order, deliberately.

---

## 4. The instrument: the table's **second** word is the base class

**Most of this table was already mapped, and I did not check first.** `dev/shell-map.md` (Render's read,
cited from `rom-map.md:55`) already has the layout — *"12 bytes an entry: class DTI, setup DTI, resource"* —
already resolves `0x6a`..`0x6f` to classes and resources, and already covers **242 shell classes across all
102 monsters**. My early grep reported `0x175c3e8` with one hit in `rom-map.md` and **I noted the count and
moved on instead of reading the row.** §2's ids were re-derived work; the agreement below is a
cross-validation, not a discovery.

**What is new is the use of word1.** No file uses the "setup DTI" as the base-class answer — `shell-map.md`
never mentions `EmBase` at all. That is the part that removes the vtable archaeology:

    word0 = the shell CLASS's DTI
    word1 = the SETUP-PARAM class's DTI  ->  THE BASE
    word2 = the resource id

Extent **412 entries** (indices 0..411). **A fully resolved copy already existed** and I did not find it
until after I had rebuilt it: `efx/agents/narga-shell-scratch/shelltable.json` — 412 entries,
`{id, cls{dti,name,size,parent}, setup{...}, res}`, **0 unnamed classes**. Use that file. The
`dev/shell-base-table.json` I generated had 84 unnamed classes and has been deleted rather than left to
compete with it.

It **agrees with my independent ROM read** on all three em007 ids (`0x70`/`0x71` base01, `0x72` base07),
which is the cross-validation that makes both trustworthy.

**Validated 4/4 against independent work** — every base I derived by slot-for-slot vtable comparison, the
table states outright: `0x6a` sp_00 → `cSetupParamEmBase00`, `0x6b`/`0x6d` sp_01 → `Base01`,
`0x6c`/`0x6e` sp_02 → `Base02`, `0x6f` sp_13 → `Base13`. It also states the **"one class, two resources"**
finding from its own fields: ids `0x6b` and `0x6d` carry the *same* word0 and word1 and differ only in
word2.

**So the vtable archaeology was rediscovering what this table says in one field.** For every shell still to
do, the base is now a lookup, and the vtable comparison becomes a *check* rather than the method.

### And it explains the `base13` mistake exactly

`uShellEm004_sp_00` and `uShellEm004_sp_01` have **the same `parentDti`** — `0x1885f78` = `uShellEmBase13`
— while behaving as base00 and base01 respectively (91/95 and 89/92). Two classes sharing one `parentDti`
while having different bases **proves `parentDti` is not the base field.** It agrees sometimes
(`uShellEm005_sp_02`'s parent really is `Base02`), which is why it was convincing.

**Use word1. Never `parentDti`.**

---

## 5. Named blockers

1. ~~Tigrex and em024–em057 are unnamed in the table.~~ **VOID — already solved, in this repo.** 84 of the
   412 entries have no class name in `build/arm/dti.json`, and I wrote that up as a blocker on Tigrex.
   `dev/shell-map.md` had already found the same gap (*"missing 68 of the 242 monster shell classes — a
   contiguous run between `uShellEm023_sp_00` (0x188c428) and `uShellEm058_sp_06` (0x188cd48)"*) and
   **already filled it**, by scanning the `MtDTI::MtDTI` registration sites at `0x7abef0` for the name
   string and the DTI's `.bss` address — 204 `_sp_` names over 69 monsters, agreeing with dti.json on all
   174 overlaps. So the names exist; `shell-base-table.json` should be regenerated against
   `shell-map.md`'s index rather than dti.json alone. That is the fix, not a blocker.
   **Tigrex is fully answered by the existing table** — no read needed:

   | monster | id | class | base | res |
   |---|---|---|---|---|
   | em032_00 Tigrex | `0xbd` | `uShellEm032_sp_00` | **base00** | `0x8a10` |
   | em032_00 Tigrex | `0xbe` | `uShellEm032_sp_01` | **base01** | `0x8a11` |
   | em032_04 Grimclaw | `0xbf` | `uShellEm032_sp_00` | **base00** | `0x8a12` |
   | em032_04 Grimclaw | `0xc0` | `uShellEm032_sp_01` | **base01** | `0x8a13` |

   One class per shell number, two resources — the Basarios/Gravios pattern again. base00 and base01 are
   both already implemented in the viewer, so Tigrex needs **no new base runtime**; what he needs is his
   spawn sites, modes and readers (`shell-map.md` records 18 modes for em032_04).
2. **What calls `0xd366d4`, with which `r1`.** Until this is read, modes 10/11/12 have no action.
3. The `0x40`-byte request's extra fields, and the `0x70`/`0x71` spawn position.
4. `0x72`'s mode table (`[sl+4/0xc/0x14]`).
5. The `0x70`/`0x71`/`0x72` readers, and base07's runtime (nothing in the viewer implements base07).
6. `materialAt` `0x88db14` and `findMatClipByName` `0xb08b44` are **names in my own tool table**, so
   INFERRED. The structure corroborates them (name lookup then `setMatClip`) but no callee was read.
