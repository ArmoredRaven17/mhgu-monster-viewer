// BARIOTH'S EYE GLOW -- an easter egg to Monster Hunter Tri, done the ROM's way.
//
// em042_00 has TWO face states, calm and enraged, and the ROM swaps the whole set on rage. Each state
// carries its own eyeball (XfB__m00_eye) AND its own additive glow ray (XfB__m01_ray, state BSAddAlpha
// / blend `add`), sitting on the eye. So there are two glow effects, one per face, and the ROM only
// ever draws the current state's -- exactly as it swaps the eyeballs. In Tri those additive eyes lit
// up the dark Tundra caves; MHGU kept the meshes but has no dark areas, so they read as nothing.
//
// The viewer files every `add` mesh under one "effect layer" and hides it (monster.js
// `o.userData.effect = true`), which suppressed the eye glow entirely. Here we let it draw, but the
// ROM way:
//   * each ray follows its OWN eyeball's visibility -- the calm ray only while the calm eye shows,
//     the enraged ray only while the enraged eye shows. This is the "two effects / two face states"
//     swap; without it the enraged glow leaks into the calm state.
//   * on top of that it rides the scene lighting: an additive glow blooms against darkness and washes
//     out under bright light, so as you dim the Lighting rig the eyes light up. The lighting ramp is
//     the easter-egg part; the calm/enraged gating is the ROM.

const EYE_GLOW = { em042_00: { ray: 'XfB__m01_ray', eye: 'XfB__m00_eye' } };

// Ramp from the summed light intensity (the metric __view.tone reports). The studio rig's default
// total is ~4.85 (glow off); below HI it ramps in, at/under LO it is full. Easter-egg values.
const HI = 2.2, LO = 0.3;

let pairs = [];   // [{ ray, eye }] -- each glow ray with the eyeball of the same face state

// A SMALL, HAND-SET forward nudge for the glow -- the one place this module is deliberately not
// ROM-faithful. This eye glow is a dormant MH-Tri feature MHGU never actually renders (Tri lit it
// in dark caves; MHGU has none), so there is no in-game placement to match. Raven, 2026-09-18:
// "since this isn't something 'in game' technically but a part of a previous generation, we can
// manually adjust this one effect", "it just needs a small shift forward". In the calm (brow-lowered)
// face the brow clips the additive ray; in the enraged (brow-raised) face it does not. We push the ray
// a hair toward the camera in view space so it draws OVER the brow. Where nothing occludes it (enraged)
// a depth push changes nothing, so this needs no per-state gating. Tune live with window.__eyeShift(v)
// -- a per-effect cosmetic value, NOT a ROM one.
const SHIFT = { value: 0.1 };   // view-space units toward the camera
function installShift(mat){
  if (mat.userData._eyeShift) return;
  mat.userData._eyeShift = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = function(sh, renderer){
    if (prev) prev.call(this, sh, renderer);
    sh.uniforms.uEyeShift = SHIFT;
    sh.vertexShader = 'uniform float uEyeShift;\n' + sh.vertexShader.replace(
      '#include <project_vertex>',
      'vec4 mvPosition = vec4( transformed, 1.0 );\n\tmvPosition = modelViewMatrix * mvPosition;\n\tmvPosition.z += uEyeShift;\n\tgl_Position = projectionMatrix * mvPosition;');
  };
  mat.customProgramCacheKey = function(){ return (prevKey ? prevKey.call(this) : '') + '|eyeglow-shift-v1'; };
  mat.needsUpdate = true;
}

// Call after each mount. `root` is the object the monster's meshes hang under (stage.world).
export function setEyeGlow(monId, root){
  pairs = [];
  const spec = EYE_GLOW[monId];
  if (!spec || !root) return;
  const rays = [], eyes = [];
  root.traverse(o => {
    if (!o.isMesh || o.userData.proxy || !o.material) return;
    // Keep the ROM's own material state (RSMeshBias depth bias + DSZTestWrite) as-is; on top of it
    // installShift adds the small hand-set view-space nudge that lifts the calm glow over the brow.
    if (o.material.name === spec.ray){ o.material.transparent = true; installShift(o.material); rays.push(o); }
    else if (o.material.name === spec.eye) eyes.push(o);
  });
  // The ROM lists the calm face-state meshes before the enraged ones (calm eye prim 14 < enraged 15,
  // calm ray 12 < enraged 13), so the n-th ray belongs to the n-th eye's state.
  const byPrim = (a, b) => (a.userData.prim || 0) - (b.userData.prim || 0);
  rays.sort(byPrim); eyes.sort(byPrim);
  for (let i = 0; i < Math.min(rays.length, eyes.length); i++) pairs.push({ ray: rays[i], eye: eyes[i] });
}

// Call after mount, and whenever the Lighting rig or the rage state changes. `lights` is any iterable
// of THREE lights whose summed intensity stands in for how bright the scene is now.
export function updateEyeGlow(lights){
  if (!pairs.length) return;
  let total = 0;
  for (const L of lights) total += (L && L.intensity) || 0;
  const op = Math.max(0, Math.min(1, (HI - total) / (HI - LO)));
  for (const { ray, eye } of pairs){
    ray.material.opacity = op;
    // only this face state's glow (the ROM swap), and only once the scene is dark enough (the ramp)
    ray.visible = eye.visible && op > 0.002;
  }
}

// Live tuning for the hand-set forward nudge above (Raven dials this one effect by eye).
if (typeof window !== 'undefined'){
  window.__eyeShift = (v) => { if (v !== undefined) SHIFT.value = +v; return SHIFT.value; };
}
