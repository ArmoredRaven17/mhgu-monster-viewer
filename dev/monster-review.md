# Per-monster review

Raven looks, reports, and judges. I diagnose from the ROM or the source and keep the cause here,
not scattered through the render code. **A finding is only closed when Raven says the render is
right** — no entry here is closed on my reading of a picture.

Two columns matter more than the rest:

* **CAUSE** — `shared` if the fault is a code path (fix the mechanism, and count how many monsters
  use it), `data` if the fault is a value for this monster alone (a name, a hit-zone row). Most
  "monster-specific" symptoms so far have turned out to be `shared` with sparse usage.
* **STATUS** — `open`, `diagnosed` (cause found, not fixed), `fixed, unjudged`, `closed`.

**This is a RUNNING list, not a one-off.** Pass 1 was 27 reports in one sitting; there will be
more. New reports go under a new `## Pass N` heading with the date, and the status board above is
updated at the same time - a report either extends a cause already listed there or opens a new
one. So far almost every symptom that looked monster-specific has extended an existing cause, so
opening a new one is itself worth noticing.

Nothing here is closed on my reading of a render. `diagnosed` means the mechanism is found and
shown; only Raven moves an entry to `closed`.

---

## Status board

Kept current as reports come in. **Causes** are what to fix; **entries** below carry the evidence.
A new report either extends a cause here or opens a new one - if it opens a new one, that is worth
noticing, because so far almost nothing has.

### Causes, by weight

| # | cause | monsters | state |
|---|---|---|---|
| A | **Clip selection.** Two hard-coded name lists reach 9 of 136 clip names. Four shapes: case-only miss; name absent with no auto bit (nothing plays); unnamed clips with no auto bit; auto bit present so one state is stuck. | ~20 | diagnosed, unfixed |
| B | **Alpha disagreement.** `checks.xfbaAlpha`: 495 agree, **66 do not**, in both directions. Name-says-alpha-drawn-opaque gives solid cards; feature-says-alpha-name-does-not gives black patches. | Kirin, Gore x2, Najarala | diagnosed, needs a decision |
| C | **No HDR path.** No bloom pass at all (the Armor Viewer has `fx.js`); no tone mapping, so anything above 1.0 clips flat to white. | library-wide | diagnosed, unfixed |
| D | **Joint-0 rigid skins.** Weightless primitives bind to the root instead of the bone the `.mod` names. The fix exists but `mod_to_gltf` skips regeneration when the `.glb` is present, so stale assets keep it. | Glavenus, Deviljho, + unknown | strong lead |
| E | **Empty scene.** Refraction samples a buffer holding only the monster; 391 materials want a `GlobalCubeMap` that does not exist. | Astalos x2, Brachydios? | needs Raven's decision |
| F | **Parts machinery.** Exclusive pairs and standalone toggles need a grouping layer; some clusters sit outside the rest-set system. | Yian Kut-Ku, Nibelsnarf, Alatreon | diagnosed |
| G | **Data defects.** One-off faults in the shipped data. | Soulseer (empty groups), Furious Rajang (`sharesModelOf`) | diagnosed |
| H | **My regressions.** | see below | live |

### Open - cause not established

* **Bloodbath Diablos** - rage regression; `clipPicker` already carries a fallback written for it
* **Diablos / Ukanlos / Cephadrome** - texture quality; resolution RULED OUT, webp encode density is the live lead
* **Grimclaw Tigrex** - enraged albedo layers
* **Old Fatalis** - chest effect when the chest break is on
* **Teostra** - effects generally; carries `Effect_Loop`, in neither list
* **Zinogre** - "missing mesh" not confirmed
* **Cephadrome** - what the "wounds" actually are; no second albedo layer exists on it
* **Glavenus** - off-centre sword mesh, likely cause D

### My regressions, live

* **Blobification** (`51a71d0`) - cut-out fragments write full coverage, so soft ramps fill solid.
  Savage, Deviljho, Zinogre. `__view.cutSolid(false)` reverts it live. UNRESOLVED.
* **Part toggles at highest index** (`5366bb2`) - hid whole clusters; corrected in `a895e1f`.
  Agnaktor and Royal Ludroth were both this. RESOLVED.

### The fixes, in leverage order

1. **Case-insensitive clip match** - one line, invents nothing (the ROM supplies both spellings),
   fixes 9 monsters outright including Ahtal-Ka completely.
2. **Select clips by HASH, not name** - what the game itself does; makes every unnamed clip
   reachable, which is Boltreaver, Lagiacrus and the rest of shape three.
3. **Settle the alpha signal** - one decision, 66 materials.
4. **Port `fx.js`** for bloom, and set a tone mapping.
5. **Rebuild the stale `.glb`s** after checking which carry joint-0 bindings.

Everything past that is authored - which clip is which state, which parts ride each - and is
Raven's, not mine.

---

## Pass 1 - 2026-09-09

### Khezu (em003_00) — enrage flash, no revert, black veins
> "When switched enrage state, it flashes but I don't think we replicated the effect well. The
> flash also does not revert when toggled off. It has the black veins issues again."

**STATUS** diagnosed · **CAUSE** shared

All three symptoms are one cause: the viewer selects material clips from two hard-coded name
lists, and Khezu's clips are not in them.

    ENRAGE_CLIPS = ['Gekikou_Start','Angry_Start','Angry','angry_loop','angry_Change']
    CALM_CLIPS   = ['Gekikou_End','Angry_End','Normal','angry_End']

`XfBA_A0__m03_blood` is the black-veins layer: state `BSRevSubAlpha`, i.e. it DARKENS what is
behind it, with clips `Nomal_Repeat`, `Angry_Start`, `Angry_Repeat`, `Angry_End`, `Death`, driving
`fTransparency`, `fDiffuseColor` and `fUVTransform2`.

* **flashes** — `Angry_Start` is 60 frames with `loop: 0`. It plays once and stops, because
  `Angry_Repeat` is not in the list and never follows it.
