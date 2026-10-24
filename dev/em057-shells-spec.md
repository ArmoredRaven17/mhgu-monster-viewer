# Zinogre (em057_00) / Thunderlord Zinogre (em057_04) -- their shells

Shells agent for the Viewer agent, 2026-10-17. The Fanged Wyvern effects agent found the shells unread (dev/em057-effects-spec.md 9:
"0xf7 / 0xf8 (variant 0) and 0xf9 / 0xfa / 0xfb (variant 4), 18 spawn sites ... shell records u 0 / 1 / 60 / 61 / 150 (+ Thunderlord's
16)"). Read from the ROM, transcribed in docs/render/shells.js (`SHELL_DATA.em057_00` / `.em057_04`, `actions057`, `spawn057`,
`perFrame057`, base18 `init18` / `step18` / `move18`, the readers `params057s01` / `params057s18` / `params057s11`, `create057s11`,
`endCreate057`, `landing057s18`), checked bit for bit against the ROM by dev/shells-zinogre-check.mjs. Index rows: dev/rom-map.md
"Zinogre / Thunderlord -- the shells". <archive>: `zs/` (band57.txt, base18.txt, the tracer tr57.py, the census cen4.txt, the
direct-call probe callf.py, the harness emu_zinogre.py).

## 1. The classes

One class uEm057_00 (vtable 0x17ca8ec); Thunderlord is `e+0xb5f5 == 4`. The class fills three id FIELDS every spawner reads:
`E+0xcafc` / `+0xcb00` / `+0xcb04` = 0xf7 / 0xf8 / **0x19d** (variant 0) or 0xf9 / 0xfb / 0xfa (variant 4). 0x19d is the shell
table's unset sentinel (0x175c3e8 rows 0..411): Zinogre has no sp_11 (no class, no file).

