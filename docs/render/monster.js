// Monsters (arc/enemy): the model, its materials, the part-visibility groups. Everything here
// is read from docs/monsters.json (harvest-monsters.py) and docs/materials.json; the clips are
// played by render/pose.js on a clone of the model itself (the motion files ship nodes and
// animations only).
//
// What the ROM gives a monster that the hunter never had:
//   normal map   tNormalMap (_NM_MIRROR), FBump = BumpNormalMap. The converter decodes it to a
//                plain tangent-space map (mean 127/128/246, |n| = 0.99 on Rathian). Whether its
//                green channel is +Y (as three.js reads it) or -Y is NOT read from the ROM:
//                `normalOpt.flipY` is the comparison knob, Raven judges by eye.
//   reflection   FReflect = GlobalCubeMap, the stage's own reflection -- no stand-in, no term
//   eye          nDraw::MaterialConstantFog with FAlbedoMapConstant: the map as an unlit colour
//   parts        the mesh table's draw mask (bit 0) marks the LOD / proxy layer, listed per
//                model as `hide` [part, verts]; rMonsterPartsManager's groups switch the rest
import * as THREE from 'three';
import { loadGlb, getTexture, loader, poseCache } from './assets.js';
import { skeletonClone, meshGroupId } from './skeleton.js';
import { createMaterial, setSpecTexture, allMats } from './material.js';
import { specFor, refForGlb } from './materials-db.js';

// every material a monster mesh was given (the debug knobs walk this)
export const monsterMats = [];

// Unmounting a monster has to give its materials back. The viewer steps through 130 of them
// in one sweep, and both registries are plain arrays that only ever grew in the Armor Viewer
// -- a wireframe toggle then walks materials nobody can see, and the GPU keeps every shader
// program alive. Textures are NOT disposed: the asset cache shares them between monsters.
export function releaseMonster(root){
  if (!root) return;
  const mine = new Set(root.userData.mats || []);
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    if (o.material) mine.add(o.material);
    if (o.geometry) o.geometry.dispose();
  });
  for (const m of mine){
    let i = monsterMats.indexOf(m); if (i >= 0) monsterMats.splice(i, 1);
    i = allMats.indexOf(m); if (i >= 0) allMats.splice(i, 1);
    m.dispose();
  }
}
export const normalOpt = { flipY: false, scale: 1 };
export function setNormalOpt(flipY, scale){
  normalOpt.flipY = !!flipY;
  normalOpt.scale = (scale === undefined) ? normalOpt.scale : +scale;
  for (const m of monsterMats)
    if (m.normalMap) m.normalScale.set(normalOpt.scale, normalOpt.flipY ? -normalOpt.scale : normalOpt.scale);
}

