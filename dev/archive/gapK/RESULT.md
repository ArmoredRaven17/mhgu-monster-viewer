# gapK -- Kecha Wacha (em065_00) u 12: the hang drop's height (helper, 2026-10-21)

Tags: **R** = the consuming instruction read; **E** = ROM-run; **I** = inferred; **NR** = not read.
I edited no repository file. My scripts are in this folder: `lit.py` (literal words), `ref.py` (a glb's `reference` / joint-0
tracks), `fk.py` (the lowest bone per frame), `scanac.py` (a store scan).

## Answer in one paragraph

The drop is made by `0xf51fc4` (r1 1 for (7,0x15) / (7,0x48); r1 2 for (7,0x16) / (7,0x49), which make sp_01 3 instead). It
happens in **phase 6, L2 M117, f33**. In that phase he is in **posture 1**, so he really is airborne. Nothing pins him and
he clings to no surface. The class itself sets the height:

- When he enters M126 (the hang), it writes `P+0x44 = P+0x5b4 + 585 x S`.
- When he enters M117, it subtracts `250 x S`. So the unit sits **335 x S above the ground at M117 f0**.
- From f30 the class adds a hop: vy 26, ay -1, not scaled by size.

So at f33 the unit is about **335 S + 96**. The drop point is that minus 300 S, which is **about 131 above the ground at
size 1**. That is above the ground, so the shell falls and lands, and its type-1 contact starts u 12.

The viewer has no row for Kecha:
- `AIR_HEIGHT` / `airLift` has no em065_00 entry, and neither has `CLIP_POSTURE`.
- So `unitGamePos` takes the unit's Y from the mixer root, which is the viewer's floor on these clips. The lowest bone on
  M117 is 18..396 above the root, so `monsterFloorY` = the clip origin.
- The drop therefore starts **300 S under the floor**.

These clips put the height in their `reference` track (M126 a constant 584.5, M117 a constant 400.2). The viewer draws that
track but does not take it as the unit. The missing input is a clip row whose meaning is "the unit is H above the clip origin,
and the ground is at the origin". The existing `at` arm means the opposite: "the origin is the unit, and the ground is H below
it". Using `at` here would push Kecha's floor H further under a body the viewer already draws at the reference height.

## (a) READ facts

### The dispatch (R)

The status-7 table is `0xf54540`, indexed n-1 (`0xf5451c..0xf5453c`).

| status | stub | call |
|---|---|---|
| (7,0x15) | `0xf547d8` | `0xf51fc4(e, 1, 0)` |
| (7,0x16) | `0xf547e4` | `(e, 2, 0)` |
| (7,0x48) | `0xf54aec` | `(e, 1, 1)` |
| (7,0x49) | `0xf549e8` | `(e, 2, 1)` |
| (7,0x14) and (7,0x4d) | `0xf54684` | `(e, 0, 0)` |

r2 = 1 means: at M117 f40, `0x768c8(e, 7, 0x4a)` (`0xf5274c..0xf52774`).

### The phases (`P+0x1a1`, jump table `0xf52024`, 8 entries) (R)

The literals are pc-relative words, read with `lit.py`.

- **Phase 0** (`0xf5206c`):
  - posture 0 (`0xbc7f4(e,0)`).
  - **L2 M114** (`0x272`, blend 4.0).
- **Phase 1** (`0xf520a8`), at M114's end:
  - **posture 3** (`0xbc7f4(e,3)`).
  - `0xbf700(210.0)`: P+0x5c = 210.
  - **L2 M115** (`0x273`).
  - `0x7bd18`.
  - P+0x14 = 75.0.
  - P+0x24 = 75 x -0.0625 = -4.6875.
  - P+0x18 = clamp(dist - 600, -200, 1100) / 28.8 (when r1 = 0: dist - 450). dist is the horizontal distance to the target
    P+0x1d0 / +0x1d8. The literals are `0xf52440` 210, `0xf52444` -600, `0xf52448` -450, `0xf5244c` -200, `0xf52450` -0.0625,
    `0xf52454` 1100, `0xf52458` 28.8.
