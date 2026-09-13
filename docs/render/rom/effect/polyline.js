// cParticleGeneratorLitePolyline (generator type 1): a polyline per particle, its points a template
// from the parameter block (+0x1b0) placed through a per-particle basis.
//
// Translated from MHGU and checked against call vectors from the game's own run of Savage's effects
// (dev/effect-check.mjs). Arithmetic is transcribed register by register.
//
// LitePolyline particle fields past the common header (motion.js):
//   +0x40 / +0x44 uniform scale, two buffers       +0x48 its rate
//   +0x60 / +0x68 colour 1, +0x64 / +0x6c colour 2 (two buffers, 8 bytes apart); +0x70 / +0x74 bases
//   +0x78 / +0x7c shape descriptor: +0x7c byte 0 shape type, byte 1 point count, byte 2, bits 24..27,
//                 bits 28..31; +0x9c byte 0 and bits 8..11
//   +0x80 animation (flags, frames, counter +0x88, speed +0x8c); +0x90 / +0x94 frame buffers; +0x98 start
//   +0xa4 / +0xa8 width 1, +0xac / +0xb0 width 2 (two buffers); +0xb4 / +0xb8 and +0xbc / +0xc0 base, rate
// The polyline block sits at particle + generator +0xd4 (u16): the point buffers first (count * 16 each,
// two buffers), then at + count * 32: +0x00 motion direction, +0x10 random vector, +0x20 angular vector,
// +0x30 / +0x40 size (two buffers), +0x50 size velocity. (+0x00 / +0x10 are the rotation, two buffers.)
import { Unverified, F, f32bits, bitsf32 } from './mem.js';
import { baseFrame, Scratch } from './motion.js';
import { killParticle } from './life.js';
import { spawnBase, unitScale, baseColour, scaleInit, lastPass, eulerMatrix } from './spawn.js';
import { texAnimStep, animConfig } from './billboard.js';

const GOT_FLOAT_RNG = 0x183b9f8, GOT_ZERO3 = 0x1831a78, GOT_IDENTITY = 0x1832afc, GOT_ROW3 = 0x1832148;

function toS32(v){
  if (Number.isNaN(v)) return 0;
  if (v >= 2147483647) return 2147483647;
  if (v <= -2147483648) return -2147483648;
  return Math.trunc(v);
}
function envColour(col, mode, e){
  if (mode > 8) return col;
  if (0xaa & (1 << mode)) return ((col & 0x00ffffff) | (((Math.imul(col >>> 24, e) >>> 8) & 0xff) << 24)) >>> 0;
  if (0x154 & (1 << mode)){
    const g = (Math.imul((col >>> 8) & 0xff, e) & 0xff00) | (col & 0xffff0000);
    const r = (Math.imul(col & 0xff, e) >>> 8) & 0xff;
    const b = (col >>> 16) & 0xff;
    return (((g | r) & 0xff00ffff) | (((Math.imul(b, e) >>> 8) & 0xff) << 16)) >>> 0;
  }
  return col;
}

