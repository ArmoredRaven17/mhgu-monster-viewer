import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const st = S.createShellState('em068_00');
const J = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
const seq = [['2', 'Motion[60]', '7:0x17', 120], ['0', 'Motion[50]', '1:0x00', 300], ['2', 'Motion[60]', '7:0x22', 60]];
let k = 0;
for (const [list, clip, variant, len] of seq){
  for (let fr = 0; fr <= len; fr++){
    const out = S.stepShells(st, { monId: 'em068_00', list, clip, frame: fr, joints: J,
      rock: { variant, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 },
      ground: 0, size: [1, 1], rank: 5 });
    for (const s of out.spawned) console.log(k, clip, fr, 'spawn', s.shell, s.modeIndex, s.slot, s.order, JSON.stringify(s.position));
    for (const r of out.refused) console.log(k, 'refused', JSON.stringify(r));
    for (const s of out.alive) if (s.log && s.log.length){ for (const e of s.log.splice(0)) if (e.ev !== 'stop') console.log(k, clip, fr, s.shell, s.modeIndex, e.ev, e.key == null ? '' : e.key, e.mode || '', 'state', s.state); }
    k++;
  }
}
console.log('slots', st.slots068.map(h => h && [h.modeIndex, h.state, h.order]));
