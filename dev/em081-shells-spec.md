# em081_04 Boltreaver Astalos -- his shells: who spawns them, on which clip and frame, and what each base does

Research agent for the Viewer agent, 2026-10-07. Scope: the 17 Group D records of `dev/em081_04-effects-census.md` §5
(u 10 11 25 26 40 41 60 63 64 70 73 74 80 81, c 30 31 32), in the census's §7b order (items 3-7). Static reads with
`efx/armdis.py` and a function-extent wrapper; data from `em081_04.arc` (efx/shellef.py, a ShellInfoList walker).
**Emulation** (unicorn, ARMv8 model -- the game uses `vsel`): (a) every status-7 action body run tick by tick through
the class's own handler `0x1023a6c` with the real frame gate `0x72714`, the real spawners and the arc's own
`em081_00_actiontune` (driver `drv.py`); (b) single functions with stubbed getters (`emu.py`). Positive control for (a):
(7, 0xca) reproduces `dev/beams/em081_04.md`'s beam -- L9 M1, shell 0x153 mode 4 at f48, chain (7, 0xd2) at f90.
Scratch (not in the repo): `C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\
bbae25d7-...\scratchpad\bolt\` (`drv.py`, `allst7.py`, `all_r{5,3}_c{0,2,4}.txt`, `emu.py`, `fn.py`, `shldump2.py`),
`bolt14\` and `bolt15\` (two helper agents: base14 and base15). The effect recorder and lift were NOT run.
Read first: CLAUDE.md, the census, rom-map's Boltreaver / shell / base00 / base01 / base11 rows, `dev/beams/em081_04.md`,
`dev/em084-shells-spec.md`, `dev/em084-phase2-bases.md`, `docs/render/shells.js` (base00 / base01 / base03 / base11
runtimes, `dust001`, `READER00`, `READERS01`, `CREATE11`), the task board's Boltreaver entries.

`R` = READ (the consuming instruction read; "R (emulated)" = the real code run under unicorn). `I` = INFERRED.

---

## 0. Headline -- five corrections to the census before anything is built

1. **Three new bases, not one.** By vtable (the rule's check, rom-map row "`0x175c3e8` w1"), **shell14 runs base14**
   (vtable `0x174f5ac`; setup DTI base00), **shell15 runs base15** (vtable `0x174f73c`; setup DTI base03), **shell50
   runs base50** (vtable `0x1752de0`) and **shell11 runs base11** (setup DTI base01). shells.js has base00 / 01 / 03 / 11,
   **not 14, 15, 50**. The census's "(base00)" for shell14 and "(base03)" for shell15 are the setup DTIs (§1).
2. **Spawn sites the census missed or misassigned** (all R, emulated, §7): shell00 mode **19** (u 26) by (7, 0xdc);
   shell50 mode **0** by (7, 0xcb), **12 / 13** by (7, 0xee) (three shells f100 / f144 / f188); shell00 **6 / 7** also by
   (7, 0xa9 / 0xaa) on L4 M22; the L9 group is chosen by the **action number**, not a condition (0xe0 / 0xe6 / 0xe7 /
   0xef / 0xf0 / 0xf3 -> shell00 22; 0xe1 / 0xe8 / 0xe9 / 0xf1 / 0xf2 / 0xf4 -> shell50 3; 0xe2 / 0xea / 0xeb -> shell00
   23; 0xe3 / 0xec / 0xed -> shell50 5); 7:0xd4's "mode 1 vs 9" is **(7, 0xd4) -> 1, (7, 0xd5) -> 9**; shell01 u 10 is
   (7, 0x3a..0x49) on **L2 M27 / M28 f72** plus (7, 0x8e) / (7, 0x90) -- not 0x8d / 0x8f; u 11 is on **L2 M42 f32**
   (after L2 M49), not L2 M49.
3. **shell50's children are swapped in the census**: mode 6 -> shell01_02 **8** (+ shell01 27), mode 7 -> shell01_02
   **7** (+ shell01 26) (`0x1032858`, R emulated).
4. **The wing / tail charge tier gates three of the shells** (`[e+0xcb02]`, `[e+0xcb03]`; the viewer's CHARGE level):
   the u 10 wing slams need the wings at tier 2 / 4; (7, 0xc7)'s tail slam makes shell11 (u 80 / u 81) only at tail
   tier 4 (§5, §6).
5. **`0x19177b0` is the IDENTITY matrix, not an empty one** -- the static initializer `0x7c4408` writes it (and the
   engine's unit vectors at `0x19176c0..0x1917740`), rom-map rows 196 / 198 notwithstanding (Withdrawn table).

---

## 1. The shells (R)

Ids from `0x1019c1c` (vt+0x158, variant 4; rom-map). Base = the vtable that matches (`vt2.py`: slot-by-slot against
every uShellEmBaseNN vtable, lengths derived from the next vtable start); setup = the global table's DTI.

| slot | id | class | vtable (slots) | setup | runs base | own slots | .shl EffectLists |
|---|---|---|---|---|---|---|---|
| `+0xcbac` | 0x150 | uShellEm081_sp_00 | `0x17ede90` (95) | base00 | **base00** 91/95 | `+0x14c` reader `0x1032d38`; `+0x150` landing `0x1032ed0`; ctor `0x1032d18` (base00's `0x3f8a04` + vtable) | [em081_04u] |
| `+0xcbb0` | 0x151 | uShellEm081_sp_01 | `0x17ee00c` (92) | base01 | **base01** 86/92 | `+0x13c` `0x1033e20`, `+0x14c` `0x1033eb0`, `+0x150` `0x10340c0`, `+0x154` `0x1034128`; factory `0x49f240` (base01 ctor, size 0x1660) | **[em081_04u, em081_00c]** |
| `+0xcbb4` | 0x152 | uShellEm081_04_01 (folder **shell01_02**) | `0x17ed8a8` (92) | base01 | **base01** 88/92 | `+0x14c` `0x10312ac`, `+0x150` `0x10314e8`; ctor `0x1031254` | [em081_04u] |
| `+0xcbb8` | 0x153 | uShellEm081_04_02 | `0x17eda18` | base02 | base02 | (beams lane; done) | [em081_04u] |
| `+0xcbbc` | 0x154 | uShellEm081_04_11 | `0x17edb94` (93) | base01 | **base11** 87/93 | `+0x14c` `0x1031978`, `+0x150` `0x1032120`, `+0x168` `0x1031f28`; factory `0x49f45c` | none (no EffectLists) |
| `+0xcbc0` | 0x155 | uShellEm081_sp_14 | `0x17ee17c` (93) | base00 | **base14** 91 (base00 89) | `+0x14c` `0x1034260`, `+0x150` `0x1034484` (bx lr); ctor `0x1034240` | [em081_04u] |
| `+0xcbc4` | 0x156 | uShellEm081_sp_15 | `0x17ee2f8` (94, `+0..+0x174`) | base03 | **base15** (base03 87) | `+0x13c` `0x10345a0`, `+0x14c` `0x1034638`, `+0x174` `0x10348b0` | [em081_04u] |
| `+0xcbc8` | 0x157 | uShellEm081_04_50 | `0x17edd08` (98) | **base50** | **base50** 93/98 | `+0x14c` `0x10323c4`, `+0x150` `0x10327c4`, `+0x174` `0x1032c10`; factory `0x49f4f4` (base50 ctor, size 0x16b0) | [em081_04u] |

The base family (R, vtable diffs): base03 / base14 / base15 / base50 all derive from base00 -- each replaces base00's
init `+0x13c` and state-1 move `+0x158` and keeps base00's dispatcher `+0x24` `0x3f96a0` (state 1 -> `+0x158`, 0xfe ->
`+0x15c` `0x3f986c`), end `+0x148` `0x3f9ef4` and collide `+0x168` `0x3f99e0`. base15 = base03 + init `0x40714c` (calls
base03's `0x3fd9d8`), `+0x150` `0x406f68` (bx lr), `+0x158` `0x4072f0`, new `+0x174` `0x407bf4`. base14 = base00 + init
`0x405e90`, `+0x150` `0x405d6c` (bx lr), `+0x158` `0x406704`. base50 = base00 + init `0x428078`, `+0x158` `0x4286b0`,
new `+0x174` `0x428828` (bx lr), `+0x178` `0x428660`, `+0x17c` `0x428688`; base50 KEEPS base00's landing `0x3f8878`.

**SHELL_DATA lists:** `{0: {list: 'u', pel: 'em081_04u'}, 1: {list: 'c', pel: 'em081_00c'}}` -- list 1 is named only by
shell01's .shl (c 30 / 31 / 32); every other folder names em081_04u alone (slot 0).

**The files' values** (`shldump2.py`; ShellScale per mode; `hit` = _hit### int 0; HDS records (delay, duration)):

- shell01 (`em081_04_01`, 35 entries): 0 / 1: scale 0.8, ef [[0,10],[999,-1]], ints [0, 9 / 13, -1 x7], vec0 (-300,0,-50) /
  (300,0,-50), hit 0. 5: 1.0, [[0,11]], [0, 9, ...], vec0 (-95,-85,105), hit 0. 11 / 12 / 13: 1.0, [[1,30]] / [[1,32]] /
  [[1,31]], ints [-1,-1,-1,0,-1,-1,-1,0,-1], vec0 (0,0,100) / 0 / 0, hit 4 / 5 / 6. 20: 0.9, [[0,10]], [0,138,...],
  vec0 (0,-50,100), hit 9. 29: 2.2, [[0,81]], ints all -1, hit 13. 30: 1.4, [[0,80]], all -1, hit 14. (2, 3, 4, 7, 8, 16,
  17, 21, 22, 26, 27, 34: no effect.) Floats: float0 = 0 (timer) except 26 (240) / 27 (310). hitdata (18): (0,6) (0,15)
  (0,15) (0,12) (0,10) (0,10) (0,10) (0,15) (0,15) (0,10) (60,10) (60,10) (0,15) (0,10) (0,15) (0,15) (0,440) (0,500).
- shell01_02 (`em081_04_01_02`, 9 entries): 0: 1.0, ef [[0,64],[0,63]], ints all -1, floats [3.0, 2.0, 0.5], hit 0.
  7 / 8: 0.75, [[0,73],[0,74]], floats [0.015, 1.5, 3.0] / [0.015, 1.5, 4.0], hit 1 / 2. hitdata (0,500) (0,999) (0,999).
- shell00 (`em081_04_00`, 24 entries): u 26 modes 0, 1, 6, 7, 17, 18, 19, 20, 22, 23 ef [[0,26],[999,-1]x3]; mode 13
  [[0,52],...] (no record). sh ints [3, -1] (int1 0 on 3, 4, 9, 10), floats [degX, degY, vz, flight, xLo, xHi]: 0 / 1 /
  17 / 18 [50,0,60,60,0,0]; 6 / 7 / 19 / 20 [45,0,60,200,0,0]; 22 / 23 [80,0,120,300,0,0] with vec0 (0,20,0); hit 0 / 2.
  **Its hitdata is not in its own folder**: the arc holds `em081_00_shell00\em081_00_00_hitdata` (3 records (0,300) (0,0)
  (0,300)), likewise shell14 / shell15 -- which hitdata a shell00 of his loads is NOT READ (it matters only to the hit
  life of a flight-0 shell; every u 26 mode has flight > 0).
- shell14, shell15, shell50, shell11: in §3, §2b, §4, §5.

---

## 2. Item 3 of 7b -- c 30 / 31 / 32: shell01 modes 11 / 12 / 13, the per-frame motion table (R)

### 2a. The driver

- **`0xae32c` runs every frame the monster moves (R).** uEm081_00's vtable `+0x28` = `0xc9e7c` = `b 0xae32c`. The unit
  line walker `0xc04728` calls, for each unit whose state `& 0x407 == 0x402`, vt `+0x24` (move), `+0x2c`, then `+0x28`
  (`0xc047fc..0xc04834`) -- every step. `0xae32c` tests byte `[[0x1831aec]+0x2a2c]` bit 1 (`0xae348`); **the same bit
  gates the enemy's move body** `0xad6f8` at `0xad73c` (positive control: the gate is shared, so whenever his move runs,
  this runs). Bit 1's only setter in a GOT-slot census of `+0x2a2c` (8 sites; the census's own readers `0xad730` /
  `0xae2bc` / `0xae33c` / `0xb8544` are its control) is `0x7234` (`orr #2`); `0x5a0c4` / `0x5a21c` clear the word in two
  inits. Its meaning ("gameplay running") is I. Then `0xae370`, then `0x6f4e8`: vt `+0x1a4` (`0x102f134`, camera shakes)
  and **vt `+0x1a8` = `0x102f44c`**.
