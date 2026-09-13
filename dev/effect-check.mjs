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
};
// the translation's own stand-in for stack locals: never an input, never compared
const inScratch = a => a >= motion.SCRATCH_BASE && a < motion.SCRATCH_BASE + 0x100000;

// the k-th stack-passed argument: the u32 the callee found at entry sp + 4k
function stackArg(v, k){
  const a = v.sp + 4 * k;
  for (const [start, hx] of v.reads){
    const off = a - start;
    if (off >= 0 && off + 4 <= hx.length / 2) return parseInt(hx.substr(2 * off + 6, 2) + hx.substr(2 * off + 4, 2) + hx.substr(2 * off + 2, 2) + hx.substr(2 * off, 2), 16) >>> 0;
  }
  throw new Error('stack argument ' + k + ' not among the recorded reads');
}
// s0 at entry (the low half of d0)
function s0(v){ return bitsf32(v.d[0][0]); }

function hexBytes(h){
  const b = new Uint8Array(h.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(2 * i, 2), 16);
  return b;
}

function check(fnName, v){
  const [fn, argsOf, retKind] = TABLE[fnName];
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
  m.onRead = (a, n) => {
    for (let i = 0; i < n; i++){
      if (!given.has(a + i) && !wrote.has(a + i) && !inScratch(a + i)){ problems.push('read outside inputs at 0x' + (a + i).toString(16)); break; }
    }
  };
  m.onWrite = (a, n, b) => { for (let i = 0; i < n; i++) wrote.set(a + i, b[i]); };
  let ret;
  try { ret = fn(m, ...argsOf(v)); }
  catch (e){ return [(e instanceof Unverified ? 'UNVERIFIED ' : 'THREW ') + e.message]; }
  for (const [a, b] of want){
    if (wrote.get(a) !== b) problems.push('byte 0x' + a.toString(16) + ': game ' + b.toString(16) + ', js ' + (wrote.has(a) ? wrote.get(a).toString(16) : 'unwritten'));
  }
  for (const [a] of wrote) if (!want.has(a) && !inScratch(a)) problems.push('js wrote 0x' + a.toString(16) + ' which the game did not');
  if (retKind === 'r0' && (ret >>> 0) !== v.ret.r0) problems.push('returned ' + ret + ', game ' + v.ret.r0);
  if (retKind === 's0' && Math.fround(ret) !== bitsf32(v.ret.d0[0])) problems.push('returned ' + ret + ', game ' + bitsf32(v.ret.d0[0]));
  return problems;
}

const [file, ...only] = process.argv.slice(2);
const files = statSync(file).isDirectory() ? readdirSync(file).filter(f => f.endsWith('.json')).map(f => join(file, f)) : [file];
const functions = {};
for (const f of files) Object.assign(functions, JSON.parse(readFileSync(f, 'utf8')).functions);
let fail = 0, pending = [];
for (const [fnName, rec] of Object.entries(functions)){
  if (only.length && !only.includes(fnName)) continue;
  if (!TABLE[fnName]){ pending.push(fnName); continue; }
  let ok = 0;
  for (const v of rec.vectors){
    const p = check(fnName, v);
    if (p.length){
      fail++;
      if (fail <= 12) console.log(fnName + ' path ' + v.path + ' frame ' + v.frame + ': ' + p.slice(0, 6).join('; '));
    } else ok++;
  }
  console.log(fnName + ': ' + ok + '/' + rec.vectors.length + ' vectors pass (' + rec.calls + ' calls in the run)');
}
if (pending.length) console.log('not translated yet: ' + pending.join(' '));
process.exit(fail ? 1 : 0);
