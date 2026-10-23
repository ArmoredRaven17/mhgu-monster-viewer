# Barioth (em042_00) -- his shells (shells agent, 2026-10-19)

Class `uEm042_00` (action main `0xe701d4`, band `0xe64d24..0xe727b0`). Emulator check `dev/shells-barioth-check.mjs` (tool
`<scratchpad>/fb/mk042.py`), 8 / 8. `R` = the consuming instruction read. The per-frame census (fb/pfgen.py) finds none.

## 1. What creates (the census of his reach)

| actions (arg) | clip | frame | shell00 0xd1 mode 0, words |
|---|---|---|---|
| (7, 0x02) (0) / (7, 0x2d) (1) / (7, 0x2c) (2) | L2 M12 | 106 | X **0xa00 / 0x200 / 0x500** (absolute), Y e+0xfec (his), Z 0 |
| (7, 0x15) (0) / (7, 0x2e) (2) | L2 M5 | 84 | X 0x2000, Y his, Z 0 |

`0xe6ae80..0xe6b05c` / `0xe6d150..0xe6d2d4` (R): the frame test `0xb0968(e, 0, 0, F, 0.0)`; `0x3f883c(0x30)`: +4 0xd1 (a literal), +8 0,
+0x10.. a GOT zero vector, +0x20 the X literal, +0x24 e+0xfec, +0x28 0, +0x2e 0xffff. (7, 0x2e) also turns him (`0xb0968` mode 9 window,
`0x76c08`) -- not a shell's.

## 2. shell00 `uShellEm042_00_00` (base00; vtable `0x17bfa30`, found by its base00 slots)

* Reader `0xe72190` (R whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; +0x15e8 |= **0x120** (0x20: the request's words; 0x100 shapes
  only bit 3's offset, never set); float 0 -> the flight +0x15fc (180); int 0 -> the joint +0x15dc (**4**); &vec 0 -> the offset +0x1610
  ((0, -20, 50)); vec 1's z / y -> vz +0x15f4 / vy +0x15f8 ((0, 0, 60): 60 / 0); &vec 2 -> the gravity +0x161c ((0, 0, 0)).
* +0x150 `0xe722bc` (R whole; byte +4 == 1 only): type 1 with the velocity's y > 0 returns; type 1 -> ef +0x15d0 and the child `0xe72374`
  (shell01 0xd2 mode 0, `0x3fa2bc(0x40)`, at the contact, +0x30.. (GOT x, **this shell's Y word**, GOT z), +0x3c its +0x13dc); type 0 ->
  +0x15cc; type 2 -> +0x15d4; `0x3f8970`, `0x43ac04(shell, 7)`, the end.
* +0x16c / +0x170 the base's.

## 3. shell01 `uShellEm042_00_01` (base01; vtable `0x17bfbac`)

Reader `0xe72598` (R): ef 0 -> +0x15c8; hit 0; +0x15ec: int 0 -> 4, int 1 -> 8; float 0 -> the timer +0x15f0 (0.0: it lives while its hit
slot does, em042_00_01_hitdata (10, 36)). Mode 0: flags 0, u 30 at the contact.

## 4. In the viewer and checked

SHELL_DATA.em042_00 (five rows, code 'em042', `spawn042`), params042s00 / params042s01 / landing042s00, WORDS00 gains uShellEm042_00_00
(init00's ROM 0x20 arm). `dev/shells-barioth-check.mjs` 8 / 8: the five actions, each with its landing's shell01 (life by its hit slot);
controls joint 4 one unit up and his Y word 0x100 more -- each fails. Page 3 / 3. Records em042_00u 10, 20, 21, 30 (UNIQUE) to export.
