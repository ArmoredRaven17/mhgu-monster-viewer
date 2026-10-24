# gapF -- Kushala Daora (em024_00): who makes sp_01 (0xb0) modes 1 / 2 / 3 / 4 / 9 / 10 / 12 / 13 (c 29 / 30 / 32..35)

Work dir: `<scratchpad>/gapF/` (all tools and outputs listed in section e). No repo file, rom-map, spec or board was touched.

**Answer.** All eight modes, plus mode 0, come from **his frame handler vt+0x208 `0xdeffc4`**, in the stretch past the barrier
(`0xdf00fc..0xdf10b4`). The rom-map had only read it to `0xdf00fc` (rows 2139, CLASS_TIMERS). The handler has two parts:
- **The motion switch.** L2 M2 f50 makes mode 0. L2 M18 f184 and L0 M5 f184 make mode 4 at level 1 / 2 and mode 3 at level 3.
- **The pulse.** Every 80 frames of a listed action, while the Wind Aura level is 1..3, it makes one shell at his position. The
  mode depends on the level and on whether he is on the ground: modes 9 / 10 at level 1, 12 / 13 at level 2, 2 / 1 at level 3.

No maker and no other shell makes any of these modes. Every mode of the files that has records is now reachable. Mode 0 has no
record, and its "no maker makes mode 0" note is withdrawn. The transcription is `perFrame024`. A replay through a patched copy
passes 19 of 19 cases, and dev/shells-kushala-check.mjs passes 52 of 52 against the same copy.

## (a) READ facts (addresses)

### a1. The band, DERIVED: `0xdeee40..0xdfeec4`
- **Method** (`band.py` / `rdesc.py`): recursive descent from these roots:
  - every slot of the seven vtables, each read up to the next vtable's (0, 0) header:
    - uEm024_00 `0x17b36d8` (0x4ac bytes)
    - sp_00 `0x17b4760` (0x174), sp_01 `0x17b48dc` (0x168), sp_02 `0x17b4a4c` (0x174)
    - sp_33 `0x17b4bc8` (0x15c), sp_34 `0x17b4d2c` (0x15c), sp_38 `0x17b4e90` (0x164)
  - the seven init_array entries `[0x18435a0..0x18435b8]`;
  - the ctor `0xdeee40`, called only from the shared factory `0x4c914`.
- **What the descent follows**: fallthrough, branches, 43 PIC jump tables (bounds from `cmp #N` + `bhi` / `bhs`) and pc-relative
  code pointers. That gives 15011 instructions and **0 unresolved pc writes**.
- **Every word in the range the descent did not reach is one of two things** (`gaps.py`):
  - data: literals, float tables and jump-table bases;
  - the six shell ctors `0xdfd5b4`, `0xdfdb54`, `0xdfdde0`, `0xdfdff8`, `0xdfe4ac`, `0xdfe994`. They contain no create and are
    included in the census anyway.
- **The ends**:
  - `0xdeee40` is his ctor. It stores vtable `0x17b36d0 + 8`, zeroes `e+0xcac4` / `+0xcac8`, points `[e+0xcac0]` at P+0x60, zeroes
    ctl+0 / 4 / 0x18 / 0x19 / 0x1c and zeroes P+0x1bb.
  - `0xdfeec4` is **uEm025_00's ctor** (vtable `0x17b4ff4 + 8 = 0x17b4ffc`, its block P+0x60).
- **Trap.** `emclasses.json`'s band for uEm024_00 (`0xdeee70..0xdfef0c`) is wrong at both ends. Its low end cuts the ctor's first
  0x30 bytes, and its high end takes in Chameleos's ctor. Rajang's band in rom-map row 2857 (`..0xdeef70`) also overlaps
  Kushala's ctor. That row's negative still stands, because it was checked over a superset.
- **Trap (tooling).** Reading a fixed 0x4a0 bytes per vtable runs past a short shell vtable: sp_38 + 0x16c is uEm025_00's vtable.