// ---- part visibility ------------------------------------------------------------------------
// rMonsterPartsManager lists groups of { part, drawn }. Consecutive groups over the SAME part
// set are alternatives of one swap (Rathian: [1 on, 9 off] then [1 off, 9 on]; the Dreadqueen
// has a triple over {8, 11, 12, 101}). Which alternative the game applies at spawn is not read
// yet: the default takes the FIRST of each cluster, a hypothesis for Raven to check in game.
export function clusterGroups(groups){
  // Grouped by the SET OF PARTS a group names, wherever those groups sit in the table. An
  // earlier version merged only ADJACENT groups, which is how most monsters are authored but
  // not all: Nakarkos repeats the {1, 2, 11, 12} set away from its first appearance, so the
  // repeat became a cluster of its own, was switched on as "the first of its cluster", and
  // ran after the real one -- forcing parts 1 and 2 off on a monster that should show them.
  const order = [], byKey = new Map();
  (groups || []).forEach((g, i) => {
    const key = g.map(e => e[0]).sort((a, b) => a - b).join(',');
    let c = byKey.get(key);
    if (!c){ c = { parts: key, members: [] }; byKey.set(key, c); order.push(c); }
    c.members.push(i);
  });
  return order;
}
// Which alternative of each cluster a monster SPAWNS with is not stated in the ROM as far as
// this has been read, so the default takes the FIRST group of each cluster -- the game's own
// order, which assumes nothing.
//
// A "the alternative that draws the most geometry" rule was tried, on the reasoning that an
// intact part has more vertices than the stump that replaces it. It was wrong, and measurably:
// across the 40 monsters that carry an additive EFFECT mesh (rage auras, glows, blood) it
// switched those on for 29 of them -- 15 on Boltreaver Astalos, 9 on Astalos, 8 on Zinogre,
// 6 on Akantor, where the ROM's own order draws none (Raven, 2026-09-04: "a lot of monsters
// appear to have meshes that are either rendered incorrectly or we are rendering effects
// incorrectly like the CB ran into with its glow effects"). An effect mesh is often the larger
// half of its pair, so "most geometry" selects for exactly the wrong thing.
//
// ONE exception, settled by Raven 2026-09-05 ("a lot of monsters have a part for their eyes, I
// would like to have Eyes Open by default"): where first-of-cluster leaves a monster drawing no
// eye mesh AT ALL, the cluster holding an eye is switched to the alternative that draws one.
// On Rathian that is the pair {1: an 18-vertex patch in the body material, 9: a 28-vertex mesh in
// the EYE material}, whose first member hides 9.
//
// It is deliberately narrow. It fires only when NOT ONE eye mesh is drawn, so the 67 monsters
// that already show an eye keep the ROM's own order untouched -- including the ones with several
// eye parts, where forcing them all on would stack an open eye over a closed one. Measured over
// the library: 87 monsters carry an eye part, 67 already draw one, and this moves the remaining
// 20 (the Rath pair and their Deviants, Basarios, Gravios, Diablos, Congalala, Uragaan, Zinogre,
// Lagombi, Hellblade Glavenus, Astalos).
// Parts a monster should not open with, per monster, whatever the ROM's own order says. Raven's
// calls, made while reviewing that monster -- exceptions granted on verification, not taken while
// building. 2026-09-05: "Congalala, turn off parts 12-18 by default."
// 2026-09-06: "Fatalis line Parts 1, 10 off by default" -- all three share the entry.
// The mirror of DEFAULT_PARTS_OFF: parts a monster should OPEN with, over the ROM's own order.
// Raven's calls on verification, same rule as above.
// 2026-09-06, Savage Deviljho: "Savage has an effect that covers his eyes ... I want to render this
// as well", then "Wire it in". Part 6 is Group6 -- 40 vertices, XfB__m02_body_k (BSAddAlpha, bias
// -512, Constant), the only additive mesh anywhere near the eyes: 0.265 from the eye mesh's centre
// and enclosing its whole bounding box, where the next effect mesh is 2.0 away and six times the
// size. The part table leaves it closed.
export const DEFAULT_PARTS_ON = {
  em043_05: [6],                            // Savage Deviljho, the eye effect
};
export const DEFAULT_PARTS_OFF = {
  em021_00: [12, 13, 14, 15, 16, 17, 18],   // Congalala
  em013_00: [1, 10],                        // Fatalis
  em013_01: [1, 10],                        // Crimson Fatalis
  em013_02: [1, 10],                        // Old Fatalis
};
export function defaultGroupsOn(groups, _partVerts, eyeParts, effectParts, forceOff, forceOn){
  const on = (groups || []).map(() => false);
  const cl = clusterGroups(groups);
  for (const c of cl) on[c.members[0]] = true;
  const eyes = eyeParts instanceof Set ? eyeParts : new Set(eyeParts || []);
  if (!eyes.size) return applyForcedOn(groups, applyForcedOff(groups, on, forceOff), forceOn);
  const drawsAnEye = state => {
    const drawn = new Map();
    (groups || []).forEach((g, i) => { if (state[i]) for (const [p, v] of g) drawn.set(p, v); });
    for (const p of eyes) if (drawn.get(p) !== false) return true;
    return false;
  };
  if (drawsAnEye(on)) return applyForcedOn(groups, applyForcedOff(groups, on, forceOff), forceOn);
  // Every alternative that would show an eye is scored, and the one lighting the FEWEST effect
  // meshes wins. Taking the first that worked switched 2 of Amatsu's rage/glow meshes on to get
  // its eye, and one more of Hellblade Glavenus's -- undoing the 2026-09-04 finding that an
  // effect mesh is often the larger half of its pair. A tie keeps the earlier alternative, which
  // is the ROM's own order.
  const fx = effectParts instanceof Set ? effectParts : new Set(effectParts || []);
  const litEffects = state => {
    const drawn = new Map();
    (groups || []).forEach((g, i) => { if (state[i]) for (const [p, v] of g) drawn.set(p, v); });
    let n = 0;
    for (const p of fx) if (drawn.get(p) !== false) n++;
    return n;
  };
  const floor = litEffects(on);
  let best = null, bestCost = Infinity;
  for (const c of cl){
    if (c.members.length < 2) continue;
    for (const m of c.members){
      const trial = on.slice();
      for (const mm of c.members) trial[mm] = (mm === m);
      if (!drawsAnEye(trial)) continue;
      const cost = Math.max(0, litEffects(trial) - floor);
      if (cost < bestCost){ best = trial; bestCost = cost;
        if (!cost) return applyForcedOn(groups, applyForcedOff(groups, best, forceOff), forceOn); }
    }
  }
  return applyForcedOn(groups, applyForcedOff(groups, best || on, forceOff), forceOn);
}
// The per-monster "start with these parts off" list, applied last so it wins over the ROM's order
// AND over the eye rule. For each part named, the cluster that owns it is switched to whichever of
// its alternatives sets that part false; a cluster with no such alternative is left alone rather
// than forced, since nothing there can turn the part off.
// Turn a wanted part ON by choosing, within its cluster, an alternative that draws it. Same shape
// as applyForcedOff and deliberately run AFTER it, so an explicit "on" wins a collision.
function applyForcedOn(groups, on, want){
  if (!want || !want.length) return on;
  const cl = clusterGroups(groups);
  const wanted = new Set(want);
  for (const c of cl){
    const parts = c.parts.split(',').map(Number);
    if (!parts.some(p => wanted.has(p))) continue;
    for (const m of c.members){
      const g = groups[m] || [];
      const ok = parts.filter(p => wanted.has(p))
                      .every(p => g.some(e => e[0] === p && e[1]));
      if (!ok) continue;
      for (const mm of c.members) on[mm] = (mm === m);
      break;
    }
  }
  return on;
}
function applyForcedOff(groups, on, off){
  if (!off || !off.length) return on;
  const cl = clusterGroups(groups);
  const want = new Set(off);
  for (const c of cl){
    const parts = c.parts.split(',').map(Number);
    if (!parts.some(p => want.has(p))) continue;
    for (const m of c.members){
      const g = groups[m] || [];
      // this alternative turns every wanted part in the cluster off
      const ok = parts.filter(p => want.has(p))
                      .every(p => g.some(e => e[0] === p && !e[1]));
      if (!ok) continue;
      for (const mm of c.members) on[mm] = (mm === m);
      break;
    }
  }
  return on;
}
// part ids drawn in one of the game's own additive or reverse-subtractive materials -- the rage
// auras and glows the part default is careful not to switch on
export function effectPartIds(root){
  const out = new Set();
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh) || o.userData.proxy) return;
    if (o.userData.effect) out.add(o.userData.part);
  });
  return out;
}
// The part ids a mounted model draws in a material the game named for an eye. Read off the
// model rather than baked, so it needs no rebuild and cannot drift from what is on screen.
export function eyePartIds(root){
  const out = new Set();
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh) || o.userData.proxy) return;
    if (o.userData.eye) out.add(o.userData.part);
  });
  return out;
}

