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
import { loadGlb, getTexture, loader, poseCache, bust } from './assets.js';
import { skeletonClone, meshGroupId } from './skeleton.js';
import { createMaterial, setSpecTexture, setEnvTexture, applyRomUv, allMats,
         MAT_FPS, stepMaterialAnim } from './material.js';
import { specFor, refForGlb } from './materials-db.js';
import { createRomMaterial, enableRomCore, romCoreEnabled,
         enableRomAmbient, romAmbientEnabled, setSHAmount,
         enableRomSpecular, romSpecularEnabled, setRomSpecularAmount, anchorMisses,
         enableRomPhong, romPhongEnabled,
         setCutoutSolid, cutoutSolidCount, cutoutAnchorMisses } from './rom/material.js';
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
         setEffectScale, setEffectRage, effectAutoOnRage } from './rom/effect-mounts.js';
// The proof-effect models a monster hangs on a joint. Felyne only on shipped data; the module
// header says why, and why it is off by default.
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
  });
  for (const m of mine){
    let i = monsterMats.indexOf(m); if (i >= 0) monsterMats.splice(i, 1);
    i = allMats.indexOf(m); if (i >= 0) allMats.splice(i, 1);
    i = refractMats.indexOf(m); if (i >= 0) refractMats.splice(i, 1);
    releaseBiased(m);
    m.dispose();
  }
  // the per-arm texture copies stepArmSlime makes are this monster's own, unlike the cached originals
  for (const tex of root.userData.armSlimeMaps || []) if (tex) tex.dispose();
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
export const ROM_SPAWN_CLIP = {
  em043_05: { XfB__m02_body_k: 'Angry_Start' },   // Savage Deviljho: eyes and body glow, always lit
  em063_05: { XfB__m01_nenkin_arm_l: 'Red_to_Yellow', XfB__m02_nenkin_arm_r: 'Red_to_Yellow',
              XfB__m03_nenkin_body: 'Red_to_Yellow', XfB__m04_nenkin_tail: 'Red_to_Yellow' },
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
      ? createRomMaterial({ srcName, rom, wire: !!(ctx && ctx.wire) })
      : createMaterial({ srcName, rom, alphaCut: 0, noTint: true,
                                 unlit: !!(rom && rom.cls && rom.cls !== 'Std'),
                                 wire: !!(ctx && ctx.wire) });
    const romCore = mat.userData.romCore === true;
    o.material = mat; allMats.push(mat); monsterMats.push(mat); mats.push(mat);
    if (mat.userData.renderOrder) o.renderOrder = mat.userData.renderOrder;
    const albedo = (rom && rom.albedo) || fallback(/_bm$/i);
    if (albedo) jobs.push(getTexture(albedo).then(t => {
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
          jobs.push(getTexture(list[i - 1]).then(t => { mat.userData.texSwap[i - 1] = t; }));
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
  // KHEZU'S CHARGE DOES NOT SWAP THE VEIN LAYER, and the entry that said it did is gone.
  //
  // Raven, 2026-09-10: "The veins remain red during the charging state attacks." He is right, and
  // the ROM agrees once you read far enough. Khezu has THREE Taiden entry paths, not one, and they
  // differ in exactly one call:
  //
  //     0xd1ec1c   Body_Taiden_Repeat + Alpha_Taiden_Repeat, setMaterialAt (0x88db20), Taiden_start
  //     0xd1ed30   Body_Taiden_Repeat + Alpha_Taiden_Repeat, NO setMaterialAt, no Taiden_start
  //     0xd1ee48   Body_Taiden_Repeat + Alpha_Taiden_Repeat, setMaterialAt, Taiden_start
  //
  // The middle one electrifies the BODY and leaves the vein layer alone, so m03_blood keeps drawing
  // and the veins stay red. That is the state he is describing, and this viewer had implemented the
  // other one.
  //
  // Why the swapped state cannot be what he sees, which is what forced the re-read: m03_blood and
  // XfBA_A0__m04__taiden are the SAME material twice over -- identical flag word 91950000, identical
  // features, identical CBMaterial, and both bind em003_00_03_BM as the albedo and em003_00_02_BM as
  // the blend map (checked in the .mrl itself, not inferred). They differ in two things only: the
  // blend equation, and fEmissionColor 0 against 2. And BSRevSubAlpha is literally BSAddAlpha with
  // one more bit set -- 0x04020802 against 0x00020802, the same SRC_ALPHA/ONE factors and only the
  // equation changed. The blend map is teal with ZERO red-dominant texels, peaking at (19,146,147).
  // Reverse-subtracting teal is what MAKES the veins red; adding the same teal can only make them
  // cyan. Measured in the viewer: calm the layer contributes (-6, -25, -23) and reads red at
  // (102, 84, 76); charged it contributed (+16, +57, +53) and read cyan at (110, 137, 125).
  //
  // So no rendering fix could ever have produced red here. The state was wrong, not the shading.
  // The body clips still run -- Body_Taiden_Repeat drives fAlbedoColor to (0.28, 0.322, 0.42) and
  // fEmissionColor to (0.16, 0.184, 0.24), both blue -- so the charge still reads electric, on the
  // body, which is where the ROM puts it.
  //
  // Paths A and C remain undecoded as states: they DO swap, so something in Khezu's repertoire shows
  // cyan veins. Nothing here selects them, and inventing a second toggle for a state whose trigger
  // has not been read would be guessing.
};
// Hang the swap materials for `state` on the meshes that carry the originals, or put the originals
// back when the state has none. The ROM's own mechanism is different -- it replaces the entry in
// the model's material array and refreshes the mesh list (0x88db20) -- and this reaches the same
// place by retargeting the three.js meshes instead.
export function applyMaterialSwap(root, state){
  const table = root && root.userData && root.userData.matSwap;
  if (!table) return 0;
  const want = (state && table[state]) || null;
  let n = 0;
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;
    if (o.userData.matOrig === undefined){
      o.userData.matOrig = o.material;
      o.userData.orderOrig = o.renderOrder || 0;
    }
    const orig = o.userData.matOrig;
    const next = (want && orig && want[orig.name]) || orig;
    if (o.material === next) return;
    o.material = next;
    o.renderOrder = (next.userData && next.userData.renderOrder) || o.userData.orderOrig || 0;
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
// The clip a monster's LEVEL rung names, or undefined where no table says (the caller then falls back
// to the Rage ladder). A rung past the table's end takes its last entry.
export function levelClipFor(monId, level){
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
// Materials that carry an enraged clip -- the layers the game lights when a monster rages.
export function enrageMaterials(root){ return materialsWithClip(root, ENRAGE_CLIPS); }
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
const STATES = ['enraged', 'charged'];
function clipPicker(state, monId, tState, prev, levelClip){
  const pin = (monId && ROM_SPAWN_CLIP[monId]) || null;
  const timed = typeof tState === 'number';
  return (clips, rom, tSec) => {
    // A SUPPRESSED clip keeps its slot and loses only its NAME, so every name-matched route below
    // skips it while `auto`, the index ladder and stepMaterialAnim's own indexing are untouched.
    const ban = suppressedFor(monId, rom && rom.name);
    if (ban) clips = clips.map(c =>
      (c && typeof c.name === 'string' && ban.has(c.name.toLowerCase())) ? { ...c, name: null } : c);
    let ci = -1;
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
    if (ci < 0 && timed && STATE_NAMES[state]){
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
        const t = STATE_NAMES[st];
        return !!t && (byName(t.start) >= 0 || byName(t.steady) >= 0 || byName(t.end) >= 0);
      };
      const held = i => (i >= 0 && !clips[i].loop && clips[i].frames
                         ? (tSec - tState) * MAT_FPS < clips[i].frames : false);
      const tbl = STATE_NAMES[state];
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
        if (!STATES.some(takesPart)) { /* fall through to the general rules */ }
        else {
          const r = restIdx();
          return r >= 0 ? r : -1;      // -1 is the material's OWN authored values
        }
      } else {
        // Leaving a state runs THAT state's end clip, alone in slot 0 -- 0xd1e698 and 0xd1e7a0
        // both call clearAllSlots first -- and only for as long as the clip lasts.
        const prevTbl = STATE_NAMES[prev];
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
        if (STATES.some(takesPart)) return -1;
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

export function stepMatAnim(root, tSec, state, monId, tState, prev, levelClip){
  const pick = clipPicker(state, monId, tState, prev, levelClip);
  // ONE evaluator for both paths. A ROM-core material is a stock three.js material -- the technique
  // decides which class, not the blend state -- so the shared evaluator's writes land exactly as
  // they always have. fEmissionColor now reaches the 47 lit-technique additive materials that used
  // to be MeshBasicMaterial, because those are MeshStandardMaterial now.
  const n = stepMaterialAnim(root, tSec, pick);
  stepSpecularColour(root, tSec, pick);
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
    const v = t.offsetV[Math.min(lv[slot], t.offsetV.length - 1)];
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
// THAT SELECTOR IS NOT IDENTIFIED. It reads a signed byte at +0x0f of the pointer at +0xa4,
// returns 5/3/1 for those values and 0 for anything else, and only 5 reaches 0.27 -- that is the
// whole of what is known. The values 1/3/5 resemble a rank ladder, which is why a previous label
// called this Monster Level and cited cOtQuestExpBias for '0 Village Low, 1 Low, 3 High, 5 G'.
// Checked 2026-09-08 and FALSE: cOtQuestExpBias is the Palico quest-EXP table, its level fields
// are mLvVillageLow / mLvLow / mLvHigh -- three, no G -- and it carries no 0/1/3/5 mapping.
// So the keys here are the floors themselves. Do not name this control after what it might pick.
//
// A CANDIDATE, strongly evidenced but not proven (2026-09-08). Quests ship as rQuestData, 3,451
// files, every one 329 bytes and every one starting with the same 4 bytes 00 00 4b 43 -- a
// constant header, so the loaded struct is very likely the file + 4. Byte +0x13 of the file is
// then struct +0x0f, which is exactly where the selector reads. Scanning all 329 offsets over all
// 3,451 files, +0x13 is the ONLY byte whose values are {0, 1, 3, 5} with a real spread
// (0 x1142, 1 x266, 3 x1217, 5 x826); every other offset in that value set is >90% zero with a
// handful of exceptions. Four agreements -- header, offset, value set, distribution.
// WHAT WOULD FINISH IT: read the rQuestData loader and confirm it maps file+4 to struct+0, or
// find the write to [singleton+0xa4]. Until then this stays a candidate and the UI stays generic:
// the byte is quest-scoped, which is enough to know it is NOT per-monster.
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
// which is what Raven saw as a good hit zone that still bounces. That bit sits on a record this
// decode has not traced, so no threshold model over the multiplier alone is complete.
export function hardnessLevel(hz, t, tier){
  return deflectLadder(hz, t)[tier || 2];
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