- **`0x102f44c` (R)**: switch on the playing motion id `[e+0x4b4]`; each case is a frame gate `0xb09b0(e, F)` =
  `0x72714(e, mode 0, channel 1, 0, F)` -- "the motion crossed F this tick" (rom-map `0x7294c`) -- and on a hit vt
  `+0x1b0(e, sel, 0xff)`. Jump tables `0x102f4c8` (ids 0x101..0x114) and `0x102f540` (0x419..0x440), entries offsets
  from the table base; float literals `0x102f754..0x102f760` = 40, 88, 56, 72.
- **vt `+0x1b0` = `0x102f840(e, sel)` (R)**: sel 4 -> shell01 mode **11**, sel 3 -> **12**, sel 1 -> **13**, any other
  sel nothing. Request (`0x3fa2bc(0x40, 0x10)`): `+4` = `[e+0xcbb0]` (0x151), `+8` = mode, `+0xc` = e, `+0x10..` = block
  `+0x40..` (`[e+0x1428]`), `+0x20..` = the zero vector, `+0x30..` = block `+0x50 / +0x54 / +0x58` (the angle words),
  `+0x3c` = 0xffff; `0x48b884`. No variant, rank or state test.

**The table the viewer carries** (motion id = `list << 8 | index`; one shell per crossing):

| motion | frames | sel | shell01 mode | record |
|---|---|---|---|---|
| L0 M24, L0 M27, L0 M30 (0x18 / 0x1b / 0x1e) | 14 | 3 | 12 | c 32 |
| L1 M1 (0x101) | 8 | 4 | 11 | c 30 |
| L1 M2, L1 M11, L1 M12 (0x102 / 0x10b / 0x10c) | 10 | 4 | 11 | c 30 |
| L1 M15 (0x10f) | 15 | 4 | 11 | c 30 |
| L1 M17 (0x111) | 2 | 3 | 12 | c 32 |
| L1 M19, L1 M20 (0x113 / 0x114) | 4 | 3 | 12 | c 32 |
| L4 M25 (0x419) | 8, 24, 40, 56, 72, 88 | 3 | 12 | c 32 |
| L4 M26 (0x41a) | 88 | 3 | 12 | c 32 |
| L4 M27 (0x41b) | 14, 40 | 3 | 12 | c 32 |
| L4 M32 (0x420) | 4 | 1 | 13 | c 31 |
| L4 M34, L4 M64 (0x422 / 0x440) | 4 | 3 | 12 | c 32 |

This is the shape of Rathian's `dust` rows (shells.js `dust001`: "the per-frame handler's landing dust ... the same
frame pair the action code tests (0xb09b0)"), with two differences the transcription must carry: **several frames per
motion** (dust001 takes the first matching row -- give the row a `frames` list or match every row), and **no 900 test in
the spawner** -- Boltreaver's 900 test is the shell's own init (below), with the same effect (the shell is deleted
before it starts its effect).

### 2b. What the shell does (R)

