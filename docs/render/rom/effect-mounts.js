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
import { loader, loadJson } from '../assets.js';
import { gidBonesOf } from '../skeleton.js';

let table = null;                 // the whole effect-mounts.json
let enabled = false;
const live = [];                  // { obj, bone, model, joint, array, index }
const cache = new Map();          // model name -> the loaded glb scene, cloned per use

export async function loadEffectMounts(url){
  if (table) return table;
  table = await loadJson(url || 'effect-mounts.json').catch(() => ({}));
  return table;
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
  if (!enabled || !root) return live.length;
  const rows = effectMountsFor(monsterId).filter(r => r.joint >= 0);
  const bones = gidBonesOf(root);
  for (let k = 0; k < rows.length; k++){
    const r = rows[k];
    if (only !== undefined && only !== null && k !== only) continue;
    const b = bones.find(x => x.gid === r.joint);
    if (!b) continue;                       // the monster does not carry that bone: skip, do not guess
    let scene;
    try { scene = await glbFor(r.model); } catch (_) { continue; }
    const obj = scene.clone(true);
    obj.userData.effectMount = { model: r.model, joint: r.joint, array: r.array, index: r.index };
    b.node.add(obj);
    live.push({ obj, bone: b.node, model: r.model, joint: r.joint, array: r.array, index: r.index });
  }
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
