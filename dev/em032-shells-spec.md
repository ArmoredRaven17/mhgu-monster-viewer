# HANDOVER — read this first

**BEFORE ANY ROM READ ON A MONSTER, OPEN `E:\offline\decode
otes\states-em<NNN>.md`.**
`dev/rom-map.md` §1b indexes that directory (82 files) and this file is referenced from it 51 times, and I
still re-derived from the ROM what was already written. Specifically: **`states-em032_00.md` §1.4 already
held the shell-id slot assignment** — *"vtable +0x158 = 0xe20334 registers, through 0x48b71c: variant 0 ->
class ids 0xbe (190) and 0xbd (189); variant 4 -> 0xc0 (192) and 0xbf (191) (e+0xcac4 / e+0xcac8,
0xe20340..0xe20368) ... listed for the shell agent"* — dated 2026-09-25, at the same addresses, with the
same pairing, written for this lane. §0 below re-derives it. The re-derivation is sound and its three
cross-checks are worth keeping, but it cost hours that the note would have cost minutes.
Also in `states-em007_00.md`: **"part 7 has no .dtp row"**, which is the answer to the array-C question
`dev/em007_04-parts-read.md` §2 leaves open.

**State: Tigrex's shell00 is placed in full (all 18 modes); his shell01 has one mode and is placed.** The
correction in §0 below inverts what §1 originally said and must be read before anything else in this file.

**Ordered next reads**

1. The three remaining clips' frames — L2 M29 (index 38), L2 M15 (103, 113), L2 M16 (104, 114). Their
   callers are `0xe2ea98`, `0xe2eac4`, `0xe2eaf0` and the `0xe316c8` group; the frame shape at the L2 M5
   caller is `0xb0968(unit, 0, 0, s0=frame, s1=0)` with the frame as a `vldr` literal, so look for that.
2. The frame handler's condition — what state fires `0xe21294`'s two shell01 mode-0 spawns. That is the row
   Effects would write, and it is a state row, not a clip row.
3. `listId 1` on Grimclaw's shell00 (§6a) — his `ef` files reference it and my `EffectLists` read returned
   only one path.
4. Grimclaw: the `sp_01` reader body `0xe35c50` (§3), then his 58 shell00 + 13 shell01 modes with list 9.
5. Deliberately skipped, per PM: the three in-shell submits (§5a) and the Grimclaw-only modes.

**Do not assume — each of these cost a wrong result in this decode**

- **base00's ctor writes the flags word 0; base01's writes −1.** Opposite polarity. `0x3f8a04` vs `0x3fa2f8`.
  A base00 reader *sets* bits into zero; a base01 reader *clears* bits out of all-ones.
- **A class has two code ranges.** `class-effects.json`'s is the span of its own vtable methods;
  `notice-marks.md`'s is wider. Use the wide one for reachability (16 submits, not 13), the narrow one only
  for "is this address one of the class's own methods".
- **This class dispatches on the ACTION INDEX** (`0xe32484`, `[+0x73e1]`, group 7), not on the motion id as
  `uEm007_00` does.
- **List 9 is Grimclaw's alone.** Any probe returning an `L9` clip is describing an action Tigrex cannot
  play; the gate is the absence of `em032_04_9.lmt` from his arc, not a code test.
- **The id slots are in the opposite order to the shell numbers** — §0.

---

## 0. CORRECTION: the id slots are swapped relative to the shell numbers

§1 below originally said `+0xcac4` is shell00 and `+0xcac8` is shell01, carried over from `uEm004_00` where
the slots run in shell order. **On this class they do not.** Read at `0xe20334`:

    0xe20340  mov    r2, #0xbe
    0xe20350  cmp    r0, #4              ; the variant byte [+0xb5f5]
    0xe20354  movw   r0, #0xcac4
    0xe20358  movweq r2, #0xc0
    0xe2035c  str    r2, [r4, r0]        ; +0xcac4 = 0xbe (Tigrex) / 0xc0 (Grimclaw)
    0xe20360  mov    r0, #0xbd
    0xe20364  movweq r0, #0xbf
    0xe20368  str    r0, [r4, r5]        ; +0xcac8 = 0xbd (Tigrex) / 0xbf (Grimclaw)

