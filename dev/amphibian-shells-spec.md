# Amphibians -- shells spec (shells agent, 2026-10-18)

The shells walk, the Amphibians group: Tetsucabra / Drilltusk (em066_00 / em066_04), Zamtrios (em067_00). Every value below was read
from the instruction that consumes it unless it says INFERRED; the transcription is docs/render/shells.js (the TETSUCABRA / DRILLTUSK
block and BASE16), the checks dev/shells-tetsucabra-check.mjs / dev/shells-drilltusk-check.mjs. The index rows are in dev/rom-map.md,
section "Amphibians -- the shells".

## 0. `0xc241c` is a CAMERA request, not a shell spawn

The effects lane's em066 spec 5 and rom-map row `0xf592a0..0xf593ec` called vt+0x208's variant-4 tail `0xc241c(e, 0, 1 / 5, 0)` "a
shell spawn: the shells agent's". Read 2026-10-18: `0xc241c` tests the area byte e+0x1054 against `0x49660()`, takes the joint's world
point (`0x539e08`) or none, then `0x49df0` / `0x49da0` -- each gated by `0xb6fc4`, each passing a global (GOT `0x17e7e8c` /
`0x17e7edc`) to `0x19148`, which takes the global's `+0x54` object, walks its DTI chain (`+4` against `[0x1832198]` = DTI `0x18467c0`,
parent `+0x10`) to **uFestaCamera** and tail-calls `0x1ce9c` (its own method: `0x539300` and two virtual calls). No shell is made.
The shake itself stays INFERRED, as shells.js `camera001` names it. The two rows are moved to the Withdrawn table.

## 1. Tetsucabra / Drilltusk (em066_00 / em066_04) -- DONE

Checks: dev/shells-tetsucabra-check.mjs 27 / 27 and dev/shells-drilltusk-check.mjs 27 / 27 (ROM cases with every child, the slab's
phases positively, contract, 7 controls FAIL each); pages 14 / 15 each -- the one FAIL is u 0's record run on its own (1e). Records
exported (shell): em066_00u and em066_04u 0, 1, 2, 20, 22, 24, 30, 32, 40, 42. dev/checks/em066_00 128 / 0; both clip soaks clean.

Classes (the shell table 0x175c3e8, res 0x8a6d..0x8a74 -> 0x159daa0): 0x11a / 0x11e sp_00 (base00), 0x11b / 0x11f sp_01 (base01),
0x11c / 0x120 sp_13 (base13), 0x11d / 0x121 sp_16 (NEW base16). The ids are FIELDS: vt+0x158 `0xf57ce8` by e+0xb5f5 into e+0xcac4
(sp_13), +0xcac8 (sp_00), +0xcacc (sp_01), +0xcad0 (sp_16) (states-em066_00.md 8.2; the loads `0xf58eb8` / `0xf58f70` sp_16,
`0xf5d424` / `0xf5f280` sp_01, `0xf5dc64` sp_13, `0xf5ead8..0xf5edf8` sp_00).

### 1a. The census and the makers

