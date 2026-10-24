# Gore Magala / Chaotic / Shagaru Magala (em071_00 / em071_05 / em072_00) -- effects spec (Elder Dragon / Gore walk, 2026-10-18)

One class `uEm071_00` (Gore em 0x47, Chaotic em 0x47 variant 5, Shagaru em 0x48). No states note existed. Scratch:
`<archive>/zg/pp071.asm`, `ppemu.py`, `hook204b.py`, `states060.py`, `partscr.py`, `scrdump.py`.

## 1. The PSL enable word -- vt+0x13c = `0xfc08a8` -- R, read whole and emulated

26 instructions: `0xca170`, then L2 M7 only, (7, 0x58) bits 15-17 or (7, 0x60) bits 18-20, each also clearing bits 6 and 9 (`bic
#0x240`). No variant or em test. Emulation **16416 runs, 0 mismatches**; control 16.

## 2. The plays -- R (tracer, all three the same)

L2 M7: A (7, 0x58), B (7, 0x60), C (7, 0x52 / 0x59 / 0x5b / 0x5e / 0x5f / 0x61 / 0x67).

## 3. The states -- R

- Status 10: (10, 7) parts 0 / 6 / 7 -> L3 M2, 1 / 2 / 3 / 5 -> L3 M1, 4 -> L3 M3 -> wait 240 -> L3 M4 -> L3 M5; (10, 0x14) 3 / 7 -> L3
  M1, 5 -> L3 M9 -> L3 M10 -> L3 M11; exhaust L3 M2; (10, 0x72) part 6 -> L3 M39 with vt+0x204 `0xfadfa0`'s `0xc2274(e, 0, 0, 0x8f)`
  (emulated) -- the tail sever at joint 143 -- other parts L3 M18; sleep L0 M18 -> L0 M19 held; paralysis L3 M15 held; the shock trap
  L3 M15; the stun sides 0 / 1 / 3 -> L3 M9 -> L3 M10 held -> L3 M11, side 2 -> L3 M3 -> L3 M4 held -> L3 M5; recoveries L3 M17;
  death (11, 0) L3 M22 -> L3 M21, (11, 7 / 0x12) L3 M34, capture L0 M18. Tired (0, 2) L3 M23.
- The part pass vt+0x210 `0xfbf97c`, RUN with each part's level (`ppemu.py`; control: Lao-Shan's static read reproduced): Gore part
  0 set 1 -> 2 (head, u 1000), 7 5 -> 6 (feelers, u 1035), 3 9 -> 10 (wing arms, u 1015), 2 11 -> 12 (wings, u 1010); Chaotic 0: 1 ->
  2, 7: 11 -> 12, 3: 9 -> 10, 2: 13 -> 14; Shagaru 0: 3 -> 10 -> 11 + 10 (horns, u 1000 / 1001), 3: 5 -> 8, 2: 4 -> 9. The tail set did
  not move with P+0x3b4 in those runs: the cut tail's piece and u 900 show the sever.
- Eyes: Shagaru only, `0x71398(e, 1, 7, -1)` at `0xfadcc8` (em 0x48) -- shut set 7. Rage: g6 s0 -> Shagaru (7, 0x53) L4 M2, else
  (1, 0) L0 M5 / (1, 3) L0 M31. RAGE_PUFF (rathianPuffPick) existed.
- CUT_TAIL: descriptors [59] / [127] / [60] -> em071_00_tail / em071_05_tail / em072_00_tail, joint 143, 20.

## 4. Implemented / results

psl-mask.js `em071` + CLIP_ACTIONS (L2 M7 and the state copies); CLIP_VARIANTS (GORE_COPIES); MOTION_STATES (one builder, three
monsters); CUT_TAIL x3; `--apply` +10 / +10 / +5, recorded. The class's request sites `0xfaf3d8` / `0xfc076c` (keys 30 / 31) were
exported before.
Check dev/checks/elders.mjs (all three) pass. Soaks **107 / 120 / 110 motions, 0 refused**.

## Control block re-check (2026-10-19, trap 117's follow-up; rom-map "the control block [e+0xcac0] SET NON-ZERO")

* **Class requests the viewer does not drive** (all three monsters):
  * `0xfaf318(e, k)`: id 1002 (key 30), placed at control-block slot k's point (C + 0x40k + 0x10..; handle at +0x38).
  * `0xfc05ec`: id 1001 (key 31), at ray points, from many action functions.
  * Both are gated by the slot bytes C+0x40 / +0x80 / +0x81, whose writers are NOT READ.
  * Keys 30 / 31 are in the json only as clip bits and shell records.

## The slot ring, u 30 / u 31 (effects lane, 2026-10-20) -- read, not built

* `0xfc05ec` / `0xfaf318` are read; rom-map "Class requests driven" has the two-slot ring and the 14 traced fill sites.
  - Every fill holds u 30 (id 1001) at a point while at most 2 are up.
  - Reusing a slot first bursts u 31 (id 1002) at the old point.
* Not built yet. Still needed:
  - the clip of each site's phase;
  - the three computed points (`0xfb3f44`, `0xfb4478`, `0xfb9b3c`);
  - the seven sites the tracer did not reach;
  - whether the manager behind `0x69ed0` / `0x69f0c` ends a slot by itself.

## The slot ring -- built (effects lane, 2026-10-20, later the same day)

* **The ring** (0xfc05ec / 0xfaf318 / the ctor / vt+0x1dc's timers, read) runs in the effect schedule (schedule.js `ringFill` /
  `stepRing`):
  - two slots, a counter 0..3 (k = counter & 1) and a live count;
  - a fill bursts a busy slot (u 31 at its point) and then holds u 30 at its own point while the count <= 1;
  - each slot bursts when its life s1 runs out (1.0 a frame);
  - a flag-0 fill takes the ground within 500 below, or makes no fill.
