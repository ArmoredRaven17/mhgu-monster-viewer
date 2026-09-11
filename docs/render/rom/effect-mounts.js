// MODELS A MONSTER'S PROOF EFFECTS HANG ON A JOINT.
//
// An rProofEffectList (.pel) record whose first string resolves to an rModel in the same archive
// attaches that model to one of the monster's joints. Decoded 2026-09-09 (ledger PEL-JOINT-1 and
// PEL-JOINT-2, re-derived here before building on it):
//
//   * the joint is a SIGNED 16-bit number at +0x32 of the record's 160-byte payload, -1 unbound.
//     Over all 17,459 shipped records +0x32 is the only field carrying negatives and the only
//     negative it carries is -1 (52%); its neighbours carry none.
//   * the number is a joint NUMBER, not an array index: the game resolves it as
//     mJoint[table[(u8)n]] with the byte table at model+0x498. That table maps a bone ID to a bone
//     index, so the number IS the bone id -- which is the viewer's `gid`, and why the ids this
//     data asks for (6, 8, 9, 12) are all real gids in Felyne's 14-bone skeleton.
//
// HOW LITTLE THIS COVERS, stated plainly. Of the 605 rModel records in the whole image, 581 are in
// weapon/player archives -- the Armor Viewer's side -- and exactly 24 are in enemy archives, ALL of
// them Felyne (ems007_00): 19 joint-bound across 5 models. The harvester scans every enemy archive
// regardless, so a monster that gains one needs no code change here.
//
// DEFAULT OFF, AND IT HAS TO BE. These are PROOF effects: the game fires them per action, and what
// fires which is a gap -- rProofEffectMotSequenceList is not opened (507 files) and the .pel's own
// 160-byte payload is decoded only at +0x32. Showing all nineteen at once is not what the game
// does, so this is an inspection tool, not a reconstruction. Turning it on shows every bound
// record; showOne() shows a single one.
//
// UNITS AND HANDEDNESS ARE A GAP. Nothing on the decoded path names a length unit or a handedness,
// so the model is attached as a child of the bone with an identity local transform: whatever the
// bone's own space is, it inherits. If a piece sits wrong, that is the unread per-record transform
// in the .pel payload, not a scale to be guessed here.
import * as THREE from 'three';
import { loader, loadJson, getTexture } from '../assets.js';
import { gidBonesOf } from '../skeleton.js';

let table = null;                 // the whole effect-mounts.json
let mats = null;                  // the whole effect-materials.json
let enabled = false;
let rageOn = false;
const live = [];                  // { obj, bone, model, joint, array, index }
const cache = new Map();          // model name -> the loaded glb scene, cloned per use

// A MONSTER WHOSE EFFECT IS DRIVEN BY THE RAGE TOGGLE instead of the inspection switch.
// Raven, 2026-09-11: "Just add the effect to Savage's Enrage state". Listed in
// effect-mounts.json's `_autoOnRage`, so a monster opts in by data rather than by code, and
// Felyne -- whose 19 rows are per-action proof effects that the game fires individually -- keeps
// the old behaviour of showing nothing until asked.
function autoOnRage(id){
  return !!(table && Array.isArray(table._autoOnRage) && table._autoOnRage.indexOf(id) >= 0);
}
export function effectAutoOnRage(id){ return autoOnRage(id); }
export function setEffectRage(on){ rageOn = !!on; }

export async function loadEffectMounts(url){
  if (table) return table;
  table = await loadJson(url || 'effect-mounts.json').catch(() => ({}));
  mats = await loadJson('effect-materials.json').catch(() => ({}));
  return table;
}

