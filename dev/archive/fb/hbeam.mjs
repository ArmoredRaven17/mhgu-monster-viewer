// hbeam.mjs: every beam monster's beam clips with the Solid hunter at 0 / 500 / 1200: refusals named, beam / impact records started at a hunter contact
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const BT = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/beam-types.js').href);
const MJ = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8')); const arr = Array.isArray(MJ) ? MJ : MJ.monsters;
const mons = [...new Set(BT.BEAM_TYPES.map(t => t.mon))];
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[12] = 40 + (g % 7) * 10; m[13] = 250 + (g % 5) * 20; m[14] = 150 + (g % 3) * 30; return m; };
const ref = {}, hits = {};
for (const mon of mons){
  const e = arr.find(x => x.id === mon); if (!e || !S.SHELL_DATA[mon]) continue;
  for (const dz of [0, 500, 1200]) for (const L of e.lists) for (const c of L.clips){
    if (c.clip.endsWith('_start')) continue; const bare = c.clip.replace(/_(loop|start)$/, '');
    let vs = []; try { vs = S.pickVariantsFor(mon, L.id, bare, { rage: true }) || []; } catch (er) {} if (!vs.length) vs = [null];
    if (!vs.some(v => v && /^beam/.test(String(v))) && !(S.SHELL_DATA[mon].actions || []).some(a => a.clip === bare && JSON.stringify(a).includes('beam'))) continue;
    const len = Math.max(2, Math.round(c.dur * 60));
    for (const v of vs){
      const st = S.createShellState(mon);
      for (let fr = 0; fr <= len + 200; fr++){
        let out; try { out = S.stepShells(st, { monId: mon, list: L.id, clip: bare, frame: Math.min(fr, len), joints: jm, rage: true, rock: { variant: v, target: { x: 0, y: 0, z: dz }, floorY: 0 },
          owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10, hunterBody: true }); } catch (er) { ref[mon + ' THROW ' + er.message.slice(0, 80)] = 1; break; }
        for (const r of out.refused) if (/hunter pass/.test(r.why || '')) ref[mon + ' ' + r.why.slice(0, 90)] = 1;
        for (const sh of st.shells) if (sh.base === 'base02g' && sh.hunterHit) (hits[mon] = hits[mon] || new Set()).add(sh.type.id);
      }
    }
  }
}
console.log('refusals:', Object.keys(ref).join('\n  ') || 'none');
console.log('beams meeting the hunter:', JSON.stringify(Object.fromEntries(Object.entries(hits).map(([k, v]) => [k, [...v]]))));
