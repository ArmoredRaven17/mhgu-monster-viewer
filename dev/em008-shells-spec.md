# Yian Kut-Ku (em008_00) -- his shells (shells agent, 2026-10-20)

Class `uEm008_00` (vtable `0x179ac54`, action main `0xd4fdd8`, band `0xd46ca0..0xd52f04`). Emulator check `dev/shells-kutku-check.mjs`
(tool `<scratchpad>/fb/mk008.py`), 22 / 22 (17 cases, 4 controls each failing, the contract); page 7 / 7. `R` = the consuming instruction
read. Code in `docs/render/shells.js`, the YIAN KUT-KU block (`params008s00` .. `SHELL_DATA.em008_00`).

The ids are immediates in his band (`mov #0x73` / `#0x74` / `#0x75`): sp_00 0x73, sp_01 0x74, sp_13 0x75.
* The action census finds 31 creates: 24 in his reach, and 7 from actions outside his table (fbbcmp).
* Besides the makers below, the band's 0x74 sites are the frame handler's (1.2), (7, 0x02)'s (1.3) and the two landings'.
* `0xd475dc` / `0xd4802c` / `0xd4ff58` are motion ids (setMotion0), not shells.

## 1. What creates

### 1.1 The action makers (census of his reach; trgen `k08cap.py`)