// 0x29d00: dst = a * b for 4x4 matrices. Every input is read before the first write, so dst may be a or b.
// 0x1ebe8 (MtMatrix::operator*=) is the same instructions writing through a: matMul below.
export function matMulTo(m, dst, a, b){
  let s0 = m.f32(b + 0xc), s10 = m.f32(b + 0x10), s23 = m.f32(a + 4), s21 = m.f32(a), s14 = m.f32(b);
  let s25 = m.f32(a + 8), s27 = m.f32(a + 0xc), s20 = m.f32(b + 4), s4 = m.f32(b + 8);
  const sp4 = s0;
  let s29 = F(s23 * s10); s29 = F(s29 + F(s21 * s14));
  let s3 = m.f32(b + 0x20), s8 = m.f32(b + 0x30), s30 = m.f32(b + 0x14), s26 = m.f32(b + 0x24);
  let s18 = m.f32(a + 0x20), s22 = m.f32(a + 0x24), s16 = m.f32(a + 0x28), s11 = m.f32(a + 0x2c);
  let s1 = m.f32(a + 0x30), s9 = m.f32(a + 0x34), s6 = m.f32(a + 0x38), s2 = m.f32(a + 0x3c);
  let s17 = m.f32(a + 0x1c), s19 = m.f32(a + 0x18), s31 = m.f32(a + 0x10);
  s0 = m.f32(a + 0x14);
  let s12 = m.f32(b + 0x3c), s5 = m.f32(b + 0x2c), s24 = m.f32(b + 0x1c), s7 = m.f32(b + 0x38);
  let s13 = m.f32(b + 0x28), s28 = m.f32(b + 0x18), s15 = m.f32(b + 0x34);
  s29 = F(s29 + F(s25 * s3)); s29 = F(s29 + F(s27 * s8)); m.wf32(dst, s29);
  s29 = F(s23 * s30); s29 = F(s29 + F(s21 * s20)); s29 = F(s29 + F(s25 * s26)); s29 = F(s29 + F(s27 * s15)); m.wf32(dst + 4, s29);
  s29 = F(s23 * s28); s29 = F(s29 + F(s21 * s4)); s29 = F(s29 + F(s25 * s13)); s29 = F(s29 + F(s27 * s7));
  s23 = F(s23 * s24);
  m.wf32(dst + 8, s29);
  s29 = sp4;
  s23 = F(s23 + F(s21 * s29));
  s21 = F(s10 * s0); s21 = F(s21 + F(s14 * s31));
  s23 = F(s23 + F(s25 * s5));
  s21 = F(s21 + F(s3 * s19));
  s23 = F(s23 + F(s27 * s12));
  s21 = F(s21 + F(s8 * s17));
  m.wf32(dst + 0xc, s23); m.wf32(dst + 0x10, s21);
  s21 = F(s30 * s0); s21 = F(s21 + F(s20 * s31)); s21 = F(s21 + F(s26 * s19)); s21 = F(s21 + F(s15 * s17)); m.wf32(dst + 0x14, s21);
  s21 = F(s28 * s0); s21 = F(s21 + F(s4 * s31));
  s0 = F(s24 * s0); s0 = F(s0 + F(s29 * s31));
  s21 = F(s21 + F(s13 * s19));
  s0 = F(s0 + F(s5 * s19));
  s21 = F(s21 + F(s7 * s17));
  s0 = F(s0 + F(s12 * s17));
  m.wf32(dst + 0x18, s21); m.wf32(dst + 0x1c, s0);
  s0 = F(s10 * s22); s0 = F(s0 + F(s14 * s18)); s0 = F(s0 + F(s3 * s16)); s0 = F(s0 + F(s8 * s11));
  s10 = F(s10 * s9); s10 = F(s10 + F(s14 * s1));
  s14 = F(s24 * s9); s14 = F(s14 + F(s29 * s1));
  s10 = F(s10 + F(s3 * s6));
  m.wf32(dst + 0x20, s0);
  s0 = F(s30 * s22); s0 = F(s0 + F(s20 * s18));
  s14 = F(s14 + F(s5 * s6));
  s10 = F(s10 + F(s8 * s2));
  s0 = F(s0 + F(s26 * s16));
  s14 = F(s14 + F(s12 * s2));
  s0 = F(s0 + F(s15 * s11));
  m.wf32(dst + 0x24, s0);
  s0 = F(s30 * s9); s0 = F(s0 + F(s20 * s1));
  s20 = F(s28 * s9);
  s28 = F(s28 * s22); s28 = F(s28 + F(s4 * s18));
  s20 = F(s20 + F(s4 * s1));
  s0 = F(s0 + F(s26 * s6));
  s22 = F(s24 * s22); s22 = F(s22 + F(s29 * s18));
  s28 = F(s28 + F(s13 * s16));
  s20 = F(s20 + F(s13 * s6));
  s0 = F(s0 + F(s15 * s2));
  s22 = F(s22 + F(s5 * s16));
  s28 = F(s28 + F(s7 * s11));
  s20 = F(s20 + F(s7 * s2));
  s22 = F(s22 + F(s12 * s11));
  m.wf32(dst + 0x28, s28); m.wf32(dst + 0x2c, s22); m.wf32(dst + 0x30, s10); m.wf32(dst + 0x34, s0);
  m.wf32(dst + 0x38, s20); m.wf32(dst + 0x3c, s14);
}
// 0x1ebe8: a = a * b.
export function matMul(m, a, b){ matMulTo(m, a, a, b); }

