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
