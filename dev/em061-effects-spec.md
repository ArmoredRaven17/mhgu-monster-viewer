# Lagombi (em061_00) / Snowbaron Lagombi (em061_04) -- effects spec (Fanged Beasts walk, effects agent, 2026-10-17)

One class `uEm061_00` (vtable `0x17d79c0`). From dev/fanged-beasts-effects-survey.md rows 8-9 (word first-looked; c 1105 on the
paralysis holds).

## 1. The PSL enable word -- vt+0x13c = `0xf32bac` -- R, read whole and emulated

`0xf32bac..0xf32c4c`: `0xca170`; L0 M6, and motion - 0x33 <= 0xa in `0x601` (L0 M51 / M60 / M61): bits 21-23 unless `0x81d6c`;
then variant 4 only (Snowbaron): L0 M2 / L0 M52 -> bit 15 (c 10 -- Lagombi's binding never fires), L2 M57 `0x239` -> bit 18
(u 302). Check (`jscheck061.py`): **2040 runs, 0 mismatches**.

## 2. Plays -- R (tracer)

Turn table `0x169f720` {L0 M51; L0 M61 / M60}: (2, 4 / 0xb / 0x5a) surface, (6, 1) after `0xbc7f4(4)` + `0xbf700` (sunk). Table
`0x169f760` {L0 M51; L0 M63 / M62}: (2, 5 / 0xa) surface. L0 M6: (2, 0 / 0x53 / 0x5b) surface, (6, 2) in posture 4 (sunk: I).

## 3. Implemented

psl-mask.js `em061(v4)` + CLIP_ACTIONS (EM061_ACTIONS); nothing new to export. The shock trap was already wired (CLIP_VARIANTS
L3 M13 / L3 M73 A / B). Check dev/checks/em061_00.mjs 96 / 0 (the stale "6 event" count fixed); soaks 87 / 0, 98 / 0.

* **Draw meter (2026-10-19):** c 64 draws nothing in the game either: its MASK1 0x100000 selects no row; the rows carry 1 / 2 / 4. u 12's shell draws off camera, at z 26413 (Snowbaron Lagombi: z 31230), for the shells lane to confirm.
