// THE FEATURE WORD, APPLIED.
//
// This file used to be a whole hand-written shader program. It is not any more, and that is the
// point: MHGU's shading lives in the MFX expression tree, and until that tree's operand encoding is
// read (build/notes/chunk5-shaders.md -- grammar read, operands not, three hypotheses killed) any
// lighting model written here is new code rather than a translation of the ROM.
//
// What IS readable, and what this file applies, is the feature word: which features a material
// selects, and what the ROM's own Japanese description says each one does. Those descriptions are
// primary source and are quoted at each site. Everything else -- diffuse, specular, ambient, the
// sphere map, the dye machinery -- stays in the shared material.js, unchanged.
import * as THREE from 'three';

// Chain an onBeforeCompile without clobbering whatever material.js already installed.
function chain(mat, fn){
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, renderer) => { if (prev) prev(sh, renderer); fn(sh, renderer); };
  mat.needsUpdate = true;
}
// THREE.JS CACHES PROGRAMS ON THE MATERIAL'S PARAMETERS ALONE, and an onBeforeCompile edit is
// INVISIBLE to that key. Two materials whose parameters match therefore share ONE compiled program,
// and whichever compiled FIRST decides whose injected GLSL every one of them runs.
//
// Measured on Grimclaw, 2026-09-10. XfB__m02_eye (no second map) and XfBA_AW_0__m61_angry_blood
// (TypeExtendModulate) both came back on program id 1, and the source the GPU actually compiled --
// read with gl.getShaderSource on the attached shader, NOT the sh.fragmentShader handed to
// onBeforeCompile -- held the ext uniform DECLARATIONS with not one `texture2D( uExtMap )` in it.
// The eye's shader was running on the vein material. So uExtMap, uExtTint, uExtMode and uExtXf all
// read back correctly bound, and changing any of them moved exactly ZERO pixels. That is Raven's
// "the veins are not showing at all, but I can see the lighting effects clearly": the first albedo
// map reaches the screen through the shared program, the second never does. Tigrex escaped it only
// because his equivalent material happened to win its own program.
//
// extendMapMisses() stayed EMPTY through all of it, which is why nothing caught it: the injection
// ran and produced correct GLSL that was then thrown away.
//
// So every injection tags the material, and customProgramCacheKey hands the accumulated tags to
// three.js. Materials with the same set of injections still share a program; materials with
// different sets no longer can.
function tagProgram(mat, tag){
  const tags = (mat.userData.progTags || '') + '|' + tag;
  mat.userData.progTags = tags;
  mat.customProgramCacheKey = () => tags;
  mat.needsUpdate = true;
}


// Materials whose second-albedo-map GLSL found no anchor. Empty is the expected state; anything
// here means the injection is being dropped again, which is silent in every other respect.
const extMisses = [];
export function extendMapMisses(){ return extMisses.slice(); }

