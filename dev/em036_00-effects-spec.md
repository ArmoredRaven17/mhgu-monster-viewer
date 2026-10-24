# Lavasioth (em036_00) -- effects spec (Piscine Wyverns walk, 2026-10-17)

Class `uEm036_00` (vtable `0x17baff4`). States: `states-em036_00.md` (transcribed before this pass; c 1105 was wired). Survey:
dev/amphibians-piscine-effects-survey.md. Scratch: `<archive>/zg/jscheckpd.py` (MOGURI=-2000), `allmot2.py`, `tracec.py`,
`depth010.py`, `latch*.py`, `latchdyn.py`.

## 1. The PSL enable word -- vt+0x13c = `0xe3f6c4` -- R, read whole and emulated

`0xe3f6c4..0xe3f770` (44 instructions): `0xca170`; L2 M14 (0x20e): `0x3a8430` (the quest rank) > 4 ? bits 18-20 (u 241) :
bits 15-17 (u 231); L0 M21 (0x15): `0x81d6c` == 1 (posture 4, P+0x5c < 0.9 x MoguriBaseOfs; his .dtb -2000) -> bit 15; L0 M13
(0xd): `e+0x73e0 == 1` and `(e+0x73e1 & 0xfe) == 0x30` -> bits 15-17. Check (`MOGURI=-2000 jscheckpd.py 17baff4 em036_00`,
motions 0xd / 0xe / 0x15 / 0x16 / 0x20e / 0x20f / 1 x statuses 1 / 7 / 6 x every number x posture x eight depths x rage x tired
x rank 3 / 5): **689024 runs, 0 mismatches**; control (em065_00's base transcription): 37264 / 98688.

## 2. The plays -- R (tracer)

* L0 M13: (1, 0x30) / (1, 0x31) (bits 15-17) and (1, 0x32) / (1, 0x34) (none). A plain clip: counted.
* L0 M21 (`_start` + `_loop`, so copies): **A** the dive (6, 0) / (6, 1) -- `0xbf62c` -> `0xbf700` (P+0x5c = -2000) and posture 4
  before the setMotion: sunk; **B** (6, 0xa) / (6, 0x1e) / (6, 0x25) at P+0x5c -353 (not sunk); **C** (7, 0x13)'s phase 1
  (sunk).
* L2 M14: the rank alone decides (index.html's quest rank, SHELL_QUEST_RANK).

## 3. u 1120 -- R, the contradiction settled

The dive's handler `0xe41d20` ((6, 0) / (6, 1)) sets L0 M21 at phase 0 and tail-calls `0xa499c(e, 0)` (`0xe41e04` / `0xe41e10`);
(7, 0x13)'s phase 1 does the same after its L0 M21 (`0xe44308` / `0xe44314`). Tracer: `U1400 r1=0` on exactly those three plays.
`0xa499c` asks id r1 through `+0x1d0` -> the shared base u table index 0 = **u 1120** (cm200_007, end mode 0: one-shot).
states-em036_00.md's "Key 1120 is never requested" read the rage puff path only (his puff picks u 1121) -- withdrawn in rom-map.
His u 1120 export was a `ragePuff` entry the puff never starts; it is now an `event` (motion-states.js L0 M21 A / C `start`).

## 4. u 60 -- R

vt+0x204 `0xe3f318` sets `e+0xcae8` = 1 exactly for (6, 4 / 5) and (7, 0xf..0x14) (re-read here, the status jump table);
vt+0x208 `0xe3f0e8` requests id 1001 (-> key 60, `em036_00_011_s`, mode 3, end 1) while it is 1 and kills the handle
(`0x329c40(h, 0)`) when it drops. The actions' clips (tracer): (7, 0xf) L0 M30 -> L2 M10, (7, 0x10) L0 M30, (7, 0x11) L2 M10,
(7, 0x12) L2 M11 -> L0 M30, (7, 0x13) L0 M18 -> L0 M21, (7, 0x14) L0 M16, (6, 4 / 5) L0 M18. Shared clips get a copy B for those
plays (L0 M30, L2 M10, L0 M18, L0 M16; L0 M21's C); L2 M11 is (7, 0x12)'s alone. `hold` rows on each. Exported, recorded.

## 5. u 1400 -- R: nothing requests it

He raises `e+0x1408` bit 0 (`0xe42bd0`, action (6, 0x24): census) but never `e+0x1404` bit 20 (only eleven other classes do),
so the shared latch `0xadc98` cannot open (dev/em010_00-effects-spec.md 3; rom-map u 1400 rows).

## 6. Implemented / not here

psl-mask.js `em036_00` + CLIP_ACTIONS (variants); motion-states.js CLIP_VARIANTS em036_00 and the rows above; effects json
`--apply` +3 (c 16, u 241, u 60) and u 1120 retagged `event`; `--record` 8 sets; lifted. The shell00 / shell01 spit and pool
records (u 0..4, 30..33, 90, 91, 100..102): the shells lane.
