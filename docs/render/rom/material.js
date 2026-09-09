// THE ROM MATERIAL BUILDER.
//
// What this module IS: the ROM's own decisions about a material, applied in the ROM's own order --
// technique first (cls), then GPU state (blend / depth / cull / bias) from the state records, then
// the feature word. Every one of those is READ from the executable or the shader package.
//
// What this module is NOT, yet: a shading model. An earlier version of this file shipped a
// hand-written GLSL program with a Lambert + Blinn-Phong lighting model, a derivative-based tangent
// frame, a guessed specular-mask channel and guessed combines for MapBlend and the sphere map. It
// was removed for being INVENTED rather than read. Raven, 2026-09-07: "We are not making brand new
// code, simply translating ROM code to python for the web app".
//
// RETRACTION, 2026-09-08. This comment used to continue "NONE of that was in the ROM." That is
// FALSE and it has been steering work away from the right answer. `FBRDF` decodes to
//
//     MC.diffuse  = light.diffuseColor * max( dot( MC.normal, L ), k )          <- LAMBERT
//     h           = normalize( L - MC.eye_dir )                                 <- L + V
//     MC.specular = light.specColor * pow( max( dot( MC.normal, h ), k ), MC.shininess )  <- BLINN-PHONG
//
// so the ROM's BRDF IS Lambert + Blinn-Phong. The old code was right to go -- it was guessed, and
// guessing is the failure -- but the model class it guessed was the correct one. Being right by
// accident is not evidence; asserting the ROM says otherwise was a worse error. See
// build/notes/chunk5-shaders.md Part 15.
//
// The viewer DEFAULTS to MeshStandardMaterial, i.e. GGX / Cook-Torrance metallic-roughness -- a
// different BRDF, not a tuning apart, and the largest remaining gap. `enableRomPhong(true)` swaps
// in MeshPhongMaterial, which IS Lambert + Blinn-Phong, and feeds it $Globals.fShininess as the
// exponent and fSpecularColor as the specular colour, with no conversion. Off by default only
// because it changes every monster at once.
//
// UPDATED 2026-09-08. That paragraph used to end "whose OPERAND encoding is not [read]". It is now.
// The MFX operand word decodes as [member:12][0:4][record:12][tag:4], MATERIAL_CONTEXT's 32 slots
// are named, and every operator the monster materials reach is named -- so all 35 features they
// select or call read as source in build/notes/monster-shader-model.md. `FAlbedoMap` is literally
// `albedo = tex.rgb * fAlbedoColor; transparency = tex.a`. What is still NOT decoded is the
// contents of the 12,614 compiled binaries in the 56 MB SPK (Maxwell/NVN encoding), so the general
// lighting here still runs through material.js's own path rather than a translated program.
//
// This module applies what the ROM does tell us:
//
//   1. TECHNIQUE BEFORE BLEND. createMaterial() is a first-match-wins chain on BLEND state, so
//      `cls` is discarded on every blended material and 47 monster materials whose MRL says the LIT
//      technique (MaterialStd) are drawn as unlit MeshBasicMaterial. Here the technique picks the
//      class and blend is applied as STATE, which is what it is.
//   2. GPU STATE from the ROM's own records rather than from record NAMES (rom/state.js).
//   3. The FEATURE WORD, injected into the shared shader rather than guessed at (rom/shader.js).
//   4. The AMBIENT: FAmbientSH's L2 spherical-harmonic evaluation (rom/ambient.js). DEFAULT OFF.
//   5. The SPECULAR's scope: Fresnel over the whole specular term and the specular map as full RGB,
//      both from FFinalCombiner and FChannelSpecularMap (rom/specular.js). DEFAULT OFF.
//   6. The BRDF CLASS itself: MeshPhongMaterial, which is FBRDF's Lambert + Blinn-Phong, with the
//      ROM's fShininess as the exponent (`enableRomPhong`). DEFAULT OFF.
//
// 4, 5 and 6 are off by default. Each either overlaps something the SHARED material.js/stage.js
// already do -- so switching one on alone double-counts rather than corrects -- or changes every
// monster at once. They are translations waiting on a paired change and a look, not drafts. Nothing
// here is a draft: every line above is read from the package or the executable.
import * as THREE from 'three';
import { applyTint } from '../material.js';
import { applyRomState } from './state.js';
import { injectFeatures } from './shader.js';
import { installRomAmbient, trackRomAmbient, enableRomAmbient, romAmbientEnabled,
         setSHCoef, getSHCoef, setSHAmount } from './ambient.js';
