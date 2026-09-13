// THE EFFECT'S OWN FRAME: uEffect's move, its node transforms, and the generator passes around them.
//
// Translated from MHGU and checked against call vectors from the game's own run of Savage's
// em043_05_002_s (dev/effect-check.mjs). Arithmetic is transcribed register by register.
//
// uEffect (vtable 0x1786558) fields used here:
//   +0x1c speed   +0x30 parent (a model to attach to; null for a free effect)
//   +0x40 position, +0x50 quaternion, +0x60 scale   +0xb0..+0xec world matrix (rows scaled)
//   +0xf0 flags (bit 0 first frame, bit 1 paused, bit 4, bit 5, bit 6, bits 14..15, bit 19)
//   +0xf8 time scale   +0xfc frame step   +0x100 play rate   +0x104 frame accumulator, then its fraction
//   +0x108 fraction * 256   +0x10c frames played   +0x110 u16 substeps this frame, u16 above it
//   +0x118 flags (bit 24 started, bits 28..31 state)   +0x120..+0x15c rotation matrix and position row
//   +0x1b4 u16 countdown in the high half   +0x1d8..+0x1e4 counters: +0x1e2 generators alive,
//   +0x1e4 u16 node instances, +0x1e6 nodes with a live generator   +0x1f0 generator list
//   +0x1f4 node instances (0x130 bytes each)   +0x1fc count scale   +0x204 mode   +0x20c u16 substep
// Node instance (0x130 bytes):
//   +0x00 world matrix, +0x40 its copy   +0x80 position, +0x90 quaternion (the node block's)
//   +0xc0 translation before the substep   +0xd0 translation moved this substep
//   +0xe0 scale, +0xfc its largest axis   +0xf0 scale   +0x100 owner   +0x104 node parameters
//   +0x108 / +0x10c / +0x110 flags (+0x10c bits 8..11 rotation order, bits 16..19 transform mode;
//   +0x110 bit 4 current motion buffer, bits 0..3 delay state)   +0x118 frames since the delay ended
//   +0x11c u16 delay, u16 countdown   +0x128 / +0x12c motion blocks (+0x00 / +0x10 two buffers,
//   +0x20 velocity)
import { Unverified, F } from './mem.js';
import { Scratch } from './motion.js';
import { eulerMatrix } from './spawn.js';
import { matMulTo } from './polyline.js';
import { generatorUpdate } from './runtime.js';

const GOT_EFFECT_MANAGER = 0x183b9ec;        // -> 0x211f554, the manager singleton
const GOT_SYSTEM = 0x1831cb0;                // -> 0x211f764, whose +0x38 is the frame delta
const GOT_ZERO3 = 0x1831a78;                 // -> MtVector3 Zero

function toU32(v){ return (Number.isNaN(v) || v <= 0) ? 0 : (v >= 4294967295 ? 4294967295 : Math.trunc(v)); }
function toS32(v){
  if (Number.isNaN(v)) return 0;
  if (v >= 2147483647) return 2147483647;
  if (v <= -2147483648) return -2147483648;
  return Math.trunc(v);
}

// A virtual call: the object's vtable slot, dispatched on the code address the ROM would jump to.
function vcall(m, obj, slot, ...args){
  const code = m.u32((m.u32(obj) + slot) >>> 0);
  const fn = CODE.get(code);
  if (!fn) throw new Unverified('virtual +0x' + slot.toString(16) + ' -> 0x' + code.toString(16) + ' not translated');
  return fn(m, obj, ...args);
}

// 0x44d08 / 0x44d30: uEffect flag getters (vtable +0x5c, +0x64).
export const isPaused = (m, owner) => (m.u8(owner + 0xf0) >>> 1) & 1;
export const flagF0bit4 = (m, owner) => (m.u8(owner + 0xf0) >>> 4) & 1;

