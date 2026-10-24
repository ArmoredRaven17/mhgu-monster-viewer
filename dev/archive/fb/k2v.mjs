import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const jm = g => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; m[12] = 40 + (g % 7) * 10; m[13] = 250 + (g % 5) * 20; m[14] = 150 + (g % 3) * 30; return m; };
const mon = 'em002_04', L = '4', c = 'Motion[38]', len = 195;
const vs = S.pickVariantsFor(mon, L, c, {}); const st = S.createShellState(mon); const ev = [];
for (let fr = 0; fr < 900; fr++){
  const v = vs[(3 + Math.floor(fr / len)) % vs.length];
  const out = S.stepShells(st, { monId: mon, list: L, clip: c, frame: fr % len, joints: jm, rock: { variant: v, target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
    owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, hitLife: true, rank: 5, questLevel: 0 });
  for (const s of out.spawned) if (s.shell === 'shell01') ev.push(fr + ':sp ' + v + ' m' + s.modeIndex + ' id' + s.id);
  for (const s of out.ended.concat(out.removed)) if (s.shell === 'shell01') ev.push(fr + ':end m' + s.modeIndex + ' id' + s.id + ' st' + s.state);
}
console.log(ev.slice(0, 20).join(' | '));
