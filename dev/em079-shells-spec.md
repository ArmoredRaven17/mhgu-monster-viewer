# Malfestio (em079_00) / Nightcloak (em079_04) -- the shells

Implementation agent for the Viewer agent, 2026-10-15. Raven: *"Review Malfestio, I notice some attacks lack some of their
effects."* Every record his class exports was already driven; what was missing were his SHELL effects -- he had no
`SHELL_DATA` entry. Transcribed: `docs/render/shells.js` (`SHELL_DATA.em079_00` / `.em079_04`, `shell079`, `actions079`,
`PERFRAME079`, `params079s01`, `params079s00`, base40 `params40` / `make40` / `push40` / `end40` / `step40`, `spawn079`,
`perFrame079`, `pickVariantsFor`'s `op1c`). Map rows: `dev/rom-map.md` "Malfestio / Nightcloak -- the shells".
Scratch (disassembly, resolvers, file dumps): `<archive>/m079/` -- `band.txt` (word sweep of `0xfee698..0xffe0dc`),
`cases.py` (a status table's cases to (function, r1, r2)), `motmap.py`, `shl.py` (.shl modes with their FUPs), `hit.py`.

Status words: **R** = the consuming instruction read; **I** = inferred; **NR** = not read.

## 1. The shells (R)

`vt +0x158 = 0xff23f4` writes four ids, all `0x19d` first, then by the variant byte `e+0xb5f5`:

| field | spawner | variant 0 (Malfestio) | variant 4 (Nightcloak) | class | setup DTI (= base) |
|---|---|---|---|---|---|
| `+0xcb54` | `0xff26fc` | `0x19d` (none) | `0x142` | uShellEm079_04_00 (vt `0x17ea6c8`) | cSetupParamEmBase00 |
| `+0xcb58` | `0xff2514` | `0x13f` | `0x143` | uShellEm079_sp_01 (vt `0x17ea844`) | cSetupParamEmBase01 |
| `+0xcb5c` | `0xff2604` | `0x140` | `0x144` | uShellEm079_sp_31 (vt `0x17ea9b4`) | cSetupParamEmBase31 |
| `+0xcb60` | `0xff267c` | `0x141` | `0x145` | uShellEm079_sp_40 (vt `0x17eab14`) | **cSetupParamEmBase40** |

The ids and setups are the shell table's (`efx/agents/narga-shell-scratch/shelltable.json`, ids 319..325). shell40 IS
base40 by its setup DTI, not by its folder number.

Files (each `.shl`'s own lists and FUPs; `shl.py`):

* em079_00: shell01 lists `[em079_00c, em079_00u]`: modes 0 / 1 c 30, 2 c 29, 4 / 5 / 7 / 8 / 9 u 20, 6 u 21 (each ef 1
  `(999, -1)`); hit 0 / 0 / 1 / 2..; hitdata (0, 8) (0, 8) (0, 20). shell31 `[c, u]`: 0 / 1 u 0, 2 / 3 u 1 (ShellScale 1.3).
  shell40 `[c, u]`: 0 u 10; ShellCmnParam `em079_00_40` floats (1000, 1500, 12, 12, 2000, 2000).
* em079_04: shell00 `[em079_04u]`: 2 / 3 / 9..13, ef (u 60, u 81, u 80, u 81). shell01 `[em079_04u, em079_00c]`: 0 / 1 c 30, 2
  c 29, 4 / 5 / 8 / 9 u 20, 6 u 21, 10 / 11 / 12 u 30 (no mode 7). shell31 `[em079_04u]`: as his brother's but vec 0 (0, 50,
  500) on 2 / 3. shell40 `[em079_04u]`: 0 u 10, 1 u 30, ShellScale 1.2, **life 5** (float 0), its cmn the SAME path
  `shell\em\em079_00_shell40\em079_00_40` (present in his arc).

## 2. Who spawns them (R)

Status-7 table `0xff6018` (handler `0xff5fe8`) resolved case by case (`cases.py`), every spawner caller traced back. Frames
are the action code's crossings (`0xb0968` / `0xb0974`, mode 0: pass001); "at setMotion" = in the same update that sets the
clip, the clip's first step in the viewer.

| action | function | clip(s) | spawn |
|---|---|---|---|
| (7, 0x10) | `0xffb208` r1 0 | L2 M16 -> **M17** -> M19 | M17 f20 (tune 0x15) shell31 0, `0x3a8430 == 5`: 2 |
| (7, 0x12) | `0xffb208` r1 1 | L2 M16 -> **M18** -> M19 | M18 f52 (tune 0x16) shell31 1 / 3 |
| (7, 0x27) / (7, 0x28) | `0xff77c4` (side 1 / 2, kind 2) | L2 M14 / M15 | f78 shell01 8 / 9 |
| (7, 0xd0) / (7, 0xd1) | `0xff77c4` (kind 4) | L2 M14 / M15 | f78 shell01 10 / 11 (only Nightcloak has files) |
| (7, 0x2a) | `0xff7a24` r1 2 | L2 M34 -> **M35** -> M13 | M35 f42 shell01 4 |
| (7, 0x0d) | `0xff7c78` r1 2 | L2 M12 -> M13 | f30 shell01 5 |
| (7, 0x38) | `0xff7f00` r1 2 | L2 M12 -> M45 | f30 shell01 6 |
| (7, 0x1f) (chained by (7, 0x21)) | `0xffb904` (0, 2) | L2 M41 -> M42 -> **M43** -> M44 | at M43's setMotion: shell01 7 (variant 4: 12) |
| (7, 0x15) / (7, 0x16) | `0xffb3b4` | L2 M21 -> M22 -> M25 -> **M23** | at M23's setMotion (the landing, `0xbf52c`): shell40 0 |
| (7, 0x18) | `0xffb5d8` | L2 M24 -> .. -> M25 -> **M23** | the same |
| (7, 0xcb) / (7, 0xda) (chained by (7, 0xca) / (7, 0xd2)) | `0xff71cc` r5 2 / 4 | .. -> **M23** | M23 f2 (tune 0x20) shell40 0 / 1 |
| (7, 0x1d) / (7, 0x1c) | `0xff6a2c` / `0xff6900` | L2 M36 or M37 (angle-picked turn, table `0x16a1bac`) / L2 M36 | f86: **the push**, k 1 |
| (7, 0xcc / 0xcd), (2, 4 / 5) | `0xff757c` | L1 M26 -> **M27** | at M27's setMotion: the push, k 0; kind 2 ((7, 0xcc / 0xcd)) M27 f8 (tune 0x1b) shell00 3 |
| (7, 0xc9 / 0xd8) / (7, 0xdb / 0xdf) / (7, 0xdd / 0xe1) | `0xff6e34` | L9 M4 | f74 shell00 2 / 9, 10 / 11, 12, 13 |

Kinds that make nothing: (7, 0x0e / 0x0f / 0xce / 0xcf), (7, 0x29 / 0xd3), (7, 0x0c / 0xd4), (7, 0x37 / 0xd5), (7, 0x1e), (7,
0x3f), the status-1 call `0xff3398` (kind 1) and status 13's `0xff8d80` (r1 6). `vt +0x1ec 0xffc66c` / `+0x1f0 0xffcae4` also
set L2 M35 / M12 (no shell; issuer NR).

### 2b. The command tables (R, data)

`em079_0N_cmdtbl.emc` (the same streams in both arcs; `efx/agents/malfestio-scratch/emc.py`). Every directly issued shell
form sits in **op 0x1c's enraged body** (`1c 00`, `0x81688` = enraged) with a calm twin in the `1c 02` body: (7, 0x27 /
0x28) vs (7, 0x0e / 0x0f) in g1 s2 / s3 / s19 / s20 / s60 / s61 / s63 -- s61 under op 0x92 sends variant 4 to (7, 0xd0 /
0xd1) vs (7, 0xce / 0xcf); (7, 0x2a) vs (7, 0x29) (s1) or (7, 0xd3) (s103); (7, 0x0d) vs (7, 0x0c) (s28 / s39 / s91) or (7,
0xd4) (s104 / s107); (7, 0x38) vs (7, 0x37) (s55) or (7, 0xd5) (s105). Issued with no condition: (7, 0x10) / (7, 0x12) /
(7, 0x15) / (7, 0x16) / (7, 0x18) / (7, 0x1d) / (7, 0xca) / (7, 0xd2) / (7, 0xcc) / (7, 0xcd) / (2, 4) / (2, 5) / (7, 0xc9)
/ (7, 0xd8) / (7, 0xdd) / (7, 0xe1) (their own switches -- 0x92, 0x98, 0x16 -- choose among them, NR). Not issued: (7, 0x1c),
(7, 0x1e), (7, 0x1f), (7, 0x40), (7, 0x41), (7, 0x42), (7, 0xcb), (7, 0xda), (7, 0xdb), (7, 0xdf); of those the class chains
reach (7, 0x1e / 0x1f) (from (7, 0x09 / 0x21), after L2 M11) and (7, 0xcb / 0xda) (from (7, 0xca / 0xd2)) -- (7, 0x42) only
from (7, 0x41), only from (7, 0x40), which nothing issues.

So **Malfestio's shockwaves (u 20 / u 21) come only with the enraged forms** of his attacks. The viewer lists those forms
only while its Enraged toggle is on (`op1c`), as Gypceros's rage forms.

### 2c. The landing dust (R)

`vt +0x1a8 = 0xffd0b4` (from vt +0x28 after the move, as Boltreaver's): a switch on the motion id - 0x102, one frame gate
`0xb09b0` each, then `vt +0x1b0 = 0xff27f0(e, sel)`: L1 M2 / M11 / M12 f10 and L1 M14 / M16 / M20 f2 sel 4 (shell01 2, c 29);
L1 M22 f26 and L1 M27 f2 sel 6 (shell01 1, c 30); L2 M36 / M37 f86 sel 5 (shell01 0, c 30). `0xff27f0`'s one gate is variant
4's: none while `(e+0xcafc & ~1) == 2` (his stealth -- the viewer shows him uncloaked) or under (7, 0xcc / 0xcd).

## 3. base01 / base31

### 3a. sp_01's reader `0xffd644` (R, whole)

ef 0 -> +0x15c8; accA(hit, 0) -> +0x15d8; bfc / orrne over the ctor's 0: **0x80 = int 0, 0x800 = int 1, 0x4 = int 2, 0x8 =
int 3, 0x1000 = int 4**; vec 0 -> +0x1608. No joint, timer, vec 1. Flags: modes 0 / 1 / 2 `0x1080` (init011's owner-ground
arm: his x / z plus vec 0 turned by his facing, y = his ground; deleted 900 above it), 4 / 5 / 7..12 `0xc` (the setup's
point -- his block +0x40 -- plus vec 0 turned by the words, snapped to the floor and laid on it), 6 `0`. Timer 0: each lives
while its hit slot is on ((0, 8) / (0, 20)).

### 3b. sp_31's reader `0xffd878` (R)

Nakarkos's `0x108ae98` less float 3 (+0x15e8, the hit re-arm, keeps the ctor's). Mode 0 / 2: life 1000, no sweep; 1 / 3:
life 180, start yaw -60 deg, +0.85 deg a frame over shell clock 30..160. The beam ends at the owner's motion change (base31's
+0x160c test): his action plays L2 M19 when M17 / M18 ends, so the beam lasts the clip's first pass.

