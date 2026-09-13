// Replays the engine's own model draws, as C:\MHGU-Extract\efx\engdraw.py snapshotted them at the GPU
// mesh draw, through docs/render/rom/effect/modeldraw.js. Every draw's inputs (the particle's service
// arguments and the memory they point at, the model's mesh record, the camera, the material's .mrl
// answers) go in; the constant buffers, blend and depth state, feature choices, sort order and draw mode
// the ROM left in the context must come out.
//
//   node dev/effect-modeldraw-check.mjs <engdraw-*.json> [...]
import { readFileSync } from 'node:fs';
import { Mem, Unverified, bitsf32 } from '../docs/render/rom/effect/mem.js';
import { drawMesh } from '../docs/render/rom/effect/modeldraw.js';

const PRIM = 0x10000000, VIEW = 0x20000000, CAM = 0x30000000, MODEL = 0x40000000, MESHES = 0x40001000;
const MATRIX = 0x50000000, COLOUR = 0x50001000, FLAGS = 0x50002000, UV = 0x50003000;

function hex(m, a, h){ for (let i = 0; i < h.length / 2; i++) m.w8(a + i, parseInt(h.substr(2 * i, 2), 16)); }
function floats(m, a, list){ const f = new Float32Array(list); const u = new Uint32Array(f.buffer); u.forEach((w, i) => m.w32(a + 4 * i, w)); }

let fail = 0, total = 0;
const refused = new Map();
for (const file of process.argv.slice(2)){
  const draws = JSON.parse(readFileSync(file, 'utf8'));
  let ok = 0;
  for (const d of draws){
    total++;
    const s = d.service, m = new Mem(), problems = [];
    for (const [k, v] of Object.entries(d.prim)) m.w32(PRIM + parseInt(k, 16), v);
    m.w32(PRIM + 0x70, MODEL);
    m.w32(MODEL + 0x74, MESHES);
    hex(m, MESHES + 48 * s.args[2], s.mesh);
    m.w32(VIEW + 0x164, s.ctx164); m.w32(VIEW + 0x178, s.ctx178); m.w32(VIEW + 0x1e0, s.ctx1e0);
    m.w32(VIEW + 0xd7c, CAM);
    floats(m, CAM + 0x70, s.view);
    floats(m, MATRIX, s.matrix);
    hex(m, COLOUR, s.color);
    hex(m, FLAGS, s.flags);
    if (s.uv) hex(m, UV, s.uv);
    const stack = [COLOUR, s.stack[1], FLAGS, s.stack[3], s.uv ? UV : 0];
    const mat = { emission: d.mrl.emission, diffuse: d.mrl.diffuse, cbm: d.mrl.cbm };
    let out;
    try { out = drawMesh(m, PRIM, VIEW, s.args[2], MATRIX, stack, bitsf32(s.s0), () => mat); }
    catch (e){
      if (e instanceof Unverified){ refused.set(e.message, (refused.get(e.message) || 0) + 1); fail++; continue; }
      throw e;
    }
    const words = list => Array.from(new Uint32Array(new Float32Array(list).buffer));
    const same = (name, js, rom) => { if (js.length !== rom.length || js.some((v, i) => v !== rom[i])) problems.push(name + ' js ' + js.join(',') + ' rom ' + rom.join(',')); };
    same('CBWorld', words(out.world), d.cb.CBWorld);
    same('CBMaterial', words(out.cbMaterial), d.cb.CBMaterial);
    // 0x883bec caches the value at ctx+0x17c and writes a CBROPTest block only when it changes; the
    // probe's frame allocator is reused each frame, so a cached draw's block can be stale -- the cache is not
    same('fGlobalTransparency', words([out.globalTransparency]), [d.ctx17c]);
    if (out.primColor) same('fPrimColor', words(out.primColor), d.cb.CBPrimEflEmu);
    if (out.blend !== d.bs) problems.push('blend ' + out.blend + ', rom ' + d.bs);
    if (out.depth !== d.ds) problems.push('depth ' + out.depth + ', rom ' + d.ds);
    for (const [k, v] of Object.entries(out.features)) if (d.slots[k] !== v) problems.push(k + ' ' + v + ', rom ' + d.slots[k]);
    const order = ((s.ctx164 & 0x1f) | out.order) >>> 0;
    if (order !== d.ctx164) problems.push('ctx+0x164 0x' + order.toString(16) + ', rom 0x' + d.ctx164.toString(16));
    if (out.mode !== (d.ctx178 & 0x1f)) problems.push('draw mode 0x' + out.mode.toString(16) + ', rom 0x' + (d.ctx178 & 0x1f).toString(16));
    const range = [d.draw[0], d.draw[1], d.draw[2]];
    same('mesh draw', out.range, range);
    if (problems.length){ fail++; if (fail < 12) console.log('MISMATCH ' + file.split(/[\\/]/).pop() + ' frame ' + d.frame + ' ' + d.material + ': ' + problems.join('; ')); }
    else ok++;
  }
  console.log(file.split(/[\\/]/).pop() + ': ' + ok + '/' + draws.length + ' draws match the ROM');
}
for (const [k, n] of refused) console.log('  refused ' + n + ': ' + k);
process.exit(fail ? 1 : 0);