// Rotation rows of a unit quaternion (x, y, z, w at q) into out +0x00..+0x2c, w column zero. The same
// instructions at 0x9b23fc and 0xae8c24.
function quatRows(m, q, out){
  let s2 = m.f32(q + 4), s4 = m.f32(q + 8);
  const s14 = 1.0;
  let s0 = m.f32(q), s6 = m.f32(q + 0xc);
  let s8 = F(s4 + s4), s10 = F(s2 + s2);
  const s12 = F(s2 * s10);
  s4 = F(s4 * s8);
  const s5 = F(s0 * s10), s7 = F(s0 * s8);
  let s3 = F(s8 * s6);
  s10 = F(s10 * s6);
  s2 = F(s2 * s8);
  let s1 = F(s12 + s4);
  const s9 = F(s5 + s3), s11 = F(s7 - s10);
  s3 = F(s5 - s3);
  s1 = F(s14 - s1);
  m.wf32(out, s1);
  s1 = F(s0 + s0);
  m.wf32(out + 4, s9); m.wf32(out + 8, s11); m.w32(out + 0xc, 0); m.wf32(out + 0x10, s3);
  s0 = F(s0 * s1);
  s6 = F(s1 * s6);
  s4 = F(s0 + s4);
  s0 = F(s0 + s12);
  s8 = F(s2 + s6);
  s2 = F(s2 - s6);
  s4 = F(s14 - s4);
  s0 = F(s14 - s0);
  m.wf32(out + 0x14, s4);
  s4 = F(s7 + s10);
  m.wf32(out + 0x18, s8); m.w32(out + 0x1c, 0); m.wf32(out + 0x20, s4); m.wf32(out + 0x24, s2);
  m.wf32(out + 0x28, s0); m.w32(out + 0x2c, 0);
}

// 0x9b228c (vtable +0x50): the effect's world matrix from its position, quaternion and scale.
export function ownerMatrix(m, owner){
  if (m.u32(owner + 0x30) !== 0) throw new Unverified('0x9b22ac effect attached to a parent');
  quatRows(m, owner + 0x50, owner + 0x120);
  const x = m.u32(owner + 0x40), y = m.u32(owner + 0x44), z = m.u32(owner + 0x48);
  m.w32(owner + 0x150, x); m.w32(owner + 0x154, y); m.w32(owner + 0x158, z);
  m.w32(owner + 0x15c, 0x3f800000);
  for (const [k, row, dst] of [[0x60, 0x120, 0xb0], [0x64, 0x130, 0xc0], [0x68, 0x140, 0xd0]]){   // 0x9b26d0
    const s0 = m.f32(owner + k);
    const a = m.f32(owner + row), b = m.f32(owner + row + 4), c = m.f32(owner + row + 8), d = m.f32(owner + row + 0xc);
    m.wf32(owner + dst, F(s0 * a)); m.wf32(owner + dst + 4, F(s0 * b));
    m.wf32(owner + dst + 8, F(s0 * c)); m.wf32(owner + dst + 0xc, F(s0 * d));
  }
  for (let i = 0; i < 4; i++) m.w32(owner + 0xe0 + 4 * i, m.u32(owner + 0x150 + 4 * i));
}

// 0x9b418c: the effect's state nibble (+0x118 bits 28..31) := 4; returns it.
export function ownerState(m, owner){
  const a = m.u32(owner + 0x110), b = m.u32(owner + 0x114), c = m.u32(owner + 0x118);
  m.w32(owner + 0x110, a); m.w32(owner + 0x114, b);
  m.w32(owner + 0x118, ((c & 0x0fffffff) | 0x40000000) >>> 0);
  if ((c & 0x8000000) && (c & 0xf00000)) throw new Unverified('0x9b41c0 effect state with +0x118 bit 27');
  return 4;
}

// 0xb8efa4: the frame delta: the effect manager's own (+0x30) when its +0x34 is set, else the system's.
export function frameDelta(m, mgr){
  const own = m.u8(mgr + 0x34);
  const sys = m.u32(m.u32(GOT_SYSTEM));
  return m.f32(own === 0 ? sys + 0x38 : mgr + 0x30);
}

// 0x9b4140 (vtable +0x84): this frame's step, speed * play rate * time scale / frame delta.
export function updateDelta(m, owner){
  const s0 = m.f32(owner + 0x1c), s2 = m.f32(owner + 0x100), s16 = m.f32(owner + 0xf8);
  const mgr = m.u32(m.u32(GOT_EFFECT_MANAGER));
  const s18 = F(s2 * s0);
  const d = frameDelta(m, mgr);
  m.wf32(owner + 0xfc, F(s18 * F(s16 / d)));
}

// 0xae9b68: the owner's frame fraction onto the generator (+0x98 float, +0x9c * 256).
export function copyFraction(m, gen){
  const owner = m.u32(gen + 8);
  m.w32(gen + 0x98, m.u32(owner + 0x104));
  m.w32(gen + 0x9c, m.u32(owner + 0x108));
}

