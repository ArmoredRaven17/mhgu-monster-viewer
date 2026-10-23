# Akantor (em033_00) -- his shells (shells agent, 2026-10-19)

Class `uEm033_00` (vtable `0x17ba1c4`, band `0xe360a0..0xe3ea34`; action main `0xe3e098`). His beams are render/beam-spawns.js's.
Emulator check `dev/shells-akantor-check.mjs` (tool `<scratchpad>/fb/mk033.py`), 5 / 5. `R` = the consuming instruction read.

## 1. What creates on him

* The census of his table's reach (cengen11 + the class's changes): one drawing create, the burrowed wait (6, 0x03 / 0x0c / 0x0e /
  0x0f) -- sp_01 0xc1 mode 2 (u 10). Six more creates start nothing (their modes' ef (999, -1)); the rest are outside his reach.
* The per-frame census (fb/pfgen.py): none.

## 2. The burrowed wait `0xe3a73c..0xe3ab30` (R)

* Phase 0: posture 4 (`0xbc7f4`), L0 M2 (setMotion0), the burrow (`0xbf62c` / `0xbf700`), P+0x1bc = 60.0.
* Phase 1: P+0x1bc counted down by 1.0 x the step (`0x7206c`). At <= 24 with P+0x1a2 == 0 (once, then P+0x1a2 + 1):
  * the point 600 ahead along his Y word: P+0x40.. + 600 x (sin Y, 0, cos Y) / |(sin, 0, cos)| (`0xe3a828..0xe3a8d0`, the 0.0
    products of the literal at `0xe3ab44` kept);
  * its ground: `0x49aec` (the per-frame ground probe's path, rom-map `0xbde60`) -> the point's y; the ground frame (`0x232530` /
    `0x7c3a38`) is computed and **not** written to the request;
  * `0x3fa2bc(0x40)`: +4 **0xc1** (a literal, not a slot), +8 **2**, +0x10 the ground point, +0x20.. / +0x30.. GOT vectors (0, 0, 0),
    +0x3c 0xffff -> `0x48b884`.
* At P+0x1bc <= 0: phase 2, L2 M10 (`0x20a`; L2 M33 `0x221` for r6 != 0) -- the emergence.

So the tell rises 36 phase-1 updates after he goes under, 24 before he emerges. The viewer fires it at frame 36 of L0 M2 played from the
action's start (the timer is not the clip's frame: a stand-in, named) and puts it at the viewer's floor under the point (the probe's
stand-in, as every floor here).

## 3. sp_01 (`uShellEm033_sp_01`, base01; vtable `0x17bad08`, found by its base01 slots; reader `0xe3e500`, R whole)

ef 0 -> +0x15c8, ef 1 -> +0x15d0; hit 0 -> +0x15d8; +0x15ec bfc / orrne: int 0 -> 1, int 2 -> 0x20, int 3 -> 4, int 4 -> 8; int 1 -> the
joint +0x15e4; &vec 0 -> +0x1608. +0x150 the base's (`0x3fb548`). Timer the ctor's 0: a shell lives while its hit slot does
(em033_00_01_hitdata: (76, 36), (30, 100), (60, 100), (0, 8)). Mode 2: flags 0x0c (the ground snap and its angles), joint -1, u 10,
hit 2 (60, 100). EffectLists [em033_00u, null ..].

## 4. In the viewer

SHELL_DATA.em033_00 (beamsOnly dropped): shell01 modes 0..3, the (6, 3) row with also (6, 0xc / 0xe / 0xf) on L0 M2 (`spawn033`),
params033s01. **The page offers no (6, 3) play yet**: psl-mask.js CLIP_ACTIONS.em033_00 `'0|Motion[2]'` names copy A (no action) and
copy B ((6, 2), posture 4), so rockInput filters (6, 3) out on both -- the burrowed wait needs its own copy entry (named, not added:
that table is the clip menu's).

## 5. Checked

`dev/shells-akantor-check.mjs` 5 / 5: (6, 3) at P+0x1bc 24 (the harness stubs the countdown), and turned with the floor 40 lower;
the ground probe answered by the floor plane (emu_fb `probe49aec`); controls his Y word 0x100 more and his position 1 along x -- each
fails. Page: FAILS for the copy reason above. Record em033_00u 10 (UNIQUE) to export.