(`0xe202e8` writes the `0x19d` unset sentinel to both first, as `uEm004_00`'s ctor does.)

| slot | Tigrex | Grimclaw | class | folder | Tigrex modes | Grimclaw modes |
|---|---|---|---|---|---|---|
| **`+0xcac4`** | `0xbe` | `0xc0` | `sp_01`, **base01** | `shell01` | **1** (`sh000`) | 13 |
| **`+0xcac8`** | `0xbd` | `0xbf` | `sp_00`, **base00** | `shell00` | **18** (`sh000..017`) | 58 |

**The folder↔class mapping is confirmed by the accessor counts, not by the numbering:** `sp_00`'s reader
makes **four** `getEffect` calls and folder `shell00`'s `ef` files hold **four** pairs; `sp_01`'s makes **two**
and folder `shell01`'s single `ef` file holds **two**. That is an independent check and it is what makes the
swap safe to assert.

**Three contradictions resolve at once**, which is the real reason to believe it:

1. The volley helper `0xe2aacc` reads `+0xcac8`, and its mode table has **18 entries** — matching shell00's
   18 `sh` files exactly. Under the old mapping it was reading a one-mode shell with an 18-entry table.
2. The frame handler's two spawns read `+0xcac4` with mode **0** — and shell01's only file is `sh000`.
3. The mode-5 (`0xe30c88`) and mode-8 (`0xe32334`) sites read `+0xcac4` = shell01, which Tigrex ships one
   file for — but **Grimclaw's shell01 ships `sh005` and `sh008`**, and the mode-8 site is reached from
   group-7 indices 122/124, whose clips are **L9, i.e. Grimclaw's**. The two facts agree without being
   related, which is the strongest form this evidence takes.

Everywhere below, read "shell01" for `+0xcac4` and "shell00" for `+0xcac8`. §1's table is superseded by this
one; the bases, readers, vtables and extents in §1 are unaffected because those came from the vtables.

---

## 0a. Tigrex's shell00: all 18 modes placed

The volley (§5e) is **shell00**, and the mode is a **byte-table lookup**, not a literal. At `0xe2abe8`:

    r0 = [unit+0xcac0]                   ; via r6, pre-indexed
    r1 = [r0 + 0x29]                     ; THE SELECTOR
    r5 == 1 ? (cmp r1,#1 / bhi bail ; r2 = table A)    ; selector 0..1
            : (cmp r1,#3 / bhi bail ; r2 = table B)    ; selector 0..3
    r1 = r2 + r1*3 + r4                  ; r4 = the shot index (r1 or 2-r1)
    r0 = [r1]                            ; -> request +0x08, the MODE

The two tables are adjacent bytes:

    table B  0x169da90   selector 0 -> [0, 1, 2]    selector 2 -> [6, 7, 8]
                         selector 1 -> [3, 4, 5]    selector 3 -> [9, 10, 11]
    table A  0x169da9c   selector 0 -> [12, 13, 14] selector 1 -> [15, 16, 17]

**Together they cover modes 0..17 — every mode shell00 ships**, three per selector row, one per shot of the
volley at frames **68 / 72 / 76**. `r5` is the caller's `r2` (0 at the three L2 M5 sites, so table B there).

So the row set for shell00 is: clip **L2 M5**, three spawns at f68/f72/f76, modes
`table[selector*3 + shot]`, id `[unit+0xcac8]`, position a computed rotate(offset)+base, `+0x20` a u16 angle
from the shot index. **The selector `[[unit+0xcac0]+0x29]` is the one runtime value the viewer must supply**,
and what sets it is unread — that is the honest edge of this row set, and it is a single field rather than a
gap in the mechanism.


---

# em032_00 / em032_04 shells — decode spec (Tigrex, Grimclaw Tigrex)

EMC, 2026-09-30. Enemy class `uEm032_00`, vtable `0x17b8748`, code `0xe2031c..0xe34dd0`
(`efx/class-effects.json`, the validated file). Both monsters run this one class.

**Headline for Render: Tigrex's shell00 is the FIRST base00 shell to set flags bit `0x10`**, so it is the
first to take the raw-`setup+0x10` position arm — the arm `shells.js` line 2927 implements and that
`em004-shell00-spec` §3b records as never yet exercised. See §4.

---

## 1. The ids come from unit slots, not literals

| shell | id slot | Tigrex | Grimclaw | base | reader |
|---|---|---|---|---|---|
| shell00 | **`[unit+0xcac4]`** | `0xbd` | `0xbf` | **base00** | `0xe35410` |
| shell01 | **`[unit+0xcac8]`** | `0xbe` | `0xc0` | **base01** | `0xe35ac4` |

Read at e.g. `0xe218d4`: `movw r0,#0xcac4 / ldr r0,[r4,r0] / str r0,[r1,#4]` — the `uEm004_00` idiom, **not**
literals as em007 uses. So `+0xcac4`/`+0xcac8` are shell-id slots in *this* class, where in `uEm007_00` the
same offsets are material-clip handles: the per-class privacy of `+0xcac4` onward, for the third time.

Ids and bases agree with the global shell table's word1 (`efx/agents/narga-shell-scratch/shelltable.json`).

**Vtables and extents.** `sp_00` `0x17b9d48`, extent **0x17c = 95 slots** (next vtable `0x17b9ec4`, derived
with the getDTI-thunk test, controlled on em004's pair). `sp_01` `0x17b9ec4`; the same test gives the next
vtable at `0x17ba1c4`, i.e. **192 slots — an UPPER BOUND, not the extent**, because the test requires a DTI
thunk at `+0x14` and a non-reflected class in the gap would be skipped. Everything read here lies inside the
first 92 slots, so it does not depend on that bound.

**Bases.** `sp_00` scores **86/95** against `em004_sp_00` (next best base13 77) — base00. `sp_01` scores
**85/92** against `em004_sp_01` (next best base00 73) — base01. Overrides:

    sp_00: +0x000 0xe353fc  +0x004 0xe35400  +0x014 0xe35990  +0x028 0xe35820  +0x040 0x4a1810
           +0x13c 0x3f8b80 (base00's init, DIRECTLY -- em004's sp_00 reaches it through a veneer)
           +0x14c 0xe35410 (reader)  +0x150 0xe3557c  +0x170 0xe3587c
    sp_01: +0x000 0xe35ab0  +0x004 0xe35ab4  +0x014 0xe36050  +0x14c 0xe35ac4 (reader)
           +0x150 0xe35e00  +0x168 0x42200000 (40.0)  +0x16c 0x42820000 (65.0)

**`+0x168`/`+0x16c` hold floats where base01 has zeros** — data in vtable space, past the last method base01
uses. Flagged, not interpreted.

---

## 2. Ctor defaults, applied per base

- **base00's ctor `0x3f8a04`** writes the flags word `+0x15e8` = **0** (`mov r5,#0` at `0x3f8a14`).
- **base01's ctor `0x3fa2f8`** writes `+0x15ec` = **−1** (`mvn r4,#0`, store at `0x3fa308`).

This asymmetry is what inverted `em004-shell00-spec` §3, so it is stated per class here rather than assumed.
It matters directly below: base00's reader *sets* bits into a zero word, base01's reader *clears* bits out of
an all-ones word.

---

## 3. `sp_01`'s reader is a THREE-WAY id switch — and the two monsters do NOT share a body

    0xe35acc  bl 0x4a0ecc        ; the shell's global id
    0xe35ad0  cmp r0, #0xc0 / beq 0xe35aec -> b 0xe35c50    ; GRIMCLAW: a different body
    0xe35ad8  cmp r0, #0xbe / popne                          ; anything else: returns, reads nothing
    0xe35ae8  b 0xe35af8                                     ; TIGREX

So the entry is shared and the bodies are not. **`0xe35af8` is Tigrex's; `0xe35c50` is Grimclaw's and is
UNREAD.** PM asked whether Grimclaw could come in the same pass on shared readers — for shell01 the answer is
no, and that is a fact about the ROM rather than a scheduling choice.

### Tigrex's shell01 body `0xe35af8` — destination map

| accessor | → |
|---|---|
| `getEffect(0)` | `+0x15c8` |
| `getEffect(1)` | `+0x15d0` |
| `accA(_hit, 0)` | `+0x15d8` |
| `accA(_hit, 1)` | `+0x15dc` |
| `getInt(0..5)` | the flags word `+0x15ec`, bit by bit |

Flags, each `!= -1` (`cmn r0,#1 / bfc / orrne`), **into base01's all-ones default**:

    getInt(0) -> bit 7  (0x80)     getInt(3) -> bit 2  (0x4)
    getInt(1) -> bit 5  (0x20)     getInt(4) -> bit 3  (0x8)
    getInt(2) -> bit 11 (0x800)    getInt(5) -> bit 12 (0x1000)

Because the ctor default is −1, **every bit this reader does not name stays SET**. Only these six are
cleared-then-conditionally-restored. That is the opposite polarity from base00 and must not be crossed over.

**It builds `0x800`**, so base01's `0x800` arm is a prerequisite here as it is for Diablos.

---

## 4. `sp_00`'s reader `0xe35410` — and it SETS bit `0x10`

    0xe354ac  movw r0,#0x15e8
    0xe354b0  ldr  r0,[r5,r0]!
    0xe354b4  orr  r0,r0,#0x10        ; UNCONDITIONAL
    0xe354b8  str  r0,[r5]

With base00's ctor default of 0, **his shell00 flags word is `0x10`, plus `0x20` when `ints[0] != -1`**
(`getInt(0)` → bit 5 at `0xe354d4`). Nothing else touches it.

**Consequence.** base00's init (`0x3f8b80`) selects the position base on `tst r0,#0x10` at `0x3f8cb8`
(`dev/base00-init-placement.md` §2). Tigrex's shell00 has it **SET**, so he takes the arm at `0x3f8d88`:
**base position = the request's `+0x10/+0x14/+0x18` raw**, then the yaw-rotated offset. He is the first
base00 monster read to do so — Basarios's word is 0 and never reaches it — which means **`shells.js` line
2927's block stops being dead code and its bit-3 / bit-7 handling gets exercised for the first time.** Treat
that handling as unverified, per the note in `em004-shell00-spec` §3b.

And unlike Basarios, his request `+0x10` is **not** the shared empty vec3: at `0xe2190c` it is
`[r2+0x40/+0x44/+0x48]` with `r2 = [r7]` — a live object's position (r7's origin is UNREAD). So the arm
should produce a real placement for him.

Bit `0x20` set (when `ints[0] != -1`) additionally routes the **angle** vec `+0xfe8..+0xff0` from the
request's `+0x20` vec3 (`0x3f8c9c`), which `shells.js` line 3982 already models.

### Destination map

| accessor | → | note |
|---|---|---|
| `getEffect(0)` | `+0x15c8` | |
| `getEffect(1)` | `+0x15cc` | |
| `getEffect(2)` | `+0x15d0` | |
| `getEffect(3)` | `+0x15d4` | **four** effect handles |
| `accA(_hit, 0)` | `+0x15d8` | |
| `0x4a2264(0)` | `+0x15fc` | a sibling accessor of `accB`; **which array it reads is UNREAD** |
| `getInt(0)` | flags bit 5 | |
| `getFloat(0)` | `+0x15f4` | |
| `getFloat(1)` | `+0x15f8` | |
| `getFloat(2)` | `+0x15f0` | |
| `accVec(0)` | `+0x161c` | |
| `getInt(1)` | `+0x1660` | |
| `getInt(2)` | `+0x1664` | |

**Four `getEffect` calls, and the arc's `ef` arrays hold exactly four pairs** (§6) — an independent
agreement between the code and the data.

---

## 5. Spawn sites — 13 submits, and what is resolved

Instrument: `efx/agents/diablos-scratch/spawnread.py`. It tracks the request register from the allocator's
return, accepts `bl` **and** `b`, reports a conditional move as two values, handles `stmib`, and takes the
**last** store before the submit. **Controlled on `uEm007_00`**, where it reproduces every known id and mode
(including `6 or 5` for the `movweq` site) and returns UNRESOLVED — rather than a wrong number — for the
three table-sourced modes.

**13 submits, all `bl` (no tail-calls in this class), 15 allocations.**

| submit | function | id | mode |
|---|---|---|---|
| `0xe21968` | `0xe21294` | shell00 | **0** |
| `0xe21d04` | `0xe21294` | shell00 | **0** |
| `0xe22a34` | `0xe22878` | shell00 | UNRESOLVED |
| `0xe2ade4` | `0xe2aacc` | shell01 | UNRESOLVED (0x30 request) |
| `0xe307cc` | `0xe305cc` | shell01 | UNRESOLVED (0x30 request) |
| `0xe30d34` | `0xe30998` | UNRESOLVED | **5** |
| `0xe30dfc` | `0xe30998` | UNRESOLVED | **6** |
| `0xe31020` | `0xe30998` | UNRESOLVED | **4** |
| `0xe310cc` | `0xe30998` | UNRESOLVED | **6** |
| `0xe31520` | `0xe313a4` | UNRESOLVED | UNRESOLVED |
| `0xe315d0` | `0xe313a4` | UNRESOLVED | UNRESOLVED |
| `0xe31634` | `0xe313a4` | UNRESOLVED | UNRESOLVED |
| `0xe323bc` | `0xe32018` | shell00 | **8** |

Every resolved mode (0, 4, 5, 6, 8) is inside shell00's 0..17 range, and shell01's only shipped mode is 0,
so the two `+0xcac8` sites are **probably** mode 0 — recorded as probable, not read.

**Dispatch: not yet read.** Whether these functions hang off the motion id (`[+0x4b4]`, as `uEm007_00`'s
`0xd35a94` does) or off the action pair (`+0x73e0`/`+0x73e1`) is the next read, and it decides whether the
rows are clips or actions.

---

---

## 5d. The group is 7, and the clips — with a finding that reshapes Tigrex

**The group.** The action main `0xe343f8` dispatches on `[+0x73e0]` (18 entries, table `0xe34418`), and
**group 7** → `0xe3447c` → `b 0xe32484`, the index dispatcher. So every shell spawn in this class is
`(7, index)`. Same status as em007's shell actions, reached by a different route.

**Probed** with `actprobe32.py`, control `(2,0x8)` → L0 M3 blend 16 re-run in the same batch:

| index | clip | blend | shell / mode |
|---|---|---|---|
| 7, 8, 9, 10, 11, 12, 58 | **L2 M5** | 8 | shell01 (`0xe2aacc`) — all one caller, `0xe2a8ac` |
| 38 | **L2 M29** | 8 | shell01 |
| 103, 113 | **L2 M15** | 12 | shell01 (`0xe316c8`) |
| 104, 114 | **L2 M16** | 12 | shell01 (`0xe316c8`) |
| 93, 99 | **L9 M4** | 4 | shell01 (`0xe305cc`) |
| 101, 102 | **L9 M12** | 4 | shell01 (`0xe305cc`) |
| 119, 120 | **L9 M5** | 4, start 60 | `0xe313a4` (ids/modes unresolved) |
| 122 | **L9 M15** | 4 | shell00 **mode 8** |
| 124 | **L9 M18** | 4 | shell00 **mode 8** |
| 36, 37, 59, 95, 97, 105, 106 | **no clip of their own** | — | the action plays nothing (the pattern `notice-marks.md` records for 49 of 94 ids) |

### Eight of these actions are GRIMCLAW'S, not Tigrex's

`L9` is outside the 0–3 range this class's clips otherwise use, so I checked it rather than reporting it:

    em032_00.arc:  enemy\em032\em032_00\mot\em032_00_0 .. _3        (four lists)
    em032_04.arc:  those four (shared)  PLUS  em032_04\mot\em032_04_9

`em032_04_9.lmt` is 546,432 bytes, version 67, **20 entries** — so M4, M5, M12, M15 and M18 are all in range
(M18 is the second-to-last, the same tight fit list 9 gave on em007_04).

**So indices 93, 99, 101, 102, 119, 120, 122 and 124 play clips only Grimclaw ships**, exactly as
`em007-shells-spec` §2d found for Bloodbath: the shared class sets the L9 clip unconditionally and the gate
is the absence of the list in Tigrex's arc. **This is the second monster pair where the deviant gate is in
the data**, which promotes it from an observation about em007 to a pattern.

### What that leaves Tigrex

- **shell00 mode 8** is reached only from indices 122/124, both L9 → **Grimclaw-only**.
- **shell00 modes 4/5/6** are reached from 95/97, which **play no clip** → not clip-drivable.
- **shell00 mode 0** comes from the frame handler, state-driven (§5b).
- **shell01** (his one mode) is reached from the L2 indices — **7/8/9/10/11/12/58 (L2 M5), 38 (L2 M29),
  103/113 (L2 M15), 104/114 (L2 M16)** — and these are Tigrex's own.

So of Tigrex's 18 shell00 modes, the ones this pass can place are **mode 0 (state) alone**, and his shell01
is drivable from four distinct clips. That is consistent with `shell-map.md` recording **7 unwired** for
em032_00 and is the first explanation of why.

**Seven indices reaching one clip through one caller** (`0xe2a8ac`) is the identical-answer shape trap 23/29
warns about. Here it is a shared body: the caller is literally the same instruction for all seven, so one
clip is the honest reading, and the per-index difference must be the shell **mode**, which is UNRESOLVED for
`0xe2aacc`. Not a broken measurement, but also not seven distinct rows.

### Frames: NOT read

I have not read the frame for any of these. On em007 they came from the action-tune object
(`0x6f618` → `[enemy+0x75e4]` vtable `+0x4c`, index → float) and em032_04 ships an actiontune file, but I have
not confirmed the gate at these sites is the same shape. **Named, not assumed.**

---

## 5e. Tigrex's shell01 — the volley, frames read

**It is not frame-gated where it spawns.** `0xe2aacc` is a **helper with 12 callers**; the gate and the shot
index are in each caller. The pattern, three times in one action body:

    0xe2a9d0  vldr s0,[pc,..] = 68.0      vldr s1,[pc,..] = 0.0
    0xe2a9e4  bl 0xb0968(unit, r1=0, r2=0)          ; frame gate
    0xe2a9ec  cmp r0,#1 / bne
    0xe2a9f4  mov r1,#0  / mov r2,#0 / mov r3,#0
    0xe2aa00  bl 0xe2aacc                           ; the shell01 helper
    ... the same at 0xe2aa04 with frame 72.0 and r1=1
    ... the same at 0xe2aa38 with frame 76.0 and r1=2

**So it is a three-shot volley at frames 68, 72 and 76.** `0xb0968` is `mov r3,r2 / mov r2,#0 / b 0x72714`,
i.e. the same motion query as `0xb0974`/`0xb09a4` with its own argument shape; `s0` is the frame and `s1` is
0.0 here.

`r1` is **not** the shell mode — the helper checks `cmp r1,#2 / bhi` (so 0..2) and uses it as the shot index,
mirrored by the caller's `r3`: `rsbne r4, r4, #2` gives **`r4 = r1` or `2 − r1`**. `r4` then feeds the
request's `+0x20` u16 **angle** (`0xe2adc4`), so the three shots differ by angle from one clip.

### The request (0x30-byte, `0x3f883c`)

| off | value |
|---|---|
| `+0x00` | `[PIC]+8`, the request's vtable |
| `+0x04` | **`[unit+0xcac8]`** — shell01's id (`0xbe` Tigrex / `0xc0` Grimclaw) |
| `+0x08` | **the mode, from `[sp+0xc]`** — see below |
| `+0x0c` | the enemy |
| `+0x10..+0x18` | a **computed** position: a rotation of an offset (`vmul`/`vmla` on s19/s28/s22 etc.) **plus** s21/s23/s25, i.e. rotate(offset) + base. Not a static, unlike em004's shell00 |
| `+0x1c` | 0 |
| `+0x20` | the u16 **angle**, from `r4` clamped against `0x5fff` with `0xe000` added when below (`0xe2adb0`..`0xe2adc8`) |
| `+0x24` | the caller's `r2` (0 at all three sites) |
| `+0x28`, `+0x2c` | 0 |
| `+0x2e` | `0xffff` |

### Clips

From §5d, the callers of this helper are reached by group-7 indices whose clips are **L2 M5** (7, 8, 9, 10,
11, 12, 58), **L2 M29** (38), **L2 M15** (103, 113) and **L2 M16** (104, 114) — all list 2, which Tigrex
ships, so all his own. The three frames above belong to the body behind the **L2 M5** indices; the other
three clips have their own callers (`0xe2ea98`, `0xe2eac4`, `0xe2eaf0`, and the `0xe316c8` group) whose
frames I have **not** read.

### The one blocker left on this row set

**The mode byte.** `+0x08` comes from `[sp+0xc]`, stored at `0xe2abf4` from `ldrb r0,[r1]` at `0xe2abe8`.
What `r1` points at there is **unread** — one more trace. Since Tigrex's shell01 ships only `sh000`, mode 0
is the likely value, but "the arc ships one file" is not a read of the instruction and I am not substituting
it. Until that byte is traced, the row has clip, frames, id, position rule and angle, and no mode.

`cmp r5,#1` at `0xe2abf0` (r5 = the caller's `r2`, which is 0 at all three sites) branches to `0xe2ac80`, so
the fall-through at `0xe2abf8` is **not** the path these three take — worth knowing before reading further
into that function.

## 6. The arc side

| | folder | lists | modes shipped |
|---|---|---|---|
| Tigrex shell00 | `shell\em\em032_00_shell00`, stem `em032_00_00` | `0: em032_00u` | **sh000..sh017 (18)** |
| Tigrex shell01 | `…_shell01`, stem `em032_00_01` | `0: em032_00c` | **sh000 only** |
| Grimclaw shell00 | stem `em032_04_00` | `0: em032_04u` | **58 files, sh000..sh073 with gaps** |
| Grimclaw shell01 | stem `em032_04_01` | `0: em032_04u` | 13 files, sh000..sh015 with gaps |

Note Tigrex's two shells use **different pels** (`u` for shell00, `c` for shell01) while Grimclaw's both use
`em032_04u`.

Tigrex shell00's `ef` arrays (four pairs each, matching the four `getEffect` calls):

    ef000-002, ef012-014 : [(0,0),  (0,30), (0,30), (0,30)]
    ef003-005, ef015-017 : [(0,3),  (0,33), (0,33), (0,33)]
    ef006-008            : [(0,1),  (0,31), (0,31), (0,31)]
    ef009-011            : [(999, -1) x4]        <- the none-sentinel on all four
    shell01 ef000        : [(0,32), (999,-1)]    <- two pairs, two handles

So modes 9, 10 and 11 of shell00 request **no effect at all** — worth knowing before anyone treats a missing
row as a gap.

---

---

## 5a. The code band was too narrow — 16 submits, not 13

`efx/class-effects.json` gives `uEm032_00`'s code as `0xe2031c..0xe34dd0`; `dev/notice-marks.md` §Tigrex
gives `0xe2021c..0xe361a0`. **The census must use the wider one.** Over `0xe2021c..0xe361a0` there are
**16 submits (14 `bl`, 2 `b`) and 19 allocations**, where the narrow band found 13 and **zero** tail-calls.
The vtable's own in-band overrides span `0xe2031c..0xe34dd0`, which is why the narrow figure looked right —
it is the range of the *enemy class's* methods, and it stops short of code those methods reach.

The three extra submits are **above `0xe34dd0`, inside the shell classes' own code**:

| submit | containing function | request |
|---|---|---|
| `0xe3571c` | `0xe35624` | 0x30 |
| `0xe357fc` | `0xe35624` | 0x40 |
| `0xe36034` | `0xe35ea0` | 0x40 |

`0xe35624` lies between `sp_00`'s `+0x150` (`0xe3557c`) and `+0x170` (`0xe3587c`); `0xe35ea0` lies between
`sp_01`'s `+0x150` (`0xe35e00`) and `+0x014` (`0xe36050`). **That is what a second generation looks like** —
a shell spawning a shell from its own methods — but neither containing function is one of the vtable slots I
enumerated (I listed only slots differing from the base, so a slot equal to the base would not appear), their
ids are **UNRESOLVED**, and I have not traced which shell method reaches them. **Recorded as a strong
candidate for second generation, not as a finding.** It supersedes §7.8's "unchecked".

---

## 5b. The dispatch is the ACTION INDEX, not the motion id

    0xe32484  push {r4, lr}
    0xe32490  movw r0, #0x73e1
    0xe32494  ldrb r0, [r4, r0]      ; THE ACTION INDEX
    0xe32498  cmp  r0, #0x7c         ; 125 entries, 0..124
    0xe324a4  add  r1, pc, #4        ; table base 0xe324b0
    0xe324ac  add  pc, r0, r1

So Tigrex is **action-dispatched**, unlike `uEm007_00` whose `0xd35a94` dispatches on the current motion
`[+0x4b4]`. 112 distinct arms, default `0xe32ab8` (8 indices). **Which action group reaches this function is
UNREAD** — em007 has a group table (`0xd32ce0` on `+0x73e0`) ahead of its index tables and this is presumably
one group's arm, but I have not read the group level here.

### Action index → spawn

By reachability from each arm (default excluded; `bl` followed one level):

| shell / modes | action indices |
|---|---|
| shell01 via `0xe2aacc` | 7, 8, 9, 10, 11, 12, 36, 37, 38, 58, 59, 103, 104, 105, 106, 113, 114 |
| shell01 via `0xe305cc` | 93, 99, 101, 102 |
| shell00 modes 4/5/6 (`0xe30998`) **and** `0xe22878` | 95, 97 |
| shell00 mode 8 (`0xe32018`) | 122, 124 |
| `0xe313a4` (ids/modes unresolved) | 119, 120 |

### And two spawns are not action-driven at all

**`0xe21294` is `uEm032_00`'s vtable `+0x208` — the frame handler** (the same slot Effects identified as the
frame handler on `uEm036_00`). It has **no callers**, because it is called through the vtable. Its two
submits are shell00 **mode 0**, so **mode 0 is state-driven, per frame, not clip-driven** — a different row
shape from anything in the em007 work, and worth knowing before anyone looks for its action.

---

## 5c. Prober built and controlled

`efx/agents/diablos-scratch/actprobe32.py` — vtable `0x17b8748`, action main = vtable `+0x1f4` =
**`0xe343f8`**, band `0xe2031c..0xe34dd0`.

**Control passed:** `(2, 0x8)` → **L0 M3**, blend 16 — matching `dev/notice-marks.md`'s independently
documented Tigrex notice clip (L0 M3, loop). `(2, 0x9)` → L0 M9 for contrast, so the harness discriminates.

**The clips for the action indices above are NOT yet probed.** That is the remaining step before the rows are
buildable, and it is now a mechanical run.

---

## 6a. Effects' `cm200_040` question, answered from the arc

Effects placed `em032_00c` UNIQUE key 30 (`cm200_040`, unexported on both monsters) as probably shell-carried.
**It is not carried by any shell mode either monster ships.** The exhaustive set of `(pel, key)` pairs any
`_ef` file of either monster requests:

    em032_00:  em032_00c key 32 ;  em032_00u keys 0, 1, 3, 30, 31, 33
    em032_04:  em032_04u keys 0, 1, 3, 30, 31, 32, 33, 80, 81, 83, 90, 91, 93,
                              100, 101, 103, 110, 111, 113
               plus a SECOND LIST (listId 1) keys 70-79, 120, 122-125

`em032_00c` is referenced by exactly one shell file — Tigrex's shell01 `ef000` — and it asks for **key 32**.
So key 30 on the `c` pel is requested by **no shell mode**, and the `when: shell` reading does not hold here
through the `_ef` params. (Caveat: a shell could request an effect from code rather than its `ef` params; I
have not scanned for that.)

**And a gap of my own:** Grimclaw's shell00 `ef` files reference **listId 1**, but my `EffectLists` read
returned only one path (`em032_04u`) for that resource. So his shell00 has a second effect list I have not
resolved, and the keys 70-79 / 120-125 above belong to it. §7 gap.

## 7. Named gaps

1. **Grimclaw's shell01 reader `0xe35c50` is unread** — a separate body, not shared (§3).
2. **8 of 13 submits** have an unresolved id or mode (§5); the values are set outside the windows the
   controlled extractor can justify.
3. ~~The dispatch is unread~~ — **read (§5b): the action index.** What remains is the **group** level above it, and the **clips** for the 27 indices (the prober is built and controlled, §5c).
4. `0x4a2264` — the accessor feeding `+0x15fc` in `sp_00`; which array it reads is unknown, so `+0x15fc` is
   unattributed.
5. `r7` at `0xe21908`, i.e. what object supplies his shell00 request's position.
6. The flags per mode: the `_sh` files are in hand (18 + 1 for Tigrex) but not yet run through the two
   readers' maps, so no per-mode flags table here.
7. `sp_01`'s true vtable extent (192 is an upper bound), and `+0x168`/`+0x16c`'s floats.
8. Second generation: **three submits sit inside the shell classes' own code** (§5a), which is the shape of one, but their ids are unresolved and the reaching method is untraced.
9. Grimclaw's shell00 **second effect list** (listId 1), unresolved (§6a).
10. The **group** above the action-index dispatcher (§5b).
