# Leviathans -- shells spec (shells agent, 2026-10-18)

Census: <archive> `fb/cen10_em046.txt` / `cen10_em047.txt` / `cen10_em049.txt` / `cen10_em056.txt` / `cen10_em082.txt` /
`cen10_em082v4.txt` (cengen10: every status x number x phase, each frame-test literal answered alone, the closure per literal),
plus `fb/cen_heat049r3.py` (Agnaktor with his heat and .dtp opened). Folders READ off the path table (`0x175c3e8` res ->
`0x159daa0`; <archive> `shellres.py`). The census answers frame tests only: a shell made on a TIMER (Lagiacrus's sp_25, 1d)
does not show in it -- grep the class band for the id immediates before calling a census complete (rom-map trap).

## 1. Lagiacrus (em046_00) -- DONE

Check dev/shells-lagiacrus-check.mjs 39 / 39 (28 ROM cases with every child tree, 2 contract, 11 controls FAIL), page 26 / 26,
dev/checks/em046_00 66 / 0. Records u 0..4, 10, 11, 60, 70, 80..82, 90, 91, 120, 301, 311 exported; u 61 NOT (1f); u 62 / 63
(sp_01 17 / 18) are not in em046_00u, and nothing makes those modes.

Ids immediates (`0xe9f3d4..`): 0xe6 sp_00 (base00), 0xe7 sp_01 (base01), 0xe8 sp_11 (base11), 0xe9 sp_25 (base25), 0xea sp_26
(base26); res 0x8a39..0x8a3d.

### 1a. sp_00, the thunderballs (base00)

- Reader `0xeaa5b4` (READ whole): ef 0..3; hit 0; int 0 the joint; +0x15e8 = 1 (int 3: the X aim) | 2 (int 4: the Y aim) | 4
  (int 5: the aim from the shell's point) | 0x40 always; floats 0..7 -> degX, degY, vz, flight, X clamp, Y clamp; &vec 0 the
  offset +0x1610, &vec 1 the aim offset +0x1618; vy / gravity the ctor's. Then the owner's words +0xfe8.. -> +0x1660.. and mode
  10 -> byte +0x15c1 = 1 (a hunter hit's stage query: no hunter in the viewer).
- Landing `0xeaa820` (state 1): type 0 -> ef 1, type 1 -> ef 2, each after `0xeaa8cc`'s child; type 2 -> ef 3 except mode 10,
  which flies on (no start, no end); then `0x3f8970` and vt+0x148(0). `0xeaa8cc`: type 0 -> sp_01 of int 2 (none below 0); type 1
  -> sp_01 of int 1 when 8..14, 14 while tired (`0x81614`); at the contact, words +0x1660... Only type 1 (the floor) is reached
  in the viewer's stage; the type-0 child (int 2: mode 27) is transcribed, not exercised.
- Rows (`actPlain`): L4 M6 (7, 0x36 / 0x56) f98 10, (7, 0x41 / 0x50 / 0x57 / 0x58) 7; L4 M15 (7, 0x48 / 0x49) f16 1; L4 M30
  (7, 0x72 / 0x75 / 0x77) f96 7, (7, 0x73 / 0x79) 5; L4 M32 (7, 0x74 / 0x7a) 2, (7, 0x76 / 0x78 / 0x7c) 6; L4 M31 (7, 0x7d /
  0x7f) f60 4, (7, 0x81) 9; L4 M33 (7, 0x7e / 0x80) 3, (7, 0x82) 8; L2 M37 (7, 0x83) f14 0; L2 M36 (7, 0x8e) f90 0. Aimed (flag 1
  or 2): modes 0, 1, 6..10. No helper reads another gate (the 0x3a8430 test at `0xea3ca4` gates an effect, not a shell).

### 1b. sp_01, the discharges (base01) and sp_11 (base11)

- sp_01 reader `0xeaab48` (READ whole): ef 0; hit 0; +0x15ec = 4 (int 0) | 8 (int 1) | 0x800 (int 2) | 0x1000 (int 3 == 0);
  int 3 -> +0x1610 (-> +0x15bc at the init's end: the hit side); &vec 0 -> +0x160c (the words' degree offsets), &vec 1 ->
  +0x1608 (the offset). No timer: each lives while its hit slot is on (hitdata 14 records).
- base01 flag 0x800 (READ, rom-map base01 0x800 row): +0x1650 (1.0) x 0xbec34(owner), the init's end sets the unit's size to
  +0x1650 x +0x60. **The ROM's +0x60 there is 1.0 on every base01 mode, not ShellScale** (his 0.8 / 0.93 modes: the check's
  unit-size comparison) -- so the 0x800 size is the owner's size alone (modes 20 / 21; init011 transcribes it, no longer refuses).
- sp_01 +0x154 `0xeaac6c` (in base01's end, owner active): modes 8..12 -> sp_11 1, mode 13 -> sp_11 2 (its point and words).
- sp_11 reader `0xeaaf38`: count = int 0, times = floats 0..n-1. Its +0x168 `0xeab080(shell, k)`: vec k turned by its Y word
  plus its point; mode 1 -> sp_01 2, mode 2 -> sp_01 15 (k < 3) / 16; mode 0 nothing (and nothing makes sp_11 0).
- Owner rows: L4 M2 (7, 0x6e) f200 26, f260 3..6, f320 22..25; L4 M10 (7, 0x6f / 0x70) f160 0 / 1 (with the spiral, 1d); L4 M36
  (7, 0x9a / 0x9b) f36 20 / 21. The owner's base01 makers use his point +0x40 and words +0xfe8.

### 1c. sp_25, the strike marks (base25, NEW)

- base25 READ whole: ctor `0x40f0c8`, init `0x40f198`, move `0x40f62c`, end `0x40f7ac`, +0x150 `bx lr`; sp_25's reader `0xeab42c`
  (ef 0, hit 0, float 0 near, float 1 far, &vec 0) and +0x154 `0xeab4b0` (owner active: sp_01 7 at its point and words).
- Init: the words from the owner's block +0x40 to its target +0x1d0 (X = atan2(-dy, |(dx, dz)|), Y = atan2(dx, dz), Z 0); the
  point = vec 0 with z + max(near, min(far, the ground distance)), turned Z, X, Y, plus the block; a stage query (mask 0x10) from
  500 above to 500 below (no hit deletes it); ef 0 at the point; hit slot 0 (hitdata (120, 20)). No timer: alive while its slot is
  on; the end stops ef 0 gracefully and makes the bolt; the ending waits for the handle (at most 1800).
- Maker: (7, 0x68 / 0x69) -> `0xea3c10(e, 1, 0 / 1)` (jump table `0xea6e98` on e+0x73e1 - 0xc: 0x68 -> `0xea763c`, 0x69 ->
  `0xea764c`). Phase 0 plays L4 M8 (0x408) and clears the timer P+0x1bc; each phase-1 call adds the owner's step and, past tune
  float 1 (1.0), makes four sp_25 of row [`0x169eac0`][r2] (0..3 / 5..8; row 2's 10..13 has no caller) from the zero vector's
  point and words, then phase 2 replays L4 M8 until P+0x1a2 reaches tune int 0xc (2). The viewer: `spawn046`'s timer (dt per
  step after the action's first). The viewer lists L4 M8 as `Motion[8]_loop` only.

### 1d. sp_26, the thunder spiral (base26, NEW)

- base26 READ whole: ctor `0x40faec`, init `0x40fbfc`, move `0x40ff60` -> `0x41005c`, step `0x41018c`, end `0x410420`, +0x150 /
  +0x154 `bx lr`; sp_26's reader `0xeab6b0` (ef 0; hit 0 -> +0x15d0; floats 0..12 -> Rx, Rz, phase, rate, its change, the change's
  window, the fall, its window, height, growth, yaw offset). Its vtable ends at +0x154 (+0x158 = 0): the slots past it belong to
  the next vtable.
- Init: Rx / Rz, rate x DEG_TO_RAD; joint -1 (none set) -> the yaw word from the block to the target, the centre the block's
  point; the point (sin phase x Rx, height, cos phase x Rz) turned by the yaw plus the centre; ef 0; hit slot 0 (hitdata (0,
  600); mode 2 has none: it ends at its first move).
- Step: phase += dt x rate; t in (f5, f6] -> rate += dt x f4 deg; t in (f8, f9] -> y += dt x f7; the point turned by yaw + f12 deg
  plus the centre's x / z; Rx += dt x f11, Rz += dt x f11 x Rz / Rx. Words from the step's own travel. Flags +0x1618 (the rate's
  clamps) stay the ctor's 0.
- Maker: L4 M10 (7, 0x6f) f110 modes 0 / 1 / 2, (7, 0x70) 3 / 4 / 5 (no setup field read). One action row (`code 'em046'`) carries
  the spiral and the f160 discharge -- the viewer finds one action per variant.

### 1e. Check instruments added (<archive> fb/emu_fb.py)

`treeDepth` (the child trees past depth 2: sp_00 -> sp_01 -> sp_11 -> sp_01), `slot0Modes` / `slot0Ids` (hit slot 0 held on only
for those shells: the spiral's 460-move orbit), TOFF base25 / base26; the check's unit-size comparison (+0x60 after the init) and
`slotsOnly` (the module's other shells given no slots, as the run's).

### 1f. u 61 -- for the effects lane (UPDATE 2026-10-18: exported again after their read of 0xae997c; the page now stops at
0x881e38, the view's sphere test 0x881d94 -- theirs, in progress)

em046_00u 61 (sp_01 0 / 1, L4 M10's discharge at f160) stops the effect runtime, in play and started alone: its generator start
reaches render/rom/effect/construct.js `generatorFlags`' unread arm `0xae997c` (`[[g+8]+0x118]` bit 27 clear with node block
+0xbe set: "unverified path: 0xae997c node block +0xbe"). Taken back out of docs/effects/em046_00.json so L4 M10 does not stop
the viewer's runtime; the shell runs and starts nothing until the arm is read. Re-export with <archive> `fb/export_plain.py
em046_00 em046_00u:61` once it is.

## 2. Royal Ludroth (em047_00) -- DONE

Check dev/shells-royal-ludroth-check.mjs 12 / 12, page 9 / 9. sp_00 0xeb (the spits, reader `0xeb4398`, landing `0xeb4558`:
type 1 -> sp_01 [`0x169eb40`][mode]) and sp_01 0xec (the puddles, reader `0xeb4808`, 300 frames); rows in shells.js's ROYAL
LUDROTH block (L2 M6 / M4 / M16 / M5 / M17 / M31). NOT HERE by name: (7, 0xd / 0xe / 0xf / 0x22 / 0x25 / 0x26 / 0x27) modes
11..17 -- their action sets motion 0xffff (`0xeaeb28`: no clip).

## 3. Agnaktor (em049_00) -- DONE

Check dev/shells-agnaktor-check.mjs 22 / 22 (13 ROM cases incl. 6 where the ROM and the module make nothing -- cold, broken, low
rank -- 2 contract, 7 controls FAIL), page 5 / 5, soak clean, dev/checks/em049_00 31 / 0; records u 100 / 101. His beams
(0xee) are render/beam-spawns.js's.
- sp_01 0xed reader `0xec43f4`: ef 0; hit 0; +0x15ec 1 / 0x800 / 4 / 8 / 0x1000 by ints 1..5; int 0 the joint; &vec 0. Modes 0 /
  1 start nothing (ef 999): the hit volumes of (3, 0xa) L0 M29 f10, (6, 2) / (12, 0) L2 M19 f220, (7, 5 / 0x15 / 0x32) L2 M5 f128
  -- not built, by name.
- L2 M2 (7, 3 / 0x14 / 0x31; `0xeba02c`): with the TAIL's heat e+0xcace != 0 and `0x9d36c(e, 7)` below the .dtp row's byte
  (+0x1d / +0x1e by rank), at G rank -- or (7, 0x31) at any rank -- at tune floats 0xc..0xf (143 / 152 / 160 / 170) sp_01 2 at the
  block plus tune vec k turned by the facing. L2 M5 (7, 5 / 0x15 / 0x32): the CHEST's heat e+0xcac2 and `0x9d36c(e, 1)` (bytes +5
  / +6), at 112 sp_01 3 at joint 16. The viewer's input: input.heat049 (index.html: regionHot + motion-states.js
  agnaktorBroken049, the break as the parts show it).
- Harness: emu_fb `dtp` (the .dtp array at [[e+0x75f0]+0x64]).

## 4. Nibelsnarf (em056_00) -- beams done; sp_47 NOT BUILT, by name

The beam 0xf5 (sp_02) is render/beam-spawns.js's. sp_47 (0xf6, base47: init `0x425e44`, move `0x4261ec`, end `0x4263c8`, reader
`0xeeb57c`; 38 modes, u 40 / 30, 41 / 31, 42 / 32 -- the sand plumes) is made at `0xee0a90` (`0xee0828`, called from
`0xee17b0`) and `0xeea714` / `0xeea8bc` (`0xeea590`, from status (6, 0x12)): every maker first tests the QUEST MAP (vt+0x9c, the
map number e+0x1053: 0x16 with the area byte e+0x1054 in {1, 2, 5}, or 5 with area 2 / 7) and e+0x73d2. The viewer has no
quest map or area: not built. base47 is not read.

## 5. Mizutsune / Soulseer (em082_00 / em082_04) -- DONE

Checks: dev/shells-mizutsune-check.mjs 38 / 38, dev/shells-soulseer-check.mjs 49 / 49 (ROM cases with every child, contract, controls
FAIL), pages 29 / 29 and 32 / 32, dev/checks/em082_00 142 / 0, both soaks clean. Records: em082_00u 0..2, 10..12, .., 50..52, 60, 61,
80, 81, 100, 101; em082_04u the same plus 150. NOT exported: em082_04u 200 / 201 / 210 -- only the soul-flame bubbles (modes 174..190)
carry them, and the viewer shows the flame unlit (below).

Classes: 0x158 / 0x15c sp_12 (the bubbles, NEW base12), 0x159 / 0x15d sp_01 (the puddles, base01), 0x15a / 0x15e sp_02 (the beam:
render/beam-spawns.js), 0x15b / 0x15f sp_13 (the thrown bubbles, base13), 0x160 04_26 (Soulseer's ghost flames, base26 -- 1d).

### 5a. The ids, the census

The ids are FIELDS (`0x1035040`, by e+0xb5f5): e+0xcac0 sp_01, +0xcac4 sp_02, +0xcac8 sp_12, +0xcacc sp_13, +0xcad0 04_26 (variant 4).
The full census: <archive> `fb/cen12_em082_00.txt` / `_04.txt` (all 16 statuses; the id fields and the .dtp filled -- cengen10's
FB_POKE). The zero-.dtp census (`cen11_*`) had lost L2 M21's k 9 / 11: the head-break predicate read a zero threshold (rom-map trap 85).
Two spawns are TIMED and no census shows them: Lagiacrus's sp_25 (1c) and Soulseer's rest flames (5e).

### 5b. The bubbles (sp_12, base12)

- base12 READ whole: ctor `0x4033e0`; init `0x403854` (+0x15e0 bit 1 defers the real init to the first move -- no mode of his sets
  it: refused by name); the real init `0x4038cc` (the joint's row 3, the offset through its 3x3 when +0x15dc is -1; the words X =
  setup +0x10 + the block's X + u16(degX), Y = the block's Y + u16(degY), Z 0; the velocity (0, 0, float 2) turned X then Y; the drift
  +0x1020 = (0, float 3 x sin dX, -0.3 x float 3 x cos dX) turned by Y, dX the degree offset's own word; ef 0 -> +0x1604; slot 0);
  move `0x40350c` (0xfe: the wait, 1800, both handles); the step `0x40362c` (anchor, stepFlight `0x539224`; in the life's last third
  the drift = -velocity / (life / 3), re-taken each move; the life counted down; base00's collide query -> +0x150); end `0x403e88`
  (ef 0 stopped gracefully, vt+0x154, 0xfe, 1800).
- sp_12's reader `0x104f15c` (ef 0 / 1, hit 0, slot 1 not a slot, the joint, +0x15dc, the two flag bits, degX / degY, the velocity's
  z, the drift's speed, the life, &vec 0); its +0x150 `0x104f2e8` ends it on any contact but type 1; its +0x154 `0x104f318` starts ef 1
  (the pop) at its point; +0x15c / +0x160 the hit side.
- THE CHOOSER `0x104b540(e, k, r2)` (READ; run natively for every k, `fb/chooser082.py`): -1 while tired for k in 0x22243495, with
  the head broken (`0x1036e24`: `0x9d36c(e, 0)` against .dtp row 1 (Mizutsune, 3 / 3) or row 0 (Soulseer, 2 / 2)) for k 9 / 11, with
  the tail severed (`0x103780c` = vt+0x370(e, 1)) for k 3 / 19 / 22 / 24 / 28; else by the action number: the 18 of table A, (7, 0x10
  / 0x12) x = u16((r2 + k) x 0x17 + e+0x73e8 + 0x9c4) % 100 < 10 ? B : C, (7, 0x5d / 0x5e) B, any other 0. The maker `0x104a298`
  (k' -> mode, + 100 for Soulseer; the 0x14 setup, +0x10 the X tilt from e+0xcb9c); the second maker `0x104a840` (literal modes;
  none while tired for 160 / 162 / 165 / 168 / 171 -- the bits of 0x925 over mode - 0xa0).
- e+0xcb9c: written only by (7, 9)'s phase 0 (`0x1041af8`): the upward pitch to the target over 50 degrees, clamped to 1; kept.
- The rows (both monsters; Soulseer + 100 and his own frames): L2 M42 (7, 0); L2 M3 (7, 1); L2 M20 (7, 9) with the tilt, (7, 0xc /
  0x2e); L2 M64 (7, 0xa / 0x73), (7, 0x7d) the second maker's 159..161 (not in Mizutsune's file: refused by name); L2 M21 (7, 0xd /
  0x30) five; L2 M89 (7, 0x2a / 0x31); L2 M26 (7, 0x5e) Mizutsune only; status 2: L2 M39 (2, 6 / 0x14 / 0x15 / 0x34) and L2 M10 (2, 7
  / 0x16 / 0x17 / 0x35) -- Mizutsune k 12 / 13, Soulseer the second maker's 162..164 / 165..167; Soulseer's `0x104d410` (L2 M72 /
  M71 / M74 / M73, (7, 0x64..0x69)) 168..173 at f110.
  [**CORRECTED 2026-10-18 (5g): the rows sat on each action's PHASE-0 clip; a create in a later phase plays on the motion that
  phase runs** -- (7, 1) phase 3 L2 M37; status 2 phase 2 L2 M40 / L2 M11 (after L2 M39 / L2 M10); (7, 0x68) / (7, 0x69) phase 2 L2
  M71 / M72 (after L2 M74 / M73). rom-map Withdrawn table.]
- THE TRAILS (`0x104cd48` / `0x104cdb4`): (7, 0x10) L2 M24 to its frame 22 and (7, 0x12) L2 M25 (its end test `0x78b78(e, 0, 0x40)`
  NOT READ -- the clip's length here): a bubble each time the block's travel uses up the spacing (tune 0x48, 550), the chooser's k 17
  with r2 = the count. The viewer's block is the clip root's position (index.html unitGamePos), so root motion drives it.
- Soulseer's actions turn the block before some spawns (the owner's own turn `0x783fc`); the checks stub it -- the viewer's facing is
  its input.

### 5c. The throws (sp_13, base13) and their puddles (sp_01)

- The status-2 actions (`0x103bce8`'s table: n -> the action function and its SET 0..3) run six helpers (`0x104a90c` / `0x104adbc` /
  `0x104bb60` / `0x104bedc` inline, `0x104b138` / `0x104b314` through `0x104ac84`), three throws each at f10 / 20 / 30, k = 3 x the
  helper + 0..2: -1 with the tail severed for k in {0, 3, .., 15}, while tired for k - 2 in that set, with the head broken for k 18;
  x = u16((e+0x73e8 + 0x17 k - 0x9c4) % 100) against 90 / 100 on n in 4 / 5 / 8 / 9 / 0x11 / 0x13 / 0x19 / 0x1b / 0x1e..0x2d / 0x32 /
  0x33: mode 2 in [90, 100), else 0 (+10 Soulseer). The maker `0x104a634` (m <= 5; Soulseer only with the flame out): +0x20 the
  throw's vector [set][e+0x73e8 % 3][k], a table the static initialisers fill (0x2130890, read out of the initialised image).
- sp_13's reader `0x104f494` (joint 18; speed, the arc's height, life, far / near); base13's init on flags 0 (Kecha Wacha's path, the
  thrown point with the setup's vector, the launch with the arc-height arm); its landing `0x104f614`: type 1 -> sp_01 [`0x16a24d0`][mode]
  (2..7) at the contact. sp_01's reader `0x104ec34` (ef 0 at the init, ef 1 at the END: +0x15d4; flags 4 / 8; timer 300).
- [**CORRECTED 2026-10-18 (5g): the throws are PHASE 2's, on L2 M56 (after L2 M55 / M61) and L2 M59 (after L2 M58 / M62) -- the rows
  sat on the phase-0 clips.**]

### 5d. Soulseer's ghost flames (04_26, base26)

- The reader `0x104e7c4` (ef 0 / 1, hits 0 / 1, the joint (20 or 0), the orbit's floats, the rate's clamp +0x1608 with +0x1618 bit 1
  = int 1); base26's init on a joint: the block's Y word and the joint's world point as the centre; the step's clamps (READ: a limit
  below 0 caps from above, at or above from below); its +0x150 `0x104e9ec` -- the collide query each live move, any type but 1 ends it
  (+0x158 `0x104eadc`); its end's +0x154 `0x104eb0c` ef 1 at its point.
- The maker `0x104a744(e, m)` (none with the soul flame lit; none while tired for m 1 / 4 / 11): L2 M69 (7, 0x26 / 0x71 / 0x7b) f78 1 /
  3 / 5, f98 0 / 2 / 4; L2 M38 (7, 0x13) f30 10..12, f110 13; (2, 0x36) L0 M4 14 / 15 at tune 0x98 / 0x99 = 0 (a frame-0 test: made on
  phase 1's first call, the step after the motion is set -- INFERRED from 0x72714's window, whose compare is prev < F <= cur with prev
  +0x500 less the step).
- 5e. THE REST (1, 0x16) `0x103b874`: phase 0 plays L0 M14 and sets the counters e+0xcb34..+0xcb40 = tune 0x7f..0x82 (500 / 800 /
  600 / 900); phase 2 (L0 M15) counts each down by the step (`0x7206c`) and, at or below 0, reloads it and makes 04_26 6 / 7 / 8 / 9 --
  on through the rest. The harness stubs 0x7206c; the check runs it natively (emu_fb `unstub`).

### 5f. Named, not built

- ~~THE SOUL FLAME (P+0x1bb bit 1): the effects lane shows it unlit (dev/em082-effects-spec.md 3), so its arms are not taken~~ --
  BUILT 2026-10-18 (5g), on the effects lane's Soul Flame control.
- THE EFFECT POOL (for the effects lane): the viewer LOOPS one-shot actions, so L2 M55 / M58 / M61 / M62 make a volley every pass,
  and some twenty 300-frame puddles (u 2) at once -- or Soulseer's six L2 M69 flames each pass -- fill the runtime's slot pool; its
  full path `0x418d4` (render/rom/effect/lifted-request.js L_4187c) is unlifted and the runtime stops. The page checks play one pass.
- e+0x73e8 (the action setter's draw) is the stand-in 0 throughout; the chooser's B / C pick and the throws' modes and vectors read it.

### 5g. The soul flame (2026-10-18) and the clips corrected

The Soul Flame control (motion-states.js CLASS_CONTROLS.em082_04 `soulFlame`, the effects lane's; P+0x1bb bit 1, lit by `0x1039320` at
the rage roars' ends) reaches the shells as input.soulFlame082 (index.html shellExtra). Soulseer only (`e+0xb5f5 == 4` before every
test of the getter `0x1035ee8`). The arms, by a census with P+0x1bb = 2 against one with 0 (<archive> fb/runflame.py, cenflame_0 /
cenflame_2; cengen11's FB_PPOKE), each site read:
- (7, 9) L2 M20 f43 / 48 / 56: 188 / 189 / 190 in place of the chooser's k 14..16 -- direct setups (`0x403394`, 0x14 B: +0x10 the tilt
  word from e+0xcb9c, as the chooser's maker), `0x104c4bc` / `0x104c5a0` / `0x104c684`; (7, 0xc / 0x2e) the same at 185..187
  (`0x104c8d8..`); (7, 0xd / 0x30) L2 M21 180 / 181 / 182 at tune 0x93..0x95 (74 / 136 / 142) for the chooser's five.
- status 2, phase 2: (2, 6 / 0x14 / 0x15 / 0x34) L2 M40 174..176, (2, 7 / 0x16 / 0x17 / 0x35) L2 M11 177..179 -- the second maker's, in
  place of 162..164 / 165..167; the throws' actions: k0 0 sets 183, k0 3 sets 184 (the second maker at tune 0x96 / 0x97 = 0: phase 2's
  first call, `0x103c918..0x103c94c`), the others nothing.
- Nothing lit: the throws (`0x104b15c` / `0x104b338` skip, the maker `0x104a65c` refuses), every 04_26 (`0x104a764`: L2 M69, L2 M38,
  (2, 0x36), the rest's counters), (7, 0) L2 M42, (7, 0x2a / 0x31) L2 M89, (7, 0x64..0x69). Unchanged lit: (7, 1), (7, 0xa / 0x73),
  (7, 0x7d), the trails (no getter in `0x104cdb4` or the makers `0x104a298` / `0x104a840`).
- THE CLIPS (<archive> fb/clipphase.py: the motion current at each create's phase, the phases run in order with the motion ended):
  the status-2 rows were on L2 M39 / M10 / M55 / M58 / M61 / M62 -- the actions' PHASE-0 clips -- and are phase 2's: L2 M40 / M11 /
  M56 / M59; (7, 1) phase 3 L2 M37; (7, 0x68) / (7, 0x69) phase 2 L2 M71 / M72 (now `also` of (7, 0x65) / (7, 0x64)). The ROM checks
  passed before (they call the phase directly); the viewer showed those shells on the wrong clip.

Checks: dev/shells-soulseer-check.mjs 65 / 65 (13 lit cases, 6 of them "none", 3 lit controls FAIL), page 45 / 45 (the control
reaching the shells, L2 M20 lit, u 200 / 201 / 210 run out, the looping plays on); dev/shells-mizutsune-check.mjs 38 / 38, page 33 /
33 (its LOOPS on); dev/checks/em082_00 142 / 0; both soaks 0 refused.

## Addendum 2026-10-20 (shells agent)

- base12's DEFERRED INIT is READ and BUILT: `0x403854` with +0x15e0 bit 1 (sh int 3 != -1) sets the state byte to 0 and returns 1; the
  move `0x40350c` on state 0 runs the real init `0x4038cc(shell, [shell+0x136c])` and the step in the same move (make12 / init12late).
  Soulseer's lit modes 174..187 now start (u 201: mode 180, (7, 0xd / 0x30) L2 M21 f74).
- 5b's "the viewer's block is the clip root's position, so root motion drives it" was not so: the page's unit (index.html
  unitGamePos) stood still through a pass; the travel is the `reference` node's. FIXED: X / Z from the reference node's world point,
  so the trail 0x104cdb4 (one bubble per 550) fires (u 100 / u 101 by modes 46 / 146).
