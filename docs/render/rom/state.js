// GPU RENDER STATE, TAKEN FROM THE ROM'S OWN STATE RECORDS.
//
// MHGU is an NVN (Switch) build. nDraw's state-object factory at 0xbd4198 dispatches on the MFX
// record's kind word and hands each constructor `record + 0x18` -- i.e. MFX record WORD 6 -- as the
// descriptor, which is then decomposed bit by bit and fed to named nvn* entry points. That is what
// makes every value here checkable rather than inferred from a record's NAME:
//
//     kind 4 -> 0xbd4320  BlendState         kind 5 -> 0xbd4338  DepthStencilState
//     kind 6 -> 0xbd4350  RasterizerState
//
// Every constant below was decoded straight out of romfs/nativeNX/system/app_shader/
// AppShaderPackage.mfx on 2026-09-07 and is quoted with the word it came from. Only the records the
// 570 monster materials actually use are here; anything else throws rather than guessing, because a
// silently-wrong blend mode is exactly the class of fault this module exists to end.
//
// This module is MONSTER-OWNED. It deliberately does not live in the shared material.js, which
// syncs one-way from the Armor Viewer.
import * as THREE from 'three';

// ---- BLEND -------------------------------------------------------------------------------------
// nDraw::BlendState::ctor 0xafdaf0, descriptor = MFX words 6 and 7:
//   w6 bit 0      alpha-to-coverage (stored at this+0x88, passed to no blend call)
//   w6 bits 1..8  blend enable -- collapsed to ONE bool for all 8 targets
//                 (`ands r2,r0,#0x1fe / movwne r2,#1`)
//   w6 bits 9..16 RGB SOURCE factor    w6 bits 17..24 RGB DEST factor
//   w6 bits 25..31 RGB EQUATION (7 bits, not a single reverse-subtract flag)
//   w7 bits 0..7  ALPHA SOURCE         w7 bits 8..15  ALPHA DEST
//   w7 bits 16..22 ALPHA EQUATION
//
// The four records the monsters use, read from the package:
//
//   BSSolid        w6=00000200 w7=00000001   enable 0
//   BSBlendAlpha   w6=000a0802 w7=00000001   RGB 4/5/0
//   BSAddAlpha     w6=00020802 w7=00000001   RGB 4/1/0
//   BSRevSubAlpha  w6=04020802 w7=00000001   RGB 4/1/2
//
// factor 1 = ONE, 4 = SRC_ALPHA, 5 = INV_SRC_ALPHA; equation 0 = ADD, 2 = REV_SUB.
//
// THE PART BOTH VIEWERS HAVE ALWAYS MISSED: w7 is 0x00000001 on ALL FOUR, which decodes as
// ALPHA = ONE / ZERO / ADD -- the destination alpha is REPLACED by the source alpha, not blended.
// three.js expresses that with blendSrcAlpha / blendDstAlpha / blendEquationAlpha, and neither app
// sets them, so both inherit the RGB factors for alpha. It does not change the visible colour when
// compositing onto an opaque canvas; it is wrong wherever destination alpha is READ, which here is
// the transparent screenshot path and the chroma/gap-detection debug modes.
// (81 of the 142 blend records shipped image-wide give alpha different factors from RGB.)
export const BLEND = {
  BSSolid:       { enabled: false },
  BSBlendAlpha:  { enabled: true, src: 'SRC_ALPHA', dst: 'INV_SRC_ALPHA', eq: 'ADD' },
  BSAddAlpha:    { enabled: true, src: 'SRC_ALPHA', dst: 'ONE',           eq: 'ADD' },
  BSRevSubAlpha: { enabled: true, src: 'SRC_ALPHA', dst: 'ONE',           eq: 'REV_SUB' },
};
// every record above carries the same alpha triple
const ALPHA_ONE_ZERO_ADD = { src: 'ONE', dst: 'ZERO', eq: 'ADD' };
// WHAT WE ACTUALLY SET, AND WHY IT IS NOT THE ROM'S TRIPLE.
// ONE / ZERO / ADD means destination alpha is REPLACED by the source's. On the game's framebuffer
// that is free: it is opaque and nothing ever reads its alpha. Our canvas is transparent, and its
// alpha IS read -- by the browser compositing the canvas over the CSS backdrop, and by the two
// capture modes that keep it (a screenshot with the backdrop off, and a frame sequence). Replacing
// coverage there means any surface with alpha < 1 drawn over the body PUNCHES ITS OWN ALPHA THROUGH
// the body behind it.
// Raven, 2026-09-09: "when capturing, I notice some parts become transparent". Measured on Khezu,
// whose three CustomBlending materials are the ones in play: with the ROM triple, 35,243 model
// pixels came out part-transparent and 22,012 of those below half alpha; with the triple below,
// 4,386 and 1,380 -- and 30,886 pixels went fully opaque. What is left is silhouette antialiasing.
// So the ALPHA channel uses standard "over", which can only ever add coverage. RGB is untouched:
// blendSrcAlpha / blendDstAlpha / blendEquationAlpha do not affect the colour channels, so every
// blend record still composites its colour exactly as decoded above.
// THIS IS APP BEHAVIOUR, NOT THE ROM. The decode above stands as the record of what the hardware
// did; we deviate only where the ROM's choice has no meaning and ours does.
const ALPHA_COVERAGE_OVER = { src: 'ONE', dst: 'INV_SRC_ALPHA', eq: 'ADD' };