* **does not revert** — nothing selects `Angry_End` on the way back out.
* **black veins** — `Nomal_Repeat` is the REST clip and is never selected (the list has `Normal`;
  the ROM's name is `Nomal_Repeat`, its own typo). With no clip driving it the layer sits at its
  static value, and a reverse-subtract layer at full strength is a dark shell.

`Body_Taiden_Repeat` and `Alpha_Taiden_Repeat` on the other two Khezu materials are unselected for
the same reason.

**Note on "again":** the 2026-09-04 occurrence had a different cause (an unmapped blend word fell
through to the opaque path). This is a second route to the same look. My 2026-09-09 alpha change
(4a42ef6) also makes the darkening composite at full strength where the backdrop used to bleed
through it, so it may read as stronger than before even at the same clip state.

#### 2026-09-09, second pass — Khezu's own code read, the diagnosis above was half right

> "Review how the ROM handles the enraged state for Khezu, I feel like the glowing effect is either
> too bright, needs an added layer/transformation or is in the wrong order"

All three guesses are right and they share a root cause. Khezu does **not** use the generic rage
machine at `0xe37560` — that one names `Angry_Start` / `Angry_End` / `Angry` / `Normal` on six
material slots and belongs to another class. Khezu has its own dispatcher, `0xd0f4e0 – 0xd1ef40`,
keyed on a state byte at `enemy+0x48`.

**Its material cache**, built at spawn (`0xd0f520`) by reading bits 22..29 of `material+0x18` —
which is the material's own number:

| byte | slot | material |
|---|---|---|
| 1 | `enemy+0x30` | `XfB_N__E_m01_body` |
| 0x32 | `enemy+0x34` | `XfBAN__E0__m50_body_alpha` |
| 3 | `enemy+0x38` | `XfBA_A0__m03_blood` |
| 4 | `enemy+0x3c` | `XfBA_A0__m04__taiden` |

**Two states, not one.**

*Angry* touches ONLY `+0x38`: `setClip(slot 1, "Angry_Start")` with slot-1 time zeroed
(`0xd1e8f8`), then once that time passes the clip's frame count, `clearAllSlots` (`0xb09a3c`) and
`setClip(slot 0, "Angry_Repeat")` (`0xd1e914`). Calm is `clearAllSlots` then `Angry_End` in slot 0
(`0xd1e698`), then `Nomal_Repeat` (`0xd1e99c`). Spawn is `Nomal_Repeat` on `+0x38` and nothing at
all on the others (`0xd0f590`).

*Taiden* (electric charge) is a different value of the same state byte (`0xd1ec1c`):
`Body_Taiden_Repeat` on `+0x30`, `Alpha_Taiden_Repeat` on `+0x34`, then
**`setMaterialAt(model, mat, 0)`** (`0x88db20`) — a runtime material replacement — and
`Taiden_start` on what is now index 0. Discharge plays `Taiden_End` (`0xd1e7a0`).

**`#833258c1` is `XfBA_A0__m04__taiden`.** The name is a literal at `0xd0f4e8`, fetched by name at
spawn into `enemy+0x44`; `crc32(name) ^ 0xFFFFFFFF` is `0x833258c1` exactly. It is `BSAddAlpha`
with authored **emission 2.0**, against `m03_blood`'s `BSRevSubAlpha` and emission 0 — the same
geometry and the same two textures under the same feature word. One darkens, one glows.

So:

* **black veins** — the ROM replaces the darkening layer with the glowing one for the charged
  state. We never swapped, so we drew the reverse-subtract material in a state the game does not
  draw it in. `Nomal_Repeat` at rest is correct and IS the ROM's spawn state.
* **too bright** — the 15-frame (0.25 s at MAT_FPS 60) full-body `*_Taiden_Repeat` strobe was
  firing on the rage toggle. It belongs to Taiden, which Angry never touches.
* **wrong order** — the wound overlays `XfBAN__E0__m02_body_d` are state 2, bias −384 →
  renderOrder 394, drawn last over everything. Now off by default at Raven's request.

Corrected from the entry above: `Angry_Repeat` writes no `fTransparency` track and
`cbm[0].transparency` is 1.0, the same value `Angry_Start` clamps to — so what the held transition
lost was the **UV scroll**, not brightness.

**FIXED, UNJUDGED** — timed slot-1 transitions with hand-off, a separate Charged toggle,
`STATE_MATERIAL_SWAP`, and parts 1/2 off by default.

### Diablos — pixelated textures
> "Diablos, has pixelated textures; I've seen this issue on multiple monsters"

**STATUS** open · **CAUSE** unknown, likely shared

Not yet diagnosed. Rhymes with the Ukanlos report below, so treat the two together and census
texture dimensions and filtering across the library before touching either.

### Bloodbath Diablos — rage effect does not animate
> "Bloodbath, the rage effect does not animate and I know we have animated it at one point"

**STATUS** open, REGRESSION · **CAUSE** unknown

Explicitly NOT the Khezu cause. `clipPicker` already carries a Bloodbath-specific fallback: its
`XfB_0__m50_angry` holds a Deviant rage ladder (`Lv1_to_Lv2`, `Lv2_loop`, `Lv2_to_Lv3`, `Lv3_loop`,
`Lv3_to_end`), none of them named in `ENRAGE_CLIPS` and none carrying the auto bit, so when a state
is asked for and no name matches it falls back to the LAST looping clip. That path was written for
this monster and should be selecting `Lv3_loop`. Raven says it animated at one point, so this is a
regression in something else — check whether a clip is selected at all and whether its uniforms
change between two frames before assuming anything about names.

### Grimclaw Tigrex — enraged albedo layers poorly rendered
> "Grimclaw and Tigrex, has Albedo layers for its enraged effect that are poorly rendered"

**STATUS** open · **CAUSE** unknown

Candidate already on the board: the second albedo map (`TypeExtendModulate` / `TypeExtendAdd`) is
not sampled, which is the known fix for 13 hidden overlays. Grimclaw also owns one of the three
reverse-subtract materials in the game (`m60_angry_arm`), so both the blend path and the second
albedo map are in play here. Needs the material list read before choosing.

### Ukanlos — body textures render poorly
> "Ukanlos, textures on body render poorly"

**STATUS** open · **CAUSE** unknown, likely shared with Diablos

See Diablos above. Census first.

### Astalos (em081_00) and Boltreaver Astalos (em081_04) - wings refract the body
> "Boltreaver and Astalos wing effects reflect oddly, they reflect other parts of the model,
> likely since there isn't anything else to reflect"

**STATUS** diagnosed, needs Raven's decision - **CAUSE** shared, and it is the SCENE, not the shader

Raven's reading is right, and the mechanism is REFRACTION rather than reflection. Both wing
materials on both monsters carry `distortion: Refract`:

| material | monsters | feature |
|---|---|---|
| `XfB_N__E0_wingRM` | Astalos, Boltreaver | `distortion: Refract` |
| `XfBAN__E1_wing_taiden` | Astalos, Boltreaver | `distortion: Refract` |

`stepRefract` renders the scene to a target and hands that texture to those shaders, hiding only
the refracting meshes themselves so they do not refract themselves:

    if (... o.material.userData.refract && o.visible){ hidden.push(o); o.visible = false; }

Everything else stays in the capture. In the game that buffer holds a LEVEL and the monster is a
small part of it. Here the scene is one monster on a transparent backdrop, so the only thing left
to refract IS the rest of the monster. The implementation follows the ROM's mechanism; the input
does not match the game's.

Separately, every material on both monsters also selects `reflect: GlobalCubeMap` - an environment
the viewer does not have either. That channel cannot show model parts, so it is not what Raven is
seeing, but it is the same missing-scene problem one layer over.

**THE CHOICE IS RAVEN'S, because every option changes how it looks and none is more "ROM" than the
others - the ROM's answer depends on a level we do not render:**

1. hide the WHOLE monster from the refraction capture, so the wings refract the empty backdrop;
2. put something in the capture on purpose - the stage backdrop or an environment - so there is
   something to refract;
3. leave it, and treat the artifact as the honest consequence of an empty scene.

### Boltreaver Astalos (em081_04) - charge effects draw uncoloured
> "Boltreaver charge effects all not colored; note, Astalos and Boltreaver have charge states and
> it will involve tuning on and off multiple part groups for each charge state"

**STATUS** diagnosed - **CAUSE** shared mechanism, and the blast radius is exactly 2 monsters

`taiden` is the charge material family. Their colour is not in the material at all - it is in the
animation, and the animation can never be selected:

| material | static `constant` | clip tracks | clip name | auto |
|---|---|---|---|---|
| `XfBA2_taiden_tale` | `[1,1,1,1]` white | `fConstantColor` ONLY | (none) | 0 |
| `XfBA2_taiden_head` | `[1,1,1,1]` white | `fConstantColor` ONLY | (none) | 0 |
| `XfBA2_taiden_crow` | `[1,1,1,1]` white | `fConstantColor` ONLY | (none) | 0 |
| `XfBAN__E1_wing_taiden` | `[1,1,1,1]` white | `fEmissionColor`, `fSpecularColor`, `fReflectiveColor` | (none) | 0 |

`clipPicker` selects by NAME first, then falls back to the ROM's auto bit
(`clips.findIndex(c => c.auto)`). These clips have no name string and `auto = 0`, so BOTH routes
fail, nothing is ever selected, `fConstantColor` stays at the static white, and the charge effects
draw uncoloured. That is the whole of it.

The names are not missing from the ROM, only unresolved: each material carries the SAME PAIR of
clip hashes, `668876438` and `3084603398`, 30 frames, both looping. 117 of the 134 distinct monster
clip hashes resolve to strings in `main.rodata`; these two are among the 17 that do not. A matched
pair on all four materials is consistent with Raven's note that these are charge STATES - two of
them - rather than one effect.

**Library-wide count:** 11 materials have only unnamed clips; of those, **5 materials on 2 monsters**
also have no auto clip, so nothing can ever be selected:

* Boltreaver Astalos - `XfBA2_taiden_crow`, `XfBA2_taiden_head`, `XfBA2_taiden_tale`,
  `XfBAN__E1_wing_taiden`
* Lagiacrus - `XfB__m02_thornray`

**Two separable pieces of work, and the second is Raven's:**

1. MECHANICAL - let a clip be selectable when it has no name: by hash, or by index, or by resolving
   the two hashes. Invents nothing; the clip and its keys are already in the data.
2. AUTHORED - which of the pair is which charge state, and which part groups are on in each. Same
   standing as the enrage toggle: the ROM reaches these through an AI state, so it is Raven's to
   decide, and it is what his note about "tuning on and off multiple part groups" describes.
### Savage Deviljho (em043_05) - enrage still incomplete, and the effect went blobby
> "Savage, enrage effects are still incomplete, I also think the effect we have currently is
> rendered more loosely than I've seen it rendered. It looks more like a blob now compared to
> previous versions."

**STATUS** two findings, one of them a REGRESSION I SHIPPED TODAY - **CAUSE** shared

**The blob is almost certainly mine, from 51a71d0, and it is togglable.** That commit makes a
fragment that survives the alpha test write FULL coverage instead of keeping its sampled alpha:

    #include <alphatest_fragment>
    diffuseColor.a = mix( diffuseColor.a, opacity, uCutSolid * uAlphaCut );

Savage's effect layers are exactly what that hits. `XfBA0__m03_body_a` is `transp: Alpha`;
`XfB__m02_body_k` and `XfBA_IW_1__m00` are `AlphaConstant`. A cut-out effect texture is authored
with a SOFT ramp, so before the change the texels above the cut threshold still faded out
(0.3, 0.6, 0.9) and now every one of them is 1.0. A feathered edge becomes a filled shape, which is
what "more like a blob" describes.

I made that change to fix the capture cut-out and said at the time it would change what is on
screen. This is that cost landing, on the layers where it shows most. Settle it without a reload:

    __view.cutSolid(false)   the old soft edges
    __view.cutSolid(true)    the current filled coverage

If the old look is right, the fix is to stop applying it to EFFECT layers rather than revert it
wholesale, because it is also what stops the body going see-through in a capture.

**Separately, "incomplete" has a structural reason: three effect materials, three clip families,
not selected together.**

| material | transp | clips | selectable? |
|---|---|---|---|
| `XfB__m02_body_k` | AlphaConstant | `Angry_Start`, `Angry_End`, both loop 0 | pinned by `ROM_SPAWN_CLIP` to `Angry_Start` |
| `XfBA0__m03_body_a` | Alpha | `Gekikou_Start`, `Gekikou_End`, both loop 0 | by name; `Gekikou_Start` is first in `ENRAGE_CLIPS` |
| `XfBA_IW_1__m00` | AlphaConstant | one unnamed clip, hash `1235185165` = **`effect`** | yes, `auto = 1` |

The third resolves now: `1235185165` inverts to `effect` and carries the auto bit, so it plays
regardless. The first two are one-shots with no loop, so like Khezu they play once and stop - this
monster has no `Angry_Repeat` or `Gekikou_Repeat` to sustain them. That is consistent with Raven's
2026-09-06 note that "the small eye patch was showing and the large layer over it was not".
Whether all three should be lit at once, and in what order, is authored - same standing as the
enrage toggle.
### Brachydios (em063_00) and Raging Brachydios (em063_05)
> "Brachydios renders poorly, likely due to a) it has a shiny carapace that needs to be handled
> better b) the slime effects c) enrage changes. Raging also has issues."

