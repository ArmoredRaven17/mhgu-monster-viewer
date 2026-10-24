# Ahtal-Ka (em088_00) and Ahtal-Neset (em087_00) -- effects spec: the PSL enable word, and the records his class requests

Research agent for the Viewer agent, 2026-10-15. Read only: nothing under `docs/` changed. Scratch:
`<archive>\ak\` -- `emu88.py` (unicorn harness: the class band `0x10a2e44..0x10c1fc4` and the shared enemy layer
`0x60000..0xd0000` run natively, everything else a logged stub returning 0; ARM_MAX CPU for `vsel`), `sweep*.py` (the
frame handler per motion / frame / state), `classify88.py` (the whole-block plan rows against the transcription),
`closure.py` (static call closure: every immediate in a function's direct-call closure), `rows_*.txt` / `plan.txt`.
Context read first: rom-map rows `0x10bc340`, `0x6d1b4`, `0x10ad838`, `0x10b32b0`, `0x44158`, the section "Ahtal-Ka
(em088_00) -- the states" and `C:\MHGU-RE\offline\decode\notes\states-em088_00.md` (the states agent, today: its 4.3 read
u 120 / u 130 and its 10 left `0x10b7798`, `e+0xcb0c` and `0x10bb518` NOT READ -- this note reads them),
`dev/carapaceons-neopterons-effects-survey.md` (Ahtal-Ka), the board's class-code entries (2026-09-28).

**R** = the consuming instruction read; **R (emulated)** = also run; **I** = inferred; **NR** = not read.

## 1. The word -- uEm088_00 vt+0x13c = `0x10bc340` (extent `..0x10bc408`, literals `0x10bc40c` / `0x10bc410`) -- R, emulated

    0x6d1b4(e, motion)                         -- the shared Ahtal layer (1.2): 0xca170, then the per-motion lists
    k = [e+0xcb0c]; if k <= 2: +0x13f4 |= T0[k]        T0 = 0x16a37f4 = {0x1c0000, 0xe00000, 0x38000}
    if motion == 0x21e (L2 M30):
        if status == 1 and (n - 0x1c) <= 9 and (0x3cf >> (n - 0x1c)) & 1: +0x13f4 |= T1[n - 0x1c]
                                               T1 = 0x16a3800 = {b27, b27, b28, b28, -, -, b27, b27, b28, b28}
    else if status == 10 and n == 0xaf:        +0x13f4 |= 0x7000000 (bits 24-26)

So: **carrying object 0 -> bits 18-20, object 1 -> bits 21-23, object 2 -> bits 15-17, carrying nothing (4, the spawn
value) -> none of 15-23**; L2 M30 under (1, 0x1c / 0x1d / 0x22 / 0x23) -> bit 27, under (1, 0x1e / 0x1f / 0x24 / 0x25)
-> bit 28 (0x20 / 0x21 never); every OTHER motion under (10, 0xaf) -> bits 24-26. No variant, part, rage or tired input
of its own (the base's state groups 6-14 come from `0xca170`).

**Control first** (the brief's): the same harness run on Yian Garuga's `0xdb0d10` reproduces dev/em018_00-effects-spec.md
§2's L2 M2 words exactly -- calm `0x1bf`, enraged `0xc3f`, tired `0x603f`. Then Ahtal-Ka, 5 values of `e+0xcb0c`
(0..4) x 13 (motion, action) cases x calm / enraged / tired, 195 runs: every word equals the static reading
(e.g. mode 0 L0 M1 calm `0x1c01ff`; mode 1 L2 M30 (1, 0x1c) `0x8e001ff`; mode 2 L2 M30 (1, 0x25) `0x100381ff`;
mode 4 L2 M5 (10, 0xaf) `0x70001ff`; (10, 0xaf) on L2 M30 itself adds nothing; mode 3 = mode 4).

### 1.1 What `e+0xcb0c` is -- R: the index of the object Ahtal-Ka is CARRYING (0 / 1 / 2), 4 = none

* **Spawn**: the ctor `0x10b2db0` (base ctor `0x6c388`, then the vtable store at `0x10b2dd0`) zeroes `e+0xcb00..+0xd4e0` (`0x13ecbfc`, 0x9e0 bytes) then writes **`e+0xcb0c = 4`** (`0x10b2e3c`) and the
  two "pending object" bytes **`e+0xd470 = e+0xd471 = 4`** (`strh 0x404`, `0x10b2e58`); unless `e+0x1405` bit 3
  (`0x10b2f14`), it registers itself in the fight's global (GOT `0x1832980` -> `G`; `0x10ae730`: `G+0x38 = e`) and sets the
  three object slots' state `G+0x3c / +0x3d / +0x3e = 1` (`0x10ae6c0(G, 0 / 1 / 2, 1, 1)`, `0x10b2f44..0x10b2f6c`).
* **The setter** `0x10b62f4(e, k)`: `e+0xcb0c = k`; unless k == 4, `0x10ae6c0(G, k, 2, 1)` -- slot k's state = **2**
  after `G+0xb0+4k` (that slot's free-standing object, if any) is stopped through its vt+0x148 (`0x10ae6e0..0x10ae704`).
  Three callers, each committing a PENDING byte and then clearing it to 4:
  `0x10bd2e8` (in `0x10bd064`, the **(1, 3)** action body: `e+0xd470`, at the `0xb0968(e, 0, 0, ..)` frame),
  `0x10bd9f0` (in `0x10bd6c0`, **(1, 0x12)**: `e+0xd471`), `0x10c00e0` (in `0x10bfd64`, **(1, 0x13)**: `e+0xd471`, after
  setting L2 M38 / L2 M20 by its argument -- `0x226` / `0x214`).
* **The pending bytes** are written by the AI script: EMC op 0xa3 (b1, b2) = vt+0x218 (states-em088_00.md 4.1) ->
  `0x10bae18`: **b1 1 -> `e+0xd470 = b2`, b1 3 -> `e+0xd471 = b2`** (2 -> `+0xd3fc`, 4 -> `+0xd472`, 5..8 -> `+0xd434..7`,
  9 -> `+0xd499 = 1`, 10 -> `+0xd438`; table `0x10bae38`); and `0x10c0cfc` (`e+0xd471 = cb0c` or 4). vt+0x1f4 (the action
  main, `0x10b3f74`) copies the pending one into `e+0xd3e1` every frame (`d471 != 4 ? d471 : d470`).
* **Back to 4 (dropped)**: `0x10bb7c0` (stores 4 at `0x10bb8cc` after spawning the object back into the world with
  `0x10aebac(G, ..)` -- slot state 3, a unit of type `0x17e` at `G+0xb0+4k` -- with the pose of the motion it is passed,
  L2 M17 from `0x10b5290`); `0x10b52b4` in vt+0x204 (action start) after `0x10b613c(e, k, 1)`. Emulated action starts
  (all 16 x 256 (status, number), `actstart.py`, `0x10b4828`): **(0, 2), (1, 2) and every ailment / reaction / death
  start -- (10, 0x1d / 0x1e / 0x1f / 0x20 / 0x2a / 0x2b / 0x44 / 0x45 / 0x94 / 0x9b / 0xa1 / 0xa9 / 0xab / 0xbb..0xbe / 0xc5)
  and (11, *) -- leave `e+0xcb0c = 4` and spawn the object (`0x10aebac`)**; the status-10/11 ones also reset both pending
  bytes to 4. (10, 0xa7) / (10, 0xaf) and a handful of status-1 / 7 starts fault in the harness on a stubbed return
  (NR by run; (10, 0xaf) statically: pending bytes = 4,4 at `0x10b5150`, a counter `e+0xd48d` (cap 4), `0x6f62c`).
* **Where the objects are**: `G+0x50 + 16k` (a position: the slot's spot; the class aims at it -- `P+0x1d0` = it, e.g.
  `0x10bfe1c`), `G+0x3c+k` the state (1 at its spot, 2 carried, 3 thrown/free as the unit at `G+0xb0+4k`).
* **What the three objects are in the game, and which is which: NR.** The class ties them to his silk threads (§3:
  every thread on L2 ends at the carried object), so INFERRED: the three things Ahtal-Ka hauls on silk. Nothing in the ROM
  read here names them.
* The fight's stage bytes `G+0x31 / +0x32` (states-em088_00.md 4.2) do not enter the word; vt+0x1dc uses `e+0xcb0c`
  only to pick a column of three floats for `e+0xd4a0 / +0xd4a4 / +0xd4a8` (`0x10b3d2c`, reached from `0x10b3820`
  while `G+0x31 == 2` and `G+0x32` is 3, 5 or 6) -- not an effect input.

So `e+0xcb0c` is NOT a fight phase and NOT the Neset's machine: it is the carried object, set by the AI's pick and
the (1, 3) / (1, 0x12) / (1, 0x13) carry actions, and cleared by every ailment, reaction, death and the throw.

### 1.2 `0x6d1b4` (the +0x13c base of uEm087_00 / uEm088_00) -- R: its per-motion lists do NOT write the word

`0xca170`, then two lists of 0x2c-byte entries at `[[e+0xcacc]+0]` / `[[e+0xcacc]+4]`, each entry taken when its
`+8 == 0xd` and `+4 ==` the motion id: entry type `[+0]` 1 / 2 -> **vt+0x488**(e, u32 +0x1c, s32 +0x20, u32 +0x24,
u32 +0x28), 3 -> `0xb07b4(e, f +0x1c)` (motion rate), else **vt+0x484**(e, list, index, entry).

* vt+0x484 = `0x6d594` (`bx lr`) on both classes.
* **vt+0x488 differs: uEm087_00 `0x6d598`, but uEm088_00 `0x10bb518`** (his own; the states agent corrected the
  rom-map row today and left it NOT READ). `0x10bb518`: `0x70f40` / `0x70fa0` (the entry's descriptors), a search of
  its record for halfword `0x82`, which ORs `0x1000` into r3 -- then tails into `0x6d598`. `0x6d598`: by its 5th
  argument's bits 0 / 1, `[e+0x1428]+0xb08 = 1` and `+0xb0a` = halfword `e+0xcaf6` / `+0xcaf8`; then `b 0x7db70`.
* **Negative, with its control** (`closure.py 13f4 <fn>`, every `#0x13f4` immediate in the direct-call closure):
  `0x10bb518` (38 functions) and `0x6d598` (37) -- none; `0xb07b4` (3) -- none. The same scan finds the three writes in
  `0x10bc340` and the one in `0xca170` (the controls). Indirect calls in those closures (17 `blx` / `bx`, on objects
  that are not the enemy's vtable: `[P+0x5c30]`'s vt+0x14 at `0x7dc04`, etc.) are not followed; PLT imports are libm.
