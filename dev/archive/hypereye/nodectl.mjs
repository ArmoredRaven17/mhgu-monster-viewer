// hypereye/nodectl.mjs (hyper-eye lane, 2026-10-27): THE POSITIVE CONTROL for "a node unit drawn earlier in the frame leaves 0x11". Through
// the viewer's runtime, with NO forced pass (host.framePass unset: every frame starts at the scene setup's 0x15), on one monster's rest
// joints: (1) find a record whose units draw a cParticleNode (host.drawFrame's gpu list non-empty); (2) start that record and the head
// aura in each order (node first / aura first), 30 frames, and print the eye rows' emit (sorted / unsorted) and depth, and the
// context's pass read after the frame. The ROM's own node draw (lifted 0xb918c4 -> 0xb91aac's 0x87cf70) is what sets the pass here.
//   node dev/archive/hypereye/nodectl.mjs <mon> <auraKey> [nodeRecord pel|key]
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const docs = join(ROOT, 'docs');
const { EffectHost } = await import('file://' + join(docs, 'render', 'rom', 'effect', 'host.js').replace(/\\/g, '/'));
const { EffectSchedule } = await import('file://' + join(docs, 'render', 'rom', 'effect', 'schedule.js').replace(/\\/g, '/'));
function pages(file){
  const b = readFileSync(file), out = [];
  for (let o = 0; o < b.length; ){ const a = b.readUInt32LE(o), n = b.readUInt32LE(o + 4); out.push([a, new Uint8Array(b.subarray(o + 8, o + 8 + n))]); o += 8 + n; }
  return out;
}
const hex = h => Uint8Array.from(h.match(/../g) || [], b => parseInt(b, 16));
const [mon, auraS, nodeS] = process.argv.slice(2);
const def = JSON.parse(readFileSync(join(docs, 'effects', mon + '.json'), 'utf8'));
const res = def.resources;
const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
const PAGES = pages(join(docs, 'effects', 'rom-pages.bin'));
function build(defs){
  const host = new EffectHost({ pages: PAGES, heap: JSON.parse(readFileSync(join(docs, 'effects', 'rom.json'), 'utf8')).heap, strict: true,
    records: JSON.parse(readFileSync(join(docs, 'effects', 'mfx-records.json'), 'utf8')).records,
    drawSystem: hex(JSON.parse(readFileSync(join(docs, 'effects', 'draw-system.json'), 'utf8')).bytes),
    resources: {
      meshTable: name => ({ count: res[name].meshCount, table: new Uint8Array(readFileSync(join(docs, 'effects', res[name].mesh))) }),
      textureSize: name => res[name].size, anim: name => new Uint8Array(readFileSync(join(docs, 'effects', res[name].ean))),
      list: name => new Uint8Array(readFileSync(join(docs, 'effects', res[name].list))), material: (name, index) => res[name].materials[index] } });
  host.initDraw({ position: [0, 0, 1000], view: [...T, 0, 0, -1000, 1], world: [...T, 0, 0, 1000, 1] });
  const owners = defs.map(d => host.createEffect(new Uint8Array(readFileSync(join(docs, 'effects', d.efl)))));
  const jf = JSON.parse(readFileSync(join(ROOT, '..', 'efx', 'joints', mon + '_viewer_rest.json'), 'utf8'));
  const parent = host.createParent(jf.jointList);
  host.setParentScale(parent, jf.unit.scale);
  for (const j of jf.jointList) host.setJointMatrix(parent, j, jf.joints[j]);
  return { host, schedule: new EffectSchedule(host, parent, owners.map((owner, i) => ({ owner, def: defs[i] })), false) };
}
const keyOf = d => d.record.pel + '|' + d.record.key;
const aura = def.effects.find(d => d.record && d.record.pel === mon + 'u' && d.record.key === +auraS);
// (1) a node-drawing record
let nodeDef = nodeS ? def.effects.find(d => d.record && keyOf(d) === nodeS) : null;
if (!nodeDef) for (const d of def.effects){
  if (!d.record || d === aura) continue;
  try {
    const { host, schedule } = build([d]); schedule.start(schedule.entries[0]);
    let gpu = 0; for (let f = 0; f < 30 && !gpu; f++){ schedule.step(); gpu = host.drawFrame(schedule.effects()).gpu.length; }
    if (gpu){ nodeDef = d; console.log('node record', keyOf(d), d.efl, 'gpu draws', gpu); break; }
  } catch (e){ /* refused: not a control */ }
}
if (!nodeDef){ console.log('no node-drawing record found on', mon); process.exit(0); }
// (2) both orders, no forced pass
const PASS = 0x164;
for (const order of [[nodeDef, aura], [aura, nodeDef]]){
  const { host, schedule } = build(order);
  for (const e of schedule.entries) schedule.start(e);
  let last;
  for (let f = 0; f < 30; f++){ schedule.step(); last = host.drawFrame(schedule.effects()); }
  const eyes = last.models.filter(d => /cm200_108|cm100_000/.test(d.model) && +d.globalTransparency === 1 && /RevSub|BlendAlpha/.test(d.blend));
  console.log('order', order.map(keyOf).join(' then '), '| gpu', last.gpu.length, '| pass after the frame 0x' + (host.m.u32(host.VIEW + PASS) & 0x1f).toString(16),
              '| draw seq: node', last.gpu.map(d => d.seq).join(','), 'eyes', eyes.map(d => d.seq).join(','),
              '| unit lines', JSON.stringify(host.requests.units.map(([u, l]) => l)),
              '| opaque rows:', eyes.map(d => d.model.split('\\').pop() + '#' + d.meshIndex + ' ' + d.blend.replace('BSBlend', '') + ' ' + (d.unsorted ? 'unsorted' : 'sorted') + '/' + d.depth).join('; '));
}
