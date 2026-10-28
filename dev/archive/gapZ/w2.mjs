import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const HM = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/hyper-motion.json', 'utf8'));
const f = Math.fround, mat = t => [1,0,0,0,0,1,0,0,0,0,1,0,t[0],t[1],t[2],1].map(f), J = () => mat([0,300,300]);
function run(chain, hyper){
  const st = S.createShellState('em003_00'), made = [];
  const seq = chain ? [...Array.from({ length: 201 }, (_, i) => [i, null]), ...Array.from({ length: 215 }, (_, i) => [40 + i, 40])] : Array.from({ length: 337 }, (_, i) => [i, null]);
  let k = 0;
  for (const [fr, ls] of seq){
    const out = S.stepShells(st, { monId: 'em003_00', list: '2', clip: 'Motion[3]', frame: fr, loopStart: ls, joints: J, rock: { variant: '7:0x4d', floorY: 0.0, target: { x: 0, y: 0, z: 1500 } },
      owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0.0, size: [1, 1], baseScale: 1.0, hitLife: true, rank: 5, hyperShells: hyper });
    for (const sh of out.spawned) made.push([k, sh.modeIndex, sh.wave || 1, sh.unitScale == null ? '-' : (+sh.unitScale).toFixed(2), sh.k ? sh.k.fanDeg : null]);
    k++;
  }
  return made;
}
console.log('plain', JSON.stringify(run(false)));
console.log('chain', JSON.stringify(run(true)));
console.log('chain hyper', JSON.stringify(run(true, { ids: [1, 2], shells: HM.em003_00.normal.shells })));
