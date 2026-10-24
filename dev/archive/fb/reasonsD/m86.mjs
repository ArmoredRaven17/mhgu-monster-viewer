import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const e = arr.find(x => x.id === 'em084_00');
const L = e.lists.find(l => l.id === '2'); console.log(L.clips.map(c => c.clip + ':' + c.dur).join(' '));
console.log(S.pickVariantsFor('em084_00', '2', 'Motion[86]', {}));
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40; m[13] = 250; m[14] = 150; return m; };
for (const rank of [3, 5]) for (const v of S.pickVariantsFor('em084_00', '2', 'Motion[86]', { rank })){
  const st = S.createShellState('em084_00'); const keys = new Set(), why = new Set();
  for (let fr = 0; fr < 400; fr++){
    const out = S.stepShells(st, { monId: 'em084_00', list: '2', clip: 'Motion[86]', frame: fr, joints: jm, attachedJoints: { left: jm, right: jm },
      rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank, questLevel: 10 });
    for (const s of out.started) s.start && keys.add(s.start.pel + ':' + s.start.key);
    for (const s of out.spawned) s.start && keys.add(s.start.pel + ':' + s.start.key);
    for (const r of out.refused) why.add(JSON.stringify(r).slice(0, 200));
  }
  console.log(rank, v, [...keys], [...why].slice(0, 4));
}
