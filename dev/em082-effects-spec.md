# Mizutsune (em082_00) / Soulseer (em082_04) -- effects spec (Leviathans walk, 2026-10-17)

One class `uEm082_00` (vtable `0x17ee478`). States transcribed before (states-em082_00.md). Scratch: `<scratchpad>/zg/
jscheck082.py`, `actmot.py`, `allmot2.py`, `hit082.py`.

## 1. The PSL enable word -- vt+0x13c = `0x1038cac` -- R, read whole and emulated

`0x1038cac..0x10390dc` (next `push` at `0x10390e0`), two 60-entry jump tables on motion - 0x20a (`0x1038de0`, `0x1038fb8`):
transcribed in psl-mask.js `em082` with the arms in its comment (action-keyed on e+0x73e0 / +0x73e1; SET_A = L2 M10 / M11 /
M12 / M21 / M39 / M40 / M41 -> bits 24-26, Soulseer 27-29 while `P+0x1bb` bit 1, the soul flame). Check (`jscheck082.py`, 26
motions x statuses 0 / 1 / 6 / 7 / 10 x every number x rage x tired x variant 0 / 4 x P+0x1bb 0 / 2 / 0xd): **799344 runs, 0
mismatches**; control (Soulseer judged as Mizutsune) 2052 / 36936.

## 2. Plays -- R (tracer)

L0 M12 (1, 4) 18-20 / (1, 8) 15-17 (copy B); L0 M4 (2, 0xd / 0x2e / 0x36) nothing / (1, 8) 15-17 (B); L0 M15 (1, 0x16 / 0x17)
21-23 / (1, 3) nothing (B); L2 M1 (7, 7) / (7, 0x23); L2 M2 (7, 8) / (7, 0x24); L2 M69 (7, 0x19 / 0x26 / 0x70 / 0x71 / 0x7b);
L2 M70 (7, 0x19 / 0x26) nothing / (7, 0x7b) 18-20 (B); L3 M3 / M6 status 10 -> 18-20. The L0 M12 out-of-mask bindings (u 112 /
113, c 120..130) now fire by the play.

## 3. NAMED: the soul flame

Soulseer's SET_A arm reads `P+0x1bb` bit 1, lit at the end of his four rage roars (`0x1039320`, note 9) and put out at an action
start after EMC request 0x13. The viewer has no soul-flame state: shown unlit (`soulFlame` undefined). Raven's call whether a
toggle should carry it (it would also drive u 300).

## 4. Soulseer's class requests -- R (the actions read here)

* u 310 (`em082_04_008`, end 1) held while `e+0xcb45 != 0` (vt+0x208), set by the leaf `0x1039678` at `0x103b7a0` ((1, 0x14 /
  0x15) phase 1, L9 M1), `0x103e320` ((2, 0x36) phase 1), `0x1047880` / `0x10477f8` ((7, 0x6a / 0x6b), L9 M5 -> M6),
  `0x1047b44` / `0x1047a9c` ((7, 0x6c / 0x6d), L9 M8 -> M9) (`hit082.py`, every action x phase); cleared at the next action start.
  u 300 (the flame) is held off meanwhile (vt+0x208 holds it only while `e+0xcb45 == 0`): `eyesOff`.
* At an action start (vt+0x204 `0x1037318..0x103749c`, table `0x16a2290` on number - 0x6e): selector 1 -> id 1003 u 320 ((7, 0x6e
  / 0x6f), L9 M6 / M9), 2 -> 1004 u 330 ((7, 0x75 / 0x76), and (2, 0x36) after (2, 0x36)), 3 -> 1005 u 321 ((7, 0x77..0x7a)).
* Shown by copies: L9 M6 / M9 A (u 310) B (u 320) C (u 330) D (u 321), L9 M1 B, L0 M4 C ((2, 0x36): u 310). NAMED: (2, 0x36)
  repeated (u 330) -- a play cannot tell it follows itself.
* Mizutsune's own class requests nothing (note 9: all three sites behind e+0xb5f5 == 4).

## 5. Implemented

