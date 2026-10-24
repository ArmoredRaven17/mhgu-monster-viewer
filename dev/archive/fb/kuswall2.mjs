const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const f = Math.fround, I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,300,0,1].map(f);
for (const wz of [null, -300, -150]) for (const [list, clip, v] of [['2','Motion[21]','7:0x28'], ['2','Motion[9]','7:0x2c'], ['2','Motion[22]','7:0x2a']]){
  const st = S.createShellState('em024_00'); const ev = [];
  for (let i = 0; i < 900; i++){
    const out = S.stepShells(st, { monId: 'em024_00', list, clip, frame: Math.min(i, 300), joints: g => I,
      rock: { variant: v, target: { x: 0, y: 0, z: -2100 }, floorY: 0, wall: wz == null ? undefined : { axis: 'z', at: wz, facing: 1 } },
      owner: { x: 0, y: 0x8000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, hitLife: true });
    for (const sh of out.alive.concat(out.ended)) for (const e of sh.events || []) if (e.ev === 'hit') ev.push(sh.shell + ' t' + e.type + ' ' + e.point.map(x => Math.round(x)).join(','));
    for (const x of out.started) ev.push('start ' + x.start.key);
  }
  console.log(wz, clip, v, ev.join(' | '));
}
