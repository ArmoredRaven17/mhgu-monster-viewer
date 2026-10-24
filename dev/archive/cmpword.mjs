// psl-mask.js against the spec's emulated words (dev/em037_00-effects-spec.md 1, dev/em038_00-effects-spec.md 1)
import { pslMask } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const h = x => '0x' + (x >>> 0).toString(16);
const cases = [
  ['em037_00', 2, 5, {}, 0x1ff], ['em037_00', 2, 21, { rage: true, severed: true }, 0xe3f], ['em037_00', 3, 4, { tired: true }, 0x703f],
  ['em037_00', 0, 38, {}, 0x1ff], ['em037_04', 9, 6, {}, 0x1ff], ['em037_04', 9, 6, { rage: true, severed: true }, 0xe3f],
  ['em037_04', 9, 8, { tired: true }, 0x703f],
  ['em038_00', 2, 3, {}, 0x381ff], ['em038_00', 2, 3, { severed: true }, 0x1c01ff], ['em038_00', 2, 3, { rage: true, severed: true }, 0x1c0e3f],
  ['em038_00', 2, 3, { tired: true }, 0x3f03f], ['em038_00', 0, 2, {}, 0xe001ff], ['em038_00', 0, 2, { sunk: true }, 0x1ff],
  ['em038_00', 0, 2, { rage: true }, 0xe00e3f], ['em038_00', 2, 12, {}, 0x1ff], ['em038_00', 2, 12, { rage: true, severed: true }, 0xe3f],
  ['em038_00', 2, 5, { rage: true }, 0xe3f], ['em038_00', 2, 34, { tired: true }, 0x703f], ['em038_00', 3, 25, {}, 0x1ff],
];
let bad = 0;
for (const [m, l, s, st, want] of cases){
  const got = pslMask(m, l, s, null, st);
  if (got !== want){ bad++; console.log('MISMATCH', m, l, s, JSON.stringify(st), h(got), 'want', h(want)); }
}
console.log(cases.length - bad + ' / ' + cases.length + ' match');
