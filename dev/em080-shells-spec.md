# Glavenus (em080_00) and Hellblade Glavenus (em080_04) -- their shells (shells agent, 2026-10-20)

Class `uEm080_00` (action main `0xffe7fc`; the same class runs Hellblade, variant 4, in section 5). Emulator check
`dev/shells-glavenus-check.mjs` (tool `<scratchpad>/fb/mk080.py`), 12 / 12 (8 cases, 3 controls each failing, the contract); page 4 / 4.
`R` = the consuming instruction read. Code in `docs/render/shells.js`, the GLAVENUS block (`params080s00` .. `SHELL_DATA.em080_00`).

His ids are read from e+0xcbe0 (sp_00 0x146), +0xcbe4 (sp_01 0x147) and +0xcbe8 (sp_03 0x148); Hellblade's are 0x149 / 0x14a / 0x14b.

## 1. What creates (the census of his reach, trgen `g80cap.py`)

| action | clip (phase) | frame | shell, modes |
|---|---|---|---|
| (7, 0x02) | L2 M2 (1) | 122 | sp_03 9 / 10 / 11 |
| (7, 0x0b) | L2 M11 (1) | 132 | sp_03 18 / 19 / 20 |
| (7, 0x09) | L2 M9 (2; phase 1 from 52) | 70 / 120 / 168 | sp_00 7 / 8 / 9 |
| (7, 0x0a) | L2 M10 (2; phase 1 from 38) | 92 | sp_00 0 |
| (7, 0x0c) | L2 M10 (2) | 92 | sp_00 6 |
| (7, 0x5c) | L2 M55 (1) | 56 | sp_00 4 |
| (7, 0x5d) | L2 M57 (1) | 56 | sp_00 5 |

The census's other creates are hit volumes (ef (999, -1)). The sp_03 makers fill the request +0x10 with (0, 300, 0) and the words with
(0, his Y + .., 0); neither is read, because the reader sets no 0x10 / 0x20. The sp_00 makers' base00 request is zeros.

## 2. sp_00 `uShellEm080_sp_00` (base00; vtable `0x17ebd48`)

* Reader `0x100f9fc` (R whole): `0x100fa38` for 0x146, `0x100fd3c` for Hellblade's 0x149.
  - ef 0..3; hit 0.
  - ints 0 / 1 / 2 -> the joint +0x15dc / the cameras +0x15e0 / +0x15e4.
  - ints 3..8 -> +0x15e8 bits 0 / 1 / 2 / 3 / 7 / 11 (`bfc` / `orrne`); bit 11 for 0x146 only.
  - floats 0..7 -> +0x15ec (X deg), +0x15f0 (Y deg), +0x15f4 (vz), +0x15fc (the flight), +0x1600 / +0x1604 (the X clamp),
    +0x1608 / +0x160c (the Y clamp).
  - &vec 0 / 1 / 2 -> +0x1610 (the offset) / +0x1614 (the aim's origin) / +0x1618 (the aim offset).
  - cmn float 0 -> +0x15c4; byte +0x15c1 = 0.
  - No vy and no gravity: +0x161c stays the ctor's zero.
* The aims are base00's (`xAdjust37` / `yAdjust37`). Modes 6..9 set bit 3 with bit 0: the X aim is taken from base + the offset turned
  by the setup's words (`bit3First00`, as Barroth's mode 5). Modes 4 / 5 aim X and Y at the target.
* Landing `0x1010018` (R whole), state 1:
  - type 0 / 1: ef 1 / 2. With the owner active, byte +0x15c0 = 1. For a mode <= 0x2c that is not in 10..34, shell01 [owner+0xcbe4] is
    made at the contact, its mode from the table `0x16a1dc0`. Modes 0..9 give 17 0 0 0 0 0 17 0 0 0; modes 35..44 give
    19 2 2 2 2 2 19 2 2 2. Its words are a GOT zero and +0x3c is 0xffff.
  - type 2: ef 3, only with byte +0x15c1 0.
  - then `0x3f8970`, the end.

## 3. sp_01 `uShellEm080_sp_01` (base01; vtable `0x17ebec4`)

