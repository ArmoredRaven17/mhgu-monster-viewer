const M = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const st = M.createShellState('em081_04');
const J = g => { const m = new Array(16).fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[13] = 400; m[14] = 300; return m; };
let S = null, p0;
for (let k = 0; k < 500; k++){
  const o = M.stepShells(st, { monId: 'em081_04', list: '2', clip: 'Motion[48]', frame: k, joints: J, owner: { x: 0, y: 0, z: 0 },
    ownerPos: { x: 0, y: 0, z: 0 }, rock: { floorY: 0, variant: process.argv[2] || '7:0x7c', target: { x: 0, y: 0, z: 2100 } }, hitLife: true });
  for (const s of o.spawned) if (!S && s.shell === 'shell15'){ S = s; p0 = s.position.slice(); }
  if (S && [1, 10, 28, 50, 78, 100, 118, 299].includes(S.moves) && o.alive.concat(o.ended).includes(S)){
    const v = S.velocity, sp = Math.hypot(...v);
    console.log('m' + (S.moves - 1), S.position.map((x, i) => (x - p0[i]).toFixed(2)).join(','), '|v|', sp.toFixed(3), 'off', S.off.toFixed(2), 'vlat', S.vlat.toFixed(3), 'W', S.angles[1].toString(16), S.state);
  }
}
