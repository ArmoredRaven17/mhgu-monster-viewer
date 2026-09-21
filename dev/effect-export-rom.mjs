// The image pages the effect host reads, for the viewer (docs/effects/rom-pages.bin) -- and the soak that
// runs a monster's effects on exactly what the viewer ships.
//
// The runtime reads the ROM's data sections after the static initialisers (vtables, GOT slots, tables)
// and the effect manager the game builds at boot, as efx/e2e_dump.py's before.bin holds them. Shipping
// that whole image is 5 MB; this runs the host over a monster's effects the way the viewer does (live.js:
// one parent unit at the monster's size, the effects started by schedule.js) -- move and draw, the joints
// at rest, turning, at rest again, rage turned on and off twice so every `when` starts and ends -- and keeps
// only the pages of before.bin it touched.
//
//   node dev/effect-export-rom.mjs <e2e dump dir> <docs/effects/<monster>.json> <frames> [monster size]
//   node dev/effect-export-rom.mjs --check <docs/effects/<monster>.json> <frames> [monster size]
//
// Output: docs/effects/rom-pages.bin ([u32 address][u32 length][bytes] per page) and rom.json (the
// first free heap address). A later run over more effects adds pages; it never drops one.
// --check runs the same frames on the shipped pages, strict (a page they lack is refused, as in the viewer),
// and reports the first refusal or that it ran.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { EffectHost } from '../docs/render/rom/effect/host.js';
import { EffectSchedule } from '../docs/render/rom/effect/schedule.js';

const check = process.argv.includes('--check');
const args = process.argv.slice(2).filter(a => a !== '--check');
const [dir, defPath, frames, size = '1'] = check ? [null, ...args] : args;
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
const shipped = join(docs, 'rom-pages.bin'), romJson = join(docs, 'rom.json');
const info = check ? null : JSON.parse(readFileSync(join(dir, 'e2e.json'), 'utf8'));
const image = check ? pages(shipped) : pages(join(dir, 'before.bin'));
const imageKeys = new Map(image.map(([a, bytes]) => [a / 4096, bytes]));
const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));
const res = def.resources;

const host = new EffectHost({
  pages: image,
  heap: check ? JSON.parse(readFileSync(romJson, 'utf8')).heap : info.heapAtSnapshot,
  strict: check,
  records: JSON.parse(readFileSync(join(docs, 'mfx-records.json'), 'utf8')).records,
  drawSystem: hex(JSON.parse(readFileSync(join(docs, 'draw-system.json'), 'utf8')).bytes),
  resources: {
    meshTable: name => ({ count: res[name].meshCount, table: new Uint8Array(readFileSync(join(docs, res[name].mesh))) }),
    textureSize: name => res[name].size,
    anim: name => new Uint8Array(readFileSync(join(docs, res[name].ean))),
    list: name => new Uint8Array(readFileSync(join(docs, res[name].list))),
    material: (name, index) => res[name].materials[index],
  },
});
const touched = new Set();
const page = host.m.page.bind(host.m);
host.m.page = a => { const k = Math.floor(a / 4096); if (imageKeys.has(k)) touched.add(k); return page(a); };

const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
host.initDraw({ position: [0, 0, 1000], view: [...T, 0, 0, -1000, 1], world: [...T, 0, 0, 1000, 1] });
// as live.js builds them: every effect, one parent for all of them at the monster's size, the schedule
const owners = def.effects.map(e => host.createEffect(new Uint8Array(readFileSync(join(docs, e.efl)))));
const joints = [...new Set(def.effects.flatMap(e => e.joints))];
const parent = (joints.length || def.effects.some(e => e.record)) ? host.createParent(joints) : null;
const pose = f => {
  const a = f < 100 ? 0 : f < 300 ? 0.02 * (f - 100) : 4;               // at rest, turning, at rest again
  joints.forEach((j, k) => host.setJointMatrix(parent, j, [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 20 * k, 150, -25, 1]));
};
if (parent){ host.setParentScale(parent, +size); pose(0); }
const schedule = new EffectSchedule(host, parent, owners.map((owner, i) => ({ owner, def: def.effects[i] })), false);
const toggles = new Set([0.2, 0.55, 0.75, 0.9].map(t => Math.floor(t * +frames)));
let prims = 0, models = 0, peak = 0, f = 0;
const heapAt = [];
try {
  for (; f < +frames; f++){
    if (toggles.has(f)){
      const before = host.heap;
      schedule.setRage(!schedule.rage);
      heapAt.push('f' + f + ' rage ' + (schedule.rage ? 'on' : 'off') + ' +' + ((host.heap - before) / 1024 | 0) + ' KB');
    }
    if (parent) pose(f);
    schedule.step();
    const d = host.drawFrame(schedule.effects());
    prims += d.prims.length; models += d.models.length;
    peak = Math.max(peak, schedule.running);
  }
} catch (e){
  console.log(defPath.split(/[\/]/).pop() + ': stopped at frame ' + f + ' (' + schedule.running + ' running): ' + (e && e.message || e));
  process.exit(1);
}
const summary = frames + ' frames: ' + prims + ' primitive draws, ' + models + ' model draws; ' + schedule.starts + ' starts, at most ' +
  peak + ' running, ' + host.requests?.units.length + ' units left; ' + heapAt.join(', ');
if (check){ console.log(defPath.split(/[\/]/).pop() + ': ran ' + summary); process.exit(0); }

const keep = new Map();
if (existsSync(shipped)) for (const [a, bytes] of pages(shipped)) keep.set(a / 4096, bytes);
for (const k of touched) keep.set(k, imageKeys.get(k));
const parts = [];
for (const k of [...keep.keys()].sort((a, b) => a - b)){
  const head = Buffer.alloc(8);
  head.writeUInt32LE(k * 4096, 0); head.writeUInt32LE(4096, 4);
  parts.push(head, Buffer.from(keep.get(k)));
}
writeFileSync(shipped, Buffer.concat(parts));
const rom = existsSync(romJson) ? JSON.parse(readFileSync(romJson, 'utf8')) : {};
rom.heap = Math.max(rom.heap || 0, info.heapAtSnapshot);
rom.source = 'efx/e2e_dump.py before.bin: the image data sections after the static initialisers and the effect manager, pages the host touched (dev/effect-export-rom.mjs)';
writeFileSync(romJson, JSON.stringify(rom, null, 1));
console.log(summary + '; ' + touched.size + ' pages touched, ' + keep.size + ' kept (' + (keep.size * 4104 / 1024 | 0) + ' KB)');
