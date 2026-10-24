// replay.mjs <mon> <list> <clip> '<extra json>' [variant]: step one clip, print spawned shell/mode and started keys
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const [mon, list, clip, extraS, vArg] = process.argv.slice(2);
const extra = extraS ? JSON.parse(extraS) : {};
const e = arr.find(x => x.id === mon);
const L = e.lists.find(l => String(l.id) === list);
const c = L.clips.find(x => x.clip.replace(/_(loop|start)$/, '') === clip && !x.clip.endsWith('_start'));
if (!c) { console.log('no clip', list, clip, L.clips.map(x => x.clip).join(',').slice(0, 400)); process.exit(); }
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
let vs = []; try { vs = S.pickVariantsFor(mon, list, clip, extra.beamState || {}) || []; } catch (err) { console.log('pick err', err.message); }
console.log('variants', JSON.stringify(vs));
if (vArg) vs = [vArg];
if (!vs.length) vs = [null];
const len = process.env.LEN ? +process.env.LEN : Math.max(2, Math.round(c.dur * 60) + (c.clip.endsWith("_loop") ? 120 : 0));
for (const v of vs){
  const st = S.createShellState(mon);
  const sp = new Map(), stt = new Map(), ref = new Map();
  for (let fr = 0; fr <= len + 400; fr++){
    let out; try { out = S.stepShells(st, Object.assign({ monId: mon, list, clip, frame: Math.min(fr, len), joints: jm,
      rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
      ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }, extra)); } catch (err) { console.log('err', fr, err.message); break; }
    for (const s of out.spawned){ const k = s.shell + ' m' + s.modeIndex + (s.start ? ' init ' + s.start.pel + ':' + s.start.key : ''); sp.set(k, (sp.get(k) || 0) + 1); }
    for (const r of (out.refused || [])){ const k = (r.shell||'') + ' m' + r.mode + ' ' + String(r.why).slice(0, 160); ref.set(k, (ref.get(k) || 0) + 1); }
    for (const s of out.started){ const k = s.start.pel + ':' + s.start.key; stt.set(k, (stt.get(k) || 0) + 1); }
  }
  console.log('v', v, 'spawned', JSON.stringify([...sp]), 'started', JSON.stringify([...stt]), ' || refused', JSON.stringify([...ref]).slice(0, 1500));
}
