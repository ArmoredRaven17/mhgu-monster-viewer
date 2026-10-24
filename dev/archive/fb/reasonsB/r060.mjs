import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const [mon, list, clip, len, extraJ] = process.argv.slice(2);
const extra = extraJ ? JSON.parse(extraJ) : {};
const st = S.createShellState(mon);
const L = +len;
for (let fr = 0; fr <= L + 600; fr++){
  const out = S.stepShells(st, Object.assign({ monId: mon, list, clip, frame: Math.min(fr, L), joints: jm,
    rock: { variant: extra.variant || null, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
    ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }, extra));
  for (const s of out.spawned) console.log(fr, 'spawn', s.shell, s.modeIndex, s.position && s.position.map(v=>v.toFixed(0)).join(','), s.velocity && s.velocity.map(v=>v.toFixed(1)).join(','));
  for (const s of out.started) console.log(fr, 'start', s.shell.shell, s.shell.modeIndex, s.start.pel + ':' + s.start.key);
  for (const r of out.refused) console.log(fr, 'refused', JSON.stringify(r).slice(0, 200));
  for (const s of out.ended) console.log(fr, 'ended', s.shell, s.modeIndex, s.position && s.position.map(v=>v.toFixed(0)).join(','), JSON.stringify((s.events||[]).slice(-3)).slice(0,200));
  if (extra.trace && fr % 50 === 0) for (const s of st.shells) console.log(fr, 'pos', s.shell, s.modeIndex, s.state, s.position && s.position.map(v=>v.toFixed(0)).join(','));
}
