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

## (b) The JS for docs/render/shells.js

Paste the block below anywhere after `m057`, `READERS01`, `READERS11` and `CREATE11` exist (the end of the file works: that is where the
replay's copy has it), and put these three hooks into `stepShells` (exactly what `apply063.py` does to the copy):

```js
  // 1. the action dispatch, beside the other classes' (before `} else if (a && a.code === 'em061'){`):
  } else if (a && a.code === 'em063'){
    spawn063(state, D, a, ctx, input, out, fresh);           // Brachydios's / Raging's fists, pools and lines
  // 2. after `if (D.perFrame007) perFrame007(...)` (line 4):
  if (D.perFrame063) perFrame063(state, D, ctx, input, out, fresh);   // Brachydios's / Raging's frame handler 0xf3552c (L2 M22's fists), line 4
  if (D.erupt063 && input.erupt063) eruptStep063(state, D, ctx, input, out);   // Raging's eruption 0xf46234 (the fuse's burn-out), line 4
  // 3. in the shells' move loop, beside base25's:
    else if (S.base === 'base35') step35(S, ctx, input, D, out);   // Brachydios's slime pools
```

`erupt063(state, D, ctx, input, out, slot)` is exported (the function the task names); `eruptStep063` is its per-step wrapper reading
`input.erupt063 = { slots: [..] }`. The replay drives the eruption through the input.

### The records to export `when: 'shell'` (neither docs/effects/em063_00.json nor em063_05.json holds any of them)

* **em063_00u**: 0 (em063_00_000, the pool), 10 (em063_00_003, the big pool), 1 (em063_00_001, the pool's explosion), 11 (em063_00_004, the
  big pool's explosion -- its efl has the type-25 cParticleNodeInfinite row the triage flags), 30 (em063_00_007, the line), 31
  (em063_00_008, the scatter), 50 (em063_00_011, the enraged fist), 40 (em063_00_011, both fists / the L2 M22 fist), 41 (em063_00_011, one
  fist). (51 only names the unmade mode 8.)
* **em063_05u**: 100 / 110 (em063_05_000, the pool calm / enraged), 10 (em063_05_002, the big pool), 1 / 111 (em063_00_001, the pools'
  explosions), 11 (em063_00_004), 30, 31, 50 (the Red fist, modes 3 / 14), 40, 41, 130 / 131 (em063_00_011, both / one fist enraged), 210
  (em063_00_001, the eruption). (21: no record; only the unmade mode 8 names it.)

```js
// ---- BRACHYDIOS (em063_00) / RAGING BRACHYDIOS (em063_05): uEm063_00, one class (band 0xf35038..0xf47ca0; e+0xb5f5 0 / 5) ---------
// READ 2026-10-25 (shells lane helper; <archive> gapQ/RESULT.md). THE IDS (vt+0x158 0xf35108, immediates): variant 0 -> e+0xcac0 0x110
// uShellEm063_sp_01, e+0xcac4 0x111 sp_11, e+0xcac8 0x112 sp_35; variant 5 -> 0x113 / 0x114 / 0x115 (any other variant: none). Bases by
// vtable: sp_01 0x17da2d8 (base01's init 0x3fa498; reader +0x14c 0xf4815c), sp_11 0x17da448 (base11's 0x402fd8; reader 0xf48350,
// +0x150 0xf489dc, +0x168 0xf484d8), sp_35 0x17da5bc (base35's vtable 0x175169c, +0x13c 0x418888; reader 0xf48bb4, +0x154 0xf48ca0) --
// the table's setup DTIs agree (cSetupParamEmBase01 / 01 / 35). The arcs carry exactly these three folders each.
//   THE MAKERS (every 0x48b884 in the band: 8 sites, all read): the fist 0xf458ec(e, slot, kind, &point, &normal, attr, b2c) -- kind 1 a
// POOL (sp_35 0 / Raging enraged 4), kind 4 an EXPLOSION (sp_01 3; 9 on L2 M22 / M23; Raging enraged 14), kind 3 sp_01 2 (no caller
// passes it: the 23 call sites store -1 or 1), kind < 0 computed (Raging: the slot Red ? 4 : 1; else the slot's arm level > 0 ? (enraged
// ? 4 : 1) : 0), and a Raging slot that is Red is 4 whatever was passed; the both-fists 0xf3b7e8(e, slot, kind) -- the same probe, kind 1
// a pool (+5 up), 3 sp_01 5 / 18, 4 sp_01 4 / 17 (computed: 4 -> 3; Raging: this slot Red -> 3, both arms Red -> 4); the big slam's pool
// 0xf3e984 (sp_35 1 at the ground 400 / 550 x size ahead); the slime lines (sp_11 0 / 1 at the owner); the eruption 0xf46234 (below).
//   NO MAKER: sp_01 modes 2 (kind 3), 8, 10..13, 15, 16, 19, 20, 22 (files in the arc, no create names them: negative with the census
// of the 8 sites as its control); Raging's sp_01 8 names u 21, which em063_05u lacks.
const DTPA063 = [0, 2, 2, 1, 2, 2, 2, 2, 3, 2, 2, 2];   // _dtbparts.dtp array A (both arcs, dtp.py EXACT): bytes 1 / 2 the head, 5 / 6 the arms

// sp_01's reader 0xf4815c (READ whole, ..0xf48254): ef 0 -> +0x15c8; HitParam int 0 -> +0x15d8 (slot 0); sh int 0 -> the joint +0x15e4;
// +0x15ec (bfc / orrne over the ctor's 0): bit 2 = int 2 != -1 (the ground snap), bit 3 = int 3 (the ground angles), bit 0 = int 4 (at
// the joint); int 1 -> +0x15e8 (a camera id, read only under flag 0x40, which this reader never sets); &vec 0 -> +0x1608. The timer
// +0x15f0 stays the ctor's 0: each lives while its hit slot is on (move011's T <= 0 arm; input.hitLife; the HDS pairs below).
function params063s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : 0;
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const why = !sh ? 'uShellEm063_sp_01: a mode with no files in this arc' : null;
  return { flags: (I(4) !== -1 ? 1 : 0) | (I(2) !== -1 ? 4 : 0) | (I(3) !== -1 ? 8 : 0), joint: I(0), i15e8: I(1), timer: f(0.0),
           f1600: f(0.0), f15fc: f(1.0), vec: V(0), up: f(500.0), down: f(500.0), maxH: f(900.0), why,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xf4815c] = sh => params063s01(sh);

// sp_11's reader 0xf48350 (READ whole, ..0xf484cc): count +0x1658 = int 0 (>= 1), the times +0x1654[k] = float k; +0x1664 = float 12
// and +0x1668 = int 1 (+0x150 0xf489dc: after base11's 0x40308c, 0x43ac04(+0x1668) -- a camera shake -- once per entry whose time +
// +0x1664 the clock +0x1618 has reached: not visual). No base01 field is written (flags 0, timer 0, vec 0) and no EffectParam (its .shl
// efs are empty): the init starts nothing.
function params063s11(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const n = I(0) >= 1 ? I(0) : 0, table = [];
  for (let k = 0; k < n; k++) table.push(F(k));
  return { flags: 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           table, cam: { after: F(12), id: I(1) }, efAt: { 0x15c8: null, 0x15cc: null, 0x15d0: null } };
}
READERS11[0xf48350] = (def, mode) => params063s11(def, mode);

// the drop probe 0xf487f0 (sp_11's) = 0xf3e7a8 (the class's; the same instructions): the stage ray from the point's y + 1000 down
// (0x18154c, to -100000); a hit whose height the owner's ground (block +0x5b4) is within [-500, 500) of puts y = hit + 4 (attribute
// bits 1 / 4 / 0x40 pick another height: a plain floor takes the hit); no hit, or out of the band: nothing is made.
function drop063(p, own, stage){
  const q = stageQuery([p[0], f(-100000.0), p[2]], [p[0], f(p[1] + f(1000.0)), p[2]], stage, 0x10);
  if (!q || own.ground == null) return null;
  const d = f(own.ground - q.point[1]);
  if (!(d >= f(-500.0)) || !(d < f(500.0))) return null;
  return { point: [p[0], f(q.point[1] + f(4.0)), p[2]], normal: q.normal.slice() };
}

// sp_11's +0x168 0xf484d8(shell, k) (READ whole): the owner active (always in the viewer); vec k + 1 (0x4a2584(shell, k + 1)); by the
// shell's mode (0x4a0ee4): MODE 1 -- vec turned by its Y word +0xfec (x cos + z sin, y, z cos - x sin) plus its +0x40, the child mode 1;
// MODE 0 -- the Y word += 0x2000 | (k & 3) << 14, a draw r = rng % 3 (0x3f76d8), x = vx + vz x (-0.4 + 0.4 r), turned by the NEW word,
// the child mode 0; any other mode (none here) mode 0x27 at the zero vector. Then the drop probe from that point (the owner's ground):
// shell01 [owner+0xcac0] of that mode at the probe's point, its words (+0xfe8, the Y word as used, +0xff0), +0x3c = its +0x1588.
function create063s11(S, idx, ctx, D){
  const sh = S.mode.sh, vi = idx + 1, v = vi < sh.vecs.length ? sh.vecs[vi].map(f) : [0, 0, 0];
  const m = S.modeIndex, P = S.position;
  if (m !== 0 && m !== 1){ ctx.out.refused.push({ shell: S.shell, mode: m, why: 'sp_11 +0x168: mode ' + m + ' makes shell01 0x27 (no files)' }); return; }
  let Y = S.angles[1] >>> 0, x, z;
  if (m === 1){
    const r = f(u16(Y) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    x = mla(f(v[0] * cs), v[2], sn); z = mls(f(v[2] * cs), v[0], sn);
  } else {
    Y = (Y + (0x2000 | ((idx & 3) << 14))) >>> 0;
    const lat = mla(f(-0.4), f(rng16(ctx.shellState) % 3), f(0.4)), a = mla(v[0], v[2], lat);
    const r = f(u16(Y) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    x = mla(f(cs * a), v[2], sn); z = f(f(v[2] * cs) - f(sn * a));
  }
  const p = [f(x + P[0]), f(v[1] + P[1]), f(z + P[2])];
  const g = drop063(p, ctx.own001, ctx.stage);
  if (!g){ S.events.push({ ev: 'refused', kind: 'drop', idx, why: 'sp_11 +0x168: no floor within 500 of the owner\'s ground under the point' }); return; }
  ctx.create(S, 'shell01', { mode: m, position: g.point, angles: [S.angles[0] >>> 0, Y, S.angles[2] >>> 0] });
}
CREATE11.uShellEm063_sp_11 = (S, idx, ctx, D) => create063s11(S, idx, ctx, D);

// ---- BASE35 (uShellEmBase35, vtable 0x175169c to +0x15c): the slime pools -------------------------------------------------------------
// READ 2026-10-25 whole (0x4186f0..0x418de4): the 0x30 request 0x41876c (+0x10 the point, +0x20.. the WORDS, +0x2c a byte, +0x2e a
// halfword; its ctor 0x4186d8.. leaves +0x2c 0 / +0x2e 0xffff); ctor 0x4187a8 (0x43a78c; ef +0x15c8 0, hit +0x15cc -1, floats +0x15d0..
// +0x15dc 0, ints +0x15e0 / +0x15e4 -1, +0x15e8 the zero vector, +0x15f0 / +0x15f4 / +0x15ec 0, byte +0x15f8 0, +0x15a8 0x23). sp_35's
// reader 0xf48bb4: ef 0 -> +0x15c8, HitParam int 0 -> +0x15cc, sh ints 0 / 1 -> +0x15e0 / +0x15e4, floats 0..3 -> +0x15d0 (THE LIFE) /
// +0x15d4 / +0x15d8 / +0x15dc, &vec 0 -> +0x15e8.
function params063s35(mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { hit: mode.hit.length ? mode.hit[0] : -1, i15e0: I(0), child: I(1), life: F(0), r0: F(1), r1: F(2), grow: F(3),
           vec: (sh.vecs[0] || ZERO3).map(f) };
}
// the init 0x418888(shell, setup): the gates 0x43a850 / 0x4a100c's byte +0x50 bit 0 (always passed in the viewer); +0x1588 = setup
// +0x2e, byte +0x15f8 = setup +0x2c; the reader; +0x40 = setup +0x10.. plus vec 0 turned by the Y word (+0xfec = setup +0x24: x cos + z
// sin, y, z cos - x sin), the anchor +0x1000 = it; state 1; the timer +0x15f0 = the life +0x15d0; ef +0x15c8 at +0x40 (0x4a10c8 /
// 0x4a11e4, the shell's own unit, joint -1) -> +0x15f4; the hit registration (0x4a1ad8; vt+0x140 slot 0, hit +0x15cc, radius +0x15d4).
function make35(state, D, name, setup, own, ctx, creator){
  const def = D.shells[name], mode = def.modes[setup.mode];
  if (!mode) return { why: name + ' mode ' + setup.mode + ': no files in this arc' };
  const k = params063s35(mode), A = setup.angles.map(w => w >>> 0), v = k.vec, P = setup.position;
  const r = f(u16(A[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const pos = [f(P[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])];
  const lists = def.lists || D.lists;
  const S = { id: state.nextId++, monId: state.monId, shell: name, cls: def.cls, globalId: def.id, base: 'base35', mode, modeIndex: setup.mode,
              action: setup.action || null, spawnFrame: setup.frame == null ? null : setup.frame, motion: ctx.motion, state: 1, k,
              folder: def.folder, creator: creator ? creator.id : null, position: pos, prevPosition: pos.slice(), anchor: pos.slice(),
              angles: A, timer: k.life, clock: f(0.0), moves: 0, b2c: setup.b2c | 0, h1588: setup.h2e == null ? 0xffff : setup.h2e,
              hitRadius: k.r0, events: [], place: null, start: null, stop: null, effect: null, slots: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.start = rockRequest(D, mode, 0, pos, 'init', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'init' } : null;
  if (S.start) S.effects[0].started = true;
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  return { S };
}
// the end 0x418cfc(shell, flag): (state & 0xfe) != 0xfe: ef +0x15f4 stopped (0x43b058, the flag: 0 graceful), 0x4a1de4 (the hit side),
// vt+0x150 (bx lr), state 0xfe, +0x15ec = 0; flag 1 deletes the shell
function end35(S, flag, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key, flag } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag });
  S.state = 0xfe; S.clock = f(0.0);
  if (out) out.ended.push(S);
  if (flag === 1) S.state = 0xff;
}
// sp_35's +0x154 0xf48ca0 (READ): +0x15fc = +0x15e4 (sh int 1); >= 0 -> shell01 [owner+0xcac0] of that mode at +0x40, ITS words
// +0xfe8.., +0x20 the zero vector, +0x3c 0xffff (the owner 0x4a0f00) -- THE POOL'S EXPLOSION: em063_00 0 -> 6 (u 1), 1 -> 7 (u 11);
// em063_05 0 -> 6 (u 1), 1 -> 7 (u 11), 4 -> 21 (u 111)
function child35(S, ctx){
  if (S.k.child < 0) return;
  if (!ctx || !ctx.create) throw new Error('shells.js: sp_35 +0x154 (0xf48ca0) without the create context');
  ctx.create(S, 'shell01', { mode: S.k.child, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) });
}
// the move 0x418af0: 0x4a1698 (deletes when the owner's unit leaves states 1 / 2: never here), the handle's hygiene, then by state.
// STATE 1 (0x418bb8): no owner -> the end (never here). The timer +0x15f0 > 0: t = it - the step (unit +0x1c), kept clamped at 0; while
// t > 0, with sh int 0 == 0 (mode 1's) the hit radius +0x13bc = r0 + (r1 - r0) x min((life - t) / +0x15dc, 1) (not visual), and the
// owner active keeps it. t <= 0 (or the timer already 0): vt+0x148(0) (the end above), vt+0x154 (the explosion), and with byte +0x15f8 == 0
// 0xac030(owner, &+0x40, 2, 0) (the AI's noise event: S.events 'noise', not visual). STATE 0xFE: +0x15ec += the step; deleted (vt+0x40,
// state 0xff) past [0x162493c] x 60 (1800) or once the effect's handle is gone.
//   So THE TIMER IS THE LIFE: em063_00 300 frames (modes 0 / 1), em063_05 150 (modes 0 / 1 / 4). NO WARNING STAGE IN THE SHELL: one ef
// (the pool) runs from the init to the end, nothing else starts until the explosion -- any flash before it is the pool's own efl
// (em063_00_000 / em063_00_003 / em063_05_000 / em063_05_002), its timeline NOT READ.
function step35(S, ctx, input, D, out){
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, 0, S.effect)) S.effect.gone = true;
  if (S.state === 1){
    const T = S.timer;
    if (T > 0){
      const t = f(T - ctx.dt), c = (f(0.0) >= t) ? f(0.0) : t;
      S.timer = c;
      if (t > 0){
        if (S.k.i15e0 === 0){
          const a = f(Math.min(f(f(S.k.life - c) / S.k.grow), 1.0));
          S.hitRadius = mla(f(S.k.r0 * f(1.0 - a)), S.k.r1, a);
        }
        return;
      }
    } else S.timer = f(0.0);
    end35(S, 0, out);
    child35(S, ctx);
    if (S.b2c === 0) S.events.push({ ev: 'noise', at: S.position.slice(), kind: 2 });
    return;
  }
  if (S.state === 0xfe){
    S.clock = f(ctx.dt + S.clock);
    if (S.clock > ENDING_FRAMES || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}

// ---- THE MAKERS ------------------------------------------------------------------------------------------------------------------------
// the viewer's state as these read it: the variant (e+0xb5f5), the rage test 0x81670 (input.rage -- Raging's Red Slime is his rage, as the
// viewer shows it), Brachydios's arm levels [ctl+0x24 + 12k] (input.arm063 = [left, right]: monster.js armSlimeLevels; 0 = Depleted; the
// default 2), Raging's slot states [ctl+0x54 + 8k] (input.slime063 = [left arm, right arm, head, tail]: 2 Red, 0 Yellow -- the viewer's
// Red Slime with the erupted slots Yellow (motion-states.js slime063's `spent`); the default: Red with Red Slime on, else Yellow), the
// quest rank 0x3a8430 (own.rank), the part break levels 0x9d36c (input.breaks063 = { 0: head, 2: right arm, 3: left arm }) and the sever
// (input.tailSevered: 0x9d36c(e, 6) != 0)
function state063(D, input){
  const v5 = D.variant063 === 5, rage = !!input.rage, fin = Number.isFinite;
  const lv = Array.isArray(input.arm063) ? input.arm063 : [2, 2];
  const sl = Array.isArray(input.slime063) && input.slime063.length === 4 ? input.slime063 : [0, 1, 2, 3].map(() => (v5 && rage ? 2 : 0));
  const br = input.breaks063 || {};
  return { v5, rage, levels: [0, 1].map(k => fin(lv[k]) ? lv[k] | 0 : 2), slots: sl.map(x => x | 0),
           breaks: { 0: fin(br[0]) ? br[0] | 0 : 0, 2: fin(br[2]) ? br[2] | 0 : 0, 3: fin(br[3]) ? br[3] | 0 : 0 }, severed: !!input.tailSevered };
}
// the computed kind (0xf458ec / 0xf3b7e8 / the pair tests, kind < 0): Raging -- the slot Red ? 4 : 1; else the arm's level > 0 ? (enraged
// ? 4 : 1) : 0 (the level of slots 0 / 1 only: the fists)
const kind063 = (I, slot) => I.v5 ? (I.slots[slot] === 2 ? 4 : 1) : (I.levels[slot] > 0 ? (I.rage ? 4 : 1) : 0);

// the fist probe 0xf454e0(e, slot, &point, &normal, &attr) (READ whole): joint 0x32 = 50 for slot 1, 0x28 = 40 for any other (0xc164c,
// this action's joints: the previous pose's), y + 1000; the stage ray 0x18154c down to -100000; the hit (else -99996) less the owner's
// ground (block +0x5b4) must be >= -300 and < 300 (a hit) / 500 (none): the point (joint x, hit y, joint z), the hit's normal and its
// attribute halfword (0 on the viewer's floor). The callers then put the normal to (0, 1, 0) (0x19176f0) when its y < 0.75.
function probe063(J, slot, own, stage){
  const M = jointMatrix(J, slot === 1 ? 50 : 40);
  if (!M) return null;
  const x = f(M[12]), z = f(M[14]), y = f(f(M[13]) + f(1000.0));
  const q = stageQuery([x, f(-100000.0), z], [x, y, z], stage, 0x10);
  if (own.ground == null) return null;
  const hy = q ? q.point[1] : f(f(-100000.0) + f(4.0)), lim = q ? f(300.0) : f(500.0);
  const d = f(hy - own.ground);
  if (!(d >= f(-300.0)) || !q || !(d < lim)) return null;
  const n = q.normal[1] < f(0.75) ? [0, 1, 0] : q.normal.slice();
  return { point: [x, hy, z], normal: n, attr: 0 };
}
const words063 = own => [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0];   // block +0x50 / +0x54 / +0x58

// a pool (sp_35 [e+0xcac8]) at a point: words from the ground normal and the owner's yaw (0xf45a40..0xf45b20 / 0xf3ba24..: forward (0, 0,
// 1) 0x1917700 turned by the yaw word P+0x54, the frame 0x232530, its Euler 0x7c3a38 -- groundAngles), +0x2c = b2c, +0x2e = the arm row's
// halfword ctl+0x22 + 12 slot (a hit id; not visual)
function pool063(state, D, ctx, own, point, normal, mode, b2c, a, F, out){
  const r = make35(state, D, 'shell35', { mode, position: point, angles: groundAngles([0, own.ownerY, 0], normal), b2c, h2e: null,
                                          action: a ? a.action : null, frame: F }, own, ctx, null);
  if (r.why){ out.refused.push({ action: a ? a.action : null, shell: 'shell35', mode, why: r.why }); return null; }
  state.shells.push(r.S); out.spawned.push(r.S);
  return r.S;
}
// an explosion (sp_01 [e+0xcac0]) at a point with the owner's words (+0x30.. = block +0x50..), +0x20 the zero vector, +0x3c = P+0xb0a /
// 0xffff (a hit id; not visual)
function blast063(state, D, ctx, own, J, point, mode, a, F, out){
  const def = D.shells.shell01;
  const S = make001(state, D, 'shell01', { id: def.id, mode, position: point.slice(), angles: words063(own), action: a ? a.action : null, frame: F },
                    own, J, ctx, null);
  if (S){ S.motionId = ctx.ownerMotion; state.shells.push(S); out.spawned.push(S); }
  return S;
}
// 0xf458ec(e, slot, kind, ..) (READ whole, ..0xf46230): kind -> pool / explosion (the header comment). kind 1 with the attribute's 0x1040
// bits set makes nothing (0xf45a38). Raging (0xf45d78): status 7 picks the +0x3c halfword only (not visual).
function fist063(state, D, ctx, I, own, J, slot, kind, b2c, a, F, out){
  const hit = probe063(J, slot, own, ctx.stage);
  if (!hit){ out.refused.push({ action: a ? a.action : null, slot, why: 'the fist probe 0xf454e0: no floor within 300 of the owner\'s ground under joint ' + (slot === 1 ? 50 : 40) }); return null; }
  let k = kind >= 0 ? kind : kind063(I, slot);
  if (I.v5 && I.slots[slot] === 2) k = 4;                                      // 0xf459b4
  if (k === 1){
    if (hit.attr & 0x1040) return null;
    return pool063(state, D, ctx, own, hit.point, hit.normal, I.v5 && I.rage ? 4 : 0, b2c, a, F, out);
  }
  if (k === 3) return blast063(state, D, ctx, own, J, hit.point, 2, a, F, out);   // no caller passes 3
  if (k !== 4) return null;
  const m22 = ctx.ownerMotion === 0x216 || ctx.ownerMotion === 0x217;          // (motion >> 1) == 0x10b: L2 M22 / M23
  return blast063(state, D, ctx, own, J, hit.point, m22 ? 9 : (I.v5 && I.rage ? 14 : 3), a, F, out);
}
// 0xf3b7e8(e, slot, kind) (READ whole, ..0xf3bc80): slot > 3 nothing; the probe; kind < 0 computed and 4 -> 3; Raging: this slot Red -> 3,
// both arms Red -> 4 (0xf3b900..); 1 -> a pool 5 higher (+0x2c 0); 3 -> sp_01 5 (Raging enraged 18); 4 -> sp_01 4 (17); +0x3c 0xffff
function fists063(state, D, ctx, I, own, J, slot, kind, a, F, out){
  if (slot > 3) return null;
  const hit = probe063(J, slot, own, ctx.stage);
  if (!hit){ out.refused.push({ action: a ? a.action : null, slot, why: 'the fist probe 0xf454e0: no floor within 300 of the owner\'s ground' }); return null; }
  let k = kind;
  if (k < 0){ k = kind063(I, slot); if (k === 4) k = 3; }
  if (I.v5){ if (I.slots[slot] === 2) k = 3; if (I.slots[0] === 2 && I.slots[1] === 2) k = 4; }
  if (k === 1){
    if (hit.attr & 0x1040) return null;
    return pool063(state, D, ctx, own, [hit.point[0], f(hit.point[1] + f(5.0)), hit.point[2]], hit.normal, I.v5 && I.rage ? 4 : 0, 0, a, F, out);
  }
  if (k === 3) return blast063(state, D, ctx, own, J, hit.point, I.v5 && I.rage ? 0x12 : 5, a, F, out);
  if (k === 4) return blast063(state, D, ctx, own, J, hit.point, I.v5 && I.rage ? 0x11 : 4, a, F, out);
  return null;
}
// THE PAIR TEST (READ): the jump slam's landing (0xf3f02c phase 3 on L2 M3, (7, 0x13 / 0x16 / 0x18), F = 34; 0xf41114, (7, 0xb2), F = 30)
// -- both arms' kinds 4: at F both fists' 0xf3b7e8(k, 4); else each arm alone: kind 1 at 8 -> 0xf3b7e8(k, 1), kind 3 / 4 at F ->
// 0xf3b7e8(k, 3); 0 nothing. L0 M57 ((3, 2) 0xf3b514 / (3, 5) 0xf3c694, f16): both 4 -> (k, 4) each, else (k, -1) each (computed there).
// Each arm spent once (0xf4653c(e, k, -1): the level, not modelled here)
function pair063(state, D, ctx, I, own, J, sp, a, out){
  const k0 = kind063(I, 0), k1 = kind063(I, 1), both = k0 === 4 && k1 === 4;
  if (sp.kind === 'pairL0'){
    if (!pass001(state, f(sp.frame))) return;
    for (const k of [0, 1]) fists063(state, D, ctx, I, own, J, k, both ? 4 : -1, a, sp.frame, out);
    return;
  }
  if (both){ if (pass001(state, f(sp.frame))) for (const k of [0, 1]) fists063(state, D, ctx, I, own, J, k, 4, a, sp.frame, out); return; }
  for (const [k, kk] of [[1, k1], [0, k0]]){
    if (kk === 1 && pass001(state, f(8.0))) fists063(state, D, ctx, I, own, J, k, 1, a, 8, out);
    else if ((kk === 3 || kk === 4) && pass001(state, f(sp.frame))) fists063(state, D, ctx, I, own, J, k, 3, a, sp.frame, out);
  }
}
// THE BIG SLAM's pool (L2 M42 0xf3e5ac.. f90 with 550, L2 M41 0xf3ec44.. f124 with 400; READ): the point = the owner's +0x40 + (0, 0, d x
// size 0xbe518) turned by his yaw (x cos + z sin; the 0.0 literal on x and y), the drop probe (0xf3e7a8) from it, then 0xf3e984: the
// normal to (0, 1, 0) below 0.75, the words groundAngles, sp_35 MODE 1 (no variant / rage test) at the probe's point, +0x2c 0, +0x2e P+0xb0a
function big063(state, D, ctx, own, sp, a, out){
  if (!own.ownerPos){ out.refused.push({ action: a.action, shell: 'shell35', mode: 1, why: 'no owner position (input.ownerPos)' }); return; }
  const sc = size001(own), x0 = f(sc * f(0.0)), z0 = f(sc * f(sp.dist));
  const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), P = own.ownerPos;
  const p = [f(P[0] + mla(f(x0 * cs), z0, sn)), f(P[1] + x0), f(P[2] + mls(f(z0 * cs), x0, sn))];
  const g = drop063(p, own, ctx.stage);
  if (!g){ out.refused.push({ action: a.action, shell: 'shell35', mode: 1, why: 'the drop probe 0xf3e7a8: no floor within 500 of the owner\'s ground' }); return; }
  pool063(state, D, ctx, own, g.point, g.normal[1] < f(0.75) ? [0, 1, 0] : g.normal, 1, 0, a, sp.frame, out);
}
// THE SLIME LINES (L2 M42 f125 0xf3e4a0 / 0xf40ef8 mode 1; L2 M41 f190 0xf3edc8 mode 0; READ): sp_11 [e+0xcac4] at the owner's +0x40..,
// his words +0x50.., +0x3c = a draw (0x16b4b4 -> P+0xb0a), the zero vector at +0x20. Its children are made by its own clock (tick11 ->
// create063s11): mode 1 the eight of the line (u 30), mode 0 the twelve scattered (u 31)
function line063(state, D, ctx, own, J, sp, a, out){
  if (!own.ownerPos){ out.refused.push({ action: a.action, shell: 'shell11', mode: sp.mode, why: 'no owner position (input.ownerPos)' }); return; }
  const def = D.shells.shell11;
  const S = make001(state, D, 'shell11', { id: def.id, mode: sp.mode, position: own.ownerPos.slice(), angles: words063(own), action: a.action, frame: sp.frame },
                    own, J, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
}
const act063 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em063', list, clip, pick: x.pick || 'always',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
// a fist row: { frame, kind: 'fist', slot, k (the kind passed: -1 / 1), b2c, gate } -- `gate`: the kind-1 sites test the arm's level
// (ctl+0x24 + 12 slot >= 1: 0xf3da28; the census at level 0 makes nothing there) before they probe
const FIST063 = (frame, slot, k, b2c = 0) => ({ frame, kind: 'fist', slot, k, b2c, gate: k === 1 });
function spawn063(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints, I = state063(D, input);
  if (own.ground == null && a.spawns.some(sp => sp.kind !== 'line')){
    if (a.spawns.some(sp => pass001(state, f(sp.frame)))) out.refused.push({ action: a.action, why: 'no ground (input.ground or input.rock.floorY)' });
    return;
  }
  for (const sp of a.spawns){
    if (sp.kind === 'pair' || sp.kind === 'pairL0'){ pair063(state, D, ctx, I, own, J, sp, a, out); continue; }
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.kind === 'fist'){ if (!sp.gate || I.v5 || I.levels[sp.slot] >= 1) fist063(state, D, ctx, I, own, J, sp.slot, sp.k, sp.b2c, a, sp.frame, out); }
    else if (sp.kind === 'big') big063(state, D, ctx, own, sp, a, out);
    else if (sp.kind === 'line') line063(state, D, ctx, own, J, sp, a, out);
  }
}
// the frame handler vt+0x208 0xf3552c (READ whole, ..0xf35870; census of every motion id L0..L4 M0..109: only this): on motion 0x216 (L2
// M22) the crossings of 114 (slot 0), 152 (slot 1) and 180 (slot 0) -> the fist (kind -1, the normal below 0.75 to up, b2c 0), each arm
// spent -- an enraged Brachydios / any Raging Red fist makes sp_01 9 (u 40) there, not 3
const PERFRAME063 = [[114, 0], [152, 1], [180, 0]];
function perFrame063(state, D, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints || ctx.ownerMotion !== 0x216) return;
  const own = ctx.own001, I = state063(D, input);
  for (const [F, slot] of PERFRAME063)
    if (pass001(state, f(F))) fist063(state, D, ctx, I, own, state.prevJoints, slot, -1, 0, null, F, out);
}

// ---- THE ERUPTION: 0xf46234(e, slot) (READ whole, ..0xf46520) -------------------------------------------------------------------------
// the warning handle +0xc0+4k stopped (0x329c40(h, 1): the effects lane's u 200 + slot); with the unit live a slot that is NOT Red returns
// here (no shell); Red -> its countdown -1.0; the trigger cleared; then sp_01 [e+0xcac0] (0x3fa2bc(0x40)), +8 THE MODE by the jump table
// 0xf462cc (slot 0..3; > 3: 0x17): slot 0 the LEFT arm -- part 3's break level (0x9d36c) >= the .dtp byte [6] (rank > 4) / [5] -> 0x21 /
// 0x22, else 0x19 / 0x1a; slot 1 the RIGHT arm -- part 2, the same bytes -> 0x23 / 0x24, else 0x1b / 0x1c; slot 2 the HEAD -- part 0,
// bytes [2] / [1] -> 0x1f / 0x20, else 0x17 / 0x18; slot 3 the TAIL -- part 6's level != 0 (severed) -> 0x25 / 0x26, else 0x1d / 0x1e;
// the second of each pair when enraged (0x81670). +0xc the enemy, +0x10.. the ZERO VECTOR (0x1831a78 -> 0x19176b0), +0x20 the same,
// +0x30.. his words P+0x50.., +0x3c 0xffff -> 0x48b884. THE POINT IS THE FILE'S: every mode 23..38 has sh int 4 = 0 (flag bit 0: at the
// joint) and int 0 the joint -- 3 head, 40 left arm, 50 right arm, 143 tail -- with vec 0 the offset through its matrix (init011's joint
// arm, launchPoint): u 210 (em063_00_001) at ShellScale 0.62 / 0.85 (head, tail), 0.52 / 0.6 (arms), 0.3 broken / severed; hit 21 calm /
// 22 enraged (HDS (10, 10)).
//   THE VIEWER (motion-states.js CLASS_TIMERS em063_05 slime063 holds u 200 + slot for the 30-frame fuse): on the step the fuse burns
// out (its `held` -> `spent`), index.html passes input.erupt063 = { slots: [k, ..] } (k = the slot: 0 left arm, 1 right arm, 2 head, 3
// tail) with the same input.rage / input.slime063 / input.breaks063 / input.tailSevered as the rest. Brachydios has no eruption.
function mode063erupt(I, slot, rank){
  const A = DTPA063, g = rank > 4;
  if (slot === 0) return (I.breaks[3] >= (g ? A[6] : A[5]) ? 0x21 : 0x19) + (I.rage ? 1 : 0);
  if (slot === 1) return (I.breaks[2] >= (g ? A[6] : A[5]) ? 0x23 : 0x1b) + (I.rage ? 1 : 0);
  if (slot === 2) return (I.breaks[0] >= (g ? A[2] : A[1]) ? 0x1f : 0x17) + (I.rage ? 1 : 0);
  if (slot === 3) return (I.severed ? 0x25 : 0x1d) + (I.rage ? 1 : 0);
  return 0x17;
}
export function erupt063(state, D, ctx, input, out, slot){
  if (!D.variant063 || D.variant063 !== 5) return null;
  const I = state063(D, input), own = ctx.own001;
  if (I.slots[slot] !== 2){ out.refused.push({ shell: 'shell01', slot, why: '0xf46234: the slot is not Red at the burn-out (no explosion)' }); return null; }
  const J = state.prevJoints || ctx.J;
  const S = blast063(state, D, ctx, own, J, [0, 0, 0], mode063erupt(I, slot, own.rank), null, null, out);
  if (S) S.erupt063 = slot;
  return S;
}
function eruptStep063(state, D, ctx, input, out){
  const e = input.erupt063, slots = e && Array.isArray(e.slots) ? e.slots : (e && Number.isFinite(e.slot) ? [e.slot] : []);
  for (const k of slots) erupt063(state, D, ctx, input, out, k | 0);
}

// ---- THE DATA (generated from the arcs: <archive> gapQ/gen063.py; the HDS pairs (s16 delay, s16 duration) by record) ------------------
// em063_00 shell01 (shell\em\em063_00_shell01\em063_00_01): 39 modes in the ShellInfoList, 10 with files
const MODES063_00_01 = {
      0: m057(1.0, [[0, 31]], [0], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      1: m057(1.0, [[0, 30]], [1], [-1, 7, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      2: m057(1.0, [[0, 1]], [2], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      3: m057(1.0, [[0, 50]], [3], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      4: m057(1.0, [[0, 40]], [4], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 100.0]]),
      5: m057(1.0, [[0, 41]], [5], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 100.0]]),
      6: m057(1.0, [[0, 1]], [6], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      7: m057(1.0, [[0, 11]], [7], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      8: m057(1.0, [[0, 51]], [8], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      9: m057(1.0, [[0, 40]], [9], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
};
const HITDATA063_00_01 = [[32, 10], [0, 10], [10, 8], [10, 8], [0, 8], [0, 8], [0, 10], [0, 10], [2, 8], [2, 8], [10, 10], [10, 10], [0, 10], [0, 10], [32, 10], [0, 10], [0, 10], [0, 10], [2, 10], [2, 10], [0, 10], [10, 10], [10, 10]];
// em063_00 shell11 (shell\em\em063_00_shell11\em063_00_11): 2 modes in the ShellInfoList, 2 with files
const MODES063_00_11 = {
      0: m057(1.0, [], [], [12, 7], [0.0, 6.0, 12.0, 18.0, 30.0, 36.0, 42.0, 48.0, 60.0, 66.0, 72.0, 78.0, 30.0], [[0.0, 0.0, 400.0], [0.0, 0.0, 400.0], [0.0, 0.0, 400.0], [0.0, 0.0, 400.0], [0.0, 0.0, 400.0], [0.0, 0.0, 700.0], [0.0, 0.0, 700.0], [0.0, 0.0, 700.0], [0.0, 0.0, 700.0], [0.0, 0.0, 1000.0], [0.0, 0.0, 1000.0], [0.0, 0.0, 1000.0], [0.0, 0.0, 1000.0]]),
      1: m057(1.0, [], [], [8, -1], [0.0, 6.0, 12.0, 18.0, 24.0, 30.0, 36.0, 42.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 400.0], [0.0, 0.0, 700.0], [100.0, 0.0, 1000.0], [-100.0, 0.0, 1300.0], [0.0, 0.0, 1600.0], [200.0, 0.0, 1900.0], [-200.0, 0.0, 2200.0], [0.0, 0.0, 2500.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
};
// em063_00 shell35 (shell\em\em063_00_shell35\em063_00_35): 5 modes in the ShellInfoList, 2 with files
const MODES063_00_35 = {
      0: m057(1.0, [[0, 0]], [0], [-1, 6], [300.0, 1.0, 1.0, 0.0], [[0.0, 5.0, 0.0]]),
      1: m057(1.0, [[0, 10]], [1], [0, 7], [300.0, 1.0, 2.0, 250.0], [[0.0, 5.0, 0.0]]),
};
const HITDATA063_00_35 = [[0, 999], [0, 999], [0, 999], [0, 999]];
// em063_05 shell01 (shell\em\em063_05_shell01\em063_05_01): 39 modes in the ShellInfoList, 31 with files
const MODES063_05_01 = {
      0: m057(1.0, [[1, 31]], [0], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      1: m057(1.0, [[1, 30]], [1], [-1, 7, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      2: m057(1.0, [[1, 1]], [2], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      3: m057(1.0, [[1, 50]], [11], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      4: m057(1.0, [[1, 40]], [12], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      5: m057(1.0, [[1, 41]], [13], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      6: m057(1.0, [[1, 1]], [16], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      7: m057(1.0, [[1, 11]], [7], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      8: m057(1.0, [[1, 21]], [8], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      9: m057(1.0, [[1, 40]], [18], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      14: m057(1.0, [[1, 50]], [11], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      17: m057(1.0, [[1, 130]], [12], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      18: m057(1.0, [[1, 131]], [13], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      21: m057(1.0, [[1, 111]], [17], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      22: m057(1.0, [[1, 11]], [20], [-1, -1, -1, -1, -1], [], [[0.0, 0.0, 0.0]]),
      23: m057(0.6200000047683716, [[1, 210]], [21], [3, -1, -1, -1, 0], [], [[0.0, 0.0, 150.0]]),
      24: m057(0.8500000238418579, [[1, 210]], [22], [3, -1, -1, -1, 0], [], [[0.0, 0.0, 150.0]]),
      25: m057(0.5199999809265137, [[1, 210]], [21], [40, -1, -1, -1, 0], [], [[20.0, -42.0, -60.0]]),
      26: m057(0.6000000238418579, [[1, 210]], [22], [40, -1, -1, -1, 0], [], [[20.0, -42.0, -60.0]]),
      27: m057(0.5199999809265137, [[1, 210]], [21], [50, -1, -1, -1, 0], [], [[-20.0, -42.0, -60.0]]),
      28: m057(0.6000000238418579, [[1, 210]], [22], [50, -1, -1, -1, 0], [], [[-20.0, -42.0, -60.0]]),
      29: m057(0.6200000047683716, [[1, 210]], [21], [143, -1, -1, -1, 0], [], [[0.0, 0.0, -30.0]]),
      30: m057(0.8500000238418579, [[1, 210]], [22], [143, -1, -1, -1, 0], [], [[0.0, 0.0, -30.0]]),
      31: m057(0.30000001192092896, [[1, 210]], [21], [3, -1, -1, -1, 0], [], [[0.0, 0.0, 150.0]]),
      32: m057(0.30000001192092896, [[1, 210]], [22], [3, -1, -1, -1, 0], [], [[0.0, 0.0, 150.0]]),
      33: m057(0.30000001192092896, [[1, 210]], [21], [40, -1, -1, -1, 0], [], [[20.0, -42.0, -60.0]]),
      34: m057(0.30000001192092896, [[1, 210]], [22], [40, -1, -1, -1, 0], [], [[20.0, -42.0, -60.0]]),
      35: m057(0.30000001192092896, [[1, 210]], [21], [50, -1, -1, -1, 0], [], [[-20.0, -42.0, -60.0]]),
      36: m057(0.30000001192092896, [[1, 210]], [22], [50, -1, -1, -1, 0], [], [[-20.0, -42.0, -60.0]]),
      37: m057(0.30000001192092896, [[1, 210]], [21], [143, -1, -1, -1, 0], [], [[0.0, 0.0, -30.0]]),
      38: m057(0.30000001192092896, [[1, 210]], [22], [143, -1, -1, -1, 0], [], [[0.0, 0.0, -30.0]]),
};
const HITDATA063_05_01 = [[32, 10], [0, 10], [10, 8], [10, 8], [0, 8], [0, 8], [0, 10], [0, 10], [2, 8], [2, 8], [10, 10], [10, 10], [0, 10], [0, 10], [32, 10], [0, 10], [0, 10], [0, 10], [2, 10], [2, 10], [0, 10], [10, 10], [10, 10]];
// em063_05 shell11 (shell\em\em063_05_shell11\em063_05_11): 2 modes in the ShellInfoList, 2 with files
const MODES063_05_11 = {
      0: m057(1.0, [], [], [12, 7], [0.0, 6.0, 12.0, 18.0, 30.0, 36.0, 42.0, 48.0, 60.0, 66.0, 72.0, 78.0, 30.0], [[0.0, 0.0, 400.0], [0.0, 0.0, 400.0], [0.0, 0.0, 400.0], [0.0, 0.0, 400.0], [0.0, 0.0, 400.0], [0.0, 0.0, 700.0], [0.0, 0.0, 700.0], [0.0, 0.0, 700.0], [0.0, 0.0, 700.0], [0.0, 0.0, 1000.0], [0.0, 0.0, 1000.0], [0.0, 0.0, 1000.0], [0.0, 0.0, 1000.0]]),
      1: m057(1.0, [], [], [8, -1], [0.0, 6.0, 12.0, 18.0, 24.0, 30.0, 36.0, 42.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 400.0], [0.0, 0.0, 700.0], [100.0, 0.0, 1000.0], [-100.0, 0.0, 1300.0], [0.0, 0.0, 1600.0], [200.0, 0.0, 1900.0], [-200.0, 0.0, 2200.0], [0.0, 0.0, 2500.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
};
// em063_05 shell35 (shell\em\em063_05_shell35\em063_05_35): 5 modes in the ShellInfoList, 3 with files
const MODES063_05_35 = {
      0: m057(1.0, [[1, 100]], [2], [-1, 6], [150.0, 1.0, 0.0, 0.0], [[0.0, 0.0, 0.0]]),
      1: m057(1.0, [[1, 10]], [1], [0, 7], [150.0, 1.0, 3.5, 250.0], [[0.0, 5.0, 0.0]]),
      4: m057(1.0, [[1, 110]], [2], [-1, 21], [150.0, 1.0, 0.0, 0.0], [[0.0, 0.0, 0.0]]),
};
const HITDATA063_05_35 = [[0, 999], [0, 999], [0, 999], [0, 999]];
const SHELLS063 = (v, folder, M01, H01, M11, M35, H35) => ({
  shell01: { id: v ? 0x113 : 0x110, cls: 'uShellEm063_sp_01', base: 'base01', reader: 0xf4815c, folder: folder + '_shell01', modes: M01, hitdata: H01 },
  shell11: { id: v ? 0x114 : 0x111, cls: 'uShellEm063_sp_11', base: 'base11', reader: 0xf48350, folder: folder + '_shell11', modes: M11 },
  shell35: { id: v ? 0x115 : 0x112, cls: 'uShellEm063_sp_35', base: 'base35', reader: 0xf48bb4, folder: folder + '_shell35', modes: M35, hitdata: H35 },
});
// THE ROWS (census <archive> gapQ/cen063.py on trgen063 -- every action of statuses 0..13, phases 0..8, each frame literal alone, rage 0 / 1,
// variant 0 levels 2 / 0 and variant 5 Yellow / Red; the status-3 walks by motion id, st3b.py -- each site then read): the kind-1 sites
// (L2 M28 / M29 / M5 / M8) are gated on the arm's level; the kind -1 ones compute it.
const ACTIONS063 = [
  // L2 M28 / M29, the straight punches: (7, 3 / 0x2f / 0x31 / 0x33 / 0x3f / 0x95 / 0xad) slot 0, (7, 2 / 0x2e / 0x30 / 0x32 / 0x3e / 0x94 / 0xac)
  // slot 1 -- 0xf3dad8 / 0xf4088c at 72, kind 1
  act063(7, 0x03, '2', 'Motion[28]', [FIST063(72, 0, 1)], { also: [[7, 0x2f], [7, 0x31], [7, 0x33], [7, 0x3f], [7, 0x95], [7, 0xad]] }),
  act063(7, 0x02, '2', 'Motion[29]', [FIST063(72, 1, 1)], { also: [[7, 0x2e], [7, 0x30], [7, 0x32], [7, 0x3e], [7, 0x94], [7, 0xac]] }),
  // L2 M11 / M13, the side punches (0xf3f890 / 0xf419a4 at 26, kind -1): slot 0 (7, 0x1a / 0x29 / 0x84 / 0x88 / 0x8c / 0x90 / 0xb3), slot 1
  // (7, 0x1c / 0x27 / 0x86 / 0x8a / 0x8e / 0x92 / 0xb4)
  act063(7, 0x1a, '2', 'Motion[11]', [FIST063(26, 0, -1)], { also: [[7, 0x29], [7, 0x84], [7, 0x88], [7, 0x8c], [7, 0x90], [7, 0xb3]] }),
  act063(7, 0x1c, '2', 'Motion[13]', [FIST063(26, 1, -1)], { also: [[7, 0x27], [7, 0x86], [7, 0x8a], [7, 0x8e], [7, 0x92], [7, 0xb4]] }),
  // L2 M54 (7, 7 / 0x4d): 0xf3e19c at 72, slot 1, kind -1
  act063(7, 0x07, '2', 'Motion[54]', [FIST063(72, 1, -1)], { also: [[7, 0x4d]] }),
  // the turn punches 0xf3fc94 (phase 0 turns on table 0x16a01a4 (slot 0: L2 M5 x3) / 0x16a01e4 (slot 1: L2 M8 x3)), phase 1 at 6, kind 1:
  // slot 0 (7, 0x3c / 0x54 / 0x58 / .. / 0x80 (every 4th from 0x54) / 0xa4 / 0xa9), slot 1 (7, 0x3d / 0x56 / 0x5a / .. / 0x82 / 0xa2 / 0xaa)
  act063(7, 0x3c, '2', 'Motion[5]', [FIST063(6, 0, 1)], { also: [0x54, 0x58, 0x5c, 0x60, 0x64, 0x68, 0x6c, 0x70, 0x74, 0x78, 0x7c, 0x80, 0xa4, 0xa9].map(n => [7, n]) }),
  act063(7, 0x3d, '2', 'Motion[8]', [FIST063(6, 1, 1)], { also: [0x56, 0x5a, 0x5e, 0x62, 0x66, 0x6a, 0x6e, 0x72, 0x76, 0x7a, 0x7e, 0x82, 0xa2, 0xaa].map(n => [7, n]) }),
  // the jump slam: L2 M2 then L2 M3 on landing; the pair test at 8 / 34 ((7, 0x13 / 0x16 / 0x18) 0xf3f02c) or 8 / 30 ((7, 0xb2) 0xf41114)
  ...[0x13, 0x16, 0x18].map(n => act063(7, n, '2', 'Motion[3]', [{ frame: 34, kind: 'pair' }], { pick: 'ai' })),
  act063(7, 0xb2, '2', 'Motion[3]', [{ frame: 30, kind: 'pair' }], { pick: 'ai' }),
  // L2 M42, the big slam: the slime line (sp_11 1) at 125 on (7, 8 / 0x14 / 0xa6 / 0xb0); the big pool (sp_35 1, 550 ahead) at 90 on (7, 0x15 /
  // 0xa5 / 0xb1) -- the plays CLIP_ACTIONS names (the AI's pick NOT READ: the viewer names one a play)
  ...[0x08, 0x14, 0xa6, 0xb0].map(n => act063(7, n, '2', 'Motion[42]', [{ frame: 125, kind: 'line', mode: 1 }], { pick: 'ai' })),
  ...[0x15, 0xa5, 0xb1].map(n => act063(7, n, '2', 'Motion[42]', [{ frame: 90, kind: 'big', dist: 550.0 }], { pick: 'ai' })),
  // L2 M41: the scatter (sp_11 0) at 190 on (7, 9); the big pool 400 ahead at 124 on (7, 0x98)
  act063(7, 0x09, '2', 'Motion[41]', [{ frame: 190, kind: 'line', mode: 0 }], { pick: 'ai' }),
  act063(7, 0x98, '2', 'Motion[41]', [{ frame: 124, kind: 'big', dist: 400.0 }], { pick: 'ai' }),
  // THE STATUS-3 WALKS (0xf3c9f0: n 0 / 1 / 3 -> 0xf3a234(e, 0 / 1 / 2), 2 -> 0xf3b514, 4 -> 0xf3bcb4, 5 -> 0xf3c694; by the motion id they
  // are on, 0xb0944): every fist kind -1 (b2c 1 where the site stores 1)
  act063(3, 0x00, '0', 'Motion[52]', [FIST063(54, 0, -1, 1), FIST063(88, 1, -1, 1)]),
  act063(3, 0x00, '0', 'Motion[54]', [FIST063(30, 0, -1), FIST063(40, 1, -1)]),
  act063(3, 0x02, '0', 'Motion[57]', [{ frame: 16, kind: 'pairL0' }], { also: [[3, 0x05]] }),
  act063(3, 0x01, '0', 'Motion[58]', [FIST063(60, 1, -1, 1), FIST063(80, 0, -1, 1)]),
  act063(3, 0x01, '0', 'Motion[59]', [FIST063(12, 1, -1, 1)]),
  act063(3, 0x01, '0', 'Motion[60]', [FIST063(45, 0, -1), FIST063(54, 1, -1)]),
  act063(3, 0x04, '0', 'Motion[61]', [FIST063(60, 1, -1, 1), FIST063(80, 0, -1, 1)], { also: [[3, 0x03]] }),
  act063(3, 0x04, '0', 'Motion[62]', [FIST063(9, 1, -1, 1), FIST063(29, 0, -1, 1), FIST063(58, 1, -1, 1)], { also: [[3, 0x03]] }),
  act063(3, 0x03, '0', 'Motion[63]', [FIST063(45, 0, -1), FIST063(54, 1, -1)]),
];
SHELL_DATA.em063_00 = { name: 'Brachydios', variant063: 0, lists: { 0: { list: 'u', pel: 'em063_00u' } },
  shells: SHELLS063(0, 'shell\\em\\em063_00', MODES063_00_01, HITDATA063_00_01, MODES063_00_11, MODES063_00_35, HITDATA063_00_35),
  actions: ACTIONS063.map(r => Object.assign({}, r)), perFrame063: PERFRAME063 };
// Raging: the same class and rows; his .shl EffectLists name em063_05u at index 1 (listId 1 in every ef)
SHELL_DATA.em063_05 = { name: 'Raging Brachydios', variant063: 5, lists: { 1: { list: 'u', pel: 'em063_05u' } },
  shells: SHELLS063(5, 'shell\\em\\em063_05', MODES063_05_01, HITDATA063_05_01, MODES063_05_11, MODES063_05_35, HITDATA063_05_35),
  actions: ACTIONS063.map(r => Object.assign({}, r)), perFrame063: PERFRAME063, erupt063: true };
```

## (c) rom-map rows (to add under a new section "Brachydios / Raging -- the shells (shells lane helper, 2026-10-25; <archive> gapQ/RESULT.md)")

| address / thing | what | owner | status | detail |
|---|---|---|---|---|
| `0xf35108` (vt+0x158) | ids: v0 e+0xcac0 0x110 sp_01 / +0xcac4 0x111 sp_11 / +0xcac8 0x112 sp_35; v5 0x113 / 0x114 / 0x115; other variants none | uEm063_00 | R | gapQ a1 |
| `0x17da2d8` / `0x17da448` / `0x17da5bc` | sp_01 (base01, reader 0xf4815c) / sp_11 (base11, reader 0xf48350, +0x150 0xf489dc, +0x168 0xf484d8) / sp_35 (base35 0x175169c, reader 0xf48bb4, +0x154 0xf48ca0) | uShellEm063_* | R | gapQ a2 |
| `0xf4815c` | sp_01 reader: ef0 +0x15c8, hit0 +0x15d8, int0 joint +0x15e4, +0x15ec bit2 int2 / bit3 int3 / **bit0 int4**, int1 +0x15e8, vec0 +0x1608; no timer | uShellEm063_sp_01 | R | gapQ a4 |
| `0xf458ec` | THE FIST (e, slot, kind, &pt, &n, attr, b2c): kind 1 sp_35 0 (v5 enraged 4); 4 sp_01 3 (v5 enraged 14; L2 M22 / M23 9); 3 sp_01 2 (no caller); kind < 0 computed; v5 Red slot -> 4 | uEm063_00 | R | gapQ a5 |
| `0xf454e0` | fist probe: joint 50 (slot 1) / 40, y + 1000, ray 0x18154c, hit - P+0x5b4 in [-300, 300) | uEm063_00 | R | gapQ a6 |
| `0xf3b7e8` | both-fists maker: kind < 0 computed, 4 -> 3; v5 slot Red -> 3, both arms Red -> 4; 1 pool (+5 y), 3 sp_01 5 (v5 enr 0x12), 4 sp_01 4 (0x11) | uEm063_00 | R | gapQ a7 |
| `0xf3e984` / `0xf3e7a8` | the big slam's pool: sp_35 MODE 1, groundAngles, at the drop probe (ray from +1000, P+0x5b4 - hit in [-500, 500), y + 4) of P+0x40 + 550 (L2 M42) / 400 (L2 M41) x 0xbe518 ahead | uEm063_00 | R | gapQ a8 |
| base35 `0x4186bc`..`0x418de4` | 0x30 request (0x41876c; +0x20 the WORDS, +0x2c byte, +0x2e half); init 0x418888 (+0x40 = point + vec turned by Y; timer = float 0; ef 0); move 0x418af0 / 0x418bb8 (timer out -> end 0x418cfc graceful, vt+0x154, 0xac030 if +0x15f8 == 0); 0xfe 1800 | uShellEmBase35 | R | gapQ a9; NEW base |
| `0xf48bb4` / `0xf48ca0` | sp_35 reader (float 0 the life +0x15d0, int 1 +0x15e4 the child mode) / +0x154: sp_01 [e+0xcac0] mode int 1 at the pool -- THE POOL'S EXPLOSION (0 -> 6 u 1, 1 -> 7 u 11, v5 4 -> 21 u 111) | uShellEm063_sp_35 | R | gapQ a10 |
| `0xf48350` / `0xf484d8` / `0xf489dc` | sp_11 reader (times = floats 0..int0-1) / +0x168 (mode 1 the line along vec k+1; mode 0 Y += 0x2000 \| (k&3)<<14, x = vx + vz(-0.4 + 0.4 rng%3); drop probe 0xf487f0; sp_01 mode = its mode) / +0x150 camera shakes | uShellEm063_sp_11 | R | gapQ a11 |
| the sites (status 7) | L2 M28 s0 / M29 s1 f72 k1; L2 M11 s0 / M13 s1 f26 k-1; L2 M54 s1 f72; turn punches 0xf3fc94 L2 M5 (table 0x16a01a4) s0 / L2 M8 (0x16a01e4) s1 f6 k1; L2 M3 the pair test 8 / 34 (7, 0x13 / 0x16 / 0x18), 8 / 30 (7, 0xb2); L2 M42 f125 sp_11 1 (7, 8 / 0x14 / 0xa6 / 0xb0), f90 big pool (7, 0x15 / 0xa5 / 0xb1); L2 M41 f190 sp_11 0 (7, 9), f124 big pool (7, 0x98) | uEm063_00 | R + E | gapQ a12 |
| the status-3 walks `0xf3c9f0` | handlers branch on the motion id: L0 M52 54/88, M54 30/40, M57 f16 pair, M58 60/80, M59 12, M60 45/54, M61 60/80, M62 9/29/58, M63 45/54; (3, 4) table 0x212d800 L0 M61 / M62 / M64 | uEm063_00 | R + E | gapQ a12 |
| `0xf3552c` (vt+0x208) | L2 M22 only: f114 s0, f152 s1, f180 s0, kind -1 (census of L0..L4 M0..109) | uEm063_00 | R | gapQ a12 |
| `0xf46234` (the eruption) | [upgrade of the 2026-10-25 row] the live unit with the slot NOT Red returns (no shell); +0x10 = the zero vector -- the POINT is the file's: modes 23..38 sh int 4 = 0 (at the joint), int 0 = joint 3 / 40 / 50 / 143, vec 0 the offset; u 210, hit 21 / 22 (10, 10) | uEm063_00 | R | gapQ a13 |
| u 10 / 100 / 110 (em063_05u) | **the pools' records** (sp_35 1 / 0 / 4), not a static aura: the board's lead "the static effect is em063_05_000 or em063_05_002" is answered -- they are base35's ef 0 | data | R | gapQ a10, a15 |
| em063_05u key 21 | no UNIQUE record; Raging's sp_01 mode 8 names it -- and no maker makes mode 8 | data | R (file) | gapQ a15 |
| sp_01 modes 2, 8, 10..13, 15, 16, 19, 20, 22 | no maker (8 submit sites + 2 shell sites read; f458ec kind 3 passed by none of its 23 callers) | uEm063_00 | R (negative, control: the 8 sites) | gapQ negatives |

**Traps (for the numbered list):**
* **A census that stubs the class's own probes sees no slime at all.** cengen11 on uEm063_00 (fb/cen11r_em063_*) found 5 actions with
  creates (the sp_11 lines only): the fist probes 0xf454e0 / 0xf3e7a8 run natively and fail on the stubbed ray, the sp_35 allocator
  0x41876c is not one trgen serves, and the status-3 handlers branch on the motion id (0xb0944), not the phase. With the probes answered
  (`gapQ/trgen063.py`), 0x41876c served and `mot` swept (`st3b.py`), 73 status-7 actions, 6 status-3 handlers and the frame handler
  make shells. Answer a class's own probe before calling a maker unreached.
* **The 0x30 request (0x41876c / 0x3f883c) carries its WORDS at +0x20**, the 0x40 shape (0x3fa2bc) at +0x30. base35's init reads +0x20.

## (d) The replay

`replay063.mjs` (run after `python apply063.py`, which builds `patched/render/` -- a copy of the six render modules with
`code063.js` + `data063.js` appended to shells.js and the three hooks put into stepShells). No viewer, no browser, no recorder.
Output: `replay063.out` (17 cases). Excerpts:

```
== L2 M28 (7, 3) calm: a pool at f72, its explosion 300 later (em063_00)
  step   73 Motion[28] f73: + shell35 112 mode 0 #1 at (160.0, 5.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:0 hit slot (0, 998) timer 299
  step  372 Motion[28] (held) f120: + shell01 110 mode 6 (by #1) #2 at (160.0, 5.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:1 hit slot (0, 9)
  step  372: - shell35 mode 0 #1 ends (lived 299) stops 0 flag 0
  step  383: - shell01 mode 6 #2 ends (lived 11) stops 1 flag 0
== L2 M28 (7, 3), left arm Depleted: nothing (em063_00)
  (nothing)
== L2 M11 (7, 0x1a) enraged: the explosion at once (sp_01 3, u 50) (em063_00)
  step   27 Motion[11] f27: + shell01 110 mode 3 #1 at (160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:50 hit slot (9, 8)
  step   46: - shell01 mode 3 #1 ends (lived 19) stops 50 flag 0
== L2 M3 (7, 0x13) calm: two pools at 8 (em063_00)
  step    9 Motion[3] f9: + shell35 112 mode 0 #1 at (-160.0, 10.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:0 hit slot (0, 998) timer 299
  step    9 Motion[3] f9: + shell35 112 mode 0 #2 at (160.0, 10.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:0 hit slot (0, 998) timer 299
  step  308 Motion[3] (held) f80: + shell01 110 mode 6 (by #1) #3 at (-160.0, 10.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:1 hit slot (0, 9)
  step  308 Motion[3] (held) f80: + shell01 110 mode 6 (by #2) #4 at (160.0, 10.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:1 hit slot (0, 9)
  step  308: - shell35 mode 0 #1 ends (lived 299) stops 0 flag 0
  step  308: - shell35 mode 0 #2 ends (lived 299) stops 0 flag 0
  ...
== L2 M3 (7, 0x13) enraged: both fists sp_01 4 (u 40) at 34 (em063_00)
  step   35 Motion[3] f35: + shell01 110 mode 4 #1 at (260.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:40 hit slot (0, 7)
  step   35 Motion[3] f35: + shell01 110 mode 4 #2 at (-60.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:40 hit slot (0, 7)
  step   44: - shell01 mode 4 #1 ends (lived 9) stops 40 flag 0
  step   44: - shell01 mode 4 #2 ends (lived 9) stops 40 flag 0
== L2 M3 (7, 0xb2) enraged, right arm Depleted: the left alone, sp_01 5 (u 41) at 30 (em063_00)
  step   31 Motion[3] f31: + shell01 110 mode 5 #1 at (260.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:41 hit slot (0, 7)
  step   40: - shell01 mode 5 #1 ends (lived 9) stops 41 flag 0
== L2 M42 (7, 8): the slime line sp_11 1 -> eight sp_01 1 (u 30) (em063_00)
  step  126 Motion[42] f126: + shell11 111 mode 1 #1 at (0.0, 0.0, 0.0) words (0x0, 0x4000, 0x0) starts nothing timer 52
  step  126 Motion[42] f126: + shell01 110 mode 1 (by #1) #2 at (400.0, 4.0, -0.0) words (0x0, 0x4000, 0x0) starts em063_00u:30 hit slot (0, 9)
  step  132 Motion[42] f132: + shell01 110 mode 1 (by #1) #3 at (700.0, 4.0, -0.0) words (0x0, 0x4000, 0x0) starts em063_00u:30 hit slot (0, 9)
  step  137: - shell01 mode 1 #2 ends (lived 11) stops 30 flag 0
  step  138 Motion[42] f138: + shell01 110 mode 1 (by #1) #4 at (1000.0, 4.0, -100.0) words (0x0, 0x4000, 0x0) starts em063_00u:30 hit slot (0, 9)
  step  143: - shell01 mode 1 #3 ends (lived 11) stops 30 flag 0
  ...
== L2 M41 (7, 9): sp_11 0 -> twelve sp_01 0 (u 31) scattered (em063_00)
  step  191 Motion[41] f191: + shell11 111 mode 0 #1 at (0.0, 0.0, 0.0) words (0x0, 0x4000, 0x0) starts nothing timer 88
  step  191 Motion[41] f191: + shell01 110 mode 0 (by #1) #2 at (282.8, 4.0, -282.8) words (0x0, 0x6000, 0x0) starts em063_00u:31 hit slot (31, 10)
  step  197 Motion[41] f197: + shell01 110 mode 0 (by #1) #3 at (-396.0, 4.0, -169.7) words (0x0, 0xa000, 0x0) starts em063_00u:31 hit slot (31, 10)
  step  203 Motion[41] f203: + shell01 110 mode 0 (by #1) #4 at (-282.8, 4.0, 282.8) words (0x0, 0xe000, 0x0) starts em063_00u:31 hit slot (31, 10)
  step  209 Motion[41] f209: + shell01 110 mode 0 (by #1) #5 at (169.7, 4.0, 396.0) words (0x0, 0x2000, 0x0) starts em063_00u:31 hit slot (31, 10)
  step  221 Motion[41] f221: + shell01 110 mode 0 (by #1) #6 at (693.0, 4.0, -297.0) words (0x0, 0x6000, 0x0) starts em063_00u:31 hit slot (31, 10)
  ...
== L2 M42 (7, 0x15): the big pool sp_35 1 (u 10) 550 ahead, sp_01 7 (u 11) 300 later (em063_00)
  step   91 Motion[42] f91: + shell35 112 mode 1 #1 at (550.0, 9.0, -0.0) words (0x0, 0x4000, 0x0) starts em063_00u:10 hit slot (0, 998) timer 299
  step  390 Motion[42] (held) f200: + shell01 110 mode 7 (by #1) #2 at (550.0, 9.0, -0.0) words (0x0, 0x4000, 0x0) starts em063_00u:11 hit slot (0, 9)
  step  390: - shell35 mode 1 #1 ends (lived 299) stops 10 flag 0
  step  401: - shell01 mode 7 #2 ends (lived 11) stops 11 flag 0
== L2 M22 (the frame handler): three fists at 114 / 152 / 180 (em063_00)
  step  115 Motion[22] f115: + shell35 112 mode 0 #1 at (160.0, 5.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:0 hit slot (0, 998) timer 299
  step  153 Motion[22] f153: + shell35 112 mode 0 #2 at (-160.0, 5.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:0 hit slot (0, 998) timer 299
  step  181 Motion[22] f181: + shell35 112 mode 0 #3 at (160.0, 5.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:0 hit slot (0, 998) timer 299
  step  414 Motion[22] (held) f200: + shell01 110 mode 6 (by #1) #4 at (160.0, 5.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:1 hit slot (0, 9)
  step  414: - shell35 mode 0 #1 ends (lived 299) stops 0 flag 0
  step  425: - shell01 mode 6 #4 ends (lived 11) stops 1 flag 0
  ...
== L0 M62 (3, 4): three fists at 9 / 29 / 58 (em063_00)
  step   10 Motion[62] f10: + shell01 110 mode 3 #1 at (-160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:50 hit slot (9, 8)
  step   29: - shell01 mode 3 #1 ends (lived 19) stops 50 flag 0
  step   30 Motion[62] f30: + shell01 110 mode 3 #2 at (160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:50 hit slot (9, 8)
  step   49: - shell01 mode 3 #2 ends (lived 19) stops 50 flag 0
  step   59 Motion[62] f59: + shell01 110 mode 3 #3 at (-160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_00u:50 hit slot (9, 8)
  step   78: - shell01 mode 3 #3 ends (lived 19) stops 50 flag 0
== Raging, Red Slime off: L2 M28 -> pool sp_35 0 (u 100), 150 later sp_01 6 (u 1) (em063_05)
  step   73 Motion[28] f73: + shell35 115 mode 0 #1 at (160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_05u:100 hit slot (0, 998) timer 149
  step  222 Motion[28] (held) f120: + shell01 113 mode 6 (by #1) #2 at (160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_05u:1 hit slot (0, 9)
  step  222: - shell35 mode 0 #1 ends (lived 149) stops 100 flag 0
  step  233: - shell01 mode 6 #2 ends (lived 11) stops 1 flag 0
== Raging, Red Slime on: L2 M28 -> sp_01 14 (u 50) at once (em063_05)
  step   73 Motion[28] f73: + shell01 113 mode 14 #1 at (160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_05u:50 hit slot (9, 10)
  step   94: - shell01 mode 14 #1 ends (lived 21) stops 50 flag 0
== Raging, Red Slime on, left arm erupted (Yellow): L2 M28 -> pool sp_35 4 (u 110), then sp_01 21 (u 111) (em063_05)
  step   73 Motion[28] f73: + shell35 115 mode 4 #1 at (160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_05u:110 hit slot (0, 998) timer 149
  step  222 Motion[28] (held) f120: + shell01 113 mode 21 (by #1) #2 at (160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_05u:111 hit slot (0, 9)
  step  222: - shell35 mode 4 #1 ends (lived 149) stops 110 flag 0
  step  233: - shell01 mode 21 #2 ends (lived 11) stops 111 flag 0
== Raging, Red Slime on: L2 M3 (7, 0x13) -> both sp_01 17 (u 130) at 34 (em063_05)
  step   35 Motion[3] f35: + shell01 113 mode 17 #1 at (160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_05u:130 hit slot (0, 9)
  step   35 Motion[3] f35: + shell01 113 mode 17 #2 at (-160.0, 0.0, 300.0) words (0x0, 0x4000, 0x0) starts em063_05u:130 hit slot (0, 9)
  step   46: - shell01 mode 17 #1 ends (lived 11) stops 130 flag 0
  step   46: - shell01 mode 17 #2 ends (lived 11) stops 130 flag 0
== Raging, Red Slime on: the four eruptions (fuse out at step 5): sp_01 0x1a / 0x1c / 0x18 / 0x1e at joints 40 / 50 / 3 / 143 (em063_05)
  step    5 Motion[0] (held) f1: + shell01 113 mode 26 #1 at (180.0, 78.0, 240.0) words (0x0, 0x4000, 0x0) starts em063_05u:210 hit slot (9, 10)
  step    5 Motion[0] (held) f1: + shell01 113 mode 28 #2 at (-180.0, 78.0, 240.0) words (0x0, 0x4000, 0x0) starts em063_05u:210 hit slot (9, 10)
  step    5 Motion[0] (held) f1: + shell01 113 mode 24 #3 at (0.0, 420.0, 530.0) words (0x0, 0x4000, 0x0) starts em063_05u:210 hit slot (9, 10)
  step    5 Motion[0] (held) f1: + shell01 113 mode 30 #4 at (0.0, 250.0, -730.0) words (0x0, 0x4000, 0x0) starts em063_05u:210 hit slot (9, 10)
  step   26: - shell01 mode 26 #1 ends (lived 21) stops 210 flag 0
  step   26: - shell01 mode 28 #2 ends (lived 21) stops 210 flag 0
  ...
== Raging, calm Red slots, head broken (2) and tail severed: the eruptions 0x19 / 0x1b / 0x1f / 0x25 (em063_05)
  step    5 Motion[0] (held) f1: + shell01 113 mode 25 #1 at (180.0, 78.0, 240.0) words (0x0, 0x4000, 0x0) starts em063_05u:210 hit slot (9, 10)
  step    5 Motion[0] (held) f1: + shell01 113 mode 27 #2 at (-180.0, 78.0, 240.0) words (0x0, 0x4000, 0x0) starts em063_05u:210 hit slot (9, 10)
  step    5 Motion[0] (held) f1: + shell01 113 mode 31 #3 at (0.0, 420.0, 530.0) words (0x0, 0x4000, 0x0) starts em063_05u:210 hit slot (9, 10)
  step    5 Motion[0] (held) f1: + shell01 113 mode 37 #4 at (0.0, 250.0, -730.0) words (0x0, 0x4000, 0x0) starts em063_05u:210 hit slot (9, 10)
  step   26: - shell01 mode 25 #1 ends (lived 21) stops 210 flag 0
  step   26: - shell01 mode 27 #2 ends (lived 21) stops 210 flag 0
  ...
```

Files: `RESULT.md` (this), `code063.js` (the JS), `data063.js` (generated by `gen063.py` from the arcs), `apply063.py`, `replay063.mjs`,
`replay063.out`; tools `trgen063.py` (trgen + the probes answered, 0x41876c served, the makers' args logged), `cen063.py` (cengen11 on it,
with the ids and the slot block poked), `st3b.py` (the status-3 walks by motion id), `pf063.py` (the frame handler by motion id),
`big.py` (the L2 M41 / M42 forms), `shldump.py` / `hds063.py` (the arcs), `fx.py` (function start / callers / word refs), `ia063.py` /
`ia063b.py` (the initialised image); census outputs `cen/`, `sum_*.txt`, `st3_v0.txt`.
