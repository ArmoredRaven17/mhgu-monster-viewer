# Uragaan (em045_00) and Crystalbeard (em045_04) -- their shells (shells agent, 2026-10-19)

Class `uEm045_00` (action main `0xe9bb88`). The ids come from the enemy fields: e+0xcb14 for sp_01, e+0xcb18 for sp_13. Uragaan's
emulator check is `dev/shells-uragaan-check.mjs` (tool `<archive>/fb/mk045.py`): 10 / 10 (6 cases, 3 controls each failing, the
contract), page 3 / 3. Crystalbeard follows in section 4.

## 1. Uragaan -- what creates (the census of his reach)

| action | clip (phase) | frame | shell, mode |
|---|---|---|---|
| (7, 0x00) | L2 M1 (1) | 180 | sp_01 0xdf mode 0 (u 200) |
| (7, 0x8a) | L2 M10 (4) | 226 | sp_01 mode 0 |
| (7, 0x8e) | L2 M16 (1) | 202 | sp_13 0xe0 mode 0 (u 50) |

* sp_01 request (`0xe94d5c..0xe94e18`, R): `0x3fa2bc(0x40)`. +0x10.. holds **his own +0x40..**, +0x20.. a GOT zero vector, +0x30.. his
  words, +0x3c P+0xb0a.
* sp_13 request (`0xe98a70..0xe98b18`, frame test `0xb0968(e, 0, 0, F)`, R): `0x4041a8(0x40)`. +0x10.. and +0x20.. hold a GOT zero
  vector, +0x30 0, +0x34 0xffff.

## 2. sp_01 `uShellEm045_sp_01` (vtable `0x17c3614`, base01)

Reader `0xe9dec8` (R whole):
* ef 0 -> +0x15c8; hit 0 / 1 -> +0x15d8 / +0x15dc; int 0 -> the joint +0x15e4.
* The +0x15ec flags (bfc / orrne over the ctor's 0): int 0 -> bit 0, int 2 -> 0x800, int 3 -> 4, int 4 -> 8, int 5 -> 0x1000. Int 1 is
  not read.
* vec 0 -> +0x1608. There is no timer, so the shell lives while its hit slot does (em045_00_01_hitdata (0, 4) (2, 6) (0, 10) x 3).
* Mode 0 is flags 0x100d: the joint (3) path, the ground snap and its angles.
* **The first transcription read the flags one int early** (int 1 -> 0x800 ...): `mov r1, #k` comes before each `bl 0x4a2470`.
  Corrected before any check passed, so it is not in the Withdrawn table. The check's u00 (y 241 vs the ROM's 0, the missing snap)
  caught it.

+0x158 `0xe9e010` is the hit side (two slots). It is not visual.

## 3. sp_13 `uShellEm045_sp_13` (vtable `0x17c3784`, base13)

* Reader `0xe9e1f8` (R whole):
  - ef 0..3 -> +0x15c8..+0x15d4; hit 0; int 0 -> the joint +0x15e4; int 1 -> +0x15e0 bit 1.
  - floats 0 / 2 / 1 / 3 / 4 / 5 -> +0x15ec (the speed 22.5) / +0x15f4 (gravity -1.0) / +0x160c (the speed per unit 0.0125) / +0x1600
    (far 4000) / +0x15fc (near 800) / +0x15f8 (life 500).
  - &vec 0 -> +0x161c and +0x1620.