// part id -> the vertices a mounted model draws for it (the proxy layer excluded)
export function partVerts(root){
  const m = new Map();
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh) || o.userData.proxy) return;
    const p = o.userData.part;
    m.set(p, (m.get(p) || 0) + o.geometry.attributes.position.count);
  });
  return m;
}
// part -> drawn, from the groups switched on, applied in order (a later group wins)
export function partsDrawn(groups, on){
  const drawn = new Map();
  (groups || []).forEach((g, i) => { if (on && on[i]) for (const [p, v] of g) drawn.set(p, v); });
  return drawn;
}
// a part no group mentions stays drawn; the proxy layer never draws
export function applyParts(root, drawn){
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh) || o.userData.proxy) return;
    const v = drawn.get(o.userData.part);
    o.visible = (v === undefined) ? true : v;
  });
}
export function groupLabel(g){
  const on = g.filter(e => e[1]).map(e => e[0]), off = g.filter(e => !e[1]).map(e => e[0]);
  return (on.length ? 'on ' + on.join(', ') : '') + (on.length && off.length ? '  /  ' : '') + (off.length ? 'off ' + off.join(', ') : '');
}

// Can applying this group change what is drawn, under ANY selection of the others?
//
// applyParts defaults a part the table does not mention to VISIBLE, so a group that only ever
// says "true" re-asserts what is already the case. It can still matter if some OTHER group
// turns one of its parts off, because the later group wins -- but if nothing does, the group is
// inert and offering it as a choice is a control that cannot do anything (Raven, 2026-09-05:
// "a lot of monsters have Parts that have 'not applied' but I don't see anything that changes").
//
// Measured over the library: 85 of the 625 part rows have a single member, and 84 of those are
// inert -- 83 because every entry is true, and Royal Ludroth's because the only part it turns
// off is 100, the proxy layer, which carries no drawn geometry. They are the ROM's base state,
// worth SHOWING but not worth offering as a switch.
export function groupIsInert(groups, index, partIds){
  const g = (groups || [])[index];
  if (!g) return true;
  const real = new Set(partIds || []);
  const mine = new Set(g.map(e => e[0]));
  // it turns a part with actual geometry off: a real choice
  if (g.some(e => !e[1] && real.has(e[0]))) return false;
  // something else turns one of its parts off, so re-asserting true is a real override
  const contested = (groups || []).some((og, j) =>
    j !== index && og.some(e => !e[1] && mine.has(e[0])));
  return !(contested && g.some(e => real.has(e[0])));
}

// ---- borrowed motion lists -------------------------------------------------------------------
// The game gives one monster another's motion list: Rathalos plays Rathian's lists 0-3,
// Genprey and Ioprey play Velociprey's, Nargacuga borrows one of Tigrex's. 18 monsters and 57
// lists in all. The animation file names its tracks after the model it was converted onto, and
// those names are "<localIndex>:<globalBoneId>" -- so a borrowed list names the same bones by
// the OWNER's local indices, and binding by name leaves most of the skeleton unmoved (30 of
// Rathalos' 41 tracks). The GLOBAL ids match exactly on every one of the 57, which is how the
// game itself binds (through the MOD's function-id map), so the fix is a rename, not a copy:
// retarget each track name to the local index THIS model uses for that global id. Shipping a
// private copy per borrower would have cost 76 MB to say the same thing.
// The clip to play, with a borrowed list's track names retargeted onto this model.
//
// 18 monsters play another monster's motion list -- the game itself does this: Rathalos uses
// Rathian's lists 0-3, Genprey and Ioprey use Velociprey's, Nargacuga borrows one of
// Tigrex's. The file is converted onto its OWNER's model, so its tracks carry the owner's
// node names, and binding by name leaves most of the borrower's skeleton unmoved (30 of
// Rathalos' 41 tracks). The bones themselves match: it is the "<localIndex>:" prefix that
// differs, not the global bone id after it.
//
// The map cannot be worked out here, because three.js STRIPS the colon out of a node name --
// "10:6" and "1:06" both arrive as "106" and the id is gone. So harvest-monsters.py computes
// it where the names are still intact and ships it per list as `remap` (sanitised name ->
// sanitised name), with `dropped` naming any bone the borrower's skeleton does not have at
// all (Iodrome has no 80 or 90). The game ignores those tracks; so does this.
export async function clipFor(list, clipName, modelUrl){
  let anim = poseCache.get('anim:' + list.file);
  if (!anim){ anim = await loader.loadAsync(list.file); poseCache.set('anim:' + list.file, anim); }
  const src = THREE.AnimationClip.findByName(anim.animations, clipName);
  if (!src) return null;
  const remap = list.remap;
  if (!remap || !Object.keys(remap).length) return src;
  const key = 'retarget:' + modelUrl + ':' + list.file + ':' + clipName;
  const cached = poseCache.get(key);
  if (cached) return cached;
  const model = await loadGlb(modelUrl, modelUrl);
  const have = new Set();
  model.scene.traverse(o => { if (o.name) have.add(o.name); });
  const out = src.clone(), keep = [];
  let moved = 0, lost = 0;
  for (const t of out.tracks){
    const dot = t.name.lastIndexOf('.');
    const node = t.name.slice(0, dot), prop = t.name.slice(dot);
    if (have.has(node)){ keep.push(t); continue; }
    const want = remap[node];
    if (want){ t.name = want + prop; moved++; keep.push(t); }
    else lost++;
  }
  out.tracks = keep;
  out.userData = { retargeted: moved, unresolved: lost };
  poseCache.set(key, out);
  return out;
}

