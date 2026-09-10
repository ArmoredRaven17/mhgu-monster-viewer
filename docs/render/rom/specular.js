// THE SPECULAR TERM AND THE FRESNEL'S SCOPE, from the ROM's own final combine.
//
// `FFinalCombiner` (AppShaderPackage.mfx, decoded in build/notes/chunk5-shaders.md Part 14) is:
//
//     out.rgb = MC.albedo * MC.diffuse  +  MC.specular * MC.fresnel
//     out.a   = MC.transparency * CBROPTest.fGlobalTransparency * MC.global_transparency
//
// and the terms feeding it:
//
//     FSpecularMap      MC.specular = ( MC.specular * fSpecularColor + FReflect() )
//                                     * FChannelSpecularMap( tSpecularMap sample ) * MC.occlusion
//                       MC.fresnel  = FFresnel()
//     FFresnelSchlick   = F0 + (1 - F0) * pow( 1 - dot( normal, -eye_dir ), 5 )
//
// TWO DIFFERENCES from the shared material.js path, both read from the package rather than inferred:
//
//   1. FRESNEL MULTIPLIES THE WHOLE SPECULAR TERM. The combine is `specular * fresnel`, and
//      MC.fresnel is read by FFinalCombiner, FSpecular, FSpecularMap and
//      FSpecularMapBlendTransparencyMap. material.js applies its Schlick term only inside
//      `if ( uEnvAmt > 0.0 )`, i.e. to the sphere map. Its FORMULA is right -- it matches the ROM
//      operand for operand -- but its SCOPE is narrower. 460 monster materials select
//      fresnel=Schlick.
//
//   2. THE SPECULAR MAP IS FULL RGB, NOT LUMINANCE. `FChannelSpecularMap`'s body is `tmp0` -- the
//      identity. That is deliberate on the ROM's part, not a gap in the decode: the sibling records
//      FChannelR / FChannelG / FChannelB / FChannelA all carry a real swizzle, so the package
//      expresses channel selection where it wants it and declines to here. material.js reduces the
//      map with dot(rgb, luma). A COLOURED specular map tints the lobe in the ROM and merely scales
//      it in the viewer.
//
// A SIGN CONVENTION worth keeping in view: `initMaterialContext` sets
// `MC.eye_dir = normalize(wposition - fCameraPos)`, i.e. camera TO surface, which is why
// FFresnelSchlick negates it before the dot. Getting that backwards moves a Fresnel rim from the
// silhouette to the facing side.
import * as THREE from 'three';

// DEFAULT OFF. This rewrites text that the SHARED material.js emits, so it is switched on
// deliberately and reviewed, not inherited. It also changes the brightness of every material that
// binds a specular map, and that is a judgement no automated check here can make.
let enabled = false;
export function enableRomSpecular(on){ enabled = !!on; }
export function romSpecularEnabled(){ return enabled; }

// The exact strings material.js emits today. If either stops matching -- because the shared module
// moved upstream -- this module MUST no-op rather than half-apply, so the anchors are asserted and
// a miss is reported instead of silently doing nothing.
const A_SPEC_END = 'reflectedLight.indirectSpecular *= uSpecRGB * specMask;';
const A_GLOSS = 'gGloss = uSpecOn > 0.5 ? dot( texture2D( uSpec, vMapUv ).rgb, vec3( 0.299, 0.587, 0.114 ) ) : texel.a;';

const misses = [];
export function anchorMisses(){ return misses.slice(); }

function chain(mat, fn){
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); fn(sh, r); };
  mat.needsUpdate = true;
}
// An onBeforeCompile edit is invisible to three.js's program cache key, so two materials with
// matching parameters share one compiled program and the first to compile decides whose injected
// GLSL everyone runs. See the full note in rom/shader.js. Every injection must tag the material.
function tagProgram(mat, tag){
  const tags = (mat.userData.progTags || '') + '|' + tag;
  mat.userData.progTags = tags;
  mat.customProgramCacheKey = () => tags;
  mat.needsUpdate = true;
}


