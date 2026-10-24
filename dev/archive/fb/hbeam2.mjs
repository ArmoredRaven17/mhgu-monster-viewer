// hbeam2.mjs: every BEAM_SPAWNS row (clip, variant, the state its `when` asks), the Solid hunter on the beam's line at 300..3000:
// beam shells made, hunter latches, impact starts at a hunter contact, refusals
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const B = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/beam-spawns.js').href);
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[12] = 0; m[13] = 300; m[14] = 200; return m; };
let made = 0, met = 0; const ref = {}, starts = {};
for (const [mon, rows] of Object.entries(B.BEAM_SPAWNS)){
  for (const r of rows){
    for (const dz of [300, 800, 1500, 3000]){
      const st = S.createShellState(mon);
      const w = r.when || {};
      for (let fr = 0; fr <= r.frame + 300; fr++){
        let out; try { out = S.stepShells(st, { monId: mon, list: r.list, clip: r.clip, frame: Math.min(fr, r.frame + 60), joints: jm, rage: !!w.rage,
          beamState: { rage: !!w.rage, snow: !!w.snow, parts: w.part || {}, rank: 5 }, rock: { variant: r.variant, target: { x: 0, y: 0, z: dz }, floorY: -2000 },
          owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: -2000, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10, snow: !!w.snow, hunterBody: true }); } catch (er) { ref[mon + ' THROW ' + er.message.slice(0, 70)] = 1; break; }
        for (const x of out.refused) if (/hunter pass/.test(x.why || '')) ref[mon + ' ' + x.why.slice(0, 90)] = 1;
        for (const sh of out.spawned) if (sh.base === 'base02g') made++;
        for (const sh of st.shells) if (sh.base === 'base02g' && sh.hunterHit && !sh.__m){ sh.__m = 1; met++; (starts[mon] = starts[mon] || new Set()).add(sh.type.id); }
      }
    }
  }
}
console.log('beams made', made, 'beams meeting the hunter', met, JSON.stringify(Object.fromEntries(Object.entries(starts).map(([k, v]) => [k, [...v]]))));
console.log('refusals:\n  ' + (Object.keys(ref).join('\n  ') || 'none'));