// 0xa56c10 (generator vtable +0x30): per-frame generator preparation.
export function generatorFramePrep(m, gen){
  copyFraction(m, gen);
  const mgr = m.u32(m.u32(GOT_EFFECT_MANAGER));
  const a = m.u32(mgr + 0x50), b = m.u32(mgr + 0x54), c = m.u32(mgr + 0x58);
  m.w32(gen + 0x150, a); m.w32(gen + 0x154, b); m.w32(gen + 0x158, c); m.w32(gen + 0x15c, 0);
  if (((m.u32(gen + 0x44) >>> 16) & 0xff) > 0x32) throw new Unverified('0xa56cc4 generator +0x46 above 0x32');
  const par = m.u32(gen + 0x34);
  if (par === 0) throw new Unverified('0xa56cc4 generator without parameters');
  const owner = m.u32(gen + 8);
  if (m.u8(owner + 0xf1) & 1) throw new Unverified('0xa56cc4 effect +0xf1 bit 0');
  const b16 = m.u16(par + 0x16) & 0xff;
  const w = [];
  for (let i = 0; i < 7; i++) w.push(m.u32(gen + 0xd0 + 4 * i));
  let ec = m.u32(gen + 0xec);
  ec = ((ec & ~0x00ff0000) | (b16 << 16)) >>> 0;
  for (let i = 0; i < 7; i++) m.w32(gen + 0xd0 + 4 * i, w[i]);
  m.w32(gen + 0xec, ec);
  ec = ((ec & 0x00ffffff) | (m.u8(par + 0x17) << 24)) >>> 0;
  for (let i = 0; i < 7; i++) m.w32(gen + 0xd0 + 4 * i, w[i]);
  m.w32(gen + 0xec, ec);
  vcall(m, owner, 0xf4, gen);
  m.w32(gen + 0x10, (m.u32(gen + 0x10) | 0x10000) >>> 0);
}

// 0x9bb9d0 (vtable +0xe4): before the substeps: zero every node's moved translation, prepare every generator.
export function framePrep(m, owner){
  if (m.u16(owner + 0x1e4) !== 0){
    const zero = m.u32(GOT_ZERO3);
    const x = m.u32(zero), y = m.u32(zero + 4), z = m.u32(zero + 8);
    let i = 0, off = 0;
    do {
      const at = (m.u32(owner + 0x1f4) + off + 0xd0) >>> 0;
      i++; off += 0x130;
      m.w32(at, x); m.w32(at + 4, y); m.w32(at + 8, z); m.w32(at + 0xc, 0);
    } while (i < m.u16(owner + 0x1e4));
  }
  for (let g = m.u32(owner + 0x1f0); g !== 0; g = m.u32(g + 0xc)) vcall(m, g, 0x30);
}

// 0xae8ac0: flip the node's motion buffers; current = previous + velocity, velocity *= damping.
export function nodeIntegrate(m, inst){
  const w110 = m.u32(inst + 0x110), w108 = m.u32(inst + 0x108), w10c = m.u32(inst + 0x10c);
  const r2 = (w110 ^ 0x30) >>> 0;
  m.w32(inst + 0x108, w108); m.w32(inst + 0x10c, w10c); m.w32(inst + 0x110, r2);
  const blk = m.u32(inst + 0x12c);
  if (blk === 0) return;
  const par = m.u32(inst + 0x104);
  const off = m.u16(par + 0x6e);
  const cur = (r2 >>> 4) & 1;
  const vx = m.f32(blk + 0x20), vy = m.f32(blk + 0x24), vz = m.f32(blk + 0x28);
  const prev = blk + ((cur ^ 1) << 4);
  const px = m.f32(prev), py = m.f32(prev + 4), pz = m.f32(prev + 8);
  if (off === 0) throw new Unverified('0xae8b24 node damping without an offset');
  const damp = m.f32(par + off + 0x30);
  const out = blk + (cur << 4);
  m.w32(out + 0xc, 0);
  m.wf32(out, F(px + vx)); m.wf32(out + 4, F(py + vy)); m.wf32(out + 8, F(pz + vz));
  m.wf32(blk + 0x20, F(damp * m.f32(blk + 0x20)));
  m.wf32(blk + 0x24, F(damp * m.f32(blk + 0x24)));
  m.wf32(blk + 0x28, F(damp * m.f32(blk + 0x28)));
}

