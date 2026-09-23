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
import { loadGlb, getTexture, loader, poseCache, bust, texCache, loadJson } from './assets.js';
import { skeletonClone, meshGroupId, gidBonesOf } from './skeleton.js';
import { createMaterial, setSpecTexture, setEnvTexture, applyRomUv, allMats,
         MAT_FPS, stepMaterialAnim } from './material.js';
import { specFor, refForGlb } from './materials-db.js';
import { createRomMaterial, enableRomCore, romCoreEnabled,
         enableRomAmbient, romAmbientEnabled, setSHAmount,
         enableRomSpecular, romSpecularEnabled, setRomSpecularAmount, anchorMisses,
         enableRomPhong, romPhongEnabled,
         setCutoutSolid, cutoutSolidCount, cutoutAnchorMisses, setRomAlphaRef } from './rom/material.js';
import { setGlobalEnvCube, setGlobalReflection, globalReflectionOn } from './rom/specular.js';

// THE GLOBAL ENVIRONMENT CUBE, the engine's own default (system\texture\DefaultCube_CM) -- see
// FReflectGlobalCubeMap in rom/specular.js for where it comes from and what samples it. The faces are
// the ROM texture's top mip decoded to PNG, in +X -X +Y -Y +Z -Z order; the colours are sRGB like every
// other map here. Loaded once for every monster. __globalRefl(false) switches the reflection term off
// for comparison; __globalRefl() reads it back.
if (typeof window !== 'undefined'){
  const cube = new THREE.CubeTextureLoader().setPath('env/DefaultCube_CM/')
    .load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
  cube.colorSpace = THREE.SRGBColorSpace;
  setGlobalEnvCube(cube);
  window.__globalRefl = (on) => on === undefined ? globalReflectionOn() : setGlobalReflection(on);
}
import { setBiasUnitsPerStep as setRomBiasUnitsPerStep, releaseBiased } from './rom/state.js';
import { extendMapMisses } from './rom/shader.js';
export { extendMapMisses };
import { loadEffectMounts, attachEffectMounts, detachEffectMounts, enableEffectMounts,
         effectMountsEnabled, effectMountsFor, effectMountsLive,
         setEffectScale, setEffectRage, effectAutoOnRage,
         effectRuntimeInstance, setClipEffectMonsters, setEffectsSuppressed } from './rom/effect-mounts.js';
// The proof-effect models a monster hangs on a joint. Felyne only on shipped data; the module
// header says why, and why it is off by default.
export { effectRuntimeInstance, setClipEffectMonsters, setEffectsSuppressed };
export { loadEffectMounts, attachEffectMounts, detachEffectMounts, enableEffectMounts,
         effectMountsEnabled, effectMountsFor, effectMountsLive,
         // the undecoded mount scale, so it can be judged by eye without a reload
         setEffectScale,
         // a monster whose effect rides the Enrage toggle rather than the inspection switch
         setEffectRage, effectAutoOnRage };
export { setRomBiasUnitsPerStep };
export { enableRomCore, romCoreEnabled };
// The cut-out coverage knob: 1 is on. Raven flips it to compare a capture both ways.
export { setCutoutSolid, cutoutSolidCount, cutoutAnchorMisses };
// The ROM-derived corrections. Each is off until the app switches it on, because each overlaps
// something the SHARED material.js/stage.js already do -- see rom/material.js steps 4 and 5.
export { enableRomAmbient, romAmbientEnabled, setSHAmount,
         enableRomSpecular, romSpecularEnabled, setRomSpecularAmount, anchorMisses,
         enableRomPhong, romPhongEnabled };

// THE ROM'S TRANSLUCENT DRAW ORDER INSIDE A MODEL -- a switch, per-monster defaults.
//
// Raven, 2026-09-17, on Amatsu: "Currently they have a colored layer that renders poorly. It also creates
// see through sections that bypasses the fins on the back". The ROM alpha test (rom/shader.js) took the
// fringes out. What it leaves is the order the fins draw in, which this viewer re-decided every frame.
// three.js sorts meshes that share a renderOrder by their own depth, so the fins traded places as the
// camera moved: the "vibrating" of 2026-09-13, and a fin blocking the one behind it in some views and
// not in others.
//
// THE ROM DOES NOT SORT A MODEL'S MESHES BY DEPTH. Read from the skinned-model draw 0x9392c0 (uEnemy's
// vtable +0x68): it walks the mesh table in index order, and on the translucent passes (item type 0x11 /
// 0x0f) keys every row
//     (0x7fff - clamp(mPriorityBias + model+0x19c - depth)) << 12  |  (row+8 >> 8) & 0xff
// where depth is ONE view depth for the whole model. A row is keyed on its own bounding centre only when
// bit 2 of row+8 is set, and no monster model has a row with that bit (3,292 rows, 186 models). So inside
// a model, translucent meshes draw by the row's ORDER BYTE, then in table order. Amatsu's fins are rows
// #36..#68: #39 / #40 carry byte 0, #41 byte 1, the rest byte 2.
//
// docs/draw-order.json (C:\MHGU-Extract\build-draw-order.py) carries [tableIndex, orderByte, ownDepth] per
// glb primitive, matched back to its row by part, vertex count and material.
//
// HOW IT IS APPLIED. The existing slots stay: a translucent mesh keeps its integer renderOrder (the
// depth-bias rule in rom/material.js), and the ROM's order goes in as a fraction under 1, so the
// per-frame depth sort inside a slot is replaced and nothing moves between slots. Amatsu's translucent
// layers all sit in one slot, so for Amatsu this is the ROM's order exactly. Across separate models
// (a tail, Nakarkos' tentacles) the ROM also sorts by each model's own depth, which this does not do.
//
// DEFAULT: on for DRAW_ORDER_DEFAULT_REFS only. On any other monster it changes which of two
// overlapping same-slot layers wins.
//   __romDrawOrder()               readback
//   __romDrawOrder(true / false)   every monster
//   __romDrawOrder('default')      back to the per-monster defaults
export const DRAW_ORDER_DEFAULT_REFS = new Set(['em/058_00', 'em/058_00/tail']);
let romDrawOrder = null;
let drawOrderP = null;
function drawOrderTable(){
  return drawOrderP || (drawOrderP = loadJson('draw-order.json').then(d => (d && d.models) || {}).catch(() => ({})));
}
const orderedMeshes = new Set();
function drawOrderFor(ref){ return romDrawOrder === null ? DRAW_ORDER_DEFAULT_REFS.has(ref) : romDrawOrder; }
// order byte, then table index, packed under 1
function orderFraction(row){ return (row[1] * 4096 + Math.min(row[0], 4095)) / 16777216; }
function applyDrawOrder(o){
  const base = Math.floor(o.renderOrder || 0);
  const on = base > 0 && !!o.userData.romRow && drawOrderFor(o.userData.romRef);
  o.renderOrder = on ? base + orderFraction(o.userData.romRow) : base;
}
export function enableRomDrawOrder(on){
  romDrawOrder = (on === 'default' || on === null) ? null : !!on;
  for (const o of orderedMeshes) applyDrawOrder(o);
  return romDrawOrderState();
}
export function romDrawOrderState(){
  let ordered = 0;
  for (const o of orderedMeshes) if (o.renderOrder % 1) ordered++;
  return { on: romDrawOrder === null ? 'default' : romDrawOrder, meshes: orderedMeshes.size, ordered };
}
if (typeof window !== 'undefined'){
  window.__romDrawOrder = on => (on === undefined ? romDrawOrderState() : enableRomDrawOrder(on));
}

// every material a monster mesh was given (the debug knobs walk this)
export const monsterMats = [];
// materials carrying FDistortionRefract; the capture pass below feeds them the scene colour
export const refractMats = [];

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
    orderedMeshes.delete(o);
  });
  for (const m of mine){
    let i = monsterMats.indexOf(m); if (i >= 0) monsterMats.splice(i, 1);
    i = allMats.indexOf(m); if (i >= 0) allMats.splice(i, 1);
    i = refractMats.indexOf(m); if (i >= 0) refractMats.splice(i, 1);
    releaseBiased(m);
    m.dispose();
  }
  // the per-arm texture copies stepArmSlime makes are this monster's own, unlike the cached originals,
  // and so are the copies loadMonster gives a material that moves its own UVs
  for (const tex of root.userData.armSlimeMaps || []) if (tex) tex.dispose();
  for (const tex of root.userData.ownUvMaps || []) tex.dispose();
  // the refract pass's scene copy is a full-size render target and outlived the monster that
  // needed it -- 10 materials on 6 monsters use it, so it is null on most of the library
  if (!refractMats.length) releaseRefractTarget();
}
// material.js's setEnvTexture / setSpecTexture guard with `if (!mat.userData.u) return;` -- which
// means "this is an unlit additive material, it has no uniform block". That guard is DEFEATED by
// this module: the Refract and TypeExtend paths below do
// `mat.userData.u || (mat.userData.u = {})` and install their own uniforms, so an additive material
// carrying either feature has a userData.u that exists but holds none of applyTint's uniforms.
// The setter then walks straight into `mat.userData.u.uEnv.value` and throws
// "Cannot set properties of undefined (setting 'value')", killing the whole load.
// Measured 2026-09-07: exactly 3 materials on 3 monsters -- em033_00 XfBA_A0__m04__kekkan,
// em050_00 XfB__m03_add and em084_00 XfBA_A1_shell -- i.e. Akantor, Alatreon and Nakarkos did not
// load at all, and Nakarkos is one of the 17 shot-harness scenes.
// Fixed HERE rather than in material.js because material.js is synced from the Armor Viewer and
// this module is what breaks its precondition.
function hasShaderUniforms(mat){
  return !!(mat.userData && mat.userData.u && mat.userData.u.uEnv && mat.userData.u.uSpec);
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
//
// PART VISIBILITY, read from the ROM 2026-09-07 and now replicated rather than approximated.
// enemy+0x110 is uBaseModel+0x110, the MtProperty "PartsDisp" -- a 512-bit field, one bit per MOD
// mesh group, with AllOn/AllOff beside it. The constructor fills it with 0xff (0088ba60
// `mov r2,#0xff` / 0088ba98 `add r0,r4,#0x110` / 0088ba9c `mov r1,#0x40`) and the reader,
// uBaseModel vtable slot 27 at 0x8925b8, drops a mesh whose group bit is CLEAR.
//
// Raven's verification, 2026-09-07: "Turn All On is bad since turning on parts means part breaks
// are shown by default from what I can see." That is right, and the ROM agrees -- the game never
// stays in the all-on state. It applies ONE group set on the first tick, and an undamaged monster
// always gets the same one: every break threshold in all 138 .dtp files is non-zero, so a break
// level of 0 takes the low branch at every site, for every monster, at every quest rank.
//
// DEFAULT_PARTS_ON was emptied 2026-09-07: its one entry, em043_05 part 6, was believed to be
// Savage Deviljho's eye effect and is not -- part 6 is the eye glow shared byte-for-byte with
// ordinary Deviljho. It comes back 2026-09-09 for the Rathian and Rathalos lines, on Raven's call.
//
// A ROW DEFAULT CANNOT REPLACE THIS TABLE, which is why it stays even though it is now empty.
// docs/part-review.json speaks in the units the Parts panel offers -- one choice per RENDERED row
// -- and the panel drops two kinds of row: inert single-member ones (groupIsInert) and ladder rows
// that collapse to a single choice. A part living in one of those is reachable from here and from
// nowhere else. The same goes for DEFAULT_PARTS_ON's {calm, rage} form, which also feeds
// stateParts() and the test deciding whether the Enraged checkbox appears at all.
export const DEFAULT_PARTS_OFF = {
  // CONGALALA em021_00 [12..18] and KHEZU em003_00 [1, 2] MOVED to docs/part-review.json
  // 2026-09-10, with Raven's words carried over as each entry's `note`. Every part either named
  // was its own two-item row (on N / all off), so "none" says it exactly and in the units the
  // panel shows. Congalala's row 19 was never in the entry and is still untouched.
  // THE THREE FATALIS ENTRIES WERE REMOVED 2026-09-07. They turned parts 1 and 10 off by hand; the
  // ROM's own spawn default and resting sets now do it, and the drawn part map is IDENTICAL with
  // and without them on all three (em013_00 Fatalis, em013_01 Crimson, em013_02 Old). An exception
  // that the core has caught up with is not an exception any more -- it is a place the viewer would
  // silently stop matching the ROM if the ROM ever disagreed.
};
// Parts a monster should OPEN with, whatever the ROM's own order says -- the mirror of
// DEFAULT_PARTS_OFF and, like it, Raven's call on verification rather than something taken while
// building. Applied by applyForcedOn, which switches the cluster owning the part to whichever of
// its alternatives DRAWS it, and runs after applyForcedOff so an explicit "on" wins a collision.
//
// THE SIX RATH ENTRIES MOVED to docs/part-review.json 2026-09-10 along with Diablos, for the same
// reason and with Raven's words carried over. Worth keeping here: on the two 14-group models
// (Dreadqueen, Dreadking) the row offers 11,101 / 12,101 / 8 rather than a clean pair, so the
// review file has to name one exactly -- a bare "101" is ambiguous there and is refused, where
// applyForcedOn used to take the first silently.
export const DEFAULT_PARTS_ON = {
  // DIABLOS em007_00 MOVED to docs/part-review.json 2026-09-10, which is now where a per-row
  // default belongs. Its five parts were [5, 102, 103, 104, 101] and every one is a two-option
  // row, so the review file says the same thing in the units the panel actually offers -- and
  // says it beside the name Raven gives the row, instead of a part id list in a code file.
  // Raven's words are carried over as that entry's `note`. The reasoning that made it necessary
  // is still worth having: part-rest.json gives em007_00 sets [7, 8, 10, 12, 14], of which 12 and
  // 14 are past the end of an 11-group table, 7 and 8 are the same cluster so the later one wins
  // (6 on), and 10 draws 4 over 101; the three head clusters no set names at all, so they fell to
  // the highest member.
  // Raven, 2026-09-09, screenshot: "Bloodbath Diablos, those are the parts I want on by default" --
  // on 0, 100 / off 30; on 5 / off 1; on 102 / off 2, 32; on 103 / off 3, 33; on 104 / off 6;
  // on 101 / off 4; on 105 / off 7; on 106 / off 8.
  //
  // 30, 32 AND 33 ARE ON HERE, WHICH IS THREE ROWS OF THAT SCREENSHOT DELIBERATELY NOT FOLLOWED.
  // Those three parts carry XfB_0__m50_angry -- the Deviant rage effect, 5 meshes, and the only
  // animated material this monster has. Raven, immediately after that screenshot was applied:
  // "right now the rage effect no longer is visible". Switching them off deletes the geometry, so
  // the effect can never appear in any state.
  //
  // It does not need switching off, because the ROM hides it with ALPHA rather than with parts:
  // the material's only track is fConstantColor, and its clips end at
  //
  //     Lv3_to_end   final frame  alpha 0.0        <- calm, invisible
  //     Lv3_loop     1.0 -> 0.5 -> 1.0 over 60f    <- enraged, pulsing
  //
  // and ROM_RAGE_SET has no em007_04 entry -- the scan of all eight enrage-gated setVisibleGroup
  // sites is complete, so the ROM never switches this monster's parts on rage at all.
  //
  // Every OTHER row of the screenshot is honoured exactly: the clusters carrying 30/32/33 each have
  // a second variant that draws the wanted partner AND the rage part (g1, g16, g17 against g0, g4,
  // g6), so 0/100, 102 and 103 come out as asked and only the three effect parts differ.
  em007_04: [0, 100, 5, 102, 103, 104, 101, 105, 106],   // Bloodbath Diablos
  // AN ENTRY MAY BE PER STATE. Raven sent Tigrex's calm and enraged panels separately, 2026-09-10,
  // and they differ: calm opens on 0, 100 / off 4 and on 1 / off 2, 3, while enraged wants
  // on 0, 4, 100 and on 2 / off 1, 3. So a value is either a plain list, meaning both states, or
  // { calm, rage }. Read it through defaultPartsOn() rather than indexing this table directly.
  //
  // NOTE, and it is Raven's call not a bug: ROM_RAGE_SET decodes em032_00 as [[1, 0], [10, 9]] --
  // calm set 1 (g1, part 4 ON) switching to set 0 (g0, part 4 off) on rage. These panels are the
  // other way round for that cluster. Naming both states here overrides the pair either way.
  em032_00: { calm: [0, 100, 1, 5, 7, 8, 101],        // g0 g2 g5 g7 g9 g11
              rage: [0, 4, 100, 2, 5, 7, 8, 101] },   // g1 g3, the rest as calm

  // Raven, 2026-09-10, screenshot: "Grimclaw's default parts" -- on 0, 20, 100 / off 30, 31;
  // on 1 / off 3; on 5 / off 6; on 7 / off 9; on 8, 28 / off 10, 38; on 101 / off 15.
  //
  // The RAGE list is what ROM_RAGE_SET's own rage sets draw -- [[0, 1], [9, 10]] for this monster,
  // so set 1 is g1 (20 off, 30 and 31 on) and set 10 is g10 (28 off, 38 on). Writing it out rather
  // than truncating it keeps the two agreeing instead of fighting, and lets the panel work out the
  // owned parts from the pair of lists as well as from the ROM.
  em032_04: { calm: [0, 20, 100, 1, 5, 7, 8, 28, 101],        // g0 g2 g5 g7 g9  g12
              rage: [0, 30, 31, 100, 1, 5, 7, 8, 38, 101] },  // g1 g2 g5 g7 g10 g12

  // Raven, 2026-09-10, screenshot: "Akantor default parts" -- on 0, 100 / off 5; off 1;
  // on 103 / off 3; on 102 / off 2; on 7 / off 8, 9; on 10 / off 11; on 12 / off 13;
  // on 14 / off 15; on 101 / off 4, 16. Four of those nine differ from what the panel produced
  // before this entry, measured off the live page rather than assumed:
  //
  //     Belly  0, 5, 100   picked g16 (5 ON)          wanted g0   (5 off)
  //     Head   3, 103      picked g11 (3 on, 103 off) wanted g2   (103 on)
  //     Head   2, 102      picked g10 (2 on, 102 off) wanted g3   (102 on)
  //     Tail   4, 16, 101  picked g19 (4 AND 101 on)  wanted g8   (101 alone)
  //
  // and the same as elsewhere: the >=100 parts are the intact pieces, so the wanted state is the
  // whole monster with every break variant off.
  //
  // AND THE RAGE PART IS 5, WHICH THE ROM DOES NOT SWITCH. Raven: "Enraged already implemented at
  // this time, but it needs to turn on 0, 5, 100 (the top drop down) when enraged is toggled on."
  // em033_00 is NOT one of the enrage-gated setVisibleGroup sites -- that scan is complete and its
  // results are ROM_RAGE_SET, which has no entry here -- so the ROM never moves this monster's
  // parts on rage, exactly as with em007_04 above. The Belly cluster nevertheless holds a variant
  // that is g0 plus part 5 and nothing else (g16), and Akantor's rage materials agree with that
  // reading: XfBA_A0__m04__kekkan, XfB__m05_body_add01 and XfB__m06_body_add02 each carry a clip
  // named `Angry` with the ROM's auto-play bit set, so whenever their geometry is drawn it is
  // already animating. The ROM gates them by MESH VISIBILITY, not by clip selection -- which is
  // why naming 5 as the rage part here is the whole of the state, and why the toggle had no
  // visible effect before it.
  //
  // Naming both states makes the panel treat 5 as an owned part: it drops out of the Belly
  // dropdown, and since that cluster then has one option left the row hides itself -- Raven's
  // rule from Bloodbath, "if a drop down only has one part after handling the enrage parts, we
  // don't need to display that drop down".
  //
  // PART 4 IS THE TAIL'S RAGE LAYER, added 2026-09-10 on Raven's "on 4, 101 also needs to be added
  // to the enraged toggle". Which parts are effect and which are geometry is readable rather than
  // guessable -- every part's material says so:
  //
  //     part 4   XfB__m06_body_add02                                    effect only
  //     part 5   m06_body_add02 + m05_body_add01 + m04__kekkan          effect only
  //     part 9   XfB__m05_body_add01                                    effect only
  //     7, 8     XfB_N__E0__m00_face                                    real geometry
  //
  // and the three effect materials are exactly the ones carrying an auto-play `Angry` clip.
  //
  // THE BACK CLUSTER IS NOT A BUG. Raven first read `on 8, 9` as wrong and suspected `on 7, 9`;
  // the bounding boxes say otherwise, measured on the mounted meshes:
  //
  //     Group7   [0.6, 0.4, 0.9] .. [0.9, 0.7, 1.2]   106 verts   intact spikes
  //     Group8   [0.6, 0.4, 1.0] .. [0.8, 0.6, 1.2]    33 verts   cracked
  //     Group9   [0.6, 0.4, 1.0] .. [0.8, 0.6, 1.2]    35 verts   the light, on Group8's box exactly
  //
  // Part 9's box is Group8's to the decimal, so it lights the CRACKED back and nothing else; 7 + 9
  // would put crack-light on an uncracked surface. Raven, after seeing it with the effect on: "I
  // see the on 8, 9 is to show the cracks lighting up." So the cluster stays a user choice and no
  // part of it is owned by the rage toggle.
  //
  // WHAT THE ROM ITSELF SAYS, and it is NOT fully followed here. part-rest.json carries a `rageAdd`
  // table -- setVisibleGroup arguments collected inside rage-only code blocks, generated by
  // build-partrest.py -- and it holds exactly two monsters: em033_00 [4, 16] and em077_00 Seregios
  // [14, 15, 16, 17, 18, 29]. Those are SET indices, the same numbering as `defaultSet`, so the
  // ROM's enraged Akantor is g16 (0, 5, 100 -- which is the part 5 Raven asked for, arrived at
  // independently) plus g4 (7 on, 8 and 9 OFF -- the intact back).
  //
  // g19 is therefore an ADDITION Raven made over the ROM, and g4 is deliberately not applied: it
  // would force the back to intact on rage and take away the cracked-back choice he just confirmed
  // he wants. `ROM_RAGE_ADD` is loaded in setRestSets and read by nothing -- wiring it up is a real
  // ROM-driven gap, but it is a decision about those two monsters, not a free fix.
  em033_00: { calm: [0, 100, 103, 102, 7, 10, 12, 14, 101],          // g0  g1 g2 g3 g4 g5 g6 g7 g8
              rage: [0, 5, 100, 103, 102, 7, 10, 12, 14, 4, 101] },  // g16 and g19; the rest as calm

  // Raven, 2026-09-10, screenshot: "Nargacua default parts" -- off 5, 6; on 1 / off 2, 4;
  // on 9 / off 10; on 11 / off 12; on 13, 14, 15, 18, 101 / off 16, 17. Read off the LIVE panel
  // rather than assumed, two of the five clusters disagreed with it:
  //
  //     Head  1,2,3,4,7,8   picked g5  (2 on, 1 off)             wanted g4  (1 on, 2 off)
  //     Tail  13..18,101    picked g17 (13, 16, 17)              wanted g15 (13, 14, 15, 18, 101)
  //
  // The other three already matched. The tail one is the visible half: g17 draws neither 18 nor
  // 101, so the tail tip was simply absent.
  //
  // BOTH STATES ARE NAMED because this monster HAS a ROM enrage pair -- ROM_RAGE_SET em037_00 is
  // [[7, 5]], calm g7 against rage g5, on the head cluster. Raven's calm choice is g4, which is a
  // deviation from the ROM's own g7 and his to make; but a flat list would then force g4 in the
  // enraged state too and silently delete the ROM's 7 -> 5 switch. So rage keeps the ROM's set:
  // g5 draws 2 and 7 where g4 draws 1 and 7, and everything else is held as calm. Same reasoning
  // as the em032_04 entry above -- write the rage list out so the pair and the list agree instead
  // of fighting.
  em037_00: { calm: [0, 100, 1, 7, 9, 11, 13, 14, 15, 18, 101],   // g0 g1 g4 g8 g10 g15
              rage: [0, 100, 2, 7, 9, 11, 13, 14, 15, 18, 101] }, // g5 for the head, rest as calm

  // Raven, 2026-09-10, screenshot: "Defaults for mizustune" -- on 1, 2, 101, 102 / off 11, 12, 13,
  // 20, 22; on 3, 104 / off 14; on 4, 105 / off 15; on 5 / off 16, 21, 23; on 6, 103 / off 17, 18,
  // 19; on 8 / off 7. That is g1 g7 g9 g11 g15 g18, plus g0 which is the single-member body row.
  //
  // Asked for alongside a skinning question -- "see if setting those before viewing the bind pose
  // then animated pose helps in resolving its skinning issues" -- and the answer measured out as
  // NO, for a reason worth keeping here so it is not re-tried. Restricting the seam sweep to
  // exactly these parts changes nothing: 530 same-part mismatched pairs either way, worst
  // separation 21.52% of model size either way. The splits are INSIDE Group[0], the main body,
  // which is drawn in every state, so no choice of parts can hide them. See the sweep entry in
  // dev/monster-review.md.
  em082_00: [0, 100, 1, 2, 101, 102, 3, 104, 4, 105, 5, 6, 103, 8],   // g0 g1 g7 g9 g11 g15 g18
};
// THE PARTS THE ROM ITSELF SWITCHES ON RAGE, read from ROM_RAGE_SET rather than hand-listed.
// Raven, 2026-09-10: "Ideally, if we can let the ROM tell us how to handle enraged states, that is
// what we will want." Grimclaw is the case where it can: its pairs are [0, 1] and [9, 10], and the
// parts that differ between each pair's calm and rage set ARE the enrage parts -- 20, 30, 31 from
// the first and 28, 38 from the second. Nothing needs listing by hand.
export function romRageParts(monId, groups){
  const pairs = ROM_RAGE_SET[monId];
  if (!pairs || !groups) return [];
  const out = new Set();
  for (const [calmSet, rageSet] of pairs){
    const a = new Map((groups[calmSet] || []).map(e => [e[0], !!e[1]]));
    const b = new Map((groups[rageSet] || []).map(e => [e[0], !!e[1]]));
    for (const p of new Set([...a.keys(), ...b.keys()]))
      if (a.get(p) !== b.get(p)) out.add(p);
  }
  return [...out];
}
// A monster's forced-on list for the state it is in. An entry is a plain array (both states) or
// { calm, rage }; a missing rage list falls back to calm, so naming only one state is fine.
export function defaultPartsOn(id, rage){
  const v = DEFAULT_PARTS_ON[id];
  if (!v) return undefined;
  if (Array.isArray(v)) return v;
  return (rage ? (v.rage || v.calm) : v.calm) || undefined;
}
// The group set each monster CLASS registers as its resting default -- argument A of the setter
// 0x71398, taken from the 59 registration sites in vtable slot 118 and attributed by a per-class
// code-band map built from the 95 monster vtables. Keyed by the em class because that is how the
// ROM keys it: one uEmXXX_00 class serves every subspecies, and its A literal indexes whichever
// .mpm the spawned model carries. See build/notes/part-group-sets.md.
export const ROM_DEFAULT_SET = {
  em001: 2,  em004: 2,  em007: 2,  em008: 1,  em009: 1,  em011: 3,  em013: 2,  em014: 1,
  em018: 1,  em021: 2,  em022: 1,  em023: 1,  em024: 1,  em025: 1,  em027: 5,  em032: 2,
  em033: 1,  em037: 1,  em038: 14, em042: 2,  em043: 1,  em044: 2,  em045: 2,  em046: 14,
  em047: 1,  em049: 1,  em050: 4,  em055: 4,  em056: 1,  em057: 3,  em058: 14, em060: 2,
  em061: 4,  em063: 1,  em065: 1,  em066: 2,  em068: 1,  em072: 1,  em077: 1,  em079: 1,
  em080: 3,  em081: 2,  em082: 18, em083: 4,  em085: 2,  em086: 3,
  ems009: 0, ems019: 0, ems022: 0, ems034: 0, ems035: 0, ems041: 0, ems042: 0,
  ems046: 2, ems047: 2,
  em062: 1,
};
// CORRECTED 2026-09-07 by an adversarial re-derivation. Three of the registration sites are gated on
// the ENEMY-ID BYTE at enemy+0xb5f4, and attributing them by code band alone put two on the wrong
// monster: the site giving A=1 is reachable only when that byte is 0x48 = 72
// (`00fadcb0 cmp r0,#0x48 / bne #0xfadccc`), so it is em072 and not em071; the site giving A=0 only
// when it is 0x29 = 41 (`010c5a04 cmp r0,#0x29 / bne #0x10c5a8c`), so it is ems041 and not ems001.
// em062's A=1 was missing entirely. 53 of the original 55 entries were right.
// The ROM's default part state, replicated. PartsDisp starts with EVERY group on, then the applier
// (uEnemyBase vtable slot 10, 0x6f4e8) applies exactly ONE set on the first tick. A set is a PATCH:
// setVisibleGroup writes each named group's own draw flag (`bic` then `orr flag<<bit`) and leaves
// every group it does not name alone. That is this pipeline exactly -- `on` switches one group
// index, partsDrawn applies only the switched groups, and applyParts draws any part no group names.
//
// A class with no entry keeps -1 in all three index slots, and setVisibleGroup rejects negatives,
// so it is never switched at all and stays fully on. An all-false `on` gives precisely that.
//
// This replaces the first-of-cluster heuristic, along with the eye rule and the effect-mesh scoring
// that propped it up: the set the ROM applies puts the eyes right without being asked.
//
// RAGE ALSO SWITCHES PARTS, and the ROM says which. Raven, 2026-09-07: "we may need to handle those
// on a per monster basis unless the ROM can tell us what enrage turns on/off" -- it can, in each
// monster's own enrage driver. Savage Deviljho's tail picks the set from the rage state directly:
//     00e80bf0  cmp r1, #2        ; 2 = enraged
//               movne r1, #9      ; calm    -> set 9  = {0 on, 3 on, 12 OFF, 100 on}
//               moveq r1, #0xd    ; enraged -> set 13 = {0 on, 3 on, 12 ON,  100 on}
// Part 12 is the 306-vertex mesh carrying XfBA_IW_1__m00, the scrolling UV layer -- so the fourth
// rage material is switched by GEOMETRY, not by setClip.
//
// CORRECTED 2026-09-07: ordinary Deviljho does NOT run that driver. 0xe809e8's only entry is
// `00e80d20 b #0xe809e8`, taken from `00e80d10 movw r1,#0xb5f5 / ldrb r1,[r0,r1] / cmp r1,#5 /
// bne #0xe80d24` -- the VARIANT byte at enemy+0xb5f5, so that whole function is Savage-only and its
// `cmp r1,#2 / movne #9 / moveq #0xd` can never yield 0 for anyone. Variant != 5 branches to a
// different function, 0xe806a0, and em043_00's 0 and 9 come from there (`00e807f0 mov r1,#0` /
// `00e808d0 mov r1,#9`) under a two-term condition. Both tables' NUMBERS were verified correct;
// only the derivation was wrong.
//
// Keyed by the FULL id, not the em class: em043_00 and em043_05 share a class and a vtable and
// diverge on a variant byte, so their literals differ. Only the two decoded so far are listed; a
// monster with no entry keeps its resting set in both states, which is what the old code did.
export const ROM_RAGE_SET = {
  // Found by scanning every setVisibleGroup call site whose set index comes from an eq/ne pair
  // gated DIRECTLY on the enrage predicate 0x81670 (which reads [enemy+0x1428]+0x518). Each entry
  // is [calmSet, rageSet]; Tigrex needs two pairs.
  //
  // THE PAIRS WERE RECORDED THE WRONG WAY ROUND AND ARE SWAPPED HERE, 2026-09-10. Read the
  // predicate and one site together and the polarity is not ambiguous:
  //
  //   0x081670   ldrb r0,[r0,#0x518] / cmp r0,#1 / movwne r0,#0 / bx lr
  //              -- returns 1 when the state byte IS 1, else 0. Non-zero MEANS ENRAGED.
  //   0x0e22400  bl 0x81670 / cmp r0,#0 / movne r1,#1 / moveq r1,#0 / bl 0x72c78
  //              -- so movne, the NON-ZERO branch, is the ENRAGED set. Tigrex: rage = set 1.
  //
  // Set 1 is g1 [0 on, 4 on, 100 on] and set 0 is g0 [0 on, 4 OFF, 100 on], and part 4 carries
  // XfBA_A0__m01_angry, the vein layer. So the ROM turns the rage layer ON when enraged, which the
  // old order had backwards -- it read movne as calm. Raven's own panels agree independently: his
  // calm screenshot is part 4 off, his enraged one part 4 on.
  //
  // The polarity is a property of the code SHAPE, identical at every site, so every pair flips.
  // Four are confirmed against their own site by matching set numbers -- Tigrex (0xe22400),
  // Gypceros (0xd5e504, rage 2 / calm 6), Nargacuga (0xe48884, rage 5 / calm 7) and Nerscylla
  // (0xf9bd30, rage 1 / calm 2). The Deviljho, Savage and Brachydios rows are flipped on the same
  // reasoning but their sites use a different selection shape and were NOT re-read; they are the
  // ones to check first if a monster looks inverted. (Both Brachydios rows have since been re-read and
  // were wrong -- see the note on em063 below. Deviljho and Savage were corrected by part ID.)
  em009_00: [[6, 2]],                                  // Gypceros -- confirmed at 0xd5e504
  em032_00: [[0, 1], [9, 10]],                         // Tigrex -- confirmed at 0xe22400
  em032_04: [[0, 1], [9, 10]],                         // Grimclaw
  em037_00: [[7, 5]],                                  // Nargacuga -- confirmed at 0xe48884
  em037_04: [[7, 5]],                                  // Silverwind
  // CORRECTED 2026-09-11, and NOT by re-reading the site -- by the part IDs, which is what the ROM
  // addresses parts with. The comment above already named these as the rows to check first if a
  // monster looks inverted, and Raven found exactly that: "the neck glow effect currently shows in
  // normal state, it should only show in the enraged state", then on the base monster "the Enraged
  // toggle does not show the enraged effect when enabled, it shows briefly when I deselect it".
  //
  // The test needs no site read because the effect layers are identifiable by material:
  //   em043_00  g9 draws part 3, XfB__m02_body_k, the additive glow;  g0 draws no effect part.
  //   em043_05  g13 draws 3 AND part 12, XfBA_IW_1__m00, the neck;    g9 draws 3 alone.
  // A pair written [calm, rage] that puts the effect-bearing group on CALM makes enrage REMOVE the
  // effect, which is not a thing an enrage pair does. So both are the other way round.
  em043_00: [[0, 9]],                                  // Deviljho -- was [[9, 0]]; effect is g9
  em043_05: [[9, 13]],                                 // Savage -- was [[13, 9]]; neck is g13
  // RE-READ 2026-09-13, AND THE FLIP ABOVE WAS WRONG FOR BOTH. "The polarity is a property of the
  // code shape" holds only while the compare constant does: Tigrex's site is `cmp r0,#0 / movne
  // <rage>`, and Raging Brachydios's is `cmp r0,#1 / movne <calm>` -- the same movne, the opposite
  // meaning. Raven, 2026-09-13: "The slime doesn't turn off though, which it should be tied to enrage
  // state." One class serves both Brachydios, and 0xf36e18 splits them on the variant byte
  // (enemy+0xb5f5 == 5 tail-calls 0xf36328), so the two drivers are read separately:
  //
  //   Raging Brachydios, 0xf36328 -- the select form:
  //     00f368a0  bl 0x81670 / cmp r0,#1 / movne r1,#0xb / moveq r1,#0xc / bl 0x72c78
  //     calm set 11 [9 off], enraged set 12 [9 on] -- part 9 is XfB__m05_add, the enrage glow, which
  //     the same function drives through Normal / Angry_Start / Angry_Repeat / Angry_End.
  //
  //   Brachydios, 0xf36dfc -- NOT the predicate directly. A gauge at [enemy+0xcacc]+0x84 climbs while
  //   enraged and drains while calm, clamped 0..40 (0xf36e54..0xf36f50), and the part block compares
  //   it with 10.0 (0xf373b8):
  //     below  set 0  [12 off]      + head pair lo 2 [9, 10 on; 13, 14 off]
  //     at/over set 11 [12 on]      + head pair lo 12 [9, 10 off; 13, 14 on]
  //   Part 12 is the 867-vertex body slime and 9/10/13/14 the head slime, all XfB__m03_nenkin_body.
  //   As pairs that is [0, 11] and [2, 12]: the calm block applies 0 and 2, the enraged block 11 and
  //   12, and never both. The gauge's delay on the way in and out is not modelled -- the toggle shows
  //   the two steady states.
  //
  // build-partrest.py now splits the same two drivers for the resting sets; before that, both
  // monsters carried the union [3, 4, 5, 7, 9, 12], which put Brachydios's enraged head at rest.
  em063_00: [[0, 11], [2, 12]],                        // Brachydios -- gauge block, 0xf373b8
  em063_05: [[11, 12]],                                // Raging Brachydios -- 0xf368a0
  em070_00: [[2, 1]],                                  // Nerscylla -- confirmed at 0xf9bd30
};
// Materials driven at SPAWN rather than by rage, which then hold that clip's end state for the
// monster's whole life. Savage Deviljho is the case that matters and it is not a special case in
// the ROM -- it is what its state ladder says. Savage STARTS in state 1 and the driver fires
// Angry_Start on the way in, tearing it down only at the terminal state; ordinary Deviljho starts
// in state 0, where the same material really is the enrage layer. Same class, same vtable, split
// on a variant byte.
//
// XfB__m02_body_k is the ADDITIVE glow (BSAddAlpha, glob.constant alpha 0 at rest, Angry_Start
// ramping it to 1). Its meshes are part groups 3, 6 and 9 -- and group 6 is two meshes of 50
// vertices: THE EYES. Selecting Angry_End for it whenever the viewer is "calm", which a name list
// does, switched Savage's eye glow off permanently. Raven, 2026-09-07: "Still missing the eye
// effect."
//
// RAGING BRACHYDIOS'S SLIME RESTS YELLOW, and only because its spawn says so. Raven, 2026-09-13:
// "Raging on the other hand looks very odd". Its four slime materials are MapBlend -- lerp(albedo,
// blend map, fAlbedoBlendColor.a) -- over one texture whose left column is yellow and right column
// red, the blend map reading the right one through fUVTransform2's 0.5 U offset. The MRL ships
// fAlbedoBlendColor (1,1,1,1) on all of them (read from em063_05.mrl, $Globals float 4..7), so a
// material nothing has touched draws the RED column, and that is what the viewer drew.
//   The game touches it at once. The spawn setup (00f35318..00f353bc, variant 5 only) caches the
// materials with MRL ids 51..54 -- arm_l, arm_r, body, tail -- as slots 0..3 and starts every slot at
// state 4 with a request of 0. The part driver's slot loop (00f36588..00f36734) walks the states by
// the names in its own table at 0x017d9750 -- 0 Yellow, 1 Yellow_to_Red, 2 Red, 3 Red_to_Yellow --
// and a request of 0 against state 4 becomes 3: setClip(slot 0, "Red_to_Yellow"), time zeroed, and
// when its 15 frames run out the state settles at 0 with the clip left in the slot, HOLDING alpha 0.
// Nothing in that loop reads the enrage predicate, so the toggle does not move it.
//   RED IS THE ERUPTION, NOT ENRAGE -- keep it off the Enraged toggle. Raven, 2026-09-13: "Ensure you
// are not using the 'on hit' effect Brachy has, the slime flashes red then erupts." The ROM agrees,
// read the same day. A slot in state 2 (Red) is where the eruption starts: 0xf36984 starts effect
// 0x3e9 + slot through the monster's own vtable +0x1d0 (the tail slot goes through 0xf36c74) and
// arms a 30-tick fuse at [+0xcacc]+0xb0+4k; 0xf36100 burns the fuse down and 0xf46234 posts the
// explosion. Getting there: 0xf36100 (Raging only, variant gate 0xf360dc) also runs a 2700-tick
// countdown per slot at +0x50+8k that flips Yellow and Red when it runs out, a byte at +0x70+k asks
// for Red at once, and all four are sent back to Yellow while vtable +0x3f4 holds (0x7fed4, true in
// action categories 0xb and 0xe among others). Move action 6
// (dispatcher 0xf380d0 case 6 -> 0xf37b64) turns all four red at frame 158 of motion 0xF. Nothing on
// the colour path reads the enrage predicate; the explosion does, only to post the enraged variant of
// its event (0xf46234: ids 0x17..0x26, +1 when enraged). So the viewer shows the spawn colour in every
// state and offers no Red -- the eruption is boarded as an effect to build later.
//
// VALSTRAX'S BREATHE LAYER IS NOT A RAGE LAYER. Raven, 2026-09-13: "Valstrax has effects issue, but I
// see some rendering issues you may be able to take care of." uEm086_00's init (0x109e6a0) caches its
// materials by MRL id -- m01..m06 carry ids 1..6 -- and its frame (0x10a1240) runs each one's
// start/Loop/end set through the machine 0x10a1984 (see ROM_STAGE_CLIPS). XfB__I0__m04_breathe (id 4)
// is the exception: it holds TWO sets, start/Loop/end at +0xcb78 and tired_start/tired_Loop/tired_end
// at +0xcbc0, picked by the byte at +0xcaf5 (0x10a12e0) and run by the action ids at +0x73e0/+0x73e1 and
// a flag word at +0x5c0 -- the enrage predicate 0x81670 is never read on that path. It is the one mesh
// of part 11, the row Raven named "Chest Effect" (Off / On): with no actions in the viewer, the ROW is
// the action, as ROM_SET_CLIP's row is Thunderlord's flag. So the material shows the glow LIT, which is
// `start` on its last frame -- fTransparency 1.0, fAlbedoColor (0.875, 0.125, 0.125) -- because the lit
// state has no clip of its own: `start` ramps 0 -> 1 over 80 frames, the machine then sets `Loop`, which
// writes no fTransparency, and `end` ramps 1 -> 0. The auto `Loop` at load leaves the shipped 0, which
// drew nothing when the row was On; the enraged fallback's [Loop, tired_Loop] drew the exhausted set's
// dim flicker on Enraged.
export const ROM_SPAWN_CLIP = {
  em043_05: { XfB__m02_body_k: 'Angry_Start' },   // Savage Deviljho: eyes and body glow, always lit
  em063_05: { XfB__m01_nenkin_arm_l: 'Red_to_Yellow', XfB__m02_nenkin_arm_r: 'Red_to_Yellow',
              XfB__m03_nenkin_body: 'Red_to_Yellow', XfB__m04_nenkin_tail: 'Red_to_Yellow' },
  em086_00: { XfB__I0__m04_breathe: 'start' },    // Valstrax: the Chest Effect row, lit -- see above
};
// CLIPS SUPPRESSED FOR THE VIEWER. An AUTHORED deviation from the ROM, and the only one in the
// clip path, so it is named rather than hidden inside a rule.
//
// Raven, 2026-09-11: "while I want things to be as close to the ROM as possible, we don't need to
// keep the wing clip. It looks off in our app, in game it might have a purpose or be handled
// differently."
//
// WHAT IT STANDS IN FOR. Crimson Fatalis's rage exit is two stages in the ROM -- Angry_End_01 fades
// the emission on the angry texture, then Angry_End_02 swaps the texture back -- and only
// `XfBAN__E0__m50_wing` also carries a single combined `Angry_End` (60 frames) that does both. Its
// keys are emission (0.2,0.2,0.2) at frame 0, (0.1,0.1,0.1) at 29, **(0.6,0.3,0.0) at 30** and
// (0,0,0) at 60, with the texture switching 13 -> 11 on that same frame 30. So the orange flash is
// the ROM's own, but the viewer plays it on the WING ALONE: CALM_CLIPS matches `Angry_End`
// exactly, and the body, leg and body_alpha materials have no clip by that name, so they take the
// two-stage path and never flash. One layer flashing orange while the rest of the monster does not
// is not what the game does either -- it is an artefact of matching by name across a set whose
// members are named inconsistently.
//
// The honest fix is to drive the _01/_02 pair as the ROM's state machine does, on every material
// at once. Until that is read, this suppresses the odd one out rather than showing a flash on one
// wing. Keyed by monster and material NAME; the clip stays in the data and the index ladder is
// unaffected, because suppression blanks the NAME only.
export const SUPPRESS_CLIP = {
  em013_01: { XfBAN__E0__m50_wing: ['Angry_End'] },   // Crimson Fatalis: the lone combined exit
};
function suppressedFor(monId, matName){
  const t = monId && SUPPRESS_CLIP[monId];
  const names = t && matName && t[matName];
  return names ? new Set(names.map(n => String(n).toLowerCase())) : null;
}
// The UNDAMAGED sets, per monster, loaded from docs/part-rest.json. THIS IS WHAT KEEPS PART BREAKS
// OFF. Raven, 2026-09-07: "we don't want ALL parts ON because some parts are part breaks, they
// replace the base part by flipping the base part off and turning the part break part on."
// Exactly so, and all-on draws BOTH halves of every such pair: measured over the library, the
// all-on default leaves **473 multi-variant clusters drawing more than one variant at once**.
//
// The ROM's answer is not one set. rMonsterPartsManager::setVisibleGroup (0x72c78) has 556 call
// sites; 210 of them take their set index from a BREAK-LEVEL branch -- `cmp` against the .dtp
// threshold, then a low/high conditional mov pair, e.g. (3,4), (5,6), (7,8), (9,10) as consecutive
// intact/broken indices. The LOW arm (break < threshold) is the undamaged one, and since no
// threshold in any of the 138 .dtp files is zero, an undamaged monster takes it at every site.
// Those sites were attributed to a monster class by a code-band map built from the 95 monster
// vtables (located by the never-overridden slot-113 value 0x6f7c0, each named through its slot-5
// getDTI thunk), which attributes 547 of the 556 sites unambiguously.
// Applying them takes the multi-drawn clusters from 473 down to 327.
export let ROM_REST_SETS = {};
// The whole part-rest.json document: { sets, defaultSet, inherited }. Both tables come out of
// build-partrest.py, so they are reproducible from the ROM rather than transcribed by hand -- which
// is what let the previous hand-made file carry an em043 entry derived from a rage STATE selection
// (`cmp r1,#2 / movne r1,#9 / moveq r1,#0xd`) rather than a break branch, pinning Deviljho into its
// enraged part state. em043 has no break branch at all; it now has no resting set, correctly.
export let ROM_DEFAULT_BY_MON = {};
// The BRANCH form of "apply this set when enraged", which ROM_RAGE_SET below does not cover.
// The ROM writes enrage-driven part visibility two ways:
//   select form  bl 0x81670 / cmp r0,#0 / movne <rage> / moveq <calm> / bl 0x72c78
//   branch form  bl 0x81670 / cmp r0,#0 / beq past     -> a whole BLOCK of sets
// ROM_RAGE_SET is the select form, found by hand. The branch form was missed entirely, so two
// monsters had an enraged part form the viewer never showed: em033_00 Akantor and em077_00 Seregios.
// Seregios is the clearest case in the image -- six sets per state, mirrored, with break-level
// branches nested inside each. That also proves the [calm, rage] PAIR model is too narrow: the ROM
// applies a set LIST per state, which is why this one is a list.
export let ROM_RAGE_ADD = {};
export function setRestSets(t){
  const doc = t || {};
  ROM_REST_SETS = doc.sets || doc;
  ROM_DEFAULT_BY_MON = doc.defaultSet || {};
  ROM_RAGE_ADD = doc.rageAdd || {};
}
export function defaultGroupsOn(groups, emId, monId, rage, forceOff, forceOn){
  const on = (groups || []).map(() => false);
  // The spawn default, keyed per MONSTER: generated per class from the registrar 0x71398's SECOND
  // integer argument (+0xb614), then extended to the 21 monsters with no class of their own through
  // the ROM's own AI host map. 91 monsters against the 56 the hand table covered.
  // ROM_DEFAULT_SET stays as the fallback for anything the generated file lacks; where both have an
  // entry they agreed on 53 of 53.
  const a = Number.isInteger(ROM_DEFAULT_BY_MON[monId]) ? ROM_DEFAULT_BY_MON[monId] : ROM_DEFAULT_SET[emId];
  if (Number.isInteger(a) && a >= 0 && a < on.length) on[a] = true;
  for (const s of ROM_REST_SETS[monId] || [])
    if (Number.isInteger(s) && s >= 0 && s < on.length) on[s] = true;
  // the driver's own set is applied on top, and both are patches, so they compose in ROM order
  for (const pair of ROM_RAGE_SET[monId] || []){
    const s = rage ? pair[1] : pair[0];
    if (Number.isInteger(s) && s >= 0 && s < on.length) on[s] = true;
  }
  // the branch form: a whole block of sets that runs only while enraged
  if (rage) for (const s of ROM_RAGE_ADD[monId] || [])
    if (Number.isInteger(s) && s >= 0 && s < on.length) on[s] = true;
  return applyForcedOn(groups, applyForcedOff(groups, on, forceOff), forceOn);
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
  // the part table's decision, kept for the per-frame joint writes a part state drives (stepTailSwell)
  root.userData.partsDrawn = drawn;
  applyBreakAlpha(root, drawn);
  applyBreakSwap(root);
}

// A BREAK THAT TEARS A MEMBRANE IS AN ALPHA-TEST REFERENCE, NOT A MESH. Raven, 2026-09-13, on Alatreon:
// "Review the parts again, it feels really odd that the 'break' isn't more noticeable ... Especially on a
// monster of this size and one that stays in the air a lot; you'd want to communicate the break clearly".
//
// The part swap alone cannot show it: parts 11/21 (and 12/22) are one glow mesh on the two halves of the
// m03_add sheet, and inside the mesh's UVs those halves differ by a mean of 2 levels in 255. The tear is in
// the MEMBRANE's own albedo alpha: m50_wing_l / m51_wing_r carry grey streaks and holes (3,434 texels at
// alpha 101-150 inside the membrane's UVs) that the MRL's GREATER 20 keeps. uEm050_00's frame 0xecd5fc
// raises the reference when the wing breaks, on the same break count and threshold that pick the glow group:
//
//     0xecda90  material MRL id 50 (0x72c08)   break index 4, threshold bytes +9 / +10   groups 7 / 16
//     0xecdc14  material MRL id 51             break index 3, threshold bytes +13 / +14  groups 8 / 17
//     (the second byte of each pair where 0x3a8430 returns above 4, as in the group switch at 0xecdf04)
//     count >= threshold, latch clear:  +0x14 = (+0x14 & 0xffc03eff) | 0x258100   ref 150, latch set
//     count <  threshold, latch set:    +0x14 = (+0x14 & 0xffc03eff) | 0x050100   ref 20, latch clear
//     then 0x88bcf8, which drops the model's cached draw keys so the new state is bound
//
// (latches [enemy+0xcb08] / [enemy+0xcb09]; group 16 draws part 21 and 17 draws 22, rMonsterPartsManager.)
// Ref 20 is the MRL's own value, so taking the write back is the same as restoring the MRL. Side by
// measurement, not by name alone: m50_wing_l spans x 13964..25126 on joints 22-24, parts 11/21 x 13290..25126
// on joints 22/23. The viewer has no break count, so the part the row DRAWS stands for it: the broken part
// drawn is the count past its threshold. __breakAlpha(false) leaves every reference at the MRL's.
//
// THE SAME WRITE IN FIVE MORE CLASSES. Raven, 2026-09-14: "Look into the wing tear code." Each is the class's
// per-frame virtual at vtable +0x210, like 0xecd5fc, on the break count and threshold bytes of the group switch
// that draws the broken wing, with its own latch; below the threshold it writes the MRL's reference back:
//
//     class      frame      material (MRL id byte, 0x72c08 / +0x18 bits 22..29)  break  bytes     groups   broken  intact
//     uEm001_00  0xcf253c   XfBAN__E0__m50_wing_l (50)                           1      +5 / +6   5 / 6    127     20
//                           XfBAN__E0__m51_wing_r (51)                           2      +9 / +10  7 / 8    127     20
//     uEm010_00  0xd6ad44   XfBAN__E0__m50_wing_l (50)                           3      +9 / +10  3 / 9    150     20
//                           XfBAN__E0__m51_wing_r (51)                           4      +9 / +10  4 / 10   150     20
//     uEm025_00  0xe00eb4   XfBAN__E1__m50_wing (50, cached at +0x44, 0xdff434)  7      +5 / +6   5 / 6    105     50
//     uEm071_00  0xfbf97c   XfB_W__m01_kasan (61, cached at +0x94, 0xfad8d0)     2      +9 / +10  see below 150    0
//     uEm013_00  0xd8a780   every material with id 50 (m50_wing)                 7      +17 / +18 NONE     190     64
//
// uEm001_00 and uEm025_00 mask with 0xffc020ff and put bits 9..12 back from the word they read, which keeps the
// function as the others do. uEm001_00 runs all six of the Rath line (em001_00/02/04 and em002_00/02/04 -- the
// ROM's AI host map; no uEm002_00 vtable exists), and every one of their models carries both membranes at MRL
// GREATER 20 on parts 4/5 and 6/7. uEm071_00's write is in its Gore-line branch ([enemy+0xb5f4] 0x47), and its
// groups are Gore Magala 11 / 12 and Chaotic Gore 13 / 14 -- part 12 on both. On Gore Magala's kasan it cannot
// discard anything: that MRL has no test, and the material setup forces a disabled test's function to ALWAYS
// (0xb42f00: 0xe00 unless fb bit 20), which the write keeps; Chaotic Gore's kasan is GREATER 0. uEm013_00 is not a
// row: no group follows its break 7, so no part here can stand for the break (m50_wing is on part 0). The one other
// class that writes these bits, uEm067_00 (0xf768c0), is not a break: it runs Zamtrios' ice armour reference
// (XfBA_E1__m04_ice, id 54) down from 250 over an action and sets it to 0 or 255 on others.
// Measured inside each membrane's own UVs, the share of texels the broken reference removes over the intact one:
// Alatreon 6.5%, Rathian 7.8%, Rathalos 6.8%, Plesioth 32.8%, Chameleos 13.5% (Fatalis would be 7.5%; the kasan
// footprint on Chaotic Gore 0%).
const RATH_TEARS = [{ part: 5, mat: 'XfBAN__E0__m50_wing_l', ref: 127 },
                    { part: 7, mat: 'XfBAN__E0__m51_wing_r', ref: 127 }];
const GORE_TEARS = [{ part: 12, mat: 'XfB_W__m01_kasan', ref: 150 }];
export const ROM_BREAK_ALPHA = {
  em001_00: RATH_TEARS, em001_02: RATH_TEARS, em001_04: RATH_TEARS,
  em002_00: RATH_TEARS, em002_02: RATH_TEARS, em002_04: RATH_TEARS,
  em010_00: [{ part: 7, mat: 'XfBAN__E0__m50_wing_l', ref: 150 },
             { part: 9, mat: 'XfBAN__E0__m51_wing_r', ref: 150 }],
  em025_00: [{ part: 8, mat: 'XfBAN__E1__m50_wing', ref: 105 }],
  em050_00: [{ part: 21, mat: 'XfBAN__E0__m50_wing_l', ref: 150 },
             { part: 22, mat: 'XfBAN__E0__m51_wing_r', ref: 150 }],
  em071_00: GORE_TEARS, em071_05: GORE_TEARS,
};
let breakAlphaOn = true;
const breakAlphaRoots = new Set();
function applyBreakAlpha(root, drawn){
  const monId = root && root.userData && root.userData.monId;
  const rows = monId && ROM_BREAK_ALPHA[monId];
  if (!rows) return 0;
  root.userData.breakAlphaDrawn = drawn;
  // an unmounted model leaves the scene; drop it here so the set never holds a released monster
  for (const r of breakAlphaRoots) if (r !== root && !r.parent) breakAlphaRoots.delete(r);
  breakAlphaRoots.add(root);
  let n = 0;
  for (const r of rows){
    const v = drawn ? drawn.get(r.part) : undefined;
    const broken = breakAlphaOn && (v === undefined ? true : !!v);
    root.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      for (const m of matsOfMesh(o)) if (m && m.name === r.mat && setRomAlphaRef(m, broken ? r.ref : null)) n++;
    });
  }
  return n;
}
export function setBreakAlpha(on){
  breakAlphaOn = !!on;
  for (const root of [...breakAlphaRoots]) applyBreakAlpha(root, root.userData.breakAlphaDrawn);
  return breakAlphaOn;
}
if (typeof window !== 'undefined'){
  // readback: { on, materials: [{ name, ref }] } -- ref null is the MRL's own
  window.__breakAlpha = (on) => {
    if (on !== undefined) setBreakAlpha(on);
    const mats = [];
    for (const root of breakAlphaRoots) if (root.parent) root.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      for (const m of matsOfMesh(o)){
        const rows = ROM_BREAK_ALPHA[root.userData.monId] || [];
        if (m && rows.some(r => r.mat === m.name) && !mats.some(x => x.name === m.name))
          mats.push({ name: m.name, ref: m.userData.romRefOverride === undefined ? null : m.userData.romRefOverride,
                      testing: !!(m.userData.romAlphaUniforms && m.userData.romAlphaUniforms.uRomAT.value) });
      }
    });
    return { on: breakAlphaOn, materials: mats };
  };
}

// A BREAK THAT SWAPS A TEXTURE. uEm071_00's 0xfbf97c, in the same Gore-line branch as the kasan write above: when
// break 2 first reaches its threshold it also puts `Wing_damage` into slot 0 of the material cached at +0x9c -- MRL
// id 52, XfBAN__E0__m52_wing_l, the membrane on part 0 -- and zeroes the slot's time (0xfbfb6c..0xfbfb94; the clip
// index is found by name at spawn, 0xfad960..0xfad980). The clip is one frame of kind-3 texture keys, Gore Magala
// tAlbedoMap and tSpecularMap 7 -> 8, Chaotic Gore tAlbedoMap 4 -> 5: the torn membrane in both. The branch that
// runs below the threshold writes nothing to that material -- a break never mends in game -- so Intact here holds
// the clip at frame 0, whose key is the MRL's own binding (7 / 4). The part the Wings row draws stands for the
// count, as in ROM_BREAK_ALPHA. __breakClip(false) holds every one at frame 0.
export const ROM_BREAK_CLIP = {
  em071_00: [{ part: 12, mat: 'XfBAN__E0__m52_wing_l', clip: 'Wing_damage' }],
  em071_05: [{ part: 12, mat: 'XfBAN__E0__m52_wing_l', clip: 'Wing_damage' }],
};
let breakClipOn = true;
const breakClipRoots = new Set();
// One step for this root: `[{ mats, clip, t0, rest }]` for clipPicker's machine path. Like the stage machines, the
// state only moves on a clock that moves forward; the review shot's own clock is shown the clip as it last stood.
function stepBreakClips(root, tSec, monId){
  const rows = monId && ROM_BREAK_CLIP[monId];
  if (!rows || !root || !root.userData) return [];
  let st = root.userData.breakClip;
  if (!st || st.monId !== monId)
    st = root.userData.breakClip = { monId, tLast: -Infinity, list: rows.map(r => ({ r, broken: false, t0: 0 })) };
  for (const r of breakClipRoots) if (r !== root && !r.parent) breakClipRoots.delete(r);
  breakClipRoots.add(root);
  const drawn = root.userData.partsDrawn;
  const fwd = tSec >= st.tLast;
  const out = st.list.map(s => {
    if (fwd){
      const v = drawn ? drawn.get(s.r.part) : undefined;
      const broken = breakClipOn && !!drawn && (v === undefined || !!v);
      if (broken && !s.broken) s.t0 = tSec;
      s.broken = broken;
    }
    const t0 = !s.broken ? tSec : fwd ? s.t0 : tSec - (st.tLast - s.t0);
    return { mats: [s.r.mat], rest: null, clip: s.r.clip, t0 };
  });
  if (fwd) st.tLast = tSec;
  return out;
}
export function setBreakClip(on){ breakClipOn = !!on; return breakClipOn; }
if (typeof window !== 'undefined'){
  // readback: { on, materials: [{ name, broken, texture: 'first key' | 'last key' | 'other' }] }
  window.__breakClip = (on) => {
    if (on !== undefined) setBreakClip(on);
    const out = [];
    for (const root of breakClipRoots) if (root.parent) root.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      for (const m of matsOfMesh(o)){
        const s = m && root.userData.breakClip && root.userData.breakClip.list.find(x => x.r.mat === m.name);
        if (!s || out.some(x => x.name === m.name)) continue;
        const clip = ((m.userData.rom && m.userData.rom.anim) || []).find(c => sameClip(c.name, s.r.clip));
        const keys = clip && clip.tracks && clip.tracks[0] && clip.tracks[0].keys;
        const swap = m.userData.texSwap || [];
        const at = k => keys && swap[keys[k][1] - 1] === m.map;
        out.push({ name: m.name, broken: s.broken,
                   texture: at(0) ? 'first key' : (keys && at(keys.length - 1)) ? 'last key' : 'other' });
      }
    });
    return { on: breakClipOn, materials: out };
  };
}

// A BREAK THAT SWAPS THE MATERIAL. uEm071_00's same frame, Shagaru branch ([enemy+0xb5f4] 0x48): when break 2
// reaches its threshold (bytes +9 / +10, groups 4 / 9 -- part 12) it puts MRL id 54 into the model's material slot 4
// and id 53 into slot 0 through 0x88db20; below it, id 52 back into slot 4 and id 51 into slot 0 (0xfbfaf8..0xfbfc24,
// latch [enemy+0xcac0]+0xc1). The four are cached at spawn by id from the model's own MRL -- 51 +0x9c, 52 +0x94,
// 53 +0xa0, 54 +0x98 (0xfad9c4..0xfada68). Slot 0 is XfBA_EW_1__m51_wing_Alpha (id 51) and slot 4
// XfBA_EW_1__m52_wing2 (id 52), the ids the intact branch hands back, and 53 / 54 are the two materials no mesh
// names, #55921053 and #33b5c3c3: both bind the torn membrane e7850cce9a69991b where the originals bind
// cbde49ef3b02d685. Hung on the meshes the way applyMaterialSwap hangs a state's swap. __breakSwap(false) puts the
// originals back.
export const ROM_BREAK_SWAP = {
  em072_00: [{ part: 12, from: 'XfBA_EW_1__m51_wing_Alpha', to: '#55921053' },
             { part: 12, from: 'XfBA_EW_1__m52_wing2', to: '#33b5c3c3' }],
};
let breakSwapOn = true;
const breakSwapRoots = new Set();
function applyBreakSwap(root){
  const ud = root && root.userData;
  if (!ud || !ud.breakSwap || !ud.breakSwap.length) return 0;
  for (const r of breakSwapRoots) if (r !== root && !r.parent) breakSwapRoots.delete(r);
  breakSwapRoots.add(root);
  return retargetMaterials(root);
}
export function setBreakSwap(on){
  breakSwapOn = !!on;
  for (const root of [...breakSwapRoots]) retargetMaterials(root);
  return breakSwapOn;
}
if (typeof window !== 'undefined'){
  // readback: { on, meshes: [{ part, from, drawing }] } -- drawing is the material each swapped mesh draws now
  window.__breakSwap = (on) => {
    if (on !== undefined) setBreakSwap(on);
    const meshes = [];
    for (const root of breakSwapRoots) if (root.parent) root.traverse(o => {
      const orig = o.userData && o.userData.matOrig;
      if (!orig || !(root.userData.breakSwap || []).some(r => r.from === orig.name)) return;
      meshes.push({ part: o.userData.part, from: orig.name, drawing: o.material && o.material.name });
    });
    return { on: breakSwapOn, meshes };
  };
}
// A cluster the rage ladder partly owns still holds real user choices -- the horn-break variants
// sit in the same clusters as the effect geometry on Bloodbath. Raven, 2026-09-10: "You removed the
// Horn Drop downs, so now users cannot see the broken horn options ... I simply wanted the drop down
// items to be removed, the top drop down would have just one option, so removing it was fine".
//
// So: variants that differ ONLY in the ladder parts are the SAME choice, and the rung decides
// between them. Returns [[groupIdx, ...], ...] -- one entry per distinct choice, each holding the
// variants the rung picks from. A cluster that collapses to a single entry is purely the effect's
// own geometry and the panel drops the row.
export function clusterChoices(groups, members, ladderParts){
  const lp = new Set(ladderParts || []);
  const key = i => (groups[i] || []).filter(e => !lp.has(e[0]))
                                    .map(e => e[0] + ':' + (e[1] ? 1 : 0)).sort().join(',');
  const by = new Map();
  for (const m of members || []){
    const k = key(m);
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(m);
  }
  return [...by.values()];
}
// Which variant of one choice to apply: the one whose ladder parts are ON when a rung is picked,
// OFF at No Rage. Falls back to the first, which is what a cluster with only one variant gives.
export function ladderVariant(groups, members, ladderParts, rageOn){
  const lp = new Set(ladderParts || []);
  for (const m of members){
    const es = (groups[m] || []).filter(e => lp.has(e[0]));
    if (!es.length) continue;
    if (es.every(e => !!e[1] === !!rageOn)) return m;
  }
  return members[0];
}
// groupLabel with the ladder's own parts left out -- they are not the user's choice to make.
export function groupLabelWithout(g, skipParts){
  const lp = new Set(skipParts || []);
  return groupLabel((g || []).filter(e => !lp.has(e[0])));
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
  if (!anim){ anim = await loader.loadAsync(bust(list.file)); poseCache.set('anim:' + list.file, anim); }
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
    let want = remap[node];
    // THE "_s" TWINS. harvest builds `remap` from the base bones only, so the 18 tracks the owner
    // writes on "<n>:<gid>_s" leaves matched nothing and fell into `lost` -- silently, since
    // nothing reports it and the list's own `dropped` field stays null. The leaf follows its base
    // bone's local-index change exactly, so the mapping is the base's with the suffix put back.
    // This was measured as harmless once and it no longer is: every one of those tracks is a
    // SCALE track, and scale used to be discarded on the way to the mesh. Now that it is applied,
    // dropping them moves Crimson's jaw by up to 0.451 units against the Fatalis that owns the
    // list (worst: Motion[17], list 3). Same skeleton, same rest, same parents -- only the local
    // numbering differs -- so a borrower has no reason to animate differently from its owner.
    if (!want && node.endsWith('_s')){
      const base = remap[node.slice(0, -2)];
      if (base) want = base + '_s';
    }
    if (want && have.has(want)){ t.name = want + prop; moved++; keep.push(t); }
    else lost++;
  }
  out.tracks = keep;
  out.userData = { retargeted: moved, unresolved: lost };
  poseCache.set(key, out);
  return out;
}

// ---- attached second bodies ------------------------------------------------------------------
// NAKARKOS' TENTACLES ARE A SECOND BODY, NOT SEVERED PIECES. Raven, 2026-09-13: "They are a second
// body that Nakarkos uses to do attacks with." In the viewer they were a severed prop, and worse: the
// body's pose driver drove every mounted root by global bone id, so each tentacle's joints 0..13 took
// the BODY's joints 0..13 and both folded into a bunch inside the body.
//
// What the ROM does with them:
//   * They are objects of their own class, uEmOstgaloaArm (Ostgaloa is Nakarkos' Japanese name),
//     two of them built inside uEm084_00's constructor (0x1064af8, 0x1064b04; arm ctor 0x107b29c).
//   * The arm's setup (vtable+0x18, 0x107b3a4) calls vtable+0x48 -- uCoord::setParent, 0x457c8,
//     which stores the parent at +0x30 and the joint number at +0x34 -- with the body and joint
//     200 when its side byte (+0xcae0) is 1, else joint 203. The same routine sets the arm's own
//     scale to 1.1 (+0x60..+0x68) and does not write its position.
//   * The body model's joints 200 / 203 sit at (+2,0,0) / (-2,0,0) under its root and no body clip
//     animates them. em084_00_left's joint 1 sits at (+2,0,0) and em084_00_right's at (-2,0,0):
//     that is how each model is matched to its joint here (measured, not the side byte).
//   * Their motion lists are em084_00_l_N / em084_00_r_N beside the body's em084_00_N. The clips
//     animate exactly the tentacle's gids 0..13 but are named against the BODY's joint table
//     ("3:2" where the tentacle has "2:2"), so attachedClipFor binds them by gid.
//   * FORM: the arm's part driver (vtable+0x210, 0x107ec80) runs 0x107e25c, which applies g1 when
//     that side's body part state is 3, else picks by the form byte +0xcb30: 0xff -> g0, 0 -> g2,
//     1 -> g4, 2 -> g5, 3 -> g3. The constructor starts the byte at 0xff (0x107b2e4), so the form a
//     tentacle rests in is g0. The groups are the two models' own .mpm files, decoded with
//     harvest-monsters.py's mpm_groups; the right one differs only in part 100 (the proxy layer).
// NOT READ: how uCoord composes a parent JOINT into the child's world matrix. The default below takes
// the tentacle's origin to the joint's world matrix, which is what setParent(body, 200) says with a
// zero local position; `__view.tentacleAttach('rest')` instead follows only the joint's motion from
// its rest pose, which puts the tentacles exactly where the models are authored. They differ by the
// joint's 2-unit offset.
const MPM_ARM = (p100) => [
  [[0,1],[1,1],[2,1],[3,1],[10,1],[11,1],[12,0],[13,0],[20,0],[30,0],[40,0],[50,0],[100,1]],
  [[0,1],[1,0],[2,0],[3,1],[10,1],[11,0],[12,1],[13,1],[20,0],[30,0],[40,0],[50,0],[100,1]],
  [[0,1],[1,0],[2,1],[3,0],[10,1],[11,0],[12,0],[13,0],[20,1],[30,0],[40,0],[50,0],[100,1]],
  [[0,1],[1,0],[2,1],[3,0],[10,1],[11,0],[12,0],[13,0],[20,0],[30,1],[40,0],[50,0],[100,p100]],
  [[0,1],[1,0],[2,1],[3,1],[10,1],[11,0],[12,0],[13,0],[20,0],[30,0],[40,1],[50,0],[100,p100]],
  [[0,1],[1,0],[2,1],[3,0],[10,1],[11,0],[12,0],[13,0],[20,0],[30,0],[40,0],[50,1],[100,p100]],
].map(g => g.map(([p, v]) => [p, !!v]));
export const ROM_ATTACHED_BODY = {
  em084_00: {
    em084_00_left:  { joint: 200, listPrefix: 'l_', groups: MPM_ARM(1), restGroup: 0 },
    em084_00_right: { joint: 203, listPrefix: 'r_', groups: MPM_ARM(0), restGroup: 0 },
  },
};
export function attachedBodyOf(monId, pieceName){
  const t = monId && ROM_ATTACHED_BODY[monId];
  return (t && pieceName && t[pieceName]) || null;
}

// A PARTNER MONSTER THAT COMBINES WITH THIS ONE: Seltas on the Seltas Queen. Raven, 2026-09-14: "Can you look
// into Seltas Queen code to see how Seltas combines with her to make their duo form", then "For now, we only need
// the result of the combine" -- the combined form, not the jump onto her or the paired attacks ("We will likely
// need to pair some animations, but that will be for when I review animations").
//
// What the ROM does (uEm076_00 is Seltas, uEm069_00 the Queen):
//   * Each finds the other by scanning the enemy manager (0x5cdf8, ten slots) for its monster id at +0xb5f4;
//     the Queen hands herself to Seltas (her vtable +0x1dc, 0xf8a978 -> 0xfc4190).
//   * Seltas' combine action, step 0 (0xfd7cec): motion 0x423 -- list 4, Motion[35], a 301-frame loop -- then
//     0xc2044(seltas, queen, joint 200, offset, mode 3, 1.0), the enemy base class's LINK: mode +0x5c2f, target
//     +0x5c30, joint +0x5c34, offset +0x5c40, scale +0x5c50 in the status block. It sets status +0x1bb bit 0 (the
//     Queen copies it into hers every frame) and snaps once through 0xfd7e9c.
//   * The base update 0xae370 applies any link every frame: target vtable +0xd0 (0x539db0) is the joint's world
//     matrix by joint NUMBER; mode 3 normalises its axes -- the joint's scale is dropped -- composes it with the
//     unit's own local matrix and writes the rotation back as a quaternion (0x72dec). The offset is
//     (0, 120, 180) x (Queen - Seltas) of status +0x1b0, the size MODIFIER (the size is +0x1ac x +0x1b0,
//     0xbdf54), which is 1.0 unless an action changes it: zero here. So Seltas stands on the joint, turned
//     with it, at its own size (0.4 against her 0.9).
//   * Queen joint 200 is a mount joint straight under her root. The only other link-joint stores read (tail tip
//     144 and her root, 0xfd5e38 / 0xfd6c1c) follow Queen actions whose motions are the variant-1 ids
//     ([enemy+0xb5f5] != 0, e.g. 0x477), and the ROM's monster id table (0x50aa8) lists em069 only as 0x045, so
//     they never run. In the motions read, her tail carries Seltas through joint 200's own tracks.
//   * The paired combined motions share motion numbers on the two list 4s (checked 2026-09-14). Queen action 1:0x1e
//     plays Motion[27] while Seltas' 1:0x1a plays his Motion[27]. When she enters 1:0x1f (0xf8f3b0), which plays
//     Motion[28] and carries joint 200 in her tail pincers, 0xfc901c puts Seltas into 1:0x1b (0xfc932c): his
//     Motion[28] from frame 0, then Motion[43] when it ends -- the Queen placing him onto her (Raven). Queen
//     Motion[76]..[79] (actions 1:0x21..0x24) hold joint 200 in her tail pincers, answered by his 1:0x1f..0x22:
//     his Motion[35] loop, his Motion[79] loop, that pose frozen (motion speed 0), then the separation (unlink,
//     his Motion[77] falling, list 3 Motion[11] on landing). The two also request Motion[3], [5], [9] and [35].
//     Queen Motion[46] / [47] (actions 7:0x0b / 7:0x0c, 0xf93dfc): Raven, 2026-09-14, "she grabs, then slams" --
//     what moves Seltas in it is NOT FOUND YET (no joint-200 track, no Seltas test of those actions read); his own
//     Motion[46] / [47] are his action 1:0x13 (0xfc8cbc), not its pair.
//   * Seltas' part frame (vtable +0x210, 0xfc6318) draws group 8 while +0x1bb bit 0 is set (0xfc6468; part 9,
//     XfB__m02_add) and group 0 otherwise; the horn by break 0 (group 3 intact); the claws by the value at
//     [+0xcac0]+0x38 (below 4 group 4 part 10, to 8 group 9 part 11, below 12 group 10 part 12, from 12 group
//     11 part 103), grown and shrunk by attack actions through the state at +0x35 (0xfc5ec0); the wings by
//     +0x49. When the combined bit changes it plays `ride_on` (or `separates`) on material 1, XfB__m01_eye:
//     fEmissionColor 0.6 -> 2.0 over 60 frames (0xfc6378), held here at its end.
//   * Seltas' own viewer rules carry over (Raven: "it will likely need to follow similar rules"): the wings are
//     Away, parts 1..4 off, as its Wings row opens. The claws are the massive model -- Raven: "the claws will
//     likely need to be unhidden for the combined form", "Seltas as a solo monster does not use the massive claw
//     model" -- group 11, part 103, the ROM's full-grown stage; the combine action itself does not set that.
//
// THE PAIRED SEQUENCE TEST CASE: Queen list 4 Motion[76]..[79]. Raven, 2026-09-14: "Use 76 through 79 as the test
// case" -- for the animation pass to copy. `pairs` names, per Queen clip on the partner list, the Seltas clip the
// ROM runs under it and how its time goes: `wrap` loops it on the Queen clip's time, `holdAfter` freezes it where
// its loop stood when the named Queen clip ended. How each entry was read, one exchange per Queen action (each
// side waits for the other, testing the partner's action with 0x6fe88 on [+0xcac0]):
//   * Queen 1:0x21 (0xf8f754) plays Motion[76] (loop from frame 26); she waits in its loop for Seltas' 1:0x1f
//     (0xfc9678), which plays his Motion[35] loop, wings folded ([+0xcac0]+0x49 = 0).
//   * Queen 1:0x22 (0xf8f8b0) plays Motion[77]: joint 200 leaves her back and stays 2.2..2.7 from her tail
//     pincers (joints 160 / 161). Seeing her in 1:0x22, his 1:0x1f goes to 1:0x20 (0xfc97c4): his Motion[79], a
//     61-frame loop from frame 0, blend 4 (not modelled).
//   * Queen 1:0x23 (0xf8f9a8) plays Motion[78] (a loop, attacks at 84 and 156) once she sees him in 1:0x20 at the
//     end of Motion[77]. Seeing her in 1:0x23 he goes to 1:0x21 (0xfc9920), whose first step calls 0xb07b4(0.0):
//     status +0x398, the factor 0xb07b4 multiplies into both motion layers' speed (0x5393d0 / 0x53942c), is 0,
//     so his pose freezes where the loop stood -- 187 frames into a 61-frame loop, frame 4 (one frame either
//     way with the two units' update order, unread).
//   * Queen 1:0x24 (0xf8fbf4) plays Motion[79] once she sees him in 1:0x21: joint 200 stays in her tail to about
//     frame 132 and is back on her back by 156. He stays frozen -- only a new motion (0xafce8 sets +0x398 back
//     to 1.0) or his 1200-frame timer ending (then 1:0x22, 0xfc9ab4: unlink, the combined bit cleared, his
//     Motion[77] falling, list 3 Motion[11] on landing) moves him on, and that timer outlasts her clips.
// Where he is comes from joint 200 itself (attachFrame), which her tracks carry; the table only picks his pose.
export const ROM_PARTNER_BODY = {
  em069_00: { monster: 'em076_00', joint: 200, list: '4', clip: 'Motion[35]_loop',
              groups: [3, 8, 11], partsOff: [1, 2, 3, 4],
              matClip: { mat: 'XfB__m01_eye', clip: 'ride_on' },
              pairs: {
                'Motion[76]_start': { clip: 'Motion[35]_loop', wrap: true },
                'Motion[76]_loop':  { clip: 'Motion[35]_loop', wrap: true },
                'Motion[77]':       { clip: 'Motion[79]_loop', wrap: true },
                'Motion[78]_loop':  { clip: 'Motion[79]_loop', holdAfter: 'Motion[77]' },
                'Motion[79]':       { clip: 'Motion[79]_loop', holdAfter: 'Motion[77]' },
              } },
};
export function partnerBodyOf(monId){ return (monId && ROM_PARTNER_BODY[monId]) || null; }

// ---- full animations: clips played back to back, on one list ------------------------------------------
// Raven, 2026-09-14: "See if we can make a complete animation using multiple clips", then "The end goal is to
// combine clips into full animations, then name the animation, have a single list for the end user" (and, for
// where they go meanwhile, "make a List Special"). A full animation is the chain of clips one of the monster's
// action sequences plays, each piece a (list, clip) so a chain may cross lists; index.html offers every one on a
// single extra list, FULL_ANIM_LIST, beside the ROM's own lists (which stay until the animation review).
// `name` is what the user sees -- a placeholder in the S. convention until Raven names it.
//   em069_00 'S. Motion[76]-[79]' -- her 1:0x21..0x24 (see `pairs` above for each action): 1:0x21 moves on
//     when Motion[76] first reaches its end -- the start and one pass of its loop -- if Seltas is already in
//     1:0x1f (else she keeps looping it, up to a 600-frame timer: taken here as ready); 1:0x22 at the end of
//     Motion[77]; 1:0x23 after one pass of the Motion[78] loop (its attacks at 84 and 156 fall inside it); 1:0x24
//     ends with Motion[79]. Seltas' side is built from `pairs` on the same timeline.
export const FULL_ANIM_LIST = { id: 'Special', label: 'Special' };
export const ROM_ANIMATIONS = {
  em069_00: [
    { name: 'S. Motion[76]-[79]',
      pieces: [['4', 'Motion[76]_start'], ['4', 'Motion[76]_loop'], ['4', 'Motion[77]'], ['4', 'Motion[78]_loop'],
               ['4', 'Motion[79]']] },
  ],
  // Khezu L2/Motion[3] attack copied to the Special list to flesh out its effects without touching List 2
  // (Raven, 2026-09-14: "Copy the animation into a List - Special, Motion 3"). Joining _start + _loop rebuilds the
  // full 337-frame LMT motion = the PSL em003_00_2 slot-3 timeline, so the effect frame windows map directly onto
  // it: em003_00_004 sustained f50-176, em003_00_006 burst at f170 (effects-efl-psl.md / u.pel SEQUENCE keys).
  em003_00: [
    { name: 'Motion 3', pieces: [['2', 'Motion[3]_start'], ['2', 'Motion[3]_loop']] },
    // Khezu L2/Motion[28] (PSL em003_00_2 slot 28, 275 frames): em003_00_000 f0-131 then em003_00_001 f132-273.
    // Copied to the Special list to test which attack this is -- replicated straight from the ROM (Raven's note).
    { name: 'Motion 28', pieces: [['2', 'Motion[28]_start'], ['2', 'Motion[28]_loop']] },
  ],
  // Nerscylla (em070_00): the motions that fire its OWN effects, copied to the Special list so the effects can be
  // linked (CLIP_EFFECTS) without touching Lists 0/2/4 (Raven, 2026-09-16: "place copies of the animations into
  // the Special list before making the links ... to keep them separate"). From em070_00's PSL (effects-efl-psl.md,
  // p1=bank: u.pel = Nerscylla's own): L0 M18, L2 M1/7/10/13/24/27/30/31/54/73/74/75/76/78, L4 M11/30/31. Each is
  // a single clip -- the glb carries Motion[N] whole, no start/loop split -- so each piece is just [list, clip].
  // The ubiquitous footstep-dust template (cm202_020/021) is left out; only Nerscylla-specific effects are linked.
  // Placeholder S. names, list-qualified because motion numbers repeat across lists, until Raven names the attacks.
  em070_00: [
    { name: 'S. L0 Motion 18', pieces: [['0', 'Motion[18]']] },
    { name: 'S. L2 Motion 1',  pieces: [['2', 'Motion[1]']] },
    { name: 'S. L2 Motion 7',  pieces: [['2', 'Motion[7]']] },
    { name: 'S. L2 Motion 10', pieces: [['2', 'Motion[10]']] },
    { name: 'S. L2 Motion 13', pieces: [['2', 'Motion[13]']] },
    { name: 'S. L2 Motion 24', pieces: [['2', 'Motion[24]']] },
    { name: 'S. L2 Motion 27', pieces: [['2', 'Motion[27]']] },
    { name: 'S. L2 Motion 30', pieces: [['2', 'Motion[30]']] },
    { name: 'S. L2 Motion 31', pieces: [['2', 'Motion[31]']] },
    { name: 'S. L2 Motion 54', pieces: [['2', 'Motion[54]']] },
    { name: 'S. L2 Motion 73', pieces: [['2', 'Motion[73]']] },
    { name: 'S. L2 Motion 74', pieces: [['2', 'Motion[74]']] },
    { name: 'S. L2 Motion 75', pieces: [['2', 'Motion[75]']] },
    { name: 'S. L2 Motion 76', pieces: [['2', 'Motion[76]']] },
    { name: 'S. L2 Motion 78', pieces: [['2', 'Motion[78]']] },
    { name: 'S. L4 Motion 11', pieces: [['4', 'Motion[11]']] },
    { name: 'S. L4 Motion 30', pieces: [['4', 'Motion[30]']] },
    { name: 'S. L4 Motion 31', pieces: [['4', 'Motion[31]']] },
  ],
};
export function romAnimationsOf(monId){ return (monId && ROM_ANIMATIONS[monId]) || []; }
// ATTACK-ANIMATION EFFECTS, from the monster's PSL (rProofEffectMotSequenceList: the motion->effect binding,
// effects-efl-psl.md), GENERATED from the game's data and carried as the PSL carries it -- nothing here decides
// when an effect ends. Keyed by the clip's name (list-qualified where motion numbers repeat across lists), each
// motion is `{ frames, bits }`: `frames` is the PSL slot's frame count (== the LMT motion's), and each bit is
// `{ bit, efl, key, on }` -- the bit's index in the slot, the record it fires (the bit's effectNo, looked up in
// c.pel for p1 3 and u.pel for p1 4, as the enemy's 0x6ff6c does), and the frames it is ON as [from, to) runs
// (runs the PSL splits across value changes merged). schedule.js walks these the way the game's walker does
// (0x31ca58): a rise starts the record, and the effect is told when its bit falls, when the motion changes and
// when it loops; its own code decides what that means (the record's end mode, +0x3a). Only records exported to
// docs/effects/<monster>.json (`when: 'clip'`) are listed; a bit whose record is not exported is left out.
// Regenerate with C:\MHGU-Extract\efx\gen_clip_effects.py (PSL + PEL decode, E:/offline/root/decode-efl-psl.py).
export const CLIP_EFFECTS = {
  // Bloodbath Diablos (em007_04): Diablos's PSLs for Lists 0-3 plus Bloodbath's OWN List 9 (em007_04_9.psl/.lmt,
  // where its deviant attacks live). Verified first: PSL slot == LMT motion slot across all five lists (97 slots,
  // none differ). Diablos (em007_00) shares this: all 20 SEQUENCE keys the two carry in common resolve to the SAME
  // efl, so the Lists 0-3 bindings are Diablos's own and apply to it unchanged; Bloodbath is purely additive.
  em007_04: {
    'L2 Motion[15]': { frames: 169, bits: [{ bit: 27, efl: 'em007_04_000.efl', key: 910, on: [[0, 168]] }] },
    'L2 Motion[16]': { frames: 161, bits: [{ bit: 1, efl: 'em007_00_001.efl', key: 380, on: [[2, 25]] }, { bit: 2, efl: 'em007_00_001.efl', key: 381, on: [[20, 38], [52, 96]] }] },
    'L2 Motion[17]': { frames: 375, bits: [{ bit: 1, efl: 'em007_00_000.efl', key: 351, on: [[46, 47]] }, { bit: 3, efl: 'em007_00_001.efl', key: 381, on: [[2, 18]] }, { bit: 4, efl: 'em007_00_004.efl', key: 20, on: [[57, 58]] }] },
    'L2 Motion[19]': { frames: 225, bits: [{ bit: 1, efl: 'em007_00_001.efl', key: 380, on: [[0, 7]] }, { bit: 2, efl: 'em007_00_001.efl', key: 381, on: [[1, 14]] }, { bit: 3, efl: 'em007_00_004.efl', key: 20, on: [[54, 55]] }, { bit: 27, efl: 'em007_04_000.efl', key: 910, on: [[0, 70]] }, { bit: 28, efl: 'em007_04_000.efl', key: 911, on: [[0, 70]] }, { bit: 30, efl: 'em007_04_000.efl', key: 912, on: [[0, 70]] }] },
    'L2 Motion[20]': { frames: 267, bits: [{ bit: 15, efl: 'em007_00_004.efl', key: 22, on: [[109, 110]] }, { bit: 16, efl: 'em007_00_004.efl', key: 21, on: [[56, 57]] }] },
    'L2 Motion[22]': { frames: 381, bits: [{ bit: 21, efl: 'em007_04_000.efl', key: 900, on: [[7, 8]] }] },
    'L2 Motion[23]': { frames: 281, bits: [{ bit: 4, efl: 'em007_00_000.efl', key: 351, on: [[111, 112]] }] },
    'L2 Motion[24]': { frames: 255, bits: [{ bit: 2, efl: 'em007_00_001.efl', key: 381, on: [[57, 130]] }] },
    'L2 Motion[25]': { frames: 209, bits: [{ bit: 3, efl: 'em007_00_000.efl', key: 351, on: [[36, 37]] }] },
    'L2 Motion[27]': { frames: 185, bits: [{ bit: 1, efl: 'em007_00_004.efl', key: 20, on: [[67, 68]] }, { bit: 4, efl: 'em007_00_000.efl', key: 351, on: [[65, 66]] }] },
    'L2 Motion[31]': { frames: 77, bits: [{ bit: 2, efl: 'em007_00_001.efl', key: 380, on: [[54, 76]] }] },
    'L9 Motion[4]': { frames: 109, bits: [{ bit: 0, efl: 'em007_04_008.efl', key: 631, on: [[97, 98]] }] },
    'L9 Motion[6]': { frames: 31, bits: [{ bit: 2, efl: 'em007_00_000.efl', key: 353, on: [[9, 10]] }] },
    'L9 Motion[7]': { frames: 407, bits: [{ bit: 3, efl: 'em007_04_003.efl', key: 400, on: [[195, 196], [289, 290]] }] },
    'L9 Motion[8]': { frames: 105, bits: [{ bit: 0, efl: 'em007_00_001.efl', key: 381, on: [[1, 45]] }] },
    'L9 Motion[10]': { frames: 301, bits: [{ bit: 0, efl: 'em007_00_004.efl', key: 22, on: [[258, 259]] }] },
    'L9 Motion[11]': { frames: 97, bits: [{ bit: 0, efl: 'em007_04_005.efl', key: 750, on: [[8, 57]] }, { bit: 1, efl: 'em007_00_001.efl', key: 380, on: [[1, 30]] }] },
    'L9 Motion[13]': { frames: 83, bits: [{ bit: 0, efl: 'em007_00_004.efl', key: 22, on: [[77, 78]] }] },
    'L9 Motion[15]': { frames: 91, bits: [{ bit: 0, efl: 'em007_04_000.efl', key: 901, on: [[0, 90]] }] },
    'L9 Motion[16]': { frames: 383, bits: [{ bit: 1, efl: 'em007_04_005.efl', key: 783, on: [[68, 110], [167, 207]] }, { bit: 4, efl: 'em007_04_006.efl', key: 781, on: [[114, 115]] }, { bit: 5, efl: 'em007_04_006.efl', key: 782, on: [[167, 168]] }, { bit: 9, efl: 'em007_04_005.efl', key: 750, on: [[137, 210]] }] },
    'L9 Motion[18]': { frames: 283, bits: [{ bit: 0, efl: 'em007_04_008.efl', key: 920, on: [[90, 91]] }] },
    'L9 Motion[19]': { frames: 283, bits: [{ bit: 0, efl: 'em007_04_008.efl', key: 920, on: [[90, 91]] }] },
    'L9 Motion[23]': { frames: 371, bits: [{ bit: 1, efl: 'em007_04_000.efl', key: 913, on: [[7, 177]] }] },
    'L9 Motion[26]': { frames: 19, bits: [{ bit: 0, efl: 'em007_04_000.efl', key: 914, on: [[0, 18]] }] },
    'L9 Motion[27]': { frames: 85, bits: [{ bit: 0, efl: 'em007_04_000.efl', key: 914, on: [[0, 84]] }] },
    'L9 Motion[29]': { frames: 17, bits: [{ bit: 0, efl: 'em007_04_000.efl', key: 914, on: [[0, 16]] }] },
    'L9 Motion[30]': { frames: 263, bits: [{ bit: 0, efl: 'em007_04_000.efl', key: 914, on: [[0, 40]] }] },
  },
  // Savage Deviljho (em043_05): em043_00's PSL (Savage has none of its own), every slot that fires an exported
  // record -- the cm* library (footstep dust and the like) included: 54 of the 75 motions fire only cm202_*
  // dust/debris records. The game fires these from Lists 0, 2 and 3.
  em043_05: {
    'L0 Motion[2]': { frames: 303, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[165, 166]] }] },
    'L0 Motion[4]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[130, 131]] }] },
    'L0 Motion[5]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[62, 63]] }, { bit: 15, efl: 'cm202_050.efl', key: 60, on: [[96, 106]] }] },
    'L0 Motion[7]': { frames: 83, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[73, 74]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[26, 27]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[49, 50]] }] },
    'L0 Motion[10]': { frames: 89, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[72, 73]] }] },
    'L0 Motion[12]': { frames: 117, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[84, 85]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[57, 58]] }] },
    'L0 Motion[13]': { frames: 117, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[49, 50], [100, 101]] }] },
    'L0 Motion[18]': { frames: 313, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 5, on: [[115, 116]] }, { bit: 1, efl: 'cm202_020.efl', key: 15, on: [[271, 272]] }] },
    'L0 Motion[30]': { frames: 97, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[9, 10], [59, 60]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[36, 37], [83, 84]] }] },
    'L0 Motion[31]': { frames: 97, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[22, 23], [78, 79]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[50, 51]] }] },
    'L0 Motion[32]': { frames: 87, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[51, 52]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[23, 24]] }] },
    'L0 Motion[33]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 212, on: [[44, 45], [96, 97], [150, 151]] }, { bit: 1, efl: 'cm202_010.efl', key: 211, on: [[171, 284]] }] },
    'L0 Motion[34]': { frames: 247, bits: [{ bit: 1, efl: 'cm202_010.efl', key: 211, on: [[0, 54]] }] },
    'L0 Motion[35]': { frames: 75, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[20, 21]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[63, 64]] }] },
    'L0 Motion[42]': { frames: 199, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[53, 54]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[25, 26]] }] },
    'L0 Motion[43]': { frames: 81, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[41, 42]] }] },
    'L0 Motion[45]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[73, 74]] }, { bit: 1, efl: 'cm202_020.efl', key: 15, on: [[10, 11]] }] },
    'L0 Motion[48]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[63, 64], [180, 181]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[40, 41]] }] },
    'L2 Motion[1]': { frames: 165, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[19, 20]] }, { bit: 1, efl: 'cm202_000.efl', key: 30, on: [[33, 65]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[29, 48], [140, 141]] }] },
    'L2 Motion[2]': { frames: 171, bits: [{ bit: 0, efl: 'cm202_000.efl', key: 30, on: [[61, 140]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[60, 75], [104, 122]] }] },
    'L2 Motion[3]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[79, 80]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[9, 42]] }, { bit: 15, efl: 'cm202_031.efl', key: 121, on: [[38, 39]] }] },
    'L2 Motion[4]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[83, 84]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[18, 63]] }, { bit: 15, efl: 'cm202_030.efl', key: 120, on: [[41, 42]] }] },
    'L2 Motion[5]': { frames: 161, bits: [{ bit: 1, efl: 'cm202_001.efl', key: 1, on: [[81, 82]] }, { bit: 2, efl: 'cm202_000.efl', key: 30, on: [[31, 63]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[38, 56]] }] },
    'L2 Motion[6]': { frames: 161, bits: [{ bit: 1, efl: 'cm202_001.efl', key: 0, on: [[81, 82]] }, { bit: 2, efl: 'cm202_000.efl', key: 30, on: [[36, 73]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[38, 71]] }] },
    'L2 Motion[7]': { frames: 157, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[67, 68]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[43, 44]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[30, 89]] }] },
    'L2 Motion[8]': { frames: 157, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 3, on: [[67, 68]] }, { bit: 1, efl: 'cm202_002.efl', key: 2, on: [[43, 44]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[32, 107]] }] },
    'L2 Motion[9]': { frames: 255, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[55, 56]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[31, 32]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[122, 123]] }, { bit: 3, efl: 'cm202_000.efl', key: 30, on: [[135, 161]] }, { bit: 4, efl: 'cm202_002.efl', key: 4, on: [[2, 3]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[0, 25], [53, 76], [141, 149], [226, 229]] }] },
    'L2 Motion[10]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[16, 17]] }, { bit: 2, efl: 'cm202_035.efl', key: 43, on: [[40, 41]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[37, 76], [97, 101]] }] },
    'L2 Motion[11]': { frames: 193, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[17, 18]] }, { bit: 1, efl: 'cm202_035.efl', key: 43, on: [[112, 113]] }, { bit: 2, efl: 'cm202_035.efl', key: 42, on: [[49, 50], [177, 178]] }, { bit: 12, efl: 'em043_00_009.efl', key: 90, on: [[38, 51], [92, 116], [163, 192]] }] },
    'L2 Motion[12]': { frames: 179, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[66, 67]] }] },
    'L2 Motion[13]': { frames: 279, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 3, on: [[64, 65]] }, { bit: 1, efl: 'cm202_020.efl', key: 15, on: [[95, 96]] }] },
    'L2 Motion[15]': { frames: 75, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[30, 31]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[62, 63]] }] },
    'L2 Motion[18]': { frames: 89, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[48, 49]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[82, 83]] }] },
    'L2 Motion[19]': { frames: 321, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[59, 60]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[78, 79]] }, { bit: 2, efl: 'cm202_002.efl', key: 4, on: [[105, 106]] }] },
    'L2 Motion[20]': { frames: 321, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 3, on: [[59, 60]] }, { bit: 1, efl: 'cm202_002.efl', key: 2, on: [[78, 79]] }] },
    'L2 Motion[21]': { frames: 185, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[75, 76]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[51, 52]] }] },
    'L2 Motion[22]': { frames: 313, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 41, on: [[123, 124]] }, { bit: 1, efl: 'cm202_040.efl', key: 150, on: [[78, 103]] }] },
    'L2 Motion[23]': { frames: 275, bits: [{ bit: 0, efl: 'em032_00_000.efl', key: 230, on: [[86, 87], [109, 110]] }, { bit: 2, efl: 'cm202_001.efl', key: 0, on: [[44, 45], [235, 236]] }, { bit: 3, efl: 'cm202_001.efl', key: 1, on: [[14, 15], [212, 213]] }] },
    'L2 Motion[24]': { frames: 275, bits: [{ bit: 0, efl: 'em032_00_000.efl', key: 230, on: [[85, 86], [109, 110]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[44, 45], [235, 236]] }, { bit: 3, efl: 'cm202_001.efl', key: 0, on: [[14, 15], [212, 213]] }] },
    'L2 Motion[25]': { frames: 319, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[48, 49]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[115, 116]] }, { bit: 2, efl: 'em043_00_000.efl', key: 200, on: [[1, 30], [48, 129]] }, { bit: 3, efl: 'em043_00_001.efl', key: 201, on: [[129, 130]] }, { bit: 4, efl: 'em043_00_002.efl', key: 202, on: [[245, 299]] }, { bit: 5, efl: 'em043_00_003.efl', key: 203, on: [[130, 220]] }] },
    'L2 Motion[26]': { frames: 319, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[118, 119]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[60, 61]] }, { bit: 2, efl: 'em043_00_000.efl', key: 200, on: [[6, 7], [54, 137]] }, { bit: 3, efl: 'em043_00_001.efl', key: 201, on: [[137, 138]] }, { bit: 4, efl: 'em043_00_002.efl', key: 202, on: [[238, 307]] }, { bit: 5, efl: 'em043_00_003.efl', key: 203, on: [[137, 224]] }] },
    'L2 Motion[27]': { frames: 143, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[90, 91]] }] },
    'L2 Motion[29]': { frames: 257, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 41, on: [[99, 100]] }, { bit: 1, efl: 'cm202_040.efl', key: 150, on: [[47, 48]] }] },
    'L2 Motion[30]': { frames: 283, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 41, on: [[126, 127]] }, { bit: 1, efl: 'cm202_040.efl', key: 150, on: [[85, 86]] }] },
    'L2 Motion[33]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[40, 41], [116, 117]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[60, 61], [95, 96]] }] },
    'L2 Motion[35]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[96, 97]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[132, 133]] }] },
    'L2 Motion[38]': { frames: 313, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 41, on: [[125, 126]] }, { bit: 1, efl: 'cm202_040.efl', key: 150, on: [[74, 75]] }] },
    'L2 Motion[39]': { frames: 257, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 41, on: [[99, 100]] }, { bit: 1, efl: 'cm202_040.efl', key: 150, on: [[57, 58]] }] },
    'L2 Motion[41]': { frames: 235, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[62, 63]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[170, 171]] }] },
    'L2 Motion[42]': { frames: 235, bits: [{ bit: 2, efl: 'em043_00_000.efl', key: 200, on: [[0, 65]] }, { bit: 3, efl: 'em043_00_001.efl', key: 201, on: [[85, 86]] }, { bit: 4, efl: 'em043_00_003.efl', key: 203, on: [[93, 133]] }, { bit: 5, efl: 'em043_00_002.efl', key: 202, on: [[164, 219]] }] },
    'L2 Motion[43]': { frames: 107, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[94, 95]] }, { bit: 1, efl: 'em043_00_000.efl', key: 200, on: [[31, 106]] }] },
    'L2 Motion[44]': { frames: 51, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[47, 48]] }, { bit: 1, efl: 'em043_00_000.efl', key: 200, on: [[0, 50]] }] },
    'L3 Motion[1]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[19, 20]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[99, 100]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[114, 115]] }] },
    'L3 Motion[2]': { frames: 197, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[160, 161]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[178, 179]] }, { bit: 2, efl: 'cm202_002.efl', key: 4, on: [[2, 3]] }] },
    'L3 Motion[3]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[40, 41]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[25, 26]] }, { bit: 3, efl: 'cm202_020.efl', key: 15, on: [[50, 51]] }] },
    'L3 Motion[4]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[25, 26]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[34, 35]] }, { bit: 3, efl: 'cm202_020.efl', key: 15, on: [[50, 51]] }] },
    'L3 Motion[7]': { frames: 229, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[89, 90], [212, 213]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[98, 99], [175, 176]] }] },
    'L3 Motion[8]': { frames: 229, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[89, 90], [212, 213]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[98, 99], [175, 176]] }] },
    'L3 Motion[9]': { frames: 201, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[62, 63]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[31, 32]] }, { bit: 2, efl: 'cm202_002.efl', key: 4, on: [[3, 4]] }] },
    'L3 Motion[14]': { frames: 245, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[58, 59], [129, 130]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[25, 26], [87, 88]] }, { bit: 2, efl: 'cm202_020.efl', key: 15, on: [[196, 197]] }] },
    'L3 Motion[15]': { frames: 421, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 15, on: [[65, 66]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[43, 44]] }, { bit: 2, efl: 'cm202_021.efl', key: 5, on: [[127, 128]] }] },
    'L3 Motion[18]': { frames: 561, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[118, 119]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[45, 46]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[276, 277]] }, { bit: 3, efl: 'cm202_002.efl', key: 3, on: [[276, 277]] }, { bit: 4, efl: 'cm202_080.efl', key: 3000, on: [[290, 291]] }] },
    'L3 Motion[19]': { frames: 89, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 250, on: [[22, 23]] }] },
    'L3 Motion[21]': { frames: 193, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[112, 113]] }] },
    'L3 Motion[22]': { frames: 221, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[194, 195]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[147, 148]] }, { bit: 2, efl: 'cm202_020.efl', key: 15, on: [[42, 43]] }] },
    'L3 Motion[23]': { frames: 237, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[42, 43]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[60, 61]] }] },
    'L3 Motion[24]': { frames: 237, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[60, 61]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[42, 43]] }] },
    'L3 Motion[26]': { frames: 129, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[38, 39]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[53, 54]] }] },
    'L3 Motion[27]': { frames: 157, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[106, 107]] }, { bit: 1, efl: 'cm202_021.efl', key: 31, on: [[57, 58]] }] },
    'L3 Motion[28]': { frames: 311, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[253, 254]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[123, 124]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[56, 57], [172, 173]] }] },
    'L3 Motion[29]': { frames: 311, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[253, 254]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[123, 124]] }, { bit: 2, efl: 'cm202_002.efl', key: 3, on: [[56, 57], [172, 173]] }] },
    'L3 Motion[31]': { frames: 263, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[101, 102]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[22, 23]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[59, 60]] }, { bit: 3, efl: 'cm202_001.efl', key: 0, on: [[92, 93]] }] },
    'L3 Motion[33]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 15, on: [[7, 8]] }] },
    'L3 Motion[34]': { frames: 361, bits: [{ bit: 1, efl: 'cm202_080.efl', key: 3000, on: [[257, 258]] }] },
    'L3 Motion[35]': { frames: 41, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 15, on: [[23, 24]] }] },
  },
  // Khezu (em003_00), on the Special-list copies (ROM_ANIMATIONS): 'Motion 3' is L2 slot 3 whole (its _start and
  // _loop joined, 337 frames), 'Motion 28' is L2 slot 28. The slot names each record on more than one bit (key 201
  // on bits 6 and 9), and the game starts it once per bit.
  em003_00: {
    'Motion 3': { frames: 337, bits: [{ bit: 6, efl: 'em003_00_004.efl', key: 201, on: [[50, 177]] }, { bit: 7, efl: 'em003_00_006.efl', key: 200, on: [[170, 171]] }, { bit: 9, efl: 'em003_00_004.efl', key: 201, on: [[50, 177]] }, { bit: 10, efl: 'em003_00_006.efl', key: 200, on: [[170, 171]] }, { bit: 12, efl: 'em003_00_004.efl', key: 211, on: [[50, 177]] }, { bit: 13, efl: 'em003_00_006.efl', key: 210, on: [[170, 171]] }] },
    'Motion 28': { frames: 275, bits: [{ bit: 6, efl: 'em003_00_000.efl', key: 260, on: [[0, 132]] }, { bit: 7, efl: 'em003_00_001.efl', key: 261, on: [[132, 274]] }, { bit: 9, efl: 'em003_00_000.efl', key: 260, on: [[0, 132]] }, { bit: 10, efl: 'em003_00_001.efl', key: 261, on: [[132, 274]] }, { bit: 12, efl: 'em003_00_000.efl', key: 270, on: [[0, 132]] }, { bit: 13, efl: 'em003_00_001.efl', key: 271, on: [[132, 274]] }] },
  },
  // Nerscylla (em070_00), on the Special-list copies (S. names, list-qualified because motion numbers repeat):
  // Lists 0, 2 and 4. The c.pel dust (cm202_020/021) is not exported, so its bits are left out.
  em070_00: {
    'S. L0 Motion 18': { frames: 315, bits: [{ bit: 0, efl: 'em070_00_006.efl', key: 200, on: [[46, 47]] }] },
    'S. L2 Motion 1': { frames: 227, bits: [{ bit: 0, efl: 'cm202_030.efl', key: 430, on: [[80, 81]] }, { bit: 1, efl: 'cm202_031.efl', key: 431, on: [[87, 88]] }] },
    'S. L2 Motion 7': { frames: 215, bits: [{ bit: 15, efl: 'em070_00_008.efl', key: 270, on: [[31, 32]] }, { bit: 18, efl: 'em070_00_008.efl', key: 270, on: [[31, 32]] }, { bit: 21, efl: 'em070_00_008.efl', key: 280, on: [[31, 32]] }] },
    'S. L2 Motion 10': { frames: 235, bits: [{ bit: 15, efl: 'em070_00_008.efl', key: 270, on: [[32, 33]] }, { bit: 18, efl: 'em070_00_008.efl', key: 270, on: [[32, 33]] }] },
    'S. L2 Motion 13': { frames: 149, bits: [{ bit: 6, efl: 'em070_00_011.efl', key: 290, on: [[37, 38], [51, 52], [67, 68]] }] },
    'S. L2 Motion 24': { frames: 67, bits: [{ bit: 0, efl: 'em070_00_023.efl', key: 320, on: [[2, 64]] }] },
    'S. L2 Motion 27': { frames: 57, bits: [{ bit: 0, efl: 'em070_00_006.efl', key: 201, on: [[33, 34]] }] },
    'S. L2 Motion 30': { frames: 91, bits: [{ bit: 6, efl: 'em070_00_003.efl', key: 360, on: [[79, 80]] }, { bit: 9, efl: 'em070_00_003.efl', key: 360, on: [[79, 80]] }] },
    'S. L2 Motion 31': { frames: 143, bits: [{ bit: 1, efl: 'em070_00_003.efl', key: 361, on: [[1, 2]] }] },
    'S. L2 Motion 54': { frames: 15, bits: [{ bit: 0, efl: 'em070_00_006.efl', key: 201, on: [[12, 13]] }] },
    'S. L2 Motion 73': { frames: 205, bits: [{ bit: 0, efl: 'cm202_030.efl', key: 430, on: [[52, 53]] }] },
    'S. L2 Motion 74': { frames: 205, bits: [{ bit: 0, efl: 'cm202_031.efl', key: 431, on: [[52, 53]] }] },
    'S. L2 Motion 75': { frames: 91, bits: [{ bit: 0, efl: 'em070_00_023.efl', key: 320, on: [[2, 90]] }] },
    'S. L2 Motion 76': { frames: 81, bits: [{ bit: 0, efl: 'em070_00_023.efl', key: 320, on: [[0, 38]] }] },
    'S. L4 Motion 11': { frames: 57, bits: [{ bit: 0, efl: 'em070_00_006.efl', key: 200, on: [[8, 9]] }] },
    'S. L4 Motion 30': { frames: 49, bits: [{ bit: 0, efl: 'em070_00_006.efl', key: 200, on: [[29, 30]] }] },
    'S. L4 Motion 31': { frames: 49, bits: [{ bit: 0, efl: 'em070_00_006.efl', key: 200, on: [[29, 30]] }] },
  },
  // Rathian (em001_00): GENERATED by C:\MHGU-Extract\efx\add_effects.py from its PSLs (em001_00) -- every bit whose record is exported.
  em001_00: {
    'L0 Motion[2]': { frames: 347, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[63, 64]] }] },
    'L0 Motion[4]': { frames: 293, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[108, 128]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[51, 52]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[20, 21]] }] },
    'L0 Motion[5]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[111, 112]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[36, 37]] }] },
    'L0 Motion[6]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[2, 3]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[7]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[18, 19]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[59, 60]] }, { bit: 2, efl: 'cm202_000.efl', key: 30, on: [[0, 89]] }] },
    'L0 Motion[8]': { frames: 47, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[29, 30]] }] },
    'L0 Motion[11]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[30, 31]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[12, 13]] }] },
    'L0 Motion[12]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[12, 13]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[16]': { frames: 489, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[155, 201], [317, 330], [355, 376]] }] },
    'L0 Motion[17]': { frames: 169, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[18, 52]] }] },
    'L0 Motion[21]': { frames: 307, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[10, 11], [75, 76]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[38, 39]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[99, 100]] }, { bit: 3, efl: 'cm202_000.efl', key: 30, on: [[0, 61]] }] },
    'L0 Motion[22]': { frames: 13, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7]] }] },
    'L0 Motion[24]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[25]': { frames: 15, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L0 Motion[27]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[30]': { frames: 23, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L1 Motion[1]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[17, 18], [84, 85]] }] },
    'L1 Motion[2]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L1 Motion[3]': { frames: 285, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[88, 94]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[13, 14], [43, 44], [205, 206]] }] },
    'L1 Motion[5]': { frames: 75, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[42, 43]] }] },
    'L1 Motion[8]': { frames: 41, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[31, 32]] }] },
    'L1 Motion[11]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[12]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[13]': { frames: 115, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[110, 111]] }] },
    'L1 Motion[14]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[50, 51]] }] },
    'L1 Motion[15]': { frames: 81, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [45, 46]] }] },
    'L1 Motion[16]': { frames: 51, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[3, 4]] }] },
    'L1 Motion[17]': { frames: 107, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[2, 3]] }] },
    'L1 Motion[18]': { frames: 43, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[10, 11]] }] },
    'L1 Motion[19]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27]] }] },
    'L1 Motion[20]': { frames: 37, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[13, 14]] }] },
    'L1 Motion[21]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25], [89, 90]] }] },
    'L1 Motion[22]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[20, 21], [89, 90]] }] },
    'L1 Motion[23]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[30, 31], [92, 93]] }] },
    'L1 Motion[24]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[29, 30]] }] },
    'L1 Motion[25]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25]] }] },
    'L1 Motion[26]': { frames: 29, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 28]] }] },
    'L1 Motion[29]': { frames: 9, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 8]] }] },
    'L1 Motion[30]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61]] }] },
    'L1 Motion[32]': { frames: 127, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[123, 126]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[28, 29]] }] },
    'L1 Motion[33]': { frames: 161, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27], [90, 91]] }] },
    'L1 Motion[34]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[43, 44], [87, 88]] }] },
    'L1 Motion[35]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[36]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[37]': { frames: 151, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61], [106, 107]] }] },
    'L1 Motion[39]': { frames: 71, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[40, 41]] }] },
    'L1 Motion[40]': { frames: 67, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[52, 53]] }] },
    'L1 Motion[42]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16]] }] },
    'L1 Motion[43]': { frames: 53, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L2 Motion[1]': { frames: 181, bits: [{ bit: 0, efl: 'cm202_022.efl', key: 33, on: [[56, 57]] }] },
    'L2 Motion[2]': { frames: 183, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[0, 1]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[36, 37]] }, { bit: 2, efl: 'cm202_002.efl', key: 4, on: [[60, 61]] }, { bit: 3, efl: 'cm202_022.efl', key: 32, on: [[50, 51]] }] },
    'L2 Motion[4]': { frames: 121, bits: [{ bit: 21, efl: 'cm202_031.efl', key: 511, on: [[33, 34]] }] },
    'L2 Motion[7]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[11, 12], [45, 46], [107, 108]] }, { bit: 1, efl: 'cm202_000.efl', key: 30, on: [[72, 88]] }] },
    'L2 Motion[8]': { frames: 365, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[109, 110]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[40, 41]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[6, 7], [87, 88]] }] },
    'L2 Motion[10]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 30], [31, 60], [61, 90], [91, 119], [120, 122]] }] },
    'L2 Motion[11]': { frames: 99, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[21, 22], [54, 55]] }] },
    'L2 Motion[12]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[80, 90]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[20, 21]] }] },
    'L2 Motion[13]': { frames: 147, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [36, 37], [101, 102], [130, 131]] }] },
    'L2 Motion[14]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[14, 15], [75, 76]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[52, 53]] }] },
    'L2 Motion[15]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[16]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[17]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L2 Motion[18]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L3 Motion[2]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[32, 33]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59]] }] },
    'L3 Motion[3]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[4]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[9]': { frames: 171, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[4, 5]] }] },
    'L3 Motion[11]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[2, 3]] }] },
    'L3 Motion[12]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[70, 71]] }] },
    'L3 Motion[14]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[230, 231]] }] },
    'L3 Motion[15]': { frames: 369, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[60, 61]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[16, 17]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[89, 90]] }] },
    'L3 Motion[17]': { frames: 581, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[283, 284]] }] },
    'L3 Motion[18]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 250, on: [[3, 4]] }] },
    'L3 Motion[20]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[86, 87]] }] },
    'L3 Motion[21]': { frames: 405, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16], [93, 94], [134, 135], [183, 184], [221, 222], [267, 268], [299, 300], [357, 358]] }] },
    'L3 Motion[23]': { frames: 249, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[56, 57], [98, 99], [143, 144]] }] },
    'L3 Motion[24]': { frames: 125, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[3, 4]] }] },
    'L3 Motion[26]': { frames: 401, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[21, 22], [184, 185], [233, 234], [280, 281], [373, 374]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59], [214, 215], [296, 297], [365, 366]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[159, 160], [239, 240]] }, { bit: 3, efl: 'cm202_002.efl', key: 3, on: [[265, 266]] }] },
    'L3 Motion[28]': { frames: 203, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[90, 91]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[59, 60]] }] },
    'L3 Motion[29]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[26, 27]] }] },
    'L4 Motion[1]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2], [48, 49], [72, 73]] }] },
    'L4 Motion[2]': { frames: 113, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[43, 44]] }] },
    'L4 Motion[3]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L4 Motion[4]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[56, 57]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[22, 23]] }] },
    'L4 Motion[5]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[103, 104]] }] },
    'L4 Motion[6]': { frames: 173, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[103, 104], [142, 143]] }, { bit: 15, efl: 'em044_00_000.efl', key: 530, on: [[8, 9]] }, { bit: 21, efl: 'em044_00_000.efl', key: 540, on: [[8, 9]] }] },
    'L4 Motion[7]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[33, 34]] }] },
    'L4 Motion[8]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 80]] }] },
    'L4 Motion[9]': { frames: 175, bits: [{ bit: 0, efl: 'cm202_000.efl', key: 30, on: [[85, 122]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[34, 35], [145, 146], [170, 171]] }] },
    'L4 Motion[10]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[37, 38]] }] },
    'L4 Motion[11]': { frames: 119, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[8, 9], [55, 56]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[15, 16], [64, 65]] }] },
    'L4 Motion[12]': { frames: 35, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2]] }] },
    'L4 Motion[13]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[16, 17]] }] },
    'L4 Motion[15]': { frames: 117, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[7, 8]] }] },
    'L4 Motion[16]': { frames: 243, bits: [{ bit: 6, efl: 'em001_02_002.efl', key: 230, on: [[2, 93]] }, { bit: 7, efl: 'em001_02_003.efl', key: 231, on: [[103, 104]] }, { bit: 8, efl: 'em001_02_000.efl', key: 232, on: [[160, 185]] }, { bit: 9, efl: 'em001_02_002.efl', key: 230, on: [[2, 93]] }, { bit: 10, efl: 'em001_02_003.efl', key: 231, on: [[103, 104]] }, { bit: 11, efl: 'em001_02_000.efl', key: 232, on: [[160, 185]] }] },
    'L4 Motion[17]': { frames: 141, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[2, 3]] }] },
    'L4 Motion[53]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[2, 80]] }] },
    'L4 Motion[54]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[2, 80]] }] },
    'L4 Motion[55]': { frames: 219, bits: [{ bit: 0, efl: 'cm202_000.efl', key: 30, on: [[47, 64]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[16, 17], [123, 124], [150, 151], [186, 187]] }] },
    'L4 Motion[60]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[37, 38]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[20, 21], [63, 64]] }, { bit: 2, efl: 'cm202_021.efl', key: 6, on: [[88, 89]] }] },
    'L4 Motion[65]': { frames: 225, bits: [{ bit: 0, efl: 'cm202_022.efl', key: 33, on: [[64, 65]] }, { bit: 1, efl: 'cm202_020.efl', key: 350, on: [[118, 119]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[68, 69]] }] },
  },
  // Raging Brachydios (em063_05): GENERATED by C:\MHGU-Extract\efx\add_effects.py from its PSLs (em063_00, em063_05) -- every bit whose record is exported.
  em063_05: {
    'L0 Motion[2]': { frames: 381, bits: [{ bit: 0, efl: 'em063_00_009.efl', key: 150, on: [[177, 211], [273, 309]] }, { bit: 1, efl: 'em063_00_010.efl', key: 151, on: [[98, 138]] }, { bit: 2, efl: 'em063_00_009.efl', key: 152, on: [[45, 54]] }] },
    'L0 Motion[4]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 60, on: [[96, 127]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[62, 63], [229, 230]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[11, 12], [265, 266]] }] },
    'L0 Motion[5]': { frames: 61, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[49, 50]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[30, 31]] }] },
    'L0 Motion[7]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[69, 70]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[8]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[58, 59]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[9]': { frames: 265, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[42, 43], [135, 136], [221, 222]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[116, 117], [250, 251]] }] },
    'L0 Motion[11]': { frames: 59, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[50, 51]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[18, 19]] }] },
    'L0 Motion[12]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[19, 20], [69, 70]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[45, 46]] }] },
    'L0 Motion[13]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[44, 45], [74, 75]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[10, 11], [61, 62]] }] },
    'L0 Motion[15]': { frames: 287, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[10, 11]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[65, 66]] }, { bit: 2, efl: 'cm202_050.efl', key: 60, on: [[163, 189]] }, { bit: 3, efl: 'cm202_001.efl', key: 0, on: [[34, 35], [149, 150], [271, 272]] }, { bit: 4, efl: 'cm202_001.efl', key: 1, on: [[92, 93]] }] },
    'L0 Motion[16]': { frames: 69, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[20, 21]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[41, 42]] }] },
    'L0 Motion[17]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[18, 19], [67, 68]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[48, 49]] }] },
    'L0 Motion[18]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[44, 45], [72, 73]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[18, 19], [60, 61]] }] },
    'L0 Motion[19]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[18, 19], [67, 68]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[48, 49], [85, 86]] }] },
    'L0 Motion[20]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[47, 48], [82, 83]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[24, 25], [68, 69]] }] },
    'L0 Motion[21]': { frames: 51, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[26, 27]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[8, 9], [42, 43]] }] },
    'L0 Motion[22]': { frames: 51, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[5, 6], [32, 33]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[23, 24], [41, 42]] }] },
    'L0 Motion[24]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[13, 14], [48, 49]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[26, 27]] }] },
    'L0 Motion[26]': { frames: 29, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[16, 17]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[27, 28]] }] },
    'L0 Motion[27]': { frames: 29, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[16, 17]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[27, 28]] }] },
    'L0 Motion[32]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[43, 44]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[20, 21]] }] },
    'L0 Motion[33]': { frames: 141, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[20, 21], [67, 68]] }, { bit: 1, efl: 'em063_00_009.efl', key: 150, on: [[7, 41], [66, 99]] }, { bit: 2, efl: 'cm202_001.efl', key: 0, on: [[40, 41], [98, 99]] }] },
    'L0 Motion[34]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[24, 25], [89, 90]] }, { bit: 1, efl: 'em063_00_009.efl', key: 150, on: [[25, 63]] }, { bit: 2, efl: 'cm202_001.efl', key: 0, on: [[48, 49]] }] },
    'L0 Motion[35]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[24, 25], [89, 90]] }, { bit: 1, efl: 'em063_00_009.efl', key: 150, on: [[25, 63]] }] },
    'L0 Motion[36]': { frames: 73, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[42, 43]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[16, 17]] }] },
    'L0 Motion[38]': { frames: 221, bits: [{ bit: 0, efl: 'cm202_010.efl', key: 90, on: [[42, 199]] }] },
    'L0 Motion[39]': { frames: 213, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 91, on: [[61, 62]] }, { bit: 1, efl: 'cm202_001.efl', key: 7, on: [[115, 116]] }, { bit: 2, efl: 'cm202_001.efl', key: 8, on: [[98, 99]] }, { bit: 3, efl: 'cm202_010.efl', key: 90, on: [[0, 53]] }] },
    'L0 Motion[50]': { frames: 107, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[56, 85]] }] },
    'L0 Motion[51]': { frames: 277, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[8, 83], [101, 147]] }] },
    'L0 Motion[55]': { frames: 81, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[41, 42]] }] },
    'L0 Motion[64]': { frames: 85, bits: [{ bit: 0, efl: 'em063_00_012.efl', key: 122, on: [[54, 55]] }, { bit: 1, efl: 'cm202_020.efl', key: 5, on: [[76, 77]] }] },
    'L2 Motion[1]': { frames: 81, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[27, 28]] }, { bit: 1, efl: 'em063_00_009.efl', key: 150, on: [[8, 17], [34, 49]] }, { bit: 2, efl: 'cm202_001.efl', key: 0, on: [[44, 45]] }] },
    'L2 Motion[3]': { frames: 169, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 31, on: [[2, 3]] }] },
    'L2 Motion[4]': { frames: 45, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[12, 13]] }] },
    'L2 Motion[5]': { frames: 97, bits: [{ bit: 1, efl: 'cm202_001.efl', key: 1, on: [[40, 41]] }, { bit: 2, efl: 'cm202_001.efl', key: 0, on: [[80, 81]] }] },
    'L2 Motion[7]': { frames: 45, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[12, 13]] }] },
    'L2 Motion[8]': { frames: 97, bits: [{ bit: 1, efl: 'cm202_001.efl', key: 0, on: [[42, 43]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[80, 81]] }] },
    'L2 Motion[10]': { frames: 59, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[8, 9]] }] },
    'L2 Motion[11]': { frames: 175, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[38, 39], [148, 149]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[25, 26], [134, 135]] }] },
    'L2 Motion[12]': { frames: 59, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[29, 30]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[9, 10]] }] },
    'L2 Motion[13]': { frames: 175, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[25, 26]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[35, 36]] }] },
    'L2 Motion[15]': { frames: 59, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[11, 12]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[28, 29]] }] },
    'L2 Motion[16]': { frames: 179, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[154, 155]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[136, 137]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[13, 14]] }] },
    'L2 Motion[18]': { frames: 179, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[27, 28], [154, 155]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[32, 33], [136, 137]] }, { bit: 2, efl: 'cm202_002.efl', key: 3, on: [[13, 14]] }, { bit: 3, efl: 'cm202_002.efl', key: 2, on: [[5, 6], [25, 26]] }] },
    'L2 Motion[21]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[27, 28], [96, 97]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[46, 47], [71, 72], [136, 137]] }] },
    'L2 Motion[22]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[25, 26]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[16, 17]] }] },
    'L2 Motion[23]': { frames: 219, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[47, 48]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[87, 88]] }] },
    'L2 Motion[28]': { frames: 173, bits: [{ bit: 0, efl: 'em023_00_011.efl', key: 131, on: [[67, 68]] }, { bit: 1, efl: 'cm202_035.efl', key: 241, on: [[53, 54]] }] },
    'L2 Motion[29]': { frames: 173, bits: [{ bit: 0, efl: 'em023_00_011.efl', key: 130, on: [[67, 68]] }, { bit: 1, efl: 'cm202_035.efl', key: 240, on: [[49, 50]] }] },
    'L2 Motion[41]': { frames: 357, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 132, on: [[124, 125]] }] },
    'L2 Motion[42]': { frames: 257, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 132, on: [[87, 88]] }, { bit: 18, efl: 'em063_00_005.efl', key: 200, on: [[9, 94]] }] },
    'L2 Motion[48]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[38, 39]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[22, 23]] }] },
    'L3 Motion[2]': { frames: 205, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[40, 41]] }, { bit: 1, efl: 'cm202_002.efl', key: 2, on: [[15, 16]] }] },
    'L3 Motion[3]': { frames: 205, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[40, 41]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[13, 14]] }] },
    'L3 Motion[4]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[45, 46]] }, { bit: 1, efl: 'cm202_002.efl', key: 2, on: [[15, 16]] }] },
    'L3 Motion[5]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[45, 46]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[15, 16]] }] },
    'L3 Motion[6]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[44, 45]] }, { bit: 1, efl: 'cm202_001.efl', key: 8, on: [[49, 50]] }] },
    'L3 Motion[8]': { frames: 485, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[140, 141]] }, { bit: 1, efl: 'cm202_001.efl', key: 7, on: [[357, 358], [369, 370], [379, 380]] }, { bit: 2, efl: 'cm202_080.efl', key: 3000, on: [[393, 394]] }] },
    'L3 Motion[9]': { frames: 219, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[180, 181]] }, { bit: 1, efl: 'cm202_001.efl', key: 7, on: [[153, 154], [163, 164]] }] },
    'L3 Motion[12]': { frames: 197, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[89, 90]] }, { bit: 1, efl: 'cm202_001.efl', key: 7, on: [[62, 63]] }] },
    'L3 Motion[13]': { frames: 197, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[89, 90]] }, { bit: 1, efl: 'cm202_001.efl', key: 8, on: [[62, 63]] }] },
    'L3 Motion[17]': { frames: 75, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 250, on: [[3, 4]] }] },
    'L3 Motion[19]': { frames: 163, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[101, 102]] }] },
    'L3 Motion[22]': { frames: 361, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[52, 53]] }, { bit: 1, efl: 'cm202_021.efl', key: 31, on: [[100, 101]] }] },
    'L3 Motion[23]': { frames: 113, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[36, 37]] }] },
    'L3 Motion[24]': { frames: 221, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 8, on: [[96, 97]] }, { bit: 1, efl: 'cm202_021.efl', key: 31, on: [[56, 57]] }] },
    'L3 Motion[29]': { frames: 243, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[60, 61], [194, 195]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[94, 95]] }, { bit: 2, efl: 'cm202_001.efl', key: 7, on: [[40, 41]] }] },
    'L3 Motion[30]': { frames: 243, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[102, 103]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[141, 142]] }, { bit: 2, efl: 'cm202_001.efl', key: 8, on: [[40, 41]] }] },
    'L3 Motion[31]': { frames: 221, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 3, on: [[66, 67]] }] },
    'L3 Motion[33]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[3, 4]] }] },
    'L3 Motion[34]': { frames: 391, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[285, 286]] }, { bit: 1, efl: 'cm202_001.efl', key: 7, on: [[272, 273], [288, 289]] }, { bit: 2, efl: 'cm202_001.efl', key: 8, on: [[162, 163]] }] },
    'L3 Motion[35]': { frames: 41, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[24, 25]] }] },
    'L3 Motion[37]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[5, 6]] }] },
  },
  // Nargacuga (em037_00): GENERATED by C:\MHGU-Extract\efx\add_effects.py from its PSLs (em032_00, em037_00) -- every bit whose record is exported.
  em037_00: {
    'L0 Motion[3]': { frames: 157, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 10, on: [[44, 45]] }, { bit: 1, efl: 'cm202_001.efl', key: 11, on: [[114, 115]] }] },
    'L0 Motion[6]': { frames: 63, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 20, on: [[52, 53]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[20, 21]] }] },
    'L0 Motion[7]': { frames: 63, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 20, on: [[19, 20]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[52, 53]] }] },
    'L0 Motion[8]': { frames: 95, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 20, on: [[11, 12], [93, 94]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[78, 79]] }] },
    'L0 Motion[9]': { frames: 115, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 21, on: [[76, 77]] }, { bit: 1, efl: 'cm202_001.efl', key: 20, on: [[57, 58], [98, 99]] }] },
    'L0 Motion[10]': { frames: 65, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 21, on: [[6, 7]] }, { bit: 1, efl: 'cm202_001.efl', key: 20, on: [[11, 12]] }] },
    'L0 Motion[22]': { frames: 217, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[167, 168]] }] },
    'L0 Motion[23]': { frames: 533, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 120, on: [[190, 205], [214, 222], [228, 240], [263, 277], [294, 302], [327, 336], [363, 366], [395, 397]] }] },
    'L0 Motion[26]': { frames: 293, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 100, on: [[130, 132]] }, { bit: 1, efl: 'cm202_001.efl', key: 20, on: [[34, 35]] }, { bit: 2, efl: 'cm202_001.efl', key: 21, on: [[26, 27]] }] },
    'L0 Motion[27]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[74, 75]] }] },
    'L0 Motion[28]': { frames: 147, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[10, 11]] }] },
    'L0 Motion[31]': { frames: 167, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[2, 3]] }] },
    'L0 Motion[32]': { frames: 167, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[2, 3]] }] },
    'L0 Motion[33]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 30, on: [[3, 4]] }] },
    'L0 Motion[34]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 30, on: [[3, 4]] }] },
    'L0 Motion[35]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[30, 31]] }] },
    'L0 Motion[36]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 30, on: [[5, 6]] }, { bit: 1, efl: 'cm202_020.efl', key: 31, on: [[3, 4]] }] },
    'L0 Motion[37]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[30, 31]] }] },
    'L0 Motion[38]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 30, on: [[5, 6]] }] },
    'L1 Motion[1]': { frames: 61, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[57, 58]] }] },
    'L1 Motion[2]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[5, 6]] }] },
    'L1 Motion[3]': { frames: 53, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 200, on: [[27, 52]] }] },
    'L1 Motion[4]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 200, on: [[0, 92]] }] },
    'L1 Motion[5]': { frames: 67, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 200, on: [[0, 66]] }] },
    'L1 Motion[6]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[42, 43]] }] },
    'L1 Motion[7]': { frames: 65, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[50, 51]] }] },
    'L1 Motion[8]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[20, 21], [63, 64]] }] },
    'L1 Motion[9]': { frames: 117, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[40, 41], [89, 90]] }] },
    'L2 Motion[1]': { frames: 185, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 20, on: [[82, 83]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[75, 76]] }, { bit: 2, efl: 'cm202_000.efl', key: 80, on: [[50, 82]] }] },
    'L2 Motion[2]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_030.efl', key: 70, on: [[74, 75]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[36, 37]] }, { bit: 2, efl: 'cm202_001.efl', key: 20, on: [[26, 27]] }] },
    'L2 Motion[3]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_030.efl', key: 81, on: [[74, 75]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[26, 27]] }, { bit: 2, efl: 'cm202_001.efl', key: 20, on: [[36, 37]] }] },
    'L2 Motion[4]': { frames: 125, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[90, 91]] }] },
    'L2 Motion[5]': { frames: 99, bits: [{ bit: 2, efl: 'cm202_020.efl', key: 51, on: [[50, 51]] }] },
    'L2 Motion[6]': { frames: 123, bits: [{ bit: 1, efl: 'cm202_020.efl', key: 53, on: [[1, 2]] }] },
    'L2 Motion[9]': { frames: 147, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 20, on: [[37, 38]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[38, 39]] }] },
    'L2 Motion[10]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[10, 11]] }] },
    'L2 Motion[11]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 1, on: [[4, 5]] }, { bit: 1, efl: 'cm202_030.efl', key: 73, on: [[1, 2]] }] },
    'L2 Motion[13]': { frames: 147, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 20, on: [[38, 39]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[37, 38]] }] },
    'L2 Motion[14]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[10, 11]] }] },
    'L2 Motion[15]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 0, on: [[10, 11]] }, { bit: 1, efl: 'cm202_030.efl', key: 84, on: [[0, 1]] }] },
    'L2 Motion[17]': { frames: 73, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[33, 34]] }] },
    'L2 Motion[18]': { frames: 127, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 30, on: [[4, 5]] }, { bit: 1, efl: 'cm202_020.efl', key: 31, on: [[3, 4]] }] },
    'L2 Motion[19]': { frames: 253, bits: [{ bit: 0, efl: 'cm202_030.efl', key: 71, on: [[107, 108]] }, { bit: 1, efl: 'cm202_001.efl', key: 20, on: [[37, 38]] }, { bit: 2, efl: 'cm202_001.efl', key: 21, on: [[38, 39]] }] },
    'L2 Motion[20]': { frames: 253, bits: [{ bit: 0, efl: 'cm202_030.efl', key: 82, on: [[107, 108]] }, { bit: 1, efl: 'cm202_001.efl', key: 20, on: [[38, 39]] }, { bit: 2, efl: 'cm202_001.efl', key: 21, on: [[37, 38]] }] },
    'L2 Motion[21]': { frames: 211, bits: [{ bit: 1, efl: 'cm202_020.efl', key: 51, on: [[50, 51], [154, 155]] }] },
    'L3 Motion[1]': { frames: 201, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[55, 56]] }] },
    'L3 Motion[2]': { frames: 181, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 46, on: [[2, 3]] }, { bit: 1, efl: 'cm202_002.efl', key: 47, on: [[1, 2]] }] },
    'L3 Motion[4]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[65, 66]] }] },
    'L3 Motion[5]': { frames: 251, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 20, on: [[53, 54], [117, 118], [204, 205]] }, { bit: 1, efl: 'cm202_001.efl', key: 21, on: [[34, 35], [80, 81], [195, 196]] }] },
    'L3 Motion[6]': { frames: 521, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[38, 39]] }, { bit: 1, efl: 'cm202_080.efl', key: 3000, on: [[455, 456]] }] },
    'L3 Motion[7]': { frames: 125, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[36, 37]] }] },
    'L3 Motion[10]': { frames: 125, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[30, 31]] }] },
    'L3 Motion[15]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[8, 9]] }] },
    'L3 Motion[16]': { frames: 111, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 55, on: [[3, 4]] }] },
    'L3 Motion[18]': { frames: 151, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[121, 122]] }] },
    'L3 Motion[28]': { frames: 41, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[19, 20]] }] },
    'L3 Motion[30]': { frames: 95, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 61, on: [[8, 9]] }] },
    'L3 Motion[33]': { frames: 231, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[137, 138]] }, { bit: 1, efl: 'cm202_002.efl', key: 2, on: [[9, 10], [98, 99]] }, { bit: 2, efl: 'cm202_002.efl', key: 3, on: [[22, 23]] }] },
    'L3 Motion[34]': { frames: 371, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 60, on: [[64, 65]] }, { bit: 1, efl: 'cm202_002.efl', key: 2, on: [[30, 31], [106, 107]] }, { bit: 2, efl: 'cm202_002.efl', key: 3, on: [[10, 11], [130, 131], [261, 262], [356, 357]] }] },
    'L4 Motion[2]': { frames: 253, bits: [{ bit: 0, efl: 'cm202_030.efl', key: 71, on: [[110, 111]] }] },
    'L4 Motion[3]': { frames: 253, bits: [{ bit: 0, efl: 'cm202_030.efl', key: 83, on: [[110, 111]] }] },
  },
  // Gold Rathian (em001_02): GENERATED by C:\MHGU-Extract\efx\add_effects.py from its PSLs (em001_00, em001_02) -- every bit whose record is exported.
  em001_02: {
    'L0 Motion[2]': { frames: 347, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[63, 64]] }] },
    'L0 Motion[4]': { frames: 293, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[108, 128]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[51, 52]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[20, 21]] }] },
    'L0 Motion[5]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[111, 112]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[36, 37]] }] },
    'L0 Motion[6]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[2, 3]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[7]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[18, 19]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[59, 60]] }, { bit: 2, efl: 'cm202_000.efl', key: 30, on: [[0, 89]] }] },
    'L0 Motion[8]': { frames: 47, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[29, 30]] }] },
    'L0 Motion[11]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[30, 31]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[12, 13]] }] },
    'L0 Motion[12]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[12, 13]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[16]': { frames: 489, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[155, 201], [317, 330], [355, 376]] }] },
    'L0 Motion[17]': { frames: 169, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[18, 52]] }] },
    'L0 Motion[21]': { frames: 307, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[10, 11], [75, 76]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[38, 39]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[99, 100]] }, { bit: 3, efl: 'cm202_000.efl', key: 30, on: [[0, 61]] }] },
    'L0 Motion[22]': { frames: 13, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7]] }] },
    'L0 Motion[24]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[25]': { frames: 15, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L0 Motion[27]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[30]': { frames: 23, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L1 Motion[1]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[17, 18], [84, 85]] }] },
    'L1 Motion[2]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L1 Motion[3]': { frames: 285, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[88, 94]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[13, 14], [43, 44], [205, 206]] }] },
    'L1 Motion[5]': { frames: 75, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[42, 43]] }] },
    'L1 Motion[8]': { frames: 41, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[31, 32]] }] },
    'L1 Motion[11]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[12]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[13]': { frames: 115, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[110, 111]] }] },
    'L1 Motion[14]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[50, 51]] }] },
    'L1 Motion[15]': { frames: 81, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [45, 46]] }] },
    'L1 Motion[16]': { frames: 51, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[3, 4]] }] },
    'L1 Motion[17]': { frames: 107, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[2, 3]] }] },
    'L1 Motion[18]': { frames: 43, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[10, 11]] }] },
    'L1 Motion[19]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27]] }] },
    'L1 Motion[20]': { frames: 37, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[13, 14]] }] },
    'L1 Motion[21]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25], [89, 90]] }] },
    'L1 Motion[22]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[20, 21], [89, 90]] }] },
    'L1 Motion[23]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[30, 31], [92, 93]] }] },
    'L1 Motion[24]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[29, 30]] }] },
    'L1 Motion[25]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25]] }] },
    'L1 Motion[26]': { frames: 29, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 28]] }] },
    'L1 Motion[29]': { frames: 9, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 8]] }] },
    'L1 Motion[30]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61]] }] },
    'L1 Motion[32]': { frames: 127, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[123, 126]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[28, 29]] }] },
    'L1 Motion[33]': { frames: 161, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27], [90, 91]] }] },
    'L1 Motion[34]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[43, 44], [87, 88]] }] },
    'L1 Motion[35]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[36]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[37]': { frames: 151, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61], [106, 107]] }] },
    'L1 Motion[39]': { frames: 71, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[40, 41]] }] },
    'L1 Motion[40]': { frames: 67, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[52, 53]] }] },
    'L1 Motion[42]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16]] }] },
    'L1 Motion[43]': { frames: 53, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L2 Motion[1]': { frames: 181, bits: [{ bit: 0, efl: 'cm202_022.efl', key: 33, on: [[56, 57]] }] },
    'L2 Motion[2]': { frames: 183, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[0, 1]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[36, 37]] }, { bit: 2, efl: 'cm202_002.efl', key: 4, on: [[60, 61]] }, { bit: 3, efl: 'cm202_022.efl', key: 32, on: [[50, 51]] }] },
    'L2 Motion[4]': { frames: 121, bits: [{ bit: 21, efl: 'cm202_031.efl', key: 511, on: [[33, 34]] }] },
    'L2 Motion[7]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[11, 12], [45, 46], [107, 108]] }, { bit: 1, efl: 'cm202_000.efl', key: 30, on: [[72, 88]] }] },
    'L2 Motion[8]': { frames: 365, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[109, 110]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[40, 41]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[6, 7], [87, 88]] }] },
    'L2 Motion[10]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 30], [31, 60], [61, 90], [91, 119], [120, 122]] }] },
    'L2 Motion[11]': { frames: 99, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[21, 22], [54, 55]] }] },
    'L2 Motion[12]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[80, 90]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[20, 21]] }] },
    'L2 Motion[13]': { frames: 147, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [36, 37], [101, 102], [130, 131]] }] },
    'L2 Motion[14]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[14, 15], [75, 76]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[52, 53]] }] },
    'L2 Motion[15]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[16]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[17]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L2 Motion[18]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L3 Motion[2]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[32, 33]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59]] }] },
    'L3 Motion[3]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[4]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[9]': { frames: 171, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[4, 5]] }] },
    'L3 Motion[11]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[2, 3]] }] },
    'L3 Motion[12]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[70, 71]] }] },
    'L3 Motion[14]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[230, 231]] }] },
    'L3 Motion[15]': { frames: 369, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[60, 61]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[16, 17]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[89, 90]] }] },
    'L3 Motion[17]': { frames: 581, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[283, 284]] }] },
    'L3 Motion[18]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 250, on: [[3, 4]] }] },
    'L3 Motion[20]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[86, 87]] }] },
    'L3 Motion[21]': { frames: 405, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16], [93, 94], [134, 135], [183, 184], [221, 222], [267, 268], [299, 300], [357, 358]] }] },
    'L3 Motion[23]': { frames: 249, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[56, 57], [98, 99], [143, 144]] }] },
    'L3 Motion[24]': { frames: 125, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[3, 4]] }] },
    'L3 Motion[26]': { frames: 401, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[21, 22], [184, 185], [233, 234], [280, 281], [373, 374]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59], [214, 215], [296, 297], [365, 366]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[159, 160], [239, 240]] }, { bit: 3, efl: 'cm202_002.efl', key: 3, on: [[265, 266]] }] },
    'L3 Motion[28]': { frames: 203, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[90, 91]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[59, 60]] }] },
    'L3 Motion[29]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[26, 27]] }] },
    'L4 Motion[1]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2], [48, 49], [72, 73]] }] },
    'L4 Motion[2]': { frames: 113, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[43, 44]] }] },
    'L4 Motion[3]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L4 Motion[4]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[56, 57]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[22, 23]] }] },
    'L4 Motion[5]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[103, 104]] }] },
    'L4 Motion[6]': { frames: 173, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[103, 104], [142, 143]] }, { bit: 15, efl: 'em044_00_000.efl', key: 530, on: [[8, 9]] }, { bit: 21, efl: 'em044_00_000.efl', key: 540, on: [[8, 9]] }] },
    'L4 Motion[7]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[33, 34]] }] },
    'L4 Motion[8]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 80]] }] },
    'L4 Motion[9]': { frames: 175, bits: [{ bit: 0, efl: 'cm202_000.efl', key: 30, on: [[85, 122]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[34, 35], [145, 146], [170, 171]] }] },
    'L4 Motion[10]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[37, 38]] }] },
    'L4 Motion[11]': { frames: 119, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[8, 9], [55, 56]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[15, 16], [64, 65]] }] },
    'L4 Motion[12]': { frames: 35, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2]] }] },
    'L4 Motion[13]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[16, 17]] }] },
    'L4 Motion[15]': { frames: 117, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[7, 8]] }] },
    'L4 Motion[16]': { frames: 243, bits: [{ bit: 6, efl: 'em001_02_002.efl', key: 230, on: [[2, 93]] }, { bit: 7, efl: 'em001_02_003.efl', key: 231, on: [[103, 104]] }, { bit: 8, efl: 'em001_02_000.efl', key: 232, on: [[160, 185]] }, { bit: 9, efl: 'em001_02_002.efl', key: 230, on: [[2, 93]] }, { bit: 10, efl: 'em001_02_003.efl', key: 231, on: [[103, 104]] }, { bit: 11, efl: 'em001_02_000.efl', key: 232, on: [[160, 185]] }] },
    'L4 Motion[17]': { frames: 141, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[2, 3]] }] },
    'L4 Motion[20]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[7, 8], [94, 95]] }] },
    'L4 Motion[21]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[7, 8], [94, 95]] }] },
    'L4 Motion[39]': { frames: 163, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[65, 66], [142, 143]] }] },
    'L4 Motion[49]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[114, 115]] }] },
    'L4 Motion[50]': { frames: 229, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[157, 158], [200, 201]] }, { bit: 15, efl: 'cm202_031.efl', key: 531, on: [[6, 7]] }] },
    'L4 Motion[51]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[114, 115]] }] },
    'L4 Motion[52]': { frames: 229, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[123, 124], [200, 201]] }, { bit: 15, efl: 'cm202_030.efl', key: 532, on: [[6, 7]] }] },
    'L4 Motion[53]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[2, 80]] }] },
    'L4 Motion[54]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[2, 80]] }] },
    'L4 Motion[55]': { frames: 219, bits: [{ bit: 0, efl: 'cm202_000.efl', key: 30, on: [[47, 64]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[16, 17], [123, 124], [150, 151], [186, 187]] }] },
    'L4 Motion[60]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[37, 38]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[20, 21], [63, 64]] }, { bit: 2, efl: 'cm202_021.efl', key: 6, on: [[88, 89]] }] },
    'L4 Motion[65]': { frames: 225, bits: [{ bit: 0, efl: 'cm202_022.efl', key: 33, on: [[64, 65]] }, { bit: 1, efl: 'cm202_020.efl', key: 350, on: [[118, 119]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[68, 69]] }] },
  },
  // Dreadqueen Rathian (em001_04): GENERATED by C:\MHGU-Extract\efx\add_effects.py from its PSLs (em001_00, em001_04) -- every bit whose record is exported.
  em001_04: {
    'L0 Motion[2]': { frames: 347, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[63, 64]] }] },
    'L0 Motion[4]': { frames: 293, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[108, 128]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[51, 52]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[20, 21]] }] },
    'L0 Motion[5]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[111, 112]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[36, 37]] }] },
    'L0 Motion[6]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[2, 3]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[7]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[18, 19]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[59, 60]] }, { bit: 2, efl: 'cm202_000.efl', key: 30, on: [[0, 89]] }] },
    'L0 Motion[8]': { frames: 47, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[29, 30]] }] },
    'L0 Motion[11]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[30, 31]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[12, 13]] }] },
    'L0 Motion[12]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[12, 13]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[16]': { frames: 489, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[155, 201], [317, 330], [355, 376]] }] },
    'L0 Motion[17]': { frames: 169, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[18, 52]] }] },
    'L0 Motion[21]': { frames: 307, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[10, 11], [75, 76]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[38, 39]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[99, 100]] }, { bit: 3, efl: 'cm202_000.efl', key: 30, on: [[0, 61]] }] },
    'L0 Motion[22]': { frames: 13, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7]] }] },
    'L0 Motion[24]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[25]': { frames: 15, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L0 Motion[27]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[30]': { frames: 23, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L1 Motion[1]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[17, 18], [84, 85]] }] },
    'L1 Motion[2]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L1 Motion[3]': { frames: 285, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[88, 94]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[13, 14], [43, 44], [205, 206]] }] },
    'L1 Motion[5]': { frames: 75, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[42, 43]] }] },
    'L1 Motion[8]': { frames: 41, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[31, 32]] }] },
    'L1 Motion[11]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[12]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[13]': { frames: 115, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[110, 111]] }] },
    'L1 Motion[14]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[50, 51]] }] },
    'L1 Motion[15]': { frames: 81, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [45, 46]] }] },
    'L1 Motion[16]': { frames: 51, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[3, 4]] }] },
    'L1 Motion[17]': { frames: 107, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[2, 3]] }] },
    'L1 Motion[18]': { frames: 43, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[10, 11]] }] },
    'L1 Motion[19]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27]] }] },
    'L1 Motion[20]': { frames: 37, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[13, 14]] }] },
    'L1 Motion[21]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25], [89, 90]] }] },
    'L1 Motion[22]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[20, 21], [89, 90]] }] },
    'L1 Motion[23]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[30, 31], [92, 93]] }] },
    'L1 Motion[24]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[29, 30]] }] },
    'L1 Motion[25]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25]] }] },
    'L1 Motion[26]': { frames: 29, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 28]] }] },
    'L1 Motion[29]': { frames: 9, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 8]] }] },
    'L1 Motion[30]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61]] }] },
    'L1 Motion[32]': { frames: 127, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[123, 126]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[28, 29]] }] },
    'L1 Motion[33]': { frames: 161, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27], [90, 91]] }] },
    'L1 Motion[34]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[43, 44], [87, 88]] }] },
    'L1 Motion[35]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[36]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[37]': { frames: 151, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61], [106, 107]] }] },
    'L1 Motion[39]': { frames: 71, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[40, 41]] }] },
    'L1 Motion[40]': { frames: 67, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[52, 53]] }] },
    'L1 Motion[42]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16]] }] },
    'L1 Motion[43]': { frames: 53, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L2 Motion[1]': { frames: 181, bits: [{ bit: 0, efl: 'cm202_022.efl', key: 33, on: [[56, 57]] }] },
    'L2 Motion[2]': { frames: 183, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[0, 1]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[36, 37]] }, { bit: 2, efl: 'cm202_002.efl', key: 4, on: [[60, 61]] }, { bit: 3, efl: 'cm202_022.efl', key: 32, on: [[50, 51]] }] },
    'L2 Motion[4]': { frames: 121, bits: [{ bit: 21, efl: 'em001_04_001.efl', key: 511, on: [[33, 34]] }] },
    'L2 Motion[7]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[11, 12], [45, 46], [107, 108]] }, { bit: 1, efl: 'cm202_000.efl', key: 30, on: [[72, 88]] }] },
    'L2 Motion[8]': { frames: 365, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[109, 110]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[40, 41]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[6, 7], [87, 88]] }] },
    'L2 Motion[10]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 30], [31, 60], [61, 90], [91, 119], [120, 122]] }] },
    'L2 Motion[11]': { frames: 99, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[21, 22], [54, 55]] }] },
    'L2 Motion[12]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[80, 90]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[20, 21]] }] },
    'L2 Motion[13]': { frames: 147, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [36, 37], [101, 102], [130, 131]] }] },
    'L2 Motion[14]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[14, 15], [75, 76]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[52, 53]] }] },
    'L2 Motion[15]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[16]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[17]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L2 Motion[18]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L3 Motion[2]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[32, 33]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59]] }] },
    'L3 Motion[3]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[4]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[9]': { frames: 171, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[4, 5]] }] },
    'L3 Motion[11]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[2, 3]] }] },
    'L3 Motion[12]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[70, 71]] }] },
    'L3 Motion[14]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[230, 231]] }] },
    'L3 Motion[15]': { frames: 369, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[60, 61]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[16, 17]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[89, 90]] }] },
    'L3 Motion[17]': { frames: 581, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[283, 284]] }] },
    'L3 Motion[18]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 250, on: [[3, 4]] }] },
    'L3 Motion[20]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[86, 87]] }] },
    'L3 Motion[21]': { frames: 405, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16], [93, 94], [134, 135], [183, 184], [221, 222], [267, 268], [299, 300], [357, 358]] }] },
    'L3 Motion[23]': { frames: 249, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[56, 57], [98, 99], [143, 144]] }] },
    'L3 Motion[24]': { frames: 125, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[3, 4]] }] },
    'L3 Motion[26]': { frames: 401, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[21, 22], [184, 185], [233, 234], [280, 281], [373, 374]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59], [214, 215], [296, 297], [365, 366]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[159, 160], [239, 240]] }, { bit: 3, efl: 'cm202_002.efl', key: 3, on: [[265, 266]] }] },
    'L3 Motion[28]': { frames: 203, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[90, 91]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[59, 60]] }] },
    'L3 Motion[29]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[26, 27]] }] },
    'L4 Motion[1]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2], [48, 49], [72, 73]] }] },
    'L4 Motion[2]': { frames: 113, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[43, 44]] }] },
    'L4 Motion[3]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L4 Motion[4]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[56, 57]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[22, 23]] }] },
    'L4 Motion[5]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[103, 104]] }] },
    'L4 Motion[6]': { frames: 173, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[103, 104], [142, 143]] }, { bit: 15, efl: 'em001_04_002.efl', key: 530, on: [[8, 9]] }, { bit: 18, efl: 'em001_04_002.efl', key: 550, on: [[8, 9]] }, { bit: 21, efl: 'em001_04_002.efl', key: 540, on: [[8, 9]] }] },
    'L4 Motion[7]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[33, 34]] }] },
    'L4 Motion[8]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 80]] }] },
    'L4 Motion[9]': { frames: 175, bits: [{ bit: 0, efl: 'cm202_000.efl', key: 30, on: [[85, 122]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[34, 35], [145, 146], [170, 171]] }] },
    'L4 Motion[10]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[37, 38]] }] },
    'L4 Motion[11]': { frames: 119, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[8, 9], [55, 56]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[15, 16], [64, 65]] }] },
    'L4 Motion[12]': { frames: 35, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2]] }] },
    'L4 Motion[13]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[16, 17]] }] },
    'L4 Motion[15]': { frames: 117, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[7, 8]] }] },
    'L4 Motion[16]': { frames: 243, bits: [{ bit: 6, efl: 'em001_02_002.efl', key: 230, on: [[2, 93]] }, { bit: 7, efl: 'em001_02_003.efl', key: 231, on: [[103, 104]] }, { bit: 8, efl: 'em001_02_000.efl', key: 232, on: [[160, 185]] }, { bit: 9, efl: 'em001_02_002.efl', key: 230, on: [[2, 93]] }, { bit: 10, efl: 'em001_02_003.efl', key: 231, on: [[103, 104]] }, { bit: 11, efl: 'em001_02_000.efl', key: 232, on: [[160, 185]] }] },
    'L4 Motion[17]': { frames: 141, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 31, on: [[2, 3]] }] },
    'L4 Motion[18]': { frames: 447, bits: [{ bit: 0, efl: 'em001_02_002.efl', key: 230, on: [[0, 111]] }, { bit: 6, efl: 'em001_02_003.efl', key: 231, on: [[115, 116], [167, 168], [224, 225]] }, { bit: 7, efl: 'em001_02_000.efl', key: 232, on: [[232, 336]] }, { bit: 9, efl: 'em001_02_003.efl', key: 231, on: [[115, 116], [167, 168], [224, 225]] }, { bit: 10, efl: 'em001_02_000.efl', key: 232, on: [[232, 336]] }] },
    'L4 Motion[20]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2], [104, 105]] }] },
    'L4 Motion[21]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2], [104, 105]] }] },
    'L4 Motion[50]': { frames: 229, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[157, 158], [200, 201]] }, { bit: 15, efl: 'em001_04_001.efl', key: 531, on: [[6, 7]] }, { bit: 18, efl: 'em001_04_001.efl', key: 551, on: [[6, 7]] }] },
    'L4 Motion[52]': { frames: 229, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[123, 124], [200, 201]] }, { bit: 15, efl: 'em001_04_001.efl', key: 532, on: [[6, 7]] }, { bit: 18, efl: 'em001_04_001.efl', key: 552, on: [[6, 7]] }] },
    'L4 Motion[53]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[2, 80]] }] },
    'L4 Motion[54]': { frames: 377, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[2, 80]] }] },
    'L4 Motion[55]': { frames: 219, bits: [{ bit: 0, efl: 'cm202_000.efl', key: 30, on: [[47, 64]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[16, 17], [123, 124], [150, 151], [186, 187]] }] },
    'L4 Motion[65]': { frames: 225, bits: [{ bit: 0, efl: 'cm202_022.efl', key: 33, on: [[64, 65]] }, { bit: 1, efl: 'cm202_020.efl', key: 350, on: [[118, 119]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[68, 69]] }] },
    'L9 Motion[3]': { frames: 67, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[9, 10], [20, 21]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[65, 66]] }] },
    'L9 Motion[4]': { frames: 129, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[9, 10], [70, 71]] }, { bit: 1, efl: 'cm202_000.efl', key: 30, on: [[121, 128]] }] },
    'L9 Motion[6]': { frames: 217, bits: [{ bit: 15, efl: 'em001_04_001.efl', key: 504, on: [[16, 17]] }, { bit: 16, efl: 'em001_04_001.efl', key: 505, on: [[23, 24]] }, { bit: 17, efl: 'em001_04_003.efl', key: 580, on: [[20, 21]] }, { bit: 18, efl: 'em001_04_001.efl', key: 524, on: [[16, 17]] }, { bit: 19, efl: 'em001_04_001.efl', key: 525, on: [[23, 24]] }, { bit: 20, efl: 'em001_04_003.efl', key: 600, on: [[20, 21]] }, { bit: 21, efl: 'em001_04_001.efl', key: 514, on: [[16, 17]] }] },
    'L9 Motion[7]': { frames: 83, bits: [{ bit: 0, efl: 'em002_04_004.efl', key: 630, on: [[75, 82]] }] },
    'L9 Motion[9]': { frames: 245, bits: [{ bit: 0, efl: 'em002_04_004.efl', key: 630, on: [[0, 51]] }, { bit: 2, efl: 'em001_04_006.efl', key: 632, on: [[120, 203]] }] },
    'L9 Motion[20]': { frames: 103, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[75, 76]] }] },
  },
  // Rathalos (em002_00): GENERATED by C:\MHGU-Extract\efx\add_effects.py from its PSLs (em001_00, em002_00) -- every bit whose record is exported.
  em002_00: {
    'L0 Motion[2]': { frames: 347, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[63, 64]] }] },
    'L0 Motion[4]': { frames: 293, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[108, 128]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[51, 52]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[20, 21]] }] },
    'L0 Motion[5]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[111, 112]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[36, 37]] }] },
    'L0 Motion[6]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[2, 3]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[7]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[18, 19]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[59, 60]] }, { bit: 2, efl: 'cm202_000.efl', key: 30, on: [[0, 89]] }] },
    'L0 Motion[8]': { frames: 47, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[29, 30]] }] },
    'L0 Motion[11]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[30, 31]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[12, 13]] }] },
    'L0 Motion[12]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[12, 13]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[16]': { frames: 489, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[155, 201], [317, 330], [355, 376]] }] },
    'L0 Motion[17]': { frames: 169, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[18, 52]] }] },
    'L0 Motion[21]': { frames: 307, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[10, 11], [75, 76]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[38, 39]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[99, 100]] }, { bit: 3, efl: 'cm202_000.efl', key: 30, on: [[0, 61]] }] },
    'L0 Motion[22]': { frames: 13, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7]] }] },
    'L0 Motion[24]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[25]': { frames: 15, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L0 Motion[27]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[30]': { frames: 23, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L1 Motion[1]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[17, 18], [84, 85]] }] },
    'L1 Motion[2]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L1 Motion[3]': { frames: 285, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[88, 94]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[13, 14], [43, 44], [205, 206]] }] },
    'L1 Motion[5]': { frames: 75, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[42, 43]] }] },
    'L1 Motion[8]': { frames: 41, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[31, 32]] }] },
    'L1 Motion[11]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[12]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[13]': { frames: 115, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[110, 111]] }] },
    'L1 Motion[14]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[50, 51]] }] },
    'L1 Motion[15]': { frames: 81, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [45, 46]] }] },
    'L1 Motion[16]': { frames: 51, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[3, 4]] }] },
    'L1 Motion[17]': { frames: 107, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[2, 3]] }] },
    'L1 Motion[18]': { frames: 43, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[10, 11]] }] },
    'L1 Motion[19]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27]] }] },
    'L1 Motion[20]': { frames: 37, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[13, 14]] }] },
    'L1 Motion[21]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25], [89, 90]] }] },
    'L1 Motion[22]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[20, 21], [89, 90]] }] },
    'L1 Motion[23]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[30, 31], [92, 93]] }] },
    'L1 Motion[24]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[29, 30]] }] },
    'L1 Motion[25]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25]] }] },
    'L1 Motion[26]': { frames: 29, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 28]] }] },
    'L1 Motion[29]': { frames: 9, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 8]] }] },
    'L1 Motion[30]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61]] }] },
    'L1 Motion[32]': { frames: 127, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[123, 126]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[28, 29]] }] },
    'L1 Motion[33]': { frames: 161, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27], [90, 91]] }] },
    'L1 Motion[34]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[43, 44], [87, 88]] }] },
    'L1 Motion[35]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[36]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[37]': { frames: 151, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61], [106, 107]] }] },
    'L1 Motion[39]': { frames: 71, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[40, 41]] }] },
    'L1 Motion[40]': { frames: 67, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[52, 53]] }] },
    'L1 Motion[42]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16]] }] },
    'L1 Motion[43]': { frames: 53, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L2 Motion[1]': { frames: 181, bits: [{ bit: 0, efl: 'cm202_031.efl', key: 33, on: [[56, 57]] }] },
    'L2 Motion[2]': { frames: 183, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[0, 1]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[36, 37]] }, { bit: 2, efl: 'cm202_002.efl', key: 4, on: [[60, 61]] }, { bit: 3, efl: 'cm202_000.efl', key: 32, on: [[50, 51]] }] },
    'L2 Motion[4]': { frames: 121, bits: [{ bit: 21, efl: 'cm202_031.efl', key: 511, on: [[33, 34]] }] },
    'L2 Motion[7]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[11, 12], [45, 46], [107, 108]] }, { bit: 1, efl: 'cm202_000.efl', key: 30, on: [[72, 88]] }] },
    'L2 Motion[8]': { frames: 365, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[109, 110]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[40, 41]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[6, 7], [87, 88]] }] },
    'L2 Motion[10]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 30], [31, 60], [61, 90], [91, 119], [120, 122]] }] },
    'L2 Motion[11]': { frames: 99, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[21, 22], [54, 55]] }] },
    'L2 Motion[12]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[80, 90]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[20, 21]] }] },
    'L2 Motion[13]': { frames: 147, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [36, 37], [101, 102], [130, 131]] }] },
    'L2 Motion[14]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[14, 15], [75, 76]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[52, 53]] }] },
    'L2 Motion[15]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[16]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[17]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L2 Motion[18]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L3 Motion[2]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[32, 33]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59]] }] },
    'L3 Motion[3]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[4]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[9]': { frames: 171, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[4, 5]] }] },
    'L3 Motion[11]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[2, 3]] }] },
    'L3 Motion[12]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[70, 71]] }] },
    'L3 Motion[14]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[230, 231]] }] },
    'L3 Motion[15]': { frames: 369, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[60, 61]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[16, 17]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[89, 90]] }] },
    'L3 Motion[17]': { frames: 581, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[283, 284]] }] },
    'L3 Motion[18]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 250, on: [[3, 4]] }] },
    'L3 Motion[20]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[86, 87]] }] },
    'L3 Motion[21]': { frames: 405, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16], [93, 94], [134, 135], [183, 184], [221, 222], [267, 268], [299, 300], [357, 358]] }] },
    'L3 Motion[23]': { frames: 249, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[56, 57], [98, 99], [143, 144]] }] },
    'L3 Motion[24]': { frames: 125, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[3, 4]] }] },
    'L3 Motion[26]': { frames: 401, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[21, 22], [184, 185], [233, 234], [280, 281], [373, 374]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59], [214, 215], [296, 297], [365, 366]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[159, 160], [239, 240]] }, { bit: 3, efl: 'cm202_002.efl', key: 3, on: [[265, 266]] }] },
    'L3 Motion[28]': { frames: 203, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[90, 91]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[59, 60]] }] },
    'L3 Motion[29]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[26, 27]] }] },
    'L4 Motion[1]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2], [48, 49], [72, 73]] }] },
    'L4 Motion[2]': { frames: 113, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 31, on: [[43, 44]] }] },
    'L4 Motion[3]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L4 Motion[4]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[56, 57]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[22, 23]] }] },
    'L4 Motion[17]': { frames: 141, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 31, on: [[2, 3]] }] },
    'L4 Motion[22]': { frames: 135, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[52, 53]] }, { bit: 6, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 7, efl: 'em001_00_004.efl', key: 201, on: [[81, 82]] }, { bit: 8, efl: 'em001_02_000.efl', key: 202, on: [[99, 110]] }, { bit: 9, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 10, efl: 'em001_00_004.efl', key: 201, on: [[81, 82]] }, { bit: 11, efl: 'em001_02_000.efl', key: 202, on: [[99, 110]] }, { bit: 12, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 13, efl: 'em001_00_004.efl', key: 221, on: [[81, 82]] }] },
    'L4 Motion[23]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[98, 99]] }] },
    'L4 Motion[24]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[98, 99]] }] },
    'L4 Motion[25]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 92]] }] },
    'L4 Motion[26]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[68, 90]] }] },
    'L4 Motion[27]': { frames: 103, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 19]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[82, 83]] }] },
    'L4 Motion[28]': { frames: 81, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 320, on: [[17, 80]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[25, 26]] }] },
    'L4 Motion[29]': { frames: 69, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61]] }, { bit: 6, efl: 'em001_00_009.efl', key: 350, on: [[1, 30]] }, { bit: 7, efl: 'em001_00_004.efl', key: 201, on: [[41, 42]] }, { bit: 9, efl: 'em001_00_009.efl', key: 350, on: [[1, 30]] }, { bit: 10, efl: 'em001_00_004.efl', key: 201, on: [[41, 42]] }, { bit: 12, efl: 'em001_00_009.efl', key: 350, on: [[1, 30]] }, { bit: 13, efl: 'em001_00_004.efl', key: 221, on: [[41, 42]] }] },
    'L4 Motion[31]': { frames: 35, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[31, 32]] }] },
    'L4 Motion[32]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[18, 19]] }] },
    'L4 Motion[33]': { frames: 13, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[7, 8]] }] },
    'L4 Motion[34]': { frames: 117, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[50, 51]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[65, 66]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[0, 1]] }] },
    'L4 Motion[35]': { frames: 119, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[8, 9], [28, 29], [48, 49]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[18, 19], [38, 39]] }] },
    'L4 Motion[36]': { frames: 201, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[61, 62], [175, 176]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[87, 88]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[97, 98]] }] },
    'L4 Motion[40]': { frames: 159, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[2, 3]] }] },
    'L4 Motion[41]': { frames: 175, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[27, 28]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[96, 97], [101, 102], [134, 135], [143, 144]] }] },
    'L4 Motion[42]': { frames: 201, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 320, on: [[0, 71]] }, { bit: 1, efl: 'em001_02_000.efl', key: 322, on: [[104, 156]] }] },
    'L4 Motion[43]': { frames: 201, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 320, on: [[0, 71]] }, { bit: 1, efl: 'em001_02_000.efl', key: 322, on: [[104, 156]] }, { bit: 2, efl: 'em002_00_002.efl', key: 321, on: [[70, 71]] }] },
    'L4 Motion[44]': { frames: 201, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 320, on: [[0, 71]] }, { bit: 1, efl: 'em001_02_000.efl', key: 322, on: [[104, 156]] }, { bit: 2, efl: 'em002_00_002.efl', key: 321, on: [[70, 71]] }, { bit: 3, efl: 'em002_00_004.efl', key: 380, on: [[71, 109]] }] },
    'L4 Motion[45]': { frames: 113, bits: [{ bit: 0, efl: 'em001_00_004.efl', key: 201, on: [[45, 46]] }] },
    'L4 Motion[46]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[3, 4], [24, 25]] }] },
    'L4 Motion[48]': { frames: 135, bits: [{ bit: 6, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 7, efl: 'em001_00_004.efl', key: 201, on: [[81, 82]] }, { bit: 8, efl: 'em001_02_000.efl', key: 202, on: [[99, 110]] }, { bit: 9, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 10, efl: 'em001_00_004.efl', key: 201, on: [[81, 82]] }, { bit: 11, efl: 'em001_02_000.efl', key: 202, on: [[99, 110]] }, { bit: 13, efl: 'em001_00_004.efl', key: 221, on: [[81, 82]] }] },
    'L4 Motion[56]': { frames: 201, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[16, 17], [159, 160]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[95, 96]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[98, 99]] }] },
    'L4 Motion[68]': { frames: 73, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[12, 13], [40, 41]] }] },
  },
  // Dreadking Rathalos (em002_04): GENERATED by C:\MHGU-Extract\efx\add_effects.py from its PSLs (em001_00, em002_04) -- every bit whose record is exported.
  em002_04: {
    'L0 Motion[2]': { frames: 347, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[63, 64]] }] },
    'L0 Motion[4]': { frames: 293, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[108, 128]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[51, 52]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[20, 21]] }] },
    'L0 Motion[5]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[111, 112]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[36, 37]] }] },
    'L0 Motion[6]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[2, 3]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[7]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[18, 19]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[59, 60]] }, { bit: 2, efl: 'cm202_000.efl', key: 30, on: [[0, 89]] }] },
    'L0 Motion[8]': { frames: 47, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[29, 30]] }] },
    'L0 Motion[11]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[30, 31]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[12, 13]] }] },
    'L0 Motion[12]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[12, 13]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L0 Motion[16]': { frames: 489, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[155, 201], [317, 330], [355, 376]] }] },
    'L0 Motion[17]': { frames: 169, bits: [{ bit: 0, efl: 'cm202_070.efl', key: 70, on: [[18, 52]] }] },
    'L0 Motion[21]': { frames: 307, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[10, 11], [75, 76]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[38, 39]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[99, 100]] }, { bit: 3, efl: 'cm202_000.efl', key: 30, on: [[0, 61]] }] },
    'L0 Motion[22]': { frames: 13, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7]] }] },
    'L0 Motion[24]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[25]': { frames: 15, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L0 Motion[27]': { frames: 27, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L0 Motion[30]': { frames: 23, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[5, 6]] }] },
    'L1 Motion[1]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[17, 18], [84, 85]] }] },
    'L1 Motion[2]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[8, 9]] }] },
    'L1 Motion[3]': { frames: 285, bits: [{ bit: 0, efl: 'cm202_050.efl', key: 90, on: [[88, 94]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[13, 14], [43, 44], [205, 206]] }] },
    'L1 Motion[5]': { frames: 75, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[42, 43]] }] },
    'L1 Motion[8]': { frames: 41, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[31, 32]] }] },
    'L1 Motion[11]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[12]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L1 Motion[13]': { frames: 115, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[110, 111]] }] },
    'L1 Motion[14]': { frames: 55, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[50, 51]] }] },
    'L1 Motion[15]': { frames: 81, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [45, 46]] }] },
    'L1 Motion[16]': { frames: 51, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[3, 4]] }] },
    'L1 Motion[17]': { frames: 107, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 7, on: [[2, 3]] }] },
    'L1 Motion[18]': { frames: 43, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[10, 11]] }] },
    'L1 Motion[19]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27]] }] },
    'L1 Motion[20]': { frames: 37, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[13, 14]] }] },
    'L1 Motion[21]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25], [89, 90]] }] },
    'L1 Motion[22]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[20, 21], [89, 90]] }] },
    'L1 Motion[23]': { frames: 133, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[30, 31], [92, 93]] }] },
    'L1 Motion[24]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[29, 30]] }] },
    'L1 Motion[25]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[24, 25]] }] },
    'L1 Motion[26]': { frames: 29, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 28]] }] },
    'L1 Motion[29]': { frames: 9, bits: [{ bit: 1, efl: 'cm202_005.efl', key: 260, on: [[0, 8]] }] },
    'L1 Motion[30]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61]] }] },
    'L1 Motion[32]': { frames: 127, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[123, 126]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[28, 29]] }] },
    'L1 Motion[33]': { frames: 161, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[26, 27], [90, 91]] }] },
    'L1 Motion[34]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[43, 44], [87, 88]] }] },
    'L1 Motion[35]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[36]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[94, 95]] }] },
    'L1 Motion[37]': { frames: 151, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61], [106, 107]] }] },
    'L1 Motion[39]': { frames: 71, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[40, 41]] }] },
    'L1 Motion[40]': { frames: 67, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[52, 53]] }] },
    'L1 Motion[42]': { frames: 49, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16]] }] },
    'L1 Motion[43]': { frames: 53, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24]] }] },
    'L2 Motion[1]': { frames: 181, bits: [{ bit: 0, efl: 'cm202_031.efl', key: 33, on: [[56, 57]] }] },
    'L2 Motion[2]': { frames: 183, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[0, 1]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[36, 37]] }, { bit: 2, efl: 'cm202_002.efl', key: 4, on: [[60, 61]] }, { bit: 3, efl: 'cm202_000.efl', key: 32, on: [[50, 51]] }] },
    'L2 Motion[4]': { frames: 121, bits: [{ bit: 21, efl: 'cm202_031.efl', key: 511, on: [[33, 34]] }] },
    'L2 Motion[7]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[11, 12], [45, 46], [107, 108]] }, { bit: 1, efl: 'cm202_000.efl', key: 30, on: [[72, 88]] }] },
    'L2 Motion[8]': { frames: 365, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[109, 110]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[40, 41]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[6, 7], [87, 88]] }] },
    'L2 Motion[10]': { frames: 123, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 30], [31, 60], [61, 90], [91, 119], [120, 122]] }] },
    'L2 Motion[11]': { frames: 99, bits: [{ bit: 1, efl: 'cm202_021.efl', key: 6, on: [[21, 22], [54, 55]] }] },
    'L2 Motion[12]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[80, 90]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[20, 21]] }] },
    'L2 Motion[13]': { frames: 147, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[6, 7], [36, 37], [101, 102], [130, 131]] }] },
    'L2 Motion[14]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[14, 15], [75, 76]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[52, 53]] }] },
    'L2 Motion[15]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[16]': { frames: 295, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 72]] }] },
    'L2 Motion[17]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L2 Motion[18]': { frames: 309, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 200, on: [[0, 79]] }] },
    'L3 Motion[2]': { frames: 211, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[32, 33]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59]] }] },
    'L3 Motion[3]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[4]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[36, 37]] }] },
    'L3 Motion[9]': { frames: 171, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[4, 5]] }] },
    'L3 Motion[11]': { frames: 99, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[2, 3]] }] },
    'L3 Motion[12]': { frames: 145, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[70, 71]] }] },
    'L3 Motion[14]': { frames: 301, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[230, 231]] }] },
    'L3 Motion[15]': { frames: 369, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[60, 61]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[16, 17]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[89, 90]] }] },
    'L3 Motion[17]': { frames: 581, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[283, 284]] }] },
    'L3 Motion[18]': { frames: 77, bits: [{ bit: 0, efl: 'cm202_006.efl', key: 250, on: [[3, 4]] }] },
    'L3 Motion[20]': { frames: 153, bits: [{ bit: 0, efl: 'cm202_080.efl', key: 3000, on: [[86, 87]] }] },
    'L3 Motion[21]': { frames: 405, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[15, 16], [93, 94], [134, 135], [183, 184], [221, 222], [267, 268], [299, 300], [357, 358]] }] },
    'L3 Motion[23]': { frames: 249, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[56, 57], [98, 99], [143, 144]] }] },
    'L3 Motion[24]': { frames: 125, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[3, 4]] }] },
    'L3 Motion[26]': { frames: 401, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[21, 22], [184, 185], [233, 234], [280, 281], [373, 374]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[58, 59], [214, 215], [296, 297], [365, 366]] }, { bit: 2, efl: 'cm202_002.efl', key: 2, on: [[159, 160], [239, 240]] }, { bit: 3, efl: 'cm202_002.efl', key: 3, on: [[265, 266]] }] },
    'L3 Motion[28]': { frames: 203, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[90, 91]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[59, 60]] }] },
    'L3 Motion[29]': { frames: 39, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[26, 27]] }] },
    'L4 Motion[1]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[1, 2], [48, 49], [72, 73]] }] },
    'L4 Motion[2]': { frames: 113, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 31, on: [[43, 44]] }] },
    'L4 Motion[3]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 1, on: [[30, 31]] }] },
    'L4 Motion[4]': { frames: 131, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[56, 57]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[22, 23]] }] },
    'L4 Motion[7]': { frames: 139, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 31, on: [[33, 34]] }] },
    'L4 Motion[17]': { frames: 141, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 31, on: [[2, 3]] }] },
    'L4 Motion[18]': { frames: 447, bits: [{ bit: 0, efl: 'em002_04_004.efl', key: 600, on: [[0, 115], [132, 156], [185, 209]] }, { bit: 1, efl: 'em002_04_005.efl', key: 602, on: [[117, 118], [168, 169], [225, 226]] }, { bit: 2, efl: 'em002_04_006.efl', key: 603, on: [[228, 335]] }] },
    'L4 Motion[22]': { frames: 135, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[52, 53]] }, { bit: 6, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 7, efl: 'em001_00_004.efl', key: 201, on: [[81, 82]] }, { bit: 8, efl: 'em001_02_000.efl', key: 202, on: [[99, 110]] }, { bit: 9, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 10, efl: 'em001_00_004.efl', key: 201, on: [[81, 82]] }, { bit: 11, efl: 'em001_02_000.efl', key: 202, on: [[99, 110]] }, { bit: 12, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 13, efl: 'em001_00_004.efl', key: 221, on: [[81, 82]] }] },
    'L4 Motion[23]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[98, 99]] }] },
    'L4 Motion[24]': { frames: 121, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[98, 99]] }] },
    'L4 Motion[25]': { frames: 93, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 92]] }] },
    'L4 Motion[26]': { frames: 91, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[68, 90]] }] },
    'L4 Motion[27]': { frames: 103, bits: [{ bit: 0, efl: 'cm202_005.efl', key: 260, on: [[0, 19]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[82, 83]] }] },
    'L4 Motion[28]': { frames: 81, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 320, on: [[17, 80]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[25, 26]] }] },
    'L4 Motion[29]': { frames: 69, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[60, 61]] }, { bit: 6, efl: 'em001_00_009.efl', key: 350, on: [[1, 30]] }, { bit: 7, efl: 'em001_00_004.efl', key: 201, on: [[41, 42]] }, { bit: 9, efl: 'em001_00_009.efl', key: 350, on: [[1, 30]] }, { bit: 10, efl: 'em001_00_004.efl', key: 201, on: [[41, 42]] }, { bit: 12, efl: 'em001_00_009.efl', key: 350, on: [[1, 30]] }, { bit: 13, efl: 'em001_00_004.efl', key: 221, on: [[41, 42]] }] },
    'L4 Motion[31]': { frames: 35, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[31, 32]] }] },
    'L4 Motion[32]': { frames: 31, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[18, 19]] }] },
    'L4 Motion[33]': { frames: 13, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[7, 8]] }] },
    'L4 Motion[34]': { frames: 117, bits: [{ bit: 0, efl: 'cm202_001.efl', key: 0, on: [[50, 51]] }, { bit: 1, efl: 'cm202_001.efl', key: 1, on: [[65, 66]] }, { bit: 2, efl: 'cm202_020.efl', key: 5, on: [[0, 1]] }] },
    'L4 Motion[35]': { frames: 119, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 2, on: [[8, 9], [28, 29], [48, 49]] }, { bit: 1, efl: 'cm202_002.efl', key: 3, on: [[18, 19], [38, 39]] }] },
    'L4 Motion[36]': { frames: 201, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[61, 62], [175, 176]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[87, 88]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[97, 98]] }] },
    'L4 Motion[38]': { frames: 195, bits: [{ bit: 6, efl: 'em001_02_002.efl', key: 230, on: [[0, 74]] }, { bit: 7, efl: 'em001_02_003.efl', key: 231, on: [[83, 84]] }, { bit: 8, efl: 'em001_02_000.efl', key: 232, on: [[110, 174]] }, { bit: 9, efl: 'em001_02_002.efl', key: 230, on: [[0, 74]] }, { bit: 10, efl: 'em001_02_003.efl', key: 231, on: [[83, 84]] }, { bit: 11, efl: 'em001_02_000.efl', key: 232, on: [[110, 174]] }, { bit: 12, efl: 'em001_00_004.efl', key: 221, on: [[83, 84]] }, { bit: 30, efl: 'em002_04_004.efl', key: 600, on: [[0, 82]] }, { bit: 31, efl: 'em002_04_005.efl', key: 602, on: [[83, 84]] }] },
    'L4 Motion[39]': { frames: 163, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[65, 66], [142, 143]] }] },
    'L4 Motion[40]': { frames: 159, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[2, 3]] }] },
    'L4 Motion[41]': { frames: 175, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[27, 28]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[96, 97], [101, 102], [134, 135], [143, 144]] }] },
    'L4 Motion[42]': { frames: 201, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 320, on: [[0, 71]] }, { bit: 1, efl: 'em001_02_000.efl', key: 322, on: [[104, 156]] }] },
    'L4 Motion[43]': { frames: 201, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 320, on: [[0, 71]] }, { bit: 1, efl: 'em001_02_000.efl', key: 322, on: [[104, 156]] }, { bit: 2, efl: 'em001_00_004.efl', key: 321, on: [[70, 71]] }] },
    'L4 Motion[44]': { frames: 201, bits: [{ bit: 0, efl: 'em001_00_009.efl', key: 320, on: [[0, 71]] }, { bit: 1, efl: 'em001_02_000.efl', key: 322, on: [[104, 156]] }, { bit: 2, efl: 'em001_00_004.efl', key: 321, on: [[70, 71]] }, { bit: 3, efl: 'em002_00_004.efl', key: 380, on: [[71, 109]] }] },
    'L4 Motion[45]': { frames: 113, bits: [{ bit: 0, efl: 'em001_00_004.efl', key: 201, on: [[45, 46]] }] },
    'L4 Motion[46]': { frames: 101, bits: [{ bit: 0, efl: 'cm202_002.efl', key: 4, on: [[3, 4], [24, 25]] }] },
    'L4 Motion[47]': { frames: 109, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[23, 24], [76, 77]] }] },
    'L4 Motion[48]': { frames: 135, bits: [{ bit: 6, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 7, efl: 'em001_00_004.efl', key: 201, on: [[81, 82]] }, { bit: 8, efl: 'em001_02_000.efl', key: 202, on: [[99, 110]] }, { bit: 9, efl: 'em001_00_009.efl', key: 200, on: [[39, 70]] }, { bit: 10, efl: 'em001_00_004.efl', key: 201, on: [[81, 82]] }, { bit: 11, efl: 'em001_02_000.efl', key: 202, on: [[99, 110]] }, { bit: 13, efl: 'em001_00_004.efl', key: 221, on: [[81, 82]] }] },
    'L4 Motion[56]': { frames: 201, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[16, 17], [159, 160]] }, { bit: 1, efl: 'cm202_001.efl', key: 0, on: [[95, 96]] }, { bit: 2, efl: 'cm202_001.efl', key: 1, on: [[98, 99]] }] },
    'L4 Motion[68]': { frames: 73, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 6, on: [[12, 13], [40, 41]] }] },
    'L4 Motion[69]': { frames: 73, bits: [{ bit: 0, efl: 'em001_02_002.efl', key: 230, on: [[0, 70]] }] },
    'L9 Motion[1]': { frames: 127, bits: [{ bit: 0, efl: 'em002_04_004.efl', key: 600, on: [[10, 124]] }, { bit: 1, efl: 'em002_04_005.efl', key: 602, on: [[123, 124]] }] },
    'L9 Motion[2]': { frames: 35, bits: [{ bit: 0, efl: 'em002_04_006.efl', key: 603, on: [[0, 34]] }, { bit: 1, efl: 'cm202_021.efl', key: 6, on: [[25, 26]] }] },
    'L9 Motion[3]': { frames: 69, bits: [{ bit: 0, efl: 'em002_04_008.efl', key: 300, on: [[17, 68]] }] },
    'L9 Motion[4]': { frames: 79, bits: [{ bit: 0, efl: 'em002_04_008.efl', key: 300, on: [[0, 20], [43, 78]] }] },
    'L9 Motion[5]': { frames: 79, bits: [{ bit: 0, efl: 'em002_04_008.efl', key: 300, on: [[0, 20], [43, 78]] }] },
    'L9 Motion[6]': { frames: 89, bits: [{ bit: 0, efl: 'em002_04_006.efl', key: 301, on: [[0, 55]] }] },
    'L9 Motion[7]': { frames: 89, bits: [{ bit: 0, efl: 'em002_04_006.efl', key: 301, on: [[0, 55]] }] },
    'L9 Motion[8]': { frames: 69, bits: [{ bit: 0, efl: 'em002_04_008.efl', key: 300, on: [[23, 68]] }] },
    'L9 Motion[9]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[13, 14]] }] },
    'L9 Motion[10]': { frames: 105, bits: [{ bit: 0, efl: 'cm202_020.efl', key: 5, on: [[13, 14]] }] },
    'L9 Motion[12]': { frames: 49, bits: [{ bit: 0, efl: 'em002_04_008.efl', key: 300, on: [[17, 48]] }] },
    'L9 Motion[14]': { frames: 49, bits: [{ bit: 0, efl: 'em002_04_008.efl', key: 300, on: [[17, 48]] }] },
    'L9 Motion[20]': { frames: 103, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 31, on: [[74, 75]] }] },
    'L9 Motion[21]': { frames: 103, bits: [{ bit: 0, efl: 'cm202_021.efl', key: 31, on: [[74, 75]] }] },
  },
};
// `list` is optional: a monster whose keys are list-qualified ('L2 Motion[25]') matches on it, because the
// game fires an effect from a slot of ONE motion list and slot numbers repeat across lists. Keys without a
// list match by clip name alone. A clip with no schedule is null.
export function clipEffectsFor(monId, clipName, list){
  const t = (monId && CLIP_EFFECTS[monId]) || {};
  return (list != null && t['L' + list + ' ' + clipName]) || t[clipName] || null;
}
export function clipEffectMonsters(){ return Object.keys(CLIP_EFFECTS); }
// A full animation is built as ONE AnimationClip so the transport, the scrubber and the loop treat it like any
// other clip. Every piece is resampled at the motions' own 60 frames a second
// onto the joined timeline: `play` runs the piece from `start`, `wrap` loops it from `start`, `hold` stays on
// `start`. A track a piece does not carry takes the model's bind value for that stretch -- what the driver shows
// when it plays that piece alone (PoseDriver.play resets every node to bind first). Cuts between pieces are hard:
// the ROM blends some transitions over a few frames, which is not modelled.
const SEQ_FPS = 60;
export async function composeClip(name, pieces, modelUrl){
  const model = await loadGlb(modelUrl, modelUrl);
  const kinds = new Map();
  for (const p of pieces) for (const t of p.clip.tracks)
    if (!kinds.has(t.name)) kinds.set(t.name, { Track: t.constructor, size: t.getValueSize() });
  const total = pieces.reduce((n, p) => n + p.frames, 0);
  const times = new Float32Array(total + 1);
  for (let i = 0; i <= total; i++) times[i] = i / SEQ_FPS;
  const tracks = [];
  for (const [tname, k] of kinds){
    const dot = tname.lastIndexOf('.');
    const node = model.scene.getObjectByName(tname.slice(0, dot)), prop = tname.slice(dot + 1);
    const bind = !node ? null : prop === 'quaternion' ? node.quaternion.toArray()
               : prop === 'scale' ? node.scale.toArray() : prop === 'position' ? node.position.toArray() : null;
    const values = new Float32Array((total + 1) * k.size);
    let f = 0, ok = true;
    pieces.forEach((p, pi) => {
      const tr = p.clip.tracks.find(x => x.name === tname);
      const interp = tr ? tr.createInterpolant(new Float32Array(k.size)) : null;
      if (!interp && (!bind || bind.length !== k.size)) ok = false;
      const dur = p.clip.duration;
      const n = p.frames + (pi === pieces.length - 1 ? 1 : 0);    // the joined clip's own last key
      for (let j = 0; j < n; j++, f++){
        if (!ok) continue;
        const local = p.mode === 'hold' ? p.start
                    : p.mode === 'wrap' ? (dur > 0 ? (p.start + j / SEQ_FPS) % dur : 0)
                    : Math.min(p.start + j / SEQ_FPS, dur);
        values.set(interp ? interp.evaluate(local) : bind, f * k.size);
      }
    });
    if (ok) tracks.push(new k.Track(tname, times, values));
  }
  return new THREE.AnimationClip(name, total / SEQ_FPS, tracks);
}
// A full animation's own clip on its own model: its pieces ({ list, clip }, the list objects resolved by the
// caller) played through, each from frame 0.
export async function sequenceClipFor(entry, modelUrl){
  const key = 'seq:' + modelUrl + ':' + entry.pieces.map(p => p.list.file + '#' + p.clip).join('|');
  const cached = poseCache.get(key);
  if (cached) return cached;
  const pieces = [];
  for (const p of entry.pieces){
    const clip = await clipFor(p.list, p.clip, modelUrl);
    if (!clip) return null;
    pieces.push({ clip, frames: seqFrames(clip), mode: 'play', start: 0 });
  }
  const out = await composeClip(entry.clip, pieces, modelUrl);
  poseCache.set(key, out);
  return out;
}
// how many 60 fps frames a piece takes on the joined timeline
export function seqFrames(clip){ return Math.max(1, Math.round(clip.duration * SEQ_FPS)); }

// A second body's clip, retargeted onto its OWN skeleton by global bone id. Unlike clipFor this
// cannot use a harvest `remap` (monsters.json ships none for these lists), so the ids are read from
// the glTF JSON the loader keeps -- the only place the "<local>:<gid>" names still have their colon.
// A sanitised name two pose nodes share is ambiguous and dropped rather than guessed.
export async function attachedClipFor(file, clipName, modelUrl){
  let anim = poseCache.get('anim:' + file);
  if (!anim){
    try { anim = await loader.loadAsync(bust(file)); } catch (err){ return null; }
    poseCache.set('anim:' + file, anim);
  }
  const src = THREE.AnimationClip.findByName(anim.animations, clipName);
  if (!src) return null;
  const key = 'attached:' + modelUrl + ':' + file + ':' + clipName;
  const cached = poseCache.get(key);
  if (cached) return cached;
  const model = await loadGlb(modelUrl, modelUrl);
  const san = THREE.PropertyBinding.sanitizeNodeName;
  const gidOf = name => { const m = /^\d+:(\d+)(_s)?$/.exec(name || ''); return m ? m[1] + (m[2] || '') : null; };
  const fromPose = new Map(), ambiguous = new Set();
  for (const n of (anim.parser && anim.parser.json.nodes) || []){
    const g = gidOf(n.name), s = san(n.name || '');
    if (g === null) continue;
    if (fromPose.has(s) && fromPose.get(s) !== g) ambiguous.add(s);
    fromPose.set(s, g);
  }
  const toModel = new Map();
  for (const n of (model.parser && model.parser.json.nodes) || []){
    const g = gidOf(n.name);
    if (g !== null && !toModel.has(g)) toModel.set(g, san(n.name));
  }
  const out = src.clone(), keep = [];
  let moved = 0, lost = 0;
  for (const t of out.tracks){
    const dot = t.name.lastIndexOf('.');
    const node = t.name.slice(0, dot), prop = t.name.slice(dot);
    const g = ambiguous.has(node) ? undefined : fromPose.get(node);
    const want = (g === undefined) ? undefined : toModel.get(g);
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
// true when a material writes its own PRIMARY UV transform onto its map: a clip track on fUVTransform (the
// evaluator's case in material.js), or a static cbm.uv that applyRomUv applies -- the same identity test
// applyRomUv makes. fUVTransform2 / 3 go to the extend uniform instead and do not count.
function movesOwnUv(rom){
  if (!rom) return false;
  for (const c of rom.anim || []) for (const t of c.tracks || []) if (t.target === 'fUVTransform') return true;
  const uv = rom.cbm && rom.cbm.uv;
  if (!uv) return false;
  const f = Array.isArray(uv[0]) ? [].concat.apply([], uv) : uv;
  return f.length >= 8 && !(f[0] === 1 && f[1] === 0 && f[3] === 0 && f[4] === 0 && f[5] === 1 && f[7] === 0);
}
let ownUvOn = true;
// Switching back ON also puts every cached texture back at the identity transform. With the copies in
// place nothing writes to a cached object, so identity is the state they are in anyway. With them off,
// a driver writes its UVs into the cached object itself, and that value would otherwise be inherited by
// every later mount that binds the file.
export function setOwnUv(on){
  if (on && !ownUvOn)
    for (const t of texCache.values()){ t.offset.set(0, 0); t.repeat.set(1, 1); t.rotation = 0; }
  ownUvOn = !!on;
  return ownUvOn;
}
if (typeof window !== 'undefined'){
  // readback: { on, copies, leaks, stale } over the mounted models. `leaks` counts textures a UV-driving
  // material has moved while a material that does not drive UVs draws them too. `stale` counts textures
  // drawn only by materials that do not drive UVs yet carrying a transform. 0 and 0 are right. Both need
  // the material animation to have run (a visible pane). __uvOwn(false) goes back to the shared object
  // from the NEXT mount: switch to another monster and back, since a first mount after a reload looks
  // right anyway.
  window.__uvOwn = (on) => {
    if (on !== undefined) setOwnUv(on);
    const out = { on: ownUvOn, copies: 0, leaks: 0, stale: 0 };
    const mounted = (window.__view && window.__view.mounted) || {};
    for (const root of Object.values(mounted)){
      if (!root || !root.userData) continue;
      out.copies += (root.userData.ownUvMaps || []).length;
      const users = new Map();
      root.traverse(o => {
        if (!(o.isMesh || o.isSkinnedMesh) || !o.material || !o.material.map) return;
        const a = users.get(o.material.map) || []; a.push(o.material); users.set(o.material.map, a);
      });
      const armMaps = new Set(root.userData.armSlimeMaps || []);   // stepArmSlime moves its own copies on purpose
      for (const [t, ms] of users){
        if (armMaps.has(t)) continue;
        const moved = t.offset.x !== 0 || t.offset.y !== 0 || t.repeat.x !== 1 || t.repeat.y !== 1 || t.rotation !== 0;
        const drives = ms.map(m => movesOwnUv(m.userData && m.userData.rom));
        if (moved && drives.includes(true) && drives.includes(false)) out.leaks++;
        if (moved && !drives.includes(true)) out.stale++;
      }
    }
    return out;
  };
}
export async function loadMonster(rec, opt, ctx){
  const gltf = await loadGlb(rec.glb, rec.glb);
  const root = skeletonClone(gltf.scene);
  // WHICH PRIMITIVES ARE THE PROXY LAYER, by ordinal in the file's own order (harvest
  // computes it against the MOD's draw mask). It used to be a set of "part#vertexCount"
  // signatures, which silently hid REAL geometry wherever a drawn mesh happened to share a
  // part and vertex count with a proxy one -- em020_04 lost meshes that way.
  const hideIdx = new Set(rec.hideIdx || []);
  const hideSig = rec.hideIdx ? null : new Set((rec.hide || []).map(h => h[0] + '#' + h[1]));
  // each primitive's mesh-table row and order byte, by the same ordinal (see DRAW_ORDER_DEFAULT_REFS)
  const orderRows = ((await drawOrderTable())[rec.glb] || {}).rows || null;
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
  // NAMED, so the runtime material swap below can build its material through THIS code and not a
  // reduced copy of it. A swap-in has to be indistinguishable from a mounted material -- same
  // technique dispatch, same two-map injection, same texture jobs -- and the only way to be sure
  // of that is to run the same function.
  const buildMesh = (o) => {
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
    o.userData.romRow = orderRows ? (orderRows[prim] || null) : null;
    o.userData.romRef = ref;
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
    // NO LONGER HIDDEN, 2026-09-07. The classification stayed only because material.js implemented
    // one of the two maps, so these drew at half their intended albedo and hiding them was "a lesser
    // wrong". The ROM's second map is implemented below, so the reason is gone and the ROM draws
    // these materials: nothing here may hide them. The flag is kept for the Debug count alone.
    if (rom && rom.feat && /^TypeExtend/.test(String(rom.feat.albedo)))
      o.userData.extendAlbedo = true;
    // the ROM's own material class: Std is lit, MaterialConstant / MaterialConstantFog are
    // the map as a flat colour (a monster's eye). material.js's unlit path is opt-in and
    // honours the cull mode and blend state either way.
    // THE ROM CORE, when it is switched on (index.html / __view.romCore). One program branched by
    // the ROM's feature word, so `cls` reaches the material instead of being discarded by a chain
    // that tests blend first. Off by default: the switch changes every pixel and Raven reviews
    // renders, so it lands as an A/B against dev/shots/pre-rewrite rather than silently.
    const mat = romCoreEnabled()
      ? createRomMaterial({ srcName, rom, wire: !!(ctx && ctx.wire), ref })
      : createMaterial({ srcName, rom, alphaCut: 0, noTint: true,
                                 unlit: !!(rom && rom.cls && rom.cls !== 'Std'),
                                 wire: !!(ctx && ctx.wire) });
    const romCore = mat.userData.romCore === true;
    o.material = mat; allMats.push(mat); monsterMats.push(mat); mats.push(mat);
    if (mat.userData.renderOrder) o.renderOrder = mat.userData.renderOrder;
    if (o.userData.romRow){ orderedMeshes.add(o); applyDrawOrder(o); }
    // A MATERIAL THAT MOVES ITS OWN UVs GETS ITS OWN TEXTURE OBJECT. The ROM's fUVTransform is a per-
    // material constant (CBMaterial), but material.js writes it onto the three.js texture -- the evaluator's
    // fUVTransform case sets map.offset / repeat, and applyRomUv does the same with a static cbm.uv. And
    // getTexture hands every material that binds a file ONE cached object. So a material's UV write
    // moves every other material drawing that texture.
    //
    // Raven, 2026-09-16, with two screenshots: "Thunderlord Zinogre at times loads in visually broken",
    // "Refreshing fixes the issues". Its XfB__m02_light samples the same atlas as the body, hair, eyes
    // and body1 (tex 2), and its auto-play normal_Loop holds fUVTransform at U +0.33333. The first mount
    // after a reload happened to work because getTexture has no in-flight dedupe: every material starts
    // its own load of the file and gets its own object (46 objects measured). Any later mount found the
    // file cached, 44 materials shared one object, and one animation step put the whole monster at
    // U +0.333.
    // Measured library-wide: 18 UV-driving materials on 11 monsters share their albedo file with
    // another material: Thunderlord, Grimclaw, Akantor, Amatsu, both Glavenus, Nakarkos, Old Fatalis,
    // Lavasioth, Felyne and Melynx.
    //
    // clone() shares the texture's Source, and three.js 0.169 keys its GL texture on the source and the
    // sampling state, not on offset / repeat -- so a copy costs no second image or upload.
    // releaseMonster disposes the copies, as it does stepArmSlime's; the cached original is untouched.
    const ownUv = ownUvOn && movesOwnUv(rom);
    const own = t => {
      if (!ownUv || !t) return t;
      const c = t.clone();
      (root.userData.ownUvMaps || (root.userData.ownUvMaps = [])).push(c);
      return c;
    };
    const albedo = (rom && rom.albedo) || fallback(/_bm$/i);
    if (albedo) jobs.push(getTexture(albedo).then(t0 => {
      const t = own(t0);
      mat.map = applyRomUv(mat, t); if (mat.userData.emissiveFromMap) mat.emissiveMap = t;
      // the ROM's own albedo, kept so a kind-3 texture switch can be undone. material.js holds the
      // same thing in its private `animBase` WeakMap, but that is not exported and material.js is a
      // shared module this app does not edit -- so the undo reads monster-owned state instead.
      mat.userData.romMap = mat.map;
      mat.needsUpdate = true; }));
    // FBump gates the normal map. 164 of the 469 monster materials that carry the feature have it
    // FALSE, and binding a tNormalMap on those is the viewer inventing a shading term the ROM does
    // not run -- the map is bound in the MRL but the feature word says the shader never samples it.
    // Where the ROM has no feature word at all (rom.feat null, the exporter's placeholders) the
    // old name-based fallback still applies, because there is nothing better to go on.
    const romBump = !rom || !rom.feat || rom.feat.bump !== false;
    const normal = romBump ? ((rom && rom.normal) || fallback(/_nm/i)) : null;
    if (normal && mat.isMeshStandardMaterial) jobs.push(getTexture(normal, { linear: true }).then(t => {
      mat.normalMap = t;
      mat.normalScale.set(normalOpt.scale, normalOpt.flipY ? -normalOpt.scale : normalOpt.scale);
      mat.needsUpdate = true; }));
    // Every monster material selects FSpecularMap -- none selects FSpecularDisable -- so the map is
    // bound wherever the ROM binds one. setSpecTexture returns early on a material with no uniform
    // block, which is the additive/revsub overlays (47 of the 469); those are unlit in the ROM too,
    // so the mask has nothing to mask there and the early return is correct rather than a drop.
    if (rom && rom.spec && !rom.specIsAlbedo) jobs.push(getTexture(rom.spec).then(t => {
      if (hasShaderUniforms(mat)) setSpecTexture(mat, t);
    }));
    // ---- Refract: SCREEN-SPACE DISTORTION ---------------------------------------------------
    // The shader package names the feature FDistortionRefract, whose local is `rvec` -- a
    // refraction vector -- with CBDistortion supplying fDistortionFactor and fDistortionBlend and
    // CBDistortionRefract supplying fDistortionRefract. So the material samples the SCENE, offset
    // by a refraction vector scaled by the factor, and mixes the result in by the blend.
    //
    // 10 monster materials carry it: Chameleos and Nightcloak Malfestio's stealth (5), Hellblade
    // Glavenus' tail, and Astalos' wings. They are NOT invisible today -- nine of the ten are
    // blend=opaque with albedo+normal+spec and draw as ordinary lit materials -- what is missing is
    // the distortion on top. fDistortionFactor and fDistortionBlend are animated by 12 tracks that
    // had no destination until this existed.
    // NOT on the ROM core: it has no Refract branch yet (see rom/shader.js), and this injection is
    // string surgery against material.js's chunks, which the ROM program does not contain.
    // the ROM core injects Refract in rom/shader.js; it still needs the scene capture, so it joins
    // the same registry.
    //
    // FLAGGED, and not changed here. The ROM does NOT do what either path does. FDistortionRefract's
    // own body samples `tDistortionMap` through MATERIAL_CONTEXT's `uv_screen` slot with
    // CBDistortionRefract and CBScreen bound (build/notes/_mfx-feature-iface.json); both viewer
    // paths instead sample a captured SCENE render target offset by a view-space normal. That is a
    // different mechanism, not a different tuning. Correcting it needs the operand ORDER inside the
    // leaf, which is not decoded -- so it stays as it is, labelled, rather than being half-changed.
    if (romCore && rom && rom.feat && rom.feat.distortion === 'Refract') refractMats.push(mat);
    if (!romCore && rom && rom.feat && rom.feat.distortion === 'Refract'){
      const u = mat.userData.u || (mat.userData.u = {});
      // The STATIC values come from CBDistortion (fDistortionFactor @float 0, fDistortionBlend @1),
      // extracted by build-materials.py. They matter: only 1 of the 10 Refract materials animates
      // them, so taken as 0 the effect never switched on. Chameleos and Nightcloak Malfestio ship
      // factor 20 / blend 1.0 -- full replacement by the refracted scene, which IS the stealth --
      // Astalos' wings blend 0.6 and 0.8, and Hellblade's tail starts at 0 and is animated up.
      const dz = rom.m && rom.m.dist;
      u.uSceneMap  = { value: null };
      u.uDistFac   = { value: dz ? dz.factor : 0 };   // in PIXELS: 20.0 is a 20-pixel displacement
      u.uDistBlend = { value: dz ? dz.blend : 0 };
      mat.userData.refract = true;
      refractMats.push(mat);
      // must change the program cache key; see rom/shader.js
      { const tags = (mat.userData.progTags || '') + '|refractUnlit';
        mat.userData.progTags = tags; mat.customProgramCacheKey = () => tags; }
      const prevR = mat.onBeforeCompile;
      mat.onBeforeCompile = (sh) => {
        if (prevR) prevR(sh);
        Object.assign(sh.uniforms, { uSceneMap: u.uSceneMap, uDistFac: u.uDistFac,
                                     uDistBlend: u.uDistBlend });
        sh.fragmentShader = sh.fragmentShader
          .replace('void main() {',
            'uniform sampler2D uSceneMap; uniform float uDistFac; uniform float uDistBlend;' +
            ' void main() {')
          .replace('#include <opaque_fragment>',
            `#include <opaque_fragment>
             if ( uDistBlend > 0.0 ) {
               // rvec: the surface normal in VIEW space is the refraction direction, and its screen
               // projection is the displacement. Scaled by fDistortionFactor, mixed by fDistortionBlend.
               vec3 rvec = normalize( ( viewMatrix * vec4( normalize( vNormal ), 0.0 ) ).xyz );
               vec2 res = vec2( textureSize( uSceneMap, 0 ) );
               // fDistortionFactor is in PIXELS -- the shipped values are 10 and 20, which as UV
               // offsets would be ten screen-widths -- so it is divided by the target size.
               vec2 suv = ( gl_FragCoord.xy + rvec.xy * uDistFac ) / res;
               vec3 scene = texture2D( uSceneMap, clamp( suv, 0.001, 0.999 ) ).rgb;
               gl_FragColor.rgb = mix( gl_FragColor.rgb, scene, clamp( uDistBlend, 0.0, 1.0 ) );
             }`);
      };
      mat.needsUpdate = true;
    }

    // ---- TypeExtend: the TWO-MAP ALBEDO ----------------------------------------------------
    // The ROM builds these materials' albedo from two textures. The shader package names the
    // feature family "AlbedoType" with variants "ExtendModulate" and "ExtendAdd"
    // (FAlbedoTypeExtendModulate / FAlbedoTypeExtendAdd), and a companion UV feature
    // FUVAlbedoExtendMap picks which UV set the second map is sampled through. Per material the
    // ROM states that directly: feat.uvAlbedoExtendMap is UVSecondary, UVExtend or UVViewNormal,
    // and feat.uvxf is its own routing table naming which fUVTransform applies to each slot.
    //
    // 16 monster materials use it -- Khezu's m03_blood, Tigrex's m01_angry, Grimclaw's two blood
    // layers, Astalos' tikuden, Gammoth's shell -- and they were classified `extendAlbedo` and
    // HIDDEN rather than drawn, because material.js implements only the first map.
    //
    // The second UV set is REAL and cannot be approximated: TEXCOORD_1 differs from TEXCOORD_0 on
    // every one of the 141 primitives carrying both, across all six models. three.js 0.169's
    // GLTFLoader names it the `uv1` attribute, so the shader declares it directly.
    const xf = (rom && rom.feat && String(rom.feat.albedo || '')) || '';
    // MapBlend is the THIRD two-map mode and uses the same machinery: FAlbedoMapBlend, with the
    // second map routed by feat.uvAlbedoBlendMap instead of uvAlbedoExtendMap. 4 monster materials,
    // all Raging Brachydios' nenkin (slime) layers -- tail, both arms and body -- sampled through
    // UVSecondary with a 0.5 offset in U on the second matrix.
    // The combine is taken as a lerp by the blend map's ALPHA, which is what distinguishes it from
    // Modulate (multiply) and Add (sum) and is consistent with the family carrying a MapBlendAlpha
    // sibling. FLAGGED: that arithmetic is read from the family's structure, not yet from the
    // compiled shader body, so it is the least certain of the three combines.
    // NOT on the ROM core: rom/shader.js injects the second map by TECHNIQUE, which is what reaches
    // the 17 additive ones this blend-gated injection misses. It carries the same uExtXf / uExtView
    // routing as below -- it did not at first, which made switching the core on a regression here.
    if (!romCore && (xf.startsWith('TypeExtend') || xf.startsWith('MapBlend'))
        && rom.m && rom.m.t && rom.m.t.tAlbedoBlendMap){
      const tex = (rom.entry && rom.entry.tex) || [];
      const bp = tex[rom.m.t.tAlbedoBlendMap - 1];        // record ids are 1-BASED
      const uvName = rom.feat.uvAlbedoExtendMap || rom.feat.uvAlbedoBlendMap || 'UVSecondary';
      // feat.uvxf routes a slot to one of the three fUVTransform matrices; take the matrix the ROM
      // names, out of the 24-float cbm.uv block (three 2x4 affines at floats 0, 8 and 16).
      const slot = uvName === 'UVExtend' ? 3 : (uvName === 'UVSecondary' ? 1 : 0);
      const which = { Offset: 0, Offset2: 1, Offset3: 2 }[(rom.feat.uvxf || [])[slot]] || 0;
      const cbu = rom.cbm && rom.cbm.uv;
      const flat = cbu ? (Array.isArray(cbu[0]) ? [].concat.apply([], cbu) : cbu) : null;
      const m8 = flat ? flat.slice(which * 8, which * 8 + 8) : [1, 0, 0, 0, 0, 1, 0, 0];
      const u = mat.userData.u || (mat.userData.u = {});
      u.uExtMap  = { value: null };
      // 1 = ExtendModulate (multiply), 2 = ExtendAdd (sum), 3 = MapBlend (lerp by the blend alpha)
      u.uExtMode = { value: xf.startsWith('MapBlend') ? 3 : (xf === 'TypeExtendAdd' ? 2 : 1) };
      u.uExtView = { value: uvName === 'UVViewNormal' ? 1 : 0 };
      u.uExtXf   = { value: new THREE.Vector4(m8[0] || 1, m8[5] || 1, m8[3] || 0, m8[7] || 0) };
      // fAlbedoBlendColor ($Globals float4 @4) tints the second map. Its 8 tracks are all on these
      // materials and had no destination until now; 1,1,1,1 is the identity the ROM ships.
      u.uExtTint = { value: new THREE.Vector4(1, 1, 1, 1) };
      // REACHES ONLY THE LIT PATH TODAY -- 3 of these 20 materials. Measured 2026-09-07: the
      // fragment replace below targets `vec4 texel = texture2D( map, mapUv );`, a string that
      // exists only inside applyTint's <map_fragment> rewrite (material.js:262), and applyTint runs
      // only on the MeshStandardMaterial branch. The other 17 are add (16) or revsub (1), so
      // createMaterial hands them a MeshBasicMaterial and the replace silently no-ops: the shader
      // still compiles, with an unused vExtUv varying and samplers nothing reads, and the
      // fAlbedoBlendColor track writes uExtTint into the void.
      // NOT patched here on purpose. All 17 are cls:Std -- the ROM's LIT technique -- and they are
      // drawn unlit only because createMaterial tests blend before technique. They are a subset of
      // the 47 Std add/revsub materials with the same cause, so the fix is the technique dispatch
      // in the ROM material core, not a second injection point. A stopgap here would be deleted by
      // it. One of the 17 (em050_00 XfB__m03_add) is UVViewNormal and additionally needs a view
      // normal, which MeshBasicMaterial has no varying for -- another thing the lit path just has.
      // must change the program cache key; see rom/shader.js
      { const tags = (mat.userData.progTags || '') + '|extendMapUnlit';
        mat.userData.progTags = tags; mat.customProgramCacheKey = () => tags; }
      const prev = mat.onBeforeCompile;
      mat.onBeforeCompile = (sh) => {
        if (prev) prev(sh);
        Object.assign(sh.uniforms, { uExtMap: u.uExtMap, uExtMode: u.uExtMode,
                                     uExtView: u.uExtView, uExtXf: u.uExtXf,
                                     uExtTint: u.uExtTint });
        sh.vertexShader = sh.vertexShader
          .replace('void main() {', 'attribute vec2 uv1; varying vec2 vExtUv; void main() {')
          .replace('#include <uv_vertex>', '#include <uv_vertex>' + String.fromCharCode(10) + 'vExtUv = uv1;');
        sh.fragmentShader = sh.fragmentShader
          .replace('void main() {',
            'uniform sampler2D uExtMap; uniform float uExtMode; uniform float uExtView;' +
            ' uniform vec4 uExtXf; uniform vec4 uExtTint; varying vec2 vExtUv; void main() {')
          .replace('vec4 texel = texture2D( map, mapUv );',
            `vec4 texel = texture2D( map, mapUv );
             {
               vec2 euv = vExtUv;
               if ( uExtView > 0.5 ) { vec3 evn = normalize( vNormal ); euv = evn.xy * 0.5 + 0.5; }
               euv = euv * uExtXf.xy + uExtXf.zw;
               vec4 ext = texture2D( uExtMap, euv );
               ext.rgb *= uExtTint.rgb;
               // ExtendModulate multiplies the two maps, ExtendAdd sums them -- the ROM's own
               // variant names for this feature family.
               texel.rgb = uExtMode > 2.5 ? mix( texel.rgb, ext.rgb, ext.a )
                         : ( uExtMode > 1.5 ? texel.rgb + ext.rgb : texel.rgb * ext.rgb );
             }`);
      };
      mat.needsUpdate = true;
      if (bp) jobs.push(getTexture(bp).then(t => { u.uExtMap.value = t; mat.needsUpdate = true; }));
    }
    // the ROM core installs the two-map injection by TECHNIQUE in rom/shader.js, so it reaches the
    // 17 add/revsub materials the old blend-gated injection silently missed. Bind its map here.
    if (romCore && rom && rom.m && rom.m.t && rom.m.t.tAlbedoBlendMap && mat.userData.u && mat.userData.u.uExtMap){
      const tl = (rom.entry && rom.entry.tex) || [];
      const bp2 = tl[rom.m.t.tAlbedoBlendMap - 1];
      if (bp2) jobs.push(getTexture(bp2).then(t => { mat.userData.u.uExtMap.value = t; mat.needsUpdate = true; }));
    }
    // THE SPHERE MAP. FReflect SphereMap binds tSphereMap, and the whole reflection block in
    // material.js (uEnv / uEnvAmt / the Schlick term) was DEAD on monsters because this fetch did
    // not exist -- rom.sphere was decoded and thrown away, so uEnvAmt stayed 0 on every monster.
    // 75 monster materials declare the feature and bind a map; exactly one of them carries
    // fReflectiveColor 0, which envStrength() already treats as "switched off".
    // Bound the same way the Armor Viewer binds it (render/piece.js:170), so both apps agree.
    if (rom && rom.feat && rom.feat.reflect === 'SphereMap' && rom.sphere)
      jobs.push(getTexture(rom.sphere).then(t => { if (hasShaderUniforms(mat)) setEnvTexture(mat, t); }));
    // A kind-3 track switches the albedo to another entry in this material's OWN texture list, by
    // 1-based index. Preload only the indices its tracks actually name -- 41 tracks library-wide.
    const swapIdx = new Set();
    for (const c of (rom && rom.anim) || [])
      for (const t of c.tracks || [])
        if (t.kind === 3 && t.keys) for (const k of t.keys) swapIdx.add(k[1]);
    if (swapIdx.size){
      const list = (rom.entry && rom.entry.tex) || [];
      mat.userData.texSwap = [];
      for (const i of swapIdx)
        if (i >= 1 && list[i - 1])
          // a switched-in map takes this material's UV writes too, so it is private on the same rule
          jobs.push(getTexture(list[i - 1]).then(t => { mat.userData.texSwap[i - 1] = own(t); }));
    }
  };
  root.traverse(buildMesh);
  // ---- RUNTIME MATERIAL SWAP -------------------------------------------------------------------
  // The ROM does not only change a material's CONSTANTS for a state, it can replace the material
  // object outright. Khezu's charge calls setMaterialAt(model, mat, 0) at 0xd1eca0 -- 0x88db20
  // releases model->materials[+0xf8][0], stores the new pointer, addrefs it and refreshes the mesh
  // array at +0x260 -- and only then plays Taiden_start on what is now index 0.
  //
  // The material it stores was fetched by NAME at spawn (0xd0f4e0, the literal
  // "XfBA_A0__m04__taiden", parked at enemy+0x44). That name is why #833258c1 had no name in our
  // data: crc32("XfBA_A0__m04__taiden") ^ 0xFFFFFFFF is exactly 0x833258c1.
  //
  // NOTHING IN THE MODEL BINDS IT, which is why the viewer never drew it: the .mrl carries the
  // material, no mesh references it, so the glTF export has no trace of it. It exists only as a
  // swap-in. Built here from the materials.json record, held aside, and hung on the mesh by
  // applyMaterialSwap.
  //
  // The build runs on a DETACHED mesh sharing an existing geometry. buildMesh only reads geometry
  // for a vertex count and writes classifications onto o.userData, so the throwaway costs nothing
  // and guarantees the swap-in is built exactly as a mounted material is.
  const swapTable = (rec.id && STATE_MATERIAL_SWAP[rec.id]) || null;
  const swaps = {};
  if (swapTable){
    let geom = null;
    root.traverse(o => { if (!geom && (o.isMesh || o.isSkinnedMesh)) geom = o.geometry; });
    if (geom) for (const st of Object.keys(swapTable)){
      for (const from of Object.keys(swapTable[st])){
        const to = swapTable[st][from];
        const probe = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ name: to }));
        buildMesh(probe);
        // specFor found no record for that name: do not hang a default-grey material on the model.
        if (!(probe.material.userData && probe.material.userData.rom)) continue;
        (swaps[st] || (swaps[st] = {}))[from] = probe.material;
      }
    }
  }
  root.userData.matSwap = swaps;
  // clips whose name the harvest did not know, named from their ROM hash (ROM_CLIP_NAMES)
  root.traverse(o => { if (o.material) nameClipsByHash(o.material); });
  for (const st of Object.keys(swaps)) for (const mat of Object.values(swaps[st])) nameClipsByHash(mat);
  // ROM_BREAK_SWAP's swap-ins, built the same way and hung by retargetMaterials while the break's part is drawn
  const breakRows = (rec.id && ROM_BREAK_SWAP[rec.id]) || null;
  const breakSwap = [];
  if (breakRows){
    let geom = null;
    root.traverse(o => { if (!geom && (o.isMesh || o.isSkinnedMesh)) geom = o.geometry; });
    const built = new Map();
    if (geom) for (const r of breakRows){
      if (!built.has(r.to)){
        const probe = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ name: r.to }));
        buildMesh(probe);
        built.set(r.to, (probe.material.userData && probe.material.userData.rom) ? probe.material : null);
      }
      if (built.get(r.to)) breakSwap.push({ part: r.part, from: r.from, to: built.get(r.to) });
    }
  }
  root.userData.breakSwap = breakSwap;
  await Promise.all(jobs);
  root.userData.joints = rec.joints || [];
  root.userData.mats = mats;
  // The monster id, so rageLadder() can consult ROM_CLIP_LADDER without index.html having to
  // thread it in -- stepMatAnim already gets it, the ladder builder did not.
  root.userData.monId = rec.id || null;
  // The pose driver writes bone transforms straight onto these nodes, so once a clip has
  // played there is nothing left that remembers the rest pose. Snapshot it here; the Clip
  // select's "Bind pose" entry restores it (before this, choosing it simply froze the
  // monster on the last frame it happened to be showing).
  root.userData.bind = [];
  root.traverse(o => root.userData.bind.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]));
  return root;
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
// Hide-only in the same sense the retired effect-class toggle was: turning it back off returns the mesh to
// whatever the part table said, rather than forcing on something the table had switched off.
// The ROM draws every TypeExtend material; the two-map albedo it needs is implemented at load, so
// there is nothing left to hide. Kept as a no-op rather than removed, because the caller is app
// behaviour and this file is the rendering side.
export function setExtendVisible(root, on){ return; }

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
  // and undo any kind-3 texture swap, which is material state rather than node state.
  // Two homes for the albedo: `mat.map` on the old stock-material path, the tAlbedoMap uniform on
  // the ROM core. rom/matanim.js also restores it from its own base every frame, so this only
  // matters while material animation is switched off.
  if (root) root.traverse(o => {
    const m = o.material, base = m && m.userData && m.userData.romMap;
    if (!base) return;
    if (m.uniforms && m.uniforms.tAlbedoMap){
      if (m.uniforms.tAlbedoMap.value !== base){ m.uniforms.tAlbedoMap.value = base; m.needsUpdate = true; }
    } else if (m.map !== base){ m.map = base; m.needsUpdate = true; }
  });
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
//  * THE FRAME RATE and the EVALUATOR now live in the shared render/material.js, because the
//    Armor Viewer needs them too -- 1,486 of its materials carry an animation block. Only the
//    CLIP-SELECTION POLICY below is monster-specific.
export { MAT_FPS };
// The ENRAGED state, by the ROM's own clip names. A clip's hash is ~crc32 of its name and the names
// are strings in main.rodata, so 117 of the 134 distinct monster clip hashes resolve -- Angry_Start,
// Gekikou_Start, Normal and the rest. Selecting by name makes this general: 12 materials across the
// library carry Angry_Start, and Savage Deviljho adds Gekikou_Start on top.
// Raven, 2026-09-06: "His eyes and the top of his face/head/neck should be covered in an effect once
// enraged", and on what was already drawing: "We have the scarring effect, the small red highlighted
// slices" -- the small eye patch was showing and the large layer over it was not.
//
// THE ROM'S OWN SHAPE, read out of Khezu 2026-09-09 and now modelled rather than approximated.
// Khezu carries its own dispatcher (0xd0f4e0 - 0xd1ef40, keyed on the state byte at enemy+0x48),
// and every state it runs has the same three parts: a one-shot START, a looping STEADY it hands
// off to, and a one-shot END back to rest.
//
//   enrage   0xd1e8d4  setClip(blood, slot 1, "Angry_Start"); slot-1 time := 0
//   ...then  0xd1e914  once slot-1 time >= Angry_Start's frame count:
//                      clearAllSlots(0xb09a3c) then setClip(blood, slot 0, "Angry_Repeat")
//   calm     0xd1e698  clearAllSlots then setClip(blood, slot 0, "Angry_End")
//   ...then  0xd1e99c  once that elapses: clearAllSlots then setClip(slot 0, "Nomal_Repeat")
//
// Two things follow that the old flat lists could not express. The START goes in SLOT 1 OVER the
// running steady clip with its own zeroed clock, and it is DROPPED when it finishes -- the viewer
// used to select Angry_Start and clamp it at frame 60 for ever, which is Raven's "the flash also
// does not revert when toggled off... it feels like we are not turning off the effect, simply
// pausing it instead". And the END goes in SLOT 0 ALONE, not layered over the rest clip, because
// the ROM clears every slot first.
//
// CHARGED IS A SEPARATE STATE, NOT PART OF RAGE. Khezu's Taiden (electric charge) branch at
// 0xd1ec1c is reached through a different value of that same state byte: it drives
// Body_Taiden_Repeat on enemy+0x30 and Alpha_Taiden_Repeat on +0x34, then swaps the vein
// material (see STATE_MATERIAL_SWAP) and plays Taiden_start on it. Running it on the rage toggle
// put a 15-frame -- 0.25s at MAT_FPS 60 -- full-body strobe on top of the rage veins, which is
// Raven's "the enraged effect is also super bright".
//
// WHICH AI STATE FIRES WHICH IS NOT DECODED. This reads what each state DOES; what selects it is
// a gap, so the two toggles are a viewer affordance over the ROM's state byte, not a
// reconstruction of the game's transitions.
// Each non-calm state owns its own END, because leaving one is not leaving the other: Khezu's
// discharge (0xd1e7a0) plays Body_Taiden_End / Alpha_Taiden_End / Taiden_End, and its calm-down
// (0xd1e698) plays Angry_End. Which one is right depends on the state being LEFT, so the picker is
// given the previous state as well as the current one.
const STATE_NAMES = {
  enraged: { start: ['Gekikou_Start', 'Angry_Start', 'angry_Change'],
             steady: ['Angry_Repeat', 'Angry', 'angry_loop'],
             // Gekikou_End BEFORE Angry_End, which is the order the old flat list had and is not
             // cosmetic: Savage Deviljho carries both and its driver plays Gekikou_End leaving
             // rage (0xe80b34 against 0xe80b54).
             end: ['Gekikou_End', 'Angry_End', 'angry_End'] },
  charged: { start: ['Taiden_start'],
             steady: ['Body_Taiden_Repeat', 'Alpha_Taiden_Repeat', 'Taiden_Repeat'],
             end: ['Body_Taiden_End', 'Alpha_Taiden_End', 'Taiden_End'] },
  // EXHAUSTED (the ROM's "tired"). Both Mizutsune share class uEm082_00; its init (0x1035228) caches
  // tired_Change / tired_End beside angry_Change / angry_End on the overlay material, and the base
  // clip setter (0x1037bb8) plays them on the tired predicate 0x81614 -- status +0x505 is 2 or 3 --
  // clearing every slot first, as it does for angry on 0x81670. Neither clip loops and there is no
  // steady clip, so the start is HELD on its last frame (blue 0.2/0.52/1.0, emission 0.3) and the end
  // runs on the way out. Raven, 2026-09-13: "Can you look into Soulseer and Mizu Enraged and
  // Exhausted rendering?"
  //
  // `only` KEEPS IT ON THE CLASS IT WAS READ FROM. Valstrax's breathe material carries its own
  // tired_start / tired_Loop / tired_end under a driver nobody has read, and `tired_end` matches
  // tired_End without case -- offered to every monster, that material "took part" in a state and its
  // Enraged pick went from tired_Loop over Loop to Loop alone.
  tired:   { start: ['tired_Change'], steady: [], end: ['tired_End'], only: ['em082_00', 'em082_04'] },
  calm:    { rest: ['Nomal_Repeat', 'Normal'] },
};
// WHICH MATERIAL A STATE REPLACES, per monster. Keyed by material NAME; the ROM keys by the array
// index (setMaterialAt's third argument is 0 for Khezu). VERIFIED that those are the same material,
// 2026-09-09, out of em003_00.mod itself rather than out of our export: the model's material name
// table is at 0x1a5c, 128-byte stride, and the header's material count is 4 --
//
//     index 0  XfBA_A0__m03_blood          <- what setMaterialAt(model, taiden, 0) replaces
//     index 1  XfBAN__E0__m02_body_d
//     index 2  XfB_N__E_m01_body
//     index 3  XfBAN__E0__m50_body_alpha
//
// -- and XfBA_A0__m04__taiden is NOT in that table at all. That is why no mesh binds it, why the
// glTF export has no trace of it, and why the ROM has to fetch it by name into enemy+0x44 before it
// can swap it in. See the swap build in loadMonster.
//
// XfBA_A0__m04__taiden against XfBA_A0__m03_blood is the whole of Khezu's "black veins": they are
// the same geometry and the same two textures under the same feature word (f4,
// TypeExtendModulate). m03_blood is BSRevSubAlpha with authored emission 0 -- it SUBTRACTS, which
// is what makes the veins read as black -- and m04__taiden is BSAddAlpha with authored emission
// 2.0. One darkens, one glows, and the game picks between them by swapping the material.
export const STATE_MATERIAL_SWAP = {
  // KHEZU'S CHARGE FROM CALM SWAPS THE VEIN LAYER -- cyan veins. Raven, 2026-09-15: "Khezu's veins should
  // turn cyan during his charged state", then, of his 2026-09-10 "The veins remain red during the charging
  // state attacks": "I thought it was an error, but I was looking at footage and saw I was mistaken". Both
  // are the ROM; which one shows depends on the state he charges FROM.
  //
  // Khezu's material driver 0xd1e52c works out a wanted state every frame -- 11 when vtable +0x3f4 says so
  // (Death), else 1 on the angry predicate 0x81670 or 3 if [+0xcac0]+0x20 (the charge flag) is also set,
  // else 2 on the charge flag alone, else 0 -- and switches on the state it is in, [+0xcac0]+0x48:
  //
  //     in 0 (calm)   wants 2   0xd1ec1c  clearAllSlots on the vein layer, Body_Taiden_Repeat on +0x30 and
  //                                       Alpha_Taiden_Repeat on +0x34, setMaterialAt(model, [+0x44], 0) --
  //                                       XfBA_A0__m04__taiden into slot 0 -- +0x38 := that material,
  //                                       Taiden_start on it; state 2
  //     in 1 (angry)  wants 3   0xd1ed40  Body_Taiden_Repeat and Alpha_Taiden_Repeat only, NO swap -- the
  //                                       vein layer keeps m03_blood and its Angry clip, red; state 3
  //     in 4          wants 2   0xd1ee50  the same swap as from calm
  //     in 2          wants 0 / 1 / 11   Body / Alpha / Taiden_End (Virus_ ones under +0x49) on the three
  //                                       layers -- the vein layer is still the swapped one; state 7
  //     in 7                    0xd1ea0c  once Body_Taiden_End's time reaches its frame count: clearAllSlots,
  //                                       setMaterialAt(model, [+0x40] m03_blood, 0), Nomal_Repeat; state 0
  //
  // In 2 the driver ignores wanting 3 and in 3 ignores wanting 2: whichever came first holds until the
  // charge ends. The viewer's Enraged and Discharge rows may both be on (Raven, 2026-09-15), and the swap
  // follows Discharge alone -- Raven: "Ensure the cyan veins are kept while discharge is toggled on". What keeps
  // the game's veins cyan when the charge begins while angry is UNREAD: the 0xd1ed40 path read so far sets no
  // swap. index.html's matAxes runs the two rows side by side (ROM_CHARGE_FREEZES_RAGE for the rage layer's
  // timing) and STATE_SWAP_HOLD keeps the swap through the discharge.
  //
  // What the swap does to the colour (measured 2026-09-10): m03_blood and m04__taiden are the same material
  // but for the blend -- BSRevSubAlpha against BSAddAlpha, 0x04020802 against 0x00020802 -- and
  // fEmissionColor 0 against 2. The blend map is teal, so subtracting it reads red and adding it reads cyan:
  // calm the layer contributed (-6, -25, -23), red at (102, 84, 76); swapped (+16, +57, +53), cyan at
  // (110, 137, 125). '#833258c1' is m04__taiden's record: crc32("XfBA_A0__m04__taiden") ^ 0xFFFFFFFF.
  em003_00: { charged: { 'XfBA_A0__m03_blood': '#833258c1' } },
};
// CLIP NAMES THE HARVEST DID NOT KNOW, from the ROM's own name hash -- crc32(name) ^ 0xFFFFFFFF, the word
// build-matanim.py keeps as `hash` beside a null `name`.
//   0x61eb3023 'Taiden_Repeat'  XfBA_A0__m04__taiden's third clip: 120 frames, looping, one track -- fUVTransform2
//     from -0.5 to 0.5, the vein texture scrolling, the same scroll Nomal_Repeat runs on m03_blood. Unnamed, the
//     charged state could only hold Taiden_start's last frame, and the veins stopped moving. Raven, 2026-09-15:
//     "I don't see the veins that move throughout the body when discharge is on", "I see they turn cyan, but they
//     stop playing once discharge is enabled". Named, the state plays Taiden_start and hands on to it (clipPicker's
//     start-then-steady rule, as enraged does). UNREAD: what starts Taiden_Repeat in the game -- Khezu's material
//     driver (0xd1e52c) only ever sets Taiden_start and Taiden_End on this layer, the string "Taiden_Repeat" is not
//     in the executable, its hash is not a constant in the code, and its load-time auto bit (clip +4 bit 1, read by
//     0xb09a3c) is clear.
const ROM_CLIP_NAMES = { 0x61eb3023: 'Taiden_Repeat' };
function nameClipsByHash(mat){
  const clips = mat && mat.userData && mat.userData.rom && mat.userData.rom.anim;
  if (!clips) return;
  for (const c of clips){
    if (c && !c.name && typeof c.hash === 'number' && ROM_CLIP_NAMES[c.hash >>> 0]) c.name = ROM_CLIP_NAMES[c.hash >>> 0];
  }
}
// A SWAP THAT OUTLASTS ITS STATE: the leaving clip whose length the ROM waits out before putting the
// original back. Khezu's discharge keeps m04__taiden on the vein layer until Body_Taiden_End has run its
// frame count (state 7, 0xd1ea0c), so its Taiden_End plays on the cyan layer and only then do the red
// veins return with Nomal_Repeat.
export const STATE_SWAP_HOLD = {
  em003_00: { charged: 'Body_Taiden_End' },
};
// How long leaving `st` holds its swap, in seconds: the STATE_SWAP_HOLD clip's frame count on this model, or 0.
export function stateHoldSeconds(root, monId, st){
  const hold = root && monId && STATE_SWAP_HOLD[monId] && STATE_SWAP_HOLD[monId][st];
  if (!hold) return 0;
  let frames = 0;
  root.traverse(o => {
    const clips = o.material && o.material.userData && o.material.userData.rom && o.material.userData.rom.anim;
    if (!clips || frames) return;
    const c = clips.find(x => x && typeof x.name === 'string' && x.name.toLowerCase() === hold.toLowerCase());
    if (c && c.frames) frames = c.frames;
  });
  return frames / MAT_FPS;
}
// A CHARGE THAT FREEZES THE RAGE LAYER. Raven, 2026-09-15: "we can have Enraged and Discharge states at the same
// time". Khezu's driver can: its state 3 is angry and charged at once. Its rage is set when the charge begins
// (see STATE_MATERIAL_SWAP): a rage that starts while charged is ignored (state 2), one that ends while charged
// is ignored too (state 3). Either way the rage-driven layer holds what it had until the discharge's end clip has
// run (states 7 / 8), and only then catches up -- Angry_Start from 7 if he is angry by then, Angry_End from 8's
// hand-back to state 1 if he is not. (The swap itself follows the Discharge row: see STATE_MATERIAL_SWAP.)
export const ROM_CHARGE_FREEZES_RAGE = { em003_00: true };
export function chargeFreezesRage(monId){ return !!(monId && ROM_CHARGE_FREEZES_RAGE[monId]); }
// Hang the swap materials for `state` on the meshes that carry the originals, or put the originals
// back when the state has none. The ROM's own mechanism is different -- it replaces the entry in
// the model's material array and refreshes the mesh list (0x88db20) -- and this reaches the same
// place by retargeting the three.js meshes instead.
export function applyMaterialSwap(root, state){
  const table = root && root.userData && root.userData.matSwap;
  if (!table) return 0;
  root.userData.matSwapState = state || null;
  return retargetMaterials(root);
}
// The material each mesh draws: the state's swap (applyMaterialSwap), else a break's (ROM_BREAK_SWAP, while its part
// is drawn), else the original. One resolver for both, so neither caller can undo the other's swap.
function retargetMaterials(root){
  const ud = root.userData;
  const table = ud.matSwap;
  const want = (ud.matSwapState && table && table[ud.matSwapState]) || null;
  const brk = (breakSwapOn && ud.breakSwap && ud.breakSwap.length) ? ud.breakSwap : null;
  const drawn = ud.partsDrawn;
  let n = 0;
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;
    if (o.userData.matOrig === undefined){
      o.userData.matOrig = o.material;
      o.userData.orderOrig = o.renderOrder || 0;
    }
    const orig = o.userData.matOrig;
    let next = (want && orig && want[orig.name]) || null;
    if (!next && brk && drawn && orig) for (const r of brk){
      if (r.from !== orig.name) continue;
      const v = drawn.get(r.part);
      if (v === undefined || v){ next = r.to; break; }
    }
    next = next || orig;
    if (o.material === next) return;
    o.material = next;
    o.renderOrder = (next.userData && next.userData.renderOrder) || o.userData.orderOrig || 0;
    if (o.userData.romRow) applyDrawOrder(o);
    n++;
  });
  return n;
}
const ENRAGE_CLIPS = STATE_NAMES.enraged.start.concat(STATE_NAMES.enraged.steady);
const CHARGE_CLIPS = STATE_NAMES.charged.start.concat(STATE_NAMES.charged.steady);
const CALM_CLIPS = STATE_NAMES.enraged.end.concat(STATE_NAMES.charged.end, STATE_NAMES.calm.rest);
// CLIP NAMES ARE MATCHED WITHOUT CASE. The ROM is not consistent about it and the lists above were
// typed from whichever spelling was in front of whoever wrote them -- note `angry_loop` lowercase
// sitting beside `Angry_Start` capitalised, in the same array.
//
// Counted 2026-09-09 across every monster material: NINE monsters miss a clip on case ALONE, and
// the ROM supplies both spellings itself, so comparing without case invents nothing.
//
//   angry_Loop   vs angry_loop    Congalala, Glavenus, Hellblade Glavenus, Nakarkos x3
//   normal       vs Normal        Lavasioth, Glavenus
//   angry_start  vs Angry_Start   Amatsu, Ahtal-Ka
//   angry_end    vs Angry_End     Amatsu, Ahtal-Ka
//
// Ahtal-Ka is the clearest: its only animated material is the eye, carrying `angry_start`,
// `angry_loop` and `angry_end`. It hit on exactly one of the three -- the loop, because that entry
// happens to be lowercase in the list -- so the eye jumped to a held state with no ramp in and
// nothing to return to. Raven, 2026-09-09: "enraged toggle does not really show the eye effect, it
// also does not toggle off like Khezu's flashing".
const sameClip = (a, b) => typeof a === 'string' && typeof b === 'string' &&
                           a.toLowerCase() === b.toLowerCase();
const clipInList = (c, list) => !!c && list.some(nm => sameClip(c.name, nm));
// Names the ROM uses for a base state. `nomal` is its own spelling, not a typo of mine.
const REST_NAME = /normal|nomal|cool|off/i;
// A clip named *_End is the ROM's transition INTO the base state, and its final frame -- which the
// evaluator clamps and holds -- IS that state. CALM_CLIPS already lists three of them by hand
// (Angry_End, Gekikou_End, angry_End); the suffix is the rule behind those. It reaches Khezu's
// Taiden_End, Body_Taiden_End and Alpha_Taiden_End, and the same shape on Agnaktor (maguma_End),
// Alatreon (blue_End, red_End), Nightcloak (stealth_end) and Soulseer (tuya_end).
//
// Khezu is why: its #833258c1 is an ADDITIVE electric layer whose unnamed looping clip writes only
// a UV scroll and no transparency, so once anything switched it on it stayed on at full strength.
// Taiden_End is the clip that takes fTransparency 1.0 -> 0.0, and nothing selected it.
const END_NAME = /_end$/i;
// DEFAULT OFF, and it stays off until Raven has looked at it. The premise -- that a looping clip
// is a safe thing to show at rest -- did not survive the data. Valstrax's m05_eye carries exactly
// three clips and its `Loop` drives fConstantColor to [0, 0, 0, 1], BLACK, for its whole duration:
//
//     start   [1,1,1,1] -> [0,0,0,1]    the eye fading OFF
//     Loop    [0,0,0,1]  held           the eye held OFF
//     end     [0,0,0,1] -> [1,1,1,1]    the eye coming ON
//
// So on that material "the sustained loop" is the OFF state, and selecting it would have turned
// the eyes black rather than restoring them. `Loop` carries no rest marker, so the name heuristic
// does not save it either. The same shape is likely on other effect layers: an effect's steady
// state is frequently "not showing".
//
// The code is kept because the fallback is still the right SHAPE for the 46 materials that
// currently sit on a static constant -- it is the CHOICE of clip that is unsafe, and that is
// Raven's to make per material, not mine to guess library-wide.
// __view.clipFallback(true) turns it on for comparison.
let clipFallback = false;
export function setClipFallback(on){ clipFallback = !!on; }
export function clipFallbackOn(){ return clipFallback; }
// EVERY MATERIAL A MESH CAN CARRY -- what is on it now, and what a state swap took off it.
// A scanner that looks only at o.material sees a different model depending on which state happens
// to be showing: with Khezu charged, the mesh holding Angry_Start is carrying #833258c1 instead,
// so enrageParts came back empty and the Enraged checkbox VANISHED, then came back the moment the
// swap was undone. Raven, 2026-09-09: "They disappear for some reason" / "almost each selection
// causes one to appear then reappear".
function matsOfMesh(o){
  const cur = o.material;
  const orig = o.userData && o.userData.matOrig;
  return (orig && orig !== cur) ? [cur, orig] : [cur];
}
// Materials that carry a clip from `list`, over every material the model can put on a mesh --
// including the swap-ins, which is how a clip that lives ONLY on a swapped-in material counts.
function materialsWithClip(root, list){
  const out = new Set();
  if (!root) return out;
  root.traverse(o => {
    for (const m of matsOfMesh(o)){
      const rom = m && m.userData && m.userData.rom;
      for (const c of (rom && rom.anim) || [])
        if (clipInList(c, list)) out.add(m.name);
    }
  });
  const sw = root.userData && root.userData.matSwap;
  for (const st of Object.keys(sw || {}))
    for (const m of Object.values(sw[st])){
      const rom = m && m.userData && m.userData.rom;
      for (const c of (rom && rom.anim) || [])
        if (clipInList(c, list)) out.add(m.name);
    }
  return out;
}
// A LEVELLED EFFECT LADDER, where a monster drives one material through numbered stages instead of
// a single enraged state. Raven, 2026-09-10: "you found Bloodbath has a variable rage state, it's
// not a normal Enraged State", and on how to show it: "Just have a drop down that ranges from No
// Rage to the max level".
//
// Three monsters carry one, and a single toggle got two of them wrong rather than merely
// incomplete, because the enraged fallback takes the LAST LOOPING clip:
//
//   Bloodbath Diablos  XfB_0__m50_angry   Lv1_to_Lv2  Lv2_loop  Lv2_to_Lv3  Lv3_loop  Lv3_to_end
//                      -- two sustained levels; the fallback jumped to Lv3 and Lv2 was unreachable
//   Gore Magala        XfB_W__m01_kasan   BodyLight_Start_LV1..LV3, LVMAX, Finish, Normal
//   Chaotic Gore       (the same material) -- FOUR levels, all one-shots that hold their final
//                      frame, and the only LOOPING clip is BodyLight_Start_Finish, so the fallback
//                      selected the finish and no level was ever shown. That is Raven's Pass 1
//                      report "Gore Magala has a wing effect or albedo layer that renders poorly".
//
// READ OFF THE CLIP NAMES, not a per-monster table: a clip naming exactly ONE level is that level's
// own clip, one naming TWO is a transition between them (Lv1_to_Lv2), and an *_end is the way out
// rather than a level (Lv3_to_end names Lv3 but is not it).
const LEVEL_TOKEN = /lv\s*(\d+|max)/gi;
function levelsOf(name){
  if (typeof name !== 'string' || END_NAME.test(name)) return [];
  const out = [];
  let m;
  LEVEL_TOKEN.lastIndex = 0;
  while ((m = LEVEL_TOKEN.exec(name))) out.push(m[1].toLowerCase());
  return out;
}
// A LADDER THE ROM ADDRESSES BY CLIP INDEX, because these clips carry no name to match on.
//
// Boltreaver Astalos's four charge materials each hold the SAME PAIR of clips, and both are
// `name: null` with `auto: 0` -- so neither of clipPicker's routes can reach them and they sit on
// their shipped static fConstantColor, which is white. Raven, 2026-09-11: "Review Boltreaver's
// effects, I don't see Green or Cyan coloring". His two colours ARE the two clips, read out of
// em081_04.mrl in file order, identical on all four materials:
//
//     clip 0   hash 668876438   fConstantColor 0.32, 1.00, 0.20   GREEN
//     clip 1   hash 3084603398  fConstantColor 0.20, 1.00, 1.00   CYAN
//
// and the game selects them BY INDEX. em081_04 has no class of its own -- it runs uEm081_00, the
// base Astalos class -- and that class never calls findMatClipByName (0xb08b44) at all; neither
// hash appears anywhere in the binary as a literal. It sets a bare index:
//
//     0101924c  mov r1,#0 / mov r2,#1 / bl 0xb09ae8     slot 0, clip 1 -> cyan
//     010192c0  mov r1,#0 / mov r2,#0 / bl 0xb09ae8     slot 0, clip 0 -> green
//
// chosen by a 5-case jump table on the charge byte at enemy+0xcb01 (two more of the same shape sit
// on +0xcb02 and +0xcb03, one per charged region):
//
//     case 0, 1   clearAllSlots     effect off
//     case 2, 3   clip 0            green  -- the two cases differ only in which parts light
//     case 4      clip 1            cyan
//
// THE CHARGE STATE IS THAT BYTE, SO THE COLOUR RIDES THE CHARGE STATE. Read in full 2026-09-13
// (Boltreaver's driver is 0x10190a0, entered from the variant gate at 0x1018da0): each of the three
// regions (+0xcb01 head, +0xcb02 wings, +0xcb03 tail) switches its part sets AND its clip on the same
// case --
//
//     case 0   Uncharged      sets 3/4, 11, 14/15 20/21, 26/27    clearAllSlots
//     case 1   Charging       sets 5/6, 12, 16/17 22/23, 28/29    clearAllSlots
//     case 2   Charged        sets 7/8, 13, 18/19 24/25, 30/31    clip 0  green
//     case 3   Overcharging   sets 33/34, 35, 37/38 39/40, 41/42  clip 0  green
//     case 4   Overcharged    sets 7/8, 13, 18/19 24/25, 30/31    clip 1  cyan   (case 2's parts)
//
// the mats being cached at spawn by MRL id (0x1011460, variant 4 only): 30 taiden_head, 33 taiden_crow,
// 36 E1_wing_taiden, 32 taiden_tale. Raven, 2026-09-13: "Uncharged -> Charging -> Charged ->
// Overcharging -> Overcharged", then "Go ahead and use that five-state schema for Boltreaver" -- so
// the separate Green/Cyan dropdown is gone and part-review.json's `levels` carries those five rungs,
// rung N being case N. `byLevel` is the clip per rung; '#none' is clearAllSlots, the material's own
// authored values.
export const ROM_CLIP_LADDER = {
  em081_04: {                                    // Boltreaver Astalos
    mats: ['XfBA2_taiden_head', 'XfBA2_taiden_crow', 'XfBA2_taiden_tale', 'XfBAN__E1_wing_taiden'],
    byLevel: ['#none', '#none', '#0', '#0', '#1'],
  },
};
// A PART SET THAT IS ALSO A MATERIAL STATE. Raven, 2026-09-13: "Thunderlord is supposed to have a
// Yellow state, it currently only has green effects ... The third option has the parts meant to
// display the overcharged state, the yellow effect instead of green."
//
// The ROM drives both from ONE flag, the charge byte at [[enemy+0x1428]+0x5df3] (read by 0x816d4):
//   parts   0xef0370 (Thunderlord, variant 4, via 0xef009c): flag set -> setVisibleGroup 19, else 0
//   clips   0xef009c: flag set -> slot 0 of each cached material gets its CHARGE clip, else normal_Loop
//           (and Death on the light while dead). The spawn setup 0xeeb95c caches the materials by MRL
//           id -- 52 XfB__m02_light, 3 XfB__I0__m03_effect -- and picks the charge clip by variant:
//           tyoutaiden_Loop for Zinogre, shintaiden_Loop for variant 4 (0xeebc50 / 0xeebcb0).
// shintaiden_Loop is the yellow: on m03_effect it writes fEmissionColor (0.78,0.78,0.2)..(0.99,0.79,0.5)
// where normal_Loop writes (0.2,0.8,0.5), and on m02_light it moves the atlas column (U 0 against
// 0.333). With no flag in the viewer, the part row IS the flag -- group 19 drawn means the flag is set --
// so the clip follows the row. Keyed by the set index, which is the ROM's.
export const ROM_SET_CLIP = {
  em057_04: { set: 19, on: 'shintaiden_Loop', off: 'normal_Loop' },   // Thunderlord Zinogre
};
export function setClipFor(monId, groups){
  const t = monId && ROM_SET_CLIP[monId];
  if (!t || !Array.isArray(groups)) return undefined;
  return groups[t.set] ? t.on : t.off;
}
// A MONSTER'S OWN STAGE MACHINE OVER ITS EFFECT LAYERS, run here the way the ROM runs it, where a
// picker over "the state and when it last changed" cannot say what the game does.
//
// TEOSTRA (uEm027_00). At spawn it caches the materials numbered 1..3 (`material+0x18 >> 22`, 0xe10444)
// -- XfBAN_W_0__m01_effect01, XfBAN_W_0__m02_effect02, XfB__m03_Bombmode -- into [enemy+0xcac0] +0x14,
// +0x18 and +0x1c, and clears their slots (0xb09a3c): all three sit on their authored values, which draw
// nothing (fTransparency 0 on the two Alpha layers, $Globals constant alpha 0 on Bombmode). Its virtual
// 0xe1a604 (vtable +0x374) then walks a stage byte, [enemy+0xcac0]+0x20, putting one clip into SLOT 1 of
// all three and zeroing that slot's time (0xe1012c, the names at 0x17b6a44):
//
//     stage 0   isEnraged (0x81670)                          -> Effect_Start, stage 1
//     stage 1   slot 1's time reaches that clip's frames      -> Effect_Loop,  stage 2   (0xe102c4)
//     stage 2   no longer enraged                            -> Effect_End,   stage 3
//     stage 3   slot 1's time reaches that clip's frames      -> stage 0, Effect_End held on its last frame
//
// Rage is read only in stages 0 and 2, so a toggle during either one-second transition waits for it to
// finish -- which is why this keeps its own stage and clock instead of reading tState.
// Raven, 2026-09-13, over a screenshot of the layers striped and lit at rest: "The stripped areas are
// effects that are not modeled", then "Make both fixes for Teostra".
//
// VALSTRAX (uEm086_00) runs the same four stages ONE MACHINE PER MATERIAL, which is why a monster's entry
// may be a list. Its init (0x109e6a0) gives each of m01_black, m02_angry, m03_eff and m05_eye (MRL ids 1,
// 2, 3, 5) a 0x18-byte record -- material, start, Loop, end, stage, frames -- at +0xcb30, +0xcb48, +0xcb60
// and +0xcb90, and its frame calls 0x10a1984 on each with the enrage predicate 0x81670 (0x10a1270,
// 0x10a128c, 0x10a12a8, 0x10a12c4). 0x10a1984 is the Teostra machine on that record's own clock: start
// on rage from stage 0, Loop once start's frames pass, end on calm from stage 2, then stage 0 with end
// held. Two differences, both read: the clips go into SLOT 0 (setMatClip r1 = 0), and the init clears no
// slots -- so before the first rage each material keeps its load-time AUTO clip (`rest: 'auto'`): Loop
// on the three layers, and nothing on the eye, which carries no auto clip and sits on its shipped
// constant. What the viewer gains is the ROM's transitions: the eye fades to black over start's 16
// frames and back over end's, and a layer left by calm holds end's last frame rather than jumping back to
// Loop. Not here: m04_breathe (see ROM_SPAWN_CLIP) and m06_heat, whose record at +0xcba8 runs on bit 1
// of the flag word at +0x5c0 (0x10a1554), not on rage.
//
// AGNAKTOR (uEm049_00) runs one machine PER LAVA SLOT, and its "on" is heat, not rage. Raven, 2026-09-11: "lava
// effect isn't quite right ... needs to either be non-translucent or brighter to cover the cooled lava parts";
// 2026-09-14, "Look at Lagiacrus Shocker, it felt dull, may help us solve Agnaktor's issue". With Heated on the
// viewer showed every lava material at opacity 0.04 -- cool_Loop's fTransparency (0 / 0.1 / 0) -- because the
// maguma_* clips are in no state list. 0xec22c8 keeps a u16 state per slot at [enemy+0xcac0 + slot x 2] and puts
// one clip in slot 0 of that slot's lava material, with a timer at [enemy+0xcad0 + slot x 4] += delta x 0.5:
//
//     0 cooled     cool_Loop                                                    (0xec2310)
//     3 heating    maguma_Change -- or maguma_Loop if Loop or End is already in  (0xec2328)   -> 2 past 60
//     2 molten     maguma_Loop                                                  (0xec231c)   -> 1 past 30 x 0x6f62c
//     1 cooling    maguma_End                                                   (0xec2374)   -> 0 past 180
//
// 60 and 180 on a half-rate timer are exactly maguma_Change's 120 frames and maguma_End's 360, so "the clip has
// run" is the ROM's own test. The part groups follow the same state (0xec1cec: a slot's state 0 draws its cooled
// group, anything else its heated one), so the viewer's stand-in for "this slot is heated" is the lava part drawn
// -- `on: 'drawn'` -- which the Heated control already decides. Not modelled: the molten state cooling on its own
// timer (the viewer holds it while Heated is on), and the parts following the 360-frame cool-down (they go with
// the toggle, as Valstrax's do).
export const ROM_STAGE_CLIPS = {
  em027_00: { mats: ['XfBAN_W_0__m01_effect01', 'XfBAN_W_0__m02_effect02', 'XfB__m03_Bombmode'],
              clips: ['Effect_Start', 'Effect_Loop', 'Effect_End'] },
  em049_00: ['XfB_0__m01_lav01', 'XfB_0__m02_lav02', 'XfB_0__m03_lav03', 'XfB_0__m04_lav04', 'XfB_0__m05_lav05',
             'XfB_0__m06_lav06']
    .map(mat => ({ mats: [mat], clips: ['maguma_Change', 'maguma_Loop', 'maguma_End'], rest: 'cool_Loop',
                   on: 'drawn', settle: 'rest', reheat: 'loop' })),
  em086_00: ['XfBA_E1__m01_black', 'XfB_W_0__m02_angry', 'XfB_N__EW_0__m03_eff', 'XfB_0__m05_eye']
    .map(mat => ({ mats: [mat], clips: ['start', 'Loop', 'end'], rest: 'auto' })),
};
const stageTables = monId => {
  const t = monId && ROM_STAGE_CLIPS[monId];
  return !t ? [] : Array.isArray(t) ? t : [t];
};
// One step of each of the monster's machines for this root: `[{ mats, clip, t0, rest }]` -- the clip in
// the machine's slot (null until the first rage) and the wall second its time was zeroed -- or null where
// the monster has no table. A machine advances only when the clock moves forward: the review shot and the
// fallback console toggle call the stepper on clocks of their own, and those must not move the game's
// stage -- they are shown the slot as it stood at the machine's last step, its origin moved onto their
// clock.
function stepStageMachine(root, tSec, state, monId){
  const tbls = stageTables(monId);
  if (!tbls.length || !root || !root.userData) return null;
  let all = root.userData.romStage;
  if (!all || all.monId !== monId)
    all = root.userData.romStage = { monId, list: tbls.map(tbl => newStageMachine(root, tbl)) };
  return all.list.map(s => stepOneStage(s, tSec, state, root));
}
// `on: 'drawn'`: the machine's materials are on a part the part table draws (a part it does not mention is drawn).
// The parts carrying them are found once per machine.
function matsDrawn(root, s){
  if (!s.parts){
    s.parts = new Set();
    root.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh) || o.userData.proxy) return;
      if (matsOfMesh(o).some(m => m && s.mats.indexOf(m.name) >= 0)) s.parts.add(o.userData.part);
    });
  }
  const drawn = root.userData && root.userData.partsDrawn;
  if (!drawn) return s.parts.size > 0;
  for (const p of s.parts) if (drawn.get(p) !== false) return true;
  return false;
}
function newStageMachine(root, tbl){
  const s = { tbl, mats: tbl.mats, rest: tbl.rest || null, stage: 0, clip: null, t0: 0, tLast: -Infinity, frames: {} };
  // each clip's frame count, off the first cached material carrying it (0xe102c4 tries +0x14, +0x18, +0x1c)
  for (const nm of tbl.clips){
    for (const mat of tbl.mats){
      let f = 0;
      root.traverse(o => {
        for (const m of matsOfMesh(o)){
          if (f || !m || m.name !== mat) continue;
          const c = ((m.userData && m.userData.rom && m.userData.rom.anim) || []).find(x => sameClip(x.name, nm));
          if (c) f = c.frames;
        }
      });
      if (f){ s.frames[nm] = f; break; }
    }
  }
  return s;
}
function stepOneStage(s, tSec, state, root){
  if (!(tSec >= s.tLast)) return { mats: s.mats, rest: s.rest, clip: s.clip, t0: tSec - (s.tLast - s.t0) };
  s.tLast = tSec;
  const ran = () => (tSec - s.t0) * MAT_FPS >= (s.frames[s.clip] || 0);
  const set = (i, stage) => { s.clip = s.tbl.clips[i]; s.t0 = tSec; s.stage = stage; };
  const on = s.tbl.on === 'drawn' ? matsDrawn(root, s) : state === 'enraged';
  if (s.stage === 0){ if (on) set(0, 1); }
  else if (s.stage === 1){ if (ran()) set(1, 2); }
  else if (s.stage === 2){ if (!on) set(2, 3); }
  // back on while the end runs: Agnaktor goes straight to the loop (`reheat: 'loop'`, 0xec2328)
  else if (on && s.tbl.reheat === 'loop') set(1, 2);
  else if (ran()){
    s.stage = 0;
    // the end's last frame is held (Teostra, Valstrax), or the rest clip takes the slot (`settle: 'rest'`)
    if (s.tbl.settle === 'rest') s.clip = null;
  }
  return s;
}

// ALATREON'S FORMS ARE ITS GLOW LAYER'S CLIPS, run by its own machine. Raven, 2026-09-13: "we also don't have
// Dragon and Ice Forms (Thunder Form?)". uEm050_00's 0xecd5fc walks a stage byte at [enemy+0xcaf8] over the
// material it fetches by MRL id 0x35 -- XfB__m03_add, the only animated material on the monster -- in slot 0:
//
//     0   red, steady      the status byte [[enemy+0x1428]+0x1bb] reaches 2   -> red_End
//     2   waits out red_End's frames                                          -> 4: blue_Change
//     5   waits out blue_Change                                               -> blue_Loop, 6
//     6   blue, steady     the status byte leaves 2                           -> blue_End
//     8   waits out blue_End                                                  -> 10: red_Change
//     11  waits out red_Change                                                -> red_Loop, 0
//
// It spawns red: red_Loop is the material's auto clip and nothing clears it. The status byte is read nowhere
// else on this path and no part group changes with it, so the form is the glow's colour alone. A transition
// once begun runs to its end before the byte is looked at again, which the machine below keeps. The rung names
// are Raven's, 2026-09-13: "Form: Fire/Dragon, Thunder/Ice" -- red is Fire/Dragon, blue is Thunder/Ice
// (part-review `levels.rungs` wins where given).
export const ROM_FORM_CLIPS = {
  em050_00: { name: 'Form', rungs: ['Fire/Dragon', 'Thunder/Ice'], mats: ['XfB__m03_add'],
              forms: [{ start: 'red_Change', loop: 'red_Loop', end: 'red_End' },
                      { start: 'blue_Change', loop: 'blue_Loop', end: 'blue_End' }] },
};
export function romFormsOf(monId){ return (monId && ROM_FORM_CLIPS[monId]) || null; }
const FORM_CLIP = /^#form(\d+)$/;
// One step of the form machine for this root, in the same `{ mats, clip, t0, rest }` shape as a stage machine
// so the picker reads it the same way; `clip` null is the spawn, where the auto clip (red_Loop) plays.
function stepFormMachine(root, tSec, want, monId){
  const tbl = monId && ROM_FORM_CLIPS[monId];
  if (!tbl || !root || !root.userData) return null;
  let s = root.userData.romForm;
  if (!s || s.monId !== monId){
    const frames = {};
    for (const f of tbl.forms) for (const nm of [f.start, f.loop, f.end]){
      root.traverse(o => {
        for (const m of matsOfMesh(o)){
          if (frames[nm] || !m || tbl.mats.indexOf(m.name) < 0) continue;
          const c = ((m.userData && m.userData.rom && m.userData.rom.anim) || []).find(x => sameClip(x.name, nm));
          if (c) frames[nm] = c.frames;
        }
      });
    }
    s = root.userData.romForm = { monId, mats: tbl.mats, rest: 'auto', form: 0, target: 0, phase: 'loop',
                                  clip: null, t0: 0, tLast: -Infinity, frames };
  }
  if (!(tSec >= s.tLast)) return { mats: s.mats, rest: s.rest, clip: s.clip, t0: tSec - (s.tLast - s.t0) };
  s.tLast = tSec;
  const f = tbl.forms;
  const wanted = Math.max(0, Math.min(f.length - 1, want | 0));
  const ran = () => (tSec - s.t0) * MAT_FPS >= (s.frames[s.clip] || 0);
  const set = (clip, phase) => { s.clip = clip; s.t0 = tSec; s.phase = phase; };
  if (s.phase === 'loop'){ if (wanted !== s.form){ s.target = wanted; set(f[s.form].end, 'end'); } }
  else if (s.phase === 'end'){ if (ran()){ s.form = s.target; set(f[s.form].start, 'start'); } }
  else if (s.phase === 'start'){ if (ran()) set(f[s.form].loop, 'loop'); }
  return s;
}

// KECHA WACHA FOLDS ITS EARS WHILE ENRAGED, AND NO CLIP OR MESH DOES IT -- its class writes the ear joints
// over whatever clip is playing. Raven, 2026-09-13: "Can you look at Kecha Wacha L2, M66 ... I want to see if
// we can somehow replicate the enraged ear folding." Every motion list is full-body and L2 Motion[66] ends
// with the ears back at rest; there is no folded-ear part either. What folds them is uEm065_00's virtual
// +0x2a0 (0xf559b4). It keeps a weight at [enemy+0xcac0]+0x20 -- set to 1.0 while the enrage predicate
// 0x81670 holds, otherwise falling by 0.08 x the frame delta ([enemy+0x1c]) to 0 -- and while the weight is
// above 0 calls 0xf55a88, which reads each ear root through vtable +0xd8, blends it and writes it back
// through 0x7237c, after the pose:
//
//     joint 132   local = lerp(clip, fold, w)   fold = a +90 deg turn about X, translation x +38.4 with the
//                                               clip's own y and z (0xf55b78..0xf55de8)
//     joint 134   the same with x -38.4 (0xf55e9c..0xf560b8) -- a turn about X is unchanged by the mirror
//     both        scale (joint +0x70) = (1, 1, 1) + w x (0.2, 0.1, 0.1); +0x70 is the slot the joint reset
//                 at 0x94b120 fills with MtVector3 one, so the base is 1
//
// The lerp is the ROM's own, element by element over the 4x4, so at w = 1 the fold replaces the clip's ear
// roots outright and the tips (133, 135) ride on them. At rest those roots sit about 100 deg about +-Y, over
// the face; the fold is 133 deg from that. The scale goes on the "_s" leaf, where MT's joint scale reaches
// the mesh without passing to the tips (see pose.js).
// THE DIRECTION IS THE GAME'S OWN POSE: Kecha Wacha's L0 Motion[19] carries joint 132 through a +90 deg turn
// about X to within 0.4 deg (its key 60), and no clip in any list comes within 40 deg of the -90 deg turn.
// NOT MODELLED: while the value at [enemy+0x4b4] (0xb0944) is 0x13, 0x28 or 0x50f the weight is left where
// it is instead of being set to 1. Read as a motion number, list x 256 + index, those are L0 Motion[19] --
// the clip above, which folds the ears itself -- L0 Motion[40], which ships no clip, and L5 Motion[15]; that
// reading fits but is not confirmed, so the viewer's clip is not tied to it. The frame delta is taken at the
// viewer's 60 frames a second; the ROM's unit for [enemy+0x1c] is not read, so the 0.08 release (about 12
// frames) is the one approximate number here. __earFold(false) turns it off for comparison.
export const ROM_EAR_FOLD = {
  em065_00: { joints: [{ gid: 132, x: 0.384 }, { gid: 134, x: -0.384 }], scale: [0.2, 0.1, 0.1], decay: 0.08 },
};
const EAR_FOLD_FPS = 60;
let earFoldOn = true;
const _ef = { cur: new THREE.Matrix4(), fold: new THREE.Matrix4(), p: new THREE.Vector3(),
              one: new THREE.Vector3(1, 1, 1),
              q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2) };
// Call right after the pose driver has written the frame. Returns the number of joints it wrote.
export function stepEarFold(roots, monId, enraged, tSec){
  const t = monId && ROM_EAR_FOLD[monId];
  if (!t) return 0;
  let n = 0;
  for (const root of roots || []){
    if (!root || !root.userData) continue;
    let st = root.userData.earFold;
    if (!st || st.monId !== monId) st = root.userData.earFold = { monId, w: 0, tLast: tSec };
    const frames = Math.max(0, (tSec - st.tLast) * EAR_FOLD_FPS);
    st.tLast = tSec;
    if (enraged) st.w = 1;
    else if (st.w > 0) st.w = Math.max(0, st.w - t.decay * frames);
    if (!earFoldOn || !(st.w > 0)) continue;
    const w = Math.min(st.w, 1);
    for (const b of gidBonesOf(root)){
      const j = t.joints.find(x => x.gid === b.gid);
      if (!j) continue;
      const node = b.node;
      _ef.cur.compose(node.position, node.quaternion, node.scale);
      _ef.fold.compose(_ef.p.set(j.x, node.position.y, node.position.z), _ef.q, _ef.one);
      const ce = _ef.cur.elements, fe = _ef.fold.elements;
      for (let i = 0; i < 16; i++) ce[i] = fe[i] * w + ce[i] * (1 - w);
      _ef.cur.decompose(node.position, node.quaternion, node.scale);
      if (b.leaf) b.leaf.scale.set(1 + t.scale[0] * w, 1 + t.scale[1] * w, 1 + t.scale[2] * w);
      n++;
    }
  }
  return n;
}
export function setEarFold(on){ earFoldOn = !!on; return earFoldOn; }
if (typeof window !== 'undefined'){
  window.__earFold = (on) => on === undefined ? earFoldOn : setEarFold(on);
}

// TETSUCABRA'S TAIL SWELLS ON TWO JOINTS, AND THE PART SWITCH IS ONLY HALF OF IT. Raven, 2026-09-14: "The part
// change functions, but we also need to scale it up to cover the spikey parts of the normal tail state", then
// "How it is handled in game is in the ROM", "Check enrage state code for Tetsu".
//
// The swollen state is status bit 1 of [enemy+0x1428]+0x1bb. The frame 0xf636a4 turns it into the part switch
// (clear: group 12, the dark m01_tail plates; set: group 13, plates off). The same action handler that sets the
// bit (0xf57f8c, at the start of the actions that swell, with a 60.0 or 1.0 timer at record+4) also sets a swell
// state at record+8 of [enemy+0xcac0] to 1 (0xf58cfc), and clearing the bit steps a state of 1 on to 2 (0xf58d50).
// uEm066_00's post-pose virtual +0x2a0 (0xf639f4 -- the slot Kecha Wacha folds its ears in) runs that state on
// joints 203 and 202, found by NUMBER through the joint map ([enemy+0x498] bytes +0xcb / +0xca), and writes each
// one's scale (+0x70) through 0x94a834. Per frame-delta unit ([enemy+0x1c]):
//
//     0 rest        203 = 202 = (1, 1, 1), the engine's one vector (the joint reset at 0x94b120 uses it too)
//     1 swell       203: x + 0.12 up to 1.6, y and z + 0.08 up to 1.4      202: each axis - 0.14 down to 0.3
//     2 deflate     203: x - 0.06, y and z - 0.04, down to 1               202: each axis + 0.09 up to 1.2
//                   -> 3 once all six have arrived
//     3 settle      202: each axis - 0.04 down to 1                         -> 0 once all three have arrived
//
// What those joints carry, from the model: 203 binds the pale spotted skin (.mod mesh 21, 80v, lying exactly under
// the plates, mesh 31) and the spikes' roots; 202 binds only the spike tips (19 vertices out to radius 0.90 against
// the skin's 0.66). So the skin inflates to 1.6 x 1.4 x 1.4 while the tips pull in to 0.3 -- the spikes vanish into
// the swollen tail -- and on the way down the tips spring out to 1.2 before settling. Drilltusk runs the same class
// (only uEm066_00 registers) on a model with the same joint numbers, so it takes the same machine.
//
// The viewer has no status bit, so the Tail row's own part decision stands for it: part 2 (the plates) off is the
// bit set. Frame units are taken at 60 a second, as the ear fold's are; the ROM's unit for [enemy+0x1c] is not
// read, so the ramp's speed is the one approximate number here. __tailSwell(false) leaves both joints at 1.
export const ROM_TAIL_SWELL = { em066_00: { plates: 2 }, em066_04: { plates: 2 } };
const TAIL_SWELL_FPS = 60;
let tailSwellOn = true;
// Call right after the pose driver has written the frame, like stepEarFold. Returns the joints it wrote.
export function stepTailSwell(roots, monId, tSec){
  const t = monId && ROM_TAIL_SWELL[monId];
  if (!t) return 0;
  let n = 0;
  for (const root of roots || []){
    if (!root || !root.userData) continue;
    let s = root.userData.tailSwell;
    if (!s || s.monId !== monId)
      s = root.userData.tailSwell = { monId, state: 0, skin: [1, 1, 1], tips: [1, 1, 1], swollen: false, tLast: tSec };
    const drawn = root.userData.partsDrawn;
    const swollen = !!(tailSwellOn && drawn && drawn.get(t.plates) === false);
    if (swollen && !s.swollen) s.state = 1;
    else if (!swollen && s.swollen && s.state === 1) s.state = 2;
    s.swollen = swollen;
    const f = Math.max(0, (tSec - s.tLast) * TAIL_SWELL_FPS);
    s.tLast = tSec;
    const a = s.skin, b = s.tips;
    if (!tailSwellOn){ s.state = 0; a.fill(1); b.fill(1); }
    if (s.state === 0){ a.fill(1); b.fill(1); }
    else if (s.state === 1){
      a[0] = Math.min(a[0] + 0.12 * f, 1.6); a[1] = Math.min(a[1] + 0.08 * f, 1.4); a[2] = Math.min(a[2] + 0.08 * f, 1.4);
      for (let i = 0; i < 3; i++) b[i] = Math.max(b[i] - 0.14 * f, 0.3);
    } else if (s.state === 2){
      a[0] = Math.max(a[0] - 0.06 * f, 1); a[1] = Math.max(a[1] - 0.04 * f, 1); a[2] = Math.max(a[2] - 0.04 * f, 1);
      for (let i = 0; i < 3; i++) b[i] = Math.min(b[i] + 0.09 * f, 1.2);
      if (a.every(v => v === 1) && b.every(v => v === 1.2)) s.state = 3;
    } else if (s.state === 3){
      for (let i = 0; i < 3; i++) b[i] = Math.max(b[i] - 0.04 * f, 1);
      if (b.every(v => v === 1)) s.state = 0;
    }
    for (const bone of gidBonesOf(root)){
      const v = bone.gid === 203 ? a : bone.gid === 202 ? b : null;
      if (!v) continue;
      (bone.leaf || bone.node).scale.set(v[0], v[1], v[2]);
      n++;
    }
  }
  return n;
}
export function setTailSwell(on){ tailSwellOn = !!on; return tailSwellOn; }
if (typeof window !== 'undefined'){
  // readback: { on, state, skin: joint 203's scale, tips: joint 202's scale } for the mounted monster
  window.__tailSwell = (on) => {
    if (on !== undefined) setTailSwell(on);
    const root = window.__view && window.__view.mounted && window.__view.mounted.main;
    const s = root && root.userData && root.userData.tailSwell;
    return { on: tailSwellOn, state: s ? s.state : null, skin: s ? s.skin.slice() : null, tips: s ? s.tips.slice() : null };
  };
}

// SEREGIOS SWINGS ITS HORN FORWARD WHILE ENRAGED. No part or clip does this: its class writes the horn joint over
// the clip. Raven, 2026-09-16: "The main horn needs to move forward when enraged, we have a part of the horn moving
// forward." The part that already moved is the Snout row's enraged mesh (part 3 -> 4). The horn itself is part 110
// (90v, on the Head row in both states), and it rides joint 200.
//
// uEm077_00 overrides uModel's slot 19 (vtable +0x4c, 0xfe0164). The enemy base (0xad6c0..0xad6e0) runs the motion
// (0x94e1a0), then slot 19, then slot 20 (0x94b288). Slot 20 builds each joint's matrix from its rotation +0x60
// (x, y, z, w), scale +0x70 and translation +0x80 (0x94b7ec), so a slot-19 write is drawn in the same frame. After
// the base slot 19 (0x94b25c), the override finds joint 200 through the joint map ([enemy+0x498] byte +0xc8, joint =
// [enemy+0x494] + index x 0xa0). While a timer at [enemy+0xcac0]+0x50 is above 0, it writes that joint's rotation
// through 0x94a810:
//
//     q = normalise((1 - t) x captured + t x (0, 0, 0, 1))     t = timer x 0.166667 (0xfe01d8)
//
// The identity's sign is flipped when its dot with `captured` is negative (0xfe0218). (0, 0, 0, 1) is the constant
// at 0x019178d0: the static initialiser at 0x7c4970 writes 0.0 to x, y and z and 1.0 to w.
// The class's per-frame virtual +0x1dc (slot 119, 0xfdae58) keeps the timer and the captured rotation:
//
//     enraged (0x81670: [enemy+0x1428]+0x518 == 1)
//         timer <= 0: copy joint 200's rotation (+0x60..+0x6c) to [enemy+0xcac0]+0x30..+0x3c, and call 0x4ef0ac
//                     with 0xe2 (likely an effect -- not modelled here)
//         timer = min(timer + 1.0 x dt, 6.0)            0x7264c -> 0x539d48, cap at 0xfdaf24..0xfdaf3c
//     otherwise
//         timer = max(timer - 1.0 x dt, 0)              0x7206c -> 0x539d5c
//
// So on rage the horn turns from the clip's rotation to the joint's bind rotation over 6 units of dt. When rage
// ends it turns back over 6, and after that the clip has the joint again. Every Seregios motion carries a local-
// rotation track on joint 200 (read from the .lmt headers). Most hold it constant at -82.5 deg about X
// (-0.659, 0, 0, 0.752). L2 Motion[24] and [68] hold 84.7 deg. L0 Motion[4] and L2 Motion[21] animate it
// between 64.5 and 82.5, and L2 Motion[58] between 90 and 94.4. So the enraged turn is about 82.5 deg.
// Joint 200 also carries some vertices of other parts: 60 of part 0's 2116 (the body mesh, drawn in every state),
// parts 3 / 4 (the snout, calm and enraged), part 42 (the broken head), and the proxy parts 100 and 108.
//
// NOT MODELLED, from the same function: while [enemy+0xcac0]+0x84 is set, joints 162, 163 and 164 are held at a
// scale of at least (1, 1, 1) (0xfe02c8..0xfe0474, MtVector3 one at 0x019176c0). The enraged body and head meshes
// (parts 10, 39, 44, and the proxy part 102) ride those joints. Clips in lists 0-2 scale them below 1: down to 0.01,
// and to negative values in list 0. The flag is slot 170's
// (0xfddc2c -> 0xfddcc4): the enrage predicate, but false during actions (3, 8) and (4, 9) (bytes +0x73e0 /
// +0x73e1, and +0x73e2 / +0x73e3 when +0x73e4 is set), and a check at 0xb0968 during action (1, 9). The viewer
// has no action state.
// Frame units are taken at 60 a second, as the ear fold's are. The ROM's unit for dt ([enemy+0x1c],
// cUnit::mDeltaTime) is not read. __hornRaise(false) leaves the joint to the clip.
export const ROM_HORN_RAISE = { em077_00: { gid: 200, ramp: 6 } };
const HORN_RAISE_FPS = 60;
let hornRaiseOn = true;
// Call right after the pose driver has written the frame, like stepEarFold. Returns the joints it wrote.
export function stepHornRaise(roots, monId, enraged, tSec){
  const t = monId && ROM_HORN_RAISE[monId];
  if (!t) return 0;
  let n = 0;
  for (const root of roots || []){
    if (!root || !root.userData) continue;
    const b = gidBonesOf(root).find(x => x.gid === t.gid);
    if (!b) continue;
    let s = root.userData.hornRaise;
    if (!s || s.monId !== monId)
      s = root.userData.hornRaise = { monId, timer: 0, captured: new THREE.Quaternion(), tLast: tSec };
    const f = Math.max(0, (tSec - s.tLast) * HORN_RAISE_FPS);
    s.tLast = tSec;
    const q = b.node.quaternion;
    // the pose driver has just written the clip's rotation, so this is the value the ROM copies
    if (enraged){
      if (!(s.timer > 0)) s.captured.copy(q);
      s.timer = Math.min(s.timer + f, t.ramp);
    } else s.timer = Math.max(s.timer - f, 0);
    if (!hornRaiseOn || !(s.timer > 0)) continue;
    const w = s.timer / t.ramp, c = s.captured;
    const id = c.w < 0 ? -1 : 1;                 // dot(captured, (0, 0, 0, 1)) is captured.w
    q.set((1 - w) * c.x, (1 - w) * c.y, (1 - w) * c.z, (1 - w) * c.w + w * id).normalize();
    n++;
  }
  return n;
}
export function setHornRaise(on){ hornRaiseOn = !!on; return hornRaiseOn; }
if (typeof window !== 'undefined'){
  // readback: { on, timer, captured: [x, y, z, w], joint: joint 200's rotation now } for the mounted monster
  window.__hornRaise = (on) => {
    if (on !== undefined) setHornRaise(on);
    const root = window.__view && window.__view.mounted && window.__view.mounted.main;
    const s = root && root.userData && root.userData.hornRaise;
    const b = root && gidBonesOf(root).find(x => x.gid === 200);
    return { on: hornRaiseOn, timer: s ? s.timer : null, captured: s ? s.captured.toArray() : null,
             joint: b ? b.node.quaternion.toArray() : null };
  };
}
// RAJANG'S FUR STANDS UP, and ARMOR MODE PUMPS ITS ARMS. Raven, 2026-09-19: "Enraged states are not displaying
// the raised fur I expect." No mesh or clip raises it: the enraged fur (part 3, XfBAN__E1__m02_hair_a) is the calm
// fur's size to within a few centimetres, and the clips hold the joints below at scale 1. uEm023_00 overrides +0x2a0
// with 0xde2e08, which writes them after the motion, every frame:
//  - while the enrage predicate (0x81670) holds, joint 150's scale is (7, 11, 1) and a timer at [+0xcac0]+0x10 is
//    set to 30. Out of rage the timer runs down by dt (0x7206c, floor 0) and the scale follows it, (7t, 11t, 1)
//    with t = timer / 30, written on the frame it reaches 0 as well; after that the class writes nothing and the
//    clip's own scale is back. Joint 150 hangs off the chest (gid 2) at (0, -0.65, 0.33) and carries part of both
//    furs' skin (5.4 of weight on each, dominating no vertex), so the scale lifts the fur rather than moving a piece.
//  - in Armor Mode, the mode byte [+0xcac0]+4 (skipped while the action is 0x218; the viewer has no action state):
//    joint 152's scale is (4, 2, 2), 155 and 156 take (6, 1, 2), and 153 and 154 keep the clip's rotation -- vtable
//    +0xd8 (0x539e60) hands back the joint's local rotation and translation, and 0x7237c writes them back -- with the
//    translation replaced by (30, 40, 0) and (-30, 40, 0) and scale (1, 2, 1.5). The ROM's units are centimetres;
//    the glb's joints are metres (Rajang's upper arm sits 0.17, 0.25, 1.0 off the chest).
// Furious Rajang (em023_05) runs the same class: the registry has no uEm023_05, and 0xde2e08 has no variant test.
// Frame units are taken at 60 a second, as the other class writes here take them. Where no clip drives the joints
// (the bind pose) nothing puts them back between frames, so a joint this lets go of is returned to the value it had
// before the first write. __rageFur(false) leaves the joints to the clip.
export const ROM_RAGE_FUR = { em023_00: { armorLevel: 2 }, em023_05: { armorLevel: 1 } };
const RAGE_FUR = { gid: 150, scale: [7, 11, 1], timer: 30 };
const ARMOR_FUR = [
  { gid: 152, scale: [4, 2, 2] },
  { gid: 155, scale: [6, 1, 2] },
  { gid: 156, scale: [6, 1, 2] },
  { gid: 153, scale: [1, 2, 1.5], pos: [0.30, 0.40, 0] },
  { gid: 154, scale: [1, 2, 1.5], pos: [-0.30, 0.40, 0] },
];
const RAGE_FUR_FPS = 60;
let rageFurOn = true;
// Call right after the pose driver has written the frame, like stepHornRaise. `driven`: a clip is playing, so the
// driver rewrites these joints every frame. Returns the joints it wrote.
export function stepRageFur(roots, monId, enraged, level, tSec, driven){
  const t = monId && ROM_RAGE_FUR[monId];
  if (!t) return 0;
  let n = 0;
  for (const root of roots || []){
    if (!root || !root.userData) continue;
    let s = root.userData.rageFur;
    if (!s || s.monId !== monId) s = root.userData.rageFur = { monId, timer: 0, tLast: tSec, saved: new Map() };
    const f = Math.max(0, (tSec - s.tLast) * RAGE_FUR_FPS);
    s.tLast = tSec;
    const writes = new Map();                       // gid -> { scale, pos? } this frame
    if (rageFurOn){
      if (enraged){ s.timer = RAGE_FUR.timer; writes.set(RAGE_FUR.gid, { scale: RAGE_FUR.scale }); }
      else if (s.timer > 0){
        s.timer = Math.max(0, s.timer - f);
        const k = s.timer / RAGE_FUR.timer;
        writes.set(RAGE_FUR.gid, { scale: [RAGE_FUR.scale[0] * k, RAGE_FUR.scale[1] * k, RAGE_FUR.scale[2]] });
      }
      if ((level | 0) === t.armorLevel) for (const j of ARMOR_FUR) writes.set(j.gid, j);
    } else s.timer = 0;
    for (const b of gidBonesOf(root)){
      const w = writes.get(b.gid), target = b.leaf || b.node;
      if (w){
        if (!s.saved.has(b.gid)) s.saved.set(b.gid, { scale: target.scale.clone(), pos: b.node.position.clone() });
        target.scale.set(w.scale[0], w.scale[1], w.scale[2]);
        if (w.pos) b.node.position.set(w.pos[0], w.pos[1], w.pos[2]);
        n++;
      } else if (s.saved.has(b.gid)){
        // let go: a clip rewrites the joint next frame anyway; the bind pose needs it put back
        if (!driven){ const v = s.saved.get(b.gid); target.scale.copy(v.scale); b.node.position.copy(v.pos); }
        s.saved.delete(b.gid);
      }
    }
    if (driven) s.saved.clear();    // a playing clip's values go stale by next frame; only the bind pose keeps one
  }
  return n;
}
export function setRageFur(on){ rageFurOn = !!on; return rageFurOn; }
if (typeof window !== 'undefined'){
  // readback: { on, timer, joints: { gid: { scale, pos } } } for the mounted monster's joints 150..156
  window.__rageFur = (on) => {
    if (on !== undefined) setRageFur(on);
    const root = window.__view && window.__view.mounted && window.__view.mounted.main;
    const s = root && root.userData && root.userData.rageFur;
    const joints = {};
    if (root) for (const b of gidBonesOf(root)) if (b.gid >= 150 && b.gid <= 156)
      joints[b.gid] = { scale: (b.leaf || b.node).scale.toArray().map(x => +x.toFixed(3)), pos: b.node.position.toArray().map(x => +x.toFixed(3)) };
    return { on: rageFurOn, timer: s ? +s.timer.toFixed(2) : null, joints };
  };
}
// A GAG: NIBELSNARF'S EYES ON KHEZU. Raven, 2026-09-20: "Can you isolate Nibelsnarfs eyes? So we can add them to a
// different monster?", then "Khezu, keep in mind this is a gag setting" and "We can manually place them since it
// isn't an in game render". Khezu has no eyes of its own; Nibelsnarf's are one rigid piece -- em056_00's Group[0]
// primitive 0, 18 vertices, two eyes of 9, every vertex weighted 100% to its head joint -- so they carry across
// whole. The geometry, the material and the texture are the game's own, lifted out of the shipped model at load
// time; nothing is written into either model and nothing here runs unless the gag is switched on.
//
// WHERE they sit is NOT the game's: it is placed by hand, which is what Raven asked for. `pos` and `scale` are in
// the target joint's own space in model metres, one entry per eye so spacing, size and toe-in are independent
// (each eye is centred on itself, and `scale` 1 is the eye at Nibelsnarf's own size, about 15 cm across). Khezu's
// head joint (gid 2) sits at the base of the snout with an identity bind rotation, so +y runs up the face and +z
// out along the snout; its head is about 1.1 m wide and the snout tip is 1.0 m ahead of the joint.
export const GAG_EYES = {
  // placed by eye against Khezu's own face: at this height its skin is 0.93 forward of the joint, so the eyes sit
  // just proud of it and just above the mouth, turned out a little so both read from the front
  em003_00: { joint: 2, scale: 1.6, eyes: [{ pos: [0.17, 0.05, 0.93], rot: [0, -0.20, 0] },
                                           { pos: [-0.17, 0.05, 0.93], rot: [0, 0.20, 0] }] },
};
const GAG_SRC = { glb: 'models/monsters/em056_00.glb', ref: 'em/056_00', mat: 'XfB_0__m00_eye', group: /^Group0(_|$)/ };
let gagEyesOn = false;
export function setGagEyes(on){ gagEyesOn = !!on; return gagEyesOn; }
export function gagEyesOf(monId){ return (monId && GAG_EYES[monId]) || null; }
// the source piece, split into its two eyes and each centred on itself, built once
let gagGeomPromise = null;
function gagGeometry(){
  if (gagGeomPromise) return gagGeomPromise;
  return (gagGeomPromise = loadGlb(GAG_SRC.glb, GAG_SRC.glb).then(gltf => {
    let src = null;
    gltf.scene.traverse(o => {
      if (src || !o.isMesh) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      let g = o; while (g && !/^Group\d+/.test(g.name || '')) g = g.parent;
      if (m && m.name === GAG_SRC.mat && g && GAG_SRC.group.test(g.name)) src = o;
    });
    if (!src) return null;
    // the piece as it is DRAWN in its own bind pose: one joint holds every vertex, so this is rigid and can be
    // lifted out of the skin entirely. Centred between the eyes, so a placement is about the pair, not one eye.
    src.updateWorldMatrix(true, false);
    const pos = src.geometry.attributes.position, out = new Float32Array(pos.count * 3), v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++){
      v.fromBufferAttribute(pos, i);
      if (src.isSkinnedMesh) src.applyBoneTransform(i, v);
      v.applyMatrix4(src.matrixWorld);
      out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(out, 3));
    for (const k of ['normal', 'uv']) if (src.geometry.attributes[k]) geo.setAttribute(k, src.geometry.attributes[k].clone());
    if (src.geometry.index) geo.setIndex(src.geometry.index.clone());
    // the two eyes are mirrored about the model's centre line, so the sign of x separates them cleanly
    const halves = [1, -1].map(sign => {
      const keep = [];
      for (let i = 0; i < pos.count; i++) if (Math.sign(out[i * 3]) === sign || out[i * 3] === 0) keep.push(i);
      const g = new THREE.BufferGeometry(), idx = new Map();
      for (const k of ['position', 'normal', 'uv']){
        const a = geo.getAttribute(k);
        if (!a) continue;
        const arr = new Float32Array(keep.length * a.itemSize);
        keep.forEach((vi, j) => { idx.set(vi, j); for (let c = 0; c < a.itemSize; c++) arr[j * a.itemSize + c] = a.array[vi * a.itemSize + c]; });
        g.setAttribute(k, new THREE.BufferAttribute(arr, a.itemSize));
      }
      const src3 = geo.index ? geo.index.array : null;
      if (src3){
        const tri = [];
        for (let i = 0; i < src3.length; i += 3){
          const t = [src3[i], src3[i + 1], src3[i + 2]];
          if (t.every(x => idx.has(x))) tri.push(idx.get(t[0]), idx.get(t[1]), idx.get(t[2]));
        }
        g.setIndex(tri);
      }
      g.center();
      return g;
    });
    return halves;
  }).catch(() => null));
}
// Call after a monster is mounted, and whenever the gag is switched. Returns the piece, or null.
export async function mountGagEyes(root, monId){
  if (!root) return null;
  const had = root.userData.gagEyes;
  if (had){
    if (had.parent) had.parent.remove(had);
    had.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    root.userData.gagEyes = null;
  }
  const spec = gagEyesOf(monId);
  if (!gagEyesOn || !spec) return null;
  const geo = await gagGeometry();
  const bone = geo && geo.length && gidBonesOf(root).find(b => b.gid === spec.joint);
  if (!bone) return null;
  const rom = specFor(GAG_SRC.ref, GAG_SRC.mat);
  const mat = createMaterial({ srcName: GAG_SRC.mat, rom, alphaCut: 0, noTint: true,
                               unlit: !!(rom && rom.cls && rom.cls !== 'Std') });
  if (rom && rom.albedo) getTexture(rom.albedo).then(t => { mat.map = applyRomUv(mat, t); mat.needsUpdate = true; });
  const group = new THREE.Group();
  group.name = 'gag-eyes';
  spec.eyes.forEach((e, i) => {
    const m = new THREE.Mesh(geo[Math.min(i, geo.length - 1)].clone(), mat);
    m.name = 'gag-eye-' + i;
    m.position.fromArray(e.pos);
    m.rotation.set((e.rot || [0, 0, 0])[0] || 0, (e.rot || [0, 0, 0])[1] || 0, (e.rot || [0, 0, 0])[2] || 0);
    m.scale.setScalar(e.scale === undefined ? spec.scale : e.scale);
    if (mat.userData.renderOrder) m.renderOrder = mat.userData.renderOrder;
    group.add(m);
  });
  bone.node.add(group);
  root.userData.gagEyes = group;
  return group;
}
if (typeof window !== 'undefined'){
  // readback, and the knobs for placing them by eye: __gagEyes() reports, __gagEyes({pos, rot, scale}) moves them
  window.__gagEyes = (set) => {
    const root = window.__view && window.__view.mounted && window.__view.mounted.main;
    const eyes = root && root.userData.gagEyes;
    const spec = gagEyesOf(window.__view && window.__view.state && window.__view.state.id);
    if (set && spec){
      // __gagEyes({ scale }) resizes both; __gagEyes({ eyes: [{pos, rot, scale}, ...] }) places them one at a time
      if (set.scale !== undefined) spec.scale = set.scale;
      if (Array.isArray(set.eyes)) set.eyes.forEach((e, i) => { if (spec.eyes[i]) Object.assign(spec.eyes[i], e); });
      if (eyes) spec.eyes.forEach((e, i) => { const m = eyes.children[i]; if (!m) return;
        m.position.fromArray(e.pos); m.rotation.set((e.rot || [0, 0, 0])[0] || 0, (e.rot || [0, 0, 0])[1] || 0, (e.rot || [0, 0, 0])[2] || 0);
        m.scale.setScalar(e.scale === undefined ? spec.scale : e.scale); });
    }
    return { on: gagEyesOn, mounted: !!eyes, spec: spec ? JSON.parse(JSON.stringify(spec)) : null };
  };
}
// The clip a monster's LEVEL rung names, or undefined where no table says (the caller then falls back
// to the Rage ladder). A rung past the table's end takes its last entry.
export function levelClipFor(monId, level){
  // a monster whose rungs are its FORMS hands the rung to the form machine (ROM_FORM_CLIPS)
  if (monId && ROM_FORM_CLIPS[monId]) return '#form' + Math.max(0, level | 0);
  const t = monId && ROM_CLIP_LADDER[monId];
  if (!t || !Array.isArray(t.byLevel) || !t.byLevel.length) return undefined;
  return t.byLevel[Math.max(0, Math.min(t.byLevel.length - 1, level | 0))];
}
// `#N` as a rung's clip means "the clip at INDEX N" -- the way the ROM addresses these. The clip
// array here is the material's `rom.anim`, which build-matanim.py fills in .mrl file order, so N
// is the same N the ROM passes to setMatClip.
const INDEX_CLIP = /^#(\d+)$/;
function ladderIndexMat(monId, matName){
  const t = monId && ROM_CLIP_LADDER[monId];
  return !!(t && typeof matName === 'string' && t.mats.indexOf(matName) >= 0);
}
// [{ rank, label, clip }] ordered shallowest first, or [] when this monster has no ladder.
// MAX sorts last whatever number it sits beside.
export function rageLadder(root){
  const seen = new Map();
  if (root) root.traverse(o => {
    for (const m of matsOfMesh(o)){
      const rom = m && m.userData && m.userData.rom;
      for (const c of (rom && rom.anim) || []){
        const lv = levelsOf(c.name);
        if (lv.length !== 1) continue;                 // 0 = not a level, 2 = a transition
        const tok = lv[0];
        if (!seen.has(tok)) seen.set(tok, c.name);
      }
    }
  });
  const rank = t => (t === 'max' ? 1e6 : parseInt(t, 10));
  const out = [...seen.entries()]
    .map(([tok, clip]) => ({ rank: rank(tok), label: tok === 'max' ? 'Max' : 'Level ' + tok, clip }))
    .sort((a, b) => a.rank - b.rank);
  // The index-addressed ladder, for a monster whose clips cannot be matched by name at all. Only
  // when the names yielded nothing, so a name-derived ladder can never be displaced by the table.
  const monId = root && root.userData && root.userData.monId;
  const tbl = (monId && ROM_CLIP_LADDER[monId]) || null;
  // a table keyed by the LEVEL axis is not a Rage ladder, and offers no rungs here
  if (tbl && Array.isArray(tbl.rungs) && !out.length)
    return tbl.rungs.map((r, i) => ({ rank: i, label: r.label, clip: r.clip }));
  return out;
}
// The PART IDS whose meshes carry the ladder material. Raven, 2026-09-10: "For the rage levels have
// it switch the parts that need to be on for the effect to show" -- so choosing a rung turns its
// geometry on and No Rage turns it back off, which is what lets the panel default match the
// screenshot he asked for while the effect still appears when a rung is picked.
export function rageLadderParts(root){
  const mats = new Set();
  if (root) root.traverse(o => {
    for (const m of matsOfMesh(o)){
      const rom = m && m.userData && m.userData.rom;
      for (const c of (rom && rom.anim) || [])
        if (levelsOf(c.name).length === 1) mats.add(m.name);
    }
  });
  const out = new Set();
  if (root) root.traverse(o => {
    if (!o.userData || o.userData.part === undefined) return;
    for (const m of matsOfMesh(o)) if (m && mats.has(m.name)) out.add(o.userData.part);
  });
  return [...out];
}
// Materials that carry an enraged clip -- the layers the game lights when a monster rages -- and the ones
// a monster's own stage machine lights on rage (ROM_STAGE_CLIPS), whose clips carry no enrage name.
export function enrageMaterials(root){
  const out = materialsWithClip(root, ENRAGE_CLIPS);
  for (const tbl of stageTables(root && root.userData && root.userData.monId)){
    if (tbl.on) continue;                        // a machine on something other than rage (Agnaktor's heat)
    root.traverse(o => { for (const m of matsOfMesh(o)) if (m && tbl.mats.indexOf(m.name) >= 0) out.add(m.name); });
  }
  return out;
}
// Materials that carry a CHARGE clip -- Khezu's Taiden family. Gates the Charged checkbox, which
// is offered only on monsters that have somewhere to put it.
export function chargeMaterials(root){ return materialsWithClip(root, CHARGE_CLIPS); }
// A monster whose CHARGE state swaps a material also has one, even when no mesh currently carries
// a charge clip -- the clips live on the material that gets swapped IN.
export function hasChargeState(root, monId){
  if (STATE_MATERIAL_SWAP[monId] && STATE_MATERIAL_SWAP[monId].charged) return true;
  return chargeMaterials(root).size > 0;
}
// The part ids whose meshes use those materials, so the part table can be asked to open them.
export function enrageParts(root){
  const mats = enrageMaterials(root), out = new Set();
  root.traverse(o => {
    if (!o.userData || o.userData.part === undefined) return;
    for (const m of matsOfMesh(o))
      if (m && mats.has(m.name)) out.add(o.userData.part);
  });
  return out;
}
// THE CLIP-SELECTION POLICY, shared by both evaluators. Which clip plays is the one part of the
// material-animation chain the ROM does NOT hand us: the game reaches a clip through setClip from
// an AI state, keyed by hash, so a viewer has to choose. Keeping it in one place means the ROM core
// and the old path cannot drift on it.
const STATES = ['enraged', 'charged', 'tired'];
// The state's clip table on this monster, or null where the state is scoped to another class.
const stateNames = (st, monId) => {
  const t = STATE_NAMES[st];
  return t && (!t.only || t.only.includes(monId)) ? t : null;
};
function clipPicker(state, monId, tState, prev, levelClip, stage){
  const pin = (monId && ROM_SPAWN_CLIP[monId]) || null;
  const timed = typeof tState === 'number';
  const states = STATES.filter(st => stateNames(st, monId));
  return (clips, rom, tSec) => {
    // A SUPPRESSED clip keeps its slot and loses only its NAME, so every name-matched route below
    // skips it while `auto`, the index ladder and stepMaterialAnim's own indexing are untouched.
    const ban = suppressedFor(monId, rom && rom.name);
    if (ban) clips = clips.map(c =>
      (c && typeof c.name === 'string' && ban.has(c.name.toLowerCase())) ? { ...c, name: null } : c);
    let ci = -1;
    // A MATERIAL THE MONSTER'S OWN STAGE MACHINE DRIVES answers from that machine alone -- see
    // ROM_STAGE_CLIPS: its one clip on the machine's clock, or before the first rage what the spawn left
    // there -- nothing, the material's authored values (Teostra clears its slots), or the load-time auto
    // clip (`rest: 'auto'`, Valstrax clears none).
    const machine = stage && rom && stage.find(s => s.mats.indexOf(rom.name) >= 0);
    if (machine){
      if (!machine.clip){
        if (machine.rest === 'auto') return clips.findIndex(c => c.auto);
        // a NAMED rest clip -- Agnaktor's cool_Loop, the ROM's state 0
        return typeof machine.rest === 'string' ? clips.findIndex(c => sameClip(c.name, machine.rest)) : -1;
      }
      const i = clips.findIndex(c => sameClip(c.name, machine.clip));
      return i >= 0 ? [[i, machine.t0]] : -1;
    }
    // A SPAWN-PINNED material ignores the rage state entirely -- see ROM_SPAWN_CLIP.
    if (pin && rom.name && pin[rom.name])
      ci = clips.findIndex(c => sameClip(c.name, pin[rom.name]));
    // A LEVEL PICKED BY HAND wins over every rule below, on the material that carries it. See
    // rageLadder: the ladder monsters have more stages than a toggle can say, so the panel asks for
    // one by name. Materials that do not carry it fall through and behave as the state says, which
    // is what keeps the rest of the monster in step with the level.
    if (ci < 0 && levelClip){
      // '#none' is the ROM's clearAllSlots (0xb09a3c) on the table's materials: nothing plays and the
      // material shows its own authored values. Returned outright, because the fallbacks below would
      // otherwise hand these materials their first looping clip -- green at Uncharged.
      if (levelClip === '#none'){
        if (ladderIndexMat(monId, rom.name)) return -1;
      }
      const byIdx = INDEX_CLIP.exec(levelClip);
      if (byIdx){
        // ROM_CLIP_LADDER: the rung names a clip INDEX. Applied ONLY to the materials that table
        // lists, so every other material on the monster falls through and keeps behaving as its
        // own clips say -- Boltreaver's XfB__A1_tikuden carries its own auto-play UV scroll and
        // must not be dragged onto a charge colour.
        const i = +byIdx[1];
        if (ladderIndexMat(monId, rom.name) && i >= 0 && i < clips.length) return i;
      } else {
        const i = clips.findIndex(c => sameClip(c.name, levelClip));
        if (i >= 0) return i;
      }
    }
    // THE STATE TABLE, run before the name lists below. It only decides when the material carries
    // the clips the state names; everything it does not decide falls through to the general rules,
    // which is why monsters with no entry -- Bloodbath's rage ladder, Agnaktor's cool_Loop -- are
    // untouched by it.
    if (ci < 0 && timed && stateNames(state, monId)){
      const byName = list => {
        for (const nm of list || []){
          const i = clips.findIndex(c => sameClip(c.name, nm));
          if (i >= 0) return i;
        }
        return -1;
      };
      const byRe = re => clips.findIndex(c => typeof c.name === 'string' && re.test(c.name));
      // THE BASE STATE, and the order matters on real data. A base state is a STATE, so it loops;
      // a *_Change is a transition into one. Two monsters pull in opposite directions and the loop
      // flag is what separates them:
      //
      //   Akantor  m04__kekkan   Normal (1f, loop) vs Angry (64f, loop, AUTO)
      //                          -- the auto bit is on the rage clip, so auto-first leaves him
      //                             permanently angry at rest. Normal is the answer.
      //   Glavenus m04_tail      heat_Loop (200f, loop, AUTO) vs normal_dark_Change (210f, NOT a
      //                          loop) -- name-first takes the transition. heat_Loop is the answer.
      //
      // So: a LOOPING rest-named clip, then the engine's own load-time default (clip+0x04 bit 1,
      // written into a slot at load, 0xb09aac), then a rest-named clip of any kind.
      const loops = i => i >= 0 && clips[i].loop;
      const restIdx = () => {
        const named = byName(STATE_NAMES.calm.rest), re = byRe(REST_NAME);
        if (loops(named)) return named;
        if (loops(re)) return re;
        const a = clips.findIndex(c => c.auto);
        if (a >= 0) return a;
        if (named >= 0) return named;
        return re;
      };
      // Does this material take part in that state at all? The ROM answers per material, not per
      // monster: Khezu's Angry branch (0xd1e8d4) sets clips on enemy+0x38 -- the vein layer -- and
      // NOTHING on +0x30 or +0x34, which are only ever driven by the Taiden branch (0xd1ec1c).
      const takesPart = st => {
        const t = stateNames(st, monId);
        return !!t && (byName(t.start) >= 0 || byName(t.steady) >= 0 || byName(t.end) >= 0);
      };
      const held = i => (i >= 0 && !clips[i].loop && clips[i].frames
                         ? (tSec - tState) * MAT_FPS < clips[i].frames : false);
      const tbl = stateNames(state, monId);
      if (state !== 'calm'){
        const start = byName(tbl.start), steady = byName(tbl.steady);
        if (start >= 0 && steady >= 0){
          // Slot 1 carries the transition on its OWN clock over slot 0's steady clip, exactly as
          // 0xd1e8f8 does; when it runs out the ROM clears every slot and slot 0 becomes the
          // steady clip alone. `auto` first because that is the material's own default.
          if (held(start)){
            const base = restIdx();
            return base >= 0 ? [base, [start, tState]] : [[start, tState]];
          }
          return steady;
        }
        // A one-shot with nothing to hand off to is HELD, and that is the ROM: Khezu's charge does
        // clearAllSlots then setClip(slot 0, "Taiden_start") (0xd1ef00) and never replaces it, so
        // the layer ramps 0 -> 1 over 60 frames and stays there. The evaluator's clamp at
        // frameCount (0xb0cf38) is the same behaviour.
        if (start >= 0) return [[start, tState]];
        if (steady >= 0) return steady;
        // THE MATERIAL TAKES NO PART IN THIS STATE. Sit where calm would put it rather than
        // reaching for the loop fallback below -- that fallback is what put Khezu's 15-frame
        // Taiden strobe on the rage toggle (Raven: "the enraged effect is also super bright").
        // Only skipped for a material that takes part in some OTHER state; one that takes part in
        // none is the Bloodbath case the fallback exists for, and it still gets it.
        if (!states.some(takesPart)) { /* fall through to the general rules */ }
        else {
          const r = restIdx();
          return r >= 0 ? r : -1;      // -1 is the material's OWN authored values
        }
      } else {
        // Leaving a state runs THAT state's end clip, alone in slot 0 -- 0xd1e698 and 0xd1e7a0
        // both call clearAllSlots first -- and only for as long as the clip lasts.
        const prevTbl = stateNames(prev, monId);
        const end = prevTbl ? byName(prevTbl.end) : -1;
        if (end >= 0 && held(end)) return [[end, tState]];
        const rest = restIdx();
        if (rest >= 0) return rest;
        // No rest clip to hand off to. The ROM sets the end clip in slot 0 and never replaces it,
        // so its last frame is HELD -- but only once the state has actually been left. Before that
        // the material has never had a clip set on it at all: Khezu's spawn path (0xd0f590) writes
        // Nomal_Repeat to the vein layer and nothing to anything else, so the rest sit on their
        // shipped values. Holding an end clip a monster has never played is the thing that put
        // Body_Taiden_End's fReflectiveColor -- twice m01_body's shipped 0.105/0.195/0.195 -- on
        // a Khezu that had never charged.
        if (end >= 0) return end;
        if (states.some(takesPart)) return -1;
      }
    }
    if (ci < 0 && state){
      const want = state === 'enraged' ? ENRAGE_CLIPS : CALM_CLIPS;
      for (const nm of want){ ci = clips.findIndex(c => sameClip(c.name, nm)); if (ci >= 0) break; }
    }
    // The enraged/calm toggle is a VIEWER affordance, not a ROM behaviour -- the game reaches these
    // clips through setClip from an AI state, so a name list can never be complete. Bloodbath
    // Diablos proved it: its XfB_0__m50_angry carries a Deviant rage LADDER (Lv1_to_Lv2, Lv2_loop,
    // Lv2_to_Lv3, Lv3_loop, Lv3_to_end), none named in ENRAGE_CLIPS and none carrying the auto bit,
    // so asking for 'enraged' found nothing and the effect stopped animating. When a state is asked
    // for and no name matches, fall back to the LAST looping clip -- the deepest rage stage it has.
    if (ci < 0 && state === 'enraged'){
      for (let i = clips.length - 1; i >= 0; i--) if (clips[i].loop){ ci = i; break; }
    }
    if (ci < 0) ci = clips.findIndex(c => c.auto);   // the ROM's own default
    // LAST RESORT: a SUSTAINED clip, so a material with animation is never left sitting on its
    // static constant. Raven, 2026-09-09, asked for fixes to be general "since it may fix things
    // across multiple monsters", and this is the general half of the clip problem: 46 materials on
    // 23 monsters reach this point with nothing selected, and most of them are the reported faults.
    // Valstrax's eye and heat, Gypceros's crest, Boltreaver's charge, Khezu's Nomal_Repeat, Gore
    // Magala's kasan, Soulseer's dry coat, Teostra's Effect_Loop and Agnaktor's lava are all here.
    // Left unselected they draw their static constant, which is white on most of them -- that is
    // the "renders white", "not coloured" and "no eyes" family in the review log.
    //
    // Only LOOPING clips are eligible. A one-shot would play once and stop, which is the Khezu
    // flash; a loop is a state by definition and is safe to hold. Enrage names are skipped so a
    // calm material does not come up angry.
    //
    // THE ONE JUDGEMENT, and it is small: among the candidates, prefer a name that marks the base
    // state -- normal, nomal (the ROM's own typo), cool, off. Without it the first candidate wins
    // and that is wrong on the monsters where the rest state is authored last: Agnaktor would take
    // maguma_Loop over cool_Loop, Khezu Angry_Repeat over Nomal_Repeat, Gypceros Light_on over
    // Light_off. With it, all three land correctly.
    //
    // THIS IS A VIEWER AFFORDANCE, NOT THE ROM. The game reaches these clips from an AI state, so
    // no rule here can be right by construction -- __view.clipFallback(false) turns it off and
    // restores the previous behaviour for comparison.
    if (ci < 0 && clipFallback){
      const eligible = [];
      for (let i = 0; i < clips.length; i++)
        if (clips[i].loop && !clipInList(clips[i], ENRAGE_CLIPS)) eligible.push(i);
      if (!eligible.length)
        for (let i = 0; i < clips.length; i++) if (clips[i].loop) eligible.push(i);
      if (eligible.length){
        ci = eligible[0];
        for (const i of eligible)
          if (typeof clips[i].name === 'string' && REST_NAME.test(clips[i].name)){ ci = i; break; }
      }
    }
    // TWO SLOTS, the way the rage state machine at 0xe37560 drives them: it puts the START clip
    // into SLOT 1 while SLOT 0 keeps running the steady-state clip. So when a state clip was found
    // and the material also carries an auto-play/steady clip, run both -- slot 0 first, slot 1 over
    // it -- rather than replacing one with the other.
    // THE STEADY SLOT, when the material carries no auto clip. Khezu, 2026-09-09: "the flash also
    // does not revert when toggled off. It has the black veins issues again."
    //
    // `Angry_End` is a TRANSITION, not a rest state. On XfBA_A0__m03_blood its final keys are
    // fTransparency 0.5 and fDiffuseColor alpha 0.6, so selecting it for calm leaves that layer
    // holding at half strength for ever -- and because the layer is BSRevSubAlpha, which DARKENS
    // what is behind it, half strength is a permanent dark shell. The rest state is `Nomal_Repeat`
    // (the ROM's own spelling), which nothing selected because CALM_CLIPS carries `Normal`.
    //
    // So where a material has no auto clip but does have a rest-named one, that clip becomes the
    // steady slot for the CALM state and the matched transition plays over it -- which is what the
    // ROM does with slot 0 and slot 1 above. 24 materials on 16 monsters carry such a clip.
    //
    // Enraged is deliberately excluded: a rest-named clip is not the base state of an enraged
    // material, and the enraged path already has its own fallback.
    const auto = clips.findIndex(c => c.auto);
    let steady = auto, restOnly = false;
    if (steady < 0 && state && state !== 'enraged'){
      steady = clips.findIndex(c => typeof c.name === 'string' && REST_NAME.test(c.name));
      restOnly = steady >= 0;
    }
    // No rest clip: an *_End clip is the off state. Only for CALM, and only when the name lists
    // found nothing -- it never overrides an explicit match.
    if (ci < 0 && steady < 0 && state && state !== 'enraged'){
      const e = clips.findIndex(c => typeof c.name === 'string' && END_NAME.test(c.name));
      if (e >= 0){ steady = e; restOnly = true; }
    }
    if (ci < 0) ci = steady;                       // nothing matched: the base state alone
    // A REST CLIP IS THE STATE, NOT A BACKDROP -- run it ALONE, do not put the transition over it.
    // Slot 1 is applied after slot 0 and wins every track it writes, and a transition is a
    // one-shot that CLAMPS AND HOLDS its final frame for ever (material.js, from 0xb0cf38). So
    // layering `Angry_End` over `Nomal_Repeat` just overwrites it permanently, which is what left
    // Khezu's blood layer frozen at Angry_End's last frame: fTransparency 0.5, static, instead of
    // Nomal_Repeat's 0.6 with its UV scrolling 0.5 -> -0.5 across 120 looping frames.
    //
    // The ROM drops slot 1 when the transition finishes; the viewer has no notion of WHEN the
    // toggle happened, so it cannot time that. Showing the steady state at rest is the honest
    // approximation -- the transition exists for the moment of the change, which we do not model.
    if (restOnly && steady >= 0) return steady;
    if (state && ci >= 0 && steady >= 0 && steady !== ci) return [steady, ci];
    return ci;
  };
}

// RAGE AND CHARGE SIDE BY SIDE. `axes` is { enraged: { state, t, prev }, charged: { state, t, prev } }, each with
// its own clock and the state it left; every material answers to the state whose clips it carries -- Khezu's vein
// layer to rage, its body, alpha layer and swapped-in Taiden layer to the charge -- the way his driver sets clips
// on +0x38 for Angry and on +0x30 / +0x34 / the swapped +0x38 for Taiden. A material in neither follows rage.
function axisPicker(axes, monId, levelClip, stage){
  const r = axes.enraged || { state: 'calm', t: 0, prev: 'calm' };
  const c = axes.charged || null;
  const rage = clipPicker(r.state, monId, r.t, r.prev, levelClip, stage);
  const charge = c ? clipPicker(c.state, monId, c.t, c.prev, levelClip, stage) : null;
  const tbl = stateNames('charged', monId);
  const names = tbl ? [].concat(tbl.start || [], tbl.steady || [], tbl.end || []) : [];
  return (clips, rom, tSec) => {
    const carries = names.length && clips.some(k => k && names.some(n => sameClip(k.name, n)));
    return (charge && carries) ? charge(clips, rom, tSec) : rage(clips, rom, tSec);
  };
}
export function stepMatAnim(root, tSec, stateIn, monId, tState, prev, levelClip){
  const axes = stateIn && typeof stateIn === 'object' ? stateIn : null;
  const state = axes ? ((axes.enraged && axes.enraged.state) || 'calm') : stateIn;
  const stages = stepStageMachine(root, tSec, state, monId) || [];
  const form = FORM_CLIP.exec(typeof levelClip === 'string' ? levelClip : '');
  const formState = form ? stepFormMachine(root, tSec, +form[1], monId) : null;
  if (formState) stages.push(formState);
  for (const b of stepBreakClips(root, tSec, monId)) stages.push(b);
  // a mounted partner's combine clip, held at its last frame -- the result of the combine (ROM_PARTNER_BODY)
  const pc = root && root.userData && root.userData.partnerClip;
  if (pc) stages.push({ mats: [pc.mat], rest: null, clip: pc.clip, t0: -1e9 });
  // a motion's own material clips, from the frame it makes its change (render/motion-states.js: Savage's death plays
  // Angry_End on the body glow, 0xe80a3c), over any pin or state
  for (const mc of (root && root.userData && root.userData.motionClips) || []) stages.push(mc);
  const pick = axes ? axisPicker(axes, monId, levelClip, stages.length ? stages : null)
                    : clipPicker(state, monId, tState, prev, levelClip, stages.length ? stages : null);
  // ONE evaluator for both paths. A ROM-core material is a stock three.js material -- the technique
  // decides which class, not the blend state -- so the shared evaluator's writes land exactly as
  // they always have. fEmissionColor now reaches the 47 lit-technique additive materials that used
  // to be MeshBasicMaterial, because those are MeshStandardMaterial now.
  const n = stepMaterialAnim(root, tSec, pick);
  stepSpecularColour(root, tSec, pick);
  stepAlbedoColour(root, tSec, pick);
  stepArmSlime(root, monId, state);
  return n;
}

// AN ANIMATED fSpecularColor IS A COLOUR, as its static value already is. Raven, 2026-09-13, on
// Boltreaver: "Membrane doesn't change color", then "Fix the specular colour".
//
// The shipped fSpecularColor ($Globals float3 @44) lands in uSpecRGB, which multiplies both specular
// accumulators -- the ROM's `MC.specular * fSpecularColor` (FSpecularMap). But the shared material.js
// hands an ANIMATED one to uSpecTint as its luminance, a scalar on the gloss, and never touches
// uSpecRGB -- so a clip could brighten or dim the specular and never change its hue, and the value it
// scaled was still the SHIPPED colour. Boltreaver's membrane (XfBAN__E1_wing_taiden) ships a
// yellow-green (0.42, 0.6, 0) and its two charge clips write (0.28, 0.4, 0) and (0, 0.4, 0.4); what
// reached the shader was that yellow-green at 0.32 and at 0.28.
//
// So after the shared evaluator has run, the same clips are sampled again for fSpecularColor alone
// and written where the static value lives: uSpecRGB takes the colour, uSpecTint goes back to 1 so it
// is not applied twice. When no playing clip writes it, uSpecRGB goes back to the shipped colour.
// material.js is not changed -- it is a synced copy, and the fix for its own case belongs upstream.
//
// The slot rules are the shared evaluator's: up to four slots in order, a later slot winning, a
// `[index, t0]` pair running on its own clock, loops wrapping and one-shots holding frameCount. The
// sampler below is a copy of material.js's sampleTrack, which is not exported; keep the two in step.
// The ROM writes `cols` floats and every fSpecularColor track in the library is 3-column, so nothing
// reaches fShininess (@47).
//
// 32 tracks carry it: Khezu's Body/Alpha Taiden clips, Rajang's Normal/PumpUp hair and body,
// Glavenus' tail, Boltreaver's membrane, and Chameleos' and Nightcloak Malfestio's stealth materials
// (which match no mesh here). __specRGB(false) restores the luminance-only behaviour for comparison;
// __specRGB() reads the setting back.
let specRGBOn = true;
const specBase = new WeakMap();
function sampleKeysLikeMaterialJs(tr, f){
  const k = tr.keys;
  if (!k || !k.length) return null;
  if (k.length === 1 || f <= k[0][0]) return k[0].slice(1);
  const last = k[k.length - 1];
  if (f >= last[0]) return last.slice(1);
  let i = 0;
  while (i < k.length - 1 && k[i + 1][0] <= f) i++;
  const a = k[i], b = k[i + 1];
  if (tr.interp === 0) return a.slice(1);
  if (tr.kind === 2 || tr.kind === 3 || tr.kind === 5) return a.slice(1);
  const span = b[0] - a[0];
  const t = span > 0 ? (f - a[0]) / span : 0;
  const n = Math.min(a.length, b.length);
  if ((tr.interp === 2 || tr.interp === 4) && span > 0){
    const p = k[i - 1] || a, c2 = k[i + 2] || b;
    const rPA = (a[0] - p[0]) > 0 ? span / (a[0] - p[0]) : 0;
    const rBC = (c2[0] - b[0]) > 0 ? span / (c2[0] - b[0]) : 0;
    const u2 = t * t, u3 = u2 * t;
    const out = [];
    for (let c = 1; c < n; c++){
      const A = a[c], B = b[c];
      const P = (p[c] === undefined) ? A : p[c];
      const C = (c2[c] === undefined) ? B : c2[c];
      const mA = 0.5 * ((B - A) + (A - P) * rPA);
      const mB = 0.5 * ((C - B) * rBC + (B - A));
      out.push(A + mA * t + (3 * B - 3 * A - 2 * mA - mB) * u2 + (2 * A - 2 * B + mA + mB) * u3);
    }
    return out;
  }
  const out = [];
  for (let c = 1; c < n; c++) out.push(a[c] + (b[c] - a[c]) * t);
  return out;
}
// fReflectiveColor gets the same treatment, for the same reason: its shipped value (CBMaterial float3
// @4) is the colour FReflectGlobalCubeMap multiplies (uReflRGB, rom/specular.js), while material.js
// reduces an animated one to an average that only its sphere-map path reads. Boltreaver's charge
// clips write it as (0.65, 0.875, 0.125) and (0.125, 0.875, 0.875) on the membrane.
const reflBase = new WeakMap();
function sampleColourTrack(clips, rom, tSec, pick, target){
  let rgb = null;
  const raw = pick(clips, rom, tSec);
  const list = Array.isArray(raw) ? raw : [raw];
  let slots = 0;
  for (const e of list){
    const ci = Array.isArray(e) ? e[0] : e;
    if (!(ci >= 0)) continue;
    if (++slots > 4) break;
    const t0 = Array.isArray(e) && typeof e[1] === 'number' ? e[1] : 0;
    const clip = clips[ci];
    if (!clip || !clip.frames || !clip.tracks) continue;
    const fr = Math.max(0, tSec - t0) * MAT_FPS;
    const f = clip.loop ? fr % clip.frames : Math.min(fr, clip.frames);
    for (const tr of clip.tracks){
      if (tr.target !== target || tr.unsupported) continue;
      const v = sampleKeysLikeMaterialJs(tr, f);
      if (v) rgb = [v[0], v[1] === undefined ? v[0] : v[1], v[2] === undefined ? v[0] : v[2]];
    }
  }
  return rgb;
}
function stepSpecularColour(root, tSec, pick){
  if (!root) return;
  root.traverse(o => {
    const m = o.material;
    const u = m && m.userData && m.userData.u;
    const rom = m && m.userData && m.userData.rom;
    const clips = rom && rom.anim;
    if (!u || !clips || !clips.length) return;
    if (u.uSpecRGB && clips.some(c => (c.tracks || []).some(t => t.target === 'fSpecularColor'))){
      let base = specBase.get(m);
      if (!base){
        const gl = rom.glob;
        base = (gl && gl.specular) ? gl.specular.slice(0, 3) : u.uSpecRGB.value.toArray();
        specBase.set(m, base);
      }
      const rgb = specRGBOn ? sampleColourTrack(clips, rom, tSec, pick, 'fSpecularColor') : null;
      if (rgb){
        u.uSpecRGB.value.set(rgb[0], rgb[1], rgb[2]);
        if (u.uSpecTint) u.uSpecTint.value = 1;
      } else {
        u.uSpecRGB.value.set(base[0], base[1], base[2]);
      }
    }
    if (u.uReflRGB && clips.some(c => (c.tracks || []).some(t => t.target === 'fReflectiveColor'))){
      let base = reflBase.get(m);
      if (!base){
        const cr = rom.cbm && rom.cbm.reflective;
        base = cr ? cr.slice(0, 3) : u.uReflRGB.value.toArray();
        reflBase.set(m, base);
      }
      const rgb = sampleColourTrack(clips, rom, tSec, pick, 'fReflectiveColor');
      if (rgb) u.uReflRGB.value.set(rgb[0], rgb[1], rgb[2]);
      else u.uReflRGB.value.set(base[0], base[1], base[2]);
    }
  });
}
export function setSpecularRGB(on){ specRGBOn = !!on; return specRGBOn; }
if (typeof window !== 'undefined'){
  window.__specRGB = (on) => on === undefined ? specRGBOn : setSpecularRGB(on);
}

// AN ANIMATED fAlbedoColor IS THE ALBEDO, AND THE ALBEDO COLOURS THE EMISSION TOO. Raven, 2026-09-13:
// "Can you look into Soulseer and Mizu Enraged and Exhausted rendering?" Both Mizutsune recolour their
// overlay (XfBA1__m01_angry) with angry_Change -> fAlbedoColor (1, 0, 0) and tired_Change -> (0.2, 0.52,
// 1.0), and neither colour reached the screen. Two gaps in the shared evaluator, both read live on
// that material:
//
//  * ORDER. material.js writes fAlbedoColor and fDiffuseColor into the same material.color, so the
//    later track wins. Every Mizutsune clip lists fAlbedoColor first and fDiffuseColor (1, 1, 1) last,
//    so the overlay stayed white in both states.
//  * EMISSION. The same clips raise fEmissionColor to 0.5 and 0.3, which reached the screen as
//    texel x emission -- a grey glow on what should be a red or blue layer.
//
// The ROM's combine, read from AppShaderPackage.mfx with efx/shader/mfxprog.py:
//
//     PS_MaterialStd     mc = FAlbedo(mc) ... mc = FDiffuse(mc) ... mc.diffuse += FEmission(mc)
//                        return FFinalCombiner(mc)
//     FAlbedoMap         mc.albedo  = b.xyz * $Globals.fAlbedoColor
//     FDiffuse           mc.diffuse = ((mc.diffuse + FAmbient(mc)) * CBMaterial.fDiffuseColor) * mc.occlusion
//     FEmissionConstant  return $Globals.fEmissionColor
//     FFinalCombiner     color.rgb = mc.albedo * mc.diffuse + mc.specular * mc.fresnel
//
// so rgb = texel * fAlbedoColor * (lighting * fDiffuseColor + fEmissionColor) + specular. On a three.js
// material that is color = fAlbedoColor * fDiffuseColor -- the fold createRomMaterial already makes for
// the shipped values -- and the emission, which the shader already scales by the texel (gBase), times
// fAlbedoColor. Each constant is the playing slot's value where one writes it and the shipped value
// otherwise, a later slot winning; restoreBase puts both back every frame, so nothing accumulates.
//
// SCOPE: lit materials that carry an fAlbedoColor track, under an albedo variant whose body reads it.
// FAlbedoMapColorOnly (b.xyz * fAlbedoColor) and FAlbedoTypeExtendModulate (a0.xyz *= fAlbedoColor)
// read it as FAlbedoMap does; FAlbedoMapConstant never reads fAlbedoColor, so it keeps the shared
// result. 22 materials qualify. What moves, from the tracks:
//
//   colour and glow  Mizutsune and Soulseer's overlay; Glavenus and Hellblade Glavenus' tail (heat
//                    albedo 0.76/0.664/0.64 where the shipped 0.92/0.92/0.68 drew); Alatreon's
//                    m03_add, which drew black because its shipped albedo is 0
//   glow only        Khezu's body and alpha layer on Taiden; Gore Magala's kasan at LV2; both
//                    Glavenus' nodo_r; Valstrax's breathe; Ahtal-Ka's eye (orange, 1/0.6/0)
//   unchanged        Congalala's nose, Tigrex's Virus, Savage Deviljho's body, Hellblade's
//                    overheat_nodo, Altaroth -- none of them emits where its albedo moves, and
//                    nothing else writes their colour
//
// __albedoRGB(false) restores the shared evaluator's result for comparison; __albedoRGB() reads it back.
let albedoRGBOn = true;
const ALBEDO_READS_COLOUR = new Set(['Map', 'MapColorOnly', 'TypeExtendModulate']);
function stepAlbedoColour(root, tSec, pick){
  if (!root || !albedoRGBOn) return;
  root.traverse(o => {
    const m = o.material;
    const rom = m && m.userData && m.userData.rom;
    const clips = rom && rom.anim;
    if (!clips || !clips.length || !m.color || !m.emissive) return;
    const gl = rom.glob;
    if (!rom.feat || !ALBEDO_READS_COLOUR.has(rom.feat.albedo) || !gl || !gl.albedo) return;
    if (!clips.some(c => (c.tracks || []).some(t => t.target === 'fAlbedoColor'))) return;
    const a = sampleColourTrack(clips, rom, tSec, pick, 'fAlbedoColor') || gl.albedo;
    const d = sampleColourTrack(clips, rom, tSec, pick, 'fDiffuseColor')
           || (rom.cbm && rom.cbm.diffuse) || [1, 1, 1];
    m.color.setRGB(a[0] * d[0], a[1] * d[1], a[2] * d[2]);
    m.emissive.setRGB(m.emissive.r * a[0], m.emissive.g * a[1], m.emissive.b * a[2]);
  });
}
export function setAlbedoRGB(on){ albedoRGBOn = !!on; return albedoRGBOn; }
if (typeof window !== 'undefined'){
  window.__albedoRGB = (on) => on === undefined ? albedoRGBOn : setAlbedoRGB(on);
}

// BRACHYDIOS'S ARM SLIME, read from its part driver 2026-09-13. Not a clip: the driver writes the
// two arm materials' constants itself every tick, so no clip table can reach it.
//
// WHICH MATERIALS. The spawn setup caches a material per slot by its MRL id byte (word 6 bits 21..28,
// loaded onto nDraw::Material+0x18 bits 22..29): slot = id - 51 (00f35420..00f3544c). Brachydios's
// XfB__m01_nenkin_arm_l carries 51 and XfB__m02_nenkin_arm_r 52, so slots 0 and 1 are the arms, and
// the loop at 00f370b0 walks exactly those two.
//
// WHAT IT WRITES, per arm (00f370b0..00f373b0):
//   fUVTransform V offset (CBMaterial +0x3c, via 0xb0eff8 / 0xb0f130) from the arm's slime level, a
//     short at [enemy+0xcacc]+0x24 (left) / +0x30 (right): level >= 2 -> -0.66, 1 -> -0.33, 0 -> 0.
//   fUVTransform U offset (+0x2c): 0.5 while bit 0 of [enemy+0x1428]+0x5cfc is set, which the gauge
//     block sets at 00f36fd8 once the enrage gauge reaches 10 -- the same switch as the body slime.
//   fTransparency, the float4's fourth float (CBMaterial +0x0c, via 0xb0aac0): a per-state curve,
//     dipping to 0.3..0.5 and recovering over 20..35 frames when the level changes. NOT MODELLED --
//     the viewer shows the settled states, and the row switch happens inside that dip.
// The offset is ADDED: FUVTransformOffset takes dot(float4(uv, c, 1), fUVTransform[row]), so float 3 of
// each row is the translation, which is exactly what the game's setter writes. The texture is a 2x3
// atlas and the arm UVs sit in its top-left cell, so with the sampler repeating:
//   level 0 -> the top row (near black)   level 1 -> the bottom row (brightest)   level 2 -> the middle
// Both arms SPAWN at level 2 (00f352f4 mov r3,#2 -> 00f3533c / 00f35364); breaking an arm caps it
// (0xf35e2c); the attack AI moves it in between, which no viewer state reproduces.
//
// Raven, 2026-09-13, on normal Brachydios's arms: "they go from dimmer green to brighter green", then
// "Have Arms use In (Primed), In (Diminished), Br". Which LEVEL is Primed and which Diminished is a
// reading, not in the ROM: Primed = 1 (the brightest row), Diminished = 2 (the dimmer green, and the
// spawn level). Level 0, near black, is not offered.
export const ROM_ARM_SLIME = {
  em063_00: {
    mats: ['XfB__m01_nenkin_arm_l', 'XfB__m02_nenkin_arm_r'],   // slot 0, slot 1
    spawnLevel: 2,
    offsetV: [0, -0.33, -0.66],                                 // by level, >= 2 takes the last
    enragedU: 0.5,
  },
  // Raging Brachydios: the SAME enrage colour switch, on ALL FOUR slime layers. The gauge block at
  // 00f36fd8 sets the U-offset-0.5 bit ([enemy+0x1428]+0x5cfc bit 0) for the body slime as well as the
  // arms (see the arm note above, "the same switch as the body slime"); the +0.5 U walks each slime
  // texture from its yellow-green column to the red one -- measured here at U 0 = 0x8e900a and U 0.5 =
  // 0xd74400 on the arm atlas, and a U+0.5 on all four reddens 7.8% of the frame. Only the enrage U is
  // driven here (offsetV [0], so V stays where the mesh UVs already sit -- the calm look is unchanged);
  // the per-arm brightness LEVEL the attack AI drives (em063_00 above) is a separate mechanic not
  // exposed for Raging. Raven, 2026: "the enraged effect that colors the slime on Raging's body." The
  // yellow<->red BLEND clips (Yellow_to_Red / fAlbedoBlendColor) are the eruption, NOT this -- see
  // ROM_SPAWN_CLIP and kept off the Enraged toggle.
  em063_05: {
    mats: ['XfB__m01_nenkin_arm_l', 'XfB__m02_nenkin_arm_r', 'XfB__m03_nenkin_body', 'XfB__m04_nenkin_tail'],
    spawnLevel: 0,
    offsetV: [0],
    enragedU: 0.5,
  },
};
// The level each arm is showing, per mounted root: [left, right]. Absent = the ROM's spawn level.
export function setArmSlimeLevel(root, arm, level){
  if (!root) return null;
  const monId = root.userData && root.userData.monId;
  const t = monId && ROM_ARM_SLIME[monId];
  if (!t) return null;
  const lv = root.userData.armSlime || (root.userData.armSlime = [t.spawnLevel, t.spawnLevel]);
  const set = (i) => { lv[i] = Math.max(0, Math.min(t.offsetV.length - 1, level | 0)); };
  if (arm === undefined || arm === null) { set(0); set(1); } else set(arm ? 1 : 0);
  return lv.slice();
}
export function armSlimeLevels(root){
  const monId = root && root.userData && root.userData.monId;
  const t = monId && ROM_ARM_SLIME[monId];
  if (!t) return null;
  return (root.userData.armSlime || [t.spawnLevel, t.spawnLevel]).slice();
}
function stepArmSlime(root, monId, state){
  const t = monId && ROM_ARM_SLIME[monId];
  if (!t || !root) return;
  const lv = root.userData.armSlime || [t.spawnLevel, t.spawnLevel];
  const u = state === 'enraged' ? t.enragedU : 0;
  // The two arms bind the SAME texture file, and a three.js texture carries its own offset, so each
  // arm gets ONE private copy, shared by every mesh of that arm -- otherwise the right arm's level
  // would move the left's. releaseMonster disposes the copies; the cached original is untouched.
  const maps = root.userData.armSlimeMaps || (root.userData.armSlimeMaps = []);
  root.traverse(o => {
    const m = o.material;
    // ROM-built materials only (romMap is set when the albedo binds): the heat and flat views swap
    // in materials of their own that must not be handed the arm texture.
    if (!m || !m.map || !m.userData || !m.userData.romMap) return;
    const slot = t.mats.indexOf(m.name);
    if (slot < 0) return;
    if (!maps[slot]){ maps[slot] = m.userData.romMap.clone(); maps[slot].needsUpdate = true; }
    if (m.map !== maps[slot]){ m.map = maps[slot]; m.needsUpdate = true; }
  });
  for (let slot = 0; slot < maps.length; slot++){
    const tex = maps[slot];
    if (!tex) continue;
    // `lv` is sized for the arms; a slot past it (Raging's body / tail, which carry no per-arm level) takes
    // the spawn level, so its V never comes out NaN from an undefined index.
    const level = lv[slot] ?? t.spawnLevel;
    const v = t.offsetV[Math.min(level, t.offsetV.length - 1)] || 0;
    if (tex.offset.x !== u || tex.offset.y !== v) tex.offset.set(u, v);
  }
}
// The arm rows drive it through S. Part 1 / S. Part 2 (armSlimeOptions in index.html). From the console,
// __armSlime(level) sets both arms, __armSlime(level, 0|1) one arm, __armSlime() reads the levels back.
// Levels 0 / 1 / 2 -- see ROM_ARM_SLIME for what each shows. A rebuild of the parts panel puts an arm
// back on a level its row offers.
if (typeof window !== 'undefined'){
  window.__armSlime = (level, arm) => {
    const root = window.__view && window.__view.mounted && window.__view.mounted.main;
    return level === undefined ? armSlimeLevels(root) : setArmSlimeLevel(root, arm, level);
  };
}

// THE SCENE CAPTURE that feeds Refract. The ROM samples the scene colour buffer; here the scene is
// rendered once to a target with the refracting materials themselves hidden -- so they refract what
// is BEHIND them, not themselves -- and that texture is handed to their shaders.
// Costs one extra pass only while a refracting material is mounted: 10 materials on 6 monsters
// (Chameleos, Nightcloak Malfestio, Hellblade Glavenus, Astalos and its Deviant).
let sceneRT = null;
export function releaseRefractTarget(){
  if (sceneRT){ sceneRT.dispose(); sceneRT = null; }
}
export function stepRefract(renderer, scene, camera, THREE_){
  // two uniform namings: the ROM core uses the ROM's own fDistortionBlend / uSceneMap, the old
  // material.js path used uDistBlend / uSceneMap.
  const blendOf = m => {
    const u = m.userData && m.userData.u;
    if (!u) return 0;
    if (u.fDistortionBlend) return u.fDistortionBlend.value;
    return u.uDistBlend ? u.uDistBlend.value : 0;
  };
  const live = refractMats.filter(m => blendOf(m) > 0);
  if (!live.length) return 0;
  const size = renderer.getSize(new THREE_.Vector2());
  const w = Math.max(1, size.x | 0), h = Math.max(1, size.y | 0);
  if (!sceneRT){ sceneRT = new THREE_.WebGLRenderTarget(w, h); }
  else if (sceneRT.width !== w || sceneRT.height !== h) sceneRT.setSize(w, h);
  const hidden = [];
  scene.traverse(o => {
    if ((o.isMesh || o.isSkinnedMesh) && o.material && o.material.userData
        && o.material.userData.refract && o.visible){ hidden.push(o); o.visible = false; }
  });
  const prevTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(sceneRT);
  renderer.render(scene, camera);
  renderer.setRenderTarget(prevTarget);
  for (const o of hidden) o.visible = true;
  for (const m of live) if (m.userData.u.uSceneMap) m.userData.u.uSceneMap.value = sceneRT.texture;
  return live.length;
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
// The two floors are both in the binary: 0.25, and 0.27 when the selector at 0x3a8430 returns 5.
// THE SELECTOR IS IDENTIFIED, end to end from the ROM, 2026-09-21. It reads a signed byte at +0x0f
// of [sQuest+0xa4], returns 5/3/1 for those values and 0 for anything else, and only 5 reaches 0.27.
//   * The only non-zero writer of [sQuest+0xa4] is 0x3ad570: it stores 0x39af14(res, 0), where res is
//     the resource just placed at [sQuest+0xa0] and 0x39af14 returns [res+0x6c] + i*0x108 when
//     i < [res+0x64] -- record 0 of an array of 0x108-byte records. 0x108 is sizeof(cQuestData), and
//     rQuestData (0x70) is the resource with that count/array pair.
//   * cQuestData's own property registration names +0x0f: 0x370520 "mMonsterLv", type 8, `add r1,
//     sl, #0xf`. So the floor follows the QUEST's Monster Level -- not the monster.
//   * 5 IS G, by the ROM's own association: the Palico EXP scaler 0x3ada90 reads the same byte and
//     picks cOtQuestExpBias +0x10 / +0x14 / +0x18 / +0x5c for 0 / 1 / 3 / 5, and that class's
//     registration (0x24ef0c, in its vtable at 0x173f450) names them mLvVillageLow / mLvLow / mLvHigh
//     and -- after its sixteen mPermitLv[] entries -- mLvG at +0x5c, its last field.
//   CORRECTION: this comment used to say (2026-09-08) that cOtQuestExpBias has "three, no G". It
//   has four; the check stopped before the mPermitLv[] array and missed mLvG registered after it.
// THE FILES: quest\questData\questData_NNNNNNN.ext, 1,849 of them, magic 00 00 4B 43, a u32, then ONE
// cQuestData as a PACKED stream (natural sizes, no padding) -- so "file = struct + 4" holds only up
// to the struct's first padding byte; mMonsterLv is file +0x13 and boss n's mEmType (u16, variant
// in the high byte: 0x413 = em019_04) is at file +0x64 + 13*(n-1). Checked: all 1,849 mQuestNo
// match their filenames, mMonsterLv only ever holds {0, 1, 3, 5} (0 x571, 1 x141, 3 x672, 5 x465).
// WHICH MONSTERS GET 0.27 -- counted over REAL quests only (corrected 2026-09-21; the first count
// took every file and was wrong). Real = listed by the quest boards' rQuestGroup ("quest\quest_group",
// village/common.arc, 1,509 cQuestGroup records) and not titled DUMMY / dummy data / @ / NOT USED by
// the ROM's own text: 1,479 of 1,849. FOURTEEN monsters are fought only at Monster Level G, so their
// floor is ALWAYS 0.27: Bloodbath Diablos, Rustrazor Ceanataur, Nightcloak Malfestio, Boltreaver
// Astalos, Soulseer Mizutsune, Elderfrost Gammoth, Raging Brachydios, Chaotic Gore Magala, Lao-Shan
// Lung, Fatalis, Crimson Fatalis, Old Fatalis, Ahtal-Ka and em087_00 (its machine). The other 80
// meet both floors -- including Furious Rajang and Savage Deviljho, which are main targets at
// Monster Level High ("Child of Destruction", "A Shock in the Dark", "Triumphant Rage").
// VILLAGE ADVANCED QUESTS ARE SPLIT, per the ROM: the ★6 Advanced set (622..641) is Monster Level
// High, the ★10 Advanced set (1009..1055) is Monster Level G -- so those sixteen use 0.27 although
// they sit on the village board. No other village quest is G.
// So this control is a real, nameable ROM input: the quest's Monster Level, G or not.
export const DEFLECT_T = { f25: 0.25, f27: 0.27 };

// THE DEFLECT LADDER, read from the ROM 2026-09-07 (build/notes/deflect-ladder.md).
// A hit is graded into FOUR tiers by its damage multiplier, not into bounce/no-bounce. From
// 0x177e64 both arms of the selector branch share their top two rungs:
//     00177e74  vldr s2,[pc,#0x1dc] -> 0.66  ;  00177e7c  mov sl, #4
//     00177e8c  vldr s2,[pc,#0x1c8] -> 0.45  ;  00177e90  mov sl, #3
//     00177ea0  vmov.f32 s2, #2.5e-01                     (selector 0/1/3 floor)
//     00177ed4  vldr s2,[pc,#0x184] -> 0.27              (selector 5 floor)
//     00177edc  mov  sl, #2
//     00177ee4  movwlt sl, #0                             below the floor -> tier 0, THE BOUNCE
// so the tiers produced are 4, 3, 2 and 0 -- there is no tier 1 on this path.
export const DEFLECT_RUNGS = [0.66, 0.45];
// The tier a sharpness gets on a hit zone. 0 is the bounce.
export function deflectTier(hz, sharpIdx, floor){
  if (!(hz > 0)) return 0;
  const d = SHARP_RAW[sharpIdx] * hz / 100;
  if (d >= DEFLECT_RUNGS[0]) return 4;
  if (d >= DEFLECT_RUNGS[1]) return 3;
  return d >= floor ? 2 : 0;
}

// The tiers the ladder actually produces, in the order the ROM tests them. There is no tier 1.
export const DEFLECT_TIERS = [2, 3, 4];
// WHAT A TIER MEANS IS ONLY PARTLY TRACED, so the labels stay generic. An earlier version called
// them "Avoids a Bounce" / "Bites" / "Bites Clean", which was invented.
// What IS read (2026-09-08): the classifier stores the tier as a byte (0x177f0c `strb sl,[r4,#6]`)
// and hands it to 0x171c68, which dispatches on a byte at [..+0x4d4]-7 over 9 cases. Only four act
// -- cases 7 and 11 share an arm, 14 and 15 have their own, and 8/9/10/12/13 fall straight through.
// The acting arm at 0x171cfc scales an amount by a PER-TIER table: the pointer at .data 0x01833910
// reaches .rodata 0x0161e364 = [0.5, 0.5, 0.75, 1.0, 1.1, ...] indexed by the tier, so tier 0/2/3/4
// scale by 0.5 / 0.75 / 1.0 / 1.1. WHICH weapons those cases are is NOT established: the only
// weapon enum found (cCatSkillBase's property order) puts Long Sword at 1 and Dual Blades at 3,
// and neither of those cases acts -- so no weapon is named here.
// WHEN EACH NUMBER IS USED, read 2026-09-20. The grader branches on the player's weapon-type byte
// [player+0x4d4] BEFORE the ladder (0x177c84; the second grader 0x17443c runs the same ladder):
//   * types 4 and 6 -> both multipliers forced to 1.0 (0x177cf0), so the value is the zone x power
//     term alone and SHARPNESS CANNOT MOVE IT.
//     THE CLASS NUMBERING IS THE ROM'S OWN, not this library's ordering: the game ships one table per
//     class, romfs table/weapon00BaseData.w00d .. weapon14BaseData.w14d with NO 05, one name file per
//     class (weaponNNMsgData_eng.gmd -- w04's first names are Petrified Cannon / Queen's Longfire,
//     w06's Petrified Shooter / Dios Blaster, w07's Petrified Saber, w11's Petrified Daggers), and a
//     contiguous run in eng/table/CommonMsg_eng.gmd 85..99: Great Sword, Sword & Shield, Hammer,
//     Lance, Heavy Bowgun, "Med. Bowgun (Removed)", Light Bowgun, Long Sword, Switch Axe, Gunlance,
//     Bow, Dual Blades, Hunting Horn, Insect Glaive, Charge Blade -- the removed slot holding 5,
//     exactly as the filenames do. So 4 / 6 / 10 are Heavy Bowgun, Light Bowgun and Bow: the three
//     weapons with no sharpness, which is why the sharpness-free path is theirs.
//     AND [player+0x4d4] IS THAT NUMBERING. The game registers one player class per weapon class --
//     uPlayerQuest00 .. uPlayerQuest15 in the MtDTI registry, WITH NO 05 -- the same gap the weapon
//     tables and the name run have. The byte also indexes a 16-entry per-class table at .rodata
//     0x01621e9c (0x29a5f0) whose entries 4 and 6 share one id, as two bowguns would. (15 is a
//     sixteenth class the name run does not cover; not identified.)
//   * type 10 (Bow) -> 1.0, or 1.32 when 0x2ff1c4 returns 4 (0x177cbc..0x177ce0).
//   * everything else -> RAW[sharp] x KIND[sharp][col], col from the damage class (0x177bf8: 0, 2,
//     3, or 4 when the u16 at +6 of the class record is 1).
// AND WHO USES THE RUNGS. The tier lands at hit+6 (0x177f0c) and goes to 0x171c68, which switches on
// the same weapon byte minus 7 over 9 cases (jump table 0x171cd8): only weapon 7 and weapon 11 reach
// the arm that scales an amount by the per-tier table (0x171cfc; [0.5, 0.5, 0.75, 1.0, 1.1] indexed
// by the tier, the table's only reference in the executable), weapon 14 takes the amount unscaled
// (0x171d3c), weapon 15 has its own arm, and 8 / 9 / 10 / 12 / 13 return without acting. In the same
// model order 7 and 11 are Long Sword and Dual Blades -- the two gauge weapons -- and 14 is Charge
// Blade. So for a Great Sword or a Hammer the rungs change nothing that this decode can find: only
// the floor matters, because only the floor decides the bounce.
// WHAT THE SCALED AMOUNT IS, read 2026-09-20. The amount is the signed byte at hit+0x57 (0x171ca0,
// `ldrsb sb,[r7,#0x57]`, skipped when < 1); the tier scales it, and it goes to the player's vtable
// +0x474. That method is 0x2a28dc for most classes and does, for weapon 7 and weapon 14 only:
// [player+0x2780] += amount, clamped to 0..100 (0x2a2a10 `cmp r1,#0x64`), with x1.5 for weapon 14 in
// one state (0x2a296c, under the +0x1b0 test with r3 = 0x40000) and x1.2 with any of skills 0x98 /
// 0x10a / 0x11c / 0x125, x0.8 with 0x99. At the 100 clamp it re-reads the weapon byte and only
// weapon 7 continues, calling vtable +0x73c with 1800.0 (0x2a2a20..0x2a2a44). Weapon 11 overrides
// +0x474 with 0x11be28c: same [player+0x2780] accumulator and the same 0..100 clamp and skills, but
// at 100 it calls vtable +0x734 with r1 = 2 and at 0 it calls +0x738 with r1 = 2 -- enter and exit of a
// mode -- and it refuses to fill at all in two states (+0x168 returning 1 or 5). Weapon 15 overrides
// it with 0x11e04c8, a per-action table. So the ROM has one 0-100 charge field that the equipped
// class interprets: a 1800-unit timer refresh for 7, a mode toggle for 11, a plain accumulator for 14.
// WHERE THE PER-MONSTER PART IS, read 2026-09-20. Everything above is weapon-side. The monster gets
// one say, and only on a hit that already bounced: 0x16d924 calls the ENEMY's vtable +0x318 with the
// hit record, and the 1 or 2 it returns becomes tier 7 or tier 6 (0x174744..0x174760, and the same
// at 0x1749e4..0x174a24), which is why the tier table has ten entries and not five --
// [0.5, 0.5, 0.75, 1.0, 1.1, 0.5, 0.5, 0.75, 1.0, 1.05]. WHAT THE TWO BLOCKS MEAN IS NOT READ; what
// is read is which site writes what. The sharpness ladder writes 0 / 2 / 3 (0x174680, 0x177f0c). The
// bounce-reaction path presets 2 (0x174718) and then, only if [rec+0x30] & 4, asks the monster: a 2
// back becomes tier 6 and a 1 becomes tier 7. Tier 6 halves the amount against that preset
// (0.75 -> 0.5); tier 7 keeps 0.75 and only moves the byte into the second block. NOTHING FOUND READS
// THAT DIFFERENCE: every reader of +6 in 0x160000..0x1a0000 was checked, and the whole executable was
// scanned for a compare of that byte against 5..9 -- the only compares on this record are against 1,
// 2 and 3/4 (0x17b914 `sub #3; cmp #1`, 0x1881d0, 0x1885c4), all of which treat 6 and 7 as ">= 3".
// So on everything traced, a 1 back from the monster is a NO-OP and only a 2 changes the amount --
// which leaves Kushala Daora and Stonefist Hermitaur as the only two whose hook does anything, since
// Congalala, Rajang, Furious Rajang and Teostra can only ever return 1. Stated as a negative result,
// not a conclusion: a reader may exist outside the way it was searched for.
// The default +0x318 is 0x6c034, `mov r0,#0; bx lr`, on 55 of the 61 enemy classes read (uEm087_08
// would not read at all). Six override it:
//   * uEm021_00, uEm023_00, uEm027_00 (Congalala, Rajang, Teostra) -- identical bodies returning
//     1 when the capsule's flag halfword at +0xa has either of bits 14/15 set, else 0. Per capsule.
//   * uEm024_00 (Kushala Daora) 0xdfd274 -- needs bit 14, then reads the state byte
//     [[enemy+0x1428]+0x1bb]: 0xff -> 0, 3 -> 2 (1 when [enemy+0xcac0]+0x18 is set), 2 -> 1 (or 2).
//     So its deflect strength follows a state, not the capsule alone.
//   * uEm019_00 and uEm020_00 (Daimyo Hermitaur, Shogun Ceanataur) share 0xdc0b48 -- bit 14, plus
//     action state [enemy+0xb5f4] == 0x13 and [enemy+0xb5f5] == 4, and then a threshold pair at
//     [[enemy+0x75f0]+0x64] bytes +1 and +2 picked BY QUEST LEVEL through the same selector as the
//     floor (0xdc0bb8 `bl 0x3a8430`; `cmp r0,#4` / `movle r7,r6` takes byte +1 at level <= 4 and
//     byte +2 above), compared against 0x9d36c(enemy, 5), then branching on [enemy+0x73e0/0x73e1].
// Tier bytes written in this band: 0, 1, 2, 3, 6, 7 and 0xff (unset) as constants, and 4 THROUGH A REGISTER
// -- both graders set it at >= 0.66 (0x177e7c `mov sl,#4` -> 0x177f0c; 0x174608 `mov r0,#4` -> 0x174680).
// (Corrected 2026-09-21: an earlier constant-only scan missed that and called tier 4 unreached.) 5, 8 and
// 9 have no writer found, so only the table's 1.05 end is unreached.
// WHO READS TIERS 3 AND 4 (2026-09-21):
//   * 0x171c68: Long Sword / Dual Blades gauge gain x0.5 / 0.75 / 1.0 / 1.1 for tier 0 / 2 / 3 / 4 --
//     the ONLY reader found that tells 4 from 3.
//   * 0x17b910 and 0x17ad70: tier 3 OR 4, on hits whose effect type (hit+0x52) is 2, 3, 0x2e or 0x2f --
//     0x17b910 then writes a base angle plus a random +-15 degrees (5461 / 2731 in 65536-per-turn units);
//     otherwise 0. What that angle drives is not traced.
//   * 0x17ad34: flag 0x10 when the float argument of 0x17a418 is above 0.45, else 0x20 -- the tier-3 line,
//     but that float comes from different places per caller (one passes a constant 1.0), so it is not
//     proven to be the graded value. Where 0x10 / 0x20 go is not traced.
//   * 0x1885bc: splits tier below 2 / exactly 2 / above 2 into different ids (0x2f; 0x13 or 0x14; ...).
//   * 0x2a7fe8 (bounce grade): 2, 3 and 4 alike are "no deflect"; Blind Eye acts on exactly 2 only.
// WHICH CAPSULES CARRY THE BIT, from our own .bdd set (132 files, flag halfword at +0xa): only seven
// monsters set either of bits 14/15 at all --
//   em019_04 Stonefist Hermitaur 3, em021_00 Congalala 4, em023_00 Rajang 4, em023_05 Furious Rajang
//   4, em024_00 Kushala Daora 1, em027_00 Teostra 22 (8 + 14), em079_04 Nightcloak Malfestio 8.
// So the code and the data only MEET on six of them: uEm079_00 takes the default +0x318, so
// Nightcloak Malfestio's eight flagged capsules are INERT -- nothing reads them. And the reverse
// holds too: em019_00 Daimyo Hermitaur, em020_00 Shogun and em020_04 Rustrazor Ceanataur all run the
// overriding class but set the bit on no capsule, so their check never fires. Do not surface bits
// 14/15 as "deflects" from the data alone; the class has to read them.
// THE RUNGS, CHECKED FOR EVERY LADDER IN THE EXECUTABLE (2026-09-21). The float 0.27 is loaded only
// by the two blade graders; 0.66 and 0.45 by those two plus unrelated code, one Kinsect ladder and
// one hit-flag pick. The hit function 0x170670 routes on the hit record's flags at +0x30:
//   * 0x20 -> blade: 0x177bc4, or 0x17443c when bit 3 of [attacker+0x13cc] is set. BOTH read in full,
//     BOTH arms of each: 0.66 -> tier 4, 0.45 -> tier 3, floor 0.25 / 0.27 by Monster Level -> tier 2.
//     No monster, quest or weapon moves 0.45 or 0.66. A monster only changes the zone value.
//   * 0x10000 -> 0x17806c, a SEPARATE LADDER: the raw zone for pure cut OR pure impact at power 100 (bit 1
//     of hit+0x40, copied from the attack table's +0x0c), NO sharpness, NO Monster Level switch:
//     < 0.30 -> tier 0, > 0.45 (strictly) -> tier 3, else tier 2 -- no tier 4. With an attacker it then
//     hands a code to the attacker's vtable +0x748 and forces tier 0 when that code is 0. The code is
//     5 / 6 / 7 for hit+0x4c bits 0x200 / 0x400 / 0x800, else 0x71158(enemy, part) = byte +8 of the
//     part's 10-byte record in rEnemyDtTune ([enemy+0x75ec], set at 0x107bff4) -- the .dtt field
//     build-hitzones.py reads as the KINSECT EXTRACT colour. +0x748 is a bare `bx lr` for uOtomo and
//     every uPlayerQuestNN EXCEPT uPlayerQuest13 (Insect Glaive), whose 0x11d013c stores the code at
//     [player+0x3350]. So this is the KINSECT's ladder, and a Kinsect hit on a part with extract 0 is
//     forced to tier 0.
//   * 0x8000 -> 0x17817c: computes the value (cut and impact both 100) and writes a FIXED tier 2 -- no
//     rungs, no bounce. IT IS SET BY THE ATTACK, NOT THE MONSTER: the player-hit assembler 0x2b6b14 takes a
//     property word per attack and adds 0x8000 when it has bit 0x800 (ahead of the 0x20 blade route, which
//     needs bit 1; 0x2b6be0 / 0x2b6be8). The word is either .rodata 0x0162212c[kind] -- 24 kinds, of which
//     kind 12 is exactly 0x800 and most carry bit 1 -- or the constant 0x800 / 0x810 that player action
//     0x2b7b88 passes for its three hits (kinds 2, 0xa, 0xb). So these are moves that never bounce, not a
//     monster state; a monster's hardening lives in its zone rows. Which moves: not named yet (0x2b7b88
//     has no direct caller or data pointer -- it is reached indirectly).
// BLIND EYE (skill 0x58, "Causes your attacks to be deflected more easily"), read 2026-09-21. Not a new
// threshold: a ROLL. When each player action starts (0x282960) the local player draws a random u16 --
// 0x27c430 -> 0x3f76d8 -> the xorshift step 0x7c9234 -- into [player+0x2522], kept for that action. The
// bounce-grade method every uPlayerQuestNN shares (vtable +0x26c = 0x2a7fe8) takes the better tier of
// the two current hit records (the array at player+0x3020, stride 0xb8, tier at +6) and, with Blind Eye
// on and none of Steady Hand 0x12f / Nightcloak Soul 0x116 / Nightcloak Soul X 0x128, turns a tier of
// EXACTLY 2 into 0 when that u16 is a multiple of 3 (0x2a8110..0x2a8144). Callers treat 0 / 1 / 5 as a
// deflect (0x2b78b4, mask 0x23). So each ATTACK has a 1-in-3 chance that a hit landing between the floor
// and 0.45 bounces anyway; tiers 3 and 4 are never touched. Later checks in the same method can still
// lift the grade back to 2 (vtable +0x218 / +0x208 / +0x1b8, byte +0x29dc) -- not decoded. The same
// method lifts 0 -> 2 for Mind's Eye 0x57 / Steady Hand / Nightcloak Soul (skill ids = skillData_eng.gmd
// entry / 2, confirmed by Focus 0x98 and Distraction 0x99 in the gauge code).
// Weapon class 15 is the PROWLER: the player hit tables include pl_we15_slash_hitdata and
// pl_we15_strike_hitdata beside pl_airou_com_hitdata, the same slash/strike pair as the Palico's
// otomo\hit\ot_slash_hitdata / ot_strike_hitdata.
export const TIER_LABEL = { 2: 'Tier 2', 3: 'Tier 3', 4: 'Tier 4' };
// The rule a rung clears, in the ROM's own numbers. Tier 2's floor is the selector's.
export function tierRule(tier, floor){
  return '>= ' + (tier === 2 ? floor : DEFLECT_RUNGS[4 - tier]);
}
// THE LADDER FOR A ZONE, as data: the lowest sharpness that reaches each tier, or null where the
// tier is out of reach even at purple. Both the chart and the heat map read this, so all three
// rungs drive what is drawn -- collapsing them back to a bounce/no-bounce line was the old model
// and it is what made the pane disagree with the ROM.
export function deflectLadder(hz, floor){
  const out = { 2: null, 3: null, 4: null };
  if (!(hz > 0)) return out;
  for (const tier of DEFLECT_TIERS)
    for (let i = 0; i < SHARP_RAW.length; i++)
      if (deflectTier(hz, i, floor) >= tier){ out[tier] = i; break; }
  return out;
}
// How HARD a zone is against one rung: the lowest sharpness that reaches it, or null if even purple
// cannot. Tier 2 -- the bounce line -- is the default, which is the old meaning of this function.
// Raven, 2026-09-06: "update Bounce to be Hardness".
// NOTE, and it bounds what this pane can ever say: a hit zone can carry a bit that forces tier 0
// regardless of the multiplier (0x177efc `ldrh r1,[r8,#0xa]` / `tst r1,#0x2000` / `movne sl,sb`),
// which is what Raven saw as a good hit zone that still bounces.
// THE RECORD IS TRACED, 2026-09-20. `r8` is the classifier's 4th argument and it is the .bdd CAPSULE
// record -- the same one hitzones.json carries as `capsules` -- read at +6 (the damage row, handed to
// 0xbaaa4) and at +0xa (the flag word, `capsuleFlags`). So the force-bounce bit is per SHAPE, and a
// census of all 131 .bdd files finds it on 8 records over 2 monsters: em088_00 Ahtal-Ka, 3 shapes on
// damage slot 15, and em087_00 (its machine), 5 shapes on slot 8. Every other monster in the game
// grades purely on the multiplier, so this pane is complete for all of them.
//
// AND THE ZONE VALUES ARE THE CURRENT STATE'S. The classifier resolves the row through
// 0xbaaa4(enemy, slot) = [[enemy+0x1428] + 0x418 + slot*4] -- the very pointer ROM_MEAT_SWITCH's
// 0xbaacc / 0xbaafc move. A state that switches a slot's row changes what bounces off it too.
//
// DECODED AND INERT: 0x16d800 subtracts 15 from the row's cut and impact bytes when 0xbac60 reports
// the monster's status timer [enemy+0x1428]+0x5db4 above 0 -- 15 points harder to bite. The only
// writer of a non-zero value there is 0xbac04 (5400.0), reachable only through enemy vtable slot 272
// (+0x440, 0xccbcc) on the flag byte of a record; its one call site (0x645844) loads the function
// pointer into r1 and passes no record, so that byte reads 0 and nothing starts the timer. Not
// modelled, and nothing here depends on it.
export function hardnessLevel(hz, t, tier){
  return deflectLadder(hz, t)[tier || 2];
}
// A DAMAGE TABLE IS BUILT PER STATE, NOT PICKED. Raven, 2026-09-15, on Astalos: "Table 0 looks correct to me,
// but Table 1 looks off", then "If we have tables that are for different states, instead of simply Table 0 and
// Table 1, we could do a full table for each state."
//
// The .dtt's second block is a POOL OF ROWS, not a second per-slot table. The loader (rEnemyDtTune 0x57684)
// reads it straight after the first, 80 bytes, when header byte 0x12 is 0. The enemy keeps one row pointer
// per damage slot ([enemy+0x1428]+0x418..0x434): 0xbab38 points slot i at table-0 row i, 0xbaacc(slot) puts one
// slot back on table 0, and 0xbaafc(slot, row) points a slot at table-1 row `row` -- the row is its own
// argument, so slot 7 need not read row 7. The monster's own code decides which slot takes which row, and
// when. A state's table is therefore table 0 with the rows that state's rules switch in.
//
// A rule is { slot, row, rung: [cases], rage: bool, mode: [indices], broken: 'key' | [keys], intact: 'key' | [keys] }
// -- `broken` needs every key it names, `intact` none of them -- and every field
// optional but slot and row. `mode` indexes the entry's own `modes`, a state the viewer has no other control for
// (Najarala's Exhausted), which the Damage Table then offers itself. The first rule that holds for a slot wins, in the order the ROM tests them. `rung` is the case of
// the state byte the monster's driver switches on, which is the level axis' rung index (part-review `levels`);
// `rage` is the enrage predicate (0x81670); `broken`/`intact` name a key of `broken`, whose group sets are the
// broken halves the monster's own parts driver draws for that break.
//
// Read out of the ROM by running each monster's routine under Unicorn against a stand-in enemy
// (build/hitzone-states: meatemu.py harness, explore.py sweep, partsmap.py for the break -> group sets,
// gatecheck.py for which variant a routine belongs to). The harness reproduces this file's Astalos entry, which
// was decoded by hand first, on all 13 of its checks.
export const ROM_MEAT_SWITCH = {
  // ASTALOS, uEm081_00 variant 0: 0x101a71c, entered from 0x1018558 when [enemy+0xb5f5] is 0. A break is the
  // parts driver's own test (0x1018db8: the part's counter 0x9d36c against its rank-picked threshold, and bit
  // 0 of [[enemy+0x1428]+0x3b4] for the tail), so `broken` lists the broken set of each pair that driver draws.
  em081_00: {
    broken: { head: [4, 6, 8], back: [10], leftWing: [15, 17, 19], rightWing: [21, 23, 25], tail: [27, 29, 31] },
    rules: [
      { slot: 0, row: 1, rung: [2] },          { slot: 0, row: 0, rung: [0, 1], broken: 'head' },
      { slot: 2, row: 2, broken: 'back' },
      { slot: 3, row: 4, rung: [2] },          { slot: 3, row: 3, rung: [0, 1], broken: 'leftWing' },
      { slot: 7, row: 4, rung: [2] },          { slot: 7, row: 3, rung: [0, 1], broken: 'rightWing' },
      { slot: 6, row: 7, rung: [2] },          { slot: 6, row: 6, rung: [0, 1], broken: 'tail' },
      // Fully Charged with the tail whole takes slot 5 as well. Nothing in this class puts slot 5 back on
      // table 0 afterwards -- only the whole reset 0xbab38, whose caller 0xa4b90 is not traced -- so in the
      // game it may keep this row after a full charge ends. A per-state table cannot show that history.
      { slot: 5, row: 7, rung: [2], intact: 'tail' },
    ],
    // row 5 is never switched in
  },
  // BOLTREAVER ASTALOS, the same class at variant 4: 0x101a9c4. Charge only, no break rules. Charged and
  // Overcharging (cases 2 and 3) are table 0; rows 6 and 7 are never switched in.
  em081_04: {
    rules: [
      { slot: 0, row: 3, rung: [0, 1] }, { slot: 0, row: 0, rung: [4] },
      { slot: 3, row: 4, rung: [0, 1] }, { slot: 3, row: 1, rung: [4] },
      { slot: 7, row: 4, rung: [0, 1] }, { slot: 7, row: 1, rung: [4] },
      { slot: 6, row: 5, rung: [0, 1] }, { slot: 6, row: 2, rung: [4] },
    ],
  },
  // RAJANG, uEm023_00: 0xde25e8 (both variants). ARMOR MODE -- the byte [[enemy+0xcac0]+4] set, and the monster not
  // in action 0x218 -- puts slots 0-4 on their own table-1 rows; otherwise every slot is restored (0xde27d4). The parts
  // driver 0xde2888 makes the same test to draw the pumped-up arm, g15 = part 13, over the ordinary g7 = part 12
  // (0xde2ccc: byte 0 -> g7; set, and action 0x218 before frame 110 -> g7; else g15) -- which is what part-review's
  // Armor Mode rung draws (Arms `12|12|13`). So the table follows that rung: index 2 of Calm / Enraged / Armor Mode.
  em023_00: {
    rules: [
      { slot: 0, row: 0, rung: [2] },
      { slot: 1, row: 1, rung: [2] },
      { slot: 2, row: 2, rung: [2] },
      { slot: 3, row: 3, rung: [2] },
      { slot: 4, row: 4, rung: [2] },
    ],
  },
  // FURIOUS RAJANG, the same routine; its review rungs are Enraged / Armor Mode, so Armor Mode is index 1.
  em023_05: {
    rules: [
      { slot: 0, row: 0, rung: [1] },
      { slot: 1, row: 1, rung: [1] },
      { slot: 2, row: 2, rung: [1] },
      { slot: 3, row: 3, rung: [1] },
      { slot: 4, row: 4, rung: [1] },
    ],
  },
  // ALATREON, uEm050_00: 0xeccd10. The status byte [[enemy+0x1428]+0x1bb] equal to 2 puts slots 0-5 on their
  // own table-1 rows; any other value restores them (a latch at +0xcac0 makes it act once per change). The form
  // machine ROM_FORM_CLIPS reads the same byte: 2 is the blue form, Thunder/Ice, rung 1 of the Form control.
  em050_00: {
    rules: [
      { slot: 0, row: 0, rung: [1] },
      { slot: 1, row: 1, rung: [1] },
      { slot: 2, row: 2, rung: [1] },
      { slot: 3, row: 3, rung: [1] },
      { slot: 4, row: 4, rung: [1] },
      { slot: 5, row: 5, rung: [1] },
    ],
  },
  // NAJARALA, uEm068_00: 0xf87e70. EXHAUSTED -- the tired predicate 0x81614, status [[enemy+0x1428]+0x505] 2 or 3,
  // the one Mizutsune's clip setter plays tired_Change on -- puts slots 0-6 on their own table-1 rows; otherwise
  // every slot is restored. The viewer has no Exhausted control for Najarala, so the state is the Damage Table's
  // own: `modes` names them (Raven's word for the state, from Mizutsune's Normal / Enraged / Exhausted).
  em068_00: {
    modes: ['Normal', 'Exhausted'],
    rules: [
      { slot: 0, row: 0, mode: [1] },
      { slot: 1, row: 1, mode: [1] },
      { slot: 2, row: 2, mode: [1] },
      { slot: 3, row: 3, mode: [1] },
      { slot: 4, row: 4, mode: [1] },
      { slot: 5, row: 5, mode: [1] },
      { slot: 6, row: 6, mode: [1] },
    ],
  },
  // ZINOGRE, uEm057_00: 0xeec02c is ENTERING SUPERCHARGED -- it sets the flag [[enemy+0x1428]+0x5df3], arms a
  // 1800-frame timer and puts slots 0-5 on their own table-1 rows; 0xeecc2c, leaving it, restores them. Zinogre's
  // parts driver 0xef063c draws g1 while that flag is set (0x816d4) and g0 otherwise, and g1 is part-review's
  // Fully Charged rung (g19, the middle rung, is drawn only in the death branch). So the table follows rung 2.
  em057_00: {
    rules: [
      { slot: 0, row: 0, rung: [2] },
      { slot: 1, row: 1, rung: [2] },
      { slot: 2, row: 2, rung: [2] },
      { slot: 3, row: 3, rung: [2] },
      { slot: 4, row: 4, rung: [2] },
      { slot: 5, row: 5, rung: [2] },
    ],
  },
  // THUNDERLORD ZINOGRE, the same two routines. Its own parts driver 0xef0370 draws g19 while the flag is set, g0
  // otherwise (g1 only in the death branch) -- g19 is the Overcharged rung of Charged / Overcharged / Uncharged.
  em057_04: {
    rules: [
      { slot: 0, row: 0, rung: [1] },
      { slot: 1, row: 1, rung: [1] },
      { slot: 2, row: 2, rung: [1] },
      { slot: 3, row: 3, rung: [1] },
      { slot: 4, row: 4, rung: [1] },
      { slot: 5, row: 5, rung: [1] },
    ],
  },
  // ZAMTRIOS, uEm067_00: 0xf66ec0 is ENTERING ICE ARMOR -- the status byte [[enemy+0x1428]+0x1bb] := 1, fresh
  // durability on the ice pieces' part records, slots 0-6 onto their own table-1 rows; 0xf660e4 puts all eight
  // back. The parts driver 0xf768c0 runs its ice logic on the same byte (& 3 == 1), which is part-review's Ice
  // Armor rung. UNMODELLED: while armored, 0xf75ab4 returns ONE slot to table 0 when that part's ice piece
  // breaks (parts 0, 2, 3 and 6); the review has no ice-broken-but-part-intact option to hang that on.
  em067_00: {
    rules: [
      { slot: 0, row: 0, rung: [1] },
      { slot: 1, row: 1, rung: [1] },
      { slot: 2, row: 2, rung: [1] },
      { slot: 3, row: 3, rung: [1] },
      { slot: 4, row: 4, rung: [1] },
      { slot: 5, row: 5, rung: [1] },
      { slot: 6, row: 6, rung: [1] },
    ],
  },
  // BARROTH, uEm044_00: 0xe8c914. Its MUD is a bit per part in [enemy+0xcada], set when that part's mud is gone:
  // a clear bit k puts slot k on its own table-1 row, a set bit restores it. The parts driver 0xe8caa8 reads the
  // same bits to draw the mud -- clear draws it, set draws the empty partner group:
  //     bit 0 head g9 (part 2)    bit 1 torso g13 (part 8)     bit 2 hands g11 (part 5)
  //     bit 3 right leg g17 (10)  bit 4 left leg g15 (part 9)  bit 5 tail g19 (part 11)
  // So a muddy part takes its table-1 row. A `broken` key here is any Parts-row state the table reads, not only a
  // break; `sections` puts these under their own heading in the Hit Zones panel. Raven, 2026-09-16: "Barroth, we
  // know what parts turn on when the mud is applied."
  em044_00: {
    broken: { mudHead: [9], mudTorso: [13], mudHands: [11], mudRightLeg: [17], mudLeftLeg: [15], mudTail: [19] },
    sections: { mudHead: 'Mud', mudTorso: 'Mud', mudHands: 'Mud', mudRightLeg: 'Mud', mudLeftLeg: 'Mud', mudTail: 'Mud' },
    rules: [
      { slot: 0, row: 0, broken: 'mudHead' },
      { slot: 1, row: 1, broken: 'mudTorso' },
      { slot: 2, row: 2, broken: 'mudHands' },
      { slot: 3, row: 3, broken: 'mudRightLeg' },
      { slot: 4, row: 4, broken: 'mudLeftLeg' },
      { slot: 5, row: 5, broken: 'mudTail' },
    ],
  },
  // GAMMOTH, uEm083_00: 0x1054498. Six u32 part states at [enemy+0xcb50] + 4k; 0x1053f24 puts slot k+2 on its
  // table-1 row while record k (k = 0..4) holds 1 or 2, and restores it at 0, 3 or 4. The snow driver 0x105418c
  // draws them, record by record, as the Parts panel's own options (run under Unicorn, value by value):
  //     value 0 No Snow   1 Partial Snow   2 Full Snow   3 Animated Snow (hidden)   4 Broken
  //     record 0 Left Front Leg g10/g9/g8/g11/g12      record 1 Right Front Leg g15/g14/g13/g16/g17
  //     record 2 Left Rear Leg g20/g19/g18/g21/g22     record 3 Right Rear Leg g25/g24/g23/g26/g27
  //     record 4 Tail: 0 g29 (nothing), 2 g28 Snow, 3 g30 Animated; 1 and 4 draw nothing, so value 1 is not
  //     reachable from the panel. Slot 1 follows the trunk BREAK (part 1 against dtp record 2, g7 Broken).
  // So a leg or the tail carrying snow takes its table-1 row. Raven, 2026-09-16: "Let's look over ones that might
  // be easier to figure out first".
  em083_00: {
    broken: { part1: [7], snowLeftFront: [8, 9], snowRightFront: [13, 14], snowLeftRear: [18, 19],
              snowRightRear: [23, 24], snowTail: [28] },
    sections: { snowLeftFront: 'Snow', snowRightFront: 'Snow', snowLeftRear: 'Snow', snowRightRear: 'Snow', snowTail: 'Snow' },
    rules: [
      { slot: 1, row: 1, broken: 'part1' },
      { slot: 2, row: 2, broken: 'snowLeftFront' },
      { slot: 3, row: 3, broken: 'snowRightFront' },
      { slot: 4, row: 4, broken: 'snowLeftRear' },
      { slot: 5, row: 5, broken: 'snowRightRear' },
      { slot: 6, row: 6, broken: 'snowTail' },
    ],
  },
  // ELDERFROST GAMMOTH, the same routine at variant 4, where slot 1 follows a sixth record ([enemy+0xcb64]) instead
  // of the trunk break. Its model has the front legs' and the trunk's ice, the same five values as Gammoth's snow
  // (the trunk: 0 g6 Intact, 1 g33 Partial Ice, 2 g31 Ice, 3 g32 Animated Ice, 4 g7 Broken); records 2-4 point at
  // groups this model leaves EMPTY, so slots 4-6's iced rows are real but nothing on screen can select them.
  em083_04: {
    broken: { iceTrunk: [31, 33], iceFrontLeft: [8, 9], iceFrontRight: [13, 14] },
    sections: { iceTrunk: 'Ice', iceFrontLeft: 'Ice', iceFrontRight: 'Ice' },
    rules: [
      { slot: 1, row: 1, broken: 'iceTrunk' },
      { slot: 2, row: 2, broken: 'iceFrontLeft' },
      { slot: 3, row: 3, broken: 'iceFrontRight' },
    ],
  },
  // SHOGUN CEANATAUR, uEm020_00: 0xdc4358. The SHELL is a u32 at [enemy+0xcadc], set by 0xdc5cec, which also copies
  // it to +0xcb00 -- unless the shell is lost some other way, when +0xcb00 keeps the last one. The parts driver
  // 0xdc5228 draws it as the Parts panel's Shell row (run value by value): 0 g6 nothing (Broken), 1 g4 Shell,
  // 2 g5 Unknown Skull, 3 g3 Gravios Skull. The table: shell 3 -> slot 2; shell 0 -> slot 6; shell 4, or shell 0
  // with +0xcb00 at 4, -> slots 2, 3, 7 -- a shell only Rustrazor wears. Shogun's claws unfold on ENRAGE
  // (0x81670 in the same driver), which the table does not read.
  em020_00: {
    broken: { gravios: [3], noShell: [6] },
    sections: { gravios: 'Shell', noShell: 'Shell' },
    labels: { gravios: 'Gravios Skull', noShell: 'Broken' },
    rules: [
      { slot: 2, row: 2, broken: 'gravios' },
      { slot: 6, row: 6, broken: 'noShell' },
    ],
  },
  // RUSTRAZOR CEANATAUR, the same routine at variant 4. Its driver draws shell 4 as g12 Glavenus Skull and 5 as g11
  // Gravios Skull (0 g13 nothing), and UNFOLDS both claws (g3 / g4, Rusted (Unfolded)) while the shell is 4 or
  // +0xcb00 is 4 -- which, since a new shell resets +0xcb00, is the Glavenus Skull or its loss. So slots 2, 3 and 7
  // follow the Glavenus Skull, or no shell with the claws still unfolded; slot 6 no shell; and slot 4 +0xcb14, the
  // SHARPENED claws (g5 / g6; the review's Sharpened Broken g9 / g10 draw the same sharpened mesh on a broken claw,
  // though this driver shows a broken claw rusted -- 0xdc52cc).
  em020_04: {
    broken: { glavenus: [12], noShell: [13], unfolded: [3, 4], sharpened: [5, 6, 9, 10] },
    sections: { glavenus: 'Shell', noShell: 'Shell', unfolded: 'Claws', sharpened: 'Claws' },
    labels: { glavenus: 'Glavenus Skull', noShell: 'Broken', unfolded: 'Unfolded', sharpened: 'Sharpened' },
    rules: [
      { slot: 2, row: 2, broken: 'glavenus' },
      { slot: 3, row: 3, broken: 'glavenus' },
      { slot: 7, row: 7, broken: 'glavenus' },
      { slot: 2, row: 2, broken: ['noShell', 'unfolded'] },
      { slot: 3, row: 3, broken: ['noShell', 'unfolded'] },
      { slot: 7, row: 7, broken: ['noShell', 'unfolded'] },
      { slot: 6, row: 6, broken: 'noShell' },
      { slot: 4, row: 4, broken: 'sharpened' },
    ],
  },
  // GORE MAGALA, uEm071_00: the tail of its event handler 0xfadfa0 (number 0x47, variant 0) puts slots 0-7 on their
  // own table-1 rows while [[enemy+0x1428]+0x1bb] is set, and resets them otherwise. Every path of that handler
  // sets the byte together with [[enemy+0xcac0]+0x82] (0xfadbf4, 0xfadc94, 0xfae444, 0xfae4c0, 0xfae5f4 -- Chaotic
  // is skipped), and the parts driver 0xfbf97c draws FEELERS OUT on +0x82 (g3 head, g7 feelers, run under
  // Unicorn) -- the Feelers row's Intact (Feelers Out). So the table follows that option.
  em071_00: {
    broken: { feelersOut: [7, 8] },
    sections: { feelersOut: 'Feelers' },
    labels: { feelersOut: 'Out' },
    rules: [
      { slot: 0, row: 0, broken: 'feelersOut' },
      { slot: 1, row: 1, broken: 'feelersOut' },
      { slot: 2, row: 2, broken: 'feelersOut' },
      { slot: 3, row: 3, broken: 'feelersOut' },
      { slot: 4, row: 4, broken: 'feelersOut' },
      { slot: 5, row: 5, broken: 'feelersOut' },
      { slot: 6, row: 6, broken: 'feelersOut' },
      { slot: 7, row: 7, broken: 'feelersOut' },
    ],
  },
  // KHEZU, uEm003_00: 0xd1f880 switches on the ACTION CATEGORY every action sets through 0xbc7f4, stored at
  // [[enemy+0x1428]+0x1ba]: 5 or 6 put slots 0-5 on their own table-1 rows, 0 or 1 restore them, 2-4 leave them.
  // It is NOT the Discharge state -- the eight attacks that set the charge flag [[enemy+0xcac0]+0x20] run at
  // category 0 but one. Raven, 2026-09-16: "Khezu is capable of flying, however it doesn't really fly during
  // attacks. We can assume these are meant for ceiling actions. We could also see if the states change with
  // certain animations." They do: every action of each group dispatcher (Fw 0xd10648, Action 0xd110c0, Move
  // 0xd11e90, Fly 0xd15870, Attack 0xd1c920, Catch 0xd1d9bc, 0xd1f658), run under Unicorn with the core motion
  // setter 0xafce8 logged, starts its motions in ONE category -- no motion is ever started in both halves. So
  // `motionModes` below maps a clip (list, Motion[N]) to the state it starts; a clip not listed leaves the state
  // where it was, as a category 2-4 action does in the game. The grab (L2 M73, the Catch group) is category 6 too,
  // so "Ceiling" covers it; the name is Raven's for the Fly group.
  em003_00: {
    modes: ['Normal', 'Ceiling'],
    motionModes: {
      1: [
        'L0 M26', 'L0 M54', 'L2 M7', 'L2 M8', 'L2 M9', 'L2 M28', 'L2 M33', 'L2 M36', 'L2 M51', 'L2 M55', 'L2 M57',
        'L2 M61', 'L2 M71', 'L2 M73', 'L2 M75', 'L3 M36', 'L5 M1', 'L5 M4', 'L5 M5', 'L5 M6', 'L5 M7', 'L5 M36',
        'L5 M37', 'L5 M38', 'L5 M40',
      ],
      0: [
        'L0 M1', 'L0 M2', 'L0 M6', 'L0 M7', 'L0 M15', 'L0 M18', 'L0 M20', 'L0 M21', 'L0 M30', 'L0 M32', 'L0 M36',
        'L0 M37', 'L0 M38', 'L0 M46', 'L0 M57', 'L1 M3', 'L2 M1', 'L2 M2', 'L2 M3', 'L2 M4', 'L2 M10', 'L2 M11',
        'L2 M12', 'L2 M37', 'L2 M41', 'L2 M42', 'L2 M64', 'L2 M74', 'L2 M82', 'L2 M84', 'L3 M17', 'L3 M27', 'L4 M1',
        'L5 M2',
      ],
    },
    modeViews: { 1: { list: '5', clip: 'Motion[1]_loop' } },
    rules: [
      { slot: 0, row: 0, mode: [1] },
      { slot: 1, row: 1, mode: [1] },
      { slot: 2, row: 2, mode: [1] },
      { slot: 3, row: 3, mode: [1] },
      { slot: 4, row: 4, mode: [1] },
      { slot: 5, row: 5, mode: [1] },
    ],
  },
  // KUSHALA DAORA, uEm024_00: 0xdf115c. Its WIND AURA level lives in [[enemy+0x1428]+0x1bb] (0xff none); a broken
  // horn ([[enemy+0xcac0]+0x18]) shows 3 as 2 and 2 as 1. Any level of 1 or more puts slots 0-6 on their own
  // table-1 rows, 0 restores them. The aura driver 0xdeffc4 makes the same adjustment and spawns effect 1000 + level
  // (1001 / 1002 / 1003) for levels 1-3, none at 0 -- so the table follows the aura being up. The spawn setup
  // 0xdef008 starts it at 0; the event handler 0xdef314 raises it (0 or 1 to 2, 2 to 3, or straight to 3), drops
  // it (3 to 2), turns it off, or holds it suspended as level + 3. Raven, 2026-09-16: "Kushala next, check if it's
  // linked to its wind aura" -- it is; which level is which in the hunt is his reading to give.
  em024_00: {
    modes: ['No Aura', 'Wind Aura'],
    rules: [
      { slot: 0, row: 0, mode: [1] },
      { slot: 1, row: 1, mode: [1] },
      { slot: 2, row: 2, mode: [1] },
      { slot: 3, row: 3, mode: [1] },
      { slot: 4, row: 4, mode: [1] },
      { slot: 5, row: 5, mode: [1] },
      { slot: 6, row: 6, mode: [1] },
    ],
  },
  // KIRIN, uEm011_00: 0xd6e2ec puts slots 0-6 on their own table-1 rows while [[enemy+0xcac0]+6] is 0 and restores
  // them while it is set (a latch at +7 makes it act once per change). Its caller, the frame routine 0xd6df64, writes
  // that byte straight from the ENRAGE predicate 0x81670 every frame (after this runs, so it trails by one), and
  // spawns the THUNDER AURA -- effects 1002 / 1003 on 32- and 45-frame timers -- only while +0xd is set, which it
  // clears whenever that byte is 0. So calm Kirin has no aura and takes table 1; enraged, the aura is up and the
  // table is table 0. Raven, 2026-09-16: "Kirin next, check if it's linked to its thunder aura".
  em011_00: {
    rules: [
      { slot: 0, row: 0, rage: false },
      { slot: 1, row: 1, rage: false },
      { slot: 2, row: 2, rage: false },
      { slot: 3, row: 3, rage: false },
      { slot: 4, row: 4, rage: false },
      { slot: 5, row: 5, rage: false },
      { slot: 6, row: 6, rage: false },
    ],
  },
  // NIBELSNARF, uEm056_00: 0xee1a80 puts slots 0-7 on their own table-1 rows when its argument is 0 and restores
  // them otherwise (a latch at +0xcae6). The only caller is the action handler 0xee1218 -- the vtable +0x204 method
  // the shared action starter 0x754f8 calls with the (group, index) of every action begun -- and it passes 0 for
  // action (1, 0x0e) alone. That action (0xee2c10) loops L3 Motion[23] on a 360-frame timer, then starts (1, 0x0f)
  // (L3 Motion[25]); it is entered from (1, 0x0c) (L3 Motion[22]), which first turns toward a hunter. Raven,
  // 2026-09-16: "It is when it is Flaying around, after you knock it over". No other action starts L3 Motion[23]
  // (every group dispatcher traced), so that clip is Flailing and every other clip puts the table back.
  em056_00: {
    modes: ['Normal', 'Flailing'],
    motionModes: {
      1: ['L3 M23'],
      default: 0,
    },
    modeViews: { 1: { list: '3', clip: 'Motion[23]_loop' } },
    rules: [
      { slot: 0, row: 0, mode: [1] },
      { slot: 1, row: 1, mode: [1] },
      { slot: 2, row: 2, mode: [1] },
      { slot: 3, row: 3, mode: [1] },
      { slot: 4, row: 4, mode: [1] },
      { slot: 5, row: 5, mode: [1] },
      { slot: 6, row: 6, mode: [1] },
      { slot: 7, row: 7, mode: [1] },
    ],
  },
  // AMATSU, uEm058_00: 0xf09c18 puts slots 0-5 on their own table-1 rows while [enemy+0x15fb] is 1 (a latch at
  // +0xcac0 makes it act once per change). The parts driver 0xf09d0c reads the same byte to draw the HORN GLOW --
  // g15 / g16 / g17 (the head with m05_horn_add, parts 25/27/28) over g1 / g8 / g9 -- while the eyes' glow there
  // follows the real enrage predicate 0x81670. The byte is set once, by the action handler for action (10, 0x8e)
  // (0xf09190, a scripted action whose first clip reads as L3 Motion[18]), and nothing clears it. Raven,
  // 2026-09-16: "Amatsu next, check if it's linked to its horn glow" -- it is the same byte. part-review draws the
  // glow on the Head row's ENRAGED half, which folds it into the plain options, so the key is `exact`: it reads the
  // group actually drawn, and the table follows the glow however it is put on screen.
  em058_00: {
    broken: { hornGlow: [15, 16, 17] },
    exact: ['hornGlow'],
    labels: { hornGlow: 'Horn Glow' },
    rules: [
      { slot: 0, row: 0, broken: 'hornGlow' },
      { slot: 1, row: 1, broken: 'hornGlow' },
      { slot: 2, row: 2, broken: 'hornGlow' },
      { slot: 3, row: 3, broken: 'hornGlow' },
      { slot: 4, row: 4, broken: 'hornGlow' },
      { slot: 5, row: 5, broken: 'hornGlow' },
    ],
  },
  // RAGING BRACHYDIOS, uEm063_00 variant 5: 0xf3588c. Each of the four slime layers -- MRL ids 51..54, arm_l / arm_r /
  // body (the head's slime: a hit on dtt part 0, the Horn and Head shapes, erupts it) / tail, cached as slots 0..3 by the
  // spawn setup (00f353c0) -- has a colour state at [enemy+0xcacc]+0x54+8k (0 Yellow, 1 Yellow_to_Red, 2 Red,
  // 3 Red_to_Yellow; the names are the table at 0x017d9750), and the routine puts a layer's rows on table 1 while it is
  // Red: arm_l -> slot 3, arm_r -> slot 7, body -> slots 0 and 1, tail -> slots 5 and 6. The Red rows are the HARDER
  // ones (cut, impact and shot only).
  //   WHAT TURNS IT RED IS ENRAGING. Raven, 2026-09-16: "Red Slime would be tied to the Enrage state", "verify this in
  // the ROM". When the anger points fill (0xbcb48 sets reaction bit 4), the reaction handler (0x7f010) points the AI at
  // group 6 of the monster's command table and sets rage. Raging's group 6 (em063_00_cmdtbl.emc) requests ActionMove 6
  // -- `00 01 06`, opcode 0 being the interpreter's action request (0x82ec4 case 0 -> 0x754b8), and the only request
  // for that move in the table -- and the move (0xf37b64, List 0 Motion[15]) turns all four layers Red at frame 158.
  // So the table follows the Enraged toggle, with the whole body Red. Raven: "To keep our app UI simple, we can assume
  // red slime covers his whole body". What that leaves out: a hunter's hit on a Red part erupts it and sends it back to
  // Yellow (0xf46f34 -> 0xf36984 -> 0xf46234; a hit on a Yellow part adds 180 ticks to its countdown instead), every
  // layer also flips on its own 2700-tick countdown whether enraged or not (0xf36100), all four go back to Yellow in
  // action groups 0xb, 0xc and 0xe (vtable +0x3f4 = 0x7fed4), and calming down changes no layer.
  //   Both arms' shapes read slot 3 (bdd record+6), so in the game the Pounders row follows the left arm; slot 7, the
  // right arm's, is read by no shape on this model.
  em063_05: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
      { slot: 7, row: 7, rage: true },
    ],
  },
  // CONGALALA, uEm021_00: 0xdcf708, every frame. While the motion is 0x20a -- List 2 Motion[10], the Belly Pump -- and
  // has reached frame 40 (0x72714 mode 1: the clip's frame at or past it), slots 0-4 take their table-1 rows; in any
  // other motion slots 0-3 are restored, and slot 4 keeps its table-1 row only while [[enemy+0x1428]+0x5cb6] is 100 --
  // a byte copied from the quest's monster record at spawn (0x6fa58) and tested at that value by a dozen classes, a
  // quest mode rather than a state of the hunt, so it is not offered. Raven, 2026-09-17: "Congalala, do the hit zones
  // become resistant?", then "I was going to suggest it was the Belly Pump move L2, M10 plays". Mostly: the Body goes
  // from 30/30/40 cut/impact/shot to 5/5/5 and the Tail drops, while the Arms and Legs fall to 15 impact and shot but
  // rise to 65 cut. The viewer splits that motion into _start (60 frames) and _loop; the game's frame keeps counting
  // through the loop, which is past 40 throughout. So the Damage Table follows the clip that plays, from frame 40 of
  // the _start clip on, and every other clip puts it back.
  em021_00: {
    modes: ['Normal', 'Belly Pump'],
    motionModes: { 1: ['L2 M10_start@40', 'L2 M10_loop'], default: 0 },
    modeViews: { 1: { list: '2', clip: 'Motion[10]_loop' } },
    rules: [
      { slot: 0, row: 0, mode: [1] },
      { slot: 1, row: 1, mode: [1] },
      { slot: 2, row: 2, mode: [1] },
      { slot: 3, row: 3, mode: [1] },
      { slot: 4, row: 4, mode: [1] },
    ],
  },
  // TETSUCABRA, uEm066_00: 0xf57f8c, its action-start handler, the same for both variants. Starting one of a set of its
  // actions (groups 1, 2, 7 and 10) sets bit 1 of [[enemy+0x1428]+0x1bb], starts a timer at [[enemy+0xcac0]+4] (60, or
  // 1 on the path from 0xf5859c) and puts slot 5 on its table-1 row (0xf58cf0), the SOFTER tail. When a later action
  // starts with that timer run out, or is in group 0xb, the bit is cleared and slot 5 restored (0xf58d3c). The parts
  // driver 0xf636a4 reads the same bit to draw the swollen tail -- g13 (part 2 off) over g12 (part 2 on), which is
  // part-review's Tail row, Normal / Swollen. Raven, 2026-09-17: "Tetsucabra's table change appears to impact only his
  // tail, if this is the case it is likely due to his tail inflating". It is: the two change together, always.
  em066_00: {
    broken: { swollen: [13] },
    sections: { swollen: 'Tail' },
    labels: { swollen: 'Swollen' },
    rules: [
      { slot: 5, row: 5, broken: 'swollen' },
    ],
  },
  // DRILLTUSK TETSUCABRA, the same handler and driver (em066_04's own table-1 tail row).
  em066_04: {
    broken: { swollen: [13] },
    sections: { swollen: 'Tail' },
    labels: { swollen: 'Swollen' },
    rules: [
      { slot: 5, row: 5, broken: 'swollen' },
    ],
  },
  // NAKARKOS, uEm084_00: 0x1069b88, every frame (vtable +0x2a8). Only the Face (slot 2) moves: table 0's row is
  // 65/65/40 cut/impact/shot with fire 15, thunder 10, dragon 20; table 1's is 30/30/15 with no element. The routine
  // leaves the slot alone while the fight stance [enemy+0xcac4] is 1; otherwise the Face is on table 1 while a handle
  // at [enemy+0xcbc4] is held, else on table 0. 0x106aa48, run just before it, holds that handle only in stance 2 and
  // drops it -- the Face on table 0 -- while any of these is true:
  //   * [enemy+0xcadc] is set. (7, 0x32), List 2 Motion[81], sets it as it starts; (7, 0x33..0x35) and any group 11
  //     action clear it (0x1067ed4, called by the action-start handler). It is the CANNON'S CHARGE: while it is set
  //     the face plate's driver (0x106b7d4) steps the shell through hadouhou1_Loop .. hadouhouMAX_Loop (波動砲, the
  //     wave-motion cannon, part-review's Charging), and on the attack below it plays hadouhou_Fire.
  //   * the action is (7, 0x33..0x35 / 0x3c..0x3e) -- one attack, 0x10767c0: List 2 Motion[82] looped, then [83] -- or
  //     (10, 0x0d / 0x14 / 0x5f / 0x6a / 0x72 / 0xaf), or any action of groups 11 and 13.
  //   * [enemy+0xcb14] is 2: set by (6, 2) and (6, 4) (List 0 Motion[18]), cleared by (6, 3) (0x10694c0).
  //   * either tentacle's body part state, [[enemy+0x1428]+0x3bc] or +0x3c8, is 3 -- the byte that puts that tentacle
  //     in its Exposed form (ROM_ATTACHED_BODY, 0x107e25c).
  // THE STANCE: as each action of groups 1, 2, 6, 7 and 13 starts, the handler (0x1066c14, vtable +0x204 -> 0x1065c60)
  // sets 1 or 2 -- mostly 1 below index 0x32 and 2 from it -- and every other group keeps it. It opens at 1, or at 2
  // where 0x3a8430 reads 5 (0x10655c4), and each change refills both tentacles' part HP and clears their states. The
  // two stances play their own clips (the idle is List 0 Motion[1] in 1, Motion[50] in 2), so a clip says the stance.
  // Raven, 2026-09-18: "It is likely when he does certain animations to go between his '2 Headed Dragon' disguise and
  // his actual form where he revels his face", "ensure that I am in the ROM". It is the animation: the Face opens for
  // List 2 Motion[81] (7, 0x32) and for [82] and [83] (7, 0x33..) -- (7, 0x33..0x35) is also what moves the fight
  // from phase 1 to 2 (0x1067d78) -- and for the reactions: (10, 0xaf) List 3 Motion[64], [65], [66]; (10, 0x5f) [16],
  // [9], [10]; (10, 0x6a) [76], [77], [78]; group 11 [63]. (10, 0x14) and (10, 0x72) play List 3 Motion[50], which
  // (1, 0x3a) plays with the Face shut, so that clip is left out. Every other stance-2 clip is Face Guarded, and
  // a stance-1 clip changes nothing, as in the game. Two places the clip cannot say: (10, 0x5f) and group 11 play the
  // same clips in stance 1, where the Face is left as it was, and [enemy+0xcb14] outlasts the actions that set it.
  // A tentacle set to Exposed opens the Face whatever the clip (the `attached` key, answered by the tentacle rows).
  // Clips traced under Unicorn for every action (build/hitzone-states/state-decodes.md).
  em084_00: {
    modes: ['Face Revealed', 'Face Guarded'],
    motionModes: {
      0: ['L2 M81', 'L2 M82', 'L2 M83', 'L3 M64', 'L3 M65', 'L3 M66', 'L3 M16', 'L3 M9', 'L3 M10',
          'L3 M76', 'L3 M77', 'L3 M78', 'L3 M63'],
      1: ['L0 M41', 'L0 M50', 'L0 M59', 'L0 M63', 'L0 M66', 'L0 M67', 'L2 M85', 'L2 M86', 'L2 M101', 'L2 M102',
          'L2 M103', 'L3 M62'],
    },
    modeViews: { 0: { list: '2', clip: 'Motion[82]_loop' }, 1: { list: '0', clip: 'Motion[50]_loop' } },
    broken: { exposed: [] },
    attached: { exposed: { em084_00_left: [1], em084_00_right: [1] } },
    sections: { exposed: 'Tentacles' },
    labels: { exposed: 'Exposed' },
    rules: [
      { slot: 2, row: 2, mode: [1], intact: 'exposed' },
    ],
  },
  // BLOODBATH DIABLOS, uEm007_00 variant 4: 0xd32a00, every frame. Only the Head (slot 1) moves, and it moves by HP.
  // With hp% = current * 100 / max (P+0x370 / P+0x374) and two thresholds at [enemy+0xcac0]+0x6c (first) and +0x6d
  // (second), each stage LATCHES the first time HP reaches it (+0x6e, +0x6f) and never unlatches: the second stage puts
  // the Head on table 1 row 1 (57/21/35 cut/impact/shot), the first on row 2 (52/20/32), and neither leaves table 0
  // (45/15/30). Entering the first clears its rage state (0xba7b8: P+0x510..0x51c, the enrage flag among them);
  // entering the second clears its tiredness (0xba8dc: P+0x505 = 0, P+0x506/0x508 = 1000); each then raises reaction
  // bit 1 (0x7fba0), and the reaction handler (0x7f010) runs group 7 of
  // the command table, program 0 for the first stage and 1 for the second -- em007_00_cmdtbl `14 21 00 07 5f ff` and
  // `14 21 00 07 67 ..` -- whose actions (7, 0x5f) / (7, 0x67) are one roar, 0xd3e7b0, List 2 Motion[22].
  //   THE THRESHOLDS are set up per quest (0xd320b4, from setup 0xd31c54): ints of em007_04_actiontune picked by the
  // special-permit level, which the ROM reads as the last two digits of the quest id (0x3a8470): G1 and any other
  // quest 75 / 25, G2-G5 85 / 40, EX (and fourteen event quest ids) 85 / 50. A quest spawn byte (P+0x5cb6) of 3-5
  // starts it in the first stage (second at 70), 6-8 in both.
  //   THE SAME STAGES ARE ITS RAGE LADDER. 0xd32214 writes P+0x1bb every frame -- 1 above the first threshold, 2 below
  // it (3 while enraged), 4 below the second, 0 while exhausted -- and the rage material's driver (0xd36e50, with the
  // clip indices setup reads off XfB_0__m50_angry) plays nothing at 1, Lv1_to_Lv2 into Lv2_loop at 2-4, and
  // Lv2_to_Lv3 into Lv3_loop at 4 once [enemy+0xcac0]+0x70 is set, which the second stage's roar (7, 0x67) does as it
  // starts (the action-start handler 0xd322e4). Those are the viewer's Rage rungs: Calm (no clip), Building (Lv2),
  // Full (Lv3). So the Head follows the Rage dropdown: Calm table 0, Building row 2, Full row 1. What that leaves out:
  // between the second threshold and its roar the Head is already on row 1 under the Lv2 glow. The stages also speed it
  // up: every action start sets [enemy+0xcac0]+0x74, the factor its actions hand to the motion speed (0xb07b4), to the
  // tune float for its P+0x1bb -- 1.0 above the first threshold, 1.08 below it (1.1 enraged, 0.9 tired), and 1.15 once
  // the second stage's roar has started.
  // Raven, 2026-09-18: "Bloodbath Diablos, seems easy enough to look into".
  em007_04: {
    rules: [
      { slot: 1, row: 1, ladder: [2] },
      { slot: 1, row: 2, ladder: [1] },
    ],
  },
  // ---- generated from the ROM sweep (build/hitzone-states) ----
  // Basarios (em004_00), uEm004_00: 0xd2329c. Coverage 0xd2329c 1/7.
  em004_00: {
    broken: { part6: [4] },
    rules: [
      { slot: 3, row: 3, broken: 'part6' },
    ],
  },
  // Gravios (em005_00), uEm004_00: 0xd2329c. Coverage 0xd2329c 7/7.
  em005_00: {
    broken: { part0: [18], part1: [6], part2: [8], part3: [14], part4: [16], part5: [4], part6: [10, 12] },
    rules: [
      { slot: 2, row: 2, broken: 'part0' },
      { slot: 4, row: 4, broken: 'part1' },
      { slot: 5, row: 5, broken: 'part2' },
      { slot: 6, row: 6, broken: 'part3' },
      { slot: 7, row: 7, broken: 'part4' },
      { slot: 0, row: 0, broken: 'part5' },
      { slot: 3, row: 3, broken: 'part6' },
    ],
  },
  // Lao-Shan Lung (em012_00), uEm012_00: 0xd75914. Coverage 0xd75914 1/1.
  em012_00: {
    broken: { part1: [10, 12] },
    rules: [
      { slot: 3, row: 3, broken: 'part1' },
    ],
  },
  // Crimson Fatalis (em013_01), uEm013_00: 0xd7e458. Coverage 0xd7e458 16/16.
  em013_01: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
      { slot: 7, row: 7, rage: true },
    ],
  },
  // Old Fatalis (em013_02), uEm013_00: 0xd7e458. Coverage 0xd7e458 16/16.
  em013_02: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
      { slot: 7, row: 7, rage: true },
    ],
  },
  // Daimyo Hermitaur (em019_00), uEm019_00: 0xdb5cac. Coverage 0xdb5cac 14/14.
  // Unread state inputs (P+0x5de8, P+0x5de9, P+0x5dea, P+0x5deb): rows this monster moves in another state are not encoded, so the table is its resting state plus the breaks below.
  em019_00: {
    broken: { part2: [7] },
    rules: [
      { slot: 2, row: 6, broken: 'part2' },
    ],
  },
  // Stonefist Hermitaur (em019_04), uEm019_00: 0xdb57e0. Coverage 0xdb57e0 10/10.
  // Unread state inputs (S0+0x18): rows this monster moves in another state are not encoded, so the table is its resting state plus the breaks below.
  em019_04: {
    broken: { part2: [11], part3: [6], part4: [8], part5: [2], part6: [4] },
    rules: [
      { slot: 2, row: 2, broken: 'part2' },
      { slot: 3, row: 3, broken: 'part3' },
      { slot: 7, row: 7, broken: 'part4' },
      { slot: 6, row: 6, broken: 'part5' },
      { slot: 4, row: 4, broken: 'part6' },
    ],
  },
  // Teostra (em027_00), uEm027_00: 0xe11768. Coverage 0xe11768 14/14.
  em027_00: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
    ],
  },
  // Tigrex (em032_00), uEm032_00: 0xe21e24. Coverage 0xe21e24 14/45.
  em032_00: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
    ],
  },
  // Grimclaw Tigrex (em032_04), uEm032_00: 0xe21e24. Coverage 0xe21e24 14/45.
  em032_04: {
    broken: { part4: [8], part6: [11] },
    rules: [
      { slot: 3, row: 3, broken: 'part4' },
      { slot: 7, row: 3, broken: 'part6' },
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
    ],
  },
  // Akantor (em033_00), uEm033_00: 0xe373f0. Coverage 0xe373f0 7/7.
  em033_00: {
    broken: { part1: [13] },
    rules: [
      { slot: 0, row: 0, broken: 'part1' },
      { slot: 1, row: 1, broken: 'part1' },
      { slot: 2, row: 2, broken: 'part1' },
      { slot: 3, row: 3, broken: 'part1' },
      { slot: 4, row: 4, broken: 'part1' },
      { slot: 5, row: 5, broken: 'part1' },
      { slot: 6, row: 6, broken: 'part1' },
    ],
  },
  // Nargacuga (em037_00), uEm037_00: 0xe485d0. Coverage 0xe485d0 16/16.
  // E+0xcb2e is the routine's own latch: it holds the state last applied and the rows switch only when the enrage test disagrees with it, so the table simply follows Enraged.
  em037_00: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
      { slot: 7, row: 7, rage: true },
    ],
  },
  // Silverwind Nargacuga (em037_04), uEm037_00: 0xe485d0. Coverage 0xe485d0 16/16.
  // E+0xcb2e is the routine's own latch: it holds the state last applied and the rows switch only when the enrage test disagrees with it, so the table simply follows Enraged.
  em037_04: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
      { slot: 7, row: 7, rage: true },
    ],
  },
  // Ukanlos (em038_00), uEm038_00: 0xe5ba74. Coverage 0xe5ba74 7/7.
  em038_00: {
    broken: { part2: [10] },
    rules: [
      { slot: 0, row: 0, broken: 'part2' },
      { slot: 1, row: 1, broken: 'part2' },
      { slot: 2, row: 2, broken: 'part2' },
      { slot: 3, row: 3, broken: 'part2' },
      { slot: 4, row: 4, broken: 'part2' },
      { slot: 5, row: 5, broken: 'part2' },
      { slot: 6, row: 6, broken: 'part2' },
    ],
  },
  // Deviljho (em043_00), uEm043_00: 0xe7ef64. Coverage 0xe7ef64 12/12.
  // S0+0x30 is the routine's own latch: it holds the state last applied and the rows switch only when the enrage test disagrees with it, so the table simply follows Enraged.
  em043_00: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
    ],
  },
  // Savage Deviljho (em043_05), uEm043_00: 0xe7ef64. Coverage 0xe7ef64 12/12.
  // S0+0x30 is the routine's own latch: it holds the state last applied and the rows switch only when the enrage test disagrees with it, so the table simply follows Enraged.
  em043_05: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
    ],
  },
  // Uragaan (em045_00), uEm045_00: 0xe9bc48. Coverage 0xe9bc48 1/1.
  em045_00: {
    broken: { part0: [4] },
    rules: [
      { slot: 0, row: 0, broken: 'part0' },
    ],
  },
  // Crystalbeard Uragaan (em045_04), uEm045_00: 0xe9bc48. Coverage 0xe9bc48 1/1.
  em045_04: {
    broken: { flag1: [4] },
    rules: [
      { slot: 0, row: 0, broken: 'flag1' },
    ],
  },
  // Agnaktor (em049_00), uEm049_00: 0xec0dbc. Coverage 0xec0dbc 16/16.
  // Unread state inputs (E+0xcac0, E+0xcac1, E+0xcac2, E+0xcac3, E+0xcac4, E+0xcac5, E+0xcac6, E+0xcac7, E+0xcac8, E+0xcac9, E+0xcaca, E+0xcacb, E+0xcacc, E+0xcacd, E+0xcace, E+0xcacf): rows this monster moves in another state are not encoded, so the table is its resting state plus the breaks below.
  em049_00: {
    broken: { part0: [4], part1: [8], part2: [12], part3: [10], part4: [16], part5: [14], part6: [6], part7: [18] },
    rules: [
      { slot: 0, row: 0, broken: 'part0' },
      { slot: 2, row: 2, broken: 'part1' },
      { slot: 3, row: 3, broken: 'part2' },
      { slot: 4, row: 4, broken: 'part3' },
      { slot: 3, row: 3, broken: 'part4' },
      { slot: 4, row: 4, broken: 'part5' },
      { slot: 1, row: 1, broken: 'part6' },
      { slot: 5, row: 5, broken: 'part6' },
      { slot: 7, row: 7, broken: 'part6' },
      { slot: 6, row: 6, broken: 'part7' },
    ],
  },
  // Duramboros (em055_00), uEm055_00: 0xed2a1c. Coverage 0xed2a1c 1/1.
  em055_00: {
    broken: { part2: [5] },
    rules: [
      { slot: 3, row: 3, broken: 'part2' },
    ],
  },
  // Redhelm Arzuros (em060_04), uEm060_00: 0xf11360, 0xf11988. Coverage 0xf11360 8/16, 0xf11988 2/2.
  // Unread state inputs (arg r1): rows this monster moves in another state are not encoded, so the table is its resting state plus the breaks below.
  em060_04: {
    broken: { part2: [5] },
    rules: [
      { slot: 2, row: 2, broken: 'part2' },
    ],
  },
  // Kecha Wacha (em065_00), uEm065_00: 0xf4a7d4. Coverage 0xf4a7d4 3/4.
  em065_00: {
    broken: { part2: [13, 14] },
    rules: [
      { slot: 3, row: 3, broken: 'part2' },
    ],
  },
  // Seltas Queen (em069_00), uEm069_00: 0xf8c454. Coverage 0xf8c454 4/4.
  em069_00: {
    broken: { part2: [11], part3: [13], part4: [12], part5: [14] },
    rules: [
      { slot: 4, row: 4, broken: 'part2' },
      { slot: 5, row: 5, broken: 'part3' },
      { slot: 6, row: 6, broken: 'part4' },
      { slot: 7, row: 7, broken: 'part5' },
    ],
  },
  // Nerscylla (em070_00), uEm070_00: 0xf9c088. Coverage 0xf9c088 7/7.
  em070_00: {
    broken: { part2: [6, 8] },
    rules: [
      { slot: 0, row: 0, broken: 'part2' },
      { slot: 1, row: 1, broken: 'part2' },
      { slot: 2, row: 2, broken: 'part2' },
      { slot: 3, row: 3, broken: 'part2' },
      { slot: 4, row: 4, broken: 'part2' },
      { slot: 5, row: 5, broken: 'part2' },
      { slot: 6, row: 6, broken: 'part2' },
    ],
  },
  // Shagaru Magala (em072_00), uEm071_00: 0xfadfa0. Coverage 0xfadfa0 2/12.
  em072_00: {
    broken: { part3: [8] },
    rules: [
      { slot: 3, row: 3, broken: 'part3' },
    ],
  },
  // Glavenus (em080_00), uEm080_00: 0xfffc64. Coverage 0xfffc64 8/8.
  // Unread state inputs (E+0xcad0, E+0xcaf4, P+0x1bb): rows this monster moves in another state are not encoded, so the table is its resting state plus the breaks below.
  em080_00: {
    broken: { flag0: [22, 25] },
    rules: [
      { slot: 7, row: 2, broken: 'flag0' },
    ],
  },
  // Hellblade Glavenus (em080_04), uEm080_00: 0xfffd8c -- the dispatcher 0xfffb24 picks it by the variant byte.
  // Read 2026-09-16 by hand. Raven: "If we know Hellblades states and how it impacts its hit zones, ensure the UI
  // reflects this". It moves rows only when [E+0xcaf4] asks, off two bits of the parts object's byte P+0x1bb:
  // 0x10 puts Head and Neck on table-1 rows 0 and 1, and 0x08 puts Tail and Tail Blade on rows 6 and 7. Rows 2-5
  // are never used. The parts driver 0x100acf8 plays the OVERHEAT clips of the throat material (m06_nodo_r,
  // controller +0xcb88, set up by 0x100a6f4 from the material id) while 0x10 holds, and of the tail material
  // (m04_tail, +0xcb84) while 0x08 holds. Those are the Parts panel's Throat "Blasted" item (group 5, parts 70/80
  // = m07_overheat_nodo) and the Tail row's "(Blasted)" items, which draw what "(Heated)" draws and differ only in
  // the clip -- hence `synthClip`. Not read: what raises the two bits in the game.
  em080_04: {
    broken: { throatBlast: [5], tailBlast: [] },
    synthClip: { tailBlast: { XfBA1__m04_tail: 'overheat_Loop' } },
    sections: { throatBlast: 'Overheated', tailBlast: 'Overheated' },
    labels: { throatBlast: 'Throat Blasted', tailBlast: 'Tail Blasted' },
    rules: [
      { slot: 0, row: 0, broken: 'throatBlast' },
      { slot: 1, row: 1, broken: 'throatBlast' },
      { slot: 6, row: 6, broken: 'tailBlast' },
      { slot: 7, row: 7, broken: 'tailBlast' },
    ],
  },
  // Mizutsune (em082_00), uEm082_00: 0x1036380. Coverage 0x1036380 14/14.
  em082_00: {
    broken: { part1: [10], part2: [8] },
    rules: [
      { slot: 5, row: 5, broken: 'part1' },
      { slot: 1, row: 1, broken: 'part2' },
      { slot: 0, row: 0, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 6, row: 6, rage: true },
      { slot: 7, row: 7, rage: true },
    ],
  },
  // Soulseer Mizutsune (em082_04), uEm082_00: 0x1036528. Coverage 0x1036528 11/12.
  // THE P+0x1bb INPUTS ARE ITS GROOMED FUR (read 2026-09-21). Raven: "Soulseer's Hardness values don't take the arm
  // and tail 'groomed' state into account". Bit 4 puts both front legs on their soft table-1 rows -- slot 1 row 2, slot
  // 5 row 6, 52/52/45 and 52/52/35 against the resting 15/15/10 -- ahead of their break rows; bit 8 puts the Tail on
  // row 4, 52/52/45 against 20/20/10, ahead of its sever row. Grooming sets them: in the action group 1 dispatcher
  // (0x1039b58), (1, 0x0e) plays List 9 Motion[2] and at frame 60 sets bit 4 (0x1039348), (1, 0x0f) plays List 9
  // Motion[3] and at frame 60 sets bit 8 (0x103938c), each with a 120 s timer (tune floats 0x75 / 0x76) that clears it
  // (0x1038968). The same bits run the fur's material clips (0x1037fa8: tuya_start / tuya_end, "tuya" being gloss), and
  // the parts driver (0x10384dc) draws the groomed fur from them: g28 (part 80 without the dry fur 90) over g27 once bit
  // 4 is set and both arms' clip states (E+0xcb84, +0xcb88) reach 2, and the tail's g24-g26 over g15-g17 once bit 8 is
  // set and its state (E+0xcb8c) does. Those are the Parts panel's Arm Fur and Tail Fur "Groomed" options, so the keys
  // read them: armGroomed off g28, tailGroomed off the Tail Fur axis, which has no cluster of its own (every Tail
  // option carries both halves). Base Mizutsune's routine (0x1036380) tests neither bit.
  em082_04: {
    broken: { flag0: [17], part1: [10], part2: [8], armGroomed: [28], tailGroomed: [] },
    axis: { tailGroomed: { tailFur: [1] } },
    sections: { armGroomed: 'Groomed', tailGroomed: 'Groomed' },
    rules: [
      { slot: 1, row: 2, broken: 'armGroomed' },
      { slot: 5, row: 6, broken: 'armGroomed' },
      { slot: 4, row: 4, broken: 'tailGroomed' },
      { slot: 5, row: 5, broken: 'part1' },
      { slot: 1, row: 1, broken: 'part2' },
      { slot: 4, row: 3, broken: 'flag0' },
      { slot: 0, row: 0, rage: true },
      { slot: 7, row: 7, rage: true },
    ],
  },
  // Valstrax (em086_00), uEm086_00: 0x109f2e8. Coverage 0x109f2e8 16/16.
  em086_00: {
    rules: [
      { slot: 0, row: 0, rage: true },
      { slot: 1, row: 1, rage: true },
      { slot: 2, row: 2, rage: true },
      { slot: 3, row: 3, rage: true },
      { slot: 4, row: 4, rage: true },
      { slot: 5, row: 5, rage: true },
      { slot: 6, row: 6, rage: true },
      { slot: 7, row: 7, rage: true },
    ],
  },
};
export function meatSwitchOf(monId){ return (monId && ROM_MEAT_SWITCH[monId]) || null; }
// The full table for one state: { rows, from } with `from[slot]` = [table, row]. `groups` is the part
// visibility the Parts panel applied, which is where a break is read. null without rules or a second block.
export function meatTableFor(monId, tables, st){
  const sw = meatSwitchOf(monId);
  if (!sw || !Array.isArray(tables) || tables.length < 2) return null;
  const groups = (st && st.groups) || [];
  // A break's groups are the ones the ROM's own part driver applies, and it applies the variant for the
  // state it is in -- Glavenus' driver names the HEATED broken head (g11), never the cooled one (g8), and
  // the Parts row offers the pair as one "Broken". So a caller that knows the row's options passes
  // `st.broken`, which answers off the option the row has applied; without one, the group itself is read.
  const broken = (st && st.broken) || (k => ((sw.broken || {})[k] || []).some(g => !!groups[g]));
  const rows = tables[0].slice();
  const from = rows.map((_, i) => [0, i]);
  const done = new Set();
  for (const r of sw.rules){
    if (done.has(r.slot) || !tables[1][r.row]) continue;
    if (r.rung && r.rung.indexOf((st && st.rung) | 0) < 0) continue;
    if (r.ladder && r.ladder.indexOf((st && st.ladder) | 0) < 0) continue;
    if (r.rage !== undefined && !!r.rage !== !!(st && st.rage)) continue;
    if (r.mode && r.mode.indexOf((st && st.mode) | 0) < 0) continue;
    if (r.broken && ![].concat(r.broken).every(broken)) continue;
    if (r.intact && [].concat(r.intact).some(broken)) continue;
    rows[r.slot] = tables[1][r.row]; from[r.slot] = [1, r.row]; done.add(r.slot);
  }
  return { rows, from };
}
// WHICH CONTROL THE STATES BELONG TO: the entry's own `modes` where it names them (the Damage Table is then the
// control), the level axis where the rules test a rung, the rage ladder where they test a `ladder` rung (the
// Rage dropdown's value, 0 being its lowest), the Enraged toggle where they test rage, and neither where a break
// is the only thing that moves a row -- then the table simply follows the Parts panel and there is nothing to list.
export function meatAxisOf(monId){
  const sw = meatSwitchOf(monId);
  if (!sw) return null;
  if (Array.isArray(sw.modes) && sw.modes.length > 1) return 'mode';
  if (sw.rules.some(r => r.ladder)) return 'ladder';
  if (sw.rules.some(r => r.rung)) return 'level';
  if (sw.rules.some(r => r.rage !== undefined)) return 'rage';
  return null;
}
// The state a clip STARTS, where the entry maps clips to its `modes` (Khezu): the index, or null when the clip
// is not listed and the state should stay where it is -- unless the map gives a `default` for every other clip
// (Nibelsnarf, where any other action puts the table back). `list` is the viewer's list id, `motion` the N of
// Motion[N]. A key may also name the part of the motion as the viewer splits it ("L2 M10_loop") and the frame of
// that clip the state starts on ("L2 M10_start@40", Congalala); a key with neither matches the whole motion.
// `part` is the clip's suffix ('' for none) and `frame` its frame, 0 at the clip's start.
export function meatModeForMotion(monId, list, motion, part, frame){
  const sw = meatSwitchOf(monId);
  if (!sw || !sw.motionModes) return null;
  for (const [mode, clips] of Object.entries(sw.motionModes)){
    if (!Array.isArray(clips)) continue;
    for (const k of clips){
      const m = /^L(\S+) M(\d+)(?:_(\w+))?(?:@(\d+))?$/.exec(k);
      if (!m || m[1] !== String(list) || +m[2] !== +motion) continue;
      if (m[3] && m[3] !== (part || '')) continue;
      if (m[4] && !((frame || 0) >= +m[4])) continue;
      return +mode;
    }
  }
  return typeof sw.motionModes.default === 'number' ? sw.motionModes.default : null;
}
// THE CLIP A STATE BRINGS, where a state lives in an animation: `modeViews` maps a state to a {list, clip} that holds
// it for its whole length. Raven, 2026-09-17: "Should the Hitzone table show the animation when selecting the Belly
// Pump" -> "Add the animation based switching". Congalala's Belly Pump loop, Khezu's first List 5 loop (a Ceiling
// clip) and Nibelsnarf's flailing loop.
export function meatModeView(monId, mode){
  const sw = meatSwitchOf(monId);
  const v = sw && sw.modeViews && sw.modeViews[mode];
  return (v && v.list !== undefined && v.clip) ? { list: String(v.list), clip: String(v.clip) } : null;
}
// Whether any of a monster's clip keys waits for a frame, so its state has to be read again as the clip plays.
export function meatFrameGated(monId){
  const sw = meatSwitchOf(monId);
  return !!(sw && sw.motionModes &&
            Object.values(sw.motionModes).some(v => Array.isArray(v) && v.some(k => /@\d+$/.test(k))));
}
// Every break key a rule tests, so the panel lists only breaks that move a row.
export function meatBreakKeys(monId){
  const sw = meatSwitchOf(monId);
  if (!sw || !sw.broken) return [];
  const used = new Set();
  for (const r of sw.rules){ [].concat(r.broken || [], r.intact || []).forEach(k => used.add(k)); }
  return Object.keys(sw.broken).filter(k => used.has(k));
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

// ---- a hit zone as the ROM defines it ----------------------------------------------------------------
// Raven, 2026-09-15: "I would like to be able to highlight different slots of the hit zone table. By this I
// mean not only the table, but the part of the monster. The high light of the monster however I want to be
// based on the defined zone, not the heatmapping." The heat map is a BAKE. build-hitzones.py gives every vertex
// ONE capsule by a rule the viewer chose (same bone first, then smallest containing, else nearest -- the game's
// own overlap rule is not decoded), so it can show a zone only as the share of the SURFACE it won, and nothing
// of a zone no vertex won. What the game defines is the rBodyData record: a sphere or a capsule hung off one or
// two joints, carrying the damage-table row it reports (record+6) and the .dtt part record (+8). hitzones.json's
// `capsules` are those records, unbaked, and this draws them.
//
// Placement is the bake's, derived and proved there in bind pose: a point is its joint's world matrix applied to
// point / 100, and the radius is radius / 100 in glb units --
//     shape 0  a sphere at A on boneA        shape 1  A..B, both in boneA's space
//     shape 2  A in boneA's space, B in boneB's
// Here the joint matrices are the POSED ones, so a capsule rides its joints through a clip, as its record
// attaches it. Bone 255 (not bone-attached, 72 records in the library) and shape 6 (2 records) cannot be
// placed; they are counted and left out, not guessed. Not read: whether a joint's own scale reaches a radius
// in the game -- the radius here takes only the model's scale.
//
// Each capsule is drawn twice off one set of placement uniforms: a faint pass that ignores depth, so a zone
// inside the body still shows, and a stronger depth-tested pass, so where it breaks the surface reads as
// nearer. The shape is made in the vertex shader from a unit CapsuleGeometry -- the top cap's vertices go to
// B, the bottom cap's to A -- so a capsule spanning two joints stretches with them and nothing is rebuilt per
// frame.
const ZONE_VS = `
uniform vec3 uA;
uniform vec3 uB;
uniform float uR;
uniform mat3 uBasis;
varying vec3 vN;
varying vec3 vV;
void main(){
  bool top = position.y > 0.0;
  vec3 local = position - vec3(0.0, top ? 0.5 : -0.5, 0.0);
  vec3 world = (top ? uB : uA) + uBasis * (local * uR);
  vec4 mv = viewMatrix * vec4(world, 1.0);
  vN = normalize(mat3(viewMatrix) * (uBasis * normal));
  vV = projectionMatrix[3][3] == 1.0 ? vec3(0.0, 0.0, 1.0) : -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const ZONE_FS = `
uniform vec3 uColor;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vV;
void main(){
  float edge = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  gl_FragColor = vec4(min(uColor * (0.8 + 0.6 * edge), vec3(1.0)), uAlpha * (0.35 + 0.65 * edge * edge));
}`;
// THE CAPSULE COLOUR IS NOT THE THEME'S. Raven, 2026-09-17: "We may need to have the capsules stay the same color
// between themes. The heatmap colors don't change, but the theme colors do. Meaning at some point the capsules will
// be similar to heat map colors." They took the theme's --cta, the accent's complement, so any theme could put them
// on a heat colour. #ff3399 was the first fixed colour, then white: "Make capsules white."
//
// THEN A CHOICE, and one choice that changes with the heat map. Raven, 2026-09-17: "Giving people options might not
// be a bad idea. Check against heat mapping on.", then "Another option we can do is have the color change between
// tables". Measured against the heat map AS SHOWN: applyHeatmap's colours are vertex colours, which three reads as
// linear and shows through the sRGB transfer, so the ramp's teal 0.35 0.72 0.62 is on screen as 160 221 206 and the
// Extract white as 241 241 243 (read back off a headless frame). The capsule shaders write their colour as given.
// The distances first noted here were taken against the colours as written, not as shown, and are replaced by these.
// CIEDE2000, where about 2 is a just-visible difference and 20 or more very distinct. EDGE is the capsule colour to
// the nearest colour that heat map paints: the damage ramp at 201 points, the extract or sharpness colours, the dark
// of a slot with none and the grey of an attached body with no zones. MIDDLE is a capsule's middle, its two passes
// over a colour (about 0.77 of it plus 0.19 of the capsule), to that colour, at the worst colour.
//                   damage ramp     Kinsect Extract   Hardness
//                   edge  middle    edge  middle      edge  middle
//   White           19.1   2.7       3.1   1.9         1.8   2.1
//   Magenta         28.8  11.7      30.4  12.7        17.3   8.2    (sharpness purple)
//   Cyan            13.0   4.4      24.8   6.4        25.0   5.8    (sharpness green)
//   Violet #bb00cc  29.2  10.4      26.1  12.3        25.7   8.8
//   Pink #ff3399    15.5   5.3      17.5   6.1        17.7   6.3
//   Lime #80ff00    20.0   7.5      17.6   5.8        15.5   5.1
// So white all but vanishes on the white zones of the Extract and Hardness maps, and the old theme colour #19e0d2 sat
// 10.2 from the ramp. Violet is the only colour listed at 25 or more on every map, and the best worst case of 72 hues
// x 4 tones; its cost is that it is darker. Deviljho's legs, drawn in each of these with the heat map off, Cut,
// Extract and Hardness, read the same way: on Hardness a cyan capsule's middle turned green over the yellow zones.
// AUTO takes the colour that stands out most on the heat map being drawn: magenta on the damage and Extract maps,
// violet on Hardness, where magenta sits close to the purple sharpness and violet leads at both the edge and the
// middle. On the damage map violet is 0.4 ahead at the edge and 1.3 behind in the middle, so magenta keeps it. With no
// heat map on it is white, Raven's pick.
export const ZONE_CAPSULE_COLOURS = [
  { key: 'white',   name: 'White',   rgb: [1.0, 1.0, 1.0] },
  { key: 'magenta', name: 'Magenta', rgb: [1.0, 0.0, 1.0] },
  { key: 'cyan',    name: 'Cyan',    rgb: [0.0, 1.0, 1.0] },
  { key: 'violet',  name: 'Violet',  rgb: [0.733, 0.0, 0.8] },
  { key: 'pink',    name: 'Pink',    rgb: [1.0, 0.2, 0.6] },
  { key: 'lime',    name: 'Lime',    rgb: [0.5, 1.0, 0.0] },
];
export const ZONE_CAPSULE_AUTO = 'auto';
const ZONE_AUTO_BY_MAP = { none: 'white', damage: 'magenta', extract: 'magenta', hardness: 'violet' };
export const ZONE_CAPSULE_RGB = ZONE_CAPSULE_COLOURS[0].rgb;
// choice: a ZONE_CAPSULE_COLOURS key, or anything else for Auto. heat: the heat map on screen, '' for none.
// Returns { key, rgb } -- the colour drawn.
export function zoneCapsuleColour(choice, heat){
  let c = ZONE_CAPSULE_COLOURS.find(x => x.key === choice);
  if (!c){
    const map = !heat ? 'none' : heat === 'extract' ? 'extract' : /^hardness-/.test(heat) ? 'hardness' : 'damage';
    c = ZONE_CAPSULE_COLOURS.find(x => x.key === ZONE_AUTO_BY_MAP[map]);
  }
  return { key: c.key, rgb: c.rgb.slice() };
}
// records: hitzones.json capsule rows [slot, part, shape, boneA, boneB, radius, ax, ay, az, bx, by, bz].
// opts.color: [r, g, b] 0..1, written as given. Returns a Group for the scene (not the monster, so no
// traversal of the model meets it), with userData.placed / skipped, readback() and dispose().
export function zoneCapsules(root, records, opts = {}){
  const group = new THREE.Group();
  group.name = 'zone-capsules';
  const bones = new Map();
  for (const b of gidBonesOf(root)) bones.set(b.gid, b.leaf || b.node);
  const geo = new THREE.CapsuleGeometry(1, 1, 6, 24);
  const rgb = opts.color || ZONE_CAPSULE_RGB;
  const color = { value: new THREE.Vector3(rgb[0], rgb[1], rgb[2]) };
  const mats = [], live = [];
  const s = new THREE.Vector3(), y = new THREE.Vector3(), x = new THREE.Vector3(), z = new THREE.Vector3();
  let skipped = 0;
  for (const c of records || []){
    const [slot, part, shape, a, b, r, ax, ay, az, bx, by, bz] = c;
    const ja = bones.get(a), jb = shape === 2 ? bones.get(b) : ja;
    if (!(shape === 0 || shape === 1 || shape === 2) || !ja || !jb){ skipped++; continue; }
    const u = { uA: { value: new THREE.Vector3() }, uB: { value: new THREE.Vector3() }, uR: { value: 0 },
                uBasis: { value: new THREE.Matrix3() }, uColor: color };
    const la = new THREE.Vector3(ax, ay, az).multiplyScalar(0.01);
    const lb = new THREE.Vector3(bx, by, bz).multiplyScalar(0.01);
    const place = () => {
      u.uA.value.copy(la).applyMatrix4(ja.matrixWorld);
      if (shape === 0) u.uB.value.copy(u.uA.value);
      else u.uB.value.copy(lb).applyMatrix4(jb.matrixWorld);
      u.uR.value = r * 0.01 * s.setFromMatrixColumn(root.matrixWorld, 0).length();
      y.subVectors(u.uB.value, u.uA.value);
      const len = y.length();
      if (len < 1e-6) y.set(0, 1, 0); else y.divideScalar(len);
      x.set(Math.abs(y.y) < 0.99 ? 0 : 1, Math.abs(y.y) < 0.99 ? 1 : 0, 0).cross(y).normalize();
      z.crossVectors(x, y);
      u.uBasis.value.set(x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z);
    };
    // the faint pass through the body first, then the surface pass over it
    for (const [through, alpha, order] of [[true, 0.2, 9000], [false, 0.5, 9001]]){
      const m = new THREE.ShaderMaterial({ vertexShader: ZONE_VS, fragmentShader: ZONE_FS,
        uniforms: Object.assign({ uAlpha: { value: alpha } }, u),
        transparent: true, depthWrite: false, depthTest: !through, side: THREE.FrontSide });
      const mesh = new THREE.Mesh(geo, m);
      mesh.frustumCulled = false;             // the vertex shader places it; the geometry's bounds are the unit capsule
      mesh.renderOrder = order;
      // placed as the renderer reaches it, after the frame's world matrices -- the posed joints -- are current
      if (through) mesh.onBeforeRender = place;
      mats.push(m);
      group.add(mesh);
    }
    live.push({ slot, part, shape, a, b, u, place });
  }
  group.userData.placed = live.length;
  group.userData.skipped = skipped;
  // placed afresh from the joints' current world matrices, so it answers with nothing being rendered
  group.userData.readback = () => live.map(l => (l.place(), { slot: l.slot, part: l.part, shape: l.shape, a: l.a, b: l.b,
    A: l.u.uA.value.toArray().map(v => +v.toFixed(3)), B: l.u.uB.value.toArray().map(v => +v.toFixed(3)),
    r: +l.u.uR.value.toFixed(3) }));
  group.userData.setColor = c => { if (c) color.value.set(c[0], c[1], c[2]); };
  group.userData.getColor = () => color.value.toArray().map(v => +v.toFixed(3));
  group.userData.dispose = () => { geo.dispose(); for (const m of mats) m.dispose(); };
  return group;
}
