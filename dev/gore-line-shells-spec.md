# The Gore line's shells: Gore Magala, Chaotic Gore Magala, Shagaru Magala (uEm071_00)

Shells lane, 2026-10-19. All three use one class, uEm071_00 (main `0xfaf780`, band `0xfad1fc..0xfc40ec`, vtable `0x17e418c`).
Shagaru Magala (em072_00) has no class of his own: the class reads the em byte e+0xb5f4 (0x47 / 0x48) and the variant e+0xb5f5.
Each class reads its file by the shell's id (0x4a0ecc), so one reader holds three arms.

Status: **built: 1. Gore Magala, 2. Chaotic Gore Magala, 3. Shagaru Magala** (2026-10-19).

## 0. The ids (vt+0x158 `0xfad4ec`, READ)

e+0xcac4 / +0xcac8 / +0xcacc / +0xcad0 hold the ids of sp_00 / sp_01 / sp_03 / sp_11, each one loaded through 0x48b71c unless it is 0x19d:

| who | sp_00 | sp_01 | sp_03 | sp_11 |
|---|---|---|---|---|
| em 0x47, variant 0 (Gore) | 0x12d | 0x12e | 0x12f | 0x130 |
| em 0x47, variant != 0 (Chaotic) | 0x131 | 0x132 | 0x133 | 0x134 |
| em 0x48 (Shagaru) | 0x135 | 0x136 | 0x137 | 0x138 |

The census and the emulator must poke these ids (fb/gorepokes.json). Without them every create names id 0 and nothing matches.
For Shagaru the em byte must be 72 (`FB_EM=72`). A run without it walks Gore's arms.

## 1. Gore Magala (em071_00)

### 1.1 Which actions

- The walk: em071_00_cmdtbl.emc, closed over every change (fb/chainx.py; vt+0x3d0 included, rage and tired walked at 0 and 1).
- The census: fb/cen11_gore0.txt (cengen11 with the ids poked; every frame test answered alone).
- The phases: fb/clipphase.py. Every create is in phase 1, on the phase-0 clip.

