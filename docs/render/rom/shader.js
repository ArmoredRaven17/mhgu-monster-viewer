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

export function injectFeatures(mat, rom, lit){
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
    if (lit && mat.userData.u && mat.userData.u.uAlphaCut){
      mat.userData.u.uAlphaCut.value = 0;          // the texel's alpha stops here
    } else if (!lit){
      // the unlit class has no such uniform: drop the sampled alpha in the stock chunk instead
      tagProgram(mat, 'alphaOpaque');
      chain(mat, sh => {
        sh.fragmentShader = sh.fragmentShader.replace(
          '#include <map_fragment>',
          '#include <map_fragment>\n\tdiffuseColor.a = opacity;');
      });
    }
    // FAlbedoMapConstant fixes it to the CONSTANT's alpha. That is the mechanism behind the three
    // additive overlays that ship fConstantColor.a = 0 -- invisible at rest -- and are ramped to 1
    // by their Gekikou_/Angry_ clips. Savage Deviljho's XfB__m02_body_k is one of the three.
    // FLAGGED: the description says "alpha fixed" without saying fixed to WHAT. The constant's own
    // alpha is the reading consistent with those three, and it is labelled as a reading.
    const gl = rom.glob;
    if (albedo === 'MapConstant' && gl && gl.constant && gl.constant.length > 3){
      mat.opacity = gl.constant[3];
      mat.transparent = true;
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
                                   uDistBlend: u.uDistBlend });
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {',
          'uniform sampler2D uSceneMap;\nuniform float uDistFac;\nuniform float uDistBlend;\n' +
          'void main() {')
        .replace('#include <opaque_fragment>',
          '#include <opaque_fragment>\n' +
          '\tif ( uDistBlend > 0.0 ) {\n' +
          '\t  vec3 rvec = normalize( ( viewMatrix * vec4( normalize( vNormal ), 0.0 ) ).xyz );\n' +
          '\t  vec2 res = vec2( textureSize( uSceneMap, 0 ) );\n' +
          // the factor is in PIXELS -- the shipped values are 10 and 20, which as UV offsets would
          // be ten screen-widths -- so it is divided by the target size.
          '\t  vec2 suv = ( gl_FragCoord.xy + rvec.xy * uDistFac ) / res;\n' +
          '\t  gl_FragColor.rgb = mix( gl_FragColor.rgb, texture2D( uSceneMap, suv ).rgb, uDistBlend );\n' +
          '\t}');
    });
  }
  return mat;
}
