// replay086.mjs -- Valstrax's gap-D rows replayed through a PATCHED COPY of render/shells.js (gapD/render/shells.js, made by
// patch086.py from the live file; the original copy beside it, shells.orig.js, is the control). For each case: the clip stepped
// frame by frame with the action named (input.rock.variant), and every shell made, every effect record started, every refusal.
//   node replay086.mjs
// Exit 1 when an expectation fails.
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const P = await import(pathToFileURL(join(HERE, 'render', 'shells.js')).href);
const O = await import(pathToFileURL(join(HERE, 'render', 'shells.orig.js')).href);
const f = Math.fround;
let fails = 0;
const J = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1].map(f);
function run(S, c){
  const st = S.createShellState('em086_00');
  const made = [], starts = [], refused = [];
  for (let fr = 0; fr <= c.len + 120; fr++){
    const frame = Math.min(fr, c.len);
    const out = S.stepShells(st, { monId: 'em086_00', list: c.list, clip: c.clip, frame, joints: J,
      rock: { variant: c.variant, target: { x: 900, y: 40, z: 2400 }, floorY: c.floorY },
      owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: c.y, z: -80.75 }, ground: c.ground,
      size: [1.0, 1.0], baseScale: 1.0, hitLife: true, rank: 5 });
    for (const s of out.spawned){
      made.push({ frame, shell: s.shell, mode: s.modeIndex, pos: s.position && s.position.map(v => +v.toFixed(2)) });
      if (s.start) starts.push({ frame, shell: s.shell + ' ' + s.modeIndex, list: s.start.listId, key: s.start.key, at: 'init' });   // the init's own start (S.start)
    }
    for (const { shell, start } of out.started) starts.push({ frame, shell: shell.shell + ' ' + shell.modeIndex, list: start.listId, key: start.key });
    for (const r of out.refused) refused.push(r);
  }
  return { made, starts, refused };
}
const CASES = [
  { name: '(7, 0x33) L2 M73 f2 -> sp_01 10, u 140', list: '2', clip: 'Motion[73]', variant: '7:0x33', len: 215, y: 15.25, ground: 0.0, floorY: 0.0,
    want: r => r.made.length === 1 && r.made[0].mode === 10 && r.starts.some(s => s.list === 0 && s.key === 140) },
  { name: '(3, 4) L0 M36 start -> sp_01 6, c 30', list: '0', clip: 'Motion[36]', variant: '3:0x04', len: 77, y: 15.25, ground: 0.0, floorY: 0.0,
    want: r => r.made.length === 1 && r.made[0].mode === 6 && r.starts.some(s => s.list === 1 && s.key === 30) },
  { name: 'CONTROL (3, 4) 901 over the ground -> no shell (0x1096b04)', list: '0', clip: 'Motion[36]', variant: '3:0x04', len: 77, y: 901.0, ground: 0.0, floorY: 0.0,
    want: r => r.made.length === 0 && r.refused.length === 0 },
  { name: 'CONTROL (3, 4) at 900 over the ground -> the shell (<=)', list: '0', clip: 'Motion[36]', variant: '3:0x04', len: 77, y: 900.0, ground: 0.0, floorY: 0.0,
    want: r => r.made.length === 1 },
  { name: 'CONTROL (3, 4) no ground -> refused by name', list: '0', clip: 'Motion[36]', variant: '3:0x04', len: 77, y: 15.25, ground: undefined, floorY: undefined,
    want: r => r.made.length === 0 && r.refused.some(x => /no ground/.test(x.why)) },
  { name: '(named rows) (3, 0) L1 M2 start -> sp_01 11, u 500', list: '1', clip: 'Motion[2]', variant: '3:0x00', len: 23, y: 15.25, ground: 0.0, floorY: 0.0,
    want: r => r.made.length === 1 && r.made[0].mode === 11 && r.starts.some(s => s.list === 0 && s.key === 500) },
  { name: '(named rows) (13, 1) L1 M2 start -> sp_01 11, u 500', list: '1', clip: 'Motion[2]', variant: '13:0x01', len: 23, y: 15.25, ground: 0.0, floorY: 0.0,
    want: r => r.made.length === 1 && r.made[0].mode === 11 },
  { name: 'REGRESSION (7, 0x34) L2 M71 start -> sp_01 7, u 500 (unchanged row)', list: '2', clip: 'Motion[71]', variant: '7:0x34', len: 23, y: 15.25, ground: 0.0, floorY: 0.0,
    want: r => r.made.length === 1 && r.made[0].mode === 7 },
];
for (const c of CASES){
  const r = run(P, c), o = run(O, c);
  const ok = c.want(r);
  if (!ok) fails++;
  console.log((ok ? 'PASS ' : 'FAIL ') + c.name);
  console.log('   patched: made ' + JSON.stringify(r.made) + ' starts ' + JSON.stringify(r.starts) + (r.refused.length ? ' refused ' + JSON.stringify(r.refused) : ''));
  console.log('   original: made ' + o.made.length + ', starts ' + o.starts.length + (o.refused.length ? ', refused ' + JSON.stringify(o.refused[0]) : ''));
}
console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
