const m = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js');
const h = x => '0x' + x.toString(16);
const W = (id, l, s, a, st) => h(m.pslMask(id, l, s, a, st));
// the spec's emulated table (dev/em063_00-effects-spec.md 1)
const cases = [
  ['L2 M5 rows 0/0 (both empty)', W('em063_00', 2, 5, [7, 0], { armEmpty: [true, true] }), '0x187801ff'],
  ['L2 M5 rows 2/2', W('em063_00', 2, 5, [7, 0], { armEmpty: [false, false] }), '0x180001ff'],
  ['L2 M5 rowL 3 / rowR 4', W('em063_00', 2, 5, [7, 0], { armEmpty: [true, false] }), '0x186001ff'],
  ['L2 M5 rows 0/0 Raging', W('em063_05', 2, 5, [7, 0], { armEmpty: [true, true] }), '0x180001ff'],
  ['L2 M5 severed', W('em063_00', 2, 5, null, { severed: true }), '0x1ff'],
  ['Raging severed enraged', W('em063_05', 2, 5, null, { severed: true, rage: true }), '0xe3f'],
  ['L2 M5 tired', W('em063_00', 2, 5, null, { tired: true }), '0x1800703f'],
  ['L2 M42 (7,0xa6)', W('em063_00', 2, 42, [7, 0xa6], {}), '0x180601ff'],
  ['L2 M42 (7,0xa5)', W('em063_00', 2, 42, [7, 0xa5], {}), '0x180001ff'],
  ['L2 M41 (7,9) Raging enraged', W('em063_05', 2, 41, [7, 9], { rage: true }), '0x18060e3f'],
  ['L0 M10 surface', W('em063_00', 0, 10, null, {}), '0x180181ff'],
  ['L0 M10 sunk', W('em063_05', 0, 10, null, { sunk: true }), '0x180001ff'],
];
let bad = 0;
for (const [n, got, want] of cases){ const ok = got === want; if (!ok) bad++; console.log(ok ? 'ok  ' : 'BAD ', n, got, want); }
console.log(m.clipActionFor('em063_05', 2, 'Motion[42]', 4), bad ? bad + ' BAD' : 'all match');
