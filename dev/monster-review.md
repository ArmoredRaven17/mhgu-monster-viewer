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
