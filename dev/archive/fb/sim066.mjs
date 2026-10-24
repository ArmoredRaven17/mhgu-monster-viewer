import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const mon = process.argv[2] || 'em066_00';
const plays = [['4', 'Motion[1]', 200, 0, '7:0x55'], ['4', 'Motion[2]', 200, 1, '7:0x56'], ['2', 'Motion[12]', 120, 0, '7:0x21'], ['4', 'Motion[30]', 700, 0, '7:0x89'], ['4', 'Motion[30]', 700, 2, '7:0x89'], ['4', 'Motion[1]', 200, 2, '7:0x55']];
for (const [list, clip, len, tusk, variant] of plays){
  const st = S.createShellState(mon);
  const seen = new Map(); const ev = [];
  for (let i = 0; i <= len; i++){
    const out = S.stepShells(st, { monId: mon, list, clip, frame: Math.min(i, len), joints: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
      rock: { variant, target: { x: 900, y: 40, z: 2400 }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 },
      ground: 0, size: [1, 1], rank: 5, tusk066: tusk });
    for (const r of out.refused) ev.push(['refused', i, JSON.stringify(r)]);
    for (const sh of out.spawned) ev.push(['spawn', i, sh.shell, sh.modeIndex, JSON.stringify(sh.position)]);
    for (const { shell: sh, start } of out.started) ev.push(['start', i, sh.shell, start.key, JSON.stringify(start.requester.position)]);
    for (const sh of out.ended) ev.push(['end', i, sh.shell, sh.modeIndex, JSON.stringify(sh.position)]);
    for (const sh of out.alive) seen.set(sh.id, sh);
  }
  console.log('==', list, clip, 'tusk', tusk);
  for (const e of ev) console.log('  ', e.join(' '));
  for (const sh of seen.values()) console.log('   shell', sh.shell, sh.modeIndex, 'state', sh.state, 'phase', sh.phase, 'start', sh.start && sh.start.key, JSON.stringify(sh.position), (sh.events || []).filter(e => e.ev !== 'hit').map(e => e.ev + ':' + (e.id ?? e.key ?? e.param)).join(','));
}