**STATUS** (b) and (c) diagnosed, (a) narrowed - **CAUSE** shared

Raven's three-way split holds up, and the ROM separates them the same way.

**(a) the shiny carapace.** `XfB__E0__m00_body` / `XfB__E_m00_body` is the only part of this monster
using `reflect: SphereMap` - one of just **75 monster materials** that do, against **391 on
`GlobalCubeMap`**. It also asks for `spec: Map`, `fresnel: Schlick` and `shininess 30.0` where the
library default is 16.0, with `specular [0.4,0.4,0.4]` (0.3 on Raging). So the carapace is
deliberately the shiniest thing on the animal and it takes its reflection from a DIFFERENT source
than almost everything else.

NOT yet established: whether `uEnvAmt` is non-zero for it. The viewer's sphere-map reflection lives
entirely inside `if ( uEnvAmt > 0.0 )` (material.js:357), so if that resolves to 0 the carapace gets
no reflection at all and reads flat. That is the one thing to check first, and I have not checked
it - `fReflectiveColor` comes from CBMaterial, not from the `glob` row, so it needs reading at
runtime rather than from materials.json.

**(b) the slime.** `nenkin` is 粘菌, slime mould - the slime family, and every one of them is
additive (`BSAddAlpha`) with `emission` at 1.0.

On RAGING, four slime materials - `m01_nenkin_arm_l`, `m02_nenkin_arm_r`, `m03_nenkin_body`,
`m04_nenkin_tail` - each carry exactly two clips:

    Yellow_to_Red    auto=0  loop=0
    Red_to_Yellow    auto=0  loop=0

**Neither name is in `ENRAGE_CLIPS` or `CALM_CLIPS`, and neither carries the auto bit, so neither
can ever be selected.** The slime never makes its colour transition. That is the whole of (b) on
Raging, and it is the same shape as Boltreaver's charge pair: a matched pair of state clips that
the name lists do not know about.

Base Brachydios's slime carries NO clips at all, so it is static by design; if it also looks wrong
the cause is elsewhere, most likely the additive-over-empty-scene problem the Astalos entry
describes.

**(c) enrage.** Raging's `XfB__m05_add` carries four clips:

    Normal          auto=0 loop=0     <- in CALM_CLIPS, selectable
    Angry_Start     auto=0 loop=0     <- in ENRAGE_CLIPS, selectable
    Angry_Repeat    auto=0 loop=1     <- NOT in either list
    Angry_End       auto=0 loop=0     <- in CALM_CLIPS, selectable

`Angry_Start` is a one-shot and `Angry_Repeat` is the loop that should sustain it, so this flashes
and stops exactly like Khezu. Same shared cause, third monster to show it.
### Glavenus (em080_00) and Hellblade Glavenus (em080_04)
> "Glavenus enraged effects are not rendering correctly and the Sword mesh for things like the
> heated up effect are off centered, an issue I know I have pointed out before"

**STATUS** enrage diagnosed, sword mesh open (REPEAT REPORT) - **CAUSE** shared / unknown

**The enraged effects are the clip bug, and Glavenus is hit by BOTH halves of it at once:**

| monster | clip in the data | why it never plays |
|---|---|---|
| Glavenus, Hellblade | `angry_Loop` | list holds `angry_loop`, lowercase L - case-only miss |
| Glavenus | `normal` | list holds `Normal` - case-only miss |
| Glavenus | `heat_Loop`, `dark_Change_Loop_End`, `normal_dark_Change` | not in either list |
| Hellblade | `heat_Loop`, `overheat_Loop` | not in either list |

