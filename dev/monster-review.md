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

**Two kinds of issue, and they are not worth the same effort** (Raven, 2026-09-10:
"the gaps might be difficult to deal with since they are a visual issue... unlike something we
can drive with the ROM data like albedo values"):

* **ROM-drivable.** The ROM holds a value we either match or do not - an albedo, a clip name, a
  blend state, a bone index. I can decode it, diff it against what the viewer does, and fix it
  with a number behind every step. Raven judges the result once, at the end. Cause J was this:
  the shader package said no material selects a clip, and that settled it before anyone looked.
* **Visual-only.** A rendering artifact with no ROM counterpart to check against - seam gaps,
  filtering, bloom. There is nothing to decode; verification is Raven's eye, one look per
  attempt, and my own visual verification is worth nothing by standing instruction.

So: **work the ROM-drivable causes first and in bulk.** They close without spending his
attention. Batch the visual-only ones and bring several candidates to a single judging pass.


| # | cause | monsters | state |
|---|---|---|---|
| A | **Clip selection.** Two hard-coded name lists reach 9 of 136 clip names. Four shapes: case-only miss; name absent with no auto bit (nothing plays); unnamed clips with no auto bit; auto bit present so one state is stuck. | ~20 | diagnosed, unfixed |
| B | **Alpha disagreement.** `checks.xfbaAlpha`: 495 agree, **66 do not**, in both directions. Name-says-alpha-drawn-opaque gives solid cards; feature-says-alpha-name-does-not gives black patches. | Kirin, Gore x2, Najarala | **ANSWERED by J** - the name/bit agreement was circular; neither switch selects a clip |
| C | **No HDR path.** No bloom pass at all (the Armor Viewer has `fx.js`); no tone mapping, so anything above 1.0 clips flat to white. | library-wide | diagnosed, unfixed |
| D | **Joint-0 rigid skins.** Weightless primitives bind to the root instead of the bone the `.mod` names. The fix exists but `mod_to_gltf` skips regeneration when the `.glb` is present, so stale assets keep it. | Glavenus, Deviljho, + unknown | strong lead |
| E | **Empty scene.** Refraction samples a buffer holding only the monster; 391 materials want a `GlobalCubeMap` that does not exist. | Astalos x2, Brachydios? | needs Raven's decision |
| F | **Parts machinery.** Exclusive pairs and standalone toggles need a grouping layer; some clusters sit outside the rest-set system. | Yian Kut-Ku, Nibelsnarf, Alatreon | diagnosed |
| G | **Data defects.** One-off faults in the shipped data. | Soulseer (empty groups), Furious Rajang (`sharesModelOf`) | diagnosed |
| H | **My regressions.** | see below | live |
| J | **The alpha clip the ROM never asks for.** `FTransparencyAlphaClip` (mfx 1401) is a SEPARATE feature from `FTransparencyAlpha` (1395, the SRC_ALPHA blend source), and **not one of the game's 25,602 materials selects a clip variant**; `fAlphaClipThreshold` is 0.0 on all 199 monster ones, and `clip(a - 0)` discards nothing. The viewer clipped on the BLEND feature plus flag bit 20, with an invented `+1/512` to make it bite - discarding every zero-GLOSS texel of 161 materials, 116 of them opaque. | 161 materials, library-wide | **FIXED 2026-09-10** - Raven 2026-09-10: "Still see some gaps". Real but PARTIAL; the residue is a separate cause, not yet isolated |
| I | **Texture pool encode.** libwebp discarded the RGB under alpha-0 texels, and MT's albedo alpha is the GLOSS the shader reads, not opacity — so a third of some hides was compression fill. `exact=True` in `buildlib.stage_tex`. | 157 textures, library-wide | **FIXED, Diablos judged right 2026-09-09** |

### Open - cause not established

* **Motion playback rate** - if material animation is right at 30 (2026-09-10), motion is
  wrong:  baked the pose GLB timings in seconds at 60 fps and the mixer replays
  them as written, so monster motions would also be 2x fast. The ROM says the two share one
  tick, so they cannot both be right. Needs Raven: DO THE MONSTER ANIMATIONS RUN FAST?
* **Seam gaps, residue after cause J** - Grimclaw enraged, Zinogre; the alpha clip was one
  contributor (4,596 background pixels on Thunderlord) and removing it left gaps still visible.
  Raven: "might be difficult to deal with since they are a visual issue". PARKED at his call to
  make board-wide progress. Ruled out already: missing geometry, open geometry, the 20->30 part
  weld, cull/side mismatch, revsub. Untried: UV-island seam filtering (bilinear pulling in
  neighbouring islands at low mips), mipmap/anisotropy settings, and the `RSMeshBias` -> renderOrder
  mapping on coplanar overlays.
  **Raven, 2026-09-10: "verification for them will be almost entirely visual."** That is the
  reason this is parked and not merely deferred. Every cause closed so far had a ROM-side or
  framebuffer-side number to sit behind it - cause J had 4,596 background pixels. This residue
  has none: it is thin, low-contrast and judged by eye, my visual verification is worth nothing
  (standing instruction), and each attempt would cost Raven a look. So it is not worth spending
  his attention one guess at a time. Pick it up only with either a measurable handle or several
  candidate fixes ready to judge in ONE pass.
  **RECLASSIFIED 2026-09-10** after Raven: "the Bind Pose doesn't show the small gaps near
  break-able parts." That makes it measurable -- see the entry below. It is a SKINNING
  question, not a visual one, and belongs in the ROM-drivable column.
* **Bloodbath Diablos** - rage regression; `clipPicker` already carries a fallback written for it
* **Diablos / Ukanlos / Cephadrome** - texture quality; resolution RULED OUT, webp encode density is the live lead
* **Old Fatalis** - chest effect when the chest break is on
* **Teostra** - effects generally; carries `Effect_Loop`, in neither list
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

#### 2026-09-09, third pass — the charge state still looked wrong, and the cause is MINE

> "The issue is the charge state doesn't look correct or right"

`installCutoutSolid` (rom/material.js, my change of 2026-09-09) forces
`diffuseColor.a = opacity` for every fragment that survives the alpha test, on every LIT material
carrying an alpha test. It was written for an opaque cut-out — fur fringes, wing membranes — where
`diffuseColor.a` is nothing but output coverage and the soft ramp in the map was writing partial
coverage into a saved PNG.

**That reasoning does not hold for a BLENDED material.** With `BSBlendAlpha`, `BSAddAlpha` or
`BSRevSubAlpha` the ROM's source factor IS `SRC_ALPHA` (state.js: `src: 'SRC_ALPHA'`), so
`diffuseColor.a` is not coverage — it is *how much of this layer reaches the framebuffer*. Forcing
it to `opacity` made every texel that cleared the test composite at FULL strength, and the test's
threshold is the material's own clip value, 1/512 on these, which almost nothing fails.

On a vein, fur or spark texture — thin strands over mostly-transparent ground — that draws the
**quad** instead of the strands. Khezu's vein map measures alpha mean 0.088.

**66 materials with the alpha-test bit were on that path: 39 add, 25 blend, 2 revsub.** They land
squarely on the reports already in this list:

| monster | material | blend | report |
|---|---|---|---|
| Khezu | `m03_blood`, `m02_body_d`, `m04__taiden` | revsub / blend / add | black veins, charge state |
| Kirin | `m02_hairalpha` | blend | "Kirin hair renders poorly" |
| Rajang | `m01_hairline` | blend | "golden fur doesn't cover whole body" |
| Gypceros | `m03_eye_add` | blend | "crest renders all white instead of shining" |
| Teostra | `m01_effect01`, `m02_effect02` | add | "Teostra's effects are very poorly rendered" |
| Tigrex / Grimclaw | `m01_angry`, `m51_blood`, `m52_blood2` | add | "Albedo layers for its enraged effect are poorly rendered" |
| Old Fatalis | `m00_body_alpha` | blend | "chest effect renders poorly when the chest break is enabled" |

`installCutoutSolid` now runs only where `rom.state.blend === 'opaque'`. 133 materials keep it;
the 66 above get their sampled alpha back as the blend factor, which is what the ROM's state word
says it is.

**RESOLVED from the shader package** (Raven: "we want things to be as close to how the ROM does it
as possible"). `m04__taiden` ships `glob.emission [2,2,2]` and `rom/material.js` was setting
`emissiveFromMap`, handing the ALBEDO texture to three.js so the term came out as
`constant x albedoTexel`. Nothing was read out of the ROM for that multiply — it was asserted.

`AppShaderPackage.mfx` refutes it. The emission family carries its own map variant with its own
texture, sampler, UV and channel features:

    FEmissionMap        idx 1515   tEmissionMap (904), SSEmissionMap (568),
                                   FUVEmissionMap (1510), FChannelEmissionMap (1511)
    FEmissionConstant   idx 1513   declared float3, 放射量を定数で指定
                                   -- "specify the emission amount by a constant"

A material wanting a map-driven emission selects `FEmissionMap` and binds `tEmissionMap`. Across
all **570 monster materials the only emission feature named is Constant**, and **none of the 198
with a non-zero emission binds a `tEmissionMap`**. So the ROM's term is the constant, flat, and the
albedo multiply was invented.

What shapes it on a blended layer is the ALPHA: the ROM's source factor is `SRC_ALPHA`, so the GPU
multiplies the whole fragment — emission included — by the texel's alpha at blend time. On Khezu's
charge that is the vein network doing the shaping, through the same gate the cut-out-solid
correction above restored.

The Armor Viewer's copy of `material.js` carries the same assertion (`piece.js:194`, `:246`,
`weapon.js:231`) and is untouched — logged on the task board.

#### 2026-09-09, fourth pass — the emission fix above was half wrong, and the real cause found

> "I still think Charged needs correcting, the veins appear as bright white and the effect is super
> bright"

The pass above read "FEmissionConstant" as meaning the TERM is constant. It does not — it says the
**amount** comes from a constant rather than a texture, which is a statement about where the number
is read, not about what it scales. Making the term flat took Khezu's emission from 0.89 white to a
full 2.0 white, i.e. it made the reported symptom worse.

**`emissiveFromMap` was never a multiplicand — it is a DEFINE CARRIER.** `applyTint`
(`render/material.js:344`) *replaces* `#include <emissivemap_fragment>` with

    #ifdef USE_EMISSIVEMAP
      totalEmissiveRadiance *= gBase;
    #endif

so the stock chunk that samples an emissive map never runs and the texture is never read as a
texture at all. Setting `emissiveMap` exists solely to make three.js define `USE_EMISSIVEMAP`, which
is the only thing that switches the `*= gBase` on. Removing it removed the multiply by the ALBEDO.

**The real cause, and it predates today: `gBase` is only ever the FIRST map.** `applyTint` sets
`gBase = base` inside its `<map_fragment>` block, and the ROM core's two-map combine
(`rom/shader.js`) runs *after* that and touched only `diffuseColor.rgb`. So on the 20 materials that
carry a second map, the emission was scaled by half the albedo. Measured off Khezu's own textures:

| | R | G | B |
|---|---|---|---|
| `fEmissionColor` (from the .mrl, $Globals float 48) | 2.0 | 2.0 | 2.0 |
| base map, alpha-weighted | 0.445 | 0.446 | 0.444 |
| blend map (`tAlbedoBlendMap`) | 0.075 | 0.257 | 0.232 |
| albedo after the modulate | 0.033 | 0.115 | 0.103 |
| **emission now** | **0.067** | **0.229** | **0.206** |
| emission before today (base map only) | 0.890 | 0.892 | 0.888 |
| emission after the flat change | 2.0 | 2.0 | 2.0 |

The base map is achromatic and the blend map is the teal — so scaled by the base map alone the glow
is white at 0.89, and flat it is white at 2.0. Scaled by the albedo the material actually computes
it is teal at about a quarter of that. Two things in the shipped data say the scale is right:
Khezu's constant is WHITE and the highest of the 198, which only makes sense if the colour comes
from what it scales; and authors who want a coloured glow put the colour in `fEmissionColor` and do
(Zinogre `m03_effect` (0.2, 0.8, 0.8), Astalos `wing_taiden` (0.75, 0.925, 0.575), Amatsu
`horn_add` (1.0, 0.615, 0.2)).

**STILL UNREAD:** the exact combine in the shader. `AppShaderPackage.spkg` holds compiled binaries
with no identifiers and the `.mfx` feature body is an operation stream this repo has no decoder for.
Scaling the albedo is the shape `applyTint` already implemented; what changed is only that the
albedo reaching it was half of one.

**STATUS: STILL OPEN.** Raven, 2026-09-09, after the four passes above: "Khezu Charged State is not
100%". Moved off it to keep the list going, not because it is right. What is fixed and measured is
recorded above; what is left is unjudged and undiagnosed, and the next look should start from the
one thing still unread — the emission combine — plus the two knobs that are viewer choices rather
than ROM readings (`__view.cutSolid`, `__view.clipFallback`).

### Diablos — pixelated textures
> "Diablos, has pixelated textures; I've seen this issue on multiple monsters"

**STATUS** **CLOSED** 2026-09-09 — Raven: "Oh, Diablos looks fine now" · **CAUSE** shared, 157 textures

**Ruled out first.** The census the earlier note asked for was run 2026-09-09 and both easy
theories are dead:

* **Not a downscale.** Every shipped `.webp` was compared against the `.tex` header dimensions of
  all 129 extracted monsters: 88 match exactly and the 5 that differ do so by carrying an extra or
  missing texture, never by resolution. Diablos' three 512s are the wing maps, and the ROM ships
  those at 512 too.
* **Not filtering.** In the page: `minFilter` LinearMipmapLinear, `magFilter` Linear,
  `generateMipmaps` true, anisotropy 16, WebGL2, UV repeat 1,1 offset 0,0.

**The cause is `buildlib.stage_tex`'s WebP encode.** libwebp rewrites the colour of every
fully-transparent texel — for an ordinary image that colour is invisible, so zeroing it compresses
better. **MT's albedo alpha is not opacity, it is the GLOSS** the shader reads
(`render/material.js`: `gGloss = texel.a` where the material binds no separate specular map). So the
RGB under alpha 0 is fully visible and was being replaced with compression fill.

Measured on Diablos' body albedo, the shipped file against the pipeline's own decoded DDS, split by
the albedo's alpha:

| alpha band | share | PSNR | bias |
|---|---|---|---|
| 250–255 | 1.1% | 31.9 dB | +0.55 |
| 128–249 | 8.7% | 34.2 dB | +0.26 |
| 32–127 | 26.9% | 35.5 dB | −0.08 |
| 1–31 | 30.1% | 36.4 dB | −0.12 |
| **0** | **33.1%** | **18.2 dB** | **+22.17** |

A third of the hide's colour, replaced with fill, in patches following the gloss mask.

**The fix is one flag**, `exact=True` on the WebP save. Same texture, re-encoded:

    q90            alpha==0: PSNR 18.2 dB bias +22.13   alpha>0: 35.6 dB   all 22.8   896 KB
    q90 + exact    alpha==0: PSNR 37.5 dB bias  +0.10   alpha>0: 35.7 dB   all 36.2   934 KB
    lossless+exact                     99.0 dB                  99.0 dB    99.0      1648 KB

4% for the whole thing back. Applied to `buildlib.py`.

**136 of the 176 RGBA textures in the monster pool are affected** — 77% — several of them 100%
transparent, i.e. their entire RGB is fill. 58.8 MB to re-encode, about +2.35 MB after. Among them
is `tex/ecee39f1af579d49.webp` at 73.8%: **Khezu's vein map**, so this is very likely part of why
its charged state is still not right.

**REGENERATED 2026-09-09** on Raven's "Rebuild, since the pixelated textures are still present".
157 files cleared and re-staged; 154 changed, 3 came back byte-identical. Measured after, same
method as before — the shipped file against the pipeline's decode of the ROM texture:

| Diablos body albedo | alpha==0 band | alpha>0 band | whole |
|---|---|---|---|
| before | 18.2 dB, bias +22.13 | 35.6 dB | 22.8 dB |
| after | **37.5 dB, bias +0.10** | 35.7 dB | **36.2 dB** |

The alpha>0 band did not move, which is what should happen: the flag only governs what libwebp does
under transparent texels. Pool cost for those files 68.8 MB -> 70.2 MB, **+2.0%**.

**JUDGED AND CLOSED.** Raven, 2026-09-09, on the rebuilt pool: "Oh, Diablos looks fine now".

The same 157 files serve the whole library, so the reports below that name a texture as looking
wrong may have moved with it — **Ukanlos** ("textures on body render poorly") is the closest match,
and Kirin, Rajang, Gypceros, Teostra, Tigrex/Grimclaw and Old Fatalis all had affected maps. None of
them is closed by this: each still needs Raven's eyes on its own monster.

##### Three pipeline faults the rebuild exposed, all fixed, none of them in the viewer

1. **`buildlib.ROOT` was hard-coded to `C:\MHGU-Extract`** while the tree lives at
   `E:\offline\extract`. The first run created an empty `C:\MHGU-Extract\MHGU-Monster-Viewer\docs`
   and wrote a 0-byte `materials.json` into it. ROOT now comes from `__file__`, and the ROM root is
   searched for separately (`buildlib._rom_root`) because the dump is at `C:\MHGU-ROM`.
2. **`build/frag/monsters.json` stores ABSOLUTE MRL paths** recorded under that old root, so all 187
   missed. The build did not refuse — it reported `missing MRL 186` and wrote a valid-but-empty
   `materials.json` OVER the shipped one. Restored from git. Added `buildlib.rehome()`, which
   re-roots a stale recorded path at the current tree; all 187 resolve.
3. **`build-materials.py` alone DROPS every material animation.** `anim` is added by a separate
   pass, `build-matanim.py`, which updates `docs/materials.json` in place. A materials-only rebuild
   set `anim: null` on 140 materials across 53 monsters — every clip in the game, Khezu's Angry and
   Taiden families included. **The rebuild sequence is `build-materials.py` THEN
   `build-matanim.py`.** Not needed this time: the pool is content-addressed by the source DDS, the
   DDS did not change, so every texture NAME is identical and the shipped materials.json is still
   exactly right for the new files — it was restored from git rather than regenerated. Verified:
   texture lists identical across all 186 monsters, and every material difference was the `anim`
   field alone.

Worth its own fix later: a build whose job list comes up empty should refuse to write rather than
ship an empty database.

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
#### 2026-09-11 - the ROM answers it: the clips are selected BY INDEX, and the colours are green and cyan

> Raven: "Review Boltreaver's effects, I don't see Green or Cyan coloring"

His two colours ARE the two clips. Read out of `em081_04.mrl` directly, in file order, identical on
all four taiden materials:

| clip index | hash | `fConstantColor` RGB | |
|---|---|---|---|
| **0** | 668876438 | 0.32, 1.00, 0.20 | **green** |
| **1** | 3084603398 | 0.20, 1.00, 1.00 | **cyan** |

Both are 30 frames, `loop = 1`, `auto = 0`, and both carry the same alpha pulse
(0.75, 1.0, 0.75, 0.85, 0.75, 0.95, 0.75). `XfBAN__E1_wing_taiden` carries the matching
`fEmissionColor` / `fSpecularColor` / `fReflectiveColor` triples instead of `fConstantColor`.

**The open question in the entry above is closed.** It offered three ways to reach an unnamed clip
-- "by hash, or by index, or by resolving the two hashes" -- and the ROM uses the second. Neither
hash appears anywhere in the binary as a literal, `uEm081_00` never calls `findMatClipByName`
(0xb08b44) at all, and the selection is a bare index:

    0101924c  mov  r1, #0          ; slot 0
    01019250  mov  r2, #1          ; CLIP INDEX 1  -> cyan
    010192c8  bl   0xb09ae8        ; setMatClip

    010192c0  mov  r1, #0          ; slot 0
    010192c4  mov  r2, #0          ; CLIP INDEX 0  -> green
    010192c8  bl   0xb09ae8

`0xb0cff0` reads the index currently in a slot and the code skips the call when it already matches.

Boltreaver has NO class of its own -- `em081_04` runs `uEm081_00`, so base Astalos and Boltreaver
share this code and differ only in the `.mrl`. Base Astalos's `XfBA2_taiden` carries ONE clip, hash
836608300, white with only the alpha pulsing, and `auto = 1`, so it selects itself. Boltreaver's
four carry the green/cyan pair with `auto = 0`.

**Three parallel state machines**, one per charged region, each a 5-case jump table on its own byte,
each driving its own cached material-anim object:

| dispatcher | state byte | anim object(s) |
|---|---|---|
| A | `enemy+0xcb01` | `enemy+0xcb30` |
| B | `enemy+0xcb02` | `enemy+0xcb34`, `enemy+0xcb38` |
| C | `enemy+0xcb03` | (unread; `enemy+0xcb3c` is the fourth cached object) |

The objects are cached at spawn (0x1011570-0x1011608) by the material number in
`material+0x18 >> 22`, the same idiom as Khezu: 30 -> `0xcb30`, 32 -> `0xcb3c`, 33 -> `0xcb34`,
36 -> `0xcb38`; numbers 31, 34 and 35 are deliberately not cached.

Dispatcher A, read in full, with the `.mpm` groups each case applies:

| state | setVisibleGroup | parts turned ON | material clip |
|---|---|---|---|
| 0 | g3 / g4 | 10,101 / 20 | `clearAllSlots` - **off** |
| 1 | g5 / g6 | 10,30,31,101 / 20,30,50 | `clearAllSlots` - **off** |
| 2 | g7 / g8 | 10,40,41,101 / 20,40,51 | **clip 0 - green** |
| 3 | g33 / g34 | 10,30,31,40,41 / 20,50,51 | **clip 0 - green** |
| 4 | g7 / g8 | 10,40,41,101 / 20,40,51 | **clip 1 - cyan** |

(Corrected 2026-09-11: the first version of this table came from a .mpm.xml parse that paired each
part id with the previous pair's visible flag -- see the Savage Deviljho entry. The colour finding
is unaffected; it came from the .mrl and the disassembly.)

The `cmp r5,r6 / movwls` inside each case picks between the two group variants on a break level, so
every charge stage has an intact and a broken form. Green is the lower charge and cyan the full one.
This is exactly the shape of Raven's original note -- "charge states ... tuning on and off multiple
part groups for each charge state" - now with the groups named.

#### Why nothing is coloured on screen today

Not the clip data and not the renderer. `fConstantColor` is applied on both the additive and the
unlit Constant / ConstantFog paths (`render/material.js:880`, `render/rom/material.js:160`). The
cause is that **nothing selects a clip at all**:

* `clipPicker` matches by NAME -- both clips have `name: null`;
* its `auto` fallback needs the load-time bit -- both have `auto = 0`;
* the general last-resort loop fallback would pick one, but it is **default OFF**:
  `let clipFallback = false` (`render/monster.js:1397`).

So both materials sit on their shipped static `fConstantColor`, which is white. The fallback was
left off for a stated reason -- Valstrax's `Loop` drives `fConstantColor` to BLACK, so "the
sustained loop" is that material's OFF state, and the comment says the choice "is Raven's to make
per material, not mine to guess library-wide". **That is no longer a guess for this monster:** the
ROM names the index per charge state.

Worth knowing alongside it: `part-rest.json` gives em081_04 no rest `sets` and `defaultSet 2`, and
g2 touches nothing in the taiden family. Since the engine starts
with every group drawn, Boltreaver currently draws EVERY charge-effect mesh at once (10, 20, 30,
31, 40, 41, 50, 51, 101), all on the static white. Fixing the colour without the groups would make
all of them green rather than one stage.

**NOT ACTED ON.** The clip-by-index selection is mine to wire; the per-state part groups are the
parts agent's table, and `render/monster.js` has their uncommitted changes in it right now.

**Blocked, and worth fixing separately:** `arm32pic.py` and `build-matanim.py` both hardcode
`C:\MHGU-Extract\exefs\`, which does not exist -- the ROM is at `C:\MHGU-ROM\exefs\`. Two
build scripts could not be run this session because of it.

#### PATCHED 2026-09-11 - `ROM_CLIP_LADDER`, selection by clip index

> Raven: "Proceed with patching Boltreaver's coloration"

Colour only. The per-charge-state PART groups are a separate change and are not made here.

All of it is in `render/monster.js`; `index.html` is untouched, which matters because the parts
agent has uncommitted work in that file.

* **`ROM_CLIP_LADDER`** - a per-monster table naming, per material, the rungs the ROM addresses by
  index. One entry: em081_04's four charge materials, rung `#0` Green and rung `#1` Cyan. Labels
  are the DATA -- each rung is named for the colour its own clip writes -- and `part-review.json`'s
  `rage` map renames them if different words are wanted.
* **`rageLadder(root)`** falls back to that table only when the NAME-derived ladder came out empty,
  so a named ladder can never be displaced by it.
* **`clipPicker`** resolves a `#N` rung as a clip INDEX, and only on the materials the table lists.
  Everything else falls through unchanged -- `XfB__A1_tikuden` carries its own auto-play UV scroll
  and must not be dragged onto a charge colour.
* **`loadMonster`** stashes `root.userData.monId`, so the ladder builder can reach the id without
  `index.html` having to thread it in.

The clip array the picker indexes is `rom.anim`, which `build-matanim.py` fills in .mrl FILE ORDER,
so N here is the same N the ROM passes to setMatClip. Verified against the .mrl directly rather
than assumed.

**Verified by reading material values back out of the running app**, not by looking at it, and with
both controls the Grimclaw lesson asks for -- one that changes nothing and must read 0, one that
changes something known and must read large:

| material | rung 0 (No Rage) | rung 1 (Green) | rung 2 (Cyan) |
|---|---|---|---|
| `XfBA2_taiden_head` `.color` | 1, 1, 1 | **0.32, 1, 0.2** | **0.2, 1, 1** |
| `XfBA2_taiden_crow` `.color` | 1, 1, 1 | **0.32, 1, 0.2** | **0.2, 1, 1** |
| `XfBA2_taiden_tale` `.color` | 1, 1, 1 | **0.32, 1, 0.2** | **0.2, 1, 1** |
| `XfBAN__E1_wing_taiden` `.emissive` | 0.75, 0.925, 0.575 | **0.32, 1, 0.2** | **0.2, 1, 1** |
| CONTROL `XfB__A1_tikuden` | 0.75,0.75,0.25 / em 0.5,0.5,0.5 | unchanged | unchanged |
| CONTROL `XfB_N__E_m00_body` | 1,1,1 / em 0,0,0 | unchanged | unchanged |

The values match the .mrl keys exactly. Returning to rung 0 restores every material to its base,
including the wing's authored emissive -- the change is reversible, which is the ROM's
`clearAllSlots` state.

Driven through the app's OWN `levelClip()` (via `__view.clipFallback`, which re-steps with it), so
the whole live chain is covered: select value -> `state.rageLevel` -> `levelClip()` -> `clipPicker`
-> material. The rAF loop itself could not be exercised -- the Browser pane is hidden, which
suspends `requestAnimationFrame`, so `renderer.info.render.frame` never advances and the tikuden UV
scroll does not move either. That is environmental; the loop calls `stepMatAnim` with `levelClip()`
every frame (`index.html:3983`), which is the call that was driven directly.

No regression on the name-derived ladders: Bloodbath Diablos still reads Calm / Building / Full,
Chaotic Gore Magala still reads No Rage / Level 1 / Level 2 / Level 3 / Max, and Rathian still has
no ladder row at all.

**STILL OPEN:** the parts half. `part-rest.json` gives em081_04 no rest sets, so every charge-effect
mesh is drawn at once and picking a rung colours ALL of them rather than lighting one stage. The
ROM's per-state group sets are in the table above (g3..g8, g33, g34).

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
#### 2026-09-11 - re-reported, and the old diagnosis above is RETRACTED

> Raven: "Savage Deviljho's Effects are either not rendered (there should be like three meshes for
> this missing effect) and the one that does render is blobby, it should be sharper."

