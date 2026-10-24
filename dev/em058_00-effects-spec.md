# Amatsu (em058_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm058_00`; his word is the BASE `0xca170` (`BASE_ONLY`). No states note existed. Scratch: `<archive>/zg/c058.asm`,
`pp058.asm`, `hook204b.py`, `states060.py`, `partscr.py`, `scrdump.py`.

## 3. The states -- R

- Status 10: (10, 7) part 0 -> L3 M20, 1..7 -> L3 M1; (10, 0x14) part 0 -> L3 M20, 1..7 -> L3 M2; sleep (10, 0x1d) L3 M4 -> L3 M5
  held, (10, 0x1e) L3 M5 held, wake L3 M7 -> L3 M8; paralysis L3 M3 held; the stun (every side) L3 M4 -> L3 M5 held; recoveries L3
  M7 -> L3 M8; no shock-trap / exhaust case; death L3 M13.
- (10, 0x72) -> `0x17cca80`, an EMPTY script, and vt+0x204 `0xf08e7c` calls `0xc2274(e, 0, 0, 0x8e)` on it (emulated): the tail is
  severed at joint 142 over whatever motion runs. **No clip carries the drop: named** (no CUT_TAIL row added).
- The part pass vt+0x210 `0xf09d0c` (READ to its set calls): part 0 vs rows 0 / 1 (levels 2 / 4) -> 1 / 8 / 9 (with e+0x15fb == 1:
  15 / 16 / 17) (head: intact, cracked, broken; u 1001 / 1003); part 1 (row 3) 4 / 6 (left arm, u 1005); part 2 (row 2) 5 / 7 (right
  arm, u 1010); the tail bit 13 / 12; part 7 (row 4) 11 / 10 (back, u 1035). What e+0x15fb is: not read (the alternate head sets).
- Rage: g6 s0 = (1, 0) L1 M9.

## 4. Named, open

**His own puff and class machine**: vt+0x1d8 `0xf06dbc` writes e+0xb7d2 = 0 (`0xf07178`) -- the shared puff is off -- and his
table holds 0..3 / 100..102 / 1120 / 1121 / 1600 / 1601. The frame handler `0xf09308`'s eight request sites (`0xf092bc`, `0xf092d4`,
`0xf09420`, `0xf094e8`, `0xf09554`, `0xf09574`, `0xf09b5c`, `0xf09bcc`; ids 1001 / 1002 / 1003 / 1004 / 1005 / 1009) are not read
here, and none of them names 1007 / 1008 (1120 / 1121) directly.

## 5. Implemented / results

CLIP_ACTIONS / CLIP_VARIANTS (L3 M4 / M5 / L1 M9 copies); MOTION_STATES.em058_00; `--apply` +4, recorded.
Check dev/checks/elders.mjs pass (he and Valstrax put on `_autoOnRage`: their rage rows gate the rage state). Soak **38 motions, 0 refused**.

## 5. The class requests (closing the open reads, 2026-10-18)

- **Key table [0x169f370]:** 1001 -> 0, 1002 -> 1, 1003 -> 3, 1004 -> 2, 1005 -> 1120, 1006 -> 1121, 1007 -> 100,
  1008 -> 101, 1009 -> 102.
- **The frame handler vt+0x208 `0xf09308`:**
  - **The aura e+0xcb70 (0xf099cc):** u 0 calm, u 1 enraged, shown unless the status is 7 and the action is not (7, 0xc).
    On those it is hidden: u 3 fires once and the alpha goes to 0. The viewer drops the hold; the fade back in (+0x180) is
    not shown.
  - **e+0xcb78** holds u 100 (u 101 when e+0x15fb == 1).
  - **Enraged,** every 30 frames (countdown e+0xcb80): u 1120 (u 1121 when e+0x15fb == 1). This is his puff; he has no
    shared one.
  - **Dying:** both handles are stopped, and once (e+0xcb7c) u 2 and u 102 fire.
