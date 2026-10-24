# Carapaceons -- the shells: Hermitaurs (em019) and Ceanataurs (em020), beside their beams

Shells agent, 2026-10-18. Their beams (sp_02) were already built in `docs/render/beam-spawns.js` (dev/beams/em019_00.md,
em020_00.md). This note is everything else. It is transcribed in `docs/render/shells.js` (the CARAPACEONS block) and
checked by `dev/shells-carapaceons-check.mjs`: 10 / 10 against the ROM's own runs, with every control failing, and the
page check 3 / 3.

## 1. The ids and the census

**uEm019_00, vt+0x158 0xdc09d4.** It fills three id fields, chosen by variant:

| field | holds | variant 0 | variant 4 |
|---|---|---|---|
| e+0xcac8 | sp_01 | 0x99 | 0x9b |
| e+0xcacc | sp_02 | 0x9a | 0x9c |
| e+0xcad0 | sp_00 | 0x19d (no shell-table row: Daimyo makes no sp_00) | 0x9d (Stonefist's sp_00) |

Stonefist's sp_00 has (999, -1) in every mode.

**uEm020_00, vt+0x158 0xdc3e8c.** e+0xcad8 holds sp_02 (0x9e, variant 4 0xa0). Variant 4 also registers sp_01 0x9f.

**The censuses.** cengen11 ran over all 16 statuses, for both variants of each class. A second pass poked the id fields
with distinct ids so each create could be told apart (<archive> fb/cen019ids.txt). Only these sp_01 creates draw anything;
every other create is a hit volume with (999, -1):

- **Stonefist (7, 0xf2)** (fb/phq.py):
  - The jump runs L9 M11 -> (its end) L9 M12 -> (landed) L9 M13. Then phase 3 at f16 (0xb0968 mode 1, once: P+0x1a3)
    calls the maker 0xdb5ebc(e, 0, P+0xb0a).
  - That makes sp_01 [e+0xcac8] mode 0. Its setup: +0x10 the block point P+0x40, +0x30.. the block's words P+0x50..,
    +0x3c the halfword on variant 4 (0xffff on 0).
  - It shows ef 0 (0, 30) of its .shl's own list, em019_00c.
  - The class runs the same code at variant 0, but Daimyo's arc has no L9 list, so he never plays it.
- **Rustrazor, 14 actions** -- (7, 0xa / 0xb / 0xc / 0x17 / 0x18 / 0x19 / 0x30 / 0x47..0x4d):
  - The jump runs L2 M19 -> (frame) L9 M34 -> (end) L9 M35 -> landed. The landing (0xbf52c, 0xdbc9f4) sets phase + 1,
    the block's +0x44 to the ground +0x5b4, then L9 M36, and makes sp_01 0x9f mode 0 on that same update.
  - Its setup: +0x10 and the words +0x30.. are GOT zero vectors (0xdbcd2c / 0xdbcd4c).
  - It shows ef 0 (1, 31): list 1 of its .shl, em020_00c.

**Not built, by name** (hit volumes that draw nothing):
- the other sp_01 modes: Stonefist's 4..22 on L2 M7 / M8 / M1 / M2, L9 M14, L0 M21, L9 M10, L2 M11, and Rustrazor's (7,
  0xdb) L9 M25 mode 1;
- Stonefist's sp_00.

## 2. The readers, and base01's joint -1 arm

**uShellEm019_sp_01, reader 0xdcd998:**
- ef 0; hit 0;
- +0x15ec: 4 from int 0, 8 from int 1, 0x1000 from int 2;
- float 0 the timer; &vec 0 -> +0x1608.
- Mode 0 is therefore flags 0x1000 (the hit side), timer 0 and vec zero: the setup's point and words.

**uShellEm020_04_01, reader 0xdcde78:**
- ef 0; hit 0;
- +0x15ec bit 0 from int 0 != -1; int 1 is the joint +0x15e4.
- It reads no vec and no timer.

**base01's init, joint -1 arm (0x3fa8e4..0x3fa9ec), now READ:**
- It clears flag 2.
- It copies the matrix held in the global at 0x172d744. That matrix is filled at run time and is NOT READ.
- The base is the owner's block point +0x40 (not the matrix's row 3), and the vec goes through the matrix's 3x3.
- shells.js init011 takes this arm for a zero vec: the result is the block point whatever the matrix holds. A non-zero
  vec is refused by name.

## 3. The viewer

**Rows:**
- `SHELL_DATA.em019_04.shell01` (lists 0 = em019_00c), with actPlain (7, 0xf2) L9 M13 f16.
- `SHELL_DATA.em020_04.shell01` (lists 1 = em020_00c), with actPlain (7, 0xa) and 13 more L9 M36 at the start. That row
  carries two flags: `landY` (the block point at the ground's height) and `words0` (the zero words).
- makePlain gained these two row options.

**Records exported:**
- em019_04: em019_00c 30;
- em020_04: em020_00c 31;
- em019_00: em019_00c 30 too, before Daimyo's row was dropped. No row uses that record.

**Checks:** soaks of em019_04 and em020_04 are clean, and dev/checks/em019_00 passes 61 / 0.

**Harness:** emu_fb gained a step option, `landed`, which answers 0xbf0bc / 0xbf52c with 1 for the step.

**Controls**, all of which fail: the facing, and the owner moved (3 higher for Stonefist, 30 off for Rustrazor).
