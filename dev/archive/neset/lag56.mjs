const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const id = () => { const m = new Array(16).fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[13] = 600; return m; };
const st = S.createShellState('em061_00'); const tr = new Map();
for (let k = 0; k < 700; k++){
  const out = S.stepShells(st, { monId: 'em061_00', list: '2', clip: 'Motion[56]', frame: Math.min(k, 150), joints: () => id(), hitLife: true,
    rock: { variant: '7:0x7d', target: { x: 0, y: 0, z: 2000 }, floorY: 0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 } });
  for (const sh of out.alive) if (sh.shell === 'shell19'){ const t = tr.get(sh.id) || []; t.push([k, sh.state, sh.position.map(v => Math.round(v))]); tr.set(sh.id, t); }
  for (const r of out.refused) console.log('refused', r.why);
}
for (const [i, t] of tr) console.log(i, t.length, JSON.stringify(t.filter((_, j) => j % 60 === 0 || j === t.length - 1)));