const F = {
  ONE:            THREE.OneFactor,
  ZERO:           THREE.ZeroFactor,
  SRC_ALPHA:      THREE.SrcAlphaFactor,
  INV_SRC_ALPHA:  THREE.OneMinusSrcAlphaFactor,
};
const EQ = {
  ADD:     THREE.AddEquation,
  REV_SUB: THREE.ReverseSubtractEquation,
};

// ---- DEPTH -------------------------------------------------------------------------------------
// nDraw::DepthStencilState::ctor 0xcc893c, descriptor = MFX word 6:
//   bit 0     depth TEST   -> nvnDepthStencilStateSetDepthTestEnable  (`and r1,r6,#1`)
//   bit 1     depth WRITE  -> nvnDepthStencilStateSetDepthWriteEnable (`ubfx r1,r6,#1,#1`)
//   bits 2..5 compare function, into an 8-entry table as (value + 1)
//   bit 6     stencil test enable
//
// That single ubfx is the SOLE producer of the argument to SetDepthWriteEnable in the whole 20 MB
// image, so depth write is bit 1 and is nothing else. Read from the package:
//
//   DSZTest      w6=007fff8d  test 1, write 0, cmp 3
//   DSZTestWrite w6=007fff8f  test 1, write 1, cmp 3
//
// They differ in bit 1 alone. Compare index 3 is LEQUAL on both, and since SetDepthRange is never
// called (default 0 -> 1) with the device in NEAR_IS_ZERO mode, window depth grows away from the
// eye -- which is what makes a NEGATIVE bias below pull geometry toward the viewer.
export const DEPTH = {
  DSZTest:                  { test: true, write: false },
  DSZTestStencilWrite:      { test: true, write: false },
  DSZTestWrite:             { test: true, write: true  },
  DSZTestWriteStencilWrite: { test: true, write: true  },
};

// ---- CULL --------------------------------------------------------------------------------------
// nDraw::RasterizerState 0xb01598, descriptor = MFX word 6, a bit-packed D3D11_RASTERIZER_DESC:
//   bits 0..2 FillMode   bits 3..5 CullMode   bit 6 FrontCounterClockwise   bit 7 DepthClipEnable
//
// CullMode reaches nvnPolygonStateSetCullFace through an IDENTITY table, so the field value IS the
// NVN face enum. Read from the package: RSMeshCN 0x281 -> 0, RSMeshCF 0x289 -> 1, RSMesh 0x291 -> 2.
//
// WINDING, which a viewer could not notice being wrong: bit 6 (FrontCounterClockwise) is 0 in every
// shipped record, and the device runs D3D conventions -- nvnDeviceSetWindowOriginMode(dev,1) at
// 0x866a30 and nvnDeviceSetDepthMode(dev,1) at 0x866a48. Front faces are therefore clockwise in a
// y-DOWN window space, which is the same triangle set as counter-clockwise in glTF's y-UP space.
// So cull-back == THREE.FrontSide, and the existing map was right.
export const CULL = { 0: THREE.DoubleSide, 1: THREE.BackSide, 2: THREE.FrontSide };
export const CULL_BY_NAME = { none: THREE.DoubleSide, front: THREE.BackSide, back: THREE.FrontSide };