* base13's init `0x4044d8`, the arms this reader takes (R):
  - +0x40 is the joint's row 3 (143).
  - The two points meet at 0.5. **Bit 1 set turns that midpoint by the OWNER's words** (`0x43ae70`); with bit 1 clear the joint's 3x3
    turns it, `0x4047b0`. A reader with no joint goes the owner's way and sets bit 1 itself (`0x4046c8`). Bit 3 clear: no size.
  - Then the aim word +0x16c and the launch `0x404dc8` (R whole: Gravios's form).
* Landing `0xe9e380` (state 2):
  - The param by type: 0 -> +0x15cc, 1 -> +0x15d0, 2 -> +0x15d4.
  - Then vt+0x174 `0xe9e408` (owner active `0x4a0f38`) makes **shell01 [owner+0xcb14] mode 4** at the contact, with +0x30.. this
    shell's words and +0x3c its +0x13dc. It makes **mode 5** instead at variant 4 when the quest number `0x49930` is > 8.
  - Then base13's landing effect `0x4042bc` and vt+0x148.

## In the viewer and checked (Uragaan)

shells.js covers this with params045s01 (READERS01), params045s13 / init045s13 / make045s13 / landing045s13 (LANDING13), spawn045
(code 'em045') and SHELL_DATA.em045_00.

`dev/shells-uragaan-check.mjs` 10 / 10 runs both sp_01 rows (turned too) and the sp_13 throw (plain, far, near and turned) with its
landing's sp_01 4. The controls (joint 3, the target, joint 143) each fail. The page shows L2 M1 / M16 making their shells. **Records**
em045_00u 200 / 50 / 30 are not exported, so the slot request carries them.

## 4. Crystalbeard (em045_04, variant 4) -- sp_00 0xe2, sp_01 0xe3, sp_13 0xe4 and the crystals sp_32 0xe5 (base32)

The ids come from e+0xcb10 / +0xcb14 / +0xcb18 / +0xcb1c. Emulator check `dev/shells-crystalbeard-check.mjs` (tool `<archive>/fb/mk045c.py`):
15 / 15 (11 cases, 3 controls each failing, the contract), page 4 / 4. The census of his reach (trgen c45cap.py / c45cap2.py):

| action | clip (phase) | frame | shell, mode |
|---|---|---|---|
| (7, 0x00) | L2 M1 (1) | 180 | sp_01 8 (u 200) |
| (7, 0x8a) | L2 M10 (4) | 226 | sp_01 8 |
| (7, 0x8e) | L2 M16 (1) | 202 | sp_13 0 (u 50) -> its landing's sp_01 5 (quest > 8) or 4 |
| (7, 0xe5) | L9 M3 (0) -> L2 M10 from 94 (1); (2) / (5) | 100 / 110; 226 | sp_32 26 / 24 (no joint); sp_01 8 |
| (7, 0xe6 / 0xea) | L9 M1 (1) | 114 | sp_00 8 / 0 |
| (7, 0xe7 / 0xeb) | L9 M2 (1) | 114 | sp_00 10 / 2 |
| (7, 0xf4..0xff) | L2 M4 (1) | 202 (sites `0xe9a498` / `0xe9a53c` / `0xe9a600`) | sp_32: f4 3 4 5, f5 30 4 5, f6 3 31 5, f7 3 4 32, f8 4, f9 31, fa 9 10 11, fb 36 10 11, fc 9 37 11, fd 9 10 38, fe 10, ff 37 |

### 4.1 sp_00 `uShellEm045_sp_00` (base00; class ctor `0xe9db80`, reader `0xe9dbd0`, +0x150 `0xe9dd34`)

* Reader (R whole):
  - ef 0..3; hit 0 -> +0x15d8; int 0 -> the joint +0x15dc.
  - vec 0's z / y -> vz / vy; vec 3's x / y -> the degree offsets +0x15ec / +0x15f0.
  - &vec 2 -> the offset +0x1610; &vec 1 -> the gravity +0x161c.
  - +0x15e8 |= 5: the X aim from the shell's point.
* **Through the pointer the reader's `ldr r0, [r4, r0]!` left at +0x15e8**: [+0x1c] = +0x1604 = 22.5 and [+0x18] = +0x1600 = -45.0
  (the X clamp), [+0x30] = +0x1618 = &+0x1660. The first transcription read these as unit fields. emu_fb's new DUMPF (the fields after
  init) showed 0xc2340000 / 0x41b40000 there.
* His ctor `0xe9db80` (R): base00's, then +0x1660.. = (0, 65, 0), the aim offset.
* The landing is base00's shape.
* **The shards' life (shells agent, 2026-10-20).** Modes 0 / 2 / 8 / 10 carry no flight float, so base00 keeps them only while a hit slot
  is on, and their hitdata is (0, 9999). spawn045 now sets S.slots. Before that the page ended each on its first move, so u 60 / 62 never
  drew. The check's harness now holds 226's slots, and ce7 runs 700 frames (it is aimed high). 15 / 15; u 62 starts at the landing.
  The +0x150 `0xe9dd34` is READ, base00's shape (rom-map row; trap 127).

