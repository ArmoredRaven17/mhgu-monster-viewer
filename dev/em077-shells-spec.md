# Seregios (em077_00) -- his bladescales, shell28 0x13e on base28 (shells agent, 2026-10-19)

Class `uEm077_00` (vtable `0x17e7c08`, action main `0xfdb030`, band `0xfda074..0xfee13c`). Emulator check
`dev/shells-seregios28-check.mjs` (tool `<scratchpad>/fb/mk077s28.py`), 38 / 38 (29 cases, 8 controls each failing, the contract);
page 5 / 5. `R` = the consuming instruction read. His shell01 0x13c (base01, the frame handler's c 30 / c 32) is
dev/em077_00-effects-spec.md 7 and dev/shells-seregios-check.mjs; shell27 0x13d is not built (no maker in his reach: the census
finds only 0x13c / 0x13e).

## 1. What creates (the census of his reach)

Every maker: `0x411068(0x24)` (cSetupParamEmBase28), +4 0x13e, +8 the mode, +0xc the owner, +0x10 the DEGREE INDEX (into the shell's
common vecs), +0x14 `[ctl+0x7c]` (a u16 the action's phase 0 draws, `0x16b4b4`; base28's init does not read it), +0x18 0, +0x1c the AIM
byte, +0x20 the CLAMP INDEX; `0x48b884` at once. Found by trgen (`<scratchpad>/fb/s28cap5..12.py`): every action with phase 0 run first
and its ctl / block carried into phases 1 / 2, each frame test answered alone; the `.dtp` rows poked and `0x9d36c` answered 0 / 2
(FB_WATCH naming the part each site asks); rank 0..7, rage x tired, the sever.

| actions | clip (phase) | frames | mode | index | aim / clamp | gate |
|---|---|---|---|---|---|---|
| (1, 0x17), (7, 0xc) | L2 M4 (1, 2) | 55 / 60 / 65 | 6; **12 severed** | 52 / 54 / 56 | 0 | questRank >= 5 |
| (1, 0x18), (7, 0xb) | L2 M3 (1, 2) | 55 / 60 / 65 | 6; 12 severed | 51 / 53 / 55 | 0 | questRank >= 5 |
| (1, 0x19 / 0x1b), (7, 0 / 3 / 0x38 / 0x3a) | L2 M26 (2; phase 0 L2 M25) | 70 / 73 / 76 / 79 | **2; 9 with part 4 broken** | 6..9 | 0 | -- |
| (7, 0x3b) | L2 M26 (2) | the same | 2 / 9 | 10..13 | 0 | -- |
| (7, 4) | L2 M21 (1) | 69 / 74 / 80 | 0 | 38 / 39 / 40 | 1 / 2, 3, 4 | -- |
| (7, 0x11) | L2 M21 (1) | the same | **7** (ctl+0x70 1) | 38 / 39 / 40 | 1 / 2, 3, 4 | -- |
| (7, 5) | L2 M20 (1) | 62 / 67 / 72 / 90 / 95 / 100 | 6; 5 severed | 41..46 | 1 / 5 | -- |
| (7, 0x12) | L2 M20 (1) | the same | 13; 12 severed (ctl+0x70 1) | 41..46 | 1 / 5 | -- |
| (7, 8), (7, 0x39) | L2 M34 (2; phase 0 L2 M33) | 76 / 79 / 82 / 85 | **1; 8 with part 4 broken** | 14..17 | 0 | -- |
| (7, 0x3e / 0x3f) | L2 M34 (2; phase 0 L2 M70, M34 from frame 58) | the same | 1 / 8 | 18..21 | 0 | -- |
| (7, 0x40) | the same | the same | 1 / 8 | 22..25 | 0 | -- |
| (7, 0x2d / 0x2f) | L2 M65 (1) | 85 / 91 | **0; 7 with part 6 (the head) broken** | 47 / 49 | 0 | questRank >= 5 |
| (7, 0x2e / 0x30) | L2 M66 (1) | 85 / 91 | 0 / 7 | 48 / 50 | 0 | questRank >= 5 |

* The G gate: `0xfe0d44` / `0xfe0dc0` `bl 0x3a8430; cmp r0, #5; blge 0xfea544` (the helper, r1 the side: index 0x34 / 0x33 + 2k) (R);
  M65 / M66 the same rank test (emulated: none at rank 0..4, both at 5..7).
* The sever (M3 / M4 helper `0xfea578..0xfea5e4`, M20 `0xfe9360..0xfe93c8`): `vt+0x370(e, 1)` = `0xa3bf4` (P+0x3b4 bit 0) -- R. The M4
  helper calls it twice with the same argument, so its 5 / 0xd arms are unreachable (I: the same function on the same byte).
* ctl+0x70: `0xfe9360` `ldr [ctl+0x70]; cmp #1` -> 0xd / 0xc, == 0 -> 6 / 5 (R); written by the action's phase 0 from a table by its arg
  ((7, 4 / 5) 0, (7, 0x11 / 0x12) 1 -- emulated, constant over the breaks, rage, tiredness and the sever).
* The break tests (R): `0xfe12d8..0xfe1320` (L2 M26) `bl 0x9d36c(e, 4)`, `[[e+0x75f0]+0x64]` bytes +0x11 / +0x12 by `0x3a8430 > 4`,
  `cmp fp, r0; movwlo sl, #2` (else 9); `0xfe9dfc` (L2 M34, part 4, 1 / 8) and `0xfebb6c` (the (7, 0x3e..0x40) body, the same) and
  `0xfeb538` (L2 M65 / M66, part 6, 0 / 7) -- emulated. em077_00_dtbparts.dtp A rows (dtp.py, EXACT): (6, 2, 2), (1, 2, 2), (2, 2, 2),
  (3, 2, 2), (4, 2, 2): part 4's level 2 at every rank, part 6's (the head) row 0, level 2. Part 4 = the -X hind leg and part 6 the head
  are the decode notes' links (motion-states.js S_LEG_L / S_HEAD) -- I.
* **The census's first run answered `0x9d36c` 0 against an unmapped `.dtp` (thresholds read off text bytes)**, so it reported 9 / 8 / 7
  for every play: the modes a broken part gives. Rerun with the rows poked (above). Not a withdrawal of a map row (none was written).

### 1.1 The frame handler `0xfddfcc` (vt+0x208, the +0x28 pass after the action)

By the motion id (`0xb0944`, the list-2 table), two shells a channel-1 crossing (`0xb09b0`):

| motion | frames | first | second | index | clamp |
|---|---|---|---|---|---|
| L2 M29 (0x21d) | 8 / 13 | ctl+0x70 ? 10 : 3 | ctl+0x74 ? 11 : 4 | 26 / 27, 28 / 29 (ctl+0x78 != 0: 30 / 31, 32 / 33; `0xfdf0f4 ldrh [ctl+0x78]`) | 0 |
| L2 M48 (0x230) | 66 / 71 | the same | the same | 34 / 35, 36 / 37 (ctl+0x78 not read) | 1 |

Aim 1 for all. ctl+0x70 / +0x74 / +0x78 are the PLAYING action's, written in its phase 0 (the sweep of every action, s28sweep.py /
s28cap10.py): (7, 9..0x1e) play L2 M29 in phase 1, (7, 0x23..0x26 / 0x31..0x34) L2 M48 in phase 0 -- (7, 9 / 0xa) (0, 0, 0), (7, 0xf /
0x10) (0, 0, 1), (7, 0x13 / 0x16) (1, 0, 0), (7, 0x14 / 0x17) (0, 1, 0), (7, 0x15 / 0x18) (1, 1, 0), (7, 0x19 / 0x1c) (1, 0, 1), (7, 0x1a /
0x1d) (0, 1, 1), (7, 0x1b / 0x1e) (1, 1, 1); (7, 0x23 / 0x31) (0, 0, 0), (7, 0x24 / 0x32) (1, 0, 0), (7, 0x25 / 0x33) (0, 1, 0), (7,
0x26 / 0x34) (1, 1, 0). The handler also reads parts 1 and 2 (`0xfdf4a8` / `0xfdf4f4`, the both-wings tune switch) -- no shell input.

