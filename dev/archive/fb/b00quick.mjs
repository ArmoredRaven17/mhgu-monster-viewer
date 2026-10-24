// every base00 shell that ends on its first move with no hit slots (flightTimer's flight <= 0 arm with S.slots unset)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
for (const mon of process.argv.slice(2)){
  const e = arr.find(x => x.id === mon); if (!e || !S.SHELL_DATA[mon]) continue;
  const bad = new Map();
  for (const L of e.lists) for (const c of L.clips){
    if (c.clip.endsWith('_start')) continue;
    const bare = c.clip.replace(/_(loop|start)$/, '');
    let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, {}) || []; } catch (err) {}
    if (!vs.length) vs = [null];
    const len = Math.max(2, Math.round(c.dur * 60) + 120);
    for (const v of vs){
      const st = S.createShellState(mon);
      for (let fr = 0; fr <= len + 100; fr++){
        let out; try { out = S.stepShells(st, { monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len), joints: jm,
          rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
          ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }); } catch (err) { break; }
        for (const s of out.ended) if (s.base === 'base00' && s.moves <= 1 && !s.slots) bad.set(s.shell + ' ' + s.modeIndex, 'L' + L.id + ' ' + bare + ' ' + v);
      }
    }
  }
  if (bad.size) console.log(mon, [...bad.entries()].map(([k, w]) => k + ' (' + w + ')').join('; '));
}
