# Ukanlos (em038_00) -- his body's shells (shells agent, 2026-10-19)

Class `uEm038_00` (action main `0xe62984`). His beams (`uShellEm038_sp_02`) and their children are render/beam-spawns.js /
beam-types.js's (dev/beams/em038_00.md). The body makes the same child class, **0xce `uShellEm038_sp_00` on base00** (reader
`0xe63400` params038c, +0x16c / init / landing as the beam children's). Emulator check `dev/shells-ukanlos-check.mjs` (tool
`<scratchpad>/fb/mk038.py`), 15 / 15. `R` = the consuming instruction read.

## 1. What creates (the census of his reach; the per-frame census finds none)

| actions | clip | maker | shells |
|---|---|---|---|
| (1, 0x08..0x13) (k = n - 8) | L2 M4 | `0xe5c168(e, k)` | the ice fall: mode 0 per shot, mode 1 the list's last |
| (1, 0x15) / (1, 0x18) | L2 M4 | `0xe5c790(e, 0 / 1)` (stubs `0xe5d1fc` / `0xe5cf48`) | the arena ice fall: mode 2 (shots 0..12), then 3 |
| (7, 0x03 / 0x0e / 0x04 / 0x05) (args 0 / 1 / 2 / 3) | L2 M12 f152 | `0xe602dc(e, arg)` | mode 6 x count `0x1625058`[arg] (3 / 3 / 2 / 2) |
| (7, 0x0b) | L2 M33 f160 | `0xe612ec` | mode 7 x 3 |
| (7, 0x1d) | L0 M9 -> f80 L4 M2 -> L4 M1 -> L4 M7 | phase 4 at tune 0 (60) | 23 + 24 (the target within tune 1 = 2000 flat), else 25 + 26 |

## 2. The makers (R)

* `0xe5c168(e, k)`: shot i = P+0x1a2; at the crossing of `0x169de2c`[i] (210, 246, 282, .., 570; 9999 ends); the k-th list
  `0x17bde48`[k] (bytes to 0xff) names an offset in `0x169de44` ((x, z) pairs, 30), turned by his Y word and added to joint 1's
  position; then world (0, 0, 2 v) with v = e+0x73e8 (the action setter's draw: H73E8_STANDIN 0) through i rounds of
  `v = v ? (v % 176) & 0x53 : 1` (`0xe5c28c..0xe5c2b4`; the angle it also makes, u16(u32(v x 2pi/65536)), is 0 for every v these
  give); **y = 6000.0 absolute**; 0x3f883c(0x30) +4 0xce, +8 the mode (1 when the next list byte is 0xff), words a GOT zero vector,
  +0x2e 0xffff; P+0x1a2 + 1.
* `0xe5c790(e, r5)`: shots at `0x169df34`[i] (210, 235, .., 525; 9999); each at a WORLD point of the table the static initialiser
  writes (`0xe62ecc..`: `0x2128fb0` for r5 0, `0x2129090` for 1; 14 points each, x / z read) plus (0, 0, 2 v), y = 6000; mode 2 while
  i <= 12, else 3. The viewer's origin is not the arena's: the points are taken as given (a stand-in, named).
* `0xe602dc(e, arg)`: phase 0 L2 M12 (0x20c, blend 4); phase 1 at 152 (0xb0968): per entry of `0x17bde24`[arg] (u16 dX, dY) a mode 6
  with words P+0x50 + dX / P+0x54 + dY / 0, the point a GOT zero vector -- mode 6 is joint 1 + (0, 0, 800) through its 3x3, the
  words the request's (int 3 0x20).
* `0xe612ec`: phase 0 L2 M33 (0x221, blend 2), ctl+0x4c.. = his words; phase 1 the blend partners (`0xb0df4` / `0xb13e4`, L2 M35 /
  M34); at 160 three mode 7, words P+0x50 / P+0x54 + 0xd555 / 0xc000 / 0xa38e (joint 3).
* (7, 0x1d) phase 4 (`0xe61980..0xe61ea4`): at tune 0 (60): (tune 1)^2 >= the flat distance^2 to the target -> modes 0x17 + 0x18, else
  0x19 + 0x1a; both at a GOT zero point and words -- those modes are joint -1 (his position, offset (+/-200, 0, 900) turned by his Y
  word) with his words and the Y offset +/-30 (+/-15).

## 3. In the viewer

SHELL_DATA.em038_00 (beamsOnly dropped): shell00 = 0xce with every mode of em038_00_00 (27) and its hitdata; 20 rows (code 'em038',
`spawn038`); `WORDS00` gains uShellEm038_sp_00 (init00's ROM 0x20 arm -- the request's words -- in place of the other class's aim
by mode, which refused mode 6 / 7; the beam children set 0x10 and take the other arm, unchanged). Records u 0 / 1 / 10 already
exported (the beam children's).

## 4. Checked

`dev/shells-ukanlos-check.mjs` 15 / 15: (1, 8) five shots, (1, 0xc) ten, (1, 0x15) / (1, 0x18) fourteen each (the ROM's own
initialised tables), (7, 3 / 0xe / 4 / 5), (7, 0xb), (7, 0x1d) near and far; controls joint 1 along x, his X word 0x100, the target
beyond 2000 -- each fails. Page 4 / 4.

## 5. Named

* e+0x73e8 (the draw) is 0 in the viewer (H73E8_STANDIN), so the jitter is the one v = 0 gives.
* The arena points are world coordinates of his arena.
* The phase-1 turns / blends of these actions are not shells' business.
