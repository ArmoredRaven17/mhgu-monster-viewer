# Lao-Shan Lung (em012_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm012_00`. No states note existed. Scratch: `<archive>/zg/w012tab.py`, `states060.py`, `partscr.py`, `scrdump.py`,
`ppemu.py`.

## 1. The PSL enable word -- vt+0x13c = `0xd77ac8` -- R, read whole and emulated

`0xd77ac8..0xd77c14`: `0xca170`, then bits 15-26 ON EVERY MOTION, unconditionally. The rest walks the two (13, motion) lists at
`[e+0x13f4 + 0xb6ec]` = **e+0xcae0** (the survey's "e+0xb6ec" was the offset read without the pointer the post-indexed load left
at e+0x13f4 -- CLAUDE.md's trap) and calls `0x7db70` (a hit record) / `0xb07b4` (the motion rate) per matching entry. Run with the
lists populated (`w012tab.py`), both calls are reached (control: no call when the motion does not match) and e+0x13f4 is unchanged.
Emulation: **369120 runs, 0 mismatches**; control (js em011_00) all mismatched.

## 2. The plays

No action arm: no CLIP_ACTIONS beyond L0 M30's copy (B the death's first clip).

## 3. The states -- R

- Status 10 (tracer + partscr): one reaction, (10, 7): parts 0 / 1 / 4..7 -> `0x17a5540` (L3 M1), parts 2 / 3 -> `0x17a5670` (op 5
  (28), L3 M1 -> L3 M4 -> wait 900 -> L3 M5 -> L3 M6). Every other number falls to the default: no ailment clip, and em012_00c
  holds no c 1101..1105 / 1109. Death (11, 0) `0x17a55d0`: op 5 (450), L0 M30 -> L3 M10.
- The part pass vt+0x210 `0xd7709c`, READ whole and reproduced by `ppemu.py` (the control for that tool): part 0 rows 0 / 1 -> sets
  1 + 3 / 2 + 3 / 2 + 4 (horn, then face); part 1 rows 2 / 3 -> 9 + 11 / 10 + 11 / 10 + 12 (back cracked, broken); part 5 -> 5 / 6;
  part 6 -> 7 / 8. Records u 1000 / 1001 / 1005 / 1006 / 1025 / 1030 (the shared rule, part x 5 + level + 6).
- No eye applier, no tired case, no EMC group 6 (rage rises with no roar). RAGE_PUFF (existing) runs.

## 4. Implemented / results

psl-mask.js `em012_00`; MOTION_STATES.em012_00 (L3 M1 cycle of four, L0 M30#B / L3 M10 death); `--apply` +4 (the four break
records), recorded (12 sets).
Check dev/checks/elders.mjs (Lao-Shan) pass. Soak **40 motions, 0 refused**.
