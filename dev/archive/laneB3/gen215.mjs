// laneB3/gen215.mjs -- a generator-level trace of ONE clip record, headless (lane B3, 2026-10-25).
//
//   node dev/archive/laneB3/gen215.mjs <monster> "<clip>" <key> [frames] [--all-bits]
//   e.g. node dev/archive/laneB3/gen215.mjs em084_00 "L3 Motion[63]" 215 600
//
// Plays the clip through the viewer's own EffectSchedule (render/rom/effect/schedule.js, as dev/effect-clip-soak.mjs
// builds it: the shipped ROM pages, the viewer's rest joints efx/joints/<monster>_viewer_rest.json), with ONLY the
// record's own bit row kept (unless --all-bits), and prints per frame for each unit of that record: the unit word
// +0xc, and for each generator (+0x1f0 list): its vtable, the emission mode (+0x40 bits 8-11: 1 once, else periodic),
// the emission state +0x47, the countdown +0xe2, the frames since start +0x88, the spawn counter +0x198, the live
// particle count (+0xb0 chain), the node block's count / start / interval / period words (+0x48 / +0x4c / +0x50 /
// +0x54) and the node instance's start delay (+0x11c) times the owner's count scale (+0x1fc), and what the host's
// drawFrame emits for the record's units alone (prims / gpu / models).
// Control: run it on a record that draws on the same file (em084_00 u 213, L3 M63 bit 5).
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
const [monster, clipName, keyS, framesS] = args;
const KEY = +keyS;
function clipEffects(){
  const src = readFileSync(join(docs, 'render', 'monster.js'), 'utf8');
  const a = src.indexOf('export const CLIP_EFFECTS = {');
  const b = src.indexOf('\n};', a);
  return Function('return ' + src.slice(a + 'export const CLIP_EFFECTS = '.length, b + 2))();
}
const motion0 = clipEffects()[monster][clipName];
if (!motion0) { console.log('no clip ' + clipName); process.exit(1); }
const motion = allBits ? motion0 : { ...motion0, bits: motion0.bits.filter(b => b.key === KEY) };
console.log('bits kept:', JSON.stringify(motion.bits));
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
const frames = +(framesS || motion.frames);
const L = (clipName.match(/^L(\d+) /) || [0, ''])[1];
for (let k = 0; k < frames; k++){
  const frame = k % (motion.frames - 1);
  schedule.setClip(monster + '|' + L + '|' + clipName.replace(/^L\d+ /, ''), frame, motion, 0);
  globalThis.__LIFELOG.length = 0;
  schedule.step();
  const lifeLog = globalThis.__LIFELOG.slice();
  if (process.env.GEN_ALLLIFE && lifeLog.length) console.log('  f' + k + ' every life step this frame: ' + lifeLog.map(x => JSON.stringify({ gen: (x.gen >>> 0).toString(16), before: x.before, r: x.r, linear: x.linear, freed: x.freed, age: x.age, stack: x.stack })).join(' '));
  host.drawFrame(schedule.effects());
  for (const e of schedule.entries){
    if (!e.def.record || e.def.record.key !== KEY) continue;
    for (const q of e.requests){
      const units = q.effects();
      if (!units.length) continue;
      const d = host.drawFrame(units);
      const parts = [];
      for (const u of units){
        const gs = [];
        for (let g = m.u32(u + 0x1f0) >>> 0, n = 0; g && n < 64; g = m.u32(g + 0xc) >>> 0, n++){
          let np = 0; for (let p = m.u32(g + 0xb0) >>> 0; p && np < 100000; p = m.u32(p + 4) >>> 0) np++;
          const node = m.u32(g + 0x30) >>> 0, inst = m.u32(g + 0x18) >>> 0, owner = m.u32(g + 8) >>> 0;
          gs.push('vt' + h8(m.u32(g)) + ' t' + (m.u8(g + 0x46)) + ' mode' + ((m.u32(g + 0x40) >>> 8) & 0xf) + ' st' + m.u8(g + 0x47) +
            ' cd' + (m.u32(g + 0xe0) >>> 16) + ' age' + m.u32(g + 0x88) + ' spawned' + m.u32(g + 0x198) + ' live' + np +
            ' f10=' + h8(m.u32(g + 0x10)) + ' n48=' + h8(m.u32(node + 0x48)) + ' n4c=' + h8(m.u32(node + 0x4c)) + ' n50=' + h8(m.u32(node + 0x50)) +
            ' n54=' + h8(m.u32(node + 0x54)) + ' delay=' + m.u32(inst + 0x11c) + 'x' + m.f32(owner + 0x1fc) +
            // the life block (gen +0x38 = the row's col2; 0xaea108 spawnLife: +0 fade-in, +4 hold, +8 fade-out, +0xe the high half)
            ' col2=' + [0, 4, 8, 0xc].map(o => h8(m.u32((m.u32(g + 0x38) >>> 0) + o))).join('/') + ' ed=' + h8(m.u8(g + 0xed)));
        }
        parts.push('u+0xc=' + h8(m.u32(u + 0xc)) + ' [' + gs.join(' | ') + ']');
      }
      const mine = new Set(); for (const u of units) for (let g = m.u32(u + 0x1f0) >>> 0, n = 0; g && n < 64; g = m.u32(g + 0xc) >>> 0, n++) mine.add(g);
      const ll = lifeLog.filter(x => mine.has(x.gen >>> 0));
      if (ll.length) console.log('  life steps (slot +4 / +8 / +0xc before; r = 0 frees): ' + ll.map(x => JSON.stringify({ before: x.before, r: x.r, linear: x.linear, age: x.age })).join(' '));
      console.log('f' + k + ' clip ' + frame + ' key ' + KEY + ': draws prim ' + d.prims.length + ' gpu ' + d.gpu.length + ' model ' + d.models.length + ' :: ' + parts.join(' ; '));
    }
  }
}