// The node scale (+0xf0 * the effect's +0x60) into +0xe0, its largest axis into +0xfc.
function nodeScale(m, inst){
  const owner = m.u32(inst + 0x100);
  let sy = m.f32(inst + 0xf4), sx = m.f32(inst + 0xf0), sz = m.f32(inst + 0xf8);
  const ox = m.f32(owner + 0x60), oy = m.f32(owner + 0x64), oz = m.f32(owner + 0x68);
  sx = F(sx * ox); sy = F(sy * oy); sz = F(sz * oz);
  m.wf32(inst + 0xe0, sx); m.wf32(inst + 0xe4, sy); m.wf32(inst + 0xe8, sz); m.w32(inst + 0xec, 0);
  let mx = sx > sy ? sx : sy;
  mx = sz > mx ? sz : mx;
  m.wf32(inst + 0xfc, mx);
}

// 0xae8b74: the node's local transform: rotation from its quaternion, position into `vec`.
export function nodeLocal(m, inst, mat, vec){
  nodeScale(m, inst);
  const x = m.u32(inst + 0x80), y = m.u32(inst + 0x84), z = m.u32(inst + 0x88);
  m.w32(vec, x); m.w32(vec + 4, y); m.w32(vec + 8, z); m.w32(vec + 0xc, 0);
  m.u32(inst + 0x108);
  if (m.u32(inst + 0x110) & 0x400) throw new Unverified('0xae8ccc node rotation, +0x110 bit 10');
  quatRows(m, inst + 0x90, mat);
  m.w32(mat + 0x30, 0); m.w32(mat + 0x34, 0); m.w32(mat + 0x38, 0); m.w32(mat + 0x3c, 0x3f800000);
}

// 0xae8d18: the same for a node with a motion block: rotation from its euler angles blended between
// the two buffers by the frame fraction `t`.
export function nodeLocalLerp(m, inst, mat, vec, t){
  m.u32(inst + 0x108);
  const f10c = m.u32(inst + 0x10c);
  if (f10c & 0x10) throw new Unverified('0xae8d70 node lerp, +0x10c bit 4');
  nodeScale(m, inst);
  if ((f10c & 0x20) && m.u32(inst + 0x128) !== 0) throw new Unverified('0xae8e10 node position from +0x128');
  const x = m.u32(inst + 0x80), y = m.u32(inst + 0x84), z = m.u32(inst + 0x88);
  m.w32(vec, x); m.w32(vec + 4, y); m.w32(vec + 8, z); m.w32(vec + 0xc, 0);
  const w10c = m.u32(inst + 0x10c), w110 = m.u32(inst + 0x110);
  if ((w10c & 0x40) && m.u32(inst + 0x128) !== 0) throw new Unverified('0xae8eec node rotation from +0x128');
  const blk = m.u32(inst + 0x12c);
  if (blk === 0) throw new Unverified('0xae8f4c node lerp without a motion block');
  const sc = new Scratch(m);
  const ang = sc.alloc(0x10);
  m.w32(ang + 0xc, 0);
  const b = (w110 >>> 4) & 1;
  const cur = blk + (b << 4), prev = blk + ((b ^ 1) << 4);
  const u = F(1.0 - t);
  for (let k = 0; k < 12; k += 4){
    let s = F(m.f32(cur + k) * t);
    s = F(s + F(u * m.f32(prev + k)));
    m.wf32(ang + k, s);
  }
  if (w110 & 0x400) throw new Unverified('0xae8ed8 node lerp, +0x110 bit 10');
  eulerMatrix(m, mat, ang, (w10c >>> 8) & 0xf);
  sc.free();
}

// 0x9bd058 (vtable +0xec): the matrix a node hangs from. A free effect's own rotation matrix; with a
// parent (+0x30) and a joint, the parent's vtable +0x54 (the joint matrix) -- not reached yet.
export function attachMatrix(m, owner, joint, flag){
  if (m.u32(owner + 0x30) !== 0) throw new Unverified('0x9bd068 effect attached to a parent joint');
  return owner + 0x120;
}

// |row| as the ROM sums it: ((x1 * x1 + x0 * x0) + x2 * x2) + x3 * x3.
function rowLength(m, row){
  const x0 = m.f32(row), x1 = m.f32(row + 4), x2 = m.f32(row + 8), x3 = m.f32(row + 0xc);
  let s = F(x1 * x1);
  s = F(s + F(x0 * x0));
  s = F(s + F(x2 * x2));
  s = F(s + F(x3 * x3));
  return F(Math.sqrt(s));
}
const EPSILON = F(1.1920928955078125e-07);
function normaliseRow(m, row, where){
  const len = rowLength(m, row);
  if (Number.isNaN(len)) throw new Unverified(where + ' row length NaN');
  if (len < EPSILON) throw new Unverified(where + ' degenerate row');
  const inv = F(1.0 / len);
  for (let k = 0; k < 16; k += 4) m.wf32(row + k, F(inv * m.f32(row + k)));
  return len;
}