- **Reader `0x1033eb0`** (over base01's ctor: flags `+0x15ec` 0, timer 0, `+0x15f4` = `+0x15f8` = 500, `+0x1604` = 900):
  ef 0 -> `+0x15c8`, ef 1 -> `+0x15d0`; hit 0 -> `+0x15d8`; flags by `bfc` / `orrne`: **bit 0 = int 0, 0x2 = int 2, 0x80 =
  int 3, 0x800 = int 4, 0x4 = int 5, 0x8 = int 6, 0x1000 = (int 7 == 0) [`orreq`], 0x20 = int 8** (each != -1);
  `+0x15e4` (joint) = int 1; `+0x1610` = int 7; `+0x15f0` (timer) = float 0; `+0x1608` = &vec 0, `+0x160c` = &vec 1.
  A new READERS01 entry (`0x1033eb0`); `efAt: {0x15c8: 0, 0x15cc: null, 0x15d0: 1}` (ef 1 is the 0x20 switch's only;
  no effect mode of his sets 0x20).
- **Modes 11 / 12 / 13: flags `0x80 | 0x1000`**, joint -1, timer 0, vec0 (0,0,100) on 11, zero on 12 / 13. base01's init
  `0x3fa498` with **0x80** (`0x3fa59c` -> `0x3fa740..0x3fa82c`; shells.js init011's 0x80 arm, already transcribed): x / z =
  the owner block's `+0x40` / `+0x48` plus `0xbec34`(size) x vec turned by the block's Y word `+0x54`; y = the block's
  ground `+0x5b4` + vec.y x size; **deleted** (`0x3fae84`) unless block `+0x44` - `+0x5b4` < `+0x1604` (900.0)
  (`0x3fa8b0..0x3fa8dc`). Words = the request's `+0x30..` (the owner's). The 0x80 arm skips the degree add, the ground
  snap and flag 8. Then ef 0 (c 30 / 32 / 31) starts at `+0x40` into `+0x1624` (`0x3fad08..`).
- **0x1000 is not visual (R)**: base01's init tests it once, `ldrb [+0x15ed]` / `tst #0x10` at `0x3fae20` -> byte `+0x15ac`
  = 0 (the second half of the hit registration, rom-map `0x43a8f0`); `+0x1610` -> `+0x15bc` (`0x3fae34`), the hit
  group. shells.js init011 has no 0x1000 test; none is needed.
- **Life (R, the existing convention)**: timer 0 -> move011's `T <= 0` arm: the shell lives while hit slot 0 is on --
  records 4 / 5 / 6 = (0, 10) -> about 12 moves -- then base01's end `0x3fb264`: graceful stop (flag 0) of `+0x1624`.
- **sp_01's own `+0x13c` `0x1033e20` / `+0x150` `0x10340c0` / `+0x154` `0x1034128` (R, nothing visual)**: after base01's
  init, and on every move, a shell01 of mode 26 / 27 (`mode & 0xfe == 0x1a`) writes its position to the owner (byte
  `e+0xb5fa` = 1, `e+0xb600..+0xb608` = shell `+0x40..`, `e+0xb60c` = 0); the end sets byte `+0x15c0` = 1 when the owner
  is active. Modes 26 / 27 carry no effect (shell50 6 / 7's second children, §4).

**Transcribe:** SHELL_DATA.em081_04.shells.shell01 (id 0x151, cls uShellEm081_sp_01, base01, reader 0x1033eb0, the files'
modes 0 / 1 / 5 / 11 / 12 / 13 / 20 / 29 / 30 + hitdata), the READERS01 entry, a `dust`-type table (`ids`, `frames`,
`mode`) driven from the enemy's per-frame `+0x28` like dust001, and the export of c 30 / 31 / 32 (em081_00c UNIQUE) as
`when: 'shell'`. NOT READ: nothing on this path; the meaning of `[e+0x4b4]`'s channel 1 (`+0x13ac` / `+0x13b4`) versus
channel 0 is the rom-map's open row -- the viewer's `pass001` already stands in for both.

---

## 3. Item 4 of 7b -- shell00 (u 26) and shell15 (u 25)

### 3a. shell00 = uShellEm081_sp_00 on base00 (R)

- **Reader `0x1032d38`**: ef 0..3 -> `+0x15c8 / +0x15cc / +0x15d0 / +0x15d4`; hit 0 -> `+0x15d8`; int 0 -> joint `+0x15dc`;
  flags `+0x15e8` (base00's ctor 0): `bic #0x45`, **bit 0 = int 1 != -1**, then **`| 0x44` always**; floats 0..5 ->
  **degX `+0x15ec`, degY `+0x15f0`, vz `+0x15f4`, flight `+0x15fc`, X lo `+0x1600`, X hi `+0x1604`**; `+0x15f8` (vy) is
  not written (ctor 0); vec 0 -> `+0x1610` (the offset), **vec 1 -> `+0x1618`** (the aim arms' offset), `+0x161c` (gravity)
  not written (the shared zero vector).
- **u 26 modes: flags 0x44**, joint 3, offset vec0 (0 / (0,20,0) on 22, 23), gravity 0, vy 0. base00's init (shells.js
  init00, existing): 0x20 clear -> words = the owner's X / Y, Z 0, then X += degX (bit 0 clear, `0x3f9378`), Y += degY
  (0, bit 1 clear, `0x3f9cc4`); 0x10 clear -> joint 3's matrix, offset through its 3x3 (bit 3 clear); velocity =
  launchVelocity(0, vz, words); **0x40: the move keeps the words** (`0x3f9940`). **Bit 0x4 is tested only inside the
  bit-0 / bit-1 aim arms** (`0x3f93e4`, `0x3f9d30`: census of base00's band `0x3f8700..0x3fa2c0`, the other eight flag
  tests its control), so it changes nothing here. ef 0 = u 26 starts at the init; flight = float 3 (60 / 200 / 300).
  Modes 3 / 4 / 9 / 10 (int 1 = 0, no effect) take xAdjust37's aim with the target.
- **Landing `+0x150` = `0x1032ed0(shell, &point, result, type)` (R)** -- called by base00's collide `0x3f99e0` on a stage
  contact (`0x3f9ad4`), the move's only caller: byte `+0x15c0` = 1; **position = the contact**; type 0 -> ef `+0x15cc`
  and `0x1033a90`; type 1 (the floor) -> ef `+0x15d0` and **`0x1032f74`** (the children); type 2 -> ef `+0x15d4` and
  `0x1033a90`; then `0x3f8970(shell, ef, point)` (u 26 modes: (999, -1) -- nothing) and vt `+0x148(0)` (the end: u 26
  stopped gracefully).
- **`0x1032f74` (R emulated, owner active `0x4a0f38`), table `0x1032fb8` on the shell's own mode 0..0x17** -- shell15
  requests (`0x3fd7e0(0x50)`: id `[e+0xcbc4]`, mode, owner = the enemy, `+0x10..` = the contact point, `+0x20..` = the
  shell00's words `+0xfe8..`, `+0x2e` = shell halfword `+0x13dc`, `+0x30..` zero, bytes `+0x2c` / `+0x40` 0) then a shell01
  (no effect) with the same point and words at `+0x30`, `+0x3c` = `+0x13dc`:

| shell00 mode | shell15 modes (u 25) | shell01 (no ef) |
|---|---|---|
| 0, 6 | 0 | 2 |
| 1, 7 | 1, 2 | 3 |
| 2, 8 | 3 | 4 |
| 3, 4, 5, 9, 10, 11 | -- | 2 / 3 / 4 |
| 13 | 13, 14 (u 50: no record) | -- |
| 17, 19 | 9, 10 | 3 |
| 18, 20 | 11, 12 | 3 |
| 22 | 20, 21 | 3 |
| 23 | 22, 23 | 3 |
| 12, 14, 15, 16, 21 | -- | -- |

  `0x1033a90` (types 0 / 2): shell01 2 / 3 / 4 only (masks 0xde0492 / 0x249 / 0x924) -- nothing visible.
- **Transcribe:** SHELL_DATA shell00 (id 0x150, uShellEm081_sp_00, base00, reader 0x1032d38; modes 0..23 that exist) +
  a READER00 entry `params081s00` (the map above), a LANDING entry for `0x1032ed0` (the child table above; the contact
  point as position), and the spawns of §7. NOT READ: which hitdata his shell00 loads (above).

### 3b. shell15 = uShellEm081_sp_15 on base15

Read by the helper agent (bolt15: static, then unicorn -- the move bit-exact against a Python model of this text over
1,635 steps in six scenarios, the whole ctor + init chain on every shl mode with and without a floor, and checkpoints
`checkpoints.out` for the transcriber). Re-checked against my own vtable diff and child emulation.

- **Vtable**: base15's own slots end at `+0x174` (94; base15's DTI vtable `0x174f8bc` = base15 + 0x180, from the static
  init `0x407bf8`) -- "+0x184 / +0x188" in a naive diff are the DTI class's slots. **`+0x174` is a virtual base15
  introduces** (base03 ends at `+0x170`): base15's `0x407bf4` is `bx lr`, sp_15 overrides it with `0x10348b0`.
- **ctors**: sp_15 `0x1034580` -> base15 `0x406f6c` -> base03 `0x3fd830` -> base00 `0x3f8a04`. base15 adds `+0x1700 / +0x1704`
  = -1, `+0x1708..+0x171c` = 0, `+0x1720..` the zero vector, `+0x172c..+0x1744` 0 (`+0x173c` the RNG, `+0x1740` its counter,
  `+0x1744` the pause timer), the word triples `+0x1748..` / `+0x1754..` = 0, `+0x15a8` 0xf. base03: `+0x1660..+0x1670` 0,
  `+0x1674 / +0x1678` 500, `+0x167c / +0x1680` 250 (the reader writes 500 / 500).
- **reader `0x1034638`**: ef 0 -> `+0x15c8`, ef 2 -> `+0x15cc`, ef 1 -> `+0x15d4`; hit 0 -> `+0x15d8`; int 0 -> joint (-1);
  flags `+0x15e8` = **0xc8 | 0x10 (int 1) | 0x20 (int 2)** = 0xf8 on his modes; float 0 fan `+0x15f0`, 1 speed `+0x15f4`,
  2 life `+0x15fc`; vec 0 -> `+0x161c` (gravity: dead, below), vec 1 -> `+0x1610` (offset); floats 9 / 10 -> `+0x167c /
  +0x1680`; `+0x1664 |= 1`; int 4 every `+0x1700`, int 3 side `+0x1704`; floats 4 hi `+0x1708`, 3 lo `+0x170c`, 5 A
  `+0x1710`, 7 f7 `+0x1718`, 8 pause `+0x171c`, 6 acc `+0x1714`.
- **init** (sp_15 `0x10345a0` -> base15 `0x40714c` -> base03 `0x3fd9d8` -> base00 `0x3f8b80`):
  - base00 (shells.js init00's 0x10 arm + bit3Offset00, no new arm): 0x20 -> words = the request's `+0x20..` (shell00's
    words), X += 0, **Y += fan** (`0x3f9cc4`, bit 1 clear); 0x10 -> base = the request's point (the contact); bit 3 ->
    offset = rotXYZ(vec 1, the post-offset words); 0x80 -> x the owner's size. timer `+0x162c` = life. **u 25 (ef 0)
    starts here, at this pre-snap point** (handle `+0x1624`). Flag 0x40 is tested only in base00's move (replaced).
  - base03: ground query mask 0x10 from y - 500 to y + 500; a hit -> y = the hit's; **a miss -> vt `+0x148(1)`: u 25
    stopped with flag 1 and the shell deleted at birth** (the viewer refuses: no floor within 500). Velocity =
    launchVelocity(0, speed, [0, Y, Z]) (the X word dropped). `+0x1664` bit 0 only picks base03's climb path inside
    base03's move -- **which base15 replaces, so it has no effect** (no `+0x1664` reference in base15's band
    `0x406f6c..0x407bf8`; control: the reader and base03's band).
  - base15: `+0x174c` = the owner block's Y word `+0x54` (`+0x1748` / `+0x1750` 0); track `+0x1720..` = the snapped point;
    vlat `+0x1738` = A, negated when int 3 != -1; RNG `0x7ac4a0` / seed `0x7c91a0`(u16(owner `+0x73e8`) + 0x12345678 when
    int 3 != -1); drawAmplitude; sub byte `+5` = 1. **For every mode of his lo == hi**, so the RNG never changes a value
    (the counter rule stays).
  - sp_15: modes 20..23 byte `+0x13e3` = 0x50 / 0xb0 / 0x30 / 0xd0 (hit slot 0 `+0x3b`: not visual, I).
- **state-1 move `0x4072f0..0x407bd4`** (via `0x3f96a0`; sub-state byte `+5`). Pseudo-code (`f` = fround, `mla(a,b,c)`
  = f(a + f(b c)), `mls` = f(a - f(b c)); U2R 9.58738e-05, R2U 10430.378, EPS 2^-23):

```
move15(S, dt):
  sgn = S.vlat > 0 ? 1 : -1
  if S.sub == 1:                                   // a corner: pause, then turn
    S.anchor = [p.x, p.y + 1.0, p.z]
    if S.delay > 0 { t = f(S.delay - dt); S.delay = (0 >= t) ? 0 : t; if (t > 0) goto PLACE } else S.delay = 0
    S.sub = 0
    // TURN: v = (-(sgn*A), 0, speed) turned Z, X, Y by the shell's words (launchVelocity's order)
    hY = u16(s32(mla(0.5, atan2f(x3, z3), R2U))); hX = u16(s32(mla(0.5, atan2f(-y2, sqrtf(mla(f(z3*z3), x3, x3))), R2U)))
    +0x1754 = hX; +0x1758 = hY; words[0] = hX; words[1] = hY        // Z word untouched
    S.velocity = (|v| < EPS ? v : v / |v|) * speed
    S.vlat = f(A * -sgn); if (rng) drawAmplitude()
    goto PLACE
  else if S.sub == 0:
    S.anchor = S.position
    track[i] = mla(track[i], dt, v[i])
    off = mla(off, vlat, dt)
    if speed == 0: return                          // no place, no timer (no mode of his)
    r = f(A / speed)
    vlat = mla(vlat, sgn, f(f(sinf(atanf(r)) * acc) * dt))
    a = (|v| < EPS ? v : v / |v|) * f(cosf(atanf(r)) * acc)        // written to +0x1020 as scratch
    v = [mla(vx, dt, ax), mla(vy, dt, ay), mla(vz, az, dt)]
    if f(sgn * off) > half:
      off = f(sgn * half)
      if pause > 0: S.delay = pause; vt+0x174(S); S.sub = 1          // the child, before PLACE
      else: vlat = f(-vlat); if (rng) drawAmplitude()
  PLACE:
    pos = track + rotXYZ([off, 0, 0], [0, ownerY (+0x174c), 0]); track.y = pos.y
  owner inactive -> end(0)
  timer +0x162c (0x3f9814): !(T > 0) -> end; t = T - dt; T = max(0, t); t <= 0 -> end(0)
  0x3fec78(S) == 1 -> end(0)                       // map byte +0x1053 == 9 and area 1 only: never in the viewer
drawAmplitude(): count += 1
  amp = (every >= 1 && count % every == 0) ? (f7 > 0 ? f7 : hi) : mla(lo, f(hi - lo), f(rngU32 * 2^-32))
  half = f(amp * 0.5)
```

  A zigzag: the track runs straight along the launch heading; the lateral offset (along the axis turned by the
  **owner's** Y word) accelerates to +-half, and at each corner the shell pauses `pause` frames, turns and (sp_15)
  makes a child. No stage follow and no collision in the move. **No effect call in the move**: u 25 rides the shell
  from the init to the end.
- **sp_15 `+0x174` = `0x10348b0`** (emulated, modes 0..25; table `0x10348e0`): own mode 0 -> child **6**; 1 / 2 -> **7**;
  9 / 11 -> 17; 10 / 12 -> 18; others none. Request `0x3fd7e0(0x50)`: id `[e+0xcbc4]`, owner the enemy, `+0x10..` = the
  shell's `+0x40` as of the previous frame, `+0x20..` = `+0x1754 / +0x1758 / +0x175c` (the finished leg's heading), `+0x2e`
  = `+0x13dc`. **Reached only with pause > 0**: modes 0 -> 6 and 1 / 2 -> 7 at every corner; 9..12 never pause (no
  children); 13 / 14 pause with no table entry. Children 6 / 7 have A = 0 and a 30-frame straight life (u 25 again).
- **end / ending**: base00's `0x3f9ef4` / `0x3f986c` (shells.js `end` / stepRock's ending): u 25 stopped gracefully,
  the shell waits for it (ENDING_FRAMES).

| mode | fan | speed | life | lo / hi | A | acc | f7 | pause | every | int 3 | vec 1 | children |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 3 | 300 | 1200 / 1200 | 5 | 1.5 | 0 | 50 | -1 | -1 | 0 | 6 at each corner |
| 1 / 2 | 0 | 4 | 292 | 1400 / 1400 | 5 | 1.0 | 1400 | 60 | 3 | -1 / 0 | 0 | 7 |
| 3 | 0 | 20 | 45 | 0 / 0 | 0 | 0 | 0 | 0 | -1 | -1 | 0 | none; straight |
| 6 / 7 / 17 / 18 | 0 | 40 | 30 | 0 / 0 | 0 | 0 | 0 | 0 | -1 | -1 | 0 | none; straight |
| 9 / 10 / 11 / 12 | +-30 / +-22 | 20 | 300 | 0 / 0 | 15 | 0.5 | 0 | 0 | 0 | 0, -1, 0, -1 | (+-300, 0, 30) | none |
| 13 / 14 | 0 | 3 | 500 / 300 | 1200 / 1200 | 2 / 5 | 1.5 | 0 / 10 | 80 / 100 | -1 | -1 | 0 | none (u 50: no record) |
| 20 / 21 / 22 / 23 | +-23 | 0.8 / 1.0 / 20 / 20 | 300 | 0 / 0 | 15 | 10 / 10 / 0.5 / 0.5 | 0 | 0 | 0 | -1, 0, -1, 0 | (+-160, 0, 0) | none |

  ShellScale: 0 / 1 / 2 / 6 / 7 / 17 / 18 2.0; 3 1.0; 9..12 / 20..23 1.5; 13 / 14 3.0. Checkpoint (mode 0, owner Y 0,
  words 0, floor 0, dt 1): move 0 turn (word 0xd606, vlat -5); move 28 corner at (-600, 0, 375.72), |v| 24.609, child 6;
  move 78 turn (0x29fb); move 118 corner at (600, 0, 1097.68); move 299 the end.
- **Transcribe:** a new base `base15` (the init chain on top of init00 + base03's ground query, the move above, the
  child at `+0x174`), SHELL_DATA shell15 (id 0x156, uShellEm081_sp_15, reader 0x1034638, modes above), and shell00's
  landing children (§3a). NOT READ: the stage core (`0xc30b30`; the plane stand-in); `0x43a850` / `0x4a100c` (the init
  gates); the hit side (`+0x13e3`, `+0x15a8`); `0x3fec78`'s map 9; `+0x73e8` at runtime (irrelevant to his modes); whether
  u 25 reads the shell's position and words each frame (I, as base03 -- the shell never places it).

---

## 4. Item 6 of 7b -- base50 (shell50: u 60 / u 70) and its children shell01_02 (u 63 / 64 / 73 / 74) (R)

### 4a. base50, read in full

- **ctor `0x427c3c`** (from 04_50's factory `0x49f4f4`, size 0x16b0; 04_50 adds nothing): base00's ctor `0x3f8a04`, then
  `+0x1660` = -1, `+0x1664` = 0, `+0x1668` = 1.0, `+0x166c` = 20.0, `+0x1670` = 10.0, `+0x1674..+0x169b` cleared,
  `+0x16a0..+0x16a8` = the zero vector, `+0x16ac` = 0, velocity `+0x1010..` and gravity `+0x1020..` = 0, `+0x15a8` = 0x32.
  Setup class (`0x427b5c..`, 0x40 bytes): `+4` 0x19d, `+0x10` / `+0x20` zero vectors, `+0x2e` 0xffff, **`+0x30` = -1.0**.
- **04_50's reader `0x10323c4`** (over that ctor): ef 0..3 -> `+0x15c8 / +0x15cc / +0x15d0 / +0x15d4`; hit 0 -> `+0x15d8`;
  int 0 -> joint `+0x15dc`; flags `+0x15e8`: **bit 0 = int 2, 0x2 = int 3, 0x4 = int 4, 0x200 = int 5, 0x8 = int 6, 0x80 =
  int 7, 0x800 = int 8, 0x20 = int 9** (bits 5 / 6 cleared first), **`| 0x40` always**; `+0x15e4` = int 10; **`+0x1660` =
  int 1** (the motion type); floats: 0 degX `+0x15ec`, 1 degY `+0x15f0`, 2 / 3 X clamp `+0x1600 / +0x1604`, 4 / 5 Y clamp
  `+0x1608 / +0x160c`, 6 `+0x1664` (scale from), 7 `+0x1668` (scale to), 9 `+0x166c` (distance), 8 `+0x1670` (time), 10
  `+0x1674`, 11 `+0x1678` (extra time), 13 / 14 / 15 `+0x167c / +0x1680 / +0x1684` (speeds), float 12 unread; vecs 0 / 1 / 2
  -> `+0x1610 / +0x1614 / +0x1618`; byte `+0x15c1` = 1. vz `+0x15f4`, vy `+0x15f8` and flight `+0x15fc` are not written
  (ctor 0).
- **init `0x428078`**: base00's init `0x3f8b80` (placement and ef 0 -- below); 0 -> vt `+0x40`, return 0. Then by `+0x1660`:
  **0** -> `+0x168c` = `+0x167c` (v0), `+0x1694` = `+0x1684` (v2), `+0x1690` = `+0x1680` (v1); **-1** -> q = `+0x166c` /
  `+0x1670`, `+0x168c` = q - `+0x1674` x q, `+0x1694` = q + `+0x1674` x q; other -> `+0x168c` kept (0). Start point
  `+0x16a0..` = `+0x40..`, `+0x16ac` = 0; velocity = `0x3f95a4(shell, &words, vz = +0x168c, vy = +0x15f8)` -- (0, vy, vz)
  turned Z, X, Y by the words, **term for term shells.js `launchVelocity`** (compared at `0x3f95f8..0x3f968c`); state 1.
- **state-1 move `0x4286b0`** (via base00's dispatcher `0x3f96a0`): `0x539d48(shell, &+0x1688, 1 / [[0x211f764]+0x38])`
  -- **the clock `+0x1688` += dt (`+0x1c`) / `[[0x211f764]+0x38]`**; anchor `+0x1000..` = `+0x40..`; then by `+0x1660`:
  0 -> `0x4283b8`, -1 -> `0x4281a8`, other -> nothing. Then **`+0x1688` > `+0x1670` + `+0x1678`** -> vt `+0x174` and the end
  (vt `+0x148(0)`); else owner active and a hit-slot byte (`+0x13ad` / `+0x1465`) set -> vt `+0x168` = base00's collide
  `0x3f99e0` (stage query, a hit -> vt `+0x150`); else the end.
- **`0x4283b8` (type 0, the u 60 modes)**: t = min(tau / T, 1) (tau = `+0x1688`, T = `+0x1670`); distance d: t < 0.5 ->
  v = v0 + 2t (v1 - v0) (`+0x1698` = v), d = tau (v0 + v) / 2; tau / T < 1 -> v = v1 + 2 (t - 0.5)(v2 - v1), d = (v + v1)
  (tau - T / 2) / 2 + T (v0 + v1) / 4; else d = T (v0 + 2 v1 + v2) / 4. **Position = `+0x16a0` + rotXYZ((0, 0, d), words)**
  -- the unit Z of `0x1917700` (below) scaled by d and turned X, Y, Z (`0x4284f0..0x428604`: shells.js `rotXYZ` term for
  term); `+0x4c` = 0. **Scale**: s = vt `+0x178` = `0x428660` = `+0x1664` + (`+0x1668` - `+0x1664`) x t, times the owner's
  size when byte `+0x15e9` bit 2 (flag 0x400 -- his reader cannot set it); **`0x43ab74(shell, s)`** writes the unit's
  `+0x60..+0x68` (the effects' parent scale) and the hit sizes.
- **`0x4281a8` (type -1, the u 70 modes)**: t as above; tau < T -> v = vt `+0x17c` = `0x428688` = v0 + (v2 - v0) t,
  `+0x1698` = v, d = (v + v0) tau / 2; else d = T (v0 + v2) / 2; position and scale as type 0. With his values the
  distance travelled is exactly float 9 (v0 = 2q, v2 = 0: 1500 for mode 6, 1300 for mode 7) -- an internal check of the
  read.
- **The clock's divisor `[[0x211f764]+0x38]` is NOT READ** (the object whose `+0x68` is the frame step, rom-map row
  `0x3fb3a4`; no store to its `+0x38` in a GOT-slot census of 96 sites; `0x3f7748`'s `+0x38` is another object's).
  INFERRED: frames per second, so `+0x1670` is in seconds (1.3 s for most u 60 modes). shell01_02 divides by the same
  field (below), so one stand-in serves both; name it.
- **`+0x174` (base50 `0x428828` bx lr; 04_50's `0x1032c10`)**: byte `+0x15c0` = 1, the children `0x1032858`,
  `0x43ac04(shell, +0x15e4)` (u 60 modes: -1, returns at once; u 70: 9 -- the hit-side call, rom-map `0x43ac04`).
- **`+0x150` (04_50's `0x10327c4`, a stage contact while a hit slot is on)**: type 0 -> ef `+0x15cc`; type 1 -> ef
  `+0x15d0` (both (999, -1) on his modes) at the point, byte `+0x15c0` = 1, the children, `0x43ac04(+0x15e4)`, the end;
  **type 2 -> ef `+0x15d4` only (no children, no end)**; other types: `0x3f8970` with 0.
- **The end** = base00's `0x3f9ef4` (graceful stop of `+0x1624` = u 60 / u 70, state 0xfe, `+0x162c` = ENDING_FRAMES) and
  base00's ending `0x3f986c` (deleted when `+0x1624` and `+0x1628` are gone) -- shells.js `end` / stepRock's ending.
- **base00's init with 04_50's flags** (shells.js init00, existing): 0x40 always (the words are never re-aimed: base50's
  move does not call `0x3f9940` anyway); **0x800** (int 8 = 0 on every mode) -> byte `+0x15ac` = 0 (hit, not visual); 0x10 /
  0x20 clear -> joint `+0x15dc` (3 for u 60, 0 for u 70) and the owner's words + degX / degY; bit 0 / bit 1 -> the X / Y
  aim at the target (xAdjust37 / yAdjust37, clamps floats 2..5), bit 2 = aim from the launch point p.

| mode | ef | scale | joint | flags | +0x1660 | degX | X clamp | Y clamp | from -> to scale | T + extra | speeds / distance | vec0 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | u 60 | 1.5 | 3 | 0x847 | 0 | 0 | -40..5 | -5..5 | 4.0 -> 0.1 | 1.3 + 0 | 100, 1000, 20000 | (0,-150,200) |
| 1 | u 60 | 1.5 | 3 | 0x840 | 0 | 9.5 | -- | -- | 4.0 -> 0.1 | 1.3 | same | (0,-130,280) |
| 3 | u 60 | 1.5 | 3 | 0x847 | 0 | 5 | -5..5 | -5..5 | 2.6 -> 0.1 | 1.3 | same | (0,-100,230) |
| 5 | u 60 | 1.5 | 3 | 0x840 | 0 | 3 | -- | -- | 2.6 -> 0.1 | 1.3 | same | (0,0,230) |
| 6 | u 70 | 1.0 | 0 | 0x840 | -1 | 25 | -- | -- | 8.0 -> 0.05 | 1.8 + 0.1 | distance 1500, `+0x1674` -1 | (0,-500,250) |
| 7 | u 70 | 1.0 | 0 | 0x840 | -1 | 20 | -- | -- | 8.0 -> 0.05 | 2.0 + 0 | distance 1300 | (0,-620,-200) |
| 8 | u 60 | 1.5 | 3 | 0x845 | 0 | 0 | -5..5 | (Y += 0) | 4.0 -> 0.1 | 1.3 | same | (0,-150,200) |
| 9 | u 60 | 1.5 | 3 | 0x841 | 0 | 9.5 | -100..50 | (Y += 0) | 4.0 -> 0.1 | 1.3 | same | (0,-110,100) |
| 11 / 12 / 13 | u 60 | 1.0 | 3 | 0x844 | 0 | 5 / 4 / 6 | -- | -- | 3.5 -> 0.1 | 1.3 | same | (0,-120,70) / (0,-150,120) / (0,-150,0) |

  (degY: 0 except 11 = 40, 13 = -40.) hitdata: (0, 999) x 3 -- the hit slot stays on for the shell's life.
- **The unit vectors (R)**: `0x1917700` = (0, 0, 1, 0) -- the static initializer `0x7c4408` (r4 = 0, r5 = 1.0) writes the
  engine's constant block at `0x7c46bc..0x7c4858`: `0x19176b0` zero, `0x19176c0` (1,1,1), `0x19176d0` (-1,-1,-1),
  `0x19176e0` unit X, `0x19176f0` unit Y, `0x1917700` unit Z, `0x1917710` / `0x1917720` -FLT_MAX / FLT_MAX, `0x1917730`
  FLT_EPSILON, ..., **`0x19177b0` the IDENTITY 4x4** (`0x7c4810..0x7c4850`). 0x7c4408 sits in the code-pointer table at
  `.data 0x1842db4` (an init array: I).

### 4b. The children: shell01_02 = uShellEm081_04_01 on base01 (R)

- **`0x1032858` (R emulated)**: shell50 mode in mask **0x3b2b** (0, 1, 3, 5, 8, 9, 11, 12, 13) -> shell01_02 **mode 0**;
  **mode 6 -> shell01_02 8 + shell01 27; mode 7 -> shell01_02 7 + shell01 26** (census swapped); others nothing.
  Requests (`0x3fa2bc(0x40)`): id `[e+0xcbb4]` (0x152) / `[e+0xcbb0]`, owner the enemy, `+0x10..` = shell50's position,
  `+0x20` zero, `+0x30..` = shell50's words, `+0x3c` = 0xffff. Made at shell50's time-out (+0x174) or floor / wall contact.
- **ctor `0x1031254`**: base01's `0x3fa2f8`, then `+0x1654` = `+0x1658` = `+0x165c` = -1.0, `+0x1660` = `+0x1664` = 0.
- **reader `0x10312ac`**: **ef 0 -> `+0x15c8`, ef 1 -> `+0x15d4`** (the END's request, not `+0x15cc`); hit 0 -> `+0x15d8`;
  flags: bit 0 int 0, `+0x15e4` int 1, 0x2 int 2, 0x80 int 3, 0x800 int 4, 0x4 int 5, 0x8 int 6, 0x1000 int 7, 0x20 int 8,
  then **`| 0x100`**; vec 0 / 1 -> `+0x1608 / +0x160c`; floats 0 / 1 / 2 -> **rate `+0x1654`, size `+0x1658`, hold
  `+0x165c`**. Timer `+0x15f0` not written (0). His modes: ints all -1 -> flags **0x100**.
- **init** = base01's (no override): flags bit 0 clear -> position = the setup point + size x rotXYZ(zero vec) = shell50's
  position; words = shell50's; ef 0 (u 64 on mode 0, u 73 on 7 / 8) at `+0x40` -> `+0x1624`.
- **`+0x150` `0x10314e8`, every move (base01's move calls it, shells.js move011)**: while rate and size are non-zero and
  `+0x1660` < 1: `+0x1660` += dt x rate (stored unclamped), **`0x43ab74(shell, size x min(+0x1660, 1))`** -- the unit
  scale grows linearly to `size` (mode 0: 2.0 at once, rate 3 per frame; 7 / 8: to 1.5 over about 67 frames); after
  that: `+0x1664` += `[[0x211f764]+0x68]` / `[[0x211f764]+0x38]` (the same NOT READ divisor) until it reaches `hold`
  (0.5 / 3.0 / 4.0), then vt `+0x148(0)` (the end).
- **base01's end `0x3fb264`** (R; shells.js end011's comment "+0x15d4 ... is never set by these readers" is no longer
  true for this class): graceful stops of `+0x1624 / +0x1628 / +0x162c`, the hit side, vt `+0x154` (bx lr), state 0xfe,
  `+0x1618` = 0, and **with `+0x15d4` set: ef 1 (u 63 on mode 0, u 74 on 7 / 8) starts at `+0x40` into `+0x1630`**
  (`0x3fb2fc..0x3fb36c`). The ending waits for all four handles (rom-map `0x3fafd0`).
- Life otherwise: timer 0 -> alive while hit slot 0 is on (0, 500) / (0, 999) -- longer than the hold, so the hold
  ends it. Flag 0x100: base01's move re-arms the slots when both are idle (move011, existing).

**Transcribe:** a new base `base50` (init, move with the two motion types, the clock, the scale via `unitScale`, the
time-out / contact children, base00's end and ending), SHELL_DATA shell50 (id 0x157, uShellEm081_04_50, reader
0x10323c4, the table above), shell01_02 (id 0x152, uShellEm081_04_01, base01, reader 0x10312ac) with its `+0x150`
growth / hold and the end's ef 1 start (a new end011 arm for `+0x15d4` -> `effect4` / `+0x1630`). NOT READ, by name:
**`[[0x211f764]+0x38]`** (the clock divisor); whether the effects read the parent's `+0x60` every frame (the viewer's
`unitScale` convention, Ukanlos's children, says yes); what `0x43ac04(+0x15e4 = 9)` does for u 70 (hit side, I).

---

## 5. Item 5 of 7b -- shell01 u 10 / u 11 and shell14 u 40 / u 41

### 5a. shell01 modes 0 / 1 / 5 / 20 (R; base01, reader of §2b)

- Modes 0 / 1 / 5 / 20: **flags 1** (int 0 = 0), joint int 1 = **9 / 13 / 9 / 138**, timer 0, no 0x80 / 0x4 / 0x20: base01's
  init joint arm with bit 2 clear -> `launchPoint(M_joint, vec0)` (the vec through the joint's 3x3 + row 3; shells.js
  init011, existing); words = the request's `+0x30..` (the owner's block words, below). ef 0 = u 10 (0, 1, 20) / u 11 (5).
  Life: hit record 0 = (0, 6) on 0 / 1 / 5, record 9 = (0, 10) on 20.
- Spawners (R; requests `0x3fa2bc(0x40)`: id `[e+0xcbb0]`, owner e, `+0x10..` = block `+0x40..`, `+0x20` zero, `+0x30..` =
  block `+0x50 / +0x54 / +0x58`, `+0x3c` = block halfword `+0xb0a`): **`0x10306cc`** (mode 0: action number - 0x3a in mask
  0x5541, or 0x8e; gate `0xb0974(e, 72.0)`; mode 0x10 for (7, 0xc2) at f27 / f84, no effect), **`0x10308f8`** (mode 1 the
  same, mask 0x7541 / 0x90; mode 0x11 for 0xc2), **`0x102fdd8(e, 5)`** (mode 5), **`0x102fa88(e, 1)`** (mode 0x14 = 20 then
  shell14).
- **The wing tier gate (R)**: the wing-slam bodies `0x1025ce4` / `0x1026304` / `0x10266d4` call them only when
  **`([e+0xcb02] | 1) != 1`** -- wings at tier 2 or 4 (`0x1025eb8..0x1025ecc`, the same at `0x102645c` / `0x1026764`),
  `r5` (the stub's r1) choosing `0x10306cc` (0) or `0x10308f8` (1). (7, 0x8e) / (7, 0x90) (bodies `0x102cde0` / `0x102d028`)
  call them every tick without a tier test; their partners (7, 0x8d) / (7, 0x8f) run the same bodies but the spawners'
  number masks exclude them.
- **u 11's landing gate (R / I)**: `0x1026acc` (7, 0x75 / 0x77 / 0xbe / 0xc0: r1 = 1 / 2 / 1 / 2) and `0x10285d4` (0xbf)
  play L2 M49, wait in phase 1 for `0x78b78(e, 0, 0) == 1` (a ground / landing test reading block `+0x5e98..+0x5ea0`: I),
  then set **L2 M42** and, with r1 == 2, make shell01 5 at **L2 M42 f32**. Emulated with that test forced true.

### 5b. shell14 = uShellEm081_sp_14 on base14 (R; helper agent bolt14, static + emulated, re-checked against my vtable diff)

- **ctor**: `0x1034240` -> base14 `0x405d70` -> base00 `0x3f8a04`. base14 adds: `+0x1660 / +0x1664 / +0x1668` (ef) 0;
  `+0x166c` = `+0x1670` = -1; `+0x1674 / +0x1678 / +0x167c / +0x1684` 0; `+0x1680` 100.0, `+0x1688` 200.0, `+0x168c` -200.0;
  byte `+0x16a8` 0; `+0x1690..+0x16a4` 0; `+0x16b0..` the zero vector, `+0x16bc` 0; `+0x15a8` 14.
- **reader `0x1034260`**: hit 0 -> `+0x15d8`; int 0 -> joint `+0x15dc` (138); flags `+0x15e8` **0x100 iff int 3 != -1**
  (its only flag); floats 0 / 1 / 2 -> degX `+0x15ec` (-4) / degY `+0x15f0` (180) / speed `+0x15f4` (80); vec 0 -> `+0x1610`;
  **ef 0 -> `+0x1660`, ef 1 -> `+0x1668` (u 40), ef 2 -> `+0x1664` (u 41)**; int 1 -> `+0x166c` (-1), int 2 -> `+0x1670`;
  floats 3 delay `+0x1674` (20), 4 travel end `+0x1678` (90; 50 on 5 / 11), 5 `+0x167c` (20), 6 tail `+0x1684` (0), 9
  length unit `+0x1680` (500), 7 / 8 the query reach `+0x1688` / `+0x168c` (700 / -700), 10 lift `+0x1690` (30).
- **init `0x405e90`**: owner precondition `0x43a850`; the reader; P = joint 138's position (`0xc164c`); with 0x100: offset =
  vec0 turned Z, X, Y by the owner's block words (vec0 is zero on his modes); velocity (0, 0, speed) turned X by
  u16(degX x 182.04445), then Y by u16(degY x ...); words = block `+0x50..`; **ground query `0x183490`(mask 0x10) from P +
  (-700, -700, -700) to P + (700, 700, 700)** -- the same scalar on all three axes -- y = the contact's (the return is not
  tested: on a miss the ROM reads stack garbage; the viewer refuses by name); words = groundAngles(words, normal);
  position += (0, lift 30, 0) turned Z, X, Y by the words; velocity turned Z, X, Y by the words; X / Y words from the
  velocity (atan2); anchor = position; life `+0x162c` = f4 + f5 + f6 (110 on 4 / 10, 70 on 5 / 11); **u 41 (ef 2) starts
  at the position** (handle `+0x16a4`); delay `+0x1698` = 20.
- **move `0x406704`** (state 1 via `0x3f96a0`): elapsed `+0x1694` += dt; owner inactive or life out -> the end; elapsed >=
  f4 -> done; not done and delay 0 -> position += dt x velocity (the head runs at 80 per frame); before the delay
  nothing more. **On the move where elapsed reaches the delay (20)**: u 40 (ef 1) starts at the position with a rotation
  override (`req+0x14 |= 0x40000002`, `+0x30..` = (X word, Y word) in degrees) and **`req+0x40` = (1.5, 1.5)** (over the
  ShellScale), u 41 is stopped gracefully (`0x329c40(h, 0)`), delay = 0, vt `+0x164` (hit). Every later move, for each
  unit of u 40's request: `u+0x40..` = the ANCHOR (the start), angles via `0x8a4dfc` (X, Y words in radians), and while
  not done **`u+0x68` = |position - anchor| / 500** (a z scale: the bolt stretched from its start to the head; frozen at
  `done`). The end (`0x3f9ef4`) stops only `+0x1624` (0 here) -- **u 40 is never stopped by the shell**; the shell is
  deleted on the next move.
- **What the viewer needs beyond the existing hosts**: write each unit's position / rotation / z scale directly (host.js
  `placeRequest` writes unit 0 only and through degrees; `scaleRequestUnits` writes three axes). NOT READ: **what u 40
  does once its parent shell is deleted** (the request's `+0xd0` parent is the shell's model interface `vt+0x130`
  `0x6bdcc`); `0x43a850`'s precondition fields; the ground query's miss.
- **The rank split (R)**: `0x103034c` (sole caller `0x102cd48`, body `0x102cc34` of (7, 0x87 / 0x88 / 0xbb)), at
  `0xb0968(e, 0, 0, 90.0)` -- **L2 M23 f90**: (7, 0x87) -> shell14 `0x3a8430() < 5 ? 4 : 10`; (7, 0x88) -> `0x102fa88(e, 1)`:
  shell01 20, then shell14 `< 5 ? 5 : 11`; (7, 0xbb) nothing. **Named choice: the viewer's existing `SHELL_QUEST_RANK`
  (index.html, 5; shells.js `own.rank`, the `modesG` idiom) -- modes 10 / 11**, because `0x3a8430` returns only 5 / 3 / 1 /
  0 and what its byte means is NOT READ (rom-map row `0x3a8430`); the viewer already fixes that input for every monster
  that tests it. Visible difference: only u 41's ShellScale on (7, 0x88) (mode 5 1.5, mode 11 1.0); u 40's scale is
  forced to 1.5 either way.

---

## 6. Item 7 of 7b -- shell11 (04_11) mode 6 -> shell01 29 / 30 (u 81 / u 80) (R)

- **Spawner `0x103047c`** (from (7, 0xc7)'s body `0x10289e8`; emulated): at **L4 M62 f40** (setMotion `0xafce8`; the body
  then plays L4 M63, L4 M64) by the TAIL tier `[e+0xcb03]`: **4 -> shell11 mode 6**; 2 -> shell01 22; 0 -> shell01 21 (no
  effect on 21 / 22). So u 80 / u 81 exist only at the Overcharged tail.
- **04_11's factory `0x49f45c`**: base11's ctor `0x402f80` (`+0x1654` 0, `+0x1658` 0, **`+0x165c` -1**, `+0x1660` 0, `+0x15a8`
  0xb) then `+0x1664` = -1, `+0x1668` = `+0x166c` = 0.
- **reader `0x1031978`**: joint `+0x15e4` = int 0 (**138**); mode 6: halfword `+0x1588` = the serial `0x16b4b4` (the
  children's `+0x3c`); `+0x1664` = int 1 (0); count `+0x1658` = int 2 (**20**) with a float table `+0x1654[k]` = float k
  (**72, 84, 96, 108, 120, 122, 134, 146, 158, 170, 181, 192, 202, 210, 220, 230, 240, 250, 260, 270**) and a point table
  `+0x1668[k]` (16 B each); `+0x1664` == -1 -> point k = sh vec k; **`+0x1664` == 0 -> `0x1031d28`**: m = int 3 (**2**);
  points k < m = vec k ((0,0,0), (0,0,600)); from k = m a spiral -- the last vec's (x, z) normalised, angle = acos of its
  dot with unit X (`0x19176e0`; `0x13ecc5c` = acosf, I), radius its length, then each point **angle += float 20 (40°),
  radius += float 21 (60)**, x = r cos(angle), z = r sin(angle), y 0. Emulated: k 2 = (-424.2, 0, 505.6) r 660 at 130°,
  ..., k 19 = (0, 0, 1680) -- radius 600 + 60 (k - 1), angle 90° + 40° (k - 1).
- **init** = base11's `0x402fd8` (base01's init, then `+0x1614` = the last time + 10 = **280**; `+0x165c` = -1, so no
  divide by the motion speed). base01 init with flags 0 (the reader writes none): position = the request's point, words
  = the request's. `0x103047c`'s request (R): id `[e+0xcbbc]`, mode 6, owner e, **`+0x10..` = the three words at the
  pointer the block's vtable `+0xd4` returns for 0x8a (138)** -- joint 138's position (I, by the argument), `+0x30..` = block
  `+0x50 / +0x54 / +0x58`, `+0x20` zero, `+0x3c` 0xffff.
- **`+0x150` `0x1032120`, every move**: anchor = position; owner active and joint >= 0 -> **position = joint 138's
  world position** (`0xc164c`) -- the shell rides joint 138; then base11's `0x40308c`: **while table[next] < elapsed
  `+0x1618`: vt `+0x168(next)`, next++**; next at the count -> the end. Life = 280 frames on base01's timer.
- **vt `+0x168` = `0x1031f28(shell, k)` -- the caller is base11's `0x40308c`** (owner active, mode 6 only): point =
  position + (table[k] turned by the shell's Y word: x' = x cos Y + z sin Y, z' = z cos Y - x sin Y, y' = y); shell01
  request: id `[e+0xcbb0]`, **mode k == 0 ? 29 (u 81) : 30 (u 80)**, `+0x10..` the point, `+0x20` zero, `+0x30..` the
  shell11's words, `+0x3c` = `+0x1588`.
- **So one Overcharged tail slam = 20 strikes**: u 81 at the joint at shell-time 72, then u 80 at 84, 96, ... 270 on a
  widening spiral (radius 600 -> 1680) turned by the slam's facing, each shell01 29 / 30 at the point with flags 0 (no
  joint, no snap), life = its hit slot (records 13 / 14: (0, 10) / (0, 15)). shells.js's base11 already runs
  `tick11`; it needs a CREATE11 entry for `uShellEm081_04_11` and a READERS11 entry for the table / spiral, plus the
  per-move joint follow of `0x1032120` (which Rathian's / Nakarkos's sp_11 do not have).
- NOT READ: what the block's vtable `+0xd4` returns (joint 138's position by its argument, I); `0x13ecc5c` named acosf by use.

---

## 7. Every spawn, by action (R emulated; the frame is the gate's own literal or tune value, the clip the one playing)

Driver: each (7, n) run through `0x1023a6c` with the real gates, spawners and actiontune; wings / tail tiers 0 / 2 / 4;
rank 5 / 3 (`all_r{5,3}_c{0,2,4}.txt`). Clip = the motion playing when the shell is submitted (blend partners named).
Status-7 stubs: table `0x1023a9c`, index = number - 1 (rom-map); args are the stub's own `mov r1 / r2 / r3`.

| action(s) | body (args) | clip(s) | frame | shell, mode | record | condition |
|---|---|---|---|---|---|---|
| (7, 0x7c / 0x7d / 0x7e) | `0x102979c` | L2 M48 (`0xb04d0`, partners L2 M33 / M35, weight from `e+0xcad4`) | **78** (`0x1030024`: `0xb0968(e,0,0,78.0)`) | shell00 0 / 1 / 2 | u 26 / u 26 / -- | -- |
| (7, 0xda / 0xdb) | `0x102979c` | L2 M48 | 78 | shell00 17 / 18 | u 26 | -- |
| (7, 0xcb) | `0x1028f6c` (r1 0) | L2 M48 | **82** | shell50 **0** + shell00 17 | u 60 + u 26 | -- |
| (7, 0xd3) | `0x1028f6c` (r1 2) | L2 M48 | 82 | shell50 8 + shell00 17 | u 60 + u 26 | -- |
| (7, 0x95 / 0x96 / 0x97) | `0x102d380` | L4 M28 -> **L4 M29** | 44 | shell00 6 / 7 / 8 | u 26 / u 26 / -- | -- |
| (7, 0xa9 / 0xaa / 0xab) | `0x102990c` | **L4 M22** | 82 | shell00 6 / 7 / 8 | u 26 / u 26 / -- | -- |
| (7, 0xdc / 0xdd) | `0x102990c` (r1 12 / 13) | L4 M22 | 82 | shell00 **19** / 20 | u 26 | -- |
| (7, 0xd4 / 0xd5) | `0x102962c` (r1 0 / 2) | L4 M22 | 82 | shell50 1 / 9 | u 60 | -- |
| (7, 0xe0) / (7, 0xe7) / (7, 0xe6) | `0x1029ba4` (1,0) / `0x102a2a0` (1,1,0) / (0,1,0) | L9 M12 (start 34) / L9 M12 / L9 M9 -> **L9 M10** | 64 | shell00 22 | u 26 | -- |
| (7, 0xef) / (7, 0xf0) / (7, 0xf3) | `0x102a2a0` (0,0,0) / (1,0,0) / `0x1029ba4` (0,0) | L9 M16 / L9 M19 / L9 M19 (start 34) -> **L9 M17** | 64 | shell00 22 | u 26 | -- |
| (7, 0xe1) / (7, 0xe8) / (7, 0xe9) | `0x1029ba4` (1,1) / `0x102a2a0` (0,1,1) / (1,1,1) | L9 M12 / L9 M9 / L9 M12 -> L9 M10 | 64 | shell50 3 | u 60 | -- |
| (7, 0xf1) / (7, 0xf2) / (7, 0xf4) | `0x102a2a0` (0,0,1) / (1,0,1) / `0x1029ba4` (0,1) | L9 M16 / L9 M19 / L9 M19 -> L9 M17 | 64 | shell50 3 | u 60 | -- |
| (7, 0xe2) / (7, 0xea) / (7, 0xeb) | `0x1029fb8` (0) / `0x102a778` (0,0) / (1,0) | L9 M15 / L9 M13, M14 / L9 M15 -> L9 M10 | 64 | shell00 23 | u 26 | -- |
| (7, 0xe3) / (7, 0xec) / (7, 0xed) | `0x1029fb8` (1) / `0x102a778` (0,1) / (1,1) | L9 M15 / L9 M13, M14 / L9 M15 -> L9 M10 | 64 | shell50 5 | u 60 | -- |
| (7, 0xee) | `0x102ac08` (r1 1) | **L9 M3** | **100 / 144 / 188** | shell50 **13 / 12 / 11** | u 60 x3 | `cmp r5,#1` (the stub's 1: always) |
| (7, 0xcf) | `0x102913c` | L9 M20 | 140 | shell50 6 | u 70 | -- |
| (7, 0xdf) | `0x1029ab0` | L9 M8 | 46 | shell50 7 | u 70 | -- |
| (7, 0x3a / 0x40 / 0x42 / 0x44 / 0x46 / 0x48) | `0x1025ce4` / `0x1026304` / `0x10266d4` | L2 M27 (0x40 / 0x42: after L2 M51, M27 from 48) | **72** | shell01 0 | u 10 | **wings tier 2 / 4** |
| (7, 0x3b / 0x41 / 0x43 / 0x45 / 0x47 / 0x49) | same | L2 M28 (0x41 / 0x43: after L2 M52) | 72 | shell01 1 | u 10 | wings tier 2 / 4 |
| (7, 0x8e) / (7, 0x90) | `0x102cde0` / `0x102d028` | L2 M27 / L2 M28 | 72 | shell01 0 / 1 | u 10 | -- |
| (7, 0x77 / 0xc0) / (7, 0xbf) | `0x1026acc` (r1 2) / `0x10285d4` | L2 M49 -> **L2 M42** | **32** | shell01 5 | u 11 | after `0x78b78` (the landing: I) |
| (7, 0x87) | `0x102cc34` | L2 M23 | 90 | shell14 10 (rank < 5: 4) | u 40 + u 41 | rank |
| (7, 0x88) | `0x102cc34` | L2 M23 | 90 | shell01 20 + shell14 11 (rank < 5: 5) | u 10 + u 40 + u 41 | rank |
| (7, 0xc7) | `0x10289e8` | L4 M62 (`0xafce8`) | 40 | shell11 6 (tail tier 4) / shell01 22 (2) / 21 (0) | u 81 + u 80 x19 | **tail tier** |
| (7, 0x91 / 0x92), (7, 0x9d / 0x9e / 0x9f), (7, 0xb8 / 0xb9 / 0xba) | | L2 M34 f76; L4 M29 f44; L4 M22 f82 | | shell00 3 / 4; 9 / 10 / 11 | none | |

- The frames are the shells' spawn frames as the gate tests them (mode 0 "crossed F", the viewer's `pass001`). A
  motion started at a later frame (`0xafe84` / `0xafe8c` s1, e.g. L9 M10 from 58) reaches F = 64 six frames after it
  starts; that s1 is the START frame is I (it is the argument the driver used, and it reproduces the beams lane's
  frames).
- Clips not reached by these rows still play in the viewer -- the rows bind a clip to its spawns the way beam-spawns.js
  / SHELL_DATA `actions` do; several actions share one clip (L2 M48: 0x7c / 0x7d / 0x7e / 0xda / 0xdb / 0xcb / 0xd3 make
  different modes) -- the viewer's `variant` / `pick` idiom chooses which.
- Census rows withdrawn by this table: "Mode 19 (u 26): no spawn site", "Modes 0, 12, 13 (u 60): no spawn site", "7:0xd4
  -> 1 or 9 (condition not read)", "0xf4 / 0xf2 r1=5 -> 22", "0xe3 / 0xea r1=6 -> 23", "u 10 ... 7:0x49 / 0x41 / 0x43 ...
  0x8d / 0x8f", "u 11 ... L2 M49, f32", "shell50 mode 6 -> 7, 7 -> 8".

---

## 8. What stays NOT READ, by name

- `[[0x211f764]+0x38]`, the divisor of base50's clock and shell01_02's hold (I: frames per second).
- What u 40 does after shell14 is deleted (its parent).
- `0x3a8430`'s byte (rank; the viewer's SHELL_QUEST_RANK stands in).
- `0x78b78` (u 11's landing wait), `0xb04d0`'s blend weight (`e+0xcad4` x literal -> P+0x308) -- the viewer plays the primary.
- The r2 = 1 frame channel (`+0x13ac` / `+0x13b4`) versus channel 0 (rom-map's open row): used by the c 30 table.
- Which hitdata shell00 / shell14 / shell15 load (their folders have none; `em081_00_shellNN` does).
- The block vtable `+0xd4` behind shell11's request point (I: joint 138).
- base15 / shell15 items listed in §3b; base14 / shell14 items in §5b.

## 9. Tooling trap found on the way

`fn.py` (this session's extent finder) took every mnemonic starting with `bl` as a call, so the conditional branches
`ble` / `bls` / `blt` / `blo` were neither followed nor counted: it truncated `0x4072f0` at `0x407b18` (true end
`0x407bd4`, the no-pause arm reached only by `ble` at `0x407938`) and `0x3f9814` at `0x3f9858` (true `0x3f9868`). Every
other extent quoted here was re-run with the fixed finder and is unchanged (control: `0x4072f0` now ends at `0x407bd4`). Any branch classifier keyed on
the mnemonic prefix has this hole (rom-map trap).
