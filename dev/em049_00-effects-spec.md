# Agnaktor (em049_00) -- effects spec (Leviathans walk, 2026-10-17)

Class `uEm049_00` (vtable `0x17c5eb4`). **No states note existed** (the survey's largest gap): everything in 2-4 was read here.
His heat machine is dev/em049-heat.md (render/monster.js ROM_HEAT_REGIONS). Scratch: `<scratchpad>/zg/jscheckpd.py`
(MOGURI=-1000 SEV=1), `states060.py`, `partscr.py`, `turns.py`, `allmot2.py`; akantor-scratch `scr.py`.

## 1. The PSL enable word -- vt+0x13c = `0xec3114` -- R, read whole and emulated

`0xec3114..0xec3210`: `0xca170`; s = vt+0x370(e, 1) (`0xa3bf4`, the tail severed). L0 M7..M10: `0x81d6c` (sunk; his
MoguriBaseOfs -1000) ? bits 18-20 : 15-17, then bit 17 cleared if s, set if not (`bfc` / `orreq`); L0 M6 and L2 M6: sunk ? 18-20 :
15-17; L2 M2: bit 17 unless s; L2 M10: bits 17-18 unless s. Check: **1447424 runs, 0 mismatches**; control 197376 / 263168.

## 2. Plays -- R (tracer)

Turn table `0x169eb9c` {L0 M6; L0 M7 / M8}: on the surface (2, 1 / 0xf), (13, 6), (3, 2); burrowed (6, 5 / 9 / 0xa), (13, 3)
after `0xbc7f4(4)` + `0xbf62c` -> `0xbf700` (P+0x5c = -1000: sunk) -- copy B. L2 M6: (7, 6 / 7 / 8 / 0x22 / 0x2b / 0x2c), (3, 1 /
3 / 5 / 6) and burrowed (6, 3 / 4 / 6 / 8 / 0xf), (13, 4) (posture 4, the dive's depth: sunk I) -- copy B. L0 M9 / M10 posture 0.

## 3. The states -- R

* Status 10 `0xebf3c0` (jump table on number - 7); depletion (10, 7) by `0x9e8d8` (the part): parts 0 / 6 -> L3 M2 (`0x17c6970`),
  1 / 7 -> L3 M1 (`0x17c6980`), 2 / 3 -> L3 M3 -> (240 f) M4 -> M5 (`0x17c6d70`), 4 / 5 -> L3 M6 -> M7 -> M8 (`0x17c6df0`). Stun
  (10, 0x20) by `0x9e8c0` (side): 1 -> L3 M3 -> M4 (held) -> M5 (`0x17c6d10`), 2 -> L3 M6 -> M7 (held) -> M8 (`0x17c6da8`).
  Exhaust (10, 0x1b) L3 M2; sleep (10, 0x1d) L3 M10 (held) -> (10, 0x1e) L0 M16; paralysis (10, 0x1f) L3 M9; shock trap (10,
  0x6e) L3 M2 (to f80) -> L3 M9 (`0x17c6d40`); (10, 0x72) L3 M13; recovery (10, 0x2a / 0x2b / 0x70) L3 M11; pitfall (10, 0x60
  / 0x61 / 0x62) L3 M15 / M16 / M17; (10, 0xa) L3 M21 -> (10, 0x7b). Death (11, 0) L3 M12, (11, 7 / 0x12) L3 M18, (11, 3) L3 M21 ->
  M18; capture (11, 0x10) L3 M10 -> L0 M16.
* Breaks: .dtp A rows (part: low-rank / G threshold) 0: 2 / 2, 1: 2 / 3, 2..6: 1 / 1, 7: 1 / 2; the part pass `0xec1cec`'s heated
  groups (em049-heat.md 1): head 3 / 4, chest 7 / 8, legs 11 / 12, 9 / 10, 15 / 16, 13 / 14, back 5 / 6, tail 17 / 18 / 19. Records
  by the shared rule (id = part x 5 + level + 6): u 1001, 1006, 1010, 1015, 1020, 1025, 1030, 1035 at the low-rank thresholds.
  WIRED AT G (the viewer's rank, SHELL_QUEST_RANK = 5; Gravios's / Great Maccao's pattern, 2026-10-18): the chest breaks at
  level 3 and the tail at level 2; their G keys u 1007 / u 1036 are not in em049_00u's UNIQUE, so those breaks show their set and
  fire nothing, while u 1006 (chest level 2) and u 1035 (tail level 1) fire at the levels that name them. Low-rank rows in the
  block's comment.
* The sever: vt+0x204 `0xeb4ffc`: (10, 0x72) with part 7 -> `0xc2274(e, 0, 0, 0x91)` -> u 900, drop joint 145 (CUT_TAIL).
* Eyes `0x71398(e, 1, 2, -1)` (`0xeb4adc`): open 1, shut 2. Rage EMC g6 s0 `14 14 | 00 01 00` -> (1, 0) L0 M3. Tired (0, 2) L0
  M19 (also (1, 7)). Puff: the base stub (rom-map) -> u 1121, joint 2. Drool c 1104.

## 4. Implemented

psl-mask.js `em049_00` + CLIP_ACTIONS; MOTION_STATES em049_00 (the first), TRAP_B, CLIP_VARIANTS, RAGE_PUFF, TIRED_DROOL,
_autoOnRage, CUT_TAIL. `--apply` +12 (the seven breaks, c 2 / 3 / 90 / 92 / 93); recorded, lifted. New check dev/checks/em049_00.mjs.

The tail piece file: READ -- descriptor [0x172ba68][40] word 1 0x7c51 = jamcrc(enemy\em049\em049_00\mod\em049_00_tail).
