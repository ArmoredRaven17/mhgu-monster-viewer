# em004_00 shell00 — implementation spec (Basarios, uShellEm004_sp_00)

For Render to implement. Every value carries its ROM address. Anything not read is marked **UNREAD** and
must not be filled with a default or with another monster's value.

Class: `uShellEm004_sp_00`, global shell id `0x6a`, folder `shell\em\em004_00_shell00`, 11 modes
(`ef000`..`ef010`). Reader `0xd304ac` (vtable `+0x14c`). Landing `0xd3066c` (vtable `+0x150`).

---

## 1. Base class

**`base00`**, by vtable slot-for-slot comparison over the table's **true extent**, veneers followed:

| against | identical | differ |
|---|---|---|
| `em003_00` shell00 (`base00`, stated in shells.js) | **91 / 95** | 4 |

**The extent matters and an earlier draft got it wrong.** `uShellEm004_sp_00`'s vtable is `0x1798ee8` and
the next vtable in the image is `0x1799064` — so it is **95 slots (`0x17c` bytes)**. A first pass compared
**288** slots, three times the table's length, and everything past `+0x17c` was reading *other classes'
tables*. That pass reported "256 / 288 identical, 32 differing"; both numbers are void. Render found this
independently, from the other side: shell00 `+0x428` and `+0x454` are the same words as shell02
`+0x13c` and `+0x168`.

**The four real overrides:**

    +0x004  0xd30498   (dtor)
    +0x014  0xd307f4
    +0x14c  0xd304ac   HIS READER
    +0x150  0xd3066c   HIS LANDING

Only the reader and the landing are on the shell's path, which is what the earlier draft concluded — those
two happened to lie below the cut. Every other path slot is byte-identical with Khezu's:

    +0x148 end 0x3f9ef4        cited shells.js:549 "base00's ... end +0x148"
    +0x158 state-1 move 0x3f9738  cited shells.js:410 "+0x158 the state-1 move ... -> base00 0x3f9738"
    +0x170 PER-FRAME ACCELERATION 0x3f9f98  cited shells.js:2762 "the per-frame acceleration +0x1020
           (base00 vtable +0x170 = 0x3f9f98)"
    +0x154 0x3fa07c   +0x15c 0x3f986c   +0x160 0x3f98f4   +0x164 0x3f9aec   +0x168 0x3f99e0
           — addresses verified identical to Khezu's; MEANINGS IN base00 UNREAD

**Two labels in an earlier draft were borrowed from `base13` and one of them was wrong.** I had `+0x170`
as "target slot" (base13's `0x405a60`, "the owner's target slot") and `+0x168` as "point" (base13's
`thrown13`). In `base00`, `+0x170` is **the per-frame acceleration** — the slot that turns the gravity
vector — and `+0x168`'s meaning here is simply unread. A slot number carries no meaning across bases
(see `rom-map.md`); `+0x150` is the landing in `base00` and the **ending** in shell02's base.

`dti.json`'s `parentDti` says `uShellEmBase13` and is **wrong for behaviour**; `+0x13c` differs as a value
(`0xd304a8`) but is a one-instruction veneer (`b #0x3f8b80`) to the same shared init.

---

## 2. Parameter table

The runtime's `params00` is a transcription of a **different** monster's reader (`0xe82304`, named on
`params00` itself). Its index map does not apply to Basarios and it requires a `cmn` block he has no file
for. The half that *is* shared is **runtime name → object offset**, fixed by base00's consumers:

    joint +0x15dc   flight +0x15fc   flags +0x15e8
    vz    +0x15f4   vy     +0x15f8   vec   +0x1610   gravity +0x161c

Basarios's reader `0xd304ac` (read to its `pop {r4, pc}` at `0xd30668`) maps those offsets to his own
`.sh` indices. Accessor identities were validated against a known answer — Khezu's reader `0xd220a4`
matches the file's `params13` **8/8 on float indices and 3/3 on int flag bits** — so `0x4a2470` is
`getInt`, `0x4a24f8` is `getFloat`.

