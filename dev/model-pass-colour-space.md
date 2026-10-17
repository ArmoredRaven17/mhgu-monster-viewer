# The model pass's colour space -- linear or gamma (research agent for the Viewer agent, 2026-10-15)

Raven: "follow the ROM". Question from the Mizutsune colour agent: the viewer writes `fAlbedoColor` RAW but
reads every emission constant as sRGB ("the Crimson Fatalis convention", 2026-09-11); the game's targets
are RGBA8 UNORM. Which space does the game's MODEL PASS combine colour constants and texels in?

Read only. Nothing in `docs/` was changed. Sources: `C:\MHGU-ROM\exefs` (VAs, `efx/armdis.py`), the shader
package `romfs\nativeNX\system\app_shader\AppShaderPackage.mfx` (bodies printed with `efx/shader/mfxprog.py`),
`docs/materials.json` (the MRL feature selections, build-materials.py), and the notes cited per line.

## 0. Answer

**Gamma. The game's model pass computes in display (sRGB-encoded) values throughout: texels are sampled as
stored, every colour constant is used raw, and nothing is encoded on output.** The engine HAS a linear
workflow -- one switch, `sRender.mSRGBEnable` -- and MHGU builds it OFF.

| item | game | status |
|---|---|---|
| textures (albedo `_bm` DXT1/DXT5, format 19/23; RGBA8 format 7) | sampled as stored: UNORM NVN format, no sRGB bit, DecodeMode 0 | **R** (format, bit, mode, loader flags); "DecodeMode 0 = no decode" **I** (§2.4) |
| `fAlbedoColor`, `fDiffuseColor` (as albedo tint), `fAlbedoBlendColor` | raw multiply on the raw texel | **R** (FAlbedoMap* bodies) |
| `fConstantColor` (FAlbedoMapConstant) | raw: all 101 monster materials that use it select `FConstantOutputLite` (identity), none the sRGB-decode base | **R** |
| `fEmissionColor` | raw: `FEmissionConstant` returns it; `mc.diffuse += FEmission(mc)`; out = albedo x diffuse + ... | **R** |
| `fSpecularColor`, `fReflectiveColor` | raw multipliers in FSpecularMap / FReflect* | **R** |
| vertex colour | `FLinearColor` = identity (the `pow 2.2` variant is selected only when mSRGBEnable) | **R** |
| output | RGBA8 UNORM targets, no `FOutputEncodeSRGB`; window texture NVN `0x25` not `0x38`; final copy identity at default brightness | **R** (effects-color.md, re-checked at the switch) |

So for a viewer that DECODES texels (sRGB -> linear) and ENCODES output, the game's product
`texel x constant` is reproduced only if the constant is decoded the same way:
`encode(decode(t) x decode(k)) = t x k` (exact for a pure power curve; within ~6% at mid-grey for the
piecewise sRGB curve three.js uses). **The emission convention is the right one; the raw albedo / diffuse /
constant / specular writes are the outliers.** The tired multiplier (0.2, 0.52, 1) shows today as
x(0.48, 0.75, 1) where the game shows x(0.2, 0.52, 1).

## 1. What the viewer does today

