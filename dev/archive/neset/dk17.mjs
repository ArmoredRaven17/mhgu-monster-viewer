const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const id = () => { const m = new Array(16).fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[13] = 600; return m; };
const st = S.createShellState('em002_04'); const tr = new Map();
for (let k = 0; k < 400; k++){
  const out = S.stepShells(st, { monId: 'em002_04', list: '2', clip: 'Motion[18]', frame: Math.min(k, 150), joints: () => id(), hitLife: true,
    rock: { variant: '7:0x0a', target: { x: 0, y: 0, z: 2000 }, floorY: 0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 } });
  for (const sh of out.alive) if (sh.shell === 'shell00'){ const t = tr.get(sh.id) || []; t.push([k, sh.state, sh.position.map(v => Math.round(v))]); tr.set(sh.id, t); }
  for (const r of out.refused) console.log('refused', r.why);
}
for (const [i, t] of tr) console.log(i, t.length, JSON.stringify(t.filter((_, j) => j % 10 === 0 || j === t.length - 1).slice(0, 12)));