| id | class | vtable | ctor | base | reader | own methods |
|---|---|---|---|---|---|---|
| 0xf7 / 0xf9 | uShellEm057_sp_01 | 0x17cbad8 | 0xf05314 | base01 | +0x14c 0xf05358 -> 0xf0538c / 0xf05488 (by its id) | +0x150 0xf05730 (anchor = point + (0, 2000, 0) for modes 0..11 / 26..38: the hit side), +0x154 0xf057a4 (the end's shell11) |
| 0xfa | uShellEm057_sp_11 | 0x17cbc48 | 0xf059c0 | base11 (init 0x402fd8) | 0xf059e0 | +0x168 0xf05b20 (the create) |
| 0xf8 / 0xfb | uShellEm057_sp_18 | 0x17cbdbc | 0xf05ebc | **base18** (init 0x408980, step +0x160 0x408a10) over base00 | 0xf05ef0 -> 0xf05f2c / 0xf06140 | +0x150 0xf06314 (the landing) |

Files: em057_00 shell01 modes 0..13, shell18 0..5 / 42..51 / 54 / 55 (no 52 / 53); em057_04 shell01 0..45, shell11 0..1, shell18 6..9 /
14..40. Every .shl names EffectList [em057_0Nu]; shell11 names none. Thunderlord's shell01 ShellCmnParam ints [0, 0, 0], floats
[1500, 1500, 600, 600, 600, 600].

## 2. The readers (READ whole)

* **sp_01, Zinogre 0xf0538c**: ef 0 -> +0x15c8, ef 1 -> +0x15d0 (base01's 0x20 switch: the ef started at the hit's onset); hit 0;
  flags +0x15ec 0x4 = int 1 (snap to the ground), 0x8 = int 2 (the ground's angles), 0x20 = int 0 (the switch); vec 0 -> +0x1608 (the
  offset), vec 1 -> +0x160c (the words' degree offsets). The rest base01's ctor (joint -1, timer 0: each lives while its hit slot is
  on; reaches 500 / 500). Strike modes 0..11: flags 0x2c, u 60 -> u 61; rays 12 / 13: flags 0, u 150.
* **sp_01, Thunderlord 0xf05488**: the same, but int 0 -> the joint +0x15e4 and flag 1; 0x20 = int 1, 0x4 = int 2, 0x8 = int 3; then
  by the mode (table 0xf055e0): 0..11 / 26..37 cmn int 0 -> 0x10, reaches cmn floats 0 / 1 (1500); 17 / 18 cmn int 1, floats 2 / 3;
  21..25 cmn int 2, floats 4 / 5 (600). Base01's 0x10 has NO consumer (zs/flagscan.py: sp_01's and sp_11's every vtable method and their direct calls, 343 functions walked as CFGs with the word's pointer tracked through writebacks and stack spills; positive control: it finds every bit the ROM runs read -- 0x1 0x2 0x4 0x8 0x20 0x40 0x80 0x100 0x200 0x400 0x800 0x1000 (zs/flagreads.py) -- and no 0x10): set, never read.
* **sp_18 0xf05f2c / 0xf06140**: ef 0..3 -> +0x15c8..+0x15d4 in order (no swap); hit 0; floats 0 flight +0x15fc, 1 / 2 the X clamp
  +0x1600 / +0x1604, 3 vz +0x15f4, 4 degY +0x15f0, 5 the weave's amplitude +0x1660, 6 its period +0x1664, 7 vy +0x15f8; int 0 the joint;
  vec 0 the offset, vec 1 the gravity; flags = (flags & ~0xbf) | 0xa2 | (int 1 != -1): 0x20 the setup's words, 0x80 the offset times
  the size, 0x2 base00's Y aim (clamp [0, 0]: adds 0), 0x1 base00's X aim (Zinogre int 1 = 0, clamp [-30, 30]; Thunderlord -1: none).
  Zinogre only: int 2 == 0 -> 0x800 (base00 byte +0x15ac, hit side), int 2 -> +0x1620, which base00's init copies to +0x15bc (0x3f9318..0x3f9324) for the hit registration 0x43a8b0 (`0xcad9c(owner, +0x15bc)` at 0x43a91c, skipped when +0x15ac is 0 -- which 0x800 makes it): the hit side.
* **sp_11 0xf059e0**: the count int 0, the times floats 0..n-1 (mode 0: 0 / 18 / 38; mode 1: 0 / 68); nothing of base01's.

## 3. Base18 -- the weave (READ whole, base18.txt)

Ctor 0x4088fc (+0x1660 / +0x1664 / +0x1674 / +0x1678 0, +0x1668.. zero words, +0x15a8 = 0x12). Init 0x408980 = base00's 0x3f8b80, then
the clock +0x1678 = 0, the last offset +0x1674 = 0, +0x1668 = the X word (after the X aim), +0x166c = the Y word + u16(degY word)
(uxtah: degY a second time, base00 kept it off the Y word by flag 2), +0x1670 = 0. The move is base00's 0x3f96a0 -> 0x3f9738, whose
vt+0x160 is base18's 0x408a10: clock += dt; anchor = position; while clock < period: lateral = T[idx] x amplitude, idx = low 12 bits of
(1.5 x 2^23 + clock / period x 180 x 0.0174533 x 651.899) (the engine sine table 0x190f568: half a turn over the period), its change over
dt the velocity's x; vy = 0 if the gravity vec's y is 0 else kept; vz = +0x15f4; (y, z) turned by +0x1668, (x, z) by +0x166c; past the
period the velocity is kept. Then 0x539224 and the words from the velocity. Collide 0x3f99e0, the landing 0xf06314, the end 0x3f9ef4 are
base00's / the class's.

Base00's init on this class (0x3f8b80, read again for it): the 0x20 arm takes the setup's words (0x3f8c9c); bit 3 clear, joint -1: the
base the owner's +0x40, the offset turned by the OWNER's world matrix +0xb0 3x3 (0x3f8da0..: not the setup's yaw), THEN times the size
(0x3f8f9c: after the turn, 0xbe518), then added. shells.js init00 does this for `WORDS00` (uShellEm057_sp_18); its older owner arm
turns by the setup's Y word and scales first -- the same only when that word is the owner's and the size is 1 (rom-map trap 81).

## 4. Who makes them (READ: the class's own code; census zs/cen4.txt, every status-7 action x phase x charged x rage, both variants)

`charged` = P+0x5df3 (0x816d4), `rage` = P+0x518 (0x81670), rank 0x3a8430, quest 0x49930, actiontune (em057_04 only).

| site | clip / frame | what |
|---|---|---|
| 0xf00590 / 0xf010e8 (e, kind, which) from 0xefdaf4 / 0xef77b8 | L2 M31 f88 (which 0), L2 M32 f58 (which 1) | sp_18, setup words (P+0x50, [+0xcac0]+0x18, P+0x58) -- Thunderlord X = Z = 0; [+0xcac0]+0x18 = P+0x54 at the action's first update (0xefe014 / 0xef7e5c). Modes by kind: Zinogre 0/3, 1/4, 2/5 (+ 1/4, 0/3, 1/4 charged); Thunderlord 6,7 / 8,9 (kinds 0, 1), 14,15 / 16,17 (2), - / 36,37 (3); charged 18-20 / 21-23, 24-26 / 27-29, 30-32 / 33-35, - / 38-40 |
| 0xeefc34(e, k) from vt+0x2a8 0xeef638 | L2 M15 f117, M18 f117, M24 f6, M26 f72, M30 f89, M38 f138, M37 f138 (k 0..6) | Zinogre only, rank >= 5: sp_18 0x2a + 2k (+ 0x2b + 2k charged), the owner's words. 52 / 53 have no file entry |
| 0xef870c(e, k) from (7, 0x71) 0xef8478 | L0 M20, k = P+0x1a2 at 66 / 106 / 136 / 156 / 176 / 186 / 196 / 206 / 216 / 226 / 236 / 246 (Thunderlord charged: tune floats 0x2a.. 2 / 32 / 62 / 92 / 122 / 152 / 172 / 192 / 216 / 226 / 236 / 246) | sp_01 mode k (charged Thunderlord 26 + k): Zinogre at e+0x40, Thunderlord at the target; zero words |
| 0xefa834 (7, 0xa6..0xa9) | L2 M60 f18 (joint 40; L2 M61 joint 50 when [+0xcac0]+0x118) | the ray (0x183664, 100 above to 300 below, mask 0x40) -> sp_01 13; Thunderlord charged 45 / 39 enraged; (7, 0xa6 / 0xa7)'s 39 with +0x1654 (its end makes shell11 0) |
| 0xefd50c (7, 0xfb) / (7, 0xfc) | L2 M1 (joint 40) / L2 M2 (joint 50) f57 | the ray -> 12; Thunderlord charged 21 / 22 (their end makes shell11 0) |
| 0xefc044 (7, 0xe7..0xf0, 0xf8) | L2 M1 (joint 40) / L2 M2 (joint 50) f57 (the M40 / M41 actions on the M1 / M2 they go on into from 24) | Thunderlord charged only: the ray -> 19 / 20 |
| 0xef9554 (7, 0x55 / 0xc6 / 0xcb / 0xce / 0xd2) | L2 M30 at tune 0x3b (82) | Thunderlord enraged, charged, tail not severed (vt+0x370 0xa3bf4): sp_01 40 at e+0x40 (joint 145) |
| 0xefae84 (7, 0xe3) | L9 M1 at tune 0x27 / 0x28 (266 / 278) | rank >= 5 ? 41 / 42 : 14 / 38 at e+0x40, e's words |
| 0xefb470 (7, 0xdb / 0xe5) | L9 M4 phase 1 at tune 0x10 (2), charged | shell11 1 at e+0x40 |
| 0xefb470 (7, 0xdb) phase 2 | L9 M5 at tune 0x3d / 0x3e (204 / 216) | sp_01 43 / 44 |
| 0xef67a0 (7, 0x00 / 0xcf) / (7, 0x01 / 0xd0) | L2 M15 / M18 at tune 0x23..0x25 (116 / 122 / 128) | Thunderlord charged, quest >= tune int 12 (5): sp_18 24..26 / 27..29, the leaps' setup -- these actions do not write the heading |
| 0xf06314 (sp_18 landing) | type 1 | Thunderlord modes 6..9 / 14..17 / 36 / 37 -> sp_01 15 (u 12), 18..35 / 38..40 -> 16 (u 2); every type starts ef 1 / 2 / 3 |
| 0xf057a4 (sp_01 end) | +0x1654 (modes 21 / 22, the 39 above) | shell11 0 at its point and words |
| 0xf05b20 (sp_11 create) | its times | mode 0 -> sp_01 0x17 + k (23 / 24 / 25) at vec k turned by its Y word; mode 1 -> 0x11 + k (17 / 18) |

## 5. The viewer

* Inputs (index.html shellExtra): `charged` = the Charge State rung (Zinogre's Fully Charged, Thunderlord's Overcharged -- the rung
  playNow's `charged` reads); `action` = the play's action (playNow: the pick, or psl-mask.js CLIP_ACTIONS for L0 M20, L2 M1 / M2,
  L9) while that play is on screen. Rows: `ai` picks on L2 M31 (7:0x20 / 7:0x69 / 7:0x3d), L2 M32 (7:0x20 / 7:0x6b / 7:0x3d / 7:0x7a)
  and Thunderlord's L2 M60 (7:0xa6 / 7:0xa8); `act` rows resolved by the play's action (L0 M20 (7, 0x71), L2 M1 / M2, L9 M1 / M5);
  `always` rows (Zinogre's L2 M60, Thunderlord's L2 M15 / M18 / M30, L9 M4). The escorts are clip rows (perFrame057).
* THE HEADING ACROSS PLAYS (zs/headw.py / headw2.py: every action x variant): [+0xcac0]+0x18 is written by the leaps (P+0x54, L2 M31), by
  the aimed actions (the yaw to the target) on L0 M8 / M9, L2 M1 / M2 / M4 / M5 / M10 / M11 / M21 / M22 / M23 / M29 / M39 / M60, by the
  turn on L0 M12 (yaw - 0xe39), and by action on L0 M28 / L2 M30 / M40 / M41; shells.js `heading057` keeps it from the last writing play
  (the viewer's play order for the game's action order), unknown after a by-action play whose action is not known. The M32-only leaps and
  the trio read it (checked: an L2 M60 play then a (7, 0x7a) M32, the writer 0xef93d8 run on the ROM). STAND-INS, named: never
  written (or unknown), the clip-start yaw; the owner's +0xb0 3x3 is the
  unit's yaw turn (ownerTurn057: the viewer's owner is level); the ray 0x183664 answers from the stage stand-in's floor (stageQuery
  mask 0x10), as every stage query here.
* NOT MODELLED (not visual): sp_01's +0x150 anchor raise (the hit capsule's top); base00's 0x800 (+0x15ac) and +0x1620 (+0x15bc); +0x3c (P+0xb0a) of the
  setups; the hit registration (the switch's onset uses the shared slot model, input.hitLife).
* At G Zinogre's (7, 0xfb / 0xfc) never happen (the remap, dev/em057-effects-spec.md 11), so his L2 M1 / M2 ray (mode 12) is not shown
  (CLIP_ACTIONS gives (7, 0xe9 / 0xea): no Zinogre shell).

## 6. Checked

dev/shells-zinogre-check.mjs: 24 cases (both monsters, every site above but the ray of L2 M61 and the kinds' duplicates) bit for bit
against the ROM on the whole executable -- every shell's init, every move (460 a shell), every effect start, the children and theirs
(a landing's shell01, an end's shell11, its shell01s); the size / base-scale order case; the contract (picks, gates); eight controls
(the target, the heading, the facing, the size, a joint, the floor) FAIL. Records exported: em057_00u 0 / 1 / 60 / 61 / 150; em057_04u
0 / 1 / 2 / 10 / 11 / 12 / 60 / 61 / 70 / 71 / 150 / 160 / 170 / 171 / 180 / 210 / 220. Recorded (record_shells.py, L2 M31 7:0x20 and
`--level=1`) and lifted for u 2 / u 12 (the landings' bursts: `0xaf4b18` in L_af4990 was unlifted). After the lift: every new record
started twice on its runtime with no refusal (22 / 22); soaks (`--viewer-inputs`) em057_00 87 motions / 0 refused, em057_04 92 / 0;
dev/checks/em057_00.mjs 169 / 169; the page part of dev/shells-zinogre-check.mjs 6 / 6 (both runtimes, the leaps' records, L0 M20's
(7, 0x71) play, L9 M5); the other shells checks (Seltas, rock, Rathian, Khezu, Deviljho, Silverwind, spike) unchanged.
