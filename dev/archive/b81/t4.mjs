const M = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const [list, clip, variant, n] = process.argv.slice(2);
const st = M.createShellState('em081_04');
const J = g => { const m = new Array(16).fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[12] = 0; m[13] = 300; m[14] = 300; return m; };
for (let k = 0; k < +n; k++){
  const o = M.stepShells(st, { monId: 'em081_04', list, clip, frame: k, joints: J, owner: { x: 0, y: 0, z: 0 },
    ownerPos: { x: 0, y: 0, z: 0 }, rock: { floorY: 0, variant, target: { x: 0, y: 0, z: 2100 } }, hitLife: true, chargeTier: +(process.env.TIER ?? 2), rank: 5 });
  for (const s of o.spawned) console.log('spawn', k, s.id, s.shell, s.modeIndex, s.start ? s.start.pel + ':' + s.start.key : '-', JSON.stringify(s.position.map(x => +x.toFixed(1))), (s.angles||[]).map(w=>(w&0xffff).toString(16)).join(','));
  for (const r of o.refused) console.log('REFUSED', k, JSON.stringify(r));
  for (const x of o.started) console.log('started', k, x.shell.id, x.start.kind, x.start.key);
  for (const s of o.ended) console.log('end', k, s.id, s.shell, s.modeIndex, 'moves', s.moves, JSON.stringify(s.position.map(x => +x.toFixed(1))), 'scale', s.unitScale);
}
