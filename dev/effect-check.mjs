// Replays call vectors recorded from MHGU's own code (C:\MHGU-Extract\efx\vectors.py) against the
// JS translations in docs/render/rom/effect/. A translation passes a vector when, loaded with the
// bytes the game read, it reads nothing else, writes exactly the bytes the game wrote, and returns
// what the game returned.
//
//   node dev/effect-check.mjs <vectors.json> [fn ...]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Mem, Unverified, bitsf32 } from '../docs/render/rom/effect/mem.js';
import * as life from '../docs/render/rom/effect/life.js';
import * as curve from '../docs/render/rom/effect/curve.js';
import * as motion from '../docs/render/rom/effect/motion.js';
import * as model from '../docs/render/rom/effect/model.js';
import * as emit from '../docs/render/rom/effect/emit.js';
import * as spawn from '../docs/render/rom/effect/spawn.js';
import * as runtime from '../docs/render/rom/effect/runtime.js';
import * as billboard from '../docs/render/rom/effect/billboard.js';
import * as polyline from '../docs/render/rom/effect/polyline.js';
import * as owner from '../docs/render/rom/effect/owner.js';
import { newEffect, startEffect, managerRandom, random, internals as C } from '../docs/render/rom/effect/construct.js';
import { loadEffectList, loadEffectAnim, internals as L } from '../docs/render/rom/effect/load.js';
import { Scratch } from '../docs/render/rom/effect/motion.js';
import { Cpu, call, lifted, POISON } from '../docs/render/rom/effect/cpu.js';
import '../docs/render/rom/effect/draw.js';
import '../docs/render/rom/effect/prim.js';

