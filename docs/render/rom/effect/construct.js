// CONSTRUCTION: an effect built the way the game builds one -- uEffect::newInstance, then its start
// routine (the generator factory, the node and particle pools, node setup, per-generator start).
//
// Translated from MHGU and checked against call vectors from the game's own construction of Savage's
// em043_05_002_s (dev/effect-check.mjs). What the game asks of the outside world goes through m.svc:
//   alloc(size, align) -> address        a fresh zeroed block from the heap the effect is built on
//   nextId(manager) -> id                 the effect manager's unique-id counter (0xb8f4b8)
// Everything else is the ROM's own logic over the game's own struct layouts.
import { Unverified, F } from './mem.js';
import { Scratch } from './motion.js';
import { eulerMatrix, matToQuat } from './spawn.js';
import { vcall, registerCode } from './owner.js';

const GOT_EFFECT_MANAGER = 0x183b9ec;        // -> 0x211f554
const GOT_SYSTEM = 0x1831cb0;                // -> 0x211f764, the system timer (+0x38 frame period)
const GOT_ZERO3 = 0x1831a78;                 // -> MtVector3 Zero 0x19176b0
const GOT_ROW3 = 0x1832b08;                  // -> 0x19176c0
const GOT_IDENTITY = 0x1832afc;              // -> MtMatrix Identity 0x19177b0
const GOT_QUAT_IDENTITY = 0x1832ad8;         // -> 0x19178d0
const GOT_FLOAT_RNG = 0x183b9f8;             // -> 0x177beb0, 4096 floats
const GOT_RANDOM = 0x1832ae0;                // -> 0x1917a18, the MtRandom the effect manager draws from
const GOT_WHITE = 0x1832440;                 // -> 0x1777e2c

const mgrOf = (m) => m.u32(m.u32(GOT_EFFECT_MANAGER));
const vtableFrom = (m, got) => (m.u32(got) + 8) >>> 0;
function copyWords(m, dst, src, n){ for (let i = 0; i < n; i++) m.w32(dst + 4 * i, m.u32(src + 4 * i)); }
function clear(m, dst, n){ for (let i = 0; i < n; i++) m.w8(dst + i, 0); }          // __aeabi_memclr
const bfi = (dst, src, lsb, width) => {
  const mask = (width === 32 ? 0xffffffff : ((1 << width) - 1)) >>> 0;
  return ((dst & ~((mask << lsb) >>> 0)) | ((src & mask) << lsb)) >>> 0;
};

// ---- uEffect ------------------------------------------------------------------------------------

// 0x884990: the unit base constructor.
function unitCtor(m, p){
  m.w32(p, vtableFrom(m, 0x183ab08));
  const c = m.u32(p + 0xc);
  m.w32(p + 0x10, 0);
  m.w32(p + 0xc, bfi(c, 0xf4ff9, 0, 26));
  m.w32(p + 0x14, 0); m.w32(p + 0x18, 0); m.w32(p + 4, 0); m.w32(p + 0x1c, 0x3f800000);
  m.w32(p + 8, 0); m.w32(p + 0x20, 0); m.w32(p + 0x24, 0);
}

// 0x8a46a0: the coordinate base: position zero, identity quaternion, unit scale.
function coordCtor(m, p){
  unitCtor(m, p);
  m.w32(p, vtableFrom(m, 0x183ad34));
  const z = m.u32(GOT_ZERO3);
  m.w32(p + 0x40, m.u32(z)); m.w32(p + 0x44, m.u32(z + 4));
  const q = m.u32(GOT_QUAT_IDENTITY);
  m.w32(p + 0x48, m.u32(z + 8)); m.w32(p + 0x4c, 0);
  m.w32(p + 0x50, m.u32(q)); m.w32(p + 0x54, m.u32(q + 4)); m.w32(p + 0x58, m.u32(q + 8)); m.w32(p + 0x5c, m.u32(q + 0xc));
  m.w32(p + 0x60, 0x3f800000); m.w32(p + 0x64, 0x3f800000); m.w32(p + 0x68, 0x3f800000);
  m.w32(p + 0x6c, 0); m.w32(p + 0x30, 0); m.w32(p + 0x34, 0xffffffff); m.w32(p + 0x38, 0x30004);
}

// 0x9b1f7c: uEffect's own fields: frame period from the system timer, particle volume from the manager.
function effectFields(m, p){
  m.w32(p + 0x10, 0); m.w32(p + 0xf0, 1); m.w32(p + 0xf4, 0);
  const timer = m.u32(m.u32(GOT_SYSTEM));
  m.w32(p + 0xf8, m.u32(timer + 0x38));
  m.w32(p + 0xfc, 0x3f800000); m.w32(p + 0x100, 0x3f800000); m.w32(p + 0x104, 0x3f800000);
  m.w32(p + 0x108, 0x100); m.w32(p + 0x10c, 0);
  const f118 = m.u32(p + 0x118);
  m.w32(p + 0x110, 0x10000); m.w32(p + 0x114, 0x6000000);
  m.w32(p + 0x118, ((f118 & 0xfcffff00) | 0x80) >>> 0);
  let cap = m.u32(mgrOf(m) + 0x15c);
  if (cap >= 2) cap = 2;
  m.w32(p + 0x118, (0x40022080 | ((cap & 0xf) << 8)) >>> 0);
  m.w32(p + 0x11c, 0);
  const id = m.u32(GOT_IDENTITY);
  copyWords(m, p + 0x120, id, 16);
  copyWords(m, p + 0xb0, id, 16);
  const z = m.u32(GOT_ZERO3);
  const x = m.u32(z), y = m.u32(z + 4), zz = m.u32(z + 8);
  m.w32(p + 0x160, x); m.w32(p + 0x164, y); m.w32(p + 0x168, zz); m.w32(p + 0x16c, 0);
  m.w32(p + 0x170, x); m.w32(p + 0x174, y); m.w32(p + 0x178, zz); m.w32(p + 0x17c, 0);
  for (let k = 0x180; k <= 0x19c; k += 4) m.w32(p + k, 0x3f800000);
}

// 0x9b1f1c
function effectBaseCtor(m, p){
  coordCtor(m, p);
  m.w32(p, vtableFrom(m, 0x183b9e8));
  m.w32(p + 0x16c, 0); m.w32(p + 0x19c, 0x3f800000); m.w32(p + 0x17c, 0);
  for (let k = 0x180; k <= 0x198; k += 4) m.w32(p + k, 0x3f800000);
  effectFields(m, p);
}

// 0x9b5cc8: uEffect::newInstance.
export function newEffect(m){
  const p = m.svc.alloc(0x210, 0x10);
  effectBaseCtor(m, p);
  m.w32(p, vtableFrom(m, 0x183ba0c));
  m.w32(p + 0xf0, 0x100001);
  const r = m.u32(GOT_ROW3);
  m.w32(p + 0x1a0, m.u32(r)); m.w32(p + 0x1a4, m.u32(r + 4)); m.w32(p + 0x1a8, m.u32(r + 8));
  m.w32(p + 0x1ac, 0); m.w32(p + 0x1b0, 0x3f800000); m.w32(p + 0x1b8, 0x7f0000); m.w32(p + 0x1b4, 0);
  m.w32(p + 0x1bc, 0x3f800000); m.w32(p + 0x1fc, 0x3f800000);
  m.w32(p + 0x1c0, 0); m.w32(p + 0x1c4, 0xffffffff); m.w32(p + 0x1cc, 0xffffffff); m.w32(p + 0x1c8, 0xffffffff);
  m.w32(p + 0x1d0, 0); m.w32(p + 0x1d4, 0); m.w32(p + 0x1e4, 0); m.w32(p + 0x1e0, 0); m.w32(p + 0x1dc, 0);
  m.w32(p + 0x1d8, 0x10000);
  m.w32(p + 0x1f8, 0); m.w32(p + 0x1f4, 0); m.w32(p + 0x1f0, 0); m.w32(p + 0x1ec, 0);
  m.w32(p + 0x204, (m.u32(p + 0x204) & ~0xfff) >>> 0);
  m.w32(p + 0x1e8, m.svc.nextId(mgrOf(m)));
  m.w32(p + 0x200, 0x42480000);
  m.w32(p + 0x204, (m.u32(p + 0x204) & ~0xf000) >>> 0);
  m.w32(p + 0x208, 0); m.w32(p + 0x20c, 0);
  return p;
}

// ---- the manager's random numbers ----------------------------------------------------------------

// 0x7c9234: MtRandom::rand, a 128-bit xorshift.
export function random(m, o){
  const a = m.u32(o), b = m.u32(o + 4);
  m.w32(o, b);
  let t = (a ^ (a << 15)) >>> 0;
  const c = m.u32(o + 8);
  t = (t ^ (t >>> 4)) >>> 0;
  m.w32(o + 4, c);
  const d = m.u32(o + 0xc);
  t = (t ^ d) >>> 0;
  m.w32(o + 8, d);
  t = (t ^ (d >>> 21)) >>> 0;
  m.w32(o + 0xc, t);
  return t;
}

// 0xb8eea0: a random number from the effect manager (flag clear: the shared MtRandom).
export function managerRandom(m, mgr, flag){
  if (flag !== 0) throw new Unverified('0xb8eeb0 manager random with a flag');
  return random(m, m.u32(GOT_RANDOM));
}

// ---- generators ---------------------------------------------------------------------------------

