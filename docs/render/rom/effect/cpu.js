// THE CPU THAT LIFTED ROUTINES RUN ON.
//
// Some of the game's routines are translated by a lifter (C:\MHGU-Extract\efx\lift.py) rather than
// by hand: every instruction the recorded call vectors executed becomes a JS statement over this
// state -- 16 core registers in a Uint32Array (so 32-bit wrap-around is the array's), 32 VFP single
// registers whose bits live in a Uint32Array and whose values are read and written through a
// Float32Array over the same buffer (so every VFP result is rounded to float32 on store), and the
// NZCV and FPSCR flags. Lifted code is checked byte for byte against the same vectors as hand-written
// code (dev/effect-check.mjs); a branch into code no vector reached throws Unverified.
//
// call(m, c, address) is how a lifted routine reaches another: a lifted one, a hand-written one
// through an adapter that reads its arguments from the registers, or a service of the outside world.
import { Unverified } from './mem.js';

export class Cpu {
  constructor(){
    this.r = new Uint32Array(16);
    const buf = new ArrayBuffer(32 * 4);
    this.sb = new Uint32Array(buf);
    this.sf = new Float32Array(buf);
    this.N = 0; this.Z = 0; this.C = 0; this.V = 0;
    this.fN = 0; this.fZ = 0; this.fC = 0; this.fV = 0;
  }
}

// What a call leaves in the registers the procedure call standard lets it scratch (r0-r3, r12, d0-d7).
// A routine run natively -- a hand translation, the C library, the renderer -- sets its results and
// poisons the rest, so lifted code that leaned on a leftover value would show up as a mismatch against
// the vectors instead of silently agreeing with an emulator stub that left the registers alone.
export const POISON = 0xdeadf00d;
export function clobber(c, keepR0 = false){
  if (!keepR0) c.r[0] = POISON;
  c.r[1] = POISON; c.r[2] = POISON; c.r[3] = POISON; c.r[12] = POISON;
  for (let k = 0; k < 16; k++) c.sb[k] = POISON;
}

const LIFTED = new Map();                 // address -> (m, c) => void
export function registerLifted(table){ for (const [a, f] of Object.entries(table)) LIFTED.set(Number(a), f); }
export function registerNative(address, fn){ LIFTED.set(address, fn); }
export function lifted(address){ return LIFTED.get(address); }

export function call(m, c, address){
  const f = LIFTED.get(address >>> 0);
  if (!f) throw new Unverified('call to 0x' + (address >>> 0).toString(16) + ', which is not translated');
  f(m, c);
}

// VCMP / VCMPE into the FPSCR flags (copied to NZCV by VMRS).
export function fcmp(c, a, b){
  if (Number.isNaN(a) || Number.isNaN(b)){ c.fN = 0; c.fZ = 0; c.fC = 1; c.fV = 1; }
  else if (a < b){ c.fN = 1; c.fZ = 0; c.fC = 0; c.fV = 0; }
  else if (a === b){ c.fN = 0; c.fZ = 1; c.fC = 1; c.fV = 0; }
  else { c.fN = 0; c.fZ = 0; c.fC = 1; c.fV = 0; }
}

// VCVT float -> integer: toward zero, saturating, NaN to 0.
export function toU32(v){ return (Number.isNaN(v) || v <= 0) ? 0 : (v >= 4294967295 ? 4294967295 : Math.trunc(v)); }
export function toS32(v){
  if (Number.isNaN(v)) return 0;
  if (v >= 2147483647) return 2147483647;
  if (v <= -2147483648) return -2147483648;
  return Math.trunc(v);
}

// shifts by a register amount (0..255), with their carry-outs
export const shl = (v, n) => n >= 32 ? 0 : ((v << n) >>> 0);
export const shr = (v, n) => n >= 32 ? 0 : (v >>> n);
export const sar = (v, n) => n >= 32 ? (((v | 0) >> 31) >>> 0) : (((v | 0) >> n) >>> 0);
export const shl_c = (c, v, n) => n === 0 ? c.C : (n > 32 ? 0 : ((v >>> (32 - n)) & 1));
export const shr_c = (c, v, n) => n === 0 ? c.C : (n > 32 ? 0 : ((v >>> (n - 1)) & 1));
export const sar_c = (c, v, n) => n === 0 ? c.C : (n >= 32 ? (v >>> 31) : ((v >>> (n - 1)) & 1));

// Run a routine from hand-written code: r0..r3, then further integer arguments on the stack, VFP
// singles in s0.., on a stack at `sp` (the caller owns that memory). Returns the CPU afterwards.
export function invoke(m, address, args = [], stack = [], singles = [], sp = 0x7ff00000){
  const c = new Cpu();
  for (let k = 0; k < 4 && k < args.length; k++) c.r[k] = args[k] >>> 0;
  let s = (sp - 4 * stack.length) & ~0xf;
  for (let k = 0; k < stack.length; k++) m.w32(s + 4 * k, stack[k] >>> 0);
  c.r[13] = s >>> 0;
  for (let k = 0; k < singles.length; k++) c.sf[k] = singles[k];
  c.r[14] = 0xfffffffe;
  call(m, c, address);
  return c;
}
