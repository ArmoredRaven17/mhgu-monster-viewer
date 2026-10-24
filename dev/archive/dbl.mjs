const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,300,0,1];
function run(mon, clip, startLen, loopLen, spawnRock, label){
  const st = S.createShellState(mon);
  const joints = gid => I;
  const steps = [];
  for (let f = 0; f < startLen; f++) steps.push({ frame: f, loopStart: null });
  for (let pass = 0; pass < 2; pass++) for (let f = 0; f < loopLen; f++) steps.push({ frame: startLen + f, loopStart: startLen });
  let spawned = [];
  for (const s of steps){
    const out = S.stepShells(st, { monId: mon, list: '2', clip, frame: s.frame, loopStart: s.loopStart, joints, rage: false,
      rock: { variant: spawnRock, target: { x: 0, y: 0, z: 2100 }, floorY: 0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 },
      beamState: { tired: false, rage: false, rank: 5, parts: {} } });
    for (const sh of out.spawned) spawned.push(s.frame + ':' + (sh.type ? sh.type.id : sh.shell));
    if (out.refused.length) console.log('refused', s.frame, out.refused.map(r => r.why).join(' | '));
  }
  console.log(label, spawned.join(' '));
}
run('em023_00', 'Motion[8]', 92, 52, '7:0x06', 'Rajang M8');
run('em019_00', 'Motion[18]', 128, 36, null, 'Daimyo M18');
run('em050_00', 'Motion[11]', 32, 256, null, 'Alatreon M11');