## 2. shell28 `uShellEm077_sp_28` (base28; his vtable `0x17e92e0`, found by vtdti.py; extent to +0x158)

* base28 band `0x4111b0..0x411fac` (R whole): ctor `0x4111b0`, init +0x13c `0x4111e4`, move +0x24 `0x411b4c`, end +0x148 `0x411e70`;
  +0x154 / +0x158 `bx lr`. His class: reader +0x14c `0xfeef90`, landing +0x150 `0xfef178`.
* Reader `0xfeef90`: ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; ints 0..3 -> +0x15dc (the joint) / +0x15e0 / +0x15e4 (0: the height
  from the owner's) / +0x15e8 (0: the X clamp's absolute arm); float 0 -> +0x15ec; vecs 0..3 -> +0x1608 (the offset) / +0x1600 (the
  speed) / +0x160c (the aim offset) / +0x1610 (the height offset); cmn vec [setup +0x10] -> +0x1604 (X / Y degrees); cmn vec [setup
  +0x20] -> +0x15f0 = -x, +0x15f4 = x, +0x15f8 = -y, +0x15fc = y (the clamps, degrees).
* The init `0x4111e4`: the base's `0x43a850`; the setup's three; the owner live (`0x4a100c`, byte +0x50 bit 0) else deleted; the reader;
  the point `0x4114a0` (the joint's position + its 3x3 x the offset; +0x15e4 == 0: y = the owner block's +0x44 plus the height offset x
  the size, turned by his Z then X word -- e+0x74ec, a tilt factor, 0: a stand-in); the words `0x411774` (aim 0: his X / Y + the
  degrees; aim 1: yaw / pitch from the point to the target block +0x1d0 + the aim offset, each word clamped -- lo == 0 -> his word +
  the degrees; else the relative arm clamped circularly into [lo, hi]; X with +0x15e8 == 0 the absolute arm `0x4119bc..0x411a3c`);
  +0xfe8.. = the words; the velocity = the speed turned X then Y; state 1; ef 0 at the point -> +0x1620; the hit registration (slot 0).