* So the word = `0xca170`'s base, then the class's ORs. (What `0x7db70` builds: NR here -- rom-map calls Uragaan's
  boulders through it shells.)

### 1.3 The transcription (psl-mask.js, in the style of the entries there)

```js
// AHTAL-KA (em088_00), uEm088_00 vtable +0x13c = 0x10bc340, READ whole (..0x10bc408) and emulated (dev/em088_00-effects-
// spec.md 1; control: Garuga's 0xdb0d10 reproduced). It calls 0x6d1b4 -- the base 0xca170, then the per-motion lists of
// the Ahtal layer, whose vt+0x488 / +0x484 / 0xb07b4 calls write no +0x13f4 (closure scan, control 0xca170) -- then:
//   * EVERY motion: e+0xcb0c, the object he CARRIES (0 / 1 / 2; 4 = none, the spawn value; the setter 0x10b62f4 from the
//     AI's pending bytes e+0xd470 / +0xd471 in the (1, 3) / (1, 0x12) / (1, 0x13) carries; every ailment / reaction /
//     death start drops it): 0 -> bits 18-20, 1 -> bits 21-23, 2 -> bits 15-17 (table 0x16a37f4); none -> nothing.
//     state.carry (null = none).
//   * L2 M30 (0x21e), status 1: 0x1c / 0x1d / 0x22 / 0x23 -> bit 27, 0x1e / 0x1f / 0x24 / 0x25 -> bit 28 (table
//     0x16a3800, mask 0x3cf): u 451 / u 452. Each pair is a (1, n) start and its (1, n + 1) hold, both play L2 M30
//     (0x10bcc9c / 0x10bccf0 / 0x10bcd58 / 0x10bce1c, then 0x10c03d8).
//   * every other motion, (10, 0xaf) -> bits 24-26 (L3 M3 -> L3 M5 -> L3 M7: u 460 / u 461 / u 462).
const EM088_L2M30 = [0x8000000, 0x8000000, 0x10000000, 0x10000000, 0, 0, 0x8000000, 0x8000000, 0x10000000, 0x10000000];
const EM088_CARRY = [0x1c0000, 0xe00000, 0x38000];
function em088_00(motion, action, state){
  let w = EM088_CARRY[state.carry] || 0;
  if (motion === 0x21e){
    if (action && action[0] === 1 && action[1] >= 0x1c && action[1] <= 0x25) w |= EM088_L2M30[action[1] - 0x1c];
  } else if (action && action[0] === 10 && action[1] === 0xaf) w |= 0x7000000;
  return w;
}
```

