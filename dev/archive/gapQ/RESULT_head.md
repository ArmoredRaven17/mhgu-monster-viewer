# gapQ -- Brachydios (em063_00) / Raging Brachydios (em063_05): the slime pools, the explosions, the slime lines and Raging's eruption

Shells lane helper, 2026-10-25. Nothing in the repo, rom-map, specs or the board was edited; everything is in this folder.
Class uEm063_00 (band `0xf35038..0xf47ca0`, vtable `0x17d92c4`, variant byte e+0xb5f5 0 / 5).

## Verdict

**Every shell the class makes is read, and the draft builds and replays.** Brachydios and Raging make three shells:
**sp_01** (base01, the explosions and the line / scatter blasts), **sp_11** (base11, the slime line on L2 M42 and the scatter on L2 M41),
**sp_35** (a NEW base, base35: **the slime pool** -- a 300-frame (Raging 150) timer, then an sp_01 explosion at its spot). The pools
come from the fists: a calm fist leaves a pool, an enraged Brachydios fist (or a Raging fist whose slot is Red) explodes on the spot
instead. The eruption 0xf46234 makes sp_01 modes 23..38 AT A JOINT (the files say where: joints 3 / 40 / 50 / 143). The pool has
**no warning stage in the shell**: one ef runs from the init to the end, nothing else starts before the explosion (any flash is
inside the pool's own efl, not read). Three census traps hid all of it before (section (c), the traps).

## (a) Facts

### READ (the consuming instructions read)

1. **The ids** -- vt+0x158 `0xf35108` (immediates): variant 0 -> e+0xcac0 = **0x110** (uShellEm063_sp_01), e+0xcac4 = **0x111**
   (sp_11), e+0xcac8 = **0x112** (sp_35); variant 5 -> **0x113 / 0x114 / 0x115**; any other variant: none. Each registered by
   `0x48b71c`. Table `0x175c3e8` (shelltable.json): 0x110 / 0x113 uShellEm063_sp_01 cSetupParamEmBase01, 0x111 / 0x114 sp_11
   cSetupParamEmBase01, 0x112 / 0x115 sp_35 **cSetupParamEmBase35** (res 0x8a63..0x8a68).
2. **Bases by vtable**: sp_01 `0x17da2d8` (+0x13c 0x3fa498 = base01's init, +0x24 0x3faec4, +0x14c reader **0xf4815c**, +0x154
   0x3fb54c); sp_11 `0x17da448` (+0x13c 0x402fd8 = base11, reader **0xf48350**, +0x150 **0xf489dc**, +0x168 **0xf484d8**); sp_35
   `0x17da5bc` (+0x13c 0x418888, +0x24 0x418af0, +0x148 0x418cfc, +0x150 0x418de0 -- all base35's, vtable **`0x175169c`**, extent
   to +0x15c (+0x160 is the next table's); sp_35 overrides +0x4 / +0x14 (dtor / DTI), +0x14c reader **0xf48bb4**, +0x154 **0xf48ca0**).
3. **The arcs** (both): `shell01` (ShellInfoList 39 modes; em063_00 files for 0..9, em063_05 for 0..9, 14, 17, 18, 21..38),
   `shell11` (2), `shell35` (5; em063_00 files 0 / 1, em063_05 0 / 1 / 4). **EffectLists**: em063_00's index 0 = em063_00u; **em063_05's
   index 1 = em063_05u** (index 0 null) -- every Raging ef is listId 1. No ShellCmnParam in any folder.
4. **sp_01's reader 0xf4815c** (whole, ..0xf48254): ef 0 -> +0x15c8; HitParam int 0 -> +0x15d8; sh int 0 -> the joint +0x15e4; +0x15ec
   bit 2 = int 2 != -1, bit 3 = int 3, **bit 0 = int 4** (at the joint); int 1 -> +0x15e8 (camera id; flag 0x40 never set); &vec 0
   -> +0x1608. No timer (the ctor's 0): each lives while its hit slot is on. Modes 0..22: ints all -1 but int 1 of mode 1 (7) -> the
   setup point + the vec turned by the words. **Modes 23..38: int 4 = 0, int 0 = the joint (3 head / 40 left arm / 50 right arm / 143
   tail), vec 0 the offset through the joint's matrix** (base01's joint arm).
5. **The fist 0xf458ec(e, slot, kind, &point, &normal, attr, b2c)** (whole, ..0xf46230; signature from its 23 callers' stores):
   kind < 0 computed -- variant 5: slot state [ctl+0x54+8k] == 2 (Red) ? 4 : 1; else the arm level s16 [ctl+0x24+12k] > 0 ?
   (0x81670 ? 4 : 1) : 0; then variant 5 with the slot Red forces 4 (0xf459b4). **1 -> sp_35** [e+0xcac8] (0x41876c(0x30)) mode 0
   (variant 5 enraged: 4) at the point, words from the ground normal and the yaw P+0x54 (forward 0x1917700 = (0,0,1) turned, 0x232530,
   0x7c3a38: groundAngles), +0x2c = b2c, +0x2e = ctl+0x22+12k; nothing when attr & 0x1040. **4 -> sp_01** [e+0xcac0] (0x3fa2bc(0x40))
   mode **3** (variant 5 enraged **14**; on motion 0x216 / 0x217 = L2 M22 / M23 **9**) at the point, words P+0x50.., +0x3c P+0xb0a
   (Raging status 7: ctl+0x2e / +0x22 by action, tables 0xf45db0 / 0xf45fa0 -- not visual). **3 -> sp_01 2**: no caller passes 3
   (all 23 store -1 or 1). 0 nothing.
6. **The fist probe 0xf454e0** (whole): joint **50 for slot 1, 40 otherwise** (0xc164c), y + 1000.0, the stage ray 0x18154c down to
   -100000; accept (hit - P+0x5b4) in [-300, 300); the point (joint x, hit y, joint z), the normal, the attribute. Callers: normal.y <
   0.75 -> (0, 1, 0) (0x19176f0, the initialised image). The second probe 0xf456a0 (a forward segment, 0x49c44) has no maker caller here.
7. **The both-fists 0xf3b7e8(e, slot, kind)** (whole): slot > 3 nothing; probe; kind < 0 computed then **4 -> 3**; variant 5: this
   slot Red -> 3, **both arms Red -> 4**; 1 -> sp_35 0 / 4 at the point **+5.0 on y**, +0x2c 0; 3 -> sp_01 **5** (variant 5 enraged
   **0x12**); 4 -> sp_01 **4** (0x11); +0x3c 0xffff.
8. **The big slam's pool 0xf3e984(e, &point, &normal)** + the drop probe **0xf3e7a8** (= sp_11's 0xf487f0, the same instructions: ray
   from y + 1000, accept (P+0x5b4 - hit) in [-500, 500), y = hit + 4 on a plain floor): sp_35 **mode 1** (no variant / rage test),
   groundAngles words, +0x2e P+0xb0a. Point: P+0x40 + (0, 0, d x 0xbe518) turned by the yaw, **d = 550.0** (L2 M42, literals
   0xf3e780 / 0xf3e784) or **400.0** (L2 M41, 0xf3eec0 / 0xf3eec4).
9. **base35** (0x4186bc setup ctor: +0x2c 0, +0x2e 0xffff; 0x41876c the 0x30 allocator; ctor 0x4187a8; init **0x418888**; move
   **0x418af0** -> state 1 **0x418bb8**; end **0x418cfc**): init -- 0x43a850 / 0x4a100c+0x50 bit 0 gates, +0x1588 = setup +0x2e, byte
   +0x15f8 = +0x2c, reader, +0x40 = setup +0x10 + vec 0 turned by the Y word (setup +0x24, **the 0x30 shape's words are at +0x20**),
   anchor, state 1, **timer +0x15f0 = float 0**, ef 0 at +0x40 -> +0x15f4, hit registration (slot 0). State 1: t = timer - dt, kept >= 0;
   t > 0 keeps (with int 0 == 0 the hit radius +0x13bc lerps float 1 -> float 2 over float 3: not visual); t <= 0 -> the end (ef stop,
   graceful flag 0) then **vt+0x154** then, byte +0x15f8 == 0, 0xac030(owner, &+0x40, 2, 0) (the AI's noise event). State 0xfe: 1800
   frames or the handle gone -> deleted. vt+0x154 is called nowhere else in the base.
10. **sp_35's reader 0xf48bb4**: ef 0 -> +0x15c8, hit 0 -> +0x15cc, int 0 -> +0x15e0, int 1 -> +0x15e4, floats 0..3 -> +0x15d0 (life)
    / +0x15d4 / +0x15d8 / +0x15dc, &vec 0 -> +0x15e8. **+0x154 0xf48ca0**: int 1 >= 0 -> sp_01 [owner+0xcac0] **mode int 1** at +0x40 with
    the shell's own words, +0x3c 0xffff -- **the pool's explosion**: em063_00 pool 0 -> **6** (u 1), big pool 1 -> **7** (u 11);
    em063_05 0 -> 6 (u 1), 1 -> 7 (u 11), 4 -> **21** (u 111).
11. **sp_11** -- reader 0xf48350: count = int 0, times = floats 0..n-1, +0x1664 = float 12, +0x1668 = int 1 (the +0x150's camera shakes,
    not visual). **+0x168 0xf484d8(shell, k)**: vec k + 1; by the shell's mode (0x4a0ee4): **1** -- turned by the Y word, child mode 1;
    **0** -- Y word += 0x2000 | (k & 3) << 14, r = rng % 3 (0x3f76d8), x = vx + vz (-0.4 + 0.4 r) (literals 0xf487dc / 0xf487e0), turned
    by the new word, child mode 0; then the drop probe and sp_01 at the point with (X, the Y used, Z), +0x3c +0x1588. Mode 0: 12 children at
    0..78 (vecs (0, 0, 400) x5, 700 x4, 1000 x4); mode 1: 8 at 0..42 along (0, 0, 400) .. (0, 0, 2500) with +-100 / +-200 lateral.
12. **The sites** (every 0x48b884 in the band: 8, plus the shells' two -- all read; census `cen063.py` on `trgen063.py`, statuses
    0..13 x phases 0..8, each frame literal alone, rage 0 / 1; variant 0 at arm levels 2 / 0, variant 5 Yellow / Red; the gates then read):
    * L2 M28 slot 0 / L2 M29 slot 1 **f72**, kind 1, gated level >= 1 (0xf3da28): (7, 3 / 0x2f / 0x31 / 0x33 / 0x3f / 0x95 / 0xad) and
      (7, 2 / 0x2e / 0x30 / 0x32 / 0x3e / 0x94 / 0xac) -- 0xf3dad8, 0xf4088c.
    * L2 M11 slot 0 / L2 M13 slot 1 **f26**, kind -1: (7, 0x1a / 0x29 / 0x84 / 0x88 / 0x8c / 0x90 / 0xb3), (7, 0x1c / 0x27 / 0x86 / 0x8a /
      0x8e / 0x92 / 0xb4) -- 0xf3f890, 0xf419a4. L2 M54 slot 1 **f72** kind -1: (7, 7 / 0x4d) -- 0xf3e19c.
    * the turn punches 0xf3fc94 (phase 0 0x7a258 on table **0x16a01a4 = L2 M5 x3** (slot 0) / **0x16a01e4 = L2 M8 x3** (slot 1)),
      phase 1 **f6**, kind 1, gated level >= 1 (0xf401bc): slot 0 (7, 0x3c, 0x54, 0x58 .. 0x80 every 4, 0xa4, 0xa9), slot 1 (7, 0x3d,
      0x56 .. 0x82, 0xa2, 0xaa).
    * the jump slam (L2 M2 -> landing -> L2 M3): 0xf3f02c (7, 0x13 / 0x16 / 0x18) and 0xf41114 (7, 0xb2) phase 3 -- **the pair test**:
      both arms' kinds 4 -> at **34** (0xb2: **30**) both 0xf3b7e8(k, 4); else per arm, slot 1 first: kind 1 at **8** -> (k, 1), kind 3 / 4 at
      34 / 30 -> (k, 3). Each spent.
    * L2 M42: (7, 8 / 0x14 / 0xa6) 0xf3e4a0 and (7, 0xb0) 0xf40ef8 -- **sp_11 mode 1 at f125** at the owner; (7, 0x15 / 0xa5 / 0xb1) -- **the
      big pool at f90** (550). L2 M41: (7, 9) 0xf3edc8 -- **sp_11 mode 0 at f190**; (7, 0x98) -- the big pool at **f124** (400).
    * the status-3 walks (0xf3c9f0: n 0 / 1 / 3 -> 0xf3a234(e, 0 / 1 / 2), 2 -> 0xf3b514, 4 -> 0xf3bcb4, 5 -> 0xf3c694) BRANCH ON THE MOTION
      ID (0xb0944): L0 M52 f54 s0 / f88 s1; L0 M54 f30 s0 / f40 s1; L0 M57 f16 the L0 pair (both 4 -> (k, 4), else (k, -1)); L0 M58 f60 s1 /
      f80 s0; L0 M59 f12 s1; L0 M60 f45 s0 / f54 s1; L0 M61 f60 s1 / f80 s0; L0 M62 f9 s1 / f29 s0 / f58 s1; L0 M63 f45 s0 / f54 s1 (all kind
      -1; b2c 1 on M52 / M58 / M59 / M61 / M62). (3, 4)'s own motions: .bss table 0x212d800 +0x1c / +0x2c / +0x3c = **L0 M61 / M62 / M64**
      (the initialised image, `ia063b.py`).
    * **the frame handler vt+0x208 0xf3552c** (whole; census of L0..L4 M0..109): only **L2 M22 (0x216): f114 slot 0, f152 slot 1, f180
      slot 0**, kind -1 (an enraged / Red fist there is sp_01 **9**, u 40).
    * vt+0x204 / vt+0x210 / vt+0x2b8 make nothing (the census; their rows in the map).
13. **The eruption 0xf46234(e, slot)** (whole), from 0xf36100 (vt+0x1dc 0xf36038, the fuse burn): the warning handle stopped; **with the
    unit live, a slot NOT Red returns -- no shell**; Red -> countdown -1.0; trigger 0; mode by the jump table 0xf462cc: **slot 0 (left
    arm) part 3** vs .dtp A byte [6] (rank > 4) / [5] -> 0x21 / 0x22 else 0x19 / 0x1a; **slot 1 (right arm) part 2**, the same bytes ->
    0x23 / 0x24 else 0x1b / 0x1c; **slot 2 (head) part 0**, bytes [2] / [1] -> 0x1f / 0x20 else 0x17 / 0x18; **slot 3 (tail) part 6 != 0
    (severed)** -> 0x25 / 0x26 else 0x1d / 0x1e; slot > 3 0x17; +1 enraged. **The setup point +0x10 = the zero vector** (0x1831a78 ->
    0x19176b0); words P+0x50..; the file puts it at the joint. em063_05_dtbparts.dtp A = {0, 2, 2, 1}, {2, 2, 2, 2}, {3, 2, 2, 2}: the head and
    both arms broken at level >= 2 at any rank.
14. **Hit lives (HDS)**: shell01 23 records (delay, duration) -- e.g. mode 3 rec 3 (10, 8), modes 23..38 rec 21 / 22 (10, 10), mode 0 rec 0
    (32, 10); shell35 4 x (0, 999) (the pool's life is its timer).
15. **The records** (`effects_triage.pel`): em063_00u **0** em063_00_000, **1** em063_00_001, **10** em063_00_003, **11** em063_00_004,
    **30** em063_00_007, **31** em063_00_008, **40 / 41 / 50 / 51** em063_00_011 (50 / 51 at 0.7); em063_05u **1** em063_00_001 (0.8), **10**
    em063_05_002 (1.5), **11** em063_00_004, **30** em063_00_007, **31** em063_00_008 (0.8), **40** em063_00_011 (0.8), **41 / 50**
    em063_00_011, **100 / 110** em063_05_000 (1.1 / 1.3), **111** em063_00_001 (1.1), **130 / 131** em063_00_011 (1.2 / 1.35), **210**
    em063_00_001 (1.2); **em063_05u has NO UNIQUE 21** (Raging's sp_01 8 names it -- that mode has no maker).

### NEGATIVES (with their controls)

* **No maker for sp_01 modes 2, 8, 10..13, 15, 16, 19, 20, 22** (files exist): the band's 8 submit sites and the shells' two read, the
  modes they can write listed above; control -- the same scan of `bl 0x48b884` / allocators finds all 8 (and the census reaches all).
* **f458ec kind 3**: no caller passes it (23 call sites read, each stores `mvn #0` or `mov #1`).
* **The frame handler** makes shells only on L2 M22 (census of 545 motion ids; control: L2 M22's three rows found).
* **base35 has no other vt+0x154 call and no ef switch**: its band 0x4186bc..0x418de4 read whole (5 virtual calls: +0x14c, +0x148 x2,
  +0x154, +0x150).

### INFERRED / NOT READ

* The init gates 0x43a850 / 0x4a100c+0x50 pass in the viewer (as base25's draft takes them). 0xac030's meaning (the AI's noise: the
  rom-map's "shout") -- I.
* The ray / ground: the viewer's flat floor stands in for 0x18154c (the existing stageQuery); attribute 0 on it (the 0x1040 / 1 / 4 / 0x40
  arms never taken).
* **The pool's warning look**: no ef starts before the explosion; whether em063_00_000 / em063_05_000 flash near their end is the efl's
  own timeline -- NOT READ (no efx run: the recorder slot rule).
* Which status-3 action plays which L0 clip (the 0x7a30c walk tables, r8 per n) -- NOT READ; the rows are keyed by the motion id the
  handlers branch on (READ under emulation), with the handler's n as the action.
* The AI's pick among the L2 M42 / M41 / M3 forms -- NOT READ (pick 'ai': the viewer names one a play, as CLIP_ACTIONS does).
* The arm levels' movement (0xf4653c spends, the refills) is not modelled here: the draft reads input.arm063.

## The inputs the shells need (the viewer side, for the coordinator)

* `input.rage` (0x81670; Raging's Red Slime is his rage as the viewer shows it), `input.ownerPos`, `input.owner` (words), `input.ground`
  / `rock.floorY`, `input.size`, `input.rank`, `input.hitLife` -- as every class.
* `input.arm063 = [left, right]` -- Brachydios's arm slime levels (monster.js armSlimeLevels; 0 = Depleted; default 2).
* `input.slime063 = [left arm, right arm, head, tail]` -- Raging's slot states, 2 Red / 0 Yellow: Red Slime on -> 2 except the slots
  slime063 marks `spent` (default: rage ? all 2 : all 0).
* `input.erupt063 = { slots: [k, ..] }` -- **on the one step the fuse burns out**. CLASS_TIMERS em063_05's slime063 already has the moment
  (`s.fuse <= 0` -> `held = false; spent = true`): it would set `c.erupt063 = [..k]` there, and index.html pass it as input.erupt063 on that
  step. (The slot stays Red through its fuse in the viewer's model, so the eruption fires; Red Slime switched off mid-fuse -> no shell, as
  0xf46294 returns.)
* `input.breaks063 = { 0: head, 2: right arm, 3: left arm }` (break levels, 0x9d36c) and `input.tailSevered`.
