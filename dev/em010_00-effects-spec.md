# Plesioth (em010_00) -- effects spec (Piscine Wyverns walk, 2026-10-17)

Class `uEm010_00` (vtable `0x179e2b8`). States: `states-em010_00.md` (transcribed in motion-states.js before this pass; the
shock trap's c 1105 fourth arm of L3 M2 was already wired 2026-10-15). Survey: dev/amphibians-piscine-effects-survey.md.
Scratch: `<scratchpad>/zg/jscheckpd.py`, `allmot2.py`, `depth010.py`, `latch*.py`, `latchdyn.py`.

## 1. The PSL enable word -- vt+0x13c = `0xd6bbc8` -- R, read whole and emulated

`0xd6bbc8..0xd6bc68`: `0xca170`; L0 M18 (0x12): `[P+0x1ba] == 4` and `[P+0x5c] < -550.0` (literal `0xd6bc6c`, `vcmpe`, `movpl`)
-> bits 18-20, else bits 15-17 (c 270); L2 M2 (0x202) with `e+0x73e0 == 7`: number 0x13 -> bits 24-26, 0x12 -> bits 21-23,
else nothing. Check (`jscheckpd.py 179e2b8 em010_00`, motions 1 / 0x12 / 0x13 / 0x202 / 0x203 / 0x302 x statuses 7 / 1 x every
number x posture 0 / 4 x P+0x5c in {0, -100, -549, -551, -1000, -2000} x rage x tired x rank): **295488 runs, 0 mismatches**;
control (em065_00's base transcription): 24864 / 49344 mismatches.

## 2. The plays -- R (tracer)

`allmot2.py 0 12,202` (every status x number x phase x follows):
* L2 M2: **(7, 0x12)** and **(7, 0x13)** only, posture 0. Today's viewer showed both attacks' sets at once.
* L0 M18: (0, 4 / 5 / 7) (`0xd62be4`), (6, 0xc) / (6, 0x70) (`0xd6666c`, `0xd66704`), (6, 0xf) / (6, 0x10) -- each
  `0xbc7f4(4)` then `0xbf700(-100.0)` (`P+0x5c = s0`, read whole: `0xbf700..0xbf718`) BEFORE the setMotion: shallow, bits
  15-17. And **(12, 0)** (`0xd6a300`): `0xbf700(0x6f618(e, 7))` -- action-tune float 7 = **-1000.0** in
  `em010_00_actiontune.fup` (FUP v2, floats [0.6, 5000, 540, 2400, 300, 2, 3, -1000, 3]; the getter `0x6f618` -> `0x3cb330`,
  rom-map) -- deep, bits 18-20, which nothing binds. Its phase 1 replays L0 M18 at that depth.
* L0 M18 is a `_loop` clip, so a replay is not a new play in the viewer and a counted entry list could never reach (12, 0).
  New, shared: CLIP_ACTIONS entries may name a CLIP_VARIANTS copy (`variant: 'B'`); psl-mask.js `clipEntryIndex` picks the
  n-th of that copy's entries, index.html passes it (`plays.cn`) to clipActionFor / Posture / Sunk / Phase / Field. No other
  monster's entries name a copy, so every other play is unchanged (n). Plesioth's L0 M18: copy A the water idles, B (12, 0).

## 3. u 1400 -- R: nothing requests it

No class call into `0xa499c` (rom-map sweep). The shared latch `0xadc98` needs `e+0x1404` bits 20 + 21 and `e+0x1408` bit 0.
He raises bit 20 (`0xd64980`; dynamic census: action (2, 0x18), phases 0-1), but bit 0 of `+0x1408` is raised only by
Lavasioth's `0xe42bd0` (static scan of every store into `+0x1408`; the ctor `0x71888` writes 4), and his census never raises it.
So the latch never requests u 1400 for him. Control: the same census finds Uragaan's bit 20 on (6, 3) / (6, 6).

## 4. Implemented

psl-mask.js `em010_00` (CLASS_MASK, PSL_MASK_MONSTERS) + CLIP_ACTIONS em010_00 + `clipEntryIndex`; index.html `depth` input
and `plays.cn`; motion-states.js CLIP_VARIANTS em010_00 L0 M18 A / B. `--apply`: nothing new to export. Check
dev/checks/em010_00.mjs: word asserts, L2 M2 back-to-back plays, L0 M18 copies A / B; its stale "9 event" count (the schedule
now also carries the shared states) replaced by his named records. **Check 55 / 0.**