| where | what |
|---|---|
| `docs/render/assets.js:76` | every colour map `SRGBColorSpace` (decoded); normal maps `NoColorSpace` (`{ linear: true }`, monster.js:9286) |
| `docs/render/stage.js:17` | `renderer.outputColorSpace = SRGBColorSpace` (encode on output); index.html:1697 / fx.js:18 `NoToneMapping`, the grade pass encodes when fx is on |
| `docs/render/monster.js:37` | the DefaultCube_CM faces `SRGBColorSpace` |
| `docs/render/rom/material.js:188-194` | static `fAlbedoColor x fDiffuseColor x fConstantColor` -> `mat.color.setRGB(...)` **raw (linear working space)** |
| `docs/render/rom/material.js:376-377` | static `fEmissionColor` -> `emissive.setRGB(..., SRGBColorSpace)` **decoded** |
| `docs/render/rom/material.js:446` | `uSpecRGB` <- `fSpecularColor` **raw** |
| `docs/render/material.js:880-889` | animated `fConstantColor` / `fAlbedoColor` / `fDiffuseColor` -> `m.color.setRGB` **raw** |
| `docs/render/material.js:911` | animated `fEmissionColor` (lit) -> `SRGBColorSpace` **decoded** |
| `docs/render/material.js:916` | animated `fEmissionColor` on an additive MeshBasic -> `color = albedo + v` **raw** (inconsistent with :911) |
| `docs/render/material.js:942, 953, 974` | animated `fReflectiveColor` (avg -> envStrength), `fAlbedoBlendColor` (uExtTint), `fSpecularColor` (luma -> uSpecTint) **raw** |
| `docs/render/material.js:145, 502, 528-530` | the legacy path (ROM core off): albedo raw, emission raw |

The only stated reason for the emission's sRGB read is `material.js:894-910`: "the ROM's colour constants
are in the same space as its textures" -- asserted from Raven's look at Crimson Fatalis, not read. §2 reads it.