export function installRomSpecular(mat){
  if (!enabled) return mat;
  if (!mat || !mat.isMeshStandardMaterial) return mat;
  const u = mat.userData.u;
  if (!u || !u.uF0) return mat;                 // needs material.js's uniforms to be present
  u.uRomSpecAmount = u.uRomSpecAmount || { value: 1 };

  tagProgram(mat, 'romSpec');
  chain(mat, sh => {
    Object.assign(sh.uniforms, { uRomSpecAmount: u.uRomSpecAmount });
    let f = sh.fragmentShader;

    // DECLARE the uniform, by PREPENDING rather than by replacing an anchor. Adding it to
    // sh.uniforms alone does not put it in the GLSL, and the omission is silent in JS: the
    // shader fails to compile with "undeclared identifier", the material falls back to an
    // invalid program, and nothing throws.
    //
    // It anchored on 'void main() {' until 2026-09-08. That string is rewritten by six other
    // handlers in this chain (material.js, monster.js x3, ambient.js, shader.js x3), so the
    // replace was order-dependent for no reason; three.js concatenates its own prefix ahead of
    // this body, so a bare uniform at the top is valid GLSL wherever main ends up.
    //
    // This did NOT fix the two 'uRomSpecAmount : undeclared identifier' errors three.js logs on
    // first compile -- they survive the prepend, and remain UNEXPLAINED. What was measured on
    // 2026-09-08: a WebGL2RenderingContext.shaderSource hook saw the declaration present, ahead
    // of its use, in every source handed to GL (0 missing); all linked programs report
    // LINK_STATUS true; forcing all 21 lit materials to recompile raises no error. So the drawn
    // result is not what the log describes. Do not treat those two lines as fixed.
    f = 'uniform float uRomSpecAmount;\n' + f;

    // (2) full RGB. Keep gGloss (material.js uses it for the sphere map) but also carry the
    //     unreduced colour, which is what FChannelSpecularMap's identity hands on.
    if (f.indexOf(A_GLOSS) >= 0){
      f = f.replace(A_GLOSS,
        'vec3 romSpecTex = uSpecOn > 0.5 ? texture2D( uSpec, vMapUv ).rgb : vec3( texel.a );\n' +
        '             gRomSpecRGB = romSpecTex;\n' +
        '             ' + A_GLOSS);
      f = f.replace('float gGloss = 0.0;', 'float gGloss = 0.0; vec3 gRomSpecRGB = vec3( 1.0 );');
    } else { misses.push('gloss'); }

    // (1) fresnel over the whole specular term, and the map applied as colour.
    //     material.js has already multiplied by `uSpecRGB * specMask` (a scalar mask); this
    //     divides that scalar back out per channel and re-applies the map as RGB, then multiplies
    //     the ROM's Fresnel over both specular accumulators.
    if (f.indexOf(A_SPEC_END) >= 0){
      f = f.replace(A_SPEC_END, A_SPEC_END + '\n' +
        '             {\n' +
        '               vec3 romN = normalize( normal );\n' +
        // eye_dir is camera->surface in the ROM; vViewPosition is surface->camera, so the ROM's
        // `dot( normal, -eye_dir )` is dot( N, normalize(vViewPosition) ) here.
        '               vec3 romV = normalize( vViewPosition );\n' +
        '               vec3 romF = uF0 + ( vec3( 1.0 ) - uF0 ) * pow( 1.0 - clamp( dot( romN, romV ), 0.0, 1.0 ), 5.0 );\n' +
        '               vec3 romMap = ( uSpecOn > 0.5 ) ? gRomSpecRGB / max( gGloss, 1e-4 ) : vec3( 1.0 );\n' +
        '               vec3 romMul = mix( vec3( 1.0 ), romF * romMap, uRomSpecAmount );\n' +
        '               reflectedLight.directSpecular   *= romMul;\n' +
        '               reflectedLight.indirectSpecular *= romMul;\n' +
        '             }');
    } else { misses.push('specEnd'); }

    sh.fragmentShader = f;
  });
  mat.userData.romSpecular = true;
  return mat;
}

// Review knob: 0 leaves the shared path untouched, 1 is the ROM's scope.
export function setRomSpecularAmount(a){
  for (const m of tracked) if (m.userData.u && m.userData.u.uRomSpecAmount) m.userData.u.uRomSpecAmount.value = a;
}
const tracked = new Set();
export function trackRomSpecular(mat){ tracked.add(mat); }