| runtime name | offset | Basarios source | reader site | value(s) |
|---|---|---|---|---|
| `joint` | `+0x15dc` | `accB(0)` — accessor `0x4a2224`, a **different sub-object** (getter `0x489ea4`) | `0xd30514` | **−1**. Its null path `0x4a225c` returns `mvn r0,#0`, and `em004_00` has **no common FUP** anywhere in the arc. |
| `flight` | `+0x15fc` | `sh.floats[0]` | `0xd3052c` | **144.0** on every mode |
| `flags` | `+0x15e8` | built from `sh.ints[1]`, see §3 | `0xd30594` | see §3 |
| `vz` | `+0x15f4` | `sh.floats[3]` | `0xd305f4` | **35.0** modes 0–4, **48.0** modes 5–10 |
| `vy` | `+0x15f8` | `sh.floats[4]` | `0xd30610` | **0.0** modes 0–4 and 8–10, **−5.0** modes 5–7 |
| `vec` | `+0x1610` | `accVec(1)` — accessor `0x4a2584` | `0xd30644` | `(0,−50,10)` modes 0–4; `(−65,65,90)` modes 5,7,8,10; `(−10,65,90)` modes 6,9 |
| `gravity` | `+0x161c` | `accVec(2)` | `0xd3065c` | `(0,−0.4,0)` modes 0–4; `(0,−1.4,0)` modes 5–10 |

**`flight` is in frames.** `init00` copies it into the `+0x162c` timer; the step at `0x3f9760` reads
`+0x15fc`, then decrements `+0x162c` by the step delta (`vsub s0, s0, [r4+0x1c]`). 144 frames = 2.4 s at 60.

Offsets his reader also writes that have **no runtime name**:

| offset | source | reader site | value(s) | status |
|---|---|---|---|---|
| `+0x15ec` | `sh.ints[0]` | `0xd30550` | 5, −10, 5, −5, 0, 0, 0, 0, 0, 0, 0 | **no consumer found** — see §6 |
| `+0x15f0` | `sh.ints[2]` | `0xd30574` | 0,0,0,0,0, −35,−1,30, −35,−1,30 | **no consumer found** — see §6 |
| `+0x1600` | `sh.floats[1]` | `0xd305c0` | 0.0 every mode | read at `0x3fa39c` (end) — read/write **UNREAD** |
| `+0x1604` | `sh.floats[2]` | `0xd305d8` | 0.0 every mode | read at `0x3fa394` (end) — read/write **UNREAD** |
| `+0x1618` | `accVec(0)` | `0xd30630` | `(0,0,0)` every mode | **READ** at `0x3f9e10` in the point (`ldr r2,[r4,r2]`) |
| `+0x15c8 / +0x15d4 / +0x15cc` | `getEffect(0/1/2)` | `0xd304bc / d4 / ec` | the three ef handles | used by the landing |
| `+0x15d8` | `accA(0)` — accessor `0x4a23f4` | `0xd30500` | **UNREAD** | |

---

## 3. The flags word `+0x15e8` — CORRECTED 2026-09-30

**WITHDRAWN:** this section said *"base00's ctor writes `0xFFFFFFFF` at `0x3fa348`"* and concluded
`0xFFFFFFFE` / `0xFFFFFFFF`. **`0x3fa348` is in base01's ctor (`0x3fa2f8`)**, whose store at `0x3fa308`
(`movw r3,#0x15e8 / mvn r4,#0`) really does write −1 — but that is base01's object, not base00's. Citing one
base's ctor for another is the trap this decode has hit repeatedly, and it inverted every bit of this word.
The same paragraph also called `0x3f8aac` *"base00's landing"* and dismissed it; `0x3f8aac` is inside
**base00's ctor**, and it is the store that matters.

