# The per-frame recompose: 0x327188 -> 0x31d16c, as far as it is read (2026-09-29)

Written so the next pass starts from the page and not from memory. **Every line here is either a ROM
read with its address, or is marked UNREAD / NOT TRACED.** Nothing downstream may assume more than
the markers allow.

## Why this exists

Render measured, on em001_00 `u 260` (joint 1, authored offset `(0, 0, 200)`):

* the unit-to-joint delta is **constant in WORLD space** and swings in joint space across 53-61
  degrees of joint turn (L2 Motion[12]: spreadWorld 209/199/60 vs spreadJoint 306/297/70);
* `c 1104`, by contrast, is constant in **JOINT** space across 8 spawns.

`c 1104` is mode 1 -> compose state 2 (placed once); `u 260` is mode 0 -> state 1 (recomposed every
frame). So the candidate is: **the initial placement transforms the offset by the joint, the
per-frame recompose does not.** Render cannot separate "not rotated" from "rotated by the parent
unit", because Rathian faces world +Z in the idles and the two coincide there.

**The 0.88.** Authored 200, measured |d| = 176, joint-space Z = 155. Render's own reading is that
their joint-space projection is unnormalised, so a linear scale in the joint multiplies once into
the world magnitude and twice into the joint-space one: 200 x 0.88 = 176, 200 x 0.88^2 = 155. Three
numbers on one factor. Rathian's `sizeBase` is 1.0, so it is not the monster. Not independently
measured here.

## The struct layout, and why it is trustworthy

Four independent anchors fix it, one of them proven from the file format:

| | |
|---|---|
| `payload + 0x30` | the KEY — proven: `sProofEffect::setup` (0x326010) matches the caller's key against in-memory `+0x50`, and `efx/proof/pel.py` parses 653 files on that basis |
| `payload + 0x32` | the joint, read by `efx/proof.py block()` at **P + 0x42** |
| `payload + 0x00` | the offset, read at **P + 0x10** |
| `payload + 0x20` | the scale (12 bytes), read at **P + 0x30** |
| `payload + 0x36` | the mode, read at **P + 0x46** |

So **payload + X lives at P + X + 0x10**, where `P` is the parameter block built by the ctor
`0x31b6b0` and filled by the ROM's own copy `0x31c4ac(P, payload)`.

The ROM's start `0x32a284` reads the same five things 0x30 HIGHER (`[r5]` state, `r5+0x72` joint,
`r5+0x40` offset, `r5+0x88`/`+0x8c` masks), so **the block sits at +0x30 inside a larger request
descriptor** and the callee is handed the descriptor:

    descriptor = P - 0x30
    descriptor + 0x00 = the COMPOSE STATE   (the word 0x327238 gates the whole recompose on)
    descriptor + 0x40 = the OFFSET vector   (= P + 0x10 = payload + 0x00)
    descriptor + 0x70 = payload + 0x60      (the word whose consumer is still unread; see below)
    descriptor + 0x72 = the JOINT           (= P + 0x42 = payload + 0x32)
    descriptor + 0x76 = the MODE            (= P + 0x46 = payload + 0x36)
    descriptor + 0x78 = the SPACE           (= P + 0x48 = payload + 0x38)
    descriptor + 0x88 = MASK1               (= P + 0x58 = payload + 0x48)
    descriptor + 0x8c = MASK2               (= P + 0x5c = payload + 0x4c)

**And the descriptor is `effect + 0x220`** — `0x31d16c` takes it as its fifth stack argument
(`ldr r4, [fp, #0x28]` at 0x31d194) and the recompose passes `r4 + 0x220` there (0x3272c0).

**A cross-check that came free and is worth keeping.** If descriptor = effect + 0x220, then
`payload` = descriptor + 0x40 = **effect + 0x260** — and the recompose independently passes
`add r3, r4, #0x260` (0x3272e8) as its fourth argument. Two derivations, same address.

