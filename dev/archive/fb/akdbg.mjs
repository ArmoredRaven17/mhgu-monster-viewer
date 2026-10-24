const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const f = Math.fround, I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,300,0,1].map(f);
for (const clip of ['Motion[2]', 'Motion[2]_loop']){
  const st = S.createShellState('em033_00'); let n = 0, refs = [];
  for (let i = 0; i < 120; i++){
    const out = S.stepShells(st, { monId: 'em033_00', list: '0', clip, frame: i, joints: g => I,
      rock: { variant: '6:0x03', target: { x: 0, y: 0, z: 2000 }, floorY: 0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, hitLife: true });
    n += out.spawned.length; refs.push(...out.refused);
  }
  console.log(clip, n, JSON.stringify(refs).slice(0, 300), JSON.stringify(S.pickVariantsFor('em033_00', '0', clip, {})));
}
