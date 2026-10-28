// laneB3/hyperrows.mjs (lane B3, 2026-10-27): one EVENT record started headless (schedule.fire) through the viewer's own runtime on the
// rest joints, then per unit: MASK1 / MASK2, every row of its effect list with its node words w00 (against MASK1) / w04 (against MASK2)
// and whether it is selected, and the generators built (+0x1f0) with their type and node block's joint word (+0x2c) -- to see whether an
// effect file carries rows the record does not select (e.g. a hyper head aura's eye rows).
//   node dev/archive/laneB3/hyperrows.mjs <monster> <pel> <key> [frames]
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const docs = join(ROOT, 'docs');
// GEN_RENDER=<dir>: import the runtime from an instrumented COPY of docs/render (a copy whose life.js pushes each
// life step to globalThis.__LIFELOG; never patch the shared tree). Default: the shipped docs/render (no life log).
const RENDER = process.env.GEN_RENDER || join(docs, 'render');
const { EffectHost } = await import('file://' + join(RENDER, 'rom', 'effect', 'host.js').replace(/\\/g, '/'));
const { EffectSchedule } = await import('file://' + join(RENDER, 'rom', 'effect', 'schedule.js').replace(/\\/g, '/'));
globalThis.__LIFELOG = [];

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const allBits = process.argv.includes('--all-bits');
const [monster, PEL, keyS, framesS] = args;
const KEY = +keyS;
function pages(file){
  const b = readFileSync(file), out = [];
  for (let o = 0; o < b.length; ){ const a = b.readUInt32LE(o), n = b.readUInt32LE(o + 4); out.push([a, new Uint8Array(b.subarray(o + 8, o + 8 + n))]); o += 8 + n; }
  return out;
}
const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));
const def = JSON.parse(readFileSync(join(docs, 'effects', monster + '.json'), 'utf8'));
const res = def.resources;
const host = new EffectHost({
  pages: pages(join(docs, 'effects', 'rom-pages.bin')),
  heap: JSON.parse(readFileSync(join(docs, 'effects', 'rom.json'), 'utf8')).heap,
  strict: true,
  records: JSON.parse(readFileSync(join(docs, 'effects', 'mfx-records.json'), 'utf8')).records,
  drawSystem: hex(JSON.parse(readFileSync(join(docs, 'effects', 'draw-system.json'), 'utf8')).bytes),
  resources: {
    meshTable: name => ({ count: res[name].meshCount, table: new Uint8Array(readFileSync(join(docs, 'effects', res[name].mesh))) }),
    textureSize: name => res[name].size,
    anim: name => new Uint8Array(readFileSync(join(docs, 'effects', res[name].ean))),
    list: name => new Uint8Array(readFileSync(join(docs, 'effects', res[name].list))),
    material: (name, index) => res[name].materials[index],
  },
});
const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
host.initDraw({ position: [0, 0, 1000], view: [...T, 0, 0, -1000, 1], world: [...T, 0, 0, 1000, 1] });
const owners = def.effects.map(e => host.createEffect(new Uint8Array(readFileSync(join(docs, 'effects', e.efl)))));
const jointsFile = join(ROOT, '..', 'efx', 'joints', monster + '_viewer_rest.json');
const jf = JSON.parse(readFileSync(jointsFile, 'utf8'));
const parent = host.createParent(jf.jointList);
host.setParentScale(parent, jf.unit.scale);
for (const j of jf.jointList) host.setJointMatrix(parent, j, jf.joints[j]);
const schedule = new EffectSchedule(host, parent, owners.map((owner, i) => ({ owner, def: def.effects[i] })), false);
const m = host.m;
const h8 = v => (v >>> 0).toString(16);
const frames = +(framesS || 3);
schedule.fire(PEL, KEY);
for (let k = 0; k < frames; k++){ schedule.step(); host.drawFrame(schedule.effects()); }
for (const e of schedule.entries){
  if (!e.def.record || e.def.record.key !== KEY || e.def.record.pel !== PEL) continue;
  for (const q of e.requests) for (const u of q.effects()){
    const mask1 = m.u32(u + 0x1c8) >>> 0, mask2 = m.u32(u + 0x1cc) >>> 0, rl = m.u32(u + 0xf4) >>> 0;
    console.log('unit +0xc ' + h8(m.u32(u + 0xc)) + ' MASK1 ' + h8(mask1) + ' MASK2 ' + h8(mask2) + ' efl ' + e.def.efl);
    for (let row = 0; rl && row < 64; row++){
      const c0 = m.u32(m.u32(rl + 0x68) + (row << 4)) >>> 0; if (!c0) break;
      const nb = (m.u32(rl + 0x68) + (c0 >>> 8)) >>> 0, w00 = m.u32(nb) >>> 0, w04 = m.u32(nb + 4) >>> 0;
      console.log('  row ' + row + ' c0 ' + h8(c0) + ' w00 ' + h8(w00) + ' w04 ' + h8(w04) + ' +0x2c ' + h8(m.u32(nb + 0x2c)) + ' sel ' + (((w00 & mask1) !== 0) && ((w04 & mask2) !== 0)));
    }
    let n = 0; for (let g = m.u32(u + 0x1f0) >>> 0; g && n < 64; g = m.u32(g + 0xc) >>> 0, n++)
      console.log('  gen vt ' + h8(m.u32(g)) + ' type ' + m.u8(g + 0x46) + ' node+0x2c ' + h8(m.u32((m.u32(g + 0x30) >>> 0) + 0x2c)));
  }
}
