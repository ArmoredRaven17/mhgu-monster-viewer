import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const mon = 'em088_00', e = arr.find(x => x.id === mon);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const dur = (l, c) => Math.round(e.lists.find(x => x.id === l).clips.find(x => x.clip.replace(/_(loop|start)$/, '') === c).dur * 60);
function play(st, list, clip, v, carry, frames, wrap, keys, why){
  const len = dur(list, clip);
  for (let fr = 0; fr < frames; fr++){
    const out = S.stepShells(st, { monId: mon, list, clip, frame: wrap ? fr % len : Math.min(fr, len), joints: jm, carry,
      rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
      ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 });
    for (const s of out.started) s.start && keys.add(s.start.pel + ':' + s.start.key);
    for (const s of out.spawned){ s.start && keys.add(s.start.pel + ':' + s.start.key); keys.add('SPAWN ' + s.shell + ' m' + s.modeIndex); }
    for (const r of out.refused) why.add(JSON.stringify(r).slice(0, 200));
  }
}
// webs with wrap
for (const v of S.pickVariantsFor(mon, '2', 'Motion[30]', {})){
  const st = S.createShellState(mon), keys = new Set(), why = new Set();
  play(st, '2', 'Motion[30]', v, 1, 4000, true, keys, why);
  console.log('M30 wrap', v, [...keys].join(' '), [...why].slice(0, 2));
}
// throw then pull, same state
for (const pullClip of ['Motion[19]', 'Motion[37]']){
  const st = S.createShellState(mon), keys = new Set(), why = new Set();
  play(st, '2', 'Motion[17]', '7:0x10', 1, 3000, false, keys, why);
  const k2 = new Set();
  play(st, '2', pullClip, null, 1, 2000, false, k2, why);
  console.log('throw then pull', pullClip, [...k2].join(' '), [...why].slice(0, 3));
}