// 0xae957c: the generator base constructor.
function generatorBaseCtor(m, g){
  m.w32(g, vtableFrom(m, 0x183c9e8));
  m.w32(g + 8, 0); m.w32(g + 0xc, 0); m.w32(g + 0x14, 0xffffffff); m.w32(g + 0x18, 0); m.w32(g + 0x1c, 0xffffffff);
  for (let k = 0x20; k <= 0x3c; k += 4) m.w32(g + k, 0);
  m.w32(g + 0x44, 0x371100); m.w32(g + 0x40, 0x1b); m.w32(g + 0x4c, 0); m.w32(g + 0x48, 0);
  m.w32(g + 0x10, 7); m.w32(g + 0x80, 0); m.w32(g + 0x84, 0);
  const t = m.u32(0x1837f30);
  m.w32(g + 0x60, m.u32(t)); m.w32(g + 0x64, m.u32(t + 4)); m.w32(g + 0x68, m.u32(t + 8)); m.w32(g + 0x6c, 0);
  m.w32(g + 0x70, m.u32(t + 0x10)); m.w32(g + 0x74, m.u32(t + 0x14)); m.w32(g + 0x78, m.u32(t + 0x18));
  m.w32(g + 0x7c, 0); m.w32(g + 0x8c, 0); m.w32(g + 0x90, 0); m.w32(g + 0x94, 0); m.w32(g + 0x98, 0x3f800000);
  m.w32(g + 0x9c, 0x100); m.w32(g + 0xa0, 0); m.w32(g + 0xa4, 0xffffffff); m.w32(g + 0xa8, 0);
  m.w32(g + 0x50, 0x20000000);
  m.w16(g + 4, 0);
}

// 0xa55db4: cParticleGenerator's constructor.
function generatorCtor(m, g){
  generatorBaseCtor(m, g);
  m.w32(g, vtableFrom(m, 0x183c88c));
  m.w32(g + 0x14c, 0);
  for (let k = 0xb0; k <= 0xcc; k += 4) m.w32(g + k, 0);
  const e8 = m.u32(g + 0xe8), e0 = m.u32(g + 0xe0), e4 = m.u32(g + 0xe4), ec = m.u32(g + 0xec);
  m.w32(g + 0xd8, 0); m.w32(g + 0xd4, 0); m.w32(g + 0xd0, 0);
  m.w32(g + 0xe8, e8); m.w32(g + 0xdc, 0); m.w32(g + 0xe0, e0); m.w32(g + 0xe4, e4);
  m.w32(g + 0xec, bfi(ec, 2, 8, 2));
  m.w32(g + 0x94, 0); m.w32(g + 0xf0, 0); m.w32(g + 0xf4, 0); m.w32(g + 0x88, 0);
  for (let k = 0x1b0; k <= 0x1c0; k += 4) m.w32(g + k, 0);
  const z = m.u32(GOT_ZERO3);
  m.w32(g + 0x150, m.u32(z)); m.w32(g + 0x154, m.u32(z + 4)); m.w32(g + 0x158, m.u32(z + 8)); m.w32(g + 0x15c, 0);
  const r = m.u32(GOT_ROW3);
  m.w32(g + 0x160, m.u32(r)); m.w32(g + 0x164, m.u32(r + 4)); m.w32(g + 0x168, m.u32(r + 8)); m.w32(g + 0x16c, 0);
  m.w8(g + 0x1c4, 0);
}

// The factory's per-type operator new (size 0x1d0) and constructor: the vtable is the only difference.
const GENERATOR_TYPES = {
  0: { got: 0x183c8a4, name: 'LiteBillboard' },   // 0xa780bc / 0xa780f8
  1: { got: 0x183c9b0, name: 'LitePolyline' },    // 0xaae1b4 / 0xaae1f0
  5: { got: 0x183c948, name: 'Model' },           // 0xa91944 / 0xa91980
};
function newGenerator(m, type){
  const g = m.svc.alloc(0x1d0, 0x10);
  generatorCtor(m, g);
  m.w32(g, vtableFrom(m, GENERATOR_TYPES[type].got));
  return g;
}

// 0xb594a8
const entryIsPlain = (m, entry) => ((m.u32(entry) & 0xfffff) === 0 ? 1 : 0);

// 0xae989c: bind the generator to its owner and row.
function generatorBind(m, g, owner, row, index){
  m.w32(g + 8, owner);
  const rl = m.u32(owner + 0xf4);
  const body = m.u32(rl + 0x68);
  m.w32(g + 0x14, (((row << 16) & 0xffff0000) | (index & 0xffff)) >>> 0);
  const rowp = (body + (row << 4)) >>> 0;
  m.w16(g + 0x1e, m.u8(rowp));
  const entry = (m.u32(rl + 0x70) + Math.imul(row, 0x44)) >>> 0;
  m.w32(g + 0x28, entry);
  if (entryIsPlain(m, entry) !== 1) throw new Unverified('0xae98e0 generator entry not plain');
  const c0 = m.u32(rowp);
  m.w32(g + 0x30, (c0 >>> 8) !== 0 ? (m.u32(rl + 0x68) + (c0 >>> 8)) >>> 0 : 0);
  const c2 = m.u32(rowp + 8), g40 = m.u32(g + 0x40), g44 = m.u32(g + 0x44);
  m.w32(g + 0x44, g44); m.w32(g + 0x40, bfi(g40, c2, 8, 4));
  const f118 = m.u32(m.u32(g + 8) + 0x118), g50 = m.u32(g + 0x50);
  m.w32(g + 0x50, (((f118 << 20) & 0xf0000000) | (g50 & 0x0fffffff)) >>> 0);
  return 1;
}

