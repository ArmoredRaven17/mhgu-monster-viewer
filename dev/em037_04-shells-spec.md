# Silverwind Nargacuga (em037_04) -- his shells, read and built

Shells agent, 2026-10-16. ROM: `C:\MHGU-ROM\exefs` main.text (VA 0), main.rodata (VA 0x13ef000), main.data (VA 0x1728000).
Files: `C:\MHGU-Extract\scratch-em\em037_04\em037_04.arc` (`shell\em\em037_04_shell00 / 01 / 45 / 46`, `effect\pel\em\em037_04u`,
`enemy\action_tune\em037_04_actiontune.fup`, `enemy\cmd_tbl\em037_00_cmdtbl.emc`). Background: Nargacuga's decode
`C:\MHGU-RE\offline\decode\notes\shells-em037.md` (cited "N s") and Savage's `shells-em043.md`. Everything below is READ (the
consuming instruction read) unless marked INFERRED (I) or NOT READ (NR).

Built: `docs/render/shells.js` -- `SHELL_DATA.em037_04` (data block after `SHELL_DATA.em088_00`) and the section "SILVERWIND
NARGACUGA" (base45 `make45` / `step45` / `home45` / `turn45`, base46 `make46` / `step46` / `landing46`, `END00` (sp_00 +0x154),
`spawn037w`, `params037s01`; `init37` / `collide` / `landing37` / `dropShell01` / `spawnSpikes` -> `makeSpike37` extended).
Checked: `dev/shells-silverwind-check.mjs` (38 / 38: every move of every shell bit for bit against the ROM, children included;
controls fail). The other shell checks still pass (ahtal 72, deviljho 34, khezu 76, rathalos 1264, rathian 624,
rathian-variants 973, rock 55, spike 257).

## 0. Bottom line

| shell | global id | class / base | what | records |
|---|---|---|---|---|
| shell00 | 0xca | uShellEm037_sp_00 / base00 | the spike throws (Nargacuga's actions, Silverwind's files); the RISING SPIKE 8 / 13 / 14 | u 0 flight, u 1 floor, u 2 wall, u 3 hunter |
| shell01 | 0xcb | uShellEm037_sp_01 / base01 | mode 0 at every FLOOR landing (spike, falling spike): draws u 4 | u 4 (mode 1: c 30, BUILT 2026-10-20: perFrame037) |
| shell45 | 0xcc | uShellEm037_sp_45 / **uShellEmBase45** | the TAIL BLADES: 13 modes | u 10 11 12 20 21 23 30 31 |
| shell46 | 0xcd | uShellEm037_sp_46 / **uShellEmBase46** | the FALLING SPIKE a rising spike makes at its end | u 0 flight, u 1 / u 2 / u 3 landings |

**Nargacuga shares none of them.** uEm037_00's loader vt+0x158 `0xe47320` registers 0xca..0xcd only for variant 4 and keeps
0xca / 0xcb at e+0xcc94 / +0xcc98 (N s1); variant 0 gets 0xc8 / 0xc9, so every Silverwind spawner's id is refused for him
(0x48b884 refuses an unloaded id). 0xca / 0xcb are Nargacuga's CLASSES (sp_00, sp_01: the same code) with Silverwind's files;
sp_45 / sp_46 and base45 / base46 are used by no other shell class (`efx/agents/narga-shell-scratch/shelltable.json`: only ids
204 / 205 name Base45 / Base46). The 13 records are em037_04u's own (UNIQUE: `add_effects.array_of`), exported `when: 'shell'`
in `docs/effects/em037_04.json` since commit 18e184e; c 30 (em037_00c) is shell01 mode 1's -- built 2026-10-20 (perFrame037; was "not built", rom-map Withdrawn).

## 1. Classes, vtables, bands

* Table 0x175c3e8 (12 B: class DTI, setup DTI, res): 0xca sp_00 (0x188c7c8) / Base00 setup / 0x8a1d; 0xcb sp_01 (0x188c7e8) /
  Base01 / 0x8a1e; **0xcc uShellEm037_sp_45 (0x188c808) / uShellEmBase45::cSetupParamEmBase45 (0x18872a8) / 0x8a1f**; **0xcd
  uShellEm037_sp_46 (0x188c828) / uShellEmBase46::cSetupParamEmBase46 (0x1887348) / 0x8a20**.
