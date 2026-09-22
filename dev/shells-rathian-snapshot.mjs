// Rathian's shells (em001_00) in render/shells.js: a step-by-step regression snapshot, the counterpart of
// dev/shells-savage-snapshot.mjs and dev/shells-narga-snapshot.mjs. Every shell path Rathian has -- the fireballs of every
// action and their tired twins (L2 Motion[5] / [18], L4 Motion[8] / [16], blend partners included), the landings' fire,
// hit volumes, explosion timer and explosions, the breath puffs by rank, the frame-tested landing dust, the hover dust's
// pulse (input.stepCount) with and without the (4, 0x15) turn named, the hit-slot life -- driven through stepShells over
// several thousand steps with the inputs render/rom/effect/schedule.js passes, and every step's whole output written as
// one canonical line.
//
//   node dev/shells-rathian-snapshot.mjs                 compare against the embedded digest
//   node dev/shells-rathian-snapshot.mjs --write <file>  write the canonical lines (a baseline)
//   node dev/shells-rathian-snapshot.mjs --compare <file> compare line by line with a baseline, first difference shown
//
// The digest was recorded from render/shells.js as committed in f3270ea (Rathian, before her siblings' shells), so a later
// edit to the shared code -- base00 / base01 / base11, the spawners, the dust, the step -- that changes anything Rathian
// does shows here. Keys an output lacks, and empty output lists, are not written, so a new empty list or unset field is
// not a difference; any value is.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createShellState, stepShells } from '../docs/render/shells.js';

const f = Math.fround;
// sha256 of the canonical text, recorded from render/shells.js at f3270ea (2026-09-22, before Gold Rathian / Dreadqueen)
// (7650 steps, 67 with a spawn: fireballs of modes 0..8 with their landings' fire, hit volumes, explosion timers and
// explosions; the twins' hit volumes; puffs 44..46 and ranks 1 / 3's modes 31..33; dust modes 13 / 14 / 20 by frame and
// by the pulse; 3 refused: no floor, no owner position, no facing)
const BASELINE_SHA256 = '8f0ba928324710976028103c12c8d9393c64af990bf59bbe2cdd11848ba34d49';