// ---- the model ------------------------------------------------------------------------------
// rec: a model record of monsters.json (the monster itself, or one of its `parts`); opt.tex is
// the monster's staged textures by name, the fallback when materials.json has no entry.
// ctx: { wire }
export async function loadMonster(rec, opt, ctx){
  const gltf = await loadGlb(rec.glb, rec.glb);
  const root = skeletonClone(gltf.scene);
  // WHICH PRIMITIVES ARE THE PROXY LAYER, by ordinal in the file's own order (harvest
  // computes it against the MOD's draw mask). It used to be a set of "part#vertexCount"
  // signatures, which silently hid REAL geometry wherever a drawn mesh happened to share a
  // part and vertex count with a proxy one -- em020_04 lost meshes that way.
  const hideIdx = new Set(rec.hideIdx || []);
  const hideSig = rec.hideIdx ? null : new Set((rec.hide || []).map(h => h[0] + '#' + h[1]));
  // ems017_00 "Great Thunderbug" renders nothing, and no change here can alter that. Its whole
  // .mod is 964 bytes: one bone, one mesh, three vertices at (0,0,0) (1,0,0) (0.5,1,0) -- a
  // placeholder triangle -- and its only texture is 16x16 with ALPHA 0 ON ALL 256 PIXELS, so
  // the alpha test discards every fragment. Un-hiding its proxy primitive was tried: the
  // triangle does reach the GPU (1 draw call, 1 triangle) and is still invisible. The game
  // ships the monster as a stub and draws the real swarm some other way. Checked 2026-09-05
  // against Raven's "if we know what the issue is, we can fix the rendering to ensure it is
  // rendered" -- there is no geometry to fix, only a listing decision.
  let prim = -1;
  const ref = refForGlb(rec.glb);
  const texByName = (opt && opt.tex) || {};
  const fallback = re => { const k = Object.keys(texByName).find(k => re.test(k)); return k ? texByName[k] : null; };
  const jobs = [], mats = [];
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    const srcName = (o.material && o.material.name) || '';
    const verts = o.geometry.attributes.position.count;
    const part = meshGroupId(o);
    o.userData.part = part;
    // recorded here, off the model file's OWN material name, because the material is replaced
    // below and replaced again by the heat map -- by then the name is gone
    if (/eye/i.test(srcName)) o.userData.eye = true;
    o.frustumCulled = false;              // bind-pose bounds, same as the armour
    prim++;
    o.userData.prim = prim;
    // MARKED, NOT SKIPPED. This used to `return` here, which meant a mask-hidden mesh never got
    // its ROM material at all -- it kept the loader's default and rendered flat grey the moment
    // anything made it visible (Raven, 2026-09-06, on the new Debug toggle: "The mesh shows grey
    // all throughout his body"). It costs nothing to build the material for a mesh that is not
    // drawn, and it means the LOD layer can actually be LOOKED at.
    if (hideIdx.has(prim) || (hideSig && hideSig.has(part + '#' + verts))){
      o.visible = false; o.userData.proxy = true;
    }
    const rom = specFor(ref, srcName);
    // A mesh the game DRAWS but whose material its own material file does not define. The
    // model file names the material "Scene_Material" and the .mrl has no entry for it, so
    // there is no texture to bind and no ROM answer for what it should look like: 8 monsters,
    // 15 meshes, among them Valstrax's wings. Their mesh-table mask is 0xffff where every
    // other drawn mesh is 0xefff, which may or may not mean something. Drawn by default,
    // untextured; the Debug panel can hide them so the two readings can be compared.
    if (!rom && /^Scene_Material$/i.test(srcName)) o.userData.undefinedMaterial = true;
    // The EFFECT meshes: the game's own overlay blend states, the same class as the Charge
    // Blade's phial glow. 75 additive materials over 44 monsters -- rage auras, blood, light
    // rays, bomb mode -- plus 3 reverse-subtractive ones that DARKEN rather than glow (Khezu's
    // m03_blood, Old Fatalis' m01_face_sub, Grimclaw Tigrex's m60_angry_arm). Both are layers
    // the game switches on in a state this viewer does not model -- wounded, enraged -- so they
    // are one class the Parts panel turns off together (Raven, 2026-09-04, on Khezu: "they are
    // covered in, what I believe is a mesh since we are handling effects").
    if (rom && rom.state && (rom.state.blend === 'add' || rom.state.blend === 'revsub'))
      o.userData.effect = true;
    // AN OVERLAY WHOSE ALBEDO THIS VIEWER CANNOT COMPUTE. The ROM builds these from TWO maps:
    // the base albedo modulated (TypeExtendModulate) or added (TypeExtendAdd) with a second
    // texture, tAlbedoBlendMap, sampled through a second UV set and offset by the material
    // animation. material.js implements only the first map, so drawn they are the raw base
    // texture at full strength -- Khezu's blood as black veins over its back and wings
    // (Raven, 2026-09-04: "Khezu has black veins again ... I suspect this is the enraged
    // effect, but not being rendered correctly"). 13 such overlays over 11 monsters: Akantor's
    // kekkan (血管, blood vessel), both Tigrexes' angry and blood, both Glavenuses', both
    // Astaloses' tikuden, Alatreon, Nakarkos' shell.
    //
    // Hidden by default and exposed in Debug, exactly as the meshes whose material the game's
    // own file does not define. Two deliberate exclusions:
    //   * OPAQUE extend materials are left drawn -- Crystalbeard Uragaan's m00_ore is body
    //     geometry on head, body and tail, not an overlay, so hiding it would delete part of
    //     the monster. It renders with half its intended albedo, which is a lesser wrong.
    //   * every effect Raven judged as looking RIGHT is a single-map material (Brachydios'
    //     slime, Agnaktor's lava, Teostra's, Valstrax's), so none of them is affected.
    if (rom && rom.feat && /^TypeExtend/.test(String(rom.feat.albedo)) &&
        rom.state && rom.state.blend !== 'opaque') o.userData.extendAlbedo = true;
    // the ROM's own material class: Std is lit, MaterialConstant / MaterialConstantFog are
    // the map as a flat colour (a monster's eye). material.js's unlit path is opt-in and
    // honours the cull mode and blend state either way.
    const mat = createMaterial({ srcName, rom, alphaCut: 0, noTint: true,
                                 unlit: !!(rom && rom.cls && rom.cls !== 'Std'),
                                 wire: !!(ctx && ctx.wire) });
    o.material = mat; allMats.push(mat); monsterMats.push(mat); mats.push(mat);
    if (mat.userData.renderOrder) o.renderOrder = mat.userData.renderOrder;
    const albedo = (rom && rom.albedo) || fallback(/_bm$/i);
    if (albedo) jobs.push(getTexture(albedo).then(t => {
      mat.map = t; if (mat.userData.emissiveFromMap) mat.emissiveMap = t; mat.needsUpdate = true; }));
    const normal = (rom && rom.normal) || fallback(/_nm/i);
    if (normal && mat.isMeshStandardMaterial) jobs.push(getTexture(normal, { linear: true }).then(t => {
      mat.normalMap = t;
      mat.normalScale.set(normalOpt.scale, normalOpt.flipY ? -normalOpt.scale : normalOpt.scale);
      mat.needsUpdate = true; }));
    if (rom && rom.spec && !rom.specIsAlbedo) jobs.push(getTexture(rom.spec).then(t => setSpecTexture(mat, t)));
  });
  await Promise.all(jobs);
  root.userData.joints = rec.joints || [];
  root.userData.mats = mats;
  // The pose driver writes bone transforms straight onto these nodes, so once a clip has
  // played there is nothing left that remembers the rest pose. Snapshot it here; the Clip
  // select's "Bind pose" entry restores it (before this, choosing it simply froze the
  // monster on the last frame it happened to be showing).
  root.userData.bind = [];
  root.traverse(o => root.userData.bind.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]));
  return root;
}

