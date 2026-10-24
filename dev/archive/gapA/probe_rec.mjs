import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const S = await import(pathToFileURL(join(HERE, 'shells.js')).href);
const f = Math.fround, mat = t => [1,0,0,0,0,1,0,0,0,0,1,0,t[0],t[1],t[2],1].map(f);
for (const [list, clip, variant, n] of [['4', 'Motion[4]', '7:0x50', 40], ['2', 'Motion[2]', '7:0x0e', 100], ['2', 'Motion[7]', '7:0x02', 110]]){
  const st = S.createShellState('em013_02'), J = g => mat(g === 3 ? [0, 600, 400] : [0, 300, 0]);
  const seen = new Map();
  for (let fr = 0; fr <= n; fr++){
    const out = S.stepShells(st, { monId: 'em013_02', list, clip, frame: fr, joints: J, rock: { variant, target: { x: 0, y: 0, z: 3000 }, floorY: 0 },
      owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, size: [1, 1], baseScale: 1, rank: 5, questLevel: 10 });
    for (const sh of out.spawned) seen.set(sh.id, { fr, mode: sh.modeIndex, shell: sh.shell, start: sh.start && [sh.start.list, sh.start.key, sh.start.kind] });
    for (const x of out.started) { const s = seen.get(x.shell.id); if (s) (s.st = s.st || []).push([fr, x.start.list, x.start.key, x.start.kind]); }
  }
  console.log(variant, clip, JSON.stringify([...seen.values()].slice(0, 4)));
}
