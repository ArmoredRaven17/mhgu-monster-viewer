const MS = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js');
const fs = await import('node:fs');
const mon = JSON.parse(fs.readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8'));
const e = (Array.isArray(mon) ? mon : mon.monsters).find(x => x.id === 'em046_00');
const m = new MS.MotionStates();
const user = { rage: false, level: 0, tired: false };
// user: head broken (2 on), chest broken (6), shocker broken uncharged (8 only), claws broken (13)
const drawnUser = new Map([[1,false],[2,true],[5,false],[6,true],[7,false],[8,true],[9,false],[10,false],[11,false],[12,false],[13,true],[14,false],[101,true],[3,true],[4,false],[23,false]]);
const run = (l, c) => { m.step('em046_00', l, 'x', 0, null, user); const r = m.step('em046_00', l, c, 0, null, user); const d = new Map(drawnUser); m.showParts(d, e.groups); return [r.fire, r.drop, m.cur && m.cur.sets, [...d].filter(([p,v]) => v).map(([p]) => p).join(',')]; };
m.showParts(new Map(drawnUser), e.groups);
for (const [l, c] of [['3','Motion[2]'],['3','Motion[1]'],['3','Motion[1]'],['3','Motion[3]'],['3','Motion[4]'],['3','Motion[13]'],['3','Motion[12]']])
  console.log(l, c, JSON.stringify(run(l, c)));
