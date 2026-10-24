const MS = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js');
const user = { rage: false, level: 0, tired: false };
const drawn = new Map([[5,false],[6,true],[7,false],[8,true]]);
for (const pre of [0, 1, 2]){
  const m = new MS.MotionStates(); m.showParts(new Map(drawn), null);
  const mon = JSON.parse((await import('node:fs')).readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json','utf8'));
  const e = (Array.isArray(mon) ? mon : mon.monsters).find(x => x.id === 'em046_00'); m.showParts(new Map(drawn), e.groups);
  const play = c => { m.step('em046_00', '3', 'Motion[11]', 0, null, user); return m.step('em046_00', '3', c, 0, null, user).fire.map(r => r[1]); };
  for (let i = 0; i < pre; i++) play('Motion[1]');          // list-change autoplays
  console.log('pre', pre, JSON.stringify([play('Motion[1]'), play('Motion[1]')]));
}
