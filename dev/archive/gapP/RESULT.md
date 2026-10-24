# gapP -- Chameleos (em025_00) u:1, the sp_00 mode-0 floor landing on (7, 0x1f) L2 M45 f70: where the ground is

Shells lane helper, 2026-10-22. Nothing in the repo, rom-map, specs or the board was edited.
Tools (this folder): `jpos.py <mon> <list> <clip> [frames]` -- the viewer's pose glb sampled as three.js does (linear T, slerp R,
the glb's rest TRS; 24-step loop bounds like pose.js); `spawn45.py` -- the sp_00 0 spawn point at f69..71; `allmin.py` -- every
em025_00 clip's lowest-reach floor; `ctl.py` -- the positive control.

## Verdict

**The viewer's -355 is a stand-in, and the ROM's ground is the unit. But the ROM's ground does NOT make the gob land: with the
unit on its ground, joint 3 + offset at f70 is 458 x size BELOW that ground (the head and tongue go under the plane his feet stand
on). On a flat stage the game's own query cannot meet a floor the shell starts under, so u:1 is unreachable there -- the page's
"no landing, no cloud" is the right outcome, given for the wrong reason ("12 below" is the gap between two wrong numbers).**
The floor should still move to the unit on this clip (it is the ROM's ground, and every floor consumer -- the grid, the
background, effect snaps, the hunter target, base01's ground -- reads it), but that is a correctness fix, not a landing fix.

## (a) Facts

### READ (the consuming instructions read)

1. **The handler is 0xe0b70c(e, r5)** (push at 0xe0b70c; phase byte P+0x1a1 at 0xe0b734; serves (7, 0x1e / 0x1f / 0x20): r5 0 / 1 /
   2, the mapping from the census fb/cen11_ed025_b.txt -- E). Read whole to 0xe0bbc0:
   - phase 0 (0xe0b7ec): P+0x1a1 = 1; **`0xbc7f4(e, 0)` at 0xe0b7fc -- posture 0**; setMotion 0xafe84 r5 != 0 -> **0x22d (L2 M45)**,
     r5 == 0 -> 0x22b (L2 M43), blend 4.0, start 0.0 (0xe0bbf4); P+0x200 = u16(atan2 to the target block +0x1d0 x 10430.378 + 0.5)
     less the yaw P+0x54.
   - phase 1, r5 != 0 (0xe0b75c..0xe0b7e8): hit arms at f20 `0x7ded8(e, 0, 8)`, f42 `0x7df8c(e, 0)`, f60 `0x7ded8(e, 0, 8)`, f75
     `0x7df8c(e, 0)` (literals 0xe0baf4 42.0, 0xe0baf8 60.0, 0xe0bbc4 75.0); s16 = 0xe0bbc8 **70.0**. r5 == 0 (0xe0b878): the turn
     `0x76dd0(e, +-min(P+0x200 folded, 0x1555), 15, 30)`, s16 = 0xe0bbcc 64.0.
   - the crossing `0xb0974(e, s16)` (0xe0b8c4) -> phase 2, then r5 1 -> sp_00 0xb5 **mode 0** (0xe0b8fc, `0x3f883c(0x30)`, +0x2e
     0xffff); r5 2 -> sp_00 mode 3 (0xe0bafc); r5 0 -> joint 3 `0xc164c` + 0xbe518 + sp_13 0xb7 mode 2 (0xe0b970..0xe0bab0).
   - phase 2: `0xb09c8` (ended) -> vt+0x3dc.
   - **The only posture write in the handler is 0xe0b7fc.** Posture 0: the setter puts P+0x44 = P+0x5b4 on entry (0xbc8e4) and
     0xbf284 pins it every frame in 0 / 3 / 4 / 6 (rom-map "Air height" / "The ground under the unit" rows, R). So **during (7,
     0x1f) the unit's height IS the ground, P+0x44 = P+0x5b4**, the probe's pick under the unit (0xbdf2c, R).
2. **0xc15a4 is by gid** (rom-map row 55; row 1108: the index byte [[e+0x498] + idx]), so "joint 3" is the glb node `7:3` (gid 3,
   the head), not array index 3 (`3:100`, the first neck bone).
3. **base00's query is the shell's own segment**: +0x1000 = +0x40 before the step (0x3f98f4), +0x40 after; init sets +0x1000 =
   the spawn point (0x3f916c). 0x43ac8c -> 0x4a1e84 queries (B = +0x1000, A = +0x40). Nothing at init queries from the joint or
   the owner to the spawn point (shells.js init00 / move00 transcribe 0x3f8b80..0x3f918c and 0x3f9738 whole).
4. **The viewer's -355** (index.html monsterFloorY, 2785..2805): em025_00 is in neither FLOOR_AT_ORIGIN nor FLOOR_AT_UNIT; airNow()
   is null (no AIR_HEIGHT row for em025_00 -> airLift returns null at its first line); so y = min(clipRoot.y (0), pose.bounds.min.y)
   x world.scale.y. pose.bounds (render/pose.js play()) = every proxy bone's world point over 24 samples, `expandByScalar(0.12)`,
   ground lock OFF for monsters (index.html 3398 / 7634: `groundLock: state.groundLock`, default false -> anchorProxy dy 0).
   On L2 M45 the lowest sample is **gid 151 (tongue) at the f70.1 step, -431.2**; -12 pad -> **-443.2 x size**. The probe's
   numbers are this exactly at size 0.801: -443.2 x 0.801 = **-355.0**, spawn -458.2 x 0.801 = **-367.0**. rockInput floorY =
   monsterFloorY() / 0.01 (9977) and the shells' stage (stageOf) and own.ground (P+0x5b4, 9103) all take it.
   **So -355 is the lowest-reach stand-in (the tongue's lowest point over the loop), not P+0x5b4.**

### INFERRED (the motion data: the viewer's decoded LMT taken as the game's)

5. L2 M45, size 1, unit at the origin (`jpos.py em025_00 2 'Motion[45]' ...`, `spawn45.py`):
   - feet (gids 40, 50, 62, 80, 90, 13, 17, 21) at **y 15..22 on every sample, f0..f186**: the clip is authored on the plane y 0
     -- the unit's ground, as posture 0 says. Reference track 0 throughout; joint 0 y 143..253.
   - f70: joint 0 (-18, 149, 511); the neck 2 -> 100 -> 101 -> 102 -> 103 -> 3 runs straight down: y 191, 30, -54, -139, -223,
     **joint 3 (-25, -297, 874)**; tongue 150..153 at -388..-431.
   - spawn = joint 3 + its 3x3 x (0, -80, 140) (the offset turns to (3, -161, 6)): **(-21, -458, 881)** at f70 (-454 / -456 at f69 /
     f71). **The gob starts 458 x size below the ground he stands on, 8.8 m ahead.**
   - Why the decode is taken as the game's: the neck / head tracks are LMT comp 14 (bilinear quat 11-bit), the codec of 816 of
     the list's tracks and 38 of this clip's; each track's ref data equals the glb's f0 key (build/_refute_lmt/rlmt.py). A misread
     codec would break most clips. NOT checked against the game's own skeleton evaluation (not run).
6. Selection: (7, 0x1f) is issued by cmdtbl g1 s38 / s45, called (op 14 26 / 14 2d) from g0 s10 / s12 / s17 under op 1c
   (enraged, R row 1968), op 57 (kind 0xe -> 0x8e088 arm 0x8e1c4: the unit's and the target's x / z only -- R for the loads,
   the switch value's meaning I) and op 02 draws. No ledge / height op seen; g1 s38's own `1d 00 00 40` (0x84854 -> 0x86c10)
   test is NOT READ (it picks (2, 2) vs (2, 0xc) before the action). So nothing read restricts the action to a drop.
7. Consequence: on a flat stage the shell's segment starts 458 x size under the floor polygon and moves down; no crossing ->
   no landing (type 1 never), no cloud, no sp_01 4; it ends with its hit slot. A landing needs stage geometry below his head
   (a lower level ahead of him), which a one-plane stand-in cannot offer. That the attack's cloud is then unreachable on flat
   ground is odd for a design -- if Raven sees the gob land in the game on flat ground, the one number to re-check is joint 3's
   height at f70 in the decoded LMT (L2 M45, bones 2 / 100..103 / 3).

### Positive control (the general rule against shells that land)

`ctl.py`: the lowest-reach floor and the unit coincide (0.0) on Chameleos's own landing clips L2 M27 / M43 / M36 (sp_13: lowest
bone 14.1 / 13.3 / 14.0 -> min(0, lowest - 12) = 0) and Teostra's L4 M4 / M10 / M16 (17.1 / 17.7 / 12.3 -> 0): wherever no bone
goes below the origin the two rules give the same floor, so "floor = the unit on a pinned clip" cannot change a shell that lands
now. It changes only clips whose bones go below the origin (allmin.py: on em025_00, L0 M21 / 30 / 31 / 33 / 34 / 41 / 42 / 44 / 45,
L1 M2..M11, L2 M15 / 45, L3 M4 / 6 / 20 by more than 100) -- and there it is right only where the posture is READ as pinned.
Counter-case: **L2 M15 ((7, 8 / 0x24) phase 2, sp_00 1 at the OWNER's point + (-30, -380, 500))**: the body hangs to -829 under the
origin with joint 0 at y 22, i.e. the unit is above the ground on that clip; its posture is NOT read here. A monster-wide
FLOOR_AT_UNIT for em025_00 would put that floor at the unit and kill a gob that lands now (-380 vs floor -841 x S). Hence the
fix below is per clip.

## (b) The fix

**docs/index.html, the floor block** (patch in place; the file holds other agents' uncommitted work).

Anchor 1 -- after the line `const POSTURE_TABLE_OF = { em007_04: 'em007_00' };` add:

```js
// CLIPS READ AS PINNED on a monster that is not a burrower: the floor is the unit there too (the FLOOR_AT_UNIT rule, by clip).
// Chameleos (em025_00) L2 M43 / M45 -- (7, 0x1e / 0x1f / 0x20) 0xe0b70c: phase 0 sets posture 0 (0xbc7f4(e, 0), 0xe0b7fc) and
// nothing else in the handler writes it, so P+0x44 = P+0x5b4 throughout (0xbc8e4, 0xbf284). L2 M45 dips the neck 297 below his
// feet at f70 (the tongue to -431), which the lowest-reach rule took for the ground (-443 x size). His other below-origin clips
// (L2 M15's body hangs under a raised unit) keep the old rule until their posture is read. (shells lane gapP, 2026-10-22)
const FLOOR_AT_UNIT_CLIPS = { em025_00: ['2|Motion[43]', '2|Motion[45]'] };
```

Anchor 2 -- in `monsterFloorY()`, after

```js
    if (FLOOR_AT_UNIT.has(state.id) && clipPostureNow.some(p => PINNED_POSTURES.includes(p)))
      return clipRoot.position.y * (world.scale.y || 1) + world.position.y;
```

add:

```js
    const unitClips = FLOOR_AT_UNIT_CLIPS[state.id], act = pose.action;
    if (unitClips && act && act.getClip
        && unitClips.includes(state.list + '|' + String(act.getClip().name).replace(/_(start|loop)$/, '')))
      return clipRoot.position.y * (world.scale.y || 1) + world.position.y;
```

(`state.list` + `|` + the bare clip is CLIP_POSTURE's key form, as postureOf / stepBox use it.) Expected on L2 M45: floorY 0
(unit at the origin), spawn -367 at size 0.801 -> the gob 367 under the floor instead of 12: still no landing, no cloud -- the
ROM's answer on a flat stage. L2 M43's floor is 0 under both rules (no change). Nothing else moves.

Not changed, and why: FLOOR_AT_UNIT (monster-wide, posture-gated) -- em025_00 has no CLIP_POSTURE rows, so every clip would read
posture 0 (L2 M15 above); AIR_HEIGHT -- (7, 0x1f) is posture 0, no air height applies; the general "grounded monster's floor =
its unit" rule -- correct by the ROM wherever the posture is pinned, but only as safe as each monster's CLIP_POSTURE coverage
(the burrowers' 14 and Nakarkos / Zamtrios have it; Chameleos does not). **u:1 itself stays unreachable on the viewer's one
plane: named, not a gap to fill** (spawn 458 x size below the ground; base00's segment query cannot meet a floor it starts
under; a lower stage level is the only way it lands).

Also to correct (the owner of the spec, not done here): dev/elder-dragon-shells-spec.md 5, "Seen: L2 M45's gob (f70) starts about
13 below the viewer's floor (the head at the ground ...)" -- the head is 297 x size BELOW the unit's ground; the viewer's floor
there is the lowest-reach stand-in (tongue joint 151, -431 - 12 pad). The no-landing conclusion stands, for that reason.

## (c) rom-map rows

Section "Elder Dragon walk" beside row `0xe04b54 / 0xe09c78 / 0xe0bb98 / ...` (3148):

| address / thing | what | owner | status | detail |
|---|---|---|---|---|
| `0xe0b70c(e, r5)` (whole, to `0xe0bbc0`) | Chameleos (7, 0x1e / 0x1f / 0x20), r5 0 / 1 / 2 (census): phase 0 **posture 0** (`0xbc7f4(e, 0)` at `0xe0b7fc`, the handler's only posture write), setMotion 0x22b (L2 M43) / 0x22d (L2 M45) blend 4.0, P+0x200 = bearing to block +0x1d0 less P+0x54; phase 1 r5 != 0 hits f20 / f60 `0x7ded8(e, 0, 8)`, f42 / f75 `0x7df8c(e, 0)`, crossing f70 (`0xe0bbc8`) -> sp_00 mode 0 (r5 1) / 3 (r5 2); r5 0 turn `0x76dd0` f15..30 (+-0x1555), crossing f64 -> sp_13 2 at joint 3; phase 2 end -> vt+0x3dc. `0xe0bb98` is the post-create return, not the handler | uEm025_00 | R | gapP RESULT a1 |
| Chameleos L2 M45 f70, joint 3 + 3x3 x (0, -80, 140) | **458 x size BELOW the unit's ground** (joint 3 at (-25, -297, 874), tongue 151 -431, feet 15..22 all clip, reference 0): the sp_00 0 gob starts under the floor it stands on; on a flat stage base00's segment query (+0x1000 -> +0x40) cannot hit -> u:1 (+0x15d0, type 1), sp_01 4 and the cloud unreachable; a landing needs a lower stage level | uEm025_00 | I (decoded LMT, comp 14; game skeleton not run) | gapP jpos.py / spawn45.py |
| VIEWER: monsterFloorY on em025_00 L2 M45 | **-443.2 x size = the lowest-reach STAND-IN** (gid 151 at the f70.1 bounds sample - 0.12 pad), not P+0x5b4; the probe's -355 / -367 are it at size 0.801. By the ROM (posture 0) the floor is the unit; proposed FLOOR_AT_UNIT_CLIPS em025_00 L2 M43 / M45 (RESULT b). Withdraws elder spec 5's "13 below ... the head at the ground" | viewer | R (rule) / measured | gapP RESULT a4, b |
| `0x84c78` EMC op 0x57 | switch, kind 0xe (`movweq r3, #0xe`) -> `0x8e088` arm `0x8e1c4`: `0x710a8`, vt+0x168 (+0 / +8), `0x710d4` (+0x30 / +0x38) -- x / z only, the target's place about the unit; the compared value's meaning NOT read | shared | R (loads) / I (meaning) | gapP RESULT a6 |

Tooling table:

| tool | resolves | control | caveat |
|---|---|---|---|
| `<scratchpad>\gapP\jpos.py <mon> <list> <clip> [frames]` | joint world points (game units, size 1, unit at origin) from docs/poses/monsters/<mon>_<list>.glb; the viewer's 24-step lowest-reach floor | reproduces the page probe: floor -443.2 / spawn -458.2 x 0.801 = -355.0 / -367.0 | the viewer's decoded LMT, not the game's skeleton run |

Trap (numbered list): **a "below the viewer's floor" shell is two numbers, and the floor is usually the stand-in** -- on a clip
whose bones go under the origin the lowest-reach floor follows the lowest bone (Chameleos L2 M45: the tongue), so "12 below
the floor" read as "the head at the ground" when the head was 297 under the unit's ground. Measure the spawn against the UNIT
(the clip origin) on a posture-0 clip before reading the floor.