import { installRomSpecular, trackRomSpecular, enableRomSpecular, romSpecularEnabled,
         setRomSpecularAmount, anchorMisses } from './specular.js';

let enabled = true;
export function enableRomCore(on){ enabled = !!on; }
// The ROM's own BRDF class (Lambert + Blinn-Phong). DEFAULT OFF: it changes the lighting of every
// monster at once, and it is the one change here that cannot be reviewed material by material.
let phong = false;
export function enableRomPhong(on){ phong = !!on; }
export function romPhongEnabled(){ return phong; }
export { enableRomAmbient, romAmbientEnabled, setSHCoef, getSHCoef, setSHAmount };
export { enableRomSpecular, romSpecularEnabled, setRomSpecularAmount, anchorMisses };
export function romCoreEnabled(){ return enabled; }

// The ROM's material classes, from nDraw::Material+0x10's technique key (low 12 bits = the package
// record index; MaterialStd's key 0x25FCFAFF & 0xfff = 0xAFF = TMaterialStd). A monster material is
// MaterialStd unless its own MRL says ConstantFog or Constant, and those two are the CONSTANT
// techniques -- unlit, the albedo is the output. ConstantFog adds a fog term whose parameters come
// from the STAGE, which a model viewer does not have, so it renders as Constant; that is a named
// limitation, not an approximation chosen here.
const LIT = 'Std';
const ALPHA_EPS = 1 / 512;

