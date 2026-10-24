# Rajang / Furious Rajang -- the fur strobe, checked against the ROM

Research agent for the Viewer agent, 2026-10-17. Raven: *"Both Rajangs: Double check the fur rendering, it is
currently strobing and I am not sure that is correct, consult the ROM."* Class uEm023_00 (variant byte `e+0xb5f5`:
0 = Rajang em023_00, 5 = Furious em023_05). Builds on `C:\MHGU-RE\offline\decode\notes\states-em023_05.md` sections
1.2 and 2 (the material machine), re-read here instruction by instruction.

Status: **R** = the consuming instruction was read; **I** = inferred; **NR** = not read (reason given).
Scratch (session-local): `<archive>\furprobe.mjs` / `furfix.mjs` (page checks run by `<archive>\run-check.mjs`
under `run_locked.sh`), `furshow.py` (prints them), `<archive>\fur\fdis.py` (ARM disassembly with literals),
`fur\strscan.py` (every pc-relative string a band forms, decoded word by word), `fur\blscan.py` (every B/BL to a
target in main.text).

## 0. Verdict

**The strobe is the viewer's, not the ROM's.** One material strobes: **`XfBAN__E1__m01_hairline`** (the raised
fur, part 11 / group 11). Its `fDiffuseColor` jumps between 0.6 and 1.0 on nearly every frame. The game sets
`Angry_Start` on it at the rage flip and **holds the clip's last frame (0.6, 0.6, 0.6), fTransparency 1, for as
long as the rage lasts**. It never plays the `Angry` clip that causes the strobe. Furious Rajang is born holding
that same last frame and never changes it.

Cause (the viewer): `render/monster.js` clipPicker, the start-then-steady rule (`:11217..11225`). It takes
`Angry_Start` and then hands on to the steady clip that `STATE_NAMES.enraged.steady` names (`:9779`, `'Angry'`).
On the hairline `Angry` is a **1-frame LOOPING clip whose two keys are (1, 1, 1) at frame 0 and (0.6, 0.6, 0.6) at
frame 1**. `stepOneSlot` samples it at `(t * 60) % 1` (`material.js:1072`, and the copy at `monster.js:11493`), so
every rendered frame lands on a different point between the two keys.

Fix, in the ROM's terms:
* **Rajang (em023_00):** the rage state is `Angry_Start` from the flip, held on its last frame, with no steady
  clip. Calm is `Angry_End` from the flip, held. With the existing table that means
  `SUPPRESS_CLIP.em023_00 = { XfBAN__E1__m01_hairline: ['Angry'], XfBAN__E1__m02_hair_a: ['Angry'] }`. clipPicker
  then takes `if (start >= 0) return [[start, tState]]`, which is that held clip.
* **Furious (em023_05):** `Angry_Start` at time 60 from spawn, never touched, whatever the rage or the motion. That
  means `ROM_SPAWN_CLIP.em023_05 = { XfBAN__E1__m01_hairline: 'Angry_Start', XfBAN__E1__m02_hair_a: 'Angry_Start' }`.
  A bare index at t0 = 0 is clamped to frameCount, which is the held frame.

Both were applied **in the page only** (`furfix.mjs`; docs/ untouched) and re-measured (section 4): the strobe is
gone on every state and clip tried. Rajang keeps the 60-frame fades at the flips. Furious's two materials hold
constant through everything, including L0 M5, where today the viewer restarts the fade.

## 1. What strobes in the viewer (measured, headless, the page's own loop)

`furprobe.mjs`: each State rung on L0 M1 idle (240 frames from the change), the 0 -> Enraged flip (120 f), Exhausted,
and clips L0 M5 / L2 M8 / L2 M24 / L1 M1 at the Enraged rung and L0 M5 / L2 M24 at rung 0. Logged every frame: every
uniform and colour of every material carrying clips, every mesh's effective visibility, joint 150's scale.

| item | result | st |
|---|---|---|
| `XfBAN__E1__m01_hairline` `m.color` (fDiffuseColor) | **changes on 231 / 240 (Rajang Enraged), 239 / 240 (Armor Mode), 239 / 240 (Furious Enraged), 239 / 240 (Furious Armor Mode) frames**, 130..175 distinct values between 0.32 and 0.96 (linear; 0.3185 = 0.6 decoded) -- the strobe. On every clip tried at an enraged rung (L2 M8 179 / 180, L2 M24 179 / 180). Starts once Angry_Start's 60 frames have run | R (measured) |
| `XfBAN__E1__m02_hair_a` | no strobe: its `Angry` is (0.6, 0.6, 0.6) at both keys | R (measured) |
| `XfB__m03_eye` | no strobe; it ramps 1 -> 2 (Angry_Start) and holds `Angry` (2.0) while enraged -- see 3.4 | R (measured) |
| `XfBAN__E1__m00_hair` / `XfB_N__E0__m00_body` (PumpUp / Normal) | constant (1-frame non-looping clips) | R (measured) |
| mesh visibility (every part / material) | constant within every run -- no part set toggles | R (measured) |
| joint 150 (ROM_RAGE_FUR) | (7, 11, 1) constant while enraged; the 30-frame ramp-out only on leaving rage | R (measured) |
| effects (efl particles) | not probed: the report was about the fur, and nothing above points at an effect | NR |

