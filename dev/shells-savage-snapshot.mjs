// Savage Deviljho's shells (em043_05) in render/shells.js: a step-by-step regression snapshot. Every shell Savage has --
// the breath bodies (shell04, shell55) and the rocks (shell00, shell54) -- driven through stepShells over its shell
// motions for several thousand steps, with the inputs render/rom/effect/schedule.js passes (bare clip name, the frame
// at 60/s, loopStart, the game's joint matrices, rage, rock = { variant, target, floorY }, owner = { x: 0, y: facing,
// z: 0 }, effectAlive), and every step's whole output written as one canonical line.
//
//   node dev/shells-savage-snapshot.mjs                 compare against the embedded digest
//   node dev/shells-savage-snapshot.mjs --write <file>  write the canonical lines (a baseline)
//   node dev/shells-savage-snapshot.mjs --compare <file> compare line by line with a baseline, first difference shown
//
// The drive is synthetic but deterministic: joint matrices that turn and move every step (float32), fractional
// frames, clip changes, replays, a split motion's loop, calm and enraged picks, the three rocks with changing targets
// and facings, and effect handles that die on a fixed pattern in some segments. Keys an output lacks, and empty
// output lists, are not written, so a new empty list or unset field is not a difference; any value is.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createShellState, stepShells, ROCK_VARIANTS } from '../docs/render/shells.js';

const f = Math.fround;
// sha256 of the canonical text, recorded from render/shells.js before the Nargacuga spike work (2026-09-21): 5500 steps,
// 21 spawns (shell04 modes 1 / 2 on M25 / M26 calm and enraged, replayed and looped; shell55 on M41 / M42; shell00
// modes 0 / 8 and shell54 mode 0 on M23 / M24)
const BASELINE_SHA256 = '758dd4dd39ee9a8ca19aefff14fd8e4d5493fd020a07448dc872a555dce0601f';

// ---- the drive -------------------------------------------------------------------------------------------------------
// segments: clip (L2 bare name), steps, frame(step in segment) -> frame, rage, loopStart, dead (effect handles die on a
// pattern), rock (variant index or null), yaw (owner facing u16), target, floor
const SEGMENTS = [
  { clip: 'Motion[1]', steps: 40, frame: i => i },
  { clip: 'Motion[25]', steps: 260, frame: i => i, rage: false },
  { clip: 'Motion[25]', steps: 260, frame: i => i, rage: true },
  { clip: 'Motion[26]', steps: 270, frame: i => f(i * 0.97), rage: false },
  { clip: 'Motion[26]', steps: 240, frame: i => f(i * 1.13 + 0.25), rage: true, dead: true },
  { clip: 'Motion[41]', steps: 160, frame: i => i },
  { clip: 'Motion[42]', steps: 160, frame: i => f(i + 0.0004), dead: true },
  { clip: 'Motion[1]', steps: 30, frame: i => i },
  // a replay of a clip that does not loop: the frame goes back without loopStart (the same action issued again)
  { clip: 'Motion[26]', steps: 150, frame: i => i < 140 ? i : i - 139, rage: false },
  { clip: 'Motion[26]', steps: 150, frame: i => 141 + i, rage: false },
  // a split motion's _loop: loopStart 100, the frame wraps from 219 back to 100
  { clip: 'Motion[25]', steps: 300, frame: i => i < 220 ? i : 100 + (i - 220), loopStart: 100, rage: false },
  { clip: 'Motion[25]', steps: 140, frame: i => 120 + i * 0.5, loopStart: 100, rage: true, dead: true },
  // the rocks: each play takes the next variant; target ahead of the facing, floor 0 (then 150.5)
  { clip: 'Motion[24]', steps: 380, frame: i => i, rock: 0, yaw: 0, target: [0, 0, 2100], floor: 0 },
  { clip: 'Motion[23]', steps: 380, frame: i => i, rock: 1, yaw: 0x2000, target: [1484.9, 0, 1484.9], floor: 0 },
  { clip: 'Motion[24]', steps: 380, frame: i => f(i * 1.01), rock: 2, yaw: 0xc000, target: [-2100, 0, 0], floor: 0 },
  { clip: 'Motion[23]', steps: 300, frame: i => i, rock: 0, yaw: 0x1c00, target: [300, 0, 2400], floor: 150.5, dead: true },
  { clip: 'Motion[24]', steps: 300, frame: i => i, rock: 2, yaw: 0x3000, target: [0, 0, 2000], floor: 150.5 },
  // a rock in the air across a clip change, then the breath
  { clip: 'Motion[23]', steps: 140, frame: i => i, rock: 1, yaw: 0x9000, target: [0, 0, 2600], floor: 0 },
  { clip: 'Motion[25]', steps: 300, frame: i => i, rage: true, rock: 1, yaw: 0x9000, target: [0, 0, 2600], floor: 0 },
  { clip: 'Motion[26]', steps: 300, frame: i => i, rage: false, rock: 0, yaw: 0x9000, target: [0, 0, 2600], floor: -1e9 },
  { clip: null, steps: 60, frame: () => 0 },
  { clip: 'Motion[24]', steps: 400, frame: i => i, rock: 1, yaw: 0x0400, target: [0, 900, 800], floor: 0 },
  { clip: 'Motion[23]', steps: 400, frame: i => i, rock: 2, yaw: 0xf000, target: [200, 0, 2100], floor: -1e9 },
];

