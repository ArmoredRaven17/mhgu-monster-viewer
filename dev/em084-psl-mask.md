# Nakarkos (uEm084_00): the PSL enable word, enemy +0x13f4

Research agent for the Viewer agent, 2026-10-05. Static reads, with a unicorn cross-check (meatemu harness, no
recorder or lift used). Raven, 2026-10-05: "I see a 'bone debris' effect that is playing around the main body, we
might have the wrong effect in its place."

Conventions are those of `docs/render/psl-mask.js` and rom-map "THE PSL ENABLE MASK". Motion ids are written as
`(list << 8) | slot`. **R** means READ: the consuming instruction was read. **I** means INFERRED. **U** means UNREAD.

Before starting I grepped rom-map for `0x106cae8`, `0x13f4`, `0x13c`, `0x73e0` and `0x1a1`. Nakarkos's `+0x13c`
had no row. The rows I relied on: `0x7256c`, `0xca170`, `0xca52c`, `0x6fe88`, `0x81614` / `0x81670`, `0x7a258`,
and the `[e+0x1428]+0x1a1` phase byte (rows 322 / 452 / 566). The task board (line ~1076) has the open bug this
note answers.

## TL;DR

* **The bone debris on the idle is the right effect at the wrong time.** L0 Motion[1] bit 15 → c 140
  (`em084_00_008`, rock models) is enabled only in **one** action: (13, 0), and only at its **phase 4**. In that
  phase he has dived into the ground (posture 4, burrow offset) and holds L0 M1 for ~300 frames. In the game the
  debris pulses every 30 frames over a buried Nakarkos. On every other play of L0 M1 (his stance-1 idle and the
  ~60 actions that play it) the bit is **off**. Removing it from the idle is the fix. **R** (mechanism) /
  **I** (that "buried" is what the player sees).
* **c 135 (`em084_00_007`) on bit 0, 1 or 2 always fires.** The base `0xca170` ORs bits 0-5 into every motion's
  word, and his class removes nothing. So the viewer is right to show it on every clip that binds it (L0 M2-M9,
  M17, M40, M51, M52, M59, M66, L2 M24-M26 / M44 / M48 / M49, every L3 one). **R.** If Raven's debris is on one of
  those clips, the question is how it is drawn, not whether it fires (§4).
* **L2 Motion[23] is wrong in the viewer.** The viewer fires bits 15, 18 and 19 together. The game enables bit 15
  (c 135) for actions (7, 0/1/3/4/5) and bits 18-20 (u 205 + u 206) for actions (7, 6/7). Never both. **R.**
* **L3 Motion[63] (his (11, 1)):** bits 15-19 are always on, so u 220 / u 221 / u 215 fire. **R.** Bit 6 (u 214,
  f170) fires only when he is calm and not tired (the base). **R.**
* The method reads **no** stance (`E+0xcac4`), no charge flag (`E+0xcadc`), no tentacle form and no map. The
  emulated control is in §2.

## 1. The method, uEm084_00 vtable +0x13c = `0x106cae8` (R)

The body vtable is `0x17f11fc` (rom-map trap: class-requests.json says `0x17f11f8`, which is 4 bytes low). Its
slot `+0x13c` = `0x106cae8`, which is overridden (the base is `0xca170`). Slot `+0xf0` = `0xca52c`, the base and
not overridden, so the body's PSL copy takes `[E+0x13f4]` exactly as Basarios's does. Slot `+0x204` = `0x1066c14`,
the action-start handler (state-decodes), which is a sanity check that `0x17f11fc` is the right vtable.

**Extent:** `0x106cae8 .. 0x106cbb0`, derived from where the code ends. `0x106cbb0` is the last `pop {..,pc}`,
`0x106cbb4` is its literal (`0x52f448`), and the next function starts at `0x106cbb8`. Every instruction was read.
It makes two calls, `0xca170` and `0x6fe88`, and both are READ in rom-map.

