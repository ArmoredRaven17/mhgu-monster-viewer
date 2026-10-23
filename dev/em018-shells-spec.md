# Yian Garuga (em018_00) and Deadeye (em018_04) -- their shells (shells agent, 2026-10-20)

Class `uEm018_00`: vtable `0x17abb38`, action main `0xdb0a2c`; Deadeye is variant 4.

Emulator checks:
* `dev/shells-garuga-check.mjs`: 11 / 11 (7 cases, 3 controls, the contract).
* `dev/shells-deadeye-check.mjs`: 15 / 15 (11 cases).
* Tool `<scratchpad>/fb/mk018.py <mon>`. Page 3 / 3 and 4 / 4.

Code in `docs/render/shells.js`, the YIAN GARUGA / DEADEYE block. `R` = the consuming instruction read.

The ids come from the owner: e+0xcac4 sp_00, +0xcac8 sp_01, +0xcacc Deadeye's 04_07. The class ctor `0xdb3ef8` fills them with 0x19d;
the loader sets the real ids.

| | sp_00 (base00, vtable `0x17ad114`) | sp_01 (base01, `0x17ad290`) | 04_07 (base07, `0x17acfa8`) |
|---|---|---|---|
| Garuga | 0x94 | 0x95 | -- |
| Deadeye | 0x96 | 0x97 | 0x98 |

## 1. What creates (trgen `r18cap.py`, phases `r18ph.py`, the primed sweep `r18sw.py`)

| action | clip at the maker | frames | shell, modes |
|---|---|---|---|
| (7, 0x0a) | L4 M52 | **78 / 120 / 164** | sp_00 1 / 2 / 3 |
| (7, 0x15) | L4 M52 | 78 / 120 / 164 | sp_00 4 / 5 / 6 |
| (7, 0x10) / (7, 0x11) | L4 M28 -> M29 (phase 2) | 40 | sp_00 10 / sp_01 0 |
| (7, 0x12) / (7, 0x13) | L4 M68 | 60 | sp_00 10 / sp_01 0 |
| (7, 0x23) | L4 M51 | 62 | sp_00 0 |
| Deadeye (7, 0x30) / (7, 0x32) | L4 M51 | 62 | sp_00 0 |
| Deadeye (7, 0xca) | L9 M13 -> L9 M8 (from 30, phase 3) | 40 | sp_00 15 |
| Deadeye (7, 0xcc) | L9 M17 .. L9 M8 (phase 4) | 40 / 40 / 42 / 44 | sp_00 15, 04_07 0 / 1 / 2 |

**The fireball maker `0xdac748(e, row, n, ..)`** (R):
* It fires at three crossings of `0xb0974`: **78**, 120 and 164.
* Each shot's mode is the table `0x169ca70` [base + P+0x1a2]. P+0x1a2 is the shot count; base is 1 / 4 / 7 by the row.
* A caller passing n = 3 gets no shots.
* The census listed 120 / 164 only, and gave both the first mode. Frame 78 and the counted modes are the read's; the ROM check runs all
  three.

(7, 0x11) / (7, 0x13) make **sp_01 0** at the unit's point with its words (`0xdad2fc` / `0xdad634`). Mode 0 carries flag 1, so the
shell sits at joint 3. It is a hit volume that draws nothing (ef (999, -1)); the census counted it as "starts nothing".

## 2. The classes (R whole)

**sp_00.** Reader `0xdb34fc`.
* Reader:
  - ef 0..3; hit 0.
  - int 0: the joint. ints 1 / 2: the cameras. **int 3 -> bit 0**: the X aim, base00's `0x3f9378` with its clamp.
  - floats: 0 X deg, 1 Y deg, 2 vz, 3 the flight, 4 / 5 the X clamp.
  - &vec 0: the offset. &vec 1: the aim's origin. &vec 2: the aim offset.
  - No gravity and no vy.
* The aim starts from the owner's point (aimFrom001), which reads block +0x5c (`y5c`). spawn018 has to pass it; without it the aim came
  out 0.
* Landing `0xdb36dc`:

| contact | ef | children |
|---|---|---|
| any, modes 14 / 15 ((m & 0xfe) == 0xe) | none | none, and **no end** |
| type 1 | 2 | (owner active) sp_01 1 at the contact with its words; then, when the contact record's +8 halfword has no 0x1040, sp_01 3 |
| type 0 | 1 | sp_01 2 |
| type 2 | 3 | -- |

  After the table: `0x3f8970` and the end.

**sp_01.** Reader `0xdb3b68`.
* ef 0 / 1 (both started at the init); hit 0 / 1.
* +0x15ec flags: 1 from int 0, 2 from int 2, 0x80 from int 3, 0x800 from int 4, 4 from int 5, 8 from int 6, 0x1000 from int 7.
* int 1: the joint. float 0: the timer. &vec 0.
* Its +0x158 `0xdb3d34` is the hit side's re-registration, not visual.

**04_07 (Deadeye).**
* Reader `0xdb31f4`: Bloodbath's map, so it uses `params07` / `make07`. Flags 2 / 4 / 8 from ints 3 / 4 / 5; F; H; the two vecs.
* Its +0x28 `0xdb33a0` is a ground marker for modes <= 2, not visual.
