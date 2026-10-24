# Kirin (em011_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm011_00` (vtable `0x179f740`). States: states-em011_00.md (transcribed before). Scratch: `<archive>/zg/jscheckpd.py`,
`sweepmot.py`, `vt208_011.asm`.

## 1. The PSL enable word -- vt+0x13c = `0xd73a18` -- R, read whole and emulated

`0xd73a18..0xd73b80` (a 44-entry jump table on number - 5 at `0xd73ac0`): `0xca170`, then L4 M7 (0x407): (7, 5 / 7 / 0xb / 0xd /
0x2d..0x30) -> 0x238000 (bits 15-17 + 21); (1, 6) -> 0x3c0000 (bits 18-21); L2 M4 (0x204): bits 24-26 unless `0x6fe88(e, 7, 2)`.
Emulation: **369120 runs, 0 mismatches**; control (js em068_00) 62160.

## 2. The plays -- R (tracer)

L4 M7: A the rage roar (1, 6), B (1, 7) (the same clip without the 0xd6ecdc preamble: the base word, no rage entry), C the attacks
(7, 5 / 7 / 0xb / 0xd / 0x2d..0x30). L2 M4: A every other status-7 play, B (7, 2) phase 1. CLIP_ACTIONS / CLIP_VARIANTS; rows
`4|Motion[7]#B` / `#C` carry no rage.

## 3. The lightning aura -- R (vt+0x208 `0xd6df64`, read whole to `0xd6e2d4`)

Built (motion-states.js `CLASS_TIMERS.em011_00`, `MotionStates.stepClassTimers`). Every frame: ctl+0xc = ctl+0xd = 1, ctl+6 =
isEnraged; calm, or the roar (1, 6), clears ctl+0xd and zeroes the enraged countdowns e+0xcac8 / e+0xcacc; L3 M4 / M5 / M7 / M8
and L4 M6 set e+0xcac4 = 40 and ctl+0xc = 0; at death (vt+0x3f4) nothing. Enraged and not in the roar: **u 61 every 32** (id 1002)
while the horn is intact (part 0 below its .dtp row -- set 4 not shown), **u 60 every 45** (id 1003) except on L4 M7 below frame
60 (`0xb0968(e, 2, 0, 60.0)`, mode 2 "cur < s0"); calm: **u 0 every 40** (id 1001). `0x7206c` at rate 1 (fires at 0, then the
period). `0xd6e2ec` (called first) swaps the hit-zone rows (no effect); the hook's tail (`0xb0974` frames into `0xc241c`) requests
no effect. The three records were exported as `clip` and never driven: retagged `event` (format kept).

## 4. Implemented / results

psl-mask.js `em011_00` + CLIP_ACTIONS; CLIP_VARIANTS; motion-states.js CLASS_TIMERS (+ the `records` add_effects now exports);
`--apply` +3 (u 200 / 201 / 230), recorded: the u 60 `_stop` set (stop at 60) exhausts the recorder's budget in a list walk at
`0x7abfb8` (recorder side, reproducible); stops at 20 and 100 recorded instead (rec_stop.py). Check dev/checks/em011_00.mjs
(aura and word tests added).
Check dev/checks/em011_00.mjs **44 / 0** (aura + word tests). Soak **32 motions, 0 refused**.

* **Draw meter (2026-10-19):** u 264 drew nothing on its first play while its model glb was still loading. Fixed: live.js preloads every effect model and texture. It draws now.
