const M = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const [list, clip, variant, n, tier] = process.argv.slice(2);
const st = M.createShellState('em081_04');
const J = g => { const m = new Array(16).fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[12] = 1000; m[13] = 250; m[14] = 2000; return m; };
for (let k = 0; k < +n; k++){
  const o = M.stepShells(st, { monId: 'em081_04', list, clip, frame: k, joints: J, owner: { x: 0, y: 0x4000, z: 0 },
    ownerPos: { x: 0, y: 0, z: 0 }, rock: { floorY: 0, variant, target: { x: 0, y: 0, z: 2100 } }, hitLife: true, chargeTier: tier == null ? undefined : +tier, rank: 5 });
  for (const s of o.spawned) console.log('spawn', k, s.id, s.shell, s.modeIndex, s.start ? s.start.pel + ':' + s.start.key : '-', JSON.stringify(s.position.map(x => +x.toFixed(2))), (s.angles||[]).map(w=>(w&0xffff).toString(16)).join(','));
  for (const r of o.refused) console.log('REFUSED', k, JSON.stringify(r));
  for (const x of o.started) console.log('started', k, x.shell.id, x.start.key, JSON.stringify(x.start.requester));
  for (const s of o.ended) console.log('end', k, s.id, s.shell, s.modeIndex, 'moves', s.moves);
  for (const s of o.alive) if (s.units14 && [20, 21, 22, 89, 90].includes(s.moves)) console.log('  units', s.moves, JSON.stringify(s.units14), JSON.stringify(s.position.map(x=>+x.toFixed(3))));
}
