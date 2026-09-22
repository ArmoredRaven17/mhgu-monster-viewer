// Nargacuga's shells (em037_00) in render/shells.js: a step-by-step regression snapshot, the counterpart of
// dev/shells-savage-snapshot.mjs. Every spike action Nargacuga has -- the issued ones by variant ('7:0x28' .. '7:0x84',
// pickVariantsFor) and the unread ones forced -- driven through stepShells over its spike clip (L2 Motion[8]) and other
// clips for several thousand steps, with the inputs render/rom/effect/schedule.js passes (bare clip name, the frame at
// 60/s, loopStart, the game's joint matrices, rage, rock = { variant, target, floorY }, owner = { x, y, z }, effectAlive),
// and every step's whole output written as one canonical line.
//
//   node dev/shells-narga-snapshot.mjs                 compare against the embedded digest
//   node dev/shells-narga-snapshot.mjs --write <file>  write the canonical lines (a baseline)
//   node dev/shells-narga-snapshot.mjs --compare <file> compare line by line with a baseline, first difference shown
//
// The digest was recorded from render/shells.js as committed in e37a797 (before the Rathian shell work, 2026-09-22), so
// a later edit to the shared base00 code (the aim, the init, the landing dispatch, the step) that changes anything
// Nargacuga does shows here. The drive is synthetic but deterministic: joint 143 (and 0) turning and moving every step
// (float32, with scale), fractional frames, clip changes mid-flight, a replay, a split motion's loop, every variant with
// targets ahead / above / behind, floors (a plane, higher, none = refused), owner X / Y / Z words past 16 bits, inputs
// missing (refused), forced unread actions, and effect handles that die on a fixed pattern in some segments. Keys an
// output lacks, and empty output lists, are not written, so a new empty list or unset field is not a difference; any
// value is.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createShellState, stepShells } from '../docs/render/shells.js';

const f = Math.fround;
// sha256 of the canonical text, recorded from render/shells.js at e37a797 (2026-09-22, before the Rathian shells)
// (7150 steps, 18 with a spawn: every issued variant, the aimed kinds four times, two forced unread actions, a replay and a
// split motion's loop each throwing twice; 3 refused: no floor, no facing, an aimed kind without a target)
const BASELINE_SHA256 = '3fb62d212419d4a9ca91559ce8ab655386263d93b43b1264f49b014df64a8e32';

const V = ['7:0x28', '7:0x29', '7:0x2a', '7:0x2b', '7:0x2c', '7:0x35', '7:0x3a', '7:0x82', '7:0x84'];
// segments: clip (L2 bare name), steps, frame(i) -> frame, loopStart, variant (or null), action (forced), yaw / ox / oz
// (owner words), target, floor (undefined = none given), dead (effect handles die on a pattern), noOwner, noRock
const SEGMENTS = [
  { clip: 'Motion[1]', steps: 30, frame: i => i, variant: V[0], target: [0, 0, 2100], floor: 0 },
  // every issued variant once, facing and floor varied; spikes fly until they land or time out
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: V[0], yaw: 0, target: [0, 0, 2100], floor: 0 },
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: V[1], yaw: 0x2000, target: [1484.9, 0, 1484.9], floor: 0, dead: true },
  { clip: 'Motion[8]', steps: 460, frame: i => f(i * 0.97), variant: V[2], yaw: 0xc000, target: [-2100, 0, 0], floor: 150.5 },
  { clip: 'Motion[8]', steps: 460, frame: i => f(i * 1.13 + 0.25), variant: V[3], yaw: 0x9000, target: [0, 0, -2100], floor: -40 },
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: V[4], yaw: 0x1c00, ox: 0xff00, oz: 0x800, target: [300, 0, 2400], floor: 0 },
  { clip: 'Motion[8]', steps: 460, frame: i => f(i + 0.0004), variant: V[5], yaw: 0x3000, target: [0, 0, 2000], floor: 0 },
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: V[6], yaw: 0x0400, ox: 0x1f123, target: [200, 0, 2100], floor: 0, dead: true },
  // the aimed kinds: target ahead, above, behind, far
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: V[7], yaw: 0x0800, target: [100, 0, 2100], floor: 0 },
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: V[7], yaw: 0x0800, target: [0, 900, 800], floor: 0 },
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: V[8], yaw: 0xf000, target: [-500, 0, -1800], floor: 0 },
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: V[8], yaw: 0x5000, oz: 0x300, target: [2500, -200, 2500], floor: 0 },
  // forced actions nothing read issues
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: null, action: [7, 0x83], yaw: 0x2400, target: [0, 0, 2100], floor: 0 },
  { clip: 'Motion[8]', steps: 460, frame: i => i, variant: null, action: [7, 0x2f], yaw: 0x6000, target: [0, 0, 2100], floor: 0 },
  // a replay of the clip (the frame goes back without loopStart) and a split motion's loop
  { clip: 'Motion[8]', steps: 200, frame: i => i < 100 ? i : i - 99, variant: V[0], yaw: 0x1000, target: [0, 0, 2100], floor: 0 },
  { clip: 'Motion[8]', steps: 300, frame: i => i < 120 ? i : 30 + (i - 120), loopStart: 30, variant: V[1], yaw: 0x1000, target: [0, 0, 2100], floor: 0 },
  // spikes in the air across a clip change; the wind-up clip; no clip
  { clip: 'Motion[8]', steps: 60, frame: i => i, variant: V[4], yaw: 0x7000, target: [0, 0, 2100], floor: 0 },
  { clip: 'Motion[7]', steps: 200, frame: i => i, variant: V[4], yaw: 0x7000, target: [0, 0, 2100], floor: 0 },
  { clip: null, steps: 60, frame: () => 0 },
  // refused: no floor, no facing, no target for an aimed kind, no rock at all
  { clip: 'Motion[8]', steps: 80, frame: i => i, variant: V[0], yaw: 0, target: [0, 0, 2100] },
  { clip: 'Motion[8]', steps: 80, frame: i => i, variant: V[0], noOwner: true, target: [0, 0, 2100], floor: 0 },
  { clip: 'Motion[8]', steps: 80, frame: i => i, variant: V[7], yaw: 0, target: null, floor: 0 },
  { clip: 'Motion[8]', steps: 80, frame: i => i, noRock: true },
];

