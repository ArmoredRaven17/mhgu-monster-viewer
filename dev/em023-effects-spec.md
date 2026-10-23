# Rajang (em023_00) / Furious Rajang (em023_05) -- effects spec (Fanged Beasts walk, effects agent, 2026-10-17)

One class `uEm023_00`, vtable `0x17b22a8` (the word has no variant test). From dev/fanged-beasts-effects-survey.md rows 3-4.

## 1. The PSL enable word -- vt+0x13c = `0xded0f4` -- R, read whole and emulated

`0xded0f4..0xded23c`: `0xca170`; motion `0x208` (L2 M8) only; `0x81614` (tired) -> nothing; else the action NUMBER (`e+0x73e1`,
the status is not read) - 6 <= 0x3a through table `0xded140`: **6, 0xa, 0x34, 0x35, 0x3e, 0x3f, 0x40** -> bits 15-17 (u 291).
Check (`jscheckgen.py`, every call native): em023_00 15380 runs, em023_05 1028 runs, **0 mismatches**.

## 2. Plays -- R (tracer)

L2 M8 is played by (7, 5 / 6 / 0xa / 0xc / 0x3b / 0x3e / 0x43): u 291 on (7, 6 / 0xa / 0x3e) only, never while tired.
CLIP_ACTIONS: [(7, 6), (7, 5)].

## 3. Implemented

psl-mask.js `em023` for both; --apply +2 each (c 153, u 294 -- base-bit bindings outside the old file mask); 4 + 4 sets.
Already done, against the survey: both MOTION_STATES blocks (2026-10-15), the shock trap (CLIP_VARIANTS L3 M13 A / B). Not gaps
(read): Rajang's u 1120 / 1121 (variant 0 zeroes e+0xb7d2), Furious's c 1104 / c 1109 (tune+0x30 / +0x44 NULL).

## 2026-10-17: L2 M8 against the shells' pick rotation

shells.js pickVariantsFor now rotates L2 M8 through (7, 6), (7, 0xa) (the beams), then (7, 5), (7, 0xc), (7, 0x3b) (the ball),
and index.html takes each play's action from that pick (CLIP_ACTIONS L2 M8 is then unused). The word (table `0xded140`: 6 / 0xa
in, 5 / 0xc / 0x3b out) lights bits 15-17 on the two beam plays of five -- measured in the page (dev/checks/em023_00.mjs /
em023_05.mjs, a new assert: 75 / 0, 54 / 0). The ROM's other L2 M8 actions are not in the rotation: the tired remaps (7, 0x3e) /
(7, 0x43) (vt+0x1fc `0xde1f50`; tired, so the word lights nothing anyway) and g1 s35's direct (7, 0x3e) -- lit, no beam: one
action the viewer does not show, named (a pick with no shell is the shells side's call). The check's first version replayed
`Motion[8]_loop`, which continues a play and never advanced the pick: it plays `_start` now.

## Control block re-check (2026-10-19, trap 117's follow-up; rom-map "the control block [e+0xcac0] SET NON-ZERO")

* **A frame-handler request the viewer does not drive** (Rajang and Furious). vt+0x208 `0xde2760..0xde27c4`:
  * C+0x16 bit 1 is set while C+4 != 0 and the motion is not L2 M24;
  * then c id 1002 (vt+0x1cc) is requested once.
  * C+4's writer is NOT READ.

## c 30, the pump-down (effects lane, 2026-10-20) -- built

* The writers of ctl+4 are now read:
  - vt+0x204 `0xde220c`'s (1, 0x32) arm sets ctl+4 = 1 and the timer ctl+8 = 3600.0 (`0xde230c`).
  - `0xde3d78` clears ctl+4 when the timer runs out.
* vt+0x208 `0xde2760..0xde27c4` latches ctl+0x16 bit 1 while ctl+4 is up off L2 M24. Then, once, it requests c id 1002 (vt+0x1cc
  table 0x169d238) = c 30.
* Driven off the Armor Mode rung (CLASS_TIMERS em023_00 / em023_05): c 30 fires on the frame the rung leaves Armor Mode, at death,
  or when L2 M24 plays while pumped. Measured on both: 1 start, draws (lit 12 / 14).
