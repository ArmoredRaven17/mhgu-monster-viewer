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
import * as owner from './owner.js';

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
native(0x29d00, (m, ...a) => polyline.matMulTo(m, ...a), A3, null);
native(0x320ed4, (m, ...a) => spawn.eulerMatrix(m, ...a), A3, null);
native(0xb8ef7c, (m, ...a) => C.workArea(m, ...a), A3, 'r0');
native(0xa55fe0, (m, ...a) => C.generatorInit(m, ...a), A4, 'r0');
native(0xa562a0, (m, ...a) => C.generatorStart(m, ...a), A1, null);
native(0xa58690, (m, ...a) => C.generatorSizes(m, ...a), A3, 'r0');
native(0xa588b8, (m, ...a) => C.paramBit16(m, ...a), A1, 'r0');
// The effect's move (0x9b6130) and everything it runs -- nodes, a generator's update, spawn, particle frames,
// emitter shapes, curves ... -- are LIFTED
// (lifted-particles.js, from every recorded run: Savage's, Deviljho's and Teostra's); the hand translations
// they replaced -- spawnBase, baseFrame, scaleInit, velDir, the colour and scale inits, the billboard and
// polyline helpers, killParticle, generatorTransform -- stay for the checker, and no longer answer calls.
// The heap the engine allocates from (0x189f148 +0x20 -> an allocator object): vtable +0x1c alloc(size,
// align), +0x34 free(pointer). The emulator harness (efx_emu.py, efx_load.py) points them at its stub
// entries 0x7e000000 and 0x7e000104, so those are the addresses lifted code calls through; a host lays
// its allocator object out the same way.
native(0x7e000000, (m, self, size, align) => m.svc.alloc(size, align), A3, 'r0');
native(0x7e000104, (m, self, p) => { m.svc.free(p); return 0; }, A2, 'r0');
native(0x13ecc68, (m, d, s, n) => { for (let i = 0; i < n; i++) m.w8(d + i, m.u8(s + i)); }, A3, null);   // __aeabi_memcpy
native(0x13ecc08, (m, d, s, n) => { for (let i = 0; i < n; i++) m.w8(d + i, m.u8(s + i)); }, A3, null);   // __aeabi_memcpy4
native(0x13ece30, (m, d, s, n) => { for (let i = 0; i < n; i++) m.w8(d + i, m.u8(s + i)); }, A3, null);   // __aeabi_memcpy8
// The allocator an engine object is made with: 0x7a75a0 picks one per DTI from a table; the emulator harness
// hooks it to answer every DTI with its allocator object (efx_emu.py ALLOC_OBJ), which a host lays out the
// same way (vtable +0x1c / +0x34 above).
export const ALLOCATOR = 0x600f0000;
native(0x7a75a0, () => ALLOCATOR, [], 'r0');
// The resource manager's release (its vtable +0x3c, reached through 0x884698): the harness's is a stub at
// 0x7e000144 (efx_load.py resmgr_vt15) that frees nothing and returns 0; a host points its resource
// manager's vtable +0x3c there.
export const RESMGR_RELEASE = 0x7e000144;
native(RESMGR_RELEASE, () => 0, [], 'r0');
// 0x9baa9c (uEffect vtable +0xd0): the start, which setting an effect's list calls (0x9ba238, lifted-proof.js)
native(0x9baa9c, (m, ...a) => C.startEffect(m, ...a), A1, 'r0');
// A parent unit's getDTI (vtable +0x14), which a start on a parent asks (0x9ba080 walks the chain for
// uModel). The emulator's stand-in parent (efx/parent.py GETDTI) answers from this address with its
// monster's class: uEm043_00's DTI 0x184a218 (its getDTI thunk 0xe812ac, GOT 0x18325fc). A host whose
// parent is another monster sets that monster's class.
export const PARENT_GETDTI = 0x7e001000;
let parentClass = 0x184a218;
export function setParentClass(dti){ parentClass = dti >>> 0; }
native(PARENT_GETDTI, () => parentClass, [], 'r0');