// joint matrices that turn and move with the step, float32, game convention (rows = axes, row 3 = translation)
function joint(gid, step){
  const a = step * 0.011 + gid * 0.3, b = 0.25 * Math.sin(step * 0.04 + gid), s = 1.0 + 0.08 * Math.sin(step * 0.003);
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const x = [ca, 0, -sa], y = [sa * sb, cb, ca * sb], z = [sa * cb, -sb, ca * cb];
  const t = [120 * Math.sin(step * 0.01) + gid, 350 + 30 * Math.cos(step * 0.02), 250 + step * 0.04 - gid * 0.5];
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

export function drive(){
  const st = createShellState('em037_00');
  const lines = [];
  let step = 0;
  for (const seg of SEGMENTS){
    for (let i = 0; i < seg.steps; i++, step++){
      const k = step;
      const J = gid => (gid === 0 || gid === 143) ? joint(gid, k) : null;
      const T = seg.target;
      const rock = seg.noRock ? undefined
        : { variant: seg.variant === undefined ? null : seg.variant, target: T ? { x: T[0], y: T[1], z: T[2] } : null,
            floorY: seg.floor };
      const input = { monId: 'em037_00', list: '2', clip: seg.clip, frame: seg.clip ? seg.frame(i) : 0,
                      loopStart: seg.loopStart != null ? seg.loopStart : null, joints: J, rage: false, rock,
                      owner: seg.noOwner ? { x: 0, z: 0 } : { x: seg.ox || 0, y: seg.yaw || 0, z: seg.oz || 0 },
                      effectAlive: (S, param) => !(seg.dead && ((k + S.id * 7 + param * 3) % 41 === 0)) };
      if (seg.action) input.action = seg.action;
      const out = stepShells(st, input);
      lines.push(lineOf(step, out));
    }
  }
  return lines;
}

// ---- run -------------------------------------------------------------------------------------------------------------
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('dev/shells-narga-snapshot.mjs');
if (isMain){
  const lines = drive();
  const text = lines.join('\n') + '\n';
  const sha = createHash('sha256').update(text).digest('hex');
  const spawns = lines.filter(l => l.includes('"spawned"')).length;
  const refused = lines.filter(l => l.includes('"refused"')).length;
  const w = process.argv.indexOf('--write'), c = process.argv.indexOf('--compare');
  console.log(`${lines.length} steps, ${spawns} with a spawn, ${refused} with a refusal, sha256 ${sha}`);
  if (w > 0){
    writeFileSync(process.argv[w + 1], text);
    console.log('wrote ' + process.argv[w + 1]);
  } else if (c > 0){
    const base = readFileSync(process.argv[c + 1], 'utf8').split('\n');
    const i = lines.findIndex((x, j) => x !== base[j]);
    const same = i < 0 && base.length === lines.length + 1;
    console.log((same ? 'PASS' : 'FAIL') + ` Nargacuga shells step for step against ${process.argv[c + 1]} (${lines.length} steps)` +
                (same ? '' : `\n  first difference at step ${i}:\n  now  ${(lines[i] || '').slice(0, 600)}\n  base ${(base[i] || '').slice(0, 600)}`));
    process.exit(same ? 0 : 1);
  } else if (BASELINE_SHA256){
    const same = sha === BASELINE_SHA256;
    console.log((same ? 'PASS' : 'FAIL') + ' Nargacuga shells step for step against the embedded baseline digest');
    process.exit(same ? 0 : 1);
  } else console.log('no embedded baseline digest; run with --write / --compare');
}