// 0xa55fe0 (vtable slot 6 base): the row's column blocks and packed tags.
function generatorInit(m, g, owner, row, index){
  if (generatorBind(m, g, owner, row, index) !== 1) throw new Unverified('0xa56000 generator bind failed');
  const rl = m.u32(m.u32(g + 8) + 0xf4);
  const body = m.u32(rl + 0x68);
  const rowp = (body + (row << 4)) >>> 0;
  const c1 = m.u32(rowp + 4);
  m.w32(g + 0x34, (c1 >>> 8) !== 0 ? (body + (c1 >>> 8)) >>> 0 : 0);
  const c2 = m.u32(rowp + 8);
  m.w32(g + 0x38, (c2 >>> 8) !== 0 ? (m.u32(rl + 0x68) + (c2 >>> 8)) >>> 0 : 0);
  const c3 = m.u32(rowp + 0xc);
  m.w32(g + 0x3c, (c3 >>> 8) !== 0 ? (m.u32(rl + 0x68) + (c3 >>> 8)) >>> 0 : 0);
  const g40 = m.u32(g + 0x40), g44 = m.u32(g + 0x44);
  let r1 = m.u32(rowp + 4);
  m.w32(g + 0x44, g44);
  r1 = bfi(r1, g40 >>> 8, 8, 24);
  m.w32(g + 0x40, r1);
  const c2b = m.u32(rowp + 8);
  m.w32(g + 0x44, g44);
  r1 = bfi(r1, (c2b >>> 4) & 0xfffff, 12, 4);
  m.w32(g + 0x40, r1);
  r1 = (r1 & ~0x00ff0000) >>> 0;
  const c3b = m.u32(rowp + 0xc);
  const hi = (0xf0000 & (c3b << 16)) >>> 0;
  r1 = bfi(r1, c3b, 20, 4);
  m.w32(g + 0x40, (r1 | hi) >>> 0); m.w32(g + 0x44, g44);
  const w = []; for (let i = 0; i < 8; i++) w.push(m.u32(g + 0xd0 + 4 * i));
  const nb = m.u32(g + 0x30);
  w[0] = ((w[0] & ~0xffff) | m.u16(nb + 0xc)) >>> 0;
  for (let i = 0; i < 8; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  if (m.u8(nb + 8) & 4) return 1;
  const vol = m.u32(g + 0x50) >>> 28;
  if (vol === 1) throw new Unverified('0xa56138 generator at particle volume 1');
  if (vol !== 0) return 1;
  throw new Unverified('0xa5611c generator at particle volume 0');
}

// 0xaea0e8: the particle header size by generator +0x40 bits 12..15 (table 0x166a600).
const headerSize = (m, g) => m.u32(0x166a600 + 4 * ((((m.u32(g + 0x40) >>> 12) & 0xf) ^ 8)));
// 0xb5a03c
const typeHasBit = (t) => (t > 0x1a ? 0 : ((0x06fff37f >>> t) & 1));
// 0xa588b8
function paramBit16(m, g){
  if ((m.u32(m.u32(g + 0x34)) >>> 16) & 1) throw new Unverified('0xa588d0 generator parameter bit 16');
  return 0;
}

// 0xa58690: the particle stride and the pool size the generator will need.
function generatorSizes(m, g, size, extra){
  const r3 = (size + 0xf) & 0xfff0;
  const w = []; for (let i = 0; i < 8; i++) w.push(m.u32(g + 0xd0 + 4 * i));
  w[1] = ((w[1] & ~0xffff) | r3) >>> 0;
  for (let i = 0; i < 8; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  if (r3 === 0) throw new Unverified('0xa58754 generator with no particle size');
  let r2 = (extra + 0xf) & 0xfff0;
  r2 = (r2 + r3) & 0xfff0;
  const sb = ((w[1] & 0xfff0) | (r2 << 16)) >>> 0;
  w[1] = sb;
  for (let i = 0; i < 8; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  const sel = m.u16(g + 0x42) & 0xf;
  if (sel > 8) throw new Unverified('0xa58760 generator +0x42 selector ' + sel);
  const hdr = (m.u16(0x166a5d0 + 4 * sel) << 16) >>> 0;
  m.w32(g + 0xd0, w[0]);
  m.w32(g + 0xd4, (sb & 0xfff0fff0) >>> 0);
  m.w32(g + 0xdc, w[3]);
  m.w32(g + 0xd8, ((w[2] & 0xffff) | hdr) >>> 0);
  m.w32(g + 0xe0, w[4]); m.w32(g + 0xe4, w[5]); m.w32(g + 0xe8, w[6]); m.w32(g + 0xec, w[7]);
  const h = headerSize(m, g);
  const v = []; for (let i = 0; i < 8; i++) v.push(m.u32(g + 0xd0 + 4 * i));
  m.w32(g + 0xd0, v[0]); m.w32(g + 0xd4, v[1]);
  m.w32(g + 0xd8, ((v[2] & 0xffff0000) | (h & 0xffff)) >>> 0);
  m.w32(g + 0xdc, (v[3] & 0xffff0000) >>> 0);
  m.w32(g + 0xe0, v[4]); m.w32(g + 0xe4, v[5]); m.w32(g + 0xe8, v[6]); m.w32(g + 0xec, v[7]);
  if (typeHasBit(m.u8(g + 0x40)) === 1){
    if ((m.u32(m.u32(g + 0x34)) & 0x840000) === 0x840000) throw new Unverified('0xa58818 generator parameters 0x840000');
  }
  const a = m.u32(g + 0xd0), b = m.u32(g + 0xd4), c = m.u32(g + 0xd8), d = m.u32(g + 0xdc);
  const count = a & 0xffff;
  const r2b = Math.imul(b >>> 16, count) >>> 0;
  const r7 = (Math.imul(c >>> 16, count) + r2b) >>> 0;
  m.w32(g + 0xc4, r7); m.w32(g + 0xc8, r2b);
  let pool = Math.imul(c & 0xffff, count) >>> 0;
  pool = (((pool + 0xf) & ~0xf) + r7) >>> 0;
  if (d & 0xffff) throw new Unverified('0xa5888c generator +0xdc low half');
  m.w32(g + 0xcc, 0); m.w32(g + 0x20, pool);
  return 1;
}

// 0xa585dc: the LitePolyline point block size.
function polylineBlock(m, g, count, kind, sub){
  if (count === 0) throw new Unverified('0xa58668 polyline with no points');
  const k = (kind - 1) >>> 0;
  if (k > 5) throw new Unverified('0xa58680 polyline kind ' + kind);
  if (k !== 0) throw new Unverified('0xa585fc polyline kind ' + kind);
  return (((0x6f + (count << 5)) >>> 0) & ~0x1f) >>> 0;
}

// Vtable slot 6 per type: the base init, then the particle size.
function initModel(m, g, owner, row, index){                   // 0xa919d4
  if (generatorInit(m, g, owner, row, index) !== 1) throw new Unverified('0xa919e8 init failed');
  const par = m.u32(g + 0x34);
  let extra = 0;
  if (m.u32(par + 0x134) & 0xffff){
    const n = (m.u32(par + 0x138) >>> 24) & 0xf;
    extra = n !== 0 ? (0x20 + (n << 5)) >>> 0 : 0x20;
  }
  return generatorSizes(m, g, 0x120, extra);
}
function initLiteBillboard(m, g, owner, row, index){           // 0xa7814c
  if (generatorInit(m, g, owner, row, index) !== 1) throw new Unverified('0xa78160 init failed');
  return generatorSizes(m, g, 0xb0, 0);
}
function initLitePolyline(m, g, owner, row, index){            // 0xaae244
  if (generatorInit(m, g, owner, row, index) !== 1) throw new Unverified('0xaae29c init failed');
  const par = m.u32(g + 0x34);
  const w170 = m.u32(par + 0x170), w174 = m.u32(par + 0x174);
  let extra = polylineBlock(m, g, (w170 >>> 8) & 0xff, w170 & 0xff, (w174 >>> 8) & 0xf);
  if (m.u16(par + 0x1ae) !== 0) extra = (extra + 0x20) >>> 0;
  return generatorSizes(m, g, 0xd0, extra);
}

// 0xa56174 (slot 7): link the particle pool into the free list.
function linkPool(m, g, pool){
  m.w32(g + 0x24, pool);
  if (pool === 0) throw new Unverified('0xa56284 generator without a pool');
  const d0 = m.u32(g + 0xd0);
  const stride = m.u16(g + 0xd6);
  m.w32(g + 0xb4, 0); m.w32(g + 0xb0, 0); m.w32(g + 0xb8, pool);
  m.w32(pool, 0);
  const count = d0 & 0xffff;
  m.w32(pool + 4, (pool + stride) >>> 0);
  { const a = m.u32(pool + 8), b = m.u32(pool + 0xc);
    m.w32(pool + 0xc, (b & ~0x4000000) >>> 0); m.w32(pool + 8, (a & ~0xffff) >>> 0); }
  const base = m.u32(g + 0x24), st = m.u16(g + 0xd6);
  const lastI = (count - 1) >>> 0;
  const last = (Math.imul(st, lastI) + base) >>> 0;
  const prev = (Math.imul(st, (count - 2) >>> 0) + base) >>> 0;
  m.w32(g + 0xbc, last);
  m.w32((base + Math.imul(st, lastI)) >>> 0, prev);
  m.w32(last + 4, 0);
  { const a = m.u32(last + 8), b = m.u32(last + 0xc);
    m.w32(last + 0xc, (b & ~0x4000000) >>> 0);
    m.w32(last + 8, ((a & 0xffff0000) | ((d0 + 0xffff) & 0xffff)) >>> 0); }
  if (lastI < 2) return 1;
  const end = ((d0 & 0xffff) - 2) >>> 0;
  let i = 0;
  for (;;){
    const b2 = m.u32(g + 0x24), s = m.u16(g + 0xd6);
    const j = i + 1;
    m.w32((b2 + Math.imul(s, j)) >>> 0, (Math.imul(s, i) + b2) >>> 0);
    const pj = (Math.imul(s, j) + b2) >>> 0;
    m.w32(pj + 4, (Math.imul(s, i + 2) + b2) >>> 0);
    const a = m.u32(pj + 8), b = m.u32(pj + 0xc);
    m.w32(pj + 0xc, (b & 0xfbffffff) >>> 0);
    m.w32(pj + 8, ((a & 0xffff0000) | (j & 0xffff)) >>> 0);
    i = j;
    if (end === j) break;
  }
  return 1;
}

// 0xae9938: generator start flags; the squared envelope from node block +0x08 bit 27.
function generatorFlags(m, g){
  m.w32(g + 0x10, (m.u32(g + 0x10) & 0xfffc008f) >>> 0);
  const nb = m.u32(g + 0x30);
  const nb8 = m.u32(nb + 8);
  m.w32(g + 0x8c, nb8);
  const f118 = m.u32(m.u32(g + 8) + 0x118);
  if (!(f118 & 0x8000000) && m.u16(nb + 0xbe) !== 0) throw new Unverified('0xae997c node block +0xbe');
  m.w32(g + 0x50, (m.u32(g + 0x50) & ~0x0f000000) >>> 0);
  let shape = 0x40000000, extra = 0;                                       // squared envelope
  if (!(nb8 & 0x8000000)){                                                // 0xae9a0c: the manager's +0x230
    const b = m.u8(mgrOf(m) + 0x230);
    shape = (b << 30) >>> 0; extra = b >>> 2;
  }
  let g40 = ((m.u32(g + 0x40) & ~0x40000000) | shape) >>> 0;
  const g44 = (m.u32(g + 0x44) | extra) >>> 0;
  m.w32(g + 0x88, 0); m.w32(g + 0x40, g40); m.w32(g + 0x44, g44);
  const par = m.u32(g + 0x34);
  if (par === 0) throw new Unverified('0xae9adc generator without parameters');
  let g44b = ((g44 & ~0xff) | m.u8(par)) >>> 0;
  m.w32(g + 0x40, g40); m.w32(g + 0x44, g44b);
  const idx = (m.u32(par) >>> 8) & 0xff;
  const mode = idx > 3 ? 0x11 : m.u32(0x1592798 + 4 * idx);              // 0xaf9d00
  g40 = m.u32(g + 0x40); g44b = m.u32(g + 0x44);
  g44b = ((g44b & ~0xff00) | ((mode & 0xff) << 8)) >>> 0;
  m.w32(g + 0x40, g40); m.w32(g + 0x44, g44b);
  const p2 = m.u32(g + 0x34);
  g40 = bfi(g40, m.u32(p2 + 0x18), 24, 4);
  m.w32(g + 0x40, g40); m.w32(g + 0x44, g44b);
  m.w32(g + 0x90, m.u32(p2 + 4));
  m.w8(g + 0x52, m.u8(p2 + 0x1b));
  const b17 = (m.u32(p2 + 0x18) >>> 17) & 1;
  m.w32(g + 0x44, g44b);
  m.w32(g + 0x40, bfi(g40, b17, 31, 1));
  if (m.u8(m.u32(g + 8) + 0xf0) & 0x80) throw new Unverified('0xae9afc effect +0xf0 bit 7');
  m.w32(g + 0xa0, m.u32(p2 + 8));
}

// 0x9b38dc: generator draw flags from its parameters.
function drawFlags(m, owner, par){
  const r3 = m.u32(par + 4);
  let r4 = r3 & 0xc00000;
  if (r4) r4 = 0x20000;
  let ip = ((0x10 & (r3 >>> 22)) | (0x100 & (r3 << 6))) >>> 0;
  ip |= 2 & (r3 >>> 4);
  ip |= 8 & (r3 >>> 4);
  ip |= 0x40000 & (r3 << 5);
  const lr = (ip | (0x4000000 & (r3 >>> 1))) >>> 0;
  const f0 = m.u32(owner + 0xf0);
  const b2 = m.u8(par + 2);
  let r5 = bfi(r4, r3 >>> 12, 12, 1);
  if (f0 & 0x200) r5 = (r4 | 0x1000) >>> 0;
  let r2 = (lr | r5) >>> 0;
  if ((r3 | 0) < 0) r2 = (r2 | 4) >>> 0;
  if (b2 & 2) throw new Unverified('0x9b3988 draw flags, parameters +2 bit 1');
  if (r3 & 0x60000010) throw new Unverified('0x9b3970 draw flags 0x60000010');
  if (r3 & 0x4000) throw new Unverified('0x9b3a50 draw flags 0x4000');
  if (r3 & 0x1000000) throw new Unverified('0x9b3a74 draw flags 0x1000000');
  if (r3 & 0x2000000) throw new Unverified('0x9b3a94 draw flags 0x2000000');
  if (r3 & 0x10000000) throw new Unverified('0x9b3ab8 draw flags 0x10000000');
  const p14 = m.u32(par + 0x14);
  let out;
  if ((f0 & 0x100) || ((p14 >>> 16) & 0xff) === ((0 - (p14 >>> 24)) >>> 0)) out = r2;   // 0x9b3ac4
  else {
    if (r3 & 0x400) throw new Unverified('0x9b3acc draw flags 0x400');
    if (r3 & 0x800) throw new Unverified('0x9b3ad4 draw flags 0x800');
    out = (r3 & 8) ? (r2 | 0x100000) >>> 0 : (r2 | 0x200) >>> 0;
  }
  if (m.u32(par + 0x3c) & 0xffff) throw new Unverified('0x9b3a2c draw flags, parameters +0x3c');
  return out;
}

// 0xa562a0 (slot 8 base): per-generator start values.
function generatorStart(m, g){
  generatorFlags(m, g);
  const rnd = m.u32(GOT_FLOAT_RNG);
  const c = m.u32(g + 0x48);
  const nb = m.u32(g + 0x30);
  const draw = (k, base) => {
    m.w32(g + 0x48, (c + k) >>> 0);
    const r = m.f32(rnd + 4 * ((c + k) & 0xfff));
    return F(m.f32(nb + base) + F(r * m.f32(nb + base + 4)));
  };
  m.wf32(g + 0xf8, draw(1, 0x40));
  m.wf32(g + 0x160, draw(2, 0x88));
  m.wf32(g + 0x164, draw(3, 0x90));
  m.wf32(g + 0x168, draw(4, 0x98));
  m.w32(g + 0xc0, 0);
  const inst = m.u32(g + 0x18);
  m.w32(g + 0xc0, (m.u32(inst + 0x110) & 0x400) ? 0x4000 : 0);
  let w = []; for (let i = 0; i < 8; i++) w.push(m.u32(g + 0xd0 + 4 * i));
  w[5] = ((w[5] & ~0xffff) | m.u16(nb + 0xa0)) >>> 0;
  w[5] = ((w[5] & ~0x00ff0000) | (m.u8(nb + 0x78) << 16)) >>> 0;
  w[5] = bfi((m.u32(nb + 0x78) << 16) >>> 0, w[5], 0, 24);
  w[6] = ((w[6] & ~0xff) | m.u8(nb + 0x7b)) >>> 0;
  const nb2 = m.u32(g + 0x30);
  w[6] = ((w[6] & ~0xf000) | ((m.u32(nb2 + 0x30) & 0xf) << 12)) >>> 0;
  for (let i = 0; i < 8; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  const n30 = m.u32(nb2 + 0x30);
  m.w32(g + 0xfc, 0x3f800000);
  const w194 = m.u32(g + 0x194);
  m.w32(g + 0x194, (w194 & ~0x10000000) >>> 0);
  let ec = ((bfi(w[7], 2, 8, 2)) & 0x2ff) >>> 0;
  m.w32(g + 0xec, ec);
  w[6] = bfi(w[6], (n30 >>> 4) & 0xffffff, 8, 4);
  for (let i = 0; i < 7; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  m.w32(g + 0xf4, 0);
  const entry = m.u32(g + 0x28);
  if (m.u32(entry + 0x1c) !== 0) throw new Unverified('0xa564f0 generator entry +0x1c');
  if (m.u32(entry + 0x20) !== 0) throw new Unverified('0xa564f0 generator entry +0x20');
  w[4] = (w[4] & 0xffff0000) >>> 0;                                        // 0xa56934
  for (let i = 0; i < 7; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  m.w32(g + 0xec, ec);
  if (m.u32(nb2 + 0xb4) & 0xffff0000) m.w32(g + 0x10, (m.u32(g + 0x10) | 0x400) >>> 0);
  const white = m.u32(m.u32(GOT_WHITE));
  m.w32(g + 0x17c, white); m.w32(g + 0x178, white); m.w32(g + 0x174, white); m.w32(g + 0x170, white);
  m.w32(g + 0x184, 0); m.w32(g + 0x180, 0);
  m.w32(g + 0x1ac, 0x3c23d70a);
  let f194 = (w194 & 0xe3ffff00) >>> 0;
  m.w32(g + 0x194, f194);
  m.w32(g + 0x188, 0x3f800000); m.w32(g + 0x18c, 0); m.w32(g + 0x190, 0);
  const par = m.u32(g + 0x34);
  if (par === 0) throw new Unverified('0xa5669c generator without parameters');
  ec = (((ec & ~0x400) >>> 0) | ((m.u16(par + 0x1a) & 1) << 10)) >>> 0;
  for (let i = 0; i < 7; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  m.w32(g + 0xec, ec);
  f194 = ((0x10000000 & (m.u32(par + 0x18) << 10)) | f194) >>> 0;
  m.w32(g + 0x194, f194);
  const g90 = m.u32(g + 0x90);
  if ((g90 & 0x140000) || ((g90 >>> 21) & 1) === 1){                      // 0xa56640
    const r3 = (g90 & 0x200000) ? 0x1800 : ((g90 & 0x100000) >>> 8);
    ec = (ec | ((g90 & 0x40000) >>> 5) | r3) >>> 0;
    for (let i = 0; i < 7; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
    m.w32(g + 0xec, ec);
  }
  if (m.u32(g + 0xa0) !== 0) throw new Unverified('0xa56688 generator +0xa0');
  const owner = m.u32(g + 8);
  if (m.u8(owner + 0xf0) & 0x80) throw new Unverified('0xa566c8 effect +0xf0 bit 7');
  if (m.u32(entry + 0x10) !== 0) m.w32(g + 0xf4, 0x10000);
  m.w32(g + 0xf4, (m.u32(g + 0xf4) | drawFlags(m, owner, par)) >>> 0);
  const p3 = m.u32(g + 0x34);
  m.w32(g + 0x188, m.u32(p3 + 0x20)); m.w32(g + 0x18c, m.u32(p3 + 0x24));
  m.w32(g + 0x190, (p3 + 0x20) >>> 0);
  w = []; for (let i = 0; i < 8; i++) w.push(m.u32(g + 0xd0 + 4 * i));
  w[6] = bfi(w[6], 0x664, 16, 12);
  for (let i = 0; i < 8; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  const c3 = m.u32(g + 0x3c);
  let r7 = bfi((m.u32(c3 + 4) >>> 12) >>> 0, w[7] >>> 4, 4, 28);
  for (let i = 0; i < 7; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  m.w32(g + 0xec, r7);
  r7 = bfi(r7, m.u32(c3 + 4) >>> 8, 4, 4);
  for (let i = 0; i < 7; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  m.w32(g + 0xec, r7);
  if (m.u8(c3) & 0x10){
    w[3] = ((w[3] & 0xfdff0000) | (w[3] & 0xffff) | 0x2000000) >>> 0;
    for (let i = 0; i < 7; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
    m.w32(g + 0xec, r7);
  }
  if (m.u32(g + 0x1b8) !== 0) throw new Unverified('0xa567d0 generator +0x1b8 at start');
  const nb3 = m.u32(g + 0x30);
  if (m.u16(nb3 + 0xb4) !== 0) throw new Unverified('0xa568c8 node block +0xb4');
  const s0 = m.f32(nb3 + 0xb0);
  let f = (m.u32(g + 0x194) & ~0x1000000) >>> 0;
  f = (f | ((s0 !== 0 ? 1 : 0) << 24)) >>> 0;
  m.w32(g + 0x194, f);
  m.w32(g + 0x194, bfi(f, (m.u32(nb3 + 0x78) >>> 16) & 0x7f, 25, 1));
}

// Vtable slot 8 per type.
function startModel(m, g){                                     // 0xa91a30
  generatorStart(m, g);
  const par = m.u32(g + 0x34);
  const w = []; for (let i = 0; i < 8; i++) w.push(m.u32(g + 0xd0 + 4 * i));
  w[6] = ((w[6] & ~0xf0000) | ((m.u32(par + 0x100) & 0xf) << 16)) >>> 0;
  for (let i = 0; i < 8; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  const kind = (m.u32(par + 0x100) >>> 4) & 0xf;
  w[6] = ((w[6] & ~0x0f000000) | (kind << 24)) >>> 0;
  if (kind !== 6) throw new Unverified('0xa91aa0 Model kind ' + kind);
  for (let i = 0; i < 8; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  if (w[7] & 0x400) throw new Unverified('0xa91b4c Model +0xed bit 2');
  const flag = paramBit16(m, g);
  const g40 = m.u32(g + 0x40), g44 = m.u32(g + 0x44);
  m.w32(g + 0x40, g40);
  m.w32(g + 0x44, ((g44 & ~0x00ff0000) | (flag !== 0 ? 0x1e0000 : 0x50000)) >>> 0);
  if (m.u8(par + 0x10e) & 0x10) throw new Unverified('0xa91b14 Model parameters +0x10e bit 4');
  if (m.u8(g + 0xc1) & 0x40) throw new Unverified('0xa91b3c Model +0xc1 bit 6');
  m.w32(g + 0x1ac, m.u32(par + 0x11c));
  const p = m.u32(g + 0x34);
  m.w8(g + 0x194, m.u32(p + 0x40));
  m.w32(g + 0x170, m.u32(p + 0x48)); m.w32(g + 0x174, m.u32(p + 0x4c));
  m.w32(g + 0x180, (p + 0x48) >>> 0);
}
function startLiteBillboard(m, g){                             // 0xa78178
  generatorStart(m, g);
  const flag = paramBit16(m, g);
  const par = m.u32(g + 0x34);
  const low = m.u32(par + 0x18) & 0xf0;
  let r2 = low, r3 = 0x19;
  if (low){ r3 = 0x2f; r2 = 0x17; }
  if (flag !== 0) r2 = r3;
  m.w8(g + 0x46, r2);
  if (m.u8(par + 0x19) & 0xf) throw new Unverified('0xa781bc LiteBillboard parameters +0x19');
  m.w8(g + 0x194, m.u32(par + 0x40));
  m.w32(g + 0x170, m.u32(par + 0x48)); m.w32(g + 0x174, m.u32(par + 0x4c));
  m.w32(g + 0x180, (par + 0x48) >>> 0);
}
function startLitePolyline(m, g){                              // 0xaae2a4
  generatorStart(m, g);
  const par = m.u32(g + 0x34);
  const w170 = m.u32(par + 0x170);
  if ((w170 & 0xff) !== 1) throw new Unverified('0xaae438 LitePolyline kind ' + (w170 & 0xff));
  const w = []; for (let i = 0; i < 8; i++) w.push(m.u32(g + 0xd0 + 4 * i));
  const w210 = m.u32(par + 0x210);
  let e8 = ((w[6] & 0xfff0ffff) | (0xf0000 & (w210 << 12))) >>> 0;
  for (let i = 0; i < 6; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  m.w32(g + 0xe8, e8); m.w32(g + 0xec, w[7]);
  e8 = ((e8 & 0xff0fffff) | ((m.u32(par + 0x210) & 0xf) << 20)) >>> 0;
  const e8b = (e8 & 0xf0ffffff) >>> 0;
  for (let i = 0; i < 5; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  m.w32(g + 0xe4, w[5]); m.w32(g + 0xe8, e8); m.w32(g + 0xec, w[7]);
  const mode = (m.u32(par + 0x210) >>> 8) & 0xf;
  const e8c = (e8b | (mode << 24)) >>> 0;
  if (mode === 6) throw new Unverified('0xaae420 LitePolyline mode 6');
  m.w32(g + 0xd0, w[0]); m.w32(g + 0xd4, w[1]); m.w32(g + 0xd8, w[2]); m.w32(g + 0xdc, (w[3] | 0x40000000) >>> 0);   // 0xaae3dc
  m.w32(g + 0xe0, w[4]); m.w32(g + 0xe4, w[5]); m.w32(g + 0xe8, e8c); m.w32(g + 0xec, w[7]);
  const type = m.u8(g + 0x40);
  const entry = m.u32(g + 0x28);
  const model = m.u32(entry + 0x14);
  const flag = paramBit16(m, g);
  if (type !== 1) throw new Unverified('0xaae614 LitePolyline generator type ' + type);
  if (model === 0) throw new Unverified('0xaae7c4 LitePolyline without a resource');
  const low = m.u32(m.u32(g + 0x34) + 0x18) & 0xf0;
  let r2 = 1, r1 = 0x1a;
  if (low){ r1 = 0x30; r2 = 0x18; }
  if (flag !== 0) r2 = r1;
  m.w8(g + 0x46, r2);
  const p = m.u32(g + 0x34);
  const w174 = m.u32(par + 0x174);
  m.w8(g + 0x194, m.u32(p + 0x40));
  m.w32(g + 0x170, m.u32(p + 0x48)); m.w32(g + 0x174, m.u32(p + 0x4c));
  m.w32(g + 0x180, (p + 0x48) >>> 0);
  if (w174 & 0xf){
    m.w32(g + 0x178, m.u32(par + 0x178)); m.w32(g + 0x17c, m.u32(par + 0x17c));
    m.w32(g + 0x184, (par + 0x178) >>> 0);
  }
}

// 0xa56960 (slot 9): RNG counters from the seed; curve switches.
function generatorSeedStart(m, g){
  const seed = m.u16(g + 0x50);
  m.w32(g + 0x48, seed); m.w32(g + 0x4c, seed);                         // 0xae9b08
  const g40 = m.u32(g + 0x40), g44 = m.u32(g + 0x44);
  const k = (g40 >>> 12) & 0xf;
  let r2 = 0x10000000;
  if (k <= 6 && (0x66 & (1 << k))) r2 = (0x10000000 & (m.u32(m.u32(g + 0x38) + 0xc) << 28)) >>> 0;
  m.w32(g + 0x40, (r2 | (g40 & ~0x10000000)) >>> 0); m.w32(g + 0x44, g44);
  const w = []; for (let i = 0; i < 8; i++) w.push(m.u32(g + 0xd0 + 4 * i));
  w[7] = (w[7] & ~0x4000) >>> 0;
  for (let i = 0; i < 8; i++) m.w32(g + 0xd0 + 4 * i, w[i]);
  const nb = m.u32(g + 0x30);
  if (m.f32(nb + 0x58) < 0) throw new Unverified('0xa56a08 interval curve');
  m.wf32(g + 0x1a0, 0.0);
  if (m.f32(nb + 0x5c) < 0) throw new Unverified('0xa56a28 period curve');
  m.wf32(g + 0x1a4, 0.0);
}

// 0xa56d1c (slot 15 base): the generator transform block (+0x1b0) and its size (+0x94).
function generatorTransform(m, g, extra){
  let size = 0;
  m.w32(g + 0xf0, 0);
  let g40 = m.u32(g + 0x40);
  const sel = (g40 >>> 16) & 0xf;
  if (sel > 8) throw new Unverified('0xa56f30 transform selector ' + sel);
  const g44 = m.u32(g + 0x44);
  const c3 = m.u32(g + 0x3c);
  if (sel === 0 || sel === 7){                                            // 0xa56d74
    const w = m.u32(c3 + 4);
    m.w32(g + 0xf0, (w >>> 16) !== 0 ? (c3 + (w >>> 16)) >>> 0 : 0);
  } else if (sel === 2){                                                  // 0xa56dbc
    const w = m.u32(c3 + 4);
    m.w32(g + 0xf0, (w >>> 16) !== 0 ? (c3 + (w >>> 16)) >>> 0 : 0);
    if (m.u8(c3 + 3) & 1){ m.w32(g + 0x40, bfi(g40, 0xa, 20, 4)); m.w32(g + 0x44, g44); }
  } else if (sel === 5){                                                  // 0xa56ea8
    const off = m.u32(c3 + 0x70);
    if (off === 0 || ((c3 + off) >>> 0) === 0) throw new Unverified('0xa570f0 transform block without an offset');
    const w = m.u32(c3 + 4);
    m.w32(g + 0xf0, (w >>> 16) !== 0 ? (c3 + (w >>> 16)) >>> 0 : 0);
    size = 0x20;
  } else throw new Unverified('0xa56d4c transform selector ' + sel);
  let total = (size + extra) >>> 0;
  m.w32(g + 0x94, total);
  const par = m.u32(g + 0x34);
  if (par === 0) throw new Unverified('0xa56f54 generator without parameters');
  if (m.u8(par + 2) & 0x40){ total = (total + 0x30) >>> 0; m.w32(g + 0x94, total); }
  const block = m.svc.alloc(m.u32(g + 0x94), 0x10);
  m.w32(g + 0x1b0, block);
  if (block === 0) throw new Unverified('0xa56fb4 transform block allocation failed');
  clear(m, block, m.u32(g + 0x94));
  const p2 = m.u32(g + 0x34);
  if (p2 !== 0 && (m.u8(p2 + 2) & 0x40)) throw new Unverified('0xa56fc0 transform block with a matrix');
  m.w32(g + 0x1b4, 0);
  if (size === 0){ m.w32(g + 0x1b8, 0); return 1; }
  m.w32(g + 0x1b8, block);                                                 // 0xa56ff0
  const rnd = m.u32(GOT_FLOAT_RNG);
  const c3b = m.u32(g + 0x3c);
  for (const [k, dst] of [[0x50, 0x10], [0x58, 0x14], [0x60, 0x18], [0x68, 0x1c]]){
    const n = (m.u32(g + 0x48) + 1) >>> 0;
    m.w32(g + 0x48, n);
    const r = m.f32(rnd + 4 * (n & 0xfff));
    m.wf32(m.u32(g + 0x1b8) + dst, F(m.f32(c3b + k) + F(r * m.f32(c3b + k + 4))));
  }
  const t = m.u32(g + 0x1b8);
  const ax = m.f32(t + 0x10), s = m.f32(t + 0x1c), ay = m.f32(t + 0x14), az = m.f32(t + 0x18);
  m.w32(t + 0xc, 0);
  m.wf32(t, F(ax * s)); m.wf32(t + 4, F(ay * s)); m.wf32(t + 8, F(az * s));
  return 1;
}

// Vtable slot 15 per type.
function transformModel(m, g){                                 // 0xa91b80
  if (!(m.u8(g + 0xed) & 4)){
    const model = m.u32(m.u32(g + 0x28) + 0x18);
    if (m.u32(model + 0x84) !== 0) throw new Unverified('0xa91ba8 Model resource +0x84');
  }
  return generatorTransform(m, g, 0);
}
function transformLiteBillboard(m, g){                         // 0xa783a8
  const par = m.u32(g + 0x34);
  const f4 = m.u32(g + 0xf4);
  const b18 = m.u8(par + 0x18);
  const big = f4 & 0x800000;
  if (b18 & 0xf0) throw new Unverified('0xa783d0 LiteBillboard parameters +0x18 high nibble');
  if (generatorTransform(m, g, big ? 0x30 : 0) !== 1) throw new Unverified('0xa78408 transform failed');
  if (big) throw new Unverified('0xa78414 LiteBillboard +0xf4 bit 23');
  m.w32(g + 0x1bc, 0);
  return 1;
}
function transformLitePolyline(m, g){                          // 0xaaea38
  const par = m.u32(g + 0x34);
  const rows = (m.u32(par + 0x174) >>> 12) & 0xf;
  const count = (m.u32(par + 0x170) >>> 8) & 0xff;
  if (rows === 0) throw new Unverified('0xaaea74 LitePolyline without rows');
  const s16 = (v) => ((v & 0xffff) << 16) >> 16;
  const r7 = (count + Math.imul(s16(count - 1), s16(rows))) >>> 0;
  if (m.u8(par + 0x18) & 0xf0) throw new Unverified('0xaaea88 LitePolyline parameters +0x18 high nibble');
  const need = ((count << 4) + (r7 << 6)) >>> 0;
  const owner = m.u32(g + 8);                                              // 0x9ba878
  let most = m.u32(owner + 0x1c0);
  if (most < need){ m.w32(owner + 0x1c0, need); most = need; }
  if (most > m.u32(mgrOf(m) + 0x154)) throw new Unverified('0x9ba8a4 polyline work area too small');
  const mode = (m.u32(par + 0x174) >>> 8) & 0xf;
  if (count !== 0 && mode !== 4) throw new Unverified('0xaaeb08 LitePolyline mode ' + mode);
  if (generatorTransform(m, g, 0) !== 1) throw new Unverified('0xaaeb60 transform failed');
  m.w32(g + 0x1c0, 0);                                                     // 0xa5891c with no extra
  return 1;
}

// 0xae9df4: the generator's random seed (node block +0x10, negative: draw one).
function generatorSeed(m, g){
  const nb = m.u32(g + 0x30);
  if (m.u32(nb + 0xc) >= 0x2000000) throw new Unverified('0xae9e10 node block +0x0c');
  let seed = m.u32(nb + 0x10) | 0;
  if (seed < 0){
    const owner = m.u32(g + 8);
    seed = managerRandom(m, mgrOf(m), m.u32(owner + 0xf0) & 8) & 0xfff;
  }
  seed &= 0xffff;
  m.w16(g + 0x50, seed); m.w32(g + 0x48, seed); m.w32(g + 0x4c, seed);
}

// ---- nodes -------------------------------------------------------------------------------------

// 0xae81f4: bind a node instance to its node block.
function nodeBind(m, inst, owner, node, slot){
  m.w32(inst + 0x100, owner);
  const rl = m.u32(owner + 0xf4);
  const tbl = m.u16(rl + 0x7a), body = m.u32(rl + 0x68);
  const off = m.u32((body + tbl + 4 * node) >>> 0);
  const w108 = (((slot << 16) & 0xffff0000) | (node & 0xffff)) >>> 0;
  const blk = (body + off) >>> 0;
  m.w32(inst + 0x104, blk);
  const w10c = m.u32(inst + 0x10c), w110 = m.u32(inst + 0x110);
  m.w32(inst + 0x120, 0); m.w32(inst + 0x124, 0); m.w32(inst + 0x128, 0); m.w32(inst + 0x12c, 0);
  const base = (w10c & ~0xff) >>> 0;
  m.w32(inst + 0x110, w110);
  let ip = (base | 1) >>> 0;
  m.w32(inst + 0x10c, ip);
  m.w32(inst + 0x108, w108);
  if (m.u8(blk + 4) & 4){ ip = (base | 3) >>> 0; m.w32(inst + 0x10c, ip); }
  m.w32(inst + 0x108, w108); m.w32(inst + 0x10c, ip); m.w32(inst + 0x110, (w110 & ~0xf) >>> 0);
}

// 0xae8268: a node's motion blocks (+0x128 rotation, +0x12c position), when its block asks for them.
function nodeBlocks(m, inst){
  const par = m.u32(inst + 0x104);
  const w68 = m.u32(par + 0x68);
  if (w68 & 0xffff) throw new Unverified('0xae8284 node block +0x68');
  const w6c = m.u32(par + 0x6c);
  if (w68 & 0xffff0000) throw new Unverified('0xae82b0 node block +0x6a');
  const w108 = m.u32(inst + 0x108), w10c = m.u32(inst + 0x10c), w110 = m.u32(inst + 0x110);
  if (w6c & 0xffff) throw new Unverified('0xae82e0 node block +0x6c');
  const r8 = w10c & 0x60;
  const r6 = r8 ? 0x20 : 0;
  let r7 = 0;
  if (w6c >= 0x10000){
    r7 = 0x30;
    m.w32(inst + 0x108, w108); m.w32(inst + 0x10c, (w10c | 2) >>> 0); m.w32(inst + 0x110, w110);
  }
  const size = (r7 + r6) >>> 0;
  if (size !== 0){
    const blk = m.svc.alloc(size, 0x10);
    m.w32(inst + 0x124, blk);
    if (blk === 0) throw new Unverified('0xae8374 node block allocation failed');
    clear(m, blk, size);
    let p = m.u32(inst + 0x124);
    if (r8 !== 0){ m.w32(inst + 0x128, p); p = (p + r6) >>> 0; }
    if (r7 !== 0) m.w32(inst + 0x12c, p);
  }
  m.w32(inst + 0x120, size);
  return 1;
}

// 0xae9424: a node's random seed (node block +0x60, negative: draw one) into +0x112 and +0x114.
function nodeSeed(m, inst){
  const par = m.u32(inst + 0x104);
  let seed = m.u32(par + 0x60) | 0;
  if (seed >= 0) throw new Unverified('0xae945c node with a fixed seed');
  const owner = m.u32(inst + 0x100);
  seed = managerRandom(m, mgrOf(m), m.u32(owner + 0xf0) & 8) & 0xfff;
  const w108 = m.u32(inst + 0x108), w10c = m.u32(inst + 0x10c), lo = m.u16(inst + 0x110);
  m.w32(inst + 0x108, w108); m.w32(inst + 0x10c, w10c);
  m.w32(inst + 0x110, (lo | (seed << 16)) >>> 0);
  m.w32(inst + 0x114, seed & 0xffff);
}

// 0xae83c8: a node instance's initial transform, motion and scale from its block.
function nodeInit(m, inst){
  let w10c = m.u32(inst + 0x10c);
  const w110 = m.u32(inst + 0x110), w108 = m.u32(inst + 0x108);
  w10c = (w10c & ~0xf0) >>> 0;
  m.w32(inst + 0x10c, w10c); m.w32(inst + 0x110, w110); m.w32(inst + 0x108, w108);
  const par = m.u32(inst + 0x104);
  const p4 = m.u32(par + 4);
  const id = m.u32(GOT_IDENTITY);
  copyWords(m, inst + 0x40, id, 16);
  copyWords(m, inst, id, 16);
  const par2 = m.u32(inst + 0x104);
  m.w32(inst + 0x80, m.u32(par2 + 0x20)); m.w32(inst + 0x84, m.u32(par2 + 0x24)); m.w32(inst + 0x88, m.u32(par2 + 0x28));
  m.w32(inst + 0x8c, m.u32(par2 + 0x2c));
  const p0 = m.u32(par2);
  let lr = m.u32(inst + 0x10c);
  let r5 = m.u32(inst + 0x110);
  let ip = m.u32(inst + 0x108);
  m.w32(inst + 0x108, ip);
  lr = bfi(lr, p0 >>> 8, 8, 4);
  m.w32(inst + 0x10c, lr); m.w32(inst + 0x110, r5);
  lr = bfi(lr, m.u32(par2) >>> 20, 12, 4);
  m.w32(inst + 0x110, r5); m.w32(inst + 0x108, ip); m.w32(inst + 0x10c, lr);
  const blk = m.u32(inst + 0x12c);
  if (blk === 0){                                                          // 0xae870c
    m.w32(inst + 0x90, m.u32(par2 + 0x30)); m.w32(inst + 0x94, m.u32(par2 + 0x34));
    m.w32(inst + 0x98, m.u32(par2 + 0x38)); m.w32(inst + 0x9c, m.u32(par2 + 0x3c));
  } else {                                                                 // 0xae8568
    const moff = m.u16(par2 + 0x6e);
    if (moff === 0) throw new Unverified('0xae8570 node motion without an offset');
    const mv = (par2 + moff) >>> 0;
    let c = m.u32(mv + 0x34) | 0;
    if (c >= 0) throw new Unverified('0xae85a4 node motion with a fixed seed');
    const owner = m.u32(inst + 0x100);
    c = managerRandom(m, mgrOf(m), m.u32(owner + 0xf0) & 8) & 0xfff;
    const rnd = m.u32(GOT_FLOAT_RNG);
    const R = (k) => m.f32(rnd + 4 * ((c + k) & 0xfff));
    const sc = new Scratch(m);
    const ang = sc.alloc(0x10), mat = sc.alloc(0x40);
    m.w32(ang + 0xc, 0);
    const ax = F(m.f32(mv) + F(R(0) * m.f32(mv + 4)));
    const ay = F(m.f32(mv + 8) + F(R(1) * m.f32(mv + 0xc)));
    const az = F(m.f32(mv + 0x10) + F(R(2) * m.f32(mv + 0x14)));
    m.wf32(ang, ax); m.wf32(ang + 4, ay); m.wf32(ang + 8, az);
    const b = m.u32(inst + 0x12c);
    m.wf32(b + 0x10, ax); m.wf32(b + 0x14, ay); m.wf32(b + 0x18, az); m.w32(b + 0x1c, 0);
    m.wf32(b, ax); m.wf32(b + 4, ay); m.wf32(b + 8, az); m.w32(b + 0xc, 0);
    m.w32(b + 0x2c, 0);
    m.wf32(b + 0x20, F(m.f32(mv + 0x18) + F(R(3) * m.f32(mv + 0x1c))));
    m.wf32(b + 0x24, F(m.f32(mv + 0x20) + F(R(4) * m.f32(mv + 0x24))));
    m.wf32(b + 0x28, F(m.f32(mv + 0x28) + F(R(5) * m.f32(mv + 0x2c))));
    eulerMatrix(m, mat, ang, (m.u32(inst + 0x10c) >>> 8) & 0xf);
    matToQuat(m, inst + 0x90, mat);
    sc.free();
    if (m.f32(inst + 0x9c) < 0) throw new Unverified('0xae86d0 node quaternion with negative w');
    ip = m.u32(inst + 0x108); lr = m.u32(inst + 0x10c); r5 = m.u32(inst + 0x110);
  }
  const p = m.u32(inst + 0x104);                                           // 0xae8730
  m.w32(inst + 0xa8, m.u32(p + 0x48)); m.w32(inst + 0xa4, m.u32(p + 0x44)); m.w32(inst + 0xa0, m.u32(p + 0x40));
  for (let k = 0x4c; k <= 0x5c; k += 4) m.w32(inst + 0x60 + k, m.u32(p + k));
  let r2 = lr;
  m.w32(inst + 0x108, ip); m.w32(inst + 0x110, r5);
  r2 = bfi(r2, (m.u32(p) >>> 12) & 0xffff, 16, 4);
  m.w32(inst + 0x10c, r2);
  m.w32(inst + 0x108, ip); m.w32(inst + 0x110, r5);
  r2 = bfi(r2, (m.u32(p) >>> 16) & 0xfff, 20, 4);
  m.w32(inst + 0x10c, r2);
  m.w32(inst + 0x108, ip);
  r2 = bfi(r2, m.u8(p + 3), 24, 4);
  m.w32(inst + 0x10c, r2); m.w32(inst + 0x110, r5);
  r5 = bfi(r5, 2, 4, 2);
  const r3 = bfi(m.u32(p), r2, 0, 28);
  m.w32(inst + 0x108, ip); m.w32(inst + 0x10c, r3); m.w32(inst + 0x110, r5);
  let r0 = ((0x40 & (m.u32(p + 4) << 2)) | (r5 & ~0x50)) >>> 0;
  m.w32(inst + 0x108, ip); m.w32(inst + 0x10c, r3); m.w32(inst + 0x110, r0);
  r0 = (r0 & ~0x810) >>> 0;
  r0 = ((0x800 & (m.u32(p + 4) << 6)) | r0) >>> 0;
  const has3 = (p4 & 0x30000) ? 1 : 0;
  m.w32(inst + 0x108, ip); m.w32(inst + 0x10c, r3); m.w32(inst + 0x110, r0);
  r0 = (r0 & ~0x110) >>> 0;
  r0 = (r0 | ((m.u32(p + 4) & 1) << 8)) >>> 0;
  m.w32(inst + 0x108, ip); m.w32(inst + 0x10c, r3); m.w32(inst + 0x110, r0);
  r0 = (r0 & 0xffffc9ef) >>> 0;
  const r1 = (0x2000 & (p4 >>> 4)) >>> 0;
  r0 = ((r1 | (has3 << 12)) | r0) >>> 0;
  const pp = m.u32(inst + 0x104);
  const r8 = (r0 | (0x200 & (m.u32(pp + 4) << 8))) >>> 0;
  m.w32(inst + 0x108, ip); m.w32(inst + 0x10c, r3); m.w32(inst + 0x110, r8);
  m.w32(inst + 0x118, 0);
  if (m.u16(pp + 0x68) !== 0) throw new Unverified('0xae8880 node block +0x68 at init');
  const rnd = m.u32(GOT_FLOAT_RNG);                                        // 0xae88ec
  const c0 = m.u32(inst + 0x114);
  m.w32(inst + 0x114, (c0 + 1) >>> 0);
  m.wf32(inst + 0xf0, F(m.f32(pp + 8) + F(m.f32(rnd + 4 * ((c0 + 1) & 0xfff)) * m.f32(pp + 0xc))));
  m.w32(inst + 0x114, (c0 + 2) >>> 0);
  m.wf32(inst + 0xf4, F(m.f32(pp + 0x10) + F(m.f32(rnd + 4 * ((c0 + 2) & 0xfff)) * m.f32(pp + 0x14))));
  m.w32(inst + 0x114, (c0 + 3) >>> 0);
  m.wf32(inst + 0xf8, F(m.f32(pp + 0x18) + F(m.f32(rnd + 4 * ((c0 + 3) & 0xfff)) * m.f32(pp + 0x1c))));
  if (m.u16(pp + 0x6a) !== 0) throw new Unverified('0xae8974 node block +0x6a at init');
  if (m.u16(pp + 0x6c) !== 0) throw new Unverified('0xae89dc node block +0x6c at init');
  const n = (m.u32(inst + 0x114) + 1) >>> 0;
  const owner = m.u32(inst + 0x100);
  const base = m.u32(owner + 0x1b8);
  m.w32(inst + 0x114, n);
  const w64 = m.u32(pp + 0x64);
  if (w64 >>> 16) throw new Unverified('0xae8a68 node start delay with a random range');
  m.w16(inst + 0x11c, ((w64 & 0xffff) + base) & 0xffff);
}

// ---- the start routine ---------------------------------------------------------------------------

// 0x9bb8fc (vtable +0xdc): whether a row is enabled.
function rowEnabled(m, owner, row){
  const mgr = mgrOf(m);
  const mask = (m.u8(owner + 0x116) | m.u32(mgr + 0x228)) >>> 0;
  const rl = m.u32(owner + 0xf4);
  const e4 = m.u32(m.u32(rl + 0x70) + Math.imul(row, 0x44) + 4);
  if (mask & e4) throw new Unverified('0x9bb984 row disabled by mask');
  const c0 = m.u32(m.u32(rl + 0x68) + (row << 4));
  if ((c0 >>> 8) === 0 || ((m.u32(rl + 0x68) + (c0 >>> 8)) >>> 0) === 0) throw new Unverified('0x9bb984 row without a node block');
  const nb = (m.u32(rl + 0x68) + (c0 >>> 8)) >>> 0;
  if ((m.u32(nb) & m.u32(owner + 0x1c8)) === 0) throw new Unverified('0x9bb980 row outside the effect mask');
  return (m.u32(nb + 4) & m.u32(owner + 0x1cc)) !== 0 ? 1 : 0;
}

// 0x9baca0: the generator factory: one generator per enabled row, by type.
function factory(m, owner){
  const f0 = m.u32(owner + 0xf0);
  const f0b = (f0 & ~0x80000) >>> 0;
  m.w32(owner + 0xf0, f0b);
  const rl = m.u32(owner + 0xf4);
  if (!(f0 & 0x20000) && (m.u32(rl + 0x7c) & 0xf)) throw new Unverified('0x9bacdc factory with list +0x7c');
  m.w32(owner + 0x1d4, 0);
  const a = m.u32(owner + 0x1d8), b = m.u32(owner + 0x1dc), d = m.u32(owner + 0x1e4), c = m.u32(owner + 0x1e0);
  m.w32(owner + 0x1d8, a); m.w32(owner + 0x1dc, b);
  m.w32(owner + 0x1e0, (c & 0xffff0000) >>> 0); m.w32(owner + 0x1e4, d);
  const rows = m.u16(rl + 0x74);
  if (rows === 0) throw new Unverified('0x9bb310 effect list without rows');
  let prev = 0;
  for (let row = 0; row < rows; row++){
    if (vcall(m, owner, 0xdc, row) !== 1) continue;
    const body = m.u32(m.u32(owner + 0xf4) + 0x68);
    const rowp = (body + (row << 4)) >>> 0;
    m.u32(rowp);
    const type = m.u32(rowp + 4) & 0xff, c3 = m.u32(rowp + 0xc);
    if (type === 0x19) throw new Unverified('0x9bada8 generator type 25');
    if (type > 0x1a) throw new Unverified('0x9bb300 generator type ' + type);
    if ((type === 0 || type === 1) && (c3 & 0xf0)) throw new Unverified('0x9baf38 generator type ' + type + ' with col3 0x' + (c3 & 0xf0).toString(16));
    if (!GENERATOR_TYPES[type]) throw new Unverified('0x9bade8 generator type ' + type);
    const g = newGenerator(m, type);
    if (prev !== 0) m.w32(prev + 0xc, g); else m.w32(owner + 0x1f0, g);
    if (vcall(m, g, 0x18, owner, row, m.u16(owner + 0x1e0)) === 0) throw new Unverified('0x9bb33c generator init failed');
    const w0 = m.u32(owner + 0x1d8), w1 = m.u32(owner + 0x1dc), w2 = m.u32(owner + 0x1e0), w3 = m.u32(owner + 0x1e4);
    prev = g;
    m.w32(owner + 0x1d8, w0); m.w32(owner + 0x1dc, w1);
    m.w32(owner + 0x1e0, ((w2 & 0xffff0000) | ((w2 + 1) & 0xffff)) >>> 0); m.w32(owner + 0x1e4, w3);
  }
  if ((m.u32(owner + 0x1e0) & 0xffff) === 0) throw new Unverified('0x9bb320 no generators built');
  return 1;
}

// 0xb8ef7c: a slice of the manager's per-worker work area.
function workArea(m, mgr, worker, size){
  if (size === 0) return 0;
  const base = m.u32(mgr + 0x150);
  if (base === 0) return 0;
  const per = m.u32(mgr + 0x154);
  return per >= size ? (Math.imul(per, worker) + base) >>> 0 : 0;
}

// 0x9bb358: node instances and particle pools, one allocation.
function poolSetup(m, owner){
  if (m.u8(owner + 0xf2) & 8) throw new Unverified('0x9bb3e8 pool setup, effect +0xf2 bit 3');
  const mgr = mgrOf(m);
  const nodesWord = m.u32(m.u32(owner + 0xf4) + 0x74);
  const timer = m.u32(m.u32(GOT_SYSTEM));
  m.u32(timer + 0x80);                   // 0xba27a8: the worker registry; the effect is built on worker 0
  const nodes = nodesWord >>> 16;
  const table = workArea(m, mgr, 0, nodes << 2);
  if (table === 0) throw new Unverified('0x9bb47c pool setup without a work area');
  if (m.u32(owner + 0x1d0) !== 0) throw new Unverified('0x9bb3c8 pool setup, effect +0x1d0');
  if (nodes !== 0) for (let i = 0; i < nodes << 2; i++) m.w8(table + i, 0xff);   // __aeabi_memset4
  let g = m.u32(owner + 0x1f0);
  if (g === 0) throw new Unverified('0x9bb510 pool setup without generators');
  let bytes = 0, instances = 0;
  for (;;){
    let w1c = m.u32(g + 0x1c);
    const node = w1c >>> 16;
    let slot = m.u32(table + 4 * node);
    if (slot === 0xffffffff){
      m.w32(table + 4 * node, instances);
      slot = instances; w1c = m.u32(g + 0x1c); instances++;
    }
    m.w32(g + 0x1c, ((w1c & 0xffff0000) | (slot & 0xffff)) >>> 0);
    const next = m.u32(g + 0xc);
    bytes = (m.u32(g + 0x20) + bytes) >>> 0;
    if (next === 0) break;
    g = next;
  }
  const total = (Math.imul(instances, 0x130) + bytes) >>> 0;
  const block = m.svc.alloc(total, 0x10);
  if (block === 0) throw new Unverified('0x9bb648 pool allocation failed');
  clear(m, block, total);
  m.w32(owner + 0x1ec, total); m.w32(owner + 0x1f4, block);
  const a = m.u32(owner + 0x1d8), b = m.u32(owner + 0x1dc), c = m.u32(owner + 0x1e0);
  m.w32(owner + 0x1e4, (((instances & 0xffff) << 16) | (instances & 0xffff)) >>> 0);
  m.w32(owner + 0x1e0, c); m.w32(owner + 0x1dc, b); m.w32(owner + 0x1d8, a);
  for (let n = 0; n < nodes; n++){
    const slot = m.u32(table + 4 * n);
    if (slot === 0xffffffff) continue;
    nodeBind(m, (m.u32(owner + 0x1f4) + Math.imul(slot, 0x130)) >>> 0, owner, n, slot);
  }
  let pool = (block + Math.imul(instances, 0x130)) >>> 0;
  for (let gg = m.u32(owner + 0x1f0); gg !== 0; gg = m.u32(gg + 0xc)){
    m.w32(gg + 0x18, (m.u32(owner + 0x1f4) + Math.imul(m.u16(gg + 0x1c), 0x130)) >>> 0);
    const size = m.u32(gg + 0x20);
    if (size === 0) throw new Unverified('0x9bb61c generator without a pool');
    vcall(m, gg, 0x1c, pool);
    pool = (pool + size) >>> 0;
  }
  m.w32(owner + 0x1f8, 0);
  return 1;
}

// 0x9bb69c: node instances' blocks, seeds, initial transforms.
function nodeSetup(m, owner){
  if (m.u16(owner + 0x1e4) === 0) throw new Unverified('0x9bb788 effect without node instances');
  const zero = m.u32(GOT_ZERO3);
  let i = 0, off = 0;
  do {
    const inst = (m.u32(owner + 0x1f4) + off) >>> 0;
    if (nodeBlocks(m, inst) !== 1) throw new Unverified('0x9bb778 node blocks failed');
    m.w32(owner + 0x1ec, (m.u32(owner + 0x1ec) + m.u32(inst + 0x120)) >>> 0);
    nodeSeed(m, inst);
    nodeInit(m, inst);
    vcall(m, owner, 0xe8, inst);
    i++; off += 0x130;
    const x = m.u32(inst + 0x30), y = m.u32(inst + 0x34), z = m.u32(inst + 0x38);
    m.w32(inst + 0xc0, x); m.w32(inst + 0xc4, y); m.w32(inst + 0xc8, z); m.w32(inst + 0xcc, 0);
    m.w32(inst + 0xd0, m.u32(zero)); m.w32(inst + 0xd4, m.u32(zero + 4)); m.w32(inst + 0xd8, m.u32(zero + 8));
    m.w32(inst + 0xdc, 0);
    m.w32(inst + 0x114, m.u16(inst + 0x112));
  } while (i < m.u16(owner + 0x1e4));
  return 1;
}

// 0x9baa70 (vtable +0x80): reset the frame state before a start.
function resetFrame(m, owner){
  m.w32(owner + 0xf0, ((m.u32(owner + 0xf0) & 0xe0ffffcc) | 1) >>> 0);   // 0x9b40ac
  m.w32(owner + 0x104, 0x3f800000); m.w32(owner + 0x108, 0x100); m.w32(owner + 0x10c, 0);
  const a = m.u32(owner + 0x110), b = m.u32(owner + 0x114), c = m.u32(owner + 0x118);
  m.w32(owner + 0x114, b); m.w32(owner + 0x110, (a & ~0xffff) >>> 0); m.w32(owner + 0x118, (c & ~0x2000000) >>> 0);
  m.w32(owner + 0xf0, (m.u32(owner + 0xf0) | 0x100000) >>> 0);
  m.w16(owner + 0x1b4, m.u16(owner + 0x1b6));
}

// 0x9baa9c: start the effect.
export function startEffect(m, owner){
  vcall(m, owner, 0x80);
  const rl = m.u32(owner + 0xf4);
  if (rl === 0 || m.u16(rl + 0x74) === 0) throw new Unverified('0x9baba0 start without an effect list');
  if (factory(m, owner) === 0) throw new Unverified('0x9bab88 factory failed');
  if (poolSetup(m, owner) === 0) throw new Unverified('0x9bab88 pool setup failed');
  if (nodeSetup(m, owner) === 0) throw new Unverified('0x9bab88 node setup failed');
  m.w32(owner + 0x1c0, 0);
  for (let g = m.u32(owner + 0x1f0); g !== 0; g = m.u32(g + 0xc)){
    generatorSeed(m, g);
    vcall(m, g, 0x20);
    vcall(m, g, 0x24);
    if (vcall(m, g, 0x3c) !== 1) throw new Unverified('0x9bab7c generator transform failed');
    m.w32(owner + 0x1ec, (m.u32(owner + 0x1ec) + m.u32(g + 0x94)) >>> 0);
    m.w32(owner + 0x10, (m.u8(g + 0x44) | m.u32(owner + 0x10)) >>> 0);
  }
  const n = m.u16(owner + 0x1e4);
  if (n !== 0){
    if (m.u8(owner + 0xf2) & 4) throw new Unverified('0x9bac54 start, effect +0xf2 bit 2');
    let i = 0, off = 0x104;
    do {
      const base = m.u32(owner + 0x1f4);
      const at = (base + off + 4) >>> 0;
      const w108 = m.u32(at), w10c = m.u32(at + 4);
      let w110 = m.u32(at + 8);
      let set;
      if (w10c & 0x72) set = true;
      else if (m.u8(m.u32((base + off) >>> 0) + 4) & 8) set = m.u32(owner + 0x30) !== 0 || m.u32(owner + 0x1d0) !== 0;
      else set = false;
      w110 = set ? (w110 | 0x80) >>> 0 : (w110 & ~0x80) >>> 0;
      m.w32(at, w108); m.w32(at + 4, w10c); m.w32(at + 8, w110);
      i++; off += 0x130;
    } while (i < m.u16(owner + 0x1e4));
  }
  const a = m.u32(owner + 0x110), b = m.u32(owner + 0x114), c = m.u32(owner + 0x118);
  m.w32(owner + 0x110, a); m.w32(owner + 0x114, b); m.w32(owner + 0x118, (c | 0x1000000) >>> 0);
  return 1;
}

registerCode(0x9baa70, resetFrame);
registerCode(0x9bb8fc, rowEnabled);
registerCode(0xa919d4, initModel); registerCode(0xa7814c, initLiteBillboard); registerCode(0xaae244, initLitePolyline);
registerCode(0xa56174, linkPool);
registerCode(0xa91a30, startModel); registerCode(0xa78178, startLiteBillboard); registerCode(0xaae2a4, startLitePolyline);
registerCode(0xa56960, generatorSeedStart);
registerCode(0xa91b80, transformModel); registerCode(0xa783a8, transformLiteBillboard); registerCode(0xaaea38, transformLitePolyline);

export const internals = {
  allocGenerator: (m, size, align) => m.svc.alloc(size, align),
  ctorModel: (m, g) => { generatorCtor(m, g); m.w32(g, vtableFrom(m, GENERATOR_TYPES[5].got)); return g; },
  ctorLiteBillboard: (m, g) => { generatorCtor(m, g); m.w32(g, vtableFrom(m, GENERATOR_TYPES[0].got)); return g; },
  ctorLitePolyline: (m, g) => { generatorCtor(m, g); m.w32(g, vtableFrom(m, GENERATOR_TYPES[1].got)); return g; },
  entryIsPlain, typeHasBit, paramBit16,
  unitCtor, coordCtor, effectFields, effectBaseCtor, generatorBaseCtor, generatorCtor, generatorBind, generatorInit,
  generatorSizes, linkPool, generatorFlags, drawFlags, generatorStart, generatorSeedStart, generatorTransform,
  generatorSeed, nodeBind, nodeBlocks, nodeSeed, nodeInit, rowEnabled, factory, poolSetup, nodeSetup, resetFrame,
  initModel, initLiteBillboard, initLitePolyline, startModel, startLiteBillboard, startLitePolyline,
  transformModel, transformLiteBillboard, transformLitePolyline, workArea, headerSize, polylineBlock,
};