* **sp_45** vtable **0x17bd6f4** (ctor `0xe599ec` writes GOT 0x183f59c -> 0x17bd6ec + 8): own slots +0x0 `0xe59a0c`, +0x4
  `0xe59a10`, +0x14 `0xe59cc8` (DTI), **+0x14c the reader `0xe59a20`**; the rest is **base45's vtable 0x1752740**: +0x0 dtor
  `0x422ce8`, +0x14 `0x4241b4`, **+0x24 move `0x4236c0`**, **+0x13c init `0x422dc0`**, **+0x148 end `0x4240d4`**, **+0x150
  `0x422be8` = `bx lr`** (no landing). Base45 ctor `0x422bec` (-> enemy-shell base ctor `0x43a78c`): +0x15c8..+0x15d8 0,
  +0x15dc / +0x15e0 / +0x15e4 -1, +0x15ec..+0x1617 0 (memclr 0x2c), +0x1618..+0x1624 the zero vector, +0x15e8 / +0x1628..+0x1630
  0, +0x1640..+0x164c 0, +0x15a8 = 0x2d. Setup (0x30 B, allocator `0x422bac`, vtable 0x17528bc+8): +4 id, +8 mode, +0xc owner,
  +0x10 point, +0x20 words, +0x2c byte (target slot), +0x2e halfword. Band `0x422afc..0x4241c4` (DTI registration 0x4241c4).
* **sp_46** vtable **0x17bd850** (ctor `0xe59db0`): own +0x0 `0xe59dd0`, +0x4 `0xe59dd4`, +0x14 `0xe5a0e4`, **+0x14c reader
  `0xe59de4`**, **+0x150 the landing `0xe59f84`**; **base46 vtable 0x17528e4**: dtor `0x424734`, **move `0x425188`**, **init
  `0x42480c`**, **end `0x425984`**, +0x150 `0x42442c` (overridden). Base46 ctor `0x42461c`: +0x15c8..+0x15d4 0, +0x15d8 / +0x15dc
  -1, floats 0, +0x1604..+0x160c the zero vector, **+0x1620..+0x1628 the zero vector (the aim point)**, +0x15a8 = 0x2e. Setup
  (0x40 B, `0x4243f0`, vtable 0x1752a60+8): +0x10 **the hunter unit**, +0x20 point, +0x30 words, +0x3c halfword. Band
  `0x424338..0x425a70`; helper `0x424578(shell, ef, point, idx)` (a contact start into handle [idx], idx <= 3).
* The effect handles are an ARRAY the init allocates from the engine heap: base45 [+0x162c] x 5 (count +0x1630), base46
  [+0x1614] x 4 (+0x1618). Only [0] (the flight) and one contact handle are ever filled.

## 2. The spawns (the class's status-7 code; tracer `<scratchpad>/sw37/trace.py`, `allmot.json`)

Spawners: **`0xe49a78(e, mode)`** (shell00 0xca: setup +0x20.. = e+0xfe8.., +0x2e 0xffff -- unused: flag 0x20 is clear for 8 / 13 /
14); **`0xe49b24(e, mode, &words)`** (0xcc, +0x2e = 0xffff); **`0xe49bc8(e, mode, h, &words)`** (0xcc, +0x2e = h = P+0xb0a);
`0xe48fc8` (the spike throws, N s2.3). Callers (BL / B xref over main.text): e49a78 `0xe553fc 0xe56108 0xe5623c 0xe56358
0xe56c00`; e49b24 `0xe53318 0xe5371c 0xe548e0 0xe54a2c 0xe55bf0`; e49bc8 `0xe50f50 0xe52b50 0xe54200 0xe54524 0xe55b08 0xe55dbc
0xe55fb8 0xe5674c 0xe56b10`. Every one is in a status-7 action body (table 0xe4fea4, n-1). The modes by the tail: P+0x3b4 bit
0 (the sever bit, states-em037_04.md 4.2) picks the second; every blade spawn tests 0x81614 (tired: P+0x505 & 0xfe == 2) and
makes NOTHING when tired; the shared bodies also test e+0xb5f5 == 4.