// THE MapConstant ALPHA, AS THE FUNCTION BODY COMPUTES IT -- a switch, DEFAULT OFF.
//
// The rule below ("alpha fixed" -> the constant's alpha alone) was read from FAlbedoMapConstant's
// DESCRIPTION string and labelled a reading. The function BODY, read as source from the shader package
// (C:\MHGU-Extract\efx\shader\mfxprog.py FAlbedoMapConstant), says otherwise:
//
//     float4 c = sample(tAlbedoMap, SSAlbedoMap, mc.uv_primary);
//     float4 v = FConstantColor(mc);                 // FConstantColorNoVertexColor: float4(1,1,1,1)
//     v.xyz *= $Globals.fConstantColor.xyz;
//     v.xyz = FConstantOutput(mc, v.xyz);            // Lite: pass-through
//     mc.albedo = c.xyz * v.xyz;
//     mc.transparency = (c.w * v.w) * $Globals.fConstantColor.w;
//
// so the TEXTURE's alpha reaches the output, times the constant's. Raven, 2026-09-13, on Nakarkos'
// XfBA1__m01_light (BSBlendAlpha, alpha test GREATER 50): "The blue glow effects are overdrawn, they
// likely need to be moved to a layer or alpha'd out." Its map's alpha averages 65/255 and 52% of it is
// at or below 50, so drawn at the constant's 1.0 every strip covers its whole mesh.
//
// Off by default -- except on ALPHA_ROM_DEFAULT_REFS (Nakarkos, Savage Deviljho), below -- because it
// moves 39 non-opaque MapConstant materials on 30 models at once: Brachydios' slime, Boltreaver's taiden
// layers, Zinogre's lights among them, looks already reviewed.
//   __romMapConstantAlpha(true) / (false) / () -- readback: { on, materials, usingTextureAlpha }
//
// SAVAGE DEVILJHO USED TO BE LEFT OUT of this switch altogether, on or off, as another agent's test case
// (Raven, 2026-09-13, "Ignore anything Savage related"). Raven lifted that for this item, 2026-09-16:
// "The skip was put into place to avoid breaking existing effects while looking over other monsters. You
// can look over it since I wanted to fix it." The fix is its neck glow -- see ALPHA_ROM_DEFAULT_REFS.
//
// MONSTERS WHERE THE ROM'S ALPHA IS ALREADY THE DEFAULT -- BOTH treatments: this switch, and (through
// ALPHA_TEST_DEFAULT_REFS below) the alpha test in rom/material.js. Raven, 2026-09-13, after trying both
// on Nakarkos: "The two tests look better", then "we can apply the two alpha treatments for Nakarkos".
// Keyed by materials.json entry, so the two tentacle models come with the body. Everything else keeps
// its old rule until reviewed.
//
// Savage Deviljho, 2026-09-16. Raven: "Savage Deviljho has an effect that currently renders as a red
// blob, but it should be sharper like Zinorge's charge state." That is its neck glow, part 12,
// XfBA_IW_1__m00: MapConstant, BSBlendAlpha, alpha test GREATER 50 (fb 0x91903200), and a 128x128 flame
// map whose alpha is a soft band (mean 105/255, 39% of texels at or below 50). On the old rule each
// flame card drew as one flat sheet at the constant's alpha, which is the blob. With the map's alpha it
// is flame streaks; with the test on top, only the tongues' cores survive. Measured headless, material
// clock frozen, one change at a time: the glow is the only visible change. body_k (the rage overlay,
// map alpha >= 225) and body_a (GREATER 0) moved 0 pixels. The eye moved about 100 pixels, and that was
// the canvas leak the opaque branch below now closes, not the ROM. The tail model has no MapConstant
// material and no live test; it is listed so it follows the body, as Nakarkos' tentacles do.
export const ALPHA_ROM_DEFAULT_REFS = new Set(['em/084_00', 'em/084_00/left', 'em/084_00/right',
                                               'em/043_05', 'em/043_05/tail']);
