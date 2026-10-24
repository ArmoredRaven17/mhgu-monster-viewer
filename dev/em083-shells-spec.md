# Gammoth / Elderfrost Gammoth (em083_00 / em083_04) -- shells spec (shells agent, 2026-10-18)

Class `uEm083_00` (band `0x104f8c8..0x1064be0`, action main `0x1050a1c`), both variants (byte `e+0xb5f5`: 0 Gammoth, 4
Elderfrost). Census: <archive> `fb/cen_em083_v0.txt` / `cen_em083_v4.txt`; files `fb/shl_em083_00.txt` / `_04.txt`; hitdata
`fb/hit.py`. Ids: `e+0xcae0` sp_00, `+0xcae4` sp_01, `+0xcae8` sp_13 (0x161 / 0x163 / 0x164 for variant 0; 0x165 / 0x168 / 0x16a
for 4, written by `0x105f164`); sp_00_02 0x162 an immediate.

## GAMMOTH (variant 0) -- DONE

Transcribed: docs/render/shells.js `SHELL_DATA.em083_00` (params083s00 / s002 / s01 / s13, init083s13, hold083s13, post083s13,
pieces083, landing083s002 / s13, make083s13, spawn083, snow083). Check: dev/shells-gammoth-check.mjs (28 / 28: 18 ROM cases, 4
contract, 6 controls FAIL), page 17 / 17, soak em083_00 80 motions 0 refused. Records exported: u 1, 2, 31, 32, 41, 42, 51, 52,
60, 61, 70, 80.

### 1. The actions -- READ