// 0xa69af0: the polyline basis: identity, scaled by `size`, rotated by the euler vector `rot` (order
// generator +0xea), then by the generator transform (+0x100); translation from the ROM row at
// 0x1917600. `dir` is not read on the recorded path.
export function polyBasis(m, out, gen, flags, rot, dir, size){
  const id = m.u32(GOT_IDENTITY);
  for (let k = 0; k < 16; k++) m.w32(out + 4 * k, m.u32(id + 4 * k));
  if (m.u32(gen + 0xec) & 0x2000) throw new Unverified('0xa69c3c generator +0xed bit 5');
  const sc = new Scratch(m);
  const S = sc.alloc(64), E = sc.alloc(64);
  for (let k = 0; k < 16; k++) m.w32(S + 4 * k, 0);
  m.w32(S, m.u32(size)); m.w32(S + 0x14, m.u32(size + 4)); m.w32(S + 0x28, m.u32(size + 8)); m.wf32(S + 0x3c, 1.0);
  matMul(m, out, S);
  eulerMatrix(m, E, rot, m.u16(gen + 0xea) & 0xf);
  matMul(m, out, E);
  if (m.u8(gen + 0x52) & 2) throw new Unverified('0xa69d58 generator +0x52 bit 1');
  if (flags & 0x80) throw new Unverified('0xa69cd4 polyline flag 0x80');
  matMul(m, out, gen + 0x100);
  const row = m.u32(GOT_ROW3);
  m.w32(out + 0x30, m.u32(row)); m.w32(out + 0x34, m.u32(row + 4));
  m.w32(out + 0x38, m.u32(row + 8)); m.w32(out + 0x3c, m.u32(row + 0xc));
  sc.free();
}

// the template points through a basis's 3x3 part into a point buffer (the loops at 0xa651c8 / 0xa65434)
function placePoints(m, M, shape, dst, count){
  const s4 = m.f32(M), s6 = m.f32(M + 4), s8 = m.f32(M + 8), s10 = m.f32(M + 0x10), s14 = m.f32(M + 0x14);
  const s2 = m.f32(M + 0x18), s1 = m.f32(M + 0x20), s12 = m.f32(M + 0x24), s0 = m.f32(M + 0x28);
  for (let i = 0; i < count; i++){
    const src = shape + 0x70 + 16 * i, d = dst + 16 * i;
    let s5 = m.f32(src + 4);
    const s3 = m.f32(src), s7 = m.f32(src + 8);
    m.w32(d + 0xc, 0);
    let s9 = F(s10 * s5), s11 = F(s5 * s14);
    s9 = F(s9 + F(s4 * s3)); s11 = F(s11 + F(s3 * s6));
    s5 = F(s5 * s2); s5 = F(s5 + F(s3 * s8));
    s9 = F(s9 + F(s1 * s7)); s11 = F(s11 + F(s7 * s12)); s5 = F(s5 + F(s7 * s0));
    m.wf32(d, s9); m.wf32(d + 4, s11); m.wf32(d + 8, s5);
  }
}

// the motion direction, normalised when it is long enough (as in the Model update)
function direction(m, upd, out){
  const x = m.f32(upd), y = m.f32(upd + 4), z = m.f32(upd + 8);
  let l2 = F(y * y); l2 = F(l2 + F(x * x)); l2 = F(l2 + F(z * z));
  const len = F(Math.sqrt(l2));
  if (Number.isNaN(len)) throw new Unverified('0xa650a4 sqrtf fallback');
  if (len < 1.1920928955078125e-07){
    m.w32(out, m.u32(upd)); m.w32(out + 4, m.u32(upd + 4)); m.w32(out + 8, m.u32(upd + 8));
  } else throw new Unverified('0xa650f0 normalised polyline direction');
  m.w32(out + 0xc, 0);
}

