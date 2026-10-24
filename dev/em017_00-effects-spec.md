# Cephadrome (em017_00) -- effects spec (Piscine Wyverns walk, 2026-10-17)

Class `uEm017_00` (vtable `0x17a9d80`). States: `states-em017_00.md` (already transcribed; c 1105 already wired). Survey:
dev/amphibians-piscine-effects-survey.md (no undriven record). Scratch: `<archive>/zg/jscheckgen.py`, `allmot2.py`.

## 1. The PSL enable word -- vt+0x13c = `0xda3738` -- R, read whole and emulated

`0xda3738..0xda3780` (19 instructions): `0xca170`; `motion - 0x409 <= 2` (L4 M9 / M10 / M11): `0x6fe88(e, 7, 0xc)` -> return;
else `|= 0x38000` (bits 15-17, c 60). Check (`jscheckgen.py 17a9d80 em017_00`, motions 0x408..0x40c / 0x21d / 0x21e / 1 x
statuses 1 / 7 / 10 x every number x rage x tired): **24608 runs, 0 mismatches**; control (em065_00's base transcription): 1024
/ 1028. His four out-of-mask bindings (c 121 b1 L2 M29 / M30, c 30 b2 / u 200 b0 L2 M30) are base bits 0-2: on every play, now
that he is listed (whole-block CLIP_EFFECTS).

## 2. The plays -- R (tracer)

`allmot2.py 0 409,40a,40b`: L4 M9 = (5, 4) phase 0, L4 M10 = its phase 1 -- always c 60. L4 M11 = twenty status-5 plays (5, 5 /
6 / 9 / 0xa / 0xb / 0x13 / 0x14 / 0x1b / 0x1f..0x27 / 0x2a / 0x2b; posture 2) -- c 60 -- and **(7, 0xc) phase 1** (phase 0 is L4
M12; `0xbf700` on the way): no c 60. Shown as L4 M11's copy B (CLIP_VARIANTS + CLIP_ACTIONS `variant: 'B'`, the mechanism in
dev/em010_00-effects-spec.md 2).

## 3. Not here

u 1400: nothing requests it -- he raises `e+0x1404` bit 20 (`0xd9d5bc`) but never `e+0x1408` bit 0 (only Lavasioth's
`0xe42bd0` does; dev/em010_00-effects-spec.md 3). The shell00 spit records u 0 / u 1 (no SHELL_DATA): the shells lane.

## 4. Implemented

psl-mask.js `em017_00` + CLIP_ACTIONS; motion-states.js CLIP_VARIANTS em017_00 L4 M11 A / B. `--apply`: nothing new to export.
Check dev/checks/em017_00.mjs (word asserts, L4 M11 copies A / B in the page): **54 / 0**. Soak: **74 motions, 0 refused**.
