const M = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const st = M.createShellState('em081_04');
const J = g => { const m = new Array(16).fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[13] = 300; return m; };
const frames = [];
for (let k = 0; k < 201; k++) frames.push([k, null]);
for (let r = 0; r < 2; r++) for (let k = 0; k < 64; k++) frames.push([202 + k, 202]);
frames.forEach(([fr, ls], k) => {
  const o = M.stepShells(st, { monId: 'em081_04', list: '4', clip: 'Motion[62]', frame: fr, loopStart: ls, joints: J, owner: { x: 0, y: 0, z: 0 },
    ownerPos: { x: 0, y: 0, z: 0 }, rock: { floorY: 0, variant: '7:0xc7', target: { x: 0, y: 0, z: 2100 } }, hitLife: true, chargeTier: 4 });
  for (const s of o.spawned) if (s.shell === 'shell11') console.log('shell11 at step', k, 'frame', fr, 'hist', st.hist);
});
