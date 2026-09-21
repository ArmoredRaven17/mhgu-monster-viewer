// The attack-clip effects, headless: every motion of a monster's CLIP_EFFECTS schedule played through the same
// EffectSchedule the viewer runs (its PSL walk, the unit passes, the draw), on the shipped image pages, strict.
// Each motion plays twice through (so its loop is walked), then the next motion starts (a motion change).
//
//   node dev/effect-clip-soak.mjs <monster> [motion name ...] [--trace]
//
// Reports, per motion, the requests started, how many were stopped and by what time, the most running at once,
// and the first refusal (Unverified) if any. --trace prints, per frame, each live request's key, its core state
// (+0x30: 0 new, 1 running, 2 stopping, 3 done), its end mode (+0xca) and its effects' draw count.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EffectHost } from '../docs/render/rom/effect/host.js';
import { EffectSchedule } from '../docs/render/rom/effect/schedule.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const docs = join(HERE, '..', 'docs');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const trace = process.argv.includes('--trace');
const [monster, ...only] = args;

// CLIP_EFFECTS out of render/monster.js (which imports three.js, so it is not loaded as a module here)
function clipEffects(){
  const src = readFileSync(join(docs, 'render', 'monster.js'), 'utf8');
  const a = src.indexOf('export const CLIP_EFFECTS = {');
  const b = src.indexOf('\n};', a);
  return Function('return ' + src.slice(a + 'export const CLIP_EFFECTS = '.length, b + 2))();
}
const schedule0 = clipEffects()[monster];
if (!schedule0) { console.log('no CLIP_EFFECTS for ' + monster); process.exit(1); }

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
// The parent as the viewer builds it: the viewer's own joint array read from its host memory (efx/joints/
// <monster>_viewer_rest.json, what the recorder replays too) -- a parent without the records' root joints takes
// another path through the placement (0x31d16c) than the viewer does.
const jointsFile = join(HERE, '..', '..', 'efx', 'joints', monster + '_viewer_rest.json');
let parent;
if (existsSync(jointsFile)){
  const jf = JSON.parse(readFileSync(jointsFile, 'utf8'));
  parent = host.createParent(jf.jointList);
  host.setParentScale(parent, jf.unit.scale);
  for (const j of jf.jointList) host.setJointMatrix(parent, j, jf.joints[j]);
} else {
  const rootOf = p => { const b = hex(p); const j = b[0x32] | (b[0x33] << 8); return j === 0xffff ? -1 : j; };
  const joints = [...new Set([...def.effects.flatMap(e => e.joints), ...def.effects.filter(e => e.record).map(e => rootOf(e.record.payload)).filter(j => j >= 0)])];
  parent = host.createParent(joints);
  host.setParentScale(parent, 1);
  joints.forEach((j, k) => host.setJointMatrix(parent, j, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 20 * k, 150, -25, 1]));
  console.log('(no ' + jointsFile + ': joints ' + joints.join(',') + ' at stand-in positions)');
}
const schedule = new EffectSchedule(host, parent, owners.map((owner, i) => ({ owner, def: def.effects[i] })), false);
// the monster's shells (render/shells.js) as live.js runs them, on the same joints (a pose at rest, not the clip's)
if (existsSync(jointsFile)){
  const jf = JSON.parse(readFileSync(jointsFile, 'utf8'));
  schedule.useShells(monster, gid => jf.joints[gid] ? jf.joints[gid].map(Math.fround) : null);
}

const m = host.m;
const liveReport = () => schedule.entries.flatMap(e => e.requests.map(q => {
  const c = q.core;
  let draws = 0;
  return { key: e.def.record.key, state: m.u8(c + 0x30), mode: m.u8(c + 0xca), effects: q.effects().length, q };
}));

const names = only.length ? only : Object.keys(schedule0);
let f = 0;
try {
  for (const name of names){
    const motion = schedule0[name];
    if (!motion){ console.log(name + ': not in CLIP_EFFECTS'); continue; }
    const startsBefore = schedule.starts;
    const stopAt = new Map();              // request -> frame it went to state 2
    let peak = 0, prims = 0, models = 0;
    const total = 2 * (motion.frames - 1);
    for (let k = 0; k <= total + 1; k++){
      const frame = k % (motion.frames - 1);  // the clip loops back to its first frame
      schedule.setClip(monster + '|' + (name.match(/^L(\d+) /) || [0, ''])[1] + '|' + name.replace(/^L\d+ /, ''), frame, motion, 0);
      schedule.step();
      const d = host.drawFrame(schedule.effects());
      prims += d.prims.length; models += d.models.length;
      const live = liveReport();
      for (const r of live) if (r.state === 2 && !stopAt.has(r.q)) stopAt.set(r.q, k);
      peak = Math.max(peak, schedule.running);
      if (trace) console.log(name + ' f' + k + ' (clip ' + frame + '): ' + live.map(r => r.key + ':s' + r.state + 'm' + r.mode + 'e' + r.effects).join(' '));
      f++;
    }
    console.log(name + ': ' + (schedule.starts - startsBefore) + ' starts, ' + stopAt.size + ' stopped (at ' +
      [...stopAt.values()].join(',') + '), at most ' + peak + ' running, ' + prims + ' prim / ' + models + ' model draws; ' +
      schedule.running + ' still running into the next motion');
  }
  // a last motion change with no clip: everything is told the motion is over and runs out
  schedule.setClip(null, 0, null, 0);
  let g = 0;
  for (; g < 3000 && schedule.running; g++){ schedule.step(); host.drawFrame(schedule.effects()); f++; }
  console.log('after the last motion: ' + (schedule.running ? schedule.running + ' still running after 3000 frames' : 'all finished in ' + g + ' frames'));
} catch (e){
  console.log("STOPPED at step " + f + ": " + (e && e.message || e)); if (process.env.SOAK_STACK) console.log(e && e.stack);
  process.exit(1);
}