| action(s) | fn | clip(s) | frame (test) | shell / mode (tail on / severed) | words | issued by |
|---|---|---|---|---|---|---|
| (7, 0x28..0x2c, 0x35, 0x3a, 0x82, 0x84) | 0xe5181c / 0xe55030 | L2 M7 -> L2 M8 | 46.0 pass | shell00 0..7, 9..11 (N's kinds; kinds 3 / 4 = modes 16..23: no Silverwind files) | -- | N s2.2 |
| (7, 0xf4 / 0xf5 / 0xf6 / 0xfc) | 0xe56048 / 0xe5615c / 0xe56298 / 0xe56b40 | L2 M7 -> L2 M8 | **44.0 pass** | shell00 **8** | -- | g1 s129 / s128 |
| (7, 0xea / 0xec / 0xee / 0xf1) | 0xe5512c(e, 0, ..., sp0 0) | L9 M6 | tune f23 = **66.0** pass | shell00 **13** | -- | g1 s181..s196 (0xf1 none) |
| (7, 0xe9 / 0xeb / 0xed / 0xf0) | 0xe5512c(e, 1, ..., 0) | L9 M7 | 66.0 | shell00 13 | -- | idem (0xf0 none) |
| (7, 0xe0 / 0xe2 / 0xe4 / 0xe6), (7, 0xdf / 0xe1 / 0xe3 / 0xe5) | 0xe5512c(..., sp0 **1**) | L9 M6 / M7 | 66.0 | shell00 **14** | -- | **none** (no stream, no chain) |
| (7, 0x02 / 0xf9) | 0xe509d8 | L2 M4 -> L2 M5 (x2, loop) | 8.0 pass | shell45 2 / 5 | zero | g1 s9, s114, g8 s0 / g1 s9, s144, s145 |
| (7, 0x6c / 0xfa) | 0xe52518 | L2 M4 -> L2 M21 | 8.0, **123.0** | shell45 2 / 5 (x2) | zero | g1 s72 s93 / s144 s145 |
| (7, 0x70 / 0xfb) | 0xe53bac | L2 M4 -> L2 M21 -> (at 30) L2 M19 / M20 | M21 8.0; M19 / M20 100.0 | 2 / 5; then 8 / 9 (M19) or 6 / 7 (M20) | zero; yaw0 | g1 s115 / s144 s145 |
| (7, 0x6d) | 0xe52f68 | L2 M19 (target right) / L2 M20 | 100.0 | 8 / 9 / 6 / 7 | **zero** (0x1620e60) | 22 sites |
| (7, 0x6e) | 0xe5335c | L4 M2 / L4 M3 | 100.0 | 8 / 9 / 6 / 7 | yaw0 | g1 s110 s111 s113 |
| (7, 0x71) | 0xe5456c | L2 M19 / M20, at 130 the other from 42 (blend 14) | 100.0 each | **the first clip's side** both times | yaw0 (re-read at 130) | g1 s116 |
| (7, 0xf7) / (7, 0xf8) | 0xe5638c / 0xe5677c | L2 M20 / L2 M19 | 100.0 | 6 / 7 ; 8 / 9 | yaw0 | g1 s120.. |
| (7, 0xf2 / 0xfe) / (7, 0xf3 / 0xff) | 0xe55c50 / 0xe55e4c | L2 M3 / L2 M2 | 90.0 | 0 / 3 ; 1 / 4 | zero | many |
| (7, 0xef) | 0xe55924 | L9 M8 -> L9 M9 (tune f19 = 1 loop) -> L9 M10 -> L9 M5 | M10 tune f20 = **32.0**; M5 tune f21 = **28.0** | 12 ; 10 / 11 | yaw0 | g1 s181.. |

* The side: P+0x200 = the yaw to the target; side = bit 15 of (P+0x200 - P+0x54) -> e+0xcac1; 1 -> L2 M19 (0x213) / L4 M2.
* 'yaw0' = (0, u16(s32(0.5 + e+0xcae4 x 182.04445)), 0), e+0xcae4 = f32(u16 P+0x54) x 0.0054931640625 written at the action's
  start (phase 0, after `ldrh / str` truncate P+0x54); (7, 0x6d) hands the zero vector, so its blade's words are world-fixed.
* Not spawning on those clips: (7, 0x01) (L2 M3), (7, 0x6f) (L2 M4 / M5), and Nargacuga's non-throw L2 M7 / M8 actions.

## 3. shell00 on Silverwind's files (base00, Nargacuga's sp_00 code)

Files (`em037_04_00_sh###`): modes 0..7 as Nargacuga's but **mode 0 int 1 = -1** (no aim; his has 0, which aimed at lo = hi = 0:
the same 0); modes 9..11 ints `[143, 0, -1, -1, -1, 0, -1, 0]` -- **int 5 = 0 (byte +0x1664), int 7 = 0 (flag 0x200)**; modes 8 /
13 / 14 `[143, -1, -1, -1, -1, 0, -1, 0]`, floats `[-88.5, 0, 85, 100, -80, 80, -100, 100, 0]`, vec 2 `(0, -0.9, 0)`; hit 0 / 1 / 2.
* Flag 0x200 (the reader 0xe59050, N s3.2): +0xfe8 starts at 0, not the owner's X; the X aim still subtracts B+0x50 (N 4.5).
* +0x15c2 = 1 for modes 8 / 13 / 14 (the reader: mode <= 14, bit of 0x6100) -> **the stage query mask 0x10** (0x43ad40..0x43ad4c:
  `mov r3, #0x30; cmp +0x15c2, #0; movwne r3, #0x10`): the rising spike meets the floor only.
