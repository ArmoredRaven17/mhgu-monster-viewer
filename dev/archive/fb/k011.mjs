import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[13] = 200; return m; };
for (const [L, c] of [['2', 'Motion[4]'], ['4', 'Motion[2]'], ['0', 'Motion[11]'], ['0', 'Motion[12]']]){
  const vs = S.pickVariantsFor('em011_00', L, c, {}) || [null];
  for (const v of vs.slice(0, 3)){
    const st = S.createShellState('em011_00'); const ev = [];
    for (let fr = 0; fr < 600; fr++){
      const out = S.stepShells(st, { monId: 'em011_00', list: L, clip: c, frame: Math.min(fr, 200), joints: jm, rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
        owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120, y: 15, z: -80 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 });
      for (const s of out.spawned) ev.push(fr + ':sp ' + s.shell + ' ' + s.modeIndex);
      for (const s of out.started) ev.push(fr + ':st ' + s.start.key);
      for (const r of out.refused) ev.push(fr + ':R ' + (r.why || '').slice(0, 50));
    }
    console.log(L, c, v, ev.slice(0, 12).join(' | '));
  }
}
