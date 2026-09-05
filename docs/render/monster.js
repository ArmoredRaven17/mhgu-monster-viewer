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
// It leaves one known oddity, which is a question for Raven rather than a rule: on Rathian the
// first alternative of the pair {1: an 18-vertex patch in the body material, 9: a 28-vertex
// mesh in the EYE material} hides the eye mesh.
export function defaultGroupsOn(groups, _partVerts){
  const on = (groups || []).map(() => false);
  for (const c of clusterGroups(groups)) on[c.members[0]] = true;
  return on;
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
    o.frustumCulled = false;              // bind-pose bounds, same as the armour
    prim++;
    o.userData.prim = prim;
    if (hideIdx.has(prim) || (hideSig && hideSig.has(part + '#' + verts))){
      o.visible = false; o.userData.proxy = true; return;
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
