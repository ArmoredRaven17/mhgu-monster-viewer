// chain.mjs <mon> '<json [[list, clip, variant, len], ...]>' '<extra json>': play clips in sequence on ONE shell state
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const S = await import(pathToFileURL(ROOT + 'render/shells.js').href);
const [mon, seqS, extraS] = process.argv.slice(2);
const seq = JSON.parse(seqS), extra = extraS ? JSON.parse(extraS) : {};
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40 + (gid % 7) * 10; m[13] = 250 + (gid % 5) * 20; m[14] = 150 + (gid % 3) * 30; return m; };
const st = S.createShellState(mon);
for (const [list, clip, v, len] of seq){
  const sp = new Map(), stt = new Map(), ref = new Map();
  for (let fr = 0; fr <= len; fr++){
    const out = S.stepShells(st, Object.assign({ monId: mon, list, clip, frame: fr, joints: jm,
      rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
      ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }, extra));
    for (const s of out.spawned){ const k = s.shell + ' m' + s.modeIndex + (s.start ? ' init ' + s.start.pel + ':' + s.start.key : ''); sp.set(k, (sp.get(k) || 0) + 1); }
    for (const r of (out.refused || [])){ const k = (r.shell || '') + ' m' + r.mode + ' ' + String(r.why).slice(0, 120); ref.set(k, (ref.get(k) || 0) + 1); }
    for (const s of out.started){ const k = s.start.pel + ':' + s.start.key; stt.set(k, (stt.get(k) || 0) + 1); }
  }
  console.log(list, clip, v, 'spawned', JSON.stringify([...sp]), 'started', JSON.stringify([...stt]), '|| refused', JSON.stringify([...ref]).slice(0, 600));
}