### a2. The create census of the band (`census.py`): 14 submits, 57 allocations, every submit fed
- **Method.**
  - Allocators are found by their shape: a pool GOT handed to the heap `0x7a75a0`. That gives 18 functions, among them
    `0x3fa2bc` / `0x3f883c` / `0x3fb7bc`, and `0x4164c8` / `0x417640` / `0x41c110` for base33 / 34 / 38.
  - From each allocation, every CFG path is followed to a `b` / `bl 0x48b884` that takes the setup in r1. The stores to +4 (the
    id) and +8 (the mode) on that path are recorded, including `stmib` stores.
- **Positive controls, found by the same scan:**
  - 0xdf8610's literal mode 11 (alloc `0xdf87b0`, submit `0xdf8858`);
  - sp_33 +0x158's table mode `[0x169d3f0 + mode*4]` (alloc `0xdfe2f4`, mode load `0xdfe2dc`) -- CHILD033's 5..8 / 16;
  - sp_34's / sp_38's `[shell + 0x15e0]` / `[shell + 0x15d8]` (allocs `0xdfe70c` / `0xdfec3c`) -- the 14 / 15 children.
- **No class id slot.** Every create names its id as a literal: 0xaf, 0xb0, 0xb1, 0xb2, 0xb3, 0xb4. `e+0xcac4` / `+0xcac8` are
  effect handles (the aura and the barrier). No `e+0xcacc`-style id field exists in the band.

| id 0xb0 create (alloc -> submit) | function / trigger | mode (+8) |
|---|---|---|
| `0xdf0220` -> `0xdf0e9c` | vt+0x208, L2 M2 f50 | **0** |
| `0xdf0c04` / `0xdf0ca0` -> `0xdf0e9c` | vt+0x208, L2 M18 f184 | **4** / **3** |
| `0xdf0d5c` / `0xdf0df8` -> `0xdf0e9c` | vt+0x208, L0 M5 f184 | **4** / **3** |
| `0xdf0914` -> `0xdf1000` | vt+0x208 pulse, level 1 | **9** (posture 0) / **10** |
| `0xdf0b44` -> `0xdf1000` | vt+0x208 pulse, level 2 | **12** / **13** |
| `0xdf0aa0` -> `0xdf1000` | vt+0x208 pulse, level 3 | **2** / **1** |
| `0xdf87b0` -> `0xdf8858` | 0xdf8610 (7, 0 / 1) f54 | 11 (control) |
| `0xdfe2f4` -> `0xdfe3a0` | sp_33 +0x158 | `[0x169d3f0][mode]` (control) |
| `0xdfe70c` -> `0xdfe7b4` | sp_34 +0x154 | shell+0x15e0 |
| `0xdfec3c` -> `0xdfece4` | sp_38 +0x154 | shell+0x15d8 |

The other creates the census lists all match the existing rows: sp_00 from `0xdf2670` and `0xdf96a8`, the 0xb1 beam,
sp_33 from 0xdf88f0, (7, 4) and 0xdf96a8, and sp_34 / sp_38 from the landing `0xdfd7e8`.