// Show or hide the additive EFFECT meshes as a class.
// HIDE-ONLY. Switching effects back on must not make a mesh the part table turned off
// visible: the table is the game's own answer and this toggle is a view of a class on top of
// it. So `on` simply means "leave the part table's decision alone".
export function setEffectVisible(root, on){
  if (on) return;
  root.traverse(o => { if (o.userData.effect) o.visible = false; });
}

// Show or hide the meshes whose material the ROM's material file does not define.
// Reveal the meshes the ROM's own draw mask hides. Bit 0 of the mesh table's +0 word is what the
// bake reads (MASK_DRAWN), and everything without it is marked userData.proxy and never drawn --
// 679 meshes at mask 0xe4c0, 997 at 0x0020, 223 at 0x0000 across the library. But bit 0 is not the
// whole word: there are FOURTEEN distinct masks, and Great Thunderbug's only mesh is 0xecd2, a
// value nothing else in the game uses, which is why that monster renders as an empty stage.
// Raven, 2026-09-06: "we may need the proxy layers, we know thunderbug is a proxy layer render",
// and "let's open the options as wide as possible to see what insights we can gleam". So this is a
// LOOKING tool, not a claim that these should draw -- it shows what the mask is holding back so the
// mask itself can be decoded against the ROM.
export function setProxyVisible(root, on){
  root.traverse(o => { if (o.userData && o.userData.proxy) o.visible = !!on; });
}
export function proxyCount(root){
  let n = 0;
  root.traverse(o => { if (o.userData && o.userData.proxy) n++; });
  return n;
}

export function setUndefinedMaterialVisible(root, on){
  root.traverse(o => { if (o.userData.undefinedMaterial) o.visible = !!on; });
}

// Show or hide the overlays whose albedo needs a second map this viewer does not sample.
// Hide-only in the same sense as setEffectVisible: turning it back off returns the mesh to
// whatever the part table said, rather than forcing on something the table had switched off.
export function setExtendVisible(root, on){
  root.traverse(o => { if (o.userData.extendAlbedo && !on) o.visible = false; });
}

// how many of them a mounted monster carries, for the Debug label
export function extendCount(root){
  let n = 0;
  root.traverse(o => { if (o.userData.extendAlbedo) n++; });
  return n;
}