| action | clip at the maker | frame | shell, modes |
|---|---|---|---|
| (7, 0x12) / (7, 0x22) | L2 M2 (phase 0 L2 M37 / L2 M2; phase 1's end L2 M2 from 16) | phase 2: 26 / 48 / 86 | sp_00 0 / 1 / 0 |
| (7, 0x19) / (7, 0x49) | L2 M3 | 32 | sp_00 2 / 19 |
| (7, 0x23) / (7, 0x4c) | L2 M3 | 32 | sp_13 0 / 1 |
| (7, 0x2d) / 0x36 / 0x37 / 0x38 | L2 M1 | 78 / 150 / 240 / 296 | sp_00 3..6 / 7..10 / 11..14 / 15..18 |

Notes:
* L2 M2 ships as `_start` (28) + `_loop`. The rows use clip Motion[2] with partners ['Motion[2]_start']; frames 48 / 86 are the
  `_loop`'s.
  - The page has no combined entry for such a pair (rom-map trap 120). Picking `_start` shows f26; picking `_loop` (which carries the
    start's offset) shows f48 / f86.
* Every maker's request (+0x10.., +0x20..) is a GOT zero. sp_13's +0x30.. is not written (the 0x30-byte setup).

### 1.2 The frame handler `0xd4ffa4` (vt+0x208, the +0x28 pass; R whole; per-frame census `pf_em008_00.txt`)

The handler works by the motion id (`0xb0944`, three jump tables). At a channel-0 crossing (`0xb0974`), when the block's +0x44 is not
above its ground +0x5b4 by more than 900.0, it makes shell01 0x74:
* setup `0x3fa2bc(0x40)`;
* +0x10.. the block's +0x40..;
* +0x30.. his words e+0xfe8..;
* +0x20 a GOT vector, +0x3c 0xffff.

| motion | frame | mode | site |
|---|---|---|---|
| L0 M24 / M27 / M30 (0x18 / 0x1b / 0x1e) | 2 | 3 | `0xd50030` |
| L1 M4 (0x104) | 2 | 5 | `0xd507d8` |
| L1 M14 (0x10e) | 52 | 5 | `0xd508ac` |
| L1 M17 (0x111) | 2 | 4 | `0xd50990` |
| L1 M19 / M102 (0x113 / 0x166) | 2 | 4 | `0xd504f8` |
| L1 M105 (0x169) | 2 | 4 | `0xd50b4c` |
| L1 M106 (0x16a) | 2 | 4 | `0xd503a8` |

The rest of the handler is not visual: camera shakes (`0xc241c`) and hit ids (`0x7db70` / `0x7ded8`).

**L1 M1's site `0xd5028c` is not built.** It makes mode 3 when the clock [e+0xcac0]+0x10 >= 100.0, then zeroes the clock. That clock
belongs to vt+0x1dc (`0xd471c4`, R): every update it adds dt (`0x7264c`), and at >= 100.0 it resets to 0 and sets the pulse byte +0x14.
* vt+0x1dc runs in the +0x24 pass (`0xaddc8` in `0xada80`, unconditional there), before the action main.
* The handler runs in the +0x28 pass (`0xae774` in `0xae370`).
* So the handler always reads the clock below 100.0.
* Control: trgen on `0xd4ffa4` with mot 0x101 makes mode 3 with the clock poked to 100.0, and nothing at 99.0.

### 1.3 (7, 0x02)'s hover dust (`0xd4b990`, phase 2 `0xd4bb08`; R)

* Phase 0 plays L2 M20 (0x214). Phase 1's end plays L2 M21 (0x215) and moves to phase 2.
* In phase 2, at frame >= 10 (`0xb0968` mode 1), the clock [e+0xcac0]+0x10 gains dt (`0xd4bb94`).
* At >= 16.0 the clock resets to 0 and the code makes shell01 0x74 **mode 6** at (block x, his ground +0x5b4, block z) with his words.
* (7, 0x3e..0x41) reach the same code, but they are outside his table.
* The clock also gains dt in vt+0x1dc first, so it rises by 2 per update here: one shell every 8 updates.
* **The clock's value when the window opens is a stand-in.** The ROM's clock runs free from his spawn (mod 100); the viewer's starts at
  0 with the clip and counts on the updates where the clip advances (shells.js `counter008`).
* The census missed this site: trgen's single run starts the clock at 0. A sweep of every action and phase with the clock primed to 16
  finds (7, 0x02 / 0x3e..0x41) phase 2 (`k08m6.py`).

## 2. sp_00 `uShellEm008_sp_00` (base00; vtable `0x179c130`)

* Reader `0xd522b8` (R whole):
  - ef 0..3; hit 0.
  - int 0: the joint +0x15dc. int 1 -> 0x100.
  - floats: 1 the X deg +0x15ec, 2 the Y deg +0x15f0, 0 vz +0x15f4, 3 -> +0x1660.
  - cmn float 0: the flight +0x15fc.
  - &vec 0: the offset +0x1610. cmn vec 0: the gravity +0x161c.
* Init `0xd52200` (R whole): base00's `0x3f8b80`, then with +0x1660 > 0, velocity +0x1010.. x= s and gravity +0x1020.. x= s * s
  (shells.js POST00 `scale008`).
  - Modes 2 / 19 take joint -1 (his point plus the offset turned by his facing).
  - Mode 19's s is 1.15.
* Landing `0xd52430` (R whole):
  - type 1: ef 2 (camera +0x15e4), and with the owner active, shell01 0x74 at the contact. The child's mode is 0 for modes 0..2,
    else 1. Its words are a GOT zero and +0x3c is 0xffff.
  - type 0: ef 1 (camera +0x15e0).
  - type 2: ef 3.
  - then `0x3f8970` and the end.

## 3. sp_01 `uShellEm008_sp_01` (base01; vtable `0x179c2ac`)

* Reader `0xd52774` (R whole):
  - ef 0 / 1 -> +0x15c8 / +0x15cc (both started at the init); hit 0 / 1.
  - +0x15ec flags (bfc / orrne): 4 from int 0, 8 from int 1, 0x80 from int 2, 0x800 from int 3, 0x1000 from int 4.
  - &vec 0 -> +0x1608.
  - No joint and no timer (the ctor's), so the shell lives as long as its hit slots do.
* Modes 0..2 draw nothing: ef (999, -1).
* Modes 3..6 draw c 30 / c 31 of `em008_00c` (list 1). They carry flags 0x80 | 0x1000 (at his ground; mode 6 also 4), and their life
  comes from hit 1 (records 3..5: (14, 10)).

## 4. sp_13 `uShellEm008_sp_13` (base13; vtable `0x179c41c`)

* Reader `0xd52aa0` (R whole):
  - ef 0..3; hit 0.
  - int 0: the joint +0x15e4.
  - +0x15e0: 2 from int 1, 0x10 from int 2, then |= 0x60.
  - floats:
    - 0 speed +0x15ec
    - 2 gravity +0x15f4
    - 1 per unit +0x160c
    - 4 far +0x1600
    - 3 near +0x15fc
    - 5 life +0x15f8
    - 6 -> +0x167c
  - &vec 0 -> both points. This is Kecha Wacha's map, with float 6 at +0x167c in place of +0x1614.
* **The thrown point's 0x40 arm** (base13 `0x405500` -> `0x4055b0`, R) is used. The distance and the base point are the owner block's
  +0x40, not the shell's. With 0x10, the aim is his facing as it is. shells.js `thrown008s13` (Tetsucabra's `thrown067s13` has the same
  arm).
* Init `0xd529e8` (R whole): base13's `0x4044d8` (init13k's joint path), then +0x167c scales it as sp_00 does.
* Landing `0xd52c70` (R whole), only in state 2:
  - type 1: ef 2, and with the owner active, shell01 0 at the contact.
  - type 0: ef 1.
  - type 2: ef 3.
  - then `0x4042bc` and the end.

## 5. The check

* The action cases run main `0xd4fdd8`. The frame-handler cases run `0xd4ffa4` with e+0x4b4 set to the motion and `0xb0974` answered at
  the frame. The (7, 0x02) case primes the ctl clock +0x10 = 16.0, because emu_fb stubs `0x7264c`.
* The children's hit slot is held with `slot0Until`:
  - 25 for the handler's and the counter's (delay + duration + 1);
  - 26 for a lone parent's child;
  - per flight for the multi-shell cases.
* Controls fail as they should: joint 4 + 1, the target 30 aside, his Y word + 0x100, his ground + 1.
