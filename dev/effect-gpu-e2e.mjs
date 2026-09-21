// sGpuParticle draws END TO END: a recorder plan replayed through the viewer's runtime, every frame's cParticleNode draws
// compared with the ROM's. efx/vecdrawsched.py with GPU_DRAW_ROM=1 GPU_DRAW_BYTES=1 writes logs/<name>.gpudraws.json:
// each GPU draw's context at 0x890ce0 and the index and vertex bytes it reads. This runs the same plan on the host --
// the same requests started from the monster's effect records, the same walker notices and stops, a parent with the
// same joints and size -- and compares, frame by frame: how many draws, the index count, the pass and depth key in
// +0x164 (its bits 5..16 carry the record's heap address, which is the viewer's heap's, so they are left out), the
// state word +0x154, and the index and vertex bytes.
//
//   node dev/effect-gpu-e2e.mjs <monster> <gpudraws.json> <frames> <size> <spec> ...
//   spec as vecdrawsched.py takes it: <f>:<efl name>:<pel>:<key> (a start), <lo>-<hi>:psl:<n>:<bits>, <f>:stop:<n>
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EffectHost } from '../docs/render/rom/effect/host.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const docs = join(HERE, '..', 'docs');
const [monster, drawsFile, framesArg, sizeArg, ...specs] = process.argv.slice(2);
const frames = +framesArg, size = +sizeArg;
const rom = JSON.parse(readFileSync(drawsFile, 'utf8'));

const starts = [], psl = [], stops = [];
for (const a of specs){
  const [f, ...rest] = a.split(':');
  if (rest[0] === 'stop'){ stops.push([+f, +rest[1]]); continue; }
  if (rest[0] === 'psl'){ const [lo, hi = lo] = f.split('-'); psl.push([+lo, +hi, +rest[1], +rest[2]]); continue; }
  const [efl, pel, key] = rest;
  starts.push([+f, efl.split(/[\\/]/).pop(), pel, +key]);
}

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
const toHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
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
// the recorder's camera (efx/efx_draw.py build): 10 m back on +z looking at the origin
const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
host.initDraw({ position: [0, 0, 1000], view: [...T, 0, 0, -1000, 1], world: [...T, 0, 0, 1000, 1] });
const jf = JSON.parse(readFileSync(join(HERE, '..', '..', 'efx', 'joints', monster + '_viewer_rest.json'), 'utf8'));
const parent = host.createParent(jf.jointList);
host.setParentScale(parent, size);
for (const j of jf.jointList) host.setJointMatrix(parent, j, jf.joints[j]);

const owners = new Map();            // one loaded list per file, as the recorder loads each once
const ownerOf = efl => {
  if (!owners.has(efl)){
    const e = def.effects.find(x => x.efl.split('/').pop() === efl);
    if (!e) throw new Error('no effect file ' + efl + ' in ' + monster + '.json');
    owners.set(efl, host.createEffect(new Uint8Array(readFileSync(join(docs, 'effects', e.efl)))));
  }
  return owners.get(efl);
};
const m = host.m;
const requests = [], words = new Map();
const byFrame = new Map();
for (const d of rom) (byFrame.get(d.frame) || byFrame.set(d.frame, []).get(d.frame)).push(d);

let bad = 0, compared = 0, reserved = 0;
const report = s => { if (bad++ < 25) console.log(s); };
for (let f = 0; f < frames; f++){
  for (const w of words.values()) m.w32(w, m.u32(w) & 0xfff0);                  // 0x31ca7c: notices cleared first
  for (const [at, n] of stops) if (at === f) host.stopRequest(requests[n]);
  for (const [at, efl, pel, key] of starts){
    if (at !== f) continue;
    const e = def.effects.find(x => x.record && x.efl.split('/').pop() === efl && x.record.key === key && (x.record.pel || pel) === pel);
    if (!e) throw new Error('no record ' + pel + ':' + key + ' of ' + efl);
    const r = e.record;
    const q = host.requestEffect(ownerOf(efl), parent, { index: r.index, key: r.key, path: r.path, payload: hex(r.payload) });
    requests.push(q);
    const n = requests.length - 1;
    if (psl.some(p => p[2] === n)){ const w = host.malloc(0x10); m.w32(w, 0); m.w32(q.core + 0x194, w); words.set(n, w); }
  }
  for (const [lo, hi, n, bits] of psl) if (lo <= f && f <= hi && words.has(n)) m.w32(words.get(n), m.u32(words.get(n)) | bits);
  host.unitFrame();
  const got = host.drawFrame(requests.flatMap(q => q.effects())).gpu;
  const want = byFrame.get(f) || [];
  if (got.length !== want.length){ report('frame ' + f + ': ' + got.length + ' draws, the ROM ' + want.length); continue; }
  for (let i = 0; i < got.length; i++){
    const g = got[i], w = want[i];
    compared++;
    const problems = [];
    if (g.indexList.length !== w.args[0]) problems.push('index count ' + g.indexList.length + ', ROM ' + w.args[0]);
    if ((g.key & 0x1f) !== (w.ctx164 & 0x1f)) problems.push('pass 0x' + (g.key & 0x1f).toString(16) + ', ROM 0x' + (w.ctx164 & 0x1f).toString(16));
    if ((g.key >>> 17) !== (w.ctx164 >>> 17)) problems.push('depth key 0x' + (g.key >>> 17).toString(16) + ', ROM 0x' + (w.ctx164 >>> 17).toString(16));
    if ((g.layout >>> 0) !== (w.ctx154 >>> 0)) problems.push('+0x154 0x' + (g.layout >>> 0).toString(16) + ', ROM 0x' + (w.ctx154 >>> 0).toString(16));
    if (g.blend !== w.bs || g.depth !== w.ds || g.raster !== w.rs) problems.push('states ' + [g.blend, g.depth, g.raster] + ', ROM ' + [w.bs, w.ds, w.rs]);
    for (const [k, v] of Object.entries(w.slots)) if (g.features[k] !== v) problems.push(k + ' ' + g.features[k] + ', ROM ' + v);
    if (w.indices !== undefined && toHex(new Uint8Array(g.indexList.buffer, g.indexList.byteOffset, g.indexList.byteLength)) !== w.indices) problems.push('index bytes differ');
    // every vertex byte but the Reserved word (+0x1c..+0x1f): the writer never sets it (effects-node.md 2.1), so it is
    // copied from its uninitialised local -- dead stack, in the game too -- and TGPUParticle never reads it (it is not a
    // member of GPU_PARTICLE_VS_INPUT). Counted apart.
    if (w.vertices !== undefined){
      const gv = g.vertexBytes, rv = hex(w.vertices);
      if (gv.length !== rv.length) problems.push('vertex bytes: length ' + gv.length + ', ROM ' + rv.length);
      else {
        let first = -1;
        for (let i = 0; i < gv.length; i++){
          if (gv[i] === rv[i]) continue;
          if ((i & 31) >= 28){ reserved++; continue; }
          first = i; break;
        }
        if (first >= 0) problems.push('vertex bytes differ from byte ' + first + ' (vertex ' + (first >> 5) + ', +' + (first & 31) + ')');
      }
    }
    if (problems.length) report('frame ' + f + ' draw ' + i + ': ' + problems.join('; '));
  }
}
console.log(compared + ' draws compared over ' + frames + ' frames, ' + bad + ' with differences; ' + reserved + ' Reserved-word bytes differ (not compared)' +
            (rom.some(d => d.vertices !== undefined) ? '' : ' (no bytes recorded: GPU_DRAW_BYTES=1)'));
process.exit(bad ? 1 : 0);