- **(10, 0x6c / 0x6d), 0xf09240:** c 1600 / c 1601 (c table [0x169f364]). Both are type 20 and not built: named.
- **Wired:** CLASS_TIMERS.em058_00. u 1120 / u 1121 retagged to event; u 0 / 1 / 2 / 3 / 100 / 101 / 102 exported and
  recorded. u 1120_stop's recording hangs on the harness's delete timing (section 7).

## 6. e+0x15fb (the alternate head sets)

- **One writer:** `0xf091ac` sets it to 1, on vt+0x204 for the action (10, 0x8e), an empty script. Nothing clears it.
- **Where (10, 0x8e) comes from:** it is reaction code 0x1a (the dispatcher 0x9a76c, table 0x9a81c, case 26). 0x97d20
  picks code 0x1a at `0x99280` when P+0x380 >= P+0x370 / P+0x374 and P+0x3a8 bit 16 is set, with bit 15 clear or posture
  3. So it is a one-way HP-fraction state.
- **What it shows:**
  - The part pass 0xf09d0c draws head sets 15 / 16 / 17 in place of 1 / 8 / 9. These are the same parts plus groups 25 /
    27 / 28 (monsters.json groups).
  - u 1121 for the puff and u 101 for the hold.
  - Other readers: 0xf07ce4 (an action), vt+0x1fc 0xf08e28, vt+0x214 0xf0a478, vt+0x23c 0xf0a650.
- **Not a Parts row:** it is a class state, and no break reaches it. It is wired as CLASS_CONTROLS.em058_00 (HP State:
  Before / Past the threshold), read by the timers and by STATE_OVERLAY.em058_00. STATE_OVERLAY gained an `on` test, and
  showParts takes the control.

## 7. The tail sever and a recorder hang

- **The sever, (10, 0x72):** the script is empty (0x17cca80) and setMotion is never called, so 0xc2274(e, 0, 0, 0x8e)
  cuts the tail from joint 142 at the action's frame 0, over the motion already running. The game shows the tail leaving
  in the middle of whatever he is doing. No clip frame exists to bind the drop to.
  - The viewer's cut tail flies only on a `drops` row's clip, from its start.
  - The natural stand-in is to fly the tail when the Tail row is switched to Severed. That is Raven's call: not built.
- **u 1120_stop (and Kirin's u 60_stop) hang at 0x7abfb8.** The cause:
  - The harness destroys a state-3 unit at the end of the frame it ended in (proofunit.unit_frame, the last loop).
  - The game's update walker 0xc044c4 only turns it 3 -> 4 (0xc045c0) on the next pass, and destroys it (vt+4,
    0xc045e0) on the pass after.
  - So the recorded stop (0x329c40 -> 0x329904, vt+0x128) walks onto a corpse whose vtable is cUnit 0x17828bc. +0x128 is
    0, so blx 0 runs the static initialisers, whose DTI self-link makes the walk endless.
  - dtorwatch.py shows it: DTOR 0x506e5e80 after unit frame 60, then WATCH-EXEC at 0 with r0 0x506e5e80.
  - The fix is the walker's 3 -> 4 -> delete order in proofunit.py. NOT APPLIED: it is the shared harness, for the
    coordinator's go-ahead.

## 8. The tail sever, re-read with controls (Raven, 2026-10-18: "monsters normally react to their tail being cut off")

**Section 7's "no clip" is wrong, and is withdrawn.**
- (10, 0x72)'s script 0x17cca80 is one op, 0xfe, with arg 0x17cc84c. The stepper's op 0xfe (0x9fe88) does not end the
  script: a non-null arg changes the action to its two bytes through 0x768c8, here **(1, 0x14)**. scrdump.py had printed it
  as `end(fe)`.
- (1, 0x14), traced:
  - phase 0: posture 0 (0xbc7f4), height calls 0xbf4d4 / 0xbf700, **L3 M9** (the fall);
  - phase 1, at its end: **L3 M8** (posture 3).
