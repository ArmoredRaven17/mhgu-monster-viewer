# Ahtal-Neset (em087_00) -- effects spec (walk, 2026-10-18)

Class `uEm087_00`. His word was read and transcribed before (base | bits 15-23 always: psl-mask.js em087_00). The survey's soak
(2026-10-15) refused 37 of 77 motions (calls to `0xaaeb90` / `0xa996b0` not translated, `0x44158` -> `0x441cc` unrecorded): the
cure was recording his sets and lifting. Scratch: `<scratchpad>/zg/ppemu.py`, `states060.py`, `partscr.py`, `scrdump.py`.

## 3. The states -- R

- Status 10 (tracer, partscr): (10, 7) parts 0 / 1 / 2 / 5 / 6 / 7 -> `0x18041f0` (L3 M1), 3 -> `0x1804220` (L3 M6 -> wait 1500 -> L3
  M7 -> L3 M8), 4 -> `0x1804278` (L3 M9 -> wait 1500 -> L3 M10 -> L3 M11); (10, 0x14) every part -> `0x18042d0` (L3 M3 -> wait 1440
  -> L3 M4 -> L3 M5). Sleep, paralysis, the stun and (10, 0x72) have no reaction: the handler sets (1, 0) (`0x10adab4`). No status-11
  case (tracer), no EMC group 6.
- The part pass vt+0x210 `0x10a7ed0`, RUN (`ppemu.py`): part 3 set 13 -> 14 (u 1015), part 4 11 -> 12 (u 1020); part 2's .dtp row is at
  level 5 (u 1014 at its fifth depletion, nothing drawn).

## 4. Implemented / results

MOTION_STATES.em087_00 (L3 M1 cycle with the level-5 arm, L3 M6 / L3 M9 breaks); exported, recorded.
Check dev/checks/elders.mjs pass. Soak **81 motions, 0 refused** (the survey's 37 refusals are gone).