So the heat/overheat states and the enraged loop are all unselectable, which covers "enraged
effects are not rendering correctly". Glavenus is the clearest case for fixing the CASE half first:
it is the only monster that misses on case in both directions, enraged and calm.

**The off-centre sword mesh is NOT diagnosed and is a repeat report** - noted as such so it is not
lost again. It is geometric, not a clip or a material problem, so it belongs with the mount/bone
questions rather than with the rest of this entry.

### Variant contrast: Raging, Savage, Furious
> "Raging, Savage, Furious will all require ensuring the Variant level changes are applied to
> ensure they contrast from the base version"

**STATUS** one hard bug found, two blocked by the clip cause - **CAUSE** mixed

**Furious Rajang is a real bug and the only one of its kind.** It is the ONLY monster in the whole
viewer carrying `sharesModelOf` (`em023_05 -> em023_00`), so it renders on base Rajang's model and
has NO material record of its own. The ROM disagrees: `em023_05.arc` ships **34 rModel, 34
rMaterial and 67 rTexture** - a complete set, against base Rajang's 36/36/68. The variant's own
assets exist and are not being used, so there is nothing to contrast WITH.

The other two do have their own material sets, and their contrast is blocked by the clip cause
rather than by missing assets:

* **Raging Brachydios** - the contrast IS the red slime, and `Yellow_to_Red` is precisely the clip
  that can never be selected. See the Brachydios entry.
* **Savage Deviljho** - carries `Gekikou_Start` / `Gekikou_End` on top of the base's `Angry_*` pair,
  which is the variant layer. Selectable by name but one-shot with nothing to sustain it. See the
  Savage entry.

So "apply the variant level changes" resolves to three different jobs: load Furious Rajang's own
archive, make the state clips selectable, and then decide the states - the last being authored.
### Off-centred effect meshes - Glavenus, Deviljho, and probably more
> "the Sword mesh for things like the heated up effect are off centered, an issue I know I have
> pointed out before" / "Off centered meshes were also an issue with Deviljho"

**STATUS** strong lead, not confirmed - **CAUSE** shared, and it is in the BUILD, not the viewer

Two monsters with the same geometric symptom is a mechanism, not two patches. The build pipeline
already knows this exact failure by name. `buildlib._fix_rigid_skins`:

> "Bind the primitives the converter leaves weightless. The .mod is passed so the REAL bone can be
> read from its one-bone vertex format; **without it every such primitive falls back to joint 0,
> which is what stranded Brachydios' arm slime at the origin.**"

A rigid, unweighted primitive - which is what an effect mesh like Glavenus's heated sword layer
is - lands at the ROOT instead of the bone the `.mod` names. That is "off centred" exactly.

**Why it can still be wrong even though the fix exists:** `mod_to_gltf` skips conversion entirely
when the output is already present -

    glb = mod_path[:-4] + ".glb"
    if not os.path.isfile(glb):
        run_tool("mod_to_gltf", mod_path)
        ... _fix_rigid_skins(glb, mod_path) ...

so any `.glb` built BEFORE the fix landed is never re-fixed and keeps its joint-0 binding forever.
The shipped assets are the suspect, not the current code.

**The check, which I have not run:** scan the shipped `docs/models/monsters/*.glb` for primitives
whose JOINTS_0 is entirely 0 with full weight on that joint, and compare against the bone their
`.mod` names. Any mismatch is a stale asset that needs its `.glb` deleted and rebuilt. That also
gives the blast radius across all 130 rather than chasing Glavenus and Deviljho one at a time.

Related and already on the board: the Armor/Weapon Viewer calls the same script WITHOUT a `.mod`
path, so its rigid primitives all take the joint-0 fallback by construction.
### Gypceros (em009_00) - crest renders white instead of shining
> "Gypceroes crest renders all white instead of shining"

**STATUS** diagnosed - **CAUSE** shared, and it is the THIRD instance of one exact shape

`XfBA0__m01_light` is the crest. Additive (`BSAddAlpha`), `albedo: MapConstant`,
`transp: AlphaConstant`, static `constant = [1,1,1,1]` - white - and three clips:

    Angry        hash 4278187618   auto=0  loop=1    <- in ENRAGE_CLIPS
    Light_on     hash 2376112157   auto=0  loop=1    <- in NEITHER list
    Light_off    hash 260276772    auto=0  loop=1    <- in NEITHER list

In the CALM state the picker looks for `Gekikou_End`, `Angry_End`, `Normal`, `angry_End`; Gypceros
has none of them. It then falls back to the auto bit, and none of the three carries it. So nothing
is selected at rest, `fConstantColor` stays at white, and the crest draws as a flat white additive
patch. The "shining" is `Light_on` / `Light_off`, which can never be reached.

This is the same shape as Boltreaver's charge effects and Savage's third layer: **an additive
`MapConstant` layer whose colour lives ENTIRELY in an `fConstantColor` animation, with a static
constant of white, and clips the picker cannot select.** Three monsters, one mechanism. Whenever
"renders white" or "not coloured" is reported, this is the first thing to check.

### Yian Kut-Ku (em008_00) - no way to lower the ears
> "Yian Kut should have an animation or part state that lowers its ears"

**STATUS** diagnosed as DATA PRESENT, feature absent - **CAUSE** shared (the parts panel)

The part data already carries it. Yian Kut-Ku ships five part groups, and four of them are two
MUTUALLY EXCLUSIVE PAIRS:

    group 1   [[1, False], [4, True ]]
    group 3   [[1, True ], [4, False]]

    group 2   [[2, True ], [3, False]]
    group 4   [[2, False], [3, True ]]

Parts 1 and 4 swap against each other, and so do 2 and 3 - one member on while the other is off,
in both directions. That is the shape of an up/down swap on two symmetric pieces, which is what
lowered ears would be: the raised mesh hidden and the lowered mesh shown.

So this is not missing data and not a per-monster fix. It needs the grouping layer already on the
board - "one toggle -> N mesh groups" - so an exclusive pair reads as a single control rather than
four independent part checkboxes. Which pair is "down" is Raven's to name once the control exists.
### Malfestio (em079_00) and Nightcloak Malfestio (em079_04) - wings always lit
> "Malfestio wing effects should only display during certain attack animations, we will likely need
> to animation work, but focus on rendering issues for now"

**STATUS** diagnosed, and the rendering half is a NEGATIVE - **CAUSE** shared, but not the clip cause

The useful finding is where the gate ISN'T. `XfB_0__m01_wing` is the wing effect on both monsters:

    blend        add / BSAddAlpha
    albedo       MapConstant, transp AlphaConstant
    constant     [0.08, 0.32, 0.32, 1.0]   Malfestio (teal)
                 [0.32, 0.08, 0.08, 1.0]   Nightcloak (red)
    clips        Animation    auto=1  loop=1

Two things follow, and they are the opposite of the other "always on" cases in this log:

1. **The colour is real and already right.** Unlike Boltreaver, Savage and Gypceros, this constant
   is not white - it carries the actual teal/red, and it differs between the two monsters. Nothing
   to fix there.
2. **The constant's ALPHA is 1.0 and its only clip is auto+loop**, so the material is fully visible
   at rest and always animating, by its own data. Compare the overlays that ship
   `fConstantColor.a = 0` and are ramped up by a rage clip - this is NOT one of those.

So the material carries no "off" state at all, which means **the game does not gate this effect
through the material.** It gates it by not drawing the mesh outside the attack. That puts it with
part/mesh visibility driven by animation state, not with the material-clip work - and it is why
nothing in the render path can fix it on its own. Raven's read was right.