// 0xa65014: the polyline's points for this frame (both buffers when `both` is 1).
export function polyPoints(m, gen, p, shape, both){
  const wc = m.u32(p + 0xc), w7c = m.u32(p + 0x7c);
  const blockOff = m.u16(gen + 0xd4);
  const idx = m.u16(p + 8);
  const upd = (m.u32(gen + 0x24) + m.u32(gen + 0xc8) + m.u16(gen + 0xda) * idx) >>> 0;
  const bit = (wc >>> 24) & 1;
  const count = (w7c >>> 8) & 0xff;
  const block = p + blockOff;
  const area = block + (count << 5);
  const sc = new Scratch(m);
  const dir = sc.alloc(16), size = sc.alloc(16), M = sc.alloc(64);
  direction(m, upd, dir);
  const scale = m.f32(p + 0x40 + ((m.u8(p + 0xf) & 1) << 2));
  const sz = area + 0x30 + (bit << 4);
  m.wf32(size, F(scale * m.f32(sz))); m.wf32(size + 4, F(scale * m.f32(sz + 4)));
  m.wf32(size + 8, F(scale * m.f32(sz + 8))); m.w32(size + 0xc, 0);
  polyBasis(m, M, gen, wc & 0xffff, area + (bit << 4), dir, size);
  const cur = bit ? block + (count << 4) : block;
  placePoints(m, M, shape, cur, count);
  if (both === 1){                                           // 0xa6522c: the previous buffer too
    const idx2 = m.u16(p + 8), wc2 = m.u32(p + 0xc);
    const upd2 = (m.u32(gen + 0x24) + m.u32(gen + 0xc8) + m.u16(gen + 0xda) * idx2) >>> 0;
    const prevBit = (wc2 >>> 25) & 1;
    direction(m, upd2, dir);
    const scale2 = m.f32(p + 0x40 + (((m.u32(p + 0xc) >>> 25) & 1) << 2));
    const sz2 = area + 0x30 + (prevBit << 4);
    m.wf32(size, F(scale2 * m.f32(sz2))); m.wf32(size + 4, F(scale2 * m.f32(sz2 + 4)));
    m.wf32(size + 8, F(scale2 * m.f32(sz2 + 8))); m.w32(size + 0xc, 0);
    polyBasis(m, M, gen, wc2 & 0xffff, area + (prevBit << 4), dir, size);
    if (count !== 0) placePoints(m, M, shape, cur + ((prevBit ? count : -count) << 4), count);
  }
  sc.free();
}

// 0xa67540: the polyline's random vector (and an angular vector, zero on the recorded path).
export function polyRandomVec(m, gen, p, out1, out2, base1, base2, mode){
  const zero = m.u32(GOT_ZERO3);
  const zx = m.u32(zero), zy = m.u32(zero + 4), zz = m.u32(zero + 8);
  if (mode !== 0) throw new Unverified('0xa67594 polyline random vector mode');
  const tbl = m.u32(GOT_FLOAT_RNG);
  const c0 = m.u32(gen + 0x4c);
  const draw = k => { m.w32(gen + 0x4c, (c0 + k) >>> 0); return m.f32(tbl + 4 * ((c0 + k) & 0xfff)); };
  const r1 = draw(1), r2 = draw(2), r3 = draw(3);
  const x = F(m.f32(base1) + F(r1 * m.f32(base1 + 4)));
  const y = F(m.f32(base1 + 8) + F(r2 * m.f32(base1 + 0xc)));
  if ((m.u32(gen + 0x50) >>> 16) & 0x80) throw new Unverified('0xa67700 polyline angular vector');
  const z = F(m.f32(base1 + 0x10) + F(r3 * m.f32(base1 + 0x14)));
  if (m.u8(gen + 0xed) & 8) throw new Unverified('0xa678e8 generator +0xed bit 3');
  if (m.u8(gen + 0xc1) & 0x40) throw new Unverified('0xa67928 generator +0xc1 bit 6');
  m.wf32(out1, x); m.wf32(out1 + 4, y); m.wf32(out1 + 8, z); m.w32(out1 + 0xc, 0);
  m.w32(out2, zx); m.w32(out2 + 4, zy); m.w32(out2 + 8, zz); m.w32(out2 + 0xc, 0);
}