### 3c. base01's flag 0x800 (R, not transcribed)

`0x3fa56c`: +0x1650 (the ctor's 1.0, `0x3fa388` / `0x3fa408`) times `0xbec34(owner)`; `0x3fae64..0x3fae7c`: the init ends
with `0x43ab74(shell, +0x1650 x unit +0x60)`, the unit's size. Read because his reader can build it -- but int 1 is -1 on
every mode of both arcs, so no shell of his sets it; init011 keeps its refusal.

## 4. base40 (R, whole) -- the whirlwind

`uShellEmBase40` vtable `0x1751ef8` (86 slots, +0x158 the next table's header); the census (vtables with init `0x41e3f8` and
move `0x41e624`) finds it and uShellEm079_sp_40 only.

* 4a. ctor `0x41e194`: +0x15c8 0, +0x15cc / +0x15d0 -1, +0x15d4..+0x15f0 0, +0x15f4 a GOT vec, +0x15f8..+0x1604 0, byte
  +0x1608 0, +0x15a8 0x28. Setup allocator `0x41e158` (0x10 bytes).
* 4b. reader `0xffdadc`: ef 0 -> +0x15c8; hit 0 -> +0x15cc; n = int 0 -> +0x15d0; float 0 -> +0x15d4 (life), float 1 ->
  +0x15d8 (hit re-arm); &vec 0 -> +0x15f4; three n-float tables from the ShellCmnParam (`0x4a2264`): [+0x15dc][k] = cmn k
  (the push's distance), [+0x15e4][k] = cmn k + 2 (speed), [+0x15ec][k] = cmn k + 4 (reach). His: n 2 -> (1000, 1500),
  (12, 12), (2000, 2000).
* 4c. init `0x41e3f8`: `0x43a850` and the owner's byte +0x50 bit 0, else deleted; the reader; state 1; +0x15f8 = the life;
  +0x40 = vec 0 turned by the OWNER's yaw (`ldrh` block +0x54 x 2pi/65536: x cos + z sin, z cos - x sin; y as is) + block
  +0x40..; words (0, block +0x54, 0); ef 0 at +0x40 on the shell (`0x4a10c8` / `0x4a11e4` -> handle +0x1604, no rotation);
  hit registration when `0x4a1ad8`.
* 4d. THE PUSH `0x41e8ec(shell, k, T)` (Malfestio's `0xff27cc(e, k)`: the shell kept at e+0xcb4c, T = his block +0x40;
  `0xfef920` drops the handle once the unit leaves states 1 / 2): d = the x / z distance; d > reach[k] -> nothing; w = u16 of
  atan2(shell - T) as a word, less block +0x54 (32-bit, no wrap): |w| > 0x4000 and d >= 200 -> nothing; else byte +5 = 1,
  +0x1600 = distance[k], the velocity = his facing (as (dist sin Y, 0, dist cos Y) taken through the shell's point, then
  normalised unless shorter than 2^-23) x speed[k].
* 4e. move `0x41e624` -> `0x41e6fc`: `0x4a1698`; handle hygiene; state 0xfe: the wait (+0x15f8 = 1800 at the end) until 0
  or the effect is gone; state 1 (vt +0x154): owner inactive -> end; life > 0 -> +0x15f8 counts down, end at 0; +0x1000 =
  +0x40; byte +5 == 1 -> `0x5391d4` (+0x40 += dt x velocity), +0x1600 -= |velocity| dt, at <= 0 vt +0x8c `0x539170` (the
  velocity zeroed) and byte +5 = 0; the hit re-arm.
* 4f. end `0x41eb74(shell, flag)`: `0x43b058(+0x1604, flag)`, `0x4a1de4`, vt +0x150 (bx lr), state 0xfe, +0x15f8 =
  [`0x162493c`] x 60; flag 1 deletes.

So: L2 M23's landing leaves a whirlwind 150 ahead of him, 200 up, for 390 frames (Nightcloak's: 5); his next wing gust (L2
M36 / M37 f86, k 1) drives it 1500 along his facing at 12 a frame if it lies within 2000 and before him; leaving L1 M26 for
M27 drives it 1000 (k 0).

## 5. Nightcloak's shell00 (R)

Reader `0xffd2c0`: ef 0..3; hit 0; int 0 the joint; bit 0 = int 1, bit 2 = int 3, bit 3 = int 4; floats -> degX / degY /
vz (float 2) / flight (float 3) / X lo / X hi; vec 0 the offset, vec 1 the aim offset; vy and gravity not written (0, the zero
vector). Landing `0xffd4a8` = base00's by type. Modes 2 / 9..13: flags 0xd, joint 0, X lo = X hi = 0 -- base00's X aim
(`0x3f9378`) clamps to 0 whatever the aim, so the word is the owner's; the offset turned by the final words (bit 3); Y +
degY (0, 8, -8, 38, 0, -38); vz 22 / 25, flight 300, no gravity: straight blades. Mode 3: flags 4, joint 0's matrix, X + 16
deg, vz 10. A clamp range other than 0..0 would need the aim (its point under bit 3, its target): refused by name.

## 6. In the viewer

* `actions079`: a row per action; `pick` 'always' where one action plays the clip (L2 M17, M18, M36 / M37; Malfestio's L2 M23
  and L1 M27), else 'ai' (the play's pick, as Boltreaver's), with `op1c` on the op-0x1c forms. `also` names actions with the
  same spawns.
* `spawn079` (line 4, the fresh step too): `atStart` rows on the clip's first step; frame rows by pass001; shell31 rows end
  at the clip's wrap (the game's L2 M19); the push drives the newest live shell40 (refused by name when none).