**Out of band** (`extscan.py`, `extscan2.py`). The closure covers 219789 instructions of shared text. Its roots are the band's
165 direct callees plus 489 out-of-band vtable slots (the shells' base methods and the uEnemy methods). It reaches exactly one
submit, `0x318d50` in `0x318c9c`, with id `0x192` mode 0. That shows the scan can find a submit in shared code, and none of
what it finds builds a 0xb0 setup.

Named limit: indirect calls (`blx` through an object pointer) are not followed. The enemy's and the shells' own virtuals are all
roots already.

### a3. vt+0x208 `0xdeffc4`, read whole (`..0xdf10b4`; listing in `vt208.txt`), in this order

1. **Handles.** `e+0xcac4` / `+0xcac8` are dropped when their unit's state `& 7` is not 1 or 2.
2. **The barrier `0xdf0028..0xdf00f8`.** As already mapped.
3. **The motion switch.** It keys on the motion id from `0xb0944`: ids 0x202..0x212 go through table `0xdf0128`, and ids 5 and
   0x22 are compared directly. Each case waits for a channel-1 crossing (`0xb09b0`):
   - **L2 M2 (0x202), f50 (lit `0xdf0554`).** Two more gates must pass:
     - `0xb6fac(e, G+0x49)`: e+0x1054 == G+0x49, the machine that spawned him. It always holds offline.
     - P+0x44 <= P+0x5b4 + 1000.0 (`bhi` past).

     It also computes `0xbe518` and a Y-word sine whose value is not used. Then it makes **mode 0**.
   - **L2 M18 (0x212).** At f66, a hit `0x7ded8(e, 0, 0x1c)`. Then the level is computed, and 0 / 0xff ends here. At f184
     (lit `0x43380000`) the level is computed again: 1 / 2 make **mode 4**, 3 makes **mode 3**, any other value makes nothing.
     There is no owner test and no height test on this path.
   - **L0 M5 (0x005).** First a gate: `0x6fe88(e, 13, 1)`, then `0x6fe88(e, 13, 5)`. It skips only if both hold, which never
     happens. Then f56 makes a hit `0x7ded8(e, 0, 0x1c)`, and the rest is as L2 M18.
   - **Hit records only, no shells:** L2 M3 f48 `0x7db70(e, 0, 2)`, M4 f40 (0x12), M7 f58 (0xc), M10 f46 / f52 (3 / 0xd),
     M11 f46 / f52 (4 / 0xf), M12 f48 / f50 / f80 (0x13 / 0x14 / 0x15), M13 (0x16 / 0x17 / 0x18), L0 M34 f14 (0xb).
4. **`0xdf04c0..0xdf0510`.** When ctl+0x24 is set, P+0x5cfc |= 1, and also |= 2 when e+0xb5f5 == 1. Not visual.
5. **The aura effect `0xdf0514..0xdf0608`** (not a shell; for the effects lane):
   - The level L is P+0x1bb with this fold:

     | P+0x1bb | L |
     |---|---|
     | 0xff | 0 |
     | 2 | ctl+0x18 ? 1 : 2 |
     | 3 | ctl+0x18 ? 2 : 3 |
     | anything else | itself |

   - For L 1..3, the handle `e+0xcac4` should hold id **1000 + L**. vt+0x1d0 `0xdfd42c` turns an id of 1000 or more into
     `0x6feb8(e, 2, [0x169d3b8][id - 1000])`. That is the barrier's path, so the record list is the barrier's `u`.
   - The table `0x169d3b8` = {-1, 1, 0, 10, 210, 220, 230, 240}, so L 1 / 2 / 3 hold **u 1 / u 0 / u 10**.
   - A held handle with another key (+0x1b4) is stopped and the right id requested again. Any other L stops it.
6. **The pulse `0xdf060c..0xdf1000`.**
   - **Level.** L is recomputed the same way; 0 / 0xff exit.
   - **Action.** The switch on e+0x73e0 (table `0xdf0684`) admits these actions; status 3, 5, 6 and everything above 7 exit
     (`0xdf1004`):

     | status | admitted n | source |
     |---|---|---|
     | 0 | any | `0xdf0850` |
     | 1 | 2, 3, 0x13 | n - 2 < 0x12, mask `0x20003` |
     | 2 | 3, 8, 9, 0xa, 0xb, 0xd, 0x14, 0x15, 0x16, 0x17 | n - 3 < 0x15, mask `0x1e05e1` |
     | 4 | 3, 5, 7, 9, 0xb..0x10, 0x17 | n - 3 < 0x15, mask `0x103f55` |
     | 7 | 0xf, 0x10, 0x11, 0x30 | n - 0xf < 3, or n == 0x30 |

   - **Clock.** `0xb6fac` must pass. Then ctl+0x1c += dt x 1.0 (`0x7264c` = `0x539d48`, a `vmla` with the unit's +0x1c).
     Below 80.0 (`blt`) the pulse ends for this frame. At 80.0 or more, ctl+0x1c = 0.
   - **Height.** P+0x44 < P+0x5b4 + 1000.0, strictly (`bpl` past).
   - Then `vt+0xd4(e, 0)` (`0x539e08`, a getter, result unused).
   - **Mode by L (r7) and posture P+0x1ba:**

     | L | P+0x1ba == 0 | P+0x1ba != 0 |
     |---|---|---|
     | 1 | mode 9 | mode 10 |
     | 2 | mode 12 | mode 13 |
     | 3 | mode 2 | mode 1 |
     | 4..0xfe | nothing (the clock still counts) | nothing |

   - **ctl+0x1c writers in the band.** A register-tracked scan of +0x1c stores finds the ctor `0xdeeebc`, vt+0x1d8 `0xdef070`
     and this reset `0xdf08a4`. Its add is the `0x7264c` call at `0xdf0880`. The `0xdf5b48`-style stores are P+0x1c, not ctl.
7. **ctl+0x28 countdown `0xdf1004..0xdf10ac`.** `0xb6fac` must pass. ctl+0x28 counts down by dt (`0x7206c`). At 0 or below it
   reloads `[0xdf1154]` = **135.0**, or `[0xdf1158]` = **99.6** at L 3. Its reader is NOT READ (not a shell).
8. **Every setup** (`0x3fa2bc(0x40)`):

   | offset | value |
   |---|---|
   | +0 | the type `[0x174e638] + 8` |
   | +4 | 0xb0 |
   | +8 | the mode |
   | +0xc | the owner |
   | +0x10.. | P+0x40 / 0x44 / 0x48 |
   | +0x1c, +0x2c | 0 |
   | +0x20.. | the GOT zero vector `0x19176b0` |
   | +0x30.. | P+0x50 / 0x54 / 0x58 (the block's words, whole) |
   | +0x3c | 0xffff |

   It is submitted by `0x48b884([0x188b3b0], setup, 0, 0)`.

**Emulated** (`emu208.py`, trgen with `fn = 0xdeffc4`, 63 cases): 34 cases create and 29 controls make nothing. All match the
static read, including:
- the mode by level and posture;
- the ctl+0x18 fold (3 -> 2, 2 -> 1);
- clock 79 makes nothing; y = 1000 makes nothing in the pulse, y = 999 does create;
- `0xb6fac` = 0 makes nothing;
- each listed action creates and the unlisted neighbours do not ((1, 4 / 0x1b), (2, 4 / 0x18), (4, 4 / 6 / 0x18), (7, 0 / 0x12 /
  0x2c / 0x41), statuses 3 / 5 / 6 / 8 / 10 / 13);
- L0 M5 under (13, 1) does create.

### a4. Which clips the pulse actions play (E: `actsall.py` / `actsall2.py` / `post.py`, trgen over the action main `0xdfc6f0`)
- **Method.** Every (status, n) for status 0..15 and n 0..0x8f was run at phases 0..5 and ended 0 / 1. It was run again with
  the frame tests passing, landed, rage, tired, and posture 1 / 3. The turn tables were read from `0x7a258` / `0x7a27c`'s r1
  (records +0x10 / +0x20 / +0x30).
- **Status 0 has only n 0..3 and 6.** (0, 4), (0, 5) and every higher n fall through to `0xca050` = vt+0x3dc, which ends the
  action at once and plays no clip.
- **Clips, and the posture each play sets** (`0xbc7f4` r1; `0xbc984` writes 1):
  - **Ground, posture 0:**
    - (0, 0) L0 M1; (0, 1), (1, 3) and (1, 0x13) L0 M2; (0, 2) L0 M22;
    - (2, 3) the turn table `0x169d2b4` (L0 M14 / M12 / M13);
    - (2, 8..0xb) and (2, 0xd) L0 M8; (2, 0x14..0x17) L0 M35 / M36 / M41 / M42;
    - (7, 0x30) L2 M20.
  - **Air, posture 1 or 3:**
    - (0, 3) L1 M2 at posture 1; (0, 6), (1, 2), (4, 3), (4, 9) and (4, 0x17) L1 M2 at posture 3;
    - (4, 5) and (4, 7): L1 M2 plus the turn tables `0x169d320` / `0x169d360` (L1 M2 / M8 / M8), posture 3;
    - (7, 0xf / 0x10 / 0x11): L2 M1, and L2 M9 / M6 from `0xdf96a8`'s phases 2 / 3 (spec 4), posture 3 (`0xdf98f0`).
  - **Changing posture:**
    - (4, 0xb) / (4, 0xc): L0 M37 / M39 at posture 0, then L0 M38 / M40 at posture 3;
    - (4, 0xd..0x10): L1 M16 / M18 / M20 / M22 at posture 3, then L1 M17 / M19 / M21 / M23 at posture 0.
- **Clips that other actions play too**, so the clip alone cannot decide:
  - L0 M1: also (1, 1).
  - L0 M2: also (13, 0) and (13, 3).
  - L1 M2: also 34 actions of statuses 2, 3, 4, 7, 12 and 13.
  - L1 M8: also (3, 6).
  - L2 M1 / M9 / M6: also the other shot actions.
- **Named limit (trgen).** It answers stubbed calls with 0, so a clip chosen only behind a stub is not seen.

## (b) The JS for docs/render/shells.js

The four edits below are applied by `mkpatched.py`, using text anchors only (the file is being edited by others, so line numbers
move). The new block is `js_perframe024.js`, copied verbatim.

**1. Before the anchor `const act024 = (st, n, list, clip, spawns, x = {}) =>`, insert the whole of `js_perframe024.js`.** It
contains:
- the comment block;
- `PULSE024_ACTS` and `pulseAct024`;
- `PULSE024_CLIPS`, which maps each clip to its posture and whether the clip is "clean" (only pulse actions play it);
- `function perFrame024(state, D, ctx, input, out, fresh, a)`;
- `const PERFRAME024 = true;`.

**2. In the em024 block, after `  D.lists = { 0: { list: 'u', pel: 'em024_00u' }, 1: { list: 'c', pel: 'em024_00c' } };`:**
```js
  D.perFrame024 = PERFRAME024;                             // his frame handler vt+0x208 0xdeffc4: sp_01 0 / 1..4 / 9 / 10 / 12 / 13
```
**3. In stepShells, after `  if (D.perFrame077s28) perFrame077s28(state, D, ctx, input, out, fresh, a);`:**
```js
  if (D.perFrame024) perFrame024(state, D, ctx, input, out, fresh, a);   // Kushala's frame handler 0xdeffc4 (sp_01 0xb0: the pulse, L2 M2 / M18, L0 M5), line 4
```
**4. In sp_01's reader comment, replace `alone carries it, which no maker read here makes)` with:**
`alone carries it: the frame handler's L2 M2 f50, perFrame024 -- "no maker makes mode 0" WITHDRAWN 2026-10-20)`

**Optional, index.html** (the shells input, next to `windAura024:`). ctl+0x18 = P+0x5e08 bit 1 (effects spec 1), which is the
Poisoned toggle. Without this line perFrame024 treats Poisoned as off, which is what the viewer does today.
```js
           poisoned024: state.id === 'em024_00' ? ctog('poisoned') : undefined,
```
spawn024's makers have the same fold ("ctl+0x18 not held: off"). They could read `input.poisoned024` the same way. That is not
done here.

**How perFrame024 behaves:**
- **Order.** It runs on line 4, after the action, with the other frame handlers.
- **Motion switch.** Uses `pass001` on the step's frame pair, like perFrame032 / perFrame009. A crossing of F therefore makes its
  shell on step F + 1.
- **Action.** Taken from the play's row (`a.action`), else `input.action`. Failing both, it comes from `PULSE024_CLIPS`, but
  only if the clip is clean.
- **A mixed clip with no named action** is refused by name, once per play, on the fresh step.
- **Clock.** `state.c024` persists across plays. It counts only steps on which the frame pair moved (perFrame009's convention).
  The viewer therefore loses two steps per replay of a play: the fresh step and the step after it. The game counts every frame.
  Changing this is the shells agent's call.
- **Placement.** Position `own.ownerPos`, words `[ownerX, ownerY, ownerZ]` whole. Modes 9 / 10 carry base01 flag 1 (joint 0)
  and the flag 0x80, so they ride joint 0 through init011 / step011 as mode 11 already does.

## (c) rom-map rows (Kushala style) and WITHDRAWN entries

New rows:
```
| `0xdeffc4` (vt+0x208) `0xdf00fc..0xdf10b4` | **Kushala's frame handler past the barrier, READ WHOLE**: the motion switch (`0xb0944`; table `0xdf0128` for 0x202..0x212, 5, 0x22; `0xb09b0` crossings): **L2 M2 f50 sp_01 0xb0 MODE 0** (`0xdf0220`; `0xb6fac` e+0x1054 == G+0x49 and P+0x44 <= P+0x5b4 + 1000); **L2 M18 / L0 M5 f184 MODE 4 (level 1 / 2) / 3 (level 3)** (`0xdf0c04` / `0xdf0ca0`, `0xdf0d5c` / `0xdf0df8`; no gate; L0 M5's `(13, 1) && (13, 5)` cannot refuse); hits `0x7db70` / `0x7ded8` on L2 M3 / M4 / M7 / M10..M13 / M18, L0 M5 / M34. **THE PULSE** (`0xdf060c..0xdf1000`): level L (P+0x1bb, 2 / 3 folded by ctl+0x18) not 0 / 0xff, the action in table `0xdf0684` (status 0 any; 1 {2, 3, 0x13}; 2 {3, 8..0xb, 0xd, 0x14..0x17}; 4 {3, 5, 7, 9, 0xb..0x10, 0x17}; 7 {0xf..0x11, 0x30}), `0xb6fac`; ctl+0x1c += dt, at >= 80.0 = 0 and (P+0x44 < P+0x5b4 + 1000) **sp_01 9 / 10 (L1), 12 / 13 (L2), 2 / 1 (L3) by P+0x1ba == 0 / != 0**. Setups 0x3fa2bc(0x40): +0x10 P+0x40.., +0x20 GOT zero, +0x30 P+0x50.. whole, +0x3c 0xffff | uEm024_00 | R + E (gapF/emu208.py, 63 cases, controls) | shells.js perFrame024 / PULSE024_ACTS / PULSE024_CLIPS; gapF/RESULT.md |
| `0xdf0514..0xdf0608` (in vt+0x208) | **his aura effect**: e+0xcac4 holds id 1000 + L (L 1..3) -> vt+0x1d0 `0xdfd42c` -> `0x6feb8(e, 2, [0x169d3b8][id - 1000])` = **u 1 / u 0 / u 10**; a wrong key (+0x1b4) stopped and re-requested; any other L: stopped. ctl+0x24 -> P+0x5cfc \|= 1 (\|= 2 with e+0xb5f5 == 1) | uEm024_00 | R (not built: the effects lane's) | gapF/RESULT.md a3.5 |
| `0xdf1004..0xdf10ac` (in vt+0x208) | ctl+0x28 counted down by dt (`0x7206c`, `0xb6fac` gate), at <= 0 reloaded `[0xdf1154]` 135.0 / `[0xdf1158]` 99.6 (L 3); its reader NOT READ | uEm024_00 | R / reader NR | gapF/RESULT.md a3.7 |
| `0xdfd42c` (vt+0x1d0) | ids >= 1000 -> `0x6feb8(e, 2, [0x169d3b8][id - 1000])` (table {-1, 1, 0, 10, 210, 220, 230, 240}); below -> `0xa3ddc` | uEm024_00 | R | -- |
| `0xdeee40` (ctor, from `0x4c914`) / band | uEm024_00's code band **0xdeee40..0xdfeec4, DERIVED** (recursive descent from his vtable 0x17b36d8 and the six shell vtables, the init_array 0x18435a0.., the ctor; 0 unresolved; `0xdfeec4` = uEm025_00's ctor). The ctor zeroes ctl+0 / 4 / 0x18 / 0x19 / 0x1c and P+0x1bb. emclasses' 0xdeee70..0xdfef0c is wrong at both ends | uEm024_00 | R | gapF/band.py, gaps.py |
| create census, band 0xdeee40..0xdfeec4 | 14 submits / 57 allocations (allocators by shape); **id 0xb0 is made only by vt+0x208 (modes 0 / 1 / 2 / 3 / 4 / 9 / 10 / 12 / 13), 0xdf8610 (11), sp_33 +0x158 ([0x169d3f0]), sp_34 / sp_38 +0x154 (+0x15e0 / +0x15d8)**; every id literal (no class id slot). Out of band: the 654-root closure reaches one submit (`0x318d50`, id 0x192) | uEm024_00 | R (scan; controls: mode 11 `0xdf87b0`, the CHILD033 table `0xdfe2dc`) | gapF/census.py, extscan2.py |
| uEm024_00 clips by action (pulse set) | (0, 0) L0 M1, (0, 1) / (1, 3 / 0x13) L0 M2, (0, 2) L0 M22, (0, 3 / 6) (1, 2) (4, 3 / 9 / 0x17) L1 M2, (2, 3) turn 0x169d2b4 L0 M14 / M12 / M13, (2, 8..0xb / 0xd) L0 M8, (2, 0x14..0x17) L0 M35 / M36 / M41 / M42, (4, 5 / 7) L1 M2 + turns 0x169d320 / 0x169d360 (L1 M8), (4, 0xb / 0xc) L0 M37 -> M38 / M39 -> M40, (4, 0xd..0x10) L1 M16..M23 pairs, (7, 0xf..0x11) L2 M1 / M9 / M6, (7, 0x30) L2 M20; postures by play (0xbc7f4 / 0xbc984); (0, 4 / 5) end at once (0xca050 = vt+0x3dc) | uEm024_00 | E (trgen; stubbed branches unseen) | gapF/actsall2.py, post.py; PULSE024_CLIPS |
```
Upgrades to existing rows:
- **Row 2139** (`0xdeffc4` (vt+0x208) Kushala's wind barrier). Change "R (to 0xdf00fc)" to "R (whole: the rest is the row above)".
  The CLASS_TIMERS comment "READ to 0xdf00fc" needs the same change.
- **Row 3160** (Kushala's c 29 / 30 / 32..35, "Which sp_01 modes the page never makes: open"). Change to "closed 2026-10-20:
  every one is the frame handler's (gapF)".

Tooling rows (table):
```
| `<scratchpad>\gapF\rdesc.py` + `band.py` / `gaps.py` | a class band by recursive descent from its vtables (each read to the next vtable's (0, 0) header), init_array entries and ctor; PIC tables, pc-relative code pointers; then every unreached word classified (data / unreferenced run) | uEm024_00: 0xdeee40..0xdfeec4, 0 unresolved, the islands = the six shell ctors | a fixed-length vtable read runs into the next class (sp_38 + 0x16c = uEm025_00's) |
| `<scratchpad>\gapF\census.py` | every create of a band: allocators by shape (heap 0x7a75a0), CFG paths alloc -> 0x48b884 with r1 the setup, the +4 / +8 stores (stmib too) | 0xdf8610's mode 11; sp_33 +0x158's [0x169d3f0] | a value set before the alloc is shown as its last straight-line def ("pre") |
| `<scratchpad>\gapF\extscan2.py` | the closure of a band's out-of-band callees and vtable slots over the shared text: which submits it reaches, their +4 ids | finds 0x318d50 (id 0x192) | indirect calls through object pointers not followed |
| `<scratchpad>\gapF\emu208.py` | Kushala's vt+0x208 under trgen (fn, mot, frame2, stub 0xb6fac, ctl / P pokes): the creates per case | 29 controls make nothing | the clock 0x7264c is stubbed: ctl+0x1c poked |
| `<scratchpad>\gapF\replay024.mjs` (+ `mkpatched.py`) | the perFrame024 transcription in a patched copy of shells.js, 19 cases (13 + 6 controls) | the controls make nothing / the named refusal | steps are F + 1 for a crossing of F (line 4's frame pair) |
```

WITHDRAWN (move into the table; do not delete the originals):
```
| dev/elder-dragon-shells-spec.md 4 "sp_01's base01 flag 0x400 (mode 0 alone): the refusal lifted (init011 carries 0x3fac58); no maker makes mode 0" and "0x400 (mode 0, no maker read) is refused by name"; shells.js params024s01 comment "mode 0 alone carries it, which no maker read here makes" | vt+0x208 was read only to 0xdf00fc; its motion switch makes mode 0 | **L2 M2 f50 sp_01 0xb0 mode 0** (`0xdf0220`, gates `0xb6fac` and P+0x44 <= P+0x5b4 + 1000) -- no record (999, -1), a hit volume; perFrame024 (gapF, 2026-10-20) |
| rom-map row 3160 (2026-10-19): Kushala's sp_01 modes 1 / 2 / 3 / 4 / 9..13 "made by his makers and the other shells"; and row 788's correction "made by makers / other shells" | no maker or shell makes them (census: 0xdf8610 makes 11, the shells' children 5..8 / 14..16) | the frame handler vt+0x208: L2 M18 / L0 M5 f184 modes 4 / 3, the 80-frame pulse modes 9 / 10 / 12 / 13 / 2 / 1 (gapF) |
| emclasses.json band uEm024_00 `0xdeee70..0xdfef0c` (and rom-map row 2857's Rajang band end `0xdeef70`) | the 0x100 slack is a choice, not a derivation: 0xdeee40 starts Kushala's ctor, 0xdfeec4 starts uEm025_00's | **0xdeee40..0xdfeec4** (gapF/band.py); Rajang's band ends at or before 0xdeee40 (his row's negative stands: it was run over a superset) |
```
Spec section 4 (the shells agent's) also needs one line. Under "The makers", add vt+0x208 and give the pulse's action and clip
sets. Under "sp_01", say that modes 0..4 / 9 / 10 / 12 / 13 are the frame handler's.

## (d) Replay (`replay024.mjs`, importing `shells.patched.mjs` from `mkpatched.py`)

`node replay024.mjs` passes **19 of 19** (output below, abridged). Step numbers are the viewer's input.frame. These records
start: **c 29** (modes 10 / 13), **c 30** (9 / 12 / 1), **c 31 + c 34** (2), **c 32** (4), **c 32 + c 35** (3), **c 30 + c 33** (1).
```
PASS pulse L0 M8 level 1 (posture 0) -> mode 9 (c 30)       ["9@0|Motion[8]:21 [c 30]","9@0|Motion[8]:41 [c 30]"]
PASS pulse L0 M8 level 2 -> mode 12 (c 30)                  ["12@0|Motion[8]:21 [c 30]"]
PASS pulse L0 M8 level 3 -> mode 2 (c 31 + c 34)            ["2@0|Motion[8]:21 [c 31, c 34]"]
PASS pulse L1 M16 level 1 (posture 3) -> mode 10 (c 29)     ["10@1|Motion[16]:81 [c 29]"]
PASS pulse L1 M16 level 2 -> mode 13 (c 29)                 ["13@1|Motion[16]:81 [c 29]"]
PASS pulse L1 M16 level 3 -> mode 1 (c 30 + c 33)           ["1@1|Motion[16]:81 [c 30, c 33]"]
PASS pulse level 3 Poisoned (ctl+0x18: -> 2) -> mode 12     ["12@0|Motion[8]:21 [c 30]"]
PASS pulse on (7, 0x0f)'s L2 M9 row, level 2 -> mode 13     ["13@2|Motion[9]:81 [c 29]","13@2|Motion[9]:161 [c 29]"]
PASS L2 M18 f184 level 1 -> mode 4 (c 32)                   ["4@2|Motion[18]:185 [c 32]"]
PASS L2 M18 f184 level 3 -> mode 3 (c 32 + c 35)            ["3@2|Motion[18]:185 [c 32, c 35]"]
PASS L0 M5 f184 level 2 -> mode 4 / level 3 Poisoned -> 4   ["4@0|Motion[5]:185 [c 32]"]
PASS L2 M2 f50 -> mode 0 (no record)                        ["0@2|Motion[2]:51 []"]
PASS control: level 0 / y = ground + 1000 / L2 M2 y 1000.5 / L2 M9 under (7, 0x2c) / L3 M3 -- nothing
PASS control: L0 M1 with no action -- refused: "em024 pulse (vt+0x208 0xdf0664): 0|Motion[1] is played by pulse actions and others -- the play names no action"
```
**Regression:** dev/shells-kushala-check.mjs, run on the patched copy (`kcheck_patched.mjs`), passes **52 of 52**. Its node part
covers the ROM runs and the controls.

## (e) Files (`<scratchpad>/gapF/`)

| Purpose | Files |
|---|---|
| Disassembler | `dl.py` |
| vt+0x208 listing | `vt208.txt` |
| Band derivation | `rdesc.py`, `band.py` (-> `band024.json`, `band.out`), `gaps.py` |
| Create census | `census.py` (-> `census.out`) |
| Out-of-band closure | `extscan.py`, `extscan2.py` |
| vt+0x208 emulation | `emu208.py` (-> `emu208.out`) |
| Clips by action | `acts.py`, `acts2.py`, `actsall.py` (-> `actsall024.json`), `actsall2.py` (-> `actsall024b.json`), `post.py` |
| Clip lengths | `cliplen.py` |
| Transcription | `js_perframe024.js`, `mkpatched.py` (-> `shells.patched.mjs`) |
| Replay | `replay024.mjs` |
| Regression | `kcheck_patched.mjs` (-> `kcheck_patched.out`) |
