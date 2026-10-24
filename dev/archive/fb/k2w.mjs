import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[12] = 40 + (g % 7) * 10; m[13] = 250 + (g % 5) * 20; m[14] = 150 + (g % 3) * 30; return m; };
const [mon, L, c, len, extraJ] = process.argv.slice(2); const extra = JSON.parse(extraJ || '{}');
for (const v of (S.pickVariantsFor(mon, L, c, extra.beamState || {}) || [null]).concat(extra.noPick ? [] : [])){
  const st = S.createShellState(mon); const ev = [];
  for (let fr = 0; fr <= +len + 300; fr++){
    const out = S.stepShells(st, Object.assign({ monId: mon, list: L, clip: c, frame: process.env.WRAP ? fr % (+len) : Math.min(fr, +len), joints: jm, rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
      owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }, extra));
    for (const s of out.spawned) ev.push(fr + ':sp ' + s.shell + ' m' + s.modeIndex + ' by ' + (s.creator != null ? s.creator : '-') + ' id ' + s.id + ' ' + (s.starts || [s.start]).filter(Boolean).map(r => r.key).join('+'));
    for (const s of out.started) ev.push(fr + ':st ' + s.start.key + '(' + (s.start.kind || '') + ')');
  }
  console.log(v, ev.filter(x => !process.env.GREP || new RegExp(process.env.GREP).test(x)).slice(0, 14).join(' | '));
}