// segments: list, clip, steps, frame(i), loopStart, variant | action, yaw / ox / oz (owner words), pos (owner), target,
// floor (undefined = none), rank, hitLife, tired (the variant from the tired list is the segment's own), dead (effect
// handles die on a pattern), noOwner / noPos, stepBase (the step count's offset)
const SEGMENTS = [
  { list: '0', clip: 'Motion[1]', steps: 30, frame: i => i, floor: 0 },
  // the fireballs: every action once, then the twins; floors, facings and positions varied
  { list: '2', clip: 'Motion[5]', steps: 420, frame: i => i, variant: '7:0x02', yaw: 0, pos: [0, 0, 0], target: [0, 0, 6300], floor: 0 },
  { list: '2', clip: 'Motion[15]', steps: 420, frame: i => i, variant: '7:0x02', yaw: 0x3000, pos: [300, 0, -200], target: [4755, 0, 4255], floor: 0, dead: true },
  { list: '2', clip: 'Motion[5]', steps: 300, frame: i => f(i * 0.97), variant: '7:0x0f', yaw: 0x1000, oz: 0x100, pos: [0, 0, 0], floor: 0 },
  { list: '2', clip: 'Motion[18]', steps: 420, frame: i => i, variant: '7:0x0a', yaw: 0x1800, pos: [0, 0, 0], y5c: 12.5, target: [2409, 0, 5820], floor: 0 },
  { list: '2', clip: 'Motion[17]', steps: 420, frame: i => i, variant: '7:0x0a', yaw: 0, pos: [0, 0, 0], target: [0, 1200, 900], floor: 150.5 },
  { list: '2', clip: 'Motion[18]', steps: 200, frame: i => i, variant: '7:0x0b', yaw: 0x2400, pos: [40, 0, 40], floor: 0 },
  { list: '4', clip: 'Motion[8]', steps: 600, frame: i => i, variant: '7:0x08', yaw: 0xc000, pos: [-50, 0, 80], target: [-6350, 0, 80], floor: 0, hitLife: true },
  { list: '4', clip: 'Motion[53]', steps: 600, frame: i => f(i * 1.13 + 0.25), variant: '7:0x6b', yaw: 0x0800, pos: [100, 20, 100], target: [715, 0, 6370], floor: 0 },
  { list: '4', clip: 'Motion[8]', steps: 200, frame: i => i, variant: '7:0x22', yaw: 0x2000, ox: 0xff00, oz: 0x800, pos: [0, 0, 0], floor: 0 },
  { list: '4', clip: 'Motion[54]', steps: 200, frame: i => i, variant: '7:0x6c', yaw: 0x6000, pos: [0, 0, 0], floor: 0, hitLife: true },
  { list: '4', clip: 'Motion[16]', steps: 360, frame: i => i, variant: '7:0x3a', yaw: 0, pos: [0, 0, 0], target: [0, 0, 6300], floor: 0 },
  { list: '4', clip: 'Motion[16]', steps: 360, frame: i => i, variant: '7:0x47', yaw: 0x2000, pos: [0, 0, 0], target: [4455, -40, 4455], floor: -40, hitLife: true, dead: true },
  // the breath puffs: rank 5 (G, default), rank 3 (modes 31..33, nothing drawn), (7, 0x76) (no shell)
  { list: '4', clip: 'Motion[65]', steps: 120, frame: i => i, variant: '7:0x77', yaw: 0x3000, pos: [0, 0, 0], floor: 0 },
  { list: '4', clip: 'Motion[65]', steps: 120, frame: i => i, variant: '7:0x7b', yaw: 0x3000, pos: [0, 0, 0], floor: 0, rank: 3 },
  { list: '4', clip: 'Motion[65]', steps: 120, frame: i => i, variant: '7:0x77', yaw: 0x0100, pos: [0, 0, 0], floor: 0, hitLife: true },
  { list: '4', clip: 'Motion[65]', steps: 100, frame: i => i, variant: '7:0x76', yaw: 0, pos: [0, 0, 0], floor: 0 },
  // the frame-tested landing dust
  { list: '1', clip: 'Motion[4]', steps: 40, frame: i => i, yaw: 0x2000, pos: [10, 5, -20], floor: 0 },
  { list: '1', clip: 'Motion[5]', steps: 80, frame: i => i, yaw: 0x4321, pos: [-300, 250, 60], floor: 0, hitLife: true },
  { list: '1', clip: 'Motion[14]', steps: 80, frame: i => i, yaw: 0x9000, pos: [55, 120, 66], floor: 0, size: [1.2, 1.0], baseScale: 1.5 },
  { list: '4', clip: 'Motion[9]', steps: 140, frame: i => i, yaw: 0x7000, pos: [0, 0, 0], floor: 0 },
  { list: '4', clip: 'Motion[17]', steps: 40, frame: i => i, yaw: 0x1234, pos: [0, 0, 0], floor: 0 },
  { list: '0', clip: 'Motion[24]', steps: 40, frame: i => i, yaw: 0, pos: [0, 1000, 0], floor: 0 },
  // the hover dust: the pulse on every 100th step; (4, 0x15) named skips it on L1 M2 / M11 / M12; L2 M12 never
  { list: '1', clip: 'Motion[1]', steps: 260, frame: i => i % 120, loopStart: 0, yaw: 0x9000, pos: [55, 120, 66], floor: 0, size: [1.2, 1.0], baseScale: 1.5 },
  { list: '1', clip: 'Motion[2]', steps: 230, frame: i => i, yaw: 0x0400, pos: [0, 0, 0], floor: 0, hitLife: true },
  { list: '1', clip: 'Motion[11]', steps: 230, frame: i => i, variant: '4:0x15', yaw: 0, pos: [0, 0, 0], floor: 0 },
  { list: '1', clip: 'Motion[12]', steps: 230, frame: i => i, variant: '4:0x04', yaw: 0x5000, pos: [0, 0, 0], floor: 0 },
  { list: '2', clip: 'Motion[12]', steps: 230, frame: i => i, yaw: 0x7000, pos: [10, 5, -20], floor: 0 },
  // refusals: no floor (fireball), no owner position (aimed fireball, dust), no facing
  { list: '2', clip: 'Motion[5]', steps: 90, frame: i => i, variant: '7:0x02', yaw: 0, pos: [0, 0, 0], target: [0, 0, 6300] },
  { list: '2', clip: 'Motion[5]', steps: 90, frame: i => i, variant: '7:0x02', yaw: 0, noPos: true, target: [0, 0, 6300], floor: 0 },
  { list: '1', clip: 'Motion[4]', steps: 10, frame: i => i, noOwner: true, pos: [0, 0, 0], floor: 0 },
  // a fireball in flight across a clip change, a replay, and no clip
  { list: '4', clip: 'Motion[16]', steps: 130, frame: i => i, variant: '7:0x3a', yaw: 0x9000, pos: [0, 0, 0], target: [0, 0, -6300], floor: 0 },
  { list: '4', clip: 'Motion[7]', steps: 200, frame: i => i, yaw: 0x9000, pos: [0, 0, 0], floor: 0 },
  { list: '2', clip: 'Motion[5]', steps: 300, frame: i => i < 150 ? i : i - 149, variant: '7:0x02', yaw: 0x0200, pos: [0, 0, 0], target: [0, 0, 6300], floor: 0 },
  { clip: null, steps: 240, frame: () => 0, floor: 0 },
];

