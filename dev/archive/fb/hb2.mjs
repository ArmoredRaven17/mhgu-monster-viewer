// hb.mjs: every NO WALL / HUNTER record's monster, every clip x pick, with the Solid hunter at several distances in front: which start
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const MJ = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8')); const arr = Array.isArray(MJ) ? MJ : MJ.monsters;
const W = JSON.parse(readFileSync('wallhunter.json', 'utf8'));
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[12] = 40 + (g % 7) * 10; m[13] = 250 + (g % 5) * 20; m[14] = 150 + (g % 3) * 30; return m; };
const res = {}; let refusals = {};
for (const [mon, recs] of Object.entries(W)){
  const want = new Set(recs), found = {}; const e = arr.find(x => x.id === mon); if (!e || !S.SHELL_DATA[mon]) continue;
  for (const dz of [0, 500, 1200]) for (const L of e.lists) for (const c of L.clips){
    if (c.clip.endsWith('_start')) continue; const bare = c.clip.replace(/_(loop|start)$/, '');
    let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, {}) || []; } catch (er) {} if (!vs.length) vs = [null];
    const len = Math.max(2, Math.round(c.dur * 60));
    for (const v of vs){
      const st = S.createShellState(mon);
      for (let fr = 0; fr <= len + 300; fr++){
        let out; try { out = S.stepShells(st, { monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len), joints: jm, rock: { variant: v, target: { x: 0, y: 0, z: dz }, floorY: 0 },
          owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10, hunterBody: true }); } catch (er) { break; }
        const add = q => { if (q && q.pel){ const k = q.pel + ':' + q.key; if (want.has(k) && !found[k]) found[k] = 'dz ' + dz + ' L' + L.id + ' ' + bare + (v ? ' ' + v : ''); } };
        for (const s of out.started) add(s.start); for (const sh of out.spawned) add(sh.start);
        for (const r of out.refused) if (/hunter pass/.test(r.why || '')) refusals[mon + ' ' + r.why.slice(0, 80)] = 1;
      }
    }
  }
  res[mon] = found;
  console.log(mon, recs.length, '->', Object.keys(found).length, JSON.stringify(found).slice(0, 250));
}
writeFileSync('hb2.json', JSON.stringify(res)); console.log(Object.keys(refusals).slice(0, 30).join('\n'));