// 0xa6b2f4: shape type 1 at spawn -- random size and size velocity (shape +0x00..+0x2c), rotation
// (shape +0x30.., both buffers at block +0x00/+0x10) and angular vector (+0x20), then the points.
export function polyShapeInit1(m, gen, p, shape){
  const w7c = m.u32(p + 0x7c);
  const area = p + m.u16(gen + 0xd4) + ((w7c >>> 3) & 0x1fe0);
  if (m.u32(shape + 0x68) !== 0) throw new Unverified('0xa6b334 polyline shape +0x68');
  const tbl = m.u32(GOT_FLOAT_RNG);
  const c0 = m.u32(gen + 0x4c);
  const draw = (k, t) => { m.w32(gen + 0x4c, (c0 + k) >>> 0); return m.f32(t + 4 * ((c0 + k) & 0xfff)); };
  const r1 = draw(1, tbl), r2 = draw(2, tbl), r3 = draw(3, tbl), r4 = draw(4, tbl);
  const sx = F(m.f32(shape) + F(r1 * m.f32(shape + 4)));
  const sy = F(m.f32(shape + 8) + F(r2 * m.f32(shape + 0xc)));
  const sz = F(m.f32(shape + 0x10) + F(r3 * m.f32(shape + 0x14)));
  m.wf32(area + 0x50, F(m.f32(shape + 0x18) + F(r4 * m.f32(shape + 0x1c))));
  m.wf32(area + 0x54, F(m.f32(shape + 0x20) + F(draw(5, tbl) * m.f32(shape + 0x24))));
  m.wf32(area + 0x58, F(m.f32(shape + 0x28) + F(draw(6, tbl) * m.f32(shape + 0x2c))));
  m.wf32(area + 0x40, sx); m.wf32(area + 0x44, sy); m.wf32(area + 0x48, sz); m.w32(area + 0x4c, 0);
  m.w32(area + 0x30, m.u32(area + 0x40)); m.w32(area + 0x34, m.u32(area + 0x44));
  m.w32(area + 0x38, m.u32(area + 0x48)); m.w32(area + 0x3c, 0);
  const sc = new Scratch(m);
  const v1 = sc.alloc(16), v2 = sc.alloc(16);
  polyRandomVec(m, gen, p, v1, v2, shape + 0x30, shape + 0x48, m.u32(shape + 0x6c));
  const a = m.u32(v1), b = m.u32(v1 + 4), c = m.u32(v1 + 8);
  m.w32(area + 0x10, a); m.w32(area + 0x14, b); m.w32(area + 0x18, c); m.w32(area + 0x1c, 0);
  m.w32(area, a); m.w32(area + 4, b); m.w32(area + 8, c); m.w32(area + 0xc, 0);
  m.w32(area + 0x20, m.u32(v2)); m.w32(area + 0x24, m.u32(v2 + 4)); m.w32(area + 0x28, m.u32(v2 + 8)); m.w32(area + 0x2c, 0);
  polyPoints(m, gen, p, shape, 1);
  sc.free();
}

// 0xa6b06c: shape init by type (particle +0x7c low byte).
export function polyShapeInit(m, gen, p, shape, info){
  const type = m.u32(p + 0x7c) & 0xff;
  if (type === 1) return polyShapeInit1(m, gen, p, shape);   // 0xa6b1f0
  throw new Unverified('0xa6b0a4 polyline shape type ' + type);
}

// 0xa6ecc4: shape type 1 per frame -- size += velocity, then the points (both buffers when the node
// tracks or generator +0x43 bit 5).
export function polyShapeUpdate1(m, gen, p, shape){
  const w7c = m.u32(p + 0x7c);
  const area = p + m.u16(gen + 0xd4) + ((w7c >>> 3) & 0x1fe0);
  m.u32(p + 8);
  const wc = m.u32(p + 0xc);
  if (m.u8(p + 0x12) & 0x80) throw new Unverified('0xa6ed64 particle +0x12 bit 7');
  const v0 = m.f32(area + 0x50), v1 = m.f32(area + 0x54), v2 = m.f32(area + 0x58);
  const prev = area + 0x30 + ((wc >>> 21) & 0x10), cur = area + 0x30 + (((wc >>> 24) & 1) << 4);
  const a0 = m.f32(prev), a1 = m.f32(prev + 4), a2 = m.f32(prev + 8);
  m.w32(cur + 0xc, 0);
  m.wf32(cur, F(a0 + v0)); m.wf32(cur + 4, F(a1 + v1)); m.wf32(cur + 8, F(a2 + v2));
  if (m.u32(p + 0x10) & 0x200400) throw new Unverified('0xa6edf0 polyline rotation');
  let both = 1;
  if (!(m.u32(m.u32(gen + 0x18) + 0x110) & 0x80)) both = (m.u8(gen + 0x43) >>> 5) & 1;
  polyPoints(m, gen, p, shape, both);
}

// 0xa6ea50: per-frame shape update by type.
export function polyShapeUpdate(m, gen, p, shape){
  const type = m.u32(p + 0x7c) & 0xff;
  if (type === 1){ polyShapeUpdate1(m, gen, p, shape); return 1; }   // 0xa6eac8
  throw new Unverified('0xa6ea7c polyline shape type ' + type);
}

