// replay Nakarkos's arm rows with input.arms forms 0..3 and attached joints; list which em084 pel:key start
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const mon = 'em084_00', e = arr.find(x => x.id === mon);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const frameM = side => [1,0,0,0, 0,1,0,0, 0,0,1,0, side === 'left' ? -300 : 300, 400, 200, 1];
const got = {}, spawned = {}, refused = {};
for (const form of [0, 1, 2, 3]) for (const L of e.lists) for (const c of L.clips){
  if (c.clip.endsWith('_start')) continue;
  const bare = c.clip.replace(/_(loop|start)$/, '');
  const len = Math.max(2, Math.round(c.dur * 60) + (c.clip.endsWith('_loop') ? 240 : 0));
  const st = S.createShellState(mon);
  for (let fr = 0; fr <= len + 900; fr++){
    let out; try { out = S.stepShells(st, { monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len) % (c.dur*60 > 2 ? Math.round(c.dur*60) : 2), joints: jm,
      attachedJoints: { left: jm, right: jm }, arms: { left: { form, frame: frameM('left') }, right: { form, frame: frameM('right') } },
      rock: { target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
      ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }); } catch (err) { console.log('ERR', L.id, bare, form, err.message); break; }
    const tag = 'form' + form + ' L' + L.id + ' ' + bare;
    const add = q => { if (q && q.pel){ const k = q.pel + ':' + q.key; (got[k] = got[k] || new Set()).add(tag); } };
    for (const s of out.started) add(s.start);
    for (const sh of out.spawned){ add(sh.start); const k = sh.shell + ' m' + sh.modeIndex; (spawned[k] = spawned[k] || new Set()).add(tag); }
    for (const r of out.refused || []) { const k = (r.why || '').slice(0, 120); (refused[k] = refused[k] || new Set()).add(tag); }
  }
}
for (const [k, v] of Object.entries(got)) console.log('START', k, [...v].slice(0, 3).join(' | '), v.size);
for (const [k, v] of Object.entries(spawned)) console.log('SPAWN', k, [...v].slice(0, 2).join(' | '), v.size);
for (const [k, v] of Object.entries(refused)) console.log('REFUSED', k, [...v].slice(0, 2).join(' | '), v.size);
