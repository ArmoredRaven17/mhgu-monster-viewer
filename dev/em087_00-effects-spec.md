# Ahtal-Neset (em087_00) -- effects spec (walk, 2026-10-18)

Class `uEm087_00`. His word was read and transcribed before (base | bits 15-23 always: psl-mask.js em087_00). The survey's soak
(2026-10-15) refused 37 of 77 motions (calls to `0xaaeb90` / `0xa996b0` not translated, `0x44158` -> `0x441cc` unrecorded): the
cure was recording his sets and lifting. Scratch: `<archive>/zg/ppemu.py`, `states060.py`, `partscr.py`, `scrdump.py`.

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

## 5. The rocket points u 500 / 505 / 510 / 515 / 520 / 600 / 605 -- the full firing condition (lane B3, 2026-10-25; READ)

Rows: rom-map "Effects lane B3" (Neset rows) and lane B2's "Ahtal-Neset u 500..605 -- the reads finished". Point k = 0..6 is his
body-data part 8 + k; its effect is u [500, 505, 510, 515, 520, 600, 605][k] (vt+0x1d0 ids 1002..1008).

**A point fires when all of these hold, in this order:**

1. **A hunter hit lands on part 8 + k** (the shared 0x9d63c -> vt+0x310 0x10aa03c): e+0xcd44[k] = that hit's damage x P+0x388,
   through 0x99c78. Nothing else writes it (the vt+0x1dc loop zeroes it every frame after use).
2. **vt+0x30c 0x10a9db4** (after the damage step 0xa5844, when e+0x7420) takes it off the point's counter e+0xcd36[k] only while
   - **the gate e+0xcdba == 1**, and
   - **the point is armed**, e+0xcd34 bit k.
3. **The counter reaches 0.** Points 5 / 6 also need no reaction lock (P+0x3a2 == 0 and P+0x3a3 == 0); with a lock set the counter
   is held at 1 and the point waits for a later hit.