// 0xcaa710: bind the animation into the particle's +0x80 block. Returns 0 when bound.
export function animBindLPL(m, p, anim, cfg){
  m.w16(p + 0xa0, 0);
  const flags16 = m.u16(cfg);
  if (anim === 0) throw new Unverified('0xcaa7b4 no rEffectAnim');
  const seq = m.u32(cfg + 4), startBits = m.u32(cfg + 8);
  let s0 = m.f32(cfg + 0xc);
  const r4 = (flags16 | (seq << 16)) >>> 0;
  m.w32(p + 0x80, r4);
  const r1 = m.u32(m.u32(anim + 0x6c) + (seq << 5) + 4);
  const frames = r1 & 0xffff;
  const s2 = F(frames);
  const packed = (frames | ((((r1 << 16) >>> 0) + 0xffff0000) >>> 0)) >>> 0;
  const s4 = F(toS32(F(s0 / s2)));
  m.w32(p + 0x80, r4); m.w32(p + 0x84, packed);
  m.w32(p + 0x88, startBits);
  s0 = F(s0 - F(s2 * s4));
  m.wf32(p + 0x8c, s0);
  const v8 = m.u32(cfg + 8);
  m.w32(p + 0x94, v8); m.w32(p + 0x90, v8);
  m.w32(p + 0x98, m.u32(cfg + 0x10));
  const w8 = m.u32(p + 8), wc = m.u32(p + 0xc);
  m.w32(p + 8, w8); m.w32(p + 0xc, (wc | 0x8000000) >>> 0);
  return 0;
}

// 0xa6908c: the second base colour, generator +0x178 on the recorded path.
export function baseColour2(m, out, gen){
  const w = m.u32(gen + 0x194);
  if (w & 0xf) throw new Unverified('0xa6909c colour source ' + (w & 0xf));
  if (w & 0x20) throw new Unverified('0xa69160 colour source bit 5');
  m.w32(out, m.u32(gen + 0x178));
}

