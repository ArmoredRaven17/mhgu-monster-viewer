# Daimyo / Stonefist / Shogun / Rustrazor (em019_00 / em019_04 / em020_00 / em020_04) -- effects spec (Carapaceon walk, 2026-10-18)

Two classes: `uEm019_00` (em byte 0x13; Daimyo, and Stonefist as variant 4) and `uEm020_00` (em 0x14; Shogun, Rustrazor as
variant 4). Their states were wired before (states-em019_00.md, `crabLine` in motion-states.js); this walk reads the enable
words. Scratch: `<scratchpad>/zg/jscheck019.py`, `w019.asm`, `tracec.py`.

## 1. The PSL enable words -- R, read whole and emulated

`uEm019_00` vt+0x13c = `0xdc0ff4` (`0xdc0ff4..0xdc1460`, with a 60-entry jump table on L2 M2..M61 at `0xdc108c`). `uEm020_00`'s
word `0xdc5ac4` (`..0xdc5bf8`) calls `0xdc0ff4` first and adds its own arms -- one read serves four. Most arms need e+0xb5f4 ==
0x13 AND variant 4 (STONEFIST alone):
- L2 M2 / M4 / M11 (status 7 only): numbers in set 0x7f803 (0xed..0xff) -> bits 30-31 (Stonefist); 0x0 / 0xd / 0xf -> bits 27-29
  (all four).
- L2 M6 / M8 (status 7): 0xe / 0x10 -> bits 27-29 (all); 0xdd and the set 0x7f803 -> Stonefist's claw: part 5 at .dtp row 0's
  level (`claw5Broken`) ? bits 21-22 : bits 19-20.
- L2 M18 / M54 / M61 (k 16 / 52 / 59): em 0x13 only -- Stonefist bits 21-23; Daimyo by rank (> 4: bits 18-20, else 15-17).
- L3 M2..M11 (mask 0x23d): Stonefist bit 18. L9 M2 / M11..M13: Stonefist, part 2 at row 3's level (`shellBroken2`) ? bits 25-26
  : bits 23-24. L9 M14: Stonefist, `claw5Broken` ? bits 18-20 : bits 15-17. L0 M4: bits 15-17 unless sunk (all four).
- uEm020_00's own: Shogun -- L2 M68 / M69 / M11 -> bits 18-19, L4 M3 -> bits 21-22. Rustrazor -- on L2 M68 / M69 / M11, L9 M9 /
  M10 and L4 M3: the shell type e+0xcadc == 4 ? bits 18 / 19 : bits 21 / 22, each bit only while its claw is on ((10, 0x72)
  parts 5 / 6 raise P+0x3b4 0x4000 / 0x2000 when knocked off).

`jscheck019.py` (the real .dtp row arrays of all four, part levels, rank, sunk, shell type, the claw bits): **648000 runs, 0
mismatches**; control (js em020_00 for every class) 178524 mismatches.

Rustrazor's shell type and knocked-off claws are taken from the parts SHOWN (2026-10-18; were named stand-ins): his part pass
`0xdc5228` (variant 4, READ) draws the shell by e+0xcadc -- 5 -> set 11 (part 109, Gravios skull), 4 -> set 12 (part 110, Glavenus
skull), else set 13 -- and the claws by P+0x3b4: 0x4000 -> set 7 (part 2, the left stump), 0x2000 -> set 8 (part 4), else sets 1..6
(by e+0xcb14 and the shell type). So the Parts panel's Shell and Claw rows are the word's inputs (motion-states.js
`rustrazorInput`, index.html passes `shellType` / `claw5Off` / `claw6Off`); no new control. The stump also shows in sets 9 / 10
("Sharpened Broken"), which this pass does not draw (writer not read): taken as knocked off too (I). Check 61 / 0 (the new
assert); soak Rustrazor 81, 0 refused.

## 2. The plays -- R (tracer, both variants of each class the same)

EM019_ACTIONS: L2 M11 (7, 0x00 / 0xff), L2 M4 (7, 0x0d / 0xfb), L2 M2 (7, 0x0f / 0xee / 0xfa), L2 M6 (7, 0x0e / 0xe0 / 0xf9), L2
M8 (7, 0x10 / 0xdd / 0xe2 / 0xed / 0xf8). EM020_ACTIONS: L2 M11 (7, 0), L2 M4 (7, 0x0d / 0xdd), L2 M2 (7, 0x0f), L2 M6 (7, 0x0e /
0xdc), L2 M8 (7, 0x10).

## 3. Implemented

psl-mask.js `crab019` / `em019(v4)` / `em020(v4)` and CLIP_ACTIONS; SHELL_PARTS em019_04 claw5Broken (set 1) / shellBroken2 (set 3);
index.html passes them. Word asserts added to dev/checks/em019_00.mjs.
Check dev/checks/em019_00.mjs: **60 / 0**. Soaks: Daimyo **69, 0 refused**; Stonefist **80, 0**; Shogun **59, 0**; Rustrazor **81, 0**.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **Sets 9 / 10 on Rustrazor -- READ: never drawn.** His part pass (`0xdc5228`, variant 4) draws the claws only through P+0x3b5's
  knocked-off bits (sets 7 / 8) or the intact sets; sets 9 / 10 are Shogun's (variant 0) broken-claw sets, chosen by parts 5 / 6
  reaching their .dtp levels. So the Parts panel's "Sharpened Broken" item on Rustrazor is not a ROM state of his; reading it as
  knocked off (the word's claw5Off / claw6Off) is the viewer's choice, named.
