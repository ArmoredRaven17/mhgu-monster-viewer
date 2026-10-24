import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const mon = 'em088_00', e = arr.find(x => x.id === mon);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const len = Math.round(e.lists.find(x => x.id === '2').clips.find(x => x.clip.startsWith('Motion[30]')).dur * 60);
console.log('M30 len', len, e.lists.find(x => x.id === '2').clips.filter(x => /Motion\[3[01]\]/.test(x.clip)).map(c => c.clip));
for (const v of S.pickVariantsFor(mon, '2', 'Motion[30]', {})) for (const plays of [1, 2, 3]){
  const st = S.createShellState(mon), keys = new Set(), why = new Set(), ends = new Set();
  let n = 0;
  for (let p = 0; p < plays; p++){
    // each play: one wrap of M30, then hold the last frame (stand-in for the hold) for 3000 frames
    for (let fr = 0; fr < len * 2 + 3000; fr++){
      const frame = fr < len ? fr : fr < 2 * len ? fr - len : len - 1;
      const out = S.stepShells(st, { monId: mon, list: '2', clip: 'Motion[30]', frame, joints: jm, carry: 1,
        rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
        ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 });
      for (const s of out.started) s.start && keys.add(s.start.pel + ':' + s.start.key);
      for (const s of out.spawned) s.start && keys.add(s.start.pel + ':' + s.start.key);
      for (const r of out.refused) why.add(JSON.stringify(r).slice(0, 200));
    }
  }
  console.log(v, 'plays', plays, [...keys].sort().join(' '), [...why].slice(0, 2));
}
