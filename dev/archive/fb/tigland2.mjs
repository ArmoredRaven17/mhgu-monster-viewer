const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const f = Math.fround;
function jointOf(a, b, c, t){
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca], Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb], Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1];
  const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ let s = 0; for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j]; o.push(s); } return o; };
  const R = mul(mul(Rz, Rx), Ry);
  return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
}
const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 50: jointOf(0.3, -0.1, 0.05, [60.0, 180.0, 310.0]) };
for (const tg of [[900, 900, 2400]]){
  const st = S.createShellState('em032_00'); const ev = {};
  for (let i = 0; i < 900; i++){
    const out = S.stepShells(st, { monId: 'em032_00', list: '2', clip: 'Motion[5]', frame: Math.min(i, 175), joints: g => JOINTS[g] || JOINTS[0],
      rock: { variant: '7:0x07', target: { x: tg[0], y: tg[1], z: tg[2] }, floorY: 300 }, owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 300 });
    for (const sh of out.alive.concat(out.ended)) for (const e of sh.events || []){ const k = e.ev + (e.type != null ? e.type : '') + (e.kind || ''); ev[k] = (ev[k] || 0) + 1; }
    for (const x of out.started) { const k = 'start ' + x.start.key; ev[k] = (ev[k] || 0) + 1; }
  }
  console.log(tg.join(','), JSON.stringify(ev));
}
