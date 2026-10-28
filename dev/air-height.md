# Air height -- how high a flying monster's unit is above the ground on its air list, and what sets it

Research agent for the Viewer agent, 2026-10-16. Question: on a flying list, what is `P+0x44 - P+0x5b4` (unit y minus the
ground probe) and what sets it; is the viewer's Grid Floor (index.html `monsterFloorY`, the clip's lowest reach over the
loop) where the game's ground is. Seregios (em077_00, uEm077_00) first; controls Rathian / Rathalos (uEm001_00), Astalos
(uEm081_00), Malfestio (uEm079_00). `P` = `[e+0x1428]` = `e + 0x1440` (the enemy ctor's own store, `0x6dcb0`: `r8 = r4 +
0x1440`, `0x6d830`). Tags: **R** = the consuming instruction read; **E** = ROM-run (unicorn) on read code; **I** = inferred;
**NR** = not read. Scratch (session-local): `<archive>\air\` -- `emu_takeoff.py` (a class's takeoff handler frame by
frame on the ROM), `curves.py` (every `0xc1010` velocity curve in a band, with its sum), `glbroot.py` (a motion glb's
`reference` and joint-0 translation tracks).

## 0. Answer

* **The flight clip's origin IS the unit (`P+0x44`), and the ground is NOT in the clip.** The air clips (L1 M1 / M4 / M5 /
  M19 ...) carry a root-motion (`reference`) Y of 0 and their joint 0 sits at ~0 (L1 M1 joint-0 y -30..230, against 318 on
  the ground idle L0 M1), so nothing in the clip says where the ground is. **R** (the root step, 1.3) / file (glb).
* **What puts the unit above the ground is state, not the motion:** (a) the posture-1 entry `0xbc984` adds
  **`FlyOfs x size`** to `P+0x44` (from posture 0 / 3 / 6); (b) the action's own vertical velocity curves, integrated by
  the class (`0xc1010` -> `P+0x14`, `0x7d810` / `0x7c9fc` / `0x7b53c`); (c) floors: `0xbf038(e, FlyOfs)` inside `0x7d810`
  and the engine's `0xbf284` (`ground + {FlyOfs, P+0x930, 0} x size` by `[P+0x92c]`); (d) the root-motion Y delta x
  `mNullTransScale.y` x model scale (0 for these clips). **R** for each; section 2.
* **H after the standard takeoff (3,0) / (3,1)** -- ground clip, lift, the rise curve on L1 M19, then the hover L1 M1:
  **H = FlyOfs x size + 485.5** (the curve is not scaled by size). **E**, emulated on the ROM's own code:
  | monster | FlyOfs (.dtb) | H at size 1 | H at size 1.2 |
  |---|---|---|---|
  | Seregios em077_00 (3,0) `0xfe2b7c` | 500 | **985.5** | 1085.5 |
  | Rathian em001_00 (3,0) `0xcf49ec` (Rathalos em002_00: same class, FlyOfs 500) | 500 | **985.5** | 1085.5 |
  | Astalos em081_00 `0x101d348` | 500 | **985.5** | -- |
  | Malfestio em079_00 `0xff3ec4` | 300 | **785.5** | -- |
  The rise curve (0, 57) (8, 51) (16, 22) (24, -5) (32, -13) (48, -12) is byte-identical in all four classes (Seregios
  `0x17e8080`, Rath `0x17940e8`, Astalos `0x17ec628`, Malfestio `0x17e99c4`): the unit climbs to FlyOfs x size + 755 at f25
  and settles 485.5 above the lift. **R** (data) / **E**.
* **H is FlyOfs x size** for a posture-1 entry from the ground that has no curve (an EMC script's op 4(1), the flying idle
  (0,3)'s own `0xbc984` when entered from the ground) -- and that is also the floor `0xbf038` keeps inside every
  `0x7d810` flight step. **R**. (Seregios's area-entry hook vt+0x224 first "lifts him to the area height" (states-em077_00.md,
  not re-read) and then lifts FlyOfs on top: **NR** here.)
* **Seregios's L1 M5 (the ledge climb (3,0x50) `0xfe6f38`)** rises during the clip: **H(f) = 472 x size + 6.8 x size x f**
  over flat ground (784.8 at f46, size 1). **E**. **His L1 M4** is entered in **posture 3** there (`0xfe72b0`) and in the
  pitfall script (op 4(3)): posture 3 PINS `P+0x44` to the ground (H = 0 for every unit-height test) and draws the body
  `e+0x1384` above it (section 2.6). **R**.
* **Where the viewer's floor belongs on an air list: at the clip origin minus H** (in game units; minus H / size in the
  clip's own units, since 485.5 does not scale): **-(FlyOfs x size + 485.5)** for a hover reached by the standard takeoff
  (Seregios L1 M1: **-985.5** at size 1), not lower than **-FlyOfs x size** (-500) for any posture-1 hover; for L1 M5 the
  ground moves under the clip (-(472 + 6.8 f) x size); for a posture-3 clip the ground is **-e+0x1384** below the drawn
  origin (FlyOfs x size when entered through the setter, 2.6). **The current lowest-reach rule is too HIGH for Seregios's
  L1 M1 (-702.2 vs -985.5: 283 too close) and L1 M5 at f46 (-609 vs -784.8: 176 too close)**; it is below the bare-lift
  minimum (-500) on L1 M1 only by accident of the body's reach. **I** (the viewer rule is a recommendation; it needs the
  action that brought him to the clip, which the viewer does not know -- the takeoff value is the ROM's for the canonical
  path).
* **The shells read the UNIT, not joint 0.** base01's 0x80 arm deletes when `[owner+0x1428]+0x44 - +0x5b4 >= +0x1604`
  (900) -- the owner's `P+0x44` (`0x3fa75c..0x3fa770` builds `r7 = owner + 0x1428` with writeback; `0x3fa8b4..0x3fa8dc`).
  The viewer hands `ownerPos` = the gid-0 bone (live.js `unitMatrix`, `originBone`), which is the HIP: on L0 M1 it is 318
  above a unit that the game pins to the ground, on L1 M1 it swings -15..231 around a unit that does not move. **R** (ROM) /
  read (viewer code).
* **Consequence (size 1):**
  | shell | viewer now (hip vs lowest reach) | game, after the standard takeoff | game, bare lift (500) |
  |---|---|---|---|
  | c 30, L1 M1 f100 (pulse) | 933.3 -> deleted | **985.5 -> deleted at every pulse of the loop** (f0 / f200 too) | 500 -> kept |
  | c 32, L1 M5 f46 ((3,0x50)) | 920.6 -> deleted | **~785 -> KEPT** (deleted only at size >= 1.147) | -- |
  | c 30, L1 M4 f2 | 642 -> kept | **0 (posture 3, pinned) -> kept** | -- |
  So the viewer is wrong on L1 M5 (the game makes c 32), right on L1 M1 f100 for the wrong reason, and wrong on L1 M1
  f0 / f200 (the game makes no c 30 there after the takeoff; the viewer keeps it). Rathian's hover dust has the same
  900 gate at spawn (`0xd09e28`, shared-state-effects.md) and the same 985.5: **after her standard takeoff she makes no
  hover dust at size >= 0.83**. **E** (heights) / **R** (gates).

## 1. The unit's height in flight -- what moves `P+0x44`

### 1.1 The per-frame order (`+0x24` pass `0xada80`) -- R
`0xa50dc` (`0xadae8`: resets `e+0x1380..0x1388` to the zero vector `0x19176b0`, every frame) ... `0xa5db8` (`0xae0d8`:
model scale `e+0x60..0x68` = size; posture 3 -> `0xbf76c`, posture 4 -> the sink) -> `0xa5fc8` (`0xae10c`: `0xc2710`
P -> e copy, `0x6f200` -> `0x71984` the motion advance with the root step, `0xc2788` e -> P) -> `0xa61dc` (`0xae120`:
probe `0xbde60`, pin / clamp `0xbf284`, tilt `0xbdf54`) -> `0xa807c` (`0xae16c`: the DRAWN position). The action itself
(vt+0x1f4) runs earlier in the same pass: **I** (states-em043.md's frame order; its call site in `0xada80` not pinned).

### 1.2 Root motion carries Y -- R
`0x71984`: `e+0x40.. = e+0x1370..` (P's position, copied by `0xc2710`), `0x94e1a0(e)` (`0x71d00`), then `e+0x1370.. =
e+0x40..` (or a lerp by `e+0x13a8` when it is not 1.0, `0x71d44..0x71dc8`); `0xc2788` puts `e+0x1370..` back in
`P+0x40..`. Inside, `0x951aa0`'s apply arm `0x95299c..0x952ae0`: `pos += R(q) * (scale(+0x60..68) * mNullTransScale(+0xed0
..ed8) * R(q)^T * dT)`, dT = T(now) - T(prev) (`0x951f88..0x951fbc`, prev at layer `+0xac..0xb4`, stored at `0x9528e4..
0x9528f0`). `mNullTransScale` = (1, 1, 1) by default (uModel ctor `0x9367f4..0x936804` from `0x19176c0`, ROM-run
static initialisers: (1, 1, 1)); the enemy rewrites it after the action main each frame as `e+0xb7f0 x (e+0xb7e0,
+0xb7e4, +0xb7e8)` (`0xa5c04..0xa5c5c`); `e+0xb7e0..e8` = (1, 1, 1) at init (`0xad144`), `e+0xb7f0` = 1.0 at every action
change (`0x76100`). Seregios writes only the Z of that vector (a charge stretched to its target, `0xfea8e0..0xfea91c`,
reset at f110 `0xfea944`). **So the root Y delta moves the unit 1:1 x size.** What a NEW motion takes as T(prev) (an
initial jump by T(start), or none): **NR** -- it only matters for clips whose reference Y is a nonzero constant (below).

### 1.3 The air clips carry no root Y -- file (glb), R (what it means)
`docs/poses/monsters/em077_00_1.glb` `reference` track: **Y = 0 constant on L1 M1 / M4 / M5 / M18 / M19** and every L1
clip except M30 / M66 / M68 (Y = 500 constant). Constant 500 also on L0 M51 / M55, L2 M26 / M34 / M37 / M40 / M48 / M50 /
M68 / M70; L2 M45 / M46 go 0 -> -500 -> 0; L0 M30 -1690 constant. A constant gives dT = 0 after the first frame (1.2); its
first frame: **NR**. That the glb's `reference` node is the LMT root track the ROM's `0x951aa0` evaluates: **I** (pose.js
says so; the converter not read here).

### 1.4 The posture-1 entry lifts the unit -- R
`0xbc984(e, s0)`: if posture is in mask 0x49 {0, 3, 6} -> `P+0x44 += (P+0x1ac x P+0x1b0) x s0` (`0xbc9a4..0xbc9d0`);
push-hit offsets; `P+0x992 = 0`; posture = 1. `0xbf4d4` = `[0x712a0(e)]` = `[[e+0x75e8] + 0x98]` = **FlyOfs**. Seregios:
47 of his 48 `0xbc984` calls take FlyOfs, the others literals (472.0 at `0xfe7040`; `0xfe51a0` / `0xfe51c0` / `0xfe6500` /
`0xfe66e8` -- not read). The posture setter `0xbc7f4` itself moves the height only for 0 / 4 (`P+0x44 = P+0x5b4`) and 6
(the ceiling); 3 -> `0xbf74c` (`P+0x1cc = FlyOfs`); 1 / 2 nothing (`0xbc8b0..0xbc97c`).

### 1.5 The engine does not hold a flight height -- R
`0xbf284` (READ whole `..0xbf4bc`; gate `P+0x5bc`, `+0x5c8e`, `+0x5cd5` all 0): postures {0, 3, 4, 6} -> `P+0x44 =
P+0x5b4` and return; {1, 5}: ceiling clamp `<= P+0x980 - TenjoOfs x size` (`P+0x944`, not `+0x990` / `+0x991`); then the
floor by `[P+0x92c]`: 1 -> `ground + FlyOfs x size`, 2 -> `ground + [P+0x930] x size`, else `ground + 0` -- each only for
postures {1, 2, 5, 6} with a probe hit (`P+0x5b0 == 1`), else the bare ground. **No pull toward a target height.**
`P+0x92c` is zeroed by the enemy clears (`0x6e3a4`, `0xa51f4`, `0xba398`) and set by classes per action (Seregios: 1 at
`0xfe31b0` / `0xfe46f8` / `0xfe5508` / `0xfe56bc` / `0xfe5b2c` / `0xfe6270` / `0xfe6b94` / `0xfe76b4`; 2 with `P+0x930 =
350.0` at `0xfe4938`). The velocity integrator with gravity `0x7c860` is called only from class code (15 sites, all in
class bands), so the engine adds no vertical speed either.

### 1.6 The class's vertical velocity -- R / E
`0xc1010(e, curve)` = `0x2329dc(curve, frame e+0x500) x e+0x50c` (the motion speed): piecewise-linear (frame, value) pairs
until a negative frame, 0 past the end (`0x232a08..0x232a1c` returns the terminator's value). Stored to `P+0x14` (local
Y), integrated by `0x7d810` -> `0x7c9fc` (`pos += dt x R(angles) v`, `0x7cb04..0x7cb3c`) then `0xbf038(e, s0)` (floor:
`P+0x44 = max(P+0x44, ground + s0 x size)` in postures {1, 2, 5, 6} with a probe hit; `0xbf038..0xbf0b8`), or by `0x7b53c`
(world `pos += dt x v`). Speed and dt cancel: the rise is the curve's integral over frames. `0x7b518` zeroes the velocity.
Seregios's curves (`curves.py`): takeoff `0x17e8080` (+485.5 Y), climb `0x17e80b8` (+714.6 Y), hop `0x17e8108` (Y 50 ->
-50), back-off `0x17e8128` (local Z -666).

## 2. The actions

### 2.1 Seregios (3,0) `0xfe2b7c` / (3,1) `0xfe2ce4` -- R / E
ph0 posture 0, **L1 M18** (`0x112`, ground frame: joint 0 3.1 -> **5.0** = hips 500 up at its end); ph1 at its end
`0xbf4d4` + `0xbc984` (**+500 x size**), **L1 M19** (`0x113`, flight frame: joint 0 starts 0.1) -- **the hips go 500 ->
510: the lift and the two clips' authoring agree**; ph2 the curve + `0x7d810(FlyOfs)`; at L1 M19's end (3,0) plays **L1 M1**
(`0x101`) and (3,1) goes on to vt+0x3e0. Emulated (`emu_takeoff.py fe2b7c 0 400 500 1.0 len=112:115,113:49,101:133`): on
the ground 0 to f114 of L1 M18; 500.0 at L1 M19 f0; 1255.0 at f25; **985.5 at f48 and through L1 M1** (no change in the
hover). Size 1.2: 600 -> 1085.5.

### 2.2 Rathian (3,0) `0xcf49ec` -- the control, R / E
The same template: L1 M13 (`0x10d`, joint 0 ends 4.3) -> `0xbc984(FlyOfs)` -> L1 M19 (joint 0 starts -0.7: **430 -> 430**)
with the same curve -> L1 M1. Emulated: **985.5**, size 1.2 1085.5. Her hover idle (0,3) `0xcee654` and Seregios's
`0xfe0498` only call `0xbc984` (a no-op once in posture 1) and play L1 M1 -- the hover keeps whatever height it was given.
Seregios's (0,3) also runs `0xfe05b4` each frame, which eases `P+0x44` toward the ABSOLUTE `FlyOfs x size + 250` at
`5 x speed x size x dt` -- **only on map byte 0xf6** with the band byte `e+0x7305` in its ranges. **R**; which map 0xf6 is:
**NR**.

### 2.3 Astalos / Malfestio -- E
Astalos `0x101d348` (and `0x101d494`): L1 M13 -> lift 500 -> L1 M19 + curve -> **985.5**. Malfestio `0xff3ec4`: L1 M13 ->
lift **300** -> L1 M14 (`0x10e`) + the same curve -> **785.5** (the run faults after, at an unstubbed vtable call, past the
height). Their status numbers: **NR** (Astalos's action main has no status-3 jump table; Malfestio's (3,n) table not
matched to these functions).

### 2.4 Seregios (3,0x50) `0xfe6f38` -- the ledge climb (L1 M5), R / E
ph0 posture 0, **L1 M24** (`0x118`); ph1 -> `0xbc984(472.0)` (**+472 x size**), **L1 M25**; ph2 -> **L1 M5** (`0x105`),
`P+0x14 = 6.8 x size`; ph3 `0x7b53c` every frame (**+6.8 x size per frame**); at L1 M5's end: `P+0x44 >= ctl+0x58 +
FlyOfs + 200` -> L1 M1, else the climb curve `0x17e80b8` (ph4). `ctl+0x58` = `0xa76f4(e, .., 1.3)` after the wall finder
`0xa6c1c` (`0xfe1b70` / `0xfe1c88`) -- **I: the ledge top's height**. Emulated over flat ground: 472.0 at L1 M5 f0,
**784.8 at f46**, 975.2 at f74. Later phases: posture 3 + **L1 M4** (`0xfe72b0`) once `P+0x44 >= ground + FlyOfs x size`
(`0xbf52c`). **R** (code) / **E** (heights, flat ground: in the game the ground under him changes as he climbs: I).

### 2.5 The pitfall script (10,0x62) -- R (states-em077_00.md)
L1 M19 (from f4) -> L1 M1 -> op 4(3) -> L1 M4 -> L1 M28 -> op 4(0) -> L1 M29: a script plays the clips WITHOUT the class's
curve, so a scripted flight sits at the bare lift (op 4(1) = `0xbf4d4` + `0xbc984`). Which posture L1 M19 / M1 are in
here and whether op 4(1) runs before them: **NR**.

### 2.6 Posture 3 -- pinned unit, lifted body -- R
`0xbf284` pins `P+0x44 = P+0x5b4` in posture 3. The setter's posture-3 arm `0xbf74c` writes `P+0x1cc = FlyOfs`; each
frame `e+0x1380..88` is zeroed (`0xa50dc`) and `0xa5db8` adds `P+0x1cc x size` to `e+0x1384` (`0xbf76c`) in posture 3;
the joint build `0xa807c` draws the unit at **`P+0x40.. + e+0x1380..`** (`0xa8094..0xa80d4`). **So a posture-3 clip is
drawn FlyOfs x size above a unit that stands on the ground**, and every unit-height test (base01's 900, Rathian's hover-dust
gate) sees 0. `0xbca24` (posture 0 / 3 / 4 -> 1) sets `P+0x44` to the joint position `0xc164c(e, r1)` (`0x539e08`, joint
r1 or 0) and zeroes `e+0x1384` / `P+0x5c` -- the drawn height becomes the unit's. Classes that write `P+0x1cc` directly
(Kut-Ku 300.0) lift by that instead. **R**.

## 3. For the viewer (no viewer code changed here)

* The grid on an air list: **clip origin - H** (game units), with H the state's (section 0 table); the body's lowest reach
  is unrelated to the ground. Seregios L1 M1: -985.5 x (size-dependent: -(500 s + 485.5)); never above -500 s.
* `ownerPos` for the shells' unit tests and for request `+0x10` should be the unit origin (the clip origin plus the
  root track), not the gid-0 joint: `0xfde1e0..0xfde26c` (request `+0x10 = P+0x40..`) and `0x3fa8b4` read `P`, not a joint.
  **R** (ROM) -- the viewer's change is the Viewer agent's call.
* The viewer cannot know the action history from a clip alone: a per-clip H (L1 M1 = the takeoff's 985.5, L1 M5 = the climb
  curve, L1 M4 = posture 3) is a choice among ROM values, labelled as such. **I**.

## 4. Not read
* The root step's T(prev) at a new motion (1.2), so the first frame of a clip whose reference Y is a nonzero constant.
* Which takeoffs the AI actually picks for each flight (the EMC streams that issue (3,0) / (3,1) / (3,0x50) / scripts).
* Seregios's `0xbc984` literal sites `0xfe51a0` / `0xfe51c0` / `0xfe6500` / `0xfe66e8`; the vertical arms of his other
  flight actions (status 4 / 7 air attacks) beyond the curves listed.
* Map 0xf6 (Seregios's `0xfe05b4` absolute hover target).
* The exact L1 M19 length used in the emulation (49 frames from the glb); the curve is 0 past f48, so a longer clip
  changes nothing and a shorter one stops the rise early.

## 5. The Rath line's LOW hover -- posture 3 (follow-up 2026-10-17: Dreadking's flight dust never spawned at H = 985.5)

The standard H is right for L1 M1 after a takeoff and WRONG for the hover the game mostly shows: the Rath line's L1 M2 /
M11 / M12 hover idles and turns, L1 M4, L2 M11 and L4 M25 / M26 / M27 are played in **posture 3**, where `0xbf284` pins
`P+0x44` to the ground every frame (H = 0 for the shells' 900 tests: the dust always spawns) and the BODY is drawn
`e+0x1384` above it. Rathian em001_00, Rathalos em002_00, Dreadqueen em001_04, Dreadking em002_04 run one class
(uEm001_00); FlyOfs 500 on all four (.dtb +0x22); sizeBase (dtb+0x64) 1.0 / 1.0 / 1.2 / 1.2.

### 5.1 The drawn offset -- R
`e+0x1384` = (posture 3 ? `P+0x1cc` x S : 0) + `P+0x5c` x m, rebuilt every frame: `0xa50dc` zeroes `e+0x1380..88`, then
`0xa5db8` (`0xae0d8`; skipped while `0xc210c` -- `P+0x5c2f` in 1..5) adds `0xbf76c` (posture 3) and `P+0x5c x 0xbec34(e)`
(`0xa5e80..0xa5ea0`); `0xa807c` draws the unit at `P+0x40.. + e+0x1380..`. S = `P+0x1ac x P+0x1b0` = sizeBase x spawn size
(rom-map `0xbe518` row), m = `0xbec34` = S / dtb+0x64 = the spawn size. `P+0x1cc` = FlyOfs, written by the setter's
posture-3 arm `0xbf74c` (`0xbc8f0`) on a CHANGE to 3 (same-posture calls return at `0xbc8ac`). `P+0x5c` is class-driven
while `P+0x1b9` = 1 (`0xbf700` sets, `0xbf71c` adds `s0 x dt`; both raise `P+0x1b9`), else it decays to 0 (x0.9 / frame
above 100, then 5 / frame, `0xa5e18..0xa5e7c`). **So the low-hover body sits at 500 S + m P+0x5c above the ground, and
the unit on it.**

### 5.2 The actions (ROM-run, `emu_takeoff.py` with the frame tests, the setter, `0xa5db8` and the .bss constants live)

| action | handler | clips (posture) | unit H / drawn D above the ground (S = m = 1) |
|---|---|---|---|
| (0,6) hover idle | `0xcf2ba0` | **L1 M2** (3) | H 0; D = 500 S + m P+0x5c, P+0x5c stepped 2.5 / frame toward the slope target `-75 + (ctl+0x68 + 75)(1 - max(n.up, 0.866)) / 0.134` (`0xcf2be0..0xcf2d9c`): **-75 on flat ground -> D 425** |
| (4,4) / (4,0x15) hover turns | `0xcfad9c` | **L1 M2 / M11 / M12** (3) | the same: D -> 425 (flat) |
| (4,5) / (4,0xc) / (4,0xd) | `0xcfb160` / `0xcfbb98` | **L1 M2** (3) | the same |
| (4,3) / (4,0x19) the DESCENT | `0xcfab98` | **L1 M1** (1) -> **L1 M4** (3) | `P+0x92c = 1` (floor ground + 500 S); `0x7cb4c` vy -5 (faster from above ground + 1000); `0x7cca4` each frame: **H(f) = max(500 S, H0 - 5 f)** (985.5 -> 500 at f 97); at `0xbf52c(FlyOfs)` (reach) and (4,0x19) at once / (4,3) at the next crossing of L1 M1 f2: posture 3, **L1 M4: D = 500 S - m min(75, 2.5 (f + 1))** (flat) |
| (7,0x24) `0xcfd898(e,1)`, (7,0x78) / (7,0x79) `0xd02a74(e,2/3)` | | **L4 M26** (3) -> **L4 M25** (3); L4 M27 (3) on the other arm (`0xcfdc44`) | H 0; L4 M26: `P+0x5c += -3.333 x speed x dt` to -200 (`0xcfd94c..0xcfd984`): **D = 500 S - m min(200, P5c0 + 3.333 f)** (from P+0x5c 0: 500 -> 300 at f 60); **L4 M25: D = 500 S - 200 m**; **L4 M27: P+0x5c = -200 (40 - t) / 40, t = `P+0x1bc` from 0 at its start, +dt a frame (`0xcfdbbc..0xcfdc80`): D = 500 S - 200 m max(0, 1 - (f + 1) / 40)** |
| (7,0x2d) `0xcff66c(e,1,3)` (also (7,0x1c) / (7,0x1d) / (7,0x39), other args) | | **L2 M12** (1) -> **L2 M10** (1) -> **L2 M11** (3) -> L4 M25 / M27 | L2 M12: vy -1, forward 25, steered by `0x7a820` (aim-dependent), floored by `0x7d8d8` -> `0xbf038(FlyOfs - 200)`: **H falls to 300 S** (emulated: 985.5 -> 300 by f 46, aim at the origin); **L2 M10: H 300 S**; L2 M11: posture 3, `P+0x5c = -200` (`0xcff7f8`): **D = 500 S - 200 m** (= 300 when S = m) |

Exits: (7,0x24) on the landing arm sets posture 0 and L4 M37 / L4 M35 (on the ground). Posture 3 -> 1 through
`0xbc984` lifts the unit by FlyOfs x S onto the drawn height (continuous when P+0x5c = 0); through `0xbca24` the unit
takes the joint's height.

### 5.3 The dust
Every shell / dust test on these clips reads `P+0x44 - P+0x5b4` = 0: Rathian's hover dust c 30 (`0xd09e28`, L1 M2 / M11 /
M12) and the flight dust c 31 (shell01 mode 15 via `0xcf2424` on L4 M25 / M26 / M27, base01's 900 arm) always pass. Only
**L1 M1** -- the HIGH hover, posture 1 -- is gated: no dust while above 900 (after the takeoff), dust once the (4,3)
descent brings the unit under 900 (f >= 18 from 985.5). Seregios's (0,6) L1 M2 is posture 3 as well (`0xfdb29c`); his
other low-hover clips: NR here.

### 5.4 Not read
The (4,3) / (4,0x19) choice of the next f2 crossing in the ROM's loop (the harness does not loop); `0x7cb4c`'s fast arm
above ground + 1000; L2 M12's descent under a real aim; the per-action P+0x5c start values the AI leaves (each row's P5c0);
which posture-3 action the AI picks; the variants' (em-byte) branches of `0xcff66c`.

## 6. Kecha Wacha's hang, read since (gapK, 2026-10-22; indexed in rom-map, doc audit 2026-10-24)

* The hang is **posture 1 held by v = 0** at 585 S above the ground, with no ceiling or wall pick. Posture 6 is never set. L2 M115 /
  M116 / M117 / M118 / M126 are set only at `0xf520e8` / `0xf52318` / `0xf523ac` / `0xf527c4` / `0xf5224c` + `0xf5265c`, in his band
  `0xf48e20..0xf57cd0`. The control finds every phase site. His EMC scripts are NOT checked. rom-map Fanged Beasts row "uEm065_00 L2 M115
  ... set sites".
* **The unit integrator** `0x7a820` (`0x7a994..0x7aa98`): pos += dt R v + dt^2 R a / 2; v += dt a. R turns by X / Z only in postures
  {1, 2, 4, 5, 6} (mask 0x76). rom-map "Shared enemy / command layer". So section 1's "what moves P+0x44" adds the integrator's own terms.
* **Authored heights**: em065_00 `.dtb` +0x22 FlyOfs / +0x2e TenjoOfs are 0.0 / 0.0. P+0x92c has no store in his band (control:
  Seregios `0xfe31b0`). The `reference` Y of L2 M126 / M117 / M115 is a constant 584.5 / 400.2 / 255.4 (the authored unit height).
  These rows moved 2026-10-24 from the PSL table to rom-map "Fanged Beasts". viewer: motion-states.js AIR_HEIGHT.em065_00.
* The withdrawn chain "M114 -> M115 -> M116 -> M117" is in the Withdrawn table; the drop path is M114 -> M115 -> M126 -> M117 -> M118.
  Details: `<archive>\gapK\RESULT.md`.

## Alatreon (em050_00), L2 M21 -- added 2026-10-26 (shells lane)

(7, 0x19) plays L2 M21 in POSTURE 3, set by (7, 0xf) at 0xecc134 (its only issuer, the follow at 0xecc428); FlyOfs 500 (dtbase, loader
0x53800). So the unit is the ground and the body is drawn 500 x S above it: `AIR_HEIGHT.em050_00 = { flyOfs: 500, standard: false,
clips: { '2|Motion[21]': { posture: 3 } } }`. His (7, 0x20) plays L2 M21 in posture 1 (0xbc984(FlyOfs) at 0xecad88: the unit with the
body, the ground the same 500 x S below). No standard takeoff rule is read for him (`standard: false`). rom-map row "Alatreon's (7, 0x19)
meteors".

### Alatreon, every clip (audit 2026-10-26)

The action main run for every action (<archive>/gapW/actpost.py) gives the posture each clip plays in. Posture 3 rows (the unit the
ground, the body FlyOfs x S = 600 above it at his 1.2): L1 M2 / M4 / M6 / M7 / M8 / M9 / M11 / M12 / M15 / M20, L2 M7 / M8 / M9 / M10 /
M11 / M12 / M18 / M19 / M21 / M23 / M24, L3 M53 / M54. Where a clip plays under posture 1 as well (L2 M7 / M21 in (7, 0x20), L2 M24 in
(3, 3)), the posture-1 entry lifts him FlyOfs off the ground, so the ground is the same; the row is posture 3, the plays the viewer's
picks stand for. Open: L1 M1 (posture 1 after a takeoff that climbs ~2296 on L1 M19's curve 0x17c7194, posture 3 in status 4), L1 M17 /
L2 M2 / L1 M19 (posture 1 on their own velocity curves 0x17c7124 / 0x17c71dc / 0x17c7194 and the 0xbf284 clamp, P+0x92c not read), and
his P+0x5c (the drawn body's own offset).

### Alatreon's posture-1 heights and L1 M1's two (2026-10-26)

P+0x92c is never written by his class (0: the bare-ground floor) and P+0x5c never set (the posture-3 body exactly FlyOfs x S up).
Emulated on his own code (<archive>/gapX/emu_rate.py -- emu_takeoff with the frame stepped by the motion's rate): (7, 0x1f) L1 M19
lifts 600 (size 1.2) and climbs on curve 0x17c7194 to 2899, L1 M1 then at 2902; (4, 0xa) L1 M17 hops on 0x17c7124 (1298 at f33) back
to the 600 line at f85, posture 3; (7, 5) L2 M2 leaps on 0x17c71dc at rate 0.65 / 0.9 (969 at f34) to the 600 line at f47.5, then
posture 0. Rows: L1 M19 / L1 M17 / L2 M2 `at` from those (the curve part unscaled), L1 M1 A `at` 500 x S + 2302, L1 M1 B posture 3
(the copy: CLIP_VARIANTS / CLIP_ACTIONS; airLift reads the '#B' key).

### The rate audit of the emu_takeoff rows (2026-10-26, rom-map trap 169)

emu_takeoff stepped the motion frame by 1.0 whatever the rate. Every handler above was run again with the frame stepped by the
motion's rate (<archive>/gapY/ratediff.py, beside the old stepping): all at rate 1.0, the heights identical. The only rate call in
any of them, or in the functions they reach, is Rathian's (4, 4) / (4, 0x15) 0xcfb0ec (1.1, for e+0xb5f4 1 / e+0xb5f5 2), whose rows
are the constant RATH_LOW. No row changed.

## 7. Posture 4 -- the sink (effects lane A4, 2026-10-26; rom-map "Effects lane A4")

* **The rule (R).** 5.1's drawn offset holds in posture 4 too: e+0x1384 = P+0x5c x m (no P+0x1cc term: `0xbf76c` is posture 3's), and
  `0xa5de0..0xa5ea0` takes `beq 0xa5e80` when P+0x1ba == 4 -- **no decay**, so whatever the action set holds for the whole play. The unit is
  pinned to the ground (`0xbf284`, posture 4 in {0, 3, 4, 6}). So a posture-4 clip is drawn **P+0x5c x m below the ground** (P+0x5c negative),
  and every unit test (the shells' 900, the spawn-height ray, the floor) sees the ground at the unit.
* **What sets P+0x5c (R / E).** `0xbf700(e, s0)` (set, P+0x1b9 = 1), `0xbf71c(e, s0)` (+= s0 x dt), `0xbca24` (0, posture 1), script op 0x17
  (`0x9f6ec`: P+0x44 += P+0x5c, then 0), the per-frame script ramp `0xa09f0`. The usual s0 is **MoguriBaseOfs** (`0xbf62c` = dtbase +0xa8 =
  .dtb +0x32), set in the same update as `0xbc7f4(e, 4)`. Posture 4 is entered by `0xbc7f4(e, 4)`, a script's start mode 4 (`0xa1290`,
  `0xa1430..0xa145c`), script op 4 with arg 4 (`0x9f4c0`), the spawn arrival vt+0x224 (`0xb9104..0xb9190`) and the reset vt+0x1d8 mode 2.
* **The census of every class** (`<archive>/laneA4/p4audit/p4group.txt`: every action x phase under unicorn; control Blangonga (7, 0x14..0x16)
  matched to `0xdddbc8`): 37 em ids sink. Per em the clips and values are motion-states.js SINK4 (generated by `<archive>/laneA4/sink4/
  gen_sink4.py` + `gen_js.py`); MoguriBaseOfs per em in rom-map. Values left out (held from the previous action; tune / computed; changing at a
  phase not read; Nibelsnarf's dive ramp) are listed in `sink4_left.txt` and the generator's `skipped`. The clips per em and how a play reaches them (every play / the CLIP_ACTIONS sink play / not shown): `<archive>/laneA4/sink4/affected.txt`.
* **In the viewer (I: a viewer choice among ROM values, as section 3).** index.html airNow asks `sinkLift` first: `{ ground, unit } =
  P+0x5c x m` below the clip origin (negative: above it) -- the grid and the unit move up, the body stays where the clip draws it. A clip that
  a ground action also plays first (`players.py`: a phase-0 player setting no posture 4) sinks only on a play whose action (CLIP_ACTIONS /
  a copy) is one of its posture-4 actions. The FLOOR_AT_UNIT rule (burrowers' floor at the clip origin on pinned postures) stays for every
  other clip.
* **For another build (portable).** Find `0xa5db8`'s P+0x5c arm (the `x 0xbec34` multiply, the posture-4 `beq` skipping the decay), the
  setter pair (`0xbf700` / `0xbf71c`: a store to P+0x5c and P+0x1b9 = 1), and the MoguriBaseOfs getter (dtbase +0xa8); then list each class's
  posture-4 sites with the setter in the same update. 3DS builds hold the same .dtb field (+0x32), I.
