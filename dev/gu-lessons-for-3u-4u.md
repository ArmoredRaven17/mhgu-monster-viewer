# What GU's rendering work can give the 3U and 4U monster viewers

Written 2026-10-08 by the Monster Viewer General Agent (the session that keeps the three viewers in step).
Sources: the GU viewer's render code and notes, the task board's GU / 3U / 4U sections, and a read of both
other viewers (3U `C:\MH3U-Extract\MH3U-Monster-Viewer`, 4U `C:\Coding Repos\mh4u-monster-viewer`).
Paths without a drive are in the GU viewer. Measurements marked **measured** were run on 2026-10-08 against
the shipped files. Everything else is the GU lesson plus a note on whether it carries over. Anything marked
*inferred* has not been read from the 3DS data.

Nothing here has been applied to either app. This note only hands the findings over.


## The headline

3U and 4U draw with **GU's own material code, unchanged**. `material.js`, `materials-db.js`, `pose.js`,
`skeleton.js`, `stage.js`, `fx.js` and `lens.js` are byte-identical to GU HEAD in 3U. 4U's `docs/render/`
is byte-identical to 3U's. But their `materials.json` sends only `t.albedo` and the blend index `s`
(and `extendMap` in 4U). So every ROM-driven branch that code already has sits idle:

| GU path, already in the 3U/4U `material.js` | Needs field | 3U / 4U ship it? |
|---|---|---|
| Depth write from the depth-stencil record (`material.js:93-101`) | `state.ds` | no: blend layers fall back to no depth write |
| Depth bias, -32 per RSMeshBias step (`material.js:162-170`) | `state.bias` | no: decals z-fight; em079's face_sub and body_add are `RSMeshBias10`, Khezu's blood `RSMeshBias5` |
| Back-face cull (`material.js:434`) | `state.cull` | no: everything is DoubleSide |
| Alpha test (`materials-db.js:64-65`) | `fb` bit 20 | no: no cutouts anywhere (3U's 64 and 4U's `XfBA*` cards) |
| Texture alpha on blend layers (`uAlphaCut`, `material.js:516-525`) | `feat.transp` | no: 3U's 3 and 4U's 27 blend materials draw solid. The 3U Armor Viewer's `render/piece.js:45` already has the fix |
| Unlit technique (`monster.js` → `cls !== 'Std'`) | `cls` | no: eyes and Constant layers take the lit path |
| Overlay shading (`romOverlayShade`, `material.js:135-160`) | `glob` / `cbm` / `feat` | no: every additive layer draws at full strength |

**The cheapest big win is data, not code.** Both apps' `mrl.py` keep the *first* `BS*` record and drop the
rest. The state names are MT-wide: 4U's own em079 shows `DSZTest`, `RSMeshBias10`, `BSRevSubAlpha` and a
second `BSMul`. Export the DS and RS records under GU's names, and the existing code picks them up.

Lessons that come with it:
- **Depth write comes from the DS record, never from the blend.** In GU they disagree on 54 monster rows (D3).
- **Decide alpha from the feature word plus the blend state, never from the `XfBA` name prefix.** In GU the
  name and the feature word disagree on 66 materials, both ways (C3). Kirin's hair drew as solid cards and
  Najarala got black patches.
- **The 3DS alpha test has to be READ for the 3DS.** GU's `fb` bit 20 / func 21-23 / ref byte is NVN state
  packed in the Switch MRL. The PICA has its own fixed-function alpha test, and the 3DS MRL v0x20 encodes it
  somewhere unread. Do not reuse GU's bit positions (rule 2 in `C:\MHGU-Extract\CLAUDE.md`).
- **Do not switch the alpha test on library-wide.** In GU it went on monster by monster, after Raven looked:
  Amatsu, Nibelsnarf, Astalos, Nakarkos, Savage (`ALPHA_TEST_DEFAULT_REFS`, `rom/shader.js:129`). A
  wholesale switch regressed monsters already judged (the cause-J holes through Thunderlord, then Rath
  quills and Narga fur "show the entire mesh", C2).


## By app

### Both 3U and 4U

1. **Hide the overlay layers by default, as GU does.** GU marks every `add` and `revsub` mesh
   `userData.effect` and the Parts panel turns them off together (`docs/render/monster.js:9034-9042`). This
   was Raven's call on Khezu, 2026-09-04: "covered in, what I believe is a mesh". Neither 3U nor 4U has the
   class (grep finds no `userData.effect`), so:
   - **3U:** all 64 additive layers are always drawn, including the eye rays on Barioth (`m01_ray`), Great
     Baggi, Lagiacrus (`m01_ray`, `m02_thornray`), Royal Ludroth and Gobul.
   - **4U:** 85 additive layers (about 30 Frenzy "Virus" layers, the `m01_angry` rage veins, em079's
     `body_add` chest glow) and all 3 revsub layers are always drawn.

   This is page-only and works without any material decode.

