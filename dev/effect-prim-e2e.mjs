// End to end through the DRAW: the JS effect host (docs/render/rom/effect/host.js) runs an effect from
// the emulator's pre-construction image (efx/e2e_dump.py's before.bin) for the dump's frames and draws
// every frame the way efx/engprim.py drew it under the emulator -- the draw system's primitive layer
// opened, uEffect's draw, the layer sorted and drawn -- and every primitive GPU draw must come out as the
// ROM made it: vertex and index bytes, the shader records selected, textures, blend / depth /
// rasterizer states, input layout, and the primitive constant buffers.
//
//   node dev/effect-prim-e2e.mjs <e2e dump dir> <engprim-*.json> [<engdraw-*.json> for the materials]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EffectHost } from '../docs/render/rom/effect/host.js';

const [dir, primPath, drawPath] = process.argv.slice(2);
const info = JSON.parse(readFileSync(join(dir, 'e2e.json'), 'utf8'));
const want = JSON.parse(readFileSync(primPath, 'utf8'));

function pages(file){
  const b = readFileSync(file), out = [];
  for (let o = 0; o < b.length; ){
    const a = b.readUInt32LE(o), n = b.readUInt32LE(o + 4);
    out.push([a, new Uint8Array(b.subarray(o + 8, o + 8 + n))]);
    o += 8 + n;
  }
  return out;
}
const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));
const toHex = u => Array.from(u, b => b.toString(16).padStart(2, '0')).join('');
const ext = (name, e) => join(info.extract, name.replace(/\\/g, '/') + e);

// the model particles' material answers, as engdraw.py took them from each .mrl
const materials = new Map();
if (drawPath) for (const d of JSON.parse(readFileSync(drawPath, 'utf8'))) if (d.material) materials.set(d.material[0] + '#' + d.material[1], d.mrl);

const host = new EffectHost({
  pages: pages(join(dir, 'before.bin')),
  heap: info.heapAtSnapshot,
  records: JSON.parse(readFileSync('docs/effects/mfx-records.json', 'utf8')).records,
  drawSystem: hex(JSON.parse(readFileSync('docs/effects/draw-system.json', 'utf8')).bytes),
  resources: {
    meshTable(name){
      const mod = readFileSync(ext(name, '.mod'));
      const count = mod.readUInt16LE(8), off = mod.readUInt32LE(0x30);
      return { count, table: new Uint8Array(mod.subarray(off, off + 48 * count)) };
    },
    textureSize(name){
      const w2 = readFileSync(ext(name, '.tex')).readUInt32LE(8);
      return [(w2 >>> 6) & 0x1fff, w2 >>> 19];
    },
    anim: name => new Uint8Array(readFileSync(ext(name, '.ean'))),
    material(name, index){
      const mat = materials.get(name + '#' + index);
      if (!mat) throw new Error('no material answer for ' + name + ' #' + index + ' (pass the engdraw dump)');
      return mat;
    },
  },
});

const efl = readFileSync(join(info.extract, 'effect', 'em', info.file.slice(0, 5), info.file));
const owner = host.createEffect(new Uint8Array(efl));
let parent = null;
if (info.parent){
  parent = host.createParent(info.parent.joints);
  host.attach(owner, parent);
}
const setJoints = f => {
  const bytes = hex(info.parent.frames[f]);
  const dv = new DataView(bytes.buffer);
  info.parent.joints.forEach((j, i) => {
    const rows = [];
    for (let k = 0; k < 16; k++) rows.push(dv.getFloat32(0xa0 * i + 0x10 + 4 * k, true));
    host.setJointMatrix(parent, j, rows);
  });
};
if (parent) setJoints(0);
host.start(owner);
const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
host.initDraw({ position: [0, 0, 1000], view: [...T, 0, 0, -1000, 1], world: [...T, 0, 0, 1000, 1] });

