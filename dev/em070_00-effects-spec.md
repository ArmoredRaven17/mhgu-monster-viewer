# Nerscylla (em070_00) -- effects spec (Temnoceran walk, 2026-10-18)

Class `uEm070_00` (vtable `0x17e222c`). No states note existed: the reaction scripts, the per-part depletion and the part pass's
break sets were read here. The jaws (part 13, set 16) are dev/em070-part50-spec.md. Scratch: `<scratchpad>/zg/jscheckpd.py`.

## 1. The PSL enable word -- vt+0x13c = `0xfab634` -- R, read whole and emulated

`0xfab634..0xfab6b4`: `0xca170`, then on EVERY motion by the quest rank `0x3a8430`: >= 5 (G) -> bits 21-23, > 1 -> bits 18-20,
else bits 15-17; then L0 M8 / L0 M6 also bits 30-31 while byte e+0x1068 bit 3 (the area's floor flag word: `floorFlag8`, the
viewer carries no floor flags -- named stand-in, false).

The rank chooser returns only 0 / 1 / 3 / 5 (a first run at ranks 2 / 4 / 6 mismatched for that reason, not the word).
`jscheckpd.py 17e222c em070_00` at ranks 0 / 1 / 3 / 5: **1476480 runs, 0 mismatches** (9 words); with FLOOR: **1476480, 0** (18
words); control (js em068_00): 1353440 mismatches. The viewer's rank select drives `rank`.

## 2. The plays -- R

No action arm in the word. CLIP_VARIANTS L3 M37 (A the sleep hold / B the stun's held clip) and L3 M13 (A paralysis / B the shock
trap's hold).

## 3. The states -- R

- Breaks (.dtp A): part 1 (the BACK) at levels 2 and 3 -- sets 9 + 12 -> 10 + 12 (u 1006) -> 11 + 13 (u 1007); part 2 (the LEGS,
  level 2) 5 + 7 -> 6 + 8 (u 1011); part 4 (the CLAWS, level 2) 14 -> 15 (u 1021).
- Depletion clips: parts 1 / 3 -> L3 M28; parts 2 / 4 / 5 / 6 -> L3 M1 (also the shock trap's first clip, to f70: c 1105 every
  42); parts 0 / 7 -> L3 M3 -> M5 -> M7 (no row: nothing shows). No lid (no `0x71398` call).
- Exhaust (10, 0x1b) L3 M9, c 1109 once. Rage: g6 s0 ends (1, 7) -> L0 M5. Tired: (0, 2) L0 M14; TIRED_DROOL c 1104; RAGE_PUFF
  u 1120 / 1121 on joint 1.
- Sleep (10, 0x1d / 0x1e) L3 M14 -> L3 M37: c 1102 every 90, the puff paused. Stun (10, 0x20) L3 M26 -> L3 M37#B -> L3 M16, c 1103
  held. Paralysis L3 M13 c 1101 every 60; the trap's hold L3 M13#B. Death L3 M18 -> M38, L3 M21 -> M39.

## 4. Implemented

psl-mask.js `em070_00`; CLIP_VARIANTS; MOTION_STATES em070_00 (Object.assign beside the jaws rows); TRAP_B; TIRED_DROOL.
`--apply` / `--states` +18, recorded, lifted. New check dev/checks/em070_00.mjs.
Check dev/checks/em070_00.mjs: **34 / 0**. Soak: **87 motions, 0 refused**.

The floor flag stays NAMED (2026-10-18 decision): e+0x1068 is the area's floor flag word (the stage's soft ground -- Uragaan's
reaction reads the same bit), not a state of the monster; nothing on his model shows it, and the viewer has no area to hold it.

## Control block re-check (2026-10-19, trap 117's follow-up; rom-map "the control block [e+0xcac0] SET NON-ZERO")

* **Frame-handler requests the viewer does not drive.** vt+0x208 `0xf9c2a0..0xf9c3bc` uses a table on C+0xb5 to pick ids
  1001 / 1003 / 1004 / 1005. C+0xb5's writer is NOT READ.

## C+0xb5, the frame handler's held requests (effects lane, 2026-10-20) -- built

* The handler and the byte's writers are read: rom-map "Class requests driven". On a change of the byte:
  - the held handle is stopped, after a one-shot u 31 when leaving 1;
  - the new value picks the held record: u 30 (joint 1), u 32 (joint 144, and offset (0, 0, -80) on L4 M30 / M31), u 33 (joint
    144) or u 34 (joint 1).
  - Each goes through the class's own block: the joint's position at +0xc0, the root joint at +0x52.
* Driven per clip by the writers every action of that clip makes (CLASS_TIMERS em070_00, NERSCYLLA_B5). The byte persists across
  clips, as it does across actions.
* Recorded with the block (add_em070_00_u30_b5 .. _u34_b5, plus _u32_b5off) and lifted. Measured: u 30, u 31, u 32 (3 starts with
  L4 M30's re-request) and u 33 all draw.
* NOT driven, by name:
  - u 34 (value 8), which needs the object the (1, 0x16..) actions hold;
  - the clears that depend on the action: L2 M59 f30, and L2 M55's end.
