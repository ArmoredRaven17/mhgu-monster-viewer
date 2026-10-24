# Alatreon (em050_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm050_00`. States: states-em050_00.md (transcribed before; every exported record was driven). Scratch:
`<archive>/zg/w050.asm`, `w050b.asm`, `sweepmot.py`.

## 1. The PSL enable word -- vt+0x13c = `0xece27c` -- R, read whole and emulated

The survey left its extent open (two jump tables past the first return). Resolved: `0xece27c..0xece650`, three tables (`0xece2c4`
on motion - 0x205, `0xece390` and `0xece528` on the number). Status 4: L1 M10 / M11 with 0xf / 9, L2 M23 / M25 with 0xb -> bits
15-17. Status 7: L2 M5 with 0x18 -> bits 27-29 if severed (P+0x3b4 bit 0, read through the pointer the post-indexed load left at
e+0x13f4: `[+0x34]` = e+0x1428), else 15-17; L2 M6 0x35..0x3f -> 24-26, 0x21 / 2 -> 15-17; L2 M7 0xf / 0x19 / 0x1f / 0x20 -> 21-23,
0x35..0x3f -> 24-26; L2 M8 0xd / 0x40 -> 24-26, 0xe / 0x25 -> 21-23; L2 M16 / M17 with 3 / 4 / 7 / 8 / 0x1b -> 15-17; L1 M2 / M3 with
0x26 / 0x1d -> 21-23; L0 M9 / M10 with 0 / 0x22 / 0x27 / 0x28 / 0x2b / 0x2c / 0x2f / 0x30 -> 15-17. Emulation (x the sever bits):
**262656 runs, 0 mismatches**; control 2208.

## 2. The plays -- R (tracer)

Each arm's clip split A (the plays the arm lights) / B (the others): L1 M10 / M11, L2 M23 / M25, L2 M5..M8, L2 M16 / M17, L1 M2 /
M3, L0 M9 / M10 (psl-mask.js CLIP_ACTIONS.em050_00, CLIP_VARIANTS). `--apply` brought in u 200 / 231 / 240 / 450 / 451 / 550.

## 3. Implemented / results

psl-mask.js `em050_00` + CLIP_ACTIONS; CLIP_VARIANTS; `--apply` +6, recorded (54 sets). Class-table keys 11 / 12 / 37..40 / 530 /
531 (survey) are his class code's (frame handler `0xecce08`, site `0xecce84`): not read here -- named.
Check dev/checks/em050_00.mjs **37 / 0** (its stale "2 ragePuff" count replaced by named records -- it had failed at HEAD) and elders.mjs pass. Soak **71 motions, 0 refused**.

## 5. The class keys (2026-10-18)

- **His only class request is `0xecce84`,** in vt+0x208 0xecce08. While enraged, every 30 frames (e+0xcb04), id 1001 =
  u 1120, or id 1002 = u 1121 while P+0x1bb == 2 (the blue form). The handler has no dying gate.
- **Ids 1003..1011 have no requester.** Their keys in [0x169ee10] are 531 / 530 / 531 / 12 / 38 / 40 / 11 / 37 / 39.
  - The scan: every vt+0x1d0 call in .text with an immediate id (zg/scan1d0.py). None of those ids is requested from his
    band 0xec480c..0xed0a38 [derived 2026-10-24: `0xec4890..0xed0834`; rom-map "Alatreon band (derived)"].
  - The shared computed-id sites give ids < 1000: 0x70444 (5 / 6), 0x9d534 (5 x part + 7), 0xca3c0 (byte + 0x2f),
    0xa4938 / 0xa49fc (2).
  - Positive control: the same scan finds Amatsu's 0xf09420 / 0xf09554 / 0xf09574 and his own 0xecce84.
  - The two other `#0x1d0` loads in his band (0xecab68, 0xecb29c) read P+0x1d0, a position.
- **Not re-wired:** RAGE_PUFF.em050_00 already drives this request as his own puff (period 30, pick () => 1, the red record; dev/checks/em050_00.mjs). A CLASS_TIMERS twin was tried and taken back out (it double-drove the puff, and the check failed). Two differences from the ROM are left for the coordinator:
  - The blue record IS reachable: the handler keys it on P+0x1bb == 2, the Form rung's second. The puff entry's pick cannot see the rung.
  - The handler has no sleep gate, while the check asserts the puff pauses in the sleep hold, which is the shared puff's gate.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* The section-3 line "class-table keys 11 / 12 / 37..40 / 530 / 531 ... not read here -- named" is superseded by section 5
  (2026-10-18): his only class request is `0xecce84` (u 1120 / u 1121); ids 1003..1011 have no requester (scan with controls).