// joint matrices that turn and move with the step, float32, game convention (rows = axes, row 3 = translation)
function joint(gid, step){
  const a = step * 0.013 + gid * 0.7, b = 0.2 * Math.sin(step * 0.05 + gid), s = gid === 4 ? 1.0 : 1.0 + 0.1 * Math.sin(step * 0.002);
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const x = [ca, 0, -sa], y = [sa * sb, cb, ca * sb], z = [sa * cb, -sb, ca * cb];
  const t = [100 * Math.sin(step * 0.01) + gid * 10, 300 + 20 * Math.cos(step * 0.03) + gid * 5, 400 + step * 0.05 - gid * 3];
  return [...x.map(v => f(v * s)), 0, ...y.map(v => f(v * s)), 0, ...z.map(v => f(v * s)), 0, f(t[0]), f(t[1]), f(t[2]), 1];
}

// ---- the canonical text ----------------------------------------------------------------------------------------------
const numOut = x => Object.is(x, -0) ? '-0' : Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Inf' : x === -Infinity ? '-Inf' : x;
function canon(v, depth = 0){
  if (typeof v === 'number') return numOut(v);
  if (typeof v === 'function') return '<fn>';
  if (Array.isArray(v)) return v.map(x => canon(x, depth + 1));
  if (v && typeof v === 'object'){
    const o = {};
    for (const k of Object.keys(v).sort()){
      if (v[k] === undefined) continue;
      o[k] = canon(v[k], depth + 1);
    }
    return o;
  }
  return v;
}
const shellOf = S => canon(S);
function lineOf(step, out){
  const o = {};
  for (const k of Object.keys(out).sort()){
    const L = out[k];
    if (!Array.isArray(L) || !L.length) continue;
    if (k === 'started') o[k] = L.map(e => ({ shell: e.shell.id, start: canon(e.start) }));
    else if (k === 'refused') o[k] = L.map(e => canon(e));
    else if (k === 'alive') o[k] = L.map(shellOf);
    else o[k] = L.map(S => (S && typeof S === 'object' && 'id' in S) ? S.id : canon(S));
  }
  return step + ' ' + JSON.stringify(o);
}

export function drive(){
  const st = createShellState('em043_05');
  const lines = [];
  let step = 0, plays = 0;
  for (const seg of SEGMENTS){
    if (seg.rock != null) plays++;
    for (let i = 0; i < seg.steps; i++, step++){
      const k = step;
      const J = gid => (gid === 0 || gid === 3 || gid === 4) ? joint(gid, k) : null;
      const rock = seg.rock == null ? { variant: ROCK_VARIANTS[plays % 3], target: { x: 0, y: 0, z: 2100 }, floorY: 0 }
                                    : { variant: ROCK_VARIANTS[seg.rock], target: { x: seg.target[0], y: seg.target[1], z: seg.target[2] }, floorY: seg.floor };
      const input = { monId: 'em043_05', list: '2', clip: seg.clip, frame: seg.clip ? seg.frame(i) : 0,
                      loopStart: seg.loopStart != null ? seg.loopStart : null, joints: J, rage: !!seg.rage,
                      rock, owner: { x: 0, y: seg.yaw || 0, z: 0 },
                      effectAlive: (S, param) => !(seg.dead && ((k + S.id * 5 + param * 3) % 37 === 0)) };
      const out = stepShells(st, input);
      lines.push(lineOf(step, out));
    }
  }
  return lines;
}

// ---- run -------------------------------------------------------------------------------------------------------------
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('dev/shells-savage-snapshot.mjs');
if (isMain){
  const lines = drive();
  const text = lines.join('\n') + '\n';
  const sha = createHash('sha256').update(text).digest('hex');
  const spawns = lines.filter(l => l.includes('"spawned"')).length;
  const w = process.argv.indexOf('--write'), c = process.argv.indexOf('--compare');
  console.log(`${lines.length} steps, ${spawns} with a spawn, sha256 ${sha}`);
  if (w > 0){
    writeFileSync(process.argv[w + 1], text);
    console.log('wrote ' + process.argv[w + 1]);
  } else if (c > 0){
    const base = readFileSync(process.argv[c + 1], 'utf8').split('\n');
    const i = lines.findIndex((x, j) => x !== base[j]);
    const same = i < 0 && base.length === lines.length + 1;
    console.log((same ? 'PASS' : 'FAIL') + ` Savage shells step for step against ${process.argv[c + 1]} (${lines.length} steps)` +
                (same ? '' : `\n  first difference at step ${i}:\n  now  ${(lines[i] || '').slice(0, 600)}\n  base ${(base[i] || '').slice(0, 600)}`));
    process.exit(same ? 0 : 1);
  } else if (BASELINE_SHA256){
    const same = sha === BASELINE_SHA256;
    console.log((same ? 'PASS' : 'FAIL') + ' Savage shells step for step against the embedded baseline digest');
    process.exit(same ? 0 : 1);
  } else console.log('no embedded baseline digest; run with --write / --compare');
}