- **Phase 2** (`0xf5219c`):
  - `0x7a820` (integrate).
  - `0xbf71c(e, P+0x14)`: P+0x5c += vy.
  - The jump lives in the DRAWN offset. The unit stays pinned to the ground in posture 3 (`0xbf284`).
  - Apex: 210 + 75²/(2 x 4.6875) = 810.
  - **r1 != 0**, once vy < 0 and P+0x5c <= 585.0 (`0xf5245c`), the following runs (`0xf52200..0xf52258`):
    - phase = 5.
    - `0xbc984(e, 0.0)`: posture 3 -> **1**, and P+0x44 += 0.
    - **`P+0x44 = P+0x5b4 + 0xbe518(e) x 585.0`**, where 0xbe518 = S.
    - `0xbf700(0.0)`.
    - **L2 M126** (`0x27e`, blend 0).
    - Then P+0x14 = 0, P+0x24 = 0, P+0x28 = P+0x18 / -20 (`0xf52664..`).
  - **r1 = 0**, the same test against 585.0 (`0xf52818`):
    - phase 3.
    - `0xbf700(585.0)`.
    - L2 M126, staying in **posture 3**.
- **Phase 3** (`0xf5225c`, r1 = 0 only):
  - `0xbf700(585)` every frame.
  - At M126 f40, `0x76c08(e, 0x222, 0)`.
  - At M126's end: P+0x5c = 0, posture 0, **L2 M116** (`0x274`), then `0x7ded8(e, 0, 0x22)`.
  - Phase 4 = `0xf52044`: at the end, vt+0x3dc.
  - **The r1 = 0 path never stores 5 or 6, so it never reaches the drop.**
- **Phase 5** (`0xf52338`):
  - `0x7a820`.
  - A negative P+0x18 is set to 0.
  - At **M126 f20** (`0xb0968(e, 1, 0, 20.0, 0.0)`) the following runs (`0xf52390..0xf52430`):
    - phase 6.
    - **L2 M117** (`0x275`, blend 0).
    - `0x7bd18` (velocity and acceleration zeroed).
    - Then **P+0x40 += -9 S sin Y, P+0x48 += -9 S cos Y, P+0x44 += -250.0 x S** (`0xf52814`).
  - **So H = 335 S at M117 f0.**
- **Phase 6** (`0xf52460`):
  - At f30 (`0xb0974(30.0)`): P+0x14 = 26.0, P+0x18 = -10.0, P+0x24 = -1.0. These values are raw, not scaled by size.
  - `0x7a820` every frame: `pos += dt R v + 0.5 dt² R a; v += dt a` (`0x7a994..0x7aa98`, read). It rotates by X / Z only in
    postures {1, 2, 4, 5, 6}, mask 0x76.
  - At **f33** (`0xf527dc` = 33.0) the point is (445 sin Y, -300, 445 cos Y) x S from P+0x40 (`0xf527e4` 445, `0xf527ec`
    -300). r1 == 1 gives sp_00 0 (`0x116`, `0x3f883c`); r1 == 2 gives sp_01 3 (`0x117`).
  - Landing: vy < 0 and `0xbf52c(e, 212.0)` (`0xf52810`), then phase 7, posture 0, **L2 M118** (`0x276`). Phase 7 then ends at
    vt+0x3dc.

### The height through the drop path (size S, the game's `P+0x1ac x P+0x1b0`)

| clip | posture | unit `P+0x44 - P+0x5b4` | drawn offset e+0x1384 | tag |
|---|---|---|---|---|
| L2 M114 | 0 | 0 | 0 | R |
| L2 M115 | 3 | 0 (pinned) | P+0x5c x m: 210 -> 810 -> 585 (P+0x1cc = FlyOfs = 0) | R |
| L2 M126 (f0..20) | **1** | **585 S** | 0 | R |
| L2 M117 | **1** | **335 S** to f29; then 335 S + 26d - d²/2, d = f - 29 | 0 | R (values) / I (d: the update order) |
| L2 M118 | 0 | 0 | 0 | R |