| action | clip, frame | maker | what it makes |
|---|---|---|---|
| (7, 0x2c) | L2 M52 f84 | `0xfbab80` | sp_00 mode 0 from the zero setup (base00's joint path) |
| (2, 0x12) / (2, 0x23) | L1 M8 / L1 M13 f90 | `0xfb4d70` | sp_01 13 at his +0x40 with his words, when block +0x44 <= ground +0x5b4 + 900 |
| (3, 0 / 3 / 0xb / 0xd) | L1 M1 f64 | `0xfb5420` | sp_01 12, the same test |
| (7, 9) | L2 M4 f76 | `0xfb75f8` | sp_03 0 at the target: setup +0x30 = block +0x1d0, byte +0x40 = 1, +0x2e = block +0x9cc |
| (7, 0x32) | L2 M6 f116 / 148 / 202 | `0xfbb438` | sp_03 11 / 12 / 13 at block + (2000 sin Y, 0, 2000 cos Y) |
| (7, 8) | L2 M48 f108 | `0xfb7408` | sp_11 4 at his point with his words |
| (7, 0x2a) | L2 M50 f138 | `0xfba890` | sp_11 3; Chaotic with P+0x1a2 == 1 makes mode 5 ((7, 0x6b): L4 M28, spec 2.2) |
| (7, 0x52 / 0x58 / 0x59) | L2 M7 f114 | `0xfbbc58` | sp_11 1 |
| (7, 0x5b) / (7, 0x60) | L2 M7 / L2 M37 f114 | `0xfbbc58` | sp_11 2 |

The probe in 0xfbbc58 (`0xfbb93c..0xfbba58`):

- the ray 0x183664 is cast from block + (950 sin Y, 500, 950 cos Y) downward;
- the shell is made only when it hits and block.y - the hit's y < 500.

The modes in mask 0x3870 (4..6, 11..13) take the point ahead. The others, (7, 0x50) modes 8..10, take block +0x1d0.

Frame tests past the clip's end:

- L1 M13 has 63 frames and (2, 0x23)'s test is f90.
- L2 M37 has 27 frames and (7, 0x60)'s test is f114.
- This is NOT the trailing-hold clip bug (board, "Trailing holds are dropped"). The LMT entries agree with the viewer's clips: em071_00_1.lmt anim 13 has numFrames 63 and em071_00_2.lmt anim 37 has 27, both loopFrame -1 (build/frag/motion-audit/lmt.py, 2026-10-19).
- These rows are transcribed as the ROM writes them, and in the viewer their frame test does not pass on those clips.
- The game never fires them either (READ, from the duo agent's rom-map rows):
  - `0x951810`: a layer's length +0x504 is numFrames - 1 (62 / 26). A negative loop frame means hold (bit 4).
  - `0x94ecf0..0x94fca0`: a non-looping layer's frame is held at the length once it reaches it (`0x94f424` / `0x94f354`). The ended bit 2 is raised on that update (`0x94f374`).
  - So the motion's frame never passes 62 / 26, and the f90 / f114 tests cannot pass in the game.
  - The rows stay transcribed. They are not reachable on those clips.

**NOT BUILT, named:**

- (7, 0x50) L4 M1 sp_03 8..10, (7, 0x55) L4 M15 sp_00 1, (7, 0x56) L4 M7 sp_00 2 and (7, 0x64) L4 M30 sp_11 6: Gore's files carry no ShellInfoList entry for those modes, so nothing is made. Those modes are Chaotic's and Shagaru's.
- sp_01 14 ((7, 7 / 0x34 / 0x37) L2 M33, (7, 0x69) L4 M20): ef (999, -1) three times, so it is hit only.
- **Not reached** by the walk: (2, 0xc / 0xd), (3, 0xf / 0x12 / 0x15 / 0x17), (7, 0x5e / 0x5f / 0x61 / 0x67 / 0x69 / 0x6b).

### 1.2 The classes

#### sp_00 (0x12d, base00): the frenzy ball

- **Reader** `0xfc1a44` -> `0xfc1a98` (Gore arm):
  - ef 0..3; hit 0; int 0 is the joint (+0x15dc, 3);
  - +0x15e8 = 4 | (int 1 != -1 ? 1 : 0), so mode 0 takes the X aim from its own point (xAdjust37 under flag 4, clamp -90..90);
  - floats 0..6 go to degX, degY, vz, vy, the flight, X lo, X hi;
  - vec 0 is the offset +0x1610, vec 1 the aim offset +0x1618, vec 2 the gravity +0x161c.
  - The Chaotic (`0xfc1c64`) and Shagaru (`0xfc1e4c`) arms add byte +0x15c1 = 1 for modes 1..2, the hunter-hit stage query.
- **+0x150** `0xfc2034` (READ whole):
  - Modes 1..2 with type 0 / 2: nothing happens and the ball flies on.
  - Type 0 starts ef 1, type 2 starts ef 3. Type 1 starts ef 2 and calls 0xfc2114, which makes modes 1 / 2's sp_11 / sp_01 children; no Gore file has those modes.
  - Mode 0 also calls 0xfc083c at +0x40 with its words. 0xfc05ec is a CLASS effect request (id 1001 through 0x69ed0 after a ground ray): the effects lane's, not a shell.
  - Then 0x3f8970 and the end.

#### sp_01 (0x12e, base01): the bursts and the dust

- **Reader** `0xfc2500` -> `0xfc2554` (Gore arm):
  - ef 0 -> +0x15c8, ef 2 -> +0x15cc, ef 1 -> +0x15d0 (the 0x20 switch's);
  - hit 0; int 0 is the switch's sound (+0x15e8);
  - +0x15ec flags: 4 by int 1, 0x20 and 0x40 by int 3, 0x80 by int 4, 0x800 by int 5, 0x1000 by int 6;
  - float 0 is the timer; vec 0 goes to +0x1608.
  - Chaotic's arm `0xfc26e4` drops int 6. Shagaru's `0xfc284c` adds 8 by int 2 and drops int 6.
- Modes 2..7 are the sp_11 rows' bursts, made with the ground snap (4):
  - the init starts ef 0 (none for modes 2 / 5: (999, -1));
  - the switch at the hit's onset stops it and starts ef 1 (u 152 / 162 / 172).
- Modes 12 / 13 take the owner's-ground path (0x80, the 900 test), ef 0 from the c list (c 31 / c 30).
- Modes 8..11 are mode 3 / 4's row: timers 20 / 6 / 6 / 4.

#### sp_03 (0x12f, base03 with the target arms): the ground lines

- **Reader** `0xfc2ad8` -> `0xfc2b2c` (Gore arm):
  - ef 0 -> +0x15c8; hit 0; int 0 is the joint;
  - floats 0 / 1 / 2 are the fan, the speed and the life; +0x15e8 bits 0x10 / 0x20 by int 1; vec 0 -> +0x1610;
  - **+0x1664** bits: 8 by int 2 (the turn), 4 by int 3 (the timer from the target), 1 by int 4 (the climb path);
  - floats 5 / 3 / 4 / 6 / 7 are the turn rate in degrees a frame (+0x1668), the timer's min / max (+0x166c / +0x1670) and the init's reach above / below (+0x1674 / +0x1678);
  - ef 1 -> +0x1660, the end's.
- **base03's init `0x3fd9d8`, the target arms** (READ):
  - When setup byte +0x40 is set, +0x1640.. = setup +0x30..; otherwise block +0x1d0 + 16 x setup byte +0x2c.
  - Bit 4 (`0x3fdb74..0x3fdc64`) runs after the ground step and before the velocity is remade:
    - the life +0x15fc and the timer +0x162c = clamp((|P - T| + |P.y - T.y|) / the speed, min, max);
    - P is the grounded point. The products are in the order dy, dx, dz (vmul / vmla / vmla).
- **base03's move `0x3fdce4`**: bit 8 calls **the turn `0x3fddcc`** first, before the anchor copy. It runs only while +0x16d0 is 0:
  - the rate is s32(0.5 + +0x1668 x 182.04), and this step's limit is u32(dt x u16(rate));
  - the heading is s32(0.5 + atan2(T.x - x, T.z - z) x 10430.38);
  - if |sxth(heading - Y)| < the limit, Y = u16(heading);
  - otherwise, with d = u16(heading - Y): d < 0x6000 gives Y + the limit, d > 0xa000 gives Y - the limit, and anything between leaves Y unchanged;
  - then the velocity +0x1010 is remade from the words (0x3f95a4: +0x15f8, +0x15f4). +0x1690 is not touched.
- **+0x150** `0xfc30f4`:
  - type 0 ends the shell;
  - type 2 ends it unless the mode is in 0x3f70 and the id is 0x137 (Shagaru), or the mode is 7;
  - any other type returns.
  - base03's 0x3feb38 hands it 0 for every code but 0x11, so it ends as before.
- **+0x154** `0xfc3164`: 0x3fd820 starts ef +0x1660 at +0x40. Modes in 0x3f71 also make a class effect (the effects lane's).
- **ef 0 starts at base00's point** (0x3f9298, inside base00's init): the joint's point plus the offset, before base03's ground step.

#### sp_11 (0x130, base11): the rows

- **Reader** `0xfc333c` -> `0xfc3384` (Gore arm):
  - ef 0 -> +0x15c8 (the init starts it at its point); hit 0;
  - flag 4 by int 1 (the ground snap);
  - vec 4 -> +0x1608, the init's offset (turned by the words);
  - the count is int 0 and the times are float (k + 4).
- **+0x168** `0xfc38b8(shell, k)` (READ whole):
  - the step's Y word is Y + u16(s32(0.5 + float k x 182.04)), and vec k is turned by it to give o;
  - by mode (the table at 0xfc399c):

| mode | what it makes |
|---|---|
| 0 | sp_03 7 (no Gore file) |
| 1 | sp_01 [2, 3, 4][k] at +0x40 + o, and for k >= 1 a second one at o turned a half turn (x' = -x + z x -8.742278e-8, z' = -z + x x 8.742278e-8: the literals 0xfc3f48 / 0xfc3f4c, vnmls) |
| 2 | sp_01 [5, 6, 7][k] |
| 3 / 4 / 5 | sp_01 [8, 9, 10, 11][k], then the sp_11 itself moves by o |
| 6 | sp_01 [15, 16, 16, 16][k] |

  - The children take the words (X, the step's Y, Z) and +0x3c = 0xffff.

### 1.3 Viewer

- docs/render/shells.js: SHELL_DATA.em071_00 (code 'em071', spawn071 / act071).
- New functions: params071s00 / landing071s00, params071s01 (READERS01[0xfc2500]), params071s03 / make071s03 / timer03 / turn03 (READER03), params071s11 / create071s11 (READERS11[0xfc333c], CREATE11).
- base03's init03 / move03 / stepBolt take the Gore k fields (fromTarget, turn, ef1660). The other base03 readers leave them unset, so Khezu and Duramboros are unchanged.

### 1.4 Check

dev/shells-gore-check.mjs (generated by fb/mk071spec.py) passes 17/17:

- the ten cases;
- the contract;
- six controls: the facing, the aimed ball's target, the turning line's target, the floor, the probe's floor, joint 3.

The page check passes 4/4 (L2 M52 shell00, L2 M6 shell03, L2 M48 shell11, L1 M1 shell01).

Harness note: an sp_11's first children are made while the sp_11 is the LAST unit of line 18. The child is not moved that step, but its hit slot is counted, so its slot life is one move less (the module's slot order, INFERRED: slotStep).

Records: the u / c keys the shells play are not exported yet. Recording is to be requested.

## 2. Chaotic Gore Magala (em071_05, variant 5): the deltas

Ids 0x131..0x134. His c list is em071_00c (Gore's). The census (fb/cen11_gore5.txt) matches Gore's, except that (7, 0x32) makes sp_03 modes 4 / 5 / 6. The walk also reaches (1, 0x15..0x17) and (7, 0x67 / 0x69..0x6e). Of those, only (7, 0x67) and (7, 0x6b) make a shell.

### 2.1 The readers by id (read side by side, fb/armdiff.py)

- **sp_00** `0xfc1c64`: Gore's fields, plus byte +0x15c1 = 1 for modes 1..2 (the hunter-hit query; not visual).
- **sp_01** `0xfc26e4`: Gore's flags without the 0x1000 of int 6.
- **sp_03** `0xfc2d60`: Gore's ints, but the floats move:
  - floats 8 / 6 / 7 go to +0x1668 / +0x166c / +0x1670 (turn, timer min, timer max);
  - floats 3 / 4 go to +0x1674 / +0x1678 (reach above / below).
- **sp_11** `0xfc3540`: vec 8 is the init offset, and the times are float (k + 8).

### 2.2 What his files add

**sp_00 modes 1 / 2, the falling balls:**

- (7, 0x55) L4 M15 f30 makes mode 1 and (7, 0x56) L4 M7 f64 makes mode 2.
- Both come from the zero setup: joint 3, no aim (int 1 -1), with gravity.
- Their landing 0xfc2034 keeps flying on types 0 / 2. On type 1 (the floor) it calls **0xfc2114** first, then starts ef 2.

**0xfc2114(shell, &contact, &result)** (READ whole):

- Mode 1 makes sp_11 mode 0; mode 2 makes sp_01 mode 0. Both are at the contact, with the GOT zero vector at +0x20.
- The words:
  - +0x30 = u32(asinf(n.z)) and +0x38 = u32(acosf(n.y / sqrt(n.x² + n.z²))). These are the radians converted as they are, with no scale: both are 0 on a floor.
  - +0x34 = the heading from the contact to +0x1640 (base00's target copy, block +0x1d0).

**sp_11 mode 0, through the create 0xfc38b8:**

- At 150 frames it makes three **sp_03 mode 7** lines, fanned -25 / 0 / 25 degrees, from a 0x50 setup built by 0x3fd7e0:
  - id e+0xcacc, the point at +0x10, the words at +0x20;
  - byte +0x2c 0 and byte +0x40 0 (the target is block +0x1d0);
  - +0x2e = the shell's +0x1588.
- sp_03 mode 7 has int 1 = 0, so +0x15e8 gets 0x10 | 0x20. That is **base00's request arm**: the setup's point and words (shells.js init03r). It has no turn or target timer, and takes the follow path.

**sp_11 mode 6, (7, 0x64) L4 M30 f124** (0xfbc4ec, READ):

- A ray (mask 0x40) is cast from block + (950 sin Y, 0, 950 cos Y).
- A hit within 500 below him makes sp_11 6 **at the ground point** with his words.
- Its create makes sp_01 [15, 16, 16, 16, 16, 16, 16][k]. Table 0x16a15b8 is read through its seven entries.
- The same action then zeroes the counter C+0x84 (`0xfbc83c`).

**Other rows:**

- sp_03 8..10 at the target: (7, 0x50) L4 M1 f104 / 138 / 192.
- sp_11 2: (7, 0x67) L4 M22 f160, with Gore's ray probe.
- sp_11 3 / 5: (7, 0x6b) L4 M24 / L4 M28 f138.

**(7, 0x2a) / (7, 0x6b), 0xfba890:**

- They make mode 5 instead of 3 when P+0x1a2 == 1 (Chaotic only).
- **(7, 0x6b)'s phase 0 writes it (READ, 0xfba538..0xfba5a4):** the turn to the target is u16(s32(0.5 + atan2(T.x - x, T.z - z) x 10430.38) - Y).
  - Below 0x8000 he plays L4 M24 and sets P+0x1a2 = 0.
  - Otherwise he plays L4 M28 and sets P+0x1a2 = 1.
  - So the clip names the mode: L4 M24 makes mode 3, L4 M28 makes mode 5 (mode 5's floats -90..-150 mirror mode 3's 90..150). Both rows are built.
  - The emulator pair k6b28 / k6b24 (the target on each side) makes mode 5 / mode 3.
- **(7, 0x2a)** (r1 0) does not write the byte. Its value is whatever the action start leaves; the generic reset site of P+0x1a1..0x1a3 is NOT READ (0x768c8 / 0x76098 store none of them). Mode 3 is built.

### 2.3 The footfall dust, 0xfb700c

**0xfb700c(e, joint, frame s0, x s1, z s2)** (READ whole):

- The frame test runs alone (0xb0974).
- The point is the joint's position (0xc164c), or block +0x40 for joint 0, plus (x cos Y + z sin Y, 0, z cos Y - x sin Y), where Y is the block's word +0x54.
- The ray 0x183664 is cast down from that point.
- A hit with block +0x44 - the ground < 1000 makes sp_01 (e+0xcac8) mode 1 at (x, the ground, z), with zero words (rodata 0x1620e60).

**The callers' gates** (0xfb63d0, 0xfb826c, 0xfb8628, 0xfb8a50, 0xfb8eac, 0xfbad04 and 0xfbc0e8):

- First, the quest rank 0x3a8430 must be >= 5. The control at rank 4 makes no call.
- Shagaru (em 0x48, variant 0) then always calls it.
- Chaotic (em 0x47, variant 5) calls it only with **C+0x84** at or past all three tiers of table 0x16a1294[rank class]:
  - the tiers are 5000 / 10000 / 20000 for every class;
  - the class is 2 for rank 4..6, 1 for rank 2..3, and 0 otherwise.
- Gore (variant 0) has no mode 1 in his files.
- The census found none of Chaotic's calls, because its control block was zero. fb/ff071.py found them with C+0x84 poked: 15000 gives none, 20000 gives them.

**C+0x84, the counter: HUNTER-DRIVEN** (vt+0x1dc 0xfae824, READ; the hunter-side getters' meanings INFERRED):

- Every frame, while he is aware (P+0x2c0 == 1) and this machine owns him (e+0x7420), two passes add to it:
  - **The record list (0x5ba10, slots 0..3):** for each entry in his area (+8 == e+0x1054), it adds a one-off amount by the count C+0x118 (0, 1, 2: 500 / 1500 / 2500 from table 0x16a138c, a second table when the entry's +4 != 0xf, a default past 2), then C+0x118 += 1.
  - **The hunters (0x276290, players 0..3):** for each hunter active (vt+0x88), not excluded by 0x49184 on its +0x1051, and in his area, it adds dt x rate.
    - The rate is table 0x16a12c4[0x2f51f8(hunter)] (0.2 / 1.0 / 1.7 / ...), x 1.2 with P+0x5cb6 == 1.
    - It is x 1.8 when his HP ratio P+0x370 / P+0x374 is under 0.3.
    - With the hunter's state bit 0x10000000 (vt+0x1b4) it adds dt x 4 (4.8 with P+0x5cb6), on the same HP rule.
  - Then it is clamped to a rank cap (table 0x16a1530[rank], Chaotic's own pair at 0xfaedf4).
- **vt+0x1d8 0xfad688** (the start, READ): it clears it to 0. With P+0x5cb6 == 1 (Chaotic) it starts at **20000.0**, with C+0x83 = 1 and C+0x82 = 1.
- (7, 0x64) clears it at the end (0xfbc83c).
- **So it measures hunters' presence and activity in his area over time.** It is hunter driven, not a time or state the viewer can step. The viewer takes it as **input.gauge071** (default 0): a control for Raven.

**Chaotic's rows**, one call each at the top tier:

| action | clip, frame | [joint, x, z] |
|---|---|---|
| (7, 7 / 0x34 / 0x37) | L2 M33 f60 | [0, -290, 1420] |
| (7, 0x69) | L4 M20 f94 | [0, -290, 1420] |
| (7, 0x1a) | L2 M28 f1 | [0, 300, 1400] |
| (7, 0x1c) | L2 M31 f65 | [0, -800, 2400] |
| (7, 0x1e / 0x36) | L2 M29 f1 | [0, 300, 1400] |
| (7, 0x2f) | L2 M25_start f1 | [73, -300, 2400] |
| (7, 0x30) | L2 M57_start f1 | [73, -300, 2400] |

### 2.4 Not built, named

- **(7, 0x1e / 0x36), phase 2:** it replays L2 M29 with its own points: Chaotic's [0, -600, 1800], and Shagaru's [0, -600, 1650] and [0, 500, 1800]. The viewer's clip is phase 1's.
- **The scatter (vt+0x1dc 0xfae824 -> 0xfaf0ac; READ, BUILT 2026-10-19 for Shagaru: shells.js scatter071):** a two-minute shower of sp_01 1 after (7, 0x53).
  - **Start:** vt+0x204 0xfadfa0 on the status-7 action (7, 0x53) (0xfae188), for every em of the line (only Chaotic's and Shagaru's files have sp_01 1). Shagaru's (7, 0x53) plays L4 M2 -> M11 -> M12. It sets:
    - C+0xd4 = 1 and the life C+0xf4 = 7200;
    - the centre C+0xe0.. = his block point;
    - the seed C+0xf0 = e+0x73e8 (halfword), the count C+0xf2 = 0, the first wait C+0xf8 = 240.
  - **Each frame with C+0xd4 == 1 and the wait C+0xf8 run out** (0x7206c), one sp_01 1 is made:
    - X = ((f0 x f2 x 37) mod 3000) - 1500 and Z = (((f2 x 13 + 39) x f0) mod 3000) - 1500 (u32), added to the centre, at y = the centre's + 1000 (0xfaf2fc);
    - at quest rank >= 5, on every fourth (f2 & 3 == 0), 0xfaf54c instead gives hunter (e+0x73e8 & 3)'s x / z in his area. With no such hunter it gives the same two values, NOT added to the centre, with y 1000;
    - then the ray down, block +0x44 - h < 1000, and sp_01 1 at (x, h, z); f2 += 1, and the wait = 90.
  - **Any other action start while it runs** re-centres it on him and reseeds it from e+0x5fc0. The state becomes 2 for status 10 / 11: it makes no more, and the life runs on.
  - **The life C+0xf4 running out** returns it to state 0.
  - **Built** (render/shells.js scatter071, D.scatter071 on SHELL_DATA.em072_00):
    - It starts at the (7, 0x53) row's start (L4 M2, pick 'always'). The Special entry 'S. Motion 2 Scatter' (render/monster.js ROM_ANIMATIONS.em072_00) plays L4 M2 -> M11 -> M12. Those motions are the same action, so they continue it; any other fresh play re-centres and reseeds it.
    - The action-start status of a play with no row is taken as 7 (state 1). Status 10 / 11 come from a row.
    - The seeds (2026-10-19, revised): the scatter's own named stand-ins H73E8_SCATTER071 (0x2b67, the e+0x73e8 that (7, 0x53)'s start reads -- the action setter's draw, rewritten at every action change, so a scatter-local stand-in is no less faithful) and H5FC0_STANDIN (0x6d15, the reseed's e+0x5fc0, writer NOT READ). The shared H73E8_STANDIN (0) is unchanged. With seed 0 every offset was (-1500, -1500); now the bursts spread as the ROM's LCG spreads them for those seeds, the same on every play.
    - It ticks from the start's own frame (vt+0x1dc before the action main: INFERRED order).
    - Chaotic's (7, 0x53) has no clip (em071_05_4.lmt: no entries 2 / 11 / 12), and Gore's files have no sp_01 1.
  - **Check** (dev/shells-shagaru-check.mjs ksc; e+0x73e8 poked to 0x2b67 for the ROM run): the emulator runs vt+0x204 0xfadfa0 (7, 0x53), then vt+0x1dc 0xfae824 once per module step, 7870 steps:
    - all 78 shells (240 + 90 k up to the 7200 life) match, each flown 700 moves;
    - controls: his point 30 aside, and rank 4 (every fourth then at the centre);
    - harness stubs for the run: 0xc8280 (the hunter hit-data row), 0xc6d58 (the target slots), 0x276290 / 0x27482c (no player), 0x49710; the countdown 0x7206c native (unstub); the .dtp parts array (dtp).
- **sp_01 14:** hit only.

### 2.5 Check

dev/shells-chaotic-check.mjs (generated by fb/mk071x.py em071_05) passes 27/27:

- 17 cases (k6b28 / k6b24 added for the side branch);
- the contract;
- 9 controls: the children's target, the floor, the facing on the L4 M1 lines, joint 3, the dust's facing, rank 4, the counter at 19999, the (7, 0x64) floor, and the facing on the lines ahead.

The page check passes 4/4.

Harness:

- The emulator stubs 0x49710, the area query. Its global manager is not built in the harness, and the helper takes only the ray mask from it.
- The first child of a last unit gets a hit-slot life one move shorter, as in 1.4.

## 3. Shagaru Magala (em072_00: em 0x48 on uEm071_00): the deltas

Ids 0x135..0x138, c list em072_00c. Lists 0..3 are Gore's (shared), and list 4 is his own. The census was run with FB_EM=72 (fb/cen11_shag.txt).

### 3.1 The readers by id

- **sp_00** `0xfc1e4c`: as Chaotic's.
- **sp_01** `0xfc284c`: adds 8 by int 2, the ground angles after the snap (none of his modes sets int 2). No 0x1000.
- **sp_03** `0xfc2f94` (READ whole):
  - ef 0; hit 0; joint int 0;
  - floats 0 / 1 / 2 are the fan, speed and life;
  - +0x15e8 gets 0x10 and 0x20 by int 1; vec 0; ef 1 -> +0x1660;
  - floats 3 / 4 go to +0x1674 / +0x1678;
  - **no +0x1664 bit**: no turn, no target timer, the follow path, no slope step.
- **sp_11** `0xfc36fc`: Gore's.

### 3.2 His rows

His rows are Gore's and Chaotic's where his files carry the mode:

- (7, 0x2c), the slam dust, (7, 0x50), (7, 8), the L2 M7 rows, and (7, 0x55) / (7, 0x56) with their landing children.
  - (7, 0x55)'s end point (shells agent, 2026-10-20). Its landing's sp_11 0 makes three sp_03 7 lines at 150 frames. Each runs straight at speed 35 for its life of 300 frames, which is 10,500 from the burst, and starts **u 124** there: ef 1, at +0x154 0xfc3164. k55 matches it move by move and start by start. The draw survey's far point (-9130, 25146) is that end point plus his travel over the survey. A stage contact (+0x150 type 0) would end a line sooner; the viewer has no stage.
- 0xfba890 makes nothing for em 0x48, so there is no (7, 0x2a) or (7, 0x6b).

**NOT BUILT, named:**

- (7, 9) sp_03 0, (7, 0x32) sp_03 11..13 and (7, 0x64) sp_11 6: his files have no such modes.
- (7, 0x69)'s two at L4 M20 f60: em072_00_4.lmt has no entry 20 (READ with build/frag/motion-audit/lmt.py).

### 3.3 The footfall dust

Always at rank >= 5. Two calls at one frame keep the callers' order, by call site.

| action | clip | frame: [joint, x, z] |
|---|---|---|
| (7, 7 / 0x34 / 0x37) | L2 M33 | f60: [0, 290, 1350], then [0, -290, 1420] |
| (7, 0x19 / 0x35) | L2 M27_start | f1: [0, 0, 1200] |
| (7, 0x1a) | L2 M28 | f1: [0, 500, 1300], then [0, -600, 1150] |
| (7, 0x1b) | L2 M30 | f1: [63, 0, -1800], then [63, -700, -1900] |
| (7, 0x1c) | L2 M31 | f25: [0, 900, 1200]; f65: [0, -800, 2400] |
| (7, 0x1e / 0x36) | L2 M29 | f1: as (7, 0x1a) |
| (7, 0x2f / 0x30) | L2 M25_start / M57_start | f1: [73, -300, 2400]; f16: [63, 800, 2200] |
| (7, 0x5a) | L4 M13 | f1: [63, -200, 700], then [63, -800, 600] |

### 3.4 Check

dev/shells-shagaru-check.mjs (generated by fb/mk071x.py em072_00) passes 22/22:

- 12 cases (ksc: the scatter's whole life);
- the contract;
- 9 controls, including rank 4, joint 63 and the scatter's two.

The page check passes 5/5 (with L4 M2: the scatter's first burst).

The page check passes 4/4.

## 4. Soaks and a runtime fix (2026-10-19)

The live soaks (scratchpad soak_locked.sh, after the one lift) all show 0 refused: em058_00 38 motions, em086_00 100, em071_00 107, em071_05 120, em072_00 110.

Two refusals in the first run were fixed:

- **render/rom/effect/schedule.js scaleOf.** A shell whose init starts nothing (the Gore line's sp_01 2 / 5: ef 0 (999, -1), the first effect being the 0x20 switch's) has no sh.start. Its parent's ShellScale is now the first start's requester, kept as sh.scale0 for later moves. Before the fix, "Cannot read properties of null (reading 'requester')" on L2 M7 / L4 M30.
- **Chaotic's and Shagaru's shell11 hitdata** ([[0, 999]]) was missing from SHELL_DATA. The fix is in ins071b.py too.

## 5. What the checks prove, and the GPU draws (2026-10-19, corrected the same day)

The checks and soaks prove that a shell is made where and when the ROM makes it, and that its effects START (soaks: 0 refused). They do not prove what the viewer draws; that is the effects lane's draw-level instrument.

**"0 GPU draws" in a recorder log is NOT "draws nothing"** (READ: efx/vecdrawsched.py 125..215). The count is the snapshots of one routine, the indexed GPU draw 0x890ce0 that the sGpuParticle record A / E draws (0xb918c4 / 0xb978cc) end in. Every other generator kind draws through other routines the recorder records and the lift lifts:

- genType-2 0xa996c8;
- the CPU particle path 0xa7b7a0 -> 0x8827e0;
- polylines 0xab5090 / 0xab4f64;
- prims 0xc8cdb0 / 0xbab558.

The many clip sets that log 0 do so too: Gore's u 200..u 262 and c 3000, Rathian's c 30 / c 32.

**Tally** (<scratchpad>/fb/drawtally.py, the call counts of each kind's draw routines per set):

- All 136 shell sets of these lanes call draw routines.
  - Most Gore line sets go through the CPU particle path: em071_00u 0 1560 calls, u 150 1200.
  - Gore's u 90 / u 181 use genType-2 (300).
  - Valstrax's u 500 is the one using sGpuParticle (A 98, E 159). That is why it alone logged GPU draws.
- Alatreon's u 211 (the case Raven saw empty) records 320 CPU particle draws, the same path as Gore's clip effects. So its recording is not empty.
- A set with only prim / other calls (Gore's u 152 / 162 / 172 and c 30 / 31 (cm200_040), u 501, u 123, u 60, Shagaru u 0) has no generator draw. Whether those draw anything visible is open, as it is for the clip sets of the same shape (u 200, u 233).
- So the recorder side is not the cause. If the viewer shows nothing for them, the gap is in the viewer's run of a SHELL request: the requester / parent / placement it builds. That is the effects lane's instrument to measure.

Control and test sets: efx/vectors/exp_shellstyle_c30seq (cm202_020: gpuA 119, gt2 49), exp_shellstyle_u0_psl and exp_u0_req (em071_00_007 with psl notices / with a shell requester: CPU particles 780, gpuA 0). None is on the lift line.