// MONSTERS THAT TAKE THE ROM ALPHA TEST BY DEFAULT: every entry above, plus those that take the test
// alone, with this switch left on its old rule. Nibelsnarf, 2026-09-16. Its gill cards
// (XfBAN__E1__m02_era, opaque, GREATER 128) were cut only at alpha 0 by the old rule. That drew 39% /
// 35% of the two cards solid where the game discards them. Raven tried __romAlphaTest(true) and
// said: "__romAlphaTest(true) make Nibelsnarf's default". The test also reaches its eye material
// (parts 0 / 4 / 100, GREATER 10), as it did in what he tried.
export const ALPHA_TEST_DEFAULT_REFS = new Set([...ALPHA_ROM_DEFAULT_REFS, 'em/056_00']);
const mapConstMats = new Set();              // { u: uniform holder, ref }
let mapConstAlpha = null;                    // null: per-monster defaults; true / false: every material
export function mapConstantAlphaOn(){ return mapConstAlpha; }
function mapConstFor(ref){
  return mapConstAlpha === null ? ALPHA_ROM_DEFAULT_REFS.has(ref) : mapConstAlpha;
}
export function enableMapConstantAlpha(on){
  mapConstAlpha = (on === 'default' || on === null) ? null : !!on;
  let n = 0, lit = 0;
  for (const e of mapConstMats){
    e.u.value = mapConstFor(e.ref) ? 1 : 0;
    n++; if (e.u.value) lit++;
  }
  return { on: mapConstAlpha === null ? 'default' : mapConstAlpha, materials: n, usingTextureAlpha: lit };
}
// Opaque MapConstant materials whose coverage restore (below) found no anchor. Empty is the expected state.
const solidMisses = [];
export function mapConstSolidMisses(){ return solidMisses.slice(); }
if (typeof window !== 'undefined'){
  //   __romMapConstantAlpha()           readback
  //   __romMapConstantAlpha(true/false) every MapConstant material
  //   __romMapConstantAlpha('default')  back to per-monster defaults (Nakarkos and Savage Deviljho on)
  window.__romMapConstantAlpha = on => (on === undefined
    ? { on: mapConstAlpha === null ? 'default' : mapConstAlpha,
        materials: mapConstMats.size,
        usingTextureAlpha: [...mapConstMats].filter(e => e.u.value).length,
        solidAnchorMisses: solidMisses.slice() }
    : enableMapConstantAlpha(on));
}