- **At the drop (f33, d = 4): H = 335 S + 96**, and the point is **35 S + 96** above the ground (131 at S = 1).
  - The values and the integrator are **R**.
  - The 4 integration steps between the f30 and f33 tests are **I**. They assume one motion frame per update, with the action
    running before the motion advance. `e+0x1c` and the frame order are not read. With 3 or 5 steps the point is 73.5 or 117.5
    instead, still above the ground.
- (7,0x14) and (7,0x4d) play M126 in **posture 3**: unit 0, drawn 585 x m. **R.**
- Kecha's **FlyOfs** (`.dtb` +0x22) = **0.0** and **TenjoOfs** (+0x2e) = **0.0**. **R** (file). The controls read the same
  offsets: em077 500, em079 300, em003 400 / 400.
- **No `P+0x92c` store** exists in the class band `0xf48e20..0xf57cd0`. **R.**
  - The scan was the text form `#0x92c`. The positive control is Seregios's `0xfe31b0 str r1, [r0, #0x92c]`, found the same way.
  - So `0xbf284`'s posture-1 floor is the bare ground, which never touches 335 S or more.
  - The posture-1 ceiling clamp (`P+0x44 <= P+0x980 - TenjoOfs x S`, `0xbf330..0xbf364`) depends on the stage. With TenjoOfs 0
    a real ceiling under 585 S would cap him. The viewer has no stage ceiling, so this is not modelled.
- **There is no cling surface.** The hang is a posture-1 unit held by v = 0 at a fixed 585 S above the probed ground. No
  ceiling or wall pick is involved (posture 6 is never set). **R.**
- M117 / M126 / M115 / M116 / M118 are set only at `0xf523ac` / `0xf5224c`, `0xf5265c` / `0xf520e8` / `0xf52318` / `0xf527c4`
  in the class band.
  - The control: the same grep finds every phase site, and `0xf563c8` / `0xf566f8` are motion-id compares in frame handlers,
    not sets.
  - EMC scripts were **not checked**.

### The clips (glb, `docs/poses/monsters/em065_00_2.glb`; `ref.py` / `fk.py`)

- **The `reference` Y is constant on each clip:** M115 255.4, **M126 584.5**, **M117 400.2**; M114 and M118 are 0.
- **Joint 0 relative to the reference:** M126 -18 .. -333, M117 -82 .. -91, falling to 0 by f70.
- **The lowest bone above the clip origin:** M117_start 18..396, M126 23..495. So the viewer's current floor is the origin.
- **The constant reference is the authored height above the ground.**
  - M126's 584.5 equals the class's 585.0.
  - Continuity backs this: M115 -> M126 hips go 585 -> 567, and M126 f20 -> M117 f0 go 287 -> 253. Both fit the unit plus
    the pose without the reference.
  - If the reference were added on top of the unit, the hips would jump about 300 at each change.
  - **I**: the root step's first frame at a new motion (air-height.md 1.2, `[layer+8]` bit 0 / `+0xac..0xb4`) is still **NR**.
- **Two smaller differences in the game's unit, not covered by the fix below:**
  - It moves 9 S back at the M117 entry and -10 per frame along the facing from f30: about -49 at the drop. The viewer's x / z
    come from M117's reference, which is 0.
  - Its body is drawn at 335 S (+ hop) + the pose, against the viewer's authored 400.

## (b) The fix

The fix is a clip row giving the unit's height above the clip origin, with the ground at the origin, plus a guard so Kecha's
unlisted clips never fall into the standard-takeoff default. It touches **`docs/render/motion-states.js`**, two places.

**1. In `airLift`** (anchor: `export function airLift(monId, list, clip, frame, size, sizeBase = 1, air = true){`), replace

```js
  if (c && c.at) return { ground: c.at(frame, size), unit: 0 };
  if (!air) return null;
```

with

