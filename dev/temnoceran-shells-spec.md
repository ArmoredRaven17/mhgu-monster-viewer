# Temnoceran -- the shells: Nerscylla (em070_00)

Shells agent, 2026-10-18. Read from the ROM and transcribed in `docs/render/shells.js` (the NERSCYLLA block). Checked by
`dev/shells-nerscylla-check.mjs`: 24 / 24 against the ROM's own runs, with every control failing, and the page check
10 / 10. The scratchpad tools named below live in the shells agent's scratchpad `fb/`.

## 1. The classes

vt+0x158 0xfab380 registers four shell ids, all immediates:

| id | class | base | reader | landing (+0x150) | resource |
|---|---|---|---|---|---|
| 0x129 | sp_00 | base00 | 0xfac410 | 0xfac5e8 | 0x8a7c |
| 0x12a | sp_00_02 | base00 | 0xfac844 | 0xfac9e4 | 0x8a7d |
| 0x12b | sp_01 | base01 | 0xfacc70 | -- | 0x8a7e |
| 0x12c | sp_13 | base13 | 0xface88 | 0xfad064 | 0x8a7f |

Their vtables are 0x17e3ba0 / 0x17e3d1c / 0x17e3e98 / 0x17e4008.

Every maker reads a **rank tier** from 0x3a8430: rank >= 5 gives tier 2, rank >= 2 gives tier 1, anything lower tier 0.

## 2. The makers

The census (cengen11, all 16 statuses) and the drip query (fb/drip070.py, which runs with the countdown 0x7206c answered)
found these. The phases' clips were checked with fb/motqx.py, which hooks every setMotion-family setter. Each action's
phase 0 sets the clip and phase 1 makes its shells on it.

| action | clip | frames | what is made | site |
|---|---|---|---|---|
| (7, 4) | L2 M41 | f20, f42 | sp_00, one per frame (the kind rule below) | 0xfa51f0 |
| (7, 7 / 9) | L2 M31 | f6 | sp_00 15 / 16 / 17 | 0xfa5d44 |
| (7, 0x32) | L2 M13 | f36 / f52 / f66 | sp_00 18 + 3 tier + i | 0xfa745c |
| (7, 0x34) | L2 M57 | f64 / f82 / f96 | sp_00 27 + 3 tier + i | 0xfa7b98 |
| (7, 5) | L2 M57 | f66 / f82 / f98 | sp_13 3 tier + i | 0xfa5814 |

**(7, 4)'s kind rule.**
- Kind 1 makes the tier's mode: 0 / 5 / 10.
- Kind 2 makes the tier's mode + 1 + (e+0x73e8 & 3).
- At f20 the kind is 1 when P+0x1a2 == 0, else 2; at f42 it is the other one.
- P+0x1a2 = e+0x73e8 & 1, written at phase 0 (0xfa5100).
- e+0x73e8 is the action setter's draw. It is not read, so it is held at the named stand-in H73E8_STANDIN = 0.

**The (7, 5) turn word.** It reads 0xe39 / 0xf1c8 / 0, but its sin / cos results are never used (0xfa5788..0xfa58cc).

**The DRIP (sp_00_02), 0xfa280c.**
- It runs in phase 1 of status 3's walks:
  - 0xfa2610 on L0 M8: (3, 0xc / 0xd / 0x1a / 0x1b);
  - 0xfa2930 on L0 M6: (3, 0xe..0x19).
- It is skipped while P+0x3b5 bit 5 is set. That bit is P+0x3b4 0x2000, which vt+0x1dc 0xf9d350 sets when the Back (part
  1) reaches its .dtp bytes 5 / 6. The viewer reads it from the parts: input.back070 (motion-states.js nerscyllaBack070).
- Otherwise it counts down [e+0xcac0]+0x90 through 0x7206c. Phase 0 sets that count to 20.0; each drip sets it back to
  40.0.
- Each drip makes mode (rank > 4 ? 1 : 0).

**sp_01 mode 8** (0xfa055c, behind `bleq` from 0xfa0414 / 0xfa0c10 / 0xfa33ec / 0xfaaed4) is a hit volume with (999, -1)
and draws nothing. Named, not built.

## 3. The readers and landings

**sp_00, reader 0xfac410:**
- ef 0 / 1 / 2 -> +0x15c8 / +0x15d4 / +0x15cc; int 0 is the joint (144; 0 for modes 15..17).
- vz = float 0 (45), the flight = float 1 (250); the X clamp = floats 2 / 3; degY = float 4.
- vec 0 is both the offset and the aim's from-vec; vec 1 is the aim offset.
- Flags 0x84, plus 1 (the X aim) when int 1 != -1, plus 0x800 when int 2 == 0 (base00 never tests 0x800).
- +0x15c2 = 1, so the stage query's mask is 0x10.
- vy, degX and the gravity keep the ctor's 0.