- vt+0x204 0xf08e7c cuts the tail (0xc2274(e, 0, 0, 0x8e), joint 142) at (10, 0x72)'s start. The follow runs in the same
  update, so the tail leaves at **L3 M9 frame 0**. The same holds in every posture (0..7) and only for part 6.
- **Controls, by the same trace:** Rathian (10, 0x72) -> 0x1794c10 L3 M15; Glavenus part 6 -> 0x17ebbe0 L3 M15; Kushala
  part 2 -> 0x17b4450 L3 M15 -> M16. Each is the clip the viewer's drop row is on.
- **Nothing else reaches it:** no other 0xfe in the data image names (1, 0x14), and no traced action plays L3 M9 / M8.
- **Wired:**
  - '3|Motion[9]': tail sets 13 -> 12, u 900, drops.
  - CLIP_ACTIONS (1, 0x14).
  - CUT_TAIL.em058_00: joint 142, above 20 (the .dtp +0x78 row is 0.8 / 20.0), landing u 905.
  - Descriptor [0x172ba68][46] = 0x1597594, whose resource 0x159daa0[0x7d0a] = jamcrc(em058_00_tail).

## 9. c 1600 / c 1601 and generator type 20

- **Type 20 is cParticleGeneratorSizeBillboard, read.** The chain:
  - the factory arm 0x9bb150 allocates through 0xa7e274 and constructs with 0xa7e2b0 (vtable 0x178918c);
  - getDTI 0xa81ef4 returns MtDTI 0x211c6ac;
  - 0xa82014 registers that DTI with the string.
- **Lifted, but the row is not enabled:**
  - registerCode for slots 6 / 8 / 15, and its own slots plus their callees (0xa802a0, 0xa80b64, 0xcae4f8) are lift roots;
  - the sets that carry type-20 rows were re-recorded: Kirin u 0 / u 230, Chameleos u 290, Uragaan / Crystalbeard c 211, these
    two.
  - With GENERATOR_TYPES[20] on, the viewer's draw reached the GPU state setup 0xbadd68's arm 0xbae8cc (0xbae8c0: the
    packet's word 1 bit 22 clear), which no request recording reaches.
  - Closed the same day:
    - the primitive-draw harness (efx/vecprim.py) reaches it with these four files, and its sets are lifted;
    - the SizeBillboard's shader variant FPrimitiveCalcPosParticleNT is translated (glsl.py) and merged into
      prim-shaders.json.
    - The row is ON. The seven records (Kirin u 0 / u 230, Chameleos u 290, Uragaan / Crystalbeard c 211, Amatsu c 1600 /
      1601) start alone twice and run out (page, zg/type20_alone.mjs: 21 / 0).
- **c 1600 / c 1601 (cm200_050_s):** (10, 0x6c) is L3 M18 -> M12 and (10, 0x6d) is L3 M14 -> M15 -> M17 -> M18 -> M12. The
  arm 0xf09240 requests c 1600 once and holds c 1601 until L3 M12. Rows on L3 M18 A / B, L3 M14, M15, M17; exported and recorded.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **e+0x15fb -- READ before this sweep** (rom-map row `0xf091ac`): its only writer is vt+0x204 on (10, 0x8e), an HP-fraction
  reaction; it is never cleared. Section 4's "the eight request sites are not read here" is superseded by section 5.
* Still open, category c: the aura's fade back in (+0x180) and the tail drop (fly the tail on Tail = Severed) -- Raven's call.
* **The aura's fade -- BUILT 2026-10-19** (rom-map row `0xf099cc..0xf09c08`): on a status-7 action but (7, 0xc) the aura is kept and
  drawn at 0 (u 3 once); back in by 0.02 a frame (50 frames). CLASS_TIMERS `alpha` -> rt.alphaEvent -> unit 0's colour block.
