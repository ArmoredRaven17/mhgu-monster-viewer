// the pool stand-in's allocator, taken from proof.js's own text, under random alloc / free: no two live blocks overlap,
// every block is aligned and inside the pool, holes stay sorted, disjoint and never adjacent, and when everything is
// freed the cursor is back at the base
import fs from 'node:fs';
const src = fs.readFileSync('docs/render/rom/effect/proof.js', 'utf8').replace(/\r\n/g, '\n');
const a = src.indexOf('    const gpu = state.gpu = {'), b = src.indexOf('    m.svc.gpuSetStorage');
const body = src.slice(a, b);
class Unverified extends Error {}
const make = new Function('state', 'm', 'malloc', 'POOL_BYTES', 'Unverified', body + '\nreturn state.gpu;');
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
let failures = 0; const fail = msg => { failures++; if (failures < 10) console.log('FAIL', msg); };
for (let run = 0; run < 200; run++){
  const state = {}, m = { svc: {} };
  const POOL = 0x200000, base = 0x50400000 + 32 * Math.floor(rnd() * 1000);
  const gpu = make(state, m, () => base, POOL, Unverified);
  const live = new Map();
  for (let step = 0; step < 2000; step++){
    if (live.size && rnd() < 0.45){
      const keys = [...live.keys()], k = keys[Math.floor(rnd() * keys.length)];
      m.svc.gpuPoolFree(k); live.delete(k);
    } else {
      const size = [0x40, 0x100, 0x180, 0x1000, 0x4800, 0x9000, 0x18000][Math.floor(rnd() * 7)] + 16 * Math.floor(rnd() * 8);
      const align = [1, 4, 16, 256, 0x1000][Math.floor(rnd() * 5)];
      let at;
      try { at = m.svc.gpuPoolAlloc(size, align); } catch (e){ if (!(e instanceof Unverified)) throw e; continue; }
      if (at % align) fail('misaligned ' + at.toString(16) + ' for ' + align);
      if (at < base || at + size > base + POOL) fail('outside the pool');
      for (const [o, n] of live) if (at < o + n && o < at + size) fail('overlap ' + at.toString(16) + '+' + size + ' with ' + o.toString(16) + '+' + n);
      live.set(at, size);
    }
    const H = gpu.holes;
    for (let i = 0; i < H.length; i++){
      if (!(H[i][0] < H[i][1])) fail('empty hole');
      if (i && !(H[i - 1][1] < H[i][0])) fail('holes adjacent or out of order');
      if (H[i][1] > gpu.cursor) fail('hole above the cursor');
      for (const [o, n] of live) if (H[i][0] < o + n && o < H[i][1]) fail('a hole over a live block');
    }
  }
  for (const k of [...live.keys()]){ m.svc.gpuPoolFree(k); live.delete(k); }
  if (gpu.cursor !== base || gpu.holes.length) fail('all freed but cursor ' + (gpu.cursor - base) + ' holes ' + gpu.holes.length);
}
// the Beam Test's shape: a fixed manager set held, then ever-new shapes freed after use -- the cursor must stop rising
{
  const state = {}, m = { svc: {} }, base = 0x50400000, gpu = make(state, m, () => base, 0x200000, Unverified);
  for (let i = 0; i < 6; i++) m.svc.gpuPoolAlloc(0x30000, 0x1000);
  let peakAfter10 = 0;
  for (let play = 0; play < 3000; play++){
    const blocks = [0, 1, 2].map(j => m.svc.gpuPoolAlloc(0x800 + 0x40 * ((play * 7 + j * 13) % 400), 256));
    for (const x of blocks) m.svc.gpuPoolFree(x);
    if (play === 10) peakAfter10 = gpu.peak;
  }
  if (gpu.peak > peakAfter10 + 0x10000) fail('the cursor kept rising with new shapes: ' + gpu.peak + ' vs ' + peakAfter10);
  console.log('beam-test shape: peak after 10 plays', peakAfter10 >> 10, 'KB, after 3000', gpu.peak >> 10, 'KB');
}
console.log(failures ? failures + ' failures' : 'all invariants hold (200 random runs x 2000 ops)');