* Reader `0x1010418` (R whole):
  - ef 0; hit 0 / 1.
  - int 0 -> bit 0; int 1 -> the joint +0x15e4; int 2 -> 4; int 3 -> 8.
  - float 0 -> the timer +0x15f0; &vec 0 -> +0x1608.
* +0x154 `0x101052c`, in base01's end: with the owner active, mode 0 / 2 / 17 / 19 leaves shell01 1 / 3 / 18 / 20 at its point. The
  words are a GOT zero and +0x3c is 0xffff (shells.js `END_MODES080` / `endCreate080`).

## 4. sp_03 `uShellEm080_sp_03` (base03; vtable `0x17ec034`)

base03's init is `0x3fd9d8` and its move `0x3fdce4`.

* Reader `0x1010964` (R whole): `0x101099c` / `0x1010b88`.
  - ef 0..3; hit 0.
  - int 0 -> the joint; int 1 -> 0x80 (times the size); int 2 -> 0x800; int 3 -> 8 (bit 3: the offset turned by the words).
  - floats 0 / 1 / 2 -> the fan +0x15f0, the speed +0x15f4, the life +0x15fc; floats 3 / 4 -> +0x167c / +0x1680 (the follow's reach).
  - &vec 0 -> +0x1610; &vec 1 -> +0x1614.
  - byte +0x15c1 = (mode in 6..23).
* **Bit 3 in base03's init** (new in init03): base00's init runs inside base03's. With bit 3 the point is the joint's row 3 plus the
  offset turned X, Y, Z by the words after the degree offsets, times the size with 0x80. This replaces the joint's 3x3 turn.
* **ef 0 starts at the launch point, before the ground step** (`0x3f9298` in base00's init, ahead of base03's `0x3fdb08`). Modes 10 / 19
  carry ef 0 (u 40). The ROM starts it at joint 0 + the turned offset, 10.5 above the floor. `spawnBolts` used to start it at the
  grounded point. It was fixed 2026-10-20 (g02 / g02t / g0b failed `start 0 point` y 0 vs 10.5 until then).
* +0x150 `0x1010d4c`: type 1 for modes 6..23 does nothing; the bolt goes on.

## 5. Hellblade (em080_04)

The same class, variant 4. Ids are 0x149 / 0x14a / 0x14b, and his own ShellInfoLists live under `em080_04_shell00/01/03`. Code is
`SHELL_DATA.em080_04`. Check `dev/shells-hellblade-check.mjs` (tool `<scratchpad>/fb/mk080h.py`): 23 / 23 (19 cases, 3 controls each
failing, the contract). Page 7 / 7.

* The readers' Hellblade arms (`0x100fd3c` for sp_00, `0x1010b88` for sp_03) are the 0x146 / 0x148 arms without the int that sets
  bit 11 (diffed whole). sp_01's reader has no id arm.
* **sp_03's vt+0x154 `0x1010df8`** (R whole; it runs inside base03's end, after `0x3fd820`): with the owner active, modes 41..43 make
  shell01 **12** and modes 44..46 make **13**.
  - The child is placed at its +0x40, with ITS words +0xfe8.. at +0x30; +0x3c is 0xffff and byte +0x15c0 = 1.
  - Hellblade's (7, 0xf0 / 0xea) reach these modes; the ROM run makes the children (hf0 / hea).
  - shells.js `END03`.
* sp_03 +0x150 `0x1010d4c` (R whole):
  - type 0 (a stop): ef 1 at +0x40, then the end.
  - type 1: modes 6..23 do nothing; any other mode gets ef 2, then the end.
  - type 2: ef 3, only with byte +0x15c1 0.
  - Every reached mode's ef 1 / 2 / 3 is (999, -1).