// ---- a monster's effect request, whole (proof.js ProofRequest; efx/proofunit.py) -------------------------
// uMHProofEffect's move (0x327188) ends in uEffect's own move, and its owner matrix (vtable +0x50, 0x3273e8)
// is a branch to uEffect's: both are lifted now (lifted-particles.js).
native(0x939278, (m, model, joint) => owner.jointMatrix(m, model, joint), A2, 'r0');   // uModel's joint matrix
native(0x9b4184, () => 1, [], 'r0');                   // uEffect vtable +0x88: mov r0, #1
// the constructors the request's objects start from, translated by hand (construct.js): cUnit's and uEffect's base
native(0x884990, (m, p) => { C.unitCtor(m, p); return p; }, A1, 'r0');
native(0x9b1f1c, (m, p) => { C.effectBaseCtor(m, p); return p; }, A1, 'r0');
// cUnit's empty virtual (vtable +0x2c of both the core and the effect): bx lr.
registerNative(0x1eba8, () => {});
// The unit manager's add (0xc03670: sUnit, line, unit, ...): the harness hooks it to return at once with the
// registers as they were, keeping the unit for its passes; so does this, into m.svc.registerUnit.
registerNative(0xc03670, (m, c) => { m.svc.registerUnit(c.r[0] >>> 0, c.r[1] >>> 0, c.r[2] >>> 0, c.r[3] >>> 0); });
// The enemy's parent handle (enemy +0xfd0) as the harness stands it in (proofunit.py): vtable +0 valid,
// +4 the unit.
export const HANDLE_VALID = 0x7e001004, HANDLE_GET = 0x7e001008;
// the parent unit's +0x10c: a proof effect's first frame hands itself to its parent (0x43cac); the harness's
// stand-in keeps nothing and answers 0 (efx/parent.py ADD_EFFECT)
export const PARENT_ADD_EFFECT = 0x7e001010;
native(PARENT_ADD_EFFECT, () => 0, [], 'r0');
native(HANDLE_VALID, (m) => m.svc.handleValid(), [], 'r0');
native(HANDLE_GET, (m) => m.svc.handleUnit(), [], 'r0');
// The resource manager's load (vtable +0x30) a request's state machine calls for its record's path
// (0x323b40): the host answers with the list it loaded (m.svc.requestLoad).
export const REQUEST_LOAD = 0x7e00100c;
native(REQUEST_LOAD, (m, self, dti, path, flags) => m.svc.requestLoad(dti, path, flags), A4, 'r0');
// libm, as the emulator's imports compute it (build/arm/emu.py _on_plt): the float32 argument, the double
// result rounded to float32, in s0.
const f32 = Math.fround;
function libm(address, fn){
  registerNative(address, (m, c) => { const a = c.sf[0], b = c.sf[1]; const r = fn(a, b); clobber(c, true); c.sf[0] = f32(r); });
}
libm(0x13ecba8, (a, b) => Math.atan2(a, b));           // atan2f
libm(0x13ecc2c, a => Math.cos(a));                     // cosf
libm(0x13ecc20, a => Math.sin(a));                     // sinf
libm(0x13ecfc8, a => (a < -1 || a > 1) ? NaN : Math.asin(a));   // asinf (math.asin raises -> nan)
native(0x13ecd34, (m, d, n, v) => { for (let i = 0; i < n; i++) m.w8(d + i, v & 0xff); return d; }, A3, 'r0');   // __aeabi_memset4(dest, n, c)
native(0x13ecbb4, (m, d, n) => { for (let i = 0; i < n; i++) m.w8(d + i, 0); return d; }, A2, 'r0');          // __aeabi_memclr4(dest, n)
native(0x13ecbe4, (m, d, n) => { for (let i = 0; i < n; i++) m.w8(d + i, 0); return d; }, A2, 'r0');          // __aeabi_memclr(dest, n)
// 0x9bd170, uEffect vtable +0xfc: bx lr (the generator's preUpdate calls it) -- touches no register
registerNative(0x9bd170, () => {});
// nn::os::InitializeMutex (a singleton's constructor): the emulator's import does nothing and answers 0
native(0x13ecde8, () => 0, [], 'r0');
// the effect manager's unique id (0xb8f4b8: lock, ++[mgr +0x22c], unlock), the harness's next_id service
native(0xb8f4b8, (m, mgr) => m.svc.nextId(mgr), A1, 'r0');