**The three meshes are parts 6, 9 and 12**, found by traversal rather than inference. Six meshes
carry the three effect materials:

| mesh | part | material | calm | enraged |
|---|---|---|---|---|
| `Group0_7` 1106v | 0 | `XfBA0__m03_body_a` | drawn | drawn |
| `Group3_1` 32v, `Group3_2` 483v | 3 | `XfB__m02_body_k` | drawn | drawn |
| `Group6` 40v | 6 | `XfB__m02_body_k` | **off** | **off** |
| `Group9` 59v | 9 | `XfB__m02_body_k` | **off** | **ON** |
| `Group12` 306v | 12 | `XfBA_IW_1__m00` | **off** | **ON** |

**Two of the three already render - on the Enraged toggle - and that is the ROM's own gating.**
`uEm043_00` (em043_05 shares the class) refreshes part visibility in two functions, each with a
top-level branch on rage:

    00e807e0  cmp r5,#0 / cmpeq r7,#0 / bne 0xe808cc    ; r7 = 2 when enraged AND r6==5, else isEnraged
              calm  -> setVisibleGroup(0)   g0  on [0,100]     off [3,12]
              else  -> setVisibleGroup(9)   g9  on [0,3,100]   off [12]

    00e80bd4  bl 0x81670 / mov r1,#1 / cmp r0,#0 / movwne r1,#2
    00e80be4  cmp r5,#5 / movne r1,r0
    00e80bf0  cmp r1,#2 / movne r1,#9 / moveq r1,#0xd
              g13 on [0,3,12,100] off []  <- ONLY when enraged AND r5==5; g9 otherwise