Add `em088_00` to `CLASS_MASK` and `PSL_MASK_MONSTERS`. **New viewer input: `state.carry`** -- a "Carrying" control
for Ahtal-Ka with four values: **none** (the default: the spawn value, and what every ailment / death / reaction plays
under), **object 0**, **object 1**, **object 2** (unnamed: 1.1). It also sets which object his silk threads end on (§3),
so one control serves both. CLIP_ACTIONS:

```js
  // AHTAL-KA, L2 M30: the eight status-1 plays (1, 0x1c..0x1f / 0x22..0x25); pairs (n, n + 1) share a bit (u 451 bit 27,
  // u 452 bit 28). Which the AI picks: NR. L3 M3..M8: only (10, 0xaf) fires bits 24-26 (u 460 / 461 / 462); the same
  // clips are also played by (10, 0x94) both sides, (10, 0xa7), (10, 0xbb), (10, 0xbc) (states-em088_00.md 3.3).
  em088_00: {
    '2|Motion[30]': [{ action: [1, 0x1c] }, { action: [1, 0x1e] }],
    '3|Motion[3]':  [{ action: [10, 0xaf] }, { action: [10, 0x94] }, { action: [10, 0xa7] }],
    '3|Motion[5]':  [{ action: [10, 0xaf] }, { action: [10, 0x94] }, { action: [10, 0xa7] }],
    '3|Motion[7]':  [{ action: [10, 0xaf] }, { action: [10, 0x94] }, { action: [10, 0xa7] }],
    '3|Motion[4]':  [{ action: [10, 0x94] }],
    '3|Motion[6]':  [{ action: [10, 0x94] }, { action: [10, 0xbb] }],
    '3|Motion[8]':  [{ action: [10, 0x94] }, { action: [10, 0xbc] }],
  },
```

(L3 M4 / M6 / M8 are the (10, 0x94) direction-1 script `0x1809030`'s; (10, 0xaf)'s script `0x18090b0` plays only
M3 -> M5 -> M7, so on M4 / M6 / M8 bits 24-26 never fire in a ROM play -- see §2.)

## 2. What the word changes -- whole-block plan (142 file-mask -> 206 whole)

`python add_effects.py em088_00` (plan: 142 motion bits over 49 motions, 41 records in, 41 already are) and
`planrows.py em088_00 [--whole]`, classified by `classify88.py` against 1.3. Every binding not listed sits on bits 0-5
and stays always-on (83).

**Turned ON, always** (bits 0-5 outside the file mask, 23):

| binding | record |
|---|---|
| L2 M4 b3 f311-389 | u 290 (`em088_00_014`) |
| L2 M12 b0 f7-74; L2 M43 b0 f14-184; L2 M44 b2 f123-154; L2 M45 b0 f0-36 | u 423 (`em088_00_017`) |
| L2 M14 b4 f150 | **u 540 -- not exported** (`em088_00_000`) |
| L2 M17 b1 f132; L3 M7 b0 f60 | c 6 (`em087_00_004`) |
| L3 M3 b0 f20 | c 5 (`em087_00_004`) |
| L2 M20 b3 f17-120 | u 206 (`em087_00_004`) |
| L2 M33 b0 f0-24 | **u 450 -- not exported** (`em088_00_016`) |
| L2 M39 b5 f218 | **u 207 -- not exported** (`em088_00_002`) |
| L2 M40 b0 f21, L2 M42 b0 f21, L2 M43 b1 f200, L2 M46 b2 f174 | u 250 (`em087_00_002`) |
| L2 M42 b1 f69 / b2 f88 | u 221 / u 220 (`em088_00_000`) |
| L2 M43 b2 f205, L2 M46 b0 f182 | u 260 (`em088_00_004`) |
| L2 M44 b0 f150 / b1 f125-154; L2 M45 b1 f0-36 | u 420 / u 421 (`em088_00_017`) |

**Gated by the carried object** (bits 15-23): **59 in the file mask fire together today, in every play -- the game
fires one object's group, or none while he carries nothing**; 31 more outside the mask come in:

