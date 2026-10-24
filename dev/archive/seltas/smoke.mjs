// smoke: run each Seltas row through stepShells with a synthetic pose (identity joints at a point), print spawns / landings
const S = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
const I = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
function run(mon, list, clip, variant, len, extra = {}){
  const st = S.createShellState(mon);
  const J = gid => gid === 144 ? I(0, 300, 120) : gid === 1 ? I(0, 350, 200) : I(0, 100, 0);
  const evs = [];
  for (let k = 0; k < len + 300; k++){
    const frame = Math.min(k, len);
    const out = S.stepShells(st, Object.assign({ monId: mon, list, clip, frame, joints: J, rage: false,
      rock: { variant, target: { x: 0, y: 0, z: 2100 }, floorY: 0 }, owner: { x: 0, y: 0, z: 0 },
      ownerPos: { x: 0, y: 0, z: 0 }, hitLife: true, rank: 5 }, extra));
    for (const sh of out.spawned) evs.push(['spawn', k, sh.shell, sh.modeIndex, sh.position && sh.position.map(v => +v.toFixed(1)), sh.velocity && sh.velocity.map(v => +v.toFixed(2)), sh.angles, sh.start && sh.start.key, sh.unitScale]);
    for (const r of out.refused) evs.push(['refused', k, JSON.stringify(r)]);
    for (const x of out.started) evs.push(['start', k, x.shell.shell, x.start.pel, x.start.key, x.start.requester.position.map(v => +v.toFixed(1))]);
    for (const sh of out.ended) evs.push(['end', k, sh.shell, sh.modeIndex]);
  }
  console.log('==', mon, list, clip, variant, JSON.stringify(extra));
  for (const e of evs) console.log('  ', JSON.stringify(e));
}
run('em069_00', '4', 'Motion[42]', null, 353);
run('em069_00', '4', 'Motion[20]', null, 118, { linked: true });
run('em069_00', '4', 'Motion[20]', null, 118);
run('em069_00', '4', 'Motion[24]', '1:0x20', 47);
run('em069_00', '4', 'Motion[24]', '4:0x04', 47);
run('em069_00', '4', 'Motion[24]', '2:0x14', 47);
run('em069_00', '0', 'Motion[66]', '6:0x00', 197);
run('em069_00', '0', 'Motion[68]', null, 177);
run('em069_00', '4', 'Motion[26]', null, 187);
run('em076_00', '2', 'Motion[17]', '7:0x02', 150);
run('em076_00', '2', 'Motion[57]', '7:0x07', 150);
run('em076_00', '4', 'Motion[33]', '7:0x34', 115);
run('em076_00', '4', 'Motion[33]', '7:0x39', 115);
run('em076_00', '4', 'Motion[34]', null, 185);
run('em076_00', '4', 'Motion[33]', '7:0x3f', 115, { link: { word: 0x4000, partner: true } });
