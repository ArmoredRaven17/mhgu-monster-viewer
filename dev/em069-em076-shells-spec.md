# Seltas Queen (em069_00) / Seltas (em076_00) -- the shells

Shells agent for the Viewer agent, 2026-10-17. Raven: *"Seltas and Queen's projectiles are not being rendered."* Neither had a
`SHELL_DATA` entry. Transcribed: `docs/render/shells.js` (`SHELL_DATA.em069_00` / `.em076_00` and their `actions`, `act0697`,
`params069s00` / `params076s00` (READER00), `AIMX00` (init00's X aim), `landing069s00` / `landing076s00` (LANDING), `params069s01` /
`params076s01` (READERS01), base37 (`params076s37`, `turnXZ`, `aim37s`, `init37s`, `move37s`, `landing37s`, `make37s`), `aim076`,
`spit076`, `link076`, `spawn069`, `spawn076`, the stepShells / stepRock arms, `variantActionFor`'s `duo` pick) and
`docs/index.html` (`partnerRockInput` / `partnerShellExtra` / `partnerShellState` on his runtime's schedule, `herLinkedForShells`
in `shellExtra`). Map rows: `dev/rom-map.md` "Seltas Queen / Seltas -- the shells". Check: `dev/shells-seltas-check.mjs`.
Scratch (listings, harness): `<archive>/seltas/` -- `band69.txt` / `band76.txt` / `base37.txt` / `b37.txt` (sweeps), `fn.py`
(function starts and callers), `jt.py` (jump tables), `show.py` (a function with its literals), `shl.py` / `hit.py` (the files),
`emu_seltas.py` (the ROM run), `smoke.mjs`, `export_shells.py`.

Status words: **R** = the consuming instruction read; **I** = inferred; **NR** = not read; **E** = run on the ROM (unicorn).

## 1. The shells (R)

The shell table `0x175c3e8` (`efx/agents/narga-shell-scratch/shelltable.json` rows 295 / 296 / 313..315), the setup DTI = the base:

| id | class (vtable, ctor) | setup / base | own slots | files (.shl lists) |
|---|---|---|---|---|
| 0x127 | uShellEm069_sp_00 (`0x17e1f40`, `0xf9a88c`) | cSetupParamEmBase00 | +0x14c reader `0xf9a8ac`, +0x150 landing `0xf9ab08`, +0x164 `0xf9ac6c` (hit, type 5) | em069_00_shell00: 4 modes, [em069_00u] |
| 0x128 | uShellEm069_sp_01 (`0x17e20bc`, `0xf9add0`) | cSetupParamEmBase01 | +0x14c `0xf9adf0`, +0x158 `0xf9af5c` (hit) | shell01: 7 modes, [u, em069_00c] |
| 0x139 | uShellEm076_sp_00 (`0x17e77b0`, `0xfd97cc`) | Base00 | +0x14c `0xfd97ec`, +0x150 `0xfd9918` | shell00: 4 modes, [em076_00u] |
| 0x13a | uShellEm076_sp_01 (`0x17e792c`, `0xfd9b94`) | Base01 | +0x14c `0xfd9bb4` | shell01: 4 modes, [u] |
| 0x13b | uShellEm076_sp_37 (`0x17e7a9c`, `0xfd9d50`) | **cSetupParamEmBase37** | +0x14c `0xfd9d70` | shell37: 9 modes, [u] |

uShellEmBase37 (vtable `0x17519ec`) has this one subclass (the census of vtables with move `0x41bb10`). Every spawner names its
id as a literal (`movw #0x127` ...); so does base37's own landing (`movw #0x13a`, `0x41afd0`). The vtables' extents: base00
`+0x000..+0x170`, base01 `..+0x164`, base37 `..+0x160` (the next words 0, 0, then the next table).

Files (the .shl's own; hitdata (delay, duration)):

* Her shell00: ef (u 10, u 21, u 21, (999, -1)); modes 0..2 joint 1, offset (0, -80, 80), aim offset (0, 0, 80), vz 65, flight
  150, degX 0 / 2.5 / 6.5, degY 0 / 6 / -6, X clamp [-45, 45]; mode 3 joint 0, offset / aim offset (0, 90, 380), clamp [0, 90].
  hitdata (0, 99).
* Her shell01: 0 / 1 (999, -1) (hits only); 2 u 20; 3 / 4 c 31 (4: vec (0, 0, 400)); 5 c 32; 6 c 33. hitdata (0, 8) (10, 92) (0,
  10) (14, 10) x 4.
* His shell00: ef (u 1, u 21, u 21, (999, -1)); ints [144, 0, 0], vz 35, flight 200, no gravity; float 3 = 12 / 0 / -7 / 0 (read
  by no code of the class -- the spawner carries the same pitches in its own table). hitdata (0, 99) x 2.
* His shell01: 0 u 10, 1 / 2 u 20, 3 none; ints [0, 0]. hitdata (0, 10) x 4.
* His shell37: 0..5 (u 0, u 11, u 11, (999, -1)), 6..8 (u 1, u 21, u 21, (999, -1)); floats 11.25 / -0.75 / 0.0125 / 2000 / 300 /
  180 / spread (20 / -20 / 0, 20 / 0 / -20, 15 / 0 / -15); vecs 0..2: (0, 30, 0) (0, 0, 0) (0, 140, 0) | (0, 0, 0) (0, -90, 60) (0,
  120, 0) | (0, 0, 0) (0, 100, 0) (0, 275, 625); ints [144, 200, int 2, int 3] -> flags 2 / 0 / 1. hitdata (0, 99) x 2.

## 2. Who spawns them (R)

Her status dispatcher vt+0x1f4 `0xf9973c` (status byte e+0x73e0, table `0xf99764`; status 6 by e+0x73e1, table `0xf997e4`;
status 7 `0xf972a0`, table `0xf972c8`); his status 7 `0xfd7220..0xfd7390`. The clips are the duo agent's census
(`<archive>/duo/q_agg.txt`, `s_agg.txt`). Frames are the action code's crossings (`0xb0974`: pass001).

| action | function | clip | spawn |
|---|---|---|---|
| her (7, 0x09) / (7, 0x4f) | `0xf938c0` r1 0 / 3 | L4 M42 (`0x42a` b8; (7, 0x4f) from 90.0, `0xf93c5c`) | f100 / f110 / f120 shell00 0 / 1 / 2 (`0xf939a8` / `0xf93a58` / `0xf93b08`) |
| her (7, 0x0f) / (7, 0x22) | `0xf938c0` r1 1 / 2 | L4 M38 | none (`cmp r5, #3; cmpne r5, #0; bne`) |
| her (7, 0x38) | `0xf954f4` | L4 M20 (`0x414`) | f42 shell00 3, **only with P+0x1bb & 1** (`0xf95588`: Seltas linked on her) |
| her (1, 0x20) | `0xf8f5bc` (status 1 `0xf901b8`) | L4 M7 -> at its end L4 M24 | M24 f6 shell01 3 (c 31) |
| her (4, 0x04) | `0xf92d40` (status 4 `0xf92f34`) | L4 M7 -> L4 M24 | M24 f2 shell01 6 (c 33) |
| her (2, 0x14) | `0xf91bdc` (status 2 `0xf91ee8`) | L0 M27 -> L0 M28 -> on landing (`0xbf0bc`, 400) L4 M24 | at M24's setMotion shell01 5 (c 32) |
| her (2, 0x11) | `0xf91638` | L0 M66 -> L0 M67 -> on landing (698.5) or M67's end L0 M68 | at M68's setMotion shell01 6 (c 33) |
| her (6, 0x00) / (6, 0x04) | `0xf92358` r1 0 / 1 | L0 M66 | f170 shell01 5 (c 32); then L0 M72 |
| her (7, 0x36) | `0xf9514c` | L4 M4 -> at its end L4 M26 | at M26's setMotion shell01 4 (c 31, 400 ahead) |
| her (7, 0x00) / 0x04 / 0x14 / 0x47 | `0xf930b8` r1 0 / 2 / 1 / 2 | L4 M32 / M96 | f125 shell01 1 -- **no effect** (its hit): not a row |
| her (7, 0x33) | `0xf94cb0` | L4 M11 -> landing L4 M12 -> M13 | shell01 0 at the landing -- no effect: not a row |
| her (6, 0x03) / (12, 0x00) | `0xf92794` | L0 M1 -> L0 M71 | f156 shell01 0 -- no effect: not a row |
| his (7, 0x02) | `0xfd1e98` r1 0 | L2 M17 (`0x211`) | f66 / f84 / f104 shell37 3 / 4 / 5; at f66 joint 144 less his position -> P+0x30.. (the start of all three) |
| his (7, 0x0d) | `0xfd1e98` r1 1 | L2 M17 | none (`0x7ded8(e, 0, 0x10)` instead) |
| his (7, 0x07) | `0xfd2ce0` r1 0 | L2 M57 (`0x239`) | f66 / f82 / f98 shell37 0 / 1 / 2; the kept offset + 30.0 on y |
| his (7, 0x0c) | `0xfd2ce0` r1 1 | L2 M57 | none |
| his (7, 0x34) / (7, 0x3c) | `0xfd4834` r1 0 / 1 -> `0xfd4b00(e, 0)` | L4 M33 (`0x421` b8) | f68 / f88 / f96 shell00 0 / 1 / 2 (the shot counter P+0x1a2) |
| his (7, 0x39) / (7, 0x3d) | `0xfd4eb0` | L4 M33 | f66 / f88 / f96 shell37 6 / 7 / 8 |
| his (7, 0x3a) / (7, 0x3e) | `0xfd5350` | L4 M34 (`0x422`) | the same |
| his (7, 0x3f) (request 0x10) | `0xfd58ac` -> `0xfd4b00(e, 2 or 1)` | L4 M33 | f68 / f88 / f96 shell00 3 x 2 (the second 0x38e lower) |

His L4 M33 / M34 actions are issued only by his linked streams (`em076_00_cmdtbl` g1 s73 / s74 / s64; duo/s_emc.txt); 7:0x02 /
0x07 / 0x0c / 0x0d by his solo streams.

### 2a. His spit (R)

* `0xfd4924` (at the action's start; for 7:0x3f at its phase 3's sub-phase 0): from joint 144 (`0xc164c`) plus (0, 0, 0) turned
  by the yaw to the target (the literal 0.0, `0xfd4ae4`) to the target block +0x1d0: the word of atan2(-dy, h) in degrees, above
  180 less 360, at most 90, at least 0, back to a word -> `[+0xcac0]+6`; `[+0xcac0]+8` = `0x16b4b4`'s draw.
* `0xfd4b00(e, arg)`: at each crossing, the pitch word plus `0x16a17d4[k]` (0x889, 0, 0xfb07, 0: +12 / 0 / -7 degrees; k = P+0x1a2,
  then P+0x1a2 += 1 while k <= 2), wrapped and clamped as above -> X; joint 144's point; Y = block +0x54 plus, when linked
  (P+0x5c30), u16 of the parent's joint 200 yaw; arg 0 (variant 0): one shell00 of mode k (0 when k >= 3), arg 1 one of mode 3,
  arg 2 two of mode 3, the second's X + 0x38e. The base00 setup: +0x10 the point, +0x20.. (X, Y, 0), +0x2e the draw.
* The reader `0xfd97ec` sets 0x30: the point and the words are the request's; 35 a move along them, no gravity, 200 moves.

### 2b. His 7:0x3f, the repeats (R -- corrects the duo spec §14.3's NR)

`0xfd58ac` phases (table `0xfd59cc`): 0 M33 by the turn record, +0x6c = 0; 1 the turn to f40; 2 (`0xfd5ad8`) a turn by
+-11 degrees (first pass) / +-22 (repeats) over f40..60 / f100..120 (`0x76dd0`), then **M33 again from 40.0** b4 (`0xfd5dc0`); 3
(`0xfd5b08`) sub-phase 0 the aim `0xfd4924`, sub-phase 1 `0xfd4b00(e, +0x6c == 2 ? 1 : 2)` every update, at f100 +0x6c += 1 and,
while +0x6c <= 2, M33 again from 100 b4 (phase 2); else phase 4: the flag `+0x6b` at f105. **The repeats are unconditional**:
three spit sets (2 + 2 + 1 per crossing = 15 spits) before the flag. The viewer's 7:0x3f entry plays ONE M33 0..105 (the duo's
layout), so it shows the first set's six spits at his frames 68 / 88 / 96 -- the ROM's set comes after the turn's restart (M33 from
40 at its frame 60), and two more sets follow it. The duo layout is the duo agent's (render/monster.js ROM_PARTNER_BODY).

### 2c. Her spit (R)

Her reader `0xf9a8ac` (ef 2 and 3 swapped: ef 2 -> +0x15d4, ef 3 -> +0x15d0), flags bit 0 = int 1 (base00's X aim `0x3f9378`).
init00 places it at joint 1 (modes 0..2) / joint 0 (mode 3) plus the offset through the joint's matrix, takes her words, adds
the X aim -- the aim from HER position (+0x1614: the ctor's zero vector; flag 4 clear: aimFrom001) at the target plus the aim
offset turned by the aim's yaw, less her X word, plus degX, clamped (clampCircular) -- and degY. Gravity none (vec 1 zero).

## 3. The landings (R)

* Hers `0xf9ab08`: type 0 `0x43ac04(+0x15e0)` + ef 1 (u 21) **and shell01 2**; type 1 `0x43ac04(+0x15e4)` + ef 3 (nothing) + shell01
  2 (u 20); type 2 ef 2 (u 21) only. The shell01 setup: id 0x128, +0x10 the contact, +0x20 the zero vector, +0x30.. this shell's
  words, +0x3c its +0x13dc.
* His sp_00 `0xfd9918`: type 0 ef 1 (u 21); type 2 ef 2 (u 21); type 1 ef 3 (nothing) + shell01 (3 for mode 3, else 2).
* base37 `0x41ae14`: type 1 ef 3 (nothing; handle +0x1648) + `0x41af6c` (byte +0x15c0 = 1; shell01 0 for modes 0..5, 1 for 6..8);
  type 0 ef 1; type 2 ef 2. Then each `vt+0x148(0)`.
* shell01 (both): flags 0xc (hers: mode 2; his: all) -- the contact snapped to the ground (reach 1e6 / 500) and laid on it (the
  ground angles from the normal and the Y word), timer the ctor's 0: it lives while hit slot 0 is on ((0, 10) -> about 12 moves).

## 4. base37 -- his lob (R, whole)

* Ctor `0x41b078`: +0x15c8..+0x15d4 0, +0x15d8 / +0x15dc / +0x15e4 / +0x15e8 -1, +0x15e0 0, +0x15ec..+0x1604 0, +0x1608..+0x1610
  the shared zero vector, +0x1614 / +0x1618 / +0x162c / +0x163c 0, byte +0x1640 0, handles +0x1644 / +0x1648 0, state 0, +0x15a8
  0x25.
* Reader `0xfd9d70`: ef 0 / 1 / 3 / 2 -> +0x15c8 / +0x15cc / +0x15d0 / +0x15d4; hit 0 -> +0x15d8; int 0 -> +0x15e4 (the joint), int
  1 -> +0x15e8 (the link parent's joint); +0x15e0 bit 0 = int 2, bit 1 = int 3; floats 0 speed +0x15ec, 2 its growth +0x1600, 1
  gravity y +0x15f0, 4 the shortest throw +0x15f8, 3 the longest +0x15fc, 5 life +0x15f4, 6 spread +0x1604; vecs 0 / 1 / 2.
* Init `0x41b1ec`: the words (the owner's +0xfe8, the owner's +0xfec + the spread as a word, 0); +0x1614 = the life; bit 0: +0x40
  = the joint's point + vec 0, the yaw = (linked: the parent's joint +0x15e8 yaw +) block +0x54, from = his position + size x vec 2
  turned by it, T = the target + vec 1 turned by it, the aim, and -- with [+0xcac0]+0x50 and P+0x5c30 -- the velocity turned by
  the parent's yaw; bit 0 clear: +0x40 = his position + the request's +0x20.., from = joint 144 (bit 1) or his position + vec 1
  turned by block +0x54, T = the target + vec 2, the aim. Then the velocity turned by the OWNER's +0xfec word; the gravity (0,
  +0x15f0, 0); ef 0 at +0x40 -> +0x1644; the hit registration; state 1.
* The aim `0x41b844`: d = T - from; |d| < +0x15f8 -> x / z (and the y the next length takes) scaled to it; |d| > +0x15fc -> x / z
  scaled to it; h the level length; vz = +0x15ec + h x +0x1600, t = h / vz (0.5 when vz is 0), vy = (d.y - g t^2 / 2) / t with
  the UNSCALED d.y; (0, vy, vz) turned by u16(yaw(from -> T) - yaw(his position -> his target)), then by the spread.
* Move `0x41bb10`: the handle hygiene (+0x1644 / +0x1648); state 0xfe the ending (base00's: the timer, both handles); state 1
  vt+0x158 `0x41bc1c`: +0x1378 += dt, anchor = position, `0x539224`, the owner active, the timer +0x1614, the collide (base00's
  `0x43ac6c` / `0x43ac8c` query) -> vt+0x150. End `0x41bdf0`: stop +0x1644, `0x4a1de4`, state 0xfe, +0x1614 = 30 x 60.

## 5. Checked (E)

`dev/shells-seltas-check.mjs` part 1: each case's spawner run on the ROM (`emu_seltas.py`) at the frames its row crosses -- the
spit's aim and counter, the kept offset, the link parent (a fake unit whose vt+0xd0 returns the joint-200 matrix) -- and every
shell flown from the setup the ROM built (its ctor, the base's init with the class's own reader, the moves), the landings' shell01
from the setups the ROM's landings built. 19 cases equal bit for bit through stepShells (init, every move, every effect start and
point, every child); the controls (target, joint, facing, link yaw, her facing) fail. Part 4 (the viewer): solo Seltas L2 M17 / L4
M33 / L4 M34, solo Queen L4 M42 / M20 (none: alone) / M26, the combined list's 7:0x3f entry (his six spits from his runtime at his
joint 144, her three 7:0x4f spits after his flag) and her linked L4 M20.

## 6. In the viewer

* Solo: `SHELL_DATA.em069_00` / `.em076_00` on the body's runtime, as every shell monster. The picks (rockInput): his L2 M17 7:0x02 /
  7:0x0d, L2 M57 7:0x07 / 7:0x0c, L4 M33 7:0x34 / 7:0x39 (one per play, in turn; the no-shell twins included -- the AI's choice is
  not read); her L4 M24 1:0x20 / 4:0x04 / 2:0x14, L0 M66 6:0x00 / 2:0x11. Her raw L4 M20 makes nothing (she is alone).
* The combined list ('duo'): her shells on her runtime as on the raw clip (the schedule key is her raw clip, the duo agent's
  routing); `linked` (`herLinkedForShells`: him mounted and not released) opens her (7, 0x38) spit. HIS shells on HIS runtime
  (effect-mounts.js partnerEffectRuntime): `partnerRockInput` names 7:0x3f wherever her side is L0 M65 (her required L0 M65 entry and
  his 'Seltas Motion[33] with her 7:0x4e'), else his clip's picks in turn; `partnerShellExtra` gives his unit (the frame he is
  carried on, in game units), his own words zero while linked and the link word (u16 of the frame's Z axis yaw: her joint 200), the
  target TARGET_AHEAD along his facing on her floor. His runtime's live.js now also gets that target as its hunter and her floor as
  its stage floor (it read the main monster's absent hooks before).
* Records exported `when: 'shell'` (UNIQUE): em069_00u 10 / 20 / 21, em069_00c 31 / 32 / 33; em076_00u 0 / 1 / 10 / 11 / 20 / 21.

## 7. Not read / open

* The AI's choice between the paired actions (7:0x02 / 0x0d, 7:0x07 / 0x0c, 7:0x34 / 0x39, her L4 M24's three, L0 M66's two):
  the viewer's pick in turn stands in. His L4 M33 / M34 are shown solo though only his linked streams issue them.
* The target block +0x1d0 (the hunter): the viewer's stand-in (2100 ahead on the floor) for both, his along his facing.
* `0xc10d4` (his lob actions' phase 0: a prediction into `[+0xcac0]+0x10`) and the `0x16b4b4` draw (`+0x2e` of his spit setups):
  their consumers NR, not visual here.
* Her (7, 0x38)'s atan2 at f42 (`0xf95600..0xf95654`: computed, never stored -- dead) and the turns (`0x76c08`, `0x76dd0`): her /
  his facing is the viewer's.
* His 7:0x3f timeline in the viewer: rebuilt by the duo agent (2026-10-17) to the three sets of §2b -- 15 spits at the ROM frames,
  the third set the row `7:0x3f/3` (one a crossing); his turns are still not shown.
* The hit side (the registrations, type 5 / 0x1f, slot 1 of base37 `0x41bdb8`): not visual.