Frames are the actiontune floats (`0x6f618`): 0 / 1 245, 2 80, 3 190, 4 76, 5 90, 6 44, 7 100, 8 220, 9 266, 10 / 11 / 13 26,
12 / 14 / 15 18 (both variants' tables equal).

- L2 M61 (7, 0xc9..0xcb) f26 / (7, 0xcc / 0xcd) f28, L2 M62 (7, 0xce..0xd2) f18: sp_00 0; (7, 0xd3) / (7, 0xd4): sp_00 1 / 2
  (`0x105c738`).
- L2 M23 (7, 0x1d / 0x7a / 0x7d) sp_13 0, (7, 0x1c / 0x79 / 0x7c) 1, (7, 0x1b / 0x78 / 0x7b) 2 (`0x10606f4`): the variant-0 arm
  tests 220 (`0xb0968` mode 0) -> `e+0xcb0c = 1` and the maker `0x105f94c`; 266 -> `e+0xcb0c = 2`. (Variant 4 uses `0xb0974` and
  `0x105faec`: Elderfrost's.)
- sp_01 at the owner's point and words: L2 M5 (7, 4) / L2 M50 -> M5 (7, 0x45) 245 mode 7; L2 M9 (7, 0xa) 80 mode 8; L2 M14
  (7, 0xe) 190 mode 17; L2 M15 (7, 0xf / 0x87 / 0x88) 76 mode 11; L2 M20 (7, 0x12..0x14, 0x20..0x22) 90 mode 9, its L2 M21 44
  mode 10 and 100 mode 9; L2 M37 (7, 0x5a / 0x5b) 172 mode 37; L2 M39 -> M37 (7, 0x5c / 0x5d) 172 mode 38.
- The action setter (`0x10518e4..0x10519bc`): `e+0xcb0c = 0` at the start of every action but status 7 0x1b..0x1d /
  0x78..0x7e -- a held snowball ends on its next update.

### 2. The readers -- READ whole

- sp_00 `0x1062afc`: flags 4 always, 1 int 1 (X aim), 2 int 2 (Y aim), 8 int 3; floats degX, degY, X clamp, Y clamp, flight, vz;
  vec 0 the offset, vec 1 the aim offset `+0x1618`. Base landing `0x3f8878`.
- sp_00_02 `0x1063054`: flags 0x38 (the request's point and words, the offset by the words); vz float 0; gravity (0, -float 1,
  0); no flight -- it lives while hit slot 0 is on (hitdata (0, 300)).
- sp_01 `0x10637c4`: 1 int 0, 2 int 2, 0x800 int 3, 4 int 4, 8 int 5, 0x1000 int 6; joint int 1; `+0x15e8` int 7; timer float 0;
  vec 0 the offset, vec 1 the degrees (`+0x160c`).
- sp_13 `0x1063b2c`: `+0x15e0` = 1 (state 1: HELD) | 2 (int 1); floats speed, the arc's height, life, far, near, per unit; vec 0
  both points, vec 1 the thrown point's offset; at G rank (`0x3a8430 >= 5`) `+0x168c` = mode + 1 for modes 0..2, ef 2 / 3 ->
  `+0x1680` / `+0x1684`, hit 1 -> `+0x1688`.

### 3. The snowball -- READ whole

- state 1 `+0x15c 0x1063f20`: anchor; +0x40 = joint 157's world point (`0xc164c`) + vec 0 through its 3x3; `e+0xcb0c` 0 -> the
  end, 2 -> thrown (state 2, the thrown point `vt+0x168`, the launch `0x404dc8`, the velocity by the Y word).
- vt+0x28 `0x1064354` (the walker runs it after the update): state 2, once, `+0x168c >= 2`, `+0x44 <=` the anchor's y: ef 2 at
  +0x40 (mode <= 2, owner active), the pieces `0x1064514`, `0x329c40(+0x1674, 1)` and ef 3 started into `+0x1674` (the viewer:
  start kind `reflight`, schedule.js replaces the shell's request), hit 0 = hit 1, `0x404fa0`.
- the pieces `0x1064514`: the flat unit direction target -> shell; mode 1 one sp_00_02 0xb aimed at target + 1500 along it;
  mode 2 two, 1 / 2, at target + 1000 along it + 1200 either side (the turn by the constants -4.371e-8 / 1.192e-8); each set at
  the shell's point with the pitch / yaw words toward its aim point, inited at once.
- landing `0x1063d7c` (state 2): mode 0 camera 7 + sp_01 0; 1 / 2 camera 5 + sp_01 1 / 2; 6 camera 5 + sp_01 41; 3..5 nothing (it
  flies on). sp_00_02's landing `0x1063148`: camera 5, sp_01 2 (mode < 10) / 1, the end.
- sp_01 `+0x150 0x1063984`: mode 11 ends when the owner's motion is no longer its init's (`+0x1620`).
- Not modelled, by name: the `+0x158` overrides `0x10632bc` / `0x1064158` hit ANOTHER em083 (`u16 e+0xb5f0 | 0x400 == 0x453`)
  -- a second monster the viewer never has.

### 4. base00's Y aim -- a correction

`0x3f9cc4`'s flag-4 arm (`0x3f9de8`) joins the clear arm at `0x3f9e0c`, which passes `[+0x1618]` to `0x3f9b58`: the aim offset
applies on both arms. shells.js yAdjust37 left it off the flag-4 arm; fixed 2026-10-18 (sp_00 mode 1: Y word 70455 with it, the
ROM's; 68757 without). Every other check re-run after the fix: 19 shells checks and em023_00 / em023_05 / em061_00 / em065_00 pass.

## ELDERFROST (variant 4) -- DONE (one named gap, 5)

Transcribed: docs/render/shells.js `SHELL_DATA.em083_04` (Gammoth's rows on his files plus his own: turn083, the mode-4 arm of
params083s00, params083s003, params083s132, SNOW083C, params083s040, make083row). Check: dev/shells-elderfrost-check.mjs (29 / 29:
19 ROM cases, 4 contract, 6 controls FAIL), page 26 / 26, soak em083_04 94 motions 0 refused; dev/checks/em083_04.mjs 54 / 0.
Records exported: u 1, 2, 31, 32, 41..44, 51..55, 60, 62, 70, 80, 100, 101, 150. Ids: e+0xcae0 0x165 (uShellEm083_sp_00), +0xcae4
0x168 (sp_01), +0xcae8 0x16a (sp_13); immediates 0x166 (uShellEm083_04_00, folder 00_02), 0x167 (uShellEm083_sp_00_03, 00_03),
0x169 (uShellEm083_04_02, 02), 0x16b (uShellEm083_04_13, 13_02) -- folders by the ids' order (INFERRED).

### 1. The actions -- READ

- Gammoth's L2 M61 / M62 / M5 / M9 / M14 / M15 / M20 / M21 / M37 rows on his files (the tune tables are equal).
- L2 M23 (7, 0x1d / 0x1c / 0x1b, 0x78..0x7d, and (7, 0x7e) mode 4): the variant-4 arm of `0x10606f4` -- `0xb0974` at 220 ->
  `e+0xcb0c = 1`, `0x105faec` (0x16b setups, the zero vector's point and words); 266 -> 2.
- L9 M6 (7, 0x6f; `0x105adf8`): phase 0 -- L9 M6, the leap's landing point written into the target slot (no shell reads it),
  sp_01 16 / 18 (`0x1060d4c`: the zero point, the owner's block words); phase 2 = L9 M7: sp_00_03 0 / 1 at tune floats 0xb7..0xba
  (12, 12, 47, 47; `0x1060be8`).
- L9 M8 (7, 0x72; `0x105b674`): sp_13 6 at 0xbb (30, `e+0xcb0c = 1`, `0x1060c9c`), thrown at 0xbc (100).
- L9 M11 / M14 (7, 0x70 / 0x71) f30 sp_01 30 / 31; L9 M19 (7, 0x75 / 0x83 / 0x85) / M23 (7, 0x76 / 0x84 / 0x86) f120 26 / 27
  (`0x105f4ac`).
- L9 M15 (7, 0x77 / 0x81) f95: sp_00 4 (`0x1060aa4`): joint 157's point with y = the owner's + 100, the Y word the owner's +
  `e+0xcb10` degrees. `e+0xcb10` is the action setter's (`0x1051ebc(e, r1, r2, r3)`, table `0x1051944`: (7, 0x77) 0 / 1 / 1,
  (7, 0x81) 0 / 1 / 0, (7, 0x69) 1 / 1 / 1, (7, 0x80) 1 / 1 / 0): the bearing from joint 102 (r2) to the target against the
  facing, wrapped to [-180, 180), clamped to +-min(90, tune int r3 ? 0x35 : 0x36) = 15 / 90.
- L9 M17 (7, 0x6c) f111: the beam 0x169 -- its one mode's arc entry is [(0, -1), (0, -1)]: it starts no effect, so it is not
  made (render/beam-spawns.js's rule).

### 2. The readers / classes -- READ whole

- sp_00 mode 4 (`0x1062d30..0x1062ee0`): flags `(f & ~0x3b) | 0x38`; the reader aims the request itself from its point at the
  target + vec 1: Y = uxth(Y + clamp(aim - Y, [+0x1608, +0x160c])), X = X + uxth(clamp(pitch - X, [+0x1600, +0x1604])).
- sp_00_03 `0x1063568`: joint -1 (the owner's point, the offset vec 1 turned by its Y word), flags 0 (the owner's words), floats
  1 degX, 0 degY, 2 vz, 3 vy, 4 flight, gravity vec 0; base landing.
- 04_13 `0x10619a0`: Gammoth's sp_13 map but floats in the order speed, height, life, far, near, per unit; int 4 -> flags 4 |
  0x10 (the thrown point's flag-4 arm 0x405990: [+0x162c] + [+0x1624] turned by the owner's facing); int 3 -> +0x1690, the split
  when >= 2 at every rank; ef 1 / 2 the split's / the flight after it; mode 4: vec 3 turned by the target's bearing (`0xaf4f8`)
  clamped to +-80 degrees. Init `0x10622f4`, hold `0x1061ef4`, landing `0x1061d6c` (0 / 1 / 2 as Gammoth's, 3 nothing, 4 sp_01
  34), vt+0x28 `0x106236c`, pieces `0x1062530` (0x166; 0x1064514's code).
- 04_00 `0x1061084` = sp_00_02's map; its +0x13c `0x106128c` spreads the request's words by floats 2..5 (two RNG draws when int
  0 != 0) -- all 0 in his files (params083s040 refuses any other); landing `0x1061158` = sp_00_02's (id 0x168).

### 3. Harness options added (<archive> fb/emu_fb.py)

`precall` (the owner's own call before the steps: the setter arm), `noTurn` (0x783fc answered: the viewer's facing is its
input), `rng0` (0x3f76d8 answered 0: the pieces' init draws times zero floats), `noEm`, `slot0Depths`, `post28`.

### 5. Closed 2026-10-18 (were open)

- THE TRUNK SNOW's sp_01 20 (u 62 on joint 157): `0x1060e28(e, tune int)` is called from the actions at `0x1057fc8` ((7, 0x10 /
  0x35), L2 M16 phase 1, f158 = tune float 0x53, dmg tune int 0x22 = 999), `0x1058328` ((7, 0x11 / 0x36), L2 M16, f165, dmg 999)
  and `0x10590d4` ((7, 0x42), L2 M19, f85, dmg int 0x24 = 0) -- found by the census with the gate held open (<archive>
  `fb/cen_armour.py`). The gate `0x1053d8c(e, 1, dmg)` is the trunk snow's hit (slot 5, e+0xcb64): 0 / 4 never; 1 breaks at any
  damage on variant 4; 2 / 3 when dmg x the rate takes part 1's durability (P+0x3cc) to 0 -- and `0x9d36c(e, 1)` (part 1's break
  level) must be 0. The viewer drives it from the trunk row shown (motion-states.js `trunkSnow083`, index.html shellExtra
  `trunkSnow083`); the durability is not an input (999 taken to break 2 / 3: INFERRED). ROM-run per slot (e01_10_s0 / s2 / s4,
  e01_11_s3, e01_42_s1 / s2).
- `0x105f1a8` is the class's vt+0x1b4, called only by its vt+0x1ac `0x105ee88`: per the owner's motion (L2 M6 / M25 / M26 / M33 /
  M56 / M57, L3 M12) at frames, kind 0 / 1 / 2 -> sp_01 14 / 13 / 12, and L2 M33 (0x221) sp_01 15 -- hit volumes with no effect,
  left unbuilt.
- THE FOLDERS are READ: the shell table `0x175c3e8` row's res (`0x48b79c` -> `0x152530`) names the file through `0x159daa0`'s
  ~crc32 path hashes; 0x161..0x16b = em083_00_shell00 / 00_02 / 01 / 13, em083_04_shell00 / 00_02 / 00_03 / 01 / 02 / 13 / 13_02
  (<archive> `shellres.py`) -- the order taken before, now read.

## 6. THE LEG SNOW (2026-10-20, shells agent's decode helper; <archive> gapG/RESULT.md) -- BUILT

- `0x105fd94` (callers 0x1057224 / 0x105781c / 0x1059e3c / 0x1059f70 / 0x105b4bc): `0x1053710` sets four leg flags from the action
  number's frame tests ((7, 0 / 0x32) L2 M1 f116 leg 0; (7, 1) L2 M2 f100 leg 1; (7, 5 / 6) L2 M6 f208..390; (7, 0x5a..0x5d) L2 M37
  f170 / 172; Elderfrost's (7, 0x70 / 0x71) L9 M11 / M14 f30), each through the snow-armour gate `0x1053d8c` on slot k; a set flag
  with part 2 + k unbroken makes sp_01 3 + k (u 60 / u 61) at the block with its words; then `0x1054624(e, k, 0)` sheds the slot.
- Gammoth's sp_01 20 is never made (0x1060e28's mode-20 setup is Elderfrost's id 0x168, behind e+0xb5f5 == 4).
- Viewer: input.legSnow083 (motion-states.js legSnow083, the leg rows' levels), make083row `legSnow083`, LEG083 rows. Checks:
  dev/shells-gammoth-legsnow-check.mjs 18/18 (ROM), shells-gammoth / -elderfrost unchanged.
