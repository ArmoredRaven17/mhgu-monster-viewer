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

// Call after each mount. `root` is the object the monster's meshes hang under (stage.world).
export function setEyeGlow(monId, root){
  pairs = [];
  const spec = EYE_GLOW[monId];
  if (!spec || !root) return;
  const rays = [], eyes = [];
  root.traverse(o => {
    if (!o.isMesh || o.userData.proxy || !o.material) return;
    // Leave the ROM's own material state alone -- its RSMeshBias (a toward-camera depth bias,
    // recomputed per camera by setBiasUnitsPerStep) and DSZTestWrite depth-write are what place this
    // deep glow shape on the surface; earlier attempts to drop them here only pushed it deeper.
    if (o.material.name === spec.ray){ o.material.transparent = true; rays.push(o); }
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