export function createRomMaterial(spec){
  const rom = spec && spec.rom;
  const feat = (rom && rom.feat) || null;
  const cls = (rom && rom.cls) || LIT;
  const st = (rom && rom.state) || null;
  const gl = rom && rom.glob, cb = rom && rom.cbm;

  // 1. TECHNIQUE picks the class -- tested BEFORE blend, which is the correction.
  //
  // WHICH lit class: `FBRDF` is Lambert diffuse + Blinn-Phong specular with MC.shininess as the
  // exponent (Part 15), and THREE.MeshPhongMaterial is exactly that model -- so `romPhong` is not a
  // different approximation, it is the ROM's own BRDF using three.js's implementation of it, with
  // $Globals.fShininess going in as the exponent rather than through a conversion.
  // MeshStandardMaterial (GGX / Cook-Torrance metallic-roughness) stays the default only because
  // switching the BRDF changes every monster at once and wants a look first.
  const lit = (cls === LIT);
  const mat = lit
    ? (phong ? new THREE.MeshPhongMaterial({ shininess: 30, specular: new THREE.Color(0x111111) })
             : new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 }))
    : new THREE.MeshBasicMaterial();
  mat.name = spec.srcName || '';
  mat.wireframe = !!(spec && spec.wire);

  // 2. GPU STATE, read from the ROM's blend / depth-stencil / rasterizer records, including the
  //    separate alpha blend factors (ONE/ZERO/ADD) that neither app has ever set.
  applyRomState(mat, st);

  // fAlbedoColor x fConstantColor where the feature word asks for the constant. The old chain
  // applied this on the lit branch only, so 24 monster and 588 armour/weapon materials drew untinted.
  if (gl && gl.albedo){
    const k = (feat && feat.albedo === 'MapConstant' && gl.constant) ? gl.constant : [1, 1, 1, 1];
    mat.color.setRGB(gl.albedo[0] * k[0], gl.albedo[1] * k[1], gl.albedo[2] * k[2]);
  }
  if (cb && typeof cb.transparency === 'number' && cb.transparency < 1){
    mat.opacity = cb.transparency;
    mat.transparent = true;
  }
  // The alpha TEST is bit 20 of the material feature word (rom.alphaTest) under transp 'Alpha',
  // threshold in $Globals fAlphaClipThreshold. The old add/revsub branches handled only
  // 'AlphaConstant', so 41 monster and 642 armour/weapon materials drew their cut texels.
  if (feat && feat.transp === 'Alpha' && rom.alphaTest)
    mat.alphaTest = Math.max(0, (gl && gl.clip) || 0) + ALPHA_EPS;

  // FEmissionConstant. 47 additive materials carry one and the old path dropped every one, because
  // MeshBasicMaterial has no emissive term. On the lit class it now lands. On a Constant material
  // the ROM's own technique is unlit, so there is nowhere for it to go there -- that is the ROM's
  // answer, not a gap.
  if (lit && gl && gl.emission && (gl.emission[0] + gl.emission[1] + gl.emission[2]) > 0){
    mat.emissive.setRGB(gl.emission[0], gl.emission[1], gl.emission[2]);
    mat.userData.emissiveFromMap = true;
  }
  // SHININESS. The ROM uses $Globals.fShininess directly as the Blinn-Phong exponent in
  // `pow( max(N.H, k), MC.shininess )`. On the Phong class it therefore goes straight in, with no
  // conversion at all -- that is the translation.
  //
  // On the Standard class it cannot: GGX has no exponent, only a roughness. The mapping below is a
  // BRIDGE between two different BRDFs, not a reading, and its constants (the /16, the 0.15, the
  // 0.4..0.85 clamp) are authored. Left as-is rather than "improved", because any replacement is
  // equally invented and this one is at least the shipped behaviour.
  if (lit && gl && typeof gl.shininess === 'number'){
    if (phong){
      if (gl.shininess > 0) mat.shininess = gl.shininess;
      // fSpecularColor ($Globals float3 @44) is the specular lobe's colour -- `light.specColor` in
      // FBRDF is the LIGHT's, and this is the material's half of the same product.
      if (gl.specular && gl.specular.length >= 3)
        mat.specular.setRGB(gl.specular[0], gl.specular[1], gl.specular[2]);
    } else if (gl.shininess > 16){
      mat.roughness = Math.min(0.85, Math.max(0.4, 0.85 - Math.log2(gl.shininess / 16) * 0.15));
    }
  }

  // FFresnel picks its SOURCE by variant: Schlick reads the scalar, SchlickRGB the float3. Both
  // records carry the same description so only the name separates them, and reading the wrong one
  // neuters the term both ways -- on 120 materials the scalar is 0.5 while the triple is [1,1,1]
  // (F0 = 1 is no Fresnel at all); on the 9 SchlickRGB ones the triple is [0,0,0], scalar 1.0.
  mat.userData.f0 = (!gl) ? [1, 1, 1]
    : (feat && feat.fresnel === 'SchlickRGB' && gl.fresnelSchlickRGB) ? gl.fresnelSchlickRGB.slice(0, 3)
    : (feat && feat.fresnel === 'Schlick' && typeof gl.fresnel === 'number') ? [gl.fresnel, gl.fresnel, gl.fresnel]
    : [1, 1, 1];
  mat.userData.reflective = cb ? (cb.reflective[0] + cb.reflective[1] + cb.reflective[2]) / 3 : 1;
  mat.userData.viewUv = !!(feat && feat.uvAlbedoMap === 'UVViewNormal');
  mat.userData.noTint = true;                 // monsters carry no pigment region
  mat.userData.cutout = !!mat.alphaTest;
  mat.userData.romCut = mat.alphaTest || 0;

  // The shared shader -- sphere map, specular mask, the dye machinery. UNCHANGED: this is the path
  // already under review, and nothing here rewrites its lighting.
  if (lit){
    applyTint(mat);
    const u = mat.userData.u;
    u.uAlphaCut.value = mat.alphaTest ? 1 : 0;
    u.uViewUv.value = mat.userData.viewUv ? 1 : 0;
    u.uF0.value.fromArray(mat.userData.f0);
  }
  if (lit && mat.alphaTest) installCutoutSolid(mat);

  // 3. THE FEATURE WORD on top: the alpha rules the ROM states in words, the second albedo map and
  //    Refract. Each carries the ROM's own description at its site in rom/shader.js.
  injectFeatures(mat, rom, lit);

  // 4. THE AMBIENT. FAmbientSH is selected by all 570 monster materials and is
  //    `getSHdiffuse(MC.normal) * MC.ambient_occlusion` -- an L2 spherical-harmonic evaluation,
  //    where the viewer's stock rig uses a HemisphereLight, which is a two-colour lerp along Y and
  //    a different function entirely. rom/ambient.js carries the ROM's evaluation statement for
  //    statement. It is DEFAULT OFF: the term is additive into indirectDiffuse and stage.js's
  //    hemisphere still occupies that slot, so the two must be switched together by the app.
  if (lit) { installRomAmbient(mat); trackRomAmbient(mat); }

  // 5. THE SPECULAR TERM'S SCOPE. FFinalCombiner is `albedo*diffuse + specular*fresnel`, so the
  //    Fresnel multiplies the WHOLE specular term, where material.js applies it to the sphere map
  //    only; and FChannelSpecularMap is the IDENTITY, so the specular map is full RGB where
  //    material.js takes its luminance. rom/specular.js corrects both. Also DEFAULT OFF: it
  //    rewrites text the SHARED material.js emits, and it changes the brightness of every material
  //    binding a specular map.
  if (lit) { installRomSpecular(mat); trackRomSpecular(mat); }

  mat.userData.rom = rom || null;
  mat.userData.cls = cls;
  mat.userData.romCore = true;
  if (feat && feat.distortion === 'Refract') mat.userData.refract = true;
  const blend = st && st.blend;
  mat.userData.renderOrder = (blend === 'add' || blend === 'revsub') ? 20 : (blend === 'blend' ? 10 : 0);
  mat.needsUpdate = true;
  return mat;
}