```
0x106caf4  bl 0xca170                         ; base: bits 0-5 always + the state group (6-8 / 9-11 / 12-14)
           r5 = motion id (r1)
0x106caf8  motion == 0x33f (L3 M63)  -> [E+0x13f4] |= 0x000f8000          ; bits 15-19, unconditional
0x106cb04  motion == 0x217 (L2 M23)  -> if byte E+0x73e0 == 7             ; action group (rom-map row 60)
                                          and n = byte E+0x73e1 <= 7
                                          and tst (0xfb >> n) & 1         ; n != 2
                                        then |= table 0x159bff0[n]
                                        table = {0x38000 x6 (n 0..5), 0x1c0000 x2 (n 6, 7)}
0x106cb10  motion == 0x001 (L0 M1)   -> if 0x6fe88(E, 0xd, 0) == 1        ; current action is (13, 0)
                                          and byte [E+0x1428]+0x1a1 == 4  ; that action's phase byte
                                        then |= 0x00038000                ; bits 15-17
           any other motion          -> nothing over the base
```

Pointer tracking: in each arm, `ldr r0, [r4, #0x13f4]!` leaves `r4 = E+0x13f4`, and the final `str r0, [r4]` at
`0x106cbac` is the write. The table pointer is PIC: `0x106cba0 add r2, pc, r2` → `0x159bff0`.

**Where it is called** (R, rom-map): `0x7256c`, the setMotion wrapper. It zeroes `+0x13f4` (`0x72590`), flags the
motion change, and calls `vt+0x13c` (`0x725cc`) unconditionally. Every `0xafe84` / `0xafce8` motion set reaches it
(`0xafde8`), **including a re-set of the same motion**. So the word is latched per motion start.

**Other writers of +0x13f4 in his band** (R, scan): a `.text`-wide scan for `movw rX, #0x13f4` finds 261 sites.
Inside `0x1064be0 .. 0x1090000` there are only `0x106cb44` / `0x106cb54` / `0x106cb98` (this method),
`0x107f0d4` (the arm's `+0xf0`) and `0x107f0f4` (the arm's `+0x13c`, §6). The positive control is that the same
scan finds Basarios's `0xd2e308` / `0xd2e338` / `0xd2e3f0`. Caveat: an offset built as `add #0x1000` plus
`[#0x3f4]` would escape this scan. None was seen in the read code.

## 2. Unicorn cross-check (R, emulated)

These are calls of `0x106cae8` through the meatemu harness (vtable `0x17f11fc`, E/P zeroed except as shown). The
script is `scratchpad/emu084.py`.

| motion | action (E+0x73e0, +0x73e1) | P+0x1a1 | word |
|---|---|---|---|
| L0 M1 | (0, 0) idle | 0 | `0x1ff` |
| L0 M1 | (13, 0) | 3 / **4** / 5 | `0x1ff` / **`0x381ff`** / `0x1ff` |
| L0 M1 | (13, 1) | 4 | `0x1ff` |
| L2 M23 | (7, 0) (7, 1) (7, 3) (7, 4) (7, 5) | 0 | `0x381ff` |
| L2 M23 | (7, 2) / (7, 8) / (6, 0) | 0 | `0x1ff` |
| L2 M23 | (7, 6) (7, 7) | 0 | `0x1c01ff` |
| L3 M63 | (11, 1) | 0 | `0xf81ff` |
| L0 M2, L0 M8, L0 M51, L2 M24, L3 M1 | various | 0 | `0x1ff` |
| L0 M2, enraged / tired | — | — | `0xe3f` / `0x703f` |

**Control for the negative "stance, charge flag, tentacle forms and map do not enter":** I re-ran L0 M1 (13,0)
phase 4, L2 M23 (7,6) and L0 M2 with `E+0xcac4 = 1 / 2`, `E+0xcadc = 1`, and the skull form bytes
`E+0xcb0c / +0xcb0d / +0xcb30` set. The words were identical. The harness's read trace lists exactly
`E+0x13f4`, `E+0x1428`, `E+0x73e0`, `E+0x73e1`, `P+0x1a1` and `P+0x505` (tired). Rage goes through the hooked
`0x81670`. The positive side of the same control is that varying `E+0x73e1` or `P+0x1a1` does change the word.

