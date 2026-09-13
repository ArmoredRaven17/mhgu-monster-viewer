// How far the JS effect runtime gets with an effect it has not been checked on: load, start and move an
// .efl for N frames (optionally drawn) on the host, from an e2e dump's pre-construction image, and report
// the first refusal -- a branch of the ROM's code no recorded run reached (Unverified) -- or that it ran.
//
//   node dev/effect-probe.mjs <e2e dump dir for the image> <file.efl> <frames> [--draw]
//
// Nothing here is a check: a run that does not refuse still has to be recorded and compared (efx/vectors.py,
// dev/effect-e2e.mjs) before the viewer uses it. It only sizes the work.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EffectHost } from '../docs/render/rom/effect/host.js';

const [dir, eflPath, framesArg] = process.argv.slice(2);
const draw = process.argv.includes('--draw');
const info = JSON.parse(readFileSync(join(dir, 'e2e.json'), 'utf8'));
const ext = (name, e) => join(info.extract, name.replace(/\\/g, '/') + e);
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
      const t = readFileSync(ext(name, '.tex'));
      const w1 = t.readUInt32LE(4), w2 = t.readUInt32LE(8), w3 = t.readUInt32LE(12), shift = (w1 >>> 24) & 0xf;
      return [((w2 >>> 6) & 0x1fff) << shift, (w2 >>> 19) << shift, ((w3 >>> 16) & 0x1fff) << shift];
    },
    anim: name => new Uint8Array(readFileSync(ext(name, '.ean'))),
    material(name, index){ throw new Error('material answers are not loaded in a probe (' + name + ' #' + index + ')'); },
  },
});
let stage = 'load';
try {
  const owner = host.createEffect(new Uint8Array(readFileSync(eflPath)));
  stage = 'start';
  host.start(owner);
  const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
  if (draw) host.initDraw({ position: [0, 0, 1000], view: [...T, 0, 0, -1000, 1], world: [...T, 0, 0, 1000, 1] });
  let prims = 0, models = 0;
  for (let f = 0; f < +framesArg; f++){
    stage = 'move frame ' + f;
    host.move(owner);
    if (draw){
      stage = 'draw frame ' + f;
      const d = host.drawFrame([owner]);
      prims += d.prims.length; models += d.models.length;
    }
  }
  console.log(eflPath.split(/[\\/]/).pop() + ': ran ' + framesArg + ' frames' + (draw ? ' (' + prims + ' primitive draws, ' + models + ' model draws)' : ''));
} catch (e){
  console.log(eflPath.split(/[\\/]/).pop() + ': stopped at ' + stage + ': ' + (e && e.message || e));
}