## The gate on the recompose itself (0x327188)

    327238  ldr r0, [r7, #0x220]!    ; r7 = effect + 0x220, the COMPOSE STATE
    32723c  cmp r0, #1
    327240  bhi #0x3273d8            ; state >= 2: jump PAST the recompose

    3272f4  bl  #0x31d16c            ; the recompose proper
    327300..327318  str r0, [r4, #0x40] / #0x44 / #0x48    ; the result -> the root's anchor

So **states 0 and 1 are re-placed every frame; states 2, 3, 4 are placed once.** This half is
settled and Render's measurement of both behaviours matches it.

The state comes from the mode by the mapping at `0x329d88` (transcribed in `efx/proof.py block()`):

    mode 4  -> state 0
    mode 1  -> state 2
    mode 0  -> state 1 if payload +0x38 == 1 else state 0
    else    -> state 3 if payload +0x3e == 6 else state 4

## The branch chain inside 0x31d16c, as read

    31d194  ldr  r4, [fp, #0x28]     ; r4 = the DESCRIPTOR (effect + 0x220)

    31d218  ldr  r1, [r4]            ; the compose state
    31d21c  cmn  r1, #1
    31d220  beq  #0x31f9a4           ; state == -1 -> elsewhere (not our case; states are 0..4)

    31d228  ldrb r1, [r4, #0x76]     ; MODE
    31d290  cmp  r1, #4
    31d294  bne  #0x31d37c           ; mode != 4 goes here
                                     ; mode == 4 falls into code marked UNRECORDED (0x31d298)

    31d384  ldr  lr, [fp, #0x18]     ; a CALLER FLAG. The recompose passes 1 -- `mov r2,#1` at
    31d3a0  cmp  lr, #1              ;   0x32729c, stored to sp+0x10 / +0x14 / +0x18 (0x3272d4..dc)
    31d3a4  bne  #0x31f0c8           ; so the recompose FALLS THROUGH

    31d3b0  s0 = 6.2831855           ; 2*pi
    31d3b4  s8 = 360.0
    31d3d4  s2,s4,s6 = [r5], [r5+4], [r5+8]
    31d3e0..31d3e8  s * = s0
    31d3f0..31d3f8  s / = s8         ; x * 2*pi / 360 -- DEGREES TO RADIANS on a vec3

    31d410  ldrb r0, [r4, #0x78]     ; SPACE (= payload + 0x38)
    31d414  cmp  r0, #2
    31d418  bne  #0x31d47c           ; space != 2 goes here

    31d47c  ldr  r2, [sp, #0x3c]     ; a LOCAL of 0x31d16c -- SOURCE NOT TRACED
    31d480  orr  r1, r2, #1
    31d484  cmp  r1, #1
    31d488  bne  #0x31d56c           ; i.e. continue only when the local is 0 or 1

**So the "space" field is a real branch input, read from the ROM.** Until this trace it was only a
note of the same vintage as two things that turned out wrong the same day (payload +0x48 called a
read when it was a fit; the row gate described without its exclusion arm), and it was right not to
lean on it.

**`u 260` takes the `space != 2` arm.** `proof.py`'s mapping makes a mode-0 record state 1 only when
`P + 0x48 == 1`, so its space is 1, `cmp r0,#2` is unequal, and it branches to 0x31d47c — **not**
the space-2 arm.

**Likely but NOT TRACED:** `r5` at 0x31d3d4 holds a vec3 of degrees. The recompose passes
`effect + 0x270` (= payload + 0x10, the rotation field) in the `fp + 0xc` slot (0x3272c8), which
matches. The assignment of r5 inside 0x31d16c was not followed, so this is consistent, not proven.

## The parent-model gate at the far end (0x31f6b4)

    31f6b4  ldr r0, [r6, #0xf0]      ; r6 is the PARENT -- the fallback at 0x31f788 reads [r6+0x40],
    31f6b8  cmp r0, #0               ;   its position, which identifies r6
    31f6bc  beq #0x31f788            ; NO MODEL -> fallback: parent +0x40 + the RAW offset (3 vadd.f32)
    31f6c0                           ; WITH A MODEL -> the joint-matrix path (0x1ebe8 multiply)

Lifted faithfully at `lifted-request.js:2800-2802` (gate) and `:2838-2839` (fallback). It branches
on the **parent's model**, not on the compose state, so **it cannot by itself explain state 2
transforming while state 1 does not** — the difference, if real, is made upstream in the dispatch
above.

## Branch inputs: game vs harness

The reason this table matters (PM, 2026-09-29): *"no Unverified thrown" proves the path taken is
translated, not that the viewer takes the path the game takes.* A branch on a field the harness
leaves at zero sends a record down a perfectly translated WRONG arm with no refusal — which is
exactly what the `+0xf0` fix corrected earlier the same day.

| input | where from | game vs harness |
|---|---|---|
| `fp + 0x18` (lr) | caller constant, `mov r2,#1` at 0x32729c | **SAFE** — a literal in the calling code, not state |
| `descriptor + 0x76` mode | payload +0x36, the record's own bytes | **SAFE** — same bytes both sides |
| `descriptor + 0x78` space | payload +0x38, the record's own bytes | **SAFE** — same bytes both sides |
| `descriptor + 0x94` | read at 0x31d41c | on the space==2 arm only; **not on u 260's path** |
| `sp + 0x3c` | a local of 0x31d16c | **UNREAD** — source not traced. The one open input on u 260's path |
| `parent + 0xf0` | the parent's model resource | harness: `host.js` sets it (`createParent`, model unless `{model:false}`). **This is the one that differed before the fix** |

Three of the four inputs on `u 260`'s path so far are record data or a caller constant, which are
identical in game and harness by construction.

## What is UNREAD

1. **The source of the local at `sp + 0x3c`** (tested at 0x31d484). The only untraced branch input
   on `u 260`'s path.
2. **The path from 0x31d47c to where the offset is actually added** — i.e. whether the space-1 arm
   ever reaches 0x31f6b4, and what transform it applies if not.
3. Whether `r5` at 0x31d3d4 is indeed `payload + 0x10` (consistent, not proven).
4. `descriptor + 0x70` (= payload + 0x60): **not read by any of the 173 methods** of the vtables
   holding 0x32a284 / 0x3273e8 / 0x327188 (scan bounded to those classes, six displacement hits, all
   of them vtable dispatches `ldr [obj]` / `ldr [vtable,#0xa0]` / `blx`). NOT yet scanned: the
   generator and draw vtables, and any block copy that could carry it without a displacement load.

## Resume points

* **A.** Trace the source of `sp + 0x3c` inside 0x31d16c.
* **B.** Follow 0x31d47c to the offset add, and determine whether the space-1 arm reaches 0x31f6b4.

## Status of the +0xf0 fix (host.js createParent)

**CORRECT-AND-UNTESTED.** The reasoning stands — a live monster owns an `rModel`, so the gate's
model arm is its correct path, and a shell does not, which is why `schedule.js` passes
`{model: false}`. But the three records used to verify it (`u 900` joint 144, `u 1302` joint 200,
`u 1303` joint 9) **all have offset `(0, 0, 0)`**, which is invariant under any rotation or scale.
That test showed only that the anchor lands on its joint; it could not have detected whether the
offset is transformed.

**The certifying record is one with a NON-ZERO offset that demonstrably reaches 0x31f6b4.** None has
been measured. Resume point B names which states reach the gate, and that decides which record to
use.
