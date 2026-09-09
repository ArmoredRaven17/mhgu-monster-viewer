# Per-monster review

Raven looks, reports, and judges. I diagnose from the ROM or the source and keep the cause here,
not scattered through the render code. **A finding is only closed when Raven says the render is
right** — no entry here is closed on my reading of a picture.

Two columns matter more than the rest:

* **CAUSE** — `shared` if the fault is a code path (fix the mechanism, and count how many monsters
  use it), `data` if the fault is a value for this monster alone (a name, a hit-zone row). Most
  "monster-specific" symptoms so far have turned out to be `shared` with sparse usage.
* **STATUS** — `open`, `diagnosed` (cause found, not fixed), `fixed, unjudged`, `closed`.

---

## 2026-09-09

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