### 4.2 sp_01 / sp_13: Uragaan's classes (sections 2, 3)

The ids differ (0xe3 / 0xe4); the sp_01 modes are 0..10 and 13 (hitdata 13 rows).

### 4.3 sp_32 `uShellEm045_sp_32`: base32 (`0x415010..0x416290`, READ whole) and his class (vtable `0x17c3904`, slots to +0x160)

* **Reader** `0xe9e6dc` dispatches by id: 0xe5 -> `0xe9e928`, 0xe1 (Uragaan's, made by nothing in his reach) -> `0xe9e710`. The 0xe5 map:
  - ef 0 / 1 / 2; hit 0 / 1; int 0 the joint; int 1 the spin axis (% 3); int 2 the sound.
  - floats 0..9: the settled wait, the child period, the hp (not modelled), hop 1 / hop 2 time, the second wait, A's / B's distance,
    hop 1 / hop 2 spin.
  - vec 0 (y: degrees on his facing), vec 1 (the offset with no joint), vecs 2 / 3 (the hops' gravity).
  - cmn float 0: the probes' reach.
  - +0x1672 is a 0x16b4b4 draw (the periodic child's +0x3c, not visual).
* **Init** `0x415278`:
  - The live count (`[0x2129c98]`: the ctor `0x415010` += 1, the dtor `0x415180` -= 1) >= 7 -> deleted.
  - The words are (0, his +0x54 + the degrees, 0). +0x40 is the joint's position, or his +0x40 + vec 1 with no joint.
  - **Point A** = +0x40 + (dA sin, 0, dA cos) by that Y, at his ground, then the height probe `0x18154c`. **Point B** = A + (dB ...)
    the same way. A probe that is not below ground + reach -> deleted.
  - Then the axis, the words (0, axis << 14, 0), the timers, state 1, ef 0 at +0x40.
* **Move** (state 1):
  - The registry record (`0x48bf08`) 9 -> deleted, 7 -> the end.
  - Hop 1 to A over T1 (velocity (A - p) / T1, y + T1 x g.y x -0.5), spinning by hop 1's rate about the axis (0: X +=, 2: X -=, 1: Z +=).
  - At A: ef 1 at +0x40, then hop 2 from A to B over T2, the words preset so that hop 2's spin ends at 0.
  - At B: ef 1, +0x40 = B, settled, the words from the ground normal (`0x43b1a0`).
  - Settled: the wait, then the second wait (byte +0x1640), then the end. Each step +0x15c (`0xe9ee64`) makes **shell01 mode 10**
    every `period` frames (modes 30..38: 360).
  - Every flight step queries the stage; a contact goes to +0x154 `0xe9eb90` (type 0 / 2: ef 1, then the end; type 1: the end only on
    attribute & 0x1046).
* **End** `0x4161e8`: +0x150 `0xe9ed28` -> +0x160 `0xe9ebf0`, **the burst**: shell01 mode 9 for modes 24..26, else 4 (5 at variant 4
  with quest > 8), at +0x40 with its words. Then the 0xfe countdown.

The harness gains a `base32` case flag (emu_fb): the probe `0x18154c` answered by the floor plane, the registry `0x48bf4c` /
`0x48bf08` / `0x48c214` answered, the live count zeroed per case, and the base32 timer at +0x1630.

### 4.4 In the viewer and checked

shells.js has BASE32 (params045s32, make32, step32, end32, land32, child32), params045s00 (READER00 / AIMX00), spawn045's shell32 /
shell00 arms and SHELL_DATA.em045_04 (variant 4, 22 rows).

`dev/shells-crystalbeard-check.mjs` 15 / 15 covers:
- sp_01 8 and sp_13 with its landing child.
- sp_00 x 4: plain, turned and aimed high.
- One crystal (4, 10, 37 with its period's children, each to its burst at ~1650 frames) and three crystals (f4).
- (7, 0xe5)'s joint-less pair and sp_01.
- Controls (joint 143, his Y word, the target), each failing.

**Records**: em045_04u 30 31 32 33 34 40 41 50 60 61 62 70 71 72 80 200 230 are not exported, so the slot request carries them.