2. **4U em079's black blobs are probably this.** GU's Old Fatalis (`em/013_02`) carries the same two
   materials, `XfB__m01_face_sub` (revsub) and `XfBA0__m02_body_add` (add).
   - In GU, face_sub is a `Constant`-class rage overlay.
   - Its only clips are `Angry_Start` (constant alpha 0 → 1 over 90 frames) and `Angry_End` (1 → 0).
   - Neither clip is auto-play, so at rest the game is not showing it.
   - Inferred for 4U: it is a rage-state darkening layer drawn at full strength. Hiding the overlay class
     (item 1) should clear it.

   Two follow-ups once it is drawn on purpose:
   - its `RSMeshBias10` (above);
   - 4U's revsub sets no separate alpha equation, so it also subtracts from the canvas alpha. GU keeps
     alpha coverage-preserving for all four blend states (D2, `rom/state.js`).

3. **Barioth's eye glow (3U).** GU built it in `docs/render/eye-glow.js`: an MH-Tri easter egg in GU, but
   inferred to be a real feature in 3U (the caves are dark).
   - Each face state has its own eyeball plus an additive `XfB__m01_ray`.
   - The ray must follow **its own** eyeball's visibility.
   - The calm brow clips the ray; GU uses a hand-set 0.1 view-space shift, which is explicitly NOT
     ROM-faithful.

   3U's em005 has `XfB__m01_ray` (add), drawn always today.

4. **Once material animation arrives** (neither app runs it yet):
   - *Clip names fail in four shapes.* Case-only misses (`angry_start`), the ROM's own typo
     (`Nomal_Repeat`), hash-only names, and clips in no list. Select by hash, case-insensitively, with the
     auto bit as the fallback (E1).
   - *A shared texture object carries one material's UV scroll onto every material on that atlas.* This
     was Thunderlord Zinogre "loads in visually broken at times". Clone the map per material that animates
     its UVs (C6).
   - *Write colour constants in sRGB* (`setRGB(..., THREE.SRGBColorSpace)`), or a constant of 0.2 comes out
     about 6× brighter than a texel of 0.2. This was Crimson's rage "whited out" (C9).
   - *"Renders white" usually means a static white MapConstant whose real colour lives only in a clip*: check
     that first (D7).
   - *Do not change a global clip rate under monsters already judged.* `MAT_FPS` 60 → 30 regressed
     Grimclaw (E4).

5. **Honour the `.tex` mip count.** Five GU textures ship one level and three.js built a chain; Savage's neck
   glow went "blobby" (C4, `assets.js:21-48`). 3U removed GU's `ROM_NO_MIPMAP` list. The 3DS `.tex` header
   carries a level count too (inferred: check the field).

