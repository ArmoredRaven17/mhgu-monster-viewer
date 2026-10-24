// node play.mjs mon list clip variant [extraJSON] : replay one play, print spawned shells and started records
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const [mon, list, clip, variant, ex] = process.argv.slice(2);
const extra = ex ? JSON.parse(ex) : {};
const e = arr.find(x => x.id === mon), L = e.lists.find(l => String(l.id) === list);
const c = L.clips.find(x => x.clip.replace(/_(loop|start)$/, '') === clip && !x.clip.endsWith('_start'));
const len = Math.max(2, Math.round(c.dur * 60) + (c.clip.endsWith('_loop') ? 120 : 0));
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const st = S.createShellState(mon);
const v = variant === '-' ? null : variant;
const starts = new Map(), spawns = [], ends = [];
for (let fr = 0; fr <= len + 600; fr++){
  let out; try { out = S.stepShells(st, Object.assign({ monId: mon, list, clip, frame: Math.min(fr, len), joints: jm,
    rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
    ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }, extra)); } catch (err) { console.log('ERR', fr, err.message); break; }
  for (const sh of out.spawned) spawns.push(fr + ' ' + sh.shell + ' m' + sh.modeIndex + (sh.start ? ' init ' + sh.start.pel + ':' + sh.start.key : '') + ' pos ' + (sh.pos ? [sh.pos.x, sh.pos.y, sh.pos.z].map(n => Math.round(n)).join(',') : ''));
  for (const s of out.started) if (s.start) { const k = s.start.pel + ':' + s.start.key; if (!starts.has(k)) starts.set(k, fr + ' ' + (s.shell ? s.shell.shell + ' m' + s.shell.modeIndex : '')); }
  for (const sh of out.ended.concat(out.removed)) ends.push(fr + ' ' + sh.shell + ' m' + sh.modeIndex + ' ' + sh.state + ' ev ' + (sh.events || []).slice(-3).map(x => x.ev + ':' + (x.kind || '') + ':' + (x.param != null ? x.param : '')).join(','));
}
console.log('len', len, 'spawned:', spawns.slice(0, 12).join(' | '));
console.log('started:', [...starts].map(([k, w]) => k + '@' + w).join(' | '));
console.log('ended:', ends.slice(0, 8).join(' | '));
