const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
function run(clip, variant, len, aura, n, loopStart){
  const st = S.createShellState('em024_00');
  const M = [1,0,0,0, 0,1,0,0, 0,0,1,0, 30,610,420,1];
  const J = g => M;
  const log = [];
  let fr = 0;
  for (let k = 0; k < n; k++){
    const out = S.stepShells(st, { monId: 'em024_00', list: '2', clip, frame: fr, joints: J, loopStart, rock: { variant, target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
      owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, windAura024: aura });
    for (const s of out.spawned) log.push(['spawn', k, s.shell, s.modeIndex]);
    for (const s of out.ended) log.push(['end', k, s.shell, s.modeIndex, s.moves]);
    for (const r of out.refused) log.push(['refused', k, JSON.stringify(r)]);
    fr = fr + 1; if (fr > len) fr = loopStart != null ? loopStart : len;
  }
  return log;
}
const a = process.argv.slice(2);
console.log(JSON.stringify(run(a[0], a[1], +a[2], +a[3], +a[4], a[5] != null ? +a[5] : undefined)));
