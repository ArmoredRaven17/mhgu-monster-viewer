# Tigrex (em032_00) — effects spec (and the 0x9b76e4 refusal shared with Grimclaw and Gravios)

Research agent for the Viewer agent, 2026-10-14. Static ROM reading plus unicorn controls; no recorder, no lift, no
docs/ edit. `R` = READ (the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Class `uEm032_00` (Tigrex and Grimclaw), vtable `0x17b8748` (checked: +0xf0 = base `0xca52c`, +0x208 = `0xe21294` =
class-effects.json's frame handler, +0x14 `0xe345f4` inside the band `0xe2031c..0xe34dd0`; not the 4-bytes-low
trap). Survey gaps: enable word unread (2 bindings outside the file mask: L2 M10 b0 / b1, c 0 / c 1); the soak
refusal on L0 Motion[76] "0x9b76e4 falls into unrecorded code" (alive: em032_00c 25).

## 1. The PSL enable word — uEm032_00 vt+0x13c = `0xca170`, the BASE — R, emulated

`uEm032_00` does **not override** vt+0x13c: the slot holds the base method `0xca170` itself (R, the vtable word).
So his word is bits 0-5 always plus one state group (6-8 calm, 9-11 enraged, 12-14 tired and calm), and **no bit
15-31 ever fires** on any Tigrex or Grimclaw motion. No action, part, variant or posture input.

Emulated control (`<scratchpad>/emu13c.py` on vtable `0x17b8748`): L2 M10 calm `0x1ff`; (7,5) severed + enraged
`0xe3f`; L9 M15 tired `0x703f` — the base words exactly.

**For psl-mask.js:** `const em032 = () => 0;` and `CLASS_MASK.em032_00 = em032` (Grimclaw `em032_04` the same
function — one class, no variant test because there is no override); add both to `PSL_MASK_MONSTERS`.

**Per binding** (whole-block plan, `<scratchpad>/planrows.py em032_00 --whole`, 149 bindings): every Tigrex
binding is on bits 0-4 (78 b0, 44 b1, 21 b2, 4 b3, 2 b4), so the word changes exactly two things:

| binding | record | game |
|---|---|---|
| **L2 M10 b0** f63, f129 | c 0 (cm202_020, exported) | always — bind it |
| **L2 M10 b1** f93 | c 1 (cm202_020, exported) | always — bind it |

Nothing in-mask is gated. (Grimclaw, same word, for when his turn comes: outside his mask L2 M10 c 0 / c 1, L9 M9 b1
u 274, L9 M15 b0 u 276 always; **L9 M16 b6 u 270 calm only, b9 u 271 enraged only**.)

## 2. The refusal at `0x9b76e4` — what the branch tests and what reaches it — R (the code) / NR (the viewer's route)

### 2.1 The branch

`0x9b75e8` is an effect unit's draw registration (lifted-draw.js `L_9b75e8`). Gates, in order: `+0xf4` (the effect
list) != 0; vt+0x5c (`0x44d08` on the unit vtable `0x172a7dc`) == 0 and byte `+0xf2` bit 3 clear; `0x9b4744` == 0;
the LOD scale `[+0x180 + 4 x lod]` x const non-zero (`0x9b7684..0x9b76b0`). Then `0x9b76d8`:
`r5 = [unit + 0x1f0]` — **the head of the unit's generator list** (next pointer `+0xc`; each generator's vt+0x58
test, vt+0x54 draw). **`0x9b76e4` is the arm for an EMPTY list: one instruction, `b 0x9b7730`, the function's own
`pop`.** It reads and writes nothing: a unit with no generators registers nothing to draw. The lift already has
`0x9b7730`; the missing case is fully determined by that one instruction.

### 2.2 What empties the list while the unit is still drawn

`+0x1f0` is nulled only by the teardown **vt+0xd4 = `0x9bb794`** (`str r0,[r4,#0x1f0]` at `0x9bb7c8`, after deleting
each generator through its vt+4). Its callers (a whole-text scan for `ldr rX,[rY,#0xd4]` + `blx rX`, plus direct
`bl`), each R:

| route | where | leaves the unit drawable? |
|---|---|---|
| (a) the start's failure | `0x9baa9c` (vt+0xd0's body; called `0x43f4c`, `0x32750c`): `0x9baca0` / `0x9bb358` / `0x9bb69c` returning 0, or a generator's vt+0x3c != 1 -> `0x9bab88` teardown, return 0. `0x9baca0` returns 0 when **no row builds** (`0x9bb30c`: count `[+0x1e0] & 0xffff` == 0 -> `+0xf0 \|= 0x1000000`) | yes — `+0xf4` stays set |
| (b) set list | vt+0x6c `0x9ba238`: teardown first (`0x9ba248`), then the re-start | between the two |
| (c) release | vt+0x78 `0x9ba4a0`: teardown (`0x9ba4ac`), then `0x9b37d0` and the `+0x1c4..` resets | until the unit leaves the draw list |
| (d) destructors | `0x9b5f30` / `0x9b5f60` (`bl 0x9bb794`) | no — the unit is going |

### 2.3 The three monsters

* **Gravios L4 M59 / M60 (u 241, `em005_00_001`): route (a), ROM-legit.** u 241's MASK1 (payload `+0x48`) is
  **`0x2`**; construct.js documents that no row of em005_00_001 carries it (three recordings reach `0x9bb30c`, never
  `0x9bb330`; u 240 `0x1` and u 251 `0x8` build on the same file). So the game builds nothing, tears down, and keeps
  drawing an empty unit: exactly `0x9b76e4`. (The viewer's construct.js startEffect follows the ROM there.)
* **Tigrex / Grimclaw L0 M76 (c 25, `cm200_067`): NOT route (a) by the data** — MASK1 `0xffffffff`, mask2
  `0xffffffff`, and all 8 rows are type 5 (MODEL, decoded; `effects_triage.generators`), so the start builds. Its PSL
  bit 0 is four one-frame rises (f50, f74, f116, f144); the soak reports the clip as 50 frames with 1 started and
  up to 2 running, so the refusal comes around the first rise / the clip's wrap (I). **Which of (b) / (c) ran on that unit before its draw is NR** — it needs one viewer
  trace, not a ROM read: log every call into `L_9bb794` with its `lr` (`0x9ba254` = set list, `0x9ba4b8` = release,
  `0x9bab98` = failed start) on the Tigrex L0 M76 soak.
* **Caution for (a) in the viewer only:** construct.js's factory SKIPS rows of undecoded generator types
  (`recordSkippedGenerator`) without counting them, so an effect whose selected rows are all undecoded would also
  reach `0x9b76e4` in the viewer while the game builds and draws it. That would be a divergence to fix, not a branch
  to cover. Neither c 25 (all type 5) nor u 241 (empty share) is that case.

### 2.4 The recording that covers it once for all three

The block is in the shared draw and independent of the record, so one vector visiting it serves Gravios, Tigrex and
Grimclaw. In the draw recorder (vecdrawsched.py / vecprim.py, the harnesses that already run `0x9b75e8`): start a
unit whose start returns 0 — **Gravios u 241 is the ready-made input** (it already reaches `0x9bb30c` in
`add_em005_00_u241_hold80`) — and run `0x9b75e8` on it while it is still registered, with the earlier gates
passing. The hold-80 recording visits `0x9b75e8` 40 times "on the other arm" (rom-map row `0x9b76d8`) and never
this block; whether that means an earlier exit (vt+0x5c, `0x9b4744`, the LOD scale) or a non-empty list in the
recorder is NR — and if the recorder's u 241 unit HAS generators where the game's (and the viewer's) has none, that
is a recorder divergence to understand first (the board's Redhelm entry says the same of em060_04 key 120). Re-lift
`0x9b75e8` after. If the Tigrex trace (2.3) shows route (b), a second
check is worth one run: re-soak L0 M76 after the lift and confirm c 25's later rises still draw.

### 2.5 CORRECTION (implementation agent for the Viewer agent, 2026-10-14) -- 2.3's c 25 claim and 2.4's recording are WITHDRAWN

The trace of 2.3 was run (viewer, headless). c 25 is **route (a)**: its unit's MASK2 is not payload `+0x4c` but
`0x41c74(core, parent+0x1060)`, stored by `0x42b88` -- 3 on the viewer's floor (flag word 0), and all 8 rows need bit 5
(`w04` 0x20, `0x41c74`'s flag-8 arm). The set list (lr `0x9ba254`) and the failed start's teardowns are the only calls;
no release. The unit then ends in its first move (state 3, `+0xc` 0x14cb3) and **sUnit's draw `0xc03cd0` draws only
`(+0xc & 0x4807) == 0x4802`** -- the game never draws it, nor Gravios's u 241. The refusal was the viewer drawing ended
units; fixed in host.js drawFrame by that gate. No vector was recorded for `0x9b76e4`. rom-map "Akantor / Tigrex" and
its Withdrawn table carry the rows.

## 3. What to implement, in order

1. psl-mask.js: `CLASS_MASK.em032_00` (and `em032_04`) = the base (`() => 0`); add both to `PSL_MASK_MONSTERS`.
2. `add_effects.py em032_00 --apply` then `--record` / `--check` (binds L2 M10 c 0 / c 1; no new record).
3. The `0x9b76e4` block: one recording of `0x9b75e8` on a torn-down unit (2.4), lift, re-soak Tigrex L0 M76,
   Grimclaw L0 M76, Gravios L4 M59 / M60.
4. Before 3, the one-line viewer trace of 2.3 for c 25's route (so the cover does not hide a viewer-only teardown).

NOT READ, by name: which teardown route empties c 25's unit in the viewer (needs a trace); which earlier gate of
`0x9b75e8` the u 241 hold-80 recording exits on.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* Both items named above (the teardown route of c 25's unit; the gate u 241's hold-80 exits on) were answered by section 2.5
  (2026-10-14): c 25 is route (a), its unit ends in its first move, and sUnit's draw `0xc03cd0` draws only `(+0xc & 0x4807) ==
  0x4802` -- the game never draws it, nor Gravios's u 241. Superseded; no read owed.

## The ground (effects lane, 2026-10-20)

* c 25 (`cm200_067`, L0 M76) is a floor-only record. All 8 rows have w04 0x20, which only `0x41c74`'s flag-8 arm (MASK2 0x21)
  builds. The viewer now has the Ground control (index.html GROUND_TYPES, working labels; dev/effect-runtime-engine.md E17).
  Measured with the draw meter:

  | ground | c 25 |
  |---|---|
  | plain | live, no draw |
  | Ground B (flag 8) | DRAWS (lit 49 / 51) |
  | A, C, D, E, F | no draw |

  This matches the rows. The ROM's own answer stands: on a plain floor the game builds nothing for it.
* The dust c 0 (`cm202_020`, L0 M9) draws on every ground, with a row set per ground:

  | ground | plain | A | B | C | D | E |
  |---|---|---|---|---|---|---|
  | model draws | 407 | 512 | 233 | 511 | 410 | 407 |
  | px | 7103 | 9269 | 6991 | 8458 | 4235 | 8871 |

* ctl+0x29 (the shells' selector) reads the same block through `input.floorFlags` / `floorAttr`. The shells agent measured L2 M5's
  shell00 modes per ground:

  | ground | modes |
  |---|---|
  | plain, B | 0 / 1 / 2 |
  | E | 3 / 4 / 5 |
  | F, A | 9 / 10 / 11 |

  The flag-6 selector 2 is unreachable: no ground offers flag 6, because its MASK2 arm is unrecorded.
* **2026-10-20**: flag 6's arm (`0x41c88`) is read and lifted. Grounds G / H (flag 0x2) give ctl+0x29 selector 2: L2 M5 shell00
  modes 6 / 7 / 8. u 1 starts 3 times and draws (lit 43 / 59). u 31 starts 3 times and draws off camera, as u 30 does on a plain
  floor. By its rows c 25 builds nothing on G / H (MASK2 5 / 0x11 lack its bit 5); that was not metered.
