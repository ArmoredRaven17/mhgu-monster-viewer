# Barroth (em044_00) -- his mud (shells agent, 2026-10-19)

Class `uEm044_00` (action main `0xe8c7b0`). Emulator check `dev/shells-barroth-check.mjs` (tool `<archive>/fb/mk044.py`), 13 / 13
(9 cases, 4 controls each failing, the contract); page 2 / 2. `R` = the consuming instruction read. The per-frame census finds none.

## 1. What creates (the census of his reach)

| action | clip (phase) | frame | mode | Y offset | byte +0x32 |
|---|---|---|---|---|---|
| (7, 0x00) | L2 M12 (1) | 102 / 106 | 2 / 2 | 0xc500 / 0x9000 | 3 / 0x14 |
| (7, 0x03) | L2 M12 (1) | 102 / 106 | 1 / 1 | 0x2000 / 0xb500 | 0 / 0x11 |
| (7, 0x0e) | L2 M12 (1) | 102 / 106 | 3 / 2 | 0 / 0xa000 | 0x32 / 0x21 |
| (7, 0x0f) | L2 M12 (1) | 102 / 106 | 1 / 1 | 0xe000 / 0 | 0x10 / 0x21 |
| (7, 0x31) | L2 M17 (1) | 132 | 5 | 0 | 0 |

Every maker (e.g. `0xe86e48..0xe86f30`, R) is gated by the frame test `0xb0968(e, 1, 0, F)` and P+0x1a3 == 0. It calls `0x49d0f8(0x40)`
(cSetupParamEm044_00_00) and fills:
- +4 0xdd (a literal), +8 the mode, +0xc him
- +0x10.. a GOT zero vector
- +0x20 X word 0, **+0x24 his Y word + the offset**, +0x28 0
- +0x2c 0, +0x2e 0xffff
- **+0x30 e+0x73e8** (the action's draw: H73E8_STANDIN, 0), **+0x32 the byte**

Then `0x48b884`. (7, 0x1e..0x2c) make mode 4 on L2 M4 phase 2 at 52, but they lie outside his command table's reach (fbbcmp), so they
are not listed.

## 2. shell00 `uShellEm044_00_00` (0xdd; vtable `0x17c2270`)

The class runs base00's move `0x3f96a0` and its other base slots. It adds its own init +0x13c `0xe8e614`, +0x28 `0xe8e8ec`, reader
+0x14c `0xe8e930` and landing +0x150 `0xe8ebc0`.

* Reader `0xe8e930` (R whole):
  - ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; +0x15e8 |= 0x20.
  - float 0 -> the flight +0x15fc; int 0 -> the joint +0x15dc.
  - &vec 0 -> the offset +0x1610; vec 1's z / y -> vz +0x15f4 / vy +0x15f8; &vec 2 -> the gravity +0x161c.
  - ints 1..5 != -1 -> bits 0 / 1 / 2 / 3 / 8.
  - floats 1..4 -> +0x1600 / +0x1604 (the X clamp, degrees) / +0x1608 / +0x160c (the Y clamp).
  - &vec 3 -> +0x1614; &vec 4 -> +0x1618 (the aim offset).
  - Result: modes 0..4 flags 0x12c, mode 5 0x2d.
* Init `0xe8e614` (R whole): base00's `0x3f8b80`, then for mode < 4 or mode == 4 the velocity gains a push along his words:
  - rot = ((T16[b & 0xf] & H) >> (16 - T8[b & 0xf])) | (H << T8[b & 0xf]), with H = setup +0x30, b = setup +0x32.
  - Tables: T16 `0x169e7b8`, T8 `0x169e7c6`, F1 `0x1592918`, F2 `0x1592928`.
  - The push speed: s = F1[b >> 4] + (rot & 3) for mode < 4; s = F2[(rot & 1) | (b & 0xf0 == 0x10 ? 2 : 0)] for mode 4.
  - (0, ., s) is turned by the X then Y word (the Z word's terms are multiplied by the literal 0.0) and added in the instructions'
    order. This is shells.js spread044.
* **Bit 3 with bit 0 (mode 5)**: base00's X aim `0x3f9378` aims from +0x40 as the FIRST PASS left it: the joint's row 3 plus the
  offset turned by the setup's words. This was new for init00 (`bit3First00`): it used to aim from the bare joint point. The check's
  m31 / m31low failed by 1595 vs 1212 until it was fixed.
* +0x28 `0xe8e8ec`: base00's `0x4a1770`, then in state 4 a ground marker `0x43b2b0`. Not visual; not modelled.
* Landing `0xe8ebc0` (R whole):
  - type 1 with vy > 0: nothing.
  - type 1: ef +0x15d0 and, except for mode 5, the child `0xe8ec88` (owner active `0x4a0f38`): shell01 0xde mode 0
    (`0x3fa2bc(0x40)`) at the contact, +0x30.. this shell's three words, +0x3c its +0x13dc.
  - type 0 / 2: ef +0x15cc / +0x15d4.
  - Then `0x3f8970`, `0x43ac04(shell, 7)`, vt+0x148(0).

## 3. shell01 `uShellEm044_00_01` (0xde; vtable `0x17c240c`, base01; its own reader alone, `0xe8eeb0`)

ef 0 -> +0x15c8; hit 0; +0x15ec: int 0 -> 4 (the ground snap), int 1 -> 8 (the ground's angles); float 0 -> the timer +0x15f0. It is
0, so the shell lives while its hit slot does (em044_00_01_hitdata (4, 10)). Its ef is u 30.

## 4. In the viewer and checked

shells.js: params044s00, spread044 (the new POST00 hook in init00), landing044s00, spawn044 (code 'em044'), and SHELL_DATA.em044_00
(5 rows). READER00 / AIMX00 / WORDS00 / LANDING / READERS01 (Barioth's params042s01 map) carry the entries. `bit3First00` is generic,
so every AIMX00 class with bit 3 now aims from the first-pass point; the whole shells suite was rerun after the change.

`dev/shells-barroth-check.mjs` 13 / 13 covers:
- L2 M12's four actions, each with their landings' shell01, turned and plain.
- Mode 5 aimed plain, high and low.
- The floor 200 up.
- Controls (joint 2, his Y word, the target, the floor), each failing.

**Named, the viewer's clip**: the page's L2 M12 entry plays its _start alone (frames 0..99, then a replay). The mud at 102 / 106 lies
in the motion's _loop (the glb ships Motion[12]_start 100 + _loop 18), so the page never reaches it. The page check covers L2 M17.
**Records** em044_00u 10, 11, 20, 21 and 30 are not exported, so the slot request carries them.