6. **Skins: measured, mostly clean.** Census over every shipped model (script in this session's scratchpad,
   `skin_census.py`):
   - Unskinned primitives inside a skinned mesh (GU A3): none in either app.
   - `JOINTS_1` / more than four influences (A2): none in either app.
   - Weights not summing to 1: 67,518 vertices (3U) and 61,513 (4U). Every one is an all-zero row that **no
     index references**: buffer filler, harmless. Measured on em001/em007 (3U) and em032/em079 (4U).
   - **Open:** GU's padding leak (A1, `C:\MHGU-Extract\fix-skin-weights.py`) cannot be ruled out without the
     3DS `.mod` weights. 3U has 2,116 and 4U 6,482 vertices with a 1-8/255 weight on a slot; 4U em034/em035
     have 13%. Some are authored. The way to tell is GU's method: decode the ROM's weights and keep its zero
     slots at zero. The symptom to watch for is a head or neck drifting sideways in motion while the bind
     pose is right (GU's Crimson Fatalis).

7. **Seams that open only in motion.** If Raven reports gaps that the bind pose does not show, use GU's
   tools:
   - `dev/weld-seam-skins.py` (format-generic glTF) and `dev/seam-skin-sweep.py` (with a control).
   - Always use `--max-shift 0.25`, or 0.20 as on Alatreon, never uncapped. The uncapped weld merged Kecha
     Wacha's ears, crossed Ahtal-Ka's claws and stretched Valstrax's wing blades (A5/A6).
   - A fix and its check must share one definition of "the same vertex" (quantised vs denormalised).

### 4U only

8. **The uv2 meshes are GU's second-albedo-map veins.**
   - The repack drops uv2 on Tigrex / Brute Tigrex `m01_angry`, Akantor `kekkan`, Khezu / Red Khezu
     `m03_blood` and Molten Tigrex.
   - Those are the GU monsters whose rage veins need `tAlbedoBlendMap` through UV2 (D10,
     `rom/shader.js:259-380`). Blend modes there: Modulate = multiply, Add = saturate, MapBlend = lerp by
     `fAlbedoBlendColor.a`.
   - If 4U ever draws them, keep uv2 in the repack (repack to a known 44-byte format rather than cutting
     it). Until then, item 1 hides them anyway.
   - Watch the three.js program-cache trap: an `onBeforeCompile` edit is invisible to the cache key, so
     use `customProgramCacheKey`.
   - Unmodulated, Khezu's revsub vein layer subtracts grey and reads black.

9. **Savage Deviljho's glow probably does not need the lost vertex colour.**
   - GU's Savage (`em043_05`) carries `COLOR_0` on the same mesh, Group[12] `XfBA_IW_1__m00`, but GU's
     renderer never reads vertex colour on a monster material. `vertexColors` appears only on the hit-zone
     heat map (`monster.js:12753`).
   - Its neck glow passed Raven's look from the material alone: map alpha × MapConstant alpha, then the
     ROM alpha test GREATER 50, plus no mip chain (commit `068d6f0`; `rom/shader.js:86-99`). Before that it
     was "a red blob".
   - Inferred for 4U: the same material read the same way should give the same look. Part 12 is also
     state-gated (`[12,7,1,1,0]`) and drawn always today.

10. **Clips that end early (GU H1). Measured: 11 of 5,157 comparable 4U clips.** `lmt_to_gltf` ends a clip
    at its last key and never pads to the LMT frame count. Split `_start`/`_loop` clips were not compared.
    - Seven 3-frame clips come out zero-length:
      - em016_3 Motion[19]
      - em033_2 Motion[9]
      - em038_4 Motion[1]
      - em058_3 Motion[19]
      - em107_0 Motion[19]
      - em109_0 Motion[19]
      - em116_2 Motion[9]
    - Four lose a held tail:
      - em025_2 and em094_2 Motion[98]: end at frame 75 of 227
      - em047_2 Motion[99]: 295 of 337
      - em050_2 Motion[1]: 167 of 219
    - Fix: hold the last key to (frames − 1)/60 at build time.
    - Separately, 11 LMT slots produce no clip at all. These match the 11 `layersDropped`.
    - 3U: 0 of 3,738, because `lmt_fix` writes every frame.

11. **Layer motions (GU H6).** In GU only Valstrax, Nakarkos and Ahtal-Neset use a second motion slot, and
    GU has not built it either. A later slot writes only the joints it has tracks for; the plan was to merge
    at clip-build time. 4U's dropped 1-2-bone motions (bones 72/73/14/74/75) are the analogue. Low priority
    until Raven asks for jaw or eye motion.

12. **The Fatalis eyes:** on GU's Kirin and Fatalis line, the switchable mesh is the **eyelid**, so an eye
    material does not mean an open eye (F). Worth a look on em077/078/079/117 if the eyes read odd.

### 3U only

13. **Blend materials ignore texture alpha** (board, MH3U section): see the table above. The fix is already
    in the 3U Armor Viewer's `render/piece.js:45`.

14. **Wing tears, "mode 6".** GU found the same mechanism. Wing tears are not meshes: they are an
    alpha-reference rewrite on break (Alatreon 20 → 150, the Rath line 127, Plesioth, Chameleos), a
    texture clip (`Wing_damage` on Gore), or a material swap (Shagaru): `ROM_BREAK_ALPHA` /
    `ROM_BREAK_CLIP` / `ROM_BREAK_SWAP`, `monster.js:805-1000` (G4). Inferred: 3U's mode 6 + value is the
    alpha-reference form. It needs the alpha test exported first (above).


## Already in step (no action)

- Lossless RGB under alpha-0 texels (`exact=True` on WebP; GU C1): both builds have it.
- Animated bone scale and the `_s` leaves (H3): same `pose.js`.
- Ground Lowest Bone off for monsters; travel plays and the camera follows it (H5): both defaults match GU.
- Near plane = distance / 200 (D4): both apps have it.
- Proxy meshes hidden by mesh-table bit 0 (A4): both builds.
- Borrowed lists renamed by global bone id (A8). **4U is ahead of GU here:** `retarget_lists` also renames
  the `_s` scale leaves, which GU's `lists[].remap` omits for 18 borrowers. Worth porting back to GU.
- 3U's depth-of-field raycast fix (stale skinned bounds) is still open on GU (board).


## How GU worked (the parts that saved or cost the most)

- **Correct is decided on screen, by Raven.** Exported, wired or self-consistent is not a sign-off; Valstrax,
  Alatreon and Seltas were signed on the mechanism and reopened on appearance.
- **Put a per-monster default behind Raven's look**, not a library-wide switch.
- **Census before decode.** Most "one monster" bugs were one shared mechanism used by few materials (revsub
  is 3 materials in each game).
- **Every before/after diff needs a no-op control that reads 0.** A proof built on (0,0,0) offsets could not
  fail.
- **Pipeline hygiene:**
  - skip-if-exists conversion hid fixes behind stale `.glb` files;
  - cache-bust asset fetches;
  - a build with an empty job list must refuse to write.
