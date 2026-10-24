# Najarala (em068_00) -- effects spec (Snake Wyvern walk, 2026-10-18)

Class `uEm068_00` (vtable `0x17df180`). No states note existed: the status-10 scripts, the part pass and the eyes were read here.
Scratch: `<archive>/zg/jscheck068.py`, `tracec.py` (CLS=uEm068_00 EM=68), `pp068.asm` (the part pass).

## 1. The PSL enable word -- vt+0x13c = `0xf88044` -- R, read whole and emulated

`0xf88044..0xf880dc`: `0xca170`, then
- L2 M61 (0x23d): `0x9d36c(e, 2)` (part 2's break level) >= .dtp row 1's level (byte +5, or +6 when `0x3a8430` > 4; 1 at both)
  ? bits 18-20 : bits 15-17 -- input `part2Broken` (SHELL_PARTS: set 5 shown).
- L0 M44 (0x2c): `0x81d6c` (sunk) ? bit 18 : bits 15-17.

`jscheck068.py` (the real .dtp row array, part level 0..3, rank chain, sunk): **14400 runs, 0 mismatches**; control (js em067_00)
5760 mismatches.

## 2. The plays -- R (tracer, with the setMotion variant 0xb0230 hooked)

L0 M44: A the surface plays (2, 1 / 3 / 4) phase 2; B the burrowed plays (6, 3 / 7 / 9), (13, 1), after `0xbf62c` -> `0xbf700`
(P+0x5c = MoguriBaseOfs -3000: sunk). L2 M61: (7, 0x18 / 0x1a), the word by the part-2 break alone. CLIP_VARIANTS L0 M44 and
L3 M37 (A paralysis / B the shock trap's hold, TRAP_B).

## 3. The states -- R

- The part pass vt+0x210 `0xf86984` (pp068.asm): sets by `0x72c78` -- base 0 / dead 15; part 0 at .dtp row 0's level 2 -> 8 else 2;
  part 2 (row 1, level 1) -> 9 else 3 (dead 14 / 13); part 3 (row 2) -> 10 and P+0x3b4 |= 1 (the tail breaks, no sever call) else
  4; part 7 (row 3) -> 11 else 5; part 6 (row 4) -> 12 else 6 (dead 16 / 4).
- Status 10 (`0xa1290` per depleted part `0x9e8d8` and hit side `0x9e8c0`): L3 M10 head (u 1001 at level 2) + the shock trap's
  first clip (c 1105 every 42); L3 M2 parts 2 / 3 (u 1010 / u 1015) + exhaust c 1109; L3 M55 -> M57 -> M56 parts 6 / 7 (u 1030 /
  1035) and the stun's c 1103 held; L3 M37 paralysis c 1101 every 60.
- Rage: EMC g6 s0 ends (1, 0) L0 M50. Tired: (0, 2) -> `0xb0230(e, 0x26)` L0 M38; TIRED_DROOL c 1104; RAGE_PUFF u 1120 / 1121 on
  joint 12.
- Sleep: (10, 0x1d) L3 M28 -> L0 M51, (10, 0x1e) L0 M56: eyes shut (`0x71398(e, 1, 7, ..)` at 0xf79930: set 7), c 1102 every
  90, the puff paused. Death: L3 M19, L3 M85 (eyes shut).
- u 1400 (sites 0xf7fdbc / 0xf85228, base u table level 2): only the burrowed L0 M44 plays (tracer `U1400 r1=2`) -- copy B. It
  was on every L0 M44 play before; corrected.

## 4. Implemented

psl-mask.js `em068_00` + CLIP_ACTIONS; CLIP_VARIANTS; MOTION_STATES em068_00 rewritten; TRAP_B; SHELL_PARTS part2Broken; index.html
passes `part2Broken`. `--apply` / `--states` +4, recorded (166 sets), lifted. New check dev/checks/em068_00.mjs.
Check dev/checks/em068_00.mjs: **25 / 0**. Soak: **133 motions, 0 refused** (the 6 refused at 0xcad554 before the recording are gone).

## 5. The tracer re-sweep (2026-10-18, the coordinator's follow-up)

The tracer had hooked five setMotion wrappers. A BL scan of every caller of `0xafce8` in the motion band (control: `0xafe84`'s
5902 class sites) gives the whole family: `0xafe84`, `0xafe8c`, `0xafef0`, `0xb00b4`, `0xb0174`, `0xb0230`, `0xb03f8`, `0xb04d0` (main
motion in r1) and `0xb032c` / `0xb0004` (vt+0x3d8 + `0x53949c` only: a partner layer). `tracec.py` now hooks all of them and tags
each motion with the wrapper (`via`); `OLD=1` restores the old five. `sweepmot.py` (every status x number x phase 0..3 x ended
0 / 1, follows 1) and `sweepev.py` (U1400 / SCRIPT / TURN events) were run old and new over every class walked with the tracer
(35 class / variant runs: em057_00 / 04, em021, em022, em023_00 / 05, em030, em060_00 / 04, em062, em061_00 / 04, em065, em083_00
/ 04, em010, em017, em036, em046, em047, em049, em056, em082_00 / 04, em066_00 / 04, em067, em068, em070, em019_00 / 04, em020_00 /
04, em069, em076). Output: `<archive>/zg/sweep/`.

Motion diff lines: **0** for every class except em047_00 **6** ((7, 0x19..0x1b): the partner layer of `0xb0004`, L2 M16 / M5 /
M4 -- no word arm, row or CLIP_ACTIONS entry on them), em068_00 **18** (0xb0230 / 0xb00b4 / 0xb0174: L0 M11 / M38 / M16 / M21, L2
M10 / M24 / M42 / M44 / M47 / M64 / M70 -- his word arms are L2 M61 / L0 M44, neither among them; the L0 M38 tired row was already
read by hand), em069_00 **18** (0xb03f8: 7:0x1a..0x2a L4 M83 / M86 / M93 / M95 -- the duo spec's 6, already recorded by the duo
tracer; 7:0x49 phase 1 L4 M165 -- unreached at variant 0, duo spec 7.1), em070_00 **2** ((7, 4) / (7, 0x22) L2 M41 -- not a jaw
motion, no row), em076_00 **8** ((3, 0x0a / 0x0b / 0x1f / 0x24 / 0x29 / 0x2a), (12, 1) L1 M8 / M9 via 0xb04d0 -- his word is the
base, no row on list 1). U1400 / script / turn diff lines: **0** everywhere, so no "only the dive requests it" conclusion moves.
Nothing built from the old traces changed.
