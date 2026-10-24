import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[12] = 10 * g; m[13] = 200 + g; m[14] = 30; return m; };
const mon = 'em082_04';
for (const [L, c] of [['2', 'Motion[21]'], ['2', 'Motion[20]'], ['2', 'Motion[40]']]){
  for (const v of (S.pickVariantsFor(mon, L, c, {}) || [null])){
    const st = S.createShellState(mon); const ev = [];
    for (let fr = 0; fr < 400; fr++){
      const out = S.stepShells(st, { monId: mon, list: L, clip: c, frame: Math.min(fr, 200), joints: jm, rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
        owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120, y: 15, z: -80 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10, soulFlame082: true });
      for (const s of out.spawned) ev.push(fr + ':sp ' + s.shell + ' ' + s.modeIndex + (s.start ? ' u' + s.start.key : ''));
      for (const s of out.started) ev.push(fr + ':st u' + s.start.key);
      for (const r of out.refused) ev.push(fr + ':R ' + (r.why || '').slice(0, 70));
    }
    console.log(L, c, v, ev.slice(0, 14).join(' | '));
  }
}