| object | in the mask (fire today) | outside (come in) |
|---|---|---|
| 0 (bits 18-20) | 18: L2 M1 b18, M4 b18-20, M6 b18/19, M8 b18/19, M9 b19, M10 b18/19, M12 b19, M16 b18, M17 b19, M23 b18, M36 b18, M37 b18, M39 b18 | 11: L2 M2 b18 u 250, M3 b18 u 250, M9 b18 u 250, M11 b18 u 250 / b19 u 210, M12 b18 u 422, M17 b20 u 250, M20 b18 u 216, M23 b19 u 211, M39 b19 u 211 / b20 u 216 |
| 1 (bits 21-23) | 18: L2 M1 b21, M4 b21-23, M6 b21/22, M8 b21/22, M10 b21/22, M12 b21/22, M16 b21, M23 b21, M36 b21, M37 b21, M39 b21/22 | 12: L2 M2 b21 u 250, M3 b21 u 250, M10 b23 u 422, M11 b21 u 250 / b22 u 220, M12 b23 u 422, M17 b22 u 220 / b23 u 250, M20 b21 u 226, **M22 b21 u 229 (not exported, `em056_00_038`)**, **M23 b22 u 222 (not exported)**, M39 b23 u 226 |
| 2 (bits 15-17) | 23: L2 M1 b15, M4 b15-17, M6 b15/16, M8 b15/16, M9 b15/16, M10 b15, M11 b16, M16 b15, M17 b15, M23 b15/16, M28 b15, M36 b15/16, M37 b15, M39 b15-17 | 8: L2 M2 b15 u 250, M3 b15 u 250, M11 b15 u 250, M12 b15 u 201, M17 b17 u 250, M20 b15 u 206, M29 b15 u 250, M35 b15 u 250 |