// a mounted root's bind pose, so "Bind pose" can actually return to it
// put a mounted monster back exactly as it loaded
export function restoreBind(root){
  for (const [node, p, q, sc] of (root && root.userData.bind) || []){
    node.position.copy(p); node.quaternion.copy(q); node.scale.copy(sc);
  }
}


// ---- hit-zone heat map ---------------------------------------------------------------------
// Every drawn vertex carries a hit-zone slot, baked by build-hitzones.py: the nearest rBodyData
// capsule in glb world space, which is how the game itself resolves where a hit lands. Colouring
// by BONE instead was tried and cannot work -- a third to a half of a monster's vertices weight
// to bones with no capsule at all, mostly the root and spine, which is the torso.
//
// The slot indexes the ROM's dt_tune damage table: 8 rows of ten values -- cut, impact, shot,
// fire, water, ice, thunder, dragon, stun, exhaust. Higher means the zone takes more damage.
const heatSaved = new WeakMap();

// Blue is tough, red is soft. A plain hue sweep reads better here than a perceptual ramp
// because the eye needs to rank regions, not read absolute numbers off them.
export function heatColor(t){
  t = Math.max(0, Math.min(1, t));
  const stops = [[0.05, 0.13, 0.42], [0.13, 0.45, 0.70], [0.35, 0.72, 0.62],
                 [0.85, 0.83, 0.35], [0.90, 0.52, 0.20], [0.75, 0.14, 0.16]];
  const x = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
  return [stops[i][0] + (stops[i+1][0] - stops[i][0]) * f,
          stops[i][1] + (stops[i+1][1] - stops[i][1]) * f,
          stops[i][2] + (stops[i+1][2] - stops[i][2]) * f];
}

// Gap detection: every mesh flat-shaded in ONE colour, unlit. Against a chroma backdrop a hole in
// the model shows as backdrop-coloured pixels inside the silhouette, which is far easier to see
// than hunting geometry (Raven, 2026-09-05: "colour the whole monster in a single color that
// contrasts against the chroma key ... much easier to see gaps"). It borrows the heat map's own
// save/restore, so clearHeatmap puts the real materials back.
export function applyFlat(root, rgb, THREE){
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    // Already flat: just recolour it. The theme and backdrop can change while this is on, and
    // building a new material each time would leak one per change.
    if (o.material && o.material.name === 'flat'){
      o.material.color.setRGB(rgb[0], rgb[1], rgb[2]);
      return;
    }
    if (!heatSaved.has(o)) heatSaved.set(o, { mat: o.material, col: o.geometry.getAttribute('color') || null });
    o.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(rgb[0], rgb[1], rgb[2]),
                                               side: o.material.side, name: 'flat' });
  });
}
// zones: { primOrdinal: Uint8Array of slot per vertex }.  value: slot -> number.  max: the
// scale's top, per damage type, so two monsters can be compared.
// The four kinsect extract colours, as the game's own names for them. These are CATEGORIES, not
// ranks, so they are painted literally rather than run through the 0-100 ramp: an extract map
// answers "which colour does this part give me", and a gradient would be a lie about it.
// White is dimmed off pure so it still reads as shaded geometry rather than a silhouette.
export const EXTRACT_RGB = {
  red:    [0.78, 0.16, 0.16],
  orange: [0.90, 0.52, 0.13],
  white:  [0.88, 0.88, 0.90],
  green:  [0.30, 0.68, 0.30],
};

// ---- Material animation -----------------------------------------------------------------------
// Decoded 2026-09-06 and baked into materials.json by build-matanim.py. It ships inside the MRL,
// off the material entry at +0x38, NOT in the LMT and not in the effect system. Each track names a
// shader constant through the shader package -- fUVTransform, fConstantColor, fAlbedoColor,
// fDiffuseColor, fTransparency -- so nothing here is guessed from a field name.
//
// TWO THINGS ARE NOT ESTABLISHED and are handled conservatively rather than invented:
//  * WHICH CLIP PLAYS. A material can carry several (Savage Deviljho's material 0 has a 0.8->1.0
//    and a 1.0->0.8, plainly the enter and exit of some state) and the trigger that selects one is
//    not decoded. The looping clip is used when there is one, else the first -- the looping one is
//    the ambient state, which is what a viewer standing still should show.
//  * THE FRAME RATE. MAT_FPS below is an assumption, not a reading. It sets how fast a loop runs,
//    nothing else; the values and their order are exact either way.
export const MAT_FPS = 30;
// The ENRAGED state, by the ROM's own clip names. A clip's hash is ~crc32 of its name and the names
// are strings in main.rodata, so 117 of the 134 distinct monster clip hashes resolve -- Angry_Start,
// Gekikou_Start, Normal and the rest. Selecting by name makes this general: 12 materials across the
// library carry Angry_Start, and Savage Deviljho adds Gekikou_Start on top.
// Raven, 2026-09-06: "His eyes and the top of his face/head/neck should be covered in an effect once
// enraged", and on what was already drawing: "We have the scarring effect, the small red highlighted
// slices" -- the small eye patch was showing and the large layer over it was not.
const ENRAGE_CLIPS = ['Gekikou_Start', 'Angry_Start', 'Angry', 'angry_loop', 'angry_Change'];
const CALM_CLIPS = ['Gekikou_End', 'Angry_End', 'Normal', 'angry_End'];
// Materials that carry an enraged clip -- the layers the game lights when a monster rages.
export function enrageMaterials(root){
  const out = new Set();
  root.traverse(o => {
    const m = o.material, rom = m && m.userData && m.userData.rom;
    for (const c of (rom && rom.anim) || [])
      if (c.name && ENRAGE_CLIPS.indexOf(c.name) >= 0) out.add(m.name);
  });
  return out;
}
// The part ids whose meshes use those materials, so the part table can be asked to open them.
export function enrageParts(root){
  const mats = enrageMaterials(root), out = new Set();
  root.traverse(o => {
    const m = o.material;
    if (m && mats.has(m.name) && o.userData && o.userData.part !== undefined) out.add(o.userData.part);
  });
  return out;
}
const animBase = new WeakMap();

