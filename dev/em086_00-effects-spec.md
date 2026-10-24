# Valstrax (em086_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm086_00`; his word is the BASE `0xca170` (`BASE_ONLY`). No states note existed. Scratch: `<archive>/zg/ppemu.py`,
`hook204b.py`, `states060.py`, `partscr.py`, `scrdump.py`.

## 3. The states -- R

- Status 10: (10, 7) every part -> L3 M1; (10, 0x14) parts 0..3 / 6 -> L3 M3, 4 / 7 -> L3 M5 -> wait 240 -> L3 M6 -> L3 M7, 5 -> L3
  M9 -> L3 M10 -> L3 M11; (10, 0x72) part 1 -> L3 M37 -> wait 480 -> L3 M10 -> L3 M11, part 6 -> L3 M21 with vt+0x204 `0x109f830`'s
  `0xc2274(e, 0, 0, 0x8f)` (emulated) -- the tail sever at joint 143; sleep L0 M24 -> L0 M25 held; wake L0 M26 -> L3 M16; paralysis
  L3 M13 -> L3 M14 held; the stun sides 0 / 1 / 3 -> L3 M9 -> L3 M10 held -> L3 M11, side 2 -> L3 M5 -> L3 M6 held -> L3 M7;
  recoveries L3 M16; no shock-trap / exhaust case; death L3 M17.
- The part pass vt+0x210 `0x10a1230`, RUN with each part's level (`ppemu.py`): part 0 set 4 -> 5 -> 6 (head cracked, broken; u
  1000 / 1001), 1 10 -> 11 (back, u 1005), 2 13 -> 14 (left wing, u 1010), 3 26 -> 27 (right wing, u 1015), 4 17 -> 18 (u 1020), 5 19
  -> 20 (u 1025); the tail set did not move with P+0x3b4 (six bits tried).
- Eyes `0x71398(e, 3, 2, -1)` (`0x109e288`): open 3, shut 2. Rage: g6 s0 = (1, 4) L0 M5.
- CUT_TAIL: descriptor [132] `0x159ba1c` -> em086_00_tail, joint 143, 20.

## 4. Named, open

**His own puff and class machine**: vt+0x1d8 writes e+0xb7d2 = 0 (`0x109e17c`) -- the shared puff is off -- and his table holds 100 /
110 / 120 / 130 / 200 / 1120 / 1121 / 1130; the request sites (`0x109ab60`, `0x109af40`, `0x109b2dc`, `0x109b7d8`, `0x109ef68`,
`0x109f274`) are not read here.

## 5. Implemented / results

CLIP_ACTIONS / CLIP_VARIANTS; MOTION_STATES.em086_00; CUT_TAIL; `--apply` +5, recorded.
Check dev/checks/elders.mjs pass. Soak **100 motions, 0 refused**.

## 5. The class requests (closing the open reads, 2026-10-18)

- **Key table [0x16a2edc]:** 1001 -> 100, 1002 -> 110, 1003 -> 120, 1004 -> 130, 1005 -> 200, 1006 -> 1120, 1007 -> 1130,
  1008 -> 1121.
- **The frame handler vt+0x208 `0x109ed50`:**
  - The aura e+0xcb1c is u 200 calm and u 1120 enraged. It is u 1130 once part 0's level (0x9d36c) reaches the .dtp byte
    at 0x109ee90 / 0x109ee94: A[1] bytes 1 / 2 by rank, both 2, i.e. the head broken (set 6). It stops when dying.
  - The glow e+0xcb14 is u 1121 while e+0xcb10 is 0 or 1. On states 2..6 it fades out by [0x16a2fa0][state-2] x dt
    (1/60, at once, at once, 1/30, 1/10) and stops at alpha <= 0. The viewer keeps the stop at that frame count; the fade
    itself is not shown.
  - Every 180 frames, enraged, it makes a shell: not an effect.
- **e+0xcb10 per action** is set at the action start by vt+0x204 0x109f830 (0x10a0884). Calm forces it to 3 (0x10a08d4).
  Enraged, read with hookbyte.py over every action:
  - 2 for status-7 numbers <= 0x30, except 0x13 / 0x1f / 0x20 / 0x24..0x29;
  - 4 for (1, 5) and (10, 0x1d / 0x1e);
  - 5 for (3, 0 / 1 / 5 / 6);
  - left as it was by (7, 0x31 / 0x32 / 0x34 / 0x35);
  - 0 for everything else.
- **THE COMET:** `0x109a5b4` handles (7, 0x32 / 0x34 / 0x35) and `0x109b07c` handles (7, 0x33). The phase byte is
  P+0x1a1 (classreq.py `PPOKE`). The tune floats come from em086_00_actiontune.fup, read through 0x3cb330.
  - **u 110 (1002), L1 M5 frame 30 (copy B).** Phase 3 sets L1 M5 and P+0x1bc = tune float 0x24 (30). When it expires,
    motion goes to 0xffff (no clip) and id 1002 is requested (0x109ab60).
  - **u 100 (1001), on no clip.** Phase 5 flies him unseen for tune float 0x25 (90 frames), then requests it into e+0xcb18
    (0x109af40).
  - **u 120 (1003), on no clip.** (7, 0x33) phase 0 (motion 0xffff) stops u 100 and requests it (0x109b2dc).
  - **u 130 (1004), L1 M5 held (copy C).** Phase 1 runs past motion 0xffff's end and tune float 0x29 (60), sets L1 M5 and
    requests it into e+0xcb18 (0x109b7d8). It is held through phase 2's fall until he lands (P+0x44 vs P+0x1d4 + c,
    0x109b440), which stops it and sets L2 M73.
  - L1 M5 copy A is his other L1 M5 plays: (3, 0 / 1 / 5), (12, 0), (13, 0).
- **Wired:** CLASS_TIMERS.em086_00 (aura, glow, head-broken key), MOTION_STATES '1|Motion[5]' A / B / C, CLIP_ACTIONS and
  CLIP_VARIANTS. u 1120 / u 1121 retagged from ragePuff to event; u 110 / u 130 / u 200 / u 1130 exported (--states) and
  recorded.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* Section 4's "the request sites are not read here" is superseded by section 5 (2026-10-18). Still open, category c: the glow's
  fade-out on states 2..6 (the stop is kept at the frame count; the fade itself is not drawn).
* **The glow's fades -- BUILT 2026-10-19** (rom-map row `0x109f080..0x109f2b8`; corrects "at once" -- Withdrawn): in at 1/60 (state 0)
  or 0.1 (state 1), out at 1/60, 1/60, 1/60, 1/30, 1/10 for states 2..6; 3 / 4 stopped at 0, 2 / 5 / 6 kept at 0.
  A play the viewer names no action for now reads as an idle / move (e+0xcb10 = 0), so the glow is lit at rest while enraged; every
  status-7 clip of his names its actions (psl-mask.js em086_00, tracer).
