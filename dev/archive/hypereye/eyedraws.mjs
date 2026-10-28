// hypereye/eyedraws.mjs (hyper-eye lane, 2026-10-27): one EVENT record started headless (schedule.fire) through the viewer's own
// runtime on the rest joints; after N frames, every draw the frame submits (models / prims / gpu), each model draw's mesh, its world
// translation and that translation in the record joint's frame (the joint's rest matrix inverted) -- to see WHERE a hyper head aura's
// rows land against the head joint (and the eyes), and which of them submit at all.
//   node dev/archive/hypereye/eyedraws.mjs <monster> <pel> <key> [frames] [joint]
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const docs = join(ROOT, 'docs');
const RENDER = process.env.GEN_RENDER || join(docs, 'render');
const { EffectHost } = await import('file://' + join(RENDER, 'rom', 'effect', 'host.js').replace(/\\/g, '/'));
const { EffectSchedule } = await import('file://' + join(RENDER, 'rom', 'effect', 'schedule.js').replace(/\\/g, '/'));
const [monster, PEL, keyS, framesS, jointS] = process.argv.slice(2);
const KEY = +keyS, FRAMES = +(framesS || 30);
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
const jf = JSON.parse(readFileSync(join(ROOT, '..', 'efx', 'joints', monster + '_viewer_rest.json'), 'utf8'));
const parent = host.createParent(jf.jointList);
host.setParentScale(parent, jf.unit.scale);
for (const j of jf.jointList) host.setJointMatrix(parent, j, jf.joints[j]);
const schedule = new EffectSchedule(host, parent, owners.map((owner, i) => ({ owner, def: def.effects[i] })), false);
const entry = schedule.entries.find(e => e.def.record && e.def.record.pel === PEL && e.def.record.key === KEY);
const pj = Buffer.from(entry.def.record.payload, 'hex');
const J = jointS !== undefined ? +jointS : pj.readUInt16LE(0x32);
const JM = jf.joints[J];        // row-major 4x4, translation in [12..14]
console.log(monster, PEL, KEY, 'efl', entry.def.efl, 'joint', J, 'joint at', JM.slice(12, 15).map(v => v.toFixed(1)).join(' '));
// inverse of the joint's rigid matrix (rows 0..2 = axes)
const toLocal = p => { const d = [p[0] - JM[12], p[1] - JM[13], p[2] - JM[14]];
  return [0, 1, 2].map(r => d[0] * JM[4 * r] + d[1] * JM[4 * r + 1] + d[2] * JM[4 * r + 2]); };
// --pass11: DIAGNOSTIC -- the context's pass forced to 0x11 at the frame's start (as when a cParticleNode drew earlier in the game's
// frame and left 0x11, host.js drawFrame), so the model draws take the SORTED emit (modeldraw.js 0xc8ea44) and their flags' depth
if (process.argv.includes('--pass11')){
  const w32 = host.m.w32.bind(host.m), at = (host.VIEW + 0x164) >>> 0;
  host.m.w32 = (a, v) => w32(a, ((a >>> 0) === at) ? (((v >>> 0) & ~0x1f) | 0x11) >>> 0 : v);
}
schedule.fire(PEL, KEY);
let last;
for (let k = 0; k < FRAMES; k++){ schedule.step(); last = host.drawFrame(schedule.effects()); }
const f = v => v.toFixed(1);
console.log('frame', FRAMES, 'models', last.models.length, 'prims', last.prims.length, 'gpu', last.gpu.length);
for (const d of last.models){
  const w = d.world, t = [w[3], w[7], w[11]], l = toLocal(t);
  const sc = [0, 1, 2].map(c => Math.hypot(w[c], w[4 + c], w[8 + c]));
  console.log('  model', d.model, 'mesh', d.meshIndex, 'mat', d.material, 'blend', d.blend, 'gT', (+d.globalTransparency).toFixed(2),
              'world', t.map(f).join(' '), 'head-local', l.map(f).join(' '), 'scale', sc.map(v => v.toFixed(3)).join(' '),
              'depth', d.depth, d.unsorted ? 'unsorted' : 'sorted', 'prim', (d.primColor || []).map(v => (+v).toFixed(2)).join(','));
}
for (const d of last.prims.slice(0, 8)) console.log('  prim', JSON.stringify(Object.keys(d)));
// --detail: every field of the model draws whose model name contains it (e.g. --detail=cm200_108)
const det = (process.argv.find(a => a.startsWith('--detail=')) || '').slice(9);
if (det) for (const d of last.models.filter(d => d.model.includes(det)))
  console.log(JSON.stringify(Object.fromEntries(Object.entries(d).filter(([k]) => !['world', 'cbMaterial'].includes(k)))));
// the move lines the effect units joined (proof.js registerUnit: 0xc04f84(sunit, line, unit))
if (process.argv.includes('--lines')) console.log('unit lines', JSON.stringify((host.requests ? host.requests.units : []).map(([u, l]) => l)));