function sampleTrack(tr, f){
  const k = tr.keys;
  if (!k || !k.length) return null;
  if (k.length === 1 || f <= k[0][0]) return k[0].slice(1);
  const last = k[k.length - 1];
  if (f >= last[0]) return last.slice(1);
  let i = 0;
  while (i < k.length - 1 && k[i + 1][0] <= f) i++;
  const a = k[i], b = k[i + 1];
  if (tr.interp === 0) return a.slice(1);          // hold
  // linear. interp 2 is cubic Hermite in the game and its tangent formula is UNVERIFIED, so it
  // falls back to linear here: the keys are right and the path between them may not be.
  const span = b[0] - a[0];
  const t = span > 0 ? (f - a[0]) / span : 0;
  const out = [];
  for (let c = 1; c < a.length; c++) out.push(a[c] + (b[c] - a[c]) * t);
  return out;
}

// A track WRITES its shader constant; it does not scale the shipped one. That distinction is not
// cosmetic: Savage Deviljho's Gekikou decal ships fTransparency 0.0 and fDiffuseColor (0,0,0) --
// deliberately invisible until the clip runs -- so multiplying by the static value pinned it at
// zero for ever and the effect could never appear. The static values ARE the animation's frame-0
// state, which is why they look like "off".
// The lit path folds the ROM's albedo tint into material.color as glob.albedo * cbm.diffuse, so an
// animated fDiffuseColor is re-multiplied by glob.albedo rather than replacing the pair.
function baseOf(m){
  let b = animBase.get(m);
  if (!b){
    const rom = m.userData && m.userData.rom;
    const gl = rom && rom.glob;
    b = { color: m.color ? m.color.clone() : null, opacity: m.opacity,
          transparent: m.transparent,
          albedo: (gl && gl.albedo) ? gl.albedo.slice(0, 3) : [1, 1, 1] };
    animBase.set(m, b);
  }
  return b;
}

function applyTrack(m, tr, f){
  const v = sampleTrack(tr, f);
  if (!v) return;
  const b = baseOf(m);
  switch (tr.target){
    case 'fUVTransform': case 'fUVTransform2': case 'fUVTransform3': {
      // offsetU, offsetV, scaleU, scaleV, rotation
      for (const key of ['map', 'emissiveMap', 'alphaMap']){
        const tex = m[key];
        if (!tex) continue;
        tex.offset.set(v[0], v[1]);
        tex.repeat.set(v[2] === 0 ? 1 : v[2], v[3] === 0 ? 1 : v[3]);
        tex.rotation = v[4] || 0;
      }
      break;
    }
    case 'fConstantColor':                      // rgb + alpha, written not scaled
      if (m.color) m.color.setRGB(b.albedo[0] * v[0], b.albedo[1] * v[1], b.albedo[2] * v[2]);
      if (v.length > 3){
        m.opacity = v[3];
        m.transparent = true;
      }
      break;
    case 'fAlbedoColor': case 'fDiffuseColor':
      if (m.color) m.color.setRGB(b.albedo[0] * v[0], b.albedo[1] * v[1], b.albedo[2] * v[2]);
      break;
    // 8 tracks on enrage clips drive this and it had no case at all, so Crimson Fatalis, both
    // Mizutsune, Grimclaw Tigrex and Ahtal-Ka lost the part of their rage that is emission.
    case 'fEmissionColor':
      if (m.emissive) m.emissive.setRGB(v[0], v[1], v[2] === undefined ? v[0] : v[2]);
      break;
    case 'fTransparency':
      m.opacity = v[0];
      m.transparent = true;
      break;
    default: break;                             // a target the viewer has no home for yet
  }
}

// Drive every animated material on a mounted model. tSec is wall time; nothing here touches a
// material that carries no animation block.
export function stepMatAnim(root, tSec, state){
  if (!root) return 0;
  let n = 0;
  root.traverse(o => {
    const m = o.material;
    if (!m || !m.userData) return;
    const rom = m.userData.rom;
    const clips = rom && rom.anim;
    if (!clips || !clips.length) return;
    // pick by NAME when a state is asked for, else the ambient one (looping, else the first)
    let ci = -1;
    if (state){
      const want = state === 'enraged' ? ENRAGE_CLIPS : CALM_CLIPS;
      for (const nm of want){ ci = clips.findIndex(c => c.name === nm); if (ci >= 0) break; }
    }
    if (ci < 0) ci = clips.findIndex(c => c.loop);
    if (ci < 0) ci = 0;
    const clip = clips[ci];
    if (!clip || !clip.frames || !clip.tracks) return;
    const fr = tSec * MAT_FPS;
    const f = clip.loop ? fr % clip.frames : Math.min(fr, clip.frames);
    for (const tr of clip.tracks) if (!tr.unsupported) applyTrack(m, tr, f);
    n++;
  });
  return n;
}

