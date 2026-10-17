# Agnaktor (em049_00) -- is the cooled lava's soft glow ROM accurate?

Research agent, 2026-10-17, for Raven: "Agnaktor: Double check the cooled lava effect to ensure the soft glow it has
currently is ROM accurate". Builds on `dev/em049-heat.md` (the heat machine, §3 / §4b) -- re-read here where it
matters. **R** = the consuming instruction / program was read; **I** = inferred; **NR** = not read; **M** = measured in
the headless viewer (scratch `cooled049.mjs`, `cooled049b.mjs`, `cooled049c.mjs` through `run-check.mjs` /
`run_locked.sh`; outputs `cooled049b.out`, `cooled049c.out` / `d.out` (`?space=game`), `cooled049e.out`).

**Answer: yes.** The glow is the ROM's own state-0 material clip, `cool_Loop`, on the six lava overlays, with the
ROM's values, curve and combine. The viewer makes it from ROM data, not from a default or a fallback. One small
difference: the pulse's PHASE (§4). Glacial Agnaktor is not in this game (§5).

## 1. What makes the glow in the viewer (M)

Heated off, every region settled (all six machines at stage 0, clip `null`, so the rest clip plays):

| item | value | st |
|---|---|---|
| meshes drawing | the 17 heated-group overlay parts 4, 6, 8 (m04 head), 9, 11 (m06 back), 12, 14 (m05 chest), 15, 17, 21, 23 (m02 legs), 18, 20, 24, 26 (m01 legs), 27, 29 (m03 tail), all visible. The rock under them is the heated groups' rock (in play the heated groups are always drawn) | M |
| material | `MeshStandardMaterial` (the lit class: the MRL's technique is MaterialStd), CustomBlending SRC_ALPHA / ONE / ADD (BSAddAlpha), no depth write, bias -512, texel alpha in the blend factor (`srcAlpha`, uAlphaCut 1) | M |
| clip | `cool_Loop` on all six: monster.js ROM_STAGE_CLIPS em049_00 `rest: 'cool_Loop'` -> `docs/render/monster.js:11147` (under the comment "a NAMED rest clip -- Agnaktor's cool_Loop") returns it as a bare index | M / code |
| opacity per frame | a triangle **0 -> 0.0998 (f ~60) -> 0.0002 (f ~120)**, period 120 material frames = 2.0 s at MAT_FPS 60 (301 samples over 2.3 s, identical on all six) -- **it pulses** | M |
| colour | 1.0 (`cool_Loop`'s fDiffuseColor 1, 1, 1; molten shows 0.1213 = 0.383 decoded) | M |
| emissive | (1, 1, 1) x texel (`emissiveFromMap` -> `totalEmissiveRadiance *= gBase`): the material's static fEmissionColor, glob 17 | M / code |
| specular / reflection | uSpecRGB 0 (fSpecularColor 0), uReflRGB 0 (fReflectiveColor 0), envAmt 0 | M |
| what it adds (1280x800, paused pose, framed) | at the peak: mean +42.5 summed RGB (~14 per channel, max 95) over 25.8 k px, on rock that averages 68.7. The lit term alone gives +37.7 and the emission alone +36.4, so the two count about equally. At the trough: **0 px**. Molten (maguma_Loop f0): +361. `?space=game` (Option B): peak +47.3, trough 0 | M |
| fallbacks | `setClipFallback` is off by default (`let clipFallback = false`, `monster.js:10006`) and is never reached for this material: the stage machine's branch returns first (`const machine = stage && rom ...`, `monster.js:11111..11149`). No viewer default emission (the 1.0 is the MRL's). The heated clip is not left on: stage 0, colour 1 | M / code |
| death clip L3 M12, all cooled | coolDraw on, **no lava part drawn** (the cooled groups are rock alone), so no glow | M |

So the soft glow = `cool_Loop`'s fTransparency (0..0.1) x texel alpha on an additive overlay whose colour is
texel x (lighting x 1.0 + emission 1.0).

## 2. What the game does for cooled lava (R unless marked)

| item | read | st |
|---|---|---|
| state 0's clip | `0xec22c8`: `ldrh [E+0xcac0+2k]`, jump table `0xec2300` (offsets 0x10 / 0x74 / 0x1c / 0x28) -> state 0 at `0xec2310`: `r1 = "cool_Loop"` (literal `0xec2524` -> rodata `0x1581559`), `bl 0xb08b44` (findMatClipByName) at `0xec2380`, index to `E+0xcb58+4k` (`0xec238c`). States 2 / 3 / 1 name `maguma_Loop` / `maguma_Change` (or Loop) / `maguma_End` (`0xec231c`, `0xec2328..0xec2370`, `0xec2374`; strings resolved) | R |
| put in the material | `0xec24c4..0xec2520`: `0xb0cff0(mat, 0)` = `ldrsh [mat+0x50]` (slot 0's clip); only if it differs from `E+0xcb58+4k`, `0xb09ae8(mat, s, idx)` for **s = 0, 1, 2, 3**: `[mat+8s+0x50] = (u16)idx`, `[mat+8s+0x54] = 0` -- **the slot time is zeroed** (`0xb09af4` / `0xb09af8`) | R |
| findMatClipByName `0xb08b44` | CRC chain `0x7c8ed8(name, ~0)`; walks `[ctl+0x10]` = {count, entry ptrs}; match on `[entry+0xc]` -> index, else -1 | R |
| when state 0 holds | from spawn (`vt+0x24` / ctor clear the states, em049-heat §2f) and once `maguma_End`'s timer passes 180 half-steps (`0xec2428..0xec2454`). The clip is chosen from the state at the TOP of the call, so `cool_Loop` goes in on the call after the 1 -> 0 store, at slot time 0 | R |
| in play the overlay is drawn | `0xec1cec`: heated group unless `vt+0x3f4` = 1 and state 0 (em049-heat §4a) | R (prior) |
| `cool_Loop` data (all six `XfB_0__m0N_lavNN`, identical) | 120 frames, loop, not auto; **fTransparency** (interp 1, linear) keys 0: 0.0, 60: 0.1, 120: 0.0; **fDiffuseColor** (cols 3, so only rgb is written) 1.0, 1.0, 1.0 all three keys | R (data, docs/materials.json from the .mrl) |
| the lava's shader | feature set 9: FAlbedoMap (UVPrimary), FTransparencyAlpha, FDiffuse family at its BASE (`diffuse: False`), FAmbientSH, FSpecularMap, FReflectGlobalCubeMap, FFresnelSchlick, FEmissionConstant; glob 17: fAlbedoColor 1, **fEmissionColor 1, 1, 1**, fSpecularColor 0; cbm 0: fDiffuseColor 1, fTransparency 1, fReflectiveColor 0. Technique MaterialStd (lit) | R (data) |
| the combine (`AppShaderPackage.mfx`, `efx/shader/mfxprog.py`) | `PS_MaterialStd`: FAlbedo -> FTransparency -> FLighting -> **FDiffuse** -> FSpecular -> `mc.diffuse += FEmission` -> FFinalCombiner. `FDiffuse` (base) = `(mc.diffuse + FAmbient(mc)) * CBMaterial.fDiffuseColor * mc.occlusion`; `FEmissionConstant` = `$Globals.fEmissionColor`; `FAlbedoMap`: `albedo = tex.rgb * fAlbedoColor; transparency *= tex.a`; `FTransparencyAlpha` = `transparency * CBMaterial.fTransparency`; `FSpecularMap` = `(spec * fSpecularColor + FReflect) * map` (0 here: both constants 0); `FFinalCombiner`: `rgb = albedo * diffuse + specular * fresnel`, `a = transparency * fGlobalTransparency * global_transparency` | R (program) |
| "base runs when unselected" | `FDiffuse`'s family body is what runs with `diffuse: False`: the same rule gives FEmission 0, FReflect 0, FTransparency 1 to unselected materials, which is what the whole viewer already relies on | I (corroborated) |
| blend | BSAddAlpha = SRC_ALPHA / ONE / ADD (rom/state.js, the state record) | R (prior, code comment) |
| alpha test | fb `0x919c0000`: bit 20 on, function (bits 21..23) 4 = GREATER, reference byte 0 -> discards only alpha 0 (rom/material.js's `0xb42ed4` read). Changes nothing visible on an additive layer | R (prior) |
| vertex colour | `mc.transparency` starts at `I.vcolor.w` (createMaterialContext). The glb has no COLOR_0 on any lava primitive; whether the .mod format carries a colour lane, and what the shader gets without one, NOT READ | NR |
| clip rate | 120 clip frames; the wall-clock rate is the library-wide open question (`material.js` MAT_FPS note: `material[+0x20]` unread) | NR |

**So the game's cooled lava does glow**: per pixel it ADDS `tex.rgb x ((lights + SH) x 1.0 x occlusion + 1.0) x tex.a x
fTransparency`, fTransparency running 0 -> 0.1 -> 0 over 120 frames, looping, from frame 0 when the region cools. Peak
about a tenth of the texel (plus the lighting share), trough nothing: a soft pulse, never off for long.

## 3. Comparison

| item | ROM | viewer | match |
|---|---|---|---|
| clip in state 0 | `cool_Loop` (`0xec2310`) | `cool_Loop` (ROM_STAGE_CLIPS rest) | yes (R / M) |
| fTransparency curve | 0 -> 0.1 (f60) -> 0 (f120), linear, loop | 0 -> 0.0998 -> 0, period 120 | yes (M) |
| fDiffuseColor | 1, 1, 1 -> scales lights + ambient only | colour 1.0 -> scales the lit term only (emission is x texel, not x colour) | yes (code: material.js:901, :353) |
| emission | fEmissionColor 1, added to diffuse, x albedo | emissive 1 x texel | yes |
| alpha | tex.a x fTransparency, SRC_ALPHA / ONE | opacity x texel.a, CustomBlending SRC_ALPHA / ONE | yes |
| specular | 0 | 0 | yes |
| lighting share | stage lights + SH | the viewer's rig, GGX by default | global approximation, not lava-specific |
| colour space | gamma, blend on raw values | Option A (linear blend) by default; `?space=game` close to the game: peak +47.3 vs +42.5 | global, not lava-specific |
| **phase** | slot time zeroed when `cool_Loop` goes in (`0xb09af8`) -> starts at f0 (alpha 0) when the region cools | bare index -> time = page clock (`performance.now()`), so it starts wherever the page clock is in its 120-frame cycle | **no** (M: one run caught the hand-over at opacity 0.0652 on the first `cool_Loop` frame, after maguma_End's ~0) |

## 4. The one deviation and its fix (not applied: docs/ is the Viewer agent's)

`docs/render/monster.js:11147` (line numbers as of 2026-10-17; anchor: the comment "a NAMED rest clip -- Agnaktor's cool_Loop"; stepMatAnim's picker, the stage machine branch with `!machine.clip`) returns the named
rest clip as a BARE index, which stepMaterialAnim (`material.js:1038`) plays at t0 = 0, the page clock. The ROM puts
`cool_Loop` with its slot time zeroed (`0xb09ae8`: `[mat+8s+0x54] = 0`) only when the slot's clip changes (`0xb0cff0`
compare, `0xec24c4..0xec24ec`), i.e. once when the region enters state 0. So at the end of a cool-down the viewer can
jump from maguma_End's last frame (alpha ~0) straight to any point of the pulse, up to its 0.1 peak, in one frame.

Fix, in ROM terms: **start `cool_Loop` at frame 0 on the frame the region enters state 0.** The machine already
records that second (`s.restT0 = tSec` at `monster.js:10388`, the line Akantor's layered branch reads). So line 11147
should return `[[idx, machine.cycled ? machine.restT0 : <the machine's first step>]]` instead of `idx`. A machine that
opens cooled has no `restT0`; the game's equivalent is the first heat call after spawn, so the machine's first step is
the closest stand-in. Magnitude, period and curve stay as they are.

Not a deviation: the size of the glow. It comes from the ROM's own constants through the ROM's own combine. What
differs from the game is the viewer's global lighting rig and colour space, which affect every lit material, not this
effect.

## 5. Glacial Agnaktor

Not in MHGU. `romfs\nativeNX\arc\enemy` has `em049_00.arc` and no other `em049_*`, where the variants of other
monsters are their own arcs (control: `em001_02` / `em001_04`, `em002_02` / `em002_04`; 26 `_0[1-9]` arcs in
the folder). docs/materials.json has `em/049_00` and its tail only (R, file listing).

## 6. Corrections / cautions for the record

* em049-heat.md §3 says the clip is put "in slot 0..3": exact. All four slots get the same index and time 0
  (`0xec24ec`, `0xec24fc`, `0xec250c`, the tail call at `0xec2520`).
* rom/material.js:377 and the materials.json label `diffuse: False` read as "no diffuse". They mean the FDiffuse family
  at its base body, which RUNS and multiplies the lighting by fDiffuseColor (§2). The viewer's lit path already
  behaves this way. The wording is the trap, not the code.