**Action (13, 0) driven frame by frame** (`scratchpad/emu084g13b.py`). The handler is `0x107a250`, with
`0xb09c8` / `0x7206c` / `0x72714` answered "yes", the posture / burrow / move helpers stubbed, and the common tail
`0x107a4f4` cut. Both stances give the same sequence of motion sets, each with the word the setMotion latch
computes:

```
phase 1: L3 M4  (0x304)  word 0x1ff
phase 2: L0 M17 (0x11)   word 0x1ff
phase 3: posture 4, 0xbf62c (MoguriBaseOfs), 0xbf700, P+0x1bc = 90.0
phase 4: posture 4, 0xbf62c, 0xbf700, then L0 M1  word 0x381ff   <- the debris bit
         then 0x7b518; P+0x1bc = 300.0; 0x7c9fc each frame
phase 5: L0 M1 again     word 0x1ff                               <- re-latched, debris off
```

## 3. The bindings, one by one

The viewer's block is `docs/render/monster.js` CLIP_EFFECTS em084_00. It is generated from the file masks. The
full-block dump (every named bit, `scratchpad/dump084.py`) shows **no body bit outside its file mask that has
events.** L3 M63 bit 4 (u 212) is named but never switched on. So putting em084_00 in PSL_MASK_MONSTERS adds no
body binding. It only removes or gates the ones below.

| clip | bit → record | game | status |
|---|---|---|---|
| **L0 M1** (381 f) | 15 → c 140 `em084_00_008`, f1, 30, 60 … 360 | **only action (13, 0) at phase 4** (the buried hold). Off on the idle (0,0) / (0,1) / (0,7) and on every other action nak-clips.json logs on L0 M1 ((1, …), (2, 0x0a-0x0e), (6, 0x64), (7, 0x02 / 0x0e-0x10 / 0x14 / 0x65-0x6b / 0x71 / 0x72 / 0x97-0x9d)) | R |
| L0 M2 M3 M4 M5 M8 M9, M51, M52 | 0 → c 135 `em084_00_007`, whole run | always | R |
| L0 M14, M63 | 0 / 1 → c 100 / 101 (`cm202_050`) | always | R |
| L0 M17, M18, M40, M59, M66, M67 | bits 0-3 (c 113 / 122 / 135 / 52 / 54 / 0 / 1 / 123) | always | R |
| **L2 M23** (199 f) | 15 → c 135 f0-120 | actions (7, 0 / 1 / 3 / 4 / 5) | R |
| **L2 M23** | 18 → u 205 `em084_00_009` f0-80; 19 → u 206 `em084_00_012` f40-120 | actions (7, 6 / 7) only (bit 20 is enabled but names nothing) | R (word); the (7, 6/7) → L2 M23 link is I, see below |
| L2 M24-M26, M44, M48, M49 | 0 → c 135 | always | R |
| L2 M81 / M82 / M85 | 0-1 → u 200 / 201 / 202, c 54 | always | R |
| L3 M1 … M78 (all but M63) | 0-1 → c 135, c 22 / 23 / 24, c 5 | always | R |
| **L3 M63** (579 f, action (11, 1)) | 0-5 → c 135, c 23, u 210, u 211, (u 212 never on), u 213 | always | R |
| L3 M63 | 6 → u 214 `em084_00_124` f170 | **calm and not tired only** (base `0x1c0`); off when enraged or tired | R |
| L3 M63 | 15 → u 220, 16 → u 221, 17 → u 215 | always (`0xf8000` unconditional) | R |

**(7, 6) / (7, 7) on L2 M23** (I). Their handler is the group-7 table `0x1073a74` → `0x1074054` / `0x1074060` →
`0x10755d4(E, 0 / 1)`. Its phase 0 calls the angle-picked turn `0x7a258` (rom-map row 987) with table
`0x17f1684`. In that table rows +0x20 / +0x30 hold motion `0x217` (L2 M23) and row +0x10 holds 0. So these
actions turn on L2 M23 when the target is to a side. nak-clips.json logged no clip for 7/06 or 7/07, and I did not
emulate `0x794f0`. Treat it as INFERRED. In any case the word alone is READ: those two actions get 18-20 and not 15.