// ---- Hardness ---------------------------------------------------------------------------------
// An attack deflects when the damage multiplier lands under a threshold, and the sharpness half of
// that multiplier is a table of seven floats read out of the executable at .rodata 0x0161e37c.
// PURPLE IS 1.39 IN MHGU, not the 1.44 of the earlier games -- taking it from a published table
// would have been wrong. The full rule, from main.text:
//
//   deflect  <=>  RAW[sharp] * KIND[sharp][k] * max(cutPower*cutHZ, impactPower*impactHZ)/10000  <  T
//
// with the compare at 0x00177ed4 (`vcmpe.f32 s0,s2` / `movwlt sl,#0`, class 0 being the deflect).
// The two powers are the ATTACK's own cut/impact split, two bytes packed at player+0x2b70, so a
// pure cutting attack carries impactPower 0 and only the cut zone counts -- which is why this is
// worked out per damage type rather than once.
//
// KIND is fixed at 1.0 here. It is a 7x6 table at .rodata 0x0161e2bc whose column is picked by the
// attack; only columns 0, 2, 3 and 4 are reachable, and AT GREEN AND ABOVE every one of them is 1.0
// except column 4, which is 1.05. So 1.0 is right for three of the four, and for the weapon path
// that carries no KIND term at all. Column 4 would move a threshold down by a point in places
// (green at 0.25 from >=24 to >=23); it is not modelled because which column is ordinary is not
// established. Below green the columns genuinely swing 0.6 / 0.7 / 1.0 / 1.05.
export const SHARP_RAW  = [0.5, 0.75, 1.0, 1.05, 1.2, 1.32, 1.39];
export const SHARP_NAME = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'White', 'Purple'];
export const SHARP_RGB  = [
  [0.82, 0.18, 0.18],   // red
  [0.88, 0.49, 0.16],   // orange
  [0.91, 0.85, 0.26],   // yellow
  [0.26, 0.75, 0.29],   // green
  [0.25, 0.45, 0.85],   // blue
  [0.93, 0.94, 0.96],   // white
  [0.64, 0.31, 0.85],   // purple
];
// The two thresholds are both in the binary: 0.25 normally, 0.27 when the selector at 0x3a8430
// returns 5. That selector passes through a signed byte taking 1, 3 or 5 and has NOT been
// identified, so both are offered rather than one being presented as the truth.
export const DEFLECT_T = { normal: 0.25, strict: 0.27 };

// How HARD a zone is, expressed the way a player can act on it: the lowest sharpness that does NOT
// bounce off it, or null if even purple does. Raven, 2026-09-06, naming the pane: "update Bounce to
// be Hardness" -- the bounce is the mechanism, the hardness is the property being read.
export function hardnessLevel(hz, t){
  if (!(hz > 0)) return null;
  for (let i = 0; i < SHARP_RAW.length; i++) if (SHARP_RAW[i] * hz / 100 >= t) return i;
  return null;
}
// value: slot -> number, scaled by max through the ramp. colorBySlot: slot -> [r,g,b], used
// literally and taking precedence. A slot in neither comes out at the ramp's floor.
export function applyHeatmap(root, zones, value, max, THREE, colorBySlot){
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    const z = zones[o.userData.prim];
    if (!z) return;
    const n = o.geometry.attributes.position.count;
    if (z.length !== n) return;                 // the bake and the file disagree: leave it alone
    if (!heatSaved.has(o)) heatSaved.set(o, { mat: o.material, col: o.geometry.getAttribute('color') || null });
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++){
      const sl = z[i];
      const c = colorBySlot ? (colorBySlot[sl] || [0.10, 0.11, 0.13])
                            : heatColor(value[sl] === undefined ? 0 : value[sl] / (max || 1));
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
    }
    o.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: o.material.side,
                                            name: 'heat:' + (o.material.name || '') });
    o.material = m;
  });
}

export function clearHeatmap(root){
  root.traverse(o => {
    const sv = heatSaved.get(o);
    if (!sv) return;
    if (o.material && /^heat:/.test(o.material.name || '')) o.material.dispose();
    o.material = sv.mat;
    if (sv.col) o.geometry.setAttribute('color', sv.col);
    else o.geometry.deleteAttribute('color');
    heatSaved.delete(o);
  });
}

// <em>.bin: u32 primCount, primCount x u32 vertexCount, then the slot bytes in primitive order.
// The bin holds TWO equal blocks of one byte per vertex: first the damage-table slot, then the
// .dtt part-record index. They are different part lists (the .bdd names both, at record +6 and
// +8), so damage values are read through the first and kinsect extract through the second.
export function parseZones(buf, prims){
  const dv = new DataView(buf);
  const n = dv.getUint32(0, true);
  const counts = [];
  for (let i = 0; i < n; i++) counts.push(dv.getUint32(4 + i*4, true));
  const head = 4 + n*4;
  const total = counts.reduce((a, b) => a + b, 0);
  const hasParts = buf.byteLength >= head + total * 2;   // a bin from before the part map has one
  const slots = {}, parts = {};
  let off = head, poff = head + total;
  for (let i = 0; i < n; i++){
    slots[prims[i]] = new Uint8Array(buf, off, counts[i]);
    if (hasParts) parts[prims[i]] = new Uint8Array(buf, poff, counts[i]);
    off += counts[i]; poff += counts[i];
  }
  return hasParts ? { slots, parts } : { slots, parts: null };
}