// THE ROM'S OWN BLEND STATE AND ALBEDO, and nothing else.
//
// stage-monster-effects.py carries `state` (blend / cull / bias / depth, resolved through mfx by
// build-materials.py's decode_material) and the texture bindings. It does NOT carry the feature
// word or the $Globals / CBMaterial blocks, because the shape of those rows in materials.json is
// derived from a corpus-wide scan and cannot be reproduced for four models without rebuilding the
// whole library. So an effect mesh gets its map and the ROM's blending; it does not get
// fConstantColor, emission, or material animation. Without this it draws as untextured grey, which
// on a stack of alpha cards is a solid blob and tells you nothing about what the mesh is.
function dressEffect(scene, model){
  const rec = mats && mats[model];
  if (!rec) return 0;
  let n = 0;
  scene.traverse(o => {
    const list = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (let i = 0; i < list.length; i++){
      const src = rec.mats && rec.mats[list[i].name];
      if (!src) continue;
      const st = src.state || {};
      const m = new THREE.MeshBasicMaterial({ name: list[i].name, toneMapped: false });
      m.transparent = st.blend !== 'opaque';
      m.depthWrite = st.ds === 'DSZTestWrite' && !m.transparent;
      m.side = st.cull === 'none' ? THREE.DoubleSide
             : (st.cull === 'front' ? THREE.BackSide : THREE.FrontSide);
      if (st.blend === 'add'){ m.blending = THREE.AdditiveBlending; }
      const slot = src.t && src.t.albedo;
      const file = slot && rec.tex && rec.tex[slot - 1];
      if (file) getTexture(file).then(t => { m.map = t; m.needsUpdate = true; });
      m.userData.effectState = st;
      if (Array.isArray(o.material)) o.material[i] = m; else o.material = m;
      n++;
    }
  });
  return n;
}

export function effectMountsFor(monsterId){
  return (table && table[monsterId]) || [];
}

export function effectMountsEnabled(){ return enabled; }

async function glbFor(model){
  if (cache.has(model)) return cache.get(model);
  const p = new Promise((res, rej) =>
    loader.load('models/effects/' + model + '.glb', g => res(g.scene), undefined, rej));
  cache.set(model, p);
  return p;
}

// Attach every joint-bound record for this monster. `root` is the mounted monster group.
export async function attachEffectMounts(root, monsterId, only){
  detachEffectMounts();
  // Either the inspection switch, or this monster's own rage-driven mount.
  if ((!enabled && !(rageOn && autoOnRage(monsterId))) || !root) return live.length;
  // `joint: -1` normally means an UNBOUND .pel record and is skipped. A row that also carries
  // `root: true` is different: it is an effect whose attachment point is not decoded yet -- the
  // EFL names its models in plain text but its emitter placement is unread -- and it is mounted on
  // the monster's own root so it can be looked at at all. Those rows say so in the table.
  const rows = effectMountsFor(monsterId).filter(r => r.joint >= 0 || r.root);
  const bones = gidBonesOf(root);
  for (let k = 0; k < rows.length; k++){
    const r = rows[k];
    if (only !== undefined && only !== null && k !== only) continue;
    let parent = root;
    if (!r.root){
      const b = bones.find(x => x.gid === r.joint);
      if (!b) continue;                     // the monster does not carry that bone: skip, do not guess
      parent = b.node;
    }
    let scene;
    try { scene = await glbFor(r.model); } catch (_) { continue; }
    const obj = scene.clone(true);
    dressEffect(obj, r.model);
    // UNITS ARE UNDECODED. An effect base model spans 272..562 units where a monster's skeleton
    // spans about 7-8, so the two are not in the same space and the EFL's own placement has not
    // been read. `scale` is therefore a TABLE VALUE, not a decode: it is here so the thing can be
    // seen and judged, and __view.effects.scale() retunes it without a reload.
    const s = typeof r.scale === 'number' ? r.scale : 1;
    if (s !== 1) obj.scale.setScalar(s);
    obj.userData.effectMount = { model: r.model, joint: r.joint, array: r.array, index: r.index,
                                 root: !!r.root, scale: s };
    parent.add(obj);
    live.push({ obj, bone: parent, model: r.model, joint: r.joint, array: r.array,
                index: r.index, root: !!r.root });
  }
  return live.length;
}

// Retune the undecoded mount scale on everything live, for judging it by eye.
export function setEffectScale(s){
  for (const m of live) m.obj.scale.setScalar(s);
  return live.length;
}

export function detachEffectMounts(){
  for (const m of live) if (m.obj.parent) m.obj.parent.remove(m.obj);
  live.length = 0;
}

export function enableEffectMounts(on){ enabled = !!on; }

// what is actually on the skeleton right now, for the harness
export function effectMountsLive(){
  return live.map(m => ({ model: m.model, joint: m.joint, array: m.array, index: m.index,
                          bone: m.bone.name }));
}