**What action (13, 0) is** (I). The group-13 handler `0x107a250` runs L3 M4, then L0 M17 (which carries c 135
bit 1, f230-410: the dive), then posture 4 plus the burrow offset getter `0xbf62c` (dtb MoguriBaseOfs, as
Basarios's burrow). It holds 90 frames, then plays L0 M1 **with the debris** for 300 frames (P+0x1bc = 300.0,
counted down by `0x7206c` with step 1.0; the countdown itself is UNREAD), then plays L0 M1 again **without** it.
After that a common tail runs: a second machine on `P+0x1a2`, globals `G+0x50` in 5..7, `0xaa7c4` / `0xaa8a0`,
and `E+0x1054` against `G+0x49`. It looks like an area leave/return, but that tail is UNREAD. The read meaning is:
**a dive into the ground and a buried wait.** state-decodes lists g13 → "L3 M4 (+ L0 M17)" because its harness
did not force `0x7206c` and so never reached phase 4. This read extends that list.

## 4. What the "bone debris" is, and what to check in the draw

* **c 140 = `em084_00c` SEQUENCE 140 → `em084_00_008.efl`.** Record: joint 0, mode 0, sub 1, end 0, pos 0,
  scale 1 (R, pel). The efl has 8 rows: row 0 a billboard (gen 0), then model particles (gen 5) `cm101_000`,
  `cm100_008`, **`cm202_020_g`**, `cm190_000`, `cm200_107`, `cm202_041`, `cm102_003` (R, efl decode).
  `cm202_020_g` and `cm202_022_g` are rock-chunk models: Tetsucabra's carried rock `em066_00_004` is built from
  them (task board, the em066 read). So this is **ground debris kicked up at his root (joint 0)**. In the game it
  happens over a buried body. In the viewer the root stands at the surface with the whole body visible, so it reads
  as "bone debris around the main body" (I).
* **c 135 = `em084_00_007.efl`.** Record: joint 0, mode 0, sub 0, end 1 (R). It has 11 rows: the same family plus
  `cm202_022_g` and two more `cm200_107` (R). It is correctly always on where bound. Two pointers for checking the
  draw:
  1. The recorded engine draw `efx/engdraw-em084_00_007-u135.json` has 38 draws. 37 of them carry `FMorph`, i.e.
     the model-particle path (R, json).
  2. The board's 2026-09-21 note says "em084_00_007 u135 mix scene-model draws (the 0xc68664 path, which
     modeldraw.js does not translate)" and is still open. If the viewer draws `_007`'s rocks wrongly (billboards
     where the game draws models, or no models at all), that is the place to look. I did not verify this here.

## 5. CLASS_MASK entry (psl-mask.js shape)

```js
// NAKARKOS (em084_00), uEm084_00 vtable +0x13c = 0x106cae8 (body vtable 0x17f11fc; +0xf0 is the base 0xca52c).
// It calls 0xca170 first, then by motion id:
//   * L3 M63 (0x33f): bits 15-19 always (u 220 / u 221 / u 215 on his em084_00_3.psl slot 63);
//   * L2 M23 (0x217), status 7, number n <= 7 and n != 2 (mask 0xfb, table 0x159bff0): n 0..5 -> bits 15-17
//     (c 135), n 6, 7 -> bits 18-20 (u 205 / u 206); any other action -> nothing;
//   * L0 M1 (0x001): bits 15-17 only while the action is (13, 0) AND its phase byte P+0x1a1 == 4 -- the buried hold
//     after the dive (0x107a250 phase 3 -> 4 sets L0 M1; phase 5 re-sets it with the bits off). Bit 15 is c 140,
//     the debris pulse. The idle and every other L0 M1 play: nothing.
//   * every other motion: nothing over the base.
// Not read by it: stance E+0xcac4, charge flag E+0xcadc, tentacle forms, map (emulated control, dev/em084-psl-mask.md).
const EM084_L2M23 = n => (n <= 7 && ((0xfb >>> n) & 1)) ? (n >= 6 ? 0x1c0000 : 0x38000) : 0;
function em084(motion, action, state){
  if (motion === 0x33f) return 0xf8000;
  if (motion === 0x217) return action && action[0] === 7 ? EM084_L2M23(action[1]) : 0;
  if (motion === 0x001) return action && action[0] === 13 && action[1] === 0 && state.phase === 4 ? 0x38000 : 0;
  return 0;
}
// CLASS_MASK.em084_00 = em084  -- BODY lists (0 / 2 / 3) only; the tentacles' l_N / r_N lists run their own
// method (0x107f0e4, below) and must not be given this one.
```

