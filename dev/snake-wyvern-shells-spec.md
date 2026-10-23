# Snake Wyvern -- the shells: Najarala (em068_00)

Shells agent, 2026-10-18. Read from the ROM, transcribed in `docs/render/shells.js` (the NAJARALA block, base36), checked
by `dev/shells-najarala-check.mjs` (30 / 30 against the ROM's own runs; page 12 / 12). Scratchpad tools named below live in
the shells agent's scratchpad `fb/`.

## 1. The scales (sp_36 0x126, base36) and their blast (sp_01 0x125 mode 2)

Both ids are immediates: `movw #0x126` in the maker 0xf7a4bc, `movw #0x125` in base36's blast (0x41a3f8). Resources 0x8a78 /
0x8a79. sp_36's vtable 0x17e0d58.

### 1a. The owner's side (uEm068_00)

`[e+0xcac0]` is P+0x60 (the class ctor, 0xf795ec). It holds four slot handles at +4..+0x10, a one-frame RING broadcast
(+0x14 the mode, +0x16 an id from 0x16b4b4, +0x20.. the centre, +0x30 the radius) and, at P+0x1bb, two retire marks per
slot (slot k: bits 2k, 2k+1).

**The maker 0xf7a4bc(e, type, count).** Free = 4 minus the occupied slots; count > free makes nothing (all or none). The
mode lists by type: 0 [0, 1], 1 [2, 3], 2 [4, 5, 6, 7], 3 [8], 4 [9] (after 0xc460c, the target choice), 5 [10]. The first
`count` modes of the list go into the empty slots 1..4 in order. Each setup (0x418fd0, 0x1c bytes): +4 0x126, +8 the mode,
+0xc the owner, +0x10 the slot index (0..3), +0x14 the occupied count + 1 (its ORDER), +0x18 a u16 from 0x16b4b4 (the hit
group; not visual). So type 2 with count 2 makes modes 4 and 5 only: 6 and 7 are never made.

**Its callers.**
- vt+0x204 0xf79d60, the action start. Its status table 0xf79d8c and the status-7 table 0xf79df4 (decoded, fb/jt068.py):
  (7, 0x17) type 0 x 2, (7, 0x1c) type 1 x 2, (7, 0x22) type 2 x 2, (7, 0x24) type 3 x 1. All four play L2 M60 (fb/motq068.py).
  (7, 0x26 0x27 0x29 0x2a 0x2b 0x2c 0x2e 0x34 0x36 0x38 0x3a 0x3c 0x3d) go to 0xf7ab50, the retire.
- In the actions, each behind 0xb0974 and not while tired (0x81614): (7, 0x26 / 0x3c / 0x3d) L2 M62 f32 type 4 x 1
  (0xf813f4) and f68 type 5 x 1 (0xf81454); (7, 0x27) L2 M63 f104 type 0 x 2 (0xf82b34). Census: fb/cen11_em068_*.txt.
- The census (cengen11) never runs vt+0x204 (trap 87), so the four L2 M60 throws were found by decoding its jump tables.

**The retire 0xf7ab50.** It runs only when rank (0x3a8430) >= 5 and all four slots are full. Per slot: ORDER < 3 sets
its marks to 3 and empties the slot; otherwise ORDER -= 2. The only other writers of P+0x1bb are the class ctor
(0xf79620 / 0xf798e8: 0) and 0xf88000 (it clears one slot's marks). **Mark 2 is never set**, so base36's mark-2 blast arm
cannot be reached from this class.

**The ring writers** (fb/cenring068.py: every action of all 16 statuses, each frame literal answered alone, with the block
writes hooked; the centre confirmed by poking P+0x40, fb/ctrq068.py). For mode 1 the centre is the block point P+0x40. Every
writer is at variant 0 only (e+0xb5f5).

| action | clip | frame | radius | site |
|---|---|---|---|---|
| (1, 0 / 0x16) | L0 M50 | 190 | 5000 | 0xf7b794 |
| (2, 0x1e / 0x4a) | L0 M27 | 35 | 2500 | 0xf7cba4 |
| (2, 0x1f / 0x4b) | L0 M28 | 30 | 2500 | 0xf7cba4 |
| (2, 0x44) / (2, 0x45) | L0 M138 / M139 | 30 (phase 2) | 2500 | 0xf7d2f4 |
| (2, 0x46) / (2, 0x47) | L0 M138 / M139 | 30 (phase 2) | 2500 | 0xf7da14 |
| (7, 0x18) / (7, 0x1a) | L2 M61 | 140 / 138 | 3500 | 0xf8297c |
| (7, 0x1e / 0x25) | L2 M70 / M73 / M71 (block +0x44 0-1 / 2 / 3, 0xf806fc) | 50 (phase 2) | 2500 | 0xf80780 |
| (7, 0x1f / 0x28) | L2 M74 | 50 (phase 2) | 2500 | 0xf82ce0 |

**Where (2, 0x44..0x47)'s phase 2 begins.** These actions run through two helpers, 0xf7d11c(e, side, ring) and 0xf7d86c(e, side,
ring, ..). Phase 2 is not reached from phase 1: phase 1 goes on to phase 3 when it ends. It is chosen at the action's start, in
phase 0 (0xf7d43c.. / 0xf7db70..), and only when all three of these hold:
- the ring argument is 1;
- a scale is out (one of [e+0xcac0]+4..+0x10 is non-zero);
- the turn word from the block's +0x44 / +0x48 is under 0x2000.

Phase 2 then plays L0 M138 (side 0: (2, 0x44 / 0x46)) or L0 M139 ((2, 0x45 / 0x47)) and rings at f30. When phase 2 ends, phase 3
plays L0 M105 / M104 / M115 / M114. With no scale out, phase 0 goes straight to phase 3 on those same clips; a wide turn goes to
phase 1 (L0 M108 / M118). Neither of those paths rings. Emulated (fb/ph2q068.py): phase 0 run with a slot full or empty, and with
the turn 0 or 1. **CORRECTED:** this spec first put these rings on L0 M105 / M104 / M115 / M114. The census called phase 2
directly with every slot empty, so it printed phase 0's no-scale clip (rom-map Withdrawn table). The (7, 0x1e / 0x25) and
(7, 0x1f / 0x28) rows were re-checked the same way: phase 1's frame / end sets L2 M70 / M73 / M71 (by +0x44) or L2 M74, and
phase 2 plays that clip (fb/ph7q068.py).

Mode 2 (the CALL-OFF): (6, 0 / 0xa) L0 M36 f100 (0xf7fa28). Its centre is the zero vector, its radius -1 and its id 0xffff.

**vt+0x1dc 0xf7ad20**, every frame before the action main (the +0x24 pass, as Seregios's): clears the ring (+0x14 = 0,
+0x16 = 0, the centre the GOT vector, +0x30 = -1.0) and empties a slot whose unit's +0xc & 7 is not 1 / 2. The viewer
empties the slot of a removed shell. **INFERRED:** that a unit in base36's state 0xfe still counts as 1 / 2, and so keeps
its slot until it is deleted.

### 1b. base36 (READ whole 0x41900c..0x41ab84)

The functions: ctor 0x41900c, init vt+0x13c 0x419218, update vt+0x24 0x419990, end vt+0x148 0x41a6c0, vt+0x150 0x41ab84
(`bx lr`), contact vt+0x154 0x41a810.

**sp_36's reader 0xf88b6c:**
- ef 0, 1, 3, 2, 4, 5, 6 -> +0x15c8..+0x15e0; hits 0..3 (not visual).
- cmn int 0 -> +0x15f4; sh int 0 -> +0x161c (the INDEX).
- cmn float (rank > 4 ? 1 : 0) -> +0x15f8 (the count of hunter hits it takes); cmn float (rank > 4 ? 6 : 5) -> +0x160c (the
  ring step).
- cmn floats 2 / 3 / 4 -> +0x1600 (the flight's limit, 600) / +0x1604 (the stuck life, 7200) / +0x1608 (the fade step, 30).
- sh floats 0 / 1 -> +0x1620 (a yaw in degrees) / +0x1624 (the aimed speed).
- &sh vecs 0..2 -> +0x1628 (the offset) / +0x162c (the velocity) / +0x1630 (the gravity).
- sh int 1 != -1 -> +0x1618 = 1 (AIMED: modes 9 and 10).
- +0x1610 / +0x1614 (the spin's base and spread) stay the ctor's 0.

The files' cmn floats are [1, 2, 600, 7200, 30, 30, 18].

**The seven handles** +0x1678..+0x1690:
- ef 0 (u 0, the flight) and ef 1 (u 3) at the init;
- ef 3 (u 1, stuck) at the landing;
- ef 4 ((0, -1): refused) at a type-2 (hunter) contact;
- ef 5 (u 30, the ring) at the ring;
- ef 6 (u 2) at the fade's end and at the flight's limit;
- +0x1684 is never started.

**The init 0x419218.** The init gates are 0x43a850 and the owner unit's byte +0x50 bit 0, which the viewer passes.
- +0x40 = the owner's +0x40, then += vec 0 turned by the block's words Z, X, Y (turnByWords).
- The words +0xfe8.. = P+0x50..; +0x1638 = the Z word; the count byte = u8(+0x15f8).
- AIMED: the velocity is (block +0x1d0 - +0x40), normalised once its length reaches 2^-23, times +0x1624. The gravity is
  the GOT vector, which is zero in the ROM run.
- Otherwise: Y += int(0.5 + +0x1620 x 182.04), the velocity is vec 1 turned Z, X, Y by the words, and the gravity is vec 2.
- ef 0 -> +0x1678 and ef 1 -> +0x167c at +0x40. The spin +0x1670 = 0. State 1.

**The update 0x419990.**
- First the handles' hygiene, then the OWNER CHECK: the owner present (0x4a0f00, unit state 1 / 2, P != 0) and 0x7fe88(e)
  == 0, else end(1).
- 0x7fe88 returns 1 unless e+0xb5f9 != 0, e+0x7652 == 1 (0x70768) and P+0x1a0 < 2.
- Then states 1..4 and 0xfe. In 0xfe, +0x1634 += dt; past 1800 the shell is deleted; once all seven handles are 0, +4 =
  0xff and it is deleted.

**State 1, the flight (0x419c68).**
- +0x1634 += dt. At >= 600: end(1), then ef 6 at +0x40.
- Otherwise:
  - Z += int(0.5 + dt x 77 x 182.04);
  - +0x1000 = +0x40;
  - 0x539224 (stepFlight);
  - 0x43ac6c / 0x43ac8c (mask 0x30) -> on a hit, vt+0x154;
  - while +0x167c is live, Z += u16(int(0.5 + +0x1670 x dt x 182.04)), which adds 0.

**The contact 0x41a810.**
- **Type 0:** +0x40 x / z = the point's (y kept). The normal's bearing word becomes (10 sin, -5, 10 cos) as the velocity,
  and (0, -0.1, 0) the gravity; the state stays 1.
- **Type 1:** state 2, +0x1634 = 0, +0x40 = the point, Z = +0x1638, Y += int(0.5 + mode x 80 x 182.04). Then:
  - vt+0xc8;
  - the body / hit registrations (not visual);
  - +0x1678 and +0x167c stopped at once;
  - ef 3 at the point;
  - +0x167c stopped gracefully.
- **Type 2:** ef 4 at the point.

**State 2, stuck (0x419ea0).**
- +0x1634 += dt; past 7200 -> state 4 with +0x1634 = 30 x the index.
- With the stored mode 0, the block's ring is copied when its +0x14 is set. Next, the owner's area byte +0x1054 is checked
  against the shell's: unequal -> state 4.
- Stored mode 1: it finds its slot mate (a slot handle in state 2 with its slot index: itself).
  - Radius < 0, or |centre - its +0x40|^2 <= radius^2 -> THE RING: delay = ring step x (slot + 1), +0x1680 stopped at once,
    ef 5 at +0x40, state 3.
  - Outside the radius, the stored ring is reset.
- Stored mode 2: the count = 0.
- Then the count. A hunter's hit (+0x151e != 0xff: never here) takes one. A count of 0 -> state 4 with +0x1634 = the index;
  marks == 3 -> the same.

**State 3, ringing (0x41a2c8).**
- Stored 2 -> the count = 0.
- The delay counts down, floored at 0. When it runs out with the count left and the stored mode 1 / 3, the BLAST is armed
  (+0x1668).
- Armed, or marks == 2:
  - the marks are cleared (0xf88000);
  - +0x15c0 = 1;
  - sp_01 0x125 mode 2 is made at +0x40 with the words;
  - +0x1669 = 1;
  - end(0).
- Marks == 3, or a count of 0 -> state 4.

**State 4, the fade (0x41a504).**
- The wait +0x1634 counts down. At its end:
  - the marks are cleared;
  - +0x1669 = 0;
  - every other slot shell whose ORDER is not this one's SLOT INDEX and not 0 has its ORDER reduced by one. 0x41a57c loads
    +0x1640, the slot, for that compare -- transcribed as read;
  - ef 6 at +0x40;
  - end(0).

**The end 0x41a6c0(flag).**
- Flag 1 stops all seven handles at once. Flag 0 stops +0x1678 / +0x167c / +0x1680 / +0x168c gracefully, but not +0x1684 /
  +0x1688 / +0x1690.
- Then state 0xfe and +0x1634 = 0. With flag 1, vt+0x40 deletes it.

**sp_01's reader 0xf889b0:**
- ef 0 -> +0x15c8;
- hit 0 -> +0x15d8;
- +0x15ec: bit 4 from int 0, bit 8 from int 1;
- &vec 0 -> +0x1608;
- the timer is the ctor's 0, so mode 2 (u 31) lives while its hit slot does (30 + 20).

### 1c. In the viewer

- `SHELL_DATA.em068_00` holds 20 rows (code 'em068').
- `spawn068`: the action start's maker / retire on the fresh step, and the frame rows by pass001.
- `frame068` is vt+0x1dc, run before the action in stepShells; `step36` is the update.
- The blast is made through ctx.create, so it is base01's own init011.
- What the viewer keeps of the owner's state, per shell session: `state.slots068` / `state.ring068` / `state.marks068`.

**The ROM check (dev/shells-najarala-check.mjs).** The cases:
- the four L2 M60 starts (facing, pitch / roll words, a low floor);
- L2 M62 (aimed, two targets);
- L2 M63;
- the ring at rank 5 and rank 3 (its delay 18 / 36 and 30 / 60 moves, the blast children);
- a ring outside its radius: L2 M61's r 3500 played with the owner 6000 away. Both scales hear it, reset the stored ring and stay
  stuck. The ring at rank 3 is the same poke path inside the radius, and it rings: the positive control;
- the flight's limit: no floor in reach, so at move 600 the end (1) stops both flight handles at once and ef 6 (u 2) starts;
- the call-off;
- the retire marks.

For each case it compares positions, words, states, the timer +0x1634, the velocity in flight, every start's key and point,
and the stop sequence with its modes, against emu_fb.py. The ROM run needed:
- `slotSelf` (the flown shell is the slot handle it looks for);
- the owner present for 0x7fe88;
- the area byte equal (the shell unit's +0x1054 is the base ctor's 0xff under the harness);
- the ring / marks written into the block before the move the module heard / faded on, cleared after.

Controls (facing, target, floor, rank either way) fail.

**Not exercised:** the bounce (type 0), because the harness stage is a floor only. It stays out until the stage stand-in has a
wall the scale can meet.

**Not built, by name:** sp_01 modes 0 / 1 ((7, 0x18 / 0x1a) L2 M61 f140 / f138). They are hit volumes with (999, -1),
which draw nothing.

**Clip placement.** Each phase-2 ring writer's row sits on the clip that phase plays: L0 M138 / M139 for (2, 0x44..0x47),
L2 M70 / M73 / M71 / M74 for status 7. The game plays L0 M138 / M139 only in phase 2, and only with a scale out, so the viewer's
f30 row rings exactly where the ROM's phase 2 does. A play with no scale out simply finds no scale to ring.