// 0x9bba54 (vtable +0xe8): a node instance's world matrix: local (rotation, position * scale) times the
// matrix it hangs from with that matrix's scale taken out into +0xe0, normalised, into +0x00 and +0x40.
export function nodeUpdate(m, owner, inst){
  if ((m.u32(owner + 0x118) & 0x4000000) && (m.u8(owner + 0xf2) & 0x80)) throw new Unverified('0x9bbab0 node update, effect +0x118 bit 26');
  let w110 = m.u32(inst + 0x110);
  const w108 = m.u32(inst + 0x108), w10c = m.u32(inst + 0x10c);
  const s20 = 1.0;
  w110 = (w110 & ~0x400) >>> 0;
  m.w32(inst + 0x108, w108); m.w32(inst + 0x10c, w10c); m.w32(inst + 0x110, w110);
  const sc = new Scratch(m);
  const local = sc.alloc(0x40), pos = sc.alloc(0x10), attach = sc.alloc(0x40), world = sc.alloc(0x40);
  m.w32(pos + 0xc, 0);
  let lerp = m.u32(inst + 0x128) !== 0;
  if (!lerp) lerp = m.u32(inst + 0x12c) !== 0 || (w10c & 0xf0) !== 0;
  if (lerp) nodeLocalLerp(m, inst, local, pos, m.f32(owner + 0x104));
  else nodeLocal(m, inst, local, pos);
  // 0x9bbb10
  m.u32(inst + 0x108); m.u32(inst + 0xe4); m.u32(inst + 0xe8); m.u32(inst + 0xe0);
  const f10c = m.u32(inst + 0x10c), f110 = m.u32(inst + 0x110);
  const mode = (f10c >>> 16) & 0xf;
  if (mode === 3) throw new Unverified('0x9bbb4c node transform mode 3');
  const M = vcall(m, owner, 0xec, m.u32(inst + 0x8c), (f110 & 0x100) ? 1 : 0);
  for (let k = 0; k < 0x40; k += 4) m.w32(attach + k, m.u32(M + k));
  if (m.u32(inst + 0x10c) & 0xf00000) throw new Unverified('0x9bbe14 node scale mode');
  const len0 = normaliseRow(m, attach, '0x9bbc54');
  const len1 = normaliseRow(m, attach + 0x10, '0x9bbcd4');
  const len2 = normaliseRow(m, attach + 0x20, '0x9bbd50');
  // 0x9bbdcc
  const sx = F(len0 * m.f32(inst + 0xe0)), sy = F(len1 * m.f32(inst + 0xe4)), sz = F(len2 * m.f32(inst + 0xe8));
  m.wf32(inst + 0xe0, sx); m.wf32(inst + 0xe4, sy); m.wf32(inst + 0xe8, sz); m.w32(inst + 0xec, 0);
  let mx = sx > sy ? sx : sy;
  mx = sz > mx ? sz : mx;
  m.wf32(inst + 0xfc, mx);
  if (!(m.u32(inst + 0x110) & 0x800)) throw new Unverified('0x9bbe20 node +0x110 bit 11 clear');
  // 0x9bbe30: the local translation row is the position scaled
  let px = F(m.f32(inst + 0xe0) * m.f32(pos));
  m.wf32(pos, px);
  const py = F(m.f32(inst + 0xe4) * m.f32(pos + 4));
  m.wf32(pos + 4, py);
  const pz = F(m.f32(inst + 0xe8) * m.f32(pos + 8));
  m.wf32(pos + 8, pz);
  px = F(s20 * px);
  m.wf32(local + 0x30, px); m.wf32(local + 0x34, py); m.wf32(local + 0x38, pz);
  m.wf32(pos, px);
  m.w32(local + 0x3c, 0x3f800000);
  matMulTo(m, world, local, attach);
  if (mode === 2) throw new Unverified('0x9bbebc node transform mode 2');
  // 0x9bbf00
  normaliseRow(m, world, '0x9bbf24');
  normaliseRow(m, world + 0x10, '0x9bbfec');
  normaliseRow(m, world + 0x20, '0x9bc090');
  const f110b = m.u32(inst + 0x110);
  for (let k = 0; k < 0x40; k += 4) m.w32(inst + k, m.u32(world + k));
  if (f110b & 0x40) throw new Unverified('0x9bc1d0 node +0x110 bit 6');
  for (let k = 0; k < 0x40; k += 4) m.w32(inst + 0x40 + k, m.u32(world + k));   // 0x9bc9ac
  if (f110b & 0x1000) throw new Unverified('0x9bca10 node +0x110 bit 12');
  sc.free();
}