Notes already on the subject: `C:\MHGU-RE\offline\decode\notes\effects-color.md` (targets, encode modes,
"no sRGB conversion happens anywhere"), `effects-draw.md` "Compositing" (mSRGBEnable = 0, the MT -> NVN
table), `C:\MHGU-RE\offline\notes\build-notes\tier2-ndraw.md` Chunk 13 ("no shipped texture is sRGB by
format"), `chunk5-shaders.md` Parts 9 / 18 (FDegamma, FConstantOutput), `monster-shader-model.md`,
`dev/monster-review.md:3837` (the effects lane dropped its sRGB encode 2026-09-13),
`dev/gu-lessons-for-3u-4u.md:92` (the convention, carried to 3U/4U). None of them asked the question for
the model pass.

## 2. What the game does

### 2.1 The switch: `sRender.mSRGBEnable` (+0x29) = 0

* `0xbb9a94 mov sb, r1` (flags), `0xbb9dc8 mov fp, #1`, **`0xbb9dfc bic r0, fp, sb, lsr #9` / `0xbb9e04 strb
  r0, [r4, #0x29]`**: mSRGBEnable = 1 & ~(flags >> 9).
* The app's constructor: `0x3d7f34 movw r5, #0x33e` / `0x3d7f4c str r5, [sp, #0xc]` / `bl 0x3ddc60`;
  `0x3ddc8c ldr r1, [sp, #0x34]` (that argument) / `0x3ddc9c orr r1, r1, #0x100f` / `0x3ddca4 bl 0xbb9a88`.
  flags = 0x133f, bit 9 set -> **mSRGBEnable = 0**. (Re-read this session; effects-draw.md had it.)

What the switch governs, each read:

* **Colour targets**: base format MT 7 (RGBA8), 9 (RGBA8_SRGB) only when set (`0xb0217c..0xb021a8`); window
  textures likewise (`0xbb9110..0xbb9124`); window RTV EncodeMode 5 = SRGB only when set (`0xb04b24..0xb04b38`).
  effects-color.md §1-§5.
* **The global FLinearColor / FDistanceAttenuation** (scene begin, `0x8791dc..0x879494`): `0x8791f4 ldrb r4,
  [ip, #0x29]` (ip = `[GOT 0x1831cdc]` = `0x211f998`, sRender); nonzero -> slot FLinearColor := record
  `FLinearColorSRGB` (key `0x45ef7402`, `0x87928c..0x879298`) and FDistanceAttenuation := `SquareLaw`
  (`0x879338..0x879340`); zero (`0x8791fc beq 0x879348`) -> FLinearColor := `FLinearColor`. Listing:
  `efx/agents/color-scratch/scene_ann.txt` lines 246-420. So in the linear mode the engine also switches the
  vertex / GUI colours to `pow(c, 2.2)` and lights to inverse-square -- a physically linear workflow. MHGU
  runs the other one.
* **The texture loader** (`0xb4e4dc..0xb4e504`): `ldr r0, [GOT 0x1831cdc]` (the same sRender pointer),
  `ldrb r0, [r0, #0x29]`, expected `.tex` version `0x80a0`, **or `0xa0` when mSRGBEnable is set**, exact
  compare, reject otherwise. Every monster `.tex` is `0x80a0` (chunk4-rtexture-tex.md: 643 of 643; this
  session: 590 of 590 under `C:\MHGU-Extract\build`). The textures are BUILT for the gamma configuration;
  under mSRGBEnable = 1 not one would load. (This is the positive control for the switch's value, §3.)

### 2.2 The texture format and its sRGB bit

* MT -> NVN (`0xb07e48` fills `0x211d1f8`, re-read): **7 -> 0x25, 9 -> 0x38, 19 -> 0x42, 20 -> 0x46, 21 ->
  0x43, 22 -> 0x47, 23 -> 0x44, 24 -> 0x48, 25 -> 0x49, 31 -> 0x4b, 32 -> 0x44.** NVN names (API knowledge,
  not the ROM): 0x25 RGBA8, 0x38 RGBA8_SRGB, 0x42 / 0x44 RGBA_DXT1 / DXT5, 0x46 / 0x48 their _SRGB. The ROM
  corroborates which are sRGB on its own: the codes the next table flags (9, 20, 22, 24) are exactly the ones
  mapped to 0x38 / 0x46 / 0x47 / 0x48.
* **sRGB descriptor bit** (texture init `0xb05154`, table at `0xb0537c`, index format - 9; target `0xb05420`
  `mov r3, #0x40000000` -> `+0x1e` word bit 30 = byte `+0x21` bit 6, the 'SRGB' property): set for
  **{9, 20, 22, 24, 35, 36, 40, 47, 49}** only (re-read; tier2-ndraw.md had it). Formats below 9 take
  `0xb05364 bhi 0xb054d4` -> `mov r3, #0`.
* Monster texture formats: `_bm` albedo **19 / 23**, `_bm+a` **25**, `_nm` **31**, misc **7**
  (chunk4: 7 x130, 19 x89, 23 x182, 25 x121, 31 x121; role by file name, this session). **None is
  sRGB-flagged, none maps to an sRGB NVN format.**
* nvnTextureBuilderSetFormat is the only format setter (`0xb057c4`, effects-draw.md); the GOT proc list
  `C:\MHGU-Extract\_nvnprocs.json` (329 procs) has **no `nvnTextureView*` proc at all**, so no sampling view
  re-types a texture. (Completeness of that list is the list-maker's, not re-verified; it does hold
  nvnTextureBuilderSetFormat, the positive control.)

### 2.3 The loader's MiscFlags -> DecodeMode

* rTexture's create (`0xb4ea8c..0xb4eabc`, the type-2 path every monster `.tex` takes) calls `0xb060d0` with
  `[sp+4]` = format (`ubfx r0, [header+8]... ,#8,#8`) and `[sp+0xc]` = **0**; `0xb060d0` forwards them as
  `[sp+0xc]`, `[sp+0x10]` to `0xb05154` (`0xb06150..0xb0615c`), which stores `+0x28 = format` and **`+0x2c =
  MiscFlags = 0`** (`0xb05188`, `0xb0518c`). Re-traced this session.
* Default DecodeMode when none is given (`0xb05224 tst ip, #0xff000`; jump table `0xb0525c`, index format -
  15, re-read): 15 -> 0xa, 18 / 25 -> 4, 30 / 31 -> 2, 32 / 35 -> 8, 33 / 36 -> 9, 37 -> 0xf, 41 -> 0x14,
  42 -> 0x15, 43 -> 0x16, 47 -> 0x18; **19, 23 (and 7, below the table) get none: DecodeMode 0**.
* `+0xc = (flags >> 12) & 0xff` (`0xb0544c`) is what every texture-slot key ORs in (effects-color.md §1.3),
  so the decode is a shader-key choice baked into the precompiled program.

### 2.4 What a DecodeMode does -- the part not read

The decode snippets the GLSL generator would emit sit at `rodata 0x157a879..0x157b46b` and include the
textbook sRGB decode (`0x157a895`, threshold 0.04045), BC5 / DXT5nm normal reconstructions, YCbCr -> RGB
with and without `pow(.., 2.2)`, HDR packings. **No code references them** (PC-relative xref,
`efx/agents/color-scratch/xref2.py`, 0 hits for eight of them -- the effects lane found the same): on NX the
programs come precompiled in `sa\NX\root.arc` (an SPK of Maxwell binaries, no names), so the mode -> snippet
map is not readable here. That DecodeMode 0 is "no decode" is **INFERRED**: it is the value the loader
leaves when nothing asks for one, the sRGB-flagged formats are the engine's way to decode sRGB in hardware,
and the albedo formats carry neither. The non-zero modes the monster textures DO get are 4 (`_bm+a`, BC4) and
2 (`_nm`, BC5) -- data maps, not colour.

### 2.5 The model program (AppShaderPackage.mfx, `mfxprog.py`)

    PS_MaterialStd:  mc = createMaterialContext(I); ... mc = FAlbedo(mc); ... mc = FLighting(mc);
                     mc = FDiffuse(mc); mc = FSpecular(mc); mc.diffuse += FEmission(mc);
                     mc = FDistortion(mc); return FFinalCombiner(mc);
    FFinalCombiner:  color = float4(mc.albedo * mc.diffuse + mc.specular * mc.fresnel, a); fog; FColorModifier (identity)
    FAlbedoMap:      mc.albedo = sample(tAlbedoMap).rgb * $Globals.fAlbedoColor
    FAlbedoMapConstant: v = FConstantColor(mc) * fConstantColor; v.xyz = FConstantOutput(mc, v.xyz); albedo = tex.rgb * v
    FEmissionConstant: return $Globals.fEmissionColor
    createMaterialContext: mc.vertex_color = I.vcolor.xyz      (VS_MaterialStd: O.vcolor = FLinearColor(I.vcolor) * instance_color)

No decode or encode anywhere in that chain. The package does carry a linear workflow, every piece of it
a VARIANT that this game does not select:

| function | body | who selects it |
|---|---|---|
| `FConstantOutput` (base) | per-channel sRGB decode, threshold **0.03928** | no monster material (all 101 MapConstant ones select `Lite`) |
| `FConstantOutputLite` | identity | 101 monster materials (`docs/materials.json` feat `constantOutput: 'Lite'`) |
| `FDiffuseConstantSRGB*` (4 records) | `pow(fDiffuseColor, 2.2)` | no monster material (`diffuse` is False on 468, VertexColorPLS on 1) |
| `FLinearColorSRGB` | `pow(c, 2.2)` | the engine, only when mSRGBEnable (§2.1) |
| `FOutputEncodeSRGB*` (5) | `encodeSRGB` (1.055 pow(1/2.4) - 0.055) | only via a target with EncodeMode 5..9; the window RTV gets 5 only when mSRGBEnable |
| `FFilterColorCorrectVolumeSRGB` | encode -> LUT -> decode | a stage filter (not on a monster) |
| `FDegamma` / `FYUVDecoder` | sRGB decode of decoded movie YUV | movie playback |

The model's target: passes 0xc..0x11 -> RTMain (RGBA8 UNORM, EncodeMode 1 = `FOutputEncodeRCRGB`, x0.5 then
x2.0 at the tone map), 0x15 -> RTPost (UNORM, none); effects-color.md §1-§4. Which pass the monster model
uses is **NR** -- both are UNORM with no curve, so it does not change the colour-space answer (only the
2.0 headroom before the final clamp).

## 3. Controls

1. **The switch's value, independently of the constructor.** The texture loader accepts `0x80a0` only when
   mSRGBEnable = 0 (§2.1); every shipped monster texture is `0x80a0`. If the read of `0xbb9dfc` were wrong,
   the game could not load its own textures.
2. **The reader sees an sRGB step when there is one.** The same `mfxprog.py` print shows `FConstantOutput`,
   `decodeSRGB`, `encodeSRGB`, `FLinearColorSRGB`, `FDiffuseConstantSRGB` as the standard curves; it shows
   FAlbedoMap / FEmissionConstant / FFinalCombiner / createMaterialContext with none. A census that can see
   `Lite` would see the decode base; it finds it on 0 materials.
3. **On a look Raven has already judged.** Crimson Fatalis `em013_01` (`XfB_N__E_m01_body`, `_leg`,
   `XfBAN__E0__m50_wing`, `__m01_body_alpha`): fAlbedoColor = fDiffuseColor = (1, 1, 1), the Angry clip holds
   fEmissionColor 0.2. Game (§2.5): `out = t x (diffuse + 0.2)`; on an unlit black-and-lava texel this is
   `0.2 t` in display values. Viewer, emission read raw (before 2026-09-11): `encode(decode(t) x 0.2)` ~
   `0.48 t` -> "whited out". Viewer, emission read as sRGB (since): `encode(decode(t) x decode(0.2))` ~ `0.2 t`
   -> accepted ("true black", 2026-09-12). **The convention Raven passed by eye is what the ROM's gamma-space
   arithmetic predicts**; the evidence it rested on was the look alone, and §2 now supplies the reason. Only
   k = 1 materials were in that judgement, which is why the albedo half never showed.
4. The effects lane applied the same reading (mSRGBEnable 0, UNORM, no encode) to the effect draws on
   2026-09-13 ("a dark red 0.08 showed as 0.31", monster-review.md:3837) and it stood.

## 4. What the viewer would change to follow it

### Option A -- keep the linear renderer, decode every colour constant like a texel (targeted)

Reproduces every PRODUCT the game forms (texel x constant, texel x emission) to within the piecewise-curve
error. Does not reproduce SUMS (lighting + emission, specular added, blending in the fx composer's linear
target), which a linear renderer cannot match exactly.

| file:line | change |
|---|---|
| `docs/render/rom/material.js:191-193` | `mat.color.setRGB(..., THREE.SRGBColorSpace)` (or decode each factor; equal for a power curve) |
| `docs/render/rom/material.js:446` | `uSpecRGB` <- decode(fSpecularColor) |
| `docs/render/material.js:881, 888` | animated fConstantColor / fAlbedoColor / fDiffuseColor: `SRGBColorSpace` |
| `docs/render/material.js:916` | additive emission: decode `v` as :911 does (the albedo + v combine itself is the viewer's, not the ROM's `albedo x (diffuse + E)`) |
| `docs/render/material.js:953` | fAlbedoBlendColor `.rgb` decoded where it tints (Modulate / Add); `.a` stays raw (it is a lerp factor, rom/shader.js:349) -- a gamma-space lerp cannot be reproduced exactly in linear |
| `docs/render/material.js:942, 974` | fReflectiveColor / fSpecularColor: decode before averaging / taking luma |
| the static uExtTint / fReflectiveColor writers | rom/shader.js:269, monster.js:9409, specular.js's fReflectiveColor use -- same rule |
| `docs/render/material.js:145, 502, 528-530` | legacy path (ROM core off) -- only if it is to stay an A/B baseline of the same space |

Unchanged: constants of exactly 0 or 1 (decode is the identity there), textures, output encode, emission
on the lit path (already decoded).

**Blast radius, from `docs/materials.json`:**

* static `fAlbedoColor x fDiffuseColor x fConstantColor` neither 1 nor 0: **122 materials on 72 model
  entries** (001_02, 002_02, 010_00, 011_00, 013_02, 014_00, 015_00, 016_00, 017_00, 020_00/04, 021_00,
  023_00, 024_00, 027_00, 030_00, 032_04, 033_00, 036_00, 042_00, 043_00/05, 044_00, 045_00/04, 046_00,
  047_00, 049_00, 050_00, 055_00, 056_00, 057_00/04, 058_00, 061_00/04, 062_00, 063_00/05, 065_00, 067_00,
  068_00, 069_00, 071_00/05, 072_00, 079_00/04, 080_00/04, 081_00/04, 082_00/04, 084_00, 086_00, 087_00,
  ems 022_00, 023_00, plus their tails); they DARKEN / saturate toward the authored tint.
* static fSpecularColor neither 1 nor 0: **375 of 570** materials (84 zero and 111 one are unchanged) -- the
  widest change; on the default MeshStandard path the specular is the viewer's own GGX bridge anyway.
* animated tracks with values other than 0 / 1: fAlbedoColor 59 tracks on 13 monsters (003_00 021_00 027_00
  032_00 043_05 050_00 071_00 **080_00 080_04** 082_00 082_04 086_00 088_00); fConstantColor 62 on 13
  (007_04 009_00 013_02 023_00 027_00 033_00 046_00 056_00 058_00 063_05 069_00 081_04 084_00);
  fDiffuseColor 49 on 7 (003_00 023_00 025_00 049_00 050_00 057_04 079_04); fSpecularColor 32 on 6;
  fReflectiveColor 15 on 4; fAlbedoBlendColor 8 on 1. fEmissionColor (84 on 21) is already decoded on the lit
  path; only the additive path (:916) moves.
* The Armor Viewer carries its own copy of material.js (its :1024 / :1243 already decode emission); the same
  rule applies there if ported (armor-viewers-three-way).

### Option B -- render the model in the game's space (exact)

Colour maps `NoColorSpace` (assets.js:76 for colour maps; monster.js:37 cube), constants raw (as now),
`renderer.outputColorSpace` linear / no encode (stage.js:17) and no encode in fx.js's grade pass. Then
lights, emission sums, Fresnel weights and blending all happen in the values the game uses. It changes the
SHADING of every monster (the studio rig's falloff and highlights act on display values), the background and
CSS composition are unaffected, the effect draws already work this way. Whole-app; every monster, and the
Armor Viewer if ported. Not proposed without Raven's look; recorded because it is what "the ROM's space"
means in full.

### Outside the monster model, same reading

`docs/render/area.js`: the vertex colour (baked light, FDiffuseVertexColorPLS) and `fFogColor`
(area.js:168, `LinearSRGBColorSpace`) are written raw into a linear renderer, so they show brighter than
the game's raw values -- the Area lane's call.

## 5. Not read

* What each non-zero DecodeMode does, and that 0 is identity (§2.4) -- the snippet table has no live
  reference; the SPK binaries are not decodable here.
* Which pass (0xc..0x11 vs 0x15) the monster model draws in; irrelevant to the curve.
* The NVN enum names behind 0x25 / 0x38 / 0x42..0x48 (API knowledge; the ROM-internal pairing in §2.2 is the
  read part).
* The 0xb4e900 rTexture path (header type 3), not taken by any monster file.
* The display's own transfer -- outside the ROM; the 8-bit values leave the GPU as stored (effects-color.md §5).

## 6. Traps found on the way

* **Three sRGB-decode thresholds in one package.** `FDegamma` uses **0.0031308** (the ENCODE threshold --
  the ROM's slip), `decodeSRGB` / `FConstantOutput` use **0.03928**, the generator snippet `0x157a895` uses
  **0.04045**. chunk5-shaders.md Part 9 wrote FDegamma as `c <= 0.04045` from the formula, not the literal
  pool (Part 18 has 0.0031308). Read the pool; do not correct one against another.
* `efx/shader/mfxprog.py` imports `_mfxtree` / `_mfxstruct` from `E:\offline\root`, gone with the SD card:
  run it with `PYTHONPATH=C:\MHGU-RE\offline\root`. A whole-package print (2,816 functions) takes about a
  minute and is the fastest way to find every caller of a helper.