**Bonus, found while looking:** Nightcloak carries a whole stealth state machine that is equally
unreachable - `stealth`, `stealth_start`, `stealth_end`, `stealth_start_S`, `stealth_end_S`,
`escape01`, `escape02`, `fade_in`, `fade_out`, across five materials plus three refract materials
whose own NAMES are unresolved hashes (`#3d0edb2c`, `#8d3c9f15`, `#d2c9c25d`). Every one is
`auto = 0` and none is in either clip list, so the cloak never engages. Those three material-name
hashes should invert the same way the clip hashes did - same `crc32 ^ 0xFFFFFFFF` scheme.
### Zinogre (em057_00) and Thunderlord Zinogre (em057_04) - gaps, and blobification
> "Zinorge has a lot of gaps in its rendering, I suspect we are missing an effect/mesh"
> "It also suffers from the same effect blobification Deviljho has"

**STATUS** charge effects diagnosed, "missing mesh" NOT confirmed - **CAUSE** shared

**The charge effects are the clip cause, and Zinogre is the worst case of it so far** - every clip
it owns is one the picker cannot reach:

| material | clips | in a list? |
|---|---|---|
| `XfB__m02_light` | `normal_Loop`, `tyoutaiden_Loop`, `Death` | none |
| `XfB__I0__m03_effect` (base) | `tyoutaiden_Loop` ONLY | none |
| `XfB__I0__m03_effect` (Thunderlord) | `normal_Loop`, `shintaiden_Loop` | none |
| `XfB_N__E_m00_body1` (Thunderlord) | `Animation` | none |

`tyoutaiden` is 超帯電, super-charged, and `shintaiden` is the Thunderlord's own charge state. Base
Zinogre's `m03_effect` carries `tyoutaiden_Loop` and nothing else, so in the calm state there is
NOTHING to select for it at all - not by name, not by the auto bit. Its lightning never runs.

**"Missing an effect/mesh" is NOT confirmed and I am not claiming it.** Zinogre has 41 prims / 43
meshes against 5 materials, but a high mesh-to-material ratio is normal and is not evidence on its
own. The build report shows no unmatched material, no missing MRL and no missing texture for
`em/057`. Two things worth checking that I have not: whether `_drop_hidden_prims` is removing more
than the game hides, and whether a part group is holding meshes off. Until one of those shows
something, "gaps" is unexplained.
### Rajang (em023_00) - golden fur covers only part of the body
> "Rajang golden fur doesn't cover whole body"

**STATUS** diagnosed - **CAUSE** shared, and this is the cleanest demonstration of it in the log

Rajang's seven materials fall into three groups, and the split lands exactly where Raven says it
does:

| material | clips | turns gold on enrage? |
|---|---|---|
| `XfB__m03_eye` | `Angry_Start`, `Angry`, `Angry_End` | **yes** - all in `ENRAGE_CLIPS` |
| `XfBAN__E1__m02_hair_a` | `Normal`, `Angry_Start`, `Angry`, `Angry_End` | **yes** |
| `XfBAN__E1__m01_hairline` | `Normal`, `Angry_Start`, `Angry`, `Angry_End` | **yes** |
| `XfBAN__E1__m00_hair` | `Normal`, **`PumpUp`** | **no** |
| `XfB_N__E0__m00_body` | `Normal`, **`PumpUp`** | **no** |
| `XfB__E0__m03_pumpup_arm` | none | static |
| `XfBA_E1__m04_pumpup_fur` | none | static |

The three that carry `Angry*` animate, because those names are in the list. The two that carry
**`PumpUp`** do not, because `PumpUp` is in neither list - so they select `Normal` and stay in the
calm state while the rest of the monster goes gold.

**The two that stay behind are `m00_hair` and `m00_body`** - the main pelt and the body, the two
largest surfaces on the animal. That is precisely "doesn't cover whole body", and it is not a
Rajang-specific fault: it is one missing name in a list, and which materials happen to carry that
name decides which parts of which monster transform.

`PumpUp` is Rajang's golden state, so adding it to the enrage list is the obvious move - but it is
the same authored decision as every other clip in section B, and it is Raven's. The two dedicated
`pumpup_arm` / `pumpup_fur` meshes carry no clips at all, so they are presumably meant to be shown
by part state during that form rather than animated into it.
### Cephadrome (em017_00) - wounds render low-res  [+ the Diablos / Ukanlos cluster]
> "Cephadrome's wounds render poorly, seem low resolution similar to the low res rendering issues
> mentioned before"

**STATUS** censused, cause NOT found - **CAUSE** unknown, and resolution is RULED OUT as the common one

Three reports now - Diablos, Ukanlos, Cephadrome - so I censused every texture in the library
instead of chasing them one at a time. The census kills the obvious explanation:

* **Cephadrome's only small texture is its SPHERE MAP.** Its three textures are 1024 albedo,
  1024 spec and a 64x64 bound to the `sphere` slot on `XfB__E0__m02_body`. A 64x64 sphere map is
  normal - they are small by design. Nothing about Cephadrome is low resolution.
* **Ukanlos is 1024 throughout**, twelve textures across body and tail, not one below. So whatever
  is wrong there is not resolution at all.
* **Diablos genuinely ships 512s** - `XfBAN__E0__m50_wing` binds normal, albedo and spec all at
  512x512 while the body pair are 1024. That is the ROM's own choice, not a build fault, so the
  wing really is half the detail of the body.

Also ruled out:

* **No missing textures and no fallbacks.** The build report has `texMissing: 0`,
  `texUnboundMissing: 0`, `texFallbackByBasename: 0`, so nothing was substituted for anything.
* **Filtering is correct.** `assets.js` sets `anisotropy = maxAnisotropy` and leaves three.js's
  defaults, which are `LinearMipmapLinearFilter` / `LinearFilter` with mipmaps generated. All the
  sizes involved are powers of two.

**What is left, and is the next thing to check:** the build re-encodes every ROM texture to webp,
and it does so inconsistently - 199 lossy VP8, 106 lossless VP8L, 176 VP8X. Median density is
0.44 bytes per pixel, but the tail is extreme: `aecee8eb2de3e842.webp` is 1024x1024 at **0.0052
B/px** and `7b7ee190912374e5.webp` is 512x512 at 0.0089. Those are compressed hard enough to show
artifacts on anything with detail in it. Which monsters bind the low-density textures is the
question to answer next, and it would explain reports that resolution cannot.

**Cephadrome's "wounds" also need identifying.** It has only three materials - eye, body, fin -
and the body is `albedo: MapColorOnly` with no blend map bound, so there is no second albedo layer
carrying wound detail. Whether the wounds are in the body's own 1024 map, on a mesh held off by
part state, or somewhere not loaded at all, is unestablished.
### Nibelsnarf (em056_00) - part 9 renders very wrongly
> "Nibelsnarf, part 9 is rendering very wrongly"

**STATUS** narrowed, mapping NOT confirmed - **CAUSE** part state, not material

Part 9 is structurally the odd one out on this monster. Nibelsnarf ships 13 part groups, and most
of them are EXCLUSIVE PAIRS - one part on while its partner is off, in both directions:

    group 2   [[2, True ], [3, False]]      group 8    [[2, False], [3, True ]]
    group 4   [[5, True ], [6, False]]      group 10   [[5, False], [6, True ]]
    group 5   [[7, True ], [8, False]]      group 11   [[7, False], [8, True ]]

Part 9's two groups name no partner at all:

    group 6   [[9, False]]                  group 12   [[9, True ]]

and neither of them is reachable through the rest-set machinery. `part-rest.json` gives Nibelsnarf
`defaultSet: 1` and `sets: [2, 3, 4, 5]` - so groups 6 and 12 are in NEITHER the default nor any
undamaged set. Part 9 sits outside the system that decides what is on at rest, which is exactly the
shape of a part that renders in the wrong state.

