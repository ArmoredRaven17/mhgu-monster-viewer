import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = gid => { const m = new Float32Array(16); m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1; m[12] = 40; m[13] = 250; m[14] = 150; return m; };
for (const [name, x] of [['none', {}], ['rockets 1', { rockets087: 1 }], ['rockets 2', { rockets087: 2 }], ['rockets 1 patrol', { rockets087: 1, patrol087: true }]]){
  const st = S.createShellState('em087_00'); const keys = new Set(), why = new Set();
  for (let fr = 0; fr < 1500; fr++){
    const out = S.stepShells(st, Object.assign({ monId: 'em087_00', list: '0', clip: 'Motion[1]', frame: fr % 100, joints: jm,
      rock: { target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 10 }, x));
    for (const s of out.started) s.start && keys.add(s.start.pel + ':' + s.start.key);
    for (const s of out.spawned) s.start && keys.add(s.start.pel + ':' + s.start.key);
    for (const r of out.refused) why.add(JSON.stringify(r).slice(0, 160));
  }
  console.log(name, [...keys], [...why].slice(0, 3));
}