Census `fb/cen11_em066_0N_k1.txt` / `_k3.txt` (all 16 statuses, variants 0 / 4, the boulder kinds 1 and 3, the ids and the real .dtp
filled -- cengen11: the first pass's creates recorded and the landing answered, trap 87). Only statuses 3 and 7 make shells:

| action | clip | what | site |
|---|---|---|---|
| (7, 0x55 / 0x83 / 0x85) | L4 M1 f124 | sp_00 by the tusks: level < row 0 -> modes 0 + 1, < row 1 -> 2, else none | `0xf5e94c..0xf5ee74` |
| (7, 0x56 / 0x84 / 0x86) | L4 M2 f124 | sp_00 5 + 6 / 7 / none | same function, sb = 1 |
| (7, 0x21 / 0x22 / 0x36 / 0x37) | L2 M12 f58 | sp_13 0 (r3 = 0 of `0xf5db40`) | `0xf5dc30..0xf5dcd0` |
| (7, 0x89 / 0x77) | the ACTION START (vt+0x204 `0xf57f8c`) | sp_16: below row 1 mode 2, else 3 | `0xf58dd0..0xf58fc8` |
| (3, 0x50..0x55) | landing (L0 M23 / M26 start) | sp_01 1 at P+0x40 with P+0x50.. | `0xf5d370..0xf5d4c8` |
| (7, 0x57..0x6a) / (7, 0x80 / 0x81) | f15 of their landing clips | sp_01 2 / 3 at P+0x40 | `0xf5f250..0xf5f3bc` |

The tusks: `0x9d36c(e, 0)` (block +0x3bc) against `.dtp` A rows 0 / 1 (byte 1, byte 2 at questRank > 4): em066_00 / em066_04 both 1 /
2. The viewer passes the level the parts show (motion-states.js `tetsucabraTusks066`: sets 3 / 4 / 5, input.tusk066).

THE QUEST MAP. Every sp_00 / sp_16 maker tests vt+0x9c `0x6bb20` (e+0x1053, the quest's map number) `<= 0x14 && (0x104008 >> map) & 1`
-- the snow maps 3 / 14 / 20 (rom-map `e+0x1053`). sp_00 tables `0x16a0850` {0, 1, 2, 0, 0, 0, 5, 6, 7} / snow `0x16a0820` {3, 4, 10,
3, 3, 3, 8, 9, 11} (index 0 / 1 two rocks, 2 one, for L4 M1; 6 / 7 / 8 for L4 M2); sp_16 modes 2 / 3, snow 0 / 1. The viewer has no
quest map, and the base ctor's 0xff is no snow map: the raw lists play the plain modes. **SNOW VARIANTS (Raven, 2026-10-18)**: a list
of its own ("Snow Variants", index.html; render/shells.js SNOW_VARIANTS: L4 M1 / M2 / M30) plays the same clips with the map on
(input.snow): the rocks from 0x16a0820, the slab 0 / 1; records u 21 / 23 / 25 / 31 / 33 / 41 / 43 exported (em066_00 / em066_04).
Checks: shells-tetsucabra / -drilltusk-check.mjs snow cases (the ROM's own run with e+0x1053 = 3 / 14 / 20) + controls (the map
off fails), 35/35 each; pages 25/25 (the list, the snow rocks, the snow slab).

NOT BUILT, by name: the sp_01 the jumps make (status 3's landing mode 1, (7, 0x57..0x6a / 0x80 / 0x81) modes 2 / 3) -- every sp_01
mode's EffectParam is (999, -1): hit volumes that draw nothing. sp_13's landing child (mode 0) IS made, as the ROM makes it.

### 1b. sp_00, the rocks (base00)

Reader `0xf64f38` (READ whole; the getters' r1 is set for the NEXT call before each store): ef 0..3 -> +0x15c8..+0x15d4; hit 0 ->
+0x15d8; floats 0 degX +0x15ec, 1 degY +0x15f0, 2 vz +0x15f4, 3 vy +0x15f8, 4 the flight +0x15fc, 5 / 6 the X clamp, 8 / 9 the Y clamp,
7 -> +0x1664 (+0x1618 = &+0x1660); &vec 0 the offset +0x1610, &vec 1 +0x1614, &vec 2 the gravity +0x161c. No int: the joint and the
flags are base00's ctor's (-1 / 0, `0x3f8a04`) -- the owner's point, the offset turned by his facing, his words plus the degree
offsets. Its landing is base00's own (`0x3f8878`). The setups (`0x3f883c`, 0x30 B): +0x10 / +0x20 the zero vector, +0x2c 0, +0x2e
0xffff. shells.js params066s00 (READER00), made by makePlain.

### 1c. sp_13, the thrown rock (base13) and its landing

Reader `0xf65478` (READ whole): ef 0..3; hit 0; int 0 the joint +0x15e4 (-1); +0x15e0 = 2 (int 1) | 8 (int 2), then bic 0x51 / orr
0x50 -> 0x5a; floats 0 speed +0x15ec, 2 gravity +0x15f4 (-1.0), 1 per unit +0x160c, 4 far +0x1600, 3 near +0x15fc, 5 life +0x15f8;
&vec 0 both points; bytes +0x15c1 = +0x15c3 = 1.
- base13's init on 0x5a: joint -1 -> the owner's +0x40, the points' midpoint turned by the owner's words (`0x43ae70`), times the size
  (`0xbe518`, flag 8 -- `0x40481c..0x404864`), added.
- THE THROWN POINT WITH FLAG 0x40 (`0x405554` -> `0x4055b0`): from the OWNER's block +0x40, not the shell's -- the distance to the
  target clamped [near, far] along his facing (0x10, `0x4054e8`), the setup's +0x20 added, the height the target's + +0x1614.
  shells.js thrown066s13 (thrown13 takes the shell's point: Khezu's 0x40 arm is clear).
- +0x15c3 = 1: `0x43ac8c` queries through `0x4a1f24` (the query word 0x80) instead of `0x4a1e84` (0x40 | +0x1374's bit) -- the same
  endpoints and mask; what 0x40 / 0x80 select inside `0x183490` is NOT READ (the stand-in's floor answers both alike).
- Landing `0xf65640` (READ whole), state 2 only: types 0 / 1 -> vt+0x174 `0xf6573c` first (owner active: sp_01 0 at the contact,
  its words at +0x30, +0x3c the shell's +0x13dc); type 1 then +0x40 = the contact and the words from the ground (`0x43b1a0`); ef 1 /
  ef 2 at the contact (`0x4042bc`) and the end; type 2 -> ef 3 ((999, -1)) and NO end; any other type the end.
- sp_01's reader `0xf65250`: ef 0 (every mode (999, -1)); hit 0; +0x15ec 0x800 int 0, 4 int 1, 8 int 2, 0x1000 int 3; float 0 the
  timer +0x15f0; &vec 0 the offset +0x1608 (shells.js params066s01, READERS01).

### 1d. sp_16, the slab (NEW base16)

The band `0x407de8..0x408740` (ctor, init, update, step, ending, end), READ whole; vtable `0x17dd5cc` to +0x160 (+0x15c / +0x160 0; the
next class's starts at +0x164 = `0x17dd730`).
- ctor `0x407de8`: ef +0x15c8..+0x15d0 = 0, hits / ints +0x15d4..+0x15e8 = -1, floats +0x15ec..+0x15f8 = 0, vecs +0x15fc / +0x1600 the
  zero vector, handles +0x1604..+0x160c = 0, +4 = 0, +0x15a8 = 0x10.
- reader `0xf65954`: ef 0 / 1 / 2 -> +0x15c8 / +0x15cc / +0x15d0; hits 0 / 1 / 2 -> +0x15d4 / +0x15d8 / +0x15dc; ints 0 / 1 / 2 ->
  +0x15e0 / +0x15e4 / +0x15e8; floats 0..3 -> +0x15ec..+0x15f8; &vec 0 -> +0x15fc, &vec 1 -> +0x1600. Its +0x98 `0xf65ac8` starts ef
  +0x15d0 at a hunter's hit (u 100 / 110: none in the viewer).
- init `0x407ef0`: the gates (`0x43a850`, the owner unit's byte +0x50 bit 0); +0xfe8.. = block +0x50.. (the owner's words); state 1 /
  phase 0; the wait +0x1604 = float 0; the point = the owner's +0x40 + vec 0 turned by the block's +0x54 halfword (x cos + z sin, z cos
  - x sin); +0x1000 = that point; the ray `0x183664` from it to (x, y + 500, z) -- whose second point sets only the START, p.y + max(to.y
  - p.y, 100) (`0x1836e4..0x183724`), the ray then straight down (how far `0xc30db4` reaches: NOT READ) -- no hit deletes it (vt+0x40),
  a hit sets y = the floor + 0.25 x BodyDataList[+0x15dc]'s first record's +0x10 (`0x4a15bc` -> resource +0xc4 + 4 slot `0x489e44`;
  rBodyData vt+0x40 `0x50fac` = its +0x68, the file's records from +0x10, the loader `0x50e38` checking "BDD" 0x20110219). ef 0 at the
  point -> +0x1608.
- THE BODYDATALIST: the .shl's `BodyDataList` (8 entries: `_16_00_bodydata`, `_16_01_bodydata`, 6 null); the resource's +0xc4 array by
  its setter `0x489e50` / getter `0x489e44`, count `0x489e98` = 8 (the property's name to this pair: INFERRED from the count and the
  table's order). The records' radii: em066_00 360 / 160, em066_04 380 / 350.
- update `0x4081e4`: `0x4a1698`; each handle dropped once its unit leaves states 1..2; byte +4 0xfe -> vt+0x158, 1 -> vt+0x154.
- step `0x40827c`: the clock +0x1378 += dt; +0x1000 = +0x40; the owner inactive -> deleted; the wait: > 0 -> less dt floored at 0
  (vselge), returning while it stays > 0; then the phase byte +5:
  - 0 -> 1: the wait = float 1; hit 0 registered (vt+0x140, `0x4a1ad8` gate); BodyDataList[+0x15dc] on (`0x4a15d4` -> `0x16969c`); the
    camera int 1 (`0x43ac04`).
  - 1 -> 2: the wait = float 2; ef 0's handle KILLED -- its vt+0x40 `0x43384` -> `0x3290c0` (vt+0xa0, the unit's state 3), not the
    graceful `0x329c40` -- and zeroed; ef 1 at +0x40 -> +0x160c.
  - 2 -> 3: `0x4a1870` (the hit side's +0x151e = 0xff); +0x40 += vec 1 turned by +0xfec's halfword; the wait = float 3; hit 1
    registered; the camera int 2.
  - 3 -> the end vt+0x148(0).
- end `0x408684`(0): +0x1608 stopped gracefully (`0x43b058`: null by then), `0x4a1de4`, vt+0x150 (`bx lr`), byte +4 = 0xfe, the wait =
  `[0x162493c]` x 60.0 = 1800. +0x160c is NOT stopped: ef 1 runs out by itself.
- ending `0x4085fc`: the wait run out -> deleted; else either handle live -> wait; both gone -> +4 = 0xff (the word), deleted.
- His files: modes 0..3, waits 54 / 415 / 65 / 50 (em066_04: mode 0 / 2 54 / 600 / 65 / 50, 1 / 3 54 / 300 / 65 / 50); vec 0 (0, 0, 730)
  / (0, 0, 650), vec 1 (0, 0, 400) / (0, 0, 320) (em066_04 1000 / 850, 480 / 310); ShellScale em066_04 1.3 / 0.8; ef 0 u 30 / 32 (rising),
  ef 1 u 40 / 42 (its second phase).
- shells.js make16 / step16 / end16, the maker spawn066 (`slab066`: the play's first step, the owner as he stands).

### 1e. Check instruments added (<archive> fb/emu_fb.py, cengen11.py)

- emu_fb `bodydata` {slot: radius}: the resource's BodyDataList (+0xc4) as rBodyData objects (vtable `0x172bd3c`), cleared every flight.
- emu_fb `rayStart`: `0x183664` with a second point ABOVE the first starts at p.y + max(d, 100) and goes down (the read above); a second
  point below keeps the harness's earlier segment (no earlier case changed).
- emu_fb `coreVt`: a started handle carries the core vtable `0x172a578`, and its vt+0x40 `0x43384` is hooked -- logged `kill`, the
  unit's state 3.
- emu_fb `ownvt` {slot: fn}: the enemy's own vtable slots (vt+0x9c `0x6bb20`: the map byte e+0x1053 read for real, 0xff).
- emu_fb: `0x4a15d4` (the body registration) logged, not run.
- cengen11.py (= cengen10 + the first pass's creates + the landing answered: `landed` = 1 with P+0x14 = -1.0).
- u 0's record (the thrown rock, `em066_00_001`, a model unit) run on its own on the page stops at `0xaf7ba8 in L_af7930` -- an unrecorded
  path of the effects lane's lift (the board's Switch Axe entry, 2026-09-28, met the same site); in play (its shell's own parent) the
  rock draws (the page's L2 M12 start, u 0 requested). For the effects lane.

## 2. Zamtrios (em067_00) -- DONE

Checks: dev/shells-zamtrios-check.mjs 12 / 12 (ROM cases with every child, contract, 5 controls FAIL), page 7 / 7, dev/checks/em067_00
7 / 0, the clip soak clean. Records exported (shell): em067_00u 0, 1, 10, 11 (his beam's 30 / 31 were there).

Classes: vt+0x158 `0xf77488` registers 0x122 sp_01 (base01), 0x123 sp_02 (base02: the beams, render/beam-spawns.js) AND 0x124 sp_13
(base13) -- immediates, the third by the tail-call at `0xf774c0` (states-em067_00.md 1.6 lists two). Res 0x8a75..0x8a77; vtables
sp_01 `0x17ded18`, sp_13 `0x17df004`.

### 2a. The census and the makers

Census `fb/cen11_em067_a/b/c.txt` (all 16 statuses, the .dtp filled, cengen11):

| action | clip | what | site |
|---|---|---|---|
| (7, 0x21 / 0x36) | L2 M12 f58 | sp_13 4 at the target; then (r7 0) sp_13 3 with +0x30 = 0 and 1 | `0xf70448..0xf70784` |
| (7, 0x22 / 0x37) | L2 M12 f58 | sp_13 4 only | same |
| (7, 0x18 / 0xca / 0xcb) | L4 M37 (phase 1), every pass of f140 | P+0x1a2 += 1; the hop `0xc10d4` toward the table by r1 (`0x212e090` / `0x212e130` / `0x212e1d0`, nine points then (-1, -1, -1): P+0x1a3 = 1, the phase ends at the motion's end -> L4 M38); sp_13 (P+0x1a2 % 3 == 1 ? 1 : 0), +0x30 = P+0x1a2 - 1 -- nine shots | `0xf6f15c..0xf6f6c0` |
| (1, 0x43) / (7, 0xc / 0xd) / (12, 0) | L4 M20 f26 | sp_01 4 | `0xf694e8`, `0xf74e48` |
| (2, 7) / (7, 0x43) | L4 M66 f150 | sp_01 1 | `0xf6b454`, `0xf70dbc` |
| (7, 0xb / 0x3a / 0x41 / 0x42 / 0x44 / 0x45) | L4 M12 f190 | sp_01 3 | `0xf6ee40` |

Every sp_13 maker tests e+0xb5f5 == 0 (his only variant). L4 M37 is a split motion: _start 140 frames, _loop 30 -- f140 is the
_loop's start, passed at every wrap (`0x7294c`), so the shots come one a cycle. NOT BUILT, by name: the sp_01 the actions make --
its reader takes no EffectParam (2c): hit volumes that draw nothing.

### 2b. sp_13, the balls (base13), its target and its landing

Reader `0xf78934` (READ whole): ef 0..3; hit 0; +0x15e0 = 8 (int 0) | 0x10 (int 1), then |= 0x60; floats 0 speed +0x15ec, 2 gravity
+0x15f4, 1 per unit +0x160c, 4 far +0x1600, 3 near +0x15fc, 5 life +0x15f8; &vec 0 both points; the far and the near times the owner's
size (`0xbe518`, `0xf78ad8..0xf78b04`); +0x15c1 = +0x15c3 = 1; then by the mode (`0x4a0ee4`): < 2 -> the ShellCmnParam's int 0 points
(cmn vecs 0.., `0x4a22a8`), 3 -> its int 1 points (cmn vecs 9..), into +0x167c (count +0x1684). The joint +0x15e4 the ctor's -1
(`0x404350`). His cmn: ints 9 / 2, eleven points (the nine of L4 M37 and L2 M12's two).
- vt+0x170 `0xf79090` (READ whole), the target: modes < 2 -> point [+0x1640] (= setup +0x30, the init `0x40453c`) x the size, turned
  by the block's words Z (+0x58), X (+0x50), Y (+0x54) (turnByWords' order), plus the block's +0x40; mode 3 the same with y = the
  target's (block +0x1d4); other modes the block's target +0x1d0.
- The thrown point (0x405500 on 0x68 / 0x78): from the owner's block point (0x40), along 0x10's facing (mode 4) or 0x20's bearing to the
  target point (limits the ctor's 0 / 0), the distance clamped [near, far] (sized). base13's init as Tetsucabra's (shells.js init13t).
- Landing `0xf78ed0` (READ whole), state 2 only: type 0 -> ef 1, type 1 -> ef 2 (no snap), each after `0xf78f60` (owner active, mode
  <= 4 with bit (0x1b >> mode): sp_01 `[0x16a0be0][mode]` = {8, 9, 8, 10, 11} at the contact, its words at +0x30, +0x3c the shell's
  +0x13dc); then `0x4042bc` and the end; type 2 ef 3 and no end; any other type the end.

### 2c. sp_01 (base01) -- hit volumes

Reader `0xf78458` (READ whole): hit 0; +0x15ec 4 int 0, 8 int 1, 0x1000 int 2 -- and NO `0x4a22f0`: +0x15c8..+0x15d4 keep the ctor's 0
(`0x3fa2f8`), so no mode starts anything (modes 8..11's files carry (0, 1) / (0, 11), unread); the timer +0x15f0 the ctor's 0. The
landings' children are made (shells.js params067s01, efAt all null) and start nothing.

## 3. The earlier groups' censuses re-run with cengen11 (trap 87's control)

<archive> fb/recen11.py (20 monsters / variants, all 16 statuses, the .dtp filled, Mizutsune's id fields; uEm062_00 has no class
entry in the tracer -- Lagombi is uEm060_00's, already in) and recen11cmp.py (against the earlier census files: cen11r_*.txt). Keys the
re-run finds that no earlier census had, triaged against shells.js and the specs (Volvidon em062_00 re-run 2026-10-18 on uEm060_00 with FB_EM 62: the
same census as Arzuros / Redhelm's, every key built or named; em061 is Lagombi / Snowbaron -- the earlier shells specs mislabelled it
Duramboros / Rustrum, and em062 as Lagombi: corrected, rom-map Withdrawn table):
- Found only with the landing answered or only in the first pass (trap 87 proper):
  - Lavasioth (7, 0x12) sp_00 5 / 6 / 7 (`0xe44078`): ALREADY BUILT (piscine spec, L2 M12's start) -- read by hand then.
  - Redhelm (7, 0xe4 / 0xe5 / 0xe8..0xeb) sp_01 0 at the landing (`0xf1c39c`): ALREADY NAMED (fanged-beasts spec 4: "L9 M4's landing
    (sp_01 0) draw nothing").
  - Mizutsune (7, 0x12) sp_12 46 (`0x1042d2c`, no frame test): the slide trail, ALREADY BUILT (leviathan spec 5b).
  - **Rajang / Furious (13, 0) `0xdec968`: phase 0 sets L2 M29 (0x21d), ctl+0x15 = 1, and makes sp_22 (0xaa / 0xae) mode 1 at once
    (`0xdeca40..0xdeca6c`); at the motion's end (13, 1).** A second maker of the rock, at an action start of its own -- NOT in the
    fanged-beasts spec (which has (1, 0x39)'s start only). READ 2026-10-18: NOTHING ISSUES (13, 0) -- no action-change call
    (`0x76098` / `0x768c8` / `0x754b8` / `0x75230` / vt+0x3d0) with r1 13 / r2 0 in his band (controls (1, 0x39) `0xde4664`, (13, 1)
    `0xdeca38`), none in shared code, none in his command table at variants 0 / 5 (control (7, 5)), none among the image's 22 script op
    0xfe changes (control (10, 0x1d)). <archive> actscan.py. Named, not built.
- Found with a frame test too (the earlier census files' format or statuses, not trap 87): Plesioth's beams (beam-spawns.js), Congalala's
  status-3 rows (act021 3:0x3e..), Arzuros-line / Kecha / Gammoth / Duramboros / Agnaktor rows -- each already built or named, except
  **Agnaktor (13, 5) L2 M19 f220 sp_01 0 (`0xec04e8`)**: a hit volume (ef 999) like the (6, 2) / (12, 0) rows the spec names -- named.
- Keys an earlier census had and the re-run lacks (Duramboros, Gammoth / Elderfrost, Mizutsune / Soulseer): those censuses ran with the
  classes' own extra inputs (ids, the armour gate, the chooser's state); not a loss.