CLIP_ACTIONS (the plays the viewer would offer):

```js
em084_00: {
  '2|Motion[23]': [ { action: [7, 0x00] }, { action: [7, 0x01] }, { action: [7, 0x03] }, { action: [7, 0x04] },
                    { action: [7, 0x05] }, { action: [7, 0x06] }, { action: [7, 0x07] } ],
  // L0 Motion[1]: the idle is action null -> bit 15 off. A "buried" play would be { action: [13, 0], phase: 4 },
  // which is offered only if the viewer shows him buried (posture 4, sunk by MoguriBaseOfs); otherwise leave it out.
},
```

**Inputs the viewer has to supply:**

* the clip, which gives the motion id;
* the action, for L2 M23 only. nak-clips.json gives (7, 0/1/3/4/5) and §3 gives (7, 6/7). ROM_ARM_PAIRS and
  beam-spawns do not name these.
* `state.phase`, only for the (13, 0) buried play. pslMask already passes `state` through.
* rage and tired, which the base uses: they matter only for L3 M63 bit 6 (u 214).

Nothing else: no stance, no charge rung, no tentacle form, no map.

**Generator side:** adding `em084_00` to PSL_MASK_MONSTERS makes `add_effects.py` emit full blocks. For the body
lists this adds nothing (§3). For the **entity** lists (`l_2` M1 bit 18, `l_2` M93 bits 15-25, the same on `r_2`)
it adds rows. They are already "entity motion: not bound", so nothing fires from them today.

## 6. The tentacles' own method (R, not proposed for wiring)