* sp_01 +0x150 `0x10106b8`: mode 14 only (the owner's +0x7800.. point, shell01 15 when his byte +0x8bb3 is set). No site reaches it.
* His sp_03 modes 9..11 / 18..20 carry floats 3 / 4 = 0 (the follow's reach). The ROM run ends them early, and shells.js does too
  (h02: 304 moves).

The census of his reach (43 draws plus the creates that start nothing; trgen `g80cap.py` VAR=4, phases `h80ph.py`):

| action | clip at the maker | frame | shell, modes |
|---|---|---|---|
| (7, 0x02) / (7, 0xf0) | L2 M2 | 122 | sp_03 9 / 10 / 11; 41 / 42 / 43 |
| (7, 0x0b) / (7, 0xea) | L2 M11 | 132 | sp_03 18 / 19 / 20; 44 / 45 / 46 |
| (7, 0x09) / 0xd9 / 0x97 / 0xf3 | L2 M9 (phase 1 from 52; 0x97 / 0xd9 phase 0 L9 M13) | phase 2: 70 / 120 / 168 | sp_00 7 / 8 / 9; 7 / 8 / 9; 1 / 2 / 3; 42 / 43 / 44 |
| (7, 0x0a) / 0x0c / 0xd4 / 0xdb / 0xf4 | L2 M10 (phase 1 from 38; 0xdb phase 0 L9 M12) | phase 2: 92 | sp_00 0 / 6 / 41 / 0 / 35 |
| (7, 0x5c) / (7, 0xfe) | L2 M55 | 56 | sp_00 4 / 39 |
| (7, 0x5d) / (7, 0xff) | L2 M57 | 56 | sp_00 5 / 40 |
| (7, 0xeb) | L2 M15 | 10 / 40 | sp_00 26 / 27 |
| (7, 0xee) | L2 M1 | 48 | sp_00 25 |
| (7, 0xf9) | L2 M17 | 58 | sp_00 24 |
| (7, 0xfa) | L2 M18 or L2 M19 (phase 0: the turn `0x7a258` on table `0x16a1d40`) | phase 1: 40 | sp_00 28 |
| (7, 0xe6) | L9 M7 (phase 0 L9 M2..M6 by angle, each one's end -> L9 M7) | his action_tune 0x2b = 22, 0x2c = 32 | sp_00 34, 33 |
| (7, 0x8e) | L2 M14 (phase 0 L4 M11; phase 1's end -> L2 M14 from 76) | phase 2: 120 | sp_01 25 |
| (7, 0xf7) | L2 M14 | 102 | sp_01 4 / 5 |
| (7, 0xf6) | L2 M13 | 100 | sp_01 22 / 23 |
| (7, 0xe8) | L2 M37 | 66 | sp_01 6 / 7 |
| (7, 0xfc) / (7, 0xfd) | L2 M36 (M34, M35, then `0xbf4e4` -> 0x224, phase 3) | 20 | sp_01 6 / 7 |

Notes on the census:
* **(7, 0xfa)'s turn**: the table's threshold +0xe is 0, so `0x772b4` always takes a side. +0x20 holds 0x212 (L2 M18), +0x30 holds
  0x213 (L2 M19), and the centre +0x10 (0) is never used. SHELL_DATA lists both clips.
* **(7, 0xe6)'s frames** come from `0x100f1f4` (actions 0xe5..0xe7 by byte e+0x73e1; phase 6 sets 7 and falls into phase 7's call).
  It tests `0xb0968` at his tune floats 0x2b / 0x2c, read from em080_04's action_tune.
* **L2 M36** ships as `_start` (24) + `_loop`, and frame 20 is the `_start`'s. The rows use clip Motion[36] with partners
  ['Motion[36]_start'].
* (7, 0xea / 0xf0)'s requests carry a NaN in +0x18. It is not read: the reader sets no 0x10.

## 6. Not modelled

* The cameras (+0x15e0 / +0x15e4).
* sp_00's / sp_03's bit 11 (0x800): set by the readers, its consumer not traced in this pass (open, not a negative).
  **READ 2026-10-20 (shells agent):** base00's init (which base03's runs) tests it at `0x3f9304` / `0x3f9308` and clears byte
  +0x15ac. +0x15ac == 0 makes the hit registration `0x43a8b0` skip its second half (`0x43a900..0x43aa64`), which runs only while the
  owner's +0xb720 state is set (vt+0x170 `0xca664`) and the shell's side +0x15bc matches the owner's +0xca88 / +0xca9c. That half
  rescales the shell (+0x60.. = the entry's +0xc, the hit radii, the slot's power) from the owner's tables +0xca98 / +0xcaac by the
  shell id (`0xcaa30`). So 0x146's shells keep their size under that state. +0xb720 = Hyper is INFERRED. The viewer has no +0xb720
  state, so there is nothing to draw differently and nothing to transcribe until it has one (rom-map `0x43a8b0` row).