```js
  if (c && c.at) return { ground: c.at(frame, size), unit: 0 };
  // `hang(f, S)` -- a clip that AUTHORS its height on the `reference` track (drawn by the viewer as part of the pose): the
  // clip origin is the GROUND and the unit is H above it (Kecha Wacha's hang drop, below)
  if (c && c.hang) return { ground: 0, unit: -c.hang(frame, size) };
  if (!air || t.standard === false) return null;
```

**2. In `AIR_HEIGHT`** (anchor: the line `em081_00: { flyOfs: 500 }, em081_04: { flyOfs: 500 },`), add after it

```js
  // KECHA WACHA (uEm065_00): the hang drop 0xf51fc4 ((7, 0x15) / (7, 0x48) sp_00 0, (7, 0x16) / (7, 0x49) sp_01 3 at L2 M117
  // f33). Phase 2 -> 5 (0xf52200..0xf52258): posture 1 (0xbc984(0)), P+0x44 = P+0x5b4 + 585 x S, v 0 -- L2 M126; at M126 f20
  // (0xf52390..0xf52430): L2 M117, 0x7bd18, P+0x44 -= 250 x S (335 S); f30 vy 26, ay -1 (raw, 0xf52460..), integrated by
  // 0x7a820 (d = f - 29: one step per frame, the update order I). No surface, no FlyOfs (0.0), no P+0x92c in the class.
  // His clips carry that height on the `reference` track (M126 584.5, M117 400.2), which the viewer draws: `hang`.
  // (7, 0x14) / (7, 0x4d) play M126 in posture 3 instead (unit on the ground, drawn 585 m): the drop path's value stands.
  em065_00: { flyOfs: 0, standard: false, clips: {
    '2|Motion[126]': { hang: (f, S) => 585 * S },
    '2|Motion[117]': { hang: (f, S) => { const d = f - 29; return 335 * S + (d > 0 ? 26 * d - 0.5 * d * d : 0); } },
  } },
```

### Effect

- **`airNow`** (index.html) returns `{ ground: 0, unit: -H }` on those two clips and null on every other Kecha clip (the
  `standard: false` guard).
- **`monsterFloorY`** returns the clip origin, as it does now (`- air.ground * 0.01` = 0).
- **`unitGamePos`** returns origin + H (`- air.unit`).
- **The drop:** `spawn065` builds `P[1] - 300 x S`, which is now H - 300 S above the floor: 131 at S = 1, f33. The shell
  falls, its type-1 contact runs `landing065`, and that starts u 12.
- **Unchanged:** the Rath / Seregios / Malfestio / Astalos rows. `standard` is undefined for them, and `hang` is absent.

### Caveats

- **M117's `_loop`:** `airLift` strips `_start` / `_loop` and the viewer's loop frame restarts at 0, so the 1-key hold reads
  H = 335 S. In the game he is between the hop's apex and the 212 S landing there. No shell reads it.
- **The other two monsters with `reference` constants** are not touched: Seregios L1 M30 (500) and L2 M45 / M46.
- **Not done, and named:**
  - the unit's x / z drift (-9 S back, then -10 per frame from f30);
  - drawing the body at the ROM's unit rather than the authored reference.

  Both are the Viewer's call.

### Side finding for the shells lane

`SHELL_DATA.em065_00.actions` lists **(7,0x14) / (7,0x4d)** as twins of (7,0x16): sp_01 3 at M117 f33. They run r1 = 0, which
never reaches phase 6, so **they make no shell**. Their real chain is M114 -> M115 -> M126 (posture 3, drawn 585) -> M116 ->
end. The census forced phase 6. Remove them from that row's `also`, leaving `[[7, 0x49]]`.

The chain "M114 -> M115 -> M116 -> M117" in the em065 shells spec section 1 / the rom-map row is also wrong for 0x15 / 0x16 /
0x48 / 0x49: it is **M114 -> M115 -> M126 -> M117 -> M118**. M116 is the r1 = 0 path's.

## (c) rom-map rows (proposed; I did not edit rom-map)