* `perFrame079`: PERFRAME079 by motion id; Nightcloak's `noAction` (7, 0xcc / 0xcd) against the play's action (with none
  resolved the gate is taken open: I). The stealth state is not modelled (the viewer shows him uncloaked).
* The rank: `input.rank` (index.html SHELL_QUEST_RANK, 5) -- `0x3a8430 == 5` gives shell31 2 / 3 (the 1300 / 1500 beam,
  u 1).
* Records exported `when: 'shell'` (add_effects.export): em079_00u 0 / 1 / 10 / 20 / 21, em079_00c 29 / 30; em079_04u 0 /
  1 / 10 / 20 / 21 / 30 / 60 / 80 / 81, em079_00c 29 / 30. u 0 / u 1 (em079_00_000) carry a cParticleNodeInfinite row (type 25,
  word 3 & 0xf0): the effect runtime builds it (construct.js 0x9baca0 -> 0xaf127c / 0xaf12b8) and draws it through
  INF_PARTICLE (live.js; the GL side landed 2026-10-01) -- a program variant no log exported skips that node, counted.

## 7. Not read / open

* Which row (7, 0x1d)'s angle-picked turn takes (L2 M36 or M37): `0x794f0` NR -- both carry the push.
* The streams' own switches (0x92, 0x98, 0x16, 0x02 / 0x0b) among the issued forms: the viewer's pick stands in.
* `vt +0x1ec` / `+0x1f0` (`0xffc66c` / `0xffcae4`, L2 M35 / M12, no shell): their issuer.
* base40's hit side (+0x15cc / +0x15d8 re-arm, `0x4a1de4`) and `0x4a1698`'s owner-state delete: not visual / never in the viewer.
* Nightcloak's stealth (`e+0xcafc`) as an input.