// Verified by DATA: the class matches the ROM's technique and depth write matches the ds record.
export function selfCheck(db){
  const bad = [];
  for (const [mid, entry] of Object.entries((db && db.monsters) || {})){
    for (const [name, rec] of Object.entries(entry.mats || {})){
      const rom = {
        feat: (typeof rec.f === 'number') ? db.feat[rec.f] : null,
        cbm:  (typeof rec.c === 'number') ? db.cbm[rec.c] : null,
        glob: (typeof rec.g === 'number') ? db.glob[rec.g] : null,
        state:(typeof rec.s === 'number') ? db.state[rec.s] : null,
        cls:  rec.cls || 'Std', alphaTest: false,
      };
      let mat;
      try { mat = createRomMaterial({ srcName: name, rom }); }
      catch (e){ bad.push({ mid, name, why: 'threw: ' + e.message }); continue; }
      if (!!mat.isMeshStandardMaterial !== (rom.cls === 'Std'))
        bad.push({ mid, name, why: 'cls ' + rom.cls + ' -> lit=' + !!mat.isMeshStandardMaterial });
      if (rom.state){
        const w = rom.state.ds === 'DSZTestWrite' || rom.state.ds === 'DSZTestWriteStencilWrite';
        if (mat.depthWrite !== w)
          bad.push({ mid, name, why: 'depthWrite ' + mat.depthWrite + ' != ds ' + rom.state.ds });
      }
      mat.dispose();
    }
  }
  return bad;
}


// A CUT-OUT FRAGMENT THAT SURVIVES THE ALPHA TEST IS FULLY PRESENT, so it writes full coverage.
//
// Raven, 2026-09-09: parts of a MONSTER capture come out transparent. The mechanism is in the
// shared shader, one line of applyTint's <map_fragment> rewrite:
//
//     diffuseColor.a *= mix( 1.0, texel.a, uAlphaCut );
//
// On a cut-out material (uAlphaCut = 1) that hands the sampled alpha to the alpha test, which is
// what it is for -- but it also leaves it in diffuseColor.a, and three.js writes that straight out
// as the fragment's alpha. Cut-out maps on fur fringes, wing membranes, fins and frills are authored
// with a SOFT ramp, so every texel between the threshold and 1.0 survives the test and then writes
// partial coverage. 41 monster materials carry the alpha-test bit.
//
// It is invisible on screen -- the page paints a backdrop behind the canvas and the RGB is right --
// and it is invisible in the two capture modes that composite over that backdrop. It shows in
// exactly the two that keep alpha: a screenshot with the backdrop off, and a frame sequence.
//
// The texel alpha's job is to DECIDE THE DISCARD. Once <alphatest_fragment> has run, a surviving
// fragment is part of the model, so its coverage is the material's opacity. This restores that,
// after the test and never before it, so which texels are discarded does not change. RGB is
// untouched. Non-cut-out materials are unaffected: uAlphaCut is 0 for them and the mix is a no-op.
//
// NOT A ROM FINDING. The game renders to an opaque framebuffer and never reads this alpha, so the
// ROM says nothing about it -- same standing as the coverage-preserving blend alpha in state.js.
// uCutSolid is a review knob, 1 on: set it to 0 to get the old behaviour back without a reload.
const cutSolid = [];
export function setCutoutSolid(on){
  const v = on ? 1 : 0;
  for (const u of cutSolid) u.value = v;
}
export function cutoutSolidCount(){ return cutSolid.length; }
function installCutoutSolid(mat){
  const u = mat.userData.u;
  if (!u) return;
  u.uCutSolid = u.uCutSolid || { value: 1 };
  cutSolid.push(u.uCutSolid);
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, { uCutSolid: u.uCutSolid });
    let f = sh.fragmentShader;
    f = 'uniform float uCutSolid;' + String.fromCharCode(10) + f;
    const A = '#include <alphatest_fragment>';
    if (f.indexOf(A) >= 0){
      f = f.replace(A, A + String.fromCharCode(10) +
        '	diffuseColor.a = mix( diffuseColor.a, opacity, uCutSolid * uAlphaCut );');
    } else { cutMisses.push(mat.name || '?'); }
    sh.fragmentShader = f;
  };
  mat.needsUpdate = true;
}
const cutMisses = [];
export function cutoutAnchorMisses(){ return cutMisses.slice(); }