4. Then G+0xce gets the point's bit (0x10aeb60). The next vt+0x1dc 0x10a4bdc (0x10a53b8..0x10a5570) clears its arming bit and its
   counter, and **requests the point's u id** through vt+0x1d0 (block e+0xb640). The point that is e+0xcdb7 skips only the call
   0xac030(e, point, 100, 0) before the request (point's world spot: joint + offset tables 0x16a3370 / 0x16a3390 / 0x16a33b0).
   Point 5 also calls 0x9d39c(e, 4, 0) and point 6 0x9d39c(e, 5, 0).
   - Lane B2 read this as "the u request is skipped when r5 == e+0xcdb7". That is wrong: `beq 0x10a54f0` jumps past the 0xac030
     block to the request itself.

**The gate e+0xcdba, by action (writers: the whole text by immediate, `<archive>/laneB3/immcdba.out`, 19 sites):**

- **1 at EVERY action start.** vt+0x204's branch `0x10a6ed0` is not an action case. It is the arm taken when e+0x73e4 == 0, at
  the head of vt+0x204 (`0x10a6e84..0x10a6e8c`), before any action switch. It also clears e+0xcdbb / e+0xcdb8 / e+0xd4d7 /
  e+0xd4d8, sets e+0xcdf0 = 0xff, and zeroes e+0xd4ac..+0xd4c0.
  - e+0x73e4 is written by immediate only by the constructor (0x6dcd4) and the spawn init (0xb9a00, r7 = 0 from 0xb96e0), both 0.
    It is tested at every action start (changeAction 0x76318) and by a dozen shared paths that all skip when it is set.
  - INFERRED: a network-copy flag, 0 for the host, so the viewer's solo hunt takes this arm every time. The pointer caveat stands:
    a writer through a base register would not name 0x73e4.
- **0** at spawn (vt+0x1d8 0x10a424c).
- **0** in (1, 2) / (1, 0xf) / (1, 0x10), from their phase 0 (0x10b1494, in 0x10b1320; with e+0xcdbb = 1).
- **0** in (1, 8), from its phase 0 (0x10afd04) until L0 M9 reaches frame 300 (0x10afd38, `0xb0968(e, 1, 0)`, literal 300.0 at
  0x10afeac).
- **0** at the end of the collapse 0x10b16d0, when it requests (1, 0xf) / (1, 0x10) (0x10b1780). The collapse is the main of
  (1, 0x11) / (1, 0x12) / (10, 0x8e).
- So **the gate is open** in every other action: (1, 0x14), (1, 0x15), (1, 8) from f300, his attacks and moves, his reactions
  (1, 5) / (1, 6) / (1, 7), and the collapse's own L3 M12 / M16. In the collapse it does nothing, because the collapse's
  vt+0x204 disarms every point (0x10a7bac).

**Armed points, by phase:**

| when | armed (e+0xcd34) | counters e+0xcd36[k] | e+0xcdb7 |
|---|---|---|---|
| spawn (vt+0x1d8 0x10a41cc; his first action is (1, 2)) | 0x23 = points 0, 1, 5 | 200, 200, -, -, -, 1000, - | 5 |
| (1, 8)'s start (vt+0x204, G+0x32 = 4: the second phase; 0x10a7680) | \|= 0x5f = points 0, 1, 2, 3, 4, 6 (point 5 keeps its state) | 800, 800, 1000, 1000, 1200, (5 unchanged), 2000 | 6 |
| a point fires | its bit cleared (0x10a5400) | 0 | -- |
| (1, 0x11) / (1, 0x12) / (10, 0x8e) start (0x10a7bac) | &= 0x80: all cleared | all 0 | 8 |

(1, 0x15)'s start sets G+0x32 = 2 and arms nothing; (1, 0xf) sets G+0x32 = 3.

**What the firing does to him (vt+0x30c, READ; the meaning of its argument INFERRED):**

The argument is the damage step's return, r6 of 0xadd8c.

- With the argument 0: points 0 / 2 request (1, 7), points 1 / 3 / 4 request (1, 6), points 5 / 6 request (1, 5). This needs no
  reaction lock, a current status other than 10 (e+0x73e0), and e+0xcdb8 == 0.
- With the argument nonzero: only points 5 / 6 request (1, 5).
- The reaction main is 0x10b1504.
  - (1, 6) and (1, 7) play L3 M1 once.
  - (1, 5) plays L3 M3, then L3 M4 for 1440 frames (P+0x1bc = 1440.0), then L3 M5.
  - Each sets e+0xcdb8 = 1 (one reaction per action).

**What the model shows (his part pass vt+0x210 0x10a7ed4, READ; which set is the intact pod is INFERRED):**

- With e+0xcdbb set (the down states above), only set 0x18 shows.
- Otherwise set 0, then points 0..4: gate AND armed -> set 2k + 1, else 2k + 2.
- Point 5: with e+0xcdb7 == 5, set 0x14 if gate AND armed, else 0x15; any other e+0xcdb7 -> 0x16.
- Point 6: with e+0xcdb7 == 6, set 0x11 if gate AND armed, else 0x12; any other e+0xcdb7 -> 0x13.
- Parts 3 / 4 then follow their break levels (sets 13 / 14 ..).
- So each point's pod shows while it can be destroyed and goes when it has fired. A per-point "destroyed" toggle would map onto
  these set pairs; a click-to-hit would drive the counter.

**Which set is the intact pod: now READ, from his .mpm set table** (monsters.json `groups`, set i = its (group, drawn) list). The
INFERRED above is upgraded:
- Set 2k + 1 draws group k + 1, and set 2k + 2 hides it (points 0..4 = groups 1..5).
- Set 0x14 = group 14 on / 15 off; 0x15 = 14 off / 15 on; 0x16 = both off.
- Set 0x11 = group 12 on / 13 off; 0x12 = 12 off / 13 on; 0x13 = both off.
- Set 0x18 = group 16.
- These groups are Raven's Parts rows: "Webbed Pile (Right A / Left / Right B / Left B / Center)" for groups 1..5, "Cocoon Side"
  for 14 / 15 and "Cocoon Center" for 12 / 13.

**Built (lane B3, 2026-10-27; Raven: "Toggle until I can see what they are"):** seven class toggles on his entry, "Point 0
destroyed" .. "Point 6 destroyed" (render/motion-states.js POINT087; index.html point087; working labels, for Raven to name).
- On: the point's u effect fires once. Its record places itself at the point: root joint 0 + the payload offset, e.g. u 500 at
  (600, 600, 350).
- On also sets Raven's Parts row for that group to the option the destroyed set draws: Broken for points 0..4, Cracked for
  points 5 / 6. Cracked is the set while e+0xcdb7 is still that point's phase.
- Off: the intact option, with no effect.
- The u 500..605 records were exported for this (docs/effects/em087_00.json, `event`, em087_00_013.efl, UNIQUE).
- The phase each point is armed in is in its tooltip; the toggles do not model the phase.
- The flinch ((1, 5) / (1, 6) / (1, 7)) is animation: HELD.
- **Measured** (`<archive>/laneB3/point087.mjs`, pq/b3point087b): every point **1 start, draws** (u 500..605: 44-45 of 49-50
  samples lit, 23712..41921 px). Each Parts row moved to its destroyed option, and off restores it.
- Shots: dev/shots/laneB3_point087/intact.png, point0..point6.png.

Portable: a per-part counter consumed by a class's post-damage hook, with a gate set at every action start, is the shape to look for
in any port. Find the hook from the shared damage step's virtual call (here vt+0x30c after 0xa5844).