## 8. Verified headless (2026-10-15)

`<archive>/m079/probe3.js` through `probe.mjs` (the live viewer, the Enraged toggle where the form needs it), shots in
`dev/shots/m079/`: every row above spawned its shell and its effect started -- em079_00: L2 M17 u 1 (shell31 2) /
`p3_m00_L2M17_u1_front`, L2 M18 u 1 (shell31 3, swept) / `m00_L2M18_sweep`, L2 M14 / M15 / M35 / M12 enraged u 20 (shell01 8 / 9
/ 4 / 5) and L2 M12 u 21 (6) / `p3_m00_L2M14_u20`, `p3_m00_L2M12_u21`, `p3_m00_L2M35_u20`, L2 M43 u 20 (7) / `p3_m00_L2M43_u20`,
L1 M2 c 29 / L1 M22 c 30 / L1 M27 c 30 (the dust); em079_04: L1 M27 (7, 0xcc) u 60 (shell00 3) / `p3_m04_L1M27_u60`, L9 M4 u 60 x 1
/ x 3 / `p3_m04_L9M4_u60x3`, L2 M43 u 30 (12), L2 M14 enraged u 20 / u 30 (8 / 10) / `p3_m04_L2M14_u30`, L2 M17 u 1, L2 M23 u 10
(life 5). The push: L2 M23 then L2 M36 (u 10's entry removed, see below) -- the whirlwind at z 117 driven to 441 from f86 (k 1).
`dev/effect-live-soak.mjs --viewer-inputs --rage`: em079_00 95 motions 0 refused, em079_04 101 motions 0 refused (the full
soaks play no L2 M23 and their `--rage` does not set the viewer's Enraged toggle, so the op-0x1c picks stay calm there).
Named: em079_00 L2 M23 REFUSED -- `unverified path: 0xa942c8 falls into unrecorded code`, alive em079_00u 10 (shell): **u 10 needs
recording** (em079_00_010; its sibling keys u 20 / 21 / 30 run). em079_04 L2 M23 / M14 / M15 / M12 / M35 / M43, L1 M27: 0 refused
(his u 10 lives 5 frames; it may reach the same path in a longer run -- record it with his brother's).