// joint matrices that turn and move with the step, float32, game convention (rows = axes, row 3 = translation)
function joint(gid, step){
  const a = step * 0.012 + gid * 0.5, b = 0.22 * Math.sin(step * 0.045 + gid), s = 1.0 + 0.07 * Math.sin(step * 0.0025 + gid);
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const x = [ca, 0, -sa], y = [sa * sb, cb, ca * sb], z = [sa * cb, -sb, ca * cb];
  const t = [90 * Math.sin(step * 0.011) + gid * 7, 420 + 25 * Math.cos(step * 0.025) + gid * 9, 330 + step * 0.03 - gid * 2];
  return [...x.map(v => f(v * s)), 0, ...y.map(v => f(v * s)), 0, ...z.map(v => f(v * s)), 0, f(t[0]), f(t[1]), f(t[2]), 1];
}

// ---- the canonical text (as the Savage snapshot writes it) --------------------------------------------------------------
const numOut = x => Object.is(x, -0) ? '-0' : Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Inf' : x === -Infinity ? '-Inf' : x;
function canon(v){
  if (typeof v === 'number') return numOut(v);
  if (typeof v === 'function') return '<fn>';
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object'){
    const o = {};
    for (const k of Object.keys(v).sort()){
      if (v[k] === undefined) continue;
      o[k] = canon(v[k]);
    }
    return o;
  }
  return v;
}
function lineOf(step, out){
  const o = {};
  for (const k of Object.keys(out).sort()){
    const L = out[k];
    if (!Array.isArray(L) || !L.length) continue;
    if (k === 'started') o[k] = L.map(e => ({ shell: e.shell.id, start: canon(e.start) }));
    else if (k === 'created') o[k] = L.map(e => ({ shell: e.shell.id, create: canon(e.create) }));
    else if (k === 'refused') o[k] = L.map(e => canon(e));
    else if (k === 'alive') o[k] = L.map(canon);
    else o[k] = L.map(S => (S && typeof S === 'object' && 'id' in S) ? S.id : canon(S));
  }
  return step + ' ' + JSON.stringify(o);
}

export function drive(monId = 'em001_00'){
  const st = createShellState(monId);
  const lines = [];
  let step = 0;
  for (const seg of SEGMENTS){
    for (let i = 0; i < seg.steps; i++, step++){
      const k = step;
      const J = gid => (gid === 0 || gid === 3 || gid === 4) ? joint(gid, k) : null;
      const T = seg.target, P = seg.pos;
      const input = { monId, list: seg.list || '0', clip: seg.clip, frame: seg.clip ? seg.frame(i) : 0,
                      loopStart: seg.loopStart != null ? seg.loopStart : null, joints: J, rage: false,
                      rock: { variant: seg.variant || null, target: T ? { x: T[0], y: T[1], z: T[2] } : null, floorY: seg.floor },
                      owner: seg.noOwner ? undefined : { x: seg.ox || 0, y: seg.yaw || 0, z: seg.oz || 0 },
                      ownerPos: seg.noPos || !P ? undefined : { x: P[0], y: P[1], z: P[2] },
                      stepCount: step + 1,
                      effectAlive: (S, param) => !(seg.dead && ((k + S.id * 11 + param * 5) % 43 === 0)) };
      if (seg.size) input.size = seg.size;
      if (seg.baseScale) input.baseScale = seg.baseScale;
      if (seg.y5c) input.y5c = seg.y5c;
      if (seg.rank) input.rank = seg.rank;
      if (seg.hitLife) input.hitLife = true;
      const out = stepShells(st, input);
      lines.push(lineOf(step, out));
    }
  }
  return lines;
}

// ---- run -------------------------------------------------------------------------------------------------------------
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('dev/shells-rathian-snapshot.mjs');
if (isMain){
  const lines = drive();
  const text = lines.join('\n') + '\n';
  const sha = createHash('sha256').update(text).digest('hex');
  const spawns = lines.filter(l => l.includes('"spawned"')).length;
  const refused = lines.filter(l => l.includes('"refused":[')).length;
  const w = process.argv.indexOf('--write'), c = process.argv.indexOf('--compare');
  console.log(`${lines.length} steps, ${spawns} with a spawn, ${refused} with a refusal, sha256 ${sha}`);
  if (w > 0){
    writeFileSync(process.argv[w + 1], text);
    console.log('wrote ' + process.argv[w + 1]);
  } else if (c > 0){
    const base = readFileSync(process.argv[c + 1], 'utf8').split('\n');
    const i = lines.findIndex((x, j) => x !== base[j]);
    const same = i < 0 && base.length === lines.length + 1;
    console.log((same ? 'PASS' : 'FAIL') + ` Rathian shells step for step against ${process.argv[c + 1]} (${lines.length} steps)` +
                (same ? '' : `\n  first difference at step ${i}:\n  now  ${(lines[i] || '').slice(0, 600)}\n  base ${(base[i] || '').slice(0, 600)}`));
    process.exit(same ? 0 : 1);
  } else if (BASELINE_SHA256){
    const same = sha === BASELINE_SHA256;
    console.log((same ? 'PASS' : 'FAIL') + ' Rathian shells step for step against the embedded baseline digest');
    process.exit(same ? 0 : 1);
  } else console.log('no embedded baseline digest; run with --write / --compare');
}
