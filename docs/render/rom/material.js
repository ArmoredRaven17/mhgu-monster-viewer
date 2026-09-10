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

// MATERIALS RAVEN HAS JUDGED TO BE REAL CUTOUTS, which the ROM census cannot tell apart from the
// gloss ramps. This table is AUTHORED, not decoded, and it is labelled that way because the honest
// decode ran out.
//
// The census above stands: no MHGU material selects FTransparencyAlphaClip, fAlphaClipThreshold is
// 0.0 everywhere, and clipping on the blend feature destroyed 30% of some hides. But it is not the
// whole truth, and Raven found where 2026-09-10: "I noticed Rathian line had a regression, the back
// has quills that now show the entire mesh." Measured on em001_04, the fraction of each mesh's
// on-screen pixels the old clip removed --
//
//     Group[102]#0  m50_wing_l   45.1%      the quill card's surround
//     Group[120]#0  m50_wing_l   17.7%
//     Group[0]#0    m50_wing_l   12.3%      the wing's scalloped edge
//     Group[0]#1    m51_wing_r    0.0%
//
// -- so those cards genuinely are cutouts and want the discard.
//
// WHY THERE IS NO RULE HERE INSTEAD OF A LIST. Sampling every mesh's UVs against its albedo alpha
// does not separate the two populations:
//
//     em001_04 quills, NEED the clip          19-26% of UV samples on alpha 0
//     em057_04 hair,  MUST NOT be clipped     14-50%
//     em057_00 hair,  MUST NOT be clipped     100%
//
// 26% and 45% overlap, so no threshold divides them, and the feature word is identical on both
// (transp Alpha, albedo Map, blend opaque). Zinogre's 100% is the proof that the same channel is a
// GLOSS ramp there -- nobody authors a mesh that is entirely cut away -- and clipping it is what
// punched 4,596 background holes through him earlier today.
//
// So this stays a list of Raven's calls rather than a heuristic dressed up as a decode. Add a
// material when a mesh is seen drawing its transparent surround; leave everything else alone. The
// threshold is the ROM's own fAlphaClipThreshold plus one 8-bit step, which discards only the
// exactly-zero texels and nothing else.
const AUTHORED_CUTOUT = new Set([
  // Rathian / Rathalos wing sheets. Shared by em001_00/02/04, em002_00/02/04, em010_00 and
  // em050_00, and keyed by NAME because every one of those wants the same answer: their UV
  // coverage of alpha-0 texels runs 0-29%, nowhere near Zinogre's 100%, so the discard takes the
  // surround and never the geometry. Checked before adding them, not assumed.
  'XfBAN__E0__m50_wing_l',
  'XfBAN__E0__m51_wing_r',
  // Nargacuga's fur. Raven, 2026-09-10: "Nargacuga fur has edges showing the full mesh still."
  // Used by em037_00, em037_04 and em037_04/tail and by nothing else, and its alpha-0 UV coverage
  // across those runs 0.00 to 0.30 -- no mesh loses more than a third, so the discard takes the
  // card's surround and never the card. Checked, not assumed.
  'XfBAN__E0__m50_body',
]);
export function authoredCutout(matName){ return AUTHORED_CUTOUT.has(matName); }

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

  // fAlbedoColor x fDiffuseColor x fConstantColor where the feature word asks for the constant. The
  // old chain applied this on the lit branch only, so 24 monster and 588 armour/weapon materials
  // drew untinted.
  //
  // fDiffuseColor WAS MISSING HERE. ../material.js has always folded CBMaterial's fDiffuseColor in
  // (`gl.albedo[i] * cb.diffuse[i]`); this path read $Globals and forgot the constant buffer, so 113
  // monster materials drew at full albedo where the ROM asks for less -- 81 opaque, 23 additive, 9
  // blended, and 39 of them exactly BLACK.
  //
  // Black is the interesting half, because those are the layers whose whole output is meant to be
  // the EMISSION: the eyes (em004, em005, em007 ...) and Tigrex's XfBA_A0__m01_angry, which ships
  // fDiffuseColor 0,0,0 with fEmissionColor 1.42 and scrolls fUVTransform 0 -> 1 across 90 frames.
  // Drawn with a white albedo the raw vein texture is ADDED on top of the emission and washes the
  // structure out; with the ROM's black it contributes nothing and the emission alone lights the
  // veins. Raven, 2026-09-10: "the albedo layers should be lighting up veins".
  if (gl && gl.albedo){
    const k = (feat && feat.albedo === 'MapConstant' && gl.constant) ? gl.constant : [1, 1, 1, 1];
    const df = (cb && cb.diffuse) ? cb.diffuse : [1, 1, 1];
    mat.color.setRGB(gl.albedo[0] * df[0] * k[0],
                     gl.albedo[1] * df[1] * k[1],
                     gl.albedo[2] * df[2] * k[2]);
  }
  if (cb && typeof cb.transparency === 'number' && cb.transparency < 1){
    mat.opacity = cb.transparency;
    mat.transparent = true;
  }
  // THE ALPHA CLIP IS ITS OWN FEATURE, AND MHGU NEVER SELECTS IT. Measured 2026-09-10, from
  // AppShaderPackage.mfx: the FTransparency family lists the clip as separate records from the
  // blend source --
  //
  //     1395  FTransparencyAlpha          the albedo alpha is the SRC_ALPHA blend factor
  //     1401  FTransparencyAlphaClip      the alpha CLIP
  //     1402  FTransparencyMapAlphaClip
  //     1910  FTransparencyAlphaConstant
  //
  // A census of every material the extractor produces -- 570 monster, 18,752 armour, 6,280 weapon,
  // 25,602 in all -- selects only Alpha, AlphaConstant or nothing. NOT ONE selects a clip variant,
  // and build-materials.py would spell them 'AlphaClip' / 'MapAlphaClip' if one did. On top of
  // that, fAlphaClipThreshold is exactly 0.0 on all 199 monster materials carrying transp 'Alpha',
  // and the ROM's clip(a - 0) discards only a < 0, i.e. nothing.
  //
  // What was here fired the clip on feat.transp === 'Alpha' -- the BLEND feature -- plus bit 20 of
  // the flag word, and then added an invented 1/512 so the test would bite at all. Bit 20 was only
  // ever matched against the artists' XfBA naming, and the "A" there IS the Alpha feature, so that
  // agreement was circular; it never came from the shader.
  //
  // The cost, measured over the shipped textures: 161 of the 199 have an albedo whose alpha is
  // more than 1% exactly-zero, because in MT that channel is the GLOSS, not coverage -- the same
  // reason libwebp was destroying RGB under it. 116 of those are OPAQUE (BSSolid), where the ROM
  // does not blend and the alpha is inert, so every zero-gloss texel was being discarded outright:
  // Zinogre's m05_hair lost 37.5% of its texels and Grimclaw's m50_wing 30%; ems/017_00's
  // XfBA1__m00_body is alpha 0 everywhere, so every texel of it would go (that mesh is off by
  // default for other reasons, so it was never on screen to lose). Measured in the viewer at
  // 607x875: the fix moves 11,693 pixels on enraged Grimclaw, and on Thunderlord Zinogre 4,596
  // pixels that now draw were showing the BACKGROUND -- holes straight through the model. That
  // is Raven's "gaps along seams", following the gloss map's own island borders (2026-09-10).
  const romClip = !!(feat && /AlphaClip$/.test(feat.transp || ''));
  if (romClip) mat.alphaTest = Math.max(0, (gl && gl.clip) || 0);
  // ...plus the materials Raven has judged to be cutouts, which the census cannot see. See
  // AUTHORED_CUTOUT above for why this is a list and not a rule.
  else if (authoredCutout(spec.srcName))
    mat.alphaTest = Math.max(0, (gl && gl.clip) || 0) + 1 / 512;
  // FTransparencyAlpha still means the sampled alpha reaches diffuseColor.a -- but as the blend
  // factor, so only where the ROM actually blends. On an opaque material there is no blending for
  // it to feed and gl_FragColor.a would go to the canvas instead.
  mat.userData.srcAlpha = !!(feat && feat.transp === 'Alpha'
                             && rom.state && rom.state.blend !== 'opaque');

  // FEmissionConstant. 47 additive materials carry one and the old path dropped every one, because
  // MeshBasicMaterial has no emissive term. On the lit class it now lands. On a Constant material
  // the ROM's own technique is unlit, so there is nowhere for it to go there -- that is the ROM's
  // answer, not a gap.
  //
  // WHERE THE AMOUNT COMES FROM, and it is not a texture. The emission family carries its own map
  // variant with its own texture slot, so the ROM states the difference outright:
  //
  //     FEmissionMap        idx 1515, with tEmissionMap (904), SSEmissionMap (568),
  //                         FUVEmissionMap (1510) and FChannelEmissionMap (1511)
  //     FEmissionConstant   idx 1513, declared float3, 放射量を定数で指定
  //                         -- "specify the emission amount by a constant"
  //
  // A material wanting a map-driven emission selects FEmissionMap and binds tEmissionMap. Across
  // all 570 monster materials the only emission feature named is Constant, and NONE of the 198 with
  // a non-zero emission binds a tEmissionMap. fEmissionColor is read straight from the .mrl at
  // $Globals float 48 -- (2,2,2) on Khezu's m04__taiden, checked against the file.
  //
  // THAT SAYS WHERE THE AMOUNT COMES FROM, NOT WHAT IT SCALES, and I read it as the latter earlier
  // today and made the term flat. That was wrong and it is what Raven then saw: "the veins appear
  // as bright white and the effect is super bright". The amount being a constant does not make the
  // TERM constant -- applyTint has always scaled it by gBase, the material's albedo, and the flag
  // below is what switches that on. Two things in the shipped data say the scale is right:
  //
  //   * Khezu's is (2,2,2) -- WHITE, and the highest emission of the 198. Added flat it erases the
  //     teal its second map exists to produce. Scaled by the albedo it IS that teal, boosted.
  //   * Authors who want a coloured glow put the colour in fEmissionColor and do: Zinogre's
  //     m03_effect (0.2, 0.8, 0.8), Astalos' wing_taiden (0.75, 0.925, 0.575), Amatsu's horn_add
  //     (1.0, 0.615, 0.2). Khezu's author wrote white, so the colour comes from what it scales.
  //
  // WHAT THE COMBINE IS EXACTLY IS STILL UNREAD. The compiled shaders in AppShaderPackage.spkg are
  // binaries with no identifiers and the .mfx feature body is an operation stream this repo has no
  // decoder for. Scaling the albedo is the shape applyTint already implemented; what this file
  // fixes is only that the albedo reaching it was half of one -- see the gBase note in shader.js.
  //
  // The legacy createMaterial path in ../material.js sets the same flag. That module is shared
  // with the Armor Viewer and the monster app does not edit it; its path is the pre-rewrite A/B
  // baseline and is reached only with the ROM core switched off.
  if (lit && gl && gl.emission && (gl.emission[0] + gl.emission[1] + gl.emission[2]) > 0){
    mat.emissive.setRGB(gl.emission[0], gl.emission[1], gl.emission[2]);
    // emissiveFromMap IS A DEFINE CARRIER, NOT A MULTIPLICAND, and I removed it earlier today on
    // exactly that misreading. applyTint REPLACES `#include <emissivemap_fragment>` with
    //
    //     #ifdef USE_EMISSIVEMAP
    //       totalEmissiveRadiance *= gBase;
    //     #endif
    //
    // so the stock chunk that samples the emissive map never runs -- the map is never read as a
    // texture at all. What the flag does is make three.js define USE_EMISSIVEMAP, which is the only
    // thing that switches the `*= gBase` on. Dropping it did not remove a multiply by the albedo
    // texture; it removed the multiply by the ALBEDO, leaving fEmissionColor to be added flat.
    // On Khezu's charge that took a 2.0 WHITE constant from 1.4 white to a full 2.0 white, which is
    // Raven, 2026-09-09: "the veins appear as bright white and the effect is super bright".
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
    u.uAlphaCut.value = (mat.alphaTest || mat.userData.srcAlpha) ? 1 : 0;
    u.uViewUv.value = mat.userData.viewUv ? 1 : 0;
    u.uF0.value.fromArray(mat.userData.f0);
    // fSpecularColor, $Globals float3 @44. ../material.js writes it at the end of createMaterial;
    // THIS path never did, so uSpecRGB sat at its (1,1,1) default and the ROM's own answer was
    // thrown away on 459 of 570 monster materials -- 84 of which ship exactly ZERO and are matte in
    // the ROM while drawing shiny here.
    //
    // Measured on Tigrex 2026-09-10. XfBA_A0__m01_angry is fDiffuseColor 0,0,0 and fSpecularColor
    // 0,0,0: an additive layer with no albedo and no specular, so the ONLY thing it may contribute
    // is its emission -- veins on nothing. With uSpecRGB left at 1 the lighting path painted the
    // whole quad instead: forcing the emission to black still lit 1799 pixels at mean 32.5 of 255,
    // against 35.7 with it, so the emission was almost none of what was on screen. That is Raven's
    // "the albedo layer still shows its boundaries ... you can see the boundary as a pale area".
    if (gl && gl.specular) u.uSpecRGB.value.fromArray(gl.specular.slice(0, 3));
  }
  // ONLY WHERE THE ALPHA IS COVERAGE AND NOTHING ELSE -- i.e. an OPAQUE material. See the note on
  // installCutoutSolid: on a blended, additive or reverse-subtractive material diffuseColor.a is
  // not output coverage, it is the SRC_ALPHA blend factor, and forcing it to 1 makes every surviving
  // texel composite at full strength.
  if (lit && mat.alphaTest && (!rom || !rom.state || rom.state.blend === 'opaque'))
    installCutoutSolid(mat);

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
  // DRAW ORDER COMES FROM THE ROM'S DEPTH BIAS, not from the blend mode.
  //
  // This used to be `(add || revsub) ? 20 : (blend ? 10 : 0)` -- a rule with no source in the ROM,
  // and it inverted layers the ROM stacks the other way. Khezu: m02_body_d is a BLEND layer at bias
  // -384, m03_blood is REVSUB at bias -160, so the ROM puts m02_body_d in FRONT; the old rule drew
  // it first and let the vein layer composite over the top of it. Raven, 2026-09-09: "I suspect the
  // wounds are also in the wrong order since I see areas around the wound marks that normally are
  // not seen."
  //
  // The bias IS the stacking: RSMeshBiasN pulls a layer toward the camera, and applyRomBias already
  // turns it into the polygon offset, so depth was right and only the blend order was wrong -- which
  // is why it shows as fringing around a mark rather than z-fighting. Correct alpha blending is
  // far-to-near, so the nearest layer (most negative bias) must draw LAST.
  //
  // Opaque stays at 0 so it always precedes the overlays. Everything else is ordered by bias, and
  // materials sharing a bias keep their insertion order.
  const blend = st && st.blend;
  const bias = (st && typeof st.bias === 'number') ? st.bias : 0;
  mat.userData.renderOrder = (!blend || blend === 'opaque') ? 0 : 10 + Math.max(0, -bias);
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
//
// OPAQUE MATERIALS ONLY, corrected 2026-09-09. The reasoning above holds for a material that WRITES
// its fragment and nothing composites with it. It is wrong for a blended one: with BSBlendAlpha,
// BSAddAlpha or BSRevSubAlpha the ROM's blend factor IS SRC_ALPHA, so diffuseColor.a is not output
// coverage at all -- it is how much of this layer reaches the framebuffer. Forcing it to `opacity`
// made every texel that cleared the alpha test composite at FULL strength, and the test's threshold
// is the material's own clip value, 1/512 on these, which almost nothing fails.
//
// 105 materials across the library are on that path -- 69 add, 33 blend, and all 3 revsub. The
// revsub three are Khezu's m03_blood, Old Fatalis' m01_face_sub and Grimclaw Tigrex's
// m60_angry_arm; the additive ones include the rage auras and charge glows. On a vein or fur or
// spark texture, which is thin strands over mostly-transparent ground, forcing the whole quad to
// full alpha draws the QUAD rather than the strands. Raven, 2026-09-09: "the charge state doesn't
// look correct or right", and earlier on Savage Deviljho "it looks more like a blob now compared to
// previous versions" and on Zinogre "it also suffers from the same effect blobification".
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
  // three.js keys its program cache on the material's parameters alone, so this injection has to
  // change the key or a material without it can hand this one its shader. See rom/shader.js.
  {
    const tags = (mat.userData.progTags || '') + '|cutoutSolid';
    mat.userData.progTags = tags;
    mat.customProgramCacheKey = () => tags;
  }
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
