import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const st = S.createShellState('em070_00');
const J = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 118,210.5,-60.25,1];
let k = 0;
for (const [list, clip, variant, len, tgt] of [['0', 'Motion[8]', '3:0x0c', 30], ['2', 'Motion[31]', '7:0x07', 20, [-1500, 0, 1900]], ['2', 'Motion[31]', '7:0x07', 20, [-1500, 0, 1930]]]){
  for (let fr = 0; fr <= len; fr++){
    const out = S.stepShells(st, { monId: 'em070_00', list, clip, frame: fr, joints: J, rank: 1,
      rock: { variant, target: { x: (tgt||[900])[0], y: (tgt||[0,40])[1], z: (tgt||[0,0,2400])[2] }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1] });
    for (const s of out.spawned) console.log(k, clip, fr, 'spawn', s.shell, s.modeIndex, s.creator, JSON.stringify(s.launch && s.launch.angles), JSON.stringify(s.launch && s.launch.velocity));
    for (const r of out.refused) console.log(k, 'refused', JSON.stringify(r));
    k++;
  }
}