psl-mask.js `em082` + EM082_ACTIONS (Soulseer's own); CLIP_VARIANTS; MOTION_STATES rows for Soulseer. `--apply` / `--states`:
Mizutsune +6 (c 71 / 72, c 120..122 / 130 ...), Soulseer +6 and u 310 / 320 / 321 / 330 (UNIQUE) as events; recorded, lifted.

## 6. FIXED 2026-10-18 -- u 310 stopped early drew a stopped request unmoved

What `0xb97910` tests (R): `0xb978cc` is the flush of the GPU quad batch (vtable `0x178e210` +0xc via `0xb9a5f0`); `[sb+0xf8]` is
the batch's index count, zeroed by the frame begin and raised only by the quad add `0xb99750` (`+0xf4 += 4`, `+0xf8 += 5 / 6`).
Zero at the flush -> `r7 = 0x11`, the "nothing staged" return. The caller is the generator draw `0xaf24d8` (`0xaf2654 blx`),
which flushes `u16[gen+0x1f8] x [.. +0x230]` instances. In the page (`<scratchpad>/zg/dbg082l.mjs`, an ordered trace of renders,
steps, holds and flushes): the hold's stop (`HOLD 310 false`) landed between steps, and the next render had no step (`advance` 0
at the clip change), so the generator drew its stopped state with nothing staged. The game cannot: the class stops its handle
(0x329c40) in the enemy update, ahead of the effects' passes, and every draw follows a move. It was the viewer's ORDER, not an
unrecorded state, so no recording could cover it (the early-stop sets of `rec_stop.py`, base / near / between-passes, did not).

Fix (render/rom/effect/schedule.js, shared): a request holdEvent stops is stamped with the step it was stopped in, and
effects() leaves it out of the draw until a step has moved it -- the game's order (stop, then move, then draw). [A first
version queued the stop itself to the next step; that left a paused clip's held record running (Nibelsnarf's stun chain c 1103,
em056_00.mjs "off the chain it is stopped" -- 0 steps over 6 renders), so the stop is immediate again and only the draw waits.]
dbg082j / dbg082f: every early leave clean. The em082 check plays the early leave again (142 / 0); em056_00 48 / 0; re-run
after it: em057_00 169, em060_00 72, em036_00 61, em046_00 66, em010_00 55, em049_00 31, em021_00 76, em083_00 62, em047_00
48, em023_00 75 -- all 0 failed. Soaks em082_00 90 / 0, em082_04 95 / 0.

## 5. The Soul Flame control (Raven, 2026-10-18)

- **The state:** P+0x1bb bit 1.
  - Set only by 0x1039320, at the ends of his four rage roars (1, 0x10..0x13).
  - Cleared in vt+0x204's tail (0x10374b0..0x10374f0) at an action start once EMC request 0x13 armed e+0xcb46. That clear
    also ends the rage.
- **What reads it** (every 0x1bb operand in the class band, 51, scanned):
  - the enable word 0x1038f4c (bits 27-29 in place of 24-26);
  - u 300's hold, vt+0x208 0x1036314: id 1001 on e+0xcbc0 while bit 1 is set and e+0xcb45 == 0, stopped otherwise, no dying
    gate;
  - the shells' getter 0x1035ee8 (six makers);
  - EMC op 0x6f selector 8;
  - a tune pick 0x1035c6c (floats 0x85 / 0x86 / 0x87).
  - His part pass 0x10384dc and material pass 0x1037fa8 test only bits 2 / 3 (the furs). **No part set or material clip
    changes with the flame.**
- **Wired:**
  - CLASS_CONTROLS.em082_04, "Soul Flame" Off / On (the label is a working one, for Raven);
  - the word reads it as `soulFlame`;
  - CLASS_TIMERS.em082_04 holds u 300 by the ROM's rule (e+0xcb45 is the P310 rows' `eyesOff`);
  - u 300 retagged from rage to event.
- **u 200 / 201 / 210:** the soul-flame bubbles' shell records. Exported as shell records and recorded (rec_shellrec). Taking
  the arms is the shells lane's (told).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **L0 M4 copy D -- BUILT 2026-10-19**: (2, 0x36) repeated -- u 330 at its start (selector 2) and u 310 held as copy C.
