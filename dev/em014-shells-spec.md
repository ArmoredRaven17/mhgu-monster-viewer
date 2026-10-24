# Iodrome (em016_00) and Giadrome (em034_00) -- the dromes' shells (shells agent, 2026-10-20)

Both run the dromes' class `uEm014_00`: vtable `0x17a813c`, action main `0xd956e0`, shared with Velocidrome and Gendrome, whose censuses
reach no shell.

Emulator checks:
* `dev/shells-iodrome-check.mjs`: 9 / 9 (6 cases, 2 controls, the contract).
* `dev/shells-giadrome-check.mjs`: 9 / 9.
* Tool `<archive>/fb/mk014.py <mon>`. Page 3 / 3 each.

Code in `docs/render/shells.js`, the IODROME / GIADROME block. `R` = the consuming instruction read.

Each drome has its own three shell classes, and they are **one code twice**: Iodrome's at `0xd96280..`, Giadrome's at `0xd96cb4..`. The
instructions are equal except the child id (0x90 / 0xc4) and the literal pools; diffed for the readers, and checked against the ROM run
for both.

| | sp_00 (base00) | sp_01 (base01) | sp_13 (base13) |
|---|---|---|---|
| Iodrome | 0x8f, vtable `0x17a94a8` | 0x90, `0x17a9624` | 0x91, `0x17a9794` |
| Giadrome | 0xc3, `0x17a9914` | 0xc4, `0x17a9a90` | 0xc5, `0x17a9c00` |

## 1. What creates (trgen `d14cap.py`)

| monster | action | clip | frame (phase 1) | shell, mode |
|---|---|---|---|---|
| Iodrome | (7, 0x06) / (7, 0x0e) / (7, 0x28) | L4 M2 / M3 / M1 | 88 / 108 / 120 | sp_00 0 / 2 / 4 |
| Iodrome | (7, 0x2a) | L4 M2 | 84 | sp_13 0 |
| Giadrome | (7, 0x3c) / (7, 0x3e) / (7, 0x40) | L4 M2 / M3 / M1 | 88 / 108 / 120 | sp_00 2 / 2 / 5 |
| Giadrome | (7, 0x42) | L4 M2 | 84 | sp_13 1 |

## 2. The classes (R whole)

**sp_00.** Reader `0xd96280`; base00's init.
* Reader:
  - ef 0..3; hit 0; int 0: the joint.
  - floats: **0 X deg +0x15ec, 1 Y deg +0x15f0, 2 vz +0x15f4, 3 vy +0x15f8, 4 the flight +0x15fc**.
  - &vec 0: the offset. &vec 1: the gravity.
* A first transcription shifted the floats by one. It assigned each `mov r1, #k` to the bl before it, not after; the check caught it,
  init velocity (0, 72, 0) vs the ROM's.
* Landing `0xd963d0`, state 1 only:
  - type 1: ef 2; with the owner active and mode <= 5, sp_01 of the table at the contact, with its words +0xfe8.. and +0x3c its +0x13dc.
    The table is Iodrome `0x169c6f0` (0 1 0 1 2 3) or Giadrome `0x169c710` (0 0 1 1 2 3).
  - type 0: ef 1. type 2: ef 3.
  - then `0x3f8970` and the end.

**sp_01.** Reader `0xd96690` / `0xd970c4`.
* ef 0; hit 0; +0x15ec flags 4 from int 0, 8 from int 1; float 0 the timer; &vec 0.
* Life: its hit slot, (0, 120).

**sp_13.** Reader `0xd96868`.
* Reader:
  - ef 0..3; hit 0; int 0: the joint (-1).
  - +0x15e0: int 1 != -1 -> |= 2 (else & ~0x52), then |= 0x50.
  - floats: 0 speed, 2 gravity, 1 per unit, 4 far, 3 near, 5 life.
  - &vec 0 -> +0x161c and &vec 1 -> +0x1620: **two points**.
* base13's init with joint -1 (`0x404620..0x4046dc`):
  - The owner block's +0x40; **flag 2 is forced**.
  - The points' midpoint, p1 + (p2 - p1) x 0.5 (`0x404768..`), is turned by his words (`0x43ae70`).
  - The pitch ratio's second pair moves +0x40 the same way.
  - init13t now takes a second point (`k.vec2`).
* The thrown point: base13's 0x40 arm (from his block point) with 0x10 (his facing); shells.js `thrown008s13`.
* Landing `0xd96a00`, state 2 only:
  - type 1: ef 2 and vt+0x174 (`0xd96a90`): with the owner active, mode 0 / 1 -> sp_01 0 / 1 at the contact, its words, its +0x13dc.
  - type 0: ef 1. type 2: ef 3.
  - then `0x4042bc` and the end.
