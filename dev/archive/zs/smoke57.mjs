const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const f = Math.fround;
const jm = (t) => [1,0,0,0, 0,1,0,0, 0,0,1,0, t[0],t[1],t[2],1].map(f);
function run(mon, list, clip, variant, len, x = {}){
  const st = S.createShellState(mon);
  const tally = { spawned: [], refused: [], started: [], ended: 0 };
  for (let k = 0; k <= len + 200; k++){
    const out = S.stepShells(st, { monId: mon, list, clip, frame: Math.min(k, len), joints: g => jm([10 * g, 300, 50]), rage: !!x.rage,
      rock: { variant, target: { x: 0, y: 0, z: 1500 }, floorY: 0 }, owner: { x: 0, y: x.yaw || 0x1000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 },
      ground: 0, hitLife: true, rank: 5, charged: !!x.charged, questLevel: 10, action: x.action, tailSevered: false });
    for (const s of out.spawned) tally.spawned.push(s.shell + ':' + s.modeIndex + '@' + k);
    for (const r of out.refused) tally.refused.push(r.why);
    for (const s of out.started) tally.started.push(s.start.key);
    tally.ended += out.ended.length;
  }
  console.log(mon, list, clip, variant || '', JSON.stringify(x), '->', tally.spawned.join(' '), '| starts', [...new Set(tally.started)].join(','),
              '| ended', tally.ended, tally.refused.length ? '| REFUSED ' + tally.refused.slice(0, 3).join('; ') : '');
}
for (const mon of ['em057_00', 'em057_04']){
  console.log(S.pickVariantsFor(mon, '2', 'Motion[31]', {}), S.pickVariantsFor(mon, '2', 'Motion[32]', {}), S.pickVariantsFor(mon, '2', 'Motion[60]', {}));
  for (const ch of [false, true]){
    run(mon, '2', 'Motion[31]', '7:0x20', 120, { charged: ch });
    run(mon, '2', 'Motion[32]', '7:0x7a', 90, { charged: ch });
    run(mon, '0', 'Motion[20]', null, 280, { charged: ch, action: [7, 0x71] });
    run(mon, '2', 'Motion[60]', '7:0xa6', 60, { charged: ch, rage: true });
    run(mon, '2', 'Motion[2]', null, 90, { charged: ch, action: [7, 0xfc] });
    run(mon, '2', 'Motion[1]', null, 90, { charged: ch, action: [7, 0xe9] });
    run(mon, '2', 'Motion[15]', null, 140, { charged: ch });
    run(mon, '2', 'Motion[30]', null, 100, { charged: ch, rage: true });
  }
}
run('em057_04', '9', 'Motion[1]', null, 300, { action: [7, 0xe3] });
run('em057_04', '9', 'Motion[4]', null, 170, { charged: true });
run('em057_04', '9', 'Motion[5]', null, 230, { action: [7, 0xdb] });
