// The image pages the effect host reads, for the viewer (docs/effects/rom-pages.bin).
//
// The runtime reads the ROM's data sections after the static initialisers (vtables, GOT slots, tables)
// and the effect manager the game builds at boot, as efx/e2e_dump.py's before.bin holds them. Shipping
// that whole image is 5 MB; this runs the host over a monster's effects -- load, start, move and draw,
// hung from a moving parent -- and keeps only the pages of before.bin it touched.
//
//   node dev/effect-export-rom.mjs <e2e dump dir> <docs/effects/<monster>.json> <frames>
//
// Output: docs/effects/rom-pages.bin ([u32 address][u32 length][bytes] per page) and rom.json (the
// first free heap address). A later run over more effects adds pages; it never drops one.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { EffectHost } from '../docs/render/rom/effect/host.js';

const [dir, defPath, frames] = process.argv.slice(2);
const info = JSON.parse(readFileSync(join(dir, 'e2e.json'), 'utf8'));
const def = JSON.parse(readFileSync(defPath, 'utf8'));
const docs = dirname(defPath);

function pages(file){
  const b = readFileSync(file), out = [];
  for (let o = 0; o < b.length; ){
    const a = b.readUInt32LE(o), n = b.readUInt32LE(o + 4);
    out.push([a, new Uint8Array(b.subarray(o + 8, o + 8 + n))]);
    o += 8 + n;
  }
  return out;
}
const image = pages(join(dir, 'before.bin'));
const imageKeys = new Map(image.map(([a, bytes]) => [a / 4096, bytes]));
const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));
const res = def.resources;

const host = new EffectHost({
  pages: image,
  heap: info.heapAtSnapshot,
  records: JSON.parse(readFileSync(join(docs, 'mfx-records.json'), 'utf8')).records,
  drawSystem: hex(JSON.parse(readFileSync(join(docs, 'draw-system.json'), 'utf8')).bytes),
  resources: {
    meshTable: name => ({ count: res[name].meshCount, table: new Uint8Array(readFileSync(join(docs, res[name].mesh))) }),
    textureSize: name => res[name].size,
    anim: name => new Uint8Array(readFileSync(join(docs, res[name].ean))),
    material: (name, index) => res[name].materials[index],
  },
});
const touched = new Set();
const page = host.m.page.bind(host.m);
host.m.page = a => { const k = Math.floor(a / 4096); if (imageKeys.has(k)) touched.add(k); return page(a); };

const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
host.initDraw({ position: [0, 0, 1000], view: [...T, 0, 0, -1000, 1], world: [...T, 0, 0, 1000, 1] });
// as live.js builds them: every effect, then one parent for all of them, then each started -- a record
// through the monster's request (proof.js), otherwise attached and started
const owners = def.effects.map(e => host.createEffect(new Uint8Array(readFileSync(join(docs, e.efl)))));
const joints = [...new Set(def.effects.flatMap(e => e.joints))];
const parent = joints.length ? host.createParent(joints) : null;
joints.forEach((j, i) => host.setJointMatrix(parent, j, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10 * i, 100, 0, 1]));
def.effects.forEach((e, i) => {
  if (e.record) host.proofStart(owners[i], parent, hex(e.record.payload));
  else {
    if (e.joints.length) host.attach(owners[i], parent);
    host.start(owners[i]);
  }
});
let prims = 0, models = 0;
for (let f = 0; f < +frames; f++){
  if (parent){
    const a = f < 100 ? 0 : f < 300 ? 0.02 * (f - 100) : 4;            // at rest, turning, at rest again
    joints.forEach((j, k) => host.setJointMatrix(parent, j, [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 20 * k, 150, -25, 1]));
  }
  for (const o of owners) host.move(o);
  const d = host.drawFrame(owners);
  prims += d.prims.length; models += d.models.length;
}

const out = join(docs, 'rom-pages.bin');
const keep = new Map();
if (existsSync(out)) for (const [a, bytes] of pages(out)) keep.set(a / 4096, bytes);
for (const k of touched) keep.set(k, imageKeys.get(k));
const parts = [];
for (const k of [...keep.keys()].sort((a, b) => a - b)){
  const head = Buffer.alloc(8);
  head.writeUInt32LE(k * 4096, 0); head.writeUInt32LE(4096, 4);
  parts.push(head, Buffer.from(keep.get(k)));
}
writeFileSync(out, Buffer.concat(parts));
const romJson = join(docs, 'rom.json');
const rom = existsSync(romJson) ? JSON.parse(readFileSync(romJson, 'utf8')) : {};
rom.heap = Math.max(rom.heap || 0, info.heapAtSnapshot);
rom.source = 'efx/e2e_dump.py before.bin: the image data sections after the static initialisers and the effect manager, pages the host touched (dev/effect-export-rom.mjs)';
writeFileSync(romJson, JSON.stringify(rom, null, 1));
console.log(frames + ' frames: ' + prims + ' primitive draws, ' + models + ' model draws; ' + touched.size + ' pages touched, ' + keep.size + ' kept (' + (keep.size * 4104 / 1024 | 0) + ' KB)');