* The move `0x411b4c`: handles dropped when their unit left states 1 / 2; 0xfe: +0x1614 += dt, past [0x162493c] x 60 -> deleted, a live
  handle kept, else 0xff; 1: the owner gone -> the end; +0x1000 = +0x40; `0x539224`; X = atan2(-vy, |(vx, vz)|), Y = atan2(vx, vz);
  **hit slot +0x13ad clear -> the end** (it lives while its hit slot does: em077_00_28_hitdata (0, 99) x 2); the stage query `0x43ac8c`
  -> a hit: +0x150.
* Landing `0xfef178` (state 1): type 0 / 1 / 2 -> ef +0x15cc / +0x15d0 / +0x15d4 at the contact (`0x411ef8` -> +0x1624), the end.
* Modes (em077_00_28, 14; lists em077_00u): 0..6 hit 0, ef u 30 / 32 / 31 / 32 (5: u 40 / 42 / 41 / 42); 7..13 hit 1, ef u 40 / 42 / 41
  / 42. Joints 3 / 18 / 22 / 160 / 161 / 144 / 145 (n and n + 7 alike).

## 3. In the viewer and checked

shells.js: the BASE28 block (params077s28, make28, step28, end28), spawn077s28 (code 'em077s28', 32 rows incl. the frame handler's
players, which carry `ctl077` and no shells), perFrame077s28 (D.perFrame077s28), D.dtp077, SHELL_DATA.em077_00.shells.shell28.
Inputs: input.rank, input.tailSevered, input.parts077 (motion-states.js seregiosParts077: part 4 = S_LEG_L's level, part 6 = S_HEAD's
either form; index.html passes it). A frame-handler clip played with no action row names no ctl: refused, named.

`dev/shells-seregios28-check.mjs` 38 / 38: every maker and clip, aimed up / aside / turned, the sever, ctl 0 / 1, part 4 / 6 broken (and
at rank 3), rank 4 none, the floor crossed, the frame handler's five ctl combinations; controls (joint 145 along x, the target 30
aside, his Y word, the sever, the module playing another ctl's action, the floor, part 4 level 1, the head unbroken) each fail.
Page 5 / 5 (L2 M26 / M21 / M34 / M29 make shell28). **Records em077_00u 30, 31, 32, 40, 41, 42 are not exported** (docs/effects/
em077_00.json has none): the shells start them and draw nothing until the slot exports, records and lifts them.