// address -> [translation, arguments from the vector, what to compare on return]
const TABLE = {
  '0xaeae40': [life.updateLife, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xaea784': [curve.curveTime, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xaec7e0': [curve.curveTimeFromHeader, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xaf82f4': [curve.evalCurve3, v => [v.args[0], v.args[1], v.args[2], v.args[3], stackArg(v, 0)], null],
  '0xaf7bc8': [curve.cubicSegment, v => [v.args[0], v.args[1], v.args[2], v.args[3], stackArg(v, 0), stackArg(v, 1), s0(v)], null],
  '0xa76cc8': [curve.toWorld, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa637c8': [motion.updateMotion, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa60600': [motion.tick, v => [v.args[0]], null],
  '0xa5ffb0': [motion.tickStatic, v => [v.args[0]], null],
  '0xa609c8': [motion.tickVelocity, v => [v.args[0]], null],
  '0xa61a3c': [motion.placeStatic, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa646f4': [motion.integrateVelocity, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xa5fdf0': [motion.baseFrame, v => [v.args[0]], 'r0'],
  '0xa60f68': [life.lifePass, v => [v.args[0]], null],
  '0xcaa624': [life.releaseParticle, v => [v.args[0]], null],
  '0xa5825c': [life.killParticle, v => [v.args[0], v.args[1]], 'r0'],
  '0xa67304': [() => {}, v => [], null],
  '0xa97838': [model.animStep, v => [v.args[0], v.args[1]], 'r0'],
  '0xa6746c': [model.scaleStep, v => [v.args[0], v.args[1], s0(v)], 'r0'],
  '0xa683f8': [model.rotStep, v => [v.args[0], v.args[1], v.args[2], s0(v)], null],
  '0xa68c44': [model.channelStep, v => [v.args[0], v.args[1], v.args[2], v.args[3]], null],
  '0xa97dd8': [model.channelPass, v => [v.args[0], v.args[1]], null],
  '0xa972b8': [model.updateModelParticle, v => [v.args[0], v.args[1]], 'r0'],
  '0xa9718c': [model.modelFrame, v => [v.args[0]], 'r0'],
  '0xa5949c': [emit.loadInterval, v => [v.args[0]], null],
  '0xa59814': [emit.loadPeriod, v => [v.args[0]], 'r0'],
  '0xa596e8': [emit.thinCount, v => [v.args[0], v.args[1]], 'r0'],
  '0xae9e88': [emit.emissionStart, v => [v.args[0]], null],
  '0xa56bac': [emit.endEmission, v => [v.args[0], v.args[1]], null],
  '0xa57938': [emit.emitOnce, v => [v.args[0]], 'r0'],
  '0xa57bfc': [emit.emitPeriodic, v => [v.args[0]], 'r0'],
  '0xaebda8': [emit.visibilityState, v => [v.args[0]], 'r0'],
  '0xaebc68': [emit.colourCurve, v => [v.args[0]], null],
  '0x9bd170': [() => {}, v => [], null],
  '0xa570fc': [emit.preUpdate, v => [v.args[0]], null],
  '0xa5b488': [spawn.sampleShape, v => [v.args[0], v.args[1], v.args[2], v.args[3], stackArg(v, 0), stackArg(v, 1), stackArg(v, 2)], null],
  '0xa59c1c': [spawn.spawnPlace, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa5c7b4': [spawn.initUpdSlot, v => [v.args[0], v.args[1], v.args[2]], null],
  '0x320ed4': [spawn.eulerMatrix, v => [v.args[0], v.args[1], v.args[2]], null],
  '0x9ba918': [spawn.axisDir, v => [v.args[0], v.args[1], v.args[2], v.args[3]], null],
  '0xa742c0': [spawn.velDir, v => [v.args[0], v.args[1], v.args[2], v.args[3], stackArg(v, 0)], null],
  '0xa5a570': [spawn.spawnMotion, v => [v.args[0], v.args[1], v.args[2], v.args[3]], null],
  '0xaea108': [spawn.spawnLife, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xa59a5c': [spawn.spawnBase, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xb460c8': [spawn.meshByPart, v => [v.args[0], v.args[1]], 'r0'],
  '0xcabf10': [spawn.animSetup, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa96a70': [spawn.meshAnimInit, v => [v.args[0], v.args[1]], null],
  '0xa672dc': [spawn.unitScale, v => [v.args[0], v.args[1]], null],
  '0xa67308': [spawn.scaleInit, v => [v.args[0], v.args[1], s0(v)], null],
  '0xa685d4': [spawn.axisInit, v => [v.args[0], v.args[1], v.args[2], v.args[3], stackArg(v, 0), stackArg(v, 1), stackArg(v, 2)], null],
  '0xa67de4': [spawn.rotationInit, v => [v.args[0], v.args[1], v.args[2], v.args[3], stackArg(v, 0)], null],
  '0xa6885c': [spawn.channelSetup, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa96f78': [spawn.channelInit, v => [v.args[0], v.args[1]], null],
  '0xa68e78': [spawn.baseColour, v => [v.args[0], v.args[1]], null],
  '0xa71870': [spawn.lastPass, v => [v.args[0], v.args[1]], null],
  '0xa965c4': [spawn.spawnModel, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xaf63c4': [curve.evalColour, v => [v.args[0], v.args[1], v.args[2], v.args[3]], null],
  '0xa6243c': [motion.motionKind2, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa60234': [motion.tickKind2, v => [v.args[0]], null],
  '0x72dec': [spawn.matToQuat, v => [v.args[0], v.args[1]], null],
  '0x7c3a38': [spawn.matToEuler, v => [v.args[0], v.args[1]], null],
  '0xa6aee0': [spawn.quatToEuler, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xa67988': [spawn.nodeEuler, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xa78464': [billboard.preUpdateLB, v => [v.args[0]], null],
  '0xa66d38': [billboard.animConfig, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xcaa674': [billboard.animBindLB, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xa7a8a8': [billboard.spawnLB, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xa6703c': [billboard.texAnimStep, v => [v.args[0], v.args[1], v.args[2], s0(v)], 'r0'],
  '0xa7aecc': [billboard.updateLBParticle, v => [v.args[0], v.args[1]], 'r0'],
  '0xa7adac': [billboard.billboardFrame, v => [v.args[0]], 'r0'],
  '0x1ebe8': [polyline.matMul, v => [v.args[0], v.args[1]], null],
  '0xa69af0': [polyline.polyBasis, v => [v.args[0], v.args[1], v.args[2], v.args[3], stackArg(v, 0), stackArg(v, 1)], null],
  '0xa65014': [polyline.polyPoints, v => [v.args[0], v.args[1], v.args[2], v.args[3]], null],
  '0xa67540': [polyline.polyRandomVec, v => [v.args[0], v.args[1], v.args[2], v.args[3], stackArg(v, 0), stackArg(v, 1), stackArg(v, 2)], null],
  '0xa6b2f4': [polyline.polyShapeInit1, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xa6b06c': [polyline.polyShapeInit, v => [v.args[0], v.args[1], v.args[2], v.args[3]], null],
  '0xa6ecc4': [polyline.polyShapeUpdate1, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xa6ea50': [polyline.polyShapeUpdate, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xcaa710': [polyline.animBindLPL, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xa6908c': [polyline.baseColour2, v => [v.args[0], v.args[1]], null],
  '0xab4710': [polyline.spawnLPL, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xab5090': [polyline.updateLPLParticle, v => [v.args[0], v.args[1]], 'r0'],
  '0xab4f64': [polyline.polylineFrame, v => [v.args[0]], 'r0'],
  '0xa574c4': [runtime.generatorUpdate, v => [v.args[0]], 'r0', v => translatedType(v)],
  '0x29d00': [polyline.matMulTo, v => [v.args[0], v.args[1], v.args[2]], null],
  '0x44d08': [owner.isPaused, v => [v.args[0]], 'r0'],
  '0x44d30': [owner.flagF0bit4, v => [v.args[0]], 'r0'],
  '0x9b228c': [owner.ownerMatrix, v => [v.args[0]], null],
  '0x9b418c': [owner.ownerState, v => [v.args[0]], 'r0'],
  '0xb8efa4': [owner.frameDelta, v => [v.args[0]], 's0'],
  '0x9b4140': [owner.updateDelta, v => [v.args[0]], null],
  '0xae9b68': [owner.copyFraction, v => [v.args[0]], null],
  '0xa56c10': [owner.generatorFramePrep, v => [v.args[0]], null],
  '0x9bd168': [() => {}, v => [], null],
  '0x9bb9d0': [owner.framePrep, v => [v.args[0]], null],
  '0xae8ac0': [owner.nodeIntegrate, v => [v.args[0]], null],
  '0xae8b74': [owner.nodeLocal, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xae8d18': [owner.nodeLocalLerp, v => [v.args[0], v.args[1], v.args[2], s0(v)], null],
  '0x9bd058': [owner.attachMatrix, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0x939278': [owner.jointMatrix, v => [v.args[0], v.args[1]], 'r0'],
  '0x9bba54': [owner.nodeUpdate, v => [v.args[0], v.args[1]], null],
  '0xae9340': [owner.nodeDelay, v => [v.args[0]], null],
  '0x9b66a0': [owner.moveNodes, v => [v.args[0]], null],
  '0x9b6794': [owner.countNodes, v => [v.args[0]], null],
  '0xa91c48': [owner.modelPostPass, v => [v.args[0]], null],
  '0x9ba8c4': [(m, h) => h, v => [s0(v)], 's0'],
  '0xa77fb4': [() => {}, v => [], null],
  '0xaaebb0': [owner.polylinePostPass, v => [v.args[0]], null],
  '0x9b6130': [owner.move, v => [v.args[0]], null],
  '0x9b5cc8': [newEffect, v => [], 'r0'],
  '0xb59604': [loadEffectList, v => [v.args[0], v.args[1]], 'r0'],
  '0xce14a4': [loadEffectAnim, v => [v.args[0], v.args[1]], 'r0'],
  '0xb597a8': [L.listAllocate, v => [v.args[0], v.args[1]], 'r0'],
  '0xb5a060': [L.listRelease, v => [v.args[0]], null],
  '0xb598b0': [L.listResources, v => [v.args[0]], null],
  '0xb589b4': [L.entryReset, v => [v.args[0]], null],
  '0xb58ae8': [L.nodeResources, v => [v.args[0], v.args[1]], null],
  '0xb592c0': [L.col3Resources, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xb58c24': [L.generatorResources, v => [v.args[0], v.args[1], v.args[2]], null],
  '0xb59178': [L.textureSlot, v => [v.args[0], v.args[1], v.args[2]], null],
  '0x9baa9c': [startEffect, v => [v.args[0]], 'r0'],
  '0x9baa70': [C.resetFrame, v => [v.args[0]], null],
  '0x9baca0': [C.factory, v => [v.args[0]], 'r0'],
  '0x9bb8fc': [C.rowEnabled, v => [v.args[0], v.args[1]], 'r0'],
  '0xa91944': [C.allocGenerator, v => [v.args[0], v.args[1]], 'r0'],
  '0xa780bc': [C.allocGenerator, v => [v.args[0], v.args[1]], 'r0'],
  '0xaae1b4': [C.allocGenerator, v => [v.args[0], v.args[1]], 'r0'],
  '0xa91980': [C.ctorModel, v => [v.args[0]], 'r0'],
  '0xa780f8': [C.ctorLiteBillboard, v => [v.args[0]], 'r0'],
  '0xaae1f0': [C.ctorLitePolyline, v => [v.args[0]], 'r0'],
  '0xa55db4': [C.generatorCtor, v => [v.args[0]], null],
  '0xae957c': [C.generatorBaseCtor, v => [v.args[0]], null],
  '0xa919d4': [C.initModel, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa7814c': [C.initLiteBillboard, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xaae244': [C.initLitePolyline, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa55fe0': [C.generatorInit, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xae989c': [C.generatorBind, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xb594a8': [C.entryIsPlain, v => [v.args[0]], 'r0'],
  '0xa585dc': [C.polylineBlock, v => [v.args[0], v.args[1], v.args[2], v.args[3]], 'r0'],
  '0xa58690': [C.generatorSizes, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0xaea0e8': [C.headerSize, v => [v.args[0]], 'r0'],
  '0xb5a03c': [(m, t) => C.typeHasBit(t), v => [v.args[0]], 'r0'],
  '0x9bb358': [C.poolSetup, v => [v.args[0]], 'r0'],
  '0xa56174': [C.linkPool, v => [v.args[0], v.args[1]], 'r0'],
  '0xae81f4': [C.nodeBind, v => [v.args[0], v.args[1], v.args[2], v.args[3]], null],
  '0xb8ef7c': [C.workArea, v => [v.args[0], v.args[1], v.args[2]], 'r0'],
  '0x9bb69c': [C.nodeSetup, v => [v.args[0]], 'r0'],
  '0xae8268': [C.nodeBlocks, v => [v.args[0]], 'r0'],
  '0xae83c8': [C.nodeInit, v => [v.args[0]], null],
  '0xb8eea0': [managerRandom, v => [v.args[0], v.args[1]], 'r0'],
  '0xae9424': [C.nodeSeed, v => [v.args[0]], null],
  '0xae9df4': [C.generatorSeed, v => [v.args[0]], null],
  '0xa56960': [C.generatorSeedStart, v => [v.args[0]], null],
  '0xa91a30': [C.startModel, v => [v.args[0]], null],
  '0xa78178': [C.startLiteBillboard, v => [v.args[0]], null],
  '0xaae2a4': [C.startLitePolyline, v => [v.args[0]], null],
  '0xa562a0': [C.generatorStart, v => [v.args[0]], null],
  '0x9b38dc': [C.drawFlags, v => [v.args[0], v.args[1]], 'r0'],
  '0xae9938': [C.generatorFlags, v => [v.args[0]], null],
  '0xa588b8': [C.paramBit16, v => [v.args[0]], 'r0'],
  '0xa91b80': [C.transformModel, v => [v.args[0]], 'r0'],
  '0xa783a8': [C.transformLiteBillboard, v => [v.args[0]], 'r0'],
  '0xaaea38': [C.transformLitePolyline, v => [v.args[0]], 'r0'],
  '0xa56d1c': [C.generatorTransform, v => [v.args[0], v.args[1]], 'r0'],
};
// the translation's own stand-in for stack locals: never an input, never compared
const inScratch = a => a >= motion.SCRATCH_BASE && a < motion.SCRATCH_BASE + 0x100000;
// a call's own stack frame (below its entry sp): the recorder drops those writes, lifted code makes them
const STACK_LO = 0x7ff00000;
const ownFrame = (v, a) => a >= STACK_LO && a < v.sp;

// the k-th stack-passed argument: the u32 the callee found at entry sp + 4k
function stackArg(v, k){
  const a = v.sp + 4 * k;
  for (const [start, hx] of v.reads){
    const off = a - start;
    if (off >= 0 && off + 4 <= hx.length / 2) return parseInt(hx.substr(2 * off + 6, 2) + hx.substr(2 * off + 4, 2) + hx.substr(2 * off + 2, 2) + hx.substr(2 * off, 2), 16) >>> 0;
  }
  return undefined;                     // never read on this path, so the translation must not use it
}
// a u32 among the vector's recorded reads
function readU32(v, a){
  for (const [start, hx] of v.reads){
    const off = a - start;
    if (off >= 0 && off + 4 <= hx.length / 2) return parseInt(hx.substr(2 * off + 6, 2) + hx.substr(2 * off + 4, 2) + hx.substr(2 * off + 2, 2) + hx.substr(2 * off, 2), 16) >>> 0;
  }
  return null;
}
// generator-level vectors only count for the generator types the runtime has translated
const translatedType = v => Object.values(runtime.VTABLE).includes(readU32(v, v.args[0]));
// s0 at entry (the low half of d0)
function s0(v){ return bitsf32(v.d[0][0]); }

function hexBytes(h){
  const b = new Uint8Array(h.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(2 * i, 2), 16);
  return b;
}

// The outside world a call reached (allocator, unique ids), replayed in the order the game called it.
function servicesFor(v, problems, m, known = () => true){
  const queue = (v.services || []).slice();
  const next = kind => {
    const s = queue.shift();
    if (!s || s[0] !== kind){ problems.push('called ' + kind + ' where the game called ' + (s ? s[0] : 'nothing')); throw new Error('service order'); }
    return s;
  };
  // What the game handed the renderer, compared where the call's own reads and writes make the bytes
  // known: a stack word or a pointed-at byte the effect code never touched is whatever memory held
  // before (the recorder saw it, the vector does not carry it).
  function drawService(kind, args, stack, c, nstack, captures, withS0){
    const s = next(kind);
    const [gst, gd0, gcap] = s[2];
    for (let k = 0; k < 4; k++) if ((args[k] >>> 0) !== s[1][k]) problems.push(kind + ' r' + k + ' 0x' + (args[k] >>> 0).toString(16) + ', game 0x' + s[1][k].toString(16));
    if (withS0 && c.sb[0] !== gd0[0]) problems.push(kind + ' s0 0x' + c.sb[0].toString(16) + ', game 0x' + gd0[0].toString(16));
    for (let k = 0; k < nstack; k++){
      const a = (c.r[13] + 4 * k) >>> 0;
      if (known(a) && known(a + 1) && known(a + 2) && known(a + 3) && (stack[k] >>> 0) !== gst[k]) problems.push(kind + ' stack ' + k + ' 0x' + (stack[k] >>> 0).toString(16) + ', game 0x' + gst[k].toString(16));
    }
    for (const [label, [a, n]] of Object.entries(captures)){
      const g = gcap[label] || '';
      if (!a || !g){ if (!a !== !g) problems.push(kind + ' ' + label + ' pointer differs'); continue; }
      for (let i = 0; i < n; i++){
        if (!known(a + i)) continue;
        const gb = parseInt(g.substr(2 * i, 2), 16);
        if (m.rawByte(a + i) !== gb){ problems.push(kind + ' ' + label + ' byte ' + i + ': game ' + gb.toString(16) + ', js ' + m.rawByte(a + i).toString(16)); break; }
      }
    }
  }
  return {
    queue,
    alloc(size, align){
      const s = next('alloc');
      if (s[1][1] !== (size >>> 0) || s[1][2] !== align) problems.push('alloc(0x' + (size >>> 0).toString(16) + ', ' + align + '), game alloc(0x' + s[1][1].toString(16) + ', ' + s[1][2] + ')');
      return s[2];
    },
    nextId(){ return next('next_id')[2]; },
    free(){},                                        // the harness's free is a no-op and unrecorded
    streamSize(stream){
      const s = next('stream_size');
      if (s[1][0] !== stream) problems.push('stream size of 0x' + stream.toString(16) + ', game 0x' + s[1][0].toString(16));
      return s[2];
    },
    streamRead(stream, buf, n){
      const s = next('stream_read');
      if (s[1][0] !== stream || s[1][1] !== buf || s[1][2] !== n) problems.push('stream read (0x' + buf.toString(16) + ', ' + n + '), game (0x' + s[1][1].toString(16) + ', ' + s[1][2] + ')');
      m.load(buf, hexBytes(s[2][1]));
      return s[2][0];
    },
    // the engine's model draw (vecdraw.py SERVICES): r0..r3, stack words, d0 and the memory it was handed
    // 0xc8cf1c reads stack words 0, 2 and 3; 0xc8d208 forwards words 0..4 and s0 to 0xc8d9d8, which keeps
    // s0 in s16 at entry (0xc8da08) and scales CBMaterial.fReflectiveColor by it (0xc8ff74). Both return 0.
    beginModel(args, stack, c){ drawService('begin_model', args, stack, c, 4, { pos: [args[3], 12], lod: [stack[3], 12] }, false); },
    drawMesh(args, stack, c){ drawService('draw_mesh', args, stack, c, 5, { matrix: [args[3], 64], st0: [stack[0], 16], st2: [stack[2], 16] }, true); },
    // the draw context's submission under the engine's primitive draw (vecprim.py SERVICES). 0x881584
    // stores the index pointer through its second stack word before returning the vertex pointer; the
    // stand-in's writes are its own, so they are replayed without the memory hooks.
    primDraw(args, stack, c){
      const s = next('prim_draw');
      for (let k = 0; k < 4; k++) if ((args[k] >>> 0) !== s[1][k]) problems.push('prim_draw r' + k + ' 0x' + (args[k] >>> 0).toString(16) + ', game 0x' + s[1][k].toString(16));
      for (let k = 0; k < 2; k++) if ((stack[k] >>> 0) !== s[2][0][k]) problems.push('prim_draw stack ' + k + ' 0x' + (stack[k] >>> 0).toString(16) + ', game 0x' + s[2][0][k].toString(16));
      const ip = parseInt(s[2][2].index_pointer, 16) >>> 0;
      m.load(stack[1] >>> 0, new Uint8Array([ip & 255, (ip >>> 8) & 255, (ip >>> 16) & 255, ip >>> 24]));
      return s[3];
    },
    drawBegin(ctx){ const s = next('draw_begin'); if ((ctx >>> 0) !== s[1][0]) problems.push('draw_begin on 0x' + (ctx >>> 0).toString(16) + ', game 0x' + s[1][0].toString(16)); },
    drawEnd(ctx){ const s = next('draw_end'); if ((ctx >>> 0) !== s[1][0]) problems.push('draw_end on 0x' + (ctx >>> 0).toString(16) + ', game 0x' + s[1][0].toString(16)); },
    renderSetup(args){
      const s = next('render_setup');
      for (let k = 0; k < 3; k++) if ((args[k] >>> 0) !== s[1][k]) problems.push('render_setup r' + k + ' 0x' + (args[k] >>> 0).toString(16) + ', game 0x' + s[1][k].toString(16));
    },
    loadResource(dti, path, flags){
      const s = next('res_load');
      if (s[1][1] !== dti || s[1][2] !== path || s[1][3] !== flags) problems.push('resource (0x' + dti.toString(16) + ', 0x' + path.toString(16) + ', ' + flags + '), game (0x' + s[1][1].toString(16) + ', 0x' + s[1][2].toString(16) + ', ' + s[1][3] + ')');
      return s[2][0];
    },
  };
}

// A lifted routine runs on a CPU set up as the game's was at the call: r0..r3, sp, d0..d7.
function runLifted(m, v, address){
  const c = new Cpu();
  for (let k = 0; k < 4; k++) c.r[k] = v.args[k];
  c.r[13] = v.sp;
  c.r[14] = 0x7f000000;                  // the harness's return sentinel
  for (let k = 0; k < 8; k++){ c.sb[2 * k] = v.d[k][0]; c.sb[2 * k + 1] = v.d[k][1]; }
  call(m, c, address);
  return c;
}

function check(fnName, v){
  const [fn, argsOf, retKind] = TABLE[fnName] || [null, null, 'cpu'];
  const m = new Mem();
  const given = new Map();
  for (const [start, hx] of v.reads){
    const b = hexBytes(hx);
    for (let i = 0; i < b.length; i++) given.set(start + i, b[i]);
    m.load(start, b);
  }
  const want = new Map();
  for (const [start, hx] of v.writes){
    const b = hexBytes(hx);
    for (let i = 0; i < b.length; i++) want.set(start + i, b[i]);
  }
  const wrote = new Map();
  const problems = [];
  m.svc = servicesFor(v, problems, m, a => given.has(a) || wrote.has(a));
  m.onRead = (a, n) => {
    for (let i = 0; i < n; i++){
      if (!given.has(a + i) && !wrote.has(a + i) && !inScratch(a + i)){ problems.push('read outside inputs at 0x' + (a + i).toString(16)); break; }
    }
  };
  m.onWrite = (a, n, b) => { for (let i = 0; i < n; i++) wrote.set(a + i, b[i]); };
  let ret;
  Scratch.depth = 0;                    // a refused call never freed its scratch frames
  try { ret = fn ? fn(m, ...argsOf(v)) : runLifted(m, v, Number(fnName)); }
  catch (e){ return problems.length ? problems : [(e instanceof Unverified ? 'UNVERIFIED ' : 'THREW ') + e.message]; }
  if (m.svc.queue.length) problems.push('the game made ' + m.svc.queue.length + ' more service calls, next ' + m.svc.queue[0][0]);
  for (const [a, b] of want){
    if (wrote.get(a) !== b) problems.push('byte 0x' + a.toString(16) + ': game ' + b.toString(16) + ', js ' + (wrote.has(a) ? wrote.get(a).toString(16) : 'unwritten'));
  }
  for (const [a] of wrote) if (!want.has(a) && !inScratch(a) && !ownFrame(v, a)) problems.push('js wrote 0x' + a.toString(16) + ' which the game did not');
  if (retKind === 'cpu'){                // a register still holding a callee's poison is no result
    if (ret.r[0] !== POISON && ret.r[0] !== v.ret.r0) problems.push('r0 0x' + ret.r[0].toString(16) + ', game 0x' + v.ret.r0.toString(16));
    if (ret.r[1] !== POISON && ret.r[1] !== v.ret.r1) problems.push('r1 0x' + ret.r[1].toString(16) + ', game 0x' + v.ret.r1.toString(16));
    if (ret.sb[0] !== POISON && ret.sb[0] !== v.ret.d0[0]) problems.push('s0 differs');
    if (ret.sb[1] !== POISON && ret.sb[1] !== v.ret.d0[1]) problems.push('s1 differs');
    if (ret.r[13] !== v.sp) problems.push('sp not restored');
  }
  if (retKind === 'r0' && (ret >>> 0) !== v.ret.r0) problems.push('returned ' + ret + ', game ' + v.ret.r0);
  if (retKind === 's0' && Math.fround(ret) !== bitsf32(v.ret.d0[0])) problems.push('returned ' + ret + ', game ' + bitsf32(v.ret.d0[0]));
  return problems;
}

const [file, ...only] = process.argv.slice(2);
const files = statSync(file).isDirectory() ? readdirSync(file).filter(f => f.endsWith('.json')).map(f => join(file, f)) : [file];
const functions = {};
for (const f of files) Object.assign(functions, JSON.parse(readFileSync(f, 'utf8')).functions);
let fail = 0, pending = [];
const refused = new Map();              // unverified branch -> [vectors, functions]
for (const [fnName, rec] of Object.entries(functions)){
  if (only.length && !only.includes(fnName)) continue;
  if (!TABLE[fnName] && !lifted(Number(fnName))){ pending.push(fnName); continue; }
  let ok = 0, skipped = 0;
  for (const v of rec.vectors){
    if (TABLE[fnName] && TABLE[fnName][3] && !TABLE[fnName][3](v)){ skipped++; continue; }
    const p = check(fnName, v);
    if (p.length && p[0].startsWith('UNVERIFIED ')){
      const key = p[0].replace('UNVERIFIED unverified path: ', '');
      const r = refused.get(key) || [0, new Set()];
      r[0]++; r[1].add(fnName); refused.set(key, r);
      fail++;
    } else if (p.length){
      fail++;
      console.log('MISMATCH ' + fnName + ' path ' + v.path + ' frame ' + v.frame + ': ' + p.slice(0, 6).join('; '));
    } else ok++;
  }
  console.log(fnName + ': ' + ok + '/' + (rec.vectors.length - skipped) + ' vectors pass (' + rec.calls + ' calls in the run' + (skipped ? ', ' + skipped + ' for untranslated generator types skipped' : '') + ')');
}
if (refused.size){
  console.log('refused (unverified branches), by vectors that reached them:');
  for (const [k, [n, fns]] of [...refused].sort((a, b) => b[1][0] - a[1][0])) console.log('  ' + n + '  ' + k + '   (' + [...fns].join(' ') + ')');
}
if (pending.length) console.log('not translated yet: ' + pending.join(' '));
process.exit(fail ? 1 : 0);