**The likely occupant, not confirmed:** Nibelsnarf has only four materials - `m00_eye`,
`m01_body`, `m02_era` and `m03_gitai`. `era` is 鰓, gills; **`gitai` is 擬態, mimicry** - the
sand-camouflage layer it wears while buried. A layer that should only appear in one state, sitting
on the one part that the rest-set logic does not govern, fits the report. I have NOT confirmed the
part-to-mesh mapping, so which prims part 9 actually owns is still to be read from the `.mod`.

Related: this is the same missing machinery as Yian Kut-Ku's ears - exclusive pairs and standalone
toggles both need the grouping layer before they can be driven correctly.
### Lagiacrus (em046_00) - charge colours appear, no glow  [THE APP HAS NO BLOOM PASS]
> "Lagiacrus, charge color changes appear but no glow effect currently"

**STATUS** diagnosed, and the glow half is LIBRARY-WIDE - **CAUSE** shared, a missing feature

**There is no glow because this app has no post-processing at all.** The Monster Viewer's render
directory is `assets.js`, `material.js`, `materials-db.js`, `monster.js`, `pose.js`, `skeleton.js`,
`stage.js` and `rom/` - and nothing else. No `EffectComposer`, no `RenderPass`, no bloom anywhere
in the render modules or in `index.html`.

The Armor Viewer HAS it: `docs/render/fx.js`, with an `EffectComposer` over the transparent canvas
and its own `BloomPass` / `BloomCompositeShader`. That file is not one of the six shared modules, so
it never came across.

So every additive and emissive layer in the Monster Viewer draws bright but cannot bloom - Lagiacrus
is simply where Raven noticed it. This is a feature to port, not a decode: the implementation
already exists next door and is known to work over a transparent canvas, which is the hard part.

**The charge side, separately.** Lagiacrus has two additive layers and they are in different states:

| material | blend | constant | clips |
|---|---|---|---|
| `XfB__m01_ray` | add | `[1, 1, 1, 1]` white | **none at all** |
| `XfB__m02_thornray` | add | `[0.4, 0.86, 1.0, 1.0]` pale blue | four, all `fConstantColor` |

`m02_thornray` carries a REAL colour in its static constant, which is why a charge colour shows at
all without any clip running. Its four clips are all `fConstantColor` tracks and all unselectable -
unnamed in the data and `auto = 0`, the same shape as Boltreaver. Their hashes DO resolve, and they
name the transitions between three charge levels:

    20444700    thornray00-01        3465322991  thornray01-00
    545439939   thornray01-02        2872983191  thornray02-01

00 to 01, 01 to 02, and both ways back. So Lagiacrus has a three-level charge ladder that can never
step, on top of having no bloom to make any of it glow.
### Mizutsune (em082_00) and Soulseer Mizutsune (em082_04)
> "Soulseer, back doesn't show enraged color correctly, one of the forelegs doesn't show options in
> the drop down" / "Both mizutsunes do not show exhausted or rage colors on parts that should"

**STATUS** both diagnosed - **CAUSE** shared (clips) and a DATA defect (empty groups)

**The exhausted state can never be shown on either monster.** `XfBA1__m01_angry` is the state layer
on both, and it carries four clips:

    angry_Change    <- in ENRAGE_CLIPS, selectable
    angry_End       <- in CALM_CLIPS, selectable
    tired_Change    <- in NEITHER
    tired_End       <- in NEITHER

So rage has a path and **exhausted has none**. That is half the report exactly, and it is the same
cause as everywhere else in this log.

**Soulseer carries a whole second exhausted set that is equally unreachable.** Four materials -
`m53_dry`, `m03_dry2`, `m54_dry_arm_L`, `m55_dry_arm_R` - each with clips `dry`, `tuya_start`,
`tuya_end`. `tuya` is 艶, gloss or lustre, so these are the dulled-coat layers, and the two
`_arm_L` / `_arm_R` ones are the FORELEGS Raven names. None of the three clip names is in either
list, so the dry state never engages on any of them.

Note the shape: rage animates through `m01_angry`, but the exhausted look needs both `tired_*` on
that layer AND `dry` / `tuya_*` on four more. A single missing state, spread over five materials.

**The foreleg dropdown with no options is a DATA defect, not the clip cause.** Soulseer's group
list contains two EMPTY entries:

    g18   []
    g19   []

A group with no members produces a cluster with no members, and `buildGroups` renders that as
`c.members.map(...)` over an empty array - a `<select>` with zero `<option>` elements. That is
literally "doesn't show options in the drop down". Every other monster's groups are non-empty; this
is the only pair of empty ones seen so far, so it is worth finding out whether the builder dropped
their contents or the ROM ships them empty before deciding whether to hide the row or fill it.

Soulseer is also by far the most part-heavy monster in the library - 51 part ids, 37 groups, 107
prims, 140 meshes - so it is the worst case for the parts panel generally.
### Najarala (em068_00) - blocky and black textures
> "Narajarala renders poorly, blocky texutres and black textures"

**STATUS** narrowed - **CAUSE** likely shared, and it is NOT texture quality

**The webp-density lead does not explain this one.** Najarala's four textures are healthy:
1024x1024 at 1.00 B/px, 1024x1024 at 1.43 (lossless VP8L), 1024x1024 at 0.37, and a 512x256 at
0.29. Nothing near the 0.005 outliers, and nothing undersized. So "blocky" is not coming from the
encode or the resolution here, which is worth knowing because it was the standing hypothesis.

**What DOES stand out: Najarala is one of the 66 materials whose NAME and FEATURE WORD disagree
about alpha.** The build report's own `checks.xfbaAlpha` counts 495 agreeing and **66 exceptions**,
split `featAlpha-nameB: 45` and `nameA-featOff: 21`. `XfB_N__E0__m01_alpha` is in that list: its
feature word says `transp: Alpha`, but its name carries no `A` in the `XfB` prefix - it is
`XfB_N__E0__`, not `XfBA...`. Anywhere the viewer decides alpha handling from the NAME rather than
the feature word, this material takes the wrong path, and a blend layer drawn opaque is exactly how
black patches appear. This is a censusable mechanism with 66 members, not a Najarala fault.

It is also the most extreme depth-biased layer on the monster: `BSBlendAlpha` with `RSMeshBias12`,
bias **-512**, so it is a blend overlay pulled hard toward the camera over the body.

Related and already on the board: "alphaTest has never discarded anything, anywhere in this app" -
the same confusion about which signal decides alpha.

**Also worth noting:** 59 meshes and 32 prims against **3 materials**. A high ratio is normal, but
combined with black patches it is worth checking whether any of those meshes resolves to no
material at all rather than to one of the three.
### Ahtal-Ka (em088_00) - enraged eye barely shows, never toggles off
> "Athal-ka enraged toggle does not really show the eye effect, it also does not toggle off like
> Khezu's flashing"

**STATUS** diagnosed - **CAUSE** shared, and this is the PUREST case-mismatch in the log

Ahtal-Ka has exactly one animated material, and it is the eye Raven names. Its three clips differ
from the viewer's lists ONLY in capitalisation, and the result splits three ways:

| clip in the data | list holds | outcome |
|---|---|---|
| `angry_start` | `Angry_Start` | **miss** - the ramp-in never plays |
| `angry_loop` | `angry_loop` | **hit** - the only one that matches |
| `angry_end` | `Angry_End` | **miss** - nothing to return to |

So on enrage the picker skips `Angry_Start`, falls through to `angry_loop` and selects the sustained
loop with no ramp - "does not really show the eye effect". On calm it looks for `Gekikou_End`,
`Angry_End`, `Normal`, `angry_End`, finds none of them, selects nothing, and the eye stays where it
was - "does not toggle off like Khezu's flashing".