* **The fills** are CLASS_TIMERS (GORE_FILLS), placed per clip at the frames the handlers' phases give:

  | clip | frame | offset | s0 / s1 | flag | actions |
  |---|---|---|---|---|---|
  | L0 M5 | 160 | (0, 0, -300) | 500 / 480 | -- | (1, 0 / 0x14 / 0x16), (13, 0xb) |
  | L0 M51 / M54 | 100 | (0, 0, 1000) | 400 / 240 | -- | -- |
  | L0 M74 / M77 | 16 | unit | 400 / 240 | -- | -- |
  | L0 M81 | start | unit | 400 / 240 | -- | -- |
  | L0 M9 | 50 | (250, 0, 850) | 280 / 360 | -- | -- |
  | L1 M8 / M13 | 90 | (0, 0, 750) | 450 / 360 | -- | -- |
  | L2 M33 | 120 | (0, 0, 500) | 400 / 240 | -- | not Chaotic |
  | L4 M20 | 184 | the same | 400 / 240 | -- | -- |
  | L2 M20 / L4 M25 | 110 / 186 | (-500, 0, 0) / (-750, 0, 150) | 300 / 360, 350 / 360 | 0 | -- |
  | L2 M21 / L4 M26 | 110 / 186 | mirrored | as above | 0 | -- |
  | L2 M46 | 30 | unit | 450 / 360 | -- | (7, 0x23..0x25) |
  | L2 M47 | 30 | (0, 0, 400) | 400 / 240 | -- | (7, 0x26..0x28) |
  | L2 M49 | 84 / 130 | (-400, 0, 0) / (400, 0, 0) | 400 / 180, 400 / 300 | -- | -- |
  | L2 M52 | 84 | (0, 0, 600) | 400 / 90 | -- | (7, 0x33) only: copy A; copy B (7, 0x2c) none |

* **Shells:** the shells' sp_00 landing (mode 0) and sp_03 end (modes 0, 4..6, 8..13) call the owner's flag-0 fill (shells.js
  `ownerFills`).
* **Not driven:** Chaotic's six damage-gated fill sites (C+0x84, the damage accumulator, against rank thresholds), and the
  (7, 7 / 0x34 / 0x37 / 0x69) arm Chaotic takes there.
* **Checked:** dev/gore-ring-check.mjs runs the viewer's ring against the ROM's own functions under unicorn: 17 / 17.
* **Measured in the page** (dev/checks/gore-ring.mjs, all three monsters):
  - u 30: 6 starts, draws (lit about 209 / 212);
  - u 31: 4 starts, draws (lit 38..39 / 39).
  - The shells' path also works: L2 M52 copy B (7, 0x2c) fills through its sp_00 landing; L2 M4 (7, 9) and L2 M6 (7, 0x32) fill
    through their sp_03 ends.

## The gauge's other readers (effects lane, 2026-10-21) -- read; one built

All of C+0x84's readers are now read (rom-map rows after "C+0x84's readers"). The rank caps the gauge each frame (`0xfaee08`, table
0x16a1530: 20000 at G, 24000 at rank 3, 32000 at rank 1 / 0).

* **Built -- the BodyLight clip.** The part pass vt+0x210 `0xfbf97c` picks one of six clips by tier and puts it into slot 0 of the
  material with MRL id 0x3d (cached at C+0x94):
  - tier 0..4 = BodyLight_Normal / _Start_LV1 / _LV2 / _LV3 / _LVMAX, at C+0x84 >= 5000 / 10000 / 20000 / 28000 (Chaotic);
  - C+0x82 overrides the tier with 4 (LVMAX), or 5 (_Start_Finish) when C+0xc2 is also set;
  - C+0xca (set by the death motions) overrides it with 0 (Normal).
  - The viewer: the Gauge (0 / 5000 / 10000 / 20000 / 28000, capped by the rank) sets Chaotic's ladder rung. The ladder row is hidden,
    and the ladder is no longer his enrage (index.html LADDER_BY_GAUGE / LADDER_NOT_ENRAGE).
  - dev/checks/quest-rank.mjs: rank 5 / 3 / 1 give rungs 0 1 2 3 3 / 0 1 2 3 3 / 0 1 2 3 4, and none of them enrages him.
* **Built later the same day -- C+0xca.** The death motions put the light back to Normal (motion-states.js `clipsFrom` on the Gore
  line's death rows):
  - L3 M21 crossing f238 -> BodyLight_Normal on XfB_W__m01_kasan, held for the rest of the motion (Gore Magala and Chaotic);
  - L3 M34 f504 is transcribed too, but that motion is 311 frames and channel 0 stops at its length (0x72714), so it never fires.
  - quest-rank.mjs: at Gauge 20000 there is no Normal at f150, Normal at f270, and it is gone after leaving the motion.
* **Read, not built:**
  - **C+0x82 / C+0xc2** -- LVMAX / Finish. On Chaotic, +0x82 is set only with P+0x5cb6 == 1.
* **Named -- nothing the viewer shows:**
  - **vt+0x234 `0xfbf68c`** -- a state query: >= 20000 and C+0xc2. Its callers are engine code, not read.
  - **vt+0x24c `0xfc045c`** -- part 0's break registration and P+0x3b4 bit 0x2000 wait for >= 10000. That bit swaps the feeler sets
    5 / 7 for 6 / 8, and it is never cleared. The Feelers row already offers the broken set.
  - **`0xfc0910` -> `0xfaf42c`** -- the RGBA lerp into C+0xc4. No reader found.
  - **vt+0x214 `0xfbe33c`** -- the EMC conditions 1 / 13 / 15..18 (AI choice only).
