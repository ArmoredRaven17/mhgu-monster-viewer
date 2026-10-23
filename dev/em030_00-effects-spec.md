# Bulldrome (em030_00) -- effects spec (Fanged Beasts walk, effects agent, 2026-10-17)

Class `uEm030_00`, vtable `0x17b7b40`. From dev/fanged-beasts-effects-survey.md row 5 (word first-looked; u 1400 undriven).

## 1. The PSL enable word -- vt+0x13c = `0xe1c4b0` -- R, read whole and emulated

`0xe1c4b0..0xe1c4fc`: `0xca170`; motion <= 0xe in `0x40e0` (L0 M5 / M6 / M7 / M14): `0x81d6c` ? bits 18-20 (none bound) : 15-17
(c 30 / c 31 / c 91). Check (`jscheck030.py`): **2400 runs, 0 mismatches**.

## 2. Plays -- R (tracer)

L0 M5: (2, 2 / 8 / 0xc) surface; **(6, 2)** the dig charge -- `0xbf62c`, `0xbf700`, `0xbc7f4(4)` then L0 M5, sunk. L0 M6 / M7:
turn table `0x169d794` (+0x10 / +0x20 L0 M6, +0x30 L0 M7) -- (2, 0 / 0xe) surface, (6, 1) burrowed. L0 M7 also (2, 4 / 6).
L0 M14: (2, 5) surface; (0, 7) the burrowed idle (sunk).

## 3. u 1400 -- R, wired

The dig charge (6, 2) tail-calls `0xa499c(e, 2)` at `0xe1e8d0` (id 2 -> u 1400, handle e+0xb7c4) on its own play of L0 M5 (the
tracer: `U1400 r1=2` with the motion L0 M5); the surface plays ask nothing. MOTION_STATES em030_00 `'0|Motion[5]': { hold:
u 1400, posture: 4 }` -- the row gate keeps it to the burrowed play.

## 4. Implemented

psl-mask.js `em030_00` + CLIP_ACTIONS (each clip surface then burrowed); nothing new to export.
