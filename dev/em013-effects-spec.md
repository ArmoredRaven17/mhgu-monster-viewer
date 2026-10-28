# Fatalis / Crimson / Old Fatalis (em013_00 / em013_01 / em013_02) -- effects spec (Elder Dragon walk, 2026-10-18)

One class `uEm013_00` (variant byte e+0xb5f5: 0 / 1 / 2). No states note existed. Scratch: `<archive>/zg/jscheckpd.py` (VAR),
`sweepmot.py`, `states060.py`, `partscr.py`, `scrdump.py`, `pp013.asm`, `pp013b.asm`.

## 1. The PSL enable word -- vt+0x13c = `0xd8aecc` -- R, read whole and emulated

`0xd8aecc..0xd8afc4`: `0xca170`; L2 M5 / M6 under status 7: (7, 0x3b / 0x3c) bits 15-17 on variant 1 alone, (7, 0 / 0x13) bits
18-20 on variant 2 alone; L0 M5 under (13, 0), (7, 0x15) or (1, 3 / 10 / 12) (mask 0x281 on number - 3) bits 21-23, every variant.
Emulation per variant: **369120 runs, 0 mismatches** x3; controls (js of another variant) 320 / 640.

## 2. The plays -- R (tracer, all variants the same)

L2 M5 A (7, 0x3b) / B (7, 0); L2 M6 A (7, 0x3c) / B (7, 0x13); L0 M5 A the rage roar (1, 3) (g6 s0's action), B (1, 0xa / 0xc), (7,
0x15), (13, 0), C (3, 0xe) phase 3 (base).

## 3. The states -- R

- Status 10 (jump table, default `0xd89e74` -> 0x76088): (10, 7) by part: 0 / 1 / 7 -> L3 M1, 2 -> L3 M23, 3 -> L3 M24, 4 / 5 -> L3 M9,
  6 -> L3 M22; (10, 0x72) parts 0 / 5 -> L3 M3 -> wait 300 -> L3 M4 -> L3 M5 (no 0xc2274 in the class: no sever); sleep (10, 0x1d)
  L3 M13, (10, 0x1e) L3 M13 held, (10, 0x44) L3 M15 -> L0 M32 -> L0 M5; paralysis (10, 0x1f) L3 M13 -> L3 M25 held.
- **The stun (10, 0x20), the shock trap, the exhaust and (10, 0x2b) have no case** (the tracer over four hit sides: default). c 1103
  is the shared per-frame stun / flash record (`0xa3ef0`): no clip shows it and the viewer holds no stun / flash state -- named.
- Death: every (11, n) -> L3 M17, eyes shut. The eyes: `0x71398(e, 2, 1, -1)` at `0xd7d958` (open 2, shut 1).
- The part pass vt+0x210 `0xd8a780` (READ to `0xd8ae40`): part 0 (row 0, level 1) -> set 7 / 8 (the chest, u 1000); part 5 (rows 1..3)
  -> 3 / 4 / 5 / 6 (the head: horn cracked, broken, face broken; u 1025 / 1026 / 1027); part 7 (row 4, level 2) only re-flags hit
  records (u 1036 fires, nothing drawn); the variant arms re-flag hit records too.
- Rage: g6 s0 -> (1, 3) L0 M5 then (1, 4) L0 M16. No tired case.
- **The puff pick** vt+0x2a4 `0xd7e800` (READ whole): Rathian's derivation, then 1 (u 1120) iff the 16-bit angle is in [0xe39,
  0x8000) -- joint 4's axis 20 degrees or more above the plane; P+0x5d04 = 4 (`0xd7d980`). motion-states.js `fatalisPuffPick`;
  RAGE_PUFF em013_00 / 01 / 02 (joint 4); all three put on `_autoOnRage`.

## 4. Implemented / results

psl-mask.js `em013(v)` + CLIP_ACTIONS; CLIP_VARIANTS; MOTION_STATES (L3 M1 / M9 breaks, L3 M13 copies A sleep fall / B sleep hold
/ C paralysis, L3 M25, L0 M5 rage, L3 M17 death); RAGE_PUFF + pick; effect-mounts `_autoOnRage`. `--apply` +4 each, recorded (12
sets each).
Check dev/checks/elders.mjs (all three) pass. Soaks **96 / 96 / 103 motions, 0 refused**.

## 5. The stun (2026-10-18)

- **The Fatalis line has no stun hold. That is the ROM.** (10, 0x20) has no case in his status-10 table. The default
  0xd89e74 goes to `0x76088`, a tail call of vt+0x3dc (the next action), so no clip plays and nothing is held. This is the
  same for all three variants and every side (the tracer, four sides).
- **c 1103 is not a clip's.** It is `0xa3ef0`'s, the shared per-frame request, held while any of these is set:
  - P+0x5e08 bit 4 (0xa1f0c(e, 0x10));
  - P+0x5cde == 1 (0x81f48);
  - P+0x59c > 0.
  Which of those his ailments ever set is NOT READ. If any is, the stars show over whatever he plays, and the viewer has
  no state for that: named.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **c 1103 -- the stun bit READ**: P+0x5e08 bit 4 is set at the start of a stun-family action ((10, 0x20) / 0x24 / 0x29 / ...) and
  cleared by the first change to a non-stun action. His (10, 0x20) has no case and falls to vt+0x3dc in its own update, before the
  c 1103 request (vt+0x28) asks: no stars. The two other conditions (P+0x5cde == 1, P+0x59c > 0): NR. The named refusal is now
  the ROM's answer for the stun.
* **c 1103's other two conditions -- READ**: P+0x5cde is set only by small-monster classes (never on him); P+0x59c is a float
  timer from the ailment data's +0x58 entry (I: a flash's blindness -- a hunter's item, category a). With the stun bit read, c
  1103 on the Fatalis line is a named refusal on ROM reasons only.
* **The flash -- READ (Flashed state, 2026-10-25; dev/flashed-state.md)**: P+0x59c is the flash's blindness, set only by the sense
  scan's flash test (`0xc3bb0`). **The Fatalis line cannot be flashed**: all three variants' dtbase +0x6c = 0x400402, bit 2 clear, so
  the test refuses at `0x99c58(e, 4)` (`<archive>\flashed\flashemu.py`; control: the same run blinds Rathian, and Fatalis with the bit
  forced on). So none of `0xa3ef0`'s arms is reachable on him and c 1103 stays a ROM reason; the viewer offers no Flashed switch on
  the Fatalis line. The record draws when held by force (flashmeter.mjs, FORCED).

* **Draw meter (2026-10-19):** u 202 draws nothing in the game either: its MASK1 0x4 selects no row of em013_00_003, whose rows carry 0x1 / 0x2. Every other record draws.
