import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const HM = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/hyper-motion.json', 'utf8'));
const f = Math.fround, mat = t => [1,0,0,0,0,1,0,0,0,0,1,0,t[0],t[1],t[2],1].map(f), J = () => mat([0,300,300]);
function run(mon, list, clip, variant, len, hyper){
  const st = S.createShellState(mon), made = [], ref = new Set();
  for (let i = 0; i <= len; i++){
    const out = S.stepShells(st, { monId: mon, list, clip, frame: i, joints: J, rock: { variant, floorY: 0.0, target: { x: 0, y: 0, z: 1500 } },
      owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1.0, 1.0], baseScale: 1.0, hitLife: true, rank: 5, ownerMatrix: mat([0, 0, 0]), hyperShells: hyper });
    for (const sh of out.spawned) made.push(sh);
    for (const r of out.refused) ref.add((r.why || JSON.stringify(r)).slice(0, 140));
  }
  return { made, ref: [...ref].slice(0, 3) };
}
const sig = r => r.made.map(s => (s.shell === 'beam' ? s.type.id : s.shell + '/' + s.modeIndex) + ':' + (s.unitScale == null ? '-' : (+s.unitScale).toFixed(3)) + (s.hyper ? '*' + s.hyper.id : '')).join(' ') + (r.ref.length ? ' REF ' + r.ref.join(' | ') : '');
const cases = [
  ['em049_00', '2', 'Motion[4]', '7:0x1f', 200, 'normal', [1, 2]],
  ['em023_00', '2', 'Motion[20]', '7:0x34', 200, 'g', [3, 1]],
  ['em067_00', '4', 'Motion[59]', '7:0x1b', 120, 'normal', [3, 1]],
  ['em043_00', '2', 'Motion[25]', '7:0x06', 200, 'normal', [1, 2]],
  ['em043_00', '2', 'Motion[41]', '7:0x93', 200, 'g', [1, 2]],
];
for (const [mon, l, c, v, n, side, ids] of cases){
  const sh = HM[mon][side] && HM[mon][side].shells;
  console.log(mon, c, v, 'off', sig(run(mon, l, c, v, n, undefined)));
  console.log(mon, c, v, 'on ', JSON.stringify(ids), side, sig(run(mon, l, c, v, n, { ids, shells: sh })));
}
