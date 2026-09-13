// THE BRIDGE BETWEEN HAND TRANSLATIONS AND LIFTED ROUTINES.
//
// Most of the runtime is translated by hand (life.js, motion.js, spawn.js ...); some routines are lifted
// instruction by instruction (lifted-*.js, on cpu.js) because they are long and their hand translation
// would add nothing but risk. Both are checked against the same call vectors. This file lets each call
// the other:
//
//   liftedCall(m, address, args, stack, singles)  a lifted routine from hand code. Its stack is a frame
//                                                 of scratch memory, which the checker never compares.
//   the natives below                             hand code from a lifted routine: arguments read out of
//                                                 r0-r3, the stack words and s0 as the procedure call
//                                                 standard passes them, the result put back in r0 or s0,
//                                                 and the other scratch registers poisoned (cpu.js).
import { Cpu, call, registerNative, clobber } from './cpu.js';
import { Scratch } from './motion.js';
import * as life from './life.js';
import * as motion from './motion.js';
import * as spawn from './spawn.js';
import * as billboard from './billboard.js';
import * as polyline from './polyline.js';
import { internals as C } from './construct.js';

export function liftedCall(m, address, args = [], stack = [], singles = []){
  const sc = new Scratch(m);
  const frame = sc.alloc(0x1000);
  const c = new Cpu();
  for (let k = 0; k < args.length; k++) c.r[k] = args[k] >>> 0;
  const sp = ((frame + 0x1000 - 16 - 4 * stack.length) & ~0xf) >>> 0;
  for (let k = 0; k < stack.length; k++) m.w32(sp + 4 * k, stack[k] >>> 0);
  c.r[13] = sp;
  c.r[14] = 0xfffffffe;
  for (let k = 0; k < singles.length; k++) c.sf[k] = singles[k];
  call(m, c, address);
  sc.free();
  return c;
}

// argument sources: 'r0'..'r3', 'st0'.. (stack words), 's0' (a single); result: 'r0', 's0' or null
const stackWord = (m, c, k) => m.u32((c.r[13] + 4 * k) >>> 0);
function native(address, fn, argSpec, result){
  registerNative(address, (m, c) => {
    const args = argSpec.map(a => a[0] === 'r' ? c.r[+a[1]] : a === 's0' ? c.sf[0] : stackWord(m, c, +a.slice(2)));
    const ret = fn(m, ...args);
    clobber(c);
    if (result === 'r0') c.r[0] = ret >>> 0;
    else if (result === 's0') c.sf[0] = ret;
  });
}
// registered lazily: polyline.js and construct.js import this file, so their exports may not exist yet
const A1 = ['r0'], A2 = ['r0', 'r1'], A3 = ['r0', 'r1', 'r2'], A4 = ['r0', 'r1', 'r2', 'r3'];

native(0x1ebe8, (m, ...a) => polyline.matMul(m, ...a), A2, null);
native(0x320ed4, (m, ...a) => spawn.eulerMatrix(m, ...a), A3, null);
native(0xb8ef7c, (m, ...a) => C.workArea(m, ...a), A3, 'r0');
native(0xa55fe0, (m, ...a) => C.generatorInit(m, ...a), A4, 'r0');
native(0xa562a0, (m, ...a) => C.generatorStart(m, ...a), A1, null);
native(0xa56d1c, (m, ...a) => C.generatorTransform(m, ...a), A2, 'r0');
native(0xa5825c, (m, ...a) => life.killParticle(m, ...a), A2, 'r0');
native(0xa58690, (m, ...a) => C.generatorSizes(m, ...a), A3, 'r0');
native(0xa588b8, (m, ...a) => C.paramBit16(m, ...a), A1, 'r0');
native(0xa59a5c, (m, ...a) => spawn.spawnBase(m, ...a), A3, 'r0');
native(0xa5fdf0, (m, ...a) => motion.baseFrame(m, ...a), A1, 'r0');
native(0xa65014, (m, ...a) => polyline.polyPoints(m, ...a), A4, null);
native(0xa66d38, (m, ...a) => billboard.animConfig(m, ...a), A3, null);
native(0xa6703c, (m, ...a) => billboard.texAnimStep(m, ...a), ['r0', 'r1', 'r2', 's0'], 'r0');
native(0xa672dc, (m, ...a) => spawn.unitScale(m, ...a), A2, null);
native(0xa67304, () => {}, [], null);
native(0xa67308, (m, ...a) => spawn.scaleInit(m, ...a), ['r0', 'r1', 's0'], 's0');   // the scale stays in s0 (0xa7aab4, 0xab4c14 read it)
native(0xa67540, (m, ...a) => polyline.polyRandomVec(m, ...a), ['r0', 'r1', 'r2', 'r3', 'st0', 'st1', 'st2'], null);
native(0xa68e78, (m, ...a) => spawn.baseColour(m, ...a), A2, null);
native(0xa6908c, (m, ...a) => polyline.baseColour2(m, ...a), A2, null);
native(0xa6ecc4, (m, ...a) => polyline.polyShapeUpdate1(m, ...a), A3, null);
native(0xa71870, (m, ...a) => spawn.lastPass(m, ...a), A2, null);
native(0xcaa710, (m, ...a) => polyline.animBindLPL(m, ...a), A3, 'r0');
native(0xa742c0, (m, ...a) => spawn.velDir(m, ...a), ['r0', 'r1', 'r2', 'r3', 'st0'], null);
native(0x13ecc68, (m, d, s, n) => { for (let i = 0; i < n; i++) m.w8(d + i, m.u8(s + i)); }, A3, null);   // __aeabi_memcpy