const frames = Math.min(info.frames, want.length ? 1e9 : 0);
let k = 0, bad = 0, compared = 0;
const acc = {};                                   // the emulator side's selection: what the path wrote
const PRIM_CBS = ['CBPrimitiveView', 'CBPrimitiveEx', 'CBPrimitiveCoord'];
const records = JSON.parse(readFileSync('docs/effects/mfx-records.json', 'utf8')).records;
const members = Object.fromEntries(records.filter(r => r && r[1] === 0).map(r => [r[0], r[3]]));
for (let f = 0; f < info.frames && k < want.length; f++){
  if (parent) setJoints(f);
  host.move(owner);
  const { prims } = host.drawFrame([owner]);
  // A constant buffer lives in the frame's buffer: one the path did not write THIS frame is a slot still
  // pointing at an earlier frame's allocation, whose bytes no draw reads. And only member words count:
  // the padding between members is whatever the buffer held.
  const thisFrame = new Set();
  for (const d of prims){
    const w = want[k++];
    if (!w){ console.log('frame ' + f + ': js drew more than the emulator'); bad++; break; }
    for (const [iface, [variant]] of Object.entries(w.written)){ acc[iface] = variant; thisFrame.add(iface); }
    compared++;
    const problems = [];
    if (d.vertices !== w.args[1] || d.indices !== w.args[2]) problems.push('counts js ' + d.vertices + '/' + d.indices + ', rom ' + w.args[1] + '/' + w.args[2]);
    if (d.stride !== w.stride) problems.push('stride');
    if (d.blend !== w.bs || d.depth !== w.ds || d.raster !== w.rs) problems.push('states js ' + [d.blend, d.depth, d.raster] + ', rom ' + [w.bs, w.ds, w.rs]);
    if (d.layout !== w.ctx['154']) problems.push('layout 0x' + d.layout.toString(16) + ', rom 0x' + w.ctx['154'].toString(16));
    // Features: every one the ROM's primitive path has written must be selected here, and every one
    // selected here must be what the ROM's context held at this draw. (The emulator also ran the
    // engine's model draw, which leaves its own selections in the context; where one already matched,
    // the primitive path had nothing to write.)
    const romFeatures = Object.fromEntries(Object.entries(acc).filter(([i]) => i.startsWith('F')));
    for (const i of Object.keys(romFeatures)) if (romFeatures[i] !== d.features[i]) problems.push(i + ' js ' + d.features[i] + ', rom wrote ' + romFeatures[i]);
    for (const i of Object.keys(d.features)) if (d.features[i] !== w.slots[i]) problems.push(i + ' js ' + d.features[i] + ', rom context ' + w.slots[i]);
    for (const t of Object.keys(w.tex)) if (acc[t] !== undefined && d.textures[t] !== w.tex[t]) problems.push(t + ' js ' + d.textures[t] + ', rom ' + w.tex[t]);
    for (const c of PRIM_CBS){
      if (!w.cb[c] || !thisFrame.has(c)) continue;
      if (!d.cb[c]){ problems.push(c + ' missing'); continue; }
      for (const [name, off, count] of members[c]){
        for (let i = off; i < off + count; i++){
          if (d.cb[c][i] !== w.cb[c][i]){ problems.push(c + '.' + name + '[' + (i - off) + '] js 0x' + (d.cb[c][i] >>> 0).toString(16) + ', rom 0x' + (w.cb[c][i] >>> 0).toString(16)); break; }
        }
      }
    }
    if (toHex(d.vertexBytes) !== w.vertices) problems.push('vertex bytes differ');
    if (Array.from(d.indexList).join() !== w.indices.join()) problems.push('indices differ');
    if (problems.length){ bad++; if (bad <= 10) console.log('frame ' + f + ' draw ' + (k - 1) + ': ' + problems.slice(0, 6).join('; ')); }
  }
}
if (k < want.length){ console.log('js drew ' + k + ' primitive batches, the emulator ' + want.length); bad++; }
console.log(info.file + (parent ? ' (parented)' : '') + ': ' + compared + ' primitive draws compared, ' + bad + ' differ');
process.exit(bad ? 1 : 0);
