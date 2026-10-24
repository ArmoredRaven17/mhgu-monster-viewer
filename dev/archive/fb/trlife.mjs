// trlife.mjs <mon> <list> <clip> [variant]: each shell's spawn frame, moves lived, slots, starts
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const [mon, list, clip, v] = process.argv.slice(2);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40; m[13] = 150; m[14] = 100; return m; };
const st = S.createShellState(mon); const born = new Map();
for (let fr = 0; fr <= 400; fr++){
  const out = S.stepShells(st, { monId: mon, list, clip, frame: Math.min(fr, 300), joints: jm,
    rock: { variant: v || null, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
    ownerPos: { x: 120.5, y: 0, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 });
  for (const s of out.spawned) born.set(s, fr);
  for (const s of out.ended) console.log(s.shell, s.modeIndex, 'born', born.get(s), 'ended', fr, 'moves', s.moves, 'slots', JSON.stringify(s.slots), 'start', s.start && s.start.key, 'timer', s.timer);
  if (out.refused.length) console.log('refused', JSON.stringify(out.refused).slice(0, 300));
}
