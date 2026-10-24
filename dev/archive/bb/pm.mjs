import { pslMask, clipActionFor, clipPostureFor } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const h = x => x == null ? x : '0x' + x.toString(16);
const T = [
 ['L9M11 (7,5a)', 9, 11, [7,0x5a], {}, 0x381ff],
 ['L9M11 (7,b5)', 9, 11, [7,0xb5], {}, 0x300381c0],
 ['L9M11 (7,b6)', 9, 11, [7,0xb6], {}, 0x300381c0],
 ['L9M11 (7,b7)', 9, 11, [7,0xb7], {}, 0xc00381c0],
 ['L9M11 (7,b8)', 9, 11, [7,0xb8], {}, 0xc00381c0],
 ['L9M10 intact', 9, 10, null, {}, 0x381ff],
 ['L9M10 severed', 9, 10, null, {severed:true}, 0x1c01ff],
 ['L9M16 calm', 9, 16, null, {}, 0x381ff],
 ['L9M16 enraged', 9, 16, null, {rage:true}, 0x38e3f],
 ['L9M16 tired', 9, 16, null, {tired:true}, 0x3f03f],
 ['L2M15 (7,b4)', 2, 15, [7,0xb4], {}, 0x80381c0],
 ['L2M22 (7,67)', 2, 22, [7,0x67], {}, 0x2381ff],
 ['L0M7 p0', 0, 7, null, {posture:0}, 0x70381ff],
 ['L0M7 p1', 0, 7, null, {posture:1}, 0x381ff],
 ['L3M20 (10,72)', 3, 20, [10,0x72], {}, 0x4381ff],
 ['L3M20 (11,0)', 3, 20, [11,0], {}, 0x8381ff],
];
let bad = 0;
for (const [n, l, s, a, st, want] of T){ const got = pslMask('em007_04', l, s, a, st); if (got !== want) bad++; console.log(n.padEnd(16), h(got), got === want ? 'ok' : 'WANT ' + h(want)); }
console.log('mismatch', bad);
for (let i = 0; i < 4; i++) console.log('L0M7 play', i, clipActionFor('em007_04', 0, 'Motion[7]', i), clipPostureFor('em007_04', 0, 'Motion[7]', i));
console.log('em004', h(pslMask('em004_00', 2, 3, [7, 0x0a], {})), 'em084', h(pslMask('em084_00', 3, 63, null, {})));
