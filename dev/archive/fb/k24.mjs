import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[13] = 200; return m; };
for (const [L, c, lv] of [['1', 'Motion[16]', 3], ['1', 'Motion[16]', 1], ['0', 'Motion[38]', 2]]){
  const st = S.createShellState('em024_00'); const ev = [];
  for (let fr = 0; fr < 400; fr++){
    const out = S.stepShells(st, { monId: 'em024_00', list: L, clip: c, frame: fr % 100, joints: jm, rock: { variant: null, target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
      owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120, y: 15, z: -80 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10, windAura024: lv });
    for (const s of out.spawned) ev.push(fr + ':sp ' + s.shell + ' m' + s.modeIndex + ' starts' + JSON.stringify((s.starts||[]).map(r=>r.key)) + ' ' + (s.effects || []).map(e => e.key + (e.started ? '*' : '')).join('/'));
    for (const s of out.started) ev.push(fr + ':st ' + s.start.key);
    for (const r of out.refused) ev.push(fr + ':R ' + (r.why || '').slice(0, 60));
  }
  console.log(L, c, lv, ev.slice(0, 8).join(' | '));
}
