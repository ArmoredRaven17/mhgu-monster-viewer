
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
- sp_11 3: (7, 0x6b) L4 M24 f138.

**(7, 0x2a) / (7, 0x6b), 0xfba890:**

- They make mode 5 instead of 3 when P+0x1a2 == 1. Phase 0 clears that byte on one path (0xfba710), and its writer before the action is NOT READ.
- Mode 3 is built.

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

**C+0x84, the counter:**

- Its writers are not transcribed:
  - the per-frame 0xfae824..0xfaee44 accumulates and clamps it;
  - 0xfadc58 sets it to 20000.0 (with +0x83 = 1);
  - the (7, 0x64) action resets it.
- The viewer takes the value as **input.gauge071**, default 0, so Chaotic's dust does not show by default.

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
- **The per-frame maker 0xfae824 at 0xfaf0ac:** it scatters sp_01 1 around him from C+0xf0 / +0xf2, with an LCG mod 3000 - 1500. Its gates (C+0x82, the counter) are NOT READ.
- **sp_01 14:** hit only.

### 2.5 Check

dev/shells-chaotic-check.mjs (generated by fb/mk071x.py em071_05) passes 25/25:

- 15 cases;
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

dev/shells-shagaru-check.mjs (generated by fb/mk071x.py em072_00) passes 19/19:

- 11 cases;
- the contract;
- 7 controls, including rank 4 and joint 63.

The page check passes 4/4.