export function injectFeatures(mat, rom, lit, ref){
  const feat = rom && rom.feat;
  if (!feat) return mat;

  // ---- THE ALPHA RULES, in the ROM's own words -------------------------------------------------
  // FAlbedoMapColorOnly: "アルベドをテクスチャで指定。ただし、アルファ成分は1.0固定。"
  //   -- specify albedo by texture, BUT THE ALPHA COMPONENT IS FIXED AT 1.0.
  // FAlbedoMapConstant:  "アルベドテクスチャを使ってコンスタントカラーも使う(アルファ固定)"
  //   -- use the albedo texture AND the constant colour, ALPHA FIXED.
  // So on these the albedo TEXTURE's alpha must not reach the output.
  //
  // The old path multiplies it in on any material with a transparency feature (material.js sets
  // texAlpha for `ft.transp`, and its shader runs `diffuseColor.a *= mix(1.0, texel.a, uAlphaCut)`).
  // Measured: MapConstant pairs with AlphaConstant on 101 of 101 materials, so all 101 were wrong.
  // MapColorOnly pairs with transp:false on all 173, where the old path already agreed -- checked,
  // and recorded as a negative rather than "fixed".
  const albedo = String(feat.albedo || '');
  const alphaFixed = (albedo === 'MapColorOnly' || albedo === 'MapConstant');
  if (alphaFixed){
    const mapConst = (albedo === 'MapConstant');
    if (lit && mat.userData.u && mat.userData.u.uAlphaCut){
      mat.userData.u.uAlphaCut.value = 0;          // the texel's alpha stops here
      // ...unless the MapConstant switch is on, which lets it back in (see above)
      if (mapConst){
        const u = mat.userData.u.uAlphaCut;
        mapConstMats.add({ u, ref });
        u.value = mapConstFor(ref) ? 1 : 0;
      }
    } else if (!lit && !mapConst){
      // the unlit class has no such uniform: drop the sampled alpha in the stock chunk instead
      tagProgram(mat, 'alphaOpaque');
      chain(mat, sh => {
        sh.fragmentShader = sh.fragmentShader.replace(
          '#include <map_fragment>',
          '#include <map_fragment>\n\tdiffuseColor.a = opacity;');
      });
    } else if (!lit){
      // MapConstant, unlit: the constant's alpha alone with the switch off (the old reading), the
      // texel's alpha times it with the switch on (the function body). map_fragment has already
      // multiplied the texel into diffuseColor, so the two ends of the mix are exactly those.
      const u = { value: mapConstFor(ref) ? 1 : 0 };
      mapConstMats.add({ u, ref });
      mat.addEventListener('dispose', () => { for (const e of mapConstMats) if (e.u === u) mapConstMats.delete(e); });
      // AN OPAQUE ONE KEEPS ITS COVERAGE. With the switch on, the map's alpha reaches diffuseColor.a,
      // and on a BSSolid material nothing blends with it: it can only feed an alpha test (3 of the 62
      // opaque MapConstant materials carry one). But rom/state.js draws BSSolid with NoBlending, so
      // three.js does not define OPAQUE, and the alpha went out to the canvas. The canvas is
      // alpha:true (stage.js), so the page behind it showed through the eye. Measured on Savage
      // Deviljho's XfB__m00_eye, 2026-09-16, headless: the sclera came out brighter by about 7 levels
      // over about 100 pixels. Its map is the body albedo, alpha mean 52/255. The transparent flag
      // alone moved 0 pixels. Nakarkos' XfB_0_1_eyes (map alpha mean 65) has had the same leak since
      // its default went on. Its eye drawn alone, read back from the framebuffer: all 109,710 pixels
      // below 255, mean 91, before this. After it, only the 1,241 antialiased edge pixels, with the
      // same RGB. Composited over the page, that took a lift of about 7 levels (max 33) off the eyes.
      //
      // So after the test, a surviving fragment's alpha goes back to the material's opacity. That is
      // the constant's alpha, 1.0 on all 62. This is installCutoutSolid's reasoning in rom/material.js,
      // and it has the same standing: NOT A ROM FINDING. The game's framebuffer is never composited
      // with anything. It lands after the test because installRomAlphaTest is chained after this and
      // inserts its discard directly after the same include. With the switch off it is a no-op:
      // alpha is already opacity.
      const solid = !!(rom.state && rom.state.blend === 'opaque');
      tagProgram(mat, 'alphaMapConst');
      if (solid) tagProgram(mat, 'mapConstSolid');
      chain(mat, sh => {
        sh.uniforms.uMapConstAlpha = u;
        let f = 'uniform float uMapConstAlpha;\n' + sh.fragmentShader.replace(
          '#include <map_fragment>',
          '#include <map_fragment>\n\tdiffuseColor.a = mix( opacity, diffuseColor.a, uMapConstAlpha );');
        if (solid){
          const A = '#include <alphatest_fragment>';
          if (f.indexOf(A) >= 0) f = f.replace(A, A + '\n\tdiffuseColor.a = opacity;');
          else solidMisses.push(mat.name || '?');
        }
        sh.fragmentShader = f;
      });
    }
    // FAlbedoMapConstant fixes it to the CONSTANT's alpha. That is the mechanism behind the three
    // additive overlays that ship fConstantColor.a = 0 -- invisible at rest -- and are ramped to 1
    // by their Gekikou_/Angry_ clips. Savage Deviljho's XfB__m02_body_k is one of the three.
    // FLAGGED: the description says "alpha fixed" without saying fixed to WHAT. The constant's own
    // alpha is the reading consistent with those three, and it is labelled as a reading.
    const gl = rom.glob;
    // ...but only a material that BLENDS can be transparent. BSSolid has no blend for any alpha to
    // feed -- the ROM draws it opaque, and only an alpha test could cut it -- so the 62 opaque
    // MapConstant materials (the eyes) were sitting in three.js's transparent queue, re-sorted every
    // frame against the effect layers. With the texture's alpha now reaching them (Nakarkos) that
    // sort decided what showed through: Raven, 2026-09-13, "Eyes on mainbody oscillate when zoomed
    // out". Savage Deviljho was left on the old path until 2026-09-16 (see MapConstant above). The
    // transparent flag alone moved its eye 0 pixels when it joined.
    const blends = !(rom.state && rom.state.blend === 'opaque');
    if (albedo === 'MapConstant' && gl && gl.constant && gl.constant.length > 3){
      mat.opacity = gl.constant[3];
      if (blends) mat.transparent = true;
    }
  }

  // ---- THE SECOND ALBEDO MAP -------------------------------------------------------------------
  // FAlbedoTypeExtendModulate "MTFLのAlbedoTypeがExtendModulate用", FAlbedoTypeExtendAdd
  // "...ExtendAdd用", FAlbedoMapBlend "アルベドをブレンドしたテクスチャで指定".
  // 20 materials. The old injection targeted a string only material.js's LIT rewrite produces, so
  // it silently missed the 17 that are add/revsub -- the shader compiled, the varying went unused,
  // and the second map was never sampled. Applying it by TECHNIQUE rather than by blend fixes those.
  const twoMap = albedo.startsWith('TypeExtend') || albedo === 'MapBlend';
  if (twoMap && rom.m && rom.m.t && rom.m.t.tAlbedoBlendMap){
    const u = mat.userData.u || (mat.userData.u = {});
    u.uExtMap  = u.uExtMap  || { value: null };
    u.uExtTint = u.uExtTint || { value: new THREE.Vector4(1, 1, 1, 1) };
    // THE COMBINE, now READ rather than inferred. The three feature bodies decode in full
    // (build/notes/chunk5-shaders.md Part 8); `tmpN` are the sampled maps:
    //
    //   Modulate   MC.albedo = tmp1 * tmp2                     MUL
    //   Add        MC.albedo = saturate( tmp1 + tmp2 )         ADD then intrinsic 57, arity 1
    //   MapBlend   MC.albedo = lerp( tmp1, tmp2, fAlbedoBlendColor )   intrinsic 40, arity 3
    //
    // Intrinsic 40 is lerp because the only features whose sole operator it is are named for it --
    // PS_TextureBlend, PS_CubicBlend, PS_TextureBlendCube, FBlendFogPrimAlpha -- and PS_TextureBlend
    // reads `tmp2 | tmp3 | CBTextureBlend.fTextureBlendFactor | INTRINSIC40`, which fixes the
    // argument order as the standard lerp(a, b, t) with the FACTOR THIRD.
    //
    // 1 = Modulate (multiply), 2 = Add (SATURATED -- the old path summed without clamping),
    // 3 = MapBlend (lerp). MapBlend was previously a multiply, which the ROM positively excludes.
    u.uExtMode = u.uExtMode || { value: albedo === 'MapBlend' ? 3 : (albedo === 'TypeExtendAdd' ? 2 : 1) };
    // fAlbedoBlendColor plays TWO different roles and the difference matters. On Modulate and Add it
    // modulates the second map before the combine (`tmp2 = tmp2.rgb * fAlbedoBlendColor`), which is
    // what uExtTint already does. On MapBlend it is the lerp FACTOR instead, so it must not also be
    // multiplied in -- the shader below applies it as one or the other, never both.

    // THE SECOND MAP'S UV, which this module used to drop. It sampled a raw `uv1`, where the path
    // it replaced routed the UV through the ROM's own transform -- so switching the ROM core on was
    // a REGRESSION on these 20 materials. Both halves of the routing are read, not guessed:
    //
    //   * WHICH UV SLOT. The feature's own body reaches its UV by a tag-5 operand naming another
    //     feature record: the albedo sample calls FUVAlbedoMap, the extend sample calls
    //     FUVAlbedoExtendMap, and those selector features write MATERIAL_CONTEXT's uv_primary /
    //     uv_secondary / uv_unique / uv_extend slots respectively. That is the same answer
    //     build-materials.py already emits as feat.uvAlbedoExtendMap by a different route -- two
    //     independent decodes agreeing. (build/notes/chunk5-shaders.md Part 5.)
    //   * WHICH TRANSFORM. feat.uvxf is the ROM's routing table, ["Offset","Offset2",false,
    //     "Offset3"], naming which of the three float2x4 affines in the 24-float cbm.uv block
    //     applies to that slot.
    //
    // UVViewNormal is a COMPUTED uv, not an attribute. It works here where it could not on the old
    // path: technique picks the class in this module, so all 20 are MeshStandardMaterial and vNormal
    // exists -- on the blend-gated path 17 of them were MeshBasicMaterial with no normal varying.
    const uvName = feat.uvAlbedoExtendMap || feat.uvAlbedoBlendMap || 'UVSecondary';
    const slot   = uvName === 'UVExtend' ? 3 : (uvName === 'UVSecondary' ? 1 : 0);
    const which  = { Offset: 0, Offset2: 1, Offset3: 2 }[(feat.uvxf || [])[slot]] || 0;
    const cbu    = rom.cbm && rom.cbm.uv;
    const flat   = cbu ? (Array.isArray(cbu[0]) ? [].concat.apply([], cbu) : cbu) : null;
    const m8     = flat ? flat.slice(which * 8, which * 8 + 8) : [1, 0, 0, 0, 0, 1, 0, 0];
    u.uExtXf   = u.uExtXf   || { value: new THREE.Vector4(m8[0] || 1, m8[5] || 1, m8[3] || 0, m8[7] || 0) };
    u.uExtView = u.uExtView || { value: uvName === 'UVViewNormal' ? 1 : 0 };

    tagProgram(mat, 'extendMap');
    chain(mat, sh => {
      Object.assign(sh.uniforms, { uExtMap: u.uExtMap, uExtTint: u.uExtTint, uExtMode: u.uExtMode,
                                   uExtXf: u.uExtXf, uExtView: u.uExtView });
      sh.vertexShader = sh.vertexShader
        .replace('void main() {', 'attribute vec2 uv1;\nvarying vec2 vExtUv;\nvoid main() {')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n\tvExtUv = uv1;');
      // TWO ANCHORS, because `#include <map_fragment>` IS NOT THERE BY THE TIME THIS RUNS.
      // rom/material.js calls applyTint(mat) BEFORE injectFeatures(mat, ...), and applyTint
      // replaces that include wholesale with its own block. This injection was then replacing a
      // string that no longer existed: the uniforms were still assigned, so uExtMap, uExtMode and
      // uExtXf all read back correctly bound and animating, while not one line of GLSL sampled
      // them. Nothing threw, exactly like the uRomSpecAmount miss.
      //
      // Raven, 2026-09-09, on Khezu: the veins are "black" and "present at all times". Its
      // m03_blood is TypeExtendModulate -- an achromatic vein mask, mean RGB (0.696, 0.698, 0.696),
      // modulated by a TEAL second map, mean (0.085, 0.270, 0.244) -- drawn reverse-subtract.
      // Modulated, the layer subtracts teal and leaves a reddish tint. Un-modulated it subtracts
      // neutral grey, which is black, and without the second map masking it down it shows
      // everywhere. Both halves of his report, one cause.
      //
      // 20 materials carry a second map: 13 TypeExtendModulate, 3 TypeExtendAdd, 4 MapBlend.
      // A miss is now RECORDED rather than silent.
      const EXT =
          '\t{ vec2 euv = vExtUv;\n' +
          '\t  if ( uExtView > 0.5 ) { vec3 evn = normalize( vNormal ); euv = evn.xy * 0.5 + 0.5; }\n' +
          '\t  euv = euv * uExtXf.xy + uExtXf.zw;\n' +
          '\t  vec4 ext = texture2D( uExtMap, euv );\n' +
          // MapBlend takes fAlbedoBlendColor as the lerp factor; the other two take it as a tint on
          // the second map. Applying both would double-count it.
          // the factor is fAlbedoBlendColor's ALPHA, a scalar -- the ROM's leaf reads
          // `tmp1 | tmp2 | $Globals.fAlbedoBlendColor | .a | LERP/3`
          '\t  if ( uExtMode > 2.5 ) {\n' +
          '\t    diffuseColor.rgb = mix( diffuseColor.rgb, ext.rgb, uExtTint.a );\n' +
          '\t    gBase = mix( gBase, ext.rgb, uExtTint.a );\n' +
          '\t  } else {\n' +
          '\t    ext.rgb *= uExtTint.rgb;\n' +
          // the ROM saturates the Add, via intrinsic 57 (arity 1) sitting on the ADD's result
          '\t    diffuseColor.rgb = uExtMode > 1.5 ? clamp( diffuseColor.rgb + ext.rgb, 0.0, 1.0 )\n' +
          '\t                                      : diffuseColor.rgb * ext.rgb;\n' +
          // gBase IS THE ALBEDO THE EMISSION SCALES, so the second map has to reach it too.
          // applyTint sets `gBase = base` inside <map_fragment> -- the FIRST map alone -- and this
          // block runs after it, so on a two-map material the emission was scaled by half the
          // albedo. On Khezu's charged vein layer that is the difference between the teal the blend
          // map carries and the achromatic 0.7 of the base map: fEmissionColor is (2,2,2), WHITE,
          // and the highest of the 198 monster materials that ship one, so scaled by the base map
          // alone it lands at 1.4 white and swamps the teal the two maps exist to produce. Raven,
          // 2026-09-09: "the veins appear as bright white and the effect is super bright". 20
          // materials carry a second map and every one of them was affected.
          '\t    gBase = uExtMode > 1.5 ? clamp( gBase + ext.rgb, 0.0, 1.0 ) : gBase * ext.rgb;\n' +
          '\t  } }';
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {',
          'uniform sampler2D uExtMap;\nuniform vec4 uExtTint;\nuniform float uExtMode;\n' +
          'uniform vec4 uExtXf;\nuniform float uExtView;\nvarying vec2 vExtUv;\nvoid main() {');
      // applyTint's block ends with this line; it is what survives when the include does not.
      const A_INC  = '#include <map_fragment>';
      const A_TINT = 'diffuseColor.a *= mix( 1.0, texel.a, uAlphaCut );';
      let f = sh.fragmentShader;
      if (f.indexOf(A_INC) >= 0)       f = f.replace(A_INC,  A_INC  + '\n' + EXT);
      else if (f.indexOf(A_TINT) >= 0) f = f.replace(A_TINT, A_TINT + '\n' + EXT);
      else extMisses.push(mat.name || '?');
      sh.fragmentShader = f;
    });
  }

  // ---- REFRACT ---------------------------------------------------------------------------------
  // FDistortionRefract, described simply as "屈折" -- refraction. CBDistortion supplies
  // fDistortionFactor and fDistortionBlend, so the material samples the SCENE offset by a
  // refraction vector scaled by the factor and mixes the result in by the blend. 10 materials:
  // Chameleos and Nightcloak Malfestio's stealth (factor 20, blend 1.0 -- full replacement, which
  // IS the stealth), Astalos' wings (factor 0, blend 0.6 and 0.8), Hellblade Glavenus' tail
  // (factor 10, blend 0, animated up -- the one Refract material that animates these).
  if (feat.distortion === 'Refract'){
    const u = mat.userData.u || (mat.userData.u = {});
    const dz = rom.m && rom.m.dist;
    u.uSceneMap  = u.uSceneMap  || { value: null };
    u.uDistFac   = u.uDistFac   || { value: dz ? dz.factor : 0 };
    u.uDistBlend = u.uDistBlend || { value: dz ? dz.blend : 0 };
    tagProgram(mat, 'refract');
    chain(mat, sh => {
      Object.assign(sh.uniforms, { uSceneMap: u.uSceneMap, uDistFac: u.uDistFac,
                                   uDistBlend: u.uDistBlend, uRefractRom: REFRACT_ROM_ORDER });
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {',
          'uniform sampler2D uSceneMap;\nuniform float uDistFac;\nuniform float uDistBlend;\n' +
          'uniform float uRefractRom;\n' +
          'void main() {')
        .replace('#include <opaque_fragment>',
          '#include <opaque_fragment>\n' +
          '\tif ( uDistBlend > 0.0 ) {\n' +
          '\t  vec3 rvec = normalize( ( viewMatrix * vec4( normalize( vNormal ), 0.0 ) ).xyz );\n' +
          '\t  vec2 res = vec2( textureSize( uSceneMap, 0 ) );\n' +
          // the factor is in PIXELS -- the shipped values are 10 and 20, which as UV offsets would
          // be ten screen-widths -- so it is divided by the target size.
          '\t  vec2 suv = ( gl_FragCoord.xy + rvec.xy * uDistFac ) / res;\n' +
          '\t  vec3 romScene = texture2D( uSceneMap, suv ).rgb;\n' +
          // WHAT THE SCENE IS MIXED INTO -- see REFRACT_ROM_ORDER. STANDARD is the only program here
          // that declares totalDiffuse / totalSpecular / totalEmissiveRadiance, so any other class
          // keeps the old whole-colour mix rather than failing to compile.
          '#ifdef STANDARD\n' +
          '\t  gl_FragColor.rgb = uRefractRom > 0.5\n' +
          '\t    ? mix( totalDiffuse + totalEmissiveRadiance, romScene, uDistBlend ) + totalSpecular\n' +
          '\t    : mix( gl_FragColor.rgb, romScene, uDistBlend );\n' +
          '#else\n' +
          '\t  gl_FragColor.rgb = mix( gl_FragColor.rgb, romScene, uDistBlend );\n' +
          '#endif\n' +
          '\t}');
    });
  }
  return mat;
}