Note the asymmetry: `angry_loop` is in `ENRAGE_CLIPS` in lowercase while `Angry_Start` and
`Angry_End` are capitalised, so this monster hits on one of three by luck of how the list was typed.
It is the strongest argument in the log for making the match case-insensitive - a one-line change
that invents nothing, since the ROM supplies both spellings, and it fixes Ahtal-Ka completely along
with the eight other monsters in the case census.
### Kirin (em011_00) - hair renders poorly
> "Kirin hair renders poorly"

**STATUS** diagnosed - **CAUSE** shared, and it is the OPPOSITE direction of Najarala's

Kirin has TWO hair materials and they disagree about what hair is:

| material | state | albedo | maps bound |
|---|---|---|---|
| `XfBAN__E0__m02_hairalpha` | **blend / BSBlendAlpha** | `Map`, `transp: Alpha` | normal + albedo + spec |
| `XfBA0__m00_hair` | **opaque / BSSolid** | `MapConstant`, `transp: AlphaConstant` | albedo only |

The second is in the build report's `checks.xfbaAlpha` exception list as the `nameA-featOff` kind:
its NAME carries the `A` for alpha (`XfBA0__`) while its state and feature word say opaque. Hair
drawn opaque is a solid card where soft strands should be, which is what "renders poorly" looks
like on a mane.

Najarala is the same census, the other way round (`featAlpha-nameB` - feature says alpha, name does
not). **Both directions produce a visible fault**, which is the argument for settling which signal
wins: 495 materials agree, 66 do not, split 45 / 21.

Textures are healthy and not the cause: three 1024x512 at 0.99, 0.34 and 0.17 B/px.

### Crimson Fatalis (em013_01) - enraged effect whited out
> "Crimson Fatalis enraged effect is whited out"

**STATUS** narrowed, not settled - **CAUSE** shared

Two findings, and the first is new to this log.

**The Fatalis enrage is a TEXTURE SWAP, not a colour ramp.** Its clips carry a `tex` track beside
`fEmissionColor`, and it moves the albedo between texture slots:

    Normal            tex 7    emission 0,0,0
    Angry_Start_01    tex 7    emission ramps to 0.6, 0.3, 0.0
    Angry_Start_02    tex 9    emission 0.1 -> 0.2
    Angry             tex 9    emission 0.2 held
    Angry_End_01/02   tex 9 -> 7, emission back to 0

So emission peaks at **0.2** and cannot white anything out. The white-out has to come from the
texture side. `applyTrack` DOES implement `case 'tex'` (in the shared material.js, whose comment
says "the Fatalis line is the heavy user"), but it only swaps when `m.userData.texSwap` is
populated and the index resolves - otherwise it silently does nothing. Whether `texSwap` is
populated for `XfB_N__E_m01_body`, and what slot 9 resolves to, is the next thing to read.
I have NOT checked it.

**Second, only the sustained state is reachable.** Of the six clips, `ENRAGE_CLIPS`/`CALM_CLIPS`
match `Angry` and `Normal` only - `Angry_Start_01`, `Angry_Start_02`, `Angry_End_01` and
`Angry_End_02` are in neither. So the enrage jumps straight to the held state with no two-stage
ramp, and returns the same way. Same cause as everywhere else, with a two-stage variant.

**Library-wide fact found while looking:** the renderer sets **no tone mapping at all** - there is
no `toneMapping` assignment in `stage.js` or `index.html`, so three.js uses `NoToneMapping` and any
value above 1.0 clips flat to white. That matters for every "whited out" report, and it pairs with
the missing bloom pass from the Lagiacrus entry: this app has neither end of the HDR path.

### Received, not yet diagnosed

* **Old Fatalis (em013_02)** - "chest effect renders poorly when the chest break is enabled".
  Related data already seen: `XfB__m01_face_sub` is one of the game's three reverse-subtract
  materials, and `XfBA0__m02_body_add` is additive with an auto `Normal` clip.
* **Teostra (em027_00 / em027_04)** - "effects are very poorly rendered". From the earlier census
  Teostra carries `Effect_Loop`, which is in neither clip list.
### Alatreon (em050_00) - elemental modes, and the head break cluster
> "Alatreon, may need to review part breaks for the head. Also, we will need to track down its
> different modes, it changes elemental states"

**STATUS** modes diagnosed, head breaks described - **CAUSE** shared (clips) / review

**The elemental modes are one material, and exactly half of it is reachable.** `XfB__m03_add`
(additive) carries a complete two-state machine:

    blue_Change   blue_Loop   blue_End      auto = 0, 0, 0
    red_Change    red_Loop    red_End       auto = 0, 1, 0

**`red_Loop` carries the auto bit**, so it is the ROM's own default and the picker's auto fallback
selects it. None of the six names is in `ENRAGE_CLIPS` or `CALM_CLIPS`. The result is that Alatreon
is permanently in its RED state and the blue one can never be reached - along with all four
transitions.

This is a different outcome from the other clip cases in this log and worth noting as a pattern:
where a monster has an auto clip, something renders and one state is simply stuck; where it has
none (Boltreaver, Gypceros), nothing renders at all. Same cause, two symptoms.

**The head breaks.** Alatreon's part clusters are three-stage, not two:

    {2, 24, 101}   g11 [[2,T],[24,T],[101,F]]    intact
                   g13 [[2,F],[24,T],[101,F]]    partial
                   g1  [[2,F],[24,F],[101,T]]    broken, and 101 appears in its place

    {5, 25, 104}   g12 [[5,T],[25,T],[104,F]]    intact
                   g2  [[5,F],[25,F],[104,T]]    broken, 104 in its place

The 10x pattern is consistent: a part in the 100s is the BROKEN replacement mesh for the pair below
it. With the panel now defaulting to the rest sets (`defaultSet 4`, `sets [3,11,14,15,16,17]`),
cluster {2,24,101} takes g11 and cluster {5,25,104} falls back to its highest, g12 - both intact,
which is right.

**What I cannot say is which cluster is the head.** That needs `partnames.json`, and the board
already carries the caveat that those names are community-sourced rather than ROM-derived. Worth
pinning before reviewing the breaks, otherwise the review is guessing at which row to look at.
### Gore Magala (em071_00) and Chaotic Gore Magala (em071_05) - wing layer renders poorly
> "Gore Magala has a wing effect or albedo layer that renders poorly"

**STATUS** diagnosed, two causes at once - **CAUSE** shared, both already in this log

**1. The frenzy body-light ladder never runs.** `XfB_W__m01_kasan` is the additive layer
(`BSAddAlpha`) and it carries a five-rung ladder plus a rest state:

    BodyLight_Start_LV1   BodyLight_Start_LV2   BodyLight_Start_LV3
    BodyLight_Start_LVMAX BodyLight_Start_Finish  BodyLight_Normal

**All six have `auto = 0` and none is in either clip list**, so nothing is ever selected and the
static constant `[1, 1, 1, 1]` - white - is what draws. That is the Boltreaver / Gypceros shape for
the fifth time: an additive layer whose colour lives in an animation that cannot be reached.
Both Gore variants carry the identical ladder.

**2. The wings are drawn OPAQUE while their feature word says Alpha.** Three wing materials on each
monster are `BSSolid` / `blend: opaque` yet carry `transp: Alpha`:

    XfBAN__E0__m52_wing_l      opaque / BSSolid   transp: Alpha
    XfBAN__E0__m51_wing_s      opaque / BSSolid   transp: Alpha
    XfBAN__EW_0__m50_UVA       opaque / BSSolid   transp: Alpha

Gore's wings are membranous with soft and torn edges; drawn opaque they read as solid cards, which
is the same visible fault as Kirin's hair. This is the third monster in the alpha-disagreement
family after Najarala and Kirin, and it is the largest instance yet - six materials across the two
variants.