// 0xae9340: the node's start delay: state 0 loads it (delay * the effect's count scale), state 1 counts
// it down, state 2 counts frames since.
export function nodeDelay(m, inst){
  const w108 = m.u32(inst + 0x108);
  let w110 = m.u32(inst + 0x110);
  const w10c = m.u32(inst + 0x10c);
  const state = w110 & 0xf;
  let d;
  if (state === 0){
    m.w32(inst + 0x118, 0);
    w110 = ((w110 & ~0xf) | 1) >>> 0;
    const base = m.u16(inst + 0x11c);
    const owner = m.u32(inst + 0x100);
    const scale = toU32(m.f32(owner + 0x1fc));
    d = (base | (Math.imul(base, scale) << 16)) >>> 0;
    m.w32(inst + 0x11c, d);
    m.w32(inst + 0x108, w108); m.w32(inst + 0x10c, w10c); m.w32(inst + 0x110, w110);
  } else if (state === 1){
    d = m.u32(inst + 0x11c);
  } else if (state === 2){
    m.w32(inst + 0x118, (m.u32(inst + 0x118) + 1) >>> 0);
    return;
  } else throw new Unverified('0xae9370 node delay state ' + state);
  if ((d >>> 16) !== 0){
    m.w32(inst + 0x11c, ((((d >>> 16) - 1) << 16) | (d & 0xffff)) >>> 0);
    return;
  }
  w110 = ((w110 & ~0xf) | 2) >>> 0;                           // 0xae93f8
  m.w32(inst + 0x108, w108); m.w32(inst + 0x10c, w10c); m.w32(inst + 0x110, w110);
  m.w32(inst + 0x118, (m.u32(inst + 0x118) + 1) >>> 0);
}

// 0x9b66a0: one substep for every node instance: integrate, transform, record how far it moved, delay.
export function moveNodes(m, owner){
  m.u32(owner + 0x1d8);
  let count = m.u32(owner + 0x1e4);
  for (let i = 0, off = 0; i < (count & 0xffff); i++, off += 0x130){
    const inst = (m.u32(owner + 0x1f4) + off) >>> 0;
    if (!(m.u32(inst + 0x10c) & 1)) throw new Unverified('0x9b6778 node instance without +0x10c bit 0');
    nodeIntegrate(m, inst);
    const ox = m.f32(inst + 0x30), oy = m.f32(inst + 0x34), oz = m.f32(inst + 0x38);
    if (m.u32(owner + 0x118) & 0x2000000) throw new Unverified('0x9b6750 effect +0x118 bit 25');
    if ((m.u32(owner + 0xf0) & 0xc000) === 0x4000) throw new Unverified('0x9b6750 effect +0xf0 mode 0x4000');
    vcall(m, owner, 0xe8, inst);
    const nz = m.f32(inst + 0x38), nx = m.f32(inst + 0x30), ny = m.f32(inst + 0x34);
    m.w32(inst + 0xdc, 0);
    m.wf32(inst + 0xd0, F(nx - ox)); m.wf32(inst + 0xd4, F(ny - oy)); m.wf32(inst + 0xd8, F(nz - oz));
    nodeDelay(m, inst);
    count = m.u32(owner + 0x1e4);
  }
}

