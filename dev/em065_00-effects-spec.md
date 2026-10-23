# Kecha Wacha (em065_00) -- effects spec (Fanged Beasts walk, effects agent, 2026-10-17)

Class `uEm065_00`. From dev/fanged-beasts-effects-survey.md row 11: the word is the BASE (`0xca170`, BASE_ONLY + --apply done
2026-10-15); the gap was the states -- no states note exists. Read here (tracer, scr.py, static):

* Reaction scripts: (10, 0x1b) exhaust **L3 M2**; (10, 0x1d) sleep L0 M16 (held, `0xfd`), (10, 0x1e) L0 M14 (wait 0x100);
  (10, 0x1f) paralysis L3 M6 (0x100), (10, 0x6e) the trap **L3 M6** (0x200); (10, 0x20) stun L3 M10 -> L3 M4 (held) -> L3 M5;
  (10, 0x2a / 0x2b) L3 M3; (11, 0) L3 M9, (11, 7 / 0x12) L3 M15; capture L0 M16 -> L0 M14; (10, 7) part 0 / 6 L3 M1, parts 1..5
  L3 M2; (10, 0x14) L3 M11 -> M17 -> M18 (parts 2 / 4 at an even level: vt+0x23c `0xf4a8ec`, posture 0).
* Part pass vt+0x210 `0xf49e70` (R): head part 0 vs .dtp A row 0 (2 / 2) -> set 3 / 12; part 2 vs row 1 (1) -> 4 / 13 and 5 / 14;
  part 5 vs row 2 (1) -> 6 / 15; enraged head 0x10 / 0x12, calm 0x11. Records: id part x 5 + level + 6 -> head level 2 u 1001
  (exported); part 2 level 1 u 1010, part 5 level 1 u 1025 -- no keys.
* Eyes `0x71398(e, 1, 7, 0xb)` at `0xf48fe0`: open 1, shut 7. Rage g6 s0: posture 0 -> (1, 8) L0 M19; posture 6 -> (3, 0x50) /
  (3, 0x39). Tired: tune+0x30 present (5400); idle (0, 2) L0 M38, shared with (1, 7 / 0xb) -> TIRED_DROOL. Puff: the base
  stub, joint 4.

Implemented: MOTION_STATES em065_00 (L3 M1 head break u 1001, L3 M2 part 2 / 5 breaks + exhaust c 1109, rage L0 M19, sleep on
L0 M16 / M14 copy B, paralysis L3 M6 + trap copy B, stun c 1103 holds, deaths shut eyes), CLIP_VARIANTS, TRAP_B, RAGE_PUFF,
TIRED_DROOL, _autoOnRage. Nothing new to export. New check dev/checks/em065_00.mjs 24 / 0; soak 74 / 0.

## The ground (effects lane, 2026-10-20)

* c 210 / 220 / 230 / 240 (`cm200_067`) are floor-only records, like Tigrex's c 25: their rows need the flag-8 floor (MASK2 0x21).
  With the Ground control (index.html GROUND_TYPES; dev/effect-runtime-engine.md E17) they were metered on L5 M39, L3 M56,
  L2 M57 and L2 M60 under every ground.
  - On Ground B they DRAW. Lit samples: c 210 36 / 36, c 220 12 / 12, c 230 95 / 96, c 240 50 / 51. They are small: 418..2868 px
    at the survey camera.
  - On plain, A, C, D, E and F they are live with no draw.