**Also unreachable:** `m52_wing_l` carries a `Wing_damage` clip, `auto = 0`, in neither list - so
the damaged-wing state cannot be shown either. And `XfBAN__EW_0__m50_UVA` has one unnamed clip with
`auto = 1`, so that one DOES play; it is the only animated thing on the monster that does.
### Valstrax (em086_00) - no eyes, chest effect poor
> "Valstrax has no eyes, chest effect rendering poorly"

**STATUS** diagnosed - **CAUSE** shared, and this is the sharpest correlation in the log

Valstrax has nine materials. **Six of them carry clips named `start`, `Loop`, `end`** - none of
which is in `ENRAGE_CLIPS` or `CALM_CLIPS`, so the name lookup fails on every one. What separates
them is the ROM's own auto bit:

| material | clips | auto | plays? |
|---|---|---|---|
| `XfB_N__EW_0__m03_eff` | start, Loop, end | 0, **1**, 0 | yes, via the auto fallback |
| `XfB_W_0__m02_angry` | start, Loop, end | 0, **1**, 0 | yes |
| `XfB__I0__m04_breathe` | start, Loop, end, tired_* | 0, **1**, 0, 0, 0, 0 | yes |
| `XfBA_E1__m01_black` | start, Loop, end | 0, **1**, 0 | yes |
| **`XfB_0__m05_eye`** | start, Loop, end | **0, 0, 0** | **NO** |
| **`XfB__I0__m06_heat`** | start, Loop, end | **0, 0, 0** | **NO** |

**The two that cannot play are the eye and the heat layer** - which is exactly "no eyes" and "chest
effect rendering poorly", reported independently. Nothing else on the monster is affected, and
nothing else was reported.

So the mechanism is confirmed twice over on one monster: where the auto bit is set the material
animates despite the name miss; where it is clear, the name miss is fatal and the material sits at
its static state. `m05_eye` is `MapConstant` / `AlphaConstant` whose visibility rides on
`fConstantColor`, so with no clip it never becomes visible at all.

This is the cleanest evidence in the log that the fix belongs at clip SELECTION rather than in any
per-monster data: six materials, one monster, identical clip names, and the only thing separating
what works from what does not is a bit the picker already knows how to read.

**Valstrax is also the second-heaviest monster in the library** - 110 prims, 153 meshes, 31 part
ids - so it is a good stress case for the parts panel once the clip work is done.

---


---


---


---


---


---


---


---


---


---


---


---

## MY REGRESSION: effect blobification (51a71d0) - now on three monsters

Reported on Savage Deviljho, then Deviljho, then Zinogre. That is enough to treat it as a bad
change rather than a per-monster oddity.

`51a71d0` makes any fragment that survives the alpha test write FULL coverage:

    diffuseColor.a = mix( diffuseColor.a, opacity, uCutSolid * uAlphaCut );

Effect layers are authored with a SOFT alpha ramp, so every texel above the cut threshold used to
fade (0.3, 0.6, 0.9) and now reads 1.0. Feathered edges become filled shapes. It affects every
cut-out material, which is why it turned up on three unrelated monsters at once.

It was made to fix the capture cut-out, and it does. The two needs are in direct conflict: a capture
wants full coverage, an effect layer wants its ramp. **The resolution is to stop applying it to
additive/effect layers and keep it for the body**, rather than reverting - but that is Raven's call
once he has compared them:

    __view.cutSolid(false)   soft ramps back
    __view.cutSolid(true)    filled coverage, current default

---


---


---


---


---


---


---


## Clip-name hashes: the names are in the ROM, and clips should be picked by HASH

Raven, 2026-09-09, on my calling 17 clip hashes "unresolved": *"Nothing should be missing from the
ROM, it's a dump from a game cart I used to play the game."* He is right, and the correction
matters more than the names do.

**The hash is `crc32(name) ^ 0xFFFFFFFF`** - the same MT Framework hash as the archive type hashes,
without the 31-bit mask. Verified: `crc32('Angry_End') ^ 0xFFFFFFFF == 3185156404`, which is the
hash the data carries for that clip.

**Nine of the seventeen recovered.** Six were sitting in the executable the whole time; the old
resolver looked in `main.rodata` alone and matched whole printable runs, so a name that begins
mid-run was invisible. Scanning all three segments and every suffix found them at once. Three more
fell to hash inversion over the vocabulary the ROM's own clip names use:

| hash | name | monster | how |
|---|---|---|---|
| 1642803235 | `Taiden_Repeat` | Khezu | rodata suffix |
| 836608300 | `taiden_Loop` | Astalos | rodata suffix |
| 20444700 | `thornray00-01` | Lagiacrus | rodata suffix |
| 545439939 | `thornray01-02` | Lagiacrus | rodata suffix |
| 3465322991 | `thornray01-00` | Lagiacrus | rodata suffix |
| 2872983191 | `thornray02-01` | Lagiacrus | rodata suffix |
| 3889124741 | `Wing` | em071_00, em071_05 | inversion |
| 2498077448 | `light` | em025_00, em079_04 | inversion |
| 1235185165 | `effect` | em043_05 Savage Deviljho | inversion |

**Eight still not found BY ME** - not missing from the ROM: `668876438` and `3084603398`
(Boltreaver's charge pair), `3176832509`, `3986638774`, `2138177580` (em036_00), `3654015077`
(em058_00), `1282980991` (em083_04), `3961659931` (em087_00). A 200k-candidate inversion over the
charge vocabulary, including the 放電/帯電 pairing, returned nothing, and the rodata symbol region
around the six that were found holds no more.

**THE STRUCTURAL POINT, which is what this is really worth.** The game never needs the name. It
identifies a clip by its hash - that is what the .mrl stores, and it is why a name string is
shipped only when something else in the image happens to need it. `clipPicker` matching by NAME is
the anomaly, not the ROM. Selecting by hash works whether or not a string is ever recovered, and it
would have made Boltreaver's charge clips selectable without knowing what they are called. The name
is for us; the hash is for the game.

This also revises the census below: it counted names, and names are the wrong unit.

---

## Standing census: the clip-name lists reach 9 of 136 names

Counted 2026-09-09 across every monster material in `materials.json`. There are **136 distinct
material-clip names**; the two lists name **9**.

**A — case-only mismatches, 9 monsters.** The viewer holds the name with the wrong case, so an
exact `indexOf` misses it. Free to fix and invents nothing, because the ROM supplies both spellings:

| monster | clip in the data | list holds |
|---|---|---|
| Congalala, Glavenus, Hellblade Glavenus, Nakarkos (x3) | `angry_Loop` | `angry_loop` |
| Lavasioth, Glavenus | `normal` | `Normal` |
| Amatsu, Ahtal-Ka | `angry_start` / `angry_end` | `Angry_Start` / `Angry_End` |

**B — rest/loop clips present and never selected, 20 monsters.** Khezu, Bloodbath Diablos, Teostra,
Agnaktor, Alatreon, Zinogre, Thunderlord Zinogre, Amatsu, Raging Brachydios, Seltas Queen, Gore
Magala, Chaotic Gore Magala, Glavenus, Hellblade Glavenus, Nakarkos and others.

**B is NOT a free fix and is Raven's call, not mine.** Deciding that `Nomal_Repeat` is the rest
state, or that `Angry_Repeat` follows `Angry_Start`, or which rung of Bloodbath's `Lv2_loop` /
`Lv3_loop` ladder is "enraged", is authored semantics. The ROM reaches these clips through `setClip`
from an AI state, so no name list can be complete — `clipPicker` says so already. Raven, 2026-09-05:
"Things like enraged states for toggles will be up to me to determine."