// THE ORDER THE SCENE IS MIXED IN, read from the feature body 2026-09-13. Raven: "Check why part 42
// shows no colour on Astalos." Astalos' charged membrane (XfBAN__E1_wing_taiden, parts 42-44) ships
// fDistortionBlend 0.8, and this path used to mix the captured scene over the WHOLE final colour --
// so its pale green emission (0.75, 0.925, 0.575) and its yellow-green specular (0.42, 0.6, 0) both
// reached the screen at a fifth of their strength, under 80% of whatever sat behind the wing.
//
// The ROM does not mix the whole colour. PS_MaterialStd runs FEmission (which ADDS into MC.diffuse)
// and then FDistortion before FFinalCombiner (albedo*diffuse + specular*fresnel), and
// FDistortionRefract's body (build/notes monster-shader-model.md) is:
//
//     tmp3       = MC.albedo * MC.diffuse                                  -- lit, emissive colour
//     MC.albedo  = lerp( tmp3, sample(tDistortionMap, MC.uv_screen + offset), fDistortionBlend )
//     MC.diffuse = float3( <three literals> )
//
// so the final colour is lerp(albedo * (lighting + emission), scene, blend) * those literals, PLUS
// specular*fresnel, which never passes through the lerp. The three literals are not decoded (the
// operand reader prints them as a type-322 reference, not values); taking them as 1.0 is a READING,
// forced by Chameleos' stealth: at blend 1.0 anything else would draw his body black or tinted
// instead of the refracted scene. Here that is mix(totalDiffuse + totalEmissiveRadiance, scene,
// blend) + totalSpecular -- three.js's diffuse already carries the albedo, and the emission has been
// scaled by it (gBase), which is albedo * emission.
//
// NOT changed: the offset. The ROM takes refract() of the view-space normal with
// CBDistortionRefract.fDistortionRefract and scales it by view depth and fScreenScale; this still
// offsets by the view normal times the factor. Astalos ships factor 0, so it is untouched either way.
//
// 10 materials carry Refract: Chameleos and Nightcloak Malfestio's stealth, Hellblade Glavenus'
// tail, Astalos' and Boltreaver's wings. On all of them the specular now survives the mix.
// __refractRom(false) restores the old whole-colour mix for comparison; __refractRom() reads it back.
const REFRACT_ROM_ORDER = { value: 1 };
export function setRefractRomOrder(on){ REFRACT_ROM_ORDER.value = on ? 1 : 0; return !!REFRACT_ROM_ORDER.value; }
if (typeof window !== 'undefined'){
  window.__refractRom = (on) => on === undefined ? !!REFRACT_ROM_ORDER.value : setRefractRomOrder(on);
}