// 0xab4710 (slot 23): spawn one LitePolyline particle. Returns particle +0x0c bit 26.
export function spawnLPL(m, gen, p, info){
  if (spawnBase(m, gen, p, info) !== 1) return 0;
  const param = m.u32(gen + 0x34);
  let d = m.u32(p + 0x7c);
  const w78 = m.u32(p + 0x78);
  const w170 = m.u32(param + 0x170);
  d = ((d & ~0xff) | (w170 & 0xff)) >>> 0;
  m.w32(p + 0x7c, d); m.w32(p + 0x78, w78);
  d = ((d & ~0xff00) | ((m.u32(param + 0x170) >>> 8 & 0xff) << 8)) >>> 0;
  m.w32(p + 0x7c, d); m.w32(p + 0x78, w78);
  d = ((d & ~0xff0000) | ((m.u16(param + 0x172) & 0xff) << 16)) >>> 0;
  m.w32(p + 0x7c, d); m.w32(p + 0x78, w78);
  d = ((d & ~0x0f000000) | ((m.u32(param + 0x174) & 0xf) << 24)) >>> 0;
  m.w32(p + 0x7c, d); m.w32(p + 0x78, w78);
  let e = ((m.u32(p + 0x9c) & ~0xff) | m.u8(param + 0x173)) >>> 0;
  m.w32(p + 0x9c, e);
  e = ((e & ~0xf00) | ((((m.u32(param + 0x174) >>> 4) & 0xffffff) & 0xf) << 8)) >>> 0;
  m.w32(p + 0x9c, e);
  d = ((d & 0x0fffffff) | ((m.u32(param + 0x174) << 20) & 0xf0000000)) >>> 0;
  m.w32(p + 0x7c, d); m.w32(p + 0x78, w78);
  const sc = new Scratch(m);
  const cfg = sc.alloc(0x14), cbuf = sc.alloc(4);
  animConfig(m, gen, p, cfg);
  if (animBindLPL(m, p, m.u32(m.u32(gen + 0x28) + 0x14), cfg) === 1) throw new Unverified('0xab4800 unbound polyline animation');
  const f4 = m.u32(gen + 0xf4), fl = m.u32(cfg), w0 = m.u32(param);
  m.w32(p + 0x1c, f4);
  const w18 = ((((((fl >>> 8) & 3) | ((fl >>> 10) & 4)) << 26) >>> 0 | (w0 >>> 19)) & 0x1c001fe0) >>> 0;
  m.w32(p + 0x18, w18); m.w32(p + 0x18, w18);
  unitScale(m, gen, p);
  if (m.u32(param + 0x40) >>> 16) throw new Unverified('0xab4908 colour curve at spawn');
  baseColour(m, cbuf, gen);
  let col = m.u32(cbuf);
  m.w32(p + 0x70, col);
  const mode = (m.u32(gen + 0x40) >>> 12) & 0xf;
  m.u32(gen + 0x44);
  if (mode !== 0) col = envColour(col, mode, toS32(F(m.f32(info + 0x20) * 256.0)));   // 256.0 at 0xab49c8
  m.w32(p + 0x68, col); m.w32(p + 0x60, col);
  if (!(m.u8(p + 0x7f) & 0xf)) throw new Unverified('0xab4b04 polyline without a second colour');
  if (m.u16(param + 0x1a8) !== 0) throw new Unverified('0xab4a90 param +0x1a8 colour curve');
  baseColour2(m, cbuf, gen);
  let col2 = m.u32(cbuf);
  m.w32(p + 0x74, col2);
  const mode2 = (m.u32(gen + 0x40) >>> 12) & 0xf;
  m.u32(gen + 0x44);
  if (mode2 !== 0) col2 = envColour(col2, mode2, toS32(F(m.f32(info + 0x20) * 256.0)));   // 256.0 at 0xab4b54
  m.w32(p + 0x6c, col2); m.w32(p + 0x64, col2);
  const scale = scaleInit(m, gen, p, 0.0);                   // 0.0 at 0xab4bec; its s0 on return
  const s20 = F(scale * m.f32(gen + 0xfc));
  if (m.u32(param + 0x1a8) >>> 16) throw new Unverified('0xab4c24 param +0x1aa width curve');
  const tbl = m.u32(GOT_FLOAT_RNG);
  let c0 = m.u32(gen + 0x4c);
  m.w32(gen + 0x4c, (c0 + 1) >>> 0);
  const q1 = m.f32(tbl + 4 * ((c0 + 1) & 0xfff));
  m.w32(gen + 0x4c, (c0 + 2) >>> 0);
  const q2 = m.f32(tbl + 4 * ((c0 + 2) & 0xfff));
  const w1 = F(m.f32(param + 0x180) + F(q1 * m.f32(param + 0x184)));
  const r1 = F(m.f32(param + 0x188) + F(q2 * m.f32(param + 0x18c)));
  if (!(r1 === 0)) throw new Unverified('0xab4d08 width rate');
  const sw1 = F(s20 * w1);
  m.wf32(p + 0xb4, w1); m.wf32(p + 0xb8, r1); m.wf32(p + 0xa8, sw1); m.wf32(p + 0xa4, sw1);
  if (!(m.u8(p + 0x9d) & 0xf)) throw new Unverified('0xab4e38 polyline without a second width');
  if (m.u16(param + 0x1ac) !== 0) throw new Unverified('0xab4d44 param +0x1ac width curve');
  c0 = m.u32(gen + 0x4c);
  const tbl2 = m.u32(GOT_FLOAT_RNG);
  m.w32(gen + 0x4c, (c0 + 1) >>> 0);
  const q3 = m.f32(tbl2 + 4 * ((c0 + 1) & 0xfff));
  m.w32(gen + 0x4c, (c0 + 2) >>> 0);
  const q4 = m.f32(tbl2 + 4 * ((c0 + 2) & 0xfff));
  const w2 = F(m.f32(param + 0x190) + F(q3 * m.f32(param + 0x194)));
  const r2 = F(m.f32(param + 0x198) + F(q4 * m.f32(param + 0x19c)));
  if (!(r2 === 0)) throw new Unverified('0xab4e2c second width rate');
  const sw2 = F(s20 * w2);
  m.wf32(p + 0xbc, w2); m.wf32(p + 0xc0, r2); m.wf32(p + 0xb0, sw2); m.wf32(p + 0xac, sw2);
  polyShapeInit(m, gen, p, param + 0x1b0, info);
  if (m.u32(gen + 0xcc) !== 0) throw new Unverified('0xab4e6c generator +0xcc');
  if (m.u8(gen + 0x43) & 0xf) throw new Unverified('0xab4ea0 generator +0x43 low nibble');
  lastPass(m, gen, p);
  sc.free();
  return (m.u32(p + 0xc) >>> 26) & 1;
}