uEmOstgaloaArm vtable `0x17f6498` (class-requests.json's `0x17f6494` is 4 bytes low). Slot `+0xf0` = `0x107f0d4`:
`copy->mask = [arm+0x13f4]`, the same as the base. Slot `+0x13c` = `0x107f0e4`. It calls `0xca170`, then
redundantly re-ORs `0x3f` and the same state group, then switches on `motion - 0x201 <= 0x5c` (table `0x107f170`):

* **l_2 / r_2 M1, M5, M6, M13, M14, M28, M50, M51, M86** (`0x107f2e4`). It loads `B = [arm+0xcadc]` (I: the owning
  body, since it reads `B+0x73e0/1` as an action). It also reads the body action and the arm's own action:
  * If the body action is (7, 0x44 / 0x45 / 0x69 / 0x6a / 0x9b / 0x9c): `x = (motion != l_2 M1)`, `y = 0`.
  * If the body action is (7, 0x4a / 0x4b): `x = 0`, `y = 1`.
  * Otherwise `x = y = 0`.
  * Then, by the arm action (7, n) (table `0x107f398`):
    * n ∈ {0x0c, 0x0d, 0x21, 0x2a, 0x2c}: `x |= motion != M1`.
    * n ∈ {0x0f-0x12, 0x22, 0x26}: bits 15-17 if `x`, and **always** bits 18-20.
    * Any other n, or an arm group other than 7: bits 15-17 if `x`, and bits 18-20 if `y`.
* **M92** (`0x107f478`): the body's skull form byte, `B+0xcb0d` if `[arm+0xcae0] == 2` else `B+0xcb0c`. **M93**
  (`0x107f49c`): the arm's own `+0xcb30`. In both cases form 0..3 → table `0x1592ae8` =
  {`0x38000`, `0x1c0000`, `0xe00000`, `0x7000000`} (bits 15-17 / 18-20 / 21-23 / 24-26).
* Every other arm motion: nothing over the base.

This becomes relevant only when the viewer drives the tentacle PSLs (board: "skipped because the viewer hangs every
effect from the body").

## 7. Open

* (U) `0x794f0`'s row choice for (7, 6/7), i.e. which sides play L2 M23 and what row +0x10 = 0 means.
* (U) The group-13 tail at `0x107a4f4` (`P+0x1a2` machine, `G+0x50`, `0xaa7c4` / `0xaa8a0`). It decides how the
  buried wait ends, not the word.
* (U) `0x7206c`: is the 300 a frame count at 1.0 per frame? If so, the debris pulses about 10 times (f1 … f271) in
  the buried hold before phase 5 restarts L0 M1 without it.

## Proposed dev/rom-map.md rows

```
| `0x106cae8` | **uEm084_00 vt +0x13c** (body vtable 0x17f11fc; +0xf0 base 0xca52c), extent 0x106cae8..0x106cbb0: 0xca170, then L3 M63 (0x33f) \|= 0xf8000 always; L2 M23 (0x217) action (7, n), n <= 7, n != 2 (0xfb) -> table 0x159bff0 {0x38000 x6, 0x1c0000 x2}; L0 M1 \|= 0x38000 only if 0x6fe88(E, 13, 0) and P+0x1a1 == 4. Reads no stance / charge / form / map (emulated control) | uEm084_00 | R | dev/em084-psl-mask.md §1-2 |
| `0x107a250` | uEm084_00 group-13 action (13, 0): phases (P+0x1a1, table 0x107a2d0) L3 M4 -> L0 M17 -> posture 4 + 0xbf62c/0xbf700, wait 90 -> **L0 M1 with PSL bits 15-17 (c 140 debris)**, wait 300 -> L0 M1 re-set without them; tail 0x107a4f4 (P+0x1a2, G+0x50, 0xaa7c4) UNREAD | uEm084_00 | R (phases) / I (meaning: dive and buried wait) | dev/em084-psl-mask.md §2-3 |
| `0x10755d4` | (7, 6) / (7, 7) via group-7 table 0x1073a74: angle-picked turn 0x7a258 on table 0x17f1684 whose side rows hold 0x217 (L2 M23) -> the word's bits 18-20 (u 205 / u 206) | uEm084_00 | I (row choice 0x794f0 not read) | dev/em084-psl-mask.md §3 |
| `0x107f0e4` / `0x107f0d4` | **uEmOstgaloaArm vt +0x13c / +0xf0** (vtable 0x17f6498): per arm motion l/r_2 M1/5/6/13/14/28/50/51/86 by body action (7, 0x44/45/69/6a/9b/9c -> 15-17; 0x4a/4b -> 18-20) and arm action (table 0x107f398); M92/M93 by skull form -> table 0x1592ae8 {0x38000, 0x1c0000, 0xe00000, 0x7000000} | uEmOstgaloaArm | R (arm+0xcadc = body is I) | dev/em084-psl-mask.md §6 |
| trap | Nakarkos's c 140 (`em084_00_008`, rock models cm202_020_g) on L0 M1 is NOT an idle effect: the class enables bit 15 only in the buried hold of (13, 0). Every other bit 0-5 of his body PSLs (all the c 135 bindings) always fires | — | R | dev/em084-psl-mask.md §3 |
```

## What to implement

1. In `psl-mask.js`, add `em084` (§5) to `CLASS_MASK`, applied to the **body** lists only. Add `'em084_00'` to
   `PSL_MASK_MONSTERS`, and make sure the walker does not apply it to `l_N` / `r_N` clips.
2. Add `CLIP_ACTIONS.em084_00['2|Motion[23]']` with the seven actions. Each L2 M23 play then shows either c 135 or
   u 205 + u 206, never all three.
3. L0 M1 as the idle: action null, so c 140 goes **off**. This is Raven's "bone debris" on the idle. Offer a buried
   play `[13, 0]` with `phase: 4` only if the viewer can show him sunk.
4. L3 M63: u 214 (bit 6) follows Calm and not tired. Bits 15-17 stay on.
5. Re-run `add_effects.py em084_00 --apply` (the owner's call). The body rows are unchanged; only the entity rows
   are added.
6. If Raven still sees debris on a moving clip after this, it is c 135, which the game does fire. Check how
   `em084_00_007` draws (§4: the model-particle path and the open scene-model note).