**sp_00's landing 0xfac5e8:**
- It starts no contact effect.
- Type 1 makes sp_01 [0x16a1120][mode] (0 / 1 / 2); type 0 makes [0x16a11b0][mode] (3 / 4 / 5). The setup carries the
  contact, the zero vector, the shell's words and +0x13dc.
- Then the end.

**sp_00_02, reader 0xfac844:** degX = float 1 (90), degY = float 0, vz / vy = floats 2 / 3, the flight = float 4 (72). The
offset is vec 1 and the gravity vec 0 (-0.625). Flag 0x800 when int 1 == 0.

**sp_00_02's landing 0xfac9e4:**
- Type 1 only: sp_01 6 / 7 by the mode.
- When the block's +0x2c0 == 1 (P+0x2c0 is the awareness: he is aware) it first calls 0xac030(e, &contact, 15, 1). **READ
  (2026-10-18): a SHINY DROP.**
  - 0xac030 returns at once while the global's +0x32 is set. It needs 0x71284 (or P+0x5d54 >= 1, the drops left), and a
    draw (0x49634 % 100) under the chance, 15 here.
  - It finds a free drop slot P+0x5d3c / +0x5d40 / +0x5d44 (-1 free, or its timer +0x5d48.. run out). Variant byte
    0x54 / e+0xb5f7 changes the pick.
  - It allocates a unit from the manager [0x1882da0]: the gathering / carve point manager that Savage's tail carve point
    registers in too (tail-option-em043.md 6). It fills the unit from his drop table (e+0x7634 + 4 x 0x498e4(1), rows
    from +0x68; vt+0x254 and 0x5c8b4 adjust the row).
  - It places the unit at the point and gives it a life of 3600 frames, or 7200 with P+0x1a8 bit 0.
  - It registers the unit (0x31a3ec), stores its id and life in the slot, and decrements P+0x5d54.
  - It makes no effect request and no shell. The viewer has no gathering points, so nothing is built.

**sp_01, reader 0xfacc70:**
- ef 0 / 1 -> +0x15c8 / +0x15cc; float 0 is the timer (0).
- Flags: 8 when int 1 != -1, 4 when int 2 != -1, 0x1000 when int 0 == 0; int 0 -> +0x1610.
- So modes 0..2 / 6 / 7 snap to the ground and take its angles; modes 3..5 do neither.

**sp_13, reader 0xface88:**
- speed 11.25 + 0.0125 per unit, gravity -0.75, near 300, far 2000, life 180.
- vec 0 holds both points (0, 250, 0); vec 2 -> +0x1630, the velocity's turn of 0 / -20 / +20 degrees about Y (0x404984,
  turnDeg065).
- +0x15c2 = (mode <= 8) ? 0xfab5c8(owner) : 0. 0xfab5c8 tests quest map 13 with area byte 7, and the viewer has no quest
  map, so the mask is 0x30.

**sp_13's init** takes base13's owner path with flags 0: no size; the thrown point is Khezu's arm (the distance clamped
[near, far] along the aim from the shell, at the target's height). The launch's velocity is turned toward that point by
the Y word, then by +0x1630.

**sp_13's landing 0xfad064** (no state test, no contact start):
- Type 1 makes [0x16a1240][mode] = {0, 0, 0, 0, 0, 0, 2, 2, 2} -- as read.
- Type 0 makes [0x16a1270][mode] = {3, 3, 3, 4, 4, 4, 5, 5, 5}.
- Then the end.

## 4. The check

**The cases:**
- (7, 4) at rank 5 / 3 / 1, with a turned facing and a resized owner;
- (7, 7) at rank 5 and rank 1 (X-aimed down);
- (7, 0x32) and (7, 0x34);
- (7, 5) at three ranges;
- the drip on L0 M8 and on L0 M6 at rank 5 and rank 3.

**The controls**, all of which fail: the facing, the target (the balls and the X aim), the floor (the landings' children),
and the rank (the spits and the drip).

**The harness change: the .shl's own file map** (fb/shlmap.py, used by emu_fb.load_mon). sp_00's .shl points modes 1..4 at
mode 0's ef and hit files, 6..9 at 5's and 11..14 at 10's, so a lookup by file number found nothing for them. The ROM run
had started no flight effect for those modes. The .shl's map now fills them in. It logs any mode whose numbered file
disagrees; none did for the monsters loaded here.

**The Back gate, checked (2026-10-18):** drip_back2 (P+0x3b5 = 0x20 / back070 2: no drip, in both runs) and drip_back1
(0x40 / back070 1: it drips). The control (back070 1 against the ROM's 0x20) fails. emu_fb writes BLOCK+0x3b4 (the sever
halfword) after a case's `block_bytes`, so the bit is set through `block`, which is written last (rom-map trap 91). The check
is now 24 / 24.