So **part 12 requires enrage**, and it is the 306-vertex `XfBA_IW_1__m00` layer whose clip is the
auto-play `effect`. Part 9 comes on in the effect branch through the break query:

    00e808d8  ldr r2,[r0,#0x370] / blx r2 / cmp r0,#1   ; "is part 1 broken?"
              movne r1,#0xa  -> g10  on [9,101] off [8]      not broken
              moveq r1,#0xc  -> g12  on [8]     off [9,101]  broken

and the calm branch runs the same query against g4 / g8 instead, where g4 is `on [101] off [8,9]`.

**Part 6 is a BREAK state, not an effect state**, which is why it stays off in both:

    00e80cd0  cmp r5, r0        ; cmp LEVEL, THRESHOLD  -- the `cmp level,thr` form
    00e80cd4  bhs 0xe80ce8      ; level >= thr -> g11  on [5,6] off [4]   BROKEN
              else              ;              -> g3   on [4]   off [5,6] undamaged

So part 6 appears once part 0 is broken. Nothing is missing from the data: the effect is gated
behind Enraged, and the third mesh behind a part break.

#### A parse bug of mine, corrected

My first reading of these .mpm group tables was WRONG and the earlier Boltreaver entry carries it.
Each group's MtArray opens with its own `<bool name="mAutoDelete">` BEFORE the per-part classrefs,
so harvesting every `<s32>` and every `<bool>` separately and zipping them pairs each id with the
PREVIOUS pair's flag - inverting most rows without looking wrong. The correct parse takes one id
and one flag from inside each `<classref type="0x176B8C8B">`. Checked against the app's own shipped
group table, which agrees row for row. **The Boltreaver "parts drawn" column above is affected; the
colour finding there is not - that came from the .mrl and the disassembly, neither of which uses
this parse.**

#### The blob: the diagnosis above is STALE, and the cause is NOT established

The entry above blames `uCutSolid` from 51a71d0. That no longer applies. `installCutoutSolid` is
gated `lit && mat.alphaTest && blend === 'opaque'` (rom/material.js:341), and after the cause-J fix
`alphaTest` is 0 on every monster material except the three in `AUTHORED_CUTOUT` - none of which are
Savage's. So the line is not installed on any of these three materials and cannot be the blob.

Ruled out as well: **texture resolution is not lost in our pipeline.** The ROM's own .tex files are

    em043_05_02_BM          512x512    -> XfB__m02_body_k
    em043_05_03_BM          256x256    -> XfBA0__m03_body_a
    em043_05_04_BM_NOMIP    128x128    -> XfBA_IW_1__m00

and the shipped webp for each is exactly those dimensions. The effect textures really are small;
we are not downsampling them.

**What the cause IS remains unread.** The most likely place is what `FTransparencyAlphaConstant`
(mfx record 1910) actually does - two of the three materials select it, and this viewer has never
decoded it, it only knows that it is not the Alpha blend source and not a clip. That is the same
unread switch as the alpha-cutout question. Saying so rather than reaching for the next plausible
knob.
#### PATCHED 2026-09-11 - the ROM's own mip count, honoured

> Raven: "I see more coverage, keep going until we have it more closely replicated"

**An MT `.tex` header carries its own mipmap level count**, and across all 514 monster textures
exactly FIVE ship a single level. All five say so in the ROM's own filename:

    em027_00_eft1_nomip     64x128     em027_00_eft3_nomip    256x256
    em027_00_eft2_nomip    128x128     em086_00_add_nomip     256x256
    em043_05_04_bm_nomip   128x128  -> Savage's XfBA_IW_1__m00, the neck glow (part 12)

Every other monster texture carries a full 7..11-level chain, so a single level is an authored
decision per texture, not an artefact of the extraction. `getTexture` generated a chain on all of
them and sampled it `LinearMipmapLinear`, so under minification these five drew a blur the game
does not have -- and Savage's is a 128x128 map whose clip runs `fUVTransform` u 0 -> 1 across a
mesh whose UVs already span -0.613..1.469, i.e. scrolling and tiled, the worst case for it.

`render/assets.js` now sets `generateMipmaps = false` and `LinearFilter` on exactly those five.
Anisotropy is untouched: it needs no mips.

**Verified in the running app, with three controls:**

| material | texture | generateMipmaps | minFilter |
|---|---|---|---|
| `XfBA_IW_1__m00` (the NOMIP one) | 128x128 | **false** | **Linear** |
| `XfBA0__m03_body_a` control | 256x256 | true | LinearMipmapLinear |
| `XfB__m02_body_k` control | 512x512 | true | LinearMipmapLinear |
| `XfB_N__E_m01_body` control | 1024x1024 | true | LinearMipmapLinear |

This is the neck glow only. It does NOT claim to explain softness on the two layers that draw in
the base state -- those keep their ROM mip chains, correctly.

#### The material-clip driver, read in full

`uEm043_00` caches three materials at spawn by the number in `material+0x18 >> 22`, which is the
`mNN` in the name (0xe729dc-0xe72a6c):

| slot | matnum | material | driven with |
|---|---|---|---|
| `enemy+0x8c` | 1 | `XfB_N__E_m01_body` | `Gekikou_Start` / `Gekikou_End` |
| `enemy+0x90` | 2 | `XfB__m02_body_k` | `Angry_Start` / `Angry_End` |
| `enemy+0x94` | 3 | `XfBA0__m03_body_a` | `Gekikou_Start` / `Gekikou_End` |

At spawn, **when the variant byte is 5 -- the Savage deviant -- it plays `Angry_Start` on matnum 2
immediately** (0xe72a2c `cmp r0,#5`), slot 0, time zeroed. That is exactly what `ROM_SPAWN_CLIP`
already encodes, now confirmed against its own site rather than inferred.

The rage driver (0xe806a0, 0xe80ae8) runs a 4-state latch at `[enemy+0xcac0 + 0x98]`:
`Angry_Start` on entering rage (latch 0->1), then `Gekikou_Start` on BOTH matnum 1 and matnum 3
(latch 1->2), and the mirrored `*_End` pair on the way out. So **the body material itself is part
of the rage look**: `XfB_N__E_m01_body`'s `Gekikou_Start` ramps `fAlbedoColor` 1,1,1 -> 1,0.8,0.8
over 60 frames. `XfBA_IW_1__m00` is not driven at all -- its single clip carries the auto bit.

#### The flipped rage pair: RE-READ, and the answer is that it IS flipped

`docs/part-review.json`'s em043_05 note says "The ROM site re-read is on the board and covers all
four monsters." Done, here:

    00e80bd4  bl 0x81670            ; isEnraged -> r0
    00e80bd8  mov r1,#1 / cmp r0,#0 / movwne r1,#2
    00e80be4  cmp r5,#5 / movne r1,r0
    00e80bf0  cmp r1,#2 / movne r1,#9 / moveq r1,#0xd

`r1 == 2` requires enraged AND `r5 == 5`, so **g13 is the ENRAGED set and g9 the calm one**. The
same shape at 0xe807e0 gives em043_00 **g0 calm, g9 otherwise**. `ROM_RAGE_SET` is `[calm, rage]`
(confirmed rows: Gypceros `[[6,2]]` = "rage 2 / calm 6"), so both entries --
`em043_00: [[9, 0]]` and `em043_05: [[13, 9]]` -- are indeed the wrong way round.

**NOT CHANGED.** The parts agent has a live workaround keyed to the table AS IT STANDS (a per-state
review key `0,3,100|0,3,12,100`), so flipping it underneath them would compound and invert the
result. This is the citation they were waiting for; the edit is theirs to sequence.

#### Part 6 has no route in the viewer

`clusterGroups` reads cluster `4,5,6` with THREE members -- g3 `on [4]`, g6 `on [5]`, g11
`on [5,6]` -- and the ROM picks g11 when part 0's break level reaches its .dtp threshold
(0xe80cd0 `cmp r5,r0 / bhs`). The panel's Face row offers only Intact=g3 and Broken=g6, so **g11,
the only member that draws part 6, cannot be selected in any state**. Cluster `8,9,101` has four
members and shows two the same way; parts 9 and 12 escape it only because rage reaches g10/g13
through `defaultGroupsOn`. Reported, not touched -- the rows are the parts agent's.

#### 2026-09-11 - WE WERE LOOKING IN THE WRONG PLACE. The vortex is not a part at all.

> Raven: "Hmmm, it seems we are way off" [two screenshots] ... "the effect in game is akin to a dark
> vortex that envelops the torso" ... "Is it possible we have been looking in the wrong locations?"

Yes. His screenshots settle it: the game draws a DARK WISPY VORTEX around the torso and shoulders;
the viewer draws hard-edged translucent RED POLYGON SHARDS. That is not a soft-vs-sharp problem and
no amount of work on part visibility or mip levels reaches it.

**The monster's .arc holds 589 files. The extraction keeps 45.** Everything under `effect\` -- 189
files, **17.7 MB, more than twice the 7.2 MB of the monster's own model data** -- has never been
extracted, for this or any other monster.

| group | files | size | type hashes |
|---|---|---|---|
| `sound\` | 219 | 4.1 MB | |
| **`effect\`** | **189** | **17.7 MB** | 241f5deb (.tex) 2749c8a8 (.mod) 58a15856 (.mrl) 4e397417 6d5ae854 5a525c16 254309c9 |
| `shell\` | 145 | 0.03 MB | |
| `enemy\` | 35 | 7.2 MB | the 45 we take |

Inside `effect\`:

* **`effect\em\em043\`** -- em043's OWN effect definitions, type `6d5ae854`. Nine of them, and
  **two are Savage-specific**: `em043_05_000` (4832 B) and `em043_05_002_s` (5488 B).
* **`effectase\`** -- 144 files, 17.4 MB: **53 distinct effect MODELS**, each with its own
  `.mod` (2749c8a8), `.mrl` (58a15856) and `.tex` (241f5deb, mostly `*_HQ_NOMIP`). This is where a
  vortex mesh and its texture live.
* **`effect\psl\enemy\em043\em043_00\mot\em043_00_{0,2,3,4}`** -- the PER-MOTION effect script,
  type `254309c9`. This is what binds an effect to an animation, which is how a rage vortex gets
  attached to a rage motion.
* **`effect\pel\em\em043_00c` and `em043_05u`** -- the effect lists; `em043_05u` is Savage's own.
* **`effect\cm\`** -- 29 shared/common effect definitions.

**The viewer has no monster-effect pipeline at all.** `harvest-effect-models.py` handles only WEAPON
proof effects (the Bow's nocked arrow) out of `arc/shell/pl/wNN.arc`; `effect-mounts.json` has
exactly ONE entry, `ems007_00`; `docs/effects/` does not exist.

**So the three "effect" meshes in the .mpm -- parts 3, 6, 9 (`XfB__m02_body_k`), 0
(`XfBA0__m03_body_a`) and 12 (`XfBA_IW_1__m00`) -- are the ON-BODY glow layers, not the vortex.**
Everything established about them above still holds and is still worth having, but it was never
going to produce what his first screenshot shows. The red shards are presumably one of those body
layers drawn without the vortex that should surround it, and judging their colour is pointless
until the missing 17.7 MB is on screen beside them.

**NOTHING DONE.** Harvesting `effect\` is a new pipeline -- a second model/material/texture source,
a per-motion binding format, and an effect runtime -- not a patch. Raven's call.
#### HARVESTED 2026-09-11 - `harvest-monster-effects.py`

> Raven: "I will likely want the effects for various things like attack animations, so harvest them"

`harvest-monster-effects.py` (in the extract root, unversioned like the other harvest scripts)
walks all 137 enemy archives and extracts everything under `effect\`. **2,312 distinct resources,
87.8 MB, no failures** -- every file's magic checked against its type hash rather than trusted:

| ext | type | refs | distinct | size |
|---|---|---|---|---|
| `.tex` | rTexture `241f5deb` | 7379 | **188** | 73.9 MB |
| `.efl` | EFL `6d5ae854` | 4042 | **1115** | 6.5 MB |
| `.mod` | rModel `58a15856` | 3646 | **160** | 3.4 MB |
| `.mrl` | rMaterial `2749c8a8` | 3646 | 160 | 0.2 MB |
| `.ean` | EAN `4e397417` | 3256 | 70 | 0.0 MB |
| `.psl` | rProofEffectMotSequenceList `254309c9` | 507 | **364** | 2.3 MB |
| `.pel` | rProofEffectList `5a525c16` | 280 | 254 | 1.4 MB |
| `.pep` | PEP `20ed9750` | 2 | 1 | 0.0 MB |

730 of 2,131 paths are shared between archives, so keying the output by archive-internal path
writes each shared `effect\cm\` and `effectase\` resource once.

TWO LABELS I HAD BACKWARDS in the previous entry, corrected from `build/frag/resource-ids.json`
(65,565 records) rather than from the folder names: **`58a15856` is rModel and `2749c8a8` is
rMaterial**, not the other way round. `6d5ae854` and `4e397417` are in no id table at all; their
magics are `EFL\0` and `EAN\0`.

This also refutes `harvest-monster-effect-models.py`'s premise. That script says "of the 605 rModel
records in the whole image ... exactly 24 are in enemy archives and all 24 are in ems007_00.arc",
and ships one `effect-mounts.json` entry on the strength of it. rModel is `58a15856`, of which the
id table holds **18,968**, and `effectase\` carries **160 distinct effect models** across the
enemy archives. That script was counting the wrong hash.

#### The EFL references are PLAIN STRINGS, so the effect graph needs no format decode

Savage's two own definitions name their resources in readable ASCII:

    em043_05_000     effectase\cm202_042   cm150_000   cm100_000
                     + @effectase\cm202_042_HQ_NOMIP, @...\cm100_000_GSM_HQ_NOMIP
    em043_05_002_s   effectase\cm150_000   em024_00_001   cm202_042   cm090_009
                     + chains to effect\em\em043\em043_00_900

`cm090_009` has no `.mod` because it is an `.ean`, 72 bytes -- an effect animation, not geometry.
The `@`-prefixed names are the textures.

**All four models convert with the existing `buildlib.mod_to_gltf`**, first try:

| model | meshes | verts | materials |
|---|---|---|---|
| `cm202_042` | 4 | 819 | `XfBAW_cm202_042` |
| `cm150_000` | 15 | 4488 | `XfBA1__cm150_000` |
| `cm100_000` | 58 | 5354 | `XfBAW__cm100_003v` + 3 |
| `em024_00_001` | 7 | 1866 | `XfBAW_1__cm130_117v` + 3 |

The material names follow the same `Xf*` convention as monster materials, so `build-materials.py`
should read their MRLs unchanged.

**STILL TO DO:** staging the models and textures into `docs/`, the EFL's own structure (emitter
placement, timing, colour), the `.psl` motion -> effect binding that Raven wants for attack
animations, and a runtime to mount and play them.
#### 2026-09-11 - the effect base models are PARTICLE TEMPLATES, and that is the remaining gap

> Raven, with a screenshot: "I see some things, but not a lot" ... "So, it hardly looks different"

The staged models ARE mounting -- the small white wisps on his flank are `cm150_000`. The reason
there is so little of it is structural, and visible in the source art:

| texture | what it actually is |
|---|---|
| `em043 m02_body_k` p3 | the red glowing cracks on the hide -- correct in his shot |
| `em043 m03_body_a` p0 | a dark subtle wash |
| `em043 XfBA_IW_1__m00` p12 | a RED/DARK FLAME BAND -- this is the "red shards", and it is an ON-BODY layer, not the vortex |
| `cm202_042` | LIGHTNING BOLTS, four of them side by side |
| `cm150_000` | a 4x4 ATLAS OF SMOKE PUFFS |
| `cm100_000` | a cloud/noise field |

And the UVs settle it. Every one of `cm150_000`'s 15 primitives has TEXCOORD_0 inside
**u 0.00-0.25, v 0.00-0.25** -- exactly ONE CELL of its 4x4 atlas. `cm202_042`'s four primitives sit
in **u 0.00-0.25, v 0.00-1.00** -- one COLUMN of its four bolts.

So a base model is authored against cell (0,0) and the EFL chooses the cell per particle by moving
the UV offset, on top of choosing how many to spawn, where, with what velocity, lifetime, size and
colour ramp. Mounting the base model once draws ONE STATIC INSTANCE of each. A dark vortex is not
one smoke puff; it is a few hundred of them over time.

**So the vortex needs the EFL's emitter block, and nothing short of that will look right.** What is
known of the format so far: a 48-byte header (`+8` = filesize-48, `+12` = 60.0, `+16`/`+18` counts,
`+18` matching a 16-byte table at 0x30); resource blocks with a 64-byte path field, 16-aligned, a
texture reference sitting exactly 193 bytes before its model, and `@` marking a texture; and after a
path field a run of (value, 0) pairs -- 120, -2, 60, -1, 1 on cm202_042 -- which look like timing
rather than a transform. The emitter block itself is unread.

Not a tweak away. Stated so the current mount is not mistaken for a near miss.
#### 2026-09-11 - the EFL is `rEffectList`, and the ROM carries its whole class tree

> Raven: "Yes, whatever we need for the effect to render proper"

The archive type hashes are `(crc32(name) ^ 0xFFFFFFFF) & 0x7FFFFFFF` -- the MT hash, masked to 31
bits. Confirmed against three knowns before using it (rModel -> 58a15856, rTexture -> 241f5deb,
rMaterial -> 2749c8a8), then run over dti.json's class names, which names every type the effect
harvest turned up:

| hash | class | file |
|---|---|---|
| `6d5ae854` | **rEffectList** | .efl |
| `4e397417` | **rEffectAnim** | .ean |
| `20ed9750` | rProofEffectParamScript | .pep |
| `1eb12c38` | rShellEffectParam | shell XFS |
| `79c47b59` | rSoundSourceADPCM | sound |

`rEffectList` has a full DTI record -- `size 152`, `mtVtable 0x178d014`, `createInstance 0xb59a94`
-- so its parser is locatable the same way every other decode this session was. The ROM also ships
the entire particle hierarchy: 96 effect classes including `cParticleGenerator` and its subclasses
`Billboard`, `LiteBillboard`, `MassBillboard`, `Model`, `Polygon`, `PolygonStrip`, `Polyline`,
`Line`, `Light`, `LightShaft`, `LensFlare`, `Force`, `Filter`, `Hit`, `Adhesion`, `AxisPolygon`,
`ClothPolygon`, `Custom` -- each with its own DTI size, so the emitter block's shape is readable
from the class rather than guessed from the bytes.

The toolset cannot help: `bin_to_xml` reports "Undetected file" on an .efl -- it is not an XFS
MtObject like the .mpm was, which is why that route gave named XML for parts and gives nothing here.

WHAT THE BYTES ALREADY SHOW, as a cross-check for whatever the parser says. In cm200_001 (816 B,
one emitter):

    0x158  ff36b3fd x2      an RGBA pair, fd b3 36 ff -- a warm orange, start/end or min/max
    0x1a4  0.9, 0.2 x2      a value/variance pair, twice
    0x1e0  -3.1416, 6.2832  THREE TIMES -- min and range, i.e. a full-sphere angular spread on
                            X, Y and Z. This is the giveaway that it is an emitter.
    0x270  0.997            a per-frame damping
    0x2a0  4                and the atlas is 4x4

**NOT YET DONE.** Reading the parser, mapping the emitter fields, and writing a particle runtime is
the remaining work, and it is the only thing that makes the vortex look right -- see the entry above
on why one static instance of a sprite-atlas template cannot.
#### 2026-09-11 - the EFL container, verified across all 1,115 files

> Raven: "we keep going until we have Savages effect since this will help us figure out more
> effects like it"

**Header, 48 bytes.** `+0` 'EFL\0'; `+4` version 06 03 12 20; `+8` = fileSize - 48 (holds on every
file); `+12` f32 60.0; `+16` u16 a; `+18` u16 b; `+20` 0x100.

**Index table at 0x30: `b` rows of 16 bytes, four u32 each, and every u32 is `(offset << 8) | tag`.**
That is not a reading I liked the look of -- it is the only one that survives the library. Six
candidate decodings were run over all 1,115 .efl files:

    v >> 8            in range on 1115 files, out of range on    0
    v & 0xFFFFFF      in range on    0,                       1115
    v >> 4            in range on    0,                       1115
    (v >> 8) * 4      in range on    0,                       1115
    (v & 0xFFFFFF) * 4in range on    0,                       1115
    (v >> 8) * 16     in range on    0,                       1115

**The four columns have distinct roles**, over 5,081 rows:

| col | tags | what the offset points at |
|---|---|---|
| 0 | an INDEX, 0,1,2,3... 28 values, frequency falling with value | f32 1.0 in 3,731 of 5,081 -- a transform/scale block |
| 1 | 5 (x3782), then 0, 1, 25, 2 | zeros, 1.0, or **-3.14159** (459) -- the angular-spread block |
| 2 | **18 (x2920), 17 (x1605), 34, 33, 81, 82** -- families, not an index | zeros, 1.0, -pi |
| 3 | 2 (x3237), 0 (x1479), 1, 5, 16, 18 | mostly zeros |

Column 2's tag behaves like a TYPE code, which is where the `cParticleGenerator` subclass will be --
the ROM ships 29 of them and none of their DTI hashes appears anywhere in any .efl (checked, all
1,115), so the type is a small enum, not a hash.

Corroborating content already identified in cm200_001 (816 B, one emitter): an RGBA pair at 0x158
(fd b3 36 ff, warm orange); a value/variance pair 0.9/0.2 twice at 0x1a4; **(-3.1416, 6.2832) three
times at 0x1e0**, a full-sphere angular spread on X/Y/Z; 0.997 damping at 0x270; and 4 at 0x2a0
against a 4x4 atlas.

Dead ends, recorded so they are not retried: the toolset's `bin_to_xml` does not know .efl (it is
not an XFS MtObject like the .mpm); the 'EFL\0' magic appears nowhere in the executable as a
literal or a movw/movt pair, so the loader dispatches on the type hash; the DTI objects for
rEffectList and cParticleGenerator live at 0x211xxxx, past the end of .data, so they are built at
runtime and carry no static property table to read names from.

**NEXT:** map column 2's tag to a block layout, which gives the emitter fields by type.
#### 2026-09-11, end of day - em065_00 REVERTED TO PRE-WELD, and my diagnosis was wrong

> Raven: "I still see the welded Ears on Kecha Wacha"

Earlier today I blamed the merged ears on `weld-seam-skins.py` moving two of the 68 ear vertices,
capped the weld at `--max-shift 0.25`, re-ran it, and measured em065_00 down to 0 vertices over the
cap (`Group[5]#0` 2 rewritten, max shift 0.102). **He still sees it, so that diagnosis does not
hold.** The cap was not the fix, which means the merge is either a smaller weld shift than 0.25
still being too much, or not the weld at all.

`docs/models/monsters/em065_00.glb` is now restored to `56a1dcd`, the PRE-WELD file, byte-identical
(sha 161e3afa9aa0). That is the state it shipped in before any of today's welding, so tomorrow's
first look answers the question outright:

* ears still merged on the pre-weld file -> the weld was never the cause, and the real cause is
  still unfound. My whole 2026-09-11 ear entry above needs rewriting, not amending.
* ears correct -> the weld causes it even under the cap, and the ear parts (5, 103, 12, 13) want
  excluding from welding on this monster rather than capping.

The OTHER 105 models still carry the capped weld and are untouched by this revert; em065_00 alone is
back. Nothing here is committed -- the model files have been uncommitted all day.
#### 2026-09-11 - the cutout rule, from the ROM: OPAQUE + FTransparencyAlpha

> Raven [screenshot of white fur drawn as solid quads]: "I still notice some furs still draw meshes"
> ... "things like Old Fatty or Kirin are pretty bad looking"

**`AUTHORED_CUTOUT` may not need to be a hand list.** Cause J's census stands -- no MHGU material
selects `FTransparencyAlphaClip` -- but it stopped one step short. A material whose blend state is
**BSSolid** and whose feature word is **FTransparencyAlpha** is saying the albedo alpha IS the
transparency, on a material that does not blend. With no blend for it to be the SRC_ALPHA factor of,
a discard is the only thing that alpha can mean. That is the missing half of cause J.

Census over all 570 monster material records:

| blend | transp | count |
|---|---|---|
| opaque | False | 264 |
| **opaque** | **Alpha** | **133** |
| opaque | AlphaConstant | 62 |
| add | Alpha | 39 |
| add | AlphaConstant | 30 |
| blend | Alpha | 25 |

The 133 are 77 distinct names on 67 monster entries, and **all three of the current
AUTHORED_CUTOUT entries match the rule** -- it was derived without looking at them.

The names corroborate it independently, in the artists' own words: `_nuki` (nuki, cut-out) on
em050_00 and em086_00, `_ke` (ke, hair) on em035_00, `_hire` (hire, fin) on em010_00 and em049_00,
`_far` (faa, fur) on em065_00 and both Mizutsune, `_koke` (moss) on em055_00, plus the obvious
`_wing`, `_hair`, `_fur`, `_fin`, `_body_alpha`.

And the exclusions come out right without special-casing:

* Zinogre's `XfB_N__E_m00_body` -- the hide that must NOT be clipped -- is opaque + **False**, so it
  is out. Its 62% alpha-0 coverage is irrelevant because the ROM never calls that alpha transparency.
* Kirin's `XfBAN__E0__m02_hairalpha` is **blend** + Alpha: genuinely blended, not clipped.

Raven's screenshot is Zinogre's `XfBAN__E0__m05_hair` (em057_00 and em057_04), opaque + Alpha,
matching the rule and not in the list.

**THE ARGUMENT AGAINST SWITCHING IT ON WHOLESALE, and it is a strong one.** `m05_hair` is the exact
material cause J took the clip OFF, and that removal is what fixed **4,596 pixels of Thunderlord
Zinogre that were showing BACKGROUND -- holes straight through the silhouette**. Turning the rule on
puts the clip back on that material. Either the threshold is wrong (`gl.clip` is 0.0 everywhere and
the viewer adds 1/512, which removed 37.5% of m05_hair's texels) or something else differs between
a fur card that should fray and one that should not. **Not changed. This is the decode; whether it
ships, and at what threshold, is Raven's call against his own screenshots.**

Also measured and NOT usable: `dev/cutout-coverage.py`, which reports the alpha-0 UV coverage the
existing AUTHORED_CUTOUT comments cite. With controls it does not separate the cases -- Nargacuga's
fur (in the list) is 9.7..22.7% while Zinogre's body hide (must stay out) is 17.8..62.2%. The
coverage number is evidence about a single material, not a discriminator. Kept because the existing
comments quote it and it should be reproducible.
### Plesioth (em010_00) - head break looks like the wound sits on the surface
> "Plesioth's head break looks very incorrect, like the wound mesh is on the surface level"

**STATUS** NOT FOUND - four candidate causes measured and ELIMINATED, so this needs one more
detail from Raven rather than another guess.

The cluster is parts {2, 3}: g0 `on 2 / off 3`, g5 `on 3 / off 2`. Part 3 (173v `m52_hire` +
244v `m00_body`) is the intact head, part 2 (54v + 168v) the break; both sit at z 0.80..1.00 with
the eye at z 0.95.

**Eliminated, each by measurement:**

1. **DEPTH BIAS.** `XfBAN__E0__m52_hire` is `RSMeshBias12`, raw bias -512, and a first reading
   showed `polygonOffsetUnits: -512` -- which would fling the layer at the camera. That was an
   artefact of MY pane: `updateDepthBias()` runs in the animation loop and rAF is suspended while
   the Browser pane is hidden, so `unitsPerStep` sat at its default 32. Driven at the live camera
   distance (25.57, near 0.0256, lsb 1.524e-3) it comes out **-5.25**, and the body stays at 0.
   The conversion works.
2. **PART SWITCHING.** Toggling the row gives `on 2 / off 3` and `on 3 / off 2` exactly: broken
   draws 2 meshes of part 2 and none of part 3, intact the reverse, part 0's 11 meshes throughout.
   No state leaves both halves drawn.
3. **A FLOATING OVERLAY.** Both halves share vertices with the always-on head `Group[0]#3`: part 2
   is 43% coincident, part 3 25%. They are continuations of that surface, not patches laid on it.
4. **PART 100 MISSING.** All 9 of its meshes are `proxy: true` -- the ROM's own MASK_DRAWN bit 0 is
   clear, so they are collision/proxy hulls the game never draws either. Correct, not a gap.

**Left over, and worth Raven's eye rather than mine:** the panel names this row **"NeckParts 2, 3"**
while a separate row reads **"HeadParts 1"** -- and part 1 is 34v of `XfB__m02_ray`, an ADDITIVE
`RSMeshBias12` effect at z 0.925..0.977, not head geometry at all. If he was reaching for the head
break through the row called Head, he was toggling an effect layer. The names are the parts agent's,
so this is reported, not changed.

**What would settle it in one step:** which row he used, or a shot of the broken state.

#### Tooling note

`scratchpad/mpm.py` drops SINGLE-ENTRY visibility groups -- em010_00's g7/g8 (`on 1` / `off 1`) and
em043_05's g1/g5 came out empty, and the app's own shipped table is right where it is wrong. The
`(.*?)</classref>` non-greedy match is the suspect. Anything read from that script wants checking
against `monsters.json`'s `groups` before it is believed.
### Crimson Fatalis (em013_01) - the face, cross-referenced against normal Fatalis
> "Cross reference Crimson's model data with normal Fatalis. They will defer to some ways, but
> their faces in the distorted region should be similar"

Raven's method, and it was the right one: the sibling is the control. `dev/face-compare.py` walks
both models primitive by primitive for a Z region and reports vertex count, x range, offset from
each model's own midline, material and bound bone gids. Positions are the raw quantised shorts,
which IS the bind pose -- every skin matrix is identity there -- so a difference is geometry or
binding and never animation.

**The two are near-identical, which kills three hypotheses at once.** Both carry the same 14
primitives above z 27000, the same materials, the same midline of 13672, and the same asymmetric
`Group[2]` / `Group[3]` at +377/+384 against +374/+374. So those right-of-centre face pieces are
AUTHENTIC to the line and not a Crimson defect -- that was my first guess and it was wrong.

**Two real differences, and neither is ours:**

1. **Crimson binds 18 vertices to the ROOT bone; Fatalis binds none.** `Group[1]#0` and
   `Group[10]#0` each have 9 of 14 vertices carrying a root influence, where Fatalis binds the same
   vertices to bone gid 13. Both skeletons carry the same 59 gids (in a different order), so it is
   not a missing bone. BUT the weight is at most 0.0118, the weight sums are exactly 1.0000, and
   removing the root influence entirely displaces those vertices by **0.0** at bind pose. It cannot
   be the visible shift.
2. **Crimson's right-hand face pieces are sparser and reach further right.** `Group[4]#0` is 12
   vertices (10 left at 12740..12855, and just TWO right at 14506 and 14723) against Fatalis's 22
   (10 left, 12 spread 14148..14346). `Group[5]#0` and `Group[102]#1` show the same shape, all three
   reaching exactly 14723 where Fatalis stops at 14346/14603.

**NOT STALE.** Cause D says the joint-0 fix exists but `mod_to_gltf` skips regeneration when the
.glb is present. Tested: the .glb was moved aside and regenerated from the .mod, and the result is
**byte-identical, 248712 bytes, the same 18 root-weighted vertices**. So the shipped asset is
current and the root binding is what the .mod itself says -- the ROM's own data.

**Eliminated for the face shift, each by measurement:** the weld (Raven hard-refreshed on the
reverted model and still saw it); parts 1 and 10 (15.1% left/right imbalance with them off against
15.0% with them on -- 14-vertex pieces, far too small); a stale conversion (byte-identical
regeneration); the root binding (1.2% weight, zero bind displacement).

#### 2026-09-11 - compared to the ROM: nothing touched Crimson's data

> Raven: "Did anything touch Crimson's data somehow? Compare to the ROM. I find it odd other
> Fatalis don't have this issue as well."

**The extraction is faithful.** Decompressing the rModel entry straight out of each .arc and
comparing bytes:

    em013_00   ROM 243592 B  sha ab01a2c63c0aae69   disk identical
    em013_01   ROM 242844 B  sha e4e0569ae08b735a   disk identical
    em013_02   ROM 305404 B  sha 68148820a5b057cc   disk identical

**And the two .mods agree.** The disputed 14-vertex meshes -- Crimson 14/15, Fatalis 18/19, both
format 14d40022 stride 28 -- are byte-for-byte the same except the joint-index lane, and those
indices resolve to the SAME BONE through each model's own table:

    Crimson  .mod index 22  ->  gid 3   (the head)
    Fatalis  .mod index 11  ->  gid 3   (the head)

The 59 gids are identical between the two models; only their ORDER differs, which is why the raw
index does. Positions, normals and UVs are identical bytes.

**So the divergence is the CONVERTER, and it is one specific thing.** MT pads a vertex's unused
joint slots by REPEATING an earlier joint rather than zeroing them (established earlier in this
project, mod-skin-lanes). Crimson's .mod pads `22, 28, 22, 0` -- slot 2 repeats slot 0 -- and
Fatalis's pads `11, 11, 11, 0`. Their weights are identical:

    Crimson GLB v0   gids 3, 242,  0, 0   weights 0.9137, 0.0784, 0.0078, 0
    Fatalis GLB v1   gids 3, 242, 13, 0   weights 0.9137, 0.0784, 0.0078, 0

**The converter writes gid 0 where the .mod repeated gid 3.** On Fatalis the repeats carry ZERO
weight so nothing is lost; on Crimson slot 2 carries 0.0078, and that 0.78% of the head's weight is
handed to the ROOT instead. That is why one Fatalis has the fault and the others do not -- not
different data, different padding, meeting the same converter defect.

**Scale, honestly: it is small.** 18 vertices, 0.78% each, and ZERO displacement at bind pose --
measured, removing the root influence moves them by 0.0 -- because every skin matrix is identity
there. Posed, those 18 lag the head by 0.78% of its motion. Real, fixable, cause-D family, and
almost certainly NOT the visible shift Raven reported. Recorded rather than fixed tonight: the
repair belongs in the converter's slot handling, not in a per-monster patch.

**STILL TO CHECK, and it post-dates the report:** `XfBAN__E0__m01_body_alpha` is opaque +
FTransparencyAlpha, one of the 133 the cutout rule now covers, and a hard-edged plate over the
snout is exactly what that material looks like drawn without its discard. The screenshot predates
commit 8374d72.
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

## Standing census: RE-MEASURED 2026-09-10 -- the selector now reaches 44 of 152

**The 9-of-136 figure below is STALE.** It was counted 2026-09-09, before the Khezu work made
`sameClip` case-insensitive and added the `_End`-suffix and rest-name rules. Re-run against the
selector as it actually stands: **152 distinct material-clip names, 44 reached** -- 22 by exact
name (case-insensitive), 15 by the `_End` suffix, 7 by the rest-name regex. So cause A's FREE
half -- the case-only mismatches on 9 monsters -- is closed; nothing there is left to fix.

The remaining 108 are cause B, and they are authored semantics, not a matching bug: `Death`
(8 monsters), `Animation` (7), `BodyLight_Start_LV1..LVMAX` (Gore Magala's ladder), Agnaktor's
`maguma_*`, Nightcloak's `stealth_*`, Raging Brachydios's `Yellow_to_Red`. Deciding which of
those is enraged is Raven's call, as he said on 2026-09-05.

**31 monsters** carry at least one clip that no state selects AND no auto bit to fall back on,
so those materials sit frozen at frame 0 in every state. Worst: Nightcloak Malfestio 21 of 25,
Crimson Fatalis 16 of 25, Chameleos 15 of 17, Agnaktor 12 of 24, Altaroth 10 of 10.

---

## Superseded: the clip-name lists reach 9 of 136 names (2026-09-09)

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

## 2026-09-10 - Nargacuga's fur, and a w[6] correlation I am NOT using

Raven: "Nargacuga fur has edges showing the full mesh still." Same class as the Rathian quills --
`XfBAN__E0__m50_body` is a cutout and cause J took its discard away. Added to `AUTHORED_CUTOUT`.
Used by em037_00, em037_04 and em037_04/tail and nothing else; its alpha-0 UV coverage across those
runs 0.00 to 0.30, so the discard takes the card's surround and never the card. Verified: all seven
fur meshes now carry `alphaTest 0.001953`, no console errors.

### The hunt for the real switch, and where it stopped

Raven's rule is that the ROM IS the game and is right 100% of the time, so the clip is in there and
I have not read it. Two things were tried.

**The flag word.** Comparing materials that need the clip against ones that must not, no `fb` bit
separates them: the NEEDS cases are `8d901400` and the MUST-NOTs `8d900a00` and `8d903c00`, and the
differing nibble looks like a small field rather than independent flags.

**`w[6]` of the MRL material record, which nothing decodes.** It looked extremely promising:

    Nargacuga fur    XfBAN__E0__m50_body      NEEDS       0x264dc020
    Rathian wing     XfBAN__E0__m50_wing_l    NEEDS       0x264dc020
    Nargacuga body   XfB_N__E_m00_body        no cutout   0x200dc020
    Zinogre hair     XfBAN__E0__m05_hair      MUST NOT    0x20adc020

Scanned over all 103 opaque `transp: Alpha` monster materials, **bits 22, 25 and 26 are set on every
NEEDS case and clear on every MUST-NOT case**, and the group they select tops out at 69.8% alpha-0
UV coverage while the excluded group reaches 100% -- which is exactly Zinogre's hair, the case where
clipping deletes the whole mesh. A clean-looking partition.

**It is not the alpha test, and it is not used.** `w[6]`'s low 12 bits decode the same way every
other state word does -- `bs` 390 `BSSolid`, `ds` 441 `DSZTestWrite`, `rs` 450 `RSMesh` -- and w[6]
gives record **32, `IASkinTBNLA2wt`**: an INPUT ASSEMBLER declaration. So w[6] selects a vertex
format, and bit 25 correlates with fur-card-versus-skin art convention rather than meaning "clip".
Bit 25 is also set on 13 materials with `transp: False`, which have no alpha feature at all. Using
it would be a real ROM symbol carrying an invented meaning, which is the exact failure
[[citation-does-not-mean-sourced]] names.

**So the switch is still unread.** The next probe, not yet done: the material's technique key (w[0],
`5fb0ebe4` on all four of the above) selects a shader from AppShaderPackage; read THAT shader and
see whether it contains a discard and what gates it. That is where an alpha test would actually
live, and it is the one place not yet looked.

Until then `AUTHORED_CUTOUT` carries Raven's calls, three materials now, labelled as authored.

**Not judged.**

## 2026-09-10 - Rathian's quills: cause J was too broad, and there is no rule to replace it

Raven, with a close-up: "I noticed Rathian line had a regression, the back has quills that now show
the entire mesh." Real, and it is mine -- cause J removed the alpha clip from every monster material.

**Not the weld.** Checked first, because it was the most recent change: the weld only rewrites
JOINTS_0/WEIGHTS_0 bytes and cannot make a transparent surround opaque, and the Rathian line's weld
was tiny anyway -- median influence shift 0.0078, max 0.106-0.408, 0-4 vertices over 25%.

### Measured on em001_04

Restoring the old clip per mesh, as a fraction of each mesh's own on-screen pixels:

| mesh | material | on screen | cut by the clip |
|---|---|---|---|
| `Group[102]#0` | `m50_wing_l` | 266 px | **45.1%** |
| `Group[120]#0` | `m50_wing_l` | 576 px | 17.7% |
| `Group[0]#0` | `m50_wing_l` | 570 px | 12.3% |
| `Group[0]#1` | `m51_wing_r` | 23 px | 0% |

Nearly half of the quill card is surround. Those cards genuinely are cutouts.

### Why this is a LIST and not a rule

Cause J's census still stands on its own terms: no MHGU material selects `FTransparencyAlphaClip`,
`fAlphaClipThreshold` is 0.0 everywhere, and clipping on the blend feature destroyed 30% of some
hides and punched 4,596 background holes through Zinogre. It was right about those and wrong here.

The obvious repair is a per-mesh statistic -- how much of a mesh's UV area lands on alpha-0 texels --
and it **does not work**, measured:

| mesh | UV samples on alpha 0 | wanted |
|---|---|---|
| `em001_04` quills | 19-26% | **clip** |
| `em057_04` hair | 14-50% | **do not clip** |
| `em057_00` hair | **100%** | **do not clip** |

26% and 45% overlap, and the feature word is identical on both -- `transp: Alpha`, `albedo: Map`,
`blend: opaque`. Zinogre's 100% is the proof that the same channel is a GLOSS ramp there: nobody
authors a mesh that is entirely cut away.

So there is no threshold, no feature bit, and no decode that separates them. Rather than invent one,
`AUTHORED_CUTOUT` in `docs/render/rom/material.js` holds the materials Raven has judged to be
cutouts, labelled as authored. Two entries so far, the Rathian/Rathalos wing sheets.

Keyed by material NAME, which is safe here and was checked rather than assumed: that name is shared
by em001_00/02/04, em002_00/02/04, em010_00 and em050_00, and every one of them has UV coverage of
alpha-0 between 0% and 29% -- nowhere near Zinogre's 100% -- so the discard takes surround and never
geometry. Name-keying also avoids `render/monster.js`, which Raven's other agent is editing.

Verified: em001_04's four alpha materials carry `alphaTest 0.00195` again, em057_00's hair still
carries 0 and renders 73,332 silhouette pixels, no console errors on either.

**Not judged.**

## 2026-09-10 - Seam welding rolled out across the library

Raven, after judging the Mizutsune test case: "Okay, that seems to have worked well, so review each
monster and weld any seams."

`dev/weld-seam-skins.py --all --apply`. `--all` exists only because of that instruction; before it
the script deliberately had no library-wide mode, and one of `--only` / `--all` is still required so
it cannot run over everything by accident.

### Result, by the same sweep that found the problem, carrying its own control

| | before | after |
|---|---|---|
| same-part mismatched pairs | 21,152 | **0** |
| worst posed separation | **611.19%** | **0.00%** |
| models whose seams open past 3x their control | 74 | **0** |
| max control, the noise floor | 0.665% | 0.000% |

Counting every pair, including copies in mutually exclusive part variants, **zero** now open.
132 models analysed, 54 skipped as every `_tail` / `_head` model ships no skin of its own.

### The cost

* **105 of 132** models needed a weld
* **33,302 vertices** rewritten in total
* median influence shift **0.0078** -- under 1%
* **376 vertices, 1.1% of those touched, shifted more than 25%**, across 46 models

Those 376 are the ones that MOVE geometry rather than close a hairline. They are worth knowing
about, and they are also the cases that were already the worst broken -- `em088_00`'s pair was two
coincident vertices bound 100% to joint 5 and 100% to joint 10, tearing to 611% of model size. A
weld there does not make that vertex correct, it makes it CONTINUOUS: the surface stops splitting
and follows one limb. Continuous-and-locally-wrong beats torn, but it is a judgement, and the models
carrying the most of them are worth an eyeball: `em065_00` (12), `em088_00` (8+), `em071_05` (54 in
the first pass), `em086_00` (26), `em012_00` (21).

Spot-checked after: `em088_00` 45,738 silhouette pixels / 40 meshes / 8,188 vertices, `em071_05`
66,130 / 65 / 9,303, no console errors.

### A bug in the first pass, and what it cost

The first pass left **208 pairs across 32 models** still disagreeing, and the sweep kept reporting
them. The weld and the sweep disagreed about what "the same vertex" means: the sweep denormalises
POSITION (SHORT with `normalized: true` under `KHR_mesh_quantization`) before grouping, while the
weld grouped on the RAW shorts -- about three times tighter -- so it silently skipped near-coincident
copies. Fixed by giving the weld the same denormalisation, and a second pass caught the remaining
208. **A fix and its check have to share their definitions or they will quietly disagree**, which is
the same lesson as the control rule, one level up.

### Reversibility

Nothing is destroyed: the pre-weld bytes are in git history. To restore one model,
`git checkout <commit-before> -- docs/models/monsters/<id>.glb`; for all of them, the same against
`docs/models/monsters/`. `--no-backup` was used for the bulk run precisely because git is the better
restore path than 105 loose `.preweld` files.

**Not judged.** This is a deliberate deviation from the ROM on 105 models, and whether the library
looks right afterwards is Raven's call.

## 2026-09-10 - Mizutsune's seams welded, as a test case

Raven: "As a test case, weld Mizu's seams. I want to hold off on doing it across the board until we
patch more monster issues."

**This is the project's first deliberate deviation from the ROM**, and it is here only because the
faithful options ran out: the `.mod` binds the two copies of a seam vertex differently, our exporter
reproduces the `.mod` correctly, and every render-side candidate came back identity. There was
nothing left to fix faithfully.

`dev/weld-seam-skins.py`, `--only em082_00 --apply`. It requires `--only`; there is no library-wide
default, on purpose.

### Which binding wins, and why not an average

An average moves BOTH copies away from what the ROM says, and on a group of three copies it invents
a binding that no copy had. Instead a canonical copy is ELECTED and the others are made to match, so
at least one copy of every seam keeps the ROM's own answer exactly:

1. the binding most copies already share -- changes the fewest vertices
2. failing a majority, the richest, most non-zero influences -- loses the least
3. failing that, the lowest primitive index -- so a rerun is deterministic

### The cost, measured rather than assumed

| | |
|---|---|
| seam groups whose copies disagreed | 427 |
| vertices rewritten | **648** of 9,824 |
| influence shift, median | **0.0078** -- under 1% |
| influence shift, 90th percentile | 0.0118 |
| influence shift, max | 0.3137 |
| vertices shifted more than 25% | **2** |

So all but two of the 648 changed vertices moved by a hair; the whole model is 6.6% of its vertices
touched, almost all by under 1.2% of their influence.

### The result

| | mismatched pairs | worst posed separation | pairs > 0.2% | control |
|---|---|---|---|---|
| before | 530 | **21.52%** | 528 | 0.057% |
| **after** | **0** | **0.00%** | **0** | 0.000% |

Every seam now holds under every pose sampled. Renders clean afterwards: 76,810 silhouette pixels,
63 meshes, 9,824 vertices, 41 bones, no console errors.

### Reversibility

The script writes `em082_00.glb.preweld` beside the model before touching it, and that file is NOT
committed -- the pre-weld bytes are already in git history, which is the better restore path. To
undo: `git checkout <commit-before> -- docs/models/monsters/em082_00.glb`.

**NOT rolled out.** One monster only, at Raven's instruction. Whether the welded Mizutsune actually
looks right is his call, and it is the whole point of the test case.

**Not judged.**

## 2026-09-10 - The seam bindings differ IN THE .mod. The exporter is faithful.

The question the whole skinning thread was building to: does the `.mod` give both copies of a seam
vertex the same binding, so that our export broke it, or does it already disagree? **It already
disagrees.** So this is not fixable in the export, and no render-side change can touch it either
(see the previous entry, where every offset candidate came back identity).

### How it was established

`dev/mod-skin-solve.py` pairs each MOD mesh with the GLB primitive it became -- match on dequantised
position, 61 of 61 paired on `em082_00` -- and then compares. What matters is that the comparison
does not depend on decoding the weight lanes:

* On **786** fmt-64593025 seam pairs the MOD's `w0` is byte-identical between the two copies while
  the GLB weights differ. If the exporter were inventing the difference, that is where it would show
  -- and instead the MOD's own JOINT SLOTS differ, and the GLB mirrors them exactly:

      A   MOD joints16..19 [4, 3, 2, 2]  ->  GLB j=[4, 3, 2, 0]  w=[228, 25, 2, 0]
      B   MOD joints16..19 [4, 3, 3, 3]  ->  GLB j=[4, 3, 0, 0]  w=[228, 27, 0, 0]

  One copy carries three influences, the other two, with the third's weight folded into the second.
  The exporter reads the slots, drops the repeated padding, and writes joint 0 at weight 0. Correct.

* Which MOD bytes differ between the two copies is itself the tell. Across pairs whose GLB binding
  AGREES vs pairs whose binding DIFFERS:

  | MOD byte | binding agrees | binding differs |
  |---|---|---|
  | 16 (joint 1) | 0% | 1% |
  | 17 (joint 2) | 16% | 4% |
  | **18 (joint 3)** | 24% | **54%** |
  | **19 (joint 4)** | 7% | **99%** |
  | 6-7 (`w0`) | 0% | 4% |

  The disagreement is concentrated in the MOD's trailing joint slots, which is MOD data the exporter
  only reads.

* What differs, on the GLB side, across all 1,963 differing pairs: 1,362 differ in both weights and
  joints, 539 in joints alone, 62 in weights alone.

### What was decoded, and what was NOT

Decoded and checked across 6,936 vertices of fmt 64593025:

* the vertex position is 4 shorts and the FOURTH is **w0**, normalised by 32767 --
  `pos[3]/32767 == WEIGHTS_0[0]/255` on **97.9%** of vertices, max error 0.0079
* the four **joint slots are bytes 16..19**, with unused slots padded by REPEATING an earlier joint
  rather than by zero -- which is why the exported 4th joint is 0 wherever the MOD's is a repeat
* `sum(WEIGHTS_0) == 255` on all 9,496 paired vertices
* fmt `0cb68015` (stride 20) is the one format that gives itself away directly: bytes 12..15 sum to
  255 on 100% of vertices (weights) with joints at 8..11

**NOT decoded: w1, w2, w3.** They are not plain `u8/255` or `i16/32767` at any offset -- the best
lane in an exhaustive search over all 40 offsets and both encodings reaches 39%, and the apparent
83.9% hit for w3 is the dead field agreeing with zeros, not a decode. They are packed some other
way. That gap is stated rather than papered over, and the conclusion above does not rest on them.

### What this means

* **Nothing in this viewer can fix it.** Not the export, not the renderer.
* The ROM's own art binds these vertices inconsistently, so the GAME has the same data. Whether it
  is VISIBLE in the game is a separate question and one only Raven can answer -- MHGU runs at ~30fps
  on a handheld-derived renderer, while this viewer is static, high-resolution and zoomable, which
  is exactly the condition under which a hairline shows.
* If the residual gaps do need to go, the only honest routes are cosmetic and should be Raven's
  call: weld coincident seam vertices to a single binding at BUILD time (pick one copy's, or average
  them), or leave it as the ROM has it. The first is a deliberate deviation from the ROM and would
  be the first such in this project, so it is not something to do unasked.

`dev/mod-skin-lanes.py` finds the weight signature per format; `dev/mod-skin-solve.py` does the
MOD-to-GLB pairing and the comparison.

**Not judged.**

## 2026-09-10 - "Are break-able parts rendered slightly off?" - no, and here is everything checked

Raven: "is there something rendering those slightly off by a small amount? Like are break-able parts
rendered differently? Are they rendered with a small adjustment that isn't needed? Around a slightly
different origin?"

A good hypothesis and worth killing properly, because if something in the render path were nudging
those meshes the fix would be ours and trivial. It is not. Every candidate measured on `em082_00`
in its default state comes back identity:

| candidate | result |
|---|---|
| mesh node transform in the asset | **identity on all 28 mesh nodes** (also checked em032_04, em088_00) |
| a separate skin per part | **one skin**, every mesh node references skin 0 |
| three.js `bindMatrix` | identity on all 61 skinned meshes, ONE distinct value |
| three.js `matrixWorld` | identity on all 61, one distinct value |
| `bindMode` | `attached` on all 61 |
| separate `Skeleton` objects | 61 distinct objects, but all EQUIVALENT - same bone objects, `boneInverses` identical to 1e-9, and `boneMatrices` differing by exactly 0 |
| `polygonOffset` / ROM `RSMeshBias` | `false`, units 0, on every VISIBLE mesh |
| `renderOrder` | 0 on every visible mesh |

Worth knowing: three.js does NOT ignore a skinned mesh's node transform the way the glTF spec says
to -- with `bindMode: 'attached'` it uses the mesh's own `matrixWorld` through `bindMatrix`. So a
non-identity node transform on one part WOULD have offset it, and that was the strongest form of
Raven's hypothesis. The asset simply does not have one.

The only meshes carrying any offset at all are the rage parts -- `XfBA1__m01_angry`, `RSMeshBias12`,
bias -512, `polygonOffset` on, `renderOrder` 522 -- and they are hidden in the default state, so they
cannot be what he is looking at.

**So nothing is rendering them off.** The only thing that differs between the two copies of a seam
vertex is the skin binding itself, which is where the sweep already pointed. That also means the fix
cannot be a render-side one; it has to be the weights, and whether those are wrong in the `.mod` or
wrong in our export is still the open question.

**Not judged.**

## 2026-09-10 - Mizutsune defaults, and NO, they do not hide the skinning splits

Raven, screenshot: "Defaults for mizustune, see if setting those before viewing the bind pose then
animated pose helps in resolving its skinning issues."

**The defaults** are g0 g1 g7 g9 g11 g15 g18 -- on 1, 2, 101, 102 / off 11, 12, 13, 20, 22;
on 3, 104 / off 14; on 4, 105 / off 15; on 5 / off 16, 21, 23; on 6, 103 / off 17, 18, 19;
on 8 / off 7. Verified live against a CLEARED saved state, all six rows matching, no errors.

**The question was the sharper half, and the answer is no.** It was a good hypothesis: the sweep's
weak point is that it pairs vertices across parts that may never be drawn together, so restricting
to the parts actually on should have deflated the result. Measured both ways on `em082_00`:

| | same-part mismatched | worst separation | pairs > 0.2% |
|---|---|---|---|
| every primitive | 530 | 21.52% | 528 |
| ONLY the default-visible parts | **530** | **21.52%** | **528** |

Identical. The splits are **inside `Group[0]`**, the main body, which is drawn in every state, so no
choice of parts can hide them. `--visible-parts` is now in `dev/seam-skin-sweep.py` so the same
check is one flag for any monster.

### What the restricted run does show

Among the default-visible parts, 826 mismatched pairs, and the shape is specific:

* **70% involve JOINT 0 on one side and not the other.**
* 77% differ by no more than 1% of the total influence.
* Concentrated in `Group[0]` sub-mesh pairs -- `#2/#16` x129, `#10/#15` x88, `#9/#14` x80.

And the mechanism behind the large separations is visible in the worst case:

    A  ((0, 0.0118), (23, 0.1922), (24, 0.5922), (25, 0.2039))     four influences, joint 0 among them
    B  (             (23, 0.5059), (24, 0.3961), (25, 0.0980))     three, joint 0 absent

The joint-0 influence is negligible at 1.2%. What does the damage is that dropping it and
RENORMALISING swings the dominant weight from 0.592 to 0.396 -- nineteen points. So a hairline
difference in the influence LIST produces a large difference in where the vertex actually goes.
That is why 77% of pairs differing by <=1% still yields a 21% separation at the worst pair.

This is cause D's signature at close range: "weightless primitives bind to the root instead of the
bone the .mod names". The open question is unchanged and now sharper -- does the `.mod` carry both
copies with the same influence list, and our export drops one of them on one copy? If so this is
ours and fixable. The MOD weight lanes are still not located; that remains the next step.

**Not judged.**

## 2026-09-10 - Library sweep: bind pose vs animated pose, every monster

Raven: "Review each monster's bind pose for skinning issues compared to an animated pose." Run
offline over the shipped assets by `dev/seam-skin-sweep.py`, which skins both copies of every shared
seam vertex itself rather than asking the viewer -- the app poses through `pose.proxyBones` copied
inside its own render loop, so the browser cannot be driven to a pose headlessly.

**132 models analysed, 54 skipped** (every `_tail` / `_head` model ships no skin of its own).

### What it measures

Where two primitives meet, the seam edge exists TWICE at one bind-pose position. Same binding on
both copies -> they can never separate. Different binding -> they separate the moment a bone turns.
So: skin both, measure the distance, at bind and at real poses from `docs/poses/monsters/*.glb`.

Two guards, because four measurements earlier today were wrong for want of them:

* **A CONTROL that must read zero.** Pairs whose two copies SHARE a binding are measured too. They
  cannot separate by construction. Across the library the control lands at 0.000-0.24% of model
  size -- that is the method's noise floor, and it comes from the 1e-4 coincidence tolerance, not
  from skinning.
* **CO-VISIBILITY.** Primitives are `Group[N]#k`, so `N` is the part. Two different parts can be
  exclusive alternatives -- a broken jaw and an intact one occupy the same vertices and are never
  drawn together, so their "separation" is meaningless. Without this the sweep reports vertices a
  model-length apart, which is two exclusive variants posed at once. **Only SAME-PART pairs are
  ranked**, since sub-meshes of one part are always drawn together.

### The result

| worst SAME-PART separation | models |
|---|---|
| clean, no mismatch at all | **51** |
| 0.2 - 2% of model size | 11 |
| 2 - 10% | 22 |
| **more than 10%** | **42** |

**74 of 132 open past three times their own control.**

Worst, all same-part and so all certainly co-visible:

| monster | mismatched | worst | pairs > 0.2% | control | worst pair |
|---|---|---|---|---|---|
| `em088_00` | 74 | **611%** | 74 | 0.065% | `Group[0]#12 / Group[0]#13` |
| `em086_00` | 221 | 538% | 221 | 0.000% | `Group[0]#0 / Group[0]#1` |
| `em027_00` | 622 | 363% | 610 | 0.154% | `Group[101]#0 / Group[101]#2` |
| `em012_00` | 353 | 155% | 353 | 0.000% | `Group[100]#0 / Group[100]#6` |
| `em021_00` Congalala | 277 | 77% | 277 | 0.000% | `Group[0]#0 / Group[0]#3` |
| `em083_04` | 1019 | 55% | 1018 | 0.169% | `Group[0]#4 / Group[0]#14` |
| `em050_00` | 3949 | 26% | 3949 | 0.073% | `Group[103]#1 / Group[103]#2` |
| `em082_00` Mizutsune | 530 | 22% | 528 | 0.057% | `Group[0]#10 / Group[0]#15` |

The extremes are real, not artefacts. On `em088_00` the two coincident vertices are bound **100% to
joint 5** and **100% to joint 10** -- different bones outright, so they travel with different limbs.

### Two things that corroborate it against Raven's own reports

* **Tigrex `em032_00` has ZERO same-part mismatches.** He is one of the 51 clean models. Raven,
  hours earlier and about a different bug entirely: "Tigrex still looks fine somehow."
* **Grimclaw `em032_04` has 724, worst 17.3%, and its worst pair is `Group[30]#1 / Group[30]#2`** --
  both sub-meshes of PART 30, which is a rage part. Raven's original report was "Grimclaw enraged
  has gaps along seams". The measurement lands on the part he was looking at, in the state he was
  looking at it in.

Neither was steered toward: the sweep ranks every model the same way and those two fell out of it.

### Not yet established: whose fault it is

Whether the `.mod` already disagrees, or our export introduces it. That decides whether this is
fixable here at all. The MOD side is partly decoded already -- `em082_00.mod` holds 79 meshes across
8 vertex formats, and the stride self-check passes (`sum(count * stride) == 367596 == vertexBufferSize`)
-- but the weight/joint LANES within each format are not located yet, so the comparison cannot be
made. That is the next step and it is a bounded one.

A hint, not proof: `em032_00` is clean and `em032_04` has 724, through the same exporter on the same
day. If the tool were manufacturing these, both would show them. That points at the source asset.

Also worth noting against cause D: the export carries `JOINTS_0`/`WEIGHTS_0` only, so at most four
influences per vertex survive, and the worst mismatches on Mizutsune carry a spurious **joint 0** --
"weightless primitives bind to the root instead of the bone the `.mod` names" is the same signature.

### Files

* `dev/seam-skin-sweep.py` - the sweep, with the control and the co-visibility split built in
* `dev/seam-skin-sweep.txt` - the full ranked run
* `dev/seam-skin-sweep.json` - per-model rows, for whatever comes next

**Not judged.** And nothing is fixed by this -- it is a measurement, and the fix depends on the
`.mod` comparison above.

## 2026-09-10 - "The Bind Pose doesn't show the small gaps near break-able parts"

Raven, with a Mizutsune capture. This is the most useful thing said about the seam gaps so far,
because it **moves them out of the visual-only bucket**. If the geometry is closed at rest and only
opens once the skeleton moves, the geometry is not the fault and the SKINNING is: two copies of one
seam edge, living in two different primitives, driven by different joints or weights, must separate
the moment a bone turns. That is measurable without anyone looking at it.

### Measured: the two copies of a seam edge frequently DO disagree

Coincident vertices (identical bind-pose position, different primitives), comparing their
`JOINTS_0`/`WEIGHTS_0`:

| model | coincident pairs across meshes | different skin binding |
|---|---|---|
| `em082_00` Mizutsune | 5,893 | **1,963 (33%)** |
| `em032_04` Grimclaw | 6,562 | **3,644 (56%)** |

By how much the influence disagrees, which is what decides whether a seam shows a hairline or a
hole:

| disagreement | Mizutsune | Grimclaw |
|---|---|---|
| identical | 66.7% | 44.5% |
| <= 1% of the influence | 25.5% | 46.1% |
| 1-5% | 6.8% | 9.4% |
| 5-25% | 0.8% | - |
| **> 25%, a real binding difference** | **8 pairs** | - |

So the population is overwhelmingly hairline-scale, which is the right shape for "small gaps", with
a handful on Mizutsune large enough to tear properly.

The typical mismatch keeps the dominant influences and differs only on the smallest:

    A  ((2, 2), (4, 215), (5, 38))
    B  ((3, 2), (4, 215), (5, 38))      joint 2 vs joint 3, both at 2/255

and the worst carries a spurious **joint 0**:

    A  {24: 0.592, 23: 0.192, 25: 0.204, 0: 0.012}
    B  {23: 0.506, 24: 0.396, 25: 0.098}

which is **cause D's signature** -- "weightless primitives bind to the root instead of the bone the
`.mod` names". This entry and cause D are probably the same fault seen from two ends.

Also worth knowing: the export carries `JOINTS_0`/`WEIGHTS_0` and nothing else on every primitive
of both models, so **at most four influences per vertex survive**. If the `.mod` carries more, the
exporter is choosing which to keep, and two meshes choosing differently at a shared edge is exactly
the pattern above.

### NOT yet verified, and this is the gap in the finding

**That these disagreements actually open the gaps.** Establishing it needs the model at a real
animated pose, and that could not be reached from here: the Browser pane is hidden, which throttles
rAF, and this app poses through `pose.proxyBones` copied onto the real skeleton inside its own
render loop -- so `mixer.setTime()` alone moves nothing. `mixer.time` stayed at 0 across a reload
and a 3-second wait, and 10 of 41 bones are non-identity, which is the held lobby pose rather than
an animated one.

At that held pose the seams are effectively shut: max separation **0.00058** against a model 0.984
across, i.e. **0.06% of the model** -- sub-pixel. Which is consistent with Raven's report rather
than against it: he is seeing this in MOTION.

Two ways to close it, both cheap:

1. Re-run the separation measurement with the Browser pane VISIBLE so rAF ticks, sampling across a
   clip. The script is `scratchpad/seams.py` for the static half and the in-page pass for the posed
   half.
2. Or replicate the proxy-bone copy so the pose can be driven headlessly.

Until one of them is done this is a strong lead with a measured mechanism, not a proven cause.

### Why this matters beyond one monster

It reclassifies the parked "seam gaps, residue after cause J" entry. That was parked because
verification looked entirely visual and each attempt would cost Raven a look. It is not
visual-only: the binding disagreement is a number in the shipped asset, and the separation under a
pose is a number in world units. It belongs in the ROM-drivable column and can be worked in bulk.

**Not judged.**

## 2026-09-10 - Grimclaw's veins: the second albedo map never reaches the screen

Raven: **"the veins don't appear still"**, and **"The albedo areas show now, so the vein layer does
not appear to be applied."** Confirmed, localised, and NOT caused by anything changed today.

### The finding

`em032_04`, enraged, mesh `Group30_2`, material `XfBA_AW_0__m61_angry_blood`. With the app's own
animation loop STOPPED (`setAnimationLoop(null)`) so the scene is provably static -- two identical
renders diff to 0 px -- and with two controls that must move pixels:

| test | pixels moved |
|---|---|
| CONTROL - `emissive` to black | **10,163** |
| CONTROL - base map (`uv0`) to null | **10,161** |
| ext map real vs flat WHITE | **0** |
| `uExtTint.rgb` to zero | **0** |
| `uExtMode` 1 to 3 | **0** |
| `uExtXf` scrambled | **0** |

The first map reaches the screen; **the second map's content reaches nothing**. That is exactly
Raven's sentence, measured.

### It is NOT global -- the same machinery is live on Tigrex

`em032_00`, mesh `Group4`, `XfBA_A0__m01_angry`, same stable method:

| test | pixels moved |
|---|---|
| CONTROL - `emissive` to black | 1,097 |
| `uExtTint.rgb` to zero | **1,097** |
| `uExtMode` 1 to 3 | **1,235** |

So the EXT path works on Tigrex and is inert on Grimclaw. That is why Raven said "Tigrex still
looks fine somehow" -- it is fine, and for a reason.

### What is already ruled out

* **Not cause J.** Old alpha rule vs new, with the scene frozen: **0 px** on every Grimclaw material.
* **Not MAT_FPS.** Reverted to 60 before this was measured.
* **Not the injection.** The compiled fragment shader declares `uExtMap`, samples it, and combines:
  `gBase = base` (line 159), the ext block (167-178), `totalEmissiveRadiance *= gBase` (192),
  `outgoingLight` (220). Order is correct.
* **Not uniform binding.** Captured `sh.uniforms` during compile: `uExtMap`, `uExtTint`, `uExtMode`,
  `uExtXf`, `uExtView` are all present AND `=== mat.userData.u[...]`, the same objects.
* **Not the UV data.** Every `TEXCOORD_1` in `em032_04.glb` is 100% non-zero, and `uv0` vs `uv1` on
  `Group30_2` are 0% identical, mean delta 0.90.
* **Not a missing emissive map.** `emissiveMap` is set, so `USE_EMISSIVEMAP` is defined and the
  chunk carrying `totalEmissiveRadiance *= gBase` compiles in.
* **Not the texture.** `676b0f53e1868cbd.webp`, 256x256, alpha 255 everywhere. `uv0` samples a
  252x7 strip at the top (u runs to 1.53, so it tiles -- a scrolling ramp); `uv1` spans the full
  252x231 region, which is where the vein artwork lives.

### The remaining suspect

`m61_angry_blood` is bound by **two meshes** (`Group30_2` and `Group38`), so there are **2 material
instances sharing the name**, where Tigrex's `m01_angry` has one. `Group38` is a 6-vertex mesh that
contributes 0 px. A per-instance mismatch between the program in use and the uniform objects being
written is the shape that fits -- the identity check passes on a FORCED recompile, which is not
necessarily the program the live draw uses. Not proven; next thing to test.

### Method note, because it cost most of the session

Four separate measurements in this entry were WRONG before they were right, and every failure was
the same class: **a diff whose two halves were not taken under identical conditions.**

1. `findMat(name)` returns the LAST material with that name -- `Group38`'s instance, which draws
   nothing. Every uniform change was being applied to an invisible material.
2. `stepMaterialAnim` calls `restoreBase()` first, so stepping between the two grabs UNDOES the
   change being measured.
3. The app's `setAnimationLoop` keeps running, so the scene moves between grabs on its own. This
   produced a 10,163-pixel "result" that was just the material animating.
4. A `needsUpdate` recompile can produce a different program from the one the live draw used.

**A before/after diff is worthless without a CONTROL that changes nothing and must read 0, and a
control that changes something known and must read large.** Both, every time. The 11,693-pixel
figure reported earlier for the alpha-clip change on Grimclaw was one of these artifacts and is
withdrawn; the correct figure is 0.

**Not judged.**

## 2026-09-10 - Nargacuga: default parts

Raven, screenshot: **"Nargacua default parts"** -- off 5, 6; on 1 / off 2, 4; on 9 / off 10;
on 11 / off 12; on 13, 14, 15, 18, 101 / off 16, 17.

`em037_00`. Read off the live panel, two of the five clusters disagreed:

| cluster | panel picked | wanted |
|---|---|---|
| Head `1,2,3,4,7,8` | g5 - on **2**, off 1 | g4 - on **1**, off 2 |
| Tail `13..18,101` | g17 - on 13, **16, 17** | g15 - on 13, **14, 15, 18, 101** |

The tail one is the visible half: g17 draws neither 18 nor 101, so the tail tip was simply absent -
which is what the render he attached shows.

**Both states are named**, because this monster HAS a ROM enrage pair: `ROM_RAGE_SET em037_00` is
`[[7, 5]]`, calm g7 against rage g5, on the head cluster. Raven's calm choice is g4, a deviation
from the ROM's g7 and his to make; but a flat list would force g4 in the enraged state too and
silently delete the ROM's 7 -> 5 switch. So rage keeps g5 (parts 2 and 7 where calm has 1 and 7)
and holds everything else. Same reasoning as the `em032_04` entry.

Verified on a fresh load: calm draws `0, 1, 7, 9, 11, 13, 14, 15, 18`; enraged the same with the
head on 2 instead of 1; no console errors. The head row collapses to "off 4" because parts 1 and 2
are enrage-owned and leave the dropdown - Raven's own rule from Bloodbath.

**A TRAP WORTH KNOWING.** The first verification of this said the tail had NOT changed. It had; the
page was showing **saved state**. `index.html` restores `state.groups` from
`localStorage['mhgu-monster-viewer']`, and `buildGroups` prefers an already-applied option
(`appliedOpt`) over the computed default. So a stored selection masks any new
`DEFAULT_PARTS_ON` entry for whoever has one. Switching to another monster and back clears it, as
does removing that key. Check defaults against a CLEARED state or the result is a lie.

**Not judged.**

## 2026-09-10 - Material animation ran at double speed, and my evidence for 60 was circular

Raven, on Akantor's rage effect: **"the timing feels too rapid"**, then **"The game runs at ~30 FPS,
so the effect looks fast compared to what we see in game"**, then **"It wouldn't shock me to find
out everything is calculated around 60fps, but looks different due to the 3DS framerates."**

### What I got wrong first

I answered that the timing was faithful and the rapidity authored, on three arguments. **One of the
three was circular and it was the one I called decisive.** Written down so it is not repeated:

* I measured the exported pose keyframes at 0.01667 s apart -- 59.99 fps over 283,323 keys -- and
  presented it as an independent confirmation of 60. It is not independent. Those timings are
  written by **`lmt_to_gltf`**, a third-party tool, when it converts LMT frame indices into glTF
  seconds. I measured the tool's assumption and reported it as the ROM's answer. This is exactly
  the failure the memory note names: a real measurement attached to a source that never said it.
* The older argument in the code -- "8,848 of 14,538 durations are an integral frame count at 60 and
  not at 30" -- does not discriminate either. Any integer frame count is a whole number of frames at
  any rate. That test only measured how round the resulting SECONDS looked.

What survives is the disassembly, and it never spoke to wall-clock rate at all.

### What the ROM does say

    00b0cf24  vldr      s18, [r3]            slotTime
    00b0cf28  vldr      s0, [sb, #0x20]      material[+0x20]
    00b0cf2c  vldr      s2, [sp, #0x10]      dt
    00b0cf30  vmla.f32  s18, s0, s2          slotTime += material[+0x20] * dt
    00b0cf38  ldr       r0, [r5]             the clip's frame count, u32
    00b0cf40  vcvt.f32.u32 s0, s0
    00b0cf44  vcmpe.f32 s18, s0              compared against it

So slotTime carries the same unit as `frames`, and `material[+0x20]` is a **rate multiplier** on dt.
A rate multiplier's neutral value is 1.0, and for the sum to reach `frames` with a 1.0 multiplier,
**dt must be in FRAME UNITS** -- about 1.0 per tick, not ~0.0167 seconds. A clip's length is then
its frame count in GAME TICKS, and its wall-clock duration is that divided by the rate the game
actually ticks at. MHGU ticks at ~30.

That also settles Raven's own hypothesis: the content may well be authored at 60, and it would
still take 96 ticks to play, because dt counts ticks rather than seconds.

### Still unread

`material[+0x20]` itself, which would settle it outright. Searched again 2026-09-10:

* **Not written in the material-animation module.** `0xb08000..0xb12000` contains no `vstr` to
  `[reg, #0x20]` at all.
* **Not from the .mrl.** The material record is 60 bytes = 15 u32s, of which words 8..12 and 14 are
  read by nothing. All six are **exactly zero on all 577 monster materials across 187 files**, so
  there is no shipped per-material rate that was being missed. If +0x20 came from the file at that
  offset it would be 0.0 and nothing would ever animate.

So it is set by code that has not been found, and the rate rests on Raven's eyes, labelled as such
in `material.js` rather than dressed up as a decode.

### The change

`MAT_FPS` 60 -> **30**, in `docs/render/material.js`, with the whole argument above written at the
site. Akantor, measured live afterwards:

| clip | frames | was | now |
|---|---|---|---|
| `Angry` on m03_sukima / m06_body_add02 / m05_body_add01 | 96 | 1.60 s | **3.20 s** |
| `Angry` on m04__kekkan | 64 | 1.07 s | **2.13 s** |
| `Angry_Start` | 60 | 1.00 s | **2.00 s** |
| m06_body_add02's UV oscillation | 6 | 0.10 s, 10 Hz | **0.20 s, 5 Hz** |

Verified in the page: `MAT_FPS 30`, the Angry loop reports 3.2 s, enraged still draws parts
0, 4, 5, 7, 10, 12, 14, 101, 102, 103, no console errors.

Scoped to the monster app. The Armor Viewer keeps its own copy of `material.js`, so
`sync-render.py --check` will now report EDITED HERE until armour is judged at the new rate.

### AN INCONSISTENCY THIS CREATES, stated rather than hidden

The ROM says material animation and MOTION share one tick -- `uBaseModel 0x88c494` passes
cUnit::mDeltaTime through unmodified. Material animation now runs at 30. **Motion does not**: its
timings are baked into the pose GLBs in seconds by `lmt_to_gltf` at 60 fps, and three.js
`AnimationMixer` replays them at whatever the file says. So if the 30 reading is right, every
monster motion in this viewer is also playing at double speed, and the two halves of one tick now
disagree.

That is a question only Raven can answer, because it is a judgement about how the game looks:
**do the monster animations themselves run fast?** If they do, the fix is either a re-export at the
correct rate or a 0.5 `timeScale` on the mixer, and it is library-wide. If they look right, then the
30 reading is wrong for motion and probably wrong here too, and this change should come back out.

### REVERTED THE SAME DAY -- it regressed a monster already signed off

Within the hour: **"Grimclaw albedo looks wrong agian"**, and **"Tigrex still looks fine
somehow"**, and **"See, this is the exact situation I wanted to avoid"**.

It was this change, and the attribution is airtight rather than argued. A diff of everything
touching the app since Grimclaw last looked right returns exactly two hunks:

    -export const MAT_FPS = 60;
    +export const MAT_FPS = 30;

    +  em033_00: { calm: [...], rage: [...] }      <- an em033_00-only parts entry

The second cannot reach em032_04. Nothing else was in the running.

**Why Tigrex survived and Grimclaw did not:** Tigrex has ONE animated material. Grimclaw has four,
and `m61_angry_blood` cycles fEmissionColor from (0.75, 0.25, 0.25) to (1, 0, 0) over a 90-frame
loop, so halving the rate is obvious on him and nearly invisible on Tigrex.

**Two false leads I chased first, both mine, both recorded so they are not repeated:**

* I blamed `m50_wing` -- the one opaque `transp: Alpha` material -- on the theory that cause J had
  exposed damaged texels. Measured: toggling it alone moves **0 pixels** on Tigrex AND on Grimclaw.
  Its UVs never land on the alpha-0 region of the shared atlas.
* I then measured `m61_angry_blood` moving 10,163 pixels under the alpha toggle and nearly believed
  it. **That measurement was confounded**: the two framebuffer grabs straddled the material's own
  animation advancing, because the monster had just been switched to with rage on. Re-run with the
  animation settled, and with a recompile-only CONTROL pass, every Grimclaw material moves **0
  pixels**. Cause J is not implicated on this monster at all. A before/after diff needs a control
  that changes nothing, and I did not run one until it had already misled me.

**The lesson, which is the durable part.** A single global constant is the wrong instrument for a
question the ROM has not answered. It silently re-times all 425 monster clips to buy one monster
effect, and the cost lands on monsters already judged. `MAT_FPS` stays at 60 -- the value the
library was reviewed at -- until `material[+0x20]` is actually read. Anything wanting a different
speed should be a control Raven can turn, not a constant swapped underneath him.

The argument for 30 above still stands on its own terms and is left in place; 60 is not a claim
that 60 is the ROM rate, only that it is the rate everything was judged against.

**Not judged.**

## 2026-09-10 - Akantor: default parts, and part 5 as the rage part

Raven, screenshot: **"Akantor default parts"**, and **"Enraged already implemented at this time,
but it needs to turn on 0, 5, 100 (the top drop down) when enraged is toggled on"**.

`em033_00`. Read off the LIVE panel rather than assumed, four of the nine clusters disagreed with
the screenshot:

| cluster | panel picked | Raven wants |
|---|---|---|
| Belly `0, 5, 100` | g16 - on 0, **5**, 100 | g0 - on 0, 100 / off 5 |
| Head `3, 103` | g11 - on **3** / off 103 | g2 - on 103 / off 3 |
| Head `2, 102` | g10 - on **2** / off 102 | g3 - on 102 / off 2 |
| Tail `4, 16, 101` | g19 - on **4**, 101 / off 16 | g8 - on 101 / off 4, 16 |

The other five already matched. Same shape as every monster so far: the `>=100` parts are the
intact pieces and the wanted state is the whole monster with every break variant off.

### The rage part, and what the ROM says about it

**The ROM does not switch Akantor's parts on rage.** `em033_00` is not one of the enrage-gated
`setVisibleGroup` sites - that scan is complete and its result is `ROM_RAGE_SET`, which has no
entry here - so this is the same situation as Bloodbath Diablos (`em007_04`), and the answer is
authored rather than decoded. Raven supplied it: part 5.

What the ROM *does* say corroborates the reading. Akantor's three rage materials -
`XfBA_A0__m04__kekkan`, `XfB__m05_body_add01`, `XfB__m06_body_add02` - each carry a clip named
`Angry` with the **auto-play bit** set (clip+0x04 bit 1; 50 clips across 27 monsters have it), and
`XfB__m03_sukima` carries `Normal` the same way. An auto-play clip runs whenever its material is
drawn. So the ROM gates this effect by **mesh visibility**, not by clip selection - which is
exactly why the Enraged toggle had no visible effect before this entry, and why naming part 5 is
the whole of the state rather than half of it.

The Belly cluster holds a variant that is g0 plus part 5 and nothing else (g16), so the pair of
lists resolves cleanly to g0 / g16.

### Result, measured on the live page

* Calm mesh groups drawn: `0, 7, 10, 12, 14, 101, 102, 103`
* Enraged: the same **plus 5**, and nothing else moves
* The panel drops from 9 rows to **8**: part 5 becomes an owned rage part, so it leaves the Belly
  dropdown, that cluster is left with one option and the row hides itself - Raven's rule from
  Bloodbath, "if a drop down only has one part after handling the enrage parts, we don't need to
  display that drop down"
* The remaining 8 rows match the screenshot exactly; no console errors

**Not judged.** Raven's eyes decide.

## 2026-09-10 - "Grimclaw enraged has gaps along seams ... similar issue with Zinogre"

Raven, on Grimclaw: **"enraged has gaps along seams"**, and **"I've seen this around break-able
parts mainly, but similar issue with Zinorge"**.

### What it was NOT

Measured first, because these are the obvious readings and all four are wrong:

* **Nothing is missing from the geometry.** Calm vs enraged silhouette: 43,691 -> 47,927 solid
  pixels, and `pixelsSolidWhenCalmButBackgroundWhenEnraged = 0`.
* **The geometry is closed.** Forcing all 10 opaque materials to `DoubleSide` moves **28 pixels**,
  none strongly - there are no through-holes in the mesh.
* **The 20 -> 30 body swap is clean.** Both variants share identical boundary vertex counts with
  every neighbour (`Group0_1: 4, Group0_2: 3, Group0_3: 11, Group5: 1, Group7: 1, Group8: 1`) and
  identical bounding boxes.
* **Not the reverse-subtract layer.** `XfBA_AW_0__m60_angry_arm` darkens 13,020 pixels (mean 15.4,
  max 53, none lightened), but it checks out exactly against the ROM - `cls: Std`, glob albedo
  `[0.25, 0.75, 0.548]`, `cbm.transparency 0.2596`, emission zero - and the library holds only
  **three** revsub materials in total (Khezu `m03_blood`, Old Fatalis `m01_face_sub`, this one).
  **Zinogre has none**, so revsub could not be the shared cause. That is what sent the search to
  the alpha machinery instead.

Every `side` also matches the ROM's `cull` on all 14 Grimclaw meshes, so double-drawn back faces
are ruled out too.

### The cause: an alpha clip the ROM never asks for

`AppShaderPackage.mfx` keeps the clip and the blend source as **different features**:

| idx | record | meaning |
|---|---|---|
| 1395 | `FTransparencyAlpha` | the albedo alpha is the **SRC_ALPHA blend factor** |
| 1401 | `FTransparencyAlphaClip` | the alpha **clip** |
| 1402 | `FTransparencyMapAlphaClip` | clip, from the transparency map |
| 1910 | `FTransparencyAlphaConstant` | constant |

A census of every material the extractor produces - **570 monster, 18,752 armour, 6,280 weapon,
25,602 in all** - selects only `Alpha`, `AlphaConstant` or nothing. **Not one selects a clip
variant**, and `build-materials.py` would spell them `AlphaClip` / `MapAlphaClip` if one did
(`mfx.feature_short(1394, 1401)` -> `'AlphaClip'`, checked). On top of that `fAlphaClipThreshold`
is exactly **0.0** on all 199 monster materials carrying `transp: Alpha`, and the ROM's
`clip(a - 0)` discards only `a < 0` - nothing.

What the viewer did instead (`render/rom/material.js`, introduced silently in `928c351`):

```js
if (feat && feat.transp === 'Alpha' && rom.alphaTest)
  mat.alphaTest = Math.max(0, (gl && gl.clip) || 0) + ALPHA_EPS;   // ALPHA_EPS = 1/512
```

It fired the clip on the **blend** feature, plus bit 20 of the flag word, and then added an
invented `1/512` so the test would bite at all - because the ROM's own threshold is zero and
would have done nothing. Bit 20 was only ever matched against the artists' `XfBA` naming, and
the "A" in that name **is** the Alpha feature, so that agreement was circular. It never came
from the shader. This is the failure mode the memory note names: a real ROM symbol
(`fAlphaClipThreshold`) carrying an invented mapping.

### What it cost

In MT the albedo's alpha channel is the **GLOSS** - the same fact that produced cause I. So
clipping on it discards matte texels:

* **161 of the 199** `transp: Alpha` monster materials have an albedo whose alpha is more than 1%
  exactly-zero. By ROM blend mode: 116 **opaque**, 24 blend, 20 add, 1 revsub.
* The 116 opaque ones are the real damage - `BSSolid` does not blend, so with no clip feature the
  alpha is entirely **inert** in the ROM, and every zero-gloss texel was being thrown away.

| monster | material | ROM blend | of its texels discarded |
|---|---|---|---|
| `ems/017_00` Great Thunderbug | `XfBA1__m00_body` | opaque | **100.0%** (mesh off by default, so never on screen) |
| `em/081_00` / `em/081_04` Astalos | `XfBAN__E1_wingbone_taiden` | opaque | 59.2% / 61.9% |
| `em/086_00` | `XfBA_E1__m01_black` | opaque | 53.7% |
| `em/017_00` Cephadrome | `XfBA_E1__m50_fin` | opaque | 46.1% |
| `em/071_00` / `em/071_05` | `XfBAN__E0__m52_wing_l` | opaque | 38.7% / 37.8% |
| **`em/057_00`** Zinogre | **`XfBAN__E0__m05_hair`** | opaque | **37.5%** |
| **`em/057_04`** Thunderlord | **`XfBAN__E0__m05_hair`** | opaque | **30.6%** |
| **`em/032_04`** Grimclaw | **`XfBAN__E1__m50_wing`** | opaque | **30.0%** |

Zinogre reads **one** texture three ways, which is the whole argument in miniature:
`XfB_N__E_m00_body` takes it as `MapColorOnly` + `transp: False` (alpha ignored - correct, it is
gloss), while `m00_body1` and `m05_hair` take it as `Map` + `transp: Alpha` - and we clipped those.
That alpha is 30.6% exactly-zero with a mean of 77/255: a gloss ramp, not a mask (a mask would sit
bimodal at 0 and 255).

Cephadrome appears in this table, which is worth noting against its open entry - "what the wounds
actually are; no second albedo layer exists on it" - since its fin was losing 46% of its texels.

### The fix

`render/rom/material.js` - the clip fires only on the features that ARE the clip, at the ROM's own
threshold, with no epsilon; and `FTransparencyAlpha` still hands the sampled alpha to
`diffuseColor.a`, but only where the ROM actually blends, since on an opaque material there is no
blend for it to feed and `gl_FragColor.a` would go to the canvas instead:

```js
const romClip = !!(feat && /AlphaClip$/.test(feat.transp || ''));
if (romClip) mat.alphaTest = Math.max(0, (gl && gl.clip) || 0);
mat.userData.srcAlpha = !!(feat && feat.transp === 'Alpha'
                           && rom.state && rom.state.blend !== 'opaque');
```

`uAlphaCut` now follows `mat.alphaTest || srcAlpha` instead of `alphaTest` alone. `ALPHA_EPS` is
gone from that module. Scoped to the monster path only: ROM core is on by default and monsters go
through `createRomMaterial`, so `render/material.js` - shared with the Armor Viewer - is untouched.
`mat.userData.cutout` is now false on every monster material, so Raven's alpha-override comparison
knob is a no-op there; that is the correct answer, not a loss.

### Measured after, at 607x875

| | |
|---|---|
| Grimclaw enraged, pixels moved by the fix | **11,693**, mean delta 333.6 of 765 |
| Grimclaw, pixels that were holes to background | 0 - its wing sits over the body, so a hole showed body |
| **Thunderlord Zinogre enraged, pixels moved** | **7,465** |
| **Thunderlord Zinogre, solid now but BACKGROUND under the old rule** | **4,596** |

The Thunderlord number is the report itself: 4,596 pixels of that one view were holes straight through
the model, punched by the gloss channel along the hair's UV islands. `m05_hair` sits on the
silhouette, so they read as background; Grimclaw's wing sits over the body, so the same fault read
as seams instead. One cause, two appearances - which is what Raven meant by "similar issue with
Zinorge".

Verification was framebuffer readback in both directions (fix applied, old rule restored in place,
fix restored), not visual judgement.

**Judged 2026-09-10: partial.** Raven: "Still see some gaps, but moving on to make progress
across the board; the gaps might be difficult to deal with since they are a visual issue."
So cause J was real and is fixed, but it was not the whole of the seam report. The residue is
now its own open entry above. Nothing here is withdrawn - the 4,596 background pixels were
measured, not inferred - but it no longer claims to explain what he is still looking at.

### Still open on Grimclaw

The `m60_angry_arm` darkening above is unchanged by this fix and remains faithful to the ROM's own
numbers. If seams persist after Raven looks again, that layer is the next thing to question - but
it is authored, not a defect, on everything measured so far.

### Kecha Wacha (em065_00) - ears merge into each other; no folded-ear part
> "Kecha Wacha's ears meshes are combining into each other. It also does not seem to have a part
> to show the ears folded over his face."

**STATUS** first half FIXED (it was mine), second half ANSWERED - no such part exists
**CAUSE** H (my regression) for the merging; the fold is motion data, not a visibility group

#### The merging was the weld

`weld-seam-skins.py` elects one canonical binding per coincident seam vertex. On em065_00 it
replaced the ENTIRE binding of 2 of the 68 vertices on the visible ear mesh, moving them by more
than 25% of their weight - so the two ear meshes pulled toward each other. The parts system was
never drawing two ears at once: with ancestor visibility resolved, only `Group5` draws;
`Group103_1`, `Group103_2` and `Group12` are hidden.

Fixed by restoring all 107 models to pre-weld (`git checkout 56a1dcd -- docs/models/monsters/`),
adding a `--max-shift` cap (default 0.25) that leaves a disagreeing copy alone rather than
rewriting it, and re-welding. 106 models, 33,523 vertices rewritten, 407 copies left alone, 0
vertices still over 25%. em065_00's ear meshes: `Group[5]#0` 2 rewritten / max 0.102,
`Group[103]#0` 1 / 0.008, `Group[12]#0` 2 / 0.008, `Group[13]#0` 5 / 0.239.

Cost of the cap, from the sweep: same-part mismatched pairs 21,152 -> 298, models whose seams open
74 -> 22, and em065_00 itself at 0 mismatched.

#### There is no folded-ear part, and the ROM says so directly

`uEm065_00` (band 0xf48f20..0xf56698) makes exactly EIGHT `setVisibleGroup` calls, and every one
is accounted for:

| site | groups | selector |
|---|---|---|
| 0xf49e7c | 0 | unconditional base set |
| 0xf49eb4 | 2 / 9 / 10 | `tst` bits 2 and 1 of `[[enemy+0x1428]+0x5cfc]` - a 3-way STATE on the back cluster {2,3,4,102}, not a break. Unread. |
| 0xf49f08 | 3 / 12 | break level of part 0 - **the ears** |
| 0xf49f54 | 4 / 13 | break level of part 2 - right claw |
| 0xf49fa0 | 5 / 14 | break level of part 2 - left claw |
| 0xf49fec | 6 / 15 | break level of part 5 - tail fur |
| 0xf4a050 / 0xf4a060 | 16 / 17 / 18 | `bl 0x81670` enrage, then the part-0 break level - the ear glow overlay {12,13} |

The ears therefore have exactly TWO forms, intact and broken. Nothing in the 19 visibility groups
moves them. This is the OPPOSITE finding to Yian Kut-Ku above, where the pair shape was read as a
possible up/down swap - here the code that drives the pair was read, and it is a break.

#### The fold is in the motion data

Bones 132->133 and 134->135 are the two ears (roots at +-0.32, 0.58, 2.67; tips at +-0.32, 1.26,
3.17). Skinning the intact ear mesh and the eye mesh at every one of the 191 clips and casting a
ray from each eye vertex along the head's forward axis:

    bind pose                       0.00 of the eye covered
    List 5  Motion[16]  @0.61s      0.67     <- the fold
    List 3  Motion[60]  @0.23s      0.61
    List 3  Motion[22]  @0.00s      0.57
    List 2  Motion[117]_start       0.57
    List 0  Motion[19]  @1.09s      0.57

So the pose exists and the viewer can already show it - it is a clip, not a checkbox.

(The first run of this test read the index buffers as triangle lists. EVERY primitive in these
models is a TRIANGLE_STRIP; the retracted run reported a 0.33 ceiling off garbage triangles.)

#### Found on the way: part-rest.json has the break arm inverted at half the sites

`build-partrest.py` documents the break branch as `cmp <break level>, <threshold>` and takes the
`lo`/`ls` arm as undamaged at all 556 call sites. Kecha Wacha's five sites are written the other
way round:

    uxtb  r6, r7          ; r6 = the rank-picked THRESHOLD from [[enemy+0x75f0]+0x64]
    bl    0x9d36c         ; r0 = the break LEVEL ([enemy+0x1428] + 0x3bc + 12*part)
    cmp   r6, r0          ; cmp THRESHOLD, LEVEL  -- operands reversed
    movhi r1, #3          ; thr >  level -> UNDAMAGED
    movls r1, #0xc        ; thr <= level -> BROKEN

Classifying all 556 sites by which cmp operand carries the threshold (`uxtb` destination) rather
than by the condition codes:

| form | sites | lo/ls means |
|---|---|---|
| `cmp level, THR`, arms hs/lo | 102 | undamaged - what build-partrest assumes |
| `cmp THR, level`, arms hi/ls | 80 | **BROKEN** |

No site disagrees with its arm pair, so the pair alone decides it: `hs`/`lo` -> `lo` undamaged,
`hi`/`ls` -> `hi` undamaged. Khezu's sites (0xd1ef94, 0xd1efe4) are the second form too, which is
why this docstring's own example - "Khezu pairs undamaged 3 against broken 1" - is backwards.

For em065_00 that means the shipped rest sets `[12, 13, 14, 15, 18]` are the BROKEN ones and the
undamaged sets are `[3, 4, 5, 6, 16]`. So the viewer opens Kecha Wacha on the broken ears:
part 5 (68v, reaching z 4.05) instead of part 103 (163v, reaching z 4.64).

Geometry agrees on three of the four pairs - the smaller mesh is mostly coincident with the larger,
which is what a break replacement looks like:

| pair | intact (corrected) | shared with the other | broken | shared |
|---|---|---|---|---|
| ears | 103, 113 unique verts | 29% | 5, 44 unique | 75% |
| claw R | 6, 38 | 39% | 9, 19 | 79% |
| claw L | 7, 46 | 35% | 8, 22 | 73% |
| tail fur | 10, 28 | 43% | 11, 63 | 19% |

**The tail row does not fit** - the corrected rule makes the SMALLER mesh the intact one there,
the only one of the four that way round. Stated rather than smoothed over; the code is
unambiguous at that site and the geometry is not, but it is unexplained.

**NOT ACTED ON.** Fixing the rule in `build-partrest.py` moves the opening part state on 31 of the
78 monsters in the file, which is a library-wide change to defaults and Raven's call.

#### The fold isolates to four bones, exactly

Raven, 2026-09-11: "Can we isolate the bone pose for the ear cover?" Yes, and it is structural
rather than lucky:

* the eye mesh `Group[14]` is **100%** weighted to head bone 3;
* the ear meshes are **99.99%** on bones 132/133/134/135 (a 0.005-0.08% stray on bone 41 aside);
* that ear chain hangs off bone 3 - `4:3 -> 8:132 -> 9:133` and `4:3 -> 10:134 -> 11:135`.

So the drape over the face is a pure function of those four LOCAL rotations. Whatever the head,
neck and body are doing cannot change it. Re-running the cover test with every other bone held at
bind reproduces the full-clip number to the digit on all eight candidate clips.

Scanning all 191 clips once per game frame, the best frame is **List 2, `Motion[116]`, 0.40s**, the
only frame in the whole motion set that covers the eye completely:

    bone 132  [ 0.543913,  0.009906, -0.014209,  0.838963]   65.9 deg   right ear root
    bone 133  [ 0.203508, -0.170762,  0.123874,  0.956075]   34.1 deg   right ear tip
    bone 134  [ 0.536824, -0.013552,  0.117852,  0.835313]   66.7 deg   left ear root
    bone 135  [ 0.203491,  0.170745, -0.123878,  0.956082]   34.1 deg   left ear tip

Typed back in literally, against an otherwise-bind skeleton: cover 0.00 -> **1.00**. Saved to
`dev/ear-pose-em065_00.json`. The tips are an exact left/right mirror; the roots are not (residual
0.104, the right root carries ~12 deg more z), so the authored pose has a slight lean.

Cover against time, one character per game frame, shows two different things in the motion set:

    List 2  Motion[116]     :@@-              a 2-frame snap to full cover
    List 3  Motion[58]      :------ ... ---=-=+++-.     ~6s held at 0.38, then 0.67 at the end

So `Motion[116]` is the pose to lift and `Motion[58]` is the one that *holds* a fold.

**This corroborates the inverted rest set above.** The same four rotations give cover 1.00 on the
intact ear (part 103) and only **0.22** on the broken one (part 5) - the torn ear is not long
enough to reach across the face. The game authored a full-cover fold, and only part 103 can
perform it, which is a second, independent reason to think part 103 is the undamaged mesh and the
viewer is currently opening Kecha Wacha on the broken pair.

**NOT WIRED INTO THE VIEWER.** That needs a bone-pose override control in `docs/index.html`, which
the parts agent has uncommitted changes in right now.
# Crimson Fatalis: "bind position looks correct, it varies with animations"

Raven, 2026-09-11, on the snout shifting to the monster's right. Every measurement I had run
before this was on the raw quantised positions -- which IS the bind pose -- so it was measuring
the one thing he says is fine. This is the animation-side pass. Tool: `dev/skin-sim.py`.

## The short version

**Nothing about Crimson's geometry or animation differs from Fatalis's.** Ten separate things
were checked and every one came back clean or identical. One large, *general* render bug did
fall out of the search: the viewer discards 100% of animated bone scale, on every monster.

## What was eliminated, and how

| # | Claim tested | Result |
|---|---|---|
| 1 | Crimson's `.glb` was edited / welded | **Byte-identical** to the original conversion `5ce0c17`. The weld was reverted in `fe02230`. (`em013_00` IS still welded; `em013_02` has an uncommitted working-tree change.) |
| 2 | The motion data was altered | Crimson has no motion of its own: it borrows `em013_00`'s four lists, all 129 clips, via `lists[].remap`. |
| 3 | The retarget binds a track to the wrong bone | Simulated `clipFor()` exactly, including three.js's colon-stripping `sanitizeNodeName`. 56 tracks kept by name, 27 remapped, **0 bound to a bone with a different global id**. No sanitised-name collisions within either skeleton. |
| 4 | Crimson's skeleton differs | Same 101 global ids, same 114 nodes, same 42 `_s` leaves, **rest T/R/S identical on all 101 matched bones** (max delta 0.0). |
| 5 | Skin weights are wrong | Weights sum to 1.0 everywhere; **no vertex bound to the root**; **no repeated joint slot carrying weight** on either model (the known MT slot-padding defect does not touch these). |
| 6 | A mirrored bone breaks `decompose` | **No negative and no non-unit bind scale** on any node of any of the three. |
| 7 | Multiple skins mis-index `joints[i]` | One skin, 59 joints, used by every node, on all three. |
| 8 | The retargeted clip never reaches the mixer | It does -- `index.html:3715` builds it and passes it as `clip3`. (`pose.js`'s comment "nothing in this app passes it" is the armour app's, and is stale here.) |
| 9 | The snout actually moves differently | Full skinning simulated over **all 129 clips x 3 phases**, per primitive. Largest Crimson-vs-Fatalis difference anywhere: **0.42 units**, and it moves every head primitive together -- a whole-head offset from the two models genuinely differing, not one part sliding. |
| 10 | The dropped `_s` tracks cause it | Control: bind them too (`--fix-s`, verified to go from 2 dropped to 0). Snout offset changes by **+0.000**. |

Part groups are identical across all three Fatalis, and so is the gid 241/242 split across mesh
groups, so neither is a Crimson-only asymmetry either.

**Therefore:** if the snout shift is real and animation-driven, it is *not* Crimson-specific, and
the same behaviour must be visible on `em013_00` under the same clip. That is the cheapest way to
split "Crimson is broken" from "the viewer is broken for everyone".

## The real bug this turned up: animated scale never reaches the model

Fatalis's motion files carry **1,112 scale tracks** -- 834 on base bones, 278 on `_s` leaves --
and the values are not decoration:

    9:132     0.0000 .. 14.7195   (and negative, to -2.5981)
    2:130    -0.7914 ..  7.9797
    20:131    0.0000 ..  3.7487
    16:241   -2.5077 ..  1.2597
    17:242   -2.5077 ..  1.0000
    15:7      0.0340 ..  2.7916

`0.0000` is how MT hides geometry -- it collapses the bound vertices to a point. Gids
**130, 131, 132, 241, 242 are leaf skin joints with no children**: bones whose only function is
to scale geometry. Nothing else is attached to them.

The viewer throws all of it away, in two independent places:

1. `render/pose.js` `step()` -- `_m.decompose(node.position, node.quaternion, _s3)`. Scale goes
   into a scratch vector and is dropped. Base-bone scale never reaches the displayed model.
2. `render/skeleton.js` `bonesByGid()` -- a gid maps to `info.leaf ? bone.parent : bone`, so for
   every bone whose skin joint is the `_s` leaf, the driven node is the leaf's PARENT. Scale
   authored on the leaf is never transferred at all.

So geometry the ROM collapses to nothing is drawn at full bind size, and geometry the ROM
inflates up to 14.7x stays small. Measured cost on the head region of these particular clips is
small (<= 0.33 units, and identical on Crimson and Fatalis, which is why it is not by itself the
snout symptom) -- but on the bones that reach 14.7x it will not be small.

A third, related defect: `pose.js` snapshots the proxy's rest as
`push([o, o.position.clone(), o.quaternion.clone()])` and restores only those two. **Scale is
never restored**, and the proxy is cached per model and reused for every clip -- so any scale the
mixer writes onto it persists into every later clip. Latent today only because (1) and (2) stop
the scale being used; fixing either without fixing this would expose it.

## Also found: the remap omits the `_s` twins

`lists[].remap` is built for base bones only (27 entries for Crimson), so the 18 `_s` tracks in
Fatalis's files are silently dropped for every borrowing monster -- `clipFor` counts them in
`lost` and tells no one, and the list's `dropped` field stays `null`. Only 2 of the 18 are ever
animated in these clips (a 0.5% scale on gid 5/6), so the measured effect here is 0.000, but the
harvest gap is real and affects all 18 borrowers.

Note this interacts with the bug above: those dropped tracks are scale tracks on `_s` leaves,
which (2) would discard anyway.

## Live-viewer control (2026-09-11, after Raven's 179-frame capture)

Raven: "It shifts mid animation as well." So the offline simulation was checked against the running
app, on his own local server, driving the page directly.

Method: pause the transport so every comparison is one identical frame; toggle one mesh at a time
and count changed pixels, with a **control that toggles nothing and must read 0** (it did, both
models). Then put Crimson and Fatalis on the SAME clip at the SAME mixer time from the SAME camera
and diff the silhouettes.

    silhouette overlap  both 60,126 px | crimson-only 2,258 | fatalis-only 2,245   = 96.3% identical

The 3.7% residue is edge antialiasing plus the authored differences between the two models. **The
head is not displaced.** Per-mesh A/B on the same frame, both models draw the same parts (3, 4 and
102 on; 1, 2, 5, 7, 9, 10 off) and each covers a comparable area:

    prim10 Group3  part3    crimson 7,686 px   fatalis 6,864 px
    prim22 Group102_2 p102  crimson 6,029 px   fatalis 5,279 px
    prim11 Group4  part4    crimson     0 px   fatalis   806 px   (occluded on crimson)

Two live findings worth keeping:

- `Group4` (part 4) reaches x 2.81 where the head mesh stops at 1.86, and `Group102_2` reaches
  2.31 -- both rigidly bound to bone 3 while the head around them deforms on 3/4/105/243. They do
  separate under animation, but only from 2.05 to 2.76 and 0.92 to 1.26 units, and Fatalis does
  the same thing, so it is not the symptom.
- `Motion[2]_loop`, the clip the app restores on load, is a 14.42 s idle that never opens the
  mouth. Raven's capture has the jaw wide open, so it is a different clip -- which one is not
  known, and that is the one thing still needed to close this.

**Status: not reproduced.** Everything measurable says Crimson's animated geometry matches
Fatalis's. The real defect this search turned up is the discarded bone scale above, which is
general rather than Crimson-specific.

## Crimson Fatalis, the snout: FOUND (2026-09-11, L0 Motion[3])

Raven named the clip: **list 0, Motion[3]**. His 179-frame capture is 30 fps with the motion over
frames 41-104 = 2.1 s, matching Motion[3]'s 2.28 s, so his frame 80 is **t = 1.41 s**.

Measured in the running app at exactly that frame, with ONE fixed world camera used for both
monsters (they share the skeleton and the clip, so their heads coincide in world space):

    silhouette   both 168,655 px | CRIMSON-only 9,329 | fatalis-only 2,279   (93.6% overlap)

A 4x asymmetry, and hiding one mesh at a time says what it is made of:

    prim22  Group102_2  part 102   4,962 px   53%
    prim11  Group4      part   4   1,771 px   19%
    prim3   Group0_4    part   0   1,548 px   17%

**Parts 102 and 4 are 72% of it.** Both are bound **100% to `22:3_s`** -- one rigid bone, the head
-- while the face around them deforms on 3/4/105/243. So they cannot follow the snout: they ride
the head as a solid block and the face slides out from under them. On the earlier frame `Group4`
was fully buried (hiding it changed **0 px**); at t=1.41 it contributes 1,771 px. That is exactly
"bind position looks correct, it varies with animations, it shifts mid animation".

They protrude on Crimson and not on Fatalis because Crimson's sit twice as far off the head
surface to begin with -- distance from the part mesh to the nearest head-mesh vertex, at bind:

    Group[4]#0     crimson 2.052   fatalis 0.992
    Group[102]#1   crimson 0.920   fatalis 0.868
    Group[7]#0     crimson 0.235   fatalis 0.203     <- the alternate, and it never separates

Under animation `Group[4]#0` grows to 2.757 on Crimson; `Group[7]#0` grows to 0.235, i.e. **not at
all** (growth x1.0).

### Why they are on: the head cluster has NO ROM default

`defaultGroupsOn('em013_01')` returns group[2] alone. The head cluster -- parts `2,3,4,5,7,102`,
members `[3,4,5,6]` -- gets **nothing**, because **no Fatalis has an entry in any of the parts
tables**: `ROM_DEFAULT_BY_MON`, `ROM_REST_SETS`, `ROM_RAGE_SET`, `ROM_RAGE_ADD`, `ROM_DEFAULT_SET`
and `part-rest.json` are all empty for em013_00 / _01 / _02. With nothing on, the cluster falls
through to its FIRST member, group[3] = parts 3, 4, 102 -- and the UI labels that "Intact".

Switching the head cluster, same frame, same camera:

    Intact        parts 0,3,4,8,102   crimson-only 9,329
    Horn Cracked  parts 0,3,5,8,102   crimson-only 8,100
    Horn Broken   parts 0,3,7,8       crimson-only 2,537   -73%
    Face Broken   parts 0,2,7,8       crimson-only 2,371   -75%

So the opening state is a **fallback, not a decode**, and the state it picks is the one that draws
the two proud overlay meshes. Parts 4/5 + 102 are geometry laid ON the surface and 7 is the flush
alternate -- the same shape as Plesioth's "the wound mesh is on the surface level". Which of these
is actually undamaged is NOT established here (mesh size and bounding box never say that, and
damage often ADDS geometry); what IS established is that nothing in the ROM tables chose group[3].

**The fix is a decode, not a label**: em013's rest/default set has to come out of the ROM, which is
the `build-partrest.py` break-arm polarity item already on the board (80 of 182 sites inverted).
Editing the default is the parts agent's area.

Ruled out along the way, by measurement: the retarget (0 of 83 tracks on a wrong bone), the
skeleton (identical rest on all 101 bones), the weights (no root, no repeated slots, sums 1), the
material texture swap (the Angry albedo is the same UV layout, just lava-glow -- so the rage swap
is correct), and the geometry itself (in the head bone's own local frame Crimson tracks Fatalis to
4.009 vs 3.988).

### Correction (same day): it does NOT move more. It is static, and the head turning reveals it.

Raven: "I find it strange that Crimson's snout somehow moves more, but everything else is fine."
Right to push -- the "emerges as the face deforms" wording above overstates it. Measured in the
head bone's OWN frame, displacement from bind over Motion[3]:

    Group[4]#0 / Group[5]#0 / Group[7]#0 / Group[102]#0 / Group[102]#1
        crimson 0.000   fatalis 0.000      -- perfectly rigid, both models
    Group[3]#0   crimson 0.359  fatalis 0.359
    head skin    crimson 0.877  fatalis 0.905

**Nothing moves differently.** The overlays are rigid on `22:3_s` on both monsters and the head
skin deforms by the same amount on both. At BIND, before any animation, Crimson already shows
3,767 excess pixels against Fatalis from the same camera (96.2% overlap), part 102 being 2,783 of
them. So the defect is STATIC; the clip only rotates the head until it faces the camera.

### Why it is Crimson and why it is the snout: the overlay is authored proud, and prouder here

Signed distance OUTSIDE the head surface at bind, along the head mesh's own authored normals:

    primitive       crimson max/mean        fatalis max/mean
    Group[4]#0      1.875 / +0.518          0.796 / +0.286     <- 2.4x
    Group[5]#0      1.124 / +0.255          0.559 / +0.204     <- 2.0x
    Group[102]#0    1.245 / +0.162          0.527 / +0.137     <- 2.4x
    Group[3]#0      0.139 / -0.002          0.129 / -0.005        same
    Group[7]#0      0.177 / -0.032          0.172 / -0.032        same, and INSIDE the surface

And in the raw quantised positions, which is the .mod exactly:

    Group[7]#0    crimson x 13007..14361  y 5411..5880  z 27784..28570
                  fatalis x 13007..14361  y 5411..5880  z 27784..28570   IDENTICAL to the integer
    Group[4]#0    crimson x 12740..15115
                  fatalis x 12740..14481    same minimum, 634 units further to the monster's +x

`romcheck.py`: all three .mod files byte-identical to the ROM archive, so this is authored, not a
conversion defect.

**So the answer to "why only Crimson, why only the snout":** the wrong default is on all three
Fatalis equally -- the head cluster has no ROM entry and falls through to group[3], drawing parts 4
and 102. Part 7, the alternate, is the same mesh in both models and sits INSIDE the head surface
(mean -0.032), which is why no other state shows anything. Parts 4/5/102 are authored to sit
outside the surface on both, but Crimson's sit 2.4x further out and reach 634 units further to one
side -- so the identical mistake breaks the silhouette on Crimson and stays buried on Fatalis.
That is also why it is only the snout: those are the only meshes rigidly bound to `3_s` that sit
outside the skin at all.

#### 2026-09-12 - EFL generator types DECODED: col1 is the `cParticleGenerator` subclass

> Raven: "Switch to looking into Savage's Effects again since that may help resolve things like
> Valstrax and Teostra's issues"

He was right, and the census below is the proof. First the decode, all of it read from `main`.

**The resource class.** `rEffectList`: `(crc32 ^ 0xFFFFFFFF) & 0x7FFFFFFF` of the name is
`0x6d5ae854`, the EFL's type hash. Registered at `0xb5a1f8`.

**The loader, `rEffectList::load` at `0xb59604`.** Reads the whole file, then:

    [+0x00] == 45 46 4C 00    'EFL' + NUL, built by movw/movt at 0xb59684
    [+0x04] == 0x20120306     the VERSION -- a date stamp, not a count
    [+0x0c] -> this+0x64      the 60.0
    [+0x10] u16               row count -> this+0x74
    [+0x20..+0x2c]            -> this+0x84..+0x90
    body = file[+0x30:]       copied, then 0xb598b0 builds the entries

**A CORRECTION to the 2026-09-11 entry's "column 2".** `0xb598b0` builds one 0x44-byte entry per
16-byte row and reads three of its four words, each as `(offset << 8) | tag`:

| word | read as | handler |
|---|---|---|
| col0 `+0` | pointer only | `0xb58ae8` |
| **col1 `+4`** | pointer + **8-bit tag** (`uxtb`) | **`0xb58c24`** |
| col2 `+8` | **not read at load** | -- |
| col3 `+0xc` | pointer + 4-bit tag (`& 0xf`) | `0xb592c0` |

The 17 / 18 / 33 / 34 / 81 / 82 values that entry called "column 2" are **col2**, which the load
pass never touches -- a runtime value, not the generator type. The type is **col1**: 0, 1 and 5 on
Savage's two definitions. col0 counts 0, 1, 2 ... down the rows.

**The factory, `0x9badd4`.** `cmp r1, #0x1a` -> a 27-way table at `0x9badec`; every case allocates
`0x1d0` -- all 27 classes are 464 bytes, so size tells them apart not at all -- and constructs.

**Tag -> class, resolved without proximity.** Each class is registered by `bl 0x7abef0`
(`MtDTI(r0 = DTI, r1 = name, r2 = parent, r3 = size)`), which names its DTI object. Entry [2] of that
DTI's vtable is `newInstance`, and it installs the class's INSTANCE vtable; the factory case's
constructor installs the same one. Matching on that vtable:

| tag | class |
|---|---|
| 0 | LiteBillboard |
| 1 | LitePolyline |
| 2 | LitePolygon |
| 3 | Texline |
| 4 | Line |
| 5 | Model |
| 6 | PrimModel |
| 7 | LensFlare |
| 8 | MassBillboard |
| 9 | Filter |
| 10 | Light |
| 11 | Hit |
| 12 | Polyline |
| 13 | Texline |
| 14 | Line |
| 15 | PolygonStrip |
| 16 | Custom |
| 17 | ClothPolygon |
| 18 | Adhesion |
| 19 | BillboardStrip |
| 20 | SizeBillboard |
| 21 | LightShaft |
| 22 | Point |
| 23 | AxisPolygon |
| 24 | Force |
| 25 | special-cased before the switch, unread |
| 26 | Trail |

**Do not shortcut this by proximity.** For 13 single-class registrations the constructor sits exactly
`0xbc` after the name, which is tempting -- and that rule labels tag 5 MassBillboard. It is Model. My
first register-tracking pass also paired every DTI with its NEIGHBOUR's vtable, because the
registration code stores class K's vtable after loading class K+1's name; `newInstance` is
self-describing (it loads its own DTI), and it is what the table above rests on.

**An independent control, from the loader's own table.** `0xb58c24` is also 0..26 and groups tags by
what the block references:

* tags 4, 14, 22 -> the case that loads **nothing** -- **Line, Line, Point**, the untextured ones;
* tag 5 -> its own case, a path at block `+0x50` loaded through **`rModel`** (DTI `0x211e1c8`);
* the two textured cases (polylines, polygons, trails, billboards) load through **`rEffectAnim`**
  (DTI `0x2122a64`) from block `+0x130`, then `+0x70`, `+0xb0`, `+0xf0` via `0xb59178` -- not
  `rTexture`. So the 72-byte `.ean` found yesterday is what those generators animate with, and the
  likeliest carrier of the atlas cell choice.

**The census, over all 1,115 `.efl` (0 bad headers).** Only EIGHT of the 27 classes occur:

| generator | rows | Savage | Teostra | Valstrax |
|---|---|---|---|---|
| **Model** | 7,194 | 7 | 111 | 536 |
| **LiteBillboard** | 1,746 | 2 | 32 | 26 |
| LitePolyline | 421 | 3 | | 9 |
| LitePolygon | 234 | | | 1 |
| tag 25 | 192 | | 1 | 13 |
| Filter | 18 | | 1 | 2 |
| SizeBillboard | 8 | | | |
| PolygonStrip | 5 | | | |

**Model + LiteBillboard are 91% of every generator row in the game, and they carry all three
monsters.** A runtime for Savage's vortex is a runtime for Teostra and Valstrax.

**Tag 25 is special-cased BEFORE the switch** (`0x9bada0` `teq r1, #0x19` plus a flag test,
allocating `0x250` instead) -- unread.

**Two leads closed on the way:**

* **No material swap.** `setMaterialAt` (`0x88db20`) has 18 call sites in the whole binary, in four
  clusters: Khezu (`0xd1ea90`, `0xd1eca8`, `0xd1eedc`), a stealth cluster in the Kushala Daora /
  Chameleos range (`0xe0150c`..`0xe017d4`, beside `XfB_N__E0__m03_stealth01`), an unnamed one
  (`0xfbfb44`..`0xfbfc24`), and a second stealth cluster (`0xff1ca4`..`0xff20a8`). **Savage has
  none**, which answers the board's "check for a swap site before anything else is tried": no.
* **`fDiffuseColor`'s fourth float is not a weight.** 173 of its 174 tracks sit on materials whose
  own `FDiffuse` feature is off, and they carry four floats per key -- but `build-matanim.py`'s
  reading of the vector writer `0xb0f844` shows a 3-column track never writes the fourth, so the
  viewer ignoring it is correct.

**NEXT:** the Model and LiteBillboard FIELD layouts -- spawn count and rate, lifetime, velocity,
size, colour ramp, atlas cell. The loader touches only a few (block `+0x68` / `+0x6a` u16 frames
divided by 60.0 into seconds, `+0x6c`); the rest is read by each class's own update code, reachable
from the instance vtables in the table above.

#### 2026-09-12 - THE GAME'S OWN PARTICLE SIMULATION RUNS, on Savage's real data

> Raven: "Keep going, Savage is our test case for doing effects for monsters that use them."

Rather than read dozens of field layouts out of disassembly, the effect is now EXECUTED: Unicorn runs
MHGU's own code on `em043_05_002_s.efl`, and every particle below was spawned, aged and grown by the
game. Harness: `C:\MHGU-Extract\efx\` (`efx_emu.py`, `efx_load.py`, `effect_frames.py`,
`partdiff.py`, `annot.py`). It rests on `build/arm/emu.py`, which needed two fixes: its dead exefs
path, and the ARM EABI helpers (`__aeabi_memcpy`, `__aeabi_memset*`, `__aeabi_memclr*`) that it did
not implement -- every one was a silent no-op, so `rEffectList::load` copied a ZERO body and every
row read null. Note `__aeabi_memset(dest, n, c)` takes its arguments in a different order from
`memset`.

**The construction chain, all of it the game's code:**

| step | address | what it does |
|---|---|---|
| `uEffect::newInstance` | `0x9b5cc8` | the owner, `0x210` bytes, vtable `0x1786558` |
| `rEffectList::load` | `0xb59604` | parses the file, loads its resources, builds one `0x44` entry per row |
| factory | `0x9baca0` | one generator per row, linked at `uEffect+0x1f0` (next at `gen+0xc`), init by slot 6 |
| pool setup | `0x9bb358` | node instances at `uEffect+0x1f4` (`0x130` each), particle slices, slot 7 |
| `uEffect::move` | `0x9b6130` = vtable slot 10 | per frame: node update, then slot 18/19/20 on each generator |

**Generator fields, confirmed by execution:** `+0x08` owner, `+0x18` node instance
(= `uEffect+0x1f4` + index * `0x130`), `+0x1c` node index, `+0x28` its rEffectList entry,
`+0x30` node block (col0), `+0x34` parameter block (col1), `+0x38` col2, `+0x3c` col3,
`+0xb0/+0xb4` active list head/tail, `+0xb8` free list, `+0xd0` lo16 capacity, `+0xd6` stride.

**The loader's own resource requests** for `em043_05_002_s`, exactly: rModel + rEffectAnim
`cm150_000` (twice), rModel `em024_00_001`, rModel + rEffectAnim `cm202_042`, rEffectAnim
`cm090_009` + texture `cm090_009_GSM_HQ_NOMIP`, texture `cm202_042_HQ_NOMIP`, and a chained list
`effect\em\em043\em043_00_900`. Entry `+0x18` holds the rModel; a Model generator then picks a
mesh PER PARTICLE by part id through `rModel+0x74` (the `.mod`'s 48-byte mesh table) and `+0x78`,
at `0xb460c8`. `cm202_042` has four meshes, parts 0-3 -- one per lightning bolt.

**What the owner supplies, and the traps in it.** A stub owner of zeros looks like DATA, not a
harness fault: every generator emitted one particle with a one-frame life. The real defaults matter:
`uEffect+0x1b0` time scale 1.0, `+0x1fc` count scale 1.0, `+0x180..+0x19c` per-view scales 1.0.
The frame delta is `uEffect::updateDelta` (`0x9b4140`):
`+0xfc = +0x1c * +0x100 * +0xf8 / [timer+0x38]`, where `+0xf8` is the timer's frame period
CAPTURED AT CONSTRUCTION, so the timer (`*0x211f764`) must exist before the owner is built -- built
after, `+0xf8` captured an instruction word and the delta was -inf. `move` accumulates
`+0x104 += +0xfc` and runs `floor(+0x104)` sub-steps. Its body runs only with bit 24 of `+0x118`
set; the constructor/reset (`0x9b1f7c`) leaves it clear, so an unstarted effect idles on
`vfn +0xd8` (`0x9bb884`), which only checks its attach targets at `+0x30` and `+0x11c`.

Null pointers do not fault in this harness, because `.text` is mapped at address 0. A 196-frame
start delay on every row turned out to be built from code bytes read through a null `gen+0x18`
before the node instances existed. Log reads below `0x2000` whenever a result looks too uniform.

**Stand-ins, and only these:** the allocator; the resource manager (answering rModel with the real
`.mod` mesh table); the effect manager's work arena (`+0x150/+0x154`, used by `0xb8ef7c`) and its
disable mask (`+0x228` = 0); the timer's period (1/60, the rate the `.efl` header declares -- only
the ratio enters the delta); the unique-id allocator `0xb8f4b8`; and **the start bit**, bit 24 of
`uEffect+0x118`, pending the spawn path that sets it in the game.

**Particle state, read back frame by frame.** Common header: `+0x04` next, `+0x0c` flags (bit 24
flips every frame -- a two-buffer swap), **`+0x14` age in frames**, `+0x40/+0x44` a uniform scale
(buffer A/B), `+0x48` its rate. Model particles are 288 or 320 bytes, LiteBillboard 176.

| generator | life | scale | other |
|---|---|---|---|
| 0 Model `cm150_000` (smoke) | ~17 f | 0.80 -> 1.40, rate 0.048 decaying ~4%/frame | per-axis (1, 1.2, 1); rotation pi/2; mesh 12 of 15 |
| 3 Model `cm202_042` (bolt) | 9 f | 9, fixed | per-axis (1, 1.48, 1); random orientation, no spin |
| 4 LiteBillboard | 23 f | 0.75 -> 1.90, +0.05/frame, linear | 2D size (1.22, 1) |

All three carry a counter at `+0xb8` rising 0.5 per frame (double-buffered at `+0xc0/+0xc4`) --
the likeliest atlas frame. **No position field changes** on any of them: each particle sits at its
node and grows in place, so placement is the node's job. Colour and alpha are not in particle state
at all, which suggests they are evaluated from age at draw time -- unconfirmed.

Emission over 300 frames: gen 0 a puff every ~17 frames, two overlapping; gen 1 a single 20-frame
burst at start; gens 2 and 3 every 5 frames; gen 4 every 13; gen 5 every 6.

**NEXT:** colour and alpha (the col3 curves are read only by base-class code, and some of it runs
inside slot 18), the node instance's world transform (the attach joint -- the node block's `102`),
and the draw pass (slot 21) that turns this into geometry.

#### 2026-09-13 - EFFECT RUNTIME: the ROM's particle code, translated and checked byte for byte

> Raven chose "1": a live JS particle runtime in the viewer, verified against the emulator as oracle.

**Corrections to the 2026-09-12 entry above. Three of its statements came from a harness that was
not running the game faithfully, and are wrong:**

| said | actually | the harness fault |
|---|---|---|
| the start is "the bit-24 stand-in" | the start is the effect's own routine `0x9baa9c`: factory, pool setup, `0x9bb69c`, per-generator `0xae9df4` and vtable slots 8/9/15, node-instance flags, THEN bit 24 | the stand-in skipped slot 15, leaving `gen+0x1b8` null; every per-particle vector was scaled by code bytes |
| the life envelope is linear (matched 1032/1032) | it is SQUARED for every Savage row: `0xa60f68` squares the value when generator `+0x40` bit 30 is set, and `0xae99f8` sets that bit from node block `+0x08` bit 27 (otherwise from the effect manager's `+0x230` bit 0) | `0xae9938` (slot 8) never ran, so bit 30 was never set |
| emission every 5/13/17/6 frames | right, but only by accident: see below | the effect manager was a zeroed stand-in |

**Particle volume.** uEffect's reflected property `mParticleVolume` (`0x9b8a98`) is its `+0x118`
bits 8..11. The constructor takes it from the effect manager's `+0x15c`, clamped to 2; the setter
`0x9b3758` clamps to the same cap except for 3. The manager's own constructor (`0xb8c858`, the
0x350-byte singleton made at boot by `0x3d8228`) sets that cap to **2** (`0xb8ca5c`), and nothing else
in the image writes it. Generators copy the volume into `+0x50` bits 28..31 (`0xae9918`), and
`0xa596e8` thins spawn counts by it: volume 2 or 3 passes every spawn, volume 0 keeps 1 in 3, which is
exactly the tripled periods a zeroed manager produced. The old numbers were right only because a null
read happened to clamp to 2.

**The harness, now:** the 2334 static initialisers run first (MtMatrix identity rows at `0x1917640`,
MtVector3 statics, the sine table at `0x190f568` were all zeros before); the real effect manager
constructor runs; the effect starts through `0x9baa9c`; `__aeabi_uldivmod`/`ldivmod` and `log10f`
are implemented; a null-read guard refuses any trace that read below `0x2000`.

**The runtime** (`docs/render/rom/effect/`): MHGU's particle routines translated to JS, keeping the
game's own struct layouts in flat memory, each commented with its ROM address. `dev/effect-check.mjs`
replays call vectors recorded from the emulator (`C:\MHGU-Extract\efx\vectors.py`: every byte a
call read, every byte it wrote, its arguments and return): a translation passes when it reads nothing
else and writes exactly the same bytes. A branch no recorded call reached throws `Unverified` instead
of guessing. Arithmetic is transcribed register by register with `Math.fround` after every operation
(one missed round on a division passed every per-path vector and failed on 54 of 192 full calls, so
arithmetic routines are checked on EVERY call). JavaScript's `Math.sin`/`cos` matched the emulator on
all 393 euler matrices of Savage's run.

Translated, all checks passing on Savage's `em043_05_002_s` (every call over 60-120 frames):

| layer | routines |
|---|---|
| life | envelope `0xaeae40`, squared/linear pass `0xa60f68`, release `0xcaa624`, kill `0xa5825c` |
| curves | vec3 curve `0xaf82f4` (linear, cubic `0xaf7bc8`, step), colour curve `0xaf63c4`, curve time `0xaea784`/`0xaec7e0`, particle-to-world `0xa76cc8` |
| motion | kinds 0 `0xa61a3c`, 5 `0xa637c8`, 10 `0xa646f4`, their ticks, base frame `0xa5fdf0` |
| Model | particle pass `0xa9718c`, particle update `0xa972b8` (colour from envelope or curve, per-axis scale velocity or curve, facing), animation `0xa97838`, scale `0xa6746c`, rotation `0xa683f8`, channel `0xa68c44` |
| emission | mode A `0xa57938`, mode B `0xa57bfc`, interval/period/thinning, pre-update `0xa570fc` |
| spawn | base `0xa59a5c` (shape `0xa5b488` through the ROM sine table, placement, motion kinds 0/5/10, life), Model `0xa965c4` (mesh by part id, animation binding, colour, scale, per-axis scale, rotation, channel) |
| generator | update `0xa574c4` for Model generators: all 480 Model generator-frames byte-exact |

Across the other ten Deviljho and Savage effect files not one byte mismatched; every failure is a
refused branch. Savage's second file `em043_05_000` still refuses: motion kind 2 (spawn `0xa5d194`,
per frame `0xa6243c`), orientation from direction (`0xa67988`), spawn direction modes (generator
`+0xe7`), zero period, random animation start, launch flag 0x200, spawn into the hold, and a few list
cases.

**Not done yet:** LiteBillboard and LitePolyline (one generator each in `em043_05_002_s`, two
LitePolylines in `em043_05_000`); construction (`rEffectList::load`, the factory, pool setup, start
slots); node and owner per-frame (`0x9b6130`, the node transform that will take Savage's joint); the
draw passes (slot 21) that turn particle state into geometry. Nothing is wired into the viewer yet.

#### 2026-09-13 (later) - EFFECT RUNTIME, continued: the whole effect, from file bytes to frames

> Continuing Raven's "Keep going, Savage is our test case for doing effects for monsters that use them."

The "Not done yet" list in the entry above is now mostly done. Translated and checked the same way
(call vectors from the emulator, every byte read and written, unexercised branches refused):

| layer | routines | checked on |
|---|---|---|
| LiteBillboard, LitePolyline (shape type 1) | pre-update, spawn, per-particle update and frame passes | both Savage files; em043_05_000's two LitePolylines use shape types 6 and 0, still refused |
| the effect's own frame | `uEffect::move` `0x9b6130` (frame step, substeps), effect matrix `0x9b228c`, frame preparation `0x9bb9d0` / `0xa56c10`, node integration `0xae8ac0`, node local transforms `0xae8b74` (quaternion) / `0xae8d18` (blended euler), node world transform `0x9bba54`, node start delay `0xae9340`, node counting `0x9b6794`, generator post passes `0xa91c48` / `0xaaebb0` | all 120 frames of em043_05_002_s, and every call of the arithmetic ones (726 node transforms) |
| construction | `uEffect::newInstance` `0x9b5cc8` and its base constructors; the start routine `0x9baa9c`: factory `0x9baca0` with the per-type constructors and slot-6 inits, node-instance and particle-pool allocation `0x9bb358`, node setup `0x9bb69c`, per-generator seeds and slots 8, 9, 15; the manager's MtRandom `0x7c9234` | all eleven em043 effects (only em043_05_000's LitePolyline shape kinds 6 and 0 refused) |
| loading | `rEffectList::load` `0xb59604` (entries, body, per-row texture / animation / mesh requests, the child list) and `rEffectAnim::load` `0xce14a4` | all eleven |

**End to end.** `dev/effect-e2e.mjs` runs the JS alone: starting from the emulator's memory just
before `newInstance` (the game's static initialisers and effect manager, run by the game's code), it
loads the .efl and its .ean/.mod resources, builds and starts the effect and moves it once per frame,
then compares every non-zero page of the data sections and heap with the emulator's after the same
run. **Savage's em043_05_002_s and Deviljho's em043_00_004_s: 120 frames, about 5.5 MB compared,
0 bytes differ.** One frame short gives 345 differing bytes, so the comparison bites. The other nine
em043 effects stop at branches not yet translated.

Harness faults found on the way, both of which had silently shortened what the vectors saw: the
emulator's libc stubs (`memclr`/`memset`/`memcpy`) wrote with calls no memory hook sees, so the
construction vectors lacked those bytes (re-recorded; per-frame vectors were unaffected); and the
allocator, id counter, resource manager and file streams are now recorded as services and replayed.

**What the effect is attached to.** Every recorded run is a free effect: uEffect `+0x30` (the parent
model) is null, so node transforms hang from the effect's own matrix (`0x9bd058` returns `+0x120`).
The parent path -- `0x9bd058` calling the parent's vtable `+0x54` with the node's joint number
(node instance `+0x8c`), and `0x9b228c`'s parent branch -- is refused until a run with a parent
exists. That is the seam where Savage's joint goes in.

**Harness stand-ins still in the resources:** the rModel handle carries only the .mod mesh table at
`+0x74`/`+0x78` (the Model generator's slot 15 reads `+0x84` of it, zero here; a real rModel may not
be zero there), texture handles are empty objects, and the child list em043_05_002_s names is an
empty object. None of them is read by the recorded simulation paths beyond what is stated.

**Not done yet:** LitePolyline shape types 6 and 0; the branches the other Deviljho effects reach
(spawn without an emitter shape, scale curves, repeat counts, colour sources, ...); attaching to a
parent joint; the draw passes (slot 21) that turn particle state into geometry; the viewer wiring
(ROM data blob, harvested effect files, the renderer). Nothing is wired into the viewer yet.

#### 2026-09-13 (later still) - EFFECT RUNTIME: drawing, and what the effect hangs from

> Raven: "Proceed with 1-3" -- (1) drawing, (2) attaching to Savage's joint, (3) viewer wiring.

**(1) Drawing.** uEffect's draw (`0x9b75e8`) and everything under it -- the per-generator drawable check,
Model particles, LiteBillboard, LitePolyline -- is 32 routines of mostly long VFP arithmetic. They are
LIFTED rather than hand-translated: `efx/lift.py` turns the instructions the recorded calls executed
into JS over an explicit CPU (`cpu.js`: 16 registers, VFP singles through a Float32Array, NZCV/FPSCR),
and the lifted code (`lifted-draw.js`) is checked against the same vectors as hand code. A branch into
anything unrecorded throws. What it calls outside itself is supplied by `draw.js` / `bridge.js`: the
hand translations (called with arguments read out of the registers, the scratch registers poisoned
after -- which caught a real dependency, `0xa67308` leaving the scale in s0), memcpy, and the engine's
model draw as two services.

The engine's model draw (`0xc8cf1c`, `0xc8d208` -> `0xc8d9d8`) is not effect code, but it decides how a
Model particle looks. Instead of reading 12 KB of state plumbing, `efx/engdraw.py` RUNS it under the
emulator with the engine internals stubbed by name and the material answered from its .mrl, and
snapshots the draw context at the GPU draw. `modeldraw.js` translates the parts a particle reaches and
`dev/effect-modeldraw-check.mjs` replays every snapshot: 1,763 draws across three files, identical.

| decided by the ROM for a Model particle | from |
|---|---|
| world matrix (CBWorld) | the particle's matrix |
| alpha: CBROPTest.fGlobalTransparency = a / 255 | its RGBA8 colour |
| colour: CBPrimEflEmu.fPrimColor = material diffuse x intensity/256 x rgb/255 (FEmissionConstantEflEmu materials; others write CBMaterial.fDiffuseColor) | colour, intensity |
| uv offsets, fTransparencyVolume (soft depth fade), fReflectiveColor x s0 | the uv struct, the volume word, s0 |
| **blend state: a 34-entry ROM table (0x169b2c8) indexed by the generator's mode** | the flags object +0 |
| depth state: DSZTest / DSZTestWrite / DSZWrite / DSDefault | the flags object +4 |
| sort key from the camera depth; feature choices (FPrimitiveModifierEflEmu, FPrimiteveColorModifier, FPrimitiveTransparencyVolume, FBlendFog ...) | |

**The blend is not the material's.** Savage's cm150_000 and em024_00_001 particles draw with
`BSBlendRevSubBlendAlpha` -- reverse subtract, the colour taken away from what is behind -- and
cm202_042 with `BSBlendBlendAlpha`, whatever their .mrl says (the .mrl says BSBlendAlpha).

**(2) What the effect hangs from.** A node with a joint number hangs from the effect's parent
(uEffect `+0x30`) through the parent's vtable `+0x54`; for a monster that is uModel `0x939278`, which
maps the number through `+0x498` to a joint and returns that joint's world matrix. Translated, with the
owner matrix's parent branch; `efx/parent.py` gives the emulator a stand-in unit whose joints turn
every frame, and **em043_05_000 hung from it runs end to end in JS: 120 frames, 0 bytes differ.**

The two Savage effects are different kinds of thing:

| | PEL record | nodes | what places it |
|---|---|---|---|
| **em043_05_000** | UNIQUE eff 30 joint 103, eff 31 joint 3, mode 0 | joints 103, 103, 103, 3, 3 | the parent's joints, every frame |
| em043_05_002_s | UNIQUE eff 70 joint 3, (0,-60,0), mode 3, sub 2 | all unbound (-1) | a base position latched at start + the record's offset; the compose never reads the joint |

So the effect the ROM hangs from Savage's body is em043_05_000. Making it run needed its LitePolyline
paths (shape types 0 and 6, one-colour and width-rate polylines), lifted whole (`lifted-polyline.js`),
and the tracking paths a joint-bound node gives its particles (`lifted-motion.js`).

**Still unread:** who spawns a proof effect and sets its parent and base (the requester); the
LiteBillboard / LitePolyline RENDERING (the records and vertices are produced and checked, but the
primitive draw that turns them into pixels runs through a second engine consumer, `0xbad790` ->
`0xbab58c` -> `0xbb1e10`, not yet probed); the MFX literal operands (`t4`) in the shader bodies.
**(3) Viewer wiring** has not started. Decode notes: `E:\offline\decode\notes\effects-draw.md`.