The clips, as the viewer holds them (`docs/materials.json` `monsters/em/023_00`, the same as the probe's dump):

| material | clip | frames | loop | fDiffuseColor keys | fTransparency |
|---|---|---|---|---|---|
| m01_hairline | Normal | 1 | yes | 0.6 @0, 0.6 @1 | 0 |
| m01_hairline | Angry_Start | 60 | no | 1.0 @0, 0.6 @40, 0.6 @60 | 0 -> 0.4 @40 -> 1 @60 |
| m01_hairline | **Angry** | **1** | **yes** | **1.0 @0, 0.6 @1** | none |
| m01_hairline | Angry_End | 60 | no | 1.0 @0, 1.0 @60 | 1 -> 0 |
| m02_hair_a | Angry_Start / Angry / Angry_End | 60 / 1 / 60 | no / yes / no | 0.6 throughout | 0.2 -> 0.4 -> 1 / none / 1 -> 0.2 |
| m03_eye | Angry_Start / Angry / Angry_End | 60 / 1 / 60 | no / yes / no | 1 -> 2 / 2 / 2 -> 1 | none |

None carries the auto bit.

## 2. What the ROM does

| addr | what | st |
|---|---|---|
| `0xb09ae8` setMatClip(m, slot, idx) | `m[+0x50 + 8*slot] = u16 idx; m[+0x54 + 8*slot] = 0` -- index and time, nothing else; no chaining field | R |
| `0xb09a3c` clearAllSlots(m) | the four slot words to 0xffff and times to 0, then every clip with `clip+4` bit 1 (auto) into the next free slot | R |
| `0xb0cf1c..0xb0cfd4` the evaluator's time step, per slot (r2 = 0..3) | `time += [+0x20] * dt` (`vmla` at `0xb0cf30`); `time >= frameCount` and `clip+4` bit 0 clear -> `time = frameCount` (`0xb0cf80`) -- **clamped and held, the clip index untouched**; bit 0 set -> `time -= frameCount` until below (`0xb0cf88`); `time < 0` -> 0, or wrapped up for a loop | R |
| `0xde1ae0` vt+0x1d8 (set-up) | as the note's 1.2: materials with MRL id 0x33 / 0x34 / 3 go to `ctl+0x34 / +0x38 / +0x3c`. Ids 0x33 / 0x34 get slot 0 = `names[ctl+0x58]` (`0xde1cbc` / `0xde1ccc`) at time `s16` (`0xde1cd0`), and their `Angry_End` / `Angry_Start` indices are cached at `ctl+0x40/0x44 + 8fp`. Variant 5: `ctl+0x58 = 1`, `s16 = 60.0` (`0xde1b1c`); else 0 and 0.0. `names` = `0x17b2720` = {Normal, Angry_Start, Angry_End, PumpUp} | R |
| `0xde2888` vt+0x210 (the machine) | `variant == 5` -> skip to the sets (`0xde28a0`). Else, on the rising edge of `0x81670` (`ctl+0x58` 0 -> 1): `ctl+0xc = 60`, slot 0 = the cached `Angry_Start` on `+0x34` / `+0x38` / `+0x3c`, time 0 (`0xde2914..0xde2978`), `ctl+0x75 \|= 2`. On the falling edge: the same with `Angry_End` (`0xde29cc..0xde2a30`), `\|= 1`. Nothing else ever sets a clip on these materials | R |
| `0xde3da8..0xde3e98` vt+0x1dc, the `ctl+0x75` bookkeeping | for bits 1 / 2: `0xc2210(e, names[1 + (b & 1)], mat, 0)` on `+0x34` and `+0x38`; when both return 0, clear the bits and call `0x88bcf8`. **A query only, no clip set** | R |
| `0xc2210` | 1 while `mat` slot `r3`'s time < the named clip's frameCount, else 0; writes nothing | R |
| `0x88bcf8` | releases 16 objects at `e+0x260` (stride 0x20), zeroes 0x200 bytes, stamps `0xbeaf` -- touches no material slot | R (what it is for: I) |
| the whole band `0xde1a08..0xdee058`, every pc-relative string (12,659 of 12,692 words decoded) | clip names formed: **Angry_End, Angry_Start, Normal, PumpUp** -- never `Angry`. **Control:** the same scan over Akantor's `0xe36000..0xe38000` finds `'Angry'` at `0xe37810`, his Angry_Start -> Angry hand-off (rom-map, `0xe37560`) | R |
| every `bl/b` in main.text to `0xb09ae8` from the band | 12 sites: `0xde1ccc`, `0xde1d6c` (set-up), `0xde2914 / 2940 / 296c` (rage), `0xde29cc / 29f8 / 2a24` (calm), `0xde2ad8 / 2b04 / 2b60 / 2b8c` (pump). `0xb08b44` 5 sites, `0xb09a3c` none, `0xc2210` 4 (all in vt+0x1dc) | R |
| shared `0x74094..0x740b8` | sets `"overheat_End"` (`0x1550407`) only on a material whose MRL id is 4 (`[m+0x18] & 0x3fc00000 == 0x1000000`) with a clip list. Rajang's id-4 material, `m04_pumpup_fur`, has none, so it is skipped | R |
| `0x92c084` (a command interpreter, 32 call sites from the jump table at `0x92d450`; clip name from a data block `[r4+0xc]+8`, material filter on MRL id `[r4+8]`) | could set any clip by name from data; who runs it (the owner of the vtable slot `0x183b3bc` -> `0x92d178`) was not traced | NR (owner unidentified) |

So, for **Rajang**: Normal from spawn. At the rage flip, `Angry_Start` from time 0: hairline (1, 1, 1) -> 0.6 by
frame 40, fTransparency 0 -> 1 by frame 60, and the 60-frame cross-fade sets 18 / 13 / 19 run over the same
window. After that **the slot holds frame 60, (0.6, 0.6, 0.6), fTransparency 1, unchanged until rage ends**. At
the calm flip, `Angry_End` from 0, held at 60 (by then set 6 hides group 11 and set 2 hides group 3). For
**Furious**: `Angry_Start` at time 60 from spawn, held forever. Neither variant pulses or flickers. The game's
rate is 0: the fur holds.

## 3. Item by item

| # | item | ROM | viewer today | st |
|---|---|---|---|---|
| 3.1 | Rajang, enraged, hairline colour | held 0.6 (Angry_Start f60) | 1-frame `Angry` loop: random 0.6..1.0 each frame | R |
| 3.2 | Rajang, enraged, hair_a | held Angry_Start f60 (0.6, fTransparency 1) | `Angry` (0.6, no fTransparency track -> the shipped value, measured 1) -- same look | R |
| 3.3 | Furious, both furs | Angry_Start f60 from spawn, untouched by rage, motions or death (`0xde28a0` skips the machine) | Angry_Start runs from the mount, then `Angry` strobes. A rage-entry row (L0 M5) restarts the fade, and a `dead` row plays Angry_End | R |
| 3.4 | the eye `XfB__m03_eye` | `+0x3c` is written twice, first the eye (.mrl rec 0 / .mod index 1) and then `m03_pumpup_arm` (rec 5 / .mod index 6), so the machine's third `setMatClip` lands on pumpup_arm, which has no clip list. **The eye never gets a clip and draws its authored values** | ramps 1 -> 2 at rage and holds 2 (`Angry_Start` -> `Angry`), on both variants | **I** -- the order of the material array `[e+0xf8]` was not read; both orders that could plausibly apply put the eye first. Not the strobe; left to Raven |
| 3.5 | Rajang, calm after rage | Angry_End held at f60 | Angry_End for 60 f, then `Normal` | R. Invisible: groups 11 and 3 are hidden by then |
| 3.6 | the 60-frame cross-fade sets 18 / 13 / 19 | applied while `ctl+0xc` > 0 | not shown (parked on the board, Raven 2026-09-19) | R (note), unchanged |
| 3.7 | ROM time units (does the game's 60-frame clip take 1 s or 2 s?) | `[+0x20] * dt` was not followed to its source | the viewer uses MAT_FPS 60 | NR -- does not bear on the strobe |
| 3.8 | the `Angry` clip if it were ever played | at whole-frame steps it would sit on key 0 (1.0), not strobe | -- | I (dt not read, 3.7) |

## 4. The fix, measured (`furfix.mjs`, the two table entries set in the page)

| run | hairline `m.color` | hair_a / hairline opacity |
|---|---|---|
| Rajang Enraged / Armor Mode idle, 240 f | **constant** | constant |
| Rajang 0 -> Enraged flip, 120 f | 57 changes, all inside the 60-frame Angry_Start fade, then constant at 0.3185 (= 0.6) | 0 -> 1 over 60 f, then 1 |
| Rajang L0 M5 / L2 M8 / L2 M24 enraged | fade only (L0 M5's rage row), else constant | -- |
| Furious every rung, every clip (incl. L0 M5) | **constant** (no variation logged at all) | constant |

The eye (3.4) still ramps in these runs; that table entry was not part of the fix.