// ---- DEPTH BIAS --------------------------------------------------------------------------------
// Rasterizer w7 = DepthBias (constant/units, signed int32), w8 = DepthBiasClamp,
// w9 = SlopeScaledDepthBias. The binder at 0xbbe71c computes
//     (factor, units, clamp) = (w9 * 3.0, (float)(int32)w7, w8)  -> nvnCommandBufferSetPolygonOffsetClamp
// and w8/w9 are ZERO in all 22 shipped rasterizer records, so there is no slope term and no clamp
// anywhere in the game: polygonOffsetFactor = 0 is exact, not an approximation.
//
// THE LADDER IS NOT LINEAR, which both material.js's and mfx.py's comments still get wrong. Read
// from the package: Bias1 -32, Bias5 -160, Bias8 -256, Bias9 -320, Bias10 -384, Bias12 -512.
// So -32 per step to N=8, then -64 per step. 1,136 of the 2,485 biased material instances
// image-wide sit on the non-linear half. We read the raw signed word rather than N, so the ladder
// is documentation rather than arithmetic here -- but a reader who "corrects" this to -32*N would
// break exactly those 1,136.
export const BIAS_UNITS = {
  RSMesh: 0, RSMeshCN: 0, RSMeshCF: 0,
  RSMeshBias1: -32, RSMeshBias2: -64, RSMeshBias3: -96, RSMeshBias4: -128,
  RSMeshBias5: -160, RSMeshBias6: -192, RSMeshBias7: -224, RSMeshBias8: -256,
  RSMeshBias9: -320, RSMeshBias10: -384, RSMeshBias11: -448, RSMeshBias12: -512,
};

// Raw ROM units are not screen units. The viewer re-expresses a bias step as a fixed metric push
// (setBiasUnitsPerStep, calibrated 2026-09-03) because raw units broke at distance -- the push has
// to be recomputed as the camera moves, which is why the biased materials are kept in a registry
// rather than baked once. material.js keeps its own private `biasMats` for the stock-material path;
// a ROM-core material never joins that one, so without this registry the depth-bias slider would
// simply stop working on every monster.
let unitsPerStep = 32;
const biased = new Set();
export function setBiasUnitsPerStep(u){
  unitsPerStep = u;
  for (const m of biased) m.polygonOffsetUnits = biasUnitsFor(m.userData.romBias);
}
export function biasUnitsFor(biasWord){ return (biasWord / 32) * unitsPerStep; }
export function releaseBiased(m){ biased.delete(m); }

// ---- APPLY -------------------------------------------------------------------------------------
// `st` is a row of materials.json's shared `state` table: { bs, ds, rs, bias, cull, blend }.
export function applyRomState(mat, st){
  if (!st) return mat;

  const b = BLEND[st.bs];
  if (b === undefined) throw new Error('rom/state: unknown blend record ' + st.bs);
  if (!b.enabled){
    mat.blending = THREE.NoBlending;
    mat.transparent = false;
  } else {
    mat.blending = THREE.CustomBlending;
    mat.blendSrc = F[b.src]; mat.blendDst = F[b.dst]; mat.blendEquation = EQ[b.eq];
    // the half neither app has ever set -- see the notes on w7 and on coverage above
    mat.blendSrcAlpha = F[ALPHA_COVERAGE_OVER.src];
    mat.blendDstAlpha = F[ALPHA_COVERAGE_OVER.dst];
    mat.blendEquationAlpha = EQ[ALPHA_COVERAGE_OVER.eq];
    mat.transparent = true;
  }

  const d = DEPTH[st.ds];
  if (d === undefined) throw new Error('rom/state: unknown depth record ' + st.ds);
  mat.depthTest = d.test;
  mat.depthWrite = d.write;

  const side = CULL_BY_NAME[st.cull];
  mat.side = (side === undefined) ? THREE.DoubleSide : side;

  // materials.json ships the decoded signed word as `bias`; fall back to the record name so a row
  // without it still lands on the ROM's ladder rather than on zero.
  const units = (typeof st.bias === 'number') ? st.bias : (BIAS_UNITS[st.rs] || 0);
  mat.userData.romBias = units;
  if (units){
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = 0;              // w9 is zero in every shipped record
    mat.polygonOffsetUnits = biasUnitsFor(units);
    biased.add(mat);
  } else {
    mat.polygonOffset = false;
    mat.polygonOffsetFactor = 0;
    mat.polygonOffsetUnits = 0;
  }
  return mat;
}
