// which base01 shells start a second EffectParam at their init (S.starts[1]) that the page never hears of (no def.startEf2)
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const MJ = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8')); const arr = Array.isArray(MJ) ? MJ : MJ.monsters;
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[13] = 200; return m; };
const hit = {};
for (const [mon, D] of Object.entries(S.SHELL_DATA)){
  const st = S.createShellState(mon);
  // replay every action row's clip once and collect spawned base01 shells with two init starts
  const e = arr.find(x => x.id === mon); if (!e) continue;
  const plays = [];
  for (const L of e.lists) for (const c of L.clips){ if (c.clip.endsWith('_start')) continue; const bare = c.clip.replace(/_(loop|start)$/, '');
    let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, {}) || []; } catch (er) {} if (!vs.length) vs = [null];
    for (const v of vs) plays.push({ list: L.id, clip: bare, variant: v, action: undefined, len: Math.round(c.dur * 60) + 60 }); }
  for (const a of plays){
    const s2 = S.createShellState(mon);
    for (let fr = 0; fr < a.len + 200; fr++){
      let out; try { out = S.stepShells(s2, { monId: mon, list: a.list, clip: a.clip, frame: Math.min(fr, a.len), joints: jm, rock: { variant: a.variant, target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
        owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120, y: 15, z: -80 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10, action: a.action }); } catch (e) { break; }
      for (const sh of out.spawned.concat(s2.shells.filter(x => !x.__c && (x.__c = 1)))){
        const def = D.shells[sh.shell];
        if (sh.starts && sh.starts.length > 1 && !(def && def.startEf2)){ const k = mon + ' ' + sh.shell + ' ' + (def && def.cls); (hit[k] = hit[k] || new Set()).add('m' + sh.modeIndex + ':' + sh.starts.map(r => r.key).join('+')); }
      }
    }
  }
}
for (const [k, v] of Object.entries(hit)) console.log(k, [...v].slice(0, 6).join(' '));
