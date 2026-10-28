# Blangonga (em022_00) -- effects spec (Fanged Beasts walk, effects agent, 2026-10-17)

Class `uEm022_00`, vtable `0x17b1254`. From dev/fanged-beasts-effects-survey.md row 2 (enable word first-looked only; c 40 /
41 / 42 unexported; c 1105 and u 1400 "undriven"). Scratch: `<archive>/zg/jscheck022.py`, `tracec.py`.

## 1. The PSL enable word -- vt+0x13c = `0xdda5ac` -- R, read whole and emulated

Extent `0xdda5ac..0xdda65c` (the pop). `0xca170`, then k = motion - 5 (`cmp #0x1c`):
* k in `0x200f` (L0 M5 / M6 / M7 / M8 / M18): `0x81d6c` ? bits 18-20 (none bound) : bits 15-17 (c 0 / c 1 / c 43 / c 30);
* k in `0x18000000` (L0 M32 the rage roar, L0 M33 the summon howl): bits 21-23 (c 120) while `0x9d36c(e, 0)` (the fangs'
  break level) is BELOW the .dtp array A row 0 byte 1 (rank <= 4) / byte 2 (`0x3a8430` > 4): both **2** in his file.

Check (`jscheck022.py`, the real .dtp, MoguriBaseOfs answered -500 as states-em022_00.md 7 reads it, posture / P+0x5c at and
around the 0.9 x threshold, levels 0..3, ranks 0 / 3 / 5): **3840 runs, 0 mismatches**.

## 2. Who plays the keyed clips -- R (tracer with turn-table and posture calls logged)

* L0 M5 / M6 -- turn table `0x169ceac` (+0x20 L0 M6, +0x30 L0 M5): posture 0 (2, 1 / 9 / 0xa); **posture 4, sunk** (6, 4 / 0xd /
  0xe) -- `0xbc7f4(4)`, `0xbf62c`, `0xbf700` before the turn (`0xddee80..0xddeecc`).
* L0 M7 / M8 -- table `0x169ceec` (+0x20 M8, +0x30 M7): posture 0 (2, 4 / 0xb); sunk (6, 9 / 0xf / 0x10).
* L0 M18 -- posture 0 (2, 0x11), (7, 0xa); sunk (6, 7 / 8 / 0xc).
* L0 M32 (1, 4) the rage roar; L0 M33 (1, 8 / 0xc / 0xd / 0xf).

## 3. Implemented

psl-mask.js `em022_00` + CLASS_MASK + PSL_MASK_MONSTERS; CLIP_ACTIONS (L0 M5..M8 / M18: a surface play and a sunk snow-dive
play); motion-states.js SHELL_PARTS em022_00 `{ fangsBroken: 2 }` (group 2 is drawn by set 7 only, the broken muzzle) and
index.html passes it. --apply +3 (c 40 / 41 / 42, the ground-ray records), 6 sets recorded, lift rc 0. Soak 65 / 0; check
dev/checks/em022_00.mjs 58 / 0 (the word table, L0 M5 surface then sunk, L0 M32 with the Teeth row Broken).

Already done, against the survey: c 1105 -- CLIP_VARIANTS em022_00 L3 M9 A / B (the trap copy). **u 1400: READ -- he has none.**
No `b` / `bl` to `0xa499c` in his band (survey scan; control: Bulldrome's `0xe1e8d0` found). The shared gate (`0xadc98`..
`0xadcdc` in `0xada80`) requests it only when `e+0x1404` has bits 20 AND 21 and `e+0x1408` bit 0. Bit 20 is raised only by class
code -- eleven classes (uEm010, 017, 019/020, 045, 049, 055, 056, 066, 067, 068, 069), each before its posture-4 dive or roll;
the ctor `0x71878` zeroes the word; the shared layer raises bits 21-22 only (`0x8fc28`, `0x90e5c`, `0x91ed4`). Blangonga's band
writes `e+0x1404` three times: bit 18 (`0xdda514`) and bit 19 (`0xddbca0`, `0xddc25c`). Dynamic census of his action main
(`<archive>/zg/latchdyn.py`, every status x number x phase x ended): bit 19 only, 8 cases; control, Uragaan the same way:
bit 20 on (6, 3) / (6, 6). So the latch never opens for him and nothing requests u 1400 -- not a gap. (The earlier wording,
"a one-shot latch the viewer does not model", is withdrawn: rom-map's sweep row.)

## Lane A2 (2026-10-26): u 60 built, u 1400 a ROM reason

* **u 60** (the snow dive's burst): (7, 0x14 / 0x15 / 0x16) phase 0 (`0xdddbc8`) sets posture 4, sinks (`0xbf62c` / `0xbf700`),
  sets L0 M20 and asks id 1001 = u 60 at his unit position (`0xdda664`: the position alone, +0x1c |= 3, +8 = 2). Built as L0 M20 copy B
  (CLIP_ACTIONS / CLIP_VARIANTS / MOTION_STATES `start` with `{ unitPos, type8: 2 }`); copy A is the idle (0, 7). It draws.
  L0 M20 is a clip of no length, which froze the effect clock; index.html animAdvance now hands such a clip the wall clock while it
  plays (rom-map "VIEWER FIX: a clip of no length"). The sink itself is not modelled (what `0xbf700` writes is NOT READ).
* **u 1400**: never requested -- no `0xa499c` call in his band, his one class request is u 60, and the shared latch needs bits only
  other classes raise. Brought to the coordinator (rom-map "Effects lane A2").

## Lane A3 (2026-10-26): u 60's sink

(7, 0x14..0x16) phase 0 sets posture 4 and P+0x5c = MoguriBaseOfs (`0xbf62c` = dtbase +0xa8; the .dtb's -500.0) through `0xbf700`.
In posture 4 the drawn offset's decay is skipped (`0xa5e04`), so the body is drawn 500 x the spawn size under his unit for the
whole play, and u 60 stands at the unit on the ground. The viewer draws no posture-4 offset for any monster: a viewer limit,
brought to the coordinator (one rule for every posture-4 play, not a Blangonga row).