// 0x9b6794: after a substep: every node's translation into +0xc0, and the count of nodes that still
// have a live generator into +0x1e6.
export function countNodes(m, owner){
  const a = m.u32(owner + 0x1d8), b = m.u32(owner + 0x1dc), c = m.u32(owner + 0x1e0), d = m.u32(owner + 0x1e4);
  m.w32(owner + 0x1d8, a); m.w32(owner + 0x1dc, b); m.w32(owner + 0x1e0, c);
  let r5 = d & 0xffff;
  m.w32(owner + 0x1e4, r5);
  for (let i = 0; i < (r5 & 0xffff); i++){
    const inst = (m.u32(owner + 0x1f4) + Math.imul(i, 0x130)) >>> 0;
    m.u32(inst + 0x108);
    if (!(m.u32(inst + 0x10c) & 1)) throw new Unverified('0x9b687c node instance without +0x10c bit 0');
    const x = m.u32(inst + 0x30), y = m.u32(inst + 0x34), z = m.u32(inst + 0x38);
    m.u32(inst + 0x110);
    m.w32(inst + 0xc0, x); m.w32(inst + 0xc4, y); m.w32(inst + 0xc8, z); m.w32(inst + 0xcc, 0);
    let g = m.u32(owner + 0x1f0);
    if (g === 0) throw new Unverified('0x9b6818 effect without generators');
    while (!((m.u8(g + 0x10) & 7) && m.u16(g + 0x1c) === i)){
      g = m.u32(g + 0xc);
      if (g === 0) throw new Unverified('0x9b686c node with no live generator');
    }
    const w0 = m.u32(owner + 0x1d8), w1 = m.u32(owner + 0x1dc), w2 = m.u32(owner + 0x1e0), w3 = m.u32(owner + 0x1e4);
    r5 = (((w3 & 0xffff0000) + 0x10000) | (w3 & 0xffff)) >>> 0;
    m.w32(owner + 0x1d8, w0); m.w32(owner + 0x1dc, w1); m.w32(owner + 0x1e0, w2); m.w32(owner + 0x1e4, r5);
  }
}

// 0xa91c48 (Model generator vtable +0x50): after the substeps: each particle's position blended between
// its two buffers by the frame fraction goes to the effect's vtable +0x90, whose answer lands in +0xf8.
export function modelPostPass(m, gen){
  const ed = m.u8(gen + 0xed);
  const t = m.f32(gen + 0x98);
  let p = m.u32(gen + 0xb0);
  const par = m.u32(gen + 0x34);
  if (ed & 4) throw new Unverified('0xa91d30 Model post pass, +0xed bit 2');
  if (p === 0) return;
  const u = F(1.0 - t);
  const sc = new Scratch(m);
  const pos = sc.alloc(0x10);
  do {
    const owner = m.u32(gen + 8);
    const w = m.u32(p + 0xc);
    m.w32(pos + 0xc, 0);
    const prev = p + 0x20 + ((w >>> 21) & 0x10), cur = p + 0x20 + ((w >>> 20) & 0x10);
    for (let k = 0; k < 12; k += 4){
      let s = F(t * m.f32(cur + k));
      s = F(s + F(u * m.f32(prev + k)));
      m.wf32(pos + k, s);
    }
    m.wf32(p + 0xf8, vcall(m, owner, 0x90, gen, pos, m.f32(par + 0x114)));
    p = m.u32(p + 4);
  } while (p !== 0);
  sc.free();
}

// 0xaaebb0 (LitePolyline generator vtable +0x50).
export function polylinePostPass(m, gen){
  if (m.u32(gen + 0xb0) === 0 || !(m.u8(gen + 0x10) & 4)) return;
  if (m.u8(gen + 0x40) === 0xc) throw new Unverified('0xaaebd0 LitePolyline post pass, type 12');
}

