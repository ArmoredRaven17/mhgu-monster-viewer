import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const mon = 'em084_00', e = arr.find(x => x.id === mon);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const frameM = side => [1,0,0,0, 0,1,0,0, 0,0,1,0, side === 'left' ? -300 : 300, 400, 200, 1];
const got = {}, refused = {};
for (const aj of [false, true]) for (const rank of [3, 5]) for (const L of e.lists) for (const c of L.clips){
  if (c.clip.endsWith('_start')) continue;
  const bare = c.clip.replace(/_(loop|start)$/, '');
  let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, {}) || []; } catch (err) {}
  if (!vs.length) vs = [null];
  const len = Math.max(2, Math.round(c.dur * 60));
  for (const v of vs){
    const st = S.createShellState(mon);
    for (let fr = 0; fr <= len + 600; fr++){
      const inp = { monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len), joints: jm,
        rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
        ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank, questLevel: 10 };
      if (aj){ inp.attachedJoints = { left: jm, right: jm }; inp.arms = { left: { frame: frameM('left') }, right: { frame: frameM('right') } }; }
      let out; try { out = S.stepShells(st, inp); } catch (err) { console.log('ERR', err.message); break; }
      const tag = (aj ? 'AJ ' : 'noAJ ') + 'rank' + rank + ' L' + L.id + ' ' + bare + ' ' + v;
      const add = q => { if (q && q.pel){ const k = q.pel + ':' + q.key; (got[k] = got[k] || new Set()).add(tag); } };
      for (const s of out.started) add(s.start);
      for (const sh of out.spawned) add(sh.start);
      for (const r of out.refused || []) if (r.beam || /beam/.test(r.why || '')) { const k = (r.why || '').slice(0, 110); (refused[k] = refused[k] || new Set()).add(tag); }
    }
  }
}
for (const k of ['em084_00u:31','em084_00u:33','em084_00u:110','em084_00u:111','em084_00u:112','em084_00u:113','em084_00u:32','em084_00u:34','em084_00u:20']) console.log(k, got[k] ? [...got[k]].slice(0, 6).join(' | ') : 'NEVER');
for (const [k, v] of Object.entries(refused)) console.log('REFUSED', k, [...v].slice(0, 3).join(' | '), v.size);