* Byte +0x1664 (modes 8..11, 13, 14): after each state-1 move `0xe59574` calls **`0x43b2b0(shell, 0, &+0x40, 1)`**: with
  `0x539300(shell)`, a ground query `0x183664` (r3 = 1) and **`0x2b3c8([0x1846dc8], 3, 0x1592238[0] = 5, &point)`** -- a pool unit
  at the ground point with scale 0x1593300[5] = 0.6 (rom-map row `0x2b3c8`: a marker, look I a blob shadow). Not an effect
  record; **not drawn**.
* The RISING SPIKE: X = 0 + u16(s32(-88.5 x 182.04 + 0.5)) = 0xc111 (88.5 deg up), Y = owner Y, speed 85 along it, gravity
  (0, -0.9, 0) (gravityOf), 100 moves (flight). **The end (vt+0x148 -> base00 0x3f9ef4 -> vt+0x154 `0xe595ac`)**: mode in 0x6100
  and **byte +0x1665 != 0** (the ctor's 1; **every landing clears it**, 0xe59334) and the owner active -> **shell46 (0xcd)**,
  mode **0x169dd20[mode - 8]** = [0, 0, 0, 0, 0, 0, 1] (8 / 13 -> 0, 14 -> 1), setup +0x10 = **+0x1660** (the hunter unit,
  `0xc2df8(owner, B+0x232, B+0x234)` at the init 0xe594d4), +0x20 = the shell's +0x40, +0x30 = its words, +0x3c = +0x13dc.
* Landing 0xe59334 type 1 -> `0xe593d8` -> shell01 id **[owner+0xcc98] = 0xcb** mode 0 (Silverwind's draws u 4), then u 1.

## 4. shell01 (0xcb; base01, reader 0xe597e4)

Mode 0: ef `(0, 4)` (list 0 = em037_04u: **u 4 = em037_04_002**), sh ints all -1 (flags 0), float 0.0, vec 0 (0, 0, 0), hit
[0]; mode 1: ef `(1, 30)` (list 1 = em037_00c), ints `[0, -1, -1, 0]` (0x1080), hit [1]. hitdata (HDS, 2 records): (0, 30),
(14, 10). Mode 0 sits at the contact with the creator's words (init011 flags 0) and, timer 0.0, lives while hit slot 0 is on
(slotsOf011, input.hitLife); with no hit registration (the harness) it ends at move 1 (graceful stop of u 4). Mode 1 is the
per-frame 0xe47b0c's (L0 M28 f20, L1 M1 f60, L1 M2 f2 unless 0x6fe88(e, 3, 5), the current-action test): BUILT 2026-10-20 (perFrame037; hit slot 1 (14, 10); was "not built / 0x6fe88 NR", rom-map Withdrawn).

## 5. base45 -- the tail blades

**Reader 0xe59a20**: ef 0..4 -> +0x15c8 / +0x15cc / +0x15d0 / +0x15d8 / +0x15d4; hit 0 / 1 -> +0x15dc / +0x15e0; int 0 -> +0x15e4
(joint); +0x15e8 bit 0 = int 1 != -1, bit 1 = int 2 != -1; floats 0..10 -> +0x15ec (X deg), +0x15f0 (Y deg), +0x15f4 (speed +Z),
+0x15f8 (speed +Y), **+0x160c (life)**, **+0x1610 (shrink)**, +0x15fc (X hi), +0x1600 (X lo), +0x1604 (Y hi), +0x1608 (Y lo),
**+0x1614 (homing rate)**; vecs 0..3 -> +0x1618 (offset), +0x161c (acc), +0x1620 (homing point), +0x1624 (drawn angles).

**Init 0x422dc0**: 0x43a850, +0x1588 = setup +0x2e, owner check; the handle array; reader; state 1; **+0x1628 = +0x160c**; hit
(not visual); **EffectParam 0 started at &+0x40 BEFORE the position is set** -- the unit ctor's zero vector (0x4a0b8c..0x4a0bac;
the ROM run's request reads (0, 0, 0)); then:
1. words: bit 0 set -> +0xfe8 = setup +0x20 + u16(deg(f0)), +0xfec = +0x24 + u16(deg(f1)), +0xff0 = +0x28 (uxtah). Bit 0 clear ->
   u16(P+0x50) + u16(deg f0), u16(P+0x54) + u16(deg f1), 0; then **the aim from the shell's +0x40 = (0, 0, 0)** (still the ctor's)
   to the target P+0x1d0 + 16 x setup byte +0x2c: aY = s32(0.5 + atan2(dx, dz) K), h = sqrt(mla(dz^2, dx, dx)), aX = s32(0.5 +
   atan2(-dy, h) K); each word += the circular clamp (N 4.5's) of (a - word) to [deg(+0x1600), deg(+0x15fc)] (X) and
   [deg(+0x1608), deg(+0x1604)] (Y).
2. position: setup +0x10 == the zero vector (both spawners) -> joint +0x15e4 != -1: 0xc15a4 row 3; -1: **the owner unit's
   +0x40**; then **vec 0 turned X, Y, Z by the words** added (0x4233c0..0x4234a4; not through the joint's matrix).
3. +0x1020 = (0, vec 1 y, vec 1 z) turned by Y (gravityOf); **+0x1010 = (0, +0x15f8, +0x15f4) turned X, then Y, then Z**
   (`rotVel45`: base00's launch turns Z, X, Y).
4. bit 1 clear (int 2 == -1) -> **the drawn words = u16(P+0x50 / +0x54 / +0x58) + u16(deg(vec 3))** (0x42361c..): the velocity
   keeps the aimed words, the angle words (what the bound effect is oriented by) are the owner's plus vec 3.

**Move 0x4236c0** (handle hygiene; state 1 -> `0x4237fc`, 2 -> `0x423f30`, 0xfe -> the wait):
* state 1: +0x1628 counted down by dt (vselge, floored at 0); at <= 0 -> **state 2, +0x1628 = +0x1610** (`0x4238cc`; no flight
  that move). Else, **vec 2 != (0, 0, 0)** -> the HOMING (`0x42394c..0x423e24`): the point = the owner unit's +0x40 + vec 2 turned
  X, Y, Z by **the owner's u16 P+0x50 / +0x54 / +0x58 this move**; aY, aX from the shell to it (h = sqrt(f(dx^2) + f(dz^2)):
  vadd); each word turned toward its low-half target by step = u16(s32(0.5 + f(f(f(|d|) x 360/65536) x +0x1614) x dt) x
  182.04445)), the short way, **wrapping by 0xffff** (`turn45`); the velocity rebuilt `rotVel45(+0x15f8, +0x15f4, [X, Y, 0])` --
  **Z from 0x1620e60 + 8 = 0, not +0xff0**; +0x1020 by the new Y. Then anchor = position, `0x539224`, the stage query (mask 0x30)
  -> vt+0x150 = `bx lr`: **a contact does nothing**.
* state 2 (the SHRINK): +0x1628 counted down; at <= 0 -> end. Else **the unit's scale +0x60..+0x68 = clamp(t / +0x1610, 0, 1)**
  (formed with sign-bit `and` / `bic`, 0x423f9c..0x423fc8; +0x6c = 0) -- the bound effect's parent scale (schedule.js `unitScale`)
  -- then anchor, 0x539224, the query (nothing).
* **End 0x4240d4(flag)**: stop [+0x162c][0] (0x43b058: graceful for 0), 0x4a1de4, state 0xfe, +0x1628 = 1800; flag 1 deletes.
  The wait: deleted at the timer's end or when all five handles are null.

| mode | ef | joint | words from | homing | life + shrink | note |
|---|---|---|---|---|---|---|
| 0 / 1 | u 11 / u 10 | 143 | owner + aim (X [-10, 10], Y [-40, 40]) | (-+3000, 100, 5000) at 0.008 | 60 + 80 | L2 M3 / M2 |
| 2 | u 12 | 143 | owner + aim (X [-10, 10], Y 0) | none | 60 + 20 | speed -110 |
| 3 / 4 | u 21 / u 20 | 143 | as 0 / 1 | as 0 / 1 | 50 + 40 | severed |
| 5 | u 23 | 143 | owner + aim (0, 0) | none | 15 + 20 | severed |
| 6..9 | u 11 / 21 / 10 / 20 | -1 | setup + (0, -+20) | none | 50 / 40 + 20 | the slashes |
| 10 / 11 | u 30 / u 11 | -1 | setup (kept: int 2 = 0) | none | 80 / 50 + 30 | L9 M5 |
| 12 | u 31 | -1 | setup | none | 50 + 10 | L9 M10, speed 0 |

## 6. base46 -- the falling spike

**Reader 0xe59de4**: ef 0 / 1 / 2 / 3 -> +0x15c8 / +0x15cc / **+0x15d4 / +0x15d0**; hit 0 -> +0x15d8; floats 0..7 -> +0x15e4 (speed
+Z), +0x15e8 (+Y), +0x15ec (X hi), +0x15f0 (X lo), +0x15f4 (Y hi), +0x15f8 (Y lo), **+0x15fc (life)**, +0x1600 (homing rate); vecs
-> +0x1604 (offset at the hunter), +0x1608 (acc), +0x160c (aim offset). Mode 0 speed 100, mode 1 25; life 450; rate 0.5.

**Init 0x42480c**: +0x1588 = setup +0x3c; reader; state 1; **+0x1610 = +0x15fc**; EffectParam 0 at &+0x40 before the position
(the zero vector, as base45); **+0x40 = setup +0x20, words = setup +0x30**; +0x1010 = rotVel45(+0x15e8, +0x15e4, words);
+0x1020 = (0, vec 1 y, vec 1 z) turned by Y; **setup +0x10 (the hunter unit) == 0 -> return** (0x424c0c). With a unit
(`0x424c10..0x425038`, NOT TRANSCRIBED): aY / aX to the unit's +0x40 + vec 2 turned by the first yaw (`0x425064`), clamped
around the words to [+0x15f0, +0x15ec] / [+0x15f8, +0x15f4]; within -> a vertical query 0x183490 under the unit + vec 0 (y +-1e6)
-> +0x1620 = the ground point; clamped -> a ray `0x182b04` 1000 along the clamped words -> +0x1620 (NR: 0x182b04).

**Move 0x425188 -> 0x4252b0**: +0x1610 counted down; at <= 0 -> end. **+0x1620..+0x1628 == the zero vector** (exact
compares) -> **THE FALL**: v += (dt x 0, dt x -0.3, dt x 0) (`vmla`), X = atan2(-vy, sqrt(mla(vx^2, vz, vz))), Y = atan2(vx,
vz), stored as u16; then (0x4256f8) **the velocity rebuilt rotVel45(+0x15e8, +0x15e4, [X, Y, +0xff0])** -- constant speed, the
direction bending down -- the acc by Y, anchor, 0x539224, the query (mask 0x30) -> vt+0x150; then `0x43b2b0` (the marker). The
aim branch turns the words toward +0x1620 at +0x1600 (base45's turn) -- reached only with a hunter unit.
**Landing 0xe59f84(shell, &contact, &result, type)**: type 0 -> 0x424578(+0x15cc = **u 2**, idx 1); type 1 -> 0x424578(+0x15d0 =
**u 1**, idx 2) **then** (owner active) shell01 **0xcb mode 0** at the contact with the words (0x3fa2bc: +0x10 contact, +0x20
zero, +0x30 words, +0x3c +0x13dc; the literal `mov r2, #0xcb` at 0xe5a024); type 2 -> **u 3** idx 3; then vt+0x148(0). **End
0x425984**: stop [+0x1614][0], 0xfe, 1800.

## 7. The ROM runs and the check

`<scratchpad>/sw37/emu37.py`: the whole executable on unicorn after the static initialisers (nharness's method), hooks: the rShell
getters (em037_04.arc), 0x43a850 -> 1, **0xc2df8 -> 0 (no hunter unit)**, 0x3f9aec / 0x4a1ad8 (no hit registration), 0x43ab74,
the setup allocators (0x3f883c, 0x3fa2bc, 0x422bac, 0x4243f0), 0x48b884 (setup logged; each 0xcd / 0xcb setup then run as a
child), 0x183490 (the plane at floorY, mask 0x10 = the floor), **0x43b2b0 (logged, not run)**, the effect requester / start /
stop. **The handle arrays are given** (zeroed, count 5 / 4) because the engine heap behind 0x7a75a0 has no allocator in the
harness: the init's `count == 5` / `== 4` path then skips the allocation (the allocation's own memclr gives the same zeros).
`dev/shells-silverwind-check.mjs` runs 26 cases (the spike throws kinds 0 / 1 / 2 with their shell01 landings; the rising spike
8 with shell46 and shell01, and with a floor at 4524 so it lands at move 99 and makes no shell46; the leap's 13 and the forced
14; every shell45 mode on its clip, tail on and severed, an aim inside the clamps, a handle killed mid-flight) through stepShells
as the viewer steps the clip and compares every move of every shell and child bit for bit (state, position, velocity, acc,
anchor, words, timer, the shrink scale, starts / stops / creates); controls (a target 10 off on an unclamped aim and on the
aimed spikes, another joint, the facing one unit off) fail.

## 8. Not built, unreachable, NOT READ

* **u 3** (every shell's type-2 landing: a hunter hit) -- no hunters in the viewer. **u 2** (type 0: a wall / steep surface) --
  reachable only with the viewer's wall stand-in (input.rock.wall; record_shells.py --wall).
* **shell46 mode 1** (shell00 14): (7, 0xdf..0xe6) are issued by no stream and no chain (`emc7.py`, the class's 0x768c8 sites);
  rows `pick: 'unread'` (a forced input.action reaches them).
* **base46's hunter aim** (0x424c10..0x425038, 0x425064, 0x182b04 NR): +0x1660 is a hunter unit (`0xc2df8`); the viewer has none,
  so the spike takes the ROM's null path (the fall). In the game it homes onto the ground under the hunter.
* **The ground marker** (0x43b2b0 -> 0x2b3c8, byte +0x1664): not an effect record, not drawn.
* **shell01 mode 1** (c 30): Nargacuga's per-frame spawner 0xe47b0c -- BUILT 2026-10-20 (perFrame037, dev/shells-nargacuga-impact-check.mjs 27/27).
* **(7, 0x71)'s second slash** (the other clip from frame 42, the first side's mode, the facing re-read at 130): not a pick of
  its own (its first slash is the 0xf7 / 0xf8 rows').
* **The tail input**: `render/motion-states.js SHELL_TAIL` has no em037_04 entry, so input.tailSevered never reaches his shells
  and the severed modes (3 / 4 / 5 / 7 / 9 / 11 -> u 21, u 20, u 23) are unreachable in the viewer until it gets one (states-em037_04.md
  2: severed = set 14, its stump Group[17]) -- motion-states.js is not this agent's.
* INFERRED: the owner unit's +0x40 (base45's joint -1 path and its homing) is the viewer's one owner position (input.ownerPos,
  which the other shells take as block +0x40); 'yaw0' takes the viewer's facing as e+0xcae4 (the ROM's is the start facing; the
  actions turn him 180 deg over 88..118 after it).