(The records are the three objects' forms of one attack: u 200 / 210 / 220, u 201 / 211 / 221, u 203 / 213 / 223,
u 206 / 216 / 226, u 422 on b18 / b23, u 423 on b15 / b18 / b21, u 250 on all three. I: the attack's look per object.)

**Gated by the action** (outside the mask, records not exported):

| binding | record | fires on |
|---|---|---|
| L2 M30 b27 f0-24 | u 451 (`em088_00_016`) | (1, 0x1c / 0x1d / 0x22 / 0x23) |
| L2 M30 b28 f0-24 | u 452 (`em088_00_016`) | (1, 0x1e / 0x1f / 0x24 / 0x25) |
| L3 M3 b24 f3 / b25 f4-94, L3 M5 b24 f0-170, L3 M7 b24 f42 | u 460 / u 461 / u 461 / u 462 (`em088_00_019`) | (10, 0xaf) |

**Named but never enabled in a ROM play**: L3 M4 b24 / b25, L3 M6 b24, L3 M8 b24 (u 460 / 461 / 461 / 462): bits 24-26
need (10, 0xaf), whose script plays only L3 M3 / M5 / M7 (states-em088_00.md 3.3; L3 M4 / M6 / M8 come from (10, 0x94),
(10, 0xbb), (10, 0xbc)). If a scene forces (10, 0xaf) on them, the word would enable them -- do not offer it.

**Turned OFF**: none (no arm clears).

**Records to export** with the `--apply` (all SEQUENCE, all on whole-block rows): **u 207, u 222, u 229, u 450, u 451,
u 452, u 460, u 461, u 462, u 540** -- the survey's ten. u 229's file is `em056_00_038` (Nibelsnarf's): the pel names it.

**What the viewer shows meanwhile**: nothing new until the soak is green -- **29 of his 49 bound motions refuse today**
(`0x44158 -> 0x441cc` x21, `0xaf859c` x7, `0x9bbb4c` mode 3 x1; rom-map rows), and efx/vectors has no `add_em088_00_*`
set. That record / lift pass is still his first job (survey).

## 3. Class records -- what his class requests itself

### 3.0 The table and the sites (R)

* vt+0x1d0 = `0x10bc414`: id >= 1000 -> table **`0x16a376c`** (GOT literal `0x10bc440`) `[id - 1000]` -> `0x6feb8(e, 2, key)`
  (UNIQUE); id < 1000 -> base `0xa3ddc`. vt+0x1cc is the base `0xa3dc0` (no c table). Ids 1001..1030 ->
  `{120, 130, 10, 11, 12, 13, 14, 15, 20, 20, 340, 343, 342, 341, 341, 342, 343, 344, 402, 401, 400, 403, 404, 405, 406,
  407, 408, 409, 410, 420}`; word 31 onward is other data (`0xffff7fff ..`). Extent from the callers: the highest id any
  site uses is 1030 (3.4).
* **Request loads in his band** (`0x10b2f84..0x10c1fc4`: vt+0 at the low end, vt+0x1ac `0x10c1fc0` at the top; the
  next band's code is referenced from vtables at `0x1809xxx`): exactly **four** `ldr rX, [vt, #0x1d0]` + `blx`:
  `0x10b7704` (id 1001), `0x10b7780` (1002), `0x10bb790` (in **`0x10bb5f0`**, the thread slot request -- id in r2,
  one caller `0x10ba408`), `0x10be204` (1030). The other `#0x1d0` operands are `P+0x1d0` (the target position) and
  `vldr`s; `0x10b5770` is `P+0x1d0`. No branch into `0xa499c` / `0xa4354` / `0x6feb8` / `0x6fdd4` from the band
  (`0x6feb8`'s only band caller is the override itself).
* **The board's two class_sites.py hits are not requests**: "1028 -> 409" is `movw r1, #0x404` at `0x10b514c` -- the
  halfword `0x0404` stored to `e+0xd470` (both pending bytes = 4); "1030 -> 420" is in `0x10bdba4` and IS a request
  (3.4), found by luck of the immediate. The key-overlap match (`0x16a376c` -> uEm088_00) is now confirmed by the
  vtable: `0x1804328+0x1d0 = 0x10bc414` loads that table.
* **class-requests.json's uEm087_00 entry carries the em007 trap**: vtable recorded as `0x17f9ae8` (4 bytes low;
  the class's vt is `0x17f9aec`, whose +0x13c is `0x10ad838`), so its two "+0x1d0" tables are the c (+0x1cc
  `0x10ad9fc`) and u (+0x1d0 `0x10ada2c`) tables. And class-request-sites.json's "uEm087_00 fn 0x10b4828 1028 -> 54"
  is the same `0x404` halfword, in **uEm088_00's** vt+0x204 (`0x10b4828` is above uEm087_00's last method).

### 3.1 u 120 / u 130 -- the held pair (R; states-em088_00.md 4.3 read them first, this agrees)

| id | key | record | requested | held at | stop |
|---|---|---|---|---|---|
| 1001 | **u 120** | `em088_00_012`, no joint, placement mode 4 (camera-attached), end 1 | vt+0x208 `0x10b7644`, every frame its handle is empty (`0x10b7704`) | `e+0xd4ac` | `0x329c40(h, 0)` (graceful) on **L2 M28** (`0x10b76a8`) and while vt+0x3f4 (`0x7fed4`: group 11 / 14 / (12, 0xff), dying) |
| 1002 | **u 130** | `em088_00_012`, no joint, mode 0, end 1 | the same pass, while **enraged** (`0x81670`, `0x10b7780`) | `e+0xd4b0` | `0x329c40(h, 0)` when calm (`0x10b7744`), on L2 M28, dying |

Both are re-requested the next frame after a stop if the condition holds again (handle cleared). The (1, 0x10)
action start (rage end, L2 M28) also stops both (states-em088_00.md 4.5). u 1120 / 1121 (the shared puff) never fire
(`e+0xb7d2 = 0`, rom-map `0x10b32b0`) -- u 130 is his rage effect.

### 3.2 The silk threads -- vt+0x208's head `0x10b7798` (R, emulated per frame)

`0x10b7798` keeps **20 thread slots** at `e+0xcb20 + 0x70k` (k 0..19): `+0x0` handle, `+0x4` active (cleared at every
call, `0x10b77b4..0x10b78b4`), `+0x8` id, `+0xc` start kind / `+0xd` start param, `+0x10..` / `+0x20..` start
position / offset, `+0x30` end kind / `+0x31` end param, `+0x40..` / `+0x50..` end position / offset, `+0x60` stop flag.
A switch on the current motion (L2 M4..M46, `0x10b78f0`) and the carried object (`e+0xcb0c`, or the pending `e+0xd3e1`
when it is 4, `0x10b78e8`) marks this frame's active slots. Then the slot loop (`0x10b9f88..0x10ba540`): an active
slot with no handle is requested through **`0x10bb5f0(e, k, id, &A, &B)`** (it stops the old handle `0x329c40(h, 1)`,
copies the area byte, `+0xb648 = 3`, and stores the new handle at the slot); every frame it re-aims the effect from A
to B -- **yaw / pitch = atan2 of B - A** (x 10430.378, as u16, back to radians x 9.587e-5) and **`[unit+0x150]+0x68 =
|B - A| / 920.0`** (I: the stretch along the thread; `0x329c9c` / `0x8a4dfc` NR) -- an inactive slot with a handle is
stopped, **`0x329c40(h, 1)` if its `+0x60` byte is 1, else `(h, 0)`** (`0x10b9fe8..0x10ba01c`). So every record here is
**held for exactly its window and stopped when the window closes** -- a two-point stretched effect.

Point kinds (R, `0x10b9fb8` / `0x10ba0e0` tables): **start** 1 = his joint `+0xd` (`0xc164c`), 2 = his joint + local
offset (`0xc15a4`), 3 = a fixed world point `+0x10`. **End** 1 = his joint `+0x31`; 2 = his joint + offset; **3 = the
object k = `+0x31`**: at its spot `G+0x50+16k` (state 1), at **his joint 0x82** while carried (state 2), or the free unit
`[G+0xb0+4k]+0x40` (state 3) (`0x10ae8d0`); **4 = an Ahtal-Neset joint** (`0x10ae780`: `[G+0x34]` -> `0xc164c`);
5 / 6 = the object handle `e+0xd450 + 4p` / `e+0xd420 + 4p`, its `+0x40`; 7 = an Ahtal-Neset joint + offset
(`0x10ae790` -> `0xc15a4`); 8 = a fixed point `+0x40`.

**Correction (effects-runtime agent, 2026-10-15; rom-map Withdrawn table, trap 56):** the end kinds above were numbered in
the handlers' address order; the jump table `0x10ba100` gives **4 = the point `+0x40`**, **7 = Ahtal-Neset's joint** (no
offset), **8 = Neset joint + offset `+0x50`**. So u 340 / 342 / 343 / 344 end at the point `e+0xd410` (copied into `+0x40`;
its writer not found), not "Neset joint 0"; u 400..409 end at Neset joints 16 / 12 / 3 without an offset; u 410 ends at Neset
joint + (0, 200, 700). The u 341 web threads START at the same `e+0xd410`. And the switch's DEFAULT arm (`0x10b7f60`) gives
u 11 in slot 0 on every motion outside L2 M4..M46, every list's. The thread runtime: docs/render/class-threads.js.

**Frame model** (control): `0xb0974(e, 193.0)` fires on the tick that reaches frame 193 and `0xb0968(e, 1, 0, 218, 0)`
from frame 218 -- the two values rom-map's Uragaan rows read from his machine. (A first pass set `e+0x4f4` to 1.0 and
every mode-1 / 3 window read false: `+0x4f4 > 0` returns 0 from `0x72824` on those modes. The sweep was rerun with 0.)
Windows below are game frames (the tick reaching the frame).

| id | key | slot | from -> to | motions (frames) | condition | stop |
|---|---|---|---|---|---|---|
| 1004 | **u 11** | 0 or 1 | joint 149 -> **carried object** | L2 M1-M4, M9, M11, M14-M16, M20-M36, M38, M40, M42, M44-M48 whole; M6 / M8 from 100; M10 / M12 from 70; M17 to 159; M39 from 390; M41 / M43 70-89 and from 140 | carrying (or pending) 0 / 1 / 2 | hard (1); M6 / M8 / M10 / M12 / M17 graceful (0) |
| 1003 | **u 10** | 1 / 2 | joint 149 -> carried object | **L2 M13 from 50**; **L2 M19 / M37 30-69** | carrying; on M19 / M37 under (1, 5) / (1, 0xd) (`0x10b7c34`: status 1, `n \| 8 == 0xd`) **u 11 over f1-69 instead** | hard |
| 1005 | **u 12** | 3 | joint 149 -> **joint 5** | L2 M5 whole; M6 to 99; M10 to 69; M19 from 70; M41 to 69; M43 90-139 | carrying | hard |
| 1007 | **u 14** | 4 | joint 5 -> carried object | with u 12, the same windows | carrying | hard |
| 1006 | **u 13** | 5 | joint 149 -> **joint 9** | L2 M7 whole; M8 to 99; M12 to 69; M37 from 70; M39 to 389; M41 90-139; M43 to 69 | carrying | hard |
| 1008 | **u 15** | 6 | joint 9 -> carried object | with u 13 | carrying | hard |
| 1015 | **u 341** | 10..14 | world point -> web anchor `e+0xd420+4p` (p 0..4) | every motion, carrying or not, while that anchor exists | the 5-anchor web (3.3) | graceful |
| 1014 | **u 341** | 15..17 | world point -> web anchor `e+0xd450+4p` (p 0..2) | the same | the 3 / 4-anchor web (3.3) | graceful |
| 1011 | **u 340** | 19 | joint 149 -> **Neset joint 0** | every motion | any `e+0xd450..+0xd45c` anchor (one is enough, `d45c` alone too); with some anchors' object byte `+4` == 1 and others not, L2 M35 instead runs the u 343 / 342 / 344 row below | hard |
| 1011 | **u 340** | 7 | joint 149 -> Neset joint 0 | L2 M2 / M3 to 79, M16 to 64, M17 to 179 | a `e+0xd420..` anchor **and** `e+0xd408` | hard |
| 1011 | **u 340** | 7 | joint 149 -> Neset joint 0 | **L2 M30** whole | (1, 0x1c..0x1f / 0x22..0x25), no other input | hard |
| 1012 / 1013 | **u 343 / u 342** | 5 / 8 | joint 149 -> joint 9 / joint 9 -> Neset joint 0 | L2 M2 80-99 | `d420` anchor + `e+0xd408` | graceful |
| 1016 / 1017 | **u 342 / u 343** | 3 / 9 | joint 149 -> joint 5 / joint 5 -> Neset joint 0 | L2 M3 80-99, L2 M16 65-82 | `d420` anchor + `e+0xd408` | graceful |
| 1012 / 1013, then 1018 | **u 343 / u 342**, then **u 344** | 5 / 8, then 19 | 149 -> j9 -> Neset j0, then 149 -> Neset j0 | **L2 M35 90-179**, then **from 180** | `d450` anchors in a mixed state (`0x43a388`: anchor `+4` byte) + `e+0xd408` | hard |
| 1019 / 1020 / 1021 | **u 402 / 401 / 400** | 0 / 1 / 2 | joint 149 -> Neset joint 16 / 12 / 3 (+ offset) | L2 M27 whole; **L2 M47 to 39**; **L2 M26 by the action's timer `P+0x1bc`: u 402 from 15, u 401 from 45, u 400 from 75** (`0x10b9ab0..0x10b9b9c`) | **(1, 0x21)**, carrying or not | hard |
| 1022 | **u 403** | 3 | joint 149 -> joint 5 | **L2 M47 from 40** | (1, 0x21) | hard |
| 1023 / 1024 / 1025 | **u 404 / 405 / 406** | 4 / 5 / 6 | joint 5 -> Neset joint 3 / 12 / 16 (+ offset) | L2 M47 from 40 | (1, 0x21) | hard |
| 1028 / 1027 / 1026 | **u 409 / 408 / 407** | 0 / 1 / 2 | joint 149 -> Neset joint 16 / 12 / 3 | L2 M48 whole | (1, 0x21) | graceful |
| 1029 | **u 410** | 7 | joint 149 -> a fixed point (kind 8; the constants written at `0x10b9a70..0x10b9aa8`) | **L2 M13 from 50** (beside u 10 when carrying) | (1, 0x21) | hard |

Controls / method for this table: every L2 motion x every frame x carried object 0 / 1 / 2 / none, then the inputs
the pass reads (`UC_HOOK_MEM_READ` over the run: `e+0x73e0/1` action, `e+0xcb0c` / `+0xd3e1`, the anchors `e+0xd420..`,
`+0xd450..`, `e+0xd408`, `P+0x518`, `P+0x1bc`, `G+0x3c+k` / `G+0x50+16k`) varied one at a time: the 12 actions the pass
tests (`0x6fe88(e, 1, n)` for n 0x1c..0x25 / 0x21; status 1 n 5 / 0xd at `0x10b7c34`), anchors present / absent and
their `+4` state bytes (16 combinations, `0x43a388` run natively), `e+0xd408` 0 / 1, `P+0x1bc` 0 / 15 / 40 / 80 / 150 /
400. The carried object changes only the END of the object threads (their `+0x31` = the object); "carrying none" (4,
with no pending object) removes u 10 / 11 / 12 / 13 / 14 / 15 and nothing else. (Positive control of the input scan:
it lists `P+0x518` -- u 130's enraged test -- and `e+0x73e0`, which the static read names.)

### 3.4 u 420 -- one-shot (R)

`0x10be1fc` (id **1030 -> u 420**, `em088_00_014`), in **(1, 0x21)**'s body `0x10bdba4` (status-1 table entry
`0x10bce0c`), phase 9: during **L2 M14** (set in phase 8, `0x10bdfb8`, facing the Neset `0x10ae740`), at
`0xb0968(e, 0, 0, 230.0, 0)` -- **the tick reaching frame 230**. The handle is not stored (`blx` result dropped): it plays
its own life. (1, 0x21)'s phases: L2 M25 -> L2 M26 (x3, `P+0x1a2`) -> L2 M27 -> L2 M47 -> (`G+0xcc = 1`, wait `G+0xcd`)
-> L2 M48 -> L2 M13 (facing the Neset) -> L2 M14, u 420 at f230 -> `G+0xca = 1`. I: his "build / bind the Neset" set
piece -- the threads 1019..1029 tie him to Neset joints 3 / 12 / 16 through it.

### 3.5 u 20 (ids 1009 / 1010) -- no site

Neither `0x3f1` nor `0x3f2` occurs as an immediate in his band, uEm087_00's band or the shared layer
`0x6b000..0x6e000`; control: the same scan finds 28 of the 30 ids (every other one). The id could still come from a
data table: **NR**, named rather than written off.

### 3.3 The webs -- the anchor handles `e+0xd420..+0xd430` (5) and `e+0xd450..+0xd45c` (4) (R, emulated)

Emulated action starts with the spawn `0x48b884` answering a sentinel handle (`actw2.py`, statuses 0 / 1 / 2 / 7 x
numbers 0..0x3f): **(1, 0x1d) and (1, 0x23) fill all five `e+0xd420..+0xd430`; (1, 0x1f) fills `e+0xd450..+0xd458`
(three); (1, 0x25) all four `e+0xd450..+0xd45c`.** Those are the hold halves of the L2 M30 pairs (1.3): so L2 M30 is the
web being spun, u 451 (bit 27) on the five-anchor web, u 452 (bit 28) on the three / four-anchor one, and u 340 runs from
his spinneret (joint 149) to the Neset while he spins it. The anchors are released (`0x438204` / `0x43a39c` /
`0x4380e4` / `0x43a374`) by other action starts (`0x10b4a00..`, `0x10b5310..`, `0x10b59e8`, `0x10b5be4`: which actions,
NR). Each anchor then keeps a **u 341** thread from its fixed point to the anchor object on every motion (graceful stop
when it goes), and the four-anchor web adds the **u 340** spinneret-to-Neset thread (slot 19). The anchor objects'
type (unit kinds `0x17d` / `0x17e` / `0x180` are created in this class through `0x48b884`) and their `+4` state byte:
NR. `e+0xd408` (u 340 / 342 / 343 on L2 M2 / M3 / M16 / M17 with the five-anchor web): cleared every frame by vt+0x1dc
(`0x10b386c`); **its writer was not found** (no other `#0xd408` / `#0xd400` base in the band) -- NR.

The viewer has no Neset, no anchors and no carried object model, so these rows need positions it does not have; §5 says
what it can show.

## 4. Ahtal-Neset (em087_00) -- vt+0x13c `0x10ad838` -- R, emulated

    0x6d1b4(e, motion)                         -- the same Ahtal layer (1.2); his vt+0x488 is 0x6d598
    +0x13f4 |= 0x3f8000 | 0xc00000             -- bits 15-23, EVERY motion (0x10ad850 / 0x10ad854)
    switch (motion - 0x303), 14 entries (L3 M3..M16): part work only, no +0x13f4 (rom-map row, the survey's read)

Emulated: 15 motions across L0 / L1 / L2 / L3 x calm / enraged / tired -> **`0xff81ff` / `0xff8e3f` / `0xfff03f`** on
every one (base | `0xff8000`). Transcription: `em087_00: () => 0xff8000` (a new `const em087_00 = () => 0xff8000;` with
the comment above), added to CLASS_MASK / PSL_MASK_MONSTERS. No viewer input.

Binding consequence (`planrows.py em087_00 [--whole]`: 428 file-mask -> 524 whole): **96 out of the mask come in, 82
always** (bits 0-5 and 15-23: c 0 / 1 / 2 / 3 / 10 / 12 / 13 / 14 / 16 / 17 / 31 / 100 / 101 / 102 / 103, and **u 200
f53-313 (b3) / u 203 f342-540 (b20) on L2 M63 -- the two not exported**, `em088_00_013`) **and 14 calm-only** (bits 6-7:
c 100 / 101 / 102 / 103 / 110 on L0 M7, L0 M20, L2 M38 / M48 / M75 / M77 / M79 / M81 / M83). In the mask: 374 always, 54
calm-only. **His PSL names no bit 9-14 and none 24-31**, so nothing is gated by rage / tired other than the calm group,
and nothing is never-enabled. Whether the Neset is ever enraged or tired (the calm group then drops): NR. L0 M16 / L0
M20 rows: the viewer has no such clip (plan). Records to export: **u 200, u 203**. His soak refuses 37 of 77 (rom-map
`0x9b65b0`, `0x44158`): the record / lift pass first, as for Ahtal-Ka.

## 5. What to implement, in order

1. **Record and lift first** (both monsters): Ahtal-Ka 29 / 49 and Ahtal-Neset 37 / 77 soak refusals; no
   `add_em088_00_*` / `add_em087_00_*` set exists. Nothing below shows while those stand.
2. **psl-mask.js**: `em088_00` (1.3) and `em087_00` (§4) into CLASS_MASK and PSL_MASK_MONSTERS; the em088_00
   CLIP_ACTIONS (1.3). Then `add_effects.py em088_00 --apply` / `em087_00 --apply` regenerate their CLIP_EFFECTS from the
   whole blocks and export **Ahtal-Ka u 207, 222, 229, 450, 451, 452, 460, 461, 462, 540** and **Ahtal-Neset u 200,
   203**.
3. **The "Carrying" control** (Ahtal-Ka): none / object 0 / object 1 / object 2, default none, feeding `state.carry`.
   With it the 59 group bindings stop firing three-at-once (today's behaviour) and fire one object's set, or none.
4. **u 120 and u 130** (export both, UNIQUE): u 120 held while he is alive and not on L2 M28 (camera-attached, mode 4 --
   the camera mode-4 placement row in rom-map); u 130 held while the rage toggle is on, stopped (graceful) when it goes
   off and on L2 M28. These need nothing the viewer lacks.
5. **The self-contained threads** (export u 12, u 13; UNIQUE): joint 149 -> joint 5 (u 12) and joint 149 -> joint 9
   (u 13) are between two of his own joints, so the viewer can draw them now, on the windows of §3.2, ONLY while
   "Carrying" is not none -- held, re-aimed every frame from A to B, length `|B - A| / 920`, hard-stopped at the window's
   end. This needs a two-point (stretched, re-aimed) effect owner in the runtime -- the same shape as a beam; the
   thread geometry `0x10ba418..0x10ba528` (`0x329c9c`, `0x8a4dfc`) is not lifted.
6. **Named, not drawable yet** (say so in the viewer, as with other named refusals): the object threads u 10 / 11 / 14 /
   15 (need the carried object's position: at its spot, or at his joint 0x82 when carried -- 3.2's kind 3 -- so u 11 /
   14 / 15 COULD be drawn to joint 0x82 when "Carrying" is set and the object is held: R that state 2 uses joint 0x82),
   the web threads u 341 / u 340 and the Neset threads u 340 / 342 / 343 / 344 / 400..410 (need the Neset and the
   anchors), u 420 (L2 M14 f230 under (1, 0x21): placeable now as a one-shot -- record `em088_00_014`, no joint read
   here -- but its play only exists inside the Neset set piece).
7. **Not reachable**: u 20 (ids 1009 / 1010: no site, 3.5).

## 6. Not read

* What the three carried objects are (1.1); the meaning of the anchors' `+4` byte and of `e+0xd408` and its writer;
  which action starts release the anchors; what (1, 3) / (1, 0x12) / (1, 0x13) / (1, 0x21) / (10, 0xaf) are called in
  the game (I: (1, 0x21) binds the Neset).
* `0x7db70` (the Ahtal layer's list tail), `0x329c9c` / `0x8a4dfc` (the thread re-aim), `0x48b884`'s unit kinds
  `0x17d` / `0x17e` / `0x180`.
* Who issues (1, 0x1c..0x25) and (1, 0x21) (EMC streams), so which web a given L2 M30 play builds.
* Whether a data table carries id 1009 / 1010 (u 20).
* Actions whose start faults in the harness on a stubbed return ((1, 1 / 6 / 0x10 / 0x11 / 0x1c / 0x1e / 0x20 / 0x22 /
  0x24), (7, 0x10 / 0x1b..0x1e / 0x32), (10, 0xa7 / 0xaf)): their effect on `e+0xcb0c` was not run (the anchors' writes
  for 0x1d / 0x1f / 0x23 / 0x25 were).

## 7. Rows added to rom-map.md

The section "Ahtal-Ka -- the carried object, the silk threads, the class requests (research agent, 2026-10-15)", the
upgrades of the `0x10bc340`, `0x6d1b4` and `0x10ad838` rows, two Withdrawn rows (class_sites.py's `0x404` hits;
class-requests.json's uEm087_00 vtable), and trap 53 (the `e+0x4f4` frame-predicate trap).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **Who issues the web actions -- READ in the file**: (1, 0x1c) g1 s105 / s110, (1, 0x1e) g1 s106, (1, 0x20) g0 s14, (1, 0x22) g1
  s111 / s112 / s113, each stream behind an op-0x6e no-repeat gate (its own number). The odd ones (1, 0x1d / 0x1f / 0x21 / 0x23 /
  0x24 / 0x25) are in no stream; their code-side issuers stay NR (the harness faults on several of his starts -- section 6).
* **`e+0xd408` and its writer, `0x329c9c`, `0x7db70` -- READ before this sweep** (rom-map: "e+0xd408 (a BYTE flag)" set every frame
  of (7, 0x2c / 0x31 / 0x32 / 0x33 / 0x34 / 0x37 / 0x2f / 0x36) and cleared by vt+0x1dc; `0x329c9c` the placement by index; `0x7db70`
  the hit-record arms). Section 6's lines on them are superseded.
* Still open, b (deferred): the anchors' `+4` byte, which action starts release the anchors, `0x8a4dfc`, a data table for id 1009 /
  1010, the faulting starts' effect on `e+0xcb0c`.
* **Deferred items -- READ** (rom-map "Ahtal-Ka anchor releases" and `0x8a4dfc`): the five-anchor web is released by (1, 6 / 0x1d /
  0x20 / 0x23) and every status-10 / 11 start, the three / four-anchor web by (1, 6 / 0x1f / 0x20 / 0x25) and the same; two other
  release paths on (7, 0x2c / 0x2f / 0x31 / 0x36) and (7, 0x34). `0x8a4dfc` sets a unit's rotation from three angles. e+0xcb0c
  goes to 4 at the start of (1, 2 / 6 / 0x20), (7, 0x10 / 0x1b..0x1e / 0x32) and 21 status-10 numbers. u 20 has no request site
  (literal ids or the thread slot's +8 only). The anchors' +4 byte is the anchor unit's own state (the shells lane).
