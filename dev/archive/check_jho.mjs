const m = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js');
const ms = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js');
const h = x => '0x' + x.toString(16);
const W = (id, l, s, a, st) => h(m.pslMask(id, l, s, a, st));
const rows = [
  ['jho L2 M10 tail on / severed', W('em043_00', 2, 10, null, {}), W('em043_00', 2, 10, null, { severed: true })],
  ['jho L0 M5 roar / (10,2a)', W('em043_00', 0, 5, [1, 2], {}), W('em043_00', 0, 5, [10, 0x2a], {})],
  ['savage L0 M6 walk / sunk', W('em043_05', 0, 6, [2, 0], { sunk: m.clipSunkFor('em043_05', 0, 'Motion[6]', 0) }), W('em043_05', 0, 6, [6, 3], { sunk: m.clipSunkFor('em043_05', 0, 'Motion[6]', 1) })],
  ['savage L2 M16 tired', W('em043_05', 2, 16, null, { tired: true }), ''],
  ['barroth L0 M11 (1,2) / (10,2a)', W('em044_00', 0, 11, [1, 2], {}), W('em044_00', 0, 11, [10, 0x2a], {})],
  ['barroth L2 M12 mud 0/1/2/3', [0, 1, 2, 3].map(x => W('em044_00', 2, 12, null, { mud: x })).join(' '), ''],
  ['barroth L4 M6 rank 5 / 4', W('em044_00', 4, 6, null, { rank: 5 }), W('em044_00', 4, 6, null, { rank: 4 })],
  ['barroth L2 M2 / severed', W('em044_00', 2, 2, null, {}), W('em044_00', 2, 2, null, { severed: true })],
  ['barroth L0 M3 surface / sunk', W('em044_00', 0, 3, null, {}), W('em044_00', 0, 3, null, { sunk: true })],
];
for (const r of rows) console.log(r.join('  |  '));
const drawn = new Map([[2, false]]);
console.log('mud head gone', ms.shellMudInput('em044_00', drawn), ' rest', ms.shellMudInput('em044_00', new Map()));