// 0x9b6130: uEffect::move, once per game frame.
export function move(m, owner){
  if (!(m.u32(owner + 0x118) & 0x1000000)) throw new Unverified('0x9b6144 effect not started');
  if (m.u32(owner + 0x11c) !== 0) throw new Unverified('0x9b616c effect +0x11c');
  if (m.u32(owner + 0x1d0) !== 0) throw new Unverified('0x9b618c effect +0x1d0');
  vcall(m, owner, 0x50);
  if (m.u8(owner + 0xf0) & 0x20) throw new Unverified('0x9b630c effect +0xf0 bit 5');
  const st = ownerState(m, owner);
  if (st === 3) throw new Unverified('0x9b630c effect state 3');
  if (st === 2) throw new Unverified('0x9b6274 effect state 2');
  if (vcall(m, owner, 0x64) === 1) throw new Unverified('0x9b629c effect vtable +0x64');
  if (vcall(m, owner, 0x5c) !== 0) return;                  // paused
  vcall(m, owner, 0x84);
  let f0 = m.u32(owner + 0xf0);
  let acc, steps, r1, r2, r3;
  if (!(f0 & 1)){
    acc = F(m.f32(owner + 0xfc) + m.f32(owner + 0x104));
    m.wf32(owner + 0x104, acc);
    steps = toU32(acc);
    r1 = m.u32(owner + 0x110); r2 = m.u32(owner + 0x114); r3 = m.u32(owner + 0x118);
  } else {                                                   // 0x9b6318: the first frame
    f0 = (f0 & ~1) >>> 0;
    m.w32(owner + 0xf0, f0);
    acc = m.f32(owner + 0x104);
    r1 = m.u32(owner + 0x110); r2 = m.u32(owner + 0x114); r3 = m.u32(owner + 0x118);
    steps = (toU32(acc) + (r1 >>> 16) - 1) >>> 0;
  }
  const whole = F(toS32(acc));                               // 0x9b6338
  m.w32(owner + 0x110, ((r1 & 0xffff0000) | (steps & 0xffff)) >>> 0);
  m.w32(owner + 0x114, r2); m.w32(owner + 0x118, r3);
  const frac = F(acc - whole);
  m.wf32(owner + 0x104, frac);
  m.w32(owner + 0x108, toS32(F(frac * 256.0)) >>> 0);
  if (m.u32(owner + 0x1b4) & 0xffff0000) throw new Unverified('0x9b6378 effect +0x1b4 countdown');
  m.u32(owner);
  if (f0 & 0x80000) throw new Unverified('0x9b64d0 effect +0xf0 bit 19');
  vcall(m, owner, 0xe4);
  if (m.u32(owner + 0x1d0) !== 0) throw new Unverified('0x9b63e4 effect +0x1d0');
  m.w32(owner + 0x20c, (m.u32(owner + 0x20c) & 0xffff0000) >>> 0);
  if (m.u16(owner + 0x110) === 0) throw new Unverified('0x9b6558 a frame without substeps');
  moveNodes(m, owner);                                       // 0x9b6410
  {
    const a = m.u32(owner + 0x1d8), b = m.u32(owner + 0x1dc), c = m.u32(owner + 0x1e0), d = m.u32(owner + 0x1e4);
    m.w32(owner + 0x1d8, a); m.w32(owner + 0x1dc, b); m.w32(owner + 0x1e0, c & 0xffff); m.w32(owner + 0x1e4, d);
  }
  for (let g = m.u32(owner + 0x1f0); g !== 0; g = m.u32(g + 0xc)){
    if (!(m.u8(g + 0x10) & 1)) continue;
    if (vcall(m, g, 0x48) !== 1) continue;
    const a = m.u32(owner + 0x1d8), b = m.u32(owner + 0x1dc), c = m.u32(owner + 0x1e0), d = m.u32(owner + 0x1e4);
    m.w32(owner + 0x1d8, a); m.w32(owner + 0x1dc, b);
    m.w32(owner + 0x1e0, (((c & 0xffff0000) + 0x10000) | (c & 0xffff)) >>> 0);
    m.w32(owner + 0x1e4, d);
  }
  countNodes(m, owner);
  const n = (m.u32(owner + 0x20c) + 1) & 0xffff;
  m.w16(owner + 0x20c, n);
  const total = m.u16(owner + 0x110);
  if (n < total) throw new Unverified('0x9b6410 a second substep in one frame');
  if (total === 0) throw new Unverified('0x9b6558 substeps cleared during the frame');
  for (let g = m.u32(owner + 0x1f0); g !== 0; g = m.u32(g + 0xc)){   // 0x9b65b8
    if (m.u8(g + 0x10) & 1) vcall(m, g, 0x50);
  }
  if (m.u16(owner + 0x1e2) === 0) throw new Unverified('0x9b6604 effect with no live generator');
  const w110 = m.u32(owner + 0x110);
  let wf0 = m.u32(owner + 0xf0);
  if (w110 & 0xffff){ wf0 = (wf0 & ~0x18000) >>> 0; m.w32(owner + 0xf0, wf0); }
  if (wf0 & 0x40) throw new Unverified('0x9b6638 effect +0xf0 bit 6');
  m.w32(owner + 0x10c, (m.u32(owner + 0x10c) + (w110 & 0xffff)) >>> 0);
  if ((m.u32(owner + 0x204) & 0xf000) === 0x3000) throw new Unverified('0x9b6648 effect +0x204 mode 3');
}

const nothing = () => {};
const CODE = new Map([
  [0x9b228c, ownerMatrix], [0x44d08, isPaused], [0x44d30, flagF0bit4], [0x9b4140, updateDelta],
  [0x9bb9d0, framePrep], [0x9bba54, nodeUpdate], [0x9bd058, attachMatrix], [0x9bd168, nothing],
  [0x9ba8c4, (m, owner, gen, pos, h) => h],                  // vtable +0x90: bx lr, s0 back unchanged
  [0xa56c10, generatorFramePrep], [0xa574c4, (m, gen) => generatorUpdate(m, gen)],
  [0xa91c48, modelPostPass], [0xa77fb4, nothing], [0xaaebb0, polylinePostPass],
]);