**READ:** base00's ctor is **`0x3f8a04`**:

    0x3f8a04  push {r4, r5, r6, lr}
    0x3f8a14  mov  r5, #0                  ; and mvn r6, #0 at 0x3f8a18 for the -1 fields
    0x3f8ab0  str  r5, [r4, #0x15e8]       ; THE FLAGS WORD STARTS AT ZERO

His reader then adjusts **bit 0 only** (`0xd30594`), and it is a read-modify-write that preserves every
other bit — `mov r3, r1` at `0xd305a8` copies the loaded word first:

    bl 0x4a2470            ; getInt(1)
    cmn r0, #1             ; == -1 ?
    ldr r1, [r2, #0x15e8]! ; the current word  (= 0, from the ctor)
    mov r3, r1             ; r3 = a COPY of it
    bfc r3, #0, #1         ; clear bit 0
    orrne r3, r1, #1       ; set bit 0 iff ints[1] != -1
    str r3, [r2]

`sh.ints[1]` is −1 on modes 0–3 and 5–10, and 0 on mode 4. So the flags word is:

    modes 0-3, 5-10 :  0x00000000
    mode 4          :  0x00000001

**Every other bit base00's init tests is zero for this shell** — `0x10`, `0x20`, `0x40`, `0x80`, `0x200`,
`0x2` — because the reader never builds them and the ctor zeroes the word. The only writer in base00's band
(`0x3f8000`..`0x3fa400`) is that ctor store; the other five hits are `tst` reads
(`0x3f8c60` 0x20/0x200, `0x3f93a4` 0x1, `0x3f9938` 0x40, `0x3f9cf0` 0x2, `0x3fa308` = base01's).

### Consequence: he does NOT take the `setup+0x10` branch

`dev/base00-init-placement.md` §2: base00's init selects the position base on `tst r0,#0x10`
(`0x3f8cb8`), and **bit `0x10` is clear on every one of his modes**. So the `bne` at `0x3f8d54` is not
taken, the init falls through to the joint test at `0x3f8d60`, and:

- joint `+0x15dc` == −1 → **base position = the OWNER's `+0x40/+0x44/+0x48`** (`0x3f8e20`)
- joint >= 0 → the joint matrix via `0xc15a4`

then the yaw-rotated offset is added at `0x3f9140`. **A driver that uses `setup+0x10` as the base is on the
wrong branch**, and that is what puts the shell at the world origin + `(0, −50, 10)`, below the floor.

`+0x15dc` is `accB(cmn, 0)` (`0xd30514`), read from the **common** FUP rather than the per-mode `_sh`; the
`accB` null path returns −1. **The joint's actual value is the one thing still to read** — it decides owner
position vs joint matrix, and both are correct behaviours, unlike `setup+0x10`.

## 3b. His placement, READ — and the two bits are different things

With the flags word at **0** (§3) and the joint at **−1**, base00's init places him as follows. Every step
is read; nothing here is defaulted.

**The joint is −1.** `+0x15dc` is `accB(cmn, 0)` at `0xd30514` — confirmed `bl 0x4a2224`, result stored to
`+0x15dc` at `0xd30520`. `0x4a2224` returns **−1** from `0x4a225c` (`mvn r0,#0`) when either `[obj+0x1384]`
is null or the lookup `0x489ea4` returns 0. **em004_00 ships no common FUP anywhere in its arc** (§2), so
that path is taken. Not inferred: the same null path is what made every other `cmn` read −1.

**So the branch is:**

    0x3f8cb8  tst r0, #0x10     -> CLEAR
    0x3f8d54  bne (not taken)   -> so NOT the raw setup+0x10 base
    0x3f8d60  cmn r1, #1        -> joint == -1, EQUAL
    0x3f8d64  beq 0x3f8da0
    0x3f8e20  ldr r0,[r8,#0x40] / str r0,[r4,#0x40]    (and +0x44, +0x48)

**base position = the OWNER's `+0x40/+0x44/+0x48`**, `r8` from `0x4a0f00`
(`[shell+0x136c]` → `+0x0c` → `+0x0c`).

**Then the offset is added** at `0x3f9140`..`0x3f9168`: `vldr [r4,#0x40] / vadd.f32 / vstr`, per component,
with the offset yaw-rotated through the sin/cos at `0x13ecc20`/`0x13ecc2c`. **Bit `0x80` is clear**, so the
`0xbe518` size scale at `0x3f9128`..`0x3f9130` does **not** apply. His offset is `(0, −50, 10)`.

**Net: the shell appears at the monster, displaced by a yaw-rotated (0, −50, 10), unscaled.** Not at the
world origin — which is what Effects' capture (y ≈ −50, floorY ≈ −1.4) was showing.

### Bit `0x10` and bit `0x20` are NOT the same selection

This is worth stating because the viewer models one of them correctly and the confusion is easy:

| bit | what it selects | ROM |
|---|---|---|
| `0x20` | the **angle** vec at `+0xfe8/+0xfec/+0xff0`: SET → the request's `+0x20` vec3; CLEAR → the owner's `[+0x50]`/`[+0x54]`, with `+0xfe8` forced to 0 when bit `0x200` is set | `0x3f8c68` → `0x3f8c9c` / fall-through |
| `0x10` | the **position base**: SET → the request's `+0x10` raw; CLEAR → the joint test, i.e. owner position or joint matrix | `0x3f8cb8` → `0x3f8d54` |

Both paths of the `0x20` test converge at `0x3f8cb0`, and `tst r0,#0x10` at `0x3f8cb8` is the last
flag-setting instruction before the `bne` at `0x3f8d54` — no call and no other flag write intervenes, so the
`0x10` result is what governs that branch.

### Clear-arm audit against the viewer (`docs/render/shells.js`)

Under a zero flags word **every** test takes its clear arm, so the question is which clear arms exist:

| bit | clear arm in the viewer | where |
|---|---|---|
| `0x1` | yes | `if (!(k.flags & 1))` — lines 2597, 3944 |
| `0x2` | yes | `if (!(k.flags & 2))` — line 3964 |
| `0x4` | yes | lines 3950, 3970 |
| `0x8` | set arm only, and the other site **throws** | line 2941; line 3980 refuses `flags & 8` |
| **`0x10`** | **NO CLEAR ARM** | line 2927 is `if (k.flags & 0x10){ … }` and implements only the SET path |
| `0x20` | yes | the ternary at line 3982 |
| `0x40` | yes | `if (!(k.flags & 0x40))` — line 3048 |
| `0x80` | set arm only; clear = no scale, which is the correct implicit default | lines 2945, 4370 |
| `0x100` | yes | line 2986 |
| `0x200` | yes | line 3982 |

**So the single missing arm is `0x10`'s clear path — the position base — and that is exactly the defect.**
The clear arms of `0x20` and `0x40` are both present, so the worry that the reference monster's
`0x20|0x40` word left them unexercised does not apply: they were written. `0x8`'s clear arm is also absent,
but its sibling site refuses by name rather than guessing, so it is a named gap rather than a silent one.

**For the next reader of `shells.js` line 2927:** that block **assumes a base01-style all-ones default.**
base00 words start at **zero** (`0x3f8a04`), so **no base00 monster read so far has taken this arm** — it is
untested code. The next base00 class whose reader actually sets bit `0x10` will be the first to exercise it,
and should treat its bit-3 and bit-7 handling as unverified rather than inherited.

Note the comment at line 2927 reasons from the withdrawn `0xFFFFFFFE`: it assumed this arm always runs for
him. With the flags at 0 it **never** runs, so that whole block is dead code for Basarios and its remarks
about bits 3 and 7 describe a class that has yet to take the arm.

## 4. The arms

**`0x20` SET — init `0x3f8c9c`:** `add r3, r6, #0x20 / ldm r3, {r1,r2,r3}` then `str r1,[r4,#0xfe8]` …
It reads **the request's `+0x20/24/28`** into the shell at `+0xfe8`.. What `+0xfe8` then drives is
**UNREAD**.

**`0x02` SET — point `0x3f9d2c`:** sets the angle value to 0 (`mov r0,#0`) and branches on `0x04`.
The **clear** arm (`0x3f9d00`, which he does *not* take) is the one that converts `+0x15f0` with
`0.5 + x * 182.0444` (`DEG_TO_U16`). So the second offset is not applied for him.

**`0x04` SET — point `0x3f9de8`:** `ldr r1,[r6] / str r1,[sp,#0x10]` — the point comes from `[r6]`.
**UNREAD:** what `r6` holds in the point function.
The **clear** arm (`0x3f9d3c`, not his) reads `+0x1614` as a pointer, substitutes a default literal vec3 at
`0x1437d24` when it is zero, scales by the monster's size (`0xbe518`), rotates by the owner's facing word
(`[+0x1428]+0x54`, × `0.0001` ≈ 2π/65536) and adds the owner's position `+0x40/+0x44/+0x48`.
**Consequence: `+0x1614`'s ctor default does not matter for Basarios** — he never reads it.

**`0x40` — step `0x3f9940`:** both he and the reference have it set, so the runtime's existing behaviour
applies. The arm itself is **UNREAD**; it is the one place a shared bit is set for both, so it is lower risk.

---

## 5. Placement and the spawn request

**`tst [shell+0x15e8], #0x10` at `0x3f8cb8` → SET → `0x3f8d88`:**

    ldr r0, [r6, #0x10] / str r0, [r4, #0x40]
    ldr r0, [r6, #0x14] / str r0, [r4, #0x44]
    ldr r0, [r6, #0x18] / str r0, [r4, #0x48]

**The shell's position is the request's `+0x10/14/18`, verbatim.** The joint path (`0xc15a4` at `0x3f8d70`)
and the owner-position path (`0x3f8da0`, which copies the owner's matrix `[r8+0xb0..0xec]` and position
`[r8+0x40..0x48]`) are both **not taken**. `joint = −1` is therefore true but irrelevant.

> The viewer's `init00` calls `jointMatrix(J, k.joint)` unconditionally. For Basarios that is the wrong
> branch, and with `joint = −1` the viewer's own rule falls back to gid 0 — the model root. This must be
> transcribed as the ROM's bit test, with the existing behaviour preserved for monsters whose bit `0x10`
> is clear.

**Request layout, built by `0xd283fc` at `0xd28480`..`0xd28518`** (0x30 bytes, allocator `0x3f883c`,
enqueued with `0x48b884`):

| field | value | site |
|---|---|---|
| `+0x00` | request vtable (`[lit 0xb0d794]` + 8) | `0xd284b8` |
| `+0x04` | global shell id from `[unit+0xcac4]` | `0xd284a4` |
| `+0x08` | **the mode**, raw (`r5`, the action's argument) | `0xd284a4` |
| `+0x0c` | the parent unit | `0xd284ac` |
| `+0x10/14/18` | vec3 from `[lit 0xb095a8]` → `[ptr+0/4/8]` | `0xd284c4`..`0xd284e8` |
| `+0x1c` | 0 | `0xd284f0` |
| `+0x20/24/28` | vec3 from `[lit 0xb09cc4]` → `ldm {r3,r5}`, `[ptr+8]` | `0xd284dc`..`0xd28508` |
| `+0x2c` | byte 0 | `0xd2850c` |
| `+0x2e` | `0xffff` | `0xd284c0` |

**Neither vec3 is indexed by the mode.** Both loads are fixed PIC pointers. One spawn point and one second
vector for all four modes `0xd283fc` spawns. **UNREAD:** the actual numbers at those two pointers — they
are runtime-relocated and I have not resolved them to values.

`+0x08` is the **raw mode**, confirmed against a known answer: Khezu's spawner writes
`stmib r1,{r0,r5,r6}` at `0xd19574` with `r5 = ORB_SLOT_MODE[slot] + (rank>1 ? 6 : 0)` — the table this
file already decodes — and Basarios's arc holds exactly `ef000..ef010` for values 0–10.

**`r5` is the action's own argument**, `mov r5, r1` at `0xd28408` and `0xd2ba14`, where `r1` is the
constant the four-instruction stub passes. One action spawns ONE mode from `0xd283fc`; `r5 == 4` spawns
nothing. `0xd2ba08` spawns three, `cmp r5,#0` choosing modes 8/9/10 (r5 = 0) or 5/6/7 (otherwise).

---

## 6. The eleven modes — RESOLVED: the angles are real and bit 0 gates them

An earlier draft of this spec said the two ints had no consumer and that the eleven modes were therefore
identical. **That was wrong, and the cause was scope**: I had scanned base00's vtable slot targets and his
class's overrides, but not the **helpers those methods call**.

**The consumer is `0x3f9378`**, called by the init (`0x3f8b80`) at `0x3f8fe4`:

    bl   0x4a0f00               ; the owner; none -> angle 0
    ldr  r1, [r4, #0x15e8]      ; THE FLAGS WORD
    tst  r1, #1                 ; BIT 0
    bne  0x3f93e0               ; set   -> angle 0, then tst #4 and the +0x1614 path
    movw r0, #0x15ec            ; clear -> THE DEGREE OFFSET
    vldr s0, = 182.04445        ; DEG_TO_U16 (65536/360)
    vmla s4, s2, s0             ; 0.5 + [+0x15ec] * 182.04445
    vcvt.s32.f32                ; -> the angle, returned

**So bit 0 — the one bit his reader builds — is exactly what decides whether `+0x15ec` is applied.**

| modes | `sh.ints[1]` | flags bit 0 | arm | angle |
|---|---|---|---|---|
| 0–3, 5–10 | −1 | **clear** | `0x3f93b4` | **`sh.ints[0]` in degrees** — 5, −10, 5, −5 (0–3); 0 (5–10) |
| 4 | 0 | **set** | `0x3f93e0` | 0, then the `0x04` test and the `+0x1614` path |

The modes are differentiated. Modes 0 and 2 do share a `.sh` block (both `ints[0] = 5`) but are spawned by
different actions at different frames (f76 and f90), which is an ordinary thing for a volley.

**Two earlier findings of mine are corrected by this, both from the same scope error:**

- "`+0x15ec` / `+0x15f0` have no consumer" — false. `0x3f9378` reads `+0x15ec`; `0x3f9cc4` reads `+0x15f0`
  at `0x3f9d00`. Whether `0x3f9cc4` is reachable for him is **UNREAD** (it is not called directly by a path
  method; it may be called by another helper).
- "there is no test of bit `0x01` anywhere on the path" — false. It is tested at `0x3f93ac`, inside this
  helper. §3's table lists the six tests in the path methods themselves; **that list is not exhaustive
  for the path**, because helpers contain their own tests.

**The detector used this time carried positive controls** — `+0x15fc`, `+0x1618` and `+0x162c` were searched
alongside and each was found at its known read site — so the earlier negative is confirmed to have been a
scope failure and not a tooling failure.

## 6b. The transitive closure, and what the runtime already has

**Answering two questions from the PM directly, because Render builds from this.**

### Where `+0x15f0` is read

`0x3f9cc4` — **the Y spread, the fan angle**. `shells.js` names it itself (line ~3175): *"the angle words:
the owner block's X / Y and 0, each with the reader's degree offset added as a u16 — X from `+0x15ec`
(0 here, `0x3f9378`) and Y from `+0x15f0`, the fan angle (`0x3f9cc4`)"*. Its read site is `0x3f9d00`, on
the **bit `0x02` clear** arm. Basarios has `0x02` **set**, so on that arm the Y angle is forced to 0 and the
`0x04` test decides the rest. **So his fan is on X (`+0x15ec`), not on Y.**

### Closure of the base00 path methods (depth ≤ 3, 12 functions)

The only closure member that touches these fields is **`0x3f9378`, depth 1, called by the init at
`0x3f8fe4`**:

    READ flags @0x3f93a4   TST #1 @0x3f93ac   READ +0x15ec @0x3f93b4
    TST #4 @0x3f93e4       READ +0x1614 @0x3f93f0
    READ +0x1618 @0x3f94c4  READ +0x15ec @0x3f94f0
    READ +0x1604 @0x3f9500  READ +0x1600 @0x3f9530

That resolves three offsets §2 left open: **`+0x1600` and `+0x1604` are the clamp bounds** and **`+0x1618`
is the aim offset**, all inside `0x3f9378`. For Basarios `+0x1600 = +0x1604 = 0.0` and `+0x1618 = (0,0,0)`.

### Correction: §3's six-test table is NOT exhaustive

The closure shows further `tst` instructions inside the init (`#8`, `#0x80` ×3, `#4`, `#1`) beyond the
three my register-tracked scan found. Some of those test other registers; **which of them test the flags
word is UNREAD.** The six-test table is "the tests I have confirmed read the flags word", not "every test".
Two causes: the scan tracked one register from one load and stopped at the first overwrite, and I bounded
the init at `0x3f9100` when its real extent (to the next `push {…, lr}`) runs past `0x3f933c`.

### The runtime ALREADY transcribes both helpers — feed them, do not add them

`shells.js` has `0x3f9378` as **`xAdjust37`**, with its arms documented:

> *"Flag 1 clear: the X offset `+0x15ec` in degrees, as u16. Flag 1 set: the aim's X from a point to the
> target minus the owner's X word, plus the offset (32-bit), clamped to [`+0x1600`, `+0x1604`]. The point:
> flag 4 set … the launch point p; flag 4 clear … the owner's point … with the aim offset `[+0x1618]`."*

and the Y fan (`0x3f9cc4`) appears as `k.fanDeg` in an existing init variant. So the mechanism is present
and correct; what is missing for Basarios is a **params function supplying his values into it**:

| helper input | from | Basarios |
|---|---|---|
| `xDeg` | `+0x15ec` | `sh.ints[0]` — 5, −10, 5, −5 (modes 0–3); 0 (5–10) |
| `fanDeg` | `+0x15f0` | `sh.ints[2]` — not applied, his `0x02` is set |
| clamp lo / hi | `+0x1600` / `+0x1604` | `sh.floats[1]` / `sh.floats[2]` — both **0.0** |
| aim offset | `+0x1618` | `accVec(0)` — **(0,0,0)** |
| flags | `+0x15e8` | **`0x00000000`, or `0x00000001` on mode 4** (was `0xFFFFFFFE`/`0xFFFFFFFF` — withdrawn, see §3) |

**Flag 1 = bit `0x01`**, the bit his reader builds — so modes 0–3 and 5–10 take "flag 1 clear" (the degree
offset) and mode 4 takes the aim-and-clamp path with both bounds 0.0.

## 7. Landing — `0xd3066c` (his own, vtable `+0x150`)

Dispatch on the contact type in `r3`:

| type | address | behaviour |
|---|---|---|
| 0 | `0xd30798` | loads effect handle `+0x15cc` (= `getEffect(2)`), loads `+0x15e0`, calls `0x43ac04`, joins the common tail. **No shell.** |
| 1 | `0xd30694` | allocates a 0x40 request (`0x3fa2bc`), loads **shell01's class id from `+0xcac8`** (`0xd306ec`), writes **mode 0** into `+8` (`0xd30708`), parent into `+0xc`, enqueues with `0x48b884`. **This is `u 161`.** |
| 2 | `0xd307b4` | loads effect handle `+0x15d4` (= `getEffect(1)`), joins the common tail. **No shell.** |

Common tail `0xd307bc`: `mov r1,r6 / mov r2,r5 / bl 0x3f8970`, then ends through `[vtable+0x148]`.

`+0x15e0` is a separate word, passed to `0x43ac04` as an argument, never bit-tested. His reader does not
write it; base00's ctor writes −1 at `0x3fa35c`. Base00's landing would store it at `0x3f8a54`, but his
override replaces that.

**Second generation is runtime, not data.** `SHELL_DATA` has no field for a shell that spawns a shell;
Rathian's equivalent is `make001`'s `creator` argument called from the Rathian steppers. Implement as a
`landing04` plus one key in `LANDING` (`uShellEm004_sp_00`), which touches no shared code —
`LANDING[S.cls] || landing` at `0x3f8878`'s call site.

Effects reports `hitType()` yields only 0 or 1 (type 2 needs a hunter). `u 161` is on type 1 — reachable.

**MEASURED IN THE VIEWER, 2026-09-30 — the type-1 arm fires.** L4 Motion[5], no wall: his shell00 spawns
at y 202..206 with the owner at y ≈ 300 and the floor at −1.38 (all game units, the owner position being
`schedule.parent.position` and the floor `monsterFloorY() / 0.01`), flies +z, and crosses the floor 48
steps later — anchor y 10.66, position y −1.94 — giving `{ ev: 'hit', type: 1 }` at (74.33, −1.38,
1309.22) and state 0xfe. Both shells of the clip land. So this is not a branch waiting on a hypothetical.

**THE ONE THING STILL UNREAD, and it is what holds `u 161`:** the table above says `0xd30694` allocates
the request, takes the class id and writes mode 0 — it does **not** say whether it then overwrites the
allocator's own `+0x10` (the point) and `+0x30..38` (the angle words). Those defaults are read for em007's
use of `0x3fa2bc`: `+0x10..18` from `[[enemy+0x1428]+0x40]`, **not** the enemy's own `+0x40`, and
`+0x30..38` from enemy `+0xfe8..+0xff0` (`rom-map.md`). `[[enemy+0x1428]+0x40]` has no viewer input, and
Nargacuga's sibling site `0xe593d8` **does** overwrite `+0x10` with the contact point — which is exactly
why his cannot be assumed to do either. Until that is read, the shell has no established place to sit and
`landing04` names the refusal instead of creating. **The read:** `0xd30694`..`0xd30708` onward, for stores
into the request at `+0x10/14/18` and `+0x30/34/38`.

An earlier round reported this landing as "never entered". That was a broken instrument, not a result —
`schedule.js`'s `stepShells()` wrapper does not return its `out`, so a harness reading refusals from the
return value read `undefined` on all 292 steps. See the trap in `rom-map.md`.
Type 2's effect is a named refusal for the viewer.

---

## 7a. The landing's request — both vectors ARE overwritten (read 2026-09-30)

`0xd3066c` is `sp_00`'s `+0x150`, entered as `(r0 = shell, r1, r2, r3 = the contact type)`; `0xd30670` is
`mov r5, r1`, so **`r5` is the second argument** and `r3` selects the arm (`cmp r3,#2` → `0xd307b4`,
`cmp r3,#1` → the type-1 arm at `0xd30694`).

On the **type-1** arm, after `0x43ac04`, `0x4a0f38` (must return 1) and `0x4a0f00` (the owner, must be
non-null), it allocates the **0x40** request at `0xd306e4` (`0x3fa2bc`) and fills it:

| off | value | where |
|---|---|---|
| `+0x00` | `[PIC]+8`, the request vtable | `0xd3071c` |
| `+0x04` | **`[owner + 0xcac8]`** — shell01's global id (`0x6b` on Basarios) | `0xd306f0`, `0xd30700` |
| `+0x08` | **0** — mode 0 (`r1 = 0` from `0xd306fc`) | `0xd30708` |
| `+0x0c` | `0x4a0f00(shell)` — the owner | `0xd3070c` |
| `+0x10/+0x14/+0x18` | **`[r5]`, `[r5+4]`, `[r5+8]` — the landing's second argument, i.e. THE CONTACT POINT** | `0xd30728`..`0xd3073c` |
| `+0x1c`, `+0x2c` | 0 | `0xd30720`, `0xd30724` |
| `+0x30/+0x34/+0x38` | **the LANDING SHELL's own `+0xfe8/+0xfec/+0xff0`** — the angle words, inherited from the parent shell | `0xd30744`..`0xd30750` |
| `+0x3c` | `0xffff` | `0xd3075c` |

**So neither vector is left at the allocator's default.** `+0x10` is overwritten with the contact point
(the same behaviour as Nargacuga's sibling site `0xe593d8`, so the two agree rather than diverge), and
`+0x30` is overwritten with the parent shell's angle words rather than the owner's.

**What that means for `u 161`.** The second-generation shell is `[owner+0xcac8]` mode 0 — Basarios's
shell01 — placed at **the contact point the landing was called with**, carrying **the parent shell's**
angles. Since shell01 is base01 and its flags for mode 0 are `0x0C` (bit 2 set), it then takes base01's
ground-snap arm (`0x3faaf8`, query `0x183490`), so the final y is the floor under that contact point.

`landing04` therefore needs the contact point as its position source, not the owner and not a static — and
the angle words come from the shell that landed.

**LIFTED AND DRIVEN, 2026-09-30.** `landing04`'s type-1 arm now calls `ctx.create(S, 'shell01', { mode: 0,
position: hit.point, angles: S.angles })`. L4 Motion[5], no wall: all four shell00 modes reach a type-1
contact and **each creates shell01 mode 0 at its own contact point** - (64.43, -1.38, 1316.37), (64.10,
-1.38, 1311.07), (65.84, -1.38, 1317.38), (64.85, -1.38, 1320.90) - with `start` = ef param 0 = **list u,
key 161**, `failed: null`, no page error, and the child's y snapped to the floor by base01's `0x3faaf8` arm
exactly as this section predicts. Ten shell suites byte-identical to the pre-Basarios baseline.

**NOTHING WILL DRAW YET, and it is not this lane's gap.** `docs/effects/em004_00.json` carries `u 160` and
`u 162` as `when: "shell"` records and **no `u 161`**, so `schedule.js`'s entry lookup finds nothing for the
child's start and `host.requestEffect` is never called. The ask for the Effects lane is one record: **`pel
em004_00u`, key 161, as a `when: "shell"` entry**. `shells.js` is complete up to that point.

**`+0xcac8` is shell01's slot ON THIS CLASS ONLY** (EMC): on `uEm032_00` the two slots are swapped relative
to the shell numbers (`+0xcac4` the base01 shell, `+0xcac8` the base00 one, `0xe20334`). `landing04` names
the shell (`D.shells.shell01.id`), not the offset, so nothing carries.

## 8. Notes (not on the path, recorded so they are not rediscovered)

- **`+0x428` / `+0x454` — VOID, they are not shell00's slots.** An earlier draft warned that `+0x428`
  contained code treating `+0x15e0/e4/e8` as a float vec3, which would have made §3's flags reading
  unsafe. Those words lie **past the end of shell00's 95-slot table**: `0x1798ee8 + 0x428` is
  `0x1799310`, which is **shell02's `+0x13c`** — its init — and `+0x454` is shell02's `+0x168`, its
  point. So nothing reinterprets shell00's flags word as a float, and **the caveat over §3 is removed
  entirely**. (For shell02 those offsets genuinely are a float vec3; that is Render's spec, not this one.)
- **`+0x454`** (`0xd30cec`) is a predicate over a 12-value enum testing a bit of mask `0x33`
  (`bl 0x4a0ee4 / sub #1 / cmp #0xb / bhi / tst r2, r1, lsr r0`). Not called. Unread beyond that.
- **`+0x1614`'s ctor default** — **UNREAD**, and irrelevant for Basarios (§4).
- **`vz` / `vy` are not read in the step (`0x3f9738`..`0x3f9990`) or the point (`0x3f99e0`..`0x3f9cf0`).**
  `params00` has them consumed at init (`launchVelocity`). The ROM's init `0x3f8b80` has **not** been
  scanned for them. **UNREAD.**

---

## 9. Entry state in `shells.js`

Already written and verified loading: `SHELL_DATA.em004_00` with 8 actions, `shell00` = `base00`,
`shell01` = `base01`, `shell02` = `base02`, listIds `{0:'u', 1:'c'}`, and the actions

    (7,0x04) L4 Motion[5]  f76  mode 0      (7,0x0b) L4 Motion[5]  f74  mode 1
    (7,0x16) L4 Motion[5]  f90  mode 2      (7,0x17) L4 Motion[5]  f80  mode 3
    (7,0x4e) L4 Motion[20] seq f60/104/134  modes 8,9,10
    (7,0x58) L4 Motion[20] seq f60/104/134  modes 5,6,7
    (7,0x0e) L2 Motion[27] f142 shell02 mode 1     (7,0x32) same — u 130

All eight action numbers appear in `em004_00_cmdtbl` as issued `00 07 NN`. Two guards were added:
`if (def.base === 'base13') return null;` in the generic `spawn()` (a base13 shell would otherwise be
initialised as base55 — a wrong shell rather than a refusal), and `D.actions || []` at the picker.

**Still missing for anything to appear:** a spawner branch for `0xd283fc` / `0xd2ba08` (dispatch is on
literal ROM addresses), `params04r`, the `init00` bit-`0x10` test, and `landing04`.