```
| `0xf51fc4` (status 7 `0xf54540`: (7,0x15) `0xf547d8` r1 1 / (7,0x16) `0xf547e4` 2 / (7,0x48) `0xf54aec` 1+r2 1 / (7,0x49) `0xf549e8` 2+r2 1 / (7,0x14),(7,0x4d) `0xf54684` 0) | Kecha Wacha's hang drop, phases P+0x1a1 (table `0xf52024`): 0 posture 0 L2 M114; 1 posture 3, P+0x5c 210, L2 M115, vy 75 / ay -4.6875, fwd clamp(dist-600,-200,1100)/28.8; 2 P+0x5c += vy (`0xbf71c`); falling through 585 -> r1 != 0: posture 1 (`0xbc984(0)`), **P+0x44 = P+0x5b4 + 585 S**, P+0x5c 0, L2 M126 (phase 5); r1 0: posture 3, P+0x5c 585 held, L2 M126 -> posture 0 L2 M116 -> end (never phase 6: no shell); 5 at M126 f20 -> L2 M117, `0x7bd18`, unit -9 S back, **-250 S** (H 335 S); 6 f30 vy 26 / vz -10 / ay -1 (raw), f33 the drop (sp_00 0 r1 1 / sp_01 3 r1 2) at P+0x40 + (445 sin, -300, 445 cos) S, landing vy<0 + `0xbf52c(212)` -> posture 0 L2 M118 | uEm065_00 | R (phases, literals) / I (update count f30->f33) | gapK RESULT; motion-states.js AIR_HEIGHT.em065_00 (if built) |
| em065_00 `.dtb` +0x22 FlyOfs / +0x2e TenjoOfs | 0.0 / 0.0 (posture 3's P+0x1cc = 0; the jump is drawn by P+0x5c x m alone; posture-1 ceiling clamp at the ceiling itself) | data | R (file; controls em077 500, em079 300, em003 400/400) | gapK |
| uEm065_00 `P+0x92c` | no store in `0xf48e20..0xf57cd0` (control: Seregios `0xfe31b0` found by the same text scan): his posture-1 floor is the bare ground | uEm065_00 | R | gapK |
| L2 M126 / M117 / M115 `reference` Y (em065_00_2.glb) | constant 584.5 / 400.2 / 255.4: the AUTHORED unit height above the ground (M126 = the class's 585); the viewer draws it, `unitGamePos` takes Y from the mixer root -> the unit was on the floor and the drop 300 S under it | data / viewer | file (R) / that the game omits it from the pose: I (continuity) | gapK |
```

**WITHDRAWN table** (two entries):

```
| shells.js SHELL_DATA.em065_00 (7,0x16) row `also: [[7,0x14],[7,0x49],[7,0x4d]]` | (7,0x14)/(7,0x4d) make sp_01 3 at M117 f33 | they run `0xf51fc4` with r1 0, whose phase 2 goes to 3 -> 4 (end), never 6; the census forced phase 6 | `also: [[7, 0x49]]` |
| em065 shells spec 1 / rom-map `0xf5251c` row chain "L2 M114 -> M115 -> M116 -> M117" | the drop path's clips | phase 2 -> 5 plays 0x27e = M126; M116 (0x274) is only the r1 0 path's end | M114 -> M115 -> M126 -> M117 -> M118 |
```

**Trap** (proposed): a constant `reference` Y can be the authored height of an airborne unit (Kecha Wacha's hang clips). The
viewer draws it as pose, but `unitGamePos` keeps the mixer root's Y. An `AIR_HEIGHT.at` row (ground H below the origin) is
the wrong sign for such a clip. Use `hang`, with the ground at the origin and the unit H above it.

## Not read
- The root step's first frame at a new motion (`[layer+8]` bit 0 skip at `0x951d88`, who sets it): whether a constant
  reference adds a jump to P+0x44 at M126 / M117 entry. The ROM's own 585 / -250 writes and the clip continuity say it does not.
- `e+0x1c` (dt) and where in the update the action runs relative to the motion advance. Together these give the f30 -> f33
  step count.
- `0x76c08(e, 0x38e / 0x222, 0)` (phase 2 / 3 calls).
- Any EMC script that plays L2 M117 / M126 outside `0xf51fc4`.