// 0xab5090: one LitePolyline particle, one frame. Returns 0 to free it.
export function updateLPLParticle(m, gen, p){
  m.u32(p + 8);
  const r7 = m.u32(p + 0xc);
  if (!(r7 & 0x8000000)) throw new Unverified('0xab50bc polyline without animation');
  if (texAnimStep(m, gen, p, p + 0x80, m.f32(p + 0x98)) !== 1) return 0;
  m.w32(p + 0x90 + ((m.u8(p + 0xf) & 1) << 2), m.u32(p + 0x88));
  const f10 = m.u32(p + 0x10);
  if (f10 & 0x20000) throw new Unverified('0xab513c colour curve');
  if (f10 & 0x40000) throw new Unverified('0xab518c second colour curve');
  if (!(r7 & 0x40)) throw new Unverified('0xab51d4 unchanged envelope');
  const g40 = m.u32(gen + 0x40), pool = m.u32(gen + 0x24);
  m.u32(gen + 0x44);
  const lo = m.u32(gen + 0xc4), lsz = m.u16(gen + 0xd8);
  const w8 = m.u32(p + 8), wc = m.u32(p + 0xc);
  const mode = (g40 >>> 12) & 0xf;
  const base1 = m.u32(p + 0x70);
  if (mode === 0) throw new Unverified('0xab52cc colour mode 0');
  const env = m.f32((pool + lo + lsz * (w8 & 0xffff)) >>> 0);
  const e = toS32(F(env * 256.0));                           // 256.0 at 0xab523c
  const bit = (wc >>> 24) & 1;
  m.w32(p + 0x60 + (bit << 3), envColour(base1, mode, e));
  let c2;
  if (m.u8(p + 0x7f) & 0xf){
    m.u32(gen + 0x40); m.u32(gen + 0x44);
    const base2 = m.u32(p + 0x74);
    c2 = envColour(base2, (m.u32(gen + 0x40) >>> 12) & 0xf, toS32(F(env * 256.0)));   // 256.0 at 0xab52fc
  } else throw new Unverified('0xab52e0 polyline without a second colour');
  m.w32(p + 0x64 + (bit << 3), c2);
  const f10b = m.u32(p + 0x10);
  if (f10b & 0x100100) throw new Unverified('0xab53a4 polyline scale step');
  const s16 = m.f32(gen + 0xfc);
  if (f10b & 0x1000000) throw new Unverified('0xab5414 particle +0x10 bit 24');
  const s18 = m.f32(p + 0x40 + (bit << 2));
  let s0 = m.f32(p + 0xb4);
  if (f10b & 1) throw new Unverified('0xab53f8 width rate');
  const sc = F(s18 * s16);
  m.wf32(p + 0xa4 + (bit << 2), F(sc * s0));
  if (!(m.u8(p + 0x9d) & 0xf)) throw new Unverified('0xab54fc polyline without a second width');
  const f10c = m.u32(p + 0x10);
  if (f10c & 0x2000000) throw new Unverified('0xab54b0 particle +0x10 bit 25');
  s0 = m.f32(p + 0xbc);
  if (f10c & 2) throw new Unverified('0xab5494 second width rate');
  m.wf32(p + 0xac + (bit << 2), F(sc * s0));
  return polyShapeUpdate(m, gen, p, m.u32(gen + 0x34) + 0x1b0);
}

// 0xab4f64 (slot 24): the LitePolyline particle pass.
export function polylineFrame(m, gen){
  if (baseFrame(m, gen) !== 1) return 0;
  let p = m.u32(gen + 0xb0);
  while (p){
    if (updateLPLParticle(m, gen, p) === 1) p = m.u32(p + 4);
    else p = killParticle(m, gen, p);
    const d0 = m.u32(gen + 0xd0), d4 = m.u32(gen + 0xd4);
    const rest = [];
    for (let i = 0; i < 6; i++) rest.push(m.u32(gen + 0xd8 + 4 * i));
    m.w32(gen + 0xd0, ((d0 & 0xffff) | (((d0 + 0x10000) >>> 0) & 0xffff0000)) >>> 0);
    m.w32(gen + 0xd4, d4);
    for (let i = 0; i < 6; i++) m.w32(gen + 0xd8 + 4 * i, rest[i]);
  }
  if (m.u8(gen + 0x43) & 0xf) throw new Unverified('0xab5018 generator +0x43 low nibble');
  if (m.u32(gen + 0xcc) !== 0 && m.u32(gen + 0xb0) !== 0) throw new Unverified('0xab507c generator +0xcc');
  return 1;
}
