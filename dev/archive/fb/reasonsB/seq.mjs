// seq.mjs <mon> '<json plays>' : plays = [{list, clip, from?, to?, variant?, extra?}], one shell state across them; prints starts of interest
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const M = JSON.parse(readFileSync(ROOT + 'monsters.json', 'utf8')); const arr = Array.isArray(M) ? M : M.monsters;
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const [mon, playsJ, tailJ] = process.argv.slice(2);
const plays = JSON.parse(playsJ), e = arr.find(x => x.id === mon);
const st = S.createShellState(mon);
const seen = {};
for (const p of plays){
  const L = e.lists.find(l => String(l.id) === String(p.list));
  const c = L.clips.find(x => x.clip.replace(/_(loop|start)$/, '') === p.clip && !x.clip.endsWith('_start'));
  const len = Math.max(2, Math.round(c.dur * 60) + (c.clip.endsWith('_loop') ? 120 : 0));
  const from = p.from || 0, to = p.to != null ? p.to : len + (p.tail || 0);
  for (let fr = from; fr <= to; fr++){
    const out = S.stepShells(st, Object.assign({ monId: mon, list: String(p.list), clip: p.clip, frame: Math.min(fr, len), joints: jm,
      rock: { variant: p.variant || null, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
      ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }, p.extra || {}));
    for (const s of out.spawned) console.log(p.clip, fr, 'spawn', s.shell, s.modeIndex, s.start ? s.start.pel + ':' + s.start.key : '-');
    for (const s of out.started) console.log(p.clip, fr, 'start', s.shell.shell, s.shell.modeIndex, s.start.pel + ':' + s.start.key, s.start.kind || '');
    for (const r of out.refused) console.log(p.clip, fr, 'refused', JSON.stringify(r).slice(0, 220));
    for (const s of out.ended) console.log(p.clip, fr, 'ended', s.shell, s.modeIndex, JSON.stringify((s.events || []).slice(-2)).slice(0, 160));
  }
}
console.log('live:', st.shells.filter(s => s.state !== 0xff).map(s => s.shell + ' m' + s.modeIndex + ' st' + s.state).join(', '));
